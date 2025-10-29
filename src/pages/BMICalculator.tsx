import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Activity, Link as LinkIcon, RotateCcw, Check } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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
  const reduceMotion = useReducedMotion();

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

  // numeric state + raw inputs
  const [{ unit, height, weight }, setState] = useState(getInitial);
  const [heightInput, setHeightInput] = useState<string>(String(getInitial().height));
  const [weightInput, setWeightInput] = useState<string>(String(getInitial().weight));

  const ranges = useMemo(() => rangesByUnit(unit), [unit]);

  // keep URL synced
  useEffect(() => {
    const sp = new URLSearchParams();
    sp.set('unit', unit);
    sp.set('h', String(height));
    sp.set('w', String(weight));
    window.history.replaceState(null, '', `${window.location.pathname}?${sp.toString()}`);
  }, [unit, height, weight]);

  // input handlers (no clamp while typing)
  const onHeightChange = (v: string) => setHeightInput(v);
  const onWeightChange = (v: string) => setWeightInput(v);

  // normalize on blur
  const normalizeHeight = () => {
    const n = parseNumber(heightInput);
    if (!Number.isFinite(n)) { setHeightInput(String(height)); return; }
    const c = clamp(n, ranges.h.min, ranges.h.max);
    setState(s => ({ ...s, height: c })); setHeightInput(c.toFixed(ranges.h.dp));
  };
  const normalizeWeight = () => {
    const n = parseNumber(weightInput);
    if (!Number.isFinite(n)) { setWeightInput(String(weight)); return; }
    const c = clamp(n, ranges.w.min, ranges.w.max);
    setState(s => ({ ...s, weight: c })); setWeightInput(c.toFixed(ranges.w.dp));
  };

  // unit switch with conversion + sync inputs
  const switchUnit = (next: Unit) => {
    if (next === unit) return;
    setState(s => {
      let h = s.height, w = s.weight;
      if (next === 'imperial') { h = +(cmToIn(h)).toFixed(1); w = +(kgToLb(w)).toFixed(1); }
      else { h = Math.round(inToCm(h)); w = +(lbToKg(w)).toFixed(1); }
      const r = rangesByUnit(next);
      h = clamp(h, r.h.min, r.h.max); w = clamp(w, r.w.min, r.w.max);
      setHeightInput(h.toFixed(r.h.dp)); setWeightInput(w.toFixed(r.w.dp));
      return { unit: next, height: h, weight: w };
    });
  };

  // reset (current unit)
  const [copied, setCopied] = useState(false);
  const [showCopyPulse, setShowCopyPulse] = useState(false);
  const [showResetPulse, setShowResetPulse] = useState(false);
  const resetAll = () => {
    const d = DEFAULTS[unit];
    setState({ unit, height: d.height, weight: d.weight });
    setHeightInput(d.height.toString());
    setWeightInput(d.weight.toString());
    setShowResetPulse(true); setTimeout(() => setShowResetPulse(false), 300);
  };

  // BMI
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

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true); setShowCopyPulse(true);
      setTimeout(() => setShowCopyPulse(false), 300);
      setTimeout(() => setCopied(false), 1000);
    } catch {}
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
      {/* content container */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Breadcrumbs
            items={[
              { name: 'Math Tools', url: '/category/math-tools' },
              { name: 'BMI Calculator', url: '/bmi-calculator' }
            ]}
          />

      {/* Page wrapper: kill horizontal scroll on tiny screens */}
      <div className="relative overflow-x-hidden pt-[env(safe-area-inset-top)]">
        {/* Responsive background glow (centered, no fixed large width) */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="
              absolute left-1/2 -translate-x-1/2
              w-[110%] sm:w-[90%] md:w-[70%] max-w-[1200px]
              h-48 sm:h-60 md:h-72
              
              blur-3xl rounded-full
            "
            aria-hidden="true"
          />
        </div>

        

          {/* Header */}
          <div className="mb-6 sm:mb-8 rounded-2xl p-4 sm:p-6 bg-gradient-to-r from-indigo-600 to-cyan-500 shadow-lg">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-sm">BMI Calculator</h1>
            <p className="text-white/90 mt-1 text-sm sm:text-base">
              Calculate your Body Mass Index and see where you land on the healthy range.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            {/* Inputs Card */}
            <div className="rounded-2xl p-4 sm:p-6 bg-white/5 border border-white/10 backdrop-blur-xl shadow-xl min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <h2 className="text-lg sm:text-xl font-semibold text-white">Your details</h2>

                {/* action buttons stack on mobile */}
                <div className="flex w-full sm:w-auto gap-2">
                  <motion.button
                    whileTap={reduceMotion ? {} : { scale: 0.94 }}
                    onClick={copyLink}
                    className="relative flex-1 sm:flex-none min-h-[44px] px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    title="Copy shareable link"
                  >
                    <span className="sr-only">Copy link</span>
                    <AnimatePresence initial={false} mode="wait">
                      {copied ? (
                        <motion.span
                          key="copied"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.18 }}
                          className="inline-flex items-center gap-1 text-emerald-300 text-xs"
                        >
                          <Check className="h-4 w-4" /> Copied
                        </motion.span>
                      ) : (
                        <motion.span
                          key="copy"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.18 }}
                          className="inline-flex items-center gap-2"
                        >
                          <LinkIcon className="h-4 w-4" /> <span className="text-sm">Copy</span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {showCopyPulse && <span className="pointer-events-none absolute inset-0 rounded-xl animate-[ping_0.3s_ease-out] bg-white/20" />}
                  </motion.button>

                  <motion.button
                    whileTap={reduceMotion ? {} : { scale: 0.94, rotate: -12 }}
                    onClick={resetAll}
                    className="relative flex-1 sm:flex-none min-h-[44px] px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    title="Reset to defaults"
                  >
                    <span className="sr-only">Reset</span>
                    <div className="inline-flex items-center gap-2 text-sm">
                      <RotateCcw className="h-4 w-4" /> <span>Reset</span>
                    </div>
                    {showResetPulse && <span className="pointer-events-none absolute inset-0 rounded-xl animate-[ping_0.3s_ease-out] bg-white/20" />}
                  </motion.button>
                </div>
              </div>

              {/* Unit control (full-width grid on mobile) */}
              <div className="mb-6">
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Unit system</label>
                <div className="grid grid-cols-2 gap-1 rounded-xl p-1 bg-white/5 border border-white/10 w-full">
                  <motion.button
                    whileTap={reduceMotion ? {} : { scale: 0.96 }}
                    onClick={() => switchUnit('metric')}
                    aria-pressed={unit === 'metric'}
                    className={`min-h-[44px] rounded-lg text-sm font-medium transition-all
                      ${unit === 'metric'
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow'
                        : 'text-slate-200 hover:bg-white/5'}`}
                  >
                    Metric
                  </motion.button>
                  <motion.button
                    whileTap={reduceMotion ? {} : { scale: 0.96 }}
                    onClick={() => switchUnit('imperial')}
                    aria-pressed={unit === 'imperial'}
                    className={`min-h-[44px] rounded-lg text-sm font-medium transition-all
                      ${unit === 'imperial'
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow'
                        : 'text-slate-200 hover:bg-white/5'}`}
                  >
                    Imperial
                  </motion.button>
                </div>
              </div>

              {/* Height */}
              <div className="mb-5">
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">
                  Height ({ranges.h.label})
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={heightInput}
                  onChange={(e) => onHeightChange(e.target.value)}
                  onBlur={normalizeHeight}
                  className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-base sm:text-lg text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  placeholder={unit === 'metric' ? 'e.g., 160' : 'e.g., 63.0'}
                />
                <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                  Range {ranges.h.min}–{ranges.h.max} {ranges.h.label}
                </p>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">
                  Weight ({ranges.w.label})
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={weightInput}
                  onChange={(e) => onWeightChange(e.target.value)}
                  onBlur={normalizeWeight}
                  className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-base sm:text-lg text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  placeholder={unit === 'metric' ? 'e.g., 55.0' : 'e.g., 121.3'}
                />
                <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                  Range {ranges.w.min}–{ranges.w.max} {ranges.w.label}
                </p>
              </div>
            </div>

            {/* Results Card */}
            <div className="p-[1px] rounded-2xl bg-gradient-to-r from-indigo-500/50 via-cyan-400/40 to-indigo-500/50 shadow-xl min-w-0">
              <div className="rounded-2xl p-4 sm:p-6 bg-slate-900/70 border border-white/10 backdrop-blur-xl">
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-5">Your result</h2>

                <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6 mb-5 sm:mb-6">
                  {/* Animated BMI ring */}
                  <motion.div
                    className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full shrink-0 grid place-items-center"
                    style={{ background: `conic-gradient(${ring} ${ringPct}%, rgba(148,163,184,0.25) 0)` }}
                    aria-label="BMI progress ring"
                    animate={reduceMotion ? {} : { rotate: [0, 2, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <div className="absolute inset-2 rounded-full bg-slate-900/90 border border-white/10 grid place-items-center shadow-inner overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={Number.isFinite(bmi) ? bmi.toFixed(1) : '-'}
                          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
                          transition={{ duration: 0.18 }}
                          className="text-xl sm:text-2xl font-bold text-white tabular-nums"
                        >
                          {Number.isFinite(bmi) ? bmi.toFixed(1) : '—'}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                    <span className="absolute inset-0 rounded-full blur-xl" style={{ background: `${ring}22` }} />
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <div className="inline-flex items-center gap-2">
                      <Activity className="h-5 w-5 text-cyan-300 drop-shadow" />
                      <span className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-medium ${badge}`}>
                        {category}
                      </span>
                    </div>
                    <p className="text-slate-300 mt-2 text-xs sm:text-sm leading-relaxed">
                      BMI is a screening tool. Age, sex, muscle, and ethnicity can affect interpretation.
                    </p>

                    {/* Stats */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-slate-200">
                        <div className="opacity-70 text-[11px] sm:text-xs">Height</div>
                        <div className="font-medium break-words">
                          {heightInput} {ranges.h.label}
                        </div>
                      </div>
                      <div className="rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-slate-200">
                        <div className="opacity-70 text-[11px] sm:text-xs">Weight</div>
                        <div className="font-medium break-words">
                          {weightInput} {ranges.w.label}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
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
          </div>

          <AdBanner type="bottom" />
          <RelatedCalculators currentPath="/bmi-calculator" category="math-tools" />
        </div>
      </div>
    </>
  );
};

export default BMICalculator;
