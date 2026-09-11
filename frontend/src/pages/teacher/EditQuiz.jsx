import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"

import API from "../../api/api"
import {
    getQuiz,
    scheduleQuiz,
    startQuiz,
    getQuizQuestions,
    getQuestion,
    updateQuestion,
} from "../../api/quizzes"


function formatDateTimeLocal(value) {
    if (!value) {
        return ""
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return ""
    }

    const offset = date.getTimezoneOffset()
    const localDate = new Date(
        date.getTime() - offset * 60 * 1000
    )

    return localDate.toISOString().slice(0, 16)
}


function toISOString(value) {
    if (!value) {
        return ""
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return ""
    }

    return date.toISOString()
}


function getErrorMessage(error, fallback) {
    const data = error?.response?.data

    if (!data) {
        return fallback
    }

    if (typeof data === "string") {
        return data
    }

    if (data.detail) {
        return data.detail
    }

    for (const value of Object.values(data)) {
        if (Array.isArray(value) && value.length > 0) {
            return value.join(" ")
        }

        if (typeof value === "string") {
            return value
        }
    }

    return fallback
}


export default function EditQuiz() {
    const { quizId } = useParams()
    const navigate = useNavigate()

    const [quiz, setQuiz] = useState(null)

    const [questions, setQuestions] = useState([])
    const [editingId, setEditingId] = useState(null)

    const [isLoading, setIsLoading] = useState(true)
    const [isLifecycleLoading, setIsLifecycleLoading] = useState(false)
    const [isSavingQuestion, setIsSavingQuestion] = useState(false)

    const [startsAt, setStartsAt] = useState("")
    const [endsAt, setEndsAt] = useState("")

    const [pageError, setPageError] = useState("")
    const [lifecycleError, setLifecycleError] = useState("")
    const [lifecycleSuccess, setLifecycleSuccess] = useState("")


    // ---------------------------------------------------------
    // Fetch quiz
    // ---------------------------------------------------------

    const fetchQuiz = async () => {
        try {
            const response = await getQuiz(quizId)

            setQuiz(response.data)

            setStartsAt(
                formatDateTimeLocal(
                    response.data.starts_at
                )
            )

            setEndsAt(
                formatDateTimeLocal(
                    response.data.ends_at
                )
            )
        } catch (error) {
            console.error("Failed to fetch quiz:", error)

            setPageError(
                getErrorMessage(
                    error,
                    "Failed to load quiz."
                )
            )
        }
    }


    // ---------------------------------------------------------
    // Existing question fetching
    // ---------------------------------------------------------

    const fetchQuestions = async () => {
        setIsLoading(true)

        try {
            // First try modern apps.quizzes quiz questions
            const quizQuestionsResponse = await getQuizQuestions()
            const quizItems = (quizQuestionsResponse.data || [])
                .filter((item) => String(item.quiz) === String(quizId))
                .sort((a, b) => (a.order || 0) - (b.order || 0) || a.id - b.id)

            if (quizItems.length > 0) {
                const enriched = await Promise.all(
                    quizItems.map(async (item) => {
                        try {
                            const questionResponse = await getQuestion(item.question)
                            return {
                                ...questionResponse.data,
                                quiz_question_id: item.id,
                                marks: item.marks_override ?? questionResponse.data.marks,
                            }
                        } catch (e) {
                            return null
                        }
                    })
                )
                setQuestions(enriched.filter(Boolean))
            } else {
                // Fallback to legacy quiz questions endpoint if not using modern quiz_questions
                try {
                    const response = await API.get(`../quiz/${quizId}/questions-list/`)
                    setQuestions(response.data || [])
                } catch {
                    setQuestions([])
                }
            }
        } catch (error) {
            console.error(
                "Failed to fetch questions:",
                error
            )

            setPageError(
                "Failed to load quiz questions."
            )
        } finally {
            setIsLoading(false)
        }
    }


    useEffect(() => {
        const loadPage = async () => {
            setPageError("")

            await Promise.all([
                fetchQuiz(),
                fetchQuestions(),
            ])
        }

        loadPage()
    }, [quizId])


    // ---------------------------------------------------------
    // Question editing
    // ---------------------------------------------------------

    const handleQuestionChange = (
        id,
        field,
        value
    ) => {
        setQuestions((previous) =>
            previous.map((question) =>
                question.id === id
                    ? {
                        ...question,
                        [field]: value,
                    }
                    : question
            )
        )
    }


    const handleOptionChange = (
        questionId,
        optionIndex,
        value
    ) => {
        setQuestions((previous) =>
            previous.map((question) => {
                if (question.id !== questionId) {
                    return question
                }

                const newOptions = [
                    ...(question.options || []),
                ]

                if (!newOptions[optionIndex]) {
                    return question
                }

                newOptions[optionIndex] = {
                    ...newOptions[optionIndex],
                    text: value,
                }

                return {
                    ...question,
                    options: newOptions,
                }
            })
        )
    }


    const handleCorrectSelect = (
        questionId,
        optionIndex
    ) => {
        setQuestions((previous) =>
            previous.map((question) => {
                if (question.id !== questionId) {
                    return question
                }

                const newOptions = (
                    question.options || []
                ).map((option, index) => ({
                    ...option,
                    is_correct:
                        index === optionIndex,
                }))

                return {
                    ...question,
                    options: newOptions,
                }
            })
        )
    }


    const handleCancel = () => {
        setEditingId(null)
        fetchQuestions()
    }


    const handleSave = async (question) => {
        setIsSavingQuestion(true)

        try {
            if (question.quiz_question_id || question.question_type) {
                // Modern question update via Question Bank API
                const payload = {
                    text: question.text,
                    marks: question.marks,
                    options: (question.options || []).map((opt) => ({
                        text: opt.text,
                        is_correct: Boolean(opt.is_correct),
                    })),
                }
                await updateQuestion(question.id, payload)
            } else {
                // Legacy question update
                const body = {
                    question_id: question.id,
                    text: question.text,
                    marks: question.marks,
                    options: question.options,
                }
                await API.put("../update-question/", body)
            }

            setEditingId(null)
            await fetchQuestions()
        } catch (error) {
            console.error(error)

            alert(
                getErrorMessage(
                    error,
                    "Failed to save question."
                )
            )
        } finally {
            setIsSavingQuestion(false)
        }
    }


    // ---------------------------------------------------------
    // Quiz lifecycle
    // ---------------------------------------------------------

    const handleSchedule = async () => {
      setLifecycleError("")
      setLifecycleSuccess("")

      if (!startsAt) {
          setLifecycleError(
              "Start date and time are required."
          )
          return
      }

      if (!endsAt) {
          setLifecycleError(
              "End date and time are required."
          )
          return
      }

      const start = new Date(startsAt)
      const end = new Date(endsAt)

      if (
          Number.isNaN(start.getTime()) ||
          Number.isNaN(end.getTime())
      ) {
          setLifecycleError(
              "Please provide valid date and time values."
          )
          return
      }

      if (end <= start) {
          setLifecycleError(
              "End time must be after start time."
          )
          return
      }

      setIsLifecycleLoading(true)

      try {
          await scheduleQuiz(
              quizId,
              toISOString(startsAt),
              toISOString(endsAt)
          )

          const response = await getQuiz(quizId)

          setQuiz(response.data)

          setStartsAt(
              formatDateTimeLocal(
                  response.data.starts_at
              )
          )

          setEndsAt(
              formatDateTimeLocal(
                  response.data.ends_at
              )
          )

          setLifecycleSuccess(
              "Quiz scheduled successfully."
          )
      } catch (error) {
          console.error(error)

          setLifecycleError(
              getErrorMessage(
                  error,
                  "Failed to schedule quiz."
              )
          )
      } finally {
          setIsLifecycleLoading(false)
      }
  }


  const handleStartNow = async () => {
      setLifecycleError("")
      setLifecycleSuccess("")

      const confirmed = window.confirm(
          "Start this quiz now? Students will be able to access it immediately."
      )

      if (!confirmed) {
          return
      }

      setIsLifecycleLoading(true)

      try {
          await startQuiz(quizId)

          const response = await getQuiz(quizId)

          setQuiz(response.data)

          setStartsAt(
              formatDateTimeLocal(
                  response.data.starts_at
              )
          )

          setEndsAt(
              formatDateTimeLocal(
                  response.data.ends_at
              )
          )

          setLifecycleSuccess(
              "Quiz is now active."
          )
      } catch (error) {
          console.error(error)

          setLifecycleError(
              getErrorMessage(
                  error,
                  "Failed to start quiz."
              )
          )
      } finally {
          setIsLifecycleLoading(false)
      }
  }


    // ---------------------------------------------------------
    // Status helpers
    // ---------------------------------------------------------

    const status = quiz?.status || "DRAFT"

    const isDraft = status === "DRAFT"
    const isScheduled = status === "SCHEDULED"
    const isActive = status === "ACTIVE"


    const statusLabel = {
        DRAFT: "Draft",
        SCHEDULED: "Scheduled",
        ACTIVE: "Active",
        CLOSED: "Closed",
        EVALUATED: "Evaluated",
    }[status] || status


    const statusClass = {
        DRAFT:
            "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        SCHEDULED:
            "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
        ACTIVE:
            "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300",
        CLOSED:
            "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
        EVALUATED:
            "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
    }[status] || ""


    // ---------------------------------------------------------
    // Render
    // ---------------------------------------------------------

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 font-sans text-slate-900 dark:text-slate-100">

            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">

                    <div>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500 mb-3">
                            <Link
                                to="/dashboard"
                                className="hover:text-blue-600 dark:hover:text-blue-400"
                            >
                                Teacher Dashboard
                            </Link>

                            <span>/</span>

                            <span className="text-slate-600 dark:text-slate-300">
                                Edit Quiz
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {quiz?.title || "Edit Quiz"}
                        </h1>

                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Manage quiz status, schedule, and questions.
                        </p>
                    </div>

                    <Link
                        to="/dashboard"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm transition-all"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />
                        </svg>

                        Back to Dashboard
                    </Link>

                </div>


                {/* Page Error */}
                {pageError && (
                    <div className="mb-6 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                        {pageError}
                    </div>
                )}


                {/* =================================================
                    QUIZ STATUS
                ================================================== */}

                {quiz && (
                    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 overflow-hidden">

                        <div className="px-5 sm:px-6 py-5 border-b border-slate-200 dark:border-slate-800">

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                                <div>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                        Quiz Status
                                    </h2>

                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Control when students can access this quiz.
                                    </p>
                                </div>

                                <span
                                    className={`inline-flex w-fit items-center px-3 py-1.5 rounded-full text-xs font-semibold ${statusClass}`}
                                >
                                    {statusLabel}
                                </span>

                            </div>

                        </div>


                        <div className="p-5 sm:p-6">

                            {/* Draft / Schedule / Start */}
                            {(isDraft || isScheduled) && (
                                <div className="space-y-5">

                                    {/* Schedule */}
                                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-4 sm:p-5">

                                        <div className="mb-4">

                                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {isScheduled
                                                    ? "Update Schedule"
                                                    : "Schedule Quiz"
                                                }
                                            </h3>

                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                Choose when the quiz should become available.
                                            </p>

                                        </div>


                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                                                    Start Date & Time
                                                </label>

                                                <input
                                                    type="datetime-local"
                                                    value={startsAt}
                                                    onChange={(event) =>
                                                        setStartsAt(
                                                            event.target.value
                                                        )
                                                    }
                                                    className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                                />
                                            </div>


                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                                                    End Date & Time
                                                </label>

                                                <input
                                                    type="datetime-local"
                                                    value={endsAt}
                                                    onChange={(event) =>
                                                        setEndsAt(
                                                            event.target.value
                                                        )
                                                    }
                                                    className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                                />
                                            </div>

                                        </div>


                                        <div className="flex flex-col sm:flex-row gap-3 mt-5">

                                            <button
                                                type="button"
                                                onClick={handleSchedule}
                                                disabled={isLifecycleLoading}
                                                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                                            >
                                                {isLifecycleLoading
                                                    ? "Saving..."
                                                    : isScheduled
                                                        ? "Update Schedule"
                                                        : "Schedule Quiz"
                                                }
                                            </button>


                                            <button
                                                type="button"
                                                onClick={handleStartNow}
                                                disabled={
                                                    isLifecycleLoading ||
                                                    questions.length === 0
                                                }
                                                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors"
                                            >
                                                Start Now
                                            </button>

                                        </div>


                                        {questions.length === 0 && (
                                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
                                                Add at least one question before starting the quiz.
                                            </p>
                                        )}

                                    </div>

                                </div>
                            )}


                            {/* Active */}
                            {isActive && (
                                <div className="rounded-xl border border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-950/20 p-4 sm:p-5">

                                    <div className="flex items-start gap-3">

                                        <div className="mt-0.5 flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400">

                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>

                                        </div>

                                        <div>
                                            <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">
                                                Quiz is Active
                                            </h3>

                                            <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                                                Students can currently access this quiz.
                                            </p>
                                        </div>

                                    </div>

                                </div>
                            )}


                            {/* Closed / Evaluated */}
                            {(status === "CLOSED" || status === "EVALUATED") && (
                                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-4">

                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        This quiz is <strong>{statusLabel.toLowerCase()}</strong>. Lifecycle controls are no longer available here.
                                    </p>

                                </div>
                            )}


                            {/* Feedback */}
                            {lifecycleError && (
                                <div className="mt-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                                    {lifecycleError}
                                </div>
                            )}

                            {lifecycleSuccess && (
                                <div className="mt-4 rounded-lg border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/20 px-4 py-3 text-sm text-green-700 dark:text-green-300">
                                    {lifecycleSuccess}
                                </div>
                            )}

                        </div>

                    </section>
                )}


                {/* =================================================
                    QUESTIONS
                ================================================== */}

                <section>

                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">

                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                Manage Questions
                            </h2>

                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Review and edit existing questions for this quiz.
                            </p>
                        </div>

                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {questions.length} question
                            {questions.length === 1 ? "" : "s"}
                        </span>

                    </div>


                    {isLoading && (
                        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                            Loading questions...
                        </div>
                    )}


                    {!isLoading && questions.length === 0 && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-sm">
                            <p className="text-slate-500 dark:text-slate-400 mb-4">
                                No questions found for this quiz. Add questions to start the quiz.
                            </p>
                            <Link
                                to={`/add-questions/${quizId}`}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                                Add Questions from Bank
                            </Link>
                        </div>
                    )}


                    <div className="space-y-6">

                        {questions.map((question, index) => {

                            const isEditing =
                                editingId === question.id

                            const options =
                                question.options || []

                            return (
                                <div
                                    key={
                                        question.id ||
                                        index
                                    }
                                    className={`
                                        bg-white
                                        dark:bg-slate-900
                                        rounded-2xl
                                        shadow-sm
                                        border
                                        ${
                                            isEditing
                                                ? "border-blue-400 dark:border-blue-500 shadow-md ring-4 ring-blue-500/10"
                                                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                                        }
                                        p-5 sm:p-7
                                        transition-all duration-200
                                    `}
                                >

                                    {/* Question Header */}
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">

                                        <div className="flex-grow w-full">

                                            {isEditing ? (
                                                <div className="space-y-3">

                                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                        Edit Question Text
                                                    </label>

                                                    <textarea
                                                        value={
                                                            question.text || ""
                                                        }
                                                        onChange={(event) =>
                                                            handleQuestionChange(
                                                                question.id,
                                                                "text",
                                                                event.target.value
                                                            )
                                                        }
                                                        rows="2"
                                                        className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-y transition-all"
                                                    />

                                                </div>
                                            ) : (
                                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white leading-snug flex gap-3">

                                                    <span className="text-blue-600 dark:text-blue-500 shrink-0">
                                                        Q{index + 1}.
                                                    </span>

                                                    {question.text}

                                                </h3>
                                            )}

                                        </div>


                                        {/* Actions */}
                                        <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">

                                            {isEditing ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={handleCancel}
                                                        disabled={
                                                            isSavingQuestion
                                                        }
                                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        Cancel
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleSave(
                                                                question
                                                            )
                                                        }
                                                        disabled={
                                                            isSavingQuestion
                                                        }
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
                                                    >

                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M5 13l4 4L19 7"
                                                            />
                                                        </svg>

                                                        {isSavingQuestion
                                                            ? "Saving..."
                                                            : "Save"
                                                        }

                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setEditingId(
                                                            question.id
                                                        )
                                                    }
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors"
                                                >

                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                                        />
                                                    </svg>

                                                    Edit

                                                </button>
                                            )}

                                        </div>

                                    </div>


                                    {/* Divider */}
                                    <div className="h-px w-full bg-slate-100 dark:bg-slate-800/50 my-4" />


                                    {/* Options */}
                                    {isEditing && (
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                                            Edit Options (Select radio to set correct answer)
                                        </label>
                                    )}


                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                                        {options.map((option, optionIndex) => (
                                            <div
                                                key={
                                                    option.id ||
                                                    optionIndex
                                                }
                                                className={`
                                                    flex items-center gap-3
                                                    p-3 rounded-xl border
                                                    transition-all duration-200
                                                    ${
                                                        option.is_correct
                                                            ? "border-green-500 bg-green-50 dark:bg-green-500/10"
                                                            : isEditing
                                                                ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30"
                                                                : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20"
                                                    }
                                                `}
                                            >

                                                {isEditing && (
                                                    <input
                                                        type="radio"
                                                        checked={
                                                            Boolean(
                                                                option.is_correct
                                                            )
                                                        }
                                                        onChange={() =>
                                                            handleCorrectSelect(
                                                                question.id,
                                                                optionIndex
                                                            )
                                                        }
                                                        className="w-4 h-4 text-green-600 bg-slate-100 border-slate-300 focus:ring-green-500 focus:ring-2 ml-1 cursor-pointer"
                                                    />
                                                )}


                                                {isEditing ? (
                                                    <input
                                                        value={
                                                            option.text || ""
                                                        }
                                                        onChange={(event) =>
                                                            handleOptionChange(
                                                                question.id,
                                                                optionIndex,
                                                                event.target.value
                                                            )
                                                        }
                                                        className="w-full bg-transparent p-1 text-slate-900 dark:text-white focus:outline-none focus:border-b focus:border-blue-500 transition-colors"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-between w-full pr-2">

                                                        <span className="text-slate-700 dark:text-slate-300">
                                                            {option.text}
                                                        </span>

                                                        {option.is_correct && (
                                                            <svg
                                                                className="w-5 h-5 text-green-500"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth="2"
                                                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                />
                                                            </svg>
                                                        )}

                                                    </div>
                                                )}

                                            </div>
                                        ))}

                                    </div>

                                </div>
                            )
                        })}

                    </div>

                </section>

            </div>

        </div>
    )
}