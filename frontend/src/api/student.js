import API from "./api"

export const getStudentQuizzes = (search = "") => {
    return API.get("student/quizzes/", {
        params: search
            ? { search }
            : {},
    })
}

export const joinQuiz = (quizCode, password = null) => {
    const data = {
        quiz_code: quizCode,
    }

    if (password) {
        data.password = password
    }

    return API.post(
        "student/join-quiz/",
        data
    )
}

export const getQuizInstructions = (quizCode) => {
    return API.get(`student/quizzes/${quizCode}/instructions/`)
}

export const startExam = (quizId) => {
    return API.post(`student/quizzes/${quizId}/start/`)
}

export const getAttempt = (attemptId) => {
    return API.get(`student/attempts/${attemptId}/`)
}

export const saveAnswer = (attemptId, data) => {
    return API.post(`student/attempts/${attemptId}/answers/`, data)
}

export const submitExam = (attemptId, idempotencyKey) => {
    return API.post(`student/attempts/${attemptId}/submit/`, {
        idempotency_key: idempotencyKey,
    })
}

export const getMyAttempts = () => {
    return API.get("student/my-attempts/")
}

export const runCode = (data) => {
    return API.post("student/run-code/", data)
}

export const submitCode = (data) => {
    return API.post("student/submit-code/", data)
}



