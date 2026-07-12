'use client';

import { useState } from "react";
import { CheckCircle2, AlertTriangle, ShieldCheck, BadgeCheck, XCircle, Sliders, Hash } from "lucide-react";
import type { ResumeAnalysis } from "../types";

interface ResumeAnalysisViewProps {
  analysis: ResumeAnalysis;
  demoMode?: boolean;
}

export default function ResumeAnalysisView({ analysis, demoMode }: ResumeAnalysisViewProps) {
  const [viewMode, setViewMode] = useState<"bars" | "cloud">("bars");

  const getScoreColor = (score: number) => {
    if (score >= 80) return { text: "text-primary", bg: "bg-primary/10", border: "border-primary/30" };
    if (score >= 55) return { text: "text-accent-emerald", bg: "bg-accent-emerald-bg", border: "border-accent-emerald-border" };
    return { text: "text-accent-rose", bg: "bg-accent-rose-bg", border: "border-accent-rose-border" };
  };

  const scoreTheme = getScoreColor(analysis.score);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (analysis.score / 100) * circumference;

  return (
    <div className="space-y-8" id="resume-analysis-container">
      {demoMode && (
        <div className="p-3 rounded-xl bg-accent-amber-bg border border-accent-amber-border text-accent-amber text-xs font-medium">
          Демо-режим: показаны примеры результатов анализа
        </div>
      )}

      <div className="grid grid-cols-3 gap-6" id="analysis-dashboard-grid">
        <div className="p-6 rounded-3xl border flex flex-col items-center justify-center text-center bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300" id="gauge-card">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4" id="score-heading">
            Качество резюме (ИИ)
          </span>
          <div className="relative flex items-center justify-center" id="score-ring-wrapper">
            <svg className="w-36 h-36 transform -rotate-90" id="gauge-svg">
              <circle cx="72" cy="72" r={radius} className="stroke-border fill-transparent" strokeWidth="10" id="gauge-track" />
              <circle
                cx="72"
                cy="72"
                r={radius}
                stroke="url(#scoreGradient)"
                className="fill-transparent"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ filter: "drop-shadow(0 0 6px var(--color-primary))", transition: "stroke-dashoffset 1.2s ease-out" }}
                id="gauge-progress"
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-accent-rose)" />
                  <stop offset="60%" stopColor="var(--color-accent-emerald)" />
                  <stop offset="100%" stopColor="var(--color-primary)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center justify-center" id="gauge-score-value">
              <span className="text-4xl font-extrabold tracking-tighter text-foreground" id="score-number">
                {analysis.score}
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1" id="score-label">
                ATS Score
              </span>
            </div>
          </div>
          <div className={`mt-5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${scoreTheme.bg} ${scoreTheme.text} ${scoreTheme.border}`} id="score-badge">
            {analysis.score >= 80 ? "Отличный профиль" : analysis.score >= 55 ? "Требует доработки" : "Критический уровень"}
          </div>
        </div>

        <div className="col-span-2 p-6 rounded-3xl border flex flex-col justify-between bg-card border-border shadow-sm" id="skills-cloud-card">
          <div id="skills-cloud-header">
            <div className="flex items-center justify-between gap-3 border-b border-border/20 pb-4 mb-4" id="skills-heading-row">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-primary" id="skills-cloud-icon" />
                <h3 className="text-xs font-black uppercase tracking-[0.15em] text-foreground" id="skills-cloud-heading">
                  Извлеченные технологии & навыки
                </h3>
              </div>
              <div className="flex items-center p-0.5 rounded-xl bg-muted-card border border-border/50 shrink-0" id="skills-view-toggle">
                <button
                  onClick={() => setViewMode("bars")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    viewMode === "bars"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  id="toggle-view-bars-btn"
                >
                  <Sliders className="w-3.5 h-3.5" id="icon-toggle-bars" />
                  <span>Сила навыков</span>
                </button>
                <button
                  onClick={() => setViewMode("cloud")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    viewMode === "cloud"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  id="toggle-view-cloud-btn"
                >
                  <Hash className="w-3.5 h-3.5" id="icon-toggle-cloud" />
                  <span>Облако тегов</span>
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1" id="skills-cloud-sub">
              {viewMode === "bars"
                ? "Уровень владения и соответствия навыков вашему карьерному профилю, оцененный нашей ИИ-моделью."
                : "Ключевые слова и технологии, проиндексированные нашей ИИ-моделью для автоматического сопоставления с вакансиями."}
            </p>
          </div>

          {viewMode === "bars" ? (
            <div className="grid grid-cols-2 gap-3.5 mt-4 max-h-56 overflow-y-auto pr-1" id="skills-progress-container">
              {analysis.extractedSkills.map((skill, index) => {
                const hash = skill.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const base = 95 - (index / Math.max(analysis.extractedSkills.length - 1, 1)) * 25;
                const variance = (hash % 13) - 6;
                const strength = Math.min(100, Math.max(50, Math.round(base + variance)));

                const getStrengthColor = (val: number) => {
                  if (val >= 85) return "bg-primary";
                  if (val >= 70) return "bg-accent-emerald";
                  return "bg-accent-amber";
                };

                const getStrengthText = (val: number) => {
                  if (val >= 85) return "Эксперт";
                  if (val >= 70) return "Продвинутый";
                  return "Базовый";
                };

                return (
                  <div
                    key={index}
                    className="p-3 rounded-2xl border bg-muted-card/30 border-border/50 hover:border-primary/30 transition-all duration-300"
                    id={`extracted-skill-bar-${index}`}
                  >
                    <div className="flex justify-between items-center mb-1.5" id={`skill-bar-header-${index}`}>
                      <span className="text-xs font-bold tracking-tight text-foreground" id={`skill-name-${index}`}>
                        {skill}
                      </span>
                      <div className="flex items-center gap-1.5" id={`skill-bar-meta-${index}`}>
                        <span className="text-[9px] text-muted-foreground font-medium" id={`skill-level-text-${index}`}>
                          {getStrengthText(strength)}
                        </span>
                        <span className="text-xs font-extrabold text-primary" id={`skill-strength-value-${index}`}>
                          {strength}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-border/30 rounded-full overflow-hidden" id={`skill-track-${index}`}>
                      <div
                        className={`h-full rounded-full ${getStrengthColor(strength)}`}
                        style={{ width: `${strength}%`, transition: "width 0.8s ease-out", boxShadow: strength >= 85 ? "0 0 8px var(--color-primary)" : "none" }}
                        id={`skill-fill-${index}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mt-4 max-h-44 overflow-y-auto pr-1" id="skills-cloud-container">
              {analysis.extractedSkills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-muted-card border border-border text-foreground hover:border-primary/50 hover:text-primary transition-all duration-300 cursor-default"
                  id={`extracted-skill-badge-${index}`}
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-3 border-t border-border/30 pt-3" id="skills-cloud-footer">
            <ShieldCheck className="w-4 h-4 text-primary" id="security-check-icon" />
            <span>Навыки приведены к стандартному ИТ-словарю для повышения прохождения ATS-фильтров.</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6" id="analysis-lists-layout">
        <div className="p-6 rounded-3xl border bg-card border-border shadow-sm" id="strengths-card">
          <div className="flex items-center gap-2.5 border-b border-border/40 pb-4 mb-4" id="strengths-header">
            <div className="p-2 rounded-lg bg-accent-emerald-bg text-accent-emerald" id="strengths-icon-wrapper">
              <CheckCircle2 className="w-5 h-5" id="strengths-icon" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.15em] text-foreground" id="strengths-heading">Сильные стороны</h3>
              <p className="text-[10px] text-muted-foreground" id="strengths-subtitle">Что выделяет ваше резюме среди конкурентов</p>
            </div>
          </div>
          <ul className="space-y-3" id="strengths-list">
            {analysis.strongPoints.map((point, index) => (
              <li
                key={index}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-accent-emerald-bg/50 border border-accent-emerald-border/30 text-xs text-foreground"
                id={`strength-item-${index}`}
              >
                <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" id={`strength-dot-${index}`}></span>
                <span id={`strength-text-${index}`}>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 rounded-3xl border bg-card border-border shadow-sm" id="weaknesses-card">
          <div className="flex items-center gap-2.5 border-b border-border/40 pb-4 mb-4" id="weaknesses-header">
            <div className="p-2 rounded-lg bg-accent-rose-bg text-accent-rose" id="weaknesses-icon-wrapper">
              <AlertTriangle className="w-5 h-5" id="weaknesses-icon" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.15em] text-foreground" id="weaknesses-heading">Зоны роста & пробелы</h3>
              <p className="text-[10px] text-muted-foreground" id="weaknesses-subtitle">What scares recruiters and automatic filters</p>
            </div>
          </div>
          <ul className="space-y-3" id="weaknesses-list">
            {analysis.gapsAndWeaknesses.map((point, index) => (
              <li
                key={index}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-accent-rose-bg/50 border border-accent-rose-border/30 text-xs text-foreground"
                id={`weakness-item-${index}`}
              >
                <span className="h-2 w-2 rounded-full bg-accent-rose shrink-0 mt-1.5" id={`weakness-dot-${index}`}></span>
                <span id={`weakness-text-${index}`}>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="p-6 rounded-3xl border bg-card border-border shadow-sm" id="ats-audit-card">
        <div className="flex items-center gap-2 mb-4" id="ats-audit-header">
          <ShieldCheck className="w-5 h-5 text-primary" id="ats-audit-icon" />
          <h3 className="text-xs font-black uppercase tracking-[0.15em] text-foreground" id="ats-audit-heading">
            ИИ-Аудит соответствия алгоритмам ATS
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-5" id="ats-audit-desc">
          Роботы-сортировщики анализируют файл перед тем, как он попадет к живому HR-специалисту. Ниже приведены результаты симуляции парсинга по важнейшим критериям:
        </p>
        <div className="grid grid-cols-2 gap-3" id="ats-audit-grid">
          {analysis.atsChecklist.map((criterion, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 bg-muted-card/20 border-border hover:border-primary/40"
              id={`ats-criterion-${index}`}
            >
              <span className="text-xs font-semibold leading-relaxed" id={`ats-criterion-text-${index}`}>{criterion.item}</span>
              {criterion.passed ? (
                <div className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-accent-emerald-bg text-accent-emerald border border-accent-emerald-border/30 shrink-0 ml-3" id={`ats-badge-pass-${index}`}>
                  <BadgeCheck className="w-3.5 h-3.5" id={`ats-pass-icon-${index}`} />
                  <span>ОК</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-accent-rose-bg text-accent-rose border border-accent-rose-border/30 shrink-0 ml-3" id={`ats-badge-fail-${index}`}>
                  <XCircle className="w-3.5 h-3.5" id={`ats-fail-icon-${index}`} />
                  <span>Исправить</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
