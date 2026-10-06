import { Link, useNavigate } from "react-router-dom"
import ThemeToggle from "./ThemeToggle"
import { useAuth } from "../context/AuthContext"

export default function Navbar({ onSignInClick }) {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-transparent transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8 h-16">
        {/* Left Side: Logo */}
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight cursor-pointer">
            Quiesy
          </Link>
        </div>

        {/* Right Side: Actions Group */}
        <div className="flex items-center gap-3 sm:gap-4">
          <ThemeToggle />

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm">
                  {user?.name ? user.name.charAt(0) : "U"}
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {user?.name || "User"}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50 btn-tactile cursor-pointer"
              >
                Log out
              </button>
            </div>
          ) : (
            <button
              onClick={onSignInClick}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 btn-tactile cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}