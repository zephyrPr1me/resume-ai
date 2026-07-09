'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Cpu, AlertCircle } from 'lucide-react';
import type { ModelInfo } from '../types';
import ModelCard from './ModelCard';
import SmartModelIcon from './SmartModelIcon';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  errorMessage: string | null;
  setErrorMessage: (message: string | null) => void;
}

export default function ModelSelector({
  selectedModel,
  onModelChange,
  errorMessage,
  setErrorMessage
}: ModelSelectorProps) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchModels = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/models-free/`);

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      setModels(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load models';
      setErrorMessage(errorMsg);
      console.error('Error fetching models:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  // Закрытие дропдауна по Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const selectedModelInfo = models.find((m) => m.id === selectedModel);

  return (
    <div className='relative w-full mb-6 animate-fade-in' style={{ animationDelay: '0.1s' }}>
      <div className='flex items-center justify-between mb-2'>
        <label className='text-xs font-black uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-1.5'>
          <Cpu className='w-3.5 h-3.5 text-primary' />
          Выбор модели
        </label>
        <button
          type='button'
          onClick={fetchModels}
          disabled={isLoading}
          className='text-xs text-primary hover:text-primary/80 underline cursor-pointer transition-all disabled:opacity-50 disabled:no-underline'
          aria-label='Обновить список моделей'
        >
          {isLoading ? 'Обновляем...' : 'Обновить'}
        </button>
      </div>

      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || models.length === 0}
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 bg-card hover:bg-card-hover border-border hover:border-primary/30
          ${!selectedModel ? 'text-muted-foreground' : 'text-foreground'}
          ${isOpen ? 'ring-2 ring-primary/30 border-primary' : ''}
          ${isLoading || models.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className='flex items-center gap-3 min-w-0'>
          <div className='flex-shrink-0'>
            {selectedModelInfo ? (
              <SmartModelIcon
                modelId={selectedModelInfo.id}
                size={32}
                className="shadow-sm"
              />
            ) : (
              <div className='w-8 h-8 rounded-lg bg-muted-card/50 flex items-center justify-center flex-shrink-0'>
                <Cpu className='w-4 h-4 text-muted-foreground' />
              </div>
            )}
          </div>

          <div className='text-left min-w-0'>
            <div className='font-medium text-sm truncate'>
              {selectedModelInfo ? selectedModelInfo.name : 'Выберите модель'}
            </div>
            <div className='text-xs text-muted-foreground truncate'>
              {selectedModelInfo ? selectedModelInfo.id : 'Нет выбора'}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {errorMessage && (
        <div className='mt-2 p-2 rounded-lg bg-accent-rose-bg/30 border border-accent-rose-border/30 text-xs text-foreground flex items-center gap-2 animate-fade-in'>
          <AlertCircle className='w-3.5 h-3.5 text-accent-rose flex-shrink-0' />
          <span className='font-medium'>Ошибка:</span> {errorMessage}
        </div>
      )}

      {isOpen && (
        <>
          <div className='fixed inset-0 z-40' onClick={() => setIsOpen(false)} />
          <div className='absolute top-full left-0 right-0 mt-2 z-50 max-h-80 overflow-y-auto rounded-xl border border-border bg-card shadow-lg scrollbar-thin divide-y divide-border/50'>
            {isLoading ? (
              <div className='p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2'>
                <div className='w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin' />
                Загрузка моделей...
              </div>
            ) : models.length === 0 && !errorMessage ? (
              <div className='p-4 text-center text-sm text-muted-foreground'>
                Бесплатные модели недоступны
              </div>
            ) : (
              <div className='p-2 space-y-2'>
                {models.map((model, index) => {
                  const animationDelay = `${Math.min(index * 0.03, 0.3)}s`;
                  return (
                    <div
                      key={model.id}
                      className='transform transition-all duration-200 hover:scale-[1.01] animate-fade-in'
                      style={{ animationDelay }}
                    >
                      <ModelCard
                        model={model}
                        isSelected={selectedModel === model.id}
                        onSelect={(info) => {
                          onModelChange(info.id);
                          setIsOpen(false);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
