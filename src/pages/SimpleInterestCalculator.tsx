import React, { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const SimpleInterestCalculator: React.FC = () => {
  const [principal, setPrincipal] = useState<number>(100000);
  const [rate, setRate] = useState<number>(8);
  const [time, setTime] = useState<number>(3);

  const [interest, setInterest] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  useEffect(() => {
    calculateSimpleInterest();
  }, [principal, rate, time]);

  const calculateSimpleInterest = () => {
    const SI = (principal * rate * time) / 100;
    const total = principal + SI;
    setInterest(SI);
    setTotalAmount(total);
  };

  return (
    <>
      <SEOHead
        title={seoData.simpleInterestCalculator.title}
        description={seoData.simpleInterestCalculator.description}
        canonical="https://calculatorhub.com/simple-interest-calculator"
        schemaData={generateCalculatorSchema(
          "Simple Interest Calculator",
          seoData.simpleInterestCalculator.description,
          "/simple-interest-calculator",
          seoData.simpleInterestCalculator.keywords
        )}
        breadcrumbs={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'Simple Interest Calculator', url: '/simple-interest-calculator' },
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Currency & Finance', url: '/category/currency-finance' },
            { name: 'Simple Interest Calculator', url: '/simple-interest-calculator' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Simple Interest Calculator
          </h1>
          <p className="text-slate-300">
            Calculate simple interest, total amount, and total earnings on your investment or loan.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Interest Details</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Principal Amount (₹)</label>
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (% per annum)</label>
                <input
                  type="number"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Period (Years)</label>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Result Summary</h2>

            <div className="space-y-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Calculator className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">₹{interest.toFixed(0).toLocaleString()}</div>
                <div className="text-sm text-gray-600">Simple Interest Earned</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    ₹{totalAmount.toFixed(0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Amount (Principal + Interest)</div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {((interest / principal) * 100).toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-600">Overall Return</div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Principal:</span>
                  <span className="font-medium">₹{principal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Interest Rate:</span>
                  <span className="font-medium">{rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Time Period:</span>
                  <span className="font-medium">{time} years</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators currentPath="/simple-interest-calculator" category="currency-finance" />
      </div>
    </>
  );
};

export default SimpleInterestCalculator;
