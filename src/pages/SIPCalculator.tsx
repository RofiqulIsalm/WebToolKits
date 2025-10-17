import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  PiggyBank,
  TrendingUp,
  Info,
  RotateCcw,
  Share2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

// 💡 Rotating SIP tips
const SIP_TIPS: string[] = [
  'Start early — time in the market beats timing the market.',
  'Increase your SIP by 5–10% every year to fight inflation.',
  'Stay invested through market cycles; volatility smooths out long-term.',
  'Align SIP date right after payday to stay disciplined.',
  'Diversify across 2–3 funds (large/mid/ELSS based on goals).',
  'Review once a year, not every week — avoid noise.',
  'Match SIP horizon to your goal (education, house, retirement).',
  'Use ELSS SIPs to potentially get tax benefits (per local rules).',
  'Avoid stopping SIPs during downturns — that’s when units are cheaper.',
  'Rebalance allocation annually to maintain your risk profile.',
];

const formatINR = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    isFinite(v) ? v : 0
  );

const formatINRCompact = (v: number) =>
  new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(
    isFinite(v) ? v : 0
  );

const SIPCalculator: React.FC = () => {
  // ======= State =======
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(10000);
  const [returnRate, setReturnRate] = useState<number>(12);
  const [timePeriod, setTimePeriod] = useState<number>(10);

  const [maturityValue, setMaturityValue] = useState<number>(0);
  const [investedAmount, setInvestedAmount] = useState<number>(0);
  const [estimatedProfit, setEstimatedProfit] = useState<number>(0);

  const [activeTip, setActiveTip] = useState<number>(0);
  const amountRef = useRef<HTMLInputElement>(null);

  // Focus the first input on mount
  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  // ======= Core SIP Calculation (kept from your original logic) =======
  const calculateSIP = () => {
    const P = monthlyInvestment;
    const r = returnRate / 12 / 100; // monthly rate
    const n = timePeriod * 12; // months

    const futureValue = P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const invested = P * n;
    const profit = futureValue - invested;

    setMaturityValue(futureValue);
    setInvestedAmount(invested);
    setEstimatedProfit(profit);
  };

  useEffect(() => {
    calculateSIP();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthlyInvestment, returnRate, timePeriod]);

  // ======= Chart Data (annual checkpoints) =======
  const chartData = useMemo(() => {
    const r = returnRate / 12 / 100;
    const totalMonths = timePeriod * 12;
    const rows: Array<{ year: number; invested: number; value: number }> = [];
    for (let m = 12; m <= totalMonths; m += 12) {
      const invested = monthlyInvestment * m;
      const value = monthlyInvestment * ((Math.pow(1 + r, m) - 1) / r) * (1 + r);
      rows.push({ year: m / 12, invested, value });
    }
    return rows;
  }, [monthlyInvestment, returnRate, timePeriod]);

  // ======= Auto-rotating tips =======
  useEffect(() => {
    const t = setInterval(() => {
      setActiveTip((p) => (p + 1) % SIP_TIPS.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const handleReset = () => {
    setMonthlyInvestment(10000);
    setReturnRate(12);
    setTimePeriod(10);
  };

  const shareUrl = () => {
    const params = new URLSearchParams({
      amount: String(monthlyInvestment),
      rate: String(returnRate),
      years: String(timePeriod),
    });
    return `${typeof window !== 'undefined' ? window.location.origin : 'https://calculatorhub.site'}/sip-calculator?${params.toString()}`;
  };

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      alert('Shareable link copied!');
    } catch (_) {
      alert('Unable to copy.');
    }
  };

  // Number helpers for UI
  const investedCompact = formatINRCompact(investedAmount);
  const valueCompact = formatINRCompact(maturityValue);
  const profitCompact = formatINRCompact(estimatedProfit);

  return (
    <>
      <SEOHead
        title={seoData.sipCalculator.title}
        description={seoData.sipCalculator.description}
        canonical="https://calculatorhub.site/sip-calculator"
        schemaData={generateCalculatorSchema(
          'SIP Calculator',
          seoData.sipCalculator.description,
          '/sip-calculator',
          seoData.sipCalculator.keywords
        )}
        breadcrumbs={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'SIP Calculator', url: '/sip-calculator' },
        ]}
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Currency & Finance', url: '/category/currency-finance' },
            { name: 'SIP Calculator', url: '/sip-calculator' },
          ]}
        />

        {/* ===== Header ===== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">SIP Calculator</h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Estimate the maturity value, total amount invested, and wealth gained for your
            monthly SIP contributions using a modern, accurate growth model.
          </p>
        </div>

        {/* ===== Calculator Grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section (Dark Theme like Tax page) */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 relative text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-emerald-400" /> Investment Details
              </h2>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-sm text-slate-300 border border-[#334155] rounded-lg px-2 py-1 hover:bg-[#0f172a] hover:text-white transition"
              >
                <RotateCcw className="h-4 w-4 text-indigo-400" /> Reset
              </button>
            </div>

            <div className="space-y-5">
              {/* Monthly Investment */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">Monthly Investment (₹)</label>
                  <Info className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  ref={amountRef}
                  type="number"
                  min={100}
                  value={monthlyInvestment}
                  onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="range"
                  min="500"
                  max="100000"
                  step="500"
                  value={monthlyInvestment}
                  onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                  className="w-full mt-2 accent-emerald-500"
                />
              </div>

              {/* Return Rate */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">Expected Annual Return (%)</label>
                  <Info className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="number"
                  min={1}
                  step={0.1}
                  value={returnRate}
                  onChange={(e) => setReturnRate(Number(e.target.value))}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="range"
                  min="1"
                  max="24"
                  step="0.1"
                  value={returnRate}
                  onChange={(e) => setReturnRate(Number(e.target.value))}
                  className="w-full mt-2 accent-indigo-500"
                />
              </div>

              {/* Time Period */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">Time Period (Years)</label>
                  <Info className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="number"
                  min={1}
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(Number(e.target.value))}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="range"
                  min="1"
                  max="40"
                  step="1"
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(Number(e.target.value))}
                  className="w-full mt-2 accent-yellow-500"
                />
              </div>
            </div>
          </div>

          {/* Output Section (Dark Theme) */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">SIP Summary</h2>
            <div className="space-y-6">
              <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                <TrendingUp className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{formatINR(Math.round(maturityValue))}</div>
                <div className="text-sm text-slate-400">Maturity Value</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">{formatINR(Math.round(investedAmount))}</div>
                  <div className="text-sm text-slate-400">Total Invested</div>
                </div>
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">{formatINR(Math.round(estimatedProfit))}</div>
                  <div className="text-sm text-slate-400">Wealth Gain</div>
                </div>
              </div>

              {/* Quick facts row */}
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex justify-between">
                  <span>Investment Duration:</span>
                  <span className="font-medium">{timePeriod} years</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly SIP:</span>
                  <span className="font-medium">₹{monthlyInvestment.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expected Return:</span>
                  <span className="font-medium">{returnRate}% p.a.</span>
                </div>
              </div>

              {/* Share */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={copyShare}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-[#334155] hover:border-indigo-500 hover:bg-[#0f172a] transition"
                >
                  <Share2 className="h-4 w-4" /> Share Result
                </button>
                <span className="text-xs text-slate-400">Link encodes your inputs</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Smart Tip Box ===== */}
        <div className="mt-4 w-full relative">
          <div className="bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm min-h-[50px] w-full flex items-center transition-all duration-700 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8">
              <span className="text-2xl text-indigo-400">💡</span>
            </div>
            <div className="ml-12 w-full">
              <p className="text-base font-medium leading-snug text-slate-300">{SIP_TIPS[activeTip]}</p>
            </div>
          </div>
        </div>

        {/* ===== Chart + Summary (like Tax insights layout) ===== */}
        <div className="mt-5 bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
          <h3 className="text-lg font-semibold text-white mb-6 text-center">SIP Growth Overview</h3>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
            {/* Chart Left */}
            <div className="w-[90%] sm:w-[80%] md:w-[70%] max-w-[560px] h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" tickFormatter={(y) => `${y}y`} />
                  <YAxis tickFormatter={(v) => formatINRCompact(v)} />
                  <ChartTooltip formatter={(val: any) => formatINR(Number(val))} labelFormatter={(l) => `Year ${l}`} />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} name="Estimated Value" />
                  <Line type="monotone" dataKey="invested" stroke="#6366f1" strokeWidth={2} dot={false} name="Total Invested" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Right */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-indigo-500 transition">
                <p className="text-sm text-slate-400 flex items-center justify-center gap-1">💰 Total Invested</p>
                <p className="font-semibold text-white text-lg">{formatINR(Math.round(investedAmount))}</p>
              </div>
              <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-emerald-500 transition">
                <p className="text-sm text-slate-400 flex items-center justify-center gap-1">📈 Maturity Value</p>
                <p className="font-semibold text-white text-lg">{formatINR(Math.round(maturityValue))}</p>
              </div>
              <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-amber-500 transition">
                <p className="text-sm text-slate-400 flex items-center justify-center gap-1">🏆 Wealth Gain</p>
                <p className="font-semibold text-white text-lg">{formatINR(Math.round(estimatedProfit))}</p>
              </div>
              <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-indigo-500 transition">
                <p className="text-sm text-slate-400 flex items-center justify-center gap-1">⏳ Years</p>
                <p className="font-semibold text-white text-lg">{timePeriod}</p>
              </div>
            </div>
          </div>
        </div>

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/sip-calculator" category="currency-finance" />
      </div>
    </>
  );
};

export default SIPCalculator;
