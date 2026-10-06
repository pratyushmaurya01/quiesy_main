import { useState } from "react"

const typeLabels = {
    MCQ: "MCQ",
    MSQ: "MSQ",
    SUBJECTIVE: "Subjective",
    CODING: "Coding",
}



export default function QuestionRow({
    question,
    selected,
    onSelect,
    onDelete,
}) {
    const [menuOpen, setMenuOpen] = useState(false)

    // Difficulty specific colors based on the dark mode design mapping
    const getDifficultyStyles = (difficulty) => {
        if (difficulty === "EASY") return "bg-[#10b981]/10 text-[#059669] border-[#10b981]/20 dark:bg-[#10b981]/15 dark:text-[#34d399] dark:border-[#10b981]/20";
        if (difficulty === "MEDIUM") return "bg-tertiary/10 text-tertiary border-tertiary/20 dark:bg-[#f59e0b]/15 dark:text-[#fbbf24] dark:border-[#f59e0b]/20";
        if (difficulty === "HARD") return "bg-error/10 text-error border-error/20 dark:bg-[#ef4444]/15 dark:text-[#f87171] dark:border-[#ef4444]/20";
        return "bg-surface-variant/60 text-on-surface-variant border-outline-variant/30";
    };

    return (
        <tr className="group hover:bg-slate-50/80 dark:hover:bg-[#181a20] transition-all cursor-pointer relative">
            <td className="py-4 pl-5 align-top">
                <div className="pt-0.5">
                    <input 
                        type="checkbox"
                        checked={selected}
                        onChange={() => onSelect(question.id)}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-700 focus:ring-blue-500 bg-white dark:bg-[#141518] cursor-pointer accent-blue-600 block" 
                    />
                </div>
            </td>
            <td className="py-4 px-4 align-top w-full max-w-0">
                <div className="flex flex-col gap-1.5 dark:gap-1">
                    <span className="font-title-lg text-[15px] dark:text-[14px] leading-tight dark:leading-snug text-slate-900 dark:text-white font-semibold truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {question.title || `Question #${question.id}`}
                    </span>
                    <span className="font-body-sm text-[14px] dark:text-[13px] text-slate-500 dark:text-slate-400 truncate">
                        {question.text}
                    </span>
                </div>
            </td>
            <td className="py-4 px-4 align-top">
                <span className="inline-flex items-center justify-center px-2 py-1 dark:py-0.5 rounded text-[11px] font-bold dark:font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-transparent uppercase tracking-widest min-w-[50px]">
                    {typeLabels[question.question_type] || question.question_type}
                </span>
            </td>
            <td className="py-4 px-4 align-top">
                {question.difficulty ? (
                    <span className={`inline-flex items-center justify-center px-2 py-1 dark:px-2.5 dark:py-0.5 rounded text-[11px] dark:text-[12px] font-bold dark:font-medium border uppercase tracking-widest min-w-[70px] ${getDifficultyStyles(question.difficulty)}`}>
                        {question.difficulty}
                    </span>
                ) : (
                    <span className="text-slate-400 dark:text-slate-500">-</span>
                )}
            </td>
            <td className="py-4 px-4 align-top font-body-sm text-[14px] text-slate-600 dark:text-[13px] dark:text-slate-300">
                {question.topic || "-"}
            </td>
            <td className="py-4 px-4 align-top font-body-sm text-[14px] text-slate-600 dark:text-[13px] dark:text-slate-300">
                {question.marks || 1}
            </td>
            <td className="py-4 px-4 align-top">
                {question.is_active ? (
                    <span className="inline-flex items-center gap-1.5 font-label-sm text-[12px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_0_2px_rgba(16,185,129,0.2)] dark:shadow-[0_0_6px_rgba(52,211,153,0.5)]"></span>
                        Active
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 font-label-sm text-[12px] text-slate-500 dark:text-slate-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500"></span>
                        Draft
                    </span>
                )}
            </td>
            <td className="py-4 pr-5 align-top text-right">
                <div className="relative inline-block text-left">
                    <button 
                        onClick={() => setMenuOpen((v) => !v)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                    </button>
                    
                    {menuOpen && (
                        <div className="absolute right-0 top-10 w-48 bg-white dark:bg-[#141518] border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl py-1.5 z-20 flex flex-col text-left">
                            <button className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a1c22] text-left w-full flex items-center gap-2 transition-colors cursor-pointer">
                                <svg className="w-[18px] h-[18px] text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                Edit
                            </button>
                            <button className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a1c22] text-left w-full flex items-center gap-2 transition-colors cursor-pointer">
                                <svg className="w-[18px] h-[18px] text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                Duplicate
                            </button>
                            <button className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a1c22] text-left w-full flex items-center gap-2 transition-colors cursor-pointer">
                                <svg className="w-[18px] h-[18px] text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                View History
                            </button>
                            <button className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a1c22] text-left w-full flex items-center gap-2 transition-colors cursor-pointer">
                                <svg className="w-[18px] h-[18px] text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                Add to Quiz
                            </button>
                            {question.is_active && (
                                <>
                                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-1.5"></div>
                                    <button 
                                        onClick={() => {
                                            setMenuOpen(false);
                                            onDelete(question.id);
                                        }}
                                        className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-left w-full flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </td>
        </tr>
    )
}