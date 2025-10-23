import React, { useEffect, useMemo, useRef, useState } from 'react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

/* ---------- Inline icons (typed, no deps) ---------- */
const Icon = {
  Swap: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M16 3l4 4-4 4M20 7H4" />
      <path d="M8 21l-4-4 4-4M4 17h16" />
    </svg>
  ),
  Star: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="currentColor">
      <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.401 8.168L12 18.896l-7.335 3.869 1.401-8.168L.132 9.21l8.2-1.192z" />
    </svg>
  ),
  StarOff: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="m18 6-6-4-6 4 2 7-5 5 7-1 2 7 2-7 7 1-5-5z" />
      <path d="M2 2l20 20" />
    </svg>
  ),
  Scale: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M7 4h10M12 4v16M5 20h14" />
      <path d="M7 7l-3 6a4 4 0 0 0 8 0l-3-6" />
      <path d="M17 7l-3 6a4 4 0 0 0 8 0l-3-6" />
    </svg>
  ),
  Copy: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Download: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  ),
};

/* ---------- Units (mass/weight) ----------
   Base unit: kilogram (kg)
   Factors convert target unit -> kilograms
*/
type Unit = { key: string; name: string; factor: number };

const WEIGHT_UNITS: Unit[] = [
  { key: 'microgram',  name: 'Microgram (µg)',     factor: 1e-9 },
  { key: 'milligram',  name: 'Milligram (mg)',     factor: 1e-6 },
  { key: 'gram',       name: 'Gram (g)',           factor: 1e-3 },
  { key: 'kilogram',   name: 'Kilogram (kg)',      factor: 1 },
  { key: 'tonne',      name: 'Tonne (t, metric)',  factor: 1000 },           // metric ton
  { key: 'ounce',      name: 'Ounce (oz)',         factor: 0.028349523125 }, // avoirdupois
  { key: 'pound',      name: 'Pound (lb)',         factor: 0.45359237 },
  { key: 'stone',      name: 'Stone (st)',         factor: 6.35029318 },
  { key: 'short_ton',  name: 'US Ton (short)',     factor: 907.18474 },      // 2000 lb
  { key: 'long_ton',   name: 'Imperial Ton (long)',factor: 1016.0469088 },   // 2240 lb
];

const unitMap: Record<string, Unit> = Object.fromEntries(WEIGHT_UNITS.map(u => [u.key, u])) as Record<string, Unit>;

const FORMAT_MODES = ['normal', 'compact', 'scientific'] as const;
type FormatMode = typeof FORMAT_MODES[number];

/* ---------- Safe browser/storage helpers ---------- */
const hasWindow = () => typeof window !== 'undefined';
function getStorage(): Storage | null {
  if (!hasWindow()) return null;
  try { localStorage.setItem('__chk', '1'); localStorage.removeItem('__chk'); return localStorage; } catch { return null; }
}
const storage = getStorage();
function useLocalStorage<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    if (!storage) return initial;
    try { const raw = storage.getItem(key); return raw ? (JSON.parse(raw) as T) : initial; } catch { return initial; }
  });
  useEffect(() => { if (storage) try { storage.setItem(key, JSON.stringify(state)); } catch {} }, [key, state]);
  return [state, setState] as const;
}

/* ---------- Math & formatting ---------- */
function convertLinear(value: number, fromKey: string, toKey: string) {
  const f = unitMap[fromKey], t = unitMap[toKey];
  if (!f || !t) return NaN;
  // Convert to base (kg) then to target
  return (value * f.factor) / t.factor;
}
function formatNumber(n: number, mode: FormatMode = 'normal', precision = 6) {
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

/* ---------- Component ---------- */
export default function WeightConverter() {
  // Core inputs
  const [valueStr, setValueStr] = useState<string>(''); // placeholder visible; empty = 0
  const [fromUnit, setFromUnit] = useState<string>('kilogram');
  const [toUnit, setToUnit] = useState<string>('pound');

  // Options
  const [precision, setPrecision] = useState<number>(6);
  const [formatMode, setFormatMode] = useState<FormatMode>('normal');

  // Personalization
  const [favorites, setFavorites] = useLocalStorage<string[]>('weight:favorites', ['kilogram','gram','pound','ounce']);
  const [history, setHistory] = useLocalStorage<Array<{v: string; from: string; to: string; ts: number}>>('weight:history', []);

  // Refs & shortcuts
  const valueRef = useRef<HTMLInputElement | null>(null);
  const fromRef = useRef<HTMLSelectElement | null>(null);
  const toRef = useRef<HTMLSelectElement | null>(null);

  // Parse numeric (commas allowed), empty -> 0
  const valueNum = useMemo<number>(() => {
    const clean = String(valueStr || '').replace(/,/g, '').trim();
    if (clean === '') return 0;
    const n = Number(clean);
    return Number.isFinite(n) ? n : 0;
  }, [valueStr]);

  // Direct result & grid
  const direct = useMemo<number>(() => convertLinear(valueNum, fromUnit, toUnit), [valueNum, fromUnit, toUnit]);
  const gridResults = useMemo<Record<string, number>>(() => {
    const base = valueNum * ((unitMap[fromUnit] && unitMap[fromUnit].factor) || 1);
    const out: Record<string, number> = {};
    for (const u of WEIGHT_UNITS) if (u.key !== fromUnit) out[u.key] = base / u.factor;
    return out;
  }, [valueNum, fromUnit]);

  /* ---------- URL sync ---------- */
  useEffect(() => {
    if (!hasWindow()) return;
    try {
      const p = new URLSearchParams(window.location.search);
      const v = p.get('v'); const f = p.get('from'); const t = p.get('to');
      const fmt = p.get('fmt'); const pr = p.get('p');
      if (v !== null) setValueStr(v);
      if (f && unitMap[f]) setFromUnit(f);
      if (t && unitMap[t]) setToUnit(t);
      if (fmt && (FORMAT_MODES as readonly string[]).includes(fmt)) setFormatMode(fmt as FormatMode);
      if (pr && !Number.isNaN(+pr)) setPrecision(Math.max(0, Math.min(12, +pr)));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!hasWindow()) return;
    try {
      const qs = new URLSearchParams();
      if (valueStr !== '') qs.set('v', valueStr);
      qs.set('from', fromUnit);
      qs.set('to', toUnit);
      qs.set('fmt', formatMode);
      qs.set('p', String(precision));
      window.history.replaceState(null, '', `${window.location.pathname}?${qs.toString()}`);
    } catch {}
  }, [valueStr, fromUnit, toUnit, formatMode, precision]);

  /* ---------- History ---------- */
  useEffect(() => {
    const e = { v: valueStr === '' ? '0' : valueStr, from: fromUnit, to: toUnit, ts: Date.now() };
    setHistory(prev => {
      const last = prev[0];
      if (last && last.v === e.v && last.from === e.from && last.to === e.to) return prev;
      return [e, ...prev].slice(0, 10);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueStr, fromUnit, toUnit]);

  /* ---------- Shortcuts ---------- */
  useEffect(() => {
    if (!hasWindow()) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target && (e.target as HTMLElement).tagName) || '';
      if (tag === 'INPUT' || tag === 'SELECT' || (e.target && (e.target as HTMLElement).isContentEditable)) return;
      if (e.key === '/') { e.preventDefault(); valueRef.current?.focus(); }
      if (e.key.toLowerCase() === 's') { e.preventDefault(); fromRef.current?.focus(); }
      if (e.key.toLowerCase() === 't') { e.preventDefault(); toRef.current?.focus(); }
      if (e.key.toLowerCase() === 'x') { e.preventDefault(); swapUnits(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ---------- Actions ---------- */
  function swapUnits() {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  }
  function toggleFavorite(k: string) {
    setFavorites(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k].slice(0, 5));
  }
  function copyAll() {
    const lines = Object.entries(gridResults).map(([k, v]) => {
      const label = unitMap[k].name;
      const formatted = formatNumber(v, formatMode, precision);
      return `${label}: ${formatted}`;
    }).join('\n');
    if (hasWindow() && navigator?.clipboard?.writeText) navigator.clipboard.writeText(lines).catch(()=>{});
  }
  function exportCSV() {
    const rows = [['Unit','Value'], ...Object.entries(gridResults).map(([k, v]) => [unitMap[k].name, String(v)])];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'weight-conversion.csv'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 500);
    } catch {}
  }

  const favored = WEIGHT_UNITS.filter(u => favorites.includes(u.key));
  const unfavored = WEIGHT_UNITS.filter(u => !favorites.includes(u.key));
  const hasInput = (valueStr || '').trim() !== '';

  return (
    <>
      <SEOHead
        title={seoData.weightConverter?.title || 'Weight Converter — CalculatorHub'}
        description={seoData.weightConverter?.description || 'Convert between kilograms, grams, pounds, ounces, and more.'}
        canonical="https://calculatorhub.site/weight-converter"
        schemaData={generateCalculatorSchema(
          'Weight Converter',
          seoData.weightConverter?.description || 'Convert between kilograms, grams, pounds, ounces, and more.',
          '/weight-converter',
          seoData.weightConverter?.keywords || ['weight converter','kg to lb','lb to kg','grams to ounces']
        )}
        breadcrumbs={[
          { name: 'Unit Converters', url: '/category/unit-converters' },
          { name: 'Weight Converter', url: '/weight-converter' },
        ]}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <div className="max-w-5xl mx-auto text-gray-200">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Weight Converter', url: '/weight-converter' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 rounded-2xl p-6 bg-gradient-to-r from-blue-900 via-indigo-800 to-purple-800 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">Weight Converter</h1>
          <p className="text-gray-300">
            Convert between kilograms, grams, pounds, ounces, stones, and tons.
            Empty input = <b>0</b>. Shortcuts: <kbd>/</kbd> value, <kbd>S</kbd> from, <kbd>T</kbd> to, <kbd>X</kbd> swap.
          </p>
        </div>

        {/* Controls */}
        <div className="rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Value */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Value</label>
              <div className="relative">
                <input
                  ref={valueRef}
                  type="text"
                  inputMode="decimal"
                  value={valueStr}
                  onChange={(e) => setValueStr(e.target.value)}
                  placeholder="Enter value (default 0)"
                  className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Enter value to convert"
                />
                <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                  {hasInput && (
                    <button
                      type="button"
                      onClick={() => setValueStr('')}
                      className="px-2 py-1 text-xs rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600"
                      title="Clear"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setValueStr('0')}
                    className="px-2 py-1 text-xs rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600"
                    title="Set 0"
                  >
                    0
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Commas allowed (e.g., 1,234.56). Empty counts as 0.</p>
            </div>

            {/* From */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">From</label>
              <select
                ref={fromRef}
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Select source unit"
              >
                {favored.length > 0 && (
                  <optgroup label="★ Favorites">
                    {favored.map(u => <option key={`f-${u.key}`} value={u.key}>{u.name}</option>)}
                  </optgroup>
                )}
                <optgroup label="All units">
                  {unfavored.map(u => <option key={`a-${u.key}`} value={u.key}>{u.name}</option>)}
                </optgroup>
              </select>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => toggleFavorite(fromUnit)}
                  className="text-xs px-2 py-1 rounded-lg bg-gray-800 border border-gray-600 hover:bg-gray-700 flex items-center gap-1"
                  title="Toggle favorite"
                >
                  {favorites.includes(fromUnit)
                    ? <Icon.Star style={{ width: 14, height: 14, color: '#facc15' }} />
                    : <Icon.StarOff style={{ width: 14, height: 14, color: '#9ca3af' }} />}
                  Fav
                </button>
              </div>
            </div>

            {/* To */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">To</label>
              <select
                ref={toRef}
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Select target unit"
              >
                {favored.length > 0 && (
                  <optgroup label="★ Favorites">
                    {favored.map(u => <option key={`tf-${u.key}`} value={u.key}>{u.name}</option>)}
                  </optgroup>
                )}
                <optgroup label="All units">
                  {unfavored.map(u => <option key={`ta-${u.key}`} value={u.key}>{u.name}</option>)}
                </optgroup>
              </select>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => toggleFavorite(toUnit)}
                  className="text-xs px-2 py-1 rounded-lg bg-gray-800 border border-gray-600 hover:bg-gray-700 flex items-center gap-1"
                  title="Toggle favorite"
                >
                  {favorites.includes(toUnit)
                    ? <Icon.Star style={{ width: 14, height: 14, color: '#facc15' }} />
                    : <Icon.StarOff style={{ width: 14, height: 14, color: '#9ca3af' }} />}
                  Fav
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              type="button"
              onClick={swapUnits}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 flex items-center gap-2"
              title="Swap From/To (X)"
              aria-label="Swap From and To units"
            >
              <Icon.Swap style={{ width: 16, height: 16 }} /> Swap
            </button>
          </div>

          {/* Result */}
          <div className="rounded-xl bg-gray-800 border border-gray-700 p-4 mb-6">
            <div className="text-sm text-gray-400 mb-1">
              Result ({unitMap[fromUnit]?.name} → {unitMap[toUnit]?.name})
            </div>
            <div
              className="text-2xl font-semibold text-gray-100 overflow-x-auto whitespace-nowrap"
              style={{ scrollbarWidth: 'thin' }}
              aria-live="polite"
            >
              {formatNumber(direct, formatMode, precision)}
            </div>
          </div>

          {/* More options */}
          <details className="mt-5">
            <summary className="cursor-pointer text-sm text-gray-300">More options</summary>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Precision</label>
                <input
                  type="range"
                  min={0}
                  max={12}
                  value={precision}
                  onChange={(e) => setPrecision(+e.target.value)}
                  className="w-full accent-blue-500"
                  aria-label="Decimal precision"
                />
                <div className="text-xs text-gray-400 mt-1">Decimals: {precision}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Format</label>
                <select
                  value={formatMode}
                  onChange={(e) => setFormatMode(e.target.value as FormatMode)}
                  className="w-full px-2 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100"
                >
                  <option value="normal">Normal</option>
                  <option value="compact">Compact</option>
                  <option value="scientific">Scientific</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={copyAll}
                  className="px-3 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-200 hover:bg-gray-700 flex items-center gap-2 w-full justify-center"
                  title="Copy grid values"
                >
                  <Icon.Copy style={{ width: 16, height: 16 }} /> Copy All
                </button>
                <button
                  onClick={exportCSV}
                  className="px-3 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-200 hover:bg-gray-700 flex items-center gap-2 w-full justify-center"
                  title="Download as CSV"
                >
                  <Icon.Download style={{ width: 16, height: 16 }} /> CSV
                </button>
              </div>
            </div>
          </details>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-md mb-8">
            <h2 className="text-xl font-semibold text-white mb-3">Recent</h2>
            <div className="flex flex-wrap gap-2">
              {history.map((h, i) => (
                <button
                  key={i}
                  className="px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm"
                  title={`${h.v} ${h.from} → ${h.to}`}
                  onClick={() => { setValueStr(h.v); setFromUnit(h.from); setToUnit(h.to); }}
                >
                  {(h.v || '0')} {h.from} → {h.to}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All Units grid */}
        <div className="rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-md mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">All Units</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {WEIGHT_UNITS.map((u) => {
              if (u.key === fromUnit) return null;
              const val = gridResults[u.key];
              const display = formatNumber(val ?? 0, formatMode, precision);
              return (
                <div key={u.key} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:bg-gray-700/70 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon.Scale style={{ width: 16, height: 16, color: '#60a5fa' }} />
                      <span className="text-sm font-medium text-gray-200 truncate">{u.name}</span>
                    </div>
                    <button
                      type="button"
                      className="text-xs px-2 py-1 border border-gray-600 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200"
                      onClick={() => {
                        if (hasWindow() && navigator?.clipboard?.writeText && Number.isFinite(val)) {
                          navigator.clipboard.writeText(String(val)).catch(()=>{});
                        }
                      }}
                      title="Copy exact value"
                    >
                      Copy
                    </button>
                  </div>
                  <div
                    className="text-lg font-semibold text-gray-100 overflow-x-auto whitespace-nowrap"
                    style={{ scrollbarWidth: 'thin' }}
                    title={String(val ?? '')}
                  >
                    {display}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/weight-converter" category="unit-converters" />
      </div>
    </>
  );
}
