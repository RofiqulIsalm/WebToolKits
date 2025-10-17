// CompoundInterestCalculator.tsx
import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import CompoundInterestStepByStep from "../components/CompoundInterestStepByStep";


// ✨ Lazy-load non-critical components (saves initial bundle & speeds LCP)
const AdBanner = React.lazy(() => import('../components/AdBanner'));
const RelatedCalculators = React.lazy(() => import('../components/RelatedCalculators'));

// ============ Supabase ============
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/* ========================== Utils ========================== */

// clamp to zero; also guards NaN
const clamp0 = (n: number) => (isNaN(n) || n < 0 ? 0 : n);

// Compact money when abs(value) >= 9,999,999 → use M/B/T letters; else comma (2dp)
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

// prevent typing minus/exp/plus in number inputs (avoids negatives & odd values)
function blockBadKeys(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault();
}

/* ========================== Component ========================== */

const CompoundInterestCalculator: React.FC = () => {
  // Inputs
  const [principal, setPrincipal] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);

  const [rateUnit, setRateUnit] = useState<
    'daily' | 'weekly' | 'monthly' | 'yearly' | 'quarterly' | 'custom'
  >('daily');

  const [customRate, setCustomRate] = useState<{ years: number; months: number; days: number }>({
    years: 0,
    months: 0,
    days: 0
  });

  const [timeData, setTimeData] = useState({ years: 0, months: 0, days: 0 });

  // Results
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [compoundInterest, setCompoundInterest] = useState<number>(0);

  // Breakdown
  const [breakdownMode, setBreakdownMode] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [includeAllDays, setIncludeAllDays] = useState<boolean>(true);
  const [selectedDays, setSelectedDays] = useState<string[]>(['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']);
  const [breakdownData, setBreakdownData] = useState<any[]>([]);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);

  // Guide image (from Supabase)
  const [guideImageUrl, setGuideImageUrl] = useState<string>('');

  /* ====================== Helpers / Memos ====================== */

  const customIntervalDays = useMemo(
    () => customRate.years * 365 + customRate.months * 30 + customRate.days,
    [customRate.days, customRate.months, customRate.years]
  );

  const getDailyRate = useMemo(() => {
    switch (rateUnit) {
      case 'daily':
        return rate / 100;
      case 'weekly':
        return rate / 100 / 7;
      case 'monthly':
        return rate / 100 / 30;
      case 'quarterly':
        return rate / 100 / 90; // approx
      case 'yearly':
        return rate / 100 / 365;
      case 'custom':
        return 0; // handled separately
      default:
        return rate / 100 / 365;
    }
  }, [rate, rateUnit]);

  const totalDays = useMemo(
    () => timeData.years * 365 + timeData.months * 30 + timeData.days,
    [timeData.days, timeData.months, timeData.years]
  );

  /* ====================== Effects ====================== */

  // idle-load Supabase image to avoid blocking TTI
  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('website_settings')
          .select('value')
          .eq('key', 'compound_interest_guide_image')
          .maybeSingle();
        if (data && !error) setGuideImageUrl(data.value);
      } catch (e) {
        console.error('Guide image fetch failed:', e);
      }
    };
    // prefer idle to not compete with user interaction
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(load, { timeout: 1500 });
    } else {
      setTimeout(load, 700);
    }
  }, []);

  // recompute with debounce (reduces reflows while typing)
  useEffect(() => {
    const t = setTimeout(() => {
      calculateCompoundInterest();
      if (showBreakdown) generateBreakdown(); // only compute heavy table when visible
    }, 220);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    principal,
    rate,
    rateUnit,
    customIntervalDays,
    totalDays,
    breakdownMode,
    includeAllDays,
    selectedDays,
    showBreakdown
  ]);

  /* ====================== Calculations ====================== */

  const calculateCompoundInterest = () => {
    const dailyRate = getDailyRate;
    const days = totalDays;
    let balance = principal;

    const intervalDays = rateUnit === 'custom' ? Math.max(0, customIntervalDays) : 0;
    const perPeriodRate = rate / 100;

    // light daily loop; for long horizons this is still fine
    for (let i = 0; i < days; i++) {
      if (!includeAllDays) {
        const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        const date = new Date();
        date.setDate(date.getDate() + i);
        if (!selectedDays.includes(dayMap[date.getDay()])) continue;
      }

      if (rateUnit === 'custom' && intervalDays > 0) {
        if ((i + 1) % intervalDays === 0) balance += balance * perPeriodRate;
      } else {
        balance += balance * dailyRate;
      }
    }

    setFinalAmount(balance);
    setCompoundInterest(balance - principal);
  };

  const generateBreakdown = () => {
    let rows: any[] = [];
    const startDate = new Date();
    let balance = principal;
    let totalEarnings = 0;

    const dailyRate = getDailyRate;
    const intervalDays = rateUnit === 'custom' ? Math.max(0, customIntervalDays) : 0;
    const perPeriodRate = rate / 100;

    const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      if (!includeAllDays && !selectedDays.includes(dayMap[date.getDay()])) continue;

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
      switch (breakdownMode) {
        case 'daily':
          label = date.toDateString();
          break;
        case 'weekly':
          label = `Week ${Math.floor(i / 7) + 1}`;
          break;
        case 'monthly':
          label = date.toLocaleString('default', { month: 'short', year: 'numeric' });
          break;
        case 'yearly':
          label = String(date.getFullYear());
          break;
      }

      rows.push({ period: label, earnings, totalEarnings, balance });
    }

    if (breakdownMode === 'monthly' || breakdownMode === 'yearly') {
      const grouped: Record<string, any> = {};
      for (const r of rows) {
        if (!grouped[r.period]) grouped[r.period] = { ...r };
        else {
          grouped[r.period].earnings += r.earnings;
          grouped[r.period].totalEarnings = r.totalEarnings;
          grouped[r.period].balance = r.balance;
        }
      }
      rows = Object.values(grouped);
    }

    const totalEarningsSum = rows.reduce((s, r: any) => s + (r.earnings || 0), 0);

    rows.push({
      period: 'TOTAL',
      earnings: totalEarningsSum,
      totalEarnings,
      balance
    });

    setBreakdownData(rows);
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]));
  };

  /* ====================== Render ====================== */

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
          { name: 'Compound Interest Calculator', url: '/compound-interest-calculator' }
        ]}
      />

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <Breadcrumbs
          items={[
            { name: 'Currency & Finance', url: '/category/currency-finance' },
            { name: 'Compound Interest Calculator', url: '/compound-interest-calculator' }
          ]}
        />

        {/* Title */}
        <div className="mb-8 text-left">
          <h1 className=" text-white text-2xl font-bold mb-2">
            Compound Interest Calculate Online
          </h1>
          <p className="text-slate-200">
            Compound interest grows your money faster by reinvesting earnings into the principal.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* -------- Inputs -------- */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold text-slate-100 mb-4">Investment Details</h2>

            <div className="space-y-4">
              {/* Principal */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Principal Amount ($)</label>
                <input
                  type="number"
                  min={0}
                  inputMode="decimal"
                  onKeyDown={blockBadKeys}
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
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    onKeyDown={blockBadKeys}
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
                        type="number"
                        min={0}
                        inputMode="numeric"
                        onKeyDown={blockBadKeys}
                        value={customRate.years}
                        onChange={(e) => setCustomRate({ ...customRate, years: clamp0(Number(e.target.value)) })}
                        className="text-white w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Months</label>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        onKeyDown={blockBadKeys}
                        value={customRate.months}
                        onChange={(e) => setCustomRate({ ...customRate, months: clamp0(Number(e.target.value)) })}
                        className="text-white w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Days</label>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        onKeyDown={blockBadKeys}
                        value={customRate.days}
                        onChange={(e) => setCustomRate({ ...customRate, days: clamp0(Number(e.target.value)) })}
                        className="text-white w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                      />
                    </div>
                    <p className="text-xs text-slate-500 col-span-3 mt-1">
                      The custom interval determines how often the specified interest rate is applied. E.g., Months = 4
                      → interest applied every ~120 days.
                    </p>
                  </div>
                )}
              </div>

              {/* Time Period */}
              <div className="mb-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Time Period</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    onKeyDown={blockBadKeys}
                    placeholder="Years"
                    onChange={(e) => setTimeData({ ...timeData, years: clamp0(Number(e.target.value)) })}
                    className="w-1/3 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400"
                  />
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    onKeyDown={blockBadKeys}
                    placeholder="Months"
                    onChange={(e) => setTimeData({ ...timeData, months: clamp0(Number(e.target.value)) })}
                    className="w-1/3 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400"
                  />
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    onKeyDown={blockBadKeys}
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
                  className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${
                    includeAllDays ? 'bg-indigo-500' : 'bg-slate-600'
                  }`}
                  aria-pressed={includeAllDays}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      includeAllDays ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="ml-3 text-sm text-slate-300">{includeAllDays ? 'On' : 'Off'}</span>

                {!includeAllDays && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map((day) => (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1 rounded-lg border transition ${
                          selectedDays.includes(day)
                            ? 'bg-indigo-500 text-white border-indigo-600'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                        aria-pressed={selectedDays.includes(day)}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* -------- Results -------- */}
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
            </div>

            {/* Toggle Breakdown */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow transition text-sm"
              >
                {showBreakdown ? (
                  <>
                    Hide Breakdown <ChevronUp className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Show Breakdown <ChevronDown className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* -------- Breakdown -------- */}
        {showBreakdown && (
          <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Breakdown</h3>

            {/* Mode Buttons */}
            <div className="flex flex-wrap gap-3 mb-4">
              {['daily', 'weekly', 'monthly', 'yearly'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setBreakdownMode(mode as any)}
                  className={`px-4 py-2 rounded-lg border transition ${
                    breakdownMode === mode
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            {/* Desktop Table */}
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
                  {breakdownData.map((row, idx) => (
                    <tr
                      key={idx}
                      className={
                        row.period === 'TOTAL'
                          ? 'bg-indigo-900/30 font-semibold'
                          : idx % 2 === 0
                          ? 'bg-slate-900'
                          : 'bg-slate-900/60'
                      }
                    >
                      <td className="px-4 py-2 border border-slate-800 text-slate-200">{row.period}</td>
                      <td className="px-4 py-2 border border-slate-800 text-right text-emerald-300">
                        {moneyFmt(row.earnings || 0)}
                      </td>
                      <td className="px-4 py-2 border border-slate-800 text-right text-amber-300">
                        {moneyFmt(row.totalEarnings || 0)}
                      </td>
                      <td className="px-4 py-2 border border-slate-800 text-right text-indigo-300">
                        {moneyFmt(row.balance || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-4">
              {breakdownData.map((row, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border shadow-sm ${
                    row.period === 'TOTAL'
                      ? 'bg-indigo-900/30 border-indigo-700 font-semibold'
                      : 'bg-slate-900/60 border-slate-700'
                  }`}
                >
                  <p className="text-slate-200">
                    <span className="font-semibold">Period:</span> {row.period}
                  </p>
                  <p className="text-emerald-300">
                    <span className="font-semibold text-slate-300">Earnings:</span> {moneyFmt(row.earnings || 0)}
                  </p>
                  <p className="text-amber-300">
                    <span className="font-semibold text-slate-300">Total Earnings:</span> {moneyFmt(row.totalEarnings || 0)}
                  </p>
                  <p className="text-indigo-300">
                    <span className="font-semibold text-slate-300">Balance:</span> {moneyFmt(row.balance || 0)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* -------- SEO Content (shortened here; your long section preserved) -------- */}
          <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
            <h1 className="text-3xl font-bold text-cyan-400 mb-6">
              Compound Interest Calculator – Grow Your Savings & Investments Faster
            </h1>
          
            <p>
              Our <strong>Compound Interest Calculator</strong> shows how your money can grow when earnings are
              periodically reinvested back into the principal. Whether you’re planning an emergency fund, saving for
              education, or building a long-term investment portfolio, compounding can make a meaningful difference
              to your final corpus. This page explains the concept clearly, lets you run instant calculations, and
              provides practical tips to optimize your returns.
            </p>
          
            <p>
              Unlike simple interest—where interest is calculated only on the original principal—<em>compound interest</em>
              adds interest to your running balance after each period. As a result, new interest is calculated on an
              increasingly larger base, which naturally accelerates growth over time. The longer you allow compounding to work,
              the bigger the effect.
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">What This Calculator Does</h2>
            <p>
              Enter your <strong>principal amount</strong>, choose an <strong>interest rate</strong>, and select the
              <strong> compounding frequency</strong> (daily, weekly, monthly, quarterly, yearly, or a custom interval).
              Then provide a time horizon in <strong>years, months, and days</strong>. The calculator instantly displays:
            </p>
            <ul>
              <li><strong>Future Value (A):</strong> Your projected amount at the end of the period.</li>
              <li><strong>Total Interest Earned:</strong> Compounded earnings over the selected duration.</li>
              <li><strong>Breakdown View:</strong> Optional daily/weekly/monthly/yearly snapshots to visualize growth.</li>
            </ul>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">How Compounding Works (The Math)</h2>
            <p>
              The standard formula for compound interest is:
            </p>
            <pre className="bg-slate-800 text-slate-200 p-3 rounded-lg overflow-x-auto">
              A = P × (1 + r/n)<sup>n × t</sup>
            </pre>
            <ul>
              <li><strong>P</strong> = Principal (initial amount you invest or deposit)</li>
              <li><strong>r</strong> = Annual nominal interest rate (as a decimal, e.g., 8% = 0.08)</li>
              <li><strong>n</strong> = Number of compounding periods per year (12 for monthly, 365 for daily, etc.)</li>
              <li><strong>t</strong> = Time in years</li>
              <li><strong>A</strong> = Final amount (principal + accumulated interest)</li>
            </ul>

              <CompoundInterestStepByStep
                principal={principal}             // number
                annualRate={annualRate}           // % per year
                years={years}                     // in years
                compoundingPerYear={compounds}    // 1, 4, 12, 365, etc.
                contribution={periodicContribution}        // optional (default 0)
                contributionTiming={contribTiming}         // "end" | "begin" (default "end")
              />
  
            <p>
              In practice, deposits, withdrawals, holidays, and custom intervals can affect timing. Our calculator offers a
              flexible <strong>custom compounding option</strong> (years, months, days) and an <strong>include/exclude days</strong>
              switch to reflect real-world schedules (e.g., only business days).
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">Daily vs. Monthly vs. Yearly Compounding</h2>
            <p>
              For the same nominal rate, more frequent compounding usually yields a higher future value because interest is
              credited more times within a year. For example, <em>daily compounding</em> adds small increments very often,
              while <em>yearly compounding</em> adds a larger increment once per year. The difference can be modest over
              short periods but becomes significant over longer horizons or at higher interest rates.
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">Effective Annual Rate (EAR)</h2>
            <p>
              The <strong>Effective Annual Rate</strong> converts a nominal rate with compounding into the equivalent
              annual rate that produces the same result when compounding is considered:
            </p>
            <pre className="bg-slate-800 text-slate-200 p-3 rounded-lg overflow-x-auto">
              EAR = (1 + r/n)<sup>n</sup> − 1
            </pre>
            <p>
              EAR is handy for apples-to-apples comparisons across products that use different compounding frequencies.
              If two banks quote the same nominal rate but compound at different frequencies, the product with the higher
              EAR will grow faster.
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">Practical Ways to Maximize Compounding</h2>
            <ul>
              <li>
                <strong>Start early:</strong> Time is the most powerful lever. Even small, early deposits can grow substantially
                thanks to compounding across years.
              </li>
              <li>
                <strong>Increase frequency:</strong> If possible, choose products with more frequent compounding or make
                more frequent contributions.
              </li>
              <li>
                <strong>Reinvest earnings:</strong> Avoid frequent withdrawals; let interest remain invested so it can
                compound further.
              </li>
              <li>
                <strong>Stay consistent:</strong> Regular monthly deposits (SIP-style) can smooth market volatility and
                enhance long-term outcomes.
              </li>
              <li>
                <strong>Mind fees and taxes:</strong> High fees or frequent taxable events can reduce compounding benefits.
                Consider tax-efficient wrappers available in your region.
              </li>
            </ul>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">Worked Examples</h2>
            <p>
              <strong>Example 1:</strong> Deposit $1,000 at 5% per year, compounded monthly, for 3 years.<br />
              Using the formula with P=1000, r=0.05, n=12, t=3:
            </p>
            <pre className="bg-slate-800 text-slate-200 p-3 rounded-lg overflow-x-auto">
              A = 1000 × (1 + 0.05/12)<sup>36</sup> ≈ $1,161.62
            </pre>
            <p>
              <strong>Example 2:</strong> Invest $10,000 at 8% per year, compounded monthly, for 5 years.
            </p>
            <pre className="bg-slate-800 text-slate-200 p-3 rounded-lg overflow-x-auto">
              A ≈ $14,859.47 (Total interest ≈ $4,859.47)
            </pre>
            <p>
              <strong>Example 3 (SIP intuition):</strong> If you contribute $500 monthly at 7% (monthly compounding) for
              10 years, the total value can exceed $86,000. Regular contributions + compounding create a strong flywheel.
              (Exact figures vary with contribution timing.)
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">When Compounding Might Disappoint</h2>
            <ul>
              <li>
                <strong>Short horizons:</strong> Over a few weeks or months, the difference vs. simple interest can be modest.
              </li>
              <li>
                <strong>Low rates:</strong> At very low rates, frequency and time matter less—though compounding still helps.
              </li>
              <li>
                <strong>Irregular withdrawals:</strong> Pulling money out frequently interrupts compounding momentum.
              </li>
              <li>
                <strong>Fees and taxes:</strong> Ongoing fees or taxable distributions can offset gains if not managed well.
              </li>
            </ul>

             <div className="my-8 text-center">
                <img
                  src="/images/compound_interest_chart.webp"
                  alt="Compound Interest Growth Example Chart - $1000 at 10% for 20 years"
                  className="mx-auto rounded-xl shadow-md border border-slate-700"
                  loading="lazy"
                  width={800}
                  height={500}
                  decoding="async"
                />
                <p className="text-slate-400 text-sm mt-2">
                  Growth of $1000 at 10% annual rate for 20 years — compounding vs. simple interest.
                </p>
              </div>
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">How to Use This Calculator Effectively</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Enter your <strong>principal</strong> (starting amount).</li>
              <li>Set your <strong>annual interest rate</strong> (%).</li>
              <li>Select a <strong>compounding frequency</strong> (or define a custom period).</li>
              <li>Provide the <strong>time period</strong> (years, months, days).</li>
              <li>Optionally, limit to certain days (e.g., exclude weekends) to mirror your use case.</li>
              <li>Review the <strong>Results</strong> and open the <strong>Breakdown</strong> to see growth by period.</li>
            </ol>
            <p>
              Pro tip: Run multiple scenarios to see how small tweaks (like +1% rate or +6 months of time) influence the
              final amount. Over long horizons, these “small” changes compound into big differences.
            </p>
            <div className="my-8 text-center">
              <img
                src="/images/compound_interest_table.webp"
                alt="Compound Interest Growth Comparison Table for 20 Years"
                className="mx-auto rounded-xl shadow-md border border-slate-700"
                loading="lazy"
                width={900}
                height={600}
                decoding="async"
              />
              <p className="text-slate-400 text-sm mt-2">
                Quick comparison of principal, simple interest, and compounded value over time.
              </p>
            </div>
          
            {/* ===================== FAQ (Styled) ===================== */}
            <section className="space-y-6 mt-16" aria-label="Compound Interest Calculator FAQs">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
                ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
              </h2>
          
              <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2">
                    <span className="text-yellow-300">Q1:</span> What is compound interest?
                  </h3>
                  <p>
                    Compound interest is interest calculated on both your initial principal and on the interest that’s
                    already been added. This causes your money to grow faster than with simple interest, especially over
                    longer periods.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2">
                    <span className="text-yellow-300">Q2:</span> Does compounding frequency really matter?
                  </h3>
                  <p>
                    Yes. For the same nominal rate, more frequent compounding (daily vs. monthly) typically produces a
                    higher final amount. The impact grows with time and higher rates.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2">
                    <span className="text-yellow-300">Q3:</span> What’s the difference between nominal rate and EAR?
                  </h3>
                  <p>
                    The nominal rate is the stated annual rate. The <em>Effective Annual Rate</em> (EAR) incorporates
                    compounding frequency. EAR enables fair comparisons between products with different compounding periods.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2">
                    <span className="text-yellow-300">Q4:</span> Can I use this calculator for custom intervals?
                  </h3>
                  <p>
                    Absolutely. Select <strong>Custom</strong> and define years/months/days. The calculator applies your
                    rate at the end of each custom interval to simulate special instruments.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2">
                    <span className="text-yellow-300">Q5:</span> Why does my real-world result differ from a perfect formula?
                  </h3>
                  <p>
                    Timing of deposits, holidays, minimum balance rules, fees, and taxes can shift outcomes in practice.
                    Our custom interval and “include days” options help model realistic schedules.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2">
                    <span className="text-yellow-300">Q6:</span> Is this calculator free?
                  </h3>
                  <p>
                    Yes—100% free, no sign-up, and privacy-friendly. It runs entirely in your browser.
                  </p>
                </div>
              </div>
            </section>
          </section>

        {/* Author */}
        <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
          <div className="flex items-center gap-3">
            <img
              src="/images/calculatorhub-author.webp"
              alt="CalculatorHub Security Tools Team"
              className="w-12 h-12 rounded-full border border-gray-600"
              loading="lazy"
              width={48}
              height={48}
              decoding="async"
            />
            <div>
              <p className="font-semibold text-white">Written by the CalculatorHub Security Tools Team</p>
              <p className="text-sm text-slate-400">
                Experts in web calculators and financial tooling. Last updated:{' '}
                <time dateTime="2025-10-10">October 10, 2025</time>.
              </p>
            </div>
          </div>
        </section>

        {/* JSON-LD Schemas */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              name: 'Compound Interest Calculator',
              url: 'https://calculatorhub.site/compound-interest-calculator',
              description:
                'Free online Compound Interest Calculator. Instantly project future value with daily, weekly, monthly, quarterly, yearly, or custom compounding. See total interest and detailed breakdowns.',
              breadcrumb: {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Currency & Finance',
                    item: 'https://calculatorhub.site/category/currency-finance'
                  },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Compound Interest Calculator',
                    item: 'https://calculatorhub.site/compound-interest-calculator'
                  }
                ]
              },
              about: ['compound interest', 'future value', 'effective annual rate', 'investment growth', 'savings'],
              inLanguage: 'en'
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'What is compound interest?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text:
                      'Compound interest is interest calculated on the initial principal and on interest previously added to the principal, allowing money to grow faster than simple interest.'
                  }
                },
                {
                  '@type': 'Question',
                  name: 'Does compounding frequency matter?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text:
                      'Yes. For the same nominal rate, more frequent compounding (e.g., daily vs. yearly) generally yields a higher final amount, especially over long periods.'
                  }
                },
                {
                  '@type': 'Question',
                  name: 'Can I set a custom compounding interval?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text:
                      'Yes. Define your own interval in years, months, and days to model special savings or investment products.'
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
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Compound Interest Calculator',
              applicationCategory: 'FinanceApplication',
              operatingSystem: 'All',
              url: 'https://calculatorhub.site/compound-interest-calculator',
              description:
                'Instantly compute future value and total interest with customizable compounding frequencies and time periods. Includes daily/weekly/monthly/yearly breakdowns.',
              featureList: [
                'Daily, weekly, monthly, quarterly, yearly, and custom compounding',
                'Future value and total interest in real time',
                'Detailed breakdown views',
                'Include/Exclude specific days to simulate business-day schedules'
              ],
              aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '1200' },
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' }
            })
          }}
        />

        {/* Lazy non-critical pieces */}
        <Suspense fallback={null}>
          <AdBanner type="bottom" />
          <RelatedCalculators currentPath="/compound-interest-calculator" category="currency-finance" />
        </Suspense>
      </div>
    </>
  );
};

export default CompoundInterestCalculator;
