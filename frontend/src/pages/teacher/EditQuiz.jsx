import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"

import API from "../../api/api"
import TeacherShell from "../../components/layout/TeacherShell"
import {
    getQuiz,
    scheduleQuiz,
    startQuiz,
    getQuizQuestions,
    getQuestion,
    updateQuestion,
} from "../../api/quizzes"

function formatQuizTitle(title) {
    if (!title) return "Edit Quiz"
    return title
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
}



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


    const queryClient = useQueryClient()

    useEffect(() => {
        let active = true

        const loadPage = async () => {
            setPageError("")
            setIsLoading(true)

            try {
                // Fetch Quiz
                const quizResponse = await queryClient.fetchQuery({
                    queryKey: ['quiz', quizId],
                    queryFn: async () => {
                        const response = await getQuiz(quizId)
                        return response.data
                    },
                    staleTime: 1000 * 60 * 5
                })

                if (active) {
                    setQuiz(quizResponse)
                    setStartsAt(formatDateTimeLocal(quizResponse.starts_at))
                    setEndsAt(formatDateTimeLocal(quizResponse.ends_at))
                }

                // Fetch Questions
                const quizQuestionsResponse = await queryClient.fetchQuery({
                    queryKey: ['quizQuestions'],
                    queryFn: async () => {
                        const res = await getQuizQuestions()
                        return res.data || []
                    },
                    staleTime: 1000 * 60 * 5
                })

                const quizItems = quizQuestionsResponse
                    .filter((item) => String(item.quiz) === String(quizId))
                    .sort((a, b) => (a.order || 0) - (b.order || 0) || a.id - b.id)

                if (quizItems.length > 0) {
                    const enriched = await Promise.all(
                        quizItems.map(async (item) => {
                            try {
                                const questionData = await queryClient.fetchQuery({
                                    queryKey: ['questionDetails', item.question],
                                    queryFn: async () => {
                                        const res = await getQuestion(item.question)
                                        return res.data
                                    },
                                    staleTime: 1000 * 60 * 5
                                })
                                return {
                                    ...questionData,
                                    quiz_question_id: item.id,
                                    marks: item.marks_override ?? questionData.marks,
                                }
                            } catch (e) {
                                return null
                            }
                        })
                    )
                    if (active) setQuestions(enriched.filter(Boolean))
                } else {
                    // Fallback
                    try {
                        const response = await queryClient.fetchQuery({
                            queryKey: ['legacyQuizQuestions', quizId],
                            queryFn: async () => {
                                const res = await API.get(`../quiz/${quizId}/questions-list/`)
                                return res.data || []
                            },
                            staleTime: 1000 * 60 * 5
                        })
                        if (active) setQuestions(response)
                    } catch {
                        if (active) setQuestions([])
                    }
                }
            } catch (error) {
                console.error("Failed to load page:", error)
                if (active) {
                    setPageError(getErrorMessage(error, "Failed to load quiz data."))
                }
            } finally {
                if (active) setIsLoading(false)
            }
        }

        loadPage()

        return () => { active = false }
    }, [quizId, queryClient])


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
        <TeacherShell
            breadcrumbs={[
                { label: "Quizzes", to: "/dashboard" },
                { label: formatQuizTitle(quiz?.title), to: `/edit-quiz/${quizId}` },
                { label: "Edit" },
            ]}
        >
            <div className="w-full max-w-5xl mx-auto pb-16 text-slate-900 dark:text-slate-100">

                {/* Header */}
                <div className="pt-2 sm:pt-4 mb-6 pb-6 border-b border-slate-200/80 dark:border-slate-800">
                    <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">
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
                    </nav>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {formatQuizTitle(quiz?.title)}
                    </h1>

                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Manage quiz status, schedule, and questions.
                    </p>
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
                    <section className="bg-white dark:bg-[#141518] rounded-xl border border-slate-300/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none mb-6 overflow-hidden">

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-200/80 dark:border-slate-800">

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                                <div>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                        Quiz Status
                                    </h2>

                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Control when students can access this quiz.
                                    </p>
                                </div>

                                <span
                                    className={`inline-flex w-fit items-center px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}
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
                                    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-[#1A1D24]/70 p-4 sm:p-5">

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
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                                                    Start Date & Time
                                                </label>

                                                <div className="relative">
                                                    <input
                                                        type="datetime-local"
                                                        value={startsAt}
                                                        onChange={(event) =>
                                                            setStartsAt(
                                                                event.target.value
                                                            )
                                                        }
                                                        className="w-full h-10 px-3.5 pr-10 rounded-lg border border-slate-300/80 dark:border-[#3A3F47] bg-white dark:bg-[#1E2128] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors cursor-pointer"
                                                    />
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>


                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                                                    End Date & Time
                                                </label>

                                                <div className="relative">
                                                    <input
                                                        type="datetime-local"
                                                        value={endsAt}
                                                        onChange={(event) =>
                                                            setEndsAt(
                                                                event.target.value
                                                            )
                                                        }
                                                        className="w-full h-10 px-3.5 pr-10 rounded-lg border border-slate-300/80 dark:border-[#3A3F47] bg-white dark:bg-[#1E2128] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors cursor-pointer"
                                                    />
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>


                                        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-800">

                                            <button
                                                type="button"
                                                onClick={handleStartNow}
                                                disabled={
                                                    isLifecycleLoading ||
                                                    questions.length === 0
                                                }
                                                className="inline-flex items-center justify-center h-10 px-4 rounded-lg border border-slate-300/80 dark:border-[#3A3F47] bg-white dark:bg-[#181A20] hover:bg-slate-50 dark:hover:bg-[#252830] disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                                            >
                                                Start Now
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleSchedule}
                                                disabled={isLifecycleLoading}
                                                className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer"
                                            >
                                                {isLifecycleLoading
                                                    ? "Saving..."
                                                    : isScheduled
                                                        ? "Update Schedule"
                                                        : "Schedule Quiz"
                                                }
                                            </button>

                                        </div>


                                        {questions.length === 0 && (
                                            <p className="text-right text-xs text-amber-600 dark:text-amber-400 mt-2">
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
                                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-[#1A1D24]/70 p-4">

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
                        <div className="bg-white dark:bg-[#141518] border border-slate-300/80 dark:border-slate-800 rounded-xl p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none">
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


                    <div className="space-y-4">

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
                                        dark:bg-[#141518]
                                        rounded-xl
                                        shadow-[0_1px_3px_rgba(0,0,0,0.04)]
                                        dark:shadow-none
                                        border
                                        ${
                                            isEditing
                                                ? "border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20"
                                                : "border-slate-300/80 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700"
                                        }
                                        p-5 sm:p-6
                                        transition-all duration-200
                                    `}
                                >

                                    {/* Question Header */}
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">

                                        <div className="flex-grow w-full">

                                            {isEditing ? (
                                                <div className="space-y-2">

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
                                                        className="w-full p-3 bg-slate-50 dark:bg-[#181A20] border border-slate-300/80 dark:border-[#3A3F47] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-y transition-all text-sm"
                                                    />

                                                </div>
                                            ) : (
                                                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-snug flex gap-2.5">

                                                    <span className="text-blue-600 dark:text-blue-400 shrink-0 font-bold">
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
                                                        className="h-8 px-3 rounded-lg border border-slate-300/80 dark:border-[#3A3F47] bg-white dark:bg-[#181A20] hover:bg-slate-100 dark:hover:bg-[#252830] text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
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
                                                        className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
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
                                                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-300/80 dark:border-[#3A3F47] bg-white dark:bg-[#181A20] hover:bg-slate-100 dark:hover:bg-[#252830] text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                                                >
                                                    <svg
                                                        className="w-3.5 h-3.5"
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
                                    <div className="h-px w-full bg-slate-100 dark:bg-slate-800/60 my-3.5" />


                                    {/* Options */}
                                    {isEditing && (
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                                            Edit Options (Select radio to set correct answer)
                                        </label>
                                    )}


                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

                                        {options.map((option, optionIndex) => (
                                            <div
                                                key={
                                                    option.id ||
                                                    optionIndex
                                                }
                                                className={`
                                                    flex items-center gap-2.5
                                                    px-3 py-2.5 rounded-lg border text-xs sm:text-sm min-h-[44px]
                                                    transition-all duration-150
                                                    ${
                                                        option.is_correct
                                                            ? "border-emerald-500/60 dark:border-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 font-semibold"
                                                            : isEditing
                                                                ? "border-slate-300/70 dark:border-[#3A3F47] bg-white dark:bg-[#1A1D24] text-slate-800 dark:text-slate-200"
                                                                : "border-slate-200/90 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#141518] text-slate-700 dark:text-slate-300"
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
                                                        className="w-4 h-4 text-emerald-600 bg-slate-100 border-slate-300 focus:ring-emerald-500 focus:ring-2 ml-0.5 cursor-pointer shrink-0"
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
                                                        className="w-full bg-transparent px-1 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-b focus:border-blue-500 transition-colors"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-between w-full pr-1">

                                                        <span className="leading-snug">
                                                            {option.text}
                                                        </span>

                                                        {option.is_correct && (
                                                            <svg
                                                                className="w-4 h-4 text-emerald-500 shrink-0 ml-2"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth="2.5"
                                                                    d="M5 13l4 4L19 7"
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
        </TeacherShell>
    )
}