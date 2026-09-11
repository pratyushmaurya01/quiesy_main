import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import ThemeToggle from "../../components/ThemeToggle"
import Editor from "@monaco-editor/react"
import {
  getQuizInstructions,
  getAttempt,
  saveAnswer,
  submitExam,
  runCode,
  submitCode,
} from "../../api/student"
import API from "../../api/api"

// Status tags for questions in navigation palette
const QUESTION_STATUS = {
  NOT_VISITED: "not_visited",
  NOT_ANSWERED: "not_answered",
  ANSWERED: "answered",
  MARKED_REVIEW: "marked_review",
  MARKED_ANSWERED: "marked_answered",
}

// Generates a random idempotency key for network safe saves/submits
function generateKey() {
  return "ik_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now()
}

// Helper to normalize question objects whether wrapped in { question: {...} } or flat
function normalizeQuestions(rawList = []) {
  return rawList.map((item, index) => {
    // If wrapped in AttemptQuestionSerializer format: { id, question: { id, text, ... }, marks_override, order }
    if (item && item.question && typeof item.question === "object") {
      const q = item.question
      return {
        ...q,
        quiz_question_id: item.id,
        question_id: q.id,
        id: q.id,
        order: item.order ?? index,
        marks: item.marks_override !== null && item.marks_override !== undefined ? item.marks_override : q.marks,
        marks_override: item.marks_override,
        text: q.text || "",
        options: q.options || [],
        test_cases: q.test_cases || [],
        question_type: (q.question_type || q.type || "MCQ").toUpperCase(),
      }
    }

    // If already flat
    return {
      ...item,
      question_id: item.id,
      id: item.id,
      text: item.text || "",
      options: item.options || [],
      test_cases: item.test_cases || [],
      question_type: (item.question_type || item.type || "MCQ").toUpperCase(),
    }
  })
}

export default function QuizAttempt() {
  const { quizCode } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  // Primary Exam Data
  const [quiz, setQuiz] = useState(location.state?.quiz || null)
  const [attempt, setAttempt] = useState(location.state?.attempt || null)
  const [questions, setQuestions] = useState(() =>
    normalizeQuestions(location.state?.prefetchedQuestions || location.state?.attempt?.questions || [])
  )
  const [loading, setLoading] = useState(!location.state?.attempt || !(location.state?.prefetchedQuestions?.length || location.state?.attempt?.questions?.length))
  const [loadError, setLoadError] = useState("")

  // Navigation & State
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState("next") // for slide animation direction
  const [markedForReview, setMarkedForReview] = useState({}) // { [questionId]: boolean }

  // Answers Map: { [questionId]: answerData }
  const [answers, setAnswers] = useState({})
  const [savedStatus, setSavedStatus] = useState("synced") // 'synced' | 'saving' | 'error'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  // Timer & Auto-Submit State
  const [timeLeft, setTimeLeft] = useState(null)
  const [isTimeUp, setIsTimeUp] = useState(false)
  const [timeUpStatus, setTimeUpStatus] = useState("submitting") // 'submitting' | 'done'

  // Coding execution output
  const [codeOutputs, setCodeOutputs] = useState({})
  const [isRunningCode, setIsRunningCode] = useState(false)
  const [isSubmittingCode, setIsSubmittingCode] = useState(false)
  const [codeSubmissions, setCodeSubmissions] = useState({}) // { [qId]: { all_passed, passed_count, total_count, earned_score, max_score } }

  // Track sequence numbers per question for backend sequence verification
  const sequenceCounters = useRef({})
  const sliderRef = useRef(null)
  const autoSaveDebounce = useRef(null)

  // Dark mode tracking for Monaco Editor
  const [isDarkTheme, setIsDarkTheme] = useState(
    document.documentElement.classList.contains("dark")
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkTheme(document.documentElement.classList.contains("dark"))
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [])

  // 1. Load Attempt & Questions Fallback
  useEffect(() => {
    let isMounted = true

    const initializeExam = async () => {
      // If we already received state from ExamInstructions, just initialize timer & answers
      const initialQs = location.state?.prefetchedQuestions || location.state?.attempt?.questions || []
      if (location.state?.attempt && initialQs.length) {
        setQuestions(normalizeQuestions(initialQs))
        setupTimer(location.state.attempt)
        setLoading(false)
        return
      }

      const storedAttemptId = localStorage.getItem("attempt_id")
      if (!storedAttemptId) {
        navigate(`/exam/${quizCode}/instructions`, { replace: true })
        return
      }

      try {
        setLoading(true)
        setLoadError("")

        const [attemptRes, instructionsRes] = await Promise.all([
          getAttempt(storedAttemptId),
          getQuizInstructions(quizCode),
        ])

        if (!isMounted) return

        const loadedAttempt = attemptRes.data
        const loadedQuiz = instructionsRes.data?.quiz
        const rawQuestions = instructionsRes.data?.questions?.length
          ? instructionsRes.data.questions
          : loadedAttempt.questions || []

        if (loadedAttempt.status !== "IN_PROGRESS") {
          navigate(`/review/${loadedAttempt.id}`, { replace: true })
          return
        }

        setAttempt(loadedAttempt)
        setQuiz(loadedQuiz)
        setQuestions(normalizeQuestions(rawQuestions))

        // Restore any previously saved answers from attempt endpoint if present
        if (Array.isArray(loadedAttempt.answers)) {
          const restoredAnswers = {}
          const restoredSubmissions = {}
          loadedAttempt.answers.forEach((ans) => {
            if (ans.question && ans.answer_data) {
              restoredAnswers[ans.question] = ans.answer_data
            }
            if (ans.question && ans.execution_result) {
              restoredSubmissions[ans.question] = {
                all_passed: ans.execution_result.all_passed,
                passed_count: ans.execution_result.passed_count,
                total_count: ans.execution_result.total_count,
                earned_score: ans.evaluated_score,
              }
            }
          })
          setAnswers(restoredAnswers)
          setCodeSubmissions(restoredSubmissions)
        }

        setupTimer(loadedAttempt)
      } catch (err) {
        console.error("Failed to initialize exam:", err)
        if (isMounted) {
          setLoadError(
            err.response?.data?.detail ||
            "Unable to resume the active attempt. Please return to instructions."
          )
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initializeExam()

    return () => {
      isMounted = false
    }
  }, [quizCode, navigate, location.state])

  // Setup Countdown Timer
  const setupTimer = useCallback((attemptData) => {
    if (!attemptData?.expires_at) return
    const expiry = new Date(attemptData.expires_at).getTime()
    const now = Date.now()
    const remaining = Math.max(0, Math.floor((expiry - now) / 1000))
    setTimeLeft(remaining)
  }, [])

  // Timer Tick
  useEffect(() => {
    if (timeLeft === null) return

    if (timeLeft <= 0) {
      triggerTimeUpAutoSubmit()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          triggerTimeUpAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // Center Question Pill in slider when currentIndex changes
  useEffect(() => {
    if (sliderRef.current) {
      const activeBtn = sliderRef.current.querySelector(".active-pill")
      if (activeBtn) {
        activeBtn.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        })
      }
    }
  }, [currentIndex])

  const currentQ = questions[currentIndex]

  // Persist / Save Answer to Backend
  const triggerBackendSave = useCallback(
    async (qId, answerData) => {
      if (!attempt?.id || !qId) return

      // Update sequence counter
      const nextSeq = (sequenceCounters.current[qId] || 0) + 1
      sequenceCounters.current[qId] = nextSeq

      setSavedStatus("saving")
      try {
        await saveAnswer(attempt.id, {
          question: qId,
          answer_data: answerData,
          sequence: nextSeq,
          idempotency_key: generateKey(),
        })
        setSavedStatus("synced")
      } catch (err) {
        console.error("Failed to auto-save answer:", err)
        setSavedStatus("error")
      }
    },
    [attempt?.id]
  )

  // Handle Option Select (MCQ)
  const handleSelectMCQ = (optionId) => {
    if (!currentQ || isTimeUp) return
    const qId = currentQ.question_id || currentQ.id
    const updated = { option_id: optionId }
    setAnswers((prev) => ({ ...prev, [qId]: updated }))
    triggerBackendSave(qId, updated)
  }

  // Handle Option Toggle (MSQ)
  const handleToggleMSQ = (optionId) => {
    if (!currentQ || isTimeUp) return
    const qId = currentQ.question_id || currentQ.id
    const currentList = answers[qId]?.option_ids || []
    let nextList
    if (currentList.includes(optionId)) {
      nextList = currentList.filter((id) => id !== optionId)
    } else {
      nextList = [...currentList, optionId]
    }
    const updated = { option_ids: nextList }
    setAnswers((prev) => ({ ...prev, [qId]: updated }))
    triggerBackendSave(qId, updated)
  }

  // Handle Text change (Subjective) with Debounce
  const handleSubjectiveChange = (text) => {
    if (!currentQ || isTimeUp) return
    const qId = currentQ.question_id || currentQ.id
    const updated = { text }
    setAnswers((prev) => ({ ...prev, [qId]: updated }))

    if (autoSaveDebounce.current) clearTimeout(autoSaveDebounce.current)
    setSavedStatus("saving")
    autoSaveDebounce.current = setTimeout(() => {
      triggerBackendSave(qId, updated)
    }, 800)
  }

  // Handle Code change (Coding) with Debounce
  const handleCodeChange = (newCode) => {
    if (!currentQ || isTimeUp) return
    const qId = currentQ.question_id || currentQ.id
    const currentLang = answers[qId]?.language || currentQ.language || "python"
    const updated = { code: newCode, language: currentLang }
    setAnswers((prev) => ({ ...prev, [qId]: updated }))

    if (autoSaveDebounce.current) clearTimeout(autoSaveDebounce.current)
    setSavedStatus("saving")
    autoSaveDebounce.current = setTimeout(() => {
      triggerBackendSave(qId, updated)
    }, 1200)
  }

  // Handle Code Language Change
  const handleLanguageChange = (newLang) => {
    if (!currentQ || isTimeUp) return
    const qId = currentQ.question_id || currentQ.id
    const existingCode = answers[qId]?.code ?? (currentQ.starter_code || "")
    const updated = { code: existingCode, language: newLang }
    setAnswers((prev) => ({ ...prev, [qId]: updated }))
    triggerBackendSave(qId, updated)
  }

  // Clear Selection for current question
  const handleClearResponse = () => {
    if (!currentQ || isTimeUp) return
    const qId = currentQ.question_id || currentQ.id
    const updated = {}
    setAnswers((prev) => {
      const copy = { ...prev }
      delete copy[qId]
      return copy
    })
    triggerBackendSave(qId, updated)
  }

  // Toggle Mark for Review
  const toggleMarkForReview = () => {
    if (!currentQ || isTimeUp) return
    const qId = currentQ.question_id || currentQ.id
    setMarkedForReview((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }))
  }

  // Run Code via backend test-code runner
  const handleRunCode = async () => {
    if (!currentQ || isTimeUp) return
    const qId = currentQ.question_id || currentQ.id
    const code = answers[qId]?.code ?? currentQ.starter_code ?? ""
    const language = answers[qId]?.language ?? currentQ.language ?? "python"

    if (!code.trim()) {
      setCodeOutputs((prev) => ({
        ...prev,
        [qId]: "⚠️ Please write some code before running tests.",
      }))
      return
    }

    setIsRunningCode(true)
    setCodeOutputs((prev) => ({
      ...prev,
      [qId]: "⏳ Compiling and executing tests on Judge0 Cloud Engine...",
    }))

    try {
      const res = await runCode({
        code,
        language,
        question_id: qId,
      })

      const data = res.data
      let log = ""

      if (data.type === "sample_batch") {
        log += `📊 Test Results: ${data.passed}/${data.total} Sample Test Cases Passed\n`
        log += `──────────────────────────────────────────────\n\n`

        data.results.forEach((tc, idx) => {
          const statusIcon = tc.passed ? "✅" : "❌"
          log += `${statusIcon} Test Case ${idx + 1}: ${tc.status || (tc.passed ? "Passed" : "Failed")}\n`
          log += `   Input:    ${tc.input ? tc.input.replace(/\n$/, '') : "(empty)"}\n`
          log += `   Expected: ${tc.expected_output || "(empty)"}\n`
          log += `   Actual:   ${tc.actual_output || "(empty)"}\n`
          if (tc.error) {
            log += `   Details:  ${tc.error}\n`
          }
          if (tc.time) {
            log += `   Exec Time: ${tc.time}s\n`
          }
          log += `\n`
        })
      } else {
        // Single or custom execution
        log += `Status: ${data.status || "Completed"}\n`
        if (data.output) {
          log += `\n[Output]:\n${data.output}\n`
        }
        if (data.error) {
          log += `\n[Compiler/Runtime Error]:\n${data.error}\n`
        }
      }

      setCodeOutputs((prev) => ({ ...prev, [qId]: log }))
    } catch (err) {
      console.error("Run code error:", err)
      setCodeOutputs((prev) => ({
        ...prev,
        [qId]: `⚠️ Execution Error: ${err.response?.data?.detail || err.message || "Failed to execute code."}`,
      }))
    } finally {
      setIsRunningCode(false)
    }
  }

  // Submit Code (LeetCode-style) - Runs against ALL test cases, saves answer, awards marks immediately
  const handleSubmitCode = async () => {
    if (!currentQ || isTimeUp) return
    const qId = currentQ.question_id || currentQ.id
    const code = answers[qId]?.code ?? currentQ.starter_code ?? ""
    const language = answers[qId]?.language ?? currentQ.language ?? "python"

    if (!code.trim()) {
      setCodeOutputs((prev) => ({
        ...prev,
        [qId]: "⚠️ Please write some code before submitting.",
      }))
      return
    }

    setIsSubmittingCode(true)
    setCodeOutputs((prev) => ({
      ...prev,
      [qId]: "🚀 Submitting to Judge0 Cloud Engine (Evaluating All Test Cases)...",
    }))

    try {
      const res = await submitCode({
        attempt_id: attempt.id,
        question_id: qId,
        code,
        language,
      })

      const data = res.data
      let log = ""

      if (data.all_passed) {
        log += `🎉 ACCEPTED! All ${data.passed_count}/${data.total_count} Test Cases Passed!\n`
        log += `🏆 Earned: +${data.earned_score}/${data.max_score} Marks\n`
      } else {
        log += `❌ ${data.passed_count === 0 ? "WRONG ANSWER" : "PARTIAL ACCEPTED"}: ${data.passed_count}/${data.total_count} Test Cases Passed\n`
        log += `📊 Earned: +${data.earned_score}/${data.max_score} Marks\n`
      }
      log += `──────────────────────────────────────────────\n\n`

      if (Array.isArray(data.execution_result?.results)) {
        data.execution_result.results.forEach((tc, idx) => {
          const statusIcon = tc.passed ? "✅" : "❌"
          const isSampleTag = tc.is_sample ? "[Sample]" : "[Hidden]"
          log += `${statusIcon} Test Case ${idx + 1} ${isSampleTag}: ${tc.status || (tc.passed ? "Passed" : "Failed")}\n`
          if (tc.is_sample) {
            log += `   Input:    ${tc.input ? tc.input.replace(/\n$/, '') : "(empty)"}\n`
            log += `   Expected: ${tc.expected_output || "(empty)"}\n`
            log += `   Actual:   ${tc.actual_output || "(empty)"}\n`
          } else {
            log += `   (Hidden test case output protected)\n`
          }
          if (tc.error) {
            log += `   Details:  ${tc.error}\n`
          }
          if (tc.time) {
            log += `   Exec Time: ${tc.time}s\n`
          }
          log += `\n`
        })
      }

      setCodeOutputs((prev) => ({ ...prev, [qId]: log }))

      // Update code submissions state
      setCodeSubmissions((prev) => ({
        ...prev,
        [qId]: {
          all_passed: data.all_passed,
          passed_count: data.passed_count,
          total_count: data.total_count,
          earned_score: data.earned_score,
          max_score: data.max_score,
        },
      }))

      // Update attempt score in state if returned
      if (data.attempt_total_score !== undefined) {
        setAttempt((prev) => prev ? { ...prev, score: data.attempt_total_score } : prev)
      }

      // Ensure answers map is updated so question turns green in palette
      setAnswers((prev) => ({
        ...prev,
        [qId]: {
          code,
          language,
        },
      }))
    } catch (err) {
      console.error("Submit code error:", err)
      setCodeOutputs((prev) => ({
        ...prev,
        [qId]: `⚠️ Submission Failed: ${err.response?.data?.detail || err.message || "Failed to submit code."}`,
      }))
    } finally {
      setIsSubmittingCode(false)
    }
  }

  // Navigation handlers with direction for animation
  const goToQuestion = (index) => {
    if (index < 0 || index >= questions.length) return
    setDirection(index > currentIndex ? "next" : "prev")
    setCurrentIndex(index)
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      goToQuestion(currentIndex + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      goToQuestion(currentIndex - 1)
    }
  }

  // Final Submission (Manual or Auto)
  const submitExamAttempt = async (isAuto = false) => {
    if (!attempt?.id) return
    setIsSubmitting(true)
    try {
      const idempotencyKey = generateKey()
      await submitExam(attempt.id, idempotencyKey)
      localStorage.removeItem("attempt_id")
      localStorage.removeItem("current_quiz_code")

      // Check if review is enabled by teacher
      const isReviewAllowed = quiz?.review_enabled !== false

      if (isAuto) {
        setTimeUpStatus("done")
        setTimeout(() => {
          if (isReviewAllowed) {
            navigate(`/review/${attempt.id}`, { replace: true })
          } else {
            navigate("/student-dashboard", { replace: true })
          }
        }, 1500)
      } else {
        if (isReviewAllowed) {
          navigate(`/review/${attempt.id}`, { replace: true })
        } else {
          navigate("/student-dashboard", { replace: true })
        }
      }
    } catch (err) {
      console.error("Failed to submit exam:", err)
      setIsSubmitting(false)
      if (isAuto) {
        // Even on error during timeup, redirect gracefully
        localStorage.removeItem("attempt_id")
        localStorage.removeItem("current_quiz_code")
        setTimeUpStatus("done")
        setTimeout(() => {
          navigate("/student-dashboard", { replace: true })
        }, 2000)
      } else {
        setShowSubmitModal(false)
        alert(
          err.response?.data?.detail ||
          "Submission error. Please ensure your internet connection is active and try again."
        )
      }
    }
  }

  // Trigger Time's Up Auto-submission with popup
  const triggerTimeUpAutoSubmit = () => {
    setIsTimeUp(true)
    setTimeUpStatus("submitting")
    setShowSubmitModal(false)
    submitExamAttempt(true)
  }

  // Format countdown
  const formatTime = (seconds) => {
    if (seconds === null) return "--:--"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) {
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  // Calculate Question Status for palette
  const getQuestionPaletteState = (q, index) => {
    const qId = q.question_id || q.id
    const isCurrent = index === currentIndex
    const isMarked = !!markedForReview[qId]
    const ans = answers[qId]
    const isAnswered =
      ans &&
      (ans.option_id !== undefined ||
        (Array.isArray(ans.option_ids) && ans.option_ids.length > 0) ||
        (ans.text && ans.text.trim().length > 0) ||
        (ans.code && ans.code.trim().length > 0))

    if (isMarked && isAnswered) return "marked_answered"
    if (isMarked) return "marked"
    if (isAnswered) return "answered"
    if (isCurrent) return "current"
    return "unvisited"
  }

  // Stats for the submit modal
  const answeredCount = questions.filter((q) => {
    const qId = q.question_id || q.id
    const ans = answers[qId]
    return (
      ans &&
      (ans.option_id !== undefined ||
        (Array.isArray(ans.option_ids) && ans.option_ids.length > 0) ||
        (ans.text && ans.text.trim().length > 0) ||
        (ans.code && ans.code.trim().length > 0))
    )
  }).length

  const markedCount = Object.values(markedForReview).filter(Boolean).length

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f1218] text-slate-900 dark:text-slate-100">
        <div className="relative flex items-center justify-center mb-5">
          <div className="w-14 h-14 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute w-6 h-6 bg-blue-600/10 rounded-full"></div>
        </div>
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
          Entering Secured Exam Workspace
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
          Loading synchronized question sets and local state...
        </p>
      </div>
    )
  }

  // Error Screen
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f1218] p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 text-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Exam Access Error
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            {loadError}
          </p>
          <button
            onClick={() => navigate(`/exam/${quizCode}/instructions`)}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition"
          >
            Return to Instructions
          </button>
        </div>
      </div>
    )
  }

  if (!currentQ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f1218] text-slate-700 dark:text-slate-300">
        No questions found in this examination.
      </div>
    )
  }

  const currentQId = currentQ.question_id || currentQ.id
  const currentAnswer = answers[currentQId] || {}
  const isCurrentMarked = !!markedForReview[currentQId]
  const qType = (currentQ.question_type || currentQ.type || "MCQ").toUpperCase()

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 lg:overflow-hidden overflow-x-hidden w-full selection:bg-blue-500/20">

      {/* ─── 1. TOP SECURE BAR ────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white/95 dark:bg-[#111622]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between px-3 sm:px-6 shrink-0 gap-3 shadow-xs">
        
        {/* Brand & Live Sync Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
              Q
            </div>
            <span className="hidden sm:inline font-bold text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              QUIESY
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

          {/* Sync status indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/50">
            {savedStatus === "saving" ? (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Saving...</span>
              </>
            ) : savedStatus === "error" ? (
              <>
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-red-500">Unsaved changes</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Saved</span>
              </>
            )}
          </div>
        </div>

        {/* Central Question Palette Carousel */}
        <div className="flex-1 min-w-0 max-w-2xl overflow-hidden relative flex items-center bg-slate-100/70 dark:bg-[#161c2b] rounded-xl border border-slate-200/60 dark:border-slate-800 h-10 px-2 mx-1">
          <div
            ref={sliderRef}
            className="flex gap-1.5 overflow-x-auto w-full py-1 scrollbar-hide items-center px-1"
          >
            {questions.map((q, idx) => {
              const state = getQuestionPaletteState(q, idx)
              const isActive = idx === currentIndex

              let btnClasses = "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400"
              
              if (state === "marked_answered") {
                btnClasses = "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-400 dark:border-purple-600 ring-1 ring-purple-500/30"
              } else if (state === "marked") {
                btnClasses = "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-400 dark:border-amber-600"
              } else if (state === "answered") {
                btnClasses = "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-600"
              }

              return (
                <button
                  key={q.question_id || q.id}
                  onClick={() => goToQuestion(idx)}
                  className={`shrink-0 min-w-[30px] h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer border ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 scale-105 shadow-md ring-2 ring-blue-500/40 active-pill"
                      : btnClasses
                  }`}
                  title={`Question ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Tools: Countdown Timer + Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {timeLeft !== null && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs sm:text-sm font-bold border transition-colors ${
                timeLeft < 300
                  ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 animate-pulse"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}

          <ThemeToggle />
        </div>
      </header>

      {/* ─── 2. MAIN EXAM WORKSPACE ──────────────────────────────────── */}
      <main className="flex flex-col lg:flex-row lg:flex-1 lg:overflow-hidden w-full overflow-x-hidden">

        {/* ── LEFT PANE: Question Details & Tags ──────────────────────── */}
        <section className="w-full max-w-full lg:w-[48%] lg:min-w-[35%] lg:max-w-[65%] border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#111622] transition-colors lg:h-full lg:overflow-y-auto custom-scrollbar flex flex-col">
          <div className="p-4 sm:p-6 lg:p-8 flex-1">
            
            {/* Badges and Review Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50">
                  Question {currentIndex + 1} of {questions.length}
                </span>

                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {qType}
                </span>

                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30">
                  +{currentQ.marks ?? currentQ.marks_override ?? 1} Mark{(currentQ.marks > 1 || currentQ.marks_override > 1) ? "s" : ""}
                </span>
              </div>

              {/* Mark for Review Checkbox/Button */}
              <button
                onClick={toggleMarkForReview}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition border cursor-pointer ${
                  isCurrentMarked
                    ? "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                    : "bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <svg
                  className={`w-3.5 h-3.5 ${isCurrentMarked ? "fill-amber-500 text-amber-500" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span>{isCurrentMarked ? "Marked for Review" : "Mark for Review"}</span>
              </button>
            </div>

            {/* Question Text with smooth fade/slide */}
            <div
              key={currentQId}
              className={`question-content-transition ${
                direction === "next" ? "animate-slide-in-right" : "animate-slide-in-left"
              }`}
            >
              <h2 className="text-base sm:text-lg lg:text-xl font-medium text-slate-900 dark:text-slate-100 leading-relaxed break-words whitespace-pre-wrap">
                {currentQ.text}
              </h2>

              {/* Code Snippet inside Question if present */}
              {currentQ.code_snippet && (
                <div className="mt-4 p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs sm:text-sm overflow-x-auto border border-slate-800">
                  <pre>{currentQ.code_snippet}</pre>
                </div>
              )}

              {/* Subjective Guidance note */}
              {qType === "SUBJECTIVE" && (
                <div className="mt-6 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                  <svg className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    Compose a thorough explanation. Your submission is automatically synchronized and will be evaluated by the instructor.
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── RIGHT PANE: Answering Area ──────────────────────────────── */}
        <section className="flex-1 flex flex-col w-full min-w-0 bg-slate-50/50 dark:bg-[#0b0f17] lg:h-full lg:overflow-y-auto custom-scrollbar">
          
          {/* MCQ Mode */}
          {qType === "MCQ" && (
            <div
              key={`mcq-${currentQId}`}
              className={`p-4 sm:p-6 lg:p-10 w-full max-w-3xl mx-auto flex flex-col justify-center min-h-full ${
                direction === "next" ? "animate-slide-in-right" : "animate-slide-in-left"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Select single correct option
                </span>
                {currentAnswer.option_id && (
                  <button
                    onClick={handleClearResponse}
                    className="text-xs text-slate-500 hover:text-red-500 transition font-medium underline"
                  >
                    Clear Choice
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {(currentQ.options || []).map((opt, optIndex) => {
                  const isSelected = currentAnswer.option_id === opt.id
                  const optionLetters = ["A", "B", "C", "D", "E", "F"]
                  const letter = optionLetters[optIndex] || String(optIndex + 1)

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectMCQ(opt.id)}
                      className={`group relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 select-none ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/30 dark:border-blue-500 shadow-sm"
                          : "border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#111622]"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 border transition ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 group-hover:border-slate-400"
                        }`}
                      >
                        {letter}
                      </div>

                      <span
                        className={`text-sm sm:text-base font-medium flex-1 break-words ${
                          isSelected
                            ? "text-blue-950 dark:text-blue-100 font-semibold"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {opt.text}
                      </span>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* MSQ Mode (Multiple Select Questions) */}
          {qType === "MSQ" && (
            <div
              key={`msq-${currentQId}`}
              className={`p-4 sm:p-6 lg:p-10 w-full max-w-3xl mx-auto flex flex-col justify-center min-h-full ${
                direction === "next" ? "animate-slide-in-right" : "animate-slide-in-left"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Multiple answers may be correct (Select all that apply)
                </span>
                {Array.isArray(currentAnswer.option_ids) && currentAnswer.option_ids.length > 0 && (
                  <button
                    onClick={handleClearResponse}
                    className="text-xs text-slate-500 hover:text-red-500 transition font-medium underline"
                  >
                    Clear Choices
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {(currentQ.options || []).map((opt, optIndex) => {
                  const selectedIds = currentAnswer.option_ids || []
                  const isSelected = selectedIds.includes(opt.id)
                  const optionLetters = ["A", "B", "C", "D", "E", "F"]
                  const letter = optionLetters[optIndex] || String(optIndex + 1)

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleToggleMSQ(opt.id)}
                      className={`group relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 select-none ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/30 dark:border-indigo-500 shadow-sm"
                          : "border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#111622]"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "border-slate-300 dark:border-slate-600 group-hover:border-slate-400"
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 shrink-0">
                        {letter}.
                      </span>

                      <span
                        className={`text-sm sm:text-base font-medium flex-1 break-words ${
                          isSelected
                            ? "text-indigo-950 dark:text-indigo-100 font-semibold"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {opt.text}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Subjective Mode */}
          {qType === "SUBJECTIVE" && (
            <div
              key={`subj-${currentQId}`}
              className={`p-4 sm:p-6 lg:p-8 flex-1 flex flex-col ${
                direction === "next" ? "animate-slide-in-right" : "animate-slide-in-left"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Your Answer Response
                </label>
                <span className="text-xs text-slate-400">
                  {(currentAnswer.text || "").length} characters
                </span>
              </div>
              <textarea
                value={currentAnswer.text || ""}
                onChange={(e) => handleSubjectiveChange(e.target.value)}
                placeholder="Type your structured solution or essay here..."
                rows={14}
                className="w-full flex-1 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 font-sans text-sm sm:text-base leading-relaxed resize-none"
              />
            </div>
          )}

          {/* Coding IDE Mode */}
          {qType === "CODING" && (
            <div className="flex-1 flex flex-col h-full">
              {/* Language Toolbar */}
              <div className="h-11 bg-white dark:bg-[#111622] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Online Code Editor
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={currentAnswer.language || currentQ.language || "python"}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="python">Python 3</option>
                    <option value="javascript">JavaScript</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                  </select>

                  {/* Submission Status Pill */}
                  {codeSubmissions[currentQId] && (
                    <div className={`hidden sm:flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      codeSubmissions[currentQId].all_passed
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800"
                    }`}>
                      <span>{codeSubmissions[currentQId].all_passed ? "✓ Accepted" : "⚠ Partial"}</span>
                      <span className="font-normal opacity-80">({codeSubmissions[currentQId].passed_count}/{codeSubmissions[currentQId].total_count})</span>
                    </div>
                  )}

                  {/* Run Sample Tests */}
                  <button
                    onClick={handleRunCode}
                    disabled={isRunningCode || isSubmittingCode}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer shadow-xs"
                    title="Run code against sample test cases (does not save marks)"
                  >
                    {isRunningCode ? (
                      <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span>Run</span>
                  </button>

                  {/* Submit Code (All Test Cases + Real Time Evaluation) */}
                  <button
                    onClick={handleSubmitCode}
                    disabled={isSubmittingCode || isRunningCode}
                    className="flex items-center gap-1.5 px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
                    title="Submit code against all test cases & award marks immediately"
                  >
                    {isSubmittingCode ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span>Submit</span>
                  </button>
                </div>
              </div>

              {/* Monaco Editor Pane */}
              <div className="h-[300px] sm:h-[360px] lg:flex-1 relative border-b border-slate-200 dark:border-slate-800">
                <Editor
                  height="100%"
                  language={
                    (currentAnswer.language || currentQ.language || "python") === "cpp"
                      ? "cpp"
                      : (currentAnswer.language || currentQ.language || "python") === "javascript"
                      ? "javascript"
                      : (currentAnswer.language || currentQ.language || "python") === "java"
                      ? "java"
                      : "python"
                  }
                  value={currentAnswer.code ?? (currentQ.starter_code || "")}
                  onChange={(val) => handleCodeChange(val || "")}
                  theme={isDarkTheme ? "vs-dark" : "light"}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    wordWrap: "on",
                    padding: { top: 12 },
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    automaticLayout: true,
                  }}
                />
              </div>

              {/* Console Output Dock */}
              <div className="h-44 sm:h-52 flex flex-col shrink-0 bg-white dark:bg-[#0e121a]">
                <div className="h-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 bg-slate-50 dark:bg-slate-800/40 shrink-0">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Test Results Console
                  </span>
                  {codeOutputs[currentQId] && (
                    <button
                      onClick={() => setCodeOutputs((p) => ({ ...p, [currentQId]: "" }))}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex-1 p-3 font-mono text-xs overflow-y-auto bg-slate-950 text-slate-300">
                  {codeOutputs[currentQId] ? (
                    <pre className="whitespace-pre-wrap break-words">{codeOutputs[currentQId]}</pre>
                  ) : (
                    <span className="text-slate-600">{"// Click 'Run Tests' to compile and execute your code against test cases."}</span>
                  )}
                </div>
              </div>
            </div>
          )}

        </section>
      </main>

      {/* ─── 3. BOTTOM ACTIONS NAVIGATION BAR ────────────────────────── */}
      <footer className="sticky bottom-0 lg:relative z-20 h-14 sm:h-16 shrink-0 bg-white dark:bg-[#111622] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 sm:px-6 gap-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.04)]">
        
        {/* Previous Button */}
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0 || isSubmitting}
          className="flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded-xl font-semibold text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Action Center: Summary & Finish */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Submit Test Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40 transition cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Finish Test</span>
          </button>

          {/* Next / Save Button */}
          {currentIndex < questions.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 sm:px-6 py-2 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition active:scale-[0.98] cursor-pointer"
            >
              <span>Next</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 sm:px-6 py-2 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition active:scale-[0.98] cursor-pointer"
            >
              <span>Review & Submit</span>
            </button>
          )}
        </div>
      </footer>

      {/* ─── 4. SUBMIT CONFIRMATION MODAL ────────────────────────────── */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="max-w-md w-full rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Ready to submit your examination?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Please check your attempt overview below. Once submitted, you cannot revise your answers.
            </p>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/40 text-center">
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {answeredCount}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/80 dark:text-emerald-300">
                  Answered
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 text-center">
                <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                  {markedCount}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700/80 dark:text-amber-300">
                  For Review
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                <div className="text-xl font-black text-slate-700 dark:text-slate-300">
                  {questions.length - answeredCount}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Unanswered
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Back to Exam
              </button>

              <button
                type="button"
                onClick={() => submitExamAttempt(false)}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Grading & Submitting...</span>
                  </>
                ) : (
                  <span>Confirm Submission</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. TIME'S UP AUTO-SUBMIT BLUR MODAL ──────────────────────── */}
      {isTimeUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in select-none">
          <div className="max-w-md w-full rounded-2xl bg-white dark:bg-[#111622] border border-amber-400/40 dark:border-amber-500/30 p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
            {/* Ambient top glow */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-20 bg-amber-500/20 blur-2xl rounded-full pointer-events-none" />

            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-300 dark:border-amber-700/60 shadow-inner">
              {timeUpStatus === "done" ? (
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
              {timeUpStatus === "done" ? "Exam Submitted!" : "Time's Up!"}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              {timeUpStatus === "done" ? (
                quiz?.review_enabled !== false ? (
                  "Your answers have been graded and recorded. Redirecting to your performance review..."
                ) : (
                  "Your answers have been securely recorded. Review is not enabled for this quiz. Redirecting to dashboard..."
                )
              ) : (
                "Your exam time limit has ended. Please wait while we automatically synchronize and grade all your saved answers..."
              )}
            </p>

            {/* Progress / Status indicator */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-3">
              {timeUpStatus === "done" ? (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Responses Successfully Synchronized
                </span>
              ) : (
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2.5">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Auto-submitting your attempt...
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transition & Custom Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(148, 163, 184, 0.3); border-radius: 9999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(148, 163, 184, 0.5); }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.15s ease-out forwards;
        }
      `}} />
    </div>
  )
}