import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { BarChart3 } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const QuadraticEquationSolver: React.FC = () => {
  const [a, setA] = useState<number>(1);
  const [b, setB] = useState<number>(-3);
  const [c, setC] = useState<number>(2);
  const [discriminant, setDiscriminant] = useState<number>(0);
  const [roots, setRoots] = useState<string[]>([]);
  const [nature, setNature] = useState<string>('');

  useEffect(() => {
    calculate();
  }, [a, b, c]);

  const calculate = () => {
    if (a === 0) {
      setDiscriminant(NaN);
      setRoots(["Not a quadratic equation"]);
      setNature("Invalid (a cannot be zero)");
      return;
    }

    const d = b * b - 4 * a * c;
    setDiscriminant(d);

    if (d > 0) {
      const r1 = (-b + Math.sqrt(d)) / (2 * a);
      const r2 = (-b - Math.sqrt(d)) / (2 * a);
      setRoots([r1.toFixed(4), r2.toFixed(4)]);
      setNature("Real and Distinct Roots");
    } else if (d === 0) {
      const r = (-b / (2 * a)).toFixed(4);
      setRoots([r]);
      setNature("Real and Equal Roots");
    } else {
      const realPart = (-b / (2 * a)).toFixed(4);
      const imagPart = (Math.sqrt(-d) / (2 * a)).toFixed(4);
      setRoots([`${realPart} + ${imagPart}i`, `${realPart} - ${imagPart}i`]);
      setNature("Complex Roots");
    }
  };

  return (
    <>
      <SEOHead
        title="Quadratic Equation Solver | CalculatorHub"
        description="Solve quadratic equations instantly using this quadratic equation solver. Find roots, discriminant, and the nature of roots easily."
        canonical="https://calculatorhub.site/quadratic-equation-solver"
        schemaData={generateCalculatorSchema(
          "Quadratic Equation Solver",
          "Solve quadratic equations instantly using this quadratic equation solver.",
          "/quadratic-equation-solver",
          "quadratic equation, root finder, math solver"
        )}
        breadcrumbs={[
          { name: 'Math Tools', url: '/category/math-tools' },
          { name: 'Quadratic Equation Solver', url: '/quadratic-equation-solver' }
        ]}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Math Tools', url: '/category/math-tools' },
            { name: 'Quadratic Equation Solver', url: '/quadratic-equation-solver' }
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Quadratic Equation Solver</h1>
          <p className="text-slate-300">
            Solve equations of the form <strong>ax² + bx + c = 0</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Enter Coefficients</h2>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">a</label>
                <input
                  type="number"
                  value={a}
                  onChange={(e) => setA(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">b</label>
                <input
                  type="number"
                  value={b}
                  onChange={(e) => setB(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">c</label>
                <input
                  type="number"
                  value={c}
                  onChange={(e) => setC(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Equation: <strong>{a}x² + {b}x + {c} = 0</strong>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Results</h2>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Discriminant (b² - 4ac)</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {isNaN(discriminant) ? '—' : discriminant.toFixed(4)}
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">Roots</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {roots.join(', ')}
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-gray-900">Nature of Roots</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">{nature}</div>
              </div>
            </div>
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators
          currentPath="/quadratic-equation-solver"
          category="math-tools"
        />
      </div>
    </>
  );
};

export default QuadraticEquationSolver;
