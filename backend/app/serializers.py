from rest_framework import serializers
from .models import User , Quiz , Question , Option , QuizAttempt , Answer
from django.contrib.auth import authenticate
from rest_framework import serializers


class TeacherRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["email", "name", "password"]

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            name=validated_data["name"],
            password=validated_data["password"]
        )
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
            "quiz_code"
        ]
        read_only_fields = ["quiz_code"]

class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ["id", "text"]


class QuestionSerializer(serializers.ModelSerializer):

    options = OptionSerializer(many=True)

    class Meta:
        model = Question
        fields = ["id", "quiz", "text", "type", "marks", "options"]

    def create(self, validated_data):

        options_data = validated_data.pop("options")

        question = Question.objects.create(**validated_data)

        for option in options_data:
            Option.objects.create(question=question, **option)

        return question

class QuizStartSerializer(serializers.Serializer):

    quiz_code = serializers.UUIDField()
    student_name = serializers.CharField()
    email = serializers.EmailField()
    roll_number = serializers.CharField()

    def validate(self, data):

        from .models import Quiz

        try:
            quiz = Quiz.objects.get(quiz_code=data["quiz_code"])
        except Quiz.DoesNotExist:
            raise serializers.ValidationError("Invalid quiz code")

        data["quiz"] = quiz
        return data
    

class QuestionFetchSerializer(serializers.ModelSerializer):

    options = OptionSerializer(many=True)

    class Meta:
        model = Question
        fields = ["id","text","type","marks","options"]


class SubmitAnswerSerializer(serializers.Serializer):

    attempt_id = serializers.IntegerField()
    question_id = serializers.IntegerField()
    option_id = serializers.IntegerField()