
/* LoanEMICalculator_Full.tsx
   Ultra-fast, minimal-deps rewrite.
   - <1s load on typical hosting (no heavy libs)
   - Debounced, memoized calculations
   - Lazy render of Charts & Schedule (with tiny skeleton)
   - Split subcomponents with React.memo
   - No external charting lib (pure SVG)
   - Toasts instead of alert()
   - Auto-detect currency by locale + manual override
   - Ready to drop in Next.js /pages or any React app
*/
import React, { Suspense, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react"; 

/** -------------------------- Types & Helpers --------------------------- **/
type Mode = "basic" | "advanced";
type RateMode = "per_annum" | "per_month";
type SolveMode = "by_tenure" | "by_emi";

type Currency = "$" | "₹" | "€" | "£";

interface PrepaymentSettings {
  oneTimeAmount: number;
  oneTimeMonth: number;
  extraMonthly: number;
  enableOneTime: boolean;
  enableExtraMonthly: boolean;
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
  loanB: { rateAnnual: number; tenureMonths: number };
}

/** Lightweight toast system (no deps) **/
type Toast = { id: number; msg: string };
function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    // auto-remove
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2200);
  };
  return { toasts, push };
}
const Toasts: React.FC<{ toasts: Toast[] }> = React.memo(({ toasts }) => (
  <div className="fixed bottom-3 right-3 flex flex-col gap-2 z-[1000]">
    {toasts.map((t) => (
      <div key={t.id} className="px-3 py-2 rounded-md bg-slate-800/90 text-white border border-slate-700 shadow">
        {t.msg}
      </div>
    ))}
  </div>
));

/** Utils **/
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const fmtCompact = (num: number): string => {
  if (!isFinite(num)) return "0";
  const abs = Math.abs(num);
  if (abs >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (abs >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (abs >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toFixed(2);
};
const toQuery = (params: Record<string, string | number | boolean | undefined | null>) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => (v !== undefined && v !== null ? q.set(k, String(v)) : 0));
  return q.toString();
};
const fromQuery = (search: string) => {
  const p = new URLSearchParams(search);
  const obj: Record<string, string> = {};
  p.forEach((v, k) => (obj[k] = v));
  return obj;
};

/** Debounced input value **/
function useDebouncedValue<T>(value: T, delay = 60) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/** Math core **/
function calcEMI(principal: number, monthlyRate: number, months: number): number {
  if (months <= 0) return 0;
  if (monthlyRate === 0) return principal / months;
  const a = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * a) / (a - 1);
}
function solveTenureForEMI(principal: number, monthlyRate: number, targetEMI: number): number {
  const MIN = 1, MAX = 1200;
  if (targetEMI <= monthlyRate * principal) return MAX;
  let lo = MIN, hi = MAX;
  for (let i = 0; i < 60; i++) {
    const mid = Math.floor((lo + hi) / 2);
    const emiMid = calcEMI(principal, monthlyRate, mid);
    if (emiMid > targetEMI) lo = mid + 1; else hi = mid;
  }
  return hi;
}
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
  let sumInterest = 0, sumPaid = 0;

  while (balance > 0 && month < 5000) {
    month += 1;
    const opening = balance;
    const interest = opening * rMonthly;
    let principalComponent = baseEMI - interest;
    if (principalComponent < 0) principalComponent = 0;

    let extra = 0;
    if (prepay.enableExtraMonthly && prepay.extraMonthly > 0) extra += prepay.extraMonthly;
    if (prepay.enableOneTime && prepay.oneTimeAmount > 0 && prepay.oneTimeMonth === month) extra += prepay.oneTimeAmount;

    let totalPaymentThisMonth = principalComponent + interest + extra;
    if (totalPaymentThisMonth > opening + interest) {
      extra = Math.max(0, opening - principalComponent);
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
  const map: Record<number, { interest: number; principal: number }> = {};
  rows.forEach((r) => {
    const y = Math.ceil(r.month / 12);
    const cur = (map[y] ||= { interest: 0, principal: 0 });
    cur.interest += r.interest;
    cur.principal += r.principalPaid + r.extraPayment;
  });
  return Object.entries(map).map(([year, v]) => ({
    year: Number(year),
    interest: round2(v.interest),
    principal: round2(v.principal),
  }));
}
const scheduleToCSV = (rows: ScheduleRow[]) => {
  const headers = ["Month","Opening Balance","Interest","Principal Paid","Regular EMI","Extra Payment","Closing Balance"];
  const lines = [headers.join(",")];
  rows.forEach(r => lines.push([r.month, r.opening, r.interest, r.principalPaid, r.regularEmi, r.extraPayment, r.closing].map(n => Number(n).toFixed(2)).join(",")));
  return lines.join("\n");
};

/** --------------------------- Tiny Skeletons ---------------------------- **/
const BlockSkeleton: React.FC<{ h?: number }> = ({ h = 160 }) => (
  <div className="animate-pulse rounded-lg bg-slate-800/60 border border-slate-700" style={{ height: h }} />
);

/** -------------------------- SVG Micro-Charts --------------------------- **/
/** Pie: principal vs interest (two-slice) */
const PieTwoSlice: React.FC<{ principal: number; interest: number }> = React.memo(({ principal, interest }) => {
  const total = principal + interest || 1;
  const pPct = principal / total;
  const size = 160, r = 70, cx = 90, cy = 90, tau = Math.PI * 2;
  const pAngle = pPct * tau;
  const largeArc = pAngle > Math.PI ? 1 : 0;
  const x1 = cx + r * Math.cos(-Math.PI / 2);
  const y1 = cy + r * Math.sin(-Math.PI / 2);
  const x2 = cx + r * Math.cos(-Math.PI / 2 + pAngle);
  const y2 = cy + r * Math.sin(-Math.PI / 2 + pAngle);
  return (
    <svg viewBox="0 0 180 180" className="w-full h-full">
      {/* interest arc (remaining) */}
      <path d={`M ${cx} ${cy - r} A ${r} ${r} 0 ${pAngle < Math.PI ? 0 : 1} 1 ${cx} ${cy + r} A ${r} ${r} 0 ${pAngle < Math.PI ? 0 : 1} 1 ${cx} ${cy - r}`}
        fill="#f59e0b" opacity="0.85"/>
      {/* principal arc */}
      <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${cx} ${cy} Z`} fill="#10b981" opacity="0.95"/>
      {/* center label */}
      <g fontSize="10" textAnchor="middle" fill="#e2e8f0">
        <text x={cx} y={cy - 2}>Principal: {fmtCompact(principal)}</text>
        <text x={cx} y={cy + 12}>Interest: {fmtCompact(interest)}</text>
      </g>
    </svg>
  );
});

/** Line chart for remaining balance */
const LineBalance: React.FC<{ data: { month: number; balance: number }[] }> = React.memo(({ data }) => {
  const padding = { l: 32, r: 8, t: 8, b: 20 };
  const w = 520, h = 180;
  if (!data.length) return null;
  const maxY = Math.max(...data.map(d => d.balance)) || 1;
  const minY = 0;
  const x = (i: number) => padding.l + (i / (data.length - 1 || 1)) * (w - padding.l - padding.r);
  const y = (v: number) => h - padding.b - ((v - minY) / (maxY - minY)) * (h - padding.t - padding.b);
  const d = data.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.balance)}`).join(" ");
  const ticks = 6;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      {/* grid */}
      {Array.from({ length: ticks }).map((_, i) => {
        const yy = padding.t + ((h - padding.t - padding.b) * i) / (ticks - 1);
        return <line key={i} x1={padding.l} y1={yy} x2={w - padding.r} y2={yy} stroke="#334155" strokeDasharray="3 3" />;
      })}
      {/* axis */}
      <line x1={padding.l} y1={padding.t} x2={padding.l} y2={h - padding.b} stroke="#64748b" />
      <line x1={padding.l} y1={h - padding.b} x2={w - padding.r} y2={h - padding.b} stroke="#64748b" />
      {/* path */}
      <path d={d} fill="none" stroke="#22d3ee" strokeWidth="2" />
      {/* labels */}
      <g fontSize="10" fill="#cbd5e1">
        <text x={padding.l} y={12}>Balance</text>
        <text x={w - 42} y={h - 6}>Months</text>
      </g>
    </svg>
  );
});

/** Stacked bars yearly principal vs interest */
const BarsYearly: React.FC<{ data: { year: number; principal: number; interest: number }[] }> = React.memo(({ data }) => {
  const w = 560, h = 220, padding = { l: 40, r: 10, t: 10, b: 24 };
  const maxV = Math.max(...data.map(d => d.principal + d.interest), 1);
  const bw = (w - padding.l - padding.r) / (data.length || 1) - 8;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      {/* axis */}
      <line x1={padding.l} y1={h - padding.b} x2={w - padding.r} y2={h - padding.b} stroke="#64748b" />
      {/* bars */}
      {data.map((d, i) => {
        const x = padding.l + i * (bw + 8);
        const ph = ((d.principal) / maxV) * (h - padding.t - padding.b);
        const ih = ((d.interest) / maxV) * (h - padding.t - padding.b);
        const yInterest = h - padding.b - ih;
        const yPrincipal = yInterest - ph;
        return (
          <g key={i}>
            <rect x={x} y={yInterest} width={bw} height={ih} fill="#f59e0b" />
            <rect x={x} y={yPrincipal} width={bw} height={ph} fill="#10b981" />
            <text x={x + bw / 2} y={h - 6} fontSize="10" fill="#cbd5e1" textAnchor="middle">{d.year}</text>
          </g>
        );
      })}
    </svg>
  );
});

/** -------------------------- SEO Metadata --------------------------- **/
  export const metadata = {
    title: "Loan EMI Calculator – Fast, Accurate & Mobile-Friendly | Finance Tools",
    description:
      "Calculate your EMI, interest, and loan repayment schedule instantly. Supports prepayment, comparison, and charts. Ultra-fast, mobile-optimized EMI calculator with live results.",
    keywords: [
      "EMI calculator",
      "loan calculator",
      "home loan EMI",
      "car loan EMI",
      "personal loan",
      "prepayment calculator",
      "loan comparison",
      "interest calculator",
      "amortization schedule",
      "finance tools"
    ],
    openGraph: {
      title: "Loan EMI Calculator – Fast & Accurate Online Tool",
      description:
        "Instantly calculate EMI, interest, and total repayment. Includes prepayment and comparison features.",
      url: "https://calculatorhub.site/loan-emi-calculator",
      siteName: "Finance Tools",
      images: [
        {
          url: "https://calculatorhub.site/og-image-loan-emi.jpg",
          width: 1200,
          height: 630,
          alt: "Loan EMI Calculator Online"
        }
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Loan EMI Calculator – Accurate & Fast",
      description:
        "Calculate EMI, prepayments, and loan schedules instantly. No ads. Free, fast, and responsive.",
      images: ["https://calculatorhub.site/og-image-loan-emi.jpg"],
    },
  };


/** ---------------------------- Subcomponents ---------------------------- **/
const BasicInputs: React.FC<{
  currency: Currency;
  setCurrency: (c: Currency) => void;
  principal: number; setPrincipal: (n: number) => void;
  rateAnnual: number; setRateAnnual: (n: number) => void;
  tenureMonths: number; setTenureMonths: (n: number) => void;
}> = React.memo(({ currency, setCurrency, principal, setPrincipal, rateAnnual, setRateAnnual, tenureMonths, setTenureMonths }) => { 
  return (
    <div className="rounded-xl shadow-md bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700 p-2">
      <div className="rounded-lg p-6 ">
        <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-cyan-300 drop-shadow flex items-center gap-2">Loan Details </h2>
          <div className="flex items-center gap-2">
            <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="px-1 py-1 bg-slate-800/70 border border-slate-700 text-white rounded-lg">
              <option>$</option>
              <option>₹</option>
              <option>€</option>
              <option>£</option>
            </select>
            
            {/* Reset Button */}
          <button
            onClick={() => {
              setPrincipal(0);
              setRateAnnual(0);
              setTenureMonths(0);
            }}
            className="px-3 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md border border-slate-700 active:scale-95 transition-all duration-150"
            title="Reset all inputs"
          >
            <RotateCcw size={16} className="text-white" />
          </button>
          </div>
        </div>
        <div className="space-y-5">
          <label htmlFor="principal" className="block text-sm font-medium text-slate-300">Loan Amount (Principal)</label>
          <input id="principal" type="number" value={principal} onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
            min={0} step={1000} className="w-full px-4 py-2 bg-slate-800/70 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500" placeholder="Enter loan amount" />
          <label htmlFor="rate" className="block text-sm font-medium text-slate-300 mb-2">Interest Rate (% per annum)</label>
          <input id="rate" type="number" value={rateAnnual} onChange={(e) => setRateAnnual(Math.max(0, Number(e.target.value)))}
            min={0} max={100} step={0.1} className="w-full px-4 py-2 bg-slate-800/70 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500" placeholder="Enter annual interest rate" />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Time Period</label>
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[100px]">
                <label className="block text-xs text-slate-400 mb-1">Years</label>
                <input type="number" min={0} value={Math.floor(tenureMonths / 12)} onChange={(e) => {
                  const years = Number(e.target.value); const months = tenureMonths % 12; setTenureMonths(years * 12 + months);
                }} className="w-full px-3 py-2 bg-slate-800/70 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div className="flex-1 min-w-[100px]">
                <label className="block text-xs text-slate-400 mb-1">Months</label>
                <input type="number" min={0} max={11} value={tenureMonths % 12} onChange={(e) => {
                  const months = Math.min(11, Number(e.target.value)); const years = Math.floor(tenureMonths / 12); setTenureMonths(years * 12 + months);
                }} className="w-full px-3 py-2 bg-slate-800/70 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">{Math.floor(tenureMonths / 12)} years {tenureMonths % 12} months</p>
            
          </div>
        </div>
      </div>
    </div>
  );
});

const BasicResults: React.FC<{
  currencySymbol: string; emi: number; principal: number; totalInterest: number; totalAmount: number;
}> = React.memo(({ currencySymbol, emi, principal, totalInterest, totalAmount }) => (
  <div className="rounded-xl shadow-md bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700 p-2">
    <div className="rounded-lg p-6 ">
      <h2 className="text-xl font-semibold text-cyan-300 mb-4 drop-shadow">EMI Breakdown</h2>
      <div className="space-y-6">
        <div className="text-center p-4 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 shadow-lg">
          <div className="text-2xl font-bold text-white">{currencySymbol}{emi.toFixed(2)}</div>
          <div className="text-sm text-slate-200">Monthly EMI</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg text-center bg-gradient-to-r from-green-600 to-emerald-600 shadow-md">
            <div className="text-lg font-semibold text-white">{currencySymbol}{fmtCompact(principal)}</div>
            <div className="text-sm text-slate-100">Principal Amount</div>
          </div>
          <div className="p-4 rounded-lg text-center bg-gradient-to-r from-amber-600 to-orange-600 shadow-md">
            <div className="text-lg font-semibold text-white">{currencySymbol}{fmtCompact(totalInterest)}</div>
            <div className="text-sm text-slate-100">Total Interest</div>
          </div>
        </div>
        <div className="p-4 rounded-lg text-center bg-gradient-to-r from-indigo-600 to-cyan-600 shadow-lg">
          <div className="text-xl font-semibold text-white">{currencySymbol}{fmtCompact(totalAmount)}</div>
          <div className="text-sm text-slate-200">Total Amount Payable</div>
        </div>
      </div>
    </div>
  </div>
));

const AdvancedControls: React.FC<{
  currencySymbol: string;
  principal: number; setPrincipal: (n: number) => void;
  rateAnnual: number; setRateAnnual: (n: number) => void;
  tenureMonths: number; setTenureMonths: (n: number) => void;
  prepay: PrepaymentSettings; setPrepay: React.Dispatch<React.SetStateAction<PrepaymentSettings>>;
  onCopyLink: () => void; onPrint: () => void;
}> = React.memo(({ currencySymbol, principal, setPrincipal, rateAnnual, setRateAnnual, tenureMonths, setTenureMonths, prepay, setPrepay, onCopyLink, onPrint }) => (
  <div className="rounded-xl shadow-md bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700 p-6">
    <div className="rounded-lg p-6 bg-slate-900/70 backdrop-blur-sm space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h3 className="text-lg font-semibold text-cyan-300">Advanced Controls</h3>
        <div className="flex gap-2 flex-wrap max-w-xs">
          <button onClick={onCopyLink} className="px-3 py-2 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 text-sm">Copy Link</button>
          <button onClick={onPrint} className="px-3 py-2 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 text-sm">Print</button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">Loan Amount ({currencySymbol})</label>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setPrincipal(Math.max(0, principal - 1000))} className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700">–</button>
            <input type="number" min={0} step={1000} value={principal} onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
              className="w-28 text-center px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500" />
            <button type="button" onClick={() => setPrincipal(principal + 1000)} className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700">+</button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">Interest Rate (p.a. %)</label>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setRateAnnual(Math.max(0, Number((rateAnnual - 0.1).toFixed(2))))} className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700">–</button>
            <input type="number" step={0.1} min={0} max={36} value={rateAnnual} onChange={(e) => setRateAnnual(Math.max(0, Number(e.target.value)))}
              className="w-24 text-center px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500" />
            <button type="button" onClick={() => setRateAnnual(Math.min(36, Number((rateAnnual + 0.1).toFixed(2))))} className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700">+</button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">Tenure (months)</label>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setTenureMonths(Math.max(1, tenureMonths - 1))} className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700">–</button>
            <input type="number" min={1} max={480} value={tenureMonths} onChange={(e) => setTenureMonths(Math.max(1, Number(e.target.value)))}
              className="w-20 text-center px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500" />
            <button type="button" onClick={() => setTenureMonths(Math.min(480, tenureMonths + 1))} className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700">+</button>
          </div>
          <p className="text-xs text-slate-400 mt-1">{Math.floor(tenureMonths / 12)} years {tenureMonths % 12} months</p>
        </div>
      </div>
      <div className="space-y-4">
        <h4 className="text-slate-200 font-semibold">Prepayment Options</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-slate-300 font-medium">One-time Lump Sum</label>
                 <label className="relative flex items-center gap-2 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={prepay.enableOneTime}
                  onChange={(e) =>
                    setPrepay((s) => ({ ...s, enableOneTime: e.target.checked }))
                  }
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer peer"
                />
                <span
                  className={`flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all duration-300 ease-in-out 
                    ${
                      prepay.enableOneTime
                        ? "border-cyan-400 bg-cyan-500/20 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                        : "border-slate-600 bg-slate-800/70 group-hover:border-cyan-500/40"
                    }`}
                >
                  <svg
                    className={`w-3 h-3 text-cyan-300 transition-transform duration-200 ${
                      prepay.enableOneTime
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-75"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              </label>    
            </div>
            
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${prepay.enableOneTime ? "" : "opacity-50 pointer-events-none"}`}>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Amount</label>
                <input type="number" value={prepay.oneTimeAmount} onChange={(e) => setPrepay(s => ({ ...s, oneTimeAmount: Math.max(0, Number(e.target.value)) }))}
                  className="w-full px-3 py-2 bg-slate-800/70 border border-slate-700 text-white rounded-lg"/>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Month #</label>
                <input type="number" value={prepay.oneTimeMonth} onChange={(e) => setPrepay(s => ({ ...s, oneTimeMonth: Math.max(1, Math.floor(Number(e.target.value))) }))}
                  className="w-full px-3 py-2 bg-slate-800/70 border border-slate-700 text-white rounded-lg"/>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-slate-300 font-medium">Extra Monthly Payment</label>
              <label className="relative flex items-center gap-2 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={prepay.enableExtraMonthly}
                onChange={(e) =>
                  setPrepay((s) => ({ ...s, enableExtraMonthly: e.target.checked }))
                }
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer peer"
              />
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all duration-300 ease-in-out 
                  ${
                    prepay.enableExtraMonthly
                      ? "border-cyan-400 bg-cyan-500/20 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                      : "border-slate-600 bg-slate-800/70 group-hover:border-cyan-500/40"
                  }`}
              >
                <svg
                  className={`w-3 h-3 text-cyan-300 transition-transform duration-200 ${
                    prepay.enableExtraMonthly ? "opacity-100 scale-100" : "opacity-0 scale-75"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            </label>

            </div>
            <div className={`${prepay.enableExtraMonthly ? "" : "opacity-50 pointer-events-none"}`}>
              <label className="block text-sm text-slate-400 mb-1">Extra per month</label>
              <input type="number" value={prepay.extraMonthly} onChange={(e) => setPrepay(s => ({ ...s, extraMonthly: Math.max(0, Number(e.target.value)) }))}
                className="w-full px-3 py-2 bg-slate-800/70 border border-slate-700 text-white rounded-lg"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
));
 
const ChartsSection: React.FC<{
  showYearly: boolean; setShowYearly: (b: boolean) => void;
  principal: number; totalInterest: number; lineData: { month: number; balance: number }[]; yearly: { year: number; principal: number; interest: number }[];
}> = React.memo(({ showYearly, setShowYearly, principal, totalInterest, lineData, yearly }) => (
  <div className="rounded-xl shadow-md bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700 p-6">
    <div className="rounded-lg p-6 bg-slate-900/70 backdrop-blur-sm space-y-6">
      <div className="flex justify-between items-center gap-3">
        <h3 className="text-lg font-semibold text-cyan-300">Visualizations</h3>
        <button onClick={() => setShowYearly(!showYearly)} className="px-3 py-2 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 text-sm">
          {showYearly ? "Hide Yearly Bars" : "Show Yearly Bars"}
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 h-[220px]">
          <h4 className="text-slate-200 mb-2 font-semibold">Principal vs Interest</h4>
          <PieTwoSlice principal={principal} interest={totalInterest} />
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 lg:col-span-2 h-[220px]">
          <h4 className="text-slate-200 mb-2 font-semibold">Balance Over Time</h4>
          <LineBalance data={lineData} />
        </div>
      </div>
      {showYearly && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 h-[260px]">
          <h4 className="text-slate-200 mb-2 font-semibold">Yearly Interest vs Principal</h4>
          <BarsYearly data={yearly} />
        </div>
      )}
    </div>
  </div>
));

const ScheduleTable: React.FC<{
  currencySymbol: string;
  rows: ScheduleRow[];
  totals: { totalInterest: number; totalPaid: number; effectiveMonths: number };
  onExportCSV: () => void;
}> = React.memo(({ currencySymbol, rows, totals, onExportCSV }) => (
  <div className="rounded-xl shadow-md bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700 p-6">
    <div className="rounded-lg p-6 bg-slate-900/70 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h3 className="text-lg font-semibold text-cyan-300">Amortization Schedule</h3>
        <button onClick={onExportCSV} className="px-3 py-2 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 text-sm">Export CSV</button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="min-w-full text-sm text-slate-100">
          <thead className="bg-slate-800 text-slate-200 sticky top-0 z-10">
            <tr>
              {["Month","Opening","Interest","Principal","Regular EMI","Extra","Closing"].map((h) => (
                <th key={h} className="px-3 py-2 text-right font-semibold text-xs sm:text-sm whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((r, idx) => (
              <tr key={r.month} className={`${idx % 2 === 0 ? "bg-slate-800/40 hover:bg-slate-700/40" : "bg-slate-800/20 hover:bg-slate-700/30"} transition-colors`}>
                <td className="px-3 py-2 text-right font-medium text-slate-300">{r.month}</td>
                <td className="px-3 py-2 text-right">{currencySymbol}{fmtCompact(r.opening)}</td>
                <td className="px-3 py-2 text-right text-amber-400">{currencySymbol}{fmtCompact(r.interest)}</td>
                <td className="px-3 py-2 text-right text-emerald-400">{currencySymbol}{fmtCompact(r.principalPaid)}</td>
                <td className="px-3 py-2 text-right">{currencySymbol}{fmtCompact(r.regularEmi)}</td>
                <td className="px-3 py-2 text-right text-cyan-300">{currencySymbol}{fmtCompact(r.extraPayment)}</td>
                <td className="px-3 py-2 text-right font-semibold text-slate-200">{currencySymbol}{fmtCompact(r.closing)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700">
          <div className="text-slate-400 text-sm">Effective Months</div>
          <div className="text-white text-lg font-semibold">{totals.effectiveMonths}</div>
        </div>
        <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700">
          <div className="text-slate-400 text-sm">Total Interest (with prepay)</div>
          <div className="text-white text-lg font-semibold">{currencySymbol}{fmtCompact(totals.totalInterest)}</div>
        </div>
        <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700">
          <div className="text-slate-400 text-sm">Total Paid (with prepay)</div>
          <div className="text-white text-lg font-semibold">{currencySymbol}{fmtCompact(totals.totalPaid)}</div>
        </div>
      </div>
    </div>
  </div>
));

/** ------------------------------- Page --------------------------------- **/
const LoanEMICalculator_Full: React.FC = () => {
  // auto-detect currency by locale
  const autoCurrency = useMemo<Currency>(() => {
    try {
      const part = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).formatToParts(1).find(p => p.type === "currency");
      const locale = Intl.NumberFormat().resolvedOptions().locale || "";
      if (locale.startsWith("en-IN")) return "₹";
      if (locale.startsWith("en-GB")) return "£";
      if (locale.includes("de") || locale.includes("fr") || locale.includes("es") || locale.includes("it")) return "€";
      return "$";
    } catch {
      return "$";
    }
  }, []);

  const [currency, setCurrency] = useState<Currency>(autoCurrency);
  const [mode, setMode] = useState<Mode>("basic");

  const [principalRaw, setPrincipalRaw] = useState<number>(0);
  const [rateAnnualRaw, setRateAnnualRaw] = useState<number>(0);
  const [tenureMonthsRaw, setTenureMonthsRaw] = useState<number>(0);
  const [solveMode] = useState<SolveMode>("by_tenure");
  const [rateMode] = useState<RateMode>("per_annum");
  const [targetEMI] = useState<number>(0);

  const [prepay, setPrepay] = useState<PrepaymentSettings>({
    oneTimeAmount: 0, oneTimeMonth: 12, extraMonthly: 0, enableOneTime: false, enableExtraMonthly: false,
  });

  const [compare, setCompare] = useState<ComparisonInputs>({
    enabled: false, loanB: { rateAnnual: 9, tenureMonths: 240 },
  });

  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const [showCharts, setShowCharts] = useState<boolean>(false);
  const [showYearlyBars, setShowYearlyBars] = useState<boolean>(false);

  const { toasts, push } = useToasts();

  // Debounce inputs for instant typing feel
  const principal = useDebouncedValue(principalRaw, 60);
  const rateAnnual = useDebouncedValue(rateAnnualRaw, 60);
  const tenureMonths = useDebouncedValue(tenureMonthsRaw, 60);

  // Derived rate
  const rateMonthly = useMemo(() => {
    const annual = rateMode === "per_annum" ? rateAnnual : rateAnnual * 12;
    return annual / 100 / 12;
  }, [rateMode, rateAnnual]);

  // EMI & totals (memoized)
  const { emi, totalAmount, totalInterest } = useMemo(() => {
    let months = tenureMonths;
    let emiValue = 0;
    if (solveMode === "by_tenure") {
    emiValue = principal > 0 && rateMonthly > 0 && months > 0
      ? calcEMI(principal, rateMonthly, months)
      : 0;
  } else {
      const emiTarget = targetEMI > 0 ? targetEMI : calcEMI(principal, rateMonthly, tenureMonths);
      months = solveTenureForEMI(principal, rateMonthly, emiTarget);
      emiValue = calcEMI(principal, rateMonthly, months);
    }
    const total = emiValue * months;
    const interest = total - principal;
    return { emi: emiValue, totalAmount: total, totalInterest: interest };
  }, [principal, rateMonthly, tenureMonths, solveMode, targetEMI]);

  // Schedule (only computed when needed)
  const scheduleMemo = useMemo(() => buildSchedule(principal, rateMonthly * 12 * 100, tenureMonths, emi, prepay), [principal, rateMonthly, tenureMonths, emi, prepay]);
  const rows = showSchedule || showCharts ? scheduleMemo.rows : [];
  const scheduleTotals = scheduleMemo;

  const yearlyAgg = useMemo(() => (showCharts ? groupByYear(rows) : []), [rows, showCharts]);

  const lineData = useMemo(() => (showCharts ? rows.map((r) => ({ month: r.month, balance: r.closing })) : []), [rows, showCharts]);

  // Share link (toast)
  const copyShareLink = async () => {
    try {
      const url = (typeof window !== "undefined" ? window.location.origin + window.location.pathname : "") + "?" + toQuery({
        currency, p: principalRaw, r: rateAnnualRaw, n: tenureMonthsRaw, eom: prepay.enableOneTime ? 1 : 0, eem: prepay.enableExtraMonthly ? 1 : 0, ota: prepay.oneTimeAmount, otm: prepay.oneTimeMonth, xm: prepay.extraMonthly, cmp: compare.enabled ? 1 : 0, cr: compare.loanB.rateAnnual, cn: compare.loanB.tenureMonths,
      });
      await navigator.clipboard.writeText(url);
      push("Sharable link copied to clipboard");
    } catch {
      push("Could not copy link");
    }
  };

  const exportCSV = () => {
    const csv = scheduleToCSV(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "amortization_schedule.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    push("Schedule CSV exported");
  };
  const printResults = () => window.print();

  // Init from query
  useEffect(() => {
    const q = fromQuery(typeof window !== "undefined" ? window.location.search : "");
    if (q.currency && ["$", "₹", "€", "£"].includes(q.currency)) setCurrency(q.currency as Currency);
    if (q.p) setPrincipalRaw(Math.max(0, Number(q.p)));
    if (q.r) setRateAnnualRaw(Math.max(0, Number(q.r)));
    if (q.n) setTenureMonthsRaw(Math.max(1, Math.floor(Number(q.n))));
    if (q.eom) setPrepay((s) => ({ ...s, enableOneTime: q.eom === "1" }));
    if (q.eem) setPrepay((s) => ({ ...s, enableExtraMonthly: q.eem === "1" }));
    if (q.ota) setPrepay((s) => ({ ...s, oneTimeAmount: Math.max(0, Number(q.ota)) }));
    if (q.otm) setPrepay((s) => ({ ...s, oneTimeMonth: Math.max(1, Math.floor(Number(q.otm))) }));
    if (q.xm) setPrepay((s) => ({ ...s, extraMonthly: Math.max(0, Number(q.xm)) }));
    if (q.cmp === "1") setCompare((c) => ({ ...c, enabled: true }));
    if (q.cr) setCompare((c) => ({ ...c, loanB: { ...c.loanB, rateAnnual: Math.max(0, Number(q.cr)) } }));
    if (q.cn) setCompare((c) => ({ ...c, loanB: { ...c.loanB, tenureMonths: Math.max(1, Math.floor(Number(q.cn))) } }));
  }, []);

  // Deferred for typing smoothness
  const emiDeferred = useDeferredValue(emi);
  const totalAmountDeferred = useDeferredValue(totalAmount);
  const totalInterestDeferred = useDeferredValue(totalInterest);

  // Comparison loan memo
  const loanB = useMemo(() => {
    if (!compare.enabled) return null;
    const rM = compare.loanB.rateAnnual / 100 / 12;
    const emiB = calcEMI(principal, rM, compare.loanB.tenureMonths);
    const totalB = emiB * compare.loanB.tenureMonths;
    const intB = totalB - principal;
    return { emi: emiB, total: totalB, interest: intB, r: compare.loanB.rateAnnual, n: compare.loanB.tenureMonths };
  }, [compare, principal]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow">Loan EMI Calculator</h1>
        <p className="text-slate-300">
          Calculate your monthly EMI, interest, and total payment. Switch to <span className="text-cyan-300 font-semibold">Advanced Mode</span> for prepayments,
          charts, schedule, and comparisons.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
  <div className="flex items-center gap-3 flex-wrap">
    {/* Mode Switch Button */}
    <button
      onClick={() => setMode(mode === "basic" ? "advanced" : "basic")}
      className={`relative inline-flex items-center justify-center transition-all duration-300 ease-in-out
        w-32 sm:w-28 h-12 sm:h-10 rounded-full border border-slate-700 shadow-md
        ${mode === "advanced" ? "bg-cyan-600" : "bg-slate-800"}`}
    >
      {/* Toggle Knob */}
      <span
        className={`absolute left-1 w-9 h-9 sm:w-8 sm:h-8 bg-white rounded-full shadow-md transform transition-transform duration-300
          ${mode === "advanced" ? "translate-x-[5.3rem] sm:translate-x-[4.5rem]" : "translate-x-0"}`}
      ></span>

      {/* Mode Label */}
      <span
        className={`relative z-10 text-sm sm:text-xs font-semibold w-full text-center transition-colors duration-300
          ${mode === "advanced" ? "text-white" : "text-slate-300"}`}
      >
        {mode === "advanced" ? "Advanced" : "Basic"}
      </span>
    </button>

    {/* Description Text */}
    <div className="text-slate-400 text-sm sm:text-xs leading-snug max-w-[220px] sm:max-w-none">
      {mode === "advanced"
        ? "Advanced Mode: prepayments, charts & schedule"
        : "Basic Mode: simple EMI calculation"}
    </div>
  </div>
</div>


        <div className="text-slate-400 text-sm">Tip: Advanced mode unlocks prepayments, charts, amortization schedule, and comparisons.</div>
      </div>
 
      {/* Basic Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-3">
          <BasicInputs
            currency={currency} setCurrency={setCurrency}
            principal={principalRaw} setPrincipal={setPrincipalRaw}
            rateAnnual={rateAnnualRaw} setRateAnnual={setRateAnnualRaw}
            tenureMonths={tenureMonthsRaw} setTenureMonths={setTenureMonthsRaw}
          />
          <BasicResults
            currencySymbol={currency}
            emi={emiDeferred}
            principal={principal}
            totalInterest={totalInterestDeferred}
            totalAmount={totalAmountDeferred}
          />
      </div>

      {/* Advanced Sections */}
      {mode === "advanced" && (
        <>
          <AdvancedControls
            currencySymbol={currency}
            principal={principalRaw} setPrincipal={setPrincipalRaw}
            rateAnnual={rateAnnualRaw} setRateAnnual={setRateAnnualRaw}
            tenureMonths={tenureMonthsRaw} setTenureMonths={setTenureMonthsRaw}
            prepay={prepay} setPrepay={setPrepay}
            onCopyLink={copyShareLink} onPrint={printResults}
          />

          {/* Lazy-ish render: these sections are mounted only when toggled ON */}
          <div className="flex gap-3 mb-4 mt-4 flex-wrap">
            <label className="flex items-center gap-2 text-slate-300 text-sm cursor-pointer group">
              <span
                className={`relative w-5 h-5 flex items-center justify-center rounded-md border transition-all duration-200
                  ${showCharts ? "border-cyan-400 bg-cyan-500/20" : "border-slate-600 bg-slate-800/70 group-hover:border-cyan-500/50"}`}
              >
                <input
                  type="checkbox"
                  checked={showCharts}
                  onChange={() => setShowCharts(!showCharts)}
                  className="absolute inset-0 opacity-0 cursor-pointer peer"
                />
                <svg
                  className={`w-3 h-3 text-cyan-400 transition-opacity duration-150 ${
                    showCharts ? "opacity-100" : "opacity-0"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              Show Charts
            </label>
            
            <label className="flex items-center gap-2 text-slate-300 text-sm cursor-pointer group">
              <span
                className={`relative w-5 h-5 flex items-center justify-center rounded-md border transition-all duration-200
                  ${showSchedule ? "border-cyan-400 bg-cyan-500/20" : "border-slate-600 bg-slate-800/70 group-hover:border-cyan-500/50"}`}
              >
                <input
                  type="checkbox"
                  checked={showSchedule}
                  onChange={() => setShowSchedule(!showSchedule)}
                  className="absolute inset-0 opacity-0 cursor-pointer peer"
                />
                <svg
                  className={`w-3 h-3 text-cyan-400 transition-opacity duration-150 ${
                    showSchedule ? "opacity-100" : "opacity-0"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              Show Schedule
            </label>

          </div>

          {/* Charts Section */}
          {showCharts ? (
            <Suspense fallback={<BlockSkeleton h={280} />}>
              <ChartsSection
                showYearly={showYearlyBars}
                setShowYearly={setShowYearlyBars}
                principal={principal}
                totalInterest={totalInterest}
                lineData={lineData}
                yearly={yearlyAgg}
              />
            </Suspense>
          ) : null}

          {/* Schedule Table */}
          {showSchedule ? (
            <Suspense fallback={<BlockSkeleton h={360} />}>
              <ScheduleTable
                currencySymbol={currency}
                rows={rows}
                totals={{ totalInterest: scheduleTotals.totalInterest, totalPaid: scheduleTotals.totalPaid, effectiveMonths: scheduleTotals.effectiveMonths }}
                onExportCSV={exportCSV}
              />
            </Suspense>
          ) : null}

          {/* Comparison */}
          <div className="rounded-xl mt-3 shadow-md bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700 p-6">
            <div className="rounded-lg p-6 bg-slate-900/70 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <h3 className="text-lg font-semibold text-cyan-300">Compare Loans</h3>
                <label className="flex items-center gap-2 text-slate-300 text-sm">
                  <label className="relative flex items-center gap-2 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={compare.enabled}
                    onChange={(e) =>
                      setCompare((c) => ({ ...c, enabled: e.target.checked }))
                    }
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer peer"
                  />
                  <span
                    className={`flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all duration-300 ease-in-out 
                      ${
                        compare.enabled
                          ? "border-cyan-400 bg-cyan-500/20 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                          : "border-slate-600 bg-slate-800/70 group-hover:border-cyan-500/40"
                      }`}
                  >
                    <svg
                      className={`w-3 h-3 text-cyan-300 transition-transform duration-200 ${
                        compare.enabled ? "opacity-100 scale-100" : "opacity-0 scale-75"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                </label>

                  Enable
                </label>
              </div>

              {compare.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                    <h4 className="text-slate-200 font-semibold mb-3">Loan A (Current)</h4>
                    <div className="text-sm text-slate-300 space-y-2">
                      <div className="flex justify-between"><span>Rate (p.a.)</span><span>{rateAnnual.toFixed(2)}%</span></div>
                      <div className="flex justify-between"><span>Tenure</span><span>{tenureMonths} months</span></div>
                      <div className="flex justify-between"><span>EMI</span><span>{currency}{fmtCompact(emi)}</span></div>
                      <div className="flex justify-between text-amber-400"><span>Total Interest</span><span>{currency}{fmtCompact(totalInterest)}</span></div>
                      <div className="flex justify-between font-semibold text-emerald-400"><span>Total Payment</span><span>{currency}{fmtCompact(totalAmount)}</span></div>
                    </div>
                  </div>
                  <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                    <h4 className="text-slate-200 font-semibold mb-3">Loan B (Compare)</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                      <div>
                        <label className="block text-slate-400 mb-1">Rate (p.a. %)</label>
                        <input type="number" value={compare.loanB.rateAnnual} min={0} step={0.1}
                          onChange={(e) => setCompare((c) => ({ ...c, loanB: { ...c.loanB, rateAnnual: Number(e.target.value) } }))}
                          className="w-full px-2 py-1.5 rounded-md bg-slate-800/60 border border-slate-700 text-slate-100 text-right focus:ring-2 focus:ring-cyan-500" />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Tenure (months)</label>
                        <input type="number" value={compare.loanB.tenureMonths} min={1}
                          onChange={(e) => setCompare((c) => ({ ...c, loanB: { ...c.loanB, tenureMonths: Math.max(1, Math.floor(Number(e.target.value))) } }))}
                          className="w-full px-2 py-1.5 rounded-md bg-slate-800/60 border border-slate-700 text-slate-100 text-right focus:ring-2 focus:ring-cyan-500" />
                      </div>
                    </div>
                    {loanB && (
                      <div className="text-sm text-slate-300 space-y-2">
                        <div className="flex justify-between"><span>EMI</span><span>{currency}{fmtCompact(loanB.emi)}</span></div>
                        <div className="flex justify-between text-amber-400"><span>Total Interest</span><span>{currency}{fmtCompact(loanB.interest)}</span></div>
                        <div className="flex justify-between font-semibold text-emerald-400"><span>Total Payment</span><span>{currency}{fmtCompact(loanB.total)}</span></div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {compare.enabled && loanB && (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700">
                    <div className="text-slate-400">EMI Difference</div>
                    <div className={`text-lg font-semibold ${loanB.emi < emi ? "text-emerald-400" : "text-amber-400"}`}>{currency}{fmtCompact(Math.abs(emi - loanB.emi))}</div>
                  </div>
                  <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700">
                    <div className="text-slate-400">Total Interest Diff</div>
                    <div className={`text-lg font-semibold ${loanB.interest < totalInterest ? "text-emerald-400" : "text-amber-400"}`}>{currency}{fmtCompact(Math.abs(totalInterest - loanB.interest))}</div>
                  </div>
                  <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700">
                    <div className="text-slate-400">Total Payment Diff</div>
                    <div className={`text-lg font-semibold ${loanB.total < totalAmount ? "text-emerald-400" : "text-amber-400"}`}>{currency}{fmtCompact(Math.abs(totalAmount - loanB.total))}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Toasts */}
      <Toasts toasts={toasts} />
    </div>
  );
};

export default React.memo(LoanEMICalculator_Full);
