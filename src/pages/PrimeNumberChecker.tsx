import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { BarChart3 } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const PrimeNumberChecker: React.FC = () => {
  const [number, setNumber] = useState<number>(7);
  const [isPrime, setIsPrime] = useState<boolean | null>(null);
  const [factors, setFactors] = useState<number[]>([]);
  const [divisorCount, setDivisorCount] = useState<number>(0);

  useEffect(() => {
    checkPrime();
  }, [number]);

  const checkPrime = () => {
    if (number < 2) {
      setIsPrime(false);
      setFactors(number === 1 ? [1] : []);
      setDivisorCount(number === 1 ? 1 : 0);
      return;
    }

    const foundFactors: number[] = [];
    let prime = true;
    for (let i = 1; i <= number; i++) {
      if (number % i === 0) {
        foundFactors.push(i);
      }
    }

    if (foundFactors.length > 2) prime = false;
    setIsPrime(prime);
    setFactors(foundFactors);
    setDivisorCount(foundFactors.length);
  };

  return (
    <>
      <SEOHead
        title="Prime Number Checker | CalculatorHub"
        description="Check whether a number is prime or not instantly. See factors, divisor count, and a quick explanation."
        canonical="https://calculatorhub.site/prime-number-checker"
        schemaData={generateCalculatorSchema(
          "Prime Number Checker",
          "Instantly check whether a number is prime or not, view its factors and divisor count.",
          "/prime-number-checker",
          "prime number, math tool, prime checker, number factors"
        )}
        breadcrumbs={[
          { name: 'Math Tools', url: '/category/math-tools' },
          { name: 'Prime Number Checker', url: '/prime-number-checker' }
        ]}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Math Tools', url: '/category/math-tools' },
            { name: 'Prime Number Checker', url: '/prime-number-checker' }
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Prime Number Checker</h1>
          <p className="text-slate-300">
            Enter a number to check if it is a prime number and view its factors.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Enter Number</h2>

            <input
              type="number"
              min={1}
              value={number}
              onChange={(e) => setNumber(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
            />

            <p className="text-sm text-gray-600">
              Checking number: <strong>{number}</strong>
            </p>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Results</h2>

            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${isPrime ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className={`h-5 w-5 ${isPrime ? 'text-green-600' : 'text-red-600'}`} />
                  <span className="font-medium text-gray-900">Prime Status</span>
                </div>
                <div className={`text-2xl font-bold ${isPrime ? 'text-green-700' : 'text-red-700'}`}>
                  {isPrime === null ? '—' : isPrime ? 'Prime Number ✅' : 'Not Prime ❌'}
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Factors</span>
                </div>
                <div className="text-sm font-mono text-gray-800 break-words">
                  {factors.length > 0 ? factors.join(', ') : 'No factors'}
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-gray-900">Number of Factors</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{divisorCount}</div>
              </div>
            </div>
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators
          currentPath="/prime-number-checker"
          category="math-tools"
        />
      </div>
    </>
  );
};

export default PrimeNumberChecker;
