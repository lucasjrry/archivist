'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { updateProfileSettings } from './actions'

interface ProfileFormProps {
  initialFullName: string
  initialUsername: string
  initialAvatarUrl: string
}

export default function ProfileForm({ initialFullName, initialUsername, initialAvatarUrl }: ProfileFormProps) {
  const [fullName, setFullName] = useState(initialFullName)
  const [avatarPreview, setAvatarPreview] = useState<string>(initialAvatarUrl)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError('')

    const formData = new FormData(e.currentTarget)
    try {
      const res = await updateProfileSettings(formData)
      if (res && res.error) {
        setError(res.error)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-md text-black">
      {/* PROFILE PICTURE */}
      <div>
        <label className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-3">Profile Picture</label>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-neutral-50 border border-neutral-205 rounded-md flex-shrink-0 relative overflow-hidden flex items-center justify-center text-xs text-neutral-400 shadow-2xs">
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
            className="px-4 py-2 border border-neutral-350 hover:border-black hover:text-black text-xs font-semibold uppercase tracking-widest rounded transition-all text-neutral-700 cursor-pointer"
          >
            Change Photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <input type="hidden" name="avatarBase64" value={avatarPreview.startsWith('data:') ? avatarPreview : ''} />
        </div>
      </div>

      {/* USERNAME (READ-ONLY) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">Username</label>
        <input 
          type="text" 
          value={initialUsername ? `@${initialUsername}` : ''}
          disabled
          className="w-full border-b border-gray-250 py-2 text-sm outline-none font-sans text-neutral-400 bg-transparent select-none cursor-not-allowed"
        />
        <p className="text-[10px] text-gray-405 italic">Username cannot be changed.</p>
      </div>

      {/* FULL NAME */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">Full Name</label>
        <input 
          id="fullName"
          name="fullName" 
          type="text" 
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your name"
          required
          className="w-full border-b border-gray-200 py-2.5 text-sm outline-none font-sans focus:border-black transition-colors bg-transparent placeholder-gray-300"
        />
      </div>

      {error && (
        <div className="bg-rose-50/70 border border-rose-100 text-rose-800 text-xs px-4 py-3 rounded-lg leading-relaxed">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50/70 border border-emerald-100 text-emerald-800 text-xs px-4 py-3 rounded-lg leading-relaxed font-semibold">
          Profile updated successfully!
        </div>
      )}

      <button 
        type="submit" 
        disabled={loading} 
        className="w-full bg-black text-white py-4.5 text-[10px] font-bold uppercase tracking-[0.3em] cursor-pointer hover:bg-neutral-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? "Saving..." : "Save Profile"}
      </button>
    </form>
  )
}
