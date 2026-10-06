# QUIESY — COMPLETE LEARNING + INTERVIEW PREPARATION GUIDE

> Source-code-first documentation for the current main branch of Quiesy. Existing documentation is treated as secondary context. When documentation and implementation disagree, the implementation wins.

## SOURCE-OF-TRUTH STATUS

### Verified in source

- Django 5.2.12
- Django REST Framework 3.16.1
- React 19.2.4
- Vite 7.3.1
- React Router 7.13.1
- TanStack React Query
- Tailwind CSS 4
- Framer Motion
- Monaco Editor
- Recharts dependency
- Simple JWT
- PostgreSQL configuration with SQLite fallback
- Redis
- Django Channels
- WebSockets
- Celery
- Judge0
- Piston fallback
- Gemini through LangChain Google GenAI
- Pydantic
- Docker
- CORS
- SMTP email
- Django admin
- user and student tests

### Important implementation limitations found

1. backend/backend/asgi.py defines the WebSocket architecture, but backend/Dockerfile launches Gunicorn with backend.wsgi:application rather than an ASGI application.
2. Daphne is installed but not launched by the Dockerfile.
3. Quiz statuses include DRAFT, SCHEDULED, ACTIVE, CLOSED and EVALUATED, but only some transitions are implemented in source.
4. auto_submit_expired_attempts exists, but a verified Celery Beat schedule is not present. The task marks attempts expired; it does not run the full grading path.
5. SubmitCodeView is asynchronous only when async=true is supplied. The default branch directly calls the task function.
6. QuizProctorConsumer is wrapped by AuthMiddlewareStack, but connect() and receive() do not explicitly authorize role, quiz ownership or attempt ownership.
7. shuffle_questions and shuffle_options exist as fields, but actual backend randomization was not verified.
8. AnswerListCreateView references Answer.Status.SAVED, but Answer.Status does not define SAVED.
9. RunCodeView and SubmitCodeView do not verify that the given question belongs to the student's active attempt/quiz.
10. CodeTaskStatusView does not bind task ownership to the requesting student.
11. QuestionVersion is historical snapshot storage; ExamAttempt is not directly linked to a QuestionVersion.
12. StartQuiz.jsx contains an older flow with endpoints not present in the current student URL configuration.

---

# 1. QUIESY AT A GLANCE

Quiesy is a full-stack online examination platform.

Teachers manage a reusable question bank, create quizzes, configure timing and access, attach questions, schedule or activate quizzes, view results and monitor active candidates.

Students discover or join quizzes, read instructions, start timed attempts, answer questions, save progress, run code, submit code, submit exams and review results.

Supported question types:

- MCQ
- MSQ
- SUBJECTIVE
- CODING

## One-minute interview explanation

> “Quiesy is a full-stack online examination platform built with React and Django REST Framework. Teachers can build quizzes from a reusable question bank containing MCQ, MSQ, subjective and coding questions. Students can discover quizzes, start timed attempts, save answers, execute coding solutions through remote execution services, submit exams and review results.
>
> The backend uses Django ORM and DRF for normal APIs. JWT is used for authentication and roles are enforced in backend permissions. For real-time monitoring I used Django Channels and WebSockets. Student events such as joining, tab switching and heartbeat telemetry are sent through a quiz-specific WebSocket room, while teachers can receive those events and send commands such as unblock or broadcast. Redis is configured as the Channels backend, Django cache backend and Celery broker/result backend.
>
> I also implemented question version snapshots, sequence-aware answer saving, idempotency-related protections, rate limiting and remote code execution. I would also be honest about current hardening work, especially WebSocket authorization, code-task ownership, strict security configuration and ASGI deployment.”

## Five-minute architecture explanation

~~~text
                         React / Vite
                    Student + Teacher UI
                            |
                  +---------+---------+
                  |                   |
                HTTP             WebSocket
                  |                   |
                  v                   v
            Django + DRF       Django Channels
                  |                   |
                  |             Channel Layer
                  |                   |
                  v                   v
           PostgreSQL/SQLite         Redis
                  |
                  |
                  +----------> Celery
                                 |
                                 v
                           Judge0 / Piston
~~~

Important deployment caveat: the source contains ASGI WebSocket routing, but the Docker startup command currently launches WSGI Gunicorn.

---

# 2. COMPLETE SYSTEM ARCHITECTURE

## HTTP request path

~~~text
React component
    |
API helper
    |
Axios interceptor
    |
Bearer access token
    |
Django URL
    |
APIView / ViewSet
    |
Permission
    |
Serializer / business logic
    |
Django ORM
    |
Database
    |
DRF Response
    |
Axios
    |
React state/UI
~~~

## WebSocket path

~~~text
Browser
    |
new WebSocket(...)
    |
/ws/quiz-proctor/<quiz_id>/
    |
ProtocolTypeRouter
    |
AuthMiddlewareStack
    |
URLRouter
    |
QuizProctorConsumer
    |
channel_layer.group_send()
    |
Redis channel layer
    |
other connected consumers
    |
browser
~~~

## Coding path

~~~text
QuizAttempt.jsx
    |
submitCode()
    |
SubmitCodeView
    |
+-----------------------------+
| async=true                  |
|     |                       |
|     v                       |
| Celery .delay()             |
|     |                       |
|     v                       |
| worker                      |
+-----------------------------+
    |
run_code_batch()
    |
Judge0
    |
Piston fallback if needed
    |
Answer + score
~~~

---

# 3. REPOSITORY MAP

~~~text
quiesy_main/
├── README.md
├── QUIESY_DEEP_DIVE.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   ├── backend/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   ├── wsgi.py
│   │   └── celery.py
│   └── apps/
│       ├── users/
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── services.py
│       │   ├── permissions.py
│       │   ├── views.py
│       │   ├── urls.py
│       │   └── tests.py
│       ├── quizzes/
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── views.py
│       │   ├── consumers.py
│       │   ├── routing.py
│       │   ├── ai.py
│       │   ├── urls.py
│       │   ├── pagination.py
│       │   └── tests.py
│       └── students/
│           ├── models.py
│           ├── serializers.py
│           ├── views.py
│           ├── tasks.py
│           ├── urls.py
│           ├── pagination.py
│           ├── services/
│           │   └── code_runner.py
│           └── tests.py
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── api/
        ├── components/
        ├── context/
        └── pages/
~~~

## Critical files

| Path | Responsibility |
|---|---|
| backend/backend/settings.py | Framework and infrastructure configuration |
| backend/backend/asgi.py | HTTP/WebSocket protocol routing |
| backend/backend/celery.py | Celery bootstrap |
| backend/apps/users/models.py | Custom User |
| backend/apps/users/views.py | Auth/OTP/password reset |
| backend/apps/users/permissions.py | RBAC |
| backend/apps/quizzes/models.py | Question and quiz data model |
| backend/apps/quizzes/serializers.py | Validation/serialization |
| backend/apps/quizzes/views.py | Teacher APIs |
| backend/apps/quizzes/consumers.py | Live proctoring backend |
| backend/apps/students/models.py | ExamAttempt and Answer |
| backend/apps/students/views.py | Student exam APIs |
| backend/apps/students/tasks.py | Code evaluation tasks |
| backend/apps/students/services/code_runner.py | Judge0/Piston |
| frontend/src/pages/shared/QuizAttempt.jsx | Student exam runtime |
| frontend/src/pages/teacher/LiveProctor.jsx | Teacher live monitoring |
| frontend/src/api/api.js | Axios/JWT refresh |
| frontend/src/context/AuthContext.jsx | Auth state |

---

# 4. TECHNOLOGY MASTER GUIDE

## Python

The backend implementation language.

Used for settings, models, serializers, views, services, WebSocket consumers and Celery tasks.

## Django

Core server framework.

Provides:

- ORM
- URL routing
- middleware
- admin
- model layer
- request handling
- authentication integration

## DRF

Provides:

- APIView
- ModelViewSet
- serializers
- permissions
- throttling
- response/status handling
- routers

## React

Frontend UI.

The package currently pins React 19.x.

## React Router

App.jsx uses BrowserRouter, Routes and Route. RoleBasedRoute controls route access.

## React Query

Initialized in main.jsx with:

~~~text
staleTime = 5 minutes
refetchOnWindowFocus = false
~~~

Used selectively in teacher screens such as AddQuestions.jsx and EditQuiz.jsx.

## Tailwind CSS

Main styling method. The Vite config loads the Tailwind Vite plugin, while components use utility classes extensively.

## Framer Motion

Used for UI animation in screens such as QuizAttempt.jsx.

## Monaco Editor

Used for coding-question editing and review in QuizAttempt.jsx and Review.jsx.

## Recharts

Declared as a dependency. Inspect the particular chart component before claiming broad usage.

## JWT

Simple JWT provides access and refresh tokens.

Current configuration:

~~~text
Access: 15 minutes
Refresh: 7 days
Rotate refresh: enabled
Blacklist after rotation: enabled
~~~

## PostgreSQL

Configured through DATABASE_URL and dj-database-url with psycopg2-binary.

SQLite is used as a local fallback when DATABASE_URL is absent.

## Redis

Configured for:

1. Channels channel layer
2. Django cache
3. Celery broker/result backend

## Channels

Provides the WebSocket consumer and channel-layer model.

## WebSocket

Used for live proctoring and teacher/student real-time events.

## Celery

Provides background execution of code evaluation when async mode is requested.

## Judge0

External code execution engine.

## Piston

Fallback external code execution engine.

## Gemini/LangChain/Pydantic

backend/apps/quizzes/ai.py uses a LangChain Google Gemini model and Pydantic structured schemas for AI-generated questions.

## Docker

backend/Dockerfile packages the backend and starts Gunicorn WSGI.

---

# 5. WEB SOCKETS — FROM ZERO

## What is WebSocket?

HTTP is normally request/response.

~~~text
Client -> request -> server
Client <- response <- server
~~~

A WebSocket starts with a handshake and then keeps a connection open:

~~~text
Client <-> persistent connection <-> server
~~~

Both sides can send messages.

## Why Quiesy needs WebSocket

Live monitoring has event-driven behavior.

The student may send:

- STUDENT_JOINED
- TAB_SWITCH
- STUDENT_HEARTBEAT
- EXAM_SUBMITTED

The teacher may send:

- TEACHER_UNBLOCK
- TEACHER_BROADCAST

A polling architecture would require repeated HTTP requests just to discover whether anything changed.

## Actual student flow

~~~text
visibilitychange / blur
    |
handleFocusLoss()
    |
WebSocket.send(TAB_SWITCH)
    |
QuizProctorConsumer.receive()
    |
handle_tab_switch()
    |
record_tab_switch()
    |
group_send(TAB_SWITCH_LOGGED)
    |
teacher + student sockets
~~~

---

# 6. DJANGO CHANNELS — DEEP DIVE

## ASGI

backend/backend/asgi.py creates a ProtocolTypeRouter.

~~~python
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            apps.quizzes.routing.websocket_urlpatterns
        )
    ),
})
~~~

The protocol decides whether traffic is normal HTTP or WebSocket.

## Routing

backend/apps/quizzes/routing.py maps:

~~~text
ws/quiz-proctor/<quiz_id>/
    ->
QuizProctorConsumer.as_asgi()
~~~

## Consumer lifecycle

### connect()

- reads quiz_id
- constructs room name quiz_proctor_<quiz_id>
- joins group
- accepts connection

### receive()

Parses JSON and dispatches based on action.

Recognized actions include:

- STUDENT_JOINED
- TAB_SWITCH
- TEACHER_UNBLOCK
- STUDENT_HEARTBEAT
- EXAM_SUBMITTED
- TEACHER_BROADCAST

### disconnect()

Removes the connection from the room group.

### proctor_event()

Sends a group event to the browser as JSON.

## database_sync_to_async

ORM operations such as attempt queries are synchronous functions, while the consumer is async.

database_sync_to_async is used to bridge those operations without directly blocking the async consumer.

## Interview answer

> “A Channels consumer is the controller for a WebSocket connection. Quiesy’s QuizProctorConsumer handles connection lifecycle, interprets client actions, updates attempt state where needed and broadcasts events to the quiz room.”

---

# 7. REDIS — DEEP DIVE

## Channel layer

settings.py chooses RedisChannelLayer when REDIS_URL exists.

Without REDIS_URL, the code uses InMemoryChannelLayer.

## Why a shared channel layer?

Imagine two server processes.

~~~text
Student socket -> process A
Teacher socket -> process B
~~~

Python memory is process-local.

A shared Channels backend gives the consumers a common messaging mechanism.

## Cache

QuizInstructionView creates:

~~~text
quiz_instructions_<UPPERCASE_CODE>
~~~

and caches the response for 300 seconds.

The cache contains quiz metadata and serialized question data returned by that endpoint.

## Celery

settings.py configures Redis as broker and result backend.

Therefore Redis has three distinct purposes in the repository:

~~~text
Redis
├── Channels message layer
├── Django cache
└── Celery broker/result backend
~~~

No Redis failover mechanism is implemented in the repository.

---

# 8. CELERY — DEEP DIVE

## Terms

Task = registered function.

Worker = process that executes tasks.

Broker = queue transport.

Result backend = task-result/state storage.

Retry = rerun task after failure.

## Actual task

backend/apps/students/tasks.py:

~~~python
@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def evaluate_code_submission(self, attempt_id, question_id, code, language):
    ...
~~~

It:

1. finds attempt
2. finds question
3. loads test cases
4. calls run_code_batch()
5. calculates score
6. updates Answer
7. recomputes total attempt score
8. commits the writes in transaction.atomic()
9. returns a result

Errors use self.retry.

## Actual async behavior

SubmitCodeView checks async_mode.

When true:

~~~text
evaluate_code_submission.delay(...)
    ->
task id
    ->
HTTP 202
~~~

When false:

~~~text
evaluate_code_submission(...)
    ->
code runs inside the web request
~~~

This distinction is important in an interview.

## Expiration task

auto_submit_expired_attempts scans IN_PROGRESS attempts with expires_at <= now and marks them EXPIRED with submitted_at.

It does not run the same grading logic as SubmitExamView.

---

# 9. JUDGE0 / CODE EXECUTION

## Why remote execution?

Student code is untrusted.

Running arbitrary source inside the main Django application process is a dangerous design.

Quiesy delegates execution to external services.

## Single execution

run_code_single():

- maps language to Judge0 language_id
- POSTs source code and stdin
- waits through the Judge0 wait endpoint
- parses stdout/stderr/compile output/status
- falls back to Piston on failure

## Batch execution

run_code_batch():

- builds one submission per test case
- POSTs them to Judge0 batch endpoint
- receives tokens
- polls for completion
- compares output
- returns one result object per test case

## Output normalization

_normalize_output():

- converts line endings to LF
- strips trailing spaces from lines
- strips outer whitespace

## Coding score

~~~text
passed test cases
----------------- × question marks
total test cases
~~~

The result is rounded to two decimal places.

---

# 10. DATABASE DESIGN — ALL IMPORTANT MODELS

## User

Custom user model based on AbstractBaseUser and PermissionsMixin.

Fields:

- email
- name
- role
- is_active
- is_staff
- is_verified
- verification_otp
- otp_created_at

Email is USERNAME_FIELD.

Roles:

- STUDENT
- TEACHER
- ADMIN

## Question

Reusable teacher-owned question.

Main fields:

- teacher
- title
- text
- question_type
- difficulty
- topic
- marks
- starter_code
- is_active
- timestamps

## Option

Belongs to Question.

Fields:

- text
- is_correct
- order

## TestCase

Belongs to Question.

Fields:

- input_data
- expected_output
- is_sample
- order

## QuestionVersion

Belongs to Question.

Fields:

- version
- text
- question_type
- marks
- starter_code
- snapshot
- created_at

Unique constraint:

question + version

## Quiz

Belongs to teacher.

Fields include:

- title
- subject
- description
- quiz_code
- status
- duration_minutes
- starts_at
- ends_at
- max_attempts
- password
- review_enabled
- shuffle_questions
- shuffle_options

## QuizQuestion

Connects quiz and question.

Also stores:

- order
- marks_override

Unique constraint:

quiz + question

## ExamAttempt

The student's exam session.

Fields:

- UUID id
- student
- quiz
- attempt_number
- status
- started_at
- expires_at
- submitted_at
- score
- max_score
- submit_idempotency_key
- tab_switch_count
- is_blocked
- blocked_at
- paused_seconds_remaining
- last_activity

Unique constraint:

student + quiz + attempt_number

## Answer

Stores a student's response.

Fields:

- UUID id
- attempt
- question
- answer_data
- status
- sequence
- idempotency_key
- execution_result
- evaluated_score

Unique constraints:

- attempt + question
- attempt + idempotency_key

---

# 11. IDEMPOTENCY

Idempotency protects against repeated requests producing unintended duplicate effects.

Possible duplicate causes:

- double click
- network retry
- client retry logic
- reconnection behavior

## Answer

The database has a unique attempt + idempotency_key constraint.

The view also explicitly searches for an existing matching key.

## Submit

ExamAttempt stores submit_idempotency_key.

SubmitExamView also returns the existing attempt immediately when status is already SUBMITTED.

The accurate interview statement is:

> “I persist submit idempotency information and protect repeated finalization with transaction/locking and submitted-state handling. The incoming key is not itself the only duplicate-detection mechanism.”

---

# 12. SEQUENCE-BASED AUTO-SAVE

## Problem

Autosave requests can arrive out of order.

~~~text
Request 1 -> sequence 1 -> A
Request 2 -> sequence 2 -> AB
Request 3 -> sequence 3 -> ABC
~~~

The network could deliver:

~~~text
3
2
1
~~~

If the backend blindly overwrites, final content could become A.

## Backend

The view checks:

~~~python
if sequence <= existing.sequence:
    return AnswerSerializer(existing).data
~~~

So an older sequence does not replace a newer sequence.

## Frontend

QuizAttempt.jsx uses:

~~~text
sequenceCounters = useRef({})
~~~

to maintain per-question counters without causing renders.

## Important resume limitation

The frontend counter is not visibly initialized from stored Answer.sequence values after resume.

That is a real edge case to improve.

---

# 13. TRANSACTIONS / ATOMICITY

## StartExamView

Uses transaction.atomic and select_for_update.

This covers concurrent start logic around a quiz and existing active attempt.

## AnswerListCreateView

Uses transaction.atomic and select_for_update on the attempt.

## SubmitExamView

Uses transaction.atomic and select_for_update.

It updates evaluated Answer records and then the attempt score/status before commit.

## Question create/update

Question creation and version creation are grouped in transaction.atomic.

## sync_questions

Delete-all/recreate mappings are grouped in a transaction.

## Interview answer

> “I use transactions when multiple writes form one logical unit. The point is consistency: if one required write fails, the related writes should not be left half-completed.”

---

# 14. DATABASE INDEXING

## Quiz

Indexes include:

- teacher + status
- status + starts_at + ends_at
- quiz_code

## QuizQuestion

- quiz + order
- quiz + question

## ExamAttempt

- student + quiz + status
- quiz + status
- student + status
- expires_at

## Answer

- attempt + status
- attempt + sequence
- question

## Tradeoff

Indexes improve relevant lookups but add storage and write-maintenance cost.

No measured benchmark should be claimed from the repository.

---

# 15. UUIDS

UUID primary keys are used for ExamAttempt and Answer.

## Why

Sequential numeric identifiers can be easy to enumerate.

UUIDs make identifiers harder to guess.

## Important security lesson

UUIDs are not authorization.

The backend must still verify ownership.

Quiesy does this in several student attempt endpoints by filtering on the authenticated user.

---

# 16. QUESTION VERSIONING

QuestionViewSet calls _create_version after creating a question.

On update:

~~~text
old snapshot
    |
update current question
    |
replace nested options/test cases
    |
new snapshot
    |
compare
    |
create new version if changed
~~~

The snapshot includes:

- title
- text
- question_type
- difficulty
- topic
- marks
- starter_code
- options
- test_cases

## Why

Teachers can modify a reusable question while retaining a historical snapshot.

## Important limitation

ExamAttempt does not store a direct version reference.

Therefore version history is implemented, but immutable per-attempt question snapshots are not fully modeled.

---

# 17. JWT AUTHENTICATION

## Registration

RegisterSerializer validates password length and role, creates or updates an unverified user and sends an OTP.

## OTP

generate_otp uses secrets.randbelow to create a six-digit value.

save_otp stores a SHA-256 hash and timestamp.

VerifyEmailView rejects OTPs older than 600 seconds.

## Login

LoginView checks:

- user exists
- is_verified

Then TokenObtainPairView issues tokens.

## Frontend

api.js stores access and refresh tokens in localStorage.

Request interceptor adds the Bearer access token.

Response interceptor handles a 401 by trying the refresh token.

If refresh succeeds, the original request is retried.

## Logout

Backend blacklists the refresh token.

Frontend clears stored tokens even if backend logout fails.

---

# 18. ROLE-BASED AUTHORIZATION

Backend roles:

- STUDENT
- TEACHER
- ADMIN

Backend permission classes:

- IsStudent
- IsTeacher
- IsAdmin
- IsQuizOwner

Teacher viewsets also restrict querysets to quizzes/questions owned by request.user.

## Interview lesson

Frontend route restrictions are not security by themselves.

Backend checks are the important boundary.

---

# 19. QUIZ LIFECYCLE

Current status choices:

~~~text
DRAFT
SCHEDULED
ACTIVE
CLOSED
EVALUATED
~~~

## DRAFT -> SCHEDULED

QuizViewSet.schedule():

- requires starts_at
- requires ends_at
- requires ends_at > starts_at through serializer validation
- sets status SCHEDULED

## DRAFT/SCHEDULED -> ACTIVE

QuizViewSet.start():

- requires status DRAFT or SCHEDULED
- requires at least one question
- sets ACTIVE

## What is not proven

No complete automatic state machine was found for:

- scheduled automatic activation
- automatic closing
- automatic evaluation status

---

# 20. SIX-CHARACTER QUIZ CODE

Quiz.generate_quiz_code():

~~~text
alphabet = uppercase letters + digits
choose six characters with secrets.choice
check database uniqueness
repeat if needed
return code
~~~

Database field:

~~~text
max_length = 6
unique = true
editable = false
~~~

The short code is a human-friendly join identifier.

It is not an authentication mechanism.

---

# 21. EXAM ATTEMPT SYSTEM

## StartExamView flow

~~~text
POST start exam
    |
lock quiz row
    |
check ACTIVE
    |
check start/end window
    |
find existing IN_PROGRESS attempt
    |
+------------------------------+
| valid existing attempt       |
|      -> return it            |
+------------------------------+
    |
count attempts
    |
enforce max_attempts
    |
find highest attempt_number
    |
next attempt number
    |
expires_at = now + duration
    |
cap by quiz.ends_at if earlier
    |
calculate max_score
    |
create ExamAttempt
~~~

## Resume

A page refresh can return the existing active attempt instead of creating another.

## Expiration

API endpoints check expires_at.

The separate expiration task also marks expired active attempts.

---

# 22. LIVE PROCTORING

## Browser

QuizAttempt.jsx listens to:

- visibilitychange
- blur
- focus

## Important refs

- isAwayRef
- lastTabSwitchTimeRef
- tabSwitchesRef
- isBlockedRef
- timeLeftRef
- wsRef
- answersRef

## Tab switch

~~~text
browser event
   |
validate actual focus loss
   |
duplicate/cooldown checks
   |
increment local ref
   |
send TAB_SWITCH immediately
   |
teacher receives backend broadcast
~~~

Server:

~~~text
receive TAB_SWITCH
   |
record_tab_switch
   |
increment persistent count
   |
if count >= 3:
    is_blocked = true
    blocked_at = now
    preserve paused seconds
   |
group_send TAB_SWITCH_LOGGED
~~~

## Three-switch rule

The backend is authoritative for persistent count/block state.

The frontend also immediately updates UI state to give instant feedback.

---

# 23. REACT REFS VS STATE

## State

State causes re-render.

Used for:

- timeLeft
- tabSwitches
- isBlocked
- answers
- UI modals

## Refs

Refs persist mutable values without causing a render.

Used for:

- WebSocket object
- current timer
- current block state
- current switch count
- current answer map
- duplicate-event coordination

## Why

Browser event listeners can otherwise capture stale state through closures.

The ref provides a current mutable value through ref.current.

## Interview answer

> “I use state when the UI needs to re-render, and refs for runtime values that event handlers, timers or sockets must read immediately without waiting for another React render.”

---

# 24. WEBSOCKET RECONNECTION

Both QuizAttempt.jsx and LiveProctor.jsx implement reconnect logic.

The pattern:

~~~text
socket closes
    |
intentional?
    |
yes -> stop
no  -> wait 2.5 seconds
    |
connect again
~~~

The student uses hasSentJoinedRef.

First connection sends STUDENT_JOINED.

Reconnect sends STUDENT_HEARTBEAT instead of another join event.

Teacher uses announcedJoinsRef to avoid duplicate telemetry alerts.

---

# 25. HEARTBEAT

Student heartbeat interval: 10 seconds.

Payload:

~~~text
attempt_id
seconds_left
answered_count
~~~

The consumer broadcasts the event.

Teacher updates candidate telemetry.

## Limitation

The server does not show a missed-heartbeat timeout state machine.

---

# 26. MONACO EDITOR

Monaco is used for coding questions.

Run flow:

~~~text
Editor
    |
answers state
    |
runCode()
    |
RunCodeView
    |
Judge0/Piston
    |
output
~~~

Submit flow:

~~~text
Editor
    |
answers state
    |
submitCode()
    |
SubmitCodeView
    |
sync or async evaluation
    |
score/result
~~~

---

# 27. REACT QUERY

main.jsx creates QueryClient.

Defaults:

~~~text
staleTime = 5 minutes
refetchOnWindowFocus = false
~~~

Verified usage includes AddQuestions.jsx and EditQuiz.jsx.

It is not the only state management mechanism in the application.

Exam runtime state remains primarily in React state and refs.

---

# 28. FRAMER MOTION

Used mainly for UX:

- question transitions
- option selection
- ripple/spring feedback
- animated layout behavior

It is not part of the backend architecture.

---

# 29. TAILWIND CSS

The project uses Tailwind utility classes for:

- layout
- spacing
- typography
- responsive behavior
- dark mode
- interaction states

Vite config enables the Tailwind plugin.

---

# 30. REACT COMPONENT ARCHITECTURE

## Entry

App.jsx contains routes.

## Authentication state

AuthContext.jsx contains:

- user
- loading
- loadUser
- logout
- isAuthenticated

## Teacher pages

- TeacherDashboard
- CreateQuiz
- EditQuiz
- AddQuestions
- CreateQuestion
- QuestionBank
- LiveProctor

## Student pages

- StudentDashboard
- ExamInstructions

## Shared exam pages

- QuizAttempt
- Review
- QuizResult
- StartQuiz

## Route authorization

RoleBasedRoute checks the user role before rendering protected pages.

---

# 31. DJANGO REST FRAMEWORK

## QuestionSerializer

Validates question type-specific structure.

MCQ:

- options required
- exactly one correct

MSQ:

- options required
- at least one correct

SUBJECTIVE:

- no options
- no test cases

CODING:

- no options
- test cases required

## QuizSerializer

Validates schedule ordering and hashes quiz passwords.

## AnswerSerializer

Checks that the question belongs to the attempt's quiz.

## AttemptSerializer

Combines:

- attempt
- answers
- quiz questions
- quiz metadata

It only reveals correct options when allowed by teacher/completed-review rules.

---

# 32. API MASTER TABLE

| Endpoint | Method | Main responsibility |
|---|---|---|
| auth/register/ | POST | Register |
| auth/login/ | POST | Login |
| auth/token/refresh/ | POST | Refresh JWT |
| auth/logout/ | POST | Blacklist refresh |
| auth/me/ | GET | Current user |
| auth/verify-email/ | POST | Verify OTP |
| auth/resend-otp/ | POST | New OTP |
| auth/forgot-password/ | POST | Password reset email |
| auth/reset-password/ | POST | Password reset |
| quizzes/questions/ | GET/POST | Question bank |
| quizzes/questions/{id}/ | GET/PATCH/DELETE | Question CRUD |
| quizzes/questions/generate_ai/ | POST | AI generation |
| quizzes/question-versions/ | GET | History |
| quizzes/quizzes/ | GET/POST | Quiz CRUD |
| quizzes/quizzes/{id}/ | GET/PATCH/DELETE | Quiz detail |
| quizzes/quizzes/{id}/schedule/ | POST | Schedule |
| quizzes/quizzes/{id}/start/ | POST | Activate |
| quizzes/quizzes/{id}/results/ | GET | Results |
| quizzes/quizzes/{id}/live-proctor/ | GET | Live roster |
| quizzes/quizzes/{id}/sync-questions/ | PUT | Bulk question sync |
| quizzes/quiz-questions/ | GET/POST/... | Quiz-question mapping |
| student/quizzes/ | GET | Quiz discovery |
| student/join-quiz/ | POST | Join |
| student/quizzes/{code}/instructions/ | GET | Instructions |
| student/quizzes/{id}/start/ | POST | Start/resume attempt |
| student/attempts/{id}/ | GET | Attempt detail |
| student/attempts/{id}/answers/ | GET/POST | Answer save |
| student/attempts/{id}/submit/ | POST | Final grading |
| student/my-attempts/ | GET | History |
| student/run-code/ | POST | Code execution |
| student/submit-code/ | POST | Code evaluation |
| student/code-tasks/{task_id}/ | GET | Celery status |

WebSocket:

~~~text
/ws/quiz-proctor/<quiz_id>/
~~~

---

# 33. ERROR HANDLING

The API commonly returns:

- 400
- 401
- 403
- 404
- 202
- 200
- 201
- 205

Serializer validation uses DRF ValidationError.

Judge0 failures fall back to Piston.

Celery catches task exceptions and retries.

WebSocket handlers catch errors and log them.

The project does not use one globally standardized API error format.

---

# 34. SECURITY AUDIT

## Strong controls

- Django password hashing for user passwords
- quiz password hashing on normal serializer writes
- JWT authentication
- backend role checks
- ownership filtering in many ViewSets
- DRF throttling
- remote code execution

## Weaknesses

### Permissive hosts

ALLOWED_HOSTS = ['*']

### Permissive CORS

CORS_ALLOW_ALL_ORIGINS = True

### Secret management

A SECRET_KEY is currently hard-coded in settings.py.

### WebSocket authorization

The consumer accepts a socket without explicit authenticated-user/role/ownership validation.

### Code endpoint ownership

RunCodeView does not require an attempt and does not verify question membership.

SubmitCodeView verifies the student owns the attempt but does not verify question membership in the quiz.

### Task status ownership

CodeTaskStatusView accepts a task_id without proving it belongs to the requesting student.

### sync_questions

The bulk endpoint bypasses the normal Question ownership validation on QuizQuestionSerializer.

---

# 35. DEPLOYMENT / DOCKER

Current Dockerfile:

~~~text
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN python manage.py collectstatic --noinput
CMD sh -c "python manage.py migrate && gunicorn backend.wsgi:application ..."
~~~

It proves:

- Python image
- dependencies
- static collection
- migration at startup
- Gunicorn WSGI

It does not prove:

- a particular cloud topology
- Redis high availability
- Celery worker process
- Celery Beat process
- ASGI WebSocket deployment

---

# 36. ENVIRONMENT VARIABLES

Important references include:

| Variable | Role |
|---|---|
| DEBUG | Debug mode |
| REDIS_URL | Redis infrastructure |
| DATABASE_URL | external database |
| EMAIL_HOST_USER | SMTP identity |
| EMAIL_HOST_PASSWORD | SMTP credential |
| FRONTEND_URL | reset-link base |
| JUDGE0_API_URL | Judge0 endpoint |
| JUDGE0_API_KEY | Judge0 credential |
| JUDGE0_API_HOST | Judge0 host |
| PISTON_API_URL | Piston endpoint |
| GEMINI_API_KEY | AI credential |
| VITE_API_URL | frontend backend base |

Secret values should never be written into this guide.

---

# 37. TESTING

## users/tests.py

Active tests include:

- verification success
- wrong OTP
- expired OTP
- resend OTP
- student login
- teacher login
- admin login
- RBAC

## students/tests.py

Active tests include:

- student access
- start exam
- resume
- max attempts
- attempt retrieval
- save answer
- update answer
- stale sequence
- answer idempotency
- answer retrieval
- MCQ grading
- duplicate submit
- expired save rejection
- teacher start rejection
- cross-attempt access rejection

## quizzes/tests.py

The repository contains extensive quiz tests in the file, but the inspected test classes are commented out.

Do not claim active execution or coverage for those commented tests without running them.

---

# 38. BUGS AND EDGE CASES

## Undefined SAVED status

AnswerListCreateView uses Answer.Status.SAVED.

Answer.Status contains no SAVED.

This is a direct bug.

## WSGI/ASGI mismatch

Docker starts WSGI while WebSocket architecture is defined through ASGI.

## WebSocket security gap

Role and ownership are not enforced inside the consumer.

## Code question authorization gap

Question IDs are not verified against the attempt's quiz in code endpoints.

## Task ownership gap

Task status is looked up globally by task ID.

## Sequence resume gap

Frontend sequence counters do not appear to restore from stored server sequence values.

## Incomplete scheduler

Scheduled/closed/evaluated statuses are present, but automatic transitions are not fully implemented.

## Expiration task is not grading

auto_submit_expired_attempts marks expired but does not execute the final grading path.

## Shuffle flags

The data model and UI expose them, but actual backend randomization was not verified.

---

# 39. FEATURE IMPLEMENTATION MATRIX

| Feature | Frontend | Backend | DB | Redis | Celery | WS | External |
|---|---|---|---|---|---|---|---|
| Registration | Register.jsx | users/views.py | User | No | No | No | SMTP |
| Verification | VerifyEmail.jsx | users/views.py/services.py | User | No | No | No | SMTP |
| Login | Login.jsx | LoginView | User | No | No | No | No |
| Quiz creation | CreateQuiz.jsx | QuizViewSet | Quiz | No | No | No | No |
| Question bank | QuestionBank/CreateQuestion | QuestionViewSet | Question/Option/TestCase | No | No | No | No |
| AI generation | AI UI | generate_ai + ai.py | Question/version | No | No | No | Gemini |
| Schedule | EditQuiz.jsx | schedule | Quiz | No | No | No | No |
| Discovery | StudentDashboard.jsx | QuizDiscoveryView | Quiz | No | No | No | No |
| Instructions | ExamInstructions.jsx | QuizInstructionView | Quiz/questions | Cache | No | No | No |
| Start attempt | ExamInstructions.jsx | StartExamView | ExamAttempt | No | No | No | No |
| Autosave | QuizAttempt.jsx | AnswerListCreateView | Answer | No | No | No | No |
| MCQ/MSQ grading | QuizAttempt.jsx | SubmitExamView | Answer/Attempt | No | No | No | No |
| Code run | QuizAttempt/Monaco | RunCodeView | No required write | No | No | No | Judge0/Piston |
| Code submit | QuizAttempt | SubmitCodeView/tasks.py | Answer/Attempt | Broker if async | Yes optional | No | Judge0/Piston |
| Results | QuizResult.jsx | results action | ExamAttempt | No | No | No | No |
| Proctor roster | LiveProctor.jsx | live_proctor action | ExamAttempt/Answer | No | No | No | No |
| Tab switch | QuizAttempt.jsx | consumer | ExamAttempt | Yes | No | Yes | No |
| Heartbeat | QuizAttempt.jsx | consumer | No | Yes | No | Yes | No |
| Unblock | LiveProctor.jsx | consumer | ExamAttempt | Yes | No | Yes | No |
| Broadcast | LiveProctor.jsx | consumer | No | Yes | No | Yes | No |

---

# 40. COMPLETE CODE WALKTHROUGH

## backend/backend/asgi.py

~~~python
django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            apps.quizzes.routing.websocket_urlpatterns
        )
    ),
})
~~~

Meaning:

- get_asgi_application provides Django HTTP handling
- ProtocolTypeRouter chooses protocol
- AuthMiddlewareStack wraps WebSockets with auth middleware
- URLRouter maps the WebSocket path to the consumer

## backend/apps/quizzes/consumers.py

Key event pattern:

~~~python
result = await self.record_tab_switch(
    attempt_id,
    seconds_left,
)

if result:
    await self.channel_layer.group_send(
        self.room_group_name,
        {
            "type": "proctor_event",
            "event": "TAB_SWITCH_LOGGED",
            "data": result,
        },
    )
~~~

The state is updated first, then the resulting state is broadcast.

## backend/apps/students/tasks.py

Critical persistence:

~~~python
with transaction.atomic():
    answer, _ = Answer.objects.get_or_create(
        attempt=attempt,
        question=question,
    )

    answer.answer_data = {
        "code": code,
        "language": language,
    }
    answer.evaluated_score = earned_marks
    answer.execution_result = {
        "passed_count": passed_cases,
        "total_count": total_cases,
        "all_passed": all_passed,
        "results": batch_results,
    }
    answer.status = Answer.Status.EVALUATED
    answer.save()

    evaluated_sum = (
        Answer.objects.filter(attempt=attempt)
        .aggregate(models.Sum("evaluated_score"))
        ["evaluated_score__sum"]
        or 0
    )

    attempt.score = evaluated_sum
    attempt.save(
        update_fields=[
            "score",
            "last_activity",
            "updated_at",
        ],
    )
~~~

Why transaction:

Answer evaluation and attempt score are one logical operation.

## frontend/src/api/api.js

Request interceptor:

~~~javascript
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("access")

    if (token) {
        config.headers.Authorization = "Bearer " + token
    }

    return config
})
~~~

Response interceptor:

~~~text
401
 |
exclude login/refresh
 |
retry guard
 |
read refresh token
 |
POST refresh endpoint
 |
store new access/refresh
 |
retry original request
~~~

## frontend/src/pages/shared/QuizAttempt.jsx

Important runtime state:

- answers
- timeLeft
- tabSwitches
- isBlocked
- codeOutputs
- codeSubmissions

Important refs:

- wsRef
- reconnectTimeoutRef
- hasSentJoinedRef
- isAwayRef
- lastTabSwitchTimeRef
- tabSwitchesRef
- isBlockedRef
- timeLeftRef
- answersRef
- sequenceCounters
- autoSaveDebounce

This component is the main student exam runtime.

---

# 41. WHERE EXACTLY IS THIS USED?

## ASGI

backend/backend/asgi.py

## Channels

backend/backend/asgi.py
backend/apps/quizzes/routing.py
backend/apps/quizzes/consumers.py

## Redis

backend/backend/settings.py
backend/apps/quizzes/consumers.py through channel_layer
backend/apps/students/views.py through Django cache
backend/backend/settings.py through Celery

## Celery

backend/backend/celery.py
backend/apps/students/tasks.py
backend/apps/students/views.py

## Judge0

backend/apps/students/services/code_runner.py
backend/apps/students/views.py
backend/apps/students/tasks.py

## JWT

backend/apps/users/views.py
backend/apps/users/urls.py
backend/backend/settings.py
frontend/src/api/api.js
frontend/src/context/AuthContext.jsx

## Monaco

frontend/src/pages/shared/QuizAttempt.jsx
frontend/src/pages/shared/Review.jsx

## React Query

frontend/src/main.jsx
frontend/src/pages/teacher/AddQuestions.jsx
frontend/src/pages/teacher/EditQuiz.jsx

## Framer Motion

frontend/src/pages/shared/QuizAttempt.jsx

## Gemini/LangChain/Pydantic

backend/apps/quizzes/ai.py
backend/apps/quizzes/views.py

## Docker

backend/Dockerfile

---

# 42. INTERVIEW QUESTIONS — BASIC

### What is Quiesy?

> “A full-stack examination platform with teacher-managed quizzes, student timed attempts, coding evaluation and live WebSocket monitoring.”

### Why Django?

> “It gives me ORM, routing, middleware, admin and a mature server-side framework.”

### Why React?

> “The exam UI is stateful and interactive, so component-based rendering and local state are useful.”

### Why WebSockets?

> “The proctoring system needs event-driven two-way communication.”

### What does Redis do?

> “Channels uses it as the channel layer, Django uses it for cache, and Celery uses it as broker/result backend.”

### What does Celery do?

> “It provides queued background execution for code submissions when async mode is used.”

---

# 43. INTERVIEW QUESTIONS — INTERMEDIATE

### Why use select_for_update?

> “To lock rows inside a transaction where concurrent requests could otherwise make conflicting state decisions. Quiesy uses it in start, answer-save and submit flows.”

### Why use transaction.atomic?

> “To keep related writes together. For example, code evaluation persists answer evaluation and updates the attempt score.”

### Why useRef instead of useState?

> “State drives the UI, while refs provide current mutable values for timers, sockets and browser event handlers without depending on another render.”

### Why sequence numbers?

> “They stop an older autosave request from overwriting newer data when requests arrive out of order.”

### Why UUID?

> “To avoid predictable sequential identifiers for sensitive attempt/answer resources. Authorization is still required separately.”

---

# 44. INTERVIEWER CROSS-EXAMINATION

## Redis

Interviewer: “Why Redis instead of PostgreSQL for WebSocket messaging?”

Answer:

> “The Channels layer needs a messaging backend optimized for short-lived inter-process communication. Redis is already integrated with Channels and can also support the cache and Celery queue infrastructure.”

## WebSocket

Interviewer: “What happens after TAB_SWITCH?”

Answer:

~~~text
Browser event
→ handleFocusLoss
→ WebSocket TAB_SWITCH
→ consumer.receive
→ handle_tab_switch
→ record_tab_switch
→ ExamAttempt update
→ group_send
→ teacher/student clients
~~~

## Celery

Interviewer: “Is every code submission asynchronous?”

Answer:

> “No. async=true queues the task with delay(). The default path directly executes the shared task function.”

## Security

Interviewer: “How is your WebSocket authorized?”

Answer:

> “The route is wrapped by AuthMiddlewareStack, but the current consumer does not perform explicit role and ownership checks. That is a security gap I would fix.”

## Deployment

Interviewer: “Does your Dockerfile support the WebSocket server?”

Answer:

> “Not through its current command. The WebSocket route is configured in ASGI, but the Dockerfile currently starts WSGI Gunicorn.”

---

# 45. EXPLAIN THIS PROJECT WITHOUT BUZZWORDS

A teacher creates a question.

The teacher adds it to a quiz.

The quiz gets a six-character code.

The student discovers or joins the quiz.

When the student starts it, Django creates an ExamAttempt and calculates an expiration time.

The browser shows the questions and starts its countdown.

Answers are sent back to Django and stored.

The student can execute coding solutions through a remote code runner.

When the student submits, Django grades saved answers and stores the score.

At the same time, a WebSocket can carry live exam events.

If the browser detects the student leaving the exam window, it sends a tab-switch event.

The server records the switch and broadcasts the new state to connected clients.

After three recorded switches, the attempt becomes blocked and the remaining time is preserved.

The teacher can then see the candidate and send an unblock command.

That is the core of Quiesy.

---

# 46. TEACH ME LIKE A BEGINNER

For any difficult system in this project, learn it in this order:

1. Simple analogy
2. Technical definition
3. Why Quiesy needs it
4. Exact file
5. Exact class/function
6. Actual code
7. Data flow
8. Failure case
9. Interview answer

For WebSocket:

Analogy: a phone call that stays open.

Technical: a persistent bidirectional protocol.

Quiesy need: live monitoring.

File: backend/apps/quizzes/consumers.py

Frontend: frontend/src/pages/shared/QuizAttempt.jsx

Flow: browser event -> socket -> consumer -> group -> clients.

Failure: disconnect/reconnect.

Interview: explain why polling is not necessary for every event.

---

# 47. SMALL BUT IMPORTANT CONCEPTS

## Decorators

transaction.atomic changes transaction behavior.

shared_task registers a Celery task.

## async/await

Used in React network handlers and Channels consumers.

## Promises

Axios requests return promises.

## Debounce

Subjective and coding input use delayed saves so every keystroke is not sent immediately.

## Cooldown

Tab-switch detection uses short time thresholds to avoid duplicate events.

## Serialization

Django model data is transformed into JSON-compatible API data.

## ORM

Django ORM turns model operations into database queries.

## Constraints

Unique fields and UniqueConstraint protect database consistency.

## Middleware

CORS, security, sessions, CSRF, authentication and other cross-cutting processing.

---

# 48. CODE LEARNING RULES

When learning any implementation:

~~~text
Exact file
   |
Exact symbol
   |
Who calls it?
   |
What input enters?
   |
What validation occurs?
   |
What data changes?
   |
What service is called?
   |
What output/event leaves?
~~~

Use repository names exactly.

Do not replace actual implementation with made-up pseudocode when source is available.

---

# 49. CODE SEARCH REFERENCES

## Backend

backend/backend/settings.py
backend/backend/asgi.py
backend/backend/celery.py
backend/apps/users/models.py
backend/apps/users/views.py
backend/apps/users/permissions.py
backend/apps/users/services.py
backend/apps/quizzes/models.py
backend/apps/quizzes/serializers.py
backend/apps/quizzes/views.py
backend/apps/quizzes/consumers.py
backend/apps/quizzes/routing.py
backend/apps/quizzes/ai.py
backend/apps/students/models.py
backend/apps/students/serializers.py
backend/apps/students/views.py
backend/apps/students/tasks.py
backend/apps/students/services/code_runner.py

## Frontend

frontend/src/main.jsx
frontend/src/App.jsx
frontend/src/api/api.js
frontend/src/api/quizzes.js
frontend/src/api/student.js
frontend/src/context/AuthContext.jsx
frontend/src/pages/shared/QuizAttempt.jsx
frontend/src/pages/shared/Review.jsx
frontend/src/pages/student/ExamInstructions.jsx
frontend/src/pages/teacher/AddQuestions.jsx
frontend/src/pages/teacher/EditQuiz.jsx
frontend/src/pages/teacher/LiveProctor.jsx

---

# 50. FINAL “I BUILT THIS PROJECT” REVISION

## 1 minute

~~~text
React/Vite
    |
Django/DRF
    |
JWT + RBAC
    |
PostgreSQL/SQLite
    |
Redis
    |
Channels/WebSocket
    |
Celery
    |
Judge0/Piston
~~~

## 5 minutes

Know:

- Question
- Option
- TestCase
- QuestionVersion
- Quiz
- QuizQuestion
- ExamAttempt
- Answer

And know why:

- UUID
- indexes
- sequence
- idempotency
- transactions
- refs
- WebSockets
- Redis
- Celery

## 15 minutes

Trace:

- registration
- OTP
- login
- start exam
- save answer
- run code
- submit code
- submit exam
- tab switch
- unblock

## 30 minutes

Be ready for:

- concurrency
- stale closures
- Redis failure
- Celery retry
- code execution safety
- WebSocket authorization
- deployment mismatch

---

# 51. IF AN INTERVIEWER OPENS MY GITHUB

## 20 files to expect

1. backend/backend/settings.py
2. backend/backend/asgi.py
3. backend/backend/celery.py
4. backend/apps/users/models.py
5. backend/apps/users/views.py
6. backend/apps/users/permissions.py
7. backend/apps/users/services.py
8. backend/apps/quizzes/models.py
9. backend/apps/quizzes/serializers.py
10. backend/apps/quizzes/views.py
11. backend/apps/quizzes/consumers.py
12. backend/apps/quizzes/routing.py
13. backend/apps/students/models.py
14. backend/apps/students/serializers.py
15. backend/apps/students/views.py
16. backend/apps/students/tasks.py
17. backend/apps/students/services/code_runner.py
18. frontend/src/api/api.js
19. frontend/src/pages/shared/QuizAttempt.jsx
20. frontend/src/pages/teacher/LiveProctor.jsx

## 30 concrete questions

1. What happens when Start Exam is clicked?
2. Why does StartExamView use select_for_update?
3. How is expires_at calculated?
4. How does an existing attempt get resumed?
5. How is max_attempts enforced?
6. What does Answer.sequence solve?
7. How is answer idempotency represented?
8. How is MCQ graded?
9. How is MSQ graded?
10. How is coding scored?
11. When does Celery actually run?
12. What does Redis do?
13. Why does Channels need a channel layer?
14. What does QuizProctorConsumer do?
15. What happens after TAB_SWITCH?
16. Why are tabSwitchesRef and isBlockedRef needed?
17. Why freeze remaining time?
18. How does teacher unblock work?
19. What happens when the WebSocket disconnects?
20. What does heartbeat contain?
21. How is duplicate join telemetry suppressed?
22. What security protection exists on REST endpoints?
23. What security gap exists in the WebSocket consumer?
24. What is the code-task ownership problem?
25. Why are question versions stored?
26. Are attempts bound to versions?
27. What indexes exist?
28. Does Docker launch ASGI?
29. Does scheduled quiz activation happen automatically?
30. What would you improve first?

---

# 52. COMPLETENESS AUDIT

Covered:

- architecture
- frontend
- backend
- database
- authentication
- authorization
- REST APIs
- WebSockets
- Channels
- Redis
- Celery
- code execution
- Judge0
- Piston
- proctoring
- timer
- reconnection
- heartbeat
- autosave
- idempotency
- transactions
- indexes
- UUIDs
- question versioning
- React state/ref
- Monaco
- React Query
- Tailwind
- Framer Motion
- Docker
- deployment limitations
- environment variables
- testing
- bugs
- security
- interview preparation

---

# 53. DO NOT MODIFY THE APPLICATION

This guide itself is documentation.

The requested repository modification is only:

~~~text
QUIESY_GUIDE.md
~~~

Do not change:

- backend source
- frontend source
- models
- settings
- package files
- Docker files
- API behavior

---

# 54. FINAL QUALITY STANDARD

Every important idea should be understood as:

~~~text
Concept
    |
Actual Quiesy implementation
    |
Exact file
    |
Exact symbol
    |
Flow
    |
Database/external effects
    |
Tradeoff
    |
Failure case
    |
Interview answer
~~~

Never substitute buzzwords for understanding.

---

# 55. FINAL REVISION CHECKLIST

Before an interview, you should be able to explain these without AI help:

### Authentication
~~~text
register
→ OTP
→ verify
→ login
→ access/refresh
→ protected API
→ refresh
→ logout
~~~

### Student exam
~~~text
instructions
→ start
→ ExamAttempt
→ timer
→ answer
→ autosave
→ submit
→ grading
→ result
~~~

### Coding
~~~text
Monaco
→ RunCodeView
→ Judge0/Piston
~~~

and:

~~~text
Monaco
→ SubmitCodeView
→ optional Celery
→ Judge0/Piston
→ Answer
→ score
~~~

### Proctoring
~~~text
visibility/blur
→ TAB_SWITCH
→ Consumer
→ ExamAttempt
→ group_send
→ teacher/student UI
~~~

### Unblock
~~~text
Teacher
→ TEACHER_UNBLOCK
→ unblock_student_db
→ restore expiry
→ STUDENT_UNBLOCKED
→ student timer resumes
~~~

## Final honest project statement

> “I built Quiesy as a full-stack online examination system using React, Django REST Framework and a database-backed exam model. The project includes question management, timed attempts, coding evaluation through remote execution, JWT authentication and real-time proctoring with Django Channels and WebSockets. Redis is used for the channel layer, cache and Celery infrastructure. I can also explain the current limitations honestly, especially the WebSocket authorization gap, code-task ownership checks and the fact that the current Docker command launches WSGI rather than ASGI.”

---

# APPENDIX A — SOURCE FILES EXAMINED

The source-first audit covered the main implementation files under:

- backend/backend/
- backend/apps/users/
- backend/apps/quizzes/
- backend/apps/students/
- frontend/src/
- backend/Dockerfile
- backend/requirements.txt
- frontend/package.json
- frontend/vite.config.js

The old README and QUIESY_DEEP_DIVE.md were used only as secondary references.

# APPENDIX B — OLD DOCUMENTATION VS CURRENT SOURCE

The existing QUIESY_DEEP_DIVE.md contains useful explanations but also makes claims not fully supported by current source, including:

- React 18 instead of current React 19 package declaration
- PROTECT relationships where current models use CASCADE
- fully automatic quiz lifecycle
- fully asynchronous coding evaluation
- scheduled Celery Beat execution
- Docker serving the ASGI WebSocket path
- fully secured WebSocket authentication
- complete version binding of attempts
- shuffle behavior as though it is active

These claims should not be repeated in interviews without verifying the current implementation.

# END
