import React, { useEffect, useMemo, useRef, useState } from 'react';
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

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/fuel-consumption-converter" category="unit-converters" />
      </div>
    </>
  );
}
