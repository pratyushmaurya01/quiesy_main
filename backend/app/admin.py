from django.contrib import admin
from django.contrib import admin
from .models import User, Quiz, Question, Option, QuizAttempt, Answer

admin.site.register(User)
admin.site.register(Quiz)
admin.site.register(Question)
admin.site.register(Option)
admin.site.register(QuizAttempt)
admin.site.register(Answer)