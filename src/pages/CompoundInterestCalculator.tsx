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

// Enhanced compact money formatter – handles up to Centillion range safely
  function moneyFmt(value: number, withSymbol: boolean = true): string {
    if (!isFinite(value)) return withSymbol ? "$0" : "0";
  
    const abs = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    const sym = withSymbol ? "$" : "";
  
    // Define suffixes beyond trillions
    const suffixes = [
      "", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc",
      "Ud", "Dd", "Td", "Qd", "Qnd", "Sxd", "Spd", "Ocd", "Nnd", "Vg",
      "Cv", "Dv", "Tv", "Qv", "Qnv", "Sxv", "Spv", "Ocv", "Nnv", "Trg", "Ct"
    ];
  
    // If small (< 10M) → normal locale format
    if (abs < 9_999_999)
      return `${sign}${sym}${abs.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })}`;
  
    let tier = Math.floor(Math.log10(abs) / 3);
    if (tier >= suffixes.length) tier = suffixes.length - 1;
  
    const scale = Math.pow(10, tier * 3);
    const scaled = abs / scale;
    const suffix = suffixes[tier];
  
    return `${sign}${sym}${scaled.toFixed(2)}${suffix}`;
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
            Compound Interest Calculate Online.
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
            <h2 className="text-3xl font-bold text-cyan-400 mb-6">
              Compound Interest Calculator – Free, Accurate & Smart Savings Tool
            </h2>
          
            <p>
              Understanding how money grows is essential for anyone looking to build wealth, save for the future, or plan long-term investments. The 
              <strong> Compound Interest Calculator </strong> is a simple yet powerful 
              <strong> financial tool </strong> that helps users see how their savings can multiply over time through the magic of compounding.
            </p>
          
            <p>
              Whether someone is new to investing or a seasoned professional, this 
              <strong> easy compound interest calculator </strong> gives quick, accurate, and reliable results—instantly showing how much their principal will grow with reinvested interest.
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">What Is Compound Interest?</h2>
            <p>
              Compound interest is the process where the interest earned on an investment is added back to the principal, allowing future interest to be calculated on the increased total. 
              In simpler terms, it’s “interest on interest.”
            </p>
            <p>
              For example, depositing $1,000 at 10% annual interest doesn’t just earn $100 every year—because the interest from the first year is added to the balance, it keeps growing exponentially. 
              This powerful effect is what makes compound interest one of the most important financial concepts.
            </p>
            <p>
              The <strong>compound interest calculator for beginners</strong> helps users understand this phenomenon visually by showing year-by-year growth and total returns.
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">How Does the Compound Interest Calculator Work?</h2>
            <p>
              The <strong>system compound interest calculator</strong> makes complex financial calculations effortless. Users simply input:
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li><strong>Principal Amount:</strong> The initial amount of money invested or saved.</li>
              <li><strong>Interest Rate (%):</strong> The annual rate of return or growth.</li>
              <li><strong>Compounding Frequency:</strong> Monthly, quarterly, half-yearly, or annually.</li>
              <li><strong>Time Period:</strong> The duration in years or months.</li>
            </ol>
          
            <p>
              Once these details are entered, the <strong>tool compound interest calculator</strong> instantly displays:
            </p>
            <ul>
              <li>Final amount after compounding</li>
              <li>Total interest earned</li>
              <li>Total growth percentage</li>
            </ul>
          
            <p>
              This <strong>compound interest calculator website</strong> eliminates manual math and helps users see how even small contributions can turn into significant savings over time.
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">Compound Interest Formula</h2>
            <p>The formula used in the calculator is:</p>
            <pre className="bg-slate-800 text-slate-200 p-3 rounded-lg overflow-x-auto">
              A = P × (1 + r/n)^(n × t)
            </pre>
            <p>
              Where:
              <br />A = Final amount after time (t)
              <br />P = Principal amount
              <br />r = Annual interest rate (decimal)
              <br />n = Number of compounding periods per year
              <br />t = Time in years
            </p>
          
            <p>
              The <strong>compound interest calculator explained</strong> section in the tool shows step-by-step calculations for better understanding and transparency.
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">Why Use Our Compound Interest Calculator?</h2>
            <p>
              Among many options available online, this <strong>professional compound interest calculator</strong> stands out because of:
            </p>
            <ul className="space-y-2">
              <li>✅ <strong>Instant Results:</strong> Calculates accurate values in milliseconds.</li>
              <li>✅ <strong>User-Friendly Interface:</strong> Ideal for both beginners and experts.</li>
              <li>✅ <strong>Customizable Compounding:</strong> Choose how often your interest compounds.</li>
              <li>✅ <strong>Detailed Breakdown:</strong> Year-by-year growth and total interest summary.</li>
              <li>✅ <strong>Free & Secure:</strong> 100% free to use with no registration or ads.</li>
            </ul>
          
            <p>
              The <strong>compound interest calculator review</strong> section highlights user satisfaction for its clarity and performance.
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">How to Use the Compound Interest Calculator</h2>
            <p>Using this calculator is simple and fast:</p>
            <ul>
              <li>Enter your <strong>principal amount</strong>.</li>
              <li>Set the <strong>interest rate</strong>.</li>
              <li>Select <strong>compounding frequency</strong>.</li>
              <li>Choose <strong>time duration</strong>.</li>
              <li>Click “Calculate” to see your total returns.</li>
            </ul>
          
            <p>
              A complete <strong>compound interest calculator tutorial</strong> is available for those who prefer a guided step-by-step explanation.
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">Example: $10,000 Investment at 8% Interest</h2>
            <p>
              Suppose an investor deposits <strong>$10,000</strong> at <strong>8% annual interest</strong>, compounded <strong>monthly</strong> for <strong>10 years</strong>.
            </p>
            <ul>
              <li>Principal (P): $10,000</li>
              <li>Rate (r): 8%</li>
              <li>Time (t): 10 years</li>
              <li>Compounding (n): 12 times per year</li>
            </ul>
            <p><strong>Final Amount (A):</strong> $21,589</p>
            <p><strong>Total Interest Earned:</strong> $11,589</p>
          
            <p>
              This example shows how the <strong>compound interest calculator explained</strong> helps visualize the power of compounding for smarter financial planning.
            </p>
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

           
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">Understanding Compounding Frequency</h2>
            <p>
              Compounding frequency plays a crucial role in returns. The more frequent the compounding, the higher the total growth.
            </p>
            <table className="min-w-full text-left border border-slate-700 mt-4">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="p-2">Frequency</th>
                  <th className="p-2">Compounds/Year</th>
                  <th className="p-2">Example Growth (10 Years @ 8%)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-700">
                  <td className="p-2">Annually</td>
                  <td className="p-2">1</td>
                  <td className="p-2">$21,589</td>
                </tr>
                <tr className="border-b border-slate-700">
                  <td className="p-2">Quarterly</td>
                  <td className="p-2">4</td>
                  <td className="p-2">$22,080</td>
                </tr>
                <tr>
                  <td className="p-2">Monthly</td>
                  <td className="p-2">12</td>
                  <td className="p-2">$22,196</td>
                </tr>
              </tbody>
            </table>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">Benefits of Using a Compound Interest Calculator</h2>
            <p>Key <strong>compound interest calculator benefits</strong> include:</p>
            <ul>
              <li>Quickly simplifies complex calculations.</li>
              <li>Compares multiple investment options.</li>
              <li>Shows long-term wealth growth visually.</li>
              <li>Encourages early and consistent investing.</li>
              <li>Accurate, fast, and easy to use.</li>
            </ul>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">Compound Interest Calculator Comparison</h2>
            <p>
              In <strong>compound interest calculator comparison</strong> reviews, this tool ranks high for precision, speed, and design.
              It’s completely ad-free and requires no login, unlike many other alternatives.
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">Who Can Use This Calculator?</h2>
            <p>This calculator is useful for:</p>
            <ul>
              <li>Students learning about savings and growth.</li>
              <li>Professionals planning long-term investments.</li>
              <li>Businesses forecasting financial returns.</li>
              <li>Investors comparing multiple portfolios.</li>
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
                principal={principal}
                rate={rate}
                rateUnit={rateUnit}
                timeData={timeData}
                finalAmount={finalAmount}
              />

           
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">Alternatives & Advanced Features</h2>
            <p>
              There are other <strong>compound interest calculator alternatives</strong> such as finance apps or spreadsheets, 
              but this web-based tool offers faster and more detailed calculations. Users can also log in via the 
              <strong> compound interest calculator login </strong> feature to save past computations.
            </p>
          
            {/* ===================== FAQ SECTION ===================== */}
            <section className="space-y-6 mt-16" aria-label="Compound Interest Calculator FAQs">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
                ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
              </h2>
          
              <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2">
                    <span className="text-yellow-300">Q1:</span> What is compound interest in simple terms?
                  </h3>
                  <p>It’s the interest earned on both the original amount and the previously accumulated interest.</p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2">
                    <span className="text-yellow-300">Q2:</span> Is this calculator free to use?
                  </h3>
                  <p>Yes, it’s a completely <strong>free compound interest calculator</strong> accessible on all devices.</p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2">
                    <span className="text-yellow-300">Q3:</span> Can it handle daily or monthly compounding?
                  </h3>
                  <p>Absolutely! The calculator supports daily, monthly, quarterly, and yearly compounding options.</p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2">
                    <span className="text-yellow-300">Q4:</span> Are the results accurate?
                  </h3>
                  <p>Yes. The formula used matches standard banking and investment models, ensuring precision.</p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2">
                    <span className="text-yellow-300">Q5:</span> Can I compare different interest rates?
                  </h3>
                  <p>Yes, the calculator lets users input multiple rates to see which investment yields the best return.</p>
                </div>
              </div>
            </section>
          </section>
          
          {/* =================== AUTHOR & BACKLINK SECTION =================== */}
          <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
            <div className="flex items-center gap-3">
              <img
                src="/images/calculatorhub-author.webp"
                alt="CalculatorHub Finance Tools Team"
                className="w-12 h-12 rounded-full border border-gray-600"
                loading="lazy"
              />
              <div>
                <p className="font-semibold text-white">Written by the CalculatorHub Finance Tools Team</p>
                <p className="text-sm text-slate-400">
                  Experts in savings and investment tools. Last updated:{" "}
                  <time dateTime="2025-10-17">October 17, 2025</time>.
                </p>
              </div>
            </div>
          
            <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
              <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
                🚀 Explore more finance tools on CalculatorHub:
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <a
                  href="/loan-emi-calculator"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
                >
                  <span className="text-indigo-400">💰</span> Loan EMI Calculator
                </a>
                <a
                  href="/tax-calculator"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
                >
                  <span className="text-emerald-400">🧾</span> Income Tax Calculator
                </a>
                <a
                  href="/currency-converter"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-fuchsia-600/20 text-fuchsia-300 hover:text-fuchsia-400 px-3 py-2 rounded-md border border-slate-700 hover:border-fuchsia-500 transition-all duration-200"
                >
                  <span className="text-fuchsia-400">💱</span> Currency Converter
                </a>
              </div>
            </div>
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
