from django.contrib import admin
from .models import Question, Option, TestCase, Quiz, QuizQuestion

class OptionInline(admin.TabularInline):
    model = Option
    extra = 1

class TestCaseInline(admin.TabularInline):
    model = TestCase
    extra = 1

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'question_type', 'difficulty', 'topic', 'teacher', 'is_active')
    list_filter = ('question_type', 'difficulty', 'is_active', 'topic')
    search_fields = ('title', 'text', 'teacher__email')
    inlines = [OptionInline, TestCaseInline]

@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('title', 'quiz_code', 'teacher', 'status', 'starts_at', 'ends_at')
    list_filter = ('status', 'review_enabled')
    search_fields = ('title', 'quiz_code', 'teacher__email')

@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ('quiz', 'question', 'order', 'marks_override')
    list_filter = ('quiz',)
    search_fields = ('quiz__title', 'question__title')
