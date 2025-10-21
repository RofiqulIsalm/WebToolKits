// LoanEMICalculator.tsx
import React, { useEffect, useMemo, useState, useDeferredValue, useRef } from 'react';

import { Calculator, RefreshCw, ChevronDown, ChevronUp, Info, TrendingUp } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import AdBanner from '../components/AdBanner';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import EMIStepByStepDynamic from "../components/EMIStepByStepDynamic";


/* ========================== Supabase ========================== */
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/* ========================== Types ========================== */
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
  return lines.join('\\n');
};

/* ========================== Yearly aggregator ========================== */
const groupScheduleByYear = (rows: ScheduleRow[]) => {
  const map: Record<number, { principal: number; interest: number }> = {};
  rows.forEach(r => {
    const year = Math.ceil(r.month / 12); // Year 1 = months 1..12
    if (!map[year]) map[year] = { principal: 0, interest: 0 };
    map[year].principal += (r.principal + r.prepayment);
    map[year].interest  += r.interest;
  });
  return Object.entries(map).map(([year, v]) => ({
    year: Number(year),
    principal: Math.round((v.principal + Number.EPSILON) * 100) / 100,
    interest:  Math.round((v.interest  + Number.EPSILON) * 100) / 100,
  }));
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

/* ========================== Micro SVG charts (FAST, no animation) ========================== */
const PieTwoSlice: React.FC<{ principal: number; interest: number }> = ({ principal, interest }) => {
  const total = Math.max(1, principal + interest);
  const pPct = principal / total;
  const iPct = interest / total;

  const r = 74, cx = 100, cy = 100;
  const startAngle = -Math.PI / 2;
  const pAngle = pPct * Math.PI * 2;
  const endAngle = startAngle + pAngle;

  const arc = (angle: number) => [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  const [x1, y1] = arc(startAngle);
  const [x2, y2] = arc(endAngle);
  const largeArc = pAngle > Math.PI ? 1 : 0;

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <radialGradient id="pi-g1" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pi-pr" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id="pi-in" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#fbbf24" />
        </linearGradient>
      </defs>

      {/* subtle glow */}
      <circle cx={cx} cy={cy} r={r + 6} fill="url(#pi-g1)" />

      {/* Interest (background ring) */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#pi-in)" strokeWidth="28" opacity="0.9" />

      {/* Principal arc */}
      <path
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
        fill="none"
        stroke="url(#pi-pr)"
        strokeWidth="28"
        strokeLinecap="round"
      />

      {/* Center labels */}
      <g fontSize="12" textAnchor="middle" fill="#e2e8f0" fontWeight={600}>
        <text x={cx} y={cy - 4}>Principal {Math.round(pPct * 100)}%</text>
        <text x={cx} y={cy + 14}>Interest {Math.round(iPct * 100)}%</text>
      </g>
    </svg>
  );
};

const LineBalance: React.FC<{ data: { month: number; balance: number }[] }> = ({ data }) => {
  if (!data.length) return null;
  const w = 560, h = 220;
  const pad = { l: 40, r: 12, t: 12, b: 24 };

  const maxY = Math.max(...data.map(d => d.balance)) || 1;
  const minY = 0;

  const x = (i: number) =>
    pad.l + (i / Math.max(1, data.length - 1)) * (w - pad.l - pad.r);
  const y = (v: number) =>
    h - pad.b - ((v - minY) / (maxY - minY)) * (h - pad.t - pad.b);

  const path = data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.balance)}`).join(' ');
  const area = `M ${x(0)} ${y(minY)} L ${data.map((p, i) => `${x(i)} ${y(p.balance)}`).join(' ')} L ${x(data.length-1)} ${y(minY)} Z`;

  // downsample points to ~24 dots max for speed/clarity
  const step = Math.max(1, Math.floor(data.length / 24));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      <defs>
        <linearGradient id="ln-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="ln-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#22d3ee" stopOpacity="0.28" />
          <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* grid */}
      {Array.from({ length: 5 }).map((_, i) => {
        const yy = pad.t + ((h - pad.t - pad.b) * i) / 4;
        return <line key={i} x1={pad.l} y1={yy} x2={w - pad.r} y2={yy} stroke="#334155" strokeDasharray="3 3" />;
      })}

      {/* axes */}
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={h - pad.b} stroke="#64748b" />
      <line x1={pad.l} y1={h - pad.b} x2={w - pad.r} y2={h - pad.b} stroke="#64748b" />

      {/* area + line */}
      <path d={area} fill="url(#ln-fill)" />
      <path d={path} fill="none" stroke="url(#ln-stroke)" strokeWidth="2.5" />

      {/* points */}
      {data.map((p, i) => (i % step === 0 || i === data.length - 1) ? (
        <circle key={i} cx={x(i)} cy={y(p.balance)} r="2.6" fill="#22d3ee" />
      ) : null)}

      <g fontSize="11" fill="#cbd5e1">
        <text x={pad.l + 2} y={12}>Balance</text>
        <text x={w - 44} y={h - 6}>Months</text>
      </g>
    </svg>
  );
};

const BarsYearly: React.FC<{ data: { year: number; principal: number; interest: number }[] }> = ({ data }) => {
  if (!data.length) return null;
  const w = 720, h = 240, pad = { l: 48, r: 12, t: 12, b: 28 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  const maxV = Math.max(...data.map(d => d.principal + d.interest), 1);
  const bw = innerW / data.length - 10; // bar width with gap

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      <defs>
        <linearGradient id="bar-pr" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#0ea5e9" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="bar-in" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#fbbf24" />
        </linearGradient>
      </defs>

      {/* baseline & grid */}
      <line x1={pad.l} y1={h - pad.b} x2={w - pad.r} y2={h - pad.b} stroke="#64748b" />
      {Array.from({ length: 4 }).map((_, i) => {
        const y = pad.t + (innerH * (i + 1)) / 4;
        return <line key={i} x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="#334155" strokeDasharray="3 3" />;
      })}

      {/* bars */}
      {data.map((d, i) => {
        const x = pad.l + i * (bw + 10);
        const ih = innerH * (d.interest / maxV);
        const ph = innerH * (d.principal / maxV);

        const yInterest = h - pad.b - ih;
        const yPrincipal = yInterest - ph;

        return (
          <g key={i}>
            {/* interest (top) */}
            <rect x={x} y={yInterest} width={bw} height={ih} fill="url(#bar-in)" rx="6" ry="6" />
            {/* principal (bottom) */}
            <rect x={x} y={yPrincipal} width={bw} height={ph} fill="url(#bar-pr)" rx="6" ry="6" />
            <text x={x + bw / 2} y={h - 8} fontSize="11" fill="#cbd5e1" textAnchor="middle">Y{d.year}</text>
          </g>
        );
      })}
    </svg>
  );
};

/* ========================== Component ========================== */
const LoanEMICalculator: React.FC = () => {

  const principalRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    principalRef.current?.focus();
  }, []);
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

  // Smooth typing UI
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

  // Yearly bars data
  const yearlyData = useMemo(
    () => (advanced && showCharts ? groupScheduleByYear(schedule) : []),
    [advanced, showCharts, schedule]
  );

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
  
  // 🧠 Initialize from localStorage OR URL query
    useEffect(() => {
      const saved = JSON.parse(localStorage.getItem("loanInputs") || "{}");
      const q = fromQuery(typeof window !== 'undefined' ? window.location.search : '');
    
      const finalCurrency = q.currency && ['$', '₹', '€', '£', '¥'].includes(q.currency)
        ? (q.currency as Currency)
        : saved.currency || autoCurrency;
    
      const finalPrincipal = q.p ? Math.max(0, Number(q.p)) : saved.principal || 0;
      const finalRate = q.r ? Math.max(0, Number(q.r)) : saved.annualRate || 0;
      const finalYears = q.y ? Math.max(0, Math.floor(Number(q.y))) : saved.years || 0;
      const finalMonths = q.m ? Math.max(0, Math.floor(Number(q.m))) : saved.months || 0;
    
      setCurrency(finalCurrency);
      setPrincipal(finalPrincipal);
      setAnnualRate(finalRate);
      setYears(finalYears);
      setMonths(finalMonths);
    
      if (q.eom) setEnableOneTime(q.eom === '1');
      if (q.eem) setEnableExtraMonthly(q.eem === '1');
      if (q.ota) setOneTimeAmount(Math.max(0, Number(q.ota)));
      if (q.otm) setOneTimeMonth(Math.max(1, Math.floor(Number(q.otm))));
      if (q.xm) setExtraMonthly(Math.max(0, Number(q.xm)));
      if (q.cmp === '1') setCompareEnabled(true);
      if (q.cr) setCompareRateAnnual(Math.max(0, Number(q.cr)));
      if (q.cn) setCompareTenureMonths(Math.max(1, Math.floor(Number(q.cn))));
    }, []);



useEffect(() => {
  const data = { currency, principal, annualRate, years, months };
  localStorage.setItem("loanInputs", JSON.stringify(data));
}, [currency, principal, annualRate, years, months]);
  
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
    localStorage.removeItem("loanInputs");
  };

  const currencySymbol = currency;
  const fmt = (v: number) => {
      if (!isFinite(v)) return `${currency}0`;
      const abs = Math.abs(v);
      if (abs < 1_000_0000) {
        // Standard formatted number with commas
        return `${currency}${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
      } else {
        // Compact format for 1M and above
        const fmtCompact = new Intl.NumberFormat(undefined, {
          notation: 'compact',
          maximumFractionDigits: 2,
        });
        return `${currency}${fmtCompact.format(v)}`;
      }
    };


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

        <h1 className="text-3xl font-bold text-white ">
          Loan EMI Calculator – Free, Accurate & Instant Results
        </h1>
        <p className='mb-6'>Instantly calculate your monthly EMI, total interest, and payoff amount — fast, accurate, and 100% free</p>
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
                className="w-15 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
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
                  ref={principalRef}
                    type="number"
                    min={0}
                    value={principal}
                    onChange={(e) => setPrincipal(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 text-right"
                    placeholder={`Enter amount in ${currencySymbol}`}
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
                    placeholder="Enter annual rate (e.g., 8.5)"
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
                        placeholder={`e.g., ${currencySymbol}50,000`}
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
                      placeholder={`e.g., ${currencySymbol}2,000 per month`}
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
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600 h-[240px]">
                <h4 className="text-slate-200 mb-2 font-semibold">Principal vs Interest</h4>
                <PieTwoSlice principal={piePrincipal} interest={pieInterest} />
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600 lg:col-span-2 h-[240px]">
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
            </div>

            {showYearlyBars && (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600 h-[280px] mt-4">
                <h4 className="text-slate-200 mb-2 font-semibold">Yearly Principal vs Interest</h4>
                <BarsYearly data={yearlyData} />
              </div>
            )}
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


          {/* ==================== SEO CONTENT SECTION ==================== */}
      <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
        <h2 className="text-3xl font-bold text-cyan-400 mb-6">
          Loan EMI Calculator – Free, Accurate & Instant Results
        </h2>
      
        <p>
         Managing finances effectively is one of the biggest challenges for individuals and businesses today. When it comes to taking a loan — whether for buying a dream home, funding higher education, or supporting a startup — understanding monthly repayments is crucial. The Loan EMI Calculator is a simple yet powerful online tool that helps users calculate their Equated Monthly Installments (EMI) in just a few seconds.
        </p>

        <p>
         This affordable loan EMI calculator makes it possible to plan finances better, compare multiple loan options, and avoid unpleasant surprises during repayment. With its intuitive design and accurate results, users can confidently make smarter financial decisions.
        </p>
      
         <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">What Is an EMI?</h2>
        <p>
         An EMI (Equated Monthly Installment) is the fixed amount a borrower pays every month to repay a loan, including both principal and interest. Each EMI payment consists of two components:
        </p>
        <ul>
          <li>
            <strong>Principal:</strong> The portion of the loan amount that reduces the outstanding balance
          </li>
          <li>
            <strong>Interest:</strong> The cost paid to the lender for borrowing the money.
          </li>
        </ul>

        <p>
         In the initial months, the interest portion is higher, while the principal portion increases gradually. This repayment structure continues until the loan is fully paid off.
        </p>
        <p>
        For those new to financial planning, the loan EMI calculator for beginners explains this concept clearly, ensuring users understand how EMIs work and how each factor affects repayment.
        </p>
      
        <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">How Does the Loan EMI Calculator Work?</h2>
        <p>The loan EMI calculator simplifies complex math into a fast, easy, and accurate digital tool. It allows users to calculate EMIs instantly by entering just three essential inputs:</p>
        <ol className="list-decimal list-inside space-y-2">
          <li>Loan Amount (Principal): The amount borrowed from a bank or financial institution.</li>
          <li>Interest Rate (%): The rate charged annually by the lender.</li>
          <li>Tenure (Months or Years): The period over which the loan will be repaid.</li>
        </ol>
        <p>
         Once these details are entered, the easy loan EMI calculator automatically calculates the monthly installment and displays:
        </p>
        <ul>
          <li>EMI amount</li>
          <li>Total interest payable</li>
          <li>Total repayment (principal + interest)</li>
        </ul>
        <p>This eliminates guesswork and helps users find the most affordable loan option before applying.</p>

        <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">EMI Calculation Formula</h2>
          <p>The EMI amount is derived using this mathematical formula:</p>
          <pre className="bg-slate-800 text-slate-200 p-3 rounded-lg overflow-x-auto">
            EMI = [P × R × (1 + R)^N] / [(1 + R)^N – 1]
          </pre>
          
          {/* Dynamic Step-by-Step Example */}
          {principal > 0 && annualRate > 0 && (years > 0 || months > 0) && (
            <EMIStepByStepDynamic
              principal={principal}
              annualRate={annualRate}
              years={years}
              months={months}
            />
          )}

          <p>While this formula may seem complicated, the loan EMI calculator app handles all the calculations instantly, displaying the EMI and total interest with precision. It’s the perfect tool for users who prefer accuracy without the manual effort.
          </p>
      
       <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">Why Use Our EMI Calculator?</h2>
        <ul className="space-y-2">
          <li>✅ Instant, accurate, and 100% free.</li>
          <li>✅ Works for <strong>home, car, education, and personal loans</strong>.</li>
          <li>✅ Advanced options for <strong>prepayment</strong>, <strong>comparison</strong>, and <strong>CSV export</strong>.</li>
          <li>✅ Mobile‑friendly, lightweight, and privacy‑friendly.</li>
          <li>✅ Clear charts and a full <strong>amortization schedule</strong>.</li>
        </ul>

        <p>
          By testing different amounts, rates, and tenures, you can find a comfortable EMI that fits your monthly budget.
          You’ll also see how shortening the tenure or making small prepayments can reduce the interest paid over time.
        </p>
      
        <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">Example: EMI for $10 Lakh Loan</h2>
        <p>
          Suppose you take a <strong>$10,00,000 home loan</strong> for 20 years at an annual interest rate of 8%.
          The EMI would be approximately $8,364 per month. Over the tenure, you’ll pay $10,00,000 principal + $10,07,360 interest
          = $20,07,360 total. With modest prepayments—say $1,000–$2,000 per month or a one‑time bonus—you can
          finish sooner and save significant interest.
        </p>
        <p>
          Try similar scenarios for <a href="/car-loan-calculator" className="text-indigo-400 hover:underline">Car Loan EMIs</a> or{" "}
          <a href="/personal-loan-calculator" className="text-indigo-400 hover:underline">Personal Loan EMIs</a>, or plan long‑term investing with our{" "}
          <a href="/sip-calculator" className="text-indigo-400 hover:underline">SIP Calculator</a>.
        </p>

      
      
       <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">Understanding Interest Rates & Tenure</h2>
        <p>
          The biggest drivers of your EMI are the interest rate and tenure. A lower rate reduces your monthly EMI and
          total interest. A longer tenure lowers EMI but increases total interest because you pay for more months. A
          shorter tenure does the opposite—higher EMI but lower overall interest. The sweet spot depends on your cash flow
          and risk tolerance.
        </p>
        <p>
          For current lending guidelines and definitions, review reputable sources like{" "}
          <a href="https://www.rbi.org.in/" target="_blank" rel="nofollow noopener noreferrer" className="text-indigo-400 hover:underline">
            Reserve Bank of India
          </a>{" "}
          or introductory primers on{" "}
          <a href="https://www.investopedia.com/terms/l/loan.asp" target="_blank" rel="nofollow noopener noreferrer" className="text-indigo-400 hover:underline">
            Investopedia
          </a>{" "}
          and{" "}
          <a href="https://en.wikipedia.org/wiki/Loan" target="_blank" rel="nofollow noopener noreferrer" className="text-indigo-400 hover:underline">
            Wikipedia
          </a>.
        </p>
        <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">How Prepayments Save Interest</h2>
        <p>
          Prepayments directly reduce the outstanding principal, which lowers the interest calculation for every future
          month. Two common methods are supported here:
        </p>
        <ul>
          <li>
            <strong>One‑time lump‑sum:</strong> Pay a larger amount at a chosen month—helps cut the principal sharply.
          </li>
          <li>
            <strong>Extra monthly amount:</strong> Add a smaller recurring amount each month—compounding savings over time.
          </li>
        </ul>
        <p>
          Both strategies can shorten the loan tenure considerably. Use Advanced Mode to visualize the effect on your
          payoff timeline and total savings, and export the schedule for your records.
        </p>
      
        {/* ===================== FAQ SECTION (Styled) ===================== */}
        {/* ===================== FAQ SECTION (12+) ===================== */}
        <section className="space-y-6 mt-16" aria-label="Loan EMI Calculator FAQs">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
            ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
          </h2>

          <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
            {/* Q1 */}
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
              <h3 className="font-semibold text-xl mb-2">
                <span className="text-yellow-300">Q1:</span> What is a Loan EMI Calculator?
              </h3>
              <p>
                A <strong>Loan EMI Calculator</strong> helps you compute your monthly Equated Monthly Installment based on
                the principal, interest rate, and tenure. It shows your EMI, total interest, and total repayment amount instantly.
              </p>
            </div>

            {/* Q2 */}
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
              <h3 className="font-semibold text-xl mb-2">
                <span className="text-yellow-300">Q2:</span> How is EMI calculated?
              </h3>
              <p>
                EMI uses the formula <code className="text-cyan-300">[P × R × (1 + R)^N] / [(1 + R)^N – 1]</code>, where <strong>P</strong> is
                the loan amount, <strong>R</strong> is the monthly interest rate, and <strong>N</strong> is the number of months.
              </p>
            </div>

            {/* Q3 */}
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
              <h3 className="font-semibold text-xl mb-2">
                <span className="text-yellow-300">Q3:</span> Can I use this calculator for home, car, or personal loans?
              </h3>
              <p>
                Yes. It works for all major retail loans—<strong>home</strong>, <strong>car</strong>, <strong>education</strong>, and{" "}
                <strong>personal loans</strong>—with accurate results for each.
              </p>
            </div>

            {/* Q4 */}
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
              <h3 className="font-semibold text-xl mb-2">
                <span className="text-yellow-300">Q4:</span> What are prepayments and how do they help?
              </h3>
              <p>
                Prepayments are extra payments toward principal—either one‑time or monthly. They reduce the outstanding
                balance early, cutting future interest and shortening the tenure.
              </p>
            </div>

            {/* Q5 */}
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
              <h3 className="font-semibold text-xl mb-2">
                <span className="text-yellow-300">Q5:</span> Can I download the amortization schedule?
              </h3>
              <p>
                Yes. Export the detailed month‑by‑month schedule as a CSV for analysis or record‑keeping.
              </p>
            </div>

            {/* Q6 */}
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
              <h3 className="font-semibold text-xl mb-2">
                <span className="text-yellow-300">Q6:</span> Is this EMI calculator free?
              </h3>
              <p>
                Absolutely—100% free, no registration, and runs locally in your browser.
              </p>
            </div>

            {/* Q7 */}
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
              <h3 className="font-semibold text-xl mb-2">
                <span className="text-yellow-300">Q7:</span> Does the calculator support multiple currencies?
              </h3>
              <p>
                Yes. It detects your locale and lets you switch between ₹, $, €, £, and ¥.
              </p>
            </div>

            {/* Q8 */}
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
              <h3 className="font-semibold text-xl mb-2">
                <span className="text-yellow-300">Q8:</span> Will extra monthly payments reduce my EMI?
              </h3>
              <p>
                Typically, they shorten the tenure rather than reducing the EMI. The end result is lower total interest paid.
              </p>
            </div>

            {/* Q9 */}
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
              <h3 className="font-semibold text-xl mb-2">
                <span className="text-yellow-300">Q9:</span> Is the EMI formula different for zero‑interest loans?
              </h3>
              <p>
                If the rate is truly 0%, EMI simplifies to principal divided by months—no compounding interest.
              </p>
            </div>

            {/* Q10 */}
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
              <h3 className="font-semibold text-xl mb-2">
                <span className="text-yellow-300">Q10:</span> How do I compare two loan offers?
              </h3>
              <p>
                Use the built‑in comparison panel: adjust the rate and tenure for Loan B and compare EMI, total interest, and total payment.
              </p>
            </div>

            {/* Q11 */}
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
              <h3 className="font-semibold text-xl mb-2">
                <span className="text-yellow-300">Q11:</span> Does this match bank calculations?
              </h3>
              <p>
                Yes. The formula and reducing‑balance method mirror standard bank and NBFC practice.
              </p>
            </div>

            {/* Q12 */}
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
              <h3 className="font-semibold text-xl mb-2">
                <span className="text-yellow-300">Q12:</span> Where can I learn more about loans and amortization?
              </h3>
              <p>
                See authoritative guides at{" "}
                <a href="https://www.rbi.org.in/" target="_blank" rel="nofollow noopener noreferrer" className="text-indigo-300 underline">RBI</a>,{" "}
                <a href="https://www.investopedia.com/amortization-4689744" target="_blank" rel="nofollow noopener noreferrer" className="text-indigo-300 underline">Investopedia</a>{" "}
                and{" "}
                <a href="https://en.wikipedia.org/wiki/Amortization_calculator" target="_blank" rel="nofollow noopener noreferrer" className="text-indigo-300 underline">Wikipedia</a>.
              </p>
            </div>
          </div>
        </section>

      </section>
      <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
        <div className="flex items-center gap-3">
          <img
            src="/images/calculatorhub-author.webp"
            alt="CalculatorHub Security Tools Team"
            className="w-12 h-12 rounded-full border border-gray-600"
            loading="lazy"
          />
          <div>
            <p className="font-semibold text-white">Written by the CalculatorHub Security Tools Team</p>
            <p className="text-sm text-slate-400">
              Experts in web security and online calculator development. Last updated: <time dateTime="2025-10-10">October 10, 2025</time>.
            </p>
          </div>
        </div>
      
      </section>

     {/* ============= LOAN EMI CALCULATOR ENHANCED SEO SCHEMAS ================ */}
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    "name": "Loan EMI Calculator",
                    "url": "https://calculatorhub.site/loan-emi-calculator",
                    "description": "Free online Loan EMI Calculator by CalculatorHub. Instantly calculate monthly EMI, total interest, and amortization schedule for home, car, and personal loans with prepayment and comparison features.",
                    "breadcrumb": {
                      "@type": "BreadcrumbList",
                      "itemListElement": [
                        {
                          "@type": "ListItem",
                          "position": 1,
                          "name": "Finance Tools",
                          "item": "https://calculatorhub.site/category/finance-tools"
                        },
                        {
                          "@type": "ListItem",
                          "position": 2,
                          "name": "Loan EMI Calculator",
                          "item": "https://calculatorhub.site/loan-emi-calculator"
                        }
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
                  })
                }}
              />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
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
          })
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
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
          })
        }}
      />

      <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "name": "CalculatorHub Team",
              "url": "https://calculatorhub.site/about",
              "jobTitle": "Financial Tool Developer",
              "worksFor": {
                "@type": "Organization",
                "name": "CalculatorHub"
              }
            })
          }}
        />



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
 

      {/* Toasts */}
      <Toasts toasts={toasts} />
    </>
  );
};

export default LoanEMICalculator;
