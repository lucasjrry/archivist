"use server";
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Utility to move images from external sites or local uploads into your private Supabase bucket.
 */
async function uploadToSupabase(source: string, isManual: boolean) {
  const supabase = await createClient();

  const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
  const bucket = 'closet';

  let fileBody: Buffer | Blob;

  if (isManual) {
    const base64Data = source.split(',')[1];
    fileBody = Buffer.from(base64Data, 'base64');
  } else {
    const res = await fetch(source);
    if (!res.ok) throw new Error("Failed to fetch remote image");
    fileBody = await res.blob();
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, fileBody, {
      contentType: 'image/jpeg',
      upsert: true
    });

  if (error) {
    console.error("STORAGE UPLOAD ERROR DETAILS:", error); // CHECK THIS IN TERMINAL
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filename);
  return publicUrl;
}

export async function scrapeProductMetadata(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      }
    });
    const html = await response.text();

    const getMeta = (prop: string) => {
      const match = html.match(new RegExp(`<meta[^>]*property=["']${prop}["'][^>]*content=["']([^"']*)["']`, 'i'))
                 || html.match(new RegExp(`<meta[^>]*name=["']${prop}["'][^>]*content=["']([^"']*)["']`, 'i'));
      return match ? match[1] : null;
    };

    const imgRegex = /https?:\/\/[^"'>]+\.(?:jpg|jpeg|png|webp)/g;
    const allFound = html.match(imgRegex) || [];
    const uniqueImages = Array.from(new Set(allFound)).filter(img => 
      (img.includes('product') || img.includes('image') || img.includes('assets')) && !img.includes('icon')
    ) as string[];

    return {
      model: getMeta('og:title') || "",
      brand: getMeta('og:site_name') || getMeta('og:brand') || "",
      images: uniqueImages.slice(0, 15),
    };
  } catch { return null; }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')     // Remove non-word chars except spaces and dashes
    .replace(/[\s_-]+/g, '-')     // Replace spaces and underscores with a single dash
    .replace(/^-+|-+$/g, '');     // Trim dashes from start/end
}

export async function getBrandSuggestions(query: string) {
  if (!query || query.trim().length < 2) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('brands')
    .select('id, name')
    .ilike('name', `%${query}%`)
    .limit(8);
  
  if (error) {
    console.error("Failed to fetch brand suggestions:", error);
    return [];
  }
  return data || [];
}

export async function getItemSuggestions(brandId: string, query: string) {
  if (!brandId || !query || query.trim().length < 2) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('canonical_items')
    .select('id, name, category')
    .eq('brand_id', brandId)
    .ilike('name', `%${query}%`)
    .limit(8);

  if (error) {
    console.error("Failed to fetch item suggestions:", error);
    return [];
  }
  return data || [];
}

export async function saveItem(formData: { 
  model: string; 
  brand: string; 
  category: string; 
  color: string; 
  image_url: string; 
  isManualImage: boolean;
  brandId?: string | null;
  canonicalItemId?: string | null;
}) {
  const supabase = await createClient();
  
  // 1. Get user once and validate
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const brandName = formData.brand.trim();
    const modelName = formData.model.trim();

    if (!brandName || !modelName) {
      throw new Error("Brand and Model Name are required.");
    }

    // STEP 1: Process the image
    const finalImageUrl = await uploadToSupabase(formData.image_url, formData.isManualImage);

    // STEP 2: Resolve or upsert the Brand
    let brandId = formData.brandId;
    let resolvedBrandName = brandName;

    if (brandId) {
      const { data: b } = await supabase
        .from('brands')
        .select('id, name')
        .eq('id', brandId)
        .single();
      
      if (b) {
        resolvedBrandName = b.name;
      } else {
        brandId = null;
      }
    }

    if (!brandId) {
      const slug = slugify(brandName);
      const { data: existingBrand } = await supabase
        .from('brands')
        .select('id, name')
        .eq('slug', slug)
        .maybeSingle();

      if (existingBrand) {
        brandId = existingBrand.id;
        resolvedBrandName = existingBrand.name;
      } else {
        const { data: newBrand, error: brandInsertError } = await supabase
          .from('brands')
          .insert([{ name: brandName, slug: slug || `brand-${Date.now()}` }])
          .select('id, name')
          .single();
        if (brandInsertError) throw brandInsertError;
        brandId = newBrand.id;
        resolvedBrandName = newBrand.name;
      }
    }

    // STEP 3: Resolve or upsert the Canonical Item
    let canonicalItemId = formData.canonicalItemId;
    if (canonicalItemId) {
      const { data: cItem } = await supabase
        .from('canonical_items')
        .select('id, name')
        .eq('id', canonicalItemId)
        .eq('brand_id', brandId)
        .single();
      
      if (!cItem) {
        canonicalItemId = null;
      }
    }

    if (!canonicalItemId) {
      const { data: existingItem } = await supabase
        .from('canonical_items')
        .select('id')
        .eq('brand_id', brandId)
        .ilike('name', modelName)
        .limit(1)
        .maybeSingle();

      if (existingItem) {
        canonicalItemId = existingItem.id;
      } else {
        const { data: newItem, error: itemInsertError } = await supabase
          .from('canonical_items')
          .insert([{
            brand_id: brandId,
            name: modelName,
            category: formData.category,
            status: 'pending'
          }])
          .select('id')
          .single();
        if (itemInsertError) throw itemInsertError;
        canonicalItemId = newItem.id;
      }
    }

    // STEP 4: Save to Closet Items
    const { error: dbError } = await supabase.from('closet_items').insert([{
      model: modelName,
      brand: resolvedBrandName,
      category: formData.category,
      color: formData.color,
      image_url: finalImageUrl,
      user_id: user.id,
      canonical_item_id: canonicalItemId,
      is_custom_entry: true,
    }]);

    if (dbError) throw dbError;

    revalidatePath('/closet');
    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
    console.error("Save failed:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function toggleFavorite(itemId: string, isFavorite: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const { error } = await supabase
      .from('closet_items')
      .update({ is_favorite: isFavorite })
      .eq('id', itemId)
      .eq('user_id', user.id);

    if (error) throw error;
    revalidatePath('/closet');
    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
    console.error("Toggle favorite failed:", errorMessage);
    return { success: false, error: errorMessage };
  }
}