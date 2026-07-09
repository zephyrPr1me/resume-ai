import asyncio
import httpx
from io import BytesIO

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.config import logger
from app.ai import call_openrouter_api, call_match_api, call_optimization_api
from app.schemas import AnalysisResponse, JobMatchResult, ProfileImprovementResult
from app.text_extractor import get_stream_extractor

UPLOAD_TIMEOUT = 180

router = APIRouter()


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "resume-ai-insight",
        "version": "0.1.0",
    }


@router.post("/analyze-resume/", response_model=AnalysisResponse)
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: str = Form("", description="Job description to compare against"),
    model: str = Form(
        "google/gemma-4-31b-it:free", description="AI model to use for analysis"
    ),
):
    """Upload and analyze a resume file (PDF/TXT)."""
    try:
        async with asyncio.timeout(UPLOAD_TIMEOUT):
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

            analysis = await call_openrouter_api(text, job_description, model=model)
            return AnalysisResponse(filename=file.filename, analysis=analysis)
    except asyncio.TimeoutError:
        logger.warning("Upload request timed out after %s seconds", UPLOAD_TIMEOUT)
        raise HTTPException(
            status_code=504,
            detail=f"Request timed out after {UPLOAD_TIMEOUT} seconds. Please try again.",
        )
    except asyncio.CancelledError:
        logger.info("Upload request was cancelled")
        raise HTTPException(status_code=499, detail="Request was cancelled.")
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error in upload: %s", exc)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/analyze-resume-text/", response_model=AnalysisResponse)
async def analyze_resume_text(
    body: dict,
    model: str = "google/gemma-4-31b-it:free",
):
    """Analyze a resume from plain text (no file upload)."""
    resume_text = body.get("resumeText", "")
    job_text = body.get("jobText", "")

    if not resume_text.strip():
        raise HTTPException(status_code=422, detail="Resume text cannot be empty")

    try:
        analysis = await call_openrouter_api(
            resume_text,
            job_description=job_text,
            model=model,
        )
        return AnalysisResponse(filename="resume.txt", analysis=analysis)
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error in text analysis: %s", exc)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/match-job/", response_model=JobMatchResult)
async def match_job(body: dict):
    """Compare a resume against a job description."""
    resume_text = body.get("resumeText", "")
    job_text = body.get("jobText", "")

    if not resume_text.strip():
        raise HTTPException(status_code=422, detail="Resume text cannot be empty")
    if not job_text.strip():
        raise HTTPException(status_code=422, detail="Job description cannot be empty")

    try:
        result = await call_match_api(resume_text, job_text)
        return result
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error in job matching: %s", exc)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/generate-profile-recommendations/", response_model=ProfileImprovementResult)
async def generate_profile_recommendations(body: dict):
    """Generate profile optimization recommendations from resume text."""
    resume_text = body.get("resumeText", "")

    if not resume_text.strip():
        raise HTTPException(status_code=422, detail="Resume text cannot be empty")

    try:
        result = await call_optimization_api(resume_text)
        return result
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error in profile optimization: %s", exc)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/models-free/")
async def get_free_openrouter_models():
    url = "https://openrouter.ai/api/v1/models"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
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
                free_models.append(
                    {
                        "id": model.get("id"),
                        "name": model.get("name"),
                        "context_length": model.get("context_length"),
                    }
                )

        return free_models
