import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import Range from '../components/Range';

// Charts
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart as RLineChart,
  Bar,
  BarChart,
  Legend,
} from "recharts";

/**
 * LoanEMICalculator (Basic + Advanced)
 * - Basic Mode: clean inputs, EMI summary, tenure quick buttons (1M, 3M, 12M, Cus)
 * - Advanced Mode: sliders, prepayment, amortization schedule (CSV), charts,
 *   compare loans, share link, print
 */

// ----------------------------- Types & Utils ---------------------------------

type Mode = "basic" | "advanced";

type RateMode = "per_annum" | "per_month";
type SolveMode = "by_tenure" | "by_emi";

type Currency = "$" | "₹" | "€" | "£";

interface PrepaymentSettings {
  oneTimeAmount: number;       // Lump sum
  oneTimeMonth: number;        // Month index (1..N)
  extraMonthly: number;        // Extra every month
  enableOneTime: boolean;
  enableExtraMonthly: boolean;
}

interface RangeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

interface ScheduleRow {
  month: number;
  opening: number;
  interest: number;
  principalPaid: number;
  regularEmi: number;
  extraPayment: number;
  closing: number;
}

interface ComparisonInputs {
  enabled: boolean;
  loanB: {
    rateAnnual: number;
    tenureMonths: number;
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function toQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) q.set(k, String(v));
  });
  return q.toString();
}

function fromQuery(search: string): Record<string, string> {
  const p = new URLSearchParams(search);
  const obj: Record<string, string> = {};
  p.forEach((v, k) => (obj[k] = v));
  return obj;
}

function copyText(text: string) {
  return navigator.clipboard.writeText(text);
}

// ----------------------------- Math Core -------------------------------------

/**
 * EMI for given P, r (monthly decimal), N (months)
 */
function calcEMI(principal: number, monthlyRate: number, months: number): number {
  if (months <= 0) return 0;
  if (monthlyRate === 0) return principal / months;
  const a = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * a) / (a - 1);
}

/**
 * Solve tenure (months) for given P, r (monthly), target EMI, using bisection.
 * Search N in [1, 1200].
 */
function solveTenureForEMI(principal: number, monthlyRate: number, targetEMI: number): number {
  const MIN = 1;
  const MAX = 1200;
  if (targetEMI <= monthlyRate * principal) return MAX;
  let lo = MIN;
  let hi = MAX;
  for (let i = 0; i < 60; i++) {
    const mid = Math.floor((lo + hi) / 2);
    const emiMid = calcEMI(principal, monthlyRate, mid);
    if (emiMid > targetEMI) lo = mid + 1;
    else hi = mid;
  }
  return hi;
}

/**
 * Build amortization schedule with prepayments.
 */
function buildSchedule(
  principal: number,
  rateAnnualPct: number,
  tenureMonths: number,
  baseEMI: number,
  prepay: PrepaymentSettings
): { rows: ScheduleRow[]; totalInterest: number; totalPaid: number; effectiveMonths: number } {
  const rMonthly = rateAnnualPct / 100 / 12;
  let balance = principal;
  let month = 0;
  const rows: ScheduleRow[] = [];
  let sumInterest = 0;
  let sumPaid = 0;

  while (balance > 0 && month < 5000) {
    month += 1;
    const opening = balance;
    const interest = opening * rMonthly;
    let principalComponent = baseEMI - interest;
    if (principalComponent < 0) principalComponent = 0;

    let extra = 0;
    if (prepay.enableExtraMonthly && prepay.extraMonthly > 0) extra += prepay.extraMonthly;
    if (prepay.enableOneTime && prepay.oneTimeAmount > 0 && prepay.oneTimeMonth === month) {
      extra += prepay.oneTimeAmount;
    }

    let totalPaymentThisMonth = principalComponent + interest + extra;
    if (totalPaymentThisMonth > opening + interest) {
      extra = opening - principalComponent;
      if (extra < 0) extra = 0;
      totalPaymentThisMonth = principalComponent + interest + extra;
    }

    const closing = opening + interest - principalComponent - extra;

    rows.push({
      month,
      opening: round2(opening),
      interest: round2(interest),
      principalPaid: round2(principalComponent),
      regularEmi: round2(baseEMI),
      extraPayment: round2(extra),
      closing: round2(Math.max(0, closing)),
    });

    sumInterest += interest;
    sumPaid += principalComponent + interest + extra;
    balance = closing <= 1e-6 ? 0 : closing;
    if (balance <= 0) break;
  }

  return {
    rows,
    totalInterest: round2(sumInterest),
    totalPaid: round2(sumPaid),
    effectiveMonths: rows.length,
  };
}

function groupByYear(rows: ScheduleRow[]) {
  const yearMap: Record<string, { year: number; interest: number; principal: number }> = {};
  rows.forEach((r) => {
    const year = Math.ceil(r.month / 12);
    if (!yearMap[year]) yearMap[year] = { year, interest: 0, principal: 0 };
    yearMap[year].interest += r.interest;
    yearMap[year].principal += r.principalPaid + r.extraPayment;
  });
  return Object.values(yearMap).map((v) => ({
    year: v.year,
    interest: round2(v.interest),
    principal: round2(v.principal),
  }));
}

function scheduleToCSV(rows: ScheduleRow[]): string {
  const headers = [
    "Month",
    "Opening Balance",
    "Interest",
    "Principal Paid",
    "Regular EMI",
    "Extra Payment",
    "Closing Balance",
  ];
  const lines = [headers.join(",")];
  rows.forEach((r) => {
    lines.push(
      [
        r.month,
        r.opening.toFixed(2),
        r.interest.toFixed(2),
        r.principalPaid.toFixed(2),
        r.regularEmi.toFixed(2),
        r.extraPayment.toFixed(2),
        r.closing.toFixed(2),
      ].join(",")
    );
  });
  return lines.join("\n");
}

// ----------------------------- Component -------------------------------------

const COLORS = ["#22d3ee", "#818cf8", "#10b981", "#f59e0b", "#a78bfa", "#ef4444"];

const LoanEMICalculator: React.FC = () => {
  // Base State
  const [currency, setCurrency] = useState<Currency>("$");
  const [mode, setMode] = useState<Mode>("basic");
  const [solveMode, setSolveMode] = useState<SolveMode>("by_tenure");
  const [rateMode, setRateMode] = useState<RateMode>("per_annum");

  const [principal, setPrincipal] = useState<number>(100000);
  const [rateAnnual, setRateAnnual] = useState<number>(10);
  const [tenureMonths, setTenureMonths] = useState<number>(12);
  const [targetEMI, setTargetEMI] = useState<number>(0);
  const [customTenure, setCustomTenure] = useState<boolean>(false);

  const [emi, setEmi] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);

  // Prepayment
  const [prepay, setPrepay] = useState<PrepaymentSettings>({
    oneTimeAmount: 0,
    oneTimeMonth: 12,
    extraMonthly: 0,
    enableOneTime: false,
    enableExtraMonthly: false,
  });

  // Comparison
  const [compare, setCompare] = useState<ComparisonInputs>({
    enabled: false,
    loanB: { rateAnnual: 9, tenureMonths: 12 },
  });

  const [showSchedule, setShowSchedule] = useState<boolean>(true);
  const [showCharts, setShowCharts] = useState<boolean>(true);
  const [showYearlyBars, setShowYearlyBars] = useState<boolean>(false);

  const resultRef = useRef<HTMLDivElement>(null);

  // Init from query
  useEffect(() => {
    const q = fromQuery(window.location.search);
    if (q.currency && ["$", "₹", "€", "£"].includes(q.currency)) setCurrency(q.currency as Currency);
    if (q.mode && (q.mode === "basic" || q.mode === "advanced")) setMode(q.mode);
    if (q.solve === "by_emi" || q.solve === "by_tenure") setSolveMode(q.solve);
    if (q.rateMode === "per_month" || q.rateMode === "per_annum") setRateMode(q.rateMode as RateMode);
    if (q.p) setPrincipal(Math.max(0, Number(q.p)));
    if (q.r) setRateAnnual(Math.max(0, Number(q.r)));
    if (q.n) setTenureMonths(Math.max(1, Math.floor(Number(q.n))));
    if (q.temi) setTargetEMI(Math.max(0, Number(q.temi)));
    if (q.eom) setPrepay((s) => ({ ...s, enableOneTime: q.eom === "1" }));
    if (q.eem) setPrepay((s) => ({ ...s, enableExtraMonthly: q.eem === "1" }));
    if (q.ota) setPrepay((s) => ({ ...s, oneTimeAmount: Math.max(0, Number(q.ota)) }));
    if (q.otm) setPrepay((s) => ({ ...s, oneTimeMonth: Math.max(1, Math.floor(Number(q.otm))) }));
    if (q.xm) setPrepay((s) => ({ ...s, extraMonthly: Math.max(0, Number(q.xm)) }));
    if (q.cmp === "1") setCompare((c) => ({ ...c, enabled: true }));
    if (q.cr) setCompare((c) => ({ ...c, loanB: { ...c.loanB, rateAnnual: Math.max(0, Number(q.cr)) } }));
    if (q.cn) setCompare((c) => ({ ...c, loanB: { ...c.loanB, tenureMonths: Math.max(1, Math.floor(Number(q.cn))) } }));
  }, []);

  // Derived
  const rateMonthly = useMemo(() => {
    const annual = rateMode === "per_annum" ? rateAnnual : rateAnnual * 12;
    return annual / 100 / 12;
  }, [rateMode, rateAnnual]);

  // Calculate
  useEffect(() => {
    let months = tenureMonths;
    let emiValue = 0;
    if (solveMode === "by_tenure") {
      emiValue = calcEMI(principal, rateMonthly, months);
    } else {
      const emiTarget = targetEMI > 0 ? targetEMI : calcEMI(principal, rateMonthly, tenureMonths);
      months = solveTenureForEMI(principal, rateMonthly, emiTarget);
      emiValue = calcEMI(principal, rateMonthly, months);
    }
    const total = emiValue * months;
    const interest = total - principal;
    setEmi(emiValue);
    setTotalAmount(total);
    setTotalInterest(interest);
  }, [principal, rateMonthly, tenureMonths, solveMode, targetEMI]);

  const { rows, scheduleTotals } = useMemo(() => {
    const base = buildSchedule(principal, rateMonthly * 12 * 100, tenureMonths, emi, prepay);
    return { rows: base.rows, scheduleTotals: base };
  }, [principal, rateMonthly, tenureMonths, emi, prepay]);

  const yearlyAgg = useMemo(() => groupByYear(rows), [rows]);

  // Handlers
  const resetInputs = useCallback(() => {
    setPrincipal(100000);
    setRateAnnual(10);
    setTenureMonths(12);
    setTargetEMI(0);
    setRateMode("per_annum");
    setSolveMode("by_tenure");
    setCustomTenure(false);
    setPrepay({
      oneTimeAmount: 0,
      oneTimeMonth: 12,
      extraMonthly: 0,
      enableOneTime: false,
      enableExtraMonthly: false,
    });
    setCompare({
      enabled: false,
      loanB: { rateAnnual: 9, tenureMonths: 12 },
    });
  }, []);

  const copyShareLink = useCallback(async () => {
    const url =
      window.location.origin +
      window.location.pathname +
      "?" +
      toQuery({
        currency,
        mode,
        solve: solveMode,
        rateMode,
        p: principal,
        r: rateAnnual,
        n: tenureMonths,
        temi: targetEMI,
        eom: prepay.enableOneTime ? 1 : 0,
        eem: prepay.enableExtraMonthly ? 1 : 0,
        ota: prepay.oneTimeAmount,
        otm: prepay.oneTimeMonth,
        xm: prepay.extraMonthly,
        cmp: compare.enabled ? 1 : 0,
        cr: compare.loanB.rateAnnual,
        cn: compare.loanB.tenureMonths,
      });
    await copyText(url);
    alert("Sharable link copied to clipboard!");
  }, [currency, mode, solveMode, rateMode, principal, rateAnnual, tenureMonths, targetEMI, prepay, compare]);

  const exportCSV = useCallback(() => {
    const csv = scheduleToCSV(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "amortization_schedule.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  }, [rows]);

  const printResults = useCallback(() => window.print(), []);

  const loanB = useMemo(() => {
    if (!compare.enabled) return null;
    const rM = compare.loanB.rateAnnual / 100 / 12;
    const emiB = calcEMI(principal, rM, compare.loanB.tenureMonths);
    const totalB = emiB * compare.loanB.tenureMonths;
    const intB = totalB - principal;
    return { emi: emiB, total: totalB, interest: intB, r: compare.loanB.rateAnnual, n: compare.loanB.tenureMonths };
  }, [compare, principal]);

  const currencyPrefix = useMemo(() => currency, [currency]);

  // ---------------------- Reusable Input ------------------
  function LabeledNumber({
    label,
    value,
    onChange,
    step = 1,
    min = 0,
    max = Number.MAX_SAFE_INTEGER,
    id,
    suffix,
  }: {
    label: string;
    value: number;
    onChange: (n: number) => void;
    step?: number;
    min?: number;
    max?: number;
    id?: string;
    suffix?: string;
  }) {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor={id}>
          {label}
        </label>
        <input
          id={id}
          type="number"
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value), min, max))}
          step={step}
          className="w-full px-4 py-2 bg-slate-800/70 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-slate-500"
        />
        {suffix ? <div className="text-xs text-slate-400 mt-1">{suffix}</div> : null}
      </div>
    );
  }

  function Range({
    label,
    value,
    onChange,
    min,
    max,
    step = 1,
  }: {
    label: string;
    value: number;
    onChange: (n: number) => void;
    min: number;
    max: number;
    step?: number;
  }) {
    return (
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-slate-300">{label}</span>
          <span className="text-sm text-slate-200 font-semibold">
            {value.toLocaleString()}
          </span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-cyan-500"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>{min.toLocaleString()}</span>
          <span>{max.toLocaleString()}</span>
        </div>
      </div>
    );
  }

  // ---------------------- Basic Inputs (with Tenure Quick Buttons) -----------
    const BasicInputs = (
  <div className="rounded-xl shadow-md bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700 p-6">
    <div className="rounded-lg p-6 bg-slate-900/70 backdrop-blur-sm">
      <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-cyan-300 drop-shadow flex items-center gap-2">
          <Calculator className="w-5 h-5" /> Loan Details
        </h2>

        <div className="flex items-center gap-2">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="px-3 py-2 bg-slate-800/70 border border-slate-700 text-white rounded-lg"
            aria-label="Select Currency"
          >
            <option>$</option>
            <option>₹</option>
            <option>€</option>
            <option>£</option>
          </select>

          <button
            onClick={resetInputs}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 text-cyan-400 hover:text-white hover:bg-cyan-600 transition-all duration-300 shadow-md hover:shadow-cyan-500/40 transform hover:scale-110"
            aria-label="Reset loan inputs"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* --- Loan Inputs --- */}
      <div className="space-y-5">
        {/* Loan Amount */}
        <LabeledNumber
          id="principal"
          label="Loan Amount (Principal)"
          value={principal}
          onChange={setPrincipal}
          min={0}
          step={100}
        />

        {/* Interest Rate - Monthly only */}
        <LabeledNumber
          id="rate"
          label="Interest Rate (% per month)"
          value={rateAnnual}
          onChange={setRateAnnual}
          min={0}
          step={0.1}
        />

        {/* Time Period */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Time Period
          </label>

          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[100px]">
              <label className="block text-xs text-slate-400 mb-1">Years</label>
              <input
                type="number"
                min={0}
                value={Math.floor(tenureMonths / 12)}
                onChange={(e) => {
                  const years = Number(e.target.value);
                  const months = tenureMonths % 12;
                  setTenureMonths(years * 12 + months);
                }}
                className="w-full px-3 py-2 bg-slate-800/70 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            <div className="flex-1 min-w-[100px]">
              <label className="block text-xs text-slate-400 mb-1">Months</label>
              <input
                type="number"
                min={0}
                max={11}
                value={tenureMonths % 12}
                onChange={(e) => {
                  const months = Math.min(11, Number(e.target.value));
                  const years = Math.floor(tenureMonths / 12);
                  setTenureMonths(years * 12 + months);
                }}
                className="w-full px-3 py-2 bg-slate-800/70 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            {Math.floor(tenureMonths / 12)} years {tenureMonths % 12} months
          </p>
        </div>

        {/* Rate Type Fixed */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-300">Rate Type:</label>
          <span className="text-cyan-400 font-semibold text-sm bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700">
            Monthly
          </span>
        </div>
      </div>
    </div>
  </div>
);


  // ---------------------- Basic Results --------------------------------------
  const BasicResults = (
    <div ref={resultRef} className="rounded-xl shadow-md bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700 p-6">
      <div className="rounded-lg p-6 bg-slate-900/70 backdrop-blur-sm">
        <h2 className="text-xl font-semibold text-cyan-300 mb-4 drop-shadow flex items-center gap-2">
          <BarChart3 className="w-5 h-5" /> EMI Breakdown
        </h2>

        <div className="space-y-6">
          <div className="text-center p-4 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 shadow-lg">
            <PiggyBank className="h-8 w-8 text-white mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {currencyPrefix}
              {emi.toFixed(2)}
            </div>
            <div className="text-sm text-slate-200">Monthly EMI</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg text-center bg-gradient-to-r from-green-600 to-emerald-600 shadow-md">
              <div className="text-lg font-semibold text-white">
                {currencyPrefix}
                {fmt(principal)}
              </div>
              <div className="text-sm text-slate-100">Principal Amount</div>
            </div>

            <div className="p-4 rounded-lg text-center bg-gradient-to-r from-amber-600 to-orange-600 shadow-md">
              <div className="text-lg font-semibold text-white">
                {currencyPrefix}
                {fmt(totalInterest)}
              </div>
              <div className="text-sm text-slate-100">Total Interest</div>
            </div>
          </div>

          <div className="p-4 rounded-lg text-center bg-gradient-to-r from-indigo-600 to-cyan-600 shadow-lg">
            <div className="text-xl font-semibold text-white">
              {currencyPrefix}
              {fmt(totalAmount)}
            </div>
            <div className="text-sm text-slate-200">Total Amount Payable</div>
          </div>

          <p className="text-sm text-slate-400 mt-2 text-center">
            <strong>Note:</strong> Your estimated monthly EMI based on current rate and tenure.
          </p>
        </div>
      </div>
    </div>
  );

  // ---------------------- Advanced Controls ----------------------------------
const AdvancedControls = mode === "advanced" && (
  <div className="rounded-xl shadow-md bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700 p-6">
    <div className="rounded-lg p-6 bg-slate-900/70 backdrop-blur-sm space-y-6">
      {/* Header Section */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5" /> Advanced Controls
        </h3>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={copyShareLink}
            className="px-3 py-2 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 text-sm transition-all"
            title="Copy shareable link"
          >
            <Share2 className="w-4 h-4" /> Copy Link
          </button>
          <button
            onClick={printResults}
            className="px-3 py-2 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 text-sm transition-all"
            title="Print Results"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* Loan Configuration */}
      <div className="space-y-4">
        <h4 className="text-slate-200 font-semibold">Loan Configuration</h4>
        <p className="text-slate-400 text-sm mb-2">
          Adjust your loan details using the sliders below. Results update after releasing each slider.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
           {/* Loan Amount Stepper */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Loan Amount ({currencyPrefix})
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPrincipal((p) => Math.max(0, p - 1000))}
                  className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-cyan-500 transition-all text-lg font-semibold"
                >
                  –
                </button>
          
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={principal}
                  onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
                  className="w-28 text-center px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
          
                <button
                  type="button"
                  onClick={() => setPrincipal((p) => p + 1000)}
                  className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-cyan-500 transition-all text-lg font-semibold"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Adjust your loan amount in steps of 1,000.
              </p>
            </div>
          {/* Interest Rate Stepper */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Interest Rate (%)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRateAnnual((r) => Math.max(0, Number((r - 0.1).toFixed(2))))}
                className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-cyan-500 transition-all text-lg font-semibold"
              >
                –
              </button>
        
              <input
                type="number"
                step={0.1}
                min={0}
                max={36}
                value={rateAnnual}
                onChange={(e) => setRateAnnual(Math.max(0, Number(e.target.value)))}
                className="w-24 text-center px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
        
              <button
                type="button"
                onClick={() => setRateAnnual((r) => Math.min(36, Number((r + 0.1).toFixed(2))))}
                className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-cyan-500 transition-all text-lg font-semibold"
              >
                +
              </button>
            </div>
          </div>
          {/* Tenure Stepper */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Tenure (months)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTenureMonths((n) => Math.max(1, n - 1))}
                className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-cyan-500 transition-all text-lg font-semibold"
              >
                –
              </button>
          
              <input
                type="number"
                min={1}
                max={480}
                value={tenureMonths}
                onChange={(e) => setTenureMonths(Math.max(1, Number(e.target.value)))}
                className="w-20 text-center px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
          
              <button
                type="button"
                onClick={() => setTenureMonths((n) => Math.min(480, n + 1))}
                className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-cyan-500 transition-all text-lg font-semibold"
              >
                +
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {Math.floor(tenureMonths / 12)} years {tenureMonths % 12} months
            </p>
          </div>
        </div>
      </div>

      {/* Prepayment Options */}
      <div className="space-y-4">
        <h4 className="text-slate-200 font-semibold">Prepayment Options</h4>
        <p className="text-slate-400 text-sm">
          Add lump-sum or extra monthly payments to see how they reduce your loan duration and interest cost.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* One-time Lump Sum */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-slate-300 font-medium">One-time Lump Sum</label>
              <input
                type="checkbox"
                checked={prepay.enableOneTime}
                onChange={(e) =>
                  setPrepay((s) => ({ ...s, enableOneTime: e.target.checked }))
                }
                className="w-4 h-4 accent-cyan-500"
              />
            </div>

            <div
              className={`grid grid-cols-1 sm:grid-cols-2 gap-3 transition-opacity ${
                prepay.enableOneTime ? "opacity-100" : "opacity-50 pointer-events-none"
              }`}
            >
              <LabeledNumber
                id="oneTimeAmount"
                label="Amount"
                value={prepay.oneTimeAmount}
                onChange={(n) =>
                  setPrepay((s) => ({ ...s, oneTimeAmount: Math.max(0, n) }))
                }
                min={0}
                step={100}
              />
              <LabeledNumber
                id="oneTimeMonth"
                label="Month #"
                value={prepay.oneTimeMonth}
                onChange={(n) =>
                  setPrepay((s) => ({ ...s, oneTimeMonth: Math.max(1, Math.floor(n)) }))
                }
                min={1}
                step={1}
              />
            </div>
          </div>

          {/* Extra Monthly Payment */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-slate-300 font-medium">Extra Monthly Payment</label>
              <input
                type="checkbox"
                checked={prepay.enableExtraMonthly}
                onChange={(e) =>
                  setPrepay((s) => ({ ...s, enableExtraMonthly: e.target.checked }))
                }
                className="w-4 h-4 accent-cyan-500"
              />
            </div>

            <div
              className={`transition-opacity ${
                prepay.enableExtraMonthly ? "opacity-100" : "opacity-50 pointer-events-none"
              }`}
            >
              <LabeledNumber
                id="extraMonthly"
                label="Extra per month"
                value={prepay.extraMonthly}
                onChange={(n) =>
                  setPrepay((s) => ({ ...s, extraMonthly: Math.max(0, n) }))
                }
                min={0}
                step={50}
              />
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          💡 Prepayments are applied dynamically in your EMI breakdown and amortization schedule to reflect early payoff and interest savings.
        </p>
      </div>
    </div>
  </div>
);



  // ---------------------- Charts ---------------------------------------------
// ✅ Helper: Format large numbers like 1.2K, 1.5M, 1.2B
const formatNumber = (num: number): string => {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toFixed(2);
};

// ✅ Chart Data Memoization
const pieData = useMemo(
  () => [
    { name: "Principal", value: principal },
    { name: "Interest", value: totalInterest },
  ],
  [principal, totalInterest]
);

const lineData = useMemo(
  () =>
    rows.map((r) => ({
      month: r.month,
      balance: r.closing,
    })),
  [rows]
);

const barData = useMemo(() => yearlyAgg, [yearlyAgg]);

// ✅ Chart Section JSX
const Charts =
  mode === "advanced" &&
  showCharts && (
    <div className="rounded-xl shadow-md bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700 p-6">
      <div className="rounded-lg p-6 bg-slate-900/70 backdrop-blur-sm space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-3">
          <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5" /> Visualizations
          </h3>

          <button
            onClick={() => setShowYearlyBars((s) => !s)}
            className="px-3 py-2 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 transition-all text-sm"
          >
            <BarChart3 className="w-4 h-4" />
            {showYearlyBars ? "Hide Yearly Bars" : "Show Yearly Bars"}
          </button>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          {/* Pie + Line */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie Chart */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-slate-200 mb-1 font-semibold">
                Principal vs Interest
              </h4>
              <p className="text-xs text-slate-400 mb-3">
                See how your total loan splits between principal and interest.
              </p>
              <div className="h-48 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius="80%"
                      labelLine={false}
                      label={({ name, value }) =>
                        `${name}: ${formatNumber(value)}`
                      }
                    >
                      {/* ✅ Principal = Green slice, hover text = Amber */}
                      <Cell
                        fill="#10b981"
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                      />
                      {/* ✅ Interest = Amber slice, hover text = Green */}
                      <Cell
                        fill="#f59e0b"
                        stroke="#10b981"
                        strokeWidth={1.5}
                      />
                    </Pie>

                    <RechartsTooltip
                        formatter={(val: number, name: string) => [
                          `${formatNumber(val)}`,
                          name,
                        ]}
                        contentStyle={{
                          backgroundColor: "#f5f7f7",
                          border: "none",
                          borderRadius: "12px",
                          color: "#0f172a",
                          boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                        }}
                        itemStyle={{
                          color: "#0f172a",
                          fontWeight: 600,
                        }}
                        labelStyle={{
                          color: "#475569",
                          fontWeight: 500,
                        }}
                      />

                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Line Chart */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 lg:col-span-2">
              <h4 className="text-slate-200 mb-1 font-semibold">
                Balance Over Time
              </h4>
              <p className="text-xs text-slate-400 mb-3">
                Track how your outstanding loan balance reduces each month.
              </p>
             <div className="h-48 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RLineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="month"
                      stroke="#94a3b8"
                      interval={Math.ceil(lineData.length / 12)}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tickFormatter={(v) => formatNumber(v)}
                    />
              
                    {/* ✅ Polished Tooltip */}
                    <RechartsTooltip
                      formatter={(val: number, name: string) => [
                        `${formatNumber(val)}`,
                        name === "balance" ? "Remaining" : name,
                      ]}
                      contentStyle={{
                        backgroundColor: "#f5f7f7", // soft light tooltip
                        border: "none",
                        borderRadius: "12px",
                        color: "#0f172a",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                        padding: "10px 14px",
                      }}
                      itemStyle={{
                        color: "#22d3ee", // cyan text to match line color
                        fontWeight: 600,
                      }}
                      labelStyle={{
                        color: "#475569",
                        fontWeight: 500,
                      }}
                    />
              
                    <Legend
                      wrapperStyle={{
                        paddingTop: "8px",
                      }}
                    />
              
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="#22d3ee"
                      dot={false}
                      strokeWidth={2}
                      activeDot={{ r: 5, fill: "#06b6d4" }}
                    />
                  </RLineChart>
                </ResponsiveContainer>
              </div>

            </div>
          </div>

          {/* Yearly Bars (Unchanged, still fast) */}
          {showYearlyBars && (
            <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700">
              <h4 className="text-slate-200 mb-1 font-semibold">
                Yearly Interest vs Principal
              </h4>
              <p className="text-xs text-slate-400 mb-3">
                Understand how much you pay toward principal and interest each
                year.
              </p>
              <div className="h-56 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="year" stroke="#94a3b8" />
                    <YAxis
                      stroke="#94a3b8"
                      tickFormatter={(v) => formatNumber(v)}
                    />
                    <Legend />
                    <RechartsTooltip
                      formatter={(v: number) => formatNumber(v)}
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "none",
                        color: "#e2e8f0",
                      }}
                    />
                    <Bar dataKey="principal" stackId="a" fill="#10b981" />
                    <Bar dataKey="interest" stackId="a" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );



  // ---------------------- Schedule Table -------------------------------------
  const ScheduleTable = mode === "advanced" && showSchedule && (
    <div className="rounded-xl shadow-md bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700 p-6">
      <div className="rounded-lg p-6 bg-slate-900/70 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-cyan-300">Amortization Schedule</h3>
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="px-3 py-2 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-800 text-slate-200">
              <tr>
                <th className="px-3 py-2 text-left">Month</th>
                <th className="px-3 py-2 text-right">Opening</th>
                <th className="px-3 py-2 text-right">Interest</th>
                <th className="px-3 py-2 text-right">Principal</th>
                <th className="px-3 py-2 text-right">Regular EMI</th>
                <th className="px-3 py-2 text-right">Extra</th>
                <th className="px-3 py-2 text-right">Closing</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.month} className="odd:bg-slate-800/40 even:bg-slate-800/20">
                  <td className="px-3 py-2">{r.month}</td>
                  <td className="px-3 py-2 text-right">{currencyPrefix}{fmt(r.opening)}</td>
                  <td className="px-3 py-2 text-right">{currencyPrefix}{fmt(r.interest)}</td>
                  <td className="px-3 py-2 text-right">{currencyPrefix}{fmt(r.principalPaid)}</td>
                  <td className="px-3 py-2 text-right">{currencyPrefix}{fmt(r.regularEmi)}</td>
                  <td className="px-3 py-2 text-right">{currencyPrefix}{fmt(r.extraPayment)}</td>
                  <td className="px-3 py-2 text-right">{currencyPrefix}{fmt(r.closing)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-lg bg-slate-800/60">
            <div className="text-slate-400 text-sm">Effective Months</div>
            <div className="text-white text-lg font-semibold">{scheduleTotals.effectiveMonths}</div>
          </div>
          <div className="p-4 rounded-lg bg-slate-800/60">
            <div className="text-slate-400 text-sm">Total Interest (w/ prepay)</div>
            <div className="text-white text-lg font-semibold">
              {currencyPrefix}{fmt(scheduleTotals.totalInterest)}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-slate-800/60">
            <div className="text-slate-400 text-sm">Total Paid (w/ prepay)</div>
            <div className="text-white text-lg font-semibold">
              {currencyPrefix}{fmt(scheduleTotals.totalPaid)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ---------------------- Comparison -----------------------------------------
  const Comparison = mode === "advanced" && (
    <div className="rounded-xl shadow-md bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700 p-6">
      <div className="rounded-lg p-6 bg-slate-900/70 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5" /> Compare Loans
          </h3>
          <div className="flex items-center gap-3">
            <label className="text-slate-300 text-sm">Enable</label>
            <input
              type="checkbox"
              checked={compare.enabled}
              onChange={(e) => setCompare((c) => ({ ...c, enabled: e.target.checked }))}
            />
          </div>
        </div>

        {compare.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
              <h4 className="text-slate-200 font-semibold mb-2">Loan A (Current)</h4>
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                <div>Rate (p.a.)</div>
                <div className="text-right">{rateAnnual}%</div>
                <div>Tenure</div>
                <div className="text-right">{tenureMonths} months</div>
                <div>EMI</div>
                <div className="text-right">{currencyPrefix}{fmt(emi)}</div>
                <div>Total Interest</div>
                <div className="text-right">{currencyPrefix}{fmt(totalInterest)}</div>
                <div>Total Payment</div>
                <div className="text-right">{currencyPrefix}{fmt(totalAmount)}</div>
              </div>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
              <h4 className="text-slate-200 font-semibold mb-2">Loan B (Compare)</h4>
              <div className="grid grid-cols-2 gap-3">
                <LabeledNumber
                  id="cmp-rate"
                  label="Rate p.a. (%)"
                  value={compare.loanB.rateAnnual}
                  onChange={(n) => setCompare((c) => ({ ...c, loanB: { ...c.loanB, rateAnnual: n } }))}
                  min={0}
                  step={0.1}
                />
                <LabeledNumber
                  id="cmp-n"
                  label="Tenure (months)"
                  value={compare.loanB.tenureMonths}
                  onChange={(n) =>
                    setCompare((c) => ({ ...c, loanB: { ...c.loanB, tenureMonths: Math.max(1, Math.floor(n)) } }))
                  }
                  min={1}
                  step={1}
                />
              </div>

              {loanB && (
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-300 mt-4">
                  <div>EMI</div>
                  <div className="text-right">{currencyPrefix}{fmt(loanB.emi)}</div>
                  <div>Total Interest</div>
                  <div className="text-right">{currencyPrefix}{fmt(loanB.interest)}</div>
                  <div>Total Payment</div>
                  <div className="text-right">{currencyPrefix}{fmt(loanB.total)}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ---------------------- Header ---------------------------------------------
  const Header = (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white mb-2 drop-shadow">Loan EMI Calculator</h1>
      <p className="text-slate-300">
        Calculate your monthly EMI, interest, and total payment. Switch to{" "}
        <span className="text-cyan-300 font-semibold">Advanced Mode</span> for prepayments,
        charts, schedule, and comparisons.
      </p>
    </div>
  );

  // ---------------------- Render ---------------------------------------------
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
        breadcrumbs={[
          { name: "Currency & Finance", url: "/category/currency-finance" },
          { name: "Loan EMI Calculator", url: "/loan-emi-calculator" },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "Loan EMI Calculator", url: "/loan-emi-calculator" },
          ]}
        />

        {/* Header */}
        {Header}

        {/* Mode Toggle */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 bg-slate-900/70 border border-slate-700 rounded-lg p-1">
            <button
              onClick={() => setMode("basic")}
              className={`px-4 py-2 rounded-md ${mode === "basic" ? "bg-cyan-600 text-white" : "text-slate-300"}`}
            >
              Basic Mode
            </button>
            <button
              onClick={() => setMode("advanced")}
              className={`px-4 py-2 rounded-md ${mode === "advanced" ? "bg-cyan-600 text-white" : "text-slate-300"}`}
            >
              Advanced Mode
            </button>
          </div>

          <div className="text-slate-400 text-sm">
            Tip: Advanced mode unlocks prepayments, charts, amortization schedule, and comparisons.
          </div>
        </div>

        {/* Basic Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {BasicInputs}
          {BasicResults}
        </div>

        {/* Advanced Sections */}
        {mode === "advanced" && (
          <>
            {AdvancedControls}
            {Charts}
            {ScheduleTable}
            {Comparison}
          </>
        )}

        {/* SEO content */}
        <div className="seo-content text-white space-y-6 mt-10">
          <h2 className="text-2xl font-bold">What is a Loan EMI Calculator?</h2>
          <p>
            A Loan EMI (Equated Monthly Installment) Calculator helps you estimate your monthly repayment
            amount for a loan based on principal, interest rate, and tenure. Use our tool to visualize your
            repayment schedule, simulate prepayments, and compare loan scenarios without guesswork.
          </p>

          <h2 className="text-2xl font-bold">How to Calculate EMI Manually</h2>
          <div className="bg-slate-800/60 p-4 rounded-lg">
            <code className="text-green-400">
              EMI = [P × R × (1 + R)^N] / [(1 + R)^N – 1]
            </code>
          </div>
          <p className="text-slate-300">
            Where P is principal, R is monthly interest rate (annual/12), and N is number of months.
          </p>

          <h2 className="text-2xl font-bold">Benefits of Using EMI Calculator</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>✔ Instant results with accuracy</li>
            <li>✔ Plan your monthly budget</li>
            <li>✔ Simulate prepayments and their impact</li>
            <li>✔ Compare different loan offers and terms</li>
            <li>✔ Export schedule and share results</li>
          </ul>

          {/* Related Tools Grid */}
          <div className="mt-10">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">💼 Related Finance Tools</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: "Compound Interest Calculator", link: "/compound-interest-calculator", color: "from-emerald-500 to-teal-600" },
                { name: "Mortgage Calculator", link: "/mortgage-calculator", color: "from-indigo-500 to-blue-600" },
                { name: "Fixed Deposit (FD) Calculator", link: "/fd-calculator", color: "from-green-500 to-emerald-600" },
                { name: "ROI Calculator", link: "/roi-calculator", color: "from-purple-500 to-fuchsia-600" },
              ].map((tool) => (
                <a
                  key={tool.name}
                  href={tool.link}
                  className={`group p-4 rounded-xl bg-gradient-to-r ${tool.color} shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-between text-white`}
                >
                  <span className="font-medium group-hover:translate-x-1 transition-transform duration-200">
                    {tool.name}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators currentPath="/loan-emi-calculator" category="currency-finance" />
      </div>
    </>
  );
};

export default LoanEMICalculator;
