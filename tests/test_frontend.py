"""Frontend integration tests using httpx and simulating browser behavior."""

import json
from io import BytesIO
from unittest.mock import patch, AsyncMock

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import AnalysisResult, JobMatchResult, ProfileImprovementResult

client = TestClient(app)


class TestFrontendModelSelection:
    def test_models_free_endpoint_returns_valid_structure(self):
        response = client.get("/api/models-free/")
        if response.status_code == 200:
            models = response.json()
            assert isinstance(models, list)
            if len(models) > 0:
                model = models[0]
                assert "id" in model
                assert "name" in model
                assert "context_length" in model


class TestFrontendAnalyzeFlow:
    @patch("app.routes.call_openrouter_api")
    def test_analyze_text_success(self, mock_analysis):
        mock_analysis.return_value = AnalysisResult(
            score=85,
            extractedSkills=["Python", "FastAPI", "Docker"],
            strongPoints=["Strong backend skills"],
            gapsAndWeaknesses=["No cloud experience"],
            atsChecklist=[
                {"item": "Has contact info", "passed": True},
                {"item": "Has skills section", "passed": True},
            ],
        )

        response = client.post(
            "/api/analyze-resume-text/",
            json={"resumeText": "Python developer with 5 years experience"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        analysis = data["analysis"]
        assert analysis["score"] == 85
        assert len(analysis["extractedSkills"]) == 3
        assert len(analysis["atsChecklist"]) == 2

    @patch("app.routes.call_openrouter_api")
    def test_analyze_text_with_job_description(self, mock_analysis):
        mock_analysis.return_value = AnalysisResult(
            score=92,
            extractedSkills=["Python", "FastAPI"],
            strongPoints=[],
            gapsAndWeaknesses=[],
            atsChecklist=[],
        )

        response = client.post(
            "/api/analyze-resume-text/",
            json={
                "resumeText": "Python developer",
                "jobText": "Senior Python Engineer - FastAPI specialist",
            },
        )

        assert response.status_code == 200

    def test_analyze_text_empty(self):
        response = client.post(
            "/api/analyze-resume-text/",
            json={"resumeText": ""},
        )
        assert response.status_code == 422

    @patch("app.routes.call_openrouter_api")
    def test_analyze_error_handling(self, mock_analysis):
        mock_analysis.side_effect = ValueError("AI service failed")

        response = client.post(
            "/api/analyze-resume-text/",
            json={"resumeText": "Test resume"},
        )
        assert response.status_code == 502
        data = response.json()
        assert "detail" in data


class TestFrontendMatchFlow:
    @patch("app.routes.call_match_api")
    def test_match_job_success(self, mock_match):
        mock_match.return_value = JobMatchResult(
            matchScore=88,
            matchedSkills=["Python", "JavaScript", "React", "Docker"],
            missingSkills=["Go", "Rust"],
            recommendations="Consider learning Kubernetes for DevOps roles",
        )

        response = client.post(
            "/api/match-job/",
            json={
                "resumeText": "Full stack developer with Python and React",
                "jobText": "Full Stack Engineer with Go and Rust experience",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["matchScore"] == 88
        assert len(data["matchedSkills"]) == 4
        assert len(data["missingSkills"]) == 2
        assert isinstance(data["recommendations"], str)

    def test_match_job_empty(self):
        response = client.post(
            "/api/match-job/",
            json={"resumeText": "", "jobText": ""},
        )
        assert response.status_code == 422

    def test_match_job_missing_resume(self):
        response = client.post(
            "/api/match-job/",
            json={"resumeText": "", "jobText": "Senior dev"},
        )
        assert response.status_code == 422

    @patch("app.routes.call_match_api")
    def test_match_error_handling(self, mock_match):
        mock_match.side_effect = ValueError("Match service failed")

        response = client.post(
            "/api/match-job/",
            json={
                "resumeText": "Test resume",
                "jobText": "Test job",
            },
        )
        assert response.status_code == 502


class TestFrontendOptimizationFlow:
    @patch("app.routes.call_optimization_api")
    def test_optimization_success(self, mock_opt):
        mock_opt.return_value = ProfileImprovementResult(
            atsOptimizedSummary="Experienced product manager with strong analytical skills",
            improvedBulletPoints=[
                "Increased conversion by 4.2% through checkout redesign",
                "Reduced time-to-market by 15%",
            ],
            learningPath=[
                {"skill": "Kubernetes", "importance": "High", "resources": "Official docs"},
                {"skill": "TypeScript", "importance": "Medium", "resources": "Online course"},
            ],
        )

        response = client.post(
            "/api/generate-profile-recommendations/",
            json={"resumeText": "Product manager with 5 years experience"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["atsOptimizedSummary"] != ""
        assert len(data["improvedBulletPoints"]) == 2
        assert len(data["learningPath"]) == 2
        assert "skill" in data["learningPath"][0]
        assert "importance" in data["learningPath"][0]
        assert "resources" in data["learningPath"][0]

    def test_optimization_empty(self):
        response = client.post(
            "/api/generate-profile-recommendations/",
            json={"resumeText": ""},
        )
        assert response.status_code == 422


class TestFrontendFileUploadFlow:
    @patch("app.routes.call_openrouter_api")
    def test_file_upload_analyze_with_job_description(self, mock_analysis):
        mock_analysis.return_value = AnalysisResult(
            score=85,
            extractedSkills=["Python", "FastAPI", "Docker"],
            strongPoints=[],
            gapsAndWeaknesses=[],
            atsChecklist=[],
        )

        response = client.post(
            "/api/analyze-resume/",
            files={"file": ("resume.txt", BytesIO(b"Python developer with 5 years experience"))},
            data={
                "job_description": "Senior Python Engineer - FastAPI specialist",
                "model": "google/gemma-4-31b-it:free",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["analysis"]["score"] == 85

    def test_file_upload_empty(self):
        response = client.post(
            "/api/analyze-resume/",
            files={"file": ("resume.txt", BytesIO(b""))},
        )
        assert response.status_code == 400
        data = response.json()
        assert "empty" in data["detail"].lower()


class TestFrontendResponseHandling:
    @patch("app.routes.call_openrouter_api")
    def test_analysis_response_structure(self, mock_analysis):
        mock_analysis.return_value = AnalysisResult(
            score=88,
            extractedSkills=["Skill1", "Skill2"],
            strongPoints=["Good structure"],
            gapsAndWeaknesses=["No metrics"],
            atsChecklist=[
                {"item": "Has contact", "passed": True},
                {"item": "Has achievements", "passed": False},
            ],
        )

        response = client.post(
            "/api/analyze-resume-text/",
            json={"resumeText": "Test resume content for analysis"},
        )

        data = response.json()
        assert "status" in data
        assert "filename" in data
        assert "analysis" in data

        analysis = data["analysis"]
        required_fields = [
            "score",
            "extractedSkills",
            "strongPoints",
            "gapsAndWeaknesses",
            "atsChecklist",
        ]
        for field in required_fields:
            assert field in analysis, f"Missing field: {field}"

        assert isinstance(analysis["extractedSkills"], list)
        assert isinstance(analysis["atsChecklist"], list)
        assert all(isinstance(skill, str) for skill in analysis["extractedSkills"])
        for item in analysis["atsChecklist"]:
            assert "item" in item
            assert "passed" in item

    @patch("app.routes.call_match_api")
    def test_match_response_structure(self, mock_match):
        mock_match.return_value = JobMatchResult(
            matchScore=75,
            matchedSkills=["Python"],
            missingSkills=["Go"],
            recommendations="Learn Go",
        )

        response = client.post(
            "/api/match-job/",
            json={
                "resumeText": "Python dev",
                "jobText": "Go dev needed",
            },
        )

        data = response.json()
        assert "matchScore" in data
        assert "matchedSkills" in data
        assert "missingSkills" in data
        assert "recommendations" in data

    @patch("app.routes.call_optimization_api")
    def test_optimization_response_structure(self, mock_opt):
        mock_opt.return_value = ProfileImprovementResult(
            atsOptimizedSummary="Test summary",
            improvedBulletPoints=["Point 1"],
            learningPath=[{"skill": "S1", "importance": "High", "resources": "R1"}],
        )

        response = client.post(
            "/api/generate-profile-recommendations/",
            json={"resumeText": "Test resume"},
        )

        data = response.json()
        assert "atsOptimizedSummary" in data
        assert "improvedBulletPoints" in data
        assert "learningPath" in data
        assert isinstance(data["improvedBulletPoints"], list)
        assert isinstance(data["learningPath"], list)
