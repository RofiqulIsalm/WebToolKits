import React, { useEffect, useMemo, useRef, useState } from 'react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

/* ---------------- Icons (inline, no deps) ---------------- */
const Icon = {
  Flow: (p: any) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      {/* pipe with arrow */}
      <rect x="2" y="9" width="20" height="6" rx="2" />
      <path d="M7 12h10M14 9l3 3-3 3" />
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

/* ---------------- Units (factors are in m³/s) ----------------
   Constants:
   - 1 L = 0.001 m³
   - 1 mL = 1e-6 m³
   - 1 ft³ = 0.028316846592 m³
   - 1 in³ = 1.6387064e-5 m³
   - 1 US gal = 3.785411784 L = 0.003785411784 m³
   - 1 Imp gal = 4.54609 L = 0.00454609 m³
   - 1 barrel (oil, bbl) = 42 US gal = 0.158987294928 m³
   - min = 60 s, h = 3600 s, day = 86400 s
-----------------------------------------------------------------*/
const M3_PER_FT3 = 0.028316846592;
const M3_PER_IN3 = 1.6387064e-5;
const M3_PER_GAL_US = 0.003785411784;
const M3_PER_GAL_IMP = 0.00454609;
const M3_PER_BBL = 0.158987294928;

const FLOW_UNITS = [
  // SI / metric
  { key: 'm3/s',  name: 'Cubic meter per second (m³/s)', factor: 1 },
  { key: 'm3/min',name: 'Cubic meter per minute (m³/min)', factor: 1/60 },
  { key: 'm3/h',  name: 'Cubic meter per hour (m³/h)', factor: 1/3600 },

  { key: 'L/s',   name: 'Liter per second (L/s)',  factor: 0.001 },
  { key: 'L/min', name: 'Liter per minute (L/min)', factor: 0.001/60 },
  { key: 'L/h',   name: 'Liter per hour (L/h)',     factor: 0.001/3600 },

  { key: 'mL/s',  name: 'Milliliter per second (mL/s)', factor: 1e-6 },
  { key: 'mL/min',name: 'Milliliter per minute (mL/min)', factor: 1e-6/60 },

  // US customary
  { key: 'ft3/s', name: 'Cubic foot per second (ft³/s)', factor: M3_PER_FT3 },
  { key: 'ft3/min',name: 'Cubic foot per minute (ft³/min, CFM)', factor: M3_PER_FT3/60 },
  { key: 'ft3/h', name: 'Cubic foot per hour (ft³/h)', factor: M3_PER_FT3/3600 },

  { key: 'in3/s', name: 'Cubic inch per second (in³/s)', factor: M3_PER_IN3 },
  { key: 'in3/min',name: 'Cubic inch per minute (in³/min)', factor: M3_PER_IN3/60 },

  { key: 'galUS/s', name: 'US gallon per second (gal/s)', factor: M3_PER_GAL_US },
  { key: 'galUS/min',name: 'US gallon per minute (GPM US)', factor: M3_PER_GAL_US/60 },
  { key: 'galUS/h', name: 'US gallon per hour (gal/h)', factor: M3_PER_GAL_US/3600 },

  // Imperial
  { key: 'galImp/s', name: 'Imperial gallon per second (gal (Imp)/s)', factor: M3_PER_GAL_IMP },
  { key: 'galImp/min',name: 'Imperial gallon per minute (GPM Imp)', factor: M3_PER_GAL_IMP/60 },
  { key: 'galImp/h', name: 'Imperial gallon per hour (gal (Imp)/h)', factor: M3_PER_GAL_IMP/3600 },

  // Oil & process
  { key: 'bbl/s',  name: 'Barrel per second (bbl/s)', factor: M3_PER_BBL },
  { key: 'bbl/min',name: 'Barrel per minute (bbl/min)', factor: M3_PER_BBL/60 },
  { key: 'bbl/d',  name: 'Barrel per day (bbl/d)', factor: M3_PER_BBL/86400 },
];

const unitMap: Record<string, {key:string; name:string; factor:number}> =
  Object.fromEntries(FLOW_UNITS.map(u => [u.key, u]));
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
  // value[from]*factor[from] = m³/s;  /factor[to] = value[to]
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
export default function FlowRateConverter() {
  const [valueStr, setValueStr] = useState('');
  const [fromUnit, setFromUnit] = useState('L/min');     // popular default
  const [toUnit, setToUnit] = useState('galUS/min');     // GPM (US)
  const [formatMode, setFormatMode] = useState<typeof FORMAT_MODES[number]>('normal');
  const [precision, setPrecision] = useState(6);
  const [favorites, setFavorites] = useLocalStorage<string[]>('flow:favorites', ['L/min','m3/h','galUS/min','ft3/min','m3/s','bbl/d','galImp/min']);
  const [history, setHistory] = useLocalStorage<any[]>('flow:history', []);

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
    for (const u of FLOW_UNITS) if (u.key !== fromUnit) out[u.key] = base / u.factor;
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
        a.href = url; a.download = 'flowrate-conversion.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
      }
    } catch {}
  }

  const favored = FLOW_UNITS.filter(u => favorites.includes(u.key));
  const unfavored = FLOW_UNITS.filter(u => !favorites.includes(u.key));
  const hasInput = (valueStr || '').trim() !== '';

  return (
    <>
      {/** ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Flow Rate Converter — m³/s ⇄ m³/h ⇄ L/min ⇄ CFM ⇄ GPM (US/Imp) ⇄ ft³/s ⇄ bbl/d"
        description="Convert volumetric flow across engineering units: m³/s, m³/h, L/min, CFM, GPM (US/Imp), ft³/s, in³/s, barrels/day, and more. Includes precision control, Normal/Compact/Scientific formats, favorites, history, CSV export, and shareable URLs."
        keywords={[
          "flow rate converter",
          "L/min to GPM",
          "GPM to L/min",
          "CFM to L/s",
          "m3/h to GPM",
          "m3/s to CFM",
          "ft3/min to m3/h",
          "bbl/d to m3/s",
          "US gallon to liter",
          "imperial gallon to liter",
          "flow unit conversion"
        ]}
        canonical="https://calculatorhub.site/flow-rate-converter"
        schemaData={[
          /* 1) WebPage + Article */
          {
            "@context":"https://schema.org",
            "@type":"WebPage",
            "@id":"https://calculatorhub.site/flow-rate-converter#webpage",
            "url":"https://calculatorhub.site/flow-rate-converter",
            "name":"Flow Rate Converter — m³/s, m³/h, L/min, CFM, GPM (US/Imp), ft³/s, bbl/d",
            "inLanguage":"en",
            "isPartOf":{"@id":"https://calculatorhub.site/#website"},
            "primaryImageOfPage":{
              "@type":"ImageObject",
              "@id":"https://calculatorhub.site/images/flow-rate-converter-hero.webp#primaryimg",
              "url":"https://calculatorhub.site/images/flow-rate-converter-hero.webp",
              "width":1200,"height":675
            },
            "mainEntity":{
              "@type":"Article",
              "@id":"https://calculatorhub.site/flow-rate-converter#article",
              "headline":"Flow Rate Converter — Engineering & Process Units",
              "description":"Instantly convert between m³/s, m³/h, L/min, L/s, CFM, GPM (US/Imp), ft³/s, in³/s, and barrels/day. Precision controls, number formats, keyboard shortcuts, copy/CSV export, favorites, history, and shareable links.",
              "image":["https://calculatorhub.site/images/flow-rate-converter-hero.webp"],
              "author":{"@type":"Organization","name":"CalculatorHub","url":"https://calculatorhub.site"},
              "publisher":{"@id":"https://calculatorhub.site/#organization"},
              "datePublished":"2025-11-09",
              "dateModified":"2025-11-09",
              "mainEntityOfPage":{"@id":"https://calculatorhub.site/flow-rate-converter#webpage"},
              "articleSection":[
                "Supported Units",
                "US vs Imperial Gallon",
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
            "@id":"https://calculatorhub.site/flow-rate-converter#breadcrumbs",
            "itemListElement":[
              {"@type":"ListItem","position":1,"name":"Home","item":"https://calculatorhub.site/"},
              {"@type":"ListItem","position":2,"name":"Unit Converters","item":"https://calculatorhub.site/category/unit-converters"},
              {"@type":"ListItem","position":3,"name":"Flow Rate Converter","item":"https://calculatorhub.site/flow-rate-converter"}
            ]
          },
      
          /* 3) FAQ */
          {
            "@context":"https://schema.org",
            "@type":"FAQPage",
            "@id":"https://calculatorhub.site/flow-rate-converter#faq",
            "mainEntity":[
              {
                "@type":"Question",
                "name":"How many liters are in a US gallon?",
                "acceptedAnswer":{"@type":"Answer","text":"1 US gallon = 3.785411784 liters (0.003785411784 m³)."}
              },
              {
                "@type":"Question",
                "name":"How many liters are in an Imperial gallon?",
                "acceptedAnswer":{"@type":"Answer","text":"1 Imperial gallon = 4.54609 liters (0.00454609 m³)."}
              },
              {
                "@type":"Question",
                "name":"What is 1 CFM in L/s?",
                "acceptedAnswer":{"@type":"Answer","text":"1 ft³/min (CFM) = 0.028316846592 m³/min ≈ 0.47194745 L/s."}
              },
              {
                "@type":"Question",
                "name":"How do I convert L/min to US GPM?",
                "acceptedAnswer":{"@type":"Answer","text":"Divide L/min by 3.785411784 and multiply by 1.0 (since GPM is US gal/min). Example: 10 L/min ≈ 2.6417 US GPM."}
              },
              {
                "@type":"Question",
                "name":"What is a barrel per day (bbl/d) in m³/s?",
                "acceptedAnswer":{"@type":"Answer","text":"1 bbl = 0.158987294928 m³. Divide by 86400: 1 bbl/d ≈ 1.84197×10⁻⁶ m³/s."}
              },
              {
                "@type":"Question",
                "name":"CFM vs GPM — what’s the difference?",
                "acceptedAnswer":{"@type":"Answer","text":"CFM measures volumetric flow in cubic feet per minute (gas/air common). GPM measures flow in gallons per minute (liquid common). They use different base volumes, so a direct conversion requires consistent unit factors."}
              }
            ]
          },
      
          /* 4) WebApplication */
          {
            "@context":"https://schema.org",
            "@type":"WebApplication",
            "@id":"https://calculatorhub.site/flow-rate-converter#webapp",
            "name":"Flow Rate Converter",
            "url":"https://calculatorhub.site/flow-rate-converter",
            "applicationCategory":"UtilitiesApplication",
            "operatingSystem":"Web",
            "description":"Interactive converter for m³/s, m³/h, L/min, CFM, GPM (US/Imp), ft³/s, in³/s, and bbl/d with precision controls and CSV export.",
            "publisher":{"@id":"https://calculatorhub.site/#organization"},
            "image":["https://calculatorhub.site/images/flow-rate-converter-hero.webp"]
          },
      
          /* 5) SoftwareApplication */
          {
            "@context":"https://schema.org",
            "@type":"SoftwareApplication",
            "@id":"https://calculatorhub.site/flow-rate-converter#software",
            "name":"Advanced Flow Rate Converter",
            "applicationCategory":"UtilitiesApplication",
            "operatingSystem":"All",
            "url":"https://calculatorhub.site/flow-rate-converter",
            "publisher":{"@id":"https://calculatorhub.site/#organization"},
            "description":"Convert between common flow units used in HVAC, process, oil & gas, and lab calculations."
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
      <link rel="canonical" href="https://calculatorhub.site/flow-rate-converter" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/flow-rate-converter" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/flow-rate-converter" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/flow-rate-converter" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Flow Rate Converter — m³/s, m³/h, L/min, CFM, GPM (US/Imp), ft³/s, bbl/d" />
      <meta property="og:description" content="Fast, precise flow conversions with Normal/Compact/Scientific formats, favorites, history, and CSV export." />
      <meta property="og:url" content="https://calculatorhub.site/flow-rate-converter" />
      <meta property="og:image" content="https://calculatorhub.site/images/flow-rate-converter-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Flow rate converter UI showing L/min ↔ GPM and CFM ↔ L/s conversions" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Flow Rate Converter — m³/s, L/min, CFM, GPM, ft³/s, bbl/d" />
      <meta name="twitter:description" content="Engineer-ready flow conversions with precision controls and CSV export." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/flow-rate-converter-hero.webp" />
      <meta name="twitter:creator" content="@CalculatorHub" />
      <meta name="twitter:site" content="@CalculatorHub" />
      
      {/** PWA & theme */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#071a2b" />
      
      {/** Performance */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="preload" as="image" href="/images/flow-rate-converter-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />


      <div className="max-w-5xl mx-auto text-gray-200">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Flow Rate Converter', url: '/flow-rate-converter' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 rounded-2xl p-6 bg-gradient-to-r from-cyan-900 via-sky-900 to-blue-900 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">Flow Rate Converter (Advanced)</h1>
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
                  className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  aria-label="Enter flow value"
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
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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
              className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white border border-sky-500 flex items-center gap-2"
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
            {(fromUnit.includes('gal') || toUnit.includes('gal')) && (
              <div className="mt-2 text-xs text-sky-200/80">
                Note: US gallon = 3.785411784 L, Imperial gallon = 4.54609 L.
              </div>
            )}
            {(fromUnit.includes('ft3') || toUnit.includes('ft3')) && (
              <div className="mt-1 text-xs text-sky-200/80">1 ft³ = 0.028316846592 m³.</div>
            )}
          </div>

          {/* More options */}
          <details className="mt-5">
            <summary className="cursor-pointer text-sm text-gray-300">More options</summary>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Precision</label>
                <input type="range" min={0} max={12} value={precision} onChange={(e) => setPrecision(+e.target.value)} className="w-full accent-sky-500" />
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
            {FLOW_UNITS.map((unit) => {
              if (unit.key === fromUnit) return null;
              const val = gridResults[unit.key];
              const display = formatNumber(val ?? 0, formatMode, precision);
              return (
                <div key={unit.key} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:bg-gray-700/70 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon.Flow style={{ width: 16, height: 16, color: '#38bdf8' }} />
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
 {/* ========= SEO Content: Flow Rate Converter (English Only) =========== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
        
          <header className="mb-10">
            <h1 className="text-3xl font-bold text-sky-300">Flow Rate Converter — Practical Guide & Engineer Notes</h1>
            <p className="mt-3">
              This Flow Rate Converter is built for engineers, students, and operators who work across HVAC, water and wastewater,
              process industries, and oil &amp; gas. Convert between <strong>m³/s</strong>, <strong>m³/h</strong>, <strong>L/min</strong>,
              <strong>L/s</strong>, <strong>CFM</strong>, <strong>GPM (US/Imperial)</strong>, <strong>ft³/s</strong>, <strong>in³/s</strong>,
              and <strong>bbl/d</strong> instantly. You control decimals (0–12), switch between Normal/Compact/Scientific formats,
              pin favorite units, reuse recent conversions, and export the entire grid using Copy/CSV. Shareable URLs preserve your
              exact state (value, units, precision, and format) for dependable collaboration and documentation.
            </p>
          </header>
        
          {/* Contents */}
          <nav className="mt-2 mb-10 bg-[#071a2b] border border-[#12314b] rounded-xl p-5 text-slate-200">
            <h2 className="text-lg font-semibold text-gray-100 mb-3">📖 Contents</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><a href="#en-how" className="text-sky-300 hover:underline">How to Use</a></li>
              <li><a href="#en-units" className="text-sky-300 hover:underline">Units &amp; Factors (to m³/s)</a></li>
              <li><a href="#en-concepts" className="text-sky-300 hover:underline">Volumetric vs Mass Flow</a></li>
              <li><a href="#en-density-temp" className="text-sky-300 hover:underline">Impact of Density, Pressure &amp; Temperature</a></li>
              <li><a href="#en-us-imp" className="text-sky-300 hover:underline">US vs Imperial Gallon</a></li>
              <li><a href="#en-examples" className="text-sky-300 hover:underline">Worked Examples</a></li>
              <li><a href="#en-usecases" className="text-sky-300 hover:underline">Real-World Applications</a></li>
              <li><a href="#en-precision" className="text-sky-300 hover:underline">Precision, Formats &amp; Edge Cases</a></li>
              <li><a href="#en-quickref" className="text-sky-300 hover:underline">Quick Reference Factors</a></li>
              <li><a href="#en-faq" className="text-sky-300 hover:underline">FAQ</a></li>
              <li><a href="#en-access" className="text-sky-300 hover:underline">Accessibility &amp; Shortcuts</a></li>
              <li><a href="#en-troubleshoot" className="text-sky-300 hover:underline">Troubleshooting &amp; Tips</a></li>
              <li><a href="#en-glossary" className="text-sky-300 hover:underline">Glossary</a></li>
            </ol>
          </nav>
        
          {/* How to Use */}
          <h2 id="en-how" className="text-2xl font-semibold text-sky-200 mt-10 mb-4">💡 How to Use</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter a numeric value in the <strong>Value</strong> field. Empty input = 0. Commas such as <code>1,234.56</code> are supported.</li>
            <li>Choose <strong>From</strong> and <strong>To</strong> units. Pin your frequent units with the <strong>Fav</strong> button for quick access.</li>
            <li>Open <strong>More options</strong> to set decimals (0–12) and select a display format: Normal, Compact, or Scientific.</li>
            <li>Copy the full result grid using <strong>Copy All</strong> or export a clean CSV with <strong>CSV</strong> for spreadsheets and reports.</li>
            <li>Use <em>Recent</em> to revisit your last 10 conversions instantly; each entry restores the prior value and units.</li>
          </ol>
          <p className="text-xs text-slate-400">Pro tip: The URL auto-encodes your state. Bookmark or share it to open the same configuration later.</p>
        
          {/* Units & Factors */}
          <h2 id="en-units" className="text-2xl font-semibold text-sky-200 mt-10 mb-4">🌐 Units &amp; Factors (to m³/s)</h2>
          <p>All conversions are anchored to <strong>m³/s</strong> as the base unit. The factors below convert each unit to m³/s.</p>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li><strong>m³/s</strong> → <code>1</code></li>
              <li><strong>m³/min</strong> → <code>1/60</code></li>
              <li><strong>m³/h</strong> → <code>1/3600</code></li>
              <li><strong>L/s</strong> → <code>0.001</code></li>
              <li><strong>L/min</strong> → <code>0.001/60</code></li>
              <li><strong>L/h</strong> → <code>0.001/3600</code></li>
              <li><strong>mL/s</strong> → <code>1e-6</code></li>
              <li><strong>mL/min</strong> → <code>1e-6/60</code></li>
              <li><strong>ft³/s</strong> → <code>0.028316846592</code></li>
              <li><strong>ft³/min (CFM)</strong> → <code>0.028316846592/60</code></li>
              <li><strong>ft³/h</strong> → <code>0.028316846592/3600</code></li>
              <li><strong>in³/s</strong> → <code>1.6387064e-5</code></li>
              <li><strong>in³/min</strong> → <code>1.6387064e-5/60</code></li>
              <li><strong>US gal/s</strong> → <code>0.003785411784</code></li>
              <li><strong>US gal/min (US GPM)</strong> → <code>0.003785411784/60</code></li>
              <li><strong>US gal/h</strong> → <code>0.003785411784/3600</code></li>
              <li><strong>Imp gal/s</strong> → <code>0.00454609</code></li>
              <li><strong>Imp gal/min (Imp GPM)</strong> → <code>0.00454609/60</code></li>
              <li><strong>Imp gal/h</strong> → <code>0.00454609/3600</code></li>
              <li><strong>bbl/s</strong> → <code>0.158987294928</code></li>
              <li><strong>bbl/min</strong> → <code>0.158987294928/60</code></li>
              <li><strong>bbl/d</strong> → <code>0.158987294928/86400</code></li>
            </ul>
            <p className="mt-3 text-slate-400 text-xs">
              These are pure unit relationships. Real flow in practice also depends on fluid properties (density, viscosity) and operating conditions (temperature, pressure).
            </p>
          </div>
        
          {/* Concepts */}
          <h2 id="en-concepts" className="text-2xl font-semibold text-sky-200 mt-10 mb-4">📐 Volumetric vs Mass Flow</h2>
          <p>
            <strong>Volumetric flow</strong> (<code>Q</code>) measures volume per time (e.g., m³/s, L/min, CFM). <strong>Mass flow</strong> (<code>ṁ</code>) measures mass per time.
            The link between them is <code>ṁ = ρ × Q</code>, where <code>ρ</code> (rho) is density. If density changes, mass flow changes even when <code>Q</code> stays constant.
            For example, a blower delivering 1,000 CFM of air at sea level will deliver a different mass flow at high altitude or elevated temperature.
          </p>
          <p className="mt-2">
            Choosing the correct measure matters: pumps and valves often care about volumetric flow for hydraulic sizing, while heat and mass balances in processes often
            rely on mass flow. This converter focuses on volumetric units so you can move cleanly between common engineering specifications.
          </p>
        
          {/* Density, Pressure, Temperature */}
          <h2 id="en-density-temp" className="text-2xl font-semibold text-sky-200 mt-10 mb-4">🌡️ Impact of Density, Pressure &amp; Temperature</h2>
          <p>
            Unit conversion alone doesn’t account for how fluids behave in the real world. Gases, in particular, are compressible; “CFM” sometimes refers to
            standard conditions (SCFM) and sometimes to actual volumetric flow (ACFM). Confirm which convention your data uses. Liquids vary less with pressure,
            but viscosity and temperature can still change pump performance and measured flow. Where mass or energy balances matter, consider converting your
            volumetric result to mass flow using the appropriate density for your operating point.
          </p>
        
          {/* US vs Imperial */}
          <h2 id="en-us-imp" className="text-2xl font-semibold text-sky-200 mt-10 mb-4">🇺🇸/🇬🇧 US vs Imperial Gallon</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>1 <strong>US gallon</strong> = <strong>3.785411784 L</strong></li>
            <li>1 <strong>Imperial gallon</strong> = <strong>4.54609 L</strong></li>
          </ul>
          <p className="mt-2">
            Because these base volumes are different, US GPM and Imperial GPM are not interchangeable. Always confirm which gallon your datasheet, valve sizing table,
            or vendor quote is using.
          </p>
        
          {/* Worked Examples */}
          <h2 id="en-examples" className="text-2xl font-semibold text-sky-200 mt-10 mb-4">📈 Worked Examples (Rounded)</h2>
          <ul className="space-y-2">
            <li><strong>10 L/min → US GPM:</strong> 10 ÷ 3.785411784 ≈ <strong>2.6417</strong> US GPM</li>
            <li><strong>1 CFM → L/s:</strong> 1 ft³/min = 0.028316846592 m³/min ≈ <strong>0.47194745 L/s</strong> (≈ 0.472 L/s)</li>
            <li><strong>25 m³/h → L/min:</strong> 25,000 L/h ÷ 60 = <strong>416.667 L/min</strong></li>
            <li><strong>1 bbl/d → m³/s:</strong> 0.158987294928 ÷ 86400 ≈ <strong>1.842×10⁻⁶ m³/s</strong></li>
            <li><strong>5 ft³/s → m³/h:</strong> 5 × 0.028316846592 × 3600 ≈ <strong>509.70 m³/h</strong></li>
          </ul>
          <p className="text-xs text-slate-400">Note: Rounding is for readability; your UI will provide exact values with the precision you set.</p>
        
          {/* Real-world Applications */}
          <h2 id="en-usecases" className="text-2xl font-semibold text-sky-200 mt-10 mb-4">🛠️ Real-World Applications</h2>
          <h3 className="text-lg font-semibold text-gray-100 mt-4">HVAC &amp; Building Services</h3>
          <p>
            Air handling is typically specified in CFM, while hydronic loops and chiller/boiler flows are often in L/s or m³/h. Switching cleanly between these
            streams helps with fan curves, coil selection, balancing, and energy estimates.
          </p>
        
          <h3 className="text-lg font-semibold text-gray-100 mt-4">Process, Water &amp; Wastewater</h3>
          <p>
            Pump curves, valve <em>Cv</em>, treatment train sizing, and plant reporting frequently juggle m³/h, L/min, and GPM. Consistent conversions reduce errors
            across P&amp;IDs, control sheets, and commissioning logs.
          </p>
        
          <h3 className="text-lg font-semibold text-gray-100 mt-4">Oil &amp; Gas</h3>
          <p>
            Production rates are often tracked in barrels per day (bbl/d). Converting to SI (m³/s or m³/h) makes simulation, reporting, and cross-discipline review
            more straightforward, especially when integrating process, mechanical, and instrumentation data.
          </p>
        
          <h3 className="text-lg font-semibold text-gray-100 mt-4">Laboratories &amp; Bioprocess</h3>
          <p>
            Small feeds and precise dosing (mL/s, L/h) benefit from higher decimal control. Use Scientific format for ultra-small flows and set precision to match
            instrument resolution.
          </p>
        
          {/* Precision & Formats */}
          <h2 id="en-precision" className="text-2xl font-semibold text-sky-200 mt-10 mb-4">🎯 Precision, Formats &amp; Edge Cases</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Decimals:</strong> Choose 0–12 to fit sensor accuracy, reporting standards, or plotting needs.</li>
            <li><strong>Normal format:</strong> Classic fixed decimals for submittals and specs.</li>
            <li><strong>Compact format:</strong> K/M/B suffixes for dashboards and quick reviews.</li>
            <li><strong>Scientific format:</strong> Best for very large or very small results; easier to compare orders of magnitude.</li>
            <li>Empty input resolves to 0. Extremely small/large values gracefully display in scientific notation for readability.</li>
          </ul>
        
          {/* Quick Reference */}
          <h2 id="en-quickref" className="text-2xl font-semibold text-sky-200 mt-10 mb-4">🗂️ Quick Reference Factors</h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li>1 US gallon = <strong>3.785411784 L</strong></li>
              <li>1 Imperial gallon = <strong>4.54609 L</strong></li>
              <li>1 ft³ = <strong>0.028316846592 m³</strong></li>
              <li>1 in³ = <strong>1.6387064×10⁻⁵ m³</strong></li>
              <li>1 bbl (oil) = <strong>0.158987294928 m³</strong></li>
              <li>1 day = <strong>86400 s</strong></li>
            </ul>
          </div>
        
          {/* FAQ */}
          <h2 id="en-faq" className="text-2xl font-semibold text-sky-200 mt-10 mb-4">❓ Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-sky-300">Is CFM the same as GPM?</h3>
              <p>
                No. CFM is cubic feet per minute (commonly for air/gas), while GPM is gallons per minute (commonly for liquids).
                Because the base volumes differ, you must convert using the correct unit factors.
              </p>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-sky-300">How do I convert L/min to US GPM?</h3>
              <p>Divide by <code>3.785411784</code>. For example, 10 L/min ≈ 2.6417 US GPM.</p>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-sky-300">Why convert bbl/d to SI units?</h3>
              <p>
                SI units align with most simulations, standards, and cross-discipline reporting, making collaboration and auditing easier.
              </p>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-sky-300">What’s the difference between L/s and m³/h?</h3>
              <p>
                They’re both volumetric flow. 1 L/s = 0.001 m³/s, and 1 m³/h = 0.000277777... m³/s. Use whichever your vendor/sizing charts prefer.
              </p>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-sky-300">Does Compact format change the numeric value?</h3>
              <p>
                No. It only changes how the number is displayed (e.g., 12,300 → 12.3K). Use CSV export for exact figures in spreadsheets.
              </p>
            </div>
          </div>
        
          {/* Accessibility */}
          <h2 id="en-access" className="text-2xl font-semibold text-sky-200 mt-10 mb-4">♿ Accessibility &amp; Keyboard Shortcuts</h2>
          <ul className="list-disc list-inside">
            <li><kbd>/</kbd> — focus Value</li>
            <li><kbd>S</kbd> — focus From</li>
            <li><kbd>T</kbd> — focus To</li>
            <li><kbd>X</kbd> — swap units</li>
          </ul>
          <p className="text-xs text-slate-400 mt-2">
            Inputs and selects provide visible focus and screen-reader labels. Tooltips and helper text clarify behavior for new users.
          </p>
        
          {/* Troubleshooting */}
          <h2 id="en-troubleshoot" className="text-2xl font-semibold text-sky-200 mt-10 mb-4">🧩 Troubleshooting &amp; Tips</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Seeing “—”? Ensure the input is numeric and the units are valid.</li>
            <li>Too many digits? Reduce decimals or switch to Compact/Scientific output.</li>
            <li>Need reproducibility? Share the auto-encoded URL so teammates open the same state.</li>
            <li>Comparing tiny flows? Scientific format improves readability at micro scales (e.g., bbl/d → m³/s).</li>
          </ul>
        
          {/* Glossary */}
          <h2 id="en-glossary" className="text-2xl font-semibold text-sky-200 mt-10 mb-4">📚 Glossary</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <dt className="font-semibold text-sky-300">Volumetric Flow (Q)</dt>
              <dd>Volume per unit time (e.g., m³/s, L/min, CFM) used for hydraulic sizing and capacity checks.</dd>
            </div>
            <div>
              <dt className="font-semibold text-sky-300">Mass Flow (ṁ)</dt>
              <dd>Mass per unit time; relates to Q by density: ṁ = ρ × Q. Central to energy and material balances.</dd>
            </div>
            <div>
              <dt className="font-semibold text-sky-300">CFM</dt>
              <dd>Cubic feet per minute; common for air/gas flows, ductwork, and fans. May be “actual” or “standard.”</dd>
            </div>
            <div>
              <dt className="font-semibold text-sky-300">GPM</dt>
              <dd>Gallons per minute; typical for liquid systems. Distinguish US vs Imperial gallons.</dd>
            </div>
            <div>
              <dt className="font-semibold text-sky-300">bbl/d</dt>
              <dd>Barrels per day; standard oil &amp; gas production unit. 1 bbl = 0.158987294928 m³.</dd>
            </div>
            <div>
              <dt className="font-semibold text-sky-300">Compact Format</dt>
              <dd>Human-friendly suffix display (K/M/B) without changing the underlying value.</dd>
            </div>
          </dl>
        
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
        <RelatedCalculators currentPath="/flow-rate-converter" category="unit-converters" />
      </div>
    </>
  );
}
