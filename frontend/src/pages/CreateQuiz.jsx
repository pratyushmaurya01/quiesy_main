import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import API from "../api/api"

export default function CreateQuiz() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: "",
    subject: "",
    description: "",
    num_of_qus: "",
    time_limit: "",
    password: ""
  })
  
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({
      ...form,
      [name]: value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await API.post("create-quiz/", form)
      const data = res.data
      navigate(`/add-questions/${data.id}`)
    } catch (err) {
      console.error(err)
      alert("Quiz creation failed. Please check your inputs.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-start sm:items-center justify-center p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-200">
      
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 p-6 sm:p-10 md:p-12 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 transition-all">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-10 border-b border-slate-100 dark:border-slate-800 pb-6">
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl items-center justify-center border border-blue-100 dark:border-blue-800/50">
              <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Create Assessment
              </h2>
              <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400 mt-1">
                Configure your new quiz details below.
              </p>
            </div>
          </div>

          <Link
            to="/dashboard"
            className="group flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all duration-200 shrink-0 border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Dashboard
          </Link>

        </div>

        {/* --- Wide Form Section --- */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Row 1: Title & Subject (Side by Side on Large Screens) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                Quiz Title
              </label>
              <input
                required
                name="title"
                placeholder="e.g., Midterm Examination"
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                Subject
              </label>
              <input
                required
                name="subject"
                placeholder="e.g., Advanced Mathematics"
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all duration-200"
              />
            </div>
          </div>

          {/* Row 2: Full Width Description */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
              Description / Instructions
            </label>
            <textarea
              name="description"
              rows="3"
              placeholder="Provide brief instructions or summary of the quiz for your students..."
              onChange={handleChange}
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all duration-200 resize-y"
            />
          </div>

          {/* Row 3: Questions, Time & Password (3-Column Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
            
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                Total Questions
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <input
                  required
                  type="number"
                  min="1"
                  name="num_of_qus"
                  placeholder="e.g., 25"
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                Time Limit (Mins)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <input
                  required
                  type="number"
                  min="1"
                  name="time_limit"
                  placeholder="e.g., 60"
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                <span>Quiz Password</span>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">Optional</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <input
                  type="text"
                  maxLength="8"
                  name="password"
                  placeholder="Leave empty for open"
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold placeholder-slate-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-500 transition-all"
                />
              </div>
            </div>

          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* --- Footer & Submit Button --- */}
          <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 pt-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              You can add questions in the next step.
            </p>
            <button
              type="submit"
              disabled={loading}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 py-4 px-10 rounded-xl font-extrabold text-white text-base shadow-lg transition-all active:scale-[0.98] ${
                loading 
                  ? 'bg-blue-400 cursor-wait' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30 hover:shadow-blue-600/50'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Initializing...
                </>
              ) : (
                <>
                  Continue to Add Questions
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}