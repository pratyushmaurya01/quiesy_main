import { useEffect, useState } from "react"
import QuizCard from "../components/QuizCard"
import Navbar from "../components/navbar"
import { Link } from "react-router-dom"
import API from "../api/api"

export default function TeacherDashboard() {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true)
      setError("")

      try {
        const res = await API.get("teacher-quizzes/")
        setQuizzes(res.data)
      } catch (err) {
        console.error(err)
        setError("Failed to fetch quizzes. Please check your connection.")
      } finally {
        setLoading(false)
      }
    }

    fetchQuizzes()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
      
      <Navbar/>

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-12">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Your Workspace</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your assessments and track student progress.</p>
          </div>
          
          <Link
            to="/create-quiz"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Create New Quiz
          </Link>
        </div>

        {/* --- STATE HANDLING --- */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="flex space-x-2.5 mb-4">
              <div className="w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '-0.3s' }}></div>
              <div className="w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '-0.15s' }}></div>
              <div className="w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce shadow-sm"></div>
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
              Loading your workspace...
            </span>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center max-w-lg mx-auto mt-10">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Oops! Something went wrong</h3>
            <p className="text-red-600 dark:text-red-300/80 text-sm mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-400 font-semibold rounded-lg hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors">
              Try Again
            </button>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl min-h-[400px] p-8">
            <div className="w-20 h-20 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">No quizzes found</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
              You haven't created any assessments yet. Get started by creating your first quiz!
            </p>
            <Link to="/create-quiz" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md">
              Create First Quiz
            </Link>
          </div>
        ) : (
          /* 🔥 THE FIX: Strictly 3 Columns on Large Screens */
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {quizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz}/>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}