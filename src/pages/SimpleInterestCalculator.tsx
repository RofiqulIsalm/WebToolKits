// ================= SimpleInterestCalculator.tsx (Part 1/2) =================
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
const LS_KEY = "simple_interest_calc_v1";

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
    maximumFractionDigits: 2,
  }).format(num);

/* ============================================================
   🧮 COMPONENT
   ============================================================ */
const SimpleInterestCalculator: React.FC = () => {
  // Inputs
  const [principal, setPrincipal] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [timeYears, setTimeYears] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("USD");

  // Outputs
  const [simpleInterest, setSimpleInterest] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  // UI state
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [hydrated, setHydrated] = useState(false);
  const [showInfoRate, setShowInfoRate] = useState(false);
  const [showInfoTime, setShowInfoTime] = useState(false);

  const currentLocale = findLocale(currency);
  const isDefault = !principal && !rate && !timeYears;

  /* ============================================================
     🔁 PERSISTENCE
     ============================================================ */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setPrincipal(s.principal || 0);
        setRate(s.rate || 0);
        setTimeYears(s.timeYears || 0);
        setCurrency(s.currency || "USD");
      }
    } catch {
      console.warn("⚠️ Could not load local state");
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ principal, rate, timeYears, currency })
      );
    } catch {
      console.warn("⚠️ Could not save local state");
    }
  }, [hydrated, principal, rate, timeYears, currency]);

  /* ============================================================
     🧮 CALCULATION
     ============================================================ */
  useEffect(() => {
    if (principal <= 0 || rate <= 0 || timeYears <= 0) {
      setSimpleInterest(0);
      setTotalAmount(0);
      return;
    }
    const si = (principal * rate * timeYears) / 100;
    setSimpleInterest(si);
    setTotalAmount(principal + si);
  }, [principal, rate, timeYears]);

  /* ============================================================
     📋 COPY / SHARE / RESET
     ============================================================ */
  const reset = () => {
    setPrincipal(0);
    setRate(0);
    setTimeYears(0);
    setCurrency("USD");
    localStorage.removeItem(LS_KEY);
  };

  const copyResults = async () => {
    const text = [
      "Simple Interest Summary",
      `Principal: ${formatCurrency(principal, currentLocale, currency)}`,
      `Rate: ${rate}%`,
      `Time: ${timeYears} years`,
      `Simple Interest: ${formatCurrency(simpleInterest, currentLocale, currency)}`,
      `Total Amount: ${formatCurrency(totalAmount, currentLocale, currency)}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const encoded = btoa(JSON.stringify({ principal, rate, timeYears, currency }));
    const url = new URL(window.location.href);
    url.searchParams.set("si", encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  /* ============================================================
     🎨 RENDER START
     ============================================================ */
  return (
    <>
      <SEOHead
        title="Simple Interest Calculator | CalculatorHub"
        description="Calculate simple interest and total amount easily using this free online simple interest calculator."
        canonical="https://calculatorhub.site/simple-interest-calculator"
        schemaData={generateCalculatorSchema(
          "Simple Interest Calculator",
          "Quickly find interest and total amount with CalculatorHub’s free online tool.",
          "/simple-interest-calculator",
          ["simple interest calculator", "interest formula", "finance tool"]
        )}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "Simple Interest Calculator", url: "/simple-interest-calculator" },
          ]}
        />

        {/* ===== Header ===== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            💰 Simple Interest Calculator
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Compute simple interest and total repayment amount based on principal, rate, and time.
          </p>
        </div>

        {/* ===== Input + Output Grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-sky-400" /> Loan / Deposit Details
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

              {/* Principal */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">
                  Principal ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={principal || ""}
                  onChange={(e) => setPrincipal(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter principal amount"
                />
              </div>

              {/* Rate */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Annual Interest Rate (%)
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoRate(!showInfoRate)}
                  />
                </label>
                {showInfoRate && (
                  <p className="text-xs bg-[#0f172a] border border-[#334155] rounded-md p-2 mt-1">
                    Annual percentage rate — interest earned or charged per year.
                  </p>
                )}
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={rate || ""}
                  onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 7.5"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Time */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Time Period (Years)
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoTime(!showInfoTime)}
                  />
                </label>
                {showInfoTime && (
                  <p className="text-xs bg-[#0f172a] border border-[#334155] rounded-md p-2 mt-1">
                    Enter duration in years — e.g. 2 for 2 years or 0.5 for 6 months.
                  </p>
                )}
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={timeYears || ""}
                  onChange={(e) => setTimeYears(parseFloat(e.target.value) || 0)}
                  placeholder="Enter time in years"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">
              Interest Summary
            </h2>
            <div className="space-y-6">
              <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(simpleInterest, currentLocale, currency)}
                </div>
                <div className="text-sm text-slate-400">Simple Interest</div>
              </div>

              <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                <div className="text-lg font-semibold text-white">
                  {formatCurrency(totalAmount, currentLocale, currency)}
                </div>
                <div className="text-sm text-slate-400">Total Amount (P + SI)</div>
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
                    {copied === "results" ? "Results copied!" : "Link copied!"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== Chart & Breakdown ===== */}
        {principal > 0 && simpleInterest > 0 && (
          <div className="mt-6 bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              Simple Interest Breakdown
            </h3>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Pie Chart */}
              <div className="w-[90%] sm:w-[70%] md:w-[50%] max-w-[360px] h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Principal", value: principal },
                        { name: "Interest", value: simpleInterest },
                      ]}
                      dataKey="value"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#22c55e" />
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

              {/* Summary */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-sky-500 transition">
                  <p className="text-sm text-slate-400">Principal</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(principal, currentLocale, currency)}
                  </p>
                </div>
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-emerald-500 transition">
                  <p className="text-sm text-slate-400">Interest Earned</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(simpleInterest, currentLocale, currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Smart Tip ===== */}
        {simpleInterest > 0 && (
          <div className="mt-5 bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm">
            <p className="text-base font-medium leading-snug text-slate-300">
              💡 Tip: Increasing your <span className="text-indigo-400 font-semibold">time period</span> 
              or <span className="text-emerald-400 font-semibold">interest rate</span> boosts 
              your earnings linearly under simple interest — unlike compound interest!
            </p>
          </div>
        )}

        {/* ===== SEO Content Section ===== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          <h1 className="text-3xl font-bold text-cyan-400 mb-6">
            Simple Interest Calculator 2025 – Easy Online Interest Guide
          </h1>
        
          <p>
            The <strong>Simple Interest Calculator by CalculatorHub</strong> is a quick and
            accurate financial tool that helps users calculate total interest and overall
            repayment with ease. Whether you’re a student, professional, or small business
            owner, this <strong>simple Simple Interest Calculator</strong> delivers clear
            results in seconds.
          </p>
        
          <figure className="my-8">
            <img
              src="/images/simple-interest-calculator-hero.webp"
              alt="Simple Interest Calculator interface showing results and chart"
              title="Simple Interest Calculator 2025 | Free Online Tool"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Visualization of the Simple Interest Calculator dashboard UI.
            </figcaption>
          </figure>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🔎 What is a Simple Interest Calculator?
          </h2>
          <p>
            A <strong>Simple Interest Calculator</strong> computes interest on a fixed
            principal amount over a specific period. It’s ideal for loans, savings, or
            deposits where interest is not compounded. This <strong>Simple Interest Calculator explained</strong> makes understanding financial growth
            easier for everyone — from beginners to professionals.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ⚙️ How to Use Simple Interest Calculator
          </h2>
          <p>
            Using this <strong>free Simple Interest Calculator online</strong> is simple:
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter your <strong>principal amount</strong> (loan or investment).</li>
            <li>Add the <strong>annual interest rate</strong>.</li>
            <li>Specify the <strong>time period</strong> in years or months.</li>
            <li>Click “Calculate” to view interest earned and total amount.</li>
          </ol>
          <p>
            It’s an <strong>easy Simple Interest Calculator</strong> built for clarity,
            accuracy, and user-friendliness.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            💡 Simple Interest Formula
          </h2>
          <p className="font-mono text-center text-indigo-300">
            SI = (P × R × T) / 100  Total = P + SI
          </p>
          <p>
            Here, <strong>P</strong> = Principal, <strong>R</strong> = Rate of interest per year, and <strong>T</strong> = Time in years.  
            The <strong>advanced Simple Interest Calculator</strong> applies this formula instantly
            to deliver accurate results every time.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📘 Example Calculation
          </h2>
          <p>
            Imagine you deposit <strong>$10,000</strong> at an interest rate of
            <strong> 8%</strong> per year for <strong>3 years</strong>.  
            Simple Interest = (10,000 × 8 × 3) / 100 = <strong>$2,400</strong>.  
            Total Amount = <strong>$12,400</strong>.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🌟 Benefits of Simple Interest Calculator
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Instant results for quick loan or savings planning.</li>
            <li>No registration — it’s a <strong>free Simple Interest Calculator</strong>.</li>
            <li>Perfect for educational and financial tutorials.</li>
            <li>Available as a <strong>service Simple Interest Calculator</strong> across devices.</li>
          </ul>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧩 Simple Interest Calculator Comparison & Cost
          </h2>
          <p>
            Compared to manual calculations or Excel sheets, this <strong>platform Simple Interest Calculator</strong> is faster and more accurate.
            The <strong>Simple Interest Calculator cost</strong> is completely free, with optional
            <strong> premium Simple Interest Calculator</strong> plans offering exports and
            historical charts for professionals.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧠 Simple Interest Calculator Guide for Beginners
          </h2>
          <p>
            This <strong>Simple Interest Calculator guide</strong> is perfect for
            newcomers learning finance basics. The **professional Simple Interest Calculator**
            version supports detailed analysis for advisors or teachers.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧾 Simple Interest Calculator Alternatives
          </h2>
          <p>
            While there are many <strong>Simple Interest Calculator alternatives</strong>,
            most lack the responsive design and accuracy that CalculatorHub provides.
            Whether you need a quick, mobile-friendly solution or a
            <strong> premium Simple Interest Calculator</strong> with export features,
            this platform offers both free and paid versions to fit your needs.
          </p>
        
          {/* ===== FAQ Section ===== */}
          <section id="faq" className="space-y-6 mt-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>
        
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q1: How does a Simple Interest Calculator work?
                </h3>
                <p>
                  It calculates fixed interest based on the principal, rate, and time —
                  ideal for short-term financial planning.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q2: What’s the difference between simple and compound interest?
                </h3>
                <p>
                  Simple interest is calculated only on the original principal, while
                  compound interest includes accumulated interest from previous periods.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q3: Is there a cost to use this calculator?
                </h3>
                <p>
                  No. The basic version is free, while the premium one offers additional
                  customization and data export options.
                </p>
              </div>
            </div>
          </section>
        </section>


        <AdBanner type="bottom" />
        <RelatedCalculators
          currentPath="/simple-interest-calculator"
          category="currency-finance"
        />
      </div>
    </>
  );
};

export default SimpleInterestCalculator;
