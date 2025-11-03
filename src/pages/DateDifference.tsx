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
            <RelatedCalculators currentPath="/date-difference-calculator" category="date-time-tools" />
          </Suspense>

          {/* SEO Content Section (brief) */}
          <section className="mt-5">
            <h2 className="text-3xl md:text-4xl text-white"><strong>What is a Date Difference Calculator?</strong></h2>
            <p className="text-slate-300 py-3 leading-relaxed">
              It measures the exact time between two dates in calendar units and totals. Use Advanced Mode for business-day counts and custom holidays.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div className="p-4 bg-blue-500/10 border border-blue-400/20 rounded-xl text-center">
                <h3 className="text-lg font-semibold text-blue-300 mb-1">📅 Calendar Diff</h3>
                <p className="text-slate-300 text-sm">Accurate Y/M/D difference with leap-year handling.</p>
              </div>
              <div className="p-4 bg-teal-500/10 border border-teal-400/20 rounded-xl text-center">
                <h3 className="text-lg font-semibold text-teal-300 mb-1">🏢 Business Days</h3>
                <p className="text-slate-300 text-sm">Exclude weekends and your custom holidays.</p>
              </div>
              <div className="p-4 bg-amber-500/10 border border-amber-400/20 rounded-xl text-center">
                <h3 className="text-lg font-semibold text-amber-300 mb-1">⏱️ Totals</h3>
                <p className="text-slate-300 text-sm">Days, weeks, months, hours, minutes, seconds.</p>
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
