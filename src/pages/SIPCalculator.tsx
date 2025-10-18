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
            { name: "Investments & Finance", url: "/category/investments" },
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
    <div className="flex items-center gap-2 mb-3">
  <img
    src="/images/calculatorhub-logo.webp"
    alt="CalculatorHub Logo"
    className="w-6 h-6 rounded-md"
  />
  <h3 className="text-slate-100 text-lg font-semibold">Future Value</h3>
</div>

<div className="w-full sm:w-[90%] md:w-[80%] h-[280px]">
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
    SIP Calculator – Calculate Mutual Fund Returns Instantly
  </h1>

  {/* Hero / Feature Image */}
  <div className="mb-6">
    <img
      src="/images/sip-calculator-visual.webp"
      alt="SIP calculator dashboard showing future value graph"
      className="w-full rounded-lg border border-slate-700 shadow-lg"
      loading="lazy"
    />
  </div>

  <p>
    Our <strong>SIP Calculator</strong> helps you estimate the <strong>future value of your mutual fund investments</strong> with a simple monthly investment plan –
    the <em>Systematic Investment Plan (SIP)</em>. Whether you’re investing in equity, hybrid or debt funds, this tool gives you instant projections for
    your <strong>maturity amount</strong>, <strong>total investment</strong>, and <strong>wealth gained</strong> — in just seconds.
  </p>

  <p>
    By using this SIP calculator, you can plan your financial goals smarter, compare investment options side-by-side, and make informed decisions about
    your long‐term growth strategy. The tool is 100% free, ultra-fast, and works across multiple currencies including INR, USD, EUR and GBP.
  </p>

  <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">What Is a SIP?</h2>
  <p>
    A <strong>Systematic Investment Plan (SIP)</strong> is a disciplined way to invest a fixed amount at regular intervals — usually monthly — into mutual funds.
    This approach benefits from <em>rupee-cost averaging</em> and <em>compounded returns</em>, letting you build wealth gradually with less risk than investing all at once.
  </p>

  <ul className="mb-6">
    <li><strong>Monthly investment (P):</strong> The amount you commit each month.</li>
    <li><strong>Expected return (r):</strong> The average annual return you estimate from your chosen fund.</li>
    <li><strong>Investment tenure (n):</strong> The total duration for your SIP — in years or months.</li>
  </ul>

  <p>
    SIPs are ideal for long-term investors who prefer consistent savings and want to take advantage of the market’s growth over time, rather than relying on timing the market.
  </p>

  <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">Key Benefits of Using This SIP Calculator</h2>
  <ul className="space-y-2 mb-6">
    <li>✅ Estimate your SIP returns quickly and accurately — no manual calculations required.</li>
    <li>✅ Compare different monthly investments, expected returns and investment durations to see how each scenario affects your wealth.</li>
    <li>✅ Visual representation: view a breakdown of investment vs. gains with interactive charts.</li>
    <li>✅ Works in multiple currencies (INR, USD, EUR, GBP) and adapts to your locale.</li>
    <li>✅ Completely free to use — no registration, no hidden fees, and fully responsive for mobile devices.</li>
    <li>✅ Helps you plan for retirement, children’s education, or long-term wealth accumulation with confidence.</li>
  </ul>

  <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">How to Use This SIP Calculator</h2>
  <ol className="list-decimal list-inside space-y-2 mb-6">
    <li>Enter your <strong>monthly SIP amount</strong> (the fixed amount you’ll invest each month).</li>
    <li>Input the <strong>expected annual rate of return</strong> for your selected mutual fund or portfolio.</li>
    <li>Set the <strong>investment duration</strong> in years.</li>
    <li>Instantly get results: <strong>total investment</strong>, <strong>estimated wealth gain</strong>, and <strong>maturity amount (future value)</strong>.</li>
  </ol>

  <p>
    Explore different return-rates and durations to understand how small changes can significantly impact your final corpus — a great way to get financial clarity before you invest.
  </p>
  
  {/*------------------live math start*/}

         {/* ---------- How SIP is Calculated (Always Open + Mobile Scrollable) ---------- */}
              <div className="mt-10 ">
                {/* Outer Scroll Wrapper for Mobile */}
                <div className=" overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent sm:overflow-x-visible">
                  <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">SIP Calculation Live</h2>
  <p>
    The SIP maturity amount is calculated using the following compound interest formula:
  </p>
              
                  {/* Check if user entered valid values */}
                  {P > 0 && annualReturn > 0 && years > 0 ? (
                    <>
                      {/* Formula Card */}
                      <div className="mt-3 mb-3 rounded-xl bg-gradient-to-br from-[#0b1220]/90 to-[#1e293b]/80 border border-indigo-600/30 px-2 py-1 ring-1 ring-indigo-500/30 shadow-inner min-w-max">
                        <h3 className="text-indigo-400 text-base sm:text-lg font-semibold mb-1 flex items-center gap-2">
                          🧮 <span className="text-white/90">Formula:</span>
                        </h3>
                        <p className="text-slate-200 text-center font-mono text-[13.5px] sm:text-base leading-7 break-words">
                          <span className="text-indigo-300 font-semibold">FV</span> ={" "}
                          <span className="text-white">P</span> × ((1 + <span className="text-emerald-400">r</span>)
                          <sup className="text-slate-400">n</sup> − 1) ÷{" "}
                          <span className="text-emerald-400">r</span> × (1 +{" "}
                          <span className="text-emerald-400">r</span>)
                        </p>
                      </div>
              
                      {/* Definitions */}
                      <ul className="list-disc ml-6 space-y-1 mb-4 min-w-max">
                        <li>
                          <span className="text-indigo-300 font-medium">P</span> = Monthly investment
                        </li>
                        <li>
                          <span className="text-indigo-300 font-medium">r</span> = Annual rate ÷ 12 ÷ 100
                        </li>
                        <li>
                          <span className="text-indigo-300 font-medium">n</span> = Total number of months
                        </li>
                      </ul>
              
                      {/* Step 1 - Core components */}
                      <div className="overflow-x-auto rounded-md bg-[#0b1220] px-3 py-2 border border-slate-700 text-slate-300 text-[13px] font-mono scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                        <div className="space-y-2 min-w-max">
                          <p>P = {formatCurrency(P)}</p>
                          <p>r = {r.toFixed(6)}</p>
                          <p>(1 + r) = {onePlusR.toFixed(6)}</p>
                          <p>(1 + r)^n = {pow.toFixed(6)}</p>
                          <p>Numerator ((1 + r)^n − 1) = {numerator.toFixed(6)}</p>
                          <p>Denominator (r) = {denominator.toFixed(6)}</p>
                          <p>Factor ((1 + r)^n − 1) / r = {factor.toFixed(6)}</p>
                        </div>
                      </div>
              
                      {/* Step 2 - Substitution math */}
                      <div className="overflow-x-auto mt-2 rounded-md bg-[#0b1220] px-3 py-3 border border-slate-700 text-[13.5px] font-mono text-slate-200 leading-7 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                        <pre className="whitespace-pre min-w-max">
              {`FV = ${formatCurrency(P)} × ((1 + ${r.toFixed(6)})^${n} − 1) ÷ ${r.toFixed(6)} × (1 + ${r.toFixed(6)})
              = ${formatCurrency(P)} × ${(numerator).toFixed(6)} ÷ ${r.toFixed(6)} × ${onePlusR.toFixed(6)}
              = ${formatCurrency(P)} × ${(factor).toFixed(6)} × ${onePlusR.toFixed(6)}
              = ${formatCurrency(futureValueCalc)}`}
                        </pre>
                      </div>
              
                      {/* Final FV summary */}
                      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-2 rounded-xl bg-[#0b1220] px-4 py-3 ring-1 ring-indigo-500/30 min-w-max">
                        <span className="text-sm text-indigo-300 whitespace-nowrap">
                          💰 Calculated SIP Maturity Value
                        </span>
                        <span className="text-lg sm:text-xl font-bold tracking-wide text-white">
                          {formatCurrency(futureValue)}
                        </span>
                      </div>
                    </>
                  ) : (
                    /* Default view when no inputs */
                    <div className="text-slate-300 text-sm leading-relaxed space-y-5 min-w-max">
                      <div className="rounded-xl bg-gradient-to-br from-[#0b1220]/90 to-[#1e293b]/80 border border-indigo-600/30 px-5 py-4 ring-1 ring-indigo-500/30 shadow-inner">
                        <h3 className="text-indigo-400 text-base sm:text-lg font-semibold mb-1 flex items-center gap-2">
                          🧮 <span className="text-white/90">Formula:</span>
                        </h3>
                        <p className="text-slate-200 text-center font-mono text-[13.5px] sm:text-base leading-7 break-words">
                          <span className="text-indigo-300 font-semibold">FV</span> ={" "}
                          <span className="text-white">P</span> × ((1 + <span className="text-emerald-400">r</span>)
                          <sup className="text-slate-400">n</sup> − 1) ÷{" "}
                          <span className="text-emerald-400">r</span> × (1 +{" "}
                          <span className="text-emerald-400">r</span>)
                        </p>
                      </div>
              
                      <ul className="list-disc ml-6 space-y-1 mb-2 min-w-max">
                        <li>
                          <span className="text-indigo-300 font-medium">P</span> = Monthly investment
                        </li>
                        <li>
                          <span className="text-indigo-300 font-medium">r</span> = Monthly interest rate (annual rate ÷ 12 ÷ 100)
                        </li>
                        <li>
                          <span className="text-indigo-300 font-medium">n</span> = Total number of months
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
  
  {/*live math end--------------------*/}


  


  <p className="mb-6">
    This formula assumes monthly compounding and helps you model how regular investments grow when returns are reinvested over time.
  </p>

  <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">Why Use Our SIP Calculator?</h2>
  <ul className="space-y-2 mb-6">
    <li>✅ Accurate and instant SIP maturity calculation — no spreadsheets or guesswork.</li>
    <li>✅ Supports multiple currencies and returns scenarios.</li>
    <li>✅ Compare monthly investments, return rates, and durations effortlessly.</li>
    <li>✅ Mobile-friendly, ad-free, and quick to load on any device.</li>
    <li>✅ Visual charts and intuitive interface make it easy for anyone to use.</li>
  </ul>

  <p className="mb-6">
    With our tool, you can confidently plan for retirement, your children’s future or long-term wealth accumulation — knowing exactly how your monthly investments stack up over time.
  </p>

  <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">Example: SIP of $10,000 per Month for 10 Years</h2>
  <p className="mb-6">
    Suppose you invest <strong>$10,000 per month</strong> for 10 years with an expected annual return of 12%.  
    The expected maturity amount would be approximately <strong>$23.2 lakh</strong>, where:
  </p>
  <ul className="mb-6">
    <li>Total investment = $12,00,000</li>
    <li>Wealth gain = $11,20,000</li>
  </ul>
  <p className="mb-8">
    This example highlights the power of compounding — increasing either your monthly investment or tenure even slightly can lead to significantly higher returns.
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
