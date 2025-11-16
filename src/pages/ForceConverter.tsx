import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from "react-router-dom";
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

/* ---------------- Icons (inline, no deps) ---------------- */
const Icon = {
  Force: (p: any) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      {/* A hand/arrow “push” mark */}
      <path d="M3 12h8" />
      <path d="M11 12l-2-2M11 12l-2 2" />
      <rect x="11.5" y="6.5" width="9" height="11" rx="2" />
      <path d="M13.5 9.5h5" />
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

/* ---------------- Units (factors are in NEWTONS, N) ----------------
   Notes:
   - kgf/gf use standard gravity g₀ = 9.80665 m/s²
   - lbf is exact by definition: 1 lbf = 4.4482216152605 N
--------------------------------------------------------------------- */
const FORCE_UNITS = [
  // SI / multiples
  { key: 'mN',   name: 'Millinewton (mN)', factor: 1e-3 },
  { key: 'N',    name: 'Newton (N)',       factor: 1 },
  { key: 'kN',   name: 'Kilonewton (kN)',  factor: 1e3 },
  { key: 'MN',   name: 'Meganewton (MN)',  factor: 1e6 },
  { key: 'sn',   name: 'Stène (sn)',       factor: 1e3 },                   // 1 sn = 1000 N

  // CGS
  { key: 'dyn',  name: 'Dyne (dyn)',       factor: 1e-5 },                  // 1 dyn = 1e-5 N
  { key: 'gf',   name: 'Gram-force (gf/p)',factor: 9.80665e-3 },            // 1 gf = 0.00980665 N
  { key: 'kgf',  name: 'Kilogram-force (kgf)', factor: 9.80665 },           // 1 kgf = 9.80665 N
  { key: 'tf',   name: 'Tonne-force (metric tf)', factor: 9806.65 },        // 1000 kgf

  // Avoirdupois / US-UK
  { key: 'ozf',  name: 'Ounce-force (ozf)', factor: 4.4482216152605 / 16 }, // 1 ozf = 1/16 lbf
  { key: 'lbf',  name: 'Pound-force (lbf)', factor: 4.4482216152605 },
  { key: 'kip',  name: 'Kip (1000 lbf)',    factor: 4448.2216152605 },
  { key: 'ustf', name: 'US ton-force (short)', factor: 8896.443230521 },     // 2000 lbf
  { key: 'lttf', name: 'UK ton-force (long)',  factor: 9964.016418183 },     // 2240 lbf
];

const unitMap: Record<string, {key:string; name:string; factor:number}> =
  Object.fromEntries(FORCE_UNITS.map(u => [u.key, u]));
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
  // value[from]*factor[from] = N;  N / factor[to] = value[to]
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
export default function ForceConverter() {
  const [valueStr, setValueStr] = useState('');
  const [fromUnit, setFromUnit] = useState('N');
  const [toUnit, setToUnit] = useState('lbf');
  const [formatMode, setFormatMode] = useState<typeof FORMAT_MODES[number]>('normal');
  const [precision, setPrecision] = useState(6);
  const [favorites, setFavorites] = useLocalStorage<string[]>('force:favorites', ['N','kN','lbf','kgf','ozf','tf']);
  const [history, setHistory] = useLocalStorage<any[]>('force:history', []);

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
    const baseN = valueNum * (unitMap[fromUnit]?.factor || 1);
    const out: Record<string, number> = {};
    for (const u of FORCE_UNITS) if (u.key !== fromUnit) out[u.key] = baseN / u.factor;
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
        a.href = url; a.download = 'force-conversion.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
      }
    } catch {}
  }

  const favored = FORCE_UNITS.filter(u => favorites.includes(u.key));
  const unfavored = FORCE_UNITS.filter(u => !favorites.includes(u.key));
  const hasInput = (valueStr || '').trim() !== '';

  return (
    <>
      {/** ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Force Converter — N ⇄ kN ⇄ MN ⇄ lbf ⇄ ozf ⇄ kgf ⇄ kip ⇄ ton-force"
        description="Convert force units instantly: newton (N), kilonewton (kN), meganewton (MN), dyne, pound-force (lbf), ounce-force (ozf), kilogram-force (kgf), kip, and ton-force. Includes precision control, Normal/Compact/Scientific formats, favorites, history, CSV export, and shareable URLs."
        keywords={[
          "force converter",
          "N to lbf",
          "lbf to N",
          "kN to kip",
          "kgf to N",
          "N to kgf",
          "dyne to N",
          "ozf to N",
          "ton force to kN",
          "kip to kN",
          "meganewton to kilonewton",
          "ounce force to pound force",
          "gram force to newton",
          "stene to newton",
          "us ton force",
          "uk long ton force"
        ]}
        canonical="https://calculatorhub.site/force-converter"
        schemaData={[
          /* 1) WebPage + Article */
          {
            "@context":"https://schema.org",
            "@type":"WebPage",
            "@id":"https://calculatorhub.site/force-converter#webpage",
            "url":"https://calculatorhub.site/force-converter",
            "name":"Force Converter — N, kN, MN, dyne, lbf, ozf, kgf, kip, ton-force",
            "inLanguage":"en",
            "isPartOf":{"@id":"https://calculatorhub.site/#website"},
            "primaryImageOfPage":{
              "@type":"ImageObject",
              "@id":"https://calculatorhub.site/images/force-converter-hero.webp#primaryimg",
              "url":"https://calculatorhub.site/images/force-converter-hero.webp",
              "width":1200,"height":675
            },
            "mainEntity":{
              "@type":"Article",
              "@id":"https://calculatorhub.site/force-converter#article",
              "headline":"Force Converter — Engineering & Scientific Units",
              "description":"Convert between N, kN, MN, dyne, lbf, ozf, kgf, kip, and ton-force. Features precision/format controls, keyboard shortcuts, favorites, history, copy/CSV export, and shareable links.",
              "image":["https://calculatorhub.site/images/force-converter-hero.webp"],
              "author":{"@type":"Organization","name":"CalculatorHub","url":"https://calculatorhub.site"},
              "publisher":{"@id":"https://calculatorhub.site/#organization"},
              "datePublished":"2025-11-09",
              "dateModified":"2025-11-09",
              "mainEntityOfPage":{"@id":"https://calculatorhub.site/force-converter#webpage"},
              "articleSection":[
                "Supported Units",
                "Engineering vs CGS vs Avoirdupois",
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
            "@id":"https://calculatorhub.site/force-converter#breadcrumbs",
            "itemListElement":[
              {"@type":"ListItem","position":1,"name":"Home","item":"https://calculatorhub.site/"},
              {"@type":"ListItem","position":2,"name":"Unit Converters","item":"https://calculatorhub.site/category/unit-converters"},
              {"@type":"ListItem","position":3,"name":"Force Converter","item":"https://calculatorhub.site/force-converter"}
            ]
          },
      
          /* 3) FAQ */
          {
            "@context":"https://schema.org",
            "@type":"FAQPage",
            "@id":"https://calculatorhub.site/force-converter#faq",
            "mainEntity":[
              {
                "@type":"Question",
                "name":"How do you convert newton (N) to pound-force (lbf)?",
                "acceptedAnswer":{"@type":"Answer","text":"Use the exact definition 1 lbf = 4.4482216152605 N. Divide newtons by 4.4482216152605 to get lbf; multiply lbf by this value to get N."}
              },
              {
                "@type":"Question",
                "name":"What is kilogram-force (kgf) and gram-force (gf)?",
                "acceptedAnswer":{"@type":"Answer","text":"They are gravitational units based on standard gravity g₀ = 9.80665 m/s². 1 kgf = 9.80665 N and 1 gf = 0.00980665 N."}
              },
              {
                "@type":"Question",
                "name":"What is a kip?",
                "acceptedAnswer":{"@type":"Answer","text":"A kip is 1,000 lbf (≈ 4,448.221615 N). It’s common in structural engineering in the US."}
              },
              {
                "@type":"Question",
                "name":"What is a dyne?",
                "acceptedAnswer":{"@type":"Answer","text":"A CGS unit of force: 1 dyne = 10⁻⁵ N."}
              },
              {
                "@type":"Question",
                "name":"Do you support CSV export and copy?",
                "acceptedAnswer":{"@type":"Answer","text":"Yes. Use Copy All for clipboard output or save the entire results grid as a CSV."}
              }
            ]
          },
      
          /* 4) WebApplication */
          {
            "@context":"https://schema.org",
            "@type":"WebApplication",
            "@id":"https://calculatorhub.site/force-converter#webapp",
            "name":"Force Converter",
            "url":"https://calculatorhub.site/force-converter",
            "applicationCategory":"UtilitiesApplication",
            "operatingSystem":"Web",
            "description":"Instant conversion among engineering, CGS, and Avoirdupois force units with shareable links and CSV.",
            "publisher":{"@id":"https://calculatorhub.site/#organization"},
            "image":["https://calculatorhub.site/images/force-converter-hero.webp"]
          },
      
          /* 5) SoftwareApplication */
          {
            "@context":"https://schema.org",
            "@type":"SoftwareApplication",
            "@id":"https://calculatorhub.site/force-converter#software",
            "name":"Advanced Force Converter",
            "applicationCategory":"UtilitiesApplication",
            "operatingSystem":"All",
            "url":"https://calculatorhub.site/force-converter",
            "publisher":{"@id":"https://calculatorhub.site/#organization"},
            "description":"Interactive converter for N, kN, MN, dyne, lbf, ozf, kgf, kip, and ton-force."
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
      <link rel="canonical" href="https://calculatorhub.site/force-converter" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/force-converter" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/force-converter" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/force-converter" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Force Converter — N, kN, MN, dyne, lbf, ozf, kgf, kip, ton-force" />
      <meta property="og:description" content="Fast, precise force conversions with Normal/Compact/Scientific formats, favorites, history, and CSV export." />
      <meta property="og:url" content="https://calculatorhub.site/force-converter" />
      <meta property="og:image" content="https://calculatorhub.site/images/force-converter-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Force converter UI showing N ↔ lbf and kN ↔ kip conversions" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Force Converter — N↔lbf, kN↔kip, dyne, kgf, ton-force" />
      <meta name="twitter:description" content="Engineer-ready force conversions with precision controls and CSV export." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/force-converter-hero.webp" />
      <meta name="twitter:creator" content="@CalculatorHub" />
      <meta name="twitter:site" content="@CalculatorHub" />
      
      {/** PWA & theme */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#00141a" />
      
      {/** Performance */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="preload" as="image" href="/images/force-converter-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />


      <div className="max-w-5xl mx-auto text-gray-200">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Force Converter', url: '/force-converter' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 rounded-2xl p-6 bg-gradient-to-r from-sky-900 via-cyan-900 to-emerald-900 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">Force Converter (Advanced)</h1>
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
                  className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  aria-label="Enter force value"
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
            {(fromUnit === 'kgf' || toUnit === 'kgf' || fromUnit === 'gf' || toUnit === 'gf') && (
              <div className="mt-2 text-xs text-cyan-200/80">
                Note: kgf/gf use standard gravity g₀ = 9.80665 m/s².
              </div>
            )}
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
            {FORCE_UNITS.map((unit) => {
              if (unit.key === fromUnit) return null;
              const val = gridResults[unit.key];
              const display = formatNumber(val ?? 0, formatMode, precision);
              return (
                <div key={unit.key} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:bg-gray-700/70 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon.Force style={{ width: 16, height: 16, color: '#22d3ee' }} />
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
        {/* ==================== SEO Content: Force Converter (EN) ==================== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          <header className="mb-10">
            <h1 className="text-3xl font-bold text-cyan-300">Force Converter — N, kN, MN, dyne, lbf, ozf, kgf, kip, ton-force</h1>
            <p className="mt-2 text-slate-300">
              Convert force units instantly for structural, mechanical, and lab workflows. This tool supports
              <strong> SI</strong> (N, kN, MN), <strong>CGS</strong> (dyne), <strong>gravitational</strong> (kgf, gf, tf),
              and <strong>Avoirdupois</strong> (lbf, ozf, kip, ton-force) systems. Tweak decimals, switch Normal/Compact/Scientific
              formats, favorite units, review recent runs, and export the full grid via Copy or CSV. Shareable URLs preserve state.
            </p>
          </header>
        
          {/* TOC */}
          <nav className="mt-2 mb-10 bg-[#071b1f] border border-[#12333b] rounded-xl p-5 text-slate-200">
            <h2 className="text-lg font-semibold text-gray-100 mb-3">📖 Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><a href="#en-how" className="text-cyan-300 hover:underline">How to Use</a></li>
              <li><a href="#en-units" className="text-cyan-300 hover:underline">Supported Units & Constants</a></li>
              <li><a href="#en-notes" className="text-cyan-300 hover:underline">Engineering Notes (mass vs force)</a></li>
              <li><a href="#en-examples" className="text-cyan-300 hover:underline">Worked Examples</a></li>
              <li><a href="#en-quickref" className="text-cyan-300 hover:underline">Quick Reference</a></li>
              <li><a href="#en-faq" className="text-cyan-300 hover:underline">FAQ</a></li>
            </ol>
          </nav>
        
          {/* How to use */}
          <h2 id="en-how" className="text-2xl font-semibold text-cyan-200 mt-10 mb-4">💡 How to Use</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter a number in <strong>Value</strong> (empty = 0; commas like <code>1,234.56</code> allowed).</li>
            <li>Select <strong>From</strong> and <strong>To</strong> units (pin frequent ones with <strong>Fav</strong>).</li>
            <li>Open <strong>More options</strong> to adjust <strong>Precision</strong> (0–12) and <strong>Format</strong>.</li>
            <li>Use <strong>Copy All</strong> or <strong>CSV</strong> to export the results grid.</li>
            <li>Use <strong>Recent</strong> to recall your last 10 conversions (stored locally).</li>
          </ol>
          <p className="text-xs text-slate-400">The URL encodes your current selection—bookmark or share for exact reproduction.</p>
        
          {/* Units */}
          <h2 id="en-units" className="text-2xl font-semibold text-cyan-200 mt-10 mb-4">🌐 Supported Units & Constants</h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li><strong>SI:</strong> mN, N, kN, MN</li>
              <li><strong>MKS historic:</strong> Sthène (sn) = 1000 N</li>
              <li><strong>CGS:</strong> Dyne (dyn) = 10⁻⁵ N</li>
              <li><strong>Gravitational:</strong> gf, kgf, tf (using g₀ = 9.80665 m/s²)</li>
              <li><strong>Avoirdupois:</strong> ozf, lbf, kip (1000 lbf), US/UK ton-force</li>
            </ul>
            <p className="mt-3 text-slate-400 text-xs leading-relaxed">
              Exact/standard factors used: 1 lbf = <strong>4.4482216152605 N</strong>; 1 ozf = lbf/16; 1 kip = 1000 lbf;
              1 gf = <strong>0.00980665 N</strong>; 1 kgf = <strong>9.80665 N</strong>; 1 tf = <strong>9806.65 N</strong>;
              1 US ton-force = <strong>8896.443230521 N</strong>; 1 UK ton-force = <strong>9964.016418183 N</strong>;
              1 sn (sthène) = <strong>1000 N</strong>.
            </p>
          </div>
        
          {/* Engineering notes */}
          <h2 id="en-notes" className="text-2xl font-semibold text-cyan-200 mt-10 mb-4">📐 Engineering Notes (mass vs force)</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Force ≠ mass:</strong> N and lbf are force; kg and lb are mass. kgf/gf are force units defined via standard gravity <code>g₀ = 9.80665 m/s²</code>.</li>
            <li><strong>Audit trails:</strong> When reporting “tons,” specify type (metric tf vs US/UK ton-force) to avoid ambiguity.</li>
            <li><strong>Structural loads:</strong> kN and kip are common in design tables; lock your precision to match code requirements.</li>
          </ul>
        
          {/* Examples */}
          <h2 id="en-examples" className="text-2xl font-semibold text-cyan-200 mt-10 mb-4">📈 Worked Examples (rounded)</h2>
          <ul className="space-y-2">
            <li><strong>1 kN → lbf</strong>: 1000 ÷ 4.4482216152605 ≈ <strong>224.809 lbf</strong></li>
            <li><strong>500 lbf → kN</strong>: 500 × 4.4482216152605 ÷ 1000 ≈ <strong>2.22411 kN</strong></li>
            <li><strong>1 tf → kN</strong>: 9806.65 ÷ 1000 = <strong>9.80665 kN</strong></li>
            <li><strong>2500 N → kgf</strong>: 2500 ÷ 9.80665 ≈ <strong>254.94 kgf</strong></li>
            <li><strong>1 kip → kN</strong>: (1000 × 4.4482216152605) ÷ 1000 ≈ <strong>4.44822 kN</strong></li>
          </ul>
          <AdBanner type="bottom" />
        
          {/* Quick Reference */}
          <h2 id="en-quickref" className="text-2xl font-semibold text-cyan-200 mt-10 mb-4">🗂️ Quick Reference</h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li>1 N = <strong>10⁵ dyn</strong></li>
              <li>1 kN = <strong>1000 N</strong></li>
              <li>1 MN = <strong>10⁶ N</strong></li>
              <li>1 lbf = <strong>4.4482216152605 N</strong></li>
              <li>1 ozf = <strong>lbf/16</strong></li>
              <li>1 kip = <strong>1000 lbf</strong></li>
              <li>1 kgf = <strong>9.80665 N</strong></li>
              <li>1 tf = <strong>9806.65 N</strong></li>
              <li>1 US ton-force = <strong>8896.443230521 N</strong></li>
              <li>1 UK ton-force = <strong>9964.016418183 N</strong></li>
              <li>1 sthène (sn) = <strong>1000 N</strong></li>
            </ul>
          </div>
        
          {/* FAQ */}
          <h2 id="en-faq" className="text-2xl font-semibold text-cyan-200 mt-10 mb-4">❓ Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-cyan-300">How do I convert N to lbf?</h3>
              <p>Use the exact definition 1 lbf = 4.4482216152605 N. So lbf = N ÷ 4.4482216152605.</p>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-cyan-300">What are kgf and gf?</h3>
              <p>Gravitational force units defined via standard gravity g₀. 1 kgf = 9.80665 N; 1 gf = 0.00980665 N.</p>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-cyan-300">What’s a kip?</h3>
              <p>Structural unit equal to 1000 lbf (≈ 4.448 kN). Common in US design documents.</p>
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
                  Specialists in engineering conversions. Last updated:
                  <time dateTime="2025-11-09"> November 9, 2025</time>.
                </p>
              </div>
            </div>
        
            <div className="mt-8 bg-gradient-to-r from-sky-900/30 via-cyan-900/30 to-emerald-900/30 rounded-lg border border-slate-700 shadow-inner p-4">
              <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">🚀 Explore more tools on CalculatorHub:</p>
              <div className="flex flex-wrap gap-3 text-sm">
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
                <Link
                  to="/mass-weight-converter"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-200 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
                >
                  ⚖️ Mass / Weight Converter
                </Link>
              </div>
            </div>
          </section>
        </section>


        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/force-converter" category="unit-converters" />
      </div>
    </>
  );
}
