// src/pages/AverageCalculator.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart2,
  RotateCcw,
  Share2,
  Copy,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import { generateCalculatorSchema } from "../utils/seoData";
import RelatedCalculators from "../components/RelatedCalculators";

/* ============================================================
   📦 Constants & Utilities
   ============================================================ */
const LS_KEY = "average_calculator_state_v1";
const URL_KEY = "ac";

const toNums = (s: string): number[] => {
  if (!s) return [];
  return s
    .split(/[\s,;|\n]+/)
    .map((t) => parseFloat(t))
    .filter((v) => Number.isFinite(v));
};

const safeFixed = (n: number, d = 4) =>
  Number.isFinite(n) ? Number(n.toFixed(d)).toLocaleString() : "—";

const summarizeModes = (arr: number[]): number[] => {
  if (arr.length === 0) return [];
  const map = new Map<number, number>();
  for (const v of arr) map.set(v, (map.get(v) || 0) + 1);
  const max = Math.max(...map.values());
  const modes = [...map.entries()].filter(([, c]) => c === max).map(([v]) => v);
  return modes.sort((a, b) => a - b);
};

type VarianceType = "population" | "sample";

/* Bin numeric data for a compact bar chart */
const makeBars = (values: number[]) => {
  if (values.length === 0) return [];
  const unique = new Set(values.map((v) => Number(v.toFixed(2))));
  // If few unique values, show exact frequencies; else bin to ~10 bins
  if (unique.size <= 20) {
    const freq = new Map<number, number>();
    for (const v of values.map((x) => Number(x.toFixed(2))))
      freq.set(v, (freq.get(v) || 0) + 1);
    return [...freq.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([x, y]) => ({ label: x.toString(), count: y }));
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const bins = 10;
  const width = (max - min) / bins || 1;
  const counts = Array.from({ length: bins }, () => 0);
  for (const v of values) {
    const idx = Math.min(bins - 1, Math.floor((v - min) / width));
    counts[idx]++;
  }
  return counts.map((c, i) => {
    const start = min + i * width;
    const end = start + width;
    return { label: `${start.toFixed(2)}–${end.toFixed(2)}`, count: c };
  });
};

/* Weighted mean helper (only mean is weighted; others remain unweighted) */
const weightedMean = (values: number[], weights: number[]) => {
  const wsum = weights.reduce((s, w) => s + w, 0);
  if (values.length === 0 || wsum === 0) return NaN;
  let acc = 0;
  for (let i = 0; i < values.length; i++) acc += values[i] * (weights[i] || 0);
  return acc / wsum;
};

/* ============================================================
   🧮 Component
   ============================================================ */
const AverageCalculator: React.FC = () => {
  // Inputs
  const [valuesStr, setValuesStr] = useState<string>("");
  const [useWeights, setUseWeights] = useState<boolean>(false);
  const [weightsStr, setWeightsStr] = useState<string>("");
  const [varType, setVarType] = useState<VarianceType>("population");

  // UI state
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [showSteps, setShowSteps] = useState<boolean>(false);
  const [activeTip, setActiveTip] = useState<number>(0);
  const [hydrated, setHydrated] = useState<boolean>(false);

  const isDefault = !valuesStr && !weightsStr && !useWeights && varType === "population";

  /* 🔁 Hydration & Persistence */
  const applyState = (s: any) => {
    setValuesStr(String(s.valuesStr || ""));
    setUseWeights(Boolean(s.useWeights));
    setWeightsStr(String(s.weightsStr || ""));
    setVarType((s.varType as VarianceType) || "population");
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromURL = params.get(URL_KEY);
      if (fromURL) {
        applyState(JSON.parse(atob(fromURL)));
        setHydrated(true);
        return;
      }
      const raw = localStorage.getItem(LS_KEY);
      if (raw) applyState(JSON.parse(raw));
    } catch (e) {
      console.warn("Failed to load avg calc state:", e);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const state = { valuesStr, useWeights, weightsStr, varType };
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Failed to persist avg calc:", e);
    }
  }, [hydrated, valuesStr, useWeights, weightsStr, varType]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const url = new URL(window.location.href);
      const allZero = !valuesStr && !weightsStr && !useWeights && varType === "population";
      if (allZero) {
        url.searchParams.delete(URL_KEY);
        window.history.replaceState({}, "", url);
        return;
      }
      const encoded = btoa(JSON.stringify({ valuesStr, useWeights, weightsStr, varType }));
      url.searchParams.set(URL_KEY, encoded);
      window.history.replaceState({}, "", url);
    } catch (e) {
      console.warn("Failed to update URL:", e);
    }
  }, [hydrated, valuesStr, useWeights, weightsStr, varType]);

  /* 🧠 Calculations */
  const values = useMemo(() => toNums(valuesStr), [valuesStr]);
  const weights = useMemo(() => toNums(weightsStr), [weightsStr]);

  const sorted = useMemo(() => [...values].sort((a, b) => a - b), [values]);

  const count = values.length;
  const sum = values.reduce((s, v) => s + v, 0);
  const mean = count ? sum / count : NaN;

  const median = useMemo(() => {
    if (count === 0) return NaN;
    const mid = Math.floor(count - 1) / 2;
    return count % 2
      ? sorted[Math.floor(mid)]
      : (sorted[count / 2 - 1] + sorted[count / 2]) / 2;
  }, [sorted, count]);

  const modes = useMemo(() => summarizeModes(values), [values]);
  const min = count ? Math.min(...values) : NaN;
  const max = count ? Math.max(...values) : NaN;
  const range = Number.isFinite(min) && Number.isFinite(max) ? max - min : NaN;

  const variance = useMemo(() => {
    if (count === 0 || (varType === "sample" && count < 2)) return NaN;
    const m = mean;
    const sq = values.reduce((s, v) => s + Math.pow(v - m, 2), 0);
    return varType === "population" ? sq / count : sq / (count - 1);
  }, [values, mean, varType, count]);

  const stdDev = Number.isFinite(variance) ? Math.sqrt(variance) : NaN;

  const wMean = useMemo(() => {
    if (!useWeights) return NaN;
    if (values.length === 0) return NaN;
    // Align arrays silently; extra weights are ignored; missing weights treated as 0
    return weightedMean(values, weights);
  }, [useWeights, values, weights]);

  const bars = useMemo(() => makeBars(values), [values]);

  /* 💡 Tips */
  const tips = useMemo(
    () => [
      "Tip: Mean is sensitive to outliers; median isn’t.",
      "Tip: Use sample variance (n−1) when data is a sample from a larger population.",
      "Tip: A dataset can be bimodal or multimodal (more than one mode).",
      "Tip: Range = max − min; standard deviation shows typical spread.",
      "Tip: Weighted mean uses weights as importance or frequency.",
    ],
    []
  );

  useEffect(() => {
    const id = setInterval(() => setActiveTip((p) => (p + 1) % tips.length), 5000);
    return () => clearInterval(id);
  }, [tips.length]);

  /* 🔗 Copy / Share / Reset */
  const copyResults = async () => {
    const text = [
      "Average Calculator",
      `Count: ${count}`,
      `Sum: ${safeFixed(sum)}`,
      `Mean: ${safeFixed(mean)}`,
      useWeights ? `Weighted Mean: ${safeFixed(wMean)}` : undefined,
      `Median: ${safeFixed(median)}`,
      `Mode(s): ${modes.length ? modes.join(", ") : "—"}`,
      `Min: ${safeFixed(min)}  Max: ${safeFixed(max)}  Range: ${safeFixed(range)}`,
      `Variance (${varType}): ${safeFixed(variance)}`,
      `Std Dev (${varType}): ${safeFixed(stdDev)}`,
    ]
      .filter(Boolean)
      .join("\n");
    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    const encoded = btoa(JSON.stringify({ valuesStr, useWeights, weightsStr, varType }));
    url.searchParams.set(URL_KEY, encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  const reset = () => {
    setValuesStr("");
    setUseWeights(false);
    setWeightsStr("");
    setVarType("population");
    setShowSteps(false);
    localStorage.removeItem(LS_KEY);
  };

  /* ============================================================
     🎨 Render
     ============================================================ */
  return (
    <>
      <SEOHead
        title="Average Calculator | Mean, Median, Mode, Range & Standard Deviation"
        description="Free Average Calculator: paste numbers to get mean, median, mode, range, variance, and standard deviation. Supports weighted mean, shareable link, and chart."
        canonical="https://calculatorhub.site/average-calculator"
        schemaData={generateCalculatorSchema(
          "Average Calculator",
          "Compute mean, median, mode, range, variance, and standard deviation with optional weighted mean.",
          "/average-calculator",
          [
            "average calculator",
            "mean median mode",
            "variance standard deviation",
            "weighted average",
            "math tools",
          ]
        )}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* OG/Twitter minimal set (SEOHead may already include equivalents) */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Average Calculator | Mean, Median, Mode, Range & Standard Deviation" />
      <meta property="og:url" content="https://calculatorhub.site/average-calculator" />
      <meta
        property="og:description"
        content="Paste numbers to instantly get mean, median, mode, range, variance, std dev. Weighted mean & chart included."
      />
      <meta property="og:image" content="https://calculatorhub.site/images/average-calculator-hero.webp" />
      <meta name="twitter:card" content="summary_large_image" />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Math Tools", url: "/category/math-tools" },
            { name: "Average Calculator", url: "/average-calculator" },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            📊 Average Calculator (Mean • Median • Mode)
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Paste numbers and get <strong>mean, median, mode, range, variance</strong> and{" "}
            <strong>standard deviation</strong> instantly. Optionally compute a <strong>weighted mean</strong>.
            Copy results or share a link to your dataset.
          </p>
        </div>

        {/* Promo bar */}
        <div className="hidden sm:flex mt-6 mb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white rounded-lg shadow-lg p-4 items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-lg">Explore more math tools 🧮</p>
            <p className="text-sm text-indigo-100">Try Percentage, Ratio, or Standard Deviation calculators next!</p>
          </div>
          <a
            href="/category/math-tools"
            className="bg-white text-indigo-700 font-semibold px-4 py-2 rounded-md hover:bg-indigo-50 transition"
          >
            Browse Math Tools
          </a>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 relative text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-sky-400" /> Inputs
              </h2>
              <button
                onClick={reset}
                className="flex items-center gap-1 text-sm text-slate-300 border border-[#334155] rounded-lg px-2 py-1 hover:bg-[#0f172a] hover:text-white transition"
                disabled={isDefault}
              >
                <RotateCcw className="h-4 w-4 text-indigo-400" /> Reset
              </button>
            </div>

            <div className="space-y-5">
              {/* Values */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">Numbers</label>
                  <Info className="h-4 w-4 text-slate-400" title="Separate with spaces, commas, semicolons, or new lines." />
                </div>
                <textarea
                  rows={5}
                  value={valuesStr}
                  onChange={(e) => setValuesStr(e.target.value)}
                  placeholder="e.g., 12 15 19 20 21 21 25"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    "10 12 14 16 18 20",
                    "2, 2, 3, 3, 3, 8, 12",
                    "5;7;7;7;9;12;15;22",
                  ].map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setValuesStr(s)}
                      className="text-xs bg-[#0f172a] border border-[#334155] rounded px-2 py-1 hover:border-indigo-500"
                    >
                      Sample {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weighted mean toggle */}
              <div className="flex items-center gap-2">
                <input
                  id="useWeights"
                  type="checkbox"
                  checked={useWeights}
                  onChange={(e) => setUseWeights(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="useWeights" className="text-sm text-slate-300">
                  Use weights (for weighted mean only)
                </label>
              </div>

              {/* Weights */}
              {useWeights && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-slate-300">Weights</label>
                    <Info
                      className="h-4 w-4 text-slate-400"
                      title="Provide one weight per number. Extra weights ignored; missing weights treated as 0."
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={weightsStr}
                    onChange={(e) => setWeightsStr(e.target.value)}
                    placeholder="e.g., 1 1 2 3 1 1 1"
                    className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Variance type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Variance / Std Dev Type</label>
                <select
                  value={varType}
                  onChange={(e) => setVarType(e.target.value as VarianceType)}
                  className="w-full bg-[#0f172a] text-white text-sm px-3 py-2 border border-[#334155] rounded-md focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="population">Population (divide by n)</option>
                  <option value="sample">Sample (divide by n − 1)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">Results</h2>
            <div className="space-y-6">
              {/* Summary tiles */}
              <div className="grid grid-cols-2 gap-4">
                <Tile label="Count" value={count} />
                <Tile label="Sum" value={safeFixed(sum)} />
                <Tile label="Mean" value={safeFixed(mean)} />
                <Tile label="Median" value={safeFixed(median)} />
                <Tile label="Mode(s)" value={modes.length ? modes.join(", ") : "—"} />
                <Tile label="Min" value={safeFixed(min)} />
                <Tile label="Max" value={safeFixed(max)} />
                <Tile label="Range" value={safeFixed(range)} />
                <Tile label={`Variance (${varType})`} value={safeFixed(variance)} />
                <Tile label={`Std Dev (${varType})`} value={safeFixed(stdDev)} />
                {useWeights && <Tile label="Weighted Mean" value={safeFixed(wMean)} />}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={copyResults}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm"
                >
                  <Copy size={16} /> Copy Results
                </button>
                <button
                  onClick={copyShareLink}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm"
                >
                  <Share2 size={16} /> Copy Link
                </button>
                {copied !== "none" && (
                  <span className="text-emerald-400 text-sm">
                    {copied === "results" ? "Results copied!" : "Link copied!"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Smart Tip */}
        <div className="mt-4 w-full relative">
          <div className="bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm min-h-[50px] w-full flex items-center">
            <div className="mr-3 flex items-center justify-center w-8 h-8">
              <span className="text-2xl text-indigo-400">💡</span>
            </div>
            <div className="w-full">
              <p className="text-base font-medium leading-snug text-slate-300">
                {tips[activeTip]}
              </p>
            </div>
          </div>
        </div>

        {/* Chart */}
        {values.length > 0 && (
          <div className="mt-5 bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              Frequency Distribution
            </h3>
            <div className="w-full h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bars}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <ReTooltip />
                  <Legend />
                  <Bar dataKey="count" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Steps (collapsible) */}
        <div className="mt-10 bg-gradient-to-br from-[#1e293b] via-[#111827] to-[#0f172a] rounded-2xl border border-indigo-600/40 shadow-xl overflow-hidden">
          <button
            onClick={() => setShowSteps((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold text-lg tracking-wide hover:opacity-90 transition-all"
          >
            <span>🧮 Step-by-step</span>
            {showSteps ? <ChevronUp /> : <ChevronDown />}
          </button>

          {showSteps && (
            <div className="px-6 pb-8 pt-4 space-y-3 text-slate-200">
              {/* Mean */}
              <h4 className="font-semibold text-cyan-300">Mean (Average)</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Add all numbers: Σx = {safeFixed(sum)}</li>
                <li>Count values: n = {count}</li>
                <li>Mean = Σx ÷ n = {safeFixed(mean)}</li>
              </ol>

              {/* Weighted mean */}
              {useWeights && (
                <>
                  <h4 className="font-semibold text-cyan-300">Weighted Mean</h4>
                  <p>Mean<sub>w</sub> = Σ(x·w) ÷ Σw = {safeFixed(wMean)}</p>
                </>
              )}

              {/* Median */}
              <h4 className="font-semibold text-cyan-300">Median</h4>
              <p>
                Sort values. If n is odd, take middle; if even, average the two middle values.
                Median = {safeFixed(median)}.
              </p>

              {/* Variance / Std Dev */}
              <h4 className="font-semibold text-cyan-300">Variance & Standard Deviation</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Subtract mean: (x − μ) and square each.</li>
                <li>
                  {varType === "population"
                    ? "Population variance: Σ(x − μ)² ÷ n"
                    : "Sample variance: Σ(x − x̄)² ÷ (n − 1)"}{" "}
                  = {safeFixed(variance)}.
                </li>
                <li>Std Dev = √variance = {safeFixed(stdDev)}.</li>
              </ol>

              <div className="h-2 w-full mt-6 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 blur-[2px]" />
            </div>
          )}
        </div>

        {/* Short SEO content */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          <h1 className="text-3xl font-bold text-cyan-400 mb-6">
            Average Calculator – Mean, Median, Mode & Spread
          </h1>
          <p>
            Paste or type numbers and instantly get <strong>mean</strong>, <strong>median</strong>,{" "}
            <strong>mode</strong>, <strong>range</strong>, <strong>variance</strong>, and{" "}
            <strong>standard deviation</strong>. Toggle between <em>population</em> and{" "}
            <em>sample</em> formulas and optionally compute a <em>weighted mean</em>. Share a link to
            reproduce the same dataset and results.
          </p>
        </section>

        {/* Author/backlinks & related tools */}
        <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              🚀 Explore more tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/percentage-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
              >
                % Percentage Calculator
              </Link>
              <Link
                to="/ratio-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-400 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
              >
                ➗ Ratio Calculator
              </Link>
              <Link
                to="/standard-deviation-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-pink-600/20 text-pink-300 hover:text-pink-400 px-3 py-2 rounded-md border border-slate-700 hover:border-pink-500 transition-all duration-200"
              >
                σ Standard Deviation
              </Link>
            </div>
          </div>
        </section>

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/average-calculator" category="math-tools" />
      </div>
    </>
  );
};

/* ============================================================
   🧩 Small UI helpers
   ============================================================ */
const Tile: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155] shadow-sm">
    <div className="text-sm text-slate-400">{label}</div>
    <div className="text-lg font-semibold text-white break-words">{value}</div>
  </div>
);

export default AverageCalculator;
