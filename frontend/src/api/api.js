import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1/"

const API = axios.create({
    baseURL: API_BASE_URL,
})

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("access")

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

API.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config
        const status = error.response?.status
        const url = originalRequest?.url || ""

        const isLoginRequest = url.includes("auth/login/")
        const isRefreshRequest = url.includes("auth/token/refresh/")

        if (
            status === 401 &&
            !isLoginRequest &&
            !isRefreshRequest &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true

            try {
                const refresh = localStorage.getItem("refresh")

                if (!refresh) {
                    throw new Error("No refresh token")
                }

                const response = await axios.post(
                    `${API_BASE_URL}auth/token/refresh/`,
                    {
                        refresh,
                    }
                )

                const newAccess = response.data.access
                const newRefresh = response.data.refresh

                localStorage.setItem("access", newAccess)

                if (newRefresh) {
                    localStorage.setItem("refresh", newRefresh)
                }

                originalRequest.headers.Authorization = `Bearer ${newAccess}`

                return API(originalRequest)

            } catch (refreshError) {
                localStorage.removeItem("access")
                localStorage.removeItem("refresh")

                window.location.href = "/login"

                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

export const registerUser = (data) => {
    return API.post("auth/register/", data)
}

export const loginUser = (data) => {
    return API.post("auth/login/", data)
}

export const verifyEmail = (data) => {
    return API.post("auth/verify-email/", data)
}

export const resendOTP = (data) => {
    return API.post("auth/resend-otp/", data)
}

export const forgotPassword = (data) => {
    return API.post("auth/forgot-password/", data)
}

export const resetPassword = (data) => {
    return API.post("auth/reset-password/", data)
}

export const getCurrentUser = () => {
    return API.get("auth/me/")
}

export const refreshAccessToken = (refresh) => {
    return axios.post(
        `${API_BASE_URL}auth/token/refresh/`,
        { refresh }
    )
}

export const logoutUser = (refresh) => {
    return API.post(
        "auth/logout/",
        { refresh }
    )
}

export const createQuiz = (data, token) => {
    return API.post("../create-quiz/", data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
}

export const getTeacherQuizzes = (token) => {
    return API.get("../teacher-quizzes/", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
}

export default API