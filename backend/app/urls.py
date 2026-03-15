from django.urls import path
from .views import teacher_register ,  teacher_login , create_quiz , create_question ,  start_quiz
from .views import get_quiz_questions , submit_answer , finish_quiz
urlpatterns = [
    path("register/", teacher_register),
    path('login/' , teacher_login),
    path('create-quiz/' , create_quiz),
    path("create-question/", create_question),
    path("start-quiz/", start_quiz),
    path("quiz/<str:quiz_code>/questions/", get_quiz_questions),
    path("submit-answer/", submit_answer),
    path('finish_quiz/' , finish_quiz)
]
