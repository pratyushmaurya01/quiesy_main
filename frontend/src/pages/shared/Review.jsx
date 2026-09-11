import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import ThemeToggle from "../../components/ThemeToggle"
import { getAttempt } from "../../api/student"
import { useAuth } from "../../context/AuthContext"
import Editor from "@monaco-editor/react"

export default function Review() {
  const { attemptId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const isTeacher = user?.role === "TEACHER"

  const [loading, setLoading] = useState(true)
  const [reviewAllowed, setReviewAllowed] = useState(false)
  const [quizDetails, setQuizDetails] = useState(null)
  const [studentInfo, setStudentInfo] = useState(null)
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
    totalMarks: 0,
  })

  const formatTimeTaken = (totalSeconds) => {
    if (!totalSeconds && totalSeconds !== 0) return "--"
    const m = Math.floor(totalSeconds / 60)
    const s = Math.floor(totalSeconds % 60)
    return `${m}m ${s}s`
  }

  useEffect(() => {
    let isMounted = true

    const fetchReview = async () => {
      try {
        setLoading(true)
        const res = await getAttempt(attemptId)
        const attempt = res.data

        if (!isMounted) return

        const isReviewAllowed = isTeacher || attempt.review_enabled !== false

        if (isReviewAllowed) {
          setReviewAllowed(true)
          setQuizDetails({
            id: attempt.quiz,
            title: attempt.quiz_title || "Quiz Review",
            code: attempt.quiz_code,
          })
          if (attempt.student_name || attempt.student_email) {
            setStudentInfo({
              name: attempt.student_name || "Student",
              email: attempt.student_email || "",
            })
          }

          // Calculate time taken if started_at and submitted_at are available
          if (attempt.started_at && attempt.submitted_at) {
            const start = new Date(attempt.started_at).getTime()
            const end = new Date(attempt.submitted_at).getTime()
            const diffSeconds = Math.max(0, Math.floor((end - start) / 1000))
            setTimeTaken(diffSeconds)
          }

          // Build answers lookup map by question_id
          const answersMap = {}
          ;(attempt.answers || []).forEach((ans) => {
            if (ans.question) {
              answersMap[ans.question] = ans
            }
          })

          // Map questions with their student response and correctness
          let correctCount = 0
          let incorrectCount = 0
          let skippedCount = 0
          let totalPossibleMarks = 0

          const mappedQuestions = (attempt.questions || []).map((item, index) => {
            const q = item.question || item
            const qId = q.id
            const ansObj = answersMap[qId]
            const answerData = ansObj?.answer_data || {}
            const marks = item.marks_override !== null && item.marks_override !== undefined
              ? Number(item.marks_override)
              : Number(q.marks || 1)

            totalPossibleMarks += marks

            const qType = (q.question_type || q.type || "MCQ").toUpperCase()

            let isSkipped = false
            let isCorrect = false

            if (qType === "CODING") {
              const code = answerData.code || ""
              isSkipped = !code || code.trim() === ""
              // If evaluated score matches question marks
              if (!isSkipped) {
                isCorrect = ansObj && Number(ansObj.evaluated_score) > 0
              }
            } else if (qType === "MSQ") {
              const selectedIds = answerData.option_ids || []
              isSkipped = selectedIds.length === 0
              if (!isSkipped) {
                const correctOptionIds = (q.options || [])
                  .filter((o) => o.is_correct)
                  .map((o) => o.id)
                isCorrect =
                  selectedIds.length === correctOptionIds.length &&
                  selectedIds.every((id) => correctOptionIds.includes(id))
              }
            } else if (qType === "SUBJECTIVE") {
              const text = answerData.text || ""
              isSkipped = !text || text.trim() === ""
              isCorrect = ansObj && Number(ansObj.evaluated_score) > 0
            } else {
              // MCQ
              const selectedId = answerData.option_id
              isSkipped = selectedId === undefined || selectedId === null
              if (!isSkipped) {
                const correctOpt = (q.options || []).find((o) => o.is_correct)
                isCorrect = correctOpt && correctOpt.id === selectedId
              }
            }

            if (isSkipped) {
              skippedCount++
            } else if (isCorrect) {
              correctCount++
            } else {
              incorrectCount++
            }

            return {
              id: qId,
              text: q.text,
              type: qType,
              marks,
              earnedMarks: ansObj ? Number(ansObj.evaluated_score || 0) : 0,
              executionResult: ansObj?.execution_result || null,
              options: q.options || [],
              answerData,
              isSkipped,
              isCorrect,
            }
          })

          const earnedScore = Number(attempt.score ?? 0)
          const finalTotalMarks = totalPossibleMarks > 0 ? totalPossibleMarks : Number(attempt.max_score || 0)

          setQuestions(mappedQuestions)
          setStats({
            total: mappedQuestions.length,
            correct: correctCount,
            incorrect: incorrectCount,
            skipped: skippedCount,
            percentage: finalTotalMarks > 0 ? Math.round((earnedScore / finalTotalMarks) * 100) : 0,
            earnedScore,
            totalMarks: finalTotalMarks,
          })
        } else {
          setReviewAllowed(false)
        }
      } catch (err) {
        console.error("Error fetching review:", err)
        if (isMounted) {
          setReviewAllowed(false)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchReview()

    return () => {
      isMounted = false
    }
  }, [attemptId])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f1218] text-slate-900 dark:text-white transition-colors">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium text-slate-500 dark:text-slate-400 text-sm">
          Preparing your performance report...
        </p>
      </div>
    )
  }

  if (!reviewAllowed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f1218] text-slate-900 dark:text-white p-6 transition-colors">
        <div className="max-w-md w-full text-center bg-white dark:bg-[#111622] p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Review Not Available</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
            The instructor has disabled immediate review for this assessment. Your score and responses have been safely saved.
          </p>
          <button
            onClick={() => navigate("/student-dashboard")}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md cursor-pointer"
          >
            Return to Student Dashboard
          </button>
        </div>
      </div>
    )
  }

  const getLang = (lang) => {
    if (lang === "java") return "java"
    if (lang === "cpp") return "cpp"
    if (lang === "javascript") return "javascript"
    return "python"
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 pb-20">
      
      {/* Top Navigation Bar */}
      <header className="bg-white/95 dark:bg-[#111622]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 px-4 sm:px-6 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
            Q
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">
            Quiesy
          </span>
          <span className="hidden sm:block text-slate-300 dark:text-slate-700">|</span>
          <span className="hidden sm:block text-sm font-medium text-slate-600 dark:text-slate-400">
            {quizDetails?.title || "Performance Report"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => {
              if (isTeacher && quizDetails?.id) {
                navigate(`/quiz/${quizDetails.id}/results`)
              } else if (isTeacher) {
                navigate("/dashboard")
              } else {
                navigate("/student-dashboard")
              }
            }}
            className="text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            {isTeacher ? "Back to Quiz Results" : "Back to Dashboard"}
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">

        {/* --- SECTION 1: Performance Scorecard --- */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {isTeacher && studentInfo ? `${studentInfo.name}'s Submission Review` : "Your Performance Scorecard"}
              </h1>
              {isTeacher && studentInfo && (
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Student Email: {studentInfo.email}
                </p>
              )}
            </div>
            {isTeacher && (
              <span className="self-start rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-xs font-semibold text-blue-400">
                Teacher Inspection Mode
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            
            {/* Overall Score */}
            <div className="col-span-2 bg-white dark:bg-[#111622] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Overall Score</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                  {stats.earnedScore}
                </span>
                <span className="text-lg sm:text-xl font-bold text-slate-400 dark:text-slate-500">
                  / {stats.totalMarks}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-500 mt-1">({stats.percentage}%)</span>
            </div>

            <div className="col-span-1 bg-white dark:bg-[#111622] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Correct</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.correct}</div>
            </div>
            
            <div className="col-span-1 bg-white dark:bg-[#111622] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Incorrect</span>
              <div className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400 mt-1">{stats.incorrect}</div>
            </div>

            <div className="col-span-1 bg-white dark:bg-[#111622] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Skipped</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-600 dark:text-slate-300 mt-1">{stats.skipped}</div>
            </div>

            <div className="col-span-1 bg-white dark:bg-[#111622] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Time Taken</span>
              <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{formatTimeTaken(timeTaken)}</div>
            </div>

          </div>
        </div>

        {/* --- SECTION 2: Detailed Question Analysis --- */}
        <div>
          <h2 className="text-xl font-bold mb-6 tracking-tight border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
            <span>Question Breakdown</span>
            <span className="text-xs font-semibold text-slate-400">{questions.length} Question(s)</span>
          </h2>

          <div className="space-y-6">
            {questions.map((q, index) => {
              let statusBadge = null
              if (q.isSkipped) {
                statusBadge = (
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Skipped
                  </span>
                )
              } else if (q.isCorrect) {
                statusBadge = (
                  <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-800">
                    Correct (+{q.marks} Pts)
                  </span>
                )
              } else {
                statusBadge = (
                  <span className="bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-red-200 dark:border-red-800">
                    Incorrect (0/{q.marks})
                  </span>
                )
              }

              return (
                <div key={q.id || index} className="bg-white dark:bg-[#111622] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  
                  {/* Question Header */}
                  <div className="flex justify-between items-start mb-4 gap-3">
                    <h3 className="text-base sm:text-lg font-semibold leading-relaxed">
                      <span className="text-slate-400 dark:text-slate-500 mr-2">Q{index + 1}.</span> 
                      {q.text}
                    </h3>
                    <div className="shrink-0 mt-0.5">
                      {statusBadge}
                    </div>
                  </div>

                  {/* Coding Review */}
                  {q.type === "CODING" ? (
                    <div className="mt-4 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                      <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 flex justify-between items-center border-b border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                          Language: {q.answerData.language || "python"}
                        </span>
                      </div>
                      
                      {q.answerData.code ? (
                        <Editor
                          height="240px"
                          language={getLang(q.answerData.language)}
                          value={q.answerData.code}
                          theme="vs-dark"
                          options={{ 
                            readOnly: true,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            fontSize: 13,
                          }}
                        />
                      ) : (
                        <div className="p-6 text-center bg-white dark:bg-[#111622]">
                          <span className="text-xs text-slate-400 font-medium">No code was submitted for this problem.</span>
                        </div>
                      )}

                      {/* Test Case Execution Breakdown */}
                      {q.executionResult && (
                        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0c1017] p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Automated Judge0 Evaluation:
                            </span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                              q.executionResult.passed_count === q.executionResult.total_count && q.executionResult.total_count > 0
                                ? "bg-emerald-500/10 text-emerald-500"
                                : q.executionResult.passed_count > 0
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-rose-500/10 text-rose-500"
                            }`}>
                              {q.executionResult.summary || `${q.executionResult.passed_count}/${q.executionResult.total_count} Passed`}
                            </span>
                          </div>

                          {Array.isArray(q.executionResult.results) && q.executionResult.results.length > 0 && (
                            <div className="space-y-2">
                              {q.executionResult.results.map((tc, tcIdx) => (
                                <div key={tcIdx} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] p-2.5 text-xs font-mono">
                                  <div className="flex items-center justify-between font-sans">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                      Test Case #{tcIdx + 1} {tc.is_sample ? "(Sample)" : "(Hidden)"}
                                    </span>
                                    <span className={tc.passed ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>
                                      {tc.passed ? "✓ Passed" : `✗ ${tc.status || "Failed"}`}
                                    </span>
                                  </div>
                                  {!tc.passed && (
                                    <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                                      {tc.input && <div><span className="text-slate-400">Input:</span> {tc.input.trim()}</div>}
                                      {tc.expected_output && <div><span className="text-slate-400">Expected:</span> {tc.expected_output.trim()}</div>}
                                      {tc.actual_output && <div><span className="text-slate-400">Actual:</span> {tc.actual_output.trim()}</div>}
                                      {tc.error && <div className="text-rose-400"><span className="text-slate-400">Error:</span> {tc.error}</div>}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : q.type === "SUBJECTIVE" ? (
                    /* Subjective Review */
                    <div className="mt-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0d121c]">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Submitted Response:
                      </span>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                        {q.answerData.text || "(No response written)"}
                      </p>
                    </div>
                  ) : (
                    /* MCQ / MSQ Review */
                    <div className="space-y-2.5 mt-5">
                      {(q.options || []).map((opt) => {
                        const isSelected = q.type === "MSQ"
                          ? (q.answerData.option_ids || []).includes(opt.id)
                          : q.answerData.option_id === opt.id

                        const isCorrect = !!opt.is_correct

                        let cardStyle = "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0f1420] text-slate-700 dark:text-slate-300"
                        let tag = null

                        if (isCorrect) {
                          cardStyle = "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500"
                          tag = (
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                              </svg>
                              Correct Option
                            </span>
                          )
                        } else if (isSelected && !isCorrect) {
                          cardStyle = "border-red-400 bg-red-50/80 dark:bg-red-950/30 text-red-900 dark:text-red-200"
                          tag = (
                            <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Your Choice (Wrong)
                            </span>
                          )
                        } else if (isSelected && isCorrect) {
                          tag = (
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                              </svg>
                              Your Choice (Correct)
                            </span>
                          )
                        }

                        return (
                          <div key={opt.id} className={`p-3.5 sm:p-4 rounded-xl border flex justify-between items-center gap-3 transition-colors ${cardStyle}`}>
                            <span className="text-sm font-medium pr-2 break-words flex-1">{opt.text}</span>
                            <div className="shrink-0">{tag}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                </div>
              )
            })}
          </div>

          {/* Bottom Action */}
          <div className="mt-12 flex justify-center">
            <button
              onClick={() => navigate("/student-dashboard")}
              className="px-8 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-md transition cursor-pointer"
            >
              Return to Student Dashboard
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}