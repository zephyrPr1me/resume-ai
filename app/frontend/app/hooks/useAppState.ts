'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { demoResults, sampleJobs } from "../demoData";
import type { ResumeAnalysis, JobMatchResult, ProfileImprovementResult } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const MAX_RESUME_CHARS = 15000;
const MAX_JOB_CHARS = 5000;

const getInitialTheme = (): boolean => {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem('theme');
  return saved !== null ? saved === 'dark' : true;
};

export function useAppState() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialTheme);
  const [resumeText, setResumeText] = useState<string>("");
  const [jobText, setJobText] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"audit" | "matching" | "optimization">("audit");

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isMatching, setIsMatching] = useState<boolean>(false);

  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysis | null>(null);
  const [matchResult, setMatchResult] = useState<JobMatchResult | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<ProfileImprovementResult | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(false);

  // AbortController refs
  const analyzeAbortController = useRef<AbortController | null>(null);
  const matchAbortController = useRef<AbortController | null>(null);

  // Sync theme with localStorage and DOM
  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  // Validation helper
  const validateText = (text: string, maxLength: number, fieldName: string): string | null => {
    if (!text.trim()) return `${fieldName} не может быть пустым`;
    if (text.length > maxLength) return `${fieldName} слишком длинный. Максимум ${maxLength} символов`;
    return null;
  };

  // 1. Analyze resume + generate optimization
  const handleAnalyzeResume = useCallback(async () => {
    const resumeError = validateText(resumeText, MAX_RESUME_CHARS, "Резюме");
    if (resumeError) {
      setErrorMessage(resumeError);
      return;
    }

    if (analyzeAbortController.current) analyzeAbortController.current.abort();
    analyzeAbortController.current = new AbortController();

    setIsAnalyzing(true);
    setErrorMessage(null);
    setDemoMode(false);

    try {
      const [analysisResponse, optResponse] = await Promise.allSettled([
        fetch(`${API_URL}/api/analyze-resume-text/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeText }),
          signal: analyzeAbortController.current.signal,
        }),
        fetch(`${API_URL}/api/generate-profile-recommendations/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeText }),
          signal: analyzeAbortController.current.signal,
        }),
      ]);

      let analysisData: ResumeAnalysis | null = null;
      let optData: ProfileImprovementResult | null = null;
      let hasError = false;

      if (analysisResponse.status === 'fulfilled' && analysisResponse.value.ok) {
        const json = await analysisResponse.value.json();
        analysisData = json.analysis;
      } else {
        hasError = true;
      }

      if (optResponse.status === 'fulfilled' && optResponse.value.ok) {
        optData = await optResponse.value.json();
      } else {
        hasError = true;
      }

      if (!analysisData && !optData) throw new Error("Не удалось получить ответ от сервера");

      if (hasError) {
        setErrorMessage("Некоторые данные не удалось получить. Показываем доступные результаты.");
        setDemoMode(true);
      }

      if (analysisData) setAnalysisResult(analysisData);
      if (optData) setOptimizationResult(optData);

      if (!analysisData && !optData) {
        setDemoMode(true);
        setAnalysisResult(demoResults.product.analysis);
        setOptimizationResult(demoResults.product.optimization);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return;
      const message = error instanceof Error ? error.message : "Произошла ошибка при обращении к API";
      console.error("API Error:", error);
      setErrorMessage(`${message}. Включен демо-режим.`);
      setDemoMode(true);
      setAnalysisResult(demoResults.product.analysis);
      setOptimizationResult(demoResults.product.optimization);
    } finally {
      setIsAnalyzing(false);
      analyzeAbortController.current = null;
    }
  }, [resumeText]);

  // 2. Match resume against job
  const handleMatchJob = useCallback(async () => {
    const resumeError = validateText(resumeText, MAX_RESUME_CHARS, "Резюме");
    const jobError = validateText(jobText, MAX_JOB_CHARS, "Вакансия");
    if (resumeError || jobError) {
      setErrorMessage(resumeError || jobError);
      return;
    }

    if (matchAbortController.current) matchAbortController.current.abort();
    matchAbortController.current = new AbortController();

    setIsMatching(true);
    setErrorMessage(null);
    setDemoMode(false);

    try {
      const response = await fetch(`${API_URL}/api/match-job/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobText }),
        signal: matchAbortController.current.signal,
      });

      if (!response.ok) throw new Error("Не удалось получить ответ от сервера.");

      const data = await response.json();
      setMatchResult(data);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return;
      const message = error instanceof Error ? error.message : "Произошла ошибка при сопоставлении";
      console.error("Match API Error:", error);
      setErrorMessage(`${message}. Включен демо-режим.`);
      setDemoMode(true);
      setMatchResult(demoResults.match);
    } finally {
      setIsMatching(false);
      matchAbortController.current = null;
    }
  }, [resumeText, jobText]);

  // 3. Cancel ongoing match
  const cancelMatch = useCallback(() => {
    if (matchAbortController.current) {
      matchAbortController.current.abort();
      setIsMatching(false);
      setErrorMessage("Сопоставление отменено");
    }
  }, []);

  // Load sample job text
  const loadSampleJob = () => setJobText(sampleJobs.developer);

  return {
    // Theme
    isDarkMode,
    toggleTheme,
    // Tab state
    activeTab,
    setActiveTab,
    // Resume / job text
    resumeText,
    setResumeText,
    jobText,
    setJobText,
    // Loading flags
    isAnalyzing,
    isMatching,
    // Results
    analysisResult,
    matchResult,
    optimizationResult,
    // Error & demo mode
    errorMessage,
    demoMode,
    // Actions
    handleAnalyzeResume,
    handleMatchJob,
    cancelMatch,
    loadSampleJob,
    // Constants (exported for consumers)
    MAX_JOB_CHARS,
  };
}
