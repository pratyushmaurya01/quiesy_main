import { useState, useEffect } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import ThemeToggle from "../components/ThemeToggle"
import API from "../api/api"

export default function StartQuiz() {
  const navigate = useNavigate()
  const { quizCode } = useParams()

  // -------------------------------
  // Quiz Info State (New!)
  // -------------------------------
  const [quizTitle, setQuizTitle] = useState("")
  const [requiresPassword, setRequiresPassword] = useState(false)
  const [infoLoading, setInfoLoading] = useState(true)

  // -------------------------------
  // Start Quiz State
  // -------------------------------
  const [form, setForm] = useState({
    student_name: "",
    email: "",
    roll_number: "",
    password: "" 
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // -------------------------------
  // Review Modal State
  // -------------------------------
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    student_name: "",
    email: "",
    roll_number: ""
  })
  const [reviewError, setReviewError] = useState("")
  const [reviewLoading, setReviewLoading] = useState(false)

  // 🔥 FETCH QUIZ INFO ON LOAD

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await API.get(`quiz-info/${quizCode}/`)
        const data = res.data

        setQuizTitle(data.title)
        setRequiresPassword(data.requires_password)

      } catch (err) {
        console.error(err)
        setError("This quiz link is invalid or has been removed.")
      } finally {
        setInfoLoading(false)
      }
    }

    fetchInfo()
  }, [quizCode])

  // -------------------------------
  // Handlers
  // -------------------------------
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("http://127.0.0.1:8000/api/start-quiz/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, quiz_code: quizCode })
      })
      const data = await res.json()
      
      if (res.ok) {
        localStorage.setItem("attempt_id", data.attempt_id)
        navigate(`/quiz/${quizCode}`)
      } else {
        setError(data.error || "Failed to start quiz. Please check your details.")
      }
    } catch (err) {
      setError("Network error. Try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleReviewChange = (e) => {
    setReviewForm({ ...reviewForm, [e.target.name]: e.target.value })
    setReviewError("")
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    setReviewLoading(true)
    setReviewError("")

    try {
      const res = await fetch("http://127.0.0.1:8000/api/get-attempt/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: reviewForm.email, quiz_code: quizCode })
      })
      const data = await res.json()
      if (res.ok) {
        navigate(`/review/${data.attempt_id}`)
      } else {
        setReviewError(data.error || "No attempt found for this email.")
      }
    } catch (err) {
      setReviewError("Network error. Try again.")
    } finally {
      setReviewLoading(false)
    }
  }

  // Agar page info load kar raha hai
  if (infoLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">

      <header className="w-full h-16 px-4 sm:px-6 flex justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
        <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">
          Quiesy
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Home
          </Link>
          <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-xl">
          
          <div className="mb-8 text-center">
            {/* 🔥 Yahan ab dynamic title aayega! */}
            <h2 className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400 mb-1">
              {quizTitle || "Start Assessment"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Enter your details below to begin.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg text-center font-medium mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              required
              name="student_name"
              placeholder="Full Name"
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />

            <input
              required
              type="email"
              name="email"
              placeholder="Email Address"
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />

            <input
              required
              name="roll_number"
              placeholder="Roll Number"
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />

            {/* 🔥 MAGIC HAPPENS HERE: Sirf tabhi dikhega jab requiresPassword true hoga */}
            {requiresPassword && (
              <div className="relative">
                <input
                  required // Agar dikh raha hai to required hoga!
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Quiz Password"
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-70 mt-2"
            >
              {loading ? "Verifying..." : "Start Quiz"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Already completed this assessment?
            </p>
            <button
              onClick={() => setShowReviewModal(true)}
              className="w-full py-3 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl shadow-sm transition-all"
            >
              View Your Result & Review
            </button>
          </div>

        </div>
      </div>

      {/* --- BLURRED MODAL FOR REVIEW REMAINS THE SAME --- */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all">
          {/* ... Modal Code ... */}
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <button 
              onClick={() => {
                setShowReviewModal(false)
                setReviewError("")
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold tracking-tight">Access Results</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Verify your identity to see your performance.
              </p>
            </div>

            {reviewError && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg text-center font-medium mb-5">
                {reviewError}
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <input required name="student_name" placeholder="Full Name" onChange={handleReviewChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all" />
              <input required type="email" name="email" placeholder="Email Address" onChange={handleReviewChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all" />
              <input required name="roll_number" placeholder="Roll Number" onChange={handleReviewChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all" />
              <button type="submit" disabled={reviewLoading} className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-70 mt-2">
                {reviewLoading ? "Searching..." : "View Review"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}