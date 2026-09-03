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
    onDeactivate,
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
        <tr className="group hover:bg-surface-container-low/80 dark:hover:bg-[#2d2d2d] transition-all cursor-pointer relative">
            <td className="py-4 pl-5 align-top">
                <input 
                    type="checkbox"
                    checked={selected}
                    onChange={() => onSelect(question.id)}
                    className="w-4 h-4 rounded text-primary dark:text-blue-600 border-outline-variant dark:border-[#404040] focus:ring-primary/50 dark:focus:ring-blue-500 bg-surface-container-lowest dark:bg-[#202020] cursor-pointer accent-primary dark:accent-blue-600 mt-1" 
                />
            </td>
            <td className="py-4 px-4 align-top">
                <div className="flex flex-col gap-1.5 dark:gap-1">
                    <span className="font-title-lg text-[15px] dark:text-[14px] leading-tight dark:leading-snug text-on-surface dark:text-[#f9fafb] font-semibold truncate max-w-[500px] group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
                        {question.title || `Question #${question.id}`}
                    </span>
                    <span className="font-body-sm text-[14px] dark:text-[13px] text-on-surface-variant/80 dark:text-[#9ca3af] truncate max-w-[500px]">
                        {question.text}
                    </span>
                </div>
            </td>
            <td className="py-4 px-4 align-top">
                <span className="inline-flex items-center justify-center px-2 py-1 dark:py-0.5 rounded text-[11px] font-bold dark:font-semibold bg-surface-variant/60 dark:bg-[#333333] text-on-surface-variant dark:text-[#d1d5db] border border-outline-variant/30 dark:border-transparent uppercase tracking-widest min-w-[50px]">
                    {typeLabels[question.question_type] || question.question_type}
                </span>
            </td>
            <td className="py-4 px-4 align-top">
                {question.difficulty ? (
                    <span className={`inline-flex items-center justify-center px-2 py-1 dark:px-2.5 dark:py-0.5 rounded text-[11px] dark:text-[12px] font-bold dark:font-medium border uppercase tracking-widest min-w-[70px] ${getDifficultyStyles(question.difficulty)}`}>
                        {question.difficulty}
                    </span>
                ) : (
                    <span className="text-on-surface-variant dark:text-[#9ca3af]">-</span>
                )}
            </td>
            <td className="py-4 px-4 align-top font-body-sm text-[14px] text-on-surface-variant dark:text-[13px] dark:text-[#d1d5db]">
                {question.topic || "-"}
            </td>
            <td className="py-4 px-4 align-top font-body-sm text-[14px] text-on-surface-variant dark:text-[13px] dark:text-[#d1d5db]">
                {question.marks || 1}
            </td>
            <td className="py-4 px-4 align-top">
                {question.is_active ? (
                    <span className="inline-flex items-center gap-1.5 font-label-sm text-[12px] text-primary dark:text-emerald-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-primary dark:bg-emerald-400 shadow-[0_0_0_2px_rgba(0,74,198,0.2)] dark:shadow-[0_0_6px_rgba(52,211,153,0.5)]"></span>
                        Active
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 font-label-sm text-[12px] text-on-surface-variant dark:text-[#9ca3af] font-medium">
                        <span className="w-2 h-2 rounded-full bg-on-surface-variant dark:bg-[#6b7280] shadow-[0_0_0_2px_rgba(67,70,85,0.2)] dark:shadow-none"></span>
                        Draft
                    </span>
                )}
            </td>
            <td className="py-4 pr-5 align-top text-right">
                <div className="relative inline-block text-left">
                    <button 
                        onClick={() => setMenuOpen((v) => !v)}
                        className="p-1.5 text-on-surface-variant dark:text-[#9ca3af] hover:text-primary dark:hover:text-[#f9fafb] hover:bg-surface-variant/50 dark:hover:bg-[#363636] rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                    </button>
                    
                    {menuOpen && (
                        <div className="absolute right-0 top-10 w-48 bg-surface-container-lowest dark:bg-[#15171c] border border-surface-variant dark:border-[#333333] shadow-xl rounded-xl py-1.5 z-20 flex flex-col text-left">
                            <button className="px-4 py-2 text-sm text-on-surface dark:text-[#f9fafb] hover:bg-surface-container-low dark:hover:bg-[#282828] text-left w-full flex items-center gap-2 transition-colors">
                                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                Edit
                            </button>
                            <button className="px-4 py-2 text-sm text-on-surface dark:text-[#f9fafb] hover:bg-surface-container-low dark:hover:bg-[#282828] text-left w-full flex items-center gap-2 transition-colors">
                                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                Duplicate
                            </button>
                            <button className="px-4 py-2 text-sm text-on-surface dark:text-[#f9fafb] hover:bg-surface-container-low dark:hover:bg-[#282828] text-left w-full flex items-center gap-2 transition-colors">
                                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                View History
                            </button>
                            <button className="px-4 py-2 text-sm text-on-surface dark:text-[#f9fafb] hover:bg-surface-container-low dark:hover:bg-[#282828] text-left w-full flex items-center gap-2 transition-colors">
                                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                Add to Quiz
                            </button>
                            {question.is_active && (
                                <>
                                    <div className="h-px bg-surface-variant dark:bg-[#333333] my-1.5"></div>
                                    <button 
                                        onClick={() => {
                                            setMenuOpen(false);
                                            onDeactivate(question.id);
                                        }}
                                        className="px-4 py-2 text-sm text-error dark:text-red-400 hover:bg-error/10 dark:hover:bg-red-500/10 text-left w-full flex items-center gap-2 transition-colors"
                                    >
                                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                                        Deactivate
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