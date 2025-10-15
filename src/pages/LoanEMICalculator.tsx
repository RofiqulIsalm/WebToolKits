/* LoanEMICalculator_Full.tsx
   Ultra-fast version with:
   - Reset button (clears Principal, Rate, Tenure)
   - LocalStorage (remembers Mode + Currency)
   - Cyan styled checkboxes for Charts & Schedule
   - Minimal deps, instant load (<1s)
*/
import React, { useState, useMemo, useEffect } from "react";

type Mode = "basic" | "advanced";
type Currency = "$" | "₹" | "€" | "£";

function calcEMI(p: number, r: number, n: number) {
  if (n <= 0) return 0;
  if (r === 0) return p / n;
  const a = Math.pow(1 + r, n);
  return (p * r * a) / (a - 1);
}
function fmt(num: number) {
  if (!isFinite(num)) return "0";
  const abs = Math.abs(num);
  if (abs >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (abs >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toFixed(2);
}

const LoanEMICalculator_Full: React.FC = () => {
  const savedMode = typeof window !== "undefined" ? localStorage.getItem("loan_mode") : null;
  const savedCurrency = typeof window !== "undefined" ? localStorage.getItem("loan_currency") : null;

  const autoCurrency: Currency = useMemo(() => {
    try {
      const locale = Intl.NumberFormat().resolvedOptions().locale || "";
      if (locale.startsWith("en-IN")) return "₹";
      if (locale.startsWith("en-GB")) return "£";
      if (locale.includes("de") || locale.includes("fr")) return "€";
      return "$";
    } catch {
      return "$";
    }
  }, []);

  const [mode, setMode] = useState<Mode>((savedMode as Mode) || "basic");
  const [currency, setCurrency] = useState<Currency>((savedCurrency as Currency) || autoCurrency);
  const [principal, setPrincipal] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [months, setMonths] = useState<number>(0);
  const [showCharts, setShowCharts] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("loan_mode", mode);
  }, [mode]);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("loan_currency", currency);
  }, [currency]);

  const rateMonthly = rate / 100 / 12;
  const emi = useMemo(() => calcEMI(principal, rateMonthly, months), [principal, rateMonthly, months]);
  const totalAmount = emi * months;
  const totalInterest = totalAmount - principal;

  const resetInputs = () => {
    setPrincipal(0);
    setRate(0);
    setMonths(0);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 text-white">
      <h1 className="text-3xl font-bold mb-4 text-cyan-400">Loan EMI Calculator</h1>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setMode(mode === "basic" ? "advanced" : "basic")}
          className={\`relative inline-flex items-center w-28 h-10 rounded-full border border-slate-700 shadow-md transition-all duration-300
            \${mode === "advanced" ? "bg-cyan-600" : "bg-slate-800"}\`}
        >
          <span
            className={\`absolute left-1 w-8 h-8 bg-white rounded-full shadow-md transform transition-transform duration-300
              \${mode === "advanced" ? "translate-x-[4.5rem]" : "translate-x-0"}\`}
          ></span>
          <span className={\`text-xs font-semibold w-full text-center transition-colors duration-300
            \${mode === "advanced" ? "text-white" : "text-slate-300"}\`}>
            {mode === "advanced" ? "Advanced" : "Basic"}
          </span>
        </button>
        <span className="text-slate-400 text-sm">
          {mode === "advanced" ? "Advanced Mode active" : "Basic Mode active"}
        </span>
      </div>

      <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-5 mb-6">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-cyan-300">Loan Details</h2>
          <div className="flex items-center gap-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg hover:border-cyan-500 focus:ring-2 focus:ring-cyan-500 transition"
            >
              <option>$</option><option>₹</option><option>€</option><option>£</option>
            </select>
            <button
              onClick={resetInputs}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm hover:bg-slate-700 transition"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Principal Amount</label>
            <input
              type="number"
              min={0}
              value={principal || ""}
              onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
              placeholder="Enter loan amount"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Interest Rate (% per annum)</label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={rate || ""}
              onChange={(e) => setRate(Math.max(0, Number(e.target.value)))}
              placeholder="Enter interest rate"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Tenure (months)</label>
            <input
              type="number"
              min={0}
              value={months || ""}
              onChange={(e) => setMonths(Math.max(0, Number(e.target.value)))}
              placeholder="Enter tenure in months"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-5 mb-6">
        <h2 className="text-lg font-semibold text-cyan-300 mb-4">Results</h2>
        <div className="space-y-3 text-center">
          <div className="text-2xl font-bold text-cyan-400">{currency}{emi.toFixed(2)}</div>
          <div className="text-slate-400 text-sm">Monthly EMI</div>
          <div className="flex justify-around mt-3 text-sm">
            <div>
              <div className="text-emerald-400 font-semibold">{currency}{fmt(principal)}</div>
              <div className="text-slate-400">Principal</div>
            </div>
            <div>
              <div className="text-amber-400 font-semibold">{currency}{fmt(totalInterest)}</div>
              <div className="text-slate-400">Total Interest</div>
            </div>
            <div>
              <div className="text-cyan-400 font-semibold">{currency}{fmt(totalAmount)}</div>
              <div className="text-slate-400">Total Payable</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <label className="flex items-center gap-2 text-slate-300 text-sm cursor-pointer group">
          <span
            className={\`relative w-5 h-5 flex items-center justify-center rounded-md border transition-all duration-200
              \${showCharts ? "border-cyan-400 bg-cyan-500/20" : "border-slate-600 bg-slate-800/70 group-hover:border-cyan-500/50"}\`}
          >
            <input
              type="checkbox"
              checked={showCharts}
              onChange={() => setShowCharts(!showCharts)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <svg
              className={\`w-3 h-3 text-cyan-400 transition-opacity duration-150 \${showCharts ? "opacity-100" : "opacity-0"}\`}
              fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          Show Charts
        </label>

        <label className="flex items-center gap-2 text-slate-300 text-sm cursor-pointer group">
          <span
            className={\`relative w-5 h-5 flex items-center justify-center rounded-md border transition-all duration-200
              \${showSchedule ? "border-cyan-400 bg-cyan-500/20" : "border-slate-600 bg-slate-800/70 group-hover:border-cyan-500/50"}\`}
          >
            <input
              type="checkbox"
              checked={showSchedule}
              onChange={() => setShowSchedule(!showSchedule)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <svg
              className={\`w-3 h-3 text-cyan-400 transition-opacity duration-150 \${showSchedule ? "opacity-100" : "opacity-0"}\`}
              fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          Show Schedule
        </label>
      </div>

      {showCharts && <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 mb-4 text-center text-slate-300">Charts section</div>}
      {showSchedule && <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 text-center text-slate-300">Schedule section</div>}
    </div>
  );
};

export default LoanEMICalculator_Full;
