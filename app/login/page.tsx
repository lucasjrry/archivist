"use client";
import { useState } from 'react';
import { login, signup } from './actions';

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      if (mode === 'signin') {
        const res = await login(formData);
        if (res && res.error) {
          setError(res.error);
        }
      } else {
        const res = await signup(formData);
        if (res && res.error) {
          setError(res.error);
        } else if (res && res.success) {
          setSuccess(res.message || "Registration successful.");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4">
      <div className="bg-white border border-gray-100 p-10 rounded-xl shadow-xs w-full max-w-md text-black">
        
        {/* Title branding matching PrivateDashboard header style */}
        <div className="text-center mb-8">
          <h1 className="brand-logo text-3xl text-black">
            Archivist
          </h1>
          <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest font-medium">
            Menswear Collection Index
          </p>
        </div>

        {/* Dynamic Tab Switcher */}
        <div className="flex border-b border-gray-100 mb-8">
          <button 
            type="button"
            onClick={() => { setMode('signin'); setError(""); setSuccess(""); }}
            className={`flex-1 pb-3.5 text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer ${
              mode === 'signin' 
                ? 'border-b border-black text-black' 
                : 'text-gray-300 hover:text-gray-500'
            }`}
          >
            Sign In
          </button>
          <button 
            type="button"
            onClick={() => { setMode('signup'); setError(""); setSuccess(""); }}
            className={`flex-1 pb-3.5 text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer ${
              mode === 'signup' 
                ? 'border-b border-black text-black' 
                : 'text-gray-300 hover:text-gray-500'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="bg-rose-50/70 border border-rose-100 text-rose-800 text-xs px-4 py-3 rounded-lg mb-6 leading-relaxed">
            <span className="font-medium block">{error}</span>
            {error.toLowerCase().includes("credentials") && mode === 'signin' && (
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(""); }}
                className="mt-1.5 text-[9px] uppercase tracking-wider font-bold text-rose-600 hover:underline block cursor-pointer"
              >
                No account? Switch to Register →
              </button>
            )}
          </div>
        )}

        {/* Success Alert Box */}
        {success && (
          <div className="bg-emerald-50/70 border border-emerald-100 text-emerald-800 text-xs px-4 py-3 rounded-lg mb-6 leading-relaxed font-medium font-sans">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[9px] uppercase tracking-wider font-bold text-gray-400">Email Address</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              placeholder="name@domain.com"
              className="w-full border-b border-gray-200 py-2.5 text-sm outline-none font-sans focus:border-black transition-colors bg-transparent placeholder-gray-300"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[9px] uppercase tracking-wider font-bold text-gray-400">Password</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              placeholder="••••••••"
              className="w-full border-b border-gray-200 py-2.5 text-sm outline-none font-sans focus:border-black transition-colors bg-transparent placeholder-gray-300"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-black text-white py-4.5 text-[10px] font-bold uppercase tracking-[0.3em] mt-8 cursor-pointer hover:bg-neutral-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading 
              ? (mode === 'signin' ? "Signing In..." : "Creating Account...") 
              : (mode === 'signin' ? "Confirm Sign In" : "Confirm Register")
            }
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-[10px] text-gray-400 italic">
            {mode === 'signin' 
              ? "Access your curated menswear archive."
              : "Private development. Registration requires allowlist approval."
            }
          </p>
        </div>

      </div>
    </div>
  );
}