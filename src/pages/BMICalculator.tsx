import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Activity, Link as LinkIcon, RotateCcw } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

type Unit = 'metric' | 'imperial';

// ---- helpers ----
const parseNumber = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const cmToIn = (cm: number) => cm / 2.54;
const inToCm = (inch: number) => inch * 2.54;
const kgToLb = (kg: number) => kg * 2.20462;
const lbToKg = (lb: number) => lb / 2.20462;

const DEFAULTS = {
  metric: { height: 170, weight: 70 },      // cm, kg
  imperial: { height: 67.0, weight: 154.0 } // in, lb
} as const;

const rangesByUnit = (unit: Unit) =>
  unit === 'metric'
    ? { h: { min: 80, max: 220, step: 1, dp: 0, label: 'cm' }, w: { min: 20, max: 200, step: 0.1, dp: 1, label: 'kg' } }
    : { h: { min: 31.5, max: 86.6, step: 0.1, dp: 1, label: 'in' }, w: { min: 44, max: 440, step: 0.1, dp: 1, label: 'lb' } };

const getCategoryInfo = (bmi: number) => {
  if (!Number.isFinite(bmi)) return { label: '—', badge: 'bg-slate-700 text-slate-200', ring: '#64748b' };
  if (bmi < 18.5) return { label: 'Underweight',  badge: 'text-blue-700 bg-blue-100/80',   ring: '#3b82f6' };
  if (bmi < 25)   return { label: 'Normal weight', badge: 'text-emerald-700 bg-emerald-100/80', ring: '#10b981' };
  if (bmi < 30)   return { label: 'Overweight',    badge: 'text-amber-800 bg-amber-100/80',   ring: '#f59e0b' };
  return { label: 'Obese', badge: 'text-rose-800 bg-rose-100/80', ring: '#ef4444' };
};

const BMICalculator: React.FC = () => {
  // read from URL if present
  const getInitial = useCallback(() => {
    const sp = new URLSearchParams(window.location.search);
    const urlUnit = (sp.get('unit') as Unit) || 'metric';
    const unit: Unit = urlUnit === 'imperial' ? 'imperial' : 'metric';
    const d = DEFAULTS[unit];
    const h = Number(sp.get('h'));
    const w = Number(sp.get('w'));
    const height = Number.isFinite(h) ? h : d.height;
    const weight = Number.isFinite(w) ? w : d.weight;
    return { unit, height, weight };
  }, []);

  // canonical numeric state (used for normalization + URL)
  const [{ unit, height, weight }, setState] = useState(getInitial);
  // raw input strings (let user type freely)
  const [heightInput, setHeightInput] = useState<string>(String(getInitial().height));
  const [weightInput, setWeightInput] = useState<string>(String(getInitial().weight));

  const ranges = useMemo(() => rangesByUnit(unit), [unit]);

  // keep URL synced with numeric state
  useEffect(() => {
    const sp = new URLSearchParams();
    sp.set('unit', unit);
    sp.set('h', String(height));
    sp.set('w', String(weight));
    window.history.replaceState(null, '', `${window.location.pathname}?${sp.toString()}`);
  }, [unit, height, weight]);

  // ---------- input handlers (no clamp while typing) ----------
  const onHeightChange = (v: string) => setHeightInput(v);
  const onWeightChange = (v: string) => setWeightInput(v);

  // normalize on blur (apply min/max + formatting)
  const normalizeHeight = () => {
    const n = parseNumber(heightInput);
    if (!Number.isFinite(n)) {
      // revert to last numeric state if blank/invalid
      setHeightInput(String(height));
      return;
    }
    const c = clamp(n, ranges.h.min, ranges.h.max);
    setState(s => ({ ...s, height: c }));
    setHeightInput(c.toFixed(ranges.h.dp));
  };

  const normalizeWeight = () => {
    const n = parseNumber(weightInput);
    if (!Number.isFinite(n)) {
      setWeightInput(String(weight));
      return;
    }
    const c = clamp(n, ranges.w.min, ranges.w.max);
    setState(s => ({ ...s, weight: c }));
    setWeightInput(c.toFixed(ranges.w.dp));
  };

  // convert values when switching unit (and update raw inputs accordingly)
  const switchUnit = (next: Unit) => {
    if (next === unit) return;
    setState(s => {
      let h = s.height;
      let w = s.weight;
      if (next === 'imperial') {
        h = +(cmToIn(h)).toFixed(1); // cm -> in
        w = +(kgToLb(w)).toFixed(1); // kg -> lb
      } else {
        h = Math.round(inToCm(h));   // in -> cm
        w = +(lbToKg(w)).toFixed(1); // lb -> kg
      }
      const r = rangesByUnit(next);
      h = clamp(h, r.h.min, r.h.max);
      w = clamp(w, r.w.min, r.w.max);
      // also set the visible strings
      setHeightInput(h.toFixed(r.h.dp));
      setWeightInput(w.toFixed(r.w.dp));
      return { unit: next, height: h, weight: w };
    });
  };

  // reset to defaults for the CURRENT unit
  const resetAll = () => {
    const d = DEFAULTS[unit];
    setState({ unit, height: d.height, weight: d.weight });
    setHeightInput(d.height.toString());
    setWeightInput(d.weight.toString());
  };

  // ---- derived BMI (use live typed values when valid; else fallback) ----
  const typedH = parseNumber(heightInput);
  const typedW = parseNumber(weightInput);
  const hForCalc = Number.isFinite(typedH) ? typedH : height;
  const wForCalc = Number.isFinite(typedW) ? typedW : weight;

  const bmi = useMemo(() => {
    if (!(hForCalc > 0 && wForCalc > 0)) return NaN;
    const hMeters = unit === 'imperial' ? hForCalc * 0.0254 : hForCalc / 100;
    const wKg = unit === 'imperial' ? wForCalc * 0.453592 : wForCalc;
    return wKg / (hMeters * hMeters);
  }, [hForCalc, wForCalc, unit]);

  const { label: category, badge, ring } = useMemo(() => getCategoryInfo(bmi), [bmi]);
  const ringPct = Number.isFinite(bmi) ? Math.min(100, Math.max(0, (bmi / 40) * 100)) : 0;

  const copyLink = async () => { try { await navigator.clipboard.writeText(window.location.href); } catch {} };

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

      {/* Background aura */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-[900px] bg-gradient-to-r from-indigo-500/30 via-cyan-400/20 to-indigo-500/30 blur-3xl rounded-full" />
        </div>

        <div className="max-w-4xl mx-auto">
          <Breadcrumbs items={[
            { name: 'Math Tools', url: '/category/math-tools' },
            { name: 'BMI Calculator', url: '/bmi-calculator' }
          ]} />

          {/* Header */}
          <div className="mb-8 rounded-2xl p-6 bg-gradient-to-r from-indigo-600 to-cyan-500 shadow-lg">
            <h1 className="text-3xl font-extrabold text-white drop-shadow-sm">BMI Calculator</h1>
            <p className="text-white/90 mt-1">Calculate your Body Mass Index and see where you land on the healthy range.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Inputs Card */}
            <div className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-white">Your details</h2>
                <div className="flex gap-2">
                  <button
                    onClick={copyLink}
                    className="px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    title="Copy shareable link"
                  >
                    <span className="sr-only">Copy link</span>
                    <LinkIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={resetAll}
                    className="px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    title="Reset to defaults"
                  >
                    <span className="sr-only">Reset</span>
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Segmented control */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Unit system</label>
                <div className="inline-flex rounded-xl p-1 bg-white/5 border border-white/10">
                  <button
                    onClick={() => switchUnit('metric')}
                    aria-pressed={unit === 'metric'}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${unit === 'metric'
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow'
                        : 'text-slate-200 hover:bg-white/5'}`}
                  >
                    Metric
                  </button>
                  <button
                    onClick={() => switchUnit('imperial')}
                    aria-pressed={unit === 'imperial'}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${unit === 'imperial'
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow'
                        : 'text-slate-200 hover:bg-white/5'}`}
                  >
                    Imperial
                  </button>
                </div>
              </div>

              {/* Height */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Height ({ranges.h.label})
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={heightInput}
                  onChange={(e) => onHeightChange(e.target.value)}
                  onBlur={normalizeHeight}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  placeholder={unit === 'metric' ? 'e.g., 160' : 'e.g., 63.0'}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Range {ranges.h.min}–{ranges.h.max} {ranges.h.label}
                </p>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Weight ({ranges.w.label})
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={weightInput}
                  onChange={(e) => onWeightChange(e.target.value)}
                  onBlur={normalizeWeight}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  placeholder={unit === 'metric' ? 'e.g., 55.0' : 'e.g., 121.3'}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Range {ranges.w.min}–{ranges.w.max} {ranges.w.label}
                </p>
              </div>
            </div>

            {/* Results Card */}
            <div className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-xl shadow-xl">
              <h2 className="text-xl font-semibold text-white mb-5">Your result</h2>

              <div className="flex items-center gap-6 mb-6">
                <div
                  className="relative h-28 w-28 rounded-full grid place-items-center"
                  style={{
                    background: `conic-gradient(${getCategoryInfo(bmi).ring} ${Number.isFinite(bmi) ? Math.min(100, Math.max(0, (bmi / 40) * 100)) : 0}%, rgba(148,163,184,0.25) 0)`,
                  }}
                  aria-label="BMI progress ring"
                >
                  <div className="absolute inset-2 rounded-full bg-slate-900/80 border border-white/10 grid place-items-center">
                    <span className="text-2xl font-bold text-white">
                      {Number.isFinite(bmi) ? bmi.toFixed(1) : '—'}
                    </span>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="inline-flex items-center gap-2">
                    <Activity className="h-5 w-5 text-cyan-300 drop-shadow" />
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getCategoryInfo(bmi).badge}`}>
                      {getCategoryInfo(bmi).label}
                    </span>
                  </div>
                  <p className="text-slate-300 mt-2 text-sm">
                    BMI is a screening tool. Age, sex, muscle, and ethnicity can affect interpretation.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Underweight</span>
                  <span className="text-blue-300">Below 18.5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Normal</span>
                  <span className="text-emerald-300">18.5–24.9</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Overweight</span>
                  <span className="text-amber-300">25–29.9</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Obese</span>
                  <span className="text-rose-300">30+</span>
                </div>
              </div>
            </div>
          </div>

          <AdBanner type="bottom" />
          <RelatedCalculators currentPath="/bmi-calculator" category="math-tools" />
        </div>
      </div>
    </>
  );
};

export default BMICalculator;
