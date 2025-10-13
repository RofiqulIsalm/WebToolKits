import React, { useState, useEffect } from 'react';
import { PiggyBank } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const SIPCalculator: React.FC = () => {
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(10000);
  const [returnRate, setReturnRate] = useState<number>(12);
  const [timePeriod, setTimePeriod] = useState<number>(10);
  const [maturityValue, setMaturityValue] = useState<number>(0);
  const [investedAmount, setInvestedAmount] = useState<number>(0);
  const [estimatedProfit, setEstimatedProfit] = useState<number>(0);

  useEffect(() => {
    calculateSIP();
  }, [monthlyInvestment, returnRate, timePeriod]);

  const calculateSIP = () => {
    const P = monthlyInvestment;
    const r = returnRate / 12 / 100;
    const n = timePeriod * 12;

    const futureValue = P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const invested = P * n;
    const profit = futureValue - invested;

    setMaturityValue(futureValue);
    setInvestedAmount(invested);
    setEstimatedProfit(profit);
  };

  return (
    <>
      <SEOHead
        title={seoData.sipCalculator.title}
        description={seoData.sipCalculator.description}
        canonical="https://calculatorhub.com/sip-calculator"
        schemaData={generateCalculatorSchema(
          "SIP Calculator",
          seoData.sipCalculator.description,
          "/sip-calculator",
          seoData.sipCalculator.keywords
        )}
        breadcrumbs={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'SIP Calculator', url: '/sip-calculator' },
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Currency & Finance', url: '/category/currency-finance' },
            { name: 'SIP Calculator', url: '/sip-calculator' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            SIP Calculator
          </h1>
          <p className="text-slate-300">
            Estimate the maturity amount, total investment, and profit for your SIP investments.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Investment Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Investment (₹)
                </label>
                <input
                  type="number"
                  value={monthlyInvestment}
                  onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Annual Return (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={returnRate}
                  onChange={(e) => setReturnRate(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Period (Years)
                </label>
                <input
                  type="number"
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              SIP Summary
            </h2>

            <div className="space-y-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <PiggyBank className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  ₹{maturityValue.toFixed(0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Maturity Value</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    ₹{investedAmount.toFixed(0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Investment</div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    ₹{estimatedProfit.toFixed(0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Estimated Profit</div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Investment Duration:</span>
                  <span className="font-medium">{timePeriod} years</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly SIP:</span>
                  <span className="font-medium">₹{monthlyInvestment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expected Return:</span>
                  <span className="font-medium">{returnRate}% p.a.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators
          currentPath="/sip-calculator"
          category="currency-finance"
        />
      </div>
    </>
  );
};

export default SIPCalculator;
