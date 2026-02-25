'use client'

import { useSearchParams } from 'next/navigation'

export default function ErrorPage() {
  const searchParams = useSearchParams()
  // If we passed a message in the URL, grab it (optional)
  const message = searchParams.get('message') || "Something went wrong."

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Error</h1>
      <p className="text-red-500">{message}</p>
      <a href="/login" className="underline hover:text-gray-500">Go back to Login</a>
    </div>
  )
}