import { useCallback, useEffect, useState } from "react"
import TeacherShell from "../../components/layout/TeacherShell"
import QuestionFilters from "../../components/questions/QuestionFilters"
import QuestionRow from "../../components/questions/QuestionRow"
import {
    deactivateQuestion,
    getQuestions,
} from "../../api/quizzes"

export default function QuestionBank() {
    const [questions, setQuestions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const [search, setSearch] = useState("")
    const [type, setType] = useState("")
    const [difficulty, setDifficulty] = useState("")
    const [topic, setTopic] = useState("")
    const [activeOnly, setActiveOnly] = useState("")

    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [next, setNext] = useState(null)
    const [previous, setPrevious] = useState(null)

    const [selected, setSelected] = useState([])

    const loadQuestions = useCallback(async () => {
        setLoading(true)
        setError("")

        try {
            const response = await getQuestions({
                page,
                search: search || undefined,
                question_type: type || undefined,
                difficulty: difficulty || undefined,
                topic: topic || undefined,
                is_active:
                    activeOnly !== ""
                        ? activeOnly
                        : undefined,
            })

            const data = response.data

            setQuestions(data.results || [])
            setTotal(data.count || 0)
            setNext(data.next)
            setPrevious(data.previous)
        } catch (requestError) {
            console.error(requestError)
            setError(
                "Unable to load your questions. Please try again."
            )
        } finally {
            setLoading(false)
        }
    }, [
        page,
        search,
        type,
        difficulty,
        topic,
        activeOnly,
    ])

    useEffect(() => {
        const timer = setTimeout(() => {
            loadQuestions()
        }, 250)

        return () => clearTimeout(timer)
    }, [loadQuestions])

    const clearFilters = () => {
        setSearch("")
        setType("")
        setDifficulty("")
        setTopic("")
        setActiveOnly("")
        setPage(1)
    }

    const handleSelect = (id) => {
        setSelected((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id]
        )
    }

    const handleSelectAll = () => {
        if (selected.length === questions.length) {
            setSelected([])
            return
        }

        setSelected(
            questions
                .map((question) => question.id)
        )
    }

    const handleDeactivate = async (id) => {
        const confirmed = window.confirm(
            "Deactivate this question?"
        )

        if (!confirmed) {
            return
        }

        try {
            await deactivateQuestion(id)

            setQuestions((current) =>
                current.map((question) =>
                    question.id === id
                        ? {
                              ...question,
                              is_active: false,
                          }
                        : question
                )
            )

            setSelected((current) =>
                current.filter((item) => item !== id)
            )
        } catch (requestError) {
            console.error(requestError)

            window.alert(
                "Unable to deactivate the question."
            )
        }
    }

    const totalPages = Math.max(
        1,
        Math.ceil(total / 20)
    )

    const startItem =
        total === 0 ? 0 : (page - 1) * 20 + 1

    const endItem =
        Math.min(page * 20, total)

    return (
        <TeacherShell>
            <div className="max-w-[1400px] mx-auto">
                <div className="flex flex-col w-full pb-12">
                    
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 mt-4 gap-6">
                        <div>
                            <h1 className="font-display-lg text-display-lg text-on-surface dark:text-[#f9fafb] mb-2 tracking-tight">Question Bank</h1>
                            <p className="font-body-md text-body-md text-on-surface-variant dark:text-[#9ca3af] max-w-2xl leading-relaxed">
                                Manage, organize, and curate your reusable assessment components for upcoming quizzes and examinations.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="bg-surface-container-lowest dark:bg-[#2c2c2c] text-on-surface dark:text-[#e5e7eb] px-4 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-surface-container-low dark:hover:bg-[#383838] transition-colors flex items-center gap-2 border border-outline-variant/30 dark:border-[#404040] focus:ring-2 focus:ring-primary/50 dark:focus:ring-blue-500/50 focus:outline-none">
                                <svg className="w-[18px] h-[18px] text-on-surface-variant dark:text-[#9ca3af]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                Import CSV
                            </button>
                            <button className="bg-primary dark:bg-blue-600 text-on-primary dark:text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-on-primary-fixed-variant dark:hover:bg-blue-500 transition-colors flex items-center gap-2 shadow-sm focus:ring-2 focus:ring-primary-container dark:focus:ring-blue-400 focus:outline-none">
                                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                Create Question
                            </button>
                        </div>
                    </div>

                    {/* High-Density Stats */}
                    <div className="bg-surface-container-lowest dark:bg-[#262626] rounded-xl border border-surface-variant dark:border-[#363636] p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm">
                        <div className="flex items-center gap-10 flex-1 flex-wrap">
                            <div className="flex flex-col">
                                <span className="font-label-sm text-[11px] font-semibold text-on-surface-variant dark:text-[#9ca3af] uppercase tracking-wider mb-1">Total Questions</span>
                                <span className="font-headline-md text-[28px] font-bold text-on-surface dark:text-[#f9fafb] tracking-tight">{total}</span>
                            </div>
                            <div className="w-px h-12 bg-surface-variant dark:bg-[#363636]"></div>
                            <div className="flex flex-col">
                                <span className="font-label-sm text-[11px] font-semibold text-on-surface-variant dark:text-[#9ca3af] uppercase tracking-wider mb-1">Active</span>
                                <span className="font-headline-md text-[28px] font-bold text-on-surface dark:text-[#f9fafb] tracking-tight">{questions.filter((q) => q.is_active).length}</span>
                            </div>
                            <div className="w-px h-12 bg-surface-variant dark:bg-[#363636]"></div>
                            <div className="flex flex-col">
                                <span className="font-label-sm text-[11px] font-semibold text-on-surface-variant dark:text-[#9ca3af] uppercase tracking-wider mb-1">Drafts</span>
                                <span className="font-headline-md text-[28px] font-bold text-on-surface dark:text-[#f9fafb] tracking-tight">{questions.filter((q) => !q.is_active).length}</span>
                            </div>
                            <div className="w-px h-12 bg-surface-variant dark:bg-[#363636]"></div>
                            <div className="flex flex-col">
                                <span className="font-label-sm text-[11px] font-semibold text-on-surface-variant dark:text-[#9ca3af] uppercase tracking-wider mb-1">Types</span>
                                <span className="font-headline-md text-[28px] font-bold text-on-surface dark:text-[#f9fafb] tracking-tight">{new Set(questions.map((q) => q.question_type)).size}</span>
                            </div>
                        </div>
                        
                        <div className="w-full md:w-auto flex-1 max-w-sm">
                            <span className="font-label-sm text-[11px] font-semibold text-on-surface-variant dark:text-[#9ca3af] uppercase tracking-wider mb-3 block">Question Distribution</span>
                            <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-surface-variant dark:bg-[#1a1a1a] dark:border dark:border-[#363636] mb-3">
                                <div className="bg-primary dark:bg-blue-500 h-full hover:opacity-90 transition-opacity" style={{ width: "50%" }} title="MCQ (50%)"></div>
                                <div className="bg-tertiary dark:bg-emerald-500 h-full hover:opacity-90 transition-opacity" style={{ width: "25%" }} title="Subjective (25%)"></div>
                                <div className="bg-secondary dark:bg-amber-500 h-full hover:opacity-90 transition-opacity" style={{ width: "15%" }} title="MSQ (15%)"></div>
                                <div className="bg-surface-tint dark:bg-purple-500 h-full hover:opacity-90 transition-opacity" style={{ width: "10%" }} title="Coding (10%)"></div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary dark:bg-blue-500"></div><span className="text-[12px] font-medium text-on-surface-variant dark:text-[#9ca3af]">MCQ</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-tertiary dark:bg-emerald-500"></div><span className="text-[12px] font-medium text-on-surface-variant dark:text-[#9ca3af]">Subj</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-secondary dark:bg-amber-500"></div><span className="text-[12px] font-medium text-on-surface-variant dark:text-[#9ca3af]">MSQ</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-surface-tint dark:bg-purple-500"></div><span className="text-[12px] font-medium text-on-surface-variant dark:text-[#9ca3af]">Code</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="bg-surface-container-lowest dark:bg-[#262626] rounded-xl border border-surface-variant dark:border-[#363636] flex-1 flex flex-col overflow-hidden relative shadow-sm">
                        
                        {/* Floating Contextual Bar */}
                        {selected.length > 0 && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-inverse-surface text-on-primary-container px-4 py-2.5 rounded-full shadow-lg z-20 flex items-center gap-4 font-label-sm text-label-sm animate-[slideDown_0.2s_ease-out]">
                                <span className="font-medium bg-primary-container/20 px-2 py-1 rounded-md text-primary-fixed">{selected.length} questions selected</span>
                                <div className="w-px h-4 bg-on-surface-variant/30"></div>
                                <button className="hover:text-primary-fixed transition-colors flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg> 
                                    Add to Quiz
                                </button>
                                <button onClick={() => selected.forEach(handleDeactivate)} className="hover:text-error-container transition-colors flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg> 
                                    Deactivate
                                </button>
                                <div className="w-px h-4 bg-on-surface-variant/30"></div>
                                <button onClick={() => setSelected([])} className="hover:text-on-surface-variant transition-colors ml-1">
                                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                        )}

                        <QuestionFilters
                            search={search}
                            onSearchChange={(value) => {
                                setSearch(value)
                                setPage(1)
                            }}
                            type={type}
                            onTypeChange={(value) => {
                                setType(value)
                                setPage(1)
                            }}
                            difficulty={difficulty}
                            onDifficultyChange={(value) => {
                                setDifficulty(value)
                                setPage(1)
                            }}
                            topic={topic}
                            onTopicChange={(value) => {
                                setTopic(value)
                                setPage(1)
                            }}
                            activeOnly={activeOnly}
                            onActiveChange={(value) => {
                                setActiveOnly(value)
                                setPage(1)
                            }}
                            onClear={clearFilters}
                            hasFilters={!!search || !!type || !!difficulty || !!topic || activeOnly !== ""}
                        />

                        {/* Data Table */}
                        <div className="flex-1 overflow-x-auto relative min-h-[300px]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface-container-low/50 dark:bg-[#202020] border-b border-surface-variant dark:border-[#363636]">
                                        <th className="py-3.5 pl-5 w-12">
                                            <input 
                                                type="checkbox" 
                                                checked={questions.length > 0 && selected.length === questions.length}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 rounded text-primary dark:text-blue-600 border-outline-variant dark:border-[#404040] focus:ring-primary/50 dark:focus:ring-blue-500 bg-surface-container-lowest dark:bg-[#262626] cursor-pointer accent-primary dark:accent-blue-600" 
                                            />
                                        </th>
                                        <th className="py-3.5 px-4 font-label-sm text-[12px] text-on-surface-variant dark:text-[#9ca3af] uppercase tracking-wider font-semibold">Question</th>
                                        <th className="py-3.5 px-4 font-label-sm text-[12px] text-on-surface-variant dark:text-[#9ca3af] uppercase tracking-wider font-semibold w-28">Type</th>
                                        <th className="py-3.5 px-4 font-label-sm text-[12px] text-on-surface-variant dark:text-[#9ca3af] uppercase tracking-wider font-semibold w-28">Difficulty</th>
                                        <th className="py-3.5 px-4 font-label-sm text-[12px] text-on-surface-variant dark:text-[#9ca3af] uppercase tracking-wider font-semibold w-40">Topic</th>
                                        <th className="py-3.5 px-4 font-label-sm text-[12px] text-on-surface-variant dark:text-[#9ca3af] uppercase tracking-wider font-semibold w-20">Marks</th>
                                        <th className="py-3.5 px-4 font-label-sm text-[12px] text-on-surface-variant dark:text-[#9ca3af] uppercase tracking-wider font-semibold w-28">Status</th>
                                        <th className="py-3.5 pr-5 font-label-sm text-[12px] text-on-surface-variant dark:text-[#9ca3af] uppercase tracking-wider font-semibold text-right w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-variant/60 dark:divide-[#333333]">
                                    {loading ? (
                                        <tr><td colSpan="8"><LoadingState /></td></tr>
                                    ) : error ? (
                                        <tr><td colSpan="8"><ErrorState message={error} onRetry={loadQuestions} /></td></tr>
                                    ) : questions.length === 0 ? (
                                        <tr><td colSpan="8">
                                            <EmptyState
                                                hasFilters={!!search || !!type || !!difficulty || !!topic || activeOnly !== ""}
                                                onClear={clearFilters}
                                            />
                                        </td></tr>
                                    ) : (
                                        questions.map((question) => (
                                            <QuestionRow
                                                key={question.id}
                                                question={question}
                                                selected={selected.includes(question.id)}
                                                onSelect={handleSelect}
                                                onDeactivate={handleDeactivate}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {!loading && !error && questions.length > 0 && (
                            <div className="p-4 border-t border-surface-variant dark:border-[#363636] bg-surface-container-lowest dark:bg-[#222222] flex flex-col sm:flex-row items-center justify-between rounded-b-xl gap-4">
                                <span className="font-body-sm text-[13px] text-on-surface-variant dark:text-[#9ca3af]">
                                    Showing <span className="font-semibold text-on-surface dark:text-[#f9fafb]">{startItem}–{endItem}</span> of <span className="font-semibold text-on-surface dark:text-[#f9fafb]">{total}</span> questions
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button 
                                        disabled={!previous}
                                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                                        className="p-1.5 rounded-lg text-on-surface-variant dark:text-[#6b7280] hover:bg-surface-container-low dark:hover:bg-[#2e2e2e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-primary/20 dark:focus:ring-blue-500/20 focus:outline-none"
                                    >
                                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                                    </button>
                                    <div className="flex items-center gap-1 mx-1">
                                        <button className="w-8 h-8 rounded-lg bg-primary dark:bg-blue-600 text-on-primary dark:text-white font-label-sm text-[13px] font-semibold flex items-center justify-center shadow-sm">{page}</button>
                                        <span className="w-8 h-8 flex items-center justify-center text-on-surface-variant dark:text-[#6b7280] text-xs tracking-widest">of {totalPages}</span>
                                    </div>
                                    <button 
                                        disabled={!next}
                                        onClick={() => setPage((current) => current + 1)}
                                        className="p-1.5 rounded-lg text-on-surface-variant dark:text-[#9ca3af] hover:text-on-surface dark:hover:text-[#f9fafb] hover:bg-surface-container-low dark:hover:bg-[#2e2e2e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-primary/20 dark:focus:ring-blue-500/20 focus:outline-none"
                                    >
                                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </TeacherShell>
    )
}

function StatCard({ label, value }) {
    return (
        <div className="
            rounded-2xl
            border border-slate-200
            bg-white p-4
            shadow-sm
            transition-all duration-200
            hover:-translate-y-0.5
            hover:shadow-md
            dark:border-slate-800
            dark:bg-[#101216]
        ">
            <p className="
                text-xs font-medium
                text-slate-500
                dark:text-slate-400
            ">
                {label}
            </p>

            <p className="
                mt-2 text-xl font-bold
                tracking-tight
            ">
                {value}
            </p>
        </div>
    )
}

function LoadingState() {
    return (
        <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, index) => (
                <div
                    key={index}
                    className="
                        flex animate-pulse items-center gap-4
                        border-b border-slate-100
                        px-4 py-5
                        dark:border-slate-800
                    "
                >
                    <div className="
                        h-4 w-4 rounded
                        bg-slate-200
                        dark:bg-slate-800
                       "
                    />

                    <div className="flex-1 space-y-2">
                        <div className="
                            h-4 w-2/5 rounded
                            bg-slate-200
                            dark:bg-slate-800
                        "/>

                        <div className="
                            h-3 w-3/5 rounded
                            bg-slate-100
                            dark:bg-slate-900
                        "/>
                    </div>
                </div>
            ))}
        </div>
    )
}

function EmptyState({ hasFilters, onClear }) {
    return (
        <div className="px-6 py-16 text-center">
            <div className="
                mx-auto flex h-12 w-12 items-center
                justify-center rounded-2xl
                bg-slate-100
                text-slate-400
                dark:bg-slate-800
            ">
                <svg
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                >
                    <path
                        strokeLinecap="round"
                        d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 014 15.5v-10z"
                    />
                    <path
                        strokeLinecap="round"
                        d="M8 8h8M8 12h6"
                    />
                </svg>
            </div>

            <h3 className="
                mt-4 text-sm font-semibold
            ">
                {hasFilters
                    ? "No questions found"
                    : "Your question bank is empty"}
            </h3>

            <p className="
                mx-auto mt-1 max-w-sm
                text-xs leading-5 text-slate-500
                dark:text-slate-400
            ">
                {hasFilters
                    ? "Try adjusting your search or filters."
                    : "Create your first question to start building reusable assessments."}
            </p>

            {hasFilters && (
                <button
                    type="button"
                    onClick={onClear}
                    className="
                        mt-4 text-xs font-semibold
                        text-blue-600
                        hover:text-blue-700
                        dark:text-blue-400
                    "
                >
                    Clear filters
                </button>
            )}
        </div>
    )
}

function ErrorState({ message, onRetry }) {
    return (
        <div className="px-6 py-16 text-center">
            <p className="
                text-sm font-medium text-rose-600
                dark:text-rose-400
            ">
                {message}
            </p>

            <button
                type="button"
                onClick={onRetry}
                className="
                    mt-4 rounded-lg bg-slate-900
                    px-4 py-2 text-xs font-semibold
                    text-white
                    hover:bg-slate-800
                    dark:bg-white
                    dark:text-slate-900
                "
            >
                Try again
            </button>
        </div>
    )
}