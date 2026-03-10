"use server";
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Utility to move images from external sites or local uploads into your private Supabase bucket.
 */
async function uploadToSupabase(source: string, isManual: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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

  // THIS IS THE LINE THAT IS LIKELY FAILING
  const { data, error } = await supabase.storage
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
  } catch (e) { return null; }
}

export async function saveItem(formData: { 
  model: string; 
  brand: string; 
  category: string; 
  color: string; 
  image_url: string; 
  isManualImage: boolean;
}) {
  const supabase = await createClient();
  
  // 1. Get user once and validate
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  try {
    // STEP 1: Process the image
    const finalImageUrl = await uploadToSupabase(formData.image_url, formData.isManualImage);

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    

    // STEP 2: Save to Database
    const { error: dbError } = await supabase.from('closet_items').insert([{
      model: formData.model,
      brand: formData.brand,
      category: formData.category,
      color: formData.color,
      image_url: finalImageUrl,
      user_id: user.id, // TS now knows user is not null here
    }]);

    if (dbError) throw dbError

    revalidatePath('/closet')
    return { success: true }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
    console.error("Save failed:", errorMessage)
    return { success: false, error: errorMessage }
  }
}