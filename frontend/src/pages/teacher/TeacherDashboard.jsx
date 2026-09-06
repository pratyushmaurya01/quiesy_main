import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import TeacherShell from "../../components/layout/TeacherShell"
import QuizCard from "../../components/QuizCard"
import QuizDetailCard from "../../components/QuizDetailCard"

import {
    getQuizzes,
    getQuizQuestions,
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

function StatCard({ label, value, helper }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-end justify-between gap-3">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                        {label}
                    </p>

                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {value}
                    </p>
                </div>

                <span className="pb-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    {helper}
                </span>
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

function getQuestionId(value) {
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

export default function TeacherDashboard() {
    const navigate = useNavigate()

    const [quizzes, setQuizzes] = useState([])
    const [quizQuestions, setQuizQuestions] = useState([])

    const [selectedQuizId, setSelectedQuizId] = useState(null)

    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const loadDashboard = async () => {
        try {
            setLoading(true)
            setError("")

            const [quizResponse, questionResponse] = await Promise.all([
                getQuizzes(),
                getQuizQuestions(),
            ])

            const quizData = Array.isArray(quizResponse.data)
                ? quizResponse.data
                : quizResponse.data?.results || []

            const questionData = Array.isArray(questionResponse.data)
                ? questionResponse.data
                : questionResponse.data?.results || []

            setQuizzes(quizData)
            setQuizQuestions(questionData)

            setSelectedQuizId((currentId) => {
                if (
                    currentId &&
                    quizData.some(
                        (quiz) => Number(quiz.id) === Number(currentId)
                    )
                ) {
                    return currentId
                }

                return quizData[0]?.id ?? null
            })
        } catch (err) {
            console.error("Failed to load teacher dashboard:", err)
            setError("Unable to load your quizzes.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadDashboard()
    }, [])

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

    return (
        <TeacherShell>
            <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#101114] dark:text-white">
                {/* =====================================================
                    TOP / LANDING SECTION
                    This is normal page content.
                    The browser scrolls through this naturally.
                ====================================================== */}
                <section className="mx-auto w-full max-w-[1600px] px-4 pb-7 pt-7 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-5">
                        {/* Heading */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-500">
                                    Teacher Workspace
                                </p>

                                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                                    Teacher Overview
                                </h1>

                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    Manage your assessments and continue
                                    building your quizzes.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate("/create-quiz")}
                                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
                            >
                                <Icon name="plus" className="h-4 w-4" />
                                Create Quiz
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            <StatCard
                                label="Total Quizzes"
                                value={stats.total}
                                helper="All quizzes"
                            />

                            <StatCard
                                label="Drafts"
                                value={stats.drafts}
                                helper="Need setup"
                            />

                            <StatCard
                                label="Scheduled"
                                value={stats.scheduled}
                                helper="Ready to start"
                            />

                            <StatCard
                                label="Active"
                                value={stats.active}
                                helper="Currently running"
                            />
                        </div>
                    </div>
                </section>

                {/* =====================================================
                    FINAL WORKSPACE

                    This section is exactly one viewport high.

                    The page scrolls naturally until this section reaches
                    the viewport.

                    Once here:
                      LEFT  = scrolls
                      RIGHT = stays visible
                ====================================================== */}
                <section className="h-[calc(100vh-4rem)] min-h-[620px] w-full overflow-hidden border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-[#101114]">
                    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-col px-4 sm:px-6 lg:px-8">
                        {/* Workspace toolbar */}
                        <div className="shrink-0 py-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                                {/* Search */}
                                <div className="relative min-w-0 flex-1">
                                    <Icon
                                        name="search"
                                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Search quizzes by title or subject..."
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
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
                                                "h-9 shrink-0 rounded-lg border px-3 text-xs font-semibold transition",
                                                statusFilter === value
                                                    ? "border-blue-600 bg-blue-600 text-white"
                                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
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

                                ONLY THIS AREA SCROLLS.
                            ================================================== */}
                            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#141518]">
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
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                                    >
                                        <Icon
                                            name="refresh"
                                            className="h-4 w-4"
                                        />
                                    </button>
                                </div>

                                {/* ONLY SCROLLABLE CONTAINER */}
                                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
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
                                                    <QuizCard
                                                        key={quiz.id}
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
                                                    />
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
                                        selectedQuestionLinks
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
                                />
                            </section>
                        </div>
                    </div>
                </section>

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
                            questionLinks={selectedQuestionLinks}
                            onEdit={(quizId) =>
                                navigate(`/edit-quiz/${quizId}`)
                            }
                            onQuestions={(quizId) =>
                                navigate(`/add-questions/${quizId}`)
                            }
                            onResults={(quizId) =>
                                navigate(`/quiz/${quizId}/results`)
                            }
                        />
                    </section>
                )}
            </main>
        </TeacherShell>
    )
}