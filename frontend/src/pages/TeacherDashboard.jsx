import { useEffect, useState } from "react"
import QuizCard from "../components/QuizCard"
import Navbar from "../components/navbar"
import { Link } from "react-router-dom"

export default function TeacherDashboard() {

  const [quizzes, setQuizzes] = useState([])

  useEffect(() => {

    const fetchQuizzes = async () => {

      const token = localStorage.getItem("access")

      const res = await fetch("http://127.0.0.1:8000/api/teacher-quizzes/", {
        headers:{
          Authorization:`Bearer ${token}`
        }
      })

      const data = await res.json()

      console.log("QUIZZES:",data)

      setQuizzes(data)
    }

    fetchQuizzes()

  },[])

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