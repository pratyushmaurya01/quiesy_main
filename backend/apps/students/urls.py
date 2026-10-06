from django.urls import path

from .views import (
    AnswerListCreateView,
    AttemptDetailView,
    JoinQuizView,
    QuizDiscoveryView,
    QuizInstructionView,
    RunCodeView,
    StartExamView,
    StudentAttemptHistoryView,
    StudentTestView,
    SubmitCodeView,
    SubmitExamView,
    CodeTaskStatusView,
)



urlpatterns = [
    path(
        "",
        StudentTestView.as_view(),
        name="student-home",
    ),
    path(
        "join-quiz/",
        JoinQuizView.as_view(),
        name="join-quiz",
    ),
    path(
        "quizzes/",
        QuizDiscoveryView.as_view(),
        name="quiz-discovery",
    ),
    path(
        "quizzes/<str:quiz_code>/instructions/",
        QuizInstructionView.as_view(),
        name="quiz-instructions",
    ),
    path(
        "quizzes/<int:quiz_id>/start/",
        StartExamView.as_view(),
        name="start-exam",
    ),
    path(
        "attempts/<uuid:attempt_id>/",
        AttemptDetailView.as_view(),
        name="attempt-detail",
    ),
    path(
        "attempts/<uuid:attempt_id>/answers/",
        AnswerListCreateView.as_view(),
        name="attempt-answers",
    ),
    path(
        "attempts/<uuid:attempt_id>/submit/",
        SubmitExamView.as_view(),
        name="submit-exam",
    ),
    path(
        "my-attempts/",
        StudentAttemptHistoryView.as_view(),
        name="student-attempt-history",
    ),
    path(
        "run-code/",
        RunCodeView.as_view(),
        name="run-code",
    ),
    path(
        "submit-code/",
        SubmitCodeView.as_view(),
        name="submit-code",
    ),
    path(
        "code-tasks/<str:task_id>/",
        CodeTaskStatusView.as_view(),
        name="code-task-status",
    ),
]

