import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from "react-router-dom";
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

/* ---------------- Icons (inline, no deps) ---------------- */
const Icon = {
  Protractor: (p: any) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 20h18" />
      <path d="M21 20v-3a9 9 0 0 0-18 0v3" />
      <path d="M7 20v-2m2 2v-2m2 2v-2m2 2v-2m2 2v-2" />
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

/* ---------------- Units (factors are in radians) ----------------
   Constants:
   - 1 turn   = 2π rad
   - 1 degree = π/180 rad
   - 1 grad (gon) = π/200 rad
   - 1 arcmin = (π/180)/60 rad
   - 1 arcsec = (π/180)/3600 rad
   - 1 mrad   = 1e-3 rad
   - 1 mil (NATO) = 2π/6400 rad  (≈ 0.0009817477 rad)
-----------------------------------------------------------------*/
const PI = Math.PI;
const TWO_PI = 2 * PI;

const ANGLE_UNITS = [
  { key: 'rad',     name: 'Radian (rad)',                 factor: 1 },
  { key: 'deg',     name: 'Degree (°)',                   factor: PI / 180 },
  { key: 'turn',    name: 'Turn (rev)',                   factor: TWO_PI },
  { key: 'grad',    name: 'Gradian (gon)',                factor: PI / 200 },
  { key: 'arcmin',  name: 'Arcminute (′)',                factor: (PI / 180) / 60 },
  { key: 'arcsec',  name: 'Arcsecond (″)',                factor: (PI / 180) / 3600 },
  { key: 'mrad',    name: 'Milliradian (mrad)',           factor: 1e-3 },
  { key: 'mil',     name: 'Mil (NATO, 1/6400 turn)',      factor: TWO_PI / 6400 },
];

const unitMap: Record<string, {key:string; name:string; factor:number}> =
  Object.fromEntries(ANGLE_UNITS.map(u => [u.key, u]));
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
  // value[from]*factor[from] = rad;  /factor[to] = value[to]
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
export default function AngleConverter() {
  const [valueStr, setValueStr] = useState('180');
  const [fromUnit, setFromUnit] = useState('deg');
  const [toUnit, setToUnit] = useState('rad');
  const [formatMode, setFormatMode] = useState<typeof FORMAT_MODES[number]>('normal');
  const [precision, setPrecision] = useState(6);
  const [favorites, setFavorites] = useLocalStorage<string[]>('angle:favorites', ['deg','rad','turn','grad','arcmin','mil']);
  const [history, setHistory] = useLocalStorage<any[]>('angle:history', []);

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
    const base = valueNum * (unitMap[fromUnit]?.factor || 1); // radians
    const out: Record<string, number> = {};
    for (const u of ANGLE_UNITS) if (u.key !== fromUnit) out[u.key] = base / u.factor;
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
        a.href = url; a.download = 'angle-conversion.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
      }
    } catch {}
  }

  const favored = ANGLE_UNITS.filter(u => favorites.includes(u.key));
  const unfavored = ANGLE_UNITS.filter(u => !favorites.includes(u.key));
  const hasInput = (valueStr || '').trim() !== '';

  return (
    <>
      {/* ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Angle Converter — Degrees (°), Radians (rad), Turns, Grads, Arcmin, Arcsec, mrad, Mils"
        description="Fast, precise angle conversions between degrees, radians, turns, gradians (gon), arcminutes, arcseconds, milliradians, and NATO mils. Precision slider, Normal/Compact/Scientific formats, favorites/history, copy & CSV export, and shareable URLs."
        keywords={[
          "angle converter","deg to rad","rad to deg","degrees to radians",
          "turn to degree","grad to degree","arcmin to degree","arcsec to degree",
          "mrad to rad","mil to degree","NATO mil","gon converter"
        ]}
        canonical="https://calculatorhub.site/angle-converter"
        schemaData={[
          /* 1) WebPage + Article */
          {
            "@context":"https://schema.org",
            "@type":"WebPage",
            "@id":"https://calculatorhub.site/angle-converter#webpage",
            "url":"https://calculatorhub.site/angle-converter",
            "name":"Angle Converter — Degrees, Radians, Turns, Grads, Arcmin, Arcsec, mrad, Mils",
            "inLanguage":"en",
            "isPartOf":{"@id":"https://calculatorhub.site/#website"},
            "primaryImageOfPage":{
              "@type":"ImageObject",
              "@id":"https://calculatorhub.site/images/angle-converter-hero.webp#primaryimg",
              "url":"https://calculatorhub.site/images/angle-converter-hero.webp",
              "width":1200,"height":675
            },
            "mainEntity":{
              "@type":"Article",
              "@id":"https://calculatorhub.site/angle-converter#article",
              "headline":"Angle Unit Converter",
              "description":"Convert degrees, radians, turns, gradians, arcminutes, arcseconds, milliradians, and NATO mils with precision controls and export tools.",
              "image":["https://calculatorhub.site/images/angle-converter-hero.webp"],
              "author":{"@type":"Organization","name":"CalculatorHub","url":"https://calculatorhub.site"},
              "publisher":{"@id":"https://calculatorhub.site/#organization"},
              "datePublished":"2025-11-09",
              "dateModified":"2025-11-09",
              "mainEntityOfPage":{"@id":"https://calculatorhub.site/angle-converter#webpage"},
              "articleSection":[
                "Supported Units","Radians & Degrees","Turns & Grads",
                "Arcminute/Arcsecond","Milliradian & NATO mil","Precision & Formats","FAQ"
              ]
            }
          },
          /* 2) Breadcrumbs */
          {
            "@context":"https://schema.org",
            "@type":"BreadcrumbList",
            "@id":"https://calculatorhub.site/angle-converter#breadcrumbs",
            "itemListElement":[
              {"@type":"ListItem","position":1,"name":"Home","item":"https://calculatorhub.site/"},
              {"@type":"ListItem","position":2,"name":"Unit Converters","item":"https://calculatorhub.site/category/unit-converters"},
              {"@type":"ListItem","position":3,"name":"Angle Converter","item":"https://calculatorhub.site/angle-converter"}
            ]
          },
          /* 3) FAQ */
          {
            "@context":"https://schema.org",
            "@type":"FAQPage",
            "@id":"https://calculatorhub.site/angle-converter#faq",
            "mainEntity":[
              {
                "@type":"Question",
                "name":"How do I convert degrees to radians?",
                "acceptedAnswer":{"@type":"Answer","text":"Use rad = deg × π/180. Conversely, deg = rad × 180/π."}
              },
              {
                "@type":"Question",
                "name":"What is a turn and how many degrees or radians is it?",
                "acceptedAnswer":{"@type":"Answer","text":"1 turn = 360° = 2π rad."}
              },
              {
                "@type":"Question",
                "name":"What is a NATO mil?",
                "acceptedAnswer":{"@type":"Answer","text":"NATO mil is defined as 1/6400 of a turn, so 1 mil = 2π/6400 rad ≈ 0.05625°."}
              },
              {
                "@type":"Question",
                "name":"How do I handle arcminutes and arcseconds?",
                "acceptedAnswer":{"@type":"Answer","text":"1° = 60′ and 1′ = 60″. In radians, 1′ = (π/180)/60, 1″ = (π/180)/3600."}
              },
              {
                "@type":"Question",
                "name":"Can I enter angles in DMS format (e.g., 12°34′56″)?",
                "acceptedAnswer":{"@type":"Answer","text":"Yes, enter degrees-minutes-seconds as D°M′S″ to convert. (Use the DMS input helper on the page.)"}
              }
            ]
          },
          /* 4) WebApplication */
          {
            "@context":"https://schema.org",
            "@type":"WebApplication",
            "@id":"https://calculatorhub.site/angle-converter#webapp",
            "name":"Angle Converter",
            "url":"https://calculatorhub.site/angle-converter",
            "applicationCategory":"UtilitiesApplication",
            "operatingSystem":"Web",
            "description":"Interactive angle converter with precision slider, format modes, favorites/history, copy and CSV export.",
            "publisher":{"@id":"https://calculatorhub.site/#organization"},
            "image":["https://calculatorhub.site/images/angle-converter-hero.webp"]
          },
          /* 5) SoftwareApplication */
          {
            "@context":"https://schema.org",
            "@type":"SoftwareApplication",
            "@id":"https://calculatorhub.site/angle-converter#software",
            "name":"Advanced Angle Converter",
            "applicationCategory":"UtilitiesApplication",
            "operatingSystem":"All",
            "url":"https://calculatorhub.site/angle-converter",
            "publisher":{"@id":"https://calculatorhub.site/#organization"},
            "description":"Convert standard and engineering angle units for math, surveying, ballistics, and UI design."
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
      
      {/* ===== Outside meta/link tags ===== */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <link rel="canonical" href="https://calculatorhub.site/angle-converter" />
      
      {/* Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/angle-converter" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/angle-converter" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/angle-converter" hreflang="x-default" />
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Angle Converter — Degrees, Radians, Turns, Grads, Arcmin, Arcsec, mrad, Mils" />
      <meta property="og:description" content="Engineer-ready angle conversions with precision controls, format modes, favorites/history, and CSV export." />
      <meta property="og:url" content="https://calculatorhub.site/angle-converter" />
      <meta property="og:image" content="https://calculatorhub.site/images/angle-converter-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Angle converter UI showing degree ↔ radian conversions" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Angle Converter — Degrees (°) ⇄ Radians (rad) ⇄ Turns (rev)" />
      <meta name="twitter:description" content="Quick, precise conversions for deg, rad, turn, grad, arcmin, arcsec, mrad, and mil." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/angle-converter-hero.webp" />
      <meta name="twitter:creator" content="@CalculatorHub" />
      <meta name="twitter:site" content="@CalculatorHub" />
      
      {/* PWA & theme */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#26120a" />
      
      {/* Performance */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="preload" as="image" href="/images/angle-converter-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/* Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />


      <div className="max-w-5xl mx-auto text-gray-200">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Angle Converter', url: '/angle-converter' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 rounded-2xl p-6 bg-gradient-to-r from-amber-900 via-orange-900 to-rose-900 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">Angle Converter (Advanced)</h1>
          <p className="text-gray-300">
            Degrees ↔ Radians ↔ Turns, plus arcmin/arcsec, grads, mrad, mils.
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
                  aria-label="Enter angle value"
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
            {((fromUnit === 'mil' || toUnit === 'mil') || (fromUnit === 'turn' || toUnit === 'turn')) && (
              <div className="mt-2 text-xs text-amber-200/80">
                Notes: 1 turn = 360° = 2π rad; 1 mil (NATO) = 1/6400 turn ≈ 0.05625°.
              </div>
            )}
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
            {ANGLE_UNITS.map((unit) => {
              if (unit.key === fromUnit) return null;
              const val = gridResults[unit.key];
              const display = formatNumber(val ?? 0, formatMode, precision);
              return (
                <div key={unit.key} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:bg-gray-700/70 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon.Protractor style={{ width: 16, height: 16, color: '#f59e0b' }} />
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

        {/* =========== SEO Content: Angle Converter (English Only) ======*/}
      <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
      
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-amber-300">Angle Converter — Degrees, Radians, Turns, Grads, Arcminutes, Arcseconds, mrad, and Mils</h1>
          <p className="mt-3">
            This Angle Converter gives you fast, precise transformations across every common angle unit used in mathematics, graphics,
            surveying, astronomy, ballistics, and UI design. Convert between <strong>degrees (°)</strong>, <strong>radians (rad)</strong>,
            <strong>turns (rev)</strong>, <strong>gradians (gon)</strong>, <strong>arcminutes (′)</strong>, <strong>arcseconds (″)</strong>,
            <strong>milliradians (mrad)</strong>, and <strong>NATO mils</strong>. Adjust decimals (0–12), switch display style
            (Normal / Compact / Scientific), pin favorites, revisit your last ten conversions, and export a full grid with Copy or CSV.
            Shareable links preserve your exact state, so teammates open the same configuration instantly.
          </p>
        </header>
      
        {/* Contents */}
        <nav className="mt-2 mb-10 bg-[#26120a] border border-[#4a2b1d] rounded-xl p-5 text-slate-200">
          <h2 className="text-lg font-semibold text-gray-100 mb-3">📖 Contents</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li><a href="#ang-how" className="text-amber-300 hover:underline">How to Use</a></li>
            <li><a href="#ang-basics" className="text-amber-300 hover:underline">Angle Basics &amp; When to Use Each Unit</a></li>
            <li><a href="#ang-constants" className="text-amber-300 hover:underline">Core Constants &amp; Definitions</a></li>
            <li><a href="#ang-formulas" className="text-amber-300 hover:underline">Conversion Formulas (All Units)</a></li>
            <li><a href="#ang-examples" className="text-amber-300 hover:underline">Worked Examples</a></li>
            <li><a href="#ang-usecases" className="text-amber-300 hover:underline">Real-World Use Cases</a></li>
            <li><a href="#ang-precision" className="text-amber-300 hover:underline">Precision, Rounding &amp; Numeric Display</a></li>
            <li><a href="#ang-dms" className="text-amber-300 hover:underline">Degrees–Minutes–Seconds (DMS) Notes</a></li>
            <li><a href="#ang-quickref" className="text-amber-300 hover:underline">Quick Reference Tables</a></li>
            <li><a href="#ang-faq" className="text-amber-300 hover:underline">FAQ</a></li>
            <li><a href="#ang-access" className="text-amber-300 hover:underline">Accessibility &amp; Shortcuts</a></li>
            <li><a href="#ang-trouble" className="text-amber-300 hover:underline">Troubleshooting &amp; Tips</a></li>
            <li><a href="#ang-glossary" className="text-amber-300 hover:underline">Glossary</a></li>
          </ol>
        </nav>
      
        {/* How to Use */}
        <h2 id="ang-how" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">💡 How to Use</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Enter a number in the <strong>Value</strong> field. Empty input counts as 0; commas such as <code>1,234.56</code> are accepted.</li>
          <li>Select the <strong>From</strong> unit and the <strong>To</strong> unit. Pin frequently used units with the <strong>Fav</strong> button.</li>
          <li>Open <strong>More options</strong> to set decimals (0–12) and pick the display style: Normal, Compact, or Scientific.</li>
          <li>Use <strong>Copy All</strong> or <strong>CSV</strong> to export the full results grid for documentation or spreadsheets.</li>
          <li>Restore prior configurations with <strong>Recent</strong> (your last ten conversions are saved automatically).</li>
        </ol>
        <p className="text-xs text-slate-400">Pro tip: The URL auto-encodes your state (value, units, format, precision). Bookmark or share it for exact reproducibility.</p>
      
        {/* Angle Basics */}
        <h2 id="ang-basics" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">📐 Angle Basics &amp; When to Use Each Unit</h2>
        <p>
          Angles measure rotation. Different fields prefer different units:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Degrees (°):</strong> Intuitive for people, common in education, navigation displays, and UI design. A full circle is 360°.</li>
          <li><strong>Radians (rad):</strong> Natural for calculus, trigonometry, and programming libraries. A full circle is 2π rad. Most math functions assume radians.</li>
          <li><strong>Turns (rev):</strong> One full revolution equals 1 turn. Useful for periodic or rotational motion and for expressing fractions of a circle cleanly (e.g., 0.25 turn = 90°).</li>
          <li><strong>Gradians (gon):</strong> A circle is 400 grads. Used in surveying and geodesy; 100 grads corresponds to a right angle.</li>
          <li><strong>Arcminutes (′) &amp; Arcseconds (″):</strong> Fine subdivisions of a degree (1° = 60′, 1′ = 60″), used in astronomy, optics, map scales, and precise alignment.</li>
          <li><strong>Milliradians (mrad):</strong> 1 mrad = 0.001 rad. Popular in ballistics, optics, and engineering for small angles, because the “opposite ≈ mrad × distance” rule is convenient.</li>
          <li><strong>NATO mils (mil):</strong> Defined as 1/6400 of a turn; used in artillery and military navigation. Approximately 0.05625° per mil.</li>
        </ul>
        <p className="mt-2">
          Choosing the right unit depends on your audience, tools, and precision requirements. This converter standardizes values so you can present them in the unit that makes the most sense for your task—without manual math.
        </p>
      
        {/* Constants & Definitions */}
        <h2 id="ang-constants" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">🌐 Core Constants &amp; Definitions</h2>
        <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <li>π ≈ <strong>3.141592653589793</strong></li>
            <li>Full circle = <strong>360° = 2π rad = 1 turn = 400 grad</strong></li>
            <li>1° = <strong>π/180 rad</strong></li>
            <li>1 grad (gon) = <strong>π/200 rad</strong></li>
            <li>1′ (arcminute) = <strong>(π/180)/60 rad</strong></li>
            <li>1″ (arcsecond) = <strong>(π/180)/3600 rad</strong></li>
            <li>1 mrad = <strong>0.001 rad</strong></li>
            <li>1 mil (NATO) = <strong>2π/6400 rad</strong> ≈ 0.0009817477 rad ≈ 0.05625°</li>
          </ul>
        </div>
      
        {/* Formulas */}
        <h2 id="ang-formulas" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">🧮 Conversion Formulas (All Units)</h2>
        <p>
          The converter uses <strong>radians</strong> as the internal base. Converting is a two-step process: map your input to radians, then map radians to the target unit.
          Below are direct formulas for convenience.
        </p>
      
        <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm space-y-3">
          <p className="font-semibold">Degrees ↔ Radians</p>
          <ul className="list-disc list-inside">
            <li><strong>rad = deg × (π / 180)</strong></li>
            <li><strong>deg = rad × (180 / π)</strong></li>
          </ul>
      
          <p className="font-semibold">Degrees ↔ Turns</p>
          <ul className="list-disc list-inside">
            <li><strong>turn = deg / 360</strong></li>
            <li><strong>deg = turn × 360</strong></li>
          </ul>
      
          <p className="font-semibold">Degrees ↔ Gradians (gon)</p>
          <ul className="list-disc list-inside">
            <li><strong>grad = deg × (10 / 9)</strong>  (because 360° = 400 grad)</li>
            <li><strong>deg = grad × (9 / 10)</strong></li>
          </ul>
      
          <p className="font-semibold">Arcminutes &amp; Arcseconds</p>
          <ul className="list-disc list-inside">
            <li><strong>1° = 60′</strong>, <strong>1′ = 60″</strong></li>
            <li><strong>deg = deg + (min / 60) + (sec / 3600)</strong> (DMS to decimal degrees)</li>
            <li><strong>min = (decimal part of deg) × 60</strong>; <strong>sec = (decimal part of min) × 60</strong></li>
            <li>In radians: <strong>1′ = (π/180)/60</strong>, <strong>1″ = (π/180)/3600</strong></li>
          </ul>
      
          <p className="font-semibold">Milliradian &amp; NATO mil</p>
          <ul className="list-disc list-inside">
            <li><strong>mrad = rad × 1000</strong>, <strong>rad = mrad / 1000</strong></li>
            <li><strong>mil = turn × 6400</strong>, <strong>turn = mil / 6400</strong></li>
            <li>Also: <strong>mil (deg) = deg / 0.05625</strong> and <strong>deg = mil × 0.05625</strong> (approx)</li>
          </ul>
        </div>
      
        {/* Examples */}
        <h2 id="ang-examples" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">📈 Worked Examples (Rounded)</h2>
        <ul className="space-y-2">
          <li><strong>180° → rad:</strong> 180 × π/180 = <strong>π rad ≈ 3.14159265</strong></li>
          <li><strong>90° → turn:</strong> 90/360 = <strong>0.25 turn</strong></li>
          <li><strong>45° → grad:</strong> 45 × (10/9) = <strong>50 grad</strong></li>
          <li><strong>1° → arcminutes and arcseconds:</strong> 1° = <strong>60′</strong> = <strong>3600″</strong></li>
          <li><strong>0.5 mrad → degrees:</strong> 0.5 mrad = 0.0005 rad; deg = 0.0005 × 180/π ≈ <strong>0.02865°</strong></li>
          <li><strong>320 mil → degrees:</strong> deg = 320 × 0.05625 = <strong>18°</strong></li>
          <li><strong>2.5 rad → degrees:</strong> deg = 2.5 × 180/π ≈ <strong>143.239°</strong></li>
        </ul>
        <p className="text-xs text-slate-400">
          Your UI shows exact values at your chosen precision; results above are rounded for readability.
        </p>
      
        {/* Use Cases */}
        <h2 id="ang-usecases" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">🛠️ Real-World Use Cases</h2>
      
        <h3 className="text-lg font-semibold text-gray-100 mt-4">Mathematics &amp; Programming</h3>
        <p>
          Most math libraries expect radians for trig functions (<code>sin</code>, <code>cos</code>, <code>atan2</code>). If your inputs are in degrees,
          convert first to radians. When you display to users, convert back to degrees if that’s more intuitive.
        </p>
      
        <h3 className="text-lg font-semibold text-gray-100 mt-4">Computer Graphics &amp; Animation</h3>
        <p>
          Engines often store rotations in radians (or quaternions), but designers and animators usually think in degrees.
          This tool closes the gap, ensuring keyframe values match both the math and the creative intent.
        </p>
      
        <h3 className="text-lg font-semibold text-gray-100 mt-4">Surveying, Mapping &amp; Geodesy</h3>
        <p>
          Grads (gons) are still popular in surveying because 100 grads is a right angle and 400 grads completes a circle.
          Arcminutes/arcseconds are used for fine angular measurements on maps and transit instruments.
        </p>
      
        <h3 className="text-lg font-semibold text-gray-100 mt-4">Astronomy &amp; Optics</h3>
        <p>
          Celestial coordinates, telescope alignment, and diffraction formulas often use arcminutes/arcseconds and radians.
          For very small angles, radians and milliradians are numerically stable and convenient for calculations.
        </p>
      
        <h3 className="text-lg font-semibold text-gray-100 mt-4">Ballistics &amp; Marksmanship</h3>
        <p>
          Scopes are commonly calibrated in <strong>mrad</strong> or <strong>MOA</strong> (minute of angle; 1 MOA ≈ 1.0472″ at 100 yd ≈ 0.2909 mrad).
          NATO mils are used for artillery and range finding; one mil corresponds to approximately one unit of spread per thousand units of distance (small-angle approximation).
        </p>
      
        <h3 className="text-lg font-semibold text-gray-100 mt-4">Robotics &amp; Mechatronics</h3>
        <p>
          Kinematics, control loops, and servo setpoints often use radians internally, while dashboards and field tools display degrees for clarity.
          Converting consistently avoids off-by-π errors and mis-tuned controllers.
        </p>
      
        {/* Precision */}
        <h2 id="ang-precision" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">🎯 Precision, Rounding &amp; Numeric Display</h2>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Decimals:</strong> Choose based on device resolution and audience. Engineering specs may need 3–6 decimals; UI labels typically need 0–2.</li>
          <li><strong>Display modes:</strong> Compact (K/M/B) is useful for large arcsecond counts; Scientific is ideal for tiny radian values.</li>
          <li><strong>π-based exactness:</strong> Some angles (e.g., 180°) have exact symbolic forms (π rad). Numeric outputs are approximations to your chosen precision.</li>
          <li><strong>Accumulated conversions:</strong> Convert once to radians, then to targets; avoid chaining multiple human calculations that introduce rounding drift. Your converter does this correctly.</li>
        </ul>
      
        {/* DMS */}
        <h2 id="ang-dms" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">🧭 Degrees–Minutes–Seconds (DMS) Notes</h2>
        <p>
          <strong>DMS → Decimal Degrees:</strong> <code>deg_decimal = D + (M / 60) + (S / 3600)</code>. For negative angles, apply the sign to the whole expression.
        </p>
        <p>
          <strong>Decimal Degrees → DMS:</strong> <code>D = floor(|deg|)</code>, <code>M = floor((|deg| − D) × 60)</code>, <code>S = ((|deg| − D) × 60 − M) × 60</code>, then reapply the sign to D.
        </p>
        <p className="text-xs text-slate-400">
          Many datasets (e.g., bearings and coordinates) appear in DMS; normalize to decimal degrees or radians for computations, then convert back for presentation.
        </p>
      
        {/* Quick Reference */}
        <h2 id="ang-quickref" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">🗂️ Quick Reference Tables</h2>
      
        <h3 className="text-lg font-semibold text-gray-100 mt-4">Key Identities</h3>
        <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <li>Full circle = <strong>360° = 2π rad = 1 turn = 400 grad</strong></li>
            <li>Right angle = <strong>90° = π/2 rad = 0.25 turn = 100 grad</strong></li>
            <li>1° = <strong>60′ = 3600″</strong></li>
            <li>1 mil (NATO) ≈ <strong>0.05625°</strong> ≈ 0.0009817477 rad</li>
            <li>1 mrad = <strong>0.05729578°</strong> ≈ 3.43775′ ≈ 206.265″</li>
            <li>1° ≈ <strong>17.453293 mrad</strong></li>
          </ul>
        </div>
      
        <h3 className="text-lg font-semibold text-gray-100 mt-6">Common Conversions</h3>
        <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <li>deg → rad: <code>× π/180</code></li>
            <li>rad → deg: <code>× 180/π</code></li>
            <li>deg → turn: <code>÷ 360</code></li>
            <li>turn → deg: <code>× 360</code></li>
            <li>deg → grad: <code>× 10/9</code></li>
            <li>grad → deg: <code>× 9/10</code></li>
            <li>deg → mil: <code>÷ 0.05625</code> (approx)</li>
            <li>mil → deg: <code>× 0.05625</code> (approx)</li>
            <li>rad → mrad: <code>× 1000</code></li>
            <li>mrad → rad: <code>÷ 1000</code></li>
          </ul>
        </div>
      
        {/* FAQ */}
        <h2 id="ang-faq" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">❓ Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-amber-300">Why do math libraries use radians?</h3>
            <p>Radians relate arc length to radius directly (s = r·θ), making derivatives of trig functions elegant and consistent (e.g., d/dx sin x = cos x only in radians).</p>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-amber-300">When should I use turns?</h3>
            <p>Use turns for circular ratios and periodic motion. Fractions like 0.125 turn are visually clear, avoiding degree clutter for repeated rotations.</p>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-amber-300">Grads vs degrees — which is better?</h3>
            <p>Neither is universally better. Grads simplify right angles (100 grad) in surveying systems; degrees are more familiar to general users and most UIs.</p>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-amber-300">How small is a milliradian in practice?</h3>
            <p>At small angles, the tangent approximation holds: a span of 1 mrad at 1000 m is ~1 m; at 100 m it’s ~0.1 m. That’s why mrad is used in optics and ballistics.</p>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-amber-300">Are NATO mils exactly 1/6400 of a turn?</h3>
            <p>Yes for NATO definition in this converter. Historical or alternative “mil” definitions exist, but NATO mil is standardized as 6400 per turn.</p>
          </div>
        </div>
      
        {/* Accessibility & Shortcuts */}
        <h2 id="ang-access" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">♿ Accessibility &amp; Shortcuts</h2>
        <ul className="list-disc list-inside">
          <li><kbd>/</kbd> — focus Value</li>
          <li><kbd>S</kbd> — focus From</li>
          <li><kbd>T</kbd> — focus To</li>
          <li><kbd>X</kbd> — swap units</li>
        </ul>
        <p className="text-xs text-slate-400 mt-2">
          Form controls have visible focus and ARIA labels; helper text explains input behavior. Tooltips and alerts avoid surprise state changes.
        </p>
      
        {/* Troubleshooting */}
        <h2 id="ang-trouble" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">🧩 Troubleshooting &amp; Tips</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Seeing “—”? Check that the input is numeric and your units are valid.</li>
          <li>Too many digits? Reduce decimals or pick Compact/Scientific.</li>
          <li>Need reproducibility? Share the auto-encoded URL with teammates.</li>
          <li>Expecting degrees but seeing radians? Confirm the <strong>To</strong> unit; many code libraries default to radians.</li>
        </ul>
      
        {/* Glossary */}
        <h2 id="ang-glossary" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">📚 Glossary</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <dt className="font-semibold text-amber-300">Degree (°)</dt>
            <dd>Human-friendly angle measure; 360° in a full circle.</dd>
          </div>
          <div>
            <dt className="font-semibold text-amber-300">Radian (rad)</dt>
            <dd>Mathematical angle measure; 2π in a full circle.</dd>
          </div>
          <div>
            <dt className="font-semibold text-amber-300">Turn (rev)</dt>
            <dd>One complete revolution; equals 360° or 2π rad.</dd>
          </div>
          <div>
            <dt className="font-semibold text-amber-300">Gradian (gon)</dt>
            <dd>Circle split into 400; right angle is 100 grad.</dd>
          </div>
          <div>
            <dt className="font-semibold text-amber-300">Arcminute (′)</dt>
            <dd>1/60 of a degree, used for fine subdivisions.</dd>
          </div>
          <div>
            <dt className="font-semibold text-amber-300">Arcsecond (″)</dt>
            <dd>1/3600 of a degree; common in astronomy and optics.</dd>
          </div>
          <div>
            <dt className="font-semibold text-amber-300">Milliradian (mrad)</dt>
            <dd>0.001 rad; convenient for small angles and range estimation.</dd>
          </div>
          <div>
            <dt className="font-semibold text-amber-300">NATO mil</dt>
            <dd>1/6400 of a turn; artillery and military sighting standard.</dd>
          </div>
        </dl>
      
        {/* Author / Timestamp */}
        <section className="mt-12 border-t border-gray-700 pt-6">
          <div className="flex items-center gap-3">
            <img src="/images/calculatorhub-author.webp" alt="CalculatorHub Tools Team" className="w-12 h-12 rounded-full border border-gray-600" loading="lazy" />
            <div>
              <p className="font-semibold text-white">Author: CalculatorHub Tools Team</p>
              <p className="text-sm text-slate-400">Last updated: <time dateTime="2025-11-10">November 10, 2025</time></p>
            </div>
          </div>
        </section>
      </section>


        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/angle-converter" category="unit-converters" />
      </div>
    </>
  );
}
