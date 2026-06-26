'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: "Email and password are required." }
  }

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
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

  if (!email || !password) {
    return { error: "Email and password are required." }
  }

  const allowedEmailsString = process.env.ALLOWED_EMAILS || ""
  const allowedEmails = allowedEmailsString.split(',').map(e => e.trim().toLowerCase())

  // Check allowlist if it's set
  if (allowedEmails.length > 0 && allowedEmails[0] !== "" && !allowedEmails.includes(email.trim().toLowerCase())) {
    return { error: "Archivist is currently in private development. Contact the administrator to request access." }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user && data.session === null) {
    return { 
      success: true, 
      message: "Check your email to verify your account before logging in." 
    }
  }

  revalidatePath('/', 'layout')
  redirect('/account-setup')
}

export async function logout() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error("Sign out error:", error.message)
  }
  revalidatePath('/', 'layout')
  redirect('/')
}