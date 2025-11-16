// ================= HomeLoanCalculator.tsx (Part 1/2) =================
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Home,
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
import HomeLoanExplainBlock from "../components/HomeLoanExplainBlock";

/* ============================================================
   📦 CONSTANTS
   ============================================================ */
const LS_KEY = "home_loan_calculator_v1";

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
   🏠 COMPONENT
   ============================================================ */
const HomeLoanCalculator: React.FC = () => {
  // Inputs
  const [homePrice, setHomePrice] = useState<number>(0);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [loanYears, setLoanYears] = useState<number>(0);
  const [loanMonths, setLoanMonths] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("USD");

  // Outputs
  const [emi, setEmi] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);

  // UI state
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [showInfoRate, setShowInfoRate] = useState(false);
  const [showInfoTerm, setShowInfoTerm] = useState(false);

  const currentLocale = findLocale(currency);
  const totalMonths = loanYears * 12 + loanMonths;
  const loanAmount = Math.max(homePrice - downPayment, 0);
  const monthlyRate = interestRate / 12 / 100;
  const isDefault =
    !homePrice && !downPayment && !loanYears && !loanMonths && !interestRate;

  /* ============================================================
     🔁 STATE PERSISTENCE
     ============================================================ */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setHomePrice(s.homePrice || 0);
        setDownPayment(s.downPayment || 0);
        setLoanYears(s.loanYears || 0);
        setLoanMonths(s.loanMonths || 0);
        setInterestRate(s.interestRate || 0);
        setCurrency(s.currency || "USD");
      }
    } catch (err) {
      console.warn("⚠️ Failed to load saved home loan state", err);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          homePrice,
          downPayment,
          loanYears,
          loanMonths,
          interestRate,
          currency,
        })
      );
    } catch (err) {
      console.warn("⚠️ Failed to save home loan state", err);
    }
  }, [hydrated, homePrice, downPayment, loanYears, loanMonths, interestRate, currency]);

  /* ============================================================
     🧮 EMI CALCULATION
     ============================================================ */
  useEffect(() => {
    if (loanAmount <= 0 || totalMonths <= 0 || interestRate < 0) {
      setEmi(0);
      setTotalPayment(0);
      setTotalInterest(0);
      return;
    }

    if (interestRate === 0) {
      const simpleEMI = loanAmount / totalMonths;
      setEmi(simpleEMI);
      setTotalPayment(loanAmount);
      setTotalInterest(0);
      return;
    }

    const pow = Math.pow(1 + monthlyRate, totalMonths);
    const monthlyEMI = (loanAmount * monthlyRate * pow) / (pow - 1);
    setEmi(monthlyEMI);
    setTotalPayment(monthlyEMI * totalMonths);
    setTotalInterest(monthlyEMI * totalMonths - loanAmount);
  }, [loanAmount, monthlyRate, totalMonths, interestRate]);

  /* ============================================================
     📋 COPY / SHARE / RESET
     ============================================================ */
  const reset = () => {
    setHomePrice(0);
    setDownPayment(0);
    setLoanYears(0);
    setLoanMonths(0);
    setInterestRate(0);
    setCurrency("USD");
    localStorage.removeItem(LS_KEY);
  };

  const copyResults = async () => {
    const text = [
      "Home Loan Summary",
      `Home Price: ${formatCurrency(homePrice, currentLocale, currency)}`,
      `Down Payment: ${formatCurrency(downPayment, currentLocale, currency)}`,
      `Loan Amount: ${formatCurrency(loanAmount, currentLocale, currency)}`,
      `Rate: ${interestRate}%`,
      `Term: ${loanYears} years ${loanMonths} months`,
      `Monthly EMI: ${formatCurrency(emi, currentLocale, currency)}`,
      `Total Payment: ${formatCurrency(totalPayment, currentLocale, currency)}`,
      `Total Interest: ${formatCurrency(totalInterest, currentLocale, currency)}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const encoded = btoa(
      JSON.stringify({
        homePrice,
        downPayment,
        loanYears,
        loanMonths,
        interestRate,
        currency,
      })
    );
    const url = new URL(window.location.href);
    url.searchParams.set("home", encoded);
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
        title="Home Loan Calculator — EMI, Total Interest & Payment (2025–2026)"
        description="Free Home Loan Calculator to estimate monthly EMI, total interest, and total payment from home price, down payment, rate, and tenure. Fast, accurate, and mobile-friendly."
        keywords={[
          "home loan calculator",
          "house loan calculator",
          "mortgage EMI calculator",
          "home loan interest",
          "monthly mortgage payment",
          "principal vs interest chart",
          "amortization schedule",
          "property loan calculator",
          "mortgage calculator"
        ]}
        canonical="https://calculatorhub.site/home-loan-calculator"
        schemaData={[
          // 1) WebPage + Article
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://calculatorhub.site/home-loan-calculator#webpage",
            "url": "https://calculatorhub.site/home-loan-calculator",
            "name": "Home Loan Calculator (2025–2026) — EMI, Total Interest & Payment",
            "inLanguage": "en",
            "isPartOf": { "@id": "https://calculatorhub.site/#website" },
            "primaryImageOfPage": {
              "@type": "ImageObject",
              "@id": "https://calculatorhub.site/images/home-loan-calculator.webp#primaryimg",
              "url": "https://calculatorhub.site/images/home-loan-calculator.webp",
              "width": 1200,
              "height": 675
            },
            "mainEntity": {
              "@type": "Article",
              "@id": "https://calculatorhub.site/home-loan-calculator#article",
              "headline": "Home Loan Calculator — EMI, Interest & Amortization Explained",
              "description": "Calculate home loan EMI, total payment, and interest using home price, down payment, rate, and tenure. Includes formula, example, and FAQs.",
              "image": ["https://calculatorhub.site/images/home-loan-calculator.webp"],
              "author": { "@type": "Organization", "name": "CalculatorHub", "url": "https://calculatorhub.site" },
              "publisher": { "@id": "https://calculatorhub.site/#organization" },
              "datePublished": "2025-10-17",
              "dateModified": "2025-11-06",
              "mainEntityOfPage": { "@id": "https://calculatorhub.site/home-loan-calculator#webpage" },
              "articleSection": [
                "What is Home Loan Calculator",
                "How to Use",
                "EMI Formula",
                "Example",
                "Benefits",
                "Tips",
                "FAQ"
              ]
            }
          },
      
          // 2) Breadcrumbs
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "@id": "https://calculatorhub.site/home-loan-calculator#breadcrumbs",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://calculatorhub.site/" },
              { "@type": "ListItem", "position": 2, "name": "Currency & Finance", "item": "https://calculatorhub.site/category/currency-finance" },
              { "@type": "ListItem", "position": 3, "name": "Home Loan Calculator", "item": "https://calculatorhub.site/home-loan-calculator" }
            ]
          },
      
          // 3) FAQ
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://calculatorhub.site/home-loan-calculator#faq",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How can I reduce my home loan EMI?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Increase your down payment, choose a shorter tenure, improve your credit score, or refinance at a lower rate. Prepayments lower overall interest."
                }
              },
              {
                "@type": "Question",
                "name": "Does this calculator include taxes, insurance, or HOA fees?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No. It estimates principal and interest only. Add those costs to your price if you want them reflected in EMI."
                }
              },
              {
                "@type": "Question",
                "name": "Can I set 0% interest?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Set rate to 0% to get a flat monthly payment equal to loan amount divided by number of months."
                }
              }
            ]
          },
      
          // 4) WebApplication
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://calculatorhub.site/home-loan-calculator#webapp",
            "name": "Home Loan Calculator",
            "url": "https://calculatorhub.site/home-loan-calculator",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "Web",
            "description": "Compute home EMI, total interest, and total payment with shareable results and visuals.",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "image": ["https://calculatorhub.site/images/home-loan-calculator.webp"]
          },
      
          // 5) SoftwareApplication
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://calculatorhub.site/home-loan-calculator#software",
            "name": "Mortgage & Home EMI Calculator",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "All",
            "url": "https://calculatorhub.site/home-loan-calculator",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "description": "Interactive mortgage tool with EMI formula, examples, and printable summaries."
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
      <link rel="canonical" href="https://calculatorhub.site/home-loan-calculator" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/home-loan-calculator" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/home-loan-calculator" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/home-loan-calculator" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Home Loan Calculator (2025–2026) — EMI, Interest & Total Payment" />
      <meta property="og:description" content="Estimate EMI, total interest, and total payment for your mortgage. Free, fast, and privacy-friendly." />
      <meta property="og:url" content="https://calculatorhub.site/home-loan-calculator" />
      <meta property="og:image" content="https://calculatorhub.site/images/home-loan-calculator.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Home loan calculator dashboard showing EMI and interest breakdown" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Home Loan Calculator — EMI, Interest & Total Payment" />
      <meta name="twitter:description" content="Free calculator to plan your mortgage with EMI, total payment, and interest." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/home-loan-calculator.webp" />
      <meta name="twitter:creator" content="@CalculatorHub" />
      <meta name="twitter:site" content="@CalculatorHub" />
      
      {/** PWA & theme */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#06b6d4" />
      
      {/** Performance */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="preload" as="image" href="/images/home-loan-calculator.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />
      

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "Home Loan Calculator", url: "/home-loan-calculator" },
          ]}
        />

        {/* ===== Header ===== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🏠 Home Loan Calculator
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Calculate your monthly EMI, total payment, and total interest for your home loan.
          </p>
        </div>

        {/* ===== Input + Output Grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Home className="h-5 w-5 text-sky-400" /> Loan Details
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

              {/* Home Price */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">
                  Home Price ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={homePrice || ""}
                  onChange={(e) => setHomePrice(parseFloat(e.target.value) || 0)}
                  placeholder="Enter total home cost"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Down Payment */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">
                  Down Payment ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={downPayment || ""}
                  onChange={(e) =>
                    setDownPayment(Math.min(parseFloat(e.target.value) || 0, homePrice))
                  }
                  placeholder="Enter upfront payment"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Interest Rate */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Interest Rate (% per annum)
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoRate(!showInfoRate)}
                  />
                </label>
                {showInfoRate && (
                  <p className="text-xs bg-[#0f172a] border border-[#334155] rounded-md p-2 mt-1">
                    Annual interest rate charged by your lender or bank.
                  </p>
                )}
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={interestRate || ""}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 7.25"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>


              {/* Loan Term */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Loan Term
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoTerm(!showInfoTerm)}
                  />
                </label>
                {showInfoTerm && (
                  <p className="text-xs bg-[#0f172a] border border-[#334155] rounded-md p-2 mt-1">
                    Enter total loan duration in years and months.
                  </p>
                )}
                <div className="flex gap-4 mt-2">
                  <input
                    type="number"
                    min={0}
                    value={loanYears || ""}
                    onChange={(e) => setLoanYears(parseFloat(e.target.value) || 0)}
                    placeholder="Years"
                    className="w-1/2 bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    min={0}
                    max={11}
                    value={loanMonths || ""}
                    onChange={(e) => setLoanMonths(parseFloat(e.target.value) || 0)}
                    placeholder="Months"
                    className="w-1/2 bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">Loan Summary</h2>

            <div className="space-y-6">
              <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(emi, currentLocale, currency)}
                </div>
                <div className="text-sm text-slate-400">Estimated Monthly EMI</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(totalPayment, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Total Payment</div>
                </div>
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(totalInterest, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Total Interest</div>
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

        {/* ===== Chart & Insights ===== */}
        {loanAmount > 0 && totalInterest > 0 && (
          <div className="mt-6 bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              Home Loan Breakdown
            </h3>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Pie Chart */}
              <div className="w-[90%] sm:w-[70%] md:w-[50%] max-w-[360px] h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Principal (Loan Amount)", value: loanAmount },
                        { name: "Interest", value: totalInterest },
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
                  <p className="text-sm text-slate-400">Principal (Loan)</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(loanAmount, currentLocale, currency)}
                  </p>
                </div>
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-emerald-500 transition">
                  <p className="text-sm text-slate-400">Total Interest</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(totalInterest, currentLocale, currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Smart Tip ===== */}
        {emi > 0 && (
          <div className="mt-5 bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm">
            <p className="text-base font-medium leading-snug text-slate-300">
              💡 Tip: Increase your <span className="text-emerald-400 font-semibold">down payment</span> 
              or shorten your <span className="text-indigo-400 font-semibold">loan tenure</span> 
              to reduce total interest payments significantly!
            </p>
          </div>
        )}

        <AdBanner type="bottom" />
        {/* ===== SEO Content Section ===== */}
     <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
        <h1 className="text-3xl font-bold text-cyan-400 mb-6">
          Home Loan Calculator 2025 – EMI, Interest & Total Payment
        </h1>
      
        <p>
          The <strong>Home Loan Calculator by CalculatorHub</strong> is a professional, 
          <strong> powerful Home Loan Calculator</strong> built to make EMI estimation 
          easy, fast, and accurate. This <strong>free Home Loan Calculator</strong> 
          helps you find your monthly payment, total interest, and total repayment 
          for your dream home or property loan. Whether you’re a first-time buyer 
          or a financial expert, this <strong>advanced Home Loan Calculator</strong> 
          is designed for everyone. Simply enter your home price, down payment, 
          loan tenure, and interest rate to get instant results in seconds.
        </p>
      
        <p>
          Many users describe it as the <strong>best Home Loan Calculator</strong> online 
          because it combines simplicity with depth. The <strong>Home Loan Calculator website</strong> 
          is mobile-friendly, intuitive, and completely free—ideal for beginners 
          looking to learn <strong>how to use Home Loan Calculator</strong> and for 
          professionals who want a reliable tool for client presentations. 
          It’s more than a simple calculator; it’s a complete 
          <strong> solution Home Loan Calculator</strong> for budgeting and planning.
        </p>
      
        <figure className="my-8">
          <img
            src="/images/home-loan-calculator.webp"
            alt="Home Loan Calculator interface and EMI breakdown"
            title="Home Loan Calculator 2025 | CalculatorHub"
            className="rounded-lg shadow-md border border-slate-700 mx-auto"
            loading="lazy"
          />
          <figcaption className="text-center text-sm text-slate-400 mt-2">
            Visualization of the Home Loan Calculator UI and EMI results.
          </figcaption>
        </figure>
      
        <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
          🏠 What is Home Loan Calculator?
        </h2>
        <p>
          If you’re wondering <strong>what is Home Loan Calculator</strong>, it’s a 
          simple yet <strong>powerful Home Loan Calculator</strong> that helps you 
          estimate the EMI (Equated Monthly Installment) you’ll pay on a property loan. 
          In basic terms, <strong>Home Loan Calculator explained</strong>—it uses your 
          principal, interest rate, and loan term to show how much you’ll pay monthly 
          and how much goes toward interest versus principal. 
          It’s a <strong>professional Home Loan Calculator</strong> trusted by 
          thousands of users worldwide.
        </p>
      
        <p>
          The <strong>Home Loan Calculator for beginners</strong> simplifies complex 
          math into quick, easy-to-understand results, while the 
          <strong>premium Home Loan Calculator</strong> version includes graphs, 
          amortization schedules, and export options. Together, these make 
          CalculatorHub’s version a <strong>platform Home Loan Calculator</strong> 
          that fits everyone—from small business owners buying office space to 
          families purchasing their first home.
        </p>
      
        <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
          🧭 How to Use Home Loan Calculator (Step-by-Step Tutorial)
        </h2>
        <p>
          This section serves as a complete <strong>Home Loan Calculator tutorial</strong> 
          and shows <strong>how to use Home Loan Calculator</strong> efficiently:
        </p>
        <ol className="list-decimal list-inside space-y-2">
          <li>Enter the total <strong>home price</strong> or loan amount.</li>
          <li>Add your <strong>down payment</strong> to reduce the loan balance.</li>
          <li>Type in the <strong>interest rate</strong> offered by your lender.</li>
          <li>Select the <strong>loan tenure</strong> in years or months.</li>
          <li>Click “Calculate” to get EMI, total interest, and overall repayment instantly.</li>
        </ol>
      
        <p>
          This easy flow makes it an <strong>easy Home Loan Calculator</strong> and 
          a <strong>simple Home Loan Calculator</strong> for first-time buyers. 
          Yet, it still doubles as an <strong>advanced Home Loan Calculator</strong> 
          when users tweak interest rates or compare loan durations. 
          The dual design ensures a smooth experience for both casual users and 
          finance professionals.
        </p>
      
        <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
          🧮 Home Loan EMI Formula
        </h2>
        <p className="font-mono text-center text-indigo-300">
          EMI = [P × r × (1 + r)ⁿ] ÷ [(1 + r)ⁿ − 1]
        </p>
        <p className="text-center text-slate-400 mt-2">
          Where: P = Principal, r = Monthly Interest Rate, n = Tenure in Months
        </p>
      
        <p>
          This mathematical formula powers every <strong>professional Home Loan Calculator</strong>, 
          ensuring that your EMI results are accurate and transparent. 
          It is the foundation of the <strong>solution Home Loan Calculator</strong> 
          approach used by banks, brokers, and top lending institutions.
        </p>
       <HomeLoanExplainBlock
            homePrice={homePrice}
            downPayment={downPayment}
            loanYears={loanYears}
            loanMonths={loanMonths}
            interestRate={interestRate}
            emi={emi}
            totalPayment={totalPayment}
            totalInterest={totalInterest}
            currency={currency}
            currentLocale={currentLocale}
            formatCurrency={formatCurrency}
          />
      
        <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
          📘 Example Calculation
        </h2>
        <p>
          Suppose you buy a house worth <strong>$400,000</strong> with a 
          <strong>$80,000</strong> down payment at a <strong>7%</strong> annual interest 
          rate for <strong>20 years</strong>. Using this <strong>free Home Loan Calculator</strong>, 
          your EMI comes to approximately <strong>$2,482</strong> per month. 
          The total payment is around <strong>$595,680</strong>, and the total 
          interest payable is <strong>$275,680</strong>. 
          The clarity and precision make it the <strong>best Home Loan Calculator</strong> 
          for planning realistic budgets and comparing lenders.
        </p>
      
        <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
          💡 Home Loan Calculator Benefits
        </h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Instant EMI and interest results with easy-to-read visuals.</li>
          <li>Acts as a <strong>simple Home Loan Calculator</strong> for beginners 
              and a <strong>powerful Home Loan Calculator</strong> for experts.</li>
          <li>Completely <strong>free Home Loan Calculator</strong> with no sign-up required.</li>
          <li>Works on any device as a responsive <strong>Home Loan Calculator website</strong>.</li>
          <li>Professional-grade accuracy trusted by finance advisors.</li>
          <li>Helps compare multiple loan options in seconds.</li>
          <li>Functions as a <strong>service Home Loan Calculator</strong> 
              integrated with other finance tools.</li>
        </ul>
       <AdBanner type="bottom" />
      
        <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
          🏢 Small Business & Professional Use
        </h2>
        <p>
          A <strong>small business Home Loan Calculator</strong> is ideal for 
          entrepreneurs buying commercial property or mixed-use buildings. 
          The <strong>professional Home Loan Calculator</strong> from CalculatorHub 
          provides downloadable summaries that accountants or advisors can use 
          to plan repayments. This makes it a true <strong>platform Home Loan Calculator</strong> 
          solution that connects personal and business finance under one dashboard.
        </p>
      
        <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
          💰 Home Loan Calculator Price – Free vs Premium
        </h2>
        <p>
          The <strong>Home Loan Calculator price</strong> is a pleasant surprise—it's 
          completely free. The <strong>free Home Loan Calculator</strong> includes 
          all essential features like instant EMI results, interest breakdowns, 
          and comparison options. For users who want deeper insights, 
          a <strong>premium Home Loan Calculator</strong> plan adds downloadable 
          reports, data export, and smart forecasting. Whether free or premium, 
          it’s the <strong>best Home Loan Calculator</strong> for financial clarity.
        </p>
      
        <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
          💡 Tips to Save on Home Loan
        </h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Make a higher down payment to lower total interest.</li>
          <li>Choose shorter loan terms for faster repayment.</li>
          <li>Use this <strong>advanced Home Loan Calculator</strong> 
              to compare different rates before applying.</li>
          <li>Make prepayments whenever possible to save money.</li>
          <li>Track interest changes with the <strong>service Home Loan Calculator</strong> updates.</li>
        </ul>
      
        {/* ===== FAQ Section ===== */}
        <section id="faq" className="space-y-6 mt-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
            ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
          </h2>
      
          <div className="space-y-5 text-lg text-slate-100 leading-relaxed">
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
              <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                Q1: What is Home Loan Calculator and how does it work?
              </h3>
              <p>
                It’s a <strong>solution Home Loan Calculator</strong> that calculates EMI, total payment, 
                and interest using your loan details. This <strong>easy Home Loan Calculator</strong> 
                is perfect for estimating costs before approaching a bank.
              </p>
            </div>
      
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
              <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                Q2: Is the CalculatorHub Home Loan Calculator free?
              </h3>
              <p>
                Yes, it’s a completely <strong>free Home Loan Calculator</strong> available online. 
                Advanced users can try the <strong>premium Home Loan Calculator</strong> 
                version for detailed analytics.
              </p>
            </div>
      
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
              <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                Q3: Can I use this tool for business loans or rentals?
              </h3>
              <p>
                Absolutely. The <strong>small business Home Loan Calculator</strong> 
                helps plan commercial or rental property financing with the same 
                precision as personal mortgages.
              </p>
            </div>
          </div>
        </section>
      </section>
      
      {/* ===== Footer & Related Tools ===== */}
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
              <Link to="/mortgage-calculator" className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200">
                <span className="text-indigo-400">🏠</span> Mortgage Calculator
              </Link>
              <Link to="/loan-emi-calculator" className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200">
                <span className="text-emerald-400">💳</span> Loan EMI Calculator
              </Link>
              <Link to="/loan-comparison-calculator" className="flex items-center gap-2 bg-[#0f172a] hover:bg-fuchsia-600/20 text-fuchsia-300 hover:text-fuchsia-400 px-3 py-2 rounded-md border border-slate-700 hover:border-fuchsia-500 transition-all duration-200">
                <span className="text-fuchsia-400">🔁</span> Loan Comparison Calculator
              </Link>
            </div>
          </div>
        </section>



        <AdBanner type="bottom" />
        <RelatedCalculators
          currentPath="/home-loan-calculator"
          category="currency-finance"
        />
      </div>
    </>
  );
};

export default HomeLoanCalculator;

