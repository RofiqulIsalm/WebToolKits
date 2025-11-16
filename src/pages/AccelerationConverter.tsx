import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from "react-router-dom";
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

/* ---------------- Icons (inline, no deps) ---------------- */
const Icon = {
  Accel: (p: any) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 12l6-3" />
      <path d="M7 17h10" />
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

/* ---------------- Units (factors are in m/s²) ----------------
   Constants:
   - g0 = 9.80665 m/s²
   - 1 Gal (cm/s²) = 0.01 m/s²
   - 1 ft/s² = 0.3048 m/s²
   - 1 in/s² = 0.0254 m/s²
   - 1 km/h/s = (1000/3600) m/s² ≈ 0.2777777778
   - 1 km/h² = 1000 / 3600² m/s² ≈ 0.0000771604938
   - 1 mph/s = 0.44704 m/s²
   - 1 knot/s = 0.5144444444 m/s²
-----------------------------------------------------------------*/
const g0 = 9.80665;

const ACCEL_UNITS = [
  // SI / metric
  { key: 'm/s2',   name: 'Meter per second² (m/s²)',    factor: 1 },
  { key: 'cm/s2',  name: 'Centimeter per second² (cm/s², Gal)', factor: 0.01 },
  { key: 'mm/s2',  name: 'Millimeter per second² (mm/s²)',      factor: 0.001 },
  { key: 'g',      name: 'Standard gravity (g₀)',        factor: g0 },

  // Imperial / others
  { key: 'ft/s2',  name: 'Foot per second² (ft/s²)',     factor: 0.3048 },
  { key: 'in/s2',  name: 'Inch per second² (in/s²)',     factor: 0.0254 },

  // Mixed speed-per-time forms
  { key: 'km/h/s', name: 'Kilometer per hour per second (km/h/s)', factor: 1000/3600 },
  { key: 'km/h2',  name: 'Kilometer per hour² (km/h²)',  factor: 1000 / (3600*3600) },
  { key: 'mph/s',  name: 'Mile per hour per second (mph/s)', factor: 0.44704 },
  { key: 'knot/s', name: 'Knot per second (kn/s)',        factor: 0.5144444444444444 },
];

const unitMap: Record<string, {key:string; name:string; factor:number}> =
  Object.fromEntries(ACCEL_UNITS.map(u => [u.key, u]));
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
  // value[from]*factor[from] = m/s²;  /factor[to] = value[to]
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
export default function AccelerationConverter() {
  const [valueStr, setValueStr] = useState('');
  const [fromUnit, setFromUnit] = useState('m/s2');
  const [toUnit, setToUnit] = useState('g');
  const [formatMode, setFormatMode] = useState<typeof FORMAT_MODES[number]>('normal');
  const [precision, setPrecision] = useState(6);
  const [favorites, setFavorites] = useLocalStorage<string[]>('accel:favorites', ['m/s2','g','cm/s2','ft/s2','mph/s']);
  const [history, setHistory] = useLocalStorage<any[]>('accel:history', []);

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
    for (const u of ACCEL_UNITS) if (u.key !== fromUnit) out[u.key] = base / u.factor;
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
        a.href = url; a.download = 'acceleration-conversion.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
      }
    } catch {}
  }

  const favored = ACCEL_UNITS.filter(u => favorites.includes(u.key));
  const unfavored = ACCEL_UNITS.filter(u => !favorites.includes(u.key));
  const hasInput = (valueStr || '').trim() !== '';

  return (
    <>
      {/** ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Acceleration Converter — m/s² ⇄ g ⇄ Gal (cm/s²) ⇄ ft/s² ⇄ in/s² ⇄ km/h/s ⇄ km/h² ⇄ mph/s ⇄ knot/s"
        description="Convert acceleration instantly across engineering units: m/s², g (9.80665 m/s²), Gal (cm/s²), ft/s², in/s², km/h/s, km/h², mph/s, and knot/s. Features precision control, Normal/Compact/Scientific formats, favorites, history, CSV export, and shareable URLs."
        keywords={[
          "acceleration converter",
          "m/s2 to g",
          "g to m/s2",
          "cm/s2 to m/s2",
          "gal to m/s2",
          "ft/s2 to m/s2",
          "in/s2 to m/s2",
          "km/h/s to m/s2",
          "km/h^2 to m/s^2",
          "mph/s to m/s2",
          "knot/s to m/s2",
          "standard gravity 9.80665",
          "acceleration unit conversion"
        ]}
        canonical="https://calculatorhub.site/acceleration-converter"
        schemaData={[
          /* 1) WebPage + Article */
          {
            "@context":"https://schema.org",
            "@type":"WebPage",
            "@id":"https://calculatorhub.site/acceleration-converter#webpage",
            "url":"https://calculatorhub.site/acceleration-converter",
            "name":"Acceleration Converter — m/s², g, Gal, ft/s², in/s², km/h/s, km/h², mph/s, knot/s",
            "inLanguage":"en",
            "isPartOf":{"@id":"https://calculatorhub.site/#website"},
            "primaryImageOfPage":{
              "@type":"ImageObject",
              "@id":"https://calculatorhub.site/images/acceleration-converter-hero.webp#primaryimg",
              "url":"https://calculatorhub.site/images/acceleration-converter-hero.webp",
              "width":1200,"height":675
            },
            "mainEntity":{
              "@type":"Article",
              "@id":"https://calculatorhub.site/acceleration-converter#article",
              "headline":"Acceleration Converter — Engineering & Physics Units",
              "description":"Convert between m/s², g (g₀=9.80665 m/s²), Gal (cm/s²), ft/s², in/s², km/h/s, km/h², mph/s, and knot/s with precision & formatting controls, keyboard shortcuts, favorites, history, copy/CSV export, and shareable links.",
              "image":["https://calculatorhub.site/images/acceleration-converter-hero.webp"],
              "author":{"@type":"Organization","name":"CalculatorHub","url":"https://calculatorhub.site"},
              "publisher":{"@id":"https://calculatorhub.site/#organization"},
              "datePublished":"2025-11-09",
              "dateModified":"2025-11-09",
              "mainEntityOfPage":{"@id":"https://calculatorhub.site/acceleration-converter#webpage"},
              "articleSection":[
                "Supported Units",
                "Standard Gravity & Gal",
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
            "@id":"https://calculatorhub.site/acceleration-converter#breadcrumbs",
            "itemListElement":[
              {"@type":"ListItem","position":1,"name":"Home","item":"https://calculatorhub.site/"},
              {"@type":"ListItem","position":2,"name":"Unit Converters","item":"https://calculatorhub.site/category/unit-converters"},
              {"@type":"ListItem","position":3,"name":"Acceleration Converter","item":"https://calculatorhub.site/acceleration-converter"}
            ]
          },
      
          /* 3) FAQ */
          {
            "@context":"https://schema.org",
            "@type":"FAQPage",
            "@id":"https://calculatorhub.site/acceleration-converter#faq",
            "mainEntity":[
              {
                "@type":"Question",
                "name":"What is 1 g in m/s²?",
                "acceptedAnswer":{"@type":"Answer","text":"Standard gravity g₀ = 9.80665 m/s²."}
              },
              {
                "@type":"Question",
                "name":"What is a Gal?",
                "acceptedAnswer":{"@type":"Answer","text":"Gal is cm/s². 1 Gal = 0.01 m/s²."}
              },
              {
                "@type":"Question",
                "name":"How do I convert km/h/s to m/s²?",
                "acceptedAnswer":{"@type":"Answer","text":"Multiply by 1000/3600 ≈ 0.2777777778. Example: 3 km/h/s ≈ 0.8333 m/s²."}
              },
              {
                "@type":"Question",
                "name":"mph/s to m/s² factor?",
                "acceptedAnswer":{"@type":"Answer","text":"1 mph/s = 0.44704 m/s²."}
              },
              {
                "@type":"Question",
                "name":"knot/s to m/s² factor?",
                "acceptedAnswer":{"@type":"Answer","text":"1 knot/s ≈ 0.5144444444 m/s²."}
              },
              {
                "@type":"Question",
                "name":"What’s the difference between km/h/s and km/h²?",
                "acceptedAnswer":{"@type":"Answer","text":"km/h/s is acceleration (speed change per second). km/h² is also acceleration but uses hours in the denominator twice; 1 km/h² ≈ 0.0000771604938 m/s²."}
              }
            ]
          },
      
          /* 4) WebApplication */
          {
            "@context":"https://schema.org",
            "@type":"WebApplication",
            "@id":"https://calculatorhub.site/acceleration-converter#webapp",
            "name":"Acceleration Converter",
            "url":"https://calculatorhub.site/acceleration-converter",
            "applicationCategory":"UtilitiesApplication",
            "operatingSystem":"Web",
            "description":"Instant conversion among m/s², g, Gal, ft/s², in/s², km/h/s, km/h², mph/s, and knot/s with shareable links and CSV.",
            "publisher":{"@id":"https://calculatorhub.site/#organization"},
            "image":["https://calculatorhub.site/images/acceleration-converter-hero.webp"]
          },
      
          /* 5) SoftwareApplication */
          {
            "@context":"https://schema.org",
            "@type":"SoftwareApplication",
            "@id":"https://calculatorhub.site/acceleration-converter#software",
            "name":"Advanced Acceleration Converter",
            "applicationCategory":"UtilitiesApplication",
            "operatingSystem":"All",
            "url":"https://calculatorhub.site/acceleration-converter",
            "publisher":{"@id":"https://calculatorhub.site/#organization"},
            "description":"Interactive converter for m/s², g, Gal (cm/s²), ft/s², in/s², km/h/s, km/h², mph/s, and knot/s."
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
      <link rel="canonical" href="https://calculatorhub.site/acceleration-converter" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/acceleration-converter" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/acceleration-converter" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/acceleration-converter" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Acceleration Converter — m/s², g, Gal, ft/s², in/s², km/h/s, km/h², mph/s, knot/s" />
      <meta property="og:description" content="Fast, precise acceleration conversions with Normal/Compact/Scientific formats, favorites, history, and CSV export." />
      <meta property="og:url" content="https://calculatorhub.site/acceleration-converter" />
      <meta property="og:image" content="https://calculatorhub.site/images/acceleration-converter-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Acceleration converter UI showing m/s² ↔ g and mph/s ↔ m/s² conversions" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Acceleration Converter — m/s²↔g, Gal, ft/s², in/s², km/h/s, km/h², mph/s, knot/s" />
      <meta name="twitter:description" content="Engineer-ready acceleration conversions with precision controls and CSV export." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/acceleration-converter-hero.webp" />
      <meta name="twitter:creator" content="@CalculatorHub" />
      <meta name="twitter:site" content="@CalculatorHub" />
      
      {/** PWA & theme */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#150b27" />
      
      {/** Performance */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="preload" as="image" href="/images/acceleration-converter-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />


      <div className="max-w-5xl mx-auto text-gray-200">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Acceleration Converter', url: '/acceleration-converter' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 rounded-2xl p-6 bg-gradient-to-r from-fuchsia-900 via-violet-900 to-indigo-900 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">Acceleration Converter (Advanced)</h1>
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
                  className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  aria-label="Enter acceleration value"
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
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
              className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white border border-violet-500 flex items-center gap-2"
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
            {(fromUnit === 'g' || toUnit === 'g') && (
              <div className="mt-2 text-xs text-violet-200/80">
                Note: standard gravity g₀ = <b>9.80665 m/s²</b>.
              </div>
            )}
            {(fromUnit === 'cm/s2' || toUnit === 'cm/s2') && (
              <div className="mt-1 text-xs text-violet-200/80">
                1 Gal (cm/s²) = 0.01 m/s².
              </div>
            )}
          </div>

          {/* More options */}
          <details className="mt-5">
            <summary className="cursor-pointer text-sm text-gray-300">More options</summary>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Precision</label>
                <input type="range" min={0} max={12} value={precision} onChange={(e) => setPrecision(+e.target.value)} className="w-full accent-violet-500" />
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
            {ACCEL_UNITS.map((unit) => {
              if (unit.key === fromUnit) return null;
              const val = gridResults[unit.key];
              const display = formatNumber(val ?? 0, formatMode, precision);
              return (
                <div key={unit.key} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:bg-gray-700/70 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon.Accel style={{ width: 16, height: 16, color: '#a78bfa' }} />
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

        {/* ============= SEO Content: Acceleration Converter (EN) ============== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          <header className="mb-10">
            <h1 className="text-3xl font-bold text-violet-300">Acceleration Converter — m/s², g, Gal (cm/s²), ft/s², in/s², km/h/s, km/h², mph/s, knot/s</h1>
            <p className="mt-3">
              This Acceleration Converter is built for engineers, students, researchers, and data analysts who need
              fast and precise unit transformations across SI, US/Imperial, and mixed “speed-per-time” forms. Convert
              between <strong>m/s²</strong>, <strong>g</strong> (standard gravity), <strong>Gal</strong> (cm/s²),
              <strong>ft/s²</strong>, <strong>in/s²</strong>, <strong>km/h/s</strong>, <strong>km/h²</strong>,
              <strong>mph/s</strong>, and <strong>knot/s</strong> with confidence. Tweak decimal places, choose
              Normal/Compact/Scientific number formats, mark favorites, revisit recent conversions, and export the full
              result grid with a single click. Shareable URLs preserve every setting you choose.
            </p>
          </header>
        
          {/* Table of Contents */}
          <nav className="mt-2 mb-10 bg-[#150b27] border border-[#2a1d4d] rounded-xl p-5 text-slate-200">
            <h2 className="text-lg font-semibold text-gray-100 mb-3">📖 Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><a href="#accel-how" className="text-violet-300 hover:underline">How to Use</a></li>
              <li><a href="#accel-units" className="text-violet-300 hover:underline">Supported Units & Core Factors</a></li>
              <li><a href="#accel-physics" className="text-violet-300 hover:underline">Physics Background (What Acceleration Means)</a></li>
              <li><a href="#accel-gal" className="text-violet-300 hover:underline">About Gal (cm/s²) and Geophysics Use</a></li>
              <li><a href="#accel-examples" className="text-violet-300 hover:underline">Worked Examples</a></li>
              <li><a href="#accel-engineering" className="text-violet-300 hover:underline">Engineering & Real-World Applications</a></li>
              <li><a href="#accel-precision" className="text-violet-300 hover:underline">Precision, Number Formats & Edge Cases</a></li>
              <li><a href="#accel-quickref" className="text-violet-300 hover:underline">Quick Reference (Key Factors)</a></li>
              <li><a href="#accel-faq" className="text-violet-300 hover:underline">FAQ</a></li>
              <li><a href="#accel-accessibility" className="text-violet-300 hover:underline">Accessibility & Keyboard Shortcuts</a></li>
              <li><a href="#accel-troubleshoot" className="text-violet-300 hover:underline">Troubleshooting & Tips</a></li>
              <li><a href="#accel-more" className="text-violet-300 hover:underline">More Tools & Cross-Links</a></li>
            </ol>
          </nav>
        
          {/* How to Use */}
          <h2 id="accel-how" className="text-2xl font-semibold text-violet-200 mt-10 mb-4">💡 How to Use</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter the numeric value under <strong>Value</strong>. Empty values count as <code>0</code>. The input supports commas like <code>1,234.56</code>.</li>
            <li>Pick your <strong>From</strong> unit and <strong>To</strong> unit. You can pin common units to the top via the <strong>Fav</strong> button.</li>
            <li>Use <strong>More options</strong> to set the number of decimals (0–12) and the output format (Normal, Compact, or Scientific).</li>
            <li>Export with <strong>Copy All</strong> (clipboard) or save a <strong>CSV</strong> file of the entire result grid.</li>
            <li>The tool stores your last 10 conversions locally so you can jump back to recent inputs with one click.</li>
          </ol>
          <p className="text-xs text-slate-400">Tip: The URL updates as you type. Bookmark or share it to reproduce the exact same state (value, units, format, and precision).</p>
        
          {/* Units & Factors */}
          <h2 id="accel-units" className="text-2xl font-semibold text-violet-200 mt-10 mb-4">🌐 Supported Units & Core Factors</h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
            <p className="mb-3">
              Internally, conversions are normalized to <strong>m/s²</strong>. Each unit is defined by a factor to m/s²:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li><strong>m/s²</strong> — base SI acceleration (factor: <code>1</code>).</li>
              <li><strong>g</strong> — standard gravity (factor: <code>9.80665 m/s²</code>).</li>
              <li><strong>Gal (cm/s²)</strong> — 1 Gal = <code>0.01 m/s²</code>.</li>
              <li><strong>ft/s²</strong> — 1 ft/s² = <code>0.3048 m/s²</code>.</li>
              <li><strong>in/s²</strong> — 1 in/s² = <code>0.0254 m/s²</code>.</li>
              <li><strong>km/h/s</strong> — 1 km/h/s = <code>1000/3600 ≈ 0.2777777778 m/s²</code>.</li>
              <li><strong>km/h²</strong> — 1 km/h² = <code>1000 / (3600²) ≈ 0.0000771604938 m/s²</code>.</li>
              <li><strong>mph/s</strong> — 1 mph/s = <code>0.44704 m/s²</code>.</li>
              <li><strong>knot/s</strong> — 1 knot/s ≈ <code>0.5144444444 m/s²</code>.</li>
            </ul>
            <p className="mt-3 text-slate-400 text-xs leading-relaxed">
              Note: These factors are constants for unit conversion only. Real-world acceleration values will depend on context (vehicle dynamics, vibration, gravity field, etc.).
            </p>
          </div>
        
          {/* Physics Background */}
          <h2 id="accel-physics" className="text-2xl font-semibold text-violet-200 mt-10 mb-4">📐 Physics Background (What Acceleration Means)</h2>
          <p>
            Acceleration is the rate of change of velocity with respect to time. In calculus terms, it’s the derivative of
            velocity and the second derivative of displacement: <code>a = dv/dt = d²x/dt²</code>. In everyday engineering,
            you often estimate it from finite differences: <code>a ≈ Δv/Δt</code>. Because velocity carries both magnitude
            and direction, acceleration is a vector as well. Positive and negative signs matter, as do axes when you move beyond 1-D.
          </p>
          <p className="mt-2">
            Standard kinematics under constant acceleration uses well-known relations:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><code>v = v₀ + a t</code></li>
            <li><code>x = x₀ + v₀ t + (1/2) a t²</code></li>
            <li><code>v² = v₀² + 2 a (x − x₀)</code></li>
          </ul>
          <p className="mt-2">
            In dynamics, Newton’s Second Law ties net force and acceleration via mass: <code>∑F = m a</code>.
            That relationship is why you see acceleration limits in structural design (to bound inertial loads),
            machine guarding (to reduce jerk), and human-centric standards (for comfort and safety).
          </p>
        
          {/* Gal and geophysics */}
          <h2 id="accel-gal" className="text-2xl font-semibold text-violet-200 mt-10 mb-4">🌎 About Gal (cm/s²) and Geophysics Use</h2>
          <p>
            The <strong>Gal</strong> (named after Galileo) is used extensively in geophysics and gravimetry to quantify small
            variations in the local gravitational field. Since <code>1 Gal = 0.01 m/s²</code>, microGal and milliGal scales
            are convenient for measuring subtle anomalies caused by density contrasts underground (e.g., ore bodies, voids,
            groundwater). If you work with seismometers or gravity surveys, converting between Gal and m/s² keeps your
            datasets consistent with mainstream engineering calculations.
          </p>
        
          {/* Worked Examples */}
          <h2 id="accel-examples" className="text-2xl font-semibold text-violet-200 mt-10 mb-4">📈 Worked Examples (rounded)</h2>
          <ul className="space-y-2">
            <li>
              <strong>Convert 3 m/s² to g:</strong> Divide by standard gravity, 9.80665. So 3 / 9.80665 ≈ <strong>0.305 g</strong>.
            </li>
            <li>
              <strong>Convert 0.5 g to m/s²:</strong> Multiply by 9.80665. So 0.5 × 9.80665 ≈ <strong>4.9033 m/s²</strong>.
            </li>
            <li>
              <strong>Convert 250 cm/s² to m/s²:</strong> Multiply by 0.01. So 250 × 0.01 = <strong>2.5 m/s²</strong>.
            </li>
            <li>
              <strong>Convert 1 mph/s to m/s²:</strong> Use 0.44704. So 1 × 0.44704 = <strong>0.44704 m/s²</strong>.
            </li>
            <li>
              <strong>Convert 5 km/h/s to m/s²:</strong> Multiply by 1000/3600 ≈ 0.2777777778. So 5 × 0.2777777778 ≈ <strong>1.3889 m/s²</strong>.
            </li>
            <li>
              <strong>Convert 1 km/h² to m/s²:</strong> Multiply by 1000/(3600²) ≈ 0.0000771604938. So ≈ <strong>7.716×10⁻⁵ m/s²</strong>.
            </li>
            <li>
              <strong>Convert 0.7 knot/s to m/s²:</strong> 0.7 × 0.5144444444 ≈ <strong>0.3601 m/s²</strong>.
            </li>
            <li>
              <strong>Convert 32.174 ft/s² to g:</strong> First to m/s²: 32.174 × 0.3048 ≈ 9.80665 m/s²; divide by 9.80665 → <strong>1 g</strong> (by design).
            </li>
          </ul>

          <AdBanner type="bottom" />
          {/* Engineering & Real-World Applications */}
          <h2 id="accel-engineering" className="text-2xl font-semibold text-violet-200 mt-10 mb-4">🛠️ Engineering & Real-World Applications</h2>
          <h3 className="text-lg font-semibold text-gray-100 mt-4">Automotive & Transportation</h3>
          <p>
            Vehicle dynamics teams use <strong>m/s²</strong> and <strong>g</strong> to characterize acceleration, braking,
            and lateral grip. <em>Launch control</em> tuning, <em>ABS/ESC</em> calibration, and <em>ride comfort</em> analyses
            often exchange data in mixed units (e.g., mph/s in legacy test plans). This converter lets you unify those
            measurements for simulation models and reports.
          </p>
          <h3 className="text-lg font-semibold text-gray-100 mt-4">Aerospace & Aviation</h3>
          <p>
            Flight loads, maneuver envelopes, and certification tests quote both <strong>g</strong> and <strong>m/s²</strong>.
            Avionics teams might receive acceleration data in <strong>knot/s</strong> when analyzing speed changes during takeoff,
            approach, or go-around. Having a reliable cross-unit map helps align telemetry, simulation outputs, and requirements.
          </p>
          <h3 className="text-lg font-semibold text-gray-100 mt-4">Civil & Structural Engineering</h3>
          <p>
            Structural designs must tolerate seismic and wind-induced accelerations. Peak ground acceleration (PGA) is
            often reported in fractions of <strong>g</strong> or in <strong>cm/s²</strong> (Gal). Converting to
            <strong>m/s²</strong> simplifies force calculations via <code>F = m a</code> for equipment anchorage and
            nonstructural components.
          </p>
          <h3 className="text-lg font-semibold text-gray-100 mt-4">Manufacturing, Robotics & Mechatronics</h3>
          <p>
            High-speed automation balances cycle time and mechanical stress. Excessive acceleration increases jerk,
            reduces tool life, and magnifies vibration. Engineers frequently toggle between <strong>in/s²</strong> for
            legacy machines and <strong>m/s²</strong> in modern motion controllers; this converter removes guesswork.
          </p>
          <h3 className="text-lg font-semibold text-gray-100 mt-4">Biomechanics & Human Factors</h3>
          <p>
            Wearables and sports science report impacts and motion in <strong>g</strong>. Converting back to
            <strong>m/s²</strong> offers a direct path into physics-based models (e.g., inverse dynamics), while
            keeping data readable for clinicians and coaches accustomed to g-levels.
          </p>
        
          {/* Precision, formats & edge cases */}
          <h2 id="accel-precision" className="text-2xl font-semibold text-violet-200 mt-10 mb-4">🎯 Precision, Number Formats & Edge Cases</h2>
          <p>
            The converter lets you set decimals from <strong>0</strong> to <strong>12</strong>. Choose a level that matches the
            quality and use of your data. For example, seismology and gravimetry often need small increments, so 6–8 decimals
            might be reasonable. For field tests with sensor noise, fewer decimals can prevent false precision.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Normal</strong> format shows standard numbers with your chosen decimals.</li>
            <li><strong>Compact</strong> uses <em>1.2K</em>, <em>3.4M</em>, etc., useful for dashboards.</li>
            <li><strong>Scientific</strong> displays <em>mantissa × 10^exponent</em>; ideal for very large or tiny values.</li>
          </ul>
          <p className="mt-2">
            For stability, the tool strips trailing zeros (except when Scientific is used) and handles extremely small/large
            values gracefully with scientific notation. Empty input is treated as <code>0</code> for convenience. If you prefer
            blanks to remain blank, set the value explicitly to <code>0</code> or provide a placeholder in your UI.
          </p>
        
          {/* Quick Reference */}
          <h2 id="accel-quickref" className="text-2xl font-semibold text-violet-200 mt-10 mb-4">🗂️ Quick Reference (Key Factors)</h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li>1 g = <strong>9.80665 m/s²</strong></li>
              <li>1 Gal (cm/s²) = <strong>0.01 m/s²</strong></li>
              <li>1 ft/s² = <strong>0.3048 m/s²</strong></li>
              <li>1 in/s² = <strong>0.0254 m/s²</strong></li>
              <li>1 km/h/s = <strong>0.2777777778 m/s²</strong></li>
              <li>1 km/h² ≈ <strong>7.71604938×10⁻⁵ m/s²</strong></li>
              <li>1 mph/s = <strong>0.44704 m/s²</strong></li>
              <li>1 knot/s ≈ <strong>0.5144444444 m/s²</strong></li>
            </ul>
          </div>
        
          {/* FAQ */}
          <h2 id="accel-faq" className="text-2xl font-semibold text-violet-200 mt-10 mb-4">❓ Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-violet-300">Is “g” a unit of acceleration or gravity?</h3>
              <p>
                In this converter, <strong>g</strong> means <em>standard gravity</em>, a fixed reference acceleration:
                <code>g₀ = 9.80665 m/s²</code>. Real gravitational acceleration varies slightly by location and altitude,
                but for unit conversions, g is treated as a constant factor.
              </p>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-violet-300">What’s the difference between km/h/s and km/h²?</h3>
              <p>
                Both represent acceleration, but <strong>km/h/s</strong> shows change in km/h per second (common in driving
                contexts), while <strong>km/h²</strong> expresses change in km/h per hour. They differ by a factor of 3600 in
                the time base, hence the very small conversion to m/s² for km/h².
              </p>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-violet-300">Why would I ever use Gal instead of m/s²?</h3>
              <p>
                Gal is convenient for geophysical scales and for expressing small differences in gravity. In that domain,
                milliGal (mGal) and microGal (μGal) are natural and easier to read than very small decimal fractions of m/s².
              </p>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-violet-300">How many decimals should I use?</h3>
              <p>
                Match the precision of your source data and the sensitivity of your conclusions. For high-fidelity sensors,
                4–6 decimals may be appropriate. For approximate calculations or noisy data, use fewer decimals to avoid false precision.
              </p>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-violet-300">Does the converter account for changing gravity by latitude?</h3>
              <p>
                No. For unit conversion, <strong>g</strong> is a constant reference. If your application depends on local gravity
                variations, convert units here and adjust your models separately with location-specific values.
              </p>
            </div>
          </div>
        
          {/* Accessibility & Shortcuts */}
          <h2 id="accel-accessibility" className="text-2xl font-semibold text-violet-200 mt-10 mb-4">♿ Accessibility & Keyboard Shortcuts</h2>
          <p>
            The live result region uses polite updates so screen readers are not overwhelmed. Labels and focus outlines are clear.
            Keyboard users can jump quickly with:
          </p>
          <ul className="list-disc list-inside">
            <li><kbd>/</kbd> — focus the Value field</li>
            <li><kbd>S</kbd> — focus the From selector</li>
            <li><kbd>T</kbd> — focus the To selector</li>
            <li><kbd>X</kbd> — swap From/To units</li>
          </ul>
          <p className="text-xs text-slate-400">
            Suggestion: if you embed this module in a larger page, ensure the surrounding landmarks (main, nav, footer) are properly defined to keep navigation predictable.
          </p>
        
          {/* Troubleshooting */}
          <h2 id="accel-troubleshoot" className="text-2xl font-semibold text-violet-200 mt-10 mb-4">🧩 Troubleshooting & Tips</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Unexpected “—” output?</strong> That symbol indicates a non-finite result (e.g., NaN). Check that your input is a valid number.</li>
            <li><strong>Too many digits?</strong> Reduce decimals, or switch to <em>Compact</em> or <em>Scientific</em> to keep values readable.</li>
            <li><strong>Need to share exact state?</strong> Copy the page URL; it encodes value, units, format, and precision.</li>
            <li><strong>Copy vs CSV?</strong> Use <em>Copy All</em> for quick pasting into chat or docs; use <em>CSV</em> for spreadsheets.</li>
            <li><strong>Rounding differences?</strong> Display rounding does not change the underlying calculation order; if absolute rounding is critical, export CSV and round in your analysis tool.</li>
          </ul>
        
          {/* Cross-Links & Author */}
          <h2 id="accel-more" className="text-2xl font-semibold text-violet-200 mt-10 mb-4">🚀 Explore More Tools</h2>
          <div className="mt-2 bg-gradient-to-r from-violet-900/30 via-indigo-900/30 to-fuchsia-900/30 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              Continue your workflow with these related converters on CalculatorHub:
            </p>
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
                to="/density-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-blue-600/20 text-blue-300 hover:text-blue-200 px-3 py-2 rounded-md border border-slate-700 hover:border-blue-500 transition-all duration-200"
              >
                🧊 Density Converter
              </Link>
            </div>
          </div>
        
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
          </section>
        </section>


        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/acceleration-converter" category="unit-converters" />
      </div>
    </>
  );
}
