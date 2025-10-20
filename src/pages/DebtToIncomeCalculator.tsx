
import React, { useState, useEffect } from "react";
import {
  CreditCard,
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
const LS_KEY = "debt_to_income_calc_v1";

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
   💳 COMPONENT
   ============================================================ */
const DebtToIncomeCalculator: React.FC = () => {
  // Inputs
  const [income, setIncome] = useState<number>(0);
  const [debts, setDebts] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("USD");

  // Outputs
  const [dti, setDti] = useState<number>(0);
  const [status, setStatus] = useState<string>("");

  // UI
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [hydrated, setHydrated] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const currentLocale = findLocale(currency);
  const isDefault = !income && !debts;

  /* ============================================================
     🔁 PERSISTENCE
     ============================================================ */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setIncome(s.income || 0);
        setDebts(s.debts || 0);
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
      localStorage.setItem(LS_KEY, JSON.stringify({ income, debts, currency }));
    } catch {
      console.warn("⚠️ Could not save state");
    }
  }, [hydrated, income, debts, currency]);

  /* ============================================================
     🧮 CALCULATION
     ============================================================ */
  useEffect(() => {
    if (income <= 0 || debts <= 0) {
      setDti(0);
      setStatus("");
      return;
    }

    const ratio = (debts / income) * 100;
    setDti(ratio);

    if (ratio < 20) setStatus("Excellent");
    else if (ratio < 36) setStatus("Good");
    else if (ratio < 43) setStatus("Fair");
    else if (ratio < 50) setStatus("High Risk");
    else setStatus("Critical");
  }, [income, debts]);

  /* ============================================================
     🔗 COPY / SHARE / RESET
     ============================================================ */
  const reset = () => {
    setIncome(0);
    setDebts(0);
    setCurrency("USD");
    localStorage.removeItem(LS_KEY);
  };

  const copyResults = async () => {
    const text = [
      "Debt-to-Income Ratio Summary",
      `Monthly Income: ${formatCurrency(income, currentLocale, currency)}`,
      `Monthly Debt Payments: ${formatCurrency(debts, currentLocale, currency)}`,
      `Debt-to-Income Ratio: ${dti.toFixed(2)}%`,
      `Status: ${status}`,
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const encoded = btoa(JSON.stringify({ income, debts, currency }));
    const url = new URL(window.location.href);
    url.searchParams.set("dti", encoded);
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
        title="Debt-to-Income Ratio Calculator | CalculatorHub"
        description="Calculate your debt-to-income (DTI) ratio instantly and find out if your financial health qualifies for a loan."
        canonical="https://calculatorhub.site/debt-to-income-ratio-calculator"
        schemaData={generateCalculatorSchema(
          "Debt-to-Income Ratio Calculator",
          "Find your DTI ratio and check your financial health easily with CalculatorHub’s free online calculator.",
          "/debt-to-income-ratio-calculator",
          ["debt-to-income ratio", "DTI calculator", "loan eligibility", "finance"]
        )}
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "Debt-to-Income Ratio Calculator", url: "/debt-to-income-ratio-calculator" },
          ]}
        />

        {/* ===== Header ===== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            💳 Debt-to-Income Ratio Calculator
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Calculate your debt-to-income (DTI) ratio and understand your financial health 
            before applying for a mortgage, loan, or credit card.
          </p>
        </div>

        {/* ===== Input + Output Grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-sky-400" /> Monthly Details
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

              {/* Income */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">
                  Gross Monthly Income ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={income || ""}
                  onChange={(e) => setIncome(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 5000"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Debt Payments */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Total Monthly Debt Payments ({findSymbol(currency)})
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfo(!showInfo)}
                  />
                </label>
                {showInfo && (
                  <p className="text-xs bg-[#0f172a] border border-[#334155] rounded-md p-2 mt-1">
                    Include all monthly payments such as mortgage, car loan, 
                    student loan, and credit card minimums.
                  </p>
                )}
                <input
                  type="number"
                  min={0}
                  value={debts || ""}
                  onChange={(e) => setDebts(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 1500"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">
              DTI Summary
            </h2>

            <div className="space-y-6">
              <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                <div className="text-3xl font-bold text-white">
                  {dti.toFixed(2)}%
                </div>
                <div className="text-sm text-slate-400">Debt-to-Income Ratio</div>
              </div>

              {status && (
                <div className="text-center p-3 rounded-lg border border-[#334155] bg-[#0f172a]">
                  <p className="text-lg font-semibold text-white">Status: {status}</p>
                </div>
              )}

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
        {income > 0 && debts > 0 && (
          <div className="mt-6 bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              Debt vs Income Breakdown
            </h3>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Pie Chart */}
              <div className="w-[90%] sm:w-[70%] md:w-[50%] max-w-[360px] h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Debt Payments", value: debts },
                        { name: "Remaining Income", value: income - debts },
                      ]}
                      dataKey="value"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      <Cell fill="#ef4444" />
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
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-rose-500 transition">
                  <p className="text-sm text-slate-400">Total Debts</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(debts, currentLocale, currency)}
                  </p>
                </div>
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-emerald-500 transition">
                  <p className="text-sm text-slate-400">Remaining Income</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(income - debts, currentLocale, currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Smart Financial Tip ===== */}
        {dti > 0 && (
          <div className="mt-5 bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm">
            {dti < 36 ? (
              <p className="text-base text-emerald-400 font-medium leading-snug">
                ✅ Your DTI ratio looks healthy! You’re in a great position for most loans.
              </p>
            ) : dti < 43 ? (
              <p className="text-base text-yellow-400 font-medium leading-snug">
                ⚠️ Your DTI is moderate. Consider lowering existing debts to improve eligibility.
              </p>
            ) : (
              <p className="text-base text-rose-400 font-medium leading-snug">
                🚫 Your DTI is high. Try paying off existing loans or increasing income before applying.
              </p>
            )}
          </div>
        )}

        {/* ===== SEO / Informational Section ===== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          <h1 className="text-3xl font-bold text-cyan-400 mb-6">
            Debt-to-Income Ratio Calculator 2025 – Check Your Financial Health
          </h1>

          <p>
            The <strong>Debt-to-Income Ratio (DTI) Calculator by CalculatorHub</strong> helps you determine 
            how much of your income goes toward paying debts. Lenders use this ratio to assess your loan eligibility.
          </p>

          <figure className="my-8">
            <img
              src="/images/debt-to-income-calculator-hero.webp"
              alt="Debt-to-Income Ratio Calculator dashboard"
              title="Debt-to-Income Ratio Calculator 2025 | Finance Planner"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Modern DTI calculator with visualization for debt and income distribution.
            </figcaption>
          </figure>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧮 How the DTI Ratio Is Calculated
          </h2>
          <p className="font-mono text-center text-indigo-300">
            DTI (%) = (Total Monthly Debt Payments ÷ Gross Monthly Income) × 100
          </p>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📘 Example Calculation
          </h2>
          <p>
            Suppose your monthly income is <strong>$5,000</strong> and total debts are <strong>$1,500</strong>.  
            Your DTI ratio will be <strong>30%</strong>, which is considered <strong>Good</strong> by most lenders.
          </p>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            💡 Tips to Improve Your DTI
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Pay off high-interest debts first to reduce your total monthly payments.</li>
            <li>Avoid taking new loans before applying for a mortgage.</li>
            <li>Increase income through side jobs or salary negotiations.</li>
          </ul>

          {/* ===== FAQ Section ===== */}
          <section id="faq" className="space-y-6 mt-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>

            <div className="space-y-5 text-lg text-slate-100 leading-relaxed">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q1: What DTI ratio do lenders prefer?
                </h3>
                <p>
                  Most lenders prefer a DTI below <strong>36%</strong>. Anything below <strong>30%</strong> 
                  indicates strong financial health.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q2: Does rent count as debt?
                </h3>
                <p>
                  Rent is not included unless you are applying for another mortgage. 
                  Otherwise, only debts like credit cards or loans are counted.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q3: Is a high DTI ratio bad?
                </h3>
                <p>
                  Yes — a high DTI ratio indicates you are over-leveraged, 
                  which may reduce your loan eligibility or lead to rejection.
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
              🚀 Explore more finance tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <a
                href="/loan-affordability-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all"
              >
                🏠 Loan Affordability Calculator
              </a>
              <a
                href="/roi-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-400 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all"
              >
                📈 ROI Calculator
              </a>
              <a
                href="/savings-goal-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all"
              >
                💰 Savings Goal Calculator
              </a>
            </div>
          </div>
        </section>

        <AdBanner type="bottom" />
        <RelatedCalculators
          currentPath="/debt-to-income-ratio-calculator"
          category="currency-finance"
        />
      </div>
    </>
  );
};

export default DebtToIncomeCalculator;
