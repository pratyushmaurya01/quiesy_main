from django.shortcuts import render
from django.utils import timezone
from rest_framework.decorators import action
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

    @action(detail=False, methods=["post"])
    def generate_ai(self, request):
        from .ai import generate_questions

        prompt_instructions = request.data.get("prompt_instructions", "")
        count = request.data.get("count", 3)
        question_type = request.data.get("question_type", "MCQ")
        difficulty = request.data.get("difficulty", "MEDIUM")
        topic = request.data.get("topic", "General Knowledge")
        option_variance = request.data.get("option_variance", "Different")

        try:
            count = min(int(count), 10)
            
            ai_data = generate_questions(
                prompt_instructions=prompt_instructions,
                count=count,
                question_type=question_type,
                difficulty=difficulty,
                topic=topic,
                option_variance=option_variance,
            )

            created_questions = []
            
            with transaction.atomic():
                for q_data in ai_data.get("questions", []):
                    # Ensure no nulls are passed to DRF which expects strings/lists
                    if q_data.get("starter_code") is None:
                        q_data["starter_code"] = ""
                    if q_data.get("options") is None:
                        q_data["options"] = []
                    if q_data.get("test_cases") is None:
                        q_data["test_cases"] = []

                    serializer = self.get_serializer(data=q_data)
                    serializer.is_valid(raise_exception=True)
                    question = serializer.save(teacher=request.user)
                    self._create_version(question)
                    created_questions.append(serializer.data)

            return Response(created_questions, status=status.HTTP_201_CREATED)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

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
        Hard delete.
        Deletes the question and its associated options and test cases.
        """
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



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

    @action(
        detail=True,
        methods=["post"],
        url_path="schedule",
    )
    def schedule(self, request, pk=None):
        """
        Schedule a draft quiz.

        Required:
        - starts_at
        - ends_at
        """

        quiz = self.get_object()

        if quiz.status != Quiz.Status.DRAFT:
            return Response(
                {
                    "detail": (
                        "Only draft quizzes can be scheduled."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        starts_at = request.data.get("starts_at")
        ends_at = request.data.get("ends_at")

        if not starts_at:
            return Response(
                {
                    "starts_at": "Start time is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not ends_at:
            return Response(
                {
                    "ends_at": "End time is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(
            quiz,
            data={
                "starts_at": starts_at,
                "ends_at": ends_at,
            },
            partial=True,
        )

        serializer.is_valid(raise_exception=True)

        quiz.starts_at = serializer.validated_data["starts_at"]
        quiz.ends_at = serializer.validated_data["ends_at"]
        quiz.status = Quiz.Status.SCHEDULED
        quiz.save(
            update_fields=[
                "starts_at",
                "ends_at",
                "status",
                "updated_at",
            ]
        )

        return Response(
            self.get_serializer(quiz).data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="start",
    )
    def start(self, request, pk=None):
        """
        Start a draft or scheduled quiz immediately.
        """

        quiz = self.get_object()

        if quiz.status not in [
            Quiz.Status.DRAFT,
            Quiz.Status.SCHEDULED,
        ]:
            return Response(
                {
                    "detail": (
                        "Only draft or scheduled quizzes "
                        "can be started."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not quiz.quiz_questions.exists():
            return Response(
                {
                    "detail": (
                        "Quiz must contain at least one "
                        "question before starting."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        quiz.status = Quiz.Status.ACTIVE
        quiz.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        return Response(
            self.get_serializer(quiz).data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="results",
    )
    def results(self, request, pk=None):
        """
        Return comprehensive results, statistics, and attempts for a quiz owned by this teacher.
        """
        from apps.students.models import ExamAttempt

        quiz = self.get_object()

        attempts = (
            ExamAttempt.objects
            .filter(
                quiz=quiz,
                status__in=[
                    ExamAttempt.Status.SUBMITTED,
                    ExamAttempt.Status.EVALUATED,
                    ExamAttempt.Status.EXPIRED,
                ],
            )
            .select_related("student")
            .order_by("-score", "submitted_at")
        )

        results_list = []
        total_score_sum = 0
        scores = []

        for att in attempts:
            earned = float(att.score or 0)
            total = float(att.max_score or 0)
            scores.append(earned)
            total_score_sum += earned

            time_taken = 0
            if att.started_at and att.submitted_at:
                diff = (att.submitted_at - att.started_at).total_seconds()
                time_taken = max(0, int(diff))

            student_name = getattr(att.student, "name", "")
            if not student_name:
                student_name = getattr(att.student, "email", "Student").split("@")[0]

            results_list.append({
                "attempt_id": str(att.id),
                "student_name": student_name,
                "email": att.student.email,
                "score": earned,
                "max_score": total,
                "percentage": round((earned / total) * 100, 1) if total > 0 else 0,
                "time_taken_seconds": time_taken,
                "status": att.status,
                "submitted_at": att.submitted_at.isoformat() if att.submitted_at else att.created_at.isoformat(),
            })

        count = len(scores)
        quiz_max_score = float(
            sum(
                quiz_question.marks_override
                if quiz_question.marks_override is not None
                else quiz_question.question.marks
                for quiz_question in quiz.quiz_questions.select_related(
                    "question"
                )
            )
        )
        avg_score = round(total_score_sum / count, 1) if count > 0 else 0
        highest = max(scores) if count > 0 else 0
        lowest = min(scores) if count > 0 else 0

        return Response(
            {
                "quiz_id": quiz.id,
                "quiz_title": quiz.title,
                "quiz_code": quiz.quiz_code,
                "review_enabled": quiz.review_enabled,
                "stats": {
                    "total_students": count,
                    "max_score": quiz_max_score,
                    "average_score": avg_score,
                    "highest_score": highest,
                    "lowest_score": lowest,
                },
                "results": results_list,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="live-proctor",
    )
    def live_proctor(self, request, pk=None):
        """
        Fetch real-time roster of candidates for the live exam proctoring cockpit.
        """
        from apps.students.models import ExamAttempt
        quiz = self.get_object()

        attempts = (
            ExamAttempt.objects
            .filter(quiz=quiz)
            .select_related("student")
            .prefetch_related("answers")
            .order_by("-started_at")
        )

        total_questions = quiz.quiz_questions.count()
        quiz_max_score = float(
            sum(
                qq.marks_override if qq.marks_override is not None else qq.question.marks
                for qq in quiz.quiz_questions.select_related("question")
            )
        )

        candidates = []
        now = timezone.now()
        active_count = 0
        blocked_count = 0
        total_switches = 0

        for att in attempts:
            answered = att.answers.filter(status__in=["ANSWERED", "EVALUATED"]).count()
            switches = att.tab_switch_count
            total_switches += switches

            if att.is_blocked:
                blocked_count += 1
            elif att.status == ExamAttempt.Status.IN_PROGRESS:
                active_count += 1

            # Seconds remaining calculation
            if att.is_blocked and att.paused_seconds_remaining is not None:
                secs_left = att.paused_seconds_remaining
            elif att.expires_at:
                secs_left = max(0, int((att.expires_at - now).total_seconds()))
            else:
                secs_left = 0

            student_name = getattr(att.student, "name", "")
            if not student_name:
                student_name = att.student.email.split("@")[0]

            candidates.append({
                "attempt_id": str(att.id),
                "student_id": att.student.id,
                "student_name": student_name,
                "email": att.student.email,
                "status": att.status,
                "is_blocked": att.is_blocked,
                "blocked_at": att.blocked_at.isoformat() if att.blocked_at else None,
                "tab_switch_count": switches,
                "score": float(att.score or 0),
                "max_score": quiz_max_score,
                "answered_count": answered,
                "total_questions": total_questions,
                "seconds_left": secs_left,
                "started_at": att.started_at.isoformat() if att.started_at else None,
                "joined_at": att.started_at.isoformat() if att.started_at else None,
            })

        total_enrolled = len(candidates)
        avg_switches = round(total_switches / total_enrolled, 1) if total_enrolled > 0 else 0

        return Response({
            "quiz_id": quiz.id,
            "quiz_title": quiz.title,
            "subject": quiz.subject,
            "quiz_code": quiz.quiz_code,
            "status": quiz.status,
            "total_questions": total_questions,
            "quiz_max_score": quiz_max_score,
            "stats": {
                "total_online": total_enrolled,
                "currently_active": active_count,
                "currently_blocked": blocked_count,
                "avg_tab_switches": avg_switches,
            },
            "candidates": candidates,
        }, status=status.HTTP_200_OK)



    @action(
        detail=True,
        methods=["put"],
        url_path="sync-questions",
    )
    def sync_questions(self, request, pk=None):
        """
        Bulk sync questions for a quiz. Handles additions, deletions, and reordering.
        Expected payload: {"questions": [{"question_id": 1, "order": 0, "marks_override": null}, ...]}
        """
        from django.db import transaction
        quiz = self.get_object()
        
        questions_data = request.data.get("questions", [])
        if not isinstance(questions_data, list):
            return Response({"detail": "Invalid payload. 'questions' must be a list."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Get the existing questions mapped to this quiz
                existing_mappings = QuizQuestion.objects.filter(quiz=quiz)
                
                # Delete all existing mappings (clean slate) - optimized diffing can be done, but this is safest and fastest for typical sizes
                existing_mappings.delete()
                
                new_mappings = []
                for idx, q_data in enumerate(questions_data):
                    question_id = q_data.get("question_id")
                    if not question_id:
                        continue
                    
                    order = q_data.get("order", idx)
                    marks_override = q_data.get("marks_override", None)
                    
                    new_mappings.append(QuizQuestion(
                        quiz=quiz,
                        question_id=question_id,
                        order=order,
                        marks_override=marks_override
                    ))
                
                # Bulk create the new mappings in the specified order
                QuizQuestion.objects.bulk_create(new_mappings)
                
            return Response({"detail": "Questions synced successfully", "count": len(new_mappings)}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
