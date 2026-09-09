from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
import uuid
from apps.quizzes.models import Quiz


User = get_user_model()


class JoinQuizTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.student = User.objects.create_user(
            email="student@test.com",
            password="Student@123",
            name="Test Student",
            role="STUDENT",
        )

        self.teacher = User.objects.create_user(
            email="teacher@test.com",
            password="Teacher@123",
            name="Test Teacher",
            role="TEACHER",
        )

        self.quiz_code = str(uuid.uuid4())

        self.quiz = Quiz.objects.create(
            teacher=self.teacher,
            title="Test Quiz",
            subject="Python",
            description="Test quiz",
            quiz_code=self.quiz_code,
            status="DRAFT",
            duration_minutes=30,
            max_attempts=1,
            password="123456",
        )

    def test_student_can_join_quiz(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(
            "/api/v1/student/join-quiz/",
            {
                "quiz_code": uuid.uuid4(),
                "password": "123456",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["message"],
            "Quiz joined successfully.",
        )

    def test_invalid_quiz_code(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(
            "/api/v1/student/join-quiz/",
            {
                "quiz_code": str(uuid.uuid4()),
                "password": "123456",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 404)

    def test_invalid_password(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(
            "/api/v1/student/join-quiz/",
            {
                "quiz_code": "TEST123",
                "password": "wrong",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_missing_data(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(
            "/api/v1/student/join-quiz/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_unauthenticated_user_cannot_join(self):
        response = self.client.post(
            "/api/v1/student/join-quiz/",
            {
                "quiz_code": "TEST123",
                "password": "123456",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 401)

    def test_teacher_cannot_join_quiz(self):
        self.client.force_authenticate(user=self.teacher)

        response = self.client.post(
            "/api/v1/student/join-quiz/",
            {
                "quiz_code": "TEST123",
                "password": "123456",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)