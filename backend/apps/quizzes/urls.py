from rest_framework.routers import DefaultRouter

from .views import (
    QuestionViewSet,
    QuestionVersionViewSet,
    QuizQuestionViewSet,
    QuizViewSet,
)


router = DefaultRouter()

router.register(
    r"questions",
    QuestionViewSet,
    basename="question",
)

router.register(
    r"question-versions",
    QuestionVersionViewSet,
    basename="question-version",
)

router.register(
    r"quizzes",
    QuizViewSet,
    basename="quiz",
)

router.register(
    r"quiz-questions",
    QuizQuestionViewSet,
    basename="quiz-question",
)

urlpatterns = router.urls