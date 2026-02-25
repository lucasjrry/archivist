import { login, signup } from './actions'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Archivist</h1>
        
        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-3 mt-4">
            {/* The Login Button */}
            <button 
              formAction={login} 
              className="bg-black text-white p-2 rounded hover:bg-gray-800 transition-colors"
            >
              Log in
            </button>
            
            {/* The Sign Up Button */}
            <button 
              formAction={signup} 
              className="border border-gray-300 text-gray-700 p-2 rounded hover:bg-gray-50 transition-colors"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}