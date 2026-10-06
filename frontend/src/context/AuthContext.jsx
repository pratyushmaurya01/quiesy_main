import { createContext, useContext, useEffect, useState } from "react"
import {
    getCurrentUser,
    logoutUser,
} from "../api/api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    const loadUser = async () => {
        const access = localStorage.getItem("access")
        const refresh = localStorage.getItem("refresh")

        if (!access && !refresh) {
            setUser(null)
            setLoading(false)
            return
        }

        try {
            const response = await getCurrentUser()
            setUser(response.data)
            return response.data
        } catch {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadUser()
    }, [])

    const logout = async () => {
        const refresh = localStorage.getItem("refresh")

        try {
            if (refresh) {
                await logoutUser(refresh)
            }
        } catch {
            // Even if backend logout fails,
            // frontend authentication should still be cleared.
        } finally {
            localStorage.removeItem("access")
            localStorage.removeItem("refresh")
            setUser(null)
        }
    }

    const value = {
        user,
        setUser,
        loading,
        loadUser,
        logout,
        isAuthenticated: !!user,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}