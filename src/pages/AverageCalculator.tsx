import React, { useState, useEffect } from 'react';
import { BarChart3, Plus, X } from 'lucide-react';
import AdBanner from '../components/AdBanner';

const AverageCalculator: React.FC = () => {
  const [numbers, setNumbers] = useState<number[]>([10, 20, 30, 40, 50]);
  const [mean, setMean] = useState<number>(0);
  const [median, setMedian] = useState<number>(0);
  const [mode, setMode] = useState<number[]>([]);
  const [sum, setSum] = useState<number>(0);

  useEffect(() => {
    calculate();
  }, [numbers]);

  const calculate = () => {
    if (numbers.length === 0) return;

    // Calculate mean
    const total = numbers.reduce((acc, num) => acc + num, 0);
    setSum(total);
    setMean(total / numbers.length);

    // Calculate median
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const medianValue = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
    setMedian(medianValue);

    // Calculate mode
    const frequency: {[key: number]: number} = {};
    numbers.forEach(num => {
      frequency[num] = (frequency[num] || 0) + 1;
    });

    const maxFreq = Math.max(...Object.values(frequency));
    const modes = Object.keys(frequency)
      .filter(num => frequency[Number(num)] === maxFreq)
      .map(Number);

    setMode(maxFreq > 1 ? modes : []);
  };

  const addNumber = () => {
    setNumbers([...numbers, 0]);
  };

  const removeNumber = (index: number) => {
    setNumbers(numbers.filter((_, i) => i !== index));
  };

  const updateNumber = (index: number, value: number) => {
    const newNumbers = [...numbers];
    newNumbers[index] = value;
    setNumbers(newNumbers);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Average Calculator</h1>
        <p className="text-gray-600">Calculate mean, median, mode, and sum of a set of numbers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Results</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">Mean (Average)</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {mean.toFixed(4)}
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <span className="font-medium text-gray-900">Median</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {median.toFixed(4)}
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-gray-900">Mode</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {mode.length > 0 ? mode.join(', ') : 'No mode'}
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-gray-900">Sum</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {sum.toFixed(4)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AdBanner type="bottom" />
    </div>
  );
};

export default AverageCalculator;