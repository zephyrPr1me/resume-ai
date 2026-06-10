import json

from fastapi.testclient import TestClient
from app.main import app
from pathlib import Path

# client = TestClient(app)
BASE_DIR = Path(__file__).parent
FILE_PATH = BASE_DIR / "example.pdf"
client = TestClient(app)


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "<html" in response.text.lower()


def test_upload_endpoint(monkeypatch):
    def fake_openrouter_client(content: str) -> str:
        return json.dumps(
            {
                "match_percentage": None,
                "summary": "This resume presents a strong candidate.",
                "found_skills": [],
                "missing_skills": [],
                "recommendations": [],
            }
        )

    monkeypatch.setattr("app.main.openrouter_client", fake_openrouter_client)

    with open(FILE_PATH, "rb") as f:
        response = client.post("/upload/", files={"file": f})
    assert response.status_code == 200
    assert (
        response.json()["analysis"]["summary"]
        == "This resume presents a strong candidate."
    )
