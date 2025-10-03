import React, { useState } from 'react';

const InterestCalculator: React.FC = () => {
  const [principal, setPrincipal] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [time, setTime] = useState<number>(0);

  const [rateUnit, setRateUnit] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'quarterly' | 'custom'>('daily');
  const [customRate, setCustomRate] = useState({ years: 0, months: 0, days: 0 });

  const [timeUnit, setTimeUnit] = useState<'days' | 'months' | 'years'>('days');
  const [result, setResult] = useState<number | null>(null);

  // Convert interest rate into daily equivalent
  const getDailyRate = () => {
    switch (rateUnit) {
      case 'daily': return rate / 100;
      case 'weekly': return (rate / 100) / 7;
      case 'monthly': return (rate / 100) / 30;
      case 'quarterly': return (rate / 100) / 90;
      case 'yearly': return (rate / 100) / 365;
      case 'custom': {
        const totalDays = (customRate.years * 365) + (customRate.months * 30) + customRate.days;
        return totalDays > 0 ? (rate / 100) / totalDays : 0;
      }
      default: return rate / 100 / 365;
    }
  };

  // Convert time into days
  const getTotalDays = () => {
    switch (timeUnit) {
      case 'days': return time;
      case 'months': return time * 30;
      case 'years': return time * 365;
      default: return time;
    }
  };

  const calculate = () => {
    const dailyRate = getDailyRate();
    const totalDays = getTotalDays();
    const amount = principal * Math.pow(1 + dailyRate, totalDays);
    setResult(amount);
  };

  return (
    <div className="max-w-xl mx-auto bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-black">Interest Calculator</h2>

      {/* Principal */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-black mb-1">Principal Amount</label>
        <input
          type="number"
          value={principal}
          onChange={(e) => setPrincipal(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black"
        />
      </div>

      {/* Rate */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-black mb-1">Interest Rate (%)</label>
        <input
          type="number"
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black"
        />

        <select
          value={rateUnit}
          onChange={(e) => setRateUnit(e.target.value as any)}
          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-black"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Every 3 Months</option>
          <option value="yearly">Yearly</option>
          <option value="custom">Custom</option>
        </select>

        {rateUnit === 'custom' && (
          <div className="flex space-x-2 mt-2">
            <input
              type="number"
              value={customRate.years}
              onChange={(e) => setCustomRate({ ...customRate, years: Number(e.target.value) })}
              placeholder="Years"
              className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-black"
            />
            <input
              type="number"
              value={customRate.months}
              onChange={(e) => setCustomRate({ ...customRate, months: Number(e.target.value) })}
              placeholder="Months"
              className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-black"
            />
            <input
              type="number"
              value={customRate.days}
              onChange={(e) => setCustomRate({ ...customRate, days: Number(e.target.value) })}
              placeholder="Days"
              className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-black"
            />
          </div>
        )}
      </div>

      {/* Time */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-black mb-1">Time Period</label>
        <input
          type="number"
          value={time}
          onChange={(e) => setTime(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black"
        />

        <select
          value={timeUnit}
          onChange={(e) => setTimeUnit(e.target.value as any)}
          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-black"
        >
          <option value="days">Days</option>
          <option value="months">Months</option>
          <option value="years">Years</option>
        </select>
      </div>

      <button
        onClick={calculate}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
      >
        Calculate
      </button>

      {result !== null && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <p className="text-lg font-semibold text-black">Future Value: {result.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
};

export default InterestCalculator;
