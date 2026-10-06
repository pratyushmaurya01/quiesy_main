import logging
from celery import shared_task
from django.utils import timezone
from django.db import transaction, models
from apps.students.models import ExamAttempt, Answer
from apps.quizzes.models import Question, QuizQuestion
from apps.students.services.code_runner import run_code_batch

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def evaluate_code_submission(self, attempt_id, question_id, code, language):
    """
    Celery background worker task to run Judge0 batch tests, evaluate score,
    and persist results atomically to PostgreSQL.
    """
    try:
        attempt = ExamAttempt.objects.filter(id=attempt_id).first()
        if not attempt:
            return {"status": "FAILED", "error": "Attempt not found"}

        question = Question.objects.filter(id=question_id).first()
        if not question:
            return {"status": "FAILED", "error": "Question not found"}

        # Fetch all test cases for this question
        test_cases = list(
            question.test_cases.all().values(
                "id", "input_data", "expected_output", "is_sample"
            )
        )

        batch_results = run_code_batch(code, language, test_cases)
        total_cases = len(batch_results)
        passed_cases = sum(1 for r in batch_results if r.get("passed"))
        all_passed = (passed_cases == total_cases) and total_cases > 0

        # Calculate marks
        qq = QuizQuestion.objects.filter(quiz=attempt.quiz, question=question).first()
        q_marks = qq.marks_override if (qq and qq.marks_override is not None) else question.marks
        earned_marks = round((passed_cases / total_cases) * float(q_marks), 2) if total_cases > 0 else 0

        # Atomic commit to PostgreSQL
        with transaction.atomic():
            answer, _ = Answer.objects.get_or_create(
                attempt=attempt,
                question=question,
                defaults={
                    "status": Answer.Status.EVALUATED,
                    "idempotency_key": f"submit_code_{attempt.id}_{question.id}_{timezone.now().timestamp()}",
                },
            )

            answer.answer_data = {
                "code": code,
                "language": language,
            }
            answer.evaluated_score = earned_marks
            answer.status = Answer.Status.EVALUATED
            answer.execution_result = {
                "summary": f"{passed_cases}/{total_cases} test cases passed",
                "passed_count": passed_cases,
                "total_count": total_cases,
                "all_passed": all_passed,
                "results": batch_results,
            }
            answer.save()

            # Recalculate attempt score sum
            evaluated_sum = (
                Answer.objects.filter(attempt=attempt)
                .aggregate(models.Sum("evaluated_score"))["evaluated_score__sum"]
                or 0
            )
            attempt.score = evaluated_sum
            attempt.last_activity = timezone.now()
            attempt.save(update_fields=["score", "last_activity", "updated_at"])

        return {
            "status": "COMPLETED",
            "success": True,
            "all_passed": all_passed,
            "passed_count": passed_cases,
            "total_count": total_cases,
            "earned_score": earned_marks,
            "max_score": float(q_marks),
            "attempt_total_score": float(attempt.score),
            "execution_result": answer.execution_result,
        }

    except Exception as exc:
        logger.error(f"Error evaluating code submission for attempt {attempt_id}: {exc}")
        # Retry on transient API/network errors
        raise self.retry(exc=exc)


@shared_task
def auto_submit_expired_attempts():
    """
    Celery Beat periodic task: Scans for unsubmitted attempts that have passed
    their expires_at timestamp and marks them EXPIRED/SUBMITTED automatically.
    """
    now = timezone.now()
    expired_attempts = ExamAttempt.objects.filter(
        status=ExamAttempt.Status.IN_PROGRESS,
        expires_at__lte=now
    )

    count = 0
    for attempt in expired_attempts:
        attempt.status = ExamAttempt.Status.EXPIRED
        attempt.submitted_at = now
        attempt.save(update_fields=["status", "submitted_at", "updated_at"])
        count += 1

    return f"Auto-expired {count} attempt(s)."
