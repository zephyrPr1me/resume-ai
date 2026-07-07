# Resume AI Insight 🚀

[![Python](https://img.shields.io/badge/Python-3.12+-blue?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?logo=fastapi)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Code Style](https://img.shields.io/badge/code%20style-ruff-000000.svg)](https://github.com/astral-sh/ruff)

An intelligent resume analysis service powered by the OpenRouter API. Upload a PDF or TXT resume to receive structured feedback: match percentage, found/missing skills, a summary, and tailored recommendations.

## ✨ Features

- PDF/TXT resume parsing with PyMuPDF
- AI-powered review (summary, match score, recommendations)
- Optional job description input for role-specific analysis
- Clean, modular backend (routes, AI logic, schemas, extraction)

## 🛠 Tech Stack

- Backend: FastAPI, Python 3.12+, Pydantic
- AI: OpenRouter
- PDF parsing: PyMuPDF (`fitz`)
- HTTP client: httpx
- Linting: Ruff

## ⚡ Quick Start (Backend)

### Prerequisites
- Python 3.12+
- OpenRouter API key

### Local install

1. Clone the repository
```bash
git clone <repository-url>
cd resume-ai
```

2. Install Python dependencies
```bash
python -m pip install -e .
```

3. Add environment variables in a `.env` file (see `app/config.py`)
```env
OPENROUTER_API_KEY=your_api_key_here
```

4. Run the backend
```bash
python -m uvicorn app.main:app --reload
```

The API will be available at http://127.0.0.1:8000

## 🧭 Frontend (optional)

The repository includes a Next.js frontend in `app/frontend`. To run it locally:

```bash
cd app/frontend
npm install
npm run dev
```

The frontend runs on [http://localhost:3000](http://localhost:3000) by default and communicates with the backend API.

## 🐳 Docker

Build and run both services with Docker Compose (if you prefer):

```bash
docker compose up --build
```

This will build the backend image and serve the app. See `docker-compose.yml` for service details and ports.

## 📡 API Overview

| Method | Endpoint | Description | Timeout |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Serves the frontend UI | - |
| `GET` | `/health` | Health check for monitoring | - |
| `POST` | `/upload/` | Analyzes resume file with optional job description | 180s |
| `GET` | `/models-free/` | Returns free OpenRouter models | - |

Request params
- `file`: PDF or TXT resume (required)
- `job_description`: Target job description text (optional)
- `model`: OpenRouter model ID (optional)

Response example
```json
{
  "status": "success",
  "filename": "resume.pdf",
  "analysis": {
    "match_percentage": 95,
    "summary": "Strong candidate with relevant backend experience...",
    "found_skills": ["Python", "FastAPI", "Docker"],
    "missing_skills": ["Kubernetes"],
    "recommendations": ["Add metrics to project descriptions"]
  }
}
```

Health check example
```json
{
  "status": "healthy",
  "service": "resume-ai-insight",
  "version": "0.1.0"
}
```

## 🛠 Development

Run tests
```bash
pytest
```

Run a specific test
```bash
pytest tests/test_main.py
```

Lint and format
```bash
python -m ruff check .
python -m ruff format .
```

## Project structure

```
app/
├── main.py
├── routes.py
├── ai.py
├── schemas.py
├── config.py
├── text_extractor.py
└── frontend/        # Next.js frontend (app/frontend)
tests/
pyproject.toml
docker-compose.yml
Dockerfile
README.md
LICENSE
```

## 🔮 Future Enhancements

- DOCX/DOC support
- ATS compatibility scoring
- Resume version comparison
- User auth and history tracking

## 📄 License

Licensed under the [MIT License](LICENSE).
