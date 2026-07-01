'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { uploadToSupabase } from '@/app/actions'

export async function updateProfileSettings(formData: FormData) {
  const supabase = await createClient()

  // 1. Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated." }
  }

  // 2. Extract Data
  const fullName = formData.get('fullName') as string
  const bio = formData.get('bio') as string
  const avatarBase64 = formData.get('avatarBase64') as string

  if (!fullName || fullName.trim().length === 0) {
    return { error: "Full Name is required." }
  }

  let avatarUrl = null
  if (avatarBase64) {
    try {
      avatarUrl = await uploadToSupabase(avatarBase64, true)
    } catch (uploadError) {
      console.error("Avatar upload failed during settings update:", uploadError)
      return { error: "Failed to upload avatar." }
    }
  }

  // 3. Update the 'profiles' table
  const updateData: Record<string, any> = {
    full_name: fullName,
    bio: bio || '',
    updated_at: new Date().toISOString(),
  }

  if (avatarUrl) {
    updateData.avatar_url = avatarUrl
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)

  if (error) {
    console.error(error)
    return { error: "Could not update profile in the database." }
  }

  // 4. Success! Revalidate paths
  revalidatePath('/profile')
  revalidatePath('/closet')
  revalidatePath('/wishlist')
  revalidatePath('/', 'layout')
  
  return { success: true }
}

export async function updateShowcaseItems(itemIds: string[]) {
  const supabase = await createClient()

  // 1. Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated." }
  }

  const limitedIds = itemIds.slice(0, 4)

  const { error } = await supabase
    .from('profiles')
    .update({
      showcase_item_ids: limitedIds,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error("Failed to update showcase items:", error)
    return { error: "Could not update showcase items in the database." }
  }

  revalidatePath('/profile')
  return { success: true }
}

export async function updateFavoriteBrands(brands: string[]) {
  const supabase = await createClient()

  // 1. Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated." }
  }

  const limitedBrands = brands.slice(0, 4)

  const { error } = await supabase
    .from('profiles')
    .update({
      favorite_brands: limitedBrands,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error("Failed to update favorite brands:", error)
    return { error: "Could not update favorite brands in the database." }
  }

  revalidatePath('/profile')
  return { success: true }
}

