from django.contrib import admin
from .models import ExamAttempt, Answer

@admin.register(ExamAttempt)
class ExamAttemptAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'quiz', 'attempt_number', 'status', 'score', 'max_score', 'started_at')
    list_filter = ('status', 'quiz', 'is_blocked')
    search_fields = ('student__email', 'quiz__title', 'id')

@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('id', 'attempt', 'question', 'status', 'evaluated_score')
    list_filter = ('status', 'question__question_type')
    search_fields = ('attempt__student__email', 'question__title', 'id')
