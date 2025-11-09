// src/pages/FactorialCalculator.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sigma,
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
const LS_KEY = "factorial_calculator_state_v1";
const URL_KEY = "fc";

const MAX_EXACT = 1000; // BigInt exact factorial limit (safe & quick in browser)
const MAX_CHART_N = 1000; // we chart log10(k!) up to this or n, whichever is smaller

const nf = (n: number, d = 6) =>
  Number.isFinite(n) ? Number(n.toFixed(d)).toLocaleString() : "—";

const clampInt = (v: number, min = 0, max = 100000): number =>
  Math.max(min, Math.min(max, Math.floor(Number.isFinite(v) ? v : 0)));

/* Kamenetsky approximation for n! (magnitude & first digits) */
function digitsInFactorial(n: number): number {
  if (n < 0) return NaN as unknown as number;
  if (n <= 1) return 1;
  const pi = Math.PI;
  const x = n * Math.log10(n / Math.E) + Math.log10(2 * pi * n) / 2;
  return Math.floor(x) + 1;
}

/* Stirling/Kamenetsky scaled mantissa (first k digits by scientific notation) */
function approxSci(n: number) {
  if (n <= 1) return { mantissa: 1, exponent: 0 };
  const pi = Math.PI;
  // log10(n!) ~ n log10(n/e) + 0.5 log10(2πn)
  const log10nFact = n * Math.log10(n / Math.E) + Math.log10(2 * pi * n) / 2;
  const exponent = Math.floor(log10nFact);
  const frac = log10nFact - exponent;
  const mantissa = Math.pow(10, frac);
  return { mantissa, exponent };
}

/* Exact factorial with BigInt (iterative) */
function factorialBigInt(n: number): bigint {
  let res = 1n;
  for (let i = 2n; i <= BigInt(n); i++) res *= i;
  return res;
}

/* Format very long BigInt: show head…tail + digits */
function formatBigIntPreview(x: bigint, head = 18, tail = 18) {
  const s = x.toString();
  if (s.length <= head + tail + 3) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)} (${s.length} digits)`;
}

/* Precompute log10(k!) series for chart */
function buildLogSeries(n: number) {
  const out: { k: number; log10fact: number }[] = [];
  let acc = 0;
  out.push({ k: 0, log10fact: 0 });
  for (let k = 1; k <= n; k++) {
    acc += Math.log10(k);
    out.push({ k, log10fact: acc });
  }
  return out;
}

/* ============================================================
   🧮 Component
   ============================================================ */
const FactorialCalculator: React.FC = () => {
  // Inputs
  const [n, setN] = useState<number>(10);

  // UI
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [showSteps, setShowSteps] = useState<boolean>(false);
  const [activeTip, setActiveTip] = useState<number>(0);
  const [hydrated, setHydrated] = useState<boolean>(false);

  const isDefault = n === 10;

  /* 🔁 Hydration & Persistence */
  const applyState = (s: any) => {
    setN(clampInt(Number(s.n) || 0, 0, 100000));
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
      console.warn("Failed to load factorial state:", e);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ n }));
    } catch {}
  }, [hydrated, n]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const url = new URL(window.location.href);
      if (isDefault) {
        url.searchParams.delete(URL_KEY);
        window.history.replaceState({}, "", url);
      } else {
        const encoded = btoa(JSON.stringify({ n }));
        url.searchParams.set(URL_KEY, encoded);
        window.history.replaceState({}, "", url);
      }
    } catch (e) {
      console.warn("Failed to update URL:", e);
    }
  }, [hydrated, n, isDefault]);

  /* 🧠 Math */
  const exactPossible = n <= MAX_EXACT;
  const digits = useMemo(() => digitsInFactorial(n), [n]);
  const sci = useMemo(() => approxSci(n), [n]);

  const exact = useMemo(() => {
    if (!exactPossible) return null as unknown as bigint | null;
    return factorialBigInt(n);
  }, [n, exactPossible]);

  const chartData = useMemo(
    () => buildLogSeries(Math.min(n, MAX_CHART_N)),
    [n]
  );

  const resultTitle =
    n >= 0 ? `${n}!` : "n must be a non-negative integer";

  /* 💡 Tips */
  const tips = useMemo(
    () => [
      "Tip: 0! = 1 by definition (empty product).",
      "Tip: n! grows faster than exponential; digits increase roughly ~ n log10 n.",
      "Tip: Use exact BigInt up to ~1,000; beyond that, use approximations.",
      "Tip: (n+1)! = (n+1) × n! (recursive relation).",
      "Tip: log10(n!) is the sum of log10(k) for k=1…n (handy for digits).",
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
    parts.push("Factorial Calculator");
    parts.push(`n: ${n}`);
    parts.push(`Digits in n!: ${digits}`);
    parts.push(
      `Approx n!: ${sci.mantissa.toFixed(6)} × 10^${sci.exponent}  (scientific)`
    );
    if (exactPossible && exact !== null) {
      parts.push(`Exact n!: ${exact.toString()}`);
    } else {
      parts.push(`Exact n!: (too large to display; use approximation)`);
    }
    await navigator.clipboard.writeText(parts.join("\n"));
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    const encoded = btoa(JSON.stringify({ n }));
    url.searchParams.set(URL_KEY, encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  const reset = () => {
    setN(10);
    setShowSteps(false);
    localStorage.removeItem(LS_KEY);
  };

  /* ============================================================
     🎨 Render
     ============================================================ */
  return (
    <>
     <SEOHead
          title="Factorial Calculator — Exact BigInt n!, Digits, Trailing Zeros & Scientific Approximation"
          description="Compute n! exactly with BigInt (fast up to ~1,000), digits in n!, trailing zeros, leading digits, and a precise scientific approximation. Includes log10(n!) growth chart and shareable links."
          keywords={[
            "factorial calculator","n factorial","n!","digits of n!","trailing zeros of factorial",
            "stirling approximation","kamenetsky","bigint factorial","log10 factorial","math tools"
          ]}
          canonical="https://calculatorhub.site/factorial-calculator"
          schemaData={[
            {
              "@context":"https://schema.org","@type":"WebPage","@id":"https://calculatorhub.site/factorial-calculator#webpage",
              "url":"https://calculatorhub.site/factorial-calculator",
              "name":"Factorial Calculator — Exact BigInt n!, Digits & Approximation",
              "inLanguage":"en",
              "isPartOf":{"@id":"https://calculatorhub.site/#website"},
              "primaryImageOfPage":{"@type":"ImageObject","url":"https://calculatorhub.site/images/factorial-calculator-hero.webp","width":1200,"height":675},
              "mainEntity":{
                "@type":"Article","@id":"https://calculatorhub.site/factorial-calculator#article",
                "headline":"Exact factorial (BigInt), digits, trailing zeros, and scientific approximation",
                "description":"Compute exact n! up to ~1,000 using BigInt, plus digits, trailing zeros, leading digits, and scientific approximation.",
                "image":["https://calculatorhub.site/images/factorial-calculator-hero.webp"],
                "author":{"@type":"Organization","name":"CalculatorHub","url":"https://calculatorhub.site"},
                "publisher":{"@id":"https://calculatorhub.site/#organization"},
                "datePublished":"2025-11-09","dateModified":"2025-11-09",
                "articleSection":["Factorial","Digits","Trailing Zeros","Stirling Approximation","Log Growth"]
              }
            },
            {
              "@context":"https://schema.org","@type":"BreadcrumbList","@id":"https://calculatorhub.site/factorial-calculator#breadcrumbs",
              "itemListElement":[
                {"@type":"ListItem","position":1,"name":"Home","item":"https://calculatorhub.site/"},
                {"@type":"ListItem","position":2,"name":"Math Tools","item":"https://calculatorhub.site/category/math-tools"},
                {"@type":"ListItem","position":3,"name":"Factorial Calculator","item":"https://calculatorhub.site/factorial-calculator"}
              ]
            },
            {
              "@context":"https://schema.org","@type":"FAQPage","@id":"https://calculatorhub.site/factorial-calculator#faq",
              "mainEntity":[
                {"@type":"Question","name":"How many digits are in n!?","acceptedAnswer":{"@type":"Answer","text":"We use a precise log-based formula to compute digits without evaluating n! directly."}},
                {"@type":"Question","name":"What are trailing zeros of n!?","acceptedAnswer":{"@type":"Answer","text":"They equal the exponent of 10 in n!, computed with Legendre’s formula summing ⌊n/5^k⌋."}},
                {"@type":"Question","name":"Do you show exact n!?","acceptedAnswer":{"@type":"Answer","text":"Yes, for n ≤ ~1,000 using BigInt. For larger n we show digits, leading digits, and a scientific approximation."}}
              ]
            },
            {
              "@context":"https://schema.org","@type":"WebApplication","@id":"https://calculatorhub.site/factorial-calculator#webapp",
              "name":"Factorial Calculator","url":"https://calculatorhub.site/factorial-calculator",
              "applicationCategory":"UtilitiesApplication","operatingSystem":"Web",
              "description":"Exact BigInt factorial up to ~1,000, plus digits, trailing zeros, leading digits, and scientific approximation."
            },
            {
              "@context":"https://schema.org","@type":"SoftwareApplication","@id":"https://calculatorhub.site/factorial-calculator#software",
              "name":"Advanced Factorial Calculator","applicationCategory":"UtilitiesApplication","operatingSystem":"All",
              "url":"https://calculatorhub.site/factorial-calculator",
              "description":"Compute n! exactly (BigInt) or via precise approximations with shareable results."
            },
            {
              "@context":"https://schema.org","@type":"WebSite","@id":"https://calculatorhub.site/#website",
              "url":"https://calculatorhub.site","name":"CalculatorHub",
              "publisher":{"@id":"https://calculatorhub.site/#organization"},
              "potentialAction":{"@type":"SearchAction","target":"https://calculatorhub.site/search?q={query}","query-input":"required name=query"}
            },
            {
              "@context":"https://schema.org","@type":"Organization","@id":"https://calculatorhub.site/#organization",
              "name":"CalculatorHub","url":"https://calculatorhub.site",
              "logo":{"@type":"ImageObject","url":"https://calculatorhub.site/images/logo.png"}
            }
          ]}
        />
        
        {/* Outside meta/link (minimal but complete) */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <link rel="canonical" href="https://calculatorhub.site/factorial-calculator" />
        <link rel="alternate" href="https://calculatorhub.site/factorial-calculator" hreflang="en" />
        <link rel="alternate" href="https://calculatorhub.site/bn/factorial-calculator" hreflang="bn" />
        <link rel="alternate" href="https://calculatorhub.site/factorial-calculator" hreflang="x-default" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="CalculatorHub" />
        <meta property="og:title" content="Factorial Calculator — Exact BigInt, Digits & Approximation" />
        <meta property="og:description" content="Exact n! up to ~1,000 with BigInt, plus digits, trailing zeros, and scientific approximation." />
        <meta property="og:url" content="https://calculatorhub.site/factorial-calculator" />
        <meta property="og:image" content="https://calculatorhub.site/images/factorial-calculator-hero.webp" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Factorial calculator UI showing digits and chart" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Factorial Calculator — Exact BigInt, Digits & Approximation" />
        <meta name="twitter:description" content="Compute n! exactly (BigInt) or via precise approximations, with digits and trailing zeros." />
        <meta name="twitter:image" content="https://calculatorhub.site/images/factorial-calculator-hero.webp" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="theme-color" content="#6366f1" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="preload" as="image" href="/images/factorial-calculator-hero.webp" fetchpriority="high" />
        <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
        <meta name="referrer" content="no-referrer-when-downgrade" />
        <meta name="format-detection" content="telephone=no" />


      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Math Tools", url: "/category/math-tools" },
            { name: "Factorial Calculator", url: "/factorial-calculator" },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            n! — Factorial Calculator
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Get <strong>exact n!</strong> with BigInt (up to ~{MAX_EXACT}), plus{" "}
            <strong>digits</strong> and a <strong>scientific approximation</strong>{" "}
            for very large n. Includes a growth chart and step-by-step explanation.
          </p>
        </div>

        {/* Promo bar */}
        <div className="hidden sm:flex mt-6 mb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white rounded-lg shadow-lg p-4 items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-lg">Explore more math tools 🧮</p>
            <p className="text-sm text-indigo-100">Try Percentage, Average, or Quadratic Solver next!</p>
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
                <Sigma className="h-5 w-5 text-sky-400" /> Inputs
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
                  <label className="text-sm font-medium text-slate-300">n (non-negative integer)</label>
                  <Info
                    className="h-4 w-4 text-slate-400"
                    title={`Exact BigInt up to ${MAX_EXACT}. For larger n we show digits and a scientific approximation.`}
                  />
                </div>
                <input
                  type="number"
                  value={n}
                  onChange={(e) => setN(clampInt(parseFloat(e.target.value) || 0))}
                  min={0}
                  step={1}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <div className="text-xs text-slate-400 mt-2">
                  n! grows extremely fast. For n &gt; {MAX_EXACT}, exact value is not computed; we display digits and scientific approximation.
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">Results</h2>
            <div className="space-y-6">
              {/* Summary tiles */}
              <div className="grid grid-cols-2 gap-4">
                <Tile label="Expression" value={resultTitle} />
                <Tile label="Digits in n!" value={digits.toLocaleString()} />
                <Tile
                  label="Approx n! (scientific)"
                  value={`${sci.mantissa.toFixed(6)} × 10^${sci.exponent}`}
                />
                <Tile
                  label="log₁₀(n!) (approx)"
                  value={nf(Math.log10(2 * Math.PI * Math.max(1, n)) / 2 + n * Math.log10(Math.max(1, n) / Math.E))}
                />
              </div>

              {/* Exact / Preview */}
              <div className="p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                <div className="text-sm text-slate-400 mb-2">Exact Value</div>
                {n === 0 || n === 1 ? (
                  <div className="text-white font-semibold">1</div>
                ) : exactPossible && exact !== null ? (
                  <div className="text-white font-semibold break-all">
                    {formatBigIntPreview(exact, 36, 36)}
                  </div>
                ) : (
                  <div className="text-slate-300">
                    Exact n! is extremely large (over {digits.toLocaleString()} digits). Showing scientific approximation instead.
                  </div>
                )}
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
        {chartData.length > 1 && (
          <div className="mt-5 bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              Growth of log₁₀(k!) for k = 0…{Math.min(n, MAX_CHART_N)}
            </h3>
            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="k" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ReTooltip formatter={(v: any) => nf(Number(v), 4)} />
                  <Legend />
                  <Line type="monotone" dataKey="log10fact" name="log₁₀(k!)" dot={false} />
                </LineChart>
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
            <span>🧮 Step-by-Step</span>
            {showSteps ? <ChevronUp /> : <ChevronDown />}
          </button>

          {showSteps && (
            <div className="px-6 pb-8 pt-4 space-y-3 text-slate-200">
              <h4 className="font-semibold text-cyan-300">Definition</h4>
              <p>
                n! = 1 × 2 × 3 × … × n, with 0! = 1. We compute exact n! using BigInt when n ≤ {MAX_EXACT}.
              </p>

              <h4 className="font-semibold text-cyan-300">Digits in n!</h4>
              <p>
                digits(n!) = ⌊log₁₀(n!)⌋ + 1, where log₁₀(n!) ≈ n·log₁₀(n/e) + ½·log₁₀(2πn).
                For large n, this gives an accurate digit count without computing n!.
              </p>

              <h4 className="font-semibold text-cyan-300">Scientific Approximation</h4>
              <p>
                n! ≈ m × 10^E, with E = ⌊log₁₀(n!)⌋ and m = 10^(fractional part of log₁₀(n!)).
                We show m to 6 decimal places.
              </p>


              <div className="h-2 w-full mt-6 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 blur-[2px]" />
            </div>
          )}
        </div>

        {/* Short SEO content */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          <h1 className="text-3xl font-bold text-cyan-400 mb-6">
            Factorial Calculator – Exact BigInt & Accurate Approximation
          </h1>
          <p>
            Enter a non-negative integer <strong>n</strong> to compute <strong>n!</strong>. For{" "}
            <em>n ≤ {MAX_EXACT}</em>, you’ll see the <strong>exact BigInt value</strong>. For larger inputs,
            you’ll get the <strong>digit count</strong> and a precise <strong>scientific approximation</strong>
            using Stirling/Kamenetsky formulas. A growth chart visualizes <em>log₁₀(n!)</em>.
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
                to="/percentage-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
              >
                % Percentage Calculator
              </Link>
              <Link
                to="/average-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-400 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
              >
                📊 Average Calculator
              </Link>
              <Link
                to="/quadratic-equation-solver"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-pink-600/20 text-pink-300 hover:text-pink-400 px-3 py-2 rounded-md border border-slate-700 hover:border-pink-500 transition-all duration-200"
              >
                𝑎x²+𝑏x+𝑐 Quadratic Solver
              </Link>
            </div>
          </div>
        </section>

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/factorial-calculator" category="math-tools" />
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

export default FactorialCalculator;
 
