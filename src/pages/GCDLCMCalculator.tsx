import React, { useState, useEffect } from 'react';
import { BarChart3, Plus, X } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const GcdLcmCalculator: React.FC = () => {
  const [numbers, setNumbers] = useState<number[]>([12, 18]);
  const [gcd, setGcd] = useState<number>(0);
  const [lcm, setLcm] = useState<number>(0);

  useEffect(() => {
    calculate();
  }, [numbers]);

  const gcdOfTwo = (a: number, b: number): number => {
    return b === 0 ? a : gcdOfTwo(b, a % b);
  };

  const lcmOfTwo = (a: number, b: number): number => {
    return Math.abs(a * b) / gcdOfTwo(a, b);
  };

  const calculate = () => {
    if (numbers.length === 0) return;

    let currentGcd = numbers[0];
    let currentLcm = numbers[0];

    for (let i = 1; i < numbers.length; i++) {
      currentGcd = gcdOfTwo(currentGcd, numbers[i]);
      currentLcm = lcmOfTwo(currentLcm, numbers[i]);
    }

    setGcd(currentGcd);
    setLcm(currentLcm);
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
        title="GCD & LCM Calculator | CalculatorHub"
        description="Find the Greatest Common Divisor (GCD) and Least Common Multiple (LCM) of two or more numbers instantly with this online GCD LCM calculator."
        canonical="https://calculatorhub.site/gcd-lcm-calculator"
        schemaData={generateCalculatorSchema(
          "GCD & LCM Calculator",
          "Find the Greatest Common Divisor (GCD) and Least Common Multiple (LCM) of two or more numbers instantly.",
          "/gcd-lcm-calculator",
          "GCD calculator, LCM calculator, math tools, number divisibility"
        )}
        breadcrumbs={[
          { name: 'Math Tools', url: '/category/math-tools' },
          { name: 'GCD & LCM Calculator', url: '/gcd-lcm-calculator' }
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Math Tools', url: '/category/math-tools' },
            { name: 'GCD & LCM Calculator', url: '/gcd-lcm-calculator' }
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">GCD & LCM Calculator</h1>
          <p className="text-slate-300">
            Calculate the Greatest Common Divisor (GCD) and Least Common Multiple (LCM) for two or more numbers.
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
                    min={0}
                    value={number}
                    onChange={(e) => updateNumber(index, Number(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => removeNumber(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={numbers.length <= 2}
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
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">GCD (Greatest Common Divisor)</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{gcd}</div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900">LCM (Least Common Multiple)</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{lcm}</div>
              </div>
            </div>
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators
          currentPath="/gcd-lcm-calculator"
          category="math-tools"
        />
      </div>
    </>
  );
};

export default GcdLcmCalculator;
