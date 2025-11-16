import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from "react-router-dom";
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

/* ---------------- Icons (inline, no deps) ---------------- */
const Icon = {
  Cube: (p: any) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 8l-9-5-9 5 9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
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

/* ---------------- Units (factors are in kg/m³) ----------------
   Notes:
   - 1 g/cm³ = 1000 kg/m³
   - 1 g/L   = 1 kg/m³
   - 1 mg/mL = 1 kg/m³
   - 1 lb/ft³ ≈ 16.01846337 kg/m³
   - 1 lb/in³ ≈ 27679.90471 kg/m³
   - 1 oz/in³ ≈ 1729.99404 kg/m³
   - 1 slug/ft³ ≈ 515.378818 kg/m³
   - 1 lb/US gal ≈ 119.8264273 kg/m³
   - 1 lb/Imp gal ≈ 99.77637266 kg/m³
-----------------------------------------------------------------*/
const DENSITY_UNITS = [
  // SI / metric
  { key: 'kg/m3',  name: 'Kilogram per cubic meter (kg/m³)', factor: 1 },
  { key: 'g/cm3',  name: 'Gram per cubic centimeter (g/cm³)', factor: 1000 },
  { key: 'g/m3',   name: 'Gram per cubic meter (g/m³)',       factor: 1e-3 },
  { key: 'g/L',    name: 'Gram per liter (g/L)',              factor: 1 },
  { key: 'kg/L',   name: 'Kilogram per liter (kg/L)',         factor: 1000 },
  { key: 'g/mL',   name: 'Gram per milliliter (g/mL)',        factor: 1000 },
  { key: 'mg/mL',  name: 'Milligram per milliliter (mg/mL)',  factor: 1 },
  { key: 'mg/cm3', name: 'Milligram per cubic centimeter (mg/cm³)', factor: 1 },

  // US/Imperial
  { key: 'lb/ft3',   name: 'Pound per cubic foot (lb/ft³)',   factor: 16.01846337 },
  { key: 'lb/in3',   name: 'Pound per cubic inch (lb/in³)',   factor: 27679.90471 },
  { key: 'oz/in3',   name: 'Ounce per cubic inch (oz/in³)',   factor: 1729.99404 },
  { key: 'slug/ft3', name: 'Slug per cubic foot (slug/ft³)',  factor: 515.378818 },
  { key: 'lb/galUS', name: 'Pound per US gallon (lb/gal US)', factor: 119.8264273 },
  { key: 'lb/galImp',name: 'Pound per Imp gallon (lb/gal Imp)', factor: 99.77637266 },
];

const unitMap: Record<string, {key:string; name:string; factor:number}> =
  Object.fromEntries(DENSITY_UNITS.map(u => [u.key, u]));
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
  // value[from]*factor[from] = kg/m³;  /factor[to] = value[to]
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
export default function DensityConverter() {
  const [valueStr, setValueStr] = useState('');
  const [fromUnit, setFromUnit] = useState('g/cm3'); // common start
  const [toUnit, setToUnit] = useState('kg/m3');
  const [formatMode, setFormatMode] = useState<typeof FORMAT_MODES[number]>('normal');
  const [precision, setPrecision] = useState(6);
  const [favorites, setFavorites] = useLocalStorage<string[]>('density:favorites', ['kg/m3','g/cm3','g/mL','lb/ft3','lb/galUS']);
  const [history, setHistory] = useLocalStorage<any[]>('density:history', []);

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
    for (const u of DENSITY_UNITS) if (u.key !== fromUnit) out[u.key] = base / u.factor;
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
  function toggleFavorite(k: string) {
    setFavorites(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k].slice(0, 8));
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
        a.href = url; a.download = 'density-conversion.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
      }
    } catch {}
  }

  const favored = DENSITY_UNITS.filter(u => favorites.includes(u.key));
  const unfavored = DENSITY_UNITS.filter(u => !favorites.includes(u.key));
  const hasInput = (valueStr || '').trim() !== '';

  return (
    <>
      {/** ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Density Converter — kg/m³ ⇄ g/cm³ ⇄ g/mL ⇄ kg/L ⇄ lb/ft³ ⇄ lb/in³ ⇄ oz/in³ ⇄ slug/ft³ ⇄ lb/gal"
        description="Convert density units instantly: kg/m³, g/cm³, g/mL, kg/L, lb/ft³, lb/in³, oz/in³, slug/ft³, and lb/gal (US & Imperial). Includes precision control, Normal/Compact/Scientific formats, favorites, history, CSV export, and shareable URLs."
        keywords={[
          "density converter",
          "g/cm3 to kg/m3",
          "kg/m3 to g/cm3",
          "g/mL to kg/m3",
          "kg/L to g/cm3",
          "lb/ft3 to kg/m3",
          "lb/in3 to kg/m3",
          "oz/in3 to kg/m3",
          "slug/ft3 to kg/m3",
          "lb/gal to kg/m3",
          "us gallon to kg/m3",
          "imperial gallon to kg/m3",
          "density unit conversion"
        ]}
        canonical="https://calculatorhub.site/density-converter"
        schemaData={[
          /* 1) WebPage + Article */
          {
            "@context":"https://schema.org",
            "@type":"WebPage",
            "@id":"https://calculatorhub.site/density-converter#webpage",
            "url":"https://calculatorhub.site/density-converter",
            "name":"Density Converter — kg/m³, g/cm³, g/mL, kg/L, lb/ft³, lb/in³, oz/in³, slug/ft³, lb/gal",
            "inLanguage":"en",
            "isPartOf":{"@id":"https://calculatorhub.site/#website"},
            "primaryImageOfPage":{
              "@type":"ImageObject",
              "@id":"https://calculatorhub.site/images/density-converter-hero.webp#primaryimg",
              "url":"https://calculatorhub.site/images/density-converter-hero.webp",
              "width":1200,"height":675
            },
            "mainEntity":{
              "@type":"Article",
              "@id":"https://calculatorhub.site/density-converter#article",
              "headline":"Density Converter — Engineering & Scientific Units",
              "description":"Convert between kg/m³, g/cm³, g/mL, kg/L, lb/ft³, lb/in³, oz/in³, slug/ft³, and lb/gal (US/Imp). Features precision/format controls, keyboard shortcuts, favorites, history, copy/CSV export, and shareable links.",
              "image":["https://calculatorhub.site/images/density-converter-hero.webp"],
              "author":{"@type":"Organization","name":"CalculatorHub","url":"https://calculatorhub.site"},
              "publisher":{"@id":"https://calculatorhub.site/#organization"},
              "datePublished":"2025-11-09",
              "dateModified":"2025-11-09",
              "mainEntityOfPage":{"@id":"https://calculatorhub.site/density-converter#webpage"},
              "articleSection":[
                "Supported Units",
                "Metric vs US/Imperial",
                "Precision & Number Formats",
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
            "@id":"https://calculatorhub.site/density-converter#breadcrumbs",
            "itemListElement":[
              {"@type":"ListItem","position":1,"name":"Home","item":"https://calculatorhub.site/"},
              {"@type":"ListItem","position":2,"name":"Unit Converters","item":"https://calculatorhub.site/category/unit-converters"},
              {"@type":"ListItem","position":3,"name":"Density Converter","item":"https://calculatorhub.site/density-converter"}
            ]
          },
      
          /* 3) FAQ */
          {
            "@context":"https://schema.org",
            "@type":"FAQPage",
            "@id":"https://calculatorhub.site/density-converter#faq",
            "mainEntity":[
              {
                "@type":"Question",
                "name":"How do you convert g/cm³ to kg/m³?",
                "acceptedAnswer":{"@type":"Answer","text":"Multiply by 1000. For example, 1 g/cm³ = 1000 kg/m³ (water at ~4°C is ≈1 g/cm³)."}
              },
              {
                "@type":"Question",
                "name":"What is lb/ft³ in kg/m³?",
                "acceptedAnswer":{"@type":"Answer","text":"Use 1 lb/ft³ ≈ 16.01846337 kg/m³. Multiply the lb/ft³ value by 16.01846337 to get kg/m³."}
              },
              {
                "@type":"Question",
                "name":"How do US and Imperial gallon densities differ?",
                "acceptedAnswer":{"@type":"Answer","text":"1 lb/US gal ≈ 119.8264273 kg/m³, while 1 lb/Imp gal ≈ 99.77637266 kg/m³ due to the different gallon volumes."}
              },
              {
                "@type":"Question",
                "name":"Are g/L and kg/m³ the same?",
                "acceptedAnswer":{"@type":"Answer","text":"Numerically yes: 1 g/L = 1 kg/m³. Likewise, 1 mg/mL = 1 kg/m³."}
              },
              {
                "@type":"Question",
                "name":"What are typical reference values?",
                "acceptedAnswer":{"@type":"Answer","text":"Fresh water at ~4°C is ≈ 1000 kg/m³; air at sea level is ≈ 1.2 kg/m³ (varies with T/P)."}
              }
            ]
          },
      
          /* 4) WebApplication */
          {
            "@context":"https://schema.org",
            "@type":"WebApplication",
            "@id":"https://calculatorhub.site/density-converter#webapp",
            "name":"Density Converter",
            "url":"https://calculatorhub.site/density-converter",
            "applicationCategory":"UtilitiesApplication",
            "operatingSystem":"Web",
            "description":"Instant conversion among metric and US/Imperial density units with shareable links and CSV.",
            "publisher":{"@id":"https://calculatorhub.site/#organization"},
            "image":["https://calculatorhub.site/images/density-converter-hero.webp"]
          },
      
          /* 5) SoftwareApplication */
          {
            "@context":"https://schema.org",
            "@type":"SoftwareApplication",
            "@id":"https://calculatorhub.site/density-converter#software",
            "name":"Advanced Density Converter",
            "applicationCategory":"UtilitiesApplication",
            "operatingSystem":"All",
            "url":"https://calculatorhub.site/density-converter",
            "publisher":{"@id":"https://calculatorhub.site/#organization"},
            "description":"Interactive converter for kg/m³, g/cm³, g/mL, kg/L, lb/ft³, lb/in³, oz/in³, slug/ft³, and lb/gal."
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
      <link rel="canonical" href="https://calculatorhub.site/density-converter" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/density-converter" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/density-converter" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/density-converter" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Density Converter — kg/m³, g/cm³, g/mL, kg/L, lb/ft³, lb/in³, oz/in³, slug/ft³, lb/gal" />
      <meta property="og:description" content="Fast, precise density conversions with Normal/Compact/Scientific formats, favorites, history, and CSV export." />
      <meta property="og:url" content="https://calculatorhub.site/density-converter" />
      <meta property="og:image" content="https://calculatorhub.site/images/density-converter-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Density converter UI showing g/cm³ ↔ kg/m³ and lb/ft³ ↔ kg/m³ conversions" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Density Converter — g/cm³↔kg/m³, g/mL, kg/L, lb/ft³, lb/in³, oz/in³, slug/ft³, lb/gal" />
      <meta name="twitter:description" content="Engineer-ready density conversions with precision controls and CSV export." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/density-converter-hero.webp" />
      <meta name="twitter:creator" content="@CalculatorHub" />
      <meta name="twitter:site" content="@CalculatorHub" />
      
      {/** PWA & theme */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#0b1220" />
      
      {/** Performance */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="preload" as="image" href="/images/density-converter-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />


      <div className="max-w-5xl mx-auto text-gray-200">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Density Converter', url: '/density-converter' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 rounded-2xl p-6 bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-900 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">Density Converter (Advanced)</h1>
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
                  className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Enter density value"
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
            {(fromUnit === 'g/cm3' || toUnit === 'g/cm3') && (
              <div className="mt-2 text-xs text-blue-200/80">
                Tip: water at ~4°C ≈ <b>1 g/cm³</b> (≈ 1000 kg/m³).
              </div>
            )}
          </div>

          {/* More options */}
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
            {DENSITY_UNITS.map((unit) => {
              if (unit.key === fromUnit) return null;
              const val = gridResults[unit.key];
              const display = formatNumber(val ?? 0, formatMode, precision);
              return (
                <div key={unit.key} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:bg-gray-700/70 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon.Cube style={{ width: 16, height: 16, color: '#60a5fa' }} />
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
        {/* ==================== SEO Content: Density Converter (EN) ==================== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          <header className="mb-10">
            <h1 className="text-3xl font-bold text-blue-300">Density Converter — kg/m³, g/cm³, g/mL, kg/L, lb/ft³, lb/in³, oz/in³, slug/ft³, lb/gal</h1>
            <p className="mt-2 text-slate-300">
              Convert density units instantly for lab work, process engineering, materials, and HVAC. Choose from
              <strong> metric</strong> (kg/m³, g/cm³, g/mL, kg/L), <strong>US/Imperial</strong> (lb/ft³, lb/in³, oz/in³, slug/ft³, lb/gal US &amp; Imp),
              and more. Adjust decimals, switch Normal/Compact/Scientific formats, favorite frequent units, review recent runs,
              and export results with Copy or CSV. Shareable URLs preserve state.
            </p>
          </header>
        
          {/* TOC */}
          <nav className="mt-2 mb-10 bg-[#0b1220] border border-[#1c2a4d] rounded-xl p-5 text-slate-200">
            <h2 className="text-lg font-semibold text-gray-100 mb-3">📖 Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><a href="#den-how" className="text-blue-300 hover:underline">How to Use</a></li>
              <li><a href="#den-units" className="text-blue-300 hover:underline">Supported Units & Constants</a></li>
              <li><a href="#den-notes" className="text-blue-300 hover:underline">Engineering Notes (density vs SG)</a></li>
              <li><a href="#den-examples" className="text-blue-300 hover:underline">Worked Examples</a></li>
              <li><a href="#den-quickref" className="text-blue-300 hover:underline">Quick Reference</a></li>
              <li><a href="#den-faq" className="text-blue-300 hover:underline">FAQ</a></li>
            </ol>
          </nav>
        
          {/* How to use */}
          <h2 id="den-how" className="text-2xl font-semibold text-blue-200 mt-10 mb-4">💡 How to Use</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter a number in <strong>Value</strong> (empty = 0; commas like <code>1,234.56</code> allowed).</li>
            <li>Select <strong>From</strong> and <strong>To</strong> units (pin frequent ones with <strong>Fav</strong>).</li>
            <li>Open <strong>More options</strong> to set <strong>Precision</strong> (0–12) and <strong>Format</strong>.</li>
            <li>Use <strong>Copy All</strong> or <strong>CSV</strong> to export the full grid.</li>
            <li>Recent stores your last 10 conversions in local storage for quick recall.</li>
          </ol>
          <p className="text-xs text-slate-400">The URL encodes the current inputs—bookmark or share to reproduce exactly.</p>
        
          {/* Units */}
          <h2 id="den-units" className="text-2xl font-semibold text-blue-200 mt-10 mb-4">🌐 Supported Units & Constants</h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li><strong>SI / metric:</strong> kg/m³, g/cm³, g/m³, g/L, kg/L, g/mL, mg/mL, mg/cm³</li>
              <li><strong>US/Imperial:</strong> lb/ft³, lb/in³, oz/in³, slug/ft³, lb/gal (US), lb/gal (Imp)</li>
            </ul>
            <p className="mt-3 text-slate-400 text-xs leading-relaxed">
              Key factors to kg/m³: 1 g/cm³ = <strong>1000</strong>; 1 g/L = <strong>1</strong>; 1 g/m³ = <strong>0.001</strong>;
              1 g/mL = <strong>1000</strong>; 1 kg/L = <strong>1000</strong>; 1 mg/mL = <strong>1</strong>; 1 mg/cm³ = <strong>1</strong>;
              1 lb/ft³ ≈ <strong>16.01846337</strong>; 1 lb/in³ ≈ <strong>27679.90471</strong>; 1 oz/in³ ≈ <strong>1729.99404</strong>;
              1 slug/ft³ ≈ <strong>515.378818</strong>; 1 lb/US gal ≈ <strong>119.8264273</strong>; 1 lb/Imp gal ≈ <strong>99.77637266</strong>.
            </p>
          </div>
        
          {/* Engineering notes */}
          <h2 id="den-notes" className="text-2xl font-semibold text-blue-200 mt-10 mb-4">📐 Engineering Notes (density vs SG)</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Density</strong> depends on temperature and pressure. Always state conditions if results drive design.</li>
            <li><strong>Specific gravity (SG)</strong> is dimensionless: SG ≈ ρ / (1000 kg/m³) for water near 4&nbsp;°C.
              Thus ρ (kg/m³) ≈ SG × 1000 (approximate; temperature matters).</li>
            <li><strong>Gallon caution:</strong> US gallon (≈3.785 L) ≠ Imperial gallon (≈4.546 L); density per lb/gal differs.</li>
            <li><strong>Data hygiene:</strong> For very large/small values, switch to Scientific format and set decimals consistently.</li>
          </ul>
        
          {/* Examples */}
          <h2 id="den-examples" className="text-2xl font-semibold text-blue-200 mt-10 mb-4">📈 Worked Examples (rounded)</h2>
          <ul className="space-y-2">
            <li><strong>1 g/cm³ → kg/m³</strong>: 1 × 1000 = <strong>1000 kg/m³</strong></li>
            <li><strong>62.4 lb/ft³ → kg/m³</strong>: 62.4 × 16.01846337 ≈ <strong>1000.35 kg/m³</strong> (fresh water ≈ 62.4 lb/ft³)</li>
            <li><strong>0.85 g/mL → kg/m³</strong>: 0.85 × 1000 = <strong>850 kg/m³</strong></li>
            <li><strong>1 lb/in³ → kg/m³</strong>: 1 × 27679.90471 ≈ <strong>27679.90 kg/m³</strong></li>
            <li><strong>8.34 lb/US gal → kg/m³</strong>: 8.34 × 119.8264273 ≈ <strong>999.9 kg/m³</strong></li>
          </ul>
        
          {/* Quick Reference */}
          <h2 id="den-quickref" className="text-2xl font-semibold text-blue-200 mt-10 mb-4">🗂️ Quick Reference</h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li>1 g/cm³ = <strong>1000 kg/m³</strong></li>
              <li>1 g/mL = <strong>1000 kg/m³</strong></li>
              <li>1 kg/L = <strong>1000 kg/m³</strong></li>
              <li>1 g/L = <strong>1 kg/m³</strong></li>
              <li>1 mg/mL = <strong>1 kg/m³</strong></li>
              <li>1 mg/cm³ = <strong>1 kg/m³</strong></li>
              <li>1 lb/ft³ ≈ <strong>16.01846337 kg/m³</strong></li>
              <li>1 lb/in³ ≈ <strong>27679.90471 kg/m³</strong></li>
              <li>1 oz/in³ ≈ <strong>1729.99404 kg/m³</strong></li>
              <li>1 slug/ft³ ≈ <strong>515.378818 kg/m³</strong></li>
              <li>1 lb/US gal ≈ <strong>119.8264273 kg/m³</strong></li>
              <li>1 lb/Imp gal ≈ <strong>99.77637266 kg/m³</strong></li>
            </ul>
          </div>
        
          {/* FAQ */}
          <h2 id="den-faq" className="text-2xl font-semibold text-blue-200 mt-10 mb-4">❓ Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-blue-300">Is g/mL the same as g/cm³?</h3>
              <p>Yes numerically: 1 g/mL = 1 g/cm³ = 1000 kg/m³ (assuming the same conditions).</p>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-blue-300">What density should I use for water?</h3>
              <p>Common approximations: 1000 kg/m³ (≈ 1 g/cm³) near 4 °C; ~998 kg/m³ at 20 °C; always specify temperature.</p>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-blue-300">Why are lb/gal (US) and lb/gal (Imp) different?</h3>
              <p>The gallon volumes differ (US ≈ 3.785 L, Imp ≈ 4.546 L), so mass-per-gallon densities differ accordingly.</p>
            </div>
          </div>
        
          {/* Author & Cross-links */}
          <section className="mt-12 border-t border-gray-700 pt-6">
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
                  Specialists in scientific & engineering converters. Last updated:
                  <time dateTime="2025-11-09"> November 9, 2025</time>.
                </p>
              </div>
            </div>
        
            <div className="mt-8 bg-gradient-to-r from-slate-900/30 via-indigo-900/30 to-blue-900/30 rounded-lg border border-slate-700 shadow-inner p-4">
              <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">🚀 Explore more tools on CalculatorHub:</p>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link
                  to="/force-converter"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-cyan-600/20 text-cyan-300 hover:text-cyan-200 px-3 py-2 rounded-md border border-slate-700 hover:border-cyan-500 transition-all duration-200"
                >
                  🧲 Force Converter
                </Link>
                <Link
                  to="/power-converter"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-amber-600/20 text-amber-300 hover:text-amber-200 px-3 py-2 rounded-md border border-slate-700 hover:border-amber-500 transition-all duration-200"
                >
                  ⚡ Power Converter
                </Link>
                <Link
                  to="/time-converter"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-200 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
                >
                  ⏱️ Time Converter
                </Link>
              </div>
            </div>
          </section>
        </section>


        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/density-converter" category="unit-converters" />
      </div>
    </>
  );
}
