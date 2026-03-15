from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import TeacherLoginSerializer,QuestionSerializer ,TeacherRegisterSerializer 
from django.contrib.auth import login
from . models import QuizAttempt , Quiz , Question , Option , Answer
from .serializers import QuizSerializer , QuizStartSerializer , QuestionFetchSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from . serializers import SubmitAnswerSerializer 

@api_view(["POST"])
def teacher_register(request):

    serializer = TeacherRegisterSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors)

@api_view(["POST"])
def teacher_login(request):

    serializer = TeacherLoginSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.validated_data["user"]
        login(request, user)

        return Response({
            "message": "Login successful",
            "email": user.email
        })

    return Response(serializer.errors)



@api_view(["POST"])
def create_quiz(request):

    serializer = QuizSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save(teacher=request.user)
        return Response(serializer.data)

    return Response(serializer.errors)

@api_view(["POST"])
def create_question(request):

    serializer = QuestionSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(serializer.errors)




@api_view(["POST"])
def start_quiz(request):
    serializer = QuizStartSerializer(data=request.data)
    if serializer.is_valid():
        quiz = serializer.validated_data["quiz"]
        attempt = QuizAttempt.objects.create(
            quiz=quiz,
            student_name=serializer.validated_data["student_name"],
            email=serializer.validated_data["email"],
            roll_number=serializer.validated_data["roll_number"]
        )

        request.session["attempt_id"] = attempt.id

        return Response({
            "attempt_id": attempt.id
        })

    return Response(serializer.errors)


@api_view(["GET"])
def get_quiz_questions(request, quiz_code):

    try:
        quiz = Quiz.objects.get(quiz_code=quiz_code)
    except Quiz.DoesNotExist:
        return Response({"error":"Invalid quiz code"})

    questions = quiz.questions.prefetch_related("options")

    serializer = QuestionFetchSerializer(questions, many=True)

    return Response(serializer.data)



@api_view(["POST"])
def submit_answer(request):

    serializer = SubmitAnswerSerializer(data=request.data)

    if serializer.is_valid():

        data = serializer.validated_data

        attempt = QuizAttempt.objects.get(id=data["attempt_id"])

        question = Question.objects.get(
            id=data["question_id"],
            quiz=attempt.quiz
        )

        option = Option.objects.get(
            id=data["option_id"],
            question=question
        )

        is_correct = option.is_correct

        Answer.objects.update_or_create(
            attempt=attempt,
            question=question,
            selected_option=option,
            is_correct=is_correct
        )

        return Response({
            "status": "answer saved",
            "correct": is_correct
        })

    return Response(serializer.errors)


@api_view(["POST"])
def finish_quiz(request):

    attempt_id = request.data.get("attempt_id")
    
    try:
        attempt = QuizAttempt.objects.get(id=attempt_id)
    except QuizAttempt.DoesNotExist:
        return Response({"error": "Invalid attempt"})

    answers = attempt.answers.select_related("question", "selected_option")

    score = 0

    for ans in answers:
        if ans.selected_option and ans.selected_option.is_correct:
            score += ans.question.marks

    attempt.score = score
    attempt.completed_at = timezone.now()
    attempt.save()

    return Response({
        "score": score,
        "attempt_id": attempt.id
    })
