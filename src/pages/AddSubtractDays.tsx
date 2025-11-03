// Add/Subtract Days Calculator — Colorful, using Age Calculator UI pattern
import React, { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, CalendarMinus, PlusMinus, Copy, RotateCcw, CalendarDays, Info, PartyPopper } from "lucide-react";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

const RelatedCalculators = React.lazy(() => import("../components/RelatedCalculators"));
const AdBanner = React.lazy(() => import("../components/AdBanner"));

/* ================= Helpers ================= */
const isoToday = () => new Date().toISOString().split("T")[0];
const clampDateISO = (value: string) => {
  const d = new Date(value || Date.now());
  if (isNaN(d.getTime())) return isoToday();
  return d.toISOString().split("T")[0];
};

const getInitialLocal = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
};

const addDays = (base: Date, days: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

const toISO = (d: Date) => d.toISOString().split("T")[0];
const dayName = (d: Date) => d.toLocaleDateString(undefined, { weekday: "long" });
const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
const isHoliday = (d: Date, set: Set<string>) => set.has(toISO(d));

const walkBusinessDays = (base: Date, offset: number, holidays: Set<string>) => {
  // Offset can be positive or negative. Skip weekends + holidays.
  if (offset === 0) return new Date(base);
  const dir = offset > 0 ? 1 : -1;
  let remaining = Math.abs(offset);
  let cursor = new Date(base);
  while (remaining > 0) {
    cursor = addDays(cursor, dir);
    if (isWeekend(cursor) || isHoliday(cursor, holidays)) continue;
    remaining--;
  }
  return cursor;
};

const compactNumber = (n: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

/* ================= Component ================= */
const AddSubtractDaysCalculator: React.FC = () => {
  // Inputs
  const [baseDate, setBaseDate] = useState<string>(isoToday());
  const [days, setDays] = useState<number>(0);
  const [mode, setMode] = useState<"add" | "subtract">("add");
  const [error, setError] = useState<string>("");

  // Advanced
  const [advanced, setAdvanced] = useState<boolean>(() => getInitialLocal("as_adv_enabled", false));
  const [useBusinessDays, setUseBusinessDays] = useState<boolean>(() => getInitialLocal("as_adv_business", false));
  const [holidayText, setHolidayText] = useState<string>(() => getInitialLocal("as_adv_holidays", ""));
  const [includeStartIfBusiness, setIncludeStartIfBusiness] = useState<boolean>(() => getInitialLocal("as_adv_include_base", false));

  // Persist
  useEffect(() => { localStorage.setItem("as_adv_enabled", JSON.stringify(advanced)); }, [advanced]);
  useEffect(() => { localStorage.setItem("as_adv_business", JSON.stringify(useBusinessDays)); }, [useBusinessDays]);
  useEffect(() => { localStorage.setItem("as_adv_holidays", JSON.stringify(holidayText)); }, [holidayText]);
  useEffect(() => { localStorage.setItem("as_adv_include_base", JSON.stringify(includeStartIfBusiness)); }, [includeStartIfBusiness]);

  // Derived
  const base = useMemo(() => new Date(baseDate), [baseDate]);
  const holidaysSet = useMemo(() => {
    const lines = holidayText.split(/\n|,|;|\s+/).map(s => s.trim()).filter(Boolean);
    return new Set(lines);
  }, [holidayText]);

  const signedDays = useMemo(() => (mode === "add" ? days : -days), [mode, days]);

  const resultDate = useMemo(() => {
    if (isNaN(base.getTime())) return null;
    if (!useBusinessDays) return addDays(base, signedDays);

    // If including base when it's a business day and offset is >=0, we treat day 0 as day 1
    if (includeStartIfBusiness && !isWeekend(base) && !isHoliday(base, holidaysSet)) {
      if (signedDays >= 0) {
        return walkBusinessDays(base, signedDays, holidaysSet); // start counts as day 0, but we moved stepwise
      } else {
        return walkBusinessDays(base, signedDays, holidaysSet);
      }
    }
    return walkBusinessDays(base, signedDays, holidaysSet);
  }, [base, signedDays, useBusinessDays, holidaysSet, includeStartIfBusiness]);

  const todayISO = isoToday();
  const resultISO = resultDate ? toISO(resultDate) : "";
  const resultDay = resultDate ? dayName(resultDate) : "";

  // Relative info
  const totalDays = useMemo(() => Math.abs(signedDays), [signedDays]);
  const totalWeeks = useMemo(() => Math.floor(totalDays / 7), [totalDays]);
  const totalHours = useMemo(() => totalDays * 24, [totalDays]);
  const totalMinutes = useMemo(() => totalHours * 60, [totalHours]);
  const totalSeconds = useMemo(() => totalMinutes * 60, [totalMinutes]);

  useEffect(() => {
    if (isNaN(base.getTime())) setError("Please enter a valid base date.");
    else setError("");
  }, [base]);

  // Actions
  const handleReset = useCallback(() => {
    setBaseDate(isoToday());
    setDays(0);
    setMode("add");
    setError("");
    setAdvanced(false);
    setUseBusinessDays(false);
    setHolidayText("");
    setIncludeStartIfBusiness(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("as_adv_enabled");
      localStorage.removeItem("as_adv_business");
      localStorage.removeItem("as_adv_holidays");
      localStorage.removeItem("as_adv_include_base");
    }
  }, []);

  const [copied, setCopied] = useState(false);
  const copySummary = useCallback(async () => {
    const msg = `Base: ${baseDate}\nDays: ${days} (${mode})\nResult: ${resultISO} (${resultDay})`;
    try { await navigator.clipboard.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }, [baseDate, days, mode, resultISO, resultDay]);

  /* ================= SEO / Schema ================= */
  const faqSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "How do I add or subtract days from a date?", "acceptedAnswer": { "@type": "Answer", "text": "Choose a base date, enter the number of days, and pick add or subtract. The result updates instantly with the weekday." } },
      { "@type": "Question", "name": "Can I skip weekends or holidays?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Turn on Advanced Mode to count business days only and add custom holidays (YYYY-MM-DD)." } }
    ]
  }), []);

  const schemaArray = useMemo(() => ([
    generateCalculatorSchema(
      "Add/Subtract Days Calculator",
      seoData.addSubtractDays?.description || "Add or subtract days from a date. Optionally skip weekends and holidays.",
      "/add-subtract-days-calculator",
      seoData.addSubtractDays?.keywords || ["add days to date", "subtract days", "business days adder"]
    ),
    faqSchema,
  ]), [faqSchema]);

  /* ================= Render ================= */
  return (
    <>
      <SEOHead
        title={seoData.addSubtractDays?.title || "Add/Subtract Days Calculator – Business Day Option"}
        description={seoData.addSubtractDays?.description || "Add or subtract days from any date. Colorful UI, weekday output, and business-day/holiday controls."}
        canonical="https://calculatorhub.site/add-subtract-days-calculator"
        schemaData={schemaArray}
        breadcrumbs={[
          { name: "Date & Time Tools", url: "/category/date-time-tools" },
          { name: "Add/Subtract Days Calculator", url: "/add-subtract-days-calculator" }
        ]}
      />

      <div className="min-h-screen w-full py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ name: "Date & Time Tools", url: "/category/date-time-tools" }, { name: "Add/Subtract Days Calculator", url: "/add-subtract-days-calculator" }]} />

          {/* Hero */}
          <section className="mt-6 mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-fuchsia-400 via-emerald-300 to-sky-400 bg-clip-text text-transparent">
              Add/Subtract Days Calculator
            </h1>
            <p className="mt-2 text-slate-300 max-w-2xl">
              Choose a base date, enter days, and pick <span className="text-emerald-300 font-semibold">Add</span> or <span className="text-pink-300 font-semibold">Subtract</span>. Advanced Mode lets you skip weekends and custom holidays.
            </p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Inputs */}
            <section className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-100">Inputs</h2>
                <div className="flex items-center gap-2">
                  <button onClick={handleReset} type="button" className="text-white bg-yellow-700 hover:bg-yellow-800 focus:outline-none focus:ring-4 focus:ring-yellow-300 font-medium rounded-full text-sm px-2.5 py-1.5 dark:bg-yellow-600 dark:hover:bg-yellow-700 dark:focus:ring-yellow-800" aria-label="Reset all fields">
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label htmlFor="base-date" className="block text-sm font-medium text-slate-200 mb-2">Base Date</label>
                  <input id="base-date" type="date" value={baseDate} onChange={(e) => setBaseDate(e.target.value || isoToday())} className="w-full px-4 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="days" className="block text-sm font-medium text-slate-200 mb-2">Days</label>
                    <input id="days" type="number" inputMode="numeric" min={0} value={days.toString()} onChange={(e) => setDays(Math.max(0, Number(e.target.value) || 0))} className="w-full px-4 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Operation</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setMode("add")} className={`px-3 py-2 rounded-xl border ${mode === "add" ? "border-emerald-400 bg-emerald-500/10 text-emerald-200" : "border-slate-600 bg-slate-900/40 text-slate-200"}`}>
                        <CalendarPlus className="inline h-4 w-4 mr-1" /> Add
                      </button>
                      <button type="button" onClick={() => setMode("subtract")} className={`px-3 py-2 rounded-xl border ${mode === "subtract" ? "border-pink-400 bg-pink-500/10 text-pink-200" : "border-slate-600 bg-slate-900/40 text-slate-200"}`}>
                        <CalendarMinus className="inline h-4 w-4 mr-1" /> Subtract
                      </button>
                    </div>
                  </div>
                </div>

                {error && (<p className="text-sm text-red-400" role="alert">{error}</p>)}
              </div>
            </section>

            {/* Results */}
            <section className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">Result</h2>

              <div className="space-y-6">
                <div className="text-center p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 via-sky-500/15 to-fuchsia-500/15 border border-emerald-400/30">
                  <CalendarDays className="h-8 w-8 text-emerald-300 mx-auto mb-2" aria-hidden="true" />
                  <div className="text-2xl font-bold text-slate-100">{resultISO || "—"}</div>
                  <div className="text-sm text-slate-300">{resultDay || "Select inputs to see result"}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl text-center bg-emerald-500/10 border border-emerald-400/20">
                    <div className="text-xl font-semibold text-emerald-200">{baseDate}</div>
                    <div className="text-sm text-emerald-300">Base Date</div>
                  </div>
                  <div className="p-4 rounded-xl text-center bg-pink-500/10 border border-pink-400/20">
                    <div className="text-xl font-semibold text-pink-200">{mode === "add" ? "+" : "−"}{days}</div>
                    <div className="text-sm text-pink-300">Days {mode === "add" ? "Added" : "Subtracted"}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl text-center bg-violet-500/10 border border-violet-400/20">
                    <div className="text-xl font-semibold text-slate-100">{compactNumber(totalWeeks)}</div>
                    <div className="text-sm text-violet-300">Weeks (approx)</div>
                  </div>
                  <div className="p-4 rounded-xl text-center bg-amber-500/10 border border-amber-400/20">
                    <div className="text-xl font-semibold text-slate-100">{compactNumber(totalHours)}</div>
                    <div className="text-sm text-amber-300">Total Hours</div>
                  </div>
                  <div className="p-4 rounded-xl text-center bg-sky-500/10 border border-sky-400/20">
                    <div className="text-xl font-semibold text-slate-100">{compactNumber(totalMinutes)}</div>
                    <div className="text-sm text-sky-300">Total Minutes</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl text-center bg-rose-500/10 border border-rose-400/20">
                    <div className="text-xl font-semibold text-slate-100">{compactNumber(totalSeconds)}</div>
                    <div className="text-sm text-rose-300">Total Seconds</div>
                  </div>
                  <div className="p-4 rounded-xl text-center bg-teal-500/10 border border-teal-400/20">
                    <div className="text-xl font-semibold text-slate-100">{todayISO}</div>
                    <div className="text-sm text-teal-300">Today</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={copySummary} className="px-3 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-500 transition-colors shadow-sm"><Copy className="inline h-4 w-4 mr-1" /> {copied ? "Copied!" : "Copy"}</button>
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
                      <label className="block text-sm font-medium text-slate-200 mb-1">Count Business Days Only</label>
                      <select className="w-full px-3 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500" value={useBusinessDays ? "yes" : "no"} onChange={(e) => setUseBusinessDays(e.target.value === "yes")}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-1 flex items-center gap-1">Include Base If Business <Info className="h-3.5 w-3.5 text-slate-400" /></label>
                      <select className="w-full px-3 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500" value={includeStartIfBusiness ? "yes" : "no"} onChange={(e) => setIncludeStartIfBusiness(e.target.value === "yes")}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-1">Custom Holidays</label>
                      <textarea rows={3} className="w-full px-3 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="YYYY-MM-DD, YYYY-MM-DD\n2025-02-21, 2025-12-25" value={holidayText} onChange={(e) => setHolidayText(e.target.value)} />
                      <p className="text-xs text-slate-400 mt-1">Comma/line separated. Exact YYYY-MM-DD matches only.</p>
                    </div>
                  </div>

                  {/* Festive callout */}
                  {resultDate && (
                    <div className="p-4 rounded-xl border border-fuchsia-400/30 bg-gradient-to-r from-fuchsia-500/10 via-rose-500/10 to-amber-500/10">
                      <div className="flex items-center gap-2 text-fuchsia-200 font-semibold"><PartyPopper className="h-5 w-5" /> Heads‑up</div>
                      <p className="text-slate-200 mt-1 text-sm">{mode === "add" ? "Adding" : "Subtracting"} <strong>{days}</strong> {useBusinessDays ? "business " : ""}day(s) from <strong>{baseDate}</strong> will land on <strong>{resultISO}</strong> (<em>{resultDay}</em>).</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <Suspense fallback={null}>
            <div className="my-8">
              <AdBanner type="bottom" />
            </div>
            <RelatedCalculators currentPath="/add-subtract-days-calculator" category="date-time-tools" />
          </Suspense>

          {/* Brief SEO section */}
          <section className="mt-6">
            <h2 className="text-3xl md:text-4xl text-white"><strong>What is an Add/Subtract Days Calculator?</strong></h2>
            <p className="text-slate-300 py-3 leading-relaxed">It quickly shifts a date by a chosen number of days. Use business-day mode to skip weekends and your listed holidays.</p>
          </section>
        </div>
      </div>
    </>
  );
};

export default AddSubtractDaysCalculator;
