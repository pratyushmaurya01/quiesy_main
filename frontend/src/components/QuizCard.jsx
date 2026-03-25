  // ─────────────────────────────────────────────────────────────
  // In your PARENT component (where you map quizzes), use:
  //
  //   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
  //     {quizzes.map(quiz => <QuizCard key={quiz.id} quiz={quiz} />)}
  //   </div>
  //
  // ─────────────────────────────────────────────────────────────

  import { Link } from "react-router-dom"
  import { useState } from "react"
  import API from "../api/api"

  export default function QuizCard({ quiz }) {
    const [reviewOn, setReviewOn] = useState(quiz.review_on)
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleToggleReview = async () => {
      setLoading(true)
      try {
        const res = await API.post(`quiz/${quiz.id}/toggle-review/`, { review_on: !reviewOn })
        setReviewOn(res.data.review_on)
      } catch (err) {
        console.error("Toggle error:", err)
      } finally {
        setLoading(false)
      }
    }

    const handleCopyLink = () => {
      const link = `${window.location.origin}/quiz/${quiz.quiz_code}/start`
      navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }

    return (
      <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 h-full w-full">

        {/* Top accent */}
        <div className={`h-1.5 w-full transition-all duration-500 ${reviewOn ? "bg-gradient-to-r from-green-400 to-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`} />

        <div className="flex flex-col flex-1 p-6 gap-4">

          {/* Title — capped so very long titles don't break layout */}
          <h3
            className="text-lg font-extrabold text-slate-800 dark:text-white leading-snug tracking-tight line-clamp-2 min-h-[3.25rem]"
            title={quiz.title}
          >
            {quiz.title}
          </h3>

          {/* Info rows */}
          <div className="rounded-xl border border-slate-100 dark:border-slate-700/50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/50">

            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Subject</span>
              {/* truncate so a very long subject name doesn't overflow */}
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400 truncate max-w-[55%] text-right">
                {quiz.subject || "—"}
              </span>
            </div>

            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Questions</span>
              <span className="text-sm font-bold text-slate-800 dark:text-white">
                {quiz.num_of_qus ?? "0"}
              </span>
            </div>

            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Password</span>
              {quiz.password ? (
                <span className="flex items-center gap-1.5 text-sm font-bold text-amber-600 dark:text-amber-400 truncate max-w-[55%]">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="truncate">{quiz.password}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm font-bold text-green-600 dark:text-green-400">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  Open
                </span>
              )}
            </div>

          </div>

          {/* Spacer so buttons always sit at the same position */}
          <div className="flex-1" />

          {/* View Results */}
          <Link
            to={`/quiz/${quiz.id}/results`}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-bold rounded-xl transition-all duration-150 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Results
          </Link>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className={`w-full flex items-center justify-center gap-2 py-2.5 border text-sm font-bold rounded-xl transition-all duration-200 active:scale-[0.98] ${
              copied
                ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-600 dark:text-green-400"
                : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Copy Quiz Link
              </>
            )}
          </button>

          {/* Edit + Add Questions */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              to={`/edit-quiz/${quiz.id}`}
              className="flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-semibold rounded-xl transition-colors border border-slate-200 dark:border-slate-700/60"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Link>
            <Link
              to={`/add-questions/${quiz.id}`}
              className="flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-semibold rounded-xl transition-colors border border-slate-200 dark:border-slate-700/60"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Qns
            </Link>
          </div>

          {/* Student Review Toggle */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Student Review</p>
              <p className={`text-xs font-medium mt-0.5 truncate ${reviewOn ? "text-green-500" : "text-slate-400 dark:text-slate-500"}`}>
                {reviewOn ? "Answers visible to students" : "Currently disabled"}
              </p>
            </div>

            <button
              onClick={handleToggleReview}
              disabled={loading}
              aria-label="Toggle student review"
              style={{ width: "48px", minWidth: "48px" }}
              className={`relative inline-flex h-6 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                loading ? "opacity-50 cursor-wait" : "cursor-pointer"
              } ${reviewOn ? "bg-green-500" : "bg-slate-200 dark:bg-slate-700"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ${reviewOn ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

        </div>
      </div>
    )
  }