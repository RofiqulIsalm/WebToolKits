import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import AdBanner from '../components/AdBanner';

const CompoundInterestCalculator: React.FC = () => {
  const [principal, setPrincipal] = useState<number>(10000);
  const [rate, setRate] = useState<number>(8);
  const [time, setTime] = useState<number>(5);
  const [frequency, setFrequency] = useState<number>(12);
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [compoundInterest, setCompoundInterest] = useState<number>(0);

  // New states
  const [breakdownMode, setBreakdownMode] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [includeAllDays, setIncludeAllDays] = useState<boolean>(true);
  const [breakdownData, setBreakdownData] = useState<any[]>([]);

  useEffect(() => {
    calculateCompoundInterest();
    generateBreakdown();
  }, [principal, rate, time, frequency, breakdownMode, includeAllDays]);

  const calculateCompoundInterest = () => {
    const amount = principal * Math.pow((1 + (rate / 100) / frequency), frequency * time);
    setFinalAmount(amount);
    setCompoundInterest(amount - principal);
  };

  // Generate breakdown function
  const generateBreakdown = () => {
    let data: any[] = [];
    const startDate = new Date();
    let balance = principal;
    const totalDays = Math.floor(time * 365); // rough conversion
    const dailyRate = rate / 100 / 365;

    let totalEarnings = 0;

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      // Skip weekends if includeAllDays = false
      if (!includeAllDays) {
        const day = date.getDay();
        if (day === 0 || day === 6) continue;
      }

      // Earnings per day
      const earnings = balance * dailyRate;
      balance += earnings;
      totalEarnings += earnings;

      let label = '';
      if (breakdownMode === 'daily') {
        const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        label = `${days[date.getDay()]} ${i + 1}`;
      } else if (breakdownMode === 'weekly') {
        const weekNum = Math.floor(i / 7) + 1;
        label = `Week ${weekNum}`;
      } else if (breakdownMode === 'monthly') {
        label = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      } else if (breakdownMode === 'yearly') {
        label = date.getFullYear().toString();
      }

      data.push({
        period: label,
        earnings: earnings,
        totalEarnings: totalEarnings,
        balance: balance
      });
    }

    // Collapse duplicates for month/year
    if (breakdownMode === 'monthly' || breakdownMode === 'yearly') {
      const grouped: Record<string, any> = {};
      data.forEach((row) => {
        if (!grouped[row.period]) {
          grouped[row.period] = { ...row };
        } else {
          grouped[row.period].earnings += row.earnings;
          grouped[row.period].totalEarnings = row.totalEarnings;
          grouped[row.period].balance = row.balance;
        }
      });
      data = Object.values(grouped);
    }

    // Add total row
    data.push({
      period: 'Total',
      earnings: data.reduce((sum, r: any) => sum + r.earnings, 0),
      totalEarnings: totalEarnings,
      balance: balance
    });

    setBreakdownData(data);
  };

  const frequencies = [
    { value: 1, label: 'Annually' },
    { value: 2, label: 'Semi-annually' },
    { value: 4, label: 'Quarterly' },
    { value: 12, label: 'Monthly' },
    { value: 365, label: 'Daily' }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Compound Interest Calculator</h1>
        <p className="text-gray-600">Calculate the compound interest on your investments and savings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Box */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Investment Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Principal Amount (₹)
              </label>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interest Rate (% per annum)
              </label>
              <input
                type="number"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Period (years)
              </label>
              <input
                type="number"
                value={time}
                onChange={(e) => setTime(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compounding Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {frequencies.map((freq) => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
            </div>

            {/* New Controls */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Breakdown Mode</label>
              <select
                value={breakdownMode}
                onChange={(e) => setBreakdownMode(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={includeAllDays}
                onChange={(e) => setIncludeAllDays(e.target.checked)}
              />
              <label className="text-sm text-gray-700">Include all days of the week</label>
            </div>
          </div>
        </div>

        {/* Result Box */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Results</h2>
          
          <div className="space-y-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                ₹{finalAmount.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Final Amount</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <div className="text-lg font-semibold text-gray-900">
                  ₹{principal.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Principal</div>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg text-center">
                <div className="text-lg font-semibold text-gray-900">
                  ₹{compoundInterest.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Compound Interest</div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Growth Summary</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Total Return:</span>
                  <span className="font-medium">
                    {((compoundInterest / principal) * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Annual Return:</span>
                  <span className="font-medium">
                    {(Math.pow(finalAmount / principal, 1 / time) - 1).toFixed(4)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="mt-10 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">Period</th>
                <th className="px-4 py-2 border">Earnings</th>
                <th className="px-4 py-2 border">Total Earnings</th>
                <th className="px-4 py-2 border">Balance</th>
              </tr>
            </thead>
            <tbody>
              {breakdownData.map((row, idx) => (
                <tr key={idx} className={row.period === 'Total' ? 'bg-gray-200 font-semibold' : idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-4 py-2 border">{row.period}</td>
                  <td className="px-4 py-2 border">₹{row.earnings.toFixed(2)}</td>
                  <td className="px-4 py-2 border">₹{row.totalEarnings.toFixed(2)}</td>
                  <td className="px-4 py-2 border">₹{row.balance.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AdBanner type="bottom" />
    </div>
  );
};

export default CompoundInterestCalculator;
