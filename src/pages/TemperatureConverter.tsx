import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thermometer, Copy, Download, Snowflake, Home, Heart, Flame } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

/* =====================================================================
   TYPES & CONSTANTS
   ===================================================================== */

/** Allowed input scales. */
type Scale = 'C' | 'F' | 'K';

/** Human-readable labels for scales. */
const SCALE_LABEL: Record<Scale, string> = {
  C: 'Celsius (°C)',
  F: 'Fahrenheit (°F)',
  K: 'Kelvin (K)',
};

/** Number formatting modes. */
const FORMAT_MODES = ['normal', 'compact', 'scientific'] as const;
type FormatMode = typeof FORMAT_MODES[number];

/** Visual thresholds (based on °C). */
const HOT_THRESHOLD_C = 40;
const COLD_THRESHOLD_C = 0;

/** Extreme thresholds that trigger global fire/ice storm overlays. */
const EXTREME_HOT_C = 1000;
const EXTREME_COLD_C = -1000;

/* =====================================================================
   CONVERSION HELPERS
   ===================================================================== */

/**
 * Convert a value from the selected scale to Celsius.
 */
function toCelsius(value: number, scale: Scale): number {
  if (!Number.isFinite(value)) return NaN;
  switch (scale) {
    case 'C': return value;
    case 'F': return (value - 32) * (5 / 9);
    case 'K': return value - 273.15;
  }
}

/**
 * Convert a Celsius value to a target scale.
 */
function fromCelsius(c: number, target: Scale): number {
  switch (target) {
    case 'C': return c;
    case 'F': return c * (9 / 5) + 32;
    case 'K': return c + 273.15;
  }
}

/**
 * Format a number with user-selected mode and precision.
 * - Normal mode trims trailing zeros.
 * - Scientific/Compact modes use Intl.NumberFormat when applicable.
 */
function formatNumber(n: number, mode: FormatMode = 'normal', precision = 4): string {
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
   MOTION / ANIMATION HELPERS
   ===================================================================== */

/** Spring config for snappy but soft transitions. */
const spring = { type: 'spring', stiffness: 380, damping: 32, mass: 0.8 };

/** Fade+slide in helper for sections. */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { ...spring, delay }
});

/** Subtle hover/tap affordances for cards and buttons. */
const softHover = { whileHover: { y: -3, scale: 1.015 }, whileTap: { scale: 0.985 }, transition: spring };

/* =====================================================================
   BACKGROUND CANVAS
   - Ambient gradients and grain
   ===================================================================== */

const BgCanvas: React.FC = () => (
  <>
    {/* Gradient splashes */}
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
    {/* Slow hue drift */}
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 motion-safe:animate-[huedrift_18s_ease-in-out_infinite_alternate]"
    />
    {/* Soft grain (SVG turbulence) */}
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
   CARD OVERLAYS
   - Fire/Ice overlays that sit on each result card
   ===================================================================== */

/** Blazing fire overlay for a card. */
function FireOverlay({ intense = false }: { intense?: boolean }) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: intense ? 1 : 0.9 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Glow wash */}
      <motion.div
        className="absolute -inset-8 blur-2xl"
        style={{ background: 'radial-gradient(60% 60% at 50% 80%, rgba(255,120,40,0.5) 0%, rgba(255,0,0,0.18) 60%, transparent 100%)' }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Wavy flame shapes */}
      <motion.svg
        viewBox="0 0 200 120"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[160%] h-auto"
        initial={{ y: 20, opacity: 0.75 }}
        animate={{ y: [20, 10, 20], opacity: [0.75, 1, 0.75] }}
        transition={{ duration: intense ? 1.2 : 1.8, repeat: Infinity, ease: 'easeInOut' }}
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
      {/* Subtle ring & inner glow */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-rose-700/40" />
      <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: 'inset 0 0 80px rgba(255,80,0,0.28), inset 0 0 160px rgba(255,140,0,0.16)' }}/>
    </motion.div>
  );
}

/** Frosty ice overlay for a card. */
function IceOverlay({ intense = false }: { intense?: boolean }) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: intense ? 1 : 0.9 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Cold glow wash */}
      <motion.div
        className="absolute -inset-8 blur-2xl"
        style={{ background: 'radial-gradient(60% 60% at 50% 20%, rgba(120,200,255,0.5) 0%, rgba(0,150,255,0.18) 60%, transparent 100%)' }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Frosty lines */}
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
      {/* Rim & inner chill */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-blue-300/30" />
      <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: 'inset 0 0 80px rgba(140,200,255,0.28), inset 0 0 160px rgba(180,230,255,0.16)' }}/>
    </motion.div>
  );
}

/* =====================================================================
   GLOBAL OVERLAYS (PERSIST WHILE EXTREME)
   - Enlarged Fire Storm
   - Ice Storm sweeping from top to bottom
   - ❄️ emoji indicator for cold extremes
   ===================================================================== */

/** Big, dramatic fire storm overlay; persists while celsius >= EXTREME_HOT_C. */
function FireStormOverlay() {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[60]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      aria-hidden="true"
    >
      {/* Larger heat bloom */}
      <motion.div
        className="absolute -inset-28 blur-3xl"
        style={{ background: 'radial-gradient(80% 80% at 50% 70%, rgba(255,80,0,0.30) 0%, rgba(255,0,0,0.22) 50%, transparent 100%)' }}
        animate={{ opacity: [0.4, 0.95, 0.4], scale: [1, 1.03, 1] }}
        transition={{ duration: 2.0, repeat: Infinity }}
      />
      {/* Heat shimmer */}
      <motion.div
        className="absolute inset-0"
        animate={{ filter: ['blur(0px)', 'blur(0.8px)', 'blur(0px)'], transform: ['translateY(0px)', 'translateY(-5px)', 'translateY(0px)'] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Ember dots */}
      <motion.div
        className="absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,200,120,0.22) 1px, transparent 1px)', backgroundSize: '6px 6px' }}
        animate={{ opacity: [0.12, 0.28, 0.12] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      />
    </motion.div>
  );
}

/** Ice storm overlay sweeping from top to bottom; persists while celsius <= EXTREME_COLD_C. */
function IceStormOverlay() {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[60]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.5 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }} 
      aria-hidden="true"
    >
      {/* Sweeping cold veil from top -> bottom */}
      <motion.div
        className="absolute inset-x-0 top-0 h-full blur-2xl"
        style={{ background: 'linear-gradient(180deg, rgba(160,210,255,0.35) 0%, rgba(120,180,255,0.2) 40%, rgba(100,150,255,0.12) 70%, transparent 100%)' }}
        animate={{ backgroundPositionY: ['0%', '100%'] }}
        transition={{ duration: 6.0, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Frosty grain */}
      <motion.div
        className="absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(220,240,255,0.18) 1px, transparent 1px)', backgroundSize: '6px 6px' }}
        animate={{ backgroundPositionY: ['0%', '100%'] }}
        transition={{ duration: 8.0, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  );
}

/* =====================================================================
   PERSISTENT PARTICLES (DECORATIVE)
   - Light confetti-style dots that drift while extreme states are active
   ===================================================================== */

const ParticlesPersistent: React.FC<{ type: 'hot' | 'cold' }> = ({ type }) => {
  // Re-seed periodically to vary positions.
  const [seed, setSeed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeed(s => s + 1), 1600);
    return () => clearInterval(id);
  }, []);

  // Simple deterministic pseudo-random based on index + seed.
  const rand = (i: number) => {
    const x = Math.sin((i + 1) * 9301 + seed * 49297) * 233280;
    return (x - Math.floor(x));
  };

  // Build a small set of particle specs.
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

/* =====================================================================
   TILT WRAPPER
   - Lightweight 3D tilt on hover for fine pointers
   ===================================================================== */

const Tilt: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect coarse pointers (touch) by skipping tilt.
    const hasFinePointer = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer:fine)').matches;
    if (!hasFinePointer) return;

    // Mouse-move handler for tilt math.
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(800px) rotateX(${(-y*4).toFixed(2)}deg) rotateY(${(x*6).toFixed(2)}deg) translateZ(0)`;
    };
    const onLeave = () => { el.style.transform = 'perspective(800px) rotateX(0) rotateY(0)'; };

    // Attach & cleanup.
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return <div ref={ref} className="transition-transform will-change-transform">{children}</div>;
};

/* =====================================================================
   MAIN COMPONENT
   ===================================================================== */

const TemperatureConverter: React.FC = () => {
  /** Raw string input to support commas and empty state. */
  const [valueStr, setValueStr] = useState<string>('20');

  /** Active scale selection. */
  const [scale, setScale] = useState<Scale>('C');

  /** Number formatting controls. */
  const [precision, setPrecision] = useState<number>(4);
  const [formatMode, setFormatMode] = useState<FormatMode>('normal');

  /** Preset drawer toggle. */
  const [showPresets, setShowPresets] = useState(false);

  /** Ref for focusing the input. */
  const inputRef = useRef<HTMLInputElement | null>(null);

  /* ---------------- Parse input (commas ok, empty -> 0) ---------------- */
  const valueNum = useMemo(() => {
    const clean = (valueStr ?? '').replace(/,/g, '').trim();
    if (clean === '') return 0;
    const n = Number(clean);
    return Number.isFinite(n) ? n : 0;
  }, [valueStr]);

  /* ---------------- Compute all scales via Celsius --------------------- */
  const celsius = useMemo(() => toCelsius(valueNum, scale), [valueNum, scale]);
  const fahrenheit = useMemo(() => fromCelsius(celsius as number, 'F'), [celsius]);
  const kelvin = useMemo(() => fromCelsius(celsius as number, 'K'), [celsius]);

  /* ---------------- Pretty display strings ----------------------------- */
  const display = {
    C: formatNumber(celsius as number, formatMode, precision),
    F: formatNumber(fahrenheit as number, formatMode, precision),
    K: formatNumber(kelvin as number, formatMode, precision),
  };

  /* ---------------- Safety: absolute zero per scale -------------------- */
  const belowAbsoluteZero =
    (scale === 'C' && valueNum < -273.15) ||
    (scale === 'F' && valueNum < -459.67) ||
    (scale === 'K' && valueNum < 0);

  /* ---------------- State buckets for visuals -------------------------- */
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

  /* ---------------- Accent ring gradient based on state ---------------- */
  const accent = heatState === 'hot'
    ? 'from-orange-500/20 to-red-500/20 ring-red-400/30'
    : heatState === 'cold'
    ? 'from-sky-500/20 to-blue-500/20 ring-sky-400/30'
    : 'from-indigo-500/15 to-purple-500/15 ring-white/10';

  /* ---------------- URL sync (shareable state) ------------------------- */
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

  /* ---------------- Button actions ------------------------------------ */
  const applyPreset = (c: number) => { setScale('C'); setValueStr(String(c)); };

  /** Copy all values to clipboard (human readable). */
  function copyAll() {
    const lines = [
      `Input: ${formatNumber(valueNum, formatMode, precision)} ${SCALE_LABEL[scale]}`,
      `Celsius (°C): ${display.C}`,
      `Fahrenheit (°F): ${display.F}`,
      `Kelvin (K): ${display.K}`,
    ].join('\\n');
    navigator?.clipboard?.writeText(lines).catch(()=>{});
  }

  /** Export current values as CSV. */
  function exportCSV() {
    const rows = [
      ['Label','Value'],
      ['Input', `${formatNumber(valueNum, formatMode, precision)} ${SCALE_LABEL[scale]}`],
      ['Celsius (°C)', display.C],
      ['Fahrenheit (°F)', display.F],
      ['Kelvin (K)', display.K],
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\\n');
    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'temperature-conversion.csv'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 500);
    } catch {}
  }

  return (
    <>
      {/* Local keyframes in case your project doesn't include these globally. */}
      <style>{`
        @keyframes huedrift { from { filter: hue-rotate(0deg); } to { filter: hue-rotate(10deg); } }
        @keyframes floaty { 0% { transform: translateY(0) scale(0.6); opacity: .0; }
                            10% { opacity: .9; }
                            100% { transform: translateY(-40px) scale(1); opacity: 0; } }
      `}</style>

     {/** ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Temperature Converter — Celsius (°C), Fahrenheit (°F), Kelvin (K) (2025–2026)"
        description="Free Temperature Converter with precision control, Normal/Compact/Scientific formats, presets (absolute zero, boiling point, etc.), dynamic fire/ice visuals, CSV export, and shareable URLs. Convert between °C, °F, and Kelvin instantly."
        keywords={[
          "temperature converter",
          "celsius to fahrenheit",
          "fahrenheit to celsius",
          "celsius to kelvin",
          "kelvin to celsius",
          "fahrenheit to kelvin",
          "temperature conversion table",
          "absolute zero",
          "boiling point",
          "freezing point",
          "scientific notation",
          "precision control",
          "CSV export"
        ]}
        canonical="https://calculatorhub.site/temperature-converter"
        schemaData={[
          // 1) WebPage + Article
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://calculatorhub.site/temperature-converter#webpage",
            "url": "https://calculatorhub.site/temperature-converter",
            "name": "Temperature Converter (2025–2026) — °C ⇄ °F ⇄ K",
            "inLanguage": "en",
            "isPartOf": { "@id": "https://calculatorhub.site/#website" },
            "primaryImageOfPage": {
              "@type": "ImageObject",
              "@id": "https://calculatorhub.site/images/temperature-converter-hero.webp#primaryimg",
              "url": "https://calculatorhub.site/images/temperature-converter-hero.webp",
              "width": 1200,
              "height": 675
            },
            "mainEntity": {
              "@type": "Article",
              "@id": "https://calculatorhub.site/temperature-converter#article",
              "headline": "Temperature Converter — Celsius, Fahrenheit, and Kelvin",
              "description": "Convert between °C, °F, and K with precision and multiple display formats. Includes presets (absolute zero, room/body temp, boiling/freezing), keyboard-friendly UI, CSV export, and shareable query params.",
              "image": ["https://calculatorhub.site/images/temperature-converter-hero.webp"],
              "author": { "@type": "Organization", "name": "CalculatorHub", "url": "https://calculatorhub.site" },
              "publisher": { "@id": "https://calculatorhub.site/#organization" },
              "datePublished": "2025-11-09",
              "dateModified": "2025-11-09",
              "mainEntityOfPage": { "@id": "https://calculatorhub.site/temperature-converter#webpage" },
              "articleSection": [
                "How to Use",
                "Supported Scales",
                "Precision & Formats",
                "Presets",
                "CSV Export",
                "FAQ"
              ]
            }
          },
      
          // 2) Breadcrumbs
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "@id": "https://calculatorhub.site/temperature-converter#breadcrumbs",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://calculatorhub.site/" },
              { "@type": "ListItem", "position": 2, "name": "Unit Converters", "item": "https://calculatorhub.site/category/unit-converters" },
              { "@type": "ListItem", "position": 3, "name": "Temperature Converter", "item": "https://calculatorhub.site/temperature-converter" }
            ]
          },
      
          // 3) FAQ
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://calculatorhub.site/temperature-converter#faq",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Which temperature scales are supported?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Celsius (°C), Fahrenheit (°F), and Kelvin (K)."
                }
              },
              {
                "@type": "Question",
                "name": "How do precision and formats work?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Use the slider to select decimals (0–12). Choose Normal, Compact, or Scientific to format results. Extremely small/large values may auto-switch to scientific in Normal mode."
                }
              },
              {
                "@type": "Question",
                "name": "Are there presets for common temperatures?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Presets include Absolute Zero, Arctic Cold, Freezing/Boiling points of water, Room and Body temperature, and more."
                }
              },
              {
                "@type": "Question",
                "name": "Can I export or share results?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Copy values or export a CSV. The tool also syncs state to the URL for easy sharing."
                }
              },
              {
                "@type": "Question",
                "name": "Does it guard against values below absolute zero?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. If the input is below absolute zero for the selected scale, the UI shows a warning."
                }
              }
            ]
          },
      
          // 4) WebApplication
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://calculatorhub.site/temperature-converter#webapp",
            "name": "Temperature Converter",
            "url": "https://calculatorhub.site/temperature-converter",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web",
            "description": "Convert °C, °F, and K with precision controls, presets, Normal/Compact/Scientific formats, CSV export, and shareable URLs.",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "image": ["https://calculatorhub.site/images/temperature-converter-hero.webp"]
          },
      
          // 5) SoftwareApplication (optional)
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://calculatorhub.site/temperature-converter#software",
            "name": "Advanced Temperature Converter",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "All",
            "url": "https://calculatorhub.site/temperature-converter",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "description": "Interactive temperature conversion tool with presets, precise formatting, and CSV export."
          },
      
          // 6) WebSite + Organization (global)
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": "https://calculatorhub.site/#website",
            "url": "https://calculatorhub.site",
            "name": "CalculatorHub",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://calculatorhub.site/search?q={query}",
              "query-input": "required name=query"
            }
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": "https://calculatorhub.site/#organization",
            "name": "CalculatorHub",
            "url": "https://calculatorhub.site",
            "logo": {
              "@type": "ImageObject",
              "url": "https://calculatorhub.site/images/logo.png"
            }
          }
        ]}
      />
      
      {/** ===== Outside meta/link tags ===== */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <link rel="canonical" href="https://calculatorhub.site/temperature-converter" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/temperature-converter" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/temperature-converter" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/temperature-converter" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Temperature Converter (2025–2026) — °C ⇄ °F ⇄ K" />
      <meta property="og:description" content="Convert temperatures across Celsius, Fahrenheit, and Kelvin. Presets, precision controls, Normal/Compact/Scientific formats, CSV export, and shareable URLs." />
      <meta property="og:url" content="https://calculatorhub.site/temperature-converter" />
      <meta property="og:image" content="https://calculatorhub.site/images/temperature-converter-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Temperature converter dashboard with Celsius, Fahrenheit, and Kelvin cards" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Temperature Converter — Celsius, Fahrenheit, Kelvin" />
      <meta name="twitter:description" content="Fast, accurate temperature conversions with presets, precision controls, and CSV export." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/temperature-converter-hero.webp" />
      <meta name="twitter:creator" content="@CalculatorHub" />
      <meta name="twitter:site" content="@CalculatorHub" />
      
      {/** PWA & theme */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#0ea5e9" />
      
      {/** Performance */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="preload" as="image" href="/images/temperature-converter-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />


      {/* Ambient background */}
      <BgCanvas />

      {/* Global overlays + persistent particles while extreme states are active */}
      <AnimatePresence>
        {extremeState === 'hot' && (<><FireStormOverlay /><ParticlesPersistent type="hot" /></>)}
        {extremeState === 'cold' && (<><IceStormOverlay /><ParticlesPersistent type="cold" /></>)}
      </AnimatePresence>

      <motion.div
        className="relative max-w-5xl mx-auto text-gray-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Temperature Converter', url: '/temperature-converter' },
          ]}
        />

        {/* Header with state-aware accent */}
        <motion.div
          className={`mb-8 rounded-2xl p-6 border bg-gradient-to-r backdrop-blur-md ring-1 ${accent}`}
          {...fadeUp(0.05)}
        >
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">Temperature Converter</h1>
            {/* Extreme badges: fire for hot, ❄️ for cold */}
            <AnimatePresence>
              {extremeState === 'hot' && (
                <motion.span
                  className="text-2xl select-none"
                  initial={{ scale: 0, rotate: -15, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={spring}
                  title="Extreme heat"
                >
                  🔥
                </motion.span>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {extremeState === 'cold' && (
                <motion.span
                  className="text-2xl select-none"
                  initial={{ scale: 0, rotate: 15, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={spring}
                  title="Extreme cold"
                >
                  ❄️
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <p className="text-gray-200/90 mt-2">
            Convert between <b>Celsius</b>, <b>Fahrenheit</b>, and <b>Kelvin</b>. Enjoy dynamic fire/ice effects for extreme temps!
          </p>
        </motion.div>

        {/* Controls block */}
        <motion.div
          className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-xl p-6 shadow mb-8 ring-1 ring-white/10"
          {...fadeUp(0.1)}
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            {/* Input value */}
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

            {/* Scale selector */}
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

            {/* Precision slider */}
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

            {/* Format selector */}
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

          {/* Actions row */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <motion.button
              onClick={() => setShowPresets((s) => !s)}
              className={`px-3 py-2 rounded-xl border text-gray-100 bg-gray-800/70 backdrop-blur ring-1 ${accent} hover:ring-2`}
              title="Show presets"
              {...softHover}
            >
              Presets
            </motion.button>
            <motion.button
              onClick={copyAll}
              className={`px-3 py-2 rounded-xl border text-gray-100 bg-gray-800/70 backdrop-blur ring-1 ${accent} hover:ring-2 flex items-center gap-2`}
              title="Copy results"
              {...softHover}
            >
              <Copy size={16} /> Copy All
            </motion.button>
            <motion.button
              onClick={exportCSV}
              className={`px-3 py-2 rounded-xl border text-gray-100 bg-gray-800/70 backdrop-blur ring-1 ${accent} hover:ring-2 flex items-center gap-2`}
              title="Download CSV"
              {...softHover}
            >
              <Download size={16} /> CSV
            </motion.button>
          </div>

          {/* Preset chips */}
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
                    {
                      key: 'absoluteZero',
                      label: 'Absolute Zero',
                      c: -273.15,
                      Icon: Snowflake,
                      cls: 'from-blue-900/40 to-cyan-800/40 text-cyan-100 ring-cyan-400/40 hover:ring-cyan-300/60',
                    },
                    {
                      key: 'arctic',
                      label: 'Arctic Cold',
                      c: -40,
                      Icon: Snowflake,
                      cls: 'from-sky-700/40 to-blue-800/40 text-sky-100 ring-sky-400/40 hover:ring-sky-300/60',
                    },
                    {
                      key: 'freeze',
                      label: 'Water Freeze',
                      c: 0,
                      Icon: Snowflake,
                      cls: 'from-sky-600/30 to-blue-700/30 text-sky-200 ring-sky-400/30 hover:ring-sky-300/50',
                    },
                    {
                      key: 'room',
                      label: 'Room Temp',
                      c: 20,
                      Icon: Home,
                      cls: 'from-emerald-600/30 to-teal-700/30 text-emerald-200 ring-emerald-400/30 hover:ring-emerald-300/50',
                    },
                    {
                      key: 'body',
                      label: 'Body Temp',
                      c: 37,
                      Icon: Heart,
                      cls: 'from-amber-600/30 to-orange-700/30 text-amber-200 ring-amber-400/30 hover:ring-amber-300/50',
                    },
                    {
                      key: 'hotDay',
                      label: 'Hot Day',
                      c: 45,
                      Icon: Flame,
                      cls: 'from-orange-500/40 to-red-600/40 text-orange-100 ring-orange-400/40 hover:ring-orange-300/60',
                    },
                    {
                      key: 'boil',
                      label: 'Water Boil',
                      c: 100,
                      Icon: Flame,
                      cls: 'from-rose-600/30 to-red-700/30 text-rose-200 ring-rose-400/30 hover:ring-rose-300/50',
                    },
                    {
                      key: 'lava',
                      label: 'Lava',
                      c: 1200,
                      Icon: Flame,
                      cls: 'from-red-700/40 to-yellow-700/30 text-red-100 ring-red-400/40 hover:ring-red-300/60',
                    },
                    {
                      key: 'sun',
                      label: 'Sun Surface',
                      c: 5500,
                      Icon: Flame,
                      cls: 'from-yellow-400/40 to-orange-500/40 text-yellow-50 ring-yellow-300/40 hover:ring-yellow-200/60',
                    },
                  ]
                  .map((p, i) => (
                    <motion.button
                      key={p.key}
                      onClick={() => { setScale('C'); setValueStr(String(p.c)); }}
                      title={`${p.label} (${p.c} °C)`}
                      className={[
                        'relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm',
                        'bg-gradient-to-br backdrop-blur',
                        'border-white/10 ring-1',
                        'transition-shadow',
                        p.cls,
                      ].join(' ')}
                      whileHover={{ y: -1, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 22, delay: i * 0.03 }}
                    >
                      {/* animated glow ping */}
                      <motion.span
                        className="absolute inset-0 rounded-full"
                        style={{ boxShadow: '0 0 0 0 rgba(255,255,255,0.12)' }}
                        animate={{ boxShadow: ['0 0 0 0 rgba(255,255,255,0.10)','0 0 24px 6px rgba(255,255,255,0.06)','0 0 0 0 rgba(255,255,255,0.10)'] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.05 }}
                        aria-hidden
                      />
                      {/* icon with gentle motion */}
                      <motion.span
                        className="relative inline-flex"
                        animate={{ rotate: [0, 4, 0], scale: [1, 1.06, 1] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
                      >
                        <p.Icon size={16} className="opacity-90" />
                      </motion.span>
                      <span className="relative">{p.label}</span>
                      <span className="relative text-xs/none opacity-80">({p.c}°C)</span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

          {/* Absolute zero guard */}
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

        {/* Results: three synchronized cards with overlays */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          {/* Celsius card */}
          <motion.div
            className="relative overflow-hidden rounded-2xl p-6 border bg-blue-900/30 backdrop-blur-xl border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10 hover:ring-2 hover:ring-white/20 transition-shadow "
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            {...softHover}
          >
            <AnimatePresence initial={false} mode="popLayout">
              {heatState === 'hot' && <FireOverlay intense={extremeState === 'hot'} />}
              {heatState === 'cold' && <IceOverlay intense={extremeState === 'cold'} />}
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

          {/* Fahrenheit card */}
          <motion.div
            className="relative overflow-hidden rounded-2xl p-6 border bg-rose-900/30  backdrop-blur-xl border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10 hover:ring-2 hover:ring-white/20 transition-shadow"
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            {...softHover}
          >
            <AnimatePresence initial={false} mode="popLayout">
              {heatState === 'hot' && <FireOverlay intense={extremeState === 'hot'} />}
              {heatState === 'cold' && <IceOverlay intense={extremeState === 'cold'} />}
            </AnimatePresence>
            <Tilt>
              <div className="relative ">
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

          {/* Kelvin card */}
          <motion.div
            className="relative overflow-hidden rounded-2xl p-6 border bg-violet-900/30 backdrop-blur-xl border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10 hover:ring-2 hover:ring-white/20 transition-shadow"
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            {...softHover}
          >
            <AnimatePresence initial={false} mode="popLayout">
              {heatState === 'hot' && <FireOverlay intense={extremeState === 'hot'} />}
              {heatState === 'cold' && <IceOverlay intense={extremeState === 'cold'} />}
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

        {/* ==================== SEO CONTENT SECTION (~2000 words) ==================== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
        
          {/* ===== Table of Contents ===== */}
          <nav className="mt-2 mb-10 bg-[#0f172a] border border-[#334155] rounded-xl p-5 text-slate-200">
            <h2 className="text-lg font-semibold text-cyan-300 mb-3">📖 Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><a href="#overview" className="text-indigo-400 hover:underline">Overview: What This Temperature Converter Does</a></li>
              <li><a href="#how-to-use" className="text-indigo-400 hover:underline">How to Use the Converter</a></li>
              <li><a href="#formulas" className="text-indigo-400 hover:underline">Exact Formulas: °C ⇄ °F ⇄ K</a></li>
              <li><a href="#scales" className="text-indigo-400 hover:underline">About the Scales: Celsius, Fahrenheit & Kelvin</a></li>
              <li><a href="#precision-format" className="text-indigo-400 hover:underline">Precision & Number Formats</a></li>
              <li><a href="#presets" className="text-indigo-400 hover:underline">Presets & Practical Benchmarks</a></li>
              <li><a href="#examples" className="text-indigo-400 hover:underline">Worked Examples</a></li>
              <li><a href="#use-cases" className="text-indigo-400 hover:underline">Real-World Use Cases</a></li>
              <li><a href="#accuracy" className="text-indigo-400 hover:underline">Accuracy, Rounding & Best Practices</a></li>
              <li><a href="#pitfalls" className="text-indigo-400 hover:underline">Common Pitfalls to Avoid</a></li>
              <li><a href="#mini-table" className="text-indigo-400 hover:underline">Quick Reference Mini-Table</a></li>
              <li><a href="#benefits" className="text-indigo-400 hover:underline">Key Benefits</a></li>
              <li><a href="#tips" className="text-indigo-400 hover:underline">Power Tips</a></li>
              <li><a href="#accessibility" className="text-indigo-400 hover:underline">Accessibility & Performance</a></li>
              <li><a href="#faq" className="text-indigo-400 hover:underline">FAQ</a></li>
            </ol>
          </nav>
        
          {/* ===== Overview ===== */}
          <h1 id="overview" className="text-3xl font-bold text-cyan-400 mb-6">
            Temperature Converter — Celsius (°C), Fahrenheit (°F), Kelvin (K) — Accurate, Fast & Shareable
          </h1>
        
          <p>
            Whether you’re analyzing lab data, validating HVAC setpoints, calibrating industrial sensors, planning a bake, or
            simply figuring out if today’s forecast is scorching or chilly, precision temperature conversion makes decisions
            easier. The <strong>Temperature Converter by CalculatorHub</strong> gives instant, reliable results across the three
            most used scales — <strong>Celsius</strong>, <strong>Fahrenheit</strong>, and <strong>Kelvin</strong> — and wraps
            them in a clean, keyboard-friendly interface with <strong>precision control</strong>, <strong>Normal/Compact/Scientific
            formats</strong>, <strong>presets</strong> for common real-world points, <strong>absolute-zero guard</strong>,
            <strong>shareable URLs</strong>, and a one-click <strong>CSV export</strong>.
          </p>
        
          <p>
            Under the hood, conversions follow the exact, widely accepted relationships among °C, °F, and K. Results are computed
            at double-precision and then formatted according to your preferences. The goal is simple: <em>make your conversions
            fast, trustworthy, and easy to reuse</em> — whether you’re documenting an experiment, briefing a client, or publishing
            a spec sheet.
          </p>
        
          <figure className="my-8">
            <img
              src="/images/temperature-converter-hero.webp"
              alt="Temperature converter dashboard showing Celsius, Fahrenheit, Kelvin cards with precision and format controls"
              title="Temperature Converter — Celsius, Fahrenheit, Kelvin with presets, precision, CSV export"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Convert temperatures instantly with precision sliders, number-format modes, presets, and shareable links. An absolute-zero guard protects against invalid inputs.
            </figcaption>
          </figure>
        
          {/* ===== How to Use ===== */}
          <h2 id="how-to-use" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            💡 How to Use the Converter
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Type your <strong>Value</strong> (commas allowed; empty counts as 0 for quick trials).</li>
            <li>Select the input <strong>Scale</strong> (°C, °F, or K).</li>
            <li>Adjust <strong>Precision</strong> (0–12 decimals) and choose a <strong>Format</strong> (Normal, Compact, Scientific).</li>
            <li>Review the synchronized cards for <strong>Celsius</strong>, <strong>Fahrenheit</strong>, and <strong>Kelvin</strong>.</li>
            <li>Use <strong>Copy All</strong> or <strong>CSV</strong> to reuse results in notes, spreadsheets, or reports.</li>
          </ol>
          <p className="text-sm text-slate-400">
            Your selections (value, scale, precision, format) are encoded in the page URL, so you can bookmark or share exactly what you’re seeing.
          </p>
        
          {/* ===== Formulas ===== */}
          <h2 id="formulas" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📐 Exact Formulas: °C ⇄ °F ⇄ K
          </h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Celsius → Fahrenheit:</strong> °F = (°C × 9/5) + 32</li>
            <li><strong>Fahrenheit → Celsius:</strong> °C = (°F − 32) × 5/9</li>
            <li><strong>Celsius → Kelvin:</strong> K = °C + 273.15</li>
            <li><strong>Kelvin → Celsius:</strong> °C = K − 273.15</li>
            <li><strong>Fahrenheit → Kelvin:</strong> convert to °C first, then add 273.15</li>
            <li><strong>Kelvin → Fahrenheit:</strong> convert to °C first, then to °F</li>
          </ul>
          <p>
            The converter uses <em>Celsius as the internal pivot</em> to ensure stable, consistent results: we convert the input
            to °C, then map to °F and K. This avoids cumulative drift and keeps the logic transparent.
          </p>
        
          {/* ===== Scales ===== */}
          <h2 id="scales" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🌡️ About the Scales: Celsius, Fahrenheit & Kelvin
          </h2>
          <p>
            <strong>Celsius (°C)</strong> is widely used in science and everyday life outside the U.S. It’s anchored at the
            freezing (0°C) and boiling (100°C) points of water at standard atmospheric pressure. <strong>Fahrenheit (°F)</strong>
            is common in the United States, with 32°F as water’s freeze point and 212°F as its boil point. <strong>Kelvin (K)</strong>
            is the SI base unit for thermodynamic temperature and starts at <em>absolute zero</em> (0 K), the theoretical point
            at which particle motion is minimal. A change of 1 K equals a change of 1°C, but Kelvin has no “degree” symbol.
          </p>
          <p>
            Since Kelvin is absolute, <strong>negative Kelvin values are not physically meaningful</strong>. The tool guards
            against inputs that drop below absolute zero for any selected scale (e.g., below −273.15°C, below −459.67°F, or below 0 K).
          </p>
        
          {/* ===== Precision & Formats ===== */}
          <h2 id="precision-format" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🎯 Precision & Number Formats (Normal · Compact · Scientific)
          </h2>
          <p>
            Choose the right <strong>Precision</strong> for the job: 0–2 decimals for consumer-facing content, 3–4 for engineering
            summaries, and up to 12 for scientific contexts. Then choose your preferred <strong>Format</strong>:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Normal</strong> — readable decimal notation with trimmed trailing zeros for clean presentation.</li>
            <li><strong>Compact</strong> — short notation (e.g., 1.2K, 3.4M) that saves space in dashboards and slides.</li>
            <li><strong>Scientific</strong> — exponential notation for extreme magnitudes and high-precision reporting.</li>
          </ul>
          <p className="text-sm text-slate-400">
            Extremely large/small magnitudes may auto-switch to scientific when Normal is chosen, keeping values tidy and unambiguous.
          </p>
        
          {/* ===== Presets ===== */}
          <h2 id="presets" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🎛️ Presets & Practical Benchmarks
          </h2>
          <p>
            Presets speed up everyday work and help build intuition. With one click you can load values like <em>Absolute Zero</em>,
            <em>Arctic Cold</em>, <em>Water Freezes</em>, <em>Room Temperature</em>, <em>Body Temperature</em>, <em>Hot Day</em>,
            <em>Water Boils</em>, and even extreme benchmarks like <em>Lava</em> or <em>Sun Surface</em> for visual effect.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 list-none pl-0">
            <li><strong>Absolute Zero:</strong> −273.15°C = −459.67°F = 0 K</li>
            <li><strong>Water Freezes:</strong> 0°C = 32°F = 273.15 K</li>
            <li><strong>Room Temperature:</strong> ~20°C = 68°F = 293.15 K</li>
            <li><strong>Body Temperature:</strong> ~37°C = 98.6°F = 310.15 K</li>
            <li><strong>Water Boils:</strong> 100°C = 212°F = 373.15 K</li>
          </ul>
          <p className="text-sm text-slate-400">
            Environmental factors (altitude/pressure) can shift water’s phase-change points; the values above assume standard atmospheric pressure.
          </p>
        
          {/* ===== Worked Examples ===== */}
          <h2 id="examples" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📈 Worked Examples (rounded for readability)
          </h2>
          <ul className="space-y-2">
            <li><strong>25°C → °F</strong>: (25 × 9/5) + 32 = <strong>77°F</strong>; 25°C → K = <strong>298.15 K</strong>.</li>
            <li><strong>−40°C → °F</strong>: (−40 × 9/5) + 32 = <strong>−40°F</strong> (the scales intersect at −40).</li>
            <li><strong>451°F → °C</strong>: (451 − 32) × 5/9 ≈ <strong>232.78°C</strong>; → K ≈ <strong>505.93 K</strong>.</li>
            <li><strong>300 K → °C</strong>: 300 − 273.15 = <strong>26.85°C</strong>; → °F = (26.85 × 9/5) + 32 ≈ <strong>80.33°F</strong>.</li>
            <li><strong>90°F → °C</strong>: (90 − 32) × 5/9 ≈ <strong>32.22°C</strong>; → K ≈ <strong>305.37 K</strong>.</li>
          </ul>
        
          {/* ===== Use Cases ===== */}
          <h2 id="use-cases" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧰 Real-World Use Cases
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Science & Education</strong>: Class demos, lab notes, problem sets, and exam prep using exact formulas.</li>
            <li><strong>Engineering & HVAC</strong>: Converting setpoints, sensor outputs, and testing logs across regions.</li>
            <li><strong>Health & Medicine</strong>: Body-temp checks and device documentation (with appropriate precision and units).</li>
            <li><strong>Food & Hospitality</strong>: Recipes, oven settings, and HACCP documentation across °C and °F kitchens.</li>
            <li><strong>E-commerce & Product Specs</strong>: Presenting specs in the customer’s local scale; using Compact format for cards.</li>
            <li><strong>Meteorology & Outdoor</strong>: Cross-checking forecasts and climate data across scales for global audiences.</li>
          </ul>
        
          {/* ===== Accuracy & Best Practices ===== */}
          <h2 id="accuracy" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ✅ Accuracy, Rounding & Best Practices
          </h2>
          <p>
            The converter calculates at full double-precision and applies your display rules at the end. For reliable documentation:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Set sufficient <strong>decimals</strong> for your domain. Don’t over-round intermediate values.</li>
            <li>Prefer <strong>Scientific</strong> format when comparing very high or very low temperatures.</li>
            <li>Export <strong>CSV</strong> and keep a copy with your experiment or QA record. Round only in the final published table.</li>
            <li>Note the <strong>scale</strong> (°C, °F, or K) in any exported document to avoid ambiguity.</li>
          </ul>
        
          {/* ===== Pitfalls ===== */}
          <h2 id="pitfalls" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ⚠️ Common Pitfalls to Avoid
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Forgetting offsets</strong>: °C↔°F is not just a ratio — don’t omit the “+ 32” / “− 32”.</li>
            <li><strong>Negative Kelvin</strong>: Not physically meaningful; the tool warns if you attempt values below absolute zero.</li>
            <li><strong>Pressure assumptions</strong>: Boiling/freezing points shift with pressure/altitude; the standard points are reference values.</li>
            <li><strong>Confusing heat with temperature</strong>: Temperature measures average kinetic energy; it’s not the same as heat content.</li>
          </ul>
        
          {/* ===== Quick Reference Table ===== */}
          <h2 id="mini-table" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🗂️ Quick Reference Mini-Table
          </h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li>0°C = 32°F = 273.15 K</li>
              <li>20°C = 68°F = 293.15 K</li>
              <li>37°C = 98.6°F ≈ 310.15 K</li>
              <li>100°C = 212°F = 373.15 K</li>
              <li>−40°C = −40°F ≈ 233.15 K</li>
              <li>0 K = −273.15°C = −459.67°F</li>
            </ul>
          </div>
        
          {/* ===== Benefits ===== */}
          <h2 id="benefits" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🌟 Key Benefits You’ll Notice
          </h2>
          <ul className="space-y-2">
            <li>✔️ <strong>Accurate</strong> conversions using exact relationships and SI-aligned definitions.</li>
            <li>✔️ <strong>Fast</strong> UI with synchronized cards and keyboard shortcuts.</li>
            <li>✔️ <strong>Flexible display</strong>: precision slider + three number formats.</li>
            <li>✔️ <strong>Presets</strong> for common and extreme reference points.</li>
            <li>✔️ <strong>Absolute-zero guard</strong> to prevent invalid inputs.</li>
            <li>✔️ <strong>Copy/CSV</strong> for immediate reuse in spreadsheets and reports.</li>
            <li>✔️ <strong>Shareable URLs</strong> for consistent collaboration and bookmarks.</li>
          </ul>
        
          {/* ===== Tips ===== */}
          <h2 id="tips" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧭 Power Tips to Work Faster
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>When teaching, show both °C and °F plus K to reinforce offset vs. absolute scales.</li>
            <li>Use <strong>Compact</strong> format in dashboards; switch to <strong>Normal</strong> in exported PDFs.</li>
            <li>Pin your workflow by bookmarking the page — the URL preserves your last state.</li>
            <li>Append CSVs to your SOPs or lab notebooks for easy audits and change control.</li>
            <li>Lean on <strong>presets</strong> as sanity checks when validating custom readings.</li>
          </ul>
        
          {/* ===== Accessibility & Performance ===== */}
          <h2 id="accessibility" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ♿ Accessibility & Performance Considerations
          </h2>
          <p>
            The interface supports keyboard navigation, uses clear labels, and renders well on mobile and desktop. The dark theme
            improves contrast in low light. Alt text, ARIA-friendly labels, and consistent focus states help assistive technologies.
            Calculations are instantaneous, and lightweight preloads keep the UI snappy without unnecessary bloat.
          </p>
        
          {/* ===== FAQ ===== */}
          <section className="space-y-6 mt-16">
            <h2 id="faq" className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>
        
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q1: Which temperature scales are supported?</h3>
                <p>Celsius (°C), Fahrenheit (°F), and Kelvin (K).</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q2: What does the absolute-zero guard do?</h3>
                <p>
                  It warns if the input falls below physical limits for the chosen scale (below −273.15°C, −459.67°F, or 0 K),
                  helping you avoid invalid conversions.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q3: Can I export results?</h3>
                <p>
                  Yes. Click <strong>CSV</strong> to download your current values, or use <strong>Copy All</strong> to paste a human-readable summary into notes or chat.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q4: Why do my numbers auto-switch to scientific notation?</h3>
                <p>
                  To keep extreme magnitudes readable. You can also explicitly choose <em>Scientific</em> in the Format control.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q5: Do you store my data?</h3>
                <p>
                  No accounts are required; preferences live in the URL or your browser session. It’s fast and privacy-friendly.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q6: What’s the difference between temperature and heat?</h3>
                <p>
                  Temperature measures average molecular kinetic energy; heat is energy transfer due to temperature difference. This tool converts temperature units only.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q7: Do you account for wind chill or heat index?</h3>
                <p>
                  Not in this tool. Wind chill and heat index depend on humidity, wind speed, and exposure; they’re distinct from raw temperature conversion.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q8: Are there rounding rules I should follow?</h3>
                <p>
                  For public-facing content, 1–2 decimals are common. For technical use, keep higher precision internally and round in your final report.
                </p>
              </div>
            </div>
          </section>
        </section>
        
        {/* =================== AUTHOR & BACKLINK SECTION =================== */}
        <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
          <div className="flex items-center gap-3">
            <img
              src="/images/calculatorhub-author.webp"
              alt="CalculatorHub Tools Team"
              className="w-12 h-12 rounded-full border border-gray-600"
              loading="lazy"
            />
            <div>
              <p className="font-semibold text-white">Written by the CalculatorHub Tools Team</p>
              <p className="text-sm text-slate-400">
                Specialists in unit conversion and calculator UX. Last updated:{" "}
                <time dateTime="2025-11-09">November 9, 2025</time>.
              </p>
            </div>
          </div>
        
          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              🚀 Explore more tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <a
                href="/weight-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
              >
                <span className="text-indigo-400">⚖️</span> Weight Converter
              </a>
        
              <a
                href="/length-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-400 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
              >
                <span className="text-sky-400">📏</span> Length Converter
              </a>
        
              <a
                href="/area-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-pink-600/20 text-pink-300 hover:text-pink-400 px-3 py-2 rounded-md border border-slate-700 hover:border-pink-500 transition-all duration-200"
              >
                <span className="text-pink-400">📐</span> Area Converter
              </a>
            </div>
          </div>
        </section>


        {/* House ads + related tools */}
        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/temperature-converter" category="unit-converters" />
      </motion.div>
    </>
  );
}; 

export default TemperatureConverter;
 
