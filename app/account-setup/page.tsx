import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SetupForm from './SetupForm' // Import the new client component

export default async function AccountSetup() {
  const supabase = await createClient()

  // 1. Secure Server-Side Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-2">Welcome to Archivist</h1>
        <p className="text-gray-500 mb-6">Set set up your profile.</p>
        
        {/* 2. Render the interactive client form */}
        <SetupForm />
      </div>
    </div>
  )
}