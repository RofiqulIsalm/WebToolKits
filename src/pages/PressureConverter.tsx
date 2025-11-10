import React, { useEffect, useMemo, useRef, useState } from 'react';
// Project components
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

/* ---------------- Icons (inline, no deps) ---------------- */
const Icon = {
  Gauge: (p) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-18 0" />
      <path d="M12 3v3M4.6 5.6l2.1 2.1M3 12h3M18.3 7.7l-2.1 2.1M21 12h-3" />
      <path d="M12 12l4-3" />
    </svg>
  ),
  Star: (p) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="currentColor">
      <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.401 8.168L12 18.896l-7.335 3.869 1.401-8.168L.132 9.21l8.2-1.192z" />
    </svg>
  ),
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
};

/* ---------------- Units (factors are in Pascals, Pa) ---------------- */
const PRESSURE_UNITS = [
  // SI / metric
  { key: 'Pa',    name: 'Pascal (Pa)',                factor: 1 },
  { key: 'kPa',   name: 'Kilopascal (kPa)',           factor: 1_000 },
  { key: 'MPa',   name: 'Megapascal (MPa)',           factor: 1_000_000 },
  { key: 'GPa',   name: 'Gigapascal (GPa)',           factor: 1_000_000_000 },
  { key: 'bar',   name: 'Bar (bar)',                  factor: 100_000 },
  { key: 'mbar',  name: 'Millibar (mbar)',            factor: 100 },
  { key: 'hPa',   name: 'Hectopascal (hPa)',          factor: 100 },             // = mbar

  // Atmospheres / torr / mmHg
  { key: 'atm',   name: 'Standard atmosphere (atm)',  factor: 101_325 },
  { key: 'torr',  name: 'Torr (Torr)',                factor: 101_325 / 760 },   // ≈ 133.322368421
  { key: 'mmHg',  name: 'Millimeter of mercury (mmHg)', factor: 133.322387415 }, // conventional mmHg

  // US customary / imperial
  { key: 'psi',   name: 'Pound per square inch (psi)', factor: 6_894.757293168 },
  { key: 'psf',   name: 'Pound per square foot (psf)', factor: 47.88025898033584 },
  { key: 'inHg',  name: 'Inch of mercury (inHg)',      factor: 3_386.389 },      // at 0°C, standard gravity

  // Technical
  { key: 'kgfcm2', name: 'kgf per cm² (kgf/cm²)',      factor: 98_066.5 },       // ≈ technical atmosphere
];
const unitMap = Object.fromEntries(PRESSURE_UNITS.map(u => [u.key, u]));
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
export default function PressureConverter() {
  const [valueStr, setValueStr] = useState('');
  const [fromUnit, setFromUnit] = useState('kPa');
  const [toUnit, setToUnit] = useState('psi');
  const [formatMode, setFormatMode] = useState<typeof FORMAT_MODES[number]>('normal');
  const [precision, setPrecision] = useState(6);
  const [favorites, setFavorites] = useLocalStorage<string[]>('pressure:favorites', ['kPa','bar','psi','atm','mbar']);
  const [history, setHistory] = useLocalStorage<any[]>('pressure:history', []);

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
    const basePa = valueNum * ((unitMap[fromUnit] && unitMap[fromUnit].factor) || 1);
    const out: Record<string, number> = {};
    for (const u of PRESSURE_UNITS) if (u.key !== fromUnit) out[u.key] = basePa / u.factor;
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
      if (fmt && FORMAT_MODES.includes(fmt as any)) setFormatMode(fmt as any);
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
    setFavorites(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k].slice(0, 5));
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
        a.href = url; a.download = 'pressure-conversion.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
      }
    } catch {}
  }

  const favored = PRESSURE_UNITS.filter(u => favorites.includes(u.key));
  const unfavored = PRESSURE_UNITS.filter(u => !favorites.includes(u.key));
  const hasInput = (valueStr || '').trim() !== '';

  return (
    <>
      {/** ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Pressure Converter — Pa ⇄ kPa, bar, atm, psi, torr, mmHg, inHg (2025–2026)"
        description="Free Pressure Converter with precision control, Normal/Compact/Scientific formats, favorites, history, CSV export, and shareable URLs. Convert between Pa, kPa, MPa, bar, atm, psi, psf, torr, mmHg, inHg, hPa/mbar, kgf/cm²."
        keywords={[
          "pressure converter",
          "kPa to psi",
          "psi to kPa",
          "bar to psi",
          "psi to bar",
          "atm to kPa",
          "torr to Pa",
          "mmHg to kPa",
          "inHg to kPa",
          "hPa to mbar",
          "kgf/cm2 to bar",
          "MPa to psi",
          "Pa to bar",
          "psf to psi",
          "convert pressure units"
        ]}
        canonical="https://calculatorhub.site/pressure-converter"
        schemaData={[
          /* 1) WebPage + Article */
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://calculatorhub.site/pressure-converter#webpage",
            "url": "https://calculatorhub.site/pressure-converter",
            "name": "Pressure Converter (2025–2026) — Pa ⇄ kPa, bar, atm, psi, torr, mmHg, inHg",
            "inLanguage": "en",
            "isPartOf": { "@id": "https://calculatorhub.site/#website" },
            "primaryImageOfPage": {
              "@type": "ImageObject",
              "@id": "https://calculatorhub.site/images/pressure-converter-hero.webp#primaryimg",
              "url": "https://calculatorhub.site/images/pressure-converter-hero.webp",
              "width": 1200,
              "height": 675
            },
            "mainEntity": {
              "@type": "Article",
              "@id": "https://calculatorhub.site/pressure-converter#article",
              "headline": "Pressure Converter — Fast, Accurate, and Shareable",
              "description": "Convert Pa, kPa, MPa, GPa, bar, mbar/hPa, atm, torr, mmHg, inHg, psi, psf, and kgf/cm² with precision & format controls, favorites, history, keyboard shortcuts, and CSV export.",
              "image": ["https://calculatorhub.site/images/pressure-converter-hero.webp"],
              "author": { "@type": "Organization", "name": "CalculatorHub", "url": "https://calculatorhub.site" },
              "publisher": { "@id": "https://calculatorhub.site/#organization" },
              "datePublished": "2025-11-09",
              "dateModified": "2025-11-09",
              "mainEntityOfPage": { "@id": "https://calculatorhub.site/pressure-converter#webpage" },
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
            "@id": "https://calculatorhub.site/pressure-converter#breadcrumbs",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://calculatorhub.site/" },
              { "@type": "ListItem", "position": 2, "name": "Unit Converters", "item": "https://calculatorhub.site/category/unit-converters" },
              { "@type": "ListItem", "position": 3, "name": "Pressure Converter", "item": "https://calculatorhub.site/pressure-converter" }
            ]
          },
      
          /* 3) FAQ */
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://calculatorhub.site/pressure-converter#faq",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Which pressure units are supported?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Pa, kPa, MPa, GPa, bar, mbar, hPa, atm, torr, mmHg, inHg, psi, psf, and kgf/cm²."
                }
              },
              {
                "@type": "Question",
                "name": "Is hPa the same as mbar?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. 1 hPa equals 1 mbar (both equal 100 Pa)."
                }
              },
              {
                "@type": "Question",
                "name": "What’s the relation between torr and mmHg?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "1 torr is defined as 101325/760 Pa (≈133.322 Pa). 1 mmHg (conventional) is approximately 133.322387 Pa, effectively equal for most practical work."
                }
              },
              {
                "@type": "Question",
                "name": "Can I copy or export all results?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Copy the full grid or download a CSV. Options are also persisted in the URL for easy sharing."
                }
              },
              {
                "@type": "Question",
                "name": "Does it save favorites and recent conversions?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Favorites and the last 10 conversions are stored locally in your browser."
                }
              }
            ]
          },
      
          /* 4) WebApplication */
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://calculatorhub.site/pressure-converter#webapp",
            "name": "Pressure Converter",
            "url": "https://calculatorhub.site/pressure-converter",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web",
            "description": "Pressure conversion with precision controls, Normal/Compact/Scientific formats, favorites, history, and CSV export.",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "image": ["https://calculatorhub.site/images/pressure-converter-hero.webp"]
          },
      
          /* 5) SoftwareApplication */
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://calculatorhub.site/pressure-converter#software",
            "name": "Advanced Pressure Converter",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "All",
            "url": "https://calculatorhub.site/pressure-converter",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "description": "Interactive pressure unit converter with shareable links and CSV export."
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
      <link rel="canonical" href="https://calculatorhub.site/pressure-converter" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/pressure-converter" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/pressure-converter" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/pressure-converter" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Pressure Converter (2025–2026) — Pa, kPa, bar, atm, psi, torr, mmHg, inHg" />
      <meta property="og:description" content="Convert pressure units with precision controls, Normal/Compact/Scientific formats, favorites, history, and CSV export." />
      <meta property="og:url" content="https://calculatorhub.site/pressure-converter" />
      <meta property="og:image" content="https://calculatorhub.site/images/pressure-converter-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Pressure converter UI showing unit swapping and formatted results" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Pressure Converter — Pa, kPa, bar, atm, psi, torr & more" />
      <meta name="twitter:description" content="Fast, accurate pressure conversions with precision controls, favorites, history, and CSV export." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/pressure-converter-hero.webp" />
      <meta name="twitter:creator" content="@CalculatorHub" />
      <meta name="twitter:site" content="@CalculatorHub" />
      
      {/** PWA & theme */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#111827" />
      
      {/** Performance */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="preload" as="image" href="/images/pressure-converter-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />


      <div className="max-w-5xl mx-auto text-gray-200">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Pressure Converter', url: '/pressure-converter' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 rounded-2xl p-6 bg-gradient-to-r from-slate-900 via-gray-900 to-zinc-900 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">Pressure Converter (Advanced)</h1>
          <p className="text-gray-300">
            Two-way conversion, precision control, favorites, history, and shareable links.
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
                  className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  aria-label="Enter pressure value"
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
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
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
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
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
              className="px-3 py-2 rounded-xl bg-gray-600 hover:bg-gray-500 text-white border border-gray-500 flex items-center gap-2"
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
                <input type="range" min={0} max={12} value={precision} onChange={(e) => setPrecision(+e.target.value)} className="w-full accent-gray-500" />
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
            {PRESSURE_UNITS.map((unit) => {
              if (unit.key === fromUnit) return null;
              const val = gridResults[unit.key];
              const display = formatNumber(val ?? 0, formatMode, precision);
              return (
                <div key={unit.key} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:bg-gray-700/70 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon.Gauge style={{ width: 16, height: 16, color: '#9ca3af' }} />
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

        {/* ==================== SEO Content Section (~2000 words) ==================== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
        
          {/* ===== Table of Contents ===== */}
          <nav className="mt-2 mb-10 bg-[#0f172a] border border-[#334155] rounded-xl p-5 text-slate-200">
            <h2 className="text-lg font-semibold text-gray-100 mb-3">📖 Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><a href="#overview" className="text-emerald-400 hover:underline">Overview: What this Pressure Converter does</a></li>
              <li><a href="#how-to-use" className="text-emerald-400 hover:underline">How to Use</a></li>
              <li><a href="#units" className="text-emerald-400 hover:underline">Supported Units (SI/Metric, Imperial/US, Technical)</a></li>
              <li><a href="#method" className="text-emerald-400 hover:underline">Accurate Conversion Method (Pa-based)</a></li>
              <li><a href="#precision-format" className="text-emerald-400 hover:underline">Precision & Number Formats</a></li>
              <li><a href="#keyboard" className="text-emerald-400 hover:underline">Keyboard Shortcuts & Workflow</a></li>
              <li><a href="#examples" className="text-emerald-400 hover:underline">Worked Examples</a></li>
              <li><a href="#use-cases" className="text-emerald-400 hover:underline">Use Cases</a></li>
              <li><a href="#accuracy" className="text-emerald-400 hover:underline">Accuracy, Rounding & Best Practices</a></li>
              <li><a href="#pitfalls" className="text-emerald-400 hover:underline">Common Pitfalls to Avoid</a></li>
              <li><a href="#quick-ref" className="text-emerald-400 hover:underline">Quick Reference</a></li>
              <li><a href="#glossary" className="text-emerald-400 hover:underline">Glossary: atm, bar, psi, torr/mmHg</a></li>
              <li><a href="#faq" className="text-emerald-400 hover:underline">FAQ</a></li>
            </ol>
          </nav>
        
          {/* ===== Overview ===== */}
          <h1 id="overview" className="text-3xl font-bold text-emerald-400 mb-6">
            Pressure Converter — Pa, kPa, MPa, bar, atm, psi, torr, mmHg, inHg, psf, hPa/mbar, kgf/cm² — fast & accurate
          </h1>
        
          <p>
            Whether you work in industrial systems, HVAC, automotive, hydraulics, materials testing, or meteorology—you
            routinely need to read and compare pressure in different units. The <strong>CalculatorHub Pressure Converter</strong>
            converts between popular units instantly with <strong>precision control</strong>, <strong>three display formats</strong>
            (Normal/Compact/Scientific), <strong>Favorites</strong>, <strong>History</strong>, <strong>Copy/CSV export</strong>, and
            <strong> shareable URLs</strong>.
          </p>
        
          <p>
            Internally, every conversion is anchored to <em>Pascal (Pa)</em> as the base unit. Using exact Pa factors for each
            unit keeps results consistent, traceable, and stable. From <em>hPa/mbar</em> for weather reports to
            <em> MPa/GPa</em> for engineering, and <em>psi/bar</em> for service manuals—you’ll find everything in one place.
          </p>
        
          <figure className="my-8">
            <img
              src="/images/pressure-converter-hero.webp"
              alt="Pressure Converter UI with unit swapping, precision and format controls"
              title="Pressure Converter — Pa ⇄ kPa ⇄ bar ⇄ atm ⇄ psi ⇄ torr/mmHg ⇄ inHg"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              One-click pressure conversion with precision/format controls, Favorites/History, Copy & CSV export, plus shareable URLs.
            </figcaption>
          </figure>
        
          {/* ===== How to Use ===== */}
          <h2 id="how-to-use" className="text-2xl font-semibold text-emerald-300 mt-10 mb-4">💡 How to Use</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter a value in the <strong>Value</strong> field (empty counts as 0; commas like 1,234.56 are allowed).</li>
            <li>Select your <strong>From</strong> and <strong>To</strong> units.</li>
            <li>Open <strong>More options</strong> to adjust <strong>Precision</strong> (0–12) and <strong>Format</strong> (Normal/Compact/Scientific).</li>
            <li>Use <strong>Copy All</strong> to copy the full grid, or <strong>CSV</strong> to export to a spreadsheet.</li>
            <li>Pin frequently used units in <strong>Favorites</strong>; jump back using the <strong>Recent</strong> panel.</li>
          </ol>
          <p className="text-sm text-slate-400">
            State (value/units/format/precision) is persisted in the URL—bookmark or share to reproduce the same view.
          </p>
        
          {/* ===== Units ===== */}
          <h2 id="units" className="text-2xl font-semibold text-emerald-300 mt-10 mb-4">
            🌍 Supported Units (SI/Metric, Imperial/US, Technical)
          </h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li><strong>Pa, kPa, MPa, GPa</strong> — SI/metric standard units.</li>
              <li><strong>bar, mbar, hPa</strong> — 1 bar = 100,000 Pa; 1 mbar = 1 hPa = 100 Pa.</li>
              <li><strong>atm</strong> — standard atmosphere; 1 atm = 101,325 Pa.</li>
              <li><strong>torr</strong> — defined as 101,325/760 Pa ≈ 133.322 Pa.</li>
              <li><strong>mmHg</strong> — conventional mmHg ≈ 133.322387415 Pa (for most practical work, torr ≈ mmHg).</li>
              <li><strong>psi</strong> — pounds per square inch; 1 psi ≈ 6,894.757 Pa.</li>
              <li><strong>psf</strong> — pounds per square foot; 1 psf ≈ 47.880259 Pa.</li>
              <li><strong>inHg</strong> — inch of mercury (0°C, standard g); ≈ 3,386.389 Pa.</li>
              <li><strong>kgf/cm²</strong> — technical unit; ≈ 98,066.5 Pa (≈ 0.96784 bar).</li>
            </ul>
          </div>
        
          {/* ===== Method ===== */}
          <h2 id="method" className="text-2xl font-semibold text-emerald-300 mt-10 mb-4">📐 Accurate Conversion Method (Pa-based)</h2>
          <p>
            All conversions use <strong>Pascal (Pa)</strong> as the base in two steps:
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li><strong>Normalize to Pa</strong>: <code>value_in_Pa = value × factor(from→Pa)</code></li>
            <li><strong>Convert to target</strong>: <code>value_in_target = value_in_Pa ÷ factor(to→Pa)</code></li>
          </ol>
          <p>
            Using one base path prevents compounding rounding errors and keeps results consistent across all unit pairs.
          </p>
        
          {/* ===== Precision & Formats ===== */}
          <h2 id="precision-format" className="text-2xl font-semibold text-emerald-300 mt-10 mb-4">🎯 Precision & Number Formats</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Precision</strong>: For dashboards/reports use 0–2, for technical docs 3–6, for research 6–12.</li>
            <li><strong>Normal</strong>: Trims trailing zeros for clean decimals.</li>
            <li><strong>Compact</strong>: Shortens very large/small values (e.g., 1.2K, 3.4M) for readability.</li>
            <li><strong>Scientific</strong>: Best for extreme magnitudes (MPa↔GPa or torr↔Pa) and scientific reporting.</li>
          </ul>
          <p className="text-sm text-slate-400">
            When magnitudes are extreme, Normal may auto-switch to scientific notation to preserve readability.
          </p>
        
          {/* ===== Keyboard Shortcuts ===== */}
          <h2 id="keyboard" className="text-2xl font-semibold text-emerald-300 mt-10 mb-4">⌨️ Keyboard Shortcuts & Workflow</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><kbd>/</kbd> — Focus the <strong>Value</strong> input.</li>
            <li><kbd>S</kbd> — Focus <strong>From</strong>. <kbd>T</kbd> — Focus <strong>To</strong>.</li>
            <li><kbd>X</kbd> — <strong>Swap</strong> From/To units.</li>
          </ul>
          <p>Keep your most-used units in <strong>Favorites</strong> to switch even faster.</p>
        
          {/* ===== Worked Examples ===== */}
          <h2 id="examples" className="text-2xl font-semibold text-emerald-300 mt-10 mb-4">📈 Worked Examples (rounded for easy reading)</h2>
          <ul className="space-y-2">
            <li><strong>100 kPa → psi</strong>: 100,000 Pa ÷ 6,894.757 ≈ <strong>14.504 psi</strong></li>
            <li><strong>1 bar → kPa</strong>: 100,000 Pa ÷ 1,000 = <strong>100 kPa</strong></li>
            <li><strong>30 psi → bar</strong>: (30 × 6,894.757 Pa) ÷ 100,000 ≈ <strong>2.068 bar</strong></li>
            <li><strong>760 torr → atm</strong>: 760 × (101,325/760) Pa ÷ 101,325 Pa = <strong>1 atm</strong></li>
            <li><strong>1013 hPa → inHg</strong>: (1013 × 100 Pa) ÷ 3,386.389 ≈ <strong>29.91 inHg</strong></li>
            <li><strong>1 kgf/cm² → psi</strong>: 98,066.5 Pa ÷ 6,894.757 ≈ <strong>14.223 psi</strong></li>
            <li><strong>500 mmHg → kPa</strong>: (500 × 133.322387 Pa) ÷ 1,000 ≈ <strong>66.661 kPa</strong></li>
          </ul>
        
          {/* ===== Use Cases ===== */}
          <h2 id="use-cases" className="text-2xl font-semibold text-emerald-300 mt-10 mb-4">🧰 Real-World Use Cases</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>HVAC/Refrigeration</strong>: inHg (vacuum), psi/bar (line pressure), kPa/hPa (weather) in one view.</li>
            <li><strong>Automotive/Tires</strong>: psi ↔ kPa—match manufacturer specs with regional standards.</li>
            <li><strong>Process/Chemical</strong>: MPa/GPa-ready reporting; check safety relief settings.</li>
            <li><strong>Hydraulics/Piping</strong>: bar/psi for system ratings, psf for structural pressure loads.</li>
            <li><strong>Meteorology/Aviation</strong>: hPa/mbar ↔ inHg for METAR/TAF and synoptic charts.</li>
            <li><strong>Medical/Labs</strong>: mmHg/torr to SI conversions for instruments and documentation.</li>
          </ul>
        
          {/* ===== Accuracy & Best Practices ===== */}
          <h2 id="accuracy" className="text-2xl font-semibold text-emerald-300 mt-10 mb-4">✅ Accuracy, Rounding & Best Practices</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Convert via <strong>Pa</strong> base to avoid drift from multi-step unit hopping.</li>
            <li>Keep higher internal precision; apply display rounding last for reports.</li>
            <li>Use <strong>Scientific</strong> notation for extreme magnitudes to keep numbers readable.</li>
            <li>Always state units clearly (e.g., “kPa (abs)” vs “psi (gage)”) to prevent misinterpretation.</li>
          </ul>
        
          {/* ===== Common Pitfalls ===== */}
          <h2 id="pitfalls" className="text-2xl font-semibold text-emerald-300 mt-10 mb-4">⚠️ Common Pitfalls to Avoid</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Gauge (g) vs Absolute (abs)</strong> — mixing these can cause large errors. Specify the reference.</li>
            <li><strong>torr vs mmHg</strong> — they’re nearly equal in practice, but definitions differ slightly; be precise in lab work.</li>
            <li><strong>inHg/mmHg temperature & gravity</strong> — use standard conditions (0°C, g) unless otherwise stated.</li>
            <li><strong>psf ↔ psi</strong> — 1 psi = 144 psf; mixing area bases leads to 144× mistakes.</li>
            <li>Manual copy/paste introduces errors—use <strong>Copy</strong> and <strong>CSV</strong> buttons instead.</li>
          </ul>
        
          {/* ===== Quick Reference ===== */}
          <h2 id="quick-ref" className="text-2xl font-semibold text-emerald-300 mt-10 mb-4">🗂️ Quick Reference</h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li>1 bar = 100 kPa = 14.5038 psi ≈ 750.062 mmHg</li>
              <li>1 atm = 101.325 kPa ≈ 1.01325 bar = 14.6959 psi</li>
              <li>1 psi ≈ 6.894757 kPa ≈ 0.0689476 bar</li>
              <li>1 inHg ≈ 3.386389 kPa ≈ 0.0338639 bar</li>
              <li>1 torr ≈ 133.322 Pa; 760 torr = 1 atm</li>
              <li>1 kgf/cm² ≈ 98.0665 kPa ≈ 14.223 psi</li>
            </ul>
          </div>
        
          {/* ===== Glossary ===== */}
          <h2 id="glossary" className="text-2xl font-semibold text-emerald-300 mt-10 mb-4">📚 Glossary: Key Units at a Glance</h2>
          <p>
            <strong>atm</strong>: Standard atmospheric pressure; 1 atm = 101,325 Pa. <strong>bar</strong>: 100,000 Pa; widely used in industry.
            <strong>psi</strong>: Imperial unit; common in automotive/hydraulics. <strong>torr/mmHg</strong>: used in vacuum/medical; nearly equal for
            most practical work but differ by definition. <strong>hPa/mbar</strong>: standard in meteorology. <strong>kgf/cm²</strong>: technical unit,
            frequent in legacy specs.
          </p>
        
          {/* ===== FAQ ===== */}
          <section className="space-y-6 mt-16">
            <h2 id="faq" className="text-3xl md:text-4xl font-bold mb-4 text-center text-emerald-300">
              ❓ Frequently Asked Questions (FAQ)
            </h2>
        
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q1: Which pressure units are supported?</h3>
                <p>Pa, kPa, MPa, GPa, bar, mbar, hPa, atm, torr, mmHg, inHg, psi, psf, and kgf/cm².</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q2: Is hPa the same as mbar?</h3>
                <p>Yes. 1 hPa = 1 mbar = 100 Pa.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q3: Are torr and mmHg identical?</h3>
                <p>They’re extremely close (torr = 101325/760 Pa; mmHg ≈ 133.322387 Pa). For most practical work, you can treat them as equal.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q4: What’s the difference between gauge (g) and absolute (abs) pressure?</h3>
                <p>Gauge uses ambient air as reference; absolute uses a vacuum as reference. Mixing them causes significant errors.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q5: Can I copy/export results?</h3>
                <p>Yes—use <strong>Copy All</strong> for the full grid and <strong>CSV</strong> for spreadsheet export. Shareable URLs are included too.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q6: Are Favorites/Recent saved?</h3>
                <p>Yes, in your browser’s local storage on your device (Recent keeps the last 10 conversions).</p>
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
              <a
                href="/area-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
              >
                <span className="text-emerald-400">🟩</span> Area Converter
              </a>
              <a
                href="/temperature-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-400 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
              >
                <span className="text-sky-400">🌡️</span> Temperature Converter
              </a>
              <a
                href="/weight-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
              >
                <span className="text-indigo-400">⚖️</span> Weight Converter
              </a>
            </div>
          </div>
        </section>


        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/pressure-converter" category="unit-converters" />
      </div>
    </>
  );
}
