'use client';

import React, { useState, useRef } from "react";
import { Upload, ArrowRight, Clipboard, FileCode } from "lucide-react";

interface ResumeUploadAndPasteProps {
  resumeText: string;
  setResumeText: (text: string) => void;
  onAnalyze: () => void;
  isLoading?: boolean;
  isAnalyzing?: boolean;
  samples?: Array<{ title: string; category: string; text: string }>;
  minimal?: boolean;
}

export default function ResumeUploadAndPaste({
  resumeText,
  setResumeText,
  onAnalyze,
  isLoading = false,
  isAnalyzing = false,
  samples = [],
  minimal = false,
}: ResumeUploadAndPasteProps) {
  const loading = isLoading || isAnalyzing;
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        setResumeText(text);
      }
    };
    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6" id="resume-input-module">
      {/* Title & Description */}
      {!minimal && (
        <div id="resume-input-title-block">
          <h2 className="text-2xl font-bold tracking-tighter uppercase text-primary" id="resume-input-heading">
            Шаг 1: Загрузка или ввод резюме
          </h2>
          <p className="text-sm text-muted-foreground mt-1" id="resume-input-lead">
            Вставьте текст вашего резюме или выберите готовый шаблон для тестирования возможностей ИИ.
          </p>
        </div>
      )}

      {/* Quick Demo Templates Picker */}
      {!minimal && samples.length > 0 && (
        <div className="space-y-2.5" id="resume-quick-demo-section">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-primary" id="quick-demo-label">
            Быстрый старт с шаблонами:
          </span>
          <div className="grid grid-cols-2 gap-3" id="quick-demo-grid">
            {samples.map((sample, index) => (
              <button
                key={index}
                onClick={() => setResumeText(sample.text)}
                className={`p-4 rounded-3xl border text-left transition-all duration-300 flex items-start gap-3 hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
                  resumeText === sample.text
                    ? "bg-primary/10 border-primary text-foreground shadow-md shadow-primary/5"
                    : "bg-card hover:bg-card-hover border-border text-foreground"
                }`}
                id={`sample-resume-btn-${index}`}
              >
                <FileCode className={`w-5 h-5 mt-0.5 shrink-0 ${resumeText === sample.text ? "text-primary" : "text-accent-emerald"}`} id={`sample-icon-${index}`} />
                <div>
                  <h4 className="font-bold text-sm leading-tight" id={`sample-title-${index}`}>{sample.title}</h4>
                  <span className="text-[10px] font-black tracking-[0.15em] uppercase opacity-80 mt-1 block" id={`sample-category-${index}`}>
                    Сфера: {sample.category}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid of Paste Textarea and Drag & Drop file */}
      <div className="grid grid-cols-3 gap-6" id="resume-workspace-layout">
        {/* Paste Resume Column */}
        <div className="col-span-2 space-y-2" id="resume-text-input-column">
          <label className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-1.5" htmlFor="resume-textarea" id="textarea-label">
            <Clipboard className="w-3.5 h-3.5 text-primary" id="clipboard-icon" />
            Вставьте текстовое содержимое резюме
          </label>
          <div className="relative rounded-3xl overflow-hidden" id="textarea-container">
            <textarea
              id="resume-textarea"
              className="w-full h-96 p-4 text-sm font-mono focus:outline-none transition-all duration-300 border focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none bg-muted-card border-border text-foreground"
              placeholder="Скопируйте сюда контакты, опыт работы, навыки и образование..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
            {resumeText.trim().length > 0 && (
              <div className="absolute bottom-4 right-4 text-[10px] font-black px-2 py-1 rounded bg-primary/15 text-primary border border-primary/30" id="char-counter">
                Символов: {resumeText.length}
              </div>
            )}
          </div>
        </div>

        {/* Drag and Drop Box & Quick Info */}
        <div className="space-y-4 flex flex-col justify-between" id="resume-drag-drop-column">
          <div className="space-y-2" id="drag-drop-sub-section">
            <span className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-1.5" id="file-label">
              <Upload className="w-3.5 h-3.5 text-primary" id="upload-icon" />
              Или загрузите файл
            </span>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all duration-300 h-56 flex flex-col items-center justify-center gap-3 ${
                dragActive
                  ? "border-primary bg-primary/10 text-primary scale-95"
                  : "border-border hover:border-primary/60 hover:bg-card-hover/20 bg-muted-card/50 text-muted-foreground"
              }`}
              id="file-drop-zone"
            >
              <Upload className={`w-10 h-10 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} id="drop-upload-icon" />
              <p className="text-xs text-foreground" id="drop-text">
                {dragActive ? 'Отпустите файл для загрузки' : 'Перетащите .txt файл сюда или кликните'}
              </p>
              <span className="text-[10px] opacity-60 text-muted-foreground" id="drop-hint">
                Поддерживает .txt, .docx, .pdf
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.docx,.pdf"
                onChange={handleFileInputChange}
                className="hidden"
                id="file-input-hidden"
              />
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={onAnalyze}
            disabled={loading || !resumeText.trim()}
            className={`w-full py-3.5 rounded-3xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              loading || !resumeText.trim()
                ? "bg-card-hover/50 text-muted-foreground cursor-not-allowed border border-border"
                : "bg-primary text-primary-foreground hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
            }`}
            id="analyze-button"
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin">⏳</span>
                Анализируем...
              </>
            ) : (
              <>
                Запустить анализ
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
