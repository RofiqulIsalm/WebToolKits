
/**
 * TemperatureConverter.tsx
 * ------------------------------------------------------------------
 * Adds:
 *  - prefers-reduced-motion guards for accessibility
 *  - LazyMotion + m (framer-motion) so features load lazily
 *  - Neutral theme animation (green aurora & uplifting "wing" particles)
 *  - Fire/Ice overlays + global storms persist while extreme values
 *  - CSV export, copy-all, presets, URL sync
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LazyMotion, m, AnimatePresence } from 'framer-motion';
import { Thermometer, Copy, Download } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

/* =====================================================================
   TYPES, CONSTANTS, ACCESSIBILITY
   ===================================================================== */

type Scale = 'C' | 'F' | 'K';
const SCALE_LABEL: Record<Scale, string> = { C: 'Celsius (°C)', F: 'Fahrenheit (°F)', K: 'Kelvin (K)' };

const FORMAT_MODES = ['normal', 'compact', 'scientific'] as const;
type FormatMode = typeof FORMAT_MODES[number];

const HOT_THRESHOLD_C = 40;
const COLD_THRESHOLD_C = 0;
const EXTREME_HOT_C = 1000;
const EXTREME_COLD_C = -1000;

/** Respect OS setting for reduced motion (fallback safe). */
function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setPrefersReduced(mq.matches);
    onChange();
    mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange);
    return () => {
      mq.removeEventListener ? mq.removeEventListener('change', onChange) : mq.removeListener(onChange);
    };
  }, []);
  return prefersReduced;
}

/* =====================================================================
   NUMBER HELPERS
   ===================================================================== */

function toCelsius(value: number, scale: Scale) {
  if (!Number.isFinite(value)) return NaN;
  switch (scale) {
    case 'C': return value;
    case 'F': return (value - 32) * (5 / 9);
    case 'K': return value - 273.15;
  }
}
function fromCelsius(c: number, target: Scale) {
  switch (target) {
    case 'C': return c;
    case 'F': return c * (9 / 5) + 32;
    case 'K': return c + 273.15;
  }
}
function formatNumber(n: number, mode: FormatMode = 'normal', precision = 4) {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (mode === 'scientific' || (mode === 'normal' && (abs >= 1e12 || (abs !== 0 && abs < 1e-6)))) {
    const p = Math.max(0, Math.min(12, precision));
    return n.toExponential(p).replace(/(?:\.?0+)(e[+-]?\d+)$/i, '$1');
  }
  const opts: Intl.NumberFormatOptions =
    mode === 'compact'
      ? { notation: 'compact', maximumFractionDigits: Math.min(precision, 6) }
      : { maximumFractionDigits: precision };
  const s = new Intl.NumberFormat(undefined, opts).format(n);
  return mode === 'compact'
    ? s
    : s.replace(/([.,]\d*?[1-9])0+$/, '$1').replace(/([.,])0+$/, '');
}

/* =====================================================================
   MOTION HELPERS (wrapped for reduced-motion)
   ===================================================================== */

const spring = { type: 'spring', stiffness: 380, damping: 32, mass: 0.8 };
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { ...spring, delay }
});
const softHover = { whileHover: { y: -3, scale: 1.015 }, whileTap: { scale: 0.985 }, transition: spring };

/* =====================================================================
   BACKGROUND / AURORA
   ===================================================================== */

const BgCanvas: React.FC = () => (
  <>
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        background:
          "radial-gradient(60% 80% at 20% 0%, rgba(99,102,241,0.18) 0%, transparent 60%),\
           radial-gradient(70% 90% at 90% 10%, rgba(147,51,234,0.18) 0%, transparent 60%),\
           radial-gradient(60% 70% at 50% 100%, rgba(59,130,246,0.20) 0%, transparent 60%)",
        filter: "saturate(120%)",
      }}
    />
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 motion-safe:animate-[huedrift_18s_ease-in-out_infinite_alternate]" />
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 opacity-[0.04] mix-blend-overlay"
      style={{
        backgroundImage:
          "url('data:image/svg+xml;utf8,\
            <svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'160\\' height=\\'160\\' viewBox=\\'0 0 160 160\\'>\
              <filter id=\\'n\\'><feTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.9\\' numOctaves=\\'2\\'/></filter>\
              <rect width=\\'100%\\' height=\\'100%\\' filter=\\'url(%23n)\\' opacity=\\'0.7\\'/>\
            </svg>')",
        backgroundSize: "auto",
      }}
    />
  </>
);

/* =====================================================================
   CARD OVERLAYS (FIRE / ICE) — respect reduced motion
   ===================================================================== */

function FireOverlay({ intense = false, off = false }: { intense?: boolean; off?: boolean }) {
  if (off) return null;
  return (
    <m.div className="pointer-events-none absolute inset-0 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: intense ? 1 : 0.9 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
      <m.div
        className="absolute -inset-8 blur-2xl"
        style={{ background: 'radial-gradient(60% 60% at 50% 80%, rgba(255,120,40,0.5) 0%, rgba(255,0,0,0.18) 60%, transparent 100%)' }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <m.svg
        viewBox="0 0 200 120"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[140%] h-auto"
        initial={{ y: 20, opacity: 0.75 }}
        animate={{ y: [20, 10, 20], opacity: [0.75, 1, 0.75] }}
        transition={{ duration: intense ? 1.4 : 2.0, repeat: Infinity, ease: 'easeInOut' }}
      >
        <defs>
          <linearGradient id="fireGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffd166"/>
            <stop offset="40%" stopColor="#ff7b00"/>
            <stop offset="100%" stopColor="#d00000"/>
          </linearGradient>
        </defs>
        <path d="M0,120 C20,90 30,60 60,50 C90,40 90,20 110,10 C130,0 150,20 140,45 C130,70 160,80 200,60 L200,120 Z" fill="url(#fireGrad)" opacity="0.55"/>
        <path d="M0,120 C30,95 50,70 80,60 C110,50 120,30 135,20 C150,10 165,25 160,45 C155,65 175,75 200,70 L200,120 Z" fill="url(#fireGrad)" opacity="0.35"/>
      </m.svg>
      <div className="absolute inset-0 rounded-2xl ring-1 ring-rose-700/40" />
      <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: 'inset 0 0 80px rgba(255,80,0,0.28), inset 0 0 160px rgba(255,140,0,0.16)' }}/>
    </m.div>
  );
}

function IceOverlay({ intense = false, off = false }: { intense?: boolean; off?: boolean }) {
  if (off) return null;
  return (
    <m.div className="pointer-events-none absolute inset-0 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: intense ? 1 : 0.9 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
      <m.div
        className="absolute -inset-8 blur-2xl"
        style={{ background: 'radial-gradient(60% 60% at 50% 20%, rgba(120,200,255,0.5) 0%, rgba(0,150,255,0.18) 60%, transparent 100%)' }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 rounded-2xl backdrop-blur-[1px]" style={{ background: 'linear-gradient(180deg, rgba(180,220,255,0.16) 0%, rgba(130,200,255,0.12) 50%, rgba(200,230,255,0.1) 100%)' }}/>
      <m.svg viewBox="0 0 200 120" className="absolute top-0 left-0 w-full h-full" initial={{ opacity: 0.45 }} animate={{ opacity: [0.35, 0.6, 0.35] }} transition={{ duration: 3.0, repeat: Infinity, ease: 'easeInOut' }}>
        <g stroke="#cfe9ff" strokeOpacity="0.8" strokeWidth="1.2" fill="none">
          <path d="M20 15 L50 35 L30 60 L70 75" />
          <path d="M120 10 L150 40 L140 70 L180 85" />
          <path d="M40 100 L80 85 L110 95 L150 105" />
        </g>
      </m.svg>
      <div className="absolute inset-0 rounded-2xl ring-1 ring-blue-300/30" />
      <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: 'inset 0 0 80px rgba(140,200,255,0.28), inset 0 0 160px rgba(180,230,255,0.16)' }}/>
    </m.div>
  );
}

/* =====================================================================
   GLOBAL OVERLAYS (HOT / COLD) — respect reduced motion
   ===================================================================== */

function FireStormOverlay({ off = false }: { off?: boolean }) {
  if (off) return null;
  return (
    <m.div className="pointer-events-none fixed inset-0 z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} aria-hidden="true">
      <m.div className="absolute -inset-16 blur-3xl"
        style={{ background: 'radial-gradient(70% 70% at 50% 70%, rgba(255,80,0,0.28) 0%, rgba(255,0,0,0.2) 50%, transparent 100%)' }}
        animate={{ opacity: [0.5, 0.95, 0.5] }} transition={{ duration: 2.0, repeat: Infinity }}
      />
      <m.div className="absolute inset-0" animate={{ filter: ['blur(0px)', 'blur(0.6px)', 'blur(0px)'], transform: ['translateY(0px)', 'translateY(-3px)', 'translateY(0px)'] }} transition={{ duration: 2.0, repeat: Infinity, ease: 'easeInOut' }}/>
      <m.div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,200,120,0.18) 1px, transparent 1px)', backgroundSize: '6px 6px' }} animate={{ opacity: [0.12, 0.24, 0.12] }} transition={{ duration: 1.5, repeat: Infinity }}/>
    </m.div>
  );
}

function IceStormOverlay({ off = false }: { off?: boolean }) {
  if (off) return null;
  return (
    <m.div className="pointer-events-none fixed inset-0 z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} aria-hidden="true">
      <m.div className="absolute -inset-16 blur-3xl"
        style={{ background: 'radial-gradient(70% 70% at 50% 30%, rgba(120,180,255,0.28) 0%, rgba(60,130,255,0.2) 50%, transparent 100%)' }}
        animate={{ opacity: [0.5, 0.95, 0.5] }} transition={{ duration: 2.0, repeat: Infinity }}
      />
      <m.div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(220,240,255,0.18) 1px, transparent 1px)', backgroundSize: '6px 6px' }} animate={{ backgroundPositionY: ['0%', '100%'] }} transition={{ duration: 6.0, repeat: Infinity, ease: 'linear' }}/>
      <m.div className="absolute inset-0" animate={{ filter: ['blur(0px)', 'blur(0.6px)', 'blur(0px)'] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}/>
      {/* Falling ❄️ flakes */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => (
          <m.div
            key={i}
            className="absolute left-1/2 text-2xl select-none"
            style={{ x: (i % 2 === 0 ? -1 : 1) * (20 + (i * 6) % 160) }}
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: ['-10%', '110%'], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 6 + (i % 5), delay: i * 0.15, repeat: Infinity, ease: 'linear' }}
          >
            <span role="img" aria-label="snowflake">❄️</span>
          </m.div>
        ))}
      </div>
    </m.div>
  );
}

/* =====================================================================
   NEUTRAL OVERLAY (GREEN AURORA + LIFTING "WINGS")
   Shown when not hot/cold extreme and not hot/cold local (i.e., normal).
   ===================================================================== */

function NeutralAuraOverlay({ off = false }: { off?: boolean }) {
  if (off) return null;
  return (
    <m.div className="pointer-events-none fixed inset-0 z-[40]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
      {/* Soft green aurora ribbons */}
      <m.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(40% 60% at 20% 80%, rgba(34,197,94,0.12) 0%, transparent 60%),\
             radial-gradient(50% 70% at 80% 30%, rgba(34,197,94,0.10) 0%, transparent 60%)'
        }}
        animate={{ opacity: [0.6, 0.85, 0.6] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Uplifting "wing" particles ascending softly */}
      {Array.from({ length: 18 }).map((_, i) => (
        <m.svg
          key={i}
          viewBox="0 0 40 40"
          className="absolute"
          style={{ left: `${(i * 53) % 100}%`, top: `${(i * 29) % 100}%` }}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: -30, opacity: [0, .9, 0] }}
          transition={{ duration: 5 + (i % 4), delay: i * 0.25, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M8 28 C14 18, 22 14, 32 12 C24 16, 16 22, 10 30 Z" fill="rgba(34,197,94,0.35)"/>
          <path d="M10 30 C16 22, 22 18, 30 14" stroke="rgba(134,239,172,0.5)" strokeWidth="1.2" fill="none"/>
        </m.svg>
      ))}
    </m.div>
  );
}

/* =====================================================================
   TILT WRAPPER
   ===================================================================== */

const Tilt: React.FC<{ children: React.ReactNode; off?: boolean }> = ({ children, off }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (off) return;
    const el = ref.current;
    if (!el) return;
    const hasFinePointer = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer:fine)').matches;
    if (!hasFinePointer) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(800px) rotateX(${(-y*4).toFixed(2)}deg) rotateY(${(x*6).toFixed(2)}deg) translateZ(0)`;
    };
    const onLeave = () => { el.style.transform = 'perspective(800px) rotateX(0) rotateY(0)'; };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, [off]);
  return <div ref={ref} className="transition-transform will-change-transform">{children}</div>;
};

/* =====================================================================
   MAIN COMPONENT
   ===================================================================== */

const TemperatureConverter: React.FC = () => {
  const prefersReduced = usePrefersReducedMotion();

  // State
  const [valueStr, setValueStr] = useState<string>('20');
  const [scale, setScale] = useState<Scale>('C');
  const [precision, setPrecision] = useState<number>(4);
  const [formatMode, setFormatMode] = useState<FormatMode>('normal');
  const [showPresets, setShowPresets] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Parse
  const valueNum = useMemo(() => {
    const clean = (valueStr ?? '').replace(/,/g, '').trim();
    if (clean === '') return 0;
    const n = Number(clean);
    return Number.isFinite(n) ? n : 0;
  }, [valueStr]);

  // Compute
  const celsius = useMemo(() => toCelsius(valueNum, scale), [valueNum, scale]);
  const fahrenheit = useMemo(() => fromCelsius(celsius as number, 'F'), [celsius]);
  const kelvin = useMemo(() => fromCelsius(celsius as number, 'K'), [celsius]);

  const display = {
    C: formatNumber(celsius as number, formatMode, precision),
    F: formatNumber(fahrenheit as number, formatMode, precision),
    K: formatNumber(kelvin as number, formatMode, precision),
  };

  // Guards
  const belowAbsoluteZero =
    (scale === 'C' && valueNum < -273.15) ||
    (scale === 'F' && valueNum < -459.67) ||
    (scale === 'K' && valueNum < 0);

  // State buckets
  const heatState: 'hot' | 'cold' | 'normal' =
    !Number.isFinite(celsius as number)
      ? 'normal'
      : (celsius as number) >= HOT_THRESHOLD_C
        ? 'hot'
        : (celsius as number) <= COLD_THRESHOLD_C
          ? 'cold'
          : 'normal';

  const extremeState: 'hot' | 'cold' | 'normal' =
    !Number.isFinite(celsius as number)
      ? 'normal'
      : (celsius as number) >= EXTREME_HOT_C
        ? 'hot'
        : (celsius as number) <= EXTREME_COLD_C
          ? 'cold'
          : 'normal';

  const accent = heatState === 'hot'
    ? 'from-orange-500/20 to-red-500/20 ring-red-400/30'
    : heatState === 'cold'
    ? 'from-sky-500/20 to-blue-500/20 ring-sky-400/30'
    : 'from-emerald-500/15 to-teal-500/15 ring-emerald-300/20';

  /* URL sync */
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const v = p.get('v'); const s = p.get('scale') as Scale | null;
      const fmt = p.get('fmt'); const pr = p.get('p');
      if (v !== null) setValueStr(v);
      if (s && ['C','F','K'].includes(s)) setScale(s as Scale);
      if (fmt && (FORMAT_MODES as readonly string[]).includes(fmt)) setFormatMode(fmt as FormatMode);
      if (pr && !Number.isNaN(+pr)) setPrecision(Math.max(0, Math.min(12, +pr)));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      const qs = new URLSearchParams();
      if (valueStr !== '') qs.set('v', valueStr);
      qs.set('scale', scale);
      qs.set('fmt', formatMode);
      qs.set('p', String(precision));
      window.history.replaceState(null, '', `${window.location.pathname}?${qs.toString()}`);
    } catch {}
  }, [valueStr, scale, formatMode, precision]);

  /* Actions */
  const applyPreset = (c: number) => { setScale('C'); setValueStr(String(c)); };
  function copyAll() {
    const lines = [
      `Input: ${formatNumber(valueNum, formatMode, precision)} ${SCALE_LABEL[scale]}`,
      `Celsius (°C): ${display.C}`,
      `Fahrenheit (°F): ${display.F}`,
      `Kelvin (K): ${display.K}`,
    ].join('\n');
    navigator?.clipboard?.writeText(lines).catch(()=>{});
  }
  function exportCSV() {
    const rows = [
      ['Label','Value'],
      ['Input', `${formatNumber(valueNum, formatMode, precision)} ${SCALE_LABEL[scale]}`],
      ['Celsius (°C)', display.C],
      ['Fahrenheit (°F)', display.F],
      ['Kelvin (K)', display.K],
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'temperature-conversion.csv'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 500);
    } catch {}
  }

  /* Lazy load framer-motion features */
  const loadFeatures = () => import('framer-motion').then(res => res.domAnimation);

  return (
    <>
      <style>{`
        @keyframes huedrift { from { filter: hue-rotate(0deg); } to { filter: hue-rotate(10deg); } }
        @keyframes floaty { 0% { transform: translateY(0) scale(0.6); opacity: .0; }
                            10% { opacity: .9; }
                            100% { transform: translateY(-40px) scale(1); opacity: 0; } }
      `}</style>

      <SEOHead
        title={seoData.temperatureConverter.title}
        description={seoData.temperatureConverter.description}
        canonical="https://calculatorhub.site/temperature-converter"
        schemaData={generateCalculatorSchema(
          'Temperature Converter',
          seoData.temperatureConverter.description,
          '/temperature-converter',
          seoData.temperatureConverter.keywords
        )}
        breadcrumbs={[
          { name: 'Unit Converters', url: '/category/unit-converters' },
          { name: 'Temperature Converter', url: '/temperature-converter' },
        ]}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <BgCanvas />

      {/* LazyMotion ensures framer-motion features bundle is loaded on demand */}
      <LazyMotion features={loadFeatures} strict>
        {/* Global overlays with reduced-motion guard */}
        <AnimatePresence>
          {extremeState === 'hot' && <FireStormOverlay off={prefersReduced} />}
          {extremeState === 'cold' && <IceStormOverlay off={prefersReduced} />}
          {/* Neutral aura only when not hot/cold local nor extreme */}
          {heatState === 'normal' && extremeState === 'normal' && <NeutralAuraOverlay off={prefersReduced} />}
        </AnimatePresence>

        <m.div
          className="relative max-w-5xl mx-auto text-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: prefersReduced ? 0 : 0.35, ease: 'easeOut' }}
        >
          <Breadcrumbs
            items={[
              { name: 'Unit Converters', url: '/category/unit-converters' },
              { name: 'Temperature Converter', url: '/temperature-converter' },
            ]}
          />

          {/* Header */}
          <m.div className={`mb-8 rounded-2xl p-6 border bg-gradient-to-r backdrop-blur-md ring-1 ${
              heatState === 'hot' ? 'from-orange-500/20 to-red-500/20 ring-red-400/30'
            : heatState === 'cold' ? 'from-sky-500/20 to-blue-500/20 ring-sky-400/30'
            : 'from-emerald-500/15 to-teal-500/15 ring-emerald-300/20'
          }`} {...fadeUp(0.05)}>
            <h1 className="text-3xl font-bold text-white mb-2">Temperature Converter</h1>
            <p className="text-gray-200/90">
              Convert between <b>Celsius</b>, <b>Fahrenheit</b>, and <b>Kelvin</b>. Fire/Ice extreme effects and a soothing green neutral vibe.
            </p>
          </m.div>

          {/* Controls */}
          <m.div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-xl p-6 shadow mb-8 ring-1 ring-white/10" {...fadeUp(0.1)}>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Value</label>
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="decimal"
                  value={valueStr}
                  onChange={(e) => setValueStr(e.target.value)}
                  placeholder="Enter value (default 0)"
                  className="w-full px-4 py-2 rounded-xl bg-gray-800/70 border border-white/10 text-gray-100 placeholder-gray-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-gray-900 focus-visible:outline-none transition-[box-shadow] duration-200"
                  aria-label="Enter temperature"
                />
                <p className="text-xs text-gray-400 mt-1">Commas allowed (1,234.5). Empty counts as 0.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Scale</label>
                <select
                  value={scale}
                  onChange={(e) => setScale(e.target.value as Scale)}
                  className="w-full px-4 py-2 rounded-xl bg-gray-800/70 border border-white/10 text-gray-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-gray-900 focus-visible:outline-none"
                >
                  <option value="C">Celsius (°C)</option>
                  <option value="F">Fahrenheit (°F)</option>
                  <option value="K">Kelvin (K)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Precision</label>
                <input
                  type="range"
                  min={0}
                  max={12}
                  value={precision}
                  onChange={(e) => setPrecision(+e.target.value)}
                  className="w-full accent-blue-500"
                />
                <div className="text-xs text-gray-400 mt-1">Decimals: {precision}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Format</label>
                <select
                  value={formatMode}
                  onChange={(e) => setFormatMode(e.target.value as FormatMode)}
                  className="w-full px-4 py-2 rounded-xl bg-gray-800/70 border border-white/10 text-gray-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-gray-900 focus-visible:outline-none"
                >
                  <option value="normal">Normal</option>
                  <option value="compact">Compact</option>
                  <option value="scientific">Scientific</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <m.button onClick={() => setShowPresets((s) => !s)} className={`px-3 py-2 rounded-xl border text-gray-100 bg-gray-800/70 backdrop-blur ring-1 ${
                  heatState === 'hot' ? 'from-orange-500/20 to-red-500/20 ring-red-400/30'
                : heatState === 'cold' ? 'from-sky-500/20 to-blue-500/20 ring-sky-400/30'
                : 'from-emerald-500/15 to-teal-500/15 ring-emerald-300/20'
              } hover:ring-2`} title="Show presets" whileHover={!prefersReduced ? { y: -3, scale: 1.015 } : undefined} whileTap={!prefersReduced ? { scale: 0.985 } : undefined}>
                Presets
              </m.button>
              <m.button onClick={copyAll} className="px-3 py-2 rounded-xl border text-gray-100 bg-gray-800/70 backdrop-blur ring-1 ring-white/10 hover:ring-2 flex items-center gap-2"
                title="Copy results" whileHover={!prefersReduced ? { y: -3, scale: 1.015 } : undefined} whileTap={!prefersReduced ? { scale: 0.985 } : undefined}>
                <Copy size={16} /> Copy All
              </m.button>
              <m.button onClick={exportCSV} className="px-3 py-2 rounded-xl border text-gray-100 bg-gray-800/70 backdrop-blur ring-1 ring-white/10 hover:ring-2 flex items-center gap-2"
                title="Download CSV" whileHover={!prefersReduced ? { y: -3, scale: 1.015 } : undefined} whileTap={!prefersReduced ? { scale: 0.985 } : undefined}>
                <Download size={16} /> CSV
              </m.button>
            </div>

            {/* Presets */}
            <AnimatePresence initial={false}>
              {showPresets && (
                <m.div className="mt-3 flex flex-wrap gap-2" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                  {[{ label: 'Freeze', c: 0 }, { label: 'Room', c: 20 }, { label: 'Body', c: 37 }, { label: 'Boil', c: 100 }].map((p, i) => (
                    <m.button key={p.label} onClick={() => applyPreset(p.c)} className="px-3 py-1.5 rounded-full bg-gray-800/70 border border-white/10 text-gray-200 text-sm" title={`${p.c} °C`}
                      whileHover={!prefersReduced ? { y: -1 } : undefined} whileTap={!prefersReduced ? { scale: 0.98 } : undefined}>
                      {p.label}
                    </m.button>
                  ))}
                </m.div>
              )}
            </AnimatePresence>

            {/* Warning */}
            <AnimatePresence>
              {belowAbsoluteZero && (
                <m.div className="mt-4 rounded-lg bg-red-900/40 border border-red-800 text-red-200 px-4 py-2" initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -12, opacity: 0 }} transition={{ duration: 0.25 }}>
                  ⚠️ This value is below absolute zero for the selected scale.
                </m.div>
              )}
            </AnimatePresence>
          </m.div>

          {/* Result cards */}
          <m.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: prefersReduced ? 0 : 0.06 } } }}>
            {(['C','F','K'] as Scale[]).map((S, idx) => {
              const label = S === 'C' ? 'Celsius (°C)' : S === 'F' ? 'Fahrenheit (°F)' : 'Kelvin (K)';
              const colorIcon = S === 'C' ? 'text-blue-300' : S === 'F' ? 'text-rose-300' : 'text-violet-300';
              const valueDisplay = S === 'C' ? display.C : S === 'F' ? display.F : display.K;
              return (
                <m.div key={S}
                  className="relative overflow-hidden rounded-2xl p-6 border bg-gray-900/60 backdrop-blur-xl border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10 hover:ring-2 hover:ring-white/20 transition-shadow"
                  variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                >
                  <AnimatePresence initial={false} mode="popLayout">
                    {heatState === 'hot' && <FireOverlay intense={extremeState === 'hot'} off={prefersReduced} />}
                    {heatState === 'cold' && <IceOverlay intense={extremeState === 'cold'} off={prefersReduced} />}
                  </AnimatePresence>
                  <Tilt off={prefersReduced}>
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-4">
                        <Thermometer className={`h-5 w-5 ${colorIcon}`} />
                        <h3 className="text-lg font-semibold text-white">{label}</h3>
                      </div>
                      <div className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold text-gray-100">
                        <AnimatePresence mode="wait">
                          <m.span key={String(valueDisplay)} initial={{ y: 8, opacity: 0, scale: 0.995 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -8, opacity: 0, scale: 0.997 }} transition={spring}>
                            {valueDisplay}
                          </m.span>
                        </AnimatePresence>
                      </div>
                      <div className="mt-2 text-sm text-gray-300/80">Input converted to {S}</div>
                    </div>
                  </Tilt>
                </m.div>
              );
            })}
          </m.div>

          {/* Quick Reference */}
          <m.div {...fadeUp(0.1)} className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-xl p-6 shadow mb-8 ring-1 ring-white/10">
            <h4 className="font-semibold text-white mb-3">Quick Reference</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="rounded-lg p-4 bg-blue-950/40 border border-white/10">
                <div className="text-blue-200/90 font-medium mb-1">Water freezes</div>
                <div className="text-gray-200">0°C = 32°F = 273.15K</div>
              </div>
              <div className="rounded-lg p-4 bg-rose-950/40 border border-white/10">
                <div className="text-rose-200/90 font-medium mb-1">Room temperature</div>
                <div className="text-gray-200">20°C = 68°F = 293.15K</div>
              </div>
              <div className="rounded-lg p-4 bg-violet-950/40 border border-white/10">
                <div className="text-violet-200/90 font-medium mb-1">Water boils</div>
                <div className="text-gray-200">100°C = 212°F = 373.15K</div>
              </div>
            </div>
          </m.div>

          <AdBanner type="bottom" />
          <RelatedCalculators currentPath="/temperature-converter" category="unit-converters" />
        </m.div>
      </LazyMotion>
    </>
  );
};

export default TemperatureConverter;
