 // ================= BreakEvenCalculator.tsx =================
import React, { useState, useEffect } from "react";
import {
  BarChart2,
  RotateCcw,
  Copy,
  Share2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import AdBanner from "../components/AdBanner";
import RelatedCalculators from "../components/RelatedCalculators";
import { generateCalculatorSchema } from "../utils/seoData";

/* ============================================================
   ⚙️ CONSTANTS & HELPERS
   ============================================================ */
const LS_KEY = "break_even_calculator_v1";

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
   📊 CHART COMPONENT
   ============================================================ */
const BreakEvenChart: React.FC<{
  sellingPrice: number;
  variableCost: number;
  fixedCost: number;
  breakEvenUnits: number;
  currency: string;
  locale: string;
}> = ({ sellingPrice, variableCost, fixedCost, breakEvenUnits, currency, locale }) => {
  const data: any[] = [];
  const maxUnits = Math.ceil(breakEvenUnits * 2 || 10);

  for (let x = 0; x <= maxUnits; x++) {
    data.push({
      units: x,
      revenue: sellingPrice * x,
      cost: fixedCost + variableCost * x,
    });
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
        <XAxis dataKey="units" stroke="#94a3b8" />
        <YAxis
          tickFormatter={(v) => `${findSymbol(currency)}${(v / 1000).toFixed(0)}k`}
          stroke="#94a3b8"
        />
        <ReTooltip
          formatter={(v: any) => formatCurrency(Number(v), locale, currency)}
        />
        <Legend />
        <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
        <Line type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
};

/* ============================================================
   🧮 MAIN COMPONENT
   ============================================================ */
const BreakEvenCalculator: React.FC = () => {
  // Inputs
  const [fixedCost, setFixedCost] = useState<number>(0);
  const [variableCost, setVariableCost] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("USD");

  // Outputs
  const [breakEvenUnits, setBreakEvenUnits] = useState<number>(0);
  const [breakEvenRevenue, setBreakEvenRevenue] = useState<number>(0);
  const [profitPerUnit, setProfitPerUnit] = useState<number>(0);

  // UI
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [hydrated, setHydrated] = useState(false);

  const currentLocale = findLocale(currency);
  const isDefault = !fixedCost && !variableCost && !sellingPrice;

  /* ============================================================
     🔁 PERSISTENCE
     ============================================================ */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setFixedCost(s.fixedCost || 0);
        setVariableCost(s.variableCost || 0);
        setSellingPrice(s.sellingPrice || 0);
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
        JSON.stringify({ fixedCost, variableCost, sellingPrice, currency })
      );
    } catch {
      console.warn("⚠️ Could not save state");
    }
  }, [hydrated, fixedCost, variableCost, sellingPrice, currency]);

  /* ============================================================
     🧮 CALCULATION
     ============================================================ */
  useEffect(() => {
    if (sellingPrice <= variableCost || sellingPrice <= 0 || variableCost < 0) {
      setBreakEvenUnits(0);
      setBreakEvenRevenue(0);
      setProfitPerUnit(0);
      return;
    }
    const profit = sellingPrice - variableCost;
    const units = fixedCost / profit;
    const revenue = units * sellingPrice;

    setProfitPerUnit(profit);
    setBreakEvenUnits(units);
    setBreakEvenRevenue(revenue);
  }, [fixedCost, variableCost, sellingPrice]);

  /* ============================================================
     🔗 COPY / SHARE / RESET
     ============================================================ */
  const reset = () => {
    setFixedCost(0);
    setVariableCost(0);
    setSellingPrice(0);
    setCurrency("USD");
    localStorage.removeItem(LS_KEY);
  };

  const copyResults = async () => {
    const text = [
      "Break-Even Analysis Summary",
      `Fixed Cost: ${formatCurrency(fixedCost, currentLocale, currency)}`,
      `Variable Cost per Unit: ${formatCurrency(variableCost, currentLocale, currency)}`,
      `Selling Price per Unit: ${formatCurrency(sellingPrice, currentLocale, currency)}`,
      `Profit per Unit: ${formatCurrency(profitPerUnit, currentLocale, currency)}`,
      `Break-Even Units: ${breakEvenUnits.toFixed(2)}`,
      `Break-Even Revenue: ${formatCurrency(breakEvenRevenue, currentLocale, currency)}`,
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const encoded = btoa(JSON.stringify({ fixedCost, variableCost, sellingPrice, currency }));
    const url = new URL(window.location.href);
    url.searchParams.set("bep", encoded);
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
        title="Break-Even Point Calculator | CalculatorHub"
        description="Calculate your business break-even point in units and revenue. Find out when your sales will start generating profit."
        canonical="https://calculatorhub.site/break-even-calculator"
        schemaData={generateCalculatorSchema(
          "Break-Even Point Calculator",
          "Find the sales level where total revenue equals total cost with CalculatorHub’s Break-Even Calculator.",
          "/break-even-calculator",
          ["break-even calculator", "cost revenue analysis", "business profitability tool"]
        )}
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "Break-Even Calculator", url: "/break-even-calculator" },
          ]}
        />

        {/* ===== Header ===== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            📊 Break-Even Point Calculator
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Determine the sales volume or revenue required for your business to cover costs and start earning profit.
          </p>
        </div>

        {/* ===== Input + Output ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-emerald-400" /> Business Costs
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

              {/* Fixed Costs */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">
                  Fixed Costs ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={fixedCost || ""}
                  onChange={(e) => setFixedCost(parseFloat(e.target.value) || 0)}
                  placeholder="Enter total fixed costs"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Variable Cost */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">
                  Variable Cost per Unit ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={variableCost || ""}
                  onChange={(e) => setVariableCost(parseFloat(e.target.value) || 0)}
                  placeholder="Enter variable cost per unit"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Selling Price */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">
                  Selling Price per Unit ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={sellingPrice || ""}
                  onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                  placeholder="Enter selling price per unit"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">Break-Even Summary</h2>
            <div className="space-y-6">
              <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                <div className="text-3xl font-bold text-white">
                  {breakEvenUnits.toFixed(2)}
                </div>
                <div className="text-sm text-slate-400">Units to Break Even</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(breakEvenRevenue, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Break-Even Revenue</div>
                </div>
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(profitPerUnit, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Profit per Unit</div>
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

        {/* Chart + Tip */}
        {breakEvenUnits > 0 && (
          <div className="mt-8 bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              Cost vs Revenue Analysis
            </h3>
            <BreakEvenChart
              sellingPrice={sellingPrice}
              variableCost={variableCost}
              fixedCost={fixedCost}
              breakEvenUnits={breakEvenUnits}
              currency={currency}
              locale={currentLocale}
            />
            <p className="mt-4 text-center text-sm text-slate-400">
              💡 The intersection of red and blue lines shows your break-even point —
              where total cost equals total revenue.
            </p>
          </div>
        )}

        {/*------ seo content ------------*/}

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
            EMI near <strong>$1,200</strong>.&nbsp;
            This demonstrates how powerful and practical this
            <strong> professional Loan Affordability Calculator</strong> can be for
            planning real-world budgets.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🌐 Loan Affordability Calculator Online
          </h2>
          <p>
            The <strong>Loan Affordability Calculator online</strong> works directly
            in your browser — no downloads required. It’s optimized for speed and accuracy,
            giving results instantly while preserving user privacy.&nbsp;
            Hosted on the <strong>Loan Affordability Calculator website</strong> by
            CalculatorHub, it’s trusted by thousands of users worldwide for its
            smooth experience and reliability. Whether you’re comparing mortgage options
            or checking affordability for personal or small business loans, this
            <strong> premium Loan Affordability Calculator</strong> provides all the answers
            you need.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ⚖️ Loan Affordability Calculator Comparison & Alternatives
          </h2>
          <p>
            When comparing tools, the <strong>Loan Affordability Calculator comparison</strong>
            clearly highlights CalculatorHub’s edge — it’s accurate, fast, and completely free.&nbsp;
            Some <strong>Loan Affordability Calculator alternatives</strong> offer
            basic functionality, but few include real-time affordability insights
            and detailed DTI breakdowns like this <strong>advanced Loan Affordability Calculator</strong>.&nbsp;
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
            <li>
              Works as both a <strong>simple Loan Affordability Calculator</strong> and
              an <strong>advanced Loan Affordability Calculator</strong> depending on your needs.
            </li>
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
            entrepreneurs assess financing for expansion or equipment purchases.&nbsp;
            Meanwhile, financial advisors prefer the
            <strong> professional Loan Affordability Calculator</strong> for quick client
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
            <strong> Loan Affordability Calculator for beginners</strong> as well as
            those seeking an <strong>advanced Loan Affordability Calculator</strong>
            for deeper analysis.
          </p>
        
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧩 Why CalculatorHub’s Loan Affordability Tool is the Best
          </h2>
          <p>
            CalculatorHub delivers the <strong>best Loan Affordability Calculator</strong>
            by combining professional precision with simplicity. It’s an all-in-one
            <strong> solution Loan Affordability Calculator</strong> trusted by individuals
            and businesses worldwide. The <strong>easy Loan Affordability Calculator</strong>
            layout, free access, and instant analytics make it the preferred
            <strong> Loan Affordability Calculator website</strong> for 2025 and beyond.
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
                  <strong> online Loan Affordability Calculator</strong> for easy access anywhere.
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
          currentPath="/break-even-calculator"
          category="Currency & finance"
        />
      </div>
    </>
  );
};

export default BreakEvenCalculator;
