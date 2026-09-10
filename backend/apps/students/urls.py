from django.urls import path

from .views import (
    AnswerListCreateView,
    AttemptDetailView,
    JoinQuizView,
    QuizDiscoveryView,
    StartExamView,
    StudentTestView,
    SubmitExamView,
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
]