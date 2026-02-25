'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // 1. Extract the data from the HTML form
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // 2. Ask Supabase to sign the user in
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Ideally, we'd send this error back to the UI, 
    // but for MVP we will just redirect to an error page
    redirect('/error')
  }

  // 3. If successful, refresh the layout and go to home
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // 1. Create the user in auth.users
  // (This triggers the SQL function to create the Profile automatically)
  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    redirect(`/error?message=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/account-setup')
}