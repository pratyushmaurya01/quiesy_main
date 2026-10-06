import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function AiGeneratorModal({ isOpen, onClose, onGenerate }) {
    const [topic, setTopic] = useState("")
    const [instructions, setInstructions] = useState("")
    const [count, setCount] = useState(3)
    const [questionType, setQuestionType] = useState("MCQ")
    const [difficulty, setDifficulty] = useState("MEDIUM")
    const [optionVariance, setOptionVariance] = useState("Different")
    const [isLoading, setIsLoading] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!topic.trim()) return

        setIsLoading(true)
        try {
            await onGenerate({
                topic,
                prompt_instructions: instructions,
                count: Number(count),
                question_type: questionType,
                difficulty,
                option_variance: optionVariance
            })
            onClose()
        } catch (error) {
            console.error("AI Generation Error:", error.response?.data?.detail || error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="w-full max-w-lg overflow-hidden bg-white shadow-2xl rounded-2xl dark:bg-[#141518] border border-slate-200 dark:border-slate-800"
                >
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>✨</span> Create Questions using AI
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Let Gemini generate questions tailored to your exact requirements.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div>
                            <label className="block mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                                Topic
                            </label>
                            <input
                                type="text"
                                required
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., Photosynthesis in Plants"
                                className="w-full h-10 px-3 text-sm bg-white border rounded-lg border-slate-300 dark:border-slate-700 dark:bg-[#1A1C22] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Type
                                </label>
                                <select
                                    value={questionType}
                                    onChange={(e) => setQuestionType(e.target.value)}
                                    className="w-full h-10 px-3 text-sm bg-white border rounded-lg border-slate-300 dark:border-slate-700 dark:bg-[#1A1C22] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                >
                                    <option value="MCQ">MCQ</option>
                                    <option value="MSQ">MSQ</option>
                                    <option value="SUBJECTIVE">Subjective</option>
                                    <option value="CODING">Coding</option>
                                </select>
                            </div>

                            <div>
                                <label className="block mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Difficulty
                                </label>
                                <select
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value)}
                                    className="w-full h-10 px-3 text-sm bg-white border rounded-lg border-slate-300 dark:border-slate-700 dark:bg-[#1A1C22] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                >
                                    <option value="EASY">Easy</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HARD">Hard</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Count (Max 10)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    required
                                    value={count}
                                    onChange={(e) => setCount(e.target.value)}
                                    className="w-full h-10 px-3 text-sm bg-white border rounded-lg border-slate-300 dark:border-slate-700 dark:bg-[#1A1C22] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Option Variance
                                </label>
                                <select
                                    value={optionVariance}
                                    onChange={(e) => setOptionVariance(e.target.value)}
                                    disabled={questionType === "SUBJECTIVE" || questionType === "CODING"}
                                    className="w-full h-10 px-3 text-sm bg-white border rounded-lg border-slate-300 dark:border-slate-700 dark:bg-[#1A1C22] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
                                >
                                    <option value="Different">Distinct (Clear)</option>
                                    <option value="Similar">Similar (Tricky)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                                Detailed Instructions
                            </label>
                            <textarea
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder="e.g., Make the options same length, use real-world scenarios, make the question tricky..."
                                rows={3}
                                className="w-full p-3 text-sm bg-white border rounded-lg resize-none border-slate-300 dark:border-slate-700 dark:bg-[#1A1C22] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>



                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-medium transition-colors rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-5 py-2 text-sm font-medium text-white transition-all bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-50 flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    "Generate Questions"
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
