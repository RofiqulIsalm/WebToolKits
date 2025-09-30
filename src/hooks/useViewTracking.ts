import { useState, useEffect } from 'react';

interface ViewCount {
  path: string;
  count: number;
  lastViewed: string;
}

export const useViewTracking = () => {
  const [viewCounts, setViewCounts] = useState<ViewCount[]>([]);

  useEffect(() => {
    // Load view counts from localStorage on mount
    const savedCounts = localStorage.getItem('calculatorViewCounts');
    if (savedCounts) {
      setViewCounts(JSON.parse(savedCounts));
    }
  }, []);

  const trackView = (path: string) => {
    setViewCounts(prevCounts => {
      const existingIndex = prevCounts.findIndex(item => item.path === path);
      let newCounts;

      if (existingIndex >= 0) {
        // Update existing count
        newCounts = [...prevCounts];
        newCounts[existingIndex] = {
          ...newCounts[existingIndex],
          count: newCounts[existingIndex].count + 1,
          lastViewed: new Date().toISOString()
        };
      } else {
        // Add new entry
        newCounts = [...prevCounts, {
          path,
          count: 1,
          lastViewed: new Date().toISOString()
        }];
      }

      // Save to localStorage
      localStorage.setItem('calculatorViewCounts', JSON.stringify(newCounts));
      return newCounts;
    });
  };

  const getTopCalculators = (limit: number = 5) => {
    return viewCounts
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  };

  const getViewCount = (path: string) => {
    const item = viewCounts.find(item => item.path === path);
    return item ? item.count : 0;
  };

  return {
    trackView,
    getTopCalculators,
    getViewCount,
    viewCounts
  };
};