// LoanEMICalculator.tsx
import React, { useEffect, useMemo, useState, useDeferredValue, Suspense } from 'react';
import { Calculator, RefreshCw, ChevronDown, ChevronUp, Info, TrendingUp, RotateCcw } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import AdBanner from '../components/AdBanner';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type Currency = '$' | '€' | '£' | '₹' | '¥';

type ScheduleRow = {
  month: number;
  openingBalance: number;
  interest: number;
  principal: number;
  prepayment: number; // one-time + extra monthly actually paid this month
  closingBalance: number;
};

/* ========================== Small utilities ========================== */
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const fmtCompact = (num: number): string => {
  if (!isFinite(num)) return '0';
  const abs = Math.abs(num);
  if (abs >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (abs >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (abs >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (abs >= 1e3) return (num / 1e3).toFixed(2) + 'K';
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
const scheduleToCSV = (rows: ScheduleRow[]) => {
  const headers = ['Month','Opening Balance','Interest','Principal Paid','Prepayment','Closing Balance'];
  const lines = [headers.join(',')];
  rows.forEach(r => lines.push([
    r.month, r.openingBalance, r.interest, r.principal, r.prepayment, r.closingBalance
  ].map(n => Number(n).toFixed(2)).join(',')));
  return lines.join('\n');
};

/* ========================== Tiny toast (no deps) ========================== */
type Toast = { id: number; msg: string };
function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (msg: string) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2200);
  };
  return { toasts, push };
}
const Toasts: React.FC<{ toasts: Toast[] }> = ({ toasts }) => (
  <div className="fixed bottom-3 right-3 flex flex-col gap-2 z-[60]">
    {toasts.map(t => (
      <div key={t.id} className="px-3 py-2 rounded-md bg-slate-800/90 text-white border border-slate-700 shadow">
        {t.msg}
      </div>
    ))}
  </div>
);

/* ========================== Micro SVG charts ========================== */
const PieTwoSlice: React.FC<{ principal: number; interest: number }> = ({ principal, interest }) => {
  const total = principal + interest || 1;
  const pPct = principal / total;
  const size = 180, r = 70, cx = 90, cy = 90, tau = Math.PI * 2;
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
};
const LineBalance: React.FC<{ data: { month: number; balance: number }[] }> = ({ data }) => {
  const padding = { l: 32, r: 8, t: 8, b: 20 };
  const w = 520, h = 180;
  if (!data.length) return null;
  const maxY = Math.max(...data.map(d => d.balance)) || 1;
  const minY = 0;
  const x = (i: number) => padding.l + (i / (data.length - 1 || 1)) * (w - padding.l - padding.r);
  const y = (v: number) => h - padding.b - ((v - minY) / (maxY - minY)) * (h - padding.t - padding.b);
  const d = data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.balance)}`).join(' ');
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
};

/* ========================== Component ========================== */
const LoanEMICalculator: React.FC = () => {
  // ---------------- Auto-currency by locale (overrideable) ----------------
  const autoCurrency = useMemo<Currency>(() => {
    try {
      const locale = Intl.NumberFormat().resolvedOptions().locale || '';
      if (locale.startsWith('en-IN')) return '₹';
      if (locale.startsWith('en-GB')) return '£';
      if (locale.includes('de') || locale.includes('fr') || locale.includes('es') || locale.includes('it')) return '€';
      return '$';
    } catch { return '$'; }
  }, []);

  // ================================
  // UI / Mode
  // ================================
  const [advanced, setAdvanced] = useState<boolean>(false);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const [showCharts, setShowCharts] = useState<boolean>(false); // Advanced-only
  const [showYearlyBars, setShowYearlyBars] = useState<boolean>(false); // optional bars toggle

  // ================================
  // Inputs
  // ================================
  const [currency, setCurrency] = useState<Currency>(autoCurrency);
  const [principal, setPrincipal] = useState<number>(0);
  const [annualRate, setAnnualRate] = useState<number>(0); // % p.a.
  const [years, setYears] = useState<number>(0);
  const [months, setMonths] = useState<number>(0);

  // Advanced – prepayments (with enable toggles)
  const [enableOneTime, setEnableOneTime] = useState<boolean>(false);
  const [enableExtraMonthly, setEnableExtraMonthly] = useState<boolean>(false);
  const [extraMonthly, setExtraMonthly] = useState<number>(0); // recurring extra toward principal
  const [oneTimeAmount, setOneTimeAmount] = useState<number>(0); // one-time prepayment
  const [oneTimeMonth, setOneTimeMonth] = useState<number>(1); // when to apply (1-indexed)

  // Comparison (Advanced)
  const [compareEnabled, setCompareEnabled] = useState<boolean>(false);
  const [compareRateAnnual, setCompareRateAnnual] = useState<number>(9);
  const [compareTenureMonths, setCompareTenureMonths] = useState<number>(240);

  // Optional assets (e.g., guide image)
  const [guideImageUrl, setGuideImageUrl] = useState<string>('');

  // Toasts
  const { toasts, push } = useToasts();

  // ================================
  // Derived values
  // ================================
  const totalMonths = useMemo(() => Math.max(0, years * 12 + months), [years, months]);
  const monthlyRate = useMemo(() => (annualRate > 0 ? annualRate / 12 / 100 : 0), [annualRate]);

  // EMI (without considering prepayments; prepayments affect schedule/time)
  const baseEmi = useMemo(() => {
    if (totalMonths <= 0) return 0;
    if (monthlyRate === 0) return principal / totalMonths;
    const r = monthlyRate;
    const n = totalMonths;
    return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }, [principal, monthlyRate, totalMonths]);

  // Smooth typing UI (optional but nice)
  const baseEmiDeferred = useDeferredValue(baseEmi);

  // ================================
  // Amortization Schedule (advanced)
  // ================================
  const schedule: ScheduleRow[] = useMemo(() => {
    if (principal <= 0 || totalMonths <= 0) return [];

    let bal = principal;
    let month = 0;
    const rows: ScheduleRow[] = [];
    const maxGuard = totalMonths * 2 + 240; // guard for heavy prepayments

    while (bal > 0.005 && month < maxGuard) {
      month += 1;
      const opening = bal;

      // Interest this month
      const interest = opening * monthlyRate;

      // Base EMI principal portion
      let principalPortion = monthlyRate === 0 ? baseEmi : baseEmi - interest;
      if (principalPortion < 0) principalPortion = 0;

      // Extra / prepayments (respects toggles)
      const thisMonthOneTime = advanced && enableOneTime && oneTimeAmount > 0 && month === Math.max(1, oneTimeMonth) ? oneTimeAmount : 0;
      const extra = advanced && enableExtraMonthly ? Math.max(0, extraMonthly) : 0;
      let prepayment = thisMonthOneTime + extra;

      // Prevent overpay: cap prepayment so closing isn't negative after principal portion
      let closing = opening - principalPortion - prepayment;
      if (closing < 0) {
        const overshoot = -closing;
        // Trim prepayment first
        if (prepayment >= overshoot) {
          prepayment -= overshoot;
          closing = 0;
        } else {
          const needFromPrincipal = overshoot - prepayment;
          principalPortion = Math.max(0, principalPortion - needFromPrincipal);
          closing = 0;
        }
      }

      rows.push({
        month,
        openingBalance: round2(opening),
        interest: round2(Math.max(0, interest)),
        principal: round2(Math.max(0, principalPortion)),
        prepayment: round2(Math.max(0, prepayment)),
        closingBalance: round2(Math.max(0, closing)),
      });

      bal = Math.max(0, closing);
      if (bal === 0) break;
    }

    return rows;
  }, [
    principal,
    totalMonths,
    monthlyRate,
    baseEmi,
    advanced,
    enableExtraMonthly,
    enableOneTime,
    extraMonthly,
    oneTimeAmount,
    oneTimeMonth,
  ]);

  const totals = useMemo(() => {
    if (!schedule.length) {
      return {
        monthsToFinish: 0,
        totalInterest: 0,
        totalPaid: 0,
        monthlyEmi: baseEmi,
      };
    }
    const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);
    const totalPrincipalPaid = schedule.reduce((s, r) => s + r.principal + r.prepayment, 0);
    const totalPaid = totalInterest + totalPrincipalPaid;
    return {
      monthsToFinish: schedule.length,
      totalInterest,
      totalPaid,
      monthlyEmi: baseEmi,
    };
  }, [schedule, baseEmi]);

  // Charts data (Advanced only)
  const lineData = useMemo(
    () => (advanced && showCharts ? schedule.map(r => ({ month: r.month, balance: r.closingBalance })) : []),
    [advanced, showCharts, schedule]
  );
  const piePrincipal = useMemo(() => principal, [principal]);
  const pieInterest = useMemo(() => totals.totalInterest, [totals.totalInterest]);

  // Comparison (Advanced only)
  const loanB = useMemo(() => {
    if (!advanced || !compareEnabled || principal <= 0) return null;
    const rM = compareRateAnnual / 100 / 12;
    const n = Math.max(1, compareTenureMonths);
    const emiB =
      rM === 0 ? principal / n : (principal * rM * Math.pow(1 + rM, n)) / (Math.pow(1 + rM, n) - 1);
    const totalB = emiB * n;
    const intB = totalB - principal;
    return { emi: emiB, total: totalB, interest: intB, r: compareRateAnnual, n };
  }, [advanced, compareEnabled, principal, compareRateAnnual, compareTenureMonths]);

  // ================================
  // Supabase: example asset fetch
  // ================================
  useEffect(() => {
    const loadGuideImage = async () => {
      try {
        const { data, error } = await supabase
          .from('website_settings')
          .select('value')
          .eq('key', 'loan_emi_guide_image')
          .maybeSingle();
        if (data && !error) setGuideImageUrl(data.value);
      } catch (err) {
        console.error('Error loading guide image:', err);
      }
    };
    loadGuideImage();
  }, []);

  // Init from URL query (shareable state)
  useEffect(() => {
    const q = fromQuery(typeof window !== 'undefined' ? window.location.search : '');
    if (q.currency && ['$', '₹', '€', '£', '¥'].includes(q.currency)) setCurrency(q.currency as Currency);
    if (q.p) setPrincipal(Math.max(0, Number(q.p)));
    if (q.r) setAnnualRate(Math.max(0, Number(q.r)));
    if (q.y) setYears(Math.max(0, Math.floor(Number(q.y))));
    if (q.m) setMonths(Math.max(0, Math.floor(Number(q.m))));
    if (q.eom) setEnableOneTime(q.eom === '1');
    if (q.eem) setEnableExtraMonthly(q.eem === '1');
    if (q.ota) setOneTimeAmount(Math.max(0, Number(q.ota)));
    if (q.otm) setOneTimeMonth(Math.max(1, Math.floor(Number(q.otm))));
    if (q.xm) setExtraMonthly(Math.max(0, Number(q.xm)));
    if (q.cmp === '1') setCompareEnabled(true);
    if (q.cr) setCompareRateAnnual(Math.max(0, Number(q.cr)));
    if (q.cn) setCompareTenureMonths(Math.max(1, Math.floor(Number(q.cn))));
  }, []);

  // ================================
  // Handlers
  // ================================
  const resetAll = () => {
    setCurrency(autoCurrency);
    setPrincipal(0);
    setAnnualRate(0);
    setYears(0);
    setMonths(0);
    setAdvanced(false);
    setEnableExtraMonthly(false);
    setEnableOneTime(false);
    setExtraMonthly(0);
    setOneTimeAmount(0);
    setOneTimeMonth(1);
    setShowSchedule(false);
    setShowCharts(false);
    setCompareEnabled(false);
    setCompareRateAnnual(9);
    setCompareTenureMonths(240);
  };

  const fmt = (v: number) =>
    isFinite(v) ? `${currency}${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `${currency}0.00`;

  const copyShareLink = async () => {
    try {
      const url =
        (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '') +
        '?' +
        toQuery({
          currency,
          p: principal,
          r: annualRate,
          y: years,
          m: months,
          eom: enableOneTime ? 1 : 0,
          eem: enableExtraMonthly ? 1 : 0,
          ota: oneTimeAmount,
          otm: oneTimeMonth,
          xm: extraMonthly,
          cmp: compareEnabled ? 1 : 0,
          cr: compareRateAnnual,
          cn: compareTenureMonths,
        });
      await navigator.clipboard.writeText(url);
      push('Sharable link copied to clipboard');
    } catch {
      push('Could not copy link');
    }
  };

  const exportCSV = () => {
    const csv = scheduleToCSV(schedule);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'amortization_schedule.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    push('Schedule CSV exported');
  };
  const printResults = () => window.print();

  // ================================
  // Render
  // ================================
  return (
    <>
      <SEOHead
        title={seoData.loanEmiCalculator?.title || 'Loan EMI Calculator'}
        description={
          seoData.loanEmiCalculator?.description ||
          'Calculate your monthly EMI, total interest and payoff timeline. Advanced mode supports prepayments, charts, comparison, and amortization schedule.'
        }
        canonical="https://calculatorhub.site/loan-emi-calculator"
        schemaData={generateCalculatorSchema(
          'Loan EMI Calculator',
          seoData.loanEmiCalculator?.description ||
            'Calculate EMI, total interest, and payoff timeline with optional prepayments, comparison, charts, and schedule.',
          '/loan-emi-calculator',
          seoData.loanEmiCalculator?.keywords || ['loan', 'emi', 'calculator', 'prepayment', 'amortization']
        )}
        breadcrumbs={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'Loan EMI Calculator', url: '/loan-emi-calculator' },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Breadcrumbs
          items={[
            { name: 'Currency & Finance', url: '/category/currency-finance' },
            { name: 'Loan EMI Calculator', url: '/loan-emi-calculator' },
          ]}
        />

        {/* ===== Mode Toggle ===== */}
        <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 sm:p-5 mb-6 text-slate-200">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="font-semibold">Mode</div>
              <div className="text-sm text-slate-400">
                Tip: Advanced mode unlocks prepayments, charts, amortization schedule, and comparison.
              </div>
            </div>
            <label className="text-xs text-slate-300 flex items-center gap-2">
              <input
                type="checkbox"
                checked={advanced}
                onChange={(e) => setAdvanced(e.target.checked)}
                className="accent-indigo-500"
              />
              {advanced ? 'Advanced' : 'Basic'}
            </label>
          </div>
        </div>

        {/* ===== Main Grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ------- Left: Loan Details ------- */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-slate-100">Loan Details</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyShareLink}
                  className="hidden sm:inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm px-3 py-2 rounded-lg border border-slate-600"
                >
                  Copy Link
                </button>
                <button
                  onClick={resetAll}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-2 rounded-lg"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-4">Enter principal, annual rate and tenure</p>

            {/* Currency */}
            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
              >
                <option value="$">$</option>
                <option value="€">€</option>
                <option value="£">£</option>
                <option value="₹">₹</option>
                <option value="¥">¥</option>
              </select>
            </div>

            {/* Principal */}
            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-1">Loan Amount (Principal)</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPrincipal(Math.max(0, principal - 1000))} className="px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg">–</button>
                <input
                  type="number"
                  min={0}
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 text-right"
                  placeholder="0"
                />
                <button type="button" onClick={() => setPrincipal(principal + 1000)} className="px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg">+</button>
              </div>
            </div>

            {/* Rate */}
            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-1">Interest Rate (% per annum)</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setAnnualRate(Math.max(0, Number((annualRate - 0.1).toFixed(2))))} className="px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg">–</button>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={annualRate}
                  onChange={(e) => setAnnualRate(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 text-right"
                  placeholder="0"
                />
                <button type="button" onClick={() => setAnnualRate(Number((annualRate + 0.1).toFixed(2)))} className="px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg">+</button>
              </div>
            </div>

            {/* Time */}
            <div className="mb-1">
              <label className="block text-sm text-slate-300 mb-1">Time Period</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Years</div>
                  <input
                    type="number"
                    min={0}
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                    placeholder="0"
                  />
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Months</div>
                  <input
                    type="number"
                    min={0}
                    value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-2">{years} years {months} months</div>
            </div>

            {/* Advanced: Prepayments (with enable toggles) */}
            {advanced && (
              <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-4 w-4 text-indigo-400" />
                  <div className="font-semibold text-slate-100 text-sm">Prepayments</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-200 font-medium">One-time Lump Sum</label>
                      <input type="checkbox" className="accent-cyan-500" checked={enableOneTime} onChange={(e) => setEnableOneTime(e.target.checked)} />
                    </div>
                    <div className={`grid grid-cols-2 gap-3 ${enableOneTime ? '' : 'opacity-50 pointer-events-none'}`}>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Amount</label>
                        <input
                          type="number"
                          min={0}
                          value={oneTimeAmount}
                          onChange={(e) => setOneTimeAmount(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Month #</label>
                        <input
                          type="number"
                          min={1}
                          value={oneTimeMonth}
                          onChange={(e) => setOneTimeMonth(Math.max(1, Math.floor(Number(e.target.value))))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-200 font-medium">Extra Monthly Payment</label>
                      <input type="checkbox" className="accent-cyan-500" checked={enableExtraMonthly} onChange={(e) => setEnableExtraMonthly(e.target.checked)} />
                    </div>
                    <div className={`${enableExtraMonthly ? '' : 'opacity-50 pointer-events-none'}`}>
                      <label className="block text-xs text-slate-400 mb-1">Extra per month</label>
                      <input
                        type="number"
                        min={0}
                        value={extraMonthly}
                        onChange={(e) => setExtraMonthly(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button onClick={copyShareLink} className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 text-sm">Copy Link</button>
                  <button onClick={printResults} className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 text-sm">Print</button>
                </div>

                <div className="text-xs text-slate-500 mt-3">
                  Extra/one-time amounts go directly toward principal and can shorten the payoff time substantially.
                </div>
              </div>
            )}
          </div> 

          {/* ------- Right: EMI Breakdown ------- */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 flex flex-col">
            <h2 className="text-xl font-bold text-slate-100 mb-4">EMI Breakdown</h2>

            {/* Monthly EMI */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Calculator className="h-5 w-5 text-indigo-400" />
                <div className="text-sm text-slate-300">Monthly EMI</div>
              </div>
              <div className="text-3xl font-extrabold text-slate-100">{fmt(baseEmiDeferred || 0)}</div>
            </div>

            {/* Principal / Interest */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-xl border border-emerald-800/40 bg-emerald-900/20 p-4">
                <div className="text-sm text-slate-300">Principal</div>
                <div className="text-xl font-semibold text-emerald-300">{fmt(principal)}</div>
              </div>
              <div className="rounded-xl border border-amber-800/40 bg-amber-900/20 p-4">
                <div className="text-sm text-slate-300">Total Interest</div>
                <div className="text-xl font-semibold text-amber-300">{fmt(totals.totalInterest)}</div>
              </div>
            </div>

            {/* Total Payable */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
              <div className="text-sm text-slate-300">Total Amount Payable</div>
              <div className="text-2xl font-bold text-slate-100">{fmt(totals.totalPaid)}</div>
              {advanced && totals.monthsToFinish > 0 && (
                <div className="text-xs text-slate-400 mt-1">
                  Estimated payoff in <span className="text-slate-200 font-semibold">{totals.monthsToFinish}</span>{' '}
                  months {monthlyRate > 0 && '(with current prepayments)'}.
                </div>
              )}
            </div>

          </div>
        </div>
        {/* Advanced toggles under results */}
            {advanced && (
              <div className="mt-6 flex flex-wrap gap-3 justify-end">
                <button
                  onClick={() => setShowCharts(!showCharts)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg border border-slate-600"
                >
                  {showCharts ? 'Hide Charts' : 'Show Charts'}
                </button>
                <button
                  onClick={() => setShowSchedule(!showSchedule)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  {showSchedule ? (
                    <>
                      Hide Amortization <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Show Amortization <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            )}

        {/* ===== Charts (Advanced only) ===== */}
        {advanced && showCharts && (
          <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Visualizations</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600 h-[220px]">
                <h4 className="text-slate-200 mb-2 font-semibold">Principal vs Interest</h4>
                <PieTwoSlice principal={piePrincipal} interest={pieInterest} />
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600 lg:col-span-2 h-[220px]">
                <h4 className="text-slate-200 mb-2 font-semibold">Balance Over Time</h4>
                <LineBalance data={lineData} />
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => setShowYearlyBars(!showYearlyBars)}
                className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-100 text-sm"
              >
                {showYearlyBars ? 'Hide Yearly Bars' : 'Show Yearly Bars'}
              </button>
              {/* Keep placeholder for future stacked bars; omitted here to stay lean */}
            </div>
          </div>
        )}

        {/* ===== Amortization Schedule ===== */}
        {advanced && showSchedule && (
          <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-100">Amortization Schedule</h3>
              <div className="flex gap-2">
                <button onClick={exportCSV} className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 text-sm">Export CSV</button>
                <button onClick={printResults} className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 text-sm">Print</button>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full text-sm border border-slate-700">
                <thead className="bg-slate-800/70 text-slate-300">
                  <tr>
                    <th className="px-4 py-2 border border-slate-700 text-left">Month</th>
                    <th className="px-4 py-2 border border-slate-700 text-right">Opening</th>
                    <th className="px-4 py-2 border border-slate-700 text-right">Interest</th>
                    <th className="px-4 py-2 border border-slate-700 text-right">Principal</th>
                    <th className="px-4 py-2 border border-slate-700 text-right">Prepayment</th>
                    <th className="px-4 py-2 border border-slate-700 text-right">Closing</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((r, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/60'}>
                      <td className="px-4 py-2 border border-slate-800">{r.month}</td>
                      <td className="px-4 py-2 border border-slate-800 text-right">{fmt(r.openingBalance)}</td>
                      <td className="px-4 py-2 border border-slate-800 text-right text-amber-300">{fmt(r.interest)}</td>
                      <td className="px-4 py-2 border border-slate-800 text-right text-emerald-300">{fmt(r.principal)}</td>
                      <td className="px-4 py-2 border border-slate-800 text-right text-cyan-300">{fmt(r.prepayment)}</td>
                      <td className="px-4 py-2 border border-slate-800 text-right font-semibold">{fmt(r.closingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {schedule.map((r, idx) => (
                <div key={idx} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-slate-200">Month {r.month}</div>
                    <TrendingUp className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="text-sm text-slate-300">
                    <div className="flex justify-between"><span>Opening</span><span>{fmt(r.openingBalance)}</span></div>
                    <div className="flex justify-between"><span>Interest</span><span>{fmt(r.interest)}</span></div>
                    <div className="flex justify-between"><span>Principal</span><span>{fmt(r.principal)}</span></div>
                    <div className="flex justify-between"><span>Prepayment</span><span>{fmt(r.prepayment)}</span></div>
                    <div className="flex justify-between"><span>Closing</span><span>{fmt(r.closingBalance)}</span></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 grid sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-emerald-900/20 border border-emerald-800/40 p-3">
                <div className="text-xs text-slate-400">Months to Payoff</div>
                <div className="text-lg font-semibold text-emerald-300">{totals.monthsToFinish}</div>
              </div>
              <div className="rounded-lg bg-amber-900/20 border border-amber-800/40 p-3">
                <div className="text-xs text-slate-400">Total Interest</div>
                <div className="text-lg font-semibold text-amber-300">{fmt(totals.totalInterest)}</div>
              </div>
              <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-3">
                <div className="text-xs text-slate-400">Total Paid</div>
                <div className="text-lg font-semibold text-slate-100">{fmt(totals.totalPaid)}</div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Comparison (Advanced only) ===== */}
        {advanced && (
          <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-100">Compare Loans</h3>
              <label className="flex items-center gap-2 text-slate-300 text-sm">
                <input type="checkbox" className="accent-cyan-500" checked={compareEnabled} onChange={(e) => setCompareEnabled(e.target.checked)} />
                Enable
              </label>
            </div>

            {compareEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                  <h4 className="text-slate-200 font-semibold mb-3">Loan A (Current)</h4>
                  <div className="text-sm text-slate-300 space-y-2">
                    <div className="flex justify-between"><span>Rate (p.a.)</span><span>{annualRate.toFixed(2)}%</span></div>
                    <div className="flex justify-between"><span>Tenure</span><span>{totalMonths} months</span></div>
                    <div className="flex justify-between"><span>EMI</span><span>{currency}{fmtCompact(baseEmi)}</span></div>
                    <div className="flex justify-between text-amber-400"><span>Total Interest</span><span>{currency}{fmtCompact(totals.totalInterest)}</span></div>
                    <div className="flex justify-between font-semibold text-emerald-400"><span>Total Payment</span><span>{currency}{fmtCompact(totals.totalPaid)}</span></div>
                  </div>
                </div>
                <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                  <h4 className="text-slate-200 font-semibold mb-3">Loan B (Compare)</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div>
                      <label className="block text-slate-400 mb-1">Rate (p.a. %)</label>
                      <input
                        type="number"
                        value={compareRateAnnual}
                        min={0}
                        step={0.1}
                        onChange={(e) => setCompareRateAnnual(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2 py-1.5 rounded-md bg-slate-800/60 border border-slate-700 text-slate-100 text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Tenure (months)</label>
                      <input
                        type="number"
                        value={compareTenureMonths}
                        min={1}
                        onChange={(e) => setCompareTenureMonths(Math.max(1, Math.floor(Number(e.target.value))))}
                        className="w-full px-2 py-1.5 rounded-md bg-slate-800/60 border border-slate-700 text-slate-100 text-right"
                      />
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

            {compareEnabled && loanB && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700">
                  <div className="text-slate-400">EMI Difference</div>
                  <div className={`text-lg font-semibold ${loanB.emi < baseEmi ? 'text-emerald-400' : 'text-amber-400'}`}>{currency}{fmtCompact(Math.abs(baseEmi - loanB.emi))}</div>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700">
                  <div className="text-slate-400">Total Interest Diff</div>
                  <div className={`text-lg font-semibold ${loanB.interest < totals.totalInterest ? 'text-emerald-400' : 'text-amber-400'}`}>{currency}{fmtCompact(Math.abs(totals.totalInterest - loanB.interest))}</div>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700">
                  <div className="text-slate-400">Total Payment Diff</div>
                  <div className={`text-lg font-semibold ${loanB.total < totals.totalPaid ? 'text-emerald-400' : 'text-amber-400'}`}>{currency}{fmtCompact(Math.abs(totals.totalPaid - loanB.total))}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== Content / SEO Sections (dark theme) ===== */}
        <div className="max-w-5xl mx-auto mt-10 space-y-10 text-slate-200">
          <h1 className="text-2xl md:text-3xl font-extrabold text-center">
            Loan EMI Calculator – Plan Your Repayments Smartly
          </h1>
          <p className="text-center text-slate-300">
            Compute your monthly EMI, total interest, and total payable with precision. Use Advanced mode to
            simulate prepayments, view charts, compare loans, and export a full amortization schedule.
          </p>

          <AdBanner type="bottom" />

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">How EMI Is Calculated</h2>
            <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-4">
              <code className="text-slate-100">
                <strong>EMI</strong> = P × r × (1 + r)<sup>n</sup> / [(1 + r)<sup>n</sup> − 1]
              </code>
              <ul className="list-disc list-inside mt-3 text-slate-300">
                <li><strong>P</strong> = Principal (loan amount)</li>
                <li><strong>r</strong> = Monthly interest rate (annual rate / 12 / 100)</li>
                <li><strong>n</strong> = Number of monthly installments</li>
              </ul>
            </div>
          </section>

          <AdBanner type="bottom" />

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">Tips to Reduce Interest</h2>
            <ul className="list-disc list-inside text-slate-300">
              <li>Make small recurring prepayments each month.</li>
              <li>Apply one-time lumpsums when possible (bonuses, tax refunds).</li>
              <li>Opt for shorter tenures if affordable — interest compounds over time.</li>
            </ul>
          </section>

          {/* Optional guide image from Supabase */}
          {guideImageUrl && (
            <div className="mt-6">
              <img
                src={guideImageUrl}
                alt="EMI Guide"
                className="w-full max-w-3xl mx-auto rounded-xl border border-slate-700"
              />
            </div>
          )}

          {/* Related Calculators */}
          <RelatedCalculators currentPath="/loan-emi-calculator" category="currency-finance" />
        </div>

        <AdBanner type="bottom" />
      </div>

      {/* Toasts */}
      <Toasts toasts={toasts} />
    </>
  );
};

export default LoanEMICalculator;
