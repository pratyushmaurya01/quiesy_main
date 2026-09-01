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

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        setLoading(true)
        setError("")

        try {
            await registerUser(form)

            navigate("/verify-email", {
                state: {
                    email: form.email
                }
            })
        } catch (err) {
            const data = err.response?.data

            if (data?.email) {
                setError(
                    Array.isArray(data.email)
                        ? data.email[0]
                        : data.email
                )
            } else if (data?.role) {
                setError(
                    Array.isArray(data.role)
                        ? data.role[0]
                        : data.role
                )
            } else {
                setError(
                    data?.detail ||
                    "Registration failed. Please try again."
                )
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl">

                <div className="text-center mb-8">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                        Create an Account
                    </h2>

                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Join Quiesy and get started.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm p-3.5 rounded-xl text-center font-bold">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                            Full Name
                        </label>

                        <input
                            required
                            name="name"
                            value={form.name}
                            placeholder="e.g., John Doe"
                            onChange={handleChange}
                            className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                            Email Address
                        </label>

                        <input
                            required
                            type="email"
                            name="email"
                            value={form.email}
                            placeholder="name@school.edu"
                            onChange={handleChange}
                            className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                            Account Type
                        </label>

                        <select
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                            className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                        >
                            <option value="STUDENT">Student</option>
                            <option value="TEACHER">Teacher</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                            Password
                        </label>

                        <input
                            required
                            type="password"
                            name="password"
                            value={form.password}
                            placeholder="••••••••"
                            onChange={handleChange}
                            className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:opacity-70"
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>

                </form>

                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                        Sign In
                    </Link>
                </p>

            </div>
        </div>
    )
}