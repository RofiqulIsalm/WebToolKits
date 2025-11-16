import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from "react-router-dom";
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

/* ---------------- Icons (inline, no deps) ---------------- */
const Icon = {
  Wave: (p: any) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12c2.5 0 2.5-6 5-6s2.5 6 5 6 2.5-6 5-6 2.5 6 5 6" />
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

/* ---------------- Units ----------------
   We support two kinds:
   - 'freq'  → linear to Hz via factorHz
   - 'period'→ reciprocal to Hz via secondsPerUnit
--------------------------------------------------*/
type Kind = 'freq' | 'period';
type UnitKey =
  | 'Hz'|'kHz'|'MHz'|'GHz'|'THz'|'mHz'|'uHz'
  | 'RPS'|'RPM'|'CPM'|'BPM'
  | 's'|'ms'|'us'|'ns'|'min'|'h';

type UnitDef = {
  key: UnitKey;
  name: string;
  kind: Kind;
  factorHz?: number;          // for freq kinds
  secondsPerUnit?: number;    // for period kinds
};

const UNITS: UnitDef[] = [
  // Frequency (Hz-based)
  { key: 'Hz',  name: 'Hertz (Hz)',             kind: 'freq',   factorHz: 1 },
  { key: 'kHz', name: 'Kilohertz (kHz)',        kind: 'freq',   factorHz: 1e3 },
  { key: 'MHz', name: 'Megahertz (MHz)',        kind: 'freq',   factorHz: 1e6 },
  { key: 'GHz', name: 'Gigahertz (GHz)',        kind: 'freq',   factorHz: 1e9 },
  { key: 'THz', name: 'Terahertz (THz)',        kind: 'freq',   factorHz: 1e12 },
  { key: 'mHz', name: 'Millihertz (mHz)',       kind: 'freq',   factorHz: 1e-3 },
  { key: 'uHz', name: 'Microhertz (μHz)',       kind: 'freq',   factorHz: 1e-6 },

  // Rotational & per-minute/second
  { key: 'RPS', name: 'Revolutions per second (rps)', kind: 'freq', factorHz: 1 },       // 1 rps = 1 Hz (1 cycle/s)
  { key: 'RPM', name: 'Revolutions per minute (rpm)', kind: 'freq', factorHz: 1/60 },
  { key: 'CPM', name: 'Cycles per minute (cpm)',      kind: 'freq', factorHz: 1/60 },
  { key: 'BPM', name: 'Beats per minute (bpm)',       kind: 'freq', factorHz: 1/60 },

  // Period (reciprocal)
  { key: 'h',   name: 'Hour (h) period',         kind: 'period', secondsPerUnit: 3600 },
  { key: 'min', name: 'Minute (min) period',     kind: 'period', secondsPerUnit: 60 },
  { key: 's',   name: 'Second (s) period',       kind: 'period', secondsPerUnit: 1 },
  { key: 'ms',  name: 'Millisecond (ms) period', kind: 'period', secondsPerUnit: 1e-3 },
  { key: 'us',  name: 'Microsecond (μs) period', kind: 'period', secondsPerUnit: 1e-6 },
  { key: 'ns',  name: 'Nanosecond (ns) period',  kind: 'period', secondsPerUnit: 1e-9 },
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
// To base Hz
function toHz(value: number, from: UnitKey): number {
  const u = unitMap[from] as UnitDef;
  if (!u) return NaN;
  if (u.kind === 'freq') return value * (u.factorHz ?? 1);
  // period → Hz
  const sec = u.secondsPerUnit ?? 1;
  if (value === 0) return Infinity;        // 0 s period → infinite Hz (display will handle)
  return 1 / (value * sec);
}
// From Hz
function fromHz(hz: number, to: UnitKey): number {
  const u = unitMap[to] as UnitDef;
  if (!u) return NaN;
  if (u.kind === 'freq') return hz / (u.factorHz ?? 1);
  // Hz → period
  const sec = u.secondsPerUnit ?? 1;
  if (hz === 0) return Infinity;           // 0 Hz → infinite period
  return 1 / (hz * sec);
}

function formatNumber(n: number, mode: typeof FORMAT_MODES[number] = 'normal', precision = 6) {
  if (!Number.isFinite(n)) return n === Infinity ? '∞' : '—';
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
export default function FrequencyConverter() {
  const [valueStr, setValueStr] = useState('60');         // 60 Hz vibe
  const [fromUnit, setFromUnit] = useState<UnitKey>('Hz');
  const [toUnit, setToUnit] = useState<UnitKey>('RPM');
  const [formatMode, setFormatMode] = useState<typeof FORMAT_MODES[number]>('normal');
  const [precision, setPrecision] = useState(6);
  const [favorites, setFavorites] = useLocalStorage<UnitKey[]>('freq:favorites', ['Hz','kHz','MHz','RPM','BPM','ms','us']);
  const [history, setHistory] = useLocalStorage<any[]>('freq:history', []);

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
  const baseHz = useMemo(() => toHz(valueNum, fromUnit), [valueNum, fromUnit]);
  const direct = useMemo(() => fromHz(baseHz, toUnit), [baseHz, toUnit]);
  const gridResults = useMemo(() => {
    const out: Record<UnitKey, number> = {} as any;
    for (const u of UNITS) if (u.key !== fromUnit) out[u.key as UnitKey] = fromHz(baseHz, u.key as UnitKey);
    return out;
  }, [baseHz, fromUnit]);

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
        a.href = url; a.download = 'frequency-conversion.csv';
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
      {/** ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Frequency Converter — Hz, kHz, MHz, GHz ↔ RPM/CPM/BPM & Period (s, ms, μs, ns) | 2025–2026"
        description="Instantly convert between frequency (Hz, kHz, MHz, GHz, THz, mHz, μHz), rotational units (RPM, RPS), event rates (CPM, BPM), and period (s, ms, μs, ns, min, h). Includes precision control, Normal/Compact/Scientific formats, keyboard shortcuts, favorites, history, CSV export, and shareable URLs."
        keywords={[
          "frequency converter",
          "Hz to kHz",
          "Hz to RPM",
          "RPM to Hz",
          "CPM to Hz",
          "BPM to Hz",
          "period to frequency",
          "ms to Hz",
          "microsecond to Hz",
          "frequency period converter",
          "cycles per minute",
          "revolutions per minute",
          "beats per minute"
        ]}
        canonical="https://calculatorhub.site/frequency-converter"
        schemaData={[
          /* 1) WebPage + Article */
          {
            "@context":"https://schema.org",
            "@type":"WebPage",
            "@id":"https://calculatorhub.site/frequency-converter#webpage",
            "url":"https://calculatorhub.site/frequency-converter",
            "name":"Frequency Converter — Hz ↔ RPM/CPM/BPM & Period",
            "inLanguage":"en",
            "isPartOf":{"@id":"https://calculatorhub.site/#website"},
            "primaryImageOfPage":{
              "@type":"ImageObject",
              "@id":"https://calculatorhub.site/images/frequency-converter-hero.webp#primaryimg",
              "url":"https://calculatorhub.site/images/frequency-converter-hero.webp",
              "width":1200,
              "height":675
            },
            "mainEntity":{
              "@type":"Article",
              "@id":"https://calculatorhub.site/frequency-converter#article",
              "headline":"Frequency Converter — Fast, Accurate, Shareable",
              "description":"Convert Hz/kHz/MHz/GHz/THz, RPM/RPS/CPM/BPM and periods (s, ms, μs, ns, min, h) with precision controls, favorites, history, shortcuts, and CSV export.",
              "image":["https://calculatorhub.site/images/frequency-converter-hero.webp"],
              "author":{"@type":"Organization","name":"CalculatorHub","url":"https://calculatorhub.site"},
              "publisher":{"@id":"https://calculatorhub.site/#organization"},
              "datePublished":"2025-11-09",
              "dateModified":"2025-11-09",
              "mainEntityOfPage":{"@id":"https://calculatorhub.site/frequency-converter#webpage"},
              "articleSection":[
                "How to Use",
                "Supported Units",
                "Frequency ↔ Period",
                "RPM/CPM/BPM Conversions",
                "Precision & Formats",
                "Keyboard Shortcuts",
                "Copy & CSV Export",
                "FAQ"
              ]
            }
          },
      
          /* 2) Breadcrumbs */
          {
            "@context":"https://schema.org",
            "@type":"BreadcrumbList",
            "@id":"https://calculatorhub.site/frequency-converter#breadcrumbs",
            "itemListElement":[
              {"@type":"ListItem","position":1,"name":"Home","item":"https://calculatorhub.site/"},
              {"@type":"ListItem","position":2,"name":"Unit Converters","item":"https://calculatorhub.site/category/unit-converters"},
              {"@type":"ListItem","position":3,"name":"Frequency Converter","item":"https://calculatorhub.site/frequency-converter"}
            ]
          },
      
          /* 3) FAQ */
          {
            "@context":"https://schema.org",
            "@type":"FAQPage",
            "@id":"https://calculatorhub.site/frequency-converter#faq",
            "mainEntity":[
              {
                "@type":"Question",
                "name":"How do I convert RPM to Hz?",
                "acceptedAnswer":{
                  "@type":"Answer",
                  "text":"1 RPM = 1⁄60 Hz. Multiply RPM by 1⁄60 to get Hz. Example: 1200 RPM = 20 Hz."
                }
              },
              {
                "@type":"Question",
                "name":"How do I convert frequency to period?",
                "acceptedAnswer":{
                  "@type":"Answer",
                  "text":"Period (seconds) = 1 ÷ frequency (Hz). For milliseconds, microseconds, etc., convert seconds to the desired unit."
                }
              },
              {
                "@type":"Question",
                "name":"Is RPS the same as Hz?",
                "acceptedAnswer":{
                  "@type":"Answer",
                  "text":"Yes. 1 revolution per second corresponds to 1 cycle per second, i.e., 1 Hz."
                }
              },
              {
                "@type":"Question",
                "name":"Can I convert BPM or CPM to Hz?",
                "acceptedAnswer":{
                  "@type":"Answer",
                  "text":"Yes. BPM and CPM are per-minute rates. Divide by 60 to convert to Hz (events per second)."
                }
              },
              {
                "@type":"Question",
                "name":"Does the tool save favorites and recent conversions?",
                "acceptedAnswer":{
                  "@type":"Answer",
                  "text":"Yes—favorites and up to 10 recent conversions are stored locally in your browser."
                }
              }
            ]
          },
      
          /* 4) WebApplication */
          {
            "@context":"https://schema.org",
            "@type":"WebApplication",
            "@id":"https://calculatorhub.site/frequency-converter#webapp",
            "name":"Frequency Converter",
            "url":"https://calculatorhub.site/frequency-converter",
            "applicationCategory":"UtilitiesApplication",
            "operatingSystem":"Web",
            "description":"Convert Hz, kHz, MHz, GHz, RPM, RPS, CPM, BPM and periods with precision controls and CSV export.",
            "publisher":{"@id":"https://calculatorhub.site/#organization"},
            "image":["https://calculatorhub.site/images/frequency-converter-hero.webp"]
          },
      
          /* 5) SoftwareApplication */
          {
            "@context":"https://schema.org",
            "@type":"SoftwareApplication",
            "@id":"https://calculatorhub.site/frequency-converter#software",
            "name":"Advanced Frequency Converter",
            "applicationCategory":"UtilitiesApplication",
            "operatingSystem":"All",
            "url":"https://calculatorhub.site/frequency-converter",
            "publisher":{"@id":"https://calculatorhub.site/#organization"},
            "description":"Interactive frequency & period converter with shareable links and CSV export."
          },
      
          /* 6) WebSite + Organization (global) */
          {
            "@context":"https://schema.org",
            "@type":"WebSite",
            "@id":"https://calculatorhub.site/#website",
            "url":"https://calculatorhub.site",
            "name":"CalculatorHub",
            "publisher":{"@id":"https://calculatorhub.site/#organization"},
            "potentialAction":{
              "@type":"SearchAction",
              "target":"https://calculatorhub.site/search?q={query}",
              "query-input":"required name=query"
            }
          },
          {
            "@context":"https://schema.org",
            "@type":"Organization",
            "@id":"https://calculatorhub.site/#organization",
            "name":"CalculatorHub",
            "url":"https://calculatorhub.site",
            "logo":{"@type":"ImageObject","url":"https://calculatorhub.site/images/logo.png"}
          }
        ]}
      />
      
      {/** ===== Outside meta/link tags ===== */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <link rel="canonical" href="https://calculatorhub.site/frequency-converter" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/frequency-converter" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/frequency-converter" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/frequency-converter" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Frequency Converter — Hz ↔ RPM/CPM/BPM & Period" />
      <meta property="og:description" content="Fast, accurate conversion between Hz, kHz, MHz, GHz, RPM, CPM, BPM and period units. Precision, shortcuts, favorites, history, CSV." />
      <meta property="og:url" content="https://calculatorhub.site/frequency-converter" />
      <meta property="og:image" content="https://calculatorhub.site/images/frequency-converter-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Frequency converter UI showing Hz↔RPM and period conversions" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Frequency Converter — Hz, kHz, MHz, GHz ↔ RPM/CPM/BPM & Period" />
      <meta name="twitter:description" content="Convert frequency, rotational speed, event rates, and period with precision and CSV export." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/frequency-converter-hero.webp" />
      <meta name="twitter:creator" content="@CalculatorHub" />
      <meta name="twitter:site" content="@CalculatorHub" />
      
      {/** PWA & theme */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#120A2A" />
      
      {/** Performance */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="preload" as="image" href="/images/frequency-converter-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />


      <div className="max-w-5xl mx-auto text-gray-200">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Frequency Converter', url: '/frequency-converter' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 rounded-2xl p-6 bg-gradient-to-r from-fuchsia-900 via-purple-900 to-indigo-900 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">Frequency Converter (Advanced)</h1>
          <p className="text-gray-300">
            Frequency ↔ Period, plus RPM/CPM/RPS/BPM.
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
                  className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  aria-label="Enter frequency/period value"
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
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {favored.length > 0 && (
                  <optgroup label="★ Favorites">
                    {favored.map(u => <option key={'f-'+u.key} value={u.key}>{u.name}</option>)}
                  </optgroup>
                )}
                <optgroup label="Frequency">
                  {UNITS.filter(u => u.kind==='freq' && !favorites.includes(u.key as UnitKey))
                        .map(u => <option key={'a-'+u.key} value={u.key}>{u.name}</option>)}
                </optgroup>
                <optgroup label="Period">
                  {UNITS.filter(u => u.kind==='period' && !favorites.includes(u.key as UnitKey))
                        .map(u => <option key={'p-'+u.key} value={u.key}>{u.name}</option>)}
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
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {favored.length > 0 && (
                  <optgroup label="★ Favorites">
                    {favored.map(u => <option key={'tf-'+u.key} value={u.key}>{u.name}</option>)}
                  </optgroup>
                )}
                <optgroup label="Frequency">
                  {UNITS.filter(u => u.kind==='freq' && !favorites.includes(u.key as UnitKey))
                        .map(u => <option key={'ta-'+u.key} value={u.key}>{u.name}</option>)}
                </optgroup>
                <optgroup label="Period">
                  {UNITS.filter(u => u.kind==='period' && !favorites.includes(u.key as UnitKey))
                        .map(u => <option key={'tp-'+u.key} value={u.key}>{u.name}</option>)}
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
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 flex items-center gap-2"
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
            {(fromUnit === 'RPM' || toUnit === 'RPM' || fromUnit === 'CPM' || toUnit === 'CPM' || fromUnit === 'BPM' || toUnit === 'BPM') && (
              <div className="mt-2 text-xs text-indigo-200/80">
                Note: 1 RPM/CPM/BPM = 1/60 Hz. 1 RPS = 1 Hz. Period (s) = 1 / Hz.
              </div>
            )}
          </div>

          {/* More options */}
          <details className="mt-5">
            <summary className="cursor-pointer text-sm text-gray-300">More options</summary>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Precision</label>
                <input type="range" min={0} max={12} value={precision} onChange={(e) => setPrecision(+e.target.value)} className="w-full accent-indigo-500" />
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
                      <Icon.Wave style={{ width: 16, height: 16, color: '#a78bfa' }} />
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

        {/* ============ SEO Content: Frequency Converter (English Only) ======*/}
      <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
      
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-indigo-300">
            Frequency Converter — Hz, kHz, MHz, GHz, THz ↔ RPM, RPS, CPM, BPM ↔ Period (s, ms, μs, ns, min, h)
          </h1>
          <p className="mt-3">
            Convert frequency, rotational speed, event rates, and time periods instantly. This tool supports
            <strong> Hertz (Hz, kHz, MHz, GHz, THz, mHz, μHz)</strong>, rotational and per-minute units
            (<strong>RPS, RPM, CPM, BPM</strong>), and <strong>period</strong> units (<strong>s, ms, μs, ns, min, h</strong>).
            Use precision controls (0–12 decimals), choose Normal/Compact/Scientific formatting, save favorites, revisit your last
            ten conversions, and export the full grid with Copy or CSV. Shareable URLs preserve every setting.
          </p>
        </header>
      
        {/* Contents */}
        <nav className="mt-2 mb-10 bg-[#120A2A] border border-[#2b2460] rounded-xl p-5 text-slate-200">
          <h2 className="text-lg font-semibold text-gray-100 mb-3">📖 Contents</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li><a href="#freq-how" className="text-indigo-300 hover:underline">How to Use</a></li>
            <li><a href="#freq-basics" className="text-indigo-300 hover:underline">Frequency, Rate &amp; Period — The Basics</a></li>
            <li><a href="#freq-formulas" className="text-indigo-300 hover:underline">Core Formulas &amp; Definitions</a></li>
            <li><a href="#freq-examples" className="text-indigo-300 hover:underline">Worked Examples</a></li>
            <li><a href="#freq-use" className="text-indigo-300 hover:underline">Real-World Use Cases</a></li>
            <li><a href="#freq-precision" className="text-indigo-300 hover:underline">Precision, Rounding &amp; Display</a></li>
            <li><a href="#freq-quick" className="text-indigo-300 hover:underline">Quick Reference Tables</a></li>
            <li><a href="#freq-faq" className="text-indigo-300 hover:underline">FAQ</a></li>
            <li><a href="#freq-access" className="text-indigo-300 hover:underline">Accessibility &amp; Shortcuts</a></li>
            <li><a href="#freq-trouble" className="text-indigo-300 hover:underline">Troubleshooting &amp; Tips</a></li>
            <li><a href="#freq-glossary" className="text-indigo-300 hover:underline">Glossary</a></li>
          </ol>
        </nav>
      
        {/* How to Use */}
        <h2 id="freq-how" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">💡 How to Use</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Type a number in <strong>Value</strong>. Empty input counts as 0; <code>1,234.56</code> style commas are allowed.</li>
          <li>Choose the <strong>From</strong> unit and <strong>To</strong> unit. Pin favorites for fast access.</li>
          <li>Open <strong>More options</strong> to set decimals (0–12) and choose <em>Normal</em>, <em>Compact</em>, or <em>Scientific</em> display.</li>
          <li>Use <strong>Copy All</strong> or <strong>CSV</strong> to export the entire conversion grid.</li>
          <li>Reopen prior states with <strong>Recent</strong>; the last ten conversions are saved locally.</li>
        </ol>
        <p className="text-xs text-slate-400">Pro tip: The URL encodes your exact state (value, units, format, precision). Bookmark or share for reproducible results.</p>
      
        {/* Basics */}
        <h2 id="freq-basics" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">📈 Frequency, Rate &amp; Period — The Basics</h2>
        <p>
          <strong>Frequency</strong> measures how often an event repeats per second (in Hertz, Hz). <strong>Period</strong> is the time
          per event (seconds, milliseconds, microseconds, etc.). They are reciprocals: higher frequency means shorter period.
          Rotational or event-rate units like <strong>RPM</strong>, <strong>CPM</strong>, <strong>BPM</strong>, and <strong>RPS</strong>
          are simply frequency expressed with different time bases (per minute vs per second) or different contexts (revolutions vs generic cycles vs beats).
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Hz, kHz, MHz, GHz, THz:</strong> cycles per second (SI scale).</li>
          <li><strong>RPS:</strong> revolutions per second; numerically equal to Hz for one revolution per cycle.</li>
          <li><strong>RPM, CPM, BPM:</strong> per-minute rates; convert to Hz by dividing by 60.</li>
          <li><strong>Period (s, ms, μs, ns, min, h):</strong> time for one cycle; invert to get Hz.</li>
        </ul>
      
        {/* Formulas */}
        <h2 id="freq-formulas" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">🧮 Core Formulas &amp; Definitions</h2>
        <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm space-y-4">
          <div>
            <p className="font-semibold">Frequency ↔ Period</p>
            <ul className="list-disc list-inside">
              <li><strong>f (Hz) = 1 / T (s)</strong></li>
              <li><strong>T (s) = 1 / f (Hz)</strong></li>
              <li>For ms, μs, ns: convert seconds accordingly (ms = 10<sup>−3</sup> s, μs = 10<sup>−6</sup> s, ns = 10<sup>−9</sup> s).</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold">Per-Minute Rates</p>
            <ul className="list-disc list-inside">
              <li><strong>Hz = RPM ÷ 60</strong> (also CPM/60, BPM/60)</li>
              <li><strong>RPM = Hz × 60</strong> (likewise CPM = Hz × 60, BPM = Hz × 60)</li>
              <li><strong>RPS = Hz</strong> (1 revolution per second = 1 cycle per second)</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold">SI Scaling</p>
            <ul className="list-disc list-inside">
              <li>1 kHz = 10<sup>3</sup> Hz, 1 MHz = 10<sup>6</sup> Hz, 1 GHz = 10<sup>9</sup> Hz, 1 THz = 10<sup>12</sup> Hz</li>
              <li>1 mHz = 10<sup>−3</sup> Hz, 1 μHz = 10<sup>−6</sup> Hz</li>
            </ul>
          </div>
        </div>
      
        {/* Examples */}
        <h2 id="freq-examples" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">📊 Worked Examples (Rounded)</h2>
        <ul className="space-y-2">
          <li><strong>60 Hz → RPM:</strong> 60 × 60 = <strong>3600 RPM</strong></li>
          <li><strong>1200 RPM → Hz:</strong> 1200 ÷ 60 = <strong>20 Hz</strong></li>
          <li><strong>1000 CPM → Hz:</strong> 1000 ÷ 60 ≈ <strong>16.6667 Hz</strong></li>
          <li><strong>90 BPM → Hz:</strong> 90 ÷ 60 = <strong>1.5 Hz</strong>; period T = 1/1.5 ≈ <strong>0.6667 s</strong></li>
          <li><strong>Period 5 ms → Hz:</strong> 5 ms = 0.005 s → 1/0.005 = <strong>200 Hz</strong></li>
          <li><strong>2 μs → Hz:</strong> 2 × 10<sup>−6</sup> s → 1/(2e−6) = <strong>500 kHz</strong></li>
          <li><strong>0.25 Hz → Period:</strong> T = 1/0.25 = <strong>4 s</strong></li>
        </ul>
        <p className="text-xs text-slate-400">
          Your UI returns exact values at your chosen precision; examples above are rounded for readability.
        </p>
      
        {/* Use Cases */}
        <h2 id="freq-use" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">🛠️ Real-World Use Cases</h2>
      
        <h3 className="text-lg font-semibold text-gray-100 mt-4">Electronics &amp; Embedded Systems</h3>
        <p>
          Convert between clock frequency and timer periods when configuring microcontrollers, PWM outputs, and sampling rates.
          For ADC/DAC pipelines, ensure the period meets latency and jitter budgets.
        </p>
      
        <h3 className="text-lg font-semibold text-gray-100 mt-4">Signal Processing &amp; Communications</h3>
        <p>
          Translate carrier frequencies (kHz–GHz) to periods for time-domain simulations, or map BPM/CPM event streams to Hz for filtering
          and spectral analysis. Use Scientific format for tiny μHz/μs regimes.
        </p>
      
        <h3 className="text-lg font-semibold text-gray-100 mt-4">Rotating Machinery &amp; Vibration</h3>
        <p>
          Switch between RPM and Hz to evaluate resonance, bearing fault frequencies (CPM), and orders analysis. Period outputs help
          estimate time between impacts and sensor sampling requirements.
        </p>
        <AdBanner type="bottom" />
      
        <h3 className="text-lg font-semibold text-gray-100 mt-4">Audio, Music &amp; Metronomes</h3>
        <p>
          Convert tempo in BPM to Hz/period for LFOs, envelope timing, and synchronization. Example: 120 BPM = 2 Hz → 0.5 s period per beat.
        </p>
      
        <h3 className="text-lg font-semibold text-gray-100 mt-4">Medical &amp; Fitness</h3>
        <p>
          Heart rate (BPM) to Hz/period helps compute RR intervals, HRV windows, and algorithm sampling rates for wearables and
          biosignal processing.
        </p>
      
        {/* Precision */}
        <h2 id="freq-precision" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">🎯 Precision, Rounding &amp; Display</h2>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Decimals (0–12):</strong> Choose enough precision for your application—DSP and RF often need more digits than UI readouts.</li>
          <li><strong>Normal vs Compact vs Scientific:</strong> Use Compact for very large per-minute numbers; use Scientific for μHz, μs, ns.</li>
          <li><strong>Unit scaling:</strong> Prefer kHz/MHz/GHz over large raw Hz values for readability; likewise ms/μs/ns for short periods.</li>
          <li><strong>Edge cases:</strong> 0 period implies ∞ Hz; 0 Hz implies ∞ period. The UI displays <strong>∞</strong> accordingly.</li>
        </ul>
      
        {/* Quick Reference */}
        <h2 id="freq-quick" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">🗂️ Quick Reference Tables</h2>
      
        <h3 className="text-lg font-semibold text-gray-100 mt-4">Per-Minute Rates</h3>
        <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <li>1 RPM = <strong>1/60 Hz</strong> ≈ 0.0166667 Hz</li>
            <li>1 Hz = <strong>60 RPM</strong></li>
            <li>1 CPM = <strong>1/60 Hz</strong></li>
            <li>1 BPM = <strong>1/60 Hz</strong></li>
            <li>1 RPS = <strong>1 Hz</strong></li>
          </ul>
        </div>
      
        <h3 className="text-lg font-semibold text-gray-100 mt-6">SI &amp; Time Scales</h3>
        <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <li>1 kHz = 10<sup>3</sup> Hz</li>
            <li>1 MHz = 10<sup>6</sup> Hz</li>
            <li>1 GHz = 10<sup>9</sup> Hz</li>
            <li>1 THz = 10<sup>12</sup> Hz</li>
            <li>1 ms = 10<sup>−3</sup> s</li>
            <li>1 μs = 10<sup>−6</sup> s</li>
            <li>1 ns = 10<sup>−9</sup> s</li>
            <li>1 min = 60 s; 1 h = 3600 s</li>
          </ul>
        </div>
      
        {/* FAQ */}
        <h2 id="freq-faq" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">❓ Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-indigo-300">What’s the difference between Hz and RPM?</h3>
            <p>Hz is events per second; RPM is events per minute. Convert by dividing or multiplying by 60. If one event equals one revolution, RPS = Hz.</p>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-indigo-300">How do I convert period (milliseconds) to Hz?</h3>
            <p>Convert to seconds first (ms ÷ 1000) then take the reciprocal: Hz = 1/T. Example: 2 ms → 0.002 s → 1/0.002 = 500 Hz.</p>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-indigo-300">Does 1 BPM always equal 1/60 Hz?</h3>
            <p>Yes—BPM and CPM are per-minute rates. Divide by 60 to get events per second (Hz).</p>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-indigo-300">Why do I see ∞ as a result?</h3>
            <p>Zero period implies infinite frequency; zero frequency implies infinite period. The converter shows <strong>∞</strong> in those cases.</p>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-indigo-300">Are favorites and recents stored?</h3>
            <p>Yes—locally in your browser. You can pin up to 10 favorites and view your last 10 conversions.</p>
          </div>
        </div>
      
        {/* Accessibility & Shortcuts */}
        <h2 id="freq-access" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">♿ Accessibility &amp; Shortcuts</h2>
        <ul className="list-disc list-inside">
          <li><kbd>/</kbd> — focus Value</li>
          <li><kbd>S</kbd> — focus From</li>
          <li><kbd>T</kbd> — focus To</li>
          <li><kbd>X</kbd> — swap units</li>
        </ul>
        <p className="text-xs text-slate-400 mt-2">
          ARIA labels and helper text improve clarity; tooltips and visual focus states aid keyboard users.
        </p>
      
        {/* Troubleshooting */}
        <h2 id="freq-trouble" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">🧩 Troubleshooting &amp; Tips</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>If you see “—”, ensure the input is numeric and the units are valid.</li>
          <li>Switch to Scientific format for extremely small/large values (μHz, THz, μs, ns).</li>
          <li>Prefer SI prefixes (kHz/MHz) for readability instead of long raw Hz numbers.</li>
          <li>Share the auto-encoded URL to reproduce the exact state across devices.</li>
        </ul>
      
        {/* Glossary */}
        <h2 id="freq-glossary" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">📚 Glossary</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <dt className="font-semibold text-indigo-300">Frequency (Hz)</dt>
            <dd>Events per second. 1 Hz = 1 s⁻¹.</dd>
          </div>
          <div>
            <dt className="font-semibold text-indigo-300">Period (T)</dt>
            <dd>Time per event. T = 1/f.</dd>
          </div>
          <div>
            <dt className="font-semibold text-indigo-300">RPS</dt>
            <dd>Revolutions per second; equals Hz when 1 revolution = 1 cycle.</dd>
          </div>
          <div>
            <dt className="font-semibold text-indigo-300">RPM / CPM / BPM</dt>
            <dd>Per-minute rates (revolutions, cycles, beats). Divide by 60 to get Hz.</dd>
          </div>
          <div>
            <dt className="font-semibold text-indigo-300">μ (micro)</dt>
            <dd>10⁻⁶. Example: μs = 10⁻⁶ s; μHz = 10⁻⁶ Hz.</dd>
          </div>
          <div>
            <dt className="font-semibold text-indigo-300">SI Prefixes</dt>
            <dd>milli (10⁻³), micro (10⁻⁶), nano (10⁻⁹), kilo (10³), mega (10⁶), giga (10⁹), tera (10¹²).</dd>
          </div>
        </dl>
      
        {/* Author / Timestamp */}
        <section className="mt-12 border-t border-gray-700 pt-6">
          <div className="flex items-center gap-3">
            <img src="/images/calculatorhub-author.webp" alt="CalculatorHub Tools Team" className="w-12 h-12 rounded-full border border-gray-600" loading="lazy" />
            <div>
              <p className="font-semibold text-white">Author: CalculatorHub Tools Team</p>
              <p className="text-sm text-slate-400">Last updated: <time dateTime="2025-11-10">November 10, 2025</time></p>
            </div>
          </div>
        </section>
      </section>


        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/frequency-converter" category="unit-converters" />
      </div>
    </>
  );
}
