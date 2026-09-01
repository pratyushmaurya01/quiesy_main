import { Navigate, useLocation } from "react-router-dom"

export default function ProtectedRoute({ children }) {
    const location = useLocation()
    const accessToken = localStorage.getItem("access")
    const refreshToken = localStorage.getItem("refresh")

    if (!accessToken && !refreshToken) {
        return (
            <Navigate
                to="/login"
                state={{ from: location }}
                replace
            />
        )
    }

    return children
}