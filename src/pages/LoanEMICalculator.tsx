import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  PiggyBank,
  RotateCcw,
  SlidersHorizontal,
  Share2,
  Printer,
  Download,
  ArrowLeftRight,
  BarChart3,
  Calculator,
  PieChart as PieChartIcon,
} from "lucide-react";
import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import { seoData, generateCalculatorSchema } from "../utils/seoData";
import RelatedCalculators from "../components/RelatedCalculators";

// --------------- Utilities --------------------
type Currency = "$" | "₹" | "€" | "£";
type Mode = "basic" | "advanced";
type RateMode = "per_month" | "per_annum";
type SolveMode = "by_tenure" | "by_emi";

function fmt(num: number) {
  if (isNaN(num)) return "0.00";
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toFixed(2);
}

function calcEMI(P: number, r: number, n: number) {
  if (n <= 0) return 0;
  if (r === 0) return P / n;
  const f = Math.pow(1 + r, n);
  return (P * r * f) / (f - 1);
}

// --------------- Component --------------------

const LoanEMICalculator: React.FC = () => {
  const [currency, setCurrency] = useState<Currency>("$");
  const [mode, setMode] = useState<Mode>("basic");
  const [rateMode] = useState<RateMode>("per_month");
  const [solveMode, setSolveMode] = useState<SolveMode>("by_tenure");

  // defaults 0
  const [principal, setPrincipal] = useState(0);
  const [rateAnnual, setRateAnnual] = useState(0);
  const [tenureMonths, setTenureMonths] = useState(0);
  const [rateError, setRateError] = useState("");
  const [emi, setEmi] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const deferredPrincipal = useDeferredValue(principal);
  const deferredRate = useDeferredValue(rateAnnual);
  const deferredMonths = useDeferredValue(tenureMonths);

  // recalc EMI
  useEffect(() => {
    const r = (rateMode === "per_month" ? rateAnnual : rateAnnual / 12) / 100;
    const v = calcEMI(principal, r, tenureMonths);
    const total = v * tenureMonths;
    setEmi(v);
    setTotalAmount(total);
    setTotalInterest(total - principal);
  }, [principal, rateAnnual, tenureMonths, rateMode]);

  const printResults = useCallback(() => setTimeout(() => window.print(), 0), []);

  const copyShareLink = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }, []);

  return (
    <>
      <SEOHead
        title={seoData.loanEmiCalculator.title}
        description={seoData.loanEmiCalculator.description}
        canonical="https://calculatorhub.site/loan-emi-calculator"
        schemaData={generateCalculatorSchema(
          "Loan EMI Calculator",
          seoData.loanEmiCalculator.description,
          "/loan-emi-calculator",
          seoData.loanEmiCalculator.keywords
        )}
      />
      {copied && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-md border border-slate-600 shadow-lg z-50">
          Copied!
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "Loan EMI Calculator", url: "/loan-emi-calculator" },
          ]}
        />
        <h1 className="text-3xl font-bold text-white mb-2">Loan EMI Calculator</h1>
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setMode("basic")}
            className={`px-4 py-2 rounded-md ${mode === "basic" ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-300"}`}
          >
            Basic
          </button>
          <button
            onClick={() => setMode("advanced")}
            className={`px-4 py-2 rounded-md ${mode === "advanced" ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-300"}`}
          >
            Advanced
          </button>
        </div>

        {/* Basic mode */}
        {mode === "basic" && (
          <div className="rounded-xl bg-slate-900/70 border border-slate-700 p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Loan Amount (Principal)</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={principal}
                onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
                placeholder="Enter loan amount"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-md focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Interest Rate (% per month)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={rateAnnual}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v > 100) {
                    setRateError("Interest per month cannot exceed 100%.");
                    setRateAnnual(100);
                  } else {
                    setRateError("");
                    setRateAnnual(Math.max(0, v));
                  }
                }}
                placeholder="e.g. 1.5"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-md focus:ring-2 focus:ring-cyan-500"
              />
              {rateError && <p className="text-amber-400 text-xs mt-1">{rateError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Loan Tenure (months)</label>
              <input
                type="number"
                min={0}
                value={tenureMonths}
                onChange={(e) => setTenureMonths(Math.max(0, Number(e.target.value)))}
                placeholder="Enter months"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-md focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="text-white font-semibold">
              Monthly EMI: {currency} {fmt(emi)}
            </div>
          </div>
        )}

        {/* Advanced mode */}
        {mode === "advanced" && (
          <div className="rounded-xl bg-slate-900/70 border border-slate-700 p-6 space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <h2 className="text-xl font-semibold text-cyan-300 flex items-center gap-2">
                <Calculator className="w-5 h-5" /> Advanced Controls
              </h2>
              <div className="flex gap-3 flex-wrap">
                <label className="flex items-center gap-2 text-slate-300 text-sm">
                  <input type="checkbox" className="accent-cyan-500" checked={showCharts} onChange={(e) => setShowCharts(e.target.checked)} />
                  Show Charts
                </label>
                <label className="flex items-center gap-2 text-slate-300 text-sm">
                  <input type="checkbox" className="accent-cyan-500" checked={showSchedule} onChange={(e) => setShowSchedule(e.target.checked)} />
                  Show Schedule
                </label>
                <button onClick={copyShareLink} className="px-3 py-2 rounded-md bg-slate-800 text-white hover:bg-slate-700 border border-slate-700">
                  Copy Link
                </button>
                <button onClick={printResults} className="px-3 py-2 rounded-md bg-slate-800 text-white hover:bg-slate-700 border border-slate-700">
                  Print
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Loan Amount</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={deferredPrincipal}
                  onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
                  placeholder="Loan amount"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-md focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Interest Rate (% per month)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={deferredRate}
                  onChange={(e) => setRateAnnual(Math.max(0, Number(e.target.value)))}
                  placeholder="e.g. 1.5"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-md focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tenure (months)</label>
                <input
                  type="number"
                  min={1}
                  value={deferredMonths}
                  onChange={(e) => setTenureMonths(Math.max(1, Number(e.target.value)))}
                  placeholder="Enter months"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-md focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {showCharts && (
              <div className="text-slate-400 text-sm">📊 Charts would appear here (lazy loaded)</div>
            )}
            {showSchedule && (
              <div className="text-slate-400 text-sm">📋 Amortization Schedule table would appear here (lazy loaded)</div>
            )}
          </div>
        )}

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/loan-emi-calculator" category="currency-finance" />
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>
    </>
  );
};

export default LoanEMICalculator;
