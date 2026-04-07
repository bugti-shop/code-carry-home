import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

interface LoadMoreButtonProps {
  remaining: number;
  onClick: () => void;
  className?: string;
}

export const LoadMoreButton = ({ remaining, onClick, className = '' }: LoadMoreButtonProps) => {
  const { t } = useTranslation();
  
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors ${className}`}
    >
      <ChevronDown className="h-4 w-4" />
      {t('common.loadMore', 'Load more')} ({remaining})
    </button>
  );
};
