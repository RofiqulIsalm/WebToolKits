import React, { useState, useEffect } from 'react';
import { PiggyBank } from 'lucide-react';
import AdBanner from '../components/AdBanner';

const LoanEMICalculator: React.FC = () => {
  const [principal, setPrincipal] = useState<number>(100000);
  const [rate, setRate] = useState<number>(10);
  const [tenure, setTenure] = useState<number>(12);
  const [emi, setEmi] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);

  useEffect(() => {
    calculateEMI();
  }, [principal, rate, tenure]);

  const calculateEMI = () => {
    const monthlyRate = rate / 100 / 12;
    const months = tenure;

    if (monthlyRate === 0) {
      setEmi(principal / months);
    } else {
      const emiValue = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                      (Math.pow(1 + monthlyRate, months) - 1);
      setEmi(emiValue);
    }

    const total = emi * months;
    setTotalAmount(total);
    setTotalInterest(total - principal);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Loan EMI Calculator</h1>
        <p className="text-gray-600">Calculate your monthly loan EMI, total amount, and interest payable</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="finance-card rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Loan Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Loan Amount (Principal)
              </label>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full px-4 py-2 glow-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Interest Rate (% per annum)
              </label>
              <input
                type="number"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full px-4 py-2 glow-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Loan Tenure (months)
              </label>
              <input
                type="number"
                value={tenure}
                onChange={(e) => setTenure(Number(e.target.value))}
                className="w-full px-4 py-2 glow-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-slate-400 mt-1">
                {Math.floor(tenure / 12)} years {tenure % 12} months
              </p>
            </div>
          </div>
        </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="finance-card rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">EMI Breakdown</h2>
          
          <div className="space-y-6">
            <div className="text-center p-4 result-purple rounded-lg">
              <PiggyBank className="h-8 w-8 text-white mx-auto mb-2 drop-shadow-lg" />
              <div className="text-2xl font-bold text-white drop-shadow-lg">
                ₹{emi.toFixed(2)}
              </div>
              <div className="text-sm text-slate-300">Monthly EMI</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 result-green rounded-lg text-center">
                <div className="text-lg font-semibold text-white">
                  ₹{principal.toLocaleString()}
                </div>
                <div className="text-sm text-slate-300">Principal Amount</div>
              </div>
              
              <div className="p-4 result-amber rounded-lg text-center">
                <div className="text-lg font-semibold text-white">
                  ₹{totalInterest.toFixed(0)}
                </div>
                <div className="text-sm text-slate-300">Total Interest</div>
              </div>
            </div>

            <div className="p-4 result-purple rounded-lg text-center">
              <div className="text-xl font-semibold text-white">
                ₹{totalAmount.toFixed(0)}
              </div>
              <div className="text-sm text-slate-300">Total Amount Payable</div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <AdBanner type="bottom" />
    </div>
  );
};

export default LoanEMICalculator;