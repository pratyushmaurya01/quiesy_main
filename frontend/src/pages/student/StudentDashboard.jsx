import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import {
    getMyAttempts,
    getStudentQuizzes,
    joinQuiz,
} from "../../api/student"

export default function StudentDashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [activeTab, setActiveTab] = useState("available") // "available" | "history"
    const [quizzes, setQuizzes] = useState([])
    const [attempts, setAttempts] = useState([])
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(true)
    const [historyLoading, setHistoryLoading] = useState(true)
    const [error, setError] = useState("")
    const [joinLoading, setJoinLoading] = useState(false)


    const [passwordModal, setPasswordModal] = useState(null)
    const [password, setPassword] = useState("")

    const loadQuizzes = async (value = "") => {
        try {
            setLoading(true)
            setError("")

            const response = await getStudentQuizzes(value)

            setQuizzes(
                response.data?.results || []
            )
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to load examinations."
            )
        } finally {
            setLoading(false)
        }
    }

    const loadAttempts = async () => {
        try {
            setHistoryLoading(true)
            const response = await getMyAttempts()
            const list = Array.isArray(response.data)
                ? response.data
                : (response.data?.results || [])
            setAttempts(list)
        } catch (err) {
            console.error("Failed to load past attempts:", err)
        } finally {
            setHistoryLoading(false)
        }
    }

    useEffect(() => {
        loadQuizzes()
        loadAttempts()
    }, [])


    useEffect(() => {
        const timer = setTimeout(() => {
            loadQuizzes(search)
        }, 350)

        return () => clearTimeout(timer)
    }, [search])

    const handleJoin = async (quiz) => {
        try {
            setJoinLoading(true)
            setError("")

            await joinQuiz(
                quiz.quiz_code
            )

            navigate(`/exam/${quiz.quiz_code}/instructions`)
        } catch (err) {
            const detail =
                err.response?.data?.detail

            if (
                detail ===
                "Quiz password is required."
            ) {
                setPasswordModal(quiz)
                setPassword("")
            } else {
                setError(
                    detail ||
                    "Unable to join this quiz."
                )
            }
        } finally {
            setJoinLoading(false)
        }
    }

    const handlePasswordJoin = async () => {
        if (!password.trim()) {
            return
        }

        try {
            setJoinLoading(true)
            setError("")

            const quizCode = passwordModal.quiz_code

            await joinQuiz(
                quizCode,
                password
            )

            setPasswordModal(null)
            setPassword("")

            navigate(`/exam/${quizCode}/instructions`)
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to join this quiz."
            )
        } finally {
            setJoinLoading(false)
        }
    }

    const getStatusLabel = (status) => {
        if (status === "ACTIVE") {
            return "Active Now"
        }

        if (status === "SCHEDULED") {
            return "Scheduled"
        }

        return status
    }

    const getStatusClass = (status) => {
        if (status === "ACTIVE") {
            return "bg-emerald-500/10 text-emerald-400"
        }

        return "bg-blue-500/10 text-blue-300"
    }

    return (
        <div className="min-h-screen bg-[#131313] text-[#e5e2e1]">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#131313]/95 backdrop-blur-xl">
                <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600">
                                <span className="text-lg font-bold text-white">
                                    Q
                                </span>
                            </div>

                            <span className="text-base font-bold tracking-tight">
                                Quiesy
                            </span>

                            <span className="hidden rounded bg-[#2a2a2a] px-2 py-1 font-mono text-[10px] font-medium tracking-wide text-blue-300 sm:inline">
                                STUDENT
                            </span>
                        </div>

                        <nav className="hidden items-center gap-1 lg:flex">
                            <button
                                className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                                    activeTab === "available"
                                        ? "bg-[#2a2a2a] text-white"
                                        : "text-[#c2c6d6] hover:bg-[#2a2a2a] hover:text-white"
                                }`}
                                onClick={() => setActiveTab("available")}
                                type="button"
                            >
                                Dashboard
                            </button>

                            <button
                                className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                                    activeTab === "available"
                                        ? "text-white hover:bg-[#2a2a2a]"
                                        : "text-[#c2c6d6] hover:bg-[#2a2a2a] hover:text-white"
                                }`}
                                onClick={() => setActiveTab("available")}
                                type="button"
                            >
                                Exams
                            </button>

                            <button
                                className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                                    activeTab === "history"
                                        ? "bg-[#2a2a2a] text-white"
                                        : "text-[#c2c6d6] hover:bg-[#2a2a2a] hover:text-white"
                                }`}
                                onClick={() => setActiveTab("history")}
                                type="button"
                            >
                                Results
                            </button>
                        </nav>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden min-w-[180px] items-center gap-2 rounded bg-[#1c1b1b] px-3 py-2 text-xs text-[#8c909f] sm:flex">
                            <span>⌕</span>
                            <span>Quick search...</span>
                            <kbd className="ml-auto rounded bg-[#353535] px-1.5 py-0.5 font-mono text-[9px]">
                                ⌘K
                            </kbd>
                        </div>

                        <button
                            className="relative rounded p-2 text-[#c2c6d6] hover:bg-[#2a2a2a]"
                            type="button"
                        >
                            <span className="text-lg">
                                ♢
                            </span>

                            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
                        </button>

                        <div className="hidden text-right md:block">
                            <p className="text-xs font-medium text-white">
                                {user?.name || "Student"}
                            </p>

                            <p className="font-mono text-[10px] text-[#737686]">
                                STUDENT
                            </p>
                        </div>

                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
                            {(user?.name || "S")
                                .charAt(0)
                                .toUpperCase()}
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                {/* Welcome */}
                <section className="mb-8">
                    <div className="mb-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                        <div>
                            <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wide text-blue-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                Student Access Verified
                            </div>

                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                Welcome back,{" "}
                                {user?.name || "Student"}
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#c2c6d6]">
                                Find an examination, join it,
                                and start your assessment when
                                the examination window is active.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <button
                                className={`cursor-pointer rounded-lg px-4 py-3 text-left transition ${
                                    activeTab === "available"
                                        ? "bg-blue-600/15 border border-blue-500/40"
                                        : "bg-[#1c1b1b] border border-transparent hover:bg-[#20201f]"
                                }`}
                                onClick={() => setActiveTab("available")}
                                type="button"
                            >
                                <p className="font-mono text-[10px] uppercase tracking-wider text-[#8c909f]">
                                    Available Exams
                                </p>

                                <p className="mt-1 text-xl font-semibold text-white">
                                    {loading
                                         ? "—"
                                         : quizzes.length}
                                </p>
                            </button>

                            <button
                                className={`cursor-pointer rounded-lg px-4 py-3 text-left transition ${
                                    activeTab === "history"
                                        ? "bg-blue-600/15 border border-blue-500/40"
                                        : "bg-[#1c1b1b] border border-transparent hover:bg-[#20201f]"
                                }`}
                                onClick={() => setActiveTab("history")}
                                type="button"
                            >
                                <p className="font-mono text-[10px] uppercase tracking-wider text-[#8c909f]">
                                    My Submissions & Results
                                </p>

                                <p className="mt-1 text-xl font-semibold text-white">
                                    {historyLoading ? "—" : attempts.length}
                                </p>
                            </button>
                        </div>
                    </div>
                </section>

                {/* Error */}
                {error && (
                    <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                        <span>{error}</span>

                        <button
                            className="text-xs font-medium underline"
                            onClick={() => setError("")}
                            type="button"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Tabs bar */}
                <div className="mb-8 flex items-center gap-3 border-b border-white/[0.08] pb-4">
                    <button
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                            activeTab === "available"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-[#1c1b1b] text-[#8c909f] hover:bg-[#252525] hover:text-white"
                        }`}
                        onClick={() => setActiveTab("available")}
                        type="button"
                    >
                        <span>📝</span>
                        <span>Available Exams</span>
                        <span className="rounded-full bg-black/30 px-2 py-0.5 font-mono text-xs">
                            {quizzes.length}
                        </span>
                    </button>

                    <button
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                            activeTab === "history"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-[#1c1b1b] text-[#8c909f] hover:bg-[#252525] hover:text-white"
                        }`}
                        onClick={() => setActiveTab("history")}
                        type="button"
                    >
                        <span>🏆</span>
                        <span>My Results & History</span>
                        <span className="rounded-full bg-black/30 px-2 py-0.5 font-mono text-xs">
                            {attempts.length}
                        </span>
                    </button>
                </div>

                {activeTab === "available" ? (
                    /* Search & Discover */
                    <section className="mb-10">
                        <div className="mb-5">
                            <span className="font-mono text-[10px] uppercase tracking-wide text-blue-400">
                                Examination Explorer
                            </span>

                            <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                                Search & Discover Examinations
                            </h2>
                        </div>

                        <div className="mb-5 rounded-xl bg-[#1c1b1b] p-4 sm:p-5">
                            <div className="relative">
                                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#8c909f]">
                                    ⌕
                                </span>

                                <input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(
                                            event.target.value
                                        )
                                    }
                                    className="h-12 w-full rounded-lg bg-[#20201f] pl-11 pr-4 text-sm text-white outline-none ring-1 ring-transparent transition placeholder:text-[#737686] focus:ring-blue-500"
                                    placeholder="Search exams by quiz title, subject, topic, or teacher..."
                                    type="text"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {[1, 2, 3].map((item) => (
                                    <div
                                        key={item}
                                        className="h-72 animate-pulse rounded-xl bg-[#1c1b1b]"
                                    />
                                ))}
                            </div>
                        ) : quizzes.length === 0 ? (
                            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl bg-[#1c1b1b] px-6 text-center">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#2a2a2a] text-xl text-[#737686]">
                                    ⌕
                                </div>

                                <h3 className="font-semibold">
                                    No examinations found
                                </h3>

                                <p className="mt-2 max-w-md text-sm text-[#8c909f]">
                                    No active or scheduled examinations
                                    match your search.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {quizzes.map((quiz) => (
                                    <article
                                        key={quiz.id}
                                        className="group flex min-h-[310px] flex-col justify-between overflow-hidden rounded-xl bg-[#1c1b1b] shadow-sm transition hover:bg-[#20201f]"
                                    >
                                        <div className="p-5">
                                            <div className="mb-4 flex items-center justify-between gap-3">
                                                <span
                                                    className={`rounded px-2.5 py-1 font-mono text-[10px] font-medium ${getStatusClass(
                                                        quiz.status
                                                    )}`}
                                                >
                                                    {getStatusLabel(
                                                        quiz.status
                                                    )}
                                                </span>

                                                <span className="font-mono text-[10px] text-[#737686]">
                                                    {quiz.quiz_code}
                                                </span>
                                            </div>

                                            <p className="font-mono text-[10px] uppercase tracking-wide text-blue-400">
                                                {quiz.subject}
                                            </p>

                                            <h3 className="mt-1 text-lg font-semibold leading-6 text-white transition group-hover:text-blue-300">
                                                {quiz.title}
                                            </h3>

                                            <p className="mt-3 line-clamp-3 text-sm leading-5 text-[#c2c6d6]">
                                                {quiz.description ||
                                                    "No description provided for this examination."}
                                            </p>

                                            <div className="mt-5 flex items-center gap-2 text-sm text-[#8c909f]">
                                                <span>Teacher</span>

                                                <span className="text-white">
                                                    {quiz.teacher_name}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="border-t border-white/[0.04] bg-[#0e0e0e]/50 p-5">
                                            <div className="mb-4 flex items-center justify-between gap-3 font-mono text-[10px] text-[#8c909f]">
                                                <span>
                                                    {quiz.duration_minutes}{" "}
                                                    mins
                                                </span>

                                                <span>
                                                    Max attempts:{" "}
                                                    {
                                                        quiz.max_attempts
                                                    }
                                                </span>
                                            </div>

                                            <button
                                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                                disabled={
                                                    joinLoading
                                                }
                                                onClick={() =>
                                                    handleJoin(
                                                        quiz
                                                    )
                                                }
                                                type="button"
                                            >
                                                Join Exam
                                                <span>
                                                    →
                                                </span>
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                ) : (
                    /* Past Attempts & Results History */
                    <section className="mb-10">
                        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                            <div>
                                <span className="font-mono text-[10px] uppercase tracking-wide text-emerald-400">
                                    Submissions & Evaluations
                                </span>

                                <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                                    My Examination Attempts & Performance
                                </h2>
                            </div>

                            <button
                                onClick={loadAttempts}
                                className="inline-flex items-center gap-1.5 self-start rounded-lg bg-[#1c1b1b] px-3 py-1.5 text-xs text-[#8c909f] transition hover:bg-[#252525] hover:text-white"
                                type="button"
                            >
                                <span>↻</span>
                                <span>Refresh History</span>
                            </button>
                        </div>

                        {historyLoading ? (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {[1, 2, 3].map((item) => (
                                    <div
                                        key={item}
                                        className="h-64 animate-pulse rounded-xl bg-[#1c1b1b]"
                                    />
                                ))}
                            </div>
                        ) : attempts.length === 0 ? (
                            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl bg-[#1c1b1b] px-6 text-center">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#2a2a2a] text-xl text-[#737686]">
                                    📋
                                </div>

                                <h3 className="font-semibold text-white">
                                    No past examination attempts
                                </h3>

                                <p className="mt-2 max-w-md text-sm text-[#8c909f]">
                                    You haven't submitted any quizzes or examinations yet. Once you complete an exam, your scores and review solutions will appear here.
                                </p>

                                <button
                                    onClick={() => setActiveTab("available")}
                                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
                                    type="button"
                                >
                                    Browse Available Exams →
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {attempts.map((att) => {
                                    const submittedDate = att.submitted_at
                                        ? new Date(att.submitted_at).toLocaleDateString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                          })
                                        : "In Progress"

                                    const isReviewAllowed = Boolean(att.quiz?.review_enabled)

                                    return (
                                        <article
                                            key={att.id}
                                            className="group flex flex-col justify-between overflow-hidden rounded-xl border border-white/[0.04] bg-[#1c1b1b] shadow-sm transition hover:border-white/[0.1] hover:bg-[#20201f]"
                                        >
                                            <div className="p-5">
                                                <div className="mb-4 flex items-center justify-between gap-3">
                                                    <span
                                                        className={`rounded px-2.5 py-1 font-mono text-[10px] font-medium ${
                                                            att.status === "SUBMITTED" || att.status === "EVALUATED"
                                                                ? "bg-emerald-500/10 text-emerald-400"
                                                                : att.status === "EXPIRED"
                                                                ? "bg-amber-500/10 text-amber-400"
                                                                : "bg-blue-500/10 text-blue-300"
                                                        }`}
                                                    >
                                                        {att.status}
                                                    </span>

                                                    <span className="font-mono text-[10px] text-[#737686]">
                                                        {att.quiz?.quiz_code}
                                                    </span>
                                                </div>

                                                <p className="font-mono text-[10px] uppercase tracking-wide text-blue-400">
                                                    {att.quiz?.subject || "General"}
                                                </p>

                                                <h3 className="mt-1 text-lg font-semibold leading-6 text-white transition group-hover:text-blue-300">
                                                    {att.quiz?.title || "Examination"}
                                                </h3>

                                                <div className="mt-3 flex items-center gap-2 text-xs text-[#8c909f]">
                                                    <span>Instructor:</span>
                                                    <span className="font-medium text-white">
                                                        {att.quiz?.teacher_name || "Instructor"}
                                                    </span>
                                                </div>

                                                {/* Score Card Section */}
                                                <div className="mt-5 rounded-lg border border-white/[0.04] bg-[#141414] p-3">
                                                    <div className="flex items-end justify-between">
                                                        <div>
                                                            <p className="font-mono text-[10px] uppercase tracking-wider text-[#8c909f]">
                                                                Score Achieved
                                                            </p>
                                                            <p className="mt-1 text-xl font-bold text-white">
                                                                {att.score}
                                                                <span className="text-xs font-normal text-[#8c909f]">
                                                                    {" "}/ {att.max_score} Pts
                                                                </span>
                                                            </p>
                                                        </div>

                                                        <div className="text-right">
                                                            <span
                                                                className={`inline-block rounded px-2 py-0.5 font-mono text-xs font-bold ${
                                                                    att.percentage >= 75
                                                                        ? "bg-emerald-500/15 text-emerald-400"
                                                                        : att.percentage >= 40
                                                                        ? "bg-blue-500/15 text-blue-300"
                                                                        : "bg-rose-500/15 text-rose-400"
                                                                }`}
                                                            >
                                                                {att.percentage}%
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <p className="mt-2 font-mono text-[10px] text-[#737686]">
                                                        Submitted: {submittedDate}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action / Review Button */}
                                            <div className="border-t border-white/[0.04] bg-[#0e0e0e]/50 p-5">
                                                {isReviewAllowed ? (
                                                    <Link
                                                        to={`/review/${att.id}`}
                                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
                                                    >
                                                        <span>View Solutions & Review</span>
                                                        <span>→</span>
                                                    </Link>
                                                ) : (
                                                    <div className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-[#252525] px-4 py-2.5 text-xs font-medium text-[#8c909f]">
                                                        <span>🔒</span>
                                                        <span>Review Disabled by Instructor</span>
                                                    </div>
                                                )}
                                            </div>
                                        </article>
                                    )
                                })}
                            </div>
                        )}
                    </section>
                )}
            </main>

            {/* Password Modal */}
            {passwordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl bg-[#20201f] p-6 shadow-2xl">
                        <div className="mb-5">
                            <p className="font-mono text-[10px] uppercase tracking-wide text-blue-400">
                                Password Protected
                            </p>

                            <h2 className="mt-1 text-xl font-semibold">
                                {passwordModal.title}
                            </h2>

                            <p className="mt-2 text-sm text-[#8c909f]">
                                Enter the quiz password to continue.
                            </p>
                        </div>

                        <input
                            autoFocus
                            value={password}
                            onChange={(event) =>
                                setPassword(
                                    event.target.value
                                )
                            }
                            onKeyDown={(event) => {
                                if (
                                    event.key ===
                                    "Enter"
                                ) {
                                    handlePasswordJoin()
                                }
                            }}
                            className="mb-4 h-11 w-full rounded-lg bg-[#131313] px-4 text-sm text-white outline-none ring-1 ring-[#353535] focus:ring-blue-500"
                            placeholder="Quiz password"
                            type="password"
                        />

                        <div className="flex gap-3">
                            <button
                                className="flex-1 rounded-lg bg-[#353535] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#424242]"
                                onClick={() => {
                                    setPasswordModal(
                                        null
                                    )
                                    setPassword("")
                                }}
                                type="button"
                            >
                                Cancel
                            </button>

                            <button
                                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                                disabled={
                                    joinLoading ||
                                    !password.trim()
                                }
                                onClick={
                                    handlePasswordJoin
                                }
                                type="button"
                            >
                                {joinLoading
                                    ? "Joining..."
                                    : "Join Exam"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}