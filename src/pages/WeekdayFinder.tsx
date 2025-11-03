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

  /* ================= SEO / Schema ================= */
  const faqSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "How do I find the weekday of a date?", "acceptedAnswer": { "@type": "Answer", "text": "Enter or pick any date. The tool shows the weekday name, weekend status, ISO week number, day of year and more." } },
      { "@type": "Question", "name": "Can I change language of weekday names?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. In Advanced Mode, choose a locale (e.g., Bangla, English UK/US, Arabic) and the weekday names update instantly." } }
    ]
  }), []);

  const schemaArray = useMemo(() => ([
    generateCalculatorSchema(
      "Weekday Finder",
      seoData.weekdayFinder?.description || "Find the weekday for any date with ISO week number, day of year, and locale options.",
      "/weekday-finder",
      seoData.weekdayFinder?.keywords || ["weekday finder", "day of week", "what day was it", "weekday in bangla"]
    ),
    faqSchema,
  ]), [faqSchema]);

  /* ================= Render ================= */
  return (
    <>
      <SEOHead
        title={seoData.weekdayFinder?.title || "Weekday Finder – What Day Is It?"}
        description={seoData.weekdayFinder?.description || "Enter a date to instantly see the weekday name, weekend status, ISO week number, and day-of-year. Advanced options for locale and week start."}
        canonical="https://calculatorhub.site/weekday-finder"
        schemaData={schemaArray}
        breadcrumbs={[
          { name: "Date & Time Tools", url: "/category/date-time-tools" },
          { name: "Weekday Finder", url: "/weekday-finder" }
        ]}
      />

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
            <RelatedCalculators currentPath="/weekday-finder" category="date-time-tools" />
          </Suspense>

          {/* SEO snippet */}
          <section className="mt-6">
            <h2 className="text-3xl md:text-4xl text-white"><strong>What is a Weekday Finder?</strong></h2>
            <p className="text-slate-300 py-3 leading-relaxed">A simple tool to discover the day of week for any date. It also shows ISO week number, custom week number, day-of-year and upcoming same weekdays. Switch languages via locale.</p>
          </section>
        </div>
      </div>
    </>
  );
};

export default WeekdayFinder;
