import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { BarChart3 } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const LogCalculator: React.FC = () => {
  const [number, setNumber] = useState<number>(100);
  const [base, setBase] = useState<number>(10);
  const [result, setResult] = useState<number | null>(null);
  const [ln, setLn] = useState<number | null>(null);
  const [log10, setLog10] = useState<number | null>(null);

  useEffect(() => {
    calculate();
  }, [number, base]);

  const calculate = () => {
    if (number <= 0 || base <= 0 || base === 1) {
      setResult(null);
      setLn(null);
      setLog10(null);
      return;
    }

    const logResult = Math.log(number) / Math.log(base);
    setResult(logResult);
    setLn(Math.log(number));
    setLog10(Math.log10(number));
  };

  return (
    <>
      <SEOHead
        title="Log Calculator | CalculatorHub"
        description="Calculate the logarithm of any number with any base. Supports log base 10, natural log (ln), and custom base logs."
        canonical="https://calculatorhub.site/log-calculator"
        schemaData={generateCalculatorSchema(
          "Log Calculator",
          "Calculate the logarithm of any number with any base. Supports base 10, ln, and custom bases.",
          "/log-calculator",
          "log calculator, logarithm, math tool, log base 10, natural log"
        )}
        breadcrumbs={[
          { name: 'Math Tools', url: '/category/math-tools' },
          { name: 'Log Calculator', url: '/log-calculator' }
        ]}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Math Tools', url: '/category/math-tools' },
            { name: 'Log Calculator', url: '/log-calculator' }
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Log Calculator</h1>
          <p className="text-slate-300">
            Calculate the logarithm of any number with a custom base, as well as natural log (ln) and log base 10.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Enter Values</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number</label>
                <input
                  type="number"
                  value={number}
                  onChange={(e) => setNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base</label>
                <input
                  type="number"
                  value={base}
                  onChange={(e) => setBase(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <p className="text-sm text-gray-600 mt-3">
              Formula: <strong>log<sub>base</sub>(number)</strong> = log(number) / log(base)
            </p>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Results</h2>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900">
                    log<sub>{base}</sub>({number})
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {result !== null ? result.toFixed(6) : 'Invalid input'}
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">Natural Log (ln)</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {ln !== null ? ln.toFixed(6) : '—'}
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-gray-900">Log Base 10</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {log10 !== null ? log10.toFixed(6) : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators currentPath="/log-calculator" category="math-tools" />
      </div>
    </>
  );
};

export default LogCalculator;
