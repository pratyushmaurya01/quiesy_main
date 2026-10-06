import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { motion } from "framer-motion"
import {
    getMyAttempts,
    getStudentQuizzes,
    joinQuiz,
} from "../../api/student"

export default function StudentDashboard() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await logout()
        navigate("/")
    }


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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 300, damping: 24 }
        }
    }

    return (
        <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible"
            className="min-h-screen bg-[#101114] text-slate-100 font-sans selection:bg-blue-600 selection:text-white"
        >
            {/* Top Horizontal Navigation Bar */}
            <motion.header variants={itemVariants} className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#141518]/95 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
                    {/* Left: Brand + Student Badge + Nav Links */}
                    <div className="flex items-center gap-8">
                        <Link to="/student" className="flex items-center gap-2 group">
                            <span className="text-lg font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                                Quiesy
                            </span>
                            <span className="rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wider text-blue-400">
                                STUDENT
                            </span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-2">
                            <button
                                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all btn-tactile cursor-pointer ${
                                    activeTab === "available"
                                        ? "bg-[#1E2128] text-white border border-[#3A3F47] shadow-xs"
                                        : "text-slate-400 hover:text-slate-200 hover:bg-[#1A1D24]"
                                }`}
                                onClick={() => setActiveTab("available")}
                                type="button"
                            >
                                Dashboard
                            </button>

                            <button
                                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all btn-tactile cursor-pointer ${
                                    activeTab === "available"
                                        ? "text-blue-400 hover:bg-[#1A1D24]"
                                        : "text-slate-400 hover:text-slate-200 hover:bg-[#1A1D24]"
                                }`}
                                onClick={() => setActiveTab("available")}
                                type="button"
                            >
                                Exams
                            </button>

                            <button
                                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all btn-tactile cursor-pointer ${
                                    activeTab === "history"
                                        ? "bg-[#1E2128] text-white border border-[#3A3F47] shadow-xs"
                                        : "text-slate-400 hover:text-slate-200 hover:bg-[#1A1D24]"
                                }`}
                                onClick={() => setActiveTab("history")}
                                type="button"
                            >
                                Results
                            </button>
                        </nav>
                    </div>

                    {/* Right: user profile & logout */}
                    <div className="flex items-center gap-3">
                        {/* Profile Info */}
                        <div className="text-right">
                            <p className="text-xs font-semibold text-white leading-tight">
                                {user?.name || "Student"}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                STUDENT
                            </p>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            title="Sign out"
                            type="button"
                            className="h-8 px-2.5 rounded-lg border border-slate-700/80 bg-[#1E2128] hover:bg-[#252830] text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 btn-tactile cursor-pointer ml-1"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </motion.header>


            <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                {/* Welcome Section & Unified Stats Cards */}
                <motion.section variants={itemVariants} className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
                        {/* Welcome text & subtext */}
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                Student Access Verified
                            </div>

                            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
                                Welcome back, {user?.name || "Student"}
                            </h1>

                            <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-slate-400 leading-relaxed">
                                Find an examination, join it, and start your assessment when the examination window is active.
                            </p>

                            {/* Filter / Toggle Buttons directly below the welcome text */}
                            <div className="flex items-center gap-2.5 mt-5">
                                <button
                                    onClick={() => setActiveTab("available")}
                                    type="button"
                                    className={`inline-flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold transition-all btn-tactile cursor-pointer ${
                                        activeTab === "available"
                                            ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                                            : "bg-[#1E2128] border border-[#3A3F47] text-slate-300 hover:bg-[#252830] hover:text-white"
                                    }`}
                                >
                                    <span>Available Exams</span>
                                    <span className="rounded-full bg-black/25 px-2 py-0.5 font-mono text-[10px] font-bold">
                                        {quizzes.length}
                                    </span>
                                </button>

                                <button
                                    onClick={() => setActiveTab("history")}
                                    type="button"
                                    className={`inline-flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold transition-all btn-tactile cursor-pointer ${
                                        activeTab === "history"
                                            ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                                            : "bg-[#1E2128] border border-[#3A3F47] text-slate-300 hover:bg-[#252830] hover:text-white"
                                    }`}
                                >
                                    <span>My Results & History</span>
                                    <span className="rounded-full bg-black/25 px-2 py-0.5 font-mono text-[10px] font-bold">
                                        {attempts.length}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Unified Top-Right Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 shrink-0 w-full lg:w-auto min-w-[340px] sm:min-w-[420px]">
                            {/* Card 1: Available Exams */}
                            <motion.div
                                variants={itemVariants}
                                onClick={() => setActiveTab("available")}
                                className="group relative overflow-hidden rounded-xl border border-slate-800 bg-[#141518] hover:border-slate-700 p-4 transition-all duration-200 cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.04)] btn-tactile"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        AVAILABLE EXAMS
                                    </span>
                                    <span className="h-6 w-6 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold">
                                        📝
                                    </span>
                                </div>
                                <div className="mt-3 flex items-baseline gap-2">
                                    <span className="text-3xl font-extrabold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                                        {loading ? "—" : quizzes.length}
                                    </span>
                                    <span className="text-[11px] font-medium text-slate-500">
                                        ready to take
                                    </span>
                                </div>
                            </motion.div>

                            {/* Card 2: My Submissions & Results */}
                            <motion.div
                                variants={itemVariants}
                                onClick={() => setActiveTab("history")}
                                className="group relative overflow-hidden rounded-xl border border-slate-800 bg-[#141518] hover:border-slate-700 p-4 transition-all duration-200 cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.04)] btn-tactile"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        MY SUBMISSIONS & RESULTS
                                    </span>
                                    <span className="h-6 w-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold">
                                        🏆
                                    </span>
                                </div>
                                <div className="mt-3 flex items-baseline gap-2">
                                    <span className="text-3xl font-extrabold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                                        {historyLoading ? "—" : attempts.length}
                                    </span>
                                    <span className="text-[11px] font-medium text-slate-500">
                                        evaluated
                                    </span>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.section>

                {/* Error */}
                {error && (
                    <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
                        <span>{error}</span>

                        <button
                            className="text-xs font-semibold text-red-400 hover:text-red-300 underline cursor-pointer"
                            onClick={() => setError("")}
                            type="button"
                        >
                            Dismiss
                        </button>
                    </div>
                )}


                {activeTab === "available" ? (
                    /* Search & Discover */
                    <motion.section variants={itemVariants} className="mb-10">
                        <div className="mb-5 flex flex-col justify-between gap-1 sm:flex-row sm:items-end">
                            <div>
                                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-400">
                                    Examination Explorer
                                </span>
                                <h2 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
                                    Search & Discover Examinations
                                </h2>
                            </div>
                            <p className="text-xs text-slate-400">
                                Showing {quizzes.length} available {quizzes.length === 1 ? "exam" : "exams"}
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="mb-6 rounded-xl border border-slate-800 bg-[#141518] p-3 sm:p-4 shadow-sm">
                            <div className="relative">
                                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </span>

                                <input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(
                                            event.target.value
                                        )
                                    }
                                    className="focus-ring-smooth h-11 w-full rounded-lg border border-[#3A3F47] bg-[#2A2D35] pl-11 pr-4 text-sm text-white placeholder-slate-400 transition"
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
                                        className="h-72 animate-pulse rounded-xl border border-slate-800 bg-[#141518]"
                                    />
                                ))}
                            </div>
                        ) : quizzes.length === 0 ? (
                            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-slate-800 bg-[#141518] px-6 text-center">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/60 text-xl text-slate-400">
                                    ⌕
                                </div>

                                <h3 className="font-semibold text-white">
                                    No examinations found
                                </h3>

                                <p className="mt-2 max-w-md text-sm text-slate-400">
                                    No active or scheduled examinations match your search.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {quizzes.map((quiz) => {
                                    // Fix typo like "discription" -> "description" cleanly
                                    const cleanedDescription = quiz.description
                                        ? quiz.description.replace(/discription/gi, "description")
                                        : "No description provided for this examination."

                                    return (
                                        <motion.article
                                            variants={itemVariants}
                                            key={quiz.id}
                                            className="group flex min-h-[320px] flex-col justify-between overflow-hidden rounded-xl border border-slate-800 bg-[#141518] hover:border-slate-700 hover:bg-[#181A20] transition-all duration-200 shadow-sm"
                                        >
                                            <div className="p-5">
                                                {/* Header Badges: Status, Code, Subject */}
                                                <div className="mb-3 flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`rounded-md px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                                                                quiz.status === "ACTIVE"
                                                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                                    : quiz.status === "SCHEDULED"
                                                                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                                    : "bg-slate-800 text-slate-300 border border-slate-700"
                                                            }`}
                                                        >
                                                            {quiz.status === "ACTIVE" ? "Active Now" : getStatusLabel(quiz.status)}
                                                        </span>
                                                        <span className="rounded-md border border-slate-800 bg-[#1E2128] px-2 py-0.5 font-mono text-[10px] font-bold text-slate-300">
                                                            {quiz.quiz_code}
                                                        </span>
                                                    </div>

                                                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-400">
                                                        {quiz.subject || "GENERAL"}
                                                    </span>
                                                </div>

                                                <h3 className="text-lg font-bold leading-6 text-white group-hover:text-blue-400 transition-colors">
                                                    {quiz.title}
                                                </h3>

                                                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-400">
                                                    {cleanedDescription}
                                                </p>

                                                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                                                    <span>Instructor:</span>
                                                    <span className="font-medium text-slate-200">
                                                        {quiz.teacher_name || "Instructor"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="border-t border-slate-800/80 bg-[#101114]/60 p-4">
                                                <div className="mb-3 flex items-center justify-between gap-3 font-mono text-[11px] text-slate-400">
                                                    <span className="flex items-center gap-1.5">
                                                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        {quiz.duration_minutes} mins
                                                    </span>

                                                    <span>
                                                        Max attempts: {quiz.max_attempts}
                                                    </span>
                                                </div>

                                                <button
                                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm btn-tactile cursor-pointer"
                                                    disabled={joinLoading}
                                                    onClick={() => handleJoin(quiz)}
                                                    type="button"
                                                >
                                                    <span>Join Exam</span>
                                                    <span>→</span>
                                                </button>
                                            </div>
                                        </motion.article>
                                    )
                                })}
                            </div>
                        )}
                    </motion.section>
                ) : (
                    /* Past Attempts & Results History */
                    <motion.section variants={itemVariants} className="mb-10">
                        {/* Section Header */}
                        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                            <div>
                                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                    Performance Analytics & Records
                                </span>
                                <h2 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
                                    My Examination Attempts & Performance
                                </h2>
                            </div>

                            <button
                                onClick={loadAttempts}
                                className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-800 bg-[#141518] px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-700 hover:text-white hover:bg-[#181A20] shadow-xs cursor-pointer btn-tactile"
                                type="button"
                            >
                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Refresh History</span>
                            </button>
                        </div>

                        {/* Student Performance Summary Stats Cards */}
                        {!historyLoading && attempts.length > 0 && (() => {
                            const completedAttempts = attempts.filter(a => a.status === "SUBMITTED" || a.status === "EVALUATED")
                            const avgPercentage = completedAttempts.length > 0
                                ? Math.round(completedAttempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / completedAttempts.length)
                                : 0
                            const highestPercentage = attempts.length > 0
                                ? Math.max(...attempts.map(a => a.percentage || 0))
                                : 0
                            const passedCount = completedAttempts.filter(a => (a.percentage || 0) >= 40).length
                            const passRate = completedAttempts.length > 0
                                ? Math.round((passedCount / completedAttempts.length) * 100)
                                : 0

                            return (
                                <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                                    {/* Stat 1: Total Completed */}
                                    <motion.div variants={itemVariants} className="rounded-xl border border-slate-800 bg-[#141518] p-4">
                                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Completed
                                        </span>
                                        <div className="mt-2 flex items-baseline gap-2">
                                            <span className="text-2xl font-extrabold text-white">
                                                {completedAttempts.length}
                                            </span>
                                            <span className="text-[11px] text-slate-500">
                                                / {attempts.length} attempts
                                            </span>
                                        </div>
                                    </motion.div>

                                    {/* Stat 2: Average Score */}
                                    <motion.div variants={itemVariants} className="rounded-xl border border-slate-800 bg-[#141518] p-4">
                                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Average Score
                                        </span>
                                        <div className="mt-2 flex items-baseline gap-2">
                                            <span className="text-2xl font-extrabold text-white">
                                                {avgPercentage}%
                                            </span>
                                            <span className="text-[11px] text-slate-500">
                                                overall
                                            </span>
                                        </div>
                                    </motion.div>

                                    {/* Stat 3: Best Score */}
                                    <motion.div variants={itemVariants} className="rounded-xl border border-slate-800 bg-[#141518] p-4">
                                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Highest Score
                                        </span>
                                        <div className="mt-2 flex items-baseline gap-2">
                                            <span className="text-2xl font-extrabold text-emerald-400">
                                                {highestPercentage}%
                                            </span>
                                            <span className="text-[11px] text-slate-500">
                                                personal best
                                            </span>
                                        </div>
                                    </motion.div>

                                    {/* Stat 4: Pass Rate */}
                                    <motion.div variants={itemVariants} className="rounded-xl border border-slate-800 bg-[#141518] p-4">
                                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Pass Rate
                                        </span>
                                        <div className="mt-2 flex items-baseline gap-2">
                                            <span className="text-2xl font-extrabold text-blue-400">
                                                {passRate}%
                                            </span>
                                            <span className="text-[11px] text-slate-500">
                                                cleared
                                            </span>
                                        </div>
                                    </motion.div>
                                </div>
                            )
                        })()}

                        {historyLoading ? (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {[1, 2, 3].map((item) => (
                                    <div
                                        key={item}
                                        className="h-72 animate-pulse rounded-xl border border-slate-800 bg-[#141518]"
                                    />
                                ))}
                            </div>
                        ) : attempts.length === 0 ? (
                            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-slate-800 bg-[#141518] px-6 py-12 text-center">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/60 text-xl text-slate-400">
                                    📋
                                </div>

                                <h3 className="font-bold text-white text-base">
                                    No past examination attempts
                                </h3>

                                <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-400">
                                    You haven't submitted any quizzes or examinations yet. Once you complete an exam, your scores, grading details, and solution reviews will appear here.
                                </p>

                                <button
                                    onClick={() => setActiveTab("available")}
                                    className="mt-5 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-500 shadow-sm btn-tactile cursor-pointer"
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
                                        <motion.article
                                            variants={itemVariants}
                                            key={att.id}
                                            className="group flex flex-col justify-between overflow-hidden rounded-xl border border-slate-800 bg-[#141518] hover:border-slate-700 hover:bg-[#181A20] transition-all duration-200 shadow-sm"
                                        >
                                            <div className="p-5">
                                                {/* Status & Quiz Code Badges */}
                                                <div className="mb-3 flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`rounded-md px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                                                                att.status === "SUBMITTED" || att.status === "EVALUATED"
                                                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                                    : att.status === "EXPIRED"
                                                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                                    : "bg-blue-500/10 text-blue-300 border border-blue-500/20"
                                                            }`}
                                                        >
                                                            {att.status}
                                                        </span>
                                                        <span className="rounded-md border border-slate-800 bg-[#1E2128] px-2 py-0.5 font-mono text-[10px] font-bold text-slate-300">
                                                            {att.quiz?.quiz_code}
                                                        </span>
                                                    </div>

                                                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-400">
                                                        {att.quiz?.subject || "GENERAL"}
                                                    </span>
                                                </div>

                                                <h3 className="text-lg font-bold leading-6 text-white group-hover:text-blue-400 transition-colors">
                                                    {att.quiz?.title || "Examination"}
                                                </h3>

                                                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                                                    <span>Instructor:</span>
                                                    <span className="font-medium text-slate-200">
                                                        {att.quiz?.teacher_name || "Instructor"}
                                                    </span>
                                                </div>

                                                {/* Score Card Section */}
                                                <div className="mt-5 rounded-lg border border-slate-800/80 bg-[#101114] p-3.5">
                                                    <div className="flex items-end justify-between">
                                                        <div>
                                                            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                                Score Achieved
                                                            </p>
                                                            <p className="mt-1 text-xl font-extrabold text-white">
                                                                {att.score}
                                                                <span className="text-xs font-normal text-slate-400">
                                                                    {" "}/ {att.max_score} Pts
                                                                </span>
                                                            </p>
                                                        </div>

                                                        <div className="text-right">
                                                            <span
                                                                className={`inline-block rounded-md px-2.5 py-1 font-mono text-xs font-bold ${
                                                                    att.percentage >= 75
                                                                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                                                        : att.percentage >= 40
                                                                        ? "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                                                                        : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                                                                }`}
                                                            >
                                                                {att.percentage}%
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="mt-3 h-1.5 w-full rounded-full bg-slate-800/80 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-300 ${
                                                                att.percentage >= 75
                                                                    ? "bg-emerald-500"
                                                                    : att.percentage >= 40
                                                                    ? "bg-blue-500"
                                                                    : "bg-rose-500"
                                                            }`}
                                                            style={{ width: `${Math.min(100, Math.max(0, att.percentage || 0))}%` }}
                                                        />
                                                    </div>

                                                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                                                        <span>Submitted</span>
                                                        <span>{submittedDate}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action / Review Button */}
                                            <div className="border-t border-slate-800/80 bg-[#101114]/60 p-4">
                                                {isReviewAllowed ? (
                                                    <Link
                                                        to={`/review/${att.id}`}
                                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500 btn-tactile cursor-pointer"
                                                    >
                                                        <span>View Solutions & Review</span>
                                                        <span>→</span>
                                                    </Link>
                                                ) : (
                                                    <div className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-slate-800 bg-[#181A20] px-4 py-2.5 text-xs font-medium text-slate-500">
                                                        <span>🔒</span>
                                                        <span>Review Disabled by Instructor</span>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.article>
                                    )
                                })}
                            </div>
                        )}
                    </motion.section>
                )}
            </main>

            {/* Password Modal */}
            {passwordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#141518] p-6 shadow-2xl">
                        <div className="mb-5">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-400">
                                Password Protected
                            </span>

                            <h2 className="mt-1 text-xl font-bold text-white">
                                {passwordModal.title}
                            </h2>

                            <p className="mt-2 text-xs text-slate-400">
                                This examination requires an access key/password to begin. Enter it below to proceed.
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
                            className="focus-ring-smooth mb-4 h-11 w-full rounded-lg border border-[#3A3F47] bg-[#1E2128] px-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500"
                            placeholder="Enter quiz password"
                            type="password"
                        />

                        <div className="flex gap-3">
                            <button
                                className="flex-1 rounded-lg border border-slate-800 bg-[#1E2128] px-4 py-2.5 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition btn-tactile cursor-pointer"
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
                                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50 shadow-sm transition btn-tactile cursor-pointer"
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
        </motion.div>
    )
}