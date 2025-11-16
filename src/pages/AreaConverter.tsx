import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from "react-router-dom";
// Keep your project components:
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

/* ---------------- Icons (inline, no deps) ---------------- */
const Icon = {
  Square: (p) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2" />
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

/* ---------------- Units (factors are in square meters) ---------------- */
const AREA_UNITS = [
  { key: 'nm2',   name: 'Square Nanometer (nm²)',         factor: 1e-18 },
  { key: 'um2',   name: 'Square Micrometer (µm²)',        factor: 1e-12 },
  { key: 'mm2',   name: 'Square Millimeter (mm²)',        factor: 1e-6 },
  { key: 'cm2',   name: 'Square Centimeter (cm²)',        factor: 1e-4 },
  { key: 'dm2',   name: 'Square Decimeter (dm²)',         factor: 1e-2 },
  { key: 'm2',    name: 'Square Meter (m²)',              factor: 1 },
  { key: 'a',     name: 'Are (a)',                        factor: 100 },           // 100 m²
  { key: 'ha',    name: 'Hectare (ha)',                   factor: 10000 },         // 10,000 m²
  { key: 'km2',   name: 'Square Kilometer (km²)',         factor: 1e6 },
  { key: 'in2',   name: 'Square Inch (in²)',              factor: 0.00064516 },
  { key: 'ft2',   name: 'Square Foot (ft²)',              factor: 0.09290304 },
  { key: 'yd2',   name: 'Square Yard (yd²)',              factor: 0.83612736 },
  { key: 'ac',    name: 'Acre (ac)',                      factor: 4046.8564224 },
  { key: 'mi2',   name: 'Square Mile (mi²)',              factor: 2589988.110336 },
];
const unitMap = Object.fromEntries(AREA_UNITS.map(u => [u.key, u]));
const FORMAT_MODES = ['normal', 'compact', 'scientific'];

/* ---------------- Safe storage helpers (same pattern) ---------------- */
function hasWindow() { return typeof window !== 'undefined'; }
function getStorage() {
  if (!hasWindow()) return null;
  try {
    const s = window.localStorage;
    const t = '__chk__'; s.setItem(t, '1'); s.removeItem(t);
    return s;
  } catch { return null; }
}
const storage = getStorage();
function useLocalStorage(key, initial) {
  const [state, setState] = useState(() => {
    if (!storage) return initial;
    try { const raw = storage.getItem(key); return raw ? JSON.parse(raw) : initial; }
    catch { return initial; }
  });
  useEffect(() => {
    if (!storage) return;
    try { storage.setItem(key, JSON.stringify(state)); } catch {}
  }, [key, state]);
  return [state, setState];
}

/* ---------------- Math & formatting ---------------- */
function convertLinear(value, fromKey, toKey) {
  const f = unitMap[fromKey], t = unitMap[toKey];
  if (!f || !t) return NaN;
  // factors are already in base m² → simple ratio
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

/* ---------------- Component ---------------- */
export default function AreaConverter() {
  const [valueStr, setValueStr] = useState('');
  const [fromUnit, setFromUnit] = useState('m2');
  const [toUnit, setToUnit] = useState('ft2');
  const [formatMode, setFormatMode] = useState('normal');
  const [precision, setPrecision] = useState(6);
  const [favorites, setFavorites] = useLocalStorage('area:favorites', ['m2','cm2','ft2','ac']);
  const [history, setHistory] = useLocalStorage('area:history', []);

  const valueRef = useRef(null);
  const fromRef = useRef(null);
  const toRef = useRef(null);

  // Parse number safely (allow commas). Empty → 0
  const valueNum = useMemo(() => {
    const clean = String(valueStr || '').replace(/,/g, '').trim();
    if (clean === '') return 0;
    const n = Number(clean);
    return Number.isFinite(n) ? n : 0;
  }, [valueStr]);

  // Direct conversion + grid
  const direct = useMemo(() => convertLinear(valueNum, fromUnit, toUnit), [valueNum, fromUnit, toUnit]);
  const gridResults = useMemo(() => {
    const baseM2 = valueNum * ((unitMap[fromUnit] && unitMap[fromUnit].factor) || 1);
    const out = {};
    for (const u of AREA_UNITS) if (u.key !== fromUnit) out[u.key] = baseM2 / u.factor;
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
      if (fmt && FORMAT_MODES.includes(fmt)) setFormatMode(fmt);
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
      const last = prev[0];
      if (last && last.v === entry.v && last.from === entry.from && last.to === entry.to) return prev;
      return [entry, ...prev].slice(0, 10);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueStr, fromUnit, toUnit]);

  /* ---------- Shortcuts ---------- */
  useEffect(() => {
    if (!hasWindow()) return;
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'SELECT' || (e.target && e.target.isContentEditable)) return;
      if (e.key === '/') { e.preventDefault(); valueRef.current?.focus?.(); }
      if (e.key.toLowerCase() === 's') { e.preventDefault(); fromRef.current?.focus?.(); }
      if (e.key.toLowerCase() === 't') { e.preventDefault(); toRef.current?.focus?.(); }
      if (e.key.toLowerCase() === 'x') { e.preventDefault(); swapUnits(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ---------- Actions ---------- */
  function toggleFavorite(k) {
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
        a.href = url; a.download = 'area-conversion.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
      }
    } catch {}
  }

  const favored = AREA_UNITS.filter(u => favorites.includes(u.key));
  const unfavored = AREA_UNITS.filter(u => !favorites.includes(u.key));
  const hasInput = (valueStr || '').trim() !== '';

  return (
    <>
      {/** ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Area Converter — m² to ft², acres to hectares, km² & more (2025–2026)"
        description="Free Area Converter with precision control, Normal/Compact/Scientific formats, favorites, history, CSV export, and shareable URLs. Convert m² to ft², acres to hectares, km², and more instantly."
        keywords={[
          "area converter",
          "square meter to square foot",
          "m2 to ft2",
          "square centimeters to square inches",
          "cm2 to in2",
          "acres to hectares",
          "hectares to acres",
          "km2 to mi2",
          "square yard to square meter",
          "yd2 to m2",
          "square mile to square kilometer",
          "mi2 to km2",
          "are to m2",
          "precision converter",
          "scientific notation"
        ]}
        canonical="https://calculatorhub.site/area-converter"
        schemaData={[
          // 1) WebPage + Article
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://calculatorhub.site/area-converter#webpage",
            "url": "https://calculatorhub.site/area-converter",
            "name": "Area Converter (2025–2026) — m² ⇄ ft², acres ⇄ hectares, km² ⇄ mi²",
            "inLanguage": "en",
            "isPartOf": { "@id": "https://calculatorhub.site/#website" },
            "primaryImageOfPage": {
              "@type": "ImageObject",
              "@id": "https://calculatorhub.site/images/area-converter-hero.webp#primaryimg",
              "url": "https://calculatorhub.site/images/area-converter-hero.webp",
              "width": 1200,
              "height": 675
            },
            "mainEntity": {
              "@type": "Article",
              "@id": "https://calculatorhub.site/area-converter#article",
              "headline": "Area Converter — Fast, Accurate, and Shareable",
              "description": "Convert nm², µm², mm², cm², dm², m², a, ha, km², in², ft², yd², acres, and mi². Includes precision & format controls, favorites, history, shortcuts, and CSV export.",
              "image": ["https://calculatorhub.site/images/area-converter-hero.webp"],
              "author": { "@type": "Organization", "name": "CalculatorHub", "url": "https://calculatorhub.site" },
              "publisher": { "@id": "https://calculatorhub.site/#organization" },
              "datePublished": "2025-11-09",
              "dateModified": "2025-11-09",
              "mainEntityOfPage": { "@id": "https://calculatorhub.site/area-converter#webpage" },
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
      
          // 2) Breadcrumbs
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "@id": "https://calculatorhub.site/area-converter#breadcrumbs",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://calculatorhub.site/" },
              { "@type": "ListItem", "position": 2, "name": "Unit Converters", "item": "https://calculatorhub.site/category/unit-converters" },
              { "@type": "ListItem", "position": 3, "name": "Area Converter", "item": "https://calculatorhub.site/area-converter" }
            ]
          },
      
          // 3) FAQ
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://calculatorhub.site/area-converter#faq",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Which area units are supported?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Square nanometer, square micrometer, square millimeter, square centimeter, square decimeter, square meter, are, hectare, square kilometer, square inch, square foot, square yard, acre, and square mile."
                }
              },
              {
                "@type": "Question",
                "name": "How do precision and formats work?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Use the slider to set decimals (0–12). Choose Normal, Compact, or Scientific to format results. Very small/large values can auto-switch to scientific in Normal mode."
                }
              },
              {
                "@type": "Question",
                "name": "Can I copy or export results?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Copy the full grid or download a CSV. The tool also syncs state to the URL for easy sharing."
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
            "@id": "https://calculatorhub.site/area-converter#webapp",
            "name": "Area Converter",
            "url": "https://calculatorhub.site/area-converter",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web",
            "description": "Area conversion with precision controls, Normal/Compact/Scientific formats, favorites, history, and CSV export.",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "image": ["https://calculatorhub.site/images/area-converter-hero.webp"]
          },
      
          // 5) SoftwareApplication (optional)
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://calculatorhub.site/area-converter#software",
            "name": "Advanced Area Converter",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "All",
            "url": "https://calculatorhub.site/area-converter",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "description": "Interactive area unit converter with shareable links and CSV export."
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
      <link rel="canonical" href="https://calculatorhub.site/area-converter" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/area-converter" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/area-converter" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/area-converter" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Area Converter (2025–2026) — m² ⇄ ft², acres ⇄ hectares, km² ⇄ mi²" />
      <meta property="og:description" content="Convert area units with precision controls, Normal/Compact/Scientific formats, favorites, history, CSV export, and shareable URLs." />
      <meta property="og:url" content="https://calculatorhub.site/area-converter" />
      <meta property="og:image" content="https://calculatorhub.site/images/area-converter-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Area converter UI showing formatted results and unit swapping" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Area Converter — m² to ft², acres to hectares, km² & more" />
      <meta name="twitter:description" content="Fast, accurate area conversions with precision controls, favorites, history, and CSV export." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/area-converter-hero.webp" />
      <meta name="twitter:creator" content="@CalculatorHub" />
      <meta name="twitter:site" content="@CalculatorHub" />
      
      {/** PWA & theme */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#10b981" />
      
      {/** Performance */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="preload" as="image" href="/images/area-converter-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />


      <div className="max-w-5xl mx-auto text-gray-200">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Area Converter', url: '/area-converter' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 rounded-2xl p-6 bg-gradient-to-r from-green-900 via-emerald-800 to-teal-800 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">Area Converter (Advanced)</h1>
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
                  className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  aria-label="Enter area value"
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
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 flex items-center gap-2"
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
                <input type="range" min={0} max={12} value={precision} onChange={(e) => setPrecision(+e.target.value)} className="w-full accent-emerald-500" />
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
                <button onClick={exportCSV} className="px-3 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-200 hover:bg-gray-700 flex items-center gap-2 w/full justify-center">
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
            {AREA_UNITS.map((unit) => {
              if (unit.key === fromUnit) return null;
              const val = gridResults[unit.key];
              const display = formatNumber(val ?? 0, formatMode, precision);
              return (
                <div key={unit.key} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:bg-gray-700/70 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon.Square style={{ width: 16, height: 16, color: '#10b981' }} />
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
        {/* ==================== SEO CONTENT SECTION ==================== */}
        <section className="prose prose-invert max-w-5xl mx-auto mt-12 mb-12 leading-relaxed text-gray-200">
        
          {/* ===== Table of Contents ===== */}
          <nav className="mt-2 mb-10 bg-slate-950 border border-slate-700 rounded-2xl p-5 text-slate-200">
            <h2 className="text-lg font-semibold text-emerald-300 mb-3">
              📖 Table of Contents
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <a href="#area-converter-overview" className="text-emerald-300 hover:underline">
                  Overview: What This Area Converter Does
                </a>
              </li>
              <li>
                <a href="#area-converter-how-to-use" className="text-emerald-300 hover:underline">
                  How to Use the Area Converter (Step-by-Step)
                </a>
              </li>
              <li>
                <a href="#area-converter-supported-units" className="text-emerald-300 hover:underline">
                  Supported Units: Metric, Imperial &amp; Land Measurement
                </a>
              </li>
              <li>
                <a href="#area-converter-precision-format" className="text-emerald-300 hover:underline">
                  Precision, Number Formats &amp; Scientific Notation
                </a>
              </li>
              <li>
                <a href="#area-converter-features" className="text-emerald-300 hover:underline">
                  Key Features: Favorites, History, Shortcuts &amp; CSV Export
                </a>
              </li>
              <li>
                <a href="#area-converter-examples" className="text-emerald-300 hover:underline">
                  Practical Examples: Real Estate, Maps, Engineering &amp; Study
                </a>
              </li>
              <li>
                <a href="#area-converter-tips" className="text-emerald-300 hover:underline">
                  Tips to Avoid Common Area Conversion Mistakes
                </a>
              </li>
              <li>
                <a href="#area-converter-workflow" className="text-emerald-300 hover:underline">
                  Suggested Workflow: Using the Area Converter in Daily Work
                </a>
              </li>
              <li>
                <a href="#area-converter-faq" className="text-emerald-300 hover:underline">
                  Area Converter – Frequently Asked Questions
                </a>
              </li>
            </ol>
          </nav>
        
          {/* ===== Overview ===== */}
          <h1
            id="area-converter-overview"
            className="text-3xl md:text-4xl font-bold text-emerald-300 mb-6"
          >
            Area Converter – m² to ft², acres to hectares, km² to mi² and more
          </h1>
        
          <p>
            The <strong>Area Converter</strong> on CalculatorHub is designed for students,
            engineers, architects, surveyors, real-estate agents, and anyone who works with
            land, floor plans, maps, or technical drawings. Instead of manually searching
            “m² to ft²” or “acres to hectares” again and again, this tool turns your browser
            into a fast, precise <strong>multi-unit conversion dashboard</strong>.
          </p>
        
          <p>
            Under the hood, the calculator uses a clean, consistent base:
            every unit is converted through <strong>square meters (m²)</strong>. That means
            you can safely convert in any direction – from <strong>tiny nanometer-scale
            chip areas</strong> to <strong>massive square-mile territories</strong> – with
            one input and a single click or keyboard shortcut. No hidden rounding tricks,
            no approximate “about” values: just transparent maths with adjustable precision.
          </p>
        
          <figure className="my-8">
            <img
              src="/images/area-converter-hero.webp"
              alt="Area converter interface showing inputs, units, precision controls and result cards"
              title="Area Converter UI – advanced yet easy to use"
              className="rounded-xl shadow-lg border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Convert between m², ft², acres, hectares, km², mi² and more with one input, a swap
              button, and live-updating results.
            </figcaption>
          </figure>
        
          <p>
            On top of that, the Area Converter adds quality-of-life enhancements you rarely
            see in simple widgets: <strong>format control</strong> (Normal, Compact,
            Scientific), <strong>precision slider</strong> (0–12 decimals),
            <strong>favorites</strong>, <strong>recent history</strong>, keyboard
            shortcuts, <strong>copy actions</strong>, CSV export and a
            <strong>shareable URL</strong> that keeps your inputs in the query string.
          </p>
        
          {/* ===== How to Use ===== */}
          <h2
            id="area-converter-how-to-use"
            className="text-2xl md:text-3xl font-semibold text-emerald-300 mt-10 mb-4"
          >
            💡 How to Use the Area Converter (Step-by-Step)
          </h2>
        
          <p>
            The layout follows the standard CalculatorHub pattern:
            <strong> controls on top</strong>, <strong>direct result card</strong> in the
            middle, and a <strong>full grid of converted units</strong> underneath. Here’s
            a simple workflow to get comfortable with the tool.
          </p>
        
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong>Enter your value.</strong> In the <em>Value</em> field, type the area you want
              to convert. Commas are allowed (e.g. <code>1,234.56</code>) and an empty field is
              treated as <code>0</code>, so you never get cryptic errors.
            </li>
            <li>
              <strong>Choose the “From” unit.</strong> Use the <em>From</em> dropdown to select the
              unit you currently have, such as <strong>square meter (m²)</strong>,
              <strong> square foot (ft²)</strong>, <strong>acre (ac)</strong> or
              <strong> hectare (ha)</strong>. You can pin common units as favorites to keep them
              at the top.
            </li>
            <li>
              <strong>Choose the “To” unit.</strong> In the <em>To</em> dropdown, pick the unit you
              need. For example, if you’re a real-estate agent who thinks in square feet but
              receives plans in square meters, you might pick <code>From: m² → To: ft²</code>.
            </li>
            <li>
              <strong>Read the direct result card.</strong> The main result block shows the
              formatted conversion from the <em>From</em> unit to the <em>To</em> unit, using your
              preferred precision and number format.
            </li>
            <li>
              <strong>Check the “All Units” grid.</strong> Below, you can see the same input
              converted to every other supported unit. This is ideal when you’re exploring,
              estimating, or preparing multiple versions of a report.
            </li>
            <li>
              <strong>Fine-tune with “More options”.</strong> Expand the <em>More options</em> panel
              to adjust decimal precision, change Normal/Compact/Scientific format, and use
              <strong> Copy All</strong> or <strong>CSV Export</strong> for your current results.
            </li>
          </ol>
        
          <p>
            You can also work almost entirely by keyboard:
            <strong> /</strong> focuses the value field,
            <strong> S</strong> jumps to the <em>From</em> dropdown,
            <strong> T</strong> jumps to the <em>To</em> dropdown,
            and <strong>X</strong> swaps units instantly.
          </p>
        
          {/* ===== Supported Units ===== */}
          <h2
            id="area-converter-supported-units"
            className="text-2xl md:text-3xl font-semibold text-emerald-300 mt-10 mb-4"
          >
            📏 Supported Units: Metric, Imperial &amp; Land Measurement
          </h2>
        
          <p>
            This Area Converter supports a wide range of area units, grouped roughly into
            three families: <strong>metric</strong>, <strong>imperial/US customary</strong>,
            and <strong>land/real-estate units</strong>.
          </p>
        
          <h3 className="text-xl font-semibold text-gray-100 mt-6 mb-2">
            1. Metric area units
          </h3>
          <p>
            Metric units are ideal for science, engineering, CAD work and precise
            calculations. All of these are based on powers of ten:
          </p>
        
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Square nanometer (nm²)</strong> – extremely small, surface areas at nano-scale.</li>
            <li><strong>Square micrometer (µm²)</strong> – micro-fabrication, cell biology, thin films.</li>
            <li><strong>Square millimeter (mm²)</strong> – engineering drawings, cross-sectional areas.</li>
            <li><strong>Square centimeter (cm²)</strong> – lab notebooks, small surfaces, packaging.</li>
            <li><strong>Square decimeter (dm²)</strong> – less common, but occasionally used in education.</li>
            <li><strong>Square meter (m²)</strong> – the core SI unit of area; used everywhere.</li>
            <li><strong>Are (a)</strong> – equals <strong>100 m²</strong>, sometimes used for small plots.</li>
            <li><strong>Hectare (ha)</strong> – equals <strong>10,000 m²</strong>, common for farmland and forestry.</li>
            <li><strong>Square kilometer (km²)</strong> – large-scale areas: countries, lakes, cities.</li>
          </ul>
        
          <h3 className="text-xl font-semibold text-gray-100 mt-6 mb-2">
            2. Imperial &amp; US customary area units
          </h3>
          <p>
            Many property listings, construction projects and building codes still use
            imperial or US customary units, especially in the United States and UK-influenced
            markets:
          </p>

          <AdBanner type="bottom" />
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Square inch (in²)</strong> – small parts, screws, labels, electronics housings.</li>
            <li><strong>Square foot (ft²)</strong> – floor plans, apartments, retail spaces.</li>
            <li><strong>Square yard (yd²)</strong> – carpets, turf, some construction materials.</li>
            <li><strong>Acre (ac)</strong> – traditional unit for land and farms.</li>
            <li><strong>Square mile (mi²)</strong> – very large areas such as counties or districts.</li>
          </ul>
        
          <p>
            The converter maps every one of these units to an exact <strong>square meter
            factor</strong> and simply divides/multiplies in the background. That keeps the
            logic stable and easy to reason about.
          </p>
        
          {/* ===== Precision & Formats ===== */}
          <h2
            id="area-converter-precision-format"
            className="text-2xl md:text-3xl font-semibold text-emerald-300 mt-10 mb-4"
          >
            🎯 Precision, Number Formats &amp; Scientific Notation
          </h2>
        
          <p>
            Real-world usage of area can swing from <strong>tiny micro-fabrication</strong>
            all the way up to <strong>national land statistics</strong>. A single fixed
            number format is never enough. That’s why the Area Converter lets you control:
          </p>
        
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Precision (0–12 decimals).</strong> Use the slider to choose how many
              decimal places you want. For presentations and client reports, you might
              prefer 0–2 decimals. For engineering calculations, you might go up to 6–8.
            </li>
            <li>
              <strong>Normal format.</strong> Displays numbers in the usual way with grouping
              (e.g. <code>123,456.789</code>). Very small or very large values may
              automatically switch to scientific notation so they’re still readable.
            </li>
            <li>
              <strong>Compact format.</strong> Uses compact notation where supported
              (e.g. <code>1.2K</code>, <code>3.4M</code>) to keep large values short but
              understandable – great for dashboards and summaries.
            </li>
            <li>
              <strong>Scientific format.</strong> Always uses scientific notation
              (e.g. <code>1.23e-9</code>) so that extremely small or large numbers remain
              precise and consistent with academic or technical writing.
            </li>
          </ul>
        
          <p>
            Because the same value is used across all formats, you can switch between
            Normal, Compact and Scientific at any time to see which style works best for
            your current task or audience.
          </p>
        
          {/* ===== Features ===== */}
          <h2
            id="area-converter-features"
            className="text-2xl md:text-3xl font-semibold text-emerald-300 mt-10 mb-4"
          >
            ⚙️ Key Features: Favorites, History, Shortcuts &amp; CSV Export
          </h2>
        
          <p>
            Beyond the core maths, this Area Converter includes several productivity
            features built for people who use it regularly – not just once.
          </p>
        
          <h3 className="text-xl font-semibold text-gray-100 mt-6 mb-2">
            Favorites for your most-used units
          </h3>
          <p>
            If you mostly work with <strong>m², ft², acres and hectares</strong>, scrolling
            through a long list every time is annoying. With favorites:
          </p>
        
          <ul className="list-disc list-inside space-y-1">
            <li>Click <em>Fav</em> on a unit to pin it to the top of the dropdown.</li>
            <li>Favorites appear in a dedicated <strong>“★ Favorites”</strong> group.</li>
            <li>You can quickly toggle a unit on or off the favorites list.</li>
          </ul>
        
          <h3 className="text-xl font-semibold text-gray-100 mt-6 mb-2">
            Recent history for quick back-tracking
          </h3>
          <p>
            Every time you change value or units, the calculator records a small history
            entry (up to the last ten). You’ll see a <strong>Recent</strong> section with
            pill-style buttons like:
            <code>500 m2 → ft2</code> or <code>1 ac → m2</code>. Clicking one instantly
            restores that setup – great for comparing multiple proposals or student exercises.
          </p>
        
          <h3 className="text-xl font-semibold text-gray-100 mt-6 mb-2">
            Keyboard shortcuts for power users
          </h3>
          <p>
            The area converter supports a small but memorable shortcut set:
          </p>
        
          <ul className="list-disc list-inside space-y-1">
            <li><strong>/</strong> – focus the value field.</li>
            <li><strong>S</strong> – focus the <em>From</em> dropdown.</li>
            <li><strong>T</strong> – focus the <em>To</em> dropdown.</li>
            <li><strong>X</strong> – swap From and To units.</li>
          </ul>
        
          <p>
            These work as long as you’re not typing inside another input. They’re perfect
            when you’re converting dozens of values in a single session.
          </p>
        
          <h3 className="text-xl font-semibold text-gray-100 mt-6 mb-2">
            Copy, Copy All &amp; CSV export
          </h3>
          <p>
            Sometimes you just want the raw numbers in another tool. The Area Converter
            gives you multiple ways to extract data:
          </p>
        
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Copy per unit card.</strong> Each result card has a <em>Copy</em>
              button to grab the exact numeric value for that unit.
            </li>
            <li>
              <strong>Copy All.</strong> In the <em>More options</em> panel, you can copy
              the entire grid as plain text – perfect for quick notes or messaging apps.
            </li>
            <li>
              <strong>CSV Export.</strong> Download a <code>.csv</code> file with all units
              and values in two columns (<em>Unit</em>, <em>Value</em>), ready for Excel,
              Google Sheets or reporting pipelines.
            </li>
          </ul>
        
          <p>
            All of this happens locally in your browser – no server round trips, no data
            stored on our side.
          </p>
        
          {/* ===== Examples ===== */}
          <h2
            id="area-converter-examples"
            className="text-2xl md:text-3xl font-semibold text-emerald-300 mt-10 mb-4"
          >
            📈 Practical Examples: Real Estate, Maps, Engineering &amp; Study
          </h2>
        
          <h3 className="text-xl font-semibold text-gray-100 mt-6 mb-2">
            Example 1 – Converting apartment size from m² to ft²
          </h3>
          <p>
            You receive a floor plan specifying <strong>82 m²</strong> of living space,
            but your client prefers square feet. Simply enter <code>82</code>,
            set <code>From: m²</code> and <code>To: ft²</code>, and read the result. You
            can then copy both the ft² value and any other units (such as yd²) if needed
            for brochures or portals.
          </p>
        
          <h3 className="text-xl font-semibold text-gray-100 mt-6 mb-2">
            Example 2 – Estimating farmland from acres to hectares
          </h3>
          <p>
            A seller lists a property as <strong>12.5 acres</strong>, but your reporting
            or tax system expects <strong>hectares</strong>. Set
            <code>From: ac</code> and <code>To: ha</code>, type <code>12.5</code>, and you
            immediately see the area in hectares alongside other equivalents
            (m², km², ft²). This reduces conversion mistakes when drafting contracts or
            working across markets.
          </p>
          <AdBanner type="bottom" />
        
          <h3 className="text-xl font-semibold text-gray-100 mt-6 mb-2">
            Example 3 – Converting map areas from km² to mi²
          </h3>
          <p>
            Perhaps you’re preparing a geography assignment or a travel blog post and
            have an area in <strong>km²</strong> from an official dataset. The converter
            can translate it to <strong>mi²</strong> so your US-based audience can
            intuitively understand the scale, while you can still keep the metric values
            in parentheses.
          </p>
        
          <h3 className="text-xl font-semibold text-gray-100 mt-6 mb-2">
            Example 4 – Tiny technical areas in mm² or µm²
          </h3>
          <p>
            For engineering and electronics, boards or cross-sections are often measured
            in <strong>mm²</strong> or even <strong>µm²</strong>. Rather than manually
            juggling powers of ten, you can type the original mm² figure and explore how
            it looks in m², cm² or scientific notation with a single slider adjustment.
          </p>
        
          {/* ===== Tips & Mistakes ===== */}
          <h2
            id="area-converter-tips"
            className="text-2xl md:text-3xl font-semibold text-emerald-300 mt-10 mb-4"
          >
            🧠 Tips to Avoid Common Area Conversion Mistakes
          </h2>
        
          <p>
            Area conversions are deceptively simple – but it’s very easy to confuse
            <strong>length</strong> and <strong>area</strong> factors. A few quick reminders:
          </p>
        
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Don’t reuse length factors for area.</strong> For example,
              <code>1 inch = 2.54 cm</code>, but <code>1 in² = 6.4516 cm²</code>. The
              factor is squared. The converter’s internal table already accounts for this.
            </li>
            <li>
              <strong>Watch units in formulas.</strong> If you calculate an area from a
              length (like <code>length × width</code>), make sure both lengths are in the
              same unit before multiplying.
            </li>
            <li>
              <strong>Document your assumptions.</strong> When sharing results in reports
              or spreadsheets, write the original unit and the converted unit. The CSV
              export is handy for this.
            </li>
            <li>
              <strong>Use appropriate precision.</strong> Rounding too early can mislead
              stakeholders; over-precision can make results look confusing. Adjust
              decimals to match the real-world accuracy of your measurements.
            </li>
          </ul>
        
          {/* ===== Workflow ===== */}
          <h2
            id="area-converter-workflow"
            className="text-2xl md:text-3xl font-semibold text-emerald-300 mt-10 mb-4"
          >
            📅 Suggested Workflow: Using the Area Converter in Daily Work
          </h2>
        
          <p>
            Instead of treating this Area Converter as a one-off tool, you can build it
            into a simple workflow for your projects:
          </p>
        
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong>Pin your favorite units.</strong> Choose the 3–5 units you use most
              (for example, m², ft², acres and hectares) and mark them as favorites so
              they always appear at the top.
            </li>
            <li>
              <strong>Convert once, reuse often.</strong> For each project, generate a
              quick CSV of all conversions and attach it to your documents – proposals,
              invoices, or study notes.
            </li>
            <li>
              <strong>Share URL states with teammates.</strong> Because the tool syncs
              value and units to the URL query string, you can paste the link in chat and
              your colleagues will see the same setup when they open it.
            </li>
            <li>
              <strong>Use history for what-if comparisons.</strong> Try different input
              values (e.g. different plot sizes or apartment layouts) and use the
              <em>Recent</em> section to quickly jump back through your scenarios.
            </li>
            <li>
              <strong>Combine with other CalculatorHub tools.</strong> After you convert
              areas, you might move on to <strong>length, volume or cost calculators</strong>
              on the site, using the converted numbers as inputs there.
            </li>
          </ol>
        
          {/* ===================== FAQ SECTION ===================== */}
          <section className="space-y-6 mt-16">
            <h2
              id="area-converter-faq"
              className="text-3xl md:text-4xl font-bold mb-4 text-center text-emerald-300"
            >
              ❓ Area Converter – Frequently Asked Questions
            </h2>
        
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
        
              <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q1: Which area units can I convert with this tool?
                </h3>
                <p>
                  The Area Converter supports <strong>square nanometer (nm²)</strong>,
                  <strong> square micrometer (µm²)</strong>,
                  <strong> square millimeter (mm²)</strong>,
                  <strong> square centimeter (cm²)</strong>,
                  <strong> square decimeter (dm²)</strong>,
                  <strong> square meter (m²)</strong>,
                  <strong> are (a)</strong>,
                  <strong> hectare (ha)</strong>,
                  <strong> square kilometer (km²)</strong>,
                  <strong> square inch (in²)</strong>,
                  <strong> square foot (ft²)</strong>,
                  <strong> square yard (yd²)</strong>,
                  <strong> acre (ac)</strong> and
                  <strong> square mile (mi²)</strong>. You can convert in any direction between
                  these units.
                </p>
              </div>
        
              <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q2: How do precision and number formats work?
                </h3>
                <p>
                  Use the <strong>Precision</strong> slider to choose how many decimal
                  places (0–12) you want. Then pick a <strong>format</strong>: Normal for
                  everyday numbers, Compact for dashboard-style values, or Scientific for
                  very small or large areas. You can change these at any time without
                  re-entering your value.
                </p>
              </div>
              <AdBanner type="bottom" />
        
              <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q3: Can I copy or export the conversion results?
                </h3>
                <p>
                  Yes. Each unit card has a <strong>Copy</strong> button that copies the
                  exact numeric value. The <strong>Copy All</strong> button copies the full
                  list of units and values as text, and <strong>CSV Export</strong> lets
                  you download a spreadsheet-friendly <code>.csv</code> file for further
                  analysis or reporting.
                </p>
              </div>
        
              <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q4: Does the Area Converter save my favorites and recent conversions?
                </h3>
                <p>
                  Yes. The tool uses your browser’s local storage to remember your
                  <strong>favorite units</strong> and up to <strong>10 recent
                  conversions</strong>. This data never leaves your device and is not
                  synced to any server, so it’s fast and privacy-friendly.
                </p>
              </div>
        
              <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q5: Is this Area Converter free to use?
                </h3>
                <p>
                  Absolutely. The Area Converter on CalculatorHub is <strong>free</strong>,
                  runs in any modern browser, and does not require sign-up. You can use it
                  as often as you like for school work, professional projects or everyday
                  planning.
                </p>
              </div>
        
            </div>
          </section>
        </section>
        
        {/* =================== AUTHOR & CROSS-LINKS SECTION =================== */}
        <section className="mt-6 border-t border-slate-800 pt-6 text-slate-300 max-w-5xl mx-auto mb-16">
          <div className="flex items-center gap-3">
            <img
              src="/images/calculatorhub-author.webp"
              alt="CalculatorHub converters & tools team"
              className="w-12 h-12 rounded-full border border-slate-600"
              loading="lazy"
            />
            <div>
              <p className="font-semibold text-white">
                Written by the CalculatorHub Converters &amp; Tools Team
              </p>
              <p className="text-sm text-slate-400">
                Specialists in unit conversion, engineering utilities and calculator UX.
                Last updated: <time dateTime="2025-11-09">November 9, 2025</time>.
              </p>
            </div>
          </div>
        
          <div className="mt-8 bg-gradient-to-r from-slate-900/80 via-slate-950/80 to-slate-900/80 rounded-xl border border-slate-700 shadow-inner p-4">
            <p className="text-slate-200 text-sm mb-2 font-medium tracking-wide">
              🔗 Explore more unit &amp; measurement tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/length-converter"
                className="flex items-center gap-2 bg-slate-950 hover:bg-emerald-600/10 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
              >
                <span className="text-emerald-400">📏</span> Length Converter
              </Link>
        
              <Link
                to="/volume-converter"
                className="flex items-center gap-2 bg-slate-950 hover:bg-sky-600/10 text-sky-300 hover:text-sky-400 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
              >
                <span className="text-sky-400">🧪</span> Volume Converter
              </Link>
        
              <Link
                to="/unit-converters"
                className="flex items-center gap-2 bg-slate-950 hover:bg-fuchsia-600/10 text-fuchsia-300 hover:text-fuchsia-400 px-3 py-2 rounded-md border border-slate-700 hover:border-fuchsia-500 transition-all duration-200"
              >
                <span className="text-fuchsia-400">🧮</span> All Unit Converters
              </Link>
            </div>
          </div>
        </section>


        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/area-converter" category="unit-converters" />
      </div>
    </>
  );
}
