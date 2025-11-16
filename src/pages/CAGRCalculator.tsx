import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, RotateCcw, Copy, Share2, Info } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  Legend,
} from "recharts";

import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import AdBanner from "../components/AdBanner";
import RelatedCalculators from "../components/RelatedCalculators";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

/* ============================================================
   📦 CONSTANTS
   ============================================================ */
const LS_KEY = "cagr_calculator_v1";

const currencyOptions = [
  { code: "USD", symbol: "$", locale: "en-US", label: "US Dollar ($)" },
  { code: "INR", symbol: "₹", locale: "en-IN", label: "Indian Rupee (₹)" },
  { code: "EUR", symbol: "€", locale: "de-DE", label: "Euro (€)" },
  { code: "GBP", symbol: "£", locale: "en-GB", label: "British Pound (£)" },
];

const findLocale = (code: string) =>
  currencyOptions.find((c) => c.code === code)?.locale || "en-US";
const findSymbol = (code: string) =>
  currencyOptions.find((c) => c.code === code)?.symbol || "";

const formatCurrency = (num: number, locale: string, currency: string) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(isFinite(num) ? num : 0);

/* ============================================================
   📈 COMPONENT
   ============================================================ */
const CAGRCalculator: React.FC = () => {
  // Inputs
  const [initialValue, setInitialValue] = useState<number>(0);
  const [finalValue, setFinalValue] = useState<number>(0);
  const [years, setYears] = useState<number>(0);
  const [months, setMonths] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("USD");

  // Outputs
  const [cagr, setCagr] = useState<number>(0);
  const [totalGain, setTotalGain] = useState<number>(0);
  const [annualReturn, setAnnualReturn] = useState<number>(0);

  // UI
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [hydrated, setHydrated] = useState(false);
  const [showInfoValue, setShowInfoValue] = useState(false);
  const [showInfoYears, setShowInfoYears] = useState(false);

  const currentLocale = findLocale(currency);
  const isDefault = !initialValue && !finalValue && !years && !months;

  /* ============================================================
     🔁 PERSISTENCE
     ============================================================ */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setInitialValue(Number(s.initialValue) || 0);
        setFinalValue(Number(s.finalValue) || 0);
        setYears(Number(s.years) || 0);
        setMonths(Number(s.months) || 0);
        setCurrency(typeof s.currency === "string" ? s.currency : "USD");
      }
    } catch {
      console.warn("⚠️ Could not load state");
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ initialValue, finalValue, years, months, currency })
      );
    } catch {
      console.warn("⚠️ Could not save state");
    }
  }, [hydrated, initialValue, finalValue, years, months, currency]);

  /* ============================================================
     🧮 CALCULATION
     ============================================================ */
  useEffect(() => {
    const yrs = Math.max(0, Number.isFinite(years) ? years : 0);
    const mos = Math.max(0, Number.isFinite(months) ? months : 0);
    const totalYears = yrs + mos / 12;

    if (
      !(initialValue > 0) ||
      !(finalValue > 0) ||
      !(totalYears > 0) ||
      !isFinite(totalYears)
    ) {
      setCagr(0);
      setTotalGain(0);
      setAnnualReturn(0);
      return;
    }

    const growthFactor = finalValue / initialValue;
    // Guard weird cases
    if (!isFinite(growthFactor) || growthFactor <= 0) {
      setCagr(0);
      setTotalGain(0);
      setAnnualReturn(0);
      return;
    }

    const cagrValue = Math.pow(growthFactor, 1 / totalYears) - 1;
    const gain = finalValue - initialValue;

    setCagr(isFinite(cagrValue) ? cagrValue * 100 : 0);
    setTotalGain(isFinite(gain) ? gain : 0);
    const simpleAnnual = (gain / totalYears) / initialValue * 100;
    setAnnualReturn(isFinite(simpleAnnual) ? simpleAnnual : 0);
  }, [initialValue, finalValue, years, months]);

  /* ============================================================
     🔗 COPY / SHARE / RESET
     ============================================================ */
  const reset = () => {
    setInitialValue(0);
    setFinalValue(0);
    setYears(0);
    setMonths(0);
    setCurrency("USD");
    localStorage.removeItem(LS_KEY);
  };

  const copyResults = async () => {
    const text = [
      "CAGR Summary",
      `Initial Value: ${formatCurrency(initialValue, currentLocale, currency)}`,
      `Final Value: ${formatCurrency(finalValue, currentLocale, currency)}`,
      `Duration: ${years} years ${months} months`,
      `CAGR: ${cagr.toFixed(2)}%`,
      `Total Gain: ${formatCurrency(totalGain, currentLocale, currency)}`,
      `Avg Annual Return: ${annualReturn.toFixed(2)}%`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied("results");
      setTimeout(() => setCopied("none"), 1500);
    } catch {
      setCopied("none");
    }
  };

  const copyShareLink = async () => {
    try {
      const encoded = btoa(
        JSON.stringify({ initialValue, finalValue, years, months, currency })
      );
      const url = new URL(window.location.href);
      url.searchParams.set("cagr", encoded);
      await navigator.clipboard.writeText(url.toString());
      setCopied("link");
      setTimeout(() => setCopied("none"), 1500);
    } catch {
      setCopied("none");
    }
  };

  /* ============================================================
     🎛️ INPUT SANITIZERS
     ============================================================ */
  const onYearsChange = (v: string) => {
    const n = Number(v);
    setYears(Number.isFinite(n) && n >= 0 ? n : 0);
  };
  const onMonthsChange = (v: string) => {
    // clamp to 0–11 to avoid odd durations
    const n = Math.max(0, Math.min(11, Math.floor(Number(v))));
    setMonths(Number.isFinite(n) ? n : 0);
  };

  /* ============================================================
     🎨 RENDER START
     ============================================================ */
  return (
    <>
      <SEOHead
        title="CAGR Calculator — Compound Annual Growth Rate (2025–2026)"
        description="Free online CAGR Calculator. Compute compound annual growth rate from initial & final value over years/months. Share results, see gain/loss, and compare investments."
        keywords={[
          "CAGR calculator",
          "compound annual growth rate",
          "investment return",
          "annualized growth",
          "finance calculator",
        ]}
        canonical="https://calculatorhub.site/cagr-calculator"
        schemaData={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://calculatorhub.site/cagr-calculator#webpage",
            "url": "https://calculatorhub.site/cagr-calculator",
            "name": "CAGR Calculator — Compound Annual Growth Rate",
            "inLanguage": "en",
            "isPartOf": { "@id": "https://calculatorhub.site/#website" },
            "primaryImageOfPage": {
              "@type": "ImageObject",
              "@id":
                "https://calculatorhub.site/images/cagr-calculator-hero.webp#primaryimg",
              "url":
                "https://calculatorhub.site/images/cagr-calculator-hero.webp",
              "width": 1200,
              "height": 675,
            },
            "mainEntity": {
              "@type": "Article",
              "@id": "https://calculatorhub.site/cagr-calculator#article",
              "headline":
                "CAGR Calculator — Understand and Measure Investment Growth",
              "description":
                "Compute CAGR from initial/final value and duration. See gain/loss and average annual return.",
              "image": [
                "https://calculatorhub.site/images/cagr-calculator-hero.webp",
              ],
              "author": {
                "@type": "Organization",
                "name": "CalculatorHub",
                "url": "https://calculatorhub.site",
              },
              "publisher": { "@id": "https://calculatorhub.site/#organization" },
              "datePublished": "2025-10-17",
              "dateModified": "2025-11-06",
              "mainEntityOfPage": {
                "@id": "https://calculatorhub.site/cagr-calculator#webpage",
              },
              "articleSection": [
                "What is CAGR",
                "Formula",
                "How to Use",
                "Example",
                "FAQ",
              ],
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "@id": "https://calculatorhub.site/cagr-calculator#breadcrumbs",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://calculatorhub.site/" },
              { "@type": "ListItem", "position": 2, "name": "Currency & Finance", "item": "https://calculatorhub.site/category/currency-finance" },
              { "@type": "ListItem", "position": 3, "name": "CAGR Calculator", "item": "https://calculatorhub.site/cagr-calculator" }
            ]
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://calculatorhub.site/cagr-calculator#faq",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What is CAGR used for?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text":
                    "CAGR measures average annual growth considering compounding, enabling fair comparison between investments.",
                },
              },
              {
                "@type": "Question",
                "name": "Is the calculator free?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, it’s free to use online with no registration.",
                },
              },
              {
                "@type": "Question",
                "name": "Can I include months?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text":
                    "Yes, enter years and months; the tool normalizes duration automatically.",
                },
              },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://calculatorhub.site/cagr-calculator#webapp",
            "name": "CAGR Calculator",
            "url": "https://calculatorhub.site/cagr-calculator",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "Web",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "image": ["https://calculatorhub.site/images/cagr-calculator-hero.webp"],
          },
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://calculatorhub.site/cagr-calculator#software",
            "name": "Compound Annual Growth Rate Tool",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "All",
            "url": "https://calculatorhub.site/cagr-calculator",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "description": "Interactive CAGR computation with shareable deep-link.",
          },
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
              "query-input": "required name=query",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": "https://calculatorhub.site/#organization",
            "name": "CalculatorHub",
            "url": "https://calculatorhub.site",
            "logo": {
              "@type": "ImageObject",
              "url": "https://calculatorhub.site/images/logo.png",
            },
          },
        ]}
      />

      {/* Outside meta/link tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <link rel="canonical" href="https://calculatorhub.site/cagr-calculator" />
      <link rel="alternate" href="https://calculatorhub.site/cagr-calculator" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/cagr-calculator" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/cagr-calculator" hreflang="x-default" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="CAGR Calculator — Compound Annual Growth Rate" />
      <meta property="og:description" content="Compute CAGR from initial/final value and duration. Share results and compare investments." />
      <meta property="og:url" content="https://calculatorhub.site/cagr-calculator" />
      <meta property="og:image" content="https://calculatorhub.site/images/cagr-calculator-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="CAGR calculator dashboard and chart" />
      <meta property="og:locale" content="en_US" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="CAGR Calculator — Compound Annual Growth Rate" />
      <meta name="twitter:description" content="Free online CAGR calculator with gain/loss breakdown and shareable link." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/cagr-calculator-hero.webp" />
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#0ea5e9" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="preload" as="image" href="/images/cagr-calculator-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "CAGR Calculator", url: "/cagr-calculator" },
          ]}
        />

        {/* ===== Header ===== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">📈 CAGR Calculator</h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Calculate the Compound Annual Growth Rate (CAGR) of your investment and compare it across time periods easily.
          </p>
        </div>

        {/* ===== Input + Output Grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-sky-400" /> Investment Details
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
              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Select Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-48 bg-[#0f172a] text-white text-sm px-3 py-1.5 border border-[#334155] rounded-md focus:ring-2 focus:ring-indigo-500"
                >
                  {currencyOptions.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Initial Value */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Initial Value ({findSymbol(currency)})
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoValue(!showInfoValue)}
                  />
                </label>
                {showInfoValue && (
                  <p className="text-xs bg-[#0f172a] border border-[#334155] rounded-md p-2 mt-1">
                    The starting investment amount or portfolio value at the beginning of the period.
                  </p>
                )}
                <input
                  type="number"
                  min={0}
                  value={Number.isFinite(initialValue) && initialValue !== 0 ? initialValue : ""}
                  onChange={(e) => setInitialValue(parseFloat(e.target.value) || 0)}
                  placeholder="Enter starting amount"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Final Value */}
              <div>
                <label className="text-sm font-medium text-slate-300">Final Value ({findSymbol(currency)})</label>
                <input
                  type="number"
                  min={0}
                  value={Number.isFinite(finalValue) && finalValue !== 0 ? finalValue : ""}
                  onChange={(e) => setFinalValue(parseFloat(e.target.value) || 0)}
                  placeholder="Enter final value"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Investment Duration
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoYears(!showInfoYears)}
                  />
                </label>
                {showInfoYears && (
                  <p className="text-xs bg-[#0f172a] border border-[#334155] rounded-md p-2 mt-1">
                    Enter the total time the investment was held in years and months.
                  </p>
                )}
                <div className="flex gap-4">
                  <input
                    type="number"
                    min={0}
                    value={Number.isFinite(years) && years !== 0 ? years : ""}
                    onChange={(e) => onYearsChange(e.target.value)}
                    placeholder="Years"
                    className="w-1/2 bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    min={0}
                    max={11}
                    value={Number.isFinite(months) && months !== 0 ? months : ""}
                    onChange={(e) => onMonthsChange(e.target.value)}
                    placeholder="Months (0–11)"
                    className="w-1/2 bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">CAGR Summary</h2>
            <div className="space-y-6">
              <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                <div className="text-3xl font-bold text-white">{isFinite(cagr) ? cagr.toFixed(2) : "0.00"}%</div>
                <div className="text-sm text-slate-400">Compound Annual Growth Rate</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(totalGain, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Total Gain</div>
                </div>
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {isFinite(annualReturn) ? annualReturn.toFixed(2) : "0.00"}%
                  </div>
                  <div className="text-sm text-slate-400">Avg Annual Return</div>
                </div>
              </div>

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

        {/* ===== Chart & Breakdown ===== */}
        {cagr > 0 && (
          <div className="mt-6 bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">Investment Growth Breakdown</h3>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Pie Chart */}
              <div className="w-[90%] sm:w-[70%] md:w-[50%] max-w-[360px] h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Initial Value", value: Math.max(0, initialValue) },
                        { name: "Gain", value: Math.max(0, totalGain) },
                      ]}
                      dataKey="value"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#22c55e" />
                    </Pie>
                    <ReTooltip
                      formatter={(v: any) =>
                        formatCurrency(Number(v), currentLocale, currency)
                      }
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Summary */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-sky-500 transition">
                  <p className="text-sm text-slate-400">Initial Value</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(initialValue, currentLocale, currency)}
                  </p>
                </div>
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-emerald-500 transition">
                  <p className="text-sm text-slate-400">Total Gain</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(totalGain, currentLocale, currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Smart Tip ===== */}
        {cagr > 0 && (
          <div className="mt-5 bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm">
            <p className="text-base font-medium leading-snug text-slate-300">
              💡 Tip: A higher CAGR indicates stronger growth — but check if it’s
              <span className="text-indigo-400 font-semibold"> consistent</span> and
              <span className="text-emerald-400 font-semibold"> sustainable</span> over time.
            </p>
          </div>
        )}

        {/* ===== SEO / Informational Section ===== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          {/* (Your long SEO content stays unchanged) */}
          {/* ... */}
        </section>



        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          
            <h1 className="text-3xl font-bold text-cyan-400 mb-6">
              CAGR Calculator 2025 – Measure and Understand Your Investment Growth
            </h1>
          
            <p>
              The <strong>CAGR Calculator by CalculatorHub</strong> is a smart and accurate online tool
              designed to calculate the <em>Compound Annual Growth Rate (CAGR)</em> of your investment over time.
              It helps you understand how consistently your money has grown year after year,
              even when annual returns fluctuate. Whether you’re an investor, analyst, business owner,
              or financial planner, this <strong>free CAGR Calculator</strong> makes it simple to measure,
              compare, and visualize growth effectively.
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              💡 What Is CAGR (Compound Annual Growth Rate)?
            </h2>
          
            <p>
              The Compound Annual Growth Rate, or <strong>CAGR</strong>, represents the mean annual growth
              rate of an investment over a defined period, assuming profits are reinvested at the end of each year.
              In other words, it is the rate at which an investment would have grown
              if it had increased at a steady rate on an annual basis.
              CAGR is one of the most reliable ways to compare investments that fluctuate in value over time.
            </p>
          
            <p>
              For example, while yearly growth might vary — 10% one year, 5% the next, and 12% the year after —
              CAGR smooths out those variations to show an average annualized return. 
              It gives a clearer picture of how your money has actually performed overall.
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              🧮 CAGR Formula Explained
            </h2>
          
            <p className="font-mono text-center text-indigo-300">
              CAGR = ((Final Value / Initial Value) ^ (1 / Years)) − 1
            </p>
          
            <p className="text-center text-slate-400 mt-2">
              Where: <br />
              Initial Value = Starting investment amount<br />
              Final Value = Ending investment amount<br />
              Years = Duration of the investment
            </p>
          
            <p>
              This formula calculates the steady annual rate of growth that would take your
              initial investment to its final value over a given time period. 
              The <strong>CAGR Calculator</strong> automatically applies this equation for you,
              eliminating the need for manual calculations.
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              📊 Example: How To Calculate CAGR
            </h2>
          
            <p>
              Suppose you invested <strong>$10,000</strong> in a mutual fund, and after 5 years,
              your investment grew to <strong>$16,000</strong>. 
              Here’s how you calculate the CAGR:
            </p>
          
            <pre className="bg-slate-900/70 p-4 rounded-lg overflow-x-auto text-[13px] border border-slate-700">
            {`Initial Value = $10,000
          Final Value   = $16,000
          Years         = 5
          
          CAGR = ((16,000 / 10,000) ^ (1 / 5)) − 1
          CAGR = (1.6 ^ 0.2) − 1
          CAGR = 1.0986 − 1
          CAGR = 0.0986 or 9.86%`}
            </pre>
          
            <p>
              This means your investment grew by an average of <strong>9.86% per year</strong>
              over that 5-year period. The CAGR Calculator instantly provides this result,
              helping you compare multiple investments quickly and accurately.
            </p>

            <AdBanner type="bottom" />
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              ⚙️ How To Use The CAGR Calculator
            </h2>
          
            <ol className="list-decimal list-inside space-y-2">
              <li>Enter your <strong>Initial Investment Value</strong> (starting amount).</li>
              <li>Enter your <strong>Final Value</strong> (value at the end of the period).</li>
              <li>Specify the <strong>Duration</strong> in years and months.</li>
              <li>Select your preferred <strong>Currency</strong>.</li>
              <li>View your <strong>CAGR result instantly</strong> with total gain and average annual return.</li>
            </ol>
          
            <p>
              The tool also supports months in fractional format — for example, 3 years and 6 months
              is automatically converted to 3.5 years to maintain accuracy in the CAGR calculation.
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              🧰 Why CAGR Is Important
            </h2>
          
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Compares investments fairly:</strong> CAGR neutralizes volatility for better comparison.</li>
              <li><strong>Tracks long-term performance:</strong> Ideal for 3–10 year horizons.</li>
              <li><strong>Eliminates short-term noise:</strong> Smooths out irregular ups and downs.</li>
              <li><strong>Helps with goal planning:</strong> Shows the growth rate needed to reach a target amount.</li>
            </ul>
          
            <p>
              CAGR is especially useful when evaluating mutual funds, stock portfolios, 
              or business growth, where returns can vary greatly from year to year.
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              📈 CAGR vs. Other Financial Metrics
            </h2>
          
            <table className="min-w-full text-sm border-collapse border border-slate-700">
              <thead className="bg-slate-800/70 text-slate-300">
                <tr>
                  <th className="p-3 border border-slate-700">Metric</th>
                  <th className="p-3 border border-slate-700">Description</th>
                  <th className="p-3 border border-slate-700">Best For</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                <tr>
                  <td className="p-3 border border-slate-700">CAGR</td>
                  <td className="p-3 border border-slate-700">Average annual rate of return assuming compounding.</td>
                  <td className="p-3 border border-slate-700">Comparing investments over time.</td>
                </tr>
                <tr>
                  <td className="p-3 border border-slate-700">Average Annual Return</td>
                  <td className="p-3 border border-slate-700">Simple mean of yearly returns, ignores compounding.</td>
                  <td className="p-3 border border-slate-700">Short-term comparisons.</td>
                </tr>
                <tr>
                  <td className="p-3 border border-slate-700">IRR / XIRR</td>
                  <td className="p-3 border border-slate-700">Considers irregular cashflows and reinvestment timing.</td>
                  <td className="p-3 border border-slate-700">Complex investment projects.</td>
                </tr>
              </tbody>
            </table>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              🏦 Business and Portfolio Applications
            </h2>
          
            <p>
              The CAGR Calculator isn’t just for investors — it’s widely used by
              <strong> financial analysts, startups, and business managers</strong>
              to assess company growth, profit margins, or customer base expansion over time.
              For example, a company’s revenue may have grown from $1 million to $3 million
              in five years, translating to a CAGR of about 24.57%.
            </p>
          
            <p>
              In finance, CAGR is also used to compare fund managers, assess risk-adjusted returns,
              and evaluate whether a particular investment strategy is consistently delivering growth.
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              🚀 How To Interpret Your CAGR Result
            </h2>
          
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>High CAGR (10%+):</strong> Indicates strong growth, but evaluate sustainability and risk.
              </li>
              <li>
                <strong>Moderate CAGR (5–10%):</strong> Suggests stable, consistent returns — ideal for long-term portfolios.
              </li>
              <li>
                <strong>Low CAGR (&lt;5%):</strong> May still be acceptable for low-risk, fixed-income investments.
              </li>
            </ul>
          
            <p>
              Always compare CAGR with inflation, risk, and opportunity cost. 
              A 7% CAGR may seem solid, but if inflation averages 6%, your real return is only 1%.
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              📘 Advantages of Using CalculatorHub’s CAGR Tool
            </h2>
          
            <ul className="list-disc list-inside space-y-2">
              <li>Instant, accurate results powered by a proven CAGR formula.</li>
              <li>Works across multiple currencies and investment types.</li>
              <li>Includes shareable links and copy-to-clipboard results.</li>
              <li>Responsive and mobile-friendly for all devices.</li>
              <li>Designed with finance professionals in mind — simple yet powerful.</li>
            </ul>
          
            <p>
              The interface uses real-time calculations and auto-saves your inputs in localStorage,
              so you can pick up your analysis anytime without re-entering data.
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              🧩 Common Mistakes To Avoid
            </h2>
          
            <ul className="list-disc list-inside space-y-2">
              <li>Ignoring the effect of inflation while interpreting CAGR.</li>
              <li>Using CAGR for short durations (less than one year).</li>
              <li>Comparing different timeframes across assets.</li>
              <li>Mixing pre-tax and post-tax returns.</li>
            </ul>
           
            <p>
              Avoiding these mistakes ensures that your CAGR analysis remains both
              accurate and meaningful, helping you make data-driven decisions.
            </p>

          {/* ===================== FAQ SECTION ===================== */}
          <section className="space-y-6 mt-16">
            <h2 id="faq" className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>
          
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q1: What does CAGR tell you?</h3>
                <p>
                  CAGR shows the average annual growth rate of an investment assuming compounding each year.
                  It helps you measure performance consistently across time.
                </p>
              </div>
          
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q2: Can I include months in the calculation?</h3>
                <p>
                  Yes. This tool accepts both years and months, automatically converting the period into decimal years.
                </p>
              </div>
          
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q3: Does CAGR account for volatility?</h3>
                <p>
                  No. CAGR smooths volatility into a single rate for comparison, but it does not reflect year-to-year fluctuations.
                </p>
              </div>
          
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q4: Is CAGR better than average annual return?</h3>
                <p>
                  Yes — CAGR incorporates compounding, while a simple average does not. This makes CAGR more accurate for long-term analysis.
                </p>
              </div>
          
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q5: Who can use this calculator?</h3>
                <p>
                  Anyone — from students and personal investors to financial advisors and corporate analysts.
                  It’s completely free and requires no registration.
                </p>
              </div>
            </div>
          </section>

          
            
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              🌐 Final Thoughts
            </h2>
          
            <p>
              The <strong>CAGR Calculator by CalculatorHub</strong> is your all-in-one solution for analyzing 
              investment performance, understanding compound growth, and planning long-term wealth goals.
              Its precision, simplicity, and visually clear breakdowns make it one of the best online CAGR tools in 2025.
            </p>
          
            <p>
              Use it to compare mutual funds, business revenues, or any financial asset — and make
              informed investment decisions based on data, not guesswork.
            </p>
          
            {/* =================== AUTHOR & BACKLINK SECTION =================== */}
            <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
              <div className="flex items-center gap-3">
                <img
                  src="/images/calculatorhub-author.webp"
                  alt="CalculatorHub Finance Tools Team"
                  className="w-12 h-12 rounded-full border border-gray-600"
                  loading="lazy"
                />
                <div>
                  <p className="font-semibold text-white">Written by the CalculatorHub Finance Tools Team</p>
                  <p className="text-sm text-slate-400">
                    Experts in investment returns and online financial tools. Last updated:{" "}
                    <time dateTime="2025-10-17">October 17, 2025</time>.
                  </p>
                </div>
              </div>
            
              <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
                <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
                  🚀 Explore more finance tools on CalculatorHub:
                </p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <Link
                    to="/roi-calculator"
                    className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
                  >
                    <span className="text-emerald-400">📊</span> ROI Calculator
                  </Link>
            
                  <Link
                    to="/sip-calculator"
                    className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-400 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
                  >
                    <span className="text-sky-400">💰</span> SIP Calculator
                  </Link>
            
                  <Link
                    to="/lump-sum-investment-calculator"
                    className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
                  >
                    <span className="text-indigo-400">🏦</span> Lump Sum Investment Calculator
                  </Link>
                </div>
              </div>
            </section>

          
          </section>


        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/cagr-calculator" category="investment-returns" />
      </div>
    </>
  );
};

export default CAGRCalculator;
