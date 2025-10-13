import React, { useState, useEffect } from 'react';
import { Briefcase } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const RetirementCalculator: React.FC = () => {
  const [currentAge, setCurrentAge] = useState<number>(30);
  const [retirementAge, setRetirementAge] = useState<number>(60);
  const [monthlyExpense, setMonthlyExpense] = useState<number>(40000);
  const [expectedReturn, setExpectedReturn] = useState<number>(10);
  const [inflationRate, setInflationRate] = useState<number>(6);
  const [lifeExpectancy, setLifeExpectancy] = useState<number>(80);

  const [corpusNeeded, setCorpusNeeded] = useState<number>(0);
  const [futureExpense, setFutureExpense] = useState<number>(0);
  const [yearsPostRetirement, setYearsPostRetirement] = useState<number>(0);

  useEffect(() => {
    calculateRetirement();
  }, [currentAge, retirementAge, monthlyExpense, expectedReturn, inflationRate, lifeExpectancy]);

  const calculateRetirement = () => {
    const yearsToRetirement = retirementAge - currentAge;
    const yearsAfterRetirement = lifeExpectancy - retirementAge;
    setYearsPostRetirement(yearsAfterRetirement);

    // Adjust current monthly expense for inflation till retirement
    const inflatedExpense = monthlyExpense * Math.pow(1 + inflationRate / 100, yearsToRetirement);
    setFutureExpense(inflatedExpense);

    // Annual expense at retirement
    const annualExpense = inflatedExpense * 12;

    // Real rate of return after inflation
    const realReturn = ((1 + expectedReturn / 100) / (1 + inflationRate / 100)) - 1;

    // Corpus needed (Present Value of annuity formula)
    const corpus =
      annualExpense * ((1 - Math.pow(1 + realReturn, -yearsAfterRetirement)) / realReturn);

    setCorpusNeeded(corpus);
  };

  return (
    <>
      <SEOHead
        title={seoData.retirementCalculator.title}
        description={seoData.retirementCalculator.description}
        canonical="https://calculatorhub.com/retirement-calculator"
        schemaData={generateCalculatorSchema(
          "Retirement Calculator",
          seoData.retirementCalculator.description,
          "/retirement-calculator",
          seoData.retirementCalculator.keywords
        )}
        breadcrumbs={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'Retirement Calculator', url: '/retirement-calculator' },
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Currency & Finance', url: '/category/currency-finance' },
            { name: 'Retirement Calculator', url: '/retirement-calculator' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Retirement Calculator
          </h1>
          <p className="text-slate-300">
            Estimate how much you need to save to retire comfortably, accounting for inflation and lifestyle.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Personal & Financial Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Age</label>
                <input
                  type="number"
                  value={currentAge}
                  onChange={(e) => setCurrentAge(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Retirement Age</label>
                <input
                  type="number"
                  value={retirementAge}
                  onChange={(e) => setRetirementAge(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Expenses (₹)</label>
                <input
                  type="number"
                  value={monthlyExpense}
                  onChange={(e) => setMonthlyExpense(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Return Rate (% p.a.)</label>
                <input
                  type="number"
                  step="0.1"
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Inflation Rate (% p.a.)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inflationRate}
                  onChange={(e) => setInflationRate(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Life Expectancy (Years)</label>
                <input
                  type="number"
                  value={lifeExpectancy}
                  onChange={(e) => setLifeExpectancy(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Retirement Summary
            </h2>

            <div className="space-y-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Briefcase className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  ₹{corpusNeeded.toFixed(0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Corpus Required at Retirement</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    ₹{futureExpense.toFixed(0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Monthly Expense at Retirement</div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {yearsPostRetirement} years
                  </div>
                  <div className="text-sm text-gray-600">Years Post Retirement</div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Current Age:</span>
                  <span className="font-medium">{currentAge} years</span>
                </div>
                <div className="flex justify-between">
                  <span>Retirement Age:</span>
                  <span className="font-medium">{retirementAge} years</span>
                </div>
                <div className="flex justify-between">
                  <span>Inflation Rate:</span>
                  <span className="font-medium">{inflationRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Expected Return:</span>
                  <span className="font-medium">{expectedReturn}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators
          currentPath="/retirement-calculator"
          category="currency-finance"
        />
      </div>
    </>
  );
};

export default RetirementCalculator;
