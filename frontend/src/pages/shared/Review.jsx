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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#101114] text-white">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium text-slate-400 text-sm">
          Preparing your performance report...
        </p>
      </div>
    )
  }

  if (!reviewAllowed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#101114] text-white p-6">
        <div className="max-w-md w-full text-center bg-[#141518] p-8 rounded-2xl shadow-xl border border-slate-800">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Review Not Available</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            The instructor has disabled immediate review for this assessment. Your score and responses have been safely saved.
          </p>
          <button
            onClick={() => navigate("/student-dashboard")}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md cursor-pointer"
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
    <div className="min-h-screen bg-[#101114] text-slate-100 font-sans pb-20">
      
      {/* 1. Header & Navigation (Clean Top-Bar) */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#141518]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Left: Brand + Breadcrumbs/Quiz badge */}
          <div className="flex items-center gap-3">
            <Link to={isTeacher ? "/dashboard" : "/student-dashboard"} className="text-lg font-bold tracking-tight text-white hover:text-blue-400 transition-colors">
              Quiesy
            </Link>

            <span className="text-slate-600">/</span>

            {/* Breadcrumb Path */}
            <div className="flex items-center gap-1.5 text-xs">
              <Link
                to={isTeacher ? "/dashboard" : "/student-dashboard"}
                className="font-medium text-slate-400 hover:text-white transition-colors"
              >
                Home
              </Link>
              <span className="text-slate-600">/</span>
              <span className="font-medium text-slate-400">
                Quizzes
              </span>
              <span className="text-slate-600">/</span>
              <span className="rounded-md border border-slate-800 bg-[#1E2128] px-2 py-0.5 font-mono text-[11px] font-bold text-slate-200">
                {quizDetails?.title || "Exam"}
              </span>
              {quizDetails?.code && (
                <span className="hidden sm:inline-block rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  {quizDetails.code}
                </span>
              )}
            </div>
          </div>

          {/* Right: Back to Dashboard outline button */}
          <div className="flex items-center gap-3">
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
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700/80 bg-[#1E2128] px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-[#252830] hover:text-white transition-all cursor-pointer shadow-xs"
              type="button"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>{isTeacher ? "Back to Quiz Results" : "Back to Dashboard"}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8">

        {/* --- SECTION 1: Performance Scorecard --- */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-400">
                Examination Review & Results
              </span>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {isTeacher && studentInfo ? `${studentInfo.name}'s Submission Review` : "Performance Scorecard"}
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
          
          {/* 2. Premium Stats Cards (Removed rainbow colors, subtle indicators, #2A2D35 cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            
            {/* Overall Score */}
            <div className="rounded-xl border border-slate-800 bg-[#2A2D35] p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Overall Score
                </span>
                <span className="rounded-md border border-slate-700/60 bg-[#1E2128] px-2 py-0.5 font-mono text-[10px] font-bold text-slate-300">
                  {stats.percentage}%
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  {stats.earnedScore}
                </span>
                <span className="text-sm font-semibold text-slate-400">
                  / {stats.totalMarks} pts
                </span>
              </div>
            </div>

            {/* Correct */}
            <div className="rounded-xl border border-slate-800 bg-[#2A2D35] p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Correct
                </span>
                {/* Subtle soft green dot indicator */}
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              </div>
              <div className="mt-3">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  {stats.correct}
                </span>
                <span className="block text-[11px] font-medium text-slate-400 mt-0.5">
                  of {stats.total} questions
                </span>
              </div>
            </div>
            
            {/* Incorrect */}
            <div className="rounded-xl border border-slate-800 bg-[#2A2D35] p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Incorrect
                </span>
                {/* Subtle soft red dot indicator */}
                <span className="inline-block h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]" />
              </div>
              <div className="mt-3">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  {stats.incorrect}
                </span>
                <span className="block text-[11px] font-medium text-slate-400 mt-0.5">
                  wrong responses
                </span>
              </div>
            </div>

            {/* Skipped */}
            <div className="rounded-xl border border-slate-800 bg-[#2A2D35] p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Skipped
                </span>
                {/* Subtle soft grey dot indicator */}
                <span className="inline-block h-2 w-2 rounded-full bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.4)]" />
              </div>
              <div className="mt-3">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  {stats.skipped}
                </span>
                <span className="block text-[11px] font-medium text-slate-400 mt-0.5">
                  unanswered
                </span>
              </div>
            </div>

            {/* Time Taken */}
            <div className="rounded-xl border border-slate-800 bg-[#2A2D35] p-5 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Time Taken
                </span>
                <span className="inline-block h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {formatTimeTaken(timeTaken)}
                </span>
                <span className="block text-[11px] font-medium text-slate-400 mt-0.5">
                  duration elapsed
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* --- SECTION 2: Detailed Question Analysis --- */}
        <div>
          <div className="mb-6 flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Detailed Solutions
              </span>
              <h2 className="mt-0.5 text-xl font-bold tracking-tight text-white">
                Question Breakdown
              </h2>
            </div>
            <span className="rounded-md border border-slate-800 bg-[#1E2128] px-2.5 py-1 font-mono text-xs font-bold text-slate-300">
              {questions.length} Question{questions.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="space-y-5">
            {questions.map((q, index) => {
              let statusBadge = null
              if (q.isSkipped) {
                statusBadge = (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    Skipped (0/{q.marks})
                  </span>
                )
              } else if (q.isCorrect) {
                statusBadge = (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    CORRECT (+{q.marks} PTS)
                  </span>
                )
              } else {
                statusBadge = (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-rose-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                    INCORRECT (0/{q.marks})
                  </span>
                )
              }

              return (
                <div key={q.id || index} className="rounded-xl border border-slate-800 bg-[#141518] p-5 sm:p-6 shadow-sm">
                  
                  {/* Question Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                    <h3 className="text-base sm:text-lg font-semibold leading-relaxed text-white">
                      <span className="font-mono text-blue-400 font-bold mr-2">Q{index + 1}.</span> 
                      {q.text}
                    </h3>
                    <div className="shrink-0 self-start">
                      {statusBadge}
                    </div>
                  </div>

                  {/* Coding Review */}
                  {q.type === "CODING" ? (
                    <div className="mt-4 border border-slate-800 rounded-xl overflow-hidden bg-[#101114]">
                      <div className="bg-[#1E2128] px-4 py-2 flex justify-between items-center border-b border-slate-800">
                        <span className="text-xs font-mono font-bold text-slate-300">
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
                        <div className="p-6 text-center bg-[#141518]">
                          <span className="text-xs text-slate-400 font-medium">No code was submitted for this problem.</span>
                        </div>
                      )}

                      {/* Test Case Execution Breakdown */}
                      {q.executionResult && (
                        <div className="border-t border-slate-800 bg-[#101114] p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              Automated Evaluation:
                            </span>
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                              q.executionResult.passed_count === q.executionResult.total_count && q.executionResult.total_count > 0
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : q.executionResult.passed_count > 0
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}>
                              {q.executionResult.summary || `${q.executionResult.passed_count}/${q.executionResult.total_count} Passed`}
                            </span>
                          </div>

                          {Array.isArray(q.executionResult.results) && q.executionResult.results.length > 0 && (
                            <div className="space-y-2">
                              {q.executionResult.results.map((tc, tcIdx) => (
                                <div key={tcIdx} className="rounded-lg border border-slate-800 bg-[#141518] p-2.5 text-xs font-mono">
                                  <div className="flex items-center justify-between font-sans">
                                    <span className="font-semibold text-slate-300">
                                      Test Case #{tcIdx + 1} {tc.is_sample ? "(Sample)" : "(Hidden)"}
                                    </span>
                                    <span className={tc.passed ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                      {tc.passed ? "✓ Passed" : `✗ ${tc.status || "Failed"}`}
                                    </span>
                                  </div>
                                  {!tc.passed && (
                                    <div className="mt-2 text-[11px] text-slate-400 space-y-1">
                                      {tc.input && <div><span className="text-slate-500">Input:</span> {tc.input.trim()}</div>}
                                      {tc.expected_output && <div><span className="text-slate-500">Expected:</span> {tc.expected_output.trim()}</div>}
                                      {tc.actual_output && <div><span className="text-slate-500">Actual:</span> {tc.actual_output.trim()}</div>}
                                      {tc.error && <div className="text-rose-400"><span className="text-slate-500">Error:</span> {tc.error}</div>}
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
                    <div className="mt-4 p-4 rounded-xl border border-slate-800 bg-[#101114]">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Submitted Response:
                      </span>
                      <p className="text-sm font-medium text-slate-200 whitespace-pre-wrap">
                        {q.answerData.text || "(No response written)"}
                      </p>
                    </div>
                  ) : (
                    /* 3. Question Breakdown UI (Proportions & Highlights: Neat 2x2 grid, soft dark-green tint, compact boxes) */
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(q.options || []).map((opt) => {
                        const isSelected = q.type === "MSQ"
                          ? (q.answerData.option_ids || []).includes(opt.id)
                          : q.answerData.option_id === opt.id

                        const isCorrect = !!opt.is_correct

                        let cardStyle = "border-slate-800 bg-[#1E2128]/70 text-slate-300"
                        let tag = null

                        if (isCorrect) {
                          // Premium soft dark-green background tint with smooth refined border
                          cardStyle = "border-emerald-500/50 bg-emerald-950/25 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.06)]"
                          tag = (
                            <span className="rounded-md bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1 shrink-0">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                              </svg>
                              ✓ Correct
                            </span>
                          )
                        } else if (isSelected && !isCorrect) {
                          // Student wrong choice
                          cardStyle = "border-rose-500/40 bg-rose-950/20 text-rose-200"
                          tag = (
                            <span className="rounded-md bg-rose-500/15 border border-rose-500/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1 shrink-0">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Your Choice
                            </span>
                          )
                        } else if (isSelected && isCorrect) {
                          tag = (
                            <span className="rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1 shrink-0">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                              </svg>
                              Your Choice (✓ Correct)
                            </span>
                          )
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${cardStyle}`}
                          >
                            <span className="text-sm font-medium pr-2 break-words flex-1 leading-snug">
                              {opt.text}
                            </span>
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
              onClick={() => {
                if (isTeacher && quizDetails?.id) {
                  navigate(`/quiz/${quizDetails.id}/results`)
                } else if (isTeacher) {
                  navigate("/dashboard")
                } else {
                  navigate("/student-dashboard")
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>{isTeacher ? "Return to Quiz Results" : "Return to Student Dashboard"}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}