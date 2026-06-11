"""Pytest configuration and fixtures."""

import json
import io
from pathlib import Path

import pytest


@pytest.fixture
def sample_json_response():
    """Sample AI response JSON."""
    return {
        "match_percentage": 85,
        "summary": "Strong candidate with relevant experience",
        "found_skills": ["Python", "FastAPI"],
        "missing_skills": ["Kubernetes"],
        "recommendations": ["Add certifications"],
    }


@pytest.fixture
def sample_resume_text():
    """Sample resume text content."""
    return """
    JOHN DOE
    john@example.com | (555) 123-4567

    PROFESSIONAL SUMMARY
    Senior Python Developer with 5+ years of experience in FastAPI, microservices architecture,
    and cloud deployment. Proven track record of leading high-performance development teams.

    TECHNICAL SKILLS
    - Languages: Python, JavaScript, SQL
    - Frameworks: FastAPI, Flask, Django, React
    - Cloud: AWS, Docker, Kubernetes
    - Databases: PostgreSQL, MongoDB, Redis

    WORK EXPERIENCE
    Senior Python Developer | Tech Company Inc | 2021-Present
    - Led development of microservices handling 1M+ requests/day
    - Designed and implemented FastAPI REST APIs
    - Mentored junior developers

    EDUCATION
    B.S. Computer Science | University Name | 2015-2019
    """


@pytest.fixture
def sample_pdf_bytes():
    """Minimal PDF bytes for testing."""
    # Minimal valid PDF structure
    pdf_content = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Sample Resume Text) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000273 00000 n 
0000000371 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
464
%%EOF
"""
    return pdf_content


@pytest.fixture
def job_description():
    """Sample job description."""
    return """
    Senior Python Developer
    
    We are looking for an experienced Python developer to join our team.
    
    Required Skills:
    - 5+ years of Python experience
    - FastAPI or similar framework
    - Docker and Kubernetes
    - Microservices architecture
    - AWS
    - PostgreSQL
    
    Nice to Have:
    - Go programming language
    - CI/CD expertise
    - Open source contributions
    """


@pytest.fixture
def test_data_dir():
    """Path to test data directory."""
    return Path(__file__).parent


@pytest.fixture(autouse=True)
def mock_api_key(monkeypatch):
    """Mock OPENROUTER_API_KEY environment variable."""
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-api-key-12345")
