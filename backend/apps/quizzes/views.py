from django.shortcuts import render

from django.db import transaction
from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .pagination import QuizPagination

from .models import (
    Question,
    QuestionVersion,
    Quiz,
    QuizQuestion,
)
from .serializers import (
    QuestionSerializer,
    QuestionVersionSerializer,
    QuizSerializer,
    QuizQuestionSerializer,
)


class IsTeacher(IsAuthenticated):
    """
    Allows access only to authenticated teachers.
    """

    def has_permission(self, request, view):
        return (
            super().has_permission(request, view)
            and request.user.is_authenticated
            and request.user.role == "TEACHER"
        )


class QuestionViewSet(viewsets.ModelViewSet):
    """
    Question Bank API.

    Teachers can only access and modify their own questions.
    """

    serializer_class = QuestionSerializer
    permission_classes = [IsTeacher]
    pagination_class = QuizPagination
    def get_queryset(self):
        queryset = Question.objects.filter(
            teacher=self.request.user
        ).prefetch_related(
            "options",
            "test_cases",
            "versions",
        )

        is_active = self.request.query_params.get("is_active")
        question_type = self.request.query_params.get("question_type")
        difficulty = self.request.query_params.get("difficulty")
        topic = self.request.query_params.get("topic")
        search = self.request.query_params.get("search")

        if is_active is not None:
            if is_active.lower() == "true":
                queryset = queryset.filter(is_active=True)
            elif is_active.lower() == "false":
                queryset = queryset.filter(is_active=False)

        if question_type:
            queryset = queryset.filter(question_type=question_type.upper())

        if difficulty:
            queryset = queryset.filter(difficulty=difficulty.upper())

        if topic:
            queryset = queryset.filter(topic__iexact=topic)

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(text__icontains=search)
                | Q(topic__icontains=search)
            )

        return queryset.order_by("-updated_at", "-id")

    def perform_create(self, serializer):
        with transaction.atomic():
            question = serializer.save(
                teacher=self.request.user
            )

            self._create_version(question)

    def update(self, request, *args, **kwargs):
        """
        Update a question and create a new immutable version.

        Full nested option/test-case replacement is handled here so that
        existing question history remains intact.
        """
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=partial,
        )

        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            old_snapshot = self._build_snapshot(instance)

            options_data = serializer.validated_data.pop(
                "options",
                None,
            )

            test_cases_data = serializer.validated_data.pop(
                "test_cases",
                None,
            )

            for field, value in serializer.validated_data.items():
                setattr(instance, field, value)

            instance.save()

            if options_data is not None:
                instance.options.all().delete()

                for option_data in options_data:
                    instance.options.create(
                        **option_data
                    )

            if test_cases_data is not None:
                instance.test_cases.all().delete()

                for test_case_data in test_cases_data:
                    instance.test_cases.create(
                        **test_case_data
                    )

            new_snapshot = self._build_snapshot(instance)

            if old_snapshot != new_snapshot:
                self._create_version(instance)

        return Response(
            self.get_serializer(instance).data
        )

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(
            request,
            *args,
            **kwargs,
        )

    def destroy(self, request, *args, **kwargs):
        """
        Soft delete.

        Questions are deactivated instead of physically deleted because
        they may already be referenced by historical exams.
        """
        instance = self.get_object()

        if not instance.is_active:
            return Response(
                {
                    "detail": "Question is already inactive."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        instance.is_active = False
        instance.save(
            update_fields=[
                "is_active",
                "updated_at",
            ]
        )

        return Response(
            {
                "detail": "Question deactivated successfully."
            },
            status=status.HTTP_200_OK,
        )

    @staticmethod
    def _build_snapshot(question):
        """
        Build an immutable representation of the question's
        current content for version history.
        """
        return {
            "title": question.title,
            "text": question.text,
            "question_type": question.question_type,
            "difficulty": question.difficulty,
            "topic": question.topic,
            "marks": question.marks,
            "starter_code": question.starter_code,
            "options": [
                {
                    "text": option.text,
                    "is_correct": option.is_correct,
                    "order": option.order,
                }
                for option in question.options.all()
            ],
            "test_cases": [
                {
                    "input_data": test_case.input_data,
                    "expected_output": test_case.expected_output,
                    "is_sample": test_case.is_sample,
                    "order": test_case.order,
                }
                for test_case in question.test_cases.all()
            ],
        }

    def _create_version(self, question):
        """
        Create the next immutable version for a question.
        """
        last_version = (
            QuestionVersion.objects
            .filter(question=question)
            .order_by("-version")
            .first()
        )

        next_version = (
            last_version.version + 1
            if last_version
            else 1
        )

        snapshot = self._build_snapshot(question)

        QuestionVersion.objects.create(
            question=question,
            version=next_version,
            text=question.text,
            question_type=question.question_type,
            marks=question.marks,
            starter_code=question.starter_code,
            snapshot=snapshot,
        )


class QuestionVersionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only question version history.

    Teachers can only inspect versions belonging to their own questions.
    """

    serializer_class = QuestionVersionSerializer
    permission_classes = [IsTeacher]

    def get_queryset(self):
        return (
            QuestionVersion.objects
            .filter(
                question__teacher=self.request.user
            )
            .select_related("question")
            .order_by(
                "question_id",
                "-version",
            )
        )


class QuizViewSet(viewsets.ModelViewSet):
    """
    Quiz definition/configuration API.

    Phase 2 handles creation and configuration.
    Exam lifecycle transitions are handled later in Phase 3.
    """

    serializer_class = QuizSerializer
    permission_classes = [IsTeacher]

    def get_queryset(self):
        return (
            Quiz.objects
            .filter(teacher=self.request.user)
            .prefetch_related(
                "quiz_questions__question"
            )
            .order_by("-updated_at", "-id")
        )

    def perform_create(self, serializer):
        serializer.save(
            teacher=self.request.user
        )


class QuizQuestionViewSet(viewsets.ModelViewSet):
    """
    Manage questions attached to a teacher's quiz.

    Only questions owned by the same teacher can be attached.
    """

    serializer_class = QuizQuestionSerializer
    permission_classes = [IsTeacher]

    def get_queryset(self):
        return (
            QuizQuestion.objects
            .filter(
                quiz__teacher=self.request.user
            )
            .select_related(
                "quiz",
                "question",
            )
            .order_by(
                "quiz_id",
                "order",
                "id",
            )
        )

    def create(self, request, *args, **kwargs):
        """
        Add an existing Question Bank question to a quiz.
        """
        quiz_id = request.data.get("quiz")

        if not quiz_id:
            return Response(
                {
                    "quiz": "Quiz ID is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            quiz = Quiz.objects.get(
                id=quiz_id,
                teacher=request.user,
            )
        except Quiz.DoesNotExist:
            return Response(
                {
                    "quiz": "Quiz not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        question_id = request.data.get("question")

        if not question_id:
            return Response(
                {
                    "question": "Question ID is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            question = Question.objects.get(
                id=question_id,
                teacher=request.user,
                is_active=True,
            )
        except Question.DoesNotExist:
            return Response(
                {
                    "question": (
                        "Question not found, inactive, "
                        "or not owned by you."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if QuizQuestion.objects.filter(
            quiz=quiz,
            question=question,
        ).exists():
            return Response(
                {
                    "question": (
                        "This question is already "
                        "added to the quiz."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(
            data=request.data,
            context={
                **self.get_serializer_context(),
                "quiz": quiz,
            },
        )

        serializer.is_valid(raise_exception=True)

        serializer.save(
            quiz=quiz,
            question=question,
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

    def perform_update(self, serializer):
        quiz_question = self.get_object()

        serializer.save(
            quiz=quiz_question.quiz,
            question=quiz_question.question,
        )
