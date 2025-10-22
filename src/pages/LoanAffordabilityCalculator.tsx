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
            Loan Affordability Calculator 2025 – Estimate What You Can Borrow
          </h1>
        
          <p>
            The <strong>Loan Affordability Calculator by CalculatorHub</strong> is a 
            <strong> simple Loan Affordability Calculator</strong> designed to help users
            determine how much loan they can safely afford based on income, expenses, and interest rate.
            Whether you’re a first-time borrower or a financial professional, this 
            <strong> professional Loan Affordability Calculator</strong> provides quick,
            accurate, and easy-to-understand results in seconds.
          </p>
        
          <p>
            Acting as both a <strong>solution Loan Affordability Calculator</strong> and a 
            <strong> tool Loan Affordability Calculator</strong>, it simplifies complex math 
            by automatically calculating your affordable EMI, maximum loan value, and 
            total payment. This <strong>free Loan Affordability Calculator</strong> follows 
            standard debt-to-income (DTI) principles used by banks worldwide, helping users 
            make confident financial decisions. It’s also available as a fully responsive 
            <strong> Loan Affordability Calculator online</strong> tool accessible from 
            any device.
          </p>
        
          <figure className="my-8">
            <img
              src="/images/loan-affordability-calculator-hero.webp"
              alt="Loan Affordability Calculator dashboard showing EMI and affordability chart"
              title="Loan Affordability Calculator 2025 | CalculatorHub"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Visualization of the Loan Affordability Calculator interface and affordability breakdown.
            </figcaption>
          </figure>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            💡 What is Loan Affordability Calculator?
          </h2>
          <p>
            Many people wonder <strong>what is Loan Affordability Calculator</strong> and 
            how it helps. Simply put, it’s an <strong>easy Loan Affordability Calculator</strong> 
            that calculates how much loan a person can afford without straining their 
            monthly budget. The <strong>Loan Affordability Calculator explained</strong>: 
            it factors in your income, monthly expenses, interest rate, and loan term to 
            show the exact loan amount you can qualify for — and how much EMI you can pay 
            comfortably each month.
          </p>
        
          <p>
            For beginners, this <strong>Loan Affordability Calculator for beginners</strong> 
            offers step-by-step input fields and automatic results. For experts, the 
            <strong>advanced Loan Affordability Calculator</strong> provides detailed 
            breakdowns of interest, total repayment, and affordability ratios — making 
            it a trusted financial planning companion.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧭 How to Use Loan Affordability Calculator
          </h2>
          <p>
            Learning <strong>how to use Loan Affordability Calculator</strong> is easy:
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter your monthly <strong>income</strong>.</li>
            <li>Add your regular <strong>expenses</strong> such as rent, utilities, or debts.</li>
            <li>Input the expected <strong>interest rate</strong> and <strong>loan term</strong>.</li>
            <li>Set your preferred <strong>debt-to-income ratio</strong> (e.g., 40%).</li>
            <li>Click “Calculate” to see your maximum affordable loan, EMI, and total interest instantly.</li>
          </ol>
          <p>
            This step-by-step process makes it an ideal 
            <strong> Loan Affordability Calculator tutorial</strong> for new users. 
            With its intuitive interface and real-time results, even non-financial users 
            can make smart borrowing decisions in minutes using this 
            <strong> simple Loan Affordability Calculator</strong>.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧮 Example Calculation
          </h2>
          <p>
            Suppose someone earns <strong>$5,000</strong> per month and spends 
            <strong>$2,000</strong> on living costs. At a <strong>6% interest rate</strong>, 
            with a <strong>40% DTI</strong> ratio and a <strong>30-year term</strong>, 
            the <strong>advanced Loan Affordability Calculator</strong> shows that the 
            person can afford a loan around <strong>$360,000</strong> with an estimated 
            EMI near <strong>$1,200</strong>.  
            This demonstrates how powerful and practical this 
            <strong>professional Loan Affordability Calculator</strong> can be for 
            planning real-world budgets.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🌐 Loan Affordability Calculator Online
          </h2>
          <p>
            The <strong>Loan Affordability Calculator online</strong> works directly 
            in your browser — no downloads required. It’s optimized for speed and accuracy, 
            giving results instantly while preserving user privacy.  
            Hosted on the <strong>Loan Affordability Calculator website</strong> by 
            CalculatorHub, it’s trusted by thousands of users worldwide for its 
            smooth experience and reliability. Whether you’re comparing mortgage options 
            or checking affordability for personal or small business loans, this 
            <strong>premium Loan Affordability Calculator</strong> provides all the answers 
            you need.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ⚖️ Loan Affordability Calculator Comparison & Alternatives
          </h2>
          <p>
            When comparing tools, the <strong>Loan Affordability Calculator comparison</strong> 
            clearly highlights CalculatorHub’s edge — it’s accurate, fast, and completely free.  
            Some <strong>Loan Affordability Calculator alternatives</strong> offer 
            basic functionality, but few include real-time affordability insights 
            and detailed DTI breakdowns like this <strong>advanced Loan Affordability Calculator</strong>.  
            That’s why many consider it the <strong>best Loan Affordability Calculator</strong> 
            available online today.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            💰 Benefits of Using Loan Affordability Calculator
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Accurately estimates your maximum affordable loan.</li>
            <li>Provides instant results with zero math required.</li>
            <li>Helps identify ways to improve borrowing power.</li>
            <li>Works as both a <strong>simple Loan Affordability Calculator</strong> and 
                an <strong>advanced Loan Affordability Calculator</strong> depending on your needs.</li>
            <li>Completely <strong>free Loan Affordability Calculator</strong> — no registration needed.</li>
            <li>Compatible with any device via the <strong>Loan Affordability Calculator online</strong> platform.</li>
          </ul>
        
          <p>
            These <strong>Loan Affordability Calculator benefits</strong> make it suitable 
            for individuals, consultants, and companies alike. The built-in formula ensures 
            accurate predictions while remaining easy for beginners to interpret.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🏢 Small Business & Professional Use
          </h2>
          <p>
            The <strong>small business Loan Affordability Calculator</strong> helps 
            entrepreneurs assess financing for expansion or equipment purchases.  
            Meanwhile, financial advisors prefer the 
            <strong>professional Loan Affordability Calculator</strong> for quick client 
            assessments, reports, and comparisons. For organizations needing detailed 
            data exports, the <strong>premium Loan Affordability Calculator</strong> offers 
            advanced features like loan summaries, amortization breakdowns, and customizable charts.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📚 Loan Affordability Calculator Tutorial & Learning Guide
          </h2>
          <p>
            The built-in <strong>Loan Affordability Calculator tutorial</strong> on 
            CalculatorHub guides users step-by-step — explaining how to enter data, 
            interpret results, and compare scenarios. It’s perfect for 
            <strong>Loan Affordability Calculator for beginners</strong> as well as 
            those seeking an <strong>advanced Loan Affordability Calculator</strong> 
            for deeper analysis.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧩 Why CalculatorHub’s Loan Affordability Tool is the Best
          </h2>
          <p>
            CalculatorHub delivers the <strong>best Loan Affordability Calculator</strong> 
            by combining professional precision with simplicity. It’s an all-in-one 
            <strong>solution Loan Affordability Calculator</strong> trusted by individuals 
            and businesses worldwide. The <strong>easy Loan Affordability Calculator</strong> 
            layout, free access, and instant analytics make it the preferred 
            <strong>Loan Affordability Calculator website</strong> for 2025 and beyond.
          </p>
        
          {/* ===== FAQ Section ===== */}
          <section id="faq" className="space-y-6 mt-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>
        
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q1: How accurate is the Loan Affordability Calculator?
                </h3>
                <p>
                  This <strong>professional Loan Affordability Calculator</strong> uses 
                  industry-standard DTI formulas for accurate results, helping users 
                  understand real-world affordability estimates.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q2: Is the Loan Affordability Calculator free to use?
                </h3>
                <p>
                  Yes, it’s a 100% <strong>free Loan Affordability Calculator</strong> 
                  with no hidden fees or sign-ups required. It’s also available as an 
                  <strong>online Loan Affordability Calculator</strong> for easy access anywhere.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q3: Can businesses use this calculator?
                </h3>
                <p>
                  Absolutely! The <strong>small business Loan Affordability Calculator</strong> 
                  helps determine loan capacity and repayment comfort for commercial purposes.
                </p>
              </div>
            </div>
          </section>
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

