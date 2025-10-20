import React, { useState, useEffect } from "react";
import {
  Briefcase,
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
   ⚙️ CONSTANTS
   ============================================================ */
const LS_KEY = "salary_raise_calculator_v1";

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
   💼 COMPONENT
   ============================================================ */
const PayRaiseCalculator: React.FC = () => {
  // Inputs
  const [currentSalary, setCurrentSalary] = useState<number>(0);
  const [raisePercent, setRaisePercent] = useState<number>(0);
  const [raiseAmount, setRaiseAmount] = useState<number>(0);
  const [usePercent, setUsePercent] = useState<boolean>(true);
  const [currency, setCurrency] = useState<string>("USD");

  // Outputs
  const [newSalary, setNewSalary] = useState<number>(0);
  const [increase, setIncrease] = useState<number>(0);
  const [increasePercent, setIncreasePercent] = useState<number>(0);

  // UI
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [showInfoMode, setShowInfoMode] = useState(false);

  const currentLocale = findLocale(currency);
  const isDefault = !currentSalary && !raisePercent && !raiseAmount;

  /* ============================================================
     🔁 PERSISTENCE
     ============================================================ */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setCurrentSalary(s.currentSalary || 0);
        setRaisePercent(s.raisePercent || 0);
        setRaiseAmount(s.raiseAmount || 0);
        setUsePercent(s.usePercent ?? true);
        setCurrency(s.currency || "USD");
      }
    } catch {
      console.warn("⚠️ Failed to load state");
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ currentSalary, raisePercent, raiseAmount, usePercent, currency })
      );
    } catch {
      console.warn("⚠️ Could not save state");
    }
  }, [hydrated, currentSalary, raisePercent, raiseAmount, usePercent, currency]);

  /* ============================================================
     🧮 CALCULATION
     ============================================================ */
  useEffect(() => {
    if (currentSalary <= 0) {
      setNewSalary(0);
      setIncrease(0);
      setIncreasePercent(0);
      return;
    }

    let inc = 0;
    let incPercent = 0;

    if (usePercent) {
      inc = (currentSalary * raisePercent) / 100;
      incPercent = raisePercent;
    } else {
      inc = raiseAmount;
      incPercent = (raiseAmount / currentSalary) * 100;
    }

    const total = currentSalary + inc;
    setIncrease(inc);
    setIncreasePercent(incPercent);
    setNewSalary(total);
  }, [currentSalary, raisePercent, raiseAmount, usePercent]);

  /* ============================================================
     🔗 COPY / SHARE / RESET
     ============================================================ */
  const reset = () => {
    setCurrentSalary(0);
    setRaisePercent(0);
    setRaiseAmount(0);
    setUsePercent(true);
    setCurrency("USD");
    localStorage.removeItem(LS_KEY);
  };

  const copyResults = async () => {
    const text = [
      "Salary Raise Summary",
      `Current Salary: ${formatCurrency(currentSalary, currentLocale, currency)}`,
      `Raise: ${usePercent ? raisePercent + "%" : formatCurrency(raiseAmount, currentLocale, currency)}`,
      `Increase: ${formatCurrency(increase, currentLocale, currency)} (${increasePercent.toFixed(2)}%)`,
      `New Salary: ${formatCurrency(newSalary, currentLocale, currency)}`,
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const encoded = btoa(JSON.stringify({ currentSalary, raisePercent, raiseAmount, usePercent, currency }));
    const url = new URL(window.location.href);
    url.searchParams.set("raise", encoded);
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
        title="Pay Raise / Salary Hike Calculator | CalculatorHub"
        description="Calculate your new salary after a raise or promotion. Find percentage increase, raise amount, and compare monthly vs yearly income."
        canonical="https://calculatorhub.site/pay-raise-calculator"
        schemaData={generateCalculatorSchema(
          "Pay Raise Calculator",
          "Estimate your new salary, raise percentage, and total annual income after a pay hike.",
          "/pay-raise-calculator",
          ["pay raise", "salary hike", "promotion calculator", "income increase"]
        )}
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Finance & Salary", url: "/category/finance-salary" },
            { name: "Pay Raise Calculator", url: "/pay-raise-calculator" },
          ]}
        />

        {/* ===== Header ===== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            💼 Pay Raise / Salary Hike Calculator
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Easily calculate your new salary, raise percentage, and total yearly growth after a pay increase or promotion.
          </p>
        </div>

        {/* ===== Input + Output Grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-sky-400" /> Salary Details
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

              {/* Current Salary */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">
                  Current Annual Salary ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={currentSalary || ""}
                  onChange={(e) => setCurrentSalary(parseFloat(e.target.value) || 0)}
                  placeholder="Enter your current salary"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Mode Selection */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  Raise Mode
                  <Info
                    onClick={() => setShowInfoMode(!showInfoMode)}
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                  />
                </label>
                {showInfoMode && (
                  <p className="text-xs bg-[#0f172a] border border-[#334155] rounded-md p-2 mt-1">
                    Choose whether you want to calculate raise by percentage (%) or fixed amount.
                  </p>
                )}
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => setUsePercent(true)}
                    className={`px-3 py-1.5 rounded-md border text-sm transition ${
                      usePercent
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-[#0f172a] border-[#334155] text-slate-300 hover:border-indigo-400"
                    }`}
                  >
                    Percentage
                  </button>
                  <button
                    onClick={() => setUsePercent(false)}
                    className={`px-3 py-1.5 rounded-md border text-sm transition ${
                      !usePercent
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-[#0f172a] border-[#334155] text-slate-300 hover:border-indigo-400"
                    }`}
                  >
                    Fixed Amount
                  </button>
                </div>
              </div>

              {/* Raise Field */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">
                  {usePercent ? "Raise Percentage (%)" : `Raise Amount (${findSymbol(currency)})`}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={usePercent ? raisePercent : raiseAmount || ""}
                  onChange={(e) =>
                    usePercent
                      ? setRaisePercent(parseFloat(e.target.value) || 0)
                      : setRaiseAmount(parseFloat(e.target.value) || 0)
                  }
                  placeholder={usePercent ? "Enter raise %" : "Enter raise amount"}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
