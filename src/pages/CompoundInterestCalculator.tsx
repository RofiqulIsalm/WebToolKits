import React, { useState, useEffect } from 'react';
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import AdBanner from '../components/AdBanner';

// ================= START: CompoundInterestCalculator Component =================
const CompoundInterestCalculator: React.FC = () => {
  // ================= START: State Variables =================
  const [principal, setPrincipal] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [rateUnit, setRateUnit] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('yearly');
  const [time, setTime] = useState<number>(0);
  const [timeUnit, setTimeUnit] = useState<'years' | 'months' | 'days'>('years');

  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [compoundInterest, setCompoundInterest] = useState<number>(0);

  const [breakdownMode, setBreakdownMode] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [includeAllDays, setIncludeAllDays] = useState<boolean>(true);
  const [selectedDays, setSelectedDays] = useState<string[]>(['SU','MO','TU','WE','TH','FR','SA']);
  const [breakdownData, setBreakdownData] = useState<any[]>([]);

  // 🔹 Default changed to false (hide breakdown initially)
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);
  // ================= END: State Variables =================


  // ================= START: Helper Functions =================
  // Convert interest rate to daily rate based on selected unit
  const getDailyRate = () => {
    switch (rateUnit) {
      case 'daily': return rate / 100;
      case 'weekly': return (rate / 100) / 7;
      case 'monthly': return (rate / 100) / 30;
      case 'yearly': return (rate / 100) / 365;
      default: return rate / 100 / 365;
    }
  };

  // Convert time unit to total days
  const getTotalDays = () => {
    switch (timeUnit) {
      case 'days': return time;
      case 'months': return time * 30;
      case 'years': return time * 365;
      default: return time * 365;
    }
  };
  // ================= END: Helper Functions =================


  // ================= START: useEffect =================
  useEffect(() => {
    calculateCompoundInterest();
    generateBreakdown();
  }, [principal, rate, rateUnit, time, timeUnit, breakdownMode, includeAllDays, selectedDays]);
  // ================= END: useEffect =================


  // ================= START: Core Calculation =================
  // Calculate compound interest over time
  const calculateCompoundInterest = () => {
    const dailyRate = getDailyRate();
    const totalDays = getTotalDays();
    let balance = principal;

    for (let i = 0; i < totalDays; i++) {
      const day = new Date();
      day.setDate(day.getDate() + i);

      // Skip days if not included
      if (!includeAllDays) {
        const dayMap = ['SU','MO','TU','WE','TH','FR','SA'];
        if (!selectedDays.includes(dayMap[day.getDay()])) continue;
      }

      balance += balance * dailyRate;
    }

    setFinalAmount(balance);
    setCompoundInterest(balance - principal);
  };

  // Generate detailed breakdown (daily, weekly, monthly, yearly)
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

      // Label by mode
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

    // Group data for monthly/yearly breakdown
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

    // Add total summary row
    data.push({
      period: 'TOTAL',
      earnings: data.reduce((s, r: any) => s + r.earnings, 0),
      totalEarnings,
      balance
    });

    setBreakdownData(data);
  };
  // ================= END: Core Calculation =================


  // ================= START: UI Handlers =================
  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };
  // ================= END: UI Handlers =================


  // ================= START: JSX Render =================
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* Title */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Compound Interest Calculator</h1>
        <p className="text-slate-600">Calculate your investment growth with ease</p>
      </div>

      {/* Main Grid: Input + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ================= START: Input Box ================= */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Investment Details</h2>
          <div className="space-y-4">

            {/* Principal Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Principal Amount ($)</label>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Rate Input */}
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

            {/* Time Input */}
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

            {/* Include Days Selection */}
            {/* Include Days */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Include all                 days</label>
              
              {/* Toggle Switch */}
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
            
              {/* Day Selector (only when toggle is OFF) */}
              {!includeAllDays && (
                <div className="flex flex-wrap gap-2 mt-3">
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

        {/* ================= END: Input Box ================= */}

        {/* ================= START: Results ================= */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Results</h2>
            <div className="space-y-6">
              {/* Final Amount */}
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-slate-900">${finalAmount.toFixed(2)}</div>
                <div className="text-sm text-slate-600">Final Amount</div>
              </div>

              {/* Principal & Interest */}
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

          {/* Toggle Breakdown Button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center px-4 py-2 bg-indigo-500 text-white rounded-lg shadow hover:bg-indigo-600 transition text-sm"
            >
              {showBreakdown ? <>Hide Breakdown <ChevronUp className="ml-2 h-4 w-4" /></> : <>Show Breakdown <ChevronDown className="ml-2 h-4 w-4" /></>}
            </button>
          </div>
        </div>
        {/* ================= END: Results ================= */}
      </div>

      {/* ================= START: Breakdown Section ================= */}
      {showBreakdown && (
        <div className="mt-8 bg-white rounded-2xl shadow-md border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Breakdown</h3>

          {/* Mode Switch */}
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

          {/* Breakdown Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full border border-slate-200 text-sm">
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
        </div>
      )}
      {/* ================= END: Breakdown Section ================= */}

      {/* ================= START: Ad Banner ================= */}
      <AdBanner type="bottom" />
      {/* ================= END: Ad Banner ================= */}
    </div>
  );
  // ================= END: JSX Render =================
};

export default CompoundInterestCalculator;
// ================= END: CompoundInterestCalculator Component =================
