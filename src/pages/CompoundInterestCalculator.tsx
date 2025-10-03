// CompoundInterestCalculator.tsx
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
  const [timeData, setTimeData] = useState({ years: 0, months: 0, days: 0 });


  const [breakdownMode, setBreakdownMode] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>(
    'daily'
  );
  const [includeAllDays, setIncludeAllDays] = useState<boolean>(true);
  const [selectedDays, setSelectedDays] = useState<string[]>(['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']);
  const [breakdownData, setBreakdownData] = useState<any[]>([]);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);
  const [guideImageUrl, setGuideImageUrl] = useState<string>('');

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
  return (timeData.years * 365) + (timeData.months * 30) + timeData.days;
};


  // ================================
  // Effects: recalc when inputs change
  // ================================
  useEffect(() => {
    loadGuideImage();
  }, []);

  const loadGuideImage = async () => {
    try {
      const { data, error } = await supabase
        .from('website_settings')
        .select('value')
        .eq('key', 'compound_interest_guide_image')
        .maybeSingle();

      if (data && !error) {
        setGuideImageUrl(data.value);
      }
    } catch (err) {
      console.error('Error loading guide image:', err);
    }
  };

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
        <div className="mb-8 text-left text-center">
          <h1 className="text-center text-white text-2xl font-bold text-slate-900 mb-2">Compounding Calculator – Calculate Compound Interest Online</h1> 
          <p className="text-orange-50">Compound interest grows your money faster by reinvesting earnings into the principal. Our compounding calculator shows your future investment value based on principal, rate, and custom time periods.</p>
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
                  placeholder="$$$"
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="text-black w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Rate */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Interest Rate (%)</label>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-1">
                  <input
                    type="number"                
                    onChange={(e) => setRate(Number(e.target.value))}
                    className="text-black w-full sm:w-auto flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400"
                    placeholder="%"
                  />

                  <select
                    value={rateUnit}
                    onChange={(e) => setRateUnit(e.target.value as any)}
                    className=" text-black mt-2 sm:mt-0 px-1 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400"
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
                        className=" text-black w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-black mb-1">Months</label>
                      <input
                        type="number"
                        min={0}
                        value={customRate.months}
                        onChange={(e) => setCustomRate({ ...customRate, months: Number(e.target.value) })}
                        className="text-black w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-black mb-1">Days</label>
                      <input
                        type="number"
                        min={0}
                        placeholder="Years"
                        value={customRate.days}
                        onChange={(e) => setCustomRate({ ...customRate, days: Number(e.target.value) })}
                        className="text-black w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <p className="text-xs text-slate-500 col-span-3 mt-1">
                      The custom interval determines how often the specified interest rate is applied.
                      E.g., Months = 4 → interest applied every ~120 days.
                    </p>
                  </div>
                )}
              </div>

              {/* Time Period */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-black mb-1">Time Period</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Years"
                    onChange={(e) => setTimeData({ ...timeData, years: Number(e.target.value) })}
                    className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-black"
                  />
                  <input
                    type="number"
                    placeholder="Months"
                    onChange={(e) => setTimeData({ ...timeData, months: Number(e.target.value) })}
                    className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-black"
                  />
                  <input
                    type="number"
                    placeholder="Days"
                    onChange={(e) => setTimeData({ ...timeData, days: Number(e.target.value) })}
                    className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-black"
                  />
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

          <div className="max-w-5xl mx-auto p-6 space-y-12 text-white">
    
          {/* ================= Main Title ================= */}
          <h1 className="text-2xl md:text-3xl font-extrabold text-center mb-6">
            Compound Interest Calculator – Calculate Your Investment Growth Online
          </h1>
          <p className="text-lg md:text-xl text-slate-100 text-center mb-6 leading-relaxed">
            This online calculator helps you quantify the growth of your investments through the power of compounding. It supports daily, monthly, yearly, and customizable compounding intervals for savings, SIPs, general investments, or retirement planning. You will obtain precise future values based on the principal, the interest rate, and the time period you select.
          </p>
            
        
          {/* ================= How to Use ================= */}
          <section className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How to Use the Compound                   Interest Calculator</h2>
            <h3 className="text-1x1 md:text-2x1 font-bold md-4">
            Using this investment growth tool is straightforward and efficient:
            </h3>
            <p className="text-lg leading-relaxed text-slate-100">
              <strong>Enter your principal amount:</strong>  Input the initial sum you plan to invest or save.
            </p>
            <p className="text-lg leading-relaxed text-slate-100">
              <strong>Select your interest rate:</strong>  Provide the annual rate as a percentage, then the calculator converts it to a decimal for computations.
            </p>
            <p className="text-lg leading-relaxed text-slate-100">
              <strong>Choose a compounding frequency:</strong> Pick daily, monthly, yearly, or a custom interval to reflect how often interest is added to the balance.
            </p>
            <p className="text-lg leading-relaxed text-slate-100">
              <strong>Define the time period:</strong> Specify the duration in years, months, or days, according to your planning horizon.
            </p>
            <p className="text-lg leading-relaxed text-slate-100">
              <strong>View results instantly:</strong> The calculator displays the future value, total interest earned, and overall growth of your investment. It also accommodates custom interest rates to model variable scenarios.
Why This Calculator Helps You
            </p>

            <p className="text-lg leading-relaxed text-slate-100">
              This compound interest calculator is designed to support you in several important financial planning activities:
            </p>
            <p className="text-lg leading-relaxed text-slate-100">
            <strong> Savings planning:</strong> Project how your savings will grow over time under different compounding schemes.
            </p>
            <p className="text-lg leading-relaxed text-slate-100">
              <strong>Forecasting long-term investments:</strong> Compare how various rates and frequencies influence outcomes over extended periods.
            </p>
            <p className="text-lg leading-relaxed text-slate-100">
              <strong>Retirement fund growth:</strong> Model how contributions and compounding affect the size of your retirement corpus.
            </p>
            <p className="text-lg leading-relaxed text-slate-100">
              <strong>Daily savings or SIP calculations:</strong> Assess how regular contributions accumulate with different compounding choices.
            </p>
            <p className="text-lg leading-relaxed text-slate-100">
              Clarity and accuracy: The results are presented clearly and with precision, making it easier to interpret the impact of each input.
How Compound Interest Works
            </p>
            
          </section>
        
          {/* ================= How It Works ================= */}
          <section className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How the Compound Interest Calculator Works</h2>
            <p className="text-lg leading-relaxed text-slate-100">
              The calculator uses the <strong>standard compound interest formula</strong>: <br />
              <strong>A = P × (1 + r/n)^(n × t)</strong>, where:
            </p>
            <ul className="list-disc list-inside text-lg text-slate-100 space-y-2">
              <li><strong>A</strong> = Future Value (total amount including interest)</li>
              <li><strong>P</strong> = Principal Amount</li>
              <li><strong>r</strong> = Interest Rate (as a decimal)</li>
              <li><strong>n</strong> = Compounding Frequency (times per year)</li>
              <li><strong>t</strong> = Time period in years, months, and days</li>
            </ul>
            <p className="text-lg leading-relaxed text-slate-100">
              <strong>Notes on the inputs:</strong>
            </p>
            <p className="text-lg leading-relaxed text-slate-100">
              The annual rate r should be entered as a percentage and then converted to a decimal by dividing by 100.
The compounding frequency n determines how many times per year interest is added to the balance (daily, monthly, yearly, or a custom interval).
The time period t can be expressed in years, months, or days; the calculator handles the appropriate conversion.
By adjusting the compounding frequency, you can illustrate how more frequent compounding can increase returns under the same nominal rate, while also highlighting the sensitivity of outcomes to the chosen horizon.
            </p> 
            
          </section>
        
          {/* ================= Example Scenarios ================= */}
          <section className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Example Investment Scenarios</h2>
            <p className="text-lg leading-relaxed text-slate-100">
              Understanding compound interest is easier with practical examples:
            </p>
            <ul className="list-disc list-inside text-lg text-slate-100 space-y-2">
              <li>Deposit $1,000 at 5% annual interest compounded daily for 3 years → Future Value ≈ $1,161.62</li>
              <li>Invest $10,000 at 8% annual interest compounded monthly for 5 years → Future Value ≈ $14,859.47</li>
              <li>Monthly SIP of $500 at 7% compounded monthly for 10 years → Total Future Value ≈ $86,000</li>
              <li>Use custom variable rates for real-world investment modeling</li>
            </ul>
          


            <p className="text-lg leading-relaxed text-slate-100">
              These examples show how starting early and compounding frequently maximizes returns. Even small increases in interest rate or contribution can make a huge difference over time.
            </p>
          </section>
        
          {/* ================= Benefits ================= */}
          <section className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Benefits of Using This Compound Interest Calculator</h2>
            <p className="text-lg leading-relaxed text-slate-100">
              Our calculator is ideal for anyone looking to optimize financial growth. Benefits include:
            </p>
            <ul className="list-disc list-inside text-lg text-slate-100 space-y-2">
              <li><strong>Financial Planning:</strong> Use the tool to project the trajectory of savings, investments, and retirement funds.</li>
              <li><strong>Compare Scenarios:</strong> Evaluate the impact of different rates, frequencies, and timeframes side by side.</li>
              <li><strong>Custom Periods:</strong> Enter exact durations to obtain highly accurate results.</li>
              <li><strong>Save Time:</strong> Obtain quick, automatic results without manual computations.</li>
              <li><strong>Visualize Growth:</strong> Access breakdowns and charts that help you understand how value accumulates over time.</li>
              <li><strong>Assess frequency and contributions:</strong>See how changes in compounding frequency and regular contributions affect total value.
Tips to Maximize Compounding Returns</li>
              <li><strong>Reinvest earnings:</strong>Allow interest to remain invested to accelerate growth.
Tips to Maximize Compounding Returns</li>
              <li><strong>Increase contribution frequency:</strong> More frequent deposits (weekly or monthly) can boost overall returns.
Tips to Maximize Compounding Returns</li>
              <li><strong>Start early:</strong>Time is a powerful ally; even modest early investments can yield substantial growth.</li>
              <li><strong>Model variable rates:</strong>Use scenarios with different rates to reflect potential real-world changes.</li>
              <li><strong>Track and adjust:</strong>Regularly review performance and adjust your savings or investment strategy as needed.
FAQ – Compound Interest Calculator</li>
            </ul>
           
          </section>
        
          {/* ================= Advanced Tips ================= */}
          <section className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Advanced Tips to Maximize Returns</h2>
            <ul className="list-disc list-inside text-lg text-slate-100 space-y-2">
              <li><strong>Reinvest Earnings:</strong> Allow interest to compound for maximum effect.</li>
              <li><strong>Increase Contribution Frequency:</strong> More frequent deposits lead to higher growth.</li>
              <li><strong>Start Early:</strong> Time is the biggest advantage in compounding.</li>
              <li><strong>Use Variable Rates:</strong> Custom rate inputs allow realistic scenario modeling.</li>
              <li><strong>Monitor Performance:</strong> Track progress regularly to make adjustments for optimal growth.</li>
            </ul>
            
          </section>
        
          {/* ================= FAQ ================= */}
          <section className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions (FAQ)</h2>
            <div className="space-y-4 text-lg text-slate-100 leading-relaxed">
              <div>
                <h3 className="font-semibold text-xl">Q1: What is compound interest?</h3>
                <p>Interest calculated on both the principal and previously earned interest, allowing your investments to grow faster than simple interest.</p>
              </div>
              <div>
                <h3 className="font-semibold text-xl">Q2: How does compounding frequency affect growth?</h3>
                <p>Daily compounding grows faster than monthly or yearly compounding at the same interest rate due to more frequent interest calculations.</p>
              </div>
              <div>
                <h3 className="font-semibold text-xl">Q3: Can I calculate for custom periods?</h3>
                <p>Yes, our calculator allows you to enter any combination of years, months, and days for precise results.</p>
              </div>
              <div>
                <h3 className="font-semibold text-xl">Q4: Why should I use this calculator?</h3>
                <p>It helps plan finances, optimize investments, and forecast growth with accuracy, saving time and avoiding manual errors.</p>
              </div>
              <div>
                <h3 className="font-semibold text-xl">Q5: Can I model variable interest rates?</h3>
                <p>Yes, the custom interest rate option allows you to simulate fluctuating rates over different periods.</p>
              </div>
            </div>
          </section>
        
          {/* Related Calculators */}
          <RelatedCalculators currentPath="/compound-interest-calculator" category="currency-finance" />
    
          </div>



        
      </div>
    </>
  );
};

export default CompoundInterestCalculator;
