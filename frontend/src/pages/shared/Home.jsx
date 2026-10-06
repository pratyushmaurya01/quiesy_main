import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "../../components/Navbar" 
import Login from "../auth/Login" 
import { useAuth } from "../../context/AuthContext"

export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [exitDestination, setExitDestination] = useState(null)
  
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  // Handle smooth page transitions
  const handleNavigate = (path) => {
    setIsExiting(true)
    setExitDestination(path)
  }

  // Effect to navigate after exit animation completes
  useEffect(() => {
    if (isExiting && exitDestination) {
      const timer = setTimeout(() => {
        navigate(exitDestination)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isExiting, exitDestination, navigate])

  const handleAuthAction = () => {
    if (isAuthenticated) {
      handleNavigate(user?.role === "STUDENT" ? "/student-dashboard" : "/dashboard")
    } else {
      setShowLoginModal(true)
    }
  }

  const handleLoginSuccess = () => {
    setShowLoginModal(false)
    handleNavigate(user?.role === "STUDENT" ? "/student-dashboard" : "/dashboard")
  }

  const customEasing = [0.16, 1, 0.3, 1]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      }
    },
    exit: { 
      opacity: 0, 
      transition: { duration: 0.3, ease: customEasing } 
    }
  }

  const headerVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { duration: 0.6, ease: customEasing } 
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { duration: 0.8, ease: customEasing } 
    }
  }

  const buttonGroupVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1, 
      transition: { duration: 0.8, ease: customEasing } 
    }
  }

  return (
    <AnimatePresence mode="wait">
      {!isExiting && (
        <motion.div 
          key="landing"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="min-h-screen bg-slate-50 dark:bg-[#141518] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200"
        >

          <motion.div variants={headerVariants}>
            <Navbar onSignInClick={() => setShowLoginModal(true)} />
          </motion.div>

          {/* --- HERO SECTION --- */}
          <section className="relative flex flex-col items-center justify-center text-center px-4 sm:px-6 min-h-screen border-b border-slate-200 dark:border-slate-800/50 overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.h1 variants={itemVariants} className="relative z-10 text-5xl sm:text-6xl md:text-7xl font-black tracking-tight mb-6 leading-tight max-w-5xl mx-auto text-slate-900 dark:text-white">
              Master Assessments with <br className="hidden sm:block"/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 drop-shadow-[0_0_30px_rgba(37,99,235,0.2)]">
                Next-Gen Tools.
              </span>
            </motion.h1>

            <motion.p variants={itemVariants} className="relative z-10 text-slate-600 dark:text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              A powerful platform designed for educators. Create secure MCQs, execute real-time coding challenges, and monitor exams with live proctoring.
            </motion.p>

            {/* Action Buttons */}
            <motion.div variants={buttonGroupVariants} className="relative z-10 flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto justify-center mb-8">
              <button
                onClick={handleAuthAction}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 text-white font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:-translate-y-1 transition-all duration-300 active:scale-[0.97]"
              >
                {isAuthenticated ? "Go to Dashboard" : "Login as Teacher / Student"}
              </button>
            </motion.div>

            {/* Register Link */}
            {!isAuthenticated && (
              <motion.p variants={itemVariants} className="relative z-10 text-slate-600 dark:text-slate-500 text-sm font-medium">
                New to Quiesy?{" "}
                <Link to="/register" className="text-blue-600 dark:text-blue-400 font-bold hover:text-blue-700 dark:hover:text-blue-300 hover:underline underline-offset-4 transition-colors">
                  Register as a Teacher / Student
                </Link>
              </motion.p>
            )}
            
            {/* Scroll Indicator */}
            <motion.div variants={itemVariants} className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50 dark:opacity-70">
                <svg className="w-6 h-6 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            </motion.div>
          </section>

          {/* --- THE TEACHER'S JOURNEY --- */}
          <section className="py-24 px-4 sm:px-6 bg-white dark:bg-[#141518] border-b border-slate-200 dark:border-slate-800/50 relative">
            <div className="max-w-7xl mx-auto relative z-10">
              <motion.div variants={itemVariants} className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">For Educators: Complete Control</h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg max-w-3xl mx-auto">
                  From AI-assisted question generation to real-time proctoring, Quiesy gives you the tools to create, monitor, and analyze exams like never before.
                </p>
              </motion.div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: "1. Build Your Question Bank",
                    desc: "Create standard MCQs or advanced coding challenges with hidden test cases. Use AI to instantly generate high-quality questions for any topic.",
                    icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
                    color: "blue"
                  },
                  {
                    title: "2. Configure Quizzes",
                    desc: "Assemble quizzes from your bank. Set time limits, passwords, and toggle question/option shuffling to prevent cheating across students.",
                    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
                    color: "purple"
                  },
                  {
                    title: "3. Live Proctoring Cockpit",
                    desc: "Monitor active students in real-time via WebSockets. Get instant alerts when a student switches tabs. After 3 strikes, the system auto-locks the exam.",
                    icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
                    color: "red"
                  },
                  {
                    title: "4. Deep Analytics",
                    desc: "Review overall performance, view question-level pass rates, and download comprehensive CSV reports the moment the exam is evaluated.",
                    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                    color: "green"
                  }
                ].map((item, idx) => (
                  <motion.div key={idx} variants={itemVariants} className="bg-slate-50 dark:bg-[#1A1C20] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
                    <div className={`w-12 h-12 bg-${item.color}-100 dark:bg-${item.color}-500/10 text-${item.color}-600 dark:text-${item.color}-400 rounded-xl flex items-center justify-center mb-5`}>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold mb-3 text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* --- THE STUDENT'S EXPERIENCE --- */}
          <section className="py-24 px-4 sm:px-6 bg-slate-50 dark:bg-[#1A1C20] border-b border-slate-200 dark:border-slate-800/50 relative">
            <div className="max-w-7xl mx-auto relative z-10">
              <motion.div variants={itemVariants} className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">For Students: Frictionless & Professional</h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg max-w-3xl mx-auto">
                  A distraction-free, professional environment designed specifically to let students focus purely on solving the problems.
                </p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-8">
                <motion.div variants={itemVariants} className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <span className="text-2xl font-black font-mono tracking-widest">#</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Frictionless Join</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-xs">
                    No complex onboarding. Students simply enter a unique 6-character Quiz Code and an optional password to instantly enter the exam lobby.
                  </p>
                </motion.div>

                <motion.div variants={itemVariants} className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Pro Coding IDE</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-xs">
                    Write code in a VS-Code style split-pane Monaco Editor. Supports Python, Java, and C++ with full syntax highlighting and smart indentation.
                  </p>
                </motion.div>

                <motion.div variants={itemVariants} className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Real-Time Evaluation</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-xs">
                    Click "Run Code" to instantly execute solutions against sample test cases in the cloud, returning actual terminal output and execution metrics.
                  </p>
                </motion.div>
              </div>
            </div>
          </section>

          {/* --- THE TECH STACK / ECOSYSTEM SECTION --- */}
          <section className="py-24 px-4 sm:px-6 bg-slate-100 dark:bg-[#141518] border-b border-slate-200 dark:border-slate-800/50 relative">
            <div className="max-w-7xl mx-auto relative z-10">
              <motion.div variants={itemVariants} className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">Powered by Pratyush Maurya</h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                  Quiesy's backend architecture is built to handle massive concurrency, async job processing, and secure sandboxing.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#1A1C20] border border-slate-200 dark:border-slate-800 p-8 rounded-3xl transition-all duration-500 group hover:border-slate-300 dark:hover:border-slate-600">
                  <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">Django Channels & Redis</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    Uses ASGI and WebSockets for full-duplex communication. Redis acts as a real-time message bus to broadcast instant events (like tab switches) from students directly to the teacher's dashboard without polling.
                  </p>
                </div>

                <div className="bg-white dark:bg-[#1A1C20] border border-slate-200 dark:border-slate-800 p-8 rounded-3xl transition-all duration-500 group hover:border-slate-300 dark:hover:border-slate-600">
                  <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">Celery Distributed Queue</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    Heavy tasks, like executing complex code submissions against dozens of hidden test cases, are offloaded to Celery background workers. This ensures the main web server never blocks.
                  </p>
                </div>

                <div className="bg-white dark:bg-[#1A1C20] border border-slate-200 dark:border-slate-800 p-8 rounded-3xl transition-all duration-500 group hover:border-slate-300 dark:hover:border-slate-600">
                  <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">Judge0 & PostgreSQL</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    Code is securely executed inside isolated Judge0 sandboxes. All data, from dynamic JSON answers to immutable question versions, is robustly stored in a relational PostgreSQL database.
                  </p>
                </div>
              </motion.div>
            </div>
          </section>

          {/* --- FOOTER --- */}
          <footer className="py-10 text-center border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#141518] text-slate-500 text-sm">
            <p className="font-medium tracking-wide">© 2026 Quiesy Platform. Engineered for excellence.</p>
          </footer>

          {/* Render Login Modal conditionally */}
          {showLoginModal && (
            <Login 
              onSuccess={handleLoginSuccess} 
              onClose={() => setShowLoginModal(false)} 
            />
          )}

        </motion.div>
      )}
    </AnimatePresence>
  )
}