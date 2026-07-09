from typing import List, Optional

from pydantic import BaseModel, Field


class ATSChecklistItem(BaseModel):
    item: str
    passed: bool


class AnalysisResult(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Overall resume quality score")
    extractedSkills: List[str] = Field(
        default_factory=list, description="Skills extracted from the resume"
    )
    strongPoints: List[str] = Field(
        default_factory=list, description="What makes the resume stand out"
    )
    gapsAndWeaknesses: List[str] = Field(
        default_factory=list, description="Areas for improvement"
    )
    atsChecklist: List[ATSChecklistItem] = Field(
        default_factory=list, description="ATS compatibility checklist"
    )


class AnalysisResponse(BaseModel):
    status: str = "success"
    filename: str
    analysis: AnalysisResult


class JobMatchResult(BaseModel):
    matchScore: int = Field(..., ge=0, le=100)
    matchedSkills: List[str] = Field(default_factory=list)
    missingSkills: List[str] = Field(default_factory=list)
    recommendations: str = ""


class LearningPathItem(BaseModel):
    skill: str
    importance: str
    resources: str


class ProfileImprovementResult(BaseModel):
    atsOptimizedSummary: str = ""
    improvedBulletPoints: List[str] = Field(default_factory=list)
    learningPath: List[LearningPathItem] = Field(default_factory=list)
