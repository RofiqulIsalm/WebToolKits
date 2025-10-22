// ================= CreditCardPayoffCalculator.tsx (Part 1/2) =================
import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
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
const LS_KEY = "credit_card_payoff_v1";

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
   💳 COMPONENT: CreditCardPayoffCalculator
   ============================================================ */
const CreditCardPayoffCalculator: React.FC = () => {
  // Inputs
  const [balance, setBalance] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(0);
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("USD");

  // Outputs
  const [monthsToPayoff, setMonthsToPayoff] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [totalPaid, setTotalPaid] = useState<number>(0);

  // UI states
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [hydrated, setHydrated] = useState(false);
  const [showInfoRate, setShowInfoRate] = useState(false);
  const [showInfoPayment, setShowInfoPayment] = useState(false);

  const currentLocale = findLocale(currency);
  const isDefault = !balance && !interestRate && !monthlyPayment;

  /* ============================================================
     🔁 STATE PERSISTENCE
     ============================================================ */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setBalance(s.balance || 0);
        setInterestRate(s.interestRate || 0);
        setMonthlyPayment(s.monthlyPayment || 0);
        setCurrency(s.currency || "USD");
      }
    } catch (err) {
      console.warn("⚠️ CC payoff load failed", err);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ balance, interestRate, monthlyPayment, currency })
      );
    } catch (err) {
      console.warn("⚠️ CC payoff save failed", err);
    }
  }, [hydrated, balance, interestRate, monthlyPayment, currency]);

  /* ============================================================
     📈 CALCULATIONS
     ============================================================ */
  useEffect(() => {
    if (balance <= 0 || interestRate < 0 || monthlyPayment <= 0) {
      setMonthsToPayoff(0);
      setTotalInterest(0);
      setTotalPaid(0);
      return;
    }

    let months = 0;
    let totalInterestAccrued = 0;
    let remaining = balance;
    const monthlyRate = interestRate / 12 / 100;

    // prevent infinite loop
    if (monthlyPayment <= remaining * monthlyRate) {
      setMonthsToPayoff(-1); // indicates impossible
      return;
    }

    while (remaining > 0 && months < 1000) {
      const interest = remaining * monthlyRate;
      const principal = monthlyPayment - interest;
      remaining = remaining - principal;
      totalInterestAccrued += interest;
      months++;
      if (remaining < 0) remaining = 0;
    }

    setMonthsToPayoff(months);
    setTotalInterest(totalInterestAccrued);
    setTotalPaid(balance + totalInterestAccrued);
  }, [balance, interestRate, monthlyPayment]);

  /* ============================================================
     🔗 SHARE / COPY / RESET
     ============================================================ */
  const reset = () => {
    setBalance(0);
    setInterestRate(0);
    setMonthlyPayment(0);
    setCurrency("USD");
    localStorage.removeItem(LS_KEY);
  };

  const copyResults = async () => {
    const text = [
      `Credit Card Payoff Summary`,
      `Balance: ${formatCurrency(balance, currentLocale, currency)}`,
      `Interest Rate: ${interestRate}%`,
      `Monthly Payment: ${formatCurrency(monthlyPayment, currentLocale, currency)}`,
      `Months to Payoff: ${monthsToPayoff > 0 ? monthsToPayoff : "N/A"}`,
      `Total Interest: ${formatCurrency(totalInterest, currentLocale, currency)}`,
      `Total Paid: ${formatCurrency(totalPaid, currentLocale, currency)}`,
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const state = { balance, interestRate, monthlyPayment, currency };
    const encoded = btoa(JSON.stringify(state));
    const url = new URL(window.location.href);
    url.searchParams.set("ccp", encoded);
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
        title={seoData.creditCardCalculator?.title || "Credit Card Payoff Calculator | CalculatorHub"}
        description={
          seoData.creditCardCalculator?.description ||
          "Estimate how long it will take to pay off your credit card balance and how much interest you'll pay overall."
        }
        canonical="https://calculatorhub.site/credit-card-payoff-calculator"
        schemaData={generateCalculatorSchema(
          "Credit Card Payoff Calculator",
          "Plan your debt-free journey by estimating time and interest to pay off your credit card.",
          "/credit-card-payoff-calculator",
          ["credit card", "debt payoff", "finance calculator"]
        )}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "Credit Card Payoff Calculator", url: "/credit-card-payoff-calculator" },
          ]}
        />

        {/* ===== Header ===== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            💳 Credit Card Payoff Calculator
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Calculate how long it will take to pay off your credit card debt based on balance,
            interest rate, and monthly payments. See total interest paid and payoff timeline.
          </p>
        </div>

        {/* ===== Input + Output Grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-pink-400" /> Card Details
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

              {/* Balance */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">
                  Current Balance ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={balance || ""}
                  onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter current balance"
                />
              </div>

              {/* Interest Rate */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Annual Interest Rate (%)
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoRate(!showInfoRate)}
                  />
                </label>
                {showInfoRate && (
                  <p className="text-xs bg-[#0f172a] p-2 rounded-md border border-[#334155] mt-1">
                    Typical credit card APR ranges from 15% to 30%. Enter your card's rate here.
                  </p>
                )}
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={interestRate || ""}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter annual interest rate"
                />
              </div>

              {/* Monthly Payment */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Monthly Payment ({findSymbol(currency)})
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoPayment(!showInfoPayment)}
                  />
                </label>
                {showInfoPayment && (
                  <p className="text-xs bg-[#0f172a] p-2 rounded-md border border-[#334155] mt-1">
                    The amount you pay monthly toward your credit card debt.
                  </p>
                )}
                <input
                  type="number"
                  min={0}
                  value={monthlyPayment || ""}
                  onChange={(e) => setMonthlyPayment(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter monthly payment"
                />
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">Payoff Summary</h2>

            <div className="space-y-6">
              {monthsToPayoff === -1 ? (
                <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155] text-rose-400 font-semibold">
                  Monthly payment is too low to cover interest — increase it to pay off the debt.
                </div>
              ) : (
                <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                  <div className="text-3xl font-bold text-white">
                    {monthsToPayoff > 0 ? `${monthsToPayoff} months` : "--"}
                  </div>
                  <div className="text-sm text-slate-400">
                    Estimated Time to Pay Off
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(totalInterest, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Total Interest</div>
                </div>
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(totalPaid, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Total Paid</div>
                </div>
              </div>

              {/* Buttons */}
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
        {balance > 0 && monthsToPayoff > 0 && (
          <div className="mt-6 bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              Credit Card Payoff Breakdown
            </h3>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Pie Chart */}
              <div className="w-[90%] sm:w-[70%] md:w-[50%] max-w-[360px] h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Principal", value: balance },
                        { name: "Interest", value: totalInterest },
                      ]}
                      dataKey="value"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      <Cell fill="#6366f1" />
                      <Cell fill="#f43f5e" />
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

              {/* Summary Right */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-indigo-500 transition">
                  <p className="text-sm text-slate-400">Principal Balance</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(balance, currentLocale, currency)}
                  </p>
                </div>
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-rose-500 transition">
                  <p className="text-sm text-slate-400">Total Interest</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(totalInterest, currentLocale, currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Smart Tip Box ===== */}
        {balance > 0 && (
          <div className="mt-5 bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm">
            <p className="text-base font-medium leading-snug text-slate-300">
              💡 Tip: Paying just{" "}
              <span className="text-emerald-400 font-semibold">a bit extra</span>{" "}
              each month can dramatically reduce your interest and shorten your payoff
              time by years!
            </p>
          </div>
        )}

        {/* ===== SEO Content Section ===== */}
       <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          <h1 className="text-3xl font-bold text-cyan-400 mb-6">
            Credit Card Payoff Calculator 2025 – Debt-Free Planning Tool
          </h1>
        
          <p>
            Use the <strong>Credit Card Payoff Calculator by CalculatorHub</strong> to
            estimate how many months it will take to pay off your card and how much
            interest you'll pay along the way. Perfect for budgeting and
            debt-free planning.
          </p>
        
          <figure className="my-8">
            <img
              src="/images/credit-card-payoff-hero.webp"
              alt="Credit Card Payoff Calculator UI showing payoff chart"
              title="Credit Card Payoff Calculator 2025 | Debt-Free Estimator"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Visualization of the Credit Card Payoff Calculator dark-finance UI.
            </figcaption>
          </figure>
        
          {/* ========== What & Why ========== */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🔎 What is a Credit Card Payoff Calculator?
          </h2>
          <p>
            A <strong>Credit Card Payoff Calculator</strong> is a <strong>simple</strong> tool that shows how long
            it takes to clear a balance based on your <em>APR</em> and <em>monthly payment</em>. The result includes
            the <strong>payoff timeline</strong>, <strong>total interest</strong>, and the <strong>total amount paid</strong>.
            It’s built to be an <strong>easy Credit Card Payoff Calculator</strong> for beginners and a
            <strong> professional Credit Card Payoff Calculator</strong> for users who want precise, visual insights.
          </p>
        
          {/* ========== How to Use ========== */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ⚙️ How to Use Credit Card Payoff Calculator (Step-by-Step)
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter your <strong>current balance</strong> (what you owe right now).</li>
            <li>Add the card’s <strong>annual interest rate (APR)</strong>.</li>
            <li>Type your <strong>monthly payment</strong> (minimum or custom).</li>
            <li>Review the <strong>months to payoff</strong>, <strong>total interest</strong>, and <strong>total paid</strong>.</li>
            <li>Adjust payments to compare plans — a built-in <strong>Credit Card Payoff Calculator comparison</strong> workflow.</li>
          </ol>
          <p>
            This workflow keeps things friendly for first-timers while still feeling like an
            <strong> advanced Credit Card Payoff Calculator</strong> when deeper exploration is needed.
          </p>
        
          {/* ========== Example ========== */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📘 Example Calculation
          </h2>
          <p>
            Suppose you owe <strong>$5,000</strong> on a credit card with an APR of
            <strong> 18%</strong>, and you pay <strong>$200 per month</strong>.
            It will take around <strong>32 months</strong> to pay off, and you’ll pay
            roughly <strong>$1,300 in interest</strong>.
          </p>
        
          {/* ========== How It Works (Explained) ========== */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            💡 Credit Card Payoff Calculator Explained
          </h2>
          <p>
            The calculator simulates each month: it adds interest to the remaining balance,
            subtracts your payment, and repeats until the balance reaches zero. If a payment is too
            low to even cover the monthly interest, the tool flags it so users can increase the amount.
          </p>
          <p className="font-mono text-center text-indigo-300">
            New Balance = Previous Balance + (APR ÷ 12 × Previous Balance) − Monthly Payment
          </p>
        
          {/* ========== Tips ========== */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧮 Tips for Faster Payoff
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Increase your monthly payment amount (even a small bump helps).</li>
            <li>Transfer balances to a lower APR card to reduce interest.</li>
            <li>Pause new spending on the card while repaying.</li>
            <li>Try bi-weekly payments to slightly reduce total interest.</li>
          </ul>
        
          {/* ========== Pros & Cons ========== */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ⚖️ Credit Card Payoff Calculator — Pros & Cons
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0b1220] border border-slate-700 rounded-md p-4">
              <h3 className="text-emerald-300 font-semibold mb-2">Pros</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Clear payoff time with total interest and total paid.</li>
                <li>No sign-up — a <strong>free Credit Card Payoff Calculator</strong>.</li>
                <li>Simple for beginners; robust enough for pros.</li>
                <li>Privacy-friendly (<em>no server storage</em>).</li>
              </ul>
            </div>
            <div className="bg-[#120b16] border border-slate-700 rounded-md p-4">
              <h3 className="text-rose-300 font-semibold mb-2">Cons</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Assumes no new charges during repayment.</li>
                <li>Does not model variable APR or changing minimums.</li>
              </ul>
            </div>
          </div>
        
          {/* ========== Comparison ========== */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📊 Credit Card Payoff Calculator Comparison
          </h2>
          <p>
            Compared with spreadsheets and generic apps, CalculatorHub’s <strong>Credit Card Payoff Calculator online</strong>
            balances ease, accuracy, and privacy:
          </p>
          <div className="overflow-x-auto rounded-lg border border-[#334155]">
            <table className="min-w-[560px] text-sm">
              <thead className="bg-[#0f172a]">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-indigo-300">Feature</th>
                  <th className="text-left px-4 py-3 font-semibold text-indigo-300">CalculatorHub</th>
                  <th className="text-left px-4 py-3 font-semibold text-indigo-300">Spreadsheet</th>
                  <th className="text-left px-4 py-3 font-semibold text-indigo-300">Generic App</th>
                </tr>
              </thead>
              <tbody>
                <tr className="odd:bg-[#0b1220] even:bg-[#111827]">
                  <td className="px-4 py-2">Ease of Use</td>
                  <td className="px-4 py-2">⭐⭐⭐⭐⭐</td>
                  <td className="px-4 py-2">⭐⭐</td>
                  <td className="px-4 py-2">⭐⭐⭐</td>
                </tr>
                <tr className="odd:bg-[#0b1220] even:bg-[#111827]">
                  <td className="px-4 py-2">Visual Charts</td>
                  <td className="px-4 py-2">✅</td>
                  <td className="px-4 py-2">❌</td>
                  <td className="px-4 py-2">✅</td>
                </tr>
                <tr className="odd:bg-[#0b1220] even:bg-[#111827]">
                  <td className="px-4 py-2">Privacy</td>
                  <td className="px-4 py-2">✅ (local only)</td>
                  <td className="px-4 py-2">✅</td>
                  <td className="px-4 py-2">❌</td>
                </tr>
                <tr className="odd:bg-[#0b1220] even:bg-[#111827]">
                  <td className="px-4 py-2">Free Access</td>
                  <td className="px-4 py-2">✅</td>
                  <td className="px-4 py-2">✅</td>
                  <td className="px-4 py-2">❌</td>
                </tr>
              </tbody>
            </table>
          </div>

            {/* ========== For Beginners & Small Business ========== */}
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              🌟 Credit Card Payoff Calculator for Beginners
            </h2>
            <p>
              New to debt planning? This <strong>easy Credit Card Payoff Calculator</strong> keeps jargon out,
              focuses on clarity, and guides users toward realistic repayment timelines.
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              💼 Small Business Credit Card Payoff Calculator
            </h2>
            <p>
              For entrepreneurs, a <strong>small business Credit Card Payoff Calculator</strong> helps prioritize which
              balances to attack first, forecast cash flow, and decide when a balance transfer makes sense.
            </p>
          
            {/* ========== Free/Online/Professional/Premium ========== */}
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              🌐 Free, Online, and Professional Options
            </h2>
            <p>
              CalculatorHub delivers a <strong>free Credit Card Payoff Calculator</strong> that runs entirely in the browser —
              no sign-ups. Power users can explore <strong>professional Credit Card Payoff Calculator</strong> features like detailed schedules,
              while a <strong>premium Credit Card Payoff Calculator</strong> tier can include exports and integrations for teams.
            </p>

            {/* ===== FAQ Section ===== */}
            <section id="faq" className="space-y-6 mt-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
                ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
              </h2>
          
              <div className="space-y-5 text-lg text-slate-100 leading-relaxed">
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                    Q1: What if my payment is too low to cover interest?
                  </h3>
                  <p>
                    The calculator will warn you that the debt can’t be paid off — increase the monthly
                    payment so it exceeds the monthly interest charge.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                    Q2: Does this include minimum payments?
                  </h3>
                  <p>
                    Yes. Enter your current minimum or a custom payment to see the timeline at that level.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                    Q3: Does it account for new spending?
                  </h3>
                  <p>
                    No — it assumes no new charges during repayment so you get a clean, realistic payoff plan.
                  </p>
                </div>
              </div>
            </section>
          </section>

          <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
            <div className="flex items-center gap-3">
              <img src="/images/calculatorhub-author.webp" alt="CalculatorHub Finance Tools Team" className="w-12 h-12 rounded-full border border-gray-600" loading="lazy" />
              <div>
                <p className="font-semibold text-white">Written by the CalculatorHub Finance Tools Team</p>
                <p className="text-sm text-slate-400">Experts in mortgages and online financial tools. Last updated: <time dateTime="2025-10-17">October 17, 2025</time>.</p>
              </div>
            </div>
          
            <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
              <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">🚀 Explore more finance tools on CalculatorHub:</p>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link to="/personal-loan-calculator" className="flex items-center gap-2 bg-[#0f172a] hover:bg-rose-600/20 text-rose-300 hover:text-rose-400 px-3 py-2 rounded-md border border-slate-700 hover:border-rose-500 transition-all duration-200">
                  <span className="text-rose-400">🧾</span> Personal Loan Calculator
                </Link>
                <Link to="/debt-to-income-ratio-calculator" className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-400 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200">
                  <span className="text-sky-400">📉</span> Debt-to-Income Ratio Calculator
                </Link>
                <Link to="/loan-emi-calculator" className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200">
                  <span className="text-indigo-400">💳</span> Loan EMI Calculator
                </Link>
              </div>
            </div>
          </section>



        <AdBanner type="bottom" />
        <RelatedCalculators
          currentPath="/credit-card-payoff-calculator"
          category="currency-finance"
        />
      </div>
    </>
  );
};

export default CreditCardPayoffCalculator;
