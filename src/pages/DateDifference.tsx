
/**
 * DateDifferencePro – Full Feature Page (Extended 750+ lines) – V2
 * Changes in this version:
 * - Anchor logic for “From = Now” and “To = Now” (mutually exclusive).
 * - When an anchor is active, +/− day buttons cumulatively adjust the OTHER field:
 *    • Anchor = 'from'  → bump days modifies TO = FROM + daysDelta
 *    • Anchor = 'to'    → bump days modifies FROM = TO − daysDelta
 * - Disable the opposite “Now” button when one is active.
 * - Added −1, −7, −30 day buttons and cumulative behavior.
 * - Preserves previously requested behaviors (placeholders, dynamic summary, etc.).
 */

import React, {
  useEffect,
  useMemo,
  useState,
  memo,
  ReactNode,
} from "react";
import {
  Clock,
  Mic,
  History as HistoryIcon,
  FileDown,
  RotateCcw,
  Edit3,
  Trash2,
  ArrowLeftRight,
  CalendarClock,
  Info,
  CheckCircle2,
  AlertTriangle,
  Minus,
  Plus,
} from "lucide-react";
import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import RelatedCalculators from "../components/RelatedCalculators";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

export type DiffResult = {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  totalWeeks: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
  negative: boolean;
};

export type HistoryItem = {
  id: string;
  fromISO: string;
  toISO: string;
  createdAtISO: string;
  summary: string;
};

const LS_KEY = "dateDiffHistory_v2";
const SENTINEL_ZERO = "0";
const pad2 = (n: number) => String(Math.abs(n)).padStart(2, "0");
const isValidDate = (d: Date) => !Number.isNaN(d.getTime());
const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  if (!isValidDate(d)) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
const clampHistory = (items: HistoryItem[], max = 20) => items.slice(0, max);
function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function saveHistory(items: HistoryItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(clampHistory(items)));
}

function calcDateTimeDiff(fromISO: string, toISO: string): DiffResult {
  const from = new Date(fromISO);
  const to = new Date(toISO);
  if (!isValidDate(from) || !isValidDate(to)) {
    return {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalDays: 0,
      totalWeeks: 0,
      totalHours: 0,
      totalMinutes: 0,
      totalSeconds: 0,
      negative: false,
    };
  }
  const isNegative = from > to;
  const start = isNegative ? to : from;
  const end = isNegative ? from : to;

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const alignedStart = new Date(start);
  alignedStart.setFullYear(start.getFullYear() + years);
  alignedStart.setMonth(start.getMonth() + months);
  alignedStart.setDate(start.getDate() + days);

  let diffMs = Math.abs(end.getTime() - alignedStart.getTime());
  let hours = Math.floor(diffMs / (1000 * 60 * 60));
  diffMs -= hours * (1000 * 60 * 60);
  let minutes = Math.floor(diffMs / (1000 * 60));
  diffMs -= minutes * (1000 * 60);
  let seconds = Math.floor(diffMs / 1000);

  const totalMs = Math.abs(end.getTime() - start.getTime());
  const totalSeconds = Math.floor(totalMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);
  const totalWeeks = Math.floor(totalDays / 7);

  return {
    years: isNegative ? -years : years,
    months: isNegative ? -months : months,
    days: isNegative ? -days : days,
    hours: isNegative ? -hours : hours,
    minutes: isNegative ? -minutes : minutes,
    seconds: isNegative ? -seconds : seconds,
    totalDays: isNegative ? -totalDays : totalDays,
    totalWeeks: isNegative ? -totalWeeks : totalWeeks,
    totalHours: isNegative ? -totalHours : totalHours,
    totalMinutes: isNegative ? -totalMinutes : totalMinutes,
    totalSeconds: isNegative ? -totalSeconds : totalSeconds,
    negative: isNegative,
  };
}

const toLocalDateTimeValue = (d: Date) => {
  const year = d.getFullYear();
  const month = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hour = pad2(d.getHours());
  const min = pad2(d.getMinutes());
  return `${year}-${month}-${day}T${hour}:${min}`;
};

const buildDynamicSummary = (d: DiffResult) => {
  const abs = (v: number) => Math.abs(v);
  const parts: string[] = [];
  if (abs(d.years)) parts.push(`${abs(d.years)}y`);
  if (abs(d.months)) parts.push(`${abs(d.months)}m`);
  if (abs(d.days)) parts.push(`${abs(d.days)}d`);
  if (abs(d.hours)) parts.push(`${abs(d.hours)}h`);
  if (abs(d.minutes)) parts.push(`${abs(d.minutes)}m`);
  if (abs(d.seconds)) parts.push(`${abs(d.seconds)}s`);
  return parts.length ? parts.join(", ") : "0s";
};

type InlineAlertProps = {
  variant?: "info" | "success" | "warning" | "danger";
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};
const InlineAlert = memo(function InlineAlert({
  variant = "info",
  icon,
  children,
  className = "",
}: InlineAlertProps) {
  const styles: Record<NonNullable<InlineAlertProps["variant"]>, string> = {
    info: "bg-blue-50 text-blue-800 border-blue-200",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
    danger: "bg-red-50 text-red-800 border-red-200",
  };
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm inline-flex items-center gap-2 ${styles[variant]} ${className}`} role="status" aria-live="polite">
      {icon}
      <span>{children}</span>
    </div>
  );
});

type HistoryItem = {
  id: string;
  fromISO: string;
  toISO: string;
  createdAtISO: string;
  summary: string;
};

type HistoryItemRowProps = {
  item: HistoryItem;
  countdownLabel: string;
  completed: boolean;
  onEdit: () => void;
  onDelete: () => void;
};
const HistoryItemRow = memo(function HistoryItemRow({ item, countdownLabel, completed, onEdit, onDelete }: HistoryItemRowProps) {
  return (
    <div className={`py-3 px-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-lg border ${completed ? "bg-green-100 border-green-200" : "bg-gray-50 border-gray-200"}`}>
      <div>
        <div className="font-medium text-gray-900">{fmtDateTime(item.fromISO)} → {fmtDateTime(item.toISO)}</div>
        <div className="text-sm text-gray-800">{item.summary}</div>
        <div className="text-xs text-gray-500">Saved {fmtDateTime(item.createdAtISO)}</div>
        <div className="text-sm font-semibold text-indigo-700 mt-1">{countdownLabel}</div>
      </div>
      <div className="flex gap-2">
        <button onClick={onEdit} className="px-3 py-1.5 rounded-lg bg-blue-800 text-white hover:bg-blue-700 text-sm inline-flex items-center gap-1" title="Edit">
          <Edit3 className="w-4 h-4" /> Edit
        </button>
        <button onClick={onDelete} className="px-3 py-1.5 rounded-lg bg-red-700 text-white hover:bg-red-600 text-sm inline-flex items-center gap-1" title="Delete">
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>
    </div>
  );
});

const DateDifferencePro: React.FC = () => {
  const [fromDateTime, setFromDateTime] = useState<string>(SENTINEL_ZERO);
  const [toDateTime, setToDateTime] = useState<string>(SENTINEL_ZERO);
  const [diff, setDiff] = useState<DiffResult>(() => calcDateTimeDiff(fromDateTime, toDateTime));
  const [nowISO, setNowISO] = useState<string>(() => new Date().toISOString());
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory());
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [noticeMsg, setNoticeMsg] = useState<string>("");

  const [anchor, setAnchor] = useState<"from" | "to" | null>(null);
  const [daysDelta, setDaysDelta] = useState<number>(0);

  useEffect(() => {
    setDiff(calcDateTimeDiff(fromDateTime, toDateTime));
  }, [fromDateTime, toDateTime]);

  useEffect(() => {
    const id = setInterval(() => setNowISO(new Date().toISOString()), 1000);
    return () => clearInterval(id);
  }, []);

  const abs = (n: number) => Math.abs(n);
  const countdownActive = useMemo(() => isValidDate(new Date(toDateTime)), [toDateTime]);

  const countdownText = useMemo(() => {
    const now = new Date(nowISO);
    const target = new Date(toDateTime);
    const cdMs = isValidDate(target) ? Math.max(0, target.getTime() - now.getTime()) : 0;
    const cdSec = Math.floor(cdMs / 1000);
    const cdDays = Math.floor(cdSec / 86400);
    const cdHours = Math.floor((cdSec % 86400) / 3600);
    const cdMin = Math.floor((cdSec % 3600) / 60);
    const cdSecs = cdSec % 60;
    const parts: string[] = [];
    if (cdDays) parts.push(`${cdDays}d`);
    if (cdHours) parts.push(`${pad2(cdHours)}h`);
    if (cdMin) parts.push(`${pad2(cdMin)}m`);
    if (cdSecs) parts.push(`${pad2(cdSecs)}s`);
    return parts.length ? parts.join(" ") : "0s";
  }, [nowISO, toDateTime]);

  const fromDow = useMemo(() => {
    const d = new Date(fromDateTime);
    return isValidDate(d) ? d.toLocaleDateString(undefined, { weekday: "long" }) : "";
  }, [fromDateTime]);
  const toDow = useMemo(() => {
    const d = new Date(toDateTime);
    return isValidDate(d) ? d.toLocaleDateString(undefined, { weekday: "long" }) : "";
  }, [toDateTime]);

  const historyCountdowns = useMemo(() => {
    const nowTs = new Date(nowISO).getTime();
    return history.map((h) => {
      const t = new Date(h.toISO).getTime();
      const remain = Math.max(0, t - nowTs);
      const sec = Math.floor(remain / 1000);
      const d = Math.floor(sec / 86400);
      const hH = Math.floor((sec % 86400) / 3600);
      const mM = Math.floor((sec % 3600) / 60);
      const sS = sec % 60;
      const parts: string[] = [];
      if (d) parts.push(`${d}d`);
      if (hH) parts.push(`${pad2(hH)}h`);
      if (mM) parts.push(`${pad2(mM)}m`);
      if (sS) parts.push(`${pad2(sS)}s`);
      const label = remain <= 0 ? "Completed" : `${parts.join(" ")} remaining`;
      return { id: h.id, complete: remain <= 0, label };
    });
  }, [history, nowISO]);

  const findHistoryCountdown = (id: string) => historyCountdowns.find((x) => x.id === id);

  const activateFromNow = () => {
    const now = new Date();
    const v = toLocalDateTimeValue(now);
    setFromDateTime(v);
    setToDateTime(v);
    setAnchor("from");
    setDaysDelta(0);
    setNoticeMsg("From = Now is active. Use +/− day buttons to change To relative to From.");
  };
  const activateToNow = () => {
    const now = new Date();
    const v = toLocalDateTimeValue(now);
    setToDateTime(v);
    setFromDateTime(v);
    setAnchor("to");
    setDaysDelta(0);
    setNoticeMsg("To = Now is active. Use +/− day buttons to change From relative to To.");
  };

  const bumpDays = (n: number) => {
    if (!anchor) {
      setNoticeMsg("Activate “From = Now” or “To = Now” first.");
      return;
    }
    const newDelta = daysDelta + n;
    setDaysDelta(newDelta);

    if (anchor === "from") {
      const base = new Date(fromDateTime);
      if (!isValidDate(base)) return;
      const t = new Date(base);
      t.setDate(t.getDate() + newDelta);
      setToDateTime(toLocalDateTimeValue(t));
    } else {
      const base = new Date(toDateTime);
      if (!isValidDate(base)) return;
      const f = new Date(base);
      f.setDate(f.getDate() - newDelta);
      setFromDateTime(toLocalDateTimeValue(f));
    }
  };

  const resetDates = () => {
    setFromDateTime(SENTINEL_ZERO);
    setToDateTime(SENTINEL_ZERO);
    setErrorMsg("");
    setNoticeMsg("");
    setAnchor(null);
    setDaysDelta(0);
  };

  const addToHistory = () => {
    if (fromDateTime === SENTINEL_ZERO && toDateTime === SENTINEL_ZERO) {
      setErrorMsg("Values are zero — cannot save history.");
      return;
    }
    const f = new Date(fromDateTime);
    const t = new Date(toDateTime);
    if (!isValidDate(f) || !isValidDate(t)) {
      setErrorMsg("Please select valid From and To dates.");
      return;
    }
    setErrorMsg("");
    const item: HistoryItem = {
      id: `${Date.now()}`,
      fromISO: f.toISOString(),
      toISO: t.toISOString(),
      createdAtISO: new Date().toISOString(),
      summary: buildDynamicSummary(calcDateTimeDiff(fromDateTime, toDateTime)),
    };
    const next = clampHistory([item, ...history]);
    setHistory(next);
    saveHistory(next);
    setNoticeMsg("Saved to history.");
  };

  const deleteHistoryItem = (id: string) => {
    const next = history.filter((h) => h.id !== id);
    setHistory(next);
    saveHistory(next);
  };

  const handleExportPDF = async () => {
    try {
      const mod = await import("jspdf");
      const { jsPDF } = mod as any;
      const doc = new jsPDF();
      const line = (y: number, text: string) => doc.text(text, 14, y);

      let y = 14;
      doc.setFontSize(16);
      line(y, "Date Difference Report");
      y += 8;

      doc.setFontSize(11);
      line(y, `Generated: ${fmtDateTime(new Date().toISOString())}`);
      y += 8;

      const fValid = isValidDate(new Date(fromDateTime));
      const tValid = isValidDate(new Date(toDateTime));
      line(y, `From: ${fValid ? fmtDateTime(new Date(fromDateTime).toISOString()) : "—"}`);
      y += 6;
      line(y, `To:   ${tValid ? fmtDateTime(new Date(toDateTime).toISOString()) : "—"}`);
      y += 8;

      const dsum = buildDynamicSummary(calcDateTimeDiff(fromDateTime, toDateTime));
      line(y, `Summary: ${dsum}`);
      y += 6;

      const totals = calcDateTimeDiff(fromDateTime, toDateTime);
      line(
        y,
        `Totals: ${Math.abs(totals.totalDays).toLocaleString()} days | ${Math.abs(totals.totalWeeks).toLocaleString()} weeks | ${Math.abs(totals.totalHours).toLocaleString()} hours | ${Math.abs(totals.totalMinutes).toLocaleString()} minutes | ${Math.abs(totals.totalSeconds).toLocaleString()} seconds`
      );
      y += 10;

      doc.setFontSize(13);
      line(y, "History");
      y += 6;
      doc.setFontSize(10);

      if (!history.length) {
        line(y, "No saved history.");
      } else {
        history.forEach((h, idx) => {
          const row = `${idx + 1}. ${fmtDateTime(h.fromISO)}  →  ${fmtDateTime(h.toISO)}   |   ${h.summary}   |   saved ${fmtDateTime(h.createdAtISO)}`;
          if (y > 280) {
            doc.addPage();
            y = 14;
          }
          line(y, row);
          y += 6;
        });
      }

      doc.save("date-difference.pdf");
    } catch (e) {
      alert("PDF export failed. Make sure 'jspdf' is installed.");
    }
  };

  return (
    <>
      <SEOHead
        title={seoData?.dateDifference?.title ?? "Date Difference Calculator"}
        description={seoData?.dateDifference?.description ?? "Calculate the exact difference between two dates and times — with history, voice input, and PDF export."}
        canonical="https://calculatorhub.com/date-difference"
        schemaData={generateCalculatorSchema(
          "Date Difference Calculator",
          seoData?.dateDifference?.description ?? "Calculate the exact difference between two dates and times — with history, voice input, and PDF export.",
          "/date-difference",
          seoData?.dateDifference?.keywords ?? []
        )}
        breadcrumbs={[
          { name: "Date & Time Tools", url: "/category/date-time-tools" },
          { name: "Date Difference Calculator", url: "/date-difference" },
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <Breadcrumbs
          items={[
            { name: "Date & Time Tools", url: "/category/date-time-tools" },
            { name: "Date Difference Calculator", url: "/date-difference" },
          ]}
        />

        <header className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg flex items-center gap-3">
            <CalendarClock className="w-8 h-8 text-white/90" />
            Date Difference Calculator
          </h1>
          <p className="text-slate-300">
            Calculate the exact difference between two dates and times — with history, voice input, and PDF export.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Date &amp; Time</h2>

            {noticeMsg && (
              <div className="mb-3">
                <InlineAlert variant="info" icon={<Info className="w-4 h-4" />}>{noticeMsg}</InlineAlert>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="from-datetime" className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <div className="flex gap-1">
                <input
                  id="from-datetime"
                  type="datetime-local"
                  value={fromDateTime === SENTINEL_ZERO ? "" : fromDateTime}
                  onChange={(e) => setFromDateTime(e.target.value || SENTINEL_ZERO)}
                  className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-invalid={fromDateTime === SENTINEL_ZERO}
                />
                <button
                  type="button"
                  onClick={activateFromNow}
                  disabled={anchor === "to"}
                  className={`px-3 py-2 rounded-lg inline-flex items-center justify-center gap-2 border ${anchor === "from" ? "bg-blue-50 border-blue-200 text-blue-800" : "bg-gray-50 border-gray-200 hover:bg-gray-100"} ${anchor === "to" ? "opacity-50 cursor-not-allowed" : ""}`}
                  title="Set From = Now"
                >
                  From = Now
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="to-datetime" className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <div className="flex gap-1">
                <input
                  id="to-datetime"
                  type="datetime-local"
                  value={toDateTime === SENTINEL_ZERO ? "" : toDateTime}
                  onChange={(e) => setToDateTime(e.target.value || SENTINEL_ZERO)}
                  className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-invalid={toDateTime === SENTINEL_ZERO}
                />
                <button
                  type="button"
                  onClick={activateToNow}
                  disabled={anchor === "from"}
                  className={`px-3 py-2 rounded-lg inline-flex items-center justify-center gap-2 border ${anchor === "to" ? "bg-blue-50 border-blue-200 text-blue-800" : "bg-gray-50 border-gray-200 hover:bg-gray-100"} ${anchor === "from" ? "opacity-50 cursor-not-allowed" : ""}`}
                  title="Set To = Now"
                >
                  To = Now
                </button>
              </div>
            </div>

            <div className="mb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Adjust days (cumulative)</span>
                </div>
                <span className="text-xs text-gray-500">Current offset: {daysDelta} day(s)</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                <button type="button" onClick={() => bumpDays(-1)} className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 inline-flex items-center justify-center gap-2" title="−1 day">
                  <Minus className="w-4 h-4" /> −1
                </button>
                <button type="button" onClick={() => bumpDays(-7)} className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 inline-flex items-center justify-center gap-2" title="−7 days">
                  <Minus className="w-4 h-4" /> −7
                </button>
                <button type="button" onClick={() => bumpDays(-30)} className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 inline-flex items-center justify-center gap-2" title="−30 days">
                  <Minus className="w-4 h-4" /> −30
                </button>

                <button type="button" onClick={() => bumpDays(1)} className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 inline-flex items-center justify-center gap-2" title="+1 day">
                  <Plus className="w-4 h-4" /> +1
                </button>
                <button type="button" onClick={() => bumpDays(7)} className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 inline-flex items-center justify-center gap-2" title="+7 days">
                  <Plus className="w-4 h-4" /> +7
                </button>
                <button type="button" onClick={() => bumpDays(30)} className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 inline-flex items-center justify-center gap-2" title="+30 days">
                  <Plus className="w-4 h-4" /> +30
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Tip: Activate <strong>From = Now</strong> to push the <em>To</em> date forward/backward. Activate <strong>To = Now</strong> to push the <em>From</em> date backward/forward.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <button onClick={addToHistory} className="flex-1 px-4 py-2 bg-emerald-800 text-white rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center justify-center gap-2">
                <HistoryIcon className="w-4 h-4" /> Save to History
              </button>
              <button onClick={resetDates} className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
              <button onClick={handleExportPDF} className="flex-1 px-4 py-2 bg-indigo-800 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center justify-center gap-2">
                <FileDown className="w-5 h-5" /> Export PDF
              </button>
            </div>

            {errorMsg && (
              <div className="mt-1" aria-live="assertive">
                <InlineAlert variant="danger" icon={<AlertTriangle className="w-4 h-4" />}>{errorMsg}</InlineAlert>
              </div>
            )}
          </section>

          <section className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Time Difference</h2>

            <div className="space-y-6">
              <div className="grid md:grid-cols-1 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Clock className="h-8 w-8 text-blue-800 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{buildDynamicSummary(diff)}</div>
                  <div className="text-sm text-gray-800">
                    {diff.negative ? "From date is after To date" : "Calendar difference"}
                  </div>
                </div>

                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-xl font-semibold text-gray-900">
                    {fromDateTime === SENTINEL_ZERO ? "---" : fmtDateTime(fromDateTime)}
                  </div>
                  <div className="text-sm text-gray-800">From • {fromDateTime === SENTINEL_ZERO ? "---" : fromDow || "—"}</div>
                  <div className="mt-2 text-xl font-semibold text-gray-900">
                    {toDateTime === SENTINEL_ZERO ? "---" : fmtDateTime(toDateTime)}
                  </div>
                  <div className="text-sm text-gray-800">To • {toDateTime === SENTINEL_ZERO ? "---" : toDow || "—"}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg text-center border border-green-200">
                  <div className="text-xl font-semibold text-gray-900">{abs(diff.totalDays).toLocaleString()}</div>
                  <div className="text-sm text-gray-800">Total Days</div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg text-center border border-yellow-200">
                  <div className="text-xl font-semibold text-gray-900">{abs(diff.totalWeeks).toLocaleString()}</div>
                  <div className="text-sm text-gray-800">Total Weeks</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center border border-purple-200">
                  <div className="text-xl font-semibold text-gray-900">{abs(diff.totalHours).toLocaleString()}</div>
                  <div className="text-sm text-gray-800">Total Hours</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg text-center border border-red-200">
                  <div className="text-xl font-semibold text-gray-900">{abs(diff.totalMinutes).toLocaleString()}</div>
                  <div className="text-sm text-gray-800">Total Minutes</div>
                </div>
              </div>

              {countdownActive && (
                <div className="p-5 rounded-xl bg-indigo-50 border border-indigo-200">
                  <div className="text-sm text-indigo-700">Live Countdown to the “To” date</div>
                  <div className="mt-2 text-3xl font-bold text-indigo-900 tracking-wide">{countdownText}</div>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 inline-flex items-center gap-2">
              <HistoryIcon className="w-5 h-5" /> History
            </h2>
            <div className="flex items-center gap-2">
              <InlineAlert variant="success" icon={<CheckCircle2 className="w-4 h-4" />} className="hidden md:flex">
                Saved items keep a live countdown.
              </InlineAlert>
              <button
                onClick={() => {
                  setHistory([]);
                  saveHistory([]);
                }}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm"
              >
                Clear
              </button>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="text-gray-800">No history yet. Click “Save to History” after a calculation.</div>
          ) : (
            <div className="space-y-2">
              {history.map((h) => {
                const hc = findHistoryCountdown(h.id);
                const done = hc?.complete ?? false;
                return (
                  <HistoryItemRow
                    key={h.id}
                    item={h}
                    countdownLabel={hc?.label ?? "0s"}
                    completed={done}
                    onEdit={() => {
                      const from = new Date(h.fromISO);
                      const to = new Date(h.toISO);
                      setFromDateTime(toLocalDateTimeValue(from));
                      setToDateTime(toLocalDateTimeValue(to));
                      if (typeof window !== "undefined") {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    onDelete={() => deleteHistoryItem(h.id)}
                  />
                );
              })}
            </div>
          )}
        </section>

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/date-difference" category="date-time-tools" />
      </div>
    </>
  );
};

export default DateDifferencePro;
 