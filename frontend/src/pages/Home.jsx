import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import Navbar from "../components/Navbar" 
import Login from "./Login" 

export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const navigate = useNavigate()

  const handleLoginSuccess = () => {
    setShowLoginModal(false)
    navigate("/dashboard")
  }

  // Replace these UUIDs with actual quiz_codes from your database that you want to show as examples.
  const exampleQuizzes = [
    { title: "Python Basics & Data Structures", subject: "Programming", code: "demo-uuid-1", type: "MCQ & Coding" },
    { title: "Core React & Frontend", subject: "Web Dev", code: "demo-uuid-2", type: "Multiple Choice" }
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans transition-colors duration-200">

      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-24 pb-16 sm:pt-32 sm:pb-24 border-b border-slate-200 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/20">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
          Master Assessments with <br className="hidden sm:block"/>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-500">
            Next-Gen Tools.
          </span>
        </h1>

        <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed font-medium">
          A powerful platform designed for educators to create secure MCQs and real-time Coding challenges. Evaluate instantly, analyze deeply.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-center mb-6">
          <button
            onClick={() => setShowLoginModal(true)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer font-bold shadow-lg shadow-blue-500/30 transition-all duration-200 active:scale-95"
          >
            Login as Teacher
          </button>

          <a 
            href="#try-demo"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold transition-all duration-200 active:scale-95 cursor-pointer"
          >
            Explore Demo Quizzes
          </a>
        </div>

        {/* Register Link */}
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          New to Quiesy?{" "}
          <Link to="/register" className="text-blue-600 dark:text-blue-400 font-bold hover:underline underline-offset-4 cursor-pointer">
            Register as a New Teacher
          </Link>
        </p>

      </section>

      {/* --- DEMO QUIZZES SECTION --- */}
      <section id="try-demo" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">Experience the Platform</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            Try out our assessment engine from a student's perspective. No login required.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {exampleQuizzes.map((quiz, i) => (
            <div key={i} className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg uppercase tracking-wider">
                  {quiz.subject}
                </span>
                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                  {quiz.type}
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-6 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {quiz.title}
              </h3>
              <Link 
                to={`/quiz/${quiz.code}/start`}
                className="mt-auto cursor-pointer inline-flex items-center justify-center gap-2 w-full py-3 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl transition-all active:scale-[0.98]"
              >
                Start Demo Quiz
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section className="py-20 px-4 sm:px-6 bg-slate-100/50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">Why Choose Quiesy?</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              Built specifically for modern educators and coding bootcamps. Everything you need in one place.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Features for Teachers */}
            <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-2xl font-bold mb-6">For Teachers & Creators</h3>
              <ul className="space-y-5">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-200">Dual Assessment Modes</strong>
                    <span className="text-slate-500 dark:text-slate-400 text-sm">Create standard Multiple Choice Questions or advanced Coding Challenges with hidden test cases.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-200">Deep Analytics Dashboard</strong>
                    <span className="text-slate-500 dark:text-slate-400 text-sm">Track student performance, time taken, pass percentages, and download CSV reports instantly.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-200">Access Control</strong>
                    <span className="text-slate-500 dark:text-slate-400 text-sm">Protect your quizzes with 4-digit passwords. Toggle student review visibility on or off at any time.</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Features for Students */}
            <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <h3 className="text-2xl font-bold mb-6">For Students & Candidates</h3>
              <ul className="space-y-5">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-200">Pro Coding Environment</strong>
                    <span className="text-slate-500 dark:text-slate-400 text-sm">Write code in a VS-Code style IDE (Monaco Editor) with syntax highlighting for Python, Java, and C++.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-200">Real-Time Evaluation</strong>
                    <span className="text-slate-500 dark:text-slate-400 text-sm">Run your code against test cases inside the browser. Get instant terminal output and feedback.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-200">Distraction-Free UI</strong>
                    <span className="text-slate-500 dark:text-slate-400 text-sm">A clean, dark-mode supported split-pane layout designed to keep focus purely on solving the problem.</span>
                  </div>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-8 text-center border-t border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
        <p>© 2026 Quiesy Platform. Designed for modern learning.</p>
      </footer>

      {/* Render Login Modal conditionally */}
      {showLoginModal && (
        <Login 
          onSuccess={handleLoginSuccess} 
          onClose={() => setShowLoginModal(false)} 
        />
      )}

    </div>
  )
}