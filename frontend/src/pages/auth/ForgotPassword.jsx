import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { forgotPassword } from "../../api/api"

export default function ForgotPassword() {
    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()

        setError("")
        setSuccess("")
        setLoading(true)

        try {
            const response = await forgotPassword({ email })

            setSuccess(
                response.data?.detail ||
                "If an account exists, a reset link has been sent."
            )
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Something went wrong. Please try again."
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl">

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                        Forgot Password?
                    </h2>

                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Enter your email and we'll send you a reset link.
                    </p>
                </div>

                {error && (
                    <div className="mb-5 bg-red-50 text-red-600 p-3 rounded-xl text-center">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-5 bg-green-50 text-green-600 p-3 rounded-xl text-center">
                        {success}
                    </div>
                )}

                {!success && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="w-full px-4 py-3.5 border-2 rounded-xl"
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl disabled:opacity-50"
                        >
                            {loading ? "Sending..." : "Send Reset Link"}
                        </button>
                    </form>
                )}

                <div className="text-center mt-6">
                    <Link
                        to="/login"
                        className="text-indigo-600 font-bold"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    )
}