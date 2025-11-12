// src/pages/WeekNumberFinder.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Hash,
  Copy,
  Share2,
  RotateCcw,
  Info,
  CalendarClock,
  CalendarRange,
  BookOpenText,
} from "lucide-react";

import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import AdBanner from "../components/AdBanner";
import RelatedCalculators from "../components/RelatedCalculators";
import { generateCalculatorSchema } from "../utils/seoData";

/* ============================================================
   📦 Constants & Utilities
   ============================================================ */
const LS_KEY = "week_number_finder_v2";
const URL_KEY = "wnf2";

const two = (n: number) => String(n).padStart(2, "0");
const fmtISO = (d: Date) =>
  `${d.getUTCFullYear()}-${two(d.getUTCMonth() + 1)}-${two(d.getUTCDate())}`;
const fmtHuman = (d: Date) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "2-digit",
    weekday: "short",
  }).format(d);

/** Parse local date-only (YYYY-MM-DD) into a UTC date at 00:00 */
function parseLocalDateToUTC(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

/** Day of year (UTC) */
function dayOfYearUTC(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  const diff = d.getTime() - start;
  return Math.floor(diff / 86_400_000) + 1;
}

/** Leap year */
function isLeapYear(y: number) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** ===== ISO-8601 week number =====
 * Weeks start Monday; Week 1 is the week with the year's first Thursday.
 * Returns { week, year, start, end } where start/end are Monday/Sunday (UTC).
 */
function getISOWeekInfo(dUTC: Date) {
  // Clone
  const target = new Date(Date.UTC(dUTC.getUTCFullYear(), dUTC.getUTCMonth(), dUTC.getUTCDate()));
  // ISO day number (Mon=0..Sun=6)
  const dayNum = (target.getUTCDay() + 6) % 7;
  // Shift to Thursday of this week
  target.setUTCDate(target.getUTCDate() - dayNum + 3);

  // ISO year might differ near boundaries
  const isoYear = target.getUTCFullYear();

  // First Thursday of ISO year
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);

  const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 86_400_000));

  // Start/end of ISO week: Monday..Sunday
  const monday = new Date(target);
  monday.setUTCDate(monday.getUTCDate() - 3); // back to Monday
  const start = new Date(monday);
  const end = new Date(monday);
  end.setUTCDate(end.getUTCDate() + 6);

  return { week, year: isoYear, start, end, code: `${isoYear}-W${String(week).padStart(2, "0")}` };
}

/** ===== US week number (Sunday start) =====
 * Weeks start Sunday; Week 1 contains Jan 1 (common US "Week of Year").
 * Returns { week, year, start, end } where start/end are Sunday..Saturday (UTC).
 */
function getUSWeekInfo(dUTC: Date) {
  const year = dUTC.getUTCFullYear();
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const jan1Dow = jan1.getUTCDay(); // 0=Sun..6=Sat

  // Start of first US week (Sunday on/before Jan 1)
  const firstSunday = new Date(jan1);
  firstSunday.setUTCDate(jan1.getUTCDate() - jan1Dow);

  const diffDays = Math.floor((dUTC.getTime() - firstSunday.getTime()) / 86_400_000);
  const week = Math.floor(diffDays / 7) + 1;

  // Sunday..Saturday range for the selected date's week
  const weekStart = new Date(firstSunday);
  weekStart.setUTCDate(firstSunday.getUTCDate() + (week - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

  return { week, year, start: weekStart, end: weekEnd, code: `${year}-W${String(week).padStart(2, "0")}` };
}

/* ============================================================
   🧮 Component
   ============================================================ */
const WeekNumberFinder: React.FC = () => {
  // Defaults: today (local) to YYYY-MM-DD
  const now = new Date();
  const defaultLocalDate = `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;

  // State
  const [date, setDate] = useState<string>(defaultLocalDate);
  const [mode, setMode] = useState<"ISO" | "US">("ISO"); // ISO default
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [hydrated, setHydrated] = useState<boolean>(false);

  const isDefault = date === defaultLocalDate && mode === "ISO";

  /* 🔁 Load & persist */
  const applyState = (s: any) => {
    if (typeof s?.date === "string") setDate(s.date);
    if (s?.mode === "ISO" || s?.mode === "US") setMode(s.mode);
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const enc = params.get(URL_KEY);
      if (enc) {
        applyState(JSON.parse(atob(enc)));
        setHydrated(true);
        return;
      }
      const raw = localStorage.getItem(LS_KEY);
      if (raw) applyState(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ date, mode }));
    } catch {}
  }, [hydrated, date, mode]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const url = new URL(window.location.href);
      if (isDefault) {
        url.searchParams.delete(URL_KEY);
      } else {
        url.searchParams.set(URL_KEY, btoa(JSON.stringify({ date, mode })));
      }
      window.history.replaceState({}, "", url);
    } catch {}
  }, [hydrated, date, mode, isDefault]);

  /* 🧠 Compute */
  const dUTC = useMemo(() => parseLocalDateToUTC(date), [date]);

  const info = useMemo(() => {
    if (!dUTC) return null;
    return mode === "ISO" ? getISOWeekInfo(dUTC) : getUSWeekInfo(dUTC);
  }, [dUTC, mode]);

  const doy = useMemo(() => (dUTC ? dayOfYearUTC(dUTC) : null), [dUTC]);
  const leap = useMemo(() => (dUTC ? isLeapYear(dUTC.getUTCFullYear()) : false), [dUTC]);

  /* 🔗 Actions */
  const copyResults = async () => {
    if (!info || !dUTC) return;
    const lines = [
      "Week Number Finder",
      `Date (UTC 00:00): ${fmtISO(dUTC)} (${fmtHuman(dUTC)})`,
      `Mode: ${mode === "ISO" ? "ISO-8601 (Mon start; Week 1 has first Thursday)" : "US (Sun start; Week 1 includes Jan 1)"}`,
      "",
      `Week Number: ${info.week}`,
      `Week Code:   ${info.code}`,
      `Week Year:   ${info.year}`,
      `Week Start:  ${fmtISO(info.start)} (${fmtHuman(info.start)})`,
      `Week End:    ${fmtISO(info.end)} (${fmtHuman(info.end)})`,
      "",
      `Day of Year: ${doy}`,
      `Leap Year:   ${leap ? "Yes" : "No"}`,
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set(URL_KEY, btoa(JSON.stringify({ date, mode })));
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  const reset = () => {
    setDate(defaultLocalDate);
    setMode("ISO");
    localStorage.removeItem(LS_KEY);
  };

  /* ============================================================
     🎨 Render
     ============================================================ */
  return (
    <>
      <SEOHead
          title="Week Number Finder | ISO-8601 & US Week of Year"
          description="Find the week of year for any date. ISO-8601 (Mon-start, first Thursday rule) and US (Sun-start) modes with week start/end dates, week year, and shareable state."
          keywords={[
            "week number","week of year","ISO week","US week","iso-8601 week",
            "week code","2025 W46","week year","date tools","calendar week"
          ]}
          canonical="https://calculatorhub.site/week-number-finder"
          schemaData={[
            // 1) Core calculator schema
            generateCalculatorSchema(
              "Week Number Finder",
              "Find which week of the year a given date falls in—ISO-8601 or US mode. Get week number, week year, and exact start/end dates.",
              "/week-number-finder",
              ["week number","week of year","ISO week","US week","date tools"]
            ),
        
            // 2) WebApplication (the app entity)
            {
              "@context":"https://schema.org",
              "@type":"WebApplication",
              "name":"Week Number Finder – CalculatorHub",
              "url":"https://calculatorhub.site/week-number-finder",
              "applicationCategory":"UtilitiesApplication",
              "operatingSystem":"Web",
              "inLanguage":"en",
              "description":"Week of year for any date with ISO-8601 and US modes, start/end dates, and shareable state.",
              "image":[
                "https://calculatorhub.site/images/week-number-finder-preview.webp",
                "https://calculatorhub.site/images/week-number-finder-hero.webp"
              ],
              "offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},
              "publisher":{
                "@type":"Organization",
                "name":"CalculatorHub",
                "url":"https://calculatorhub.site",
                "logo":{"@type":"ImageObject","url":"https://calculatorhub.site/images/calculatorhub-logo.webp"}
              },
              "datePublished":"2025-11-13",
              "dateModified":"2025-11-13",
              "keywords":["week number","iso week","us week","week code","week year"]
            },
        
            // 3) WebPage → Article (page content)
            {
              "@context":"https://schema.org",
              "@type":"WebPage",
              "url":"https://calculatorhub.site/week-number-finder",
              "mainEntity":{
                "@type":"Article",
                "headline":"Week Number Finder — ISO-8601 & US Week of Year",
                "description":"Compute week number (week of year), week year, and week start/end dates in ISO-8601 or US mode.",
                "author":{"@type":"Organization","name":"CalculatorHub Tools Team"},
                "publisher":{
                  "@type":"Organization",
                  "name":"CalculatorHub",
                  "logo":{"@type":"ImageObject","url":"https://calculatorhub.site/images/calculatorhub-logo.webp"}
                },
                "image":[
                  "https://calculatorhub.site/images/week-number-finder-preview.webp",
                  "https://calculatorhub.site/images/week-number-finder-hero.webp"
                ],
                "datePublished":"2025-11-13",
                "dateModified":"2025-11-13",
                "articleSection":[
                  "What Is Week Number?",
                  "ISO-8601 vs US",
                  "How to Use",
                  "Methods & Rules",
                  "Worked Examples",
                  "Use Cases",
                  "FAQ"
                ],
                "inLanguage":"en",
                "keywords":["week number","week of year","iso week","us week","calendar week"]
              }
            },
        
            // 4) FAQPage
            {
              "@context":"https://schema.org",
              "@type":"FAQPage",
              "mainEntity":[
                {
                  "@type":"Question",
                  "name":"What’s the difference between ISO-8601 and US week numbering?",
                  "acceptedAnswer":{"@type":"Answer","text":"ISO weeks start Monday and Week 1 is the week with the year’s first Thursday; US weeks start Sunday and Week 1 is the week containing Jan 1."}
                },
                {
                  "@type":"Question",
                  "name":"What do you return besides the week number?",
                  "acceptedAnswer":{"@type":"Answer","text":"We provide the week number, week year, ISO/US week code, and the exact start/end dates of that week."}
                }
              ]
            },
        
            // 5) Breadcrumbs
            {
              "@context":"https://schema.org",
              "@type":"BreadcrumbList",
              "itemListElement":[
                {"@type":"ListItem","position":1,"name":"Home","item":"https://calculatorhub.site/"},
                {"@type":"ListItem","position":2,"name":"Date & Time Tools","item":"https://calculatorhub.site/category/date-time-tools"},
                {"@type":"ListItem","position":3,"name":"Week Number Finder","item":"https://calculatorhub.site/week-number-finder"}
              ]
            },
        
            // 6) WebSite + SearchAction
            {
              "@context":"https://schema.org",
              "@type":"WebSite",
              "name":"CalculatorHub",
              "url":"https://calculatorhub.site",
              "potentialAction":{
                "@type":"SearchAction",
                "target":"https://calculatorhub.site/search?q={query}",
                "query-input":"required name=query"
              }
            },
        
            // 7) Organization (brand)
            {
              "@context":"https://schema.org",
              "@type":"Organization",
              "name":"CalculatorHub",
              "url":"https://calculatorhub.site",
              "logo":"https://calculatorhub.site/images/calculatorhub-logo.webp"
            },
        
            // 8) Speakable (voice assistants)
            {
              "@context":"https://schema.org",
              "@type":"SpeakableSpecification",
              "cssSelector":[
                ".prose h1",
                ".prose #iso-vs-us",
                ".prose #how-to-use"
              ]
            }
          ]}
          breadcrumbs={[
            { name: "Date & Time Tools", url: "/category/date-time-tools" },
            { name: "Week Number Finder", url: "/week-number-finder" }
          ]}
        />


      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <link rel="canonical" href="https://calculatorhub.site/week-number-finder" />
      

      <link rel="alternate" href="https://calculatorhub.site/week-number-finder" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/week-number-finder" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/week-number-finder" hreflang="x-default" />
      
   
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Week Number Finder | ISO-8601 & US Week of Year" />
      <meta property="og:description" content="Find the week of year (ISO or US) with week start/end dates, week year, and shareable link." />
      <meta property="og:url" content="https://calculatorhub.site/week-number-finder" />
      <meta property="og:image" content="https://calculatorhub.site/images/week-number-finder-preview.webp" />
      <meta property="og:image:alt" content="Week Number Finder preview" />
      

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Week Number Finder | ISO-8601 & US Week of Year" />
      <meta name="twitter:description" content="Compute week number and week year with precise week start/end dates." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/week-number-finder-preview.webp" />
      

      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="theme-color" content="#4f46e5" />
      
  
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
      

      <link rel="preload" as="image" href="/images/week-number-finder-hero.webp" />
      <link rel="preload" as="image" href="/images/week-number-finder-preview.webp" />
      

      <meta name="referrer" content="no-referrer-when-downgrade" />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Date & Time Tools", url: "/category/date-time-tools" },
            { name: "Week Number Finder", url: "/week-number-finder" },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">📅 Week Number Finder</h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Enter a date to see its <strong>week of year</strong>, the <strong>week year</strong>, and the
            <strong> start/end</strong> dates of that week. Supports <strong>ISO-8601</strong> (default) and <strong>US</strong> modes.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-sky-400" /> Inputs
              </h2>
              <button
                onClick={reset}
                className="flex items-center gap-1 text-sm text-slate-300 border border-[#334155] rounded-lg px-2 py-1 hover:bg-[#0f172a] hover:text-white transition"
                disabled={isDefault}
              >
                <RotateCcw className="h-4 w-4 text-indigo-400" /> Reset
              </button>
            </div>

            <div className="space-y-5">
              {/* Date */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">Select Date</label>
                  <Info className="h-4 w-4 text-slate-400" title="We compute at UTC 00:00 for consistency across locales." />
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Mode */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Week Numbering Mode</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => setMode("ISO")}
                    className={`px-3 py-2 rounded-md border ${
                      mode === "ISO"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                        : "border-[#334155] bg-[#0f172a] text-slate-200 hover:border-emerald-500/50"
                    }`}
                    title="Monday start; Week 1 has the year's first Thursday"
                  >
                    ISO-8601 (Mon start)
                  </button>
                  <button
                    onClick={() => setMode("US")}
                    className={`px-3 py-2 rounded-md border ${
                      mode === "US"
                        ? "border-sky-500 bg-sky-500/10 text-sky-200"
                        : "border-[#334155] bg-[#0f172a] text-slate-200 hover:border-sky-500/50"
                    }`}
                    title="Sunday start; Week 1 includes January 1"
                  >
                    US (Sun start)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">Results</h2>

            {!dUTC || !info ? (
              <div className="p-4 bg-[#0f172a] rounded-lg border border-[#334155] text-slate-300">
                Pick a valid date to see the week information.
              </div>
            ) : (
              <>
                {/* Primary card */}
                <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                  <Hash className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">Week {info.week}</div>
                  <div className="text-sm text-slate-400">
                    {mode === "ISO" ? "ISO-8601" : "US"} • {info.code}
                  </div>
                </div>

                {/* Tiles */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <Stat label="Week Year" value={String(info.year)} />
                  <Stat label="Day of Year" value={String(doy)} />
                  <Stat label="Week Starts" value={`${fmtISO(info.start)} • ${fmtHuman(info.start)}`} icon="range" />
                  <Stat label="Week Ends" value={`${fmtISO(info.end)} • ${fmtHuman(info.end)}`} icon="range" />
                  <Stat label="Leap Year?" value={leap ? "Yes" : "No"} />
                  <Stat label="Input (UTC)" value={`${fmtISO(dUTC)} • ${fmtHuman(dUTC)}`} icon="clock" />
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={copyResults}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm"
                  >
                    <Copy size={16} /> Copy Results
                  </button>
                  <button
                    onClick={copyShareLink}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm"
                  >
                    <Share2 size={16} /> Copy Link
                  </button>
                  {copied !== "none" && (
                    <span className="text-emerald-400 text-sm">
                      {copied === "results" ? "Results copied!" : "Link copied!"}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Short Smart Tip */}
        <div className="mt-4 w-full relative">
          <div className="bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm min-h-[50px] w-full flex items-center">
            <div className="mr-3 flex items-center justify-center w-8 h-8">
              <span className="text-2xl text-indigo-400">💡</span>
            </div>
            <div className="w-full">
              <p className="text-base font-medium leading-snug text-slate-300">
                Switch between ISO and US modes to match how your team reports “Week of Year”.
              </p>
            </div>
          </div>
        </div>

        {/* ===================== SEO Content (~1200–1500 words trimmed for brevity) ===================== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          {/* ===== Table of Contents ===== */}
          <nav className="mt-2 mb-10 bg-[#0b1220] border border-[#1f2a44] rounded-xl p-5 text-slate-200">
            <h2 className="text-lg font-semibold text-gray-100 mb-3">📖 Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><a href="#what-is-week-number" className="text-indigo-300 hover:underline">What Is “Week Number”?</a></li>
              <li><a href="#iso-vs-us" className="text-indigo-300 hover:underline">ISO-8601 vs US Week Numbering</a></li>
              <li><a href="#how-to-use" className="text-indigo-300 hover:underline">How to Use This Finder</a></li>
              <li><a href="#methods" className="text-indigo-300 hover:underline">Methods & Rules Under the Hood</a></li>
              <li><a href="#worked-examples" className="text-indigo-300 hover:underline">Worked Examples</a></li>
              <li><a href="#use-cases" className="text-indigo-300 hover:underline">Where Week Numbers Matter</a></li>
              <li><a href="#faq" className="text-indigo-300 hover:underline">FAQ</a></li>
            </ol>
          </nav>

          {/* ===== What is Week Number ===== */}
          <h1 id="what-is-week-number" className="text-3xl font-bold text-indigo-300 mb-6">
            Week Number — a reliable way to group dates
          </h1>
          <p>
            <strong>Week numbers</strong> index weeks across a year so teams can group tasks, releases, payroll, or reports.
            They’re common in software roadmaps, finance, logistics, and education. This tool returns the <em>week of year</em>,
            the <em>week year</em>, and the exact <em>start/end dates</em> of the corresponding week.
          </p>

          {/* ===== ISO vs US ===== */}
          <h2 id="iso-vs-us" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            ISO-8601 vs US week numbering
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>ISO-8601:</strong> Monday-start weeks; <em>Week 1</em> is the week containing the year’s <em>first Thursday</em>. Weeks run <em>Monday → Sunday</em>, and near New Year a date might belong to the next/previous ISO year.</li>
            <li><strong>US mode:</strong> Sunday-start weeks; <em>Week 1</em> is the week that contains <em>January 1</em>. Weeks run <em>Sunday → Saturday</em>. This aligns with many US calendars and retail schedules.</li>
          </ul>

          {/* ===== How to Use ===== */}
          <h2 id="how-to-use" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">🧭 How to use</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Select a <strong>date</strong> (YYYY-MM-DD).</li>
            <li>Choose <strong>ISO-8601</strong> or <strong>US</strong> mode to match your reporting standard.</li>
            <li>Read the <strong>Week Number</strong>, <strong>Week Code</strong> (e.g., 2025-W46), <strong>Week Year</strong>, and <strong>start/end dates</strong>.</li>
            <li>Use <em>Copy Results</em> for emails or <em>Copy Link</em> to share the exact state.</li>
          </ol>

          {/* ===== Methods ===== */}
          <h2 id="methods" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🔧 Methods & rules under the hood
          </h2>
          <h3 className="text-xl font-semibold text-indigo-300">ISO-8601 algorithm (Monday start)</h3>
          <p>
            We shift the given date to the <em>Thursday</em> of its week to determine the ISO week year, then count whole
            weeks from the ISO year’s first Thursday. Week start/end are Monday/Sunday.
          </p>
          <h3 className="text-xl font-semibold text-indigo-300 mt-6">US week algorithm (Sunday start)</h3>
          <p>
            We find the Sunday on/before January 1 and count weeks from there. Week start/end are Sunday/Saturday.
          </p>

          {/* ===== Worked Examples ===== */}
          <h2 id="worked-examples" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🧪 Worked examples
          </h2>
          <ul className="space-y-2">
            <li><strong>2025-01-01 (ISO):</strong> depends on where the first Thursday falls; often Week 1 can begin late December of the previous year.</li>
            <li><strong>2025-11-12 (US):</strong> Sunday-start counting places it in the appropriate numbered week; start/end show Sun→Sat.</li>
            <li><strong>Year boundary:</strong> 2024-12-31 may be ISO Week 1 of 2025, while US mode still reports a week within 2024.</li>
          </ul>

          {/* ===== Use Cases ===== */}
          <h2 id="use-cases" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🧰 Where week numbers matter
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Sprint planning & releases</strong> (software, product).</li>
            <li><strong>Retail calendars & payroll</strong> (US Sunday-start conventions).</li>
            <li><strong>Academic timetables</strong> & attendance grouping.</li>
            <li><strong>Logistics</strong> (cut-offs, weekly SLAs, carrier windows).</li>
            <li><strong>Finance & reporting</strong> (week-over-week metrics).</li>
          </ul>

          {/* ===== FAQ ===== */}
          <section className="space-y-6 mt-16">
            <h2 id="faq" className="text-3xl md:text-4xl font-bold mb-4 text-center text-indigo-200">
              ❓ Frequently Asked Questions (FAQ)
            </h2>

            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q1: Which mode should I use?</h3>
                <p>
                  If you need international consistency or Monday-start weeks, choose <strong>ISO-8601</strong>.
                  For US retail/payroll calendars and Sunday-start schedules, choose <strong>US</strong>.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q2: Why does the week “year” differ from the date’s year?</h3>
                <p>
                  Near New Year, ISO weeks can belong to the previous/next week-year depending on the “first Thursday” rule.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q3: What about other locales?</h3>
                <p>
                  Some regions start weeks on Saturday or use different conventions. This tool focuses on the two most common standards.
                </p>
              </div>
            </div>
          </section>
        </section>

        {/* Cross-links */}
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
                Specialists in date/time utilities. Last updated: <time dateTime="2025-11-12">November 12, 2025</time>.
              </p>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              🚀 Explore more tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/timezone-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-200 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
              >
                🌍 Timezone Converter
              </Link>
              <Link
                to="/time-duration-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-200 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
              >
                ⏱️ Time Duration Calculator
              </Link>
              <Link
                to="/age-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-pink-600/20 text-pink-300 hover:text-pink-200 px-3 py-2 rounded-md border border-slate-700 hover:border-pink-500 transition-all duration-200"
              >
                🎂 Age Calculator
              </Link>
            </div>
          </div>
        </section>

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/week-number-finder" category="date-time-tools" />
      </div>
    </>
  );
};

/* ============================================================
   🧩 Small UI helpers
   ============================================================ */
const Stat: React.FC<{ label: string; value: string; icon?: "clock" | "range" | "book" }> = ({
  label,
  value,
  icon,
}) => {
  const Icon =
    icon === "clock" ? CalendarClock :
    icon === "range" ? CalendarRange :
    icon === "book" ? BookOpenText :
    null;
  return (
    <div className="p-4 bg-[#0f172a] rounded-lg text-left border border-[#334155] shadow-sm">
      <div className="text-xs text-slate-400 flex items-center gap-2">
        {Icon ? <Icon className="h-4 w-4 text-indigo-300" /> : null}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-base font-semibold text-white break-words">{value}</div>
    </div>
  );
};

export default WeekNumberFinder;
