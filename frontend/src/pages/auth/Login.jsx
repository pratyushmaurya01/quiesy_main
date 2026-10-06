import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { loginUser } from "../../api/api"
import { useAuth } from "../../context/AuthContext"

export default function Login({ onSuccess, onClose }) {
    const { loadUser } = useAuth()

    const [form, setForm] = useState({
        email: "",
        password: ""
    })

    const [fieldErrors, setFieldErrors] = useState({})
    const [generalError, setGeneralError] = useState("")
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const updated = { ...prev }
                delete updated[name]
                return updated
            })
        }
        if (generalError) setGeneralError("")
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setFieldErrors({})
        setGeneralError("")

        if (!form.password) {
            setFieldErrors({ password: "Password is required." })
            return
        }

        setLoading(true)

        try {
            const response = await loginUser(form)
            const { access, refresh } = response.data

            localStorage.setItem("access", access)
            localStorage.setItem("refresh", refresh)

            const user = await loadUser()

            if (onSuccess) {
                onSuccess()
            }

            if (user?.role === "STUDENT") {
                navigate("/student-dashboard")
            } else if (user?.role === "ADMIN") {
                navigate("/admin")
            } else if (user?.role === "TEACHER") {
                navigate("/dashboard")
            } else {
                setGeneralError("Unknown user role assigned.")
            }

        } catch (err) {
            const status = err.response?.status
            const data = err.response?.data
            const detail = data?.detail

            if (status === 403) {
                navigate("/verify-email", {
                    state: {
                        email: form.email,
                        message: "Please verify your email before logging in."
                    }
                })
                return
            }

            if (status === 401) {
                setGeneralError(detail || "Invalid email or password. Please try again.")
                return
            }

            if (data && typeof data === "object") {
                const errors = {}
                Object.keys(data).forEach((key) => {
                    if (key === "detail" || key === "non_field_errors") {
                        setGeneralError(Array.isArray(data[key]) ? data[key][0] : data[key])
                    } else {
                        errors[key] = Array.isArray(data[key]) ? data[key][0] : data[key]
                    }
                })
                if (Object.keys(errors).length > 0) {
                    setFieldErrors(errors)
                }
            } else {
                setGeneralError("Unable to connect to server. Please try again.")
            }
        } finally {
            setLoading(false)
        }
    }

    const isModal = Boolean(onClose)

    return (
        <div className={isModal ? "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" : "min-h-screen flex items-center justify-center bg-[#f7f9fb] dark:bg-[#0b111e] p-4 sm:p-6 transition-colors"}>
            
            {!isModal && (
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/5 dark:bg-blue-600/10 rounded-full blur-3xl"></div>
                </div>
            )}

            <div className="relative w-full max-w-[420px] bg-white dark:bg-[#131b2e] border border-slate-200/80 dark:border-slate-800/80 p-8 sm:p-9 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none">

                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                <div className="text-center mb-7">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4 border border-blue-100 dark:border-blue-800/40">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Welcome back
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                        Sign in to access your Quiesy exams and quizzes
                    </p>
                </div>

                {generalError && (
                    <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs sm:text-sm font-medium">
                        <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{generalError}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                            Email Address
                        </label>
                        <input
                            required
                            type="email"
                            name="email"
                            value={form.email}
                            placeholder="name@domain.com"
                            onChange={handleChange}
                            className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 transition-all focus:outline-none focus:ring-2 ${
                                fieldErrors.email
                                    ? "border-red-400 focus:ring-red-400/30"
                                    : "border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20"
                            }`}
                        />
                        {fieldErrors.email && (
                            <p className="mt-1 text-xs text-red-500 dark:text-red-400 font-medium">
                                ⚠ {fieldErrors.email}
                            </p>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                                Password
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-[11px] text-[#004ac6] dark:text-blue-400 font-medium hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <input
                                required
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={form.password}
                                placeholder="••••••••"
                                onChange={handleChange}
                                className={`w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/60 border rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 transition-all focus:outline-none focus:ring-2 ${
                                    fieldErrors.password
                                        ? "border-red-400 focus:ring-red-400/30"
                                        : "border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20"
                                }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                            >
                                {showPassword ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {fieldErrors.password && (
                            <p className="mt-1 text-xs text-red-500 dark:text-red-400 font-medium">
                                ⚠ {fieldErrors.password}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-3 py-2.5 px-4 bg-[#004ac6] hover:bg-[#003ea8] text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-500/20 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Authenticating...</span>
                            </>
                        ) : (
                            <span>Sign In</span>
                        )}
                    </button>
                </form>

                <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
                    Don't have an account?{" "}
                    <Link
                        to="/register"
                        className="text-[#004ac6] dark:text-blue-400 font-semibold hover:underline"
                    >
                        Create an Account
                    </Link>
                </p>

            </div>
        </div>
    )
}