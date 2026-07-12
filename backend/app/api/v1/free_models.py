from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from json import JSONDecodeError
import httpx

router = APIRouter()

class ModelInfo(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    context_length: Optional[int] = None

@router.get("/models-free/")
async def get_free_openrouter_models():
    url = "https://openrouter.ai/api/v1/models"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            try:
                json_data = response.json()
            except JSONDecodeError:
                raise HTTPException(status_code=500, detail="API return invalid JSON data")
            data = json_data.get("data",[])
    except httpx.HTTPStatusError as e:
        #(404, 500, 429 etc...)
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Error API OpenRouter: {e.response.text}"
        )
    except httpx.RequestError as e:
       #Error with connection
        raise HTTPException(status_code=500, detail=f"Ошибка сети: {str(e)}")
    free_models = []
    for model in data:
        pricing = model.get("pricing")
        if not isinstance(pricing, dict):
            pricing = {}

        try:
            prompt_price = float(pricing.get("prompt", 1))
            completion_price = float(pricing.get("completion", 1))
        except (ValueError, TypeError):
            continue
        if prompt_price == 0.0 and completion_price == 0.0:
            free_models.append({
                "id": model.get("id"),
                "name": model.get("name"),
                "context_length": model.get("context_length"),
            })

    return free_models
