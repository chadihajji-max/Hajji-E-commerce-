import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center max-w-md mx-auto my-8 bg-rose-50/50 border border-rose-200 rounded-xl">
      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-neutral-900 mb-1">
        {title || t('errorTitle')}
      </h3>
      <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
        {message || 'Unable to retrieve data. Please check connection or try again.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t('retry')}</span>
        </button>
      )}
    </div>
  );
};
