import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { getQuizInstructions, startExam } from "../../api/student"

export default function ExamInstructions() {
    const { quizCode } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [quiz, setQuiz] = useState(null)
    const [prefetchedQuestions, setPrefetchedQuestions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [starting, setStarting] = useState(false)

    useEffect(() => {
        const fetchInstructions = async () => {
            try {
                setLoading(true)
                setError("")

                const response = await getQuizInstructions(quizCode)
                setQuiz(response.data?.quiz)
                setPrefetchedQuestions(response.data?.questions || [])
            } catch (err) {
                console.error("Failed to load instructions:", err)
                setError(
                    err.response?.data?.detail ||
                    "Unable to load examination details. Please verify your access."
                )
            } finally {
                setLoading(false)
            }
        }

        fetchInstructions()
    }, [quizCode])

    const handleStartExam = async () => {
        if (!quiz) return

        try {
            setStarting(true)
            setError("")

            const response = await startExam(quiz.id)
            const attemptData = response.data

            // Store attempt info
            localStorage.setItem("attempt_id", attemptData.id)
            localStorage.setItem("current_quiz_code", quiz.quiz_code)

            // Navigate to quiz attempt portal with pre-loaded state
            navigate(`/quiz/${quiz.quiz_code}`, {
                state: {
                    attempt: attemptData,
                    prefetchedQuestions,
                    quiz,
                },
            })
        } catch (err) {
            console.error("Failed to start exam:", err)
            setError(
                err.response?.data?.detail ||
                "Failed to start the examination. Please check if the quiz is active."
            )
        } finally {
            setStarting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#131313] text-[#e5e2e1] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-mono text-sm text-[#8c909f] animate-pulse">
                        Preparing your examination environment...
                    </p>
                </div>
            </div>
        )
    }

    if (error && !quiz) {
        return (
            <div className="min-h-screen bg-[#131313] text-[#e5e2e1] flex items-center justify-center p-4">
                <div className="max-w-md w-full rounded-2xl bg-[#1c1b1b] border border-red-500/20 p-6 sm:p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 text-xl">
                        ✕
                    </div>
                    <h2 className="text-xl font-bold mb-2">Access Error</h2>
                    <p className="text-sm text-[#8c909f] mb-6">{error}</p>
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold transition"
                    >
                        Back to Student Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#131313] text-[#e5e2e1] flex flex-col">
            {/* Header */}
            <header className="border-b border-white/[0.06] bg-[#131313]/95 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white font-bold">
                            Q
                        </div>
                        <span className="text-base font-bold tracking-tight">Quiesy</span>
                        <span className="rounded bg-[#2a2a2a] px-2 py-0.5 font-mono text-[10px] text-blue-300">
                            EXAMINATION READY
                        </span>
                    </div>

                    <Link
                        to="/dashboard"
                        className="text-xs text-[#8c909f] hover:text-white transition"
                    >
                        ← Exit to Dashboard
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12">
                {error && (
                    <div className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
                        {error}
                    </div>
                )}

                {/* Exam Title Card */}
                <div className="rounded-2xl bg-[#1c1b1b] border border-white/[0.06] p-6 sm:p-8 mb-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <span className="px-3 py-1 rounded-md font-mono text-xs font-semibold bg-blue-500/10 text-blue-400 uppercase tracking-wider">
                            {quiz?.subject || "Examination"}
                        </span>
                        <span className="font-mono text-xs text-[#8c909f]">
                            Code: <strong className="text-white">{quiz?.quiz_code}</strong>
                        </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                        {quiz?.title}
                    </h1>

                    <p className="text-sm text-[#8c909f] mb-6">
                        Instructor: <strong className="text-[#c2c6d6]">{quiz?.teacher_name}</strong>
                    </p>

                    {quiz?.description && (
                        <p className="text-sm leading-relaxed text-[#c2c6d6] bg-[#141414] p-4 rounded-xl border border-white/[0.04]">
                            {quiz?.description}
                        </p>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                        <div className="rounded-xl bg-[#20201f] p-4 text-center">
                            <p className="text-xs font-mono text-[#8c909f] uppercase tracking-wider">Duration</p>
                            <p className="text-xl font-bold text-white mt-1">
                                {quiz?.duration_minutes} <span className="text-xs font-normal text-[#8c909f]">mins</span>
                            </p>
                        </div>

                        <div className="rounded-xl bg-[#20201f] p-4 text-center">
                            <p className="text-xs font-mono text-[#8c909f] uppercase tracking-wider">Questions</p>
                            <p className="text-xl font-bold text-white mt-1">
                                {quiz?.total_questions || prefetchedQuestions.length}
                            </p>
                        </div>

                        <div className="rounded-xl bg-[#20201f] p-4 text-center">
                            <p className="text-xs font-mono text-[#8c909f] uppercase tracking-wider">Total Marks</p>
                            <p className="text-xl font-bold text-white mt-1">
                                {quiz?.total_marks ?? "—"}
                            </p>
                        </div>

                        <div className="rounded-xl bg-[#20201f] p-4 text-center">
                            <p className="text-xs font-mono text-[#8c909f] uppercase tracking-wider">Max Attempts</p>
                            <p className="text-xl font-bold text-white mt-1">
                                {quiz?.max_attempts}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Instructions & Guidelines */}
                <div className="rounded-2xl bg-[#1c1b1b] border border-white/[0.06] p-6 sm:p-8 mb-8">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Important Examination Guidelines
                    </h2>

                    <ul className="space-y-3 text-sm text-[#c2c6d6] leading-relaxed">
                        <li className="flex items-start gap-3">
                            <span className="text-blue-400 font-bold font-mono">1.</span>
                            <span>
                                Once you click <strong>"Start Examination Now"</strong>, the timer will begin immediately and cannot be paused.
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-blue-400 font-bold font-mono">2.</span>
                            <span>
                                Questions are already pre-loaded into your browser for a fast and distraction-free experience.
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-blue-400 font-bold font-mono">3.</span>
                            <span>
                                Your answers are automatically saved as you navigate through the questions.
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-blue-400 font-bold font-mono">4.</span>
                            <span>
                                If time expires before manual submission, your saved answers will be automatically submitted.
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-blue-400 font-bold font-mono">5.</span>
                            <span>
                                Please ensure a stable internet connection and avoid closing or reloading your browser tab.
                            </span>
                        </li>
                    </ul>
                </div>

                {/* Start Action Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-[#1c1b1b] border border-white/[0.06] p-5 sm:p-6">
                    <div className="text-center sm:text-left">
                        <p className="text-sm font-semibold text-white">Ready to begin?</p>
                        <p className="text-xs text-[#8c909f] mt-0.5">
                            Candidate: <span className="text-blue-400">{user?.name || user?.email}</span>
                        </p>
                    </div>

                    <button
                        onClick={handleStartExam}
                        disabled={starting || quiz?.status !== "ACTIVE"}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-[#2a2a2a] disabled:text-[#737686] disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                    >
                        {starting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Starting Exam...
                            </>
                        ) : quiz?.status === "ACTIVE" ? (
                            <>
                                Start Examination Now
                                <span>→</span>
                            </>
                        ) : (
                            "Exam is Scheduled (Not Active Yet)"
                        )}
                    </button>
                </div>
            </main>
        </div>
    )
}
