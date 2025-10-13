import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const InflationCalculator: React.FC = () => {
  const [currentAmount, setCurrentAmount] = useState<number>(100000);
  const [inflationRate, setInflationRate] = useState<number>(6);
  const [years, setYears] = useState<number>(10);

  const [futureValue, setFutureValue] = useState<number>(0);
  const [valueLost, setValueLost] = useState<number>(0);
  const [purchasingPower, setPurchasingPower] = useState<number>(0);

  useEffect(() => {
    calculateInflation();
  }, [currentAmount, inflationRate, years]);

  const calculateInflation = () => {
    // Future value of today's money = P * (1 + i)^n
    const fv = currentAmount * Math.pow(1 + inflationRate / 100, years);
    const lost = fv - currentAmount;
    const power = currentAmount / Math.pow(1 + inflationRate / 100, years);

    setFutureValue(fv);
    setValueLost(lost);
    setPurchasingPower(power);
  };

  return (
    <>
      <SEOHead
        title={seoData.inflationCalculator.title}
        description={seoData.inflationCalculator.description}
        canonical="https://calculatorhub.site/inflation-calculator"
        schemaData={generateCalculatorSchema(
          "Inflation Calculator",
          seoData.inflationCalculator.description,
          "/inflation-calculator",
          seoData.inflationCalculator.keywords
        )}
        breadcrumbs={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'Inflation Calculator', url: '/inflation-calculator' },
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Currency & Finance', url: '/category/currency-finance' },
            { name: 'Inflation Calculator', url: '/inflation-calculator' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Inflation Calculator
          </h1>
          <p className="text-slate-300">
            Calculate how inflation affects your money’s purchasing power and estimate its future value.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Inflation Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Amount (₹)
                </label>
                <input
                  type="number"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inflation Rate (% per year)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={inflationRate}
                  onChange={(e) => setInflationRate(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Period (Years)
                </label>
                <input
                  type="number"
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Inflation Summary
            </h2>

            <div className="space-y-6">
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  ₹{futureValue.toFixed(0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Future Value of ₹{currentAmount.toLocaleString()}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    ₹{valueLost.toFixed(0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Value Lost to Inflation</div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    ₹{purchasingPower.toFixed(0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Equivalent Value Today</div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Inflation Rate:</span>
                  <span className="font-medium">{inflationRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Time Period:</span>
                  <span className="font-medium">{years} years</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Amount:</span>
                  <span className="font-medium">₹{currentAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators
          currentPath="/inflation-calculator"
          category="currency-finance"
        />
      </div>
    </>
  );
};

export default InflationCalculator;
