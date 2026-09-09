from rest_framework import serializers

from apps.quizzes.models import Quiz


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