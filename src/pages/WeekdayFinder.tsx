// Weekday Finder — follows Age Calculator UI pattern (dark glassmorphism, 2-col, stat tiles, Advanced Mode)
import React, { useEffect, useMemo, useState, useCallback, Suspense } from "react";
import { Calendar, CalendarSearch, Copy, RotateCcw, Globe2, Info, ListChecks } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

const RelatedCalculators = React.lazy(() => import("../components/RelatedCalculators"));
const AdBanner = React.lazy(() => import("../components/AdBanner"));

/* ================= Helpers ================= */
const isoToday = () => new Date().toISOString().split("T")[0];
const clampISO = (v: string) => {
  const d = new Date(v || Date.now());
  if (isNaN(d.getTime())) return isoToday();
  return d.toISOString().split("T")[0];
};

// ISO week number (ISO-8601, Monday first, week with Jan-4 is week 1)
const isoWeekNumber = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // Sun=0 => 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // nearest Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return weekNo;
};

const dayOfYear = (date: Date) => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
};

const locales = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "bn-BD", label: "Bangla (Bangladesh)" },
  { code: "hi-IN", label: "Hindi (India)" },
  { code: "ar-SA", label: "Arabic (Saudi)" },
  { code: "de-DE", label: "German" },
  { code: "fr-FR", label: "French" },
  { code: "es-ES", label: "Spanish" },
  { code: "pt-BR", label: "Portuguese (BR)" },
  { code: "ja-JP", label: "Japanese" },
  { code: "ko-KR", label: "Korean" },
  { code: "zh-CN", label: "Chinese (CN)" },
];

const getInitialLocal = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
};

/* ================= Component ================= */
const WeekdayFinder: React.FC = () => {
  const [dateISO, setDateISO] = useState<string>(isoToday());
  const [advanced, setAdvanced] = useState<boolean>(() => getInitialLocal("wd_adv", false));
  const [locale, setLocale] = useState<string>(() => getInitialLocal("wd_locale", "en-US"));
  const [weekStartsOnMonday, setWeekStartsOnMonday] = useState<boolean>(() => getInitialLocal("wd_mon", true));
  const [listCount, setListCount] = useState<number>(() => getInitialLocal("wd_list_count", 5));
  const [copied, setCopied] = useState(false);

  useEffect(() => { localStorage.setItem("wd_adv", JSON.stringify(advanced)); }, [advanced]);
  useEffect(() => { localStorage.setItem("wd_locale", JSON.stringify(locale)); }, [locale]);
  useEffect(() => { localStorage.setItem("wd_mon", JSON.stringify(weekStartsOnMonday)); }, [weekStartsOnMonday]);
  useEffect(() => { localStorage.setItem("wd_list_count", JSON.stringify(listCount)); }, [listCount]);

  const dateObj = useMemo(() => new Date(dateISO), [dateISO]);
  const valid = useMemo(() => !isNaN(dateObj.getTime()), [dateObj]);

  const weekdayLong = useMemo(() => valid ? new Intl.DateTimeFormat(locale, { weekday: "long" }).format(dateObj) : "—", [valid, locale, dateObj]);
  const weekdayShort = useMemo(() => valid ? new Intl.DateTimeFormat(locale, { weekday: "short" }).format(dateObj) : "—", [valid, locale, dateObj]);
  const isWeekend = useMemo(() => valid ? [0,6].includes(dateObj.getDay()) : false, [valid, dateObj]);
  const isoWeek = useMemo(() => valid ? isoWeekNumber(dateObj) : 0, [valid, dateObj]);
  const doy = useMemo(() => valid ? dayOfYear(dateObj) : 0, [valid, dateObj]);
  const quarter = useMemo(() => valid ? Math.floor(dateObj.getMonth() / 3) + 1 : 0, [valid, dateObj]);

  const weekNoByStart = useMemo(() => {
    if (!valid) return 0;
    // Compute week number depending on chosen week start
    const d = new Date(dateObj);
    const day = d.getDay();
    const startDiff = weekStartsOnMonday ? ((day + 6) % 7) : day; // days since chosen week start
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - startDiff);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const ms = weekStart.getTime() - yearStart.getTime();
    return Math.floor(ms / 604800000) + 1;
  }, [valid, dateObj, weekStartsOnMonday]);

  const sameWeekdayNext = useMemo(() => {
    if (!valid) return [] as string[];
    const out: string[] = [];
    let cursor = new Date(dateObj);
    for (let i = 0; i < Math.max(0, listCount); i++) {
      cursor = new Date(cursor);
      cursor.setDate(cursor.getDate() + 7);
      out.push(cursor.toISOString().split("T")[0]);
    }
    return out;
  }, [valid, dateObj, listCount]);

  const handleReset = useCallback(() => {
    setDateISO(isoToday());
    setAdvanced(false);
    setLocale("en-US");
    setWeekStartsOnMonday(true);
    setListCount(5);
    if (typeof window !== "undefined") {
      localStorage.removeItem("wd_adv");
      localStorage.removeItem("wd_locale");
      localStorage.removeItem("wd_mon");
      localStorage.removeItem("wd_list_count");
    }
  }, []);

  const summary = useMemo(() => {
    if (!valid) return "Invalid date";
    return `Date: ${dateISO}\nWeekday: ${weekdayLong} (${weekdayShort})\nWeekend: ${isWeekend ? "Yes" : "No"}\nISO Week: ${isoWeek}\nWeek # (custom start): ${weekNoByStart}\nDay of Year: ${doy}\nQuarter: Q${quarter}`;
  }, [valid, dateISO, weekdayLong, weekdayShort, isWeekend, isoWeek, weekNoByStart, doy, quarter]);

  const copySummary = useCallback(async () => {
    try { await navigator.clipboard.writeText(summary); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }, [summary]);




  /* ================= Render ================= */
  return (
    <>
      <SEOHead
            title={seoData.weekdayFinder?.title || "Weekday Finder – What Day Is It?"}
            description={seoData.weekdayFinder?.description || "Enter a date to instantly see the weekday name, weekend status, ISO week number, and day-of-year. Advanced options for locale and week start."}
            keywords={seoData.weekdayFinder?.keywords || ["weekday finder","day of week","what day was it","iso week number","day of year","weekday in bangla"]}
            canonical="https://calculatorhub.site/weekday-finder"
            schemaData={[
              // 1) Base calculator schema (kept pattern)
              generateCalculatorSchema(
                "Weekday Finder",
                seoData.weekdayFinder?.description || "Find the weekday for any date with ISO week number, day of year, and locale options.",
                "/weekday-finder",
                seoData.weekdayFinder?.keywords || ["weekday finder","day of week","what day was it","iso week number","day of year","weekday in bangla"]
              ),
          
              // 2) WebApplication (rich app details)
              {
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": "Weekday Finder – CalculatorHub",
                "url": "https://calculatorhub.site/weekday-finder",
                "applicationCategory": "UtilitiesApplication",
                "operatingSystem": "Web",
                "description": seoData.weekdayFinder?.description || "Enter a date to see weekday, weekend status, ISO/custom week number, day-of-year, and quarter.",
                "inLanguage": "en",
                "image": [
                  "https://calculatorhub.site/images/weekday-finder-preview.webp",
                  "https://calculatorhub.site/images/weekday-finder-hero.webp"
                ],
                "publisher": {
                  "@type": "Organization",
                  "name": "CalculatorHub",
                  "url": "https://calculatorhub.site",
                  "logo": { "@type": "ImageObject", "url": "https://calculatorhub.site/images/calculatorhub-logo.webp" }
                },
                "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
                "datePublished": "2025-11-12",
                "dateModified": "2025-11-12",
                "keywords": seoData.weekdayFinder?.keywords || ["weekday finder","day of week","what day was it","iso week number","day of year","weekday in bangla"]
              },
          
              // 3) WebPage -> Article (explainer)
              {
                "@context": "https://schema.org",
                "@type": "WebPage",
                "mainEntity": {
                  "@type": "Article",
                  "headline": "Weekday Finder — Determine Day of Week, ISO Week and More",
                  "description": seoData.weekdayFinder?.description || "See weekday name, weekend flag, ISO/custom week number, day-of-year and quarter for any date.",
                  "image": [
                    "https://calculatorhub.site/images/weekday-finder-preview.webp",
                    "https://calculatorhub.site/images/weekday-finder-hero.webp"
                  ],
                  "author": { "@type": "Organization", "name": "CalculatorHub Tools Team" },
                  "publisher": {
                    "@type": "Organization",
                    "name": "CalculatorHub",
                    "logo": { "@type": "ImageObject", "url": "https://calculatorhub.site/images/calculatorhub-logo.webp" }
                  },
                  "datePublished": "2025-11-12",
                  "dateModified": "2025-11-12",
                  "articleSection": [
                    "What Is a Weekday Finder?",
                    "Key Features",
                    "How to Use",
                    "Methods & Concepts",
                    "ISO vs Custom Week",
                    "Localization",
                    "FAQ"
                  ],
                  "inLanguage": "en",
                  "url": "https://calculatorhub.site/weekday-finder",
                  "about": { "@type": "Thing", "name": "Weekday & Week Number" },
                  "keywords": seoData.weekdayFinder?.keywords || ["weekday finder","day of week","iso week number","custom week number","day of year","quarter"]
                }
              },
          
              // 4) FAQPage (focused Q&A)
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "How do I find the weekday of a date?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Enter or pick any date. The tool shows the weekday name, weekend status, ISO week number, day of year and more."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Can I change language of weekday names?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes. In Advanced Mode, choose a locale (e.g., Bangla, English UK/US, Arabic) and the weekday names update instantly."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "What is the difference between ISO week and custom week?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "ISO weeks start Monday and week 1 contains Jan 4. Custom week lets you pick Sunday or Monday start to match regional practice."
                    }
                  }
                ]
              },
          
              // 5) Breadcrumbs (match your UI)
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://calculatorhub.site/" },
                  { "@type": "ListItem", "position": 2, "name": "Date & Time Tools", "item": "https://calculatorhub.site/category/date-time-tools" },
                  { "@type": "ListItem", "position": 3, "name": "Weekday Finder", "item": "https://calculatorhub.site/weekday-finder" }
                ]
              },
          
              // 6) WebSite + SiteLinks Search
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "CalculatorHub",
                "url": "https://calculatorhub.site",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://calculatorhub.site/search?q={query}",
                  "query-input": "required name=query"
                }
              },
          
              // 7) Speakable (voice surfaces; optional)
              {
                "@context": "https://schema.org",
                "@type": "SpeakableSpecification",
                "cssSelector": [".main-title", ".result-summary"]
              }
            ]}
            breadcrumbs={[
              { name: "Date & Time Tools", url: "/category/date-time-tools" },
              { name: "Weekday Finder", url: "/weekday-finder" }
            ]}
          />


        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <link rel="canonical" href="https://calculatorhub.site/weekday-finder" />

        <link rel="alternate" href="https://calculatorhub.site/weekday-finder" hreflang="en" />
        <link rel="alternate" href="https://calculatorhub.site/bn/weekday-finder" hreflang="bn" />
        <link rel="alternate" href="https://calculatorhub.site/weekday-finder" hreflang="x-default" />
        

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="CalculatorHub" />
        <meta property="og:title" content="Weekday Finder — What Day Is It?" />
        <meta property="og:description" content="See weekday name, weekend flag, ISO/custom week number, day-of-year and quarter for any date. Locale support & Advanced Mode." />
        <meta property="og:url" content="https://calculatorhub.site/weekday-finder" />
        <meta property="og:image" content="https://calculatorhub.site/images/weekday-finder-preview.webp" />
        <meta property="og:image:alt" content="Weekday Finder UI preview" />
        

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Weekday Finder — What Day Is It?" />
        <meta name="twitter:description" content="Instant weekday + ISO/custom week number, day-of-year & quarter. Advanced locale options." />
        <meta name="twitter:image" content="https://calculatorhub.site/images/weekday-finder-preview.webp" />
        

        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0ea5e9" />
        

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        

        <link rel="preload" as="image" href="/images/weekday-finder-hero.webp" />
        <link rel="preload" as="image" href="/images/weekday-finder-preview.webp" />
        
     
        <meta name="referrer" content="no-referrer-when-downgrade" />



      <div className="min-h-screen w-full py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ name: "Date & Time Tools", url: "/category/date-time-tools" }, { name: "Weekday Finder", url: "/weekday-finder" }]} />

          {/* Hero */}
          <section className="mt-6 mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-sky-400 via-emerald-300 to-fuchsia-400 bg-clip-text text-transparent">
              Weekday Finder
            </h1>
            <p className="mt-2 text-slate-300 max-w-2xl">Pick a date to see the weekday instantly. Get weekend status, ISO week number, day-of-year, and upcoming same weekdays. Change language in Advanced Mode.</p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Inputs */}
            <section className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-100">Date Input</h2>
                <button onClick={handleReset} type="button" className="text-white bg-yellow-700 hover:bg-yellow-800 focus:outline-none focus:ring-4 focus:ring-yellow-300 font-medium rounded-full text-sm px-2.5 py-1.5 dark:bg-yellow-600 dark:hover:bg-yellow-700 dark:focus:ring-yellow-800" aria-label="Reset all fields">
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-slate-200 mb-2">Select Date</label>
                  <input id="date" type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value || isoToday())} className="w-full px-4 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
                </div>

                {/* Inline info */}
                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-300 text-sm flex items-start gap-2">
                  <Info className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                  <p>Week numbers shown include both ISO-8601 (Mon-first) and a custom week number based on your chosen week start in Advanced Mode.</p>
                </div>
              </div>
            </section>

            {/* Results */}
            <section className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">Results</h2>

              <div className="space-y-6">
                {/* Primary card */}
                <div className="text-center p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 via-sky-500/15 to-fuchsia-500/15 border border-emerald-400/30">
                  <Calendar className="h-8 w-8 text-emerald-300 mx-auto mb-2" aria-hidden="true" />
                  <div className="text-2xl font-bold text-slate-100">{weekdayLong}</div>
                  <div className="text-sm text-slate-300">{weekdayShort} • {dateISO}</div>
                </div>

                {/* Stat tiles */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl text-center bg-violet-500/10 border border-violet-400/20">
                    <div className="text-xl font-semibold text-slate-100">{isWeekend ? "Weekend" : "Weekday"}</div>
                    <div className="text-sm text-violet-300">Day Type</div>
                  </div>
                  <div className="p-4 rounded-xl text-center bg-amber-500/10 border border-amber-400/20">
                    <div className="text-xl font-semibold text-slate-100">ISO {isoWeek}</div>
                    <div className="text-sm text-amber-300">ISO Week Number</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl text-center bg-sky-500/10 border border-sky-400/20">
                    <div className="text-xl font-semibold text-slate-100">{weekNoByStart}</div>
                    <div className="text-sm text-sky-300">Week # (custom)</div>
                  </div>
                  <div className="p-4 rounded-xl text-center bg-teal-500/10 border border-teal-400/20">
                    <div className="text-xl font-semibold text-slate-100">{doy}</div>
                    <div className="text-sm text-teal-300">Day of Year</div>
                  </div>
                  <div className="p-4 rounded-xl text-center bg-rose-500/10 border border-rose-400/20">
                    <div className="text-xl font-semibold text-slate-100">Q{quarter}</div>
                    <div className="text-sm text-rose-300">Quarter</div>
                  </div>
                </div>

                {/* Next same weekdays */}
                {valid && (
                  <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                    <div className="flex items-center gap-2 text-slate-200 font-semibold mb-2"><ListChecks className="h-5 w-5" /> Next {listCount} {weekdayShort} dates</div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-300">
                      {sameWeekdayNext.map((d) => (
                        <li key={d} className="px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700">{d}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button onClick={copySummary} className="px-3 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-500 transition-colors shadow-sm">
                    <Copy className="inline h-4 w-4 mr-1" /> {copied ? "Copied!" : "Copy"}
                  </button>
                  {copied && <span className="text-teal-300 text-sm">Summary copied</span>}
                </div>
              </div>
            </section>
          </div>

          {/* Advanced Mode */}
          <section className="mt-8 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-semibold text-slate-100">Advanced Mode</h2>
                <button onClick={() => setAdvanced(!advanced)} className="px-4 py-2 rounded-xl bg-slate-900/60 text-slate-100 hover:bg-slate-800 transition-colors border border-white/10">
                  {advanced ? "Hide Advanced Mode" : "Show Advanced Mode"}
                </button>
              </div>

              {advanced && (
                <div className="space-y-6 transition-all duration-300 ease-out">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-1 flex items-center gap-1">
                        Locale <Globe2 className="h-3.5 w-3.5 text-slate-400" />
                      </label>
                      <select className="w-full px-3 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500" value={locale} onChange={(e) => setLocale(e.target.value)}>
                        {locales.map((l) => (
                          <option key={l.code} value={l.code}>{l.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-1">Week Starts On</label>
                      <select className="w-full px-3 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500" value={weekStartsOnMonday ? "mon" : "sun"} onChange={(e) => setWeekStartsOnMonday(e.target.value === "mon") }>
                        <option value="mon">Monday</option>
                        <option value="sun">Sunday</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-1">List Count</label>
                      <input type="number" min={0} max={30} className="w-full px-3 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500" value={listCount} onChange={(e) => setListCount(Math.max(0, Math.min(30, Number(e.target.value) || 0)))} />
                      <p className="text-xs text-slate-400 mt-1">How many upcoming same weekdays should we list?</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <Suspense fallback={null}>
            <div className="my-8">
              <AdBanner type="bottom" />
            </div>
          </Suspense>

          {/* ===================== SEO Content (~1800–2000 words) ===================== */}
          <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          
            {/* ===== Table of Contents ===== */}
            <nav className="mt-2 mb-10 bg-[#0b1220] border border-[#1f2a44] rounded-xl p-5 text-slate-200">
              <h2 className="text-lg font-semibold text-gray-100 mb-3">📖 Table of Contents</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li><a href="#what-is-weekday-finder" className="text-indigo-300 hover:underline">What Is a Weekday Finder?</a></li>
                <li><a href="#features" className="text-indigo-300 hover:underline">Key Features</a></li>
                <li><a href="#how-to-use" className="text-indigo-300 hover:underline">How to Use This Tool</a></li>
                <li><a href="#methods" className="text-indigo-300 hover:underline">Methods & Concepts Behind the Results</a></li>
                <li><a href="#worked-examples" className="text-indigo-300 hover:underline">Worked Examples</a></li>
                <li><a href="#iso-week-vs-custom" className="text-indigo-300 hover:underline">ISO Week Number vs. Custom Week Number</a></li>
                <li><a href="#localization" className="text-indigo-300 hover:underline">Localization & Locale Options</a></li>
                <li><a href="#performance" className="text-indigo-300 hover:underline">Performance, Precision & Limits</a></li>
                <li><a href="#pitfalls" className="text-indigo-300 hover:underline">Common Pitfalls & How to Avoid Them</a></li>
                <li><a href="#use-cases" className="text-indigo-300 hover:underline">Popular Use Cases</a></li>
                <li><a href="#quick-ref" className="text-indigo-300 hover:underline">Quick Reference Table</a></li>
                <li><a href="#glossary" className="text-indigo-300 hover:underline">Glossary</a></li>
                <li><a href="#faq" className="text-indigo-300 hover:underline">FAQ</a></li>
              </ol>
            </nav>
          
            {/* ===== What is it? ===== */}
            <h1 id="what-is-weekday-finder" className="text-3xl font-bold text-indigo-300 mb-6">
              Weekday Finder — determine the day of week, week numbers, and more
            </h1>
            <p>
              The <strong>Weekday Finder</strong> instantly tells you what day of the week a date falls on. Beyond a simple weekday label,
              it shows whether the date is a <em>weekend or weekday</em>, the <strong>ISO week number</strong>, a <strong>custom week number</strong> based on your preferred week start, the <strong>day of year</strong> (ordinal), and the calendar <strong>quarter</strong>. 
              You can also list the next <em>N</em> occurrences of the same weekday—for quick scheduling and planning.
            </p>
            <p>
              The tool follows a clean, accessible design and supports multiple <strong>locales</strong>, so weekday names can appear in English, Bangla, Arabic, Spanish, and more. 
              That makes it helpful for international teams, global events, and region-specific calendars.
            </p>
          
            {/* ===== Features ===== */}
            <h2 id="features" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              ✨ Key Features
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Instant weekday name:</strong> long and short forms (e.g., <em>Wednesday</em> / <em>Wed</em>).</li>
              <li><strong>Weekend detection:</strong> quickly see if the chosen date is a weekend or standard business day.</li>
              <li><strong>ISO week number:</strong> the global standard (ISO-8601) where weeks start on Monday and week 1 is the week with January 4.</li>
              <li><strong>Custom week number:</strong> define week start as Monday or Sunday to match your region or workplace policy.</li>
              <li><strong>Day of year & quarter:</strong> useful for analytics, reporting, and fiscal/academic calendars.</li>
              <li><strong>Upcoming same weekdays:</strong> generate the next <em>N</em> dates that fall on the same weekday—handy for meetings or classes.</li>
              <li><strong>Localization:</strong> switch locales to present weekday names in different languages.</li>
            </ul>
          
            {/* ===== How to Use ===== */}
            <h2 id="how-to-use" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">🧭 How to Use This Tool</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Pick a <strong>date</strong> with the date input.</li>
              <li>Review the primary card for the <strong>weekday name</strong> (long + short) and the selected date.</li>
              <li>Check the <strong>stat tiles</strong> for Weekend/Weekday, <strong>ISO week number</strong>, <strong>custom week number</strong>, <strong>day of year</strong>, and <strong>quarter</strong>.</li>
              <li>Open <strong>Advanced Mode</strong> to:
                <ul className="list-disc list-inside ml-5 mt-1">
                  <li>Change the <strong>locale</strong> for weekday names (e.g., English, Bangla, Arabic, French).</li>
                  <li>Choose whether the week starts on <strong>Monday</strong> or <strong>Sunday</strong>.</li>
                  <li>Set how many upcoming same weekdays (<em>List Count</em>) to display.</li>
                </ul>
              </li>
              <li>Click <strong>Copy</strong> to save a concise text summary for notes, emails, or tickets.</li>
            </ol>
            <p className="text-sm text-slate-400">
              Tip: Use <em>List Count</em> to pre-populate recurring events (e.g., the next 8 Mondays).
            </p>

            <AdBanner type="bottom" />
            {/* ===== Methods & Concepts ===== */}
            <h2 id="methods" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              🔧 Methods & concepts behind the results
            </h2>
          
            <h3 className="text-xl font-semibold text-indigo-300">1) Determining the weekday</h3>
            <p>
              Every date maps to a weekday index (0–6) with Sunday or Monday as the start of week depending on your context. 
              We use modern browser date APIs and locale-aware formatters to render both long (<em>Monday</em>) and short (<em>Mon</em>) names.
            </p>
          
            <h3 className="text-xl font-semibold text-indigo-300 mt-6">2) ISO week number (ISO-8601)</h3>
            <p>
              ISO-8601 defines <strong>Monday</strong> as the first day of the week. 
              <strong>Week 1</strong> is the week that contains <strong>January 4</strong> (or, equivalently, the first Thursday of the year). 
              This avoids partial weeks and makes week numbers consistent across years and regions that adopt ISO standards.
            </p>
          
            <h3 className="text-xl font-semibold text-indigo-300 mt-6">3) Custom week number (Monday or Sunday start)</h3>
            <p>
              Many workplaces and regions prefer <em>Sunday-first</em> calendars. The custom week number lets you align the calculation to your policy:
              pick Monday or Sunday as the start of week and compute the week index accordingly from the year’s beginning.
            </p>
          
            <h3 className="text-xl font-semibold text-indigo-300 mt-6">4) Day of year & quarter</h3>
            <p>
              The <strong>day of year</strong> is the ordinal position (1–365/366) of a date within its calendar year. 
              The <strong>quarter</strong> is computed from the month: Q1 = Jan–Mar, Q2 = Apr–Jun, Q3 = Jul–Sep, Q4 = Oct–Dec.
            </p>
          
            <h3 className="text-xl font-semibold text-indigo-300 mt-6">5) Upcoming same weekdays</h3>
            <p>
              To list the next occurrences of the same weekday, we simply add 7 days repeatedly to the selected date—producing an ordered list of future dates that fall on the same weekday.
            </p>
          
            {/* ===== Worked Examples ===== */}
            <h2 id="worked-examples" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              🧪 Worked examples
            </h2>
            <ul className="space-y-2">
              <li><strong>Date:</strong> 2025-01-01 → <em>Wednesday</em> (weekday), ISO week often <em>1</em>; day-of-year = 1; quarter = Q1.</li>
              <li><strong>Date:</strong> 2025-07-04 → <em>Friday</em> (weekday); ISO week ≈ mid-year; day-of-year ≈ 185; quarter = Q3.</li>
              <li><strong>Date:</strong> 2025-12-28 → <em>Sunday</em> (weekend); pay attention to ISO rollover—the ISO week may be week 52 or 1 of the next year depending on how the week spans the new year.</li>
              <li><strong>Custom week start:</strong> If you switch week start to Sunday, the custom week number can differ from ISO for the same date.</li>
            </ul>
          
            {/* ===== ISO vs Custom ===== */}
            <h2 id="iso-week-vs-custom" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              📅 ISO week number vs. custom week number
            </h2>
            <p>
              <strong>ISO week number</strong> is standardized and widely used in international reporting, manufacturing, and logistics. 
              <strong>Custom week number</strong> mirrors regional or organizational norms—especially where Sunday is the observed start of the week. 
              If you’re aligning with global partners, ISO is typically preferred. If you’re reflecting local habits, custom may be more intuitive.
            </p>
            <AdBanner type="bottom" />
          
            {/* ===== Localization ===== */}
            <h2 id="localization" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              🌍 Localization & locale options
            </h2>
            <p>
              Weekday names change with the selected <strong>locale</strong>. Choose from English (US/UK), Bangla, Arabic, German, French, Spanish, Portuguese (BR), Japanese, Korean, Chinese (CN), and more. 
              Localization affects <em>display</em> labels only—the underlying date math remains the same.
            </p>
            <p className="text-sm text-slate-400">
              Note: Using ISO date inputs (<code>YYYY-MM-DD</code>) avoids ambiguity across regions that format dates differently (e.g., DD/MM vs. MM/DD).
            </p>
          
            {/* ===== Performance ===== */}
            <h2 id="performance" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              🚀 Performance, precision & limits
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Lightweight:</strong> The calculations are trivial for modern browsers; results are instant.</li>
              <li><strong>Time zone:</strong> The picker uses your system’s local time zone. For cross-border comparisons, align on a single time zone or use UTC dates.</li>
              <li><strong>Large lists:</strong> Generating many future dates is still fast; cap <em>List Count</em> (e.g., ≤ 30) for readability.</li>
            </ul>
          
            {/* ===== Pitfalls ===== */}
            <h2 id="pitfalls" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              ⚠️ Common pitfalls & how to avoid them
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Ambiguous date formats:</strong> stick to ISO (<code>YYYY-MM-DD</code>) to avoid day/month swaps.</li>
              <li><strong>Week start mismatch:</strong> make sure teammates know whether you’re using ISO (Mon-first) or Sunday-first custom weeks.</li>
              <li><strong>Year rollover:</strong> dates near New Year can belong to next year’s ISO week 1—don’t assume week numbers reset exactly on Jan 1.</li>
              <li><strong>Locale expectations:</strong> changing locale affects labels (weekday names) but not the underlying math—communicate this in reports.</li>
            </ul>
          
            {/* ===== Use Cases ===== */}
            <h2 id="use-cases" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              🧰 Popular use cases
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Scheduling:</strong> pick consistent meeting days (e.g., “every Wednesday”) and list upcoming dates.</li>
              <li><strong>Operations:</strong> assign week numbers to production batches, sprints, or releases.</li>
              <li><strong>Education:</strong> map lessons/exams to weekdays and calculate term-week indices.</li>
              <li><strong>Compliance:</strong> ensure filings or deadlines align with the correct business week.</li>
              <li><strong>Events:</strong> verify if a holiday lands on a weekday or weekend for staffing decisions.</li>
            </ul>
          
            {/* ===== Quick Reference ===== */}
            <h2 id="quick-ref" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              🗂️ Quick reference table (sample dates)
            </h2>
            <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-300">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Weekday</th>
                    <th className="py-2 pr-4">Weekend?</th>
                    <th className="py-2 pr-4">ISO Week</th>
                    <th className="py-2 pr-4">Custom Week (Sun-first)</th>
                    <th className="py-2">Day of Year / Quarter</th>
                  </tr>
                </thead>
                <tbody className="text-slate-200">
                  <tr>
                    <td className="py-2 pr-4">2025-01-01</td>
                    <td className="py-2 pr-4">Wednesday</td>
                    <td className="py-2 pr-4">No</td>
                    <td className="py-2 pr-4">1</td>
                    <td className="py-2 pr-4">1</td>
                    <td className="py-2">1 / Q1</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">2025-07-06</td>
                    <td className="py-2 pr-4">Sunday</td>
                    <td className="py-2 pr-4">Yes</td>
                    <td className="py-2 pr-4">27</td>
                    <td className="py-2 pr-4">28</td>
                    <td className="py-2">187 / Q3</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">2025-12-29</td>
                    <td className="py-2 pr-4">Monday</td>
                    <td className="py-2 pr-4">No</td>
                    <td className="py-2 pr-4">1 (next year)</td>
                    <td className="py-2 pr-4">53</td>
                    <td className="py-2">363 / Q4</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-xs text-slate-400 mt-2">
                ISO week can roll over to week 1 of the next year even before December ends, depending on where the Thursday falls.
              </p>
            </div>
          
            {/* ===== Glossary ===== */}
            <h2 id="glossary" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">📚 Glossary</h2>
            <p className="space-y-2">
              <strong>ISO-8601:</strong> International date/time standard; Monday is the first day of the week; week 1 contains Jan 4. <br/>
              <strong>ISO week number:</strong> The week index per ISO-8601; used in global reporting and logistics. <br/>
              <strong>Custom week number:</strong> A week index computed from your chosen week start (Monday or Sunday). <br/>
              <strong>Day of year (DOY):</strong> Ordinal day 1–365/366 indicating position within the year. <br/>
              <strong>Quarter (Q1–Q4):</strong> Three-month blocks used for fiscal and academic planning.
            </p>
          
            {/* ===== FAQ ===== */}
            <section className="space-y-6 mt-16">
              <h2 id="faq" className="text-3xl md:text-4xl font-bold mb-4 text-center text-indigo-200">
                ❓ Frequently Asked Questions (FAQ)
              </h2>
          
              <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q1: Why does my ISO week look different from my calendar app?</h3>
                  <p>
                    Some apps display Sunday-first week views while still labeling ISO numbers (Mon-first). Verify whether your app is showing ISO or a regional week index.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q2: Can I use Sunday as the first day of the week?</h3>
                  <p>
                    Yes. Switch to Sunday in Advanced Mode to compute the <em>custom</em> week number that matches US-style calendars and many workplaces.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q3: Do locale changes affect the actual calculation?</h3>
                  <p>
                    No. Locale changes only affect weekday <em>names</em> and formatting. All date math remains the same.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q4: Why does the ISO week sometimes belong to the next year?</h3>
                  <p>
                    ISO weeks are tied to full weeks. If the majority of the week lies in the next year (or the week contains Jan 4 of the next year), it becomes ISO week 1 of that year.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q5: Can I copy the results easily?</h3>
                  <p>
                    Yes. Use the Copy button to export a neatly formatted summary: weekday (long/short), weekend status, ISO and custom week numbers, day of year, and quarter.
                  </p>
                </div>
          
              </div>
            </section>
          </section>
          
          {/* ========= Cross-links ========= */}
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
                  Specialists in date & time utilities. Last updated: <time dateTime="2025-11-12">November 12, 2025</time>.
                </p>
              </div>
            </div>
          
            <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
              <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
                🚀 Explore more tools on CalculatorHub:
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link
                  to="/date-difference-calculator"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-200 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
                >
                  ⏳ Date Difference Calculator
                </Link>
                <Link
                  to="/age-calculator"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-200 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
                >
                  👶 Age Calculator
                </Link>
                <Link
                  to="/time-duration-calculator"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-amber-600/20 text-amber-300 hover:text-amber-200 px-3 py-2 rounded-md border border-slate-700 hover:border-amber-500 transition-all duration-200"
                >
                  ⏱️ Time Duration Calculator
                </Link>
              </div>
            </div>
          </section>

        </div>
      </div>
    </> 
  );
};

export default WeekdayFinder;
