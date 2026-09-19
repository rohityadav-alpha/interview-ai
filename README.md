# Interview AI — Technical Interview Simulation Platform

A production-ready technical interview practice platform built with **Python Django**, **Vanilla JavaScript**, **CSS Neo-Brutalism**, and **Google Gemini AI**.

---

## ⚡ Features

- **Neo-Brutalist UI**: High-contrast, bold geometry with signature hard offset shadows and responsive design.
- **AI Interview Simulation**: Adaptive, conversational technical questions powered by Google Gemini with multi-key rotation fallback.
- **Live Voice & Audio Analysis**: Real-time Speech-to-Text, natural Text-to-Speech question reading, and audio waveform visualizer.
- **Face & Attention Tracking**: Client-side face detection and eye contact tracking using `face-api.js`.
- **Comprehensive Candidate Audit & PDF**: Detailed session report with score breakdowns, strengths, areas for improvement, and a vector PDF report generator.
- **Global Leaderboard**: Public and filtered rankings by skill and performance.
- **Production Ready**: Fully configured for Vercel deployment with WhiteNoise and PostgreSQL support.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.12+ / Django 5.x
- **Frontend**: HTML5, Vanilla JavaScript, Space Grotesk Typography, Neo-Brutalist CSS
- **AI Engine**: Google Gemini API (`gemini-2.5-flash`)
- **Database**: SQLite (local development) / PostgreSQL (production)
- **Deployment**: Vercel Serverless WSGI with WhiteNoise

---

## 🚀 Quick Start

### 1. Clone & Setup
```bash
git clone https://github.com/rohityadav-alpha/interview-ai.git
cd interview-ai
pip install -r requirements.txt
```

### 2. Configure Environment
Create a `.env` file in the project root:
```env
SECRET_KEY=your-secret-key
DEBUG=True

GOOGLE_GEMINI_API_KEY=your-gemini-api-key
GOOGLE_GEMINI_API_KEY_1=optional-fallback-key-1
GOOGLE_GEMINI_API_KEY_2=optional-fallback-key-2

# Optional
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=your-email@example.com
```

### 3. Run Migrations & Start Server
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```
Visit `http://127.0.0.1:8000` in your browser.

---

## 📄 License
MIT License.
