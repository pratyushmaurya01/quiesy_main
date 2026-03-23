import { Link } from "react-router-dom"
import ThemeToggle from "./ThemeToggle" // 🔥 Import your new component

export default function Navbar() {
  const token = localStorage.getItem("access")

  const handleLogout = () => {
    localStorage.removeItem("access")
    localStorage.removeItem("refresh")
    window.location.href = "/"
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8 h-16">

        {/* Left Side: Logo */}
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight cursor-pointer">
            Quiesy
          </Link>
        </div>

        {/* Right Side: Actions Group */}
        <div className="flex items-center gap-2 sm:gap-4">

          {/* 🔥 Drop it right here! */}
          <ThemeToggle />

          {/* Logout Button */}
          {token && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              Log out
            </button>
          )}

        </div>
      </div>
    </nav>
  )
}