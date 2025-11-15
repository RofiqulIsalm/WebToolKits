// src/utils/calculatorStats.ts
export type CalculatorStat = {
  path: string;
  views: number;
};

const STATS_KEY = "ch_calculator_stats_v1";

function loadStatsMap(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveStatsMap(map: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

// 🚀 Called on each calculator page view
export function recordCalculatorView(path: string) {
  if (typeof window === "undefined") return;
  const map = loadStatsMap();
  map[path] = (map[path] || 0) + 1;
  saveStatsMap(map);
}

// Get views for one path
export function getViewsForPath(path: string): number {
  const map = loadStatsMap();
  return map[path] || 0;
}

// All stats as array (used in dashboard)
export function getAllStats(): CalculatorStat[] {
  const map = loadStatsMap();
  return Object.keys(map).map((path) => ({
    path,
    views: map[path] || 0,
  }));
}
