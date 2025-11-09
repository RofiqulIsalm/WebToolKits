// src/pages/StatisticsCalculator.tsx
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
  Settings2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  CartesianGrid,
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
const LS_KEY = "statistics_calculator_state_v1";
const URL_KEY = "sc";

const splitTokens = (s: string): string[] =>
  s
    .split(/[,\s;]+/g)
    .map((t) => t.trim())
    .filter(Boolean);

const parseNum = (t: string): number | null => {
  if (!t) return null;
  const v = Number(t.replace(/_/g, ""));
  return Number.isFinite(v) ? v : null;
};

const nf = (n: number, d = 6) =>
  Number.isFinite(n) ? Number(n.toFixed(d)).toLocaleString() : "—";

type Stats = {
  count: number;
  sum: number;
  mean: number;
  median: number;
  modes: number[];
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
  iqr: number;
  varPop: number;
  varSample: number;
  sdPop: number;
  sdSample: number;
  outlierLow: number;
  outlierHigh: number;
};

const computeStats = (arrIn: number[]): Stats | null => {
  const arr = arrIn.filter((x) => Number.isFinite(x)).slice().sort((a, b) => a - b);
  const n = arr.length;
  if (!n) return null;

  const sum = arr.reduce((s, v) => s + v, 0);
  const mean = sum / n;

  const median = n % 2 ? arr[(n - 1) / 2] : (arr[n / 2 - 1] + arr[n / 2]) / 2;

  // Q1, Q3 by Tukey (median of halves, exclude median if odd)
  const lower = arr.slice(0, Math.floor(n / 2));
  const upper = arr.slice(Math.ceil(n / 2));
  const med = (a: number[]) =>
    a.length === 0
      ? NaN
      : a.length % 2
      ? a[(a.length - 1) / 2]
      : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;

  const q1 = med(lower);
  const q3 = med(upper);
  const iqr = q3 - q1;

  const min = arr[0];
  const max = arr[n - 1];
  const range = max - min;

  // variance & sd
  let m2 = 0;
  for (const x of arr) {
    const d = x - mean;
    m2 += d * d;
  }
  const varPop = m2 / n;
  const varSample = n > 1 ? m2 / (n - 1) : NaN;
  const sdPop = Math.sqrt(varPop);
  const sdSample = Math.sqrt(varSample);

  // modes (allow multi)
  const freq = new Map<number, number>();
  for (const x of arr) freq.set(x, (freq.get(x) || 0) + 1);
  const maxF = Math.max(...freq.values());
  const modes =
    maxF <= 1 ? [] : [...freq.entries()].filter(([, c]) => c === maxF).map(([k]) => k);

  const outlierLow = q1 - 1.5 * iqr;
  const outlierHigh = q3 + 1.5 * iqr;

  return {
    count: n,
    sum,
    mean,
    median,
    modes,
    min,
    max,
    range,
    q1,
    q3,
    iqr,
    varPop,
    varSample,
    sdPop,
    sdSample,
    outlierLow,
    outlierHigh,
  };
};

// Percentile (0–100), linear interpolation at rank r = p/100*(n-1)
const percentileAt = (sorted: number[], p: number) => {
  const n = sorted.length;
  if (!n) return NaN;
  if (p <= 0) return sorted[0];
  if (p >= 100) return sorted[n - 1];
  const r = (p / 100) * (n - 1);
  const i = Math.floor(r);
  const frac = r - i;
  return i + 1 < n ? sorted[i] + frac * (sorted[i + 1] - sorted[i]) : sorted[i];
};

const buildHistogram = (sorted: number[], bins: number) => {
  const n = sorted.length;
  if (!n || bins < 1) return [];
  const min = sorted[0];
  const max = sorted[n - 1];
  const width = (max - min) / bins || 1;

  const data: { bin: string; count: number; from: number; to: number }[] = [];
  for (let b = 0; b < bins; b++) {
    const from = min + b * width;
    const to = b === bins - 1 ? max : from + width;
    data.push({ bin: `${nf(from, 2)} – ${nf(to, 2)}`, count: 0, from, to });
  }

  let idx = 0;
  for (const x of sorted) {
    while (idx < bins - 1 && x > data[idx].to) idx++;
    data[idx].count++;
  }
  return data;
};

/* ============================================================
   🧮 Component
   ============================================================ */
const StatisticsCalculator: React.FC = () => {
  // Inputs
  const [input, setInput] = useState<string>("1 2 2 3, 4; 6 9 9 10 12 15");
  const [bins, setBins] = useState<number>(8);
  const [useSample, setUseSample] = useState<boolean>(true);
  const [percentileText, setPercentileText] = useState<string>("10,25,50,75,90");

  // UI
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [showSteps, setShowSteps] = useState<boolean>(false);
  const [activeTip, setActiveTip] = useState<number>(0);

  const isDefault =
    input === "1 2 2 3, 4; 6 9 9 10 12 15" &&
    bins === 8 &&
    useSample === true &&
    percentileText === "10,25,50,75,90";

  /* 🔁 Hydration & Persistence */
  const applyState = (s: any) => {
    if (typeof s?.input === "string") setInput(s.input);
    if (Number.isFinite(s?.bins)) setBins(Math.max(1, Math.min(50, Math.floor(s.bins))));
    if (typeof s?.useSample === "boolean") setUseSample(s.useSample);
    if (typeof s?.percentileText === "string") setPercentileText(s.percentileText);
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
      console.warn("Failed to load stats state:", e);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ input, bins, useSample, percentileText }));
    } catch {}
  }, [hydrated, input, bins, useSample, percentileText]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const url = new URL(window.location.href);
      if (isDefault) {
        url.searchParams.delete(URL_KEY);
        window.history.replaceState({}, "", url);
      } else {
        const encoded = btoa(JSON.stringify({ input, bins, useSample, percentileText }));
        url.searchParams.set(URL_KEY, encoded);
        window.history.replaceState({}, "", url);
      }
    } catch (e) {
      console.warn("Failed to update URL:", e);
    }
  }, [hydrated, input, bins, useSample, percentileText, isDefault]);

  /* 🧠 Parse & compute */
  const tokens = useMemo(() => splitTokens(input), [input]);
  const nums = useMemo(
    () => tokens.map(parseNum).filter((v): v is number => v !== null),
    [tokens]
  );
  const stats = useMemo(() => computeStats(nums), [nums]);
  const sorted = useMemo(() => nums.slice().sort((a, b) => a - b), [nums]);

  const pList = useMemo(() => {
    const raw = splitTokens(percentileText);
    const vals = raw
      .map((t) => Number(t))
      .filter((p) => Number.isFinite(p) && p >= 0 && p <= 100)
      .slice(0, 20);
    return vals;
  }, [percentileText]);

  const percentiles = useMemo(() => {
    if (!stats) return [];
    return pList.map((p) => ({ p, value: percentileAt(sorted, p) }));
  }, [pList, sorted, stats]);

  const histo = useMemo(
    () => (stats ? buildHistogram(sorted, Math.max(1, Math.min(50, bins))) : []),
    [stats, sorted, bins]
  );

  /* 💡 Tips */
  const tips = useMemo(
    () => [
      "Tip: Paste numbers separated by spaces, commas, or semicolons.",
      "Tip: Toggle Sample vs Population for variance & std dev.",
      "Tip: Set custom percentiles like 1,5,10,90,95,99.",
      "Tip: IQR = Q3 − Q1. Outliers ≶ Q1−1.5×IQR or Q3+1.5×IQR.",
      "Tip: Increase bins for a smoother histogram.",
    ],
    []
  );

  useEffect(() => {
    const id = setInterval(() => setActiveTip((p) => (p + 1) % tips.length), 5000);
    return () => clearInterval(id);
  }, [tips.length]);

  /* 🔗 Copy / Share / Reset */
  const copyResults = async () => {
    const lines: string[] = [];
    lines.push("Statistics Calculator");
    lines.push(`Count: ${stats?.count ?? 0}`);
    lines.push(`Sum: ${nf(stats?.sum ?? NaN, 6)}`);
    lines.push(`Mean: ${nf(stats?.mean ?? NaN, 6)}`);
    lines.push(`Median: ${nf(stats?.median ?? NaN, 6)}`);
    lines.push(
      `Min: ${nf(stats?.min ?? NaN, 6)}  Max: ${nf(stats?.max ?? NaN, 6)}  Range: ${nf(
        stats?.range ?? NaN,
        6
      )}`
    );
    if (stats?.modes?.length) lines.push(`Mode(s): ${stats.modes.join(", ")}`);
    lines.push(
      `Q1: ${nf(stats?.q1 ?? NaN, 6)}  Q3: ${nf(stats?.q3 ?? NaN, 6)}  IQR: ${nf(
        stats?.iqr ?? NaN,
        6
      )}`
    );
    if (stats) {
      const v = useSample ? stats.varSample : stats.varPop;
      const sd = useSample ? stats.sdSample : stats.sdPop;
      lines.push(`${useSample ? "Sample" : "Population"} Variance: ${nf(v, 6)}`);
      lines.push(`${useSample ? "Sample" : "Population"} Std Dev: ${nf(sd, 6)}`);
    }
    if (percentiles.length) {
      lines.push(
        `Percentiles: ${percentiles.map(({ p, value }) => `${p}%=${nf(value, 6)}`).join(", ")}`
      );
    }
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    const encoded = btoa(JSON.stringify({ input, bins, useSample, percentileText }));
    url.searchParams.set(URL_KEY, encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  const reset = () => {
    setInput(" ");
    setBins(8);
    setUseSample(true);
    setPercentileText(" ");
    setShowSteps(false);
    localStorage.removeItem(LS_KEY);
  };

  /* ============================================================
     🎨 Render
     ============================================================ */
  return (
    <>
      {/** ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Statistics Calculator — Mean, Median, Mode, Variance, Std Dev, Quartiles (2025–2026)"
        description="Paste numbers separated by space/comma/semicolon to compute mean, median, mode, variance (sample/population), standard deviation, quartiles, IQR, custom percentiles, histogram, and a compact box plot. Share state via URL."
        keywords={[
          "statistics calculator",
          "descriptive statistics",
          "mean median mode",
          "variance standard deviation",
          "sample vs population",
          "quartiles IQR",
          "percentiles",
          "histogram",
          "box plot",
          "math tools"
        ]}
        canonical="https://calculatorhub.site/statistics-calculator"
        schemaData={[
          // 1) WebPage + Article
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://calculatorhub.site/statistics-calculator#webpage",
            "url": "https://calculatorhub.site/statistics-calculator",
            "name": "Statistics Calculator (2025–2026) — Mean, Median, Mode, Variance, Std Dev, Quartiles",
            "inLanguage": "en",
            "isPartOf": { "@id": "https://calculatorhub.site/#website" },
            "primaryImageOfPage": {
              "@type": "ImageObject",
              "@id": "https://calculatorhub.site/images/statistics-calculator-hero.webp#primaryimg",
              "url": "https://calculatorhub.site/images/statistics-calculator-hero.webp",
              "width": 1200,
              "height": 675
            },
            "mainEntity": {
              "@type": "Article",
              "@id": "https://calculatorhub.site/statistics-calculator#article",
              "headline": "Statistics Calculator — Descriptive analytics with visuals",
              "description": "Compute descriptive stats (mean, median, mode), variance and standard deviation (sample or population), quartiles, IQR, custom percentiles, histogram, and box plot. Paste numbers separated by spaces/commas/semicolons. Invalid tokens are ignored.",
              "image": ["https://calculatorhub.site/images/statistics-calculator-hero.webp"],
              "author": { "@type": "Organization", "name": "CalculatorHub", "url": "https://calculatorhub.site" },
              "publisher": { "@id": "https://calculatorhub.site/#organization" },
              "datePublished": "2025-11-09",
              "dateModified": "2025-11-09",
              "mainEntityOfPage": { "@id": "https://calculatorhub.site/statistics-calculator#webpage" },
              "articleSection": [
                "How to Use",
                "Parsing & Validation",
                "Descriptive Statistics",
                "Sample vs Population",
                "Percentiles",
                "Histogram",
                "Box Plot",
                "FAQ"
              ]
            }
          },
      
          // 2) Breadcrumbs
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "@id": "https://calculatorhub.site/statistics-calculator#breadcrumbs",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://calculatorhub.site/" },
              { "@type": "ListItem", "position": 2, "name": "Math Tools", "item": "https://calculatorhub.site/category/math-tools" },
              { "@type": "ListItem", "position": 3, "name": "Statistics Calculator", "item": "https://calculatorhub.site/statistics-calculator" }
            ]
          },
      
          // 3) FAQ
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://calculatorhub.site/statistics-calculator#faq",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How should I format the input numbers?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Paste numbers separated by spaces, commas, or semicolons. Invalid tokens are ignored."
                }
              },
              {
                "@type": "Question",
                "name": "What’s the difference between sample and population metrics?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Sample variance/SD use n−1 in the denominator. Population variance/SD use n. Toggle the option to switch."
                }
              },
              {
                "@type": "Question",
                "name": "How are quartiles, IQR, and outliers computed?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Quartiles use Tukey’s method (median of halves). IQR = Q3 − Q1. Outliers are values < Q1 − 1.5×IQR or > Q3 + 1.5×IQR."
                }
              },
              {
                "@type": "Question",
                "name": "How are percentiles calculated?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Percentiles use linear interpolation at rank r = p/100 × (n − 1)."
                }
              },
              {
                "@type": "Question",
                "name": "Can I share my exact settings and data?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. The tool encodes input, bins, sample/population mode, and percentiles into the URL so you can share a link."
                }
              }
            ]
          },
      
          // 4) WebApplication
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://calculatorhub.site/statistics-calculator#webapp",
            "name": "Statistics Calculator",
            "url": "https://calculatorhub.site/statistics-calculator",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web",
            "description": "Compute descriptive statistics, percentiles, histogram, and box plot with shareable state.",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "image": ["https://calculatorhub.site/images/statistics-calculator-hero.webp"]
          },
      
          // 5) SoftwareApplication (optional)
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://calculatorhub.site/statistics-calculator#software",
            "name": "Statistics Calculator",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "All",
            "url": "https://calculatorhub.site/statistics-calculator",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "description": "Interactive descriptive statistics tool with histogram and box plot."
          },
      
          // 6) WebSite + Organization (global)
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": "https://calculatorhub.site/#website",
            "url": "https://calculatorhub.site",
            "name": "CalculatorHub",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://calculatorhub.site/search?q={query}",
              "query-input": "required name=query"
            }
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": "https://calculatorhub.site/#organization",
            "name": "CalculatorHub",
            "url": "https://calculatorhub.site",
            "logo": {
              "@type": "ImageObject",
              "url": "https://calculatorhub.site/images/logo.png"
            }
          }
        ]}
      />
      
      {/** ===== Outside meta/link tags ===== */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <link rel="canonical" href="https://calculatorhub.site/statistics-calculator" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/statistics-calculator" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/statistics-calculator" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/statistics-calculator" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Statistics Calculator — Mean, Median, Mode, Variance, Std Dev, Quartiles" />
      <meta property="og:description" content="Compute descriptive statistics, percentiles, histogram, and a compact box plot. Paste numbers separated by space/comma/semicolon." />
      <meta property="og:url" content="https://calculatorhub.site/statistics-calculator" />
      <meta property="og:image" content="https://calculatorhub.site/images/statistics-calculator-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Statistics calculator UI with tiles, histogram, and box plot" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Statistics Calculator — Descriptive Analytics with Visuals" />
      <meta name="twitter:description" content="Mean, median, mode, variance (sample/population), std dev, quartiles, IQR, custom percentiles, histogram & box plot." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/statistics-calculator-hero.webp" />
      <meta name="twitter:creator" content="@CalculatorHub" />
      <meta name="twitter:site" content="@CalculatorHub" />
      
      {/** PWA & theme */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#0ea5e9" />
      
      {/** Performance */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="preload" as="image" href="/images/statistics-calculator-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />


      <div className="max-w-5xl mx-auto px-3 sm:px-4">
        <Breadcrumbs
          items={[
            { name: "Math Tools", url: "/category/math-tools" },
            { name: "Statistics Calculator", url: "/statistics-calculator" },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-lg">
            📊 Statistics Calculator
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed break-words">
            Paste numbers separated by <strong>space, comma, or semicolon</strong>. We’ll compute
            descriptive stats, percentiles, a histogram, and a compact box plot. Invalid tokens are
            ignored.
          </p>
        </div>

        {/* Promo bar */}
        <div className="hidden sm:flex mt-6 mb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white rounded-lg shadow-lg p-4 items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-lg">Explore more math tools 🧮</p>
            <p className="text-sm text-indigo-100">Try Average, Prime Checker, or Factorial next!</p>
          </div>
          <a
            href="/category/math-tools"
            className="bg-white text-indigo-700 font-semibold px-4 py-2 rounded-md hover:bg-indigo-50 transition whitespace-nowrap"
          >
            Browse Math Tools
          </a>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Inputs */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 relative text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-sky-400" /> Data & Options
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
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">
                    Numbers (space/comma/semicolon)
                  </label>
                  <Info
                    className="h-4 w-4 text-slate-400"
                    title="Example: 1 2 2 3, 4; 6 9 9 10 12 15"
                  />
                </div>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={4}
                  placeholder="e.g., 1 2 2 3, 4; 6 9 9 10 12 15"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500 break-words"
                />
                <div className="text-xs text-slate-400 mt-2">
                  Tip: We ignore invalid tokens automatically.
                </div>
              </div>

              {/* Options row */}
              <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    id="useSample"
                    type="checkbox"
                    checked={useSample}
                    onChange={(e) => setUseSample(e.target.checked)}
                    className="h-4 w-4 accent-indigo-500"
                  />
                  <label htmlFor="useSample" className="text-sm text-slate-300">
                    Sample variance / std dev
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Histogram bins (1–50)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={bins}
                    onChange={(e) =>
                      setBins(Math.max(1, Math.min(50, Math.floor(Number(e.target.value) || 1))))
                    }
                    className="w-full bg-[#0f172a] text-white px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Percentiles (0–100)
                  </label>
                  <input
                    type="text"
                    value={percentileText}
                    onChange={(e) => setPercentileText(e.target.value)}
                    placeholder="e.g., 10,25,50,75,90"
                    className="w-full bg-[#0f172a] text-white px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Results</h2>

            {!stats ? (
              <div className="p-4 bg-[#0f172a] rounded-lg border border-[#334155] text-slate-300">
                Enter at least one valid number.
              </div>
            ) : ( 
              <div className="space-y-3">
                {/* Tiles */}
                <div className="grid grid-cols-2 md:grid-cols-2 gap-2 sm:gap-2">
                  <Tile label="Count" value={stats.count.toLocaleString()} />
                  <Tile label="Sum" value={nf(stats.sum, 6)} />
                  <Tile label="Mean" value={nf(stats.mean, 6)} />
                  <Tile label="Median" value={nf(stats.median, 6)} />
                  <Tile label="Min" value={nf(stats.min, 6)} />
                  <Tile label="Max" value={nf(stats.max, 6)} />
                  <Tile label="Range" value={nf(stats.range, 6)} />
                  <Tile
                    label="Mode(s)"
                    value={
                      stats.modes.length
                        ? (() => {
                            const s = stats.modes.join(", ");
                            return s.length > 200 ? s.slice(0, 200) + "…" : s;
                          })()
                        : "—"
                    }
                  />
                </div>

                {/* Quartiles + Variance/Std */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#0f172a] rounded-lg border border-[#334155] break-words">
                    <div className="text-sm text-slate-400 mb-1">Quartiles & IQR</div>
                    <div className="text-white">
                      <p>
                        •Q1: <b className="text-emerald-300">{nf(stats.q1, 6)}</b>{" "}
                      </p>
                      <p>
                        • Q3: <b className="text-emerald-300">{nf(stats.q3, 6)}</b>{" "}                           </p>
                      <p>
                        • IQR: <b className="text-emerald-300">{nf(stats.iqr, 6)}</b>
                      </p>
                    </div>
                    <div className="text-xs text-slate-400 mt-2">
                      Outliers: &lt; {nf(stats.outlierLow, 6)} or &gt; {nf(stats.outlierHigh, 6)}
                    </div>
                  </div>

                  <div className="p-4 bg-[#0f172a] rounded-lg border border-[#334155] break-words">
                    <div className="text-sm text-slate-400 mb-1">Variance & Std. Dev.</div>
                    <div className="text-white">
                      {useSample ? (
                        <>
                          <p>
                            • Var (sample):{" "}
                            <b className="text-indigo-300">{nf(stats.varSample, 6)}</b>{" "}
                          </p>
                          <p>
                            • SD (sample):{" "}
                            <b className="text-indigo-300">{nf(stats.sdSample, 6)}</b>
                          </p>
                        </>
                      ) : (
                        <>
                          <p>
                            • Var (population):{" "}
                            <b className="text-indigo-300">{nf(stats.varPop, 6)}</b>{" "}
                          </p>
                          <p>
                            • SD (population):{" "}
                            <b className="text-indigo-300">{nf(stats.sdPop, 6)}</b>
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Percentiles */}
                <div className="p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                  <div className="text-sm text-slate-400 mb-2">Percentiles</div>
                  <div className="flex flex-wrap gap-2 text-white max-h-40 overflow-y-auto">
                    {percentiles.length
                      ? percentiles.map(({ p, value }) => (
                          <span
                            key={p}
                            className="px-2 py-1 rounded-md border border-[#334155] bg-[#111827]"
                          >
                            {p}%: <b className="text-cyan-300">{nf(value, 6)}</b>
                          </span>
                        ))
                      : "—"}
                  </div>
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
            )}
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

        {/* Histogram */}
        {stats && histo.length > 0 && (
          <div className="mt-5 bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center flex items-center justify-center gap-2">
              <BarChart2 className="h-5 w-5 text-sky-400" /> Histogram
            </h3>
            <div className="w-full h-[240px] sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="bin"
                    tick={{ fontSize: 10 }}
                    angle={-35}
                    textAnchor="end"
                    height={64}
                    interval="preserveStartEnd"
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <ReTooltip />
                  <Legend />
                  <Bar dataKey="count" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Box Plot (compact, SVG) */}
        {stats && (
          <div className="mt-5 bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              Box Plot (min–Q1–median–Q3–max)
            </h3>
            <BoxPlot
              min={stats.min}
              q1={stats.q1}
              median={stats.median}
              q3={stats.q3}
              max={stats.max}
            />
          </div>
        )}

        {/* Steps (collapsible) */}
        <div className="mt-10 bg-gradient-to-br from-[#1e293b] via-[#111827] to-[#0f172a] rounded-2xl border border-indigo-600/40 shadow-xl overflow-hidden">
          <button
            onClick={() => setShowSteps((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold text-lg tracking-wide hover:opacity-90 transition-all"
          >
            <span>🧮 How It Works</span>
            {showSteps ? <ChevronUp /> : <ChevronDown />}
          </button>

          {showSteps && (
            <div className="px-6 pb-8 pt-4 space-y-3 text-slate-200">
              <h4 className="font-semibold text-cyan-300">Parsing</h4>
              <p>We split by spaces, commas, or semicolons. Invalid tokens are ignored.</p>

              <h4 className="font-semibold text-cyan-300">Descriptive stats</h4>
              <p>
                Mean, median, mode(s), min, max, range, quartiles (Tukey), IQR, outlier thresholds,
                and variance/std dev (sample or population).
              </p>

              <h4 className="font-semibold text-cyan-300">Percentiles</h4>
              <p>Linear interpolation at rank r = p/100 × (n − 1).</p>

              <h4 className="font-semibold text-cyan-300">Histogram & Box Plot</h4>
              <p>
                Histogram bins are equal-width over [min, max]. The compact box plot shows
                min–Q1–median–Q3–max.
              </p>

              <div className="h-2 w-full mt-6 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 blur-[2px]" />
            </div>
          )}
        </div>

        {/* Short SEO content */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          <h1 className="text-2xl sm:text-3xl font-bold text-cyan-400 mb-6">
            Statistics Calculator – Descriptive Analytics in One Click
          </h1>
          <p className="break-words">
            Paste your data and instantly get descriptive statistics with clear visuals. Toggle
            sample vs population metrics, set custom percentiles, and export insights by copying the
            results.
          </p>
        </section>

        {/* Footer links */}
        <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              🚀 Explore more tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/average-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-400 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
              >
                📊 Average Calculator
              </Link>
              <Link
                to="/prime-number-checker"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-pink-600/20 text-pink-300 hover:text-pink-400 px-3 py-2 rounded-md border border-slate-700 hover:border-pink-500 transition-all duration-200"
              >
                🔍 Prime Checker
              </Link>
              <Link
                to="/factorial-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
              >
                n! Factorial
              </Link>
            </div>
          </div>
        </section>

        <AdBanner type="bottom" />
        <RelatedCalculators
          currentPath="/statistics-calculator"
          category="math-tools"
        />
      </div>
    </>
  );
};

/* ============================================================
   🧩 Small UI helpers (mobile-safe)
   ============================================================ */
const Tile: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-3 sm:p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155] shadow-sm min-w-0">
    <div className="text-xs sm:text-sm text-slate-400">{label}</div>
    <div
      className="mt-0.5 text-base sm:text-lg font-semibold text-white break-all min-w-0 max-w-full inline-block"
      title={value}
    >
      {value}
    </div>
  </div>
);

// Minimal horizontal box plot (SVG) with horizontal scroll
const BoxPlot: React.FC<{ min: number; q1: number; median: number; q3: number; max: number }> = ({
  min,
  q1,
  median,
  q3,
  max,
}) => {
  // map data → [0, 1000] for a nice width
  const W = 1000;
  const H = 70;
  const pad = 40;
  const span = max - min || 1;
  const x = (v: number) => pad + ((v - min) / span) * (W - 2 * pad);

  const yMid = H / 2;
  const boxTop = yMid - 12;
  const boxHeight = 24;

  return (
    <div className="w-full overflow-x-auto">
      <svg width={W} height={H} className="min-w-full">
        {/* whiskers */}
        <line x1={x(min)} y1={yMid} x2={x(q1)} y2={yMid} stroke="#94a3b8" strokeWidth="2" />
        <line x1={x(q3)} y1={yMid} x2={x(max)} y2={yMid} stroke="#94a3b8" strokeWidth="2" />

        {/* min/max ticks */}
        <line x1={x(min)} y1={yMid - 10} x2={x(min)} y2={yMid + 10} stroke="#94a3b8" strokeWidth="2" />
        <line x1={x(max)} y1={yMid - 10} x2={x(max)} y2={yMid + 10} stroke="#94a3b8" strokeWidth="2" />

        {/* box Q1–Q3 */}
        <rect
          x={x(q1)}
          y={boxTop}
          width={Math.max(1, x(q3) - x(q1))}
          height={boxHeight}
          fill="#0f172a"
          stroke="#6366f1"
          strokeWidth="2"
        />

        {/* median */}
        <line
          x1={x(median)}
          y1={boxTop}
          x2={x(median)}
          y2={boxTop + boxHeight}
          stroke="#22d3ee"
          strokeWidth="2"
        />

        {/* labels */}
        <text x={x(min)} y={H - 8} textAnchor="middle" fontSize="12" fill="#9ca3af">
          {nf(min, 2)}
        </text>
        <text x={x(q1)} y={H - 8} textAnchor="middle" fontSize="12" fill="#9ca3af">
          {nf(q1, 2)}
        </text>
        <text x={x(median)} y={H - 8} textAnchor="middle" fontSize="12" fill="#9ca3af">
          {nf(median, 2)}
        </text>
        <text x={x(q3)} y={H - 8} textAnchor="middle" fontSize="12" fill="#9ca3af">
          {nf(q3, 2)}
        </text>
        <text x={x(max)} y={H - 8} textAnchor="middle" fontSize="12" fill="#9ca3af">
          {nf(max, 2)}
        </text>
      </svg>
    </div>
  ); 
};

export default StatisticsCalculator;
