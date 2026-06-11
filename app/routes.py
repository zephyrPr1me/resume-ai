import httpx
from io import BytesIO

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.config import logger
from app.ai import call_openrouter_api
from app.schemas import AnalysisResponse
from app.text_extractor import get_stream_extractor

router = APIRouter()


@router.get("/")
async def read_root():
    return FileResponse("app/static/index.html")


@router.post("/upload/", response_model=AnalysisResponse)
async def upload_file(
    file: UploadFile = File(...),
    job_description: str = Form("", description="Job description to compare against"),
    model: str = Form(
        "google/gemma-4-31b-it:free", description="AI model to use for analysis"
    ),
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


@router.get("/models-free/")
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
                free_models.append(
                    {
                        "id": model.get("id"),
                        "name": model.get("name"),
                        "context_length": model.get("context_length"),
                    }
                )

        return free_models
