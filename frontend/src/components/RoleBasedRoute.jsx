import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function RoleBasedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth()

    if (loading) {
        return <div>Loading...</div>
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />
    }

    return children
}