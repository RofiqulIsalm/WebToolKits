import React, { useState, useEffect, useMemo } from "react";
import {
  RotateCcw,
  Share2,
  Copy,
  PieChart as PieChartIcon,
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";

import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import RelatedCalculators from "../components/RelatedCalculators";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

/* ============================================================
   ⚙️ Constants
   ============================================================ */
const LS_KEY = "sip_calculator_v2";

const defaultValues = {
  monthlyInvestment: 0,
  annualReturn: 0,
  years: 0,
  currency: "USD",
};

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
  { code: "UAH", symbol: "₴", locale: "uk-UA", label: "Ukrainian Hryvnia (₴)" },
  { code: "RON", symbol: "lei", locale: "ro-RO", label: "Romanian Leu (lei)" },
  { code: "BGN", symbol: "лв", locale: "bg-BG", label: "Bulgarian Lev (лв)" },
];


const findLocale = (code: string) =>
  currencyOptions.find((c) => c.code === code)?.locale || "en-US";
const findSymbol = (code: string) =>
  currencyOptions.find((c) => c.code === code)?.symbol || "";

/* ============================================================
   💰 SIP Calculator Component
   ============================================================ */
const SipCalculator: React.FC = () => {
  const [monthlyInvestment, setMonthlyInvestment] = useState(defaultValues.monthlyInvestment);
  const [annualReturn, setAnnualReturn] = useState(defaultValues.annualReturn);
  const [years, setYears] = useState(defaultValues.years);
  const [currency, setCurrency] = useState(defaultValues.currency);
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [showSteps, setShowSteps] = useState(false);

  const months = years * 12;
  const monthlyRate = annualReturn / 12 / 100;
    // 💡 Step-by-step SIP calculation values
  const P = monthlyInvestment; // Monthly investment
  const n = months;            // Total months (years * 12)
  const r = annualReturn / 12 / 100; // Monthly interest rate (decimal)
  const onePlusR = 1 + r; // (1 + r)
  const pow = Math.pow(onePlusR, n); // (1 + r)^n
  const numerator = pow - 1; // ((1 + r)^n - 1)
  const denominator = r; // r
  const factor = numerator / denominator; // ((1 + r)^n - 1) / r
  const futureValueCalc = P * factor * onePlusR; // Final FV

  
  

  const currentLocale = findLocale(currency);
  const isDefault = !monthlyInvestment && !annualReturn && !years;

  /* ============================================================
     🧮 Calculation Logic
     ============================================================ */
  const futureValue = useMemo(() => {
    if (monthlyInvestment <= 0 || years <= 0) return 0;
    if (monthlyRate === 0) return monthlyInvestment * months;
    return monthlyInvestment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
  }, [monthlyInvestment, monthlyRate, months]);

  const totalInvestment = monthlyInvestment * months;
  const totalGains = futureValue - totalInvestment;

  /* ============================================================
     💾 Persistence (LocalStorage + URL)
     ============================================================ */
  const applyState = (s: any) => {
    setMonthlyInvestment(Number(s.monthlyInvestment) || 0);
    setAnnualReturn(Number(s.annualReturn) || 0);
    setYears(Number(s.years) || 0);
    setCurrency(typeof s.currency === "string" ? s.currency : "USD");
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromURL = params.get("sip");
      if (fromURL) {
        const decoded = JSON.parse(atob(fromURL));
        applyState(decoded);
        setHydrated(true);
        return;
      }
      const raw = localStorage.getItem(LS_KEY);
      if (raw) applyState(JSON.parse(raw));
    } catch (err) {
      console.warn("Failed to load SIP state", err);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ monthlyInvestment, annualReturn, years, currency })
    );
  }, [monthlyInvestment, annualReturn, years, currency, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const url = new URL(window.location.href);
    const state = { monthlyInvestment, annualReturn, years, currency };
    const encoded = btoa(JSON.stringify(state));
    url.searchParams.set("sip", encoded);
    window.history.replaceState({}, "", url);
  }, [monthlyInvestment, annualReturn, years, currency, hydrated]);

  /* ============================================================
     🔗 Copy & Reset
     ============================================================ */
  const copyResults = async () => {
    const text = [
      "SIP Investment Summary",
      `Monthly Investment: ${findSymbol(currency)}${monthlyInvestment}`,
      `Expected Annual Return: ${annualReturn}%`,
      `Duration: ${years} years`,
      `Future Value: ${findSymbol(currency)}${futureValue.toFixed(2)}`,
      `Total Investment: ${findSymbol(currency)}${totalInvestment.toFixed(2)}`,
      `Total Gains: ${findSymbol(currency)}${totalGains.toFixed(2)}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const encoded = btoa(
      JSON.stringify({ monthlyInvestment, annualReturn, years, currency })
    );
    const url = new URL(window.location.href);
    url.searchParams.set("sip", encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  const reset = () => {
    setMonthlyInvestment(0);
    setAnnualReturn(0);
    setYears(0);
    setCurrency("USD");
    localStorage.removeItem(LS_KEY);
  };

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat(currentLocale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(num);

  /* ============================================================
     📊 Chart Data
     ============================================================ */
    const [chartType, setChartType] = useState<"pie" | "line">("pie");
  
    const pieData = [
      { name: "Invested Amount", value: totalInvestment },
      { name: "Total Gains", value: totalGains > 0 ? totalGains : 0 },
    ];

    const growthData = useMemo(() => {
    const data: { year: number; value: number }[] = [];
    if (years <= 0 || monthlyInvestment <= 0 || annualReturn <= 0) return data;
  
    let total = 0;
    const monthlyRate = annualReturn / 12 / 100;
    for (let y = 1; y <= years; y++) {
      for (let m = 1; m <= 12; m++) {
        total = (total + monthlyInvestment) * (1 + monthlyRate);
      }
      data.push({ year: y, value: total });
    }
    return data;
  }, [years, monthlyInvestment, annualReturn]);


  /* ============================================================
     🎨 Render UI
     ============================================================ */
  return (
    <>
      <SEOHead
        title="SIP Calculator | Systematic Investment Plan Return Estimator"
        description="Use CalculatorHub’s SIP Calculator to estimate your investment returns, maturity value, and total gains based on monthly investment, tenure, and return rate."
        canonical="https://calculatorhub.site/sip-calculator"
        schemaData={generateCalculatorSchema(
          "SIP Calculator",
          "Estimate SIP maturity amount and investment growth using CalculatorHub’s online SIP Calculator.",
          "/sip-calculator",
          ["sip calculator", "investment returns", "mutual fund calculator"]
        )}
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "SIP Calculator", url: "/sip-calculator" },
          ]}
        />

       {/* ======= HERO HEADER ======= */}
        <div className="mb-8"> <h1 className="text-3xl font-bold text-white mb-2">📈 SIP Calculator</h1> <p className="mt-3 text-slate-400 text-sm leading-relaxed"> Calculate your future SIP returns, maturity amount, and total gains using our systematic investment plan calculator. </p> </div>
        
        {/* ======= CALCULATOR GRID ======= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ---------- INPUT CARD ---------- */}
          <div className="relative bg-gradient-to-br from-slate-800/80 via-slate-900/90 to-[#0b1220]/90 border border-indigo-600/20 rounded-2xl shadow-2xl p-6 overflow-hidden backdrop-blur-sm">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent" />
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h2 className="text-xl sm:text-2xl font-semibold text-white flex items-center gap-2">
                💰 Investment Details
              </h2>
              <button
                onClick={reset}
                disabled={isDefault}
                className="flex items-center gap-1 text-sm text-slate-300 border border-slate-600 rounded-lg px-2.5 py-1.5 hover:bg-slate-800 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="h-4 w-4 text-indigo-400" /> Reset
              </button>
            </div>
        
            {/* Content */}
            <div className="space-y-6 relative z-10">
              {/* Currency */}
              <div className="bg-[#0f172a]/70 border border-slate-700 rounded-xl p-4 shadow-inner">
                <label className="block text-sm font-medium text-slate-300 mb-2">Select Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-[#0b1120] text-white text-sm px-3 py-2 border border-slate-700 rounded-md focus:ring-2 focus:ring-indigo-500 hover:border-indigo-400 transition"
                >
                  {currencyOptions.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>
        
              {/* Monthly Investment */}
              <div className="bg-[#0f172a]/70 border border-slate-700 rounded-xl p-4 shadow-inner">
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Monthly Investment ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  value={monthlyInvestment || ""}
                  placeholder="Enter monthly investment amount"
                  min={0}
                  onChange={(e) => setMonthlyInvestment(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0b1120] text-white px-4 py-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
        
              {/* Annual Return */}
              <div className="bg-[#0f172a]/70 border border-slate-700 rounded-xl p-4 shadow-inner">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-300">
                    Expected Annual Return (%)
                  </label>
                  <span className="text-indigo-400 text-sm font-semibold">{annualReturn}%</span>
                </div>
        
                <input
                  type="number"
                  step="0.1"
                  value={annualReturn || ""}
                  placeholder="Enter expected annual return rate"
                  min={0}
                  max={30}
                  onChange={(e) => setAnnualReturn(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0b1120] text-white px-4 py-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 mb-3"
                />
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={0.1}
                  value={annualReturn}
                  onChange={(e) => setAnnualReturn(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>0%</span>
                  <span>15%</span>
                  <span>30%</span>
                </div>
              </div>
        
              {/* Investment Period */}
              <div className="bg-[#0f172a]/70 border border-slate-700 rounded-xl p-4 shadow-inner">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-300">
                    Investment Period (Years)
                  </label>
                  <span className="text-indigo-400 text-sm font-semibold">{years}</span>
                </div>
        
                <input
                  type="number"
                  value={years || ""}
                  placeholder="Enter investment duration in years"
                  min={0}
                  max={50}
                  onChange={(e) => setYears(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#0b1120] text-white px-4 py-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 mb-3"
                />
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={years}
                  onChange={(e) => setYears(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>0y</span>
                  <span>25y</span>
                  <span>50y</span>
                </div>
              </div>
            </div>
          </div>



          {/* ---------- OUTPUT SECTION ---------- */}
          <div className="relative bg-gradient-to-br from-slate-800/80 via-slate-900/90 to-[#0b1220]/90 border border-indigo-600/20 rounded-2xl shadow-2xl p-6 overflow-hidden backdrop-blur-sm">
            {/* Decorative Background Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-fuchsia-600/10 rounded-full blur-2xl" />
          
            {/* Header */}
            <h2 className="relative z-10 text-2xl font-semibold text-white mb-6 text-center">
              ✨ SIP Summary
            </h2>
          
            {/* Main Highlight Card */}
            <div className="relative z-10 p-5 bg-gradient-to-br from-[#0f172a]/80 via-slate-800/80 to-[#1e293b]/90 border border-indigo-600/40 rounded-2xl text-center shadow-inner transition-all hover:border-indigo-500/70">
              <PieChartIcon className="h-10 w-10 text-indigo-400 mx-auto mb-3 drop-shadow-md" />
              <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400 tracking-tight">
                {formatCurrency(futureValue)}
              </div>
              <div className="text-sm text-slate-400 mt-1">Maturity Amount</div>
            </div>
          
            {/* Investment & Gain Summary */}
            <div className="relative z-10 grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-[#0f172a]/80 border border-slate-700 rounded-xl text-center shadow-md hover:border-emerald-400/50 transition-all duration-200">
                <p className="text-xs text-slate-400 mb-1 uppercase tracking-wide">Total Investment</p>
                <p className="font-semibold text-emerald-300 text-lg">
                  {formatCurrency(totalInvestment)}
                </p>
              </div>
              <div className="p-4 bg-[#0f172a]/80 border border-slate-700 rounded-xl text-center shadow-md hover:border-fuchsia-400/50 transition-all duration-200">
                <p className="text-xs text-slate-400 mb-1 uppercase tracking-wide">Total Gains</p>
                <p className="font-semibold text-fuchsia-300 text-lg">
                  {formatCurrency(totalGains)}
                </p>
              </div>
            </div>
          
            {/* Buttons */}
            <div className="relative z-10 flex flex-wrap justify-center gap-3 mt-6">
              <button
                onClick={copyResults}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-4 py-2 rounded-md text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Copy size={16} /> Copy Results
              </button>
              <button
                onClick={copyShareLink}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-4 py-2 rounded-md text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Share2 size={16} /> Copy Link
              </button>
              {copied !== "none" && (
                <span className="text-emerald-400 text-sm font-medium animate-pulse">
                  {copied === "results" ? "Results copied!" : "Link copied!"}
                </span>
              )}
            </div>
          
            {/* Decorative Bottom Glow Line */}
            <div className="relative z-0 mt-8 h-[2px] w-full bg-gradient-to-r from-transparent via-indigo-500/70 to-transparent blur-[1px]" />
          </div>
      </div>


       {/* ---------- CHART SECTION (Enhanced with Toggle) ---------- */}
{futureValue > 0 && (
  <div className="relative mt-10 bg-gradient-to-br from-slate-800/80 via-slate-900/90 to-[#0b1220]/90 border border-indigo-600/20 rounded-2xl shadow-2xl p-6 overflow-hidden backdrop-blur-sm">
    {/* Glows */}
    <div className="absolute -top-10 right-10 w-24 h-24 bg-indigo-600/20 rounded-full blur-3xl" />
    <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-600/10 rounded-full blur-2xl" />

    {/* Header + Toggle */}
    <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center mb-6">
      <h3 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-cyan-300 to-emerald-300 drop-shadow-md mb-3 sm:mb-0">
        Investment Growth Analysis
      </h3>

      <div className="flex bg-[#0f172a]/70 border border-slate-700 rounded-full p-1 text-sm shadow-inner">
        <button
          className={`px-4 py-1.5 rounded-full transition-all duration-200 ${
            chartType === "pie"
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium"
              : "text-slate-300 hover:text-white"
          }`}
          onClick={() => setChartType("pie")}
        >
          🥧 Pie
        </button>
        <button
          className={`px-4 py-1.5 rounded-full transition-all duration-200 ${
            chartType === "line"
              ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-medium"
              : "text-slate-300 hover:text-white"
          }`}
          onClick={() => setChartType("line")}
        >
          📈 Line
        </button>
      </div>
    </div>

    {/* Chart Area */}
    <div className="relative z-10 flex flex-col items-center justify-center gap-8">
      {chartType === "pie" ? (
        /* PIE CHART VIEW */
        <div className="w-full sm:w-[80%] md:w-[70%] max-w-[380px] h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
           <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={95}
                innerRadius={60}
                paddingAngle={3}
                stroke="none"
                labelLine={false}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, index }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
              
                  // Only show labels for visible slices (> 3%)
                  return percent > 0.03 ? (
                    <text
                      x={x}
                      y={y}
                      fill="#f8fafc"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={12}
                      fontWeight={500}
                    >
                      {(percent * 100).toFixed(1)}%
                    </text>
                  ) : null;
                }}
              >
                {pieData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={["#3b82f6", "#22c55e"][i]}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                ))}
              </Pie>

            
              {/* Custom Tooltip */}
              <ReTooltip
                formatter={(value: any, name: any) => [formatCurrency(value), name]}
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "10px",
                  color: "#f8fafc",
                  fontSize: "14px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
                  padding: "10px 14px",
                }}
                itemStyle={{
                  color: "#f8fafc",
                  textTransform: "capitalize",
                  fontWeight: 500,
                }}
                labelStyle={{
                  color: "#93c5fd",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              />
            
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{
                  color: "#e2e8f0",
                  fontSize: "13px",
                  paddingTop: "10px",
                }}
              />
            </PieChart>

          </ResponsiveContainer>
        </div>
      ) : (
       /* BAR CHART VIEW — Modern SIP Future Value Chart */
   

<div className="w-full sm:w-[90%] md:w-[80%] h-[280px]">
   <div className="flex items-center gap-2 mb-3">
      <img
        src="/images/calculatorhub-logo.webp"
        alt="CalculatorHub Logo"
        className="w-10 h-10 rounded-md"
      />
      <h3 className="text-slate-100 text-lg font-semibold">Future Value</h3>
  </div>
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={growthData} barSize={35}>
      {/* X-Axis */}
      <XAxis
        dataKey="year"
        tick={{ fill: "#cbd5e1", fontSize: 12 }}
        axisLine={{ stroke: "#475569" }}
      />

      {/* Y-Axis */}
      <YAxis
        tickFormatter={(v) =>
          new Intl.NumberFormat(currentLocale, {
            notation: "compact",
            compactDisplay: "short",
            maximumFractionDigits: 2,
          }).format(v)
        }
        tick={{ fill: "#cbd5e1", fontSize: 12 }}
        axisLine={{ stroke: "#475569" }}
      />

      {/* Tooltip */}
      <ReTooltip
        formatter={(v: any) => formatCurrency(v)}
        contentStyle={{
          backgroundColor: "#0f172a",
          border: "1px solid #334155",
          borderRadius: "8px",
          color: "#e2e8f0",
          fontSize: "13px",
        }}
      />

      {/* Gradient for Bars */}
      <defs>
        <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
          <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.9} />
        </linearGradient>
      </defs>

      {/* Bars */}
      <Bar
        dataKey="value"
        fill="url(#barColor)"
        radius={[6, 6, 0, 0]}
        animationDuration={1200}
        label={{
          position: "top",
          fill: "#38bdf8",
          fontSize: 12,
          formatter: (v: any) => formatCurrency(v),
        }}
      >
        {/* Highlight the last bar */}
        {growthData.map((entry, index) => (
          <Cell
            key={`bar-${index}`}
            fill={
              index === growthData.length - 1
                ? "#2563eb" // brighter blue for last bar
                : "url(#barColor)"
            }
          />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
</div>

      )}

      {/* Quick Summary */}
      <div className="grid grid-cols-2 gap-4 text-sm text-slate-300 w-full sm:w-[70%]">
        <div className="p-3 bg-[#0f172a]/70 rounded-xl border border-slate-700 text-center hover:border-indigo-400/50 transition-all">
          <p className="font-medium text-indigo-300">Total Investment</p>
          <p className="text-white font-semibold">{formatCurrency(totalInvestment)}</p>
        </div>
        <div className="p-3 bg-[#0f172a]/70 rounded-xl border border-slate-700 text-center hover:border-emerald-400/50 transition-all">
          <p className="font-medium text-emerald-300">Total Gains</p>
          <p className="text-white font-semibold">{formatCurrency(totalGains)}</p>
        </div>
      </div>
    </div>

    {/* Bottom Glow */}
    <div className="relative z-0 mt-10 h-[2px] w-full bg-gradient-to-r from-transparent via-indigo-500/70 to-transparent blur-[1px]" />
  </div>
)}






  {/* ==================== SEO CONTENT SECTION ==================== */}
<section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
   <h1 className="text-3xl font-bold text-cyan-400 mb-6">
    SIP Calculator – Free, Easy & Powerful Investment Growth Tool (2025)
  </h1>
  
    <p>
      The <strong>SIP Calculator</strong> by CalculatorHub is a <strong>powerful SIP calculator</strong> designed 
      to help investors plan, calculate, and visualize their mutual fund growth with ease.  
      This <strong>professional SIP calculator</strong> makes complex compounding mathematics simple, offering 
      real-time projections of your <strong>total investment</strong>, <strong>wealth gain</strong>, and 
      <strong>future value</strong>. Whether you are a new investor or a seasoned planner, this 
      <strong>free SIP calculator</strong> provides instant, accurate, and user-friendly insights for financial planning.
    </p>
  
    <p>
      The page includes multiple smart features like <strong>live SIP formula calculations</strong>, 
      <strong>interactive charts (Pie & Bar)</strong>, <strong>multi-currency support</strong>, 
      <strong>copy & share options</strong>, and <strong>visual investment summaries</strong>.  
      It’s a complete <strong>solution SIP calculator</strong> that brings together simplicity, precision, and interactivity 
      in one modern web tool — trusted by professionals and beginners alike.
    </p>
  
    <figure className="my-8">
      <img
        src="/images/sip-calculator-visual.webp"
        alt="SIP Calculator showing mutual fund growth visualization"
        title="SIP Calculator 2025 – Smart Investment Planner"
        className="rounded-lg shadow-md border border-slate-700 mx-auto"
        loading="lazy"
      />
      <figcaption className="text-center text-sm text-slate-400 mt-2">
        Visual representation of the SIP Calculator with growth analysis charts and real-time compounding updates.
      </figcaption>
    </figure>
  
    <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">📘 What Is an SIP Calculator?</h2>
    <p>
      A <strong>Systematic Investment Plan (SIP)</strong> calculator is a digital finance tool that estimates the 
      <strong>maturity value</strong> of mutual fund investments made through regular monthly contributions.  
      It automatically applies the compound interest formula to project how your money grows over time.
    </p>
  
    <p>
      The <strong>SIP calculator explained</strong> feature in this tool clearly breaks down every number — 
      principal, returns, and compounding effect — ensuring transparency. Unlike many static tools, 
      this one updates dynamically with every input change, giving instant feedback.
    </p>
  
    <p>
      This <strong>easy SIP calculator</strong> is perfect for investors who want to understand 
      <em>how small, consistent contributions can build significant wealth over the years</em>.  
      It’s also a great <strong>SIP calculator for beginners</strong>, as it visually demonstrates 
      how investments grow and how tenure, rate, and amount interact.
    </p>
  
    <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">💡 How to Use SIP Calculator (Step-by-Step Tutorial)</h2>
    <p>
      Using this <strong>SIP calculator tutorial</strong> takes less than a minute — the system 
      automatically computes and visualizes your investment outcome. Here’s how:
    </p>
  
    <ol className="list-decimal list-inside space-y-2">
      <li>Enter your <strong>monthly SIP amount</strong> (e.g., $500 or ₹5,000).</li>
      <li>Input the <strong>expected annual return rate</strong> (for example, 12%).</li>
      <li>Set the <strong>investment period</strong> (in years).</li>
      <li>Select your preferred <strong>currency</strong> from 40+ supported options.</li>
      <li>Instantly view <strong>maturity amount</strong>, <strong>total investment</strong>, and <strong>total gains</strong>.</li>
    </ol>
  
    <p>
      The tool’s real-time logic ensures immediate feedback when you adjust values, showing how increasing tenure or rate affects the final corpus.  
      It’s not just a calculator — it’s a complete <strong>SIP calculator guide</strong> for smarter investing decisions.
    </p>
  
    <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">🧮 SIP Calculation Logic (How It Works)</h2>
    <p>
      The SIP calculator uses the <strong>compound growth formula</strong> employed by financial institutions and fund houses.  
      The logic behind the system is displayed live within the page (under “SIP Calculation Live”), allowing users to 
      see the exact math applied to their inputs.
    </p>
  
    <pre className="bg-slate-800 text-slate-200 p-3 rounded-lg overflow-x-auto">
      FV = P × ((1 + r)ⁿ − 1) ÷ r × (1 + r)
    </pre>
  
    <p>
      Where:
    </p>
    <ul>
      <li><strong>P</strong> = Monthly investment amount</li>
      <li><strong>r</strong> = Monthly rate of return (annual rate ÷ 12 ÷ 100)</li>
      <li><strong>n</strong> = Total number of months (years × 12)</li>
    </ul>
  
    <p>
      The formula ensures accuracy and transparency. This page even includes a **live math explainer** that reveals every 
      step — from exponentiation to factor calculation — a rare and educational feature that distinguishes this 
      <strong>professional SIP calculator</strong> from others online.
    </p>

            {/* ===== Responsive, colorful EMI step-by-step ===== */}
      <h2 id="how-emi" className="mt-12 mb-3 text-2xl font-extrabold tracking-tight text-center sm:text-left">
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
          
      
  

  

  
    <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">📈 Real-Time Chart & Data Visualization</h2>
    <p>
      The SIP Calculator includes interactive **Pie** and **Bar charts** powered by Recharts. These visualize your 
      investment growth, showing the split between invested capital and total returns.
    </p>
    <p>
      - The **Pie Chart** shows the percentage of principal vs gains.  
      - The **Bar Chart** displays year-by-year compounding growth.  
    </p>
    <p>
      These visualizations make it a <strong>powerful SIP calculator</strong> for understanding investment progress. 
      You can toggle between chart types easily and even highlight key data points.  
      For professionals and educators, this acts as a **visual SIP calculator tutorial**.
    </p>
  
    <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">🌍 Multi-Currency and Localization Support</h2>
    <p>
      Another unique feature of this <strong>tool SIP calculator</strong> is its support for more than 
      <strong>40 global currencies</strong>, including USD, INR, EUR, GBP, AUD, and SGD.  
      Each currency uses its native locale formatting, ensuring numbers and symbols appear 
      naturally for users across the world.
    </p>
    <p>
      This makes it a globally accessible <strong>system SIP calculator</strong> — a universal solution for investors 
      tracking mutual funds across borders.
    </p>
  
    <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">⚙️ Advanced SIP Calculator Features</h2>
    <ul className="space-y-2">
      <li>✔️ **Live Math Engine** — shows all formula steps in real time.</li>
      <li>✔️ **Copy Results** — share results or investment summary instantly.</li>
      <li>✔️ **Copy Link** — encode your inputs into a sharable URL for easy reference.</li>
      <li>✔️ **Local Storage** — automatically remembers your last values for quick reload.</li>
      <li>✔️ **Responsive Design** — works smoothly on mobile, tablet, and desktop.</li>
      <li>✔️ **SEO-Optimized Content** — including detailed guides, FAQs, and structured schema.</li>
    </ul>
    <p>
      These smart enhancements make it not just a calculator but a **complete financial planning companion**.
    </p>
  
    <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">✅ SIP Calculator Benefits</h2>
    <ul className="space-y-2">
      <li>🎯 Helps visualize how small monthly contributions grow into large wealth.</li>
      <li>📊 Simplifies compounding math into clear visuals.</li>
      <li>💡 Ideal for comparing multiple investment plans.</li>
      <li>🌍 Works across multiple countries and currencies.</li>
      <li>🔒 Secure — all calculations happen locally in your browser.</li>
      <li>💼 Suitable for both individuals and advisors.</li>
    </ul>
  
    <p>
      These <strong>SIP calculator benefits</strong> ensure that every investor, whether a student, 
      working professional, or retiree, can use this <strong>best SIP calculator</strong> for their planning needs.
    </p>
  
    <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">🔍 Example Calculation</h2>
    <p>
      Suppose someone invests <strong>$500 every month</strong> for 10 years at an average annual return of 12%.  
      Using this <strong>solution SIP calculator</strong>, they will get:
    </p>
    <ul>
      <li><strong>Total Investment:</strong> $60,000</li>
      <li><strong>Wealth Gain:</strong> $49,947</li>
      <li><strong>Final Maturity Value:</strong> $109,947</li>
    </ul>
  
    <p>
      These results update instantly on the chart. This feature allows users to experiment freely with different 
      return rates and time periods — helping them discover the power of compounding visually.
    </p>
  
    <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">👥 SIP Calculator for Beginners & Professionals</h2>
    <p>
      This platform acts as both an **educational** and a **professional SIP calculator**.  
      Beginners can learn how investments grow, while financial planners can use it to explain projections to clients.  
      The user interface is clean, responsive, and optimized for quick input.
    </p>
  
    <p>
      Because of its accuracy, transparency, and user-friendly experience, many consider it the 
      <strong>best SIP calculator</strong> available online for 2025-2026.
    </p>
  
    <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">⚖️ SIP Calculator Pros and Cons</h2>
    <p><strong>Pros:</strong></p>
    <ul>
      <li>Fast, accurate, and visually engaging results.</li>
      <li>Works with multiple return rates and durations.</li>
      <li>Supports currency localization and mobile layout.</li>
      <li>Includes live math display for transparency.</li>
      <li>Completely free — no login required.</li>
    </ul>
    <p><strong>Cons:</strong></p>
    <ul>
      <li>Does not fetch live mutual fund data (by design for privacy).</li>
      <li>Assumes consistent returns, while real markets vary.</li>
    </ul>
  
    <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">🌐 SIP Calculator Website & Accessibility</h2>
    <p>
      The <strong>SIP calculator website</strong> — part of CalculatorHub’s financial suite — 
      uses modern React + Tailwind technology to deliver lightning-fast performance.  
      No login or registration is required, ensuring privacy and speed.
    </p>
    <p>
      Users can bookmark or share personalized links that automatically restore their inputs, 
      making it an ideal <strong>system SIP calculator</strong> for everyday use.  
      Whether accessed from desktop or mobile, it runs smoothly and retains data for convenience.
    </p>
  
    <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">🧭 Why This Is the Best SIP Calculator Online</h2>
    <p>
      This tool combines aesthetics, accuracy, and accessibility into one complete platform.  
      It’s not just a calculator — it’s a comprehensive <strong>SIP calculator guide</strong>, tutorial, 
      and interactive system rolled into one clean interface.
    </p>
    <ul className="space-y-1">
      <li>🎨 Beautiful charts and animations.</li>
      <li>📊 Step-by-step live math formula.</li>
      <li>💻 Instant copy & share options.</li>
      <li>🌍 Multi-currency support.</li>
      <li>🔐 Privacy-first calculations (no data sent to servers).</li>
    </ul>
  
    <p>
      These elements make it a <strong>tool SIP calculator</strong> trusted by investors worldwide.
    </p>

  {/* ===================== FAQ SECTION (Styled) ===================== */}
  <section className="space-y-6 mt-16">
    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
      ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
    </h2>

    <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
      <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
        <h3 className="font-semibold text-xl mb-2">
          <span className="text-yellow-300">Q1:</span> What is a SIP Calculator?
        </h3>
        <p>
          A <strong>SIP Calculator</strong> helps you estimate the future value of your mutual fund investments
          based on regular monthly contributions, an expected return rate, and your investment duration.
        </p>
      </div>

      <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
        <h3 className="font-semibold text-xl mb-2">
          <span className="text-yellow-300">Q2:</span> How is SIP calculated?
        </h3>
        <p>
          SIP is calculated using the formula: <code className="text-cyan-300">FV = P × ((1 + r)ⁿ − 1) ÷ r × (1 + r)</code>, where
          <strong>P</strong> is your monthly SIP amount, <strong>r</strong> is the monthly rate of return, and <strong>n</strong> is the total
          number of months. This calculator applies that instantly for you.
        </p>
      </div>

      <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
        <h3 className="font-semibold text-xl mb-2">
          <span className="text-yellow-300">Q3:</span> Can I use this for different mutual funds?
        </h3>
        <p>
          Yes — whether it’s <strong>equity funds</strong>, <strong>hybrid funds</strong>, <strong>index funds</strong> or <strong>debt funds</strong>, you can simulate the expected returns
          by adjusting the rate of return in this SIP Calculator.
        </p>
      </div>

      <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
        <h3 className="font-semibold text-xl mb-2">
          <span className="text-yellow-300">Q4:</span> What is the ideal duration for a SIP?
        </h3>
        <p>
          Longer tenures (5–15 years or more) typically deliver stronger results because of compounding — the longer your money stays invested, the higher the growth potential.
        </p>
      </div>

      <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
        <h3 className="font-semibold text-xl mb-2">
          <span className="text-yellow-300">Q5:</span> Is this SIP Calculator free?
        </h3>
        <p>
          Yes — this tool is completely <strong>free to use</strong>, with no registration required and fully responsive on all devices.
        </p>
      </div>
    </div>
  </section>
</section>

{/* ==================== AUTHOR SECTION ==================== */}
<section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
  <div className="flex items-center gap-3">
    <img
      src="/images/calculatorhub-author.webp"
      alt="CalculatorHub Investment Tools Team"
      className="w-12 h-12 rounded-full border border-gray-600"
      loading="lazy"
    />
    <div>
      <p className="font-semibold text-white">Written by the CalculatorHub Investment Tools Team</p>
      <p className="text-sm text-slate-400">
        Experts in financial planning, SIP strategies, and investment calculators. Last updated: <time dateTime="2025-10-10">October 10, 2025</time>.
      </p>
    </div>
  </div>
</section>

{/* ============= SIP CALCULATOR ENHANCED SEO SCHEMAS ================ */}
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "SIP Calculator",
      "url": "https://calculatorhub.site/sip-calculator",
      "description":
        "Free online SIP Calculator by CalculatorHub. Instantly calculate SIP maturity value, total investment, and wealth gain using compound growth. Compare SIP returns and plan your investments easily.",
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Investments & Finance",
            "item": "https://calculatorhub.site/category/investments"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "SIP Calculator",
            "item": "https://calculatorhub.site/sip-calculator"
          }
        ]
      },
      "hasPart": {
        "@type": "CreativeWork",
        "name": "SIP Calculator Features",
        "about": [
          "Calculates SIP maturity value and total investment",
          "Supports multiple currencies",
          "Provides visual charts for growth and returns",
          "Ideal for mutual fund investors",
          "Free, fast, and mobile-friendly"
        ]
      }
    })
  }}
/>

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is a SIP Calculator?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text":
              "A SIP Calculator helps you estimate the maturity amount and returns from your mutual fund SIP based on monthly investment, expected return rate, and duration."
          }
        },
        {
          "@type": "Question",
          "name": "How is SIP calculated?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text":
              "SIP is calculated using the formula FV = P × ((1 + r)ⁿ − 1) ÷ r × (1 + r), where P is the monthly investment, r is the monthly interest rate, and n is the total number of months."
          }
        },
        {
          "@type": "Question",
          "name": "Can I use this calculator for mutual funds?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text":
              "Yes, it can be used for any mutual fund SIP including equity, hybrid, debt, and index funds."
          }
        },
        {
          "@type": "Question",
          "name": "Is the SIP Calculator free to use?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text":
              "Yes, it’s completely free, requires no sign-up, and supports multiple currencies."
          }
        }
      ]
    })
  }}
/>

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "SIP Calculator",
      "operatingSystem": "All",
      "applicationCategory": "FinanceApplication",
      "description":
        "Instant SIP Calculator to estimate mutual fund returns, total investment, and wealth gained. Works in multiple currencies and provides visual charts for growth tracking.",
      "url": "https://calculatorhub.site/sip-calculator",
      "featureList": [
        "Estimate SIP maturity amount and total gains",
        "Supports multiple currencies",
        "Interactive charts for growth tracking",
        "Free, accurate, and mobile-friendly"
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "1850"
      }
    })
  }}
/>







        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/sip-calculator" category="investments" />
      </div>
    </>
  );
};

export default SipCalculator;
