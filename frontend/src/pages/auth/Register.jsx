import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { registerUser } from "../../api/api"

export default function Register() {
    const navigate = useNavigate()

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "STUDENT"
    })

    const [fieldErrors, setFieldErrors] = useState({})
    const [generalError, setGeneralError] = useState("")
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
        // Clear field error on change
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

        // Frontend pre-check for password length
        if (form.password.length < 8) {
            setFieldErrors(prev => ({
                ...prev,
                password: "Password must be at least 8 characters long."
            }))
            return
        }

        setLoading(true)

        try {
            await registerUser(form)
            navigate("/verify-email", {
                state: { email: form.email }
            })
        } catch (err) {
            const data = err.response?.data

            if (data && typeof data === "object") {
                const errors = {}
                Object.keys(data).forEach((key) => {
                    if (key === "detail" || key === "non_field_errors") {
                        setGeneralError(
                            Array.isArray(data[key]) ? data[key][0] : data[key]
                        )
                    } else {
                        errors[key] = Array.isArray(data[key])
                            ? data[key][0]
                            : data[key]
                    }
                })

                if (Object.keys(errors).length > 0) {
                    setFieldErrors(errors)
                } else if (!generalError && !data.detail) {
                    setGeneralError("Registration failed. Please check your details.")
                }
            } else {
                setGeneralError("Network error. Please make sure the server is reachable.")
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb] dark:bg-[#0b111e] p-4 sm:p-6 transition-colors">
            {/* Background subtle radial glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/5 dark:bg-blue-600/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-[440px] bg-white dark:bg-[#131b2e] border border-slate-200/80 dark:border-slate-800/80 p-8 sm:p-9 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none">
                
                {/* Header with App Logo & Title */}
                <div className="text-center mb-7">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4 border border-blue-100 dark:border-blue-800/40">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Create your account
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                        Start testing and managing quizzes on Quiesy
                    </p>
                </div>

                {/* General Top Error Alert */}
                {generalError && (
                    <div className="mb-6 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs sm:text-sm font-medium">
                        <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{generalError}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Role Selector Tabs */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                            I am a
                        </label>
                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                            <button
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, role: "STUDENT" }))}
                                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                                    form.role === "STUDENT"
                                        ? "bg-white dark:bg-[#004ac6] text-blue-600 dark:text-white shadow-sm"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                }`}
                            >
                                🎓 Student
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, role: "TEACHER" }))}
                                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                                    form.role === "TEACHER"
                                        ? "bg-white dark:bg-[#004ac6] text-blue-600 dark:text-white shadow-sm"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                }`}
                            >
                                👨‍🏫 Teacher
                            </button>
                        </div>
                    </div>

                    {/* Full Name */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                            Full Name
                        </label>
                        <input
                            required
                            type="text"
                            name="name"
                            value={form.name}
                            placeholder="John Doe"
                            onChange={handleChange}
                            className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 transition-all focus:outline-none focus:ring-2 ${
                                fieldErrors.name
                                    ? "border-red-400 focus:ring-red-400/30"
                                    : "border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20"
                            }`}
                        />
                        {fieldErrors.name && (
                            <p className="mt-1 text-xs text-red-500 dark:text-red-400 font-medium">
                                ⚠ {fieldErrors.name}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                            Email Address
                        </label>
                        <input
                            required
                            type="email"
                            name="email"
                            value={form.email}
                            placeholder="you@domain.com"
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

                    {/* Password with Eye Toggle */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                                Password
                            </label>
                            <span className="text-[11px] text-slate-400">Min 8 characters</span>
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
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
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

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-3 py-2.5 px-4 bg-[#004ac6] hover:bg-[#003ea8] text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-500/20 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Creating Account...</span>
                            </>
                        ) : (
                            <span>Create Account</span>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        className="text-[#004ac6] dark:text-blue-400 font-semibold hover:underline"
                    >
                        Sign In
                    </Link>
                </p>

            </div>
        </div>
    )
}