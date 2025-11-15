// src/components/CalculatorGuard.tsx
import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { AlertTriangle, Home, BarChart3 } from "lucide-react";
import { useSiteConfig } from "../config/siteConfig";

const VIEW_COUNT_KEY = "ch_calc_view_counts";

type ViewCountMap = Record<string, number>;

interface CalculatorGuardProps {
  children: React.ReactNode;
}

/**
 * Wrap any calculator page with this.
 * - Blocks rendering if that path is disabled in admin.
 * - Tracks views per path in localStorage for admin analytics.
 */
const CalculatorGuard: React.FC<CalculatorGuardProps> = ({ children }) => {
  const { config } = useSiteConfig();
  const location = useLocation();
  const path = location.pathname;

  const isDisabled = config.disabledCalculators.includes(path);

  // Track views for stats in admin dashboard
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isDisabled) return; // don't count views on disabled pages

    try {
      const raw = localStorage.getItem(VIEW_COUNT_KEY);
      let map: ViewCountMap = {};
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          map = parsed as ViewCountMap;
        }
      }
      map[path] = (map[path] ?? 0) + 1;
      localStorage.setItem(VIEW_COUNT_KEY, JSON.stringify(map));
    } catch {
      // ignore errors
    }
  }, [path, isDisabled]);

  if (isDisabled) {
    return (
      <div className="max-w-2xl mx-auto mt-16 glow-card bg-slate-950/90 border border-rose-500/40 rounded-2xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/15 border border-rose-400/60 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-300" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">
          This calculator is temporarily unavailable
        </h1>
        <p className="text-sm text-slate-300 mb-4">
          We’ve turned this calculator off for maintenance or updates. Please
          check back later or try another tool from CalculatorHub.
        </p>
        <div className="flex justify-center gap-3 text-sm">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500/90 hover:bg-sky-400 text-white font-medium shadow-lg shadow-sky-900/40 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to homepage
          </Link>
          <Link
            to="/category/currency-finance"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 hover:border-slate-500 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Browse calculators
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default CalculatorGuard;
