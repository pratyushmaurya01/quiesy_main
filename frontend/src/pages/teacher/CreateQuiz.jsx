import { useState } from "react"
import { useNavigate } from "react-router-dom"
import TeacherShell from "../../components/layout/TeacherShell"
import { createQuiz } from "../../api/quizzes"

function Icon({ name, className = "w-5 h-5" }) {
    const common = {
        className,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.8",
        viewBox: "0 0 24 24",
    }

    const paths = {
        quiz: (
            <>
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path strokeLinecap="round" d="M7 8h10M7 12h6M7 16h4" />
            </>
        ),
        book: (
            <>
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 014 15.5v-10z"
                />
                <path
                    strokeLinecap="round"
                    d="M8 7h8M8 11h8M8 15h5"
                />
            </>
        ),
        clock: (
            <>
                <circle cx="12" cy="12" r="8.5" />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 7v5l3.2 2"
                />
            </>
        ),
        lock: (
            <>
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path
                    strokeLinecap="round"
                    d="M8 10V7a4 4 0 018 0v3"
                />
            </>
        ),
        attempts: (
            <>
                <circle cx="9" cy="8" r="3" />
                <path
                    strokeLinecap="round"
                    d="M3.5 19a5.5 5.5 0 0111 0"
                />
                <path
                    strokeLinecap="round"
                    d="M16 11a3 3 0 014 3M17 19a4 4 0 013.5-3.95"
                />
            </>
        ),
        eye: (
            <>
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"
                />
                <circle cx="12" cy="12" r="2.5" />
            </>
        ),
        shuffle: (
            <>
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 3h5v5M4 7h2.5c3.8 0 5.2 10 11 10H21"
                />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 14l5 5v-5M4 17h2.5c1.4 0 2.4-.8 3.2-1.8M14.3 8.8C15.3 7.7 16.4 7 17.5 7H21"
                />
            </>
        ),
        arrow: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12h14m-6-6 6 6-6 6"
            />
        ),
        back: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 12H5m6-6-6 6 6 6"
            />
        ),
        check: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12.5l4 4L19 7"
            />
        ),
        alert: (
            <>
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3.5l9 16H3l9-16z"
                />
                <path
                    strokeLinecap="round"
                    d="M12 9v4"
                />
                <path
                    strokeLinecap="round"
                    d="M12 16.5h.01"
                />
            </>
        ),
    }

    return <svg {...common}>{paths[name]}</svg>
}

function Toggle({ checked, onChange, label, description }) {
    return (
        <label className="flex items-center justify-between gap-5 py-3.5 cursor-pointer group">
            <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {description}
                </p>
            </div>

            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={onChange}
                className={`relative shrink-0 w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                    checked
                        ? "bg-blue-600 dark:bg-blue-500"
                        : "bg-slate-300 dark:bg-slate-700"
                }`}
            >
                <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        checked
                            ? "translate-x-5"
                            : "translate-x-1"
                    }`}
                />
            </button>
        </label>
    )
}

function FieldLabel({ children, required = false, optional = false }) {
    return (
        <label className="block mb-2">
            <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                {children}
            </span>

            {required && (
                <span className="ml-1 text-blue-600 dark:text-blue-400">
                    *
                </span>
            )}

            {optional && (
                <span className="ml-2 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    Optional
                </span>
            )}
        </label>
    )
}

export default function CreateQuiz() {
    const navigate = useNavigate()

    const [form, setForm] = useState({
        title: "",
        subject: "",
        description: "",
        duration_minutes: "",
        max_attempts: 1,
        password: "",
        review_enabled: true,
        shuffle_questions: false,
        shuffle_options: false,
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [fieldErrors, setFieldErrors] = useState({})

    const updateField = (name, value) => {
        setForm((current) => ({
            ...current,
            [name]: value,
        }))

        setFieldErrors((current) => ({
            ...current,
            [name]: "",
        }))

        if (error) {
            setError("")
        }
    }

    const validateForm = () => {
        const errors = {}

        if (!form.title.trim()) {
            errors.title = "Quiz title is required."
        }

        if (!form.subject.trim()) {
            errors.subject = "Subject is required."
        }

        if (!form.duration_minutes) {
            errors.duration_minutes = "Duration is required."
        } else if (Number(form.duration_minutes) < 1) {
            errors.duration_minutes = "Duration must be at least 1 minute."
        }

        if (!form.max_attempts) {
            errors.max_attempts = "Maximum attempts is required."
        } else if (Number(form.max_attempts) < 1) {
            errors.max_attempts = "Maximum attempts must be at least 1."
        }

        return errors
    }

    const handleSubmit = async (event) => {
        event.preventDefault()

        const errors = validateForm()

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors)
            setError("Please fix the highlighted fields.")
            return
        }

        setLoading(true)
        setError("")

        try {
            const payload = {
                title: form.title.trim(),
                subject: form.subject.trim(),
                description: form.description.trim(),
                duration_minutes: Number(form.duration_minutes),
                max_attempts: Number(form.max_attempts),
                password: form.password.trim(),
                review_enabled: form.review_enabled,
                shuffle_questions: form.shuffle_questions,
                shuffle_options: form.shuffle_options,
            }

            const response = await createQuiz(payload)

            navigate(`/add-questions/${response.data.id}`)
        } catch (requestError) {
            console.error(requestError)

            const responseData = requestError.response?.data

            if (responseData && typeof responseData === "object") {
                const backendErrors = {}

                Object.entries(responseData).forEach(
                    ([field, value]) => {
                        if (Array.isArray(value)) {
                            backendErrors[field] = value.join(" ")
                        } else if (typeof value === "string") {
                            backendErrors[field] = value
                        }
                    }
                )

                if (Object.keys(backendErrors).length > 0) {
                    setFieldErrors(backendErrors)
                }
            }

            setError(
                "Unable to create the quiz. Please check your details and try again."
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <TeacherShell>
            <div className="w-full max-w-[1280px] mx-auto pb-24">

                {/* Header */}
                <div className="pt-5 sm:pt-7 mb-7">
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs font-medium text-slate-400 dark:text-slate-500 mb-3">
                        <button
                            type="button"
                            onClick={() => navigate("/dashboard")}
                            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            Teacher Dashboard
                        </button>

                        <span>/</span>

                        <span className="text-slate-600 dark:text-slate-300">
                            Create Quiz
                        </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Create Quiz
                            </h1>

                            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                                Set up the basic details of your assessment before adding questions.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#242424] border border-slate-200 dark:border-[#333333] rounded-full px-3 py-1.5 w-fit">
                            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[9px]">
                                1
                            </span>
                            <span>Basic Setup</span>
                            <span className="text-slate-300 dark:text-slate-600">
                                /
                            </span>
                            <span>2</span>
                            <span>Add Questions</span>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-4 py-3.5">
                        <Icon
                            name="alert"
                            className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
                        />

                        <p className="text-sm font-medium text-red-700 dark:text-red-300">
                            {error}
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_310px] gap-6">

                        {/* Main */}
                        <div className="space-y-5">

                            {/* Basic Information */}
                            <section className="bg-white dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#303030] rounded-xl overflow-hidden">
                                <div className="px-5 sm:px-6 py-5 border-b border-slate-200 dark:border-[#303030]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                            <Icon name="quiz" className="w-4 h-4" />
                                        </div>

                                        <div>
                                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                                Basic Information
                                            </h2>

                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Essential details used to identify this quiz.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 sm:p-6 space-y-5">

                                    {/* Title */}
                                    <div>
                                        <FieldLabel required>
                                            Quiz Title
                                        </FieldLabel>

                                        <input
                                            type="text"
                                            value={form.title}
                                            maxLength={200}
                                            onChange={(event) =>
                                                updateField(
                                                    "title",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="e.g. Data Structures & Algorithms Mid-Term"
                                            className={`w-full h-11 px-3.5 rounded-lg border bg-slate-50 dark:bg-[#242424] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none transition-all ${
                                                fieldErrors.title
                                                    ? "border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                                    : "border-slate-200 dark:border-[#373737] focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                            }`}
                                        />

                                        <div className="flex justify-between mt-1.5">
                                            {fieldErrors.title ? (
                                                <span className="text-xs text-red-500">
                                                    {fieldErrors.title}
                                                </span>
                                            ) : (
                                                <span />
                                            )}

                                            <span className="text-[10px] text-slate-400">
                                                {form.title.length}/200
                                            </span>
                                        </div>
                                    </div>

                                    {/* Subject + Duration */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                        <div>
                                            <FieldLabel required>
                                                Subject / Course
                                            </FieldLabel>

                                            <input
                                                type="text"
                                                value={form.subject}
                                                maxLength={100}
                                                onChange={(event) =>
                                                    updateField(
                                                        "subject",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="e.g. CS-302: Advanced Algorithms"
                                                className={`w-full h-11 px-3.5 rounded-lg border bg-slate-50 dark:bg-[#242424] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none transition-all ${
                                                    fieldErrors.subject
                                                        ? "border-red-400 dark:border-red-500"
                                                        : "border-slate-200 dark:border-[#373737] focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                                }`}
                                            />

                                            {fieldErrors.subject && (
                                                <p className="text-xs text-red-500 mt-1.5">
                                                    {fieldErrors.subject}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <FieldLabel required>
                                                Duration
                                            </FieldLabel>

                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={form.duration_minutes}
                                                    onChange={(event) =>
                                                        updateField(
                                                            "duration_minutes",
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="90"
                                                    className={`w-full h-11 px-3.5 pr-16 rounded-lg border bg-slate-50 dark:bg-[#242424] text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none transition-all ${
                                                        fieldErrors.duration_minutes
                                                            ? "border-red-400 dark:border-red-500"
                                                            : "border-slate-200 dark:border-[#373737] focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                                    }`}
                                                />

                                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400">
                                                    MIN
                                                </span>
                                            </div>

                                            {fieldErrors.duration_minutes && (
                                                <p className="text-xs text-red-500 mt-1.5">
                                                    {fieldErrors.duration_minutes}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <FieldLabel optional>
                                            Description
                                        </FieldLabel>

                                        <textarea
                                            rows={4}
                                            value={form.description}
                                            onChange={(event) =>
                                                updateField(
                                                    "description",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Add a short description or instructions for students..."
                                            className="w-full px-3.5 py-3 rounded-lg border border-slate-200 dark:border-[#373737] bg-slate-50 dark:bg-[#242424] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none transition-all resize-y min-h-[105px] focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                        />

                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                                            This can be shown to students before they begin the assessment.
                                        </p>
                                    </div>

                                    {/* Password + Attempts */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">

                                        <div>
                                            <FieldLabel optional>
                                                Access Code / Password
                                            </FieldLabel>

                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                                    <Icon
                                                        name="lock"
                                                        className="w-4 h-4"
                                                    />
                                                </span>

                                                <input
                                                    type="text"
                                                    maxLength={128}
                                                    value={form.password}
                                                    onChange={(event) =>
                                                        updateField(
                                                            "password",
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="Leave empty for open access"
                                                    className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-slate-200 dark:border-[#373737] bg-slate-50 dark:bg-[#242424] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none transition-all focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                                />
                                            </div>

                                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                                                Students will need this code to enter the quiz.
                                            </p>
                                        </div>

                                        <div>
                                            <FieldLabel required>
                                                Maximum Attempts
                                            </FieldLabel>

                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                                    <Icon
                                                        name="attempts"
                                                        className="w-4 h-4"
                                                    />
                                                </span>

                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={form.max_attempts}
                                                    onChange={(event) =>
                                                        updateField(
                                                            "max_attempts",
                                                            event.target.value
                                                        )
                                                    }
                                                    className={`w-full h-11 pl-10 pr-3.5 rounded-lg border bg-slate-50 dark:bg-[#242424] text-sm font-medium text-slate-900 dark:text-white outline-none transition-all ${
                                                        fieldErrors.max_attempts
                                                            ? "border-red-400 dark:border-red-500"
                                                            : "border-slate-200 dark:border-[#373737] focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                                    }`}
                                                />
                                            </div>

                                            {fieldErrors.max_attempts && (
                                                <p className="text-xs text-red-500 mt-1.5">
                                                    {fieldErrors.max_attempts}
                                                </p>
                                            )}

                                            {!fieldErrors.max_attempts && (
                                                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                                                    How many times a student can attempt this quiz.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Quiz Settings */}
                            <section className="bg-white dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#303030] rounded-xl overflow-hidden">
                                <div className="px-5 sm:px-6 py-5 border-b border-slate-200 dark:border-[#303030]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#292929] text-slate-600 dark:text-slate-300 flex items-center justify-center">
                                            <Icon
                                                name="shuffle"
                                                className="w-4 h-4"
                                            />
                                        </div>

                                        <div>
                                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                                Quiz Settings
                                            </h2>

                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Control how candidates experience the assessment.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-5 sm:px-6 divide-y divide-slate-100 dark:divide-[#303030]">
                                    <Toggle
                                        checked={form.review_enabled}
                                        onChange={() =>
                                            updateField(
                                                "review_enabled",
                                                !form.review_enabled
                                            )
                                        }
                                        label="Review Enabled"
                                        description="Allow students to review their submitted responses after the quiz ends."
                                    />

                                    <Toggle
                                        checked={form.shuffle_questions}
                                        onChange={() =>
                                            updateField(
                                                "shuffle_questions",
                                                !form.shuffle_questions
                                            )
                                        }
                                        label="Shuffle Questions"
                                        description="Randomize the question order for each student."
                                    />

                                    <Toggle
                                        checked={form.shuffle_options}
                                        onChange={() =>
                                            updateField(
                                                "shuffle_options",
                                                !form.shuffle_options
                                            )
                                        }
                                        label="Shuffle Options"
                                        description="Randomize answer options for each student."
                                    />
                                </div>
                            </section>

                            {/* Scheduling Notice */}
                            <div className="flex items-start gap-3.5 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-950/20 px-4 py-4">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <Icon
                                        name="clock"
                                        className="w-4 h-4"
                                    />
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                        Schedule this quiz later
                                    </p>

                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                        Start and end times can be configured later from Quiz Settings after the quiz has been created.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Summary */}
                        <aside className="xl:sticky xl:top-20 h-fit space-y-4">

                            <div className="bg-white dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#303030] rounded-xl overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-200 dark:border-[#303030] flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Icon
                                            name="quiz"
                                            className="w-4 h-4 text-blue-600 dark:text-blue-400"
                                        />

                                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                                            Quiz Summary
                                        </h3>
                                    </div>

                                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-slate-100 dark:bg-[#292929] text-slate-500 dark:text-slate-400">
                                        DRAFT
                                    </span>
                                </div>

                                <div className="p-5">
                                    <div className="mb-5">
                                        <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mb-1.5">
                                            Title
                                        </p>

                                        <p className="text-sm font-semibold text-slate-900 dark:text-white break-words">
                                            {form.title || "Untitled Quiz"}
                                        </p>
                                    </div>

                                    <div className="space-y-3.5">

                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                Subject
                                            </span>

                                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 text-right max-w-[170px] truncate">
                                                {form.subject || "Not set"}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-3">
                                            <span className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                <Icon
                                                    name="clock"
                                                    className="w-3.5 h-3.5"
                                                />
                                                Duration
                                            </span>

                                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                {form.duration_minutes
                                                    ? `${form.duration_minutes} min`
                                                    : "Not set"}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-3">
                                            <span className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                <Icon
                                                    name="attempts"
                                                    className="w-3.5 h-3.5"
                                                />
                                                Attempts
                                            </span>

                                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                {form.max_attempts || "Not set"}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-3">
                                            <span className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                <Icon
                                                    name="book"
                                                    className="w-3.5 h-3.5"
                                                />
                                                Questions
                                            </span>

                                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                0
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#303030]">
                                        <div className="flex items-start gap-2.5">
                                            <Icon
                                                name="check"
                                                className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"
                                            />

                                            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                                After creating the quiz, you will select reusable questions from your Question Bank.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Engine status */}
                            <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/15 px-4 py-3.5">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    </span>

                                    <div>
                                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                                            Assessment Engine
                                        </p>

                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                            Ready for question selection
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-7 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
                        <button
                            type="button"
                            onClick={() => navigate("/dashboard")}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#292929] transition-colors disabled:opacity-50"
                        >
                            <Icon
                                name="back"
                                className="w-4 h-4"
                            />
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 h-11 px-5 sm:px-6 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-semibold shadow-sm shadow-blue-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                    Creating Quiz...
                                </>
                            ) : (
                                <>
                                    Continue to Add Questions
                                    <Icon
                                        name="arrow"
                                        className="w-4 h-4"
                                    />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </TeacherShell>
    )
}