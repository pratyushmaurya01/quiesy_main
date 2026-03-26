from rest_framework import serializers
from .models import User , Quiz , Question , Option , QuizAttempt , Answer , TestCase
from django.contrib.auth import authenticate
from rest_framework import serializers


class TeacherRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["email", "name", "password"]

    def create(self, validated_data):
        # 🔥 EXACT FIX: Isse guarantee milti hai ki password HASH hoga
        user = User(
            email=validated_data["email"],
            name=validated_data["name"]
        )
        user.set_password(validated_data["password"]) # Hashing Magic
        user.save()
        return user

class TeacherLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(email=data["email"], password=data["password"])

        if not user:
            raise serializers.ValidationError("Invalid credentials")

        data["user"] = user
        return data



class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = [
            "id",
            "title",
            "subject",
            "description",
            "time_limit",
            "password",
            "quiz_code",
            "num_of_qus",
            "review_on",
        ]
        read_only_fields = ["quiz_code"]


class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ["id", "text","is_correct"]

class TestCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestCase
        fields = ["input_data", "expected_output"]


class QuestionSerializer(serializers.ModelSerializer):

    options = OptionSerializer(many=True, required=False)
    test_cases = TestCaseSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = [
            "id",
            "quiz",
            "text",
            "type",
            "marks",
            "options",
            "starter_code",
            "test_cases"
        ]

    def create(self, validated_data):

        options_data = validated_data.pop("options", [])
        test_cases_data = validated_data.pop("test_cases", [])

        question = Question.objects.create(**validated_data)

        # 🔹 MCQ case
        if question.type in ["mcq", "msq"]:
            for option in options_data:
                Option.objects.create(question=question, **option)

        # 🔹 Coding case
        elif question.type == "coding":
            for test in test_cases_data:
                TestCase.objects.create(question=question, **test)

        return question

from rest_framework import serializers

class QuizStartSerializer(serializers.Serializer):
    quiz_code = serializers.UUIDField()
    student_name = serializers.CharField()
    email = serializers.EmailField()
    roll_number = serializers.CharField()
    
    # 🔥 Naya field add kiya (required=False taaki bina password wale quiz chal sakein)
    password = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        from .models import Quiz

        try:
            quiz = Quiz.objects.get(quiz_code=data["quiz_code"])
        except Quiz.DoesNotExist:
            raise serializers.ValidationError({"error": "Invalid quiz code"})

        # 🔥 THE FIX: Password Checking Logic
        if quiz.password: # Agar teacher ne database mein password set kiya hai
            provided_password = data.get("password", "")
            
            if not provided_password:
                raise serializers.ValidationError({"error": "This quiz requires a  password to start."})
                
            if quiz.password != provided_password:
                raise serializers.ValidationError({"error": "Incorrect quiz password. Please try again."})

        data["quiz"] = quiz
        return data    

class QuestionFetchSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, required = False)
    test_cases = TestCaseSerializer(many=True, required=False)

    class Meta:
        model = Question
        # 🔥 FIX: Added "starter_code" so the IDE has something to show!
        fields = ["id","text","type","marks","options","test_cases", "starter_code"]


class SubmitAnswerSerializer(serializers.Serializer):
    attempt_id = serializers.IntegerField()
    question_id = serializers.IntegerField()
    option_id = serializers.IntegerField(required=False, allow_null=True)
    code = serializers.CharField(required=False, allow_blank=True)
    # 🔥 FIX: Added language so the backend knows what language was used
    language = serializers.CharField(required=False, allow_blank=True) 

    def validate(self, data):
        from .models import Question

        question = Question.objects.get(id=data["question_id"])

        if question.type == "coding":
            if "code" not in data:
                data["code"] = ""
            if "language" not in data:
                data["language"] = "python"
        else:
            if "option_id" not in data:
                data["option_id"] = None

        return data

class UpdateOptionSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    text = serializers.CharField()
    is_correct = serializers.BooleanField()


class UpdateQuestionSerializer(serializers.Serializer):

    question_id = serializers.IntegerField()
    text = serializers.CharField()
    marks = serializers.IntegerField()
    type = serializers.CharField()

    options = OptionSerializer(many=True, required=False)
    test_cases = TestCaseSerializer(many=True, required=False)
    starter_code = serializers.CharField(required=False, allow_blank=True)

    def update(self, instance, validated_data):
        pass  # not used