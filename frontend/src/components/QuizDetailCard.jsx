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
        question: (
            <>
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M8 8h8M8 12h6M8 16h4" />
            </>
        ),
        users: (
            <>
                <circle cx="9" cy="9" r="3" />
                <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
                <path d="M16 6.5a3 3 0 0 1 0 5.8" />
                <path d="M17 14.5a5.5 5.5 0 0 1 4 5.5" />
            </>
        ),
        calendar: (
            <>
                <rect x="4" y="5" width="16" height="15" rx="2" />
                <path d="M8 3v4M16 3v4M4 10h16" />
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

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${
                styles[status] || styles.DRAFT
            }`}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />

            {labels[status] || "Draft"}
        </span>
    )
}

function formatDate(value) {
    if (!value) {
        return "Not configured"
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return "Not configured"
    }

    return date.toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
    })
}

export default function QuizDetailCard({
    quiz,
    questions,
    totalMarks,
    loading,
    onContinue,
}) {
    if (!quiz) {
        return (
            <section className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-[#383838] dark:bg-[#1f1f1f]">
                <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-[#292929]">
                        <Icon
                            name="book"
                            className="h-6 w-6"
                        />
                    </div>

                    <p className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-200">
                        Select a quiz
                    </p>

                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        Select any quiz to view its details.
                    </p>
                </div>
            </section>
        )
    }

    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-[#303030] dark:bg-[#1f1f1f]">

            {/* Header */}
            <div className="border-b border-slate-200 p-5 dark:border-[#303030] sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                            <Icon
                                name="book"
                                className="h-3.5 w-3.5"
                            />

                            {quiz.subject || "Assessment"}
                        </div>

                        <h2 className="text-lg font-bold leading-snug text-slate-900 dark:text-white sm:text-xl">
                            {quiz.title}
                        </h2>

                        {quiz.description && (
                            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                {quiz.description}
                            </p>
                        )}
                    </div>

                    <StatusBadge status={quiz.status} />
                </div>
            </div>

            {/* Main stats */}
            <div className="grid grid-cols-2 border-b border-slate-200 dark:border-[#303030] sm:grid-cols-4">
                <Stat
                    icon="question"
                    label="Questions"
                    value={questions.length}
                />

                <Stat
                    icon="book"
                    label="Total Marks"
                    value={totalMarks}
                />

                <Stat
                    icon="clock"
                    label="Duration"
                    value={`${quiz.duration_minutes} min`}
                />

                <Stat
                    icon="users"
                    label="Max Attempts"
                    value={quiz.max_attempts}
                />
            </div>

            <div className="p-5 sm:p-6">

                {/* Schedule */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InfoBox
                        icon="calendar"
                        label="Starts"
                        value={formatDate(
                            quiz.starts_at
                        )}
                    />

                    <InfoBox
                        icon="calendar"
                        label="Ends"
                        value={formatDate(
                            quiz.ends_at
                        )}
                    />
                </div>

                {/* Settings */}
                <div className="mt-6">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Quiz Settings
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {quiz.review_enabled && (
                            <SettingBadge>
                                Review enabled
                            </SettingBadge>
                        )}

                        {quiz.shuffle_questions && (
                            <SettingBadge>
                                Questions shuffled
                            </SettingBadge>
                        )}

                        {quiz.shuffle_options && (
                            <SettingBadge>
                                Options shuffled
                            </SettingBadge>
                        )}

                        {!quiz.review_enabled &&
                            !quiz.shuffle_questions &&
                            !quiz.shuffle_options && (
                                <span className="text-[11px] text-slate-400">
                                    Default settings
                                </span>
                            )}
                    </div>
                </div>

                {/* Questions */}
                <div className="mt-6">
                    <div className="mb-3 flex items-end justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Question Composition
                            </p>

                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Questions currently attached to this quiz.
                            </p>
                        </div>

                        <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                            {questions.length} total
                        </span>
                    </div>

                    {loading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map(
                                (item) => (
                                    <div
                                        key={item}
                                        className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-[#292929]"
                                    />
                                )
                            )}
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center dark:border-[#383838]">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                No questions added
                            </p>

                            <p className="mt-1 text-[11px] text-slate-400">
                                Continue setup to add questions from the Question Bank.
                            </p>
                        </div>
                    ) : (
                        <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
                            {questions.map(
                                (item, index) => {
                                    const question =
                                        item.question

                                    return (
                                        <div
                                            key={
                                                item.id
                                            }
                                            className="flex items-start gap-3 rounded-lg bg-slate-50 px-3 py-3 dark:bg-[#242424]"
                                        >
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-[10px] font-bold text-slate-500 dark:border-[#383838] dark:bg-[#303030]">
                                                {item.order ??
                                                    index +
                                                        1}
                                            </span>

                                            <div className="min-w-0 flex-1">
                                                <p className="line-clamp-2 text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-200">
                                                    {question?.text ||
                                                        "Question unavailable"}
                                                </p>

                                                {question && (
                                                    <p className="mt-1 text-[10px] text-slate-400">
                                                        {
                                                            question.question_type
                                                        }
                                                        {" · "}
                                                        {
                                                            question.difficulty
                                                        }
                                                        {" · "}
                                                        {item.marks_override ??
                                                            question.marks}{" "}
                                                        marks
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                }
                            )}
                        </div>
                    )}
                </div>

                {/* Action */}
                {quiz.status === "DRAFT" && (
                    <div className="mt-6 border-t border-slate-200 pt-5 dark:border-[#303030]">
                        <button
                            type="button"
                            onClick={onContinue}
                            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-xs font-bold text-white transition-all hover:bg-blue-700 active:scale-[0.99] dark:hover:bg-blue-500"
                        >
                            Continue Quiz Setup

                            <Icon
                                name="arrow"
                                className="h-4 w-4"
                            />
                        </button>
                    </div>
                )}
            </div>
        </section>
    )
}

function Stat({ icon, label, value }) {
    return (
        <div className="border-r border-slate-200 p-4 last:border-r-0 dark:border-[#303030]">
            <div className="flex items-center gap-2 text-slate-400">
                <Icon
                    name={icon}
                    className="h-4 w-4"
                />

                <span className="text-[10px] font-semibold">
                    {label}
                </span>
            </div>

            <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                {value}
            </p>
        </div>
    )
}

function InfoBox({ icon, label, value }) {
    return (
        <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-[#242424]">
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                <Icon
                    name={icon}
                    className="h-4 w-4"
                />

                <span className="text-[10px] font-semibold uppercase tracking-wide">
                    {label}
                </span>
            </div>

            <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                {value}
            </p>
        </div>
    )
}

function SettingBadge({ children }) {
    return (
        <span className="rounded-md bg-slate-100 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 dark:bg-[#292929] dark:text-slate-300">
            {children}
        </span>
    )
}