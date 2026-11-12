import React from 'react';
import { PackageOpen } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-sm mx-auto my-6 border border-dashed border-neutral-200 rounded-xl bg-white">
      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 mb-4">
        {icon || <PackageOpen className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-semibold text-neutral-900 mb-1">
        {title || t('noResultsFound')}
      </h3>
      <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
        {description || 'There are no items matching your criteria in the store currently.'}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
