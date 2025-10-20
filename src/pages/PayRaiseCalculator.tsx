import React, { useState, useEffect } from "react";
import {
  Briefcase,
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
   ⚙️ CONSTANTS
   ============================================================ */
const PIE_COLORS = ["#3b82f6", "#22c55e"];
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

          {/* ===== Output Section ===== */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">
              Salary Summary
            </h2>

            <div className="space-y-6">
              <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(newSalary, currentLocale, currency)}
                </div>
                <div className="text-sm text-slate-400">New Annual Salary</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(increase, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Raise Amount</div>
                </div>
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {increasePercent.toFixed(2)}%
                  </div>
                  <div className="text-sm text-slate-400">Raise %</div>
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

        {/* ===== Chart & Insights ===== */}
        {newSalary > 0 && (
          <div className="mt-6 bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              Current vs New Salary
            </h3>
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              <div className="w-[90%] sm:w-[70%] md:w-[50%] max-w-[360px] h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Current Salary", value: currentSalary },
                        { name: "Increase", value: increase },
                      ]}
                      dataKey="value"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {PIE_COLORS.map((c, i) => (
                        <Cell key={i} fill={c} />
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

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-sky-500 transition">
                  <p className="text-sm text-slate-400">Current Salary</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(currentSalary, currentLocale, currency)}
                  </p>
                </div>
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-emerald-500 transition">
                  <p className="text-sm text-slate-400">Raise Amount</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(increase, currentLocale, currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Smart Tip ===== */}
        {newSalary > 0 && (
          <div className="mt-5 bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm">
            <p className="text-base font-medium leading-snug text-slate-300">
              💡 Tip: Consider negotiating additional benefits like bonuses or
              remote-work options — a pay raise is more valuable when combined
              with better work-life balance!
            </p>
          </div>
        )}

        {/* ===== SEO / Informational Section ===== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          <h1 className="text-3xl font-bold text-cyan-400 mb-6">
            Pay Raise Calculator 2025 – Find Your New Salary After Hike
          </h1>

          <p>
            The <strong>Pay Raise / Salary Hike Calculator by CalculatorHub</strong> helps you
            estimate your <strong>new salary</strong> after a raise or promotion.
            Enter your current income and raise % or amount to see how much
            you’ll earn yearly and monthly.
          </p>

          <figure className="my-8">
            <img
              src="/images/pay-raise-calculator-hero.webp"
              alt="Pay Raise Calculator dashboard"
              title="Pay Raise Calculator 2025 | Salary Growth Tool"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Salary hike dashboard showing increase and new annual income.
            </figcaption>
          </figure>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧮 How Pay Raise is Calculated
          </h2>
          <p className="font-mono text-center text-indigo-300">
            New Salary = Current Salary × (1 + Raise % ⁄ 100)
          </p>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📘 Example
          </h2>
          <p>
            If your current salary is <strong>$60 000</strong> and you get a 
            <strong>10 % raise</strong>, your new salary will be 
            <strong>$66 000</strong> — an increase of <strong>$6 000</strong>.
          </p>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            💡 Why Use a Pay Raise Calculator
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>See how much extra you’ll earn yearly and monthly.</li>
            <li>Compare different raise scenarios before negotiation.</li>
            <li>Plan budget and savings based on your new income.</li>
          </ul>

          {/* ===== FAQ Section ===== */}
          <section id="faq" className="space-y-6 mt-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>

            <div className="space-y-5 text-lg text-slate-100 leading-relaxed">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q1: How much is a good raise per year?
                </h3>
                <p>
                  On average, a 3 – 5 % raise is standard. Anything above 10 %
                  usually reflects promotion or outstanding performance.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q2: Is a 10 % raise good in 2025?
                </h3>
                <p>
                  Yes — especially if inflation is low and your company average is below that. 
                  A 10 % raise can meaningfully boost purchasing power.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q3: How do I calculate a raise from hourly pay?
                </h3>
                <p>
                  Multiply your hourly rate by the same raise percentage. For example, $25/hr with a 10 % raise becomes $27.50/hr.
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
              alt="CalculatorHub Team"
              className="w-12 h-12 rounded-full border border-gray-600"
              loading="lazy"
            />
            <div>
              <p className="font-semibold text-white">
                Written by the CalculatorHub Finance Team
              </p>
              <p className="text-sm text-slate-400">
                Verified for accuracy and clarity. Last updated: 
                <time dateTime="2025-10-20">October 20, 2025</time>.
              </p>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              🚀 Explore more salary & finance tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <a
                href="/inflation-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-400 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all"
              >
                📉 Inflation Calculator
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
          currentPath="/pay-raise-calculator"
          category="finance-salary"
        />
      </div>
    </>
  );
};

export default PayRaiseCalculator;

