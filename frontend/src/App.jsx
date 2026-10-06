import { useEffect } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"

import Home from "./pages/shared/Home"

import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"
import VerifyEmail from "./pages/auth/VerifyEmail"
import ForgotPassword from "./pages/auth/ForgotPassword"
import ResetPassword from "./pages/auth/ResetPassword"

import TeacherDashboard from "./pages/teacher/TeacherDashboard"
import CreateQuiz from "./pages/teacher/CreateQuiz"
import AddQuestions from "./pages/teacher/AddQuestions"
import EditQuiz from "./pages/teacher/EditQuiz"
import QuestionBank from "./pages/teacher/QuestionBank"
import CreateQuestion from "./pages/teacher/CreateQuestion"

import StudentDashboard from "./pages/student/StudentDashboard"
import ExamInstructions from "./pages/student/ExamInstructions"
import AdminDashboard from "./pages/admin/AdminDashboard"

import StartQuiz from "./pages/shared/StartQuiz"
import QuizAttempt from "./pages/shared/QuizAttempt"
import Review from "./pages/shared/Review"
import QuizResults from "./pages/shared/QuizResult"
import LiveProctor from "./pages/teacher/LiveProctor"

import RoleBasedRoute from "./components/RoleBasedRoute"


function App() {
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme")

        if (
            savedTheme === "dark" ||
            (
                !savedTheme &&
                window.matchMedia("(prefers-color-scheme: dark)").matches
            )
        ) {
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

                {/* Authentication Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route
                    path="/reset-password/:uid/:token"
                    element={<ResetPassword />}
                />

                {/* Public Quiz Routes */}
                <Route
                    path="/quiz/:quizCode/start"
                    element={<StartQuiz />}
                />

                <Route
                    path="/quiz/:quizCode"
                    element={<QuizAttempt />}
                />

                <Route
                    path="/review/:attemptId"
                    element={<Review />}
                />

                {/* Teacher Routes */}
                <Route
                    path="/dashboard"
                    element={
                        <RoleBasedRoute allowedRoles={["TEACHER"]}>
                            <TeacherDashboard />
                        </RoleBasedRoute>
                    }
                />

                <Route
                    path="/create-quiz"
                    element={
                        <RoleBasedRoute allowedRoles={["TEACHER"]}>
                            <CreateQuiz />
                        </RoleBasedRoute>
                    }
                />

                <Route
                    path="/add-questions"
                    element={
                        <RoleBasedRoute allowedRoles={["TEACHER"]}>
                            <AddQuestions />
                        </RoleBasedRoute>
                    }
                />

                <Route
                    path="/add-questions/:quizId"
                    element={
                        <RoleBasedRoute allowedRoles={["TEACHER"]}>
                            <AddQuestions />
                        </RoleBasedRoute>
                    }
                />

                <Route
                    path="/edit-quiz/:quizId"
                    element={
                        <RoleBasedRoute allowedRoles={["TEACHER"]}>
                            <EditQuiz />
                        </RoleBasedRoute>
                    }
                />

                <Route
                    path="/quiz/:quizId/results"
                    element={
                        <RoleBasedRoute allowedRoles={["TEACHER"]}>
                            <QuizResults />
                        </RoleBasedRoute>
                    }
                />

                <Route
                    path="/quiz/:quizId/live-proctor"
                    element={
                        <RoleBasedRoute allowedRoles={["TEACHER"]}>
                            <LiveProctor />
                        </RoleBasedRoute>
                    }
                />


                <Route
                    path="/question-bank"
                    element={
                        <RoleBasedRoute allowedRoles={["TEACHER"]}>
                            <QuestionBank />
                        </RoleBasedRoute>
                    }
                />

                <Route
                    path="/create-question"
                    element={
                        <RoleBasedRoute allowedRoles={["TEACHER"]}>
                            <CreateQuestion />
                        </RoleBasedRoute>
                    }
                />

                {/* Student Routes */}
                <Route
                    path="/student-dashboard"
                    element={
                        <RoleBasedRoute allowedRoles={["STUDENT"]}>
                            <StudentDashboard />
                        </RoleBasedRoute>
                    }
                />

                <Route
                    path="/exam/:quizCode/instructions"
                    element={
                        <RoleBasedRoute allowedRoles={["STUDENT"]}>
                            <ExamInstructions />
                        </RoleBasedRoute>
                    }
                />

                {/* Admin Routes */}
                <Route
                    path="/admin"
                    element={
                        <RoleBasedRoute allowedRoles={["ADMIN"]}>
                            <AdminDashboard />
                        </RoleBasedRoute>
                    }
                />

            </Routes>
        </BrowserRouter>
    )
}

export default App