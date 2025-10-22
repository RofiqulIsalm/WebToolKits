
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
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
   CONSTANTS
   ============================================================ */
const LS_KEY = "personal_loan_calculator_v1";

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
   COMPONENT
   ============================================================ */
const PersonalLoanCalculator: React.FC = () => {
  // Inputs
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(0);
  const [loanYears, setLoanYears] = useState<number>(0);
  const [loanMonths, setLoanMonths] = useState<number>(0);
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
  const monthlyRate = interestRate / 12 / 100;
  const isDefault = !loanAmount && !loanYears && !loanMonths && !interestRate;

  /* ============================================================
     LOCAL STORAGE PERSISTENCE
     ============================================================ */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setLoanAmount(s.loanAmount || 0);
        setInterestRate(s.interestRate || 0);
        setLoanYears(s.loanYears || 0);
        setLoanMonths(s.loanMonths || 0);
        setCurrency(s.currency || "USD");
      }
    } catch {
      console.warn("⚠️ Could not load personal loan data");
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
          loanAmount,
          interestRate,
          loanYears,
          loanMonths,
          currency,
        })
      );
    } catch {
      console.warn("⚠️ Could not save personal loan data");
    }
  }, [hydrated, loanAmount, interestRate, loanYears, loanMonths, currency]);

  /* ============================================================
     EMI CALCULATION
     ============================================================ */
  useEffect(() => {
    if (loanAmount <= 0 || totalMonths <= 0 || interestRate < 0) {
      setEmi(0);
      setTotalPayment(0);
      setTotalInterest(0);
      return;
    }

    if (interestRate === 0) {
      const simple = loanAmount / totalMonths;
      setEmi(simple);
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
     COPY / SHARE / RESET
     ============================================================ */
  const reset = () => {
    setLoanAmount(0);
    setInterestRate(0);
    setLoanYears(0);
    setLoanMonths(0);
    setCurrency("USD");
    localStorage.removeItem(LS_KEY);
  };

  const copyResults = async () => {
    const text = [
      "Personal Loan Summary",
      `Loan Amount: ${formatCurrency(loanAmount, currentLocale, currency)}`,
      `Interest Rate: ${interestRate}%`,
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
      JSON.stringify({ loanAmount, interestRate, loanYears, loanMonths, currency })
    );
    const url = new URL(window.location.href);
    url.searchParams.set("personal", encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  /* ============================================================
     RENDER START
     ============================================================ */
  return (
    <>
      <SEOHead
        title="Personal Loan Calculator | CalculatorHub"
        description="Calculate your personal loan EMI, total interest, and total payment easily with CalculatorHub’s free online personal loan calculator."
        canonical="https://calculatorhub.site/personal-loan-calculator"
        schemaData={generateCalculatorSchema(
          "Personal Loan Calculator",
          "Instantly calculate EMI, total interest, and repayment schedule for your personal loan.",
          "/personal-loan-calculator",
          ["personal loan calculator", "EMI calculator", "unsecured loan EMI"]
        )}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "Personal Loan Calculator", url: "/personal-loan-calculator" },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">💰 Personal Loan Calculator</h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Estimate your monthly EMI, total interest, and repayment cost for a personal loan.
          </p>
        </div>

        {/* Input Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Wallet className="h-5 w-5 text-pink-400" /> Loan Details
              </h2>
              <button
                onClick={reset}
                className="flex items-center gap-1 text-sm text-slate-300 border border-[#334155] rounded-lg px-2 py-1 hover:bg-[#0f172a] hover:text-white transition"
                disabled={isDefault}
              >
                <RotateCcw className="h-4 w-4 text-pink-400" /> Reset
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
                  className="w-48 bg-[#0f172a] text-white text-sm px-3 py-1.5 border border-[#334155] rounded-md focus:ring-2 focus:ring-pink-500"
                >
                  {currencyOptions.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Loan Amount */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">
                  Loan Amount ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={loanAmount || ""}
                  onChange={(e) => setLoanAmount(parseFloat(e.target.value) || 0)}
                  placeholder="Enter loan amount"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Interest Rate */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Interest Rate (% per annum)
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-pink-400"
                    onClick={() => setShowInfoRate(!showInfoRate)}
                  />
                </label>
                {showInfoRate && (
                  <p className="text-xs bg-[#0f172a] border border-[#334155] rounded-md p-2 mt-1">
                    Annual rate charged by your lender on the borrowed amount.
                  </p>
                )}
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={interestRate || ""}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 12.5"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>


              {/* Loan Term */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Loan Term
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-pink-400"
                    onClick={() => setShowInfoTerm(!showInfoTerm)}
                  />
                </label>
                {showInfoTerm && (
                  <p className="text-xs bg-[#0f172a] border border-[#334155] rounded-md p-2 mt-1">
                    Duration of the loan in years and months.
                  </p>
                )}
                <div className="flex gap-4 mt-2">
                  <input
                    type="number"
                    min={0}
                    value={loanYears || ""}
                    onChange={(e) => setLoanYears(parseFloat(e.target.value) || 0)}
                    placeholder="Years"
                    className="w-1/2 bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                  <input
                    type="number"
                    min={0}
                    max={11}
                    value={loanMonths || ""}
                    onChange={(e) => setLoanMonths(parseFloat(e.target.value) || 0)}
                    placeholder="Months"
                    className="w-1/2 bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-pink-500"
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
                  className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-3 py-2 rounded-md text-sm"
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
              Personal Loan Breakdown
            </h3>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Pie Chart */}
              <div className="w-[90%] sm:w-[70%] md:w-[50%] max-w-[360px] h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Principal (Loan)", value: loanAmount },
                        { name: "Interest", value: totalInterest },
                      ]}
                      dataKey="value"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      <Cell fill="#ec4899" />
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

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-pink-500 transition">
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
              💡 Tip: Improve your credit score and compare lenders to get a lower
              <span className="text-pink-400 font-semibold"> interest rate</span>, which
              reduces your total cost.
            </p>
          </div>
        )}

        {/* ===== SEO Content & FAQ ===== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
            <h1 className="text-3xl font-bold text-pink-400 mb-6">
              Personal Loan Calculator 2025 – EMI & Interest
            </h1>
          
            <p>
              The <strong>Personal Loan Calculator by CalculatorHub</strong> is a 
              <strong> simple Personal Loan Calculator</strong> that helps users calculate 
              EMIs, total interest, and total repayment instantly. Whether for a short-term 
              loan or a long-term financing plan, this <strong>free Personal Loan Calculator</strong> 
              is designed for everyone — from beginners to professionals — offering 
              quick, accurate, and easy-to-read results.
            </p>
          
            <p>
              It’s more than just a <strong>tool Personal Loan Calculator</strong>; it’s a 
              complete <strong>solution Personal Loan Calculator</strong> built to simplify 
              loan planning. This <strong>Personal Loan Calculator website</strong> combines 
              simplicity and power, allowing users to test different scenarios, 
              compare lender offers, and understand repayment schedules clearly. 
              For those searching for a reliable, <strong>powerful Personal Loan Calculator</strong> 
              that’s completely online, CalculatorHub provides one of the 
              <strong> best Personal Loan Calculators</strong> available in 2025.
            </p>
          
            <figure className="my-8">
              <img
                src="/images/personal-loan-calculator.webp"
                alt="Personal Loan Calculator interface and EMI chart"
                title="Personal Loan Calculator 2025 | CalculatorHub"
                className="rounded-lg shadow-md border border-slate-700 mx-auto"
                loading="lazy"
              />
              <figcaption className="text-center text-sm text-slate-400 mt-2">
                Visualization of Personal Loan Calculator results and EMI chart.
              </figcaption>
            </figure>
          
            <h2 className="text-2xl font-semibold text-pink-300 mt-10 mb-4">
              💡 What is Personal Loan Calculator?
            </h2>
            <p>
              People often ask, <strong>what is Personal Loan Calculator</strong>?  
              It’s an <strong>easy Personal Loan Calculator</strong> that uses your 
              loan amount, tenure, and interest rate to calculate monthly EMIs 
              and total repayment cost instantly. The <strong>Personal Loan Calculator explained</strong>: 
              it uses a precise EMI formula to ensure that every borrower — beginner or expert — 
              gets accurate insights into how much they’ll pay and how much of that goes 
              toward interest versus principal.  
            </p>
          
            <p>
              This <strong>Personal Loan Calculator online</strong> makes it easier than ever 
              to explore different loan options, test repayment periods, and understand 
              the financial impact before committing. With features that feel professional 
              but are designed for accessibility, it’s perfect for anyone searching for a 
              <strong> Personal Loan Calculator for beginners</strong> or a 
              <strong> professional Personal Loan Calculator</strong>.
            </p>
          
            <h2 className="text-2xl font-semibold text-pink-300 mt-10 mb-4">
              🧭 How to Use Personal Loan Calculator
            </h2>
            <p>
              Learning <strong>how to use Personal Loan Calculator</strong> is simple and straightforward:
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Enter the total <strong>loan amount</strong> you wish to borrow.</li>
              <li>Input the <strong>interest rate</strong> offered by your bank or lender.</li>
              <li>Specify the <strong>loan tenure</strong> in months or years.</li>
              <li>Click “Calculate” to get instant EMI, total payment, and total interest results.</li>
              <li>Adjust the inputs to compare different loan options.</li>
            </ol>
            <p>
              This step-by-step approach makes it a <strong>simple Personal Loan Calculator</strong> 
              ideal for anyone, yet advanced enough to serve as a 
              <strong> premium Personal Loan Calculator</strong> for in-depth comparisons.
            </p>
          
            <h2 className="text-2xl font-semibold text-pink-300 mt-10 mb-4">
              📘 EMI Formula
            </h2>
            <p className="font-mono text-center text-pink-300">
              EMI = [P × r × (1 + r)ⁿ] / [(1 + r)ⁿ − 1]
            </p>
            <p className="text-center text-slate-400 mt-2">
              where P = Principal, r = Monthly Interest Rate, n = Tenure in months.
            </p>
            <p>
              This formula ensures accuracy in every calculation. 
              It’s what makes this <strong>advanced Personal Loan Calculator</strong> 
              dependable for both personal and <strong>small business Personal Loan Calculator</strong> 
              users who need reliable EMI projections.
            </p>
          
            <h2 className="text-2xl font-semibold text-pink-300 mt-10 mb-4">
              💰 Example Calculation
            </h2>
            <p>
              Suppose you borrow <strong>$10,000</strong> for <strong>3 years</strong> at 
              <strong>12% annual interest</strong>. Your monthly EMI ≈ 
              <strong>$332</strong>, total payment ≈ <strong>$11,952</strong>, and total interest ≈ 
              <strong>$1,952</strong>.  
              Using this <strong>free Personal Loan Calculator</strong>, 
              you can test different rates and durations to find your most affordable plan.  
              The <strong>Personal Loan Calculator benefits</strong> include speed, accuracy, and 
              flexibility — making it one of the <strong>best Personal Loan Calculator tools</strong> 
              for quick financial planning.
            </p>
          
            <h2 className="text-2xl font-semibold text-pink-300 mt-10 mb-4">
              🌐 Personal Loan Calculator Online & Website
            </h2>
            <p>
              The <strong>Personal Loan Calculator online</strong> is accessible anytime, 
              anywhere. No downloads or installations — just open the 
              <strong>Personal Loan Calculator website</strong>, input your details, and 
              view instant results.  
              It’s a responsive <strong>service Personal Loan Calculator</strong> 
              built for all devices — from desktops to smartphones — ensuring that 
              users can plan their loans on the go.  
              This online platform represents an all-in-one 
              <strong> solution Personal Loan Calculator</strong> experience for everyone.
            </p>
          
            <h2 className="text-2xl font-semibold text-pink-300 mt-10 mb-4">
              🎯 Benefits of Using Personal Loan Calculator
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Instant, accurate EMI and interest calculations.</li>
              <li>Works as a <strong>powerful Personal Loan Calculator</strong> for professionals.</li>
              <li>Completely <strong>free Personal Loan Calculator</strong> — no registration required.</li>
              <li>Helps small businesses and individuals plan repayments effectively.</li>
              <li>Visual breakdowns for total interest vs. principal.</li>
              <li>Updated and maintained as a <strong>service Personal Loan Calculator</strong>.</li>
            </ul>
          
            <h2 className="text-2xl font-semibold text-pink-300 mt-10 mb-4">
              🏢 Small Business & Professional Use
            </h2>
            <p>
              Entrepreneurs can use this <strong>small business Personal Loan Calculator</strong> 
              to compare financing options for expansion, inventory, or operations.  
              The <strong>professional Personal Loan Calculator</strong> helps consultants 
              and lenders create transparent loan reports.  
              For businesses seeking a <strong>premium Personal Loan Calculator</strong> 
              that integrates visuals, charts, and exportable results, CalculatorHub delivers 
              exceptional value.
            </p>
          
            <h2 className="text-2xl font-semibold text-pink-300 mt-10 mb-4">
              💡 Summary: Why Choose CalculatorHub’s Personal Loan Tool
            </h2>
            <p>
              CalculatorHub offers the <strong>best Personal Loan Calculator</strong> for 
              everyday users, professionals, and businesses alike.  
              It combines the simplicity of a <strong>simple Personal Loan Calculator</strong> 
              with the flexibility of an <strong>advanced Personal Loan Calculator</strong>, 
              ensuring clarity and accuracy every time.  
              Whether you’re exploring new loan options or comparing EMI schedules, 
              this <strong>powerful Personal Loan Calculator</strong> is your ultimate 
              <strong> solution Personal Loan Calculator</strong>.
            </p>
          
            {/* ===== FAQ Section ===== */}
            <section id="faq" className="space-y-6 mt-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-pink-300">
                ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
              </h2>
          
              <div className="space-y-5 text-lg text-slate-100 leading-relaxed">
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-pink-300">
                    Q1: What is a good personal loan interest rate?
                  </h3>
                  <p>
                    Typically, rates between 10% and 16% are considered good for borrowers 
                    with strong credit profiles using a <strong>free Personal Loan Calculator</strong> 
                    to compare offers.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-pink-300">
                    Q2: Can I prepay a personal loan early?
                  </h3>
                  <p>
                    Yes, most banks allow early closure with minimal fees. Using the 
                    <strong> easy Personal Loan Calculator</strong> helps visualize how prepayment 
                    reduces your total interest.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-pink-300">
                    Q3: Can small businesses use this calculator?
                  </h3>
                  <p>
                    Absolutely! The <strong>small business Personal Loan Calculator</strong> 
                    is ideal for entrepreneurs managing short-term credit or working capital loans.
                  </p>
                </div>
              </div>
            </section>
          </section>
          
          {/* ===== Footer & Related Calculators ===== */}
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
                  Updated with the latest lending and finance insights. Last updated:{" "}
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
                  href="/car-loan-calculator"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-pink-600/20 text-pink-300 hover:text-pink-400 px-3 py-2 rounded-md border border-slate-700 hover:border-pink-500 transition-all"
                >
                  🚗 Car Loan Calculator
                </a>
                <a
                  href="/home-loan-calculator"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-blue-600/20 text-blue-300 hover:text-blue-400 px-3 py-2 rounded-md border border-slate-700 hover:border-blue-500 transition-all"
                >
                  🏠 Home Loan Calculator
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
          currentPath="/personal-loan-calculator"
          category="currency-finance"
        />
      </div>
    </>
  );
};

export default PersonalLoanCalculator;
