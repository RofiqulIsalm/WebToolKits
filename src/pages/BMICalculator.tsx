import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Activity, Link as LinkIcon, RotateCcw, Check, Clipboard, Download } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import html2canvas from 'html2canvas';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

type Unit = 'metric' | 'imperial';
type BMIScheme = 'who' | 'asian';

// ---------- helpers ----------
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

// BMI schemes
const schemeThresholds = (scheme: BMIScheme) =>
  scheme === 'asian'
    ? { under: 18.5, normalHi: 22.9, overHi: 24.9, obese: 25 }
    : { under: 18.5, normalHi: 24.9, overHi: 29.9, obese: 30 };

const getCategoryInfo = (bmi: number, scheme: BMIScheme) => {
  const t = schemeThresholds(scheme);
  if (!Number.isFinite(bmi)) return { label: '—', badge: 'bg-slate-700 text-slate-200', ring: '#64748b' };
  if (bmi < t.under) return { label: 'Underweight',  badge: 'text-blue-700 bg-blue-100/80',   ring: '#3b82f6' };
  if (bmi <= t.normalHi) return { label: 'Normal weight', badge: 'text-emerald-700 bg-emerald-100/80', ring: '#10b981' };
  if (bmi <= t.overHi)   return { label: 'Overweight',    badge: 'text-amber-800 bg-amber-100/80',   ring: '#f59e0b' };
  return { label: 'Obese', badge: 'text-rose-800 bg-rose-100/80', ring: '#ef4444' };
};

// ------------------------------------------------------------

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
    const scheme = ((sp.get('scheme') as BMIScheme) || 'who') as BMIScheme;
    return { unit, height, weight, scheme };
  }, []);

  // numeric state + raw inputs
  const [{ unit, height, weight, scheme }, setState] = useState(getInitial);
  const [heightInput, setHeightInput] = useState<string>(String(getInitial().height));
  const [weightInput, setWeightInput] = useState<string>(String(getInitial().weight));

  const ranges = useMemo(() => rangesByUnit(unit), [unit]);

  // keep URL synced
  useEffect(() => {
    const sp = new URLSearchParams();
    sp.set('unit', unit);
    sp.set('h', String(height));
    sp.set('w', String(weight));
    sp.set('scheme', scheme);
    window.history.replaceState(null, '', `${window.location.pathname}?${sp.toString()}`);
  }, [unit, height, weight, scheme]);

  // inputs
  const onHeightChange = (v: string) => setHeightInput(v);
  const onWeightChange = (v: string) => setWeightInput(v);
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

  // unit/scheme switches
  const switchUnit = (next: Unit) => {
    if (next === unit) return;
    setState(s => {
      let h = s.height, w = s.weight;
      if (next === 'imperial') { h = +(cmToIn(h)).toFixed(1); w = +(kgToLb(w)).toFixed(1); }
      else { h = Math.round(inToCm(h)); w = +(lbToKg(w)).toFixed(1); }
      const r = rangesByUnit(next);
      h = clamp(h, r.h.min, r.h.max); w = clamp(w, r.w.min, r.w.max);
      setHeightInput(h.toFixed(r.h.dp)); setWeightInput(w.toFixed(r.w.dp));
      return { unit: next, height: h, weight: w, scheme: s.scheme };
    });
  };
  const switchScheme = (next: BMIScheme) => setState(s => ({ ...s, scheme: next }));

  // copy / reset UI feedback
  const [copied, setCopied] = useState(false);
  const [showCopyPulse, setShowCopyPulse] = useState(false);
  const [showResetPulse, setShowResetPulse] = useState(false);
  const resetAll = () => {
    const d = DEFAULTS[unit];
    setState({ unit, height: d.height, weight: d.weight, scheme });
    setHeightInput(d.height.toString());
    setWeightInput(d.weight.toString());
    setShowResetPulse(true); setTimeout(() => setShowResetPulse(false), 300);
  };

  // BMI (use live typed values when valid)
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

  // scheme-aware labels/colors
  const { label: category, badge, ring } = useMemo(() => getCategoryInfo(bmi, scheme), [bmi, scheme]);
  const ringPct = Number.isFinite(bmi) ? Math.min(100, Math.max(0, (bmi / 40) * 100)) : 0;

  // Healthy range + target
  const t = schemeThresholds(scheme);
  const normalLo = 18.5;
  const normalHi = t.normalHi;
  const midBMI = (normalLo + normalHi) / 2;

  const hMetersForCalc = unit === 'imperial' ? hForCalc * 0.0254 : hForCalc / 100;
  const minKg = Number.isFinite(hMetersForCalc) ? normalLo * hMetersForCalc * hMetersForCalc : NaN;
  const maxKg = Number.isFinite(hMetersForCalc) ? normalHi * hMetersForCalc * hMetersForCalc : NaN;
  const targetKg = Number.isFinite(hMetersForCalc) ? midBMI * hMetersForCalc * hMetersForCalc : NaN;

  const weightNowKg = unit === 'imperial'
    ? (Number.isFinite(wForCalc) ? wForCalc * 0.453592 : NaN)
    : (Number.isFinite(wForCalc) ? wForCalc : NaN);

  const deltaKg = Number.isFinite(targetKg) && Number.isFinite(weightNowKg) ? targetKg - weightNowKg : NaN;

  const fmtWeight = (kg: number) => {
    if (!Number.isFinite(kg)) return '—';
    if (unit === 'imperial') return `${(kgToLb(kg)).toFixed(1)} lb`;
    return `${kg.toFixed(1)} kg`;
  };

  // copy link / summary
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true); setShowCopyPulse(true);
      setTimeout(() => setShowCopyPulse(false), 300);
      setTimeout(() => setCopied(false), 1000);
    } catch {}
  };
  const copySummary = async () => {
    const parts = [
      `BMI: ${Number.isFinite(bmi) ? bmi.toFixed(1) : '—'}`,
      `Category (${scheme === 'who' ? 'WHO' : 'Asian'}): ${category}`,
      `Height: ${heightInput} ${ranges.h.label}`,
      `Weight: ${weightInput} ${ranges.w.label}`,
      `Healthy range: ${fmtWeight(minKg)} – ${fmtWeight(maxKg)}`,
      Number.isFinite(deltaKg) ? (deltaKg > 0 ? `Gain ~${fmtWeight(deltaKg)} to reach target` : deltaKg < 0 ? `Lose ~${fmtWeight(Math.abs(deltaKg))} to reach target` : `You're at target`) : ''
    ].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(parts);
      setCopied(true); setShowCopyPulse(true);
      setTimeout(() => setShowCopyPulse(false), 300);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  // ---------- Share Image (fixed-size export) ----------
  // --- Fixed-size export: ALWAYS 762 × 265 ---
  const EXPORT_W = 762;
  const EXPORT_H = 265;
  
  const exportRef = useRef<HTMLDivElement>(null);
  
  // BMI scale domain (for the pointer)
  const scaleMin = 12, scaleMax = 40;
  const ts = schemeThresholds(scheme);
  const seg = {
    under: { from: scaleMin, to: ts.under },
    normal: { from: ts.under, to: ts.normalHi },
    over:   { from: ts.normalHi < 25 ? 25 : 25, to: scheme === 'asian' ? ts.overHi : 29.9 },
    obese:  { from: scheme === 'asian' ? ts.obese : 30, to: scaleMax }
  };
  const pct = (x: number) => Math.max(0, Math.min(100, ((x - scaleMin) / (scaleMax - scaleMin)) * 100));
  const wUnder = pct(seg.under.to) - pct(seg.under.from);
  const wNormal = pct(seg.normal.to) - pct(seg.normal.from);
  const wOver   = pct(seg.over.to)   - pct(seg.over.from);
  const wObese  = pct(seg.obese.to)  - pct(seg.obese.from);
  const bmiPointerPct = Number.isFinite(bmi) ? pct(bmi) : 0;
  
  const downloadImage = async () => {
    if (!exportRef.current) return;
    const canvas = await html2canvas(exportRef.current, {
      backgroundColor: '#0b1220',
      width: EXPORT_W,
      height: EXPORT_H,
      scale: 2,           // crisp on retina
      useCORS: true,
      windowWidth: EXPORT_W,
      windowHeight: EXPORT_H,
    });
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'bmi-summary.png';
    a.click();
  };



  // ------ Roadmap content (simple, non-medical guidance) ------
  const roadmap = useMemo(() => {
    const base = {
      weekly: [
        'Strength training: 2–3×/week (45–60 min)',
        'Cardio: 150–300 min/week total',
        'Steps: 7,000–10,000/day',
        'Sleep: 7–9 hours/night',
        'Hydration: ~30–35 ml/kg/day'
      ],
      habits: [
        'Minimize sugary drinks & ultra-processed snacks',
        'Protein each meal; load plate with veggies',
        'Plan meals; track portions 1–2 weeks',
        'Limit alcohol; manage stress'
      ],
      note: 'General guidance, not medical advice. Consider a clinician/dietitian for personalized care.'
    };

    if (!Number.isFinite(bmi)) return { title: 'Healthy basics', bullets: base };
    if (bmi < schemeThresholds(scheme).under) {
      return {
        title: 'Roadmap for Underweight',
        bullets: {
          weekly: base.weekly,
          habits: [
            'Add 300–500 kcal/day via whole foods (nuts, dairy, olive oil, whole grains)',
            'Prioritize progressive strength training to build lean mass',
            'Protein ~1.6–2.2 g/kg/day; 3–5 meals with 20–40 g protein each',
            'Include carb sources around workouts (rice, potatoes, fruit)',
            ...base.habits
          ],
          note: base.note
        }
      };
    }
    if (bmi <= schemeThresholds(scheme).normalHi) {
      return {
        title: 'You’re in the normal range',
        bullets: {
          weekly: base.weekly,
          habits: [
            'Balanced plate (½ veg/fruit, ¼ protein, ¼ carbs)',
            'Protein ~1.2–1.6 g/kg/day; fiber 25–35 g/day',
            'Active breaks during long sitting',
            ...base.habits
          ],
          note: base.note
        }
      };
    }
    if (bmi <= schemeThresholds(scheme).overHi) {
      return {
        title: 'Roadmap for Overweight',
        bullets: {
          weekly: base.weekly,
          habits: [
            'Create ~300–500 kcal/day deficit (portion swaps, lower calorie density)',
            'Protein ~1.2–1.6 g/kg/day for satiety & lean mass',
            'Fiber 25–35 g/day; mostly whole foods',
            'Strength 2–3×/week; cardio 150–300 min/week',
            ...base.habits
          ],
          note: base.note
        }
      };
    }
    return {
      title: 'Roadmap for Obesity',
      bullets: {
        weekly: base.weekly,
        habits: [
          'Start gentle & consistent; build time before intensity',
          'Aim for 300–500 kcal/day deficit; log meals for awareness',
          'Protein ~1.2–1.6 g/kg/day; fiber 25–35 g/day; limit refined carbs',
          'Discuss options with a clinician; programs/medication may help some',
          ...base.habits
        ],
        note: base.note
      }
    };
  }, [bmi, scheme]);

  // ---------- ShareCard component (reused for export + preview) ----------
  const ShareCard: React.FC<{ className?: string }> = ({ className = '' }) => {
    const gainLossAbs = Number.isFinite(deltaKg) ? Math.abs(deltaKg) : NaN;
    const unitLabel = unit === 'imperial' ? 'lb' : 'kg';
    const showGainLoss = Number.isFinite(gainLossAbs)
      ? `${(unit === 'imperial' ? kgToLb(gainLossAbs) : gainLossAbs).toFixed(1)} ${unitLabel}`
      : '—';
  
    return (
      <div
        className={`rounded-2xl p-4 bg-[#0b1220] border border-white/10 text-slate-200 ${className}`}
        style={{ fontFamily: 'ui-sans-serif, system-ui' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-white font-semibold text-lg">BMI Summary</div>
          <div className="text-xs text-slate-400">calculatorhub.site</div>
        </div>
  
        {/* Main row (centered vertically) */}
        {/* min-h matches the vertical space between header and scale in a 265px artboard */}
        <div className="mt-3 grid grid-cols-12 gap-4 items-center min-h-[116px]">
          {/* Left: ring */}
          <div className="col-span-3 grid place-items-center">
            <div
              className="relative rounded-full"
              style={{
                width: 72, height: 72,
                background: `conic-gradient(${ring} ${ringPct}%, #1f2937 0)`
              }}
            >
              <div className="absolute inset-2.5 rounded-full bg-[#0b1220] border border-white/10 grid place-items-center">
                <span className="text-2xl font-extrabold text-white">
                  {Number.isFinite(bmi) ? bmi.toFixed(1) : '—'}
                </span>
              </div>
            </div>
          </div>
  
          {/* Right: badges + bullets */}
          <div className="col-span-9">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${badge}`}>
                {category} ({scheme === 'who' ? 'WHO' : 'Asian'})
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-white/5 text-white/90 text-xs">
                Height: {heightInput} {ranges.h.label}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-white/5 text-white/90 text-xs">
                Weight: {weightInput} {ranges.w.label}
              </span>
            </div>
  
            {/* keep margins tight so vertical centering is visually precise */}
            <ul className="mt-2 space-y-0.5 text-slate-300 text-xs">
              <li>• <span className="text-white/90">Healthy:</span> {fmtWeight(minKg)} – {fmtWeight(maxKg)}</li>
              <li>• <span className="text-white/90">Target:</span> {fmtWeight(targetKg)}</li>
              <li>• <span className="text-white/90">Gain/Loss :</span> {showGainLoss}</li>
            </ul>
          </div>
        </div>
  
        {/* Scale with pointer */}
        <div className="mt-3">
          <div className="relative">
            <div className="flex h-2.5 rounded-full overflow-hidden">
              <div className="bg-blue-500"   style={{ width: `${wUnder}%` }} />
              <div className="bg-emerald-500" style={{ width: `${wNormal}%` }} />
              <div className="bg-amber-500"  style={{ width: `${wOver}%` }} />
              <div className="bg-rose-500 flex-1" />
            </div>
            <div
              className="absolute -top-1 h-4 w-4 rounded-full border-2 border-white bg-white shadow"
              style={{ left: `calc(${bmiPointerPct}% - 8px)` }}
              title={Number.isFinite(bmi) ? `BMI ${bmi.toFixed(1)}` : '—'}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>12</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
          </div>
        </div>
      </div>
    );
  };

  
    



  // ------------------------------------------------------------

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

      {/* Page wrapper */}
      <div className="relative overflow-x-hidden pt-[env(safe-area-inset-top)]">
        {/* Responsive background glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 -translate-x-1/2 w-[110%] sm:w-[90%] md:w-[70%] max-w-[1200px] h-48 sm:h-60 md:h-72 bg-gradient-to-r from-indigo-500/30 via-cyan-400/20 to-indigo-500/30 blur-3xl rounded-full" />
        </div>

        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Breadcrumbs items={[
            { name: 'Math Tools', url: '/category/math-tools' },
            { name: 'BMI Calculator', url: '/bmi-calculator' }
          ]} />

          {/* Header */}
          <div className="mb-6 sm:mb-8 rounded-2xl p-4 sm:p-6 bg-gradient-to-r from-indigo-600 to-cyan-500 shadow-lg">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-sm">BMI Calculator</h1>
            <p className="text-white/90 mt-1 text-sm sm:text-base">Calculate your Body Mass Index and see where you land on the healthy range.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            {/* Inputs Card */}
            <div className="rounded-2xl p-4  bg-white/5 border border-white/10 backdrop-blur-xl shadow-xl min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <h2 className="text-lg sm:text-sm font-semibold text-white">Your details</h2>

                {/* action buttons */} 
                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                  <motion.button whileTap={reduceMotion ? {} : { scale: 0.94 }} onClick={copyLink}
                    className="relative px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
                    <AnimatePresence initial={false} mode="wait"> 
                      {copied ? (
                        <motion.span key="copied" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="inline-flex items-center gap-1 text-emerald-300 text-xs">
                          <Check className="h-4 w-4" />
                        </motion.span>
                      ) : (
                        <motion.span key="copy" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="inline-flex items-center gap-2 text-sm">
                          <LinkIcon className="h-4 w-4" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {showCopyPulse && <span className="pointer-events-none absolute inset-0 rounded-xl animate-[ping_0.3s_ease-out] bg-white/20" />}
                  </motion.button>

                  <motion.button whileTap={reduceMotion ? {} : { scale: 0.94, rotate: -12 }} onClick={resetAll}
                    className="relative  px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
                    <div className="inline-flex items-center gap-2 text-sm">
                      <RotateCcw className="h-4 w-4" />
                    </div>
                    {showResetPulse && <span className="pointer-events-none absolute inset-0 rounded-xl animate-[ping_0.3s_ease-out] bg-white/20" />}
                  </motion.button>
                </div>
              </div> 

              {/* Unit & Scheme controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Unit system</label>
                  <div className="grid grid-cols-2 gap-1 rounded-xl p-1 bg-white/5 border border-white/10 w-full">
                    <motion.button whileTap={reduceMotion ? {} : { scale: 0.96 }} onClick={() => switchUnit('metric')}
                      aria-pressed={unit === 'metric'}
                      className={`min-h-[44px] rounded-lg text-sm font-medium transition-all ${unit === 'metric' ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow' : 'text-slate-200 hover:bg-white/5'}`}>
                      Metric
                    </motion.button>
                    <motion.button whileTap={reduceMotion ? {} : { scale: 0.96 }} onClick={() => switchUnit('imperial')}
                      aria-pressed={unit === 'imperial'}
                      className={`min-h-[44px] rounded-lg text-sm font-medium transition-all ${unit === 'imperial' ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow' : 'text-slate-200 hover:bg-white/5'}`}>
                      Imperial
                    </motion.button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">BMI standard</label>
                  <div className="grid grid-cols-2 gap-1 rounded-xl p-1 bg-white/5 border border-white/10 w-full">
                    <motion.button whileTap={reduceMotion ? {} : { scale: 0.96 }} onClick={() => switchScheme('who')}
                      aria-pressed={scheme === 'who'}
                      className={`min-h-[44px] rounded-lg text-sm font-medium transition-all ${scheme === 'who' ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow' : 'text-slate-200 hover:bg-white/5'}`}>
                      WHO
                    </motion.button>
                    <motion.button whileTap={reduceMotion ? {} : { scale: 0.96 }} onClick={() => switchScheme('asian')}
                      aria-pressed={scheme === 'asian'}
                      className={`min-h-[44px] rounded-lg text-sm font-medium transition-all ${scheme === 'asian' ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow' : 'text-slate-200 hover:bg-white/5'}`}>
                      Asian
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Height */}
              <div className="mb-5">
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Height ({ranges.h.label})</label>
                <input
                  type="text" inputMode="decimal" value={heightInput}
                  onChange={(e) => onHeightChange(e.target.value)} onBlur={normalizeHeight}
                  className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-base sm:text-lg text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  placeholder={unit === 'metric' ? 'e.g., 160' : 'e.g., 63.0'}
                />
                <p className="text-[11px] sm:text-xs text-slate-400 mt-1">Range {ranges.h.min}–{ranges.h.max} {ranges.h.label}</p>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Weight ({ranges.w.label})</label>
                <input
                  type="text" inputMode="decimal" value={weightInput}
                  onChange={(e) => onWeightChange(e.target.value)} onBlur={normalizeWeight}
                  className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-base sm:text-lg text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  placeholder={unit === 'metric' ? 'e.g., 55.0' : 'e.g., 121.3'}
                />
                <p className="text-[11px] sm:text-xs text-slate-400 mt-1">Range {ranges.w.min}–{ranges.w.max} {ranges.w.label}</p>
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
                          animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
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
                        {category} ({scheme === 'who' ? 'WHO' : 'Asian'})
                      </span>
                    </div>
                    <p className="text-slate-300 mt-2 text-xs sm:text-sm leading-relaxed">
                      BMI is a screening tool. Age, sex, muscle, and ethnicity can affect interpretation.
                    </p>

                    {/* Healthy weight range + target */}
                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                      <div className="rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-slate-200">
                        <div className="opacity-70 text-[11px] sm:text-xs">Healthy weight range for your height</div>
                        <div className="font-medium">{fmtWeight(minKg)} – {fmtWeight(maxKg)}</div>
                      </div>
                      <div className="rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-slate-200">
                        <div className="opacity-70 text-[11px] sm:text-xs">Target (mid of normal)</div>
                        <div className="font-medium">
                          {fmtWeight(targetKg)} {Number.isFinite(deltaKg) ? (
                            <span className="opacity-80">&nbsp;•&nbsp;{deltaKg > 0 ? 'Gain' : deltaKg < 0 ? 'Lose' : 'At target'} {fmtWeight(Math.abs(deltaKg))}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

               
                 
                {/* Legend */}
                <div className="mt-6 grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="flex items-center justify-between"><span className="text-slate-300">Underweight</span><span className="text-blue-300">Below 18.5</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-300">Normal</span><span className="text-emerald-300">18.5–{scheme === 'asian' ? '22.9' : '24.9'}</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-300">Overweight</span><span className="text-amber-300">{scheme === 'asian' ? '23–24.9' : '25–29.9'}</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-300">Obese</span><span className="text-rose-300">{scheme === 'asian' ? '25+' : '30+'}</span></div>
                </div>
              </div>
            </div>
          </div> 

         {/* --- Share / Download summary (preview + fixed export) --- */}
        <div className="mt-4">
          <div className="mb-2 text-slate-300 text-sm">Share / Download summary</div>
        
          {/* On-page responsive preview (looks great in-page) */}
          <ShareCard className="w-full max-w-[762px]" />
        
          {/* Hidden export card (ALWAYS 762×265) */}
          <div className="fixed -left-[9999px] top-0" style={{ width: EXPORT_W, height: EXPORT_H }}>
            <div ref={exportRef} className="w-[762px] h-[265px]">
              <ShareCard className="w-[762px] h-[265px]" />
            </div>
          </div>
        
          <div className="mt-2">
            <button
              onClick={downloadImage}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-white/10 border border-white/15 text-slate-100 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            >
              <Download className="h-4 w-4" /> Download Image
            </button>
          </div>
        </div>



          {/* Roadmap Section */}
          <div className="mt-6 sm:mt-10 rounded-2xl p-4 sm:p-6 bg-white/5 border border-white/10 backdrop-blur-xl">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">{roadmap.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-lg p-3 bg-white/5 border border-white/10">
                <div className="text-slate-300 text-sm font-medium mb-2">Weekly Focus</div>
                <ul className="text-slate-200 text-sm list-disc pl-5 space-y-1">
                  {roadmap.bullets.weekly.map((x: string, i: number) => <li key={i}>{x}</li>)}
                </ul>
              </div>
              <div className="rounded-lg p-3 bg-white/5 border border-white/10 md:col-span-2">
                <div className="text-slate-300 text-sm font-medium mb-2">Habits</div>
                <ul className="text-slate-200 text-sm list-disc pl-5 space-y-1">
                  {roadmap.bullets.habits.map((x: string, i: number) => <li key={i}>{x}</li>)}
                </ul>
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-3">{roadmap.bullets.note}</p>
          </div>

          <AdBanner type="bottom" />
          <RelatedCalculators currentPath="/bmi-calculator" category="math-tools" />
        </div>
      </div>
    </>
  );
};

export default BMICalculator;
