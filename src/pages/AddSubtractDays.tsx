import React, { useEffect, useMemo, useState, memo } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  History as HistoryIcon,
  RotateCcw,
  FileDown,
  Copy,
  Info as InfoIcon,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Trash2,
} from "lucide-react";
import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import RelatedCalculators from "../components/RelatedCalculators";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

/* ======================
   Styles (shared tokens)
====================== */
const btn =
  "inline-flex items-center gap-2 rounded-xl px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed";
const btnPrimary = "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30";
const btnNeutral = "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600";
const btnGhost = "bg-transparent hover:bg-slate-800/60 text-slate-200 border border-slate-700";

const card = "rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/60 border border-slate-700/70 backdrop-blur p-6";
const labelCls = "block text-sm font-medium text-slate-200 mb-2";
const inputCls =
  "w-full px-3 py-2 bg-slate-800/70 text-white rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500";
const smallMono = "mt-2 text-xs text-slate-400 font-mono break-all";

/* ======================
   Types
====================== */
type RollRule = "none" | "forward" | "backward";
type Region = "none" | "us";

/* History */
type HistoryItem = {
  id: string;
  startISO: string;
  op: "add" | "sub";
  days: number;
  business: boolean;
  region: Region;
  roll: RollRule;
  customHolidays: string[]; // yyyy-mm-dd
  resultISO: string;
  weekday: string;
  summary: string; // compact
  noteTitle?: string;
  noteBody?: string;
  createdAtISO: string;
};

/* ======================
   Local Storage
====================== */
const LS_KEY = "addSubDaysHistory_v1";

/* ======================
   Date helpers
====================== */
const toISODate = (d: Date) => d.toISOString().slice(0, 10);
const fmtHuman = (d: Date) =>
  d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit", weekday: "long" });

const parseISO = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};
const isWeekend = (d: Date) => {
  const n = d.getDay();
  return n === 0 || n === 6;
};

/* US holiday generator (observed):
   - New Year’s Day (Jan 1, observe weekday)
   - MLK Day (3rd Mon Jan)
   - Memorial Day (last Mon May)
   - Independence Day (Jul 4, observe weekday)
   - Labor Day (1st Mon Sep)
   - Thanksgiving (4th Thu Nov)
   - Christmas (Dec 25, observe weekday)
   Enough for a useful sample without external deps. */
function nthWeekdayOfMonth(year: number, month0: number, weekday: number, n: number) {
  const d = new Date(year, month0, 1);
  while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
  d.setDate(d.getDate() + 7 * (n - 1));
  return d;
}
function lastWeekdayOfMonth(year: number, month0: number, weekday: number) {
  const d = new Date(year, month0 + 1, 0); // last day of month
  while (d.getDay() !== weekday) d.setDate(d.getDate() - 1);
  return d;
}
function observedFixed(year: number, month0: number, date: number) {
  const d = new Date(year, month0, date);
  // observe Mon/Fri if weekend
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  if (d.getDay() === 6) d.setDate(d.getDate() - 1);
  return d;
}
function usHolidaySetAround(year: number): Set<string> {
  const years = [year - 1, year, year + 1]; // cover spillovers
  const set = new Set<string>();
  for (const y of years) {
    set.add(toISODate(observedFixed(y, 0, 1))); // New Year
    set.add(toISODate(nthWeekdayOfMonth(y, 0, 1, 3))); // MLK (3rd Mon Jan)
    set.add(toISODate(lastWeekdayOfMonth(y, 4, 1))); // Memorial (last Mon May)
    set.add(toISODate(observedFixed(y, 6, 4))); // July 4
    set.add(toISODate(nthWeekdayOfMonth(y, 8, 1, 1))); // Labor Day (1st Mon Sep)
    set.add(toISODate(nthWeekdayOfMonth(y, 10, 4, 4))); // Thanksgiving (4th Thu Nov)
    set.add(toISODate(observedFixed(y, 11, 25))); // Christmas
  }
  return set;
}

/* Add calendar days safely */
function addCalendarDays(start: Date, n: number) {
  const d = new Date(start);
  d.setDate(d.getDate() + n);
  return d;
}

/* Add business days (skip weekends + holidays) */
function addBusinessDays(start: Date, n: number, holidays: Set<string>) {
  const step = n >= 0 ? 1 : -1;
  let remain = Math.abs(n);
  const d = new Date(start);
  while (remain > 0) {
    d.setDate(d.getDate() + step);
    const iso = toISODate(d);
    if (!isWeekend(d) && !holidays.has(iso)) remain--;
  }
  return d;
}

function applyRollRule(d: Date, rule: RollRule, holidays: Set<string>) {
  if (rule === "none") return d;
  const step = rule === "forward" ? 1 : -1;
  const out = new Date(d);
  while (isWeekend(out) || holidays.has(toISODate(out))) {
    out.setDate(out.getDate() + step);
  }
  return out;
}

/* ======================
   Tiny components
====================== */
const InlineAlert = memo(function InlineAlert({
  variant = "info",
  icon,
  children,
  className = "",
}: {
  variant?: "info" | "success" | "warning" | "danger";
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const styles: Record<"info" | "success" | "warning" | "danger", string> = {
    info: "bg-blue-50 text-blue-800 border-blue-200",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
    danger: "bg-red-50 text-red-800 border-red-200",
  };
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm inline-flex items-center gap-2 ${styles[variant]} ${className}`}>
      {icon}
      <span>{children}</span>
    </div>
  );
});

const NumberBox = ({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) => (
  <div>
    <label className="block text-xs text-slate-400 mb-1">{label}</label>
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={inputCls}
    />
  </div>
);

const HistoryRow = memo(function HistoryRow({
  item,
  onEdit,
  onDelete,
  onInfo,
}: {
  item: HistoryItem;
  onEdit: () => void;
  onDelete: () => void;
  onInfo?: (item: HistoryItem) => void;
}) {
  return (
    <div className="py-3 px-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-lg border bg-gray-50 border-gray-200">
      <div>
        <div className="font-medium text-gray-900">
          {fmtHuman(new Date(item.startISO))} → {item.op === "add" ? "+" : "−"}
          {Math.abs(item.days)} {item.business ? "business " : ""}days
          {item.roll !== "none" ? ` (roll ${item.roll})` : ""} ={" "}
          <span className="underline decoration-dotted">{fmtHuman(new Date(item.resultISO))}</span>
        </div>
        <div className="text-sm text-gray-800">{item.summary}</div>
        <div className="text-xs text-gray-500">Saved {new Date(item.createdAtISO).toLocaleString()}</div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {onInfo && (item.noteTitle || item.noteBody) && (
          <button onClick={() => onInfo(item)} className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 text-sm inline-flex items-center gap-1">
            <InfoIcon className="w-4 h-4" /> Info
          </button>
        )}
        <button onClick={onEdit} className="px-3 py-1.5 rounded-lg bg-blue-800 text-white hover:bg-blue-700 text-sm inline-flex items-center gap-1">
          <Edit3 className="w-4 h-4" /> Edit
        </button>
        <button onClick={onDelete} className="px-3 py-1.5 rounded-lg bg-red-700 text-white hover:bg-red-600 text-sm inline-flex items-center gap-1">
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>
    </div>
  );
});

/* ======================
   Main
====================== */
const AddSubtractDays: React.FC = () => {
  // Inputs
  const [startISO, setStartISO] = useState<string>(new Date().toISOString().slice(0, 10));
  const [op, setOp] = useState<"add" | "sub">("add");
  const [days, setDays] = useState<number>(30);
  const [business, setBusiness] = useState<boolean>(false);
  const [region, setRegion] = useState<Region>("none");
  const [roll, setRoll] = useState<RollRule>("none");

  const [customStr, setCustomStr] = useState<string>(""); // csv yyyy-mm-dd
  const customList = useMemo(
    () => Array.from(new Set(customStr.split(/[, \n\r\t]+/).map((s) => s.trim()).filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s)))),
    [customStr]
  );

  // Multiple offsets
  const [offsetsStr, setOffsetsStr] = useState<string>("+7, 30, -14");

  // Notes + UI
  const [notesEnabled, setNotesEnabled] = useState<boolean>(false);
  const [noteTitle, setNoteTitle] = useState<string>("");
  const [noteBody, setNoteBody] = useState<string>("");

  const [toast, setToast] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Modal (simple)
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>("");
  const [modalBody, setModalBody] = useState<string>("");

  // History
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as HistoryItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  /* Toast helper */
  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(""), 1200);
  };

  /* URL params → state */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const s = q.get("start");
    const o = q.get("op");
    const d = q.get("days");
    const b = q.get("biz");
    const r = q.get("region");
    const rl = q.get("roll");
    const c = q.get("custom");
    const offs = q.get("offsets");
    if (s && /^\d{4}-\d{2}-\d{2}$/.test(s)) setStartISO(s);
    if (o === "add" || o === "sub") setOp(o);
    if (d && !Number.isNaN(Number(d))) setDays(Number(d));
    if (b === "1") setBusiness(true);
    if (r === "us") setRegion("us");
    if (rl === "forward" || rl === "backward" || rl === "none") setRoll(rl);
    if (c) setCustomStr(c);
    if (offs) setOffsetsStr(offs);
  }, []);

  /* Derived holiday set */
  const holidaySet = useMemo(() => {
    let set = new Set<string>();
    if (region === "us" && startISO) {
      const y = new Date(startISO).getFullYear();
      set = usHolidaySetAround(y);
    }
    customList.forEach((d) => set.add(d));
    return set;
  }, [region, customList, startISO]);

  /* Calculate main result */
  const result = useMemo(() => {
    const start = parseISO(startISO);
    if (!start || Number.isNaN(days)) return null;

    const n = op === "add" ? days : -Math.abs(days);
    let raw = business ? addBusinessDays(start, n, holidaySet) : addCalendarDays(start, n);
    raw = applyRollRule(raw, roll, holidaySet);
    const iso = toISODate(raw);
    const wk = raw.toLocaleDateString(undefined, { weekday: "long" });
    return { date: raw, iso, weekday: wk, weeks: Math.floor(Math.abs(days) / 7) };
  }, [startISO, op, days, business, roll, holidaySet]);

  /* Multiple offsets schedule */
  const schedule = useMemo(() => {
    const start = parseISO(startISO);
    if (!start) return [];
    const items: { offset: number; date: Date; iso: string; weekday: string }[] = [];
    const parts = offsetsStr.split(/[, \n]+/).map((x) => x.trim()).filter(Boolean);
    for (const p of parts) {
      if (!/^[-+]?[\d]+$/.test(p)) continue;
      const n = Number(p);
      let d = business ? addBusinessDays(start, n, holidaySet) : addCalendarDays(start, n);
      d = applyRollRule(d, roll, holidaySet);
      items.push({ offset: n, date: d, iso: toISODate(d), weekday: d.toLocaleDateString(undefined, { weekday: "long" }) });
    }
    return items;
  }, [startISO, offsetsStr, business, roll, holidaySet]);

  /* Copy helpers */
  const copyText = (t: string) => {
    navigator.clipboard.writeText(t);
    showToast("Copied!");
  };

  /* Export CSV */
  const exportCSV = () => {
    const rows = [
      ["Start Date", startISO],
      ["Operation", op],
      ["Days", String(days)],
      ["Business Days", business ? "Yes" : "No"],
      ["Region", region],
      ["Roll Rule", roll],
      ["Custom Holidays", customList.join(" ") || "-"],
      [],
      ["Result ISO", result?.iso || "-"],
      ["Result Weekday", result?.weekday || "-"],
      [],
      ["Offset", "ISO", "Weekday"],
      ...schedule.map((s) => [String(s.offset), s.iso, s.weekday]),
    ];
    const csv = rows.map((r) => r.map((x) => `"${(x ?? "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "add-subtract-days.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* Push state to URL on change (light debounce) */
  useEffect(() => {
    const t = setTimeout(() => {
      const q = new URLSearchParams();
      q.set("start", startISO);
      q.set("op", op);
      q.set("days", String(days));
      if (business) q.set("biz", "1");
      if (region !== "none") q.set("region", region);
      if (roll !== "none") q.set("roll", roll);
      if (customList.length) q.set("custom", customList.join(","));
      if (offsetsStr.trim()) q.set("offsets", offsetsStr.trim());
      const next = `${window.location.pathname}?${q.toString()}`;
      window.history.replaceState({}, "", next);
    }, 250);
    return () => clearTimeout(t);
  }, [startISO, op, days, business, region, roll, customList, offsetsStr]);

  const errMsg = useMemo(() => {
    if (!parseISO(startISO)) return "Please select a valid start date.";
    if (Number.isNaN(days)) return "Days must be a number.";
    return "";
  }, [startISO, days]);

  useEffect(() => setError(errMsg), [errMsg]);

  /* Save to history */
  const saveHistory = () => {
    if (!result) return;
    const item: HistoryItem = {
      id: `${Date.now()}`,
      startISO,
      op,
      days: Math.abs(days),
      business,
      region,
      roll,
      customHolidays: customList,
      resultISO: result.iso,
      weekday: result.weekday,
      summary: `${op === "add" ? "+" : "−"}${Math.abs(days)} ${business ? "business " : ""}days → ${result.iso} (${result.weekday})`,
      noteTitle: notesEnabled && noteTitle ? noteTitle : undefined,
      noteBody: notesEnabled && noteBody ? noteBody : undefined,
      createdAtISO: new Date().toISOString(),
    };
    const next = [item, ...history].slice(0, 50);
    setHistory(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    // Reset notes immediately on success
    setNotesEnabled(false);
    setNoteTitle("");
    setNoteBody("");
    showToast("Saved to history");
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(LS_KEY);
  };

  return (
    <>
      <SEOHead
        title={seoData?.addSubtractDays?.title ?? "Add/Subtract Days Calculator (Business Days & Holidays) | CalculatorHub"}
        description={
          seoData?.addSubtractDays?.description ??
          "Add or subtract days from a date—optionally skip weekends and holidays, and roll to the nearest business day. Make schedules, copy results, and export CSV."
        }
        canonical="https://calculatorhub.site/add-subtract-days"
        schemaData={generateCalculatorSchema(
          "Add/Subtract Days Calculator",
          seoData?.addSubtractDays?.description ??
            "Add/subtract calendar or business days from a start date. Skip holidays, roll forward/backward, and export schedules.",
          "/add-subtract-days",
          ["add days to date", "subtract days", "business days calculator", "skip holidays", "workday calculator"]
        )}
        breadcrumbs={[
          { name: "Date & Time Tools", url: "/category/date-time-tools" },
          { name: "Add/Subtract Days", url: "/add-subtract-days" },
        ]}
      />

      {/* JSON-LD: WebApplication */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Add/Subtract Days Calculator",
            "url": "https://calculatorhub.site/add-subtract-days",
            "applicationCategory": "CalculatorApplication",
            "operatingSystem": "Web",
            "description":
              "Add or subtract calendar/business days from a start date. Skip weekends/holidays, apply rolling rules, and export schedules.",
            "image": "https://calculatorhub.site/images/add-subtract-days-hero.webp",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
          }),
        }}
      />
      {/* JSON-LD: BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Date & Time Tools", "item": "https://calculatorhub.site/category/date-time-tools" },
              { "@type": "ListItem", "position": 2, "name": "Add/Subtract Days Calculator", "item": "https://calculatorhub.site/add-subtract-days" }
            ]
          }),
        }}
      />

      <div className="max-w-6xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Date & Time Tools", url: "/category/date-time-tools" },
            { name: "Add/Subtract Days", url: "/add-subtract-days" },
          ]}
        />

        {/* Header */}
        <div className="mb-6 md:mb-8 px-1">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-blue-600/30 blur-lg" />
              <div className="relative rounded-2xl bg-blue-600/10 p-3 border border-blue-500/40">
                <CalendarClock className="h-7 w-7 text-blue-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Add/Subtract Days Calculator</h1>
              <p className="text-slate-300 text-sm md:text-base">
                Add or subtract calendar/business days—skip weekends & holidays, apply rolling rules, and build quick schedules.
              </p>
            </div>
          </div>

          {/* Instant Answers */}
          <div className="mt-4 rounded-xl bg-white/5 ring-1 ring-white/10 p-4 text-slate-200">
            <h2 className="text-lg font-semibold text-white">How to add days to a date</h2>
            <ol className="list-decimal ml-5 mt-2 space-y-1">
              <li>Pick a <strong>Start Date</strong> and choose <strong>Add</strong> or <strong>Subtract</strong>.</li>
              <li>Enter the number of <strong>days</strong> (toggle <em>Business days</em> if needed).</li>
              <li>Optionally skip <em>holidays</em> and pick a <em>rolling rule</em>—copy the result or export CSV.</li>
            </ol>
            <p className="mt-2 text-sm">
              Need hours/minutes? Try{" "}
              <a href="/time-add-subtract" className="text-blue-300 underline hover:text-blue-200">Time Add/Subtract</a>.  
              Want a countdown to the result? Use{" "}
              <a href="/countdown-timer" className="text-blue-300 underline hover:text-blue-200">Countdown Timer</a>.
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left: Inputs */}
          <section className={card} aria-label="Inputs">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Inputs</h2>

            {error && (
              <div className="mb-3">
                <InlineAlert variant="danger" icon={<AlertTriangle className="w-4 h-4" />}>{error}</InlineAlert>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Start Date</label>
                <input
                  type="date"
                  value={startISO}
                  onChange={(e) => setStartISO(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Add or Subtract</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={`${btn} ${op === "add" ? btnPrimary : btnGhost}`}
                    onClick={() => setOp("add")}
                  >
                    Add
                  </button>
                  <button
                    className={`${btn} ${op === "sub" ? btnPrimary : btnGhost}`}
                    onClick={() => setOp("sub")}
                  >
                    Subtract
                  </button>
                </div>
              </div>

              <div>
                <label className={labelCls}>Days</label>
                <NumberBox label="" value={days} min={-100000} max={100000} onChange={(v) => setDays(v)} />
                <p className="text-xs text-slate-400 mt-1">Use negative numbers to invert (works with Add/Subtract).</p>
              </div>

              <div>
                <label className={labelCls}>Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={`${btn} ${!business ? btnPrimary : btnGhost}`}
                    onClick={() => setBusiness(false)}
                    title="Calendar days"
                  >
                    Calendar
                  </button>
                  <button
                    className={`${btn} ${business ? btnPrimary : btnGhost}`}
                    onClick={() => setBusiness(true)}
                    title="Business days (skip weekends & holidays)"
                  >
                    Business
                  </button>
                </div>
              </div>

              <div>
                <label className={labelCls}>Holiday Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value as Region)}
                  className={inputCls}
                >
                  <option value="none">None</option>
                  <option value="us">United States (sample)</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Rolling Rule</label>
                <select value={roll} onChange={(e) => setRoll(e.target.value as RollRule)} className={inputCls}>
                  <option value="none">None</option>
                  <option value="forward">Roll forward to next business day</option>
                  <option value="backward">Roll backward to previous business day</option>
                </select>
              </div>
            </div>

            {/* Custom holidays */}
            <div className="mt-4">
              <label className={labelCls}>Custom Holidays (yyyy-mm-dd, comma or newline)</label>
              <textarea
                value={customStr}
                onChange={(e) => setCustomStr(e.target.value)}
                rows={3}
                className={inputCls}
                placeholder="2025-01-01, 2025-07-04"
              />
              <p className={smallMono}>{customList.length ? `${customList.length} custom date(s) loaded` : "—"}</p>
            </div>

            {/* Notes */}
            <div className="mt-4">
              <label className="inline-flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={notesEnabled}
                  onChange={(e) => setNotesEnabled(e.target.checked)}
                />
                Add note & description (optional)
              </label>
            </div>

            {notesEnabled && (
              <div className="mt-3 grid grid-cols-1 gap-3">
                <div>
                  <label className={labelCls}>Title</label>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className={inputCls}
                    placeholder="e.g., Contract signed +30 business days"
                  />
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea
                    rows={4}
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    className={inputCls}
                    placeholder="Optional details…"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button className={`${btn} ${btnPrimary}`} onClick={saveHistory}>
                <HistoryIcon size={16} /> Save to History
              </button>
              <button
                className={`${btn} ${btnNeutral}`}
                onClick={() => {
                  setStartISO(new Date().toISOString().slice(0, 10));
                  setOp("add");
                  setDays(30);
                  setBusiness(false);
                  setRegion("none");
                  setRoll("none");
                  setCustomStr("");
                  setOffsetsStr("+7, 30, -14");
                  setNotesEnabled(false);
                  setNoteTitle("");
                  setNoteBody("");
                  setError("");
                  showToast("Reset");
                }}
              >
                <RotateCcw size={16} /> Reset
              </button>
              <button className={`${btn} ${btnGhost}`} onClick={exportCSV}>
                <FileDown size={16} /> Export CSV
              </button>
            </div>
          </section>

          {/* Right: Result */}
          <section className={card} aria-label="Result">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Result</h2>

            {!result ? (
              <p className="text-slate-200">Awaiting valid inputs…</p>
            ) : (
              <>
                <div className="rounded-2xl border-4 border-slate-700 bg-white/5 p-5">
                  <div className="text-slate-200">Result date</div>
                  <div className="mt-1 text-2xl md:text-3xl text-white font-extrabold">{fmtHuman(result.date)}</div>
                  <div className="mt-2 text-slate-300 font-mono">{result.iso}</div>
                  <div className="mt-2 text-sm text-slate-300">
                    Weeks (approx): <span className="font-semibold">{result.weeks}</span>
                    {business ? (
                      <span className="ml-2">• Mode: Business (skip weekends{region !== "none" || customList.length ? " & holidays" : ""})</span>
                    ) : (
                      <span className="ml-2">• Mode: Calendar</span>
                    )}
                    {roll !== "none" && <span className="ml-2">• Rolled {roll}</span>}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className={`${btn} ${btnNeutral}`} onClick={() => copyText(result.iso)}>
                      <Copy size={16} /> Copy ISO
                    </button>
                    <button
                      className={`${btn} ${btnGhost}`}
                      onClick={() =>
                        copyText(
                          `${fmtHuman(new Date(startISO))} ${op === "add" ? "+" : "-"} ${Math.abs(
                            days
                          )}${business ? " business" : ""} day(s) ${roll !== "none" ? `(roll ${roll}) ` : ""}→ ${result.iso} (${result.weekday})`
                        )
                      }
                    >
                      <Copy size={16} /> Copy Summary
                    </button>
                  </div>
                </div>

                {/* Multiple Offsets */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Quick Schedule (multiple offsets)</h3>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <input
                        className={inputCls}
                        value={offsetsStr}
                        onChange={(e) => setOffsetsStr(e.target.value)}
                        placeholder="+7, 30, -14"
                      />
                      <p className="text-xs text-slate-400 mt-1">Comma or newline separated integers (negative allowed). Example: +7, 14, 30, 60</p>
                    </div>
                    <div className="flex items-end">
                      <button className={`${btn} ${btnNeutral}`} onClick={() => copyText(schedule.map((s) => `${s.offset}\t${s.iso}\t${s.weekday}`).join("\n"))}>
                        <Copy size={16} /> Copy Table
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 overflow-x-auto rounded-xl border border-slate-700">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-800/60 text-slate-200">
                        <tr>
                          <th className="text-left px-3 py-2">Offset (days)</th>
                          <th className="text-left px-3 py-2">ISO</th>
                          <th className="text-left px-3 py-2">Weekday</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700 text-slate-100">
                        {schedule.length === 0 ? (
                          <tr>
                            <td className="px-3 py-2" colSpan={3}>
                              No offsets parsed.
                            </td>
                          </tr>
                        ) : (
                          schedule.map((s, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2">{s.offset}</td>
                              <td className="px-3 py-2">{s.iso}</td>
                              <td className="px-3 py-2">{s.weekday}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3">
                    <button className={`${btn} ${btnGhost}`} onClick={exportCSV}>
                      <FileDown size={16} /> Export CSV (with schedule)
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>

        {/* History */}
        <section className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6" aria-label="Saved history">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 inline-flex items-center gap-2">
              <HistoryIcon className="w-5 h-5" /> History
            </h2>
            <div className="flex items-center gap-2">
              <InlineAlert variant="success" icon={<CheckCircle2 className="w-4 h-4" />} className="hidden md:flex">
                Saved items include notes (if added).
              </InlineAlert>
              <button onClick={clearHistory} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm">
                Clear
              </button>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="text-gray-800">No history yet. Click “Save to History”.</div>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <HistoryRow
                  key={h.id}
                  item={h}
                  onEdit={() => {
                    setStartISO(h.startISO);
                    setOp(h.op);
                    setDays(h.days);
                    setBusiness(h.business);
                    setRegion(h.region);
                    setRoll(h.roll);
                    setCustomStr(h.customHolidays.join(","));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  onDelete={() => {
                    const next = history.filter((x) => x.id !== h.id);
                    setHistory(next);
                    localStorage.setItem(LS_KEY, JSON.stringify(next));
                  }}
                  onInfo={(item) => {
                    setModalTitle(item.noteTitle || "Details");
                    setModalBody(item.noteBody || "");
                    setModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* SEO content */}
        <div className="rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Add/Subtract Days — Calendar vs. Business Days</h2>
          <div className="space-y-4 text-slate-300">
            <p>
              Use this <strong>Add/Subtract Days Calculator</strong> to jump forward or backward from any date. Choose calendar days or switch to{" "}
              <strong>business days</strong> to skip weekends and (optionally) holidays. If you land on a non-working date, apply a{" "}
              <strong>rolling rule</strong> to move forward or backward automatically.
            </p>
            <p>
              Planning projects? Enter multiple offsets like <code className="font-mono">+7, 14, 30</code> to generate a quick milestone schedule and export it to CSV. For time arithmetic (hours/minutes), try{" "}
              <a className="text-blue-300 underline hover:text-blue-200" href="/time-add-subtract">Time Add/Subtract</a>, or get total duration between two dates with the{" "}
              <a className="text-blue-300 underline hover:text-blue-200" href="/date-difference">Date Difference Calculator</a>.
            </p>

            {/* FAQ visible content (7) */}
            <section className="space-y-4 mt-6">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
              </h2>

              {[
                {
                  q: "How do I add 30 days to a date?",
                  a: "Pick a start date, choose Add, enter 30, and view the result. Switch to Business days to skip weekends and holidays."
                },
                {
                  q: "What’s the difference between calendar days and business days?",
                  a: "Calendar days count every day. Business days skip weekends (and optionally holidays), useful for work schedules."
                },
                {
                  q: "How do holiday exclusions work?",
                  a: "Select a region or add custom yyyy-mm-dd dates. Those dates are skipped when Business mode is on."
                },
                {
                  q: "What is a rolling rule?",
                  a: "If the result lands on a weekend/holiday, roll forward or backward to the nearest business day automatically."
                },
                {
                  q: "Can I subtract days (e.g., 90 days before)?",
                  a: "Yes—choose Subtract or enter a negative number."
                },
                {
                  q: "Do time zones or DST affect the result?",
                  a: "The tool works in your browser’s local time. Day additions use date arithmetic, so DST has minimal impact for whole-day offsets."
                },
                {
                  q: "Can I export or share the result?",
                  a: "Yes—copy ISO or summary, export CSV, and share the URL (inputs are encoded in the query string)."
                }
              ].map((f, i) => (
                <div key={i} className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl">
                    <span className="text-yellow-300">Q{i + 1}:</span> {f.q}
                  </h3>
                  <p>{f.a}</p>
                </div>
              ))}
            </section>

            {/* FAQ Schema */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "How do I add 30 days to a date?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Pick a start date, choose Add, enter 30, and view the result. Switch to Business days to skip weekends and holidays." }
                    },
                    {
                      "@type": "Question",
                      "name": "What’s the difference between calendar days and business days?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Calendar days count every day. Business days skip weekends (and optionally holidays), useful for work schedules." }
                    },
                    {
                      "@type": "Question",
                      "name": "How do holiday exclusions work?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Select a region or add custom yyyy-mm-dd dates. Those dates are skipped when Business mode is on." }
                    },
                    {
                      "@type": "Question",
                      "name": "What is a rolling rule?",
                      "acceptedAnswer": { "@type": "Answer", "text": "If the result lands on a weekend/holiday, roll forward or backward to the nearest business day automatically." }
                    },
                    {
                      "@type": "Question",
                      "name": "Can I subtract days (e.g., 90 days before)?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Yes—choose Subtract or enter a negative number." }
                    },
                    {
                      "@type": "Question",
                      "name": "Do time zones or DST affect the result?",
                      "acceptedAnswer": { "@type": "Answer", "text": "The tool works in your browser’s local time. Day additions use date arithmetic, so DST has minimal impact for whole-day offsets." }
                    },
                    {
                      "@type": "Question",
                      "name": "Can I export or share the result?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Copy ISO or summary, export CSV, and share the URL (inputs are encoded in the query string)." }
                    }
                  ]
                })
              }}
            />
          </div>
        </div>

        <AdBanner type="bottom" />

        {/* Author */}
        <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
          <div className="flex items-center gap-3">
            <img
              src="/images/calculatorhub-author.webp"
              width="96"
              height="96"
              alt="CalculatorHub Security Tools Team"
              className="w-12 h-12 rounded-full border border-gray-600"
              loading="lazy"
            />
            <div>
              <p className="font-semibold text-white">Written by the CalculatorHub Security Tools Team</p>
              <p className="text-sm text-slate-400">
                Experts in web utilities and calculators. Last updated: <time dateTime="2025-10-10">October 10, 2025</time>.
              </p>
            </div>
          </div>
        </section>

        <RelatedCalculators currentPath="/add-subtract-days" category="date-time-tools" />
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" role="dialog" aria-modal="true">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-xl sm:shadow-lg sm:border sm:border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{modalTitle || "Details"}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-600 hover:text-gray-900 px-2 py-1 rounded-md focus:outline-none focus:ring" aria-label="Close">✕</button>
            </div>
            <div className="p-4 sm:p-5">
              {modalBody ? (
                <p className="text-sm sm:text-base text-gray-800 whitespace-pre-wrap">{modalBody}</p>
              ) : (
                <p className="text-sm text-gray-600">No description provided.</p>
              )}
            </div>
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm sm:text-base">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div
        className={`fixed bottom-5 right-5 z-50 transition-all ${
          toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <div className="rounded-xl bg-slate-800/90 border border-slate-700 text-white px-4 py-2 shadow-lg">
          {toast}
        </div>
      </div>
    </>
  );
};

export default AddSubtractDays;
