'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { uploadToSupabase } from '@/app/actions'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  // 1. Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  // 2. Extract Data
  const username = formData.get('username') as string
  const fullName = formData.get('fullName') as string
  const showFullName = formData.get('showFullName') === 'on'
  const bio = formData.get('bio') as string
  const avatarBase64 = formData.get('avatarBase64') as string

  let avatarUrl = null
  if (avatarBase64) {
    try {
      avatarUrl = await uploadToSupabase(avatarBase64, true)
    } catch (uploadError) {
      console.error("Avatar upload failed during setup:", uploadError)
    }
  }

  // 3. Update the 'profiles' table
  const updateData: Record<string, any> = {
    username, 
    full_name: fullName, 
    show_full_name: showFullName,
    bio,
    updated_at: new Date().toISOString(),
  }

  if (avatarUrl) {
    updateData.avatar_url = avatarUrl
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id) // IMPORTANT: Only update YOUR row

  if (error) {
    console.error(error)
    return redirect('/error?message=Could not update profile')
  }

  // 4. Success! Go to dashboard
  revalidatePath('/', 'layout')
  redirect('/')
}