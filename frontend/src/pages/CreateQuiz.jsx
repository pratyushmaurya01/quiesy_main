import { useState } from "react"

export default function CreateQuiz() {
  const [form, setForm] = useState({
    title: "",
    subject: "",
    num_of_qus: "",
    time_limit: ""
  })

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const res = await fetch("http://127.0.0.1:8000/api/create-quiz/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    })

    const data = await res.json()
    console.log(data)
  }

  return (
    // Added padding (p-4) so the card doesn't touch the screen edges on small phones
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 font-sans">
      
      <form
        onSubmit={handleSubmit}
        className="
          w-full max-w-lg 
          bg-white dark:bg-slate-900 
          p-6 sm:p-8 
          rounded-2xl 
          shadow-xl shadow-slate-200/50 dark:shadow-none
          border border-slate-200 dark:border-slate-800
        "
      >
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Create New Quiz
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Fill in the details below to set up your assessment.
          </p>
        </div>

        {/* Form Inputs Container */}
        <div className="space-y-5">
          
          {/* Quiz Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Quiz Title
            </label>
            <input
              type="text"
              name="title"
              placeholder="e.g., Python Basics Midterm"
              onChange={handleChange}
              className="
                w-full px-4 py-2.5 
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Subject
            </label>
            <input
              type="text"
              name="subject"
              placeholder="e.g., Computer Science"
              onChange={handleChange}
              className="
                w-full px-4 py-2.5 
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

          {/* Side-by-side grid for numbers (stacks on mobile) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Number of Questions */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Total Questions
              </label>
              <input
                type="number"
                name="num_of_qus"
                min="1"
                placeholder="e.g., 20"
                onChange={handleChange}
                className="
                  w-full px-4 py-2.5 
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

            {/* Time Limit */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Time Limit (mins)
              </label>
              <input
                type="number"
                name="time_limit"
                min="1"
                placeholder="e.g., 45"
                onChange={handleChange}
                className="
                  w-full px-4 py-2.5 
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

        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <button
            type="submit"
            className="
              w-full py-2.5 px-4 
              bg-blue-600 hover:bg-blue-700 
              text-white text-sm font-medium 
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