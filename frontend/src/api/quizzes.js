import API from "./api"


// ==================== Questions ====================

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

export const generateAIQuestions = (data) => {
    return API.post("quizzes/questions/generate_ai/", data)
}

export const deleteQuestion = (id) => {
    return API.delete(`quizzes/questions/${id}/`)
}

export const deactivateQuestion = (id) => {
    return API.delete(`quizzes/questions/${id}/`)
}


// ==================== Question Versions ====================

export const getQuestionVersions = () => {
    return API.get("quizzes/question-versions/")
}


// ==================== Quizzes ====================

export const createQuiz = (data) => {
    return API.post("quizzes/quizzes/", data)
}

export const getQuiz = (id) => {
    return API.get(`quizzes/quizzes/${id}/`)
}

export const getQuizzes = () => {
    return API.get("quizzes/quizzes/")
}

export const updateQuiz = (id, data) => {
    return API.patch(`quizzes/quizzes/${id}/`, data)
}


// ==================== Quiz Lifecycle ====================

export const scheduleQuiz = (id, startsAt, endsAt) => {
    return API.post(`quizzes/quizzes/${id}/schedule/`, {
        starts_at: startsAt,
        ends_at: endsAt,
    })
}

export const startQuiz = (id) => {
    return API.post(`quizzes/quizzes/${id}/start/`)
}


// ==================== Quiz Questions ====================

export const getQuizQuestions = () => {
    return API.get("quizzes/quiz-questions/")
}

export const addQuestionToQuiz = (data) => {
    return API.post("quizzes/quiz-questions/", data)
}

export const removeQuestionFromQuiz = (quizQuestionId) => {
    return API.delete(`quizzes/quiz-questions/${quizQuestionId}/`)
}

export const updateQuizQuestion = (quizQuestionId, data) => {
    return API.patch(`quizzes/quiz-questions/${quizQuestionId}/`, data)
}


// ==================== Legacy Quiz APIs ====================

export const getQuizQuestionsByCode = (quizCode) => {
    return API.get(`quiz/${quizCode}/questions/`)
}

export const getQuizResults = (quizId) => {
    return API.get(`quizzes/quizzes/${quizId}/results/`)
}

export const getLiveProctorRoster = (quizId) => {
    return API.get(`quizzes/quizzes/${quizId}/live-proctor/`)
}

export const toggleQuizReview = (quizId, reviewOn) => {
    return API.post(`quizzes/quizzes/${quizId}/toggle-review/`, {
        review_on: reviewOn,
    })
}

export const deleteQuiz = (quizId) => {
    return API.delete(`quizzes/quizzes/${quizId}/`)
}