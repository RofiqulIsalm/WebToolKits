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
        /* LINE CHART VIEW */
        <div className="w-full sm:w-[90%] md:w-[80%] h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthData}>
              <XAxis
                dataKey="year"
                tick={{ fill: "#cbd5e1", fontSize: 12 }}
                axisLine={{ stroke: "#475569" }}
              />
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
              <Line
                type="monotone"
                dataKey="value"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={{ r: 3, stroke: "#22c55e", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: "#22c55e" }}
              />
            </LineChart>
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



{/* ---------- How SIP is Calculated (Enhanced Step-by-Step UI) ---------- */}
<div className="mt-10 bg-[#0f172a] border border-slate-700 rounded-xl p-6 shadow-inner">
  <button
    onClick={() => setShowSteps((v) => !v)}
    className="flex justify-between items-center w-full text-left text-white text-lg font-semibold"
  >
    🧮 How SIP is Calculated
    {showSteps ? <ChevronUp /> : <ChevronDown />}
  </button>

  {showSteps && (
    <div className="mt-5 text-slate-300 text-sm leading-relaxed space-y-6">
      {/* Formula explanation */}
      <div>
        <p className="text-slate-200 mb-2">
          SIP Future Value (FV) is calculated using the formula:
        </p>

          <ul className="list-disc ml-6 mt-3 mb-3 space-y-1">
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
        <div className="overflow-x-auto rounded-md bg-[#0b1220] px-3 py-2 border border-slate-700 text-slate-300 text-[13px] whitespace-nowrap font-mono">

          
          <div className="space-y-2 font-mono text-[13px] text-slate-300">
            <p>r = {r.toFixed(6)}</p>
            <p>(1 + r) = {onePlusR.toFixed(6)}</p>
            <p>(1 + r)<sup>n</sup > = {pow.toFixed(6)}</p>
            <p>Numerator ((1 + r)<sup>n</sup> - 1) = {numerator.toFixed(6)}</p>
            <p>Denominator (r) = {denominator.toFixed(6)}</p>
            <p>Factor ((1 + r)<sup>n</sup> - 1) / r = {factor.toFixed(6)}</p>

          </div>

        </div>

        
      </div>

      {/* Display current P, r, n values */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center">
          <div className="text-emerald-300 text-xs uppercase">P (Monthly Investment)</div>
          <div className="font-semibold text-white text-sm truncate">
            {formatCurrency(monthlyInvestment)}
          </div>
        </div>
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center">
          <div className="text-rose-300 text-xs uppercase">r (Monthly Rate)</div>
          <div className="font-semibold text-white text-sm truncate">
            {(annualReturn / 12 / 100).toFixed(6)}
          </div>
        </div>
        <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-center">
          <div className="text-sky-300 text-xs uppercase">n (Months)</div>
          <div className="font-semibold text-white text-sm truncate">
            {months}
          </div>
        </div>
      </div>



    {/* Step 2 - Substitute actual values (4-line notebook style) */}
      <div>
        <h4 className="text-indigo-400 font-semibold mb-2">
           Calculated
        </h4>
      
        <div className="overflow-x-auto rounded-md bg-[#0b1220] px-3 py-3 border border-slate-700 text-[13.5px] font-mono text-slate-200 leading-7">
          <pre className="whitespace-pre-wrap">
            {`FV = P × ((1 + r)n − 1) ÷ r × (1 + r)
            FV = ${formatCurrency(P)} × ((1 + ${r.toFixed(6)})^${n} − 1) ÷ ${r.toFixed(6)} × (1 + ${r.toFixed(6)})
               = ${formatCurrency(P)} × ${(numerator).toFixed(6)} ÷ ${r.toFixed(6)} × ${onePlusR.toFixed(6)}
               = ${formatCurrency(P)} × ${(factor).toFixed(6)} × ${onePlusR.toFixed(6)}
               = ${formatCurrency(futureValueCalc)}`}
          </pre>
        </div>
      </div>



      {/* Final FV summary */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-2 rounded-xl bg-[#0b1220] px-4 py-3 ring-1 ring-indigo-500/30">
        <span className="text-sm text-indigo-300 whitespace-nowrap">💰 Calculated SIP Maturity Value</span>
        <span className="text-lg sm:text-xl font-bold tracking-wide text-white">
          {formatCurrency(futureValue)}
        </span>
      </div>
    </div>
  )}
</div>



        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/sip-calculator" category="investments" />
      </div>
    </>
  );
};

export default SipCalculator;
