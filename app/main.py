from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.ai import call_openrouter_api, extract_json_from_ai, openrouter_client  # noqa: F401
from app.routes import router
from app.schemas import AnalysisResult  # noqa: F401

app = FastAPI()
app.mount("/static", StaticFiles(directory="app/static"), name="static")
app.mount("/assets", StaticFiles(directory="assets"), name="assets")
app.include_router(router)
