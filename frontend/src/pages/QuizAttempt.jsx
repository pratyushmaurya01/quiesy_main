import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import ThemeToggle from "../components/ThemeToggle"
import API from "../api/api"

// NTA Style Status Constants
const STATUS = {
  NOT_VISITED: "not_visited",
  NOT_ANSWERED: "not_answered",
  ANSWERED: "answered",
  MARKED_REVIEW: "marked_review"
}

export default function QuizAttempt() {
  const { quizCode } = useParams()
  const navigate = useNavigate()

  // State
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  
  // Maps question_id to the selected option_id (or value for subjective later)
  const [answers, setAnswers] = useState({})
  
  // Maps question_id to its NTA status (default all to NOT_VISITED)
  const [questionStatus, setQuestionStatus] = useState({})

  // Mobile Palette Toggle
  const [showPalette, setShowPalette] = useState(false)

// Start at 0, we will update it as soon as the API responds
const [timeLeft, setTimeLeft] = useState(null)


  useEffect(() => {
    const attemptId = localStorage.getItem("attempt_id")
    if (!attemptId) {
      navigate("/", { replace: true })
      return
    }


    const fetchQuestions = async () => {
      try {
        const res = await API.get(`quiz/${quizCode}/questions/`)
        const data = res.data

        setQuestions(data.questions)

        if (data.time_limit) {
          setTimeLeft(data.time_limit * 60)
        } else {
          setTimeLeft(10800)
        }

        const initialStatus = {}
        data.questions.forEach((q, index) => {
          initialStatus[q.id] =
            index === 0 ? STATUS.NOT_ANSWERED : STATUS.NOT_VISITED
        })
        setQuestionStatus(initialStatus)

      } catch (err) {
        console.error("Failed to fetch questions:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [quizCode, navigate])
  // --- 2. Timer Logic ---
  // --- 2. Timer Logic ---
  useEffect(() => {
    // Prevent the timer from starting before the API loads
    if (timeLeft === null) return 

    if (timeLeft <= 0) {
      handleFinalSubmit() // Auto-submit when time is up
      return
    }
    
    const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearInterval(timerId)
  }, [timeLeft])

  const formatTime = (seconds) => {
    if (seconds === null) return "--:--:--" // Show dashes while loading
    
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // --- 3. Handlers ---
  const handleOptionSelect = (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }))
  }

  const saveAnswerToBackend = async (questionId, optionId) => {
    const attemptId = localStorage.getItem("attempt_id")
    if (!attemptId || !optionId) return

    try {
      await fetch("http://127.0.0.1:8000/api/submit-answer/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempt_id: parseInt(attemptId),
          question_id: questionId,
          option_id: optionId
        })
      })
    } catch (err) {
      console.error("Save failed", err)
    }
  }

  const navigateToQuestion = (index) => {
    const currentQ = questions[currentIndex]
    
    // If leaving current question and it's not answered or marked, set to NOT_ANSWERED
    if (questionStatus[currentQ.id] === STATUS.NOT_VISITED) {
      setQuestionStatus(prev => ({ ...prev, [currentQ.id]: STATUS.NOT_ANSWERED }))
    }

    // Set new question status
    const newQ = questions[index]
    if (questionStatus[newQ.id] === STATUS.NOT_VISITED) {
      setQuestionStatus(prev => ({ ...prev, [newQ.id]: STATUS.NOT_ANSWERED }))
    }
    
    setCurrentIndex(index)
    setShowPalette(false) // Close mobile drawer if open
  }

  // --- NTA Action Buttons ---
  const handleSaveAndNext = async () => {
    const currentQ = questions[currentIndex]
    const selectedOption = answers[currentQ.id]

    if (selectedOption) {
      setQuestionStatus(prev => ({ ...prev, [currentQ.id]: STATUS.ANSWERED }))
      await saveAnswerToBackend(currentQ.id, selectedOption)
    } else {
      setQuestionStatus(prev => ({ ...prev, [currentQ.id]: STATUS.NOT_ANSWERED }))
    }

    if (currentIndex < questions.length - 1) {
      navigateToQuestion(currentIndex + 1)
    }
  }

  const handleMarkForReview = async () => {
    const currentQ = questions[currentIndex]
    const selectedOption = answers[currentQ.id]

    setQuestionStatus(prev => ({ ...prev, [currentQ.id]: STATUS.MARKED_REVIEW }))
    
    if (selectedOption) {
      await saveAnswerToBackend(currentQ.id, selectedOption)
    }

    if (currentIndex < questions.length - 1) {
      navigateToQuestion(currentIndex + 1)
    }
  }

  const handleClearResponse = () => {
    const currentQ = questions[currentIndex]
    const newAnswers = { ...answers }
    delete newAnswers[currentQ.id] // Remove answer
    setAnswers(newAnswers)
    setQuestionStatus(prev => ({ ...prev, [currentQ.id]: STATUS.NOT_ANSWERED }))
  }

    const handleFinalSubmit = async () => {
        // Only ask for confirmation if time hasn't run out naturally
        if (timeLeft > 0) {
        const confirmSubmit = window.confirm("Are you sure you want to submit the test? You cannot change answers after this.")
        if (!confirmSubmit) return
        }

        const attemptId = localStorage.getItem("attempt_id")
        try {
        const res = await fetch("http://127.0.0.1:8000/api/finish_quiz/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ attempt_id: attemptId })
        })
        const data = await res.json()
        

        // FIX 1: Destroy the local session
          localStorage.removeItem("attempt_id")

        // FIX 2: Replace history so they can't click 'Back'
        navigate(`/review/${data.attempt_id}`, { replace: true })
        
        } catch (err) {
        alert("Error submitting test.")
        }
    }

  // --- Render Helpers ---
  const getStatusColor = (status) => {
    switch (status) {
      case STATUS.ANSWERED: return "bg-green-600 text-white border-green-700"
      case STATUS.NOT_ANSWERED: return "bg-red-500 text-white border-red-600"
      case STATUS.MARKED_REVIEW: return "bg-purple-600 text-white border-purple-700"
      default: return "bg-slate-200 text-slate-700 border-slate-300" // NOT_VISITED
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white text-xl">Loading Exam Environment...</div>
  if (questions.length === 0) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">No questions found.</div>

  const currentQ = questions[currentIndex]

  return (
    // 🔥 Added dark mode background and text colors to the main wrapper
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
      
      {/* --- Top Navbar --- */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 px-4 sm:px-6 flex justify-between items-center shrink-0 shadow-sm z-20 relative transition-colors duration-200">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight hidden sm:block">QUIESY <span className="text-slate-400 font-normal">| Online Assessment</span></h1>
          <h1 className="text-xl font-bold tracking-tight sm:hidden">QUIESY</h1>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* 🔥 Drop the toggle right here! */}
          <ThemeToggle />

          <div className="bg-slate-900 dark:bg-black text-white px-4 py-1.5 rounded-lg font-mono font-bold text-lg shadow-inner flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {formatTime(timeLeft)}
          </div>

          <button 
            onClick={() => setShowPalette(!showPalette)}
            className="lg:hidden p-2 bg-slate-200 dark:bg-slate-800 rounded-md text-slate-700 dark:text-slate-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          </button>
        </div>
      </header>

      {/* --- Main Workspace --- */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT PANE: Active Question Area */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-white dark:bg-slate-900 m-2 sm:m-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          
          <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-t-xl shrink-0">
            <h2 className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-400">Question {currentIndex + 1}</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-3 py-1 rounded-full">+{currentQ.marks} Marks</span>
            </div>
          </div>

          <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
            <div className="text-lg mb-8 font-medium leading-relaxed">
              {currentQ.text}
            </div>

            <div className="space-y-3">
              {currentQ.options.map((opt) => {
                const isSelected = answers[currentQ.id] === opt.id
                return (
                  <label 
                    key={opt.id} 
                    className={`
                      flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                      ${isSelected 
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}
                    `}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-blue-600 dark:border-blue-400' : 'border-slate-400 dark:border-slate-500'}`}>
                      {isSelected && <div className="w-2.5 h-2.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>}
                    </div>
                    <input 
                      type="radio" 
                      name={`question-${currentQ.id}`} 
                      className="hidden"
                      checked={isSelected}
                      onChange={() => handleOptionSelect(currentQ.id, opt.id)}
                    />
                    <span className="font-medium text-base">{opt.text}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 rounded-b-xl shrink-0">
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={handleMarkForReview} className="flex-1 sm:flex-none px-4 py-2.5 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-semibold rounded-lg transition-colors text-sm sm:text-base border border-purple-200 dark:border-purple-800">
                  Mark for Review & Next
                </button>
                <button onClick={handleClearResponse} className="flex-1 sm:flex-none px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition-colors text-sm sm:text-base border border-slate-300 dark:border-slate-600 shadow-sm">
                  Clear Response
                </button>
              </div>
              <button onClick={handleSaveAndNext} className="w-full sm:w-auto px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all active:scale-95 text-sm sm:text-base">
                Save & Next
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Question Palette */}
        <div className={`
          absolute lg:relative right-0 top-0 bottom-0 w-80 bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-10 transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none
          ${showPalette ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex justify-between items-center shrink-0">
            <h3 className="font-bold">Question Palette</h3>
            <button onClick={() => setShowPalette(false)} className="lg:hidden p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-4 gap-3">
              {questions.map((q, index) => {
                const status = questionStatus[q.id] || STATUS.NOT_VISITED
                const isActive = index === currentIndex
                return (
                  <button
                    key={q.id}
                    onClick={() => navigateToQuestion(index)}
                    className={`
                      aspect-square rounded-lg flex items-center justify-center font-bold text-sm sm:text-base transition-all border-b-4 relative
                      ${getStatusColor(status)}
                      ${isActive ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900 scale-105' : 'hover:opacity-80'}
                    `}
                  >
                    {index + 1}
                    {status === STATUS.MARKED_REVIEW && answers[q.id] && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full border border-white dark:border-slate-900"></div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <button onClick={handleFinalSubmit} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-colors text-lg">
              Submit Test
            </button>
          </div>
        </div>
      </div>
    </div>
  )}