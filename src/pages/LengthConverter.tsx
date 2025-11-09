import React, { useEffect, useMemo, useRef, useState } from 'react';
// Keep your project components:
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

/* ---------------- Icons (inline, no deps) ---------------- */
const Icon = {
  Ruler: (p) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V7a2 2 0 0 0-2-2H5m16 11-4 4H5a2 2 0 0 1-2-2V7m18 9-3-3m-2 5-3-3m-2 5-3-3m8-2-3-3m-2 5-3-3m8-2-3-3" />
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

/* ---------------- Units ---------------- */
const LENGTH_UNITS = [
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
const unitMap = Object.fromEntries(LENGTH_UNITS.map(u => [u.key, u]));

const FORMAT_MODES = ['normal', 'compact', 'scientific'];

/* ---------------- Safe storage helpers ---------------- */
function hasWindow() { return typeof window !== 'undefined'; }
function getStorage() {
  if (!hasWindow()) return null;
  try {
    const s = window.localStorage;
    const t = '__chk__';
    s.setItem(t, '1'); s.removeItem(t);
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
export default function LengthConverter() {
  // Default 0, placeholder shows when empty
  const [valueStr, setValueStr] = useState('');
  const [fromUnit, setFromUnit] = useState('meter');
  const [toUnit, setToUnit] = useState('inch');
  const [formatMode, setFormatMode] = useState('normal');
  const [precision, setPrecision] = useState(6);
  const [favorites, setFavorites] = useLocalStorage('length:favorites', ['meter','centimeter','inch','foot']);
  const [history, setHistory] = useLocalStorage('length:history', []);

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
    const base = valueNum * ((unitMap[fromUnit] && unitMap[fromUnit].factor) || 1);
    const out = {};
    for (const u of LENGTH_UNITS) if (u.key !== fromUnit) out[u.key] = base / u.factor;
    return out;
  }, [valueNum, fromUnit]);

  /* ---------- URL sync (safe) ---------- */
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

  /* ---------- Shortcuts (safe) ---------- */
  useEffect(() => {
    if (!hasWindow()) return;
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'SELECT' || (e.target && e.target.isContentEditable)) return;
      if (e.key === '/') { e.preventDefault(); valueRef.current && valueRef.current.focus && valueRef.current.focus(); }
      if (e.key.toLowerCase() === 's') { e.preventDefault(); fromRef.current && fromRef.current.focus && fromRef.current.focus(); }
      if (e.key.toLowerCase() === 't') { e.preventDefault(); toRef.current && toRef.current.focus && toRef.current.focus(); }
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
    if (hasWindow() && navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lines).catch(() => {});
    }
  }
  function exportCSV() {
    const headers = ['Unit','Value'];
    const rows = Object.entries(gridResults).map(([k, v]) => [unitMap[k].name, String(v)]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = (hasWindow() && URL && URL.createObjectURL) ? URL.createObjectURL(blob) : null;
      if (url && hasWindow()) {
        const a = document.createElement('a');
        a.href = url; a.download = 'length-conversion.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
      }
    } catch {}
  }

  const favored = LENGTH_UNITS.filter(u => favorites.includes(u.key));
  const unfavored = LENGTH_UNITS.filter(u => !favorites.includes(u.key));
  const hasInput = (valueStr || '').trim() !== '';

  return (
    <>
     {/** ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Length Converter — Meter to Feet, cm to inch, km to miles (2025–2026)"
        description="Free Length Converter with precision control, scientific/compact formats, favorites, history, and shareable links. Convert meters to feet, cm to inches, km to miles, and more — fast and privacy-friendly."
        keywords={[
          "length converter",
          "unit converter length",
          "meter to feet",
          "meters to inches",
          "cm to inch",
          "mm to inch",
          "km to miles",
          "inches to cm",
          "feet to meter",
          "length conversion table",
          "scientific notation",
          "precision control"
        ]}
        canonical="https://calculatorhub.site/length-converter"
        schemaData={[
          // 1) WebPage + Article
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://calculatorhub.site/length-converter#webpage",
            "url": "https://calculatorhub.site/length-converter",
            "name": "Length Converter (2025–2026) — Meter to Feet, cm ⇄ inch, km ⇄ miles",
            "inLanguage": "en",
            "isPartOf": { "@id": "https://calculatorhub.site/#website" },
            "primaryImageOfPage": {
              "@type": "ImageObject",
              "@id": "https://calculatorhub.site/images/length-converter-hero.webp#primaryimg",
              "url": "https://calculatorhub.site/images/length-converter-hero.webp",
              "width": 1200,
              "height": 675
            },
            "mainEntity": {
              "@type": "Article",
              "@id": "https://calculatorhub.site/length-converter#article",
              "headline": "Length Converter — Fast, Accurate, and Shareable",
              "description": "Convert between nanometers, micrometers, millimeters, centimeters, meters, kilometers, inches, feet, yards, and miles. Includes precision/format controls, favorites, history, and CSV export.",
              "image": ["https://calculatorhub.site/images/length-converter-hero.webp"],
              "author": { "@type": "Organization", "name": "CalculatorHub", "url": "https://calculatorhub.site" },
              "publisher": { "@id": "https://calculatorhub.site/#organization" },
              "datePublished": "2025-11-09",
              "dateModified": "2025-11-09",
              "mainEntityOfPage": { "@id": "https://calculatorhub.site/length-converter#webpage" },
              "articleSection": [
                "How to Use",
                "Supported Units",
                "Precision & Format",
                "Shortcuts",
                "CSV Export",
                "FAQ"
              ]
            }
          },
      
          // 2) Breadcrumbs
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "@id": "https://calculatorhub.site/length-converter#breadcrumbs",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://calculatorhub.site/" },
              { "@type": "ListItem", "position": 2, "name": "Unit Converters", "item": "https://calculatorhub.site/category/unit-converters" },
              { "@type": "ListItem", "position": 3, "name": "Length Converter", "item": "https://calculatorhub.site/length-converter" }
            ]
          },
      
          // 3) FAQ
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://calculatorhub.site/length-converter#faq",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Which length units are supported?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Nanometer, micrometer, millimeter, centimeter, meter, kilometer, inch, foot, yard, and mile."
                }
              },
              {
                "@type": "Question",
                "name": "How do precision and formats work?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Use the slider to set decimals (0–12). Choose Normal, Compact, or Scientific to format results. Extremely small/large values auto-switch to scientific in Normal if needed."
                }
              },
              {
                "@type": "Question",
                "name": "Can I copy or export results?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Copy the full grid or export CSV with one click. You can also share state via URL parameters."
                }
              },
              {
                "@type": "Question",
                "name": "Does the converter remember my favorites and history?",
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
            "@id": "https://calculatorhub.site/length-converter#webapp",
            "name": "Length Converter",
            "url": "https://calculatorhub.site/length-converter",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web",
            "description": "Length conversion with precision, scientific formatting, favorites, history, and CSV export.",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "image": ["https://calculatorhub.site/images/length-converter-hero.webp"]
          },
      
          // 5) SoftwareApplication (optional)
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://calculatorhub.site/length-converter#software",
            "name": "Advanced Length Converter",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "All",
            "url": "https://calculatorhub.site/length-converter",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "description": "Interactive length unit converter with shareable links and export."
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
      <link rel="canonical" href="https://calculatorhub.site/length-converter" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/length-converter" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/length-converter" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/length-converter" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Length Converter (2025–2026) — Meter ⇄ Feet, cm ⇄ inch, km ⇄ miles" />
      <meta property="og:description" content="Convert length units with precision and scientific/compact formats. Favorites, history, CSV export, and shareable URLs." />
      <meta property="og:url" content="https://calculatorhub.site/length-converter" />
      <meta property="og:image" content="https://calculatorhub.site/images/length-converter-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Length converter dashboard showing unit swaps and formatted results" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Length Converter — Meter to Feet, cm to inch, km to miles" />
      <meta name="twitter:description" content="Fast, accurate length conversions with precision controls, favorites, history, and CSV export." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/length-converter-hero.webp" />
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
      <link rel="preload" as="image" href="/images/length-converter-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />


      <div className="max-w-5xl mx-auto text-gray-200">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Length Converter', url: '/length-converter' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 rounded-2xl p-6 bg-gradient-to-r from-blue-900 via-indigo-800 to-purple-800 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">Length Converter (Advanced)</h1>
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
              <p className="text-xs text-gray-500 mt-1">Empty counts as 0. Commas allowed (1,234.56).</p>
            </div>

            {/* From */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">From</label>
              <select
                ref={fromRef}
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              onClick={() => swapUnits()}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 flex items-center gap-2"
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
            {LENGTH_UNITS.map((unit) => {
              if (unit.key === fromUnit) return null;
              const val = gridResults[unit.key];
              const display = formatNumber(val ?? 0, formatMode, precision);
              return (
                <div key={unit.key} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:bg-gray-700/70 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon.Ruler style={{ width: 16, height: 16, color: '#60a5fa' }} />
                      <span className="text-sm font-medium text-gray-200 truncate">{unit.name}</span>
                    </div>
                    <button
                      type="button"
                      className="text-xs px-2 py-1 border border-gray-600 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200"
                      onClick={() => {
                        if (hasWindow() && navigator && navigator.clipboard && navigator.clipboard.writeText && Number.isFinite(val)) {
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
        

        {/* ==================== SEO CONTENT SECTION (Extended ~2000 words) ==================== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
        
          {/* ===== Table of Contents ===== */}
          <nav className="mt-2 mb-10 bg-[#0f172a] border border-[#334155] rounded-xl p-5 text-slate-200">
            <h2 className="text-lg font-semibold text-cyan-300 mb-3">📖 Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><a href="#overview" className="text-indigo-400 hover:underline">Overview: What This Length Converter Does</a></li>
              <li><a href="#how-to-use" className="text-indigo-400 hover:underline">How to Use the Converter</a></li>
              <li><a href="#units" className="text-indigo-400 hover:underline">Supported Units & Core Relationships</a></li>
              <li><a href="#precision-format" className="text-indigo-400 hover:underline">Precision & Number Formats</a></li>
              <li><a href="#shortcuts" className="text-indigo-400 hover:underline">Shortcuts, Favorites, History & Sharing</a></li>
              <li><a href="#examples" className="text-indigo-400 hover:underline">Worked Examples</a></li>
              <li><a href="#use-cases" className="text-indigo-400 hover:underline">Real-World Use Cases</a></li>
              <li><a href="#accuracy" className="text-indigo-400 hover:underline">Accuracy, Rounding & Best Practices</a></li>
              <li><a href="#pitfalls" className="text-indigo-400 hover:underline">Common Pitfalls to Avoid</a></li>
              <li><a href="#mini-table" className="text-indigo-400 hover:underline">Quick Reference Mini-Table</a></li>
              <li><a href="#benefits" className="text-indigo-400 hover:underline">Benefits</a></li>
              <li><a href="#tips" className="text-indigo-400 hover:underline">Power Tips</a></li>
              <li><a href="#accessibility" className="text-indigo-400 hover:underline">Accessibility & Performance</a></li>
              <li><a href="#pros-cons" className="text-indigo-400 hover:underline">Pros &amp; Cons</a></li>
              <li><a href="#faq" className="text-indigo-400 hover:underline">FAQ</a></li>
            </ol>
          </nav>
        
          {/* ===== Overview ===== */}
          <h1 id="overview" className="text-3xl font-bold text-cyan-400 mb-6">
            Length Converter — Meter ⇄ Feet, cm ⇄ inch, km ⇄ miles (Advanced, Fast & Shareable)
          </h1>
        
          <p>
            Precision matters — whether you’re drafting a part for 3D printing, checking fabric measurements, laying out a room,
            or preparing a lab report. The <strong>Length Converter by CalculatorHub</strong> is built for speed, accuracy, and
            clarity. Convert between <strong>metric and imperial</strong> units instantly, control <strong>precision</strong> down
            to 12 decimals, and format results for your audience with <strong>Normal</strong>, <strong>Compact</strong>, or
            <strong> Scientific</strong> notation. Your favorite units and recent conversions are saved locally, and the URL
            <em>automatically</em> captures your current settings so you can share or bookmark the exact state.
          </p>
        
          <p>
            Under the hood, the converter relies on SI-consistent factors (e.g., <strong>1 inch = 2.54 cm</strong>, 
            <strong>1 foot = 0.3048 m</strong>, <strong>1 mile = 1609.344 m</strong>) to ensure engineering-grade consistency.
            The UI is tuned for daily workflows: keyboard shortcuts, copy buttons, one-click CSV export, and an <strong>All Units</strong>
            grid that gives you the full picture at a glance. It’s a lightweight, privacy-friendly tool that feels fast on any device.
          </p>
        
          <figure className="my-8">
            <img
              src="/images/length-converter-hero.webp"
              alt="Length converter interface showing value input, unit selection, precision slider and results grid"
              title="Length Converter — meters to feet, centimeters to inches, kilometers to miles"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Convert between metric and imperial instantly — copy exact values or export a CSV for reports and spreadsheets.
            </figcaption>
          </figure>
        
          {/* ===== How to Use ===== */}
          <h2 id="how-to-use" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            💡 How to Use the Converter
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter your <strong>Value</strong>. You can include commas (e.g., 1,234.56). Empty counts as 0.</li>
            <li>Pick a <strong>From</strong> unit (starting unit) — for example, meters.</li>
            <li>Pick a <strong>To</strong> unit (target unit) — for example, inches.</li>
            <li>Open <em>More options</em> to set <strong>Precision</strong> (0–12 decimals) and your preferred <strong>Format</strong>.</li>
            <li>See the <strong>Direct Result</strong> instantly and browse the <strong>All Units</strong> grid to compare every unit at once.</li>
          </ol>
          <p className="text-sm text-slate-400">
            Your <em>value, from, to, format,</em> and <em>precision</em> sync into the URL, so sharing or bookmarking recreates
            the exact same view for teammates and clients.
          </p>
        
          {/* ===== Units & Relationships ===== */}
          <h2 id="units" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📏 Supported Units & Core Relationships
          </h2>
          <p>
            Supported units include: <strong>nanometer (nm)</strong>, <strong>micrometer (µm)</strong>, <strong>millimeter (mm)</strong>,
            <strong> centimeter (cm)</strong>, <strong>meter (m)</strong>, <strong>kilometer (km)</strong>,
            <strong> inch (in)</strong>, <strong>foot (ft)</strong>, <strong>yard (yd)</strong>, and <strong>mile (mi)</strong>.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>1 inch</strong> = <strong>2.54 cm</strong> exactly</li>
            <li><strong>1 foot</strong> = <strong>12 inches</strong> = <strong>0.3048 m</strong> exactly</li>
            <li><strong>1 yard</strong> = <strong>3 feet</strong> = <strong>0.9144 m</strong></li>
            <li><strong>1 mile</strong> = <strong>5280 feet</strong> = <strong>1609.344 m</strong></li>
            <li><strong>1 m</strong> = <strong>100 cm</strong> = <strong>1000 mm</strong> = <strong>1e6 µm</strong> = <strong>1e9 nm</strong></li>
          </ul>
          <p>
            These factors align with modern standards used in design tools, scientific calculations, and construction documents,
            ensuring cross-disciplinary consistency.
          </p>
        
          {/* ===== Precision & Formats ===== */}
          <h2 id="precision-format" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🎯 Precision & Number Formats (Normal, Compact, Scientific)
          </h2>
          <p>
            Data presentation is as important as data correctness. With <strong>Precision</strong>, choose the right number of
            decimals (0–12) for your audience: high precision for scientific work, fewer decimals for readable client proposals.
            With <strong>Format</strong>, you control styling:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Normal</strong> — standard notation with automatic trimming of trailing zeros.</li>
            <li><strong>Compact</strong> — concise, human-friendly notation (e.g., 1.2K, 3.4M) for large values.</li>
            <li><strong>Scientific</strong> — e-notation for lab, nano-scale, or very large-scale work.</li>
          </ul>
          <p className="text-sm text-slate-400">
            Extremely small or large magnitudes may automatically switch to scientific when Normal is selected, preserving readability and intent.
          </p>
        
          {/* ===== Shortcuts & Sharing ===== */}
          <h2 id="shortcuts" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ⚡ Shortcuts, Favorites, History & CSV/Copy
          </h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Keyboard</strong>: <kbd>/</kbd> focus value, <kbd>S</kbd> focus From, <kbd>T</kbd> focus To, <kbd>X</kbd> swap units.</li>
            <li><strong>Favorites</strong>: pin go-to units (e.g., m, cm, in, ft) to the top of the list.</li>
            <li><strong>History</strong>: your last 10 conversions are stored locally for quick reuse.</li>
            <li><strong>Copy</strong>: grab any single value or <em>Copy All</em> to capture the full results grid.</li>
            <li><strong>CSV export</strong>: download for spreadsheets, QA logging, or documentation.</li>
            <li><strong>Shareable URL</strong>: inputs and preferences live in the link — send a precise snapshot to anyone.</li>
          </ul>
        
          {/* ===== Worked Examples ===== */}
          <h2 id="examples" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📈 Worked Examples (Rounded to 5–6 Significant Digits)
          </h2>
          <ul className="space-y-2">
            <li><strong>1 meter → feet</strong>: 1 m ≈ <strong>3.28084 ft</strong>.</li>
            <li><strong>2.5 m → inches</strong>: 2.5 m ≈ <strong>98.4252 in</strong>.</li>
            <li><strong>10 cm → inches</strong>: 10 cm ÷ 2.54 ≈ <strong>3.93701 in</strong>.</li>
            <li><strong>12 inches → centimeters</strong>: 12 in × 2.54 = <strong>30.48 cm</strong> exactly.</li>
            <li><strong>5 km → miles</strong>: 5 km ÷ 1.609344 ≈ <strong>3.10686 mi</strong>.</li>
            <li><strong>1 mile → meters</strong>: 1 mi = <strong>1609.344 m</strong> exactly.</li>
            <li><strong>750 µm → mm</strong>: 750 µm = <strong>0.75 mm</strong>.</li>
            <li><strong>250,000 nm → µm</strong>: 250,000 nm = <strong>250 µm</strong>.</li>
            <li><strong>0.1 mm → µm</strong>: 0.1 mm = <strong>100 µm</strong>.</li>
            <li><strong>2 yd → ft</strong>: 2 yd = <strong>6 ft</strong>.</li>
          </ul>
          <p className="text-sm text-slate-400">
            Your live page honors whatever <em>Precision</em> and <em>Format</em> you’ve selected, so reported values match your needs.
          </p>
        
          {/* ===== Real-World Use Cases ===== */}
          <h2 id="use-cases" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧰 Real-World Use Cases (Who This Helps & Why)
          </h2>
          <p>
            The converter is designed to be broadly useful yet detail-oriented. Here are common scenarios where it shines:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Engineering & CAD</strong>: Convert metric drawings to imperial specs (and back) with repeatable, SI-consistent factors. Export a CSV for documentation or change-logs.</li>
            <li><strong>Construction & Interior</strong>: Move seamlessly between feet, inches, and meters for room dimensions, material lengths, cabinetry, or fixture placements.</li>
            <li><strong>3D Printing & Prototyping</strong>: Toggle between mm and inches for slicer settings, tolerances, and BOM notes; share the URL with your exact precision.</li>
            <li><strong>Science & Lab</strong>: Use nm/µm/mm ranges for microscopy, optics, and microfluidics; switch to Scientific format for clean lab notes.</li>
            <li><strong>Education</strong>: Teach students how unit factors relate across scales; the All Units grid makes patterns intuitive.</li>
            <li><strong>Apparel/Fashion</strong>: Convert size specs from cm to inches for tech packs, grading sheets, and vendor communication.</li>
            <li><strong>Content & Marketing</strong>: Prepare web copy or infographics with Compact numbers for scannability, then swap to Normal or Scientific for whitepapers.</li>
            <li><strong>Logistics</strong>: Communicate dimensions across international vendors without ambiguity, pinned favorites reduce repetitive setup.</li>
          </ul>
        
          {/* ===== Accuracy & Best Practices ===== */}
          <h2 id="accuracy" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ✅ Accuracy, Rounding & Best Practices
          </h2>
          <p>
            The conversion math follows exact definitions where applicable (e.g., 1 in = 2.54 cm, 1 ft = 0.3048 m). Internally,
            values are computed with double-precision floating point, then formatted according to your chosen settings. For
            <strong> compliance-sensitive</strong> work:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Use enough decimals to avoid cumulative error in downstream calculations.</li>
            <li>Lock the <strong>Format</strong> to <strong>Scientific</strong> for lab documentation if your SOP requires it.</li>
            <li>When preparing client-facing PDFs, consider <strong>Normal</strong> with trimmed zeros for readability.</li>
            <li>Include your chosen precision in footnotes or captions to prevent misinterpretation.</li>
          </ul>
          <p>
            Remember that rounding affects totals: if you add rounded numbers, discrepancies may appear. For roll-ups, export the <strong>CSV</strong>
            and let your spreadsheet handle aggregation at higher internal precision, then round at the end.
          </p>
        
          {/* ===== Pitfalls ===== */}
          <h2 id="pitfalls" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ⚠️ Common Pitfalls to Avoid
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Swapping units mentally</strong>: Use the <kbd>X</kbd> shortcut to flip From/To and confirm direction.</li>
            <li><strong>Inconsistent decimals</strong>: When collaborating, agree on a precision—then share the URL with that precision locked.</li>
            <li><strong>Mixing typographic marks</strong>: Watch for commas vs periods in locales; your input allows commas, but confirm final documents use the correct style guide.</li>
            <li><strong>Under-reporting precision</strong>: If tolerances are tight (e.g., µm-level), choose sufficient decimals or Scientific format.</li>
          </ul>
        
          {/* ===== Quick Reference Table (mini) ===== */}
          <h2 id="mini-table" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🗂️ Quick Reference Mini-Table
          </h2>
          <p className="text-sm text-slate-400 mb-3">
            Handy approximations and exact definitions you’ll use often:
          </p>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li>1 m ≈ 3.28084 ft</li>
              <li>1 ft = 0.3048 m (exact)</li>
              <li>1 cm ≈ 0.393701 in</li>
              <li>1 in = 2.54 cm (exact)</li>
              <li>1 km ≈ 0.621371 mi</li>
              <li>1 mi = 1609.344 m (exact)</li>
              <li>1 mm = 1000 µm</li>
              <li>1 µm = 1000 nm</li>
            </ul>
          </div>
        
          {/* ===== Benefits ===== */}
          <h2 id="benefits" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🌟 Benefits You’ll Notice Immediately
          </h2>
          <ul className="space-y-2">
            <li>✔️ <strong>Accurate, SI-consistent</strong> unit factors suitable for engineering and academic work.</li>
            <li>✔️ Instant <strong>two-way conversion</strong> plus an <strong>All Units</strong> grid for complete context.</li>
            <li>✔️ <strong>Precision & formatting</strong> tailored to your workflow and audience.</li>
            <li>✔️ <strong>Favorites & history</strong> to minimize clicks throughout the day.</li>
            <li>✔️ <strong>Copy/CSV export</strong> for reports, QC logs, and classroom handouts.</li>
            <li>✔️ <strong>Privacy-friendly</strong> local storage; no account required.</li>
          </ul>
        
          {/* ===== Power Tips ===== */}
          <h2 id="tips" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧭 Power Tips to Work Faster
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Pin 3–5 <strong>Favorites</strong> (e.g., m, cm, in, ft) to reduce scrolling on each task.</li>
            <li>Use <strong>Scientific</strong> for tiny/huge values to prevent misreading zeros in documents.</li>
            <li><strong>Export CSV</strong> for internal validation or sharing precise “behind-the-scenes” numbers.</li>
            <li><strong>Bookmark the URL</strong> with your chosen precision/format for repeatable weekly workflows.</li>
            <li>Switch to <strong>Compact</strong> for dashboard UIs and presentations where space is tight.</li>
          </ul>
        
          {/* ===== Accessibility & Performance ===== */}
          <h2 id="accessibility" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ♿ Accessibility & Performance Considerations
          </h2>
          <p>
            The interface supports keyboard navigation and includes descriptive labels for inputs, selects, and actions.
            The dark theme enhances contrast in low-light environments, and the layout scales gracefully across mobile,
            tablet, and desktop. Images include <em>alt</em> text, and interactive elements expose accessible names and roles.
          </p>
          <p>
            Performance wise, calculations are instantaneous, and your settings are stored locally for a snappy return visit.
            Preloaded assets (fonts, hero image) and cautious use of effects keep the experience smooth without compromising accuracy.
          </p>
        
          {/* ===== Pros / Cons ===== */}
          <h2 id="pros-cons" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ⚖️ Pros & Cons
          </h2>
          <p className="mb-2">A quick, balanced view to set expectations.</p>
          <p><strong>Pros:</strong></p>
          <ul>
            <li>Exact base definitions and careful formatting logic.</li>
            <li>Fast, keyboard-friendly UI with local persistence.</li>
            <li>Full grid view for instant comparisons and sanity checks.</li>
          </ul>
          <p><strong>Cons:</strong></p>
          <ul>
            <li>Focuses on length; for area/volume/mass, use our dedicated tools.</li>
            <li>Rounding is user-controlled; agree on a standard with your team.</li>
            <li>Locale differences (comma vs period) can affect presentation style — choose the right format.</li>
          </ul>
        
          {/* ===== FAQ ===== */}
          <section className="space-y-6 mt-16">
            <h2 id="faq" className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>
        
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q1: Which units can I convert?</h3>
                <p>
                  Nanometer, micrometer, millimeter, centimeter, meter, kilometer, inch, foot, yard, and mile — with instant
                  two-way conversion and an All Units grid for context.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q2: How do precision and formats work?</h3>
                <p>
                  Set decimals from 0–12 and choose Normal, Compact, or Scientific. Very small/large values may display in Scientific
                  when Normal is selected to preserve readability.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q3: Can I save my most-used units?</h3>
                <p>
                  Yes. Mark any unit as a Favorite. Your favorites and the last 10 conversions are saved locally in your browser for quick access.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q4: Can I share or export results?</h3>
                <p>
                  Absolutely. Copy individual values, use <strong>Copy All</strong> for the full grid, export a <strong>CSV</strong>,
                  or share the page URL — it encodes your current state (value, units, format, precision).
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q5: Is my data stored on a server?</h3>
                <p>
                  No. Favorites and history live entirely in your browser. We don’t require accounts or store your inputs remotely.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q6: Why do my totals sometimes differ when I add rounded numbers?</h3>
                <p>
                  Rounding each value independently can create small discrepancies. Export the CSV and perform aggregation at high precision,
                  then round at the end for publication.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q7: Does locale affect formatting?</h3>
                <p>
                  Yes. Your browser locale can influence separators and compact notation. If you need a specific style (e.g., period decimals),
                  adjust the format or finalize in your document editor.
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
                href="/area-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
              >
                <span className="text-indigo-400">📐</span> Area Converter
              </a>
        
              <a
                href="/volume-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-400 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
              >
                <span className="text-sky-400">🧪</span> Volume Converter
              </a>
        
              <a
                href="/unit-converters"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-pink-600/20 text-pink-300 hover:text-pink-400 px-3 py-2 rounded-md border border-slate-700 hover:border-pink-500 transition-all duration-200"
              >
                <span className="text-pink-400">🧭</span> All Unit Converters
              </a>
            </div>
          </div>
        </section>


        

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/length-converter" category="unit-converters" />
      </div>
    </>
  ); 
}
