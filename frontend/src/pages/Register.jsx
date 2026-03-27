import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import API from "../api/api"

export default function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // API call using Axios
      const res = await API.post("register/", form)
      
      // Axios success usually returns status 200 or 201
      if (res.status === 200 || res.status === 201) {
        alert("Registration Successful! Please log in.")
        // Immediately redirect to home/login
        navigate("/login") 
      }
    } catch (err) {
      console.error(err)
      // Display error from backend if available
      setError(err.response?.data?.error || err.response?.data?.detail || "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-200">
      
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-none">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-indigo-800/50">
            <svg className="w-7 h-7 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Create an Account
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
            Join Quiesy and start building amazing assessments.
          </p>
        </div>

        {/* Error Message Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm p-3.5 rounded-xl text-center font-bold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Full Name</label>
            <input
              required
              name="name"
              placeholder="e.g., John Doe"
              onChange={handleChange}
              className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Email Address</label>
            <input
              required
              type="email"
              name="email"
              placeholder="name@school.edu"
              onChange={handleChange}
              className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Password</label>
            <input
              required
              type="password"
              name="password"
              placeholder="••••••••"
              onChange={handleChange}
              className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait mt-6 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Account...
              </>
            ) : (
              "Register as Teacher"
            )}
          </button>

        </form>

        {/* Footer Link */}
        <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 mt-8">
          Already have an account?{" "}
          <Link to="/" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline underline-offset-4 cursor-pointer">
            Sign In here
          </Link>
        </p>

      </div>
    </div>
  )
}