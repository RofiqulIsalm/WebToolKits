import React, { useEffect, useMemo, useState } from "react";
import {
  Home,
  RotateCcw,
  Share2,
  Copy,
  BarChart2,
  ChevronDown,
  ChevronUp,
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

/* ----------------------------- Utilities ----------------------------- */
const LS_KEY = "mortgage_calculator_dark";

const currencyOptions = [
  { code: "INR", symbol: "₹", locale: "en-IN", label: "Indian Rupee (₹)" },
  { code: "USD", symbol: "$", locale: "en-US", label: "US Dollar ($)" },
  { code: "EUR", symbol: "€", locale: "de-DE", label: "Euro (€)" },
  { code: "GBP", symbol: "£", locale: "en-GB", label: "British Pound (£)" },
  { code: "AUD", symbol: "A$", locale: "en-AU", label: "Australian Dollar (A$)" },
];

const findLocale = (code: string) =>
  currencyOptions.find((c) => c.code === code)?.locale || "en-IN";
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

/* ----------------------------- Component ----------------------------- */
const MortgageCalculator: React.FC = () => {
  /* Inputs */
  const [loanAmount, setLoanAmount] = useState(0);
  const [downPayment, setDownPayment] = useState(0);
  const [interestRate, setInterestRate] = useState(0);
  const [loanYears, setLoanYears] = useState(0);
  const [loanMonths, setLoanMonths] = useState(0);
  const [currency, setCurrency] = useState("INR");

  /* Derived + Outputs */
  const totalMonths = loanYears * 12 + loanMonths;
  const principal = Math.max(loanAmount - downPayment, 0);
  const monthlyRate = interestRate / 12 / 100;

  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);

  /* UI states */
  const [showAmort, setShowAmort] = useState(false);
  const [granularity, setGranularity] = useState<"yearly" | "monthly">("yearly");
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");

  const currentLocale = findLocale(currency);
  const isDefault = !loanAmount && !downPayment && !interestRate && !loanYears && !loanMonths;

  /* Normalize months > 11 */
  useEffect(() => {
    if (loanMonths >= 12) {
      const extraYears = Math.floor(loanMonths / 12);
      setLoanYears((p) => p + extraYears);
      setLoanMonths(loanMonths % 12);
    }
  }, [loanMonths]);

  /* Load & Save state */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromURL = params.get("mc");
    if (fromURL) {
      try {
        const decoded = JSON.parse(atob(fromURL));
        applyState(decoded);
        return;
      } catch {}
    }
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        applyState(JSON.parse(raw));
      } catch {}
    }
  }, []);

  const applyState = (s: any) => {
    setLoanAmount(Number(s.loanAmount) || 0);
    setDownPayment(Number(s.downPayment) || 0);
    setInterestRate(Number(s.interestRate) || 0);
    setLoanYears(Number(s.loanYears) || 0);
    setLoanMonths(Number(s.loanMonths) || 0);
    setCurrency(typeof s.currency === "string" ? s.currency : "INR");
  };

  useEffect(() => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ loanAmount, downPayment, interestRate, loanYears, loanMonths, currency })
    );
  }, [loanAmount, downPayment, interestRate, loanYears, loanMonths, currency]);

  /* Calculation */
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

  /* Amortization Schedule */
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

  /* Pie + Insights */
  const pieData = [
    { name: "Principal", value: Math.max(principal, 0) },
    { name: "Interest", value: Math.max(totalInterest, 0) },
  ];
  const PIE_COLORS = ["#3b82f6", "#a855f7"];
  const interestPct = principal > 0 ? (totalInterest / principal) * 100 : 0;
  const tips = useMemo(() => {
    const t: string[] = [];
    if (principal && totalInterest)
      t.push(`Over the term, you'll pay ~${interestPct.toFixed(0)}% of your loan as interest.`);
    if (downPayment)
      t.push(
        `Your down payment reduces the financed amount to ${formatCurrency(
          principal,
          currentLocale,
          currency
        )}.`
      );
    return t;
  }, [principal, totalInterest, interestPct, downPayment, currentLocale, currency]);

  /* Copy + Share */
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

  /* ----------------------------- Render ----------------------------- */
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

      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] text-gray-100 pb-20">
        <div className="max-w-6xl mx-auto px-4 pt-8">
          <Breadcrumbs
            items={[
              { name: "Currency & Finance", url: "/category/currency-finance" },
              { name: "Mortgage Calculator", url: "/mortgage-calculator" },
            ]}
          />

          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Mortgage Calculator
          </h1>
          <p className="text-indigo-200 mb-8">
            Estimate payments, interest, and view your amortization schedule.
          </p>

          {/* ------------------- Main Grid ------------------- */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Inputs */}
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-indigo-100">Loan Details</h2>
                <button
                  onClick={reset}
                  disabled={isDefault}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md font-medium transition ${
                    isDefault
                      ? "bg-white/10 text-gray-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  <RotateCcw size={16} />
                  Reset
                </button>
              </div>

              {/* Currency */}
              <label className="block text-sm text-indigo-200 mb-2">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full mb-4 px-4 py-2 bg-transparent border border-white/30 rounded-lg text-white focus:ring-2 focus:ring-indigo-400"
              >
                {currencyOptions.map((o) => (
                  <option key={o.code} value={o.code} className="text-black">
                    {o.label}
                  </option>
                ))}
              </select>

              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Loan Amount</label>
                  <input
                    type="number"
                    value={loanAmount || ""}
                    placeholder="Enter loan amount"
                    min={0}
                    onChange={(e) => setLoanAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 focus:ring-2 focus:ring-indigo-400 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Down Payment (Optional)</label>
                  <input
                    type="number"
                    value={downPayment || ""}
                    placeholder="Enter down payment"
                    min={0}
                    onChange={(e) =>
                      setDownPayment(clamp(parseFloat(e.target.value) || 0, 0, loanAmount || 0))
                    }
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 focus:ring-2 focus:ring-indigo-400 text-white"
                  />
                  <p className="text-xs text-indigo-300 mt-1">
                    Financed: {formatCurrency(principal, currentLocale, currency)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={interestRate || ""}
                    placeholder="Annual interest rate"
                    min={0}
                    onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 focus:ring-2 focus:ring-indigo-400 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Loan Term</label>
                  <div className="flex gap-4">
                    <input
                      type="number"
                      value={loanYears || ""}
                      placeholder="Years"
                      min={0}
                      onChange={(e) => setLoanYears(parseInt(e.target.value) || 0)}
                      className="w-1/2 px-4 py-2 rounded-lg bg-white/5 border border-white/20 focus:ring-2 focus:ring-indigo-400 text-white"
                    />
                    <input
                      type="number"
                      value={loanMonths || ""}
                      placeholder="Months"
                      min={0}
                      max={11}
                      onChange={(e) => setLoanMonths(parseInt(e.target.value) || 0)}
                      className="w-1/2 px-4 py-2 rounded-lg bg-white/5 border border-white/20 focus:ring-2 focus:ring-indigo-400 text-white"
                    />
                  </div>
                  <p className="text-xs text-indigo-300 mt-1">
                    Total payments: {totalMonths > 0 ? totalMonths : 0} months
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Summary */}
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-indigo-100 mb-4">Mortgage Summary</h2>
              <div className="text-center p-4 bg-white/10 rounded-lg mb-6">
                <Home className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(monthlyPayment, currentLocale, currency)}
                </div>
                <p className="text-sm text-indigo-300">Monthly EMI</p>
                <p className="text-xs text-indigo-400 mt-2">
                  Total: {formatCurrency(totalPayment, currentLocale, currency)} • Interest:{" "}
                  {formatCurrency(totalInterest, currentLocale, currency)}
                </p>
              </div>

              {/* Tips */}
              {tips.length > 0 && (
                <div className="bg-indigo-900/30 border border-indigo-700 rounded-lg p-4 mb-6">
                  <p className="font-semibold mb-2 text-indigo-300">Insights</p>
                  <ul className="list-disc pl-5 space-y-1 text-indigo-200 text-sm">
                    {tips.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}

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
                  <span className="text-green-400 text-sm">
                    {copied === "results" ? "Results copied!" : "Link copied!"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ------------------- Pie Chart ------------------- */}
          <div className="mt-12 bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="text-indigo-400" />
              <h3 className="text-lg font-semibold text-indigo-100">
                Principal vs Interest Breakdown
              </h3>
            </div>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius="80%"
                    label={({ name }) => name}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
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
          </div>

          {/* ------------------- Amortization ------------------- */}
          <div className="mt-8 bg-white/10 backdrop-blur border border-white/20 rounded-2xl">
            <button
              onClick={() => setShowAmort((v) => !v)}
              className="w-full flex items-center justify-between px-6 py-4 text-indigo-100"
            >
              <span className="text-lg font-semibold">Amortization Schedule</span>
              {showAmort ? <ChevronUp /> : <ChevronDown />}
            </button>

            {showAmort && (
              <div className="px-6 pb-6">
                <div className="flex items-center gap-4 mb-4">
                  <label className="text-sm text-indigo-300">Granularity:</label>
                  <select
                    value={granularity}
                    onChange={(e) => setGranularity(e.target.value as any)}
                    className="px-3 py-2 bg-transparent border border-indigo-600 rounded-md text-indigo-100 text-sm"
                  >
                    <option value="yearly">Yearly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-indigo-100">
                    <thead>
                      <tr className="bg-indigo-900/40">
                        <th className="text-left px-4 py-2">
                          {granularity === "yearly" ? "Year" : "Month"}
                        </th>
                        <th className="text-right px-4 py-2">Principal</th>
                        <th className="text-right px-4 py-2">Interest</th>
                        <th className="text-right px-4 py-2">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((r) => (
                        <tr key={r.period} className="border-b border-white/10">
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
                          <td
                            colSpan={4}
                            className="px-4 py-6 text-center text-indigo-400"
                          >
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

          <AdBanner type="bottom" />
          <RelatedCalculators
            currentPath="/mortgage-calculator"
            category="currency-finance"
          />
        </div>
      </div>
    </>
  );
};

export default MortgageCalculator;
