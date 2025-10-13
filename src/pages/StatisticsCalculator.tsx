import React, { useState, useEffect } from 'react';
import { BarChart3, Plus, X } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const StatisticsCalculator: React.FC = () => {
  const [numbers, setNumbers] = useState<number[]>([10, 20, 30, 40, 50]);
  const [mean, setMean] = useState<number>(0);
  const [median, setMedian] = useState<number>(0);
  const [mode, setMode] = useState<number[]>([]);
  const [range, setRange] = useState<number>(0);
  const [variance, setVariance] = useState<number>(0);
  const [stdDev, setStdDev] = useState<number>(0);

  useEffect(() => {
    calculate();
  }, [numbers]);

  const calculate = () => {
    if (numbers.length === 0) return;

    const sorted = [...numbers].sort((a, b) => a - b);
    const n = numbers.length;

    // Mean
    const sum = numbers.reduce((a, b) => a + b, 0);
    const meanVal = sum / n;

    // Median
    const mid = Math.floor(n / 2);
    const medianVal = n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

    // Mode
    const frequency: { [key: number]: number } = {};
    numbers.forEach(num => (frequency[num] = (frequency[num] || 0) + 1));
    const maxFreq = Math.max(...Object.values(frequency));
    const modeVal = Object.keys(frequency)
      .filter(num => frequency[Number(num)] === maxFreq)
      .map(Number);
    const modeResult = maxFreq > 1 ? modeVal : [];

    // Range
    const rangeVal = Math.max(...numbers) - Math.min(...numbers);

    // Variance & Standard Deviation
    const varianceVal = numbers.reduce((acc, num) => acc + Math.pow(num - meanVal, 2), 0) / n;
    const stdVal = Math.sqrt(varianceVal);

    setMean(meanVal);
    setMedian(medianVal);
    setMode(modeResult);
    setRange(rangeVal);
    setVariance(varianceVal);
    setStdDev(stdVal);
  };

  const addNumber = () => setNumbers([...numbers, 0]);
  const removeNumber = (index: number) => setNumbers(numbers.filter((_, i) => i !== index));
  const updateNumber = (index: number, value: number) => {
    const updated = [...numbers];
    updated[index] = value;
    setNumbers(updated);
  };

  return (
    <>
      <SEOHead
        title="Statistics Calculator | CalculatorHub"
        description="Calculate mean, median, mode, range, variance, and standard deviation easily using this online statistics calculator."
        canonical="https://calculatorhub.com/statistics-calculator"
        schemaData={generateCalculatorSchema(
          "Statistics Calculator",
          "Calculate mean, median, mode, range, variance, and standard deviation easily using this online statistics calculator.",
          "/statistics-calculator",
          "statistics calculator, data analysis, mean median mode, standard deviation"
        )}
        breadcrumbs={[
          { name: 'Math Tools', url: '/category/math-tools' },
          { name: 'Statistics Calculator', url: '/statistics-calculator' }
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Math Tools', url: '/category/math-tools' },
            { name: 'Statistics Calculator', url: '/statistics-calculator' }
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Statistics Calculator</h1>
          <p className="text-slate-300">
            Calculate mean, median, mode, range, variance, and standard deviation for any data set.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Enter Numbers</h2>

            <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
              {numbers.map((number, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 w-8">#{index + 1}</span>
                  <input
                    type="number"
                    value={number}
                    onChange={(e) => updateNumber(index, Number(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => removeNumber(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={numbers.length <= 1}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addNumber}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Number</span>
            </button>

            <div className="mt-4 text-sm text-gray-600">
              Count: {numbers.length} numbers
            </div>
          </div>

          {/* Result Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Results</h2>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Mean</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{mean.toFixed(4)}</div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">Median</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{median.toFixed(4)}</div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-gray-900">Mode</span>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {mode.length > 0 ? mode.join(', ') : 'No mode'}
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <BarChart3 className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-gray-900">Range</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{range.toFixed(4)}</div>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-gray-900">Variance</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{variance.toFixed(4)}</div>
              </div>

              <div className="p-4 bg-pink-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <BarChart3 className="h-5 w-5 text-pink-600" />
                  <span className="font-medium text-gray-900">Standard Deviation</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{stdDev.toFixed(4)}</div>
              </div>
            </div>
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators
          currentPath="/statistics-calculator"
          category="math-tools"
        />
      </div>
    </>
  );
};

export default StatisticsCalculator;
