from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
import uuid
import secrets
import string

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

class Question(models.Model):
    class QuestionType(models.TextChoices):
        MCQ = "MCQ", "Multiple Choice"
        MSQ = "MSQ", "Multiple Select"
        SUBJECTIVE = "SUBJECTIVE", "Subjective"
        CODING = "CODING", "Coding"

    class Difficulty(models.TextChoices):
        EASY = "EASY", "Easy"
        MEDIUM = "MEDIUM", "Medium"
        HARD = "HARD", "Hard"

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="questions",
    )

    title = models.CharField(max_length=255, blank=True)
    text = models.TextField()

    question_type = models.CharField(
        max_length=20,
        choices=QuestionType.choices,
        default=QuestionType.MCQ,
    )

    difficulty = models.CharField(
        max_length=10,
        choices=Difficulty.choices,
        default=Difficulty.MEDIUM,
    )

    topic = models.CharField(max_length=100, blank=True)

    marks = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
    )

    starter_code = models.TextField(blank=True)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title or f"Question {self.pk}"


class Option(models.Model):
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="options",
    )

    text = models.CharField(max_length=500)

    is_correct = models.BooleanField(default=False)

    order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.text


class TestCase(models.Model):
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="test_cases",
    )

    input_data = models.TextField()
    expected_output = models.TextField()

    is_sample = models.BooleanField(default=False)

    order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"TestCase for Question {self.question_id}"


class QuestionVersion(models.Model):
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="versions",
    )

    version = models.PositiveIntegerField()

    text = models.TextField()

    question_type = models.CharField(
        max_length=20,
        choices=Question.QuestionType.choices,
    )

    marks = models.PositiveIntegerField()

    starter_code = models.TextField(blank=True)

    snapshot = models.JSONField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["question", "version"],
                name="unique_question_version",
            )
        ]
        ordering = ["-version"]

    def __str__(self):
        return f"{self.question_id} - v{self.version}"


class Quiz(models.Model):
    def generate_quiz_code():
        alphabet = string.ascii_uppercase + string.digits
        while True:
            code = ''.join(secrets.choice(alphabet) for _ in range(6))
            if not Quiz.objects.filter(quiz_code=code).exists():
                return code
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SCHEDULED = "SCHEDULED", "Scheduled"
        ACTIVE = "ACTIVE", "Active"
        CLOSED = "CLOSED", "Closed"
        EVALUATED = "EVALUATED", "Evaluated"

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="quizzes",
    )

    title = models.CharField(max_length=200)

    subject = models.CharField(max_length=100)

    description = models.TextField(blank=True)

    quiz_code = models.CharField(
        max_length=6,
        unique=True,
        editable=False,
        default=generate_quiz_code,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    duration_minutes = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
    )

    starts_at = models.DateTimeField(null=True, blank=True)

    ends_at = models.DateTimeField(null=True, blank=True)

    max_attempts = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
    )

    password = models.CharField(
        max_length=128,
        blank=True,
    )

    review_enabled = models.BooleanField(default=True)

    shuffle_questions = models.BooleanField(default=False)

    shuffle_options = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["teacher", "status"], name="quiz_teacher_st"),
            models.Index(fields=["status", "starts_at", "ends_at"], name="quiz_st_dates"),
            models.Index(fields=["quiz_code"], name="quiz_code_idx"),
        ]

    def __str__(self):
        return self.title


class QuizQuestion(models.Model):
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name="quiz_questions",
    )

    question = models.ForeignKey(
        Question,
        on_delete=models.PROTECT,
        related_name="quiz_usages",
    )

    order = models.PositiveIntegerField(default=0)

    marks_override = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

        constraints = [
            models.UniqueConstraint(
                fields=["quiz", "question"],
                name="unique_question_in_quiz",
            )
        ]
        indexes = [
            models.Index(fields=["quiz", "order"], name="quiz_q_order"),
            models.Index(fields=["quiz", "question"], name="quiz_q_composite"),
        ]

    def __str__(self):
        return f"{self.quiz.title} - {self.question_id}"

