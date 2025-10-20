import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  RotateCcw,
  Copy,
  Share2,
  Info,
} from "lucide-react";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import AdBanner from "../components/AdBanner";
import RelatedCalculators from "../components/RelatedCalculators";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

/* ============================================================
   📦 CONSTANTS
   ============================================================ */
const LS_KEY = "cagr_calculator_v1";

const currencyOptions = [
  { code: "USD", symbol: "$", locale: "en-US", label: "US Dollar ($)" },
  { code: "INR", symbol: "₹", locale: "en-IN", label: "Indian Rupee (₹)" },
  { code: "EUR", symbol: "€", locale: "de-DE", label: "Euro (€)" },
  { code: "GBP", symbol: "£", locale: "en-GB", label: "British Pound (£)" },
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
  }).format(num);

/* ============================================================
   📈 COMPONENT
   ============================================================ */
const CAGRCalculator: React.FC = () => {
  // Inputs
  const [initialValue, setInitialValue] = useState<number>(0);
  const [finalValue, setFinalValue] = useState<number>(0);
  const [years, setYears] = useState<number>(0);
  const [months, setMonths] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("USD");

  // Outputs
  const [cagr, setCagr] = useState<number>(0);
  const [totalGain, setTotalGain] = useState<number>(0);
  const [annualReturn, setAnnualReturn] = useState<number>(0);

  // UI
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [hydrated, setHydrated] = useState(false);
  const [showInfoValue, setShowInfoValue] = useState(false);
  const [showInfoYears, setShowInfoYears] = useState(false);

  const currentLocale = findLocale(currency);
  const isDefault = !initialValue && !finalValue && !years && !months;

  /* ============================================================
     🔁 PERSISTENCE
     ============================================================ */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setInitialValue(s.initialValue || 0);
        setFinalValue(s.finalValue || 0);
        setYears(s.years || 0);
        setMonths(s.months || 0);
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
        JSON.stringify({ initialValue, finalValue, years, months, currency })
      );
    } catch {
      console.warn("⚠️ Could not save state");
    }
  }, [hydrated, initialValue, finalValue, years, months, currency]);

  /* ============================================================
     🧮 CALCULATION
     ============================================================ */
  useEffect(() => {
    const totalYears = years + months / 12;
    if (initialValue <= 0 || finalValue <= 0 || totalYears <= 0) {
      setCagr(0);
      setTotalGain(0);
      setAnnualReturn(0);
      return;
    }

    const growthFactor = finalValue / initialValue;
    const cagrValue = Math.pow(growthFactor, 1 / totalYears) - 1;
    const gain = finalValue - initialValue;

    setCagr(cagrValue * 100);
    setTotalGain(gain);
    setAnnualReturn((gain / totalYears) / initialValue * 100);
  }, [initialValue, finalValue, years, months]);

  /* ============================================================
     🔗 COPY / SHARE / RESET
     ============================================================ */
  const reset = () => {
    setInitialValue(0);
    setFinalValue(0);
    setYears(0);
    setMonths(0);
    setCurrency("USD");
    localStorage.removeItem(LS_KEY);
  };

  const copyResults = async () => {
    const text = [
      "CAGR Summary",
      `Initial Value: ${formatCurrency(initialValue, currentLocale, currency)}`,
      `Final Value: ${formatCurrency(finalValue, currentLocale, currency)}`,
      `Duration: ${years} years ${months} months`,
      `CAGR: ${cagr.toFixed(2)}%`,
      `Total Gain: ${formatCurrency(totalGain, currentLocale, currency)}`,
      `Avg Annual Return: ${annualReturn.toFixed(2)}%`,
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const encoded = btoa(JSON.stringify({ initialValue, finalValue, years, months, currency }));
    const url = new URL(window.location.href);
    url.searchParams.set("cagr", encoded);
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
        title="CAGR Calculator | Annual Growth Rate | CalculatorHub"
        description="Calculate your compound annual growth rate (CAGR) to measure investment performance accurately over time."
        canonical="https://calculatorhub.site/cagr-calculator"
        schemaData={generateCalculatorSchema(
          "CAGR Calculator",
          "Find your investment's annualized growth rate using CalculatorHub’s free CAGR Calculator.",
          "/cagr-calculator",
          ["CAGR calculator", "compound annual growth rate", "investment growth", "finance calculator"]
        )}
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Investment & Returns", url: "/category/investment-returns" },
            { name: "CAGR Calculator", url: "/cagr-calculator" },
          ]}
        />

        {/* ===== Header ===== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            📈 CAGR Calculator
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Calculate the Compound Annual Growth Rate (CAGR) of your investment and compare it across time periods easily.
          </p>
        </div>

        {/* ===== Input + Output Grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-sky-400" /> Investment Details
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

              {/* Initial Value */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Initial Value ({findSymbol(currency)})
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoValue(!showInfoValue)}
                  />
                </label>
                {showInfoValue && (
                  <p className="text-xs bg-[#0f172a] border border-[#334155] rounded-md p-2 mt-1">
                    The starting investment amount or portfolio value at the beginning of the period.
                  </p>
                )}
                <input
                  type="number"
                  min={0}
                  value={initialValue || ""}
                  onChange={(e) => setInitialValue(parseFloat(e.target.value) || 0)}
                  placeholder="Enter starting amount"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Final Value */}
              <div>
                <label className="text-sm font-medium text-slate-300">
                  Final Value ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={finalValue || ""}
                  onChange={(e) => setFinalValue(parseFloat(e.target.value) || 0)}
                  placeholder="Enter final value"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Investment Duration
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoYears(!showInfoYears)}
                  />
                </label>
                {showInfoYears && (
                  <p className="text-xs bg-[#0f172a] border border-[#334155] rounded-md p-2 mt-1">
                    Enter the total time the investment was held in years and months.
                  </p>
                )}
                <div className="flex gap-4">
                  <input
                    type="number"
                    min={0}
                    value={years || ""}
                    onChange={(e) => setYears(parseFloat(e.target.value) || 0)}
                    placeholder="Years"
                    className="w-1/2 bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    min={0}
                    value={months || ""}
                    onChange={(e) => setMonths(parseFloat(e.target.value) || 0)}
                    placeholder="Months"
                    className="w-1/2 bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">
              CAGR Summary
            </h2>
            <div className="space-y-6">
              <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                <div className="text-3xl font-bold text-white">
                  {cagr.toFixed(2)}%
                </div>
                <div className="text-sm text-slate-400">Compound Annual Growth Rate</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(totalGain, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Total Gain</div>
                </div>
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {annualReturn.toFixed(2)}%
                  </div>
                  <div className="text-sm text-slate-400">Avg Annual Return</div>
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
                    {copied === "results" ? "Results copied!" : "Link copied!"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== Chart & Breakdown ===== */}
        {cagr > 0 && (
          <div className="mt-6 bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              Investment Growth Breakdown
            </h3>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Pie Chart */}
              <div className="w-[90%] sm:w-[70%] md:w-[50%] max-w-[360px] h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Initial Value", value: initialValue },
                        { name: "Gain", value: totalGain },
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
                  <p className="text-sm text-slate-400">Initial Value</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(initialValue, currentLocale, currency)}
                  </p>
                </div>
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-emerald-500 transition">
                  <p className="text-sm text-slate-400">Total Gain</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(totalGain, currentLocale, currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Smart Tip ===== */}
        {cagr > 0 && (
          <div className="mt-5 bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm">
            <p className="text-base font-medium leading-snug text-slate-300">
              💡 Tip: A higher CAGR indicates stronger growth — but check if it’s 
              <span className="text-indigo-400 font-semibold"> consistent</span> and 
              <span className="text-emerald-400 font-semibold"> sustainable</span> over time.
            </p>
          </div>
        )}

        {/* ===== SEO / Informational Section ===== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          <h1 className="text-3xl font-bold text-cyan-400 mb-6">
            CAGR Calculator 2025 – Find Your Annual Investment Growth
          </h1>

          <p>
            The <strong>CAGR Calculator by CalculatorHub</strong> helps you measure the
            average yearly growth rate of an investment, showing how efficiently your
            money compounds over time.
          </p>

          <figure className="my-8">
            <img
              src="/images/cagr-calculator-hero.webp"
              alt="CAGR Calculator chart and dashboard"
              title="CAGR Calculator 2025 | Investment Growth Rate"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Visual representation of CAGR growth over multiple years.
            </figcaption>
          </figure>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧮 CAGR Formula
          </h2>
          <p className="font-mono text-center text-indigo-300">
            CAGR = ((Final Value / Initial Value) ^(1 / Years)) − 1
          </p>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📘 Example Calculation
          </h2>
          <p>
            Suppose you invested <strong>$10 000</strong> in 2020 and it’s now worth 
            <strong>$16 000</strong> in 2025 (5 years).  
            CAGR = ((16000 / 10000) ^(1 / 5)) − 1 = <strong>9.86 %</strong>.
          </p>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            💡 Why CAGR Matters
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Provides a consistent annualized return, even if growth fluctuated.</li>
            <li>Useful for comparing mutual funds, stocks, or business revenues.</li>
            <li>Shows the real compound effect over multiple years.</li>
          </ul>

          {/* ===== FAQ Section ===== */}
          <section id="faq" className="space-y-6 mt-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>

            <div className="space-y-5 text-lg text-slate-100 leading-relaxed">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q1: What is a good CAGR rate?
                </h3>
                <p>
                  It depends on the investment type — 5-10 % is typical for mutual funds, 
                  10-15 % for equities in the long term.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q2: Is CAGR the same as average return?
                </h3>
                <p>
                  No, CAGR accounts for compounding, while average return is a simple mean that ignores growth on growth.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q3: Can CAGR be negative?
                </h3>
                <p>
                  Yes — if the final value is less than the initial value, CAGR will be negative, indicating a loss.
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
              alt="CalculatorHub Finance Team"
              className="w-12 h-12 rounded-full border border-gray-600"
              loading="lazy"
            />
            <div>
              <p className="font-semibold text-white">
                Written by the CalculatorHub Finance Tools Team
              </p>
              <p className="text-sm text-slate-400">
                Updated for accuracy and clarity. Last updated:{" "}
                <time dateTime="2025-10-20">October 20, 2025</time>.
              </p>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              🚀 Explore more investment tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <a
                href="/roi-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all"
              >
                📈 ROI Calculator
              </a>
              <a
                href="/savings-goal-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all"
              >
                💰 Savings Goal Calculator
              </a>
              <a
                href="/loan-affordability-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-fuchsia-600/20 text-fuchsia-300 hover:text-fuchsia-400 px-3 py-2 rounded-md border border-slate-700 hover:border-fuchsia-500 transition-all"
              >
                🏠 Loan Affordability Calculator
              </a>
            </div>
          </div>
        </section>

        <AdBanner type="bottom" />
        <RelatedCalculators
          currentPath="/cagr-calculator"
          category="investment-returns"
        />
      </div>
    </>
  );
};

export default CAGRCalculator;
