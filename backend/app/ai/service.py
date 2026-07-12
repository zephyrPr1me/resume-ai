from typing import Type, TypeVar
from pydantic import BaseModel
from config import logger
from schemas import AnalysisResult, JobMatchResult, ProfileImprovementResult
from ai.client import call_llm
from ai.utils import extract_and_repair_json
from ai.prompts import get_analysis_prompt, get_match_prompt, get_optimization_prompt

T = TypeVar("T", bound=BaseModel)

async def _execute_ai_request(
    prompt: str,
    response_model: Type[T],
    model: str = "google/gemma-4-31b-it:free"
) -> T:
    """
    Универсальный пайплайн: Промпт -> Вызов LLM -> Извлечение JSON -> Валидация Pydantic.
    Устраняет дублирование кода между разными эндпоинтами.
    """
    try:
        ai_response_text = await call_llm(prompt, model=model)
    except TimeoutError as e:
        raise ValueError("AI service request timed out. Please try again.") from e
    except Exception as e:
        raise ValueError("Failed to get response from AI service") from e

    if not ai_response_text:
        raise ValueError("Empty response from AI service")

    raw_text = extract_and_repair_json(ai_response_text)

    try:
        import json
        parsed_dict = json.loads(raw_text)
        return response_model.model_validate(parsed_dict)
    except Exception as exc:
        logger.error("Invalid JSON from AI. Error: %s. Raw response: %s", exc, ai_response_text)
        raise ValueError("Failed to parse and validate AI response") from exc



async def analyze_resume(resume_text: str, job_description: str = "") -> AnalysisResult:
    prompt = get_analysis_prompt(resume_text, job_description)
    return await _execute_ai_request(prompt, AnalysisResult)

async def match_resume_to_job(resume_text: str, job_text: str) -> JobMatchResult:
    prompt = get_match_prompt(resume_text, job_text)
    return await _execute_ai_request(prompt, JobMatchResult)

async def optimize_profile(resume_text: str) -> ProfileImprovementResult:
    prompt = get_optimization_prompt(resume_text)
    return await _execute_ai_request(prompt, ProfileImprovementResult)
