function Icon({ name, className = "h-4 w-4" }) {
    const icons = {
        quiz: (
            <>
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 8h8M8 12h8M8 16h5" />
            </>
        ),
        clock: (
            <>
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 7v5l3 2" />
            </>
        ),
        questions: (
            <>
                <path d="M5 5h14v14H5z" />
                <path d="M9 9h6M9 13h6M9 17h3" />
            </>
        ),
        marks: (
            <>
                <path d="M7 4h10v16H7z" />
                <path d="M9.5 8h5M9.5 12h5M9.5 16h3" />
            </>
        ),
        arrow: (
            <path d="M5 12h14M13 6l6 6-6 6" />
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

function getStatusClasses(status) {
    const styles = {
        DRAFT:
            "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
        SCHEDULED:
            "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
        ACTIVE:
            "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
        CLOSED:
            "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
        EVALUATED:
            "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    }

    return styles[status] || styles.DRAFT
}

function formatStatus(status) {
    if (!status) {
        return "Draft"
    }

    return (
        status.charAt(0) +
        status.slice(1).toLowerCase()
    )
}

function formatSchedule(quiz) {
    if (quiz.starts_at) {
        const date = new Date(quiz.starts_at)

        if (!Number.isNaN(date.getTime())) {
            return `Starts ${date.toLocaleDateString([], {
                day: "numeric",
                month: "short",
            })}`
        }
    }

    if (quiz.ends_at) {
        const date = new Date(quiz.ends_at)

        if (!Number.isNaN(date.getTime())) {
            return `Ends ${date.toLocaleDateString([], {
                day: "numeric",
                month: "short",
            })}`
        }
    }

    return "No schedule"
}

export default function QuizCard({
    quiz,
    selected = false,
    questionCount = 0,
    totalMarks = null,
    onSelect,
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={[
                "group relative flex min-h-[178px] w-full flex-col rounded-xl border p-4 text-left transition-all duration-150",
                "bg-white dark:bg-[#181a1e]",
                selected
                    ? "border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.15)]"
                    : "border-slate-200 hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:hover:border-slate-700",
            ].join(" ")}
        >
            {/* Selected indicator */}
            <span
                className={[
                    "absolute left-0 top-5 h-7 w-0.5 rounded-r-full transition-opacity",
                    selected ? "bg-blue-500 opacity-100" : "opacity-0",
                ].join(" ")}
            />

            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-blue-500 dark:bg-slate-800">
                        <Icon
                            name="quiz"
                            className="h-3.5 w-3.5"
                        />
                    </span>

                    <span className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {quiz.subject || "General"}
                    </span>
                </div>

                <span
                    className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold ${getStatusClasses(
                        quiz.status
                    )}`}
                >
                    <span className="mr-1">●</span>
                    {formatStatus(quiz.status)}
                </span>
            </div>

            {/* Title */}
            <div className="mt-3 min-w-0">
                <h3 className="line-clamp-2 text-[15px] font-bold leading-5 tracking-tight text-slate-900 dark:text-white">
                    {quiz.title || "Untitled Quiz"}
                </h3>
            </div>

            {/* Metrics */}
            <div className="mt-4 grid grid-cols-3 border-y border-slate-200 py-3 dark:border-slate-800">
                <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Questions
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                        {questionCount}
                    </p>
                </div>

                <div className="border-l border-slate-200 pl-3 dark:border-slate-800">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Marks
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                        {totalMarks ?? "—"}
                    </p>
                </div>

                <div className="border-l border-slate-200 pl-3 dark:border-slate-800">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Duration
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                        {quiz.duration_minutes || 0}m
                    </p>
                </div>
            </div>

            {/* Bottom */}
            <div className="mt-auto flex items-center justify-between pt-3">
                <span className="inline-flex min-w-0 items-center gap-1.5 text-[10px] font-medium text-slate-400">
                    <Icon
                        name="clock"
                        className="h-3 w-3 shrink-0"
                    />

                    <span className="truncate">
                        {formatSchedule(quiz)}
                    </span>
                </span>

                <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-blue-500 transition group-hover:gap-1.5">
                    {quiz.status === "DRAFT"
                        ? "Continue"
                        : "View"}

                    <Icon
                        name="arrow"
                        className="h-3 w-3"
                    />
                </span>
            </div>
        </button>
    )
}