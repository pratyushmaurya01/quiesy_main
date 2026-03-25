import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import ThemeToggle from "../components/ThemeToggle"
import API from "../api/api"

export default function AddQuestions() {
  const { quizId } = useParams()

  const [questionCount, setQuestionCount] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)

  const [type, setType] = useState("mcq")

  const [question, setQuestion] = useState({
    text: "",
    marks: 1,
    options: ["", "", "", ""],
    correctIndex: 0,
    starter_code: "",
    test_cases: [{ input_data: "", expected_output: "" }]
  })

  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        const res = await API.get(`quiz/${quizId}/`)
        const data = res.data
        setQuestionCount(data.current_count)
        setTotalQuestions(data.num_of_qus)
      } catch (error) {
        console.error("Failed to fetch quiz details", error)
      }
    }
    fetchQuizDetails()
  }, [quizId])

  const handleChange = (e) => {
    setQuestion({ ...question, [e.target.name]: e.target.value })
  }

  const handleOptionChange = (index, value) => {
    const newOptions = [...question.options]
    newOptions[index] = value
    setQuestion({ ...question, options: newOptions })
  }

  const handleCorrectSelect = (index) => {
    setQuestion({ ...question, correctIndex: index })
  }

  // 🔥 test case handlers
  const handleTestCaseChange = (index, field, value) => {
    const updated = [...question.test_cases]
    updated[index][field] = value
    setQuestion({ ...question, test_cases: updated })
  }

  const addTestCase = () => {
    setQuestion({
      ...question,
      test_cases: [...question.test_cases, { input_data: "", expected_output: "" }]
    })
  }

  const removeTestCase = (index) => {
    const updated = question.test_cases.filter((_, i) => i !== index)
    setQuestion({ ...question, test_cases: updated })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (questionCount >= totalQuestions) {
      alert("Maximum questions reached")
      return
    }

    const token = localStorage.getItem("access")
    let body = {}

    // 🔥 MCQ
    if (type === "mcq") {
      body = {
        quiz: quizId,
        text: question.text,
        type: "mcq",
        marks: Number(question.marks),
        options: question.options.map((opt, index) => ({
          text: opt,
          is_correct: index === question.correctIndex
        }))
      }
    }

    // 🔥 CODING
    if (type === "coding") {
      body = {
        quiz: quizId,
        text: question.text,
        type: "coding",
        marks: Number(question.marks),
        starter_code: question.starter_code,
        test_cases: question.test_cases
      }
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/create-question/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        setQuestionCount(prev => prev + 1)
        setQuestion({
          text: "",
          marks: 1,
          options: ["", "", "", ""],
          correctIndex: 0,
          starter_code: "",
          test_cases: [{ input_data: "", expected_output: "" }]
        })
      } else {
        alert("Failed to save question.")
      }
    } catch (error) {
      alert("Network error.")
    }
  }

  const progressPercentage = totalQuestions > 0 ? (questionCount / totalQuestions) * 100 : 0

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200 pb-20">
      
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 h-16 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Dashboard
          </Link>
          <span className="hidden sm:block text-slate-300 dark:text-slate-700">|</span>
          <span className="hidden sm:block font-medium text-slate-600 dark:text-slate-300">Question Builder</span>
        </div>
        <ThemeToggle />
      </header>

      {/* --- 2-COLUMN LAYOUT WRAPPER --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 flex flex-col lg:flex-row gap-8">
        
        {/* ========================================= */}
        {/* LEFT SIDEBAR (Sticky on Desktop)          */}
        {/* ========================================= */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6 lg:sticky lg:top-24 h-fit">
          
          {/* Progress Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4 tracking-tight">Quiz Progress</h2>
            <div className="flex justify-between items-end mb-2">
              <span className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">{questionCount}</span>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">of {totalQuestions} added</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 h-full rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            {questionCount >= totalQuestions && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-semibold rounded-xl border border-green-200 dark:border-green-800/50 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                Quiz is fully populated!
              </div>
            )}
          </div>

          {/* Question Type Selector Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4 tracking-tight">Question Type</h2>
            <div className="grid grid-cols-2 gap-3">
              
              <button
                onClick={() => setType("mcq")}
                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                  type === "mcq" 
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="font-semibold text-sm">Multiple Choice</span>
              </button>

              <button
                onClick={() => setType("coding")}
                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                  type === "coding" 
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 shadow-sm' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                <span className="font-semibold text-sm">Coding Task</span>
              </button>

            </div>
          </div>

        </div>

        {/* ========================================= */}
        {/* RIGHT CONTENT AREA (Main Form)            */}
        {/* ========================================= */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-8">
            
            <div className="mb-6 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type === 'mcq' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'}`}>
                {type === 'mcq' ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                )}
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                {type === "mcq" ? "Add MCQ Question" : "Add Coding Problem"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* COMMON FIELDS: Question Text & Marks */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Question Details</label>
                  <textarea
                    required
                    name="text"
                    value={question.text}
                    onChange={handleChange}
                    placeholder={type === "mcq" ? "What is the capital of France?" : "Write a function to reverse an array..."}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[140px] transition-colors resize-y"
                  />
                </div>

                <div className="w-1/3 min-w-[150px]">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Marks / Weightage</label>
                  <div className="relative">
                    <input
                      required
                      type="number"
                      name="marks"
                      min="1"
                      value={question.marks}
                      onChange={handleChange}
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors font-semibold"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400 font-medium">
                      pts
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100 dark:border-slate-800/60" />

              {/* 🔥 MCQ UI */}
              {type === "mcq" && (
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Answer Options & Correct Choice</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {question.options.map((opt, i) => (
                      <label 
                        key={i} 
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${question.correctIndex === i ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-500 shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'}`}
                      >
                        <div className="mt-1">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={question.correctIndex === i}
                            onChange={() => handleCorrectSelect(i)}
                            className="w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">Option {String.fromCharCode(65 + i)}</span>
                          <input
                            required
                            value={opt}
                            onChange={(e) => handleOptionChange(i, e.target.value)}
                            placeholder={`Enter option text...`}
                            className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white p-0 font-medium placeholder-slate-300 dark:placeholder-slate-600"
                          />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* 🔥 CODING UI */}
              {type === "coding" && (
                <div className="space-y-8">
                  
                  {/* Starter Code */}
                  <div>
                    <label className="flex justify-between items-end mb-2">
                      <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Starter Code</span>
                      <span className="text-xs text-slate-400">Optional</span>
                    </label>
                    <div className="rounded-xl overflow-hidden border border-slate-800 dark:border-slate-700 shadow-sm">
                      <div className="bg-slate-800 text-slate-400 px-4 py-2 text-xs font-mono flex gap-2 items-center">
                        <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-green-500"></div></div>
                        <span className="ml-2 opacity-60">main.py</span>
                      </div>
                      <textarea
                        name="starter_code"
                        value={question.starter_code}
                        onChange={handleChange}
                        placeholder="def solve(arr):&#10;    # Write your logic here&#10;    pass"
                        className="w-full px-4 py-4 bg-slate-950 text-slate-200 focus:outline-none min-h-[160px] font-mono text-sm leading-relaxed resize-y"
                      />
                    </div>
                  </div>

                  {/* Test Cases */}
                  <div>
                    <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Hidden Test Cases</label>
                      <button 
                        type="button" 
                        onClick={addTestCase}
                        className="text-xs font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        Add Case
                      </button>
                    </div>

                    <div className="space-y-4">
                      {question.test_cases.map((tc, i) => (
                        <div key={i} className="flex flex-col sm:flex-row gap-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-700 relative group">
                          
                          <div className="absolute -left-3 -top-3 w-6 h-6 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                            {i + 1}
                          </div>

                          <div className="flex-1">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block uppercase tracking-wider">Input</span>
                            <input
                              required
                              placeholder="e.g. [1, 2, 3]"
                              value={tc.input_data}
                              onChange={(e) => handleTestCaseChange(i, "input_data", e.target.value)}
                              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-sm shadow-sm"
                            />
                          </div>
                          
                          <div className="flex-1">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block uppercase tracking-wider">Expected Output</span>
                            <input
                              required
                              placeholder="e.g. 6"
                              value={tc.expected_output}
                              onChange={(e) => handleTestCaseChange(i, "expected_output", e.target.value)}
                              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-sm shadow-sm"
                            />
                          </div>

                          {question.test_cases.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => removeTestCase(i)}
                              className="sm:absolute sm:-right-3 sm:-top-3 self-end sm:self-auto bg-white dark:bg-slate-800 text-red-500 p-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Remove test case"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <hr className="border-slate-100 dark:border-slate-800/60" />

              {/* Submit Button */}
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={questionCount >= totalQuestions}
                  className={`w-full font-bold py-4 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-lg ${
                    questionCount >= totalQuestions 
                      ? "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none" 
                      : type === 'mcq' 
                        ? "bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98]"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98]"
                  }`}
                >
                  {questionCount >= totalQuestions ? (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      Quiz is Full
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                      Save & Add Next Question
                    </>
                  )}
                </button>
              </div>
              
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}