// src/pages/GcdLcmCalculator.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Divide,
  RotateCcw,
  Share2,
  Copy,
  ChevronDown,
  ChevronUp,
  Info,
  List,
} from "lucide-react";

import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import { generateCalculatorSchema } from "../utils/seoData";
import RelatedCalculators from "../components/RelatedCalculators";

/* ============================================================
   📦 Constants & Utilities
   ============================================================ */
const LS_KEY = "gcd_lcm_calculator_state_v1";
const URL_KEY = "gl";

const toTokens = (s: string) =>
  s
    .trim()
    .split(/[\s,;|\n]+/)
    .filter(Boolean);

const toInts = (s: string) => {
  const tokens = toTokens(s);
  const nums = tokens
    .map((t) => Number(t))
    .filter((v) => Number.isFinite(v))
    .map((v) => (v < 0 ? Math.trunc(v) : Math.trunc(v))); // integerize via trunc
  return nums;
};

const abs = (n: number) => Math.abs(n);

/** Euclidean algorithm for two integers, returns gcd and step log */
function gcdTwo(a0: number, b0: number) {
  let a = abs(a0);
  let b = abs(b0);
  const steps: Array<{ a: number; b: number; q: number; r: number }> = [];

  if (a === 0 && b === 0) {
    return { gcd: 0, steps };
  }
  if (a === 0) {
    steps.push({ a, b, q: 0, r: b });
    return { gcd: b, steps };
  }
  if (b === 0) {
    steps.push({ a, b, q: 0, r: a });
    return { gcd: a, steps };
  }

  while (b !== 0) {
    const q = Math.floor(a / b);
    const r = a % b;
    steps.push({ a, b, q, r });
    a = b;
    b = r;
  }
  return { gcd: a, steps };
}

/** LCM for two integers using gcd; handles zero */
function lcmTwo(a: number, b: number) {
  if (a === 0 || b === 0) return 0;
  const g = gcdTwo(a, b).gcd;
  return abs((a / g) * b); // avoid overflow a*b first (divide then multiply)
}

/** Reduce an array to gcd with per-step summary */
function gcdMany(arr: number[]) {
  if (arr.length === 0) return { gcd: 0, chain: [] as string[] };
  let g = abs(arr[0]);
  const chain: string[] = [];
  for (let i = 1; i < arr.length; i++) {
    const prev = g;
    const cur = arr[i];
    g = gcdTwo(g, cur).gcd;
    chain.push(`gcd(${prev}, ${cur}) = ${g}`);
  }
  return { gcd: g, chain };
}

/** Reduce an array to lcm with per-step summary */
function lcmMany(arr: number[]) {
  if (arr.length === 0) return { lcm: 0, chain: [] as string[] };
  let l = abs(arr[0]);
  const chain: string[] = [];
  for (let i = 1; i < arr.length; i++) {
    const prev = l;
    const cur = arr[i];
    l = lcmTwo(l, cur);
    chain.push(`lcm(${prev}, ${cur}) = ${l}`);
    if (l === 0) break; // once zero, stays zero
  }
  return { lcm: l, chain };
}

const fmt = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString("en-US") : "—";

/* ============================================================
   🧮 Component
   ============================================================ */
const GcdLcmCalculator: React.FC = () => {
  // Inputs
  const [numsStr, setNumsStr] = useState<string>("24, 60, 36");
  const [showEuclidPair, setShowEuclidPair] = useState<boolean>(true); // show two-number Euclid details (first two)
  const [pairIndex, setPairIndex] = useState<number>(0); // index of the pair start for Euclid steps

  // UI
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [showSteps, setShowSteps] = useState<boolean>(false);
  const [activeTip, setActiveTip] = useState<number>(0);
  const [hydrated, setHydrated] = useState<boolean>(false);

  const isDefault = numsStr === "24, 60, 36" && showEuclidPair && pairIndex === 0;

  /* 🔁 Hydration & Persistence */
  const applyState = (s: any) => {
    setNumsStr(String(s.numsStr || ""));
    setShowEuclidPair(Boolean(s.showEuclidPair));
    setPairIndex(Number.isFinite(Number(s.pairIndex)) ? Number(s.pairIndex) : 0);
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
      console.warn("Failed to load gcd/lcm state:", e);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const state = { numsStr, showEuclidPair, pairIndex };
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {}
  }, [hydrated, numsStr, showEuclidPair, pairIndex]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const url = new URL(window.location.href);
      if (isDefault) {
        url.searchParams.delete(URL_KEY);
        window.history.replaceState({}, "", url);
      } else {
        const encoded = btoa(JSON.stringify({ numsStr, showEuclidPair, pairIndex }));
        url.searchParams.set(URL_KEY, encoded);
        window.history.replaceState({}, "", url);
      }
    } catch (e) {
      console.warn("Failed to update URL:", e);
    }
  }, [hydrated, numsStr, showEuclidPair, pairIndex, isDefault]);

  /* 🧠 Calculations */
  const ints = useMemo(() => toInts(numsStr), [numsStr]);

  const { gcd: gcdValue, chain: gcdChain } = useMemo(() => gcdMany(ints), [ints]);
  const { lcm: lcmValue, chain: lcmChain } = useMemo(() => lcmMany(ints), [ints]);

  // Detailed Euclid steps for a selected adjacent pair (or first two if not enough)
  const pairA = useMemo(
    () => (ints.length >= 2 ? ints[Math.min(pairIndex, Math.max(0, ints.length - 2))] : NaN),
    [ints, pairIndex]
  );
  const pairB = useMemo(
    () =>
      ints.length >= 2
        ? ints[Math.min(pairIndex, Math.max(0, ints.length - 2)) + 1]
        : NaN,
    [ints, pairIndex]
  );

  const euclidSteps = useMemo(() => {
    if (!showEuclidPair || !Number.isFinite(pairA) || !Number.isFinite(pairB)) return [];
    return gcdTwo(pairA, pairB).steps;
  }, [showEuclidPair, pairA, pairB]);

  // Edge hints
  const emptyInput = ints.length === 0;
  const nonIntegersNotice = useMemo(() => {
    const raw = toTokens(numsStr);
    if (raw.length === 0) return false;
    // If any token parsed to finite number but had decimals, we treated via trunc; detect that
    return raw.some((t) => {
      const v = Number(t);
      return Number.isFinite(v) && !Number.isInteger(v);
    });
  }, [numsStr]);

  /* 💡 Tips */
  const tips = useMemo(
    () => [
      "Tip: gcd(a, b) is the last non-zero remainder in the Euclidean algorithm.",
      "Tip: lcm(a, b) = |a·b| / gcd(a, b) (with lcm(a, 0) = 0).",
      "Tip: gcd and lcm for many numbers are computed by reducing pairwise left-to-right.",
      "Tip: gcd(a, 0) = |a|; gcd(0, 0) = 0 by convention in this tool.",
      "Tip: Signs don’t matter: gcd uses absolute values; lcm is always non-negative.",
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
    parts.push("GCD & LCM Calculator");
    parts.push(`Numbers: ${ints.join(", ") || "—"}`);
    parts.push(`GCD: ${fmt(gcdValue)}`);
    parts.push(`LCM: ${fmt(lcmValue)}`);
    if (gcdChain.length) parts.push(`GCD reduction: ${gcdChain.join(" → ")}`);
    if (lcmChain.length) parts.push(`LCM reduction: ${lcmChain.join(" → ")}`);
    await navigator.clipboard.writeText(parts.join("\n"));
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    const encoded = btoa(JSON.stringify({ numsStr, showEuclidPair, pairIndex }));
    url.searchParams.set(URL_KEY, encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  const reset = () => {
    setNumsStr("24, 60, 36");
    setShowEuclidPair(true);
    setPairIndex(0);
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
        title="GCD & LCM Calculator — Euclidean Steps and Multi-Number Reduction (2025–2026)"
        description="Paste integers separated by comma/space/semicolon/line to compute GCD and LCM. See Euclidean algorithm steps for a chosen pair, reduction chains across many numbers, copy/share link, and edge-case handling."
        keywords={[
          "gcd calculator",
          "lcm calculator",
          "greatest common divisor",
          "least common multiple",
          "euclidean algorithm steps",
          "gcd lcm of multiple numbers",
          "math tools",
          "number theory calculator"
        ]}
        canonical="https://calculatorhub.site/gcd-lcm-calculator"
        schemaData={[
          // 1) WebPage + Article
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://calculatorhub.site/gcd-lcm-calculator#webpage",
            "url": "https://calculatorhub.site/gcd-lcm-calculator",
            "name": "GCD & LCM Calculator (2025–2026) — Euclidean Steps & Multi-Number Reduction",
            "inLanguage": "en",
            "isPartOf": { "@id": "https://calculatorhub.site/#website" },
            "primaryImageOfPage": {
              "@type": "ImageObject",
              "@id": "https://calculatorhub.site/images/gcd-lcm-calculator-hero.webp#primaryimg",
              "url": "https://calculatorhub.site/images/gcd-lcm-calculator-hero.webp",
              "width": 1200,
              "height": 675
            },
            "mainEntity": {
              "@type": "Article",
              "@id": "https://calculatorhub.site/gcd-lcm-calculator#article",
              "headline": "GCD & LCM Calculator — Euclidean Steps, Reduction Chains, and Shareable Links",
              "description": "Compute GCD and LCM for lists of integers. View Euclidean algorithm steps for a selected pair, see GCD/LCM reduction chains, and copy or share results. Handles negatives and zeros.",
              "image": ["https://calculatorhub.site/images/gcd-lcm-calculator-hero.webp"],
              "author": { "@type": "Organization", "name": "CalculatorHub", "url": "https://calculatorhub.site" },
              "publisher": { "@id": "https://calculatorhub.site/#organization" },
              "datePublished": "2025-11-09",
              "dateModified": "2025-11-09",
              "mainEntityOfPage": { "@id": "https://calculatorhub.site/gcd-lcm-calculator#webpage" },
              "articleSection": [
                "How to Use",
                "Inputs & Parsing",
                "Euclidean Algorithm Steps",
                "GCD/LCM Reduction Chains",
                "Copy & Share",
                "FAQ"
              ]
            }
          },
      
          // 2) Breadcrumbs
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "@id": "https://calculatorhub.site/gcd-lcm-calculator#breadcrumbs",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://calculatorhub.site/" },
              { "@type": "ListItem", "position": 2, "name": "Math Tools", "item": "https://calculatorhub.site/category/math-tools" },
              { "@type": "ListItem", "position": 3, "name": "GCD & LCM Calculator", "item": "https://calculatorhub.site/gcd-lcm-calculator" }
            ]
          },
      
          // 3) FAQ
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://calculatorhub.site/gcd-lcm-calculator#faq",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How should I enter numbers?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Paste integers separated by comma, space, semicolon, pipe, or new line. Negatives and zeros are allowed; non-integers are truncated."
                }
              },
              {
                "@type": "Question",
                "name": "What conventions does the calculator use?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "gcd uses absolute values; gcd(a,0)=|a| and gcd(0,0)=0 by this tool’s convention. lcm is non-negative and lcm(a,0)=0."
                }
              },
              {
                "@type": "Question",
                "name": "How are GCD and LCM computed for many numbers?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Both are reduced left-to-right: gcd(a,b,c)=gcd(gcd(a,b),c) and lcm(a,b,c)=lcm(lcm(a,b),c)."
                }
              },
              {
                "@type": "Question",
                "name": "Can I see Euclidean algorithm steps?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Enable the pair toggle and choose an index to see a detailed a=b·q+r table for that adjacent pair."
                }
              },
              {
                "@type": "Question",
                "name": "Can I share my current inputs and settings?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. The tool encodes state into the URL so you can copy a shareable link."
                }
              }
            ]
          },
      
          // 4) WebApplication
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://calculatorhub.site/gcd-lcm-calculator#webapp",
            "name": "GCD & LCM Calculator",
            "url": "https://calculatorhub.site/gcd-lcm-calculator",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web",
            "description": "Compute GCD/LCM for multiple integers with Euclidean steps, reduction chains, and shareable URLs.",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "image": ["https://calculatorhub.site/images/gcd-lcm-calculator-hero.webp"]
          },
      
          // 5) SoftwareApplication (optional)
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://calculatorhub.site/gcd-lcm-calculator#software",
            "name": "GCD & LCM Calculator",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "All",
            "url": "https://calculatorhub.site/gcd-lcm-calculator",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "description": "Interactive number-theory tool showing Euclidean steps and multi-number reduction."
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
      <link rel="canonical" href="https://calculatorhub.site/gcd-lcm-calculator" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/gcd-lcm-calculator" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/gcd-lcm-calculator" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/gcd-lcm-calculator" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="GCD & LCM Calculator — Euclidean Steps & Multi-Number Reduction" />
      <meta property="og:description" content="Compute GCD/LCM for any list of integers. See Euclid steps, reduction chains, and copy/share link." />
      <meta property="og:url" content="https://calculatorhub.site/gcd-lcm-calculator" />
      <meta property="og:image" content="https://calculatorhub.site/images/gcd-lcm-calculator-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="GCD & LCM calculator UI showing Euclidean step table and reduction chains" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="GCD & LCM Calculator — Euclidean Steps & Reduction Chains" />
      <meta name="twitter:description" content="Paste integers to get GCD/LCM with Euclid steps and multi-number reduction. Share results via URL." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/gcd-lcm-calculator-hero.webp" />
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
      <link rel="preload" as="image" href="/images/gcd-lcm-calculator-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />


      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Math Tools", url: "/category/math-tools" },
            { name: "GCD & LCM Calculator", url: "/gcd-lcm-calculator" },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            GCD & LCM Calculator
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Paste integers (comma, space, or line separated) to compute{" "}
            <strong>GCD</strong> and <strong>LCM</strong>. See the{" "}
            <strong>Euclidean algorithm steps</strong> and the reduction across many numbers.
          </p>
        </div>

        {/* Promo bar */}
        <div className="hidden sm:flex mt-6 mb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white rounded-lg shadow-lg p-4 items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-lg">Explore more math tools 🧮</p>
            <p className="text-sm text-indigo-100">Try Average, Factorial, or Quadratic Solver next!</p>
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
                <List className="h-5 w-5 text-sky-400" /> Inputs
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
              {/* Numbers */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">
                    Numbers (integers)
                  </label>
                  <Info
                    className="h-4 w-4 text-slate-400"
                    title="Separate by comma, space, semicolon, pipe, or new line. Negatives and zeros allowed."
                  />
                </div>
                <textarea
                  rows={5}
                  value={numsStr}
                  onChange={(e) => setNumsStr(e.target.value)}
                  placeholder="e.g., 24, 60, 36"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {["24, 60, 36", "48 180 300 600", "14; 21; 35; 56", "-18, 0, 54"].map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setNumsStr(s)}
                      className="text-xs bg-[#0f172a] border border-[#334155] rounded px-2 py-1 hover:border-indigo-500"
                    >
                      Sample {i + 1}
                    </button>
                  ))}
                </div>
                {nonIntegersNotice && (
                  <p className="text-xs text-amber-300 mt-2">
                    Note: Non-integers were truncated to integers.
                  </p>
                )}
              </div>

              {/* Euclid details toggle */}
              <div className="flex items-center gap-2">
                <input
                  id="euclidToggle"
                  type="checkbox"
                  checked={showEuclidPair}
                  onChange={(e) => setShowEuclidPair(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="euclidToggle" className="text-sm text-slate-300">
                  Show Euclidean algorithm steps for a pair
                </label>
              </div>

              {/* Pair chooser */}
              {showEuclidPair && ints.length >= 2 && (
                <div className="flex items-center gap-3">
                  <label className="text-sm text-slate-300">Pair index:</label>
                  <input
                    type="number"
                    min={0}
                    max={Math.max(0, ints.length - 2)}
                    value={pairIndex}
                    onChange={(e) =>
                      setPairIndex(
                        Math.min(Math.max(0, parseInt(e.target.value) || 0), Math.max(0, ints.length - 2))
                      )
                    }
                    className="w-24 bg-[#0f172a] text-white px-3 py-1.5 border border-[#334155] rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="text-xs text-slate-400">
                    Pair = (n[{pairIndex}], n[{pairIndex + 1}]) → ({ints[pairIndex]}, {ints[pairIndex + 1]})
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">Results</h2>
            <div className="space-y-6">
              {/* Summary tiles */}
              <div className="grid grid-cols-2 gap-4">
                <Tile label="GCD" value={emptyInput ? "—" : fmt(gcdValue)} />
                <Tile label="LCM" value={emptyInput ? "—" : fmt(lcmValue)} />
              </div>

              {/* Reduction chains */}
              {ints.length > 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                    <div className="text-sm text-slate-400 mb-2">GCD Reduction</div>
                    {gcdChain.length ? (
                      <ul className="list-disc list-inside text-slate-200 text-sm space-y-1">
                        {gcdChain.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-slate-300 text-sm">—</div>
                    )}
                  </div>
                  <div className="p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                    <div className="text-sm text-slate-400 mb-2">LCM Reduction</div>
                    {lcmChain.length ? (
                      <ul className="list-disc list-inside text-slate-200 text-sm space-y-1">
                        {lcmChain.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-slate-300 text-sm">—</div>
                    )}
                  </div>
                </div>
              )}

              

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

        {/* Euclidean steps */}
              {showEuclidPair && ints.length >= 2 && (
                <div className="p-4 mt-3 bg-[#0f172a] rounded-lg border border-[#334155]">
                  <div className="text-sm text-slate-400 mb-2">
                    Euclidean Algorithm (pair: {pairA}, {pairB})
                  </div>
                  {euclidSteps.length ? (
                    <table className="min-w-full text-sm text-slate-100 border border-[#334155] rounded-md overflow-hidden">
                      <thead className="bg-[#0f172a]">
                        <tr>
                          <th className="text-left px-3 py-2">a</th>
                          <th className="text-left px-3 py-2">b</th>
                          <th className="text-left px-3 py-2">q = ⌊a / b⌋</th>
                          <th className="text-left px-3 py-2">r = a − b·q</th>
                        </tr>
                      </thead>
                      <tbody>
                        {euclidSteps.map((s, i) => (
                          <tr key={i} className={i % 2 ? "bg-[#0f172a]/60" : "bg-[#1e293b]/60"}>
                            <td className="px-3 py-2">{s.a}</td>
                            <td className="px-3 py-2">{s.b}</td>
                            <td className="px-3 py-2">{s.q}</td>
                            <td className="px-3 py-2">{s.r}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-slate-300 text-sm">—</div>
                  )}
                </div>
              )}

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

        {/* Steps (collapsible explainer) */}
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
              <h4 className="font-semibold text-cyan-300">GCD (Greatest Common Divisor)</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>For two numbers (a, b), repeatedly divide: a = b·q + r.</li>
                <li>Replace (a, b) ← (b, r) until r = 0.</li>
                <li>The last non-zero b is gcd(a, b).</li>
                <li>For many numbers, reduce left-to-right: gcd(a, b, c) = gcd(gcd(a, b), c).</li>
              </ol>

              <h4 className="font-semibold text-cyan-300">LCM (Least Common Multiple)</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>For two numbers: lcm(a, b) = |a·b| / gcd(a, b). If either is 0, lcm = 0.</li>
                <li>For many numbers: lcm(a, b, c) = lcm(lcm(a, b), c).</li>
              </ol>

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
              <li><a href="#what-are-gcd-lcm" className="text-indigo-300 hover:underline">What Are GCD & LCM?</a></li>
              <li><a href="#features" className="text-indigo-300 hover:underline">Key Features of This Calculator</a></li>
              <li><a href="#how-to-use" className="text-indigo-300 hover:underline">How to Use</a></li>
              <li><a href="#methods" className="text-indigo-300 hover:underline">Methods & Math Under the Hood</a></li>
              <li><a href="#euclid-steps" className="text-indigo-300 hover:underline">Euclidean Steps — Explained</a></li>
              <li><a href="#worked-examples" className="text-indigo-300 hover:underline">Worked Examples</a></li>
              <li><a href="#properties" className="text-indigo-300 hover:underline">Core Properties & Identities</a></li>
              <li><a href="#edge-cases" className="text-indigo-300 hover:underline">Edge Cases & Conventions</a></li>
              <li><a href="#use-cases" className="text-indigo-300 hover:underline">Where GCD/LCM Show Up in Real Life</a></li>
              <li><a href="#quick-ref" className="text-indigo-300 hover:underline">Quick Reference Table</a></li>
              <li><a href="#glossary" className="text-indigo-300 hover:underline">Glossary</a></li>
              <li><a href="#faq" className="text-indigo-300 hover:underline">FAQ</a></li>
            </ol>
          </nav>
        
          {/* ===== Intro ===== */}
          <h1 id="what-are-gcd-lcm" className="text-3xl font-bold text-indigo-300 mb-6">
            GCD & LCM — the building blocks of divisibility and multiples
          </h1>
          <p>
            The <strong>Greatest Common Divisor (GCD)</strong> of a set of integers is the largest integer that divides each of
            them with no remainder. The <strong>Least Common Multiple (LCM)</strong> is the smallest positive integer that is a
            multiple of each number in the set. Together they power many everyday tasks: simplifying fractions, synchronizing
            repeating schedules, sizing batches in manufacturing, detecting shared factors in cryptography, and more.
          </p>
          <p>
            This page provides a fast, precise <strong>GCD & LCM Calculator</strong>. Paste your integers in any common format
            (commas, spaces, semicolons, pipes, or new lines), and you’ll instantly get the combined <strong>GCD</strong> and
            <strong> LCM</strong>. You can also reveal the <strong>Euclidean algorithm steps</strong> for any adjacent pair and
            see the <strong>reduction chains</strong> that derive multi-number GCD and LCM left-to-right. Copy the results or
            share a link that encodes your exact inputs and options.
          </p>
        
          {/* ===== Features ===== */}
          <h2 id="features" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            ✨ Key features of this GCD & LCM Calculator
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Paste-friendly input</strong>: integers separated by space/comma/semicolon/pipe/newline.</li>
            <li><strong>Robust parsing</strong>: invalid tokens are ignored; non-integers are safely <em>truncated</em> to integers.</li>
            <li><strong>Multi-number GCD/LCM</strong>: reduces pairwise left-to-right with clear chain summaries.</li>
            <li><strong>Euclidean steps viewer</strong>: inspect <code>a = b·q + r</code> iterations for any adjacent pair.</li>
            <li><strong>Edge-case handling</strong>: negatives, zeros, and the <em>gcd(0,0)</em> convention used by this tool.</li>
            <li><strong>Copy & share</strong>: export a clean text summary or copy a URL containing your exact state.</li>
          </ul>
        
          {/* ===== How to Use ===== */}
          <h2 id="how-to-use" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">🧭 How to use this calculator</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Paste integers into the box — separators can be spaces, commas, semicolons, pipes, or new lines.</li>
            <li>Optionally enable <strong>Euclidean steps</strong> and select a <em>pair index</em> to inspect the detailed divisions.</li>
            <li>Read the <strong>GCD</strong> and <strong>LCM</strong> tiles, and review the <strong>reduction chains</strong> for context.</li>
            <li>Click <strong>Copy Results</strong> to export text, or <strong>Copy Link</strong> to share your exact inputs/settings.</li>
          </ol>
          <p className="text-sm text-slate-400">
            Tip: Signs don’t affect GCD — we use absolute values internally. LCM is always returned as a non-negative integer.
          </p>
        
          {/* ===== Methods ===== */}
          <h2 id="methods" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🔧 Methods & math under the hood
          </h2>
        
          <h3 className="text-xl font-semibold text-indigo-300">1) Parsing & sanitization</h3>
          <p>
            We split on common delimiters (<code>space</code>, <code>,</code>, <code>;</code>, <code>|</code>, or newline), trim
            whitespace, and keep tokens that parse to finite numbers. Non-integers are <strong>truncated</strong>
            (e.g., 12.9 → 12), ensuring GCD/LCM receive integer inputs as number theory intends.
          </p>
        
          <h3 className="text-xl font-semibold text-indigo-300 mt-6">2) GCD via Euclidean algorithm</h3>
          <p>
            For two integers <em>a</em> and <em>b</em> (not both zero), the Euclidean algorithm repeats:
          </p>
          <pre className="bg-[#0f172a] border border-[#334155] rounded-lg p-3 overflow-x-auto text-sm">
            a = b·q + r,  with  0 ≤ r &lt; |b|.  Then replace (a, b) ← (b, r) until r = 0.  The last non-zero b is gcd(a, b).
          </pre>
          <p>
            This process is fast (logarithmic in the size of inputs) and numerically stable. Our viewer shows each division step,
            letting you follow the algorithm line by line.
          </p>
        
          <h3 className="text-xl font-semibold text-indigo-300 mt-6">3) LCM via GCD</h3>
          <p>
            For two integers (not both zero), we use:
          </p>
          <pre className="bg-[#0f172a] border border-[#334155] rounded-lg p-3 overflow-x-auto text-sm">
            lcm(a, b) = |a·b| / gcd(a, b),  with lcm(a, 0) = 0.
          </pre>
          <p>
            We compute <code>|a/g|·|b|</code> (divide before multiply) to avoid intermediate overflow where possible.
          </p>
        
          <h3 className="text-xl font-semibold text-indigo-300 mt-6">4) Many numbers</h3>
          <p>
            We reduce pairwise left-to-right:
          </p>
          <pre className="bg-[#0f172a] border border-[#334155] rounded-lg p-3 overflow-x-auto text-sm">
            gcd(a, b, c, …) = gcd(gcd(a, b), c, …)   and   lcm(a, b, c, …) = lcm(lcm(a, b), c, …).
          </pre>
          <p>
            The app displays both <strong>GCD</strong> and <strong>LCM reduction chains</strong> as a readable audit trail.
          </p>
        
          {/* ===== Euclid steps ===== */}
          <h2 id="euclid-steps" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            📐 Euclidean steps — what the table means
          </h2>
          <p>
            For an adjacent pair (say n[i], n[i+1]), the steps table shows each iteration of <code>a = b·q + r</code>. The
            <strong>quotient</strong> <code>q = ⌊a/b⌋</code> and <strong>remainder</strong> <code>r</code> shrink the problem to
            a smaller pair <code>(b, r)</code> until <code>r = 0</code>, revealing the GCD. Observing the quotients helps you
            understand how quickly the algorithm converges and why certain pairs are “closer” than others in terms of divisibility.
          </p>
        
          {/* ===== Worked Examples ===== */}
          <h2 id="worked-examples" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🧪 Worked examples (rounded for readability)
          </h2>
          <ul className="space-y-2">
            <li>
              <strong>24, 60, 36</strong> → <em>gcd</em> = 12; <em>lcm</em> = 360. GCD chain: gcd(24, 60) = 12, gcd(12, 36) = 12.
              LCM chain: lcm(24, 60) = 120, lcm(120, 36) = 360.
            </li>
            <li>
              <strong>48, 180, 300, 600</strong> → <em>gcd</em> = 12; <em>lcm</em> = 1,800. Pairwise reduction keeps numbers manageable.
            </li>
            <li>
              <strong>14, 21, 35, 56</strong> → <em>gcd</em> = 7; <em>lcm</em> = 840. The many shared 7s make the GCD large.
            </li>
            <li>
              <strong>−18, 0, 54</strong> → signs don’t matter for GCD, and any zero forces <em>lcm</em> = 0.
              Here <em>gcd</em> = 18; <em>lcm</em> = 0.
            </li>
          </ul>
        
          {/* ===== Properties ===== */}
          <h2 id="properties" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            📏 Core properties & identities you can use
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Commutative</strong>: gcd(a, b) = gcd(b, a); lcm(a, b) = lcm(b, a).</li>
            <li><strong>Associative</strong>: gcd(gcd(a, b), c) = gcd(a, b, c); similarly for lcm.</li>
            <li><strong>Idempotent</strong>: gcd(a, a) = |a|; lcm(a, a) = |a|.</li>
            <li><strong>Absorption</strong>: gcd(a, lcm(a, b)) = |a|; lcm(a, gcd(a, b)) = |a|.</li>
            <li><strong>Product identity (two numbers)</strong>: |a·b| = gcd(a, b) · lcm(a, b) (with a,b ≠ 0).</li>
            <li><strong>Scaling</strong>: gcd(ka, kb) = |k|·gcd(a, b); lcm(ka, kb) = |k|·lcm(a, b).</li>
            <li><strong>Zero</strong>: gcd(a, 0) = |a|; lcm(a, 0) = 0.</li>
          </ul>
          <p className="text-sm text-slate-400">
            Note: The product identity generalizes carefully for more than two numbers; pairwise reduction is the safer route in practice.
          </p>
        
          {/* ===== Edge cases ===== */}
          <h2 id="edge-cases" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🧩 Edge cases & conventions in this tool
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Signs</strong>: we take absolute values for GCD; LCM is returned non-negative.</li>
            <li><strong>Zeros</strong>: gcd(a, 0) = |a|; if any input is zero, lcm(…, 0, …) = 0.</li>
            <li><strong>All zeros</strong>: by this tool’s convention, gcd(0, 0) = 0.</li>
            <li><strong>Non-integers</strong>: tokens like 5.9 are truncated to 5 to keep number-theory definitions intact.</li>
          </ul>
        
          {/* ===== Use cases ===== */}
          <h2 id="use-cases" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🧰 Where GCD/LCM show up in real life
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Fractions & ratios</strong>: reduce fractions via GCD; find common denominators via LCM.</li>
            <li><strong>Scheduling</strong>: events with different cycles repeat together every LCM units.</li>
            <li><strong>Manufacturing</strong>: align batch sizes and packaging using LCM to minimize leftovers.</li>
            <li><strong>Coding & algorithms</strong>: interval merging, clock arithmetic, grid tiling.</li>
            <li><strong>Security</strong>: prime factors and GCD checks appear in cryptographic routines (e.g., key validation).</li>
          </ul>
        
          {/* ===== Quick Reference Table ===== */}
          <h2 id="quick-ref" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🗂️ Quick reference
          </h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-300">
                  <th className="py-2 pr-4">Concept</th>
                  <th className="py-2 pr-4">Formula</th>
                  <th className="py-2">Notes</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                <tr>
                  <td className="py-2 pr-4">GCD (a, b)</td>
                  <td className="py-2 pr-4">Last non-zero remainder via Euclid</td>
                  <td className="py-2">Fast; ignores signs</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">LCM (a, b)</td>
                  <td className="py-2 pr-4">|a·b| / gcd(a, b)</td>
                  <td className="py-2">Return 0 if any input is 0</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Many numbers</td>
                  <td className="py-2 pr-4">Reduce left-to-right</td>
                  <td className="py-2">Associativity helps</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Product identity</td>
                  <td className="py-2 pr-4">|a·b| = gcd(a, b)·lcm(a, b)</td>
                  <td className="py-2">For two numbers (non-zero)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Zero rules</td>
                  <td className="py-2 pr-4">gcd(a,0)=|a|; lcm(a,0)=0</td>
                  <td className="py-2">Tool uses gcd(0,0)=0</td>
                </tr>
              </tbody>
            </table>
          </div>
        
          {/* ===== Glossary ===== */}
          <h2 id="glossary" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">📚 Glossary</h2>
          <p className="space-y-2">
            <strong>GCD</strong>: the largest integer dividing all numbers in a set without remainder. <br/>
            <strong>LCM</strong>: the smallest positive integer that all numbers in a set divide into. <br/>
            <strong>Euclidean algorithm</strong>: iterative division producing the GCD as the last non-zero remainder. <br/>
            <strong>Quotient (q)</strong>: ⌊a/b⌋, the integer part of a division. <br/>
            <strong>Remainder (r)</strong>: the leftover after division: a = b·q + r, 0 ≤ r &lt; |b|.
          </p>
        
          {/* ===== FAQ ===== */}
          <section className="space-y-6 mt-16">
            <h2 id="faq" className="text-3xl md:text-4xl font-bold mb-4 text-center text-indigo-200">
              ❓ Frequently Asked Questions (FAQ)
            </h2>
        
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q1: How should I enter numbers?</h3>
                <p>
                  Use spaces, commas, semicolons, pipes, or new lines. The tool ignores invalid tokens and truncates non-integers
                  to the nearest integer toward zero.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q2: Do signs matter?</h3>
                <p>
                  Not for GCD. We use absolute values internally. LCM is returned as a non-negative integer by convention.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q3: What about zeros?</h3>
                <p>
                  gcd(a, 0) = |a|. If any input is zero, lcm becomes 0. When all inputs are zero, this tool defines gcd(0, 0) = 0.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q4: Why left-to-right reduction for many numbers?</h3>
                <p>
                  Associativity allows pairwise reduction. It’s efficient, memory-light, and yields readable “chain” explanations
                  for both GCD and LCM.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q5: Can I recover prime factors from the steps?</h3>
                <p>
                  Not directly. The Euclidean steps show divisions, not prime factorizations. For factorization, use a dedicated tool.
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
                href="/average-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-200 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
              >
                📊 Average Calculator
              </Link>
              <Link
                href="/quadratic-equation-solver"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-200 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
              >
                𝑎x²+𝑏x+𝑐 Quadratic Solver
              </Link>
              <Link
                href="/factorial-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-pink-600/20 text-pink-300 hover:text-pink-200 px-3 py-2 rounded-md border border-slate-700 hover:border-pink-500 transition-all duration-200"
              >
                n! Factorial
              </Link>
            </div>
          </div>
        </section>

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/gcd-lcm-calculator" category="math-tools" />
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

export default GcdLcmCalculator;
