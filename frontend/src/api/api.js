import axios from "axios"

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/"
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