// ================= SimpleInterestCalculator.tsx (Part 1/2) =================
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  PiggyBank,
  RotateCcw,
  Copy,
  Share2,
  Info,
} from "lucide-react";
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
const LS_KEY = "simple_interest_calc_v1";

const currencyOptions = [
  { code: "USD", symbol: "$", locale: "en-US", label: "US Dollar ($)" },
  { code: "INR", symbol: "₹", locale: "en-IN", label: "Indian Rupee (₹)" },
  { code: "EUR", symbol: "€", locale: "de-DE", label: "Euro (€)" },
  { code: "GBP", symbol: "£", locale: "en-GB", label: "British Pound (£)" },
  { code: "AUD", symbol: "A$", locale: "en-AU", label: "Australian Dollar (A$)" },
];

const findLocale = (code: string) =>
  currencyOptions.find((c) => c.code === code)?.locale || "en-US";
const findSymbol = (code: string) =>
  currencyOptions.find((c) => c.code === code)?.symbol || "";

const formatCurrency = (num: number, locale: string, currency: string) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(num);

/* ============================================================
   🧮 COMPONENT
   ============================================================ */
const SimpleInterestCalculator: React.FC = () => {
  // Inputs
  const [principal, setPrincipal] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [timeYears, setTimeYears] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("USD");

  // Outputs
  const [simpleInterest, setSimpleInterest] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  // UI state
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [hydrated, setHydrated] = useState(false);
  const [showInfoRate, setShowInfoRate] = useState(false);
  const [showInfoTime, setShowInfoTime] = useState(false);

  const currentLocale = findLocale(currency);
  const isDefault = !principal && !rate && !timeYears;

  // —— helpers for display ——
  const fmt = (n: number) => formatCurrency(isFinite(n) ? n : 0, currentLocale, currency);
  const pct = (p: number) => `${(p).toFixed(3)}%`;
  const yearsPretty = (y: number) => {
    if (!isFinite(y) || y <= 0) return "—";
    const yrs = Math.floor(y);
    const mos = Math.round((y - yrs) * 12);
    return yrs > 0 ? `${yrs}y ${mos}m` : `${mos}m`;
  };
  
  // —— derived values for preview ——
  const r_y = Math.max(0, rate);                     // annual % as entered
  const r_dec = r_y / 100;                           // annual rate in decimal
  const i_per_year = principal * r_dec;              // interest in first year (simple 
  const i_total = simpleInterest;                    // already computed by your effect
  const total = totalAmount;   

  
  // 1) Helper (put above your component or inside it)
  const copyToClipboardSafe = async (text: string) => {
    try {
      if (window.isSecureContext && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      // Fallback: hidden textarea + execCommand
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  const [snapCopied, setSnapCopied] = useState(false);



  /* ============================================================
     🔁 PERSISTENCE
     ============================================================ */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setPrincipal(s.principal || 0);
        setRate(s.rate || 0);
        setTimeYears(s.timeYears || 0);
        setCurrency(s.currency || "USD");
      }
    } catch {
      console.warn("⚠️ Could not load local state");
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ principal, rate, timeYears, currency })
      );
    } catch {
      console.warn("⚠️ Could not save local state");
    }
  }, [hydrated, principal, rate, timeYears, currency]);

  /* ============================================================
     🧮 CALCULATION
     ============================================================ */
  useEffect(() => {
    if (principal <= 0 || rate <= 0 || timeYears <= 0) {
      setSimpleInterest(0);
      setTotalAmount(0);
      return;
    }
    const si = (principal * rate * timeYears) / 100;
    setSimpleInterest(si);
    setTotalAmount(principal + si);
  }, [principal, rate, timeYears]);

  /* ============================================================
     📋 COPY / SHARE / RESET
     ============================================================ */
  const reset = () => {
    setPrincipal(0);
    setRate(0);
    setTimeYears(0);
    setCurrency("USD");
    localStorage.removeItem(LS_KEY);
  };

  const copyResults = async () => {
    const text = [
      "Simple Interest Summary",
      `Principal: ${formatCurrency(principal, currentLocale, currency)}`,
      `Rate: ${rate}%`,
      `Time: ${timeYears} years`,
      `Simple Interest: ${formatCurrency(simpleInterest, currentLocale, currency)}`,
      `Total Amount: ${formatCurrency(totalAmount, currentLocale, currency)}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const encoded = btoa(JSON.stringify({ principal, rate, timeYears, currency }));
    const url = new URL(window.location.href);
    url.searchParams.set("si", encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  /* ============================================================
     🎨 RENDER START
     ============================================================ */
  return (
    <>
      {/** ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Simple Interest Calculator — SI, Total Amount & Fast Interest Breakdown"
        description="Use our free Simple Interest Calculator to compute SI and total amount (P + SI) from principal, annual rate, and time. Fast, accurate, mobile-friendly."
        keywords={[
          "simple interest calculator",
          "SI calculator",
          "interest formula",
          "total amount calculator",
          "principal rate time",
          "loan interest calculator",
          "deposit interest calculator",
          "finance calculator",
          "P R T / 100",
          "simple vs compound interest"
        ]}
        canonical="https://calculatorhub.site/simple-interest-calculator"
        schemaData={[
          // 1) WebPage + Article
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://calculatorhub.site/simple-interest-calculator#webpage",
            "url": "https://calculatorhub.site/simple-interest-calculator",
            "name": "Simple Interest Calculator (2025–2026) — Compute SI & Total Amount",
            "inLanguage": "en",
            "isPartOf": { "@id": "https://calculatorhub.site/#website" },
            "primaryImageOfPage": {
              "@type": "ImageObject",
              "@id": "https://calculatorhub.site/images/simple-interest-calculator-hero.webp#primaryimg",
              "url": "https://calculatorhub.site/images/simple-interest-calculator-hero.webp",
              "width": 1200,
              "height": 675
            },
            "mainEntity": {
              "@type": "Article",
              "@id": "https://calculatorhub.site/simple-interest-calculator#article",
              "headline": "Simple Interest Calculator — Formula, Examples & Instant Results",
              "description": "Calculate simple interest and total amount using SI = (P × R × T) / 100. Includes examples, tips, and comparisons.",
              "image": ["https://calculatorhub.site/images/simple-interest-calculator-hero.webp"],
              "author": { "@type": "Organization", "name": "CalculatorHub", "url": "https://calculatorhub.site" },
              "publisher": { "@id": "https://calculatorhub.site/#organization" },
              "datePublished": "2025-10-17",
              "dateModified": "2025-11-06",
              "mainEntityOfPage": { "@id": "https://calculatorhub.site/simple-interest-calculator#webpage" },
              "articleSection": [
                "What is Simple Interest",
                "How to Use",
                "Formula",
                "Example",
                "Benefits",
                "Comparison & Cost",
                "Beginner Guide",
                "Alternatives",
                "FAQ"
              ]
            }
          },
      
          // 2) Breadcrumbs
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "@id": "https://calculatorhub.site/simple-interest-calculator#breadcrumbs",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://calculatorhub.site/" },
              { "@type": "ListItem", "position": 2, "name": "Currency & Finance", "item": "https://calculatorhub.site/category/currency-finance" },
              { "@type": "ListItem", "position": 3, "name": "Simple Interest Calculator", "item": "https://calculatorhub.site/simple-interest-calculator" }
            ]
          },
      
          // 3) FAQ
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://calculatorhub.site/simple-interest-calculator#faq",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How does a Simple Interest Calculator work?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "It multiplies principal, annual rate, and time in years, then divides by 100 to get SI, and adds it to principal for total amount."
                }
              },
              {
                "@type": "Question",
                "name": "What’s the difference between simple and compound interest?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Simple interest applies only on the principal; compound interest accrues on principal plus previously earned interest."
                }
              },
              {
                "@type": "Question",
                "name": "Is this calculator free to use?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, it’s free, privacy-friendly, and runs locally in your browser."
                }
              }
            ]
          },
      
          // 4) WebApplication
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://calculatorhub.site/simple-interest-calculator#webapp",
            "name": "Simple Interest Calculator",
            "url": "https://calculatorhub.site/simple-interest-calculator",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "Web",
            "description": "Compute simple interest (SI) and total amount with a clean UI and instant results.",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "image": ["https://calculatorhub.site/images/simple-interest-calculator-hero.webp"]
          },
      
          // 5) SoftwareApplication (optional)
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://calculatorhub.site/simple-interest-calculator#software",
            "name": "Simple Interest Calculator",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "All",
            "url": "https://calculatorhub.site/simple-interest-calculator",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "description": "Interactive SI tool with examples, shareable results, and chart breakdown."
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
      <link rel="canonical" href="https://calculatorhub.site/simple-interest-calculator" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/simple-interest-calculator" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/simple-interest-calculator" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/simple-interest-calculator" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Simple Interest Calculator (2025–2026) — Compute SI & Total Amount" />
      <meta property="og:description" content="Free Simple Interest Calculator to find SI and total amount quickly using P, R, and T." />
      <meta property="og:url" content="https://calculatorhub.site/simple-interest-calculator" />
      <meta property="og:image" content="https://calculatorhub.site/images/simple-interest-calculator-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Simple Interest Calculator dashboard showing SI vs principal breakdown" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Simple Interest Calculator — SI, Total Amount & Fast Interest Breakdown" />
      <meta name="twitter:description" content="Compute SI and total amount from principal, rate, and time. Fast, accurate, and mobile-friendly." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/simple-interest-calculator-hero.webp" />
      <meta name="twitter:creator" content="@CalculatorHub" />
      <meta name="twitter:site" content="@CalculatorHub" />
      
      {/** PWA & theme */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#38bdf8" />
      
      {/** Performance */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="preload" as="image" href="/images/simple-interest-calculator-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />

      


      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "Simple Interest Calculator", url: "/simple-interest-calculator" },
          ]}
        />

        {/* ===== Header ===== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            💰 Simple Interest Calculator
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Compute simple interest and total repayment amount based on principal, rate, and time.
          </p>
        </div>

        {/* ===== Input + Output Grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-sky-400" /> Loan / Deposit Details
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
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select Currency
                </label>
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

              {/* Principal */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">
                  Principal ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={principal || ""}
                  onChange={(e) => setPrincipal(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter principal amount"
                />
              </div>

              {/* Rate */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Annual Interest Rate (%)
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoRate(!showInfoRate)}
                  />
                </label>
                {showInfoRate && (
                  <p className="text-xs bg-[#0f172a] border border-[#334155] rounded-md p-2 mt-1">
                    Annual percentage rate — interest earned or charged per year.
                  </p>
                )}
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={rate || ""}
                  onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 7.5"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Time */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Time Period (Years)
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoTime(!showInfoTime)}
                  />
                </label>
                {showInfoTime && (
                  <p className="text-xs bg-[#0f172a] border border-[#334155] rounded-md p-2 mt-1">
                    Enter duration in years — e.g. 2 for 2 years or 0.5 for 6 months.
                  </p>
                )}
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={timeYears || ""}
                  onChange={(e) => setTimeYears(parseFloat(e.target.value) || 0)}
                  placeholder="Enter time in years"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">
              Interest Summary
            </h2>
            <div className="space-y-6">
              <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(simpleInterest, currentLocale, currency)}
                </div>
                <div className="text-sm text-slate-400">Simple Interest</div>
              </div>

              <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                <div className="text-lg font-semibold text-white">
                  {formatCurrency(totalAmount, currentLocale, currency)}
                </div>
                <div className="text-sm text-slate-400">Total Amount (P + SI)</div>
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
        {principal > 0 && simpleInterest > 0 && (
          <div className="mt-6 bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              Simple Interest Breakdown
            </h3>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Pie Chart */}
              <div className="w-[90%] sm:w-[70%] md:w-[50%] max-w-[360px] h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Principal", value: principal },
                        { name: "Interest", value: simpleInterest },
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
                  <p className="text-sm text-slate-400">Principal</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(principal, currentLocale, currency)}
                  </p>
                </div>
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-emerald-500 transition">
                  <p className="text-sm text-slate-400">Interest Earned</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(simpleInterest, currentLocale, currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Smart Tip ===== */}
        {simpleInterest > 0 && (
          <div className="mt-5 bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm">
            <p className="text-base font-medium leading-snug text-slate-300">
              💡 Tip: Increasing your <span className="text-indigo-400 font-semibold">time period</span> 
              or <span className="text-emerald-400 font-semibold">interest rate</span> boosts 
              your earnings linearly under simple interest — unlike compound interest!
            </p>
          </div>
        )}

        {/* ===== SEO Content Section ===== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          <h1 className="text-3xl font-bold text-cyan-400 mb-6">
            Simple Interest Calculator 2025 – Easy Online Interest Guide
          </h1>
        
          <p>
            The <strong>Simple Interest Calculator by CalculatorHub</strong> is a quick and
            accurate financial tool that helps users calculate total interest and overall
            repayment with ease. Whether you’re a student, professional, or small business
            owner, this <strong>simple Simple Interest Calculator</strong> delivers clear
            results in seconds.
          </p>
        
          <figure className="my-8">
            <img
              src="/images/simple-interest-calculator-hero.webp"
              alt="Simple Interest Calculator interface showing results and chart"
              title="Simple Interest Calculator 2025 | Free Online Tool"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Visualization of the Simple Interest Calculator dashboard UI.
            </figcaption>
          </figure>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🔎 What is a Simple Interest Calculator?
          </h2>
          <p>
            A <strong>Simple Interest Calculator</strong> computes interest on a fixed
            principal amount over a specific period. It’s ideal for loans, savings, or
            deposits where interest is not compounded. This <strong>Simple Interest Calculator explained</strong> makes understanding financial growth
            easier for everyone — from beginners to professionals.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ⚙️ How to Use Simple Interest Calculator
          </h2>
          <p>
            Using this <strong>free Simple Interest Calculator online</strong> is simple:
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter your <strong>principal amount</strong> (loan or investment).</li>
            <li>Add the <strong>annual interest rate</strong>.</li>
            <li>Specify the <strong>time period</strong> in years or months.</li>
            <li>Click “Calculate” to view interest earned and total amount.</li>
          </ol>
          <p>
            It’s an <strong>easy Simple Interest Calculator</strong> built for clarity,
            accuracy, and user-friendliness.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            💡 Simple Interest Formula
          </h2>
          <p className="font-mono text-center text-indigo-300">
            SI = (P × R × T) / 100  Total = P + SI
          </p>
          <p>
            Here, <strong>P</strong> = Principal, <strong>R</strong> = Rate of interest per year, and <strong>T</strong> = Time in years.  
            The <strong>advanced Simple Interest Calculator</strong> applies this formula instantly
            to deliver accurate results every time.
          </p>
         {/* ===== Snapshot (uses your helpers) ===== */}
        <section className="mt-8 space-y-5">
          {/* Title */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
                📌 Rate & Term Snapshot
              </span>
            </h2>
        
            {/* Copy snapshot */}
            <button
                onClick={async () => {
                  const tape = [
                    "======Snapshot======",
                    `P        = ${fmt(principal)}`,
                    `R%      = ${r_y || 0}%`,
                    `R    = ${r_dec.toFixed(6)}`,
                    `Time  = ${timeYears || 0} (${yearsPretty(timeYears)})`,
                    "",
                    "First-year (simple, no compounding)",
                    `First-year  = P × R = ${fmt(i_per_year)}`,
                    "",
                    "Totals",
                    `SI       = ${fmt(i_total)}`,
                    `Total    = ${fmt(total)}`
                  ].join("\n");
              
                  const ok = await copyToClipboardSafe(tape);
                  setSnapCopied(ok);
                  setTimeout(() => setSnapCopied(false), 1400);
                }}
                className="relative text-xs md:text-sm bg-[#0f172a] hover:bg-[#0b1220] text-slate-200 border border-[#334155] rounded-lg px-3 py-2 transition"
                title="Copy snapshot"
              >
                Copy Snapshot
                {snapCopied && (
                  <span className="absolute -right-2 -top-2 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[11px]">
                    Copied!
                  </span>
                )}
              </button>
          </div>
        
          {/* Stat tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-xl bg-[#0f172a] border border-[#334155] p-4 hover:border-sky-500 transition">
              <p className="text-xs text-slate-400">Principal</p>
              <p className="text-lg font-semibold text-white">{fmt(principal)}</p>
            </div>
            <div className="rounded-xl bg-[#0f172a] border border-[#334155] p-4 hover:border-indigo-500 transition">
              <p className="text-xs text-slate-400">Rate (annual)</p>
              <p className="text-lg font-semibold text-white">{r_y || 0}%</p>
            </div>
            <div className="rounded-xl bg-[#0f172a] border border-[#334155] p-4 hover:border-fuchsia-500 transition">
              <p className="text-xs text-slate-400">Rate (decimal)</p>
              <p className="text-lg font-semibold text-white">{r_dec.toFixed(6)}</p>
            </div>
            <div className="rounded-xl bg-[#0f172a] border border-[#334155] p-4 hover:border-emerald-500 transition">
              <p className="text-xs text-slate-400">Time</p>
              <p className="text-lg font-semibold text-white">
                {timeYears || 0}y <span className="text-slate-400 text-sm">({yearsPretty(timeYears)})</span>
              </p>
            </div>
            <div className="rounded-xl bg-[#0f172a] border border-[#334155] p-4 hover:border-cyan-500 transition">
              <p className="text-xs text-slate-400">1st-Year Interest</p>
              <p className="text-lg font-semibold text-white">{fmt(i_per_year)}</p>
            </div>
            <div className="rounded-xl bg-[#0f172a] border border-[#334155] p-4 hover:border-amber-500 transition">
              <p className="text-xs text-slate-400">Total (P + SI)</p>
              <p className="text-lg font-semibold text-white">{fmt(total)}</p>
            </div>
          </div>

          <AdBanner type="bottom" />
          {/* Formula bar */}
          <div className="rounded-xl bg-[#0b1220] border border-[#334155] p-3 font-mono text-[13px] text-indigo-300 overflow-x-auto">
            SI = (P × R_% × T) / 100 &nbsp; | &nbsp; Rate = R_% / 100 &nbsp; | &nbsp; Total = P + SI
          </div>
        
          {/* Details cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#0f172a] border border-[#334155] p-4">
              <h3 className="text-sm font-semibold text-indigo-300 mb-2">Rate Conversion</h3>
              <div className="font-mono text-[13px] text-slate-200 overflow-x-auto whitespace-pre">
        {`R_%   = ${r_y || 0}%
Rate  = ${r_dec.toFixed(6)}`}
              </div>
            </div>
        
            <div className="rounded-xl bg-[#0f172a] border border-[#334155] p-4">
              <h3 className="text-sm font-semibold text-emerald-300 mb-2">First-Year Interest (no compounding)</h3>
              <div className="font-mono text-[13px] text-slate-200 overflow-x-auto whitespace-pre">
        {`1st year = P × Rate
         = ${fmt(principal)} × ${r_dec.toFixed(6)}
         = ${fmt(i_per_year)}`}
              </div>
            </div>
        
            <div className="rounded-xl bg-[#0f172a] border border-[#334155] p-4 lg:col-span-2">
              <h3 className="text-sm font-semibold text-cyan-300 mb-2">Totals</h3>
              <div className="font-mono text-[13px] text-slate-200 overflow-x-auto whitespace-pre">
        {`SI    = ${fmt(i_total)}
Total = P + SI = ${fmt(total)}`}
              </div>
            </div>
          </div>
        
          {/* Compact tape (with preserved line breaks) */}
          <div className="rounded-xl border border-slate-700 bg-[#0f172a] p-3 font-mono text-[13px] text-slate-200 overflow-x-auto whitespace-pre">
        {`Simple Interest Snapshot
        P        = ${fmt(principal)}
        R_%      = ${r_y || 0}%
        Rate     = ${r_dec.toFixed(6)}
        Time     = ${timeYears || 0} (${yearsPretty(timeYears)})
        
        1st year  = P × Rate = ${fmt(i_per_year)}
        SI_total  = ${fmt(i_total)}
        Total     = ${fmt(total)}`}
          </div>
        
          {/* Helper tip */}
          <p className="text-xs text-slate-400">
            Tip: Simple interest is linear — doubling any one of P, R, or T (keeping others fixed) doubles SI.
          </p>
        </section>


          
          


        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📘 Example Calculation
          </h2>
          <p>
            Imagine you deposit <strong>$10,000</strong> at an interest rate of
            <strong> 8%</strong> per year for <strong>3 years</strong>.  
            Simple Interest = (10,000 × 8 × 3) / 100 = <strong>$2,400</strong>.  
            Total Amount = <strong>$12,400</strong>.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🌟 Benefits of Simple Interest Calculator
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Instant results for quick loan or savings planning.</li>
            <li>No registration — it’s a <strong>free Simple Interest Calculator</strong>.</li>
            <li>Perfect for educational and financial tutorials.</li>
            <li>Available as a <strong>service Simple Interest Calculator</strong> across devices.</li>
          </ul>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧩 Simple Interest Calculator Comparison & Cost
          </h2>
          <p>
            Compared to manual calculations or Excel sheets, this <strong>platform Simple Interest Calculator</strong> is faster and more accurate.
            The <strong>Simple Interest Calculator cost</strong> is completely free, with optional
            <strong> premium Simple Interest Calculator</strong> plans offering exports and
            historical charts for professionals.
          </p>

          <AdBanner type="bottom" />
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧠 Simple Interest Calculator Guide for Beginners
          </h2>
          <p>
            This <strong>Simple Interest Calculator guide</strong> is perfect for
            newcomers learning finance basics. The **professional Simple Interest Calculator**
            version supports detailed analysis for advisors or teachers.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧾 Simple Interest Calculator Alternatives
          </h2>
          <p>
            While there are many <strong>Simple Interest Calculator alternatives</strong>,
            most lack the responsive design and accuracy that CalculatorHub provides.
            Whether you need a quick, mobile-friendly solution or a
            <strong> premium Simple Interest Calculator</strong> with export features,
            this platform offers both free and paid versions to fit your needs.
          </p>
        
          {/* ===== FAQ Section ===== */}
          <section id="faq" className="space-y-6 mt-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>
        
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q1: How does a Simple Interest Calculator work?
                </h3>
                <p>
                  It calculates fixed interest based on the principal, rate, and time —
                  ideal for short-term financial planning.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q2: What’s the difference between simple and compound interest?
                </h3>
                <p>
                  Simple interest is calculated only on the original principal, while
                  compound interest includes accumulated interest from previous periods.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q3: Is there a cost to use this calculator?
                </h3>
                <p>
                  No. The basic version is free, while the premium one offers additional
                  customization and data export options.
                </p>
              </div>
            </div>
          </section>
        </section>

        <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
          <div className="flex items-center gap-3">
            <img src="/images/calculatorhub-author.webp" alt="CalculatorHub Finance Tools Team" className="w-12 h-12 rounded-full border border-gray-600" loading="lazy" />
            <div>
              <p className="font-semibold text-white">Written by the CalculatorHub Finance Tools Team</p>
              <p className="text-sm text-slate-400">Experts in mortgages and online financial tools. Last updated: <time dateTime="2025-10-17">October 17, 2025</time>.</p>
            </div>
          </div>
        
          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">🚀 Explore more finance tools on CalculatorHub:</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link to="/compound-interest-calculator" className="flex items-center gap-2 bg-[#0f172a] hover:bg-pink-600/20 text-pink-300 hover:text-pink-400 px-3 py-2 rounded-md border border-slate-700 hover:border-pink-500 transition-all duration-200">
                <span className="text-pink-400">📈</span> Compound Interest Calculator
              </Link>
              <Link to="/fd-calculator" className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-400 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200">
                <span className="text-sky-400">🏦</span> FD Calculator
              </Link>
              <Link to="/roi-calculator" className="flex items-center gap-2 bg-[#0f172a] hover:bg-amber-600/20 text-amber-300 hover:text-amber-400 px-3 py-2 rounded-md border border-slate-700 hover:border-amber-500 transition-all duration-200">
                <span className="text-amber-400">📊</span> ROI Calculator
              </Link>
            </div>
          </div>
        </section>



        <AdBanner type="bottom" />
        <RelatedCalculators
          currentPath="/simple-interest-calculator"
          category="currency-finance"
        />
      </div>
    </>
  );
};

export default SimpleInterestCalculator;
