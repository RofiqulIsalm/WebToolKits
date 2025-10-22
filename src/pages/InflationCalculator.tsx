// ================= InflationCalculator.tsx (Part 1/2) =================
import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
  BarChart2,
  RotateCcw,
  Copy,
  Share2,
  Info,
  ChevronDown,
  ChevronUp,
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
const LS_KEY = "inflation_calculator_v1";

const currencyOptions = [
  { code: "USD", symbol: "$", locale: "en-US", label: "US Dollar ($)" },
  { code: "EUR", symbol: "€", locale: "de-DE", label: "Euro (€)" },
  { code: "INR", symbol: "₹", locale: "en-IN", label: "Indian Rupee (₹)" },
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
   💸 COMPONENT: InflationCalculator
   ============================================================ */
const InflationCalculator: React.FC = () => {
  // Inputs
  const [amount, setAmount] = useState<number>(0);
  const [inflationRate, setInflationRate] = useState<number>(0);
  const [years, setYears] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("USD");

  // Outputs
  const [futureValue, setFutureValue] = useState<number>(0);
  const [valueLost, setValueLost] = useState<number>(0);

  // UI states
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [showInfoRate, setShowInfoRate] = useState(false);
  const [showInfoYears, setShowInfoYears] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const currentLocale = findLocale(currency);
  const isDefault = !amount && !inflationRate && !years;

  /* ============================================================
     🔁 STATE PERSISTENCE
     ============================================================ */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setAmount(s.amount || 0);
        setInflationRate(s.inflationRate || 0);
        setYears(s.years || 0);
        setCurrency(s.currency || "USD");
      }
    } catch (err) {
      console.warn("⚠️ Inflation state load failed", err);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ amount, inflationRate, years, currency })
      );
    } catch (err) {
      console.warn("⚠️ Inflation state save failed", err);
    }
  }, [hydrated, amount, inflationRate, years, currency]);

  /* ============================================================
     📈 CALCULATIONS
     ============================================================ */
  useEffect(() => {
    if (amount <= 0 || inflationRate < 0 || years < 0) {
      setFutureValue(0);
      setValueLost(0);
      return;
    }

    // Future Value considering inflation (real purchasing power)
    const future = amount / Math.pow(1 + inflationRate / 100, years);
    setFutureValue(future);
    setValueLost(amount - future);
  }, [amount, inflationRate, years]);

  const reset = () => {
    setAmount(0);
    setInflationRate(0);
    setYears(0);
    setCurrency("USD");
    localStorage.removeItem(LS_KEY);
  };

  /* ============================================================
     🔗 SHARE & COPY
     ============================================================ */
  const copyResults = async () => {
    const text = [
      `Inflation Calculator Results`,
      `Amount: ${formatCurrency(amount, currentLocale, currency)}`,
      `Rate: ${inflationRate}%`,
      `Years: ${years}`,
      `Future Value: ${formatCurrency(futureValue, currentLocale, currency)}`,
      `Value Lost: ${formatCurrency(valueLost, currentLocale, currency)}`,
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const state = { amount, inflationRate, years, currency };
    const encoded = btoa(JSON.stringify(state));
    const url = new URL(window.location.href);
    url.searchParams.set("ic", encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  /* ============================================================
     🎨 RENDER
     ============================================================ */
  return (
    <>
      <SEOHead
        title={seoData.inflationCalculator?.title || "Inflation Calculator | CalculatorHub"}
        description={
          seoData.inflationCalculator?.description ||
          "Estimate how inflation affects your money's purchasing power over time with CalculatorHub’s Inflation Calculator."
        }
        canonical="https://calculatorhub.site/inflation-calculator"
        schemaData={generateCalculatorSchema(
          "Inflation Calculator",
          "Estimate real value loss due to inflation and compare future purchasing power.",
          "/inflation-calculator",
          ["inflation", "future value", "money value", "real purchasing power"]
        )}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "Inflation Calculator", url: "/inflation-calculator" },
          ]}
        />

        {/* ===== Header ===== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            💸 Inflation Calculator
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            See how inflation affects your money’s value over time. Calculate
            the real worth of your savings, salary, or investments in future years.
          </p>
        </div>

        {/* ===== Input & Output Grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-emerald-400" /> Inflation Inputs
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

              {/* Amount */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Current Amount ({findSymbol(currency)})
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoRate(!showInfoRate)}
                  />
                </label>
                {showInfoRate && (
                  <p className="text-xs bg-[#0f172a] p-2 rounded-md border border-[#334155] mt-1">
                    The amount of money you currently have or want to adjust for inflation.
                  </p>
                )}
                <input
                  type="number"
                  value={amount || ""}
                  min={0}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter current amount"
                />
              </div>

              {/* Inflation Rate */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Annual Inflation Rate (%)
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoYears(!showInfoYears)}
                  />
                </label>
                {showInfoYears && (
                  <p className="text-xs bg-[#0f172a] p-2 rounded-md border border-[#334155] mt-1">
                    Average annual inflation percentage — typically around 3–6% for most economies.
                  </p>
                )}
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={inflationRate || ""}
                  onChange={(e) => setInflationRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter inflation rate"
                />
              </div>

              {/* Years */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">
                  Number of Years
                </label>
                <input
                  type="number"
                  min={0}
                  value={years || ""}
                  onChange={(e) => setYears(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter years"
                />
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">Inflation Summary</h2>

            <div className="space-y-6">
              <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(futureValue, currentLocale, currency)}
                </div>
                <div className="text-sm text-slate-400">
                  Real Value After Inflation ({years || 0} yrs)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(valueLost, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Value Lost</div>
                </div>
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(amount, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Today's Value</div>
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

        {/* ===== Chart + Insights ===== */}
        {amount > 0 && futureValue > 0 && (
          <div className="mt-6 bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              Inflation Impact Breakdown
            </h3>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Chart */}
              <div className="w-[90%] sm:w-[70%] md:w-[50%] max-w-[360px] h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Real Value", value: futureValue },
                        { name: "Value Lost", value: valueLost },
                      ]}
                      dataKey="value"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
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
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-emerald-500 transition">
                  <p className="text-sm text-slate-400">Future Real Value</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(futureValue, currentLocale, currency)}
                  </p>
                </div>
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-rose-500 transition">
                  <p className="text-sm text-slate-400">Value Lost</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(valueLost, currentLocale, currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Smart Tips ===== */}
        {amount > 0 && (
          <div className="mt-5 bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm">
            <p className="text-base font-medium leading-snug text-slate-300">
              💡 Tip: Even at{" "}
              <span className="text-indigo-400 font-semibold">
                {inflationRate || 0}% inflation
              </span>
              , your money loses value over time — invest or grow it to keep pace
              with inflation.
            </p>
          </div>
        )}

        {/* ===== SEO Content Section ===== */}
        {/* ===== SEO Content Section ===== */}
<section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
  <h1 className="text-3xl font-bold text-cyan-400 mb-6">
    Inflation Calculator 2025 – Understand the True Value of Money
  </h1>

  <p>
    The <strong>Inflation Calculator by CalculatorHub</strong> is a professional yet{" "}
    <strong>easy Inflation Calculator</strong> designed to help users understand how{" "}
    inflation reduces the purchasing power of money over time. Whether used by individuals,{" "}
    businesses, or analysts, this <strong>tool Inflation Calculator</strong> delivers{" "}
    accurate and instant results without requiring financial expertise.
  </p>

  <figure className="my-8">
    <img
      src="/images/inflation-calculator-hero.webp"
      alt="Inflation calculator dashboard showing value loss over years"
      title="Inflation Calculator 2025 | Real Value Estimator"
      className="rounded-lg shadow-md border border-slate-700 mx-auto"
      loading="lazy"
    />
    <figcaption className="text-center text-sm text-slate-400 mt-2">
      Visualization of the Inflation Calculator dark-finance UI.
    </figcaption>
  </figure>

  <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
    📘 What is an Inflation Calculator?
  </h2>
  <p>
    A <strong>simple Inflation Calculator</strong> estimates how much your current{" "}
    savings or income will be worth in the future after accounting for inflation.{" "}
    It’s an essential <strong>service Inflation Calculator</strong> that highlights{" "}
    the hidden loss of value in cash or uninvested funds over time. For users who{" "}
    prefer deeper analytics, the <strong>advanced Inflation Calculator</strong> offers{" "}
    customizable inflation assumptions and time horizons.
  </p>

  <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
    💡 How to Use Inflation Calculator
  </h2>
  <ol className="list-decimal list-inside space-y-2">
    <li>Enter the <strong>current amount</strong> you wish to evaluate.</li>
    <li>Add the <strong>annual inflation rate</strong> (e.g., 3%, 5%, etc.).</li>
    <li>Enter the <strong>number of years</strong> you want to project.</li>
    <li>Click "Calculate" to see your <strong>future value</strong> and{" "}
      <strong>value lost</strong>.</li>
    <li>Compare multiple scenarios to plan for inflation-adjusted goals.</li>
  </ol>
  <p>
    Even beginners find this interface friendly — it doubles as a{" "}
    <strong>professional Inflation Calculator</strong> and a{" "}
    <strong>free Inflation Calculator</strong> for quick real-world projections.
  </p>

  <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
    🧠 Inflation Calculator Tips
  </h2>
  <ul className="list-disc list-inside space-y-2">
    <li>Use realistic inflation rates (typically 2–6%).</li>
    <li>For long-term planning, test several inflation scenarios.</li>
    <li>Compare your investment returns against inflation to gauge real growth.</li>
    <li>Revisit calculations yearly as market conditions change.</li>
  </ul>

  <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
    ⚙️ Simple vs Advanced Inflation Calculator
  </h2>
  <p>
    The <strong>simple Inflation Calculator</strong> gives quick, no-frills projections.{" "}
    However, power users and enterprises may prefer the{" "}
    <strong>advanced Inflation Calculator</strong> or{" "}
    <strong>enterprise Inflation Calculator</strong>, which includes features like{" "}
    multi-currency inputs, graphical analysis, and exportable results. These advanced{" "}
    versions are designed for professionals and analysts who require precision and depth.
  </p>

  <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
    🌟 Inflation Calculator Review
  </h2>
  <p>
    Users consistently rate CalculatorHub’s tool as the{" "}
    <strong>best Inflation Calculator</strong> for its accuracy, visual design, and ease of use.{" "}
    Unlike many paid tools, this <strong>free Inflation Calculator</strong> delivers{" "}
    professional-grade insights at no cost. The interface is fast, responsive, and{" "}
    100% privacy-friendly — no data is stored or shared.
  </p>

  <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
    💼 Premium & Professional Options
  </h2>
  <p>
    For those needing advanced capabilities, CalculatorHub also offers a{" "}
    <strong>premium Inflation Calculator</strong> designed for small firms, analysts,{" "}
    and consultants. It provides exportable reports, data comparisons, and integration{" "}
    with other tools. Meanwhile, the <strong>affordable Inflation Calculator solution</strong>{" "}
    keeps professional insights accessible without enterprise-level pricing.
  </p>

  <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
    🌐 Inflation Calculator Online – Free and Accessible
  </h2>
  <p>
    The <strong>Inflation Calculator online</strong> runs directly in your browser —{" "}
    no downloads or sign-ups required. It’s completely free, making it ideal for{" "}
    individuals or small business owners who need quick, reliable inflation estimates.{" "}
    Unlike typical subscription-based apps, users don’t have to{" "}
    <strong>buy Inflation Calculator</strong> software; everything is web-based.
  </p>

  <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
    🚀 Inflation Calculator Benefits
  </h2>
  <ul className="list-disc list-inside space-y-2">
    <li>Instantly visualize the decline of money’s value due to inflation.</li>
    <li>Helps adjust long-term investment or retirement plans realistically.</li>
    <li>Improves business forecasting accuracy for pricing and budgets.</li>
    <li>Available as a <strong>solution Inflation Calculator</strong> across all devices.</li>
  </ul>

  <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
    🧩 Professional & Enterprise Use Cases
  </h2>
  <p>
    Many organizations adopt the <strong>enterprise Inflation Calculator</strong> for{" "}
    financial forecasting, global salary planning, and currency comparisons.{" "}
    The <strong>professional Inflation Calculator</strong> version integrates seamlessly{" "}
    with internal reporting dashboards to deliver actionable insights — a perfect{" "}
    <strong>solution Inflation Calculator</strong> for companies planning ahead.
  </p>

  {/* FAQ Section */}
  <section id="faq" className="space-y-6 mt-16">
    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
      ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
    </h2>

    <div className="space-y-5 text-lg text-slate-100 leading-relaxed">
      <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
        <h3 className="font-semibold text-xl mb-2 text-yellow-300">
          Q1: What is inflation and why does it matter?
        </h3>
        <p>
          Inflation represents the rate at which general prices increase, decreasing
          purchasing power over time. Understanding it helps you make smarter financial decisions.
        </p>
      </div>

      <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
        <h3 className="font-semibold text-xl mb-2 text-yellow-300">
          Q2: Is this Inflation Calculator accurate?
        </h3>
        <p>
          Yes. It uses the compound inflation formula and provides reliable results assuming
          a constant average rate. It’s accurate enough for both personal and professional analysis.
        </p>
      </div>

      <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
        <h3 className="font-semibold text-xl mb-2 text-yellow-300">
          Q3: Is the Inflation Calculator free to use?
        </h3>
        <p>
          Absolutely. It’s a <strong>free Inflation Calculator</strong> built for accessibility,
          allowing anyone to explore future value scenarios without cost or registration.
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
      alt="CalculatorHub Finance Tools Team"
      className="w-12 h-12 rounded-full border border-gray-600"
      loading="lazy"
    />
    <div>
      <p className="font-semibold text-white">
        Written by the CalculatorHub Finance Tools Team
      </p>
      <p className="text-sm text-slate-400">
        Financial insights and data-driven tools to help you plan smarter. Last updated:{" "}
        <time dateTime="2025-10-21">October 21, 2025</time>.
      </p>
    </div>
  </div>

  <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
    <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
      🚀 Explore more finance tools on CalculatorHub:
    </p>
    <div className="flex flex-wrap gap-3 text-sm">
      <a
        href="/loan-emi-calculator"
        className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all"
      >
        💰 Loan EMI Calculator
      </a>
      <a
        href="/mortgage-calculator"
        className="flex items-center gap-2 bg-[#0f172a] hover:bg-fuchsia-600/20 text-fuchsia-300 hover:text-fuchsia-400 px-3 py-2 rounded-md border border-slate-700 hover:border-fuchsia-500 transition-all"
      >
        🏠 Mortgage Calculator
      </a>
      <a
        href="/currency-converter"
        className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all"
      >
        💱 Currency Converter
      </a>
    </div>
  </div> 
</section>


        <AdBanner type="bottom" />
        <RelatedCalculators
          currentPath="/inflation-calculator"
          category="currency-finance"
        />
      </div>
    </>
  );
};

export default InflationCalculator;
