import axios from "axios"

const API = axios.create({
  baseURL: "https://quiesy-8igi.onrender.com/api/"
})

export const createQuiz = (data, token) => {
  return API.post("create-quiz/", data, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export const getTeacherQuizzes = (token) => {
  return API.get("teacher-quizzes/", {
    headers: { Authorization: `Bearer ${token}` }
  })
}

// 🔥 FIX: REQUEST INTERCEPTOR
API.interceptors.request.use((config) => {
  // Login aur Register request mein kabhi token mat bhejo
  if (!config.url.includes("login") && !config.url.includes("register")) {
    const token = localStorage.getItem("access")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// 🔥 FIX: RESPONSE INTERCEPTOR
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Agar login request khud 401 de rahi hai, toh usko refresh mat karo
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes("login")) {
      originalRequest._retry = true

      try {
        const refresh = localStorage.getItem("refresh")
        
        // Agar refresh token hi nahi hai, toh refresh fail kar do
        if (!refresh) throw new Error("No refresh token")

        const res = await axios.post(
          "https://quiesy-8igi.onrender.com/api/token/refresh/",
          { refresh }
        )

        const newAccess = res.data.access
        localStorage.setItem("access", newAccess)
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return API(originalRequest)

      } catch (err) {
        console.log("Refresh token expired, login again")
        localStorage.removeItem("access")
        localStorage.removeItem("refresh")
        window.location.href = "/login" // User ko wapas login par bhejo
        return Promise.reject(err)
      }
    }

    return Promise.reject(error)
  }
)

export default API