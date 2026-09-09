from django.urls import path

from .views import (
    StudentTestView,
    JoinQuizView,
    QuizDiscoveryView,
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
]