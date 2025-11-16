// src/pages/LogCalculator.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FunctionSquare,
  RotateCcw,
  Share2,
  Copy,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceDot,
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
const LS_KEY = "log_calculator_state_v1";
const URL_KEY = "lc";

const nf = (n: number, d = 8) =>
  Number.isFinite(n) ? Number(n.toFixed(d)).toLocaleString() : "—";

const clampPos = (v: number, min = 1e-16, max = 1e16) =>
  Math.min(max, Math.max(min, v));

const isValidBase = (b: number) => b > 0 && b !== 1;

/* Build y = log_b(x) samples for the chart around the chosen x */
function buildLogSeries(base: number, x: number) {
  const pts: { x: number; y: number }[] = [];
  if (!isValidBase(base)) return pts;
  // choose a range around x on a log scale
  const span = 4; // decades around x
  const start = Math.max(1e-6, x / Math.pow(10, span / 2));
  const end = x * Math.pow(10, span / 2);
  const steps = 120;
  const stepFactor = Math.pow(end / start, 1 / steps);
  let cur = start;
  for (let i = 0; i <= steps; i++) {
    const y = Math.log(cur) / Math.log(base);
    pts.push({ x: cur, y });
    cur *= stepFactor;
  }
  return pts;
}

/* ============================================================
   🧮 Component
   ============================================================ */
const LogCalculator: React.FC = () => {
  // Inputs
  const [x, setX] = useState<number>(8);
  const [base, setBase] = useState<number>(2);

  // UI
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [showSteps, setShowSteps] = useState<boolean>(false);
  const [activeTip, setActiveTip] = useState<number>(0);
  const [hydrated, setHydrated] = useState<boolean>(false);

  const isDefault = x === 8 && base === 2;

  /* 🔁 Hydration & Persistence */
  const applyState = (s: any) => {
    const sx = Number(s.x);
    const sb = Number(s.base);
    setX(Number.isFinite(sx) ? clampPos(sx) : 8);
    setBase(Number.isFinite(sb) ? sb : 2);
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
      console.warn("Failed to load log state:", e);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ x, base }));
    } catch {}
  }, [hydrated, x, base]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const url = new URL(window.location.href);
      if (isDefault) {
        url.searchParams.delete(URL_KEY);
        window.history.replaceState({}, "", url);
      } else {
        const encoded = btoa(JSON.stringify({ x, base }));
        url.searchParams.set(URL_KEY, encoded);
        window.history.replaceState({}, "", url);
      }
    } catch (e) {
      console.warn("Failed to update URL:", e);
    }
  }, [hydrated, x, base, isDefault]);

  /* 🧠 Math */
  const valid = x > 0 && isValidBase(base);

  const logb_x = useMemo(() => (valid ? Math.log(x) / Math.log(base) : NaN), [x, base, valid]);
  const ln_x = useMemo(() => (x > 0 ? Math.log(x) : NaN), [x]);
  const log10_x = useMemo(() => (x > 0 ? Math.log10(x) : NaN), [x]);
  const log2_x = useMemo(() => (x > 0 ? Math.log2(x) : NaN), [x]);

  const chartData = useMemo(() => (valid ? buildLogSeries(base, x) : []), [base, x, valid]);

  /* 💡 Tips */
  const tips = useMemo(
    () => [
      "Tip: log_b(x) is only defined for x>0 with base b>0 and b≠1.",
      "Tip: Change of base: log_b(x) = ln(x)/ln(b) = log10(x)/log10(b).",
      "Tip: For b>1, log curve increases; for 0<b<1, it decreases.",
      "Tip: log_b(1)=0 for any valid base; log_b(b)=1.",
      "Tip: The inverse of log base b is the exponential b^y.",
    ],
    []
  );

  useEffect(() => {
    const id = setInterval(() => setActiveTip((p) => (p + 1) % tips.length), 5000);
    return () => clearInterval(id);
  }, [tips.length]);

  /* 🔗 Copy / Share / Reset */
  const copyResults = async () => {
    const parts: string[] = [];
    parts.push("Log Calculator");
    parts.push(`x: ${x}`);
    parts.push(`base: ${base}`);
    parts.push(`log_${base}(${x}) = ${nf(logb_x)}`);
    parts.push(`ln(x) = ${nf(ln_x)}`);
    parts.push(`log10(x) = ${nf(log10_x)}`);
    parts.push(`log2(x) = ${nf(log2_x)}`);
    await navigator.clipboard.writeText(parts.join("\n"));
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    const encoded = btoa(JSON.stringify({ x, base }));
    url.searchParams.set(URL_KEY, encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  const reset = () => {
    setX(8);
    setBase(2);
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
        title="Log Calculator — log₍b₎(x), ln(x), log₁₀(x), log₂(x) + Interactive Graph"
        description="Compute log base b of x and see ln(x), log10(x), and log2(x). Includes change-of-base steps, shareable link, and a live chart for visual intuition."
        keywords={[
          "log calculator",
          "log base b",
          "change of base",
          "natural logarithm",
          "common log",
          "binary log",
          "ln",
          "log10",
          "log2",
          "math tools",
        ]}
        canonical="https://calculatorhub.site/log-calculator"
        schemaData={[
          /* 1) WebPage + Article */
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://calculatorhub.site/log-calculator#webpage",
            "url": "https://calculatorhub.site/log-calculator",
            "name": "Log Calculator — log₍b₎(x), ln(x), log₁₀(x), log₂(x) + Graph",
            "inLanguage": "en",
            "isPartOf": { "@id": "https://calculatorhub.site/#website" },
            "primaryImageOfPage": {
              "@type": "ImageObject",
              "@id": "https://calculatorhub.site/images/log-calculator-hero.webp#primaryimg",
              "url": "https://calculatorhub.site/images/log-calculator-hero.webp",
              "width": 1200,
              "height": 675
            },
            "mainEntity": {
              "@type": "Article",
              "@id": "https://calculatorhub.site/log-calculator#article",
              "headline": "Log Calculator — Change of Base, ln, log10, log2, and Interactive Graph",
              "description": "Enter x>0 and a valid base (b>0, b≠1) to compute log₍b₎(x). The tool also shows ln(x), log10(x), log2(x), demonstrates change-of-base steps, and plots y=log₍b₎(x).",
              "image": ["https://calculatorhub.site/images/log-calculator-hero.webp"],
              "author": { "@type": "Organization", "name": "CalculatorHub", "url": "https://calculatorhub.site" },
              "publisher": { "@id": "https://calculatorhub.site/#organization" },
              "datePublished": "2025-11-09",
              "dateModified": "2025-11-09",
              "mainEntityOfPage": { "@id": "https://calculatorhub.site/log-calculator#webpage" },
              "articleSection": ["Inputs & Validation", "Change of Base", "Results", "Graph", "FAQ"]
            }
          },
      
          /* 2) Breadcrumbs */
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "@id": "https://calculatorhub.site/log-calculator#breadcrumbs",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://calculatorhub.site/" },
              { "@type": "ListItem", "position": 2, "name": "Math Tools", "item": "https://calculatorhub.site/category/math-tools" },
              { "@type": "ListItem", "position": 3, "name": "Log Calculator", "item": "https://calculatorhub.site/log-calculator" }
            ]
          },
      
          /* 3) FAQ */
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://calculatorhub.site/log-calculator#faq",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What inputs are valid?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Use x>0 and a base b such that b>0 and b≠1. Presets let you quickly set b=e, b=10, or b=2."
                }
              },
              {
                "@type": "Question",
                "name": "How is log₍b₎(x) computed?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "We apply the change-of-base formula: log_b(x) = ln(x)/ln(b) = log10(x)/log10(b)."
                }
              },
              {
                "@type": "Question",
                "name": "What else does the tool show?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "It also displays ln(x), log10(x), and log2(x), and plots y=log_b(x) with the selected (x,y) highlighted."
                }
              },
              {
                "@type": "Question",
                "name": "Can I share my current inputs?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. The state is encoded in the URL so you can copy a shareable link."
                }
              }
            ]
          },
      
          /* 4) WebApplication */
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://calculatorhub.site/log-calculator#webapp",
            "name": "Log Calculator",
            "url": "https://calculatorhub.site/log-calculator",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web",
            "description": "Interactive logarithm calculator with change-of-base steps and a live graph.",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "image": ["https://calculatorhub.site/images/log-calculator-hero.webp"]
          },
      
          /* 5) SoftwareApplication (optional) */
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://calculatorhub.site/log-calculator#software",
            "name": "Log Calculator",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "All",
            "url": "https://calculatorhub.site/log-calculator",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "description": "Compute log₍b₎(x), ln, log10, and log2 with visualizations and shareable state."
          },
      
          /* 6) WebSite + Organization (global) */
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
      <link rel="canonical" href="https://calculatorhub.site/log-calculator" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/log-calculator" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/log-calculator" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/log-calculator" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Log Calculator — log₍b₎(x), ln, log₁₀, log₂ + Graph" />
      <meta property="og:description" content="Compute log_b(x) with change-of-base steps. See ln(x), log10(x), log2(x), copy/share, and a live plot." />
      <meta property="og:url" content="https://calculatorhub.site/log-calculator" />
      <meta property="og:image" content="https://calculatorhub.site/images/log-calculator-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Log calculator UI with graph of y = log_b(x) and highlighted point" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Log Calculator — Change of Base & Interactive Graph" />
      <meta name="twitter:description" content="Enter x and base b to compute log₍b₎(x), plus ln, log10, and log2. Visualize y=log₍b₎(x) and share your state." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/log-calculator-hero.webp" />
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
      <link rel="preload" as="image" href="/images/log-calculator-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />
      

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Math Tools", url: "/category/math-tools" },
            { name: "Log Calculator", url: "/log-calculator" },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Log Calculator
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Compute <strong>log₍b₎(x)</strong> for any valid base, plus <strong>ln(x)</strong>,{" "}
            <strong>log₁₀(x)</strong>, and <strong>log₂(x)</strong>. Includes change-of-base steps and a live chart.
          </p>
        </div>

        {/* Promo bar */}
        <div className="hidden sm:flex mt-6 mb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white rounded-lg shadow-lg p-4 items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-lg">Explore more math tools 🧮</p>
            <p className="text-sm text-indigo-100">Try Quadratic, Factorial, or GCD & LCM next!</p>
          </div>
          <Link
            to="/category/math-tools"
            className="bg-white text-indigo-700 font-semibold px-4 py-2 rounded-md hover:bg-indigo-50 transition"
          >
            Browse Math Tools
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 relative text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FunctionSquare className="h-5 w-5 text-sky-400" /> Inputs
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
              {/* x */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">Value (x &gt; 0)</label>
                  <Info className="h-4 w-4 text-slate-400" title="x must be positive." />
                </div>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={x}
                  onChange={(e) => setX(clampPos(parseFloat(e.target.value) || 0))}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* base */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">Base (b &gt; 0, b ≠ 1)</label>
                  <Info className="h-4 w-4 text-slate-400" title="Base must be positive and not equal to 1." />
                </div>
                <div className="flex gap-3">
                  <input
                    type="number"
                    step="any"
                    value={base}
                    onChange={(e) => setBase(parseFloat(e.target.value) || 0)}
                    className="flex-1 bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBase(Math.E)}
                      className="text-xs bg-[#0f172a] border border-[#334155] rounded px-2 py-1 hover:border-indigo-500"
                    >
                      b = e
                    </button>
                    <button
                      onClick={() => setBase(10)}
                      className="text-xs bg-[#0f172a] border border-[#334155] rounded px-2 py-1 hover:border-indigo-500"
                    >
                      b = 10
                    </button>
                    <button
                      onClick={() => setBase(2)}
                      className="text-xs bg-[#0f172a] border border-[#334155] rounded px-2 py-1 hover:border-indigo-500"
                    >
                      b = 2
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick x presets */}
              <div className="flex flex-wrap gap-2">
                {[0.125, 0.5, 1, 2, 8, 10, 100].map((v) => (
                  <button
                    key={v}
                    onClick={() => setX(v)}
                    className="text-xs bg-[#0f172a] border border-[#334155] rounded px-2 py-1 hover:border-indigo-500"
                  >
                    x = {v}
                  </button>
                ))}
              </div>

              {!valid && (
                <p className="text-xs text-amber-300">
                  Please enter x &gt; 0 and base b &gt; 0 with b ≠ 1.
                </p>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">Results</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Tile label={`log₍${formatBase(base)}₎(${x})`} value={valid ? nf(logb_x) : "—"} />
                <Tile label="ln(x)" value={x > 0 ? nf(ln_x) : "—"} />
                <Tile label="log₁₀(x)" value={x > 0 ? nf(log10_x) : "—"} />
                <Tile label="log₂(x)" value={x > 0 ? nf(log2_x) : "—"} />
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
        {valid && chartData.length > 0 && Number.isFinite(logb_x) && (
          <div className="mt-5 bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              y = log₍{formatBase(base)}₎(x)
            </h3>
            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="x"
                    type="number"
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => v.toExponential(0)}
                  />
                  <YAxis
                    dataKey="y"
                    type="number"
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 12 }}
                  />
                  <ReTooltip
                    formatter={(v: any, n: any) => (n === "y" ? nf(Number(v), 6) : v.toExponential(3))}
                    labelFormatter={(lab: any) => `x = ${Number(lab).toExponential(6)}`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="y" name="log₍b₎(x)" dot={false} />
                  {/* Highlight the selected point */}
                  <ReferenceDot x={x} y={logb_x} r={4} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Point shown: (x, y) = ({x}, {nf(logb_x, 6)}).
            </p>
          </div>
        )}

        {/* Steps (collapsible) */}
        <div className="mt-10 bg-gradient-to-br from-[#1e293b] via-[#111827] to-[#0f172a] rounded-2xl border border-indigo-600/40 shadow-xl overflow-hidden">
          <button
            onClick={() => setShowSteps((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold text-lg tracking-wide hover:opacity-90 transition-all"
          >
            <span>🧮 Step-by-Step (Change of Base)</span>
            {showSteps ? <ChevronUp /> : <ChevronDown />}
          </button>

          {showSteps && (
            <div className="px-6 pb-8 pt-4 space-y-3 text-slate-200">
              <h4 className="font-semibold text-cyan-300">Formula</h4>
              <p className="font-mono">log_b(x) = ln(x) / ln(b) = log₁₀(x) / log₁₀(b)</p>

              <h4 className="font-semibold text-cyan-300">With your inputs</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>ln(x) = {x > 0 ? nf(ln_x, 10) : "—"}</li>
                <li>ln(b) = {isValidBase(base) ? nf(Math.log(base), 10) : "—"}</li>
                <li>
                  log₍{formatBase(base)}₎({x}) ={" "}
                  {valid ? `${nf(ln_x, 10)} ÷ ${nf(Math.log(base), 10)} = ${nf(logb_x, 10)}` : "—"}
                </li>
              </ol>

              <h4 className="font-semibold text-cyan-300">Key Identities</h4>
              <ul className="list-disc list-inside">
                <li>log₍b₎(1) = 0; log₍b₎(b) = 1</li>
                <li>log₍b₎(xy) = log₍b₎(x) + log₍b₎(y)</li>
                <li>log₍b₎(xᵏ) = k · log₍b₎(x)</li>
              </ul>

              <div className="h-2 w-full mt-6 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 blur-[2px]" />
            </div>
          )}
        </div>

       {/* ===================== SEO Content (~1800–2000 words) ===================== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
        
          {/* ===== Table of Contents ===== */}
          <nav className="mt-2 mb-10 bg-[#0b1220] border border-[#1f2a44] rounded-xl p-5 text-slate-200">
            <h2 className="text-lg font-semibold text-gray-100 mb-3">📖 Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><a href="#what-is-log" className="text-indigo-300 hover:underline">What Is a Logarithm?</a></li>
              <li><a href="#features" className="text-indigo-300 hover:underline">Key Features of This Calculator</a></li>
              <li><a href="#how-to-use" className="text-indigo-300 hover:underline">How to Use</a></li>
              <li><a href="#change-of-base" className="text-indigo-300 hover:underline">Change of Base — The Core Trick</a></li>
              <li><a href="#graph-intuition" className="text-indigo-300 hover:underline">Graph Intuition & Behavior</a></li>
              <li><a href="#common-bases" className="text-indigo-300 hover:underline">Popular Bases: e, 10, and 2</a></li>
              <li><a href="#properties" className="text-indigo-300 hover:underline">Essential Properties & Identities</a></li>
              <li><a href="#domain-range" className="text-indigo-300 hover:underline">Domain, Range, and Constraints</a></li>
              <li><a href="#worked-examples" className="text-indigo-300 hover:underline">Worked Examples</a></li>
              <li><a href="#solve-equations" className="text-indigo-300 hover:underline">Solving Equations with Logs</a></li>
              <li><a href="#precision" className="text-indigo-300 hover:underline">Precision, Rounding & Numerical Notes</a></li>
              <li><a href="#pitfalls" className="text-indigo-300 hover:underline">Common Pitfalls & How to Avoid Them</a></li>
              <li><a href="#use-cases" className="text-indigo-300 hover:underline">Real-World Use Cases</a></li>
              <li><a href="#quick-ref" className="text-indigo-300 hover:underline">Quick Reference Table</a></li>
              <li><a href="#glossary" className="text-indigo-300 hover:underline">Glossary</a></li>
              <li><a href="#faq" className="text-indigo-300 hover:underline">FAQ</a></li>
            </ol>
          </nav>
        
          {/* ===== What is a Logarithm? ===== */}
          <h1 id="what-is-log" className="text-3xl font-bold text-indigo-300 mb-6">
            Logarithms — the inverse lens for exponential growth
          </h1>
          <p>
            A <strong>logarithm</strong> answers the question: “To what exponent must I raise a base <em>b</em> to obtain a
            positive number <em>x</em>?” We write this as <strong>log<sub>b</sub>(x)</strong>. If <em>b<sup>y</sup> = x</em>,
            then <em>y = log<sub>b</sub>(x)</em>. Because logs invert exponentials, they are the natural tool for taming
            phenomena that scale multiplicatively: sound intensity (decibels), pH in chemistry, Richter magnitude, computer
            complexity, and financial compounding.
          </p>
          <p>
            Mathematically, logs are defined for <strong>x &gt; 0</strong> and <strong>b &gt; 0 with b ≠ 1</strong>. The
            calculator on this page computes <strong>log<sub>b</sub>(x)</strong> for any valid base, alongside the canonical
            variants <strong>ln(x)</strong> (base <em>e</em>), <strong>log₁₀(x)</strong>, and <strong>log₂(x)</strong>, and
            visualizes the curve <em>y = log<sub>b</sub>(x)</em> around your chosen point.
          </p>
        
          {/* ===== Features ===== */}
          <h2 id="features" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            ✨ Key features of this Log Calculator
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Flexible base</strong>: compute <em>log<sub>b</sub>(x)</em> for any real base <em>b&gt;0, b≠1</em>.</li>
            <li><strong>Instant companions</strong>: auto-displays <em>ln(x)</em>, <em>log₁₀(x)</em>, and <em>log₂(x)</em>.</li>
            <li><strong>Change-of-base steps</strong>: transparent derivation using <code>ln(x)/ln(b)</code>.</li>
            <li><strong>Interactive graph</strong>: a smooth plot of <em>y = log<sub>b</sub>(x)</em> with your point highlighted.</li>
            <li><strong>Share & copy</strong>: export results as text or copy a permalink that encodes your inputs.</li>
            <li><strong>Input safety nets</strong>: gentle clamping for <em>x</em> and clear validation for the base.</li>
          </ul>
          <AdBanner type="bottom" />
        
          {/* ===== How to Use ===== */}
          <h2 id="how-to-use" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">🧭 How to use this calculator</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter a positive <strong>x</strong> (e.g., 0.5, 2, 8, 100).</li>
            <li>Choose a valid <strong>base b</strong> (<em>b &gt; 0</em> and <em>b ≠ 1</em>), or click a preset (<em>e</em>, 10, 2).</li>
            <li>Read off <strong>log<sub>b</sub>(x)</strong>, plus <strong>ln(x), log₁₀(x), log₂(x)</strong>.</li>
            <li>Open <em>Step-by-Step</em> to see the <strong>change-of-base</strong> computation with your inputs.</li>
            <li>Use <strong>Copy Results</strong> or <strong>Copy Link</strong> to reuse or share the exact state.</li>
          </ol>
          <p className="text-sm text-slate-400">
            Tip: When <em>b&gt;1</em>, the log curve rises slowly; when <em>0&lt;b&lt;1</em>, it falls. In all cases,
            <em>log<sub>b</sub>(1)=0</em> and <em>log<sub>b</sub>(b)=1</em>.
          </p>
        
          {/* ===== Change of Base ===== */}
          <h2 id="change-of-base" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🧮 Change of base — the core trick
          </h2>
          <p>
            Most calculators provide only <em>ln</em> and <em>log₁₀</em>. The universal identity
            <strong> log<sub>b</sub>(x) = ln(x) / ln(b)</strong> (equivalently <strong>log₁₀(x)/log₁₀(b)</strong>) reduces any
            base to the ones you have. This tool applies that identity directly, so you can use <em>b=1.5</em> just as easily as
            <em>b=2</em> or <em>b=10</em>.
          </p>
          <pre className="bg-[#0f172a] border border-[#334155] rounded-lg p-3 overflow-x-auto text-sm">
            log_b(x) = ln(x) / ln(b)   =   log₁₀(x) / log₁₀(b)
          </pre>
          <p>
            Because both numerator and denominator are logs in the same base, the ratio remains invariant across bases. This is
            why “change of base” works and why we can visualize the curve for arbitrary <em>b</em>.
          </p>
        
          {/* ===== Graph Intuition ===== */}
          <h2 id="graph-intuition" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            📈 Graph intuition & behavior
          </h2>
          <p>
            The graph of <em>y = log<sub>b</sub>(x)</em> is defined for <em>x&gt;0</em> and crosses the x-axis at <em>x=1</em>.
            It is the mirror image of <em>y = b<sup>x</sup></em> across the line <em>y=x</em>. For <em>b&gt;1</em>, the curve is
            increasing and concave downward: it rises quickly near zero and flattens for large <em>x</em>. For <em>0&lt;b&lt;1</em>,
            the curve is decreasing, reflecting that repeatedly multiplying by a fraction brings you closer to zero.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Vertical asymptote</strong> at <em>x=0⁺</em>: the log tends to <em>−∞</em> as <em>x</em> approaches zero from the right.</li>
            <li><strong>Intercept</strong>: <em>(1, 0)</em>, since <em>log<sub>b</sub>(1) = 0</em> for any valid base.</li>
            <li><strong>Unit step</strong>: <em>log<sub>b</sub>(b) = 1</em>; every base maps to 1 at its own value.</li>
          </ul>
        
          {/* ===== Common Bases ===== */}
          <h2 id="common-bases" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🔢 Popular bases: e, 10, and 2
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Natural log (ln)</strong>, base <em>e≈2.71828…</em>, arises naturally in calculus, growth/decay, and continuous compounding.</li>
            <li><strong>Common log (log₁₀)</strong> is standard in scientific notation, orders of magnitude, and decibel/pH definitions.</li>
            <li><strong>Binary log (log₂)</strong> counts powers of two, central to CS complexity, information (bits), and data structures.</li>
          </ul>
          <p className="text-sm text-slate-400">
            This tool shows all three alongside your chosen base so you can translate easily between contexts.
          </p>
        
          {/* ===== Properties ===== */}
          <h2 id="properties" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🧩 Essential properties & identities
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Inverse</strong>: <em>b<sup>log<sub>b</sub>(x)</sup>=x</em> and <em>log<sub>b</sub>(b<sup>y</sup>)=y</em>.</li>
            <li><strong>Product</strong>: <em>log<sub>b</sub>(xy)=log<sub>b</sub>(x)+log<sub>b</sub>(y)</em>.</li>
            <li><strong>Quotient</strong>: <em>log<sub>b</sub>(x/y)=log<sub>b</sub>(x)−log<sub>b</sub>(y)</em>.</li>
            <li><strong>Power</strong>: <em>log<sub>b</sub>(x^k)=k·log<sub>b</sub>(x)</em> (for real <em>x&gt;0</em>).</li>
            <li><strong>Base switch</strong>: <em>log<sub>b</sub>(x)=log<sub>c</sub>(x)/log<sub>c</sub>(b)</em> for any valid <em>c</em>.</li>
          </ul>
        
          {/* ===== Domain & Range ===== */}
          <h2 id="domain-range" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🧭 Domain, range, and constraints
          </h2>
          <p>
            The domain is <strong>x &gt; 0</strong>. Inputs at or below zero are undefined in the real numbers. The base must
            satisfy <strong>b &gt; 0</strong> and <strong>b ≠ 1</strong>. The range is all real numbers, reflecting that
            exponentials can grow or shrink to hit any positive target.
          </p>
          <p className="text-sm text-slate-400">
            Note: Complex analysis extends logs to negative and complex inputs with branch cuts, but this calculator focuses on
            the real-valued case used in algebra, calculus, and data work.
          </p>
        
          {/* ===== Worked Examples ===== */}
          <h2 id="worked-examples" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🧪 Worked examples (rounded for readability)
          </h2>
          <ul className="space-y-2">
            <li><strong>log₂(8)</strong> = 3 because <em>2³ = 8</em>. Using change of base: <em>ln(8)/ln(2) ≈ 2.07944 / 0.69315 ≈ 3</em>.</li>
            <li><strong>log₁₀(1000)</strong> = 3 because <em>10³ = 1000</em>.</li>
            <li><strong>logₑ(e)</strong> = 1 by definition of <em>e</em>.</li>
            <li><strong>log₅(0.2)</strong> = −1 since <em>5⁻¹ = 1/5 = 0.2</em>.</li>
            <li><strong>log₁.₅(10)</strong> ≈ <em>ln(10)/ln(1.5)</em> ≈ 2.302585 / 0.405465 ≈ 5.68.</li>
          </ul>
        
          {/* ===== Solve Equations ===== */}
          <h2 id="solve-equations" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🧮 Solving equations with logarithms
          </h2>
          <p>
            Logs turn multiplicative/exponential relationships into additive/linear ones. If <em>b<sup>kx</sup> = y</em>, taking
            <em>log<sub>b</sub></em> gives <em>kx = log<sub>b</sub>(y)</em>, hence <em>x = log<sub>b</sub>(y)/k</em>. This is
            the standard technique for pulling an exponent down where algebra can reach it.
          </p>
          <pre className="bg-[#0f172a] border border-[#334155] rounded-lg p-3 overflow-x-auto text-sm">
            Example:  3·2^(0.4x) = 50  ⇒  2^(0.4x) = 50/3  ⇒  0.4x = log₂(50/3)  ⇒  x = log₂(50/3) / 0.4
          </pre>
        
          {/* ===== Precision ===== */}
          <h2 id="precision" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🎯 Precision, rounding & numerical notes
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Floating-point</strong>: results use IEEE-754 doubles; tiny rounding artifacts may appear at extreme scales.</li>
            <li><strong>Clamping</strong>: very small/large <em>x</em> are gently clamped to keep plots stable and readable.</li>
            <li><strong>Displayed digits</strong>: the UI rounds to a sensible number of decimals; copying results preserves clear precision.</li>
          </ul>
          <AdBanner type="bottom" />
        
          {/* ===== Pitfalls ===== */}
          <h2 id="pitfalls" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            ⚠️ Common pitfalls & how to avoid them
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Invalid domain</strong>: <em>x ≤ 0</em> is undefined for real logs. Ensure <em>x&gt;0</em>.</li>
            <li><strong>Illegal base</strong>: <em>b ≤ 0</em> or <em>b = 1</em> is not allowed. Choose <em>b&gt;0</em> with <em>b≠1</em>.</li>
            <li><strong>Wrong base assumption</strong>: “log” can mean <em>log₁₀</em> in engineering or <em>ln</em> in math contexts—be explicit.</li>
            <li><strong>Over-rounding</strong>: avoid premature rounding before applying identities; round only at the end.</li>
          </ul>
        
          {/* ===== Use Cases ===== */}
          <h2 id="use-cases" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🧰 Real-world use cases
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Data scales</strong>: log transforms stabilize variance and reveal multiplicative patterns in skewed data.</li>
            <li><strong>Complexity</strong>: algorithmic analyses (e.g., <em>O(log n)</em> time) hinge on binary logs.</li>
            <li><strong>Signals</strong>: decibels are logarithmic; small amplitude changes can be large in power ratios.</li>
            <li><strong>Earth & life</strong>: Richter magnitudes, pH (hydrogen ion concentration), and bacterial growth all relate to logs.</li>
            <li><strong>Finance</strong>: continuously compounded rates and growth half-lives use natural logs.</li>
          </ul>
        
          {/* ===== Quick Reference Table ===== */}
          <h2 id="quick-ref" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🗂️ Quick reference
          </h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-300">
                  <th className="py-2 pr-4">Item</th>
                  <th className="py-2 pr-4">Formula / Value</th>
                  <th className="py-2">Notes</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                <tr>
                  <td className="py-2 pr-4">Change of base</td>
                  <td className="py-2 pr-4">log<sub>b</sub>(x) = ln(x)/ln(b)</td>
                  <td className="py-2">Also log₁₀ variant</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Inverse</td>
                  <td className="py-2 pr-4">b<sup>log<sub>b</sub>(x)</sup>=x</td>
                  <td className="py-2">For x&gt;0, b&gt;0,b≠1</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Product</td>
                  <td className="py-2 pr-4">log<sub>b</sub>(xy)=log<sub>b</sub>(x)+log<sub>b</sub>(y)</td>
                  <td className="py-2">x,y&gt;0</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Power</td>
                  <td className="py-2 pr-4">log<sub>b</sub>(x^k)=k·log<sub>b</sub>(x)</td>
                  <td className="py-2">real k, x&gt;0</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Special values</td>
                  <td className="py-2 pr-4">log<sub>b</sub>(1)=0, log<sub>b</sub>(b)=1</td>
                  <td className="py-2">Any valid base</td>
                </tr>
              </tbody>
            </table>
          </div>
        
          {/* ===== Glossary ===== */}
          <h2 id="glossary" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">📚 Glossary</h2>
          <p className="space-y-2">
            <strong>log<sub>b</sub>(x)</strong>: exponent required to raise base <em>b</em> to get <em>x</em>. <br/>
            <strong>ln(x)</strong>: log base <em>e</em>; the natural logarithm. <br/>
            <strong>log₁₀(x)</strong>: common log, base 10. <br/>
            <strong>log₂(x)</strong>: binary log, base 2. <br/>
            <strong>Change of base</strong>: identity expressing any base in terms of another base’s log.
          </p>
        
          {/* ===== FAQ ===== */}
          <section className="space-y-6 mt-16">
            <h2 id="faq" className="text-3xl md:text-4xl font-bold mb-4 text-center text-indigo-200">
              ❓ Frequently Asked Questions (FAQ)
            </h2>
        
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q1: Why is x required to be positive?</h3>
                <p>
                  For real-valued logs, the exponential <em>b<sup>y</sup></em> only produces positive <em>x</em>. Extending to
                  negative/complex inputs requires complex analysis and is outside this tool’s scope.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q2: What bases are allowed?</h3>
                <p>
                  Any <em>b&gt;0</em> with <em>b≠1</em>. Bases ≤0 or equal to 1 break the definitions or trivialize the log.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q3: Is log the same as ln?</h3>
                <p>
                  Not always. In pure math, “log” often means <em>ln</em>; in engineering, it often means <em>log₁₀</em>. This
                  app labels bases explicitly to avoid ambiguity.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q4: Why do my results differ slightly from a hand calculator?</h3>
                <p>
                  Tiny differences arise from rounding and different internal constants. Use more displayed digits for tighter
                  agreement; the underlying values are consistent.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q5: Can I plot multiple bases at once?</h3>
                <p>
                  This page focuses on one base at a time for clarity. Switch bases or save/share links for quick comparisons.
                </p>
              </div>
        
            </div>
          </section>
        </section>
        
        {/* ========= Cross-links ========= */}
        <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
          <div className="flex items-center gap-3">
            <img
              src="/images/calculatorhub-author.webp"
              alt="CalculatorHub Tools Team"
              className="w-12 h-12 rounded-full border border-gray-600"
              loading="lazy"
            />
            <div>
              <p className="font-semibold text-white">Author: CalculatorHub Tools Team</p>
              <p className="text-sm text-slate-400">
                Specialists in math utilities & UX. Last updated: <time dateTime="2025-11-10">November 10, 2025</time>.
              </p>
            </div>
          </div>
        
          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              🚀 Explore more tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/quadratic-equation-solver"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-200 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
              >
                𝑎x²+𝑏x+𝑐 Quadratic Solver
              </Link>
              <Link
                to="/factorial-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-200 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
              >
                n! Factorial
              </Link>
              <Link
                to="/gcd-lcm-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-pink-600/20 text-pink-300 hover:text-pink-200 px-3 py-2 rounded-md border border-slate-700 hover:border-pink-500 transition-all duration-200"
              >
                GCD & LCM
              </Link>
            </div>
          </div>
        </section>


        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/log-calculator" category="math-tools" />
      </div>
    </>
  );
};

/* ============================================================
   🧩 Small UI helpers
   ============================================================ */
const Tile: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155] shadow-sm">
    <div className="text-sm text-slate-400 break-words">{label}</div>
    <div className="text-lg font-semibold text-white break-words">{value}</div>
  </div>
);

function formatBase(b: number) {
  // show 'e' nicely if close
  if (Math.abs(b - Math.E) < 1e-12) return "e";
  return Number.isInteger(b) ? String(b) : b.toPrecision(4);
}

export default LogCalculator;
