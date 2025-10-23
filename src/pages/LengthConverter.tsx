import React, { useEffect, useMemo, useRef, useState } from 'react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

/* ---------- Small inline icons (no extra deps) ---------- */
const Icon = {
  Swap: (p) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 3l4 4-4 4M20 7H4" /><path d="M8 21l-4-4 4-4M4 17h16" />
    </svg>
  ),
  Copy: (p) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Download: (p) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" />
    </svg>
  ),
  Star: (p) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="currentColor">
      <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.401 8.168L12 18.896l-7.335 3.869 1.401-8.168L.132 9.21l8.2-1.192z" />
    </svg>
  ),
  StarOff: (p) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m18 6-6-4-6 4 2 7-5 5 7-1 2 7 2-7 7 1-5-5z" />
      <path d="M2 2l20 20" />
    </svg>
  ),
};

/* ---------- Units ---------- */
const UNITS = [
  { key: 'nanometer',   name: 'Nanometer (nm)',     factor: 1e-9 },
  { key: 'micrometer',  name: 'Micrometer (µm)',    factor: 1e-6 },
  { key: 'millimeter',  name: 'Millimeter (mm)',    factor: 1e-3 },
  { key: 'centimeter',  name: 'Centimeter (cm)',    factor: 1e-2 },
  { key: 'meter',       name: 'Meter (m)',          factor: 1 },
  { key: 'kilometer',   name: 'Kilometer (km)',     factor: 1e3 },
  { key: 'inch',        name: 'Inch (in)',          factor: 0.0254 },
  { key: 'foot',        name: 'Foot (ft)',          factor: 0.3048 },
  { key: 'yard',        name: 'Yard (yd)',          factor: 0.9144 },
  { key: 'mile',        name: 'Mile (mi)',          factor: 1609.344 },
];
const unitMap = Object.fromEntries(UNITS.map(u => [u.key, u]));
const FORMAT_MODES = ['normal', 'compact', 'scientific'];

/* ---------- Safe helpers ---------- */
const hasWindow = () => typeof window !== 'undefined';
function getStorage() {
  if (!hasWindow()) return null;
  try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return localStorage; } catch { return null; }
}
const storage = getStorage();
function useLocalStorage(key, initial) {
  const [state, setState] = useState(() => {
    if (!storage) return initial;
    try { const raw = storage.getItem(key); return raw ? JSON.parse(raw) : initial; } catch { return initial; }
  });
  useEffect(() => { if (storage) try { storage.setItem(key, JSON.stringify(state)); } catch {} }, [key, state]);
  return [state, setState];
}

/* ---------- Math & formatting ---------- */
function convert(value, fromKey, toKey) {
  const f = unitMap[fromKey], t = unitMap[toKey];
  if (!f || !t) return NaN;
  return (value * f.factor) / t.factor;
}
function formatNumber(n, mode = 'normal', precision = 6) {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (mode === 'scientific' || (mode === 'normal' && (abs >= 1e12 || (abs !== 0 && abs < 1e-6)))) {
    const p = Math.max(0, Math.min(12, precision));
    return n.toExponential(p).replace(/(?:\.?0+)(e[+-]?\d+)$/i, '$1');
    }
  const opts = mode === 'compact'
    ? { notation: 'compact', maximumFractionDigits: Math.min(precision, 6) }
    : { maximumFractionDigits: precision };
  const s = new Intl.NumberFormat(undefined, opts).format(n);
  return mode === 'compact'
    ? s
    : s.replace(/([.,]\d*?[1-9])0+$/, '$1').replace(/([.,])0+$/, '');
}

/* ---------- Component ---------- */
export default function LengthConverter() {
  // Simple main inputs
  const [valueStr, setValueStr] = useState('');
  const [fromUnit, setFromUnit] = useState('meter');
  const [toUnit, setToUnit] = useState('inch');

  // Options (collapsed by default)
  const [showOptions, setShowOptions] = useState(false);
  const [precision, setPrecision] = useState(6);
  const [formatMode, setFormatMode] = useState('normal');

  // Personalization
  const [favorites, setFavorites] = useLocalStorage('length:favorites', ['meter','centimeter','inch','foot']);
  const [history, setHistory] = useLocalStorage('length:history', []); // {v, from, to, ts}

  const valueRef = useRef(null);
  const fromRef = useRef(null);
  const toRef = useRef(null);

  // Parse number; empty = 0 (shows placeholder)
  const valueNum = useMemo(() => {
    const clean = String(valueStr).replace(/,/g, '').trim();
    if (clean === '') return 0;
    const n = Number(clean);
    return Number.isFinite(n) ? n : 0;
  }, [valueStr]);

  // Main result and “all results” (list)
  const result = useMemo(() => convert(valueNum, fromUnit, toUnit), [valueNum, fromUnit, toUnit]);
  const allResults = useMemo(() => {
    const base = valueNum * (unitMap[fromUnit]?.factor || 1);
    const out = {};
    for (const u of UNITS) if (u.key !== fromUnit) out[u.key] = base / u.factor;
    return out;
  }, [valueNum, fromUnit]);

  /* ---------- Shareable URL ---------- */
  useEffect(() => {
    if (!hasWindow()) return;
    try {
      const p = new URLSearchParams(window.location.search);
      const v = p.get('v'); const f = p.get('from'); const t = p.get('to');
      const fmt = p.get('fmt'); const pr = p.get('p');
      if (v !== null) setValueStr(v);
      if (f && unitMap[f]) setFromUnit(f);
      if (t && unitMap[t]) setToUnit(t);
      if (fmt && FORMAT_MODES.includes(fmt)) setFormatMode(fmt);
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

  /* ---------- Simple actions ---------- */
  const swap = () => { setFromUnit(toUnit); setToUnit(fromUnit); };
  const toggleFavorite = (k) => setFavorites(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k].slice(0,5));
  const copyAll = () => {
    const text = Object.entries(allResults).map(([k, v]) => `${unitMap[k].name}: ${v}`).join('\n');
    if (hasWindow() && navigator?.clipboard?.writeText) navigator.clipboard.writeText(text).catch(()=>{});
  };
  const exportCSV = () => {
    const rows = [['Unit', 'Value'], ...Object.entries(allResults).map(([k, v]) => [unitMap[k].name, String(v)])];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'length-conversion.csv'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 500);
    } catch {}
  };

  // Dropdown groups (Favorites first)
  const favored = UNITS.filter(u => favorites.includes(u.key));
  const others = UNITS.filter(u => !favorites.includes(u.key));
  const hasInput = (valueStr || '').trim() !== '';

  return (
    <>
      <SEOHead
        title={seoData.lengthConverter.title}
        description={seoData.lengthConverter.description}
        canonical="https://calculatorhub.site/length-converter"
        schemaData={generateCalculatorSchema(
          'Length Converter',
          seoData.lengthConverter.description,
          '/length-converter',
          seoData.lengthConverter.keywords
        )}
        breadcrumbs={[
          { name: 'Unit Converters', url: '/category/unit-converters' },
          { name: 'Length Converter', url: '/length-converter' },
        ]}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <div className="max-w-4xl mx-auto text-gray-200">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Length Converter', url: '/length-converter' },
          ]}
        />

        {/* Simple header */}
        <div className="mb-6 rounded-2xl p-5 bg-gradient-to-r from-blue-900 via-indigo-800 to-purple-800 border border-gray-700">
          <h1 className="text-2xl font-semibold text-white">Length Converter</h1>
          <p className="text-gray-300 mt-1">Type a number, choose units, get the answer. Empty input = <b>0</b>.</p>
        </div>

        {/* Main card */}
        <div className="rounded-2xl border border-gray-700 bg-gray-900 p-5 shadow mb-6">
          {/* Value + Units in one simple row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-1">Value</label>
              <input
                ref={valueRef}
                type="text"
                inputMode="decimal"
                value={valueStr}
                onChange={(e) => setValueStr(e.target.value)}
                placeholder="Enter value (default 0)"
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Value"
              />
              <div className="flex gap-2 mt-2">
                {hasInput && (
                  <button onClick={() => setValueStr('')} className="px-3 py-1 text-xs rounded-lg bg-gray-800 border border-gray-600 hover:bg-gray-700">
                    Clear
                  </button>
                )}
                <button onClick={() => setValueStr('0')} className="px-3 py-1 text-xs rounded-lg bg-gray-800 border border-gray-600 hover:bg-gray-700">
                  Set 0
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">From</label>
              <select
                ref={fromRef}
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="From unit"
              >
                {favored.length > 0 && (
                  <optgroup label="★ Favorites">
                    {favored.map(u => <option key={'f-'+u.key} value={u.key}>{u.name}</option>)}
                  </optgroup>
                )}
                <optgroup label="All units">
                  {others.map(u => <option key={u.key} value={u.key}>{u.name}</option>)}
                </optgroup>
              </select>
              <button
                onClick={() => toggleFavorite(fromUnit)}
                className="mt-2 text-xs px-3 py-1 rounded-lg bg-gray-800 border border-gray-600 hover:bg-gray-700 flex items-center gap-2"
                title="Toggle favorite">
                {favorites.includes(fromUnit)
                  ? <Icon.Star style={{ width: 14, height: 14, color: '#facc15' }} />
                  : <Icon.StarOff style={{ width: 14, height: 14, color: '#9ca3af' }} />}
                Favorite
              </button>
            </div>

            <div className="flex justify-center md:justify-start">
              <button
                onClick={swap}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 h-fit"
                title="Swap">
                <span className="inline-flex items-center gap-2"><Icon.Swap style={{ width: 16, height: 16 }} /> Swap</span>
              </button>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">To</label>
              <select
                ref={toRef}
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="To unit"
              >
                {favored.length > 0 && (
                  <optgroup label="★ Favorites">
                    {favored.map(u => <option key={'tf-'+u.key} value={u.key}>{u.name}</option>)}
                  </optgroup>
                )}
                <optgroup label="All units">
                  {others.map(u => <option key={'ta-'+u.key} value={u.key}>{u.name}</option>)}
                </optgroup>
              </select>
              <button
                onClick={() => toggleFavorite(toUnit)}
                className="mt-2 text-xs px-3 py-1 rounded-lg bg-gray-800 border border-gray-600 hover:bg-gray-700 flex items-center gap-2"
                title="Toggle favorite">
                {favorites.includes(toUnit)
                  ? <Icon.Star style={{ width: 14, height: 14, color: '#facc15' }} />
                  : <Icon.StarOff style={{ width: 14, height: 14, color: '#9ca3af' }} />}
                Favorite
              </button>
            </div>
          </div>

          {/* Big, simple result */}
          <div className="mt-5 rounded-xl bg-gray-800 border border-gray-700 p-4">
            <div className="text-sm text-gray-400 mb-1">
              Result: {unitMap[fromUnit]?.name} → {unitMap[toUnit]?.name}
            </div>
            <div className="text-2xl font-semibold text-gray-100 overflow-x-auto whitespace-nowrap" style={{ scrollbarWidth: 'thin' }} aria-live="polite">
              {formatNumber(result, formatMode, precision)}
            </div>
          </div>

          {/* More options (collapsible) */}
          <details className="mt-5">
            <summary className="cursor-pointer text-sm text-gray-300">More options</summary>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Precision</label>
                <input type="range" min={0} max={12} value={precision} onChange={(e) => setPrecision(+e.target.value)} className="w-full accent-blue-500" />
                <div className="text-xs text-gray-400 mt-1">Decimals: {precision}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Format</label>
                <select value={formatMode} onChange={(e) => setFormatMode(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100">
                  <option value="normal">Normal</option>
                  <option value="compact">Compact</option>
                  <option value="scientific">Scientific</option>
                </select>
                <div className="text-xs text-gray-400 mt-1">Normal auto-switches to scientific for extreme values.</div>
              </div>
              <div className="flex items-end gap-2">
                <button onClick={copyAll} className="px-3 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-200 hover:bg-gray-700 flex items-center gap-2 w-full justify-center">
                  <Icon.Copy style={{ width: 16, height: 16 }} /> Copy All
                </button>
                <button onClick={exportCSV} className="px-3 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-200 hover:bg-gray-700 flex items-center gap-2 w-full justify-center">
                  <Icon.Download style={{ width: 16, height: 16 }} /> CSV
                </button>
              </div>
            </div>
          </details>
        </div>

        {/* Recent history */}
        {history.length > 0 && (
          <div className="rounded-2xl border border-gray-700 bg-gray-900 p-5 shadow mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Recent</h2>
            <div className="flex flex-wrap gap-2">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => { setValueStr(h.v); setFromUnit(h.from); setToUnit(h.to); }}
                  className="px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm"
                  title={`${h.v} ${h.from} → ${h.to}`}
                >
                  {h.v || '0'} {h.from} → {h.to}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Simple list of all results (no cards, easy to scan) */}
        <div className="rounded-2xl border border-gray-700 bg-gray-900 p-5 shadow mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">All units (from {unitMap[fromUnit]?.name})</h2>
          <ul className="divide-y divide-gray-800">
            {UNITS.filter(u => u.key !== fromUnit).map((u) => {
              const v = allResults[u.key] ?? 0;
              return (
                <li key={u.key} className="py-2 flex items-center justify-between">
                  <span className="text-gray-300">{u.name}</span>
                  <span className="text-gray-100 font-medium overflow-x-auto whitespace-nowrap" style={{ scrollbarWidth: 'thin' }} title={String(v)}>
                    {formatNumber(v, formatMode, precision)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/length-converter" category="unit-converters" />
      </div>
    </>
  );
}
