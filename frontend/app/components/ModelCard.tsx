'use client';

import { Check, Cog } from 'lucide-react';
import SmartModelIcon from './SmartModelIcon';
import type { ModelInfo } from '../types';

interface ModelCardProps {
  model: ModelInfo;
  isSelected?: boolean;
  onSelect?: (model: ModelInfo) => void;
}

function ModelCard({ model, isSelected = false, onSelect }: ModelCardProps) {
  const getProviderInitials = (modelId: string): string => {
    const provider = modelId.split('/')[0] || '';
    return provider.substring(0, 2).toUpperCase();
  };

  return (
    <button
      type='button'
      className={`w-full text-left relative p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-primary ${
        isSelected
          ? 'bg-primary/10 border-primary shadow-md shadow-primary/10'
          : 'bg-card hover:bg-card-hover border-border hover:border-primary/30'
      }`}
      onClick={() => onSelect?.(model)}
      aria-pressed={isSelected}
      aria-label={`Выберите модель: ${model.name}`}
    >
      <div className='flex items-start gap-3'>
        <div className='relative shrink-0'>
          <SmartModelIcon modelId={model.id} size={40} />
          {isSelected && (
            <div className='absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-card flex items-center justify-center animate-scale-in'>
              <Check className='w-3 h-3 text-white' />
            </div>
          )}
        </div>
        <div className='flex-grow min-w-0'>
          <div className='flex items-center justify-between mb-1'>
            <h3 className='font-semibold text-sm truncate text-foreground' title={model.name}>
              {model.name}
            </h3>
            {isSelected && (
              <div className='text-primary shrink-0 ml-2'>
                <Check className='w-4 h-4' />
              </div>
            )}
          </div>

          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <span className='bg-muted-card px-2 py-0.5 rounded font-mono'>
              {getProviderInitials(model.id)}
            </span>
            <span>•</span>
            <span>ID: {model.id.split('/').pop()}</span>
          </div>

          <div className='mt-2 flex items-center gap-1 text-xs text-muted-foreground'>
            <Cog className='w-3 h-3' />
            <span>{model.context_length?.toLocaleString() || 'N/A'} токенов</span>
          </div>
        </div>

      </div>
    </button>
  );
}

export default ModelCard;
