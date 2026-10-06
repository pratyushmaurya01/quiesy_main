import { useCallback, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import TeacherShell from "../../components/layout/TeacherShell"
import QuestionFilters from "../../components/questions/QuestionFilters"
import QuestionRow from "../../components/questions/QuestionRow"
import AiGeneratorModal from "../../components/questions/AiGeneratorModal"
import ConfirmDeleteModal from "../../components/layout/ConfirmDeleteModal"
import { useNavigate } from "react-router-dom"
import { getQuestions, deleteQuestion, generateAIQuestions } from "../../api/quizzes"

export default function QuestionBank() {
    const [search, setSearch] = useState("")
    const [type, setType] = useState("")
    const [difficulty, setDifficulty] = useState("")
    const [topic, setTopic] = useState("")
    const [activeOnly, setActiveOnly] = useState("")

    const [page, setPage] = useState(1)

    const [selected, setSelected] = useState([])
    const navigate = useNavigate()

    const { data, isLoading: loading, error: queryError, refetch: loadQuestions } = useQuery({
        queryKey: ['questions', { page, search, type, difficulty, topic, activeOnly }],
        queryFn: async () => {
            const response = await getQuestions({
                page,
                search: search || undefined,
                question_type: type || undefined,
                difficulty: difficulty || undefined,
                topic: topic || undefined,
                is_active: activeOnly !== "" ? activeOnly : undefined,
            })
            return response.data
        },
        staleTime: 1000 * 60 * 5,
    })

    const questions = data?.results || []
    const total = data?.count || 0
    const next = data?.next
    const previous = data?.previous
    const error = queryError ? "Unable to load your questions. Please try again." : ""

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

    const [isAiModalOpen, setIsAiModalOpen] = useState(false)
    const [deleteQuestionId, setDeleteQuestionId] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const queryClient = useQueryClient()

    const handleGenerateAi = async (data) => {
        await generateAIQuestions(data)
        queryClient.invalidateQueries({ queryKey: ['questions'] })
    }

    const confirmDelete = async () => {
        if (!deleteQuestionId) return
        setIsDeleting(true)
        try {
            if (Array.isArray(deleteQuestionId)) {
                await Promise.all(deleteQuestionId.map(id => deleteQuestion(id)))
                setSelected([])
            } else {
                await deleteQuestion(deleteQuestionId)
                setSelected((current) => current.filter((item) => item !== deleteQuestionId))
            }
            queryClient.invalidateQueries({ queryKey: ['questions'] })
            setDeleteQuestionId(null)
        } catch (requestError) {
            console.error(requestError)
            window.alert("Unable to delete question(s).")
        } finally {
            setIsDeleting(false)
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
                            <h1 className="font-display-lg text-display-lg text-slate-900 dark:text-white mb-2 tracking-tight">Question Bank</h1>
                            <p className="font-body-md text-body-md text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                                Manage, organize, and curate your reusable assessment components for upcoming quizzes and examinations.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="bg-white dark:bg-[#141518] text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-slate-50 dark:hover:bg-[#1a1c22] transition-colors flex items-center gap-2 border border-slate-200 dark:border-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500/50 focus:outline-none cursor-pointer">
                                <svg className="w-[18px] h-[18px] text-slate-400 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                Import CSV
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsAiModalOpen(true)}
                                className="bg-purple-600/10 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-purple-600/20 dark:hover:bg-purple-500/20 transition-colors flex items-center gap-2 shadow-sm focus:ring-2 focus:ring-purple-400 focus:outline-none cursor-pointer active:scale-[0.98]"
                            >
                                Create using AI
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate("/create-question")}
                                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none cursor-pointer active:scale-[0.98]"
                            >
                                <svg
                                    className="w-[18px] h-[18px]"
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
                                Create Question
                            </button>
                        </div>
                    </div>

                    {/* High-Density Stats */}
                    <div className="bg-white dark:bg-[#141518] rounded-xl border border-slate-300/90 dark:border-slate-800/80 p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-8 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]">
                        <div className="flex items-center justify-between sm:justify-start gap-6 sm:gap-10 flex-1 flex-wrap">
                            <div className="flex flex-col">
                                <span className="font-label-sm text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Questions</span>
                                <span className="font-headline-md text-[28px] font-bold text-slate-900 dark:text-white tracking-tight">{total}</span>
                            </div>
                            <div className="w-px h-12 bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                            <div className="flex flex-col">
                                <span className="font-label-sm text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Active</span>
                                <span className="font-headline-md text-[28px] font-bold text-slate-900 dark:text-white tracking-tight">{questions.filter((q) => q.is_active).length}</span>
                            </div>
                            <div className="w-px h-12 bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                            <div className="flex flex-col">
                                <span className="font-label-sm text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Drafts</span>
                                <span className="font-headline-md text-[28px] font-bold text-slate-900 dark:text-white tracking-tight">{questions.filter((q) => !q.is_active).length}</span>
                            </div>
                            <div className="w-px h-12 bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                            <div className="flex flex-col">
                                <span className="font-label-sm text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Types</span>
                                <span className="font-headline-md text-[28px] font-bold text-slate-900 dark:text-white tracking-tight">{new Set(questions.map((q) => q.question_type)).size}</span>
                            </div>
                        </div>
                        
                        <div className="w-full md:w-auto flex-1 max-w-sm">
                            <span className="font-label-sm text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 block">Question Distribution</span>
                            {(() => {
                                const countByType = { MCQ: 0, SUBJECTIVE: 0, MSQ: 0, CODING: 0 };
                                questions.forEach((q) => {
                                    const t = (q.question_type || "").toUpperCase();
                                    if (countByType[t] !== undefined) {
                                        countByType[t] += 1;
                                    } else {
                                        countByType.MCQ += 1;
                                    }
                                });
                                const totalCount = questions.length || 1;
                                const mcqPct = Math.round((countByType.MCQ / totalCount) * 100);
                                const subjPct = Math.round((countByType.SUBJECTIVE / totalCount) * 100);
                                const msqPct = Math.round((countByType.MSQ / totalCount) * 100);
                                const codePct = Math.max(0, 100 - mcqPct - subjPct - msqPct);

                                return (
                                    <>
                                        <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-[#0e0f12] dark:border dark:border-slate-800 mb-3">
                                            {mcqPct > 0 && (
                                                <div 
                                                    className="bg-blue-600 dark:bg-blue-500 h-full hover:opacity-90 transition-opacity" 
                                                    style={{ width: `${mcqPct}%` }} 
                                                    title={`MCQ (${mcqPct}%)`}
                                                ></div>
                                            )}
                                            {subjPct > 0 && (
                                                <div 
                                                    className="bg-emerald-600 dark:bg-emerald-500 h-full hover:opacity-90 transition-opacity" 
                                                    style={{ width: `${subjPct}%` }} 
                                                    title={`Subjective (${subjPct}%)`}
                                                ></div>
                                            )}
                                            {msqPct > 0 && (
                                                <div 
                                                    className="bg-amber-600 dark:bg-amber-500 h-full hover:opacity-90 transition-opacity" 
                                                    style={{ width: `${msqPct}%` }} 
                                                    title={`MSQ (${msqPct}%)`}
                                                ></div>
                                            )}
                                            {codePct > 0 && (
                                                <div 
                                                    className="bg-purple-600 dark:bg-purple-500 h-full hover:opacity-90 transition-opacity" 
                                                    style={{ width: `${codePct}%` }} 
                                                    title={`Coding (${codePct}%)`}
                                                ></div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500"></div><span className="text-[12px] font-medium text-slate-500 dark:text-slate-300">MCQ {countByType.MCQ > 0 ? `(${mcqPct}%)` : ""}</span></div>
                                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-500"></div><span className="text-[12px] font-medium text-slate-500 dark:text-slate-300">Subj {countByType.SUBJECTIVE > 0 ? `(${subjPct}%)` : ""}</span></div>
                                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-500"></div><span className="text-[12px] font-medium text-slate-500 dark:text-slate-300">MSQ {countByType.MSQ > 0 ? `(${msqPct}%)` : ""}</span></div>
                                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-500"></div><span className="text-[12px] font-medium text-slate-500 dark:text-slate-300">Code {countByType.CODING > 0 ? `(${codePct}%)` : ""}</span></div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="bg-white dark:bg-[#141518] rounded-xl border border-slate-300/90 dark:border-slate-800/80 flex-1 flex flex-col overflow-hidden relative shadow-[0_2px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.03)]">
                        
                        {/* Floating Contextual Bar */}
                        {selected.length > 0 && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-800 text-white px-4 py-2.5 rounded-full shadow-2xl z-20 flex items-center gap-4 font-label-sm text-label-sm border border-slate-700/60 animate-[slideDown_0.2s_ease-out]">
                                <span className="font-medium bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-md text-xs">{selected.length} selected</span>
                                <div className="w-px h-4 bg-slate-700"></div>
                                <button className="hover:text-blue-400 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg> 
                                    Add to Quiz
                                </button>
                                <button onClick={() => setDeleteQuestionId(selected)} className="hover:text-red-400 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> 
                                    Delete
                                </button>
                                <div className="w-px h-4 bg-slate-700"></div>
                                <button onClick={() => setSelected([])} className="hover:text-slate-300 transition-colors ml-1 cursor-pointer">
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
                            <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
                                <thead>
                                    <tr className="bg-[#f0f2f5] dark:bg-[#0e0f12] border-b border-slate-300 dark:border-slate-800">
                                        <th className="py-3.5 pl-5 w-12">
                                            <input 
                                                type="checkbox" 
                                                checked={questions.length > 0 && selected.length === questions.length}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-700 focus:ring-blue-500 bg-white dark:bg-[#141518] cursor-pointer accent-blue-600" 
                                            />
                                        </th>
                                        <th className="py-3.5 px-4 font-label-sm text-[12px] text-slate-700 dark:text-slate-200 uppercase tracking-wider font-bold">Question</th>
                                        <th className="py-3.5 px-4 font-label-sm text-[12px] text-slate-700 dark:text-slate-200 uppercase tracking-wider font-bold w-28">Type</th>
                                        <th className="py-3.5 px-4 font-label-sm text-[12px] text-slate-700 dark:text-slate-200 uppercase tracking-wider font-bold w-28">Difficulty</th>
                                        <th className="py-3.5 px-4 font-label-sm text-[12px] text-slate-700 dark:text-slate-200 uppercase tracking-wider font-bold w-40">Topic</th>
                                        <th className="py-3.5 px-4 font-label-sm text-[12px] text-slate-700 dark:text-slate-200 uppercase tracking-wider font-bold w-20">Marks</th>
                                        <th className="py-3.5 px-4 font-label-sm text-[12px] text-slate-700 dark:text-slate-200 uppercase tracking-wider font-bold w-28">Status</th>
                                        <th className="py-3.5 pr-5 font-label-sm text-[12px] text-slate-700 dark:text-slate-200 uppercase tracking-wider font-bold text-right w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
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
                                                onDelete={setDeleteQuestionId}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {!loading && !error && questions.length > 0 && (
                            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141518] flex flex-col sm:flex-row items-center justify-between rounded-b-xl gap-4">
                                <span className="font-body-sm text-[13px] text-slate-500 dark:text-slate-400">
                                    Showing <span className="font-semibold text-slate-900 dark:text-white">{startItem}–{endItem}</span> of <span className="font-semibold text-slate-900 dark:text-white">{total}</span> questions
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button 
                                        disabled={!previous}
                                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1a1c22] disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer"
                                    >
                                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                                    </button>
                                    <div className="flex items-center gap-1 mx-1">
                                        <button className="w-8 h-8 rounded-lg bg-blue-600 text-white font-label-sm text-[13px] font-semibold flex items-center justify-center shadow-sm">{page}</button>
                                        <span className="w-8 h-8 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs tracking-widest">of {totalPages}</span>
                                    </div>
                                    <button 
                                        disabled={!next}
                                        onClick={() => setPage((current) => current + 1)}
                                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a1c22] disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer"
                                    >
                                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AiGeneratorModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                onGenerate={handleGenerateAi}
            />

            <ConfirmDeleteModal
                isOpen={!!deleteQuestionId}
                onClose={() => setDeleteQuestionId(null)}
                onConfirm={confirmDelete}
                title="Delete Question?"
                message="Are you sure you want to completely delete this question? This action cannot be undone."
                isDeleting={isDeleting}
            />
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