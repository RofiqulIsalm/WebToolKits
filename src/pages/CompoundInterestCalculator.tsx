// CompoundInterestCalculator.tsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const CompoundInterestCalculator: React.FC = () => {
  // ================================
  // State variables
  // ================================
  const [principal, setPrincipal] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);

  // rateUnit now includes 'quarterly' and 'custom'
  const [rateUnit, setRateUnit] = useState<
    'daily' | 'weekly' | 'monthly' | 'yearly' | 'quarterly' | 'custom'
  >('daily');

  // customRate describes the custom interval length (years, months, days)
  const [customRate, setCustomRate] = useState<{ years: number; months: number; days: number }>({
    years: 0,
    months: 0,
    days: 0,
  });

  // time period (how long you want to run the compounding) - unchanged
  const [time, setTime] = useState<number>(0);
  const [timeUnit, setTimeUnit] = useState<'years' | 'months' | 'days'>('days');

  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [compoundInterest, setCompoundInterest] = useState<number>(0);

  const [breakdownMode, setBreakdownMode] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>(
    'daily'
  );
  const [includeAllDays, setIncludeAllDays] = useState<boolean>(true);
  const [selectedDays, setSelectedDays] = useState<string[]>(['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']);
  const [breakdownData, setBreakdownData] = useState<any[]>([]);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false); // default hidden

  // ================================
  // Helpers: convert rate/time units
  // ================================

  // Convert custom interval (years, months, days) -> days
  const customIntervalDays = () => {
    return customRate.years * 365 + customRate.months * 30 + customRate.days;
  };

  // getDailyRate returns the per-day rate for "daily/weekly/monthly/yearly/quarterly".
  // For custom we will handle periodic application separately in calculation loop.
  const getDailyRate = () => {
    switch (rateUnit) {
      case 'daily':
        return rate / 100;
      case 'weekly':
        return (rate / 100) / 7;
      case 'monthly':
        return (rate / 100) / 30;
      case 'quarterly':
        // approximate 3 months ~ 90 days
        return (rate / 100) / 90;
      case 'yearly':
        return (rate / 100) / 365;
      case 'custom':
        // For 'custom' we return 0 here because we will apply the per-period rate
        // every `customIntervalDays()` days instead of as a daily fraction.
        return 0;
      default:
        return (rate / 100) / 365;
    }
  };

  // Convert time to total days (for the simulation length)
  const getTotalDays = () => {
    switch (timeUnit) {
      case 'days':
        return Math.max(0, Math.floor(time));
      case 'months':
        return Math.max(0, Math.floor(time * 30));
      case 'years':
        return Math.max(0, Math.floor(time * 365));
      default:
        return Math.max(0, Math.floor(time * 365));
    }
  };

  // ================================
  // Effects: recalc when inputs change
  // ================================
  useEffect(() => {
    calculateCompoundInterest();
    generateBreakdown();
    // include customRate & rateUnit so custom interval changes re-run
  }, [
    principal,
    rate,
    rateUnit,
    customRate.years,
    customRate.months,
    customRate.days,
    time,
    timeUnit,
    breakdownMode,
    includeAllDays,
    selectedDays,
  ]);

  // ================================
  // Calculation: compound interest
  // ================================
  const calculateCompoundInterest = () => {
    const dailyRate = getDailyRate();
    const totalDays = getTotalDays();
    let balance = principal;

    // If custom interval and intervalDays <= 0, fallback to no periodic compounding
    const intervalDays = rateUnit === 'custom' ? Math.max(0, customIntervalDays()) : 0;
    const perPeriodRate = rate / 100; // used when intervalDays > 0

    for (let i = 0; i < totalDays; i++) {
      const day = new Date();
      day.setDate(day.getDate() + i);

      if (!includeAllDays) {
        const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        if (!selectedDays.includes(dayMap[day.getDay()])) continue;
      }

      if (rateUnit === 'custom' && intervalDays > 0) {
        // Apply interest only on the day that is the end of a custom interval
        // e.g., if intervalDays = 120, then apply on day indices 119, 239, ...
        // (we use (i + 1) % intervalDays === 0 to apply at the end of each interval)
        if ((i + 1) % intervalDays === 0) {
          balance += balance * perPeriodRate;
        }
      } else {
        // Normal mode: apply dailyRate each day
        balance += balance * dailyRate;
      }
    }

    setFinalAmount(balance);
    setCompoundInterest(balance - principal);
  };

  // ================================
  // Generate breakdown rows
  // ================================
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
        } else {
          earnings = 0;
        }
      } else {
        earnings = balance * dailyRate;
        balance += earnings;
      }

      totalEarnings += earnings;

      let label = '';
      if (breakdownMode === 'daily') {
        label = date.toDateString();
      } else if (breakdownMode === 'weekly') {
        label = `Week ${Math.floor(i / 7) + 1}`;
      } else if (breakdownMode === 'monthly') {
        label = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      } else if (breakdownMode === 'yearly') {
        label = date.getFullYear().toString();
      }

      data.push({ period: label, earnings, totalEarnings, balance });
    }

    // Group rows for monthly/yearly views (aggregate)
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

    // Add TOTAL row (safe even if data empty)
    const totalEarningsSum = data.reduce((s, r: any) => s + (r.earnings || 0), 0);
    data.push({
      period: 'TOTAL',
      earnings: totalEarningsSum,
      totalEarnings,
      balance,
    });

    setBreakdownData(data);
  };

  // ================================
  // Toggle selected days
  // ================================
  const toggleDay = (day: string) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  // ================================
  // Render
  // ================================
  return (
    <>
      <SEOHead
        title={seoData.compoundInterestCalculator.title}
        description={seoData.compoundInterestCalculator.description}
        canonical="https://calculatorhub.com/compound-interest-calculator"
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
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Compound Interest Calculator</h1>
          <p className="text-slate-600">Calculate your investment growth with ease</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ---------------- Investment Inputs ---------------- */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Investment Details</h2>
            <div className="space-y-4">
              {/* Principal */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Principal Amount ($)</label>
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Rate */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Interest Rate (%)</label>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                  <input
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                    className="w-full sm:w-auto flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400"
                    placeholder="e.g. 10"
                  />

                  <select
                    value={rateUnit}
                    onChange={(e) => setRateUnit(e.target.value as any)}
                    className=" text-black mt-2 sm:mt-0 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="daily" className="text-black"
>Daily</option>
                    <option value="weekly" className="text-black"
>Weekly</option>
                    <option value="monthly" className="text-black"
>Monthly</option>
                    <option value="quarterly" className="text-black"
>Every 3 Months</option>
                    <option value="yearly" className="text-black"
>Yearly</option>
                    <option value="custom" className="text-black"
>Custom...</option>
                  </select>
                </div>

                {/* Custom rate interval inputs */}
                {rateUnit === 'custom' && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-black mb-1">Years</label>
                      <input
                        type="number"
                        min={0}
                        value={customRate.years}
                        onChange={(e) => setCustomRate({ ...customRate, years: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-black mb-1">Months</label>
                      <input
                        type="number"
                        min={0}
                        value={customRate.months}
                        onChange={(e) => setCustomRate({ ...customRate, months: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-black mb-1">Days</label>
                      <input
                        type="number"
                        min={0}
                        value={customRate.days}
                        onChange={(e) => setCustomRate({ ...customRate, days: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <p className="text-xs text-slate-500 col-span-3 mt-1">
                      The custom interval determines how often the specified interest rate is applied.
                      E.g., Months = 4 → interest applied every ~120 days.
                    </p>
                  </div>
                )}
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Time Period</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={time}
                    onChange={(e) => setTime(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400"
                  />
                  <select
                    value={timeUnit}
                    onChange={(e) => setTimeUnit(e.target.value as any)}
                    className=" text-black px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="years" className="text-black">Years</option>
                    <option value="months" className="text-black">Months</option>
                    <option value="days" className="text-black">Days</option>
                  </select>
                </div>
              </div>

              {/* Include Days Toggle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Include all days</label>
                <button
                  onClick={() => setIncludeAllDays(!includeAllDays)}
                  className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${
                    includeAllDays ? 'bg-indigo-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      includeAllDays ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="ml-3 text-sm">{includeAllDays ? 'On' : 'Off'}</span>

                {!includeAllDays && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map((day) => (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1 rounded-lg border transition ${
                          selectedDays.includes(day) ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-700'
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
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Results</h2>
              <div className="space-y-6">
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-900">${finalAmount.toFixed(2)}</div>
                  <div className="text-sm text-slate-600">Final Amount</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-indigo-50 rounded-lg text-center">
                    <div className="text-lg font-semibold text-slate-900">${principal.toLocaleString()}</div>
                    <div className="text-sm text-slate-600">Principal</div>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg text-center">
                    <div className="text-lg font-semibold text-slate-900">${compoundInterest.toFixed(2)}</div>
                    <div className="text-sm text-slate-600">Compound Interest</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Toggle Breakdown */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="flex items-center px-4 py-2 bg-indigo-500 text-white rounded-lg shadow hover:bg-indigo-600 transition text-sm"
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
          <div className="mt-8 bg-white rounded-2xl shadow-md border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Breakdown</h3>

            {/* Mode Buttons */}
            <div className="flex flex-wrap gap-3 mb-4">
              {['daily', 'weekly', 'monthly', 'yearly'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setBreakdownMode(mode as any)}
                  className={`px-4 py-2 rounded-lg border transition ${
                    breakdownMode === mode ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="overflow-x-auto hidden sm:block">
              <table className="min-w-full border border-slate-200 text-sm sm:text-base">
                <thead className="bg-indigo-100 text-indigo-800">
                  <tr>
                    <th className="text-black px-4 py-2 border">Period</th>
                    <th className="text-black px-4 py-2 border">Earnings</th>
                    <th className="text-black px-4 py-2 border">Total Earnings</th>
                    <th className="text-black px-4 py-2 border">Balance</th>
                  </tr>
                </thead> 
                <tbody>
                  {breakdownData.map((row, idx) => (
                    <tr
                      key={idx}
                      className={
                        row.period === 'TOTAL'
                          ? 'bg-indigo-200 font-semibold'
                          : idx % 2 === 0
                          ? 'bg-slate-50'
                          : 'bg-white'
                      }
                    >
                      <td className="px-4 py-2 border">{row.period}</td>
                      <td className="px-4 py-2 border text-emerald-700">${(row.earnings || 0).toFixed(2)}</td>
                      <td className="px-4 py-2 border text-amber-700">${(row.totalEarnings || 0).toFixed(2)}</td>
                      <td className="px-4 py-2 border text-indigo-700">${(row.balance || 0).toFixed(2)}</td>
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
                    row.period === 'TOTAL' ? 'bg-indigo-100 font-semibold' : 'bg-slate-50'
                  }`}
                >
                  <p>
                    <span className="font-semibold">Period:</span> {row.period}
                  </p>
                  <p>
                    <span className="font-semibold">Earnings:</span> ${(row.earnings || 0).toFixed(2)}
                  </p>
                  <p>
                    <span className="font-semibold">Total Earnings:</span> ${(row.totalEarnings || 0).toFixed(2)}
                  </p>
                  <p>
                    <span className="font-semibold">Balance:</span> ${(row.balance || 0).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <AdBanner type="bottom" />

        <RelatedCalculators currentPath="/compound-interest-calculator" category="currency-finance" />
      </div>
    </>
  );
};

export default CompoundInterestCalculator;
