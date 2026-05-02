from io import BytesIO
from os import getenv
from typing import List

import fitz
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from google import genai
from pydantic import BaseModel, Field

load_dotenv()


class AnalysisResult(BaseModel):
    # Match percentage (0–100)
    match_percentage: int = Field(
        ...,
        ge=0,
        le=100,
        description="Percentage of how well the resume matches the job requirements",
    )

    # Summary
    summary: str = Field(
        ..., description="Overall conclusion about the candidate in 2–3 sentences"
    )

    # List of key skills found in the resume that are relevant to the job opening
    found_skills: List[str] = Field(
        default_factory=list, description="Skills that were successfully identified"
    )

    # What's missing
    missing_skills: List[str] = Field(
        default_factory=list,
        description="Skills or experience missing for this position",
    )

    # Improvement tips
    recommendations: List[str] = Field(
        default_factory=list,
        description="Specific steps: what to add or change in the resume",
    )


class AnalysisResponse(BaseModel):
    # Response wrapper to add metadata
    status: str = "success"
    filename: str
    analysis: AnalysisResult


app = FastAPI()
app.mount("/static", StaticFiles(directory="app/static"), name="static")


@app.get("/")
async def read_root():
    return FileResponse("app/static/index.html")


client = genai.Client(api_key=getenv("GEMINI_API_KEY"))
prompt = """
Act as a professional recruiter and career coach. Analyze the provided resume text thoroughly. Respond strictly in the following format, using the exact headings in English. Write all analysis in the same language as the resume.

Key Points:
- Identify three actionable, specific highlights from the resume (e.g., quantifiable achievements, rare skills, unique experience). Explain why each is valuable for employers.

Strengths:
- List the main strengths of the resume (e.g., strong formatting, relevant keywords, clear career progression, measurable results). Provide concrete examples from the text.

Weaknesses:
- Identify specific weaknesses (e.g., employment gaps, lack of keywords, vague descriptions, overused buzzwords, missing metrics). Refer to actual sentences or sections.

What needs improvement:
- Give 3–5 concrete, prioritized suggestions to make the resume more competitive. For each suggestion, explain the problem and how to fix it (e.g., “Add numbers to the project description…”, “Rephrase the summary to include…”).

Be concise, practical, and avoid generic statements. Use bullet points within each section.

Resume:
[TEXT]
"""


@app.post("/upload/", response_model=AnalysisResponse)
async def upload_file(
    file: UploadFile = File(...),
    job_description: str = Field(..., description="Job description to compare against"),
):
    pdf_bytes = await file.read()
    if not pdf_bytes:
        return {"error": "file is empty"}
    pdf_stream = BytesIO(pdf_bytes)
    full_text = []
    try:
        doc = fitz.open(stream=pdf_stream, filetype="pdf")
        for page in doc:
            text = page.get_text()
            if text:
                full_text.append(text)
        doc.close()
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt.replace("[TEXT]", " ".join(full_text)),
        )
    except Exception as e:
        return {"error": f"Error while working with file: {str(e)}"}
    return {"response": response.text}
