from django.urls import path

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import teacher_register ,  teacher_login , create_quiz , create_question ,  start_quiz
from .views import get_quiz_questions , submit_answer , finish_quiz , teacher_quizzes , quiz_detail
from .views import quiz_questions_list , update_question ,review_quiz , get_attempt_by_email
from .views import quiz_results ,toggle_review , get_quiz_info , test_code , delete_quiz
urlpatterns = [
    path("register/", teacher_register),
    # path("login/", TokenObtainPairView.as_view()),
    path("token/refresh/", TokenRefreshView.as_view()),
    path('login/' , teacher_login),
    path('create-quiz/' , create_quiz),
    path("teacher-quizzes/", teacher_quizzes),
    path("create-question/", create_question),
    path("start-quiz/", start_quiz),
    path("quiz/<str:quiz_code>/questions/", get_quiz_questions),
    path("submit-answer/", submit_answer),
    path('finish_quiz/' , finish_quiz),
    path("quiz/<int:quiz_id>/", quiz_detail),
    path("quiz/<int:quiz_id>/questions-list/", quiz_questions_list),
    path("update-question/", update_question),
    path("review/<int:attempt_id>/", review_quiz),
    path("get-attempt/", get_attempt_by_email),
    path("quiz/<int:quiz_id>/results/", quiz_results),
    path("quiz/<int:quiz_id>/toggle-review/", toggle_review),
    path('quiz-info/<uuid:quiz_code>/', get_quiz_info, name='quiz_info'),
    path('quiz/<int:quiz_id>/delete/', delete_quiz),
    path("test-code/", test_code),  # jus for tesing the code type qus

]
