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
  Bolt: (p) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
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

/* ---------------- Units (factors are in Joules, J) ---------------- */
const ENERGY_UNITS = [
  // SI / metric
  { key: 'J',    name: 'Joule (J)',                 factor: 1 },
  { key: 'kJ',   name: 'Kilojoule (kJ)',            factor: 1e3 },
  { key: 'MJ',   name: 'Megajoule (MJ)',            factor: 1e6 },
  { key: 'GJ',   name: 'Gigajoule (GJ)',            factor: 1e9 },

  // Electrical energy
  { key: 'Wh',   name: 'Watt-hour (Wh)',            factor: 3600 },            // 1 Wh = 3600 J
  { key: 'kWh',  name: 'Kilowatt-hour (kWh)',       factor: 3.6e6 },
  { key: 'MWh',  name: 'Megawatt-hour (MWh)',       factor: 3.6e9 },
  { key: 'GWh',  name: 'Gigawatt-hour (GWh)',       factor: 3.6e12 },

  // Particle / atomic
  { key: 'eV',   name: 'Electronvolt (eV)',         factor: 1.602176634e-19 }, // exact by definition
  { key: 'keV',  name: 'Kiloelectronvolt (keV)',    factor: 1.602176634e-16 },
  { key: 'MeV',  name: 'Megaelectronvolt (MeV)',    factor: 1.602176634e-13 },
  { key: 'GeV',  name: 'Gigaelectronvolt (GeV)',    factor: 1.602176634e-10 },

  // Thermal / food
  { key: 'cal',  name: 'Calorie (cal, thermochemical)', factor: 4.184 },      // 1 cal_th = 4.184 J
  { key: 'kcal', name: 'Kilocalorie (kcal)',         factor: 4184 },          // food Calorie

  // Imperial / US customary
  { key: 'BTU',  name: 'British thermal unit (BTU, IT)', factor: 1055.05585262 },
  { key: 'ftlb', name: 'Foot-pound (ft·lb)',        factor: 1.3558179483314004 },

  // Others
  { key: 'thermUS', name: 'Therm (US)',             factor: 105480400 },       // 1.054804e8 J
  { key: 'thermUK', name: 'Therm (UK)',             factor: 105505585.257348 },// ≈ different def.
  { key: 'TNT',  name: 'Ton of TNT (t TNT)',        factor: 4.184e9 },         // by convention
];
const unitMap = Object.fromEntries(ENERGY_UNITS.map(u => [u.key, u]));
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
export default function EnergyConverter() {
  const [valueStr, setValueStr] = useState('');
  const [fromUnit, setFromUnit] = useState('kWh');
  const [toUnit, setToUnit] = useState('MJ');
  const [formatMode, setFormatMode] = useState<typeof FORMAT_MODES[number]>('normal');
  const [precision, setPrecision] = useState(6);
  const [favorites, setFavorites] = useLocalStorage<string[]>('energy:favorites', ['J','kJ','kWh','MJ','cal','kcal','BTU']);
  const [history, setHistory] = useLocalStorage<any[]>('energy:history', []);

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
    const out: Record<string, number> = {};
    for (const u of ENERGY_UNITS) if (u.key !== fromUnit) out[u.key] = base / u.factor;
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
      if (fmt && (FORMAT_MODES as readonly string[]).includes(fmt)) setFormatMode(fmt as any);
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
        a.href = url; a.download = 'energy-conversion.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
      }
    } catch {}
  }

  const favored = ENERGY_UNITS.filter(u => favorites.includes(u.key));
  const unfavored = ENERGY_UNITS.filter(u => !favorites.includes(u.key));
  const hasInput = (valueStr || '').trim() !== '';

  return (
    <>
      {/** ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Energy Converter — J ⇄ kJ, MJ, kWh, eV, cal, BTU, Therms, TNT (2025–2026)"
        description="Free Energy Converter with precision control, Normal/Compact/Scientific formats, favorites, history, CSV export, and shareable URLs. Convert J, kJ, MJ, GJ, Wh, kWh, MWh, eV, keV, MeV, GeV, cal, kcal, BTU, ft·lb, therm (US/UK), and ton of TNT."
        keywords={[
          "energy converter",
          "kWh to MJ",
          "J to kWh",
          "eV to J",
          "cal to J",
          "kcal to kJ",
          "BTU to kJ",
          "Wh to J",
          "MWh to GJ",
          "therm to kWh",
          "ft lb to J",
          "TNT to J",
          "convert energy units"
        ]}
        canonical="https://calculatorhub.site/energy-converter"
        schemaData={[
          /* 1) WebPage + Article */
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://calculatorhub.site/energy-converter#webpage",
            "url": "https://calculatorhub.site/energy-converter",
            "name": "Energy Converter (2025–2026) — J ⇄ kJ, MJ, kWh, eV, cal, BTU",
            "inLanguage": "en",
            "isPartOf": { "@id": "https://calculatorhub.site/#website" },
            "primaryImageOfPage": {
              "@type": "ImageObject",
              "@id": "https://calculatorhub.site/images/energy-converter-hero.webp#primaryimg",
              "url": "https://calculatorhub.site/images/energy-converter-hero.webp",
              "width": 1200,
              "height": 675
            },
            "mainEntity": {
              "@type": "Article",
              "@id": "https://calculatorhub.site/energy-converter#article",
              "headline": "Energy Converter — Fast, Accurate, and Shareable",
              "description": "Convert between Joules, watt-hours, electronvolts, calories, BTU, therms, ft·lb, and TNT with precision & format controls, favorites, history, keyboard shortcuts, and CSV export.",
              "image": ["https://calculatorhub.site/images/energy-converter-hero.webp"],
              "author": { "@type": "Organization", "name": "CalculatorHub", "url": "https://calculatorhub.site" },
              "publisher": { "@id": "https://calculatorhub.site/#organization" },
              "datePublished": "2025-11-09",
              "dateModified": "2025-11-09",
              "mainEntityOfPage": { "@id": "https://calculatorhub.site/energy-converter#webpage" },
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
            "@id": "https://calculatorhub.site/energy-converter#breadcrumbs",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://calculatorhub.site/" },
              { "@type": "ListItem", "position": 2, "name": "Unit Converters", "item": "https://calculatorhub.site/category/unit-converters" },
              { "@type": "ListItem", "position": 3, "name": "Energy Converter", "item": "https://calculatorhub.site/energy-converter" }
            ]
          },
      
          /* 3) FAQ */
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://calculatorhub.site/energy-converter#faq",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Which energy units are supported?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "J, kJ, MJ, GJ, Wh, kWh, MWh, GWh, eV, keV, MeV, GeV, cal, kcal, BTU (IT), ft·lb, therm (US/UK), and ton of TNT."
                }
              },
              {
                "@type": "Question",
                "name": "Is 1 kWh equal to 3.6 MJ?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. 1 kilowatt-hour equals exactly 3.6 megajoules (1 kWh = 3.6×10^6 J)."
                }
              },
              {
                "@type": "Question",
                "name": "Which calorie definition is used?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Thermochemical calorie: 1 cal = 4.184 J. Food Calories on labels are kilocalories (kcal)."
                }
              },
              {
                "@type": "Question",
                "name": "Can I export all results?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. You can copy the grid or download a CSV file. Your settings persist in the URL for sharing."
                }
              },
              {
                "@type": "Question",
                "name": "Does it save my favorites and history?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Favorites and the most recent 10 conversions are saved locally in your browser."
                }
              }
            ]
          },
      
          /* 4) WebApplication */
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://calculatorhub.site/energy-converter#webapp",
            "name": "Energy Converter",
            "url": "https://calculatorhub.site/energy-converter",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web",
            "description": "Energy conversion with precision controls, Normal/Compact/Scientific formats, favorites, history, and CSV export.",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "image": ["https://calculatorhub.site/images/energy-converter-hero.webp"]
          },
      
          /* 5) SoftwareApplication */
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://calculatorhub.site/energy-converter#software",
            "name": "Advanced Energy Converter",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "All",
            "url": "https://calculatorhub.site/energy-converter",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "description": "Interactive energy unit converter with shareable links and CSV export."
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
      <link rel="canonical" href="https://calculatorhub.site/energy-converter" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/energy-converter" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/energy-converter" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/energy-converter" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Energy Converter (2025–2026) — J, kJ, MJ, kWh, eV, cal, BTU" />
      <meta property="og:description" content="Convert energy units with precision controls, Normal/Compact/Scientific formats, favorites, history, and CSV export." />
      <meta property="og:url" content="https://calculatorhub.site/energy-converter" />
      <meta property="og:image" content="https://calculatorhub.site/images/energy-converter-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Energy converter UI with unit swap and formatted results" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Energy Converter — J, kJ, MJ, kWh, eV, cal, BTU & more" />
      <meta name="twitter:description" content="Fast, accurate energy conversions. Precision controls, favorites, history, CSV export." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/energy-converter-hero.webp" />
      <meta name="twitter:creator" content="@CalculatorHub" />
      <meta name="twitter:site" content="@CalculatorHub" />
      
      {/** PWA & theme */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#0b0f19" />
      
      {/** Performance */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="preload" as="image" href="/images/energy-converter-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />


      <div className="max-w-5xl mx-auto text-gray-200">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Energy Converter', url: '/energy-converter' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 rounded-2xl p-6 bg-gradient-to-r from-amber-900 via-orange-900 to-rose-900 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">Energy Converter (Advanced)</h1>
          <p className="text-gray-200">
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
                  className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  aria-label="Enter energy value"
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
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
              className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white border border-amber-500 flex items-center gap-2"
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
                <input type="range" min={0} max={12} value={precision} onChange={(e) => setPrecision(+e.target.value)} className="w-full accent-amber-500" />
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
            {ENERGY_UNITS.map((unit) => {
              if (unit.key === fromUnit) return null;
              const val = gridResults[unit.key];
              const display = formatNumber(val ?? 0, formatMode, precision);
              return (
                <div key={unit.key} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:bg-gray-700/70 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon.Bolt style={{ width: 16, height: 16, color: '#f59e0b' }} />
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
              <li><a href="#overview" className="text-amber-300 hover:underline">Overview: What this Energy Converter does</a></li>
              <li><a href="#how-to-use" className="text-amber-300 hover:underline">How to Use</a></li>
              <li><a href="#units" className="text-amber-300 hover:underline">Supported Units (SI, Electrical, Thermal, Particle, Imperial)</a></li>
              <li><a href="#method" className="text-amber-300 hover:underline">Accurate Conversion Method (Joule-based)</a></li>
              <li><a href="#precision-format" className="text-amber-300 hover:underline">Precision & Number Formats</a></li>
              <li><a href="#keyboard" className="text-amber-300 hover:underline">Keyboard Shortcuts & Workflow</a></li>
              <li><a href="#examples" className="text-amber-300 hover:underline">Worked Examples</a></li>
              <li><a href="#use-cases" className="text-amber-300 hover:underline">Use Cases</a></li>
              <li><a href="#accuracy" className="text-amber-300 hover:underline">Accuracy, Rounding & Best Practices</a></li>
              <li><a href="#pitfalls" className="text-amber-300 hover:underline">Common Pitfalls to Avoid</a></li>
              <li><a href="#quick-ref" className="text-amber-300 hover:underline">Quick Reference</a></li>
              <li><a href="#glossary" className="text-amber-300 hover:underline">Glossary</a></li>
              <li><a href="#faq" className="text-amber-300 hover:underline">FAQ</a></li>
            </ol>
          </nav>
        
          {/* ===== Overview ===== */}
          <h1 id="overview" className="text-3xl font-bold text-amber-300 mb-6">
            Energy Converter — J, kJ, MJ, GJ, Wh/kWh, eV, cal/kcal, BTU, therms, ft·lb, TNT — fast & accurate
          </h1>
        
          <p>
            Power bills, battery packs, gas heaters, lab measurements, turbines, even particle physics—everything reports
            <em> energy</em> in different units. The <strong>CalculatorHub Energy Converter</strong> gives instant, accurate
            results between the most common systems with <strong>precision control</strong>, three <strong>display formats</strong>
            (Normal/Compact/Scientific), <strong>Favorites</strong>, <strong>History</strong>, <strong>Copy/CSV export</strong>,
            and <strong>shareable URLs</strong>.
          </p>
        
          <p>
            Internally, every conversion is anchored to the SI base unit <strong>Joule (J)</strong>. By normalizing through Joules,
            you get stable, traceable results across electric energy (Wh/kWh), thermal (cal/kcal/BTU/therm), mechanical (ft·lb),
            explosive equivalence (TNT), and atomic scales (eV/keV/MeV/GeV).
          </p>
        
          <figure className="my-8">
            <img
              src="/images/energy-converter-hero.webp"
              alt="Energy Converter UI with unit swapping, precision and format controls"
              title="Energy Converter — J ⇄ kJ ⇄ MJ ⇄ kWh ⇄ eV ⇄ cal/kcal ⇄ BTU ⇄ therm ⇄ ft·lb ⇄ TNT"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              One-click energy conversion with precise control, Favorites/History, Copy & CSV export, and shareable URLs.
            </figcaption>
          </figure>
        
          {/* ===== How to Use ===== */}
          <h2 id="how-to-use" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">💡 How to Use</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter a number in the <strong>Value</strong> field (empty counts as 0; commas like <code>1,234.56</code> are OK).</li>
            <li>Select your <strong>From</strong> and <strong>To</strong> units from the dropdowns (pin favorites for speed).</li>
            <li>Open <strong>More options</strong> to set <strong>Precision</strong> (0–12) and choose <strong>Format</strong> (Normal/Compact/Scientific).</li>
            <li>Use <strong>Copy All</strong> for the full grid, or <strong>CSV</strong> to export everything to a spreadsheet.</li>
            <li>Revisit past values via the <strong>Recent</strong> list (last 10 conversions stored locally).</li>
          </ol>
          <p className="text-sm text-slate-400">
            Your current state (value/units/format/precision) is preserved in the page URL—bookmark or share to reproduce the view.
          </p>
        
          {/* ===== Units ===== */}
          <h2 id="units" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">
            🌍 Supported Units (SI, Electrical, Thermal, Particle, Imperial)
          </h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li><strong>SI/Metric</strong>: J, kJ, MJ, GJ.</li>
              <li><strong>Electrical</strong>: Wh, kWh, MWh, GWh (1 Wh = 3600 J).</li>
              <li><strong>Particle/Atomic</strong>: eV, keV, MeV, GeV (1 eV = 1.602176634×10⁻¹⁹ J, exact).</li>
              <li><strong>Thermal/Food</strong>: cal (th) and kcal (1 cal = 4.184 J; “Calories” on food labels = kcal).</li>
              <li><strong>Imperial/US</strong>: BTU (IT), ft·lb.</li>
              <li><strong>Gas/Market</strong>: therm (US/UK) — note the slight definition differences.</li>
              <li><strong>Explosive equivalence</strong>: ton of TNT (by convention 1 t TNT = 4.184×10⁹ J).</li>
            </ul>
          </div>
        
          {/* ===== Method ===== */}
          <h2 id="method" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">📐 Accurate Conversion Method (Joule-based)</h2>
          <p>
            Conversions use a two-step path via <strong>Joules</strong>:
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li><strong>Normalize to J</strong>: <code>value_J = value × factor(from→J)</code></li>
            <li><strong>Convert to target</strong>: <code>value_target = value_J ÷ factor(to→J)</code></li>
          </ol>
          <p>
            This prevents compounding errors and keeps results consistent across any pair of units.
          </p>
        
          {/* ===== Precision & Formats ===== */}
          <h2 id="precision-format" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">🎯 Precision & Number Formats</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Precision</strong>: For invoices/dashboards use 0–2; technical docs 3–6; research 6–12.</li>
            <li><strong>Normal</strong>: Clean decimals (trims trailing zeros).</li>
            <li><strong>Compact</strong>: Human-friendly large/small values (e.g., 1.2K, 3.4M).</li>
            <li><strong>Scientific</strong>: Ideal for extremes (e.g., eV or GWh) and scientific reporting.</li>
          </ul>
          <p className="text-sm text-slate-400">
            When magnitudes are extreme, Normal may auto-switch to scientific for readability.
          </p>
        
          {/* ===== Keyboard Shortcuts ===== */}
          <h2 id="keyboard" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">⌨️ Keyboard Shortcuts & Workflow</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><kbd>/</kbd> — focus the <strong>Value</strong> input.</li>
            <li><kbd>S</kbd> — focus <strong>From</strong>, <kbd>T</kbd> — focus <strong>To</strong>.</li>
            <li><kbd>X</kbd> — <strong>Swap</strong> From/To units.</li>
          </ul>
          <p>Pin frequent units in <strong>Favorites</strong> for one-click access.</p>
        
          {/* ===== Worked Examples ===== */}
          <h2 id="examples" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">📈 Worked Examples (rounded for readability)</h2>
          <ul className="space-y-2">
            <li><strong>1 kWh → MJ</strong>: 1 kWh = 3.6×10⁶ J = <strong>3.6 MJ</strong>.</li>
            <li><strong>2500 J → cal</strong>: 2500 ÷ 4.184 ≈ <strong>597.6 cal</strong> (≈ 0.598 kcal food Calories).</li>
            <li><strong>500 kcal → kJ</strong>: 500 × 4.184 = <strong>2092 kJ</strong>.</li>
            <li><strong>10 MJ → kWh</strong>: (10×10⁶ J) ÷ 3.6×10⁶ ≈ <strong>2.777… kWh</strong>.</li>
            <li><strong>1 BTU → J</strong>: ≈ <strong>1055.056 J</strong>; <strong>1000 BTU → kWh</strong>: 1000×1055.056 ÷ 3.6×10⁶ ≈ <strong>0.293 kWh</strong>.</li>
            <li><strong>1 eV → J</strong>: 1.602176634×10⁻¹⁹ J (exact); <strong>5 GeV → J</strong>: 5×1.602176634×10⁻¹⁰ ≈ <strong>8.01×10⁻¹⁰ J</strong>.</li>
            <li><strong>1 therm (US) → kWh</strong>: 1.054804×10⁸ J ÷ 3.6×10⁶ ≈ <strong>29.30 kWh</strong>.</li>
            <li><strong>1 ft·lb → J</strong>: ≈ <strong>1.355818 J</strong>; <strong>1000 ft·lb → kJ</strong>: 1000×1.355818 ÷ 1000 ≈ <strong>1.356 kJ</strong>.</li>
            <li><strong>1 ton TNT → MJ</strong>: 4.184×10⁹ J ÷ 10⁶ = <strong>4184 MJ</strong>.</li>
          </ul>
        
          {/* ===== Use Cases ===== */}
          <h2 id="use-cases" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">🧰 Real-World Use Cases</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Utilities & Solar</strong>: Convert kWh ↔ MJ/GJ for billing, PV yields, and storage sizing.</li>
            <li><strong>HVAC & Boilers</strong>: BTU/therm ↔ kWh for fuel cost comparisons and seasonal efficiency.</li>
            <li><strong>Nutrition & Fitness</strong>: kcal ↔ kJ for food labels and meal-planning apps.</li>
            <li><strong>Mechanical Systems</strong>: ft·lb ↔ J for flywheels, lifts, and small-scale mechanisms.</li>
            <li><strong>Research & Labs</strong>: eV/keV/MeV ↔ J for spectroscopy, detectors, and particle interactions.</li>
            <li><strong>Risk & Safety</strong>: TNT equivalent ↔ J/MJ for blast energy approximations.</li>
          </ul>
        
          {/* ===== Accuracy & Best Practices ===== */}
          <h2 id="accuracy" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">✅ Accuracy, Rounding & Best Practices</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Convert via <strong>Joules</strong> for consistent results across disparate unit systems.</li>
            <li>Keep internal precision high; apply display rounding last for clean reports.</li>
            <li>Choose <strong>Scientific</strong> notation for very large/small values (e.g., GeV or GWh).</li>
            <li>Clarify definitions (e.g., <strong>kcal</strong> vs <strong>Calorie</strong> on labels, therm US vs UK).</li>
          </ul>

          <AdBanner type="bottom" />
        
          {/* ===== Common Pitfalls ===== */}
          <h2 id="pitfalls" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">⚠️ Common Pitfalls to Avoid</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Calorie confusion</strong>: Food “Calories” are actually <strong>kcal</strong> (1 Cal = 1 kcal = 4184 J).</li>
            <li><strong>Therm (US vs UK)</strong>: Slightly different Joule values—use the correct locale for billing.</li>
            <li><strong>Wh vs W</strong>: Watt-hour is energy; Watt is power. Don’t mix energy with power/rate.</li>
            <li><strong>BTU varieties</strong>: This tool uses BTU (IT). Other historical definitions differ slightly.</li>
            <li><strong>TNT equivalence</strong>: A convenient convention (4.184 GJ per ton), not a universal physical constant.</li>
          </ul>
        
          {/* ===== Quick Reference ===== */}
          <h2 id="quick-ref" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">🗂️ Quick Reference</h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li>1 kWh = <strong>3.6 MJ</strong> = 3600 kJ = 3.6×10⁶ J</li>
              <li>1 MJ = <strong>0.27778 kWh</strong> ≈ 239.006 kcal</li>
              <li>1 kcal = <strong>4184 J</strong> = 4.184 kJ</li>
              <li>1 BTU (IT) ≈ <strong>1055.056 J</strong> ≈ 0.000293 kWh</li>
              <li>1 therm (US) ≈ <strong>1.054804×10⁸ J</strong> ≈ 29.30 kWh</li>
              <li>1 ft·lb ≈ <strong>1.355818 J</strong></li>
              <li>1 eV = <strong>1.602176634×10⁻¹⁹ J</strong> (exact)</li>
              <li>1 ton TNT = <strong>4.184×10⁹ J</strong> = 4184 MJ</li>
            </ul>
          </div>
        
          {/* ===== Glossary ===== */}
          <h2 id="glossary" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">📚 Glossary</h2>
          <p className="space-y-2">
            <strong>Joule (J)</strong>: SI base unit for energy. <br/>
            <strong>Wh/kWh</strong>: Electrical energy; 1 Wh = 3600 J. <br/>
            <strong>cal/kcal</strong>: Thermochemical definitions; 1 kcal (food Calorie) = 4184 J. <br/>
            <strong>BTU</strong>: British thermal unit (IT). <br/>
            <strong>therm</strong>: Large gas energy unit (US/UK variants). <br/>
            <strong>ft·lb</strong>: Mechanical work unit in Imperial system. <br/>
            <strong>eV</strong>: Particle energy unit; exactly defined via the elementary charge. <br/>
            <strong>TNT (ton)</strong>: Conventional explosive energy equivalence (not fundamental).
          </p>
        
          {/* ===== FAQ ===== */}
          <section className="space-y-6 mt-16">
            <h2 id="faq" className="text-3xl md:text-4xl font-bold mb-4 text-center text-amber-200">
              ❓ Frequently Asked Questions (FAQ)
            </h2>
        
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q1: Which energy units are supported?</h3>
                <p>J, kJ, MJ, GJ, Wh, kWh, MWh, GWh, eV, keV, MeV, GeV, cal, kcal, BTU (IT), ft·lb, therm (US/UK), and ton of TNT.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q2: Is 1 kWh equal to 3.6 MJ?</h3>
                <p>Yes—exactly. 1 kWh = 3.6×10⁶ J = 3.6 MJ.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q3: Which calorie definition is used?</h3>
                <p>Thermochemical calorie: 1 cal = 4.184 J. Food labels report Calories as kcal (1 Cal = 1 kcal).</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q4: What’s the difference between therm (US) and therm (UK)?</h3>
                <p>They are defined slightly differently. This converter exposes both to match utility/gas billing sources.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q5: Can I copy/export the whole grid?</h3>
                <p>Yes—use <strong>Copy All</strong> for clipboard and <strong>CSV</strong> for spreadsheets. URL state is shareable.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q6: Are Favorites and Recent stored?</h3>
                <p>Yes, locally in your browser (Recent keeps the last 10 conversions on your device).</p>
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
                to="/pressure-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-amber-600/20 text-amber-300 hover:text-amber-200 px-3 py-2 rounded-md border border-slate-700 hover:border-amber-500 transition-all duration-200"
              >
                <span className="text-amber-300">🟧</span> Pressure Converter
              </Link>
              <Link
                to="/area-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-200 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
              >
                <span className="text-emerald-300">🟩</span> Area Converter
              </Link>
              <Link
                to="/temperature-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-200 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
              >
                <span className="text-sky-300">🌡️</span> Temperature Converter
              </Link>
            </div>
          </div>
        </section>


        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/energy-converter" category="unit-converters" />
      </div>
    </>
  );
}
