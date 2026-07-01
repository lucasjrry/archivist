'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { updateProfile } from './actions'

export default function SetupForm() {
  // This state variable watches what the user types
  const [fullName, setFullName] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <form action={updateProfile} className="flex flex-col gap-4">
      {/* PROFILE PICTURE */}
      <div>
        <label className="block text-sm font-medium text-gray-750">Profile Picture (Optional)</label>
        <div className="mt-2 flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded flex-shrink-0 relative overflow-hidden flex items-center justify-center text-xs text-gray-400">
            {avatarPreview ? (
              <Image 
                src={avatarPreview} 
                alt="Profile Preview" 
                fill 
                className="object-cover" 
              />
            ) : (
              "No Photo"
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 border border-gray-300 text-xs rounded hover:bg-gray-50 hover:text-black transition-colors text-gray-700 font-medium cursor-pointer"
          >
            Choose Picture
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <input type="hidden" name="avatarBase64" value={avatarPreview} />
        </div>
      </div>

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
          value={fullName} // Link the input to our state
          onChange={(e) => setFullName(e.target.value)} // Update state on every keystroke
          className="mt-1 block w-full border border-gray-300 rounded p-2"
        />
      </div>

      {/* CONDITIONAL PRIVACY TOGGLE */}
      {/* Only render this div if fullName has at least 1 character */}
      {fullName.trim().length > 0 && (
        <div className="flex items-center gap-2 mt-2 p-3 bg-gray-50 rounded border border-gray-200 transition-all">
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
      )}

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

      <button className="bg-black text-white p-2 rounded hover:bg-gray-800 mt-4 transition-colors">
        Complete Setup
      </button>
    </form>
  )
}