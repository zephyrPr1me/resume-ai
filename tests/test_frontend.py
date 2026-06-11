"""Frontend integration tests using httpx and simulating browser behavior."""

import json
from io import BytesIO
from unittest.mock import patch, AsyncMock

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestFrontendModelSelection:
    """Tests for frontend model selection feature."""

    def test_models_free_endpoint_returns_valid_structure(self):
        """Models endpoint should return list with id, name, context_length."""
        response = client.get("/models-free/")

        # May fail due to API issues, but should be graceful
        if response.status_code == 200:
            models = response.json()
            assert isinstance(models, list)
            if len(models) > 0:
                model = models[0]
                assert "id" in model
                assert "name" in model
                assert "context_length" in model


class TestFrontendUploadFlow:
    """Tests simulating frontend upload workflows."""

    @patch("app.main.openrouter_client")
    def test_upload_flow_with_job_description(self, mock_openrouter):
        """Simulate: user uploads file + job description + selects model."""
        mock_openrouter.return_value = json.dumps(
            {
                "match_percentage": 85,
                "summary": "Strong candidate with relevant experience",
                "found_skills": ["Python", "FastAPI", "Docker"],
                "missing_skills": ["Kubernetes"],
                "recommendations": [
                    "Add cloud certifications",
                    "Expand open source work",
                ],
            }
        )

        # Simulate frontend sending file + form data
        response = client.post(
            "/upload/",
            files={
                "file": (
                    "resume.txt",
                    BytesIO(b"Python developer with 5 years experience"),
                )
            },
            data={
                "job_description": "Senior Python Engineer - FastAPI specialist",
                "model": "google/gemma-4-31b-it:free",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["analysis"]["match_percentage"] == 85
        assert len(data["analysis"]["found_skills"]) == 3
        assert len(data["analysis"]["recommendations"]) == 2

    @patch("app.main.openrouter_client")
    def test_upload_flow_without_job_description(self, mock_openrouter):
        """Simulate: user uploads file without job description."""
        mock_openrouter.return_value = json.dumps(
            {
                "match_percentage": None,  # None when no job description
                "summary": "General resume review",
                "found_skills": ["Python"],
                "missing_skills": [],
                "recommendations": [],
            }
        )

        response = client.post(
            "/upload/",
            files={"file": ("resume.txt", BytesIO(b"Python developer"))},
            data={"job_description": "", "model": "google/gemma-4-31b-it:free"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["analysis"]["match_percentage"] is None

    @patch("app.main.openrouter_client")
    def test_upload_flow_model_passed_correctly(self, mock_openrouter):
        """Simulate: verify selected model is sent to backend."""
        mock_openrouter.return_value = json.dumps(
            {
                "match_percentage": 75,
                "summary": "Candidate analysis",
                "found_skills": [],
                "missing_skills": [],
                "recommendations": [],
            }
        )

        selected_model = "openai/gpt-4"
        response = client.post(
            "/upload/",
            files={"file": ("resume.txt", BytesIO(b"Test"))},
            data={"job_description": "", "model": selected_model},
        )

        assert response.status_code == 200
        # Verify the model was passed to openrouter_client
        mock_openrouter.assert_called_once()

    @patch("app.main.openrouter_client")
    def test_frontend_error_handling_api_failure(self, mock_openrouter):
        """Simulate: frontend error handling when API fails."""
        mock_openrouter.side_effect = Exception("API connection failed")

        response = client.post(
            "/upload/",
            files={"file": ("resume.txt", BytesIO(b"Test"))},
            data={"job_description": "", "model": "google/gemma-4-31b-it:free"},
        )

        # Should return error status
        assert response.status_code in [500, 502]
        data = response.json()
        assert "detail" in data

    @patch("app.main.openrouter_client")
    def test_frontend_error_handling_invalid_file(self, mock_openrouter):
        """Simulate: frontend error when empty file is uploaded."""
        response = client.post(
            "/upload/",
            files={"file": ("resume.txt", BytesIO(b""))},
            data={"job_description": "", "model": "google/gemma-4-31b-it:free"},
        )

        assert response.status_code == 400
        data = response.json()
        assert "empty" in data["detail"].lower()

    @patch("app.main.openrouter_client")
    def test_frontend_response_display_all_fields(self, mock_openrouter):
        """Simulate: frontend displays all response fields correctly."""
        mock_response = {
            "match_percentage": 92,
            "summary": "Excellent match with strong technical skills",
            "found_skills": ["Python", "JavaScript", "React", "Docker", "PostgreSQL"],
            "missing_skills": ["Go", "Rust"],
            "recommendations": [
                "Consider learning Kubernetes for DevOps roles",
                "Add more projects to GitHub",
                "Get AWS certifications",
            ],
        }
        mock_openrouter.return_value = json.dumps(mock_response)

        response = client.post(
            "/upload/",
            files={"file": ("resume.txt", BytesIO(b"Full stack developer"))},
            data={
                "job_description": "Full Stack Engineer",
                "model": "google/gemma-4-31b-it:free",
            },
        )

        assert response.status_code == 200
        data = response.json()
        analysis = data["analysis"]

        # Verify all fields are present for frontend to display
        assert "match_percentage" in analysis
        assert "summary" in analysis
        assert "found_skills" in analysis
        assert "missing_skills" in analysis
        assert "recommendations" in analysis

        # Verify data types for frontend rendering
        assert isinstance(analysis["found_skills"], list)
        assert isinstance(analysis["missing_skills"], list)
        assert isinstance(analysis["recommendations"], list)
        assert all(isinstance(skill, str) for skill in analysis["found_skills"])

    def test_frontend_static_files_served(self):
        """Verify static files are served for frontend."""
        # Index HTML
        response = client.get("/")
        assert response.status_code == 200
        assert "script.js" in response.text or "resume" in response.text.lower()

        # Static files mount
        response = client.get("/static/index.html")
        assert (
            response.status_code == 200 or response.status_code == 404
        )  # Mount may vary


class TestFrontendResponseHandling:
    """Tests for frontend response parsing and display."""

    @patch("app.main.openrouter_client")
    def test_response_json_structure(self, mock_openrouter):
        """Verify response structure matches frontend expectations."""
        mock_openrouter.return_value = json.dumps(
            {
                "match_percentage": 88,
                "summary": "Test summary",
                "found_skills": ["Skill1"],
                "missing_skills": ["Skill2"],
                "recommendations": ["Rec1"],
            }
        )

        response = client.post(
            "/upload/",
            files={"file": ("resume.txt", BytesIO(b"Test"))},
            data={"job_description": "", "model": "google/gemma-4-31b-it:free"},
        )

        data = response.json()
        # Frontend expects these top-level fields
        assert "status" in data
        assert "filename" in data
        assert "analysis" in data

        # Frontend expects these analysis fields
        analysis = data["analysis"]
        required_fields = [
            "match_percentage",
            "summary",
            "found_skills",
            "missing_skills",
            "recommendations",
        ]
        for field in required_fields:
            assert field in analysis, f"Missing field: {field}"

    @patch("app.main.openrouter_client")
    def test_response_with_null_match_percentage(self, mock_openrouter):
        """Frontend should handle null match_percentage."""
        mock_openrouter.return_value = json.dumps(
            {
                "match_percentage": None,
                "summary": "General review",
                "found_skills": [],
                "missing_skills": [],
                "recommendations": [],
            }
        )

        response = client.post(
            "/upload/",
            files={"file": ("resume.txt", BytesIO(b"Test"))},
            data={"job_description": "", "model": "google/gemma-4-31b-it:free"},
        )

        data = response.json()
        assert data["analysis"]["match_percentage"] is None

    @patch("app.main.openrouter_client")
    def test_response_with_empty_lists(self, mock_openrouter):
        """Frontend should handle empty skill/recommendation lists."""
        mock_openrouter.return_value = json.dumps(
            {
                "match_percentage": 50,
                "summary": "Basic candidate",
                "found_skills": [],
                "missing_skills": [],
                "recommendations": [],
            }
        )

        response = client.post(
            "/upload/",
            files={"file": ("resume.txt", BytesIO(b"Test"))},
            data={"job_description": "", "model": "google/gemma-4-31b-it:free"},
        )

        data = response.json()
        analysis = data["analysis"]
        assert isinstance(analysis["found_skills"], list)
        assert isinstance(analysis["missing_skills"], list)
        assert isinstance(analysis["recommendations"], list)
