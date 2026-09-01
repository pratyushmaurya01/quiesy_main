import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { verifyEmail, resendOTP } from "../../api/api"

export default function VerifyEmail() {
    const location = useLocation()
    const navigate = useNavigate()

    const email = location.state?.email || ""

    const [otp, setOtp] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [loading, setLoading] = useState(false)
    const [resending, setResending] = useState(false)

    const handleVerify = async (e) => {
        e.preventDefault()

        setError("")
        setSuccess("")
        setLoading(true)

        try {
            await verifyEmail({
                email,
                otp
            })

            setSuccess("Email verified successfully.")

            setTimeout(() => {
                navigate("/login")
            }, 1000)
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Invalid or expired OTP."
            )
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        setError("")
        setSuccess("")
        setResending(true)

        try {
            const response = await resendOTP({ email })

            setSuccess(
                response.data?.detail ||
                "A new OTP has been sent."
            )
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to resend OTP."
            )
        } finally {
            setResending(false)
        }
    }

    if (!email) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div>
                    <p>Verification email is missing.</p>
                    <button onClick={() => navigate("/login")}>
                        Go to Login
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl">

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                        Verify Your Email
                    </h2>

                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Enter the OTP sent to
                    </p>

                    <p className="font-bold text-slate-700 dark:text-slate-200 mt-1">
                        {email}
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

                <form onSubmit={handleVerify} className="space-y-5">
                    <input
                        required
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "")
                            setOtp(value)
                        }}
                        placeholder="Enter 6-digit OTP"
                        className="w-full px-4 py-4 text-center text-2xl tracking-[0.5em] border-2 rounded-xl"
                    />

                    <button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl disabled:opacity-50"
                    >
                        {loading ? "Verifying..." : "Verify Email"}
                    </button>
                </form>

                <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="w-full mt-4 py-3 text-indigo-600 font-bold disabled:opacity-50"
                >
                    {resending ? "Sending..." : "Resend OTP"}
                </button>

                <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="w-full mt-2 py-3 text-slate-500"
                >
                    Back to Login
                </button>
            </div>
        </div>
    )
}