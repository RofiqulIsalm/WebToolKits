import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Thermometer, Copy, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

/* ---------- Scales ---------- */
type Scale = 'C' | 'F' | 'K';
const SCALE_LABEL: Record<Scale, string> = { C: 'Celsius (°C)', F: 'Fahrenheit (°F)', K: 'Kelvin (K)' };

const FORMAT_MODES = ['normal', 'compact', 'scientific'] as const;
type FormatMode = typeof FORMAT_MODES[number];

/* ---------- Visual thresholds (°C) ---------- */
const HOT_THRESHOLD_C = 40;   // tweak to taste
const COLD_THRESHOLD_C = 0;   // tweak to taste


/* ---------- Conversion helpers ---------- */
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

/* ---------- Simple animation helpers ---------- */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut', delay }
});
const softHover = { whileHover: { y: -2, scale: 1.01 }, whileTap: { scale: 0.98 } };

const heatState: 'hot' | 'cold' | 'normal' =
  !Number.isFinite(celsius)
    ? 'normal'
    : celsius >= HOT_THRESHOLD_C
      ? 'hot'
      : celsius <= COLD_THRESHOLD_C
        ? 'cold'
        : 'normal';


const TemperatureConverter: React.FC = () => {
  // main state
  const [valueStr, setValueStr] = useState<string>('20');
  const [scale, setScale] = useState<Scale>('C');
  const [precision, setPrecision] = useState<number>(4);
  const [formatMode, setFormatMode] = useState<FormatMode>('normal');

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
  const fahrenheit = useMemo(() => fromCelsius(celsius, 'F'), [celsius]);
  const kelvin = useMemo(() => fromCelsius(celsius, 'K'), [celsius]);

  const display = {
    C: formatNumber(celsius, formatMode, precision),
    F: formatNumber(fahrenheit, formatMode, precision),
    K: formatNumber(kelvin, formatMode, precision),
  };

  // absolute zero check
  const belowAbsoluteZero =
    (scale === 'C' && valueNum < -273.15) ||
    (scale === 'F' && valueNum < -459.67) ||
    (scale === 'K' && valueNum < 0);

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

  /* ---------- Presets ---------- */
  const [showPresets, setShowPresets] = useState(false);
  const applyPreset = (c: number) => { setScale('C'); setValueStr(String(c)); };

  /* ---------- Actions ---------- */
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

      <motion.div
        className="max-w-5xl mx-auto text-gray-200"
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
          className="mb-8 rounded-2xl p-6 bg-gradient-to-r from-blue-900 via-indigo-800 to-purple-800 border border-gray-700"
          {...fadeUp(0.05)}
        >
          <h1 className="text-3xl font-bold text-white mb-2">Temperature Converter</h1>
          <p className="text-gray-300">
            Convert between <b>Celsius</b>, <b>Fahrenheit</b>, and <b>Kelvin</b>. Shortcuts: <kbd>/</kbd> focus, <kbd>P</kbd> presets, <kbd>C</kbd> copy.
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          className="rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow mb-8"
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
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-[box-shadow] duration-200 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.25)]"
                aria-label="Enter temperature"
              />
              <p className="text-xs text-gray-500 mt-1">Commas allowed (1,234.5). Empty counts as 0.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Scale</label>
              <select
                value={scale}
                onChange={(e) => setScale(e.target.value as Scale)}
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100"
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
              className="px-3 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-200"
              title="Show presets (P)"
              {...softHover}
            >
              Presets
            </motion.button>
            <motion.button
              onClick={copyAll}
              className="px-3 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-200 flex items-center gap-2"
              title="Copy results (C)"
              {...softHover}
            >
              <Copy size={16} /> Copy All
            </motion.button>
            <motion.button
              onClick={exportCSV}
              className="px-3 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-200 flex items-center gap-2"
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
                    className="px-3 py-1.5 rounded-full bg-gray-800 border border-gray-600 text-gray-300 text-sm"
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

        {/* Colored result cards (staggered) */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06 } }
          }}
        >
          {/* Celsius */}
          <motion.div
            className="rounded-xl p-6 border bg-gradient-to-br from-blue-950 to-blue-900 border-blue-800"
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            {...softHover}
          >
            <div className="flex items-center gap-2 mb-4">
              <Thermometer className="h-5 w-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Celsius (°C)</h3>
            </div>
            <div className="text-3xl font-semibold text-blue-50">
              <AnimatePresence mode="wait">
                <motion.span
                  key={display.C}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {display.C}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className="mt-2 text-sm text-blue-300/80">Input converted to °C</div>
          </motion.div>

          {/* Fahrenheit */}
          <motion.div
            className="rounded-xl p-6 border bg-gradient-to-br from-rose-950 to-rose-900 border-rose-800"
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            {...softHover}
          >
            <div className="flex items-center gap-2 mb-4">
              <Thermometer className="h-5 w-5 text-rose-400" />
              <h3 className="text-lg font-semibold text-white">Fahrenheit (°F)</h3>
            </div>
            <div className="text-3xl font-semibold text-rose-50">
              <AnimatePresence mode="wait">
                <motion.span
                  key={display.F}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {display.F}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className="mt-2 text-sm text-rose-300/80">Input converted to °F</div>
          </motion.div>

          {/* Kelvin */}
          <motion.div
            className="rounded-xl p-6 border bg-gradient-to-br from-violet-950 to-violet-900 border-violet-800"
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            {...softHover}
          >
            <div className="flex items-center gap-2 mb-4">
              <Thermometer className="h-5 w-5 text-violet-400" />
              <h3 className="text-lg font-semibold text-white">Kelvin (K)</h3>
            </div>
            <div className="text-3xl font-semibold text-violet-50">
              <AnimatePresence mode="wait">
                <motion.span
                  key={display.K}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {display.K}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className="mt-2 text-sm text-violet-300/80">Input converted to K</div>
          </motion.div>
        </motion.div>

        <motion.div {...fadeUp(0.1)} className="rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow mb-8">
          <h4 className="font-semibold text-white mb-3">Quick Reference</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-lg p-4 bg-blue-950/50 border border-blue-900"> 
              <div className="text-blue-200/90 font-medium mb-1">Water freezes</div>
              <div className="text-gray-200">0°C = 32°F = 273.15K</div>
            </div>
            <div className="rounded-lg p-4 bg-rose-950/50 border border-rose-900">
              <div className="text-rose-200/90 font-medium mb-1">Room temperature</div>
              <div className="text-gray-200">20°C = 68°F = 293.15K</div>
            </div>
            <div className="rounded-lg p-4 bg-violet-950/50 border border-violet-900">
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
