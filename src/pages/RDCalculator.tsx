import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
  PiggyBank,
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
const LS_KEY = "rd_calculator_style_v1";

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

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/* ============================================================
   🏦 SECTION 2: Component
   ============================================================ */
const RDCalculator: React.FC = () => {
  /* ---------- Inputs ---------- */
  const [monthlyDeposit, setMonthlyDeposit] = useState<number>(0);
  const [annualRate, setAnnualRate] = useState<number>(0);
  const [years, setYears] = useState<number>(0);
  const [months, setMonths] = useState<number>(0);
  const [compounding, setCompounding] = useState<"monthly" | "quarterly" | "yearly">("quarterly");
  const [currency, setCurrency] = useState<string>("USD");

  /* ---------- Derived & Outputs ---------- */
  const totalMonths = years * 12 + months;
  const depositsTotal = Math.max(monthlyDeposit * totalMonths, 0);
  const r = annualRate / 100; // annual nominal rate

  const currentLocale = findLocale(currency);
  const isDefault = !monthlyDeposit && !annualRate && !years && !months;

  /* ---------- UI state ---------- */
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const [granularity, setGranularity] = useState<"yearly" | "monthly">("yearly");
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [activeTip, setActiveTip] = useState<number>(0);

  /* ============================================================
     🔁 SECTION 3: Normalization & Persistence
     ============================================================ */
  const [hydrated, setHydrated] = useState(false);

  // Normalize months >= 12 → carry to years
  useEffect(() => {
    if (months >= 12) {
      const extraYears = Math.floor(months / 12);
      setYears((prev) => prev + extraYears);
      setMonths(months % 12);
    }
  }, [months]);

  const applyState = (s: any) => {
    setMonthlyDeposit(Number(s.monthlyDeposit) || 0);
    setAnnualRate(Number(s.annualRate) || 0);
    setYears(Number(s.years) || 0);
    setMonths(Number(s.months) || 0);
    setCompounding((s.compounding as any) || "quarterly");
    setCurrency(typeof s.currency === "string" ? s.currency : "USD");
  };

  // On mount → URL (?rdc=) first, else localStorage
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromURL = params.get("rdc");
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
      setHydrated(true);
    }
  }, []);

  // Persist after hydration
  useEffect(() => {
    if (!hydrated) return;
    try {
      const state = { monthlyDeposit, annualRate, years, months, compounding, currency };
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("⚠️ Could not save to localStorage:", err);
    }
  }, [hydrated, monthlyDeposit, annualRate, years, months, compounding, currency]);

  // Mirror to URL when not defaults
  useEffect(() => {
    if (!hydrated) return;
    const allZero = !monthlyDeposit && !annualRate && !years && !months;
    try {
      const url = new URL(window.location.href);
      if (allZero) {
        url.searchParams.delete("rdc");
        window.history.replaceState({}, "", url);
        return;
      }
      const state = { monthlyDeposit, annualRate, years, months, compounding, currency };
      const encoded = btoa(JSON.stringify(state));
      url.searchParams.set("rdc", encoded);
      window.history.replaceState({}, "", url);
    } catch (err) {
      console.warn("⚠️ Failed to update URL:", err);
    }
  }, [hydrated, monthlyDeposit, annualRate, years, months, compounding, currency]);

  /* ============================================================
     🧮 SECTION 4: RD Calculation (accurate simulation)
     ============================================================ */
  type Row = { period: number; deposit: number; interest: number; balance: number };

  const monthlySchedule: Row[] = useMemo(() => {
    if (monthlyDeposit <= 0 || totalMonths <= 0 || annualRate < 0) return [];
    let balance = 0;
    const rows: Row[] = [];

    const applyCompound = (bal: number, freq: "monthly" | "quarterly" | "yearly") => {
      if (r === 0) return bal; // no change
      if (freq === "monthly") return bal * (1 + r / 12);
      if (freq === "quarterly") return bal * (1 + r / 4);
      return bal * (1 + r); // yearly
    };

    for (let m = 1; m <= totalMonths; m++) {
      // deposit at end of each month
      balance += monthlyDeposit;

      let interest = 0;
      let before = balance;

      // credit interest only on compounding boundaries
      if (compounding === "monthly") {
        const after = applyCompound(balance, "monthly");
        interest = after - balance;
        balance = after;
      } else if (compounding === "quarterly" && m % 3 === 0) {
        const after = applyCompound(balance, "quarterly");
        interest = after - balance;
        balance = after;
      } else if (compounding === "yearly" && m % 12 === 0) {
        const after = applyCompound(balance, "yearly");
        interest = after - balance;
        balance = after;
      }

      rows.push({ period: m, deposit: monthlyDeposit, interest: Math.max(interest, 0), balance });
    }
    return rows;
  }, [monthlyDeposit, totalMonths, annualRate, compounding]);

  const yearlySchedule: Row[] = useMemo(() => {
    const yearsCount = Math.ceil(totalMonths / 12);
    const out: Row[] = [];
    for (let y = 0; y < yearsCount; y++) {
      const slice = monthlySchedule.slice(y * 12, y * 12 + 12);
      const deposit = slice.reduce((s, r) => s + r.deposit, 0);
      const interest = slice.reduce((s, r) => s + r.interest, 0);
      const balance = slice.length ? slice[slice.length - 1].balance : 0;
      out.push({ period: y + 1, deposit, interest, balance });
    }
    return out;
  }, [monthlySchedule, totalMonths]);

  const schedule = granularity === "yearly" ? yearlySchedule : monthlySchedule;

  const maturityAmount = useMemo(() => (schedule.length ? schedule[schedule.length - 1].balance : 0), [schedule]);
  const totalInterest = Math.max(maturityAmount - depositsTotal, 0);

  /* ============================================================
     📘 SECTION 4.5: Step-by-step (closed-form helper + live)
     ============================================================ */
  // Closed-form helper (for reference): FV of recurring deposit with uniform contribution each month and compounding c times/year
  // Note: For real-world RDs (like India) banks use quarterly compounding; our simulation reflects that exactly.
  const steps = useMemo(() => {
    const P = Math.max(monthlyDeposit, 0);
    const nMonths = Math.max(totalMonths, 0);
    const c = compounding === "monthly" ? 12 : compounding === "quarterly" ? 4 : 1; // compounding per year

    const i = r / c; // periodic rate
    const periods = (nMonths / 12) * c;

    // Future value of an annuity due at compounding grid (approx when deposits align to months):
    // FV ≈ Pm * [ (1 + i)^periods - 1 ] / (1 - (1 + i)^(-c/12))  (engineering approximation)
    const denom = 1 - Math.pow(1 + i, -(c / 12));
    const numerator = Math.pow(1 + i, periods) - 1;
    const approx = P * (denom !== 0 ? numerator / denom : 0);

    return { P, r, c, i, periods, numerator, denom, approx };
  }, [monthlyDeposit, totalMonths, compounding, r]);

  /* ============================================================
     📊 SECTION 5: Pie & Tips
     ============================================================ */
  const pieData = [
    { name: "Deposits", value: Math.max(depositsTotal, 0) },
    { name: "Interest", value: Math.max(totalInterest, 0) },
  ];
  const interestPct = depositsTotal > 0 ? (totalInterest / depositsTotal) * 100 : 0;

  const tipsForRD = useMemo(() => {
    const base: string[] = [];
    if (depositsTotal && totalInterest)
      base.push(`Over the term, interest forms about ${interestPct.toFixed(0)}% of your total deposits.`);
    base.push("Tip: Quarterly compounding is common for RD. If your bank compounds monthly, switch to ‘Monthly’ for a slightly higher maturity.");
    base.push("Tip: Raising your monthly deposit even 10% can meaningfully raise maturity due to compounding.");
    base.push("Tip: Missing a month lowers maturity and may incur penalties — set an auto-debit if possible.");
    return base;
  }, [depositsTotal, totalInterest, interestPct]);

  useEffect(() => {
    if (!tipsForRD.length) return;
    const t = setInterval(() => setActiveTip((p) => (p + 1) % tipsForRD.length), 5000);
    return () => clearInterval(t);
  }, [tipsForRD]);

  /* ============================================================
     🔗 SECTION 6: Share / Copy / Reset
     ============================================================ */
  const copyResults = async () => {
    const text = [
      `RD Summary`,
      `Monthly Deposit: ${formatCurrency(monthlyDeposit, currentLocale, currency)}`,
      `Rate: ${annualRate}% (compounding: ${compounding})`,
      `Term: ${years}y ${months}m`,
      `Total Deposits: ${formatCurrency(depositsTotal, currentLocale, currency)}`,
      `Maturity Amount: ${formatCurrency(maturityAmount, currentLocale, currency)}`,
      `Interest Earned: ${formatCurrency(totalInterest, currentLocale, currency)}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const encoded = btoa(
      JSON.stringify({ monthlyDeposit, annualRate, years, months, compounding, currency })
    );
    const url = new URL(window.location.href);
    url.searchParams.set("rdc", encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  const reset = () => {
    setMonthlyDeposit(0);
    setAnnualRate(0);
    setYears(0);
    setMonths(0);
    setCompounding("quarterly");
    setCurrency("USD");
    setShowSchedule(false);
    setGranularity("yearly");
    localStorage.removeItem(LS_KEY);
  };

  /* ============================================================
     🎨 SECTION 7: Render
     ============================================================ */
  const seo = seoData?.rdCalculator ?? {
    title: "Recurring Deposit (RD) Calculator | Maturity, Interest & Chart",
    description:
      "Estimate RD maturity amount, total deposits, and interest earned with monthly deposits and monthly/quarterly/yearly compounding in multiple currencies.",
    keywords: [
      "rd calculator",
      "recurring deposit calculator",
      "maturity amount",
      "interest calculator",
    ],
  };

  return (
    <>
	      <SEOHead
        title={seo.title}
        description={seo.description}
        canonical="https://calculatorhub.site/rd-calculator"
        schemaData={generateCalculatorSchema(
          "Recurring Deposit (RD) Calculator",
          seo.description,
          "/rd-calculator",
          seo.keywords || []
        )}
      />

      {/* --- Open Graph & Twitter --- */}
      <>
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="CalculatorHub" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:url" content="https://calculatorhub.site/rd-calculator" />
        <meta
          property="og:image"
          content="https://calculatorhub.site/images/rd-calculator-hero.webp"
        />
        <meta
          property="og:image:alt"
          content="Recurring Deposit (RD) Calculator by CalculatorHub — maturity, deposits, interest breakdown"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@CalculatorHub" />
        <meta name="twitter:creator" content="@CalculatorHub" />
        <meta name="twitter:title" content={seo.title} />
        <meta name="twitter:description" content={seo.description} />
        <meta
          name="twitter:image"
          content="https://calculatorhub.site/images/rd-calculator-hero.webp"
        />

        {/* Structured data: WebPage + Breadcrumb + FAQ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebPage",
                  "@id": "https://calculatorhub.site/rd-calculator",
                  "url": "https://calculatorhub.site/rd-calculator",
                  "name": "Recurring Deposit (RD) Calculator | Maturity, Interest & Chart",
                  "description": seo.description,
                  "inLanguage": "en-US",
                  "isPartOf": {
                    "@type": "WebSite",
                    "name": "CalculatorHub",
                    "url": "https://calculatorhub.site",
                  },
                  "image": {
                    "@type": "ImageObject",
                    "url": "https://calculatorhub.site/images/rd-calculator-hero.webp",
                    "width": 1200,
                    "height": 630,
                  },
                },
                {
                  "@type": "BreadcrumbList",
                  "itemListElement": [
                    {
                      "@type": "ListItem",
                      "position": 1,
                      "name": "Currency & Finance",
                      "item": "https://calculatorhub.site/category/currency-finance",
                    },
                    {
                      "@type": "ListItem",
                      "position": 2,
                      "name": "RD Calculator",
                      "item": "https://calculatorhub.site/rd-calculator",
                    },
                  ],
                },
                {
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "What is a Recurring Deposit (RD)?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text":
                          "An RD is a savings product where you deposit a fixed amount every month for a fixed tenure and earn interest compounded at a set frequency (e.g., quarterly).",
                      },
                    },
                    {
                      "@type": "Question",
                      "name": "Which compounding option should I pick?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text":
                          "Most banks compound RD interest quarterly. If your bank compounds monthly or yearly, choose the matching option for accurate maturity estimation.",
                      },
                    },
                    {
                      "@type": "Question",
                      "name": "Do you store my data?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text":
                          "No. Calculations run locally in your browser. We only use localStorage to remember your last session for convenience on your device.",
                      },
                    },
                    {
                      "@type": "Question",
                      "name": "Can I share my RD results?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text":
                          "Yes. Use the Copy Link button to generate a shareable URL with your inputs encoded so anyone can open the same scenario.",
                      },
                    },
                  ],
                },
              ],
            }),
          }}
        />
      </>

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "RD Calculator", url: "/rd-calculator" },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">🏦 RD Calculator</h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Estimate your Recurring Deposit (RD) maturity amount, total interest earned, and see a
            month-by-month / year-by-year schedule. Choose currency and compounding frequency for a
            precise projection matching your bank.
          </p>
        </div>

        <div className="hidden sm:flex mt-6 mb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white rounded-lg shadow-lg p-4 flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-lg">Compare other finance tools 📊</p>
            <p className="text-sm text-indigo-100">
              Try our Loan EMI, Mortgage, or Currency Converter next!
            </p>
          </div>
          <a
            href="/category/currency-finance"
            className="bg-white text-indigo-700 font-semibold px-4 py-2 rounded-md hover:bg-indigo-50 transition"
          >
            Explore More Calculators
          </a>
        </div>

        {/* Calculator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Card */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 relative text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-sky-400" /> RD Details
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

              {/* Monthly Deposit */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">
                    Monthly Deposit ({findSymbol(currency)})
                  </label>
                  <Info className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="number"
                  value={monthlyDeposit || ""}
                  placeholder={`Enter monthly contribution in ${findSymbol(currency)}`}
                  min={0}
                  onChange={(e) => setMonthlyDeposit(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Annual Rate */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">Annual Interest Rate (%)</label>
                  <Info className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={annualRate || ""}
                  placeholder="Enter annual interest rate (APR)"
                  min={0}
                  onChange={(e) => setAnnualRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Term */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">Tenure</label>
                  <Info className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex gap-4">
                  <input
                    type="number"
                    value={years || ""}
                    placeholder="Years"
                    min={0}
                    onChange={(e) => setYears(parseInt(e.target.value) || 0)}
                    className="w-1/2 bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    value={months || ""}
                    placeholder="Months"
                    min={0}
                    max={11}
                    onChange={(e) => setMonths(parseInt(e.target.value) || 0)}
                    className="w-1/2 bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Total deposits:{" "}
                  <span className="font-semibold text-indigo-300">
                    {totalMonths > 0 ? totalMonths : 0}
                  </span>{" "}
                  months ×{" "}
                  <span className="font-semibold text-indigo-300">
                    {formatCurrency(monthlyDeposit, currentLocale, currency)}
                  </span>{" "}
                  ={" "}
                  <span className="font-semibold text-indigo-300">
                    {formatCurrency(depositsTotal, currentLocale, currency)}
                  </span>
                </p>
              </div>

              {/* Compounding */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Compounding Frequency
                </label>
                <select
                  value={compounding}
                  onChange={(e) =>
                    setCompounding(e.target.value as "monthly" | "quarterly" | "yearly")
                  }
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="monthly">Monthly (12×)</option>
                  <option value="quarterly">Quarterly (4×)</option>
                  <option value="yearly">Yearly (1×)</option>
                </select>
                <p className="text-xs text-slate-400 mt-2">
                  Tip: Banks often use <span className="text-emerald-300 font-semibold">Quarterly</span>{" "}
                  for RD.
                </p>
              </div>
            </div>
          </div>

          {/* Output Card */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">RD Summary</h2>
            <div className="space-y-6">
              <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                <PiggyBank className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(maturityAmount, currentLocale, currency)}
                </div>
                <div className="text-sm text-slate-400">Estimated Maturity Amount</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(totalInterest, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Interest Earned</div>
                </div>
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(depositsTotal, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Total Deposits</div>
                </div>
              </div>

              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex justify-between">
                  <span>Tenure:</span>
                  <span className="font-medium text-indigo-300">
                    {years} years {months} months
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Interest Rate:</span>
                  <span className="font-medium text-indigo-300">{annualRate || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Compounding:</span>
                  <span className="font-medium text-indigo-300 capitalize">{compounding}</span>
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

        {/* Smart Tip Box */}
        {depositsTotal > 0 && (
          <div className="mt-4 w-full relative">
            <div className="bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm min-h-[50px] w-full flex items-center">
              <div className="mr-3 flex items-center justify-center w-8 h-8">
                <span className="text-2xl text-indigo-400">💡</span>
              </div>
              <div className="w-full">
                <p className="text-base font-medium leading-snug text-slate-300">
                  {
                    ([
                      ...tipsForRD,
                    ] as string[])[activeTip]
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chart + Quick Summary */}
        {depositsTotal > 0 && totalMonths > 0 && (
          <div className="mt-5 bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              RD Insights & Breakdown
            </h3>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Chart */}
              <div className="w-[90%] sm:w-[80%] md:w-[70%] max-w-[360px] h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={2}>
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={["#3b82f6", "#a855f7"][index % 2]} />
                      ))}
                    </Pie>
                    <ReTooltip
                      formatter={(v: any) => formatCurrency(Number(v), currentLocale, currency)}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Summary */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-emerald-500 transition">
                  <p className="text-sm text-slate-400">Maturity Amount</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(maturityAmount, currentLocale, currency)}
                  </p>
                </div>

                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-indigo-500 transition">
                  <p className="text-sm text-slate-400">Total Deposits</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(depositsTotal, currentLocale, currency)}
                  </p>
                </div>

                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-rose-500 transition">
                  <p className="text-sm text-slate-400">Interest Earned</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(totalInterest, currentLocale, currency)}
                  </p>
                </div>

                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-cyan-500 transition">
                  <p className="text-sm text-slate-400">Interest % of Deposits</p>
                  <p className="font-semibold text-white text-lg">
                    {depositsTotal > 0 ? `${((totalInterest / depositsTotal) * 100).toFixed(1)}%` : "0%"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule */}
        {depositsTotal > 0 && totalMonths > 0 && (
          <div className="mt-10 bg-gradient-to-br from-[#1e293b] via-[#111827] to-[#0f172a] rounded-2xl border border-indigo-600/40 shadow-xl overflow-hidden">
            <button
              onClick={() => setShowSchedule((v) => !v)}
              className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold text-lg tracking-wide hover:opacity-90 transition-all"
            >
              <span>📊 RD Schedule</span>
              {showSchedule ? <ChevronUp /> : <ChevronDown />}
            </button>

            {showSchedule && (
              <div className="px-6 pb-8 pt-4">
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

                <div className="overflow-x-auto rounded-xl border border-[#334155] shadow-inner">
                  <table className="min-w-full text-sm text-slate-100">
                    <thead className="bg-[#0f172a]">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-indigo-300">
                          {granularity === "yearly" ? "Year" : "Month"}
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-emerald-300">
                          Deposit
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
                      {schedule.map((r) => (
                        <tr
                          key={r.period}
                          className="transition-colors duration-200 odd:bg-[#1e293b]/60 even:bg-[#0f172a]/60 hover:bg-[#3b82f6]/10"
                        >
                          <td className="px-4 py-2">{r.period}</td>
                          <td className="px-4 py-2 text-right text-emerald-300 font-medium">
                            {formatCurrency(r.deposit, currentLocale, currency)}
                          </td>
                          <td className="px-4 py-2 text-right text-rose-300 font-medium">
                            {formatCurrency(r.interest, currentLocale, currency)}
                          </td>
                          <td className="px-4 py-2 text-right text-cyan-300 font-medium">
                            {formatCurrency(r.balance, currentLocale, currency)}
                          </td>
                        </tr>
                      ))}
                      {schedule.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-slate-400 italic">
                            Enter valid details to view schedule.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="h-2 w-full mt-6 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 blur-[2px]" />
              </div>
            )}
          </div>
        )}

          {/* ======== SEO Content ======== */}
          <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
            {/* ===== Table of Contents ===== */}
            <nav className="mt-16 mb-8 bg-[#0f172a] border border-[#334155] rounded-xl p-5 text-slate-200">
              <h2 className="text-lg font-semibold text-cyan-300 mb-3">📖 Table of Contents</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li><a href="#what-is-rd" className="text-indigo-400 hover:underline">What is Recurring Deposit Calculator</a></li>
                <li><a href="#rd-explained" className="text-indigo-400 hover:underline">Recurring Deposit Calculator Explained</a></li>
                <li><a href="#how-to-use" className="text-indigo-400 hover:underline">How to Use Recurring Deposit Calculator</a></li>
                <li><a href="#tutorial" className="text-indigo-400 hover:underline">Recurring Deposit Calculator Tutorial</a></li>
                <li><a href="#tips" className="text-indigo-400 hover:underline">Recurring Deposit Calculator Tips</a></li>
                <li><a href="#comparison" className="text-indigo-400 hover:underline">Recurring Deposit Calculator Comparison</a></li>
                <li><a href="#pricing" className="text-indigo-400 hover:underline">Recurring Deposit Calculator Price & Deals</a></li>
                <li><a href="#online" className="text-indigo-400 hover:underline">Recurring Deposit Calculator Online</a></li>
                <li><a href="#best" className="text-indigo-400 hover:underline">Best & Premium Options</a></li>
                <li><a href="#faq" className="text-indigo-400 hover:underline">Frequently Asked Questions</a></li>
              </ol>
            </nav>
          
            <h1 className="text-3xl font-bold text-cyan-400 mb-6">
              Recurring Deposit (RD) Calculator 2025 – Simple, Accurate & Beginner-Friendly
            </h1>
          
            <p>
              The <strong>RD Calculator by CalculatorHub</strong> helps users estimate their{" "}
              <strong>maturity amount</strong>, <strong>interest earned</strong>, and{" "}
              <strong>detailed monthly schedule</strong> with realistic compounding. Designed for clarity, this
              <strong> tool Recurring Deposit Calculator</strong> provides instant, precise results — perfect for savers, students, and small businesses.
            </p>
          
            <figure className="my-8">
              <img
                src="/images/rd-calculator-hero.webp"
                alt="Modern RD calculator UI showing maturity, pie chart, and schedule"
                title="Recurring Deposit Calculator 2025 | Free Maturity & Interest Tool"
                className="rounded-lg shadow-md border border-slate-700 mx-auto"
                loading="lazy"
              />
              <figcaption className="text-center text-sm text-slate-400 mt-2">
                Visual representation of the RD Calculator with dark-finance UI.
              </figcaption>
            </figure>
          
            {/* What is RD Calculator */}
            <h2 id="what-is-rd" className="text-2xl font-semibold text-cyan-300 mt-10 mb-3">
              📌 What is Recurring Deposit Calculator
            </h2>
            <p>
              A <strong>Recurring Deposit Calculator</strong> helps estimate how monthly contributions grow under compound interest.
              It answers <em>what is Recurring Deposit Calculator</em> in practice — a digital tool that quickly forecasts maturity value
              before committing to a bank RD account.
            </p>
          
            {/* Explained */}
            <h2 id="rd-explained" className="text-2xl font-semibold text-cyan-300 mt-10 mb-3">
              🧮 Recurring Deposit Calculator Explained
            </h2>
            <p>
              This <strong>advanced Recurring Deposit Calculator</strong> simulates each deposit and applies
              compounding monthly, quarterly, or yearly. It’s accurate to banking standards and provides both
              quick overviews and full schedules. The <strong>simple Recurring Deposit Calculator</strong> mode offers totals,
              while the detailed mode shows breakdowns and visual charts.
            </p>
          
            {/* How to Use */}
            <h2 id="how-to-use" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              💡 How to Use Recurring Deposit Calculator
            </h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Select your preferred <strong>currency</strong>.</li>
              <li>Enter your <strong>monthly deposit</strong> amount.</li>
              <li>Provide the <strong>annual interest rate</strong> and select <strong>compounding</strong> frequency.</li>
              <li>Set the <strong>tenure</strong> in years and months.</li>
              <li>Click calculate to view maturity, total deposits, and interest earned.</li>
              <li>Copy results or share a link for comparison.</li>
            </ol>


              {/* Step-by-step math */}
          <h2
            id="how-rd-works"
            className="mt-12 mb-3 text-2xl font-extrabold tracking-tight text-center sm:text-left"
          >
            <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
              🧮 How RD is Calculated
            </span>
          </h2>

          <p className="mb-4 text-slate-300 text-sm sm:text-base">
            We simulate monthly deposits and apply interest on the chosen compounding boundaries
            (monthly, quarterly, or yearly). Below is an engineering approximation that matches the
            compounding grid:
          </p>

          <div className="relative rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-[#0b1220]/90 p-4 sm:p-6 ring-1 ring-indigo-500/30 shadow-xl text-[13.5px] sm:text-sm leading-relaxed">
            <div className="pointer-events-none absolute inset-x-0 -top-0.5 h-0.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-emerald-500 opacity-60" />

            <p className="mb-4 text-center font-mono text-[15px] leading-7 text-indigo-300">
              Approx. FV ≈{" "}
              <span className="text-sky-300">
                P × \[ (1 + i)<sup>k</sup> − 1 \] / \[ 1 − (1 + i)<sup>−c/12</sup> \]
              </span>
              <br />
              where P = monthly deposit, c = compounds/year, i = r / c, k = (months/12) × c
            </p>

            {/* Inputs row */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 mb-4">
              <div className="flex flex-wrap justify-between items-center gap-1 sm:gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-cyan-500/20">
                <span className="font-semibold text-cyan-300">P</span>
                <span className="text-slate-300">Monthly deposit</span>
                <span className="font-semibold text-white truncate">
                  {formatCurrency(steps.P, currentLocale, currency)}
                </span>
              </div>

              <div className="flex flex-wrap justify-between items-center gap-1 sm:gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-amber-500/20">
                <span className="font-semibold text-amber-300">i</span>
                <span className="text-slate-300">Periodic rate (r/c)</span>
                <span className="font-semibold text-white truncate">{steps.i.toFixed(8)}</span>
              </div>

              <div className="flex flex-wrap justify-between items-center gap-1 sm:gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-fuchsia-500/20">
                <span className="font-semibold text-fuchsia-300">k</span>
                <span className="text-slate-300"># of periods</span>
                <span className="font-semibold text-white truncate">{steps.periods.toFixed(4)}</span>
              </div>
            </div>

            <div className="my-3 h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

            <div className="space-y-2 font-mono break-words">
              <div className="flex flex-wrap justify-between">
                <span className="font-semibold text-sky-300">(1 + i)<sup>k</sup> − 1</span>
                <span className="text-white">{steps.numerator.toFixed(9)}</span>
              </div>
              <div className="flex flex-wrap justify-between">
                <span className="font-semibold text-rose-300">1 − (1 + i)<sup>−c/12</sup></span>
                <span className="text-white">{steps.denom.toFixed(9)}</span>
              </div>

              <div className="my-3 h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

              <div className="overflow-x-auto rounded-md bg-[#0f172a] px-3 py-2 border border-slate-700 text-slate-300 text-[13px] whitespace-nowrap">
                <div className="min-w-max">
                  <span className="font-semibold text-slate-100">Approx FV</span> =
                  <span className="text-white">
                    {" "}
                    {formatCurrency(steps.P, currentLocale, currency)}{" "}
                  </span>
                  ×{" "}
                  <span className="text-white">
                    {steps.numerator.toFixed(6)} ÷ {steps.denom.toFixed(6)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center">
                <div className="text-emerald-300 text-xs uppercase">c (per year)</div>
                <div className="font-semibold text-white text-sm truncate">{steps.c}</div>
              </div>
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center">
                <div className="text-rose-300 text-xs uppercase">i = r / c</div>
                <div className="font-semibold text-white text-sm truncate">{steps.i.toFixed(8)}</div>
              </div>
              <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-center">
                <div className="text-sky-300 text-xs uppercase">Approx FV</div>
                <div className="font-semibold text-white text-sm truncate">
                  {formatCurrency(steps.approx, currentLocale, currency)}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-2 rounded-xl bg-[#0f172a] px-4 py-3 ring-1 ring-emerald-500/30">
              <span className="text-sm text-emerald-300 whitespace-nowrap">
                💰 Simulated Maturity (more precise)
              </span>
              <span className="text-lg sm:text-xl font-bold tracking-wide text-white">
                {formatCurrency(maturityAmount, currentLocale, currency)}
              </span>
            </div>
          </div>
          
            {/* Tutorial */}
            <h2 id="tutorial" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              🟣 Recurring Deposit Calculator Tutorial
            </h2>
            <p>
              For an <strong>easy Recurring Deposit Calculator</strong> start, input small numbers — say $500 per month for 3 years at 7%.
              Try toggling compounding between quarterly and monthly to see the change. This short guide doubles as a{" "}
              <strong>Recurring Deposit Calculator tutorial</strong> for first-time users.
            </p>
          
            {/* Tips */}
            <h2 id="tips" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              🧠 Recurring Deposit Calculator Tips
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Quarterly compounding is most common for RD accounts.</li>
              <li>Increasing your monthly deposit slightly can significantly raise total maturity.</li>
              <li>Use auto-debit to avoid missing contributions.</li>
              <li>Experiment with tenures to balance liquidity and growth.</li>
            </ul>
          
            {/* Comparison */}
            <h2 id="comparison" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              🔍 Recurring Deposit Calculator Comparison
            </h2>
            <p>
              Users often compare <strong>free Recurring Deposit Calculator</strong> tools against premium or
              <strong> advanced Recurring Deposit Calculator</strong> apps. Free tools give quick projections,
              while premium ones include graphs, export options, and multi-currency support. For most users,
              CalculatorHub’s tool combines both simplicity and precision.
            </p>
          
            {/* Pricing */}
            <h2 id="pricing" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              💸 Recurring Deposit Calculator Price & Deals
            </h2>
            <p>
              The <strong>best Recurring Deposit Calculator</strong> should be free and accurate. While some
              sites promote <strong>Recurring Deposit Calculator deals</strong> or premium plans, CalculatorHub
              keeps its <strong>free Recurring Deposit Calculator</strong> open to everyone — without hidden costs.
              If a <strong>Recurring Deposit Calculator price</strong> appears elsewhere, check for added features
              like PDF exports or saved portfolios before paying.
            </p>
          
            {/* Online */}
            <h2 id="online" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              🌐 Recurring Deposit Calculator Online
            </h2>
            <p>
              Using a <strong>Recurring Deposit Calculator online</strong> is fast and secure. It runs in your browser,
              stores no personal data, and gives results instantly. You can also share your setup via link,
              making it great for team or small business finance planning.
            </p>
          
            {/* Best */}
            <h2 id="best" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              🏆 Best & Premium Options
            </h2>
            <p>
              The <strong>premium Recurring Deposit Calculator</strong> experience on CalculatorHub offers
              visuals, breakdowns, and privacy — all free. It’s rated among the <strong>best Recurring Deposit Calculator</strong>
              options online for both accuracy and design.
            </p>
          
            {/* FAQ */}
            <section id="faq" className="space-y-6 mt-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
                ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
              </h2>
          
              <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-yellow-300">How accurate are RD results?</h3>
                  <p>
                    Results are simulated monthly and compounded exactly as per your chosen frequency.
                    This makes them as close as possible to real-world RD outcomes.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-yellow-300">Can I share my results?</h3>
                  <p>
                    Yes, every configuration can generate a sharable URL. Copy the link and revisit
                    or compare scenarios instantly.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-yellow-300">Is this free to use?</h3>
                  <p>
                    Absolutely. CalculatorHub provides a <strong>free Recurring Deposit Calculator</strong>
                    with premium-grade accuracy, all running locally in your browser.
                  </p>
                </div>
              </div>
            </section>
          </section>


        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/rd-calculator" category="currency-finance" />
      </div>
    </>
  );
};

export default RDCalculator;

      