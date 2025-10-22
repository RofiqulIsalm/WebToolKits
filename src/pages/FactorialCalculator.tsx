import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { BarChart3 } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const FactorialCalculator: React.FC = () => {
  const [number, setNumber] = useState<number>(5);
  const [factorial, setFactorial] = useState<string>('120');
  const [steps, setSteps] = useState<string>('1 × 2 × 3 × 4 × 5 = 120');
  const [digits, setDigits] = useState<number>(3);

  useEffect(() => {
    calculateFactorial();
  }, [number]);

  const calculateFactorial = () => {
    if (number < 0) {
      setFactorial('Undefined for negative numbers');
      setSteps('—');
      setDigits(0);
      return;
    }

    if (number === 0 || number === 1) {
      setFactorial('1');
      setSteps(`${number}! = 1`);
      setDigits(1);
      return;
    }

    let result = BigInt(1);
    const stepArray = [];
    for (let i = 1; i <= number; i++) {
      result *= BigInt(i);
      stepArray.push(i);
    }

    const factorialStr = result.toString();
    setFactorial(factorialStr);
    setSteps(`${stepArray.join(' × ')} = ${factorialStr}`);
    setDigits(factorialStr.length);
  };

  return (
    <>
      <SEOHead
        title="Factorial Calculator | CalculatorHub"
        description="Calculate the factorial of any number instantly. Get step-by-step results, number of digits, and detailed factorial breakdown."
        canonical="https://calculatorhub.site/factorial-calculator"
        schemaData={generateCalculatorSchema(
          "Factorial Calculator",
          "Calculate the factorial of any number instantly with detailed results.",
          "/factorial-calculator",
          "factorial calculator, math tools, number factorial, n!"
        )}
        breadcrumbs={[
          { name: 'Math Tools', url: '/category/math-tools' },
          { name: 'Factorial Calculator', url: '/factorial-calculator' }
        ]}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Math Tools', url: '/category/math-tools' },
            { name: 'Factorial Calculator', url: '/factorial-calculator' }
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Factorial Calculator</h1>
          <p className="text-slate-300">
            Find the factorial of any non-negative integer (n!) instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Enter Number</h2>

            <input
              type="number"
              min={0}
              value={number}
              onChange={(e) => setNumber(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
            />

            <p className="text-sm text-gray-600">
              You entered: <strong>{number}</strong>
            </p>
          </div>

          {/* Result Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Results</h2>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Factorial Result</span>
                </div>
                <div className="text-lg font-semibold text-gray-900 break-all">{factorial}</div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">Steps</span>
                </div>
                <div className="text-sm font-mono text-gray-800 break-words">{steps}</div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-gray-900">Number of Digits</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{digits}</div>
              </div>
            </div>
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators
          currentPath="/factorial-calculator"
          category="math-tools"
        />
      </div>
    </>
  );
};

export default FactorialCalculator;
