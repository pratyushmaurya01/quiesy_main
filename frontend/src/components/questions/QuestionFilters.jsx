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
        <div className="p-4 bg-surface-container-lowest dark:bg-[#262626] border-b border-surface-variant dark:border-[#363636] flex flex-col lg:flex-row gap-4 items-center justify-between rounded-t-xl">
            <div className="relative w-full lg:w-80">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-[#9ca3af] w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                    className="w-full bg-surface dark:bg-[#202020] border border-outline-variant/50 dark:border-[#3a3a3a] text-on-surface dark:text-[#f3f4f6] rounded-lg py-2.5 dark:py-2 pl-10 pr-4 font-body-sm text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/50 dark:focus:ring-blue-500 focus:border-primary dark:focus:border-blue-500 transition-all placeholder:text-on-surface-variant/70 dark:placeholder:text-[#6b7280] hover:border-outline-variant"
                    placeholder="Search by keyword, ID..."
                    type="text"
                />
            </div>
            <div className="flex flex-wrap items-center gap-3 dark:gap-2.5 w-full lg:w-auto">
                <div className="relative">
                    <select
                        value={type}
                        onChange={(event) => onTypeChange(event.target.value)}
                        className="bg-surface dark:bg-[#202020] border border-outline-variant/50 dark:border-[#3a3a3a] text-on-surface-variant dark:text-[#d1d5db] px-3 py-2 rounded-lg font-label-sm text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/50 dark:focus:ring-blue-500 focus:border-primary dark:focus:border-blue-500 cursor-pointer appearance-none pr-8 hover:bg-surface-container-low dark:hover:bg-[#2a2a2a] transition-colors"
                    >
                        <option value="">Type: All</option>
                        <option value="MCQ">MCQ</option>
                        <option value="SUBJECTIVE">Subjective</option>
                        <option value="MSQ">MSQ</option>
                        <option value="CODING">Coding</option>
                    </select>
                    <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant dark:text-[#9ca3af] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
                
                <div className="relative">
                    <select
                        value={difficulty}
                        onChange={(event) => onDifficultyChange(event.target.value)}
                        className="bg-surface dark:bg-[#202020] border border-outline-variant/50 dark:border-[#3a3a3a] text-on-surface-variant dark:text-[#d1d5db] px-3 py-2 rounded-lg font-label-sm text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/50 dark:focus:ring-blue-500 focus:border-primary dark:focus:border-blue-500 cursor-pointer appearance-none pr-8 hover:bg-surface-container-low dark:hover:bg-[#2a2a2a] transition-colors"
                    >
                        <option value="">Difficulty: All</option>
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                    </select>
                    <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant dark:text-[#9ca3af] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
                
                <div className="relative">
                    <select
                        value={topic}
                        onChange={(event) => onTopicChange(event.target.value)}
                        className="bg-surface dark:bg-[#202020] border border-outline-variant/50 dark:border-[#3a3a3a] text-on-surface-variant dark:text-[#d1d5db] px-3 py-2 rounded-lg font-label-sm text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/50 dark:focus:ring-blue-500 focus:border-primary dark:focus:border-blue-500 cursor-pointer appearance-none pr-8 hover:bg-surface-container-low dark:hover:bg-[#2a2a2a] transition-colors"
                    >
                        <option value="">Topic: All</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Biology">Biology</option>
                    </select>
                    <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant dark:text-[#9ca3af] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
                
                <div className="relative">
                    <select
                        value={activeOnly}
                        onChange={(event) => onActiveChange(event.target.value)}
                        className="bg-surface dark:bg-[#202020] border border-outline-variant/50 dark:border-[#3a3a3a] text-on-surface-variant dark:text-[#d1d5db] px-3 py-2 rounded-lg font-label-sm text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/50 dark:focus:ring-blue-500 focus:border-primary dark:focus:border-blue-500 cursor-pointer appearance-none pr-8 hover:bg-surface-container-low dark:hover:bg-[#2a2a2a] transition-colors"
                    >
                        <option value="">Status: All</option>
                        <option value="true">Active</option>
                        <option value="false">Draft</option>
                    </select>
                    <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant dark:text-[#9ca3af] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
                
                {hasFilters && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="text-primary dark:text-blue-400 font-label-sm text-[13px] hover:underline px-2 transition-all"
                    >
                        Clear filters
                    </button>
                )}
            </div>
        </div>
    )
}