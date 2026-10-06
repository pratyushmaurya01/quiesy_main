from django.urls import re_path
from .consumers import QuizProctorConsumer

websocket_urlpatterns = [
    re_path(r"^ws/quiz-proctor/(?P<quiz_id>\d+)/$", QuizProctorConsumer.as_asgi()),
]
