import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface LoadingStateProps {
  message?: string;
  variant?: 'spinner' | 'cards' | 'table';
  count?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  variant = 'spinner',
  count = 3,
}) => {
  const { t } = useLanguage();
  const displayMessage = message || t('loadingTitle');

  if (variant === 'cards') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4 space-y-4">
            <div className="aspect-[4/3] w-full bg-neutral-100 rounded-lg" />
            <div className="space-y-2">
              <div className="h-3 w-1/3 bg-neutral-200 rounded" />
              <div className="h-4 w-3/4 bg-neutral-200 rounded" />
              <div className="h-4 w-1/4 bg-neutral-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="w-full bg-white rounded-xl border border-neutral-200 overflow-hidden animate-pulse">
        <div className="h-12 bg-neutral-100 border-b border-neutral-200" />
        <div className="p-4 space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-8 bg-neutral-100 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Loader2 className="w-8 h-8 text-neutral-800 animate-spin mb-3" />
      <p className="text-sm font-medium text-neutral-600">{displayMessage}</p>
    </div>
  );
};
