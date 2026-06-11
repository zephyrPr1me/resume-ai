# Resume AI Insight 🚀

[![Python](https://img.shields.io/badge/Python-3.12+-blue?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?logo=fastapi)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Code Style](https://img.shields.io/badge/code%20style-ruff-000000.svg)](https://github.com/astral-sh/ruff)

An intelligent resume analysis service powered by **OpenRouter API**. Upload your PDF or TXT resume and receive structured feedback on strengths, skill gaps, and recommendations.

## ✨ Features

- 📄 **Resume parsing**: PDF/TXT text extraction with PyMuPDF.
- 🤖 **AI-powered review**: Match percentage, summary, found skills, missing skills, and recommendations.
- 🎯 **Job matching**: Optional job description input for role-specific analysis.
- 🧩 **Modular backend**: Clean separation of routes, AI logic, schemas, config, and extraction.

## 🛠 Tech Stack

- **Backend**: FastAPI, Python 3.12+, Pydantic
- **AI**: OpenRouter
- **PDF parsing**: PyMuPDF (`fitz`)
- **HTTP client**: httpx
- **Linting**: Ruff

## ⚡ Quick Start

### Prerequisites
- Python 3.12+
- OpenRouter API key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd resume-ai
   ```

2. Install dependencies:
   ```bash
   python -m pip install -e .
   ```

3. Create a `.env` file:
   ```env
   OPENROUTER_API_KEY=your_api_key_here
   ```

### Run the app

```bash
python -m uvicorn app.main:app --reload
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000).

## 📡 API Overview

| Method | Endpoint | Description | Timeout |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Serves the frontend UI | - |
| `GET` | `/health` | Health check for monitoring | - |
| `POST` | `/upload/` | Analyzes resume file with optional job description | 180s |
| `GET` | `/models-free/` | Returns free OpenRouter models | - |

**Request Params**
- `file`: PDF or TXT resume (required)
- `job_description`: Target job description text (optional)
- `model`: OpenRouter model ID (optional)

**Response Example**
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

**Health Check Example**
```json
{
  "status": "healthy",
  "service": "resume-ai-insight",
  "version": "0.1.0"
}
```

## 🛠 Development

Run tests:
```bash
python -m pytest
```

Lint and format:
```bash
python -m ruff check .
python -m ruff format .
```

### Features

**Request handling:**
- ⏱️ Automatic timeouts (180 seconds for `/upload/` endpoint)
- ❌ Request cancellation support (CancelledError handling)
- 🏥 Health check endpoint (`/health`) for monitoring and liveness probes

### Project structure

```
app/
├── main.py          # FastAPI app entrypoint
├── routes.py        # API route handlers
├── ai.py            # AI prompt construction and response parsing
├── schemas.py       # Pydantic models
├── config.py        # dotenv and runtime configuration
├── text_extractor.py# Resume parsing utilities
└── static/          # Frontend HTML/JS
assets/
tests/
pyproject.toml
README.md
LICENSE
```

## 🧪 Testing

### Run tests
```bash
pytest
```

### Run a specific test file
```bash
pytest tests/test_main.py
pytest tests/test_frontend.py
```

### Run with coverage report
```bash
pytest --cov=app --cov-report=html
```

### Run a specific test case
```bash
pytest tests/test_main.py::TestExtractJsonFromAi::test_extract_json_valid_json
pytest -k "test_upload" -v
```

### Run only unit tests
```bash
pytest -m unit
```

### Run only integration tests
```bash
pytest -m integration
```

### Run with verbose output
```bash
pytest -v
```

## 🔮 Future Enhancements
- [ ] DOCX/DOC support
- [ ] ATS compatibility scoring
- [ ] Resume version comparison
- [ ] User auth and history tracking

## 📄 License

Licensed under the [MIT License](LICENSE).
