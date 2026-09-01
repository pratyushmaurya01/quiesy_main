import { useAuth } from "../../context/AuthContext"

export default function StudentDashboard() {
    const { user } = useAuth()

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Student Dashboard
                </h1>

                <p className="mt-3 text-slate-500">
                    Welcome, {user?.name}
                </p>

                <p className="mt-2 font-semibold text-indigo-600">
                    Role: {user?.role}
                </p>
            </div>
        </div>
    )
}