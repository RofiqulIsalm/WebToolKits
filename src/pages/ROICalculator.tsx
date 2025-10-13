import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const ROICalculator: React.FC = () => {
  const [initialInvestment, setInitialInvestment] = useState<number>(100000);
  const [finalValue, setFinalValue] = useState<number>(125000);
  const [years, setYears] = useState<number>(2);

  const [roi, setRoi] = useState<number>(0);
  const [annualizedRoi, setAnnualizedRoi] = useState<number>(0);
  const [profit, setProfit] = useState<number>(0);

  useEffect(() => {
    calculateROI();
  }, [initialInvestment, finalValue, years]);

  const calculateROI = () => {
    if (initialInvestment <= 0 || finalValue <= 0) return;

    const totalReturn = ((finalValue - initialInvestment) / initialInvestment) * 100;
    const profitValue = finalValue - initialInvestment;

    // Annualized ROI using compound annual growth rate (CAGR)
    const annualReturn = (Math.pow(finalValue / initialInvestment, 1 / years) - 1) * 100;

    setRoi(totalReturn);
    setAnnualizedRoi(annualReturn);
    setProfit(profitValue);
  };

  return (
    <>
      <SEOHead
        title={seoData.roiCalculator.title}
        description={seoData.roiCalculator.description}
        canonical="https://calculatorhub.site/roi-calculator"
        schemaData={generateCalculatorSchema(
          "ROI Calculator",
          seoData.roiCalculator.description,
          "/roi-calculator",
          seoData.roiCalculator.keywords
        )}
        breadcrumbs={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'ROI Calculator', url: '/roi-calculator' },
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Currency & Finance', url: '/category/currency-finance' },
            { name: 'ROI Calculator', url: '/roi-calculator' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            ROI Calculator
          </h1>
          <p className="text-slate-300">
            Calculate your return on investment, profit amount, and annualized ROI over time.
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
                  Initial Investment (₹)
                </label>
                <input
                  type="number"
                  value={initialInvestment}
                  onChange={(e) => setInitialInvestment(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Final Value (₹)
                </label>
                <input
                  type="number"
                  value={finalValue}
                  onChange={(e) => setFinalValue(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Duration (Years)
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
              ROI Summary
            </h2>

            <div className="space-y-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {roi.toFixed(2)}%
                </div>
                <div className="text-sm text-gray-600">Total ROI</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    ₹{profit.toFixed(0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Profit / Gain</div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {annualizedRoi.toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-600">Annualized ROI (CAGR)</div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Initial Investment:</span>
                  <span className="font-medium">₹{initialInvestment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Final Value:</span>
                  <span className="font-medium">₹{finalValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Investment Duration:</span>
                  <span className="font-medium">{years} years</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators
          currentPath="/roi-calculator"
          category="currency-finance"
        />
      </div>
    </>
  );
};

export default ROICalculator;
