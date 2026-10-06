import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)

class QuizProctorConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for live exam proctoring and real-time event broadcasting.
    Room group: quiz_proctor_{quiz_id}
    """

    async def connect(self):
        self.quiz_id = self.scope["url_route"]["kwargs"]["quiz_id"]
        self.room_group_name = f"quiz_proctor_{self.quiz_id}"

        # Join the proctoring room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name,
        )
        await self.accept()
        logger.info(f"Connected to proctor room: {self.room_group_name}")

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name,
        )
        logger.info(f"Disconnected from proctor room: {self.room_group_name}")

    async def receive(self, text_data):
        """
        Handle incoming WebSocket messages from Student or Teacher clients.
        """
        try:
            data = json.loads(text_data)
            action = data.get("action")

            if action == "STUDENT_JOINED":
                await self.handle_student_joined(data)

            elif action == "TAB_SWITCH":
                await self.handle_tab_switch(data)

            elif action == "TEACHER_UNBLOCK":
                await self.handle_teacher_unblock(data)

            elif action == "STUDENT_HEARTBEAT":
                await self.handle_heartbeat(data)

            elif action == "EXAM_SUBMITTED":
                await self.handle_exam_submitted(data)

            elif action == "TEACHER_BROADCAST":
                await self.handle_teacher_broadcast(data)

        except Exception as e:
            logger.exception(f"Error handling WebSocket message: {e}")

    # ========================== Handlers ==========================

    async def handle_student_joined(self, data):
        try:
            attempt_id = data.get("attempt_id")
            if not attempt_id:
                return
            student_info = await self.get_attempt_info(attempt_id)
            if student_info:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "proctor_event",
                        "event": "STUDENT_JOINED",
                        "data": student_info,
                    }
                )
        except Exception as e:
            logger.exception(f"Error in handle_student_joined: {e}")

    async def handle_tab_switch(self, data):
        try:
            attempt_id = data.get("attempt_id")
            if not attempt_id:
                return
            seconds_left = data.get("seconds_left", 0)

            # Increment switch in DB and check if blocked (>3)
            result = await self.record_tab_switch(attempt_id, seconds_left)
            if result:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "proctor_event",
                        "event": "TAB_SWITCH_LOGGED",
                        "data": result,
                    }
                )
        except Exception as e:
            logger.exception(f"Error in handle_tab_switch: {e}")

    async def handle_teacher_unblock(self, data):
        try:
            attempt_id = data.get("attempt_id")
            if not attempt_id:
                return
            reset_counter = bool(data.get("reset_counter", False))

            result = await self.unblock_student_db(attempt_id, reset_counter)
            if result:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "proctor_event",
                        "event": "STUDENT_UNBLOCKED",
                        "data": result,
                    }
                )
        except Exception as e:
            logger.exception(f"Error in handle_teacher_unblock: {e}")

    async def handle_heartbeat(self, data):
        try:
            attempt_id = data.get("attempt_id")
            if not attempt_id:
                return
            seconds_left = data.get("seconds_left")
            answered_count = data.get("answered_count")

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "proctor_event",
                    "event": "STUDENT_HEARTBEAT",
                    "data": {
                        "attempt_id": str(attempt_id),
                        "seconds_left": seconds_left,
                        "answered_count": answered_count,
                        "timestamp": timezone.now().isoformat(),
                    },
                }
            )
        except Exception as e:
            logger.exception(f"Error in handle_heartbeat: {e}")

    async def handle_exam_submitted(self, data):
        try:
            attempt_id = data.get("attempt_id")
            if not attempt_id:
                return
            student_info = await self.get_attempt_info(attempt_id)
            if student_info:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "proctor_event",
                        "event": "STUDENT_SUBMITTED",
                        "data": student_info,
                    }
                )
        except Exception as e:
            logger.exception(f"Error in handle_exam_submitted: {e}")

    async def handle_teacher_broadcast(self, data):
        try:
            message = data.get("message", "")
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "proctor_event",
                    "event": "TEACHER_BROADCAST",
                    "data": {"message": message},
                }
            )
        except Exception as e:
            logger.exception(f"Error in handle_teacher_broadcast: {e}")

    async def proctor_event(self, event):
        """
        Broadcast down to connected WebSocket client
        """
        try:
            await self.send(text_data=json.dumps({
                "event": event["event"],
                "data": event["data"],
            }))
        except Exception as e:
            logger.exception(f"Error sending proctor_event downstream: {e}")

    # ========================== DB Helpers ==========================

    @database_sync_to_async
    def get_attempt_info(self, attempt_id):
        import uuid
        from apps.students.models import ExamAttempt
        try:
            valid_uuid = uuid.UUID(str(attempt_id))
        except (ValueError, TypeError, AttributeError):
            return None

        attempt = ExamAttempt.objects.select_related("student", "quiz").filter(id=valid_uuid).first()
        if not attempt:
            return None

        # calculate answered count
        answered = attempt.answers.filter(status__in=["ANSWERED", "EVALUATED"]).count()

        # time left
        seconds_left = 0
        if attempt.is_blocked and attempt.paused_seconds_remaining is not None:
            seconds_left = attempt.paused_seconds_remaining
        elif attempt.expires_at:
            now = timezone.now()
            diff = (attempt.expires_at - now).total_seconds()
            seconds_left = max(0, int(diff))

        return {
            "attempt_id": str(attempt.id),
            "student_id": attempt.student.id,
            "student_name": getattr(attempt.student, "name", "") or attempt.student.email.split("@")[0],
            "email": attempt.student.email,
            "status": attempt.status,
            "is_blocked": bool(attempt.is_blocked),
            "tab_switch_count": attempt.tab_switch_count,
            "score": float(attempt.score or 0),
            "max_score": float(attempt.max_score or 0),
            "answered_count": answered,
            "seconds_left": seconds_left,
            "started_at": attempt.started_at.isoformat() if attempt.started_at else timezone.now().isoformat(),
            "joined_at": timezone.now().isoformat(),
        }

    @database_sync_to_async
    def record_tab_switch(self, attempt_id, seconds_left):
        import uuid
        from apps.students.models import ExamAttempt
        try:
            valid_uuid = uuid.UUID(str(attempt_id))
        except (ValueError, TypeError, AttributeError):
            return None

        attempt = ExamAttempt.objects.select_related("student").filter(id=valid_uuid).first()
        if not attempt:
            return None

        # Sanitize seconds_left
        try:
            parsed_seconds = max(0, int(float(seconds_left or 0)))
        except (ValueError, TypeError):
            parsed_seconds = 0

        attempt.tab_switch_count += 1
        is_now_blocked = False

        # If 3 or more tab switches, auto block and freeze timer
        if attempt.tab_switch_count >= 3:
            attempt.is_blocked = True
            if not attempt.blocked_at:
                attempt.blocked_at = timezone.now()
            if attempt.paused_seconds_remaining is None or attempt.paused_seconds_remaining == 0:
                attempt.paused_seconds_remaining = parsed_seconds
            is_now_blocked = True

        attempt.save(update_fields=[
            "tab_switch_count",
            "is_blocked",
            "blocked_at",
            "paused_seconds_remaining",
            "updated_at",
        ])

        return {
            "attempt_id": str(attempt.id),
            "student_id": attempt.student.id,
            "student_name": getattr(attempt.student, "name", "") or attempt.student.email.split("@")[0],
            "email": attempt.student.email,
            "tab_switch_count": attempt.tab_switch_count,
            "is_blocked": bool(attempt.is_blocked),
            "paused_seconds_remaining": attempt.paused_seconds_remaining,
            "blocked_at": attempt.blocked_at.isoformat() if attempt.blocked_at else None,
        }

    @database_sync_to_async
    def unblock_student_db(self, attempt_id, reset_counter):
        import uuid
        from apps.students.models import ExamAttempt
        try:
            valid_uuid = uuid.UUID(str(attempt_id))
        except (ValueError, TypeError, AttributeError):
            return None

        attempt = ExamAttempt.objects.select_related("student").filter(id=valid_uuid).first()
        if not attempt:
            return None

        attempt.is_blocked = False
        attempt.blocked_at = None

        if reset_counter:
            attempt.tab_switch_count = 0
        else:
            # Set to 2 of 3 so next switch triggers instant block
            attempt.tab_switch_count = min(attempt.tab_switch_count, 2)

        # Restore expires_at using paused_seconds_remaining
        if attempt.paused_seconds_remaining is not None and attempt.paused_seconds_remaining > 0:
            attempt.expires_at = timezone.now() + timedelta(seconds=attempt.paused_seconds_remaining)
            paused_secs = attempt.paused_seconds_remaining
            attempt.paused_seconds_remaining = None
        else:
            paused_secs = 0

        attempt.save(update_fields=[
            "is_blocked",
            "blocked_at",
            "tab_switch_count",
            "expires_at",
            "paused_seconds_remaining",
            "updated_at",
        ])

        return {
            "attempt_id": str(attempt.id),
            "student_id": attempt.student.id,
            "student_name": getattr(attempt.student, "name", "") or attempt.student.email.split("@")[0],
            "email": attempt.student.email,
            "is_blocked": False,
            "tab_switch_count": attempt.tab_switch_count,
            "seconds_left": paused_secs,
            "expires_at": attempt.expires_at.isoformat() if attempt.expires_at else None,
        }
