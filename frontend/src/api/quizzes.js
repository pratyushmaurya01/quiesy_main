import API from "./api"

export const getQuestions = (params = {}) => {
    return API.get("quizzes/questions/", {
        params,
    })
}

export const getQuestion = (id) => {
    return API.get(`quizzes/questions/${id}/`)
}

export const createQuestion = (data) => {
    return API.post("quizzes/questions/", data)
}

export const updateQuestion = (id, data) => {
    return API.patch(`quizzes/questions/${id}/`, data)
}

export const deactivateQuestion = (id) => {
    return API.delete(`quizzes/questions/${id}/`)
}

export const getQuestionVersions = () => {
    return API.get("quizzes/question-versions/")
}

export const createQuiz = (data) => {
    return API.post("quizzes/quizzes/", data)
}

export const getQuiz = (id) => {
    return API.get(`quizzes/quizzes/${id}/`)
}

export const getQuizzes = () => {
    return API.get("teacher-quizzes/")
}

export const getQuizQuestions = (quizId) => {
    return API.get(`quiz/${quizId}/questions-list/`)
}

export const getQuizQuestionsByCode = (quizCode) => {
    return API.get(`quiz/${quizCode}/questions/`)
}

export const getQuizResults = (quizId) => {
    return API.get(`quiz/${quizId}/results/`)
}

export const toggleQuizReview = (quizId, reviewOn) => {
    return API.post(`quiz/${quizId}/toggle-review/`, {
        review_on: reviewOn,
    })
}

export const deleteQuiz = (quizId) => {
    return API.delete(`quiz/${quizId}/delete/`)
}