import axios from "axios"

const API = axios.create({
  baseURL: "https://quiesy-8igi.onrender.com/"
})

export const createQuiz = (data, token) => {
  return API.post("create-quiz/", data, {
    headers: {
      Authorization: `Token ${token}`
    }
  })
}

export const getTeacherQuizzes = (token) => {
  return API.get("teacher-quizzes/", {
    headers: {
      Authorization: `Token ${token}`
    }
  })
}

// REQUEST INTERCEPTOR
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// RESPONSE INTERCEPTOR
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refresh = localStorage.getItem("refresh")

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
        return Promise.reject(err)
      }
    }

    return Promise.reject(error)
  }
)

export default API