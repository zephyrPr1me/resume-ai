import json
import logging
import re
from io import BytesIO
from os import getenv
from typing import List, Optional

import fitz
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from google import genai
from json_repair import repair_json
from pydantic import BaseModel, Field

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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


client = genai.Client(api_key=getenv("GEMINI_API_KEY"))
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


def call_gemini_api(text_from_pdf: str, job_description: str) -> AnalysisResult:
    prompt_text = prompt_template.replace("[TEXT]", text_from_pdf).replace(
        "[JOB]", job_description or ""
    )
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt_text,
    )
    raw_text = extract_json_from_ai(response.text)
    try:
        parsed = json.loads(raw_text)
        return AnalysisResult.model_validate(parsed)
    except Exception as exc:
        logger.error("Invalid JSON from AI: %s. Response: %s", exc, response.text)
        raise ValueError("Failed to parse AI response") from exc


@app.post("/upload/", response_model=AnalysisResponse)
async def upload_file(
    file: UploadFile = File(...),
    job_description: str = Form("", description="Job description to compare against"),
):
    if file.size and file.size > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=413, detail="File too large. Maximum 5 MB allowed."
        )
    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    pdf_stream = BytesIO(pdf_bytes)
    full_text = []
    try:
        doc = fitz.open(stream=pdf_stream, filetype="pdf")
        for page in doc:
            text = page.get_text()
            if text:
                full_text.append(text)
        doc.close()
        ai_data = call_gemini_api("\n".join(full_text), job_description)
        return AnalysisResponse(filename=file.filename, analysis=ai_data)
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        logger.exception("Error processing PDF or AI call")
        raise HTTPException(status_code=500, detail="Internal server error")
