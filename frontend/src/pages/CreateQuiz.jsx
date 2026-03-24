import { useState } from "react"
import { useNavigate , Link} from "react-router-dom"
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

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm({
      ...form,
      [name]: value
    })
  }


  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const res = await API.post("create-quiz/", form)
      const data = res.data

      console.log("CREATE QUIZ:", data)

      navigate(`/add-questions/${data.id}`)

    } catch (err) {
      console.error(err)
      alert("Quiz creation failed")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      
      <form
        onSubmit={handleSubmit}
        className="
          w-full max-w-xl 
          bg-white dark:bg-slate-900 
          p-6 sm:p-10 
          rounded-2xl 
          shadow-xl shadow-slate-200/40 dark:shadow-none 
          border border-slate-200 dark:border-slate-800
        "
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-5 mb-8">
  
          {/* Left Side: Title & Description */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Create New Quiz
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Fill in the details below to set up your new assessment.
            </p>
          </div>

          {/* Right Side: Back Button */}
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
              shrink-0
            "
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>

        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Quiz Title
            </label>
            <input
              name="title"
              placeholder="e.g., Midterm Examination"
              onChange={handleChange}
              className="
                w-full px-4 py-3 
                bg-slate-50 dark:bg-slate-800/50 
                border border-slate-300 dark:border-slate-700 
                rounded-lg 
                text-slate-900 dark:text-white 
                placeholder-slate-400 dark:placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                transition-all duration-200
              "
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Subject
            </label>
            <input
              name="subject"
              placeholder="e.g., Advanced Mathematics"
              onChange={handleChange}
              className="
                w-full px-4 py-3 
                bg-slate-50 dark:bg-slate-800/50 
                border border-slate-300 dark:border-slate-700 
                rounded-lg 
                text-slate-900 dark:text-white 
                placeholder-slate-400 dark:placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                transition-all duration-200
              "
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              rows="3"
              placeholder="Brief instructions or summary of the quiz..."
              onChange={handleChange}
              className="
                w-full px-4 py-3 
                bg-slate-50 dark:bg-slate-800/50 
                border border-slate-300 dark:border-slate-700 
                rounded-lg 
                text-slate-900 dark:text-white 
                placeholder-slate-400 dark:placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                transition-all duration-200
                resize-y
              "
            />
          </div>

          {/* Two-Column Grid (Stacks on mobile) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Total Questions
              </label>
              <input
                type="number"
                min="1"
                name="num_of_qus"
                placeholder="e.g., 25"
                onChange={handleChange}
                className="
                  w-full px-4 py-3 
                  bg-slate-50 dark:bg-slate-800/50 
                  border border-slate-300 dark:border-slate-700 
                  rounded-lg 
                  text-slate-900 dark:text-white 
                  placeholder-slate-400 dark:placeholder-slate-500
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                  transition-all duration-200
                "
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Time Limit (Minutes)
              </label>
              <input
                type="number"
                min="1"
                name="time_limit"
                placeholder="e.g., 60"
                onChange={handleChange}
                className="
                  w-full px-4 py-3 
                  bg-slate-50 dark:bg-slate-800/50 
                  border border-slate-300 dark:border-slate-700 
                  rounded-lg 
                  text-slate-900 dark:text-white 
                  placeholder-slate-400 dark:placeholder-slate-500
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                  transition-all duration-200
                "
              />
            </div>
          </div>

          {/* Optional Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Quiz Password <span className="text-slate-400 dark:text-slate-500 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              name="password"
              placeholder="Leave blank for open access"
              onChange={handleChange}
              className="
                w-full px-4 py-3 
                bg-slate-50 dark:bg-slate-800/50 
                border border-slate-300 dark:border-slate-700 
                rounded-lg 
                text-slate-900 dark:text-white 
                placeholder-slate-400 dark:placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                transition-all duration-200
              "
            />
          </div>

        </div>

        {/* Submit Button */}
        <div className="mt-10">
          <button
            type="submit"
            className="
              w-full py-3.5 px-4 
              bg-blue-600 hover:bg-blue-700 
              text-white text-base font-semibold 
              rounded-lg 
              shadow-sm hover:shadow-md
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900
              transition-all duration-200
            "
          >
            Create Quiz
          </button>
        </div>

      </form>
    </div>
  )
}