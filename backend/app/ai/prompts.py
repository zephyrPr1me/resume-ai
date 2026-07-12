import json
from schemas import AnalysisResult, JobMatchResult, ProfileImprovementResult

def _build_prompt(template: str, schema_model: type, **kwargs) -> str:
    """Safely generates a prompt by adding a schema at the end."""
    schema_json = json.dumps(schema_model.model_json_schema(), ensure_ascii=False, indent=2)
    formatted = template
    for key, value in kwargs.items():
        formatted = formatted.replace(f"<<{key}>>", value or "")

    return formatted + f"\n\nSchema:\n{schema_json}"

#Templates

ANALYSIS_TEMPLATE = """Act as a professional recruiter and career coach. Analyze the provided resume text thoroughly.
If a job description is provided, evaluate the resume against it.
If no job description is given, perform a general resume review.
Respond strictly in the same language as the resume.

<resume>
<<RESUME>>
</resume>

<job_description>
<<JOB>>
</job_description>

Return the response strictly as valid JSON only. Do not include any markdown, code fences, explanation, or extra text.
The output must start with '{' and end with '}'.
Produce every field completely and do not cut off sentences."""

MATCH_TEMPLATE = """Act as a professional recruiter. Compare the resume against the job description and calculate a match score.
Respond strictly in the same language as the resume.

<resume>
<<RESUME>>
</resume>

<job_description>
<<JOB>>
</job_description>

Return the response strictly as valid JSON only. Do not include any markdown, code fences, explanation, or extra text.
The output must start with '{' and end with '}'."""

OPTIMIZATION_TEMPLATE = """Act as a senior career coach and resume writer. Based on the resume text, generate:
1. An ATS-optimized summary (2-3 sentences with keywords)
2. Improved bullet points for the experience section (quantified achievements)
3. A personalized learning path to fill skill gaps
Respond strictly in the same language as the resume.

<resume>
<<RESUME>>
</resume>

Return the response strictly as valid JSON only. Do not include any markdown, code fences, explanation, or extra text.
The output must start with '{' and end with '}'."""


def get_analysis_prompt(resume: str, job: str) -> str:
    return _build_prompt(ANALYSIS_TEMPLATE, AnalysisResult, RESUME=resume, JOB=job)

def get_match_prompt(resume: str, job: str) -> str:
    return _build_prompt(MATCH_TEMPLATE, JobMatchResult, RESUME=resume, JOB=job)

def get_optimization_prompt(resume: str) -> str:
    return _build_prompt(OPTIMIZATION_TEMPLATE, ProfileImprovementResult, RESUME=resume)
