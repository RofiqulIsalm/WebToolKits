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
  Download,
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

const MAX_EXACT = 1000;   // BigInt exact factorial limit (safe & quick in browser)
const MAX_CHART_N = 1000; // we chart log10(k!) up to this or n, whichever is smaller

const nf = (n: number, d = 6) =>
  Number.isFinite(n) ? Number(n.toFixed(d)).toLocaleString() : "—";

const clampInt = (v: number, min = 0, max = 100000): number =>
  Math.max(min, Math.min(max, Math.floor(Number.isFinite(v) ? v : 0)));

/* Kamenetsky/Stirling approximation for digits in n! */
function digitsInFactorial(n: number): number {
  if (n < 0) return NaN as unknown as number;
  if (n <= 1) return 1;
  const pi = Math.PI;
  const x = n * Math.log10(n / Math.E) + Math.log10(2 * pi * n) / 2;
  return Math.floor(x) + 1;
}

/* Scientific form for n!: n! ≈ mantissa × 10^exponent (1 ≤ mantissa < 10) */
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

/* Trailing zeros of n! using Legendre’s formula */
function trailingZeros(n: number): number {
  if (n <= 0) return 0;
  let tz = 0;
  for (let p = 5; p <= n; p *= 5) tz += Math.floor(n / p);
  return tz;
}

/* First K leading digits of n! using mantissa from approxSci */
function firstKDigitsOfFactorial(n: number, k = 5): string {
  if (n <= 1) return "1";
  const { mantissa } = approxSci(n); // 1 ≤ mantissa < 10
  // first K digits = floor(10^( log10(mantissa) + K - 1 ))
  const val = Math.floor(Math.pow(10, Math.log10(mantissa) + k - 1));
  return String(val);
}

/* Exact factorial with BigInt (iterative) */
function factorialBigInt(n: number): bigint {
  let res = 1n;
  for (let i = 2n; i <= BigInt(n); i++) res *= i;
  return res;
}

/* Format very long BigInt: show head…tail + digits */
function formatBigIntPreview(x: bigint, head = 36, tail = 36) {
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

/* Trigger download of a text file */
function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ============================================================
   🧮 Component
   ============================================================ */
const FactorialCalculator: React.FC = () => {
  // Inputs
  const [n, setN] = useState<number>(10);
  const [kDigits, setKDigits] = useState<number>(5); // how many leading digits to show

  // UI
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [showSteps, setShowSteps] = useState<boolean>(false);
  const [activeTip, setActiveTip] = useState<number>(0);
  const [hydrated, setHydrated] = useState<boolean>(false);

  const isDefault = n === 10 && kDigits === 5;

  /* 🔁 Hydration & Persistence */
  const applyState = (s: any) => {
    setN(clampInt(Number(s.n) || 0, 0, 100000));
    setKDigits(clampInt(Number(s.kDigits) || 5, 2, 12));
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
      localStorage.setItem(LS_KEY, JSON.stringify({ n, kDigits }));
    } catch {}
  }, [hydrated, n, kDigits]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const url = new URL(window.location.href);
      if (isDefault) {
        url.searchParams.delete(URL_KEY);
        window.history.replaceState({}, "", url);
      } else {
        const encoded = btoa(JSON.stringify({ n, kDigits }));
        url.searchParams.set(URL_KEY, encoded);
        window.history.replaceState({}, "", url);
      }
    } catch (e) {
      console.warn("Failed to update URL:", e);
    }
  }, [hydrated, n, kDigits, isDefault]);

  /* 🧠 Math */
  const exactPossible = n <= MAX_EXACT;
  const digits = useMemo(() => digitsInFactorial(n), [n]);
  const sci = useMemo(() => approxSci(n), [n]);
  const tz = useMemo(() => trailingZeros(n), [n]);

  // leading digits and log10(n!) (approx) aligned with approxSci
  const firstDigits = useMemo(() => firstKDigitsOfFactorial(n, kDigits), [n, kDigits]);
  const log10Approx = useMemo(() => {
    if (n <= 1) return 0;
    return n * Math.log10(n / Math.E) + 0.5 * Math.log10(2 * Math.PI * n);
  }, [n]);

  const exact = useMemo(() => {
    if (!exactPossible) return null as unknown as bigint | null;
    return factorialBigInt(n);
  }, [n, exactPossible]);

  const chartData = useMemo(
    () => buildLogSeries(Math.min(n, MAX_CHART_N)),
    [n]
  );

  const resultTitle = n >= 0 ? `${n}!` : "n must be a non-negative integer";

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

  /* 🔗 Actions */
  const copyResults = async () => {
    const parts: string[] = [];
    parts.push("Factorial Calculator");
    parts.push(`n: ${n}`);
    parts.push(`Digits in n!: ${digits}`);
    parts.push(`Trailing zeros: ${tz}`);
    parts.push(`First ${kDigits} digits: ${firstDigits}`);
    parts.push(`Approx n!: ${sci.mantissa.toFixed(6)} × 10^${sci.exponent} (scientific)`);
    if (exactPossible && exact !== null) {
      parts.push(`Exact n!: ${exact.toString()}`);
    } else {
      parts.push(`Exact n!: (too large to display; using approximation)`);
    }
    await navigator.clipboard.writeText(parts.join("\n"));
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    const encoded = btoa(JSON.stringify({ n, kDigits }));
    url.searchParams.set(URL_KEY, encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  const downloadExact = () => {
    if (!exactPossible || exact == null) return;
    downloadTextFile(`${n}-factorial.txt`, exact.toString());
  };

  const reset = () => {
    setN(10);
    setKDigits(5);
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
        description="Compute n! exactly with BigInt (fast up to ~1,000), digits in n!, trailing zeros, and leading digits. See a precise scientific approximation and a log10(n!) growth chart. Share or copy results."
        keywords={[
          "factorial calculator","n factorial","n!","digits of n!","trailing zeros of factorial",
          "leading digits factorial","stirling approximation","kamenetsky","bigint factorial","log10 factorial","math tools"
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
              "headline":"Exact factorial (BigInt), digits, trailing zeros, leading digits, and scientific approximation",
              "description":"Compute exact n! up to ~1,000 using BigInt, plus digits, trailing zeros, first K digits, and scientific approximation.",
              "image":["https://calculatorhub.site/images/factorial-calculator-hero.webp"],
              "author":{"@type":"Organization","name":"CalculatorHub","url":"https://calculatorhub.site"},
              "publisher":{"@id":"https://calculatorhub.site/#organization"},
              "datePublished":"2025-11-09","dateModified":"2025-11-09",
              "articleSection":["Factorial","Digits","Trailing Zeros","Leading Digits","Stirling Approximation","Log Growth"]
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
      <meta property="og:title" content="Factorial Calculator — Exact BigInt, Digits, Trailing Zeros & Leading Digits" />
      <meta property="og:description" content="Exact n! up to ~1,000 with BigInt; digits, trailing zeros, first K digits, and scientific approximation." />
      <meta property="og:url" content="https://calculatorhub.site/factorial-calculator" />
      <meta property="og:image" content="https://calculatorhub.site/images/factorial-calculator-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Factorial calculator UI showing digits, zeros, and chart" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Factorial Calculator — Exact BigInt, Digits, Trailing Zeros & Leading Digits" />
      <meta name="twitter:description" content="Compute n! exactly (BigInt) or via precise approximations, with digits, trailing zeros, and leading digits." />
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
            <strong>digits</strong>, <strong>trailing zeros</strong>, and the{" "}
            <strong>first K leading digits</strong>. For very large n, see a precise{" "}
            <strong>scientific approximation</strong> and a log₁₀(n!) growth chart.
          </p>
        </div>

        {/* Promo bar */}
        <div className="hidden sm:flex mt-6 mb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white rounded-lg shadow-lg p-4 items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-lg">Explore more math tools 🧮</p>
            <p className="text-sm text-indigo-100">Try Percentage, Average, or Quadratic Solver next!</p>
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
              {/* n input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">n (non-negative integer)</label>
                  <Info
                    className="h-4 w-4 text-slate-400"
                    title={`Exact BigInt up to ${MAX_EXACT}. For larger n we show digits, leading digits, trailing zeros and a scientific approximation.`}
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
                  n! grows extremely fast. For n &gt; {MAX_EXACT}, exact value is not computed.
                </div>
              </div>

              {/* K digits input */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    First K digits (2–12)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={12}
                    value={kDigits}
                    onChange={(e) => setKDigits(clampInt(parseFloat(e.target.value) || 5, 2, 12))}
                    className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Leading digits are derived from the scientific form of n!.
                  </p>
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
                <Tile label="Trailing zeros in n!" value={tz.toLocaleString()} />
                <Tile label={`First ${kDigits} digits of n!`} value={firstDigits} />
                <Tile
                  label="Approx n! (scientific)"
                  value={`${sci.mantissa.toFixed(6)} × 10^${sci.exponent}`}
                />
                <Tile label="log₁₀(n!) (approx)" value={nf(log10Approx)} />
              </div>

              {/* Exact / Preview */}
              <div className="p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                <div className="text-sm text-slate-400 mb-2">Exact Value</div>
                {n === 0 || n === 1 ? (
                  <div className="text-white font-semibold">1</div>
                ) : exactPossible && exact !== null ? (
                  <>
                    <div className="text-white font-semibold break-all">
                      {formatBigIntPreview(exact, 36, 36)}
                    </div>
                    <div className="mt-3">
                      <button
                        onClick={downloadExact}
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md text-sm"
                      >
                        <Download size={16} /> Download exact n!
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-300">
                    Exact n! is extremely large (≈ {digits.toLocaleString()} digits).
                    Showing scientific approximation and leading digits instead.
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

              <h4 className="font-semibold text-cyan-300">Trailing Zeros</h4>
              <p>
                The number of trailing zeros equals the exponent of 10 in n!, computed by Legendre’s formula:
                tz(n) = Σ ⌊n/5ᵏ⌋ for k ≥ 1.
              </p>

              <h4 className="font-semibold text-cyan-300">Leading Digits</h4>
              <p>
                If n! ≈ m × 10^E with 1 ≤ m &lt; 10, then the first K digits are
                ⌊10^(log₁₀(m) + K − 1)⌋.
              </p>

              <h4 className="font-semibold text-cyan-300">Scientific Approximation</h4>
              <p>
                n! ≈ m × 10^E, with E = ⌊log₁₀(n!)⌋ and m = 10^(fractional part of log₁₀(n!)).
              </p>

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
              <li><a href="#what-is-factorial" className="text-indigo-300 hover:underline">What is a Factorial?</a></li>
              <li><a href="#features" className="text-indigo-300 hover:underline">Key Features of this Calculator</a></li>
              <li><a href="#how-to-use" className="text-indigo-300 hover:underline">How to Use</a></li>
              <li><a href="#methods" className="text-indigo-300 hover:underline">Methods & Math Under the Hood</a></li>
              <li><a href="#worked-examples" className="text-indigo-300 hover:underline">Worked Examples</a></li>
              <li><a href="#trailing-zeros" className="text-indigo-300 hover:underline">Trailing Zeros Explained</a></li>
              <li><a href="#leading-digits" className="text-indigo-300 hover:underline">Leading Digits (First K)</a></li>
              <li><a href="#digits-count" className="text-indigo-300 hover:underline">How Many Digits in n!?</a></li>
              <li><a href="#performance" className="text-indigo-300 hover:underline">Performance, Precision & Limits</a></li>
              <li><a href="#pitfalls" className="text-indigo-300 hover:underline">Common Pitfalls & How to Avoid Them</a></li>
              <li><a href="#use-cases" className="text-indigo-300 hover:underline">Where Factorials Show Up in Real Life</a></li>
              <li><a href="#quick-ref" className="text-indigo-300 hover:underline">Quick Reference Table (n, n!, digits, zeros)</a></li>
              <li><a href="#glossary" className="text-indigo-300 hover:underline">Glossary</a></li>
              <li><a href="#faq" className="text-indigo-300 hover:underline">FAQ</a></li>
            </ol>
          </nav>
        
          {/* ===== What is a Factorial? ===== */}
          <h1 id="what-is-factorial" className="text-3xl font-bold text-indigo-300 mb-6">
            Factorial (n!) — definition, growth, and why it matters
          </h1>
          <p>
            The <strong>factorial</strong> of a non-negative integer <em>n</em>, written <strong>n!</strong>, is the product of all
            integers from 1 to n. By definition, <strong>0! = 1</strong> (the empty product). Factorials grow <em>extremely</em>
            fast—so fast that even for moderate n, the exact value already contains a massive number of digits. This growth
            rate is the reason factorials power so many fields: counting problems, permutations and combinations, probability,
            series expansions in calculus, and asymptotic analysis in algorithms and physics.
          </p>
          <p>
            On this page, you can compute <strong>exact factorials with BigInt</strong> for n up to about <strong>1,000</strong>,
            and for larger n get reliable <strong>digit counts</strong>, <strong>trailing zeros</strong>, <strong>leading digits</strong>,
            and a smooth <strong>scientific approximation</strong>. A growth chart also visualizes <em>log₁₀(n!)</em> to make
            sense of the scale.
          </p>
        
          {/* ===== Features ===== */}
          <h2 id="features" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            ✨ Key features of this Factorial Calculator
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Exact BigInt n!</strong> up to ~1,000 (fast in modern browsers).</li>
            <li><strong>Digits in n!</strong> using a precise, log-based formula—no need to expand n! explicitly.</li>
            <li><strong>Trailing zeros</strong> via Legendre’s formula (sum of ⌊n/5ᵏ⌋).</li>
            <li><strong>First K leading digits</strong> of n! by leveraging the scientific mantissa of n!.</li>
            <li><strong>Scientific approximation</strong> (mantissa × 10^exponent) matching Stirling/Kamenetsky accuracy.</li>
            <li><strong>log₁₀(n!) growth chart</strong> to visualize scale and compare different n.</li>
            <li><strong>Copy/Share</strong> your results or download the exact BigInt value as a text file (when available).</li>
          </ul>
        
          {/* ===== How to Use ===== */}
          <h2 id="how-to-use" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">🧭 How to use this calculator</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter a <strong>non-negative integer n</strong> (0, 1, 2, …).</li>
            <li>Set <strong>First K digits</strong> if you want a short leading-digits preview (2–12).</li>
            <li>Read off:
              <ul className="list-disc list-inside ml-5 mt-1">
                <li><em>Digits in n!</em> — how many digits the exact number has.</li>
                <li><em>Trailing zeros</em> — how many zeroes appear at the end of n! in base 10.</li>
                <li><em>First K digits</em> — the very front of n!’s decimal expansion.</li>
                <li><em>Approx n!</em> — a clean scientific representation <code>m × 10^E</code>.</li>
              </ul>
            </li>
            <li>If <strong>n ≤ 1000</strong>, you’ll also see an <strong>Exact Value</strong> preview with a download button.</li>
          </ol>
          <p className="text-sm text-slate-400">
            Tip: For very large inputs, computing exact n! is impractical—use the digits, zeros, and scientific form instead.
          </p>
        
          {/* ===== Methods ===== */}
          <h2 id="methods" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🔧 Methods & math under the hood
          </h2>
          <h3 className="text-xl font-semibold text-indigo-300">1) Exact factorial with BigInt (iterative)</h3>
          <p>
            For <strong>n ≤ 1000</strong>, we compute n! exactly with <code>BigInt</code> in a simple product loop.
            BigInt arithmetic is precise, but memory/time grow quickly—hence the limit.
          </p>
        
          <h3 className="text-xl font-semibold text-indigo-300 mt-6">2) Digits in n! (log formula)</h3>
          <p>
            The number of decimal digits in n! is <code>⌊log₁₀(n!)⌋ + 1</code>. We evaluate <code>log₁₀(n!)</code> using a
            refined Stirling/Kamenetsky-style expression:
          </p>
          <pre className="bg-[#0f172a] border border-[#334155] rounded-lg p-3 overflow-x-auto text-sm">
            log₁₀(n!) ≈ n·log₁₀(n/e) + ½·log₁₀(2πn)
          </pre>
          <p>
            This avoids constructing n! and remains very accurate even for large n.
          </p>
        
          <h3 className="text-xl font-semibold text-indigo-300 mt-6">3) Scientific approximation (mantissa × 10^exponent)</h3>
          <p>
            We compute <code>log₁₀(n!)</code>, split it into integer part <code>E = ⌊log₁₀(n!)⌋</code> and fractional part
            <code>f</code>, then set <code>mantissa = 10^f</code>. Thus:
          </p>
          <pre className="bg-[#0f172a] border border-[#334155] rounded-lg p-3 overflow-x-auto text-sm">
            n! ≈ mantissa × 10^E  with 1 ≤ mantissa &lt; 10
          </pre>
        
          <h3 className="text-xl font-semibold text-indigo-300 mt-6">4) Trailing zeros via Legendre</h3>
          <p>
            The number of trailing zeros equals the exponent of 10 in the prime factorization of n!. Since 10 = 2×5 and there
            are always more 2s than 5s, the count reduces to the number of 5s:
          </p>
          <pre className="bg-[#0f172a] border border-[#334155] rounded-lg p-3 overflow-x-auto text-sm">
            zeros(n) = ⎣n/5⎦ + ⎣n/25⎦ + ⎣n/125⎦ + …
          </pre>
        
          <h3 className="text-xl font-semibold text-indigo-300 mt-6">5) Leading digits from the mantissa</h3>
          <p>
            With <code>n! ≈ m × 10^E</code> and <code>1 ≤ m &lt; 10</code>, the first K digits equal:
          </p>
          <pre className="bg-[#0f172a] border border-[#334155] rounded-lg p-3 overflow-x-auto text-sm">
            firstK = ⎣10^(log₁₀(m) + K − 1)⎦
          </pre>
          <p>
            Because <code>m</code> captures the front of n!, this gives a faithful leading-digits preview without the full number.
          </p>
        
          {/* ===== Worked Examples ===== */}
          <h2 id="worked-examples" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🧪 Worked examples (rounded for readability)
          </h2>
          <ul className="space-y-2">
            <li><strong>n = 0</strong>: 0! = 1; digits = 1; zeros = 0; first K digits = 1.</li>
            <li><strong>n = 10</strong>: 10! = 3 628 800; digits = 7; zeros = 2 (from ⌊10/5⌋ = 2).</li>
            <li><strong>n = 25</strong>: zeros = ⌊25/5⌋ + ⌊25/25⌋ = 5 + 1 = <strong>6</strong>.</li>
            <li><strong>n = 100</strong>: zeros = ⌊100/5⌋ + ⌊100/25⌋ = 20 + 4 = <strong>24</strong>; digits ≈ 158.</li>
            <li><strong>n = 1000</strong>: exact BigInt available; digits ≈ 2568; zeros = ⌊1000/5⌋ + ⌊1000/25⌋ + … = 249.</li>
            <li><strong>n = 10 000</strong>: digits ≈ 35 660 (approx.); zeros = 2 499; use approximation + zeros/leading digits.</li>
          </ul>
        
          {/* ===== Trailing Zeros ===== */}
          <h2 id="trailing-zeros" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🦶 Trailing zeros explained
          </h2>
          <p>
            Every trailing zero requires a factor of 10. In n!, factors of 2 are plentiful; factors of 5 are rarer. Counting
            how many times 5 appears among the factors of 1…n gives the number of zeros. That’s why the formula adds floor
            divisions by 5, 25, 125, etc. (higher powers of 5 contribute extra 5s).
          </p>
        
          {/* ===== Leading Digits ===== */}
          <h2 id="leading-digits" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🔢 Leading digits (first K)
          </h2>
          <p>
            The scientific form isolates the <strong>mantissa</strong> (a number in [1,10)). Elevating 10 to its logarithm,
            shifted by K−1, yields an integer equal to the first K digits. This trick is common in numerical analysis for
            pulling leading digits from enormous quantities.
          </p>
        
          {/* ===== Digits Count ===== */}
          <h2 id="digits-count" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🔍 How many digits are in n!?
          </h2>
          <p>
            Counting digits directly via <code>⌊log₁₀(n!)⌋ + 1</code> is both fast and robust. You can think of it as placing n!
            on a base-10 number line: the integer part of <code>log₁₀(n!)</code> tells you how many powers of 10 fit below n!.
          </p>

          <AdBanner type="bottom" />
          {/* ===== Performance ===== */}
          <h2 id="performance" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🚀 Performance, precision & limits
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Exact mode</strong> uses an O(n) BigInt product; digits grow ~O(n log n), so memory grows quickly.</li>
            <li><strong>Approx mode</strong> avoids BigInt and stays fast even for very large n.</li>
            <li><strong>Stability</strong>: Using logarithms and mantissa/exponent keeps numbers within safe floating-point ranges.</li>
            <li><strong>Browser-friendly</strong>: The limit of ~1000 for exact n! balances speed, memory, and UX.</li>
          </ul>
        
          {/* ===== Pitfalls ===== */}
          <h2 id="pitfalls" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            ⚠️ Common pitfalls & how to avoid them
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Negative n</strong>: Factorial is only defined for non-negative integers (in this discrete sense).</li>
            <li><strong>Float inputs</strong>: Use integers; if you need real/complex extension, see the Gamma function Γ(n+1).</li>
            <li><strong>Overflow/lag</strong>: Don’t attempt exact n! far beyond 1000 in the browser—use approximations.</li>
            <li><strong>Rounding display</strong>: The exact value is precise; rounded summaries are for readability only.</li>
          </ul>
        
          {/* ===== Use Cases ===== */}
          <h2 id="use-cases" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🧰 Where factorials show up in real life
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Combinatorics</strong>: permutations (n!), arrangements, derangements, and counting arguments.</li>
            <li><strong>Probability</strong>: binomial/multinomial coefficients, distributions, and likelihoods.</li>
            <li><strong>Analysis</strong>: power series (e.g., eˣ = Σ xⁿ/n!), asymptotics, and bounds.</li>
            <li><strong>Physics & Chem</strong>: state counts, partition functions, reaction permutations.</li>
            <li><strong>CS & Algorithms</strong>: complexity estimates, exhaustive search bounds, DP state sizing.</li>
          </ul>
        
          {/* ===== Quick Reference Table ===== */}
          <h2 id="quick-ref" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🗂️ Quick reference (n, n!, digits, zeros)
          </h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-300">
                  <th className="py-2 pr-4">n</th>
                  <th className="py-2 pr-4">n!</th>
                  <th className="py-2 pr-4">Digits</th>
                  <th className="py-2">Trailing Zeros</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                <tr><td>5</td><td>120</td><td>3</td><td>1</td></tr>
                <tr><td>10</td><td>3 628 800</td><td>7</td><td>2</td></tr>
                <tr><td>20</td><td>2 432 902 008 176 640 000</td><td>19</td><td>4</td></tr>
                <tr><td>25</td><td>~</td><td>26</td><td>6</td></tr>
                <tr><td>50</td><td>~</td><td>65</td><td>12</td></tr>
                <tr><td>100</td><td>~</td><td>158</td><td>24</td></tr>
                <tr><td>1000</td><td>~</td><td>2568</td><td>249</td></tr>
              </tbody>
            </table>
            <p className="text-xs text-slate-400 mt-2">
              “~” indicates values that are large enough to prefer approximation in the table. The app still calculates exact n! up to ~1000.
            </p>
          </div>
        
          {/* ===== Glossary ===== */}
          <h2 id="glossary" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">📚 Glossary</h2>
          <p className="space-y-2">
            <strong>Factorial (n!)</strong>: Product 1×2×…×n, with 0!=1. <br/>
            <strong>Legendre’s formula</strong>: Sums floor divisions by powers of primes to count prime exponents in n!. <br/>
            <strong>Stirling/Kamenetsky</strong>: Approximations for n! and log n! accurate for large n. <br/>
            <strong>Mantissa/Exponent</strong>: In scientific form n! ≈ m×10^E, m∈[1,10), E∈ℤ. <br/>
            <strong>log₁₀(n!)</strong>: Base-10 logarithm of n!; its integer part drives digit counts and scientific exponent.
          </p>
        
          {/* ===== FAQ ===== */}
          <section className="space-y-6 mt-16">
            <h2 id="faq" className="text-3xl md:text-4xl font-bold mb-4 text-center text-indigo-200">
              ❓ Frequently Asked Questions (FAQ)
            </h2>
        
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q1: Why does 0! equal 1?</h3>
                <p>
                  It’s defined as the empty product, which equals 1. This keeps combinatorics and series identities consistent
                  (e.g., n! = n×(n−1)! holds for n=1).
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q2: How do you count digits without computing n!?</h3>
                <p>
                  We evaluate <code>log₁₀(n!)</code> using a Stirling/Kamenetsky expression and return ⌊log₁₀(n!)⌋+1.
                  It’s precise and fast even for huge n.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q3: Why can’t you show exact n! for very large n?</h3>
                <p>
                  The number of digits explodes, making exact BigInt construction and rendering impractical in browsers. We show
                  exact values up to ~1000; beyond that, approximations are the right tool.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q4: Are the leading digits exact?</h3>
                <p>
                  They’re derived from the mantissa of n!’s scientific form and match the true leading digits with high accuracy,
                  even for very large n.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q5: What about non-integer or negative inputs?</h3>
                <p>
                  This tool targets non-negative integers. For real/complex extension, see the Gamma function Γ(z), with Γ(n+1)=n!.
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
                Specialists in math utilities & UX. Last updated: <time dateTime="2025-11-09">November 9, 2025</time>.
              </p>
            </div>
          </div>
        
          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              🚀 Explore more tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <a
                href="/percentage-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-200 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
              >
                % Percentage Calculator
              </a>
              <a
                href="/average-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-200 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
              >
                📊 Average Calculator
              </a>
              <a
                href="/quadratic-equation-solver"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-pink-600/20 text-pink-300 hover:text-pink-200 px-3 py-2 rounded-md border border-slate-700 hover:border-pink-500 transition-all duration-200"
              >
                𝑎x²+𝑏x+𝑐 Quadratic Solver
              </a>
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
