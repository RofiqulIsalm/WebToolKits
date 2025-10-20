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
