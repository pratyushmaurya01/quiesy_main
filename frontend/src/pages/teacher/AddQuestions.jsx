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
        drag: (
            <>
                <circle cx="9" cy="6" r="1.2" fill="currentColor" stroke="none" />
                <circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none" />
                <circle cx="9" cy="18" r="1.2" fill="currentColor" stroke="none" />
                <circle cx="15" cy="6" r="1.2" fill="currentColor" stroke="none" />
                <circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none" />
                <circle cx="15" cy="18" r="1.2" fill="currentColor" stroke="none" />
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
        arrowRight: (
            <>
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
            </>
        ),
        assignment: (
            <>
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M12 11h4" />
                <path d="M12 16h4" />
                <path d="M8 11h.01" />
                <path d="M8 16h.01" />
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

const TYPE_BADGES = {
    MCQ: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20",
    MSQ: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20",
    SUBJECTIVE: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
    CODING: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20",
}

const DIFFICULTY_STYLES = {
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
        () => new Set(selectedQuestions.map((item) => item?.question?.id || item?.question_id || item?.question).filter(Boolean)),
        [selectedQuestions]
    )

    const totalMarks = useMemo(
        () =>
            selectedQuestions.reduce(
                (sum, item) =>
                    sum + Number(
                        item?.marks_override ?? item?.question?.marks ?? 0
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
        if (!quizId) return
        setLoadingQuiz(true)
        try {
            const response = await getQuiz(quizId)
            setQuiz(response.data)
        } catch (requestError) {
            console.error("Error loading quiz:", requestError)
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

            const data = response?.data
            setQuestions(Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [])
            setTotal(data?.count || (Array.isArray(data) ? data.length : 0))
            setNext(data?.next || null)
            setPrevious(data?.previous || null)
        } catch (requestError) {
            console.error("Error loading questions:", requestError)
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
        if (!quizId) return
        setLoadingSelected(true)
        try {
            const response = await getQuizQuestions()
            const quizItems = (response?.data || [])
                .filter(
                    (item) => String(item?.quiz) === String(quizId)
                )
                .sort(
                    (a, b) =>
                        (a?.order ?? 0) - (b?.order ?? 0) ||
                        (a?.id ?? 0) - (b?.id ?? 0)
                )

            const enriched = await Promise.all(
                quizItems.map(async (item) => {
                    if (item?.question && typeof item.question === "object") {
                        return item
                    }
                    try {
                        const questionResponse = await getQuestion(item?.question)
                        return {
                            ...item,
                            question: questionResponse?.data || {},
                        }
                    } catch (e) {
                        console.error("Failed to load question details:", e)
                        return {
                            ...item,
                            question: { id: item?.question, text: `Question #${item?.question}`, marks: 0 },
                        }
                    }
                })
            )

            setSelectedQuestions(enriched)
        } catch (requestError) {
            console.error("Error loading selected questions:", requestError)
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
        if (!question?.id || selectedIds.has(question.id)) {
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

    return (
        <TeacherShell>
            <div className="max-w-7xl mx-auto px-2 sm:px-6 pt-2 pb-28 flex flex-col gap-6">

                {/* Clean Header Section */}
                <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-surface-variant dark:border-[#2e2e2e]">
                    <div>
                        <div className="flex items-center gap-2 text-primary dark:text-blue-400 font-medium text-xs sm:text-[13px] mb-1.5">
                            <Icon name="assignment" className="w-4 h-4" />
                            <span>
                                {loadingQuiz ? "Loading quiz..." : quiz?.title || "Quiz"}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-on-surface dark:text-[#f9fafb] tracking-tight">
                            Add Questions
                        </h1>
                        <p className="text-on-surface-variant dark:text-[#9ca3af] text-sm mt-1">
                            Select questions from the repository or drag to reorder your quiz sequence.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto shrink-0 bg-surface-container-lowest dark:bg-[#202020] px-4 py-2 rounded-xl border border-surface-variant dark:border-[#363636] shadow-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary dark:bg-blue-500 animate-pulse" />
                        <div className="flex items-center gap-2 font-medium text-xs sm:text-sm text-on-surface dark:text-[#f9fafb]">
                            <span className="font-semibold text-primary dark:text-blue-400">
                                {selectedQuestions.length}
                            </span>{" "}
                            questions
                            <span className="text-outline dark:text-[#6b7280]">•</span>
                            <span className="font-semibold text-primary dark:text-blue-400">
                                {totalMarks}
                            </span>{" "}
                            total marks
                        </div>
                    </div>
                </header>

                {/* Error Banner */}
                {error && (
                    <div className="flex items-start gap-3 rounded-xl border border-error/30 dark:border-red-900/50 bg-error-container/20 dark:bg-red-950/20 px-4 py-3">
                        <Icon name="alert" className="w-4 h-4 text-error dark:text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs font-medium text-error dark:text-red-300 flex-1">
                            {error}
                        </p>
                        <button
                            type="button"
                            onClick={() => setError("")}
                            className="text-xs text-error hover:underline dark:text-red-300 font-semibold"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Two-Column Workspace */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8 items-start">

                    {/* LEFT PANE: Question Bank (~58%) */}
                    <section className="xl:col-span-7 flex flex-col gap-4 bg-surface-container-lowest dark:bg-[#202020] p-5 sm:p-6 rounded-2xl border border-surface-variant dark:border-[#333333] shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-on-surface dark:text-[#f9fafb]">
                                    Question Bank
                                </h2>
                                <p className="text-xs sm:text-sm text-on-surface-variant dark:text-[#9ca3af] mt-0.5">
                                    Browse and pick vetted problems from your repository.
                                </p>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-surface-container dark:bg-[#2c2c2c] text-on-surface-variant dark:text-[#9ca3af] text-xs font-semibold">
                                {total} available
                            </span>
                        </div>

                        {/* Search & Streamlined Filters */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mt-1">
                            <div className="relative flex-1">
                                <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-[#9ca3af] w-4 h-4 pointer-events-none" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Search questions, topics, or keywords..."
                                    className="w-full h-10 pl-10 pr-4 bg-surface dark:bg-[#181818] text-on-surface dark:text-[#f9fafb] text-xs sm:text-sm rounded-xl border border-surface-variant dark:border-[#3a3a3a] focus:border-primary dark:focus:border-blue-500 focus:outline-none transition-colors placeholder:text-on-surface-variant/60 dark:placeholder:text-[#6b7280]"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={type}
                                    onChange={(e) => handleFilter(setType)(e.target.value)}
                                    className="h-10 px-3 bg-surface dark:bg-[#181818] text-on-surface dark:text-[#f9fafb] text-xs sm:text-[13px] rounded-xl border border-surface-variant dark:border-[#3a3a3a] focus:outline-none cursor-pointer focus:border-primary dark:focus:border-blue-500"
                                >
                                    <option value="">All Types</option>
                                    <option value="MCQ">MCQ</option>
                                    <option value="MSQ">MSQ</option>
                                    <option value="SUBJECTIVE">Subjective</option>
                                    <option value="CODING">Coding</option>
                                </select>
                                <select
                                    value={difficulty}
                                    onChange={(e) => handleFilter(setDifficulty)(e.target.value)}
                                    className="h-10 px-3 bg-surface dark:bg-[#181818] text-on-surface dark:text-[#f9fafb] text-xs sm:text-[13px] rounded-xl border border-surface-variant dark:border-[#3a3a3a] focus:outline-none cursor-pointer focus:border-primary dark:focus:border-blue-500"
                                >
                                    <option value="">All Difficulties</option>
                                    <option value="EASY">Easy</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HARD">Hard</option>
                                </select>
                            </div>
                        </div>

                        {(search || type || difficulty || topic) && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-on-surface-variant dark:text-[#9ca3af]">Filtered view</span>
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="text-xs font-semibold text-primary dark:text-blue-400 hover:underline"
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}

                        {/* Question List */}
                        <div className="flex flex-col gap-3 mt-1 min-h-[300px]">
                            {loadingQuestions ? (
                                <div className="space-y-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className="h-[84px] rounded-xl bg-surface-container-low dark:bg-[#282828] animate-pulse border border-surface-variant/40 dark:border-[#333333]"
                                        />
                                    ))}
                                </div>
                            ) : questions.length === 0 ? (
                                <div className="py-16 text-center">
                                    <div className="w-10 h-10 mx-auto rounded-xl bg-surface-container dark:bg-[#292929] flex items-center justify-center text-on-surface-variant dark:text-[#9ca3af]">
                                        <Icon name="search" className="w-5 h-5" />
                                    </div>
                                    <p className="mt-3 text-sm font-semibold text-on-surface dark:text-[#f9fafb]">
                                        No questions found
                                    </p>
                                    <p className="mt-1 text-xs text-on-surface-variant dark:text-[#9ca3af]">
                                        Try changing your search or filters.
                                    </p>
                                </div>
                            ) : (
                                questions.map((question) => {
                                    if (!question) return null
                                    const qId = question.id
                                    const isAdded = selectedIds.has(qId)
                                    const isAdding = actionId === qId

                                    return (
                                        <article
                                            key={qId}
                                            className={`group p-4 rounded-xl border flex items-center justify-between gap-4 transition-all duration-200 ${
                                                isAdded
                                                    ? "bg-surface-container-low/70 dark:bg-[#262626] border-surface-variant/60 dark:border-[#363636] opacity-90"
                                                    : "bg-surface-container-low dark:bg-[#252525] border-surface-variant/70 dark:border-[#333333] hover:border-primary/50 dark:hover:border-blue-500 hover:bg-surface-container/80 dark:hover:bg-[#2c2c2c] shadow-sm"
                                            }`}
                                        >
                                            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                                                <p className="text-sm font-medium text-on-surface dark:text-[#f9fafb] leading-snug">
                                                    {question.text || question.title || `Question #${qId}`}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant dark:text-[#9ca3af] font-medium">
                                                    {question.question_type && (
                                                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide ${TYPE_BADGES[question.question_type] || "bg-surface-variant text-on-surface"}`}>
                                                            {question.question_type}
                                                        </span>
                                                    )}
                                                    {question.difficulty && (
                                                        <>
                                                            <span className="text-outline dark:text-[#6b7280]">•</span>
                                                            <span className={`text-[11px] font-bold uppercase tracking-wider ${DIFFICULTY_STYLES[question.difficulty] || ""}`}>
                                                                {question.difficulty}
                                                            </span>
                                                        </>
                                                    )}
                                                    <span className="text-outline dark:text-[#6b7280]">•</span>
                                                    <span>{question.marks ?? 1} marks</span>
                                                    {question.topic && (
                                                        <>
                                                            <span className="text-outline dark:text-[#6b7280]">•</span>
                                                            <span className="truncate max-w-[150px]">{question.topic}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={isAdded || isAdding}
                                                onClick={() => addQuestion(question)}
                                                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                                                    isAdded
                                                        ? "bg-surface-container dark:bg-[#333333] text-emerald-600 dark:text-emerald-400 cursor-default"
                                                        : "bg-primary hover:bg-primary-container dark:bg-blue-600 dark:hover:bg-blue-500 text-on-primary dark:text-white active:scale-95 disabled:opacity-60"
                                                }`}
                                            >
                                                {isAdding ? (
                                                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                                ) : isAdded ? (
                                                    <>
                                                        <Icon name="check" className="w-3.5 h-3.5" />
                                                        Added
                                                    </>
                                                ) : (
                                                    <>
                                                        <Icon name="plus" className="w-3.5 h-3.5" />
                                                        Add
                                                    </>
                                                )}
                                            </button>
                                        </article>
                                    )
                                })
                            )}
                        </div>

                        {/* Pagination */}
                        {!loadingQuestions && questions.length > 0 && (
                            <div className="flex items-center justify-between mt-2 pt-3 border-t border-surface-variant dark:border-[#2e2e2e]">
                                <span className="text-xs text-on-surface-variant dark:text-[#9ca3af]">
                                    Page <span className="font-semibold text-on-surface dark:text-[#f9fafb]">{page}</span> of {totalPages}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        disabled={!previous}
                                        onClick={() => setPage((c) => Math.max(1, c - 1))}
                                        className="w-8 h-8 rounded-lg border border-surface-variant dark:border-[#373737] flex items-center justify-center text-on-surface-variant dark:text-[#9ca3af] hover:bg-surface-container dark:hover:bg-[#2c2c2c] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Icon name="chevronLeft" className="w-4 h-4" />
                                    </button>
                                    <span className="min-w-8 h-8 px-2 rounded-lg bg-primary dark:bg-blue-600 text-on-primary dark:text-white text-xs font-semibold flex items-center justify-center">
                                        {page}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={!next}
                                        onClick={() => setPage((c) => c + 1)}
                                        className="w-8 h-8 rounded-lg border border-surface-variant dark:border-[#373737] flex items-center justify-center text-on-surface-variant dark:text-[#9ca3af] hover:bg-surface-container dark:hover:bg-[#2c2c2c] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Icon name="chevronRight" className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* RIGHT PANE: Selected Questions (~42%) */}
                    <section className="xl:col-span-5 flex flex-col gap-4 bg-surface-container-lowest dark:bg-[#202020] p-5 sm:p-6 rounded-2xl border border-surface-variant dark:border-[#333333] shadow-sm xl:sticky xl:top-20">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-on-surface dark:text-[#f9fafb]">
                                    Selected Questions
                                </h2>
                                <p className="text-xs sm:text-sm text-on-surface-variant dark:text-[#9ca3af] mt-0.5">
                                    {selectedQuestions.length} questions · {totalMarks} marks
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={selectedQuestions.length === 0 || savingOrder}
                                onClick={clearAll}
                                className="text-xs font-semibold text-outline dark:text-[#9ca3af] hover:text-error dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded hover:bg-surface-container dark:hover:bg-[#2a2a2a]"
                            >
                                Clear All
                            </button>
                        </div>

                        {/* Selected Question List */}
                        <div className="flex flex-col gap-3 mt-1 min-h-[300px]">
                            {loadingSelected ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="h-[96px] rounded-xl bg-surface-container-low dark:bg-[#282828] animate-pulse border border-surface-variant/40 dark:border-[#333333]"
                                        />
                                    ))}
                                </div>
                            ) : selectedQuestions.length === 0 ? (
                                <div className="min-h-[260px] flex flex-col items-center justify-center text-center px-4">
                                    <div className="w-12 h-12 rounded-xl bg-surface-container dark:bg-[#292929] text-on-surface-variant dark:text-[#9ca3af] flex items-center justify-center">
                                        <Icon name="assignment" className="w-6 h-6" />
                                    </div>
                                    <p className="mt-4 text-sm font-semibold text-on-surface dark:text-[#f9fafb]">
                                        No questions selected
                                    </p>
                                    <p className="mt-1 text-xs leading-relaxed text-on-surface-variant dark:text-[#9ca3af] max-w-[240px]">
                                        Pick questions from the left repository. They will appear here in quiz sequence.
                                    </p>
                                </div>
                            ) : (
                                selectedQuestions.map((item, index) => {
                                    if (!item) return null
                                    const question = item.question || {}
                                    const itemId = item.id || `item-${index}`
                                    const isDragging = draggedId === itemId
                                    const isDropTarget = dragOverId === itemId && draggedId !== itemId
                                    const marks = Number(item.marks_override ?? question.marks ?? 0)

                                    return (
                                        <div
                                            key={itemId}
                                            draggable={!savingOrder}
                                            onDragStart={(e) => handleDragStart(e, itemId)}
                                            onDragOver={(e) => handleDragOver(e, itemId)}
                                            onDrop={(e) => handleDrop(e, itemId)}
                                            onDragEnd={handleDragEnd}
                                            className={`relative group flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                                                isDragging
                                                    ? "opacity-50 scale-[0.98] shadow-lg border-primary dark:border-blue-500"
                                                    : "bg-surface-container-low dark:bg-[#252525] border-surface-variant/70 dark:border-[#333333] hover:border-surface-variant dark:hover:border-[#444444] hover:bg-surface-container/60 dark:hover:bg-[#2a2a2a]"
                                            } ${
                                                isDropTarget
                                                    ? "border-primary dark:border-blue-400 ring-2 ring-primary/20"
                                                    : ""
                                            }`}
                                        >
                                            {/* Drop indicator line */}
                                            {isDropTarget && (
                                                <div className="absolute -top-1.5 left-3 right-3 h-0.5 rounded-full bg-primary dark:bg-blue-400" />
                                            )}

                                            <div className="flex items-center gap-2 pt-0.5 text-on-surface-variant/60 group-hover:text-on-surface dark:text-[#6b7280] dark:group-hover:text-[#f9fafb] select-none shrink-0">
                                                <Icon name="drag" className="w-4 h-5" />
                                                <span className="w-6 h-6 rounded-md bg-surface-container dark:bg-[#323232] text-on-surface dark:text-[#f9fafb] text-[11px] font-bold flex items-center justify-center">
                                                    {index + 1}
                                                </span>
                                            </div>

                                            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                                <p className="text-xs sm:text-sm font-medium text-on-surface dark:text-[#f9fafb] leading-snug">
                                                    {question.text || question.title || `Question #${question.id || itemId}`}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant dark:text-[#9ca3af] font-medium">
                                                    {question.question_type && (
                                                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide ${TYPE_BADGES[question.question_type] || "bg-surface-variant text-on-surface"}`}>
                                                            {question.question_type}
                                                        </span>
                                                    )}
                                                    {question.difficulty && (
                                                        <>
                                                            <span className="text-outline dark:text-[#6b7280]">•</span>
                                                            <span className={`text-[11px] font-bold uppercase tracking-wider ${DIFFICULTY_STYLES[question.difficulty] || ""}`}>
                                                                {question.difficulty}
                                                            </span>
                                                        </>
                                                    )}
                                                    <span className="text-outline dark:text-[#6b7280]">•</span>
                                                    <span>{marks} marks</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                                {/* Mobile reorder buttons */}
                                                <div className="flex xl:hidden items-center gap-1">
                                                    <button
                                                        type="button"
                                                        disabled={index === 0 || savingOrder}
                                                        onClick={() => moveQuestion(index, -1)}
                                                        className="w-7 h-7 rounded-lg border border-surface-variant dark:border-[#373737] flex items-center justify-center text-on-surface-variant dark:text-[#9ca3af] disabled:opacity-20 hover:bg-surface-container"
                                                    >
                                                        <Icon name="chevronUp" className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={index === selectedQuestions.length - 1 || savingOrder}
                                                        onClick={() => moveQuestion(index, 1)}
                                                        className="w-7 h-7 rounded-lg border border-surface-variant dark:border-[#373737] flex items-center justify-center text-on-surface-variant dark:text-[#9ca3af] disabled:opacity-20 hover:bg-surface-container"
                                                    >
                                                        <Icon name="chevronDown" className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                <button
                                                    type="button"
                                                    disabled={actionId === itemId}
                                                    onClick={() => removeQuestion(itemId)}
                                                    aria-label="Remove question"
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-outline dark:text-[#9ca3af] hover:text-error dark:hover:text-red-400 hover:bg-error/10 dark:hover:bg-red-950/30 transition-all"
                                                >
                                                    {actionId === itemId ? (
                                                        <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 border-t-primary animate-spin" />
                                                    ) : (
                                                        <Icon name="trash" className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Clean Minimal Fixed Action Dock */}
            <footer className="fixed bottom-0 left-0 lg:left-[280px] right-0 h-16 bg-surface-container-lowest/95 dark:bg-[#181818]/95 backdrop-blur-md border-t border-surface-variant dark:border-[#2e2e2e] z-40 flex items-center justify-between px-4 sm:px-8 shadow-2xl transition-[left] duration-300">
                <div className="flex items-center gap-3">
                    <span className="text-sm sm:text-base font-semibold text-on-surface dark:text-[#f9fafb]">
                        {selectedQuestions.length} Questions · {totalMarks} Marks
                    </span>
                    <span className="text-xs text-outline dark:text-[#9ca3af] hidden sm:inline">
                        (Saved automatically to draft)
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        disabled={savingOrder}
                        onClick={() => navigate("/dashboard")}
                        className="px-4 py-2 rounded-xl text-on-surface-variant dark:text-[#9ca3af] hover:text-on-surface dark:hover:text-white hover:bg-surface-container dark:hover:bg-[#282828] text-xs sm:text-sm font-semibold transition-colors disabled:opacity-40"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        disabled={savingOrder || selectedQuestions.length === 0}
                        onClick={finishQuiz}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container dark:bg-blue-600 dark:hover:bg-blue-500 text-on-primary dark:text-white text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {savingOrder ? (
                            <>
                                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <span>Create Quiz</span>
                                <Icon name="arrowRight" className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </footer>
        </TeacherShell>
    )
}