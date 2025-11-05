// complate for live

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
  Home,
  RotateCcw,
  Share2,
  Copy,
  BarChart2,
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
import { seoData, generateCalculatorSchema } from "../utils/seoData";
import RelatedCalculators from "../components/RelatedCalculators";

/* ============================================================
   📦 SECTION 1: Constants & Utilities
   ============================================================ */
const LS_KEY = "mortgage_calculator_tax_style_v3";


 
const currencyOptions = [
  { code: "USD", symbol: "$", locale: "en-US", label: "US Dollar ($)" },
  { code: "EUR", symbol: "€", locale: "de-DE", label: "Euro (€)" },
  { code: "GBP", symbol: "£", locale: "en-GB", label: "British Pound (£)" },
  { code: "INR", symbol: "₹", locale: "en-IN", label: "Indian Rupee (₹)" },
  { code: "AUD", symbol: "A$", locale: "en-AU", label: "Australian Dollar (A$)" },
  { code: "CAD", symbol: "C$", locale: "en-CA", label: "Canadian Dollar (C$)" },
  { code: "SGD", symbol: "S$", locale: "en-SG", label: "Singapore Dollar (S$)" },
  { code: "JPY", symbol: "¥", locale: "ja-JP", label: "Japanese Yen (¥)" },
  { code: "CNY", symbol: "¥", locale: "zh-CN", label: "Chinese Yuan (¥)" },
  { code: "NZD", symbol: "NZ$", locale: "en-NZ", label: "New Zealand Dollar (NZ$)" },
  { code: "CHF", symbol: "CHF", locale: "de-CH", label: "Swiss Franc (CHF)" },
  { code: "HKD", symbol: "HK$", locale: "zh-HK", label: "Hong Kong Dollar (HK$)" },
  { code: "SEK", symbol: "kr", locale: "sv-SE", label: "Swedish Krona (kr)" },
  { code: "NOK", symbol: "kr", locale: "nb-NO", label: "Norwegian Krone (kr)" },
  { code: "DKK", symbol: "kr", locale: "da-DK", label: "Danish Krone (kr)" },
  { code: "ZAR", symbol: "R", locale: "en-ZA", label: "South African Rand (R)" },
  { code: "BRL", symbol: "R$", locale: "pt-BR", label: "Brazilian Real (R$)" },
  { code: "RUB", symbol: "₽", locale: "ru-RU", label: "Russian Ruble (₽)" },
  { code: "KRW", symbol: "₩", locale: "ko-KR", label: "South Korean Won (₩)" },
  { code: "THB", symbol: "฿", locale: "th-TH", label: "Thai Baht (฿)" },
  { code: "IDR", symbol: "Rp", locale: "id-ID", label: "Indonesian Rupiah (Rp)" },
  { code: "MYR", symbol: "RM", locale: "ms-MY", label: "Malaysian Ringgit (RM)" },
  { code: "PHP", symbol: "₱", locale: "en-PH", label: "Philippine Peso (₱)" },
  { code: "VND", symbol: "₫", locale: "vi-VN", label: "Vietnamese Dong (₫)" },
  { code: "SAR", symbol: "﷼", locale: "ar-SA", label: "Saudi Riyal (﷼)" },
  { code: "AED", symbol: "د.إ", locale: "ar-AE", label: "UAE Dirham (د.إ)" },
  { code: "QAR", symbol: "﷼", locale: "ar-QA", label: "Qatari Riyal (﷼)" },
  { code: "KWD", symbol: "KD", locale: "ar-KW", label: "Kuwaiti Dinar (KD)" },
  { code: "BHD", symbol: "BD", locale: "ar-BH", label: "Bahraini Dinar (BD)" },
  { code: "OMR", symbol: "﷼", locale: "ar-OM", label: "Omani Rial (﷼)" },
  { code: "PKR", symbol: "₨", locale: "ur-PK", label: "Pakistani Rupee (₨)" },
  { code: "BDT", symbol: "৳", locale: "bn-BD", label: "Bangladeshi Taka (৳)" },
  { code: "LKR", symbol: "Rs", locale: "si-LK", label: "Sri Lankan Rupee (Rs)" },
  { code: "NPR", symbol: "₨", locale: "ne-NP", label: "Nepalese Rupee (₨)" },
  { code: "MMK", symbol: "K", locale: "my-MM", label: "Myanmar Kyat (K)" },
  { code: "KES", symbol: "Sh", locale: "en-KE", label: "Kenyan Shilling (Sh)" },
  { code: "NGN", symbol: "₦", locale: "en-NG", label: "Nigerian Naira (₦)" },
  { code: "EGP", symbol: "£", locale: "ar-EG", label: "Egyptian Pound (£)" },
  { code: "ILS", symbol: "₪", locale: "he-IL", label: "Israeli Shekel (₪)" },
  { code: "TRY", symbol: "₺", locale: "tr-TR", label: "Turkish Lira (₺)" },
  { code: "PLN", symbol: "zł", locale: "pl-PL", label: "Polish Zloty (zł)" },
  { code: "CZK", symbol: "Kč", locale: "cs-CZ", label: "Czech Koruna (Kč)" },
  { code: "HUF", symbol: "Ft", locale: "hu-HU", label: "Hungarian Forint (Ft)" },
  { code: "MXN", symbol: "$", locale: "es-MX", label: "Mexican Peso ($)" },
  { code: "CLP", symbol: "$", locale: "es-CL", label: "Chilean Peso ($)" },
  { code: "COP", symbol: "$", locale: "es-CO", label: "Colombian Peso ($)" },
  { code: "ARS", symbol: "$", locale: "es-AR", label: "Argentine Peso ($)" },
  { code: "PEN", symbol: "S/", locale: "es-PE", label: "Peruvian Sol (S/)" },
  { code: "UYU", symbol: "$U", locale: "es-UY", label: "Uruguayan Peso ($U)" },
  { code: "TWD", symbol: "NT$", locale: "zh-TW", label: "New Taiwan Dollar (NT$)" },
  { code: "HKD", symbol: "HK$", locale: "zh-HK", label: "Hong Kong Dollar (HK$)" },
];


const findLocale = (code: string) =>
  currencyOptions.find((c) => c.code === code)?.locale || "en-US";
const findSymbol = (code: string) =>
  currencyOptions.find((c) => c.code === code)?.symbol || "";

const formatCurrency = (num: number, locale: string, currency: string) => {
  if (!isFinite(num) || num <= 0) return `${findSymbol(currency)}0`;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));


/* ============================================================
   🏠 SECTION 2: Component
   ============================================================ */
const MortgageCalculator: React.FC = () => {
  /* ---------- Inputs ---------- */
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(0);
  const [loanYears, setLoanYears] = useState<number>(0);
  const [loanMonths, setLoanMonths] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("USD");

  /* ---------- Derived & Outputs ---------- */
  const totalMonths = loanYears * 12 + loanMonths;
  const principal = Math.max(loanAmount - downPayment, 0);
  const monthlyRate = interestRate / 12 / 100;

  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);

  /* ---------- UI state ---------- */
  const [showAmort, setShowAmort] = useState<boolean>(false);
  const [granularity, setGranularity] = useState<"yearly" | "monthly">("yearly");
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [activeTip, setActiveTip] = useState<number>(0);

  /* Info toggles */
  const [showLoanInfo, setShowLoanInfo] = useState(false);
  const [showDownPaymentInfo, setShowDownPaymentInfo] = useState(false);
  const [showInterestInfo, setShowInterestInfo] = useState(false);
  const [showTermInfo, setShowTermInfo] = useState(false);

  const currentLocale = findLocale(currency);
  const isDefault =
    !loanAmount && !downPayment && !interestRate && !loanYears && !loanMonths;

/* ============================================================
   🔁 SECTION 3: Normalization & Persistence (robust)
   ============================================================ */

const [hydrated, setHydrated] = useState(false); // <-- important

// Normalize months >= 12 → carry over to years automatically
useEffect(() => {
  if (loanMonths >= 12) {
    const extraYears = Math.floor(loanMonths / 12);
    setLoanYears((prev) => prev + extraYears);
    setLoanMonths(loanMonths % 12);
  }
}, [loanMonths]);

// Helper: apply a saved/decoded state to inputs
const applyState = (s: any) => {
  setLoanAmount(Number(s.loanAmount) || 0);
  setDownPayment(Number(s.downPayment) || 0);
  setInterestRate(Number(s.interestRate) || 0);
  setLoanYears(Number(s.loanYears) || 0);
  setLoanMonths(Number(s.loanMonths) || 0);
  setCurrency(typeof s.currency === "string" ? s.currency : "USD");
};

// On mount → try URL (?mc=) first, else localStorage
useEffect(() => {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromURL = params.get("mc");

    if (fromURL) {
      const decoded = JSON.parse(atob(fromURL));
      applyState(decoded);
      setHydrated(true);
      return;
    }

    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      applyState(saved);
    }
  } catch (err) {
    console.warn("⚠️ Failed to load persisted state:", err);
  } finally {
    // even if nothing to load, mark as hydrated so future saves work
    setHydrated(true);
  }
}, []);

// After hydration, persist to localStorage on any change
useEffect(() => {
  if (!hydrated) return;
  try {
    const state = {
      loanAmount,
      downPayment,
      interestRate,
      loanYears,
      loanMonths,
      currency,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("⚠️ Could not save to localStorage:", err);
  }
}, [hydrated, loanAmount, downPayment, interestRate, loanYears, loanMonths, currency]);

// (Optional) Mirror state to URL so refresh/share keeps inputs.
// Only do this after hydration and when not all default zeros.
useEffect(() => {
  if (!hydrated) return;

  const allZero =
    !loanAmount && !downPayment && !interestRate && !loanYears && !loanMonths;

  try {
    const url = new URL(window.location.href);

    if (allZero) {
      // keep URL clean when at defaults
      url.searchParams.delete("mc");
      window.history.replaceState({}, "", url);
      return;
    }

    const state = { loanAmount, downPayment, interestRate, loanYears, loanMonths, currency };
    const encoded = btoa(JSON.stringify(state));
    url.searchParams.set("mc", encoded);
    window.history.replaceState({}, "", url);
  } catch (err) {
    console.warn("⚠️ Failed to update URL:", err);
  }
}, [hydrated, loanAmount, downPayment, interestRate, loanYears, loanMonths, currency]);

  /* ============================================================
     🧮 SECTION 4: Calculations
     ============================================================ */
  // EMI, totals
  useEffect(() => {
    if (principal <= 0 || totalMonths <= 0 || interestRate < 0) {
      setMonthlyPayment(0);
      setTotalPayment(0);
      setTotalInterest(0);
      return;
    }
    if (interestRate === 0) {
      const emi = principal / totalMonths;
      setMonthlyPayment(emi);
      setTotalPayment(emi * totalMonths);
      setTotalInterest(0);
      return;
    }
    const pow = Math.pow(1 + monthlyRate, totalMonths);
    const emi = (principal * monthlyRate * pow) / (pow - 1);
    setMonthlyPayment(emi);
    setTotalPayment(emi * totalMonths);
    setTotalInterest(emi * totalMonths - principal);
  }, [principal, interestRate, totalMonths, monthlyRate]);

  // Amortization schedule rows
  type Row = { period: number; principalPaid: number; interestPaid: number; balance: number };
  const monthlySchedule: Row[] = useMemo(() => {
    if (principal <= 0 || totalMonths <= 0) return [];
    let balance = principal;
    const rows: Row[] = [];
    const pow = Math.pow(1 + monthlyRate, totalMonths);
    const emi =
      interestRate === 0 ? principal / totalMonths : (principal * monthlyRate * pow) / (pow - 1);
    for (let m = 1; m <= totalMonths; m++) {
      const interestPaid = balance * monthlyRate;
      const principalPaid = Math.min(emi - interestPaid, balance);
      balance = Math.max(balance - principalPaid, 0);
      rows.push({ period: m, principalPaid, interestPaid, balance });
    }
    return rows;
  }, [principal, totalMonths, monthlyRate, interestRate]);

  const yearlySchedule: Row[] = useMemo(() => {
    const years = Math.ceil(totalMonths / 12);
    const out: Row[] = [];
    for (let y = 0; y < years; y++) {
      const slice = monthlySchedule.slice(y * 12, y * 12 + 12);
      const principalPaid = slice.reduce((s, r) => s + r.principalPaid, 0);
      const interestPaid = slice.reduce((s, r) => s + r.interestPaid, 0);
      const balance = slice.length ? slice[slice.length - 1].balance : principal;
      out.push({ period: y + 1, principalPaid, interestPaid, balance });
    }
    return out;
  }, [monthlySchedule, totalMonths, principal]);

  const schedule = granularity === "yearly" ? yearlySchedule : monthlySchedule;


   /* ============================================================
   📘 SECTION 4.5: Step-by-step EMI Logic
   ============================================================ */
  const emiSteps = useMemo(() => {
    const P = Math.max(principal, 0);
    const n = Math.max(totalMonths, 0);
    const r = Math.max(monthlyRate, 0); // monthly interest rate = interestRate / 12 / 100
  
    const onePlusR = 1 + r;
    const pow = n > 0 ? Math.pow(onePlusR, n) : 1;
  
    // Intermediate & general formula parts
    const pTimesR = P * r;                // <-- missing step (P × r)
    const numerator = pTimesR * pow;      // (P × r) × (1 + r)^n
    const denominator = pow - 1;          // (1 + r)^n - 1
    const generalEmi = denominator !== 0 ? numerator / denominator : 0;
  
    // Zero-rate fallback (when APR is 0, r = 0)
    const zeroRateEmi = n > 0 ? P / n : 0;
  
    // Final EMI (choose branch)
    const emi = interestRate === 0 ? zeroRateEmi : generalEmi;
  
    return {
      P, r, n, onePlusR, pow,
      pTimesR,            // <-- expose it to UI
      numerator, denominator, emi,
      isZeroRate: interestRate === 0,
    };
  }, [principal, totalMonths, monthlyRate, interestRate]);


  /* ============================================================
     📊 SECTION 5: Pie & Tips
     ============================================================ */
  const pieData = [
    { name: "Principal", value: Math.max(principal, 0) },
    { name: "Interest", value: Math.max(totalInterest, 0) },
  ];
  const PIE_COLORS = ["#3b82f6", "#a855f7"];
  const interestPct = principal > 0 ? (totalInterest / principal) * 100 : 0;

  const tipsForMortgage = useMemo(() => {
    const base: string[] = [];
    if (principal && totalInterest)
      base.push(`Over the term, you'll pay ~${interestPct.toFixed(0)}% of your loan as interest.`);
    if (downPayment)
      base.push(
        `Your down payment reduces the financed amount to ${formatCurrency(
          principal,
          findLocale(currency),
          currency
        )}.`
      );
    base.push("Tip: Making extra principal payments can shorten your loan term dramatically.");
    base.push("Tip: Shorter loan terms usually have higher EMIs but save a lot on total interest.");
    base.push("Tip: Compare rates across banks — even a 0.5% lower rate saves thousands over time.");
    return base;
  }, [principal, totalInterest, interestPct, downPayment, currency]);

  useEffect(() => {
    if (!tipsForMortgage.length) return;
    const t = setInterval(() => {
      setActiveTip((prev) => (prev + 1) % tipsForMortgage.length);
    }, 5000);
    return () => clearInterval(t);
  }, [tipsForMortgage]);

  /* ============================================================
     🔗 SECTION 6: Share / Copy / Reset
     ============================================================ */
  const copyResults = async () => {
    const text = [
      `Mortgage Summary`,
      `Loan: ${formatCurrency(loanAmount, currentLocale, currency)}`,
      `Down Payment: ${formatCurrency(downPayment, currentLocale, currency)}`,
      `Principal: ${formatCurrency(principal, currentLocale, currency)}`,
      `Rate: ${interestRate}%`,
      `Term: ${loanYears}y ${loanMonths}m`,
      `Monthly: ${formatCurrency(monthlyPayment, currentLocale, currency)}`,
      `Total: ${formatCurrency(totalPayment, currentLocale, currency)}`,
      `Interest: ${formatCurrency(totalInterest, currentLocale, currency)}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const encoded = btoa(
      JSON.stringify({ loanAmount, downPayment, interestRate, loanYears, loanMonths, currency })
    );
    const url = new URL(window.location.href);
    url.searchParams.set("mc", encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  const reset = () => {
  setLoanAmount(0);
  setDownPayment(0);
  setInterestRate(0);
  setLoanYears(0);
  setLoanMonths(0);
  setCurrency("USD");
  setShowAmort(false);
  setGranularity("yearly");

  // Clear from localStorage
  localStorage.removeItem(LS_KEY);
};


  /* ============================================================
     🎨 SECTION 7: Render
     ============================================================ */
  return (
    <>
      <SEOHead
            title={seoData.mortgageCalculator.title}
            description={seoData.mortgageCalculator.description}
            canonical="https://calculatorhub.site/mortgage-calculator"
            schemaData={generateCalculatorSchema(
              "Mortgage Calculator",
              seoData.mortgageCalculator.description,
              "/mortgage-calculator",
              seoData.mortgageCalculator.keywords
            )}
          />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* ===== Enhanced SEO & Social Metadata (Optimized for Google & Social) ===== */}
        <>
          {/* --- Open Graph Meta Tags --- */}
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="CalculatorHub" />
          <meta property="og:locale" content="en_US" />
          <meta property="og:title" content={seoData.mortgageCalculator.title} />
          <meta property="og:description" content={seoData.mortgageCalculator.description} />
          <meta property="og:url" content="https://calculatorhub.site/mortgage-calculator" />
          <meta
            property="og:image"
            content="https://calculatorhub.site/images/mortgage-calculator-hero.webp"
          />
          <meta property="og:image:alt" content="Mortgage Calculator by CalculatorHub – EMI, Interest, and Payment Chart" />
  
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
        
          {/* --- Twitter Card Meta Tags --- */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@CalculatorHub" />
          <meta name="twitter:creator" content="@CalculatorHub" />
          <meta name="twitter:title" content={seoData.mortgageCalculator.title} />
          <meta name="twitter:description" content={seoData.mortgageCalculator.description} />
          <meta
            name="twitter:image"
            content="https://calculatorhub.site/images/mortgage-calculator-hero.webp"
          />
          <meta
            name="twitter:image:alt"
            content="Interactive mortgage calculator showing EMI breakdown and amortization chart"
          />
        
          {/* --- Rich Schema Markup (FAQ + Breadcrumb + WebPage) --- */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "WebPage",
                    "@id": "https://calculatorhub.site/mortgage-calculator",
                    "url": "https://calculatorhub.site/mortgage-calculator",
                    "name": "Mortgage Calculator | Free Home Loan EMI & Interest Estimator",
                    "description":
                      "Use CalculatorHub’s Mortgage Calculator to estimate your monthly EMI, total interest, and amortization schedule instantly across multiple currencies.",
                    "inLanguage": "en-US",
                    "isPartOf": {
                      "@type": "WebSite",
                      "name": "CalculatorHub",
                      "url": "https://calculatorhub.site"
                    },
                    "image": {
                      "@type": "ImageObject",
                      "url": "https://calculatorhub.site/images/mortgage-calculator-hero.webp",
                      "width": 1200,
                      "height": 630
                    },
                  },
                  {
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                      {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Currency & Finance",
                        "item": "https://calculatorhub.site/category/currency-finance"
                      },
                      {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "Mortgage Calculator",
                        "item": "https://calculatorhub.site/mortgage-calculator"
                      }
                    ]
                  },
                  {
                    "@type": "FAQPage",
                    "mainEntity": [
                      {
                        "@type": "Question",
                        "name": "What is a mortgage EMI?",
                        "acceptedAnswer": {
                          "@type": "Answer",
                          "text":
                            "EMI (Equated Monthly Installment) is the fixed monthly payment you make to repay your mortgage over time."
                        }
                      },
                      {
                        "@type": "Question",
                        "name": "Does the calculator support down payment?",
                        "acceptedAnswer": {
                          "@type": "Answer",
                          "text":
                            "Yes, you can enter a down payment and we automatically reduce the financed principal before calculating EMI."
                        }
                      },
                      {
                        "@type": "Question",
                        "name": "Can I share my results?",
                        "acceptedAnswer": {
                          "@type": "Answer",
                          "text":
                            "Use the Copy Link button to generate a shareable URL with your inputs encoded so anyone can open the same scenario."
                        }
                      },
                      {
                        "@type": "Question",
                        "name": "Do you store my data?",
                        "acceptedAnswer": {
                          "@type": "Answer",
                          "text":
                            "No, all calculations run locally in your browser using localStorage only for your convenience."
                        }
                      }
                    ]
                  }
                ]
              }),
            }}
          />
        </>




      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "Mortgage Calculator", url: "/mortgage-calculator" },
          ]}
        />

        


        {/* ===== Header ===== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            🏠 Mortgage Calculator
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Estimate your monthly mortgage EMI, total interest, and see a detailed amortization schedule.
            Use down payment, term in years & months, and multiple currencies for accurate planning.
          </p>
        </div>

       <div className="hidden sm:flex mt-6 mb-3 bg-gradient-to-r from-indigo-600 via-purple-          600 to-fuchsia-600 text-white rounded-lg shadow-lg p-4 flex-col sm:flex-row items-            center justify-between gap-3">
        <div>
          <p className="font-semibold text-lg">Compare other finance tools 📊</p>
          <p className="text-sm text-indigo-100">
            Try our Loan EMI, Income Tax, or Currency Converter next!
          </p>
        </div>
        <a
          href="/category/currency-finance"
          className="bg-white text-indigo-700 font-semibold px-4 py-2 rounded-md hover:bg-indigo-50 transition"
        >
          Explore More Calculators
        </a>
      </div>


            
        {/* ===== Calculator Grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 relative text-slate-200">
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
                <div className="relative inline-block w-48">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-[#0f172a] text-white text-sm px-3 py-1.5 border border-[#334155] rounded-md focus:ring-2 focus:ring-indigo-500 appearance-none pr-8 hover:border-indigo-400 transition"
                  >
                    {currencyOptions.map((c) => (
                      <option key={c.code} value={c.code} className="text-white">
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                    ▼
                  </span>
                </div>
              </div>

              {/* Loan Amount */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">
                    Loan Amount ({findSymbol(currency)})
                  </label>
                  <Info
                    onClick={() => setShowLoanInfo(!showLoanInfo)}
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                  />
                </div>
                {showLoanInfo && (
                  <div className="mb-2 bg-[#0f172a] text-slate-300 text-xs p-2 rounded-md border border-[#334155]">
                    Total property loan amount you are borrowing from the bank.
                  </div>
                )}
                <input
                  type="number"
                  value={loanAmount || ""}
                  placeholder={`Enter total property loan amount in ${findSymbol(currency)}`}
                  min={0}
                  onChange={(e) => setLoanAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Down Payment */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">
                    Down Payment ({findSymbol(currency)})
                  </label>
                  <Info
                    onClick={() => setShowDownPaymentInfo(!showDownPaymentInfo)}
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                  />
                </div>
                {showDownPaymentInfo && (
                  <div className="mb-2 bg-[#0f172a] text-slate-300 text-xs p-2 rounded-md border border-[#334155]">
                    Amount you pay upfront — reduces the financed principal and interest.
                  </div>
                )}
                <input
                  type="number"
                  value={downPayment || ""}
                  placeholder={`Enter down payment in ${findSymbol(currency)}`}
                  min={0}
                  onChange={(e) =>
                    setDownPayment(clamp(parseFloat(e.target.value) || 0, 0, loanAmount || 0))
                  }
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-slate-400 mt-2">
                  Financed principal:{" "}
                  <span className="font-semibold text-indigo-300">
                    {formatCurrency(principal, currentLocale, currency)}
                  </span>
                </p>
              </div>

              {/* Interest Rate */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">Annual Interest Rate (%)</label>
                  <Info
                    onClick={() => setShowInterestInfo(!showInterestInfo)}
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                  />
                </div>
                {showInterestInfo && (
                  <div className="mb-2 bg-[#0f172a] text-slate-300 text-xs p-2 rounded-md border border-[#334155]">
                    Annual percentage rate (APR) charged on your mortgage loan.
                  </div>
                )}
                <input
                  type="number"
                  step="0.01"
                  value={interestRate || ""}
                  placeholder="Enter annual interest rate"
                  min={0}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Loan Term */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">Loan Term</label>
                  <Info
                    onClick={() => setShowTermInfo(!showTermInfo)}
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                  />
                </div>
                {showTermInfo && (
                  <div className="mb-2 bg-[#0f172a] text-slate-300 text-xs p-2 rounded-md border border-[#334155]">
                    The total loan duration in years and months — usually 15, 20, or 30 years.
                  </div>
                )}
                <div className="flex gap-4">
                  <input
                    type="number"
                    value={loanYears || ""}
                    placeholder="Years"
                    min={0}
                    onChange={(e) => setLoanYears(parseInt(e.target.value) || 0)}
                    className="w-1/2 bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    value={loanMonths || ""}
                    placeholder="Months"
                    min={0}
                    max={11}
                    onChange={(e) => setLoanMonths(parseInt(e.target.value) || 0)}
                    className="w-1/2 bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Total payments:{" "}
                  <span className="font-semibold text-indigo-300">
                    {totalMonths > 0 ? totalMonths : 0}
                  </span>{" "}
                  months
                </p>
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">Mortgage Summary</h2>
            <div className="space-y-6">
              <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                <Home className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(monthlyPayment, currentLocale, currency)}
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

              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex justify-between">
                  <span>Term Length:</span>
                  <span className="font-medium text-indigo-300">
                    {loanYears} years {loanMonths} months
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Interest Rate:</span>
                  <span className="font-medium text-indigo-300">{interestRate || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Number of Payments:</span>
                  <span className="font-medium text-indigo-300">
                    {totalMonths > 0 ? totalMonths : 0}
                  </span>
                </div>
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

        {/* ===== Smart Tip Box (Full Width Above Chart) ===== */}
        {principal > 0 && (
          <div className="mt-4 w-full relative">
            <div className="bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm min-h-[50px] w-full flex items-center">
              <div className="mr-3 flex items-center justify-center w-8 h-8">
                <span className="text-2xl text-indigo-400">💡</span>
              </div>
              <div className="w-full">
                <p className="text-base font-medium leading-snug text-slate-300">
                  {tipsForMortgage[activeTip]}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ===== Chart + Quick Summary ===== */}
        {principal > 0 && totalMonths > 0 && (
          <div className="mt-5 bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              Mortgage Insights & Breakdown
            </h3>
        
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Chart Left */}
              <div className="w-[90%] sm:w-[80%] md:w-[70%] max-w-[360px] h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={2}>
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={["#3b82f6", "#a855f7"][index % 2]} />
                      ))}
                    </Pie>
                    <ReTooltip formatter={(v: any) => formatCurrency(Number(v), currentLocale, currency)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
        
              {/* Summary Right */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-indigo-500 transition">
                  <p className="text-sm text-slate-400">Financed Principal</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(principal, currentLocale, currency)}
                  </p>
                </div>
        
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-emerald-500 transition">
                  <p className="text-sm text-slate-400">Down Payment</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(downPayment, currentLocale, currency)}
                  </p>
                </div>
        
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-rose-500 transition">
                  <p className="text-sm text-slate-400">Total Interest</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(totalInterest, currentLocale, currency)}
                  </p>
                </div>
        
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-indigo-500 transition">
                  <p className="text-sm text-slate-400">Total Payment</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(totalPayment, currentLocale, currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Amortization ===== */}
        {principal > 0 && totalMonths > 0 && (
          <div className="mt-10 bg-gradient-to-br from-[#1e293b] via-[#111827] to-[#0f172a] rounded-2xl border border-indigo-600/40 shadow-xl overflow-hidden">
            {/* Header Button */}
            <button
              onClick={() => setShowAmort((v) => !v)}
              className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold text-lg tracking-wide hover:opacity-90 transition-all"
            >
              <span>📊 Amortization Schedule</span>
              {showAmort ? <ChevronUp /> : <ChevronDown />}
            </button>
        
            {/* Collapsible Content */}
            {showAmort && (
              <div className="px-6 pb-8 pt-4">
                {/* Controls */}
                <div className="flex items-center gap-4 mb-5">
                  <label className="text-sm text-slate-300">Granularity:</label>
                  <select
                    value={granularity}
                    onChange={(e) => setGranularity(e.target.value as "yearly" | "monthly")}
                    className="px-3 py-2 bg-[#0f172a] border border-indigo-500/40 rounded-md text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  >
                    <option value="yearly">Yearly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
        
                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-[#334155] shadow-inner">
                  <table className="min-w-full text-sm text-slate-100">
                    <thead className="bg-[#0f172a]">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-indigo-300">
                          {granularity === "yearly" ? "Year" : "Month"}
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-emerald-300">
                          Principal
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-rose-300">
                          Interest
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-cyan-300">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((r, i) => (
                        <tr
                          key={r.period}
                          className={`transition-colors duration-200 ${
                            i % 2 === 0 ? "bg-[#1e293b]/60" : "bg-[#0f172a]/60"
                          } hover:bg-[#3b82f6]/10`}
                        >
                          <td className="px-4 py-2">{r.period}</td>
                          <td className="px-4 py-2 text-right text-emerald-300 font-medium">
                            {formatCurrency(r.principalPaid, currentLocale, currency)}
                          </td>
                          <td className="px-4 py-2 text-right text-rose-300 font-medium">
                            {formatCurrency(r.interestPaid, currentLocale, currency)}
                          </td>
                          <td className="px-4 py-2 text-right text-cyan-300 font-medium">
                            {formatCurrency(r.balance, currentLocale, currency)}
                          </td>
                        </tr>
                      ))}
                      {schedule.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-6 text-center text-slate-400 italic"
                          >
                            Enter valid details to view amortization schedule.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
        
                {/* Subtle Footer Glow */}
                <div className="h-2 w-full mt-6 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 blur-[2px]" />
              </div>
            )}
          </div>
        )}



        {/* ==================== SEO CONTENT SECTION ==================== */}
          <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">

            {/* ===== Table of Contents ===== */}
            <nav className="mt-2 mb-10 bg-[#0f172a] border border-[#334155] rounded-xl p-5 text-slate-200">
              <h2 className="text-lg font-semibold text-cyan-300 mb-3">📖 Table of Contents</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li><a href="#overview" className="text-indigo-400 hover:underline">Overview: What This Mortgage Calculator Does</a></li>
                <li><a href="#how-to-use" className="text-indigo-400 hover:underline">How to Use the Calculator</a></li>
                <li><a href="#how-calculated" className="text-indigo-400 hover:underline">How the Payment is Calculated (Step-by-Step)</a></li>
                <li><a href="#piti" className="text-indigo-400 hover:underline">What’s in a Payment: PITI + HOA</a></li>
                <li><a href="#example" className="text-indigo-400 hover:underline">Worked Example</a></li>
                <li><a href="#benefits" className="text-indigo-400 hover:underline">Benefits</a></li>
                <li><a href="#tips" className="text-indigo-400 hover:underline">Money-Saving Tips</a></li>
                <li><a href="#pros-cons" className="text-indigo-400 hover:underline">Pros &amp; Cons</a></li>
                <li><a href="#faq" className="text-indigo-400 hover:underline">FAQ</a></li>
              </ol>
            </nav>
              <h1 id="overview" className="text-3xl font-bold text-cyan-400 mb-6">
                Mortgage Calculator – Free, Advanced & Easy-to-Use Home Loan Estimator 2025-2026
              </h1>
            
              <p>
                Buying a home is one of life’s biggest milestones — and the right calculation tool can make it a lot
                easier. The <strong>Mortgage Calculator by CalculatorHub</strong> is an 
                <strong> advanced mortgage calculator</strong> built to help users plan every aspect of their home
                loan with precision. It instantly shows <strong>monthly payments, total interest, amortization
                schedule,</strong> and <strong>overall affordability</strong>, so anyone can understand exactly how
                much a property will cost over time.
              </p>
            
              <p>
                Whether you’re a first-time buyer, an investor, or running a small business looking to finance
                property, this <strong>free mortgage calculator</strong> is your go-to solution for stress-free,
                accurate mortgage planning. It supports multiple currencies, works on mobile, and uses
                real-world loan logic for <strong>fixed-rate, variable-rate, or interest-only mortgages</strong>.
              </p>
            
              <figure className="my-8">
                <img
                  src="/images/mortgage-calculator-hero.webp" 
                  alt="Modern mortgage calculator showing loan amortization chart"
                  title="Free Mortgage Calculator | Home Loan & Refinance Estimator"
                  className="rounded-lg shadow-md border border-slate-700 mx-auto"
                  loading="lazy"
                />
                <figcaption className="text-center text-sm text-slate-400 mt-2">
                  Real-time mortgage amortization and affordability visualization.
                </figcaption> 
              </figure>
            
              <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
                🏠 What Is a Mortgage Calculator?
              </h2>
              <p>
                A <strong>Mortgage Calculator</strong> is an online financial tool that estimates your monthly
                mortgage payments, total interest, and overall loan cost based on your principal, interest rate,
                and term length. It removes the guesswork from home-loan planning by offering instant, accurate,
                and transparent figures.
              </p>
              <p>
                The <strong>mortgage calculator explained</strong> feature inside the tool breaks each payment into
                principal and interest portions using amortization logic. It’s ideal for anyone exploring
                affordability, refinancing, or early repayment options. For newcomers, the 
                <strong> mortgage calculator for beginners</strong> explains concepts like down payment,
                annual percentage rate (APR), and property taxes in plain language.
              </p>
            
              <h2 id="how-to-use" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
                💡 How to Use the Mortgage Calculator
              </h2>
              <p>
                Using this <strong>easy mortgage calculator</strong> takes less than a minute. Follow this
                <strong> mortgage calculator tutorial</strong> to get accurate results:
              </p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Enter the <strong>loan amount (principal)</strong> you wish to borrow.</li>
                <li>Input the <strong>annual interest rate (APR)</strong>.</li>
                <li>Choose your <strong>loan term</strong> in years or months.</li>
                <li>Optionally add <strong>property tax, homeowners insurance, or HOA fees</strong>.</li>
                <li>Click <em>Calculate</em> to see monthly EMI, total interest, and repayment timeline.</li>
              </ol>
            
              <p>
                The built-in guide updates results dynamically — perfect for comparing different mortgage offers
                side by side. Whether you’re applying for a personal residence or using a 
                <strong> small-business mortgage calculator</strong> to purchase commercial property,
                this tool ensures you make informed decisions.
              </p>
            
              <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
                🧮 Mortgage Calculator Logic
              </h2>
              <p>
                This <strong>solution mortgage calculator</strong> relies on the standard amortization formula used
                by major banks and lenders worldwide:
              </p>
              <pre className="bg-slate-800 text-slate-200 p-3 rounded-lg overflow-x-auto">
                EMI = [P × R × (1 + R)<sup>N</sup>] / [(1 + R)<sup>N</sup> – 1]
              </pre>
              <p>
                Where:<br/>
                <strong>P</strong> = Principal loan amount<br/>
                <strong>R</strong> = Monthly interest rate (annual rate ÷ 12 ÷ 100)<br/>
                <strong>N</strong> = Number of months in loan tenure
              </p>
              <p>
                Behind the scenes, the <strong>mortgage calculator logic</strong> also accounts for compound
                interest and allows for optional extra payments, giving users a realistic amortization schedule.
                Advanced users can adjust frequency (monthly, bi-weekly, or weekly) for more control.
              </p>

               {/*Dynamic live math */}

          {/* ===== Responsive, colorful EMI step-by-step ===== */}
              <h2 id="how-calculated" className="mt-12 mb-3 text-2xl font-extrabold tracking-tight text-center sm:text-left">
                <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
                  🧮 How EMI is Calculated
                </span>
              </h2>
              
              <p className="mb-4 text-slate-300 text-sm sm:text-base text-center sm:text-left">
                We use the standard formula and show each step with your inputs:
              </p>
              
              <div className="relative rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-[#0b1220]/90 p-4 sm:p-6 ring-1 ring-indigo-500/30 shadow-xl text-[13.5px] sm:text-sm leading-relaxed">
                {/* top glow */}
                <div className="pointer-events-none absolute inset-x-0 -top-0.5 h-0.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-emerald-500 opacity-60" />
              
                {/* Formula */}
                <p className="mb-4 text-center font-mono text-[15px] leading-7 text-indigo-300">
                  EMI = <span className="text-sky-300">P × r × (1 + r)<sup>n</sup></span> /
                  <span className="text-fuchsia-300">((1 + r)<sup>n</sup> − 1)</span>
                </p>
              
                {/* Inputs row */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 mb-4">
                  <div className="flex flex-wrap justify-between items-center gap-1 sm:gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-cyan-500/20">
                    <span className="font-semibold text-cyan-300">P</span>
                    <span className="text-slate-300">Principal</span>
                    <span className="font-semibold text-white truncate">
                      {formatCurrency(emiSteps.P, currentLocale, currency)}
                    </span>
                  </div>
              
                  <div className="flex flex-wrap justify-between items-center gap-1 sm:gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-amber-500/20">
                    <span className="font-semibold text-amber-300">r</span>
                    <span className="text-slate-300">Monthly rate</span>
                    <span className="font-semibold text-white truncate">
                      {emiSteps.r.toFixed(8)}
                    </span>
                  </div>
              
                  <div className="flex flex-wrap justify-between items-center gap-1 sm:gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-fuchsia-500/20">
                    <span className="font-semibold text-fuchsia-300">n</span>
                    <span className="text-slate-300">Months</span>
                    <span className="font-semibold text-white truncate">{emiSteps.n}</span>
                  </div>
                </div>
              
                <div className="my-3 h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
              
                {/* Step details */}
                {!emiSteps.isZeroRate ? (
                  <div className="space-y-2 font-mono break-words">
                    <div className="flex flex-wrap justify-between">
                      <span className="font-semibold text-indigo-300">(1 + r)<sup>n</sup></span>
                      <span className="text-white"> {emiSteps.pow.toFixed(9)} </span>
                    </div>
              
                    <div className="flex flex-wrap justify-between">
                      <span className="font-semibold text-emerald-300">P × r</span>
                      <span className="text-white">
                        {formatCurrency(emiSteps.pTimesR, currentLocale, currency)}
                      </span>
                    </div>
              
                    <div className="flex flex-wrap justify-between">
                      <span className="font-semibold text-rose-300">(1 + r)<sup>n</sup> − 1</span>
                      <span className="text-white"> {emiSteps.denominator.toFixed(9)} </span>
                    </div>
              
                    <div className="flex flex-wrap justify-between">
                      <span className="font-semibold text-sky-300">
                        (P × r) × (1 + r)<sup>n</sup>
                      </span>
                      <span className="text-white">
                        {formatCurrency(emiSteps.numerator, currentLocale, currency)}
                      </span>
                    </div>
              
                    <div className="my-3 h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
              
                    {/* Calculation formula lines */}
                    <div className="my-3 h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

                        {/* Pseudo-code */}
                        <p className="mb-2 text-slate-300">Math for Mortgage EMI :</p>
                        <pre className="bg-slate-900/70 p-4 rounded-lg overflow-x-auto text-[13px] border border-slate-700">
                          {/* Numeric expansion (exact steps with live numbers) */}
                          {emiSteps.isZeroRate ? (
                            <pre className="bg-slate-900/70 p-4 rounded-lg overflow-x-auto text-[13px] border border-slate-700 mt-3">
                              <code>{`EMI = P / n
                          EMI = ${formatCurrency(emiSteps.P, currentLocale, currency)} / ${emiSteps.n || 1}
                          EMI = ${formatCurrency(
                            (emiSteps.P || 0) / Math.max(1, (emiSteps.n || 0)),
                            currentLocale,
                            currency
                          )}`}</code>
                            </pre>
                          ) : (
                            (() => {
                              const fmtNum = (x: number, max = 9) =>
                                Number.isFinite(x)
                                  ? new Intl.NumberFormat(currentLocale, { maximumFractionDigits: max }).format(x)
                                  : "—";
                          
                              const Pcur = formatCurrency(emiSteps.P, currentLocale, currency);
                              const rStr = emiSteps.r.toFixed(8);
                              const nStr = `${emiSteps.n}`;
                              const powStr = fmtNum(emiSteps.pow, 9);                 // (1 + r)^n
                              const denomStr = fmtNum(emiSteps.denominator, 9);       // (1 + r)^n − 1
                              const pTimesRcur = formatCurrency(emiSteps.pTimesR, currentLocale, currency); // P × r
                              const numerCur = formatCurrency(emiSteps.numerator, currentLocale, currency); // (P × r) × (1 + r)^n
                              const emiCur = formatCurrency(emiSteps.emi, currentLocale, currency);
                          
                              const lines = [
                                `EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1)`,
                                `EMI = ${Pcur} × ${rStr} × (1 + ${rStr})^${nStr} ÷ ( (1 + ${rStr})^${nStr} − 1 )`,
                                `EMI = ${Pcur} × ${rStr} × ${powStr} ÷ ${denomStr}`,
                                `EMI = (${Pcur} × ${rStr}) × ${powStr} ÷ ${denomStr}`,
                                `EMI = ${pTimesRcur} × ${powStr} ÷ ${denomStr}`,
                                `EMI = ${numerCur} ÷ ${denomStr}`,
                                `EMI = ${emiCur}`,
                              ].join("\n");
                          
                              return (
                                <pre className="bg-slate-900/70 p-4 rounded-lg overflow-x-auto text-[13px] border border-slate-700 mt-3">
                                  <code>{lines}</code>
                                </pre>
                              );
                            })()
                          )}

                  
                        </pre>
                    
                  </div>
                ) : (
                  <div className="text-slate-300 text-center sm:text-left font-mono">
                    <span className="font-semibold">r = 0</span> ⇒ EMI = P / n =
                    {formatCurrency(emiSteps.P, currentLocale, currency)} / {emiSteps.n || 1}
                  </div>
                )}
              
                {/* Visual summary boxes */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center">
                    <div className="text-emerald-300 text-xs uppercase">P × r</div>
                    <div className="font-semibold text-white text-sm truncate">
                      {formatCurrency(emiSteps.pTimesR, currentLocale, currency)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center">
                    <div className="text-rose-300 text-xs uppercase">(1 + r)<sup>n</sup> − 1</div>
                    <div className="font-semibold text-white text-sm truncate">
                      {emiSteps.denominator.toFixed(9)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-center">
                    <div className="text-sky-300 text-xs uppercase">Numerator</div>
                    <div className="font-semibold text-white text-sm truncate">
                      {formatCurrency(emiSteps.numerator, currentLocale, currency)}
                    </div>
                  </div>
                </div>
              
                {/* Final EMI */}
                <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-2 rounded-xl bg-[#0f172a] px-4 py-3 ring-1 ring-emerald-500/30">
                  <span className="text-sm text-emerald-300 whitespace-nowrap">💰 Calculated EMI</span>
                  <span className="text-lg sm:text-xl font-bold tracking-wide text-white">
                    {formatCurrency(emiSteps.emi, currentLocale, currency)}
                  </span>
                </div>
              </div>



              {/* ===== PITI Breakdown ===== */}
              <h2 id="piti" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">🏦 What’s in a Payment: PITI + HOA</h2>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Principal</strong> — amount that reduces your balance.</li>
                <li><strong>Interest</strong> — cost of borrowing.</li>
                <li><strong>Taxes</strong> — property tax (often paid monthly into escrow).</li>
                <li><strong>Insurance</strong> — homeowners insurance (and mortgage insurance when applicable).</li>
                <li><strong>HOA</strong> — homeowners association dues, if any.</li>
              </ul>
              <p className="text-sm text-slate-400">Your displayed “Monthly Payment” can include P+I only or full PITI+HOA, depending on toggles.</p>
            
                        
              {/* ===== Example ===== */}
              <h2 id="example" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
                📈 Example Calculation
              </h2>
              <p>
                Imagine borrowing <strong>$350 000</strong> at an interest rate of <strong>4.5 %</strong> for
                <strong>30 years</strong>. Using the <strong>advanced mortgage calculator</strong>:
              </p>
              <ul>
                <li><strong>Monthly Payment:</strong> $1 773</li>
                <li><strong>Total Interest:</strong> $287 000</li>
                <li><strong>Total Repayment:</strong> $637 000</li>
              </ul>
              <p>
                The tool instantly generates a year-by-year amortization table showing how each payment affects
                your remaining balance and total interest — turning complex math into clear visual data.
              </p>
            
              <h2 id="benefits" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
                ✅ Mortgage Calculator Benefits
              </h2>
              <p>
                The following <strong>mortgage calculator benefits</strong> make this one of the most powerful
                online finance tools:
              </p>
              <ul className="space-y-2">
                <li>✔️ Instant monthly EMI and lifetime interest estimation.</li>
                <li>✔️ Works as both personal and <strong>small-business mortgage calculator</strong>.</li>
                <li>✔️ Allows comparison between fixed, variable, and adjustable-rate loans.</li>
                <li>✔️ Supports prepayment and refinance planning.</li>
                <li>✔️ Cloud-based, mobile-friendly, and privacy-safe — no data saved.</li>
                <li>✔️ Perfect for <strong>beginners</strong> and professionals alike.</li>
              </ul>
              <p>
                Unlike many competitors, this <strong>mortgage calculator website</strong> is completely
                <strong> free</strong>, uses real-time formulas, and delivers transparent results backed by
                accurate financial logic.
              </p>
            
              <h2 id="tips" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
                🧭 Mortgage Planning Tips
              </h2>
              <p>
                Here are some expert <strong>mortgage calculator tips</strong> to save money and shorten your
                loan term:
              </p>
              <ul>
                <li>💡 Make bi-weekly payments to cut years off your mortgage.</li>
                <li>💰 Increase your down payment to lower monthly costs.</li>
                <li>📈 Compare APR from multiple lenders using this calculator before signing.</li>
                <li>🏦 Refinance when rates drop — the calculator shows potential savings instantly.</li>
                <li>🏠 Use the <strong>mortgage calculator guide</strong> to evaluate affordability before applying.</li>
              </ul>
            
              <p>
                Following these insights can reduce overall interest by tens of thousands of dollars.  
                The integrated <strong>mortgage calculator tutorial</strong> walks users through every scenario,
                from first mortgage to refinancing or investment property analysis.
              </p>
            
              <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
                ⚖️ Mortgage Calculator Pros and Cons
              </h2>
              <p>
                Understanding both sides helps set realistic expectations when using online calculators.
              </p>
              <p><strong>Pros:</strong></p>
              <ul>
                <li>Fast and highly accurate results using bank-grade math.</li>
                <li>Visual charts for easy amortization tracking.</li>
                <li>Accessible on desktop, tablet, and mobile.</li>
                <li>Perfect educational tool for <strong>mortgage calculator for beginners</strong>.</li>
              </ul>
              <p><strong>Cons:</strong></p>
              <ul>
                <li>Doesn’t include regional taxes or insurance automatically.</li>
                <li>Relies on user-entered data for accuracy.</li>
                <li>Cannot replace personalized financial advice from a mortgage broker.</li>
              </ul>
            
              <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
                🔍 Alternatives to Online Mortgage Calculators
              </h2>
              <p>
                While spreadsheets or bank portals exist, most lack interactive charts or amortization detail.
                CalculatorHub’s tool combines advanced logic, usability, and free access — making it the 
                <strong> best solution mortgage calculator</strong> for 2026 and beyond.
              </p>
              <p>
                For users who prefer offline access, a <strong>mortgage calculator download</strong> version
                (Excel/CSV) will soon be available, enabling quick calculations without internet connectivity.
              </p>
            
              <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
                🧾 Why Choose CalculatorHub’s Advanced Mortgage Calculator
              </h2>
              <p>
                This tool is more than a number cruncher — it’s a comprehensive home-loan planner.
                It integrates affordability checks, refinance comparison, and amortization analysis, making it
                the <strong>top mortgage calculator 2026</strong> for individuals and businesses alike.
              </p>
              <p>
                Combined with our educational resources, this platform serves as a complete
                <strong> mortgage calculator guide</strong> — empowering users to understand the entire mortgage
                lifecycle from approval to payoff.
              </p>

             {/* ===== Pros / Cons ===== */}
              <h2 id="pros-cons" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">⚖️ Pros and Cons</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
                  <h3 className="text-emerald-300 font-semibold mb-2">Pros</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Bank-grade math &amp; detailed schedules.</li>
                    <li>Visual charts and clear breakdowns.</li>
                    <li>Desktop, tablet, and mobile support.</li>
                  </ul>
                </div>
                <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
                  <h3 className="text-rose-300 font-semibold mb-2">Cons</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Regional taxes/insurance vary; enter your values.</li>
                    <li>Accuracy depends on correct inputs.</li>
                    <li>Not a substitute for professional advice.</li>
                  </ul>
                </div>
              </div>

            
              {/* ===================== FAQ SECTION ===================== */}
              <section className="space-y-6 mt-16">
                <h2 id="faq" className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
                  ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
                </h2>
            
                <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
                  <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                    <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q1: What does a Mortgage Calculator do?</h3>
                    <p>
                      It calculates your expected monthly mortgage payment, total interest, and payoff amount.
                      The <strong>mortgage calculator explained</strong> module visualizes amortization in detail.
                    </p>
                  </div>
            
                  <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                    <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q2: How accurate is the Mortgage Calculator?</h3>
                    <p>
                      It uses precise bank formulas and current lending conventions, offering professional-grade
                      accuracy comparable to lender systems.
                    </p>
                  </div>
            
                  <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                    <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q3: Is this Mortgage Calculator free to use?</h3>
                    <p>
                      Yes. It’s a completely <strong>free mortgage calculator</strong> — no ads, no registrations, and
                      unlimited calculations.
                    </p>
                  </div>
            
                  <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                    <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q4: Can businesses use it?</h3>
                    <p>
                      Absolutely! It doubles as a <strong>small business mortgage calculator</strong> for commercial loans
                      and rental property investments.
                    </p>
                  </div>
            
                  <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                    <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q5: Can I download the calculator?</h3>
                    <p>
                      Yes, an upcoming <strong>mortgage calculator download</strong> option lets you use it offline in Excel
                      or CSV format.
                    </p>
                  </div>
                </div>
              </section>
            </section>
            
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
                        Experts in mortgages and online financial tools. Last updated:{" "}
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
                        to="/home-loan-calculator"
                        className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
                      >
                        <span className="text-indigo-400">🏡</span> Home Loan Calculator
                      </Link>
                
                      <Link
                        to="/loan-affordability-calculator"
                        className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-400 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
                      >
                        <span className="text-sky-400">🏦</span> Loan Affordability Calculator
                      </Link>
                
                      <Link
                        to="/debt-to-income-ratio-calculator"
                        className="flex items-center gap-2 bg-[#0f172a] hover:bg-pink-600/20 text-pink-300 hover:text-pink-400 px-3 py-2 rounded-md border border-slate-700 hover:border-pink-500 transition-all duration-200"
                      >
                        <span className="text-pink-400">💳</span> Debt-to-Income Ratio Calculator
                      </Link>
                    </div>
                  </div>
                </section>

            
            {/* =================== META TAGS FOR SEO HEAD =================== */}
            {/* 
            title: "Mortgage Calculator 2025 – Free Advanced Home Loan & Refinance Estimator"
            description: "Use our free mortgage calculator to estimate monthly payments, interest, and amortization. Advanced home-loan calculator for buyers, investors & small businesses (2025-2026)."
            */}



        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/mortgage-calculator" category="currency-finance" />
      </div>
    </>
  );
};

export default MortgageCalculator;

