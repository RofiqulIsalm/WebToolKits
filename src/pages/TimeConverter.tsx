import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from "react-router-dom";
// Project components
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

/* ---------------- Icons (inline, no deps) ---------------- */
const Icon = {
  Clock: (p: any) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
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

/* ---------------- Units (factors are in SECONDS, s) ----------------
   Notes:
   - Month/Year are **average civil** values to keep conversions deterministic:
     1 year = 365.2425 days; 1 month = year/12 ≈ 30.436875 days.
   - If you prefer simple calendar approximations, swap factors for 365 & 30.
--------------------------------------------------------------------- */
const TIME_UNITS = [
  { key: 'ns',   name: 'Nanosecond (ns)',      factor: 1e-9 },
  { key: 'µs',   name: 'Microsecond (µs)',     factor: 1e-6 },
  { key: 'ms',   name: 'Millisecond (ms)',     factor: 1e-3 },
  { key: 's',    name: 'Second (s)',           factor: 1 },
  { key: 'min',  name: 'Minute (min)',         factor: 60 },
  { key: 'h',    name: 'Hour (h)',             factor: 3600 },
  { key: 'd',    name: 'Day (d)',              factor: 86400 },
  { key: 'wk',   name: 'Week (wk)',            factor: 604800 }, // 7 d
  { key: 'mo',   name: 'Month (avg)',          factor: 365.2425/12 * 86400 }, // ≈ 2,629,746 s
  { key: 'yr',   name: 'Year (avg)',           factor: 365.2425 * 86400 },    // ≈ 31,556,952 s
];
const unitMap: Record<string, {key:string; name:string; factor:number}> =
  Object.fromEntries(TIME_UNITS.map(u => [u.key, u]));
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
function convertLinear(value: number, fromKey: string, toKey: string) {
  const f = unitMap[fromKey], t = unitMap[toKey];
  if (!f || !t) return NaN;
  return (value * f.factor) / t.factor;
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
export default function TimeConverter() {
  const [valueStr, setValueStr] = useState('');
  const [fromUnit, setFromUnit] = useState('min');
  const [toUnit, setToUnit] = useState('s');
  const [formatMode, setFormatMode] = useState<typeof FORMAT_MODES[number]>('normal');
  const [precision, setPrecision] = useState(6);
  const [favorites, setFavorites] = useLocalStorage<string[]>('time:favorites', ['ms','s','min','h','d','wk','yr']);
  const [history, setHistory] = useLocalStorage<any[]>('time:history', []);

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
  const direct = useMemo(() => convertLinear(valueNum, fromUnit, toUnit), [valueNum, fromUnit, toUnit]);
  const gridResults = useMemo(() => {
    const base = valueNum * (unitMap[fromUnit]?.factor || 1);
    const out: Record<string, number> = {};
    for (const u of TIME_UNITS) if (u.key !== fromUnit) out[u.key] = base / u.factor;
    return out;
  }, [valueNum, fromUnit]);

  /* ---------- URL sync ---------- */
  useEffect(() => {
    if (!hasWindow()) return;
    try {
      const usp = new URLSearchParams(window.location.search);
      const v = usp.get('v'); const f = usp.get('from'); const t = usp.get('to');
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
      const newUrl = `${window.location.pathname}?${usp.toString()}`;
      window.history.replaceState(null, '', newUrl);
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
  function toggleFavorite(k: string) {
    setFavorites(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k].slice(0, 6));
  }
  function swapUnits() {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  }
  function copyAll() {
    const lines = Object.entries(gridResults).map(([k, v]) => `${unitMap[k].name}: ${v}`).join('\n');
    if (hasWindow() && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(lines).catch(() => {});
    }
  }
  function exportCSV() {
    const headers = ['Unit','Value'];
    const rows = Object.entries(gridResults).map(([k, v]) => [unitMap[k].name, String(v)]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = (hasWindow() && URL?.createObjectURL) ? URL.createObjectURL(blob) : null;
      if (url && hasWindow()) {
        const a = document.createElement('a');
        a.href = url; a.download = 'time-conversion.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
      }
    } catch {}
  }

  const favored = TIME_UNITS.filter(u => favorites.includes(u.key));
  const unfavored = TIME_UNITS.filter(u => !favorites.includes(u.key));
  const hasInput = (valueStr || '').trim() !== '';

  return (
    <>
      {/** ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Time Converter — ns ⇄ µs ⇄ ms ⇄ s ⇄ min ⇄ h ⇄ d ⇄ wk ⇄ month (avg) ⇄ year (avg)"
        description="Instant, precise time conversions across ns, µs, ms, s, minutes, hours, days, weeks, average months and years. Includes precision control, Normal/Compact/Scientific formats, favorites, history, keyboard shortcuts, CSV export, and shareable URLs."
        keywords={[
          "time converter",
          "seconds to minutes",
          "minutes to hours",
          "hours to days",
          "days to weeks",
          "weeks to days",
          "ms to s",
          "microseconds to milliseconds",
          "nanoseconds to microseconds",
          "month to seconds",
          "year to seconds",
          "average civil year 365.2425",
          "average month 30.436875",
          "time unit conversion"
        ]}
        canonical="https://calculatorhub.site/time-converter"
        schemaData={[
          /* 1) WebPage + Article */
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://calculatorhub.site/time-converter#webpage",
            "url": "https://calculatorhub.site/time-converter",
            "name": "Time Converter — ns, µs, ms, s, min, h, d, wk, month (avg), year (avg)",
            "inLanguage": "en",
            "isPartOf": { "@id": "https://calculatorhub.site/#website" },
            "primaryImageOfPage": {
              "@type": "ImageObject",
              "@id": "https://calculatorhub.site/images/time-converter-hero.webp#primaryimg",
              "url": "https://calculatorhub.site/images/time-converter-hero.webp",
              "width": 1200,
              "height": 675
            },
            "mainEntity": {
              "@type": "Article",
              "@id": "https://calculatorhub.site/time-converter#article",
              "headline": "Time Converter — Fast, Accurate, Shareable",
              "description": "Convert between nanoseconds, microseconds, milliseconds, seconds, minutes, hours, days, weeks, average months and years with precision controls, favorites, history, keyboard shortcuts and CSV export.",
              "image": ["https://calculatorhub.site/images/time-converter-hero.webp"],
              "author": { "@type": "Organization", "name": "CalculatorHub", "url": "https://calculatorhub.site" },
              "publisher": { "@id": "https://calculatorhub.site/#organization" },
              "datePublished": "2025-11-09",
              "dateModified": "2025-11-09",
              "mainEntityOfPage": { "@id": "https://calculatorhub.site/time-converter#webpage" },
              "articleSection": [
                "How to Use",
                "Supported Units",
                "Precision & Formats",
                "Keyboard Shortcuts",
                "Copy & CSV Export",
                "FAQ"
              ]
            }
          },
      
          /* 2) Breadcrumbs */
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "@id": "https://calculatorhub.site/time-converter#breadcrumbs",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://calculatorhub.site/" },
              { "@type": "ListItem", "position": 2, "name": "Unit Converters", "item": "https://calculatorhub.site/category/unit-converters" },
              { "@type": "ListItem", "position": 3, "name": "Time Converter", "item": "https://calculatorhub.site/time-converter" }
            ]
          },
      
          /* 3) FAQ */
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://calculatorhub.site/time-converter#faq",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What definition of month and year do you use?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "For deterministic results, this tool uses average civil values: 1 year = 365.2425 days and 1 month = 1/12 of that year (~30.436875 days)."
                }
              },
              {
                "@type": "Question",
                "name": "How many seconds are in a day and a week?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "1 day = 86,400 seconds. 1 week = 7 days = 604,800 seconds."
                }
              },
              {
                "@type": "Question",
                "name": "Can I switch to compact or scientific notation?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Choose Normal, Compact, or Scientific formats and adjust decimal precision from 0–12."
                }
              },
              {
                "@type": "Question",
                "name": "Does the tool support shortcuts?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes: “/” focuses the value, “S” focuses From, “T” focuses To, and “X” swaps units."
                }
              },
              {
                "@type": "Question",
                "name": "Can I export all results?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Use Copy All to clipboard or export a CSV of the full results grid."
                }
              }
            ]
          },
      
          /* 4) WebApplication */
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://calculatorhub.site/time-converter#webapp",
            "name": "Time Converter",
            "url": "https://calculatorhub.site/time-converter",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web",
            "description": "Convert time units with precision controls, favorites, history, keyboard shortcuts, and CSV export.",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "image": ["https://calculatorhub.site/images/time-converter-hero.webp"]
          },
      
          /* 5) SoftwareApplication */
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://calculatorhub.site/time-converter#software",
            "name": "Advanced Time Converter",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "All",
            "url": "https://calculatorhub.site/time-converter",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "description": "Interactive converter for nanoseconds to years with shareable links and CSV export."
          },
      
          /* 6) WebSite + Organization (global) */
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
            "logo": { "@type": "ImageObject", "url": "https://calculatorhub.site/images/logo.png" }
          }
        ]}
      />
      
      {/** ===== Outside meta/link tags ===== */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <link rel="canonical" href="https://calculatorhub.site/time-converter" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/time-converter" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/time-converter" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/time-converter" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Time Converter — ns ⇄ µs ⇄ ms ⇄ s ⇄ min ⇄ h ⇄ d ⇄ wk ⇄ month ⇄ year" />
      <meta property="og:description" content="Convert nanoseconds to years with precision controls, multiple formats, favorites, history, and CSV export." />
      <meta property="og:url" content="https://calculatorhub.site/time-converter" />
      <meta property="og:image" content="https://calculatorhub.site/images/time-converter-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Time converter UI showing seconds ↔ minutes ↔ hours" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Time Converter — ns to year (avg) in one click" />
      <meta name="twitter:description" content="Lightning-fast time conversions from ns to year with pro formatting and CSV export." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/time-converter-hero.webp" />
      <meta name="twitter:creator" content="@CalculatorHub" />
      <meta name="twitter:site" content="@CalculatorHub" />
      
      {/** PWA & theme */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#0b0720" />
      
      {/** Performance */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="preload" as="image" href="/images/time-converter-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />


      <div className="max-w-5xl mx-auto text-gray-200">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Time Converter', url: '/time-converter' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 rounded-2xl p-6 bg-gradient-to-r from-indigo-900 via-violet-900 to-fuchsia-900 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">Time Converter (Advanced)</h1>
          <p className="text-gray-300">
            Precision control, favorites, history, and shareable links.
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
                  aria-label="Enter time value"
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
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {favored.length > 0 && (
                  <optgroup label="★ Favorites">
                    {favored.map(u => <option key={'f-'+u.key} value={u.key}>{u.name}</option>)}
                  </optgroup>
                )}
                <optgroup label="All units">
                  {unfavored.map(u => <option key={'a-'+u.key} value={u.key}>{u.name}</option>)}
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
                onChange={(e) => setToUnit(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {favored.length > 0 && (
                  <optgroup label="★ Favorites">
                    {favored.map(u => <option key={'tf-'+u.key} value={u.key}>{u.name}</option>)}
                  </optgroup>
                )}
                <optgroup label="All units">
                  {unfavored.map(u => <option key={'ta-'+u.key} value={u.key}>{u.name}</option>)}
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
            {TIME_UNITS.map((unit) => {
              if (unit.key === fromUnit) return null;
              const val = gridResults[unit.key];
              const display = formatNumber(val ?? 0, formatMode, precision);
              return (
                <div key={unit.key} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:bg-gray-700/70 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon.Clock style={{ width: 16, height: 16, color: '#a78bfa' }} />
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
        {/* ================ SEO Content Section (~1800–2000 words) ================== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
        
          {/* ===== Table of Contents ===== */}
          <nav className="mt-2 mb-10 bg-[#0e0a1d] border border-[#251f3f] rounded-xl p-5 text-slate-200">
            <h2 className="text-lg font-semibold text-gray-100 mb-3">📖 Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><a href="#overview" className="text-indigo-300 hover:underline">Overview: Why this Time Converter?</a></li>
              <li><a href="#how-to-use" className="text-indigo-300 hover:underline">How to Use</a></li>
              <li><a href="#units" className="text-indigo-300 hover:underline">Supported Time Units</a></li>
              <li><a href="#method" className="text-indigo-300 hover:underline">Accurate Conversion Method (seconds-based)</a></li>
              <li><a href="#precision-format" className="text-indigo-300 hover:underline">Precision & Number Formats</a></li>
              <li><a href="#keyboard" className="text-indigo-300 hover:underline">Keyboard Shortcuts & Workflow</a></li>
              <li><a href="#examples" className="text-indigo-300 hover:underline">Worked Examples</a></li>
              <li><a href="#use-cases" className="text-indigo-300 hover:underline">Use Cases</a></li>
              <li><a href="#accuracy" className="text-indigo-300 hover:underline">Accuracy, Rounding & Best Practices</a></li>
              <li><a href="#pitfalls" className="text-indigo-300 hover:underline">Common Pitfalls to Avoid</a></li>
              <li><a href="#quick-ref" className="text-indigo-300 hover:underline">Quick Reference</a></li>
              <li><a href="#glossary" className="text-indigo-300 hover:underline">Glossary</a></li>
              <li><a href="#faq" className="text-indigo-300 hover:underline">FAQ</a></li>
            </ol>
          </nav>
        
          {/* ===== Overview ===== */}
          <h1 id="overview" className="text-3xl font-bold text-indigo-300 mb-6">
            Time Converter — ns, µs, ms, s, min, h, d, wk, month (avg), year (avg)
          </h1>
        
          <p>
            Timelines and schedules appear in every field—from software benchmarks and sensor sampling to project planning,
            contracts, logistics, workouts, and content calendars. This Time Converter covers <strong>nanoseconds</strong> and
            <strong>microseconds</strong> for technical work, all common <strong>human-scale</strong> units (seconds, minutes,
            hours, days, weeks), and <strong>average civil</strong> months/years for deterministic calculations. You get
            <strong>precision control</strong>, three <strong>display formats</strong> (Normal/Compact/Scientific),
            <strong>Favorites</strong>, <strong>History</strong>, <strong>Copy/CSV export</strong>, and
            <strong>shareable URLs</strong>.
          </p>
        
          <p>
            Internally, everything is normalized to <strong>seconds (s)</strong>, the SI base unit of time. That seconds bridge
            ensures reliable, repeatable conversions across tiny and very large time spans.
          </p>
        
          <figure className="my-8">
            <img
              src="/images/time-converter-hero.webp"
              alt="Time Converter UI with seconds, minutes, hours, days, weeks, months and years"
              title="Time Converter — ns ⇄ … ⇄ year (avg)"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Convert instantly between engineering-scale and calendar-like durations with consistent, seconds-based math.
            </figcaption>
          </figure>
        
          {/* ===== How to Use ===== */}
          <h2 id="how-to-use" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">💡 How to Use</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter a number in the <strong>Value</strong> field (empty = 0; commas like <code>1,234.56</code> are ok).</li>
            <li>Select <strong>From</strong> and <strong>To</strong> units. Pin frequent ones using <strong>Favorites</strong>.</li>
            <li>Open <strong>More options</strong> to set <strong>Precision</strong> (0–12) and <strong>Format</strong> (Normal/Compact/Scientific).</li>
            <li>Use <strong>Copy All</strong> for the full grid, or export a <strong>CSV</strong> for spreadsheets and reports.</li>
            <li>Revisit earlier tasks via <strong>Recent</strong> (stores your last 10 conversions locally).</li>
          </ol>
          <p className="text-sm text-slate-400">
            The URL stores your current state—bookmark or share to reproduce the exact configuration.
          </p>
        
          {/* ===== Units ===== */}
          <h2 id="units" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">🌐 Supported Time Units</h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li><strong>Sub-second</strong>: ns, µs, ms</li>
              <li><strong>Core SI</strong>: s (seconds)</li>
              <li><strong>Human-scale</strong>: min, h, d, wk</li>
              <li><strong>Average civil</strong>: month (≈ 30.436875 d), year (≈ 365.2425 d)</li>
            </ul>
            <p className="mt-2 text-slate-400 text-xs">
              Deterministic factors: 1 d = 86,400 s; 1 wk = 604,800 s.
              Average civil year = 365.2425 d; average month = year/12.
            </p>
          </div>
        
          {/* ===== Method ===== */}
          <h2 id="method" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">📐 Accurate Conversion Method (seconds-based)</h2>
          <p>Each conversion uses a two-step seconds bridge:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li><strong>Normalize to seconds</strong>: <code>value_s = value × factor(from → s)</code>.</li>
            <li><strong>Convert to target</strong>: <code>value_target = value_s ÷ factor(to → s)</code>.</li>
          </ol>
          <p>This minimizes drift and keeps engineering and calendar-like values consistent across chains of conversions.</p>
        
          {/* ===== Precision & Formats ===== */}
          <h2 id="precision-format" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">🎯 Precision & Number Formats</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Precision</strong>: 0–2 for schedules, 3–6 for general work, 6–12 for scientific timing.</li>
            <li><strong>Normal</strong>: Clean decimals with trailing-zero trim.</li>
            <li><strong>Compact</strong>: Friendly for very large/small values (e.g., 1.2K, 3.4M when applicable).</li>
            <li><strong>Scientific</strong>: Perfect for ns/µs or multi-year totals.</li>
          </ul>
        
          {/* ===== Keyboard Shortcuts ===== */}
          <h2 id="keyboard" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">⌨️ Keyboard Shortcuts & Workflow</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><kbd>/</kbd> — focus <strong>Value</strong></li>
            <li><kbd>S</kbd> — focus <strong>From</strong>; <kbd>T</kbd> — focus <strong>To</strong></li>
            <li><kbd>X</kbd> — <strong>Swap</strong> From/To instantly</li>
          </ul>
          <p>Pin common units (s, min, h, d) to Favorites for fast, repeatable flows.</p>
        
          {/* ===== Worked Examples ===== */}
          <h2 id="examples" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">📈 Worked Examples (rounded for readability)</h2>
          <ul className="space-y-2">
            <li><strong>2.5 h → min</strong>: 2.5 × 60 = <strong>150 min</strong>.</li>
            <li><strong>10,000 ms → s</strong>: 10,000 ÷ 1000 = <strong>10 s</strong>.</li>
            <li><strong>3 d → h</strong>: 3 × 24 = <strong>72 h</strong>.</li>
            <li><strong>1 wk → d</strong>: <strong>7 d</strong> (604,800 s).</li>
            <li><strong>120 min → h</strong>: 120 ÷ 60 = <strong>2 h</strong>.</li>
            <li><strong>1 year (avg) → s</strong>: 365.2425 × 86,400 ≈ <strong>31,556,952 s</strong>.</li>
            <li><strong>1 month (avg) → s</strong>: (365.2425/12) × 86,400 ≈ <strong>2,629,746 s</strong>.</li>
            <li><strong>500 µs → ms</strong>: 500 ÷ 1000 = <strong>0.5 ms</strong>.</li>
            <li><strong>250 ns → µs</strong>: 250 ÷ 1000 = <strong>0.25 µs</strong>.</li>
          </ul>
        
          {/* ===== Use Cases ===== */}
          <h2 id="use-cases" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">🧰 Real-World Use Cases</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Project & Ops</strong>: Convert estimates between hours, days, and weeks; export CSV for Gantt updates.</li>
            <li><strong>Finance & SLAs</strong>: Translate billing windows (e.g., 15 min) into seconds for automation rules.</li>
            <li><strong>Engineering</strong>: Compare sensor sampling (µs) with processing windows (ms/s).</li>
            <li><strong>Research & Education</strong>: Teach time-scale differences from ns to years with concrete numbers.</li>
            <li><strong>Health & Fitness</strong>: Turn weekly plans into daily schedules with precise minute totals.</li>
            <li><strong>Content & Marketing</strong>: Align posting cadences across hours, days, and weeks.</li>
          </ul>
        
          {/* ===== Accuracy & Best Practices ===== */}
          <h2 id="accuracy" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">✅ Accuracy, Rounding & Best Practices</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Always convert <strong>via seconds</strong> to avoid cumulative drift.</li>
            <li>Carry higher internal precision; round only for display or reporting.</li>
            <li>Use <strong>average civil</strong> month/year for deterministic code; use true calendars when date boundaries matter.</li>
            <li>Document which convention you used (average vs. exact calendar) in specs and reports.</li>
          </ul>
        
          {/* ===== Common Pitfalls ===== */}
          <h2 id="pitfalls" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">⚠️ Common Pitfalls to Avoid</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Average vs Calendar</strong>: Average month/year are stable for math, but real months vary (28–31 days) and leap years exist.</li>
            <li><strong>Time zones/DST</strong>: This tool converts durations, not wall-clock timestamps; DST shifts are separate concerns.</li>
            <li><strong>Early rounding</strong>: Round at the end to prevent error inflation in chained conversions.</li>
          </ul>
        
          {/* ===== Quick Reference ===== */}
          <h2 id="quick-ref" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">🗂️ Quick Reference</h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li>1 min = <strong>60 s</strong></li>
              <li>1 h = <strong>3600 s</strong></li>
              <li>1 d = <strong>86,400 s</strong></li>
              <li>1 wk = <strong>604,800 s</strong></li>
              <li>1 year (avg) ≈ <strong>31,556,952 s</strong></li>
              <li>1 month (avg) ≈ <strong>2,629,746 s</strong></li>
              <li>1 ms = <strong>10⁻³ s</strong></li>
              <li>1 µs = <strong>10⁻⁶ s</strong></li>
              <li>1 ns = <strong>10⁻⁹ s</strong></li>
            </ul>
          </div>
        
          {/* ===== Glossary ===== */}
          <h2 id="glossary" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">📚 Glossary</h2>
          <p className="space-y-2">
            <strong>Seconds (s)</strong>: SI base unit of time.<br/>
            <strong>Average month</strong>: 1/12 of average civil year (~30.436875 days).<br/>
            <strong>Average year</strong>: 365.2425 days (accounts for leap-year cycle on average).<br/>
            <strong>Duration vs Timestamp</strong>: Durations are lengths of time; timestamps are points on a calendar/clock.
          </p>
        
          {/* ===== FAQ ===== */}
          <section className="space-y-6 mt-16">
            <h2 id="faq" className="text-3xl md:text-4xl font-bold mb-4 text-center text-indigo-200">
              ❓ Frequently Asked Questions (FAQ)
            </h2>
        
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q1: Why use average month/year instead of calendar months/years?</h3>
                <p>Average values make math deterministic for code, specs, and docs. If calendar boundaries matter (billing cycles, due dates), use actual dates.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q2: How many seconds are in a day and a week?</h3>
                <p>1 day = 86,400 s; 1 week = 604,800 s.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q3: Can I switch to compact or scientific notation?</h3>
                <p>Yes—choose Normal, Compact, or Scientific and set decimals (0–12) in More options.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q4: Do you support keyboard shortcuts?</h3>
                <p>Yes: “/” for Value, “S” for From, “T” for To, and “X” for Swap.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q5: Can I export all results?</h3>
                <p>Use Copy All for clipboard or download a CSV for the full grid.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q6: Are the month/year factors configurable?</h3>
                <p>Yes—swap to 30/365 style if your project needs simple approximations. Document the choice in your spec.</p>
              </div>
        
            </div>
          </section>
        </section>
        
        {/* =================== Author / Cross-links =================== */}
        <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
          <div className="flex items-center gap-3">
            <img
              src="/images/calculatorhub-author.webp"
              alt="CalculatorHub Tools Team"
              className="w-12 h-12 rounded-full border border-gray-600"
              loading="lazy"
            />
            <div>
              <p className="font-semibold text-white">Author: CalculatorHub Tools Team</p>
              <p className="text-sm text-slate-400">
                Specialists in unit conversion and calculator UX. Last updated:{" "}
                <time dateTime="2025-11-09">November 9, 2025</time>.
              </p>
            </div>
          </div>
        
          <div className="mt-8 bg-gradient-to-r from-indigo-900/40 via-violet-900/40 to-fuchsia-900/40 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              🚀 Explore more tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/energy-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-amber-600/20 text-amber-300 hover:text-amber-200 px-3 py-2 rounded-md border border-slate-700 hover:border-amber-500 transition-all duration-200"
              >
                <span className="text-amber-300">⚡</span> Energy Converter
              </Link>
              <Link
                to="/data-storage-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-cyan-600/20 text-cyan-300 hover:text-cyan-200 px-3 py-2 rounded-md border border-slate-700 hover:border-cyan-500 transition-all duration-200"
              >
                <span className="text-cyan-300">💾</span> Data Storage Converter
              </Link>
              <Link
                to="/mass-weight-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-200 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
              >
                <span className="text-emerald-300">⚖️</span> Mass / Weight Converter
              </Link>
            </div>
          </div>
        </section>


        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/time-converter" category="unit-converters" />
      </div>
    </>
  );
}
