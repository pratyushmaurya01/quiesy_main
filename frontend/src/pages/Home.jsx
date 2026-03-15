import { Link } from "react-router-dom"
import Navbar from "../components/navbar"
export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      <Navbar/>

      <section className="flex flex-col items-center justify-center text-center px-6 py-20">

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-linear-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          QUIESY
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
          A modern platform for creating and taking quizzes with ease. 
          Fast, secure and designed for real learning.
        </p>

        <div className="flex gap-4 flex-wrap justify-center">

          <Link
            to="/dashboard"
            className="px-8 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition duration-300 font-medium shadow-lg hover:scale-105"
          >
            Login as Teacher
          </Link>

          <button
            className="px-8 py-3 rounded-xl border border-gray-700 hover:border-gray-500 transition duration-300 hover:scale-105"
          >
            Explore Quizzes
          </button>

        </div>

      </section>

    </div>
  )
}