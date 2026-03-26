from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import TeacherLoginSerializer,QuestionSerializer ,TeacherRegisterSerializer 
from django.contrib.auth import login
from . models import QuizAttempt , Quiz , Question , Option , Answer , TestCase
from .serializers import QuizSerializer , QuizStartSerializer , QuestionFetchSerializer , UpdateQuestionSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from . serializers import SubmitAnswerSerializer 
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
import threading
import subprocess
import tempfile

execution_lock = threading.Lock()

@api_view(["POST"])
def teacher_register(request):

    serializer = TeacherRegisterSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors)


@api_view(["POST"])
@permission_classes([AllowAny]) # 🔥 Ye line bohot zaroori hai! Ye sabko login karne degi
def teacher_login(request):
    serializer = TeacherLoginSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)
        
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "email": user.email
        })
        
    # Agar password galat ho toh 400 error return karo
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_quiz(request):

    serializer = QuizSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save(teacher=request.user)
        return Response(serializer.data)

    return Response(serializer.errors)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_question(request):

    serializer = QuestionSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(serializer.errors)

@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_question(request):

    serializer = UpdateQuestionSerializer(data=request.data)

    if serializer.is_valid():

        data = serializer.validated_data

        try:
            question = Question.objects.get(id=data["question_id"])
        except Question.DoesNotExist:
            return Response({"error": "Question not found"}, status=404)

        # 🔹 common update
        question.text = data["text"]
        question.marks = data["marks"]
        question.type = data["type"]
        question.starter_code = data.get("starter_code", "")
        question.save()

        # 🔹 MCQ update
        if question.type in ["mcq", "msq"]:
            Option.objects.filter(question=question).delete()

            for opt in data.get("options", []):
                Option.objects.create(question=question, **opt)

        # 🔹 Coding update
        elif question.type == "coding":
            TestCase.objects.filter(question=question).delete()

            for test in data.get("test_cases", []):
                TestCase.objects.create(question=question, **test)

        return Response({"message": "Updated successfully"})

    return Response(serializer.errors, status=400)



@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_quiz(request, quiz_id):
    try:
        quiz = Quiz.objects.get(id=quiz_id)

        # IMPORTANT: only creator can delete
        if quiz.teacher != request.user:
            return Response({"error": "Not allowed"}, status=403)

        quiz.delete()
        return Response({"message": "Quiz deleted successfully"}, status=200)

    except Quiz.DoesNotExist:
        return Response({"error": "Quiz not found"}, status=404)



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def teacher_quizzes(request):

    quizzes = Quiz.objects.filter(teacher=request.user).order_by("-id")

    serializer = QuizSerializer(quizzes, many=True)

    return Response(serializer.data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def quiz_detail(request, quiz_id):

    try:
        quiz = Quiz.objects.get(id=quiz_id)
    except Quiz.DoesNotExist:
        return Response({"error": "Quiz not found"})

    return Response({
        "id": quiz.id,
        "title": quiz.title,
        "num_of_qus": quiz.num_of_qus,
        "current_count": quiz.questions.count()
    })

from rest_framework import status # Make sure to import status at the top of your file

@api_view(["POST"])
def start_quiz(request):
    serializer = QuizStartSerializer(data=request.data)
    
    if serializer.is_valid():
        quiz = serializer.validated_data["quiz"]
        email = serializer.validated_data["email"]

        # 🔥 THE FIX: Check if an attempt already exists for this quiz and email
        if QuizAttempt.objects.filter(quiz=quiz, email=email).exists():
            return Response(
                {"error": "You are allowed only once and You are Attempted this quiz"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        attempt = QuizAttempt.objects.create(
            quiz=quiz,
            student_name=serializer.validated_data["student_name"],
            email=email,
            roll_number=serializer.validated_data["roll_number"]
        )

        request.session["attempt_id"] = attempt.id

        return Response({
            "attempt_id": attempt.id
        })

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def get_quiz_questions(request, quiz_code):
    try:
        quiz = Quiz.objects.get(quiz_code=quiz_code)
    except Quiz.DoesNotExist:
        return Response({"error":"Invalid quiz code"})

    questions = quiz.questions.prefetch_related("options")
    serializer = QuestionFetchSerializer(questions, many=True)

    # 🔥 THE FIX: Return the time_limit alongside the questions
    return Response({
        "time_limit": quiz.time_limit, # Assuming your Quiz model has this field
        "questions": serializer.data
    })

@api_view(["POST"])
def submit_answer(request):
    serializer = SubmitAnswerSerializer(data=request.data)

    if serializer.is_valid():
        data = serializer.validated_data
        attempt = QuizAttempt.objects.get(id=data["attempt_id"])

        # ❌ prevent re-submit
        if attempt.completed_at:
            return Response({"error": "Quiz already submitted"}, status=400)

        question = Question.objects.get(
            id=data["question_id"],
            quiz=attempt.quiz
        )

        # 🔥 CASE 1: CODING QUESTION
        if question.type == "coding":
            code = data.get("code", "")
            language = data.get("language", "python") # 🔥 FIX: Capture language

            Answer.objects.update_or_create(
                attempt=attempt,
                question=question,
                defaults={
                    "code": code,
                    "language": language, # 🔥 FIX: Save language to DB
                    "selected_option": None,
                    "is_correct": False  # abhi judge nahi kiya
                }
            )
            return Response({"status": "code saved"})

        # 🔥 CASE 2: MCQ / MSQ
        else:
            option = Option.objects.get(
                id=data["option_id"],
                question=question
            )

            is_correct = option.is_correct

            Answer.objects.update_or_create(
                attempt=attempt,
                question=question,
                defaults={
                    "selected_option": option,
                    "code": None,
                    "is_correct": is_correct
                }
            )
            return Response({"status": "answer saved"})

    return Response(serializer.errors, status=400)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def quiz_questions_list(request, quiz_id):
    try:
        quiz = Quiz.objects.get(id=quiz_id)
    except Quiz.DoesNotExist:
        return Response({"error": "Quiz not found"})

    questions = quiz.questions.prefetch_related("options")

    data = []

    for q in questions:
        data.append({
            "id": q.id,
            "text": q.text,
            "marks": q.marks,
            "options": [
                {
                    "id": opt.id,
                    "text": opt.text,
                    "is_correct": opt.is_correct
                }
                for opt in q.options.all()
            ]
        })

    return Response(data)


from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes


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
        # 🔥 MCQ/MSQ Case
        if ans.question.type in ["mcq", "msq"]:
            if ans.selected_option and ans.selected_option.is_correct:
                score += ans.question.marks
                ans.is_correct = True  # Save that this was correct
            else:
                ans.is_correct = False
            ans.save()
            
        # 🔥 Coding Case
        elif ans.question.type == "coding":
            if ans.code:
                coding_marks = evaluate_code(ans.question, ans.code, ans.language)
                score += coding_marks
                # Agar poore marks mile toh correct, warna galat
                ans.is_correct = (coding_marks == ans.question.marks) and (ans.question.marks > 0)
            else:
                ans.is_correct = False
            ans.save()
            
    attempt.score = score
    attempt.completed_at = timezone.now()
    attempt.save()

    return Response({"attempt_id": attempt.id})


@api_view(["GET"])
def review_quiz(request, attempt_id):
    try:
        attempt = QuizAttempt.objects.get(id=attempt_id)
    except QuizAttempt.DoesNotExist:
        return Response({"error": "Invalid attempt"}, status=404)

    quiz = attempt.quiz

    if not quiz.review_on:
        return Response({"review_allowed": False, "message": "Review is not available yet"})

    all_questions = quiz.questions.prefetch_related("options")

    user_answers = {
        ans.question.id: {
            "option_id": ans.selected_option.id if ans.selected_option else None,
            "code": ans.code,
            "language": ans.language,
            "is_correct": ans.is_correct # 🔥 Ab hum database se direct correct/incorrect nikal rahe hain
        }
        for ans in attempt.answers.all()
    }

    review_data = []
    total_quiz_marks = 0

    for question in all_questions:
        total_quiz_marks += question.marks
        ans_data = user_answers.get(question.id, {})
        
        review_data.append({
            "question_id": question.id,
            "question_text": question.text,
            "type": question.type,
            "options": [
                {"id": opt.id, "text": opt.text, "is_correct": opt.is_correct}
                for opt in question.options.all()
            ],
            "selected_option": ans_data.get("option_id"),
            "submitted_code": ans_data.get("code"),
            "language": ans_data.get("language"),
            "is_correct": ans_data.get("is_correct", False) # 🔥 Pass whether it passed or failed
        })

    time_taken_sec = 0
    if attempt.started_at and attempt.completed_at:
        time_taken_sec = (attempt.completed_at - attempt.started_at).total_seconds()

    return Response({
        "review_allowed": True,
        "data": review_data,
        "time_taken_seconds": time_taken_sec,
        "student_score": attempt.score or 0, # 🔥 Sending Overall Score
        "total_marks": total_quiz_marks      # 🔥 Sending Total Marks
    })

@api_view(["POST"])
def get_attempt_by_email(request):

    email = request.data.get("email")
    quiz_code = request.data.get("quiz_code")

    if not email or not quiz_code:
        return Response({"error": "Missing data"}, status=400)

    try:
        quiz = Quiz.objects.get(quiz_code=quiz_code)
    except Quiz.DoesNotExist:
        return Response({"error": "Invalid quiz"}, status=404)

    try:
        attempt = QuizAttempt.objects.get(quiz=quiz, email=email)
    except QuizAttempt.DoesNotExist:
        return Response({"error": "No attempt found"}, status=404)

    return Response({
        "attempt_id": attempt.id
    })

from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Quiz

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def quiz_results(request, quiz_id):
    try:
        quiz = Quiz.objects.get(id=quiz_id, teacher=request.user)
    except Quiz.DoesNotExist:
        return Response({"error": "Quiz not found"}, status=404)

    attempts = quiz.attempts.filter(completed_at__isnull=False)
    data = []

    for att in attempts:
        # 🔥 Calculate Time Taken in seconds locally inside the view
        time_taken_sec = 0
        if att.started_at and att.completed_at:
            time_taken_sec = (att.completed_at - att.started_at).total_seconds()

        data.append({
            "student_name": att.student_name,
            "email": att.email,
            "score": att.score,
            "created_at": att.started_at,
            "submitted_at": att.completed_at,
            "time_taken_seconds": time_taken_sec # Naya data field
        })

    # 🔥 SORTING LOGIC (Tie-breaker): 
    # 1. Negative score (highest score first)
    # 2. Positive time_taken (lowest time first)
    data.sort(key=lambda x: (-(x["score"] or 0), x["time_taken_seconds"]))

    # Stats
    scores = [att.score for att in attempts if att.score is not None]
    stats = {
        "total_students": len(scores),
        "avg_score": sum(scores)/len(scores) if scores else 0,
        "max_score": max(scores) if scores else 0,
        "min_score": min(scores) if scores else 0,
    }
    
    return Response({
        "quiz_title": quiz.title,
        "results": data,
        "stats": stats
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_review(request , quiz_id):
    try:
        quiz = Quiz.objects.get(id = quiz_id , teacher = request.user)
    except Quiz.DoesNotExist:
        return Response({"error" : "Quiz not found "}, status=404)
    review_on = request.data.get("review_on")
    if review_on is None:
        return Response({"error": "review_on required"}, status=400)

    quiz.review_on = review_on
    quiz.save()

    return Response({
        "message": "Review updated",
        "review_on": quiz.review_on
    })



@api_view(["GET"])
def get_quiz_info(request, quiz_code):
    try:
        quiz = Quiz.objects.get(quiz_code=quiz_code)
        return Response({
            "title": quiz.title,
            "requires_password": bool(quiz.password) # True agar password hai, nahi to False
        })
    except Quiz.DoesNotExist:
        return Response({"error": "Invalid quiz code"}, status=status.HTTP_404_NOT_FOUND)
    


import subprocess
import tempfile
import os

def run_python(code, input_data):
    try:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
            f.write(code)
            file_path = f.name

        result = subprocess.run(
            ["python", file_path],
            input=input_data,
            text=True,
            capture_output=True,
            timeout=3
        )

        if result.returncode != 0:
            return "ERROR"

        return result.stdout.strip()

    except subprocess.TimeoutExpired:
        return "TIMEOUT"
    except:
        return "ERROR"

def run_java(code, input_data):
    try:
        with tempfile.TemporaryDirectory() as temp_dir:

            file_path = os.path.join(temp_dir, "Main.java")

            with open(file_path, "w") as f:
                f.write(code)

            # compile
            compile_process = subprocess.run(
                ["javac", file_path],
                capture_output=True,
                text=True,
                timeout=4
            )

            if compile_process.returncode != 0:
                return "ERROR"

            # run
            run_process = subprocess.run(
                ["java", "-cp", temp_dir, "Main"],
                input=input_data,
                capture_output=True,
                text=True,
                timeout=3
            )

            if run_process.returncode != 0:
                return "ERROR"

            return run_process.stdout.strip()

    except subprocess.TimeoutExpired:
        return "TIMEOUT"
    except:
        return "ERROR"


def run_cpp(code, input_data):
    try:
        with tempfile.TemporaryDirectory() as temp_dir:

            cpp_path = os.path.join(temp_dir, "main.cpp")
            exe_path = os.path.join(temp_dir, "main")

            with open(cpp_path, "w") as f:
                f.write(code)

            # compile
            compile_process = subprocess.run(
                ["g++", cpp_path, "-o", exe_path],
                capture_output=True,
                text=True,
                timeout=4
            )

            if compile_process.returncode != 0:
                return "ERROR"

            # run
            run_process = subprocess.run(
                [exe_path],
                input=input_data,
                capture_output=True,
                text=True,
                timeout=3
            )

            if run_process.returncode != 0:
                return "ERROR"

            return run_process.stdout.strip()

    except subprocess.TimeoutExpired:
        return "TIMEOUT"
    except:
        return "ERROR"
    

def run_code(code, input_data, language):

    if language == "python":
        return run_python(code, input_data)

    elif language == "java":
        return run_java(code, input_data)

    elif language == "cpp":
        return run_cpp(code, input_data)

    return "ERROR"


def evaluate_code(question, code, language):

    test_cases = question.test_cases.all()
    total = test_cases.count()
    passed = 0

    for test in test_cases:
        with execution_lock:
            output = run_code(code, test.input_data, language)

        if output == test.expected_output.strip():
            passed += 1

    return (passed / total) * question.marks




@api_view(["POST"])
def test_code(request):

    code = request.data.get("code")
    language = request.data.get("language", "python")
    input_data = request.data.get("input", "")

    if not code:
        return Response({"error": "Code required"}, status=400)

    output = run_code(code, input_data, language)

    return Response({
        "output": output
    })