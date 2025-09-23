import React, { useState } from 'react';
import { Percent } from 'lucide-react';
import AdBanner from '../components/AdBanner';

const PercentageCalculator: React.FC = () => {
  const [value1, setValue1] = useState<number>(25);
  const [value2, setValue2] = useState<number>(200);
  const [percentageOf, setPercentageOf] = useState<number>(0);
  const [whatPercent, setWhatPercent] = useState<number>(0);
  const [percentIncrease, setPercentIncrease] = useState<number>(0);

  const calculatePercentageOf = () => {
    const result = (value1 / 100) * value2;
    setPercentageOf(result);
  };

  const calculateWhatPercent = () => {
    const result = (value1 / value2) * 100;
    setWhatPercent(result);
  };

  const calculatePercentIncrease = () => {
    const result = ((value2 - value1) / value1) * 100;
    setPercentIncrease(result);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Percentage Calculator</h1>
        <p className="text-gray-600">Calculate percentages, percentage increases, decreases, and more</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* What is X% of Y */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Percent className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">What is X% of Y?</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">What is</span>
              <input
                type="number"
                value={value1}
                onChange={(e) => setValue1(Number(e.target.value))}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
              />
              <span className="text-gray-600">% of</span>
              <input
                type="number"
                value={value2}
                onChange={(e) => setValue2(Number(e.target.value))}
                className="w-24 px-2 py-1 border border-gray-300 rounded text-center"
              />
              <span className="text-gray-600">?</span>
            </div>
            
            <button
              onClick={calculatePercentageOf}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Calculate
            </button>
            
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <div className="text-xl font-bold text-gray-900">{percentageOf}</div>
            </div>
          </div>
        </div>

        {/* X is what percent of Y */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Percent className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">X is what % of Y?</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2 flex-wrap">
              <input
                type="number"
                value={value1}
                onChange={(e) => setValue1(Number(e.target.value))}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
              />
              <span className="text-gray-600">is what % of</span>
              <input
                type="number"
                value={value2}
                onChange={(e) => setValue2(Number(e.target.value))}
                className="w-24 px-2 py-1 border border-gray-300 rounded text-center"
              />
              <span className="text-gray-600">?</span>
            </div>
            
            <button
              onClick={calculateWhatPercent}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Calculate
            </button>
            
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <div className="text-xl font-bold text-gray-900">{whatPercent.toFixed(2)}%</div>
            </div>
          </div>
        </div>

        {/* Percentage Increase/Decrease */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Percent className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">% Change</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">From:</label>
              <input
                type="number"
                value={value1}
                onChange={(e) => setValue1(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">To:</label>
              <input
                type="number"
                value={value2}
                onChange={(e) => setValue2(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <button
              onClick={calculatePercentIncrease}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Calculate
            </button>
            
            <div className={`p-3 rounded-lg text-center ${percentIncrease >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className={`text-xl font-bold ${percentIncrease >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {percentIncrease >= 0 ? '+' : ''}{percentIncrease.toFixed(2)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {percentIncrease >= 0 ? 'Increase' : 'Decrease'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AdBanner type="bottom" />

      {/* SEO Content Section */}
      <div className="mt-12 space-y-8">
        <div className="math-card rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Percentage Calculator Guide</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 mb-4">
              Percentage calculations are essential in daily life, from calculating discounts and tips to analyzing 
              business growth and academic grades. Our comprehensive percentage calculator handles all common 
              percentage calculations with easy-to-use interfaces for different calculation types.
            </p>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-4">Common Percentage Calculations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-3">What is X% of Y?</h4>
                <p className="text-slate-300 text-sm mb-2">Find a percentage of a number</p>
                <div className="text-xs text-slate-400">Example: What is 20% of 150? = 30</div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-3">X is what % of Y?</h4>
                <p className="text-slate-300 text-sm mb-2">Find what percentage one number is of another</p>
                <div className="text-xs text-slate-400">Example: 30 is what % of 150? = 20%</div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-3">Percentage Change</h4>
                <p className="text-slate-300 text-sm mb-2">Calculate increase or decrease percentage</p>
                <div className="text-xs text-slate-400">Example: From 100 to 120 = +20% increase</div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-3">Percentage Point</h4>
                <p className="text-slate-300 text-sm mb-2">Difference between two percentages</p>
                <div className="text-xs text-slate-400">Example: 25% - 20% = 5 percentage points</div>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mt-6 mb-4">Real-World Applications</h3>
            <ul className="text-slate-300 space-y-2 mb-6">
              <li>• <strong>Shopping:</strong> Calculate discounts, sales tax, and final prices</li>
              <li>• <strong>Finance:</strong> Interest rates, investment returns, loan calculations</li>
              <li>• <strong>Business:</strong> Profit margins, growth rates, market share</li>
              <li>• <strong>Education:</strong> Grade calculations, test scores, GPA</li>
              <li>• <strong>Statistics:</strong> Data analysis, survey results, demographics</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-4">Quick Tips</h3>
            <ul className="text-slate-300 space-y-2">
              <li>• To convert percentage to decimal: divide by 100</li>
              <li>• To convert decimal to percentage: multiply by 100</li>
              <li>• 50% = 0.5 = 1/2 (one half)</li>
              <li>• 25% = 0.25 = 1/4 (one quarter)</li>
              <li>• 100% = 1.0 = the whole amount</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PercentageCalculator;