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