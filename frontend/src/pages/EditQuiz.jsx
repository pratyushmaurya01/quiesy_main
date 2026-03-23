import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"

export default function EditQuiz() {
  const { quizId } = useParams()

  const [questions, setQuestions] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // 1. FIXED: Moved fetchQuestions ABOVE useEffect so it initializes properly
  const fetchQuestions = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("access")
      const res = await fetch(
        `http://127.0.0.1:8000/api/quiz/${quizId}/questions-list/`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      const data = await res.json()
      setQuestions(data)
    } catch (err) {
      console.error("Failed to fetch questions:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [quizId])

  // --- Handlers ---
  const handleQuestionChange = (id, field, value) => {
    setQuestions(prev =>
      prev.map(q =>
        q.id === id ? { ...q, [field]: value } : q
      )
    )
  }

  const handleOptionChange = (qId, optIndex, value) => {
    setQuestions(prev =>
      prev.map(q => {
        if (q.id === qId) {
          const newOptions = [...q.options]
          newOptions[optIndex].text = value
          return { ...q, options: newOptions }
        }
        return q
      })
    )
  }

  const handleCorrectSelect = (qId, optIndex) => {
    setQuestions(prev =>
      prev.map(q => {
        if (q.id === qId) {
          const newOptions = q.options.map((opt, i) => ({
            ...opt,
            is_correct: i === optIndex
          }))
          return { ...q, options: newOptions }
        }
        return q
      })
    )
  }

  // 2. FIXED: Cancel now reverts changes by refetching original data
  const handleCancel = () => {
    setEditingId(null)
    fetchQuestions() 
  }

  // 3. FIXED: Added error handling to Save
  const handleSave = async (q) => {
    try {
      const token = localStorage.getItem("access")
      const body = {
        question_id: q.id,
        text: q.text,
        marks: q.marks,
        options: q.options
      }

      const res = await fetch(
        "http://127.0.0.1:8000/api/update-question/",
        {
          method: "PUT", // Ensure backend supports PUT for this endpoint
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(body)
        }
      )

      if (res.ok) {
        setEditingId(null)
      } else {
        alert("Failed to save. Please check your backend connection.")
      }
    } catch (err) {
      console.error(err)
      alert("An error occurred while saving.")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 font-sans text-slate-900 dark:text-slate-100">
      
      <div className="max-w-4xl mx-auto">
        
        {/* --- Header & Navigation --- */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Manage Questions
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Review and edit existing questions for this quiz.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="
              inline-flex items-center justify-center gap-2
              px-4 py-2
              text-sm font-medium
              rounded-xl
              bg-white dark:bg-slate-900
              border border-slate-200 dark:border-slate-800
              hover:bg-slate-50 dark:hover:bg-slate-800
              text-slate-700 dark:text-slate-300
              shadow-sm transition-all duration-200
            "
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Dashboard
          </Link>
        </div>

        {/* --- Loading State --- */}
        {isLoading && (
          <div className="text-center py-12 text-slate-500">
            Loading questions...
          </div>
        )}

        {/* --- Empty State --- */}
        {!isLoading && questions.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-sm">
            <p className="text-slate-500 dark:text-slate-400">No questions found for this quiz.</p>
          </div>
        )}

        {/* --- Questions List --- */}
        <div className="space-y-6">
          {questions.map((q, index) => {
            const isEditing = editingId === q.id

            return (
              <div 
                key={q.id || index} 
                className={`
                  bg-white dark:bg-slate-900 
                  rounded-2xl shadow-sm border 
                  ${isEditing ? 'border-blue-400 dark:border-blue-500 shadow-md ring-4 ring-blue-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'} 
                  p-5 sm:p-7 transition-all duration-200
                `}
              >
                
                {/* --- Question Header / Edit Area --- */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
                  
                  <div className="flex-grow w-full">
                    {isEditing ? (
                      <div className="space-y-3">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Edit Question Text</label>
                        <textarea
                          value={q.text}
                          onChange={(e) => handleQuestionChange(q.id, "text", e.target.value)}
                          rows="2"
                          className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-y transition-all"
                        />
                      </div>
                    ) : (
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white leading-snug flex gap-3">
                        <span className="text-blue-600 dark:text-blue-500 shrink-0">Q{index + 1}.</span> 
                        {q.text}
                      </h3>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSave(q)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                          Save
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditingId(q.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Edit
                      </button>
                    )}
                  </div>

                </div>

                {/* Divider */}
                <div className="h-px w-full bg-slate-100 dark:bg-slate-800/50 my-4"></div>

                {/* --- Options Area --- */}
                {isEditing && (
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                    Edit Options (Select radio to set correct answer)
                  </label>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt, i) => {
                    return (
                      <div 
                        key={opt.id || i} 
                        className={`
                          flex items-center gap-3 p-3 rounded-xl border transition-all duration-200
                          ${opt.is_correct 
                            ? 'border-green-500 bg-green-50 dark:bg-green-500/10' 
                            : isEditing 
                              ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30' 
                              : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20'
                          }
                        `}
                      >
                        {isEditing && (
                          <input
                            type="radio"
                            checked={opt.is_correct}
                            onChange={() => handleCorrectSelect(q.id, i)}
                            className="w-4 h-4 text-green-600 bg-slate-100 border-slate-300 focus:ring-green-500 focus:ring-2 ml-1 cursor-pointer"
                          />
                        )}

                        {isEditing ? (
                          <input
                            value={opt.text}
                            onChange={(e) => handleOptionChange(q.id, i, e.target.value)}
                            className="w-full bg-transparent p-1 text-slate-900 dark:text-white focus:outline-none focus:border-b focus:border-blue-500 transition-colors"
                          />
                        ) : (
                          <div className="flex items-center justify-between w-full pr-2">
                            <span className="text-slate-700 dark:text-slate-300">{opt.text}</span>
                            {opt.is_correct && (
                              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}