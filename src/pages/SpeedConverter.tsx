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
  Speedo: (p) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12A9 9 0 1 1 3 12" />
      <path d="M12 3v3M4.6 5.6l2.1 2.1M3 12h3M18.3 7.7l-2.1 2.1M21 12h-3" />
      <path d="M12 12l4-4" />
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

/* ---------------- Units (factors are meters per second per 1 unit) ---------------- */
const SPEED_UNITS = [
  { key: 'mmps',  name: 'Millimeter per second (mm/s)', factor: 0.001 },
  { key: 'cmps',  name: 'Centimeter per second (cm/s)', factor: 0.01 },
  { key: 'mps',   name: 'Meter per second (m/s)',       factor: 1 },
  { key: 'kph',   name: 'Kilometer per hour (km/h)',    factor: 1000 / 3600 },    // 0.2777777778
  { key: 'kmps',  name: 'Kilometer per second (km/s)',  factor: 1000 },
  { key: 'fps',   name: 'Foot per second (ft/s)',       factor: 0.3048 },
  { key: 'ips',   name: 'Inch per second (in/s)',       factor: 0.0254 },
  { key: 'mph',   name: 'Mile per hour (mph)',          factor: 1609.344 / 3600 },// 0.44704
  { key: 'knot',  name: 'Knot (kn)',                    factor: 1852 / 3600 },    // 0.514444...
  { key: 'c',     name: 'Speed of light (c)',           factor: 299792458 },      // exact (m/s)
];
const unitMap = Object.fromEntries(SPEED_UNITS.map(u => [u.key, u]));
const FORMAT_MODES = ['normal', 'compact', 'scientific'];

/* ---------------- Safe storage helpers ---------------- */
function hasWindow() { return typeof window !== 'undefined'; }
function getStorage() {
  if (!hasWindow()) return null;
  try {
    const s = window.localStorage; const t = '__chk__'; s.setItem(t, '1'); s.removeItem(t); return s;
  } catch { return null; }
}
const storage = getStorage();
function useLocalStorage(key, initial) {
  const [state, setState] = useState(() => {
    if (!storage) return initial;
    try { const raw = storage.getItem(key); return raw ? JSON.parse(raw) : initial; }
    catch { return initial; }
  });
  useEffect(() => { if (storage) { try { storage.setItem(key, JSON.stringify(state)); } catch {} } }, [key, state]);
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
  return mode === 'compact' ? s : s.replace(/([.,]\d*?[1-9])0+$/, '$1').replace(/([.,])0+$/, '');
}

/* ---------------- Component ---------------- */
export default function SpeedConverter() {
  const [valueStr, setValueStr] = useState('');
  const [fromUnit, setFromUnit] = useState('mps');
  const [toUnit, setToUnit] = useState('kph');
  const [formatMode, setFormatMode] = useState('normal');
  const [precision, setPrecision] = useState(6);
  const [favorites, setFavorites] = useLocalStorage('speed:favorites', ['mps','kph','mph','knot']);
  const [history, setHistory] = useLocalStorage('speed:history', []);

  const valueRef = useRef(null);
  const fromRef = useRef(null);
  const toRef = useRef(null);

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
    const base = valueNum * ((unitMap[fromUnit] && unitMap[fromUnit].factor) || 1);
    const out = {};
    for (const u of SPEED_UNITS) if (u.key !== fromUnit) out[u.key] = base / u.factor;
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
        a.href = url; a.download = 'speed-conversion.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
      }
    } catch {}
  }

  const favored = SPEED_UNITS.filter(u => favorites.includes(u.key));
  const unfavored = SPEED_UNITS.filter(u => !favorites.includes(u.key));
  const hasInput = (valueStr || '').trim() !== '';

  return (
    <>
      {/** ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Speed Converter — m/s ⇄ km/h, mph, knots, ft/s & more (2025–2026)"
        description="Free Speed Converter with precision control, Normal/Compact/Scientific formats, favorites, history, CSV export, and shareable URLs. Convert m/s, km/h, mph, knots, ft/s, in/s, and even fractions of light speed (c)."
        keywords={[
          "speed converter",
          "mps to kph",
          "kph to mps",
          "mph to kph",
          "knots to mph",
          "ft/s to m/s",
          "in/s to m/s",
          "km/s to m/s",
          "speed of light c to m/s",
          "convert speed units",
          "precision converter",
          "scientific notation"
        ]}
        canonical="https://calculatorhub.site/speed-converter"
        schemaData={[
          // 1) WebPage + Article
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://calculatorhub.site/speed-converter#webpage",
            "url": "https://calculatorhub.site/speed-converter",
            "name": "Speed Converter (2025–2026) — m/s ⇄ km/h, mph, knots, ft/s",
            "inLanguage": "en",
            "isPartOf": { "@id": "https://calculatorhub.site/#website" },
            "primaryImageOfPage": {
              "@type": "ImageObject",
              "@id": "https://calculatorhub.site/images/speed-converter-hero.webp#primaryimg",
              "url": "https://calculatorhub.site/images/speed-converter-hero.webp",
              "width": 1200,
              "height": 675
            },
            "mainEntity": {
              "@type": "Article",
              "@id": "https://calculatorhub.site/speed-converter#article",
              "headline": "Speed Converter — Fast, Accurate, and Shareable",
              "description": "Convert between mm/s, cm/s, m/s, km/h, km/s, ft/s, in/s, mph, knots, and c. Includes precision & format controls, favorites, history, shortcuts, and CSV export.",
              "image": ["https://calculatorhub.site/images/speed-converter-hero.webp"],
              "author": { "@type": "Organization", "name": "CalculatorHub", "url": "https://calculatorhub.site" },
              "publisher": { "@id": "https://calculatorhub.site/#organization" },
              "datePublished": "2025-11-09",
              "dateModified": "2025-11-09",
              "mainEntityOfPage": { "@id": "https://calculatorhub.site/speed-converter#webpage" },
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
            "@id": "https://calculatorhub.site/speed-converter#breadcrumbs",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://calculatorhub.site/" },
              { "@type": "ListItem", "position": 2, "name": "Unit Converters", "item": "https://calculatorhub.site/category/unit-converters" },
              { "@type": "ListItem", "position": 3, "name": "Speed Converter", "item": "https://calculatorhub.site/speed-converter" }
            ]
          },
      
          // 3) FAQ
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://calculatorhub.site/speed-converter#faq",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Which speed units are supported?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Millimeter/second, centimeter/second, meter/second, kilometer/hour, kilometer/second, foot/second, inch/second, mile/hour, knot, and speed of light (c)."
                }
              },
              {
                "@type": "Question",
                "name": "How do precision and formats work?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Set decimals from 0–12 and choose Normal, Compact, or Scientific formatting. Extremely small/large results can auto-swap to scientific in Normal mode."
                }
              },
              {
                "@type": "Question",
                "name": "Can I copy or export results?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Copy the full grid or download a CSV. The tool also preserves state in the URL for easy sharing."
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
            "@id": "https://calculatorhub.site/speed-converter#webapp",
            "name": "Speed Converter",
            "url": "https://calculatorhub.site/speed-converter",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web",
            "description": "Speed conversion with precision controls, Normal/Compact/Scientific formats, favorites, history, and CSV export.",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "image": ["https://calculatorhub.site/images/speed-converter-hero.webp"]
          },
      
          // 5) SoftwareApplication (optional)
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://calculatorhub.site/speed-converter#software",
            "name": "Advanced Speed Converter",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "All",
            "url": "https://calculatorhub.site/speed-converter",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "description": "Interactive speed unit converter with shareable links and CSV export."
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
      <link rel="canonical" href="https://calculatorhub.site/speed-converter" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/speed-converter" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/speed-converter" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/speed-converter" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Speed Converter (2025–2026) — m/s ⇄ km/h, mph, knots, ft/s" />
      <meta property="og:description" content="Convert speed units with precision controls, Normal/Compact/Scientific formats, favorites, history, CSV export, and shareable URLs." />
      <meta property="og:url" content="https://calculatorhub.site/speed-converter" />
      <meta property="og:image" content="https://calculatorhub.site/images/speed-converter-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Speed converter UI showing unit swapping and formatted results" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Speed Converter — m/s, km/h, mph, knots & more" />
      <meta name="twitter:description" content="Fast, accurate speed conversions with precision controls, favorites, history, and CSV export." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/speed-converter-hero.webp" />
      <meta name="twitter:creator" content="@CalculatorHub" />
      <meta name="twitter:site" content="@CalculatorHub" />
      
      {/** PWA & theme */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#06b6d4" />
      
      {/** Performance */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="preload" as="image" href="/images/speed-converter-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />


      <div className="max-w-5xl mx-auto text-gray-200">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Speed Converter', url: '/speed-converter' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 rounded-2xl p-6 bg-gradient-to-r from-cyan-900 via-blue-900 to-indigo-900 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">Speed Converter (Advanced)</h1>
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
                  className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  aria-label="Enter speed value"
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
            {SPEED_UNITS.map((unit) => {
              if (unit.key === fromUnit) return null;
              const val = gridResults[unit.key];
              const display = formatNumber(val ?? 0, formatMode, precision);
              return (
                <div key={unit.key} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:bg-gray-700/70 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon.Speedo style={{ width: 16, height: 16, color: '#22d3ee' }} />
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

        {/* ========== SEO CONTENT SECTION: Speed Converter (EN only) ============ */}
          <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
            <header className="mb-10">
              <h1 className="text-3xl font-bold text-cyan-300">Speed Converter — m/s, km/h, mph, knots, ft/s & more</h1>
              <p className="mt-2 text-slate-300">
                From dashboards to research labs, unit-accurate speed matters. This converter instantly translates between 
                <strong> m/s</strong>, <strong>km/h</strong>, <strong>mph</strong>, <strong>knots</strong>, <strong>ft/s</strong>, 
                <strong> in/s</strong>, <strong>km/s</strong>, and even fractions of <strong>c</strong>. Control precision and 
                formatting, pin favorites, revisit recent conversions, export CSV, and share exact states via URL.
              </p>
            </header>
          
            {/* TOC */}
            <nav className="mt-2 mb-10 bg-[#0f172a] border border-[#334155] rounded-xl p-5 text-slate-200">
              <h2 className="text-lg font-semibold text-cyan-300 mb-3">📖 Table of Contents</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li><a href="#en-overview" className="text-cyan-400 hover:underline">Overview</a></li>
                <li><a href="#en-how" className="text-cyan-400 hover:underline">How to Use</a></li>
                <li><a href="#en-units" className="text-cyan-400 hover:underline">Supported Units</a></li>
                <li><a href="#en-method" className="text-cyan-400 hover:underline">Method (m/s Base)</a></li>
                <li><a href="#en-precision" className="text-cyan-400 hover:underline">Precision & Formats</a></li>
                <li><a href="#en-shortcuts" className="text-cyan-400 hover:underline">Keyboard Shortcuts</a></li>
                <li><a href="#en-examples" className="text-cyan-400 hover:underline">Worked Examples</a></li>
                <li><a href="#en-usecases" className="text-cyan-400 hover:underline">Use Cases</a></li>
                <li><a href="#en-pitfalls" className="text-cyan-400 hover:underline">Common Pitfalls</a></li>
                <li><a href="#en-quick" className="text-cyan-400 hover:underline">Quick Reference</a></li>
                <li><a href="#en-faq" className="text-cyan-400 hover:underline">FAQ</a></li>
              </ol>
            </nav>
          
            <h2 id="en-overview" className="text-2xl font-semibold text-cyan-300 mt-6 mb-3">Overview</h2>
            <p>
              The converter uses <em>meters per second (m/s)</em> as the base unit and applies exact factors for each supported unit. 
              This keeps calculations transparent and audit-ready. With URL state sync, shared links reproduce your precise inputs, units, 
              format, and precision.
            </p>
          
            <h2 id="en-how" className="text-2xl font-semibold text-cyan-300 mt-6 mb-3">How to Use</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>Enter a <strong>Value</strong> (blank counts as 0; commas allowed).</li>
              <li>Select <strong>From</strong> and <strong>To</strong> units; hit <strong>Swap</strong> if needed.</li>
              <li>Adjust <strong>Precision</strong> (0–12) and choose a <strong>Format</strong> (Normal/Compact/Scientific).</li>
              <li>Use <strong>Copy All</strong> or export <strong>CSV</strong>; pin frequent units and revisit <strong>Recent</strong>.</li>
            </ol>
          
            <h2 id="en-units" className="text-2xl font-semibold text-cyan-300 mt-6 mb-3">Supported Units</h2>
            <p className="mb-3">
              <em>mm/s, cm/s, m/s, km/h, km/s, ft/s, in/s, mph, knot, c</em> — covering everyday to scientific speeds.
            </p>
          
            <h2 id="en-method" className="text-2xl font-semibold text-cyan-300 mt-6 mb-3">Method (m/s Base)</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li><strong>To base</strong>: <code>v_mps = v_from × factor(from→m/s)</code></li>
              <li><strong>To target</strong>: <code>v_to = v_mps ÷ factor(to→m/s)</code></li>
            </ol>
            <p className="text-sm text-slate-400">Example: 1 mph = 0.44704 m/s; therefore m/s → mph = ÷0.44704.</p>
          
            <h2 id="en-precision" className="text-2xl font-semibold text-cyan-300 mt-6 mb-3">Precision & Formats</h2>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Normal</strong> — trimmed trailing zeros for tidy tables.</li>
              <li><strong>Compact</strong> — 1.2K/3.4M style for badges/dashboards.</li>
              <li><strong>Scientific</strong> — best for extremes (km/s, c-fractions).</li>
            </ul>
          
            <h2 id="en-shortcuts" className="text-2xl font-semibold text-cyan-300 mt-6 mb-3">Keyboard Shortcuts</h2>
            <ul className="list-disc list-inside">
              <li><kbd>/</kbd> — focus Value</li>
              <li><kbd>S</kbd> — focus From, <kbd>T</kbd> — focus To</li>
              <li><kbd>X</kbd> — swap units</li>
            </ul>
          
            <h2 id="en-examples" className="text-2xl font-semibold text-cyan-300 mt-6 mb-3">Worked Examples (rounded)</h2>
            <ul className="space-y-2">
              <li><strong>10 m/s → km/h</strong>: 10 × 3.6 = <strong>36 km/h</strong>.</li>
              <li><strong>90 km/h → m/s</strong>: 90 ÷ 3.6 = <strong>25 m/s</strong>.</li>
              <li><strong>60 mph → km/h</strong>: 60 × 1.609344 = <strong>96.56064 km/h</strong>.</li>
              <li><strong>20 m/s → mph</strong>: 20 ÷ 0.44704 ≈ <strong>44.74 mph</strong>.</li>
              <li><strong>15 m/s → knots</strong>: 15 ÷ 0.514444… ≈ <strong>29.16 kn</strong>.</li>
              <li><strong>0.01 c → km/s</strong>: (0.01 × 299,792,458 m/s) ÷ 1000 ≈ <strong>2,997.92458 km/s</strong>.</li>
            </ul>
          
            <h2 id="en-usecases" className="text-2xl font-semibold text-cyan-300 mt-6 mb-3">Use Cases</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Automotive/Traffic</strong>: km/h ↔ mph for clusters, telematics, compliance.</li>
              <li><strong>Aviation/Marine</strong>: knots ↔ km/h/mph for navigation and flight ops.</li>
              <li><strong>Engineering/Research</strong>: m/s-centric calculations, simulation pipelines.</li>
              <li><strong>Ops Dashboards</strong>: Compact formatting for dense KPI tiles.</li>
            </ul>
          
            <h2 id="en-pitfalls" className="text-2xl font-semibold text-cyan-300 mt-6 mb-3">Common Pitfalls</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>For <strong>km/h ↔ m/s</strong>, always use 3.6 (not “about 4”).</li>
              <li>For <strong>mph ↔ km/h</strong>, use 1.609344 for accuracy-sensitive contexts.</li>
              <li><strong>Knots</strong> are not mph: 1 kn = 1.852 km/h.</li>
              <li>Round at the publishing step, not mid-calculation.</li>
            </ul>
          
            <h2 id="en-quick" className="text-2xl font-semibold text-cyan-300 mt-6 mb-3">Quick Reference</h2>
            <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <li>1 m/s = 3.6 km/h ≈ 2.23694 mph ≈ 1.94384 kn</li>
                <li>1 km/h = 0.2777777778 m/s</li>
                <li>1 mph = 1.609344 km/h = 0.44704 m/s</li>
                <li>1 kn = 1.852 km/h ≈ 0.514444 m/s</li>
                <li>c = 299,792,458 m/s (exact)</li>
              </ul>
            </div>
          
            <section id="en-faq" className="space-y-4 mt-10">
              <h2 className="text-3xl font-bold text-center text-cyan-300">❓ FAQ</h2>
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
                <h3 className="font-semibold text-yellow-300">1) Which units are supported?</h3>
                <p>mm/s, cm/s, m/s, km/h, km/s, ft/s, in/s, mph, knot, c.</p>
              </div>
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
                <h3 className="font-semibold text-yellow-300">2) How are conversions computed?</h3>
                <p>All values convert through m/s using exact factors, then to the target unit—transparent and easy to audit.</p>
              </div>
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
                <h3 className="font-semibold text-yellow-300">3) Any formatting advice?</h3>
                <p>Use Normal for print-ready tables, Compact for KPI tiles, and Scientific for extremes (km/s, c-fractions).</p>
              </div>
            </section>
          
            {/* Author / Backlink strip */}
            <section className="mt-14 border-t border-gray-700 pt-6">
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
                    Last updated: <time dateTime="2025-11-09">November 9, 2025</time>.
                  </p>
                </div>
              </div>
          
              <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
                <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
                  🚀 Explore more tools on CalculatorHub:
                </p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <Link
                    to="/area-converter"
                    className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
                  >
                    <span className="text-emerald-400">🧩</span> Area Converter
                  </Link>
                  <Link
                    to="/temperature-converter"
                    className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-400 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
                  >
                    <span className="text-sky-400">🌡️</span> Temperature Converter
                  </Link>
                  <Link
                    to="/length-converter"
                    className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
                  >
                    <span className="text-indigo-400">📏</span> Length Converter
                  </Link>
                </div>
              </div>
            </section>
          </section>



        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/speed-converter" category="unit-converters" />
      </div>
    </>
  );
}
