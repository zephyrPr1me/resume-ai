import json
import io
from unittest.mock import patch, MagicMock
from io import BytesIO
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.ai import extract_json_from_ai, call_openrouter_api, openrouter_client
from app.schemas import AnalysisResult, JobMatchResult, ProfileImprovementResult
from app.text_extractor import (
    get_stream_extractor,
    PdfExtractor,
    TxtExtractor,
)

BASE_DIR = Path(__file__).parent
FILE_PATH = BASE_DIR / "example.pdf"
client = TestClient(app)


class TestExtractJsonFromAi:
    def test_extract_json_valid_json(self):
        text = '{"key": "value"}'
        result = extract_json_from_ai(text)
        assert json.loads(result) == {"key": "value"}

    def test_extract_json_with_code_block(self):
        text = '```json\n{"key": "value"}\n```'
        result = extract_json_from_ai(text)
        assert json.loads(result) == {"key": "value"}

    def test_extract_json_with_extra_text(self):
        text = 'Here is the JSON: {"key": "value"} some text after'
        result = extract_json_from_ai(text)
        assert json.loads(result) == {"key": "value"}

    def test_extract_json_with_bom(self):
        text = '\ufeff{"key": "value"}'
        result = extract_json_from_ai(text)
        assert json.loads(result) == {"key": "value"}

    def test_extract_json_nested(self):
        text = '{"outer": {"inner": [1, 2, 3]}}'
        result = extract_json_from_ai(text)
        assert json.loads(result) == {"outer": {"inner": [1, 2, 3]}}

    def test_extract_json_with_special_chars(self):
        text = '{"message": "Hello\\nWorld", "emoji": "🚀"}'
        result = extract_json_from_ai(text)
        data = json.loads(result)
        assert "Hello" in data["message"]


class TestTextExtractor:
    def test_txt_extractor(self):
        content = "This is a test resume\nWith multiple lines\n"
        stream = BytesIO(content.encode("utf-8"))
        extractor = TxtExtractor(stream, "resume.txt")
        result = extractor.extract()
        assert result == content

    def test_get_stream_extractor_txt(self):
        stream = BytesIO(b"test")
        extractor = get_stream_extractor(stream, "resume.txt")
        assert isinstance(extractor, TxtExtractor)

    def test_get_stream_extractor_pdf(self):
        stream = BytesIO(b"test")
        extractor = get_stream_extractor(stream, "resume.pdf")
        assert isinstance(extractor, PdfExtractor)

    def test_get_stream_extractor_unsupported(self):
        stream = BytesIO(b"test")
        with pytest.raises(ValueError, match="Unsupported format"):
            get_stream_extractor(stream, "resume.docx")

    def test_text_extractor_file_too_large(self):
        stream = MagicMock(spec=io.BytesIO)
        stream.seek = MagicMock()
        stream.tell = MagicMock(return_value=51 * 1024 * 1024)
        with pytest.raises(ValueError, match="too large to process"):
            TxtExtractor(stream, "huge_file.txt")

    def test_text_extractor_invalid_stream(self):
        with pytest.raises(TypeError, match="file-like object"):
            TxtExtractor("not a file", "resume.txt")


class TestSchemas:
    def test_analysis_result_valid(self):
        result = AnalysisResult(
            score=85,
            extractedSkills=["Python", "FastAPI"],
            strongPoints=["Clean code", "Good architecture"],
            gapsAndWeaknesses=["No tests"],
            atsChecklist=[
                {"item": "Has contact info", "passed": True},
                {"item": "Has skills section", "passed": False},
            ],
        )
        assert result.score == 85
        assert len(result.extractedSkills) == 2
        assert len(result.atsChecklist) == 2

    def test_analysis_result_score_bounds(self):
        with pytest.raises(ValueError):
            AnalysisResult(score=150, extractedSkills=[])
        with pytest.raises(ValueError):
            AnalysisResult(score=-10, extractedSkills=[])

    def test_job_match_result_valid(self):
        result = JobMatchResult(
            matchScore=78,
            matchedSkills=["React", "Python"],
            missingSkills=["Docker"],
            recommendations="Learn Docker",
        )
        assert result.matchScore == 78
        assert result.recommendations == "Learn Docker"

    def test_profile_improvement_result_valid(self):
        result = ProfileImprovementResult(
            atsOptimizedSummary="Experienced developer",
            improvedBulletPoints=["Built X", "Improved Y"],
            learningPath=[
                {"skill": "Kubernetes", "importance": "High", "resources": "Docs"}
            ],
        )
        assert result.atsOptimizedSummary == "Experienced developer"
        assert len(result.learningPath) == 1


class TestHttpEndpoints:
    def test_health(self):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "resume-ai-insight"

    def test_analyze_resume_text_empty(self):
        response = client.post(
            "/api/analyze-resume-text/",
            json={"resumeText": ""},
        )
        assert response.status_code == 422

    def test_analyze_resume_text_no_body(self):
        response = client.post(
            "/api/analyze-resume-text/",
            json={},
        )
        assert response.status_code == 422

    @patch("app.routes.call_openrouter_api")
    def test_analyze_resume_text_success(self, mock_analysis):
        mock_analysis.return_value = AnalysisResult(
            score=85,
            extractedSkills=["Python", "FastAPI"],
            strongPoints=["Strong backend skills"],
            gapsAndWeaknesses=["No cloud experience"],
            atsChecklist=[{"item": "Has contact", "passed": True}],
        )
        response = client.post(
            "/api/analyze-resume-text/",
            json={"resumeText": "Python developer with 5 years experience"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["analysis"]["score"] == 85
        assert data["analysis"]["extractedSkills"] == ["Python", "FastAPI"]

    def test_match_job_empty(self):
        response = client.post(
            "/api/match-job/",
            json={"resumeText": "", "jobText": ""},
        )
        assert response.status_code == 422

    @patch("app.routes.call_match_api")
    def test_match_job_success(self, mock_match):
        mock_match.return_value = JobMatchResult(
            matchScore=92,
            matchedSkills=["Python", "React"],
            missingSkills=["Docker"],
            recommendations="Great fit, but learn Docker",
        )
        response = client.post(
            "/api/match-job/",
            json={
                "resumeText": "Python developer with React",
                "jobText": "Looking for Python/React dev with Docker",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["matchScore"] == 92
        assert "Docker" in data["missingSkills"]

    def test_optimization_empty(self):
        response = client.post(
            "/api/generate-profile-recommendations/",
            json={"resumeText": ""},
        )
        assert response.status_code == 422

    @patch("app.routes.call_optimization_api")
    def test_optimization_success(self, mock_opt):
        mock_opt.return_value = ProfileImprovementResult(
            atsOptimizedSummary="Strong candidate",
            improvedBulletPoints=["Increased revenue by 20%"],
            learningPath=[
                {"skill": "Kubernetes", "importance": "High", "resources": "Docs"}
            ],
        )
        response = client.post(
            "/api/generate-profile-recommendations/",
            json={"resumeText": "Product manager with 5 years experience"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["atsOptimizedSummary"] == "Strong candidate"
        assert len(data["improvedBulletPoints"]) == 1
        assert len(data["learningPath"]) == 1

    def test_upload_empty_file(self):
        response = client.post(
            "/api/analyze-resume/",
            files={"file": ("empty.pdf", BytesIO(b""))},
        )
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()

    def test_upload_file_too_large(self):
        large_data = b"x" * (51 * 1024 * 1024)
        response = client.post(
            "/api/analyze-resume/",
            files={"file": ("large.pdf", BytesIO(large_data))},
        )
        assert response.status_code == 413

    def test_upload_without_file(self):
        response = client.post(
            "/api/analyze-resume/",
            data={"job_description": "Test"},
        )
        assert response.status_code == 422

    @patch("app.routes.call_openrouter_api")
    def test_file_upload_ai_error_handling(self, mock_analysis):
        mock_analysis.side_effect = ValueError("AI service error")

        txt_content = b"Test resume"
        response = client.post(
            "/api/analyze-resume/",
            files={"file": ("resume.txt", BytesIO(txt_content))},
            data={"job_description": "", "model": "google/gemma-4-31b-it:free"},
        )
        assert response.status_code == 502
