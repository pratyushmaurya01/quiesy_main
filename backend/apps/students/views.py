from datetime import timedelta

from django.contrib.auth.hashers import check_password
from django.db import transaction
from django.db.models import Max, Q
from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.quizzes.models import Question, Quiz, QuizQuestion
from apps.users.permissions import IsStudent

from .models import Answer, ExamAttempt
from .pagination import QuizDiscoveryPagination
from .serializers import (
    AnswerSerializer,
    AttemptSerializer,
    QuizDiscoverySerializer,
)


class StudentTestView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsStudent,
    ]

    def get(self, request):
        return Response(
            {
                "message": "Student access verified."
            }
        )


class JoinQuizView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsStudent,
    ]

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

        quiz_code = str(
            quiz_code
        ).strip().upper()

        try:
            quiz = Quiz.objects.get(
                quiz_code=quiz_code
            )
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
                        "detail": (
                            "Quiz password is required."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not check_password(
                password,
                quiz.password,
            ):
                return Response(
                    {
                        "detail": (
                            "Invalid quiz password."
                        )
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
                    "duration_minutes": (
                        quiz.duration_minutes
                    ),
                    "max_attempts": quiz.max_attempts,
                    "quiz_code": quiz.quiz_code,
                    "review_enabled": (
                        quiz.review_enabled
                    ),
                    "shuffle_questions": (
                        quiz.shuffle_questions
                    ),
                    "shuffle_options": (
                        quiz.shuffle_options
                    ),
                },
            },
            status=status.HTTP_200_OK,
        )


class QuizDiscoveryView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsStudent,
    ]

    def get(self, request):
        search = request.query_params.get(
            "search",
            "",
        ).strip()

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
                | Q(
                    teacher__name__icontains=search
                )
            )

        paginator = QuizDiscoveryPagination()

        page = paginator.paginate_queryset(
            quizzes,
            request,
            view=self,
        )

        serializer = QuizDiscoverySerializer(
            page,
            many=True,
        )

        return paginator.get_paginated_response(
            serializer.data
        )


class StartExamView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsStudent,
    ]

    @transaction.atomic
    def post(self, request, quiz_id):
        now = timezone.now()

        try:
            quiz = (
                Quiz.objects
                .select_for_update()
                .get(id=quiz_id)
            )
        except Quiz.DoesNotExist:
            return Response(
                {"detail": "Quiz not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if quiz.status != Quiz.Status.ACTIVE:
            return Response(
                {
                    "detail": (
                        "This quiz is not currently active."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if quiz.starts_at and now < quiz.starts_at:
            return Response(
                {
                    "detail": (
                        "This quiz has not started yet."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if quiz.ends_at and now >= quiz.ends_at:
            return Response(
                {
                    "detail": (
                        "This quiz has already closed."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing = (
            ExamAttempt.objects
            .select_for_update()
            .filter(
                student=request.user,
                quiz=quiz,
                status=ExamAttempt.Status.IN_PROGRESS,
            )
            .first()
        )

        if existing:
            if now >= existing.expires_at:
                existing.status = (
                    ExamAttempt.Status.EXPIRED
                )

                existing.save(
                    update_fields=[
                        "status",
                        "updated_at",
                    ]
                )
            else:
                existing.last_activity_at = now

                existing.save(
                    update_fields=[
                        "last_activity_at",
                        "updated_at",
                    ]
                )

                return Response(
                    AttemptSerializer(
                        existing
                    ).data,
                    status=status.HTTP_200_OK,
                )

        attempt_count = (
            ExamAttempt.objects
            .filter(
                student=request.user,
                quiz=quiz,
            )
            .count()
        )

        if attempt_count >= quiz.max_attempts:
            return Response(
                {
                    "detail": (
                        "Maximum number of attempts "
                        "reached."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        last_attempt = (
            ExamAttempt.objects
            .filter(
                student=request.user,
                quiz=quiz,
            )
            .aggregate(
                max_attempt=Max(
                    "attempt_number"
                )
            )
        )

        next_attempt = (
            last_attempt["max_attempt"] or 0
        ) + 1

        expires_at = (
            now
            + timedelta(
                minutes=quiz.duration_minutes
            )
        )

        if (
            quiz.ends_at
            and quiz.ends_at < expires_at
        ):
            expires_at = quiz.ends_at

        quiz_questions = (
            QuizQuestion.objects
            .filter(quiz=quiz)
            .select_related("question")
        )

        max_score = sum(
            (
                qq.marks_override
                if qq.marks_override is not None
                else qq.question.marks
            )
            for qq in quiz_questions
        )

        attempt = ExamAttempt.objects.create(
            student=request.user,
            quiz=quiz,
            attempt_number=next_attempt,
            status=ExamAttempt.Status.IN_PROGRESS,
            started_at=now,
            expires_at=expires_at,
            max_score=max_score,
            last_activity_at=now,
        )

        return Response(
            AttemptSerializer(attempt).data,
            status=status.HTTP_201_CREATED,
        )


class AttemptDetailView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsStudent,
    ]

    def get(self, request, attempt_id):
        attempt = (
            ExamAttempt.objects
            .filter(
                id=attempt_id,
                student=request.user,
            )
            .prefetch_related(
                "answers",
            )
            .first()
        )

        if attempt is None:
            return Response(
                {
                    "detail": "Attempt not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if (
            attempt.status
            == ExamAttempt.Status.IN_PROGRESS
            and timezone.now() >= attempt.expires_at
        ):
            attempt.status = (
                ExamAttempt.Status.EXPIRED
            )

            attempt.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )

        return Response(
            AttemptSerializer(
                attempt
            ).data,
            status=status.HTTP_200_OK,
        )


class AnswerListCreateView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsStudent,
    ]

    def get_attempt(
        self,
        request,
        attempt_id,
    ):
        return (
            ExamAttempt.objects
            .filter(
                id=attempt_id,
                student=request.user,
            )
            .first()
        )

    def get(self, request, attempt_id):
        attempt = self.get_attempt(
            request,
            attempt_id,
        )

        if attempt is None:
            return Response(
                {
                    "detail": "Attempt not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if (
            attempt.status
            == ExamAttempt.Status.IN_PROGRESS
            and timezone.now() >= attempt.expires_at
        ):
            attempt.status = (
                ExamAttempt.Status.EXPIRED
            )

            attempt.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )

        answers = (
            Answer.objects
            .filter(attempt=attempt)
            .select_related("question")
            .order_by("question_id")
        )

        return Response(
            AnswerSerializer(
                answers,
                many=True,
            ).data
        )

    @transaction.atomic
    def post(self, request, attempt_id):
        attempt = (
            ExamAttempt.objects
            .select_for_update()
            .filter(
                id=attempt_id,
                student=request.user,
            )
            .first()
        )

        if attempt is None:
            return Response(
                {
                    "detail": "Attempt not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        now = timezone.now()

        if (
            attempt.status
            != ExamAttempt.Status.IN_PROGRESS
        ):
            return Response(
                {
                    "detail": (
                        "This attempt is no longer active."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if now >= attempt.expires_at:
            attempt.status = (
                ExamAttempt.Status.EXPIRED
            )

            attempt.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )

            return Response(
                {
                    "detail": (
                        "Exam time has expired."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        question_id = request.data.get(
            "question"
        )

        if not question_id:
            return Response(
                {
                    "question": (
                        "Question is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        idempotency_key = request.data.get(
            "idempotency_key"
        )

        if not idempotency_key:
            return Response(
                {
                    "idempotency_key": (
                        "This field is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_key = (
            Answer.objects
            .filter(
                attempt=attempt,
                idempotency_key=idempotency_key,
            )
            .first()
        )

        if existing_key:
            return Response(
                AnswerSerializer(
                    existing_key
                ).data,
                status=status.HTTP_200_OK,
            )

        try:
            question = Question.objects.get(
                id=question_id
            )
        except Question.DoesNotExist:
            return Response(
                {
                    "question": (
                        "Question not found."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        belongs_to_quiz = (
            QuizQuestion.objects.filter(
                quiz=attempt.quiz,
                question=question,
            ).exists()
        )

        if not belongs_to_quiz:
            return Response(
                {
                    "question": (
                        "Question does not belong "
                        "to this quiz."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            sequence = int(
                request.data.get(
                    "sequence",
                    0,
                )
            )
        except (
            TypeError,
            ValueError,
        ):
            return Response(
                {
                    "sequence": (
                        "Sequence must be an integer."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        answer_data = request.data.get(
            "answer_data",
            {},
        )

        if not isinstance(
            answer_data,
            dict,
        ):
            return Response(
                {
                    "answer_data": (
                        "answer_data must be a JSON object."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing = (
            Answer.objects
            .filter(
                attempt=attempt,
                question=question,
            )
            .first()
        )

        if existing:
            if sequence <= existing.sequence:
                return Response(
                    AnswerSerializer(
                        existing
                    ).data,
                    status=status.HTTP_200_OK,
                )

            existing.answer_data = answer_data
            existing.sequence = sequence
            existing.idempotency_key = (
                idempotency_key
            )
            existing.status = (
                Answer.Status.SAVED
            )
            existing.save()

            attempt.last_activity_at = now
            attempt.save(
                update_fields=[
                    "last_activity_at",
                    "updated_at",
                ]
            )

            return Response(
                AnswerSerializer(
                    existing
                ).data,
                status=status.HTTP_200_OK,
            )

        serializer = AnswerSerializer(
            data={
                "question": question.id,
                "answer_data": answer_data,
                "sequence": sequence,
                "idempotency_key": (
                    idempotency_key
                ),
            },
            context={
                "attempt": attempt,
            },
        )

        serializer.is_valid(
            raise_exception=True
        )

        answer = serializer.save(
            attempt=attempt,
        )

        attempt.last_activity_at = now

        attempt.save(
            update_fields=[
                "last_activity_at",
                "updated_at",
            ]
        )

        return Response(
            AnswerSerializer(
                answer
            ).data,
            status=status.HTTP_201_CREATED,
        )


class SubmitExamView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsStudent,
    ]

    @transaction.atomic
    def post(self, request, attempt_id):
        attempt = (
            ExamAttempt.objects
            .select_for_update()
            .filter(
                id=attempt_id,
                student=request.user,
            )
            .first()
        )

        if attempt is None:
            return Response(
                {
                    "detail": "Attempt not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        idempotency_key = request.data.get(
            "idempotency_key"
        )

        if not idempotency_key:
            return Response(
                {
                    "idempotency_key": (
                        "This field is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            attempt.status
            == ExamAttempt.Status.SUBMITTED
        ):
            return Response(
                AttemptSerializer(
                    attempt
                ).data,
                status=status.HTTP_200_OK,
            )

        if (
            attempt.status
            == ExamAttempt.Status.EXPIRED
        ):
            return Response(
                {
                    "detail": "Attempt has expired."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()

        if now >= attempt.expires_at:
            attempt.status = (
                ExamAttempt.Status.EXPIRED
            )

            attempt.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )

            return Response(
                {
                    "detail": (
                        "Exam time has expired."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        answers = (
            Answer.objects
            .filter(attempt=attempt)
            .select_related("question")
            .prefetch_related(
                "question__options"
            )
        )

        score = 0

        for answer in answers:
            question = answer.question

            if question.question_type == "MCQ":
                selected = answer.answer_data.get(
                    "option_id"
                )

                correct = (
                    question.options
                    .filter(is_correct=True)
                    .values_list(
                        "id",
                        flat=True,
                    )
                    .first()
                )

                if (
                    selected is not None
                    and correct == selected
                ):
                    answer.evaluated_score = (
                        question.marks
                    )
                    answer.status = (
                        Answer.Status.EVALUATED
                    )
                    score += question.marks
                else:
                    answer.evaluated_score = 0
                    answer.status = (
                        Answer.Status.EVALUATED
                    )

            elif question.question_type == "MSQ":
                selected = set(
                    answer.answer_data.get(
                        "option_ids",
                        [],
                    )
                )

                correct = set(
                    question.options
                    .filter(is_correct=True)
                    .values_list(
                        "id",
                        flat=True,
                    )
                )

                if selected == correct:
                    answer.evaluated_score = (
                        question.marks
                    )
                    score += question.marks
                else:
                    answer.evaluated_score = 0

                answer.status = (
                    Answer.Status.EVALUATED
                )

            else:
                answer.status = (
                    Answer.Status.PENDING
                )

            answer.save(
                update_fields=[
                    "evaluated_score",
                    "status",
                    "updated_at",
                ]
            )

        attempt.score = score
        attempt.status = (
            ExamAttempt.Status.SUBMITTED
        )
        attempt.submitted_at = now
        attempt.last_activity_at = now
        attempt.submit_idempotency_key = (
            idempotency_key
        )

        attempt.save()

        return Response(
            AttemptSerializer(
                attempt
            ).data,
            status=status.HTTP_200_OK,
        )