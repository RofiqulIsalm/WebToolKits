import React, { useState } from 'react';
import { Dices, RefreshCw } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const RandomNumberGenerator: React.FC = () => {
  const [min, setMin] = useState<number>(1);
  const [max, setMax] = useState<number>(100);
  const [count, setCount] = useState<number>(1);
  const [allowDuplicates, setAllowDuplicates] = useState<boolean>(true);
  const [generatedNumbers, setGeneratedNumbers] = useState<number[]>([]);

  const generateNumbers = () => {
    if (min >= max) {
      alert('Minimum must be less than maximum');
      return;
    }

    if (!allowDuplicates && (max - min + 1) < count) {
      alert('Not enough unique numbers available in the range');
      return;
    }

    const numbers: number[] = [];
    const usedNumbers = new Set<number>();

    for (let i = 0; i < count; i++) {
      let num: number;
      if (allowDuplicates) {
        num = Math.floor(Math.random() * (max - min + 1)) + min;
        numbers.push(num);
      } else {
        do {
          num = Math.floor(Math.random() * (max - min + 1)) + min;
        } while (usedNumbers.has(num));
        usedNumbers.add(num);
        numbers.push(num);
      }
    }

    setGeneratedNumbers(numbers);
  };

  return (
    <>
      <SEOHead
        title={seoData.randomNumberGenerator?.title || 'Random Number Generator - Generate Random Numbers'}
        description={seoData.randomNumberGenerator?.description || 'Generate random numbers with customizable range, quantity, and duplicate options. Perfect for games, lottery, statistics, and more.'}
        canonical="https://calculatorhub.com/random-number-generator"
        schemaData={generateCalculatorSchema(
          'Random Number Generator',
          'Generate random numbers with customizable range and options',
          '/random-number-generator',
          ['random number', 'number generator', 'random', 'lottery numbers', 'dice roll']
        )}
        breadcrumbs={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Random Number Generator', url: '/random-number-generator' }
        ]}
      />
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Random Number Generator', url: '/random-number-generator' }
        ]} />

        <div className="glow-card rounded-2xl p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Dices className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Random Number Generator</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Minimum Value
              </label>
              <input
                type="number"
                value={min}
                onChange={(e) => setMin(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter minimum"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Maximum Value
              </label>
              <input
                type="number"
                value={max}
                onChange={(e) => setMax(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter maximum"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                How Many Numbers?
              </label>
              <input
                type="number"
                value={count}
                min={1}
                max={1000}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Count"
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="duplicates"
                checked={allowDuplicates}
                onChange={(e) => setAllowDuplicates(e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="duplicates" className="text-sm font-medium text-white">
                Allow Duplicate Numbers
              </label>
            </div>
          </div>

          <button
            onClick={generateNumbers}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Generate Random Numbers</span>
          </button>

          {generatedNumbers.length > 0 && (
            <div className="mt-6 p-6 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-500/30">
              <h3 className="text-lg font-semibold text-white mb-4">Generated Numbers:</h3>
              <div className="flex flex-wrap gap-3">
                {generatedNumbers.map((num, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg font-mono text-lg font-semibold"
                  >
                    {num}
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm text-slate-300">
                <p>Total numbers generated: {generatedNumbers.length}</p>
                <p>Range: {min} to {max}</p>
              </div>
            </div>
          )}
        </div>

        <AdBanner />

        <div className="glow-card rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">About Random Number Generator</h2>
          <div className="space-y-4 text-slate-300">
            <p>
              Generate random numbers for any purpose with our easy-to-use random number generator.
              Perfect for games, lottery picks, statistical sampling, cryptography, and educational purposes.
            </p>
            <h3 className="text-xl font-semibold text-white mt-6">Features:</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Generate single or multiple random numbers at once</li>
              <li>Customizable minimum and maximum range</li>
              <li>Option to allow or prevent duplicate numbers</li>
              <li>Instant generation with visual display</li>
              <li>Perfect for games, contests, and random selection</li>
            </ul>
            <h3 className="text-xl font-semibold text-white mt-6">Common Uses:</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Lottery number selection</li>
              <li>Gaming and dice simulation</li>
              <li>Random sampling for research</li>
              <li>Password generation</li>
              <li>Contest winner selection</li>
            </ul>
          </div>
        </div>

        <RelatedCalculators currentPath="/random-number-generator" />
      </div>
    </>
  );
};

export default RandomNumberGenerator;
