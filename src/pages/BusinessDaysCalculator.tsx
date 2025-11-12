// Business Days Calculator — matches Age Calculator UI (dark glassmorphism) with colorful tiles
import React, { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  CalendarRange,
  CalendarPlus,
  CalendarMinus,
  CalendarDays,
  Copy,
  RotateCcw,
  Info,
  ListChecks,
  ListX,
} from "lucide-react";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

const RelatedCalculators = React.lazy(() => import("../components/RelatedCalculators"));
const AdBanner = React.lazy(() => import("../components/AdBanner"));

/* ================= Helpers ================= */
const isoToday = () => new Date().toISOString().split("T")[0];
const toISO = (d: Date) => d.toISOString().split("T")[0];
const parseISO = (iso: string) => new Date(iso);

const getInitialLocal = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
};

// Weekend patterns
// mask: Set of JS getDay() numbers considered WEEKEND (0=Sun..6=Sat)
const WEEKEND_PRESETS: Record<string, { label: string; mask: number[] }> = {
  "Mon–Fri": { label: "Mon–Fri workweek (Sat+Sun off)", mask: [0, 6] },
  "Sun–Thu": { label: "Sun–Thu workweek (Fri+Sat off)", mask: [5, 6] },
  "Sat–Thu": { label: "Sat–Thu workweek (Fri off)", mask: [5] },
};

const isWeekendByMask = (d: Date, weekendMask: Set<number>) => weekendMask.has(d.getDay());
const isHoliday = (d: Date, holidays: Set<string>) => holidays.has(toISO(d));

const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

type CountResult = {
  businessDays: number;
  totalDays: number;
  weekendDays: number;
  holidays: number;
  skippedList: string[]; // weekends + holidays that were skipped
};

const enumerateDates = (start: Date, end: Date) => {
  const step = start <= end ? 1 : -1;
  const out: Date[] = [];
  let cur = new Date(start);
  out.push(new Date(cur));
  while (toISO(cur) !== toISO(end)) {
    cur = addDays(cur, step);
    out.push(new Date(cur));
  }
  return out;
};

const countBusinessBetween = (
  start: Date,
  end: Date,
  weekendMask: Set<number>,
  holidays: Set<string>,
  includeStart: boolean,
  includeEnd: boolean
): CountResult => {
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return { businessDays: 0, totalDays: 0, weekendDays: 0, holidays: 0, skippedList: [] };
  // Build list, then adjust inclusivity
  let dates = enumerateDates(start, end);
  if (!includeStart) dates = dates.slice(1);
  if (!includeEnd) dates = dates.slice(0, -1);

  let businessDays = 0, weekendDays = 0, holidayDays = 0;
  const skippedList: string[] = [];

  for (const d of dates) {
    const weekend = isWeekendByMask(d, weekendMask);
    const holiday = isHoliday(d, holidays);
    if (weekend || holiday) {
      skippedList.push(`${toISO(d)}${weekend ? " (Weekend)" : ""}${holiday ? " (Holiday)" : ""}`);
      if (weekend) weekendDays++;
      if (holiday && !weekend) holidayDays++; // if both, still count once overall skipped
    } else {
      businessDays++;
    }
  }

  return {
    businessDays,
    totalDays: dates.length,
    weekendDays,
    holidays: holidayDays,
    skippedList,
  };
};

const addBusinessDays = (
  start: Date,
  offset: number,
  weekendMask: Set<number>,
  holidays: Set<string>,
  includeStartIfBusiness: boolean
) => {
  if (offset === 0) return new Date(start);
  const dir = offset > 0 ? 1 : -1;
  let remain = Math.abs(offset);
  let cur = new Date(start);

  // If including base and it's a business day, count it as day 1 only when moving forward
  if (includeStartIfBusiness && dir > 0 && !isWeekendByMask(cur, weekendMask) && !isHoliday(cur, holidays)) {
    remain--; // today counts as first business day
    if (remain === 0) return cur;
  }

  while (remain > 0) {
    cur = addDays(cur, dir);
    if (!isWeekendByMask(cur, weekendMask) && !isHoliday(cur, holidays)) {
      remain--;
    }
  }
  return cur;
};

const compactNumber = (n: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

/* ================= Component ================= */
const BusinessDaysCalculator: React.FC = () => {
  // Tabs / modes
  const [mode, setMode] = useState<"between" | "offset">("between");

  // Between mode inputs
  const [startISO, setStartISO] = useState<string>(isoToday());
  const [endISO, setEndISO] = useState<string>(isoToday());
  const [includeStart, setIncludeStart] = useState<boolean>(() => getInitialLocal("bd_inc_start", true));
  const [includeEnd, setIncludeEnd] = useState<boolean>(() => getInitialLocal("bd_inc_end", true));

  // Offset mode inputs
  const [baseISO, setBaseISO] = useState<string>(isoToday());
  const [offset, setOffset] = useState<number>(10);
  const [includeBaseIfBusiness, setIncludeBaseIfBusiness] = useState<boolean>(() => getInitialLocal("bd_inc_base", false));
  const [offsetDirection, setOffsetDirection] = useState<"add" | "subtract">("add");

  // Common advanced controls
  const [advanced, setAdvanced] = useState<boolean>(() => getInitialLocal("bd_adv", false));
  const [weekendPreset, setWeekendPreset] = useState<string>(() => getInitialLocal("bd_wknd", "Mon–Fri"));
  const [customWeekend, setCustomWeekend] = useState<string>(() => getInitialLocal("bd_wknd_custom", ""));
  const [holidayText, setHolidayText] = useState<string>(() => getInitialLocal("bd_holidays", ""));

  // Persist
  useEffect(() => { localStorage.setItem("bd_inc_start", JSON.stringify(includeStart)); }, [includeStart]);
  useEffect(() => { localStorage.setItem("bd_inc_end", JSON.stringify(includeEnd)); }, [includeEnd]);
  useEffect(() => { localStorage.setItem("bd_inc_base", JSON.stringify(includeBaseIfBusiness)); }, [includeBaseIfBusiness]);
  useEffect(() => { localStorage.setItem("bd_adv", JSON.stringify(advanced)); }, [advanced]);
  useEffect(() => { localStorage.setItem("bd_wknd", JSON.stringify(weekendPreset)); }, [weekendPreset]);
  useEffect(() => { localStorage.setItem("bd_wknd_custom", JSON.stringify(customWeekend)); }, [customWeekend]);
  useEffect(() => { localStorage.setItem("bd_holidays", JSON.stringify(holidayText)); }, [holidayText]);

  // Derived masks/sets
  const weekendMask = useMemo(() => {
    if (weekendPreset !== "Custom") return new Set(WEEKEND_PRESETS[weekendPreset]?.mask ?? [0, 6]);
    // custom format: comma/space separated digits 0-6 (0=Sun .. 6=Sat)
    const digits = customWeekend
      .split(/[^0-9]+/)
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => Math.max(0, Math.min(6, Number(x))))
      .filter((x) => !Number.isNaN(x));
    return new Set(digits.length ? digits : [0, 6]);
  }, [weekendPreset, customWeekend]);

  const holidaysSet = useMemo(() => {
    const lines = holidayText
      .split(/\n|,|;|\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return new Set(lines);
  }, [holidayText]);

  // Calculations
  const startDate = useMemo(() => parseISO(startISO), [startISO]);
  const endDate = useMemo(() => parseISO(endISO), [endISO]);
  const baseDate = useMemo(() => parseISO(baseISO), [baseISO]);

  const betweenResult = useMemo(() => {
    if (mode !== "between") return null;
    return countBusinessBetween(startDate, endDate, weekendMask, holidaysSet, includeStart, includeEnd);
  }, [mode, startDate, endDate, weekendMask, holidaysSet, includeStart, includeEnd]);

  const targetDate = useMemo(() => {
    if (mode !== "offset") return null;
    const signed = offsetDirection === "add" ? offset : -offset;
    return addBusinessDays(baseDate, signed, weekendMask, holidaysSet, includeBaseIfBusiness);
  }, [mode, baseDate, offset, offsetDirection, weekendMask, holidaysSet, includeBaseIfBusiness]);

  // Reset
  const handleReset = useCallback(() => {
    setMode("between");
    setStartISO(isoToday());
    setEndISO(isoToday());
    setIncludeStart(true);
    setIncludeEnd(true);
    setBaseISO(isoToday());
    setOffset(10);
    setOffsetDirection("add");
    setIncludeBaseIfBusiness(false);
    setAdvanced(false);
    setWeekendPreset("Mon–Fri");
    setCustomWeekend("");
    setHolidayText("");
    if (typeof window !== "undefined") {
      [
        "bd_inc_start","bd_inc_end","bd_inc_base","bd_adv","bd_wknd","bd_wknd_custom","bd_holidays"
      ].forEach(localStorage.removeItem.bind(localStorage));
    }
  }, []);

  // Copy
  const [copied, setCopied] = useState(false);
  const copySummary = useCallback(async () => {
    let msg = "";
    if (mode === "between" && betweenResult) {
      const r = betweenResult;
      msg = `Mode: Count Between\nStart: ${startISO}${includeStart ? " (included)" : ""}\nEnd: ${endISO}${includeEnd ? " (included)" : ""}\nBusiness days: ${r.businessDays}\nTotal days counted: ${r.totalDays}\nSkipped weekends: ${r.weekendDays}\nSkipped holidays: ${r.holidays}`;
    } else if (mode === "offset" && targetDate) {
      msg = `Mode: Add/Subtract Business Days\nBase: ${baseISO}${includeBaseIfBusiness ? " (include base if business)" : ""}\nOffset: ${offsetDirection === "add" ? "+" : "-"}${offset}\nResult: ${toISO(targetDate)}`;
    }
    try { await navigator.clipboard.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }, [mode, betweenResult, startISO, endISO, includeStart, includeEnd, baseISO, includeBaseIfBusiness, offsetDirection, offset, targetDate]);

  
  /* ================= Render ================= */
  return (
    <>
      <SEOHead
          title={seoData.businessDays?.title || "Business Days Calculator – Count & Add/Subtract"}
          description={
            seoData.businessDays?.description ||
            "Count business days between two dates or add/subtract business days. Configure weekend patterns and holidays."
          }
          keywords={
            seoData.businessDays?.keywords || [
              "business days calculator",
              "work days between dates",
              "add business days",
              "skip weekends",
              "working days calculator",
              "date business day adder",
              "holiday calendar exclusion",
              "weekend pattern Sun-Thu Fri off"
            ]
          }
          canonical="https://calculatorhub.site/business-days-calculator"
          schemaData={[
            // 1) Core calculator schema (your util)
            generateCalculatorSchema(
              "Business Days Calculator",
              seoData.businessDays?.description ||
                "Count business days between dates or add/subtract business days, skipping weekends and custom holidays.",
              "/business-days-calculator",
              seoData.businessDays?.keywords || [
                "business days calculator",
                "work days between dates",
                "add business days",
                "skip weekends"
              ]
            ),
        
            // 2) WebApplication (the tool entity)
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Business Days Calculator – CalculatorHub",
              "url": "https://calculatorhub.site/business-days-calculator",
              "applicationCategory": "UtilitiesApplication",
              "operatingSystem": "Web",
              "description":
                seoData.businessDays?.description ||
                "Count workdays or add/subtract business days with weekend/holiday rules.",
              "inLanguage": "en",
              "image": [
                "https://calculatorhub.site/images/business-days-preview.webp",
                "https://calculatorhub.site/images/business-days-hero.webp"
              ],
              "publisher": {
                "@type": "Organization",
                "name": "CalculatorHub",
                "url": "https://calculatorhub.site",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://calculatorhub.site/images/calculatorhub-logo.webp"
                }
              },
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
              "datePublished": "2025-11-13",
              "dateModified": "2025-11-13",
              "keywords":
                seoData.businessDays?.keywords || [
                  "business days",
                  "workdays",
                  "weekend mask",
                  "holiday exclusion"
                ]
            },
        
            // 3) WebPage → Article (the longform content on page)
            {
              "@context": "https://schema.org",
              "@type": "WebPage",
              "mainEntity": {
                "@type": "Article",
                "headline": "Business Days Calculator — count workdays or add/subtract business days",
                "description":
                  seoData.businessDays?.description ||
                  "Two modes: count between dates or add/subtract business days with configurable weekend patterns and holidays.",
                "image": [
                  "https://calculatorhub.site/images/business-days-preview.webp",
                  "https://calculatorhub.site/images/business-days-hero.webp"
                ],
                "author": { "@type": "Organization", "name": "CalculatorHub Tools Team" },
                "publisher": {
                  "@type": "Organization",
                  "name": "CalculatorHub",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://calculatorhub.site/images/calculatorhub-logo.webp"
                  }
                },
                "datePublished": "2025-11-13",
                "dateModified": "2025-11-13",
                "articleSection": [
                  "What Is a Business Days Calculator?",
                  "How to Use",
                  "Weekend Patterns",
                  "Holidays",
                  "Inclusivity",
                  "FAQ"
                ],
                "keywords":
                  seoData.businessDays?.keywords || [
                    "workdays",
                    "business day counter",
                    "add business days"
                  ],
                "inLanguage": "en",
                "url": "https://calculatorhub.site/business-days-calculator"
              }
            },
        
            // 4) FAQPage (matches your on-page FAQ)
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How do I count business days between two dates?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text":
                      "Select start and end dates, choose inclusivity, and set your weekend pattern and holidays in Advanced Mode."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How do I add business days to a date?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text":
                      "Switch to the Add/Subtract tab, enter an offset, and the tool skips weekends/holidays to give the target date."
                  }
                }
              ]
            },
        
            // 5) BreadcrumbList
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://calculatorhub.site/" },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Date & Time Tools",
                  "item": "https://calculatorhub.site/category/date-time-tools"
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": "Business Days Calculator",
                  "item": "https://calculatorhub.site/business-days-calculator"
                }
              ]
            },
        
            // 6) WebSite + SearchAction
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
        
            // 7) Organization (sitewide)
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "CalculatorHub",
              "url": "https://calculatorhub.site",
              "logo": "https://calculatorhub.site/images/calculatorhub-logo.webp"
            },
        
            // 8) Speakable (voice assistants)
            {
              "@context": "https://schema.org",
              "@type": "SpeakableSpecification",
              "cssSelector": [".prose h1", ".result-summary"]
            }
          ]}
          breadcrumbs={[
            { name: "Date & Time Tools", url: "/category/date-time-tools" },
            { name: "Business Days Calculator", url: "/business-days-calculator" }
          ]}
        />


      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots"
        content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <link rel="canonical" href="https://calculatorhub.site/business-days-calculator" />
      

      <link rel="alternate" href="https://calculatorhub.site/business-days-calculator" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/business-days-calculator" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/business-days-calculator" hreflang="x-default" />
      
   
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Business Days Calculator – Count & Add/Subtract | CalculatorHub" />
      <meta property="og:description"
        content="Count business days or add/subtract business days. Configure weekend patterns (Mon–Fri, Sun–Thu, custom) and holidays." />
      <meta property="og:url" content="https://calculatorhub.site/business-days-calculator" />
      <meta property="og:image" content="https://calculatorhub.site/images/business-days-preview.webp" />
      <meta property="og:image:alt" content="Business Days Calculator preview" />
      

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Business Days Calculator – Count & Add/Subtract | CalculatorHub" />
      <meta name="twitter:description"
        content="Two modes: between dates or add/subtract business days. Weekend patterns + holiday exclusions." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/business-days-preview.webp" />
      

      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="theme-color" content="#10b981" />
      

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
      

      <link rel="preload" as="image" href="/images/business-days-hero.webp" />
      <link rel="preload" as="image" href="/images/business-days-preview.webp" />
      

      <meta name="referrer" content="no-referrer-when-downgrade" />


      <div className="min-h-screen w-full py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ name: "Date & Time Tools", url: "/category/date-time-tools" }, { name: "Business Days Calculator", url: "/business-days-calculator" }]} />

          {/* Hero */}
          <section className="mt-6 mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-sky-300 to-fuchsia-400 bg-clip-text text-transparent">
              Business Days Calculator
            </h1>
            <p className="mt-2 text-slate-300 max-w-2xl">Count workdays between dates or add/subtract business days from a date. Configure weekend patterns (Mon–Fri, Sun–Thu, custom) and holidays.</p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Inputs */}
            <section className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-100">Inputs</h2>
                <button onClick={handleReset} type="button" className="text-white bg-yellow-700 hover:bg-yellow-800 focus:outline-none focus:ring-4 focus:ring-yellow-300 font-medium rounded-full text-sm px-2.5 py-1.5 dark:bg-yellow-600 dark:hover:bg-yellow-700 dark:focus:ring-yellow-800" aria-label="Reset all fields">
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              {/* Mode toggle */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                <button type="button" onClick={() => setMode("between")} className={`px-3 py-2 rounded-xl border ${mode === "between" ? "border-emerald-400 bg-emerald-500/10 text-emerald-200" : "border-slate-600 bg-slate-900/40 text-slate-200"}`}>
                  <CalendarRange className="inline h-4 w-4 mr-1" /> Count Between Dates
                </button>
                <button type="button" onClick={() => setMode("offset")} className={`px-3 py-2 rounded-xl border ${mode === "offset" ? "border-sky-400 bg-sky-500/10 text-sky-200" : "border-slate-600 bg-slate-900/40 text-slate-200"}`}>
                  <CalendarPlus className="inline h-4 w-4 mr-1" /> Add/Subtract Days
                </button>
              </div>

              {mode === "between" ? (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Start Date</label>
                    <input type="date" value={startISO} onChange={(e) => setStartISO(e.target.value || isoToday())} className="w-full px-4 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                    <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
                      <input id="inc-start" type="checkbox" className="accent-emerald-500" checked={includeStart} onChange={(e) => setIncludeStart(e.target.checked)} />
                      <label htmlFor="inc-start">Include start day if it is business day</label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">End Date</label>
                    <input type="date" value={endISO} onChange={(e) => setEndISO(e.target.value || isoToday())} className="w-full px-4 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                    <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
                      <input id="inc-end" type="checkbox" className="accent-emerald-500" checked={includeEnd} onChange={(e) => setIncludeEnd(e.target.checked)} />
                      <label htmlFor="inc-end">Include end day if it is business day</label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Base Date</label>
                    <input type="date" value={baseISO} onChange={(e) => setBaseISO(e.target.value || isoToday())} className="w-full px-4 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
                    <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
                      <input id="inc-base" type="checkbox" className="accent-sky-500" checked={includeBaseIfBusiness} onChange={(e) => setIncludeBaseIfBusiness(e.target.checked)} />
                      <label htmlFor="inc-base">Include base day if it is business day (forward)</label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">Days</label>
                      <input type="number" min={0} value={offset.toString()} onChange={(e) => setOffset(Math.max(0, Number(e.target.value) || 0))} className="w-full px-4 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">Direction</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setOffsetDirection("add")} className={`px-3 py-2 rounded-xl border ${offsetDirection === "add" ? "border-sky-400 bg-sky-500/10 text-sky-200" : "border-slate-600 bg-slate-900/40 text-slate-200"}`}>
                          <CalendarPlus className="inline h-4 w-4 mr-1" /> Add
                        </button>
                        <button type="button" onClick={() => setOffsetDirection("subtract")} className={`px-3 py-2 rounded-xl border ${offsetDirection === "subtract" ? "border-pink-400 bg-pink-500/10 text-pink-200" : "border-slate-600 bg-slate-900/40 text-slate-200"}`}>
                          <CalendarMinus className="inline h-4 w-4 mr-1" /> Subtract
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced toggle */}
              <div className="mt-6 rounded-xl p-4 bg-slate-900/50 border border-slate-700">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-slate-200 font-medium">Advanced Mode</div>
                  <button onClick={() => setAdvanced(!advanced)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-100 border border-white/10 hover:bg-slate-700">{advanced ? "Hide" : "Show"}</button>
                </div>

                {advanced && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-1">Weekend Pattern</label>
                      <select className="w-full px-3 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500" value={weekendPreset} onChange={(e) => setWeekendPreset(e.target.value)}>
                        {Object.keys(WEEKEND_PRESETS).map((k) => (
                          <option key={k} value={k}>{WEEKEND_PRESETS[k].label}</option>
                        ))}
                        <option value="Custom">Custom days (0=Sun..6=Sat)</option>
                      </select>
                    </div>

                    {weekendPreset === "Custom" && (
                      <div>
                        <label className="block text-sm font-medium text-slate-200 mb-1">Custom Weekend Days</label>
                        <input type="text" placeholder="e.g., 5,6 or 0 6" value={customWeekend} onChange={(e) => setCustomWeekend(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <p className="text-xs text-slate-400 mt-1">Enter digits 0–6 separated by comma/space. Example: "5,6" for Fri+Sat.</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-1">Custom Holidays</label>
                      <textarea rows={3} placeholder="YYYY-MM-DD, YYYY-MM-DD\n2025-02-21, 2025-03-17" value={holidayText} onChange={(e) => setHolidayText(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <p className="text-xs text-slate-400 mt-1">Comma/line separated. Exact YYYY-MM-DD matches only.</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Right: Results */}
            <section className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">Results</h2>

              <div className="space-y-6">
                {/* Primary card */}
                {mode === "between" && betweenResult && (
                  <div className="text-center p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 via-sky-500/15 to-fuchsia-500/15 border border-emerald-400/30">
                    <Briefcase className="h-8 w-8 text-emerald-300 mx-auto mb-2" aria-hidden="true" />
                    <div className="text-2xl font-bold text-slate-100">{betweenResult.businessDays}</div>
                    <div className="text-sm text-slate-300">Business Days</div>
                    <div className="text-xs text-slate-400 mt-1">{startISO}{includeStart ? " (incl)" : ""} → {endISO}{includeEnd ? " (incl)" : ""}</div>
                  </div>
                )}

                {mode === "offset" && targetDate && (
                  <div className="text-center p-4 rounded-xl bg-gradient-to-r from-sky-500/15 via-emerald-500/15 to-fuchsia-500/15 border border-sky-400/30">
                    <CalendarDays className="h-8 w-8 text-sky-300 mx-auto mb-2" aria-hidden="true" />
                    <div className="text-2xl font-bold text-slate-100">{toISO(targetDate)}</div>
                    <div className="text-sm text-slate-300">Target Date</div>
                    <div className="text-xs text-slate-400 mt-1">Base {baseISO} • {offsetDirection === "add" ? "+" : "-"}{offset} business day(s)</div>
                  </div>
                )}

                {/* Stat tiles */}
                {mode === "between" && betweenResult && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl text-center bg-violet-500/10 border border-violet-400/20">
                        <div className="text-xl font-semibold text-slate-100">{betweenResult.totalDays}</div>
                        <div className="text-sm text-violet-300">Total Counted</div>
                      </div>
                      <div className="p-4 rounded-xl text-center bg-amber-500/10 border border-amber-400/20">
                        <div className="text-xl font-semibold text-slate-100">{betweenResult.weekendDays}</div>
                        <div className="text-sm text-amber-300">Weekend Days</div>
                      </div>
                      <div className="p-4 rounded-xl text-center bg-rose-500/10 border border-rose-400/20">
                        <div className="text-xl font-semibold text-slate-100">{betweenResult.holidays}</div>
                        <div className="text-sm text-rose-300">Holiday Matches</div>
                      </div>
                    </div>

                    {/* Skipped list */}
                    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                      <div className="flex items-center gap-2 text-slate-200 font-semibold mb-2"><ListX className="h-5 w-5" /> Skipped Dates</div>
                      {betweenResult.skippedList.length ? (
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-300 max-h-48 overflow-auto pr-1">
                          {betweenResult.skippedList.map((t) => (
                            <li key={t} className="px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700">{t}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-400">No weekends/holidays within the counted range.</p>
                      )}
                    </div>
                  </>
                )}

                <div className="flex items-center gap-3">
                  <button onClick={copySummary} className="px-3 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-500 transition-colors shadow-sm"><Copy className="inline h-4 w-4 mr-1" /> {copied ? "Copied!" : "Copy"}</button>
                  {copied && <span className="text-teal-300 text-sm">Summary copied</span>}
                </div>
              </div>
            </section>
          </div>

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
                <li><a href="#what-is-bdc" className="text-indigo-300 hover:underline">What Is a Business Days Calculator?</a></li>
                <li><a href="#features" className="text-indigo-300 hover:underline">Key Features</a></li>
                <li><a href="#how-to-use" className="text-indigo-300 hover:underline">How to Use This Tool</a></li>
                <li><a href="#methods" className="text-indigo-300 hover:underline">Methods & Logic Under the Hood</a></li>
                <li><a href="#worked-examples" className="text-indigo-300 hover:underline">Worked Examples</a></li>
                <li><a href="#weekend-patterns" className="text-indigo-300 hover:underline">Weekend Patterns & Regional Workweeks</a></li>
                <li><a href="#holidays" className="text-indigo-300 hover:underline">Holiday Lists: Format, Scope & Tips</a></li>
                <li><a href="#inclusivity" className="text-indigo-300 hover:underline">Inclusivity (Include Start/End Day)</a></li>
                <li><a href="#performance" className="text-indigo-300 hover:underline">Performance, Precision & Limits</a></li>
                <li><a href="#pitfalls" className="text-indigo-300 hover:underline">Common Pitfalls & How to Avoid Them</a></li>
                <li><a href="#use-cases" className="text-indigo-300 hover:underline">Popular Use Cases</a></li>
                <li><a href="#quick-ref" className="text-indigo-300 hover:underline">Quick Reference Table</a></li>
                <li><a href="#glossary" className="text-indigo-300 hover:underline">Glossary</a></li>
                <li><a href="#faq" className="text-indigo-300 hover:underline">FAQ</a></li>
              </ol>
            </nav>
          
            {/* ===== What is it? ===== */}
            <h1 id="what-is-bdc" className="text-3xl font-bold text-indigo-300 mb-6">
              Business Days Calculator — count workdays or add/subtract business days with precision
            </h1>
            <p>
              The <strong>Business Days Calculator</strong> is a practical utility for scheduling, operations, compliance, and project management.
              It answers two essential questions: <em>How many working days fall between two dates?</em> and <em>What date is N business days from a given base date?</em> 
              The tool automatically <strong>skips weekends</strong> and any <strong>custom holidays</strong> you provide, while letting you define a
              region-specific <strong>workweek pattern</strong> (Mon–Fri, Sun–Thu, Fri off, or fully custom).
            </p>
            <p>
              Whether you’re planning a sprint, quoting lead times, computing SLAs, or aligning international schedules, this calculator gives a clear, auditable result with configurable inclusivity and advanced controls—without spreadsheets or guesswork.
            </p>
          
            {/* ===== Features ===== */}
            <h2 id="features" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              ✨ Key Features
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Two modes:</strong> <em>Count Between Dates</em> and <em>Add/Subtract Business Days</em>.</li>
              <li><strong>Weekend presets:</strong> Mon–Fri (Sat+Sun off), Sun–Thu (Fri+Sat off), Sat–Thu (Fri off), plus <em>Custom</em>.</li>
              <li><strong>Holiday list:</strong> paste YYYY-MM-DD dates (comma or line separated) to exclude them from counts.</li>
              <li><strong>Inclusivity toggles:</strong> include/exclude start and end days; include base day in forward offsets.</li>
              <li><strong>Skipped breakdown:</strong> see how many days were excluded due to weekends vs. holidays, with a detailed list.</li>
              <li><strong>Copy summary:</strong> one click to copy a clean text summary for tickets, emails, and audit trails.</li>
              <li><strong>Persistent settings:</strong> Advanced options persist locally for a smooth return experience.</li>
            </ul>
          
            {/* ===== How to Use ===== */}
            <h2 id="how-to-use" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">🧭 How to Use This Tool</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Choose a mode: <strong>Count Between Dates</strong> or <strong>Add/Subtract Days</strong>.</li>
              <li>Enter your date(s):
                <ul className="list-disc list-inside ml-5 mt-1">
                  <li><em>Between</em>: set <strong>Start</strong> and <strong>End</strong>; toggle <em>Include</em> for start/end as needed.</li>
                  <li><em>Offset</em>: set a <strong>Base Date</strong>, an integer <strong>Days</strong> value, and a <strong>Direction</strong> (Add/Subtract). Optionally include the base day if it’s a business day.</li>
                </ul>
              </li>
              <li>Open <strong>Advanced Mode</strong> to set your <strong>Weekend Pattern</strong> and paste <strong>Holiday</strong> dates.</li>
              <li>Read the <strong>Results</strong> panel for the business-day count or target date, plus a breakdown of skipped days.</li>
              <li>Click <strong>Copy</strong> to export a concise, shareable summary.</li>
            </ol>
            <p className="text-sm text-slate-400">
              Tip: Use ISO format (<code>YYYY-MM-DD</code>) to avoid regional ambiguity (MM/DD vs DD/MM).
            </p>
          
            {/* ===== Methods & Logic ===== */}
            <h2 id="methods" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              🔧 Methods & logic under the hood
            </h2>
            <h3 className="text-xl font-semibold text-indigo-300">1) Counting business days between two dates</h3>
            <p>
              We enumerate calendar days between the start and end (respecting <em>Include Start</em>/<em>Include End</em>), and for each date check:
              <em>Is it a weekend per your pattern?</em> and <em>Is it a listed holiday?</em> If either is true, the date is <strong>skipped</strong>; otherwise it’s a <strong>business day</strong>.
              We also tally how many days were skipped for each reason.
            </p>
          
            <h3 className="text-xl font-semibold text-indigo-300 mt-6">2) Adding/subtracting business days from a base date</h3>
            <p>
              Starting from the base date, we move forward (or backward) one calendar day at a time, counting only dates that are not weekends or holidays. 
              If you enable <em>Include base if business</em> and you’re adding days, the base day can count as day 1 when it qualifies as a business day.
            </p>
          
            <h3 className="text-xl font-semibold text-indigo-300 mt-6">3) Custom weekend masks</h3>
            <p>
              A weekend mask is a set of weekday indices (0=Sun…6=Sat) that should be treated as <em>non-working</em>. Presets configure common masks instantly.
              You can also enter a custom mask such as <code>5,6</code> (Fri+Sat off) or <code>0 6</code> (Sun+Sat off).
            </p>
          
            {/* ===== Worked Examples ===== */}
            <h2 id="worked-examples" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              🧪 Worked examples
            </h2>
            <ul className="space-y-2">
              <li><strong>Count Between:</strong> Start = 2025-01-06 (Mon), End = 2025-01-10 (Fri), Mon–Fri workweek, no holidays, include both → <strong>5 business days</strong>.</li>
              <li><strong>Count Between with holiday:</strong> Same as above but 2025-01-08 is a holiday → <strong>4 business days</strong>, skipped: 1 holiday.</li>
              <li><strong>Offset forward:</strong> Base = 2025-03-10 (Mon), +10 business days, Mon–Fri, include base if business → <strong>2025-03-21 (Fri)</strong>.</li>
              <li><strong>Offset backward:</strong> Base = 2025-03-10 (Mon), −3 business days, Mon–Fri → <strong>2025-03-05 (Wed)</strong>.</li>
              <li><strong>Sun–Thu workweek:</strong> Count 2025-05-01 (Thu) to 2025-05-05 (Mon), Fri+Sat off. With both included, business days = Thu + Sun + Mon → <strong>3</strong>.</li>
            </ul>
          
            {/* ===== Weekend Patterns ===== */}
            <h2 id="weekend-patterns" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              🗓️ Weekend patterns & regional workweeks
            </h2>
            <p>
              Not every region observes Saturday and Sunday as the weekend. Some Middle-Eastern calendars are <em>Sun–Thu</em> workweeks (Fri+Sat off); others give only <em>Friday off</em>. 
              Using a configurable weekend mask ensures your calculation reflects real staffing and service availability.
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Mon–Fri:</strong> Saturday and Sunday are excluded.</li>
              <li><strong>Sun–Thu:</strong> Friday and Saturday are excluded.</li>
              <li><strong>Sat–Thu (Fri off):</strong> only Friday is excluded.</li>
              <li><strong>Custom:</strong> enter any combination of 0–6 to match local policy.</li>
            </ul>
          
            {/* ===== Holidays ===== */}
            <h2 id="holidays" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              🎉 Holiday lists: format, scope & tips
            </h2>
            <p>
              Holidays are matched by exact <code>YYYY-MM-DD</code> strings. You can paste dates separated by commas or new lines.
              Consider maintaining separate lists for national holidays, religious observances, maintenance shutdowns, or company-wide off days.
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Format strictly:</strong> e.g., <code>2025-01-01</code>, <code>2025-02-21</code>, <code>2025-12-25</code>.</li>
              <li><strong>No partial ranges:</strong> list every off-day explicitly if a closure spans multiple dates.</li>
              <li><strong>Overlap behavior:</strong> if a date is both weekend <em>and</em> holiday, it’s counted once as <em>skipped</em>, and not a business day.</li>
            </ul>
          
            {/* ===== Inclusivity ===== */}
            <h2 id="inclusivity" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              ➕/➖ Inclusivity (Include Start/End Day)
            </h2>
            <p>
              Inclusivity defines whether the boundary days can be counted as business days if they qualify. 
              For <em>Between</em> mode, toggling <strong>Include Start</strong> and <strong>Include End</strong> lets you mirror contract language like “within 10 business days, inclusive.”
              For <em>Offset</em>, <strong>Include base if business</strong> allows the base day to count as day 1 when adding days forward.
            </p>
          
            {/* ===== Performance ===== */}
            <h2 id="performance" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              🚀 Performance, precision & limits
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Browser-friendly:</strong> Date iteration is lightweight and instantaneous for typical ranges.</li>
              <li><strong>Time zones:</strong> Calculations use your system’s local time. For cross-border agreements, standardize inputs to a single time zone and use ISO dates.</li>
              <li><strong>Large spans:</strong> Very long ranges remain fast, but keep holiday lists tidy for clarity and maintainability.</li>
            </ul>
          
            {/* ===== Pitfalls ===== */}
            <h2 id="pitfalls" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              ⚠️ Common pitfalls & how to avoid them
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Ambiguous date formats:</strong> always use ISO (<code>YYYY-MM-DD</code>).</li>
              <li><strong>Wrong weekend pattern:</strong> confirm local/contractual definitions (e.g., Fri+Sat off).</li>
              <li><strong>Missing holidays:</strong> ensure your list includes floating holidays and one-off closures.</li>
              <li><strong>Inclusivity mismatch:</strong> align toggles with wording in SLAs, RFQs, or legal clauses.</li>
              <li><strong>Backwards offsets:</strong> remember that including the base day applies only when moving forward.</li>
            </ul>
          
            {/* ===== Use Cases ===== */}
            <h2 id="use-cases" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              🧰 Popular use cases
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Lead time promises:</strong> shipping, manufacturing, or onboarding in “X business days.”</li>
              <li><strong>Sprint planning:</strong> compute effective working time between ceremonies and release dates.</li>
              <li><strong>Compliance & SLAs:</strong> verify due dates that exclude weekends and recognized holidays.</li>
              <li><strong>HR & payroll:</strong> count payable workdays in a range with custom closures.</li>
              <li><strong>Education & events:</strong> ensure sessions land on working days for facilities and staff.</li>
            </ul>
          
            {/* ===== Quick Reference ===== */}
            <h2 id="quick-ref" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              🗂️ Quick reference table (sample scenarios)
            </h2>
            <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-300">
                    <th className="py-2 pr-4">Mode</th>
                    <th className="py-2 pr-4">Inputs</th>
                    <th className="py-2 pr-4">Weekend</th>
                    <th className="py-2 pr-4">Holidays</th>
                    <th className="py-2">Result</th>
                  </tr>
                </thead>
                <tbody className="text-slate-200">
                  <tr>
                    <td className="py-2 pr-4">Between</td>
                    <td className="py-2 pr-4">2025-01-06 → 2025-01-10 (incl)</td>
                    <td className="py-2 pr-4">Mon–Fri</td>
                    <td className="py-2 pr-4">—</td>
                    <td className="py-2">5 business days</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Between</td>
                    <td className="py-2 pr-4">2025-01-06 → 2025-01-10 (incl)</td>
                    <td className="py-2 pr-4">Mon–Fri</td>
                    <td className="py-2 pr-4">2025-01-08</td>
                    <td className="py-2">4 business days</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Offset +</td>
                    <td className="py-2 pr-4">Base 2025-03-10, +10 (include base)</td>
                    <td className="py-2 pr-4">Mon–Fri</td>
                    <td className="py-2 pr-4">—</td>
                    <td className="py-2">2025-03-21</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Offset −</td>
                    <td className="py-2 pr-4">Base 2025-03-10, −3</td>
                    <td className="py-2 pr-4">Mon–Fri</td>
                    <td className="py-2 pr-4">—</td>
                    <td className="py-2">2025-03-05</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Between</td>
                    <td className="py-2 pr-4">2025-05-01 → 2025-05-05 (incl)</td>
                    <td className="py-2 pr-4">Sun–Thu</td>
                    <td className="py-2 pr-4">—</td>
                    <td className="py-2">3 business days</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-xs text-slate-400 mt-2">
                “Incl” = include that boundary day if it’s a business day. Holidays list uses exact YYYY-MM-DD matches.
              </p>
            </div>
          
            {/* ===== Glossary ===== */}
            <h2 id="glossary" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">📚 Glossary</h2>
            <p className="space-y-2">
              <strong>Business day:</strong> A calendar date that is not a weekend and not a listed holiday. <br/>
              <strong>Weekend mask:</strong> The set of weekday indices (0=Sun…6=Sat) considered non-working. <br/>
              <strong>Inclusivity:</strong> Whether to count the start/end (or base) day when it qualifies as a business day. <br/>
              <strong>Offset:</strong> Adding/subtracting N business days from a base date to get a target date. <br/>
              <strong>Skipped list:</strong> The specific dates excluded due to weekend/holiday rules.
            </p>
          
            {/* ===== FAQ ===== */}
            <section className="space-y-6 mt-16">
              <h2 id="faq" className="text-3xl md:text-4xl font-bold mb-4 text-center text-indigo-200">
                ❓ Frequently Asked Questions (FAQ)
              </h2>
          
              <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q1: How do “include start” and “include end” change the count?</h3>
                  <p>
                    If enabled, the boundary is counted when it qualifies as a business day. This mirrors contractual wording like “within N business days, inclusive.”
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q2: Can I use only Friday as the weekend?</h3>
                  <p>
                    Yes. Choose <em>Sat–Thu (Fri off)</em> or set a custom weekend mask to <code>5</code> (Friday) for Friday-only closures.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q3: What happens if a date is both a weekend and a holiday?</h3>
                  <p>
                    It’s still excluded just once. The skipped list will note both labels, and it won’t count toward business days.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q4: Are observed holidays supported?</h3>
                  <p>
                    Supply the observed date(s) explicitly in your holiday list (e.g., if a fixed-date holiday falls on a weekend and your policy observes Monday).
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q5: Do time zones affect the calculation?</h3>
                  <p>
                    Calculations use your local system time. For cross-border teams, standardize inputs to a single time zone and use ISO dates to avoid confusion.
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
                  to="/weekday-finder"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-200 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
                >
                  📅 Weekday Finder
                </Link>
                <Link
                  to="/age-calculator"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-amber-600/20 text-amber-300 hover:text-amber-200 px-3 py-2 rounded-md border border-slate-700 hover:border-amber-500 transition-all duration-200"
                >
                  👶 Age Calculator
                </Link>
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  );
};

export default BusinessDaysCalculator;
