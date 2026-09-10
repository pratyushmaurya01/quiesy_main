from rest_framework import serializers

from apps.quizzes.models import Question, Quiz, QuizQuestion

from .models import Answer, ExamAttempt


class QuizDiscoverySerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(
        source="teacher.name",
        read_only=True,
    )

    class Meta:
        model = Quiz
        fields = [
            "id",
            "title",
            "subject",
            "description",
            "teacher_name",
            "quiz_code",
            "status",
            "duration_minutes",
            "max_attempts",
            "review_enabled",
            "shuffle_questions",
            "shuffle_options",
        ]


class StudentQuestionSerializer(serializers.ModelSerializer):
    options = serializers.SerializerMethodField()
    test_cases = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            "id",
            "title",
            "text",
            "question_type",
            "difficulty",
            "topic",
            "marks",
            "starter_code",
            "options",
            "test_cases",
        ]

    def get_options(self, obj):
        return [
            {
                "id": option.id,
                "text": option.text,
                "order": option.order,
            }
            for option in obj.options.all()
        ]

    def get_test_cases(self, obj):
        return [
            {
                "id": test_case.id,
                "input_data": test_case.input_data,
                "expected_output": test_case.expected_output,
                "is_sample": test_case.is_sample,
                "order": test_case.order,
            }
            for test_case in obj.test_cases.all()
            if test_case.is_sample
        ]


class AttemptQuestionSerializer(serializers.ModelSerializer):
    question = StudentQuestionSerializer(
        read_only=True
    )

    class Meta:
        model = QuizQuestion
        fields = [
            "id",
            "question",
            "order",
            "marks_override",
        ]


class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = [
            "id",
            "attempt",
            "question",
            "answer_data",
            "status",
            "sequence",
            "idempotency_key",
            "execution_result",
            "evaluated_score",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "attempt",
            "status",
            "execution_result",
            "evaluated_score",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        attempt = self.context["attempt"]
        question = attrs.get("question")

        if question is None:
            raise serializers.ValidationError(
                {"question": "Question is required."}
            )

        if not QuizQuestion.objects.filter(
            quiz=attempt.quiz,
            question=question,
        ).exists():
            raise serializers.ValidationError(
                {
                    "question": (
                        "This question does not belong "
                        "to this quiz."
                    )
                }
            )

        return attrs


class AttemptSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(
        many=True,
        read_only=True,
    )

    questions = serializers.SerializerMethodField()

    class Meta:
        model = ExamAttempt
        fields = [
            "id",
            "quiz",
            "attempt_number",
            "status",
            "started_at",
            "expires_at",
            "submitted_at",
            "score",
            "max_score",
            "last_activity_at",
            "answers",
            "questions",
        ]

        read_only_fields = fields

    def get_questions(self, obj):
        quiz_questions = (
            QuizQuestion.objects
            .filter(quiz=obj.quiz)
            .select_related("question")
            .prefetch_related(
                "question__options",
                "question__test_cases",
            )
            .order_by("order", "id")
        )

        return AttemptQuestionSerializer(
            quiz_questions,
            many=True,
        ).data