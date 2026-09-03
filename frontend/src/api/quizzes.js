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