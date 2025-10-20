// ================= LoanComparisonCalculator.tsx (Part 1/2) =================
import React, { useState, useEffect, useMemo } from "react";
import {
  Scale,
  RotateCcw,
  Copy,
  Share2,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";


import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import AdBanner from "../components/AdBanner";
import RelatedCalculators from "../components/RelatedCalculators";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

const LS_KEY = "loan_comparison_calculator_v1";
const COLORS = ["#3b82f6", "#22c55e"];

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
   ⚙️ COMPONENT
   ============================================================ */
const LoanComparisonCalculator: React.FC = () => {
  // Inputs for Loan A
  const [loanA, setLoanA] = useState({
    amount: 0,
    rate: 0,
    years: 0,
    months: 0,
  });

  // Inputs for Loan B
  const [loanB, setLoanB] = useState({
    amount: 0,
    rate: 0,
    years: 0,
    months: 0,
  });

  const [currency, setCurrency] = useState("USD");
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");

  const currentLocale = findLocale(currency);

  /* ============================================================
     🔁 PERSISTENCE
     ============================================================ */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setLoanA(s.loanA || { amount: 0, rate: 0, years: 0, months: 0 });
        setLoanB(s.loanB || { amount: 0, rate: 0, years: 0, months: 0 });
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
      localStorage.setItem(LS_KEY, JSON.stringify({ loanA, loanB, currency }));
    } catch {
      console.warn("⚠️ Could not save state");
    }
  }, [hydrated, loanA, loanB, currency]);

  /* ============================================================
     🧮 CALCULATION LOGIC
     ============================================================ */
  const calcEMI = (amount: number, rate: number, years: number, months: number) => {
    const totalMonths = years * 12 + months;
    if (amount <= 0 || totalMonths <= 0 || rate < 0) return { emi: 0, total: 0, interest: 0 };
    if (rate === 0) {
      const emi = amount / totalMonths;
      return { emi, total: emi * totalMonths, interest: 0 };
    }
    const monthlyRate = rate / 12 / 100;
    const pow = Math.pow(1 + monthlyRate, totalMonths);
    const emi = (amount * monthlyRate * pow) / (pow - 1);
    const total = emi * totalMonths;
    const interest = total - amount;
    return { emi, total, interest };
  };

  const resultA = useMemo(
    () => calcEMI(loanA.amount, loanA.rate, loanA.years, loanA.months),
    [loanA]
  );
  const resultB = useMemo(
    () => calcEMI(loanB.amount, loanB.rate, loanB.years, loanB.months),
    [loanB]
  );

  /* ============================================================
     🔗 COPY / SHARE / RESET
     ============================================================ */
  const reset = () => {
    setLoanA({ amount: 0, rate: 0, years: 0, months: 0 });
    setLoanB({ amount: 0, rate: 0, years: 0, months: 0 });
    setCurrency("USD");
    localStorage.removeItem(LS_KEY);
  };

  const copyResults = async () => {
    const text = [
      "Loan Comparison Summary",
      `Loan A: EMI ${formatCurrency(resultA.emi, currentLocale, currency)} | Total Interest ${formatCurrency(resultA.interest, currentLocale, currency)}`,
      `Loan B: EMI ${formatCurrency(resultB.emi, currentLocale, currency)} | Total Interest ${formatCurrency(resultB.interest, currentLocale, currency)}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const encoded = btoa(JSON.stringify({ loanA, loanB, currency }));
    const url = new URL(window.location.href);
    url.searchParams.set("lc", encoded);
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
        title="Loan Comparison Calculator | CalculatorHub"
        description="Compare two loan offers side by side — see monthly EMIs, total interest, and overall payments with CalculatorHub’s Loan Comparison Tool."
        canonical="https://calculatorhub.site/loan-comparison-calculator"
        schemaData={generateCalculatorSchema(
          "Loan Comparison Calculator",
          "Compare two loan options based on EMI, interest, and total cost. Choose the best loan for your finances.",
          "/loan-comparison-calculator",
          ["loan comparison", "EMI difference", "interest rate comparison"]
        )}
      />

      <div className="max-w-6xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "Loan Comparison Calculator", url: "/loan-comparison-calculator" },
          ]}
        />

        {/* ===== Header ===== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            ⚖️ Loan Comparison Calculator
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Compare two different loan options side by side. Find which one has lower EMI, total payment, or interest — and make smarter borrowing decisions.
          </p>
        </div>

        {/* ===== Currency & Reset ===== */}
        <div className="flex justify-between items-center mb-5">
          <div>
            <label className="text-sm text-slate-300 mr-2">Currency:</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-[#0f172a] text-white text-sm px-3 py-1 border border-[#334155] rounded-md focus:ring-2 focus:ring-indigo-500"
            >
              {currencyOptions.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1 text-sm text-slate-300 border border-[#334155] rounded-lg px-2 py-1 hover:bg-[#0f172a] hover:text-white transition"
          >
            <RotateCcw className="h-4 w-4 text-indigo-400" /> Reset
          </button>
        </div>

        {/* ===== Comparison Grid ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[{ label: "Loan A", data: loanA, setData: setLoanA, result: resultA },
            { label: "Loan B", data: loanB, setData: setLoanB, result: resultB }].map((loan, idx) => (
            <div key={idx} className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Scale className="h-5 w-5 text-sky-400" /> {loan.label}
              </h2>

              <div className="space-y-4">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Loan Amount ({findSymbol(currency)})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={loan.data.amount || ""}
                    onChange={(e) => loan.setData({ ...loan.data, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Interest */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={loan.data.rate || ""}
                    onChange={(e) => loan.setData({ ...loan.data, rate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Term */}
                <div className="flex gap-4">
                  <input
                    type="number"
                    placeholder="Years"
                    min={0}
                    value={loan.data.years || ""}
                    onChange={(e) => loan.setData({ ...loan.data, years: parseInt(e.target.value) || 0 })}
                    className="w-1/2 bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    placeholder="Months"
                    min={0}
                    value={loan.data.months || ""}
                    onChange={(e) => loan.setData({ ...loan.data, months: parseInt(e.target.value) || 0 })}
                    className="w-1/2 bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Results */}
                <div className="mt-4 bg-[#0f172a] border border-[#334155] rounded-lg p-4 text-center">
                  <p className="text-sm text-slate-400">Monthly EMI</p>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(loan.result.emi, currentLocale, currency)}
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                    <div>
                      <p className="text-slate-400">Total Payment</p>
                      <p className="text-white font-medium">
                        {formatCurrency(loan.result.total, currentLocale, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Total Interest</p>
                      <p className="text-white font-medium">
                        {formatCurrency(loan.result.interest, currentLocale, currency)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ===== Copy/Share Buttons ===== */}
        <div className="mt-6 flex flex-wrap gap-3">
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

{/* ===== Chart Section ===== */}
{(resultA.total > 0 || resultB.total > 0) && (
  <div className="mt-8 bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
    <h3 className="text-lg font-semibold text-white mb-6 text-center">
      Loan Cost Comparison
    </h3>
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={[
            {
              name: "Loan A",
              EMI: resultA.emi,
              TotalInterest: resultA.interest,
              TotalPayment: resultA.total,
            },
            {
              name: "Loan B",
              EMI: resultB.emi,
              TotalInterest: resultB.interest,
              TotalPayment: resultB.total,
            },
          ]}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis
            tickFormatter={(v) =>
              `${findSymbol(currency)}${(v / 1000).toFixed(0)}k`
            }
            stroke="#94a3b8"
          />
          <ReTooltip
            formatter={(v: any) =>
              formatCurrency(Number(v), currentLocale, currency)
            }
          />
          <Legend />
          <Bar dataKey="EMI" fill="#3b82f6" />
          <Bar dataKey="TotalInterest" fill="#22c55e" />
          <Bar dataKey="TotalPayment" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
    <p className="mt-4 text-center text-sm text-slate-400">
      💡 Compare EMIs, total interest, and total payments between both loans to
      identify the most cost-effective option.
    </p>
  </div>
)}

{/* ===== Smart Insight ===== */}
{resultA.total > 0 && resultB.total > 0 && (
  <div className="mt-5 bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm">
    {resultA.total < resultB.total ? (
      <p className="text-base font-medium text-emerald-400">
        ✅ Loan A is cheaper overall by{" "}
        {formatCurrency(resultB.total - resultA.total, currentLocale, currency)} 
        compared to Loan B.
      </p>
    ) : resultB.total < resultA.total ? (
      <p className="text-base font-medium text-emerald-400">
        ✅ Loan B saves you{" "}
        {formatCurrency(resultA.total - resultB.total, currentLocale, currency)} 
        in total payments versus Loan A.
      </p>
    ) : (
      <p className="text-base font-medium text-slate-300">
        Both loans have identical total costs — check other factors like fees or
        flexibility.
      </p>
    )}
  </div>
)}

{/* ===== SEO CONTENT ===== */}
<section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
  <h1 className="text-3xl font-bold text-cyan-400 mb-6">
    Loan Comparison Calculator 2025 – Find Your Best Loan
  </h1>

  <p>
    Use the <strong>Loan Comparison Calculator by CalculatorHub</strong> to
    evaluate two loan offers side by side. Quickly see differences in EMI,
    total interest, and total repayment amounts.
  </p>

  <figure className="my-8">
    <img
      src="/images/loan-comparison-calculator-hero.webp"
      alt="Loan comparison dashboard with EMI chart"
      title="Loan Comparison Calculator | Compare EMI and Interest"
      className="rounded-lg shadow-md border border-slate-700 mx-auto"
      loading="lazy"
    />
    <figcaption className="text-center text-sm text-slate-400 mt-2">
      Example dashboard comparing two loans with different rates and terms.
    </figcaption>
  </figure>

  <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
    🧮 How Loan Comparison Works
  </h2>
  <p className="font-mono text-center text-indigo-300">
    EMI = P × r × (1 + r)<sup>n</sup> ⁄ ((1 + r)<sup>n</sup> − 1)
  </p>
  <p>
    Where P = Loan Amount, r = Monthly Interest Rate, n = Total Months.  
    Each loan’s EMI and total interest are computed using this formula.
  </p>

  <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
    📘 Example
  </h2>
  <p>
    Loan A: $100 000 @ 8 % for 15 years → EMI ≈ $955, Total Interest $71 000  
    Loan B: $100 000 @ 7.5 % for 15 years → EMI ≈ $927, Total Interest $66 800.  
    ✅ Loan B saves $4 200 overall.
  </p>

  <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
    💡 Why Use This Calculator
  </h2>
  <ul className="list-disc list-inside space-y-2">
    <li>Instantly compare EMIs and interest for two loan offers.</li>
    <li>Understand how rate and term affect total repayment.</li>
    <li>Make informed borrowing decisions with clear visual data.</li>
  </ul>

  {/* ===== FAQ Section ===== */}
  <section id="faq" className="space-y-6 mt-16">
    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
      ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
    </h2>

    <div className="space-y-5 text-lg text-slate-100 leading-relaxed">
      <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
        <h3 className="font-semibold text-xl mb-2 text-yellow-300">
          Q1: What’s the best way to compare loans?
        </h3>
        <p>
          Look at EMI, total interest, and overall repayment. A lower rate and
          shorter term usually reduce total cost.
        </p>
      </div>

      <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
        <h3 className="font-semibold text-xl mb-2 text-yellow-300">
          Q2: Should I pick a lower EMI or shorter loan term?
        </h3>
        <p>
          Lower EMI means easier monthly cash flow, but a shorter term saves
          more on interest overall.
        </p>
      </div>

      <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
        <h3 className="font-semibold text-xl mb-2 text-yellow-300">
          Q3: Do fees affect comparison?
        </h3>
        <p>
          Yes — include processing or pre-payment fees to get a true cost
          comparison between loans.
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
      alt="CalculatorHub Team"
      className="w-12 h-12 rounded-full border border-gray-600"
      loading="lazy"
    />
    <div>
      <p className="font-semibold text-white">
        Written by the CalculatorHub Finance Analytics Team
      </p>
      <p className="text-sm text-slate-400">
        Verified for accuracy & clarity. Last updated: 
        <time dateTime="2025-10-20">October 20, 2025</time>.
      </p>
    </div>
  </div>

  <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
    <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
      🚀 Explore more loan tools on CalculatorHub:
    </p>
    <div className="flex flex-wrap gap-3 text-sm">
      <a
        href="/mortgage-calculator"
        className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-400 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all"
      >
        🏠 Mortgage Calculator
      </a>
      <a
        href="/loan-affordability-calculator"
        className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all"
      >
        💵 Loan Affordability
      </a>
      <a
        href="/roi-calculator"
        className="flex items-center gap-2 bg-[#0f172a] hover:bg-fuchsia-600/20 text-fuchsia-300 hover:text-fuchsia-400 px-3 py-2 rounded-md border border-slate-700 hover:border-fuchsia-500 transition-all"
      >
        📈 ROI Calculator
      </a>
    </div>
  </div>
</section>

<AdBanner type="bottom" />
<RelatedCalculators
  currentPath="/loan-comparison-calculator"
  category="Currency & Finance"
/>
</div>
</>
);
};

export default LoanComparisonCalculator;
