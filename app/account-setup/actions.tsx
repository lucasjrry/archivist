'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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

  // 3. Update the 'profiles' table
  const { error } = await supabase
    .from('profiles')
    .update({ 
      username, 
      full_name: fullName, 
      show_full_name: showFullName,
      bio,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id) // IMPORTANT: Only update YOUR row

  if (error) {
    console.error(error)
    return redirect('/error?message=Could not update profile')
  }

  // 4. Success! Go to dashboard
  revalidatePath('/', 'layout')
  redirect('/')
}