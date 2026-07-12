import asyncio
import json
import re
from typing import Optional

from openrouter import OpenRouter
from json_repair import repair_json

from app.config import API_KEY, logger
from app.schemas import AnalysisResult, JobMatchResult, ProfileImprovementResult

OPENROUTER_TIMEOUT = 120

analysis_schema = AnalysisResult.model_json_schema()
match_schema = JobMatchResult.model_json_schema()
optimization_schema = ProfileImprovementResult.model_json_schema()

analysis_prompt_template = f"""
Act as a professional recruiter and career coach. Analyze the provided resume text thoroughly.
If a job description is provided, evaluate the resume against it.
If no job description is given, perform a general resume review.
Respond strictly in the same language as the resume.

<resume>
{{RESUME_PLACEHOLDER}}
</resume>

<job_description>
{{JOB_PLACEHOLDER}}
</job_description>

Return the response strictly as valid JSON only. Do not include any markdown, code fences, explanation, or extra text.
The output must start with '{{' and end with '}}'.
Produce every field completely and do not cut off sentences.

Schema:
{json.dumps(analysis_schema, ensure_ascii=False, indent=2)}
"""

match_prompt_template = f"""
Act as a professional recruiter. Compare the resume against the job description and calculate a match score.
Respond strictly in the same language as the resume.

<resume>
{{RESUME_PLACEHOLDER}}
</resume>

<job_description>
{{JOB_PLACEHOLDER}}
</job_description>

Return the response strictly as valid JSON only. Do not include any markdown, code fences, explanation, or extra text.
The output must start with '{{' and end with '}}'.

Schema:
{json.dumps(match_schema, ensure_ascii=False, indent=2)}
"""

optimization_prompt_template = f"""
Act as a senior career coach and resume writer. Based on the resume text, generate:
1. An ATS-optimized summary (2-3 sentences with keywords)
2. Improved bullet points for the experience section (quantified achievements)
3. A personalized learning path to fill skill gaps
Respond strictly in the same language as the resume.

<resume>
{{RESUME_PLACEHOLDER}}
</resume>

Return the response strictly as valid JSON only. Do not include any markdown, code fences, explanation, or extra text.
The output must start with '{{' and end with '}}'.

Schema:
{json.dumps(optimization_schema, ensure_ascii=False, indent=2)}
"""


async def openrouter_client(
    content: str,
    model: str = "google/gemma-4-31b-it:free",
    timeout: Optional[float] = OPENROUTER_TIMEOUT,
):
    try:
        async with OpenRouter(api_key=API_KEY) as client:
            response = await client.chat.send_async(
                model=model,
                messages=[{"role": "user", "content": content}],
            )
        return response.choices[0].message.content
    except asyncio.TimeoutError:
        raise TimeoutError(f"OpenRouter API request timed out after {timeout} seconds")
    except TimeoutError:
        raise
    except Exception as e:
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
    text_from_pdf: str,
    job_description: str,
    model: str = "google/gemma-4-31b-it:free",
) -> AnalysisResult:
    prompt_text = analysis_prompt_template.replace(
        "{RESUME_PLACEHOLDER}", text_from_pdf
    ).replace("{JOB_PLACEHOLDER}", job_description or "")
    try:
        ai_response_text = await openrouter_client(prompt_text, model=model)
    except TimeoutError as e:
        logger.error("OpenRouter API timeout: %s", str(e))
        raise ValueError("AI service request timed out. Please try again.") from e
    except Exception as e:
        logger.error("Error calling OpenRouter API: %s", str(e))
        raise ValueError("Failed to get response from AI service") from e
    if not ai_response_text:
        raise ValueError("Empty response from AI service")
    raw_text = extract_json_from_ai(ai_response_text)
    try:
        parsed = json.loads(raw_text)
        return AnalysisResult.model_validate(parsed)
    except Exception as exc:
        logger.error("Invalid JSON from AI: %s. Response: %s", exc, ai_response_text)
        raise ValueError("Failed to parse AI response") from exc


async def call_match_api(
    resume_text: str,
    job_text: str,
    model: str = "google/gemma-4-31b-it:free",
) -> JobMatchResult:
    prompt_text = match_prompt_template.replace(
        "{RESUME_PLACEHOLDER}", resume_text
    ).replace("{JOB_PLACEHOLDER}", job_text)
    try:
        ai_response_text = await openrouter_client(prompt_text, model=model)
    except TimeoutError as e:
        logger.error("OpenRouter API timeout: %s", str(e))
        raise ValueError("AI service request timed out. Please try again.") from e
    except Exception as e:
        logger.error("Error calling OpenRouter API: %s", str(e))
        raise ValueError("Failed to get response from AI service") from e
    if not ai_response_text:
        raise ValueError("Empty response from AI service")
    raw_text = extract_json_from_ai(ai_response_text)
    try:
        parsed = json.loads(raw_text)
        return JobMatchResult.model_validate(parsed)
    except Exception as exc:
        logger.error("Invalid JSON from AI: %s. Response: %s", exc, ai_response_text)
        raise ValueError("Failed to parse AI response") from exc


async def call_optimization_api(
    resume_text: str,
    model: str = "google/gemma-4-31b-it:free",
) -> ProfileImprovementResult:
    prompt_text = optimization_prompt_template.replace(
        "{RESUME_PLACEHOLDER}", resume_text
    )
    try:
        ai_response_text = await openrouter_client(prompt_text, model=model)
    except TimeoutError as e:
        logger.error("OpenRouter API timeout: %s", str(e))
        raise ValueError("AI service request timed out. Please try again.") from e
    except Exception as e:
        logger.error("Error calling OpenRouter API: %s", str(e))
        raise ValueError("Failed to get response from AI service") from e
    if not ai_response_text:
        raise ValueError("Empty response from AI service")
    raw_text = extract_json_from_ai(ai_response_text)
    try:
        parsed = json.loads(raw_text)
        return ProfileImprovementResult.model_validate(parsed)
    except Exception as exc:
        logger.error("Invalid JSON from AI: %s. Response: %s", exc, ai_response_text)
        raise ValueError("Failed to parse AI response") from exc
