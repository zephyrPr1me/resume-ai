import json
import logging
import re
from io import BytesIO
from os import getenv
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from openrouter import OpenRouter
from json_repair import repair_json
from pydantic import BaseModel, Field
from app.text_extractor import get_stream_extractor
import httpx


load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

API_KEY = getenv("OPENROUTER_API_KEY")


class AnalysisResult(BaseModel):
    match_percentage: Optional[int] = Field(
        None,
        ge=0,
        le=100,
        description="Percentage of how well the resume matches the job requirements",
    )
    summary: str = Field(
        ..., description="Overall conclusion about the candidate in 2–3 sentences"
    )
    found_skills: List[str] = Field(
        default_factory=list, description="Skills that were successfully identified"
    )
    missing_skills: List[str] = Field(
        default_factory=list,
        description="Skills or experience missing for this position",
    )
    recommendations: List[str] = Field(
        default_factory=list,
        description="Specific steps: what to add or change in the resume",
    )


class AnalysisResponse(BaseModel):
    status: str = "success"
    filename: str
    analysis: AnalysisResult


app = FastAPI()
app.mount("/static", StaticFiles(directory="app/static"), name="static")


@app.get("/")
async def read_root():
    return FileResponse("app/static/index.html")


analysis_schema = AnalysisResult.model_json_schema()
prompt_template = f"""
Act as a professional recruiter and career coach. Analyze the provided resume text thoroughly.
If a job description is provided, compare the resume against it.
If no job description is given, perform a strong resume review based solely on the resume content.
Respond strictly in the same language as the resume.

Resume:
[TEXT]

Job description:
[JOB]

Return the response strictly as valid JSON only. Do not include any markdown, code fences, explanation, or extra text.
The output must start with '{{' and end with '}}'.
Produce every field completely and do not cut off sentences.
If there is no job description, set "match_percentage" to null.
Schema:
{json.dumps(analysis_schema, ensure_ascii=False, indent=2)}
"""


def openrouter_client(content: str, model: str = "google/gemma-4-31b-it:free"):
    with OpenRouter(api_key=API_KEY) as client:
        response = client.chat.send(
            model=model,
            messages=[{"role": "user", "content": content}],
        )
    return response.choices[0].message.content


def extract_json_from_ai(text: str) -> str:
    content = text.strip().lstrip("\ufeff\u200b")

    code_block_match = re.search(r"```(?:json)?\s*\n(.*?)\n```", content, re.DOTALL)
    if code_block_match:
        content = code_block_match.group(1).strip()

    balance = 0
    start = -1
    for i, ch in enumerate(content):
        if ch == "{":
            if start == -1:
                start = i
            balance += 1
        elif ch == "}":
            balance -= 1
            if balance == 0 and start != -1:
                content = content[start : i + 1]
                break

    try:
        json.loads(content)
        return content
    except json.JSONDecodeError:
        pass

    try:
        repaired = repair_json(content)
        json.loads(repaired)
        return repaired
    except Exception:
        return content


def call_openrouter_api(text_from_pdf: str, job_description: str, model: str = "google/gemma-4-31b-it:free") -> AnalysisResult:
    prompt_text = prompt_template.replace("[TEXT]", text_from_pdf).replace(
        "[JOB]", job_description or ""
    )
    try:
        ai_response_text = openrouter_client(prompt_text, model=model)
    except Exception as e:
        logger.error("Ошибка при вызове OpenRouter API: %s", str(e))
        raise ValueError("Не удалось получить ответ от AI сервиса") from e
    if not ai_response_text:
        raise ValueError("Empty response from AI service")
    raw_text = extract_json_from_ai(ai_response_text)
    try:
        parsed = json.loads(raw_text)
        return AnalysisResult.model_validate(parsed)
    except Exception as exc:
        logger.error("Invalid JSON from AI: %s. Response: %s", exc, ai_response_text)
        raise ValueError("Failed to parse AI response") from exc


@app.post("/upload/", response_model=AnalysisResponse)
async def upload_file(
    file: UploadFile = File(...),
    job_description: str = Form("", description="Job description to compare against"),
    model: str = Form("google/gemma-4-31b-it:free", description="AI model to use for analysis"),
):
    pdf_bytes = await file.read()
    if len(pdf_bytes) > 50 * 1024 * 1024:
        raise HTTPException(
            status_code=413, detail="File too large. Maximum 50 MB allowed."
        )
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    file_stream = BytesIO(pdf_bytes)
    try:
        extractor = get_stream_extractor(file_stream, file.filename)
        text = extractor.extract()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        logger.exception("Error processing resume file: %s", exc)
        raise HTTPException(status_code=500, detail="Internal server error")

    if not text:
        raise HTTPException(
            status_code=422,
            detail="Unable to extract text from the uploaded resume. Please upload a valid PDF or TXT file.",
        )

    analysis = call_openrouter_api(text, job_description, model=model)
    return AnalysisResponse(filename=file.filename, analysis=analysis)


@app.get("/models-free/")
def get_free_openrouter_models():
    url = "https://openrouter.ai/api/v1/models"
    with httpx.Client() as client:
        response = client.get(url)
        response.raise_for_status()
        data = response.json().get("data", [])
        
        free_models = []
        for model in data:
            pricing = model.get("pricing", {})
            try:
                prompt_price = float(pricing.get("prompt", 1))
                completion_price = float(pricing.get("completion", 1))
            except (ValueError, TypeError):
                continue
            
            if prompt_price == 0.0 and completion_price == 0.0:
                free_models.append({
                    "id": model.get("id"),
                    "name": model.get("name"),
                    "context_length": model.get("context_length")
                })
        
        return free_models

