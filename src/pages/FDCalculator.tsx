import React, { useState, useEffect } from 'react';
import { Banknote } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const FDCalculator: React.FC = () => {
  const [principal, setPrincipal] = useState<number>(100000);
  const [rate, setRate] = useState<number>(7);
  const [time, setTime] = useState<number>(5);
  const [compounding, setCompounding] = useState<'yearly' | 'half-yearly' | 'quarterly' | 'monthly'>('quarterly');

  const [maturityAmount, setMaturityAmount] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [effectiveYield, setEffectiveYield] = useState<number>(0);

  useEffect(() => {
    calculateFD();
  }, [principal, rate, time, compounding]);

  const calculateFD = () => {
    const frequencyMap: Record<string, number> = {
      yearly: 1,
      'half-yearly': 2,
      quarterly: 4,
      monthly: 12,
    };

    const n = frequencyMap[compounding];
    const r = rate / 100;
    const maturity = principal * Math.pow(1 + r / n, n * time);
    const interest = maturity - principal;
    const effectiveRate = (Math.pow(1 + r / n, n) - 1) * 100;

    setMaturityAmount(maturity);
    setTotalInterest(interest);
    setEffectiveYield(effectiveRate);
  };

  return (
    <>
      <SEOHead
        title={seoData.fdCalculator.title}
        description={seoData.fdCalculator.description}
        canonical="https://calculatorhub.site/fd-calculator"
        schemaData={generateCalculatorSchema(
          "FD Calculator",
          seoData.fdCalculator.description,
          "/fd-calculator",
          seoData.fdCalculator.keywords
        )}
        breadcrumbs={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'FD Calculator', url: '/fd-calculator' },
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Currency & Finance', url: '/category/currency-finance' },
            { name: 'FD Calculator', url: '/fd-calculator' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Fixed Deposit (FD) Calculator
          </h1>
          <p className="text-slate-300">
            Calculate the maturity value, total interest, and annual yield of your fixed deposit investment.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              FD Details
            </h2>

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
                  Annual Interest Rate (%)
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
                  Time Period (Years)
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
                  value={compounding}
                  onChange={(e) =>
                    setCompounding(e.target.value as typeof compounding)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="yearly">Yearly</option>
                  <option value="half-yearly">Half-Yearly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              FD Summary
            </h2>

            <div className="space-y-6">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Banknote className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  ₹{maturityAmount.toFixed(0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Maturity Amount</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    ₹{totalInterest.toFixed(0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Interest</div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {effectiveYield.toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-600">Effective Annual Yield</div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Principal Amount:</span>
                  <span className="font-medium">
                    ₹{principal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Interest Rate:</span>
                  <span className="font-medium">{rate}% p.a.</span>
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

        <RelatedCalculators
          currentPath="/fd-calculator"
          category="currency-finance"
        />
      </div>
    </>
  );
};

export default FDCalculator;
