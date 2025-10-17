import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  PiggyBank,
  TrendingUp,
  Info,
  RotateCcw,
  Share2,
  DollarSign,
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

// Rotating SIP Tips
const SIP_TIPS = [
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

const CURRENCIES = [
  { code: 'INR', symbol: '₹', locale: 'en-IN' },
  { code: 'USD', symbol: '$', locale: 'en-US' },
  { code: 'GBP', symbol: '£', locale: 'en-GB' },
  { code: 'EUR', symbol: '€', locale: 'de-DE' },
  { code: 'AUD', symbol: 'A$', locale: 'en-AU' },
];

const formatCurrency = (v: number, currency: string, locale: string) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(isFinite(v) ? v : 0);

const formatCompact = (v: number, locale: string) =>
  new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(isFinite(v) ? v : 0);

const SIPCalculator: React.FC = () => {
  const [monthlyInvestment, setMonthlyInvestment] = useState(10000);
  const [returnRate, setReturnRate] = useState(12);
  const [timePeriod, setTimePeriod] = useState(10);
  const [currency, setCurrency] = useState('INR');
  const [stepUp, setStepUp] = useState(0);

  const [maturityValue, setMaturityValue] = useState(0);
  const [investedAmount, setInvestedAmount] = useState(0);
  const [estimatedProfit, setEstimatedProfit] = useState(0);

  const [activeTip, setActiveTip] = useState(0);
  const amountRef = useRef<HTMLInputElement>(null);

  // Parse URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const amount = Number(params.get('amount'));
    const rate = Number(params.get('rate'));
    const years = Number(params.get('years'));
    if (amount) setMonthlyInvestment(amount);
    if (rate) setReturnRate(rate);
    if (years) setTimePeriod(years);
  }, []);

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  // Calculate SIP
  const calculateSIP = () => {
    const P = monthlyInvestment;
    const r = returnRate / 12 / 100;
    const n = timePeriod * 12;

    const fvRegular = P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    let fvStep = 0;
    let investedStep = 0;
    let monthly = P;

    for (let year = 1; year <= timePeriod; year++) {
      for (let m = 1; m <= 12; m++) {
        const monthsLeft = (timePeriod - year) * 12 + (12 - m + 1);
        fvStep += monthly * Math.pow(1 + r, monthsLeft);
        investedStep += monthly;
      }
      monthly *= 1 + stepUp / 100;
    }

    const invested = P * n;
    const profit = fvRegular - invested;

    setMaturityValue(fvRegular);
    setInvestedAmount(invested);
    setEstimatedProfit(profit);

    return { fvRegular, fvStep, investedStep };
  };

  const { fvRegular, fvStep, investedStep } = useMemo(() => calculateSIP(), [monthlyInvestment, returnRate, timePeriod, stepUp]);
  const selectedCurrency = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  const chartData = useMemo(() => {
    const r = returnRate / 12 / 100;
    const rows: any[] = [];
    for (let year = 1; year <= timePeriod; year++) {
      const invested = monthlyInvestment * year * 12;
      const value = monthlyInvestment * ((Math.pow(1 + r, year * 12) - 1) / r) * (1 + r);
      let fvStep = 0;
      let current = monthlyInvestment;
      for (let y = 1; y <= year; y++) {
        for (let m = 1; m <= 12; m++) {
          const monthsLeft = (year - y) * 12 + (12 - m + 1);
          fvStep += current * Math.pow(1 + r, monthsLeft);
        }
        current *= 1 + stepUp / 100;
      }
      rows.push({ year, invested, value, stepUpValue: fvStep });
    }
    return rows;
  }, [monthlyInvestment, returnRate, timePeriod, stepUp]);

  useEffect(() => {
    const t = setInterval(() => setActiveTip((p) => (p + 1) % SIP_TIPS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const handleReset = () => {
    setMonthlyInvestment(10000);
    setReturnRate(12);
    setTimePeriod(10);
    setStepUp(0);
  };

  const shareUrl = () => {
    const params = new URLSearchParams({
      amount: String(monthlyInvestment),
      rate: String(returnRate),
      years: String(timePeriod),
    });
    return `${window.location.origin}/sip-calculator?${params.toString()}`;
  };

  const copyShare = async () => {
    await navigator.clipboard.writeText(shareUrl());
    alert('Shareable link copied!');
  };

  return (
    <>
      <SEOHead
        title={seoData.sipCalculator.title}
        description={seoData.sipCalculator.description}
        canonical="https://calculatorhub.site/sip-calculator"
        schemaData={generateCalculatorSchema('SIP Calculator', seoData.sipCalculator.description, '/sip-calculator', seoData.sipCalculator.keywords)}
        breadcrumbs={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'SIP Calculator', url: '/sip-calculator' },
        ]}
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs items={[{ name: 'Currency & Finance', url: '/category/currency-finance' }, { name: 'SIP Calculator', url: '/sip-calculator' }]} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">SIP Calculator</h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Estimate your SIP maturity value, returns, and step-up growth with currency selection and shareable results.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-emerald-400" /> Investment Details
              </h2>
              <button onClick={handleReset} className="flex items-center gap-1 text-sm text-slate-300 border border-[#334155] rounded-lg px-2 py-1 hover:bg-[#0f172a] hover:text-white transition">
                <RotateCcw className="h-4 w-4 text-indigo-400" /> Reset
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full bg-[#0f172a] text-white px-3 py-2 border border-[#334155] rounded-lg">
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Monthly Investment</label>
                <input ref={amountRef} type="number" value={monthlyInvestment} onChange={(e) => setMonthlyInvestment(Number(e.target.value))} className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg" />
                <input type="range" min="500" max="100000" step="500" value={monthlyInvestment} onChange={(e) => setMonthlyInvestment(Number(e.target.value))} className="w-full mt-2 accent-emerald-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Expected Annual Return (%)</label>
                <input type="number" step="0.1" value={returnRate} onChange={(e) => setReturnRate(Number(e.target.value))} className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg" />
                <input type="range" min="1" max="24" step="0.1" value={returnRate} onChange={(e) => setReturnRate(Number(e.target.value))} className="w-full mt-2 accent-indigo-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Time Period (Years)</label>
                <input type="number" value={timePeriod} onChange={(e) => setTimePeriod(Number(e.target.value))} className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg" />
                <input type="range" min="1" max="40" step="1" value={timePeriod} onChange={(e) => setTimePeriod(Number(e.target.value))} className="w-full mt-2 accent-yellow-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Annual Step-up (%)</label>
                <input type="number" value={stepUp} onChange={(e) => setStepUp(Number(e.target.value))} className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg" />
                <input type="range" min="0" max="20" step="1" value={stepUp} onChange={(e) => setStepUp(Number(e.target.value))} className="w-full mt-2 accent-pink-500" />
              </div>
            </div>
          </div>

          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">SIP Summary</h2>
            <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155] mb-4">
              <TrendingUp className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{formatCurrency(fvRegular, selectedCurrency.code, selectedCurrency.locale)}</div>
              <div className="text-sm text-slate-400">Maturity Value</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                <div className="text-lg font-semibold text-white">{formatCurrency(investedAmount, selectedCurrency.code, selectedCurrency.locale)}</div>
                <div className="text-sm text-slate-400">Total Invested</div>
              </div>
              <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                <div className="text-lg font-semibold text-white">{formatCurrency(estimatedProfit, selectedCurrency.code, selectedCurrency.locale)}</div>
                <div className="text-sm text-slate-400">Wealth Gain</div>
              </div>
            </div>
            <div className="space-y-3 text-sm text-slate-300 mt-4">
              <div className="flex justify-between"><span>Time Period:</span><span>{timePeriod} years</span></div>
              <div className="flex justify-between"><span>Expected Return:</span><span>{returnRate}% p.a.</span></div>
              <div className="flex justify-between"><span>Step-up:</span><span>{stepUp}% per year</span></div>
            </div>
            <div className="flex items-center gap-2 pt-4">
              <button onClick={copyShare} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-[#334155] hover:border-indigo-500 hover:bg-[#0f172a] transition">
                <Share2 className="h-4 w-4" /> Share Result
              </button>
              <span className="text-xs text-slate-400">Link encodes your inputs</span>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm flex items-center">
          <span className="text-2xl text-indigo-400 mr-3">💡</span>
          <p className="text-base font-medium text-slate-300">{SIP_TIPS[activeTip]}</p>
        </div>

        <div className="mt-6 bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
          <h3 className="text-lg font-semibold text-white mb-6 text-center">SIP Growth Overview</h3>
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tickFormatter={(y) => `${y}y`} />
                <YAxis tickFormatter={(v) => formatCompact(v, selectedCurrency.locale)} />
                <ChartTooltip formatter={(v: any) => formatCurrency(v, selectedCurrency.code, selectedCurrency.locale)} labelFormatter={(l) => `Year ${l}`} />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} name="Normal SIP" />
                <Line type="monotone" dataKey="stepUpValue" stroke="#f472b6" strokeWidth={2} dot={false} name="Step-up SIP" />
                <Line type="monotone" dataKey="invested" stroke="#6366f1" strokeWidth={2} dot={false} name="Invested" />

            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Comparison Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center">
            <p className="text-slate-400 text-sm">Normal SIP Maturity</p>
            <p className="text-white font-semibold text-lg">{formatCurrency(fvRegular, selectedCurrency.code, selectedCurrency.locale)}</p>
          </div>
          <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center">
            <p className="text-slate-400 text-sm">Step-up SIP Maturity</p>
            <p className="text-white font-semibold text-lg">{formatCurrency(fvStep, selectedCurrency.code, selectedCurrency.locale)}</p>
          </div>
          <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center">
            <p className="text-slate-400 text-sm">Step-up Total Invested</p>
            <p className="text-white font-semibold text-lg">{formatCurrency(investedStep, selectedCurrency.code, selectedCurrency.locale)}</p>
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

