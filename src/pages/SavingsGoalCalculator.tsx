import React, { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const SavingsGoalCalculator: React.FC = () => {
  const [goalAmount, setGoalAmount] = useState<number>(1000000);
  const [timePeriod, setTimePeriod] = useState<number>(10);
  const [expectedReturn, setExpectedReturn] = useState<number>(8);

  const [monthlySaving, setMonthlySaving] = useState<number>(0);
  const [totalInvested, setTotalInvested] = useState<number>(0);
  const [totalGrowth, setTotalGrowth] = useState<number>(0);

  useEffect(() => {
    calculateSavingsGoal();
  }, [goalAmount, timePeriod, expectedReturn]);

  const calculateSavingsGoal = () => {
    const r = expectedReturn / 12 / 100; // monthly rate
    const n = timePeriod * 12; // months

    // Future value of SIP formula reversed:
    // FV = P * [((1 + r)^n - 1) / r] * (1 + r)
    // P = FV / ([((1 + r)^n - 1) / r] * (1 + r))
    const numerator = goalAmount;
    const denominator = ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const P = numerator / denominator;

    const total = P * n;
    const growth = goalAmount - total;

    setMonthlySaving(P);
    setTotalInvested(total);
    setTotalGrowth(growth);
  };

  return (
    <>
      <SEOHead
        title={seoData.savingsGoalCalculator.title}
        description={seoData.savingsGoalCalculator.description}
        canonical="https://calculatorhub.site/savings-goal-calculator"
        schemaData={generateCalculatorSchema(
          "Savings Goal Calculator",
          seoData.savingsGoalCalculator.description,
          "/savings-goal-calculator",
          seoData.savingsGoalCalculator.keywords
        )}
        breadcrumbs={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'Savings Goal Calculator', url: '/savings-goal-calculator' },
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Currency & Finance', url: '/category/currency-finance' },
            { name: 'Savings Goal Calculator', url: '/savings-goal-calculator' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Savings Goal Calculator
          </h1>
          <p className="text-slate-300">
            Find out how much you need to save each month to reach your financial goal on time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Goal Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Amount (₹)
                </label>
                <input
                  type="number"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(Number(e.target.value))}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Annual Return (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Savings Plan Summary
            </h2>

            <div className="space-y-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  ₹{monthlySaving.toFixed(0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Monthly Saving Required</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    ₹{totalInvested.toFixed(0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Amount Invested</div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    ₹{totalGrowth.toFixed(0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Growth / Returns</div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Goal Amount:</span>
                  <span className="font-medium">₹{goalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time Period:</span>
                  <span className="font-medium">{timePeriod} years</span>
                </div>
                <div className="flex justify-between">
                  <span>Expected Return:</span>
                  <span className="font-medium">{expectedReturn}% p.a.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators
          currentPath="/savings-goal-calculator"
          category="currency-finance"
        />
      </div>
    </>
  );
};

export default SavingsGoalCalculator;
