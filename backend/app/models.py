from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.conf import settings
import uuid


class UserManager(BaseUserManager):
    def create_user(self, email, name, password=None):
        if not email:
            raise ValueError("Users must have an email")

        email = self.normalize_email(email)
        user = self.model(email=email, name=name)

        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None):
        user = self.create_user(email, name, password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=100)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    def __str__(self):
        return self.email
    

from django.conf import settings
import uuid

class Quiz(models.Model):
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    subject = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    review_on = models.BooleanField(default=True)
    quiz_code = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    num_of_qus = models.IntegerField()
    time_limit = models.IntegerField(help_text="Time in minutes", null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    password = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.title
    
class Question(models.Model):
    QUESTION_TYPES = (
        ("mcq", "MCQ"),
        ("subjective", "Subjective"),
        ("coding", "Coding"),
    )
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions") # Har qus kisi na kisi quiz ka hona chahiey 
    text = models.TextField()
    type = models.CharField(max_length=20, choices=QUESTION_TYPES, default="mcq")
    marks = models.IntegerField(default=1)

    def __str__(self):
        return self.text

class Option(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="options")
    text = models.CharField(max_length=200)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.text


class QuizAttempt(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="attempts")
    student_name = models.CharField(max_length=100)
    email = models.EmailField()
    roll_number = models.CharField(max_length=20)

    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    score = models.IntegerField(null=True, blank=True)

    class Meta:
        unique_together = ['quiz', 'email']

    def __str__(self):
        return f"{self.student_name} - {self.quiz.title}"


class Answer(models.Model):
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(Question, on_delete=models.CASCADE)

    selected_option = models.ForeignKey(Option, on_delete=models.CASCADE, null=True, blank=True)
    is_correct = models.BooleanField(default=False)
    class Meta:
        unique_together = ["attempt","question"]
