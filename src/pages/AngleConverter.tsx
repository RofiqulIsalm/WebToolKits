import React, { useEffect, useMemo, useRef, useState } from 'react';
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

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/angle-converter" category="unit-converters" />
      </div>
    </>
  );
}
