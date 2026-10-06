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
        <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb] dark:bg-[#0b111e] p-4 sm:p-6 transition-colors">
            <div className="relative w-full max-w-[420px] bg-white dark:bg-[#131b2e] border border-slate-200/80 dark:border-slate-800/80 p-8 sm:p-9 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none">

                <div className="text-center mb-7">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4 border border-blue-100 dark:border-blue-800/40">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Verify Your Email
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                        Enter the 6-digit OTP sent to
                    </p>

                    <p className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                        {email}
                    </p>
                </div>

                {error && (
                    <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs sm:text-sm font-medium">
                        <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-medium">
                        <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{success}</span>
                    </div>
                )}

                <form onSubmit={handleVerify} className="space-y-4">
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
                        placeholder="••••••"
                        className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />

                    <button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className="w-full py-2.5 px-4 bg-[#004ac6] hover:bg-[#003ea8] text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-500/20 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                        {loading ? "Verifying..." : "Verify & Continue"}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                        className="text-xs font-semibold text-[#004ac6] dark:text-blue-400 hover:underline disabled:opacity-50 cursor-pointer"
                    >
                        {resending ? "Sending OTP..." : "Didn't receive code? Resend OTP"}
                    </button>
                </div>

                <div className="text-center mt-3">
                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    >
                        ← Back to Login
                    </button>
                </div>
            </div>
        </div>

    )
}