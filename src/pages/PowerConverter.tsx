import React, { useEffect, useMemo, useRef, useState } from 'react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

/* ---------------- Icons (inline, no deps) ---------------- */
const Icon = {
  Bolt: (p: any) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...p} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
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

/* ---------------- Units ----------------
   Each unit defines toW/fromW (W = watts).
   For linear units we derive functions from a factor.
----------------------------------------*/
type Unit = {
  key: string;
  name: string;
  toW: (v: number) => number;
  fromW: (w: number) => number;
};
function linearUnit(key: string, name: string, factorToW: number): Unit {
  return {
    key, name,
    toW: (v) => v * factorToW,
    fromW: (w) => w / factorToW,
  };
}

const POWER_UNITS: Unit[] = [
  // SI
  linearUnit('mW', 'Milliwatt (mW)', 1e-3),
  linearUnit('W',  'Watt (W)',       1),
  linearUnit('kW', 'Kilowatt (kW)',  1e3),
  linearUnit('MW', 'Megawatt (MW)',  1e6),
  linearUnit('GW', 'Gigawatt (GW)',  1e9),

  // Heat / refrigeration
  linearUnit('BTU/h', 'BTU per hour (BTU/h)', 0.29307107),                 // 1 BTU/h = 0.29307107 W
  linearUnit('kcal/h', 'Kilocalorie per hour (kcal/h)', 1.1622222222222223),// 1 kcal/h ≈ 1.162222... W
  linearUnit('cal/s', 'Calorie per second (cal/s)', 4.1868),                // 1 cal/s = 4.1868 W
  linearUnit('TR', 'Ton of refrigeration (TR)', 3516.85284),                // 1 TR = 12000 BTU/h ≈ 3.51685284 kW

  // Horsepower
  linearUnit('hp(M)', 'Horsepower (metric, PS)', 735.49875),                // metric hp
  linearUnit('hp',    'Horsepower (mechanical)', 745.6998715822702),        // mechanical hp

  // Logarithmic
  {
    key: 'dBm',
    name: 'dBm (decibel-milliwatt)',
    toW: (v: number) => Math.pow(10, v / 10) * 1e-3,                        // W = 10^(dBm/10) * 1 mW
    fromW: (w: number) => 10 * Math.log10(w / 1e-3),                        // dBm = 10 log10(W / 1 mW)
  },
  {
    key: 'dBW',
    name: 'dBW (decibel-watt)',
    toW: (v: number) => Math.pow(10, v / 10),                                // W = 10^(dBW/10)
    fromW: (w: number) => 10 * Math.log10(w),                                // dBW = 10 log10(W / 1 W)
  },
];

const unitMap: Record<string, Unit> = Object.fromEntries(POWER_UNITS.map(u => [u.key, u]));
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
function convertPower(value: number, fromKey: string, toKey: string) {
  const f = unitMap[fromKey], t = unitMap[toKey];
  if (!f || !t) return NaN;
  const watts = f.toW(value);
  return t.fromW(watts);
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
export default function PowerConverter() {
  const [valueStr, setValueStr] = useState('');
  const [fromUnit, setFromUnit] = useState('kW');
  const [toUnit, setToUnit] = useState('hp');
  const [formatMode, setFormatMode] = useState<typeof FORMAT_MODES[number]>('normal');
  const [precision, setPrecision] = useState(6);
  const [favorites, setFavorites] = useLocalStorage<string[]>('power:favorites', ['W','kW','MW','hp','hp(M)','BTU/h','dBm','dBW']);
  const [history, setHistory] = useLocalStorage<any[]>('power:history', []);

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

  // Direct & grid
  const direct = useMemo(() => convertPower(valueNum, fromUnit, toUnit), [valueNum, fromUnit, toUnit]);
  const gridResults = useMemo(() => {
    const baseW = unitMap[fromUnit]?.toW(valueNum) ?? 0;
    const out: Record<string, number> = {};
    for (const u of POWER_UNITS) if (u.key !== fromUnit) out[u.key] = u.fromW(baseW);
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
        a.href = url; a.download = 'power-conversion.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
      }
    } catch {}
  }

  const favored = POWER_UNITS.filter(u => favorites.includes(u.key));
  const unfavored = POWER_UNITS.filter(u => !favorites.includes(u.key));
  const hasInput = (valueStr || '').trim() !== '';

  return (
    <>
     {/** ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Power Converter — W ⇄ kW ⇄ MW ⇄ hp ⇄ BTU/h ⇄ TR ⇄ dBm ⇄ dBW"
        description="Fast, precise power conversions across watts, kilowatts, megawatts, horsepower, BTU/h, kilocalories per hour, tons of refrigeration, plus logarithmic units dBm and dBW. Features precision control, Normal/Compact/Scientific formats, favorites, history, CSV export, and shareable URLs."
        keywords={[
          "power converter",
          "kW to hp",
          "hp to kW",
          "W to BTU/h",
          "BTU/h to W",
          "TR to kW",
          "kcal/h to W",
          "cal/s to W",
          "dBm to W",
          "dBW to W",
          "megawatt to horsepower",
          "gigawatt to megawatt",
          "metric horsepower to watts",
          "mechanical horsepower to watts",
          "ton of refrigeration conversion"
        ]}
        canonical="https://calculatorhub.site/power-converter"
        schemaData={[
          /* 1) WebPage + Article */
          {
            "@context":"https://schema.org",
            "@type":"WebPage",
            "@id":"https://calculatorhub.site/power-converter#webpage",
            "url":"https://calculatorhub.site/power-converter",
            "name":"Power Converter — W, kW, MW, hp, BTU/h, TR, dBm, dBW",
            "inLanguage":"en",
            "isPartOf":{"@id":"https://calculatorhub.site/#website"},
            "primaryImageOfPage":{
              "@type":"ImageObject",
              "@id":"https://calculatorhub.site/images/power-converter-hero.webp#primaryimg",
              "url":"https://calculatorhub.site/images/power-converter-hero.webp",
              "width":1200,"height":675
            },
            "mainEntity":{
              "@type":"Article",
              "@id":"https://calculatorhub.site/power-converter#article",
              "headline":"Power Converter — Linear & Logarithmic Units (dBm/dBW)",
              "description":"Convert W, kW, MW, hp, BTU/h, kcal/h, TR and logarithmic units dBm/dBW with precision controls, keyboard shortcuts, favorites, history and CSV export.",
              "image":["https://calculatorhub.site/images/power-converter-hero.webp"],
              "author":{"@type":"Organization","name":"CalculatorHub","url":"https://calculatorhub.site"},
              "publisher":{"@id":"https://calculatorhub.site/#organization"},
              "datePublished":"2025-11-09",
              "dateModified":"2025-11-09",
              "mainEntityOfPage":{"@id":"https://calculatorhub.site/power-converter#webpage"},
              "articleSection":[
                "Supported Units",
                "Linear vs Logarithmic",
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
            "@id":"https://calculatorhub.site/power-converter#breadcrumbs",
            "itemListElement":[
              {"@type":"ListItem","position":1,"name":"Home","item":"https://calculatorhub.site/"},
              {"@type":"ListItem","position":2,"name":"Unit Converters","item":"https://calculatorhub.site/category/unit-converters"},
              {"@type":"ListItem","position":3,"name":"Power Converter","item":"https://calculatorhub.site/power-converter"}
            ]
          },
      
          /* 3) FAQ */
          {
            "@context":"https://schema.org",
            "@type":"FAQPage",
            "@id":"https://calculatorhub.site/power-converter#faq",
            "mainEntity":[
              {
                "@type":"Question",
                "name":"What is the difference between mechanical hp and metric hp?",
                "acceptedAnswer":{"@type":"Answer","text":"Mechanical horsepower ≈ 745.69987 W; metric horsepower (PS) ≈ 735.49875 W. Select hp or hp(M) accordingly."}
              },
              {
                "@type":"Question",
                "name":"How do you convert dBm and dBW?",
                "acceptedAnswer":{"@type":"Answer","text":"They are logarithmic power levels. dBm references 1 mW, dBW references 1 W. Conversions use: W = 10^(dBm/10)×1 mW and W = 10^(dBW/10)."}
              },
              {
                "@type":"Question",
                "name":"What is a ton of refrigeration (TR)?",
                "acceptedAnswer":{"@type":"Answer","text":"1 TR = 12,000 BTU/h ≈ 3.51685284 kW. The tool converts TR directly to W/kW and vice versa."}
              },
              {
                "@type":"Question",
                "name":"Do you support CSV export and copy?",
                "acceptedAnswer":{"@type":"Answer","text":"Yes. Use Copy All for a clipboard list or export a CSV of the results grid."}
              },
              {
                "@type":"Question",
                "name":"Are compact and scientific formats available?",
                "acceptedAnswer":{"@type":"Answer","text":"Yes. Choose Normal, Compact, or Scientific and set decimals from 0–12 for precise formatting."}
              }
            ]
          },
      
          /* 4) WebApplication */
          {
            "@context":"https://schema.org",
            "@type":"WebApplication",
            "@id":"https://calculatorhub.site/power-converter#webapp",
            "name":"Power Converter",
            "url":"https://calculatorhub.site/power-converter",
            "applicationCategory":"UtilitiesApplication",
            "operatingSystem":"Web",
            "description":"Convert power units including W, kW, MW, hp, BTU/h, kcal/h, TR, dBm and dBW with shareable links and CSV export.",
            "publisher":{"@id":"https://calculatorhub.site/#organization"},
            "image":["https://calculatorhub.site/images/power-converter-hero.webp"]
          },
      
          /* 5) SoftwareApplication */
          {
            "@context":"https://schema.org",
            "@type":"SoftwareApplication",
            "@id":"https://calculatorhub.site/power-converter#software",
            "name":"Advanced Power Converter",
            "applicationCategory":"UtilitiesApplication",
            "operatingSystem":"All",
            "url":"https://calculatorhub.site/power-converter",
            "publisher":{"@id":"https://calculatorhub.site/#organization"},
            "description":"Interactive converter for linear and logarithmic power units."
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
      <link rel="canonical" href="https://calculatorhub.site/power-converter" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/power-converter" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/power-converter" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/power-converter" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Power Converter — W, kW, MW, hp, BTU/h, TR, dBm, dBW" />
      <meta property="og:description" content="Convert kW↔hp, W↔BTU/h, TR↔kW, kcal/h↔W, dBm/dBW↔W with precision controls, favorites, history and CSV export." />
      <meta property="og:url" content="https://calculatorhub.site/power-converter" />
      <meta property="og:image" content="https://calculatorhub.site/images/power-converter-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Power converter UI showing kW ↔ hp and dBm ↔ W conversions" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Power Converter — kW↔hp, W↔BTU/h, TR, dBm/dBW" />
      <meta name="twitter:description" content="Lightning-fast power conversions with Normal/Compact/Scientific formats and CSV export." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/power-converter-hero.webp" />
      <meta name="twitter:creator" content="@CalculatorHub" />
      <meta name="twitter:site" content="@CalculatorHub" />
      
      {/** PWA & theme */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#1f0a00" />
      
      {/** Performance */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="preload" as="image" href="/images/power-converter-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />


      <div className="max-w-5xl mx-auto text-gray-200">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Power Converter', url: '/power-converter' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 rounded-2xl p-6 bg-gradient-to-r from-amber-900 via-orange-900 to-rose-900 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">Power Converter (Advanced)</h1>
          <p className="text-gray-300">
            Linear & logarithmic units (dBm/dBW), precision control, favorites, history, shareable links.
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
                  aria-label="Enter power value"
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
            {(fromUnit === 'dBm' || toUnit === 'dBm' || fromUnit === 'dBW' || toUnit === 'dBW') && (
              <div className="mt-2 text-xs text-amber-200/80">
                Note: dBm/dBW are logarithmic (reference: 1 mW and 1 W). Conversions use 10·log10(P/Pref).
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
            {POWER_UNITS.map((unit) => {
              if (unit.key === fromUnit) return null;
              const val = gridResults[unit.key];
              const display = formatNumber(val ?? 0, formatMode, precision);
              return (
                <div key={unit.key} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:bg-gray-700/70 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon.Bolt style={{ width: 16, height: 16, color: '#fb923c' }} />
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

      {/* ==================== SEO Content: Power Converter (EN) ==================== */}
      <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-amber-300">Power Converter — W, kW, MW, hp, BTU/h, TR, dBm, dBW</h1>
          <p className="mt-2 text-slate-300">
            Whether you’re sizing HVAC systems, comparing motor drives, or working with RF power,
            this tool converts both <strong>linear</strong> units (W, kW, MW, hp, BTU/h, kcal/h, TR)
            and <strong>logarithmic</strong> units (dBm, dBW) with precision. Adjust decimals, pick Normal/Compact/Scientific
            formats, pin favorites, review history, and export via Copy or CSV. Shareable URLs preserve your current state.
          </p>
        </header>
      
        {/* TOC */}
        <nav className="mt-2 mb-10 bg-[#1a0e09] border border-[#3a271e] rounded-xl p-5 text-slate-200">
          <h2 className="text-lg font-semibold text-gray-100 mb-3">📖 Table of Contents</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li><a href="#en-how" className="text-amber-300 hover:underline">How to Use</a></li>
            <li><a href="#en-units" className="text-amber-300 hover:underline">Supported Units & Constants</a></li>
            <li><a href="#en-linear-vs-log" className="text-amber-300 hover:underline">Linear vs Logarithmic</a></li>
            <li><a href="#en-examples" className="text-amber-300 hover:underline">Worked Examples</a></li>
            <li><a href="#en-accuracy" className="text-amber-300 hover:underline">Accuracy, Rounding & Tips</a></li>
            <li><a href="#en-quickref" className="text-amber-300 hover:underline">Quick Reference</a></li>
            <li><a href="#en-faq" className="text-amber-300 hover:underline">FAQ</a></li>
          </ol>
        </nav>
      
        {/* How to use */}
        <h2 id="en-how" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">💡 How to Use</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Enter a number in <strong>Value</strong> (empty = 0; commas like <code>1,234.56</code> allowed).</li>
          <li>Select <strong>From</strong> and <strong>To</strong> units; pin frequent ones with <strong>Fav</strong>.</li>
          <li>Open <strong>More options</strong> to set <strong>Precision</strong> (0–12) and <strong>Format</strong>.</li>
          <li>Use <strong>Copy All</strong> or <strong>CSV</strong> export to capture the full grid.</li>
          <li>Revisit your last 10 conversions in <strong>Recent</strong> (stored locally).</li>
        </ol>
        <p className="text-xs text-slate-400">The page URL encodes your current configuration—bookmark or share for exact reproduction.</p>
      
        {/* Units */}
        <h2 id="en-units" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">🌐 Supported Units & Constants</h2>
        <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <li><strong>SI (linear)</strong>: mW, W, kW, MW, GW</li>
            <li><strong>Horsepower</strong>: hp (mechanical), hp(M) / PS (metric)</li>
            <li><strong>Heat/HVAC</strong>: BTU/h, kcal/h, cal/s, TR (Ton of Refrigeration)</li>
            <li><strong>Log units</strong>: dBm (ref: 1 mW), dBW (ref: 1 W)</li>
          </ul>
          <p className="mt-3 text-slate-400 text-xs leading-relaxed">
            Constants used: 1 BTU/h = <strong>0.29307107 W</strong>;
            1 kcal/h ≈ <strong>1.1622222222 W</strong>;
            1 cal/s = <strong>4.1868 W</strong>;
            1 TR = <strong>12,000 BTU/h ≈ 3.51685284 kW</strong>;
            hp (mechanical) ≈ <strong>745.6998716 W</strong>;
            hp(M)/PS ≈ <strong>735.49875 W</strong>.
          </p>
        </div>
      
        {/* Linear vs Log */}
        <h2 id="en-linear-vs-log" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">📐 Linear vs Logarithmic</h2>
        <p className="mb-2">Linear units convert by ratios (e.g., <code>kW = W / 1000</code>).</p>
        <p className="mb-2">Logarithmic units measure level relative to a reference:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>dBm → W</strong>: <code>W = 10^(dBm/10) × 1e-3</code></li>
          <li><strong>W → dBm</strong>: <code>dBm = 10·log10(W / 1e-3)</code></li>
          <li><strong>dBW → W</strong>: <code>W = 10^(dBW/10)</code></li>
          <li><strong>W → dBW</strong>: <code>dBW = 10·log10(W)</code></li>
        </ul>
        <p className="text-sm text-slate-400 mt-2">
          Use dBm/dBW in RF/telecom contexts; W/kW/hp/BTU/h/TR dominate mechanical and HVAC use cases.
        </p>
      
        {/* Examples */}
        <h2 id="en-examples" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">📈 Worked Examples (rounded)</h2>
        <ul className="space-y-2">
          <li><strong>1 kW → hp</strong> (mechanical): 1000 ÷ 745.6998716 ≈ <strong>1.341 hp</strong></li>
          <li><strong>10 hp → kW</strong> (mechanical): 10 × 745.6998716 ÷ 1000 ≈ <strong>7.456998716 kW</strong></li>
          <li><strong>12,000 BTU/h → kW</strong>: 12,000 × 0.29307107 ÷ 1000 ≈ <strong>3.51685284 kW</strong> (= 1 TR)</li>
          <li><strong>2 TR → kW</strong>: 2 × 3.51685284 ≈ <strong>7.03370568 kW</strong></li>
          <li><strong>500 kcal/h → W</strong>: 500 × 1.1622222222 ≈ <strong>581.11 W</strong></li>
          <li><strong>30 dBm → W</strong>: 10^(30/10) × 1e-3 = <strong>1 W</strong></li>
          <li><strong>1 W → dBm</strong>: 10·log10(1/1e-3) = <strong>30 dBm</strong></li>
        </ul>
      
        {/* Accuracy */}
        <h2 id="en-accuracy" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">✅ Accuracy, Rounding & Tips</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Bridge conversions through <strong>watts (W)</strong> to minimize error.</li>
          <li>Keep higher internal precision; round for display/reporting only.</li>
          <li>Choose the correct horsepower: <strong>hp</strong> (mechanical) vs <strong>hp(M)</strong> (metric/PS).</li>
          <li>Document HVAC factors (BTU/h, TR) in specs for repeatability and audits.</li>
        </ul>
      
        {/* Quick Reference */}
        <h2 id="en-quickref" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">🗂️ Quick Reference</h2>
        <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <li>1 kW = <strong>1000 W</strong></li>
            <li>1 MW = <strong>10⁶ W</strong></li>
            <li>1 GW = <strong>10⁹ W</strong></li>
            <li>1 hp (mechanical) ≈ <strong>745.6998716 W</strong></li>
            <li>1 hp(M)/PS ≈ <strong>735.49875 W</strong></li>
            <li>1 BTU/h = <strong>0.29307107 W</strong></li>
            <li>1 TR = <strong>12,000 BTU/h ≈ 3.51685284 kW</strong></li>
            <li>1 kcal/h ≈ <strong>1.1622222222 W</strong></li>
            <li>1 cal/s = <strong>4.1868 W</strong></li>
            <li>dBm ref = <strong>1 mW</strong>, dBW ref = <strong>1 W</strong></li>
          </ul>
        </div>
      
        {/* FAQ */}
        <h2 id="en-faq" className="text-2xl font-semibold text-amber-200 mt-10 mb-4">❓ Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-amber-300">What’s the difference between mechanical and metric horsepower?</h3>
            <p>Mechanical hp ≈ 745.6998716 W; metric hp (PS) ≈ 735.49875 W. Choose based on your regional or project standard.</p>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-amber-300">How do I convert dBm and dBW?</h3>
            <p>They’re logarithmic power levels relative to 1 mW (dBm) and 1 W (dBW). Use <code>W = 10^(dBm/10)×1e-3</code> and <code>W = 10^(dBW/10)</code>.</p>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-amber-300">What exactly is 1 TR?</h3>
            <p>Ton of Refrigeration: 1 TR = 12,000 BTU/h ≈ 3.51685284 kW, a standard unit for cooling capacity in HVAC.</p>
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
                Specialists in engineering & HVAC conversions. Last updated:
                <time dateTime="2025-11-09"> November 9, 2025</time>.
              </p>
            </div>
          </div>
      
          <div className="mt-8 bg-gradient-to-r from-amber-900/30 via-orange-900/30 to-rose-900/30 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">🚀 Explore more tools on CalculatorHub:</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <a
                href="/time-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-200 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
              >
                ⏱️ Time Converter
              </a>
              <a
                href="/data-storage-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-cyan-600/20 text-cyan-300 hover:text-cyan-200 px-3 py-2 rounded-md border border-slate-700 hover:border-cyan-500 transition-all duration-200"
              >
                💾 Data Storage Converter
              </a>
              <a
                href="/mass-weight-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-200 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
              >
                ⚖️ Mass / Weight Converter
              </a>
            </div>
          </div>
        </section>
      </section>



        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/power-converter" category="unit-converters" />
      </div>
    </>
  );
}
