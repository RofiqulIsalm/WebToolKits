import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Activity, Link as LinkIcon, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

type Unit = 'metric' | 'imperial';

const clamp = (v: number, min: number, max: number) =>
  Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : min;

const parseNumber = (v: string | null, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const BMICalculator: React.FC = () => {
  // Read initial state from URL (if present)
  const getInitial = useCallback(() => {
    const sp = new URLSearchParams(window.location.search);
    const unit = (sp.get('unit') as Unit) || 'metric';
    const height = parseNumber(sp.get('h'), unit === 'metric' ? 170 : 67);
    const weight = parseNumber(sp.get('w'), unit === 'metric' ? 70 : 154);
    return { unit: unit === 'imperial' ? 'imperial' : 'metric', height, weight };
  }, []);

  const [{ unit, height, weight }, setState] = useState(getInitial);

  // Ranges per unit
  const ranges = unit === 'metric'
    ? { h: { min: 80, max: 250, step: 1, label: 'cm' }, w: { min: 20, max: 250, step: 0.1, label: 'kg' } }
    : { h: { min: 31.5, max: 98.4, step: 0.1, label: 'inches' }, w: { min: 44, max: 551, step: 0.1, label: 'lbs' } };

  // Keep URL in sync
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    sp.set('unit', unit);
    sp.set('h', String(height));
    sp.set('w', String(weight));
    window.history.replaceState(null, '', `${window.location.pathname}?${sp.toString()}`);
  }, [unit, height, weight]);

  // Handlers
  const setUnit = (u: Unit) => setState(s => (s.unit === u ? s : { ...s, unit: u }));
  const setHeight = (v: number) => setState(s => ({ ...s, height: clamp(v, ranges.h.min, ranges.h.max) }));
  const setWeight = (v: number) => setState(s => ({ ...s, weight: clamp(v, ranges.w.min, ranges.w.max) }));
  const resetAll = () => setState(getInitial()); // reset back to URL/defaults

  // Derived BMI
  const valid = height > 0 && weight > 0;
  const bmi = useMemo(() => {
    if (!valid) return NaN;
    const hMeters = unit === 'imperial' ? height * 0.0254 : height / 100;
    const wKg = unit === 'imperial' ? weight * 0.453592 : weight;
    return wKg / (hMeters * hMeters);
  }, [height, weight, unit, valid]);

  const { category, badgeClass } = useMemo(() => {
    const v = bmi;
    if (!Number.isFinite(v)) return { category: '—', badgeClass: 'bg-slate-700 text-slate-200' };
    if (v < 18.5) return { category: 'Underweight',  badgeClass: 'text-blue-600 bg-blue-50' };
    if (v < 25)   return { category: 'Normal weight', badgeClass: 'text-green-600 bg-green-50' };
    if (v < 30)   return { category: 'Overweight',    badgeClass: 'text-yellow-600 bg-yellow-50' };
    return { category: 'Obese', badgeClass: 'text-red-600 bg-red-50' };
  }, [bmi]);

  // Copy share link
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied!');
    } catch {
      // no clipboard? fallback
    }
  };

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
          {/* Inputs */}
          <div className="math-card rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Calculate BMI</h2>
              <div className="flex gap-2">
                <button
                  onClick={copyLink}
                  className="px-3 py-2 rounded-lg border bg-slate-700 text-slate-200 hover:border-blue-400"
                  title="Copy shareable link"
                >
                  <span className="sr-only">Copy link</span>
                  <LinkIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={resetAll}
                  className="px-3 py-2 rounded-lg border bg-slate-700 text-slate-200 hover:border-blue-400"
                  title="Reset"
                >
                  <span className="sr-only">Reset</span>
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Unit System</label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setUnit('metric')}
                  aria-pressed={unit === 'metric'}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    unit === 'metric' ? 'glow-button text-white border-blue-600' : 'bg-slate-700 text-slate-300 border-slate-600 hover:border-blue-400'
                  }`}
                >
                  Metric
                </button>
                <button
                  onClick={() => setUnit('imperial')}
                  aria-pressed={unit === 'imperial'}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    unit === 'imperial' ? 'glow-button text-white border-blue-600' : 'bg-slate-700 text-slate-300 border-slate-600 hover:border-blue-400'
                  }`}
                >
                  Imperial
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Height */}
              <div>
                <div className="flex items-end justify-between">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Height ({ranges.h.label})
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="w-36 px-3 py-2 glow-input rounded-lg text-right"
                    min={ranges.h.min}
                    max={ranges.h.max}
                    step={ranges.h.step}
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                  />
                </div>
                <input
                  type="range"
                  min={ranges.h.min}
                  max={ranges.h.max}
                  step={ranges.h.step}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full mt-2"
                  aria-label="Height slider"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Range {ranges.h.min}–{ranges.h.max} {ranges.h.label}
                </p>
              </div>

              {/* Weight */}
              <div>
                <div className="flex items-end justify-between">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Weight ({ranges.w.label})
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="w-36 px-3 py-2 glow-input rounded-lg text-right"
                    min={ranges.w.min}
                    max={ranges.w.max}
                    step={ranges.w.step}
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                  />
                </div>
                <input
                  type="range"
                  min={ranges.w.min}
                  max={ranges.w.max}
                  step={ranges.w.step}
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full mt-2"
                  aria-label="Weight slider"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Range {ranges.w.min}–{ranges.w.max} {ranges.w.label}
                </p>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="math-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Your Result</h2>

            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <Activity className="h-12 w-12 text-blue-400 drop-shadow-lg" />
              </div>
              <div className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                {Number.isFinite(bmi) ? bmi.toFixed(1) : '—'}
              </div>
              <div className={`inline-block px-4 py-2 rounded-lg font-medium ${badgeClass}`}>
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

            <p className="text-xs text-slate-400 mt-4">
              BMI is a screening tool, not a diagnosis. Factors like age, sex, muscle mass, and ethnicity can affect interpretation.
            </p>
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators currentPath="/bmi-calculator" category="math-tools" />
      </div>
    </>
  );
};

export default BMICalculator;
