// ================= LoanAffordabilityCalculator.tsx (Part 1/2) =================
import React, { useState, useEffect } from "react";
import {
  Home,
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
const LS_KEY = "loan_affordability_calc_v1";

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
    maximumFractionDigits: 0,
  }).format(num);

/* ============================================================
   🏠 COMPONENT
   ============================================================ */
const LoanAffordabilityCalculator: React.FC = () => {
  // Inputs
  const [income, setIncome] = useState<number>(0);
  const [expenses, setExpenses] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(0);
  const [loanYears, setLoanYears] = useState<number>(0);
  const [debtRatio, setDebtRatio] = useState<number>(40); // %
  const [currency, setCurrency] = useState<string>("USD");

  // Outputs
  const [maxLoan, setMaxLoan] = useState<number>(0);
  const [emi, setEmi] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);

  // UI
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [hydrated, setHydrated] = useState(false);
  const [showInfoRatio, setShowInfoRatio] = useState(false);
  const [showInfoInterest, setShowInfoInterest] = useState(false);
  const [showInfoTerm, setShowInfoTerm] = useState(false);

  const currentLocale = findLocale(currency);
  const isDefault = !income && !expenses && !interestRate && !loanYears;

  /* ============================================================
     🔁 PERSISTENCE
     ============================================================ */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setIncome(s.income || 0);
        setExpenses(s.expenses || 0);
        setInterestRate(s.interestRate || 0);
        setLoanYears(s.loanYears || 0);
        setDebtRatio(s.debtRatio || 40);
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
        JSON.stringify({
          income,
          expenses,
          interestRate,
          loanYears,
          debtRatio,
          currency,
        })
      );
    } catch {
      console.warn("⚠️ Could not save state");
    }
  }, [hydrated, income, expenses, interestRate, loanYears, debtRatio, currency]);

  /* ============================================================
     🧮 CALCULATION
     ============================================================ */
  useEffect(() => {
    if (income <= 0 || interestRate <= 0 || loanYears <= 0) {
      setMaxLoan(0);
      setEmi(0);
      setTotalPayment(0);
      setTotalInterest(0);
      return;
    }

    const affordablePayment = ((income - expenses) * (debtRatio / 100)) || 0;
    const monthlyRate = interestRate / 12 / 100;
    const totalMonths = loanYears * 12;

    if (monthlyRate === 0) {
      const maxLoanValue = affordablePayment * totalMonths;
      setMaxLoan(maxLoanValue);
      setEmi(affordablePayment);
      setTotalPayment(maxLoanValue);
      setTotalInterest(0);
      return;
    }

    const pow = Math.pow(1 + monthlyRate, totalMonths);
    const maxLoanValue = (affordablePayment * (pow - 1)) / (monthlyRate * pow);

    setMaxLoan(maxLoanValue);
    setEmi(affordablePayment);
    setTotalPayment(affordablePayment * totalMonths);
    setTotalInterest(affordablePayment * totalMonths - maxLoanValue);
  }, [income, expenses, interestRate, loanYears, debtRatio]);

  /* ============================================================
     🔗 COPY / SHARE / RESET
     ============================================================ */
  const reset = () => {
    setIncome(0);
    setExpenses(0);
    setInterestRate(0);
    setLoanYears(0);
    setDebtRatio(40);
    setCurrency("USD");
    localStorage.removeItem(LS_KEY);
  };

  const copyResults = async () => {
    const text = [
      "Loan Affordability Summary",
      `Income: ${formatCurrency(income, currentLocale, currency)}`,
      `Expenses: ${formatCurrency(expenses, currentLocale, currency)}`,
      `Affordable EMI: ${formatCurrency(emi, currentLocale, currency)}`,
      `Max Loan: ${formatCurrency(maxLoan, currentLocale, currency)}`,
      `Interest Rate: ${interestRate}%`,
      `Term: ${loanYears} years`,
      `Debt Ratio: ${debtRatio}%`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const state = {
      income,
      expenses,
      interestRate,
      loanYears,
      debtRatio,
      currency,
    };
    const encoded = btoa(JSON.stringify(state));
    const url = new URL(window.location.href);
    url.searchParams.set("laf", encoded);
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
        title="Loan Affordability Calculator | CalculatorHub"
        description="Estimate how much loan you can afford based on your income, expenses, and interest rate using this free online calculator."
        canonical="https://calculatorhub.site/loan-affordability-calculator"
        schemaData={generateCalculatorSchema(
          "Loan Affordability Calculator",
          "Find the maximum home or personal loan you can afford based on income, expenses, and interest rate.",
          "/loan-affordability-calculator",
          ["loan affordability", "how much loan can I afford", "mortgage limit", "finance calculator"]
        )}
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "Loan Affordability Calculator", url: "/loan-affordability-calculator" },
          ]}
        />

        {/* ===== Header ===== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            🏠 Loan Affordability Calculator
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Estimate how much loan you can afford based on your income, expenses, and ideal debt-to-income ratio.
          </p>
        </div>

        {/* ===== Input + Output Grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Home className="h-5 w-5 text-sky-400" /> Financial Details
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
                  Monthly Income ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={income || ""}
                  onChange={(e) => setIncome(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter monthly income"
                />
              </div>

              {/* Expenses */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">
                  Monthly Expenses ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={expenses || ""}
                  onChange={(e) => setExpenses(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter monthly living expenses"
                />
              </div>

              {/* Debt Ratio */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Debt-to-Income Ratio (%)
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoRatio(!showInfoRatio)}
                  />
                </label>
                {showInfoRatio && (
                  <p className="text-xs bg-[#0f172a] border border-[#334155] rounded-md p-2 mt-1">
                    The percentage of your income that can safely go toward loan repayments.
                    Typical recommendation: 35–45%.
                  </p>
                )}
                <input
                  type="number"
                  step="0.1"
                  min={10}
                  max={70}
                  value={debtRatio || ""}
                  onChange={(e) => setDebtRatio(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 40"
                />
              </div>

              {/* Interest Rate */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Interest Rate (%)
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoInterest(!showInfoInterest)}
                  />
                </label>
                {showInfoInterest && (
                  <p className="text-xs bg-[#0f172a] border border-[#334155] rounded-md p-2 mt-1">
                    Annual percentage rate applied to your loan.
                  </p>
                )}
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={interestRate || ""}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter annual rate"
                />
              </div>

              {/* Loan Term */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Loan Term (Years)
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoTerm(!showInfoTerm)}
                  />
                </label>
                {showInfoTerm && (
                  <p className="text-xs bg-[#0f172a] border border-[#334155] rounded-md p-2 mt-1">
                    The total repayment period — typically 15, 20, or 30 years for mortgages.
                  </p>
                )}
                <input
                  type="number"
                  min={1}
                  value={loanYears || ""}
                  onChange={(e) => setLoanYears(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter loan term in years"
                />
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">Affordability Summary</h2>
            <div className="space-y-6">
              <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(maxLoan, currentLocale, currency)}
                </div>
                <div className="text-sm text-slate-400">Maximum Affordable Loan</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(emi, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Monthly EMI</div>
                </div>
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(totalInterest, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Total Interest</div>
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
        {maxLoan > 0 && (
          <div className="mt-6 bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              Affordability Breakdown
            </h3>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Pie Chart */}
              <div className="w-[90%] sm:w-[70%] md:w-[50%] max-w-[360px] h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Principal", value: maxLoan },
                        { name: "Interest", value: totalInterest },
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
                  <p className="text-sm text-slate-400">Principal (Loan)</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(maxLoan, currentLocale, currency)}
                  </p>
                </div>
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-emerald-500 transition">
                  <p className="text-sm text-slate-400">Total Interest</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(totalInterest, currentLocale, currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Smart Tip ===== */}
        {maxLoan > 0 && (
          <div className="mt-5 bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm">
            <p className="text-base font-medium leading-snug text-slate-300">
              💡 Tip: To qualify for a larger loan, aim to <span className="text-emerald-400 font-semibold">reduce your existing expenses</span> or 
              <span className="text-indigo-400 font-semibold"> extend your loan term</span> to lower monthly payments.
            </p>
          </div>
        )}

        {/* ===== SEO / Informational Section ===== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          <h1 className="text-3xl font-bold text-cyan-400 mb-6">
            Loan Affordability Calculator 2025 – Find How Much You Can Borrow
          </h1>

          <p>
            The <strong>Loan Affordability Calculator by CalculatorHub</strong> helps you 
            estimate the maximum loan amount you can afford based on your income, 
            monthly expenses, loan term, and interest rate. It follows standard 
            debt-to-income (DTI) guidelines used by banks and lenders.
          </p>

          <figure className="my-8">
            <img
              src="/images/loan-affordability-calculator-hero.webp"
              alt="Loan affordability calculator dashboard with chart"
              title="Loan Affordability Calculator 2025 | Home Loan Planner"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Visualization of the Loan Affordability Calculator dark-finance UI.
            </figcaption>
          </figure>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📘 Example Calculation
          </h2>
          <p>
            Suppose you earn <strong>$5 000</strong> monthly and spend <strong>$2 000</strong> on expenses.  
            With a <strong>40 % DTI ratio</strong>, <strong>6 % interest</strong>, and a <strong>30-year term</strong>,  
            you could afford a loan around <strong>$360 000</strong> with an EMI near <strong>$1 200</strong>.
          </p>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧮 How Loan Affordability Is Calculated
          </h2>
          <p className="font-mono text-center text-indigo-300">
            Affordable Payment = (Income − Expenses) × (DTI %)  
            <br />
            Loan = [EMI × ((1 + r)ⁿ − 1)] ÷ [r × (1 + r)ⁿ]
          </p>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            💡 Tips for Better Affordability
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Increase income or reduce debt to improve DTI.</li>
            <li>Choose a longer term for smaller monthly payments.</li>
            <li>Shop for lower interest rates to boost loan eligibility.</li>
          </ul>

          {/* ===== FAQ Section ===== */}
          <section id="faq" className="space-y-6 mt-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>

            <div className="space-y-5 text-lg text-slate-100 leading-relaxed">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q1: What is a good debt-to-income ratio?
                </h3>
                <p>
                  Lenders prefer a DTI below 43 %, but 35–40 % is ideal for comfortably handling loans.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q2: Does this include property tax and insurance?
                </h3>
                <p>
                  No — these costs are not included. You can subtract estimated monthly taxes and insurance from income before calculating affordability.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q3: Can I use this for auto or personal loans?
                </h3>
                <p>
                  Yes, the same logic applies — just adjust the term and interest rate to match your loan type.
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
                Updated for accuracy and clarity. Last updated: 
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
                href="/roi-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-400 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all"
              >
                📈 ROI Calculator
              </a>
              <a
                href="/simple-interest-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all"
              >
                💰 Simple Interest Calculator
              </a>
            </div>
          </div>
        </section>

        <AdBanner type="bottom" />
        <RelatedCalculators
          currentPath="/loan-affordability-calculator"
          category="currency-finance"
        />
      </div>
    </>
  );
};

export default LoanAffordabilityCalculator;

