import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react"
import { useNavigate } from "react-router-dom"

import TeacherShell from "../../components/layout/TeacherShell"
import QuizCard from "../../components/QuizCard"
import QuizDetailCard from "../../components/QuizDetailCard"

import {
    getQuizzes,
    getQuizQuestions,
    getQuestion,
} from "../../api/quizzes"

function Icon({ name, className = "w-5 h-5" }) {
    const common = {
        className,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.8",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        viewBox: "0 0 24 24",
    }

    const icons = {
        plus: <path d="M12 5v14M5 12h14" />,
        search: (
            <>
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4.5 4.5" />
            </>
        ),
        refresh: (
            <>
                <path d="M20 11a8 8 0 0 0-14.7-4L4 9" />
                <path d="M4 4v5h5" />
                <path d="M4 13a8 8 0 0 0 14.7 4L20 15" />
                <path d="M20 20v-5h-5" />
            </>
        ),
        quiz: (
            <>
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M7 8h10M7 12h6M7 16h4" />
            </>
        ),
        alert: (
            <>
                <path d="M12 3.5 21 20H3z" />
                <path d="M12 9v4" />
                <path d="M12 16.5h.01" />
            </>
        ),
    }

    return <svg {...common}>{icons[name]}</svg>
}

const STATUS_OPTIONS = [
    { value: "ALL", label: "All" },
    { value: "DRAFT", label: "Draft" },
    { value: "SCHEDULED", label: "Scheduled" },
    { value: "ACTIVE", label: "Active" },
    { value: "CLOSED", label: "Closed" },
    { value: "EVALUATED", label: "Evaluated" },
]

function StatCard({
    label,
    value,
    description,
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 dark:border-[#303030] dark:bg-[#1f1f1f]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {label}
            </p>

            <div className="mt-2 flex items-end justify-between gap-3">
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {value}
                </p>

                <p className="text-right text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    {description}
                </p>
            </div>
        </div>
    )
}

function LoadingCard() {
    return (
        <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 dark:border-[#303030] dark:bg-[#1f1f1f]">
            <div className="h-7 w-32 rounded-md bg-slate-100 dark:bg-[#292929]" />
            <div className="mt-4 h-4 w-4/5 rounded bg-slate-100 dark:bg-[#292929]" />
            <div className="mt-5 h-3 w-full rounded bg-slate-100 dark:bg-[#292929]" />
            <div className="mt-2 h-3 w-2/3 rounded bg-slate-100 dark:bg-[#292929]" />
        </div>
    )
}

export default function TeacherDashboard() {
    const navigate = useNavigate()

    const [quizzes, setQuizzes] = useState([])
    const [quizQuestions, setQuizQuestions] = useState([])
    const [questionDetails, setQuestionDetails] =
        useState({})

    const [selectedQuizId, setSelectedQuizId] =
        useState(null)

    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] =
        useState("ALL")

    const [loading, setLoading] = useState(true)
    const [detailLoading, setDetailLoading] =
        useState(false)

    const [error, setError] = useState("")

    const loadDashboard = useCallback(
        async () => {
            setLoading(true)
            setError("")

            try {
                const [
                    quizResponse,
                    quizQuestionResponse,
                ] = await Promise.all([
                    getQuizzes(),
                    getQuizQuestions(),
                ])

                const quizData = Array.isArray(
                    quizResponse.data
                )
                    ? quizResponse.data
                    : quizResponse.data?.results ||
                      []

                const questionData =
                    Array.isArray(
                        quizQuestionResponse.data
                    )
                        ? quizQuestionResponse.data
                        : quizQuestionResponse
                              .data?.results || []

                setQuizzes(quizData)
                setQuizQuestions(questionData)

                /*
                 * QuizQuestion currently gives us the
                 * question ID. Fetch actual questions once
                 * so cards/detail can show real marks/text.
                 */
                const uniqueQuestionIds = [
                    ...new Set(
                        questionData
                            .map(
                                (item) =>
                                    item.question
                            )
                            .filter(Boolean)
                    ),
                ]

                const responses =
                    await Promise.all(
                        uniqueQuestionIds.map(
                            async (id) => {
                                try {
                                    const response =
                                        await getQuestion(
                                            id
                                        )

                                    return [
                                        String(id),
                                        response.data,
                                    ]
                                } catch {
                                    return [
                                        String(id),
                                        null,
                                    ]
                                }
                            }
                        )
                    )

                const details = {}

                responses.forEach(
                    ([id, question]) => {
                        details[id] = question
                    }
                )

                setQuestionDetails(details)

                if (quizData.length > 0) {
                    setSelectedQuizId(
                        (current) => {
                            const exists =
                                quizData.some(
                                    (quiz) =>
                                        quiz.id ===
                                        current
                                )

                            return exists
                                ? current
                                : quizData[0].id
                        }
                    )
                } else {
                    setSelectedQuizId(null)
                }
            } catch (requestError) {
                console.error(
                    requestError
                )

                setError(
                    "Unable to load your quizzes. Please try again."
                )
            } finally {
                setLoading(false)
            }
        },
        []
    )

    useEffect(() => {
        loadDashboard()
    }, [loadDashboard])

    const enrichedQuizQuestions =
        useMemo(() => {
            return quizQuestions.map(
                (item) => ({
                    ...item,
                    question:
                        questionDetails[
                            String(
                                item.question
                            )
                        ] || null,
                })
            )
        }, [
            quizQuestions,
            questionDetails,
        ])

    const questionStats = useMemo(() => {
        const stats = {}

        enrichedQuizQuestions.forEach(
            (item) => {
                const quizId = String(
                    item.quiz
                )

                if (!stats[quizId]) {
                    stats[quizId] = {
                        count: 0,
                        marks: 0,
                    }
                }

                stats[quizId].count += 1

                stats[quizId].marks +=
                    Number(
                        item.marks_override ??
                            item.question?.marks ??
                            0
                    )
            }
        )

        return stats
    }, [enrichedQuizQuestions])

    const filteredQuizzes = useMemo(() => {
        const query =
            search.trim().toLowerCase()

        return quizzes.filter((quiz) => {
            const matchesSearch =
                !query ||
                quiz.title
                    ?.toLowerCase()
                    .includes(query) ||
                quiz.subject
                    ?.toLowerCase()
                    .includes(query)

            const matchesStatus =
                statusFilter === "ALL" ||
                quiz.status === statusFilter

            return (
                matchesSearch &&
                matchesStatus
            )
        })
    }, [
        quizzes,
        search,
        statusFilter,
    ])

    const selectedQuiz = useMemo(
        () =>
            quizzes.find(
                (quiz) =>
                    quiz.id ===
                    selectedQuizId
            ) || null,
        [quizzes, selectedQuizId]
    )

    const selectedQuestions = useMemo(
        () =>
            enrichedQuizQuestions
                .filter(
                    (item) =>
                        String(
                            item.quiz
                        ) ===
                        String(
                            selectedQuizId
                        )
                )
                .sort(
                    (a, b) =>
                        (a.order ?? 0) -
                            (b.order ?? 0) ||
                        a.id - b.id
                ),
        [
            enrichedQuizQuestions,
            selectedQuizId,
        ]
    )

    const selectedTotalMarks = useMemo(
        () =>
            selectedQuestions.reduce(
                (total, item) =>
                    total +
                    Number(
                        item.marks_override ??
                            item.question
                                ?.marks ??
                            0
                    ),
                0
            ),
        [selectedQuestions]
    )

    const stats = useMemo(
        () => ({
            total: quizzes.length,
            draft: quizzes.filter(
                (quiz) =>
                    quiz.status === "DRAFT"
            ).length,
            scheduled: quizzes.filter(
                (quiz) =>
                    quiz.status ===
                    "SCHEDULED"
            ).length,
            active: quizzes.filter(
                (quiz) =>
                    quiz.status === "ACTIVE"
            ).length,
        }),
        [quizzes]
    )

    useEffect(() => {
        if (!selectedQuizId) {
            return
        }

        setDetailLoading(true)

        const timer = setTimeout(() => {
            setDetailLoading(false)
        }, 180)

        return () => clearTimeout(timer)
    }, [selectedQuizId])

    const handleCreateQuiz = () => {
        navigate("/create-quiz")
    }

    const handleContinue = () => {
        if (!selectedQuiz) {
            return
        }

        navigate(
            `/add-questions/${selectedQuiz.id}`
        )
    }

    return (
        <TeacherShell>
            <div className="mx-auto w-full max-w-[1380px] pb-10">

                {/* Header */}
                <div className="mb-6 pt-5 sm:pt-7">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                Teacher Workspace
                            </p>

                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                                Teacher Overview
                            </h1>

                            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                                Manage your assessments and continue building your quizzes.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={
                                handleCreateQuiz
                            }
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.98] dark:hover:bg-blue-500"
                        >
                            <Icon
                                name="plus"
                                className="h-4 w-4"
                            />

                            Create Quiz
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-5 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/20">
                        <Icon
                            name="alert"
                            className="h-4 w-4 shrink-0 text-red-500"
                        />

                        <p className="flex-1 text-xs font-medium text-red-700 dark:text-red-300">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={
                                loadDashboard
                            }
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-600 dark:text-red-400"
                        >
                            <Icon
                                name="refresh"
                                className="h-3.5 w-3.5"
                            />

                            Retry
                        </button>
                    </div>
                )}

                {/* Stats */}
                <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
                    <StatCard
                        label="Total Quizzes"
                        value={stats.total}
                        description="All quizzes"
                    />

                    <StatCard
                        label="Drafts"
                        value={stats.draft}
                        description="Need setup"
                    />

                    <StatCard
                        label="Scheduled"
                        value={stats.scheduled}
                        description="Ready to start"
                    />

                    <StatCard
                        label="Active"
                        value={stats.active}
                        description="Currently running"
                    />
                </div>

                {/* Search + filters */}
                <div className="mb-5 flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <Icon
                            name="search"
                            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                            placeholder="Search quizzes by title or subject..."
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-[#333333] dark:bg-[#1f1f1f] dark:text-white"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-0.5">
                        {STATUS_OPTIONS.map(
                            (option) => (
                                <button
                                    key={
                                        option.value
                                    }
                                    type="button"
                                    onClick={() =>
                                        setStatusFilter(
                                            option.value
                                        )
                                    }
                                    className={`h-10 shrink-0 rounded-lg border px-3.5 text-[11px] font-semibold transition-colors ${
                                        statusFilter ===
                                        option.value
                                            ? "border-blue-600 bg-blue-600 text-white"
                                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-[#333333] dark:bg-[#1f1f1f] dark:text-slate-400 dark:hover:bg-[#292929]"
                                    }`}
                                >
                                    {
                                        option.label
                                    }
                                </button>
                            )
                        )}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {[1, 2, 3, 4].map(
                            (item) => (
                                <LoadingCard
                                    key={item}
                                />
                            )
                        )}
                    </div>
                ) : quizzes.length === 0 ? (
                    <EmptyState
                        onCreate={
                            handleCreateQuiz
                        }
                    />
                ) : filteredQuizzes.length ===
                  0 ? (
                    <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-[#303030] dark:bg-[#1f1f1f]">
                        <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                No matching quizzes
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                Try another search or status filter.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.9fr)]">

                        {/* Cards */}
                        <div>
                            <div className="mb-3 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Your Quizzes
                                    </h2>

                                    <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                                        {
                                            filteredQuizzes.length
                                        }{" "}
                                        {filteredQuizzes.length ===
                                        1
                                            ? "quiz"
                                            : "quizzes"}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        loadDashboard
                                    }
                                    title="Refresh"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:bg-slate-50 hover:text-blue-600 dark:border-[#333333] dark:hover:bg-[#292929] dark:hover:text-blue-400"
                                >
                                    <Icon
                                        name="refresh"
                                        className="h-4 w-4"
                                    />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                                {filteredQuizzes.map(
                                    (quiz) => {
                                        const quizStats =
                                            questionStats[
                                                String(
                                                    quiz.id
                                                )
                                            ] || {
                                                count: 0,
                                                marks: 0,
                                            }

                                        return (
                                            <QuizCard
                                                key={
                                                    quiz.id
                                                }
                                                quiz={
                                                    quiz
                                                }
                                                questionCount={
                                                    quizStats.count
                                                }
                                                totalMarks={
                                                    quizStats.marks
                                                }
                                                selected={
                                                    quiz.id ===
                                                    selectedQuizId
                                                }
                                                onClick={() =>
                                                    setSelectedQuizId(
                                                        quiz.id
                                                    )
                                                }
                                            />
                                        )
                                    }
                                )}
                            </div>
                        </div>

                        {/* Detail */}
                        <div className="lg:sticky lg:top-20">
                            <QuizDetailCard
                                quiz={
                                    selectedQuiz
                                }
                                questions={
                                    selectedQuestions
                                }
                                totalMarks={
                                    selectedTotalMarks
                                }
                                loading={
                                    detailLoading
                                }
                                onContinue={
                                    handleContinue
                                }
                            />
                        </div>
                    </div>
                )}
            </div>
        </TeacherShell>
    )
}

function EmptyState({ onCreate }) {
    return (
        <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-[#383838] dark:bg-[#1f1f1f]">
            <div className="max-w-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                    <Icon
                        name="quiz"
                        className="h-7 w-7"
                    />
                </div>

                <h2 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
                    No quizzes yet
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    Create your first quiz and start adding questions from your Question Bank.
                </p>

                <button
                    type="button"
                    onClick={onCreate}
                    className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white transition-colors hover:bg-blue-700"
                >
                    <Icon
                        name="plus"
                        className="h-4 w-4"
                    />

                    Create First Quiz
                </button>
            </div>
        </div>
    )
}