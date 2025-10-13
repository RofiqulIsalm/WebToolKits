// src/pages/WeekdayFinder.tsx
import React, { useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  Search,
  Copy,
  RotateCcw,
  Info,
  ListChecks,
} from "lucide-react";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import AdBanner from "../components/AdBanner";
import RelatedCalculators from "../components/RelatedCalculators";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

/** ---------- Local UI tokens to stay consistent with your design ---------- */
const btn =
  "inline-flex items-center gap-2 rounded-xl px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed";
const btnPrimary = "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30";
const btnNeutral = "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600";
const btnGhost = "bg-transparent hover:bg-slate-800/60 text-slate-200 border border-slate-700";
const card =
  "rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/60 border border-slate-700/70 backdrop-blur p-6";
const input =
  "w-full px-3 py-2 bg-slate-800/70 text-white rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500";
const label = "block text-sm font-medium text-slate-200 mb-2";
const smallMono = "mt-2 text-xs text-slate-400 font-mono break-all";

/** ---------- Helpers ---------- */
const weekdayNames = (locale?: string) =>
  Array.from({ length: 7 }, (_, i) =>
    new Date(2020, 5, 7 + i).toLocaleDateString(locale, { weekday: "long" }) // 2020-06-07 is Sunday
  );

const getWeekdayName = (iso: string, locale?: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(locale, { weekday: "long" });
};

const toISODate = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const nthWeekdayOfMonth = (year: number, month1to12: number, weekday0Sun: number, n1to5: number) => {
  // month1to12: 1..12, weekday0Sun: 0..6, n1to5: 1..5
  const first = new Date(year, month1to12 - 1, 1);
  const firstW = first.getDay();
  const add = (weekday0Sun - firstW + 7) % 7;
  const day = 1 + add + (n1to5 - 1) * 7;
  const result = new Date(year, month1to12 - 1, day);
  if (result.getMonth() !== month1to12 - 1) return null; // overflow (e.g., 5th Monday may not exist)
  return result;
};

const nextPrevWeekday = (startISO: string, target0Sun: number, direction: "next" | "prev") => {
  const start = new Date(startISO);
  if (Number.isNaN(start.getTime())) return null;
  const step = direction === "next" ? 1 : -1;
  const d = new Date(start);
  for (let i = 0; i < 7; i++) {
    d.setDate(d.getDate() + step);
    if (d.getDay() === target0Sun) return d;
  }
  return null;
};

/** ---------- Component ---------- */
const WeekdayFinder: React.FC = () => {
  const [dateISO, setDateISO] = useState<string>(() => toISODate(new Date()));
  const [batchText, setBatchText] = useState<string>(""); // one YYYY-MM-DD per line
  const [nthYear, setNthYear] = useState<number>(new Date().getFullYear());
  const [nthMonth, setNthMonth] = useState<number>(new Date().getMonth() + 1);
  const [nthWeekday, setNthWeekday] = useState<number>(1); // 0..6
  const [nthN, setNthN] = useState<number>(1); // 1..5

  const [npStartISO, setNpStartISO] = useState<string>(() => toISODate(new Date()));
  const [npTarget, setNpTarget] = useState<number>(5); // 0..6
  const [npDir, setNpDir] = useState<"next" | "prev">("next");

  const locale = undefined; // use browser locale
  const weekdays = useMemo(() => weekdayNames(locale), [locale]);

  const copy = (txt: string) => navigator.clipboard.writeText(txt);

  const batchParsed = useMemo(() => {
    const lines = batchText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const rows = lines.map((l) => {
      const d = new Date(l);
      const ok = !Number.isNaN(d.getTime());
      return { input: l, valid: ok, weekday: ok ? d.toLocaleDateString(locale, { weekday: "long" }) : "Invalid" };
    });
    return rows;
  }, [batchText, locale]);

  const nthDate = useMemo(() => {
    const d = nthWeekdayOfMonth(nthYear, nthMonth, nthWeekday, nthN);
    return d ? { iso: toISODate(d), label: d.toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "short", day: "numeric" }) } : null;
  }, [nthYear, nthMonth, nthWeekday, nthN, locale]);

  const npResult = useMemo(() => {
    const d = nextPrevWeekday(npStartISO, npTarget, npDir);
    return d ? { iso: toISODate(d), label: d.toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "short", day: "numeric" }) } : null;
  }, [npStartISO, npTarget, npDir, locale]);

  return (
    <>
      <SEOHead
        title={seoData?.weekdayFinder?.title ?? "Weekday Finder – What Day Is This Date?"}
        description={
          seoData?.weekdayFinder?.description ??
          "Instantly find the weekday for any date. Batch lookup, next/previous weekday, and Nth weekday of a month. Free, fast, and private."
        }
        canonical="https://calculatorhub.site/weekday-finder"
        schemaData={generateCalculatorSchema(
          "Weekday Finder",
          seoData?.weekdayFinder?.description ??
            "Find the weekday for a date. Batch lookup, next/previous weekday, and Nth weekday.",
          "/weekday-finder",
          seoData?.weekdayFinder?.keywords ?? ["weekday finder", "what day is it", "day of week", "nth weekday", "next friday"]
        )}
        breadcrumbs={[
          { name: "Date & Time Tools", url: "/category/date-time-tools" },
          { name: "Weekday Finder", url: "/weekday-finder" },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <Breadcrumbs
          items={[
            { name: "Date & Time Tools", url: "/category/date-time-tools" },
            { name: "Weekday Finder", url: "/weekday-finder" },
          ]}
        />

        {/* Header */}
        <div className="mb-6 md:mb-8 px-1">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-blue-600/30 blur-lg" />
              <div className="relative rounded-2xl bg-blue-600/10 p-3 border border-blue-500/40">
                <CalendarIcon className="h-7 w-7 text-blue-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Weekday Finder</h1>
              <p className="text-slate-300 text-sm md:text-base">
                Find the day of week for any date — plus batch lookup, next/previous weekday, and Nth weekday of a month.
              </p>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Single date */}
          <section className={card} aria-label="Single date lookup">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Search /> Single Date
            </h2>

            <label className={label}>Pick a date</label>
            <input
              type="date"
              value={dateISO}
              onChange={(e) => setDateISO(e.target.value)}
              className={input}
            />

            <div className="mt-4 rounded-xl bg-white/10 p-4 border border-white/10">
              <div className="text-slate-300 text-sm">Weekday</div>
              <div className="mt-1 text-2xl font-bold text-white">
                {getWeekdayName(dateISO, locale)}
              </div>
              <div className={smallMono}>{dateISO}</div>
              <div className="mt-3 flex gap-2">
                <button className={`${btn} ${btnNeutral}`} onClick={() => copy(getWeekdayName(dateISO, locale))}>
                  <Copy size={16} /> Copy Day
                </button>
                <button className={`${btn} ${btnGhost}`} onClick={() => setDateISO(toISODate(new Date()))}>
                  <RotateCcw size={16} /> Today
                </button>
              </div>
            </div>
          </section>

          {/* Batch */}
          <section className={card} aria-label="Batch dates">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <ListChecks /> Batch Lookup
            </h2>
            <label className={label}>Enter one date per line (YYYY-MM-DD)</label>
            <textarea
              rows={8}
              className={input}
              placeholder={"2026-01-01\n2026-07-04\n2026-12-31"}
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
            />
            <div className="mt-4 flex items-center gap-2">
              <button
                className={`${btn} ${btnPrimary}`}
                onClick={() => {
                  const csv = ["date,weekday"].concat(
                    batchParsed.map((r) => `${r.input},${r.weekday}`)
                  ).join("\n");
                  copy(csv);
                }}
              >
                <Copy size={16} /> Copy CSV
              </button>
              <span className="text-slate-300 text-sm">
                {batchParsed.length} row{batchParsed.length === 1 ? "" : "s"}
              </span>
            </div>

            {batchParsed.length > 0 && (
              <div className="mt-4 rounded-xl bg-white/5 border border-white/10 p-3 max-h-56 overflow-auto">
                <table className="w-full text-left text-slate-200 text-sm">
                  <thead className="text-slate-400">
                    <tr>
                      <th className="py-1 pr-2">Date</th>
                      <th className="py-1">Weekday</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchParsed.map((r, i) => (
                      <tr key={`${r.input}-${i}`} className={!r.valid ? "text-red-300" : ""}>
                        <td className="py-1 pr-2 font-mono">{r.input}</td>
                        <td className="py-1">{r.weekday}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Advanced tools */}
        <div className="mt-6 lg:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Nth weekday */}
          <section className={card} aria-label="Nth weekday of month">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Nth Weekday of a Month</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className={label}>Year</label>
                <input
                  type="number"
                  className={input}
                  value={nthYear}
                  onChange={(e) => setNthYear(Number(e.target.value))}
                />
              </div>
              <div>
                <label className={label}>Month</label>
                <select className={input} value={nthMonth} onChange={(e) => setNthMonth(Number(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString(undefined, { month: "long" })}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Weekday</label>
                <select className={input} value={nthWeekday} onChange={(e) => setNthWeekday(Number(e.target.value))}>
                  {weekdays.map((w, i) => (
                    <option key={i} value={i}>{w}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Nth</label>
                <select className={input} value={nthN} onChange={(e) => setNthN(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-white/10 p-4 border border-white/10">
              <div className="text-slate-300 text-sm">Result</div>
              <div className="mt-1 text-xl font-semibold text-white">
                {nthDate ? `${nthDate.label}` : "Does not exist in this month"}
              </div>
              {nthDate && <div className={smallMono}>{nthDate.iso}</div>}
            </div>
          </section>

          {/* Next / Previous weekday */}
          <section className={card} aria-label="Next or previous weekday from a date">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Next/Previous Weekday</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={label}>Start Date</label>
                <input type="date" className={input} value={npStartISO} onChange={(e) => setNpStartISO(e.target.value)} />
              </div>
              <div>
                <label className={label}>Target</label>
                <select className={input} value={npTarget} onChange={(e) => setNpTarget(Number(e.target.value))}>
                  {weekdays.map((w, i) => (
                    <option key={i} value={i}>{w}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Direction</label>
                <select className={input} value={npDir} onChange={(e) => setNpDir(e.target.value as "next" | "prev")}>
                  <option value="next">Next</option>
                  <option value="prev">Previous</option>
                </select>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-white/10 p-4 border border-white/10">
              <div className="text-slate-300 text-sm">Result</div>
              <div className="mt-1 text-xl font-semibold text-white">
                {npResult ? `${npResult.label}` : "—"}
              </div>
              {npResult && <div className={smallMono}>{npResult.iso}</div>}
            </div>
          </section>
        </div>

        <AdBanner />

        {/* ---------- SEO content (concise) ---------- */}
        <div className="rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-3">About Weekday Finder</h2>
          <p className="text-slate-300">
            The Weekday Finder instantly returns the day of week for any date. Use batch mode to paste many dates at once,
            quickly locate the <strong>next Friday</strong> or the <strong>previous Monday</strong>, and generate the <strong>Nth weekday</strong> of a month
            (e.g., 3rd Wednesday in May 2026).
          </p>

          {/* FAQ schema mirrors visible items */}
          <section className="space-y-3 mt-6">
            <h3 className="text-xl font-semibold text-white">FAQ</h3>
            <div className="bg-slate-800/60 p-4 rounded-lg">
              <p className="font-medium text-white flex items-center gap-2"><Info size={16}/> Can I paste many dates?</p>
              <p className="text-slate-300">Yes—use Batch Lookup. One date per line (YYYY-MM-DD). Copy the CSV in one click.</p>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-lg">
              <p className="font-medium text-white flex items-center gap-2"><Info size={16}/> What if the 5th weekday doesn’t exist?</p>
              <p className="text-slate-300">For months with only four instances (e.g., some months have only four Mondays),
                the tool shows “Does not exist in this month”.</p>
            </div>

            {/* JSON-LD */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "Can I paste many dates?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Yes—use Batch Lookup. Enter one date per line in YYYY-MM-DD format and copy the CSV result." }
                    },
                    {
                      "@type": "Question",
                      "name": "What if the 5th weekday doesn’t exist?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Some months only have four instances of a weekday. In that case the result indicates it does not exist." }
                    }
                  ]
                }),
              }}
            />
          </section>
        </div>

        <RelatedCalculators currentPath="/weekday-finder" category="date-time-tools" />
      </div>
    </>
  );
};

export default WeekdayFinder;
