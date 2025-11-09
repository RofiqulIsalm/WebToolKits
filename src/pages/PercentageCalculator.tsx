// src/pages/PercentageCalculator.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Percent,
  RotateCcw,
  Share2,
  Copy,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import { generateCalculatorSchema } from "../utils/seoData";
import RelatedCalculators from "../components/RelatedCalculators";

/* ============================================================
   📦 Constants & Utilities
   ============================================================ */
const LS_KEY = "percentage_calculator_state_v1";
const URL_KEY = "pc";

type Mode =
  | "percentOf"      // What is X% of Y?
  | "whatPercent"    // X is what percent of Y?
  | "increaseBy"     // Increase Y by X%
  | "decreaseBy"     // Decrease Y by X%
  | "percentChange"; // Percent change from A to B

const clampNumber = (v: number) => (Number.isFinite(v) ? v : 0);
const nf = (n: number, max = 4) =>
  Number.isFinite(n) ? Number(n.toFixed(max)).toLocaleString() : "—";

const formatPct = (v: number, max = 2) =>
  Number.isFinite(v) ? `${v.toFixed(max)}%` : "—";

/* ============================================================
   🧮 Component
   ============================================================ */
const PercentageCalculator: React.FC = () => {
  /* ---------- Core state ---------- */
  const [mode, setMode] = useState<Mode>("percentOf");

  // Shared fields reused across modes
  const [x, setX] = useState<number>(0); // "X%" or "X value" depending on mode
  const [y, setY] = useState<number>(0); // "of Y" or base value depending on mode
  const [a, setA] = useState<number>(0); // start value (for percentChange)
  const [b, setB] = useState<number>(0); // end/target value (for percentChange)

  // UI state
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [showSteps, setShowSteps] = useState<boolean>(false);
  const [activeTip, setActiveTip] = useState<number>(0);
  const [hydrated, setHydrated] = useState<boolean>(false);

  const isDefault =
    mode === "percentOf" && x === 0 && y === 0 && a === 0 && b === 0;

  /* ============================================================
     🔁 Hydrate from URL/localStorage & persist
     ============================================================ */
  const applyState = (s: any) => {
    setMode((s.mode as Mode) || "percentOf");
    setX(Number(s.x) || 0);
    setY(Number(s.y) || 0);
    setA(Number(s.a) || 0);
    setB(Number(s.b) || 0);
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromURL = params.get(URL_KEY);
      if (fromURL) {
        const decoded = JSON.parse(atob(fromURL));
        applyState(decoded);
        setHydrated(true);
        return;
      }
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        applyState(JSON.parse(raw));
      }
    } catch (e) {
      console.warn("Failed to load percentage calc state:", e);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const state = { mode, x, y, a, b };
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Failed to persist percentage calc:", e);
    }
  }, [hydrated, mode, x, y, a, b]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const url = new URL(window.location.href);
      const allZero = mode === "percentOf" && x === 0 && y === 0 && a === 0 && b === 0;
      if (allZero) {
        url.searchParams.delete(URL_KEY);
        window.history.replaceState({}, "", url);
        return;
      }
      const encoded = btoa(JSON.stringify({ mode, x, y, a, b }));
      url.searchParams.set(URL_KEY, encoded);
      window.history.replaceState({}, "", url);
    } catch (e) {
      console.warn("Failed to update URL:", e);
    }
  }, [hydrated, mode, x, y, a, b]);

  /* ============================================================
     🧠 Calculations (by mode)
     ============================================================ */
  const calc = useMemo(() => {
    let title = "";
    let resultValue = 0;
    let resultText = "";
    let steps: string[] = [];
    let pie: { name: string; value: number }[] = [];

    switch (mode) {
      case "percentOf": {
        // What is X% of Y?
        const part = (clampNumber(x) / 100) * clampNumber(y);
        resultValue = part;
        title = `What is ${formatPct(x)} of ${nf(y, 4)}?`;
        resultText = `${formatPct(x)} of ${nf(y)} = ${nf(part)}`;
        steps = [
          `Convert ${x}% to decimal: ${x} ÷ 100 = ${x / 100}`,
          `Multiply by the base: (${x / 100}) × ${y} = ${part}`,
        ];
        pie = [
          { name: "Part", value: Math.max(part, 0) },
          { name: "Remainder", value: Math.max(y - part, 0) },
        ];
        break;
      }
      case "whatPercent": {
        // X is what percent of Y?
        const pct = clampNumber(y) !== 0 ? (clampNumber(x) / clampNumber(y)) * 100 : NaN;
        resultValue = pct;
        title = `${nf(x)} is what percent of ${nf(y)}?`;
        resultText = `${nf(x)} is ${formatPct(pct)} of ${nf(y)}`;
        steps = [
          `Use formula: (part ÷ whole) × 100`,
          `= (${x} ÷ ${y}) × 100 = ${pct}%`,
        ];
        pie = [
          { name: "Part (X)", value: Math.max(x, 0) },
          { name: "Remaining", value: Math.max(y - x, 0) },
        ];
        break;
      }
      case "increaseBy": {
        // Increase Y by X%
        const inc = clampNumber(y) * (clampNumber(x) / 100);
        const total = clampNumber(y) + inc;
        resultValue = total;
        title = `Increase ${nf(y)} by ${formatPct(x)}`;
        resultText = `New value = ${nf(total)} (increase = ${nf(inc)})`;
        steps = [
          `Increase amount = ${y} × (${x} ÷ 100) = ${inc}`,
          `New value = ${y} + ${inc} = ${total}`,
        ];
        pie = [
          { name: "Original", value: Math.max(y, 0) },
          { name: "Increase", value: Math.max(inc, 0) },
        ];
        break;
      }
      case "decreaseBy": {
        // Decrease Y by X%
        const dec = clampNumber(y) * (clampNumber(x) / 100);
        const total = clampNumber(y) - dec;
        resultValue = total;
        title = `Decrease ${nf(y)} by ${formatPct(x)}`;
        resultText = `New value = ${nf(total)} (decrease = ${nf(dec)})`;
        steps = [
          `Decrease amount = ${y} × (${x} ÷ 100) = ${dec}`,
          `New value = ${y} − ${dec} = ${total}`,
        ];
        pie = [
          { name: "Remaining", value: Math.max(total, 0) },
          { name: "Decrease", value: Math.max(dec, 0) },
        ];
        break;
      }
      case "percentChange": {
        // Percent change from A to B
        const change = clampNumber(b) - clampNumber(a);
        const pct = clampNumber(a) !== 0 ? (change / clampNumber(a)) * 100 : NaN;
        resultValue = pct;
        const dir = Number.isFinite(pct) ? (pct >= 0 ? "increase" : "decrease") : "change";
        title = `Percent ${dir} from ${nf(a)} to ${nf(b)}`;
        resultText = `${dir[0].toUpperCase() + dir.slice(1)} of ${formatPct(Math.abs(pct))}`;
        steps = [
          `Change = ${b} − ${a} = ${change}`,
          `Percent change = (${change} ÷ ${a}) × 100 = ${pct}%`,
        ];
        pie = [
          { name: "Start (A)", value: Math.max(a, 0) },
          { name: "End (B)", value: Math.max(b, 0) },
        ];
        break;
      }
    }

    return { title, resultValue, resultText, steps, pie };
  }, [mode, x, y, a, b]);

  /* ============================================================
     💡 Tips Rotator
     ============================================================ */
  const tips = useMemo(() => {
    const t: string[] = [
      "Tip: 10% of a number is just moving the decimal one place left.",
      "Tip: A 20% decrease followed by a 20% increase does NOT get you back to the original.",
      "Tip: To find X% of Y quickly: (X × Y) ÷ 100.",
      "Tip: Percent change uses the START value as the reference.",
      "Tip: Doubling is a 100% increase; halving is a 50% decrease.",
    ];
    return t;
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveTip((p) => (p + 1) % tips.length);
    }, 5000);
    return () => clearInterval(id);
  }, [tips.length]);

  /* ============================================================
     🔗 Copy / Share / Reset
     ============================================================ */
  const copyResults = async () => {
    const text = [
      "Percentage Calculator",
      `Mode: ${mode}`,
      mode === "percentOf" && `What is ${x}% of ${y}? → ${nf(calc.resultValue)}`,
      mode === "whatPercent" && `${x} is what percent of ${y}? → ${formatPct(calc.resultValue)}`,
      mode === "increaseBy" && `Increase ${y} by ${x}% → ${nf(calc.resultValue)}`,
      mode === "decreaseBy" && `Decrease ${y} by ${x}% → ${nf(calc.resultValue)}`,
      mode === "percentChange" &&
        `Percent change from ${a} to ${b} → ${formatPct(calc.resultValue)}`,
    ]
      .filter(Boolean)
      .join("\n");
    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    const encoded = btoa(JSON.stringify({ mode, x, y, a, b }));
    url.searchParams.set(URL_KEY, encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  const reset = () => {
    setMode("percentOf");
    setX(0);
    setY(0);
    setA(0);
    setB(0);
    setShowSteps(false);
    localStorage.removeItem(LS_KEY);
  };

  /* ============================================================
     🎨 Render
     ============================================================ */
  return (
    <>
      {/* ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Percentage Calculator — X% of Y, Increase/Decrease & Percent Change"
        description="Free Percentage Calculator: instantly find X% of Y, what percent X is of Y, percentage increase/decrease, and percent change from A to B — with steps, visual pie chart, copy & share link."
        keywords={[
          "percentage calculator",
          "what is x percent of y",
          "x is what percent of y",
          "percent increase",
          "percent decrease",
          "percent change calculator",
          "percent math with steps",
          "quick percent tool"
        ]}
        canonical="https://calculatorhub.site/percentage-calculator"
        schemaData={[
          /* 1) WebPage + nested Article */
          {
            "@context":"https://schema.org",
            "@type":"WebPage",
            "@id":"https://calculatorhub.site/percentage-calculator#webpage",
            "url":"https://calculatorhub.site/percentage-calculator",
            "name":"Percentage Calculator — X% of Y, Increase/Decrease & Change",
            "inLanguage":"en",
            "isPartOf":{"@id":"https://calculatorhub.site/#website"},
            "primaryImageOfPage":{
              "@type":"ImageObject",
              "@id":"https://calculatorhub.site/images/percentage-calculator-hero.webp#primaryimg",
              "url":"https://calculatorhub.site/images/percentage-calculator-hero.webp",
              "width":1200,
              "height":675
            },
            "mainEntity":{
              "@type":"Article",
              "@id":"https://calculatorhub.site/percentage-calculator#article",
              "headline":"Percentage Calculator — Fast % Of, Increase/Decrease & Change",
              "description":"Compute X% of Y, what percent X is of Y, percentage increase/decrease, and percent change with steps and visuals.",
              "image":["https://calculatorhub.site/images/percentage-calculator-hero.webp"],
              "author":{"@type":"Organization","name":"CalculatorHub","url":"https://calculatorhub.site"},
              "publisher":{"@id":"https://calculatorhub.site/#organization"},
              "datePublished":"2025-11-09",
              "dateModified":"2025-11-09",
              "mainEntityOfPage":{"@id":"https://calculatorhub.site/percentage-calculator#webpage"},
              "articleSection":[
                "How to Use",
                "Percent of",
                "What Percent",
                "Increase/Decrease",
                "Percent Change",
                "FAQ"
              ]
            }
          },
      
          /* 2) Breadcrumbs */
          {
            "@context":"https://schema.org",
            "@type":"BreadcrumbList",
            "@id":"https://calculatorhub.site/percentage-calculator#breadcrumbs",
            "itemListElement":[
              {"@type":"ListItem","position":1,"name":"Home","item":"https://calculatorhub.site/"},
              {"@type":"ListItem","position":2,"name":"Math Tools","item":"https://calculatorhub.site/category/math-tools"},
              {"@type":"ListItem","position":3,"name":"Percentage Calculator","item":"https://calculatorhub.site/percentage-calculator"}
            ]
          },
      
          /* 3) FAQ */
          {
            "@context":"https://schema.org",
            "@type":"FAQPage",
            "@id":"https://calculatorhub.site/percentage-calculator#faq",
            "mainEntity":[
              {
                "@type":"Question",
                "name":"How do I calculate X% of Y?",
                "acceptedAnswer":{"@type":"Answer","text":"Multiply Y by (X ÷ 100). Example: 15% of 200 = 200 × 0.15 = 30."}
              },
              {
                "@type":"Question",
                "name":"How do I find what percent X is of Y?",
                "acceptedAnswer":{"@type":"Answer","text":"Use (X ÷ Y) × 100. The calculator shows steps automatically."}
              },
              {
                "@type":"Question",
                "name":"What is percent change?",
                "acceptedAnswer":{"@type":"Answer","text":"Percent change = ((B − A) ÷ A) × 100, where A is the start value."}
              }
            ]
          },
      
          /* 4) WebApplication */
          {
            "@context":"https://schema.org",
            "@type":"WebApplication",
            "@id":"https://calculatorhub.site/percentage-calculator#webapp",
            "name":"Percentage Calculator",
            "url":"https://calculatorhub.site/percentage-calculator",
            "applicationCategory":"EducationalApplication",
            "operatingSystem":"Web",
            "description":"Interactive percentage calculator with modes for percent of, what percent, increase/decrease, and percent change; includes steps and charts.",
            "image":["https://calculatorhub.site/images/percentage-calculator-hero.webp"],
            "publisher":{"@id":"https://calculatorhub.site/#organization"}
          },
      
          /* 5) SoftwareApplication */
          {
            "@context":"https://schema.org",
            "@type":"SoftwareApplication",
            "@id":"https://calculatorhub.site/percentage-calculator#software",
            "name":"Advanced Percentage Calculator",
            "applicationCategory":"EducationalApplication",
            "operatingSystem":"All",
            "url":"https://calculatorhub.site/percentage-calculator",
            "publisher":{"@id":"https://calculatorhub.site/#organization"},
            "description":"Fast % math tool with shareable state in URL and visual breakdown."
          },
      
          /* 6) WebSite + Organization (global) */
          {
            "@context":"https://schema.org",
            "@type":"WebSite",
            "@id":"https://calculatorhub.site/#website",
            "url":"https://calculatorhub.site",
            "name":"CalculatorHub",
            "publisher":{"@id":"https://calculatorhub.site/#organization"},
            "potentialAction":{
              "@type":"SearchAction",
              "target":"https://calculatorhub.site/search?q={query}",
              "query-input":"required name=query"
            }
          },
          {
            "@context":"https://schema.org",
            "@type":"Organization",
            "@id":"https://calculatorhub.site/#organization",
            "name":"CalculatorHub",
            "url":"https://calculatorhub.site",
            "logo":{"@type":"ImageObject","url":"https://calculatorhub.site/images/logo.png"}
          }
        ]}
      />
      
      {/* ===== Outside meta/link tags ===== */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <link rel="canonical" href="https://calculatorhub.site/percentage-calculator" />
      
      {/* Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/percentage-calculator" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/percentage-calculator" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/percentage-calculator" hreflang="x-default" />
      
      {/* Open Graph / Twitter */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Percentage Calculator — X% of Y, Increase/Decrease & Change" />
      <meta property="og:description" content="Compute X% of Y, what percent X is of Y, percentage increase/decrease, and percent change. With steps, chart, copy & share." />
      <meta property="og:url" content="https://calculatorhub.site/percentage-calculator" />
      <meta property="og:image" content="https://calculatorhub.site/images/percentage-calculator-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Percentage Calculator with live steps and pie chart" />
      <meta property="og:locale" content="en_US" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Percentage Calculator — Fast % Of, Increase/Decrease & Change" />
      <meta name="twitter:description" content="Instant % math with steps, visuals, and shareable link." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/percentage-calculator-hero.webp" />
      
      {/* PWA & theme */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#0f172a" />
      
      {/* Performance */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="preload" as="image" href="/images/percentage-calculator-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/* Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />


      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Math Tools", url: "/category/math-tools" },
            { name: "Percentage Calculator", url: "/percentage-calculator" },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            % Percentage Calculator
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Instantly solve common percentage problems: <strong>X% of Y</strong>,{" "}
            <strong>X is what percent of Y</strong>, <strong>increase/decrease by X%</strong>, and{" "}
            <strong>percent change</strong> from A to B. Copy results or share a link to your inputs.
          </p>
        </div>

        {/* Promo bar */}
        <div className="hidden sm:flex mt-6 mb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white rounded-lg shadow-lg p-4 items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-lg">Explore more math tools 🧮</p>
            <p className="text-sm text-indigo-100">Try our Fraction, Ratio, or Average calculators next!</p>
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
                <Percent className="h-5 w-5 text-sky-400" /> Inputs
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
              {/* Mode */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Choose Problem Type</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as Mode)}
                  className="w-full bg-[#0f172a] text-white text-sm px-3 py-2 border border-[#334155] rounded-md focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="percentOf">What is X% of Y?</option>
                  <option value="whatPercent">X is what percent of Y?</option>
                  <option value="increaseBy">Increase Y by X%</option>
                  <option value="decreaseBy">Decrease Y by X%</option>
                  <option value="percentChange">Percent change from A to B</option>
                </select>
              </div>

              {/* Dynamic fields */}
              {mode === "percentOf" && (
                <>
                  <Field
                    label="X (percent)"
                    value={x}
                    onChange={setX}
                    placeholder="Enter percent (e.g., 15)"
                    info="Enter the percentage you want to take of Y."
                  />
                  <Field
                    label="Y (base value)"
                    value={y}
                    onChange={setY}
                    placeholder="Enter the base (e.g., 2500)"
                    info="Enter the value you want a percentage of."
                  />
                </>
              )}

              {mode === "whatPercent" && (
                <>
                  <Field
                    label="X (part)"
                    value={x}
                    onChange={setX}
                    placeholder="Enter part value (e.g., 45)"
                    info="Enter the part/portion."
                  />
                  <Field
                    label="Y (whole)"
                    value={y}
                    onChange={setY}
                    placeholder="Enter whole/base value (e.g., 120)"
                    info="Enter the whole/base."
                  />
                </>
              )}

              {mode === "increaseBy" && (
                <>
                  <Field
                    label="X (percent increase)"
                    value={x}
                    onChange={setX}
                    placeholder="Enter percent (e.g., 12.5)"
                    info="How much percent to increase by."
                  />
                  <Field
                    label="Y (original value)"
                    value={y}
                    onChange={setY}
                    placeholder="Enter original value (e.g., 900)"
                    info="The starting value."
                  />
                </>
              )}

              {mode === "decreaseBy" && (
                <>
                  <Field
                    label="X (percent decrease)"
                    value={x}
                    onChange={setX}
                    placeholder="Enter percent (e.g., 30)"
                    info="How much percent to decrease by."
                  />
                  <Field
                    label="Y (original value)"
                    value={y}
                    onChange={setY}
                    placeholder="Enter original value (e.g., 1200)"
                    info="The starting value."
                  />
                </>
              )}

              {mode === "percentChange" && (
                <>
                  <Field
                    label="A (start value)"
                    value={a}
                    onChange={setA}
                    placeholder="Enter start value (e.g., 80)"
                    info="The initial value."
                  />
                  <Field
                    label="B (end value)"
                    value={b}
                    onChange={setB}
                    placeholder="Enter end value (e.g., 100)"
                    info="The final value."
                  />
                </>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">Result</h2>
            <div className="space-y-6">
              <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                <Percent className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                <div className="text-sm text-slate-400 mb-1">{calc.title}</div>
                <div className="text-2xl font-bold text-white">
                  {mode === "whatPercent" || mode === "percentChange"
                    ? formatPct(calc.resultValue)
                    : nf(calc.resultValue)}
                </div>
              </div>

              {/* Quick facts */}
              <div className="space-y-3 text-sm text-slate-300">
                {mode === "percentOf" && (
                  <>
                    <KV k="Percent (X)" v={formatPct(x)} />
                    <KV k="Base (Y)" v={nf(y)} />
                  </>
                )}
                {mode === "whatPercent" && (
                  <>
                    <KV k="Part (X)" v={nf(x)} />
                    <KV k="Whole (Y)" v={nf(y)} />
                  </>
                )}
                {mode === "increaseBy" && (
                  <>
                    <KV k="Increase %" v={formatPct(x)} />
                    <KV k="Original (Y)" v={nf(y)} />
                  </>
                )}
                {mode === "decreaseBy" && (
                  <>
                    <KV k="Decrease %" v={formatPct(x)} />
                    <KV k="Original (Y)" v={nf(y)} />
                  </>
                )}
                {mode === "percentChange" && (
                  <>
                    <KV k="Start (A)" v={nf(a)} />
                    <KV k="End (B)" v={nf(b)} />
                  </>
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

        {/* Chart + Summary */}
        <div className="mt-5 bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
          <h3 className="text-lg font-semibold text-white mb-6 text-center">
            Visual Breakdown
          </h3>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
            {/* Pie */}
            <div className="w-[90%] sm:w-[80%] md:w-[70%] max-w-[360px] h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={calc.pie}
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {calc.pie.map((_, i) => (
                      <Cell key={i} fill={["#3b82f6", "#a855f7", "#22c55e"][i % 3]} />
                    ))}
                  </Pie>
                  <ReTooltip formatter={(v: any) => nf(Number(v), 4)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Summary boxes */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {calc.pie.map((p, i) => (
                <div
                  key={i}
                  className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-indigo-500 transition"
                >
                  <p className="text-sm text-slate-400">{p.name}</p>
                  <p className="font-semibold text-white text-lg">{nf(p.value, 4)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Steps (collapsible) */}
        <div className="mt-10 bg-gradient-to-br from-[#1e293b] via-[#111827] to-[#0f172a] rounded-2xl border border-indigo-600/40 shadow-xl overflow-hidden">
          <button
            onClick={() => setShowSteps((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold text-lg tracking-wide hover:opacity-90 transition-all"
          >
            <span>🧮 Step-by-step Solution</span>
            {showSteps ? <ChevronUp /> : <ChevronDown />}
          </button>

          {showSteps && (
            <div className="px-6 pb-8 pt-4">
              <ol className="list-decimal list-inside space-y-2 text-slate-200">
                {calc.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              <div className="h-2 w-full mt-6 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 blur-[2px]" />
            </div>
          )}
        </div>

        {/* ======== SEO CONTENT (short) ======== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          <h1 className="text-3xl font-bold text-cyan-400 mb-6">
            Percentage Calculator – Quick % Math with Steps
          </h1>
          <p>
            This free <strong>Percentage Calculator</strong> helps you find{" "}
            <em>X% of Y</em>, determine <em>what percent X is of Y</em>, calculate{" "}
            <em>percentage increase/decrease</em>, and measure <em>percent change</em> between two values.
            Results update instantly, with a clear, shareable link and visual breakdowns.
          </p>

          {/* FAQ snippet */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            Frequently Asked Questions
          </h2>
          <h3 className="text-lg font-semibold text-yellow-300">How do I calculate X% of Y?</h3>
          <p>Multiply Y by (X ÷ 100). Example: 15% of 200 = 200 × 0.15 = 30.</p>

          <h3 className="text-lg font-semibold text-yellow-300">What is percent change?</h3>
          <p>It’s the difference divided by the start value, times 100: ((B − A) ÷ A) × 100.</p>
        </section>

        {/* Author/backlinks & related tools */}
        <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              🚀 Explore more tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/ratio-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
              >
                ➗ Ratio Calculator
              </Link>
              <Link
                to="/average-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-400 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
              >
                📊 Average Calculator
              </Link>
              <Link
                to="/discount-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-pink-600/20 text-pink-300 hover:text-pink-400 px-3 py-2 rounded-md border border-slate-700 hover:border-pink-500 transition-all duration-200"
              >
                🏷️ Discount Calculator
              </Link>
            </div>
          </div>
        </section>

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/percentage-calculator" category="math-tools" />
      </div>
    </>
  );
};

/* ============================================================
   🧩 Small UI helpers
   ============================================================ */
const Field: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  info?: string;
}> = ({ label, value, onChange, placeholder, info }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <Info
          onClick={() => setShow((s) => !s)}
          className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
        />
      </div>
      {show && info && (
        <div className="mb-2 bg-[#0f172a] text-slate-300 text-xs p-2 rounded-md border border-[#334155]">
          {info}
        </div>
      )}
      <input
        type="number"
        value={Number.isFinite(value) && value !== 0 ? value : value === 0 ? 0 : undefined}
        placeholder={placeholder}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
};

const KV: React.FC<{ k: string; v: string | number }> = ({ k, v }) => (
  <div className="flex justify-between">
    <span>{k}:</span>
    <span className="font-medium text-indigo-300">{v}</span>
  </div>
);

export default PercentageCalculator;
