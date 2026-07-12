'use client';

import { CheckCircle2, XCircle, Lightbulb } from "lucide-react";

interface JobMatcherViewProps {
  match: {
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    recommendations: string;
  };
  isDarkMode: boolean;
}

export default function JobMatcherView({ match }: Omit<JobMatcherViewProps, "isDarkMode">) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-primary';
    if (score >= 60) return 'text-accent-emerald';
    return 'text-accent-rose';
  };

  return (
    <div className="space-y-6 bg-card border border-border rounded-2xl p-6 shadow-sm">
      {/* Match Score */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Совпадение с вакансией</h3>
          <p className="text-sm text-muted-foreground">Насколько ваше резюме соответствует требованиям</p>
        </div>
        <div className="text-right">
          <span className={`text-4xl font-bold ${getScoreColor(match.matchScore)}`}>
            {match.matchScore}%
          </span>
        </div>
      </div>

      {/* Skills Match */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-accent-emerald" />
            Совпадающие навыки
          </h4>
          <div className="flex flex-wrap gap-2">
            {match.matchedSkills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-full text-xs font-medium border bg-accent-emerald-bg border-accent-emerald-border/40 text-accent-emerald"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-accent-rose" />
            Недостающие навыки
          </h4>
          <div className="flex flex-wrap gap-2">
            {match.missingSkills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-full text-xs font-medium border bg-accent-rose-bg border-accent-rose-border/40 text-accent-rose"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="p-4 rounded-xl border bg-primary/10 border-primary/20">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
          <Lightbulb className="w-4 h-4 text-primary" />
          Рекомендации
        </h4>
        <p className="text-sm text-muted-foreground">{match.recommendations}</p>
      </div>
    </div>
  );
}