import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { updateProfile } from './actions'

export default async function AccountSetup() {
  const supabase = await createClient()

  // 1. Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-2">Welcome to Archivist</h1>
        <p className="text-gray-500 mb-6">Let's set up your profile.</p>
        
        <form action={updateProfile} className="flex flex-col gap-4">
          
          {/* USERNAME */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input 
              name="username" 
              type="text" 
              required 
              placeholder="user123"
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
            <p className="text-xs text-gray-500 mt-1">This will be your unique handle.</p>
          </div>

          {/* FULL NAME */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name (Optional)</label>
            <input 
              name="fullName" 
              type="text" 
              placeholder="John Doe"
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>

          {/* PRIVACY TOGGLE */}
            <div className="flex items-center gap-2 mt-2">
            <input 
                type="checkbox" 
                name="showFullName" 
                id="showFullName" 
                className="rounded border-gray-300 text-black focus:ring-black"
            />
            <label htmlFor="showFullName" className="text-sm text-gray-600">
                Show full name on public profile?
            </label>
            </div>

          {/* BIO */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea 
              name="bio" 
              rows={3}
              placeholder="Collecting minimal menswear..."
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>

          <button className="bg-black text-white p-2 rounded hover:bg-gray-800 mt-4">
            Complete Setup
          </button>
        </form>
      </div>
    </div>
  )
}