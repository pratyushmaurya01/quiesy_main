import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import ThemeToggle from "../components/ThemeToggle"
import API from "../api/api"
import Editor from "@monaco-editor/react"

export default function Review() {
  const { attemptId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [reviewAllowed, setReviewAllowed] = useState(false)
  const [questions, setQuestions] = useState([])
  const [timeTaken, setTimeTaken] = useState(null) 

  // Derived Statistics
  const [stats, setStats] = useState({
    total: 0,
    correct: 0,
    incorrect: 0,
    skipped: 0,
    percentage: 0,
    earnedScore: 0,
    totalMarks: 0
  })

  const formatTimeTaken = (totalSeconds) => {
    if (!totalSeconds && totalSeconds !== 0) return "--"
    const m = Math.floor(totalSeconds / 60)
    const s = Math.floor(totalSeconds % 60)
    return `${m}m ${s}s`
  }

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const res = await API.get(`review/${attemptId}/`)
        const data = res.data

        if (data.review_allowed) {
          setReviewAllowed(true)
          setQuestions(data.data)
          setTimeTaken(data.time_taken_seconds)

          let correctCount = 0
          let incorrectCount = 0
          let skippedCount = 0

          // 🔥 Ab backend ne exact bata diya hai kaunsa sahi hai kaunsa galat
          data.data.forEach((q) => {
            const isSkipped = q.type === "coding" 
                ? (!q.submitted_code || q.submitted_code.trim() === "")
                : !q.selected_option

            if (isSkipped) {
              skippedCount++
            } else if (q.is_correct) {
              correctCount++
            } else {
              incorrectCount++
            }
          })

          setStats({
            total: data.data.length,
            correct: correctCount,
            incorrect: incorrectCount,
            skipped: skippedCount,
            percentage: data.total_marks > 0 ? Math.round((data.student_score / data.total_marks) * 100) : 0,
            earnedScore: data.student_score, // 🔥 Exact score from DB
            totalMarks: data.total_marks     // 🔥 Total possible marks
          })
        } else {
          setReviewAllowed(false)
        }
      } catch (err) {
        console.error("Error fetching review:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchReview()
  }, [attemptId])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium text-slate-500 dark:text-slate-400">Generating your performance report...</p>
      </div>
    )
  }

  if (!reviewAllowed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 transition-colors">
        <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Review Not Available</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            The teacher has disabled immediate reviews for this assessment. Results will be published later.
          </p>
          <button onClick={() => navigate("/")} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md">
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const getLang = (lang) => {
    if (lang === "java") return "java"
    if (lang === "cpp") return "cpp"
    return "python" 
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans transition-colors duration-200 pb-20">
      
      {/* Top Navigation */}
      <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 h-16 px-4 sm:px-6 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">
            Quiesy
          </Link>
          <span className="hidden sm:block text-slate-300 dark:text-slate-700">|</span>
          <span className="hidden sm:block font-medium text-slate-600 dark:text-slate-300">Performance Report</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button onClick={() => navigate("/")} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Exit
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">

        {/* --- SECTION 1: Performance Summary --- */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-6 tracking-tight">Your Scorecard</h1>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            
            {/* 🔥 Overall Score showing exactly how many marks earned out of total */}
            <div className="col-span-2 md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Overall Score</span>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                  {stats.earnedScore}
                </span>
                <span className="text-xl font-bold text-slate-400 dark:text-slate-500">
                  / {stats.totalMarks}
                </span>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 mt-2">({stats.percentage}%)</span>
            </div>

            <div className="col-span-1 md:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Correct</span>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.correct}</div>
            </div>
            
            <div className="col-span-1 md:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Incorrect</span>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.incorrect}</div>
            </div>

            <div className="col-span-1 md:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Skipped</span>
              <div className="text-3xl font-bold text-slate-600 dark:text-slate-300 mt-1">{stats.skipped}</div>
            </div>

            <div className="col-span-1 md:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Time Taken</span>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{formatTimeTaken(timeTaken)}</div>
            </div>

          </div>
        </div>

        {/* --- SECTION 2: Detailed Analysis --- */}
        <div>
          <h2 className="text-2xl font-bold mb-6 tracking-tight border-b border-slate-200 dark:border-slate-800 pb-4">
            Question Analysis
          </h2>

          <div className="space-y-6">
            {questions.map((q, index) => {
              
              let statusBadge = null
              
              const isSkipped = q.type === "coding" 
                  ? (!q.submitted_code || q.submitted_code.trim() === "")
                  : !q.selected_option

              // 🔥 Now badges work perfectly for both MCQ and Coding!
              if (isSkipped) {
                statusBadge = <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Skipped</span>
              } else if (q.is_correct) {
                statusBadge = <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-green-200 dark:border-green-800">Correct</span>
              } else {
                statusBadge = <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-red-200 dark:border-red-800">Incorrect</span>
              }

              return (
                <div key={q.question_id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  
                  {/* Question Header */}
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <h3 className="text-lg font-semibold leading-relaxed">
                      <span className="text-slate-400 dark:text-slate-500 mr-2">Q{index + 1}.</span> 
                      {q.question_text}
                    </h3>
                    <div className="shrink-0 mt-1">
                      {statusBadge}
                    </div>
                  </div>

                  {q.type === "coding" ? (
                     
                     <div className="mt-6 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                          <span className="text-sm font-mono text-slate-600 dark:text-slate-300">
                            Language: {q.language || "Not Selected"}
                          </span>
                        </div>
                        
                        {q.submitted_code ? (
                          <Editor
                            height="300px"
                            language={getLang(q.language)}
                            value={q.submitted_code}
                            theme="vs-dark"
                            options={{ 
                              readOnly: true,
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                              fontSize: 14,
                            }}
                          />
                        ) : (
                          <div className="p-8 text-center bg-white dark:bg-slate-900">
                            <span className="text-slate-500 font-medium">No code was submitted for this question.</span>
                          </div>
                        )}
                     </div>

                  ) : (

                    <div className="space-y-3 mt-6">
                      {q.options.map(opt => {
                        const isSelected = opt.id === q.selected_option
                        const isCorrect = opt.is_correct

                        let optionStyle = "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                        let icon = null

                        if (isCorrect) {
                          optionStyle = "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 ring-1 ring-green-500"
                          icon = <svg className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        } else if (isSelected && !isCorrect) {
                          optionStyle = "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300"
                          icon = <svg className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        }

                        return (
                          <div key={opt.id} className={`p-4 rounded-xl border flex justify-between items-center transition-colors ${optionStyle}`}>
                            <span className="font-medium pr-4">{opt.text}</span>
                            
                            <div className="flex items-center gap-3">
                              {isSelected && <span className="text-xs font-bold uppercase tracking-wider opacity-70">Your Answer</span>}
                              {icon}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                </div>
              )
            })}
          </div>

        </div>
      </div>
    </div>
  )
}