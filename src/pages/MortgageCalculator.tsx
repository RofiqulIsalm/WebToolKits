import React, { useEffect, useMemo, useState } from "react";
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
  { code: "INR", symbol: "₹", locale: "en-IN", label: "Indian Rupee (₹)" },
  { code: "USD", symbol: "$", locale: "en-US", label: "US Dollar ($)" },
  { code: "EUR", symbol: "€", locale: "de-DE", label: "Euro (€)" },
  { code: "GBP", symbol: "£", locale: "en-GB", label: "British Pound (£)" },
  { code: "AUD", symbol: "A$", locale: "en-AU", label: "Australian Dollar (A$)" },
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
  const [currency, setCurrency] = useState<string>("INR");

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
     🔁 SECTION 3: Normalization & Persistence
     ============================================================ */
  // Normalize months >= 12 → carry to years
  useEffect(() => {
    if (loanMonths >= 12) {
      const extraYears = Math.floor(loanMonths / 12);
      setLoanYears((p) => p + extraYears);
      setLoanMonths(loanMonths % 12);
    }
  }, [loanMonths]);

  // Load from URL param (?mc=) first, otherwise from localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromURL = params.get("mc");
    if (fromURL) {
      try {
        const s = JSON.parse(atob(fromURL));
        applyState(s);
        return;
      } catch {}
    }
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        const s = JSON.parse(raw);
        applyState(s);
      } catch {}
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        loanAmount,
        downPayment,
        interestRate,
        loanYears,
        loanMonths,
        currency,
      })
    );
  }, [loanAmount, downPayment, interestRate, loanYears, loanMonths, currency]);

  const applyState = (s: any) => {
    setLoanAmount(Number(s.loanAmount) || 0);
    setDownPayment(Number(s.downPayment) || 0);
    setInterestRate(Number(s.interestRate) || 0);
    setLoanYears(Number(s.loanYears) || 0);
    setLoanMonths(Number(s.loanMonths) || 0);
    setCurrency(typeof s.currency === "string" ? s.currency : "INR");
  };

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
    setCurrency("INR");
    setShowAmort(false);
    setGranularity("yearly");
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

        {/* ===== Amortization ===== */}
        <div className="mt-8 bg-[#1e293b] rounded-xl shadow-md border border-[#334155]">
          <button
            onClick={() => setShowAmort((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 text-slate-200"
          >
            <span className="text-lg font-semibold">Amortization Schedule</span>
            {showAmort ? <ChevronUp /> : <ChevronDown />}
          </button>

          {showAmort && (
            <div className="px-6 pb-6">
              <div className="flex items-center gap-4 mb-4">
                <label className="text-sm text-slate-300">Granularity:</label>
                <select
                  value={granularity}
                  onChange={(e) => setGranularity(e.target.value as "yearly" | "monthly")}
                  className="px-3 py-2 bg-transparent border border-[#334155] rounded-md text-slate-100 text-sm"
                >
                  <option value="yearly">Yearly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-slate-100">
                  <thead>
                    <tr className="bg-[#0f172a]">
                      <th className="text-left px-4 py-2">{granularity === "yearly" ? "Year" : "Month"}</th>
                      <th className="text-right px-4 py-2">Principal</th>
                      <th className="text-right px-4 py-2">Interest</th>
                      <th className="text-right px-4 py-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((r) => (
                      <tr key={r.period} className="border-b border-[#334155]">
                        <td className="px-4 py-2">{r.period}</td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency(r.principalPaid, currentLocale, currency)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency(r.interestPaid, currentLocale, currency)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency(r.balance, currentLocale, currency)}
                        </td>
                      </tr>
                    ))}
                    {schedule.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                          Enter valid details to view schedule.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ==================== SEO CONTENT SECTION ==================== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          <h1 className="text-3xl font-bold text-cyan-400 mb-6">
            Mortgage Calculator 2025 – Fast, Accurate & Easy EMI Estimator
          </h1>

          <p>
            The <strong>Mortgage Calculator by CalculatorHub</strong> helps you estimate your <strong>monthly EMI</strong>,{" "}
            <strong>total interest</strong>, and <strong>amortization schedule</strong> for home loans in multiple currencies.
            Enter the loan amount, down payment, interest rate, and term to get an instant, professional-grade breakdown.
          </p>

          <p>
            This tool uses a standard amortizing mortgage formula and supports mixed terms (years + months), a down-payment field, and a shareable link so you can revisit or send your scenario to others.
          </p>

          <figure className="my-8">
            <img
              src="/images/mortgage-calculator-hero.webp"
              alt="Modern mortgage calculator UI showing EMI, pie chart, and amortization table"
              title="Mortgage Calculator 2025 | Free EMI & Amortization Tool"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Visual representation of the Mortgage Calculator with dark-finance UI.
            </figcaption>
          </figure>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">🧮 How EMI is Calculated</h2>
          <p>We use the standard EMI formula for amortizing loans:</p>
          <pre className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 overflow-x-auto">
{`EMI = P × r × (1 + r)^n / ((1 + r)^n − 1)

Where:
P = Principal (loanAmount - downPayment)
r = Monthly interest rate (annualRate / 12 / 100)
n = Total number of months`}
          </pre>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">💡 How to Use This Mortgage Calculator</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Select your <strong>currency</strong>.</li>
            <li>Enter <strong>loan amount</strong> and optional <strong>down payment</strong>.</li>
            <li>Add the <strong>annual interest rate</strong>.</li>
            <li>Set <strong>loan term</strong> in years and months.</li>
            <li>Copy results or share a link with your configuration.</li>
          </ol>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">📘 Example Calculation</h2>
          <p>
            Suppose you borrow <strong>$300,000</strong> at <strong>6.5%</strong> for <strong>30 years</strong> with a <strong>$30,000</strong> down payment.
            Your financed principal is <strong>$270,000</strong> and your EMI will be around <strong>$1,706</strong>.
            Over the term, you will pay roughly <strong>$344,000</strong> in interest (values approximate).
          </p>

          {/* ===================== FAQ SECTION ===================== */}
          <section className="space-y-6 mt-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>

            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q1: What is a mortgage EMI?</h3>
                <p>
                  EMI (Equated Monthly Installment) is the fixed monthly payment you make to repay your mortgage over time.
                  It includes both principal and interest components.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q2: Does the calculator support down payment?</h3>
                <p>
                  Yes. Enter a down payment and we automatically reduce the financed principal before calculating EMI and the schedule.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q3: Can I share my results?</h3>
                <p>
                  Use the <strong>Copy Link</strong> button to copy a URL with your inputs encoded. Opening that link will restore the same scenario.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q4: Do you store my data?</h3>
                <p>
                  No. All calculations run locally in your browser. We only use <strong>localStorage</strong> to remember your last session on your device for convenience.
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

          <p className="mt-6 text-sm text-slate-400">
            Explore more tools:
            <a href="/loan-emi-calculator" className="text-indigo-400 hover:underline"> Loan EMI Calculator</a>,
            <a href="/tax-calculator" className="text-indigo-400 hover:underline"> Income Tax Calculator</a>, and
            <a href="/currency-converter" className="text-indigo-400 hover:underline"> Currency Converter</a>.
          </p>
        </section>

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/mortgage-calculator" category="currency-finance" />
      </div>
    </>
  );
};

export default MortgageCalculator;

