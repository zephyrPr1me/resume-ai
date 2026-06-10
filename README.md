# Resume AI Insight

An intelligent resume analysis tool powered by Google's Gemini AI. Upload your resume PDF and get detailed AI-driven feedback on your strengths, weaknesses, matching skills, and actionable recommendations.

## Features

- 📄 **PDF Resume Upload** – Drag & drop or browse to upload your resume
- 🤖 **AI-Powered Analysis** – Leverages Google Gemini 2.5 Flash for intelligent insights
- 🎯 **Job Matching** – Optional job description input for role-specific analysis
- 📊 **Structured Output** – Receives categorized feedback:
  - Match percentage (0–100)
  - Professional summary
  - Found skills (relevant to role)
  - Missing skills (gaps)
  - Recommendations (actionable improvements)
- 🎨 **Modern UI** – Clean, responsive frontend built with Tailwind CSS
- 💾 **Copy Results** – Export analysis as JSON for record-keeping

## Tech Stack

- **Backend**: FastAPI, Python 3.12+
- **Frontend**: Vanilla JavaScript, Tailwind CSS
- **AI**: Google Generative AI (Gemini 2.5 Flash)
- **PDF Processing**: PyMuPDF (fitz)
- **Data Validation**: Pydantic

## Prerequisites

- Python 3.12 or higher
- `uv` package manager (recommended) or `pip`
- Google Generative AI API key ([Get one here](https://ai.google.dev))

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd resume-ai-insight
   ```

2. **Create a `.env` file** in the project root with your OpenRouter API key:
   ```env
   OPENROUTER_API_KEY=your_api_key_here
   ```

3. **Install dependencies** (using `uv`):
   ```bash
   uv sync
   ```

   Or with pip:
   ```bash
   pip install -e .
   ```

## Running the Application

Start the development server:

```bash
uv run uvicorn app.main:app --reload
```

The application will be available at `http://localhost:8000`

## Project Structure

```
resume-ai-insight/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI backend
│   └── static/
│       ├── index.html          # Frontend HTML
│       └── script.js           # Frontend JavaScript
├── example-pdf/                # Sample resume files
├── .env.example                # Environment template
├── pyproject.toml              # Project dependencies
├── README.md                   # This file
└── LICENSE
```

## API Endpoints

### `GET /`
Returns the frontend HTML page.

### `POST /upload/`
Analyzes a resume PDF and returns structured feedback.

**Request:**
- `file` (multipart/form-data, required): PDF file to analyze
- `job_description` (form, optional): Target job description for role-specific matching

**Response:**
```json
{
  "status": "success",
  "filename": "resume.pdf",
  "analysis": {
    "match_percentage": 95,
    "summary": "John Doe is an exceptionally strong candidate...",
    "found_skills": ["Python", "FastAPI", "React", "Docker"],
    "missing_skills": ["Kubernetes", "TypeScript"],
    "recommendations": ["Add metrics to project descriptions...", "Expand open-source contributions..."]
  }
}
```

## Usage

1. **Open the application** at `http://localhost:8000`
2. **Upload a resume** by dragging & dropping or clicking the upload area
3. *(Optional)* **Paste a job description** to get role-specific matching
4. **Click "Analyze Resume"** and wait for AI analysis
5. **Review the results**:
   - Match percentage
   - Professional summary
   - Identified skills
   - Skill gaps
   - Actionable recommendations
6. **Copy the results** as JSON using the "Copy" button

## How It Works

1. **PDF Extraction**: PyMuPDF extracts text from uploaded PDF files
2. **AI Analysis**: Text is sent to Google Gemini with a structured JSON schema
3. **Response Validation**: AI response is parsed, validated, and converted to Pydantic models
4. **Frontend Display**: Results are rendered dynamically with Tailwind CSS styling

## Configuration

### Backend

Key settings in `app/main.py`:
- **Temperature**: 0.0 (deterministic output)
- **Max Tokens**: 1200 (ensures complete responses)
- **Model**: gemini-2.5-flash

### Frontend

Customizable via CSS in `app/static/index.html`:
- Tailwind CSS configuration
- Color schemes for different analysis sections
- Responsive breakpoints

## Error Handling

The application handles common errors gracefully:
- **Empty files**: Returns 400 Bad Request
- **Large files**: Rejects files > 5MB with 413 Payload Too Large
- **Invalid JSON from AI**: Uses json_repair fallback and returns 502 Bad Gateway
- **Server errors**: Returns 500 Internal Server Error with descriptive messages

## Development

### Linting & Formatting

```bash
uv run ruff check .
uv run ruff format .
```

### Running Tests

(Tests can be added in the future)

## Future Enhancements

- [ ] Support for DOCX, DOC resume formats
- [ ] Resume comparison between multiple versions
- [ ] ATS (Applicant Tracking System) compatibility scoring
- [ ] Resume templates and editing interface
- [ ] User authentication and resume history
- [ ] Batch resume analysis
- [ ] Export to PDF reports

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Support

For issues, questions, or feedback, please open an issue on the GitHub repository.

---

**Built with ❤️ using FastAPI and Google Generative AI**

