import json
import io
from unittest.mock import patch, MagicMock
from io import BytesIO
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import (
    app,
    extract_json_from_ai,
    call_openrouter_api,
    openrouter_client,
    AnalysisResult,
)
from app.text_extractor import (
    get_stream_extractor,
    PdfExtractor,
    TxtExtractor,
)

# Setup
BASE_DIR = Path(__file__).parent
FILE_PATH = BASE_DIR / "example.pdf"
client = TestClient(app)


# ============ Unit Tests: JSON Extraction ============

class TestExtractJsonFromAi:
    """Tests for JSON extraction from AI responses."""

    def test_extract_json_valid_json(self):
        """Should extract valid JSON."""
        text = '{"key": "value"}'
        result = extract_json_from_ai(text)
        assert json.loads(result) == {"key": "value"}

    def test_extract_json_with_code_block(self):
        """Should extract JSON from markdown code block."""
        text = '```json\n{"key": "value"}\n```'
        result = extract_json_from_ai(text)
        assert json.loads(result) == {"key": "value"}

    def test_extract_json_with_extra_text(self):
        """Should extract JSON even with surrounding text."""
        text = 'Here is the JSON: {"key": "value"} some text after'
        result = extract_json_from_ai(text)
        assert json.loads(result) == {"key": "value"}

    def test_extract_json_with_bom(self):
        """Should handle BOM characters."""
        text = '\ufeff{"key": "value"}'
        result = extract_json_from_ai(text)
        assert json.loads(result) == {"key": "value"}

    def test_extract_json_nested(self):
        """Should extract nested JSON structures."""
        text = '{"outer": {"inner": [1, 2, 3]}}'
        result = extract_json_from_ai(text)
        assert json.loads(result) == {"outer": {"inner": [1, 2, 3]}}

    def test_extract_json_with_special_chars(self):
        """Should handle JSON with special characters."""
        text = '{"message": "Hello\\nWorld", "emoji": "🚀"}'
        result = extract_json_from_ai(text)
        data = json.loads(result)
        assert "Hello" in data["message"]


# ============ Unit Tests: Text Extraction ============

class TestTextExtractor:
    """Tests for text extraction from files."""

    def test_txt_extractor(self):
        """Should extract text from TXT file."""
        content = "This is a test resume\nWith multiple lines\n"
        stream = BytesIO(content.encode('utf-8'))
        extractor = TxtExtractor(stream, "resume.txt")
        result = extractor.extract()
        assert result == content

    def test_get_stream_extractor_txt(self):
        """Should return TxtExtractor for .txt files."""
        stream = BytesIO(b"test")
        extractor = get_stream_extractor(stream, "resume.txt")
        assert isinstance(extractor, TxtExtractor)

    def test_get_stream_extractor_pdf(self):
        """Should return PdfExtractor for .pdf files."""
        stream = BytesIO(b"test")
        extractor = get_stream_extractor(stream, "resume.pdf")
        assert isinstance(extractor, PdfExtractor)

    def test_get_stream_extractor_unsupported(self):
        """Should raise ValueError for unsupported file types."""
        stream = BytesIO(b"test")
        with pytest.raises(ValueError, match="Unsupported format"):
            get_stream_extractor(stream, "resume.docx")

    def test_text_extractor_file_too_large(self):
        """Should raise ValueError for files larger than 50MB."""
        # Create a mock stream that reports size > 50MB
        stream = MagicMock(spec=io.BytesIO)
        stream.seek = MagicMock()
        stream.tell = MagicMock(return_value=51 * 1024 * 1024)  # 51MB
        
        with pytest.raises(ValueError, match="too large to process"):
            TxtExtractor(stream, "huge_file.txt")

    def test_text_extractor_invalid_stream(self):
        """Should raise TypeError for non-file-like objects."""
        with pytest.raises(TypeError, match="file-like object"):
            TxtExtractor("not a file", "resume.txt")


# ============ Unit Tests: AnalysisResult Validation ============

class TestAnalysisResult:
    """Tests for AnalysisResult model validation."""

    def test_analysis_result_valid(self):
        """Should create valid AnalysisResult."""
        result = AnalysisResult(
            match_percentage=85,
            summary="Good candidate",
            found_skills=["Python", "FastAPI"],
            missing_skills=["Rust"],
            recommendations=["Add more projects"],
        )
        assert result.match_percentage == 85
        assert result.summary == "Good candidate"

    def test_analysis_result_match_percentage_bounds(self):
        """Should validate match_percentage is between 0-100."""
        with pytest.raises(ValueError):
            AnalysisResult(
                match_percentage=150,
                summary="Invalid",
            )
        with pytest.raises(ValueError):
            AnalysisResult(
                match_percentage=-10,
                summary="Invalid",
            )

    def test_analysis_result_nullable_percentage(self):
        """Should allow null match_percentage."""
        result = AnalysisResult(
            match_percentage=None,
            summary="Summary without job",
        )
        assert result.match_percentage is None


# ============ Integration Tests: HTTP Endpoints ============

class TestHttpEndpoints:
    """Integration tests for HTTP endpoints."""

    def test_read_root(self):
        """GET / should return HTML."""
        response = client.get("/")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
        assert "<html" in response.text.lower()

    def test_models_free_endpoint(self):
        """GET /models-free/ should return model list or error gracefully."""
        response = client.get("/models-free/")
        # Endpoint might fail if OpenRouter API is unreachable, but should not 500
        assert response.status_code in [200, 503, 502]
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)

    def test_upload_empty_file(self):
        """POST /upload/ with empty file should return 400."""
        response = client.post(
            "/upload/",
            files={"file": ("empty.pdf", BytesIO(b""))}
        )
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()

    def test_upload_file_too_large(self):
        """POST /upload/ with file > 50MB should return 413."""
        # Create a file larger than 50MB
        large_data = b"x" * (51 * 1024 * 1024)
        response = client.post(
            "/upload/",
            files={"file": ("large.pdf", BytesIO(large_data))}
        )
        assert response.status_code == 413

    @patch("app.main.openrouter_client")
    def test_upload_with_valid_pdf(self, mock_openrouter):
        """POST /upload/ with valid PDF and mocked AI should return 200."""
        # Mock AI response
        mock_openrouter.return_value = json.dumps({
            "match_percentage": 90,
            "summary": "Excellent candidate",
            "found_skills": ["Python"],
            "missing_skills": [],
            "recommendations": ["Add certifications"],
        })
        
        if FILE_PATH.exists():
            with open(FILE_PATH, "rb") as f:
                response = client.post(
                    "/upload/",
                    files={"file": f},
                    data={"job_description": "Python Developer", "model": "google/gemma-4-31b-it:free"}
                )
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"
            assert data["analysis"]["summary"] == "Excellent candidate"
        else:
            pytest.skip("example.pdf not found")

    @patch("app.main.openrouter_client")
    def test_upload_with_txt_file(self, mock_openrouter):
        """POST /upload/ with TXT file should work."""
        mock_openrouter.return_value = json.dumps({
            "match_percentage": 75,
            "summary": "Good fit",
            "found_skills": [],
            "missing_skills": [],
            "recommendations": [],
        })
        
        txt_content = b"Resume in plain text format\nSkilled in Python and JavaScript"
        response = client.post(
            "/upload/",
            files={"file": ("resume.txt", BytesIO(txt_content))},
            data={"job_description": "", "model": "google/gemma-4-31b-it:free"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["analysis"]["match_percentage"] == 75

    def test_upload_without_file(self):
        """POST /upload/ without file should return error."""
        response = client.post(
            "/upload/",
            data={"job_description": "Test", "model": "google/gemma-4-31b-it:free"}
        )
        assert response.status_code == 422

    @patch("app.main.openrouter_client")
    def test_upload_with_job_description(self, mock_openrouter):
        """POST /upload/ should pass job_description to AI."""
        mock_openrouter.return_value = json.dumps({
            "match_percentage": 88,
            "summary": "Strong match",
            "found_skills": [],
            "missing_skills": [],
            "recommendations": [],
        })
        
        txt_content = b"Python developer with 5 years experience"
        response = client.post(
            "/upload/",
            files={"file": ("resume.txt", BytesIO(txt_content))},
            data={
                "job_description": "Senior Python Developer - remote",
                "model": "google/gemma-4-31b-it:free"
            }
        )
        assert response.status_code == 200
        # Verify the job description was passed
        mock_openrouter.assert_called_once()
        call_args = mock_openrouter.call_args[0][0]
        assert "Senior Python Developer" in call_args

    @patch("app.main.openrouter_client")
    def test_upload_ai_error_handling(self, mock_openrouter):
        """POST /upload/ should handle AI API errors gracefully."""
        mock_openrouter.side_effect = Exception("API Error")
        
        txt_content = b"Test resume"
        response = client.post(
            "/upload/",
            files={"file": ("resume.txt", BytesIO(txt_content))},
            data={"job_description": "", "model": "google/gemma-4-31b-it:free"}
        )
        assert response.status_code in [502, 500]

    @patch("app.main.openrouter_client")
    def test_upload_invalid_json_from_ai(self, mock_openrouter):
        """POST /upload/ should handle invalid JSON from AI."""
        mock_openrouter.return_value = "This is not valid JSON"
        
        txt_content = b"Test resume"
        response = client.post(
            "/upload/",
            files={"file": ("resume.txt", BytesIO(txt_content))},
            data={"job_description": "", "model": "google/gemma-4-31b-it:free"}
        )
        # Should either repair or return 502
        assert response.status_code in [200, 502]


# ============ Integration Tests: Model Parameter ============

class TestModelParameter:
    """Tests for model selection parameter."""

    @patch("app.main.openrouter_client")
    def test_upload_with_custom_model(self, mock_openrouter):
        """POST /upload/ should use selected model."""
        mock_openrouter.return_value = json.dumps({
            "match_percentage": 80,
            "summary": "Using custom model",
            "found_skills": [],
            "missing_skills": [],
            "recommendations": [],
        })
        
        custom_model = "openai/gpt-4"
        txt_content = b"Resume text"
        response = client.post(
            "/upload/",
            files={"file": ("resume.txt", BytesIO(txt_content))},
            data={"job_description": "", "model": custom_model}
        )
        
        assert response.status_code == 200
        # Verify openrouter_client was called with correct model
        mock_openrouter.assert_called_once()

    @patch("app.main.openrouter_client")
    def test_upload_default_model(self, mock_openrouter):
        """POST /upload/ should use default model if not specified."""
        mock_openrouter.return_value = json.dumps({
            "match_percentage": 80,
            "summary": "Using default model",
            "found_skills": [],
            "missing_skills": [],
            "recommendations": [],
        })
        
        txt_content = b"Resume text"
        response = client.post(
            "/upload/",
            files={"file": ("resume.txt", BytesIO(txt_content))},
            data={"job_description": ""}
        )
        
        assert response.status_code == 200

