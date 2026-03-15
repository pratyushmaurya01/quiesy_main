export default function QuizCard({ quiz }) {
  return (
    <div className="
      flex flex-col
      bg-white dark:bg-slate-900
      border border-slate-200 dark:border-slate-800
      rounded-xl
      p-5
      shadow-sm
      hover:shadow-md
      transition-shadow
      duration-200
    ">
      
      {/* --- Card Header & Info --- */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 leading-tight">
          {quiz.title}
        </h3>

        <div className="space-y-2">
          {/* Subject with SVG Icon */}
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>{quiz.subject}</span>
          </div>

          {/* Questions with SVG Icon */}
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span>{quiz.questions} Questions</span>
          </div>
        </div>
      </div>

      {/* --- Action Buttons --- */}
      <div className="mt-auto space-y-3">
        
        {/* Secondary Actions (Edit & Add) */}
        <div className="grid grid-cols-2 gap-2">
          <button className="
            flex items-center justify-center gap-1.5
            py-2 px-3
            bg-slate-50 dark:bg-slate-800/50
            hover:bg-slate-100 dark:hover:bg-slate-800
            border border-slate-200 dark:border-slate-700
            text-slate-700 dark:text-slate-300
            text-sm font-medium
            rounded-lg
            transition-colors
          ">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            Edit
          </button>

          <button className="
            flex items-center justify-center gap-1.5
            py-2 px-3
            bg-slate-50 dark:bg-slate-800/50
            hover:bg-slate-100 dark:hover:bg-slate-800
            border border-slate-200 dark:border-slate-700
            text-slate-700 dark:text-slate-300
            text-sm font-medium
            rounded-lg
            transition-colors
          ">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Add Q's
          </button>
        </div>

        {/* Primary Action (View Results) */}
        <button className="
          w-full
          flex items-center justify-center gap-2
          py-2.5 px-4
          bg-blue-600 hover:bg-blue-700
          text-white
          text-sm font-medium
          rounded-lg
          transition-colors
          shadow-sm
        ">
          View Results
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

    </div>
  )
}   