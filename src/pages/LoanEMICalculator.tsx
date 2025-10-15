/* LoanEMICalculator_Styled.tsx
   Refactor: Matches FuelCostCalculator coding style (clean sections, subtle cards, Tailwind slate theme)
   Logic/UI untouched: EMI math, prepayment, charts (pure SVG), schedule, comparison, SEO schemas preserved.
*/
import React, { Suspense, useDeferredValue, useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";

// If you use these in your app, you can re-enable imports or keep as-is
import Breadcrumbs from "../components/Breadcrumbs";
import SEOHead from "../components/SEOHead";

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
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2200);
  };
  return { toasts, push };
}
const Toasts: React.FC<{ toasts: Toast[] }> = React.memo(({ toasts }) => (
  <div className="fixed bottom-3 right-3 flex flex-col gap-2 z-[60]">
    {toasts.map((t) => (
      <div key={t.id} className="px-3 py-2 rounded-md bg-slate-800/90 text-white border border-slate-700 shadow">
        {t.msg}
      </div>
    ))}
  </div>
));

/** Utils **/
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

/** Math core (unchanged logic) **/
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
      <path d={`M ${cx} ${cy - r} A ${r} ${r} 0 ${pAngle < Math.PI ? 0 : 1} 1 ${cx} ${cy + r} A ${r} ${r} 0 ${pAngle < Math.PI ? 0 : 1} 1 ${cx} ${cy - r}`} fill="#f59e0b" opacity="0.85"/>
      <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${cx} ${cy} Z`} fill="#10b981" opacity="0.95"/>
      <g fontSize="10" textAnchor="middle" fill="#e2e8f0">
        <text x={cx} y={cy - 2}>Principal: {fmtCompact(principal)}</text>
        <text x={cx} y={cy + 12}>Interest: {fmtCompact(interest)}</text>
      </g>
    </svg>
  );
});
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
      {Array.from({ length: ticks }).map((_, i) => {
        const yy = padding.t + ((h - padding.t - padding.b) * i) / (ticks - 1);
        return <line key={i} x1={padding.l} y1={yy} x2={w - padding.r} y2={yy} stroke="#334155" strokeDasharray="3 3" />;
      })}
      <line x1={padding.l} y1={padding.t} x2={padding.l} y2={h - padding.b} stroke="#64748b" />
      <line x1={padding.l} y1={h - padding.b} x2={w - padding.r} y2={h - padding.b} stroke="#64748b" />
      <path d={d} fill="none" stroke="#22d3ee" strokeWidth="2" />
      <g fontSize="10" fill="#cbd5e1">
        <text x={padding.l} y={12}>Balance</text>
        <text x={w - 42} y={h - 6}>Months</text>
      </g>
    </svg>
  );
});
const BarsYearly: React.FC<{ data: { year: number; principal: number; interest: number }[] }> = React.memo(({ data }) => {
  const w = 560, h = 220, padding = { l: 40, r: 10, t: 10, b: 24 };
  const maxV = Math.max(...data.map(d => d.principal + d.interest), 1);
  const bw = (w - padding.l - padding.r) / (data.length || 1) - 8;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      <line x1={padding.l} y1={h - padding.b} x2={w - padding.r} y2={h - padding.b} stroke="#64748b" />
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

/** -------------------------- SEO Metadata (preserved) --------------------------- **/
export const metadata = {
  title: "Loan EMI Calculator – Fast, Accurate & Mobile-Friendly | Finance Tools",
  description:
    "Calculate your EMI, interest, and loan repayment schedule instantly. Supports prepayment, comparison, and charts. Ultra-fast, mobile-optimized EMI calculator with live results.",
  keywords: [
    "EMI calculator","loan calculator","home loan EMI","car loan EMI","personal loan","prepayment calculator","loan comparison","interest calculator","amortization schedule","finance tools"
  ],
  openGraph: {
    title: "Loan EMI Calculator – Fast & Accurate Online Tool",
    description: "Instantly calculate EMI, interest, and total repayment. Includes prepayment and comparison features.",
    url: "https://calculatorhub.site/loan-emi-calculator",
    siteName: "Finance Tools",
    images: [{ url: "https://calculatorhub.site/og-image-loan-emi.jpg", width: 1200, height: 630, alt: "Loan EMI Calculator Online" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Loan EMI Calculator – Accurate & Fast",
    description: "Calculate EMI, prepayments, and loan schedules instantly. No ads. Free, fast, and responsive.",
    images: ["https://calculatorhub.site/og-image-loan-emi.jpg"],
  },
};
<SEOHead
  title="Loan EMI Calculator – Fast, Accurate & Mobile-Friendly"
  description="Instantly calculate your loan EMI, interest, and total repayment. Supports prepayment, comparison, and charts. Fast, accurate, and mobile-optimized."
  canonical="https://calculatorhub.site/loan-emi-calculator"
  ogImage="/og-image-loan-emi.jpg"
  schemaData={{
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Loan EMI Calculator",
    "description": "Free online Loan EMI Calculator by CalculatorHub. Instantly calculate EMI, interest, and amortization schedule for home, car, and personal loans with prepayment and comparison features.",
    "url": "https://calculatorhub.site/loan-emi-calculator",
  }}
  breadcrumbs={[
    { name: "Finance Tools", url: "/category/finance-tools" },
    { name: "Loan EMI Calculator", url: "/loan-emi-calculator" },
  ]}
/>
<Breadcrumbs items={[
        { name: 'Unit Converters', url: '/category/unit-converters' },
        { name: 'Length Converter', url: '/length-converter' }
      ]} />


/** ---------------------------- Subcomponents (styled to match FuelCost) ---------------------------- **/
const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <div className={`rounded-2xl p-5 sm:p-6 bg-slate-800/70 border border-slate-700 ${className}`}>{children}</div>
);
const SectionTitle: React.FC<{ title: string; subtitle?: string; icon?: React.ReactNode }> = ({ title, subtitle, icon }) => (
  <div className="flex items-start gap-3 mb-4">
    {icon ?? null}
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
      {subtitle && <p className="text-sm text-slate-300 mt-1">{subtitle}</p>}
    </div>
  </div>
);

const BasicInputs: React.FC<{
  currency: Currency;
  setCurrency: (c: Currency) => void;
  principal: number; setPrincipal: (n: number) => void;
  rateAnnual: number; setRateAnnual: (n: number) => void;
  tenureMonths: number; setTenureMonths: (n: number) => void;
}> = React.memo(({ currency, setCurrency, principal, setPrincipal, rateAnnual, setRateAnnual, tenureMonths, setTenureMonths }) => {
  return (
    <Card>
      <SectionTitle title="Loan Details" subtitle="Enter principal, annual rate and tenure" />
      <div className="flex items-center justify-between gap-2 mb-4">
        <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600">
          <option>$</option><option>₹</option><option>€</option><option>£</option>
        </select>
        <button onClick={() => { setPrincipal(0); setRateAnnual(0); setTenureMonths(0); }} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg border border-blue-500/40">
          <span className="inline-flex items-center gap-2"><RotateCcw size={16} /> Reset</span>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-white block mb-2">Loan Amount (Principal)</label>
          <input id="principal" type="number" min={0} step={1000} value={principal} onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600" placeholder="Enter loan amount" />
        </div>
        <div>
          <label className="text-sm text-white block mb-2">Interest Rate (% per annum)</label>
          <input id="rate" type="number" min={0} max={100} step={0.1} value={rateAnnual} onChange={(e) => setRateAnnual(Math.max(0, Number(e.target.value)))}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600" placeholder="Enter annual interest rate" />
        </div>
        <div>
          <label className="text-sm text-white block mb-2">Time Period</label>
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs text-slate-300 mb-1">Years</label>
              <input type="number" min={0} value={Math.floor(tenureMonths / 12)} onChange={(e) => {
                const years = Number(e.target.value); const months = tenureMonths % 12; setTenureMonths(years * 12 + months);
              }} className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600" />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs text-slate-300 mb-1">Months</label>
              <input type="number" min={0} max={11} value={tenureMonths % 12} onChange={(e) => {
                const months = Math.min(11, Number(e.target.value)); const years = Math.floor(tenureMonths / 12); setTenureMonths(years * 12 + months);
              }} className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">{Math.floor(tenureMonths / 12)} years {tenureMonths % 12} months</p>
        </div>
      </div>
    </Card>
  );
});

const BasicResults: React.FC<{
  currencySymbol: string; emi: number; principal: number; totalInterest: number; totalAmount: number;
}> = React.memo(({ currencySymbol, emi, principal, totalInterest, totalAmount }) => (
  <Card>
    <SectionTitle title="EMI Breakdown" />
    <div className="space-y-3">
      <div className="p-4 bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl border border-blue-500/30">
        <p className="text-sm text-slate-300">Monthly EMI</p>
        <p className="text-3xl font-bold text-white">{currencySymbol}{emi.toFixed(2)}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl border border-green-500/30">
          <p className="text-sm text-slate-300">Principal</p>
          <p className="text-xl font-semibold text-white">{currencySymbol}{fmtCompact(principal)}</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-amber-900/30 to-amber-800/30 rounded-xl border border-amber-500/30">
          <p className="text-sm text-slate-300">Total Interest</p>
          <p className="text-xl font-semibold text-white">{currencySymbol}{fmtCompact(totalInterest)}</p>
        </div>
      </div>
      <div className="p-4 bg-slate-700/50 rounded-lg">
        <p className="text-sm text-slate-300">Total Amount Payable</p>
        <p className="text-lg font-semibold text-white">{currencySymbol}{fmtCompact(totalAmount)}</p>
      </div>
    </div>
  </Card>
));

const AdvancedControls: React.FC<{
  currencySymbol: string;
  principal: number; setPrincipal: (n: number) => void;
  rateAnnual: number; setRateAnnual: (n: number) => void;
  tenureMonths: number; setTenureMonths: (n: number) => void;
  prepay: PrepaymentSettings; setPrepay: React.Dispatch<React.SetStateAction<PrepaymentSettings>>;
  onCopyLink: () => void; onPrint: () => void;
}> = React.memo(({ currencySymbol, principal, setPrincipal, rateAnnual, setRateAnnual, tenureMonths, setTenureMonths, prepay, setPrepay, onCopyLink, onPrint }) => (
  <Card>
    <SectionTitle title="Advanced Settings" subtitle="Prepayments and quick adjustments" />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Loan Amount ({currencySymbol})</label>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setPrincipal(Math.max(0, principal - 1000))} className="px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg">–</button>
          <input type="number" min={0} step={1000} value={principal} onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
            className="w-28 text-center px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white" />
          <button type="button" onClick={() => setPrincipal(principal + 1000)} className="px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg">+</button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Interest Rate (p.a. %)</label>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setRateAnnual(Math.max(0, Number((rateAnnual - 0.1).toFixed(2))))} className="px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg">–</button>
          <input type="number" step={0.1} min={0} max={36} value={rateAnnual} onChange={(e) => setRateAnnual(Math.max(0, Number(e.target.value)))}
            className="w-24 text-center px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white" />
          <button type="button" onClick={() => setRateAnnual(Math.min(36, Number((rateAnnual + 0.1).toFixed(2))))} className="px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg">+</button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Tenure (months)</label>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setTenureMonths(Math.max(1, tenureMonths - 1))} className="px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg">–</button>
          <input type="number" min={1} max={480} value={tenureMonths} onChange={(e) => setTenureMonths(Math.max(1, Number(e.target.value)))}
            className="w-20 text-center px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white" />
          <button type="button" onClick={() => setTenureMonths(Math.min(480, tenureMonths + 1))} className="px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg">+</button>
        </div>
        <p className="text-xs text-slate-400 mt-1">{Math.floor(tenureMonths / 12)} years {tenureMonths % 12} months</p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <div className="bg-slate-700/40 p-4 rounded-lg border border-slate-600 space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-slate-200 font-medium">One-time Lump Sum</label>
          <input type="checkbox" checked={prepay.enableOneTime} onChange={(e) => setPrepay((s) => ({ ...s, enableOneTime: e.target.checked }))} className="accent-cyan-500" />
        </div>
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${prepay.enableOneTime ? "" : "opacity-50 pointer-events-none"}`}>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Amount</label>
            <input type="number" value={prepay.oneTimeAmount} onChange={(e) => setPrepay(s => ({ ...s, oneTimeAmount: Math.max(0, Number(e.target.value)) }))}
              className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"/>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Month #</label>
            <input type="number" value={prepay.oneTimeMonth} onChange={(e) => setPrepay(s => ({ ...s, oneTimeMonth: Math.max(1, Math.floor(Number(e.target.value))) }))}
              className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"/>
          </div>
        </div>
      </div>

      <div className="bg-slate-700/40 p-4 rounded-lg border border-slate-600 space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-slate-200 font-medium">Extra Monthly Payment</label>
          <input type="checkbox" checked={prepay.enableExtraMonthly} onChange={(e) => setPrepay((s) => ({ ...s, enableExtraMonthly: e.target.checked }))} className="accent-cyan-500" />
        </div>
        <div className={`${prepay.enableExtraMonthly ? "" : "opacity-50 pointer-events-none"}`}>
          <label className="block text-sm text-slate-300 mb-1">Extra per month</label>
          <input type="number" value={prepay.extraMonthly} onChange={(e) => setPrepay(s => ({ ...s, extraMonthly: Math.max(0, Number(e.target.value)) }))}
            className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"/>
        </div>
      </div>
    </div>

    <div className="flex gap-2 mt-4">
      <button onClick={onCopyLink} className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 text-sm">Copy Link</button>
      <button onClick={onPrint} className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 text-sm">Print</button>
    </div>
  </Card>
));

const ChartsSection: React.FC<{
  showYearly: boolean; setShowYearly: (b: boolean) => void;
  principal: number; totalInterest: number; lineData: { month: number; balance: number }[]; yearly: { year: number; principal: number; interest: number }[];
}> = React.memo(({ showYearly, setShowYearly, principal, totalInterest, lineData, yearly }) => (
  <Card>
    <SectionTitle title="Visualizations" subtitle="See principal, interest and balance trends" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600 h-[220px]">
        <h4 className="text-slate-200 mb-2 font-semibold">Principal vs Interest</h4>
        <PieTwoSlice principal={principal} interest={totalInterest} />
      </div>
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600 lg:col-span-2 h-[220px]">
        <h4 className="text-slate-200 mb-2 font-semibold">Balance Over Time</h4>
        <LineBalance data={lineData} />
      </div>
    </div>
    <div className="mt-4">
      <button onClick={() => setShowYearly(!showYearly)} className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-100 text-sm">
        {showYearly ? "Hide Yearly Bars" : "Show Yearly Bars"}
      </button>
    </div>
    {showYearly && (
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600 h-[260px] mt-4">
        <h4 className="text-slate-200 mb-2 font-semibold">Yearly Interest vs Principal</h4>
        <BarsYearly data={yearly} />
      </div>
    )}
  </Card>
));

const ScheduleTable: React.FC<{
  currencySymbol: string;
  rows: ScheduleRow[];
  totals: { totalInterest: number; totalPaid: number; effectiveMonths: number };
  onExportCSV: () => void;
}> = React.memo(({ currencySymbol, rows, totals, onExportCSV }) => (
  <Card>
    <SectionTitle title="Amortization Schedule" />
    <div className="flex items-center justify-between mb-3">
      <div className="text-sm text-slate-300">Detailed month-by-month breakdown</div>
      <button onClick={onExportCSV} className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 text-sm">Export CSV</button>
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
  </Card>
));

/** ------------------------------- Page --------------------------------- **/
const LoanEMICalculator_Styled: React.FC = () => {
  // auto-detect currency by locale
  const autoCurrency = useMemo<Currency>(() => {
    try {
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
      emiValue = principal > 0 && rateMonthly > 0 && months > 0 ? calcEMI(principal, rateMonthly, months) : 0;
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-white">Loan EMI Calculator</h1>
        <p className="text-slate-300 mt-1">Calculate your monthly EMI, interest, and total payment. Switch to <span className="text-cyan-300 font-semibold">Advanced Mode</span> for prepayments, charts, schedule, and comparisons.</p>
      </div>

      {/* Mode Toggle */}
      <Card className="mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm text-slate-300">Mode</div>
          <label className="text-xs text-slate-300 flex items-center gap-2">
            <input type="checkbox" checked={mode === "advanced"} onChange={(e) => setMode(e.target.checked ? "advanced" : "basic")} className="accent-blue-500" />
            {mode === "advanced" ? "Advanced" : "Basic"}
          </label>
        </div>
        <div className="text-slate-400 text-sm mt-2">Tip: Advanced mode unlocks prepayments, charts, amortization schedule, and comparisons.</div>
      </Card>

      {/* Basic Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
          <div className="mt-4">
            <AdvancedControls
              currencySymbol={currency}
              principal={principalRaw} setPrincipal={setPrincipalRaw}
              rateAnnual={rateAnnualRaw} setRateAnnual={setRateAnnualRaw}
              tenureMonths={tenureMonthsRaw} setTenureMonths={setTenureMonthsRaw}
              prepay={prepay} setPrepay={setPrepay}
              onCopyLink={copyShareLink} onPrint={printResults}
            />
          </div>

          <div className="flex gap-3 mb-4 mt-4 flex-wrap">
            <label className="flex items-center gap-2 text-slate-300 text-sm">
              <input type="checkbox" checked={showCharts} onChange={() => setShowCharts(!showCharts)} className="accent-cyan-500" />
              Show Charts
            </label>
            <label className="flex items-center gap-2 text-slate-300 text-sm">
              <input type="checkbox" checked={showSchedule} onChange={() => setShowSchedule(!showSchedule)} className="accent-cyan-500" />
              Show Schedule
            </label>
          </div>

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
          <Card className="mt-4">
            <SectionTitle title="Compare Loans" />
            <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
              <label className="flex items-center gap-2 text-slate-300 text-sm">
                <input type="checkbox" checked={compare.enabled} onChange={(e) => setCompare((c) => ({ ...c, enabled: e.target.checked }))} className="accent-cyan-500" />
                Enable
              </label>
            </div>

            {compare.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className="w-full px-2 py-1.5 rounded-md bg-slate-800/60 border border-slate-700 text-slate-100 text-right" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Tenure (months)</label>
                      <input type="number" value={compare.loanB.tenureMonths} min={1}
                        onChange={(e) => setCompare((c) => ({ ...c, loanB: { ...c.loanB, tenureMonths: Math.max(1, Math.floor(Number(e.target.value))) } }))}
                        className="w-full px-2 py-1.5 rounded-md bg-slate-800/60 border border-slate-700 text-slate-100 text-right" />
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
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
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
          </Card>
        </>
      )}

      {/* Toasts */}
      <Toasts toasts={toasts} />

      {/* ==================== SEO CONTENT SECTION (preserved) ==================== */}
      <section className="prose prose-invert max-w-4xl mx-auto mt-12 leading-relaxed text-slate-300">
        <h1 className="text-3xl font-bold text-cyan-400 mb-6">
          Loan EMI Calculator – Free, Accurate & Instant Results
        </h1>
        <p>
          Our <strong>Loan EMI Calculator</strong> is a simple yet powerful tool that helps you calculate your
          <strong> Equated Monthly Installment (EMI)</strong> in just seconds. Whether you’re planning a
          <strong> home loan, car loan, or personal loan</strong>, this calculator provides instant results for your
          monthly payment, total interest, and overall repayment amount.
        </p>
        <p>
          The EMI formula used here is based on standard banking calculations, ensuring accurate and reliable results.
          You can also explore <strong>advanced features</strong> such as prepayments, extra monthly installments,
          and a full amortization schedule to understand your loan better.
        </p>
        <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">What Is an EMI?</h2>
        <p>EMI stands for <em>Equated Monthly Installment</em> — the fixed payment amount you make every month to repay your loan. Each EMI includes two components:</p>
        <ul>
          <li><strong>Principal:</strong> The original loan amount borrowed from the lender.</li>
          <li><strong>Interest:</strong> The cost of borrowing, calculated on the remaining loan balance.</li>
        </ul>
        <p>As you continue paying EMIs, the interest portion decreases while the principal portion increases, helping you pay off your loan gradually.</p>
        <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">How to Use This Loan EMI Calculator</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Enter your <strong>loan amount (principal)</strong>.</li>
          <li>Set the <strong>annual interest rate</strong> offered by your bank or lender.</li>
          <li>Input the <strong>loan tenure</strong> in years and months.</li>
          <li>Switch to Advanced Mode for prepayments, charts and schedule if needed.</li>
        </ol>
        <p>In <strong>Advanced Mode</strong>, you can also add <em>one-time prepayments</em> or <em>extra monthly payments</em> to see how much faster you can pay off your loan and save on interest.</p>
        <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">EMI Calculation Formula</h2>
        <p>The EMI is calculated using this standard formula:</p>
        <pre className="bg-slate-800 text-slate-200 p-3 rounded-lg overflow-x-auto">EMI = [P × R × (1 + R)^N] / [(1 + R)^N – 1]</pre>
        <ul>
          <li><strong>P</strong> = Principal loan amount</li>
          <li><strong>R</strong> = Monthly interest rate (annual rate ÷ 12 ÷ 100)</li>
          <li><strong>N</strong> = Loan tenure in months</li>
        </ul>
        <p>This formula ensures precise calculation of your monthly EMI based on reducing balance method, which is used by most banks and NBFCs.</p>
        <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">Why Use Our EMI Calculator?</h2>
        <ul className="space-y-2">
          <li>✅ Fast, accurate, and 100% free.</li>
          <li>✅ Works for <strong>home loans, car loans, personal loans</strong>.</li>
          <li>✅ Advanced options for <strong>prepayment and comparison</strong>.</li>
          <li>✅ Generates a detailed <strong>amortization schedule</strong>.</li>
          <li>✅ Mobile-friendly, lightweight, and privacy-friendly.</li>
        </ul>
        <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">Example</h2>
        <p>Suppose you take a <strong>₹10,00,000 home loan</strong> for 20 years at an annual interest rate of 8%. The EMI would be approximately ₹8,364 per month. Over the tenure, you’ll pay ₹10,00,000 principal + ₹10,07,360 interest = ₹20,07,360 total.</p>
      </section>

      <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
        <div className="flex items-center gap-3">
          <img src="/images/calculatorhub-author.webp" alt="CalculatorHub Security Tools Team" className="w-12 h-12 rounded-full border border-gray-600" loading="lazy" />
          <div>
            <p className="font-semibold text-white">Written by the CalculatorHub Security Tools Team</p>
            <p className="text-sm text-slate-400">Experts in web security and online calculator development. Last updated: <time dateTime="2025-10-10">October 10, 2025</time>.</p>
          </div>
        </div>
      </section>

      {/* SEO Schemas preserved */}
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Loan EMI Calculator",
          "url": "https://calculatorhub.site/loan-emi-calculator",
          "description": "Free online Loan EMI Calculator by CalculatorHub. Instantly calculate monthly EMI, total interest, and amortization schedule for home, car, and personal loans with prepayment and comparison features.",
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Finance Tools", "item": "https://calculatorhub.site/category/finance-tools" },
              { "@type": "ListItem", "position": 2, "name": "Loan EMI Calculator", "item": "https://calculatorhub.site/loan-emi-calculator" }
            ]
          },
          "hasPart": {
            "@type": "CreativeWork",
            "name": "Loan EMI Calculator Features",
            "about": [
              "Calculates EMI, total interest, and total payment",
              "Supports home, car, and personal loans",
              "Includes prepayment and extra monthly payment options",
              "Generates amortization schedule and exportable CSV",
              "Works in multiple currencies"
            ]
          }
        })}} />
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is a Loan EMI Calculator?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "A Loan EMI Calculator helps you calculate your monthly Equated Monthly Installment (EMI) for home, car, or personal loans based on principal, interest rate, and tenure."
              }
            },
            {
              "@type": "Question",
              "name": "How do I calculate EMI for my loan?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Enter your loan amount, interest rate, and loan tenure. The calculator instantly shows your monthly EMI, total interest payable, and total repayment amount."
              }
            },
            {
              "@type": "Question",
              "name": "Can I add prepayments in this EMI calculator?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes! The advanced mode allows you to add one-time lump-sum or extra monthly prepayments to see how much faster you can close your loan and save on interest."
              }
            },
            {
              "@type": "Question",
              "name": "Does this calculator support multiple currencies?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. It automatically detects your local currency and lets you switch between ₹, $, €, and £ easily."
              }
            },
            {
              "@type": "Question",
              "name": "Can I export my loan amortization schedule?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, you can download the full repayment schedule as a CSV file with month-wise interest and principal breakdown."
              }
            },
            {
              "@type": "Question",
              "name": "Is this EMI Calculator free to use?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes! The Loan EMI Calculator is completely free, requires no sign-up, and works offline once loaded."
              }
            }
          ]
        })}} />
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Loan EMI Calculator",
          "operatingSystem": "All",
          "applicationCategory": "FinanceApplication",
          "description": "Instantly calculate monthly EMIs, total interest, and amortization schedule for home, car, and personal loans. Supports prepayments, extra monthly payments, and CSV export.",
          "url": "https://calculatorhub.site/loan-emi-calculator",
          "featureList": [
            "Calculate EMI, total interest, and total repayment",
            "Prepayment and extra monthly payment support",
            "Detailed amortization schedule with CSV export",
            "Multi-currency support (₹, $, €, £)",
            "Responsive, mobile-friendly, and ad-free"
          ],
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "1500"
          }
        })}} />
    </div>
  );
};

export default React.memo(LoanEMICalculator_Styled);
