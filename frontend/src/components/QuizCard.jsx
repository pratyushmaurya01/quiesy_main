function Icon({ name, className = "w-4 h-4" }) {
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
        book: (
            <>
                <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
                <path d="M8 7h8M8 11h7M8 15h4" />
            </>
        ),
        clock: (
            <>
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 7v5l3 2" />
            </>
        ),
        arrow: (
            <>
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
            </>
        ),
    }

    return <svg {...common}>{icons[name]}</svg>
}

function StatusBadge({ status }) {
    const styles = {
        DRAFT:
            "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
        SCHEDULED:
            "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
        ACTIVE:
            "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
        CLOSED:
            "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
        EVALUATED:
            "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
    }

    const labels = {
        DRAFT: "Draft",
        SCHEDULED: "Scheduled",
        ACTIVE: "Active",
        CLOSED: "Closed",
        EVALUATED: "Evaluated",
    }

    const statusStyle =
        styles[status] || styles.DRAFT

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold ${statusStyle}`}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {labels[status] || "Draft"}
        </span>
    )
}

function formatSchedule(value) {
    if (!value) {
        return "No schedule"
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return "No schedule"
    }

    return date.toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
    })
}

export default function QuizCard({
    quiz,
    questionCount,
    totalMarks,
    selected,
    onClick,
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                group w-full text-left rounded-xl border p-4
                transition-all duration-200
                focus:outline-none focus:ring-2
                focus:ring-blue-500/30
                ${
                    selected
                        ? "border-blue-500 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/10"
                        : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-300 dark:border-[#303030] dark:bg-[#1f1f1f] dark:hover:border-blue-800"
                }
            `}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-blue-600 dark:bg-[#292929] dark:text-blue-400">
                            <Icon
                                name="book"
                                className="h-3.5 w-3.5"
                            />
                        </span>

                        <span className="truncate text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                            {quiz.subject || "No subject"}
                        </span>
                    </div>

                    <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 dark:text-white">
                        {quiz.title}
                    </h3>
                </div>

                <StatusBadge status={quiz.status} />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 dark:border-[#303030]">
                <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        Questions
                    </p>

                    <p className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                        {questionCount}
                    </p>
                </div>

                <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        Marks
                    </p>

                    <p className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                        {totalMarks}
                    </p>
                </div>

                <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        Duration
                    </p>

                    <p className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                        {quiz.duration_minutes}m
                    </p>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                    <Icon
                        name="clock"
                        className="h-3.5 w-3.5 shrink-0"
                    />

                    <span className="truncate">
                        {formatSchedule(quiz.starts_at)}
                    </span>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
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