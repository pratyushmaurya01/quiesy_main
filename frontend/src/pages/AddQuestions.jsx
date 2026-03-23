import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"

export default function AddQuestions() {

  const { quizId } = useParams()

  const [questionCount, setQuestionCount] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)

  const [question, setQuestion] = useState({
    text: "",
    marks: 1,
    options: ["", "", "", ""],
    correctIndex: 0
  })

  useEffect(() => {
    const fetchQuizDetails = async () => {
      const token = localStorage.getItem("access")

      const res = await fetch(
        `http://127.0.0.1:8000/api/quiz/${quizId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await res.json()

      setQuestionCount(data.current_count)
      setTotalQuestions(data.num_of_qus)
    }

    fetchQuizDetails()
  }, [quizId])

  const handleChange = (e) => {
    setQuestion({
      ...question,
      [e.target.name]: e.target.value
    })
  }

  const handleOptionChange = (index, value) => {
    const newOptions = [...question.options]
    newOptions[index] = value

    setQuestion({
      ...question,
      options: newOptions
    })
  }

  const handleCorrectSelect = (index) => {
    setQuestion({
      ...question,
      correctIndex: index
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (questionCount >= totalQuestions) {
      alert("Maximum questions reached")
      return
    }

    const token = localStorage.getItem("access")

    const body = {
      quiz: quizId,
      text: question.text,
      type: "mcq",
      marks: Number(question.marks),
      options: question.options.map((opt, index) => ({
        text: opt,
        is_correct: index === question.correctIndex
      }))
    }

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
        correctIndex: 0
      })
    }
  }

  const progressPercentage =
    totalQuestions === 0 ? 0 : (questionCount / totalQuestions) * 100

    return (
      <>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex justify-center items-center p-4 sm:p-6 font-sans">

      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-200 dark:border-slate-800 p-6 sm:p-8 transition-all">
        {/* --- Header & Dashboard Link --- */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Add Questions
          </h2>

          <Link
            to="/dashboard"
            className="
              inline-flex items-center justify-center gap-2
              px-4 py-2 sm:py-2.5
              text-sm font-medium
              rounded-xl
              bg-slate-100 dark:bg-slate-800/80
              hover:bg-slate-200 dark:hover:bg-slate-700
              border border-slate-200 dark:border-slate-700
              text-slate-700 dark:text-slate-300
              transition-all duration-200 hover:shadow-sm
            "
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>

        </div>

        {/* --- Progress Section --- */}
        <div className="space-y-2 mb-8">
          <div className="flex justify-between text-sm font-medium text-slate-500 dark:text-slate-400">
            <span>Question {questionCount + 1}</span>
            <span>{questionCount} / {totalQuestions} Added</span>
          </div>

          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* --- Form Section --- */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Question Text & Marks Layout */}
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex-grow">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Question Text
              </label>
              <textarea
                name="text"
                value={question.text}
                onChange={handleChange}
                placeholder="What is the main purpose of..."
                rows="3"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 resize-y"
              />
            </div>

            <div className="w-full sm:w-32 shrink-0">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Points
              </label>
              <input
                type="number"
                name="marks"
                min="1"
                value={question.marks}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-center font-semibold"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-slate-200 dark:bg-slate-800 my-2"></div>

          {/* Options List */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Answer Options <span className="text-xs text-slate-400 font-normal ml-1">(Select the radio button for the correct answer)</span>
            </label>

            {question.options.map((opt, i) => {
              const isCorrect = question.correctIndex === i

              return (
                <div
                  key={i}
                  className={`
                    relative flex items-center gap-3 p-2 pr-4 rounded-xl border-2 transition-all duration-200
                    ${isCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-500/10'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/30 focus-within:border-blue-400 hover:border-slate-300 dark:hover:border-slate-600'
                    }
                  `}
                >
                  <div className="flex items-center justify-center pl-2">
                    <input
                      type="radio"
                      checked={isCorrect}
                      onChange={() => handleCorrectSelect(i)}
                      className="w-5 h-5 text-green-600 bg-slate-100 border-slate-300 focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-slate-800 focus:ring-2 cursor-pointer transition-all"
                    />
                  </div>

                  <input
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="w-full py-2 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                  />

                  {isCorrect && (
                    <span className="text-xs font-bold text-green-600 dark:text-green-400 absolute right-4 uppercase tracking-wider bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-md">
                      Correct
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={questionCount >= totalQuestions || totalQuestions === 0}
              className="
                w-full py-3.5 px-4
                bg-blue-600 hover:bg-blue-700
                text-white text-base font-semibold
                rounded-xl
                shadow-sm hover:shadow-md
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900
                active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:active:scale-100
                transition-all duration-200
              "
            >
              {questionCount >= totalQuestions && totalQuestions !== 0
                ? "Quiz Full"
                : "Save & Add Next Question"}
            </button>
          </div>

        </form>

      </div>
    </div>
  </>
  )
}