// ================= SavingsGoalCalculator.tsx (Part 1/2) =================
import React, { useState, useEffect } from "react";
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
const LS_KEY = "savings_goal_calculator_v1";

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
   💰 COMPONENT: SavingsGoalCalculator
   ============================================================ */
const SavingsGoalCalculator: React.FC = () => {
  // Inputs
  const [goalAmount, setGoalAmount] = useState<number>(0);
  const [currentSavings, setCurrentSavings] = useState<number>(0);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(0);
  const [annualRate, setAnnualRate] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("USD");

  // Outputs
  const [monthsToGoal, setMonthsToGoal] = useState<number>(0);
  const [totalContributed, setTotalContributed] = useState<number>(0);
  const [totalGrowth, setTotalGrowth] = useState<number>(0);
  const [totalValue, setTotalValue] = useState<number>(0);

  // UI state
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [hydrated, setHydrated] = useState(false);
  const [showInfoRate, setShowInfoRate] = useState(false);
  const [showInfoContribution, setShowInfoContribution] = useState(false);

  const currentLocale = findLocale(currency);
  const isDefault =
    !goalAmount && !currentSavings && !monthlyContribution && !annualRate;

  /* ============================================================
     🔁 STATE PERSISTENCE
     ============================================================ */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setGoalAmount(s.goalAmount || 0);
        setCurrentSavings(s.currentSavings || 0);
        setMonthlyContribution(s.monthlyContribution || 0);
        setAnnualRate(s.annualRate || 0);
        setCurrency(s.currency || "USD");
      }
    } catch (err) {
      console.warn("⚠️ Failed to load savings goal state", err);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          goalAmount,
          currentSavings,
          monthlyContribution,
          annualRate,
          currency,
        })
      );
    } catch (err) {
      console.warn("⚠️ Failed to save savings goal state", err);
    }
  }, [hydrated, goalAmount, currentSavings, monthlyContribution, annualRate, currency]);

  /* ============================================================
     📈 CALCULATIONS
     ============================================================ */
  useEffect(() => {
    if (
      goalAmount <= 0 ||
      monthlyContribution <= 0 ||
      annualRate < 0 ||
      currentSavings < 0
    ) {
      setMonthsToGoal(0);
      setTotalContributed(0);
      setTotalGrowth(0);
      setTotalValue(0);
      return;
    }

    let months = 0;
    let balance = currentSavings;
    const monthlyRate = annualRate / 12 / 100;

    // simulate monthly compounding
    while (balance < goalAmount && months < 1000 * 12) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
      months++;
    }

    const contributed = currentSavings + monthlyContribution * months;
    const growth = balance - contributed;

    setMonthsToGoal(months);
    setTotalContributed(contributed);
    setTotalGrowth(growth);
    setTotalValue(balance);
  }, [goalAmount, currentSavings, monthlyContribution, annualRate]);

  /* ============================================================
     🔗 SHARE / COPY / RESET
     ============================================================ */
  const reset = () => {
    setGoalAmount(0);
    setCurrentSavings(0);
    setMonthlyContribution(0);
    setAnnualRate(0);
    setCurrency("USD");
    localStorage.removeItem(LS_KEY);
  };

  const copyResults = async () => {
    const text = [
      "Savings Goal Summary",
      `Goal Amount: ${formatCurrency(goalAmount, currentLocale, currency)}`,
      `Current Savings: ${formatCurrency(currentSavings, currentLocale, currency)}`,
      `Monthly Contribution: ${formatCurrency(monthlyContribution, currentLocale, currency)}`,
      `Annual Growth Rate: ${annualRate}%`,
      `Time to Goal: ${
        monthsToGoal > 0 ? (monthsToGoal / 12).toFixed(1) + " years" : "N/A"
      }`,
      `Total Value: ${formatCurrency(totalValue, currentLocale, currency)}`,
      `Growth Earned: ${formatCurrency(totalGrowth, currentLocale, currency)}`,
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const state = {
      goalAmount,
      currentSavings,
      monthlyContribution,
      annualRate,
      currency,
    };
    const encoded = btoa(JSON.stringify(state));
    const url = new URL(window.location.href);
    url.searchParams.set("sg", encoded);
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
        title={seoData.savingsGoalCalculator?.title || "Savings Goal Calculator | CalculatorHub"}
        description={
          seoData.savingsGoalCalculator?.description ||
          "Estimate how long it will take to reach your savings goal, or how much you'll accumulate over time with interest."
        }
        canonical="https://calculatorhub.site/savings-goal-calculator"
        schemaData={generateCalculatorSchema(
          "Savings Goal Calculator",
          "Plan your financial goals by estimating growth with monthly contributions and interest.",
          "/savings-goal-calculator",
          ["savings goal", "compound interest", "future value", "finance calculator"]
        )}
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "Savings Goal Calculator", url: "/savings-goal-calculator" },
          ]}
        />

        {/* ===== Header ===== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            💰 Savings Goal Calculator
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Plan your savings journey. Calculate how long it takes to reach your goal based
            on contributions, current balance, and annual growth rate.
          </p>
        </div>

        {/* ===== Input + Output Grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-emerald-400" /> Savings Inputs
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

              {/* Goal Amount */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">
                  Target Goal Amount ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={goalAmount || ""}
                  onChange={(e) => setGoalAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your target amount"
                />
              </div>

              {/* Current Savings */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">
                  Current Savings ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={currentSavings || ""}
                  onChange={(e) =>
                    setCurrentSavings(parseFloat(e.target.value) || 0)
                  }
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter current savings"
                />
              </div>

              {/* Monthly Contribution */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Monthly Contribution ({findSymbol(currency)})
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoContribution(!showInfoContribution)}
                  />
                </label>
                {showInfoContribution && (
                  <p className="text-xs bg-[#0f172a] p-2 rounded-md border border-[#334155] mt-1">
                    The amount you plan to add to your savings each month.
                  </p>
                )}
                <input
                  type="number"
                  min={0}
                  value={monthlyContribution || ""}
                  onChange={(e) =>
                    setMonthlyContribution(parseFloat(e.target.value) || 0)
                  }
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter monthly contribution"
                />
              </div>

              {/* Annual Growth Rate */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Annual Growth Rate (%)
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoRate(!showInfoRate)}
                  />
                </label>
                {showInfoRate && (
                  <p className="text-xs bg-[#0f172a] p-2 rounded-md border border-[#334155] mt-1">
                    The expected annual return or interest rate on your savings or investment.
                  </p>
                )}
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={annualRate || ""}
                  onChange={(e) => setAnnualRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter annual interest rate"
                />
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">Savings Summary</h2>

            <div className="space-y-6">
              {monthsToGoal > 0 ? (
                <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                  <div className="text-3xl font-bold text-white">
                    {(monthsToGoal / 12).toFixed(1)} years
                  </div>
                  <div className="text-sm text-slate-400">
                    Time to Reach Your Goal
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155] text-rose-400 font-semibold">
                  Please enter valid savings and goal details.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(totalGrowth, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Total Growth</div>
                </div>
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(totalValue, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Final Value</div>
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
        {goalAmount > 0 && monthsToGoal > 0 && (
          <div className="mt-6 bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              Savings Goal Breakdown
            </h3>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Pie Chart */}
              <div className="w-[90%] sm:w-[70%] md:w-[50%] max-w-[360px] h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Your Contributions", value: totalContributed },
                        { name: "Growth / Interest", value: totalGrowth },
                      ]}
                      dataKey="value"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#8b5cf6" />
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
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-emerald-500 transition">
                  <p className="text-sm text-slate-400">Total Contributions</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(totalContributed, currentLocale, currency)}
                  </p>
                </div>
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-fuchsia-500 transition">
                  <p className="text-sm text-slate-400">Total Growth</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(totalGrowth, currentLocale, currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Smart Tip Box ===== */}
        {(goalAmount > 0 && monthsToGoal > 0) && (
          <div className="mt-5 bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm">
            <p className="text-base font-medium leading-snug text-slate-300">
              💡 Tip: Increasing your monthly contribution by even{" "}
              <span className="text-emerald-400 font-semibold">
                {formatCurrency(25, currentLocale, currency)}–{formatCurrency(50, currentLocale, currency)}
              </span>{" "}
              can shave months off your goal — compounding loves consistency.
            </p>
          </div>
        )}

        {/* ===== SEO Content Section ===== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          <h1 className="text-3xl font-bold text-cyan-400 mb-6">
            Savings Goal Calculator 2025 – Plan, Track, and Reach Your Target
          </h1>

          <p>
            The <strong>Savings Goal Calculator by CalculatorHub</strong> helps you determine
            how long it will take to reach your target amount with monthly contributions and
            compound growth. Enter your goal, current savings, monthly deposits, and expected
            annual rate to get an instant plan.
          </p>

          <figure className="my-8">
            <img
              src="/images/savings-goal-calculator-hero.webp"
              alt="Savings goal calculator dashboard with contributions vs growth chart"
              title="Savings Goal Calculator 2025 | Compound Growth Planner"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Visualization of the Savings Goal Calculator dark-finance UI.
            </figcaption>
          </figure>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📘 Example Calculation
          </h2>
          <p>
            If you have <strong>$2,000</strong> saved, add <strong>$300/month</strong>, and earn
            <strong> 6%</strong> annually (compounded monthly), you’ll reach <strong>$10,000</strong> in about
            <strong> 2.2 years</strong>. Your total contributions would be roughly <strong>$8,000</strong>, and growth
            covers the rest.
          </p>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧮 How the Savings Goal Calculator Works
          </h2>
          <p>
            We simulate monthly compounding with contributions:
          </p>
          <p className="font-mono text-center text-indigo-300">
            Balance<sub>t+1</sub> = Balance<sub>t</sub> × (1 + r/12) + Monthly Contribution
          </p>
          <p>
            This repeats until your balance meets or exceeds the goal.
          </p>

          {/* ===== FAQ Section ===== */}
          <section id="faq" className="space-y-6 mt-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>

            <div className="space-y-5 text-lg text-slate-100 leading-relaxed">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q1: What rate should I use?
                </h3>
                <p>
                  Use the expected average annual return for your account (e.g., savings APY or
                  long-term investment average). The calculator compounds monthly.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q2: Can I include one-time deposits?
                </h3>
                <p>
                  Enter them by temporarily adding to your current savings, or we can extend the
                  tool to support one-time boosts if you want.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q3: What if I already reached my goal?
                </h3>
                <p>
                  If your current savings are equal to or above the goal, time to goal will show as 0 — you’ve made it!
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
                Practical planning tools and financial insights. Last updated:{" "}
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
                href="/mortgage-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all"
              >
                🏠 Mortgage Calculator
              </a>
              <a
                href="/credit-card-payoff-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-rose-600/20 text-rose-300 hover:text-rose-400 px-3 py-2 rounded-md border border-slate-700 hover:border-rose-500 transition-all"
              >
                💳 Credit Card Payoff
              </a>
              <a
                href="/inflation-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all"
              >
                💸 Inflation Calculator
              </a>
            </div>
          </div>
        </section>

        <AdBanner type="bottom" />
        <RelatedCalculators
          currentPath="/savings-goal-calculator"
          category="currency-finance"
        />
      </div>
    </>
  );
};

export default SavingsGoalCalculator;
