import { useEffect } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"

import Home from "./pages/Home"
import TeacherDashboard from "./pages/TeacherDashboard"
import CreateQuiz from "./pages/CreateQuiz"
import Login from "./pages/Login"
import Register from "./pages/Register"
import AddQuestions from "./pages/AddQuestions"
import EditQuiz from "./pages/EditQuiz"
import ProtectedRoute from "./components/ProtectedRoute"
import StartQuiz from "./pages/StartQuiz"
import QuizAttempt from "./pages/QuizAttempt"
import Review from "./pages/Review"
import QuizResults from "./pages/QuizResult"

function App() {
  
  // 🔥 ADDED: This runs once when the app loads to apply the saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/quiz/:quizCode/start" element={<StartQuiz/>} /> 
        <Route path="/quiz/:quizCode" element={<QuizAttempt/>} />
        <Route path="review/:attemptId" element = {<Review/>} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/create-quiz" element={<ProtectedRoute><CreateQuiz /></ProtectedRoute>} />
        <Route path="/add-questions/:quizId" element={<ProtectedRoute><AddQuestions /></ProtectedRoute>} />
        <Route path="/edit-quiz/:quizId" element={<ProtectedRoute><EditQuiz /></ProtectedRoute>} />
        <Route path="/quiz/:quizId/results"element={<ProtectedRoute> <QuizResults /> </ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App