import React, { useEffect, useMemo, useRef, useState } from 'react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

/* ---------------- Icons (inline, no deps) ---------------- */
const Icon = {
  Network: (p: any) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="5" cy="12" r="3" />
      <circle cx="19" cy="5" r="3" />
      <circle cx="19" cy="19" r="3" />
      <path d="M7.6 10.5 16.4 6.5M7.6 13.5l8.8 4" />
    </svg>
  ),
  Star: (p: any) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="currentColor">
      <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.401 8.168L12 18.896l-7.335 3.869 1.401-8.168L.132 9.21l8.2-1.192z" />
    </svg>
  ),
  Swap: (p: any) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 3l4 4-4 4M20 7H4" /><path d="M8 21l-4-4 4-4M4 17h16" />
    </svg>
  ),
  Copy: (p: any) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Download: (p: any) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" />
    </svg>
  ),
};

/* ---------------- Units (base is bps) ----------------
   SI:  k = 1e3,  M = 1e6,  G = 1e9,  T = 1e12
   Binary: Ki = 2^10, Mi = 2^20, Gi = 2^30, Ti = 2^40
   Byte = 8 bits
--------------------------------------------------------*/
type UnitKey =
  | 'bps' | 'Kbps' | 'Mbps' | 'Gbps' | 'Tbps'
  | 'B/s' | 'KB/s' | 'MB/s' | 'GB/s' | 'TB/s'
  | 'Kibps' | 'Mibps' | 'Gibps' | 'Tibps'
  | 'KiB/s' | 'MiB/s' | 'GiB/s' | 'TiB/s';

type UnitDef = { key: UnitKey; name: string; factorBps: number; family: 'SI'|'Binary'|'SI-Byte'|'Binary-Byte' };

const K = 1e3, M = 1e6, G = 1e9, T = 1e12;
const Ki = 1024, Mi = 1024**2, Gi = 1024**3, Ti = 1024**4;

const UNITS: UnitDef[] = [
  // SI bits
  { key: 'bps',  name: 'bit per second (bit/s)',         factorBps: 1,        family: 'SI' },
  { key: 'Kbps', name: 'kilobit per second (kb/s)',      factorBps: K,        family: 'SI' },
  { key: 'Mbps', name: 'megabit per second (Mb/s)',      factorBps: M,        family: 'SI' },
  { key: 'Gbps', name: 'gigabit per second (Gb/s)',      factorBps: G,        family: 'SI' },
  { key: 'Tbps', name: 'terabit per second (Tb/s)',      factorBps: T,        family: 'SI' },

  // SI bytes
  { key: 'B/s',  name: 'byte per second (B/s)',          factorBps: 8,        family: 'SI-Byte' },
  { key: 'KB/s', name: 'kilobyte per second (kB/s)',     factorBps: 8*K,      family: 'SI-Byte' },
  { key: 'MB/s', name: 'megabyte per second (MB/s)',     factorBps: 8*M,      family: 'SI-Byte' },
  { key: 'GB/s', name: 'gigabyte per second (GB/s)',     factorBps: 8*G,      family: 'SI-Byte' },
  { key: 'TB/s', name: 'terabyte per second (TB/s)',     factorBps: 8*T,      family: 'SI-Byte' },

  // Binary bits
  { key: 'Kibps', name: 'kibibit per second (Kib/s)',    factorBps: Ki,       family: 'Binary' },
  { key: 'Mibps', name: 'mebibit per second (Mib/s)',    factorBps: Mi,       family: 'Binary' },
  { key: 'Gibps', name: 'gibibit per second (Gib/s)',    factorBps: Gi,       family: 'Binary' },
  { key: 'Tibps', name: 'tebibit per second (Tib/s)',    factorBps: Ti,       family: 'Binary' },

  // Binary bytes
  { key: 'KiB/s', name: 'kibibyte per second (KiB/s)',   factorBps: 8*Ki,     family: 'Binary-Byte' },
  { key: 'MiB/s', name: 'mebibyte per second (MiB/s)',   factorBps: 8*Mi,     family: 'Binary-Byte' },
  { key: 'GiB/s', name: 'gibibyte per second (GiB/s)',   factorBps: 8*Gi,     family: 'Binary-Byte' },
  { key: 'TiB/s', name: 'tebibyte per second (TiB/s)',   factorBps: 8*Ti,     family: 'Binary-Byte' },
];

const unitMap = Object.fromEntries(UNITS.map(u => [u.key, u]));
const FORMAT_MODES = ['normal', 'compact', 'scientific'] as const;

/* ---------------- Safe storage helpers ---------------- */
function hasWindow() { return typeof window !== 'undefined'; }
function getStorage() {
  if (!hasWindow()) return null;
  try { const s = window.localStorage; const t='__chk__'; s.setItem(t,'1'); s.removeItem(t); return s; }
  catch { return null; }
}
const storage = getStorage();
function useLocalStorage<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    if (!storage) return initial;
    try { const raw = storage.getItem(key); return raw ? JSON.parse(raw) as T : initial; }
    catch { return initial; }
  });
  useEffect(() => { if (storage) { try { storage.setItem(key, JSON.stringify(state)); } catch {} } }, [key, state]);
  return [state, setState] as const;
}

/* ---------------- Math & formatting ---------------- */
function toBps(value: number, from: UnitKey): number {
  const u = unitMap[from] as UnitDef; if (!u) return NaN;
  return value * u.factorBps;
}
function fromBps(bps: number, to: UnitKey): number {
  const u = unitMap[to] as UnitDef; if (!u) return NaN;
  return bps / u.factorBps;
}
function formatNumber(n: number, mode: typeof FORMAT_MODES[number] = 'normal', precision = 6) {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (mode === 'scientific' || (mode === 'normal' && (abs >= 1e12 || (abs !== 0 && abs < 1e-6)))) {
    const p = Math.max(0, Math.min(12, precision));
    return n.toExponential(p).replace(/(?:\.?0+)(e[+-]?\d+)$/i, '$1');
  }
  const opts: Intl.NumberFormatOptions = mode === 'compact'
    ? { notation: 'compact', maximumFractionDigits: Math.min(precision, 6) }
    : { maximumFractionDigits: precision };
  const s = new Intl.NumberFormat(undefined, opts).format(n);
  return mode === 'compact' ? s : s.replace(/([.,]\d*?[1-9])0+$/, '$1').replace(/([.,])0+$/, '');
}

/* ---------------- Component ---------------- */
export default function DataTransferConverter() {
  const [valueStr, setValueStr] = useState('100');           // e.g., 100 MB/s → ~800 Mbps
  const [fromUnit, setFromUnit] = useState<UnitKey>('MB/s');
  const [toUnit, setToUnit] = useState<UnitKey>('Mbps');
  const [formatMode, setFormatMode] = useState<typeof FORMAT_MODES[number]>('normal');
  const [precision, setPrecision] = useState(6);
  const [favorites, setFavorites] = useLocalStorage<UnitKey[]>('datarate:favorites',
    ['Mbps','MB/s','Gbps','GiB/s','Kbps','KiB/s']
  );
  const [history, setHistory] = useLocalStorage<any[]>('datarate:history', []);

  const valueRef = useRef<HTMLInputElement | null>(null);
  const fromRef = useRef<HTMLSelectElement | null>(null);
  const toRef = useRef<HTMLSelectElement | null>(null);

  // Parse safely (allow commas). Empty → 0
  const valueNum = useMemo(() => {
    const clean = String(valueStr || '').replace(/,/g, '').trim();
    if (clean === '') return 0;
    const n = Number(clean);
    return Number.isFinite(n) ? n : 0;
  }, [valueStr]);

  // Direct conversion + grid
  const baseBps = useMemo(() => toBps(valueNum, fromUnit), [valueNum, fromUnit]);
  const direct = useMemo(() => fromBps(baseBps, toUnit), [baseBps, toUnit]);
  const gridResults = useMemo(() => {
    const out: Record<UnitKey, number> = {} as any;
    for (const u of UNITS) if (u.key !== fromUnit) out[u.key as UnitKey] = fromBps(baseBps, u.key as UnitKey);
    return out;
  }, [baseBps, fromUnit]);

  /* ---------- URL sync ---------- */
  useEffect(() => {
    if (!hasWindow()) return;
    try {
      const usp = new URLSearchParams(window.location.search);
      const v = usp.get('v'); const f = usp.get('from') as UnitKey|null; const t = usp.get('to') as UnitKey|null;
      const fmt = usp.get('fmt'); const p = usp.get('p');
      if (v !== null) setValueStr(v);
      if (f && unitMap[f]) setFromUnit(f);
      if (t && unitMap[t]) setToUnit(t);
      if (fmt && (FORMAT_MODES as readonly string[]).includes(fmt as any)) setFormatMode(fmt as any);
      if (p && !Number.isNaN(+p)) setPrecision(Math.max(0, Math.min(12, +p)));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!hasWindow()) return;
    try {
      const usp = new URLSearchParams();
      if (valueStr !== '') usp.set('v', valueStr);
      usp.set('from', fromUnit);
      usp.set('to', toUnit);
      usp.set('fmt', formatMode);
      usp.set('p', String(precision));
      window.history.replaceState(null, '', `${window.location.pathname}?${usp.toString()}`);
    } catch {}
  }, [valueStr, fromUnit, toUnit, formatMode, precision]);

  /* ---------- History ---------- */
  useEffect(() => {
    const entry = { v: valueStr === '' ? '0' : valueStr, from: fromUnit, to: toUnit, ts: Date.now() };
    setHistory(prev => {
      const last = prev?.[0];
      if (last && last.v === entry.v && last.from === entry.from && last.to === entry.to) return prev;
      return [entry, ...(prev || [])].slice(0, 10);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueStr, fromUnit, toUnit]);

  /* ---------- Shortcuts ---------- */
  useEffect(() => {
    if (!hasWindow()) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName || '';
      if (tag === 'INPUT' || tag === 'SELECT' || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === '/') { e.preventDefault(); valueRef.current?.focus?.(); }
      if (e.key.toLowerCase() === 's') { e.preventDefault(); fromRef.current?.focus?.(); }
      if (e.key.toLowerCase() === 't') { e.preventDefault(); toRef.current?.focus?.(); }
      if (e.key.toLowerCase() === 'x') { e.preventDefault(); swapUnits(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ---------- Actions ---------- */
  function toggleFavorite(k: UnitKey) {
    setFavorites(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k].slice(0, 10));
  }
  function swapUnits() {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  }
  function copyAll() {
    const lines = Object.entries(gridResults).map(([k, v]) => `${unitMap[k as UnitKey].name}: ${v}`).join('\n');
    if (hasWindow() && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(lines).catch(() => {});
    }
  }
  function exportCSV() {
    const headers = ['Unit','Value'];
    const rows = Object.entries(gridResults).map(([k, v]) => [unitMap[k as UnitKey].name, String(v)]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = (hasWindow() && URL?.createObjectURL) ? URL.createObjectURL(blob) : null;
      if (url && hasWindow()) {
        const a = document.createElement('a');
        a.href = url; a.download = 'data-transfer-conversion.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
      }
    } catch {}
  }

  const favored = UNITS.filter(u => favorites.includes(u.key as UnitKey));
  const unfavored = UNITS.filter(u => !favorites.includes(u.key as UnitKey));
  const hasInput = (valueStr || '').trim() !== '';

  return (
    <>
      <SEOHead
        title={seoData.dataTransferConverter?.title ?? 'Data Transfer Converter'}
        description={seoData.dataTransferConverter?.description ?? 'Convert between bps, Kbps, Mbps, Gbps, Tbps and B/s, KB/s, MB/s, GB/s, TB/s plus binary KiB/s, MiB/s, etc.'}
        canonical="https://calculatorhub.site/data-transfer-converter"
        schemaData={generateCalculatorSchema(
          'Data Transfer Converter',
          seoData.dataTransferConverter?.description ?? 'Convert between SI/binary bit and byte rates.',
          '/data-transfer-converter',
          seoData.dataTransferConverter?.keywords ?? ['data transfer rate','Mbps to MB/s','Gbps to GiB/s','Kibps to Kbps']
        )}
        breadcrumbs={[
          { name: 'Unit Converters', url: '/category/unit-converters' },
          { name: 'Data Transfer Converter', url: '/data-transfer-converter' },
        ]}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <div className="max-w-5xl mx-auto text-gray-200">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Data Transfer Converter', url: '/data-transfer-converter' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 rounded-2xl p-6 bg-gradient-to-r from-cyan-900 via-sky-900 to-blue-900 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">Data Transfer Converter (Advanced)</h1>
          <p className="text-gray-300">
            SI & Binary · Bits & Bytes. Quick compare between networking Mbps and storage MB/s.
            <span className="ml-2 text-gray-400">Shortcuts: <kbd>/</kbd> value, <kbd>S</kbd> from, <kbd>T</kbd> to, <kbd>X</kbd> swap.</span>
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
                  className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  aria-label="Enter data rate value"
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
              <p className="text-xs text-gray-500 mt-1">Empty counts as 0. Commas allowed (1,234.56).</p>
            </div>

            {/* From */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">From</label>
              <select
                ref={fromRef}
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value as UnitKey)}
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                {favored.length > 0 && (
                  <optgroup label="★ Favorites">
                    {favored.map(u => <option key={'f-'+u.key} value={u.key}>{u.name}</option>)}
                  </optgroup>
                )}
                <optgroup label="SI (bits)">
                  {UNITS.filter(u => u.family==='SI' && !favorites.includes(u.key as UnitKey))
                        .map(u => <option key={'si-b-'+u.key} value={u.key}>{u.name}</option>)}
                </optgroup>
                <optgroup label="SI (bytes)">
                  {UNITS.filter(u => u.family==='SI-Byte' && !favorites.includes(u.key as UnitKey))
                        .map(u => <option key={'si-B-'+u.key} value={u.key}>{u.name}</option>)}
                </optgroup>
                <optgroup label="Binary (bits)">
                  {UNITS.filter(u => u.family==='Binary' && !favorites.includes(u.key as UnitKey))
                        .map(u => <option key={'bi-b-'+u.key} value={u.key}>{u.name}</option>)}
                </optgroup>
                <optgroup label="Binary (bytes)">
                  {UNITS.filter(u => u.family==='Binary-Byte' && !favorites.includes(u.key as UnitKey))
                        .map(u => <option key={'bi-B-'+u.key} value={u.key}>{u.name}</option>)}
                </optgroup>
              </select>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => toggleFavorite(fromUnit)}
                  className="text-xs px-2 py-1 rounded-lg bg-gray-800 border border-gray-600 hover:bg-gray-700 flex items-center gap-1"
                  title="Toggle favorite"
                >
                  <Icon.Star style={{ width: 14, height: 14, color: favorites.includes(fromUnit) ? '#facc15' : '#9ca3af' }} />
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
                onChange={(e) => setToUnit(e.target.value as UnitKey)}
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                {favored.length > 0 && (
                  <optgroup label="★ Favorites">
                    {favored.map(u => <option key={'tf-'+u.key} value={u.key}>{u.name}</option>)}
                  </optgroup>
                )}
                <optgroup label="SI (bits)">
                  {UNITS.filter(u => u.family==='SI' && !favorites.includes(u.key as UnitKey))
                        .map(u => <option key={'tsi-b-'+u.key} value={u.key}>{u.name}</option>)}
                </optgroup>
                <optgroup label="SI (bytes)">
                  {UNITS.filter(u => u.family==='SI-Byte' && !favorites.includes(u.key as UnitKey))
                        .map(u => <option key={'tsi-B-'+u.key} value={u.key}>{u.name}</option>)}
                </optgroup>
                <optgroup label="Binary (bits)">
                  {UNITS.filter(u => u.family==='Binary' && !favorites.includes(u.key as UnitKey))
                        .map(u => <option key={'tbi-b-'+u.key} value={u.key}>{u.name}</option>)}
                </optgroup>
                <optgroup label="Binary (bytes)">
                  {UNITS.filter(u => u.family==='Binary-Byte' && !favorites.includes(u.key as UnitKey))
                        .map(u => <option key={'tbi-B-'+u.key} value={u.key}>{u.name}</option>)}
                </optgroup>
              </select>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => toggleFavorite(toUnit)}
                  className="text-xs px-2 py-1 rounded-lg bg-gray-800 border border-gray-600 hover:bg-gray-700 flex items-center gap-1"
                  title="Toggle favorite"
                >
                  <Icon.Star style={{ width: 14, height: 14, color: favorites.includes(toUnit) ? '#facc15' : '#9ca3af' }} />
                  Fav
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => swapUnits()}
              className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white border border-sky-500 flex items-center gap-2"
              title="Swap From/To (X)"
            >
              <Icon.Swap style={{ width: 16, height: 16 }} /> Swap
            </button>
          </div>

          {/* Direct result */}
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
            {(fromUnit.includes('B') || toUnit.includes('B')) && (
              <div className="mt-2 text-xs text-sky-200/80">
                Reminder: 1 byte = 8 bits. **MB/s** (SI) vs **MiB/s** (binary) differ: 1 MB/s = 10<sup>6</sup> B/s, 1 MiB/s = 2<sup>20</sup> B/s.
              </div>
            )}
          </div>

          {/* More options */}
          <details className="mt-5">
            <summary className="cursor-pointer text-sm text-gray-300">More options</summary>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Precision</label>
                <input type="range" min={0} max={12} value={precision} onChange={(e) => setPrecision(+e.target.value)} className="w-full accent-sky-500" />
                <div className="text-xs text-gray-400 mt-1">Decimals: {precision}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Format</label>
                <select value={formatMode} onChange={(e) => setFormatMode(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100">
                  <option value="normal">Normal</option>
                  <option value="compact">Compact</option>
                  <option value="scientific">Scientific</option>
                </select>
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

        {/* Results grid */}
        <div className="rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-md mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">All Units</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {UNITS.map((unit) => {
              if (unit.key === fromUnit) return null;
              const val = gridResults[unit.key as UnitKey];
              const display = formatNumber(val ?? 0, formatMode, precision);
              return (
                <div key={unit.key} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:bg-gray-700/70 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon.Network style={{ width: 16, height: 16, color: '#38bdf8' }} />
                      <span className="text-sm font-medium text-gray-200 truncate">{unit.name}</span>
                    </div>
                    <button
                      type="button"
                      className="text-xs px-2 py-1 border border-gray-600 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200"
                      onClick={() => {
                        if (hasWindow() && navigator?.clipboard?.writeText && Number.isFinite(val)) {
                          navigator.clipboard.writeText(String(val)).catch(() => {});
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
        <RelatedCalculators currentPath="/data-transfer-converter" category="unit-converters" />
      </div>
    </>
  );
}
