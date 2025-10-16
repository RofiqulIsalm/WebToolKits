// CompoundInterestCalculator.tsx — Full Dark Theme (keeps your layout/content)
// Notes:
// - Dark palette like LoanEMICalculator (bg-slate-900/70, border-slate-700, text-slate-100/300)
// - All number inputs guard against negatives (min={0} + Math.max in handlers)
// - Result cards show compact letters (K/M/B/T) only when value >= 9,999,999
// - Kept all sections: SEOHead, Breadcrumbs, AdBanner, RelatedCalculators, FAQ, etc.

import React, { useState, useEffect } from 'react';
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// =============== Helpers ===============
const COMPACT_THRESHOLD = 9_999_999;

const clampNonNegative = (v: string | number) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
};

const formatCompactIfHuge = (num: number): string => {
  const abs = Math.abs(num);
  if (abs >= COMPACT_THRESHOLD) {
    if (abs >= 1e12) return (num / 1e12).toFixed(2).replace(/\.00$/, '') + 'T';
    if (abs >= 1e9)  return (num / 1e9 ).toFixed(2).replace(/\.00$/, '') + 'B';
    if (abs >= 1e6)  return (num / 1e6 ).toFixed(2).replace(/\.00$/, '') + 'M';
    if (abs >= 1e3)  return (num / 1e3 ).toFixed(2).replace(/\.00$/, '') + 'K';
  }
  // Standard with commas up to 2 decimals
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const money = (n: number) => `$${formatCompactIfHuge(n)}`;

// =============== Component ===============
const CompoundInterestCalculator: React.FC = () => {
  // State
  const [principal, setPrincipal] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);

  const [rateUnit, setRateUnit] = useState<
    'daily' | 'weekly' | 'monthly' | 'yearly' | 'quarterly' | 'custom'
  >('daily');

  const [customRate, setCustomRate] = useState<{ years: number; months: number; days: number }>({
    years: 0,
    months: 0,
    days: 0,
  });

  const [timeData, setTimeData] = useState({ years: 0, months: 0, days: 0 });

  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [compoundInterest, setCompoundInterest] = useState<number>(0);

  const [breakdownMode, setBreakdownMode] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [includeAllDays, setIncludeAllDays] = useState<boolean>(true);
  const [selectedDays, setSelectedDays] = useState<string[]>(['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']);
  const [breakdownData, setBreakdownData] = useState<any[]>([]);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);
  const [guideImageUrl, setGuideImageUrl] = useState<string>('');

  // Unit helpers
  const customIntervalDays = () => customRate.years * 365 + customRate.months * 30 + customRate.days;

  const getDailyRate = () => {
    switch (rateUnit) {
      case 'daily':     return rate / 100;
      case 'weekly':    return (rate / 100) / 7;
      case 'monthly':   return (rate / 100) / 30;
      case 'quarterly': return (rate / 100) / 90; // ~3 months
      case 'yearly':    return (rate / 100) / 365;
      case 'custom':    return 0; // handled periodically
      default:          return (rate / 100) / 365;
    }
  };

  const getTotalDays = () => (timeData.years * 365) + (timeData.months * 30) + timeData.days;

  // Load guide image
  useEffect(() => {
    const loadGuideImage = async () => {
      try {
        const { data, error } = await supabase
          .from('website_settings')
          .select('value')
          .eq('key', 'compound_interest_guide_image')
          .maybeSingle();
        if (data && !error) setGuideImageUrl(data.value);
      } catch (err) {
        console.error('Error loading guide image:', err);
      }
    };
    loadGuideImage();
  }, []);

  // Recalculate on input changes (with small debounce)
  useEffect(() => {
    const timeout = setTimeout(() => {
      calculateCompoundInterest();
      generateBreakdown();
    }, 300);
    return () => clearTimeout(timeout);
  }, [
    principal,
    rate,
    rateUnit,
    customRate.years,
    customRate.months,
    customRate.days,
    timeData.years,
    timeData.months,
    timeData.days,
    breakdownMode,
    includeAllDays,
    selectedDays,
  ]);

  // Calculations
  const calculateCompoundInterest = () => {
    const dailyRate = getDailyRate();
    const totalDays = getTotalDays();
    let balance = principal;

    const intervalDays = rateUnit === 'custom' ? Math.max(0, customIntervalDays()) : 0;
    const perPeriodRate = rate / 100;

    for (let i = 0; i < totalDays; i++) {
      const day = new Date();
      day.setDate(day.getDate() + i);

      if (!includeAllDays) {
        const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        if (!selectedDays.includes(dayMap[day.getDay()])) continue;
      }

      if (rateUnit === 'custom' && intervalDays > 0) {
        if ((i + 1) % intervalDays === 0) {
          balance += balance * perPeriodRate;
        }
      } else {
        balance += balance * dailyRate;
      }
    }

    setFinalAmount(balance);
    setCompoundInterest(balance - principal);
  };

  const generateBreakdown = () => {
    let data: any[] = [];
    const startDate = new Date();
    let balance = principal;
    let totalEarnings = 0;
    const dailyRate = getDailyRate();
    const totalDays = getTotalDays();

    const intervalDays = rateUnit === 'custom' ? Math.max(0, customIntervalDays()) : 0;
    const perPeriodRate = rate / 100;

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      if (!includeAllDays) {
        const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        if (!selectedDays.includes(dayMap[date.getDay()])) continue;
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
      if (breakdownMode === 'daily')       label = date.toDateString();
      else if (breakdownMode === 'weekly') label = `Week ${Math.floor(i / 7) + 1}`;
      else if (breakdownMode === 'monthly')label = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      else if (breakdownMode === 'yearly') label = date.getFullYear().toString();

      data.push({ period: label, earnings, totalEarnings, balance });
    }

    // Group for monthly/yearly (aggregate)
    if (breakdownMode === 'monthly' || breakdownMode === 'yearly') {
      const grouped: Record<string, any> = {};
      data.forEach((row) => {
        if (!grouped[row.period]) grouped[row.period] = { ...row };
        else {
          grouped[row.period].earnings += row.earnings;
          grouped[row.period].totalEarnings = row.totalEarnings;
          grouped[row.period].balance = row.balance;
        }
      });
      data = Object.values(grouped);
    }

    const totalEarningsSum = data.reduce((s, r: any) => s + (r.earnings || 0), 0);
    data.push({ period: 'TOTAL', earnings: totalEarningsSum, totalEarnings, balance });

    setBreakdownData(data);
  };

  // Toggle selected day
  const toggleDay = (day: string) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  // Render
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

      <div className="max-w-4xl mx-auto p-4 sm:p-6 text-slate-100 bg-slate-900 min-h-screen">
        <Breadcrumbs
          items={[
            { name: 'Currency & Finance', url: '/category/currency-finance' },
            { name: 'Compound Interest Calculator', url: '/compound-interest-calculator' },
          ]}
        />

        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-cyan-300 mb-2">Compounding Calculator – Calculate Compound Interest Online</h1>
          <p className="text-slate-300">
            Compound interest grows your money faster by reinvesting earnings into the principal.
            Our calculator shows your future investment value based on principal, rate, and custom time periods.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ---------------- Investment Inputs ---------------- */}
          <div className="bg-slate-800/70 rounded-2xl shadow-md border border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-indigo-300 mb-4">Investment Details</h2>
            <div className="space-y-4">
              {/* Principal */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Principal Amount ($)</label>
                <input
                  type="number"
                  min={0}
                  inputMode="decimal"
                  onChange={(e) => setPrincipal(clampNonNegative(e.target.value))}
                  onKeyDown={(e) => { if (e.key === '-' ) e.preventDefault(); }}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>

              {/* Rate */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Interest Rate (%)</label>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                  <input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    onChange={(e) => setRate(clampNonNegative(e.target.value))}
                    onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                    className="w-full sm:w-auto flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                  />

                  <select
                    value={rateUnit}
                    onChange={(e) => setRateUnit(e.target.value as any)}
                    className="mt-2 sm:mt-0 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Every 3 Months</option>
                    <option value="yearly">Yearly</option>
                    <option value="custom">Custom...</option>
                  </select>
                </div>

                {/* Custom rate interval inputs */}
                {rateUnit === 'custom' && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Years</label>
                      <input
                        type="number"
                        min={0}
                        value={customRate.years}
                        onChange={(e) => setCustomRate({ ...customRate, years: clampNonNegative(e.target.value) })}
                        onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Months</label>
                      <input
                        type="number"
                        min={0}
                        value={customRate.months}
                        onChange={(e) => setCustomRate({ ...customRate, months: clampNonNegative(e.target.value) })}
                        onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Days</label>
                      <input
                        type="number"
                        min={0}
                        value={customRate.days}
                        onChange={(e) => setCustomRate({ ...customRate, days: clampNonNegative(e.target.value) })}
                        onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <p className="text-xs text-slate-400 col-span-3 mt-1">
                      The custom interval determines how often the specified interest rate is applied.
                      E.g., Months = 4 → interest applied every ~120 days.
                    </p>
                  </div>
                )}
              </div>

              {/* Time Period */}
              <div className="mb-2">
                <label className="block text-sm font-medium text-slate-200 mb-2">Time Period</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min={0}
                    placeholder="Years"
                    value={timeData.years || ''}
                    onChange={(e) => setTimeData({ ...timeData, years: clampNonNegative(e.target.value) })}
                    onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                    className="w-1/3 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Months"
                    value={timeData.months || ''}
                    onChange={(e) => setTimeData({ ...timeData, months: clampNonNegative(e.target.value) })}
                    onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                    className="w-1/3 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Days"
                    value={timeData.days || ''}
                    onChange={(e) => setTimeData({ ...timeData, days: clampNonNegative(e.target.value) })}
                    onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                    className="w-1/3 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              {/* Include Days Toggle */}
              <div className="mt-2">
                <label className="block text-sm font-medium text-slate-200 mb-2">Include all days</label>
                <button
                  onClick={() => setIncludeAllDays(!includeAllDays)}
                  className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${includeAllDays ? 'bg-indigo-500' : 'bg-slate-600'}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${includeAllDays ? 'translate-x-6' : 'translate-x-1'}`}
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
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ---------------- Results ---------------- */}
          <div className="bg-slate-800/70 rounded-2xl shadow-md border border-slate-700 p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold text-emerald-300 mb-4">Results</h2>
              <div className="space-y-6">
                <div className="text-center p-4 bg-slate-900 rounded-lg border border-slate-700">
                  <TrendingUp className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-100">{money(finalAmount)}</div>
                  <div className="text-sm text-slate-400">Final Amount</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-indigo-900/30 rounded-lg text-center border border-indigo-800/40">
                    <div className="text-lg font-semibold text-indigo-300">{money(principal)}</div>
                    <div className="text-sm text-slate-400">Principal</div>
                  </div>
                  <div className="p-4 bg-amber-900/20 rounded-lg text-center border border-amber-800/40">
                    <div className="text-lg font-semibold text-amber-300">{money(compoundInterest)}</div>
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

        {/* ---------------- Breakdown Section ---------------- */}
        {showBreakdown && (
          <div className="mt-8 bg-slate-800/70 rounded-2xl shadow-md border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-cyan-300 mb-4">Breakdown</h3>

            {/* Mode Buttons */}
            <div className="flex flex-wrap gap-3 mb-4">
              {['daily', 'weekly', 'monthly', 'yearly'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setBreakdownMode(mode as any)}
                  className={`px-4 py-2 rounded-lg border transition ${
                    breakdownMode === mode
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="overflow-x-auto hidden sm:block">
              <table className="min-w-full border border-slate-700 text-sm sm:text-base">
                <thead className="bg-slate-900 text-slate-300">
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
                          ? 'bg-slate-900/40'
                          : 'bg-slate-900/20'
                      }
                    >
                      <td className="px-4 py-2 border border-slate-800">{row.period}</td>
                      <td className="px-4 py-2 border border-slate-800 text-right text-emerald-300">
                        ${Number(row.earnings || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 border border-slate-800 text-right text-amber-300">
                        ${Number(row.totalEarnings || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 border border-slate-800 text-right text-indigo-300">
                        ${Number(row.balance || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-4">
              {breakdownData.map((row, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border shadow-sm ${
                    row.period === 'TOTAL'
                      ? 'bg-indigo-900/30 border-indigo-800/50'
                      : 'bg-slate-900/40 border-slate-800'
                  }`}
                >
                  <p className="text-slate-200">
                    <span className="font-semibold">Period:</span> {row.period}
                  </p>
                  <p className="text-emerald-300">
                    <span className="font-semibold text-slate-300">Earnings:</span> ${Number(row.earnings || 0).toFixed(2)}
                  </p>
                  <p className="text-amber-300">
                    <span className="font-semibold text-slate-300">Total Earnings:</span> ${Number(row.totalEarnings || 0).toFixed(2)}
                  </p>
                  <p className="text-indigo-300">
                    <span className="font-semibold text-slate-300">Balance:</span> ${Number(row.balance || 0).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SEO/CONTENT ================= */}
        <div className="max-w-5xl mx-auto p-6 space-y-12 text-slate-100">
          {/* ================= Main Title ================= */}
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-6 text-cyan-300">
            Compound Interest Calculator – Calculate Your Investment Growth Online
          </h2>
          <p className="text-lg md:text-xl text-slate-300 text-center mb-6 leading-relaxed">
            This online calculator helps you quantify the growth of your investments through the power of compounding.
            It supports daily, monthly, yearly, and customizable compounding intervals for savings, SIPs, general investments,
            or retirement planning. You will obtain precise future values based on the principal, the interest rate, and the time period you select.
          </p>

          <AdBanner type="bottom" />

          {/* ================= How to Use ================= */}
          <section className="space-y-4">
            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-indigo-300">How to Use the Compound Interest Calculator</h3>
            <h4 className="text-lg md:text-xl font-semibold mb-2 text-slate-200">Using this investment growth tool is straightforward and efficient:</h4>
            <p className="text-lg leading-relaxed text-slate-300">
              <strong>Enter your principal amount:</strong> Input the initial sum you plan to invest or save.
            </p>
            <p className="text-lg leading-relaxed text-slate-300">
              <strong>Select your interest rate:</strong> Provide the annual rate as a percentage, then the calculator converts it to a decimal for computations.
            </p>
            <p className="text-lg leading-relaxed text-slate-300">
              <strong>Choose a compounding frequency:</strong> Pick daily, monthly, yearly, or a custom interval to reflect how often interest is added to the balance.
            </p>
            <p className="text-lg leading-relaxed text-slate-300">
              <strong>Define the time period:</strong> Specify the duration in years, months, or days, according to your planning horizon.
            </p>
            <p className="text-lg leading-relaxed text-slate-300">
              <strong>View results instantly:</strong> The calculator displays the future value, total interest earned, and overall growth of your investment.
              It also accommodates custom interest rates to model variable scenarios.
            </p>
          </section>

          <AdBanner type="bottom" />

          {/* ================= How It Works ================= */}
          <section className="space-y-4">
            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-indigo-300">How the Compound Interest Calculator Works</h3>
            <p className="text-lg leading-relaxed text-slate-300">
              The calculator uses the <strong>standard compound interest formula</strong>:
            </p>
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
              <code className="text-green-300">
                <strong>A = P × (1 + r/n)^(n × t)</strong>, where:
                <ul className="list-disc list-inside text-lg text-slate-300 space-y-2">
                  <li><strong className="text-yellow-300">A</strong> = Future Value (total amount including interest)</li>
                  <li><strong className="text-yellow-300">P</strong> = Principal Amount</li>
                  <li><strong className="text-yellow-300">r</strong> = Interest Rate (as a decimal)</li>
                  <li><strong className="text-yellow-300">n</strong> = Compounding Frequency (times per year)</li>
                  <li><strong className="text-yellow-300">t</strong> = Time period in years, months, and days</li>
                </ul>
              </code>
            </div>

            <p className="text-lg leading-relaxed text-slate-300">
              <strong>Notes on the inputs:</strong>
            </p>
            <p className="text-lg leading-relaxed text-slate-300">
              The annual rate r should be entered as a percentage and then converted to a decimal by dividing by 100.
              The compounding frequency n determines how many times per year interest is added to the balance (daily, monthly, yearly, or a custom interval).
              The time period t can be expressed in years, months, or days; the calculator handles the appropriate conversion.
              By adjusting the compounding frequency, you can illustrate how more frequent compounding can increase returns under the same nominal rate,
              while also highlighting the sensitivity of outcomes to the chosen horizon.
            </p>
          </section>

          {/* ================= Example Scenarios ================= */}
          <section className="space-y-4">
            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-indigo-300">Example Investment Scenarios</h3>
            <p className="text-lg leading-relaxed text-slate-300">
              Understanding compound interest is easier with practical examples:
            </p>
            <ul className="list-disc list-inside text-lg text-slate-300 space-y-2">
              <li>Deposit <span className="text-yellow-300">$1,000</span> at <span className="text-yellow-300">5%</span> annual interest compounded daily for <span className="text-yellow-300">3 years</span> → Future Value ≈ <span className="text-green-300">$1,161.62</span></li>
              <li>Invest <span className="text-yellow-300">$10,000</span> at <span className="text-yellow-300">8%</span> annual interest monthly for <span className="text-yellow-300">5 years</span> → Future Value ≈ <span className="text-green-300">$14,859.47</span></li>
              <li>Monthly SIP of <span className="text-yellow-300">$500</span> at <span className="text-yellow-300">7%</span> compounded monthly for <span className="text-yellow-300">10 years</span> → Total Future Value ≈ <span className="text-green-300">$86,000</span></li>
              <li>Use custom variable rates for real-world investment modeling</li>
            </ul>

            <p className="text-lg leading-relaxed text-slate-300">
              These examples show how starting early and compounding frequently maximizes returns.
              Even small increases in interest rate or contribution can make a huge difference over time.
            </p>
          </section>

          <AdBanner type="bottom" />

          {/* ================= Benefits ================= */}
          <section className="space-y-4">
            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-indigo-300">Benefits of Using This Compound Interest Calculator</h3>
            <p className="text-lg leading-relaxed text-slate-300">
              Our calculator is ideal for anyone looking to optimize financial growth. Benefits include:
            </p>
            <ul className="list-disc list-inside text-lg text-slate-300 space-y-2">
              <li><strong>Financial Planning:</strong> Project how your savings will grow over time under different compounding schemes.</li>
              <li><strong>Compare Scenarios:</strong> Evaluate the impact of different rates, frequencies, and timeframes side by side.</li>
              <li><strong>Custom Periods:</strong> Enter exact durations to obtain highly accurate results.</li>
              <li><strong>Save Time:</strong> Obtain quick, automatic results without manual computations.</li>
              <li><strong>Visualize Growth:</strong> Access breakdowns and charts that help you understand how value accumulates over time.</li>
              <li><strong>Assess frequency and contributions:</strong> See how changes in compounding frequency and regular contributions affect total value.</li>
              <li><strong>Reinvest earnings:</strong> Allow interest to remain invested to accelerate growth.</li>
              <li><strong>Increase contribution frequency:</strong> More frequent deposits (weekly or monthly) can boost overall returns.</li>
              <li><strong>Start early:</strong> Time is a powerful ally; even modest early investments can yield substantial growth.</li>
              <li><strong>Model variable rates:</strong> Use scenarios with different rates to reflect potential real-world changes.</li>
              <li><strong>Track and adjust:</strong> Regularly review performance and adjust your savings or investment strategy as needed.</li>
            </ul>
          </section>

          {/* ================= Advanced Tips ================= */}
          <section className="space-y-4">
            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-indigo-300">Advanced Tips to Maximize Returns</h3>
            <ul className="list-disc list-inside text-lg text-slate-300 space-y-2">
              <li><strong>Reinvest Earnings:</strong> Allow interest to compound for maximum effect.</li>
              <li><strong>Increase Contribution Frequency:</strong> More frequent deposits lead to higher growth.</li>
              <li><strong>Start Early:</strong> Time is the biggest advantage in compounding.</li>
              <li><strong>Use Variable Rates:</strong> Custom rate inputs allow realistic scenario modeling.</li>
              <li><strong>Monitor Performance:</strong> Track progress regularly to make adjustments for optimal growth.</li>
            </ul>
          </section>

          <AdBanner type="bottom" />

          {/* ================= FAQ ================= */}
          <section className="space-y-4">
            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-cyan-300">
              Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h3>
            <div className="space-y-4 text-lg text-slate-200 leading-relaxed">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
                <h4 className="font-semibold text-xl"><span className="text-yellow-300">Q1</span>: What is compound interest?</h4>
                <p className="text-slate-300">Compound interest is interest calculated on both the initial principal and on the accumulated interest from prior periods. As time progresses, interest is earned on an increasingly larger base, which can lead to faster growth than simple interest.</p>
              </div>
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
                <h4 className="font-semibold text-xl"><span className="text-yellow-300">Q2</span>: How does compounding frequency affect growth?</h4>
                <p className="text-slate-300">In general, higher-frequency compounding (daily rather than monthly, for example) yields higher returns at the same nominal rate because interest is added to the balance more often. The effect grows more pronounced over longer time horizons.</p>
              </div>
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
                <h4 className="font-semibold text-xl"><span className="text-yellow-300">Q3</span>: Can I calculate for custom periods?</h4>
                <p className="text-slate-300">Yes. You can calculate using various combinations of years, months, and days. The calculator converts everything to the appropriate unit to determine the future value.</p>
              </div>
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
                <h4 className="font-semibold text-xl"><span className="text-yellow-300">Q4</span>: Why should I use this calculator?</h4>
                <p className="text-slate-300">This tool helps you plan finances, optimize investments, and forecast long-term growth with accuracy. It supports decision-making by showing how different inputs influence outcomes.</p>
              </div>
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
                <h4 className="font-semibold text-xl"><span className="text-yellow-300">Q5</span>: Can I model variable interest rates?</h4>
                <p className="text-slate-300">Yes. The calculator enables custom interest rates to simulate real-world scenarios where rates may change over time, allowing you to explore sensitivity and plan accordingly.</p>
              </div>
            </div>
            <p className="text-slate-300">This professional, user-friendly tool provides a clear and reliable way to understand how your money can grow through compounding. By adjusting inputs such as principal, rate, frequency, and time, you can forecast outcomes, compare different strategies, and make informed financial decisions for savings, investments, SIPs, and retirement planning.</p>
          </section>

          {/* Related Calculators */}
          <RelatedCalculators currentPath="/compound-interest-calculator" category="currency-finance" />
        </div>

        <AdBanner type="bottom" />
      </div>
    </>
  );
};

export default CompoundInterestCalculator;
