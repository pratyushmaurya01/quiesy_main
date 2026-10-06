import { useNavigate } from "react-router-dom"

function Icon({ name, className = "h-5 w-5" }) {
    const icons = {
        quiz: (
            <>
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 8h8M8 12h8M8 16h5" />
            </>
        ),
        edit: (
            <>
                <path d="M4 20h4L19 9l-4-4L4 16v4z" />
                <path d="m13 6 4 4" />
            </>
        ),
        questions: (
            <>
                <path d="M5 5h14v14H5z" />
                <path d="M9 9h6M9 13h6M9 17h3" />
            </>
        ),
        results: (
            <>
                <path d="M5 19V9M12 19V5M19 19v-7" />
            </>
        ),
        calendar: (
            <>
                <rect x="4" y="5" width="16" height="15" rx="2" />
                <path d="M8 3v4M16 3v4M4 10h16" />
            </>
        ),
        clock: (
            <>
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 7v5l3 2" />
            </>
        ),
        attempts: (
            <>
                <circle cx="9" cy="8" r="3" />
                <path d="M3 20c.5-3.5 2.5-5 6-5s5.5 1.5 6 5" />
                <path d="M16 5.5a3 3 0 0 1 0 5.5M18 15c1.7.7 2.7 2 3 4" />
            </>
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

function formatDate(value) {
    if (!value) {
        return "Not configured"
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return "Not configured"
    }

    return date.toLocaleString([], {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

function InfoMetric({ icon, label, value }) {
    return (
        <div className="min-w-0 px-3 py-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                <Icon name={icon} className="h-3.5 w-3.5" />
                <span>{label}</span>
            </div>

            <p className="mt-1.5 truncate text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {value}
            </p>
        </div>
    )
}

function ScheduleBox({ label, value }) {
    return (
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 dark:border-slate-800/60 dark:bg-slate-900/60">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
                <Icon name="calendar" className="h-3 w-3" />
                <span>{label}</span>
            </div>

            <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                {value}
            </p>
        </div>
    )
}

function SettingPill({ label, enabled }) {
    return (
        <span
            className={[
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-semibold",
                enabled
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
            ].join(" ")}
        >
            <span
                className={[
                    "h-1.5 w-1.5 rounded-full",
                    enabled
                        ? "bg-emerald-500"
                        : "bg-slate-400",
                ].join(" ")}
            />

            {label}
        </span>
    )
}

function getQuestionTitle(question) {
    if (!question) {
        return "Question"
    }

    if (typeof question === "object") {
        return (
            question.title ||
            question.text ||
            "Untitled question"
        )
    }

    return "Question"
}

function getQuestionType(question) {
    if (!question || typeof question !== "object") {
        return "Question"
    }

    return question.question_type || question.type || "Question"
}

function getQuestionDifficulty(question) {
    if (!question || typeof question !== "object") {
        return "—"
    }

    return question.difficulty || "—"
}

function getQuestionMarks(questionLink) {
    if (!questionLink) {
        return "—"
    }

    if (questionLink.marks_override) {
        return questionLink.marks_override
    }

    if (
        typeof questionLink.question === "object" &&
        questionLink.question?.marks
    ) {
        return questionLink.question.marks
    }

    return "—"
}

export default function QuizDetailCard({
    quiz,
    questionCount = 0,
    totalMarks = null,
    questionLinks = [],
    onEdit,
    onQuestions,
    onResults,
    onLiveProctor,
}) {
    const navigate = useNavigate()

    if (!quiz) {
        return (
            <div className="flex h-full min-h-0 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#141518]">
                <div className="max-w-xs px-6 text-center">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                        <Icon
                            name="quiz"
                            className="h-5 w-5 text-slate-400"
                        />
                    </div>

                    <h3 className="text-sm font-bold">
                        Select a quiz
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                        Select a quiz from the left to see its complete
                        overview here.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-300/90 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.03)] transition-all duration-200 animate-fadeIn dark:border-slate-800 dark:bg-[#141518] dark:shadow-none">
            {/* =========================================================
                HEADER
            ========================================================== */}
            <div className="shrink-0 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="mb-2 flex items-center gap-2">
                            <span className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-500">
                                {quiz.subject || "General"}
                            </span>

                            <span
                                className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold ${getStatusClasses(
                                    quiz.status
                                )}`}
                            >
                                ● {formatStatus(quiz.status)}
                            </span>
                        </div>

                        <h2 className="truncate text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                            {quiz.title || "Untitled Quiz"}
                        </h2>

                        <p className="mt-1.5 truncate text-sm text-slate-500 dark:text-slate-300">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">Description: </span>
                            {quiz.description || "No description provided"}
                        </p>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-500/10">
                        <Icon
                            name="quiz"
                            className="h-5 w-5"
                        />
                    </div>
                </div>

                {/* Actions - Uniform, balanced square-cut buttons with identical sizes */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (onLiveProctor && quiz?.id) {
                                onLiveProctor(quiz.id);
                            } else if (quiz?.id) {
                                navigate(`/quiz/${quiz.id}/live-proctor`);
                            }
                        }}
                        className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white shadow-sm transition-all hover:shadow-[0_0_12px_rgba(168,85,247,0.4)] active:scale-[0.98] cursor-pointer"
                        title="Open Live Proctoring & Anti-Cheat Monitor"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
                        </span>
                        Monitor
                    </button>

                    <button
                        type="button"
                        onClick={() => onQuestions?.(quiz.id)}
                        className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] cursor-pointer dark:border-slate-800 dark:bg-[#141518] dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        <Icon
                            name="questions"
                            className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400"
                        />
                        Questions
                    </button>

                    <button
                        type="button"
                        onClick={() => onEdit?.(quiz.id)}
                        className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] cursor-pointer dark:border-slate-800 dark:bg-[#141518] dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        <Icon
                            name="edit"
                            className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400"
                        />
                        Edit
                    </button>

                    <button
                        type="button"
                        onClick={() => onResults?.(quiz.id)}
                        className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] cursor-pointer"
                    >
                        <Icon
                            name="results"
                            className="h-3.5 w-3.5"
                        />
                        Results
                    </button>
                </div>
            </div>

            {/* =========================================================
                METRICS (Removed vertical dividing lines, use clean spacing)
            ========================================================== */}
            <div className="grid shrink-0 grid-cols-4 border-b border-slate-200/80 px-3 dark:border-slate-800">
                <InfoMetric
                    icon="questions"
                    label="Questions"
                    value={questionCount || 0}
                />

                <InfoMetric
                    icon="marks"
                    label="Total Marks"
                    value={totalMarks ?? 0}
                />

                <InfoMetric
                    icon="clock"
                    label="Duration"
                    value={`${quiz.duration_minutes || 0} min`}
                />

                <InfoMetric
                    icon="attempts"
                    label="Max Attempts"
                    value={quiz.max_attempts || 1}
                />
            </div>

            {/* =========================================================
                BODY

                Deliberately compact.
                No overflow-y-auto.
            ========================================================== */}
            <div className="quiz-detail-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
                {/* Schedule */}
                <div className="grid grid-cols-2 gap-3">
                    <ScheduleBox
                        label="Starts"
                        value={formatDate(quiz.starts_at)}
                    />

                    <ScheduleBox
                        label="Ends"
                        value={formatDate(quiz.ends_at)}
                    />
                </div>

                {/* Settings */}
                <div className="mt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                        Quiz Settings
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                        <SettingPill
                            label="Review enabled"
                            enabled={Boolean(
                                quiz.review_enabled
                            )}
                        />

                        <SettingPill
                            label="Shuffle questions"
                            enabled={Boolean(
                                quiz.shuffle_questions
                            )}
                        />

                        <SettingPill
                            label="Shuffle options"
                            enabled={Boolean(
                                quiz.shuffle_options
                            )}
                        />
                    </div>
                </div>

                {/* Question composition */}
                <div className="mt-4">
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                                Question Composition
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                Questions currently attached to this
                                quiz.
                            </p>
                        </div>

                        <span className="text-[10px] font-semibold text-slate-400">
                            {questionCount} total
                        </span>
                    </div>

                    <div className="mt-2 space-y-2">
                        {questionLinks
                            .slice(0, 4)
                            .map((item, index) => {
                                const question =
                                    typeof item.question ===
                                    "object"
                                        ? item.question
                                        : null

                                return (
                                    <div
                                        key={
                                            item.id ||
                                            `${item.question}-${index}`
                                        }
                                        className="flex min-w-0 items-center gap-3 rounded-lg bg-slate-50 px-3.5 py-3 dark:bg-slate-900"
                                    >
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            {item.order ??
                                                index + 1}
                                        </span>

                                        <div className="min-w-0 flex-1">
                                             <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                 {getQuestionTitle(
                                                     question
                                                 )}
                                             </p>

                                             <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                                 {getQuestionType(
                                                     question
                                                 )}{" "}
                                                 ·{" "}
                                                 {getQuestionDifficulty(
                                                     question
                                                 )}{" "}
                                                 ·{" "}
                                                 {getQuestionMarks(
                                                     item
                                                 )}{" "}
                                                 marks
                                             </p>
                                        </div>
                                    </div>
                                )
                            })}

                        {questionLinks.length === 0 && (
                            <div className="rounded-lg bg-slate-50 px-3 py-4 text-xs text-slate-400 dark:bg-slate-900">
                                No questions attached yet.
                            </div>
                        )}

                        {questionLinks.length > 4 && (
                            <button
                                type="button"
                                onClick={() =>
                                    onQuestions?.(quiz.id)
                                }
                                className="w-full rounded-lg border border-dashed border-slate-300 py-2 text-[11px] font-semibold text-blue-500 transition hover:bg-blue-50 active:scale-[0.99] cursor-pointer dark:border-slate-700 dark:hover:bg-blue-500/5"
                            >
                                View all {questionLinks.length} questions
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .quiz-detail-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(148, 163, 184, 0.5) transparent;
                }

                .quiz-detail-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }

                .quiz-detail-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }

                .quiz-detail-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(148, 163, 184, 0.5);
                    border-radius: 9999px;
                }
            `}</style>
        </div>
    )
}
