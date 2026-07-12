'use client';

import React from 'react';
import { Cpu } from 'lucide-react';
import * as Icons from '@lobehub/icons';

interface SmartModelIconProps {
  modelId: string;
  size?: number;
  className?: string;
}

export default function SmartModelIcon({ modelId, size = 32, className = '' }: SmartModelIconProps) {
  if (!modelId) return null;

  const id = modelId.toLowerCase();
  const provider = id.includes('/') ? id.split('/')[0] : '';
  const iconMap: Record<string, any> = {
    anthropic: Icons.Anthropic || Icons.Claude,
    google: Icons.Google || Icons.Gemini,
    openai: Icons.OpenAI,
    meta: Icons.Meta,
    mistral: Icons.Mistral,
    mistralai: Icons.Mistral,
    cohere: Icons.Cohere,
    tencent: Icons.Tencent,
    deepseek: Icons.DeepSeek,
    groq: Icons.Groq,
    openrouter: Icons.OpenRouter,
    ollama: Icons.Ollama,
    huggingface: Icons.HuggingFace,
    qwen: Icons.Qwen,
    alibaba: Icons.Alibaba || Icons.Qwen,
    nvidia: Icons.Nvidia,
    chatgpt: Icons.OpenAI,
    gpt: Icons.OpenAI,
    claude: Icons.Anthropic || Icons.Claude,
    gemini: Icons.Google || Icons.Gemini,
    llama: Icons.Meta,
    hunyuan: Icons.Tencent,
    poolside: Icons.Alibaba,
    liquid: Icons.Liquid
  };

  let TargetIcon = null;
  if (provider && iconMap[provider]) {
    TargetIcon = iconMap[provider];
  }
  else {
    for (const [key, icon] of Object.entries(iconMap)) {
      if (id.includes(key)) {
        TargetIcon = icon;
        break;
      }
    }
  }

  if (!TargetIcon) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-muted-card/50 rounded-lg flex items-center justify-center flex-shrink-0 border border-border/40 ${className}`}
      >
        <Cpu style={{ width: size * 0.5, height: size * 0.5 }} className='text-muted-foreground/70' />
      </div>
    );
  }

  const FinalIcon = TargetIcon.Avatar || TargetIcon;

  return (
    <div className='flex-shrink-0 overflow-hidden rounded-lg' style={{ width: size, height: size }}>
      <FinalIcon size={size} className={className} />
    </div>
  );
}
