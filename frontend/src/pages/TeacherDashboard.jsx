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
        setError("Failed to fetch quizzes")
      } finally {
        setLoading(false)
      }
    }

    fetchQuizzes()

  }, [])

  // UI handling
  if (loading) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[250px] space-y-5 bg-slate-950 rounded-2xl p-8 transition-colors duration-300">
  <div className="flex space-x-2.5">
    {/* Dot 1 */}
    <div 
      className="w-4 h-4 bg-blue-400 rounded-full animate-bounce shadow-lg shadow-blue-500/20" 
      style={{ animationDelay: '-0.3s' }}
    ></div>
    {/* Dot 2 */}
    <div 
      className="w-4 h-4 bg-blue-400 rounded-full animate-bounce shadow-lg shadow-blue-500/20" 
      style={{ animationDelay: '-0.15s' }}
    ></div>
    {/* Dot 3 */}
    <div 
      className="w-4 h-4 bg-blue-400 rounded-full animate-bounce shadow-lg shadow-blue-500/20"
    ></div>
  </div>
  
  <div className="flex flex-col items-center space-y-1">
    <span className="text-base font-semibold text-slate-200 animate-pulse tracking-wide">
      Preparing your quiz...
    </span>
    <span className="text-xs text-slate-400 opacity-80">
      Please do not close this window
    </span>
  </div>
</div>
  );
}
  if (error) return <p>{error}</p>
 return (
    // 🔥 THE FIX: Added light mode defaults, dark mode prefixes, and a smooth transition
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">

      <Navbar/>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">

        {/* header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">

          <h2 className="text-3xl font-bold tracking-tight">
            Your Quizzes
          </h2>

          <Link
            to="/create-quiz"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition shadow-sm hover:shadow-md"
          >
            Create Quiz
          </Link>

        </div>

        {/* quiz grid */}
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {quizzes.map((quiz)=>(
            <QuizCard key={quiz.id} quiz={quiz}/>
          ))}

        </div>

      </div>

    </div>
  )}