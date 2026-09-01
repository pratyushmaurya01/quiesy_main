from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    LoginView,
    MeView,
    LogoutView,
    ResendOTPView,
    VerifyEmailView,
    ForgotPasswordView,
    ResetPasswordView,
)
# from .views import StudentTestView, TeacherTestView, AdminTestView

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("login/", LoginView.as_view()),
    path("token/refresh/", TokenRefreshView.as_view()),
    path("logout/",LogoutView.as_view()) , 
    path("me/", MeView.as_view()),
    path("verify-email/", VerifyEmailView.as_view()),
    path("resend-otp/", ResendOTPView.as_view()),
    path("forgot-password/", ForgotPasswordView.as_view()),
    path("reset-password/", ResetPasswordView.as_view()),
]