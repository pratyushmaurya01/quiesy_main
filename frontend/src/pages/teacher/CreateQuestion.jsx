import { useState } from "react"
import { useNavigate } from "react-router-dom"

import TeacherShell from "../../components/layout/TeacherShell"
import { createQuestion } from "../../api/quizzes"

const QUESTION_TYPES = [
    {
        value: "MCQ",
        label: "Multiple Choice",
        icon: "radio",
    },
    {
        value: "MSQ",
        label: "Multiple Select",
        icon: "check",
    },
    {
        value: "SUBJECTIVE",
        label: "Subjective",
        icon: "subject",
    },
    {
        value: "CODING",
        label: "Coding",
        icon: "code",
    },
]

const createOption = () => ({
    text: "",
    is_correct: false,
    order: 0,
})

const createTestCase = () => ({
    input_data: "",
    expected_output: "",
    is_sample: false,
    order: 0,
})

function Icon({ name, className = "h-5 w-5" }) {
    const paths = {
        radio: (
            <>
                <circle cx="12" cy="12" r="8.5" />
                <circle
                    cx="12"
                    cy="12"
                    r="3.5"
                    fill="currentColor"
                    stroke="none"
                />
            </>
        ),

        check: (
            <>
                <rect x="4" y="4" width="16" height="16" rx="3" />
                <path
                    d="M8 12l2.5 2.5L16 9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </>
        ),

        subject: (
            <>
                <path
                    d="M5 5h14M5 9h14M5 13h9M5 17h6"
                    strokeLinecap="round"
                />
            </>
        ),

        code: (
            <>
                <path
                    d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </>
        ),

        eye: (
            <>
                <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
                <circle cx="12" cy="12" r="2.5" />
            </>
        ),

        plus: (
            <>
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </>
        ),

        trash: (
            <>
                <path
                    d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </>
        ),

        chevron: (
            <path
                d="M7 10l5 5 5-5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        ),

        save: (
            <>
                <path d="M5 4h11l3 3v13H5z" strokeLinejoin="round" />
                <path d="M8 4v5h7V4M8 20v-6h8v6" />
            </>
        ),
    }

    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
        >
            {paths[name]}
        </svg>
    )
}

function TypeIcon({ type }) {
    const icon =
        QUESTION_TYPES.find((item) => item.value === type)?.icon ||
        "subject"

    return <Icon name={icon} />
}

function Preview({ form, options, testCases }) {
    const questionText =
        form.text.trim() || "Your question will appear here..."

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-[16px] font-semibold text-slate-900 dark:text-white">
                    <Icon
                        name="eye"
                        className="h-5 w-5 text-blue-600 dark:text-[#4d8eff]"
                    />
                    Live Preview
                </h3>

                <span className="flex items-center gap-2 text-[11px] font-medium text-slate-400 dark:text-[#a8abb8]">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                    Unsaved changes
                </span>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#2a2a2a] dark:bg-[#1a1a1a]">
                <div className="absolute left-0 top-0 h-1 w-full bg-[#2563eb]" />

                <div className="mb-6 flex flex-wrap items-center gap-2 pt-1">
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 dark:border-[#0267b8]/40 dark:bg-[#0267b8]/30 dark:text-[#a4c9ff]">
                        {form.question_type}
                    </span>

                    <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-700 dark:border-[#00a74b]/30 dark:bg-[#00a74b]/20 dark:text-[#4ae176]">
                        {form.marks || 0} Marks
                    </span>

                    <span className="ml-auto rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-[#383838] dark:bg-[#222222] dark:text-[#c2c6d6]">
                        {form.difficulty === "MEDIUM"
                            ? "Medium"
                            : form.difficulty === "EASY"
                              ? "Easy"
                              : "Hard"}
                    </span>
                </div>

                <div className="mb-6 whitespace-pre-wrap text-[15px] font-medium leading-relaxed text-slate-900 dark:text-white">
                    {questionText}
                </div>

                {form.question_type === "MCQ" && (
                    <div className="space-y-3">
                        {options.map((option, index) => (
                            <div
                                key={index}
                                className={`flex items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                                    option.is_correct
                                        ? "border-blue-300 bg-blue-50/70 dark:border-[#353b47] dark:bg-[#1d222b]"
                                        : "border-slate-200 bg-slate-50 dark:border-[#2c2c2c] dark:bg-[#171717]"
                                }`}
                            >
                                <div
                                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                                        option.is_correct
                                            ? "border-[#4d8eff] bg-[#4d8eff]"
                                            : "border-slate-300 dark:border-[#545864]"
                                    }`}
                                >
                                    {option.is_correct && (
                                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                    )}
                                </div>

                                <span className="text-sm text-slate-700 dark:text-[#c2c6d6]">
                                    {option.text ||
                                        `Option ${index + 1}`}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {form.question_type === "MSQ" && (
                    <div className="space-y-3">
                        {options.map((option, index) => (
                            <div
                                key={index}
                                className={`flex items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                                    option.is_correct
                                        ? "border-blue-300 bg-blue-50/70 dark:border-[#353b47] dark:bg-[#1d222b]"
                                        : "border-slate-200 bg-slate-50 dark:border-[#2c2c2c] dark:bg-[#171717]"
                                }`}
                            >
                                <div
                                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
                                        option.is_correct
                                            ? "border-[#4d8eff] bg-[#4d8eff]"
                                            : "border-slate-300 dark:border-[#545864]"
                                    }`}
                                >
                                    {option.is_correct && (
                                        <span className="text-[9px] font-bold text-white">
                                            ✓
                                        </span>
                                    )}
                                </div>

                                <span className="text-sm text-slate-700 dark:text-[#c2c6d6]">
                                    {option.text ||
                                        `Option ${index + 1}`}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {form.question_type === "SUBJECTIVE" && (
                    <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-400 dark:border-[#383838] dark:text-[#737686]">
                        Student answer area
                    </div>
                )}

                {form.question_type === "CODING" && (
                    <div className="space-y-3">
                        <div className="rounded-xl bg-[#0e0e0e] p-4 font-mono text-xs text-slate-300">
                            {form.starter_code.trim() ||
                                "// Starter code"}
                        </div>

                        <div className="text-xs font-medium text-slate-500 dark:text-[#8c909f]">
                            {testCases.length} test case
                            {testCases.length !== 1 ? "s" : ""}
                        </div>
                    </div>
                )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-[#2a2a2a] dark:bg-[#1a1a1a]">
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#8c909f]">
                    Metadata Summary
                </h4>

                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-slate-500 dark:text-[#8c909f]">
                            Topic
                        </span>

                        <span className="font-medium text-slate-900 dark:text-white">
                            {form.topic || "—"}
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-slate-500 dark:text-[#8c909f]">
                            Marks
                        </span>

                        <span className="font-medium text-slate-900 dark:text-white">
                            {form.marks}
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-slate-500 dark:text-[#8c909f]">
                            Type
                        </span>

                        <span className="font-medium text-slate-900 dark:text-white">
                            {form.question_type}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function CreateQuestion() {
    const navigate = useNavigate()

    const [form, setForm] = useState({
        title: "",
        text: "",
        question_type: "MCQ",
        difficulty: "MEDIUM",
        topic: "",
        marks: 1,
        starter_code: "",
    })

    const [options, setOptions] = useState([
        createOption(),
        createOption(),
        createOption(),
    ])

    const [testCases, setTestCases] = useState([
        createTestCase(),
    ])

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [fieldErrors, setFieldErrors] = useState({})

    const handleChange = (event) => {
        const { name, value } = event.target

        setForm((current) => ({
            ...current,
            [name]: value,
        }))

        setFieldErrors((current) => ({
            ...current,
            [name]: undefined,
        }))

        setError("")
    }

    const handleTypeChange = (type) => {
        setForm((current) => ({
            ...current,
            question_type: type,
        }))

        setError("")
        setFieldErrors({})
    }

    const updateOption = (index, field, value) => {
        setOptions((current) =>
            current.map((option, optionIndex) =>
                optionIndex === index
                    ? {
                          ...option,
                          [field]: value,
                      }
                    : option
            )
        )
    }

    const selectCorrectOption = (index) => {
        if (form.question_type === "MCQ") {
            setOptions((current) =>
                current.map((option, optionIndex) => ({
                    ...option,
                    is_correct: optionIndex === index,
                }))
            )

            return
        }

        setOptions((current) =>
            current.map((option, optionIndex) =>
                optionIndex === index
                    ? {
                          ...option,
                          is_correct: !option.is_correct,
                      }
                    : option
            )
        )
    }

    const addOption = () => {
        setOptions((current) => [
            ...current,
            {
                ...createOption(),
                order: current.length,
            },
        ])
    }

    const removeOption = (index) => {
        if (options.length <= 2) {
            return
        }

        setOptions((current) =>
            current
                .filter((_, optionIndex) => optionIndex !== index)
                .map((option, optionIndex) => ({
                    ...option,
                    order: optionIndex,
                }))
        )
    }

    const updateTestCase = (index, field, value) => {
        setTestCases((current) =>
            current.map((testCase, testCaseIndex) =>
                testCaseIndex === index
                    ? {
                          ...testCase,
                          [field]: value,
                      }
                    : testCase
            )
        )
    }

    const addTestCase = () => {
        setTestCases((current) => [
            ...current,
            {
                ...createTestCase(),
                order: current.length,
            },
        ])
    }

    const removeTestCase = (index) => {
        if (testCases.length <= 1) {
            return
        }

        setTestCases((current) =>
            current
                .filter((_, testCaseIndex) => testCaseIndex !== index)
                .map((testCase, testCaseIndex) => ({
                    ...testCase,
                    order: testCaseIndex,
                }))
        )
    }

    const validateForm = () => {
        const errors = {}

        if (!form.text.trim()) {
            errors.text = "Question content is required."
        }

        if (!form.marks || Number(form.marks) < 1) {
            errors.marks = "Marks must be at least 1."
        }

        if (
            form.question_type === "MCQ" ||
            form.question_type === "MSQ"
        ) {
            const filledOptions = options.filter(
                (option) => option.text.trim()
            )

            if (filledOptions.length < 2) {
                errors.options =
                    "At least 2 options are required."
            }

            const correctCount = options.filter(
                (option) => option.is_correct
            ).length

            if (
                form.question_type === "MCQ" &&
                correctCount !== 1
            ) {
                errors.options =
                    "MCQ must have exactly one correct option."
            }

            if (
                form.question_type === "MSQ" &&
                correctCount < 1
            ) {
                errors.options =
                    "MSQ must have at least one correct option."
            }

            if (filledOptions.length !== options.length) {
                errors.options =
                    "Please fill all option fields before creating the question."
            }
        }

        if (form.question_type === "CODING") {
            if (!testCases.length) {
                errors.test_cases =
                    "At least one test case is required."
            }

            const incompleteTestCase = testCases.some(
                (testCase) =>
                    !testCase.input_data.trim() ||
                    !testCase.expected_output.trim()
            )

            if (incompleteTestCase) {
                errors.test_cases =
                    "Please complete all test cases."
            }
        }

        setFieldErrors(errors)

        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (event) => {
        event.preventDefault()

        if (!validateForm()) {
            return
        }

        setLoading(true)
        setError("")

        try {
            const payload = {
                title: form.title.trim(),
                text: form.text.trim(),
                question_type: form.question_type,
                difficulty: form.difficulty,
                topic: form.topic.trim(),
                marks: Number(form.marks),
                starter_code:
                    form.question_type === "CODING"
                        ? form.starter_code
                        : "",

                options:
                    form.question_type === "MCQ" ||
                    form.question_type === "MSQ"
                        ? options.map((option, index) => ({
                              text: option.text.trim(),
                              is_correct: option.is_correct,
                              order: index,
                          }))
                        : [],

                test_cases:
                    form.question_type === "CODING"
                        ? testCases.map((testCase, index) => ({
                              input_data: testCase.input_data,
                              expected_output:
                                  testCase.expected_output,
                              is_sample: testCase.is_sample,
                              order: index,
                          }))
                        : [],
            }

            await createQuestion(payload)

            navigate("/question-bank")
        } catch (requestError) {
            console.error(requestError)

            const responseData = requestError.response?.data

            if (
                responseData &&
                typeof responseData === "object"
            ) {
                setFieldErrors(responseData)
            }

            setError(
                responseData?.detail ||
                    "Unable to create the question. Please check your inputs."
            )
        } finally {
            setLoading(false)
        }
    }

    const handleDiscard = () => {
        const hasContent =
            form.text.trim() ||
            form.topic.trim() ||
            options.some((option) => option.text.trim()) ||
            testCases.some(
                (testCase) =>
                    testCase.input_data.trim() ||
                    testCase.expected_output.trim()
            )

        if (hasContent) {
            const confirmed = window.confirm(
                "Discard this question? Your unsaved changes will be lost."
            )

            if (!confirmed) {
                return
            }
        }

        navigate("/question-bank")
    }

    const isChoiceQuestion =
        form.question_type === "MCQ" ||
        form.question_type === "MSQ"

    return (
        <TeacherShell>
            <div className="mx-auto max-w-[1440px]">
                <div className="flex min-h-screen w-full flex-col">
                    <div className="flex flex-1 flex-col lg:flex-row">
                        <main className="min-w-0 flex-1 pb-32 lg:border-r lg:border-slate-200 lg:pr-6 dark:lg:border-[#242424]">
                            <div className="mb-8 mt-2">
                                <div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-[#8c909f]">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate("/question-bank")
                                        }
                                        className="transition-colors hover:text-blue-600 dark:hover:text-white"
                                    >
                                        Question Bank
                                    </button>

                                    <span className="text-slate-400 dark:text-[#737686]">
                                        /
                                    </span>

                                    <span className="text-slate-800 dark:text-white">
                                        Create Question
                                    </span>
                                </div>

                                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-[32px]">
                                    Create Question
                                </h1>
                            </div>

                            <div className="mb-8 grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 sm:grid-cols-4 dark:border-[#262626] dark:bg-[#1c1b1b]">
                                {QUESTION_TYPES.map((type) => {
                                    const active =
                                        form.question_type === type.value

                                    return (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() =>
                                                handleTypeChange(
                                                    type.value
                                                )
                                            }
                                            className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-xs font-medium transition-all sm:text-sm ${
                                                active
                                                    ? "border border-slate-300 bg-white text-blue-600 shadow-sm dark:border-[#383838] dark:bg-[#252525] dark:text-white"
                                                    : "text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 dark:text-[#a3a7b5] dark:hover:bg-[#252525]/60 dark:hover:text-white"
                                            }`}
                                        >
                                            <TypeIcon
                                                type={type.value}
                                            />

                                            <span className="hidden sm:inline">
                                                {type.label}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>

                            <form
                                onSubmit={handleSubmit}
                                className="space-y-8"
                            >
                                {error && (
                                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-[#ffb4ab]">
                                        {error}
                                    </div>
                                )}

                                <section className="space-y-3">
                                    <label className="block text-[15px] font-semibold text-slate-900 dark:text-white">
                                        Question Content
                                    </label>

                                    <div
                                        className={`overflow-hidden rounded-xl border bg-white transition-all dark:bg-[#1a1a1a] ${
                                            fieldErrors.text
                                                ? "border-red-400"
                                                : "border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-[#2b2b2b] dark:focus-within:border-[#4d8eff] dark:focus-within:ring-[#4d8eff]/10"
                                        }`}
                                    >
                                        <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-[#2b2b2b] dark:bg-[#20201f]">
                                            <button
                                                type="button"
                                                className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-200 dark:text-[#c2c6d6] dark:hover:bg-[#2e2e2e]"
                                            >
                                                B
                                            </button>

                                            <button
                                                type="button"
                                                className="rounded-lg px-2 py-1 text-xs italic text-slate-500 hover:bg-slate-200 dark:text-[#c2c6d6] dark:hover:bg-[#2e2e2e]"
                                            >
                                                I
                                            </button>

                                            <div className="mx-1.5 h-5 w-px bg-slate-200 dark:bg-[#3a3a3a]" />

                                            <button
                                                type="button"
                                                className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-200 dark:text-[#c2c6d6] dark:hover:bg-[#2e2e2e]"
                                            >
                                                ≡
                                            </button>

                                            <button
                                                type="button"
                                                className="rounded-lg px-2 py-1 font-mono text-xs text-slate-500 hover:bg-slate-200 dark:text-[#c2c6d6] dark:hover:bg-[#2e2e2e]"
                                            >
                                                &lt;/&gt;
                                            </button>

                                            <button
                                                type="button"
                                                className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-200 dark:text-[#c2c6d6] dark:hover:bg-[#2e2e2e]"
                                            >
                                                Σ
                                            </button>
                                        </div>

                                        <textarea
                                            name="text"
                                            value={form.text}
                                            onChange={handleChange}
                                            rows={7}
                                            placeholder="Enter your question here..."
                                            className="w-full resize-none border-0 bg-transparent p-4 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0 dark:text-[#e5e2e1] dark:placeholder:text-[#666a78]"
                                        />
                                    </div>

                                    {fieldErrors.text && (
                                        <p className="text-xs text-red-500">
                                            {Array.isArray(
                                                fieldErrors.text
                                            )
                                                ? fieldErrors.text.join(
                                                      " "
                                                  )
                                                : fieldErrors.text}
                                        </p>
                                    )}
                                </section>

                                {isChoiceQuestion && (
                                    <section className="space-y-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <label className="text-[15px] font-semibold text-slate-900 dark:text-white">
                                                Answer Options
                                            </label>

                                            <span className="hidden text-xs text-slate-500 sm:block dark:text-[#8c909f]">
                                                {form.question_type ===
                                                "MCQ"
                                                    ? "Select the correct answer"
                                                    : "Select all correct answers"}
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            {options.map(
                                                (option, index) => (
                                                    <div
                                                        key={index}
                                                        className={`group flex items-center gap-3 rounded-xl border p-3 transition-all sm:p-4 ${
                                                            option.is_correct
                                                                ? "border-blue-400 bg-blue-50/70 dark:border-[#2b4c7e] dark:bg-[#1a2333]"
                                                                : "border-slate-200 bg-white hover:border-blue-300 dark:border-[#2b2b2b] dark:bg-[#1a1a1a] dark:hover:border-[#3d3d3d]"
                                                        }`}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                selectCorrectOption(
                                                                    index
                                                                )
                                                            }
                                                            aria-label={`Mark option ${
                                                                index + 1
                                                            } as correct`}
                                                            className={`flex h-5 w-5 shrink-0 items-center justify-center ${
                                                                form.question_type ===
                                                                "MCQ"
                                                                    ? "rounded-full"
                                                                    : "rounded"
                                                            } border-2 transition-colors ${
                                                                option.is_correct
                                                                    ? "border-[#4d8eff] bg-[#4d8eff] text-white"
                                                                    : "border-slate-300 dark:border-[#545864]"
                                                            }`}
                                                        >
                                                            {option.is_correct && (
                                                                <span className="text-[10px] font-bold">
                                                                    ✓
                                                                </span>
                                                            )}
                                                        </button>

                                                        <input
                                                            type="text"
                                                            value={
                                                                option.text
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateOption(
                                                                    index,
                                                                    "text",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder={`Option ${
                                                                index + 1
                                                            }`}
                                                            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0 dark:text-white dark:placeholder:text-[#737686]"
                                                        />

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeOption(
                                                                    index
                                                                )
                                                            }
                                                            disabled={
                                                                options.length <=
                                                                2
                                                            }
                                                            className="rounded-lg p-1.5 text-slate-300 transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30 dark:text-[#545864] dark:hover:text-[#ffb4ab]"
                                                            title="Remove option"
                                                        >
                                                            <Icon
                                                                name="trash"
                                                                className="h-4 w-4"
                                                            />
                                                        </button>
                                                    </div>
                                                )
                                            )}
                                        </div>

                                        {fieldErrors.options && (
                                            <p className="text-xs text-red-500">
                                                {Array.isArray(
                                                    fieldErrors.options
                                                )
                                                    ? fieldErrors.options.join(
                                                          " "
                                                      )
                                                    : fieldErrors.options}
                                            </p>
                                        )}

                                        <button
                                            type="button"
                                            onClick={addOption}
                                            className="flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-[#4d8eff] dark:hover:bg-[#2563eb]/10"
                                        >
                                            <Icon
                                                name="plus"
                                                className="h-4 w-4"
                                            />
                                            Add Option
                                        </button>
                                    </section>
                                )}

                                {form.question_type === "CODING" && (
                                    <section className="space-y-5">
                                        <div>
                                            <label className="mb-2 block text-[15px] font-semibold text-slate-900 dark:text-white">
                                                Starter Code
                                            </label>

                                            <textarea
                                                name="starter_code"
                                                value={
                                                    form.starter_code
                                                }
                                                onChange={handleChange}
                                                rows={8}
                                                placeholder="// Enter starter code for students..."
                                                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-[#2b2b2b]"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                                                    Test Cases
                                                </h3>

                                                <p className="mt-1 text-xs text-slate-500 dark:text-[#8c909f]">
                                                    At least one test case is
                                                    required.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={addTestCase}
                                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-[#4d8eff] dark:hover:bg-[#2563eb]/10"
                                            >
                                                <Icon
                                                    name="plus"
                                                    className="h-4 w-4"
                                                />
                                                Add Test Case
                                            </button>
                                        </div>

                                        {testCases.map(
                                            (testCase, index) => (
                                                <div
                                                    key={index}
                                                    className="rounded-xl border border-slate-200 bg-white p-4 dark:border-[#2b2b2b] dark:bg-[#1a1a1a]"
                                                >
                                                    <div className="mb-4 flex items-center justify-between">
                                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#8c909f]">
                                                            Test Case{" "}
                                                            {index + 1}
                                                        </span>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeTestCase(
                                                                    index
                                                                )
                                                            }
                                                            disabled={
                                                                testCases.length <=
                                                                1
                                                            }
                                                            className="text-slate-400 hover:text-red-500 disabled:opacity-30"
                                                        >
                                                            <Icon
                                                                name="trash"
                                                                className="h-4 w-4"
                                                            />
                                                        </button>
                                                    </div>

                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                        <textarea
                                                            value={
                                                                testCase.input_data
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateTestCase(
                                                                    index,
                                                                    "input_data",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            rows={4}
                                                            placeholder="Input"
                                                            className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-[#2b2b2b] dark:bg-[#171717] dark:text-[#e5e2e1]"
                                                        />

                                                        <textarea
                                                            value={
                                                                testCase.expected_output
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateTestCase(
                                                                    index,
                                                                    "expected_output",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            rows={4}
                                                            placeholder="Expected output"
                                                            className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-[#2b2b2b] dark:bg-[#171717] dark:text-[#e5e2e1]"
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        )}

                                        {fieldErrors.test_cases && (
                                            <p className="text-xs text-red-500">
                                                {Array.isArray(
                                                    fieldErrors.test_cases
                                                )
                                                    ? fieldErrors.test_cases.join(
                                                          " "
                                                      )
                                                    : fieldErrors.test_cases}
                                            </p>
                                        )}
                                    </section>
                                )}

                                <section className="grid gap-5 border-t border-slate-200 pt-6 dark:border-[#242424] sm:grid-cols-3">
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#c2c6d6]">
                                            Difficulty
                                        </label>

                                        <div className="relative">
                                            <select
                                                name="difficulty"
                                                value={
                                                    form.difficulty
                                                }
                                                onChange={handleChange}
                                                className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-[#2b2b2b] dark:bg-[#1a1a1a] dark:text-white"
                                            >
                                                <option value="MEDIUM">
                                                    Medium
                                                </option>

                                                <option value="EASY">
                                                    Easy
                                                </option>

                                                <option value="HARD">
                                                    Hard
                                                </option>
                                            </select>

                                            <Icon
                                                name="chevron"
                                                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-[#8c909f]"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#c2c6d6]">
                                            Topic
                                        </label>

                                        <input
                                            name="topic"
                                            value={form.topic}
                                            onChange={handleChange}
                                            placeholder="e.g. Algorithms"
                                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-[#2b2b2b] dark:bg-[#1a1a1a] dark:text-white dark:placeholder:text-[#737686]"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#c2c6d6]">
                                            Marks
                                        </label>

                                        <input
                                            type="number"
                                            min="1"
                                            name="marks"
                                            value={form.marks}
                                            onChange={handleChange}
                                            className={`w-full rounded-lg border bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-[#1a1a1a] dark:text-white ${
                                                fieldErrors.marks
                                                    ? "border-red-400"
                                                    : "border-slate-200 dark:border-[#2b2b2b]"
                                            }`}
                                        />

                                        {fieldErrors.marks && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {fieldErrors.marks}
                                            </p>
                                        )}
                                    </div>
                                </section>

                                <input
                                    type="hidden"
                                    name="title"
                                    value={form.title}
                                    readOnly
                                />
                            </form>
                        </main>

                        <aside className="hidden w-[400px] shrink-0 pl-6 lg:block">
                            <div className="sticky top-20">
                                <Preview
                                    form={form}
                                    options={options}
                                    testCases={testCases}
                                />
                            </div>
                        </aside>
                    </div>

                    <div className="mt-8 lg:hidden">
                        <details className="rounded-xl border border-slate-200 bg-white dark:border-[#2a2a2a] dark:bg-[#1a1a1a]">
                            <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-semibold text-slate-900 dark:text-white">
                                <span className="flex items-center gap-2">
                                    <Icon
                                        name="eye"
                                        className="h-4 w-4 text-blue-600 dark:text-[#4d8eff]"
                                    />
                                    Live Preview
                                </span>

                                <span className="text-xs text-slate-400 dark:text-[#8c909f]">
                                    Tap to preview
                                </span>
                            </summary>

                            <div className="border-t border-slate-200 p-4 dark:border-[#2a2a2a]">
                                <Preview
                                    form={form}
                                    options={options}
                                    testCases={testCases}
                                />
                            </div>
                        </details>
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-xl dark:border-[#252525] dark:bg-[#131313]/95 lg:left-[280px] lg:px-8">
                        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={handleDiscard}
                                className="rounded-lg border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-[#333333] dark:text-[#c2c6d6] dark:hover:bg-[#202020] dark:hover:text-white sm:px-5 sm:text-sm"
                            >
                                Discard
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled
                                    title="Draft state is not supported by the current Question API."
                                    className="hidden cursor-not-allowed rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-400 dark:text-[#737686] sm:block sm:px-5 sm:text-sm"
                                >
                                    Save as Draft
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-[#1d4ed8] disabled:cursor-wait disabled:opacity-60 sm:px-6 sm:text-sm"
                                >
                                    {loading ? (
                                        <>
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Icon
                                                name="save"
                                                className="h-4 w-4"
                                            />
                                            Create Question
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </TeacherShell>
    )
}