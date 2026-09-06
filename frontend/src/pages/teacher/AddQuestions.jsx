import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import TeacherShell from "../../components/layout/TeacherShell"
import {
    getQuestions,
    getQuestion,
    getQuiz,
    getQuizQuestions,
    addQuestionToQuiz,
    removeQuestionFromQuiz,
    updateQuizQuestion,
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

    const paths = {
        search: (
            <>
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4.5 4.5" />
            </>
        ),
        plus: <path d="M12 5v14M5 12h14" />,
        check: <path d="m5 12.5 4 4L19 7" />,
        grip: (
            <>
                <circle cx="8" cy="7" r="1" fill="currentColor" stroke="none" />
                <circle cx="8" cy="12" r="1" fill="currentColor" stroke="none" />
                <circle cx="8" cy="17" r="1" fill="currentColor" stroke="none" />
                <circle cx="16" cy="7" r="1" fill="currentColor" stroke="none" />
                <circle cx="16" cy="12" r="1" fill="currentColor" stroke="none" />
                <circle cx="16" cy="17" r="1" fill="currentColor" stroke="none" />
            </>
        ),
        trash: (
            <>
                <path d="M4 7h16" />
                <path d="M9 7V4h6v3" />
                <path d="M7 7l.8 13h8.4L17 7" />
                <path d="M10 11v5M14 11v5" />
            </>
        ),
        chevronLeft: <path d="m15 18-6-6 6-6" />,
        chevronRight: <path d="m9 18 6-6-6-6" />,
        chevronUp: <path d="m18 15-6-6-6 6" />,
        chevronDown: <path d="m6 9 6 6 6-6" />,
        arrow: (
            <>
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
            </>
        ),
        back: (
            <>
                <path d="M19 12H5" />
                <path d="m11 18-6-6 6-6" />
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
        book: (
            <>
                <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
                <path d="M8 7h8M8 11h7M8 15h4" />
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

    return <svg {...common}>{paths[name]}</svg>
}

const TYPE_LABELS = {
    MCQ: "MCQ",
    MSQ: "MSQ",
    SUBJECTIVE: "SUBJ",
    CODING: "CODING",
}

const DIFFICULTY_CLASSES = {
    EASY: "text-emerald-600 dark:text-emerald-400",
    MEDIUM: "text-amber-600 dark:text-amber-400",
    HARD: "text-rose-600 dark:text-rose-400",
}

export default function AddQuestions() {
    const { quizId } = useParams()
    const navigate = useNavigate()

    const [quiz, setQuiz] = useState(null)
    const [questions, setQuestions] = useState([])
    const [selectedQuestions, setSelectedQuestions] = useState([])

    const [loadingQuiz, setLoadingQuiz] = useState(true)
    const [loadingQuestions, setLoadingQuestions] = useState(true)
    const [loadingSelected, setLoadingSelected] = useState(true)

    const [error, setError] = useState("")
    const [search, setSearch] = useState("")
    const [type, setType] = useState("")
    const [difficulty, setDifficulty] = useState("")
    const [topic, setTopic] = useState("")

    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [next, setNext] = useState(null)
    const [previous, setPrevious] = useState(null)

    const [actionId, setActionId] = useState(null)
    const [savingOrder, setSavingOrder] = useState(false)

    const [draggedId, setDraggedId] = useState(null)
    const [dragOverId, setDragOverId] = useState(null)

    const selectedIds = useMemo(
        () => new Set(selectedQuestions.map((item) => item.question.id)),
        [selectedQuestions]
    )

    const totalMarks = useMemo(
        () =>
            selectedQuestions.reduce(
                (sum, item) =>
                    sum + Number(
                        item.marks_override ?? item.question.marks ?? 0
                    ),
                0
            ),
        [selectedQuestions]
    )

    const totalPages = Math.max(
        1,
        Math.ceil(total / 20)
    )

    const loadQuiz = useCallback(async () => {
        setLoadingQuiz(true)

        try {
            const response = await getQuiz(quizId)
            setQuiz(response.data)
        } catch (requestError) {
            console.error(requestError)
            setError("Unable to load this quiz.")
        } finally {
            setLoadingQuiz(false)
        }
    }, [quizId])

    const loadQuestions = useCallback(async () => {
        setLoadingQuestions(true)

        try {
            const response = await getQuestions({
                page,
                search: search || undefined,
                question_type: type || undefined,
                difficulty: difficulty || undefined,
                topic: topic || undefined,
                is_active: true,
            })

            const data = response.data

            setQuestions(data.results || [])
            setTotal(data.count || 0)
            setNext(data.next)
            setPrevious(data.previous)
        } catch (requestError) {
            console.error(requestError)
            setError("Unable to load the Question Bank.")
        } finally {
            setLoadingQuestions(false)
        }
    }, [
        page,
        search,
        type,
        difficulty,
        topic,
    ])

    const loadSelectedQuestions = useCallback(async () => {
        setLoadingSelected(true)

        try {
            const response = await getQuizQuestions()

            const quizItems = (response.data || [])
                .filter(
                    (item) => String(item.quiz) === String(quizId)
                )
                .sort(
                    (a, b) =>
                        a.order - b.order ||
                        a.id - b.id
                )

            const enriched = await Promise.all(
                quizItems.map(async (item) => {
                    const questionResponse = await getQuestion(
                        item.question
                    )

                    return {
                        ...item,
                        question: questionResponse.data,
                    }
                })
            )

            setSelectedQuestions(enriched)
        } catch (requestError) {
            console.error(requestError)
            setError("Unable to load the selected questions.")
        } finally {
            setLoadingSelected(false)
        }
    }, [quizId])

    useEffect(() => {
        loadQuiz()
        loadSelectedQuestions()
    }, [loadQuiz, loadSelectedQuestions])

    useEffect(() => {
        const timer = setTimeout(() => {
            loadQuestions()
        }, 250)

        return () => clearTimeout(timer)
    }, [loadQuestions])

    const handleSearch = (value) => {
        setSearch(value)
        setPage(1)
    }

    const handleFilter = (setter) => (value) => {
        setter(value)
        setPage(1)
    }

    const addQuestion = async (question) => {
        if (selectedIds.has(question.id)) {
            return
        }

        setActionId(question.id)
        setError("")

        try {
            const response = await addQuestionToQuiz({
                quiz: Number(quizId),
                question: question.id,
                order: selectedQuestions.length,
            })

            setSelectedQuestions((current) => [
                ...current,
                {
                    ...response.data,
                    question,
                },
            ])
        } catch (requestError) {
            console.error(requestError)

            if (requestError.response?.status === 400) {
                setError(
                    requestError.response.data?.question ||
                    "This question could not be added."
                )
            } else {
                setError(
                    "Unable to add this question. Please try again."
                )
            }
        } finally {
            setActionId(null)
        }
    }

    const removeQuestion = async (quizQuestionId) => {
        setActionId(quizQuestionId)
        setError("")

        try {
            await removeQuestionFromQuiz(quizQuestionId)

            setSelectedQuestions((current) =>
                current.filter(
                    (item) => item.id !== quizQuestionId
                )
            )
        } catch (requestError) {
            console.error(requestError)
            setError(
                "Unable to remove the question. Please try again."
            )
        } finally {
            setActionId(null)
        }
    }

    const clearAll = async () => {
        if (selectedQuestions.length === 0) {
            return
        }

        const confirmed = window.confirm(
            "Remove all selected questions from this quiz?"
        )

        if (!confirmed) {
            return
        }

        setSavingOrder(true)
        setError("")

        try {
            await Promise.all(
                selectedQuestions.map((item) =>
                    removeQuestionFromQuiz(item.id)
                )
            )

            setSelectedQuestions([])
        } catch (requestError) {
            console.error(requestError)
            setError(
                "Some questions could not be removed. Please refresh and try again."
            )
            await loadSelectedQuestions()
        } finally {
            setSavingOrder(false)
        }
    }

    const saveOrder = async (items) => {
        setSavingOrder(true)
        setError("")

        try {
            await Promise.all(
                items.map((item, index) =>
                    updateQuizQuestion(item.id, {
                        order: index,
                    })
                )
            )
        } catch (requestError) {
            console.error(requestError)
            setError(
                "Unable to save the new order. Restoring the previous order."
            )

            await loadSelectedQuestions()
        } finally {
            setSavingOrder(false)
        }
    }

    const moveQuestion = async (index, direction) => {
        const newIndex = index + direction

        if (
            newIndex < 0 ||
            newIndex >= selectedQuestions.length ||
            savingOrder
        ) {
            return
        }

        const updated = [...selectedQuestions]
        const [moved] = updated.splice(index, 1)

        updated.splice(newIndex, 0, moved)

        setSelectedQuestions(updated)
        await saveOrder(updated)
    }

    const handleDragStart = (event, id) => {
        setDraggedId(id)

        event.dataTransfer.effectAllowed = "move"
        event.dataTransfer.setData(
            "text/plain",
            String(id)
        )
    }

    const handleDragOver = (event, id) => {
        event.preventDefault()

        if (
            draggedId !== null &&
            draggedId !== id
        ) {
            setDragOverId(id)
        }
    }

    const handleDrop = async (event, targetId) => {
        event.preventDefault()

        if (
            draggedId === null ||
            draggedId === targetId
        ) {
            setDraggedId(null)
            setDragOverId(null)
            return
        }

        const currentIndex = selectedQuestions.findIndex(
            (item) => item.id === draggedId
        )

        const targetIndex = selectedQuestions.findIndex(
            (item) => item.id === targetId
        )

        if (
            currentIndex === -1 ||
            targetIndex === -1
        ) {
            setDraggedId(null)
            setDragOverId(null)
            return
        }

        const updated = [...selectedQuestions]
        const [moved] = updated.splice(currentIndex, 1)

        updated.splice(targetIndex, 0, moved)

        setSelectedQuestions(updated)
        setDraggedId(null)
        setDragOverId(null)

        await saveOrder(updated)
    }

    const handleDragEnd = () => {
        setDraggedId(null)
        setDragOverId(null)
    }

    const finishQuiz = () => {
        if (selectedQuestions.length === 0) {
            setError(
                "Add at least one question before finishing the quiz."
            )
            return
        }

        navigate("/dashboard")
    }

    const clearFilters = () => {
        setSearch("")
        setType("")
        setDifficulty("")
        setTopic("")
        setPage(1)
    }

    const renderQuestionType = (value) => (
        <span className="font-semibold">
            {TYPE_LABELS[value] || value}
        </span>
    )

    return (
        <TeacherShell>
            <div className="w-full max-w-[1280px] mx-auto pb-28">

                {/* Header */}
                <div className="pt-5 sm:pt-7 mb-6">

                    <div className="flex items-center gap-2 text-[11px] sm:text-xs font-medium text-slate-400 dark:text-slate-500 mb-3">
                        <button
                            type="button"
                            onClick={() => navigate("/dashboard")}
                            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            Teacher Dashboard
                        </button>

                        <span>/</span>

                        <span>
                            Create Quiz
                        </span>

                        <span>/</span>

                        <span className="text-slate-700 dark:text-slate-200">
                            Add Questions
                        </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-1">
                                <Icon
                                    name="book"
                                    className="w-4 h-4"
                                />

                                <span className="truncate">
                                    {loadingQuiz
                                        ? "Loading quiz..."
                                        : quiz?.title || "Quiz"}
                                </span>
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Add Questions
                            </h1>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Select questions from your Question Bank and arrange them in the order students will see.
                            </p>
                        </div>

                        <div className="flex items-center gap-2.5 bg-white dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#303030] rounded-lg px-3.5 py-2 shrink-0">
                            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />

                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                <strong className="text-blue-600 dark:text-blue-400">
                                    {selectedQuestions.length}
                                </strong>{" "}
                                questions
                            </span>

                            <span className="text-slate-300 dark:text-slate-600">
                                •
                            </span>

                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                <strong className="text-blue-600 dark:text-blue-400">
                                    {totalMarks}
                                </strong>{" "}
                                marks
                            </span>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-4 py-3">
                        <Icon
                            name="alert"
                            className="w-4 h-4 text-red-500 shrink-0 mt-0.5"
                        />

                        <p className="text-xs font-medium text-red-700 dark:text-red-300 flex-1">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() => setError("")}
                            className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Workspace */}
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)] gap-5 items-start">

                    {/* Question Bank */}
                    <section className="bg-white dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#303030] rounded-xl overflow-hidden">

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-[#303030]">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                        Question Bank
                                    </h2>

                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Browse and add reusable questions.
                                    </p>
                                </div>

                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#292929] px-2.5 py-1 rounded-full">
                                    {total} available
                                </span>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#303030]">

                            <div className="relative">
                                <Icon
                                    name="search"
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                                />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) =>
                                        handleSearch(event.target.value)
                                    }
                                    placeholder="Search questions, topics, or keywords..."
                                    className="w-full h-10 pl-10 pr-3.5 rounded-lg border border-slate-200 dark:border-[#373737] bg-slate-50 dark:bg-[#242424] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3">

                                <select
                                    value={type}
                                    onChange={(event) =>
                                        handleFilter(setType)(
                                            event.target.value
                                        )
                                    }
                                    className="h-9 px-3 rounded-lg border border-slate-200 dark:border-[#373737] bg-slate-50 dark:bg-[#242424] text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
                                >
                                    <option value="">
                                        All Types
                                    </option>
                                    <option value="MCQ">
                                        MCQ
                                    </option>
                                    <option value="MSQ">
                                        MSQ
                                    </option>
                                    <option value="SUBJECTIVE">
                                        Subjective
                                    </option>
                                    <option value="CODING">
                                        Coding
                                    </option>
                                </select>

                                <select
                                    value={difficulty}
                                    onChange={(event) =>
                                        handleFilter(setDifficulty)(
                                            event.target.value
                                        )
                                    }
                                    className="h-9 px-3 rounded-lg border border-slate-200 dark:border-[#373737] bg-slate-50 dark:bg-[#242424] text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
                                >
                                    <option value="">
                                        All Difficulties
                                    </option>
                                    <option value="EASY">
                                        Easy
                                    </option>
                                    <option value="MEDIUM">
                                        Medium
                                    </option>
                                    <option value="HARD">
                                        Hard
                                    </option>
                                </select>

                                <div className="relative">
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(event) =>
                                            handleFilter(setTopic)(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Filter by topic"
                                        className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-[#373737] bg-slate-50 dark:bg-[#242424] text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {(search || type || difficulty || topic) && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="mt-2 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>

                        {/* Question list */}
                        <div className="p-4 sm:p-5">

                            {loadingQuestions ? (
                                <div className="space-y-3">
                                    {[1, 2, 3, 4].map((item) => (
                                        <div
                                            key={item}
                                            className="h-[92px] rounded-lg bg-slate-100 dark:bg-[#292929] animate-pulse"
                                        />
                                    ))}
                                </div>
                            ) : questions.length === 0 ? (
                                <div className="py-14 text-center">
                                    <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 dark:bg-[#292929] flex items-center justify-center text-slate-400">
                                        <Icon
                                            name="search"
                                            className="w-5 h-5"
                                        />
                                    </div>

                                    <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        No questions found
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                        Try changing your search or filters.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {questions.map((question) => {
                                        const isAdded = selectedIds.has(
                                            question.id
                                        )

                                        const isAdding =
                                            actionId === question.id

                                        return (
                                            <article
                                                key={question.id}
                                                className={`group rounded-lg border p-3.5 transition-all duration-200 ${
                                                    isAdded
                                                        ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/10"
                                                        : "border-slate-200 dark:border-[#333333] bg-slate-50/70 dark:bg-[#242424] hover:border-blue-300 dark:hover:border-blue-800 hover:-translate-y-[1px]"
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">

                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-100">
                                                            {question.text}
                                                        </p>

                                                        <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                                                            <span className="font-bold text-blue-600 dark:text-blue-400">
                                                                {renderQuestionType(
                                                                    question.question_type
                                                                )}
                                                            </span>

                                                            <span>•</span>

                                                            <span
                                                                className={`font-semibold ${
                                                                    DIFFICULTY_CLASSES[
                                                                        question.difficulty
                                                                    ] || ""
                                                                }`}
                                                            >
                                                                {question.difficulty}
                                                            </span>

                                                            <span>•</span>

                                                            <span>
                                                                {question.marks} marks
                                                            </span>

                                                            {question.topic && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>
                                                                        {question.topic}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        disabled={
                                                            isAdded ||
                                                            isAdding
                                                        }
                                                        onClick={() =>
                                                            addQuestion(
                                                                question
                                                            )
                                                        }
                                                        className={`shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[11px] font-semibold transition-all ${
                                                            isAdded
                                                                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 cursor-default"
                                                                : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white active:scale-95 disabled:opacity-60"
                                                        }`}
                                                    >
                                                        {isAdding ? (
                                                            <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                                        ) : isAdded ? (
                                                            <Icon
                                                                name="check"
                                                                className="w-3.5 h-3.5"
                                                            />
                                                        ) : (
                                                            <Icon
                                                                name="plus"
                                                                className="w-3.5 h-3.5"
                                                            />
                                                        )}

                                                        {isAdded
                                                            ? "Added"
                                                            : "Add"}
                                                    </button>
                                                </div>
                                            </article>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Pagination */}
                            {!loadingQuestions &&
                                questions.length > 0 && (
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-[#303030]">

                                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                            Page {page} of {totalPages}
                                        </span>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                disabled={!previous}
                                                onClick={() =>
                                                    setPage(
                                                        (current) =>
                                                            Math.max(
                                                                1,
                                                                current - 1
                                                            )
                                                    )
                                                }
                                                className="w-8 h-8 rounded-md border border-slate-200 dark:border-[#373737] flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-[#292929] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <Icon
                                                    name="chevronLeft"
                                                    className="w-4 h-4"
                                                />
                                            </button>

                                            <span className="min-w-8 h-8 px-2 rounded-md bg-blue-600 text-white text-[11px] font-semibold flex items-center justify-center">
                                                {page}
                                            </span>

                                            <button
                                                type="button"
                                                disabled={!next}
                                                onClick={() =>
                                                    setPage(
                                                        (current) =>
                                                            current + 1
                                                    )
                                                }
                                                className="w-8 h-8 rounded-md border border-slate-200 dark:border-[#373737] flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-[#292929] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <Icon
                                                    name="chevronRight"
                                                    className="w-4 h-4"
                                                />
                                            </button>
                                        </div>
                                    </div>
                                )}
                        </div>
                    </section>

                    {/* Selected Questions */}
                    <section className="bg-white dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#303030] rounded-xl overflow-hidden xl:sticky xl:top-20">

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-[#303030] flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                    Selected Questions
                                </h2>

                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {selectedQuestions.length} questions · {totalMarks} marks
                                </p>
                            </div>

                            <button
                                type="button"
                                disabled={
                                    selectedQuestions.length === 0 ||
                                    savingOrder
                                }
                                onClick={clearAll}
                                className="text-[11px] font-semibold text-slate-400 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                Clear All
                            </button>
                        </div>

                        <div className="p-4 sm:p-5">

                            {loadingSelected ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((item) => (
                                        <div
                                            key={item}
                                            className="h-[110px] rounded-lg bg-slate-100 dark:bg-[#292929] animate-pulse"
                                        />
                                    ))}
                                </div>
                            ) : selectedQuestions.length === 0 ? (
                                <div className="min-h-[300px] flex flex-col items-center justify-center text-center px-5">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#292929] text-slate-400 flex items-center justify-center">
                                        <Icon
                                            name="book"
                                            className="w-6 h-6"
                                        />
                                    </div>

                                    <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        No questions selected
                                    </p>

                                    <p className="mt-1.5 text-xs leading-relaxed text-slate-400 dark:text-slate-500 max-w-[260px]">
                                        Add questions from the Question Bank. They will appear here in quiz order.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {selectedQuestions.map(
                                        (item, index) => {
                                            const question =
                                                item.question

                                            const isDragging =
                                                draggedId === item.id

                                            const isDropTarget =
                                                dragOverId === item.id &&
                                                draggedId !== item.id

                                            const marks = Number(
                                                item.marks_override ??
                                                question.marks
                                            )

                                            return (
                                                <article
                                                    key={item.id}
                                                    draggable={
                                                        !savingOrder
                                                    }
                                                    onDragStart={(event) =>
                                                        handleDragStart(
                                                            event,
                                                            item.id
                                                        )
                                                    }
                                                    onDragOver={(event) =>
                                                        handleDragOver(
                                                            event,
                                                            item.id
                                                        )
                                                    }
                                                    onDrop={(event) =>
                                                        handleDrop(
                                                            event,
                                                            item.id
                                                        )
                                                    }
                                                    onDragEnd={
                                                        handleDragEnd
                                                    }
                                                    className={`relative rounded-lg border p-3.5 transition-all duration-200 ${
                                                        isDragging
                                                            ? "opacity-50 scale-[0.99] shadow-lg"
                                                            : "bg-slate-50 dark:bg-[#242424]"
                                                    } ${
                                                        isDropTarget
                                                            ? "border-blue-500 dark:border-blue-400"
                                                            : "border-slate-200 dark:border-[#333333]"
                                                    }`}
                                                >
                                                    {/* Subtle drop indicator */}
                                                    {isDropTarget && (
                                                        <div className="absolute -top-1.5 left-3 right-3 h-0.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                                                    )}

                                                    <div className="flex items-start gap-2.5">

                                                        {/* Drag handle */}
                                                        <div
                                                            title="Drag to reorder"
                                                            className="shrink-0 pt-0.5 text-slate-400 dark:text-slate-500 cursor-grab active:cursor-grabbing"
                                                        >
                                                            <Icon
                                                                name="grip"
                                                                className="w-4 h-5"
                                                            />
                                                        </div>

                                                        {/* Number */}
                                                        <div className="shrink-0 w-6 h-6 rounded-md bg-slate-200 dark:bg-[#303030] text-slate-700 dark:text-slate-200 text-[10px] font-bold flex items-center justify-center">
                                                            {index + 1}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-100">
                                                                {question.text}
                                                            </p>

                                                            <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                                                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                                                    {renderQuestionType(
                                                                        question.question_type
                                                                    )}
                                                                </span>

                                                                <span>•</span>

                                                                <span
                                                                    className={`font-semibold ${
                                                                        DIFFICULTY_CLASSES[
                                                                            question.difficulty
                                                                        ] || ""
                                                                    }`}
                                                                >
                                                                    {question.difficulty}
                                                                </span>

                                                                <span>•</span>

                                                                <span>
                                                                    {marks} marks
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            disabled={
                                                                actionId ===
                                                                item.id
                                                            }
                                                            onClick={() =>
                                                                removeQuestion(
                                                                    item.id
                                                                )
                                                            }
                                                            aria-label="Remove question"
                                                            className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-40 transition-colors"
                                                        >
                                                            {actionId ===
                                                            item.id ? (
                                                                <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />
                                                            ) : (
                                                                <Icon
                                                                    name="trash"
                                                                    className="w-3.5 h-3.5"
                                                                />
                                                            )}
                                                        </button>
                                                    </div>

                                                    {/* Mobile reorder controls */}
                                                    <div className="flex sm:hidden items-center gap-1 mt-3 pl-[42px]">
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                index === 0 ||
                                                                savingOrder
                                                            }
                                                            onClick={() =>
                                                                moveQuestion(
                                                                    index,
                                                                    -1
                                                                )
                                                            }
                                                            className="w-7 h-7 rounded-md border border-slate-200 dark:border-[#373737] flex items-center justify-center text-slate-400 disabled:opacity-25"
                                                        >
                                                            <Icon
                                                                name="chevronUp"
                                                                className="w-3.5 h-3.5"
                                                            />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={
                                                                index ===
                                                                    selectedQuestions.length -
                                                                        1 ||
                                                                savingOrder
                                                            }
                                                            onClick={() =>
                                                                moveQuestion(
                                                                    index,
                                                                    1
                                                                )
                                                            }
                                                            className="w-7 h-7 rounded-md border border-slate-200 dark:border-[#373737] flex items-center justify-center text-slate-400 disabled:opacity-25"
                                                        >
                                                            <Icon
                                                                name="chevronDown"
                                                                className="w-3.5 h-3.5"
                                                            />
                                                        </button>

                                                        <span className="ml-1 text-[10px] text-slate-400">
                                                            Drag on desktop
                                                        </span>
                                                    </div>
                                                </article>
                                            )
                                        }
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Bottom action dock */}
            <div className="fixed bottom-0 left-0 lg:left-[280px] right-0 z-40 border-t border-slate-200 dark:border-[#303030] bg-white/95 dark:bg-[#1b1b1b]/95 backdrop-blur-md">

                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

                    <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {selectedQuestions.length} Questions
                            <span className="text-slate-300 dark:text-slate-600 mx-2">
                                ·
                            </span>
                            {totalMarks} Marks
                        </p>

                        <p className="hidden sm:block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Changes are saved automatically to the quiz draft.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">

                        <button
                            type="button"
                            disabled={savingOrder}
                            onClick={() => navigate("/dashboard")}
                            className="h-9 px-3.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#292929] transition-colors disabled:opacity-40"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            disabled={
                                savingOrder ||
                                selectedQuestions.length === 0
                            }
                            onClick={finishQuiz}
                            className="inline-flex items-center gap-2 h-10 px-4 sm:px-5 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                        >
                            {savingOrder ? (
                                <>
                                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    Create Quiz
                                    <Icon
                                        name="arrow"
                                        className="w-4 h-4"
                                    />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </TeacherShell>
    )
}