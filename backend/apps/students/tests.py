from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone

from rest_framework.test import APITestCase

from apps.quizzes.models import (
    Option,
    Question,
    Quiz,
    QuizQuestion,
)

from .models import Answer, ExamAttempt


User = get_user_model()


class StudentExamFlowTests(APITestCase):

    def setUp(self):
        self.student = User.objects.create_user(
            email="student@test.com",
            name="Test Student",
            password="Password123!",
            role="STUDENT",
        )

        self.teacher = User.objects.create_user(
            email="teacher@test.com",
            name="Test Teacher",
            password="Password123!",
            role="TEACHER",
        )

        self.quiz = Quiz.objects.create(
            teacher=self.teacher,
            title="Test Quiz",
            subject="Python",
            description="Exam test",
            duration_minutes=30,
            max_attempts=2,
            status=Quiz.Status.ACTIVE,
            starts_at=(
                timezone.now()
                - timedelta(minutes=5)
            ),
            ends_at=(
                timezone.now()
                + timedelta(hours=1)
            ),
        )

        self.question = Question.objects.create(
            teacher=self.teacher,
            title="Addition",
            text="What is 2 + 2?",
            question_type=(
                Question.QuestionType.MCQ
            ),
            difficulty=(
                Question.Difficulty.EASY
            ),
            marks=5,
        )

        self.correct_option = Option.objects.create(
            question=self.question,
            text="4",
            is_correct=True,
            order=1,
        )

        Option.objects.create(
            question=self.question,
            text="5",
            is_correct=False,
            order=2,
        )

        QuizQuestion.objects.create(
            quiz=self.quiz,
            question=self.question,
            order=1,
        )

        self.client.force_authenticate(
            user=self.student
        )

    def start_exam(self):
        return self.client.post(
            f"/api/v1/student/"
            f"quizzes/{self.quiz.id}/start/"
        )

    def test_student_access(self):
        response = self.client.get(
            "/api/v1/student/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

    def test_start_exam(self):
        response = self.start_exam()

        self.assertEqual(
            response.status_code,
            201,
        )

        self.assertEqual(
            ExamAttempt.objects.count(),
            1,
        )

        attempt = ExamAttempt.objects.first()

        self.assertEqual(
            attempt.student,
            self.student,
        )

        self.assertEqual(
            attempt.quiz,
            self.quiz,
        )

        self.assertEqual(
            attempt.status,
            ExamAttempt.Status.IN_PROGRESS,
        )

    def test_resume_existing_attempt(self):
        first = self.start_exam()
        second = self.start_exam()

        self.assertEqual(
            first.status_code,
            201,
        )

        self.assertEqual(
            second.status_code,
            200,
        )

        self.assertEqual(
            ExamAttempt.objects.count(),
            1,
        )

        self.assertEqual(
            first.data["id"],
            second.data["id"],
        )

    def test_start_exam_respects_max_attempts(self):
        first = self.start_exam()

        attempt = ExamAttempt.objects.get(
            id=first.data["id"]
        )

        attempt.status = (
            ExamAttempt.Status.SUBMITTED
        )

        attempt.submitted_at = timezone.now()

        attempt.save()

        second = self.start_exam()

        self.assertEqual(
            second.status_code,
            201,
        )

        second_attempt = ExamAttempt.objects.exclude(
            id=attempt.id
        ).first()

        second_attempt.status = (
            ExamAttempt.Status.SUBMITTED
        )

        second_attempt.submitted_at = (
            timezone.now()
        )

        second_attempt.save()

        third = self.start_exam()

        self.assertEqual(
            third.status_code,
            400,
        )

    def test_get_attempt(self):
        response = self.start_exam()

        attempt_id = response.data["id"]

        response = self.client.get(
            f"/api/v1/student/"
            f"attempts/{attempt_id}/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.data["id"],
            attempt_id,
        )

        self.assertEqual(
            len(response.data["questions"]),
            1,
        )

    def test_save_answer(self):
        response = self.start_exam()

        attempt_id = response.data["id"]

        response = self.client.post(
            f"/api/v1/student/"
            f"attempts/{attempt_id}/answers/",
            {
                "question": self.question.id,
                "answer_data": {
                    "option_id": (
                        self.correct_option.id
                    )
                },
                "sequence": 1,
                "idempotency_key": "answer-1",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        self.assertEqual(
            Answer.objects.count(),
            1,
        )

    def test_update_answer(self):
        response = self.start_exam()

        attempt_id = response.data["id"]

        url = (
            f"/api/v1/student/"
            f"attempts/{attempt_id}/answers/"
        )

        first = self.client.post(
            url,
            {
                "question": self.question.id,
                "answer_data": {
                    "option_id": 999
                },
                "sequence": 1,
                "idempotency_key": "answer-1",
            },
            format="json",
        )

        self.assertEqual(
            first.status_code,
            201,
        )

        second = self.client.post(
            url,
            {
                "question": self.question.id,
                "answer_data": {
                    "option_id": (
                        self.correct_option.id
                    )
                },
                "sequence": 2,
                "idempotency_key": "answer-2",
            },
            format="json",
        )

        self.assertEqual(
            second.status_code,
            200,
        )

        answer = Answer.objects.get(
            attempt_id=attempt_id,
            question=self.question,
        )

        self.assertEqual(
            answer.sequence,
            2,
        )

    def test_stale_sequence_is_ignored(self):
        response = self.start_exam()

        attempt_id = response.data["id"]

        url = (
            f"/api/v1/student/"
            f"attempts/{attempt_id}/answers/"
        )

        self.client.post(
            url,
            {
                "question": self.question.id,
                "answer_data": {
                    "option_id": 1
                },
                "sequence": 5,
                "idempotency_key": "key-5",
            },
            format="json",
        )

        response = self.client.post(
            url,
            {
                "question": self.question.id,
                "answer_data": {
                    "option_id": 2
                },
                "sequence": 3,
                "idempotency_key": "key-3",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        answer = Answer.objects.get(
            attempt_id=attempt_id,
            question=self.question,
        )

        self.assertEqual(
            answer.sequence,
            5,
        )

    def test_answer_idempotency(self):
        response = self.start_exam()

        attempt_id = response.data["id"]

        url = (
            f"/api/v1/student/"
            f"attempts/{attempt_id}/answers/"
        )

        payload = {
            "question": self.question.id,
            "answer_data": {
                "option_id": (
                    self.correct_option.id
                )
            },
            "sequence": 1,
            "idempotency_key": "same-key",
        }

        first = self.client.post(
            url,
            payload,
            format="json",
        )

        second = self.client.post(
            url,
            payload,
            format="json",
        )

        self.assertEqual(
            first.status_code,
            201,
        )

        self.assertEqual(
            second.status_code,
            200,
        )

        self.assertEqual(
            Answer.objects.count(),
            1,
        )

    def test_get_answers(self):
        response = self.start_exam()

        attempt_id = response.data["id"]

        self.client.post(
            f"/api/v1/student/"
            f"attempts/{attempt_id}/answers/",
            {
                "question": self.question.id,
                "answer_data": {
                    "option_id": (
                        self.correct_option.id
                    )
                },
                "sequence": 1,
                "idempotency_key": "answer-get",
            },
            format="json",
        )

        response = self.client.get(
            f"/api/v1/student/"
            f"attempts/{attempt_id}/answers/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            len(response.data),
            1,
        )

    def test_submit_exam_and_evaluate_mcq(self):
        response = self.start_exam()

        attempt_id = response.data["id"]

        self.client.post(
            f"/api/v1/student/"
            f"attempts/{attempt_id}/answers/",
            {
                "question": self.question.id,
                "answer_data": {
                    "option_id": (
                        self.correct_option.id
                    )
                },
                "sequence": 1,
                "idempotency_key": "answer-submit",
            },
            format="json",
        )

        response = self.client.post(
            f"/api/v1/student/"
            f"attempts/{attempt_id}/submit/",
            {
                "idempotency_key": "submit-1"
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        attempt = ExamAttempt.objects.get(
            id=attempt_id
        )

        self.assertEqual(
            attempt.status,
            ExamAttempt.Status.SUBMITTED,
        )

        self.assertEqual(
            attempt.score,
            5,
        )

    def test_duplicate_submit_is_idempotent(self):
        response = self.start_exam()

        attempt_id = response.data["id"]

        url = (
            f"/api/v1/student/"
            f"attempts/{attempt_id}/submit/"
        )

        first = self.client.post(
            url,
            {
                "idempotency_key": "submit-same"
            },
            format="json",
        )

        second = self.client.post(
            url,
            {
                "idempotency_key": "submit-same"
            },
            format="json",
        )

        self.assertEqual(
            first.status_code,
            200,
        )

        self.assertEqual(
            second.status_code,
            200,
        )

        self.assertEqual(
            ExamAttempt.objects.filter(
                id=attempt_id,
                status=(
                    ExamAttempt.Status.SUBMITTED
                ),
            ).count(),
            1,
        )

    def test_expired_attempt_cannot_save_answer(self):
        response = self.start_exam()

        attempt_id = response.data["id"]

        attempt = ExamAttempt.objects.get(
            id=attempt_id
        )

        attempt.expires_at = (
            timezone.now()
            - timedelta(seconds=1)
        )

        attempt.save()

        response = self.client.post(
            f"/api/v1/student/"
            f"attempts/{attempt_id}/answers/",
            {
                "question": self.question.id,
                "answer_data": {
                    "option_id": (
                        self.correct_option.id
                    )
                },
                "sequence": 1,
                "idempotency_key": "expired",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        attempt.refresh_from_db()

        self.assertEqual(
            attempt.status,
            ExamAttempt.Status.EXPIRED,
        )

    def test_teacher_cannot_start_exam(self):
        self.client.force_authenticate(
            user=self.teacher
        )

        response = self.start_exam()

        self.assertEqual(
            response.status_code,
            403,
        )

    def test_student_cannot_access_other_attempt(self):
        response = self.start_exam()

        attempt_id = response.data["id"]

        other_student = User.objects.create_user(
            email="other@test.com",
            name="Other Student",
            password="Password123!",
            role="STUDENT",
        )

        self.client.force_authenticate(
            user=other_student
        )

        response = self.client.get(
            f"/api/v1/student/"
            f"attempts/{attempt_id}/"
        )

        self.assertEqual(
            response.status_code,
            404,
        )