import React, { useState } from 'react';
import { Percent } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

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
    <>
      <SEOHead
        title={seoData.percentageCalculator.title}
        description={seoData.percentageCalculator.description}
        canonical="https://calculatorhub.com/percentage-calculator"
        schemaData={generateCalculatorSchema(
          "Percentage Calculator",
          seoData.percentageCalculator.description,
          "/percentage-calculator",
          seoData.percentageCalculator.keywords
        )}
        breadcrumbs={[
          { name: 'Math Tools', url: '/category/math-tools' },
          { name: 'Percentage Calculator', url: '/percentage-calculator' }
        ]}
      />
    <div className="max-w-4xl mx-auto">
      <Breadcrumbs items={[
        { name: 'Math Tools', url: '/category/math-tools' },
        { name: 'Percentage Calculator', url: '/percentage-calculator' }
      ]} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Percentage Calculator</h1>
        <p className="text-slate-300">Calculate percentages, percentage increases, decreases, and more</p>
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
      
      <RelatedCalculators 
        currentPath="/percentage-calculator" 
        category="math-tools" 
      />
    </div>
    </>
  );
};

export default PercentageCalculator;