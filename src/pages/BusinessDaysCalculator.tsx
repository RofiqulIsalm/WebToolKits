// src/pages/BusinessDaysCalculator.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  CalendarPlus,
  CalendarRange,
  Copy,
  RotateCcw,
  Info,
  Trash2,
  Save,
} from "lucide-react";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import AdBanner from "../components/AdBanner";
import RelatedCalculators from "../components/RelatedCalculators";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

/* ----------------------- UI tokens (match your system) ----------------------- */
const btn =
  "inline-flex items-center gap-2 rounded-xl px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed";
const btnPrimary = "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30";
const btnNeutral = "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600";
const btnGhost = "bg-transparent hover:bg-slate-800/60 text-slate-200 border border-slate-700";

const card =
  "rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/60 border border-slate-700/70 backdrop-blur p-6";

const labelCls = "block text-sm font-medium text-slate-200 mb-2";
const inputCls =
  "w-full px-3 py-2 bg-slate-800/70 text-white rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500";
const smallMono = "mt-2 text-xs text-slate-400 font-mono break-all";

/* ------------------------------ Utils / Logic ------------------------------- */

const HOL_LS_KEY = "businessDaysHolidays_v1";

const toISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const isValidISO = (iso: string) => {
  const d = new Date(iso);
  return !Number.isNaN(d.getTime()) && iso.length === 10;
};

const parseHolidayText = (txt: string): string[] =>
  txt
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && isValidISO(l));

const nextDate = (iso: string, deltaDays: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + deltaDays);
  return toISODate(d);
};

const isWeekend = (date: Date) => {
  const wd = date.getDay();
  return wd === 0 || wd === 6; // Sun or Sat
};

const isHoliday = (date: Date, holidays: Set<string>) => holidays.has(toISODate(date));

const isBusinessDay = (date: Date, holidays: Set<string>) =>
  !isWeekend(date) && !isHoliday(date, holidays);

/** Count business days between two dates.
 * mode = "excludeStartIncludeEnd" (default) or "includeBoth" or "excludeBoth"
 */
const businessDaysBetween = (
  startISO: string,
  endISO: string,
  holidays: Set<string>,
  mode: "excludeStartIncludeEnd" | "includeBoth" | "excludeBoth" = "excludeStartIncludeEnd"
) => {
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  // Ensure start <= end
  let s = start;
  let e = end;
  let sign = 1;
  if (start > end) {
    s = end;
    e = start;
    sign = -1;
  }

  let count = 0;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const sameAsStart = d.toDateString() === s.toDateString();
    const sameAsEnd = d.toDateString() === e.toDateString();

    let include = isBusinessDay(d, holidays);
    if (mode === "excludeStartIncludeEnd" && sameAsStart) include = false;
    if (mode === "excludeBoth" && (sameAsStart || sameAsEnd)) include = false;
    // includeBoth leaves both ends as-is

    if (include) count++;
  }

  return count * sign;
};

/** Add N business days (N can be negative). */
const addBusinessDays = (startISO: string, n: number, holidays: Set<string>) => {
  const start = new Date(startISO);
  if (Number.isNaN(start.getTime())) return null;

  const step = n >= 0 ? 1 : -1;
  let remaining = Math.abs(n);
  const d = new Date(start);

  while (remaining > 0) {
    d.setDate(d.getDate() + step);
    if (isBusinessDay(d, holidays)) remaining--;
  }
  return d;
};

/* ---------------------------------- Page ----------------------------------- */

const BusinessDaysCalculator: React.FC = () => {
  // Difference
  const [fromISO, setFromISO] = useState<string>(() => toISODate(new Date()));
  const [toISO, setToISO] = useState<string>(() => nextDate(toISODate(new Date()), 7));
  const [mode, setMode] = useState<"excludeStartIncludeEnd" | "includeBoth" | "excludeBoth">(
    "excludeStartIncludeEnd"
  );

  // Add/Subtract
  const [startISO, setStartISO] = useState<string>(() => toISODate(new Date()));
  const [deltaBiz, setDeltaBiz] = useState<number>(5);

  // Holidays
  const [holidaysText, setHolidaysText] = useState<string>("");
  const [holidaysSet, setHolidaysSet] = useState<Set<string>>(new Set());

  // Batch add/subtract
  const [batchText, setBatchText] = useState<string>(""); // one date per line
  const [batchN, setBatchN] = useState<number>(3);

  useEffect(() => {
    // load holidays from LS
    const saved = localStorage.getItem(HOL_LS_KEY);
    if (saved) {
      setHolidaysText(saved);
      setHolidaysSet(new Set(parseHolidayText(saved)));
    }
  }, []);

  const diff = useMemo(() => {
    if (!isValidISO(fromISO) || !isValidISO(toISO)) return 0;
    return businessDaysBetween(fromISO, toISO, holidaysSet, mode);
  }, [fromISO, toISO, holidaysSet, mode]);

  const addSubResult = useMemo(() => {
    if (!isValidISO(startISO)) return null;
    const d = addBusinessDays(startISO, deltaBiz, holidaysSet);
    return d ? { iso: toISODate(d), label: d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "short", day: "numeric" }) } : null;
  }, [startISO, deltaBiz, holidaysSet]);

  const batchParsed = useMemo(() => {
    const rows = batchText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((iso) => {
        const valid = isValidISO(iso);
        const d = valid ? addBusinessDays(iso, batchN, holidaysSet) : null;
        return {
          input: iso,
          valid,
          resultISO: d ? toISODate(d) : "—",
          resultLabel: d
            ? d.toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "Invalid",
        };
      });
    return rows;
  }, [batchText, batchN, holidaysSet]);

  const copy = (txt: string) => navigator.clipboard.writeText(txt);

  const saveHolidays = () => {
    localStorage.setItem(HOL_LS_KEY, holidaysText);
    setHolidaysSet(new Set(parseHolidayText(holidaysText)));
  };

  const clearHolidays = () => {
    setHolidaysText("");
    setHolidaysSet(new Set());
    localStorage.removeItem(HOL_LS_KEY);
  };

  return (
    <>
      <SEOHead
        title={seoData?.businessDays?.title ?? "Business Days Calculator – Workday Difference & Add/Subtract"}
        description={
          seoData?.businessDays?.description ??
          "Calculate business days between dates (excludes weekends, optional holidays). Add or subtract workdays, batch process, and copy results."
        }
        canonical="https://calculatorhub.com/business-days-calculator"
        schemaData={generateCalculatorSchema(
          "Business Days Calculator",
          seoData?.businessDays?.description ??
            "Workday difference and add/subtract with optional holidays and batch processing.",
          "/business-days-calculator",
          seoData?.businessDays?.keywords ?? [
            "business days calculator",
            "workday calculator",
            "add business days",
            "business days between dates",
            "skip weekends",
          ]
        )}
        breadcrumbs={[
          { name: "Date & Time Tools", url: "/category/date-time-tools" },
          { name: "Business Days Calculator", url: "/business-days-calculator" },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <Breadcrumbs
          items={[
            { name: "Date & Time Tools", url: "/category/date-time-tools" },
            { name: "Business Days Calculator", url: "/business-days-calculator" },
          ]}
        />

        {/* Header */}
        <div className="mb-6 md:mb-8 px-1">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-blue-600/30 blur-lg" />
              <div className="relative rounded-2xl bg-blue-600/10 p-3 border border-blue-500/40">
                <Briefcase className="h-7 w-7 text-blue-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Business Days Calculator</h1>
              <p className="text-slate-300 text-sm md:text-base">
                Count workdays between dates, add/subtract business days, and manage holidays (local only).
              </p>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Difference */}
          <section className={card} aria-label="Business days between two dates">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <CalendarRange /> Business Days Between Dates
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>From</label>
                <input type="date" className={inputCls} value={fromISO} onChange={(e) => setFromISO(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>To</label>
                <input type="date" className={inputCls} value={toISO} onChange={(e) => setToISO(e.target.value)} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Count Method</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as any)}
                  className={inputCls}
                  title="Default: exclude start, include end"
                >
                  <option value="excludeStartIncludeEnd">Exclude start, include end (default)</option>
                  <option value="includeBoth">Include both</option>
                  <option value="excludeBoth">Exclude both</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <div className="rounded-xl bg-white/10 p-4 border border-white/10">
                  <div className="text-slate-300 text-sm">Business Days</div>
                  <div className="mt-1 text-3xl font-bold text-white">{diff}</div>
                  <div className="mt-3 flex gap-2">
                    <button className={`${btn} ${btnNeutral}`} onClick={() => copy(String(diff))}>
                      <Copy size={16} /> Copy
                    </button>
                    <button
                      className={`${btn} ${btnGhost}`}
                      onClick={() => {
                        setFromISO(toISODate(new Date()));
                        setToISO(nextDate(toISODate(new Date()), 7));
                        setMode("excludeStartIncludeEnd");
                      }}
                    >
                      <RotateCcw size={16} /> Reset
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Weekends (Sat/Sun) are skipped. Add any holidays below to exclude them as well.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Add/Subtract */}
          <section className={card} aria-label="Add or subtract business days">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <CalendarPlus /> Add/Subtract Business Days
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Start Date</label>
                <input type="date" className={inputCls} value={startISO} onChange={(e) => setStartISO(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Business Days (±)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={deltaBiz}
                  onChange={(e) => setDeltaBiz(Number(e.target.value))}
                  placeholder="e.g., 10 or -10"
                />
              </div>
              <div className="md:col-span-1">
                <label className={labelCls}>Result</label>
                <div className="rounded-xl bg-white/10 p-3 border border-white/10">
                  <div className="text-slate-300 text-sm">{addSubResult ? "Date" : "—"}</div>
                  <div className="text-lg font-semibold text-white">
                    {addSubResult ? addSubResult.label : "Invalid"}
                  </div>
                  {addSubResult && <div className={smallMono}>{addSubResult.iso}</div>}
                </div>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              {addSubResult && (
                <button className={`${btn} ${btnNeutral}`} onClick={() => copy(addSubResult.iso)}>
                  <Copy size={16} /> Copy ISO
                </button>
              )}
              <button
                className={`${btn} ${btnGhost}`}
                onClick={() => {
                  setStartISO(toISODate(new Date()));
                  setDeltaBiz(5);
                }}
              >
                <RotateCcw size={16} /> Reset
              </button>
            </div>
          </section>
        </div>

        {/* Holidays + Batch */}
        <div className="mt-6 lg:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Holidays */}
          <section className={card} aria-label="Holidays manager">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Holidays (Optional)</h2>
            <p className="text-slate-300 text-sm mb-3">
              Enter one date per line in <span className="font-mono">YYYY-MM-DD</span>. These dates will be excluded in
              both calculations. Stored locally in your browser.
            </p>
            <textarea
              rows={8}
              className={inputCls}
              placeholder={"2025-01-01\n2025-07-04\n2025-12-25"}
              value={holidaysText}
              onChange={(e) => setHolidaysText(e.target.value)}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button className={`${btn} ${btnPrimary}`} onClick={saveHolidays}>
                <Save size={16} /> Save Holidays
              </button>
              <button className={`${btn} ${btnGhost}`} onClick={clearHolidays}>
                <Trash2 size={16} /> Clear
              </button>
              <span className="text-slate-300 text-sm self-center">
                {parseHolidayText(holidaysText).length} saved
              </span>
            </div>
            {parseHolidayText(holidaysText).length > 0 && (
              <p className="text-xs text-slate-400 mt-2">
                Example use: national holidays, company shutdown days, or PTO.
              </p>
            )}
          </section>

          {/* Batch add/subtract */}
          <section className={card} aria-label="Batch add/subtract">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Batch Add/Subtract</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className={labelCls}>Dates (one per line)</label>
                <textarea
                  rows={6}
                  className={inputCls}
                  placeholder={"2025-03-01\n2025-03-15\n2025-04-01"}
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Business Days (±)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={batchN}
                  onChange={(e) => setBatchN(Number(e.target.value))}
                />
                <button
                  className={`${btn} ${btnNeutral} mt-3`}
                  onClick={() => {
                    const csv =
                      "date_in,offset, date_out\n" +
                      batchParsed
                        .map((r) => `${r.input},${batchN},${r.resultISO}`)
                        .join("\n");
                    copy(csv);
                  }}
                >
                  <Copy size={16} /> Copy CSV
                </button>
              </div>
            </div>

            {batchParsed.length > 0 && (
              <div className="mt-4 rounded-xl bg-white/5 border border-white/10 p-3 max-h-60 overflow-auto">
                <table className="w-full text-left text-slate-200 text-sm">
                  <thead className="text-slate-400">
                    <tr>
                      <th className="py-1 pr-2">Date In</th>
                      <th className="py-1 pr-2">Offset</th>
                      <th className="py-1">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchParsed.map((r, i) => (
                      <tr key={`${r.input}-${i}`} className={!r.valid ? "text-red-300" : ""}>
                        <td className="py-1 pr-2 font-mono">{r.input}</td>
                        <td className="py-1 pr-2">{batchN}</td>
                        <td className="py-1">
                          {r.resultISO}{" "}
                          <span className="text-slate-400">({r.resultLabel})</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <AdBanner />

        {/* ---------------- SEO content (concise, linked) ---------------- */}
        <div className="rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-3">About Business Days Calculator</h2>
          <p className="text-slate-300">
            This tool skips weekends automatically and lets you exclude custom <strong>holidays</strong> for your region or company.
            Use it to plan deliveries, SLAs, or sprint schedules. For exact calendar differences, try the{" "}
            <a href="/date-difference" className="text-blue-300 underline hover:text-blue-200">Date Difference Calculator</a>, and for simple day offsets use{" "}
            <a href="/time-add-subtract" className="text-blue-300 underline hover:text-blue-200">Time Add/Subtract</a>.
          </p>

          {/* FAQ (visible + JSON-LD parity) */}
          <section className="space-y-3 mt-6">
            <h3 className="text-xl font-semibold text-white">FAQ</h3>

            <div className="bg-slate-800/60 p-4 rounded-lg">
              <p className="font-medium text-white flex items-center gap-2">
                <Info size={16} /> Which days are skipped?
              </p>
              <p className="text-slate-300">
                Saturdays and Sundays are always skipped. Add optional holidays to exclude them as well.
              </p>
            </div>

            <div className="bg-slate-800/60 p-4 rounded-lg">
              <p className="font-medium text-white flex items-center gap-2">
                <Info size={16} /> What does “Exclude start, include end” mean?
              </p>
              <p className="text-slate-300">
                It doesn’t count the first day but does count the final day if it’s a business day. You can switch methods in the dropdown.
              </p>
            </div>

            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "Which days are skipped?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Saturdays and Sundays are skipped. You can also add holidays to exclude specific dates."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "What does “Exclude start, include end” mean?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "It doesn’t count the first day but does count the final day if it’s a business day. You can change this behavior with the counting mode."
                      }
                    }
                  ]
                }),
              }}
            />
          </section>
        </div>

        <RelatedCalculators currentPath="/business-days-calculator" category="date-time-tools" />
      </div>
    </>
  );
};

export default BusinessDaysCalculator;
