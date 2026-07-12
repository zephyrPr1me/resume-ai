export interface ATSChecklistItem {
  item: string;
  passed: boolean;
}

export interface ResumeAnalysis {
  score: number;
  extractedSkills: string[];
  strongPoints: string[];
  gapsAndWeaknesses: string[];
  atsChecklist: ATSChecklistItem[];
}

export interface LearningPathItem {
  skill: string;
  importance: string;
  resources: string;
}

export interface ProfileImprovementResult {
  atsOptimizedSummary: string;
  improvedBulletPoints: string[];
  learningPath: LearningPathItem[];
}

export interface JobMatchResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  context_length: number;
}
