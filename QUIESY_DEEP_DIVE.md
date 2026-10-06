# Quiesy — Complete Backend Deep Dive
### Interview Preparation: WebSockets, Redis, Celery, Database Design, and Every Line of Logic

> **This document is your single source of truth.** Read it before every interview.
> It covers the "what", "why", "how", and every engineering decision made in this project —
> written as if you built every line yourself (because you did).

---

## Table of Contents

1. [Project Overview — What Did We Actually Build?](#1-project-overview)
2. [Technology Stack & Why Each Tool Was Chosen](#2-technology-stack)
3. [Database Design — Every Table, Every Column, Every FK](#3-database-design)
4. [REST API — Every Endpoint Explained](#4-rest-api)
5. [The Real-Time Architecture — Why WebSockets?](#5-the-real-time-architecture)
6. [Redis — The Three Roles It Plays](#6-redis-three-roles)
7. [Django Channels & ASGI — Line-by-Line Code Breakdown](#7-django-channels-asgi)
8. [The Live Proctoring Engine — Full Event Flow](#8-live-proctoring-engine)
9. [Anti-Cheating Tab Switch System — Engineering Decisions](#9-anti-cheating-tab-switch)
10. [Celery — Background Job Processing](#10-celery)
11. [Frontend WebSocket Client — The React Side](#11-frontend-websocket)
12. [Bugs We Hit & How We Solved Them](#12-bugs-and-solutions)
13. [Interview Questions & Perfect Answers](#13-interview-qa)

---

## 1. Project Overview

**Quiesy** ek full-stack online exam platform hai jahan:

- **Teachers** quizzes create karte hain (MCQ, coding, subjective), students ko invite karte hain, aur **live exam monitor** karte hain real-time cockpit ke through.
- **Students** quiz join karte hain ek 6-character code se, timed exam dete hain, code execute karte hain, aur submit karte hain.
- **Live Proctoring System** real-time detect karta hai ki koi student tab switch kar raha hai, teacher ko instant alert deta hai, 3 switches ke baad student ko **auto-lock** karta hai, timer **pause** karta hai, aur teacher kabhi bhi student ko **unblock** kar sakta hai.

### The Core Engineering Challenge

Problem yeh hai ki traditional HTTP is use case ke liye completely fail hoti:

```
Student tab switch karta hai
  → Client API call karega?
  → Phir polling se teacher check karega?
  → Kitna delay?
  → 100 students ke saath kitne requests/second?
```

Solution: **Persistent WebSocket connections** + **Redis as a real-time message bus** + **Celery for async background processing**.

---

## 2. Technology Stack

| Technology | Role | Kyu Choose Kiya? |
|---|---|---|
| **Django 5.2** | Backend web framework | Batteries included — ORM, auth, admin |
| **Django REST Framework** | REST API layer | Serializers, permissions, ViewSets |
| **Django Channels** | WebSocket support | ASGI layer jo Django ko async banata hai |
| **Daphne** | ASGI server | HTTP + WebSocket dono handle karta hai |
| **Redis 7.x** | Channel Layer + Broker + Cache | In-memory, sub-millisecond pub/sub |
| **Celery 5.x** | Background task queue | Code execution async processing |
| **PostgreSQL 15** | Primary database | ACID, UUID support, indexes |
| **React 18 (Vite)** | Frontend | Component-based real-time UI |
| **Simple JWT** | Authentication | Stateless token auth |
| **Judge0** | Code execution sandbox | Safe remote code execution |

---

## 3. Database Design

### 3.1 Users Table (`apps/users/models.py`)

Custom user model, `AbstractUser` extend karta hai.

```python
AUTH_USER_MODEL = 'users.User'
```

**Key fields:**
| Field | Type | Purpose |
|---|---|---|
| `id` | BigAutoField | Primary key |
| `email` | EmailField (unique) | Username ki jagah email se login |
| `name` | CharField | Display name |
| `role` | CharField (choices) | `TEACHER` ya `STUDENT` |
| `is_verified` | BooleanField | Email OTP verification |
| `verification_otp` | CharField | 6-digit OTP |

**Why Custom User?** Django ka default User model `username` use karta hai. Humne `email` ko login identifier banaya. Yeh change migration ke baad change nahi ho sakta, isliye day 1 se `AUTH_USER_MODEL` set karna zaroori tha.

---

### 3.2 Question Table (`apps/quizzes/models.py`)

Teacher ka question bank — reusable across multiple quizzes.

```python
class Question(models.Model):
    teacher      = models.ForeignKey(settings.AUTH_USER_MODEL, ...)
    title        = models.CharField(max_length=255, blank=True)
    text         = models.TextField()
    question_type = models.CharField(choices=QuestionType.choices)
    # Choices: MCQ, MSQ, SUBJECTIVE, CODING
    difficulty   = models.CharField(choices=Difficulty.choices)
    # Choices: EASY, MEDIUM, HARD
    topic        = models.CharField(max_length=100)
    marks        = models.PositiveIntegerField(default=1)
    starter_code = models.TextField(blank=True)  # CODING questions ke liye
    is_active    = models.BooleanField(default=True)
```

**Design Decision:** Questions teacher ke personal question bank me hain. Ek question multiple quizzes me attach ho sakta hai via `QuizQuestion` (many-to-many through table). Isliye `Question` ko `on_delete=PROTECT` kiya gaya hai — delete hone se exam history corrupt na ho.

---

### 3.3 Option Table

```python
class Option(models.Model):
    question   = models.ForeignKey(Question, related_name="options")
    text       = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)
    order      = models.PositiveIntegerField(default=0)
```

**Note:** MSQ (Multiple Select) questions me multiple `is_correct=True` options ho sakte hain. Evaluation loop sabhi correct options check karta hai.

---

### 3.4 TestCase Table

```python
class TestCase(models.Model):
    question         = models.ForeignKey(Question, related_name="test_cases")
    input_data       = models.TextField()
    expected_output  = models.TextField()
    is_sample        = models.BooleanField(default=False)
    order            = models.PositiveIntegerField(default=0)
```

**`is_sample` field ka role:**
- `is_sample=True` — "Run Code" button par sirf yeh chalte hain (student output dekhne ke liye).
- `is_sample=False` — "Submit Code" par yeh hidden test cases judge karte hain actual scoring ke liye.

---

### 3.5 Quiz Table

```python
class Quiz(models.Model):
    teacher           = models.ForeignKey(settings.AUTH_USER_MODEL, ...)
    title             = models.CharField(max_length=200)
    subject           = models.CharField(max_length=100)
    quiz_code         = models.CharField(max_length=6, unique=True, editable=False,
                                         default=generate_quiz_code)
    status            = models.CharField(choices=Status.choices)
    # DRAFT → SCHEDULED → ACTIVE → CLOSED → EVALUATED
    duration_minutes  = models.PositiveIntegerField()
    starts_at         = models.DateTimeField(null=True)
    ends_at           = models.DateTimeField(null=True)
    max_attempts      = models.PositiveIntegerField(default=1)
    password          = models.CharField(blank=True)  # Optional quiz password
    shuffle_questions = models.BooleanField(default=False)
    shuffle_options   = models.BooleanField(default=False)
```

**`quiz_code` generation logic:**

```python
def generate_quiz_code():
    alphabet = string.ascii_uppercase + string.digits
    while True:
        code = ''.join(secrets.choice(alphabet) for _ in range(6))
        if not Quiz.objects.filter(quiz_code=code).exists():
            return code
```

`secrets.choice()` — `random.choice()` se zyada cryptographically secure hai.
Collision check loop mein hai — 36^6 = 2.1 billion possibilities mein collision practically zero hai.

**Indexes:**
```python
models.Index(fields=["teacher", "status"], name="quiz_teacher_st"),
models.Index(fields=["quiz_code"], name="quiz_code_idx"),
```
- `quiz_teacher_st` — Teacher dashboard pe teacher ki quizzes by status fetch hoti hain frequently.
- `quiz_code_idx` — Student join karte waqt `WHERE quiz_code='ABC123'` query instant honi chahiye.

---

### 3.6 QuizQuestion Table (Many-to-Many Through Table)

```python
class QuizQuestion(models.Model):
    quiz           = models.ForeignKey(Quiz, related_name="quiz_questions")
    question       = models.ForeignKey(Question, on_delete=models.PROTECT)
    order          = models.PositiveIntegerField(default=0)
    marks_override = models.PositiveIntegerField(null=True, blank=True)
    # Per-quiz custom marks override karne ki ability

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["quiz", "question"],
                                    name="unique_question_in_quiz")
        ]
```

**`marks_override` ka logic:**
Ek hi question ek quiz mein 5 marks ka aur doosri quiz mein 10 marks ka ho sakta hai without editing the original question.

Evaluation code:
```python
q_marks = qq.marks_override if (qq and qq.marks_override is not None) else question.marks
```

---

### 3.7 ExamAttempt Table — The Heart of the System

```python
class ExamAttempt(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student     = models.ForeignKey(settings.AUTH_USER_MODEL, ...)
    quiz        = models.ForeignKey(Quiz, ...)
    attempt_number = models.PositiveIntegerField(default=1)
    status      = models.CharField(choices=Status.choices)
    # IN_PROGRESS → SUBMITTED | EXPIRED

    started_at  = models.DateTimeField(auto_now_add=True)
    expires_at  = models.DateTimeField()       # started_at + duration_minutes
    submitted_at = models.DateTimeField(null=True)

    score       = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_score   = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    submit_idempotency_key = models.CharField(max_length=128, unique=True, null=True)

    # === Real-Time Proctoring Fields ===
    tab_switch_count         = models.PositiveIntegerField(default=0)
    is_blocked               = models.BooleanField(default=False)
    blocked_at               = models.DateTimeField(null=True, blank=True)
    paused_seconds_remaining = models.PositiveIntegerField(null=True, blank=True)
```

**Proctoring fields ka exact role:**

| Field | Type | Kab Set Hota Hai | Kab Use Hota Hai |
|---|---|---|---|
| `tab_switch_count` | Integer | Har tab switch par `+= 1` | Teacher cockpit mein warning badge |
| `is_blocked` | Boolean | 3rd switch pe `True` | Student ka timer freeze, exam block |
| `blocked_at` | DateTime | Block hone ka timestamp | Audit trail, block duration calculation |
| `paused_seconds_remaining` | Integer | Block ke waqt timer mein kitne seconds bache the | Unblock ke baad timer resume karna |

**`paused_seconds_remaining` kyu alag column?**

Agar hum `expires_at` use karte rehte block ke baad bhi, toh wall clock chalti rehti — student wapas aata toh timer already expire ho chuka hota ya bahut kam hota. Isliye block ke waqt remaining seconds snapshot save karte hain. Unblock par:

```python
attempt.expires_at = timezone.now() + timedelta(seconds=attempt.paused_seconds_remaining)
attempt.paused_seconds_remaining = None
```

**`submit_idempotency_key`:** Double-click ya network retry se duplicate submission prevent karta hai. Unique constraint DB level par enforce karta hai.

**`id` as UUID vs Integer:**
- Integer: `/attempts/1/`, `/attempts/2/` — predictable, enumerable, attackers iterate kar sakte hain.
- UUID: `550e8400-e29b-41d4-a716-446655440000` — 128-bit random, guessable nahi.

**Indexes:**
```python
models.Index(fields=["student", "quiz", "status"], name="att_stu_quiz_st"),
models.Index(fields=["quiz", "status"], name="att_quiz_st"),
models.Index(fields=["expires_at"], name="att_expires"),
```
- `att_quiz_st` — Live proctor roster: `WHERE quiz=X AND status='IN_PROGRESS'` instant.
- `att_expires` — Celery Beat expired attempt scan: `WHERE expires_at <= NOW()` fast.

---

### 3.8 Answer Table

```python
class Answer(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4)
    attempt     = models.ForeignKey(ExamAttempt, related_name="answers")
    question    = models.ForeignKey(Question, on_delete=models.PROTECT)
    answer_data = models.JSONField(default=dict)
    # MCQ:        {"selected": 3}
    # MSQ:        {"selected": [1, 3]}
    # Coding:     {"code": "...", "language": "python"}
    # Subjective: {"text": "..."}

    status      = models.CharField(choices=Status.choices)
    # NOT_ANSWERED → ANSWERED → PENDING (code submitted) → EVALUATED

    sequence    = models.PositiveIntegerField(default=0)
    idempotency_key = models.CharField(max_length=128, unique=True, null=True)
    execution_result = models.JSONField(null=True)
    # {"passed_count": 3, "total_count": 5, "all_passed": false, "results": [...]}
    evaluated_score = models.DecimalField(null=True)
```

**`sequence` field ka kaam:**

Student fast type karta hai — auto-save trigger hota hai. Network lag ki wajah se save #3 pehle aur save #2 baad mein server tak pahunch sakta hai. Backend:

```python
if incoming_sequence <= existing_answer.sequence:
    # Purana data ignore karo — naya already saved hai
    return existing_answer
```

**`answer_data` as JSONField:** Ek hi column mein sab question types — no extra tables for MCQ_answer, coding_answer, etc.

---

### 3.9 QuestionVersion Table

```python
class QuestionVersion(models.Model):
    question      = models.ForeignKey(Question, related_name="versions")
    version       = models.PositiveIntegerField()
    text          = models.TextField()
    question_type = models.CharField()
    marks         = models.PositiveIntegerField()
    snapshot      = models.JSONField()  # Complete question state at that version
```

**Kyu?** Teacher exam ke baad question edit kar sakta hai. Pehle diye gaye attempts ki evaluation wrong na ho isliye immutable version snapshots save hote hain.

---

## 4. REST API

### 4.1 Authentication (`/api/auth/`)

```
POST /api/auth/register/          → Register + OTP email
POST /api/auth/verify-email/      → OTP verify → account activate
POST /api/auth/login/             → Access + Refresh JWT token
POST /api/auth/refresh/           → New access token (15 min expiry)
POST /api/auth/logout/            → Refresh token blacklist
POST /api/auth/forgot-password/   → Reset email bhejo
POST /api/auth/reset-password/    → Naya password set karo
```

**JWT Configuration:**
```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,  # Old refresh token invalidate
}
```

`ROTATE_REFRESH_TOKENS`: Use karte hi naya refresh token milta hai. Old blacklist ho jaata hai — refresh token theft prevent.

---

### 4.2 Quiz Teacher APIs (`/api/v1/quizzes/`)

```
GET    /api/v1/quizzes/                       → Saari quizzes list
POST   /api/v1/quizzes/                       → Nayi quiz create
GET    /api/v1/quizzes/{id}/                  → Single quiz detail
PATCH  /api/v1/quizzes/{id}/                  → Update quiz
DELETE /api/v1/quizzes/{id}/                  → Delete quiz
POST   /api/v1/quizzes/{id}/activate/         → Status → ACTIVE
POST   /api/v1/quizzes/{id}/close/            → Status → CLOSED
GET    /api/v1/quizzes/{id}/live-proctor/     → Live roster (HTTP snapshot)
GET    /api/v1/quizzes/{id}/results/          → Post-exam results
```

---

### 4.3 Student APIs (`/api/v1/students/`)

```
POST /api/v1/students/join-quiz/
  → Quiz code + password validate karo

GET  /api/v1/students/quizzes/{quiz_code}/instructions/
  → Quiz meta + questions (shuffled if needed)

POST /api/v1/students/quizzes/{quiz_id}/start/
  → ExamAttempt create: expires_at = now + duration_minutes

GET  /api/v1/students/attempts/{attempt_id}/
  → Current attempt state (exam resume)

POST /api/v1/students/attempts/{attempt_id}/answers/
  → Answer save (idempotent, sequence-checked)

POST /api/v1/students/attempts/{attempt_id}/submit/
  → Exam submit (idempotency key se duplicate-proof)

POST /api/v1/students/run-code/
  → Code run on sample test cases (synchronous)

POST /api/v1/students/submit-code/
  → Code submit for full evaluation (Celery async)

GET  /api/v1/students/code-tasks/{task_id}/
  → Celery task status poll karo
```

---

### 4.4 WebSocket Endpoint (WS, not HTTP)

```
ws://host/ws/quiz-proctor/{quiz_id}/
```

Yeh HTTP URL nahi — WebSocket URL hai. `routing.py` mein define hota hai, `urls.py` mein nahi.

---

## 5. The Real-Time Architecture — Why WebSockets?

### HTTP Polling — The Wrong Approach

```
Teacher dashboard har 2 second mein:
  GET /api/v1/students/live-status/
  100 students * har 2 sec = 50 req/sec
  Lag: 0-2 seconds average
  Scale 1000 students: 500 req/sec — server down
```

### WebSocket — The Right Approach

```
Student tab switch karta hai
  → ws.send() — same open TCP connection
  → Server instantly process karta hai
  → Redis broadcast hota hai
  → Teacher browser turant receive karta hai
  → Total delay: ~20-100ms (sirf network latency)
```

**WebSocket Connection Upgrade:**
```
Browser → GET /ws/quiz-proctor/1/ HTTP/1.1
          Upgrade: websocket
          Connection: Upgrade

Server  → HTTP/1.1 101 Switching Protocols
          Upgrade: websocket
```

HTTP 101 ke baad yeh TCP connection hamesha ke liye open rehta hai — **full-duplex**, dono directions mein kabhi bhi data flow.

---

## 6. Redis — Three Roles

### 6.1 Role 1: Channel Layer (WebSocket Message Bus)

**The Problem:**
```
[Student] ← connected → [Daphne Worker Process #1] ← memory space A
[Teacher] ← connected → [Daphne Worker Process #2] ← memory space B

Student tab switch karta hai → Process #1 mein event aata hai
Process #1 ko Process #2 se kaise baat karni hai? → Shared memory nahi!
```

**Redis Pub/Sub Solution:**

```
Student (Worker #1):
    channel_layer.group_send("quiz_proctor_1", {...})
        → Internally: PUBLISH quiz_proctor_1 <json_message>

Redis:
    → Sabhi "quiz_proctor_1" subscribers ko notify karo

Teacher (Worker #2):
    → SUBSCRIBE quiz_proctor_1 (connect hone par)
    → Message receive hota hai
    → proctor_event() method automatically call hoti hai
    → self.send() → Teacher browser pe message
```

**Configuration:**
```python
# settings.py
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [os.getenv("REDIS_URL")],
        },
    },
}
```

**Fallback for development:**
```python
# Agar REDIS_URL nahi hai (local development):
else:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        }
    }
```

---

### 6.2 Role 2: Celery Message Broker

```python
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
```

**Flow when student submits code:**
```
1. Web Server (fast):
   evaluate_code_submission.delay(attempt_id, question_id, code, language)
   → Celery serializes args to JSON
   → Redis: LPUSH celery_task_queue <json>
   → View immediately returns {"task_id": "abc123"} — non-blocking!

2. Celery Worker (separate process):
   → BRPOP celery_task_queue  (blocking pop wait)
   → Task dequeue hota hai
   → Judge0 API call (3-10 seconds)
   → Result DB mein save
   → Redis: SET celery-task-meta-abc123 <result>

3. Student polls:
   → GET /api/v1/students/code-tasks/abc123/
   → Result Redis se fetch → JSON response
```

---

### 6.3 Role 3: Django Cache

```python
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "KEY_PREFIX": "quiesy",
        "TIMEOUT": 300,  # 5 minutes
    }
}
```

Quiz discovery, frequently accessed data — Redis cache mein store hota hai. PostgreSQL ko unnecessary repeated queries se bachate hain.

---

## 7. Django Channels & ASGI — Line-by-Line Code Breakdown

### 7.1 `asgi.py` — The Entry Point

```python
# backend/asgi.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()  # Settings load karo — Daphne manage.py se start nahi karta

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import apps.quizzes.routing

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,         # Normal HTTP → Django views
    "websocket": AuthMiddlewareStack( # WebSocket → Consumer
        URLRouter(
            apps.quizzes.routing.websocket_urlpatterns
        )
    ),
})
```

**Line by line:**

| Code | Kya karta hai |
|---|---|
| `django.setup()` | Settings load karta hai — Daphne directly `asgi.py` import karta hai |
| `ProtocolTypeRouter` | `scope["type"]` check: `"http"` ya `"websocket"` — traffic cop |
| `AuthMiddlewareStack` | HTTP cookies/headers se user session nikalta hai, `scope["user"]` populate |
| `URLRouter` | WebSocket URL matching — `path()` ka WS equivalent |

---

### 7.2 `routing.py` — WebSocket URL Matching

```python
# apps/quizzes/routing.py
from django.urls import re_path
from .consumers import QuizProctorConsumer

websocket_urlpatterns = [
    re_path(r"^ws/quiz-proctor/(?P<quiz_id>\d+)/$", QuizProctorConsumer.as_asgi()),
]
```

**`re_path` kyu, `path` nahi?**
`path()` converters (`<int:quiz_id>`) Django Channels ke saath sometimes unreliable hain. `re_path` with named capture group `(?P<quiz_id>\d+)` stable aur explicit hai.

**`as_asgi()`:** Consumer class ko ASGI callable banata hai — Django views mein `as_view()` ka WebSocket equivalent.

---

### 7.3 `consumers.py` — The WebSocket Brain (Complete)

#### connect() — New WebSocket Connection

```python
class QuizProctorConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        # URL se quiz_id extract karo
        self.quiz_id = self.scope["url_route"]["kwargs"]["quiz_id"]
        # Group name: "quiz_proctor_1" (quiz_id=1 ke liye)
        self.room_group_name = f"quiz_proctor_{self.quiz_id}"

        # Redis mein is client ko group mein add karo
        await self.channel_layer.group_add(
            self.room_group_name,  # Group: "quiz_proctor_1"
            self.channel_name,      # Unique channel ID: "specific.XyZ!123"
        )
        await self.accept()  # HTTP 101 → WebSocket upgrade complete
        logger.info(f"Connected to proctor room: {self.room_group_name}")
```

**`self.channel_name`:** Daphne har naye WebSocket client ko ek globally unique string assign karta hai (e.g., `"specific.XyZ9kL!789"`). Redis mein yeh key ban jaata hai.

**`group_add` Redis mein:**
```redis
SADD "asgi::group::quiz_proctor_1"  "specific.XyZ9kL!789"  # Student
SADD "asgi::group::quiz_proctor_1"  "specific.AbC3mN!012"  # Teacher
# Dono ek hi group mein
```

---

#### disconnect() — Connection Close

```python
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name,
        )
```

Redis mein se remove:
```redis
SREM "asgi::group::quiz_proctor_1" "specific.XyZ9kL!789"
```

---

#### receive() — Message Dispatcher

```python
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)  # JSON parse karo
            action = data.get("action")   # Action field nikalo

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
            logger.exception(f"Error: {e}")
```

**Design Pattern:** Action-based RPC (Remote Procedure Call) over WebSocket. Ek hi connection se multiple message types handle hoti hain via `action` string.

---

#### `@database_sync_to_async` — THE MOST CRITICAL CONCEPT

```python
    @database_sync_to_async
    def record_tab_switch(self, attempt_id, seconds_left):
        # Yeh method SYNCHRONOUS hai — normal Django ORM code
        attempt = ExamAttempt.objects.select_related("student").filter(id=valid_uuid).first()

        try:
            parsed_seconds = max(0, int(float(seconds_left or 0)))
        except (ValueError, TypeError):
            parsed_seconds = 0

        attempt.tab_switch_count += 1
        is_now_blocked = False

        if attempt.tab_switch_count >= 3:
            attempt.is_blocked = True
            if not attempt.blocked_at:          # Sirf pehli baar set karo
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
            "student_name": ...,
            "tab_switch_count": attempt.tab_switch_count,
            "is_blocked": bool(attempt.is_blocked),
            "paused_seconds_remaining": attempt.paused_seconds_remaining,
        }
```

**Kyu `@database_sync_to_async`?**

```
Async Event Loop (single thread) chalata hai:
    → receive() async function hai
    → Agar directly attempt.save() call karo (blocking!) → event loop freeze!
    → Koi doosra WebSocket message process nahi hoga jab tak DB write na ho

Solution: @database_sync_to_async
    → Blocking ORM code ko Django ka thread pool mein push karo
    → Event loop free rahta hai
    → Thread DB write karta hai background mein
    → Completion par Future via asyncio resolve hota hai
```

**`update_fields` optimization:**
```python
# Without update_fields:
UPDATE exam_attempt SET col1=x, col2=y, col3=z, ... ALL COLUMNS WHERE id=uuid
# Race condition possible!

# With update_fields:
UPDATE exam_attempt SET tab_switch_count=3, is_blocked=True, ... WHERE id=uuid
# Atomic, targeted, faster
```

---

#### group_send → proctor_event — The Broadcast Pipeline

```python
    async def handle_tab_switch(self, data):
        result = await self.record_tab_switch(attempt_id, seconds_left)
        if result:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "proctor_event",   # ← Method name jo call hogi
                    "event": "TAB_SWITCH_LOGGED",
                    "data": result,
                }
            )

    # Yeh method har connected client ke consumer mein call hoti hai
    async def proctor_event(self, event):
        await self.send(text_data=json.dumps({
            "event": event["event"],
            "data": event["data"],
        }))
```

**`type: "proctor_event"` kya karta hai?**

`group_send` Redis mein message publish karta hai. Redis se har subscriber consumer mein Channels framework `type` field ka `"."` → `"_"` replace karke method call karta hai: `"proctor_event"` → `self.proctor_event(event)`. Yeh automatically sabhi connected Teacher aur Student browsers tak message push karta hai.

---

#### unblock_student_db — Timer Resume Logic

```python
    @database_sync_to_async
    def unblock_student_db(self, attempt_id, reset_counter):
        attempt = ExamAttempt.objects.select_related("student").filter(id=valid_uuid).first()

        attempt.is_blocked = False
        attempt.blocked_at = None

        if reset_counter:
            attempt.tab_switch_count = 0        # Full pardon
        else:
            attempt.tab_switch_count = min(attempt.tab_switch_count, 2)
            # Cap at 2 so NEXT switch = instant block (3rd strike)

        # Timer resume karo
        if attempt.paused_seconds_remaining is not None and attempt.paused_seconds_remaining > 0:
            attempt.expires_at = timezone.now() + timedelta(seconds=attempt.paused_seconds_remaining)
            paused_secs = attempt.paused_seconds_remaining
            attempt.paused_seconds_remaining = None  # Clear karo
        else:
            paused_secs = 0

        attempt.save(update_fields=["is_blocked", "blocked_at", "tab_switch_count",
                                     "expires_at", "paused_seconds_remaining", "updated_at"])

        return {
            "attempt_id": str(attempt.id),
            "is_blocked": False,
            "tab_switch_count": attempt.tab_switch_count,
            "seconds_left": paused_secs,  # Student ka timer yahan se start hoga
        }
```

**`min(attempt.tab_switch_count, 2)` logic:**
Teacher student ko unblock karta hai but 3rd strike rule still apply hota hai. Agar counter reset karo 2 par, next switch pe immediately block ho jaayega. Yeh "yellow card still in pocket" behavior hai.

---

## 8. Live Proctoring Engine — Full Event Flow

### Event 1: Student Joins

```
1. Student browser → WebSocket connect: ws://127.0.0.1:8000/ws/quiz-proctor/1/
2. connect(): group_add("quiz_proctor_1", channel_name) → accept()
3. Student sends: { "action": "STUDENT_JOINED", "attempt_id": "uuid-..." }
4. handle_student_joined():
     → get_attempt_info(attempt_id) [DB query]
       → Select ExamAttempt JOIN User WHERE id=uuid
       → Calculate seconds_left, answered_count
     → group_send("quiz_proctor_1", {event: "STUDENT_JOINED", data: student_info})
5. Redis PUBLISH → quiz_proctor_1 subscribers ko notify
6. Teacher ka consumer → proctor_event() → self.send(JSON)
7. Teacher React: setCandidates([newStudent, ...prev])
8. Teacher table mein student instantly appear hota hai
```

---

### Event 2: Tab Switch

```
1. Student browser: document.visibilitychange ya window.blur fire hota hai
2. handleFocusLoss() (DOM event, React se bahar):
     → Checks: isBlockedRef? already away? 300ms cooldown?
     → wsRef.current.send({ action: "TAB_SWITCH", seconds_left: timeLeftRef.current })
        ← IMMEDIATE send (background throttling se pehle)
     → tabSwitchesRef.current += 1
     → Agar count >= 3: isBlockedRef = true, setIsBlocked(true)
     → Warna: setShowWarningModal(true)

3. Server receive():
4. handle_tab_switch():
     → record_tab_switch() [DB atomic update]:
         tab_switch_count += 1
         IF >= 3: is_blocked=True, blocked_at=now(), paused_seconds_remaining=seconds_left
     → group_send(TAB_SWITCH_LOGGED result)

5. Redis broadcast → Teacher + Student dono receive

6. Teacher React (TAB_SWITCH_LOGGED):
     → setCandidates update: is_blocked=True/False, tab_switch_count
     → setTelemetryAlerts: ⚠️ ya 🚨 alert push karo

7. Student React (same message, same WS):
     → Agar is_blocked: timer stop, block screen show
     → Warna: warning modal
```

---

### Event 3: Teacher Unblocks

```
1. Teacher "Unblock" click:
   wsRef.current.send({
       action: "TEACHER_UNBLOCK",
       attempt_id: "uuid-...",
       reset_counter: false  // ya true
   })

2. handle_teacher_unblock():
   → unblock_student_db():
       is_blocked = False
       blocked_at = None
       tab_switch_count = min(current, 2)  // ya 0 if reset_counter
       expires_at = now() + paused_seconds_remaining
       paused_seconds_remaining = None
   → group_send(STUDENT_UNBLOCKED)

3. Student React (STUDENT_UNBLOCKED, attempt_id match):
   → isBlockedRef.current = false
   → setIsBlocked(false)
   → setTimeLeft(data.seconds_left)  // Timer resume
   → isAwayRef.current = false       // Tab switch detection reset
   → Block screen hata do

4. Teacher React (same event):
   → candidate.is_blocked = false
   → liveStats.currently_blocked decrement
   → Unblock button remove, Telemetry 🔓 alert
```

---

## 9. Anti-Cheating Tab Switch System — Engineering Decisions

### 9.1 Chrome Background Tab Throttling Bug

**Initial Wrong Code:**
```javascript
setTabSwitches((prev) => {
    const nextCount = prev + 1
    wsRef.current.send(...)  // ❌ React state updater ke andar
    return nextCount
})
```

**Problem:** Jaise hi student ne tab switch kiya, Chrome ne background tab ke JavaScript execution throttle kar diya. React state updater callbacks bhi throttled hoti hain. WebSocket packet tab tak nahi jaata jab tak student wapas na aaye.

**Fixed Code:**
```javascript
const handleFocusLoss = () => {
    // State check nahi, Ref check — always fresh value
    if (isBlockedRef.current || isTimeUp) return
    if (!document.hidden && document.hasFocus()) return  // False alarm ignore

    const now = Date.now()
    // Duplicate event deduplication (blur + visibilitychange dono fire hote hain)
    if (isAwayRef.current && (now - lastTabSwitchTimeRef.current < 1000)) return
    if (now - lastTabSwitchTimeRef.current < 300) return  // Min cooldown

    isAwayRef.current = true
    lastTabSwitchTimeRef.current = now

    const nextCount = (tabSwitchesRef.current || 0) + 1
    tabSwitchesRef.current = nextCount  // Ref immediately update

    // ✅ ws.send FIRST — DOM event handler mein, Chrome throttle se pehle
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
            action: "TAB_SWITCH",
            attempt_id: currentAttemptId,
            seconds_left: timeLeftRef.current || 0,  // Ref, not state
        }))
    }

    setTabSwitches(nextCount)  // UI ke liye (can be delayed — OK)

    if (nextCount >= 3) {
        isBlockedRef.current = true  // Ref immediate
        setIsBlocked(true)           // State for re-render
        setShowWarningModal(false)
    } else {
        setShowWarningModal(true)
    }
}
```

**Key Insight:** `ws.send()` DOM event handler mein synchronously hona chahiye. React `setState` asynchronous aur throttleable hai — sirf UI ke liye OK hai.

---

### 9.2 Refs vs State — Decision Table

| Data | Ref | State | Reason |
|---|---|---|---|
| `tabSwitchesRef` | ✅ | — | Event listener mein fresh value chahiye (no stale closure) |
| `isBlockedRef` | ✅ | — | DOM event handler stale closure se bachne ke liye |
| `timeLeftRef` | ✅ | — | WebSocket packet mein live timer value chahiye |
| `wsRef` | ✅ | — | WS object re-render par replace nahi hona chahiye |
| `isAwayRef` | ✅ | — | Cross-event synchronization (blur + visibilitychange) |
| `tabSwitches` | — | ✅ | Warning counter UI display ke liye |
| `isBlocked` | — | ✅ | Block screen conditional rendering |
| `timeLeft` | — | ✅ | Timer UI display |

**Stale Closure Explained:**
```javascript
useEffect(() => {
    const handleFocus = () => {
        console.log(isBlocked)  // Captures isBlocked value at mount time (false)
        // State baad mein true ho gaya toh bhi yeh false hi dekhega!
    }
    window.addEventListener('blur', handleFocus)
}, [])  // isBlocked dependency nahi hai

// Fix: useRef
const isBlockedRef = useRef(false)
// isBlockedRef.current = always latest value, koi closure issue nahi
```

---

### 9.3 Reconnection Spam — Two-Layer Deduplication

**Student side (`hasSentJoinedRef`):**
```javascript
const hasSentJoinedRef = useRef(false)

ws.onopen = () => {
    if (!hasSentJoinedRef.current) {
        hasSentJoinedRef.current = true
        ws.send({ action: "STUDENT_JOINED" })  // Session mein sirf ek baar
    } else {
        ws.send({ action: "STUDENT_HEARTBEAT" })  // Reconnection = silent heartbeat
    }
}
```

**Teacher side (`announcedJoinsRef`):**
```javascript
const announcedJoinsRef = useRef(new Set())

// Initial roster load par seed karo
initialCandidates.forEach((c) => {
    announcedJoinsRef.current.add(String(c.attempt_id))
})

// STUDENT_JOINED event:
const attemptKey = String(data.attempt_id)
if (!announcedJoinsRef.current.has(attemptKey)) {
    announcedJoinsRef.current.add(attemptKey)
    setTelemetryAlerts((prev) => [joinAlert, ...prev])  // Sirf ek baar
}
// Already announced → silently update candidate data, no alert
```

---

## 10. Celery — Background Job Processing

### 10.1 `celery.py` — Configuration

```python
# backend/celery.py
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
# namespace='CELERY' → CELERY_BROKER_URL, CELERY_RESULT_BACKEND, etc. pick karo settings se

app.autodiscover_tasks()
# Sabhi registered apps ke tasks.py auto-discover karo
```

---

### 10.2 `evaluate_code_submission` — Full Breakdown

```python
@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def evaluate_code_submission(self, attempt_id, question_id, code, language):
```

**Decorator arguments:**
- `bind=True` → `self` milta hai — `self.retry()` call kar sakte hain
- `max_retries=3` → Max 3 attempts total
- `default_retry_delay=5` → 5 seconds baad retry

```python
    # 1. Validate
    attempt = ExamAttempt.objects.filter(id=attempt_id).first()
    question = Question.objects.filter(id=question_id).first()

    # 2. Test cases fetch
    test_cases = list(question.test_cases.all().values("id", "input_data", "expected_output"))

    # 3. Judge0 API call (slow operation)
    batch_results = run_code_batch(code, language, test_cases)

    # 4. Score calculate
    passed_cases = sum(1 for r in batch_results if r.get("passed"))
    q_marks = qq.marks_override if qq.marks_override else question.marks
    earned_marks = round((passed_cases / total_cases) * float(q_marks), 2)

    # 5. Atomic DB commit — ya dono ho ya dono fail
    with transaction.atomic():
        answer, _ = Answer.objects.get_or_create(attempt=attempt, question=question, ...)
        answer.evaluated_score = earned_marks
        answer.execution_result = {"passed_count": passed, "total_count": total, ...}
        answer.status = Answer.Status.EVALUATED
        answer.save()

        # Attempt total score recalculate
        evaluated_sum = Answer.objects.filter(attempt=attempt).aggregate(
            Sum("evaluated_score")
        )["evaluated_score__sum"] or 0
        attempt.score = evaluated_sum
        attempt.save(update_fields=["score", "last_activity", "updated_at"])

    return {"status": "COMPLETED", "all_passed": all_passed, "earned_score": earned_marks, ...}

    except Exception as exc:
        raise self.retry(exc=exc)  # 5 sec baad retry
```

---

### 10.3 `auto_submit_expired_attempts` — Celery Beat

```python
@shared_task
def auto_submit_expired_attempts():
    now = timezone.now()
    expired = ExamAttempt.objects.filter(
        status=ExamAttempt.Status.IN_PROGRESS,
        expires_at__lte=now         # Index att_expires use hoga
    )
    count = 0
    for attempt in expired:
        attempt.status = ExamAttempt.Status.EXPIRED
        attempt.submitted_at = now
        attempt.save(update_fields=["status", "submitted_at", "updated_at"])
        count += 1
    return f"Auto-expired {count} attempt(s)."
```

Celery Beat (cron-like) se yeh task har X minutes scheduled rehti hai. Students jo network disconnect ho gaye ya browser close kar gaye — unka attempt server-side expire hota hai.

---

## 11. Frontend WebSocket Client — The React Side

### Connection with Auto-Reconnect

```javascript
const connectWs = () => {
    if (isIntentionalCloseRef.current) return  // Unmount par reconnect nahi

    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/quiz-proctor/${effectiveQuizId}/`)
    wsRef.current = ws

    ws.onopen = () => {
        if (!hasSentJoinedRef.current) {
            hasSentJoinedRef.current = true
            ws.send(JSON.stringify({ action: "STUDENT_JOINED", attempt_id: currentAttemptId }))
        } else {
            ws.send(JSON.stringify({ action: "STUDENT_HEARTBEAT", ... }))
        }
    }

    ws.onclose = (ev) => {
        // Close code 1000 = intentional (submit/unmount) → reconnect nahi
        // Close code 1011, 1006 = server error/network drop → reconnect karo
        if (!isIntentionalCloseRef.current && ev.code !== 1000) {
            reconnectTimeoutRef.current = setTimeout(connectWs, 2500)
        }
    }
}

// Cleanup
return () => {
    isIntentionalCloseRef.current = true
    clearTimeout(reconnectTimeoutRef.current)
    wsRef.current?.close(1000, "Component unmounted")
}
```

### 10-Second Heartbeat

```javascript
const heartbeatInterval = setInterval(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
            action: "STUDENT_HEARTBEAT",
            attempt_id: currentAttemptId,
            seconds_left: timeLeftRef.current,  // Live timer value via ref
            answered_count: Object.keys(answersRef.current || {}).length,
        }))
    }
}, 10000)
```

Teacher cockpit mein answered count aur timer bina extra interaction ke update hota rehta hai.

---

## 12. Bugs We Hit & How We Solved Them

### Bug 1: WebSocket Close Code 1011

**Symptom:** Teacher ka WS connect ho ke turant disconnect.
**Cause:** `CHANNEL_LAYERS` settings nahi thi — `group_add()` crash karta tha.
**Fix:** Proper Redis Channel Layer configuration + development fallback.

---

### Bug 2: "Bittu Roy joined" Spam Alert

**Symptom:** Ek student ka join alert baar baar aata tha.
**Cause:** `useEffect` dependencies unstable thi → WS reconnect → duplicate STUDENT_JOINED.
**Fix:** `hasSentJoinedRef` (client) + `announcedJoinsRef` Set (server/teacher).

---

### Bug 3: 3 Switches But Teacher Sees 2

**Symptom:** Student 3 tab switch karta, teacher sirf 2 dekhta.
**Cause 1:** 800ms debounce 3rd rapid switch drop kar deta.
**Cause 2:** `ws.send()` React state updater ke andar → background throttling.
**Fix:** `isAwayRef` + 300ms cooldown + `ws.send()` DOM event handler mein turant.

---

### Bug 4: Blocked Status Not Reflecting

**Symptom:** Backend mein `is_blocked=True`, teacher table mein "Active" dikhta.
**Cause:** Filter mein `!c.is_blocked` use tha, row rendering mein `c.tab_switch_count >= 3` use tha — inconsistency.
**Fix:** Everywhere consistent:
```javascript
const isBlockedNow = Boolean(data.is_blocked || data.tab_switch_count >= 3)
```

---

### Bug 5: Timer Overwrite on Multiple Blocks

**Symptom:** Agar kisi reason se student 4th+ switch karta (edge case), `paused_seconds_remaining` 0 se overwrite ho jaata tha.
**Cause:** `record_tab_switch` har block par `paused_seconds_remaining = parsed_seconds` set karta tha unconditionally.
**Fix:**
```python
if attempt.paused_seconds_remaining is None or attempt.paused_seconds_remaining == 0:
    attempt.paused_seconds_remaining = parsed_seconds
# Pehle se frozen value ko preserve karo
```

---

## 13. Interview Questions & Perfect Answers

---

**Q: "HTTP Long Polling ya SSE kyu nahi use kiya?"**

> Long Polling: Client bar bar HTTP requests karta hai — wasteful, high server load, 0-N seconds delay. SSE (Server-Sent Events): Sirf server-to-client unidirectional hai. Humein bidirectional chahiye tha: student event bhejta hai (tab switch), teacher command bhejta hai (unblock), teacher broadcast karta hai. WebSocket full-duplex persistent connection hai — ek TCP tunnel, dono directions simultaneously.

---

**Q: "Agar Redis down ho jaye toh kya hoga?"**

> `channel_layer.group_send()` exception throw karega — consumer mein `try/except` hai, error log hoga. WebSocket messages deliver nahi honge — graceful degradation. Celery tasks queue nahi honge. Production mein Redis Sentinel (automatic failover) ya Redis Cluster (distributed) use karna chahiye. Development mein humne InMemoryChannelLayer fallback rakha hai.

---

**Q: "Django ORM async kyu nahi hai?"**

> Django ORM Python's DB-API 2.0 par based hai jo fundamentally synchronous hai. Async DB drivers (asyncpg, etc.) different APIs use karte hain. `@database_sync_to_async` decorator blocking ORM call ko Django ke thread pool executor mein run karta hai — event loop free rehta hai dusre requests process karne ke liye. Thread DB wait karta hai background mein, event loop unblocked.

---

**Q: "10,000 students exam dein toh scale kaise karoge?"**

> 1. Multiple Daphne instances + nginx load balancer — Redis Channel Layer automatically messages route karta hai across instances.
> 2. Celery workers horizontal scale — more workers = more parallel code evaluations.
> 3. PostgreSQL read replicas — live proctor queries read-only replica pe.
> 4. Redis Cluster — Channel Layer messages distribute honge.
> 5. Connection pooling — `conn_max_age=600` already set.
> 6. Rate limiting — `THROTTLE_RATES` already configured.

---

**Q: "`update_fields` kyu use kiya?"**

> Without `update_fields`: `UPDATE exam_attempt SET ALL_COLUMNS WHERE id=uuid` — race condition! Concurrent request dono full row read karte hain, dono update karte hain — ek ka change doosra overwrite kar deta hai.
> With `update_fields`: `UPDATE exam_attempt SET tab_switch_count=3, is_blocked=True WHERE id=uuid` — sirf targeted columns, atomic, faster network transfer, no overwrite risk.

---

**Q: "WebSocket authentication kaise kiya?"**

> `AuthMiddlewareStack` HTTP headers se JWT token read karta hai aur `scope["user"]` populate karta hai. Consumer mein `self.scope["user"]` se current user milta hai. Auth check `connect()` mein possible hai — unauthorized user ko `self.close()` ya `await self.close()` kar sakte hain bina `accept()` ke.

---

**Q: "`transaction.atomic()` kab use kiya?"**

> `evaluate_code_submission` mein — `answer.save()` aur `attempt.score` update dono ek saath hone chahiye. Agar answer save ho aur score update fail ho, inconsistent data hoga (answer evaluated but score 0). `atomic()` ensure karta hai: ya dono commit, ya dono rollback. Database hamesha consistent state mein rehta hai.

---

**Q: "UUID primary key vs Integer — kyu UUID?"**

> Integer IDs: `/attempts/1/`, `/attempts/2/` — enumerable, attacker can iterate through all attempts. UUID: `550e8400-e29b-41d4-a716-446655440000` — 128-bit cryptographically random, practically impossible to guess. Tradeoff: UUID index size larger (16 bytes vs 8 bytes for bigint) — acceptable for security benefit.

---

*Document Version: 1.0 | Project: Quiesy Live Exam Platform*
*Created for Interview Preparation — October 2026*
