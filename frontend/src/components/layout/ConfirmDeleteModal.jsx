import { motion, AnimatePresence } from "framer-motion"

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, message, isDeleting }) {
    if (!isOpen) return null

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
                    className="w-full max-w-sm overflow-hidden bg-white shadow-2xl rounded-2xl dark:bg-[#141518] border border-slate-200 dark:border-slate-800"
                >
                    <div className="p-6">
                        <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            {title}
                        </h2>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            {message}
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-[#1A1C22]/50 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isDeleting}
                            className="px-4 py-2 text-sm font-medium transition-colors rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="px-5 py-2 text-sm font-medium text-white transition-all bg-red-600 rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500/20 focus:outline-none disabled:opacity-50 flex items-center gap-2"
                        >
                            {isDeleting ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
