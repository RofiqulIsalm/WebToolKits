// ================= PersonalLoanCalculator.tsx =================
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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
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
const LS_KEY = "personal_loan_calc_v1";

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
    maximumFractionDigits: 0,
  }).format(isFinite(num) ? num : 0);

/* ============================================================
   💳 COMPONENT
   ============================================================ */
const PersonalLoanCalculator: React.FC = () => {
  // Inputs
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(0);
  const [loanYears, setLoanYears] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("USD");

  // Outputs
  const [emi, setEmi] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);

  // UI
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [hydrated, setHydrated] = useState(false);
  const [showInfoAmount, setShowInfoAmount] = useState(false);
  const [showInfoInterest, setShowInfoInterest] = useState(false);
  const [showInfoTerm, setShowInfoTerm] = useState(false);

  const currentLocale = findLocale(currency);
  const isDefault = !loanAmount && !interestRate && !loanYears;

  /* ============================================================
     🔁 PERSISTENCE
     ============================================================ */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setLoanAmount(s.loanAmount || 0);
        setInterestRate(s.interestRate || 0);
        setLoanYears(s.loanYears || 0);
        setCurrency(s.currency || "USD");
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
        JSON.stringify({
          loanAmount,
          interestRate,
          loanYears,
          currency,
        })
      );
    } catch {
      console.warn("⚠️ Could not save state");
    }
  }, [hydrated, loanAmount, interestRate, loanYears, currency]);

  /* ============================================================
     🧮 CALCULATION
     ============================================================ */
  useEffect(() => {
    if (loanAmount <= 0 || loanYears <= 0) {
      setEmi(0);
      setTotalPayment(0);
      setTotalInterest(0);
      return;
    }

    const totalMonths = loanYears * 12;
    const monthlyRate = interestRate / 12 / 100;

    if (monthlyRate === 0) {
      const emiValue = loanAmount / totalMonths;
      setEmi(emiValue);
      setTotalPayment(loanAmount);
      setTotalInterest(0);
      return;
    }

    const pow = Math.pow(1 + monthlyRate, totalMonths);
    const emiValue = (loanAmount * monthlyRate * pow) / (pow - 1);
    const payment = emiValue * totalMonths;
    const interest = payment - loanAmount;

    setEmi(emiValue);
    setTotalPayment(payment);
    setTotalInterest(interest);
  }, [loanAmount, interestRate, loanYears]);

  /* ============================================================
     🔗 COPY / SHARE / RESET
     ============================================================ */
  const reset = () => {
    setLoanAmount(0);
    setInterestRate(0);
    setLoanYears(0);
    setCurrency("USD");
    localStorage.removeItem(LS_KEY);
  };

  const copyResults = async () => {
    const text = [
      "Personal Loan EMI Summary",
      `Loan Amount: ${formatCurrency(loanAmount, currentLocale, currency)}`,
      `Interest Rate: ${interestRate}%`,
      `Tenure: ${loanYears} years`,
      `Monthly EMI: ${formatCurrency(emi, currentLocale, currency)}`,
      `Total Payment: ${formatCurrency(totalPayment, currentLocale, currency)}`,
      `Total Interest: ${formatCurrency(totalInterest, currentLocale, currency)}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const state = {
      loanAmount,
      interestRate,
      loanYears,
      currency,
    };
    const encoded = btoa(JSON.stringify(state));
    const url = new URL(window.location.href);
    url.searchParams.set("plc", encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  const chartData =
    loanAmount > 0 && totalInterest > 0
      ? [
          { name: "Principal", value: loanAmount },
          { name: "Interest", value: totalInterest },
        ]
      : [];

  /* ============================================================
     🎨 RENDER
     ============================================================ */
  return (
    <>
      {/** ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Personal Loan EMI Calculator – Monthly Payment & Total Interest (2025–2026)"
        description="Free Personal Loan EMI Calculator to estimate your monthly payment, total interest, and total cost. Adjust loan amount, interest rate, and tenure to plan smarter borrowing."
        keywords={[
          "personal loan EMI calculator",
          "personal loan calculator",
          "monthly installment calculator",
          "personal loan payment calculator",
          "loan EMI calculator",
          "interest calculator personal loan",
          "personal loan planning tool",
          "online EMI calculator",
        ]}
        canonical="https://calculatorhub.site/personal-loan-calculator"
        schemaData={[
          // 1) WebPage + nested Article
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id":
              "https://calculatorhub.site/personal-loan-calculator#webpage",
            url: "https://calculatorhub.site/personal-loan-calculator",
            name: "Personal Loan EMI Calculator – Monthly Installment & Total Cost",
            inLanguage: "en",
            isPartOf: { "@id": "https://calculatorhub.site/#website" },
            primaryImageOfPage: {
              "@type": "ImageObject",
              "@id":
                "https://calculatorhub.site/images/personal-loan-calculator-hero.webp#primaryimg",
              url: "https://calculatorhub.site/images/personal-loan-calculator-hero.webp",
              width: 1200,
              height: 675,
            },
            mainEntity: {
              "@type": "Article",
              "@id":
                "https://calculatorhub.site/personal-loan-calculator#article",
              headline:
                "Personal Loan EMI Calculator – Plan Your EMI and Total Interest",
              description:
                "Calculate EMI, total interest and total payment for a personal loan based on amount, interest rate and tenure. Includes examples, tips and FAQs.",
              image: [
                "https://calculatorhub.site/images/personal-loan-calculator-hero.webp",
              ],
              author: {
                "@type": "Organization",
                name: "CalculatorHub",
                url: "https://calculatorhub.site",
              },
              publisher: { "@id": "https://calculatorhub.site/#organization" },
              datePublished: "2025-10-20",
              dateModified: "2025-11-06",
              mainEntityOfPage: {
                "@id":
                  "https://calculatorhub.site/personal-loan-calculator#webpage",
              },
              articleSection: [
                "What is Personal Loan EMI",
                "How to Use",
                "Example",
                "Benefits",
                "Small Business Use",
                "FAQ",
              ],
            },
          },

          // 2) Breadcrumbs
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "@id":
              "https://calculatorhub.site/personal-loan-calculator#breadcrumbs",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://calculatorhub.site/",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Currency & Finance",
                item:
                  "https://calculatorhub.site/category/currency-finance",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: "Personal Loan EMI Calculator",
                item:
                  "https://calculatorhub.site/personal-loan-calculator",
              },
            ],
          },

          // 3) FAQ
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://calculatorhub.site/personal-loan-calculator#faq",
            mainEntity: [
              {
                "@type": "Question",
                name: "What is a personal loan EMI?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "EMI (Equated Monthly Instalment) is the fixed monthly amount you pay to repay your personal loan, including principal and interest.",
                },
              },
              {
                "@type": "Question",
                name:
                  "Does the Personal Loan EMI Calculator include processing fees?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "This calculator estimates EMI based on principal, interest rate and tenure. For more accuracy, you may manually add processing fees or charges into the effective loan cost.",
                },
              },
              {
                "@type": "Question",
                name: "How can I reduce my personal loan EMI?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "You can reduce EMI by choosing a longer tenure, negotiating a lower interest rate, or borrowing a smaller amount.",
                },
              },
            ],
          },

          // 4) WebApplication
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id":
              "https://calculatorhub.site/personal-loan-calculator#webapp",
            name: "Personal Loan EMI Calculator",
            url: "https://calculatorhub.site/personal-loan-calculator",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            description:
              "Estimate EMI, total interest and total cost for a personal loan based on principal, rate and tenure.",
            publisher: { "@id": "https://calculatorhub.site/#organization" },
            image: [
              "https://calculatorhub.site/images/personal-loan-calculator-hero.webp",
            ],
          },

          // 5) SoftwareApplication
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id":
              "https://calculatorhub.site/personal-loan-calculator#software",
            name: "Personal Loan EMI & Interest Tool",
            applicationCategory: "FinanceApplication",
            operatingSystem: "All",
            url: "https://calculatorhub.site/personal-loan-calculator",
            publisher: { "@id": "https://calculatorhub.site/#organization" },
            description:
              "Interactive EMI calculator with breakdown of principal vs interest and sharable results.",
          },

          // 6) WebSite + Organization (global)
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": "https://calculatorhub.site/#website",
            url: "https://calculatorhub.site",
            name: "CalculatorHub",
            publisher: { "@id": "https://calculatorhub.site/#organization" },
            potentialAction: {
              "@type": "SearchAction",
              target: "https://calculatorhub.site/search?q={query}",
              "query-input": "required name=query",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": "https://calculatorhub.site/#organization",
            name: "CalculatorHub",
            url: "https://calculatorhub.site",
            logo: {
              "@type": "ImageObject",
              url: "https://calculatorhub.site/images/logo.png",
            },
          },
        ]}
      />

      {/** ===== Outside meta/link tags ===== */}
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1"
      />
      <meta
        name="robots"
        content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
      />
      <link
        rel="canonical"
        href="https://calculatorhub.site/personal-loan-calculator"
      />

      {/** Hreflang */}
      <link
        rel="alternate"
        href="https://calculatorhub.site/personal-loan-calculator"
        hreflang="en"
      />
      <link
        rel="alternate"
        href="https://calculatorhub.site/bn/personal-loan-calculator"
        hreflang="bn"
      />
      <link
        rel="alternate"
        href="https://calculatorhub.site/personal-loan-calculator"
        hreflang="x-default"
      />

      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta
        property="og:title"
        content="Personal Loan EMI Calculator – Monthly Payment & Total Cost"
      />
      <meta
        property="og:description"
        content="Calculate your personal loan EMI, total interest and total payment using this free online EMI calculator."
      />
      <meta
        property="og:url"
        content="https://calculatorhub.site/personal-loan-calculator"
      />
      <meta
        property="og:image"
        content="https://calculatorhub.site/images/personal-loan-calculator-hero.webp"
      />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta
        property="og:image:alt"
        content="Personal loan EMI calculator dashboard with principal and interest breakdown"
      />
      <meta property="og:locale" content="en_US" />

      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:title"
        content="Personal Loan EMI Calculator – Plan Your EMI & Interest"
      />
      <meta
        name="twitter:description"
        content="Free online Personal Loan EMI Calculator to estimate monthly instalment, total interest and total payment."
      />
      <meta
        name="twitter:image"
        content="https://calculatorhub.site/images/personal-loan-calculator-hero.webp"
      />
      <meta name="twitter:creator" content="@CalculatorHub" />
      <meta name="twitter:site" content="@CalculatorHub" />

      {/** PWA & theme */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link
        rel="apple-touch-icon"
        href="/icons/apple-touch-icon.png"
      />
      <meta name="theme-color" content="#06b6d4" />

      {/** Performance */}
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin=""
      />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://cdn.jsdelivr.net"
        crossOrigin=""
      />
      <link
        rel="preload"
        as="image"
        href="/images/personal-loan-calculator-hero.webp"
        fetchpriority="high"
      />
      <link
        rel="preload"
        href="/fonts/Inter-Variable.woff2"
        as="font"
        type="font/woff2"
        crossOrigin=""
      />

      {/** Misc */}
      <link
        rel="sitemap"
        type="application/xml"
        href="https://calculatorhub.site/sitemap.xml"
      />
      <meta
        name="referrer"
        content="no-referrer-when-downgrade"
      />
      <meta name="format-detection" content="telephone=no" />

      {/* ========================================================
         PAGE CONTENT
         ======================================================== */}
      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            {
              name: "Currency & Finance",
              url: "/category/currency-finance",
            },
            {
              name: "Personal Loan EMI Calculator",
              url: "/personal-loan-calculator",
            },
          ]}
        />

        {/* ===== Header ===== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            💳 Personal Loan EMI Calculator
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Plan your personal loan easily. Enter loan amount, interest
            rate and tenure to calculate your EMI, total interest and total
            repayment in seconds.
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

              {/* Loan Amount */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-1">
                  Loan Amount ({findSymbol(currency)})
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoAmount(!showInfoAmount)}
                  />
                </label>
                {showInfoAmount && (
                  <p className="text-xs bg-[#0f172a] border border-[#334155] rounded-md p-2 mt-1">
                    Enter the total principal amount you plan to borrow as a
                    personal loan.
                  </p>
                )}
                <input
                  type="number"
                  min={0}
                  value={loanAmount || ""}
                  onChange={(e) =>
                    setLoanAmount(parseFloat(e.target.value) || 0)
                  }
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 500000"
                />
              </div>

              {/* Interest Rate */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Interest Rate (% per year)
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoInterest(!showInfoInterest)}
                  />
                </label>
                {showInfoInterest && (
                  <p className="text-xs bg-[#0f172a] border border-[#334155] rounded-md p-2 mt-1">
                    Annual interest rate applied to your personal loan. Higher
                    interest means higher EMI and total cost.
                  </p>
                )}
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={interestRate || ""}
                  onChange={(e) =>
                    setInterestRate(parseFloat(e.target.value) || 0)
                  }
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 12"
                />
              </div>

              {/* Loan Term */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Loan Tenure (Years)
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoTerm(!showInfoTerm)}
                  />
                </label>
                {showInfoTerm && (
                  <p className="text-xs bg-[#0f172a] border border-[#334155] rounded-md p-2 mt-1">
                    Total repayment period for your personal loan. Longer tenure
                    reduces EMI but increases total interest.
                  </p>
                )}
                <input
                  type="number"
                  min={1}
                  value={loanYears || ""}
                  onChange={(e) =>
                    setLoanYears(parseFloat(e.target.value) || 0)
                  }
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 5"
                />
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">
              EMI Summary
            </h2>
            <div className="space-y-6">
              <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(emi, currentLocale, currency)}
                </div>
                <div className="text-sm text-slate-400">
                  Monthly EMI
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(totalPayment, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">
                    Total Payment
                  </div>
                </div>
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(totalInterest, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">
                    Total Interest
                  </div>
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
                    {copied === "results"
                      ? "Results copied!"
                      : "Link copied!"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== Chart & Insights ===== */}
        {chartData.length > 0 && (
          <div className="mt-6 bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              Principal vs Interest Breakdown
            </h3>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Pie Chart */}
              <div className="w-[90%] sm:w-[70%] md:w-[50%] max-w-[360px] h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#22c55e" />
                    </Pie>
                    <Tooltip
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
        {loanAmount > 0 && (
          <div className="mt-5 bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm">
            <p className="text-base font-medium leading-snug text-slate-300">
              💡 Tip: To lower your EMI, consider{" "}
              <span className="text-emerald-400 font-semibold">
                increasing your loan tenure
              </span>{" "}
              or{" "}
              <span className="text-indigo-400 font-semibold">
                negotiating a better interest rate
              </span>{" "}
              with your lender.
            </p>
          </div>
        )}

        {/* ===== SEO / Informational Section ===== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          <h1 className="text-3xl font-bold text-cyan-400 mb-6">
            Personal Loan EMI Calculator 2025 – Plan Your EMI and Total Cost
          </h1>

          <p>
            The{" "}
            <strong>Personal Loan EMI Calculator by CalculatorHub</strong> is a{" "}
            <strong>simple Personal Loan EMI Calculator</strong> built to show
            your monthly installment, total interest and total repayment in just
            a few clicks. Whether you’re planning a small top-up loan or a
            larger personal loan for travel, education, or medical needs, this{" "}
            <strong>professional Personal Loan EMI Calculator</strong> gives
            clear and accurate results.
          </p>

          <p>
            Acting as both a{" "}
            <strong>solution Personal Loan EMI Calculator</strong> and a{" "}
            <strong>tool Personal Loan EMI Calculator</strong>, it performs all
            the compound-interest math in the background while you focus on
            decisions. The{" "}
            <strong>free Personal Loan EMI Calculator</strong> follows standard
            banking formulas, helping you understand how EMI changes when you
            adjust loan amount, interest rate, or tenure. You can use this
            <strong> Personal Loan EMI Calculator online</strong> from any
            device without sign-up.
          </p>

          <figure className="my-8">
            <img
              src="/images/personal-loan-calculator-hero.webp"
              alt="Personal Loan EMI Calculator dashboard showing EMI and principal-interest chart"
              title="Personal Loan EMI Calculator 2025 | CalculatorHub"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Visualization of the Personal Loan EMI Calculator interface and
              the principal vs interest breakdown.
            </figcaption>
          </figure>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            💡 What is Personal Loan EMI Calculator?
          </h2>
          <p>
            Many users search for{" "}
            <strong>what is Personal Loan EMI Calculator</strong> and how it
            helps. In simple words, it’s an{" "}
            <strong>easy Personal Loan EMI Calculator</strong> that shows how
            much you need to pay every month until your loan is fully repaid.
            The{" "}
            <strong>Personal Loan EMI Calculator explained</strong>: enter the
            amount you want to borrow, your interest rate, and tenure in years.
            The calculator instantly gives you EMI, total interest, and total
            payment.
          </p>

          <p>
            For first-time borrowers, this{" "}
            <strong>Personal Loan EMI Calculator for beginners</strong> removes
            guesswork and surprises. For advisors and experienced users, the{" "}
            <strong>advanced Personal Loan EMI Calculator</strong> provides a
            clear split between principal and interest, making it ideal for
            reports and comparisons.
          </p>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧭 How to Use Personal Loan EMI Calculator
          </h2>
          <p>
            Learning{" "}
            <strong>how to use Personal Loan EMI Calculator</strong> is very
            straightforward:
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Select your preferred currency.</li>
            <li>Enter your desired <strong>loan amount</strong>.</li>
            <li>Input the annual <strong>interest rate</strong>.</li>
            <li>Set the <strong>loan tenure</strong> in years.</li>
            <li>
              The calculator automatically shows your EMI, total interest and
              total payment.
            </li>
          </ol>
          <p>
            These steps turn the tool into a practical{" "}
            <strong>Personal Loan EMI Calculator tutorial</strong>. With a clean
            design and instant results, this{" "}
            <strong>simple Personal Loan EMI Calculator</strong> can be used by
            anyone—no financial background required.
          </p>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧮 Example Calculation
          </h2>
          <p>
            Suppose you take a personal loan of{" "}
            <strong>$10,000</strong> at{" "}
            <strong>12% interest per year</strong> for{" "}
            <strong>5 years</strong>. The{" "}
            <strong>advanced Personal Loan EMI Calculator</strong> will compute
            a monthly EMI of around <strong>$222</strong>, with a total payment
            of roughly <strong>$13,300</strong>. That means about{" "}
            <strong>$3,300</strong> goes towards interest. This example shows
            how the{" "}
            <strong>professional Personal Loan EMI Calculator</strong> helps you
            clearly see the cost of borrowing.
          </p>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🌐 Personal Loan EMI Calculator Online
          </h2>
          <p>
            The{" "}
            <strong>Personal Loan EMI Calculator online</strong> runs entirely
            in your browser and is optimized for both mobile and desktop. You
            don’t need to install anything. Hosted on the{" "}
            <strong>Personal Loan EMI Calculator website</strong> by
            CalculatorHub, it’s tuned for speed, accuracy and privacy. Whether
            you are comparing bank offers or checking a new top-up loan, this{" "}
            <strong>premium Personal Loan EMI Calculator</strong> makes the
            numbers transparent.
          </p>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ⚖️ Personal Loan EMI Calculator Comparison & Alternatives
          </h2>
          <p>
            In a{" "}
            <strong>Personal Loan EMI Calculator comparison</strong>, many tools
            only show the EMI. CalculatorHub goes further by highlighting total
            interest, total payment and principal vs interest distribution. Some{" "}
            <strong>Personal Loan EMI Calculator alternatives</strong> may look
            simpler, but they often miss these deeper insights. That’s why
            users often treat this as the{" "}
            <strong>best Personal Loan EMI Calculator</strong> for 2025 and
            beyond.
          </p>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            💰 Benefits of Using Personal Loan EMI Calculator
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Instant EMI, total interest and total cost visibility.</li>
            <li>Helps avoid over-borrowing and repayment stress.</li>
            <li>
              Works as both a{" "}
              <strong>simple Personal Loan EMI Calculator</strong> and an{" "}
              <strong>advanced Personal Loan EMI Calculator</strong>.
            </li>
            <li>
              100% <strong>free Personal Loan EMI Calculator</strong> with no
              login.
            </li>
            <li>
              Accessible from any device as a{" "}
              <strong>Personal Loan EMI Calculator online</strong>.
            </li>
            <li>Ideal for individuals, advisors and small businesses.</li>
          </ul>

          <p>
            These{" "}
            <strong>Personal Loan EMI Calculator benefits</strong> make it
            suitable for planning everything from emergency needs to structured
            personal finance goals.
          </p>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🏢 Small Business & Professional Use
          </h2>
          <p>
            Small business owners can treat it as a{" "}
            <strong>small business Personal Loan EMI Calculator</strong> when
            taking unsecured loans for working capital, equipment, or marketing.
            Finance professionals use the{" "}
            <strong>professional Personal Loan EMI Calculator</strong> during
            client calls and presentations. For teams that need deeper analysis,
            the{" "}
            <strong>premium Personal Loan EMI Calculator</strong> workflow
            includes scenario testing by changing amount, rate and tenure.
          </p>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📚 Personal Loan EMI Calculator Tutorial & Learning Guide
          </h2>
          <p>
            The CalculatorHub content around this tool works like a{" "}
            <strong>Personal Loan EMI Calculator tutorial</strong>. It explains
            interest compounding, EMI structure and how banks view repayment
            capacity. This makes the tool a powerful{" "}
            <strong>Personal Loan EMI Calculator for beginners</strong>, while
            still serving as an{" "}
            <strong>advanced Personal Loan EMI Calculator</strong> for people
            who love detailed numbers.
          </p>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧩 Why CalculatorHub’s Personal Loan Tool is the Best
          </h2>
          <p>
            CalculatorHub delivers the{" "}
            <strong>best Personal Loan EMI Calculator</strong> by combining
            accuracy, speed and clean design. It’s a complete{" "}
            <strong>solution Personal Loan EMI Calculator</strong> that helps
            you see the true cost of any personal loan before you apply. With
            its{" "}
            <strong>easy Personal Loan EMI Calculator</strong> interface, free
            access and pro-grade breakdown, it stands out as a leading{" "}
            <strong>Personal Loan EMI Calculator website</strong>.
          </p>

          {/* ===== FAQ Section ===== */}
          <section id="faq" className="space-y-6 mt-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
              ❓ Frequently Asked Questions (
              <span className="text-yellow-300">FAQ</span>)
            </h2>

            <div className="space-y-5 text-lg text-slate-100 leading-relaxed">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q1: How accurate is this Personal Loan EMI Calculator?
                </h3>
                <p>
                  This{" "}
                  <strong>professional Personal Loan EMI Calculator</strong>{" "}
                  uses the standard EMI formula used by banks, so results are
                  highly reliable for planning. Real-world EMI may differ
                  slightly if lenders add extra fees.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q2: Is the Personal Loan EMI Calculator free to use?
                </h3>
                <p>
                  Yes, it’s a 100%{" "}
                  <strong>free Personal Loan EMI Calculator</strong> with no
                  registration, hidden charges or download requirement. You can
                  open it anytime as an{" "}
                  <strong>online Personal Loan EMI Calculator</strong>.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q3: Can I use this for top-up or refinancing?
                </h3>
                <p>
                  Absolutely. Treat it as a{" "}
                  <strong>solution Personal Loan EMI Calculator</strong> for new
                  loans, top-ups or refinancing scenarios by entering the
                  revised amount, rate and tenure.
                </p>
              </div>
            </div>
          </section>
        </section>

        {/* ===== Footer & Related Tools ===== */}
        <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
          <div className="flex items-center gap-3">
            <img
              src="/images/calculatorhub-author.webp"
              alt="CalculatorHub Finance Tools Team"
              className="w-12 h-12 rounded-full border border-gray-600"
              loading="lazy"
            />
            <div>
              <p className="font-semibold text-white">
                Written by the CalculatorHub Finance Tools Team
              </p>
              <p className="text-sm text-slate-400">
                Experts in loans, EMI planning and online finance tools. Last
                updated:{" "}
                <time dateTime="2025-10-20">October 20, 2025</time>.
              </p>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              🚀 Explore more finance tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/loan-emi-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
              >
                <span className="text-indigo-400">💳</span> Loan EMI Calculator
              </Link>
              <Link
                to="/loan-affordability-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
              >
                <span className="text-emerald-400">🏠</span> Loan
                Affordability Calculator
              </Link>
              <Link
                to="/debt-to-income-ratio-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-pink-600/20 text-pink-300 hover:text-pink-400 px-3 py-2 rounded-md border border-slate-700 hover:border-pink-500 transition-all duration-200"
              >
                <span className="text-pink-400">📉</span> Debt-to-Income Ratio
                Calculator
              </Link>
            </div>
          </div>
        </section>

        <AdBanner type="bottom" />
        <RelatedCalculators
          currentPath="/personal-loan-calculator"
          category="currency-finance"
        />
      </div>
    </>
  );
};

export default PersonalLoanCalculator;
