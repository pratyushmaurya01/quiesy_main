import { useEffect, useMemo, useState } from "react"
import { useQuery, useQueries, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { motion } from "framer-motion"

import TeacherShell from "../../components/layout/TeacherShell"
import QuizCard from "../../components/QuizCard"
import QuizDetailCard from "../../components/QuizDetailCard"
import ConfirmDeleteModal from "../../components/layout/ConfirmDeleteModal"

import {
    getQuestion,
    getQuizzes,
    getQuizQuestions,
    deleteQuiz,
} from "../../api/quizzes"

function Icon({ name, className = "h-5 w-5" }) {
    const icons = {
        search: (
            <>
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 5 5" />
            </>
        ),
        plus: (
            <>
                <path d="M12 5v14M5 12h14" />
            </>
        ),
        refresh: (
            <>
                <path d="M20 11a8 8 0 0 0-14.7-4L3 10" />
                <path d="M3 5v5h5" />
                <path d="M4 13a8 8 0 0 0 14.7 4L21 14" />
                <path d="M21 19v-5h-5" />
            </>
        ),
        filter: (
            <>
                <path d="M4 6h16M7 12h10M10 18h4" />
            </>
        ),
        grid: (
            <>
                <rect x="4" y="4" width="6" height="6" rx="1" />
                <rect x="14" y="4" width="6" height="6" rx="1" />
                <rect x="4" y="14" width="6" height="6" rx="1" />
                <rect x="14" y="14" width="6" height="6" rx="1" />
            </>
        ),
    }

    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {icons[name]}
        </svg>
    )
}

function StatCard({ label, value, helper, icon }) {
    const watermarkIcons = {
        total: (
            <svg className="h-16 w-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 8h8M8 12h8M8 16h5" />
            </svg>
        ),
        drafts: (
            <svg className="h-16 w-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
        ),
        scheduled: (
            <svg className="h-16 w-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 6v6l4 2" />
            </svg>
        ),
        active: (
            <svg className="h-16 w-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
        ),
    }

    return (
        <div className="relative overflow-hidden rounded-xl border border-slate-300/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-slate-400 hover:shadow-md dark:border-slate-800/80 dark:bg-[#141518] dark:hover:border-slate-700 btn-tactile cursor-default">
            {/* Watermark Icon */}
            <div className="pointer-events-none absolute -right-2 -bottom-2 text-slate-100 dark:text-slate-800/40">
                {watermarkIcons[icon] || watermarkIcons.total}
            </div>

            {/* Left grouped content */}
            <div className="relative z-10 flex flex-col justify-between h-full min-h-[72px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    {label}
                </p>

                <div className="mt-2 flex items-baseline gap-2.5">
                    <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {value}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        {helper}
                    </span>
                </div>
            </div>
        </div>
    )
}

function getQuizId(value) {
    if (value === null || value === undefined) {
        return null
    }

    if (typeof value === "object") {
        return value.id ?? null
    }

    return value
}


function getQuestionCount(quizId, quizQuestions) {
    return quizQuestions.filter(
        (item) => Number(getQuizId(item.quiz)) === Number(quizId)
    ).length
}

function getQuizMarks(quiz, quizId, quizQuestions) {
    if (quiz?.total_marks !== undefined && quiz?.total_marks !== null) {
        return quiz.total_marks
    }

    if (quiz?.marks !== undefined && quiz?.marks !== null) {
        return quiz.marks
    }

    const relatedQuestions = quizQuestions.filter(
        (item) => Number(getQuizId(item.quiz)) === Number(quizId)
    )

    const overrideMarks = relatedQuestions.reduce(
        (total, item) => total + Number(item.marks_override || 0),
        0
    )

    return overrideMarks || null
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

export default function TeacherDashboard() {
    const navigate = useNavigate()
    const { user } = useAuth()



    const [selectedQuizId, setSelectedQuizId] = useState(null)
    const [deleteQuizId, setDeleteQuizId] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const queryClient = useQueryClient()

    const confirmDeleteQuiz = async () => {
        if (!deleteQuizId) return
        setIsDeleting(true)
        try {
            await deleteQuiz(deleteQuizId)
            queryClient.invalidateQueries({ queryKey: ['quizzes', 'teacher'] })
            if (selectedQuizId === deleteQuizId) {
                setSelectedQuizId(null)
            }
            setDeleteQuizId(null)
        } catch (error) {
            console.error(error)
            window.alert("Unable to delete quiz.")
        } finally {
            setIsDeleting(false)
        }
    }

    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")

    // 1. Quizzes ko cache se laane ke liye (React Query)
    const { data: quizzes = [], isLoading: loading, error: queryError, refetch: loadDashboard } = useQuery({
        queryKey: ['quizzes', 'teacher'],
        queryFn: async () => {
            const res = await getQuizzes()
            return Array.isArray(res.data) ? res.data : res.data?.results || []
        }
    })

    const error = queryError ? "Unable to load your quizzes." : ""

    // Automatically select the first quiz when loaded
    useEffect(() => {
        if (quizzes.length > 0 && !selectedQuizId) {
            setSelectedQuizId(quizzes[0].id)
        }
    }, [quizzes, selectedQuizId])

    // 2. Selected quiz ke questions fetch and cache
    const { data: quizQuestions = [], error: qqError } = useQuery({
        queryKey: ['quizQuestions'],
        queryFn: async () => {
            const res = await getQuizQuestions()
            return Array.isArray(res.data) ? res.data : res.data?.results || []
        }
    })

    if (qqError) {
        console.error("Quiz questions fetch error:", qqError)
    }

    const selectedQuiz = useMemo(() => {
        return (
            quizzes.find(
                (quiz) => Number(quiz.id) === Number(selectedQuizId)
            ) || null
        )
    }, [quizzes, selectedQuizId])

    const filteredQuizzes = useMemo(() => {
        const query = search.trim().toLowerCase()

        return quizzes.filter((quiz) => {
            const matchesSearch =
                !query ||
                quiz.title?.toLowerCase().includes(query) ||
                quiz.subject?.toLowerCase().includes(query)

            const matchesStatus =
                statusFilter === "ALL" ||
                quiz.status === statusFilter

            return matchesSearch && matchesStatus
        })
    }, [quizzes, search, statusFilter])

    const stats = useMemo(() => {
        return {
            total: quizzes.length,
            drafts: quizzes.filter(
                (quiz) => quiz.status === "DRAFT"
            ).length,
            scheduled: quizzes.filter(
                (quiz) => quiz.status === "SCHEDULED"
            ).length,
            active: quizzes.filter(
                (quiz) => quiz.status === "ACTIVE"
            ).length,
        }
    }, [quizzes])

    const selectedQuestionLinks = useMemo(() => {
        if (!selectedQuiz) {
            return []
        }

        return quizQuestions.filter(
            (item) =>
                Number(getQuizId(item.quiz)) ===
                Number(selectedQuiz.id)
        )
    }, [quizQuestions, selectedQuiz])

    const questionIdsToFetch = useMemo(() => {
        return [
            ...new Set(
                selectedQuestionLinks
                    .slice(0, 4)
                    .map((item) =>
                        typeof item.question === "object"
                            ? null
                            : item.question
                    )
                    .filter((id) => id !== null && id !== undefined)
            ),
        ]
    }, [selectedQuestionLinks])

    const questionQueries = useQueries({
        queries: questionIdsToFetch.map((id) => ({
            queryKey: ['questionDetails', id],
            queryFn: async () => {
                const res = await getQuestion(id)
                return res.data
            },
            staleTime: 1000 * 60 * 5,
        }))
    })

    const questionDetailsById = useMemo(() => {
        const details = {}
        questionQueries.forEach((q, idx) => {
            if (q.data) {
                details[questionIdsToFetch[idx]] = q.data
            }
        })
        return details
    }, [questionQueries, questionIdsToFetch])

    const detailedSelectedQuestionLinks = useMemo(() => {
        return selectedQuestionLinks.map((item) => {
            if (typeof item.question === "object") {
                return item
            }

            const question = questionDetailsById[item.question]

            return question ? { ...item, question } : item
        })
    }, [selectedQuestionLinks, questionDetailsById])

    return (
        <TeacherShell noPadding>
            <motion.div 
                variants={containerVariants} 
                initial="hidden" 
                animate="visible"
                className="min-h-screen bg-[#f0f2f5] text-slate-900 dark:bg-[#101114] dark:text-white transition-colors duration-200"
            >
                {/* =====================================================
                    TOP / LANDING SECTION
                    100% full-width edge-to-edge
                ====================================================== */}
                <motion.section variants={itemVariants} className="w-full px-2.5 py-5 sm:px-4">
                    <div className="flex flex-col gap-5">
                        {/* Heading */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h1 className="flex items-baseline gap-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                                    <span>Hello, {user?.name?.split(" ")?.[0] || "Pratyush"}</span>
                                    <span className="text-base font-medium text-slate-500 dark:text-slate-400">sir</span>
                                </h1>

                                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                                    Manage your assessments and continue building your quizzes.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate("/create-quiz")}
                                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 btn-tactile cursor-pointer"
                            >
                                <Icon name="plus" className="h-4 w-4" />
                                Create Quiz
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            <motion.div variants={itemVariants}>
                                <StatCard
                                    label="Total Quizzes"
                                    value={stats.total}
                                    helper="All quizzes"
                                    icon="total"
                                />
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <StatCard
                                    label="Drafts"
                                    value={stats.drafts}
                                    helper="Need setup"
                                    icon="drafts"
                                />
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <StatCard
                                    label="Scheduled"
                                    value={stats.scheduled}
                                    helper="Ready to start"
                                    icon="scheduled"
                                />
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <StatCard
                                    label="Active"
                                    value={stats.active}
                                    helper="Currently running"
                                    icon="active"
                                />
                            </motion.div>
                        </div>
                    </div>
                </motion.section>

                <motion.section variants={itemVariants} className="h-[calc(100vh-4rem)] min-h-[620px] w-full overflow-hidden border-y border-slate-300/80 bg-[#e4e7ed]/70 dark:border-slate-800/80 dark:bg-[#0e0f12]">
                    <div className="flex h-full min-h-0 w-full flex-col px-2.5 sm:px-4">
                        {/* Workspace toolbar */}
                        <div className="shrink-0 py-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                                {/* Search */}
                                <div className="relative min-w-0 flex-1">
                                    <Icon
                                        name="search"
                                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-400"
                                    />

                                    <input
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Search quizzes by title or subject..."
                                        className="focus-ring-smooth h-10 w-full rounded-lg border border-slate-300/90 bg-white pl-9 pr-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 dark:border-slate-800 dark:bg-[#141518] dark:text-white dark:placeholder:text-slate-300"
                                    />
                                </div>

                                {/* Filters */}
                                <div className="flex min-w-0 gap-1.5 overflow-x-auto pb-0.5">
                                    {[
                                        ["ALL", "All"],
                                        ["DRAFT", "Draft"],
                                        ["SCHEDULED", "Scheduled"],
                                        ["ACTIVE", "Active"],
                                        ["CLOSED", "Closed"],
                                        ["EVALUATED", "Evaluated"],
                                    ].map(([value, label]) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() =>
                                                setStatusFilter(value)
                                            }
                                            className={[
                                                "h-9 shrink-0 rounded-lg border px-3 text-xs font-semibold shadow-sm transition btn-tactile cursor-pointer",
                                                statusFilter === value
                                                    ? "border-blue-600 bg-blue-600 text-white"
                                                    : "border-slate-300/80 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
                                            ].join(" ")}
                                        >
                                             {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* =================================================
                            ACTUAL SPLIT WORKSPACE
                        ================================================== */}
                        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 pb-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
                            {/* =================================================
                                LEFT PANE
                            ================================================== */}
                            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-300/90 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-[#141518] dark:shadow-none">
                                {/* Left header */}
                                <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                            Your Quizzes
                                        </h2>

                                        <p className="mt-0.5 text-xs text-slate-400">
                                            {filteredQuizzes.length}{" "}
                                            {filteredQuizzes.length === 1
                                                ? "quiz"
                                                : "quizzes"}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={loadDashboard}
                                        disabled={loading}
                                        aria-label="Refresh quizzes"
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 cursor-pointer dark:border-slate-800 dark:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                                    >
                                        <Icon
                                            name="refresh"
                                            className="h-4 w-4"
                                        />
                                    </button>
                                </div>

                                {/* ONLY SCROLLABLE CONTAINER */}
                                <div className="custom-quiz-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
                                    {loading ? (
                                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                                            {Array.from({
                                                length: 6,
                                            }).map((_, index) => (
                                                <div
                                                    key={index}
                                                    className="h-[178px] animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
                                                />
                                            ))}
                                        </div>
                                    ) : error ? (
                                        <div className="flex h-full min-h-[300px] items-center justify-center">
                                            <div className="text-center">
                                                <p className="text-sm font-semibold">
                                                    {error}
                                                </p>

                                                <button
                                                    type="button"
                                                    onClick={loadDashboard}
                                                    className="mt-2 text-xs font-semibold text-blue-500 hover:underline"
                                                >
                                                    Try again
                                                </button>
                                            </div>
                                        </div>
                                    ) : filteredQuizzes.length === 0 ? (
                                        <div className="flex h-full min-h-[300px] items-center justify-center">
                                            <div className="text-center">
                                                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                                    <Icon
                                                        name="grid"
                                                        className="h-5 w-5 text-slate-400"
                                                    />
                                                </div>

                                                <p className="text-sm font-semibold">
                                                    No quizzes found
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    Try a different search or
                                                    status filter.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                                            {filteredQuizzes.map(
                                                (quiz) => (
                                                    <motion.div key={quiz.id} variants={itemVariants}>
                                                        <QuizCard
                                                            quiz={quiz}
                                                            selected={
                                                                Number(
                                                                    selectedQuizId
                                                                ) ===
                                                                Number(quiz.id)
                                                            }
                                                            questionCount={getQuestionCount(
                                                                quiz.id,
                                                                quizQuestions
                                                            )}
                                                            totalMarks={getQuizMarks(
                                                                quiz,
                                                                quiz.id,
                                                                quizQuestions
                                                            )}
                                                            onSelect={() =>
                                                                setSelectedQuizId(
                                                                    quiz.id
                                                                )
                                                            }
                                                            onLiveProctor={(quizId) =>
                                                                navigate(
                                                                    `/quiz/${quizId}/live-proctor`
                                                                )
                                                            }
                                                            onDelete={setDeleteQuizId}
                                                        />
                                                    </motion.div>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* =================================================
                                RIGHT PANE

                                NO overflow-y-auto.
                                NO internal scrollbar.

                                It remains fully visible beside the left
                                scrolling catalog.
                            ================================================== */}
                            <section className="hidden min-h-0 lg:block">
                                <QuizDetailCard
                                    quiz={selectedQuiz}
                                    questionCount={
                                        selectedQuiz
                                            ? getQuestionCount(
                                                  selectedQuiz.id,
                                                  quizQuestions
                                              )
                                            : 0
                                    }
                                    totalMarks={
                                        selectedQuiz
                                            ? getQuizMarks(
                                                  selectedQuiz,
                                                  selectedQuiz.id,
                                                  quizQuestions
                                              )
                                            : null
                                    }
                                    questionLinks={
                                        detailedSelectedQuestionLinks
                                    }
                                    onEdit={(quizId) =>
                                        navigate(
                                            `/edit-quiz/${quizId}`
                                        )
                                    }
                                    onQuestions={(quizId) =>
                                        navigate(
                                            `/add-questions/${quizId}`
                                        )
                                    }
                                    onResults={(quizId) =>
                                        navigate(
                                            `/quiz/${quizId}/results`
                                        )
                                    }
                                    onLiveProctor={(quizId) =>
                                        navigate(
                                            `/quiz/${quizId}/live-proctor`
                                        )
                                    }
                                />
                            </section>
                        </div>
                    </div>
                </motion.section>

                {/* =====================================================
                    MOBILE DETAIL

                    Desktop = split view.
                    Mobile = list first, detail underneath.
                ====================================================== */}
                {selectedQuiz && (
                    <section className="px-4 py-5 lg:hidden">
                        <QuizDetailCard
                            quiz={selectedQuiz}
                            questionCount={getQuestionCount(
                                selectedQuiz.id,
                                quizQuestions
                            )}
                            totalMarks={getQuizMarks(
                                selectedQuiz,
                                selectedQuiz.id,
                                quizQuestions
                            )}
                            questionLinks={detailedSelectedQuestionLinks}
                            onEdit={(quizId) =>
                                navigate(`/edit-quiz/${quizId}`)
                            }
                            onQuestions={(quizId) =>
                                navigate(`/add-questions/${quizId}`)
                            }
                            onResults={(quizId) =>
                                navigate(`/quiz/${quizId}/results`)
                            }
                            onLiveProctor={(quizId) =>
                                navigate(`/quiz/${quizId}/live-proctor`)
                            }
                        />
                    </section>
                )}
            </motion.div>
            <ConfirmDeleteModal
                isOpen={!!deleteQuizId}
                onClose={() => setDeleteQuizId(null)}
                onConfirm={confirmDeleteQuiz}
                title="Delete Quiz?"
                message="Are you sure you want to completely delete this quiz and all of its associated data? This action cannot be undone."
                isDeleting={isDeleting}
            />
        </TeacherShell>
    )
}
