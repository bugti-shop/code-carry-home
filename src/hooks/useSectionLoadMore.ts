import { useState, useCallback } from 'react';

const PAGE_SIZE = 30;

/**
 * Manages per-section "load more" pagination state.
 * Each section independently tracks how many items to show.
 */
export const useSectionLoadMore = () => {
  const [limits, setLimits] = useState<Record<string, number>>({});

  const getLimit = useCallback((sectionId: string) => {
    return limits[sectionId] ?? PAGE_SIZE;
  }, [limits]);

  const loadMore = useCallback((sectionId: string) => {
    setLimits(prev => ({
      ...prev,
      [sectionId]: (prev[sectionId] ?? PAGE_SIZE) + PAGE_SIZE,
    }));
  }, []);

  const sliceItems = useCallback(<T,>(sectionId: string, items: T[]): { visible: T[]; hasMore: boolean; remaining: number } => {
    const limit = limits[sectionId] ?? PAGE_SIZE;
    return {
      visible: items.slice(0, limit),
      hasMore: items.length > limit,
      remaining: Math.max(0, items.length - limit),
    };
  }, [limits]);

  return { getLimit, loadMore, sliceItems };
};
