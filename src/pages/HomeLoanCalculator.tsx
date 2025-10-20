// ================= HomeLoanCalculator.tsx (Part 1/2) =================
import React, { useState, useEffect } from "react";
import {
  Home,
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
const LS_KEY = "home_loan_calculator_v1";

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
   🏠 COMPONENT
   ============================================================ */
const HomeLoanCalculator: React.FC = () => {
  // Inputs
  const [homePrice, setHomePrice] = useState<number>(0);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [loanYears, setLoanYears] = useState<number>(0);
  const [loanMonths, setLoanMonths] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("USD");

  // Outputs
  const [emi, setEmi] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);

  // UI state
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [showInfoRate, setShowInfoRate] = useState(false);
  const [showInfoTerm, setShowInfoTerm] = useState(false);

  const currentLocale = findLocale(currency);
  const totalMonths = loanYears * 12 + loanMonths;
  const loanAmount = Math.max(homePrice - downPayment, 0);
  const monthlyRate = interestRate / 12 / 100;
  const isDefault =
    !homePrice && !downPayment && !loanYears && !loanMonths && !interestRate;

  /* ============================================================
     🔁 STATE PERSISTENCE
     ============================================================ */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setHomePrice(s.homePrice || 0);
        setDownPayment(s.downPayment || 0);
        setLoanYears(s.loanYears || 0);
        setLoanMonths(s.loanMonths || 0);
        setInterestRate(s.interestRate || 0);
        setCurrency(s.currency || "USD");
      }
    } catch (err) {
      console.warn("⚠️ Failed to load saved home loan state", err);
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
          homePrice,
          downPayment,
          loanYears,
          loanMonths,
          interestRate,
          currency,
        })
      );
    } catch (err) {
      console.warn("⚠️ Failed to save home loan state", err);
    }
  }, [hydrated, homePrice, downPayment, loanYears, loanMonths, interestRate, currency]);

  /* ============================================================
     🧮 EMI CALCULATION
     ============================================================ */
  useEffect(() => {
    if (loanAmount <= 0 || totalMonths <= 0 || interestRate < 0) {
      setEmi(0);
      setTotalPayment(0);
      setTotalInterest(0);
      return;
    }

    if (interestRate === 0) {
      const simpleEMI = loanAmount / totalMonths;
      setEmi(simpleEMI);
      setTotalPayment(loanAmount);
      setTotalInterest(0);
      return;
    }

    const pow = Math.pow(1 + monthlyRate, totalMonths);
    const monthlyEMI = (loanAmount * monthlyRate * pow) / (pow - 1);
    setEmi(monthlyEMI);
    setTotalPayment(monthlyEMI * totalMonths);
    setTotalInterest(monthlyEMI * totalMonths - loanAmount);
  }, [loanAmount, monthlyRate, totalMonths, interestRate]);

  /* ============================================================
     📋 COPY / SHARE / RESET
     ============================================================ */
  const reset = () => {
    setHomePrice(0);
    setDownPayment(0);
    setLoanYears(0);
    setLoanMonths(0);
    setInterestRate(0);
    setCurrency("USD");
    localStorage.removeItem(LS_KEY);
  };

  const copyResults = async () => {
    const text = [
      "Home Loan Summary",
      `Home Price: ${formatCurrency(homePrice, currentLocale, currency)}`,
      `Down Payment: ${formatCurrency(downPayment, currentLocale, currency)}`,
      `Loan Amount: ${formatCurrency(loanAmount, currentLocale, currency)}`,
      `Rate: ${interestRate}%`,
      `Term: ${loanYears} years ${loanMonths} months`,
      `Monthly EMI: ${formatCurrency(emi, currentLocale, currency)}`,
      `Total Payment: ${formatCurrency(totalPayment, currentLocale, currency)}`,
      `Total Interest: ${formatCurrency(totalInterest, currentLocale, currency)}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const encoded = btoa(
      JSON.stringify({
        homePrice,
        downPayment,
        loanYears,
        loanMonths,
        interestRate,
        currency,
      })
    );
    const url = new URL(window.location.href);
    url.searchParams.set("home", encoded);
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
        title="Home Loan Calculator | CalculatorHub"
        description="Estimate your home loan EMI, total interest, and total payment easily with CalculatorHub’s free online home loan calculator."
        canonical="https://calculatorhub.site/home-loan-calculator"
        schemaData={generateCalculatorSchema(
          "Home Loan Calculator",
          "Instantly compute home loan EMI, total payment, and interest with CalculatorHub.",
          "/home-loan-calculator",
          ["home loan calculator", "house loan calculator", "home EMI calculator"]
        )}
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "Home Loan Calculator", url: "/home-loan-calculator" },
          ]}
        />

        {/* ===== Header ===== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🏠 Home Loan Calculator
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Calculate your monthly EMI, total payment, and total interest for your home loan.
          </p>
        </div>

        {/* ===== Input + Output Grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Home className="h-5 w-5 text-sky-400" /> Loan Details
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

              {/* Home Price */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">
                  Home Price ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={homePrice || ""}
                  onChange={(e) => setHomePrice(parseFloat(e.target.value) || 0)}
                  placeholder="Enter total home cost"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Down Payment */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">
                  Down Payment ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={downPayment || ""}
                  onChange={(e) =>
                    setDownPayment(Math.min(parseFloat(e.target.value) || 0, homePrice))
                  }
                  placeholder="Enter upfront payment"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Interest Rate */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Interest Rate (% per annum)
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoRate(!showInfoRate)}
                  />
                </label>
                {showInfoRate && (
                  <p className="text-xs bg-[#0f172a] border border-[#334155] rounded-md p-2 mt-1">
                    Annual interest rate charged by your lender or bank.
                  </p>
                )}
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={interestRate || ""}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 7.25"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>


              {/* Loan Term */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Loan Term
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoTerm(!showInfoTerm)}
                  />
                </label>
                {showInfoTerm && (
                  <p className="text-xs bg-[#0f172a] border border-[#334155] rounded-md p-2 mt-1">
                    Enter total loan duration in years and months.
                  </p>
                )}
                <div className="flex gap-4 mt-2">
                  <input
                    type="number"
                    min={0}
                    value={loanYears || ""}
                    onChange={(e) => setLoanYears(parseFloat(e.target.value) || 0)}
                    placeholder="Years"
                    className="w-1/2 bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    min={0}
                    max={11}
                    value={loanMonths || ""}
                    onChange={(e) => setLoanMonths(parseFloat(e.target.value) || 0)}
                    placeholder="Months"
                    className="w-1/2 bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">Loan Summary</h2>

            <div className="space-y-6">
              <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(emi, currentLocale, currency)}
                </div>
                <div className="text-sm text-slate-400">Estimated Monthly EMI</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(totalPayment, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Total Payment</div>
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
        {loanAmount > 0 && totalInterest > 0 && (
          <div className="mt-6 bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              Home Loan Breakdown
            </h3>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Pie Chart */}
              <div className="w-[90%] sm:w-[70%] md:w-[50%] max-w-[360px] h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Principal (Loan Amount)", value: loanAmount },
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
                    {formatCurrency(loanAmount, currentLocale, currency)}
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
        {emi > 0 && (
          <div className="mt-5 bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm">
            <p className="text-base font-medium leading-snug text-slate-300">
              💡 Tip: Increase your <span className="text-emerald-400 font-semibold">down payment</span> 
              or shorten your <span className="text-indigo-400 font-semibold">loan tenure</span> 
              to reduce total interest payments significantly!
            </p>
          </div>
        )}

        {/* ===== SEO Content Section ===== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          <h1 className="text-3xl font-bold text-cyan-400 mb-6">
            Home Loan Calculator 2025 – EMI, Interest & Total Payment
          </h1>

          <p>
            The <strong>Home Loan Calculator by CalculatorHub</strong> helps you calculate
            EMI, total interest, and total payment for your house or property loan.
            Enter your home price, down payment, tenure, and rate to see instant results.
          </p>

          <figure className="my-8">
            <img
              src="/images/home-loan-calculator.webp"
              alt="Home Loan Calculator interface and EMI breakdown"
              title="Home Loan Calculator 2025 | CalculatorHub"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Visualization of the Home Loan Calculator UI and EMI results.
            </figcaption>
          </figure>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧮 Home Loan EMI Formula
          </h2>
          <p className="font-mono text-center text-indigo-300">
            EMI = [P × r × (1 + r)ⁿ] ÷ [(1 + r)ⁿ − 1]
          </p>
          <p className="text-center text-slate-400 mt-2">
            Where: P = Principal, r = Monthly Interest Rate, n = Tenure in Months
          </p>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📘 Example Calculation
          </h2>
          <p>
            Suppose you buy a home worth <strong>$400,000</strong> with a <strong>$80,000</strong> down payment,  
            at <strong>7%</strong> interest for <strong>20 years</strong>.  
            The EMI ≈ <strong>$2,482</strong>, total payment ≈ <strong>$595,680</strong>, 
            and interest ≈ <strong>$275,680</strong>.
          </p>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            💡 Tips to Save on Home Loan
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Make a higher down payment to reduce interest burden.</li>
            <li>Opt for shorter tenure if affordable.</li>
            <li>Compare lenders for better rates and offers.</li>
            <li>Make occasional prepayments to cut loan duration.</li>
          </ul>

          {/* ===== FAQ Section ===== */}
          <section id="faq" className="space-y-6 mt-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>

            <div className="space-y-5 text-lg text-slate-100 leading-relaxed">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q1: What is a good home loan interest rate?
                </h3>
                <p>
                  Typically between 6–8% depending on lender, credit score, and loan type.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q2: Can I prepay my home loan early?
                </h3>
                <p>
                  Yes, most banks allow prepayment or foreclosure. It saves significant interest over time.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q3: What tenure should I choose?
                </h3>
                <p>
                  Shorter tenures have higher EMIs but lower total cost. Long tenures reduce EMI but increase interest.
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
                Updated with latest mortgage and housing loan trends. Last updated:{" "}
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
                href="/car-loan-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-blue-600/20 text-blue-300 hover:text-blue-400 px-3 py-2 rounded-md border border-slate-700 hover:border-blue-500 transition-all"
              >
                🚗 Car Loan Calculator
              </a>
              <a
                href="/loan-emi-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all"
              >
                💸 Loan EMI Calculator
              </a>
            </div>
          </div>
        </section>

        <AdBanner type="bottom" />
        <RelatedCalculators
          currentPath="/home-loan-calculator"
          category="currency-finance"
        />
      </div>
    </>
  );
};

export default HomeLoanCalculator;

