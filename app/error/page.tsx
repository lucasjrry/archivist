'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

// 1. Create a helper component to handle the dynamic logic
function ErrorMessage() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message') || "Something went wrong."
  return <p className="text-red-500">{message}</p>
}

// 2. The Main Page wraps that helper in Suspense
export default function ErrorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Error</h1>
      
      {/* This tells Next.js: "Render this part on the client side only" */}
      <Suspense fallback={<p>Loading...</p>}>
        <ErrorMessage />
      </Suspense>

      <a href="/login" className="underline hover:text-gray-500">Go back to Login</a>
    </div>
  )
}