import asyncio
from typing import Optional
from openrouter import OpenRouter
from config import API_KEY, logger

OPENROUTER_TIMEOUT = 120

_client: Optional[OpenRouter] = None

def get_client() -> OpenRouter:
    global _client
    if _client is None:
        _client = OpenRouter(api_key=API_KEY)
    return _client

async def call_llm(
    content: str,
    model: str = "google/gemma-4-31b-it:free",
    timeout: float = OPENROUTER_TIMEOUT,
) -> str:
    """Univercal function for call LLM"""
    client = get_client()
    try:
        response = await asyncio.wait_for(
            client.chat.send_async(
                model=model,
                messages=[{"role": "user", "content": content}],
            ),
            timeout=timeout
        )
        return response.choices[0].message.content
    except asyncio.TimeoutError:
        logger.error("OpenRouter API timed out after %s seconds", timeout)
        raise TimeoutError(f"AI service request timed out after {timeout} seconds")
    except Exception as e:
        logger.error("OpenRouter API error: %s", str(e))
        raise RuntimeError(f"Failed to get response from AI service: {e}") from e
