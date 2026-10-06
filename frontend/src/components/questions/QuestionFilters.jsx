export default function QuestionFilters({
    search,
    onSearchChange,
    type,
    onTypeChange,
    difficulty,
    onDifficultyChange,
    topic,
    onTopicChange,
    activeOnly,
    onActiveChange,
    onClear,
}) {
    const hasFilters =
        search ||
        type ||
        difficulty ||
        topic ||
        activeOnly !== ""

    return (
        <div className="p-4 bg-white dark:bg-[#141518] border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row gap-4 items-center justify-between rounded-t-xl">
            <div className="relative w-full lg:w-80">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                    className="w-full bg-slate-50/70 dark:bg-[#0e0f12] border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg py-2.5 dark:py-2 pl-10 pr-4 font-body-sm text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-300 dark:hover:border-slate-700"
                    placeholder="Search by keyword, ID..."
                    type="text"
                />
            </div>
            <div className="flex flex-wrap items-center gap-3 dark:gap-2.5 w-full lg:w-auto">
                <div className="relative">
                    <select
                        value={type}
                        onChange={(event) => onTypeChange(event.target.value)}
                        className="bg-white dark:bg-[#0e0f12] border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-lg font-label-sm text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer appearance-none pr-8 hover:bg-slate-50 dark:hover:bg-[#1a1c22] transition-colors"
                    >
                        <option value="">Type: All</option>
                        <option value="MCQ">MCQ</option>
                        <option value="SUBJECTIVE">Subjective</option>
                        <option value="MSQ">MSQ</option>
                        <option value="CODING">Coding</option>
                    </select>
                    <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
                
                <div className="relative">
                    <select
                        value={difficulty}
                        onChange={(event) => onDifficultyChange(event.target.value)}
                        className="bg-white dark:bg-[#0e0f12] border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-lg font-label-sm text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer appearance-none pr-8 hover:bg-slate-50 dark:hover:bg-[#1a1c22] transition-colors"
                    >
                        <option value="">Difficulty: All</option>
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                    </select>
                    <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
                
                <div className="relative">
                    <select
                        value={topic}
                        onChange={(event) => onTopicChange(event.target.value)}
                        className="bg-white dark:bg-[#0e0f12] border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-lg font-label-sm text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer appearance-none pr-8 hover:bg-slate-50 dark:hover:bg-[#1a1c22] transition-colors"
                    >
                        <option value="">Topic: All</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Biology">Biology</option>
                    </select>
                    <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
                
                <div className="relative">
                    <select
                        value={activeOnly}
                        onChange={(event) => onActiveChange(event.target.value)}
                        className="bg-white dark:bg-[#0e0f12] border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-lg font-label-sm text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer appearance-none pr-8 hover:bg-slate-50 dark:hover:bg-[#1a1c22] transition-colors"
                    >
                        <option value="">Status: All</option>
                        <option value="true">Active</option>
                        <option value="false">Draft</option>
                    </select>
                    <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
                
                {hasFilters && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="text-blue-600 dark:text-blue-400 font-label-sm text-[13px] hover:underline px-2 transition-all cursor-pointer font-medium"
                    >
                        Clear filters
                    </button>
                )}
            </div>
        </div>
    )
}