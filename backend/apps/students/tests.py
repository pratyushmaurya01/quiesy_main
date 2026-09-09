from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.test import TestCase

from rest_framework.test import APIClient

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

        self.password_quiz = Quiz.objects.create(
            teacher=self.teacher,
            title="Python Quiz",
            subject="Python",
            description="Test quiz",
            status="DRAFT",
            duration_minutes=30,
            max_attempts=1,
            password=make_password("123456"),
        )

        self.no_password_quiz = Quiz.objects.create(
            teacher=self.teacher,
            title="Open Python Quiz",
            subject="Python",
            description="Quiz without password",
            status="DRAFT",
            duration_minutes=30,
            max_attempts=1,
            password="",
        )

    def test_student_can_join_quiz_without_password(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(
            "/api/v1/student/join-quiz/",
            {
                "quiz_code": self.no_password_quiz.quiz_code,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["message"],
            "Quiz joined successfully.",
        )

    def test_student_can_join_with_correct_password(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(
            "/api/v1/student/join-quiz/",
            {
                "quiz_code": self.password_quiz.quiz_code,
                "password": "123456",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)

    def test_student_cannot_join_with_wrong_password(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(
            "/api/v1/student/join-quiz/",
            {
                "quiz_code": self.password_quiz.quiz_code,
                "password": "wrong",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_password_required_for_protected_quiz(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(
            "/api/v1/student/join-quiz/",
            {
                "quiz_code": self.password_quiz.quiz_code,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_invalid_quiz_code(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(
            "/api/v1/student/join-quiz/",
            {
                "quiz_code": "WRONG1",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 404)

    def test_missing_quiz_code(self):
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
                "quiz_code": "WRONG1",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 401)

    def test_teacher_cannot_join_quiz(self):
        self.client.force_authenticate(user=self.teacher)

        response = self.client.post(
            "/api/v1/student/join-quiz/",
            {
                "quiz_code": self.password_quiz.quiz_code,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)


class QuizDiscoveryTests(TestCase):

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

    def create_quiz(
        self,
        title,
        subject,
        description="Test quiz",
        status="ACTIVE",
        password="",
    ):
        return Quiz.objects.create(
            teacher=self.teacher,
            title=title,
            subject=subject,
            description=description,
            status=status,
            duration_minutes=30,
            max_attempts=1,
            password=password,
        )

    def test_student_can_discover_quizzes(self):
        self.client.force_authenticate(user=self.student)

        self.create_quiz(
            title="DSA Quiz",
            subject="Data Structures",
            description="Arrays and strings",
        )

        response = self.client.get(
            "/api/v1/student/quizzes/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["results"][0]["title"],
            "DSA Quiz",
        )

    def test_student_can_search_quiz(self):
        self.client.force_authenticate(user=self.student)

        self.create_quiz(
            title="Python Programming",
            subject="Programming",
            description="Python basics",
        )

        self.create_quiz(
            title="Java Programming",
            subject="Programming",
            description="Java basics",
        )

        response = self.client.get(
            "/api/v1/student/quizzes/?search=Python"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["results"][0]["title"],
            "Python Programming",
        )

    def test_student_can_search_by_subject(self):
        self.client.force_authenticate(user=self.student)

        self.create_quiz(
            title="Algorithms Quiz",
            subject="Data Structures",
        )

        response = self.client.get(
            "/api/v1/student/quizzes/?search=Data"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)

    def test_student_can_search_by_teacher_name(self):
        self.client.force_authenticate(user=self.student)

        self.create_quiz(
            title="Algorithms Quiz",
            subject="DSA",
        )

        response = self.client.get(
            "/api/v1/student/quizzes/?search=Test Teacher"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)

    def test_draft_quizzes_are_not_discoverable(self):
        self.client.force_authenticate(user=self.student)

        self.create_quiz(
            title="Draft Quiz",
            subject="Python",
            status="DRAFT",
        )

        response = self.client.get(
            "/api/v1/student/quizzes/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 0)

    def test_closed_quizzes_are_not_discoverable(self):
        self.client.force_authenticate(user=self.student)

        self.create_quiz(
            title="Closed Quiz",
            subject="Python",
            status="CLOSED",
        )

        response = self.client.get(
            "/api/v1/student/quizzes/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 0)

    def test_quiz_password_is_not_exposed(self):
        self.client.force_authenticate(user=self.student)

        self.create_quiz(
            title="Secure Quiz",
            subject="Python",
            password=make_password("secret"),
        )

        response = self.client.get(
            "/api/v1/student/quizzes/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertNotIn(
            "password",
            response.data["results"][0],
        )

    def test_teacher_cannot_discover_quizzes(self):
        self.client.force_authenticate(user=self.teacher)

        response = self.client.get(
            "/api/v1/student/quizzes/"
        )

        self.assertEqual(response.status_code, 403)

    def test_unauthenticated_user_cannot_discover_quizzes(self):
        response = self.client.get(
            "/api/v1/student/quizzes/"
        )

        self.assertEqual(response.status_code, 401)


class QuizDiscoveryPaginationTests(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            email="student-pagination@example.com",
            password="password123",
            name="Pagination Student",
            role="STUDENT",
        )

        self.teacher = User.objects.create_user(
            email="teacher-pagination@example.com",
            password="password123",
            name="Pagination Teacher",
            role="TEACHER",
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.student)

    def create_quiz(self, number):
        return Quiz.objects.create(
            teacher=self.teacher,
            title=f"Pagination Quiz {number}",
            subject="Computer Science",
            description=f"Description {number}",
            status=Quiz.Status.ACTIVE,
            duration_minutes=30,
            max_attempts=1,
        )

    def test_discovery_is_paginated(self):
        for number in range(25):
            self.create_quiz(number)

        response = self.client.get(
            "/api/v1/student/quizzes/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 25)
        self.assertEqual(len(response.data["results"]), 20)

    def test_discovery_second_page(self):
        for number in range(25):
            self.create_quiz(number)

        response = self.client.get(
            "/api/v1/student/quizzes/?page=2"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 25)
        self.assertEqual(len(response.data["results"]), 5)

    def test_discovery_page_size_cannot_be_changed(self):
        for number in range(25):
            self.create_quiz(number)

        response = self.client.get(
            "/api/v1/student/quizzes/?page=1&page_size=5"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 20)