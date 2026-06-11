import asyncio
import json
import re
from typing import Optional

from openrouter import OpenRouter
from json_repair import repair_json

from app.config import API_KEY, logger
from app.schemas import AnalysisResult

# Timeout for OpenRouter API calls in seconds
OPENROUTER_TIMEOUT = 120

analysis_schema = AnalysisResult.model_json_schema()
PROMPT_TEMPLATE = """Act as a professional recruiter and career coach. Analyze the provided resume text thoroughly.
If a job description is provided, compare the resume against it.
If no job description is given, perform a strong resume review based solely on the resume content.
Respond strictly in the same language as the resume.

Resume:
{text}

Job description:
{job}

Return the response strictly as valid JSON only. Do not include any markdown, code fences, explanation, or extra text.
The output must start with '{{' and end with '}}'.
Produce every field completely and do not cut off sentences.
If there is no job description, set "match_percentage" to null.

Schema:
{schema}
"""


async def openrouter_client(
    content: str,
    model: str = "google/gemma-4-31b-it:free",
    timeout: Optional[float] = OPENROUTER_TIMEOUT,
):
    """
    Call OpenRouter API with timeout support.


    Args:
        content: Prompt text to send
        model: Model ID to use
        timeout: Request timeout in seconds


    Raises:
        TimeoutError: If request exceeds timeout
        ValueError: If response is empty
        Exception: For other API errors
    """
    try:
        async with OpenRouter(api_key=API_KEY) as client:
            if timeout:
                async with asyncio.timeout(timeout):
                    response = await client.chat.send_async(
                        model=model,
                        messages=[{"role": "user", "content": content}],
                        response_format={
                            "type": "json_schema",
                            "json_schema": {
                                "name": "AnalysisResult",
                                "schema": analysis_schema,
                                "strict": True,
                            },
                        },
                    )
            else:
                response = await client.chat.send_async(
                    model=model,
                    messages=[{"role": "user", "content": content}],
                    response_format={"type": "json_schema"},
                )
        ai_response_text = response.choices[0].message.content
        if not ai_response_text or not isinstance(ai_response_text, str):
            raise ValueError("Empty response from AI service")
    except asyncio.TimeoutError:
        raise TimeoutError(f"OpenRouter API request timed out after {timeout} seconds")
    except TimeoutError:
        logger.error("OpenRouter API timeout after %s seconds", timeout)
        raise ValueError("AI service request timed out. Please try again.")
    except Exception as e:
        logger.error("Error calling OpenRouter API: %s", str(e))
        raise


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


async def call_openrouter_api(
    text_from_pdf: str, job_description: str, model: str = "google/gemma-4-31b-it:free"
) -> AnalysisResult:
    prompt_text = PROMPT_TEMPLATE.format(
        text=text_from_pdf,
        job=job_description or "",
        schema=json.dumps(analysis_schema, ensure_ascii=False, indent=2),
    )
    try:
        ai_response_text = await openrouter_client(prompt_text, model=model)
    except TimeoutError as e:
        logger.error("OpenRouter API timeout: %s", str(e))
        raise ValueError("AI service request timed out. Please try again.") from e
    except Exception as e:
        logger.error("Error calling OpenRouter API: %s", str(e))
        raise ValueError("Failed to call AI service") from e
    if not ai_response_text:
        raise ValueError("Empty response from AI service")
    raw_text = extract_json_from_ai(ai_response_text)
    try:
        parsed = json.loads(raw_text)
        return AnalysisResult.model_validate(parsed)
    except Exception as exc:
        logger.error("Invalid JSON from AI: %s. Response: %s", exc, ai_response_text)
        raise ValueError("Failed to parse AI response") from exc
