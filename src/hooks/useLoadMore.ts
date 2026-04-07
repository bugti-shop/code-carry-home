import { useState, useCallback, useMemo } from 'react';

const PAGE_SIZE = 30;

export const useLoadMore = <T>(items: T[], key?: string) => {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Reset when key changes (e.g. different section)
  const stableKey = key ?? '';

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = visibleCount < items.length;
  const remaining = Math.max(0, items.length - visibleCount);

  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + PAGE_SIZE);
  }, []);

  const reset = useCallback(() => {
    setVisibleCount(PAGE_SIZE);
  }, []);

  return { visibleItems, hasMore, remaining, loadMore, reset, totalCount: items.length };
};
