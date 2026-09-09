from django.contrib.auth.hashers import check_password

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.quizzes.models import Quiz
from apps.users.permissions import IsStudent


from django.db.models import Q
from .serializers import QuizDiscoverySerializer

from .pagination import QuizDiscoveryPagination


class StudentTestView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        return Response(
            {
                "message": "Student access verified."
            }
        )


class JoinQuizView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def post(self, request):
        quiz_code = request.data.get("quiz_code")
        password = request.data.get("password")

        if not quiz_code:
            return Response(
                {
                    "detail": "Quiz code is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        quiz_code = str(quiz_code).strip().upper()

        try:
            quiz = Quiz.objects.get(quiz_code=quiz_code)
        except Quiz.DoesNotExist:
            return Response(
                {
                    "detail": "Invalid quiz code."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if quiz.password:
            if not password:
                return Response(
                    {
                        "detail": "Quiz password is required."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not check_password(password, quiz.password):
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
                    "description": quiz.description,
                    "duration_minutes": quiz.duration_minutes,
                    "max_attempts": quiz.max_attempts,
                    "quiz_code": quiz.quiz_code,
                    "review_enabled": quiz.review_enabled,
                    "shuffle_questions": quiz.shuffle_questions,
                    "shuffle_options": quiz.shuffle_options,
                },
            },
            status=status.HTTP_200_OK,
        )


class QuizDiscoveryView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        search = request.query_params.get("search", "").strip()

        quizzes = (
            Quiz.objects
            .filter(
                status__in=[
                    Quiz.Status.SCHEDULED,
                    Quiz.Status.ACTIVE,
                ]
            )
            .select_related("teacher")
            .only(
                "id",
                "title",
                "subject",
                "description",
                "quiz_code",
                "status",
                "duration_minutes",
                "max_attempts",
                "review_enabled",
                "shuffle_questions",
                "shuffle_options",
                "teacher__id",
                "teacher__name",
            )
            .order_by("-created_at")
        )

        if search:
            quizzes = quizzes.filter(
                Q(title__icontains=search)
                | Q(subject__icontains=search)
                | Q(description__icontains=search)
                | Q(teacher__name__icontains=search)
            )

        paginator = QuizDiscoveryPagination()
        page = paginator.paginate_queryset(quizzes, request , view=self)
        serializer = QuizDiscoverySerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)