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
  Weight: (p: any) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 6a4 4 0 1 1 8 0" />
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M7 10h10M6 14h12" />
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

/* ---------------- Units (factors are in KILOGRAMS, kg) ---------------- */
const MASS_UNITS = [
  // SI / metric
  { key: 'µg',   name: 'Microgram (µg)',      factor: 1e-9 },
  { key: 'mg',   name: 'Milligram (mg)',      factor: 1e-6 },
  { key: 'g',    name: 'Gram (g)',            factor: 1e-3 },
  { key: 'kg',   name: 'Kilogram (kg)',       factor: 1 },
  { key: 't',    name: 'Metric ton / Tonne (t)', factor: 1e3 },

  // Jewelry / small masses
  { key: 'ct',   name: 'Carat (ct)',          factor: 0.0002 },              // 1 ct = 0.2 g
  { key: 'gr',   name: 'Grain (gr)',          factor: 0.00006479891 },       // 64.79891 mg

  // Avoirdupois (US/UK common)
  { key: 'oz',   name: 'Ounce (oz)',          factor: 0.028349523125 },      // exact via lb
  { key: 'lb',   name: 'Pound (lb)',          factor: 0.45359237 },          // exact
  { key: 'st',   name: 'Stone (st)',          factor: 6.35029318 },          // 14 lb
  { key: 'USTon',name: 'US short ton (ton)',  factor: 907.18474 },           // 2000 lb
  { key: 'LTTon',name: 'UK long ton (ton)',   factor: 1016.0469088 },        // 2240 lb

  // Engineering
  { key: 'slug', name: 'Slug (slug)',         factor: 14.59390294 },
];
const unitMap: Record<string, {key:string; name:string; factor:number}> =
  Object.fromEntries(MASS_UNITS.map(u => [u.key, u]));
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
  // value[from]*factor[from] = kg;  kg / factor[to] = value[to]
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
export default function MassWeightConverter() {
  const [valueStr, setValueStr] = useState('');
  const [fromUnit, setFromUnit] = useState('kg');
  const [toUnit, setToUnit] = useState('lb');
  const [formatMode, setFormatMode] = useState<typeof FORMAT_MODES[number]>('normal');
  const [precision, setPrecision] = useState(6);
  const [favorites, setFavorites] = useLocalStorage<string[]>('mass:favorites', ['g','kg','t','oz','lb','st']);
  const [history, setHistory] = useLocalStorage<any[]>('mass:history', []);

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
    const baseKg = valueNum * (unitMap[fromUnit]?.factor || 1);
    const out: Record<string, number> = {};
    for (const u of MASS_UNITS) if (u.key !== fromUnit) out[u.key] = baseKg / u.factor;
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
    setFavorites(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k].slice(0, 6));
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
        a.href = url; a.download = 'mass-weight-conversion.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
      }
    } catch {}
  }

  const favored = MASS_UNITS.filter(u => favorites.includes(u.key));
  const unfavored = MASS_UNITS.filter(u => !favorites.includes(u.key));
  const hasInput = (valueStr || '').trim() !== '';

  return (
    <>
      {/** ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Mass / Weight Converter — kg ⇄ lb, g ⇄ oz, stone, tons | 2025–2026"
        description="Fast, accurate mass & weight conversions: kg, g, t, lb, oz, stone, US short ton, UK long ton, microgram, carat, grain, and slug. Precision controls, Normal/Compact/Scientific formats, favorites, history, CSV export, and shareable URLs."
        keywords={[
          "mass converter",
          "weight converter",
          "kg to lb",
          "lb to kg",
          "g to oz",
          "oz to g",
          "stone to kg",
          "ton to kg",
          "US short ton vs UK long ton",
          "carat to gram",
          "grain to gram",
          "slug to kg",
          "metric to imperial weight",
          "unit converter mass"
        ]}
        canonical="https://calculatorhub.site/mass-weight-converter"
        schemaData={[
          /* 1) WebPage + Article */
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://calculatorhub.site/mass-weight-converter#webpage",
            "url": "https://calculatorhub.site/mass-weight-converter",
            "name": "Mass / Weight Converter — kg, g, lb, oz, stone, tons",
            "inLanguage": "en",
            "isPartOf": { "@id": "https://calculatorhub.site/#website" },
            "primaryImageOfPage": {
              "@type": "ImageObject",
              "@id": "https://calculatorhub.site/images/mass-weight-converter-hero.webp#primaryimg",
              "url": "https://calculatorhub.site/images/mass-weight-converter-hero.webp",
              "width": 1200,
              "height": 675
            },
            "mainEntity": {
              "@type": "Article",
              "@id": "https://calculatorhub.site/mass-weight-converter#article",
              "headline": "Mass / Weight Converter — Fast, Accurate, Shareable",
              "description": "Convert between metric and imperial units (kg, g, t, lb, oz, stone, tons) with precision controls, favorites, history, keyboard shortcuts, and CSV export.",
              "image": ["https://calculatorhub.site/images/mass-weight-converter-hero.webp"],
              "author": { "@type": "Organization", "name": "CalculatorHub", "url": "https://calculatorhub.site" },
              "publisher": { "@id": "https://calculatorhub.site/#organization" },
              "datePublished": "2025-11-09",
              "dateModified": "2025-11-09",
              "mainEntityOfPage": { "@id": "https://calculatorhub.site/mass-weight-converter#webpage" },
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
            "@id": "https://calculatorhub.site/mass-weight-converter#breadcrumbs",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://calculatorhub.site/" },
              { "@type": "ListItem", "position": 2, "name": "Unit Converters", "item": "https://calculatorhub.site/category/unit-converters" },
              { "@type": "ListItem", "position": 3, "name": "Mass / Weight Converter", "item": "https://calculatorhub.site/mass-weight-converter" }
            ]
          },
      
          /* 3) FAQ */
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://calculatorhub.site/mass-weight-converter#faq",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What’s the difference between mass and weight?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Mass is the amount of matter (kg, g); weight is the force due to gravity (newtons). Everyday scales infer mass from weight assuming standard gravity."
                }
              },
              {
                "@type": "Question",
                "name": "How many pounds are in a kilogram?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "1 kilogram = 2.20462262185 pounds (exact via 0.45359237 kg per pound)."
                }
              },
              {
                "@type": "Question",
                "name": "Stone vs pounds vs kilograms?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "1 stone = 14 lb = 6.35029318 kg. Common in the UK/Ireland for body mass."
                }
              },
              {
                "@type": "Question",
                "name": "US short ton vs UK long ton vs metric ton?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "US short ton = 2000 lb = 907.18474 kg; UK long ton = 2240 lb = 1016.0469088 kg; metric ton (tonne) = 1000 kg."
                }
              },
              {
                "@type": "Question",
                "name": "What are carat and grain used for?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Carat (ct) is used in gemstones: 1 ct = 0.2 g. Grain (gr) is 64.79891 mg, used in ballistics and precious metals."
                }
              }
            ]
          },
      
          /* 4) WebApplication */
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://calculatorhub.site/mass-weight-converter#webapp",
            "name": "Mass / Weight Converter",
            "url": "https://calculatorhub.site/mass-weight-converter",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web",
            "description": "Convert mass and weight units with precision controls, favorites, history, keyboard shortcuts, and CSV export.",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "image": ["https://calculatorhub.site/images/mass-weight-converter-hero.webp"]
          },
      
          /* 5) SoftwareApplication */
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://calculatorhub.site/mass-weight-converter#software",
            "name": "Advanced Mass / Weight Converter",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "All",
            "url": "https://calculatorhub.site/mass-weight-converter",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "description": "Interactive converter for metric and imperial mass units with shareable links and CSV export."
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
      <link rel="canonical" href="https://calculatorhub.site/mass-weight-converter" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/mass-weight-converter" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/mass-weight-converter" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/mass-weight-converter" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Mass / Weight Converter — kg ⇄ lb, g ⇄ oz, stone, tons" />
      <meta property="og:description" content="Convert kg, g, t, lb, oz, stone, tons with precision. Normal/Compact/Scientific formats, favorites, history, CSV." />
      <meta property="og:url" content="https://calculatorhub.site/mass-weight-converter" />
      <meta property="og:image" content="https://calculatorhub.site/images/mass-weight-converter-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Mass and weight converter UI showing kg ↔ lb and g ↔ oz" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mass / Weight Converter — kg ⇄ lb, g ⇄ oz, stone, tons" />
      <meta name="twitter:description" content="Metric ⇄ Imperial converter with precision controls, favorites, history, CSV." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/mass-weight-converter-hero.webp" />
      <meta name="twitter:creator" content="@CalculatorHub" />
      <meta name="twitter:site" content="@CalculatorHub" />
      
      {/** PWA & theme */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#06281e" />
      
      {/** Performance */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="preload" as="image" href="/images/mass-weight-converter-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />


      <div className="max-w-5xl mx-auto text-gray-200">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Mass / Weight Converter', url: '/mass-weight-converter' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 rounded-2xl p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-cyan-900 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">Mass / Weight Converter (Advanced)</h1>
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
                  className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  aria-label="Enter mass/weight value"
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
            {MASS_UNITS.map((unit) => {
              if (unit.key === fromUnit) return null;
              const val = gridResults[unit.key];
              const display = formatNumber(val ?? 0, formatMode, precision);
              return (
                <div key={unit.key} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:bg-gray-700/70 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon.Weight style={{ width: 16, height: 16, color: '#34d399' }} />
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
        {/* ================= SEO Content Section (~1800–2000 words) ==================== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
        
          {/* ===== Table of Contents ===== */}
          <nav className="mt-2 mb-10 bg-[#0b1a16] border border-[#1a2f28] rounded-xl p-5 text-slate-200">
            <h2 className="text-lg font-semibold text-gray-100 mb-3">📖 Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><a href="#overview" className="text-emerald-300 hover:underline">Overview: Why this Mass / Weight Converter?</a></li>
              <li><a href="#how-to-use" className="text-emerald-300 hover:underline">How to Use</a></li>
              <li><a href="#units" className="text-emerald-300 hover:underline">Supported Units (Metric, Imperial & Specialty)</a></li>
              <li><a href="#method" className="text-emerald-300 hover:underline">Accurate Conversion Method (kg-based)</a></li>
              <li><a href="#precision-format" className="text-emerald-300 hover:underline">Precision & Number Formats</a></li>
              <li><a href="#keyboard" className="text-emerald-300 hover:underline">Keyboard Shortcuts & Workflow</a></li>
              <li><a href="#examples" className="text-emerald-300 hover:underline">Worked Examples</a></li>
              <li><a href="#use-cases" className="text-emerald-300 hover:underline">Use Cases</a></li>
              <li><a href="#accuracy" className="text-emerald-300 hover:underline">Accuracy, Rounding & Best Practices</a></li>
              <li><a href="#pitfalls" className="text-emerald-300 hover:underline">Common Pitfalls to Avoid</a></li>
              <li><a href="#quick-ref" className="text-emerald-300 hover:underline">Quick Reference</a></li>
              <li><a href="#glossary" className="text-emerald-300 hover:underline">Glossary</a></li>
              <li><a href="#faq" className="text-emerald-300 hover:underline">FAQ</a></li>
            </ol>
          </nav>
        
          {/* ===== Overview ===== */}
          <h1 id="overview" className="text-3xl font-bold text-emerald-300 mb-6">
            Mass / Weight Converter — kg, g, lb, oz, stone, tons — fast & precise
          </h1>
        
          <p>
            Whether you’re shipping goods, logging gym progress, scaling kitchen recipes, or reading engineering specs,
            mass and weight units pop up everywhere. This converter handles <strong>metric</strong> (µg, mg, g, kg, t),
            <strong>imperial/US customary</strong> (oz, lb, stone, short ton, long ton), plus specialty units like
            <strong>carat</strong>, <strong>grain</strong>, and <strong>slug</strong>. You get <strong>precision control</strong>,
            three <strong>display formats</strong> (Normal/Compact/Scientific), <strong>Favorites</strong>, <strong>History</strong>,
            <strong>Copy/CSV export</strong>, and <strong>shareable URLs</strong> for seamless collaboration.
          </p>
        
          <p>
            Internally, everything is normalized to <strong>kilograms (kg)</strong>, the SI base unit of mass.
            Conversions then fan out to your selected target unit with reliable, round-trip-safe math.
          </p>
        
          <figure className="my-8">
            <img
              src="/images/mass-weight-converter-hero.webp"
              alt="Mass & Weight Converter UI with metric and imperial units"
              title="Mass / Weight Converter — kg ⇄ lb, g ⇄ oz, stone, tons"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Convert between everyday units (kg, g, lb, oz) and professional units (stone, tons, carat, grain, slug) with one click.
            </figcaption>
          </figure>
        
          {/* ===== How to Use ===== */}
          <h2 id="how-to-use" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">💡 How to Use</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter a number in the <strong>Value</strong> field (empty = 0; commas like <code>1,234.56</code> are fine).</li>
            <li>Select <strong>From</strong> and <strong>To</strong> units. Pin frequent ones with <strong>Favorites</strong>.</li>
            <li>Open <strong>More options</strong> to set <strong>Precision</strong> (0–12) and choose <strong>Format</strong> (Normal/Compact/Scientific).</li>
            <li>Use <strong>Copy All</strong> for the full grid, or export a <strong>CSV</strong> for spreadsheets and reports.</li>
            <li>Jump back to earlier tasks via <strong>Recent</strong> (stores your last 10 conversions locally).</li>
          </ol>
          <p className="text-sm text-slate-400">
            The page URL encodes your current settings—bookmark or share to reproduce the exact view.
          </p>
        
          {/* ===== Units ===== */}
          <h2 id="units" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">
            🌐 Supported Units (Metric, Imperial & Specialty)
          </h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li><strong>Metric (SI)</strong>: µg, mg, g, kg, tonne (t).</li>
              <li><strong>Imperial/US</strong>: ounce (oz), pound (lb), stone (st), US short ton, UK long ton.</li>
              <li><strong>Specialty</strong>: carat (ct) for gemstones, grain (gr) for ballistics/metals, slug (slug) in engineering.</li>
            </ul>
            <p className="mt-2 text-slate-400 text-xs">
              Reference factors (exact by definition where applicable): 1 lb = 0.45359237 kg; 1 oz = 1/16 lb; 1 st = 14 lb;
              1 short ton = 2000 lb; 1 long ton = 2240 lb; 1 ct = 0.2 g; 1 gr = 64.79891 mg; 1 slug ≈ 14.59390294 kg.
            </p>
          </div>
        
          {/* ===== Method ===== */}
          <h2 id="method" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">📐 Accurate Conversion Method (kg-based)</h2>
          <p>
            To avoid cumulative rounding and cross-system errors, each conversion uses a two-step kg bridge:
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li><strong>Normalize to kg</strong>: <code>value_kg = value × factor(from → kg)</code>.</li>
            <li><strong>Convert to target</strong>: <code>value_target = value_kg ÷ factor(to → kg)</code>.</li>
          </ol>
          <p>
            This pathway guarantees consistency across metric ⇄ imperial and among specialty units like carat, grain, and slug.
          </p>
        
          {/* ===== Precision & Formats ===== */}
          <h2 id="precision-format" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">🎯 Precision & Number Formats</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Precision</strong>: 0–2 for logistics/labels, 3–6 for fitness/culinary/retail, 6–12 for science/engineering.</li>
            <li><strong>Normal</strong>: Clean decimal output (trims trailing zeros).</li>
            <li><strong>Compact</strong>: Friendly for large/small values (e.g., 1.2K, 3.4M where relevant).</li>
            <li><strong>Scientific</strong>: Ideal for micrograms, grains, or very large tonnages.</li>
          </ul>
        
          {/* ===== Keyboard Shortcuts ===== */}
          <h2 id="keyboard" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">⌨️ Keyboard Shortcuts & Workflow</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><kbd>/</kbd> — focus the <strong>Value</strong> input.</li>
            <li><kbd>S</kbd> — focus <strong>From</strong> unit; <kbd>T</kbd> — focus <strong>To</strong> unit.</li>
            <li><kbd>X</kbd> — <strong>Swap</strong> From/To instantly.</li>
          </ul>
          <p>Pin everyday units (kg, g, lb, oz) with <strong>Favorites</strong> and fly through repeat workflows.</p>
        
          {/* ===== Worked Examples ===== */}
          <h2 id="examples" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">📈 Worked Examples (rounded for readability)</h2>
          <ul className="space-y-2">
            <li><strong>1 kg → lb</strong>: 1 ÷ 0.45359237 ≈ <strong>2.20462262 lb</strong>.</li>
            <li><strong>10 lb → kg</strong>: 10 × 0.45359237 = <strong>4.5359237 kg</strong>.</li>
            <li><strong>500 g → oz</strong>: 0.5 kg ÷ (0.45359237/16) ≈ <strong>17.637 oz</strong>.</li>
            <li><strong>32 oz → g</strong>: 32 oz = 2 lb = 0.90718474 kg = <strong>907.18474 g</strong>.</li>
            <li><strong>70 kg → st</strong>: 70 ÷ 6.35029318 ≈ <strong>11.02 st</strong>.</li>
            <li><strong>1 t (tonne) → short ton</strong>: 1000 kg ÷ 907.18474 ≈ <strong>1.1023 short tons</strong>.</li>
            <li><strong>1 long ton → kg</strong>: <strong>1016.0469088 kg</strong> (exact).</li>
            <li><strong>5 ct → g</strong>: 5 × 0.2 g = <strong>1 g</strong>.</li>
            <li><strong>150 gr → g</strong>: 150 × 0.06479891 g ≈ <strong>9.7198 g</strong>.</li>
            <li><strong>2 slug → kg</strong>: 2 × 14.59390294 ≈ <strong>29.1878059 kg</strong>.</li>
          </ul>
        
          {/* ===== Use Cases ===== */}
          <h2 id="use-cases" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">🧰 Real-World Use Cases</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Logistics & Shipping</strong>: Harmonize kg-based invoices with lb/oz-based carrier limits.</li>
            <li><strong>Fitness & Health</strong>: Track body mass in kg but share progress in lb or st where preferred.</li>
            <li><strong>Culinary & Retail</strong>: Convert wholesale kg to shelf-friendly g/oz units instantly.</li>
            <li><strong>Jewelry & Metals</strong>: Switch between carat, grain, gram without manual lookups.</li>
            <li><strong>Engineering</strong>: Use slug for dynamic equations while communicating in SI (kg) for reports.</li>
            <li><strong>Education</strong>: Demonstrate mass vs weight with numeric conversions and clear definitions.</li>
          </ul>
        
          {/* ===== Accuracy & Best Practices ===== */}
          <h2 id="accuracy" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">✅ Accuracy, Rounding & Best Practices</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Convert <strong>via kg</strong> (SI base) to avoid round-trip drift.</li>
            <li>Carry extra precision internally; round only for display and labels.</li>
            <li>For regulatory reporting, keep 3–6 decimals (or as specified by the standard).</li>
            <li>For UX readability, prefer fewer decimals and <strong>Compact</strong> format where appropriate.</li>
          </ul>
        
          {/* ===== Common Pitfalls ===== */}
          <h2 id="pitfalls" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">⚠️ Common Pitfalls to Avoid</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Mass vs Weight</strong>: Mass (kg) is matter; weight is the <em>force</em> due to gravity (newtons).
              Everyday scales infer mass assuming standard gravity—results are shown in mass units like kg or lb.</li>
            <li><strong>lb vs lbf</strong>: <em>lb</em> in this tool is a mass unit (pound-mass). Don’t confuse with <em>lbf</em> (pound-force).</li>
            <li><strong>oz (mass) vs fl oz (volume)</strong>: Ounce here means mass; fluid ounce is a volume unit.</li>
            <li><strong>Short vs Long ton</strong>: US short ton = 2000 lb; UK long ton = 2240 lb. Both differ from metric tonne (1000 kg).</li>
            <li><strong>Rounding early</strong>: Round at the end, not between steps, to prevent drift on chained conversions.</li>
          </ul>
        
          {/* ===== Quick Reference ===== */}
          <h2 id="quick-ref" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">🗂️ Quick Reference</h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li>1 kg = <strong>2.20462262 lb</strong></li>
              <li>1 lb = <strong>0.45359237 kg</strong></li>
              <li>1 oz = <strong>28.349523125 g</strong> (exact via lb)</li>
              <li>1 st = <strong>14 lb</strong> = <strong>6.35029318 kg</strong></li>
              <li>1 t (tonne) = <strong>1000 kg</strong></li>
              <li>1 short ton = <strong>907.18474 kg</strong></li>
              <li>1 long ton = <strong>1016.0469088 kg</strong></li>
              <li>1 ct = <strong>0.2 g</strong></li>
              <li>1 gr = <strong>64.79891 mg</strong></li>
              <li>1 slug ≈ <strong>14.59390294 kg</strong></li>
            </ul>
          </div>
        
          {/* ===== Glossary ===== */}
          <h2 id="glossary" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">📚 Glossary</h2>
          <p className="space-y-2">
            <strong>Mass</strong>: Amount of matter (kg, g, lb, oz, etc.).<br/>
            <strong>Weight</strong>: Force due to gravity (newtons); everyday scales convert this to mass units.<br/>
            <strong>Metric (SI)</strong>: µg, mg, g, kg, tonne (t).<br/>
            <strong>Imperial/US customary</strong>: oz, lb, st, short ton, long ton.<br/>
            <strong>Carat (ct)</strong>: Gemstone mass; 1 ct = 0.2 g.<br/>
            <strong>Grain (gr)</strong>: 64.79891 mg; used in ballistics and precious metals.<br/>
            <strong>Slug</strong>: US engineering mass unit; ≈ 14.5939 kg.
          </p>
        
          {/* ===== FAQ ===== */}
          <section className="space-y-6 mt-16">
            <h2 id="faq" className="text-3xl md:text-4xl font-bold mb-4 text-center text-emerald-200">
              ❓ Frequently Asked Questions (FAQ)
            </h2>
        
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-emerald-300">Q1: What’s the difference between mass and weight?</h3>
                <p>Mass measures matter (kg, g); weight is the gravitational force (newtons). Scales report mass by assuming standard gravity.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-emerald-300">Q2: How many pounds are in a kilogram?</h3>
                <p>Exactly <strong>2.20462262185 lb</strong> per kilogram (since 1 lb = 0.45359237 kg).</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-emerald-300">Q3: Stone vs pounds vs kilograms?</h3>
                <p>1 st = 14 lb = 6.35029318 kg. Commonly used in the UK and Ireland to express body mass.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-emerald-300">Q4: Short ton vs long ton vs metric tonne?</h3>
                <p>Short ton (US) = 2000 lb = 907.18474 kg; Long ton (UK) = 2240 lb = 1016.0469088 kg; Tonne (metric) = 1000 kg.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-emerald-300">Q5: What are carat and grain used for?</h3>
                <p>Carat (ct) is for gemstones: 1 ct = 0.2 g. Grain (gr) is 64.79891 mg, used in ballistics and precious metals.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-emerald-300">Q6: Does the tool save Favorites and Recent?</h3>
                <p>Yes. Both are stored locally in your browser for privacy and quick recall.</p>
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
        
          <div className="mt-8 bg-gradient-to-r from-emerald-900/40 via-teal-900/40 to-cyan-900/40 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              🚀 Explore more tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/data-storage-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-cyan-600/20 text-cyan-300 hover:text-cyan-200 px-3 py-2 rounded-md border border-slate-700 hover:border-cyan-500 transition-all duration-200"
              >
                <span className="text-cyan-300">💾</span> Data Storage Converter
              </Link>
              <Link
                to="/energy-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-amber-600/20 text-amber-300 hover:text-amber-200 px-3 py-2 rounded-md border border-slate-700 hover:border-amber-500 transition-all duration-200"
              >
                <span className="text-amber-300">⚡</span> Energy Converter
              </Link>
              <Link
                to="/length-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-200 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
              >
                <span className="text-emerald-300">📏</span> Length Converter
              </Link>
            </div>
          </div>
        </section>


        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/mass-weight-converter" category="unit-converters" />
      </div>
    </>
  );
}
