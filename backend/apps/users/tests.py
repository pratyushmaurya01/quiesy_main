from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from datetime import timedelta

from .models import User


class AuthenticationAndRBACTest(APITestCase):

    def setUp(self):
        self.student = User.objects.create_user(
            email="student@test.com",
            name="Student",
            password="TestPass123",
            role="STUDENT",
        )

        self.teacher = User.objects.create_user(
            email="teacher@test.com",
            name="Teacher",
            password="TestPass123",
            role="TEACHER",
        )

        self.admin = User.objects.create_user(
            email="admin@test.com",
            name="Admin",
            password="TestPass123",
            role="ADMIN",
        )

# Add these methods inside AuthenticationAndRBACTest:

    def test_verify_email_success(self):
        user = self.student

        otp = "123456"
        from .services import save_otp

        save_otp(user, otp)

        response = self.client.post(
            "/api/v1/auth/verify-email/",
            {
                "email": user.email,
                "otp": otp,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        user.refresh_from_db()
        self.assertTrue(user.is_verified)
        self.assertIsNone(user.verification_otp)


    def test_verify_email_wrong_otp(self):
        user = self.student

        from .services import save_otp

        save_otp(user, "123456")

        response = self.client.post(
            "/api/v1/auth/verify-email/",
            {
                "email": user.email,
                "otp": "999999",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_verify_email_expired_otp(self):
        user = self.student

        from .services import save_otp

        save_otp(user, "123456")

        user.otp_created_at = timezone.now() - timedelta(minutes=11)
        user.save(update_fields=["otp_created_at"])

        response = self.client.post(
            "/api/v1/auth/verify-email/",
            {
                "email": user.email,
                "otp": "123456",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_resend_otp(self):
        user = self.student

        response = self.client.post(
            "/api/v1/auth/resend-otp/",
            {"email": user.email},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        user.refresh_from_db()
        self.assertIsNotNone(user.verification_otp)
        self.assertIsNotNone(user.otp_created_at)

    def login(self, email):
        return self.client.post(
            "/api/v1/auth/login/",
            {
                "email": email,
                "password": "TestPass123",
            },
        )

    def test_student_login_and_me(self):
        response = self.login("student@test.com")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {response.data['access']}"
        )

        response = self.client.get("/api/v1/auth/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role"], "STUDENT")

    def test_teacher_login_and_me(self):
        response = self.login("teacher@test.com")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {response.data['access']}"
        )

        response = self.client.get("/api/v1/auth/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role"], "TEACHER")

    def test_admin_login_and_me(self):
        response = self.login("admin@test.com")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {response.data['access']}"
        )

        response = self.client.get("/api/v1/auth/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role"], "ADMIN")

    def test_rbac_permissions(self):
        users = [
            ("student@test.com", "/api/v1/auth/test/student/", True),
            ("student@test.com", "/api/v1/auth/test/teacher/", False),
            ("student@test.com", "/api/v1/auth/test/admin/", False),

            ("teacher@test.com", "/api/v1/auth/test/student/", False),
            ("teacher@test.com", "/api/v1/auth/test/teacher/", True),
            ("teacher@test.com", "/api/v1/auth/test/admin/", False),

            ("admin@test.com", "/api/v1/auth/test/student/", False),
            ("admin@test.com", "/api/v1/auth/test/teacher/", False),
            ("admin@test.com", "/api/v1/auth/test/admin/", True),
        ]

        for email, url, allowed in users:
            response = self.login(email)

            self.client.credentials(
                HTTP_AUTHORIZATION=f"Bearer {response.data['access']}"
            )

            response = self.client.get(url)

            expected = status.HTTP_200_OK if allowed else status.HTTP_403_FORBIDDEN

            self.assertEqual(response.status_code, expected)