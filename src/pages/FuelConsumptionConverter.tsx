import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from "react-router-dom";
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

/* ---------------- Icons (inline, no deps) ---------------- */
const Icon = {
  Fuel: (p: any) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7h8a2 2 0 0 1 2 2v10H1V9a2 2 0 0 1 2-2Z" />
      <path d="M7 7V4a2 2 0 0 1 2-2h1" />
      <path d="M16 7v9a3 3 0 1 0 6 0V9a2 2 0 0 0-.586-1.414l-2-2A2 2 0 0 0 18 5h-2" />
      <circle cx="6.5" cy="12" r="1.5" />
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

/* ---------------- Constants ---------------- */
const KM_PER_MI = 1.609344;
const MI_PER_KM = 1 / KM_PER_MI; // 0.621371192
const L_PER_GAL_US = 3.785411784;
const L_PER_GAL_IMP = 4.54609;

// magic constants for L/100km <-> mpg
const L_PER_100KM_PER_MPG_US = 235.214583; // L/100km = 235.214583 / mpg(US)
const L_PER_100KM_PER_MPG_IMP = 282.480936;

/* ---------------- Units (base is L/100 km) ----------------
   Types included:
   - Consumption (lower is better): L/100km, L/km, mL/km, gal/100mi (US/Imp)
   - Economy (higher is better): mpg (US/Imp), km/L, mi/L, km/gal (US/Imp)
-----------------------------------------------------------------*/
type UnitKey =
  | 'L/100km' | 'L/km' | 'mL/km' | 'galUS/100mi' | 'galImp/100mi'
  | 'mpgUS' | 'mpgImp' | 'km/L' | 'mi/L' | 'km/galUS' | 'km/galImp';

const UNITS: { key: UnitKey; name: string; kind: 'consumption'|'economy' }[] = [
  { key: 'L/100km',   name: 'Liter per 100 km (L/100 km)',     kind: 'consumption' },
  { key: 'L/km',      name: 'Liter per km (L/km)',             kind: 'consumption' },
  { key: 'mL/km',     name: 'Milliliter per km (mL/km)',       kind: 'consumption' },
  { key: 'galUS/100mi',  name: 'US gallon per 100 miles (gal/100 mi US)', kind: 'consumption' },
  { key: 'galImp/100mi', name: 'Imp gallon per 100 miles (gal/100 mi Imp)', kind: 'consumption' },

  { key: 'mpgUS',     name: 'Miles per US gallon (mpg US)',    kind: 'economy' },
  { key: 'mpgImp',    name: 'Miles per Imp gallon (mpg Imp)',  kind: 'economy' },
  { key: 'km/L',      name: 'Kilometer per liter (km/L)',      kind: 'economy' },
  { key: 'mi/L',      name: 'Mile per liter (mi/L)',           kind: 'economy' },
  { key: 'km/galUS',  name: 'Kilometer per US gallon (km/gal US)', kind: 'economy' },
  { key: 'km/galImp', name: 'Kilometer per Imp gallon (km/gal Imp)', kind: 'economy' },
];

const unitMap = Object.fromEntries(UNITS.map(u => [u.key, u]));
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
// Convert *any unit* to base L/100km
function toBase_Lper100km(value: number, from: UnitKey): number {
  switch (from) {
    case 'L/100km':   return value;
    case 'L/km':      return value * 100;
    case 'mL/km':     return value / 10; // (mL/km)/1000 L/km * 100
    case 'km/L':      return 100 / value;
    case 'mi/L':      return (100 * MI_PER_KM) / value; // 62.1371192 / v
    case 'mpgUS':     return L_PER_100KM_PER_MPG_US / value;
    case 'mpgImp':    return L_PER_100KM_PER_MPG_IMP / value;
    case 'km/galUS':  return (100 * L_PER_GAL_US) / value;   // 378.5411784 / v
    case 'km/galImp': return (100 * L_PER_GAL_IMP) / value;  // 454.609 / v
    case 'galUS/100mi':
      // L/100mi = value * L_PER_GAL_US;  L/100km = (L/100mi) / (mi per 100km) = (value * L_PER_GAL_US) / 62.1371192
      return (value * L_PER_GAL_US) / (100 * MI_PER_KM);
    case 'galImp/100mi':
      return (value * L_PER_GAL_IMP) / (100 * MI_PER_KM);
  }
}

// Convert base L/100km to target unit
function fromBase_Lper100km(base: number, to: UnitKey): number {
  switch (to) {
    case 'L/100km':   return base;
    case 'L/km':      return base / 100;
    case 'mL/km':     return (base / 100) * 1000; // 10*base
    case 'km/L':      return 100 / base;
    case 'mi/L':      return (100 / base) * MI_PER_KM;
    case 'mpgUS':     return L_PER_100KM_PER_MPG_US / base;
    case 'mpgImp':    return L_PER_100KM_PER_MPG_IMP / base;
    case 'km/galUS':  return (100 / base) * L_PER_GAL_US;
    case 'km/galImp': return (100 / base) * L_PER_GAL_IMP;
    case 'galUS/100mi': return (base * (100 * MI_PER_KM)) / L_PER_GAL_US;
    case 'galImp/100mi': return (base * (100 * MI_PER_KM)) / L_PER_GAL_IMP;
  }
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
export default function FuelConsumptionConverter() {
  const [valueStr, setValueStr] = useState('');
  const [fromUnit, setFromUnit] = useState<UnitKey>('L/100km');
  const [toUnit, setToUnit] = useState<UnitKey>('mpgUS');
  const [formatMode, setFormatMode] = useState<typeof FORMAT_MODES[number]>('normal');
  const [precision, setPrecision] = useState(6);
  const [favorites, setFavorites] = useLocalStorage<UnitKey[]>('fuel:favorites',
    ['L/100km','mpgUS','mpgImp','km/L','galUS/100mi']
  );
  const [history, setHistory] = useLocalStorage<any[]>('fuel:history', []);

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
  const base = useMemo(() => toBase_Lper100km(valueNum, fromUnit), [valueNum, fromUnit]);
  const direct = useMemo(() => fromBase_Lper100km(base, toUnit), [base, toUnit]);
  const gridResults = useMemo(() => {
    const out: Record<UnitKey, number> = {} as any;
    for (const u of UNITS) if (u.key !== fromUnit) out[u.key as UnitKey] = fromBase_Lper100km(base, u.key as UnitKey);
    return out;
  }, [base, fromUnit]);

  /* ---------- URL sync ---------- */
  useEffect(() => {
    if (!hasWindow()) return;
    try {
      const usp = new URLSearchParams(window.location.search);
      const v = usp.get('v'); const f = usp.get('from') as UnitKey|null; const t = usp.get('to') as UnitKey|null;
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
  function toggleFavorite(k: UnitKey) {
    setFavorites(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k].slice(0, 8));
  }
  function swapUnits() {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  }
  function copyAll() {
    const lines = Object.entries(gridResults).map(([k, v]) => `${unitMap[k as UnitKey].name}: ${v}`).join('\n');
    if (hasWindow() && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(lines).catch(() => {});
    }
  }
  function exportCSV() {
    const headers = ['Unit','Value'];
    const rows = Object.entries(gridResults).map(([k, v]) => [unitMap[k as UnitKey].name, String(v)]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = (hasWindow() && URL?.createObjectURL) ? URL.createObjectURL(blob) : null;
      if (url && hasWindow()) {
        const a = document.createElement('a');
        a.href = url; a.download = 'fuel-consumption-conversion.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
      }
    } catch {}
  }

  const favored = UNITS.filter(u => favorites.includes(u.key as UnitKey));
  const unfavored = UNITS.filter(u => !favorites.includes(u.key as UnitKey));
  const hasInput = (valueStr || '').trim() !== '';

  return (
    <>
      {/** ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Fuel Consumption Converter — L/100 km ⇄ mpg (US/Imp) ⇄ km/L ⇄ mi/L ⇄ km/gal"
        description="Instantly convert fuel consumption and economy units: L/100 km, L/km, mL/km, mpg (US/Imp), km/L, mi/L, km/gal (US/Imp), gal/100 mi. Precision controls, multiple formats, favorites, history, CSV export, and shareable URLs."
        keywords={[
          "fuel consumption converter",
          "L/100km to mpg",
          "mpg to L/100km",
          "km/L to mpg",
          "mi/L to mpg",
          "US mpg vs Imperial mpg",
          "gal per 100 miles",
          "km per gallon",
          "fuel economy units"
        ]}
        canonical="https://calculatorhub.site/fuel-consumption-converter"
        schemaData={[
          /* 1) WebPage + Article */
          {
            "@context":"https://schema.org",
            "@type":"WebPage",
            "@id":"https://calculatorhub.site/fuel-consumption-converter#webpage",
            "url":"https://calculatorhub.site/fuel-consumption-converter",
            "name":"Fuel Consumption Converter — L/100 km, mpg (US/Imp), km/L, mi/L, km/gal",
            "inLanguage":"en",
            "isPartOf":{"@id":"https://calculatorhub.site/#website"},
            "primaryImageOfPage":{
              "@type":"ImageObject",
              "@id":"https://calculatorhub.site/images/fuel-consumption-converter-hero.webp#primaryimg",
              "url":"https://calculatorhub.site/images/fuel-consumption-converter-hero.webp",
              "width":1200,"height":675
            },
            "mainEntity":{
              "@type":"Article",
              "@id":"https://calculatorhub.site/fuel-consumption-converter#article",
              "headline":"Fuel Consumption & Economy Unit Converter",
              "description":"Convert between L/100 km, L/km, mL/km, mpg (US/Imp), km/L, mi/L, km/gal (US/Imp), and gal/100 mi. Includes precision slider, Normal/Compact/Scientific formats, keyboard shortcuts, favorites, history, copy & CSV export.",
              "image":["https://calculatorhub.site/images/fuel-consumption-converter-hero.webp"],
              "author":{"@type":"Organization","name":"CalculatorHub","url":"https://calculatorhub.site"},
              "publisher":{"@id":"https://calculatorhub.site/#organization"},
              "datePublished":"2025-11-09",
              "dateModified":"2025-11-09",
              "mainEntityOfPage":{"@id":"https://calculatorhub.site/fuel-consumption-converter#webpage"},
              "articleSection":[
                "Supported Units",
                "US vs Imperial mpg",
                "Formulas & Constants",
                "Precision & Formats",
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
            "@id":"https://calculatorhub.site/fuel-consumption-converter#breadcrumbs",
            "itemListElement":[
              {"@type":"ListItem","position":1,"name":"Home","item":"https://calculatorhub.site/"},
              {"@type":"ListItem","position":2,"name":"Unit Converters","item":"https://calculatorhub.site/category/unit-converters"},
              {"@type":"ListItem","position":3,"name":"Fuel Consumption Converter","item":"https://calculatorhub.site/fuel-consumption-converter"}
            ]
          },
      
          /* 3) FAQ */
          {
            "@context":"https://schema.org",
            "@type":"FAQPage",
            "@id":"https://calculatorhub.site/fuel-consumption-converter#faq",
            "mainEntity":[
              {
                "@type":"Question",
                "name":"How do you convert L/100 km to mpg (US)?",
                "acceptedAnswer":{"@type":"Answer","text":"Use the reciprocal relation: L/100 km = 235.214583 ÷ mpg(US). Therefore mpg(US) = 235.214583 ÷ (L/100 km)."}
              },
              {
                "@type":"Question",
                "name":"How do you convert L/100 km to mpg (Imperial)?",
                "acceptedAnswer":{"@type":"Answer","text":"L/100 km = 282.480936 ÷ mpg(Imp). Therefore mpg(Imp) = 282.480936 ÷ (L/100 km)."}
              },
              {
                "@type":"Question",
                "name":"What’s the difference between US and Imperial mpg?",
                "acceptedAnswer":{"@type":"Answer","text":"They use different gallon sizes. 1 US gal = 3.785411784 L, while 1 Imperial gal = 4.54609 L. Imperial mpg will be higher for the same consumption."}
              },
              {
                "@type":"Question",
                "name":"How do I convert between km/L and L/100 km?",
                "acceptedAnswer":{"@type":"Answer","text":"They are reciprocals over 100 km: km/L = 100 ÷ (L/100 km) and L/100 km = 100 ÷ (km/L)."}
              },
              {
                "@type":"Question",
                "name":"How do I convert mi/L to L/100 km?",
                "acceptedAnswer":{"@type":"Answer","text":"Use miles–kilometers relation: 1 mile = 1.609344 km. L/100 km = (100 ÷ mi/L) × 0.621371192."}
              },
              {
                "@type":"Question",
                "name":"How is gal/100 mi converted to L/100 km?",
                "acceptedAnswer":{"@type":"Answer","text":"Multiply by the gallon size to get L/100 mi, then divide by 62.1371192 (mi per 100 km). Example (US): L/100 km = (gal/100 mi × 3.785411784) ÷ 62.1371192."}
              }
            ]
          },
      
          /* 4) WebApplication */
          {
            "@context":"https://schema.org",
            "@type":"WebApplication",
            "@id":"https://calculatorhub.site/fuel-consumption-converter#webapp",
            "name":"Fuel Consumption Converter",
            "url":"https://calculatorhub.site/fuel-consumption-converter",
            "applicationCategory":"UtilitiesApplication",
            "operatingSystem":"Web",
            "description":"Interactive converter for L/100 km, mpg (US/Imp), km/L, mi/L, km/gal, and gal/100 mi with precision controls and CSV export.",
            "publisher":{"@id":"https://calculatorhub.site/#organization"},
            "image":["https://calculatorhub.site/images/fuel-consumption-converter-hero.webp"]
          },
      
          /* 5) SoftwareApplication */
          {
            "@context":"https://schema.org",
            "@type":"SoftwareApplication",
            "@id":"https://calculatorhub.site/fuel-consumption-converter#software",
            "name":"Advanced Fuel Consumption Converter",
            "applicationCategory":"UtilitiesApplication",
            "operatingSystem":"All",
            "url":"https://calculatorhub.site/fuel-consumption-converter",
            "publisher":{"@id":"https://calculatorhub.site/#organization"},
            "description":"Convert common fuel consumption and economy units for vehicles and fleet comparisons."
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
      <link rel="canonical" href="https://calculatorhub.site/fuel-consumption-converter" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/fuel-consumption-converter" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/fuel-consumption-converter" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/fuel-consumption-converter" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Fuel Consumption Converter — L/100 km, mpg (US/Imp), km/L, mi/L, km/gal" />
      <meta property="og:description" content="Fast, precise conversions across consumption and economy units with precision controls, formats, favorites, history, and CSV export." />
      <meta property="og:url" content="https://calculatorhub.site/fuel-consumption-converter" />
      <meta property="og:image" content="https://calculatorhub.site/images/fuel-consumption-converter-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Fuel consumption converter UI showing L/100 km ↔ mpg conversions" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Fuel Consumption Converter — L/100 km ⇄ mpg (US/Imp) ⇄ km/L" />
      <meta name="twitter:description" content="Engineer-ready fuel consumption & economy conversions with precision controls and CSV export." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/fuel-consumption-converter-hero.webp" />
      <meta name="twitter:creator" content="@CalculatorHub" />
      <meta name="twitter:site" content="@CalculatorHub" />
      
      {/** PWA & theme */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#06201a" />
      
      {/** Performance */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="preload" as="image" href="/images/fuel-consumption-converter-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />


      <div className="max-w-5xl mx-auto text-gray-200">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Fuel Consumption Converter', url: '/fuel-consumption-converter' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 rounded-2xl p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-cyan-900 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">Fuel Consumption Converter (Advanced)</h1>
          <p className="text-gray-300">
            Handles consumption and economy units with precise reciprocals.
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
                  aria-label="Enter fuel value"
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
                onChange={(e) => setFromUnit(e.target.value as UnitKey)}
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
                onChange={(e) => setToUnit(e.target.value as UnitKey)}
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
            {(fromUnit === 'mpgUS' || toUnit === 'mpgUS' || fromUnit === 'mpgImp' || toUnit === 'mpgImp') && (
              <div className="mt-2 text-xs text-emerald-200/80">
                Quick rule: L/100 km = 235.2146 / mpg(US) ·· L/100 km = 282.4809 / mpg(Imp).
              </div>
            )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {UNITS.map((unit) => {
              if (unit.key === fromUnit) return null;
              const val = gridResults[unit.key as UnitKey];
              const display = formatNumber(val ?? 0, formatMode, precision);
              return (
                <div key={unit.key} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:bg-gray-700/70 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon.Fuel style={{ width: 16, height: 16, color: '#34d399' }} />
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
        {/* ============ SEO Content: Fuel Consumption Converter (English Only) =======*/}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
        
          <header className="mb-10">
            <h1 className="text-3xl font-bold text-emerald-300">Fuel Consumption Converter — Practical Guide & Engineer Notes</h1>
            <p className="mt-3">
              This Fuel Consumption Converter helps drivers, fleet managers, data analysts, and automotive engineers switch effortlessly
              between <strong>L/100&nbsp;km</strong>, <strong>L/km</strong>, <strong>mL/km</strong>, <strong>mpg (US)</strong>, <strong>mpg (Imperial)</strong>,
              <strong>km/L</strong>, <strong>mi/L</strong>, and <strong>km/gal (US/Imp)</strong>. It also supports consumption
              expressed as <strong>gal/100&nbsp;mi</strong> for US and Imperial gallons. You can set decimals (0–12), pick Normal/Compact/Scientific
              display formats, pin favorite units, revisit your last ten conversions, and export the entire grid using Copy or CSV.
              Shareable URLs preserve the exact state (value, units, format, precision) so your collaborators open the same configuration instantly.
            </p>
          </header>
        
          {/* Contents */}
          <nav className="mt-2 mb-10 bg-[#06201a] border border-[#0f362f] rounded-xl p-5 text-slate-200">
            <h2 className="text-lg font-semibold text-gray-100 mb-3">📖 Contents</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><a href="#fc-how" className="text-emerald-300 hover:underline">How to Use</a></li>
              <li><a href="#fc-basics" className="text-emerald-300 hover:underline">Basics: Consumption vs Economy</a></li>
              <li><a href="#fc-units" className="text-emerald-300 hover:underline">Units, Constants &amp; Conventions</a></li>
              <li><a href="#fc-formulas" className="text-emerald-300 hover:underline">Core Formulas (with Derivations)</a></li>
              <li><a href="#fc-examples" className="text-emerald-300 hover:underline">Worked Examples</a></li>
              <li><a href="#fc-usecases" className="text-emerald-300 hover:underline">Real-World Applications</a></li>
              <li><a href="#fc-accuracy" className="text-emerald-300 hover:underline">Accuracy, Rounding &amp; Data Quality</a></li>
              <li><a href="#fc-driving" className="text-emerald-300 hover:underline">What Affects Fuel Use?</a></li>
              <li><a href="#fc-emissions" className="text-emerald-300 hover:underline">Optional: Quick CO₂ Estimations</a></li>
              <li><a href="#fc-quickref" className="text-emerald-300 hover:underline">Quick Reference Table</a></li>
              <li><a href="#fc-faq" className="text-emerald-300 hover:underline">FAQ</a></li>
              <li><a href="#fc-access" className="text-emerald-300 hover:underline">Accessibility &amp; Shortcuts</a></li>
              <li><a href="#fc-troubleshoot" className="text-emerald-300 hover:underline">Troubleshooting &amp; Tips</a></li>
              <li><a href="#fc-glossary" className="text-emerald-300 hover:underline">Glossary</a></li>
            </ol>
          </nav>
        
          {/* How to Use */}
          <h2 id="fc-how" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">💡 How to Use</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Type a number in the <strong>Value</strong> field. Empty input counts as 0. Commas such as <code>1,234.56</code> are okay.</li>
            <li>Choose your <strong>From</strong> and <strong>To</strong> units. Pin frequent units with the <strong>Fav</strong> button.</li>
            <li>Open <strong>More options</strong> to adjust decimals (0–12) and pick a display format: Normal, Compact, or Scientific.</li>
            <li>Use <strong>Copy All</strong> or <strong>CSV</strong> to export the entire results grid for spreadsheets, emails, or reports.</li>
            <li>Use <strong>Recent</strong> to restore any of your last ten conversions—including value and units—instantly.</li>
          </ol>
          <p className="text-xs text-slate-400">Pro tip: The URL auto-encodes your state. Bookmark or share it to re-open the same configuration later.</p>
        
          {/* Basics */}
          <h2 id="fc-basics" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">📐 Basics: Consumption vs Economy</h2>
          <p>
            Fuel metrics are expressed two ways:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Consumption</strong> (lower is better): e.g., <strong>L/100&nbsp;km</strong>, <strong>L/km</strong>, <strong>mL/km</strong>, <strong>gal/100&nbsp;mi</strong>.</li>
            <li><strong>Economy</strong> (higher is better): e.g., <strong>mpg (US/Imp)</strong>, <strong>km/L</strong>, <strong>mi/L</strong>, <strong>km/gal (US/Imp)</strong>.</li>
          </ul>
          <p className="mt-2">
            These views are reciprocals of each other (after accounting for distance and gallon size). Europe, Canada, and many global standards favor
            <strong> L/100&nbsp;km</strong>, while the US and UK often reference <strong>mpg</strong> (with different gallon sizes). Our converter uses
            <strong> L/100&nbsp;km</strong> as a base internally to ensure exact, reversible transformations across all supported units.
          </p>
        
          {/* Units, Constants & Conventions */}
          <h2 id="fc-units" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">🌐 Units, Constants &amp; Conventions</h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li>1 mile = <strong>1.609344&nbsp;km</strong></li>
              <li>1 km = <strong>0.621371192&nbsp;mi</strong></li>
              <li>1 US gallon = <strong>3.785411784&nbsp;L</strong></li>
              <li>1 Imperial gallon = <strong>4.54609&nbsp;L</strong></li>
              <li>“per 100&nbsp;km” means distance is normalized to 100&nbsp;km for clarity</li>
              <li>“per 100&nbsp;mi” is likewise normalized to 100 miles</li>
            </ul>
            <p className="mt-3 text-slate-400 text-xs">
              Note the gallon size difference: <em>mpg (Imperial)</em> will be higher than <em>mpg (US)</em> for the same consumption because the Imperial gallon is larger.
            </p>
          </div>
        
          {/* Core Formulas */}
          <h2 id="fc-formulas" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">🧮 Core Formulas (with Derivations)</h2>
          <p>
            Our engine uses <strong>L/100&nbsp;km</strong> as the internal base. Conversions are exact given the constants above.
          </p>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm space-y-2">
            <p className="font-semibold">Between L/100&nbsp;km and mpg:</p>
            <ul className="list-disc list-inside">
              <li><strong>L/100&nbsp;km ↔ mpg (US):</strong> L/100&nbsp;km = <code>235.214583 ÷ mpg(US)</code> ⇒ mpg(US) = <code>235.214583 ÷ L/100&nbsp;km</code></li>
              <li><strong>L/100&nbsp;km ↔ mpg (Imp):</strong> L/100&nbsp;km = <code>282.480936 ÷ mpg(Imp)</code> ⇒ mpg(Imp) = <code>282.480936 ÷ L/100&nbsp;km</code></li>
            </ul>
        
            <p className="font-semibold mt-3">Between L/100&nbsp;km and km/L or mi/L:</p>
            <ul className="list-disc list-inside">
              <li><strong>km/L:</strong> km/L = <code>100 ÷ (L/100&nbsp;km)</code> and L/100&nbsp;km = <code>100 ÷ (km/L)</code></li>
              <li><strong>mi/L:</strong> mi/L = <code>(km/L) × 0.621371192</code> ⇒ L/100&nbsp;km = <code>(100 ÷ mi/L) × 0.621371192</code></li>
            </ul>
        
            <p className="font-semibold mt-3">Between L/100&nbsp;km and km/gal:</p>
            <ul className="list-disc list-inside">
              <li><strong>km/gal (US):</strong> km/gal(US) = <code>(100 ÷ L/100&nbsp;km) × 3.785411784</code></li>
              <li><strong>km/gal (Imp):</strong> km/gal(Imp) = <code>(100 ÷ L/100&nbsp;km) × 4.54609</code></li>
            </ul>
        
            <p className="font-semibold mt-3">Between L/100&nbsp;km and gal/100&nbsp;mi:</p>
            <ul className="list-disc list-inside">
              <li><strong>gal(US)/100&nbsp;mi:</strong> gal/100&nbsp;mi(US) = <code>(L/100&nbsp;km × 62.1371192) ÷ 3.785411784</code></li>
              <li><strong>gal(Imp)/100&nbsp;mi:</strong> gal/100&nbsp;mi(Imp) = <code>(L/100&nbsp;km × 62.1371192) ÷ 4.54609</code></li>
            </ul>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Internally, your component converts the input into base L/100&nbsp;km and then maps that base to every other unit, ensuring consistency across the grid.
          </p>
        
          {/* Worked Examples */}
          <h2 id="fc-examples" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">📈 Worked Examples (Rounded)</h2>
          <ul className="space-y-2">
            <li><strong>6.5&nbsp;L/100&nbsp;km → mpg (US):</strong> 235.214583 ÷ 6.5 ≈ <strong>36.19&nbsp;mpg (US)</strong></li>
            <li><strong>6.5&nbsp;L/100&nbsp;km → mpg (Imp):</strong> 282.480936 ÷ 6.5 ≈ <strong>43.46&nbsp;mpg (Imp)</strong></li>
            <li><strong>8.0&nbsp;L/100&nbsp;km → km/L:</strong> 100 ÷ 8 = <strong>12.5&nbsp;km/L</strong></li>
            <li><strong>30&nbsp;mpg (US) → L/100&nbsp;km:</strong> 235.214583 ÷ 30 ≈ <strong>7.84&nbsp;L/100&nbsp;km</strong></li>
            <li><strong>50&nbsp;mpg (Imp) → L/100&nbsp;km:</strong> 282.480936 ÷ 50 ≈ <strong>5.65&nbsp;L/100&nbsp;km</strong></li>
            <li><strong>10&nbsp;km/L → mpg (US):</strong> First to L/100&nbsp;km: 100 ÷ 10 = 10 → mpg(US) = 235.214583 ÷ 10 = <strong>23.52&nbsp;mpg</strong></li>
            <li><strong>8&nbsp;L/100&nbsp;km → gal(US)/100&nbsp;mi:</strong> (8 × 62.1371192) ÷ 3.785411784 ≈ <strong>131.0 ÷ 3.7854 ≈ 34.6 gal/100&nbsp;mi</strong></li>
          </ul>
          <p className="text-xs text-slate-400">
            Your UI will output exact values at the precision you choose; the above are rounded for readability.
          </p>
        
          {/* Real-World Applications */}
          <h2 id="fc-usecases" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">🛠️ Real-World Applications</h2>
        
          <h3 className="text-lg font-semibold text-gray-100 mt-4">Drivers &amp; Car Shoppers</h3>
          <p>
            When comparing brochures and reviews from different regions, you will encounter both <strong>L/100&nbsp;km</strong> and <strong>mpg</strong>.
            Converting them consistently allows fair comparisons between trims, engines, tire sizes, and model years—especially when moving between US, UK/Canada, and EU sources.
          </p>
        
          <h3 className="text-lg font-semibold text-gray-100 mt-4">Fleet &amp; Logistics</h3>
          <p>
            Fleet managers often track consumption in <strong>L/100&nbsp;km</strong> for international reporting but need <strong>mpg</strong> or <strong>mi/L</strong> for
            vendor contracts, driver dashboards, or legacy systems. This converter standardizes the process, helping you spot anomalies, benchmark routes, and estimate fuel budgets.
          </p>
        
          <h3 className="text-lg font-semibold text-gray-100 mt-4">Data, Apps &amp; Telematics</h3>
          <p>
            If your analytics app or telematics pipeline ingests mixed units from OBD devices, spreadsheets, or APIs, normalize to one base unit
            (e.g., <strong>L/100&nbsp;km</strong>) at ingestion time. Present in the viewer’s preferred unit at query time using deterministic conversions like the ones here.
          </p>
        
          <h3 className="text-lg font-semibold text-gray-100 mt-4">Policy, Forecasting &amp; Sustainability</h3>
          <p>
            City planners, NGOs, and corporate sustainability teams need reliable unit conversions to estimate energy use, fuel taxes, and carbon impact.
            Converting accurately across countries ensures fair policy comparisons and cleaner cross-border datasets.
          </p>
        
          {/* Accuracy */}
          <h2 id="fc-accuracy" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">🎯 Accuracy, Rounding &amp; Data Quality</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Decimals:</strong> Choose 0–12 to match the precision of your instruments or reporting needs. Most real-world automotive data does not justify more than 2–3 decimals.</li>
            <li><strong>Display formats:</strong> Compact (K/M/B) is handy for dashboards; Scientific is ideal for edge cases or micro-units.</li>
            <li><strong>Measurement noise:</strong> Short trips, cold starts, refueling differences, and tire pressure variations can skew readings—aggregate over longer distances when possible.</li>
            <li><strong>Apples to apples:</strong> Always confirm whether a source reports test-cycle values (e.g., WLTP, EPA, NEDC) or real-world averages; these can differ meaningfully.</li>
          </ul>
        
          {/* What Affects Fuel Use */}
          <h2 id="fc-driving" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">🚗 What Affects Fuel Use?</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Driving style:</strong> Smooth acceleration, anticipating traffic, and early upshifts reduce consumption.</li>
            <li><strong>Speed:</strong> Aerodynamic drag rises with the square of speed; high-speed cruising increases fuel use sharply.</li>
            <li><strong>Load &amp; cargo:</strong> Extra mass (passengers, roof racks, trailers) costs energy, especially in stop-and-go traffic.</li>
            <li><strong>Tires &amp; alignment:</strong> Low pressure and poor alignment raise rolling resistance.</li>
            <li><strong>Terrain &amp; weather:</strong> Hills, headwinds, cold temperatures, rain/snow all push consumption up.</li>
            <li><strong>Fuel quality &amp; maintenance:</strong> Engine tune, spark plugs, filters, and lubricants make a noticeable difference.</li>
            <li><strong>HVAC &amp; auxiliaries:</strong> A/C, heated seats, lights, and accessories add modest but real loads.</li>
          </ul>
        
          {/* Emissions quick estimator */}
          <h2 id="fc-emissions" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">🌍 Optional: Quick CO₂ Estimations</h2>
          <p>
            You can pair unit conversion with a rough emissions estimate. Typical tailpipe factors (well-known industry approximations) are:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Gasoline:</strong> ~2.31&nbsp;kg CO₂ per liter</li>
            <li><strong>Diesel:</strong> ~2.68&nbsp;kg CO₂ per liter</li>
          </ul>
          <p>
            Example: If your car averages <strong>7.0&nbsp;L/100&nbsp;km</strong> on gasoline, then per 100&nbsp;km you emit roughly <strong>7 × 2.31 = 16.17&nbsp;kg CO₂</strong>.
            For diesel at the same consumption, it would be ~<strong>18.76&nbsp;kg CO₂</strong>. For comparison across fuels or hybrids, convert to the same consumption unit first.
          </p>
          <p className="text-xs text-slate-400">
            These are simple tailpipe estimates. Full life-cycle assessments (LCA) require broader system boundaries and are out of scope here.
          </p>
        
          {/* Quick Reference */}
          <h2 id="fc-quickref" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">🗂️ Quick Reference Table</h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li>L/100&nbsp;km = <code>235.214583 ÷ mpg (US)</code></li>
              <li>L/100&nbsp;km = <code>282.480936 ÷ mpg (Imp)</code></li>
              <li>km/L = <code>100 ÷ L/100&nbsp;km</code></li>
              <li>mi/L = <code>(km/L) × 0.621371192</code></li>
              <li>km/gal (US) = <code>(100 ÷ L/100&nbsp;km) × 3.785411784</code></li>
              <li>km/gal (Imp) = <code>(100 ÷ L/100&nbsp;km) × 4.54609</code></li>
              <li>gal(US)/100&nbsp;mi = <code>(L/100&nbsp;km × 62.1371192) ÷ 3.785411784</code></li>
              <li>gal(Imp)/100&nbsp;mi = <code>(L/100&nbsp;km × 62.1371192) ÷ 4.54609</code></li>
            </ul>
          </div>
        
          {/* FAQ */}
          <h2 id="fc-faq" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">❓ Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-emerald-300">Is mpg (Imperial) the same as mpg (US)?</h3>
              <p>No. The Imperial gallon is larger (4.54609&nbsp;L vs 3.785411784&nbsp;L), so for the same consumption, mpg (Imperial) will be higher.</p>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-emerald-300">Why do some regions prefer L/100&nbsp;km?</h3>
              <p>
                L/100&nbsp;km scales linearly with fuel used—handy for cost and emissions tracking. It also avoids confusion between US and Imperial gallons.
              </p>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-emerald-300">Is km/L better than L/100&nbsp;km?</h3>
              <p>
                Neither is “better”; they’re reciprocals. Use the one your stakeholders expect. Our converter makes switching instant and lossless.
              </p>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-emerald-300">Does the “Compact” format change the value?</h3>
              <p>
                No, it only changes how numbers appear (e.g., 12,300 → 12.3K). Use CSV export for exact downstream calculations.
              </p>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-emerald-300">How do hybrids or PHEVs fit into this?</h3>
              <p>
                They still consume fuel when the engine runs; measure trip fuel and distance, compute L/100&nbsp;km, and convert as needed.
                Electric-only segments are typically tracked separately in kWh/100&nbsp;km; this tool focuses on liquid-fuel metrics.
              </p>
            </div>
          </div>
        
          {/* Accessibility */}
          <h2 id="fc-access" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">♿ Accessibility &amp; Keyboard Shortcuts</h2>
          <ul className="list-disc list-inside">
            <li><kbd>/</kbd> — focus Value</li>
            <li><kbd>S</kbd> — focus From</li>
            <li><kbd>T</kbd> — focus To</li>
            <li><kbd>X</kbd> — swap units</li>
          </ul>
          <p className="text-xs text-slate-400 mt-2">
            Inputs and selects include visible focus, ARIA labels, and concise helper text. Tooltips clarify behavior for new users.
          </p>
        
          {/* Troubleshooting */}
          <h2 id="fc-troubleshoot" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">🧩 Troubleshooting &amp; Tips</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Seeing “—”? Ensure the input is numeric and the selected units are valid.</li>
            <li>Too many digits? Reduce decimals or switch to Compact/Scientific for cleaner scanning.</li>
            <li>Need reproducibility? Share the auto-encoded URL; teammates will open the exact same state.</li>
            <li>Mismatched mpg? Verify whether your source was using US or Imperial gallons.</li>
          </ul>
        
          {/* Glossary */}
          <h2 id="fc-glossary" className="text-2xl font-semibold text-emerald-200 mt-10 mb-4">📚 Glossary</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <dt className="font-semibold text-emerald-300">Fuel Consumption</dt>
              <dd>Fuel used per distance (e.g., L/100&nbsp;km). Lower is better.</dd>
            </div>
            <div>
              <dt className="font-semibold text-emerald-300">Fuel Economy</dt>
              <dd>Distance per fuel (e.g., mpg, km/L). Higher is better.</dd>
            </div>
            <div>
              <dt className="font-semibold text-emerald-300">mpg (US/Imp)</dt>
              <dd>Miles per gallon; US and Imperial gallons are different sizes.</dd>
            </div>
            <div>
              <dt className="font-semibold text-emerald-300">km/L, mi/L</dt>
              <dd>Distance per liter; useful in markets that sell fuel in liters.</dd>
            </div>
            <div>
              <dt className="font-semibold text-emerald-300">gal/100&nbsp;mi</dt>
              <dd>Gallons consumed over 100 miles; expresses consumption directly.</dd>
            </div>
            <div>
              <dt className="font-semibold text-emerald-300">Precision</dt>
              <dd>Number of decimals shown; pick to match sensor or reporting needs.</dd>
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
        <RelatedCalculators currentPath="/fuel-consumption-converter" category="unit-converters" />
      </div>
    </>
  );
}
