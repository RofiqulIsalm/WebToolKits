import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import {
  Briefcase, // icon for work/retirement
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
import { seoData, generateCalculatorSchema } from "../utils/seoData";
import RelatedCalculators from "../components/RelatedCalculators";

/* ============================================================
   📦 SECTION 1: Constants & Utilities
   ============================================================ */
const LS_KEY = "retirement_calculator_style_v1";   // localStorage key
const URL_KEY = "rtc";                              // query key (?rtc=...)

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

const formatCurrency = (num: number, locale: string, currency: string, maxFrac = 0) => {
  if (!isFinite(num) || num <= 0) return `${findSymbol(currency)}0`;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: maxFrac,
  }).format(num);
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/* ============================================================
   🧮 Helper math (we’ll use in Part 2)
   ============================================================ */
const fv = (pv: number, ratePer: number, n: number) => pv * Math.pow(1 + ratePer, n);
const fva = (pmt: number, ratePer: number, n: number, annuityDue = false) => {
  if (ratePer === 0) return pmt * n;
  const factor = (Math.pow(1 + ratePer, n) - 1) / ratePer;
  return annuityDue ? pmt * (1 + ratePer) * factor : pmt * factor;
};

/* ============================================================
   🧓 SECTION 2: Component
   ============================================================ */
const RetirementCalculator: React.FC = () => {
  /* ---------- Inputs (accumulation) ---------- */
  const [currentAge, setCurrentAge] = useState<number>(30);
  const [retireAge, setRetireAge] = useState<number>(60);
  const [lifeExpectancy, setLifeExpectancy] = useState<number>(85);

  const [currentSavings, setCurrentSavings] = useState<number>(0);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(0);
  const [annualReturnPre, setAnnualReturnPre] = useState<number>(7); // % before retirement
  const [annualReturnPost, setAnnualReturnPost] = useState<number>(4); // % after retirement
  const [inflation, setInflation] = useState<number>(3); // % CPI

  /* ---------- Inputs (withdrawal goal) ---------- */
  const [desiredMonthlyIncomeToday, setDesiredMonthlyIncomeToday] = useState<number>(0); // in today's money

  /* ---------- Meta ---------- */
  const [currency, setCurrency] = useState<string>("USD");
  const currentLocale = findLocale(currency);

  /* ---------- Derived timeframes ---------- */
  const yearsToRetire = Math.max(retireAge - currentAge, 0);
  const yearsInRetirement = Math.max(lifeExpectancy - retireAge, 0);
  const monthsToRetire = yearsToRetire * 12;
  const monthsInRetirement = yearsInRetirement * 12;

  /* ---------- UI state ---------- */
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const [granularity, setGranularity] = useState<"yearly" | "monthly">("yearly");
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [activeTip, setActiveTip] = useState<number>(0);

  // --- Info toggles (put near other UI state) ---
  const [showAgeInfo, setShowAgeInfo] = useState(false);
  const [showReturnInfo, setShowReturnInfo] = useState(false);
  const [showInflationInfo, setShowInflationInfo] = useState(false);
  const [showIncomeInfo, setShowIncomeInfo] = useState(false);
  

  const isDefault =
    currentSavings === 0 &&
    monthlyContribution === 0 &&
    desiredMonthlyIncomeToday === 0 &&
    annualReturnPre === 7 &&
    annualReturnPost === 4 &&
    inflation === 3 &&
    currentAge === 30 &&
    retireAge === 60 &&
    lifeExpectancy === 85;

  /* ============================================================
     🔁 SECTION 3: Hydration, Persistence, URL State
     ============================================================ */
  const [hydrated, setHydrated] = useState(false);

  const applyState = (s: any) => {
    setCurrentAge(Number(s.currentAge) || 0);
    setRetireAge(Number(s.retireAge) || 0);
    setLifeExpectancy(Number(s.lifeExpectancy) || 0);

    setCurrentSavings(Number(s.currentSavings) || 0);
    setMonthlyContribution(Number(s.monthlyContribution) || 0);
    setAnnualReturnPre(Number(s.annualReturnPre) || 0);
    setAnnualReturnPost(Number(s.annualReturnPost) || 0);
    setInflation(Number(s.inflation) || 0);

    setDesiredMonthlyIncomeToday(Number(s.desiredMonthlyIncomeToday) || 0);

    setCurrency(typeof s.currency === "string" ? s.currency : "USD");
    setGranularity((s.granularity as any) === "monthly" ? "monthly" : "yearly");
  };

  // On mount: URL first, then localStorage
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
        const saved = JSON.parse(raw);
        applyState(saved);
      }
    } catch (e) {
      console.warn("⚠️ Failed to load persisted state:", e);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist after hydration
  useEffect(() => {
    if (!hydrated) return;
    try {
      const state = {
        currentAge,
        retireAge,
        lifeExpectancy,
        currentSavings,
        monthlyContribution,
        annualReturnPre,
        annualReturnPost,
        inflation,
        desiredMonthlyIncomeToday,
        currency,
        granularity,
      };
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("⚠️ Could not save to localStorage:", e);
    }
  }, [
    hydrated,
    currentAge,
    retireAge,
    lifeExpectancy,
    currentSavings,
    monthlyContribution,
    annualReturnPre,
    annualReturnPost,
    inflation,
    desiredMonthlyIncomeToday,
    currency,
    granularity,
  ]);

  // Mirror to URL
  useEffect(() => {
    if (!hydrated) return;
    try {
      const state = {
        currentAge,
        retireAge,
        lifeExpectancy,
        currentSavings,
        monthlyContribution,
        annualReturnPre,
        annualReturnPost,
        inflation,
        desiredMonthlyIncomeToday,
        currency,
        granularity,
      };
      const encoded = btoa(JSON.stringify(state));
      const url = new URL(window.location.href);
      url.searchParams.set(URL_KEY, encoded);
      window.history.replaceState({}, "", url);
    } catch (e) {
      console.warn("⚠️ Failed to update URL:", e);
    }
  }, [
    hydrated,
    currentAge,
    retireAge,
    lifeExpectancy,
    currentSavings,
    monthlyContribution,
    annualReturnPre,
    annualReturnPost,
    inflation,
    desiredMonthlyIncomeToday,
    currency,
    granularity,
  ]);

  /* ============================================================
     🧮 SECTION 4: Core Calculations (scaffold for Part 2)
     ============================================================ */
  // Periodic rates
  const realReturnPreY = Math.max(annualReturnPre - inflation, -100); // rough real return (approx)
  const realReturnPostY = Math.max(annualReturnPost - inflation, -100);

  const rPreM = (annualReturnPre / 100) / 12;     // nominal monthly pre-ret
  const rPostM = (annualReturnPost / 100) / 12;   // nominal monthly post-ret
  const infM = (inflation / 100) / 12;

  // 1) Accumulation to retirement (future value of current savings + contributions)
  const futureOfCurrent = useMemo(() => fv(currentSavings, rPreM, monthsToRetire), [currentSavings, rPreM, monthsToRetire]);
  const futureOfContribs = useMemo(
    () => fva(monthlyContribution, rPreM, monthsToRetire, true), // annuity-due (contrib at month start)
    [monthlyContribution, rPreM, monthsToRetire]
  );
  const nestEggAtRetirement = useMemo(
    () => Math.max(futureOfCurrent + futureOfContribs, 0),
    [futureOfCurrent, futureOfContribs]
  );

  // 2) Income need at retirement (inflation adjusted to first retirement month)
  const desiredIncomeAtRetStartMonthly = useMemo(() => {
    if (desiredMonthlyIncomeToday <= 0) return 0;
    return desiredMonthlyIncomeToday * Math.pow(1 + infM, monthsToRetire);
  }, [desiredMonthlyIncomeToday, infM, monthsToRetire]);

  // 3) Safe sustainable withdrawal (simple level monthly withdrawal; Part 2 will add schedule)
  // PV of level withdrawals over retirement horizon discounted at post-retirement monthly rate
  const pvFactorWithdrawals = useMemo(() => {
    if (monthsInRetirement <= 0) return 0;
    if (rPostM === 0) return monthsInRetirement;
    return (1 - Math.pow(1 + rPostM, -monthsInRetirement)) / rPostM;
  }, [rPostM, monthsInRetirement]);

  const requiredNestEggForGoal = useMemo(() => {
    // Amount needed at retirement to fund desired inflation-adjusted first-month income,
    // assuming flat (non-escalating) withdrawals — Part 2 will include inflation-indexed option.
    return desiredIncomeAtRetStartMonthly * pvFactorWithdrawals;
  }, [desiredIncomeAtRetStartMonthly, pvFactorWithdrawals]);

  const surplusOrShortfall = useMemo(
    () => nestEggAtRetirement - requiredNestEggForGoal,
    [nestEggAtRetirement, requiredNestEggForGoal]
  );

  /* ============================================================
     🔗 SECTION 5: Share / Copy / Reset (handlers only – UI in Part 2)
     ============================================================ */
  const copyResults = async () => {
    const text = [
      `Retirement Summary`,
      `Ages: ${currentAge} → ${retireAge} (retire), life expectancy ${lifeExpectancy}`,
      `Current Savings: ${formatCurrency(currentSavings, currentLocale, currency)}`,
      `Monthly Contribution: ${formatCurrency(monthlyContribution, currentLocale, currency)}`,
      `Pre-Ret Return: ${annualReturnPre}% | Post-Ret Return: ${annualReturnPost}% | Inflation: ${inflation}%`,
      `Desired Income (today): ${formatCurrency(desiredMonthlyIncomeToday, currentLocale, currency)}/mo`,
      `Nest Egg @ Retirement: ${formatCurrency(nestEggAtRetirement, currentLocale, currency)}`,
      `Req. Nest Egg for Goal: ${formatCurrency(requiredNestEggForGoal, currentLocale, currency)}`,
      `Surplus / Shortfall: ${formatCurrency(surplusOrShortfall, currentLocale, currency)}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const state = {
      currentAge,
      retireAge,
      lifeExpectancy,
      currentSavings,
      monthlyContribution,
      annualReturnPre,
      annualReturnPost,
      inflation,
      desiredMonthlyIncomeToday,
      currency,
      granularity,
    };
    const encoded = btoa(JSON.stringify(state));
    const url = new URL(window.location.href);
    url.searchParams.set(URL_KEY, encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  const reset = () => {
    setCurrentAge(30);
    setRetireAge(60);
    setLifeExpectancy(85);
    setCurrentSavings(0);
    setMonthlyContribution(0);
    setAnnualReturnPre(7);
    setAnnualReturnPost(4);
    setInflation(3);
    setDesiredMonthlyIncomeToday(0);
    setCurrency("USD");
    setGranularity("yearly");
    setShowSchedule(false);
    localStorage.removeItem(LS_KEY);
  };

  /* ============================================================
     🎨 SECTION 6: (UI + SEO) will start in Part 2
     ============================================================ */
  const seo = seoData?.retirementCalculator ?? {
    title: "Retirement Calculator | Nest Egg, Income & Plan",
    description:
      "Project your retirement nest egg, income needs, and surplus/shortfall with inflation, multi-currency, and monthly contributions.",
    keywords: [
      "retirement calculator",
      "nest egg calculator",
      "retirement income planner",
      "financial independence",
    ],
  };

    /* ============================================================
     📊 SECTION 6.5: Tips, Pie, and Schedules
     ============================================================ */
  // Tips rotator
    const tipsForRetirement = useMemo(() => {
      const arr: string[] = [];
      if (monthlyContribution > 0 && yearsToRetire > 0)
        arr.push("Tip: Raising monthly contributions even 10% can materially boost your nest egg.");
      if (annualReturnPre > annualReturnPost)
        arr.push("Tip: Use a lower post-retirement return assumption for safer planning.");
      if (inflation > 0)
        arr.push("Tip: Keep increases to your target income indexed to inflation.");
      if (surplusOrShortfall < 0)
        arr.push("Tip: Shortfall? Adjust contributions, retirement age, or desired income.");
      arr.push("Tip: Revisit your plan yearly and after big life events.");
      return arr;
    }, [monthlyContribution, yearsToRetire, annualReturnPre, annualReturnPost, inflation, surplusOrShortfall]);
    
    useEffect(() => {
      if (!tipsForRetirement.length) return;
      const t = setInterval(() => setActiveTip((p) => (p + 1) % tipsForRetirement.length), 5000);
      return () => clearInterval(t);
    }, [tipsForRetirement]);
    
    // Pie data
    const pieData = [
      { name: "Nest Egg @ Retirement", value: Math.max(nestEggAtRetirement, 0) },
      { name: "Required for Goal", value: Math.max(requiredNestEggForGoal, 0) },
      { name: surplusOrShortfall >= 0 ? "Surplus" : "Shortfall", value: Math.abs(surplusOrShortfall) },
    ];
    
    /* ---------- Accumulation Schedule (monthly + yearly) ---------- */
    // Monthly: simulate month-by-month with annuity-due contributions
    type AccRow = { period: number; contribution: number; interest: number; balance: number };
    const accumMonthly: AccRow[] = useMemo(() => {
      if (monthsToRetire <= 0 || (currentSavings <= 0 && monthlyContribution <= 0)) return [];
      let bal = currentSavings;
      const rows: AccRow[] = [];
      for (let m = 1; m <= monthsToRetire; m++) {
        // contribution at beginning of month (annuity due)
        if (monthlyContribution > 0) {
          bal += monthlyContribution;
        }
        const before = bal;
        if (rPreM > 0) bal *= 1 + rPreM;
        const interest = bal - before;
        rows.push({ period: m, contribution: monthlyContribution, interest: Math.max(interest, 0), balance: bal });
      }
      return rows;
    }, [monthsToRetire, currentSavings, monthlyContribution, rPreM]);
    
    const accumYearly: AccRow[] = useMemo(() => {
      if (!accumMonthly.length) return [];
      const years = Math.ceil(monthsToRetire / 12);
      const out: AccRow[] = [];
      for (let y = 0; y < years; y++) {
        const slice = accumMonthly.slice(y * 12, y * 12 + 12);
        const contribution = slice.reduce((s, r) => s + r.contribution, 0);
        const interest = slice.reduce((s, r) => s + r.interest, 0);
        const balance = slice.length ? slice[slice.length - 1].balance : 0;
        out.push({ period: y + 1, contribution, interest, balance });
      }
      return out;
    }, [accumMonthly, monthsToRetire]);
    
    /* ---------- Withdrawal Schedule (flat withdrawals) ---------- */
    // NOTE: For simplicity, we show level (non-inflation-escalating) withdrawals.
    // (You can extend later to index withdrawals by inflation.)
    type WdrRow = { period: number; withdrawal: number; interest: number; balance: number };
    const withdrawalMonthly: WdrRow[] = useMemo(() => {
      if (monthsInRetirement <= 0 || nestEggAtRetirement <= 0 || desiredIncomeAtRetStartMonthly <= 0) return [];
      let bal = nestEggAtRetirement;
      const rows: WdrRow[] = [];
      for (let m = 1; m <= monthsInRetirement; m++) {
        // apply growth first for the month
        if (rPostM > 0) {
          const before = bal;
          bal *= 1 + rPostM;
          const interest = bal - before;
          // then withdraw at end of month
          const w = Math.min(bal, desiredIncomeAtRetStartMonthly);
          bal = Math.max(bal - w, 0);
          rows.push({ period: m, withdrawal: w, interest: Math.max(interest, 0), balance: bal });
        } else {
          const w = Math.min(bal, desiredIncomeAtRetStartMonthly);
          rows.push({ period: m, withdrawal: w, interest: 0, balance: Math.max(bal - w, 0) });
          bal = Math.max(bal - w, 0);
        }
        if (bal <= 0) break; // stop when depleted
      }
      return rows;
    }, [monthsInRetirement, nestEggAtRetirement, desiredIncomeAtRetStartMonthly, rPostM]);
    
    const withdrawalYearly: WdrRow[] = useMemo(() => {
      if (!withdrawalMonthly.length) return [];
      const years = Math.ceil(withdrawalMonthly.length / 12);
      const out: WdrRow[] = [];
      for (let y = 0; y < years; y++) {
        const slice = withdrawalMonthly.slice(y * 12, y * 12 + 12);
        const withdrawal = slice.reduce((s, r) => s + r.withdrawal, 0);
        const interest = slice.reduce((s, r) => s + r.interest, 0);
        const balance = slice.length ? slice[slice.length - 1].balance : 0;
        out.push({ period: y + 1, withdrawal, interest, balance });
      }
      return out;
    }, [withdrawalMonthly]);


  return (
    <>
              <SEOHead
                  title={seo.title}
                  description={seo.description}
                  canonical="https://calculatorhub.site/retirement-calculator"
                  schemaData={generateCalculatorSchema(
                    "Retirement Calculator",
                    seo.description,
                    "/retirement-calculator",
                    seo.keywords || []
                  )}
                />
          
                {/* --- Open Graph & Twitter Meta --- */}
                
                  
              
          
                <div className="max-w-5xl mx-auto">
                  <Breadcrumbs
                    items={[
                      { name: "Currency & Finance", url: "/category/currency-finance" },
                      { name: "Retirement Calculator", url: "/retirement-calculator" },
                    ]}
                  />
          
                  {/* ===== Header ===== */}
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                      🧓 Retirement Calculator
                    </h1>
                    <p className="mt-3 text-slate-400 text-sm leading-relaxed">
                      Project your nest egg, estimate the required corpus to fund your retirement income, and
                      see your surplus/shortfall with inflation, pre/post-retirement returns, and monthly contributions.
                    </p>
                  </div>
          
                  <div className="hidden sm:flex mt-6 mb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white rounded-lg shadow-lg p-4 flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-lg">Compare other finance tools 📊</p>
                      <p className="text-sm text-indigo-100">Try Mortgage, RD, or Currency Converter next!</p>
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
                    {/* ---------- Input Card ---------- */}
                    <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 relative text-slate-200">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-sky-400" /> Plan Inputs
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
          
                        {/* Ages */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-sm font-medium text-slate-300">Ages</label>
                            <button
                              type="button"
                              className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-400"
                              onClick={() => setShowAgeInfo((v) => !v)}
                            >
                              <Info className="h-4 w-4" /> Info
                            </button>
                          </div>
                          {showAgeInfo && (
                            <div className="mb-2 bg-[#0f172a] text-slate-300 text-xs p-2 rounded-md border border-[#334155]">
                              Set your current age, target retirement age, and life expectancy to define the
                              accumulation period and withdrawal horizon.
                            </div>
                          )}
                          <div className="grid grid-cols-3 gap-3">
                            <input
                              type="number"
                              value={currentAge}
                              min={0}
                              max={120}
                              onChange={(e) => setCurrentAge(clamp(parseInt(e.target.value) || 0, 0, retireAge))}
                              placeholder="Current"
                              className="bg-[#0f172a] text-white px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                            <input
                              type="number"
                              value={retireAge}
                              min={currentAge}
                              max={120}
                              onChange={(e) => setRetireAge(clamp(parseInt(e.target.value) || 0, currentAge, 120))}
                              placeholder="Retire"
                              className="bg-[#0f172a] text-white px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                            <input
                              type="number"
                              value={lifeExpectancy}
                              min={retireAge}
                              max={130}
                              onChange={(e) =>
                                setLifeExpectancy(clamp(parseInt(e.target.value) || 0, retireAge, 130))
                              }
                              placeholder="Life Exp."
                              className="bg-[#0f172a] text-white px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <p className="text-xs text-slate-400 mt-2">
                            Saving window:{" "}
                            <span className="text-indigo-300 font-semibold">{yearsToRetire}</span> years ·
                            Retirement horizon:{" "}
                            <span className="text-indigo-300 font-semibold">{yearsInRetirement}</span> years
                          </p>
                        </div>
          
                        {/* Current savings & monthly contribution */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                              Current Savings ({findSymbol(currency)})
                            </label>
                            <input
                              type="number"
                              value={currentSavings || ""}
                              min={0}
                              onChange={(e) => setCurrentSavings(parseFloat(e.target.value) || 0)}
                              placeholder={`e.g. ${findSymbol(currency)}25,000`}
                              className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                              Monthly Contribution ({findSymbol(currency)})
                            </label>
                            <input
                              type="number"
                              value={monthlyContribution || ""}
                              min={0}
                              onChange={(e) => setMonthlyContribution(parseFloat(e.target.value) || 0)}
                              placeholder={`e.g. ${findSymbol(currency)}500`}
                              className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
          
                        {/* Returns */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-sm font-medium text-slate-300">
                              Expected Returns (%)
                            </label>
                            <button
                              type="button"
                              className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-400"
                              onClick={() => setShowReturnInfo((v) => !v)}
                            >
                              <Info className="h-4 w-4" /> Info
                            </button>
                          </div>
                          {showReturnInfo && (
                            <div className="mb-2 bg-[#0f172a] text-slate-300 text-xs p-2 rounded-md border border-[#334155]">
                              Use average annual returns before retirement (growth) and after retirement
                              (more conservative). These are nominal (not inflation-adjusted) rates.
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            <input
                              type="number"
                              step="0.01"
                              value={annualReturnPre || 0}
                              min={0}
                              onChange={(e) => setAnnualReturnPre(parseFloat(e.target.value) || 0)}
                              placeholder="Pre-Ret (%)"
                              className="bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={annualReturnPost || 0}
                              min={0}
                              onChange={(e) => setAnnualReturnPost(parseFloat(e.target.value) || 0)}
                              placeholder="Post-Ret (%)"
                              className="bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
          
                        {/* Inflation */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-sm font-medium text-slate-300">Inflation (%)</label>
                            <button
                              type="button"
                              className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-400"
                              onClick={() => setShowInflationInfo((v) => !v)}
                            >
                              <Info className="h-4 w-4" /> Info
                            </button>
                          </div>
                          {showInflationInfo && (
                            <div className="mb-2 bg-[#0f172a] text-slate-300 text-xs p-2 rounded-md border border-[#334155]">
                              We inflate your desired income from “today’s money” to the month you retire so
                              your target lifestyle keeps pace with price changes.
                            </div>
                          )}
                          <input
                            type="number"
                            step="0.01"
                            value={inflation || 0}
                            min={0}
                            onChange={(e) => setInflation(parseFloat(e.target.value) || 0)}
                            placeholder="e.g. 3"
                            className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
          
                        {/* Desired income (today) */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-sm font-medium text-slate-300">
                              Desired Monthly Income (today) ({findSymbol(currency)})
                            </label>
                            <button
                              type="button"
                              className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-400"
                              onClick={() => setShowIncomeInfo((v) => !v)}
                            >
                              <Info className="h-4 w-4" /> Info
                            </button>
                          </div>
                          {showIncomeInfo && (
                            <div className="mb-2 bg-[#0f172a] text-slate-300 text-xs p-2 rounded-md border border-[#334155]">
                              Enter the monthly income you want in retirement expressed in today’s purchasing
                              power. We’ll inflate it to your retirement start month automatically.
                            </div>
                          )}
                          <input
                            type="number"
                            value={desiredMonthlyIncomeToday || ""}
                            min={0}
                            onChange={(e) => setDesiredMonthlyIncomeToday(parseFloat(e.target.value) || 0)}
                            placeholder={`e.g. ${findSymbol(currency)}2,500`}
                            className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                          {desiredMonthlyIncomeToday > 0 && (
                            <p className="text-xs text-slate-400 mt-2">
                              Adjusted at retirement start:{" "}
                              <span className="font-semibold text-indigo-300">
                                {formatCurrency(
                                  desiredIncomeAtRetStartMonthly,
                                  currentLocale,
                                  currency
                                )}
                                /mo
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
          
                    {/* ---------- Output Summary Card ---------- */}
                    <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
                      <h2 className="text-xl font-semibold text-white mb-4">Retirement Summary</h2>
                      <div className="space-y-6">
                        {/* Main KPI */}
                        <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                          <Briefcase className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-white">
                            {formatCurrency(nestEggAtRetirement, currentLocale, currency)}
                          </div>
                          <div className="text-sm text-slate-400">Projected Nest Egg at Retirement</div>
                        </div>
          
                        {/* Two tiles */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                            <div className="text-lg font-semibold text-white">
                              {formatCurrency(requiredNestEggForGoal, currentLocale, currency)}
                            </div>
                            <div className="text-sm text-slate-400">Required Nest Egg (for target)</div>
                          </div>
                          <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                            <div
                              className={`text-lg font-semibold ${
                                surplusOrShortfall >= 0 ? "text-emerald-300" : "text-rose-300"
                              }`}
                            >
                              {formatCurrency(surplusOrShortfall, currentLocale, currency)}
                            </div>
                            <div className="text-sm text-slate-400">Surplus / Shortfall</div>
                          </div>
                        </div>
          
                        {/* Quick facts */}
                        <div className="space-y-3 text-sm text-slate-300">
                          <div className="flex justify-between">
                            <span>Years to Retire:</span>
                            <span className="font-medium text-indigo-300">{yearsToRetire}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Years in Retirement:</span>
                            <span className="font-medium text-indigo-300">{yearsInRetirement}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Desired Income @ start (inflated):</span>
                            <span className="font-medium text-indigo-300">
                              {formatCurrency(desiredIncomeAtRetStartMonthly, currentLocale, currency)}/mo
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

                {/* ===== Smart Tip Box ===== */}
                {(tipsForRetirement.length > 0) && (
                  <div className="mt-4 w-full relative">
                    <div className="bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm min-h-[50px] w-full flex items-center">
                      <div className="mr-3 flex items-center justify-center w-8 h-8">
                        <span className="text-2xl text-indigo-400">💡</span>
                      </div>
                      <div className="w-full">
                        <p className="text-base font-medium leading-snug text-slate-300">
                          {tipsForRetirement[activeTip]}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
        
                {/* ===== Chart + Quick Summary ===== */}
                {(nestEggAtRetirement > 0 || requiredNestEggForGoal > 0) && (
                  <div className="mt-5 bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
                    <h3 className="text-lg font-semibold text-white mb-6 text-center">
                      Retirement Insights & Breakdown
                    </h3>
        
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
                      {/* Pie Chart */}
                      <div className="w-[90%] sm:w-[80%] md:w-[70%] max-w-[360px] h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={2}>
                              {pieData.map((_, index) => (
                                <Cell key={index} fill={["#3b82f6", "#a855f7", surplusOrShortfall >= 0 ? "#10b981" : "#ef4444"][index % 3]} />
                              ))}
                            </Pie>
                            <ReTooltip
                              formatter={(v: any) => formatCurrency(Number(v), currentLocale, currency)}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
        
                      {/* Summary tiles */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-indigo-500 transition">
                          <p className="text-sm text-slate-400">Nest Egg @ Retirement</p>
                          <p className="font-semibold text-white text-lg">
                            {formatCurrency(nestEggAtRetirement, currentLocale, currency)}
                          </p>
                        </div>
                        <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-fuchsia-500 transition">
                          <p className="text-sm text-slate-400">Required for Target</p>
                          <p className="font-semibold text-white text-lg">
                            {formatCurrency(requiredNestEggForGoal, currentLocale, currency)}
                          </p>
                        </div>
                        <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-emerald-500 transition">
                          <p className="text-sm text-slate-400">Surplus / Shortfall</p>
                          <p
                            className={`font-semibold text-lg ${
                              surplusOrShortfall >= 0 ? "text-emerald-300" : "text-rose-300"
                            }`}
                          >
                            {formatCurrency(surplusOrShortfall, currentLocale, currency)}
                          </p>
                        </div>
                        <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-cyan-500 transition">
                          <p className="text-sm text-slate-400">Inflated Target Income (start)</p>
                          <p className="font-semibold text-white text-lg">
                            {formatCurrency(desiredIncomeAtRetStartMonthly, currentLocale, currency)}/mo
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
        
                {/* ===== Schedules ===== */}
                {(accumMonthly.length > 0 || withdrawalMonthly.length > 0) && (
                  <div className="mt-10 bg-gradient-to-br from-[#1e293b] via-[#111827] to-[#0f172a] rounded-2xl border border-indigo-600/40 shadow-xl overflow-hidden">
                    <button
                      onClick={() => setShowSchedule((v) => !v)}
                      className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold text-lg tracking-wide hover:opacity-90 transition-all"
                    >
                      <span>📊 Schedules (Accumulation & Withdrawal)</span>
                      {showSchedule ? <ChevronUp /> : <ChevronDown />}
                    </button>
        
                    {showSchedule && (
                      <div className="px-6 pb-8 pt-4 space-y-8">
                        {/* Accumulation Schedule */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-white font-semibold">Accumulation (to Retirement)</h4>
                            <div className="flex items-center gap-3">
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
                          </div>
        
                          <div className="overflow-x-auto rounded-xl border border-[#334155] shadow-inner">
                            <table className="min-w-full text-sm text-slate-100">
                              <thead className="bg-[#0f172a]">
                                <tr>
                                  <th className="text-left px-4 py-3 font-semibold text-indigo-300">
                                    {granularity === "yearly" ? "Year" : "Month"}
                                  </th>
                                  <th className="text-right px-4 py-3 font-semibold text-emerald-300">
                                    Contributions
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
                                {(granularity === "yearly" ? accumYearly : accumMonthly).map((r) => (
                                  <tr
                                    key={`acc-${r.period}`}
                                    className="transition-colors duration-200 odd:bg-[#1e293b]/60 even:bg-[#0f172a]/60 hover:bg-[#3b82f6]/10"
                                  >
                                    <td className="px-4 py-2">{r.period}</td>
                                    <td className="px-4 py-2 text-right text-emerald-300 font-medium">
                                      {formatCurrency(r.contribution, currentLocale, currency)}
                                    </td>
                                    <td className="px-4 py-2 text-right text-rose-300 font-medium">
                                      {formatCurrency(r.interest, currentLocale, currency)}
                                    </td>
                                    <td className="px-4 py-2 text-right text-cyan-300 font-medium">
                                      {formatCurrency(r.balance, currentLocale, currency)}
                                    </td>
                                  </tr>
                                ))}
                                {(granularity === "yearly" ? accumYearly : accumMonthly).length === 0 && (
                                  <tr>
                                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400 italic">
                                      Enter valid details to view accumulation.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
        
                        {/* Withdrawal Schedule */}
                        {withdrawalMonthly.length > 0 && (
                          <div>
                            <h4 className="text-white font-semibold mb-3">Withdrawal (post Retirement)</h4>
                            <div className="overflow-x-auto rounded-xl border border-[#334155] shadow-inner">
                              <table className="min-w-full text-sm text-slate-100">
                                <thead className="bg-[#0f172a]">
                                  <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-indigo-300">
                                      {granularity === "yearly" ? "Year" : "Month"}
                                    </th>
                                    <th className="text-right px-4 py-3 font-semibold text-emerald-300">
                                      Withdrawals
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
                                  {(granularity === "yearly" ? withdrawalYearly : withdrawalMonthly).map(
                                    (r) => (
                                      <tr
                                        key={`wdr-${r.period}`}
                                        className="transition-colors duration-200 odd:bg-[#1e293b]/60 even:bg-[#0f172a]/60 hover:bg-[#3b82f6]/10"
                                      >
                                        <td className="px-4 py-2">{r.period}</td>
                                        <td className="px-4 py-2 text-right text-emerald-300 font-medium">
                                          {formatCurrency(r.withdrawal, currentLocale, currency)}
                                        </td>
                                        <td className="px-4 py-2 text-right text-rose-300 font-medium">
                                          {formatCurrency(r.interest, currentLocale, currency)}
                                        </td>
                                        <td className="px-4 py-2 text-right text-cyan-300 font-medium">
                                          {formatCurrency(r.balance, currentLocale, currency)}
                                        </td>
                                      </tr>
                                    )
                                  )}
                                  {(granularity === "yearly" ? withdrawalYearly : withdrawalMonthly).length ===
                                    0 && (
                                    <tr>
                                      <td colSpan={4} className="px-4 py-6 text-center text-slate-400 italic">
                                        Enter target income and returns to view withdrawal schedule.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
        
                        {/* Subtle Footer Glow */}
                        <div className="h-2 w-full mt-6 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 blur-[2px]" />
                      </div>
                    )}
                  </div>
                )}

                          {/* ==================== SEO CONTENT SECTION ==================== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          {/* TOC */}
          <nav className="mt-16 mb-8 bg-[#0f172a] border border-[#334155] rounded-xl p-5 text-slate-200">
            <h2 className="text-lg font-semibold text-cyan-300 mb-3">📖 Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><a href="#how-it-works" className="text-indigo-400 hover:underline">How the Retirement Calculator Works</a></li>
              <li><a href="#inputs" className="text-indigo-400 hover:underline">Key Inputs & Assumptions</a></li>
              <li><a href="#faq" className="text-indigo-400 hover:underline">Frequently Asked Questions</a></li>
            </ol>
          </nav>

          <h1 id="how-it-works" className="text-3xl font-bold text-cyan-400 mb-6">
            Retirement Calculator – Plan Your Nest Egg & Income with Confidence
          </h1>
          <p>
            This calculator projects your <strong>nest egg at retirement</strong> by compounding your existing
            savings and monthly contributions at a pre-retirement rate, and compares it with the
            <strong> required corpus</strong> to fund a level monthly income over your retirement horizon.
          </p>

          <h2 id="inputs" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            Key Inputs & Assumptions
          </h2>
          <ul>
            <li><strong>Current/Retirement/Life Ages:</strong> define saving years and withdrawal years.</li>
            <li><strong>Returns:</strong> nominal average returns pre- and post-retirement.</li>
            <li><strong>Inflation:</strong> inflates target income from today to retirement start.</li>
            <li><strong>Monthly Contribution:</strong> treated as <em>annuity-due</em> (start of month).</li>
          </ul>

          {/* FAQ */}
          <section id="faq" className="space-y-6 mt-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>

            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Do you index withdrawals to inflation?</h3>
                <p>
                  The schedule shown uses <strong>level</strong> withdrawals for simplicity. You can extend it to
                  <strong> inflation-indexed</strong> withdrawals by growing the monthly amount with inflation and
                  discounting accordingly.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Are the returns guaranteed?</h3>
                <p>
                  No. Returns are assumptions. For conservative planning, consider lower returns and higher inflation.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Is my data stored?</h3>
                <p>
                  Calculations run locally in your browser. We only use <strong>localStorage</strong> on your device to
                  remember your last session for convenience.
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
                Experts in retirement planning tools. Last updated:{" "}
                <time dateTime="2025-10-19">October 19, 2025</time>.
              </p>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              🚀 Explore more finance tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <a
                href="/mortgage-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
              >
                <span className="text-indigo-400">🏠</span> Mortgage Calculator
              </a>
              <a
                href="/rd-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
              >
                <span className="text-emerald-400">🏦</span> RD Calculator
              </a>
              <a
                href="/currency-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-fuchsia-600/20 text-fuchsia-300 hover:text-fuchsia-400 px-3 py-2 rounded-md border border-slate-700 hover:border-fuchsia-500 transition-all duration-200"
              >
                <span className="text-fuchsia-400">💱</span> Currency Converter
              </a>
            </div>
          </div>
        </section>

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/retirement-calculator" category="currency-finance" />

      
    </>
  );
};

export default RetirementCalculator;
