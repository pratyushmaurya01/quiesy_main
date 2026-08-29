import hashlib
import secrets
from django.utils import timezone
from django.conf import settings
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


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