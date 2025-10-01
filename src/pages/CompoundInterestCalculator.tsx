// ================================
// Compound Interest Calculator
// ================================
import React, { useState, useEffect } from 'react';
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import AdBanner from '../components/AdBanner';



const CompoundInterestCalculator: React.FC = () => {
  // ================================
  // State variables
  // ================================
  const [principal, setPrincipal] = useState<number>(null);
  const [rate, setRate] = useState<number>(0);
  const [rateUnit, setRateUnit] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [time, setTime] = useState<number>(0);
  const [timeUnit, setTimeUnit] = useState<'years' | 'months' | 'days'>('days');

  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [compoundInterest, setCompoundInterest] = useState<number>(0);

  const [breakdownMode, setBreakdownMode] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [includeAllDays, setIncludeAllDays] = useState<boolean>(true);
  const [selectedDays, setSelectedDays] = useState<string[]>(['SU','MO','TU','WE','TH','FR','SA']);
  const [breakdownData, setBreakdownData] = useState<any[]>([]);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false); // default hidden

  // ================================
  // Helper: convert rate to daily rate
  // ================================
  const getDailyRate = () => {
    switch (rateUnit) {
      case 'daily': return rate / 100;
      case 'weekly': return (rate / 100) / 7;
      case 'monthly': return (rate / 100) / 30;
      case 'yearly': return (rate / 100) / 365;
      default: return rate / 100 / 365;
    }
  };

  // ================================
  // Helper: convert time to days
  // ================================
  const getTotalDays = () => {
    switch (timeUnit) {
      case 'days': return time;
      case 'months': return time * 30;
      case 'years': return time * 365;
      default: return time * 365;
    }
  };

  // ================================
  // Effect: recalc when inputs change
  // ================================
  useEffect(() => {
    calculateCompoundInterest();
    generateBreakdown();
  }, [principal, rate, rateUnit, time, timeUnit, breakdownMode, includeAllDays, selectedDays]);

  // ================================
  // Calculation: compound interest
  // ================================
  const calculateCompoundInterest = () => {
    const dailyRate = getDailyRate();
    const totalDays = getTotalDays();
    let balance = principal;
    for (let i = 0; i < totalDays; i++) {
      const day = new Date();
      day.setDate(day.getDate() + i);
      if (!includeAllDays) {
        const dayMap = ['SU','MO','TU','WE','TH','FR','SA'];
        if (!selectedDays.includes(dayMap[day.getDay()])) continue;
      }
      balance += balance * dailyRate;
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

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      if (!includeAllDays) {
        const dayMap = ['SU','MO','TU','WE','TH','FR','SA'];
        if (!selectedDays.includes(dayMap[date.getDay()])) continue;
      }

      const earnings = balance * dailyRate;
      balance += earnings;
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

    data.push({
      period: 'TOTAL',
      earnings: data.reduce((s, r: any) => s + r.earnings, 0),
      totalEarnings,
      balance
    });

    setBreakdownData(data);
  };

  // ================================
  // Toggle selected days
  // ================================
  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // ================================
  // Render
  // ================================
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
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
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400"
                />
                <select
                  value={rateUnit}
                  onChange={(e) => setRateUnit(e.target.value as any)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
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
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="years">Years</option>
                  <option value="months">Months</option>
                  <option value="days">Days</option>
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
                  {['SU','MO','TU','WE','TH','FR','SA'].map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1 rounded-lg border transition ${
                        selectedDays.includes(day)
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-100 text-slate-700'
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
              {showBreakdown ? <>Hide Breakdown <ChevronUp className="ml-2 h-4 w-4" /></> : <>Show Breakdown <ChevronDown className="ml-2 h-4 w-4" /></>}
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
            {['daily','weekly','monthly','yearly'].map((mode) => (
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
                  <th className="px-4 py-2 border">Period</th>
                  <th className="px-4 py-2 border">Earnings</th>
                  <th className="px-4 py-2 border">Total Earnings</th>
                  <th className="px-4 py-2 border">Balance</th>
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
                    <td className="px-4 py-2 border text-emerald-700">${row.earnings.toFixed(2)}</td>
                    <td className="px-4 py-2 border text-amber-700">${row.totalEarnings.toFixed(2)}</td>
                    <td className="px-4 py-2 border text-indigo-700">${row.balance.toFixed(2)}</td>
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
                <p><span className="font-semibold">Period:</span> {row.period}</p>
                <p><span className="font-semibold">Earnings:</span> ${row.earnings.toFixed(2)}</p>
                <p><span className="font-semibold">Total Earnings:</span> ${row.totalEarnings.toFixed(2)}</p>
                <p><span className="font-semibold">Balance:</span> ${row.balance.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <AdBanner type="bottom" />
    </div>
  );
};

export default CompoundInterestCalculator;
