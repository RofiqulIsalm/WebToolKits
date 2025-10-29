import React, { useMemo, useState } from 'react';
import { Link } from "react-router-dom";
import { Activity } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

type Unit = 'metric' | 'imperial';

const clampNumber = (v: number) => (Number.isFinite(v) ? v : 0);

const BMICalculator: React.FC = () => {
  const [unit, setUnit] = useState<Unit>('metric');
  // In metric: height=cm, weight=kg; In imperial: height=inches, weight=lbs
  const [height, setHeight] = useState<number>(170);
  const [weight, setWeight] = useState<number>(70);

  // Convert values when switching units so users keep their numbers
  const handleUnitChange = (next: Unit) => {
    if (next === unit) return;
    if (next === 'imperial') {
      // metric -> imperial
      setHeight(prev => +(clampNumber(prev) / 2.54).toFixed(1)); // cm -> inches
      setWeight(prev => +(clampNumber(prev) * 2.20462).toFixed(1)); // kg -> lbs
    } else {
      // imperial -> metric
      setHeight(prev => +(clampNumber(prev) * 2.54).toFixed(0)); // inches -> cm
      setWeight(prev => +(clampNumber(prev) / 2.20462).toFixed(1)); // lbs -> kg
    }
    setUnit(next);
  };

  const valid = height > 0 && weight > 0;

  const bmi = useMemo(() => {
    if (!valid) return NaN;
    let hMeters: number;
    let wKg: number;

    if (unit === 'imperial') {
      hMeters = height * 0.0254;  // inches -> meters
      wKg = weight * 0.453592;    // lbs -> kg
    } else {
      hMeters = height / 100;     // cm -> meters
      wKg = weight;               // kg
    }
    return wKg / (hMeters * hMeters);
  }, [height, weight, unit, valid]);

  const { category, badgeClass } = useMemo(() => {
    const v = bmi;
    if (!Number.isFinite(v)) {
      return { category: '—', badgeClass: 'bg-slate-700 text-slate-200' };
    }
    if (v < 18.5) return { category: 'Underweight',  badgeClass: 'text-blue-600 bg-blue-50' };
    if (v < 25)   return { category: 'Normal weight', badgeClass: 'text-green-600 bg-green-50' };
    if (v < 30)   return { category: 'Overweight',    badgeClass: 'text-yellow-600 bg-yellow-50' };
    return { category: 'Obese', badgeClass: 'text-red-600 bg-red-50' };
  }, [bmi]);

  return (
    <>
      <SEOHead
        title={seoData.bmiCalculator.title}
        description={seoData.bmiCalculator.description}
        canonical="https://calculatorhub.site/bmi-calculator"
        schemaData={generateCalculatorSchema(
          "BMI Calculator",
          seoData.bmiCalculator.description,
          "/bmi-calculator",
          seoData.bmiCalculator.keywords
        )}
        breadcrumbs={[
          { name: 'Math Tools', url: '/category/math-tools' },
          { name: 'BMI Calculator', url: '/bmi-calculator' }
        ]}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={[
          { name: 'Math Tools', url: '/category/math-tools' },
          { name: 'BMI Calculator', url: '/bmi-calculator' }
        ]} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">BMI Calculator</h1>
          <p className="text-slate-300">Calculate your Body Mass Index and check if you're in a healthy weight range</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="math-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Calculate BMI</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Unit System</label>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleUnitChange('metric')}
                  aria-pressed={unit === 'metric'}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    unit === 'metric'
                      ? 'glow-button text-white border-blue-600'
                      : 'bg-slate-700 text-slate-300 border-slate-600 hover:border-blue-400'
                  }`}
                >
                  Metric
                </button>
                <button
                  onClick={() => handleUnitChange('imperial')}
                  aria-pressed={unit === 'imperial'}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    unit === 'imperial'
                      ? 'glow-button text-white border-blue-600'
                      : 'bg-slate-700 text-slate-300 border-slate-600 hover:border-blue-400'
                  }`}
                >
                  Imperial
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Height ({unit === 'metric' ? 'cm' : 'inches'})
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  step={unit === 'metric' ? 1 : 0.1}
                  value={Number.isFinite(height) ? height : ''}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full px-4 py-2 glow-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={unit === 'metric' ? 'e.g., 170' : 'e.g., 67'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Weight ({unit === 'metric' ? 'kg' : 'lbs'})
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  step={0.1}
                  value={Number.isFinite(weight) ? weight : ''}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full px-4 py-2 glow-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={unit === 'metric' ? 'e.g., 70' : 'e.g., 154'}
                />
              </div>
            </div>
          </div>

          <div className="math-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Your Result</h2>

            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <Activity className="h-12 w-12 text-blue-400 drop-shadow-lg" />
              </div>
              <div className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                {Number.isFinite(bmi) ? bmi.toFixed(1) : '—'}
              </div>
              <div
                className={`inline-block px-4 py-2 rounded-lg font-medium ${badgeClass}`}
              >
                {category}
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-300">Underweight:</span>
                <span className="text-blue-400">Below 18.5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Normal weight:</span>
                <span className="text-green-400">18.5 - 24.9</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Overweight:</span>
                <span className="text-yellow-400">25 - 29.9</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Obese:</span>
                <span className="text-red-400">30 and above</span>
              </div>
            </div>
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators
          currentPath="/bmi-calculator"
          category="math-tools"
        />
      </div>
    </>
  );
};

export default BMICalculator;
