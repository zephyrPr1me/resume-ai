import json
from typing import List, Optional

from pydantic import BaseModel, Field


class AnalysisResult(BaseModel):
    match_percentage: Optional[int] = Field(
        None,
        ge=0,
        le=100,
        description="Percentage of how well the resume matches the job requirements",
    )
    summary: str = Field(
        ..., description="Overall conclusion about the candidate in 2–3 sentences"
    )
    found_skills: List[str] = Field(
        default_factory=list, description="Skills that were successfully identified"
    )
    missing_skills: List[str] = Field(
        default_factory=list,
        description="Skills or experience missing for this position",
    )
    recommendations: List[str] = Field(
        default_factory=list,
        description="Specific steps: what to add or change in the resume",
    )


class AnalysisResponse(BaseModel):
    status: str = "success"
    filename: str
    analysis: AnalysisResult
