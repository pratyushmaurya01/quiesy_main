from django.shortcuts import render

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.permissions import IsStudent


class StudentTestView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        return Response(
            {
                "message": "Student access verified."
            }
        )

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.permissions import IsStudent
from apps.quizzes.models import Quiz


class JoinQuizView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def post(self, request):
        quiz_code = request.data.get("quiz_code")
        password = request.data.get("password")

        if not quiz_code or not password:
            return Response(
                {
                    "detail": "Quiz code and password are required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            quiz = Quiz.objects.get(quiz_code=quiz_code)
        except Quiz.DoesNotExist:
            return Response(
                {
                    "detail": "Invalid quiz code."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if quiz.password != password:
            return Response(
                {
                    "detail": "Invalid quiz password."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": "Quiz joined successfully.",
                "quiz": {
                    "id": quiz.id,
                    "title": quiz.title,
                    "subject": quiz.subject,
                    "duration_minutes": quiz.duration_minutes,
                    "quiz_code": quiz.quiz_code,
                },
            },
            status=status.HTTP_200_OK,
        )