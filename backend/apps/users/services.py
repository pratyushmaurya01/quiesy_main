import hashlib
import secrets
from django.utils import timezone
from django.conf import settings
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes



def generate_otp():
    return f"{secrets.randbelow(1000000):06d}"


def hash_otp(otp):
    return hashlib.sha256(otp.encode()).hexdigest()


def save_otp(user, otp):
    user.verification_otp = hash_otp(otp)
    user.otp_created_at = timezone.now()
    user.save(update_fields=["verification_otp", "otp_created_at"])


def send_verification_email(receiver_email, otp):
    sender_email = settings.EMAIL_HOST_USER
    app_password = settings.EMAIL_HOST_PASSWORD

    msg = MIMEMultipart("alternative")
    msg["From"] = f"Quiesy <{sender_email}>"
    msg["To"] = receiver_email
    msg["Subject"] = "Quiesy Email Verification"

    html = f"""
    <div style="font-family: Arial; background:#f5f7fb; padding:40px;">
        <div style="max-width:500px; margin:auto; background:white;
                    padding:30px; border-radius:12px; text-align:center;">
            <h2 style="color:#111827;">Verify your Quiesy account</h2>

            <p style="color:#6b7280;">
                Use the OTP below to verify your email address.
            </p>

            <div style="background:#f0f4ff; padding:18px;
                        border-radius:10px; margin:25px 0;">
                <h1 style="color:#4f46e5; letter-spacing:8px;">
                    {otp}
                </h1>
            </div>

            <p style="color:#6b7280;">
                This OTP expires in <strong>10 minutes</strong>.
            </p>
        </div>
    </div>
    """

    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(sender_email, app_password)
        server.sendmail(
            sender_email,
            receiver_email,
            msg.as_string(),
        )




def send_password_reset_email(user):
    sender_email = settings.EMAIL_HOST_USER
    app_password = settings.EMAIL_HOST_PASSWORD

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    reset_link = (
        f"{settings.FRONTEND_URL}"
        f"/reset-password/{uid}/{token}/"
    )

    msg = MIMEMultipart("alternative")
    msg["From"] = f"Quiesy <{sender_email}>"
    msg["To"] = user.email
    msg["Subject"] = "Quiesy Password Reset"

    html = f"""
    <div style="font-family: Arial; background:#f5f7fb; padding:40px;">
        <div style="max-width:500px; margin:auto; background:white;
                    padding:30px; border-radius:12px; text-align:center;">

            <h2 style="color:#111827;">
                Reset your Quiesy password
            </h2>

            <p style="color:#6b7280;">
                We received a request to reset your password.
            </p>

            <a href="{reset_link}"
               style="display:inline-block;
                      background:#4f46e5;
                      color:white;
                      padding:14px 24px;
                      border-radius:8px;
                      text-decoration:none;
                      font-weight:bold;
                      margin:20px 0;">
                Reset Password
            </a>

            <p style="color:#6b7280;">
                This link expires in <strong>15 minutes</strong>.
            </p>

            <p style="color:#9ca3af; font-size:12px;">
                If you did not request this, you can safely ignore this email.
            </p>

        </div>
    </div>
    """

    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(sender_email, app_password)
        server.sendmail(
            sender_email,
            user.email,
            msg.as_string(),
        )