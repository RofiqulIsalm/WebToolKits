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

  /* ================= SEO ================= */
  const faqSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "How do I count business days between two dates?", "acceptedAnswer": { "@type": "Answer", "text": "Select start and end dates, choose inclusivity, and set your weekend pattern and holidays in Advanced Mode." } },
      { "@type": "Question", "name": "How do I add business days to a date?", "acceptedAnswer": { "@type": "Answer", "text": "Switch to the Add/Subtract tab, enter an offset, and the tool skips weekends/holidays to give the target date." } }
    ]
  }), []);

  const schemaArray = useMemo(() => ([
    generateCalculatorSchema(
      "Business Days Calculator",
      seoData.businessDays?.description || "Count business days between dates or add/subtract business days, skipping weekends and custom holidays.",
      "/business-days-calculator",
      seoData.businessDays?.keywords || ["business days calculator", "work days between dates", "add business days", "skip weekends"]
    ),
    faqSchema,
  ]), [faqSchema]);

  /* ================= Render ================= */
  return (
    <>
      <SEOHead
        title={seoData.businessDays?.title || "Business Days Calculator – Count & Add/Subtract"}
        description={seoData.businessDays?.description || "Count business days between two dates or add/subtract business days. Configure weekend patterns and holidays."}
        canonical="https://calculatorhub.site/business-days-calculator"
        schemaData={schemaArray}
        breadcrumbs={[
          { name: "Date & Time Tools", url: "/category/date-time-tools" },
          { name: "Business Days Calculator", url: "/business-days-calculator" }
        ]}
      />

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
            <RelatedCalculators currentPath="/business-days-calculator" category="date-time-tools" />
          </Suspense>

          {/* SEO snippet */}
          <section className="mt-6">
            <h2 className="text-3xl md:text-4xl text-white"><strong>What is a Business Days Calculator?</strong></h2>
            <p className="text-slate-300 py-3 leading-relaxed">A tool to compute working days between dates or to shift a date by N business days, skipping weekends and your listed holidays. Configure regional workweeks and custom closures in Advanced Mode.</p>
          </section>
        </div>
      </div>
    </>
  );
};

export default BusinessDaysCalculator;
