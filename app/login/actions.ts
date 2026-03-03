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
  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Ideally, we'd send this error back to the UI, 
    // but for MVP we will just redirect to an error page
    redirect(`/error?message=${encodeURIComponent(error.message)}`)
  }

  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', data.user.id)
      .single()

    // If profile is missing OR username is empty -> Send to Setup
    if (!profile || !profile.username) {
      revalidatePath('/', 'layout')
      redirect('/account-setup')
    }
  }

  
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // 1. Create the user in auth.users
  // (This triggers the SQL function to create the Profile automatically)

  const allowedEmailsString = process.env.ALLOWED_EMAILS || ""
  const allowedEmails = allowedEmailsString.split(',')

  // 2. Check the allowlist
  if (!allowedEmails.includes(email)) {
    redirect('/error?message=Archivist is currently in private development.')
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    redirect(`/error?message=${encodeURIComponent(error.message)}`)
  }

  if (data.user && data.session === null) {
    // For now, we'll just send them to the error page with a success message
    // Later, you could build a dedicated '/verify-email' page
    redirect('/error?message=Check your email to verify your account before logging in.')
  }

  revalidatePath('/', 'layout')
  redirect('/account-setup')
}