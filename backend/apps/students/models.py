import uuid

from django.conf import settings
from django.db import models
from django.db.models import Q

from apps.quizzes.models import Quiz, Question


class ExamAttempt(models.Model):
    class Status(models.TextChoices):
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        SUBMITTED = "SUBMITTED", "Submitted"
        EXPIRED = "EXPIRED", "Expired"
        EVALUATED = "EVALUATED", "Evaluated"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="exam_attempts",
    )

    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name="exam_attempts",
    )

    attempt_number = models.PositiveIntegerField(default=1)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.IN_PROGRESS,
    )

    started_at = models.DateTimeField(auto_now_add=True)

    expires_at = models.DateTimeField()

    submitted_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    score = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    max_score = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    submit_idempotency_key = models.CharField(
        max_length=128,
        null=True,
        blank=True,
        unique=True,
    )

    last_activity = models.DateTimeField(
        auto_now=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["student", "quiz", "attempt_number"],
                name="uniq_attempt_num",
            ),
        ]

        indexes = [
            models.Index(
                fields=["student", "quiz", "status"],
                name="att_stu_quiz_st",
            ),
            models.Index(
                fields=["quiz", "status"],
                name="att_quiz_st",
            ),
            models.Index(
                fields=["student", "status"],
                name="att_stu_st",
            ),
            models.Index(
                fields=["expires_at"],
                name="att_expires",
            ),
        ]

    def __str__(self):
        return (
            f"{self.student} - "
            f"{self.quiz} - "
            f"Attempt {self.attempt_number}"
        )


class Answer(models.Model):
    class Status(models.TextChoices):
        NOT_ANSWERED = "NOT_ANSWERED", "Not Answered"
        ANSWERED = "ANSWERED", "Answered"
        PENDING = "PENDING", "Pending"
        EVALUATED = "EVALUATED", "Evaluated"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    attempt = models.ForeignKey(
        ExamAttempt,
        on_delete=models.CASCADE,
        related_name="answers",
    )

    question = models.ForeignKey(
        Question,
        on_delete=models.PROTECT,
        related_name="exam_answers",
    )

    answer_data = models.JSONField(
        default=dict,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NOT_ANSWERED,
    )

    sequence = models.PositiveIntegerField(
        default=0,
    )

    idempotency_key = models.CharField(
        max_length=128,
        null=True,
        blank=True,
    )

    execution_result = models.JSONField(
        null=True,
        blank=True,
    )

    evaluated_score = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["attempt", "question"],
                name="uniq_ans_question",
            ),
            models.UniqueConstraint(
                fields=["attempt", "idempotency_key"],
                name="uniq_ans_idem",
            ),
        ]

        indexes = [
            models.Index(
                fields=["attempt", "status"],
                name="ans_attempt_st",
            ),
            models.Index(
                fields=["attempt", "sequence"],
                name="ans_attempt_seq",
            ),
            models.Index(
                fields=["question"],
                name="ans_question",
            ),
        ]

    def __str__(self):
        return f"{self.attempt} - {self.question}"