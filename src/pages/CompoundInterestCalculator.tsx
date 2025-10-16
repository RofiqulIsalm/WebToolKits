
// CompoundInterestCalculator.tsx (Dark Mode Version)
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

const formatNumber = (num: number): string => {
  if (num >= 1e12) return (num / 1e12).toFixed(2).replace(/\.00$/, '') + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2).replace(/\.00$/, '') + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2).replace(/\.00$/, '') + 'M';
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const CompoundInterestCalculator: React.FC = () => {
  const [principal, setPrincipal] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [rateUnit, setRateUnit] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'quarterly' | 'custom'>('daily');
  const [customRate, setCustomRate] = useState<{ years: number; months: number; days: number }>({ years: 0, months: 0, days: 0 });
  const [timeData, setTimeData] = useState({ years: 0, months: 0, days: 0 });
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [compoundInterest, setCompoundInterest] = useState<number>(0);
  const [breakdownMode, setBreakdownMode] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [includeAllDays, setIncludeAllDays] = useState<boolean>(true);
  const [selectedDays, setSelectedDays] = useState<string[]>(['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']);
  const [breakdownData, setBreakdownData] = useState<any[]>([]);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);

  const handlePositiveInput = (value: string) => Math.max(0, Number(value));

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

  const getTotalDays = () => timeData.years * 365 + timeData.months * 30 + timeData.days;

  useEffect(() => {
    const timeout = setTimeout(() => {
      calculateCompoundInterest();
      generateBreakdown();
    }, 300);
    return () => clearTimeout(timeout);
  }, [principal, rate, rateUnit, customRate, timeData, breakdownMode, includeAllDays, selectedDays]);

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
        if ((i + 1) % intervalDays === 0) balance += balance * perPeriodRate;
      } else balance += balance * dailyRate;
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
      const label = breakdownMode === 'daily' ? date.toDateString()
        : breakdownMode === 'weekly' ? `Week ${Math.floor(i / 7) + 1}`
        : breakdownMode === 'monthly' ? date.toLocaleString('default', { month: 'short', year: 'numeric' })
        : date.getFullYear().toString();
      data.push({ period: label, earnings, totalEarnings, balance });
    }
    const totalEarningsSum = data.reduce((s, r: any) => s + (r.earnings || 0), 0);
    data.push({ period: 'TOTAL', earnings: totalEarningsSum, totalEarnings, balance });
    setBreakdownData(data);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 text-slate-100 bg-slate-900 min-h-screen">
      <Breadcrumbs
        items={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'Compound Interest Calculator', url: '/compound-interest-calculator' },
        ]}
      />
      <h1 className="text-center text-3xl font-bold text-indigo-400 mb-4">Compound Interest Calculator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="bg-slate-800/70 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-cyan-300 mb-4">Investment Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Principal Amount ($)</label>
              <input type="number" min={0} onChange={(e) => setPrincipal(handlePositiveInput(e.target.value))}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Interest Rate (%)</label>
              <input type="number" min={0} onChange={(e) => setRate(handlePositiveInput(e.target.value))}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-slate-800/70 rounded-2xl border border-slate-700 p-6 flex flex-col justify-between">
          <h2 className="text-xl font-semibold text-emerald-400 mb-4">Results</h2>
          <div className="text-center p-4 bg-slate-900 rounded-lg">
            <TrendingUp className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">${formatNumber(finalAmount)}</div>
            <div className="text-sm text-slate-400">Final Amount</div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-3 bg-indigo-900/40 rounded-lg text-center">
              <div className="text-lg font-semibold text-indigo-300">${formatNumber(principal)}</div>
              <div className="text-sm text-slate-400">Principal</div>
            </div>
            <div className="p-3 bg-amber-900/40 rounded-lg text-center">
              <div className="text-lg font-semibold text-amber-300">${formatNumber(compoundInterest)}</div>
              <div className="text-sm text-slate-400">Compound Interest</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompoundInterestCalculator;
