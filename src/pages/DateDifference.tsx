// Date Difference Calculator — Age Calculator UI pattern
import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Repeat, ArrowLeftRight, Info, Clock3 } from "lucide-react";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

const RelatedCalculators = React.lazy(() => import("../components/RelatedCalculators"));
const AdBanner = React.lazy(() => import("../components/AdBanner"));

/* =============================================
   Types & Helpers
============================================= */
type Diff = {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
  businessDays?: number;
};

const compactNumber = (n: number) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

const clampDateISO = (value: string) => {
  const d = new Date(value || Date.now());
  if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
  return d.toISOString().split("T")[0];
};

const isoToday = () => new Date().toISOString().split("T")[0];

const getInitialLocal = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

// Inclusive/Exclusive helpers
const addDays = (d: Date, days: number) => {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return nd;
};

const toYMD = (d: Date) => d.toISOString().split("T")[0];

// Year/Month/Day difference assuming end >= start
const diffYMD = (start: Date, end: Date) => {
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();
  if (days < 0) {
    months--;
    const lastMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += lastMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return { years, months, days };
};

const isWeekend = (d: Date) => {
  const w = d.getDay();
  return w === 0 || w === 6;
};

const isHoliday = (d: Date, set: Set<string>) => set.has(toYMD(d));

const countBusinessDays = (
  start: Date,
  end: Date,
  { excludeWeekends, holidays, includeStart, includeEnd }: { excludeWeekends: boolean; holidays: Set<string>; includeStart: boolean; includeEnd: boolean; }
) => {
  if (end < start) return 0;
  let s = new Date(start);
  let e = new Date(end);
  if (!includeStart) s = addDays(s, 1);
  if (!includeEnd) e = addDays(e, -1);

  let count = 0;
  for (let d = s; d <= e; d = addDays(d, 1)) {
    if (excludeWeekends && isWeekend(d)) continue;
    if (holidays.size && isHoliday(d, holidays)) continue;
    count++;
  }
  return Math.max(count, 0);
};

/* =============================================
   Component
============================================= */
const DateDifferenceCalculator: React.FC = () => {
  // Inputs
  const [startDate, setStartDate] = useState<string>(isoToday());
  const [endDate, setEndDate] = useState<string>(isoToday());
  const [error, setError] = useState<string>("");

  // Advanced options
  const [advanced, setAdvanced] = useState<boolean>(() => getInitialLocal("dd_adv_enabled", false));
  const [includeStart, setIncludeStart] = useState<boolean>(() => getInitialLocal("dd_adv_include_start", true));
  const [includeEnd, setIncludeEnd] = useState<boolean>(() => getInitialLocal("dd_adv_include_end", true));
  const [excludeWeekends, setExcludeWeekends] = useState<boolean>(() => getInitialLocal("dd_adv_excl_weekends", false));
  const [holidayText, setHolidayText] = useState<string>(() => getInitialLocal("dd_adv_holidays", ""));

  // Live countdown / progress (when end is in future)
  const [nowISO, setNowISO] = useState<string>(isoToday());

  // Copy feedback
  const [copied, setCopied] = useState(false);

  // Persist advanced settings
  useEffect(() => { localStorage.setItem("dd_adv_enabled", JSON.stringify(advanced)); }, [advanced]);
  useEffect(() => { localStorage.setItem("dd_adv_include_start", JSON.stringify(includeStart)); }, [includeStart]);
  useEffect(() => { localStorage.setItem("dd_adv_include_end", JSON.stringify(includeEnd)); }, [includeEnd]);
  useEffect(() => { localStorage.setItem("dd_adv_excl_weekends", JSON.stringify(excludeWeekends)); }, [excludeWeekends]);
  useEffect(() => { localStorage.setItem("dd_adv_holidays", JSON.stringify(holidayText)); }, [holidayText]);

  // Derived
  const start = useMemo(() => new Date(startDate), [startDate]);
  const end = useMemo(() => new Date(endDate), [endDate]);

  const holidaysSet = useMemo(() => {
    const lines = holidayText.split(/\n|,|;|\s+/).map((s) => s.trim()).filter(Boolean);
    return new Set(lines);
  }, [holidayText]);

  const diff: Diff = useMemo(() => {
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return {
        years: 0, months: 0, days: 0,
        totalDays: 0, totalWeeks: 0, totalMonths: 0, totalHours: 0, totalMinutes: 0, totalSeconds: 0,
        businessDays: 0,
      };
    }

    // Inclusive logic for totals
    const s = new Date(start);
    const e = new Date(end);
    let inclusiveAdjust = 0;
    if (includeStart) inclusiveAdjust++;
    if (includeEnd && start.getTime() !== end.getTime()) inclusiveAdjust++;

    const ms = e.getTime() - s.getTime();
    const totalDays = Math.floor(ms / (1000 * 60 * 60 * 24)) + (inclusiveAdjust ? 1 : 0);

    const ymd = diffYMD(s, e);
    const totalMonths = ymd.years * 12 + ymd.months;
    const totalWeeks = Math.floor(totalDays / 7);
    const totalHours = totalDays * 24;
    const totalMinutes = totalHours * 60;
    const totalSeconds = totalMinutes * 60;

    const businessDays = advanced
      ? countBusinessDays(s, e, { excludeWeekends, holidays: holidaysSet, includeStart, includeEnd })
      : undefined;

    return {
      years: ymd.years,
      months: ymd.months,
      days: ymd.days,
      totalDays,
      totalWeeks,
      totalMonths,
      totalHours,
      totalMinutes,
      totalSeconds,
      businessDays,
    };
  }, [start, end, includeStart, includeEnd, advanced, excludeWeekends, holidaysSet]);

  // Validation
  useEffect(() => {
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError("Please enter valid dates.");
    } else if (start > end) {
      setError("Start date cannot be later than the end date.");
    } else {
      setError("");
    }
  }, [start, end]);

  // Countdown ticker when end is in the future
  useEffect(() => {
    const endMs = end.getTime();
    const isFuture = !isNaN(endMs) && endMs > Date.now();
    if (!advanced || !isFuture) return;
    const id = setInterval(() => setNowISO(isoToday()), 1000);
    return () => clearInterval(id);
  }, [advanced, end]);

  const percentElapsed = useMemo(() => {
    const startMs = start.getTime();
    const endMs = end.getTime();
    const nowMs = new Date().getTime();
    if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return 0;
    const t = Math.min(Math.max(nowMs, startMs), endMs);
    return ((t - startMs) / (endMs - startMs)) * 100;
  }, [start, end, nowISO]);

  const resultString = useMemo(
    () => `Between ${startDate} and ${endDate}: ${diff.years} years, ${diff.months} months, ${diff.days} days (Total days: ${diff.totalDays})`,
    [startDate, endDate, diff]
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(resultString);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {}
  }, [resultString]);

  const handleReset = useCallback(() => {
    setStartDate(isoToday());
    setEndDate(isoToday());
    setError("");
    setCopied(false);
    setAdvanced(false);
    setIncludeStart(true);
    setIncludeEnd(true);
    setExcludeWeekends(false);
    setHolidayText("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("dd_adv_enabled");
      localStorage.removeItem("dd_adv_include_start");
      localStorage.removeItem("dd_adv_include_end");
      localStorage.removeItem("dd_adv_excl_weekends");
      localStorage.removeItem("dd_adv_holidays");
    }
  }, []);

  const swapDates = useCallback(() => {
    setStartDate(endDate);
    setEndDate(startDate);
  }, [startDate, endDate]);

  /* ================= SEO / Schema ================= */
  const faqSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I find the exact difference between two dates?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Pick a start and end date. The calculator returns the exact difference in years, months, days, and totals (weeks, days, hours, minutes, seconds)."
        }
      },
      {
        "@type": "Question",
        "name": "Can I count business days only?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. In Advanced Mode, toggle business-day logic (exclude weekends) and optionally add custom holidays."
        }
      }
    ]
  }), []);

  const schemaArray = useMemo(
    () => [
      generateCalculatorSchema(
        "Date Difference Calculator",
        seoData.dateDifference?.description || "Find exact time between two dates with years/months/days and total days, hours, minutes.",
        "/date-difference-calculator",
        seoData.dateDifference?.keywords || ["date difference", "days between dates", "business days calculator"]
      ),
      faqSchema,
    ],
    [faqSchema]
  );

  /* ================= Render ================= */
  return (
    <>
      <SEOHead
        title={seoData.dateDifference?.title || "Date Difference Calculator – Days Between Dates"}
        description={seoData.dateDifference?.description || "Calculate the exact difference between two dates in years, months, days and totals. Advanced options for business days and holidays."}
        canonical="https://calculatorhub.site/date-difference-calculator"
        schemaData={schemaArray}
        breadcrumbs={[
          { name: "Date & Time Tools", url: "/category/date-time-tools" },
          { name: "Date Difference Calculator", url: "/date-difference-calculator" }
        ]}
      />

      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <div className="min-h-screen w-full py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { name: "Date & Time Tools", url: "/category/date-time-tools" },
              { name: "Date Difference Calculator", url: "/date-difference-calculator" },
            ]}
          />

          {/* Hero */}
          <section className="mt-6 mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
              Date Difference Calculator
            </h1>
            <p className="mt-2 text-slate-300 max-w-2xl">
              Find the exact time between two dates. Get years, months, days and totals. Advanced Mode lets you count business days, exclude weekends, and add holidays.
            </p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Inputs */}
            <section className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-100">Date Inputs</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={swapDates}
                    type="button"
                    className="px-3 py-1.5 rounded-xl bg-slate-900/60 text-slate-100 border border-white/10 hover:bg-slate-800 flex items-center gap-1"
                    aria-label="Swap start and end dates"
                  >
                    <ArrowLeftRight className="h-4 w-4" /> Swap
                  </button>
                  <button
                    onClick={handleReset}
                    type="button"
                    className="text-white bg-yellow-700 hover:bg-yellow-800 focus:outline-none focus:ring-4 focus:ring-yellow-300 font-medium rounded-full text-sm px-2.5 py-1.5 dark:bg-yellow-600 dark:hover:bg-yellow-700 dark:focus:ring-yellow-800"
                    aria-label="Reset all fields"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-slate-200 mb-2">
                    Start Date
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    max={clampDateISO(endDate)}
                    onChange={(e) => setStartDate(e.target.value || isoToday())}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-slate-200 mb-2">
                    End Date
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    min={clampDateISO(startDate)}
                    onChange={(e) => setEndDate(e.target.value || isoToday())}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setEndDate(isoToday())}
                  className="w-full px-4 py-2 rounded-xl font-medium transition-colors shadow-sm bg-blue-600 text-white hover:bg-blue-500"
                  aria-label="Set end date to today"
                >
                  Set End Date to Today
                </button>

                {error && (
                  <p className="text-sm text-red-400" role="alert">
                    {error}
                  </p>
                )}
              </div>
            </section>

            {/* Results */}
            <section className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">Difference Results</h2>

              <div className="space-y-6">
                <div className="text-center p-4 rounded-XL bg-blue-500/10 border border-blue-400/20">
                  <CalendarDays className="h-8 w-8 text-blue-300 mx-auto mb-2" aria-hidden="true" />
                  <div className="text-2xl font-bold text-slate-100">
                    {diff.years} years, {diff.months} months, {diff.days} days
                  </div>
                  <div className="text-sm text-slate-300">Exact Difference</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl text-center bg-emerald-500/10 border border-emerald-400/20">
                    <div className="text-xl font-semibold text-slate-100">{compactNumber(diff.totalDays)}</div>
                    <div className="text-sm text-slate-300">Total Days</div>
                  </div>
                  <div className="p-4 rounded-xl text-center bg-amber-500/10 border border-amber-400/20">
                    <div className="text-xl font-semibold text-slate-100">{compactNumber(diff.totalWeeks)}</div>
                    <div className="text-sm text-slate-300">Total Weeks</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl text-center bg-violet-500/10 border border-violet-400/20">
                    <div className="text-xl font-semibold text-slate-100">{compactNumber(diff.totalMonths)}</div>
                    <div className="text-sm text-slate-300">Total Months</div>
                  </div>
                  <div className="p-4 rounded-xl text-center bg-rose-500/10 border border-rose-400/20">
                    <div className="text-xl font-semibold text-slate-100">{compactNumber(diff.totalHours)}</div>
                    <div className="text-sm text-slate-300">Total Hours</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl text-center bg-orange-500/10 border border-orange-400/20">
                    <div className="text-xl font-semibold text-slate-100">{compactNumber(diff.totalMinutes)}</div>
                    <div className="text-sm text-slate-300">Total Minutes</div>
                  </div>
                  <div className="p-4 rounded-xl text-center bg-sky-500/10 border border-sky-400/20">
                    <div className="text-xl font-semibold text-slate-100">{compactNumber(diff.totalSeconds)}</div>
                    <div className="text-sm text-slate-300">Total Seconds</div>
                  </div>
                  <div className="p-4 rounded-xl text-center bg-slate-500/10 border border-slate-400/20">
                    <div className="text-xl font-semibold text-slate-100">{diff.years}</div>
                    <div className="text-sm text-slate-300">Years (whole)</div>
                  </div>
                </div>

                {advanced && typeof diff.businessDays === "number" && (
                  <div className="p-4 rounded-xl text-center bg-teal-500/10 border border-teal-400/20">
                    <div className="text-xl font-semibold text-slate-100">{compactNumber(diff.businessDays)}</div>
                    <div className="text-sm text-slate-300">Business Days</div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-500 transition-colors shadow-sm"
                    aria-live="polite"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  {copied && <span className="text-teal-300 text-sm">Summary copied to clipboard</span>}
                </div>
              </div>
            </section>
          </div>

          {/* Advanced Mode */}
          <section className="mt-8 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-semibold text-slate-100">Advanced Mode</h2>
                <button
                  onClick={() => setAdvanced(!advanced)}
                  className="px-4 py-2 rounded-xl bg-slate-900/60 text-slate-100 hover:bg-slate-800 transition-colors border border-white/10"
                >
                  {advanced ? "Hide Advanced Mode" : "Show Advanced Mode"}
                </button>
              </div>

              {advanced && (
                <div className="space-y-6 transition-all duration-300 ease-out">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-1 flex items-center gap-1">
                        Include Start Day <Info className="h-3.5 w-3.5 text-slate-400" />
                      </label>
                      <select
                        className="w-full px-3 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={includeStart ? "yes" : "no"}
                        onChange={(e) => setIncludeStart(e.target.value === "yes")}
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-1 flex items-center gap-1">
                        Include End Day <Info className="h-3.5 w-3.5 text-slate-400" />
                      </label>
                      <select
                        className="w-full px-3 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={includeEnd ? "yes" : "no"}
                        onChange={(e) => setIncludeEnd(e.target.value === "yes")}
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-1">
                        Exclude Weekends (Business Days)
                      </label>
                      <select
                        className="w-full px-3 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={excludeWeekends ? "yes" : "no"}
                        onChange={(e) => setExcludeWeekends(e.target.value === "yes")}
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1">Custom Holidays (YYYY-MM-DD, comma/line separated)</label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="2025-01-01, 2025-02-21\n2025-12-25"
                      value={holidayText}
                      onChange={(e) => setHolidayText(e.target.value)}
                    />
                    <p className="text-xs text-slate-400 mt-1">We only match exact dates in YYYY-MM-DD format.</p>
                  </div>

                  {/* Progress if end is in future */}
                  {new Date(endDate).getTime() > Date.now() && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="p-4 rounded-xl border border-white/10 bg-slate-900/40">
                        <h3 className="font-semibold text-slate-200 mb-2">⏳ Time Until End</h3>
                        <LiveCountdown startISO={startDate} endISO={endDate} />
                        <p className="text-sm text-slate-300 mt-2">
                          End date is in the future. The countdown updates every second.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl border border-white/10 bg-slate-900/40">
                        <h3 className="font-semibold text-slate-200 mb-2">📈 Interval Progress</h3>
                        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                          <div className="h-3 bg-gradient-to-r from-teal-400 to-blue-500" style={{ width: `${percentElapsed.toFixed(2)}%` }} />
                        </div>
                        <div className="mt-2 text-sm text-slate-300">
                          Elapsed: <strong className="text-slate-100">{percentElapsed.toFixed(2)}%</strong> &nbsp;|&nbsp; Remaining: <strong className="text-slate-100">{(100 - percentElapsed).toFixed(2)}%</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Extras */}
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
                <li><a href="#what-is-date-diff" className="text-indigo-300 hover:underline">What Is a Date Difference Calculator?</a></li>
                <li><a href="#features" className="text-indigo-300 hover:underline">Key Features</a></li>
                <li><a href="#how-to-use" className="text-indigo-300 hover:underline">How to Use</a></li>
                <li><a href="#methods" className="text-indigo-300 hover:underline">Methods & Math Under the Hood</a></li>
                <li><a href="#worked-examples" className="text-indigo-300 hover:underline">Worked Examples</a></li>
                <li><a href="#business-days" className="text-indigo-300 hover:underline">Business Days, Weekends & Holidays</a></li>
                <li><a href="#performance" className="text-indigo-300 hover:underline">Performance, Precision & Limits</a></li>
                <li><a href="#pitfalls" className="text-indigo-300 hover:underline">Common Pitfalls & How to Avoid Them</a></li>
                <li><a href="#use-cases" className="text-indigo-300 hover:underline">Popular Use Cases</a></li>
                <li><a href="#quick-ref" className="text-indigo-300 hover:underline">Quick Reference Table (examples)</a></li>
                <li><a href="#glossary" className="text-indigo-300 hover:underline">Glossary</a></li>
                <li><a href="#faq" className="text-indigo-300 hover:underline">FAQ</a></li>
              </ol>
            </nav>
          
            {/* ===== What is it? ===== */}
            <h1 id="what-is-date-diff" className="text-3xl font-bold text-indigo-300 mb-6">
              Date Difference Calculator — exact years, months, days (plus totals)
            </h1>
            <p>
              A <strong>Date Difference Calculator</strong> measures the precise time between two calendar dates. Beyond a raw day count,
              this tool expresses the interval as <em>years</em>, <em>months</em>, and <em>days</em> (Y/M/D), plus convenient totals such as
              <strong>weeks</strong>, <strong>days</strong>, <strong>hours</strong>, <strong>minutes</strong>, and <strong>seconds</strong>. 
              It also supports an <strong>Advanced Mode</strong> for <em>business-day</em> counting where you can exclude weekends and mark custom holidays.
            </p>
            <p>
              Under the hood, it handles month-end boundaries, leap years, and inclusive/exclusive rules. Whether you are planning projects,
              estimating timelines, preparing HR/payroll schedules, or simply calculating milestones (weddings, visas, study terms, birthdays),
              this page provides a clear, shareable breakdown you can copy for reports and documentation.
            </p>
          
            {/* ===== Features ===== */}
            <h2 id="features" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              ✨ Key Features
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Y/M/D breakdown:</strong> precise calendar difference with month-end and leap-year handling.</li>
              <li><strong>Totals at a glance:</strong> weeks, days, hours, minutes, seconds for quick reporting.</li>
              <li><strong>Advanced Mode:</strong> business-day counting (exclude weekends) and <em>custom holidays</em>.</li>
              <li><strong>Inclusive options:</strong> toggle whether to count the start and/or end day.</li>
              <li><strong>Live countdown & progress:</strong> when the end date is in the future, watch the interval progress update in real time.</li>
              <li><strong>Copy-friendly summary:</strong> one-click copy to share results with teams or clients.</li>
              <li><strong>Glassmorphism UI:</strong> clean, focused layout that mirrors the Age Calculator pattern for consistency.</li>
            </ul>
          
            {/* ===== How to Use ===== */}
            <h2 id="how-to-use" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">🧭 How to Use</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Select a <strong>Start Date</strong> and an <strong>End Date</strong>. The tool validates that the start is not after the end.</li>
              <li>Review the top result card for the <strong>Y/M/D</strong> breakdown, then scan the <strong>Totals</strong> tiles for weeks/days/hours/minutes/seconds.</li>
              <li>Open <strong>Advanced Mode</strong> to:
                <ul className="list-disc list-inside ml-5 mt-1">
                  <li>Include/exclude the start day or end day.</li>
                  <li>Count <strong>Business Days</strong> by excluding weekends.</li>
                  <li>Paste <strong>Custom Holidays</strong> in <code>YYYY-MM-DD</code> format (comma or line separated).</li>
                </ul>
              </li>
              <li>If your end date is in the future, watch the <strong>Live Countdown</strong> and <strong>Interval Progress</strong> bar.</li>
              <li>Click <strong>Copy</strong> to export a neat text summary into your clipboard.</li>
            </ol>
            <p className="text-sm text-slate-400">
              Tip: Use the “Swap” button to quickly reverse start/end dates if you picked them in the wrong order.
            </p>
          
            {/* ===== Methods ===== */}
            <h2 id="methods" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              🔧 Methods & math under the hood
            </h2>
          
            <h3 className="text-xl font-semibold text-indigo-300">1) Calendar-safe Y/M/D decomposition</h3>
            <p>
              We compute the calendar difference as <strong>years</strong>, <strong>months</strong>, and <strong>days</strong> by subtracting whole years,
              then months, then days, adjusting for negative carry at month boundaries. When the day difference would go negative, we borrow a month
              and add the number of days in the previous month (which automatically accounts for 28–31 day months and leap years).
            </p>
          
            <h3 className="text-xl font-semibold text-indigo-300 mt-6">2) Totals with inclusive logic</h3>
            <p>
              The raw millisecond difference determines total <em>days</em> (then weeks/hours/minutes/seconds) with optional
              <strong>inclusion</strong> of start and/or end days. This lets you mirror common HR/payroll or project rules about whether the
              first and last day of an interval “count.”
            </p>
          
            <h3 className="text-xl font-semibold text-indigo-300 mt-6">3) Business day counting</h3>
            <p>
              When Advanced Mode is enabled, the tool iterates calendar days and increments a counter for each working day that is not a weekend
              (if weekend exclusion is on) and not present in your custom holiday set. Exact matching uses ISO strings (YYYY-MM-DD), so input
              must be precise. This makes the business-day total transparent and auditable.
            </p>
          
            <h3 className="text-xl font-semibold text-indigo-300 mt-6">4) Leap years and month lengths</h3>
            <p>
              Leap-year effects and differing month lengths are handled by the native date arithmetic combined with the Y/M/D decomposition logic.
              February 29 is treated correctly, and month rollovers behave as expected across boundaries like Jan→Feb, Feb→Mar, etc.
            </p>
          
            {/* ===== Worked Examples ===== */}
            <h2 id="worked-examples" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              🧪 Worked examples (rounded for readability)
            </h2>
            <ul className="space-y-2">
              <li><strong>2025-01-01 → 2025-01-01</strong> (include both): Y/M/D = 0/0/0; totals = 1 day. (Same-day inclusive count yields 1.)</li>
              <li><strong>2025-01-01 → 2025-01-31</strong> (include both): Y/M/D ≈ 0/0/30; totals ≈ 31 days.</li>
              <li><strong>2024-02-01 → 2024-03-01</strong> (leap year): Y/M/D ≈ 0/1/0; totals ≈ 30 days (Feb 2024 has 29 days; inclusive options may add +1).</li>
              <li><strong>2023-12-15 → 2025-03-10</strong>: Y/M/D ≈ 1 year, 2 months, 23 days; totals shown for weeks/days/hours/minutes/seconds.</li>
              <li><strong>Business days</strong> (exclude weekends), <strong>2025-01-01 → 2025-01-10</strong>: counts only Mon–Fri, minus any listed holidays.</li>
            </ul>
          
            {/* ===== Business Days ===== */}
            <h2 id="business-days" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              🏢 Business days, weekends & custom holidays
            </h2>
            <p>
              Business calendars vary by region and industry. This tool lets you <strong>exclude weekends</strong> (Saturday, Sunday) and 
              optionally mark specific <strong>holidays</strong>. Enter holidays in <code>YYYY-MM-DD</code> format, separated by commas or line breaks.
              We do an exact date match; partial or alternate formats won’t be recognized.
            </p>
            <p className="text-sm text-slate-400">
              Note: If your organization observes alternative weekends (e.g., Fri–Sat) or possesses half-days/early-closings, treat those as holidays or include them in your policy notes alongside the result.
            </p>
          
            {/* ===== Performance ===== */}
            <h2 id="performance" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              🚀 Performance, precision & limits
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Calendar math:</strong> lightweight and fast in the browser, even for long spans (years/decades).</li>
              <li><strong>Business-day pass:</strong> iterates days in the range; very long ranges (multi-decade daily loops) can be slower—use only when needed.</li>
              <li><strong>Countdown & progress:</strong> updates once per second when the end date is in the future.</li>
              <li><strong>Browser locale/time zone:</strong> Date inputs/outputs assume your system’s local time zone; stick to <code>YYYY-MM-DD</code> to avoid ambiguity.</li>
            </ul>
          
            {/* ===== Pitfalls ===== */}
            <h2 id="pitfalls" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              ⚠️ Common pitfalls & how to avoid them
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Start after end:</strong> ensure the start date is not later than the end date (the tool validates this).</li>
              <li><strong>Inclusive confusion:</strong> clarify whether your policy counts the start and/or end day; toggle the options accordingly.</li>
              <li><strong>Holiday format:</strong> holidays must be <code>YYYY-MM-DD</code> (e.g., <code>2025-12-25</code>). Anything else is ignored.</li>
              <li><strong>Cross-time-zone expectations:</strong> the tool treats dates in local time. For international projects, store dates in UTC or agree on a single zone to prevent off-by-one issues.</li>
              <li><strong>Very long business spans:</strong> daily iteration can be heavy for decades-long ranges; prefer pure calendar totals when you don’t need working-day precision.</li>
            </ul>
          
            {/* ===== Use Cases ===== */}
            <h2 id="use-cases" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              🧰 Popular use cases
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Project planning:</strong> sprint lengths, Gantt milestones, and delivery windows.</li>
              <li><strong>HR & payroll:</strong> service length, leave entitlement, notice periods, and benefits eligibility.</li>
              <li><strong>Education:</strong> term lengths, assignment windows, exam countdowns.</li>
              <li><strong>Compliance & legal:</strong> statutory deadlines, filing periods, cooling-off intervals.</li>
              <li><strong>Events & personal milestones:</strong> wedding planning, travel windows, age and anniversaries.</li>
            </ul>
          
            {/* ===== Quick Reference ===== */}
            <h2 id="quick-ref" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
              🗂️ Quick reference (examples & notes)
            </h2>
            <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-300">
                    <th className="py-2 pr-4">Start → End</th>
                    <th className="py-2 pr-4">Y/M/D</th>
                    <th className="py-2 pr-4">Totals (approx.)</th>
                    <th className="py-2">Notes</th>
                  </tr>
                </thead>
                <tbody className="text-slate-200">
                  <tr>
                    <td className="py-2 pr-4">2025-01-01 → 2025-01-31</td>
                    <td className="py-2 pr-4">0/0/30</td>
                    <td className="py-2 pr-4">~31 days</td>
                    <td className="py-2">Inclusive choices can add or remove a day from totals.</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">2024-02-01 → 2024-03-01</td>
                    <td className="py-2 pr-4">0/1/0</td>
                    <td className="py-2 pr-4">~30 days</td>
                    <td className="py-2">Leap year February (29 days).</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">2023-12-15 → 2025-03-10</td>
                    <td className="py-2 pr-4">1/2/23</td>
                    <td className="py-2 pr-4">~451 days</td>
                    <td className="py-2">Large span; use business mode only if needed.</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-xs text-slate-400 mt-2">
                Totals are influenced by inclusive settings and local time zone. For audited processes, document your policy (e.g., “include start, exclude end”).
              </p>
            </div>
          
            {/* ===== Glossary ===== */}
            <h2 id="glossary" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">📚 Glossary</h2>
            <p className="space-y-2">
              <strong>Y/M/D difference:</strong> calendar-safe decomposition into years, months, and days. <br/>
              <strong>Inclusive counting:</strong> whether to count the start and/or end day in totals. <br/>
              <strong>Business day:</strong> a working day per policy (usually Mon–Fri) excluding holidays. <br/>
              <strong>Leap year:</strong> a year with Feb 29 (divisible by 4, with century exceptions like 1900/2000). <br/>
              <strong>ISO date:</strong> an unambiguous date string formatted as YYYY-MM-DD.
            </p>
          
            {/* ===== FAQ ===== */}
            <section className="space-y-6 mt-16">
              <h2 id="faq" className="text-3xl md:text-4xl font-bold mb-4 text-center text-indigo-200">
                ❓ Frequently Asked Questions (FAQ)
              </h2>
          
              <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q1: Do you handle leap years correctly?</h3>
                  <p>
                    Yes. Month lengths and leap days are accounted for in the Y/M/D logic, so February 29 is treated correctly when applicable.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q2: What’s the difference between Y/M/D and totals?</h3>
                  <p>
                    Y/M/D is a calendar decomposition. Totals (weeks/days/hours/minutes/seconds) come from elapsed time plus inclusive rules—useful for planning and reporting.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q3: Can I count only business days?</h3>
                  <p>
                    Enable Advanced Mode, exclude weekends, and enter holidays. The tool tallies working days exactly within your range and policy.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q4: Why do I see off-by-one differences?</h3>
                  <p>
                    Inclusive settings and local time zones can shift totals by a day. Set clear rules (include/exclude start/end) and stick to ISO dates to avoid ambiguity.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q5: How do I share results?</h3>
                  <p>
                    Use the Copy button to grab a concise summary, then paste into email, chat, or your project tracker.
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
                  to="/age-calculator"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-200 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
                >
                  👶 Age Calculator
                </Link>
                <Link
                  to="/time-duration-calculator"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-200 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
                >
                  ⏱️ Time Duration Calculator
                </Link>
                <Link
                  to="/business-days-calculator"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-amber-600/20 text-amber-300 hover:text-amber-200 px-3 py-2 rounded-md border border-slate-700 hover:border-amber-500 transition-all duration-200"
                >
                  🏢 Business Days Calculator
                </Link>
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  );
};

/* ================= Small Live Countdown ================= */
const LiveCountdown: React.FC<{ startISO: string; endISO: string }> = ({ endISO }) => {
  const [tick, setTick] = useState<number>(Date.now());
  useEffect(() => { const id = setInterval(() => setTick(Date.now()), 1000); return () => clearInterval(id); }, []);
  const end = new Date(endISO);
  const now = new Date(tick);
  let msLeft = Math.max(0, end.getTime() - now.getTime());
  const seconds = Math.floor(msLeft / 1000) % 60;
  const minutes = Math.floor(msLeft / (1000 * 60)) % 60;
  const hours = Math.floor(msLeft / (1000 * 60 * 60)) % 24;
  const days = Math.floor(msLeft / (1000 * 60 * 60 * 24));
  return (
    <div className="font-mono text-2xl font-bold text-teal-300 flex items-center gap-2">
      <Clock3 className="h-6 w-6" /> {days}d {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </div>
  );
};

export default DateDifferenceCalculator;
