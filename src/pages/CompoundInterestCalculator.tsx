// src/pages/CompoundInterestCalculator_Optimized.tsx
import React, { useEffect, useMemo, useState, Suspense, lazy } from 'react';
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

// ==== lazy chunks (code-split) ====
const RelatedCalculators = lazy(() => import('../components/RelatedCalculators'));
const AdBannerLazy = lazy(() => import('../components/AdBanner'));
const SEOChunk = lazy(() => import('./CompoundInterestSEO')); // the big SEO+FAQ chunk

// Keep SEOHead & Breadcrumbs in main chunk (small + above-the-fold)
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

// ---- tiny util to inject <link> preconnect/preload without Helmet
function useHeadPerfTags() {
  useEffect(() => {
    const tags: HTMLLinkElement[] = [];

    const mk = (attrs: Record<string, string>) => {
      const l = document.createElement('link');
      Object.entries(attrs).forEach(([k, v]) => l.setAttribute(k, v));
      document.head.appendChild(l);
      tags.push(l);
    };

    // Preconnect for Supabase & fonts (adjust to your domains)
    mk({ rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: '' });
    mk({ rel: 'preconnect', href: 'https://fonts.googleapis.com' });
    if (import.meta.env.VITE_SUPABASE_URL) {
      try {
        const u = new URL(import.meta.env.VITE_SUPABASE_URL);
        mk({ rel: 'preconnect', href: u.origin, crossOrigin: '' });
      } catch {}
    }

    // Preload top-fold hero image (adjust path if needed)
    mk({ rel: 'preload', as: 'image', href: '/images/compound_interest_chart.webp', imagesrcset: '/images/compound_interest_chart.webp 1x', fetchpriority: 'high' });

    return () => tags.forEach((t) => document.head.removeChild(t));
  }, []);
}

// --- guard
const clamp0 = (n: number) => (isNaN(n) || n < 0 ? 0 : n);
function blockBadKeys(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault();
}

// --- money short format (letters when >= 9,999,999)
function moneyFmt(value: number, withSymbol: boolean = true) {
  if (!isFinite(value)) return withSymbol ? '$0' : '0';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const sym = withSymbol ? '$' : '';
  if (abs >= 1_000_000_000_000) return `${sign}${sym}${(abs / 1_000_000_000_000).toFixed(2)}T`;
  if (abs >= 1_000_000_000) return `${sign}${sym}${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 9_999_999) return `${sign}${sym}${(abs / 1_000_000).toFixed(2)}M`;
  return `${sign}${sym}${abs.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

// --- dynamic supabase loader (keeps it out of initial bundle)
async function fetchGuideImage(): Promise<string> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    const { data, error } = await supabase
      .from('website_settings')
      .select('value')
      .eq('key', 'compound_interest_guide_image')
      .maybeSingle();
    if (!error && data?.value) return data.value as string;
  } catch {}
  return '';
}

type RateUnit = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'quarterly' | 'custom';
type BreakdownMode = 'daily' | 'weekly' | 'monthly' | 'yearly';

const CompoundInterestCalculator_Optimized: React.FC = () => {
  useHeadPerfTags();

  // ===== state
  const [principal, setPrincipal] = useState(0);
  const [rate, setRate] = useState(0);
  const [rateUnit, setRateUnit] = useState<RateUnit>('daily');

  const [customRate, setCustomRate] = useState({ years: 0, months: 0, days: 0 });

  const [timeData, setTimeData] = useState({ years: 0, months: 0, days: 0 });

  const [finalAmount, setFinalAmount] = useState(0);
  const [compoundInterest, setCompoundInterest] = useState(0);

  const [breakdownMode, setBreakdownMode] = useState<BreakdownMode>('daily');
  const [includeAllDays, setIncludeAllDays] = useState(true);
  const [selectedDays, setSelectedDays] = useState<string[]>(['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const [guideImageUrl, setGuideImageUrl] = useState('');
  useEffect(() => { fetchGuideImage().then(setGuideImageUrl); }, []);

  // ===== helpers
  const customIntervalDays = () => customRate.years * 365 + customRate.months * 30 + customRate.days;

  const getDailyRate = () => {
    switch (rateUnit) {
      case 'daily': return rate / 100;
      case 'weekly': return (rate / 100) / 7;
      case 'monthly': return (rate / 100) / 30;
      case 'quarterly': return (rate / 100) / 90;
      case 'yearly': return (rate / 100) / 365;
      case 'custom': return 0;
      default: return (rate / 100) / 365;
    }
  };

  const getTotalDays = () => (timeData.years * 365) + (timeData.months * 30) + timeData.days;

  // ===== calculations (debounced by useEffect)
  useEffect(() => {
    const t = setTimeout(() => {
      const dailyRate = getDailyRate();
      const totalDays = getTotalDays();
      let balance = principal;

      const intervalDays = rateUnit === 'custom' ? Math.max(0, customIntervalDays()) : 0;
      const perPeriodRate = rate / 100;

      for (let i = 0; i < totalDays; i++) {
        const day = new Date(); day.setDate(day.getDate() + i);
        if (!includeAllDays) {
          const map = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
          if (!selectedDays.includes(map[day.getDay()])) continue;
        }
        if (rateUnit === 'custom' && intervalDays > 0) {
          if ((i + 1) % intervalDays === 0) balance += balance * perPeriodRate;
        } else {
          balance += balance * dailyRate;
        }
      }

      setFinalAmount(balance);
      setCompoundInterest(balance - principal);
    }, 250);
    return () => clearTimeout(t);
  }, [principal, rate, rateUnit, customRate.years, customRate.months, customRate.days, timeData.years, timeData.months, timeData.days, includeAllDays, selectedDays]);

  // ===== memo breakdown (computed only when needed)
  const breakdownData = useMemo(() => {
    if (!showBreakdown) return [];
    const startDate = new Date();
    let balance = principal;
    let totalEarnings = 0;
    const dailyRate = getDailyRate();
    const totalDays = getTotalDays();
    const intervalDays = rateUnit === 'custom' ? Math.max(0, customIntervalDays()) : 0;
    const perPeriodRate = rate / 100;

    const rows: any[] = [];
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate); date.setDate(startDate.getDate() + i);

      if (!includeAllDays) {
        const map = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        if (!selectedDays.includes(map[date.getDay()])) continue;
      }

      let earnings = 0;
      if (rateUnit === 'custom' && intervalDays > 0) {
        if ((i + 1) % intervalDays === 0) {
          earnings = balance * perPeriodRate;
          balance += earnings;
        }
      } else {
        earnings = balance * dailyRate;
        balance += earnings;
      }
      totalEarnings += earnings;

      let label = '';
      if (breakdownMode === 'daily') label = date.toDateString();
      else if (breakdownMode === 'weekly') label = `Week ${Math.floor(i / 7) + 1}`;
      else if (breakdownMode === 'monthly') label = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      else label = date.getFullYear().toString();

      rows.push({ period: label, earnings, totalEarnings, balance });
    }

    if (breakdownMode === 'monthly' || breakdownMode === 'yearly') {
      const grouped: Record<string, any> = {};
      rows.forEach((r) => {
        if (!grouped[r.period]) grouped[r.period] = { ...r };
        else {
          grouped[r.period].earnings += r.earnings;
          grouped[r.period].totalEarnings = r.totalEarnings;
          grouped[r.period].balance = r.balance;
        }
      });
      const data = Object.values(grouped);
      const totalEarningsSum = (data as any[]).reduce((s, r: any) => s + (r.earnings || 0), 0);
      (data as any[]).push({ period: 'TOTAL', earnings: totalEarningsSum, totalEarnings, balance });
      return data;
    } else {
      const totalEarningsSum = rows.reduce((s, r: any) => s + (r.earnings || 0), 0);
      rows.push({ period: 'TOTAL', earnings: totalEarningsSum, totalEarnings, balance });
      return rows;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBreakdown, principal, rate, rateUnit, customRate.years, customRate.months, customRate.days, timeData.years, timeData.months, timeData.days, breakdownMode, includeAllDays, selectedDays]);

  const toggleDay = (d: string) =>
    setSelectedDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  return (
    <>
      <SEOHead
        title={seoData.compoundInterestCalculator.title}
        description={seoData.compoundInterestCalculator.description}
        canonical="https://calculatorhub.site/compound-interest-calculator"
        schemaData={generateCalculatorSchema(
          'Compound Interest Calculator',
          seoData.compoundInterestCalculator.description,
          '/compound-interest-calculator',
          seoData.compoundInterestCalculator.keywords
        )}
        breadcrumbs={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'Compound Interest Calculator', url: '/compound-interest-calculator' },
        ]}
      />

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <Breadcrumbs
          items={[
            { name: 'Currency & Finance', url: '/category/currency-finance' },
            { name: 'Compound Interest Calculator', url: '/compound-interest-calculator' },
          ]}
        />

        {/* Title */}
        <div className="mb-8 text-left text-center">
          <h1 className="text-center text-white text-2xl font-bold mb-2">
            Compounding Calculator – Calculate Compound Interest Online
          </h1>
          <p className="text-slate-200">
            Compound interest grows your money faster by reinvesting earnings into the principal. Our calculator shows future value based on principal, rate, and custom time periods.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold text-slate-100 mb-4">Investment Details</h2>
            <div className="space-y-4">
              {/* Principal */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Principal Amount ($)</label>
                <input
                  type="number" min={0} inputMode="decimal" onKeyDown={blockBadKeys}
                  placeholder="0"
                  onChange={(e) => setPrincipal(clamp0(Number(e.target.value)))}
                  className="text-white placeholder-slate-400 w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Rate */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Interest Rate (%)</label>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                  <input
                    type="number" min={0} step="0.01" inputMode="decimal" onKeyDown={blockBadKeys}
                    onChange={(e) => setRate(clamp0(Number(e.target.value)))}
                    className="text-white placeholder-slate-400 w-full sm:w-auto flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-400"
                    placeholder="%"
                  />
                  <select
                    value={rateUnit}
                    onChange={(e) => setRateUnit(e.target.value as any)}
                    className="text-white mt-2 sm:mt-0 px-1 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Every 3 Months</option>
                    <option value="yearly">Yearly</option>
                    <option value="custom">Custom...</option>
                  </select>
                </div>

                {rateUnit === 'custom' && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Years</label>
                      <input
                        type="number" min={0} inputMode="numeric" onKeyDown={blockBadKeys}
                        value={customRate.years}
                        onChange={(e) => setCustomRate({ ...customRate, years: clamp0(Number(e.target.value)) })}
                        className="text-white w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Months</label>
                      <input
                        type="number" min={0} inputMode="numeric" onKeyDown={blockBadKeys}
                        value={customRate.months}
                        onChange={(e) => setCustomRate({ ...customRate, months: clamp0(Number(e.target.value)) })}
                        className="text-white w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Days</label>
                      <input
                        type="number" min={0} inputMode="numeric" onKeyDown={blockBadKeys}
                        value={customRate.days}
                        onChange={(e) => setCustomRate({ ...customRate, days: clamp0(Number(e.target.value)) })}
                        className="text-white w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                      />
                    </div>
                    <p className="text-xs text-slate-500 col-span-3 mt-1">
                      The custom interval determines how often the specified interest rate is applied. E.g., Months = 4 → interest applied every ~120 days.
                    </p>
                  </div>
                )}
              </div>

              {/* Time Period */}
              <div className="mb-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Time Period</label>
                <div className="flex space-x-2">
                  <input
                    type="number" min={0} inputMode="numeric" onKeyDown={blockBadKeys}
                    placeholder="Years"
                    onChange={(e) => setTimeData({ ...timeData, years: clamp0(Number(e.target.value)) })}
                    className="w-1/3 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400"
                  />
                  <input
                    type="number" min={0} inputMode="numeric" onKeyDown={blockBadKeys}
                    placeholder="Months"
                    onChange={(e) => setTimeData({ ...timeData, months: clamp0(Number(e.target.value)) })}
                    className="w-1/3 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400"
                  />
                  <input
                    type="number" min={0} inputMode="numeric" onKeyDown={blockBadKeys}
                    placeholder="Days"
                    onChange={(e) => setTimeData({ ...timeData, days: clamp0(Number(e.target.value)) })}
                    className="w-1/3 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Include Days Toggle */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Include all days</label>
                <button
                  onClick={() => setIncludeAllDays(!includeAllDays)}
                  className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${includeAllDays ? 'bg-indigo-500' : 'bg-slate-600'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${includeAllDays ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="ml-3 text-sm text-slate-300">{includeAllDays ? 'On' : 'Off'}</span>

                {!includeAllDays && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map((d) => (
                      <button
                        key={d}
                        onClick={() => toggleDay(d)}
                        className={`px-3 py-1 rounded-lg border transition ${selectedDays.includes(d) ? 'bg-indigo-500 text-white border-indigo-600' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-100 mb-4">Results</h2>
              <div className="space-y-6">
                <div className="text-center p-4 bg-emerald-900/20 border border-emerald-800/40 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-100">{moneyFmt(finalAmount)}</div>
                  <div className="text-sm text-slate-400">Final Amount</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-lg text-center">
                    <div className="text-lg font-semibold text-slate-100">{moneyFmt(principal)}</div>
                    <div className="text-sm text-slate-400">Principal</div>
                  </div>
                  <div className="p-4 bg-amber-900/20 border border-amber-800/40 rounded-lg text-center">
                    <div className="text-lg font-semibold text-amber-200">{moneyFmt(compoundInterest)}</div>
                    <div className="text-sm text-slate-400">Compound Interest</div>
                  </div>
                </div>
            </div>

            {/* Toggle Breakdown */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow transition text-sm"
              >
                {showBreakdown ? <>Hide Breakdown <ChevronUp className="ml-2 h-4 w-4" /></> : <>Show Breakdown <ChevronDown className="ml-2 h-4 w-4" /></>}
              </button>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        {showBreakdown && (
          <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Breakdown</h3>
            <div className="flex flex-wrap gap-3 mb-4">
              {(['daily','weekly','monthly','yearly'] as BreakdownMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setBreakdownMode(mode)}
                  className={`px-4 py-2 rounded-lg border transition ${breakdownMode === mode ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800/80 text-slate-300 border-slate-700'}`}
                >
                  {mode[0].toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto hidden sm:block">
              <table className="min-w-full border border-slate-700 text-sm sm:text-base">
                <thead className="bg-slate-800/80 text-slate-300">
                  <tr>
                    <th className="px-4 py-2 border border-slate-700 text-left">Period</th>
                    <th className="px-4 py-2 border border-slate-700 text-right">Earnings</th>
                    <th className="px-4 py-2 border border-slate-700 text-right">Total Earnings</th>
                    <th className="px-4 py-2 border border-slate-700 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdownData.map((row: any, idx: number) => (
                    <tr key={idx} className={row.period === 'TOTAL' ? 'bg-indigo-900/30 font-semibold' : idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/60'}>
                      <td className="px-4 py-2 border border-slate-800 text-slate-200">{row.period}</td>
                      <td className="px-4 py-2 border border-slate-800 text-right text-emerald-300">{moneyFmt(row.earnings || 0)}</td>
                      <td className="px-4 py-2 border border-slate-800 text-right text-amber-300">{moneyFmt(row.totalEarnings || 0)}</td>
                      <td className="px-4 py-2 border border-slate-800 text-right text-indigo-300">{moneyFmt(row.balance || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="sm:hidden space-y-4">
              {breakdownData.map((row: any, idx: number) => (
                <div key={idx} className={`p-4 rounded-lg border shadow-sm ${row.period === 'TOTAL' ? 'bg-indigo-900/30 border-indigo-700 font-semibold' : 'bg-slate-900/60 border-slate-700'}`}>
                  <p className="text-slate-200"><span className="font-semibold">Period:</span> {row.period}</p>
                  <p className="text-emerald-300"><span className="font-semibold text-slate-300">Earnings:</span> {moneyFmt(row.earnings || 0)}</p>
                  <p className="text-amber-300"><span className="font-semibold text-slate-300">Total Earnings:</span> {moneyFmt(row.totalEarnings || 0)}</p>
                  <p className="text-indigo-300"><span className="font-semibold text-slate-300">Balance:</span> {moneyFmt(row.balance || 0)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Above-the-fold ends here. Heavier content lazy-loads below. */}

        {/* SEO/Content, charts & images are in their own chunk */}
        <Suspense fallback={null}>
          <SEOChunk />
        </Suspense>

        {/* Ads and related tools also lazy */}
        <Suspense fallback={null}>
          <AdBannerLazy type="bottom" />
          <RelatedCalculators currentPath="/compound-interest-calculator" category="currency-finance" />
        </Suspense>
      </div>
    </>
  );
};

export default CompoundInterestCalculator_Optimized;
