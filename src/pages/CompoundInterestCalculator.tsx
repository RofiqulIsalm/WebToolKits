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

  useEffect(() => {
    calculateCompoundInterest();
  }, [principal, rate, time, frequency]);

  const calculateCompoundInterest = () => {
    const amount = principal * Math.pow((1 + (rate / 100) / frequency), frequency * time);
    setFinalAmount(amount);
    setCompoundInterest(amount - principal);
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
          </div>
        </div>

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

      <AdBanner type="bottom" />
    </div>
  );
};

export default CompoundInterestCalculator;