// src/components/PageViewTracker.tsx
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

const VIEW_STORAGE_KEY = "ch_page_views_v2";

type ViewStore = Record<string, number[]>;

const PageViewTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const path = location.pathname;

    // Don't track admin or 404-like paths
    if (path.startsWith("/admin")) return;

    try {
      const raw = localStorage.getItem(VIEW_STORAGE_KEY);
      const data: ViewStore = raw ? JSON.parse(raw) : {};

      const now = Date.now();
      const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

      const prev = Array.isArray(data[path]) ? data[path] : [];
      // Keep only last 90 days so localStorage doesn't explode
      const cleaned = prev.filter(
        (ts) => typeof ts === "number" && ts >= ninetyDaysAgo
      );

      cleaned.push(now);
      data[path] = cleaned;

      localStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore tracking errors
    }
  }, [location.pathname]);

  return null;
};

export default PageViewTracker;
