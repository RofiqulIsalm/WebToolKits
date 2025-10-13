import React, { useState, useEffect } from 'react';
import { PiggyBank } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const RDCalculator: React.FC = () => {
  const [monthlyDeposit, setMonthlyDeposit] = useState<number>(5000);
  const [interestRate, setInterestRate] = useState<number>(7);
  const [time, setTime] = useState<number>(5);

  const [maturityValue, setMaturityValue] = useState<number>(0);
  const [totalDeposited, setTotalDeposited] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);

  useEffect(() => {
    calculateRD();
  }, [monthlyDeposit, interestRate, time]);

  const calculateRD = () => {
    const P = monthlyDeposit;
    const r = interestRate / 100 / 4; // Quarterly compounding
    const n = time * 12; // months

    // RD maturity formula:
    // M = P * [ (1 + r/4)^(n/3) - 1 ] / (1 - (1 + r/4)^(-1/3))
    const quarters = n / 3;
    const maturity =
      P * ((Math.pow(1 + r, quarters) - 1) / (1 - Math.pow(1 + r, -1 / 3)));
    const total = P * n;
    const interest = maturity - total;

    setMaturityValue(maturity);
    setTotalDeposited(total);
    setTotalInterest(interest);
  };

  return (
    <>
      <SEOHead
        title={seoData.rdCalculator.title}
        description={seoData.rdCalculator.description}
        canonical="https://calculatorhub.com/rd-calculator"
        schemaData={generateCalculatorSchema(
          "RD Calculator",
          seoData.rdCalculator.description,
          "/rd-calculator",
          seoData.rdCalculator.keywords
        )}
        breadcrumbs={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'RD Calculator', url: '/rd-calculator' },
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Currency & Finance', url: '/category/currency-finance' },
            { name: 'RD Calculator', url: '/rd-calculator' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Recurring Deposit (RD) Calculator
          </h1>
          <p className="text-slate-300">
            Calculate the maturity value, total deposits, and interest earned from your recurring deposit.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              RD Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Deposit (₹)
                </label>
                <input
                  type="number"
                  value={monthlyDeposit}
                  onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Period (Years)
                </label>
                <input
                  type="number"
                  value={time}
                  onChange={(e) => setTime(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              RD Summary
            </h2>

            <div className="space-y-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <PiggyBank className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  ₹{maturityValue.toFixed(0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Maturity Amount</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    ₹{totalDeposited.toFixed(0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Deposited</div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    ₹{totalInterest.toFixed(0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Interest</div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Monthly Deposit:</span>
                  <span className="font-medium">
                    ₹{monthlyDeposit.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Interest Rate:</span>
                  <span className="font-medium">{interestRate}% p.a.</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">{time} years</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators
          currentPath="/rd-calculator"
          category="currency-finance"
        />
      </div>
    </>
  );
};

export default RDCalculator;
