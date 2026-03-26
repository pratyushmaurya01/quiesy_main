import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import ThemeToggle from "../components/ThemeToggle"
import API from "../api/api"
import Editor from "@monaco-editor/react"

const STATUS = {
  NOT_VISITED: "not_visited",
  NOT_ANSWERED: "not_answered",
  ANSWERED: "answered",
  MARKED_REVIEW: "marked_review"
}

export default function QuizAttempt() {
  const { quizCode } = useParams()
  const navigate = useNavigate()

  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  const [answers, setAnswers] = useState({})
  const [questionStatus, setQuestionStatus] = useState({})
  const [timeLeft, setTimeLeft] = useState(null)

  const [codeAnswers, setCodeAnswers] = useState({})
  const [codeLanguage, setCodeLanguage] = useState({})
  const [output, setOutput] = useState("")
  
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-scroll ref for question slider
  const sliderRef = useRef(null)

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
        setTimeLeft(data.time_limit ? data.time_limit * 60 : 10800)

        const initialStatus = {}
        data.questions.forEach((q, index) => {
          initialStatus[q.id] = index === 0 ? STATUS.NOT_ANSWERED : STATUS.NOT_VISITED
        })
        setQuestionStatus(initialStatus)
      } catch (err) {
        console.error("Failed to fetch questions", err)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [quizCode, navigate])

  useEffect(() => {
    if (timeLeft === null) return
    if (timeLeft <= 0) handleFinalSubmit(true)

    const timer = setInterval(() => setTimeLeft(p => p - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  // Center the active question in the slider
  useEffect(() => {
    if (sliderRef.current) {
      const activeBtn = sliderRef.current.querySelector('.active-q-btn')
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      }
    }
  }, [currentIndex])

  const currentQ = questions[currentIndex]

  const getLang = (lang) => {
    if (lang === "java") return "java"
    if (lang === "cpp") return "cpp"
    return "python" 
  }

  useEffect(() => {
    if (currentQ?.type === "coding" && codeAnswers[currentQ.id] === undefined) {
      setCodeAnswers(prev => ({
        ...prev,
        [currentQ.id]: currentQ.starter_code || ""
      }))
    }
  }, [currentQ, codeAnswers])

  const handleRunCode = async () => {
    const code = codeAnswers[currentQ.id] || ""
    const language = codeLanguage[currentQ.id] || "python"
    
    if (!currentQ.test_cases || currentQ.test_cases.length === 0) {
      setOutput("⚠️ No test cases found for this question.")
      return
    }

    setOutput("Running Test Cases...\n")
    let currentOutput = ""

    for (let i = 0; i < currentQ.test_cases.length; i++) {
      const tc = currentQ.test_cases[i]

      try {
        const res = await API.post("test-code/", {
          code,
          language,
          input: tc.input_data
        })

        const data = res.data

        const actual = (data.output || "").trim()
        const expected = (tc.expected_output || "").trim()

        if (actual === expected) {
          currentOutput += `✅ Test Case ${i + 1}: Passed\n`
        } else {
          currentOutput += `❌ Test Case ${i + 1}: Failed\n   Input: ${tc.input_data}\n   Expected: ${expected}\n   Your Output: ${actual}\n\n`
        }

      } catch (err) {
        currentOutput += `⚠️ Test Case ${i + 1}: Server Error\n`
      }
  }
    
    setOutput(currentOutput)
  }


  const saveAnswer = async () => {
    const attemptId = localStorage.getItem("attempt_id")
    setIsSaving(true)

    try {
      let bodyData = { attempt_id: attemptId, question_id: currentQ.id }

      if (currentQ.type === "coding") {
        bodyData.code = codeAnswers[currentQ.id] || ""
        bodyData.language = codeLanguage[currentQ.id] || "python"
      } else {
        const optionId = answers[currentQ.id]
        if (!optionId) {
          setIsSaving(false)
          return 
        }
        bodyData.option_id = optionId
      }

      await API.post("submit-answer/", bodyData)
      
      if (currentQ.type === "coding") {
        setOutput(prev => prev + "\n💾 Code successfully saved to database!\n")
      }
      
      setQuestionStatus(prev => ({
        ...prev,
        [currentQ.id]: STATUS.ANSWERED
      }))

    } catch (err) {
      console.error("Save failed", err)

      if (currentQ.type === "coding") {
        setOutput(prev => prev + "\n❌ Failed to save code to database.\n")
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAndNext = async () => {
    await saveAnswer()
    setOutput("") 
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(p => p + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(p => p - 1)
      setOutput("")
    }
  }


  const handleFinalSubmit = async (autoSubmit = false) => {
    if (!autoSubmit) {
      const confirmSubmit = window.confirm(
        "Are you sure you want to submit the test? You cannot change your answers after this."
      )
      if (!confirmSubmit) return
    }

    setIsSubmitting(true)
    await saveAnswer()

    const attemptId = localStorage.getItem("attempt_id")

    try {
      const res = await API.post("finish_quiz/", {
        attempt_id: attemptId
      })

      const data = res.data

      localStorage.removeItem("attempt_id")
      navigate(`/review/${data.attempt_id}`)

    } catch (err) {
      console.error("Failed to submit test", err)
      setIsSubmitting(false)
      alert("Failed to submit test. Please check your connection and try again.")
    }
  }

  const formatTime = (seconds) => {
    if (seconds === null) return "--:--"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return h > 0 
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium text-slate-500">Setting up your secure environment...</p>
      </div>
    )
  }

  const isCoding = currentQ.type === "coding"

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 overflow-hidden">

      {/* --- 1. UNIFIED TOP NAVBAR --- */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center px-4 shrink-0 z-20 shadow-sm gap-4">
        
        {/* Logo */}
        <div className="flex items-center shrink-0">
          <h1 className="text-xl md:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">QUIESY</h1>
        </div>

        {/* Central Question Slider (Nav merged!) */}
        <div className="flex-1 max-w-3xl overflow-hidden relative flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 h-11 px-2 mx-2">
          <div 
            ref={sliderRef}
            className="flex gap-1.5 overflow-x-auto w-full py-1 scrollbar-hide items-center justify-start sm:justify-center px-2"
          >
            {questions.map((q, index) => {
              const isActive = index === currentIndex
              const isAnswered = questionStatus[q.id] === STATUS.ANSWERED || answers[q.id] || (codeAnswers[q.id] && codeAnswers[q.id] !== q.starter_code)
              
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`
                    shrink-0 min-w-[34px] h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer border
                    ${isActive 
                      ? 'bg-blue-600 text-white border-blue-600 scale-105 shadow-md active-q-btn' 
                      : isAnswered 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/50' 
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700'}
                  `}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Timer & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-sm font-bold shadow-sm border ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400 animate-pulse' : 'bg-white text-slate-700 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {formatTime(timeLeft)}
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* --- 2. UNIVERSAL SPLIT PANE (Main Workspace) --- */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT PANE: Problem Description (Resizable in Desktop) */}
        <div className={`
          lg:w-[45%] lg:min-w-[30%] lg:max-w-[70%] border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 lg:resize-x 
          flex flex-col h-full bg-white dark:bg-slate-900 transition-colors overflow-y-auto relative custom-scrollbar
        `}>
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between mb-6 gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
                <span className="text-slate-400 dark:text-slate-500">Q{currentIndex + 1}.</span> Problem Statement
              </h2>
              {currentQ.marks && (
                <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-md border border-blue-100 dark:border-blue-800/50 shrink-0">
                  {currentQ.marks} Pts
                </span>
              )}
            </div>

            <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-base leading-relaxed whitespace-pre-wrap font-medium">
              {currentQ.text}
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Dynamic based on Question Type */}
        <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 min-w-0 overflow-y-auto custom-scrollbar">
          
          {isCoding ? (
            /* --- CODING UI --- */
            <>
              <div className="h-12 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center px-4 shrink-0">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Code Editor</span>
                </div>
                <select
                  value={codeLanguage[currentQ.id] || "python"}
                  onChange={(e) => setCodeLanguage(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="python">Python 3</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>

              <div className="flex-1 min-h-[300px] relative border-b border-slate-200 dark:border-slate-800">
                <Editor
                  height="100%"
                  language={getLang(codeLanguage[currentQ.id])}
                  value={codeAnswers[currentQ.id] || ""}
                  onChange={(value) => setCodeAnswers(prev => ({ ...prev, [currentQ.id]: value }))}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 15,
                    wordWrap: "on",
                    padding: { top: 16 },
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: "smooth"
                  }}
                />
              </div>

              <div className="h-64 flex flex-col shrink-0 bg-white dark:bg-slate-900">
                <div className="h-10 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center px-4 bg-slate-50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Console Output
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRunCode}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                      Run Code
                    </button>
                  </div>
                </div>
                <div className="flex-1 p-4 font-mono text-sm overflow-y-auto bg-slate-950 text-slate-300">
                  {output ? (
                    <pre className="whitespace-pre-wrap">{output}</pre>
                  ) : (
                    <span className="text-slate-600 dark:text-slate-500">{"// Output will appear here after you run the code"}</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* --- MCQ UI (Now in the Right Pane) --- */
            <div className="p-6 sm:p-10 w-full max-w-3xl mx-auto h-full flex flex-col justify-center">
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Select your answer:
              </h3>
              
              <div className="space-y-4">
                {currentQ.options.map((opt, i) => {
                  const isSelected = answers[currentQ.id] === opt.id;
                  return (
                    <label 
                      key={opt.id} 
                      className={`flex items-center gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 w-full ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-500 shadow-md transform scale-[1.01]' 
                          : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-slate-500 hover:bg-white dark:hover:bg-slate-800 shadow-sm'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-indigo-600 dark:border-indigo-400' : 'border-slate-300 dark:border-slate-600'}`}>
                        {isSelected && <div className="w-3 h-3 bg-indigo-600 dark:bg-indigo-400 rounded-full"></div>}
                      </div>
                      <input
                        type="radio"
                        name={`question-${currentQ.id}`}
                        className="hidden"
                        checked={isSelected}
                        onChange={() => setAnswers(prev => ({ ...prev, [currentQ.id]: opt.id }))}
                      />
                      <span className={`text-lg font-semibold ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-300'}`}>
                        {opt.text}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* --- 3. BOTTOM ACTION BAR --- */}
      <footer className="h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center px-4 sm:px-6 shrink-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0 || isSaving || isSubmitting}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-bold transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => handleFinalSubmit(false)}
            disabled={isSaving || isSubmitting}
            className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer ${
              isSubmitting 
                ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/40'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Submitting...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="hidden sm:inline">Submit Test</span>
              </>
            )}
          </button>

          <button
            onClick={handleSaveAndNext}
            disabled={isSaving || isSubmitting}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-2.5 rounded-lg font-bold transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                {currentIndex === questions.length - 1 ? "Save Last" : "Save & Next"}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </>
            )}
          </button>
        </div>

      </footer>
      
      {/* Hide scrollbar for the custom areas but keep functionality */}
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.5); border-radius: 20px; }
      `}} />
    </div>
  )
}