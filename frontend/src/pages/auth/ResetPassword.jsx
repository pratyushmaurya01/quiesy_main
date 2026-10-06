import { useState } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { resetPassword } from "../../api/api"

export default function ResetPassword() {
    const { uid, token } = useParams()
    const navigate = useNavigate()

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()

        setError("")
        setSuccess("")

        if (password !== confirmPassword) {
            setError("Passwords do not match.")
            return
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters.")
            return
        }

        setLoading(true)

        try {
            const response = await resetPassword({
                uid,
                token,
                new_password: password
            })

            setSuccess(
                response.data?.detail ||
                "Password reset successfully."
            )

            setTimeout(() => {
                navigate("/login")
            }, 1500)
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Invalid or expired reset link."
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
                        Reset Password
                    </h2>

                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Enter your new password below.
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

                <form onSubmit={handleSubmit} className="space-y-5">

                    <input
                        required
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="New password"
                        className="w-full px-4 py-3.5 border-2 rounded-xl"
                    />

                    <input
                        required
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-4 py-3.5 border-2 rounded-xl"
                    />

                    <button
                        type="submit"
                        disabled={loading || !!success}
                        className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl disabled:opacity-50"
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>

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