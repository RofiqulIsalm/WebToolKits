import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thermometer, Copy, Download } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

/* ---------------- Types & constants ---------------- */
type Scale = 'C' | 'F' | 'K';
const SCALE_LABEL: Record<Scale, string> = { C: 'Celsius (°C)', F: 'Fahrenheit (°F)', K: 'Kelvin (K)' };
const FORMAT_MODES = ['normal', 'compact', 'scientific'] as const;
type FormatMode = typeof FORMAT_MODES[number];

// Visual thresholds (based on °C)
const HOT_THRESHOLD_C = 40;
const COLD_THRESHOLD_C = 0;
const EXTREME_HOT_C = 1000;
const EXTREME_COLD_C = -1000;

/* ---------------- Conversion helpers ---------------- */
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

/* ---------------- Motion helpers ---------------- */
const spring = { type: 'spring', stiffness: 380, damping: 32, mass: 0.8 };
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { ...spring, delay }
});
const softHover = { whileHover: { y: -3, scale: 1.015 }, whileTap: { scale: 0.985 }, transition: spring };

/* ---------------- Background canvas ---------------- */
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
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 motion-safe:animate-[huedrift_18s_ease-in-out_infinite_alternate]"
    />
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

/* ---------------- Card overlays ---------------- */
function FireOverlay({ intense = false }: { intense?: boolean }) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: intense ? 1 : 0.9 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <motion.div
        className="absolute -inset-8 blur-2xl"
        style={{ background: 'radial-gradient(60% 60% at 50% 80%, rgba(255,120,40,0.5) 0%, rgba(255,0,0,0.18) 60%, transparent 100%)' }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.svg
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
      </motion.svg>
      <div className="absolute inset-0 rounded-2xl ring-1 ring-rose-700/40" />
      <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: 'inset 0 0 80px rgba(255,80,0,0.28), inset 0 0 160px rgba(255,140,0,0.16)' }}/>
    </motion.div>
  );
}
function IceOverlay({ intense = false }: { intense?: boolean }) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: intense ? 1 : 0.9 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <motion.div
        className="absolute -inset-8 blur-2xl"
        style={{ background: 'radial-gradient(60% 60% at 50% 20%, rgba(120,200,255,0.5) 0%, rgba(0,150,255,0.18) 60%, transparent 100%)' }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 rounded-2xl backdrop-blur-[1px]" style={{ background: 'linear-gradient(180deg, rgba(180,220,255,0.16) 0%, rgba(130,200,255,0.12) 50%, rgba(200,230,255,0.1) 100%)' }}/>
      <motion.svg
        viewBox="0 0 200 120"
        className="absolute top-0 left-0 w-full h-full"
        initial={{ opacity: 0.45 }}
        animate={{ opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 3.0, repeat: Infinity, ease: 'easeInOut' }}
      >
        <g stroke="#cfe9ff" strokeOpacity="0.8" strokeWidth="1.2" fill="none">
          <path d="M20 15 L50 35 L30 60 L70 75" />
          <path d="M120 10 L150 40 L140 70 L180 85" />
          <path d="M40 100 L80 85 L110 95 L150 105" />
        </g>
      </motion.svg>
      <div className="absolute inset-0 rounded-2xl ring-1 ring-blue-300/30" />
      <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: 'inset 0 0 80px rgba(140,200,255,0.28), inset 0 0 160px rgba(180,230,255,0.16)' }}/>
    </motion.div>
  );
}

/* ---------------- NEW: Neutral overlays (card + subtle page breeze) ---------------- */
function NeutralOverlay() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.9 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* soft green glow */}
      <motion.div
        className="absolute -inset-8 blur-2xl"
        style={{ background: 'radial-gradient(60% 60% at 50% 50%, rgba(34,197,94,0.25) 0%, rgba(16,185,129,0.18) 60%, transparent 100%)' }}
        animate={{ opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 2.0, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* floating “wings” */}
      <motion.svg
        viewBox="0 0 200 120"
        className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[130%] h-auto"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <defs>
          <linearGradient id="leafGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#86efac"/><stop offset="100%" stopColor="#34d399"/>
          </linearGradient>
        </defs>
        <path d="M10,110 C40,90 70,90 100,110 C70,80 40,80 10,110Z" fill="url(#leafGrad)" opacity="0.35" />
        <path d="M100,110 C130,90 160,90 190,110 C160,80 130,80 100,110Z" fill="url(#leafGrad)" opacity="0.35" />
      </motion.svg>
      <div className="absolute inset-0 rounded-2xl ring-1 ring-emerald-400/25" />
      <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: 'inset 0 0 80px rgba(34,197,94,0.22), inset 0 0 160px rgba(16,185,129,0.12)' }}/>
    </motion.div>
  );
}
function NeutralBreezeOverlay() {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[55]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      aria-hidden="true"
    >
      <motion.div
        className="absolute -inset-16 blur-3xl"
        style={{ background: 'radial-gradient(70% 70% at 50% 60%, rgba(34,197,94,0.15) 0%, rgba(16,185,129,0.12) 50%, transparent 100%)' }}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(209,250,229,0.14) 1px, transparent 1px)', backgroundSize: '8px 8px' }}
        animate={{ backgroundPositionX: ['0%','100%'], backgroundPositionY: ['0%','100%'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  );
}

/* ---------------- Global overlays + persistent particles ---------------- */
function FireStormOverlay() {
  return (
    <motion.div className="pointer-events-none fixed inset-0 z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} aria-hidden="true">
      <motion.div className="absolute -inset-16 blur-3xl"
        style={{ background: 'radial-gradient(70% 70% at 50% 70%, rgba(255,80,0,0.25) 0%, rgba(255,0,0,0.18) 50%, transparent 100%)' }}
        animate={{ opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 2.2, repeat: Infinity }}
      />
      <motion.div className="absolute inset-0" animate={{ filter: ['blur(0px)', 'blur(0.6px)', 'blur(0px)'], transform: ['translateY(0px)', 'translateY(-3px)', 'translateY(0px)'] }} transition={{ duration: 2.0, repeat: Infinity, ease: 'easeInOut' }}/>
      <motion.div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,200,120,0.18) 1px, transparent 1px)', backgroundSize: '6px 6px' }} animate={{ opacity: [0.12, 0.24, 0.12] }} transition={{ duration: 1.5, repeat: Infinity }}/>
    </motion.div>
  );
}
function IceStormOverlay() {
  return (
    <motion.div className="pointer-events-none fixed inset-0 z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} aria-hidden="true">
      <motion.div className="absolute -inset-16 blur-3xl"
        style={{ background: 'radial-gradient(70% 70% at 50% 30%, rgba(120,180,255,0.25) 0%, rgba(60,130,255,0.18) 50%, transparent 100%)' }}
        animate={{ opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 2.2, repeat: Infinity }}
      />
      <motion.div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(220,240,255,0.18) 1px, transparent 1px)', backgroundSize: '6px 6px' }} animate={{ backgroundPositionY: ['0%', '100%'] }} transition={{ duration: 6.0, repeat: Infinity, ease: 'linear' }}/>
      <motion.div className="absolute inset-0" animate={{ filter: ['blur(0px)', 'blur(0.6px)', 'blur(0px)'] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}/>
    </motion.div>
  );
}

/* Persistent confetti-like particles while extreme */
const ParticlesPersistent: React.FC<{ type: 'hot' | 'cold' }> = ({ type }) => {
  const [seed, setSeed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeed(s => s + 1), 1600);
    return () => clearInterval(id);
  }, []);
  const rand = (i: number) => {
    const x = Math.sin((i + 1) * 9301 + seed * 49297) * 233280;
    return (x - Math.floor(x));
  };
  const items = Array.from({ length: 26 }).map((_, i) => ({
    left: `${rand(i) * 100}%`,
    top: `${rand(i + 37) * 100}%`,
    duration: 1.2 + rand(i + 71) * 1.6,
    delay: rand(i + 113) * 0.4,
    size: 1 + Math.round(rand(i + 151) * 2)
  }));
  return (
    <div className="pointer-events-none fixed inset-0 z-[65]">
      {items.map((p, i) => (
        <div
          key={`${seed}-${i}`}
          className={`absolute rounded-full opacity-0 motion-safe:animate-[floaty_var(--dur)_ease-in-out_var(--delay)_1] ${type==='hot' ? 'bg-amber-300/90' : 'bg-blue-100/90'}`}
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            filter: type==='hot' ? 'drop-shadow(0 0 6px rgba(255,160,60,0.6))' : 'drop-shadow(0 0 6px rgba(180,220,255,0.6))',
            ['--dur' as any]: `${p.duration}s`,
            ['--delay' as any]: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

/* ---------------- Tilt wrapper ---------------- */
const Tilt: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
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
  }, []);
  return <div ref={ref} className="transition-transform will-change-transform">{children}</div>;
};

/* ---------------- Component ---------------- */
const TemperatureConverter: React.FC = () => {
  // state
  const [valueStr, setValueStr] = useState<string>('20');
  const [scale, setScale] = useState<Scale>('C');
  const [precision, setPrecision] = useState<number>(4);
  const [formatMode, setFormatMode] = useState<FormatMode>('normal');
  const [showPresets, setShowPresets] = useState(false);

  // NEW: reduced-motion guard (accessibility)
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setPrefersReduced(!!mq.matches);
    apply();
    if ('addEventListener' in mq) mq.addEventListener('change', apply);
    else mq.addListener(apply);
    return () => {
      if ('removeEventListener' in mq) mq.removeEventListener('change', apply);
      else mq.removeListener(apply);
    };
  }, []);

  // refs
  const inputRef = useRef<HTMLInputElement | null>(null);

  // parse number (allow commas)
  const valueNum = useMemo(() => {
    const clean = (valueStr ?? '').replace(/,/g, '').trim();
    if (clean === '') return 0;
    const n = Number(clean);
    return Number.isFinite(n) ? n : 0;
  }, [valueStr]);

  // compute all three
  const celsius = useMemo(() => toCelsius(valueNum, scale), [valueNum, scale]);
  const fahrenheit = useMemo(() => fromCelsius(celsius as number, 'F'), [celsius]);
  const kelvin = useMemo(() => fromCelsius(celsius as number, 'K'), [celsius]);

  const display = {
    C: formatNumber(celsius as number, formatMode, precision),
    F: formatNumber(fahrenheit as number, formatMode, precision),
    K: formatNumber(kelvin as number, formatMode, precision),
  };

  // absolute zero check
  const belowAbsoluteZero =
    (scale === 'C' && valueNum < -273.15) ||
    (scale === 'F' && valueNum < -459.67) ||
    (scale === 'K' && valueNum < 0);

  // heat state
  const heatState: 'hot' | 'cold' | 'normal' =
    !Number.isFinite(celsius as number)
      ? 'normal'
      : (celsius as number) >= HOT_THRESHOLD_C
        ? 'hot'
        : (celsius as number) <= COLD_THRESHOLD_C
          ? 'cold'
          : 'normal';

  // extreme global effect
  const extremeState: 'hot' | 'cold' | 'normal' =
    !Number.isFinite(celsius as number)
      ? 'normal'
      : (celsius as number) >= EXTREME_HOT_C
        ? 'hot'
        : (celsius as number) <= EXTREME_COLD_C
          ? 'cold'
          : 'normal';

  // accent
  const accent = heatState === 'hot'
    ? 'from-orange-500/20 to-red-500/20 ring-red-400/30'
    : heatState === 'cold'
    ? 'from-sky-500/20 to-blue-500/20 ring-sky-400/30'
    : 'from-indigo-500/15 to-purple-500/15 ring-white/10';

  /* ---------- URL sync ---------- */
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

  /* ---------- Actions ---------- */
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

  return (
    <>
      {/* Local keyframes if you can't add to global CSS */}
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

      {/* Ambient background */}
      <BgCanvas />

      {/* Global overlays + persistent particles while extreme or neutral */}
      <AnimatePresence>
        {!prefersReduced && extremeState === 'hot' && (<><FireStormOverlay /><ParticlesPersistent type="hot" /></>)}
        {!prefersReduced && extremeState === 'cold' && (<><IceStormOverlay /><ParticlesPersistent type="cold" /></>)}
        {/* NEW: neutral gentle breeze when NOT extreme and NOT reduced-motion */}
        {!prefersReduced && extremeState === 'normal' && heatState === 'normal' && <NeutralBreezeOverlay />}
      </AnimatePresence>

      <motion.div
        className="relative max-w-5xl mx-auto text-gray-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Temperature Converter', url: '/temperature-converter' },
          ]}
        />

        {/* Header */}
        <motion.div
          className={`mb-8 rounded-2xl p-6 border bg-gradient-to-r backdrop-blur-md ring-1 ${(
            heatState === 'hot'
              ? 'from-orange-500/20 to-red-500/20 ring-red-400/30'
              : heatState === 'cold'
               ? 'from-sky-500/20 to-blue-500/20 ring-sky-400/30'
              : 'from-emerald-500/15 to-lime-500/15 ring-emerald-300/20' /* subtle green when neutral */
          )}`}
          {...fadeUp(0.05)}
        >
          <h1 className="text-3xl font-bold text-white mb-2">Temperature Converter</h1>
          <p className="text-gray-200/90">
            Convert between <b>Celsius</b>, <b>Fahrenheit</b>, and <b>Kelvin</b>. Enjoy dynamic fire/ice effects for extreme temps!
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-xl p-6 shadow mb-8 ring-1 ring-white/10"
          {...fadeUp(0.1)}
        >
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
            <motion.button
              onClick={() => setShowPresets((s) => !s)}
              className={`px-3 py-2 rounded-xl border text-gray-100 bg-gray-800/70 backdrop-blur ring-1 ${
                heatState === 'normal' ? 'from-emerald-500/15 to-lime-500/15 ring-emerald-300/20' : ''
              } hover:ring-2`}
              title="Show presets"
              {...softHover}
            >
              Presets
            </motion.button>
            <motion.button
              onClick={copyAll}
              className={`px-3 py-2 rounded-xl border text-gray-100 bg-gray-800/70 backdrop-blur ring-1 ${
                heatState === 'normal' ? 'from-emerald-500/15 to-lime-500/15 ring-emerald-300/20' : ''
              } hover:ring-2 flex items-center gap-2`}
              title="Copy results"
              {...softHover}
            >
              <Copy size={16} /> Copy All
            </motion.button>
            <motion.button
              onClick={exportCSV}
              className={`px-3 py-2 rounded-xl border text-gray-100 bg-gray-800/70 backdrop-blur ring-1 ${
                heatState === 'normal' ? 'from-emerald-500/15 to-lime-500/15 ring-emerald-300/20' : ''
              } hover:ring-2 flex items-center gap-2`}
              title="Download CSV"
              {...softHover}
            >
              <Download size={16} /> CSV
            </motion.button>
          </div>

          {/* Presets */}
          <AnimatePresence initial={false}>
            {showPresets && (
              <motion.div
                className="mt-3 flex flex-wrap gap-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                {[
                  { label: 'Freeze', c: 0 },
                  { label: 'Room', c: 20 },
                  { label: 'Body', c: 37 },
                  { label: 'Boil', c: 100 },
                ].map((p, i) => (
                  <motion.button
                    key={p.label}
                    onClick={() => applyPreset(p.c)}
                    className="px-3 py-1.5 rounded-full bg-gray-800/70 border border-white/10 text-gray-200 text-sm"
                    title={`${p.c} °C`}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    {p.label}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Warning */}
          <AnimatePresence>
            {belowAbsoluteZero && (
              <motion.div
                className="mt-4 rounded-lg bg-red-900/40 border border-red-800 text-red-200 px-4 py-2"
                initial={{ x: -12, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -12, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                ⚠️ This value is below absolute zero for the selected scale.
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Result cards (all three with overlays) */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          {/* Celsius */}
          <motion.div
            className="relative overflow-hidden rounded-2xl p-6 border bg-gray-900/60 backdrop-blur-xl border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10 hover:ring-2 hover:ring-white/20 transition-shadow"
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            {...softHover}
          >
            <AnimatePresence initial={false} mode="popLayout">
              {!prefersReduced && heatState === 'hot' && <FireOverlay intense={extremeState === 'hot'} />}
              {!prefersReduced && heatState === 'cold' && <IceOverlay intense={extremeState === 'cold'} />}
              {/* NEW: neutral overlay */}
              {!prefersReduced && heatState === 'normal' && <NeutralOverlay />}
            </AnimatePresence>
            <Tilt>
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Thermometer className="h-5 w-5 text-blue-300" />
                  <h3 className="text-lg font-semibold text-white">Celsius (°C)</h3>
                </div>
                <div className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold text-gray-100">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={display.C}
                      initial={{ y: 8, opacity: 0, scale: 0.995 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: -8, opacity: 0, scale: 0.997 }}
                      transition={spring}
                    >
                      {display.C}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <div className="mt-2 text-sm text-gray-300/80">Input converted to °C</div>
              </div>
            </Tilt>
          </motion.div>

          {/* Fahrenheit */}
          <motion.div
            className="relative overflow-hidden rounded-2xl p-6 border bg-gray-900/60 backdrop-blur-xl border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10 hover:ring-2 hover:ring-white/20 transition-shadow"
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            {...softHover}
          >
            <AnimatePresence initial={false} mode="popLayout">
              {!prefersReduced && heatState === 'hot' && <FireOverlay intense={extremeState === 'hot'} />}
              {!prefersReduced && heatState === 'cold' && <IceOverlay intense={extremeState === 'cold'} />}
              {!prefersReduced && heatState === 'normal' && <NeutralOverlay />}
            </AnimatePresence>
            <Tilt>
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Thermometer className="h-5 w-5 text-rose-300" />
                  <h3 className="text-lg font-semibold text-white">Fahrenheit (°F)</h3>
                </div>
                <div className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold text-gray-100">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={display.F}
                      initial={{ y: 8, opacity: 0, scale: 0.995 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: -8, opacity: 0, scale: 0.997 }}
                      transition={spring}
                    >
                      {display.F}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <div className="mt-2 text-sm text-gray-300/80">Input converted to °F</div>
              </div>
            </Tilt>
          </motion.div>

          {/* Kelvin */}
          <motion.div
            className="relative overflow-hidden rounded-2xl p-6 border bg-gray-900/60 backdrop-blur-xl border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10 hover:ring-2 hover:ring-white/20 transition-shadow"
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            {...softHover}
          >
            <AnimatePresence initial={false} mode="popLayout">
              {!prefersReduced && heatState === 'hot' && <FireOverlay intense={extremeState === 'hot'} />}
              {!prefersReduced && heatState === 'cold' && <IceOverlay intense={extremeState === 'cold'} />}
              {!prefersReduced && heatState === 'normal' && <NeutralOverlay />}
            </AnimatePresence>
            <Tilt>
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Thermometer className="h-5 w-5 text-violet-300" />
                  <h3 className="text-lg font-semibold text-white">Kelvin (K)</h3>
                </div>
                <div className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold text-gray-100">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={display.K}
                      initial={{ y: 8, opacity: 0, scale: 0.995 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: -8, opacity: 0, scale: 0.997 }}
                      transition={spring}
                    >
                      {display.K}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <div className="mt-2 text-sm text-gray-300/80">Input converted to K</div>
              </div>
            </Tilt>
          </motion.div>
        </motion.div> 

        {/* Quick reference */}
        <motion.div {...fadeUp(0.1)} className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-xl p-6 shadow mb-8 ring-1 ring-white/10">
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
        </motion.div>

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/temperature-converter" category="unit-converters" />
      </motion.div>
    </>
  );
};

export default TemperatureConverter;
