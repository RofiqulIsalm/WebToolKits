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
  { key: 'microgram',  name: 'Microgram ',     factor: 1e-9 },
  { key: 'milligram',  name: 'Milligram ',     factor: 1e-6 },
  { key: 'gram',       name: 'Gram ',           factor: 1e-3 },
  { key: 'kilogram',   name: 'Kilogram ',      factor: 1 },
  { key: 'tonne',      name: 'Tonne ',  factor: 1000 },           // metric ton
  { key: 'ounce',      name: 'Ounce ',         factor: 0.028349523125 }, // avoirdupois
  { key: 'pound',      name: 'Pound ',         factor: 0.45359237 },
  { key: 'stone',      name: 'Stone ',         factor: 6.35029318 },
  { key: 'short_ton',  name: 'US Ton ',     factor: 907.18474 },      // 2000 lb
  { key: 'long_ton',   name: 'Imperial Ton ',factor: 1016.0469088 },   // 2240 lb
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
      {/** ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Weight Converter — kg to lb, g to oz, stone & tons (2025–2026)"
        description="Free Weight Converter with precision control, scientific/compact formats, favorites, history, CSV export, and shareable URLs. Convert kilograms to pounds, grams to ounces, stones, US/Imperial tons, and more."
        keywords={[
          "weight converter",
          "mass converter",
          "kg to lb",
          "lb to kg",
          "grams to ounces",
          "g to oz",
          "microgram to milligram",
          "stone to kg",
          "metric ton to short ton",
          "long ton to short ton",
          "ounces to grams",
          "precision converter",
          "scientific notation converter"
        ]}
        canonical="https://calculatorhub.site/weight-converter"
        schemaData={[
          // 1) WebPage + Article
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://calculatorhub.site/weight-converter#webpage",
            "url": "https://calculatorhub.site/weight-converter",
            "name": "Weight Converter (2025–2026) — kg ⇄ lb, g ⇄ oz, stone & tons",
            "inLanguage": "en",
            "isPartOf": { "@id": "https://calculatorhub.site/#website" },
            "primaryImageOfPage": {
              "@type": "ImageObject",
              "@id": "https://calculatorhub.site/images/weight-converter-hero.webp#primaryimg",
              "url": "https://calculatorhub.site/images/weight-converter-hero.webp",
              "width": 1200,
              "height": 675
            },
            "mainEntity": {
              "@type": "Article",
              "@id": "https://calculatorhub.site/weight-converter#article",
              "headline": "Weight Converter — Fast, Accurate, and Shareable",
              "description": "Convert between microgram, milligram, gram, kilogram, tonne, ounce, pound, stone, US ton, and Imperial ton. Includes precision & format controls, favorites, history, shortcuts, and CSV export.",
              "image": ["https://calculatorhub.site/images/weight-converter-hero.webp"],
              "author": { "@type": "Organization", "name": "CalculatorHub", "url": "https://calculatorhub.site" },
              "publisher": { "@id": "https://calculatorhub.site/#organization" },
              "datePublished": "2025-11-09",
              "dateModified": "2025-11-09",
              "mainEntityOfPage": { "@id": "https://calculatorhub.site/weight-converter#webpage" },
              "articleSection": [
                "How to Use",
                "Supported Units",
                "Precision & Format",
                "Keyboard Shortcuts",
                "Copy & CSV Export",
                "FAQ"
              ]
            }
          },
      
          // 2) Breadcrumbs
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "@id": "https://calculatorhub.site/weight-converter#breadcrumbs",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://calculatorhub.site/" },
              { "@type": "ListItem", "position": 2, "name": "Unit Converters", "item": "https://calculatorhub.site/category/unit-converters" },
              { "@type": "ListItem", "position": 3, "name": "Weight Converter", "item": "https://calculatorhub.site/weight-converter" }
            ]
          },
      
          // 3) FAQ
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://calculatorhub.site/weight-converter#faq",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Which weight units are supported?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Microgram, milligram, gram, kilogram, tonne, ounce (oz), pound (lb), stone, US short ton, and Imperial long ton."
                }
              },
              {
                "@type": "Question",
                "name": "How do precision and formats work?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Use the slider to set decimals (0–12). Choose Normal, Compact, or Scientific to format results. Very small/large values can auto-switch to scientific when using Normal."
                }
              },
              {
                "@type": "Question",
                "name": "Can I copy or export results?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Copy the full grid or download a CSV. You can also share the state via URL parameters."
                }
              },
              {
                "@type": "Question",
                "name": "Does it save favorites and recent conversions?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Favorites and the 10 most recent conversions are stored locally in your browser."
                }
              }
            ]
          },
      
          // 4) WebApplication
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://calculatorhub.site/weight-converter#webapp",
            "name": "Weight Converter",
            "url": "https://calculatorhub.site/weight-converter",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web",
            "description": "Weight conversion with precision controls, scientific/compact formats, favorites, history, and CSV export.",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "image": ["https://calculatorhub.site/images/weight-converter-hero.webp"]
          },
      
          // 5) SoftwareApplication (optional)
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://calculatorhub.site/weight-converter#software",
            "name": "Advanced Weight Converter",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "All",
            "url": "https://calculatorhub.site/weight-converter",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "description": "Interactive mass/weight unit converter with shareable links and CSV export."
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
      <link rel="canonical" href="https://calculatorhub.site/weight-converter" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/weight-converter" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/weight-converter" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/weight-converter" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Weight Converter (2025–2026) — kg ⇄ lb, g ⇄ oz, stone & tons" />
      <meta property="og:description" content="Convert weight units with precision, scientific/compact formats, favorites, history, CSV export, and shareable URLs." />
      <meta property="og:url" content="https://calculatorhub.site/weight-converter" />
      <meta property="og:image" content="https://calculatorhub.site/images/weight-converter-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Weight converter UI showing formatted results and unit swapping" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Weight Converter — kg to lb, g to oz, stone & tons" />
      <meta name="twitter:description" content="Fast, accurate weight conversions with precision controls, favorites, history, and CSV export." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/weight-converter-hero.webp" />
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
      <link rel="preload" as="image" href="/images/weight-converter-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />


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
                    : <Icon.Star style={{ width: 14, height: 14, color: '#9ca3af' }} />}
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
                    : <Icon.Star style={{ width: 14, height: 14, color: '#9ca3af' }} />}
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

        {/* ==================== SEO CONTENT SECTION (~2000 words) ==================== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
        
          {/* ===== Table of Contents ===== */}
          <nav className="mt-2 mb-10 bg-[#0f172a] border border-[#334155] rounded-xl p-5 text-slate-200">
            <h2 className="text-lg font-semibold text-cyan-300 mb-3">📖 Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><a href="#overview" className="text-indigo-400 hover:underline">Overview: What This Weight Converter Does</a></li>
              <li><a href="#how-to-use" className="text-indigo-400 hover:underline">How to Use the Converter</a></li>
              <li><a href="#units" className="text-indigo-400 hover:underline">Supported Units & Exact Definitions</a></li>
              <li><a href="#precision-format" className="text-indigo-400 hover:underline">Precision & Number Formats</a></li>
              <li><a href="#shortcuts" className="text-indigo-400 hover:underline">Shortcuts, Favorites, History & Sharing</a></li>
              <li><a href="#examples" className="text-indigo-400 hover:underline">Worked Examples</a></li>
              <li><a href="#use-cases" className="text-indigo-400 hover:underline">Real-World Use Cases</a></li>
              <li><a href="#accuracy" className="text-indigo-400 hover:underline">Accuracy, Rounding & Best Practices</a></li>
              <li><a href="#pitfalls" className="text-indigo-400 hover:underline">Common Pitfalls to Avoid</a></li>
              <li><a href="#mini-table" className="text-indigo-400 hover:underline">Quick Reference Mini-Table</a></li>
              <li><a href="#benefits" className="text-indigo-400 hover:underline">Key Benefits</a></li>
              <li><a href="#tips" className="text-indigo-400 hover:underline">Power Tips</a></li>
              <li><a href="#accessibility" className="text-indigo-400 hover:underline">Accessibility & Performance</a></li>
              <li><a href="#pros-cons" className="text-indigo-400 hover:underline">Pros & Cons</a></li>
              <li><a href="#faq" className="text-indigo-400 hover:underline">FAQ</a></li>
            </ol>
          </nav>
        
          {/* ===== Overview ===== */}
          <h1 id="overview" className="text-3xl font-bold text-cyan-400 mb-6">
            Weight Converter — kg ⇄ lb, g ⇄ oz, stone & tons (Accurate, Fast & Shareable)
          </h1>
        
          <p>
            Whether you’re prepping a nutrition label, sizing freight, speccing materials for a product, or simply converting
            a recipe from grams to ounces, accuracy matters. The <strong>Weight Converter by CalculatorHub</strong> delivers
            precision results instantly across metric and imperial systems — with <strong>precision control</strong> up to 12
            decimals, <strong>Normal/Compact/Scientific formats</strong>, <strong>Favorites</strong> to pin go-to units, a
            <strong> local History</strong> of recent conversions, and a <strong>shareable URL</strong> that preserves state for
            teammates and clients. You can even export a <strong>CSV</strong> of the whole results grid for reports or spreadsheets.
          </p>
        
          <p>
            Under the hood, the tool uses SI-consistent definitions and the modern international standards you expect:
            <strong> 1 lb = 0.45359237 kg</strong> (exact), <strong>1 oz = 28.349523125 g</strong> (avoirdupois),
            <strong> 1 stone = 6.35029318 kg</strong>, <strong>1 short ton (US)</strong> = <strong>2000 lb</strong>,
            <strong> 1 long ton (Imperial)</strong> = <strong>2240 lb</strong>, and <strong>1 tonne</strong> = <strong>1000 kg</strong>.
            The result is an <em>engineering-grade</em> converter that is still easy enough for everyday use.
          </p>
        
          <figure className="my-8">
            <img
              src="/images/weight-converter-hero.webp"
              alt="Weight converter dashboard showing unit swapping, precision slider, and formatted results"
              title="Weight Converter — kilograms to pounds, grams to ounces, stones, US/Imperial tons"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Convert micrograms to tons — and everything in between — with precision, shortcuts, CSV export, and shareable links.
            </figcaption>
          </figure>
        
          {/* ===== How to Use ===== */}
          <h2 id="how-to-use" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            💡 How to Use the Converter
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter your <strong>Value</strong> (commas allowed; empty counts as 0 for quick trials).</li>
            <li>Pick the <strong>From</strong> unit (e.g., kilogram).</li>
            <li>Pick the <strong>To</strong> unit (e.g., pound).</li>
            <li>Open <em>More options</em> and set <strong>Precision</strong> (0–12 decimals) and preferred <strong>Format</strong>.</li>
            <li>Read the <strong>Direct Result</strong> or scroll the <strong>All Units</strong> grid to compare every supported unit at once.</li>
          </ol>
          <p className="text-sm text-slate-400">
            Your inputs and preferences (value, units, format, precision) sync into the page URL automatically — ideal for sharing exact states or bookmarking workflows you revisit often.
          </p>
        
          {/* ===== Units & Definitions ===== */}
          <h2 id="units" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ⚖️ Supported Units & Exact Definitions
          </h2>
          <p>
            Supported: <strong>microgram</strong>, <strong>milligram</strong>, <strong>gram</strong>, <strong>kilogram</strong>,
            <strong> tonne</strong> (metric ton), <strong>ounce</strong> (avoirdupois), <strong>pound</strong> (lb),
            <strong> stone</strong>, <strong>US short ton</strong> (2000 lb), and <strong>Imperial long ton</strong> (2240 lb).
            Core exact factors:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>1 lb</strong> = <strong>0.45359237 kg</strong> (exact)</li>
            <li><strong>1 oz</strong> = <strong>28.349523125 g</strong> (exact; 1 oz = 1/16 lb)</li>
            <li><strong>1 stone</strong> = <strong>14 lb</strong> = <strong>6.35029318 kg</strong></li>
            <li><strong>1 short ton (US)</strong> = <strong>2000 lb</strong> ≈ <strong>907.18474 kg</strong></li>
            <li><strong>1 long ton (Imp.)</strong> = <strong>2240 lb</strong> ≈ <strong>1016.0469088 kg</strong></li>
            <li><strong>1 tonne</strong> (metric ton) = <strong>1000 kg</strong></li>
            <li><strong>1 kg</strong> = <strong>1000 g</strong> = <strong>1e6 mg</strong> = <strong>1e9 µg</strong></li>
          </ul>
          <p>
            Using these standardized relationships ensures consistency across labeling, procurement, R&amp;D, healthcare, logistics, and international trade.
          </p>
        
          {/* ===== Precision & Formats ===== */}
          <h2 id="precision-format" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🎯 Precision & Number Formats (Normal, Compact, Scientific)
          </h2>
          <p>
            Numbers should be as clear as the decision they inform. Choose <strong>Precision</strong> from 0–12 decimals to match
            your task: fewer decimals for invoices, more for lab and QA logs. Then choose your <strong>Format</strong>:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Normal</strong> — traditional decimal notation with trimmed trailing zeros for clean reading.</li>
            <li><strong>Compact</strong> — short notation (e.g., 1.2K, 3.4M) for dashboards and slides.</li>
            <li><strong>Scientific</strong> — e-notation (e.g., 3.2005e+06) for nano-scale or very large masses.</li>
          </ul>
          <p className="text-sm text-slate-400">
            Extremely small/large magnitudes may auto-switch to scientific when using Normal to preserve readability.
          </p>
        
          {/* ===== Shortcuts & Sharing ===== */}
          <h2 id="shortcuts" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ⚡ Shortcuts, Favorites, History, Copy & CSV
          </h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Keyboard</strong>: <kbd>/</kbd> focus value, <kbd>S</kbd> focus From, <kbd>T</kbd> focus To, <kbd>X</kbd> swap.</li>
            <li><strong>Favorites</strong>: pin your 3–5 most-used units to skip scrolling every time.</li>
            <li><strong>History</strong>: your last 10 conversions are stored locally in the browser (privacy-friendly).</li>
            <li><strong>Copy</strong>: copy any single result, or <em>Copy All</em> to capture the full grid.</li>
            <li><strong>CSV export</strong>: download all unit values for spreadsheets, audits, or documentation.</li>
            <li><strong>Shareable URL</strong>: your current value/units/format/precision are encoded in the link.</li>
          </ul>
        
          {/* ===== Worked Examples ===== */}
          <h2 id="examples" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📈 Worked Examples (Rounded to 5–6 Significant Digits)
          </h2>
          <ul className="space-y-2">
            <li><strong>1 kg → lb</strong>: 1 kg ≈ <strong>2.20462 lb</strong>.</li>
            <li><strong>5 kg → oz</strong>: 5 kg × (35.27396195 oz/kg) ≈ <strong>176.37 oz</strong>.</li>
            <li><strong>100 g → oz</strong>: 100 g ÷ 28.349523125 ≈ <strong>3.52740 oz</strong>.</li>
            <li><strong>1 lb → g</strong>: 1 lb = <strong>453.59237 g</strong> (exact).</li>
            <li><strong>50 lb → kg</strong>: 50 × 0.45359237 = <strong>22.6796185 kg</strong>.</li>
            <li><strong>10 stone → kg</strong>: 10 × 6.35029318 = <strong>63.5029318 kg</strong>.</li>
            <li><strong>0.25 short ton → kg</strong>: 0.25 × 907.18474 ≈ <strong>226.796185 kg</strong>.</li>
            <li><strong>1 long ton → lb</strong>: <strong>2240 lb</strong> (exact) ≈ <strong>1016.0469 kg</strong>.</li>
            <li><strong>750 mg → g</strong>: <strong>0.75 g</strong> (since 1000 mg = 1 g).</li>
            <li><strong>120,000 µg → mg</strong>: <strong>120 mg</strong> (since 1000 µg = 1 mg).</li>
          </ul>
          <p className="text-sm text-slate-400">
            Your live page will present numbers with your current <em>Precision</em> and <em>Format</em> settings.
          </p>
        
          {/* ===== Real-World Use Cases ===== */}
          <h2 id="use-cases" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧰 Real-World Use Cases (Who This Helps & Why)
          </h2>
          <p>
            A single converter that respects exact factors is useful across industries. Common scenarios include:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Food & Nutrition</strong>: Convert recipes and labels between grams/ounces/pounds; standardize serving sizes for export markets.</li>
            <li><strong>Manufacturing & BOMs</strong>: Normalize component masses in kg or lb; export CSV for QA checklists and ERP imports.</li>
            <li><strong>Healthcare & Pharma</strong>: Use mg/µg with Scientific notation for dosage calculations and lab documentation.</li>
            <li><strong>Logistics & Freight</strong>: Switch between short ton, long ton, tonne, and pounds to match carrier paperwork and customs declarations.</li>
            <li><strong>E-commerce</strong>: Display compact weights on product cards, full precision on PDPs and spec sheets.</li>
            <li><strong>Education</strong>: Teach unit relationships from micrograms to tons; the All Units grid reinforces scale intuition.</li>
            <li><strong>Fitness</strong>: Convert between kg/lb and stone for workout logs, tracking apps, and client plans.</li>
          </ul>
        
          {/* ===== Accuracy & Best Practices ===== */}
          <h2 id="accuracy" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ✅ Accuracy, Rounding & Best Practices
          </h2>
          <p>
            The converter uses exact definitions where applicable (e.g., <strong>1 lb = 0.45359237 kg</strong>), computes in
            double-precision floating point, and then formats values according to your display settings. For compliance-sensitive
            contexts (labels, SOPs, certificates), consider:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Choosing enough <strong>decimals</strong> to avoid cumulative error when aggregating.</li>
            <li>Locking <strong>Scientific</strong> format for microgram-level work to keep trailing zeros in check.</li>
            <li>Exporting <strong>CSV</strong> and letting your spreadsheet handle internal precision; round only at the final step for publication.</li>
            <li>Documenting the <strong>precision</strong> and <strong>unit system</strong> used to prevent ambiguity.</li>
          </ul>
          <p>
            Remember: adding rounded numbers can yield slight discrepancies. Keep internal calculations at higher precision, then round for the final output.
          </p>
        
          {/* ===== Pitfalls ===== */}
          <h2 id="pitfalls" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ⚠️ Common Pitfalls to Avoid
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Wrong ton type</strong>: US short ton (2000 lb) vs Imperial long ton (2240 lb) vs metric tonne (1000 kg). Choose carefully.</li>
            <li><strong>Confusing mass vs weight</strong>: colloquially “weight” often means mass. This tool converts mass units; local gravity is not considered.</li>
            <li><strong>Inconsistent precision</strong>: agree on decimals across a team; share the URL to lock an exact view.</li>
            <li><strong>Locale formatting</strong>: commas vs. periods can vary; format numbers to match your style guide.</li>
          </ul>
        
          {/* ===== Quick Reference Table ===== */}
          <h2 id="mini-table" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🗂️ Quick Reference Mini-Table
          </h2>
          <p className="text-sm text-slate-400 mb-3">
            The factors most people reach for first:
          </p>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li>1 kg ≈ 2.20462 lb</li>
              <li>1 lb = 0.45359237 kg (exact)</li>
              <li>1 oz = 28.349523125 g (exact)</li>
              <li>1 stone = 14 lb = 6.35029318 kg</li>
              <li>1 tonne = 1000 kg</li>
              <li>1 short ton (US) = 2000 lb</li>
              <li>1 long ton (Imp.) = 2240 lb</li>
              <li>1 g = 1000 mg = 1e6 µg</li>
            </ul>
          </div>
        
          {/* ===== Benefits ===== */}
          <h2 id="benefits" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🌟 Key Benefits You’ll Notice Immediately
          </h2>
          <ul className="space-y-2">
            <li>✔️ <strong>Accurate, standards-based</strong> factors for professional and academic use.</li>
            <li>✔️ <strong>Two-way conversion</strong> + <strong>All Units</strong> grid for instant context.</li>
            <li>✔️ <strong>Precision/format controls</strong> that match your audience and compliance needs.</li>
            <li>✔️ <strong>Favorites</strong> & <strong>History</strong> to remove repetitive steps.</li>
            <li>✔️ <strong>Copy/CSV export</strong> for reports, SOPs, and audits.</li>
            <li>✔️ <strong>Privacy-friendly</strong>: settings stored locally; no sign-in required.</li>
          </ul>
        
          {/* ===== Tips ===== */}
          <h2 id="tips" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧭 Power Tips to Work Faster
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Pin <strong>kg</strong>, <strong>g</strong>, <strong>lb</strong>, <strong>oz</strong>, and <strong>tonne</strong> as Favorites — most daily tasks use these five.</li>
            <li>Toggle <strong>Scientific</strong> for microgram/milligram work to avoid reading long strings of zeros.</li>
            <li>Use <strong>Compact</strong> when building dashboards with limited space.</li>
            <li><strong>Export CSV</strong> for internal validation and keep a copy in your change-control log.</li>
            <li>Share the URL with precision locked so collaborators see exactly what you see.</li>
          </ul>
        
          {/* ===== Accessibility & Performance ===== */}
          <h2 id="accessibility" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ♿ Accessibility & Performance Considerations
          </h2>
          <p>
            The interface supports keyboard navigation and uses clear labels on all inputs and buttons. The dark theme improves
            contrast in low-light environments, and the layout scales smoothly across mobile, tablet, and desktop screens. Alt
            text and ARIA labels help assistive technologies convey context. Under the hood, calculations are instantaneous and
            stored locally for a fast return visit; cautious preloading ensures performance without bloat.
          </p>
        
          {/* ===== Pros / Cons ===== */}
          <h2 id="pros-cons" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ⚖️ Pros & Cons
          </h2>
          <p className="mb-2">A balanced snapshot to set expectations.</p>
          <p><strong>Pros:</strong></p>
          <ul>
            <li>Exact base definitions, consistent results, and flexible presentation formats.</li>
            <li>Keyboard-friendly, fast UI with local persistence and shareable state.</li>
            <li>All-in-one grid for sanity checks and teaching unit relationships.</li>
          </ul>
          <p><strong>Cons:</strong></p>
          <ul>
            <li>Focuses on mass/weight only — use separate tools for volume, area, or length.</li>
            <li>Rounding style is user-controlled; agree on standards for team deliverables.</li>
            <li>Locale number formatting may differ from your brand guide; switch formats as needed.</li>
          </ul>
        
          {/* ===== FAQ ===== */}
          <section className="space-y-6 mt-16">
            <h2 id="faq" className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>
        
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q1: Which weight units are supported?</h3>
                <p>
                  Microgram, milligram, gram, kilogram, tonne (metric ton), ounce (oz), pound (lb), stone, US short ton, and Imperial long ton.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q2: How do precision and formats work?</h3>
                <p>
                  Set decimals from 0–12 and choose Normal, Compact, or Scientific. Very small/large values may show in Scientific when Normal is selected, for readability.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q3: Can I save my most-used units?</h3>
                <p>
                  Yes. Mark any unit as a Favorite. Your Favorites and the last 10 conversions are saved locally in your browser for quick access.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q4: Can I share or export results?</h3>
                <p>
                  Absolutely. Copy a value, use <strong>Copy All</strong> for the full grid, export a <strong>CSV</strong>, or share the page URL — it encodes your current state.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q5: Is my data stored on a server?</h3>
                <p>
                  No. Favorites and history live entirely in your browser. We don’t require accounts or store your inputs remotely.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q6: What’s the difference between short ton, long ton, and tonne?</h3>
                <p>
                  A US short ton is 2000 lb (~907.18474 kg); an Imperial long ton is 2240 lb (~1016.0469 kg); a metric tonne is 1000 kg (≈2204.62262 lb).
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q7: Does this tool convert “weight” or “mass”?</h3>
                <p>
                  It converts between <em>mass</em> units (kg, lb, etc.). In everyday language people say weight — this calculator uses standardized mass relationships and does not account for local gravity differences.
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
              🚀 Explore more unit & math tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <a
                href="/length-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
              >
                <span className="text-indigo-400">📏</span> Length Converter
              </a>
        
              <a
                href="/area-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-400 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
              >
                <span className="text-sky-400">📐</span> Area Converter
              </a>
        
              <a
                href="/volume-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-pink-600/20 text-pink-300 hover:text-pink-400 px-3 py-2 rounded-md border border-slate-700 hover:border-pink-500 transition-all duration-200"
              >
                <span className="text-pink-400">🧪</span> Volume Converter
              </a>
            </div>
          </div>
        </section>


        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/weight-converter" category="unit-converters" />
      </div>
    </>
  );
}
