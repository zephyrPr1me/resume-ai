import json
import re

from openrouter import OpenRouter
from json_repair import repair_json

from app.config import API_KEY, logger
from app.schemas import AnalysisResult

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


def openrouter_client(content: str, model: str = "google/gemma-4-31b-it:free"):
    with OpenRouter(api_key=API_KEY) as client:
        response = client.chat.send(
            model=model,
            messages=[{"role": "user", "content": content}],
        )
    return response.choices[0].message.content


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


def call_openrouter_api(
    text_from_pdf: str, job_description: str, model: str = "google/gemma-4-31b-it:free"
) -> AnalysisResult:
    prompt_text = prompt_template.replace("[TEXT]", text_from_pdf).replace(
        "[JOB]", job_description or ""
    )
    try:
        ai_response_text = openrouter_client(prompt_text, model=model)
    except Exception as e:
        logger.error("Ошибка при вызове OpenRouter API: %s", str(e))
        raise ValueError("Не удалось получить ответ от AI сервиса") from e
    if not ai_response_text:
        raise ValueError("Empty response from AI service")
    raw_text = extract_json_from_ai(ai_response_text)
    try:
        parsed = json.loads(raw_text)
        return AnalysisResult.model_validate(parsed)
    except Exception as exc:
        logger.error("Invalid JSON from AI: %s. Response: %s", exc, ai_response_text)
        raise ValueError("Failed to parse AI response") from exc
