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
  Cube: (p) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96 12 12l8.73-5.04M12 22V12" />
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

/* ---------------- Units (factors are in cubic meters, m³) ---------------- */
const VOLUME_UNITS = [
  // Metric (exact)
  { key: 'mm3',   name: 'Cubic Millimeter (mm³)',        factor: 1e-9 },
  { key: 'cm3',   name: 'Cubic Centimeter (cm³)',        factor: 1e-6 },        // = 1 mL
  { key: 'mL',    name: 'Milliliter (mL)',               factor: 1e-6 },        // = 1 cm³
  { key: 'cL',    name: 'Centiliter (cL)',               factor: 1e-5 },
  { key: 'dL',    name: 'Deciliter (dL)',                factor: 1e-4 },
  { key: 'L',     name: 'Liter (L)',                     factor: 1e-3 },
  { key: 'm3',    name: 'Cubic Meter (m³)',              factor: 1 },

  // US customary (exact by definition)
  { key: 'in3',   name: 'Cubic Inch (in³)',              factor: 0.000016387064 },
  { key: 'ft3',   name: 'Cubic Foot (ft³)',              factor: 0.028316846592 },
  { key: 'yd3',   name: 'Cubic Yard (yd³)',              factor: 0.764554857984 },

  { key: 'flozUS',name: 'Fluid Ounce (US fl oz)',        factor: 2.95735295625e-5 },
  { key: 'cupUS', name: 'Cup (US)',                      factor: 0.0002365882365 },
  { key: 'ptUS',  name: 'Pint (US pt)',                  factor: 0.000473176473 },
  { key: 'qtUS',  name: 'Quart (US qt)',                 factor: 0.000946352946 },
  { key: 'galUS', name: 'Gallon (US gal)',               factor: 0.003785411784 },
  { key: 'tspUS', name: 'Teaspoon (US tsp)',             factor: 4.92892159375e-6 },
  { key: 'tbspUS',name: 'Tablespoon (US tbsp)',          factor: 1.478676478125e-5 },

  // Imperial (UK)
  { key: 'flozUK',name: 'Fluid Ounce (Imp fl oz)',       factor: 2.84130625e-5 },
  { key: 'ptUK',  name: 'Pint (Imp pt)',                 factor: 0.00056826125 },
  { key: 'qtUK',  name: 'Quart (Imp qt)',                factor: 0.0011365225 },
  { key: 'galUK', name: 'Gallon (Imp gal)',              factor: 0.00454609 },
];
const unitMap = Object.fromEntries(VOLUME_UNITS.map(u => [u.key, u]));
const FORMAT_MODES = ['normal', 'compact', 'scientific'];

/* ---------------- Safe storage helpers ---------------- */
function hasWindow() { return typeof window !== 'undefined'; }
function getStorage() {
  if (!hasWindow()) return null;
  try { const s = window.localStorage; const t='__chk__'; s.setItem(t,'1'); s.removeItem(t); return s; }
  catch { return null; }
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
export default function VolumeConverter() {
  const [valueStr, setValueStr] = useState('');
  const [fromUnit, setFromUnit] = useState('L');
  const [toUnit, setToUnit] = useState('galUS');
  const [formatMode, setFormatMode] = useState('normal');
  const [precision, setPrecision] = useState(6);
  const [favorites, setFavorites] = useLocalStorage('volume:favorites', ['mL','L','galUS','ptUS','cm3','ft3']);
  const [history, setHistory] = useLocalStorage('volume:history', []);

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
    const base = valueNum * ((unitMap[fromUnit] && unitMap[fromUnit].factor) || 1);
    const out = {};
    for (const u of VOLUME_UNITS) if (u.key !== fromUnit) out[u.key] = base / u.factor;
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
        a.href = url; a.download = 'volume-conversion.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
      }
    } catch {}
  }

  const favored = VOLUME_UNITS.filter(u => favorites.includes(u.key));
  const unfavored = VOLUME_UNITS.filter(u => !favorites.includes(u.key));
  const hasInput = (valueStr || '').trim() !== '';

  return (
    <>
      {/** ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Volume Converter — L ⇄ gal (US/UK), m³, mL, fl oz, cups & more (2025–2026)"
        description="Free Volume Converter with precision control, Normal/Compact/Scientific formats, favorites, history, CSV export, and shareable URLs. Convert liters, milliliters, cubic meters, US/Imperial gallons, cups, pints, quarts, fl oz, in³/ft³/yd³."
        keywords={[
          "volume converter",
          "liter to gallon",
          "gallon to liter",
          "us gallon to uk gallon",
          "ml to tsp",
          "tbsp to ml",
          "cups to ml",
          "pint to liter",
          "quart to liter",
          "m3 to ft3",
          "cm3 to ml",
          "in3 to cm3",
          "cubic yard to cubic meter",
          "fluid ounce to ml",
          "imperial vs us gallon"
        ]}
        canonical="https://calculatorhub.site/volume-converter"
        schemaData={[
          /* 1) WebPage + Article */
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://calculatorhub.site/volume-converter#webpage",
            "url": "https://calculatorhub.site/volume-converter",
            "name": "Volume Converter (2025–2026) — L ⇄ gal (US/UK), m³, mL, fl oz, cups",
            "inLanguage": "en",
            "isPartOf": { "@id": "https://calculatorhub.site/#website" },
            "primaryImageOfPage": {
              "@type": "ImageObject",
              "@id": "https://calculatorhub.site/images/volume-converter-hero.webp#primaryimg",
              "url": "https://calculatorhub.site/images/volume-converter-hero.webp",
              "width": 1200,
              "height": 675
            },
            "mainEntity": {
              "@type": "Article",
              "@id": "https://calculatorhub.site/volume-converter#article",
              "headline": "Volume Converter — Fast, Accurate, and Shareable",
              "description": "Convert between mm³, cm³ (mL), cL, dL, L, m³, in³, ft³, yd³, US fl oz/cup/pint/quart/gallon, Imperial fl oz/pint/quart/gallon. Includes precision & format controls, favorites, history, shortcuts, and CSV export.",
              "image": ["https://calculatorhub.site/images/volume-converter-hero.webp"],
              "author": { "@type": "Organization", "name": "CalculatorHub", "url": "https://calculatorhub.site" },
              "publisher": { "@id": "https://calculatorhub.site/#organization" },
              "datePublished": "2025-11-09",
              "dateModified": "2025-11-09",
              "mainEntityOfPage": { "@id": "https://calculatorhub.site/volume-converter#webpage" },
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
            "@id": "https://calculatorhub.site/volume-converter#breadcrumbs",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://calculatorhub.site/" },
              { "@type": "ListItem", "position": 2, "name": "Unit Converters", "item": "https://calculatorhub.site/category/unit-converters" },
              { "@type": "ListItem", "position": 3, "name": "Volume Converter", "item": "https://calculatorhub.site/volume-converter" }
            ]
          },
      
          /* 3) FAQ */
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://calculatorhub.site/volume-converter#faq",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Which volume units are supported?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Metric: mm³, cm³ (mL), cL, dL, L, m³. US customary: in³, ft³, yd³, teaspoons, tablespoons, fluid ounces, cups, pints, quarts, gallons. Imperial: fluid ounces, pints, quarts, gallons."
                }
              },
              {
                "@type": "Question",
                "name": "What’s the difference between US and Imperial gallons?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "They are not the same size: 1 US gallon = 3.785411784 L, while 1 Imperial (UK) gallon = 4.54609 L. Pick the correct system for your recipe or spec."
                }
              },
              {
                "@type": "Question",
                "name": "Is 1 mL equal to 1 cm³?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. 1 milliliter equals exactly 1 cubic centimeter."
                }
              },
              {
                "@type": "Question",
                "name": "Can I copy or export all results?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Copy the full grid or download a CSV. The tool also keeps options in the URL for easy sharing."
                }
              },
              {
                "@type": "Question",
                "name": "Does it save favorites and recent conversions?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Favorites and your last 10 conversions are stored locally in your browser."
                }
              }
            ]
          },
      
          /* 4) WebApplication */
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://calculatorhub.site/volume-converter#webapp",
            "name": "Volume Converter",
            "url": "https://calculatorhub.site/volume-converter",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web",
            "description": "Volume conversion with precision controls, Normal/Compact/Scientific formats, favorites, history, and CSV export.",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "image": ["https://calculatorhub.site/images/volume-converter-hero.webp"]
          },
      
          /* 5) SoftwareApplication */
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://calculatorhub.site/volume-converter#software",
            "name": "Advanced Volume Converter",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "All",
            "url": "https://calculatorhub.site/volume-converter",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "description": "Interactive volume unit converter with shareable links and CSV export."
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
      <link rel="canonical" href="https://calculatorhub.site/volume-converter" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/volume-converter" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/volume-converter" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/volume-converter" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Volume Converter (2025–2026) — L ⇄ gal (US/UK), m³, mL, fl oz, cups" />
      <meta property="og:description" content="Convert volume units with precision controls, Normal/Compact/Scientific formats, favorites, history, and CSV export." />
      <meta property="og:url" content="https://calculatorhub.site/volume-converter" />
      <meta property="og:image" content="https://calculatorhub.site/images/volume-converter-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Volume converter UI showing unit swapping and formatted results" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Volume Converter — L, m³, US/UK gal, cups, fl oz & more" />
      <meta name="twitter:description" content="Fast, accurate volume conversions with precision controls, favorites, history, and CSV export." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/volume-converter-hero.webp" />
      <meta name="twitter:creator" content="@CalculatorHub" />
      <meta name="twitter:site" content="@CalculatorHub" />
      
      {/** PWA & theme */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#6366f1" />
      
      {/** Performance */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="preload" as="image" href="/images/volume-converter-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />


      <div className="max-w-5xl mx-auto text-gray-200">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Volume Converter', url: '/volume-converter' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 rounded-2xl p-6 bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">Volume Converter (Advanced)</h1>
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
                  className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  aria-label="Enter volume value"
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
            {VOLUME_UNITS.map((unit) => {
              if (unit.key === fromUnit) return null;
              const val = gridResults[unit.key];
              const display = formatNumber(val ?? 0, formatMode, precision);
              return (
                <div key={unit.key} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:bg-gray-700/70 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon.Cube style={{ width: 16, height: 16, color: '#818cf8' }} />
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

        <AdBanner type="top" />
        {/* =========== SEO CONTENT SECTION: Volume Converter (EN only) ============ */}
      <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-indigo-300">Volume Converter — L ⇄ gal (US/UK), m³, mL, fl oz, cups & more</h1>
          <p className="mt-2">
            Convert precisely between <strong>metric</strong> (mm³, cm³/mL, cL, dL, L, m³), <strong>US customary</strong>
            (tsp, tbsp, fl oz, cup, pint, quart, gallon, in³/ft³/yd³), and <strong>Imperial (UK)</strong> measures
            (fl oz, pint, quart, gallon). Adjust decimals, choose Normal/Compact/Scientific formats, pin favorites,
            revisit recent conversions, export CSV, and share sharable stateful URLs.
          </p>
        </header>
      
        {/* TOC */}
        <nav className="mt-2 mb-10 bg-[#0f172a] border border-[#334155] rounded-xl p-5 text-slate-200">
          <h2 className="text-lg font-semibold text-indigo-300 mb-3">📖 Table of Contents</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li><a href="#vol-overview" className="text-indigo-400 hover:underline">Overview</a></li>
            <li><a href="#vol-how" className="text-indigo-400 hover:underline">How to Use</a></li>
            <li><a href="#vol-units" className="text-indigo-400 hover:underline">Supported Units</a></li>
            <li><a href="#vol-method" className="text-indigo-400 hover:underline">Method (m³ Base)</a></li>
            <li><a href="#vol-precision" className="text-indigo-400 hover:underline">Precision & Formats</a></li>
            <li><a href="#vol-examples" className="text-indigo-400 hover:underline">Worked Examples</a></li>
            <li><a href="#vol-pitfalls" className="text-indigo-400 hover:underline">Common Pitfalls</a></li>
            <li><a href="#vol-quick" className="text-indigo-400 hover:underline">Quick Reference</a></li>
            <li><a href="#vol-faq" className="text-indigo-400 hover:underline">FAQ</a></li>
          </ol>
        </nav>
      
        <h2 id="vol-overview" className="text-2xl font-semibold text-indigo-300 mt-6 mb-3">Overview</h2>
        <p>
          This converter uses <em>cubic meter (m³)</em> as the single source of truth. Every unit’s factor is defined
          precisely in terms of m³ (e.g., 1 L = 0.001 m³; 1 US gal = 0.003785411784 m³; 1 Imp gal = 0.00454609 m³).
          Conversions pass through m³, ensuring consistent, auditable results. URL state sync reproduces your exact
          inputs, units, precision, and formatting when shared.
        </p>
      
        <h2 id="vol-how" className="text-2xl font-semibold text-indigo-300 mt-6 mb-3">How to Use</h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Type a <strong>Value</strong> (blank counts as 0; commas allowed).</li>
          <li>Choose <strong>From</strong> and <strong>To</strong> units; use <strong>Swap</strong> when needed.</li>
          <li>Set <strong>Precision</strong> (0–12) and pick a <strong>Format</strong> (Normal/Compact/Scientific).</li>
          <li><strong>Copy All</strong> or export <strong>CSV</strong>; pin unit favorites and revisit <strong>Recent</strong>.</li>
        </ol>
      
        <h2 id="vol-units" className="text-2xl font-semibold text-indigo-300 mt-6 mb-3">Supported Units</h2>
        <p className="mb-3">
          <strong>Metric:</strong> mm³, cm³ (mL), cL, dL, L, m³. <br/>
          <strong>US customary:</strong> in³, ft³, yd³, tsp, tbsp, fl oz, cup, pint, quart, gallon. <br/>
          <strong>Imperial (UK):</strong> fl oz, pint, quart, gallon.
        </p>
      
        <h2 id="vol-method" className="text-2xl font-semibold text-indigo-300 mt-6 mb-3">Method (m³ Base)</h2>
        <ol className="list-decimal list-inside space-y-1">
          <li><strong>To base:</strong> <code>v_m3 = v_from × factor(from → m³)</code></li>
          <li><strong>To target:</strong> <code>v_to = v_m3 ÷ factor(to → m³)</code></li>
        </ol>
        <p className="text-sm text-slate-400">Example: 1 L → m³ = 1 × 0.001; m³ → US gal = ÷0.003785411784.</p>
      
        <h2 id="vol-precision" className="text-2xl font-semibold text-indigo-300 mt-6 mb-3">Precision & Formats</h2>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Normal</strong> — tidy, trims trailing zeros.</li>
          <li><strong>Compact</strong> — 1.2K/3.4M style for dense dashboards.</li>
          <li><strong>Scientific</strong> — best for very small/large volumes.</li>
        </ul>
      
        <h2 id="vol-examples" className="text-2xl font-semibold text-indigo-300 mt-6 mb-3">Worked Examples (rounded)</h2>
        <ul className="space-y-2">
          <li><strong>2 L → US gal</strong>: 2 ÷ 3.785411784 ≈ <strong>0.52834 gal (US)</strong>.</li>
          <li><strong>1 US gal → L</strong>: 1 × 3.785411784 = <strong>3.785411784 L</strong>.</li>
          <li><strong>1 Imp gal → L</strong>: 1 × 4.54609 = <strong>4.54609 L</strong>.</li>
          <li><strong>500 mL → cup (US)</strong>: 0.5 L ÷ 0.2365882365 ≈ <strong>2.11338 cups</strong>.</li>
          <li><strong>1 ft³ → L</strong>: 0.028316846592 m³ × 1000 = <strong>28.316846592 L</strong>.</li>
          <li><strong>250 mL → fl oz (US)</strong>: 0.25 L ÷ 0.0295735295625 ≈ <strong>8.4535 fl oz</strong>.</li>
          <li><strong>1 in³ → mL</strong>: 0.000016387064 m³ × 1e6 = <strong>16.387064 mL</strong>.</li>
        </ul>
      
        <h2 id="vol-pitfalls" className="text-2xl font-semibold text-indigo-300 mt-6 mb-3">Common Pitfalls</h2>
        <ul className="list-disc list-inside space-y-2">
          <li><strong>US vs Imperial gallons</strong> are not interchangeable (US: 3.785411784 L; UK: 4.54609 L).</li>
          <li><strong>mL = cm³</strong> exactly (1:1); don’t mix them with “approximate” factors.</li>
          <li><strong>Teaspoon/Tablespoon</strong> sizes differ by region; this tool uses <em>US definitions</em> for tsp/tbsp by default.</li>
          <li>Round at the final display stage, not during intermediate steps.</li>
        </ul>
      
        <h2 id="vol-quick" className="text-2xl font-semibold text-indigo-300 mt-6 mb-3">Quick Reference</h2>
        <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <li>1 L = 0.001 m³</li>
            <li>1 m³ = 1000 L</li>
            <li>1 US gal = 3.785411784 L</li>
            <li>1 Imp gal = 4.54609 L</li>
            <li>1 US cup = 0.2365882365 L</li>
            <li>1 US fl oz = 0.0295735295625 L</li>
            <li>1 in³ = 16.387064 mL</li>
            <li>1 ft³ = 28.316846592 L</li>
          </ul>
        </div>
      
        <section id="vol-faq" className="space-y-4 mt-10">
          <h2 className="text-3xl font-bold text-center text-indigo-300">❓ FAQ</h2>
      
          <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-amber-300">1) What’s the difference between US and Imperial (UK) gallons?</h3>
            <p>They’re different sizes. US gallon = 3.785411784 L; Imperial gallon = 4.54609 L. Choose the correct system for recipes/specs.</p>
          </div>
      
          <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-amber-300">2) Is 1 mL the same as 1 cm³?</h3>
            <p>Yes — they are exactly equal.</p>
          </div>
      
          <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-amber-300">3) Which spoon sizes are used here?</h3>
            <p>US definitions for teaspoon (tsp) and tablespoon (tbsp). Imperial values are provided for fl oz/pint/quart/gallon where applicable.</p>
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
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">🚀 Explore more tools on CalculatorHub:</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/speed-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-cyan-600/20 text-cyan-300 hover:text-cyan-400 px-3 py-2 rounded-md border border-slate-700 hover:border-cyan-500 transition-all duration-200"
              >
                <span className="text-cyan-400">🚗</span> Speed Converter
              </Link>
              <Link
                to="/area-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
              >
                <span className="text-emerald-400">🧩</span> Area Converter
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
        <RelatedCalculators currentPath="/volume-converter" category="unit-converters" />
      </div>
    </>
  );
}
