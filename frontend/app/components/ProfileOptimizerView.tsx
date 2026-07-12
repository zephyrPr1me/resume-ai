'use client';

import React, { useState } from "react";
import { Sparkles, Copy, Check, ListChecks, Award, Lightbulb, Compass } from "lucide-react";
import type { ProfileImprovementResult } from "../types";

interface ProfileOptimizerViewProps {
  optimization: ProfileImprovementResult;
}

export default function ProfileOptimizerView({ optimization }: ProfileOptimizerViewProps) {
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedBullets, setCopiedBullets] = useState<{ [key: number]: boolean }>({});

  const handleCopySummary = () => {
    navigator.clipboard.writeText(optimization.atsOptimizedSummary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleCopyBullet = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedBullets((prev) => ({ ...prev, [index]: true }));
    setTimeout(() => {
      setCopiedBullets((prev) => ({ ...prev, [index]: false }));
    }, 2000);
  };

  const getPriorityBadgeColor = (priority: string) => {
    const p = priority.toLowerCase();
    if (p.includes("высок") || p.includes("high") || p.includes("критич")) return "bg-accent-rose-bg text-accent-rose border-accent-rose-border";
    if (p.includes("средн") || p.includes("med")) return "bg-accent-emerald-bg text-accent-emerald border-accent-emerald-border";
    return "bg-muted-card text-muted-foreground border-border";
  };

  return (
    <div className="space-y-8" id="optimizer-container">
      <div id="optimizer-intro-block">
        <h2 className="text-2xl font-bold tracking-tighter uppercase text-primary" id="optimizer-heading">
          Шаг 3: ИИ-Улучшение резюме и профиля
        </h2>
        <p className="text-sm text-muted-foreground mt-1" id="optimizer-lead">
          Используйте сгенерированные тексты и профессиональный план обучения для повышения привлекательности вашего профиля на 200%.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-6" id="optimizer-core-layout">
        <div className="col-span-2 p-6 rounded-3xl border flex flex-col justify-between bg-card border-border shadow-sm" id="summary-card">
          <div id="summary-top">
            <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4" id="summary-header">
              <div className="flex items-center gap-2" id="summary-title-wrapper">
                <Sparkles className="w-5 h-5 text-primary" id="summary-icon" />
                <h3 className="text-xs font-black uppercase tracking-[0.15em] text-foreground" id="summary-heading">
                  Раздел «О себе» (ATS Optimized)
                </h3>
              </div>
              <button
                onClick={handleCopySummary}
                className="p-2.5 rounded-2xl border hover:scale-105 transition-all duration-300 bg-card-hover border-border hover:bg-card-hover/80 text-foreground flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider cursor-pointer"
                id="copy-summary-btn"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-accent-emerald" id="copied-summary-icon" />
                    <span className="text-accent-emerald" id="copied-summary-text">Скопировано!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-primary" id="copy-summary-icon" />
                    <span>Копировать</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed" id="summary-instruction">
              Высококонцентрированный текст со всеми необходимыми ключевыми словами для заголовка профиля на Хэдхантере, Хабр Карьере или в LinkedIn:
            </p>
            <div className="p-4 rounded-2xl font-mono text-xs leading-relaxed select-all bg-muted-card border border-border text-foreground" id="summary-text-box">
              {optimization.atsOptimizedSummary}
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-5 border-t border-border/30 pt-4" id="summary-footer">
            <Lightbulb className="w-4 h-4 text-primary shrink-0" id="summary-footer-icon" />
            <span>Плотность ключевых слов подобрана под стандартные веса поисковых роботов HR-систем.</span>
          </div>
        </div>

        <div className="col-span-3 p-6 rounded-3xl border bg-card border-border shadow-sm" id="accomplishments-card">
          <div className="flex items-center gap-2 border-b border-border/40 pb-4 mb-4" id="accomplishments-header">
            <Award className="w-5 h-5 text-accent-emerald" id="accomplishments-icon" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.15em] text-foreground" id="accomplishments-heading">
                Улучшенные bullet-points опыта (Сила оцифровки)
              </h3>
              <p className="text-[10px] text-muted-foreground" id="accomplishments-subtitle">Перепишите ваши достижения, используя метрики и активные сильные глаголы</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-5 leading-relaxed" id="accomplishments-intro">
            Вместо сухого <i>«занимался поддержкой проектов»</i> используйте эти формулировки в описании предыдущих мест работы. Нажмите для копирования любого пункта отдельно:
          </p>
          <div className="space-y-3" id="accomplishments-list">
            {optimization.improvedBulletPoints.map((bullet, index) => (
              <div
                key={index}
                onClick={() => handleCopyBullet(bullet, index)}
                className="group p-4 rounded-2xl border border-dashed transition-all duration-300 cursor-pointer flex justify-between items-start gap-4 bg-card-hover/20 hover:bg-card-hover border-border hover:border-primary/40"
                id={`accomplishment-item-${index}`}
              >
                <div className="flex gap-2.5" id={`accomplishment-inner-${index}`}>
                  <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" id={`accomplishment-dot-${index}`}></span>
                  <span className="text-xs leading-relaxed group-hover:text-primary transition-colors text-foreground" id={`accomplishment-text-${index}`}>{bullet}</span>
                </div>
                <button
                  className="p-1.5 rounded-lg bg-card text-muted-foreground shrink-0 transition-all opacity-40 group-hover:opacity-100 cursor-pointer"
                  aria-label="Копировать это достижение"
                  id={`accomplishment-copy-btn-${index}`}
                >
                  {copiedBullets[index] ? (
                    <Check className="w-3.5 h-3.5 text-accent-emerald" id={`accomplishment-copied-icon-${index}`} />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-primary" id={`accomplishment-copy-icon-${index}`} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 rounded-3xl border bg-card border-border shadow-sm" id="roadmap-section">
        <div className="flex items-center gap-2 mb-4" id="roadmap-header">
          <Compass className="w-5 h-5 text-accent-emerald" style={{ animationDuration: "15s" }} id="roadmap-icon" />
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-foreground" id="roadmap-heading">
              Индивидуальный план обучения & Прокачки навыков
            </h3>
            <p className="text-[10px] text-muted-foreground" id="roadmap-subtitle">Пошаговый технологический радар для закрытия обнаруженных критических пробелов</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-5" id="roadmap-grid">
          {optimization.learningPath.map((item, index) => (
            <div
              key={index}
              className="p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between gap-4 bg-card-hover/20 border-border/50 hover:border-primary/30"
              id={`roadmap-card-${index}`}
            >
              <div className="space-y-2" id={`roadmap-card-top-${index}`}>
                <div className="flex justify-between items-start gap-3" id={`roadmap-card-header-${index}`}>
                  <h4 className="text-sm font-bold tracking-tight text-foreground" id={`roadmap-card-title-${index}`}>
                    {item.skill}
                  </h4>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border shrink-0 ${getPriorityBadgeColor(item.importance)}`} id={`roadmap-card-badge-${index}`}>
                    {item.importance}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed" id={`roadmap-card-resources-${index}`}>
                  <span className="font-bold text-foreground block text-[10px] mb-0.5 uppercase tracking-wider text-primary">Рекомендуемые материалы:</span>
                  {item.resources}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-accent-emerald border-t border-border/30 pt-3" id={`roadmap-card-footer-${index}`}>
                <ListChecks className="w-3.5 h-3.5 text-primary" id={`roadmap-card-footer-icon-${index}`} />
                <span>Запланировать изучение</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
