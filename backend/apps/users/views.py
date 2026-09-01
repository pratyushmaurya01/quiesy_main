
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User
from .services import hash_otp
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .services import generate_otp, save_otp, send_verification_email , send_password_reset_email
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.core.exceptions import ValidationError

from .models import User
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = []


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class LoginView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        email = request.data.get("email")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_verified:
            return Response(
                {"detail": "Please verify your email first."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().post(request, *args, **kwargs)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"detail": "Logout successful."},
                status=status.HTTP_205_RESET_CONTENT,
            )
        except Exception:
            return Response(
                {"detail": "Invalid refresh token."},
                status=status.HTTP_400_BAD_REQUEST,
            )






class VerifyEmailView(APIView):
    def post(self, request):
        email = request.data.get("email")
        otp = request.data.get("otp")

        if not email or not otp:
            return Response(
                {"detail": "Email and OTP are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid email or OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.is_verified:
            return Response(
                {"detail": "Email is already verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.verification_otp or not user.otp_created_at:
            return Response(
                {"detail": "OTP not found. Please request a new OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (timezone.now() - user.otp_created_at).total_seconds() > 600:
            return Response(
                {"detail": "OTP has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if hash_otp(otp) != user.verification_otp:
            return Response(
                {"detail": "Invalid OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_verified = True
        user.verification_otp = None
        user.otp_created_at = None
        user.save(
            update_fields=[
                "is_verified",
                "verification_otp",
                "otp_created_at",
            ]
        )

        return Response(
            {"detail": "Email verified successfully."},
            status=status.HTTP_200_OK,
        )




class ResendOTPView(APIView):
    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response(
                {"detail": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "Unable to process request."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.is_verified:
            return Response(
                {"detail": "Email is already verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp = generate_otp()
        save_otp(user, otp)
        send_verification_email(user.email, otp)

        return Response(
            {"detail": "A new OTP has been sent to your email."},
            status=status.HTTP_200_OK,
        )


class ForgotPasswordView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]

        try:
            user = User.objects.get(
                email=email,
                is_active=True,
                is_verified=True,
            )
        except User.DoesNotExist:
            return Response(
                {
                    "detail": (
                        "If an account exists with this email, "
                        "a password reset link has been sent."
                    )
                },
                status=status.HTTP_200_OK,
            )

        send_password_reset_email(user)

        return Response(
            {
                "detail": (
                    "If an account exists with this email, "
                    "a password reset link has been sent."
                )
            },
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uid = serializer.validated_data["uid"]
        token = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]

        try:
            user_id = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(
                pk=user_id,
                is_active=True,
            )
        except (
            ValueError,
            TypeError,
            OverflowError,
            User.DoesNotExist,
            ValidationError,
        ):
            return Response(
                {"detail": "Invalid or expired reset link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {"detail": "Invalid or expired reset link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])

        return Response(
            {"detail": "Password reset successfully."},
            status=status.HTTP_200_OK,
        )


