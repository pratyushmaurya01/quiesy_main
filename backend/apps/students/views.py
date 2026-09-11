from datetime import timedelta

from django.contrib.auth.hashers import check_password
from django.db import models, transaction
from django.db.models import Max, Q, Sum
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
    AttemptQuestionSerializer,
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
        ).strip()

        try:
            quiz = Quiz.objects.filter(
                quiz_code__iexact=quiz_code
            ).first()
            if not quiz:
                raise Quiz.DoesNotExist
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

            # Check both Django hashed password and plain-text password
            is_valid_pwd = check_password(password, quiz.password) or (password == quiz.password)
            if not is_valid_pwd:
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


class QuizInstructionView(APIView):
    """
    Returns quiz details and pre-fetched question payloads for the instruction screen.
    Does not expose sensitive correct options or hidden test cases.
    """
    permission_classes = [
        IsAuthenticated,
        IsStudent,
    ]

    def get(self, request, quiz_code):
        quiz_code = str(quiz_code).strip()

        try:
            quiz = (
                Quiz.objects
                .select_related("teacher")
                .prefetch_related(
                    "quiz_questions__question__options",
                    "quiz_questions__question__test_cases",
                )
                .filter(quiz_code__iexact=quiz_code)
                .first()
            )
            if not quiz:
                raise Quiz.DoesNotExist
        except Quiz.DoesNotExist:
            return Response(
                {"detail": "Quiz not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if quiz.status not in [Quiz.Status.SCHEDULED, Quiz.Status.ACTIVE]:
            return Response(
                {"detail": "This quiz is not available."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        quiz_questions = quiz.quiz_questions.all().order_by("order", "id")
        serialized_questions = AttemptQuestionSerializer(
            quiz_questions,
            many=True,
        ).data

        total_marks = sum(
            (qq.marks_override if qq.marks_override is not None else qq.question.marks)
            for qq in quiz_questions
        )

        return Response(
            {
                "quiz": {
                    "id": quiz.id,
                    "title": quiz.title,
                    "subject": quiz.subject,
                    "description": quiz.description,
                    "teacher_name": quiz.teacher.name,
                    "quiz_code": quiz.quiz_code,
                    "status": quiz.status,
                    "duration_minutes": quiz.duration_minutes,
                    "max_attempts": quiz.max_attempts,
                    "total_questions": quiz_questions.count(),
                    "total_marks": total_marks,
                    "requires_password": bool(quiz.password),
                    "review_enabled": quiz.review_enabled,
                    "shuffle_questions": quiz.shuffle_questions,
                    "shuffle_options": quiz.shuffle_options,
                    "starts_at": quiz.starts_at,
                    "ends_at": quiz.ends_at,
                },
                "questions": serialized_questions,
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
                existing.last_activity = now

                existing.save(
                    update_fields=[
                        "last_activity",
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
        )

        return Response(
            AttemptSerializer(attempt).data,
            status=status.HTTP_201_CREATED,
        )


class AttemptDetailView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request, attempt_id):
        # Allow student who took it, or teacher who owns the quiz
        attempt = (
            ExamAttempt.objects
            .filter(
                id=attempt_id,
            )
            .filter(
                Q(student=request.user) | Q(quiz__teacher=request.user)
            )
            .prefetch_related(
                "answers",
            )
            .first()
        )

        if attempt is None:
            return Response(
                {
                    "detail": "Attempt not found or access denied."
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
                attempt,
                context={"request": request},
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

            attempt.last_activity = now
            attempt.save(
                update_fields=[
                    "last_activity",
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

        attempt.last_activity = now

        attempt.save(
            update_fields=[
                "last_activity",
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

        now = timezone.now()
        # Even if now >= attempt.expires_at or status is EXPIRED, we still allow
        # grading and finalizing all previously saved answers so student's work is preserved.

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

            elif question.question_type == "CODING":
                code = (answer.answer_data.get("code") or "").strip()
                lang = answer.answer_data.get("language") or "python"
                test_cases = list(
                    question.test_cases.all().values(
                        "id", "input_data", "expected_output", "is_sample"
                    )
                )

                if not code or not test_cases:
                    answer.evaluated_score = 0
                    answer.execution_result = {
                        "summary": "No code submitted or no test cases available.",
                        "passed_count": 0,
                        "total_count": len(test_cases),
                        "results": [],
                    }
                    answer.status = Answer.Status.EVALUATED
                else:
                    from apps.students.services.code_runner import run_code_batch

                    batch_results = run_code_batch(code, lang, test_cases)
                    passed_count = sum(1 for r in batch_results if r.get("passed"))
                    total_count = len(batch_results)

                    earned = round((passed_count / total_count) * float(question.marks), 2) if total_count > 0 else 0
                    score += earned
                    answer.evaluated_score = earned
                    answer.execution_result = {
                        "summary": f"{passed_count}/{total_count} test cases passed",
                        "passed_count": passed_count,
                        "total_count": total_count,
                        "results": batch_results,
                    }
                    answer.status = Answer.Status.EVALUATED

            else:
                answer.status = (
                    Answer.Status.PENDING
                )

            answer.save(
                update_fields=[
                    "evaluated_score",
                    "execution_result",
                    "status",
                    "updated_at",
                ]
            )

        attempt.score = score
        attempt.status = (
            ExamAttempt.Status.SUBMITTED
        )
        attempt.submitted_at = now
        attempt.last_activity = now
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


class StudentAttemptHistoryView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsStudent,
    ]

    def get(self, request):
        attempts = (
            ExamAttempt.objects
            .filter(
                student=request.user,
                status__in=[
                    ExamAttempt.Status.SUBMITTED,
                    ExamAttempt.Status.EVALUATED,
                    ExamAttempt.Status.EXPIRED,
                ],
            )
            .select_related("quiz", "quiz__teacher")
            .order_by("-submitted_at", "-created_at")
        )

        data = []
        for att in attempts:
            total = float(att.max_score or 0)
            earned = float(att.score or 0)
            percentage = round((earned / total) * 100, 1) if total > 0 else 0

            data.append({
                "id": str(att.id),
                "attempt_number": att.attempt_number,
                "status": att.status,
                "score": earned,
                "max_score": total,
                "percentage": percentage,
                "started_at": att.started_at,
                "submitted_at": att.submitted_at,
                "quiz": {
                    "id": att.quiz.id,
                    "title": att.quiz.title,
                    "subject": att.quiz.subject,
                    "quiz_code": att.quiz.quiz_code,
                    "teacher_name": getattr(att.quiz.teacher, "name", "Instructor"),
                    "duration_minutes": att.quiz.duration_minutes,
                    "review_enabled": att.quiz.review_enabled,
                },
            })

        return Response(data, status=status.HTTP_200_OK)


class RunCodeView(APIView):
    """
    Execute student code against sample test cases (or custom input) in real time during exam.
    Does not grade or change student score.
    """
    permission_classes = [
        IsAuthenticated,
        IsStudent,
    ]

    def post(self, request):
        code = request.data.get("code", "")
        language = request.data.get("language", "python")
        question_id = request.data.get("question_id")
        custom_input = request.data.get("input")

        if not code or not code.strip():
            return Response(
                {"detail": "Code cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from apps.students.services.code_runner import run_code_single, run_code_batch

        # Case 1: Custom input supplied
        if custom_input is not None:
            result = run_code_single(code, language, custom_input)
            return Response(
                {
                    "type": "custom",
                    "output": result.get("stdout") or "",
                    "error": result.get("stderr") or "",
                    "status": result.get("status"),
                    "time": result.get("time"),
                },
                status=status.HTTP_200_OK,
            )

        # Case 2: Run against question sample test cases
        if question_id:
            try:
                question = Question.objects.get(id=question_id)
            except Question.DoesNotExist:
                return Response(
                    {"detail": "Question not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            sample_tcs = list(
                question.test_cases.filter(is_sample=True).values(
                    "id", "input_data", "expected_output", "is_sample"
                )
            )

            if not sample_tcs:
                # If no sample testcases, run against any testcase or single run with empty input
                first_tc = question.test_cases.first()
                if first_tc:
                    sample_tcs = [{
                        "id": first_tc.id,
                        "input_data": first_tc.input_data,
                        "expected_output": first_tc.expected_output,
                        "is_sample": True,
                    }]
                else:
                    result = run_code_single(code, language, "")
                    return Response(
                        {
                            "type": "single",
                            "output": result.get("stdout") or "",
                            "error": result.get("stderr") or "",
                            "status": result.get("status"),
                        },
                        status=status.HTTP_200_OK,
                    )

            batch_results = run_code_batch(code, language, sample_tcs)
            passed = sum(1 for r in batch_results if r.get("passed"))
            return Response(
                {
                    "type": "sample_batch",
                    "total": len(batch_results),
                    "passed": passed,
                    "results": batch_results,
                },
                status=status.HTTP_200_OK,
            )

        # Default fallback
        result = run_code_single(code, language, "")
        return Response(
            {
                "type": "single",
                "output": result.get("stdout") or "",
                "error": result.get("stderr") or "",
                "status": result.get("status"),
            },
            status=status.HTTP_200_OK,
        )


class SubmitCodeView(APIView):
    """
    LeetCode-style 'Submit Code' for a specific CODING question during an exam attempt.
    Runs code against ALL test cases (Sample + Hidden), saves answer_data, execution_result,
    and awards score immediately.
    """
    permission_classes = [
        IsAuthenticated,
        IsStudent,
    ]

    def post(self, request):
        attempt_id = request.data.get("attempt_id")
        question_id = request.data.get("question_id")
        code = (request.data.get("code") or "").strip()
        language = request.data.get("language", "python")

        if not attempt_id or not question_id:
            return Response(
                {"detail": "attempt_id and question_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        attempt = ExamAttempt.objects.filter(
            id=attempt_id,
            student=request.user,
        ).first()

        if not attempt:
            return Response(
                {"detail": "Attempt not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if attempt.status != ExamAttempt.Status.IN_PROGRESS:
            return Response(
                {"detail": "This exam attempt is no longer active."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if timezone.now() >= attempt.expires_at:
            attempt.status = ExamAttempt.Status.EXPIRED
            attempt.save(update_fields=["status", "updated_at"])
            return Response(
                {"detail": "Exam time has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        question = Question.objects.filter(id=question_id).first()
        if not question:
            return Response(
                {"detail": "Question not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not code:
            return Response(
                {"detail": "Cannot submit empty code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Fetch ALL test cases for this question
        test_cases = list(
            question.test_cases.all().values(
                "id", "input_data", "expected_output", "is_sample"
            )
        )

        from apps.students.services.code_runner import run_code_batch

        batch_results = run_code_batch(code, language, test_cases)
        total_cases = len(batch_results)
        passed_cases = sum(1 for r in batch_results if r.get("passed"))
        all_passed = (passed_cases == total_cases) and total_cases > 0

        # Calculate question marks
        qq = QuizQuestion.objects.filter(quiz=attempt.quiz, question=question).first()
        q_marks = qq.marks_override if (qq and qq.marks_override is not None) else question.marks
        earned_marks = round((passed_cases / total_cases) * float(q_marks), 2) if total_cases > 0 else 0

        # Get or create student Answer record
        with transaction.atomic():
            answer, _ = Answer.objects.get_or_create(
                attempt=attempt,
                question=question,
                defaults={
                    "status": Answer.Status.EVALUATED,
                    "idempotency_key": f"submit_code_{attempt.id}_{question.id}_{timezone.now().timestamp()}",
                },
            )

            answer.answer_data = {
                "code": code,
                "language": language,
            }
            answer.evaluated_score = earned_marks
            answer.status = Answer.Status.EVALUATED
            answer.execution_result = {
                "summary": f"{passed_cases}/{total_cases} test cases passed",
                "passed_count": passed_cases,
                "total_count": total_cases,
                "all_passed": all_passed,
                "results": batch_results,
            }
            answer.save()

            # Recalculate attempt score sum
            evaluated_sum = (
                Answer.objects.filter(attempt=attempt)
                .aggregate(models.Sum("evaluated_score"))["evaluated_score__sum"]
                or 0
            )
            attempt.score = evaluated_sum
            attempt.last_activity = timezone.now()
            attempt.save(update_fields=["score", "last_activity", "updated_at"])

        return Response(
            {
                "success": True,
                "all_passed": all_passed,
                "passed_count": passed_cases,
                "total_count": total_cases,
                "earned_score": earned_marks,
                "max_score": float(q_marks),
                "attempt_total_score": float(attempt.score),
                "execution_result": answer.execution_result,
            },
            status=status.HTTP_200_OK,
        )
