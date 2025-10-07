import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const TipCalculator: React.FC = () => {
  const [billAmount, setBillAmount] = useState<number>(100);
  const [tipPercentage, setTipPercentage] = useState<number>(15);
  const [numberOfPeople, setNumberOfPeople] = useState<number>(1);
  const [customTip, setCustomTip] = useState<string>('');
  const [results, setResults] = useState({
    tipAmount: 0,
    totalAmount: 0,
    perPersonAmount: 0,
    perPersonTip: 0
  });

  useEffect(() => {
    calculateTip();
  }, [billAmount, tipPercentage, numberOfPeople]);

  const calculateTip = () => {
    const tip = (billAmount * tipPercentage) / 100;
    const total = billAmount + tip;
    const perPerson = total / numberOfPeople;
    const tipPerPerson = tip / numberOfPeople;

    setResults({
      tipAmount: tip,
      totalAmount: total,
      perPersonAmount: perPerson,
      perPersonTip: tipPerPerson
    });
  };

  const setPresetTip = (percentage: number) => {
    setTipPercentage(percentage);
    setCustomTip('');
  };

  const handleCustomTip = (value: string) => {
    setCustomTip(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setTipPercentage(num);
    }
  };

  return (
    <>
      <SEOHead
        title={seoData.tipCalculator?.title || 'Tip Calculator - Calculate Restaurant Tips and Split Bills'}
        description={seoData.tipCalculator?.description || 'Calculate tips and split bills easily. Find the perfect tip amount and per-person cost for dining out with friends and family.'}
        canonical="https://calculatorhub.com/tip-calculator"
        schemaData={generateCalculatorSchema(
          'Tip Calculator',
          'Calculate tips and split bills for dining',
          '/tip-calculator',
          ['tip calculator', 'gratuity calculator', 'bill splitter', 'restaurant tip', 'tipping guide']
        )}
        breadcrumbs={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Tip Calculator', url: '/tip-calculator' }
        ]}
      />
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Tip Calculator', url: '/tip-calculator' }
        ]} />

        <div className="glow-card rounded-2xl p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <DollarSign className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Tip Calculator</h1>
          </div>

          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Bill Amount ($)
              </label>
              <input
                type="number"
                value={billAmount}
                onChange={(e) => setBillAmount(Number(e.target.value))}
                min={0}
                step={0.01}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                placeholder="Enter bill amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Tip Percentage
              </label>
              <div className="grid grid-cols-4 gap-3 mb-3">
                {[10, 15, 18, 20].map((percentage) => (
                  <button
                    key={percentage}
                    onClick={() => setPresetTip(percentage)}
                    className={`py-3 rounded-lg font-semibold transition-all ${
                      tipPercentage === percentage && customTip === ''
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {percentage}%
                  </button>
                ))}
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  value={customTip}
                  onChange={(e) => handleCustomTip(e.target.value)}
                  min={0}
                  step={0.1}
                  className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Custom tip %"
                />
                <span className="text-slate-400">or</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min={0}
                    max={30}
                    step={1}
                    value={tipPercentage}
                    onChange={(e) => {
                      setTipPercentage(Number(e.target.value));
                      setCustomTip(e.target.value);
                    }}
                    className="w-32"
                  />
                  <span className="text-white font-semibold w-12">{tipPercentage}%</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Number of People
              </label>
              <input
                type="number"
                value={numberOfPeople}
                onChange={(e) => setNumberOfPeople(Math.max(1, Number(e.target.value)))}
                min={1}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Number of people splitting the bill"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl border border-blue-500/30">
              <p className="text-sm text-slate-400 mb-1">Tip Amount</p>
              <p className="text-4xl font-bold text-white">${results.tipAmount.toFixed(2)}</p>
            </div>

            <div className="p-6 bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl border border-green-500/30">
              <p className="text-sm text-slate-400 mb-1">Total Amount</p>
              <p className="text-4xl font-bold text-white">${results.totalAmount.toFixed(2)}</p>
            </div>

            <div className="p-6 bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-xl border border-purple-500/30">
              <p className="text-sm text-slate-400 mb-1">Per Person Total</p>
              <p className="text-4xl font-bold text-white">${results.perPersonAmount.toFixed(2)}</p>
            </div>

            <div className="p-6 bg-gradient-to-br from-orange-900/30 to-orange-800/30 rounded-xl border border-orange-500/30">
              <p className="text-sm text-slate-400 mb-1">Per Person Tip</p>
              <p className="text-4xl font-bold text-white">${results.perPersonTip.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <AdBanner />

        <div className="glow-card rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">About Tip Calculator</h2>
          <div className="space-y-4 text-slate-300">
            <p>
              Calculate tips and split bills effortlessly with our tip calculator. Perfect for dining out,
              delivery orders, or any service where gratuity is customary. Get instant calculations for
              tip amounts and per-person costs.
            </p>
            <h3 className="text-xl font-semibold text-white mt-6">Tipping Guide:</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>10%:</strong> Minimum tip for adequate service</li>
              <li><strong>15%:</strong> Standard tip for good service</li>
              <li><strong>18%:</strong> Above-average service or large groups</li>
              <li><strong>20%+:</strong> Excellent service or fine dining</li>
            </ul>
            <h3 className="text-xl font-semibold text-white mt-6">Features:</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Preset tip percentages for quick selection</li>
              <li>Custom tip percentage input</li>
              <li>Slider for easy tip adjustment</li>
              <li>Bill splitting for multiple people</li>
              <li>Real-time calculation updates</li>
            </ul>
          </div>
        </div>

        <RelatedCalculators currentPath="/tip-calculator" />
      </div>
    </>
  );
};

export default TipCalculator;
