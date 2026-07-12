'use client';

import dynamic from 'next/dynamic';
import { AlertCircle, ClipboardList, TrendingUp, FileText } from "lucide-react";
import Header from "./components/Header";
import ModelSelector from "./components/ModelSelector";
import AnalysisTab from "./components/tabs/AnalysisTab";
import { useAppState } from "./hooks/useAppState";
import { useState, useEffect, useRef, useCallback } from "react";
import { demoResults, sampleJobs } from "./demoData";
import type { ResumeAnalysis, JobMatchResult, ProfileImprovementResult } from "./types";


const ProfileOptimizerView = dynamic(() => import("./components/ProfileOptimizerView"), {
  loading: () => <div className="animate-pulse h-64 bg-card rounded-3xl" />,
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const MAX_RESUME_CHARS = 15000;
const MAX_JOB_CHARS = 5000;

export default function HomePage() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [themeReady, setThemeReady] = useState<boolean>(false);
  const [resumeText, setResumeText] = useState<string>("");
  const [jobText, setJobText] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"analysis" | "optimization">("analysis");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isMatching, setIsMatching] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysis | null>(null);
  const [matchResult, setMatchResult] = useState<JobMatchResult | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<ProfileImprovementResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const analyzeAbortController = useRef<AbortController | null>(null);
  const matchAbortController = useRef<AbortController | null>(null);


  useEffect(() => {
    const saved = localStorage.getItem('theme');
    setIsDarkMode(saved !== null ? saved === 'dark' : true);
    setThemeReady(true);
  }, []);
  useEffect(() => {
    if (!themeReady) return;
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode, themeReady]);
  useEffect(() => {
    return () => {
      analyzeAbortController.current?.abort();
      matchAbortController.current?.abort();
    };
  }, []);

  const toggleTheme = useCallback(() => setIsDarkMode((prev) => !prev), []);

  const validateText = (text: string, maxLength: number, fieldName: string): string | null => {
    if (!text.trim()) return `${fieldName} не может быть пустым`;
    if (text.length > maxLength) return `${fieldName} слишком длинный. Максимум ${maxLength} символов`;
    return null;
  };


  const handleAnalyzeResume = useCallback(async () => {
    const resumeError = validateText(resumeText, MAX_RESUME_CHARS, "Резюме");
    if (resumeError) { setErrorMessage(resumeError); return; }

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
          body: JSON.stringify({ resumeText, model: selectedModel || undefined }),
          signal: analyzeAbortController.current.signal,
        }),
        fetch(`${API_URL}/api/generate-profile-recommendations/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeText, model: selectedModel || undefined }),
          signal: analyzeAbortController.current.signal,
        }),
      ]);

      let analysisData: ResumeAnalysis | null = null;
      let optData: ProfileImprovementResult | null = null;
      let hasError = false;

      if (analysisResponse.status === 'fulfilled' && analysisResponse.value.ok) {
        analysisData = (await analysisResponse.value.json()).analysis;
      } else { hasError = true; }

      if (optResponse.status === 'fulfilled' && optResponse.value.ok) {
        optData = await optResponse.value.json();
      } else { hasError = true; }

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
  }, [resumeText, selectedModel]);

  // Action: Match Job
  const handleMatchJob = useCallback(async () => {
    const resumeError = validateText(resumeText, MAX_RESUME_CHARS, "Резюме");
    const jobError = validateText(jobText, MAX_JOB_CHARS, "Вакансия");
    if (resumeError || jobError) { setErrorMessage(resumeError || jobError); return; }

    if (matchAbortController.current) matchAbortController.current.abort();
    matchAbortController.current = new AbortController();

    setIsMatching(true);
    setErrorMessage(null);
    setDemoMode(false);

    try {
      // Fix #1: model sent in every request body
      const response = await fetch(`${API_URL}/api/match-job/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobText, model: selectedModel || undefined }),
        signal: matchAbortController.current.signal,
      });

      if (!response.ok) throw new Error("Не удалось получить ответ от сервера.");
      setMatchResult(await response.json());
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
  }, [resumeText, jobText, selectedModel]);

  const cancelMatch = useCallback(() => {
    if (matchAbortController.current) {
      matchAbortController.current.abort();
      setIsMatching(false);
      setErrorMessage("Сопоставление отменено");
    }
  }, []);

  const loadSampleJob = useCallback(() => setJobText(sampleJobs.developer), []);

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    const tabs = ['analysis', 'optimization'] as const;
    let newIndex = index;
    if (e.key === 'ArrowRight') newIndex = (index + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') newIndex = (index - 1 + tabs.length) % tabs.length;
    else return;
    e.preventDefault();
    setActiveTab(tabs[newIndex]);
    document.getElementById(`tab-${tabs[newIndex]}`)?.focus();
  };

  return (
    <div className="w-full min-h-screen bg-background text-foreground transition-colors duration-300 relative overflow-hidden flex flex-col">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-accent-emerald-bg/30 rounded-full blur-3xl -z-10 pointer-events-none" />

      <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

      {/* Fix #4: max-w-[1285px] w-full — keeps ideal width on large screens,
           shrinks gracefully on smaller ones instead of breaking layout */}
      <main className="flex-grow max-w-[1285px] w-full mx-auto px-8 py-6 z-10">
        {/* Model Selection */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
          />
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1.5 p-1 mb-6 rounded-xl bg-card border border-border max-w-max"
          role="tablist"
          aria-label="Разделы анализа резюме"
        >
          {[
            { id: 'analysis', label: 'Анализ', icon: ClipboardList },
            { id: 'optimization', label: 'Оптимизация', icon: TrendingUp },
          ].map((tab, index) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              onKeyDown={(e) => handleTabKeyDown(e, index)}
              tabIndex={activeTab === tab.id ? 0 : -1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card-hover'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        {activeTab === 'analysis' && (
          <AnalysisTab
            resumeText={resumeText}
            setResumeText={setResumeText}
            jobText={jobText}
            setJobText={setJobText}
            isAnalyzing={isAnalyzing}
            handleAnalyzeResume={handleAnalyzeResume}
            isMatching={isMatching}
            handleMatchJob={handleMatchJob}
            cancelMatch={cancelMatch}
            matchResult={matchResult}
            analysisResult={analysisResult}
            demoMode={demoMode}
            loadSampleJob={loadSampleJob}
          />
        )}

        {activeTab === 'optimization' && (
          <div
            id="panel-optimization"
            role="tabpanel"
            aria-labelledby="tab-optimization"
            className="space-y-6"
          >
            <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-foreground">
                <TrendingUp size={20} className="text-primary" />
                Оптимизация профиля
              </h3>
              <p className="text-muted-foreground mb-4">
                Загрузите резюме на вкладке &quot;Аудит&quot;, чтобы получить персональные рекомендации по улучшению.
              </p>
              {optimizationResult ? (
                <ProfileOptimizerView optimization={optimizationResult} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText size={48} className="mx-auto mb-3 opacity-30" />
                  <p>Сначала проведите аудит резюме</p>
                </div>
              )}
            </div>
          </div>
        )}

        {errorMessage && (
          <div
            className="mt-6 bg-accent-rose-bg border border-accent-rose-border rounded-2xl p-4 flex items-start gap-3 animate-fade-in"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle size={20} className="text-accent-rose flex-shrink-0 mt-0.5" />
            <p className="text-foreground text-sm">{errorMessage}</p>
          </div>
        )}
      </main>
    </div>
  );
}
