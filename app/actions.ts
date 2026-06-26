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

function extractJsonLd(html: string): any[] {
  const jsonLds: any[] = [];
  const scriptRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const content = match[1].trim()
        .replace(/^\/\*<!\[CDATA\[\*\//, "")
        .replace(/\/\*\]\]>\*\/$/, "")
        .trim();
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        jsonLds.push(...parsed);
      } else {
        jsonLds.push(parsed);
      }
    } catch (e) {
      // Ignore invalid JSON-LD blocks
    }
  }
  return jsonLds;
}

function findProductSchema(data: any): any | null {
  if (!data) return null;
  if (typeof data !== 'object') return null;

  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findProductSchema(item);
      if (found) return found;
    }
    return null;
  }

  if (data["@type"] && String(data["@type"]).toLowerCase() === "product") {
    return data;
  }

  if (data["@graph"] && Array.isArray(data["@graph"])) {
    return findProductSchema(data["@graph"]);
  }

  for (const key of Object.keys(data)) {
    if (data[key] && typeof data[key] === 'object') {
      const found = findProductSchema(data[key]);
      if (found) return found;
    }
  }

  return null;
}

function getImagesFromSchema(imgField: any): string[] {
  if (!imgField) return [];
  if (typeof imgField === 'string') return [imgField];
  if (Array.isArray(imgField)) {
    return imgField.flatMap(getImagesFromSchema);
  }
  if (typeof imgField === 'object') {
    return getImagesFromSchema(imgField.url || imgField.contentUrl || imgField.image);
  }
  return [];
}

function getPriceFromOffers(offers: any): string | null {
  if (!offers) return null;
  if (Array.isArray(offers)) {
    for (const offer of offers) {
      const p = getPriceFromOffers(offer);
      if (p) return p;
    }
    return null;
  }
  if (typeof offers === 'object') {
    if (offers.price !== undefined && offers.price !== null) return String(offers.price);
    if (offers.lowPrice !== undefined && offers.lowPrice !== null) return String(offers.lowPrice);
    if (offers.priceSpecification) {
      return getPriceFromOffers(offers.priceSpecification);
    }
  }
  return null;
}

function parsePrice(priceStr: string | null | undefined): number | null {
  if (!priceStr) return null;
  const cleaned = priceStr.replace(/,/g, '').replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : Math.round(val);
}

function cleanTitle(title: string, brandName?: string, siteName?: string): string {
  let cleaned = title.trim();
  
  // Remove common delimiters and everything after them at the end
  const separators = [/\s+\|\s+.+$/, /\s+-\s+[^-\s]+$/, /\s+\\\s+.+$/];
  for (const sep of separators) {
    cleaned = cleaned.replace(sep, '');
  }

  if (siteName) {
    const escapeSite = siteName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const siteRegex = new RegExp(`\\s*(?:-|\\||\\\\)\\s*${escapeSite}\\s*$`, 'i');
    cleaned = cleaned.replace(siteRegex, '');
  }

  if (brandName) {
    const escapeBrand = brandName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const brandRegex = new RegExp(`^${escapeBrand}\\s*(?:-|\\||\\\\)\\s*`, 'i');
    cleaned = cleaned.replace(brandRegex, '');
  }

  return cleaned.trim();
}

function mapScrapedCategory(categoryStr: string | null | undefined): string {
  if (!categoryStr) return "Tops";
  const lower = categoryStr.toLowerCase();
  
  if (lower.includes("outerwear") || lower.includes("coat") || lower.includes("jacket") || lower.includes("parka") || lower.includes("blazer") || lower.includes("vest") || lower.includes("cardigan") || lower.includes("fleece") || lower.includes("windbreaker")) {
    return "Outerwear";
  }
  if (lower.includes("pants") || lower.includes("jeans") || lower.includes("trousers") || lower.includes("shorts") || lower.includes("bottoms") || lower.includes("denim") || lower.includes("slacks") || lower.includes("sweatpants")) {
    return "Bottoms";
  }
  if (lower.includes("footwear") || lower.includes("shoes") || lower.includes("sneakers") || lower.includes("boots") || lower.includes("loafers") || lower.includes("sandals") || lower.includes("slippers")) {
    return "Footwear";
  }
  if (lower.includes("hat") || lower.includes("cap") || lower.includes("beanie") || lower.includes("headwear") || lower.includes("bucket hat") || lower.includes("visor")) {
    return "Headwear";
  }
  if (lower.includes("bag") || lower.includes("belt") || lower.includes("sunglasses") || lower.includes("accessories") || lower.includes("wallet") || lower.includes("scarf") || lower.includes("gloves") || lower.includes("socks") || lower.includes("jewelry")) {
    return "Accessories";
  }
  if (lower.includes("shirt") || lower.includes("tee") || lower.includes("knitwear") || lower.includes("sweater") || lower.includes("hoodie") || lower.includes("top") || lower.includes("polo") || lower.includes("t-shirt") || lower.includes("jersey")) {
    return "Tops";
  }
  return "Other";
}

export async function scrapeProductMetadata(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      }
    });
    if (!response.ok) return null;
    const html = await response.text();

    const getMeta = (prop: string) => {
      const match = html.match(new RegExp(`<meta[^>]*property=["']${prop}["'][^>]*content=["']([^"']*)["']`, 'i'))
                 || html.match(new RegExp(`<meta[^>]*name=["']${prop}["'][^>]*content=["']([^"']*)["']`, 'i'))
                 || html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${prop}["']`, 'i'))
                 || html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${prop}["']`, 'i'));
      return match ? match[1] : null;
    };

    const getTagContent = (tag: string) => {
      const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i'));
      return match ? match[1].trim() : null;
    };

    const jsonLds = extractJsonLd(html);
    const productSchema = findProductSchema(jsonLds);

    let model = "";
    let brand = "";
    let price: number | null = null;
    let category = "";
    let scrapedImages: string[] = [];

    if (productSchema) {
      model = productSchema.name || "";
      if (productSchema.brand) {
        brand = typeof productSchema.brand === 'object' 
          ? (productSchema.brand.name || "") 
          : String(productSchema.brand);
      }
      const rawPrice = getPriceFromOffers(productSchema.offers);
      price = parsePrice(rawPrice);
      scrapedImages = getImagesFromSchema(productSchema.image);
      if (productSchema.category) {
        category = typeof productSchema.category === 'object'
          ? (productSchema.category.name || "")
          : String(productSchema.category);
      }
    }

    const ogTitle = getMeta('og:title') || getMeta('twitter:title') || getTagContent('title') || "";
    const ogBrand = getMeta('og:brand') || getMeta('brand') || getMeta('og:site_name') || getMeta('twitter:site') || "";
    const ogPrice = getMeta('product:price:amount') || getMeta('og:price:amount') || getMeta('price') || getMeta('twitter:data1');
    const ogCategory = getMeta('product:category') || getMeta('og:category');

    if (!model) model = ogTitle;
    if (!brand) brand = ogBrand;
    if (price === null) price = parsePrice(ogPrice);
    if (!category) category = ogCategory || "";

    brand = brand.replace(/^@/, '').trim();
    if (brand.toLowerCase().endsWith('.com')) {
      brand = brand.slice(0, -4);
    }
    if (brand && brand === brand.toLowerCase()) {
      brand = brand.charAt(0).toUpperCase() + brand.slice(1);
    }

    const siteName = getMeta('og:site_name') || "";
    model = cleanTitle(model, brand, siteName);
    const mappedCategory = mapScrapedCategory(category || model);

    if (scrapedImages.length === 0) {
      const ogImg = getMeta('og:image') || getMeta('og:image:secure_url');
      if (ogImg) scrapedImages.push(ogImg);
      const twitterImg = getMeta('twitter:image');
      if (twitterImg) scrapedImages.push(twitterImg);
      
      const linkImgMatch = html.match(/<link[^>]*rel=["']image_src["'][^>]*href=["']([^"']*)["']/i);
      if (linkImgMatch) scrapedImages.push(linkImgMatch[1]);
    }

    if (scrapedImages.length === 0) {
      const imgRegex = /https?:\/\/[^"'>]+\.(?:jpg|jpeg|png|webp)/g;
      const allFound = html.match(imgRegex) || [];
      const uniqueImages = Array.from(new Set(allFound)).filter(img => 
        (img.includes('product') || img.includes('image') || img.includes('assets')) && !img.includes('icon') && !img.includes('logo')
      ) as string[];
      scrapedImages.push(...uniqueImages);
    }

    const uniqueImages = Array.from(new Set(scrapedImages))
      .filter(img => img && img.startsWith('http') && !img.includes('1x1') && !img.includes('pixel'));

    return {
      model,
      brand,
      price,
      category: mappedCategory,
      images: uniqueImages.slice(0, 15),
    };
  } catch (error) {
    console.error("Scraping error:", error);
    return null;
  }
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
  purchase_price?: number | null;
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
      purchase_price: formData.purchase_price,
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