'use client';

import { useState } from "react";
import dynamic from 'next/dynamic';
import { ClipboardList, Compass, X, AlertCircle } from "lucide-react";
import ResumeUploadAndPaste from "../ResumeUploadAndPaste";
import type { ResumeAnalysis, JobMatchResult } from "../../types";
import { sampleResumes } from "../../demoData";

const ResumeAnalysisView = dynamic(() => import('../ResumeAnalysisView'), {
  loading: () => <div className="animate-pulse h-64 bg-card rounded-3xl" />,
});

const JobMatcherView = dynamic(() => import('../JobMatcherView'), {
  loading: () => <div className="animate-pulse h-64 bg-card rounded-3xl" />,
});

const sampleResumesUI = [
  { title: "Product Manager", category: "Управление продуктом", text: sampleResumes.product },
  { title: "Frontend Developer", category: "Веб-разработка", text: sampleResumes.developer },
];

const MAX_JOB_CHARS = 5000;

type AnalysisMode = "audit" | "matching";

interface AnalysisTabProps {
  resumeText: string;
  setResumeText: (text: string) => void;
  jobText: string;
  setJobText: (text: string) => void;
  isAnalyzing: boolean;
  handleAnalyzeResume: () => void;
  isMatching: boolean;
  handleMatchJob: () => void;
  cancelMatch: () => void;
  matchResult: JobMatchResult | null;
  analysisResult: ResumeAnalysis | null;
  demoMode: boolean;
  loadSampleJob: () => void;
}

export default function AnalysisTab({
  resumeText,
  setResumeText,
  jobText,
  setJobText,
  isAnalyzing,
  handleAnalyzeResume,
  isMatching,
  handleMatchJob,
  cancelMatch,
  matchResult,
  analysisResult,
  demoMode,
  loadSampleJob,
}: AnalysisTabProps) {
  const [mode, setMode] = useState<AnalysisMode>("audit");

  return (
    <div id="panel-analysis" role="tabpanel" aria-labelledby="tab-analysis" className="space-y-6 animate-fade-in">
      {/* Mode toggle */}
      <div className="flex items-center p-0.5 rounded-xl bg-muted-card border border-border/50 w-max" role="group" aria-label="Режим анализа">
        <button
          onClick={() => setMode("audit")}
          aria-pressed={mode === "audit"}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
            mode === "audit" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
          id="toggle-mode-audit-btn"
        >
          <ClipboardList className="w-4 h-4" />
          <span>Аудит резюме</span>
        </button>
        <button
          onClick={() => setMode("matching")}
          aria-pressed={mode === "matching"}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
            mode === "matching" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
          id="toggle-mode-matching-btn"
        >
          <Compass className="w-4 h-4" />
          <span>Сопоставление</span>
        </button>
      </div>

      {/* Shared resume input */}
      <ResumeUploadAndPaste
        resumeText={resumeText}
        setResumeText={setResumeText}
        isAnalyzing={false}
        onAnalyze={() => {}}
        samples={sampleResumesUI}
        minimal
      />

      {/* Job input — only for matching mode */}
      {mode === "matching" && (
        <div id="matching-job-input-block">
          <label className="block text-sm font-medium mb-2">Вакансия</label>
          <div className="relative">
            <textarea
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Вставьте текст вакансии..."
              maxLength={MAX_JOB_CHARS}
              className="w-full h-40 p-3 rounded-2xl border border-border bg-muted-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none transition-all duration-300"
              aria-label="Текст вакансии"
            />
            <button
              onClick={loadSampleJob}
              className="absolute bottom-2 right-2 text-xs bg-card-hover px-3 py-1 rounded-lg border border-border hover:border-primary/50 text-foreground transition-all duration-300 cursor-pointer"
              aria-label="Загрузить пример вакансии"
            >
              Пример
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {jobText.length} / {MAX_JOB_CHARS} символов
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {mode === "audit" ? (
          <button
            onClick={handleAnalyzeResume}
            disabled={isAnalyzing || !resumeText.trim()}
            className={`flex-1 py-3.5 rounded-3xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              isAnalyzing || !resumeText.trim()
                ? "bg-card-hover/50 text-muted-foreground cursor-not-allowed border border-border"
                : "bg-primary text-primary-foreground hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
            }`}
            aria-label="Запустить анализ резюме"
          >
            {isAnalyzing ? "Анализируем..." : "Запустить анализ"}
          </button>
        ) : (
          <>
            {isMatching && (
              <button
                onClick={cancelMatch}
                className="px-4 py-3 rounded-3xl border border-accent-rose-border/30 text-accent-rose bg-accent-rose-bg/30 hover:bg-accent-rose-bg hover:border-accent-rose-border transition-all flex items-center gap-2 cursor-pointer"
                aria-label="Отменить сопоставление"
              >
                <X size={18} />
                Отменить
              </button>
            )}
          </>
        )}
      </div>

      {/* Demo banner */}
      {demoMode && (
        <div className="bg-accent-amber-bg border border-accent-amber-border/30 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-accent-amber flex-shrink-0" />
          <p className="text-foreground text-sm">
            <strong>Демо-режим:</strong> Показаны примерные данные. Проверьте API-ключ для реального анализа.
          </p>
        </div>
      )}

      {/* Results */}
      {mode === "audit" && analysisResult && (
        <ResumeAnalysisView analysis={analysisResult} demoMode={demoMode} />
      )}
      {mode === "matching" && matchResult && <JobMatcherView match={matchResult} />}
    </div>
  );
}
