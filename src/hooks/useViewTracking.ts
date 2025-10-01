import { useState, useEffect } from 'react';

interface ViewData {
  [path: string]: number;
}

export const useViewTracking = () => {
  const [viewData, setViewData] = useState<ViewData>({});

  useEffect(() => {
    // Load view data from localStorage
    const savedData = localStorage.getItem('calculator-views');
    if (savedData) {
      setViewData(JSON.parse(savedData));
    }
  }, []);

  const trackView = (path: string) => {
    setViewData(prev => {
      const newData = {
        ...prev,
        [path]: (prev[path] || 0) + 1
      };
      localStorage.setItem('calculator-views', JSON.stringify(newData));
      return newData;
    });
  };

  const getTopCalculators = (limit: number = 6) => {
    return Object.entries(viewData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([path, views]) => ({ path, views }));
  };

  return { viewData, trackView, getTopCalculators };
};