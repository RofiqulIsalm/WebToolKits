// ================= SavingsGoalCalculator.tsx (Part 1/2) =================
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
const LS_KEY = "savings_goal_calculator_v1";

const currencyOptions = [
  { code: "USD", symbol: "$", locale: "en-US", label: "US Dollar ($)" },
  { code: "EUR", symbol: "€", locale: "de-DE", label: "Euro (€)" },
  { code: "INR", symbol: "₹", locale: "en-IN", label: "Indian Rupee (₹)" },
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
   💰 COMPONENT: SavingsGoalCalculator
   ============================================================ */
const SavingsGoalCalculator: React.FC = () => {
  // Inputs
  const [goalAmount, setGoalAmount] = useState<number>(0);
  const [currentSavings, setCurrentSavings] = useState<number>(0);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(0);
  const [annualRate, setAnnualRate] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("USD");

  // Outputs
  const [monthsToGoal, setMonthsToGoal] = useState<number>(0);
  const [totalContributed, setTotalContributed] = useState<number>(0);
  const [totalGrowth, setTotalGrowth] = useState<number>(0);
  const [totalValue, setTotalValue] = useState<number>(0);

  // UI state
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [hydrated, setHydrated] = useState(false);
  const [showInfoRate, setShowInfoRate] = useState(false);
  const [showInfoContribution, setShowInfoContribution] = useState(false);

  const currentLocale = findLocale(currency);
  const isDefault =
    !goalAmount && !currentSavings && !monthlyContribution && !annualRate;


  // —— helpers for display ——
  const fmt = (n: number) => formatCurrency(isFinite(n) ? n : 0, currentLocale, currency);
  const pct = (r: number) => `${(r * 100).toFixed(3)}%`;
  const ym = (m: number) => (m > 0 ? `${Math.floor(m / 12)}y ${m % 12}m` : "—");
  
  // —— derived for "how it's calculated" preview ——
  const r_m = Math.max(0, annualRate) / 12 / 100; // monthly growth rate
  const firstGrowth = currentSavings * r_m;        // interest/growth in month 1 (on currentSavings)
  const b1 = currentSavings * (1 + r_m) + monthlyContribution; // balance after first month
  const feasible = goalAmount > 0 && monthlyContribution > 0;  // matches your current logic


  /* ============================================================
     🔁 STATE PERSISTENCE
     ============================================================ */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setGoalAmount(s.goalAmount || 0);
        setCurrentSavings(s.currentSavings || 0);
        setMonthlyContribution(s.monthlyContribution || 0);
        setAnnualRate(s.annualRate || 0);
        setCurrency(s.currency || "USD");
      }
    } catch (err) {
      console.warn("⚠️ Failed to load savings goal state", err);
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
          goalAmount,
          currentSavings,
          monthlyContribution,
          annualRate,
          currency,
        })
      );
    } catch (err) {
      console.warn("⚠️ Failed to save savings goal state", err);
    }
  }, [hydrated, goalAmount, currentSavings, monthlyContribution, annualRate, currency]);

  /* ============================================================
     📈 CALCULATIONS
     ============================================================ */
  useEffect(() => {
    if (
      goalAmount <= 0 ||
      monthlyContribution <= 0 ||
      annualRate < 0 ||
      currentSavings < 0
    ) {
      setMonthsToGoal(0);
      setTotalContributed(0);
      setTotalGrowth(0);
      setTotalValue(0);
      return;
    }

    let months = 0;
    let balance = currentSavings;
    const monthlyRate = annualRate / 12 / 100;

    // simulate monthly compounding
    while (balance < goalAmount && months < 1000 * 12) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
      months++;
    }

    const contributed = currentSavings + monthlyContribution * months;
    const growth = balance - contributed;

    setMonthsToGoal(months);
    setTotalContributed(contributed);
    setTotalGrowth(growth);
    setTotalValue(balance);
  }, [goalAmount, currentSavings, monthlyContribution, annualRate]);

  /* ============================================================
     🔗 SHARE / COPY / RESET
     ============================================================ */
  const reset = () => {
    setGoalAmount(0);
    setCurrentSavings(0);
    setMonthlyContribution(0);
    setAnnualRate(0);
    setCurrency("USD");
    localStorage.removeItem(LS_KEY);
  };

  const copyResults = async () => {
    const text = [
      "Savings Goal Summary",
      `Goal Amount: ${formatCurrency(goalAmount, currentLocale, currency)}`,
      `Current Savings: ${formatCurrency(currentSavings, currentLocale, currency)}`,
      `Monthly Contribution: ${formatCurrency(monthlyContribution, currentLocale, currency)}`,
      `Annual Growth Rate: ${annualRate}%`,
      `Time to Goal: ${
        monthsToGoal > 0 ? (monthsToGoal / 12).toFixed(1) + " years" : "N/A"
      }`,
      `Total Value: ${formatCurrency(totalValue, currentLocale, currency)}`,
      `Growth Earned: ${formatCurrency(totalGrowth, currentLocale, currency)}`,
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const state = {
      goalAmount,
      currentSavings,
      monthlyContribution,
      annualRate,
      currency,
    };
    const encoded = btoa(JSON.stringify(state));
    const url = new URL(window.location.href);
    url.searchParams.set("sg", encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  /* ============================================================
     🎨 RENDER
     ============================================================ */
  return (
    <>
      {/** ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Savings Goal Calculator — Time to Goal, Compound Growth & Final Value"
        description="Use our free Savings Goal Calculator to estimate time to reach your target, total contributions, compound growth, and final value. Perfect for budgeting and long-term planning."
        keywords={[
          "savings goal calculator",
          "time to savings goal",
          "compound interest savings",
          "monthly contribution calculator",
          "future value calculator",
          "goal planner",
          "investment growth calculator",
          "savings target calculator",
          "budget planning tool",
          "financial goal tracker"
        ]}
        canonical="https://calculatorhub.site/savings-goal-calculator"
        schemaData={[
          // 1) WebPage + Article
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://calculatorhub.site/savings-goal-calculator#webpage",
            "url": "https://calculatorhub.site/savings-goal-calculator",
            "name": "Savings Goal Calculator (2025–2026) — Time to Goal, Contributions & Growth",
            "inLanguage": "en",
            "isPartOf": { "@id": "https://calculatorhub.site/#website" },
            "primaryImageOfPage": {
              "@type": "ImageObject",
              "@id": "https://calculatorhub.site/images/savings-goal-calculator-hero.webp#primaryimg",
              "url": "https://calculatorhub.site/images/savings-goal-calculator-hero.webp",
              "width": 1200,
              "height": 675
            },
            "mainEntity": {
              "@type": "Article",
              "@id": "https://calculatorhub.site/savings-goal-calculator#article",
              "headline": "Savings Goal Calculator — Plan Contributions, Compound Growth & Time to Goal",
              "description": "Forecast time to reach your savings target with monthly contributions and compound growth. Includes charts, tips, and example scenarios.",
              "image": [
                "https://calculatorhub.site/images/savings-goal-calculator-hero.webp"
              ],
              "author": { "@type": "Organization", "name": "CalculatorHub", "url": "https://calculatorhub.site" },
              "publisher": { "@id": "https://calculatorhub.site/#organization" },
              "datePublished": "2025-10-17",
              "dateModified": "2025-11-06",
              "mainEntityOfPage": { "@id": "https://calculatorhub.site/savings-goal-calculator#webpage" },
              "articleSection": [
                "What is a Savings Goal Calculator",
                "How to Use",
                "Benefits",
                "Example Calculation",
                "How It Works",
                "Simple vs Premium vs Advanced",
                "Cost & Deals",
                "Smart Tips",
                "FAQ"
              ]
            }
          },
      
          // 2) Breadcrumbs
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "@id": "https://calculatorhub.site/savings-goal-calculator#breadcrumbs",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://calculatorhub.site/" },
              { "@type": "ListItem", "position": 2, "name": "Currency & Finance", "item": "https://calculatorhub.site/category/currency-finance" },
              { "@type": "ListItem", "position": 3, "name": "Savings Goal Calculator", "item": "https://calculatorhub.site/savings-goal-calculator" }
            ]
          },
      
          // 3) FAQ
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://calculatorhub.site/savings-goal-calculator#faq",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What rate should I use?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Use your account’s APY or an average long-term investment return. This calculator compounds monthly."
                }
              },
              {
                "@type": "Question",
                "name": "Can I include one-time deposits?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Add them into current savings or use a premium version that supports lump-sum inputs."
                }
              },
              {
                "@type": "Question",
                "name": "What if I already hit my goal?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "If your balance equals or exceeds your goal, the time-to-goal will be zero—congratulations!"
                }
              }
            ]
          },
      
          // 4) WebApplication
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://calculatorhub.site/savings-goal-calculator#webapp",
            "name": "Savings Goal Calculator",
            "url": "https://calculatorhub.site/savings-goal-calculator",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "Web",
            "description": "Estimate time to reach a savings target with monthly contributions and compound growth. Visual breakdown of contributions vs growth.",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "image": [
              "https://calculatorhub.site/images/savings-goal-calculator-hero.webp"
            ]
          },
      
          // 5) SoftwareApplication (optional)
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://calculatorhub.site/savings-goal-calculator#software",
            "name": "Savings Goal Calculator",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "All",
            "url": "https://calculatorhub.site/savings-goal-calculator",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "description": "Interactive savings planner with monthly compounding, charts, and shareable results."
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
      <link rel="canonical" href="https://calculatorhub.site/savings-goal-calculator" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/savings-goal-calculator" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/savings-goal-calculator" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/savings-goal-calculator" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Savings Goal Calculator (2025–2026) — Time to Goal, Contributions & Growth" />
      <meta property="og:description" content="Free Savings Goal Calculator to project time to goal, total contributions, compound growth, and final value." />
      <meta property="og:url" content="https://calculatorhub.site/savings-goal-calculator" />
      <meta property="og:image" content="https://calculatorhub.site/images/savings-goal-calculator-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Savings Goal Calculator dashboard showing contributions vs growth breakdown" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Savings Goal Calculator — Time to Goal, Compound Growth & Final Value" />
      <meta name="twitter:description" content="Plan your savings with monthly contributions and compound growth. See time to goal and final value instantly." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/savings-goal-calculator-hero.webp" />
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
      <link rel="preload" as="image" href="/images/savings-goal-calculator-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />

      


      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "Savings Goal Calculator", url: "/savings-goal-calculator" },
          ]}
        />

        {/* ===== Header ===== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            💰 Savings Goal Calculator
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Plan your savings journey. Calculate how long it takes to reach your goal based
            on contributions, current balance, and annual growth rate.
          </p>
        </div>

        {/* ===== Input + Output Grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-emerald-400" /> Savings Inputs
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

              {/* Goal Amount */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">
                  Target Goal Amount ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={goalAmount || ""}
                  onChange={(e) => setGoalAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your target amount"
                />
              </div>

              {/* Current Savings */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">
                  Current Savings ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={currentSavings || ""}
                  onChange={(e) =>
                    setCurrentSavings(parseFloat(e.target.value) || 0)
                  }
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter current savings"
                />
              </div>

              {/* Monthly Contribution */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Monthly Contribution ({findSymbol(currency)})
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoContribution(!showInfoContribution)}
                  />
                </label>
                {showInfoContribution && (
                  <p className="text-xs bg-[#0f172a] p-2 rounded-md border border-[#334155] mt-1">
                    The amount you plan to add to your savings each month.
                  </p>
                )}
                <input
                  type="number"
                  min={0}
                  value={monthlyContribution || ""}
                  onChange={(e) =>
                    setMonthlyContribution(parseFloat(e.target.value) || 0)
                  }
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter monthly contribution"
                />
              </div>

              {/* Annual Growth Rate */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Annual Growth Rate (%)
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoRate(!showInfoRate)}
                  />
                </label>
                {showInfoRate && (
                  <p className="text-xs bg-[#0f172a] p-2 rounded-md border border-[#334155] mt-1">
                    The expected annual return or interest rate on your savings or investment.
                  </p>
                )}
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={annualRate || ""}
                  onChange={(e) => setAnnualRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter annual interest rate"
                />
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">Savings Summary</h2>

            <div className="space-y-6">
              {monthsToGoal > 0 ? (
                <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                  <div className="text-3xl font-bold text-white">
                    {(monthsToGoal / 12).toFixed(1)} years
                  </div>
                  <div className="text-sm text-slate-400">
                    Time to Reach Your Goal
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155] text-rose-400 font-semibold">
                  Please enter valid savings and goal details.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(totalGrowth, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Total Growth</div>
                </div>
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(totalValue, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Final Value</div>
                </div>
              </div>

              {/* Buttons */}
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
        {goalAmount > 0 && monthsToGoal > 0 && (
          <div className="mt-6 bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              Savings Goal Breakdown
            </h3>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Pie Chart */}
              <div className="w-[90%] sm:w-[70%] md:w-[50%] max-w-[360px] h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Your Contributions", value: totalContributed },
                        { name: "Growth / Interest", value: totalGrowth },
                      ]}
                      dataKey="value"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#8b5cf6" />
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

              {/* Summary Right */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-emerald-500 transition">
                  <p className="text-sm text-slate-400">Total Contributions</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(totalContributed, currentLocale, currency)}
                  </p>
                </div>
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-fuchsia-500 transition">
                  <p className="text-sm text-slate-400">Total Growth</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(totalGrowth, currentLocale, currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Smart Tip Box ===== */}
        {(goalAmount > 0 && monthsToGoal > 0) && (
          <div className="mt-5 bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm">
            <p className="text-base font-medium leading-snug text-slate-300">
              💡 Tip: Increasing your monthly contribution by even{" "}
              <span className="text-emerald-400 font-semibold">
                {formatCurrency(25, currentLocale, currency)}–{formatCurrency(50, currentLocale, currency)}
              </span>{" "}
              can shave months off your goal — compounding loves consistency.
            </p>
          </div>
        )}

        {/* ===== SEO Content Section ===== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          <h1 className="text-3xl font-bold text-cyan-400 mb-6">
            Savings Goal Calculator 2025 – Plan, Track, and Reach Your Target
          </h1>
        
          <p>
            The <strong>Savings Goal Calculator by CalculatorHub</strong> helps users forecast how
            long it will take to reach their target with monthly contributions and compound growth.
            Enter your goal, current savings, monthly deposits, and expected annual rate to get an
            instant, visual plan.
          </p>
        
          <figure className="my-8">
            <img
              src="/images/savings-goal-calculator-hero.webp"
              alt="Savings goal calculator dashboard with contributions vs growth chart"
              title="Savings Goal Calculator 2025 | Compound Growth Planner"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Visualization of the Savings Goal Calculator dark-finance UI.
            </figcaption>
          </figure>
        
          {/* ========== What & Why ========== */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🔎 What is a Savings Goal Calculator?
          </h2>
          <p>
            A <strong>Savings Goal Calculator</strong> is a tool that projects how long it takes to
            achieve a financial target. It calculates growth using monthly contributions and compound
            interest, showing how savings accumulate over time. This <strong>simple Savings Goal Calculator</strong> is ideal
            for both beginners and advanced planners who want a visual roadmap to success.
          </p>
        
          {/* ========== How to Use ========== */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ⚙️ How to Use Savings Goal Calculator (Step-by-Step)
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter your <strong>goal amount</strong>.</li>
            <li>Input your <strong>current savings</strong>.</li>
            <li>Set your <strong>monthly contribution</strong>.</li>
            <li>Choose an <strong>annual growth rate</strong>.</li>
            <li>View your <strong>time to goal</strong>, <strong>final value</strong>, and <strong>total growth</strong>.</li>
          </ol>
          <p>
            It’s a <strong>free Savings Goal Calculator online</strong> that instantly estimates your financial journey.
            Use it to plan budgets, emergency funds, or investment milestones.
          </p>

          {/* ===== How It's Calculated (Step-by-Step) ===== */}
          <section id="how-calculated" className="mt-8 text-slate-200">
            <h2 className="mb-4 text-2xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
                🧮 How Your Savings Timeline Is Calculated (Step-by-Step)
              </span>
            </h2>
          
            <p className="text-sm text-slate-300 mb-4">
              We simulate your balance month by month. Each month the current balance grows by the monthly rate,
              then your planned contribution is added. We repeat until the balance reaches your goal.
            </p>
          
            {/* Inputs strip */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-3">
              <div className="flex items-center justify-between gap-2 rounded-lg border border-cyan-500/20 bg-[#0f172a] px-3 py-2">
                <span className="font-semibold text-cyan-300">Goal</span>
                <span className="text-slate-300">Target Amount</span>
                <span className="font-semibold text-white truncate">{fmt(goalAmount)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg border border-cyan-500/20 bg-[#0f172a] px-3 py-2">
                <span className="font-semibold text-cyan-300">B₀</span>
                <span className="text-slate-300">Current Savings</span>
                <span className="font-semibold text-white truncate">{fmt(currentSavings)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg border border-cyan-500/20 bg-[#0f172a] px-3 py-2">
                <span className="font-semibold text-cyan-300">p</span>
                <span className="text-slate-300">Monthly Contribution</span>
                <span className="font-semibold text-white truncate">{fmt(monthlyContribution)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg border border-cyan-500/20 bg-[#0f172a] px-3 py-2">
                <span className="font-semibold text-cyan-300">rₘ</span>
                <span className="text-slate-300">Monthly Rate</span>
                <span className="font-semibold text-white truncate">{pct(r_m)}</span>
              </div>
            </div>
          
            {/* Formula headline */}
            <p className="font-mono text-[15px] leading-7 text-indigo-300 mb-3">
              rₘ = APY ÷ 12 ÷ 100 &nbsp;&nbsp;|&nbsp;&nbsp;
              growthₘ = B<sub>m−1</sub> × rₘ &nbsp;&nbsp;|&nbsp;&nbsp;
              B<sub>m</sub> = B<sub>m−1</sub> × (1 + rₘ) + p
            </p>
          
            {/* Step boxes */}
            <div className="space-y-4">
              {/* 1) Monthly Rate */}
              <div>
                <h3 className="text-lg font-semibold text-indigo-300">1) Monthly Growth Rate</h3>
                <div className="rounded-lg border border-[#334155] bg-[#0f172a] p-3 font-mono text-[13px] text-slate-200 overflow-x-auto">
          {`r_m = APY / 12 / 100
          APY = ${annualRate || 0}%
          r_m = ${pct(r_m)}`}
                </div>
              </div>
          
              {/* 2) Feasibility Check (aligned with current logic) */}
              <div>
                <h3 className="text-lg font-semibold text-indigo-300">2) Feasibility (Need a monthly contribution)</h3>
                <div className="rounded-lg border border-[#334155] bg-[#0f172a] p-3 font-mono text-[13px] text-slate-200 overflow-x-auto">
          {`Condition: goal > 0 and monthly_contribution > 0
          goal = ${fmt(goalAmount)}
          monthly_contribution = ${fmt(monthlyContribution)}
          Result: ${feasible ? "OK ✅ (simulation runs)" : "Not OK ❌ (add a monthly contribution)"}`}
                </div>
                {!feasible && (
                  <p className="mt-2 text-xs text-slate-400">
                    Note: This version models monthly contributions. If you want a “no-contribution, pure-compound to goal”
                    mode, enable that in an advanced version.
                  </p>
                )}
              </div>
          
              {/* 3) First Month Preview */}
              <div>
                <h3 className="text-lg font-semibold text-indigo-300">3) First Month Math</h3>
                <div className="rounded-lg border border-[#334155] bg-[#0f172a] p-3 font-mono text-[13px] text-slate-200 overflow-x-auto">
          {`growth1 = B0 × r_m
          growth1 = ${fmt(currentSavings)} × ${pct(r_m)}
          growth1 = ${fmt(firstGrowth)}
          
          B1 = B0 × (1 + r_m) + p
          B1 = ${fmt(currentSavings)} × (1 + ${pct(r_m)}) + ${fmt(monthlyContribution)}
          B1 = ${fmt(b1)}`}
                </div>
              </div>
          
              {/* 4) General Recurrence */}
              <div>
                <h3 className="text-lg font-semibold text-indigo-300">4) General Recurrence (each month m)</h3>
                <div className="rounded-lg border border-[#334155] bg-[#0f172a] p-3 font-mono text-[13px] text-slate-200 overflow-x-auto">
          {`growth_m = B_{m−1} × r_m
          B_m      = B_{m−1} × (1 + r_m) + p
          
          Stop when B_m ≥ Goal → months_to_goal = m`}
                </div>
              </div>
          
              {/* 5) Totals */}
              <div>
                <h3 className="text-lg font-semibold text-indigo-300">5) Totals</h3>
                <div className="rounded-lg border border-[#334155] bg-[#0f172a] p-3 font-mono text-[13px] text-slate-200 overflow-x-auto">
          {`Months to Goal  = ${monthsToGoal > 0 ? `${monthsToGoal} (${ym(monthsToGoal)})` : "—"}
          Total Value      = ${fmt(totalValue)}
          Total Growth     = ${fmt(totalGrowth)}
          Total Contributed= ${fmt(totalContributed)}`}
                </div>
              </div>
            </div>
          
            {/* Copy-friendly math tape */}
            <div className="mt-5 rounded-xl border border-slate-700 bg-[#0f172a] p-3 font-mono text-[13px] text-slate-200 overflow-x-auto whitespace-pre">
          {`// Savings Goal Math Tape
          Goal      = ${fmt(goalAmount)}
          B0        = ${fmt(currentSavings)}
          APY       = ${annualRate || 0}%
          r_m       = ${pct(r_m)}
          p         = ${fmt(monthlyContribution)}
          growth1   = B0 × r_m = ${fmt(firstGrowth)}
          B1        = B0 × (1 + r_m) + p = ${fmt(b1)}
          Months    = ${monthsToGoal > 0 ? `${monthsToGoal} (${ym(monthsToGoal)})` : "—"}
          Contrib   = ${fmt(totalContributed)}
          Growth    = ${fmt(totalGrowth)}
          Final     = ${fmt(totalValue)}`}
            </div>
          
            <p className="mt-3 text-xs text-slate-400">
              Assumptions: fixed APY, monthly compounding, and no withdrawals. This version requires a positive monthly
              contribution for the timeline. For variable rates, lump sums, or contribution escalators, use the advanced mode.
            </p>
          </section>

        
          {/* ========== Benefits ========== */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            💡 Savings Goal Calculator Benefits
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Provides clear timelines and visual breakdowns of savings vs. growth.</li>
            <li>Encourages disciplined, goal-based financial planning.</li>
            <li>Shows how contribution increases shorten your goal timeline.</li>
            <li>Offers a practical <strong>solution Savings Goal Calculator</strong> for everyone—from students to professionals.</li>
          </ul>
        
          {/* ========== Example ========== */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📘 Example Calculation
          </h2>
          <p>
            Start with <strong>$2,000</strong> saved, add <strong>$300/month</strong>, and assume a
            <strong> 6%</strong> annual return compounded monthly. You’ll reach <strong>$10,000</strong> in roughly
            <strong> 2.2 years</strong>. Total contributions ≈ <strong>$8,000</strong>; compound growth covers the rest.
          </p>
        
          {/* ========== How It Works ========== */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧮 Savings Goal Calculator Explained
          </h2>
          <p>
            The formula behind this <strong>advanced Savings Goal Calculator</strong> simulates monthly
            compounding:
          </p>
          <p className="font-mono text-center text-indigo-300">
            Balance<sub>t+1</sub> = Balance<sub>t</sub> × (1 + r/12) + Monthly Contribution
          </p>
          <p>
            It repeats until your balance reaches the target amount. Adjusting your inputs lets you
            compare outcomes—making it perfect for <strong>Savings Goal Calculator comparison</strong> studies.
          </p>
        
          {/* ========== Simple vs Premium ========== */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            💼 Simple, Premium & Advanced Options
          </h2>
          <p>
            - The <strong>simple Savings Goal Calculator</strong> is quick and intuitive.  
            - The <strong>premium Savings Goal Calculator</strong> offers reports, saved goals, and export options.  
            - The <strong>advanced Savings Goal Calculator</strong> includes detailed analytics and compound customization.
          </p>
          <p>
            Whether free or premium, it’s an easy, accurate, and practical way to plan your future.
          </p>
        
          {/* ========== Cost & Deals ========== */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            💰 Savings Goal Calculator Cost & Deals
          </h2>
          <p>
            Most online tools are <strong>free</strong>, but some premium versions come with small subscription
            fees or app bundles. Look out for a good <strong>Savings Goal Calculator deal</strong> when paired with
            other finance tools like loan or EMI planners.
          </p>
        
          {/* ========== Tips ========== */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧠 Smart Tips for Reaching Goals Faster
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Automate deposits—consistency maximizes compound growth.</li>
            <li>Increase contributions by $25–$50 for faster progress.</li>
            <li>Review rates yearly and stay realistic with growth assumptions.</li>
          </ul>
        
          {/* ===== FAQ Section ===== */}
          <section id="faq" className="space-y-6 mt-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>
        
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q1: What rate should I use?</h3>
                <p>
                  Use your savings account’s APY or an average long-term investment return. The calculator
                  compounds monthly for realistic growth.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q2: Can I include one-time deposits?</h3>
                <p>
                  You can add them to current savings or use a premium version that supports lump-sum inputs.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q3: What if I already hit my goal?</h3>
                <p>
                  If your balance equals or exceeds your goal, the time-to-goal shows zero—congratulations!
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
                <Link to="/sip-calculator" className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200">
                  <span className="text-emerald-400">📈</span> SIP Calculator
                </Link>
                <Link to="/compound-interest-calculator" className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200">
                  <span className="text-indigo-400">💹</span> Compound Interest Calculator
                </Link>
                <Link to="/fd-calculator" className="flex items-center gap-2 bg-[#0f172a] hover:bg-cyan-600/20 text-cyan-300 hover:text-cyan-400 px-3 py-2 rounded-md border border-slate-700 hover:border-cyan-500 transition-all duration-200">
                  <span className="text-cyan-400">🏦</span> FD Calculator
                </Link>
              </div>
            </div>
          </section>



        <AdBanner type="bottom" />
        <RelatedCalculators
          currentPath="/savings-goal-calculator"
          category="currency-finance"
        />
      </div>
    </>
  );
};

export default SavingsGoalCalculator;
