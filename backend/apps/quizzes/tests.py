# from django.test import TestCase
# from django.utils import timezone
# from datetime import timedelta

# from apps.users.models import User
# from .models import Question, Option, TestCase as QuestionTestCase, Quiz, QuizQuestion
# from .serializers import QuestionSerializer, QuizSerializer


# class QuizSerializerTests(TestCase):

#     def setUp(self):
#         self.teacher = User.objects.create_user(
#             email="teacher@test.com",
#             name="Test Teacher",
#             password="Test@123",
#             role="TEACHER",
#         )

#         self.request = type(
#             "Request",
#             (),
#             {"user": self.teacher},
#         )()

#     def question_serializer(self, data):
#         return QuestionSerializer(
#             data=data,
#             context={"request": self.request},
#         )

#     def test_valid_mcq(self):
#         serializer = self.question_serializer({
#             "title": "Capital of India",
#             "text": "What is the capital of India?",
#             "question_type": "MCQ",
#             "difficulty": "EASY",
#             "topic": "Geography",
#             "marks": 1,
#             "options": [
#                 {"text": "Delhi", "is_correct": True, "order": 1},
#                 {"text": "Mumbai", "is_correct": False, "order": 2},
#             ],
#         })

#         self.assertTrue(serializer.is_valid(), serializer.errors)

#     def test_mcq_without_options(self):
#         serializer = self.question_serializer({
#             "title": "Test",
#             "text": "Test question",
#             "question_type": "MCQ",
#             "marks": 1,
#         })

#         self.assertFalse(serializer.is_valid())

#     def test_mcq_multiple_correct_options(self):
#         serializer = self.question_serializer({
#             "title": "Test",
#             "text": "Test question",
#             "question_type": "MCQ",
#             "marks": 1,
#             "options": [
#                 {"text": "A", "is_correct": True},
#                 {"text": "B", "is_correct": True},
#             ],
#         })

#         self.assertFalse(serializer.is_valid())

#     def test_valid_msq(self):
#         serializer = self.question_serializer({
#             "title": "Test",
#             "text": "Select correct options",
#             "question_type": "MSQ",
#             "marks": 2,
#             "options": [
#                 {"text": "A", "is_correct": True},
#                 {"text": "B", "is_correct": True},
#                 {"text": "C", "is_correct": False},
#             ],
#         })

#         self.assertTrue(serializer.is_valid(), serializer.errors)

#     def test_msq_without_correct_option(self):
#         serializer = self.question_serializer({
#             "title": "Test",
#             "text": "Select correct options",
#             "question_type": "MSQ",
#             "marks": 2,
#             "options": [
#                 {"text": "A", "is_correct": False},
#                 {"text": "B", "is_correct": False},
#             ],
#         })

#         self.assertFalse(serializer.is_valid())

#     def test_valid_subjective(self):
#         serializer = self.question_serializer({
#             "title": "Explain OOP",
#             "text": "Explain object oriented programming.",
#             "question_type": "SUBJECTIVE",
#             "marks": 5,
#         })

#         self.assertTrue(serializer.is_valid(), serializer.errors)

#     def test_subjective_with_options(self):
#         serializer = self.question_serializer({
#             "title": "Test",
#             "text": "Explain OOP.",
#             "question_type": "SUBJECTIVE",
#             "marks": 5,
#             "options": [
#                 {"text": "A", "is_correct": True},
#             ],
#         })

#         self.assertFalse(serializer.is_valid())

#     def test_valid_coding(self):
#         serializer = self.question_serializer({
#             "title": "Two Sum",
#             "text": "Write a program to find two numbers.",
#             "question_type": "CODING",
#             "marks": 10,
#             "starter_code": "def solution():",
#             "test_cases": [
#                 {
#                     "input_data": "2 3",
#                     "expected_output": "5",
#                     "is_sample": True,
#                     "order": 1,
#                 }
#             ],
#         })

#         self.assertTrue(serializer.is_valid(), serializer.errors)

#     def test_coding_without_test_cases(self):
#         serializer = self.question_serializer({
#             "title": "Test",
#             "text": "Write a program.",
#             "question_type": "CODING",
#             "marks": 10,
#         })

#         self.assertFalse(serializer.is_valid())

#     def test_coding_with_options(self):
#         serializer = self.question_serializer({
#             "title": "Test",
#             "text": "Write a program.",
#             "question_type": "CODING",
#             "marks": 10,
#             "options": [
#                 {"text": "A", "is_correct": True},
#             ],
#             "test_cases": [
#                 {
#                     "input_data": "1",
#                     "expected_output": "1",
#                 }
#             ],
#         })

#         self.assertFalse(serializer.is_valid())

#     def test_quiz_invalid_dates(self):
#         serializer = QuizSerializer(data={
#             "title": "DSA Test",
#             "subject": "DSA",
#             "description": "Test",
#             "duration_minutes": 60,
#             "starts_at": timezone.now() + timedelta(hours=2),
#             "ends_at": timezone.now() + timedelta(hours=1),
#             "max_attempts": 1,
#         })

#         self.assertFalse(serializer.is_valid())

#     def test_quiz_valid(self):
#         serializer = QuizSerializer(data={
#             "title": "DSA Test",
#             "subject": "DSA",
#             "description": "Test",
#             "duration_minutes": 60,
#             "max_attempts": 1,
#         })

#         self.assertTrue(serializer.is_valid(), serializer.errors)



###   TESTING ALL APIS NOW 


from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User
from .models import (
    Question,
    Option,
    TestCase,
    QuestionVersion,
    Quiz,
    QuizQuestion,
)


class QuizTestBase(APITestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            email="teacher@example.com",
            name="Teacher",
            password="TeacherPass123",
            role="TEACHER",
        )

        self.teacher_2 = User.objects.create_user(
            email="teacher2@example.com",
            name="Teacher Two",
            password="TeacherPass123",
            role="TEACHER",
        )

        self.student = User.objects.create_user(
            email="student@example.com",
            name="Student",
            password="StudentPass123",
            role="STUDENT",
        )

        self.question_url = reverse("question-list")
        self.quiz_url = reverse("quiz-list")
        self.quiz_question_url = reverse(
            "quiz-question-list"
        )

    def authenticate(self, user):
        self.client.force_authenticate(user=user)


class QuestionSerializerValidationTests(QuizTestBase):

    def test_valid_mcq(self):
        data = {
            "title": "Capital of India",
            "text": "What is the capital of India?",
            "question_type": "MCQ",
            "difficulty": "EASY",
            "topic": "Geography",
            "marks": 1,
            "options": [
                {
                    "text": "Delhi",
                    "is_correct": True,
                    "order": 1,
                },
                {
                    "text": "Mumbai",
                    "is_correct": False,
                    "order": 2,
                },
            ],
        }

        self.authenticate(self.teacher)

        response = self.client.post(
            self.question_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    def test_mcq_requires_exactly_one_correct_option(self):
        data = {
            "title": "Invalid MCQ",
            "text": "Choose the correct answer.",
            "question_type": "MCQ",
            "difficulty": "EASY",
            "marks": 1,
            "options": [
                {
                    "text": "A",
                    "is_correct": True,
                    "order": 1,
                },
                {
                    "text": "B",
                    "is_correct": True,
                    "order": 2,
                },
            ],
        }

        self.authenticate(self.teacher)

        response = self.client.post(
            self.question_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_valid_msq(self):
        data = {
            "title": "Valid MSQ",
            "text": "Select prime numbers.",
            "question_type": "MSQ",
            "difficulty": "MEDIUM",
            "marks": 2,
            "options": [
                {
                    "text": "2",
                    "is_correct": True,
                    "order": 1,
                },
                {
                    "text": "3",
                    "is_correct": True,
                    "order": 2,
                },
                {
                    "text": "4",
                    "is_correct": False,
                    "order": 3,
                },
            ],
        }

        self.authenticate(self.teacher)

        response = self.client.post(
            self.question_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    def test_msq_requires_at_least_one_correct_option(self):
        data = {
            "title": "Invalid MSQ",
            "text": "Select prime numbers.",
            "question_type": "MSQ",
            "difficulty": "MEDIUM",
            "marks": 2,
            "options": [
                {
                    "text": "4",
                    "is_correct": False,
                    "order": 1,
                },
                {
                    "text": "6",
                    "is_correct": False,
                    "order": 2,
                },
            ],
        }

        self.authenticate(self.teacher)

        response = self.client.post(
            self.question_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_valid_subjective(self):
        data = {
            "title": "Explain OOP",
            "text": "Explain object-oriented programming.",
            "question_type": "SUBJECTIVE",
            "difficulty": "MEDIUM",
            "marks": 5,
        }

        self.authenticate(self.teacher)

        response = self.client.post(
            self.question_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    def test_subjective_cannot_have_options(self):
        data = {
            "title": "Invalid Subjective",
            "text": "Explain OOP.",
            "question_type": "SUBJECTIVE",
            "difficulty": "MEDIUM",
            "marks": 5,
            "options": [
                {
                    "text": "Option A",
                    "is_correct": True,
                    "order": 1,
                }
            ],
        }

        self.authenticate(self.teacher)

        response = self.client.post(
            self.question_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_valid_coding_question(self):
        data = {
            "title": "Reverse String",
            "text": "Write a program to reverse a string.",
            "question_type": "CODING",
            "difficulty": "MEDIUM",
            "marks": 10,
            "starter_code": "def solve():\n    pass",
            "test_cases": [
                {
                    "input_data": "hello",
                    "expected_output": "olleh",
                    "is_sample": True,
                    "order": 1,
                }
            ],
        }

        self.authenticate(self.teacher)

        response = self.client.post(
            self.question_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    def test_coding_requires_test_cases(self):
        data = {
            "title": "Coding Without Test Case",
            "text": "Write a program.",
            "question_type": "CODING",
            "difficulty": "HARD",
            "marks": 10,
            "starter_code": "def solve():\n    pass",
        }

        self.authenticate(self.teacher)

        response = self.client.post(
            self.question_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )


class QuestionAPITests(QuizTestBase):

    def create_question(self, teacher=None):
        teacher = teacher or self.teacher

        self.authenticate(teacher)

        data = {
            "title": "Python Question",
            "text": "What is Python?",
            "question_type": "MCQ",
            "difficulty": "EASY",
            "topic": "Python",
            "marks": 2,
            "options": [
                {
                    "text": "Language",
                    "is_correct": True,
                    "order": 1,
                },
                {
                    "text": "Database",
                    "is_correct": False,
                    "order": 2,
                },
            ],
        }

        response = self.client.post(
            self.question_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        return Question.objects.get(
            id=response.data["id"]
        )

    def test_student_cannot_access_question_bank(self):
        self.authenticate(self.student)

        response = self.client.get(
            self.question_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_unauthenticated_user_cannot_access_question_bank(self):
        response = self.client.get(
            self.question_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_teacher_can_create_question(self):
        question = self.create_question()

        self.assertEqual(
            question.teacher,
            self.teacher,
        )

    def test_teacher_sees_only_own_questions(self):
        self.create_question(self.teacher)

        self.create_question(self.teacher_2)

        self.authenticate(self.teacher)

        response = self.client.get(
            self.question_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data["results"]),
            1,
        )

        self.assertEqual(
            response.data["results"][0]["title"],
            "Python Question",
        )

    def test_teacher_can_view_question_detail(self):
        question = self.create_question()

        url = reverse(
            "question-detail",
            kwargs={"pk": question.id},
        )

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["id"],
            question.id,
        )

    def test_teacher_cannot_view_another_teachers_question(self):
        question = self.create_question(
            self.teacher_2
        )

        self.authenticate(self.teacher)

        url = reverse(
            "question-detail",
            kwargs={"pk": question.id},
        )

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_question_filters_by_type(self):
        self.create_question()

        self.authenticate(self.teacher)

        response = self.client.get(
            self.question_url,
            {"question_type": "MCQ"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data["results"]),
            1,
        )

    def test_question_search(self):
        self.create_question()

        self.authenticate(self.teacher)

        response = self.client.get(
            self.question_url,
            {"search": "Python"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data["results"]),
            1,
        )

    def test_teacher_can_update_question(self):
        question = self.create_question()

        url = reverse(
            "question-detail",
            kwargs={"pk": question.id},
        )

        response = self.client.patch(
            url,
            {
                "title": "Updated Python Question",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        question.refresh_from_db()

        self.assertEqual(
            question.title,
            "Updated Python Question",
        )

    def test_question_update_creates_new_version(self):
        question = self.create_question()

        self.assertEqual(
            QuestionVersion.objects.filter(
                question=question
            ).count(),
            1,
        )

        url = reverse(
            "question-detail",
            kwargs={"pk": question.id},
        )

        response = self.client.patch(
            url,
            {
                "text": "Updated question text.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            QuestionVersion.objects.filter(
                question=question
            ).count(),
            2,
        )

    def test_teacher_can_deactivate_question(self):
        question = self.create_question()

        url = reverse(
            "question-detail",
            kwargs={"pk": question.id},
        )

        response = self.client.delete(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        question.refresh_from_db()

        self.assertFalse(
            question.is_active
        )

    def test_deactivated_question_is_not_available_for_new_quiz(self):
        question = self.create_question()

        question.is_active = False
        question.save()

        self.authenticate(self.teacher)

        quiz = Quiz.objects.create(
            teacher=self.teacher,
            title="Test Quiz",
            subject="Python",
            duration_minutes=30,
        )

        response = self.client.post(
            self.quiz_question_url,
            {
                "quiz": quiz.id,
                "question": question.id,
                "order": 1,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )


class QuizAPITests(QuizTestBase):

    def create_quiz(self):
        self.authenticate(self.teacher)

        data = {
            "title": "Python Test",
            "subject": "Python",
            "description": "Basic Python test.",
            "duration_minutes": 30,
            "max_attempts": 2,
            "password": "PYTHON123",
            "review_enabled": True,
            "shuffle_questions": True,
            "shuffle_options": True,
        }

        response = self.client.post(
            self.quiz_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        return Quiz.objects.get(
            id=response.data["id"]
        )

    def test_teacher_can_create_quiz(self):
        quiz = self.create_quiz()

        self.assertEqual(
            quiz.teacher,
            self.teacher,
        )

    def test_student_cannot_create_quiz(self):
        self.authenticate(self.student)

        response = self.client.post(
            self.quiz_url,
            {
                "title": "Student Quiz",
                "subject": "Python",
                "duration_minutes": 30,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_teacher_sees_only_own_quizzes(self):
        self.create_quiz()

        self.authenticate(self.teacher_2)

        response = self.client.get(
            self.quiz_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            0,
        )

    def test_quiz_rejects_invalid_schedule(self):
        self.authenticate(self.teacher)

        data = {
            "title": "Invalid Schedule Quiz",
            "subject": "Python",
            "duration_minutes": 30,
            "starts_at": "2026-09-10T12:00:00Z",
            "ends_at": "2026-09-10T11:00:00Z",
        }

        response = self.client.post(
            self.quiz_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )


class QuizQuestionAPITests(QuizTestBase):

    def create_question(self, teacher=None):
        teacher = teacher or self.teacher

        question = Question.objects.create(
            teacher=teacher,
            title="Quiz Question",
            text="What is Django?",
            question_type="MCQ",
            difficulty="MEDIUM",
            topic="Django",
            marks=2,
        )

        Option.objects.create(
            question=question,
            text="Framework",
            is_correct=True,
            order=1,
        )

        Option.objects.create(
            question=question,
            text="Database",
            is_correct=False,
            order=2,
        )

        return question

    def create_quiz(self, teacher=None):
        teacher = teacher or self.teacher

        return Quiz.objects.create(
            teacher=teacher,
            title="Django Quiz",
            subject="Django",
            duration_minutes=30,
        )

    def test_teacher_can_add_question_to_quiz(self):
        quiz = self.create_quiz()
        question = self.create_question()

        self.authenticate(self.teacher)

        response = self.client.post(
            self.quiz_question_url,
            {
                "quiz": quiz.id,
                "question": question.id,
                "order": 1,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertTrue(
            QuizQuestion.objects.filter(
                quiz=quiz,
                question=question,
            ).exists()
        )

    def test_duplicate_question_cannot_be_added(self):
        quiz = self.create_quiz()
        question = self.create_question()

        QuizQuestion.objects.create(
            quiz=quiz,
            question=question,
            order=1,
        )

        self.authenticate(self.teacher)

        response = self.client.post(
            self.quiz_question_url,
            {
                "quiz": quiz.id,
                "question": question.id,
                "order": 2,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_teacher_cannot_add_another_teachers_question(self):
        quiz = self.create_quiz(
            self.teacher
        )

        question = self.create_question(
            self.teacher_2
        )

        self.authenticate(self.teacher)

        response = self.client.post(
            self.quiz_question_url,
            {
                "quiz": quiz.id,
                "question": question.id,
                "order": 1,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_teacher_cannot_add_question_to_another_teachers_quiz(self):
        quiz = self.create_quiz(
            self.teacher_2
        )

        question = self.create_question(
            self.teacher
        )

        self.authenticate(self.teacher)

        response = self.client.post(
            self.quiz_question_url,
            {
                "quiz": quiz.id,
                "question": question.id,
                "order": 1,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_student_cannot_manage_quiz_questions(self):
        quiz = self.create_quiz(
            self.teacher
        )

        question = self.create_question(
            self.teacher
        )

        self.authenticate(self.student)

        response = self.client.post(
            self.quiz_question_url,
            {
                "quiz": quiz.id,
                "question": question.id,
                "order": 1,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_teacher_can_remove_question_from_quiz(self):
        quiz = self.create_quiz()
        question = self.create_question()

        quiz_question = QuizQuestion.objects.create(
            quiz=quiz,
            question=question,
            order=1,
        )

        self.authenticate(self.teacher)

        url = reverse(
            "quiz-question-detail",
            kwargs={"pk": quiz_question.id},
        )

        response = self.client.delete(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            QuizQuestion.objects.filter(
                id=quiz_question.id
            ).exists()
        )

    def test_teacher_can_reorder_question(self):
        quiz = self.create_quiz()
        question = self.create_question()

        quiz_question = QuizQuestion.objects.create(
            quiz=quiz,
            question=question,
            order=1,
        )

        self.authenticate(self.teacher)

        url = reverse(
            "quiz-question-detail",
            kwargs={"pk": quiz_question.id},
        )

        response = self.client.patch(
            url,
            {
                "order": 5,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        quiz_question.refresh_from_db()

        self.assertEqual(
            quiz_question.order,
            5,
        )



class QuizConfigurationAPITests(QuizTestBase):

    def create_quiz(self, teacher=None):
        teacher = teacher or self.teacher

        return Quiz.objects.create(
            teacher=teacher,
            title="Configuration Quiz",
            subject="Python",
            duration_minutes=30,
            max_attempts=2,
            password="TEST123",
            review_enabled=True,
            shuffle_questions=True,
            shuffle_options=True,
        )

    def test_teacher_can_update_own_quiz(self):
        quiz = self.create_quiz()

        self.authenticate(self.teacher)

        url = reverse(
            "quiz-detail",
            kwargs={"pk": quiz.id},
        )

        response = self.client.patch(
            url,
            {
                "duration_minutes": 60,
                "max_attempts": 3,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        quiz.refresh_from_db()

        self.assertEqual(
            quiz.duration_minutes,
            60,
        )

        self.assertEqual(
            quiz.max_attempts,
            3,
        )

    def test_teacher_cannot_view_another_teachers_quiz(self):
        quiz = self.create_quiz(
            self.teacher_2
        )

        self.authenticate(self.teacher)

        url = reverse(
            "quiz-detail",
            kwargs={"pk": quiz.id},
        )

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_teacher_cannot_update_another_teachers_quiz(self):
        quiz = self.create_quiz(
            self.teacher_2
        )

        self.authenticate(self.teacher)

        url = reverse(
            "quiz-detail",
            kwargs={"pk": quiz.id},
        )

        response = self.client.patch(
            url,
            {
                "title": "Unauthorized Update",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        quiz.refresh_from_db()

        self.assertEqual(
            quiz.title,
            "Configuration Quiz",
        )

    def test_teacher_cannot_delete_another_teachers_quiz(self):
        quiz = self.create_quiz(
            self.teacher_2
        )

        self.authenticate(self.teacher)

        url = reverse(
            "quiz-detail",
            kwargs={"pk": quiz.id},
        )

        response = self.client.delete(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        self.assertTrue(
            Quiz.objects.filter(
                id=quiz.id
            ).exists()
        )

    def test_quiz_requires_positive_duration(self):
        self.authenticate(self.teacher)

        response = self.client.post(
            self.quiz_url,
            {
                "title": "Invalid Duration",
                "subject": "Python",
                "duration_minutes": 0,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_quiz_requires_positive_max_attempts(self):
        self.authenticate(self.teacher)

        response = self.client.post(
            self.quiz_url,
            {
                "title": "Invalid Attempts",
                "subject": "Python",
                "duration_minutes": 30,
                "max_attempts": 0,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_quiz_can_store_configuration_options(self):
        self.authenticate(self.teacher)

        data = {
            "title": "Configured Quiz",
            "subject": "Python",
            "duration_minutes": 45,
            "max_attempts": 3,
            "password": "ACCESS123",
            "review_enabled": False,
            "shuffle_questions": True,
            "shuffle_options": True,
        }

        response = self.client.post(
            self.quiz_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        quiz = Quiz.objects.get(
            id=response.data["id"]
        )

        self.assertEqual(
            quiz.password,
            "ACCESS123",
        )

        self.assertFalse(
            quiz.review_enabled
        )

        self.assertTrue(
            quiz.shuffle_questions
        )

        self.assertTrue(
            quiz.shuffle_options
        )


class QuizQuestionOwnershipTests(QuizTestBase):

    def create_quiz(self, teacher):
        return Quiz.objects.create(
            teacher=teacher,
            title="Ownership Quiz",
            subject="Python",
            duration_minutes=30,
        )

    def create_question(self, teacher):
        question = Question.objects.create(
            teacher=teacher,
            title="Ownership Question",
            text="What is Python?",
            question_type="MCQ",
            difficulty="EASY",
            marks=1,
        )

        Option.objects.create(
            question=question,
            text="Programming Language",
            is_correct=True,
            order=1,
        )

        Option.objects.create(
            question=question,
            text="Database",
            is_correct=False,
            order=2,
        )

        return question

    def test_teacher_can_list_own_quiz_questions(self):
        quiz = self.create_quiz(
            self.teacher
        )

        question = self.create_question(
            self.teacher
        )

        QuizQuestion.objects.create(
            quiz=quiz,
            question=question,
            order=1,
        )

        self.authenticate(self.teacher)

        response = self.client.get(
            self.quiz_question_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            1,
        )

    def test_teacher_cannot_view_another_teachers_quiz_question(self):
        quiz = self.create_quiz(
            self.teacher_2
        )

        question = self.create_question(
            self.teacher_2
        )

        quiz_question = QuizQuestion.objects.create(
            quiz=quiz,
            question=question,
            order=1,
        )

        self.authenticate(self.teacher)

        url = reverse(
            "quiz-question-detail",
            kwargs={"pk": quiz_question.id},
        )

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_teacher_cannot_update_another_teachers_quiz_question(self):
        quiz = self.create_quiz(
            self.teacher_2
        )

        question = self.create_question(
            self.teacher_2
        )

        quiz_question = QuizQuestion.objects.create(
            quiz=quiz,
            question=question,
            order=1,
        )

        self.authenticate(self.teacher)

        url = reverse(
            "quiz-question-detail",
            kwargs={"pk": quiz_question.id},
        )

        response = self.client.patch(
            url,
            {
                "order": 10,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_teacher_cannot_delete_another_teachers_quiz_question(self):
        quiz = self.create_quiz(
            self.teacher_2
        )

        question = self.create_question(
            self.teacher_2
        )

        quiz_question = QuizQuestion.objects.create(
            quiz=quiz,
            question=question,
            order=1,
        )

        self.authenticate(self.teacher)

        url = reverse(
            "quiz-question-detail",
            kwargs={"pk": quiz_question.id},
        )

        response = self.client.delete(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        self.assertTrue(
            QuizQuestion.objects.filter(
                id=quiz_question.id
            ).exists()
        )


class QuestionPaginationTests(QuizTestBase):

    def create_question(self, number):
        question = Question.objects.create(
            teacher=self.teacher,
            title=f"Question {number}",
            text=f"Test question {number}",
            question_type="MCQ",
            difficulty="MEDIUM",
            topic="Testing",
            marks=1,
        )

        Option.objects.create(
            question=question,
            text="Correct",
            is_correct=True,
            order=1,
        )

        Option.objects.create(
            question=question,
            text="Wrong",
            is_correct=False,
            order=2,
        )

        return question

    def test_question_bank_is_paginated(self):
        for number in range(1, 26):
            self.create_question(number)

        self.authenticate(self.teacher)

        response = self.client.get(
            self.question_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn(
            "count",
            response.data,
        )

        self.assertIn(
            "results",
            response.data,
        )

        self.assertEqual(
            response.data["count"],
            25,
        )

        self.assertEqual(
            len(response.data["results"]),
            20,
        )

        self.assertIsNotNone(
            response.data["next"]
        )

    def test_question_bank_second_page(self):
        for number in range(1, 26):
            self.create_question(number)

        self.authenticate(self.teacher)

        response = self.client.get(
            self.question_url,
            {"page": 2},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            25,
        )

        self.assertEqual(
            len(response.data["results"]),
            5,
        )

        self.assertIsNotNone(
            response.data["previous"]
        )

        self.assertIsNone(
            response.data["next"]
        )