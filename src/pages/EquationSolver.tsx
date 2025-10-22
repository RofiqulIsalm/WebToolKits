import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { BarChart3 } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const EquationSolver: React.FC = () => {
  const [equationType, setEquationType] = useState<'linear' | 'quadratic'>('linear');
  const [a, setA] = useState<number>(1);
  const [b, setB] = useState<number>(-5);
  const [c, setC] = useState<number>(0);
  const [result, setResult] = useState<string[]>([]);
  const [description, setDescription] = useState<string>('');

  useEffect(() => {
    solveEquation();
  }, [equationType, a, b, c]);

  const solveEquation = () => {
    if (equationType === 'linear') {
      if (a === 0) {
        setResult(['No solution (a cannot be 0)']);
        setDescription('Invalid linear equation: coefficient a = 0');
        return;
      }
      const x = -b / a;
      setResult([`x = ${x.toFixed(4)}`]);
      setDescription(`Linear equation: ${a}x + ${b} = 0`);
    } else {
      if (a === 0) {
        setResult(['Not a quadratic equation']);
        setDescription('When a = 0, the equation becomes linear.');
        return;
      }

      const discriminant = b * b - 4 * a * c;
      if (discriminant > 0) {
        const r1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const r2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        setResult([`x₁ = ${r1.toFixed(4)}`, `x₂ = ${r2.toFixed(4)}`]);
        setDescription(`Real and distinct roots (Discriminant = ${discriminant.toFixed(4)})`);
      } else if (discriminant === 0) {
        const r = (-b / (2 * a)).toFixed(4);
        setResult([`x = ${r}`]);
        setDescription(`Real and equal roots (Discriminant = 0)`);
      } else {
        const realPart = (-b / (2 * a)).toFixed(4);
        const imagPart = (Math.sqrt(-discriminant) / (2 * a)).toFixed(4);
        setResult([`${realPart} + ${imagPart}i`, `${realPart} - ${imagPart}i`]);
        setDescription(`Complex roots (Discriminant = ${discriminant.toFixed(4)})`);
      }
    }
  };

  return (
    <>
      <SEOHead
        title="Equation Solver | CalculatorHub"
        description="Solve linear and quadratic equations instantly. Get roots, discriminant, and step-by-step solutions."
        canonical="https://calculatorhub.site/equation-solver"
        schemaData={generateCalculatorSchema(
          "Equation Solver",
          "Solve linear and quadratic equations instantly. Get roots, discriminant, and step-by-step solutions.",
          "/equation-solver",
          "equation solver, linear equation, quadratic equation, math tools"
        )}
        breadcrumbs={[
          { name: 'Math Tools', url: '/category/math-tools' },
          { name: 'Equation Solver', url: '/equation-solver' }
        ]}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Math Tools', url: '/category/math-tools' },
            { name: 'Equation Solver', url: '/equation-solver' }
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Equation Solver</h1>
          <p className="text-slate-300">
            Solve linear and quadratic equations with step-by-step results.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Enter Coefficients</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Equation Type</label>
              <select
                value={equationType}
                onChange={(e) => setEquationType(e.target.value as 'linear' | 'quadratic')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="linear">Linear (ax + b = 0)</option>
                <option value="quadratic">Quadratic (ax² + bx + c = 0)</option>
              </select>
            </div>

            <div className="space-y-3">
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
              {equationType === 'quadratic' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">c</label>
                  <input
                    type="number"
                    value={c}
                    onChange={(e) => setC(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 mt-4">
              Equation: <strong>{equationType === 'linear' ? `${a}x + ${b} = 0` : `${a}x² + ${b}x + ${c} = 0`}</strong>
            </p>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Results</h2>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Solution</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {result.length > 0 ? result.join(', ') : '—'}
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">Explanation</span>
                </div>
                <div className="text-sm text-gray-800">{description}</div>
              </div>
            </div>
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators
          currentPath="/equation-solver"
          category="math-tools"
        />
      </div>
    </>
  );
};

export default EquationSolver;
