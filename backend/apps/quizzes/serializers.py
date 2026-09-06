from rest_framework import serializers

from .models import (
    Question,
    Option,
    TestCase,
    QuestionVersion,
    Quiz,
    QuizQuestion,
)


class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = [
            "id",
            "text",
            "is_correct",
            "order",
        ]
        read_only_fields = ["id"]


class TestCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestCase
        fields = [
            "id",
            "input_data",
            "expected_output",
            "is_sample",
            "order",
        ]
        read_only_fields = ["id"]


class QuestionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, required=False)
    test_cases = TestCaseSerializer(many=True, required=False)

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
            "is_active",
            "options",
            "test_cases",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        question_type = attrs.get(
            "question_type",
            getattr(
                self.instance,
                "question_type",
                None,
            ),
        )

        options_provided = "options" in attrs
        test_cases_provided = "test_cases" in attrs

        options = attrs.get("options", [])
        test_cases = attrs.get("test_cases", [])

        if question_type in [
            Question.QuestionType.MCQ,
            Question.QuestionType.MSQ,
        ]:
            if options_provided or self.instance is None:
                if not options:
                    raise serializers.ValidationError(
                        {
                            "options": (
                                "Options are required for "
                                "MCQ/MSQ questions."
                            )
                        }
                    )

                correct_count = sum(
                    1
                    for option in options
                    if option.get("is_correct", False)
                )

                if question_type == Question.QuestionType.MCQ:
                    if correct_count != 1:
                        raise serializers.ValidationError(
                            {
                                "options": (
                                    "MCQ must have exactly "
                                    "one correct option."
                                )
                            }
                        )

                if question_type == Question.QuestionType.MSQ:
                    if correct_count < 1:
                        raise serializers.ValidationError(
                            {
                                "options": (
                                    "MSQ must have at least "
                                    "one correct option."
                                )
                            }
                        )

            if test_cases_provided and test_cases:
                raise serializers.ValidationError(
                    {
                        "test_cases": (
                            "MCQ/MSQ cannot have test cases."
                        )
                    }
                )

        elif question_type == Question.QuestionType.SUBJECTIVE:
            if options_provided and options:
                raise serializers.ValidationError(
                    {
                        "options": (
                            "Subjective questions cannot "
                            "have options."
                        )
                    }
                )

            if test_cases_provided and test_cases:
                raise serializers.ValidationError(
                    {
                        "test_cases": (
                            "Subjective questions cannot "
                            "have test cases."
                        )
                    }
                )

        elif question_type == Question.QuestionType.CODING:
            if options_provided and options:
                raise serializers.ValidationError(
                    {
                        "options": (
                            "Coding questions cannot "
                            "have options."
                        )
                    }
                )

            if test_cases_provided or self.instance is None:
                if not test_cases:
                    raise serializers.ValidationError(
                        {
                            "test_cases": (
                                "Coding questions require "
                                "test cases."
                            )
                        }
                    )

        return attrs

    def create(self, validated_data):
        options_data = validated_data.pop("options", [])
        test_cases_data = validated_data.pop("test_cases", [])

        question = Question.objects.create(**validated_data)

        for option_data in options_data:
            Option.objects.create(question=question, **option_data)

        for test_case_data in test_cases_data:
            TestCase.objects.create(question=question, **test_case_data)

        return question


class QuestionVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionVersion
        fields = [
            "id",
            "version",
            "text",
            "question_type",
            "marks",
            "starter_code",
            "snapshot",
            "created_at",
        ]
        read_only_fields = fields


class QuizQuestionSerializer(serializers.ModelSerializer):
    quiz = serializers.PrimaryKeyRelatedField(
        read_only=True
    )

    question = serializers.PrimaryKeyRelatedField(
        queryset=Question.objects.filter(is_active=True)
    )

    class Meta:
        model = QuizQuestion
        fields = [
            "id",
            "quiz",
            "question",
            "order",
            "marks_override",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "quiz",
            "created_at",
        ]

    def validate(self, attrs):
        quiz = self.context.get("quiz")
        question = attrs.get("question")

        if quiz and QuizQuestion.objects.filter(
            quiz=quiz,
            question=question,
        ).exists():
            raise serializers.ValidationError(
                {
                    "question": (
                        "This question is already added "
                        "to the quiz."
                    )
                }
            )

        return attrs


class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = [
            "id",
            "title",
            "subject",
            "description",
            "quiz_code",
            "status",
            "duration_minutes",
            "starts_at",
            "ends_at",
            "max_attempts",
            "password",
            "review_enabled",
            "shuffle_questions",
            "shuffle_options",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "quiz_code",
            "status",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        starts_at = attrs.get("starts_at")
        ends_at = attrs.get("ends_at")

        if starts_at and ends_at and ends_at <= starts_at:
            raise serializers.ValidationError(
                {"ends_at": "End time must be after start time."}
            )

        return attrs 