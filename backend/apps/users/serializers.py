from rest_framework import serializers

from .models import User
from .services import generate_otp, save_otp, send_verification_email


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "name", "role"]


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(validators=[])
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(
        choices=[
            User.Role.STUDENT,
            User.Role.TEACHER,
        ]
    )

    class Meta:
        model = User
        fields = ["email", "name", "password", "role"]

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
        except User.DoesNotExist:
            return value

        if user.is_verified:
            raise serializers.ValidationError(
                "Email already registered. Please login."
            )

        return value

    def create(self, validated_data):
        email = validated_data["email"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            user = User.objects.create_user(
                email=email,
                name=validated_data["name"],
                password=validated_data["password"],
                role=validated_data["role"],
            )
        else:
            user.name = validated_data["name"]
            user.set_password(validated_data["password"])
            user.role = validated_data["role"]
            user.save(update_fields=["name", "password", "role"])

        otp = generate_otp()
        save_otp(user, otp)
        send_verification_email(user.email, otp)

        return user




class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
    )