import { Link } from "react-router-dom"
import { useState } from "react"
import API from "../api/api"

export default function QuizCard({ quiz }) {

  const [reviewOn, setReviewOn] = useState(quiz.review_on)
  const [loading, setLoading] = useState(false)

  const handleToggleReview = async () => {
    setLoading(true)

    try {
      const res = await API.post(
        `quiz/${quiz.id}/toggle-review/`,
        {
          review_on: !reviewOn
        }
      )

      setReviewOn(res.data.review_on)

    } catch (err) {
      console.error("Toggle error:", err)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="
      flex flex-col
      bg-white dark:bg-slate-900
      border border-slate-200 dark:border-slate-800
      rounded-xl
      p-5
      shadow-sm
      hover:shadow-md
      transition-shadow
      duration-200
    ">
      
      {/* --- Header --- */}
      <div className="mb-6">

        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
          {quiz.title}
        </h3>

        <div className="space-y-2">

          {/* Subject */}
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span>{quiz.subject}</span>
          </div>

          {/* Questions */}
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span>{quiz.num_of_qus} Questions</span>
          </div>

          {/* Copy Link */}
          <button
            onClick={() => {
              const link = `${window.location.origin}/quiz/${quiz.quiz_code}/start`
              navigator.clipboard.writeText(link)
              alert("Link copied!")
            }}
            className="
              w-full
              py-2 px-3
              bg-blue-600 hover:bg-blue-700
              text-white
              text-sm font-medium
              rounded-lg
            "
          >
            Copy Link
          </button>

        </div>
      </div>

      {/* --- Actions --- */}
      <div className="mt-auto space-y-3">
        
        {/* Row buttons */}
        <div className="grid grid-cols-2 gap-2">

          <Link
            to={`/edit-quiz/${quiz.id}`}
            className="
              flex items-center justify-center
              py-2 px-3
              bg-slate-100 dark:bg-slate-800
              rounded-lg text-sm
            "
          >
            Edit
          </Link>

          <Link
            to={`/add-questions/${quiz.id}`}
            className="
              flex items-center justify-center
              py-2 px-3
              bg-slate-100 dark:bg-slate-800
              rounded-lg text-sm
            "
          >
            Add Q's
          </Link>

        </div>

        {/* View Results */}
        <Link
          to={`/quiz/${quiz.id}/results`}
          className="
            w-full
            flex items-center justify-center
            py-2.5
            bg-indigo-600 hover:bg-indigo-700
            text-white
            rounded-lg text-sm
          "
        >
          View Results
        </Link>

        {/* Toggle Review */}
        <button
          onClick={handleToggleReview}
          disabled={loading}
          className={`
            w-full py-2 px-3 rounded-lg text-sm font-medium transition
            ${loading ? "opacity-60 cursor-not-allowed" : ""}
            ${
              reviewOn
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }
          `}
        >
          {loading
            ? "Updating..."
            : reviewOn
            ? "Review ON"
            : "Review OFF"}
        </button>


        <div>
          {quiz.password}
        </div>
       

      </div>

    </div>
  )
}