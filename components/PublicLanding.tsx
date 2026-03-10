import Link from 'next/link'

export default function PublicLanding() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <div className="max-w-3xl text-center">
        {/* The Branding */}
        <h1 className="text-6xl font-bold tracking-tighter text-black mb-4">
          Archivist
        </h1>
        
        {/* The MVP Value Prop */}
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          A digital archive for your wardrobe. 
          Catalog your pieces, track your rotation, and curate your personal style.
        </p>

        {/* The Call to Action */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/login" 
            className="px-8 py-4 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-all text-lg"
          >
            Start Archiving
          </Link>
          
          <button className="px-8 py-4 border border-gray-200 rounded-full font-medium hover:bg-gray-50 transition-all text-lg">
            View Example
          </button>
        </div>
      </div>

      {/* Footer Decoration */}
      <footer className="absolute bottom-8 text-gray-400 text-sm uppercase tracking-widest">
        EST. 2026 — LOS ANGELES
      </footer>
    </main>
  )
}