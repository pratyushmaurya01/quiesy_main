import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar" // Adjust path if needed
import Login from "./Login" // Adjust path to where your Login.jsx is

export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const navigate = useNavigate()

  // This fires when Login.jsx successfully gets a token
  const handleLoginSuccess = () => {
    setShowLoginModal(false)
    navigate("/dashboard")
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans transition-colors duration-200">

      <Navbar />

      <section className="flex flex-col items-center justify-center text-center px-4 sm:px-6 py-20 sm:py-32">

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-500">
          QUIESY
        </h1>

        <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          A modern platform for creating and taking quizzes with ease. 
          Fast, secure, and designed for real learning.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">

          {/* This button triggers the modal instead of navigating */}
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer font-semibold shadow-lg shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5"
          >
            Login as Teacher
          </button>

          <button
            className="px-8 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold transition-all duration-200 hover:-translate-y-0.5"
          >
            Explore Quizzes
          </button>

        </div>

      </section>

      {/* Render Login Modal conditionally over the Home page */}
      {showLoginModal && (
        <Login 
          onSuccess={handleLoginSuccess} 
          onClose={() => setShowLoginModal(false)} 
        />
      )}

    </div>
  )
}