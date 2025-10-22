
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
            Debt-to-Income Ratio Calculator 2025 – Measure Your Financial Strength
          </h1>
        
          <p>
            The <strong>Debt-to-Income Ratio Calculator by CalculatorHub</strong> is an
            <strong> affordable Debt-to-Income Ratio Calculator</strong> that helps
            individuals, professionals, and small businesses evaluate financial health before
            applying for loans. By entering monthly income and total debt payments, this
            <strong> simple Debt-to-Income Ratio Calculator</strong> instantly shows your
            debt-to-income percentage (DTI), giving you clear insight into your borrowing
            potential.
          </p>
        
          <p>
            Whether someone is exploring mortgage options, managing credit cards, or
            analyzing small business finances, this
            <strong> professional Debt-to-Income Ratio Calculator</strong> is designed to
            simplify complex numbers. It’s a <strong>free Debt-to-Income Ratio Calculator</strong>
            that’s accessible online anytime, offering powerful insights and practical
            financial clarity.
          </p>
        
          <figure className="my-8">
            <img
              src="/images/debt-to-income-calculator-hero.webp"
              alt="Debt-to-Income Ratio Calculator online dashboard"
              title="Debt-to-Income Ratio Calculator 2025 | CalculatorHub Finance Tools"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Visualization of the advanced Debt-to-Income Ratio Calculator dashboard with
              real-time insights.
            </figcaption>
          </figure>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            💡 What is a Debt-to-Income Ratio Calculator?
          </h2>
          <p>
            People often ask, <strong>what is a Debt-to-Income Ratio Calculator?</strong>
            It’s a smart <strong>solution Debt-to-Income Ratio Calculator</strong> that
            determines how much of your monthly income goes toward repaying debts. The
            <strong> Debt-to-Income Ratio Calculator explained</strong>: it divides your
            total debt payments by your gross monthly income and multiplies by 100 to get
            your DTI percentage. A lower DTI indicates stronger financial stability, while
            a higher DTI signals that your income may be stretched too thin.
          </p>
        
          <p>
            This <strong>Debt-to-Income Ratio Calculator for beginners</strong> is designed
            to make financial analysis easy and accurate. From individuals planning personal
            budgets to advisors assisting clients, this
            <strong> advanced Debt-to-Income Ratio Calculator</strong> simplifies the
            process, ensuring you always stay informed about your financial position.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧮 How to Use Debt-to-Income Ratio Calculator
          </h2>
          <p>
            Learning <strong>how to use Debt-to-Income Ratio Calculator</strong> is quick and
            easy. Follow these simple steps:
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter your <strong>gross monthly income</strong> before taxes.</li>
            <li>Input your <strong>total monthly debt payments</strong>, including credit
                cards, car loans, student loans, and mortgages.</li>
            <li>Click “Calculate” to instantly get your <strong>DTI percentage</strong>.</li>
            <li>Review your results and compare them with financial standards to see if you
                qualify for new loans.</li>
          </ol>
        
          <p>
            This <strong>easy Debt-to-Income Ratio Calculator</strong> provides results in
            seconds and offers professional-grade accuracy. Even non-financial users find
            this <strong>Debt-to-Income Ratio Calculator online</strong> intuitive, making
            it a top choice for both beginners and experts.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📘 Example of Debt-to-Income Ratio Calculation
          </h2>
          <p>
            Suppose your monthly income is <strong>$5,000</strong> and your total monthly
            debts are <strong>$1,500</strong>. The formula is simple:
          </p>
          <p className="font-mono text-center text-indigo-300">
            DTI (%) = (1,500 ÷ 5,000) × 100 = 30%
          </p>
          <p>
            A <strong>30% DTI</strong> means that 30% of your income is used for debt
            repayment — a range considered healthy by most lenders. The
            <strong> professional Debt-to-Income Ratio Calculator</strong> automatically
            labels your result as “Good” and suggests ways to improve it further.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ⚖️ Debt-to-Income Ratio Calculator Benefits
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Instantly shows your debt-to-income ratio and loan readiness.</li>
            <li>Helps identify if you qualify for mortgages, credit cards, or personal loans.</li>
            <li>Completely <strong>free Debt-to-Income Ratio Calculator</strong> — no signup required.</li>
            <li>Accurate and reliable results using real-time calculations.</li>
            <li>Ideal for professionals and <strong>small business Debt-to-Income Ratio Calculator</strong> users.</li>
          </ul>
        
          <p>
            These <strong>Debt-to-Income Ratio Calculator benefits</strong> help users make
            informed financial decisions without complex spreadsheets or guesswork.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🌐 Debt-to-Income Ratio Calculator Online
          </h2>
          <p>
            The <strong>Debt-to-Income Ratio Calculator online</strong> works on any device —
            desktop, tablet, or smartphone. Hosted on the official
            <strong> Debt-to-Income Ratio Calculator website</strong> by CalculatorHub, it
            offers smooth navigation, detailed insights, and exportable results. Users can
            compare loan scenarios, evaluate repayment options, and save results with ease.
          </p>
        
          <p>
            For businesses, this <strong>service Debt-to-Income Ratio Calculator</strong>
            helps assess financial capacity and lending potential, while individuals can use
            the same tool for planning household budgets. It’s truly a
            <strong> premium Debt-to-Income Ratio Calculator</strong> that serves every
            purpose effortlessly.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            💡 Debt-to-Income Ratio Calculator Tips
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Keep your DTI below <strong>36%</strong> to qualify for most loans.</li>
            <li>Pay off high-interest credit cards first to lower total debt load.</li>
            <li>Increase income through part-time work or bonuses to improve your ratio.</li>
            <li>Review your finances monthly using this <strong>advanced Debt-to-Income Ratio Calculator</strong>.</li>
          </ul>
        
          <p>
            Following these <strong>Debt-to-Income Ratio Calculator tips</strong> can help
            users improve their credit profile and prepare for bigger financial goals.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🏢 Professional & Small Business Applications
          </h2>
          <p>
            The <strong>professional Debt-to-Income Ratio Calculator</strong> isn’t just for
            individuals — it’s also valuable for consultants and business owners. A
            <strong> small business Debt-to-Income Ratio Calculator</strong> helps evaluate
            debt levels compared to income, giving entrepreneurs clarity on expansion
            potential or funding readiness.
          </p>
        
          <p>
            Whether you’re managing company loans or personal credit lines, this
            <strong> solution Debt-to-Income Ratio Calculator</strong> ensures informed
            decision-making for every financial situation.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📊 Debt-to-Income Ratio Calculator Comparison
          </h2>
          <p>
            In a <strong>Debt-to-Income Ratio Calculator comparison</strong>, CalculatorHub
            stands out as one of the most accurate and user-friendly tools. Unlike other
            calculators, it provides automatic results, visual indicators, and categorized
            feedback — making it the <strong>best Debt-to-Income Ratio Calculator</strong>
            available online.
          </p>
        
          <p>
            Other sites may offer basic calculations, but this
            <strong> advanced Debt-to-Income Ratio Calculator</strong> combines simplicity
            with precision, making it a true all-in-one financial planning solution.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ✅ Why Choose CalculatorHub’s DTI Tool
          </h2>
          <p>
            CalculatorHub’s <strong>easy Debt-to-Income Ratio Calculator</strong> is trusted
            for its clean design, accurate results, and free accessibility. As a
            <strong> premium Debt-to-Income Ratio Calculator</strong>, it provides deep
            insights while remaining simple for beginners to use.
          </p>
        
          <p>
            It’s not just a calculator — it’s a full-fledged financial companion that helps
            people plan smarter, borrow responsibly, and achieve lasting stability.
          </p>
        
          {/* ===== FAQ Section ===== */}
          <section id="faq" className="space-y-6 mt-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>
        
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q1: What is a good DTI ratio for loan approval?
                </h3>
                <p>
                  Most lenders prefer DTI under <strong>36%</strong>. A DTI below <strong>30%</strong>
                  is considered excellent. This <strong>affordable Debt-to-Income Ratio Calculator</strong>
                  helps you identify where you stand.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q2: Is the Debt-to-Income Ratio Calculator free to use?
                </h3>
                <p>
                  Yes, it’s a completely <strong>free Debt-to-Income Ratio Calculator</strong>
                  available online. Users can calculate DTI anytime without registration or
                  fees.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q3: Can this calculator be used for businesses?
                </h3>
                <p>
                  Absolutely. The <strong>small business Debt-to-Income Ratio Calculator</strong>
                  and <strong>professional Debt-to-Income Ratio Calculator</strong> options
                  support business loan analysis and commercial credit assessments.
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
