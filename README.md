# INTERVIEW AI // TECHNICAL INTERVIEW SIMULATION PLATFORM

A production-grade, full-stack AI interview platform built with **Python Django**, **Vanilla JavaScript**, **Neo-Brutalist CSS**, and **Google Gemini 2.5 Flash**. The system conducts automated, adaptive technical interviews with real-time speech recognition, natural text-to-speech feedback, facial eye-contact tracking, multi-tier scoring, and vector PDF performance audit generation.

---

## TABLE OF CONTENTS

- [1. Executive Overview](#1-executive-overview)
- [2. System Architecture](#2-system-architecture)
- [3. Key Feature Matrix](#3-key-feature-matrix)
- [4. Neo-Brutalism Design Language](#4-neo-brutalism-design-language)
- [5. Technology Stack](#5-technology-stack)
- [6. Directory & Codebase Structure](#6-directory--codebase-structure)
- [7. Database Schema & Data Models](#7-database-schema--data-models)
- [8. API Reference](#8-api-reference)
- [9. AI Engine & Key Rotation](#9-ai-engine--key-rotation)
- [10. Voice & Face Tracking Subsystems](#10-voice--face-tracking-subsystems)
- [11. Audit Report & Vector PDF Engine](#11-audit-report--vector-pdf-engine)
- [12. Local Development & Installation](#12-local-development--installation)
- [13. Environment Configuration](#13-environment-configuration)
- [14. Production & Vercel Deployment](#14-production--vercel-deployment)
- [15. Administrative Control Panel](#15-administrative-control-panel)
- [16. License](#16-license)

---

## 1. EXECUTIVE OVERVIEW

Interview AI is designed to replicate high-stakes technical job interviews by combining conversational generative AI with physical assessment metrics. Candidates select or input a technical domain (e.g., Python, Django, System Design, AI/ML) and difficulty level. The system dynamically creates a 10-question technical curriculum tailored to the role, conducts the interview via voice or text, records attention metrics via computer vision, evaluates responses with contextual conversational history, and generates an official candidate report with strengths, improvement targets, and downloadable PDF audits.

### Core Objectives
- Zero hallucination via structured prompt constraints and JSON response schemas.
- Continuous multi-key API failover across three distinct Gemini API quotas.
- Low-latency client-side processing for Speech-to-Text and Face Landmark tracking.
- Independent database architecture: SQLite for zero-config local work, PostgreSQL for serverless deployment.
- High-contrast, accessibility-focused Neo-Brutalist design language with no bloated front-end frameworks.

---

## 2. SYSTEM ARCHITECTURE

```
+-----------------------------------------------------------------------------+
|                             CLIENT / BROWSER                                |
|                                                                             |
|   +-------------------+   +--------------------+   +--------------------+   |
|   |  Voice Engine     |   |  Face Tracker HUD  |   |  Interview Engine  |   |
|   |  - Web Speech STT |   |  - face-api.js     |   |  - Live Audio Wave |   |
|   |  - SpeechSynth    |   |  - Eye Contact %   |   |  - Editable Input  |   |
|   +---------+---------+   +---------+----------+   +---------+----------+   |
|             |                       |                        |              |
+-------------|-----------------------|------------------------|--------------+
              |                       |                        |
              | (Audio/Visual Signals)| (HTTPS REST / JSON)    |
              v                       v                        v
+-----------------------------------------------------------------------------+
|                           DJANGO SERVER / WSGI                              |
|                                                                             |
|   +-------------------+   +--------------------+   +--------------------+   |
|   |  Accounts App     |   |  Interviews App    |   |  Reports App       |   |
|   |  - CustomUser     |   |  - Session Control |   |  - Score Aggregat. |   |
|   |  - Auth & Sessions|   |  - Question State  |   |  - Vector PDF Gen  |   |
|   +-------------------+   +---------+----------+   +--------------------+   |
|                                     |                                       |
|                                     v                                       |
|                           +--------------------+                            |
|                           |  AI Service Layer  |                            |
|                           |  - Key Rotation    |                            |
|                           |  - Gemini 2.5 Flash|                            |
|                           +---------+----------+                            |
+-------------------------------------|---------------------------------------+
                                      |
       +------------------------------+-------------------------------+
       |                                                              |
       v                                                              v
+---------------+                                              +---------------+
|  PERSISTENCE  |                                              | EXTERNAL APIs |
|  - SQLite     | (Local)                                      | - Gemini API  |
|  - PostgreSQL | (Production / Supabase)                      | - SendGrid    |
+---------------+                                              +---------------+
```

---

## 3. KEY FEATURE MATRIX

| Component | Specification | Description |
|---|---|---|
| Question Generation | Gemini 2.5 Flash | Real-time generation of 10 scenario, conceptual, and problem-solving questions |
| Voice Recognition | Web Speech API | Continuous speech-to-text with auto-filling into editable response box |
| Audio Visualizer | Web Audio API | Live frequency spectrum and amplitude waveform mapped on HTML5 Canvas |
| Text-to-Speech | SpeechSynthesis API | Natural voice synthesis reciting questions with auto-resume fix for Chromium |
| Visual Attention | face-api.js | Neural face detection and eye-contact ratio tracking in a floating HUD |
| AI Evaluation | Contextual Multi-Turn | Evaluates current response against prior turns and returns structured metrics |
| PDF Generator | jsPDF Vector Engine | Generates a multi-page, neo-brutalist candidate audit document client-side |
| Leaderboard | Aggregation Query | Sorts and displays global rankings filtered by specific technologies |
| Email Delivery | SendGrid Web API | Transmits branded completion transcripts with direct session links |
| Administration | Django Admin | Full CRUD panel for candidate profiles, transcript records, and scoring adjustments |

---

## 4. NEO-BRUTALISM DESIGN LANGUAGE

The interface adheres strictly to the Neo-Brutalism architectural philosophy. It eschews generic soft shadows, rounded corners, and gradients in favor of structural clarity, hard offset stamps, and assertive typography.

### Foundational Rules
- **Color Palette**:
  - Primary Accent: `#BCFF4F` (Electric Lime Green)
  - Secondary Warning: `#FFE500` (Electric Yellow)
  - Danger / Error: `#FF4D4D` (Hot Coral)
  - Pure Black: `#000000`
  - Pure White: `#FFFFFF`
  - Structural Gray: `#F5F5F5`
- **Hard Offset Shadow**: Every interactive card and container utilizes `border: 2.5px solid #000000` paired with `box-shadow: 4px 4px 0px #000000`. On active press, the element translates `translate(4px, 4px)` with shadow collapsing to zero.
- **Zero Border Radius**: Universal reset enforcing `border-radius: 0 !important` across all buttons, avatars, inputs, modal overlays, and badges.
- **Massive Display Typography**: Headings rendered in `Space Grotesk` with `font-weight: 700` or `900`, uppercase formatting, and visible border dividing lines.
- **Zero Emojis**: Replaced with functional ASCII tokens: `[+]` for Strengths, `[!]` for Improvement targets, `[*]` for Tips, `[>]` for Proceed/Submit, and `[<]` for Return.

---

## 5. TECHNOLOGY STACK

### Backend Framework & Libraries
- **Language**: Python 3.12+ / 3.14
- **Web Framework**: Django 5.x / 6.0
- **Database Connector**: `dj-database-url` (Dynamic SQLite / PostgreSQL switching)
- **Database Driver**: `psycopg2-binary` (PostgreSQL client)
- **Static File Engine**: `whitenoise` (Compressed manifest storage)
- **AI SDK**: `google-genai` (Official Google Gemini Python Client)
- **Email Dispatch**: `sendgrid` (SendGrid v3 API client)
- **Configuration**: `python-dotenv` (Environment management)

### Frontend Infrastructure
- **Base Markup**: Django Templates (DTL) with zero external JS frameworks (No React, No Next.js, No Vue).
- **Styling**: Pure CSS3 Neo-Brutalism (`static/css/style.css`, 1000+ lines).
- **Fonts**: Space Grotesk via Google Fonts.
- **Client Libraries (CDN)**:
  - Chart.js (Dashboard performance telemetry)
  - jsPDF & jsPDF-AutoTable (Vector report generation)
  - face-api.js (Local neural face detection)

---

## 6. DIRECTORY & CODEBASE STRUCTURE

```
d:/interview-ai-new/interview_ai_django/
├── manage.py                          # Django CLI entrypoint
├── requirements.txt                   # Production Python package manifest
├── vercel.json                        # Vercel serverless deployment specification
├── build_files.sh                     # Deployment asset compilation script
├── .env                               # Environment secret values (git-ignored)
├── .gitignore                         # Version control exclusion rules
├── db.sqlite3                         # Local development database (git-ignored)
│
├── interview_ai/                      # Core Django Project Package
│   ├── __init__.py
│   ├── asgi.py                        # ASGI asynchronous server config
│   ├── settings.py                    # Project configuration (DB, Auth, Static)
│   ├── urls.py                        # Root URL routing table
│   └── wsgi.py                        # WSGI entrypoint with Vercel 'app' mapping
│
├── accounts/                          # Authentication Subsystem
│   ├── admin.py                       # CustomUser admin configuration
│   ├── forms.py                       # SignupForm and LoginForm definitions
│   ├── models.py                      # CustomUser model extending AbstractUser
│   ├── urls.py                        # Auth routes (/accounts/login, /accounts/signup)
│   └── views.py                       # Auth controllers with session handling
│
├── interviews/                        # Core Interview & AI Engine
│   ├── admin.py                       # Interview and InterviewResponse admin
│   ├── api_views.py                   # REST API controllers (Start, Converse, Complete)
│   ├── forms.py                       # New interview setup forms
│   ├── models.py                      # Interview and InterviewResponse entities
│   ├── urls.py                        # Page and API routing endpoints
│   ├── views.py                       # Dashboard, new session, live session views
│   └── services/
│       ├── ai_service.py              # Gemini client with triple-key rotation
│       └── email_service.py           # SendGrid completion email dispatcher
│
├── leaderboard/                       # Candidate Ranking Subsystem
│   ├── admin.py
│   ├── models.py
│   ├── urls.py                        # /leaderboard/ and JSON ranking endpoints
│   └── views.py                       # Sorting, deduplication, and ranking logic
│
├── reports/                           # Audit & Export Subsystem
│   ├── admin.py
│   ├── models.py
│   ├── urls.py                        # /reports/<id>/ and JSON report endpoints
│   └── views.py                       # Score grading and JSON payload injection
│
├── templates/                         # HTML5 Neo-Brutalist Templates
│   ├── base.html                      # Root HTML shell with toasts & navigation
│   ├── navbar.html                    # Sticky header with user profile dropdown
│   ├── footer.html                    # System status indicator and metadata
│   ├── landing.html                   # High-contrast marketing hero page
│   ├── accounts/
│   │   ├── login.html                 # Hard-bordered signin portal
│   │   └── signup.html                # Account registration form
│   ├── interviews/
│   │   ├── dashboard.html             # Metric cards, Chart.js, interview history
│   │   ├── new_interview.html         # Skill selector and difficulty setup
│   │   └── live_interview.html        # Audio canvas, face HUD, response terminal
│   ├── leaderboard/
│   │   └── leaderboard.html           # Public candidate ranking table
│   └── reports/
│       └── report_detail.html         # Audit page with vector PDF export trigger
│
└── static/                            # Static Asset Directory
    ├── css/
    │   └── style.css                  # Global Neo-Brutalist design system
    ├── js/
    │   ├── main.js                    # CSRF tokens, toasts, network helpers
    │   ├── voice_engine.js            # Speech recognition, TTS, silence commit
    │   ├── face_tracker.js            # WebRTC camera, face-api eye-contact engine
    │   ├── interview_live.js          # Live interview UI coordinator
    │   ├── dashboard.js               # Performance metric graphs via Chart.js
    │   └── pdf_export.js              # High-fidelity vector PDF generator
    └── models/                        # Pre-trained neural weights for face-api
        ├── tiny_face_detector_model*  # Face bounding box detection weights
        └── face_landmark_68_tiny*     # 68-point facial landmark weights
```

---

## 7. DATABASE SCHEMA & DATA MODELS

### Entity Relationship Overview

```
+-----------------------------------+
|         accounts.CustomUser       |
+-----------------------------------+
| id            : BigAutoField (PK) |
| username      : VarChar(150) (UQ) |
| email         : EmailField        |
| first_name    : VarChar(150)      |
| last_name     : VarChar(150)      |
| is_staff      : Boolean           |
| is_superuser  : Boolean           |
+-----------------+-----------------+
                  | 1
                  |
                  | N
+-----------------v-----------------+
|       interviews.Interview        |
+-----------------------------------+
| id                  : BigAuto (PK)|
| user_id             : FK(User)    |
| skill               : VarChar(100)|
| difficulty          : VarChar(20) |
| total_score         : Integer     |
| avg_score           : Decimal(4,2)|
| questions_attempted : Integer     |
| interview_duration  : Integer(sec)|
| is_completed        : Boolean     |
| created_at          : DateTime    |
+-----------------+-----------------+
                  | 1
                  |
                  | N
+-----------------v-----------------+
|   interviews.InterviewResponse    |
+-----------------------------------+
| id              : BigAutoField(PK)|
| interview_id    : FK(Interview)   |
| question_number : Integer         |
| question        : TextField       |
| user_answer     : TextField       |
| ai_score        : Integer (1-10)  |
| ai_feedback     : TextField       |
| strengths       : TextField(JSON) |
| improvements    : TextField(JSON) |
| confidence_tips : TextField(JSON) |
| time_taken      : Integer(sec)    |
| created_at      : DateTime        |
+-----------------------------------+
```

---

## 8. API REFERENCE

### 1. Initialize Interview Session
- **Endpoint**: `/api/interviews/start/`
- **Method**: `POST`
- **Auth Required**: Yes (`@login_required`)
- **Headers**: `Content-Type: application/json`, `X-CSRFToken: <token>`
- **Request Body**:
  ```json
  {
    "skill": "Python",
    "difficulty": "hard"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "interviewId": 12,
    "questionCount": 10
  }
  ```

### 2. Fetch Questions
- **Endpoint**: `/api/interviews/<interview_id>/questions/`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "questions": [
      {
        "id": 45,
        "questionNumber": 1,
        "question": "Explain how GIL impacts CPU-bound multi-threaded programs.",
        "userAnswer": null,
        "aiScore": null,
        "aiFeedback": null
      }
    ],
    "interview": {
      "skill": "Python",
      "difficulty": "hard"
    }
  }
  ```

### 3. Submit Response & Evaluate
- **Endpoint**: `/api/interviews/<interview_id>/converse/`
- **Method**: `POST`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "questionId": 45,
    "answer": "The GIL prevents multiple native threads from executing Python bytecodes simultaneously...",
    "conversationHistory": [
      { "role": "interviewer", "text": "Explain how GIL impacts..." },
      { "role": "candidate", "text": "The GIL prevents..." }
    ]
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "score": 8,
    "feedback": "Strong explanation of memory lock constraints.",
    "verboseFeedback": "You correctly identified that GIL restricts bytecode execution to one thread at a time...",
    "spokenResponse": "Well explained. Let us move forward.",
    "strengths": ["Clear technical articulation", "Accurate definition of GIL"],
    "improvements": ["Could mention multiprocessing alternative"],
    "confidenceTips": ["Maintain steady pacing when detailing low-level concepts"]
  }
  ```

### 4. Complete Session
- **Endpoint**: `/api/interviews/<interview_id>/complete/`
- **Method**: `POST`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "duration": 482
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "totalScore": 76,
    "avgScore": "7.60"
  }
  ```

### 5. Fetch Session Report JSON
- **Endpoint**: `/reports/api/reports/<interview_id>/`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response** (`200 OK`): Full candidate audit metadata with questions and parsed strengths.

---

## 9. AI ENGINE & KEY ROTATION

The AI service layer (`interviews/services/ai_service.py`) coordinates with Google's official `google-genai` SDK using the `gemini-2.5-flash` model.

### Key Rotation Algorithm
To prevent quota exhaustion (`429 Too Many Requests`) from breaking live candidate interviews, the backend loads three keys from environment variables:
1. `GOOGLE_GEMINI_API_KEY`
2. `GOOGLE_GEMINI_API_KEY_1`
3. `GOOGLE_GEMINI_API_KEY_2`

When executing `call_gemini(prompt, temperature)`:
1. It cycles through active keys in sequence.
2. If Key 0 throws an API error, it logs the failure and automatically retries with Key 1.
3. If all keys fail, it falls back to structured local questions/evaluations to ensure the user experience is never blocked.

---

## 10. VOICE & FACE TRACKING SUBSYSTEMS

### Speech Recognition & Editable Flow
1. **Speech-to-Text**: Managed via `webkitSpeechRecognition` with continuous listening.
2. **Synchronized Filling**: Voice transcriptions write in real time to both the display monitor and the editable `<textarea id="textAnswer">`.
3. **Silence Detection**: A 2.5-second silence interval automatically disengages the microphone, sets the status to ready, and allows the user to edit their text before clicking `SUBMIT`.

### Eye Contact & Face Tracking
- **Neural Model**: Powered by `face-api.js` using `tinyFaceDetector` and `faceLandmark68TinyNet` weights loaded directly from `/static/models/`.
- **Landmark Geometry**: Computes Euclidean coordinates of facial landmarks 27 through 30 (nose bridge) relative to landmarks 36 and 45 (eye pupils).
- **HUD Indicator**: Outputs a rolling percentage score to the client HUD (`0% - 100%`) indicating eye contact retention.

---

## 11. AUDIT REPORT & VECTOR PDF ENGINE

The system provides dual reporting capabilities:

### Vector PDF Generator (`static/js/pdf_export.js`)
Triggered via `EXPORT PDF [↓]`, this engine renders a document directly into memory using `jsPDF`:
- **Physical Neo-Brutalist Layout**: Uses vector drawing calls (`doc.rect`, `doc.setDrawColor(0,0,0)`, `doc.setLineWidth(0.6)`) to generate solid offset drop shadows.
- **Top Brand Emblem**: Black banner with Electric Lime accent square.
- **Hero Grade Card**: Color-coded container (Lime for $\ge 7.0$, Yellow for $5.0 - 6.9$, Coral for $< 5.0$) displaying overall candidate classification.
- **4-Column Metric Box**: Total Score, Average Score, Completion Ratio, and Duration.
- **Smart Page Splitting**: Pre-calculates question statement, candidate answer block, and AI evaluation text heights to prevent cards from clipping across page boundaries.
- **Confidential Footer**: Automatic `PAGE X OF Y` and audit timestamp markers.

### Browser Print Engine
Triggered via `PRINT [P]`, using an optimized `@media print` stylesheet that strips navigation chrome and prepares clean physical prints.

---

## 12. LOCAL DEVELOPMENT & INSTALLATION

### Prerequisites
- Python 3.12 or newer
- Git
- Modern browser (Chrome, Edge, or Firefox)

### Step-by-Step Installation

```bash
# 1. Clone the repository
git clone https://github.com/rohityadav-alpha/interview-ai.git
cd interview-ai

# 2. Create and activate a virtual environment
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment secrets
# Create a .env file and populate it with required values (see Section 13)

# 5. Run database migrations
python manage.py makemigrations accounts interviews
python manage.py migrate

# 6. Create administrator account
python manage.py createsuperuser

# 7. Start the development server
python manage.py runserver 8000
```

Open `http://127.0.0.1:8000` in your web browser.

---

## 13. ENVIRONMENT CONFIGURATION

Create a `.env` file in the root directory:

```env
# Application Security
SECRET_KEY=django-insecure-change-this-to-a-secure-random-string
DEBUG=True

# Google Gemini API Keys (At least one required)
GOOGLE_GEMINI_API_KEY=your_primary_gemini_api_key
GOOGLE_GEMINI_API_KEY_1=your_backup_gemini_api_key_1
GOOGLE_GEMINI_API_KEY_2=your_backup_gemini_api_key_2

# Database Configuration (Leave empty for local SQLite)
DATABASE_URL=postgresql://postgres:password@host:6543/postgres?pgbouncer=true

# SendGrid Dispatch (Optional)
SENDGRID_API_KEY=SG.your_sendgrid_key_here
SENDGRID_FROM_EMAIL=your_verified_sender@domain.com
SENDGRID_FROM_NAME=Interview AI
```

---

## 14. PRODUCTION & VERCEL DEPLOYMENT

The codebase is structured for serverless deployment on Vercel:

### Deployment Files
- **`vercel.json`**:
  ```json
  {
    "version": 2,
    "builds": [
      {
        "src": "interview_ai/wsgi.py",
        "use": "@vercel/python",
        "config": { "maxLambdaSize": "15mb", "runtime": "python3.12" }
      },
      {
        "src": "build_files.sh",
        "use": "@vercel/static-build",
        "config": { "distDir": "staticfiles" }
      }
    ],
    "routes": [
      { "src": "/static/(.*)", "dest": "/static/$1" },
      { "src": "/(.*)", "dest": "interview_ai/wsgi.py" }
    ]
  }
  ```
- **`build_files.sh`**:
  ```bash
  python3 -m pip install -r requirements.txt
  python3 manage.py collectstatic --noinput --clear
  ```

### Vercel Deployment Instructions
1. Import repository at [vercel.com](https://vercel.com).
2. Configure environment variables (`SECRET_KEY`, `DEBUG=False`, `GOOGLE_GEMINI_API_KEY`, `DATABASE_URL`).
3. Click **Deploy**. Vercel will install dependencies, collect static assets via WhiteNoise, and expose the WSGI application globally.

---

## 15. ADMINISTRATIVE CONTROL PANEL

Access the control panel at `/admin/` with your superuser credentials:
- **Custom Users**: Audit candidates, reset credentials, assign permissions.
- **Interviews**: Inspect completed sessions, adjust aggregate scores, review durations.
- **Interview Responses**: Inspect individual question transcripts, view AI scoring rationale, and audit strengths and tips.

---

## 16. LICENSE

Distributed under the MIT License. See `LICENSE` for complete terms.
