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
    onLiveProctor,
    onDelete,
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={[
                "group relative flex min-h-[178px] w-full flex-col rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer",
                "bg-white dark:bg-[#15171b]",
                selected
                    ? "border-blue-600 shadow-[0_4px_16px_rgba(37,99,235,0.15),0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-blue-600/40"
                    : "border-slate-300/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-slate-400 hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] dark:border-slate-800 dark:shadow-none dark:hover:border-slate-700/90",
            ].join(" ")}
        >
            {/* Selected indicator */}
            <span
                className={[
                    "absolute left-0 top-5 h-7 w-1 rounded-r-full transition-opacity duration-200",
                    selected ? "bg-blue-600 opacity-100 shadow-[0_0_8px_rgba(37,99,235,0.4)]" : "opacity-0",
                ].join(" ")}
            />

            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-slate-800/80 dark:text-blue-400">
                        <Icon
                            name="quiz"
                            className="h-3.5 w-3.5"
                        />
                    </span>

                    <span className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {quiz.subject || "General"}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span
                        className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold ${getStatusClasses(
                            quiz.status
                        )}`}
                    >
                        <span className="mr-1">●</span>
                        {formatStatus(quiz.status)}
                    </span>
                    {onDelete && (
                        <div
                            role="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete(quiz.id)
                            }}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                            aria-label="Delete quiz"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </div>
                    )}
                </div>
            </div>

            {/* Title */}
            <div className="mt-3 min-w-0">
                <h3 className="line-clamp-2 text-base font-bold leading-snug tracking-tight text-slate-900 dark:text-white">
                    {quiz.title || "Untitled Quiz"}
                </h3>
            </div>

            {/* Metrics - Strong Numerical Hierarchy */}
            <div className="mt-4 grid grid-cols-3 border-y border-slate-200/90 py-3 dark:border-slate-800">
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Questions
                    </p>

                    <p className="mt-1 text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {questionCount || 0}
                    </p>
                </div>

                <div className="border-l border-slate-200/90 pl-3 dark:border-slate-800">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Marks
                    </p>

                    <p className="mt-1 text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {totalMarks ?? 0}
                    </p>
                </div>

                <div className="border-l border-slate-200/90 pl-3 dark:border-slate-800">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Duration
                    </p>

                    <p className="mt-1 text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {quiz.duration_minutes || 0}m
                    </p>
                </div>
            </div>

            {/* Bottom */}
            <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <Icon
                        name="clock"
                        className="h-3.5 w-3.5 shrink-0 text-slate-400"
                    />

                    <span className="truncate">
                        {formatSchedule(quiz)}
                    </span>
                </span>

                <div className="flex items-center gap-2">
                    <span 
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onLiveProctor) {
                                onLiveProctor(quiz.id);
                            }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:hover:bg-purple-500/20 transition-all border border-purple-200/60 dark:border-purple-500/20 shadow-xs cursor-pointer active:scale-95"
                        title="Open Live Proctoring & Anti-Cheat Monitor"
                    >
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Monitor
                    </span>
                </div>
            </div>
        </button>
    )
}