import QuizCard from "../components/QuizCard"
import Navbar from "../components/navbar"
import { Link } from "react-router-dom"

export default function TeacherDashboard() {

  const quizzes = [
    {id:1,title:"Python Basics",subject:"Python",questions:10},
    {id:2,title:"DSA Quiz",subject:"Data Structures",questions:8},
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      <Navbar/>

      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* header */}
        <div className="flex justify-between items-center mb-10">

            <h2 className="text-3xl font-bold">
                Your Quizzes
            </h2>

            <Link
                to="/create-quiz"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
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
  )
}