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
  Drive: (p: any) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M3 12h18" />
      <circle cx="8" cy="16" r="1" />
      <circle cx="12" cy="16" r="1" />
      <circle cx="16" cy="16" r="1" />
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

/* ---------------- Units (factors are in BYTES, B) ---------------- */
/* Includes: bits, SI bytes (kB, MB, ...), IEC bytes (KiB, MiB, ...), and bit variants */
const DATA_UNITS = [
  // Bits (SI)
  { key: 'b',     name: 'bit (b)',                  factor: 1/8 },
  { key: 'kb',    name: 'kilobit (kb, 10³)',        factor: 1e3/8 },
  { key: 'Mb',    name: 'megabit (Mb, 10⁶)',        factor: 1e6/8 },
  { key: 'Gb',    name: 'gigabit (Gb, 10⁹)',        factor: 1e9/8 },
  { key: 'Tb',    name: 'terabit (Tb, 10¹²)',       factor: 1e12/8 },
  { key: 'Pb',    name: 'petabit (Pb, 10¹⁵)',       factor: 1e15/8 },

  // Bits (IEC)
  { key: 'Kib',   name: 'kibibit (Kib, 2¹⁰)',       factor: 1024/8 },
  { key: 'Mib',   name: 'mebibit (Mib, 2²⁰)',       factor: Math.pow(1024,2)/8 },
  { key: 'Gib',   name: 'gibibit (Gib, 2³⁰)',       factor: Math.pow(1024,3)/8 },
  { key: 'Tib',   name: 'tebibit (Tib, 2⁴⁰)',       factor: Math.pow(1024,4)/8 },
  { key: 'Pib',   name: 'pebibit (Pib, 2⁵⁰)',       factor: Math.pow(1024,5)/8 },

  // Bytes (base)
  { key: 'B',     name: 'Byte (B)',                 factor: 1 },

  // Bytes (SI / decimal)
  { key: 'kB',    name: 'Kilobyte (kB, 10³)',       factor: 1e3 },
  { key: 'MB',    name: 'Megabyte (MB, 10⁶)',       factor: 1e6 },
  { key: 'GB',    name: 'Gigabyte (GB, 10⁹)',       factor: 1e9 },
  { key: 'TB',    name: 'Terabyte (TB, 10¹²)',      factor: 1e12 },
  { key: 'PB',    name: 'Petabyte (PB, 10¹⁵)',      factor: 1e15 },

  // Bytes (IEC / binary)
  { key: 'KiB',   name: 'Kibibyte (KiB, 2¹⁰)',      factor: 1024 },
  { key: 'MiB',   name: 'Mebibyte (MiB, 2²⁰)',      factor: Math.pow(1024,2) },
  { key: 'GiB',   name: 'Gibibyte (GiB, 2³⁰)',      factor: Math.pow(1024,3) },
  { key: 'TiB',   name: 'Tebibyte (TiB, 2⁴⁰)',      factor: Math.pow(1024,4) },
  { key: 'PiB',   name: 'Pebibyte (PiB, 2⁵⁰)',      factor: Math.pow(1024,5) },
];
const unitMap = Object.fromEntries(DATA_UNITS.map(u => [u.key, u]));
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
  return (value * (f as any).factor) / (t as any).factor;
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
export default function DataStorageConverter() {
  const [valueStr, setValueStr] = useState('');
  const [fromUnit, setFromUnit] = useState('GB');
  const [toUnit, setToUnit] = useState('GiB');
  const [formatMode, setFormatMode] = useState<typeof FORMAT_MODES[number]>('normal');
  const [precision, setPrecision] = useState(6);
  const [favorites, setFavorites] = useLocalStorage<string[]>('datastorage:favorites', ['MB','GB','TB','MiB','GiB','TiB','Mb','Gb']);
  const [history, setHistory] = useLocalStorage<any[]>('datastorage:history', []);

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
    const baseBytes = valueNum * ((unitMap[fromUnit] as any)?.factor || 1);
    const out: Record<string, number> = {};
    for (const u of DATA_UNITS) if (u.key !== fromUnit) out[u.key] = baseBytes / (u as any).factor;
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
    const lines = Object.entries(gridResults).map(([k, v]) => `${(unitMap as any)[k].name}: ${v}`).join('\n');
    if (hasWindow() && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(lines).catch(() => {});
    }
  }
  function exportCSV() {
    const headers = ['Unit','Value'];
    const rows = Object.entries(gridResults).map(([k, v]) => [(unitMap as any)[k].name, String(v)]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = (hasWindow() && URL?.createObjectURL) ? URL.createObjectURL(blob) : null;
      if (url && hasWindow()) {
        const a = document.createElement('a');
        a.href = url; a.download = 'data-storage-conversion.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
      }
    } catch {}
  }

  const favored = DATA_UNITS.filter(u => favorites.includes(u.key));
  const unfavored = DATA_UNITS.filter(u => !favorites.includes(u.key));
  const hasInput = (valueStr || '').trim() !== '';

  return (
    <>
      {/** ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Data Storage Converter — Bits ⇄ Bytes, SI (kB, MB, GB) & IEC (KiB, MiB, GiB) | 2025–2026"
        description="Convert data sizes across bits/bytes, decimal (kB, MB, GB, TB, PB) and binary (KiB, MiB, GiB, TiB, PiB). Precision, Normal/Compact/Scientific formats, favorites, history, CSV export, and shareable URLs."
        keywords={[
          "data storage converter",
          "GB to GiB",
          "MB to MiB",
          "kB vs KiB",
          "bit to byte",
          "bytes to bits",
          "decimal vs binary storage",
          "TB to TiB",
          "convert data units",
          "file size converter",
          "1024 vs 1000"
        ]}
        canonical="https://calculatorhub.site/data-storage-converter"
        schemaData={[
          /* 1) WebPage + Article */
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://calculatorhub.site/data-storage-converter#webpage",
            "url": "https://calculatorhub.site/data-storage-converter",
            "name": "Data Storage Converter — Bits ⇄ Bytes, SI & IEC",
            "inLanguage": "en",
            "isPartOf": { "@id": "https://calculatorhub.site/#website" },
            "primaryImageOfPage": {
              "@type": "ImageObject",
              "@id": "https://calculatorhub.site/images/data-storage-converter-hero.webp#primaryimg",
              "url": "https://calculatorhub.site/images/data-storage-converter-hero.webp",
              "width": 1200,
              "height": 675
            },
            "mainEntity": {
              "@type": "Article",
              "@id": "https://calculatorhub.site/data-storage-converter#article",
              "headline": "Data Storage Converter — Fast, Accurate, Shareable",
              "description": "Convert between bits/bytes and SI/IEC units with precision controls, favorites, history, keyboard shortcuts, and CSV export.",
              "image": ["https://calculatorhub.site/images/data-storage-converter-hero.webp"],
              "author": { "@type": "Organization", "name": "CalculatorHub", "url": "https://calculatorhub.site" },
              "publisher": { "@id": "https://calculatorhub.site/#organization" },
              "datePublished": "2025-11-09",
              "dateModified": "2025-11-09",
              "mainEntityOfPage": { "@id": "https://calculatorhub.site/data-storage-converter#webpage" },
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
            "@id": "https://calculatorhub.site/data-storage-converter#breadcrumbs",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://calculatorhub.site/" },
              { "@type": "ListItem", "position": 2, "name": "Unit Converters", "item": "https://calculatorhub.site/category/unit-converters" },
              { "@type": "ListItem", "position": 3, "name": "Data Storage Converter", "item": "https://calculatorhub.site/data-storage-converter" }
            ]
          },
      
          /* 3) FAQ */
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://calculatorhub.site/data-storage-converter#faq",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What’s the difference between GB and GiB?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "GB is decimal (10^9 bytes), GiB is binary (2^30 bytes). 1 GB ≈ 0.931 GiB, and 1 GiB ≈ 1.074 GB."
                }
              },
              {
                "@type": "Question",
                "name": "Do you support both SI and IEC units?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Decimal (kB, MB, GB, TB, PB) and binary (KiB, MiB, GiB, TiB, PiB), plus bits/bytes and their kilo/mega/giga/peta forms."
                }
              },
              {
                "@type": "Question",
                "name": "Can I copy or export the results?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "You can copy all values to clipboard or download a CSV. Your preferences persist in the URL for easy sharing."
                }
              },
              {
                "@type": "Question",
                "name": "Does the tool save my favorites and history?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes—up to 10 recent conversions and your favorite units are stored locally in your browser."
                }
              }
            ]
          },
      
          /* 4) WebApplication */
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://calculatorhub.site/data-storage-converter#webapp",
            "name": "Data Storage Converter",
            "url": "https://calculatorhub.site/data-storage-converter",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web",
            "description": "Convert data sizes between bits/bytes and SI/IEC units with precision controls, favorites, history, and CSV export.",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "image": ["https://calculatorhub.site/images/data-storage-converter-hero.webp"]
          },
      
          /* 5) SoftwareApplication */
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://calculatorhub.site/data-storage-converter#software",
            "name": "Advanced Data Storage Converter",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "All",
            "url": "https://calculatorhub.site/data-storage-converter",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "description": "Interactive data size converter with shareable links and CSV export."
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
      <link rel="canonical" href="https://calculatorhub.site/data-storage-converter" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/data-storage-converter" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/data-storage-converter" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/data-storage-converter" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Data Storage Converter — Bits ⇄ Bytes, SI & IEC" />
      <meta property="og:description" content="Fast, accurate conversions across bits/bytes and SI/IEC units. Precision controls, favorites, history, CSV export." />
      <meta property="og:url" content="https://calculatorhub.site/data-storage-converter" />
      <meta property="og:image" content="https://calculatorhub.site/images/data-storage-converter-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Data storage converter UI with SI/IEC toggle and formatted results" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Data Storage Converter — Bits ⇄ Bytes, SI (kB, MB, GB) & IEC (KiB, MiB, GiB)" />
      <meta name="twitter:description" content="Convert file sizes with precision. Normal/Compact/Scientific formats, favorites, history, CSV." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/data-storage-converter-hero.webp" />
      <meta name="twitter:creator" content="@CalculatorHub" />
      <meta name="twitter:site" content="@CalculatorHub" />
      
      {/** PWA & theme */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#071926" />
      
      {/** Performance */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="preload" as="image" href="/images/data-storage-converter-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />


      <div className="max-w-5xl mx-auto text-gray-200">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Data Storage Converter', url: '/data-storage-converter' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 rounded-2xl p-6 bg-gradient-to-r from-cyan-900 via-sky-900 to-indigo-900 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">Data Storage Converter (Advanced)</h1>
          <p className="text-gray-300">
            SI vs IEC units, bits & bytes, precision control, favorites, history, and shareable links.
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
                  className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  aria-label="Enter data amount"
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
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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
              className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-500 flex items-center gap-2"
              title="Swap From/To (X)"
            >
              <Icon.Swap style={{ width: 16, height: 16 }} /> Swap
            </button>
          </div>

          {/* Direct result */}
          <div className="rounded-xl bg-gray-800 border border-gray-700 p-4 mb-6">
            <div className="text-sm text-gray-400 mb-1">
              Result ({(unitMap as any)[fromUnit]?.name} → {(unitMap as any)[toUnit]?.name})
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
                <input type="range" min={0} max={12} value={precision} onChange={(e) => setPrecision(+e.target.value)} className="w-full accent-cyan-500" />
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
            {DATA_UNITS.map((unit) => {
              if (unit.key === fromUnit) return null;
              const val = gridResults[unit.key];
              const display = formatNumber(val ?? 0, formatMode, precision);
              return (
                <div key={unit.key} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:bg-gray-700/70 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon.Drive style={{ width: 16, height: 16, color: '#22d3ee' }} />
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

        {/* =============== SEO Content Section (~1800–2000 words) ==================== */}
          <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          
            {/* ===== Table of Contents ===== */}
            <nav className="mt-2 mb-10 bg-[#0b1220] border border-[#1f2a44] rounded-xl p-5 text-slate-200">
              <h2 className="text-lg font-semibold text-gray-100 mb-3">📖 Table of Contents</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li><a href="#overview" className="text-cyan-300 hover:underline">Overview: Why this Data Storage Converter?</a></li>
                <li><a href="#how-to-use" className="text-cyan-300 hover:underline">How to Use</a></li>
                <li><a href="#units" className="text-cyan-300 hover:underline">Supported Units (Bits/Bytes, SI vs IEC)</a></li>
                <li><a href="#method" className="text-cyan-300 hover:underline">Accurate Conversion Method (Byte-based)</a></li>
                <li><a href="#precision-format" className="text-cyan-300 hover:underline">Precision & Number Formats</a></li>
                <li><a href="#keyboard" className="text-cyan-300 hover:underline">Keyboard Shortcuts & Workflow</a></li>
                <li><a href="#examples" className="text-cyan-300 hover:underline">Worked Examples</a></li>
                <li><a href="#use-cases" className="text-cyan-300 hover:underline">Use Cases</a></li>
                <li><a href="#accuracy" className="text-cyan-300 hover:underline">Accuracy, Rounding & Best Practices</a></li>
                <li><a href="#pitfalls" className="text-cyan-300 hover:underline">Common Pitfalls to Avoid</a></li>
                <li><a href="#quick-ref" className="text-cyan-300 hover:underline">Quick Reference</a></li>
                <li><a href="#glossary" className="text-cyan-300 hover:underline">Glossary</a></li>
                <li><a href="#faq" className="text-cyan-300 hover:underline">FAQ</a></li>
              </ol>
            </nav>
          
            {/* ===== Overview ===== */}
            <h1 id="overview" className="text-3xl font-bold text-cyan-300 mb-6">
              Data Storage Converter — Bits, Bytes, kB/MB/GB vs KiB/MiB/GiB — fast & precise
            </h1>
          
            <p>
              File sizes, disk capacities, database exports, network plans, cloud invoices—each uses different storage units.
              The <strong>CalculatorHub Data Storage Converter</strong> makes these differences crystal clear by converting
              instantly across <strong>bits</strong> and <strong>bytes</strong>, across <strong>decimal (SI)</strong> units
              (<em>kB, MB, GB, TB, PB</em>) and <strong>binary (IEC)</strong> units (<em>KiB, MiB, GiB, TiB, PiB</em>).
              You get <strong>precision control</strong>, three <strong>display formats</strong> (Normal/Compact/Scientific),
              <strong>Favorites</strong>, <strong>History</strong>, <strong>Copy/CSV export</strong>, and <strong>shareable URLs</strong>.
            </p>
          
            <p>
              Under the hood, every value is normalized to <strong>Bytes (B)</strong>. From there, conversions to any target unit
              remain consistent and accurate—no matter whether you started with <em>Gb</em> for network throughput, <em>GB</em> for
              marketing capacity, or <em>GiB</em> for OS-level storage reporting.
            </p>
          
            <figure className="my-8">
              <img
                src="/images/data-storage-converter-hero.webp"
                alt="Data Storage Converter UI with SI/IEC units, precision & format controls"
                title="Data Storage Converter — Bits ⇄ Bytes, kB/MB/GB ⇄ KiB/MiB/GiB"
                className="rounded-lg shadow-md border border-slate-700 mx-auto"
                loading="lazy"
              />
              <figcaption className="text-center text-sm text-slate-400 mt-2">
                Convert across decimal (×1000) and binary (×1024) systems with Favorites/History and one-click CSV export.
              </figcaption>
            </figure>
          
            {/* ===== How to Use ===== */}
            <h2 id="how-to-use" className="text-2xl font-semibold text-cyan-200 mt-10 mb-4">💡 How to Use</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Enter a number in the <strong>Value</strong> field (empty counts as 0; commas like <code>1,234.56</code> are OK).</li>
              <li>Select your <strong>From</strong> and <strong>To</strong> units (pin favorites for one-click reuse).</li>
              <li>Open <strong>More options</strong> to set <strong>Precision</strong> (0–12) and choose <strong>Format</strong> (Normal/Compact/Scientific).</li>
              <li>Use <strong>Copy All</strong> for the full grid, or <strong>CSV</strong> to export into spreadsheets.</li>
              <li>Revisit past activity using <strong>Recent</strong> (stores the last 10 conversions locally in your browser).</li>
            </ol>
            <p className="text-sm text-slate-400">
              Your current state (value/units/format/precision) is embedded in the page URL—bookmark or share to reproduce the view.
            </p>
          
            {/* ===== Units ===== */}
            <h2 id="units" className="text-2xl font-semibold text-cyan-200 mt-10 mb-4">
              🌐 Supported Units (Bits/Bytes, SI vs IEC)
            </h2>
            <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <li><strong>Bits (SI decimal)</strong>: b, kb, Mb, Gb, Tb, Pb (×1000 scale, then ÷8 to bytes).</li>
                <li><strong>Bits (IEC binary)</strong>: Kib, Mib, Gib, Tib, Pib (×1024 scale, then ÷8 to bytes).</li>
                <li><strong>Bytes (base)</strong>: B (1 Byte = 8 bits).</li>
                <li><strong>Bytes (SI decimal)</strong>: kB, MB, GB, TB, PB (powers of 10: 10³, 10⁶, 10⁹, 10¹², 10¹⁵).</li>
                <li><strong>Bytes (IEC binary)</strong>: KiB, MiB, GiB, TiB, PiB (powers of 2: 2¹⁰, 2²⁰, 2³⁰, 2⁴⁰, 2⁵⁰).</li>
              </ul>
            </div>
          
            {/* ===== Method ===== */}
            <h2 id="method" className="text-2xl font-semibold text-cyan-200 mt-10 mb-4">📐 Accurate Conversion Method (Byte-based)</h2>
            <p>
              Conversions use a two-stage path via <strong>Bytes (B)</strong>:
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li><strong>Normalize to Bytes</strong>: <code>value_B = value × factor(from → B)</code>.</li>
              <li><strong>Convert to target</strong>: <code>value_target = value_B ÷ factor(to → B)</code>.</li>
            </ol>
            <p>
              This guarantees consistent results whether you’re converting Gb → GiB, MB → MiB, TB → TiB, or any other mix.
            </p>
          
            {/* ===== Precision & Formats ===== */}
            <h2 id="precision-format" className="text-2xl font-semibold text-cyan-200 mt-10 mb-4">🎯 Precision & Number Formats</h2>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Precision</strong>: Reports/dashboards: 0–2; technical docs: 3–6; research/benchmarking: 6–12.</li>
              <li><strong>Normal</strong>: Clean decimal formatting (trims trailing zeros).</li>
              <li><strong>Compact</strong>: Human-friendly large/small values (e.g., 1.2K, 3.4M).</li>
              <li><strong>Scientific</strong>: Perfect for extremes (petascale or tiny bit-level figures).</li>
            </ul>
            <p className="text-sm text-slate-400">
              When magnitudes are very large or very small, Normal may auto-switch to scientific for readability.
            </p>
          
            {/* ===== Keyboard Shortcuts ===== */}
            <h2 id="keyboard" className="text-2xl font-semibold text-cyan-200 mt-10 mb-4">⌨️ Keyboard Shortcuts & Workflow</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><kbd>/</kbd> — focus the <strong>Value</strong> field.</li>
              <li><kbd>S</kbd> — focus <strong>From</strong> unit; <kbd>T</kbd> — focus <strong>To</strong> unit.</li>
              <li><kbd>X</kbd> — <strong>Swap</strong> From/To units instantly.</li>
            </ul>
            <p>Pin your most used units with <strong>Favorites</strong> to speed up daily workflows.</p>
          
            {/* ===== Worked Examples ===== */}
            <h2 id="examples" className="text-2xl font-semibold text-cyan-200 mt-10 mb-4">📈 Worked Examples (rounded for readability)</h2>
            <ul className="space-y-2">
              <li><strong>1 GB → GiB</strong>: 1 GB = 10⁹ B; 1 GiB = 2³⁰ B ≈ 1.074×10⁹ B. So 1 GB ≈ <strong>0.931 GiB</strong>.</li>
              <li><strong>1 GiB → GB</strong>: 1 GiB = 2³⁰ B ≈ 1.074×10⁹ B. So 1 GiB ≈ <strong>1.074 GB</strong>.</li>
              <li><strong>512 MB → MiB</strong>: 512×10⁶ B ÷ 2²⁰ B ≈ <strong>488.3 MiB</strong>.</li>
              <li><strong>750 MiB → MB</strong>: 750×2²⁰ B ÷ 10⁶ B ≈ <strong>786.4 MB</strong>.</li>
              <li><strong>1000 kB → KiB</strong>: 1000×10³ B ÷ 1024 ≈ <strong>976.6 KiB</strong>.</li>
              <li><strong>10 Gb (gigabits) → GB</strong>: 10×10⁹ bits ÷ 8 ÷ 10⁹ ≈ <strong>1.25 GB</strong>.</li>
              <li><strong>1 TB → TiB</strong>: 10¹² B ÷ 2⁴⁰ B ≈ <strong>0.909 TiB</strong>.</li>
              <li><strong>5 TiB → TB</strong>: 5×2⁴⁰ B ÷ 10¹² B ≈ <strong>5.495 TB</strong>.</li>
            </ul>
          
            {/* ===== Use Cases ===== */}
            <h2 id="use-cases" className="text-2xl font-semibold text-cyan-200 mt-10 mb-4">🧰 Real-World Use Cases</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>IT & DevOps</strong>: Compare storage specs (GB) vs OS reporting (GiB), plan snapshots/backups.</li>
              <li><strong>Cloud & Billing</strong>: Normalize vendor-reported GB/TB with app-level MiB/GiB for accurate cost models.</li>
              <li><strong>Networking</strong>: Translate link speeds (Gb) into byte-based capacities for realistic throughput.</li>
              <li><strong>Data Engineering</strong>: Size pipelines, partitions, and retention using consistent units.</li>
              <li><strong>Product & Support</strong>: Explain “why my 1 TB drive shows ~0.91 TiB” with precise math.</li>
            </ul>
          
            {/* ===== Accuracy & Best Practices ===== */}
            <h2 id="accuracy" className="text-2xl font-semibold text-cyan-200 mt-10 mb-4">✅ Accuracy, Rounding & Best Practices</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Convert <strong>via Bytes</strong> to avoid cross-system rounding drift.</li>
              <li>Keep internal precision high; apply display rounding last for clean reports.</li>
              <li>Use <strong>Scientific</strong> format for petascale values or bit-level details.</li>
              <li>Always state whether you’re using <strong>decimal (SI)</strong> or <strong>binary (IEC)</strong> units.</li>
            </ul>
          
            {/* ===== Common Pitfalls ===== */}
            <h2 id="pitfalls" className="text-2xl font-semibold text-cyan-200 mt-10 mb-4">⚠️ Common Pitfalls to Avoid</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>GB vs GiB</strong>: Marketing (decimal) vs OS (binary). They differ by about <strong>7.37%</strong>.</li>
              <li><strong>kB vs kb</strong>: k<strong>B</strong> = kilobyte; k<strong>b</strong> = kilobit (divide by 8 to reach bytes).</li>
              <li><strong>Network “MB/s” vs “Mb/s”</strong>: Bytes per second vs bits per second—verify unit case carefully.</li>
              <li><strong>Cluster sizing</strong>: Mixing MB/MiB or GB/GiB in capacity planning can over/under-provision.</li>
            </ul>
          
            {/* ===== Quick Reference ===== */}
            <h2 id="quick-ref" className="text-2xl font-semibold text-cyan-200 mt-10 mb-4">🗂️ Quick Reference</h2>
            <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <li>1 Byte (B) = <strong>8 bits</strong>.</li>
                <li>1 kB (SI) = <strong>1,000 B</strong>; 1 KiB (IEC) = <strong>1,024 B</strong>.</li>
                <li>1 MB (SI) = <strong>10⁶ B</strong>; 1 MiB (IEC) = <strong>2²⁰ B</strong>.</li>
                <li>1 GB (SI) = <strong>10⁹ B</strong>; 1 GiB (IEC) = <strong>2³⁰ B</strong>.</li>
                <li>1 TB (SI) = <strong>10¹² B</strong>; 1 TiB (IEC) = <strong>2⁴⁰ B</strong>.</li>
                <li>1 GB ≈ <strong>0.931 GiB</strong>; 1 GiB ≈ <strong>1.074 GB</strong>.</li>
                <li>1 Gb (gigabit) = <strong>10⁹ bits</strong> ≈ <strong>125 MB</strong> (decimal) = <strong>119.2 MiB</strong> (binary).</li>
              </ul>
            </div>
          
            {/* ===== Glossary ===== */}
            <h2 id="glossary" className="text-2xl font-semibold text-cyan-200 mt-10 mb-4">📚 Glossary</h2>
            <p className="space-y-2">
              <strong>Bit (b)</strong>: Smallest unit; 0 or 1. <br/>
              <strong>Byte (B)</strong>: 8 bits. Base for file sizes. <br/>
              <strong>SI (decimal)</strong>: Powers of 10 (kB=10³ B, MB=10⁶ B, GB=10⁹ B…). <br/>
              <strong>IEC (binary)</strong>: Powers of 2 (KiB=2¹⁰ B, MiB=2²⁰ B, GiB=2³⁰ B…). <br/>
              <strong>Throughput</strong>: Transfer rate (often in bits/s), not capacity. <br/>
              <strong>Capacity</strong>: Stored data volume (usually in bytes).
            </p>
          
            {/* ===== FAQ ===== */}
            <section className="space-y-6 mt-16">
              <h2 id="faq" className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-200">
                ❓ Frequently Asked Questions (FAQ)
              </h2>
          
              <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-sky-300">Q1: What’s the difference between GB and GiB?</h3>
                  <p><strong>GB</strong> is decimal (10⁹ B). <strong>GiB</strong> is binary (2³⁰ B). 1 GB ≈ 0.931 GiB; 1 GiB ≈ 1.074 GB.</p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-sky-300">Q2: Do you support both SI and IEC units?</h3>
                  <p>Yes—decimal (kB, MB, GB, TB, PB) and binary (KiB, MiB, GiB, TiB, PiB), plus their bit variants (kb/Mb/Gb, Kib/Mib/Gib).</p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-sky-300">Q3: Can I copy/export all results?</h3>
                  <p>Use <strong>Copy All</strong> to send the grid to your clipboard or <strong>CSV</strong> to download and analyze in a spreadsheet.</p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-sky-300">Q4: Where are Favorites and Recent stored?</h3>
                  <p>Locally in your browser (privacy-friendly). Recent keeps your last 10 conversions on the device.</p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-sky-300">Q5: Why does a “1 TB” drive show ~0.91 TiB?</h3>
                  <p>Manufacturers use decimal TB (=10¹² B). Operating systems often display binary TiB (=2⁴⁰ B). 10¹² ÷ 2⁴⁰ ≈ 0.909 TiB.</p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-sky-300">Q6: What’s the difference between Mb/s and MB/s?</h3>
                  <p><strong>Mb/s</strong> is megabits per second (network); <strong>MB/s</strong> is megabytes per second (capacity/transfer). 1 MB/s = 8 Mb/s.</p>
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
          
            <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
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
                  to="/pressure-converter"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-200 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
                >
                  <span className="text-emerald-300">🟩</span> Pressure Converter
                </Link>
                <Link
                  to="/area-converter"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-200 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
                >
                  <span className="text-sky-300">⬛</span> Area Converter
                </Link>
              </div>
            </div>
          </section>


        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/data-storage-converter" category="unit-converters" />
      </div>
    </>
  );
}
