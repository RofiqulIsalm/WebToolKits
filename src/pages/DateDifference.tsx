
/**
 * DateDifferencePro – Final (notes + modal + order constraint + no quick actions)
 * - FROM must be ≤ TO (auto-corrects on input changes)
 * - Countdown shows only if TO is valid and in the future (> 0 remaining)
 * - Optional notes via checkbox; "Save with note" button resets notes after save
 * - History rows show an Info button if notes exist; opens mobile-friendly modal
 */

import React, { useEffect, useMemo, useState, memo, PropsWithChildren, ReactNode } from "react";
import {
  Clock,
  History as HistoryIcon,
  FileDown,
  RotateCcw,
  Edit3,
  Trash2,
  CalendarClock,
  Info as InfoIcon,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import RelatedCalculators from "../components/RelatedCalculators";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

/* ==========================================================================
 * Types
 * ========================================================================== */

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
  noteTitle?: string;
  noteBody?: string;
};

/* ==========================================================================
 * Constants & Utilities
 * ========================================================================== */

const LS_KEY = "dateDiffHistory_v2";
const SENTINEL_ZERO = "0";

const pad2 = (n: number) => String(Math.abs(n)).padStart(2, "0");
const isValidDate = (d: Date) => !Number.isNaN(d.getTime());

const isValidInput = (iso: string): boolean => {
  if (!iso || iso === SENTINEL_ZERO) return false;
  const d = new Date(iso);
  return !Number.isNaN(d.getTime());
};

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

const toLocalDateTimeValue = (d: Date) => {
  const year = d.getFullYear();
  const month = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hour = pad2(d.getHours());
  const min = pad2(d.getMinutes());
  return `${year}-${month}-${day}T${hour}:${min}`;
};

/* ==========================================================================
 * Core diff
 * ========================================================================== */

function calcDateTimeDiff(fromISO: string, toISO: string): DiffResult {
  if (!isValidInput(fromISO) || !isValidInput(toISO)) {
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

  const from = new Date(fromISO);
  const to = new Date(toISO);

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

/* ==========================================================================
 * Small Presentational Components
 * ========================================================================== */

type InlineAlertProps = {
  variant?: "info" | "success" | "warning" | "danger";
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  "data-testid"?: string;
};
const InlineAlert = memo(function InlineAlert({
  variant = "info",
  icon,
  children,
  className = "",
  ...rest
}: InlineAlertProps) {
  const styles: Record<"info" | "success" | "warning" | "danger", string> = {
    info: "bg-blue-50 text-blue-800 border-blue-200",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
    danger: "bg-red-50 text-red-800 border-red-200",
  };
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-sm inline-flex items-center gap-2 ${styles[variant]} ${className}`}
      role="status"
      aria-live="polite"
      {...rest}
    >
      {icon}
      <span>{children}</span>
    </div>
  );
});

type StatCardProps = {
  label: string;
  value: ReactNode;
  className?: string;
  "data-testid"?: string;
};
const StatCard = memo(function StatCard({ label, value, className = "", ...rest }: StatCardProps) {
  return (
    <div className={`p-4 rounded-lg text-center border ${className}`} {...rest}>
      <div className="text-xl font-semibold text-gray-900">{value}</div>
      <div className="text-sm text-gray-800">{label}</div>
    </div>
  );
});

type HistoryRowProps = {
  item: HistoryItem;
  countdownLabel: string;
  completed: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onInfo?: (item: HistoryItem) => void;
};
const HistoryRow = memo(function HistoryRow({
  item,
  countdownLabel,
  completed,
  onEdit,
  onDelete,
  onInfo,
}: HistoryRowProps) {
  return (
    <div
      className={`py-3 px-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-lg border ${
        completed ? "bg-green-100 border-green-200" : "bg-gray-50 border-gray-200"
      }`}
      data-testid="history-row"
    >
      <div>
        <div className="font-medium text-gray-900">
          {fmtDateTime(item.fromISO)} → {fmtDateTime(item.toISO)}
        </div>
        <div className="text-sm text-gray-800">{item.summary}</div>
        <div className="text-xs text-gray-500">Saved {fmtDateTime(item.createdAtISO)}</div>
        {!completed && (
          <div className="text-sm font-semibold text-indigo-700 mt-1">{countdownLabel}</div>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        {onInfo && (item.noteTitle || item.noteBody) && (
          <button
            onClick={() => onInfo(item)}
            className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 text-sm inline-flex items-center gap-1"
            title="View details"
          >
            <InfoIcon className="w-4 h-4" />
            Info
          </button>
        )}
        <button
          onClick={onEdit}
          className="px-3 py-1.5 rounded-lg bg-blue-800 text-white hover:bg-blue-700 text-sm inline-flex items-center gap-1"
          title="Edit"
        >
          <Edit3 className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 rounded-lg bg-red-700 text-white hover:bg-red-600 text-sm inline-flex items-center gap-1"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
});

type LabeledFieldProps = PropsWithChildren<{
  label: string;
  htmlFor?: string;
}>;
const LabeledField = ({ label, htmlFor, children }: LabeledFieldProps) => (
  <div className="mb-4">
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    {children}
  </div>
);

const SectionDivider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 my-2" role="separator" aria-label={label}>
    <div className="h-px bg-gray-200 flex-1" />
    <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
    <div className="h-px bg-gray-200 flex-1" />
  </div>
);

/** Simple accessible modal */
const InlineModal = ({
  open,
  title,
  description,
  onClose,
}: {
  open: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
}) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full sm:max-w-lg sm:rounded-xl sm:shadow-lg sm:border sm:border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{title || "Details"}</h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 px-2 py-1 rounded-md focus:outline-none focus:ring"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-4 sm:p-5">
          {description ? (
            <p className="text-sm sm:text-base text-gray-800 whitespace-pre-wrap">{description}</p>
          ) : (
            <p className="text-sm text-gray-600">No description provided.</p>
          )}
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm sm:text-base"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
 * Main Component
 * ========================================================================== */

const DateDifferencePro: React.FC = () => {
  const [fromDateTime, setFromDateTime] = useState<string>(SENTINEL_ZERO);
  const [toDateTime, setToDateTime] = useState<string>(SENTINEL_ZERO);

  const [nowISO, setNowISO] = useState<string>(() => new Date().toISOString());

  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory());
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [noticeMsg, setNoticeMsg] = useState<string>("");

  // Optional notes UI state
  const [notesEnabled, setNotesEnabled] = useState<boolean>(false);
  const [noteTitle, setNoteTitle] = useState<string>("");
  const [noteBody, setNoteBody] = useState<string>("");

  // Modal for history item details
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>("");
  const [modalBody, setModalBody] = useState<string>("");

  useEffect(() => {
    const id = setInterval(() => setNowISO(new Date().toISOString()), 1000);
    return () => clearInterval(id);
  }, []);

  // Enforce ordering: FROM <= TO, immediately on changes
  const enforceOrderAfterSet = (which: "from" | "to", val: string) => {
    if (!isValidInput(val)) return;
    if (which === "from") {
      if (isValidInput(toDateTime)) {
        const f = new Date(val).getTime();
        const t = new Date(toDateTime).getTime();
        if (f > t) {
          setToDateTime(val);
          setNoticeMsg("Adjusted: To aligned to From to keep order.");
        }
      }
    } else {
      if (isValidInput(fromDateTime)) {
        const f = new Date(fromDateTime).getTime();
        const t = new Date(val).getTime();
        if (t < f) {
          setFromDateTime(val);
          setNoticeMsg("Adjusted: From aligned to To to keep order.");
        }
      }
    }
  };

  const abs = (n: number) => Math.abs(n);

  // Countdown shows only when TO valid and future
  const countdownActive = useMemo(() => {
    if (!isValidInput(toDateTime)) return false;
    const now = new Date(nowISO).getTime();
    const tgt = new Date(toDateTime).getTime();
    return tgt - now > 0;
  }, [toDateTime, nowISO]);

  const countdownText = useMemo(() => {
    const now = new Date(nowISO);
    const cdMs = isValidInput(toDateTime)
      ? Math.max(0, new Date(toDateTime).getTime() - now.getTime())
      : 0;
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
    return isValidInput(fromDateTime)
      ? new Date(fromDateTime).toLocaleDateString(undefined, { weekday: "long" })
      : "";
  }, [fromDateTime]);

  const toDow = useMemo(() => {
    return isValidInput(toDateTime)
      ? new Date(toDateTime).toLocaleDateString(undefined, { weekday: "long" })
      : "";
  }, [toDateTime]);

  // History countdowns
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

  const addToHistory = () => {
    if (fromDateTime === SENTINEL_ZERO && toDateTime === SENTINEL_ZERO) {
      setErrorMsg("Values are zero — cannot save history.");
      return;
    }
    if (!isValidInput(fromDateTime) || !isValidInput(toDateTime)) {
      setErrorMsg("Please select valid From and To dates.");
      return;
    }
    const fTs = new Date(fromDateTime).getTime();
    const tTs = new Date(toDateTime).getTime();
    if (fTs > tTs) {
      setErrorMsg("From must be earlier than or equal to To.");
      return;
    }
    setErrorMsg("");
    const f = new Date(fromDateTime);
    const t = new Date(toDateTime);
    const item: HistoryItem = {
      id: `${Date.now()}`,
      fromISO: f.toISOString(),
      toISO: t.toISOString(),
      createdAtISO: new Date().toISOString(),
      summary: buildDynamicSummary(calcDateTimeDiff(fromDateTime, toDateTime)),
      noteTitle: notesEnabled && noteTitle ? noteTitle : undefined,
      noteBody: notesEnabled && noteBody ? noteBody : undefined,
    };
    const next = clampHistory([item, ...history]);
    setHistory(next);
    saveHistory(next);
    setNoticeMsg("Saved to history.");
  };

  const addToHistoryWithNotes = () => {
    if (fromDateTime === SENTINEL_ZERO && toDateTime === SENTINEL_ZERO) {
      setErrorMsg("Values are zero — cannot save history.");
      return;
    }
    if (!isValidInput(fromDateTime) || !isValidInput(toDateTime)) {
      setErrorMsg("Please select valid From and To dates.");
      return;
    }
    const fTs = new Date(fromDateTime).getTime();
    const tTs = new Date(toDateTime).getTime();
    if (fTs > tTs) {
      setErrorMsg("From must be earlier than or equal to To.");
      return;
    }
    setErrorMsg("");
    const f = new Date(fromDateTime);
    const t = new Date(toDateTime);
    const item: HistoryItem = {
      id: `${Date.now()}`,
      fromISO: f.toISOString(),
      toISO: t.toISOString(),
      createdAtISO: new Date().toISOString(),
      summary: buildDynamicSummary(calcDateTimeDiff(fromDateTime, toDateTime)),
      noteTitle: notesEnabled && noteTitle ? noteTitle : undefined,
      noteBody: notesEnabled && noteBody ? noteBody : undefined,
    };
    const next = clampHistory([item, ...history]);
    setHistory(next);
    saveHistory(next);
    setNotesEnabled(false);
    setNoteTitle("");
    setNoteBody("");
    setNoticeMsg("Saved to history with note.");
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

      const fValid = isValidInput(fromDateTime);
      const tValid = isValidInput(toDateTime);
      line(y, `From: ${fValid ? fmtDateTime(new Date(fromDateTime).toISOString()) : "—"}`);
      y += 6;
      line(y, `To:   ${tValid ? fmtDateTime(new Date(toDateTime).toISOString()) : "—"}`);
      y += 8;

      const summary = buildDynamicSummary(calcDateTimeDiff(fromDateTime, toDateTime));
      line(y, `Summary: ${summary}`);
      y += 6;

      const tmp = calcDateTimeDiff(fromDateTime, toDateTime);
      line(
        y,
        `Totals: ${Math.abs(tmp.totalDays).toLocaleString()} days | ${Math.abs(tmp.totalWeeks).toLocaleString()} weeks | ${Math.abs(tmp.totalHours).toLocaleString()} hours | ${Math.abs(tmp.totalMinutes).toLocaleString()} minutes | ${Math.abs(tmp.totalSeconds).toLocaleString()} seconds`
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

  /* -----------------------------------------------------------------------
   * Render
   * --------------------------------------------------------------------- */

  return (
    <>
      <SEOHead
        title={seoData?.dateDifference?.title ?? "Date Difference Calculator"}
        description={
          seoData?.dateDifference?.description ??
          "Calculate the exact difference between two dates and times — with history, notes, and PDF export."
        }
        canonical="https://calculatorhub.com/date-difference"
        schemaData={generateCalculatorSchema(
          "Date Difference Calculator",
          seoData?.dateDifference?.description ??
            "Calculate the exact difference between two dates and times — with history, notes, and PDF export.",
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
            Calculate the exact difference between two date-times — with history, optional notes, and PDF export.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs + Actions */}
          <section className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6" aria-label="Input and actions">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Date &amp; Time</h2>

            {noticeMsg && (
              <div className="mb-3">
                <InlineAlert variant="info" icon={<InfoIcon className="w-4 h-4" />}>{noticeMsg}</InlineAlert>
              </div>
            )}

            <LabeledField label="From" htmlFor="from-datetime">
              <div className="flex gap-1">
                <input
                  id="from-datetime"
                  type="datetime-local"
                  value={fromDateTime === SENTINEL_ZERO ? "" : fromDateTime}
                  onChange={(e) => {
                    const v = e.target.value || SENTINEL_ZERO;
                    setFromDateTime(v);
                    if (v !== SENTINEL_ZERO) enforceOrderAfterSet("from", v);
                  }}
                  className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-invalid={fromDateTime === SENTINEL_ZERO}
                />
              </div>
            </LabeledField>

            <LabeledField label="To" htmlFor="to-datetime">
              <div className="flex gap-1">
                <input
                  id="to-datetime"
                  type="datetime-local"
                  value={toDateTime === SENTINEL_ZERO ? "" : toDateTime}
                  onChange={(e) => {
                    const v = e.target.value || SENTINEL_ZERO;
                    setToDateTime(v);
                    if (v !== SENTINEL_ZERO) enforceOrderAfterSet("to", v);
                  }}
                  className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-invalid={toDateTime === SENTINEL_ZERO}
                />
              </div>
            </LabeledField>

            {/* Optional notes */}
            <div className="mt-2 mb-2">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={notesEnabled}
                  onChange={(e) => setNotesEnabled(e.target.checked)}
                />
                Add reason &amp; description (optional)
              </label>
            </div>

            {notesEnabled && (
              <div className="space-y-3 mb-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Title</label>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="e.g., Project deadline"
                    className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    rows={4}
                    placeholder="Add more details (optional)"
                    className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <button
                onClick={addToHistoryWithNotes}
                className="flex-1 px-4 py-2 bg-emerald-800 text-white rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center justify-center gap-2"
              >
                <HistoryIcon className="w-4 h-4" /> Save to History
              </button>
              <button
                onClick={() => {
                  setFromDateTime(SENTINEL_ZERO);
                  setToDateTime(SENTINEL_ZERO);
                  setErrorMsg("");
                  setNoticeMsg("");
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </div>

            <button
              onClick={handleExportPDF}
              className="flex-1 w-full px-4 py-2 bg-indigo-800 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center justify-center gap-2"
            >
              <FileDown className="w-5 h-5" /> Export PDF
            </button>

            {errorMsg && (
              <div className="mt-2" aria-live="assertive">
                <InlineAlert variant="danger" icon={<AlertTriangle className="w-4 h-4" />} data-testid="error-alert">
                  {errorMsg}
                </InlineAlert>
              </div>
            )}
          </section>

          {/* Results Panel */}
          <section className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6" aria-label="Results and totals">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Time Difference</h2>

            <div className="space-y-6">
              <div className="grid md:grid-cols-1 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Clock className="h-8 w-8 text-blue-800 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900" data-testid="calendar-diff">
                    {buildDynamicSummary(calcDateTimeDiff(fromDateTime, toDateTime))}
                  </div>
                  <div className="text-sm text-gray-800">
                    {calcDateTimeDiff(fromDateTime, toDateTime).negative ? "From date is after To date" : "Calendar difference"}
                  </div>
                </div>

                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-xl font-semibold text-gray-900" data-testid="from-label">
                    {fromDateTime === SENTINEL_ZERO ? "---" : fmtDateTime(fromDateTime)}
                  </div>
                  <div className="text-sm text-gray-800">
                    From • {fromDateTime === SENTINEL_ZERO ? "---" : fromDow || "—"}
                  </div>
                  <div className="mt-2 text-xl font-semibold text-gray-900" data-testid="to-label">
                    {toDateTime === SENTINEL_ZERO ? "---" : fmtDateTime(toDateTime)}
                  </div>
                  <div className="text-sm text-gray-800">
                    To • {toDateTime === SENTINEL_ZERO ? "---" : toDow || "—"}
                  </div>
                </div>
              </div>

              {isValidInput(fromDateTime) && isValidInput(toDateTime) && (
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                  {(() => {
                    const d = calcDateTimeDiff(fromDateTime, toDateTime);
                    return (
                      <>
                        <StatCard label="Total Days" value={abs(d.totalDays).toLocaleString()} className="bg-green-50 border-green-200" />
                        <StatCard label="Total Weeks" value={abs(d.totalWeeks).toLocaleString()} className="bg-yellow-50 border-yellow-200" />
                        <StatCard label="Total Hours" value={abs(d.totalHours).toLocaleString()} className="bg-purple-50 border-purple-200" />
                        <StatCard label="Total Minutes" value={abs(d.totalMinutes).toLocaleString()} className="bg-red-50 border-red-200" />
                      </>
                    );
                  })()}
                </div>
              )}

              {countdownActive && (
                <div className="p-5 rounded-xl bg-indigo-50 border border-indigo-200">
                  <div className="text-sm text-indigo-700">Live Countdown to the “To” date</div>
                  <div className="mt-2 text-3xl font-bold text-indigo-900 tracking-wide" data-testid="countdown">
                    {countdownText}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* History List */}
        <section className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6" aria-label="Saved history">
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
                  <HistoryRow
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
                    onInfo={(item) => {
                      setModalTitle(item.noteTitle || "Details");
                      setModalBody(item.noteBody || "");
                      setModalOpen(true);
                    }}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Trust & About snippet (for snippet/featured box potential) */}
        <div className="rounded-2xl p-6 mb-8 bg-slate-800/50 mt-8 text-slate-300">
          <h2 className="text-2xl font-bold text-white mb-2">About This Date Difference Calculator</h2>
          <p className="mb-2">
            Fast, private, and accurate — this calculator runs <strong>100% locally in your browser</strong> and never uploads your data.
            Instantly find the exact time between two date-times with calendar-aware precision (years, months, days, hours, minutes, seconds).
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-green-600/20 px-3 py-1 text-xs text-green-300 ring-1 ring-green-600/40">
              📅 Calendar-aware math
            </span>
            <span className="inline-flex items-center rounded-full bg-blue-600/20 px-3 py-1 text-xs text-blue-300 ring-1 ring-blue-600/40">
              🔒 No tracking
            </span>
            <span className="inline-flex items-center rounded-full bg-yellow-600/20 px-3 py-1 text-xs text-yellow-300 ring-1 ring-yellow-600/40">
              ⚡ Real-time countdown
            </span>
            <span className="inline-flex items-center rounded-full bg-purple-600/20 px-3 py-1 text-xs text-purple-300 ring-1 ring-purple-600/40">
              📝 Notes & History
            </span>
          </div>
        </div>
        
        <div className="rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Date Difference Calculator – Find Days, Weeks, or Exact Time Between Dates</h2>
          <div className="space-y-4 text-slate-300">
            <p>
              Planning a project, tracking deadlines, or curious how long until an event? This <strong>Date Difference Calculator</strong> gives you precise
              results in real time — from total days and weeks to a <strong>dynamic calendar breakdown</strong> (years, months, days, hours, minutes, seconds).
              It also includes a <strong>live countdown</strong> when your “To” date is in the future.
            </p>
        
            {/* Image 1 */}
            <figure className="rounded-xl overflow-hidden border border-slate-700/50">
              <img
                src="/images/date-difference-hero.webp"
                alt="Date Difference Calculator interface with inputs and dynamic results"
                loading="lazy"
                className="w-full h-auto object-cover"
              />
              <figcaption className="px-3 py-2 text-sm text-slate-400">Calculate the exact time between two dates — including totals and a live countdown.</figcaption>
            </figure>
        
            <p>
              Enter your <strong>From</strong> and <strong>To</strong> dates/times, optionally add a note (title + description), and save the entry.
              Your history is stored locally, and you can export a clean PDF report for sharing or record-keeping.
            </p>
        
            <AdBanner type="bottom" />
        
            <h3 className="text-2xl font-semibold text-white mt-6">Why Use a Date Difference Calculator?</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Accurate Planning</strong> – Schedule sprints, product launches, or study plans with exact durations.</li>
              <li><strong>Event Tracking</strong> – Count down to weddings, trips, exams, or holidays precisely.</li>
              <li><strong>Work & Payroll</strong> – Calculate days/hours between shifts or billing milestones.</li>
              <li><strong>Personal Goals</strong> – Track streaks, habits, and progress over time.</li>
            </ul>
        
            {/* Image 2 */}
            <figure className="rounded-xl overflow-hidden border border-slate-700/50">
              <img
                src="/images/calendar-countdown.webp"
                alt="Calendar with highlight and countdown overlay"
                loading="lazy"
                className="w-full h-auto object-cover"
              />
              <figcaption className="px-3 py-2 text-sm text-slate-400">See totals in days/weeks and a clean calendar-style breakdown.</figcaption>
            </figure>
        
            <h3 className="text-2xl font-semibold text-white mt-6">Key Features</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Calendar-aware difference</strong> – Handles months of different lengths correctly.</li>
              <li><strong>Totals at a glance</strong> – Days, weeks, hours, minutes, and seconds.</li>
              <li><strong>Live countdown</strong> – Only shown when the “To” date is valid and in the future.</li>
              <li><strong>Notes & History</strong> – Add a reason and description; view notes via a mobile-friendly modal.</li>
              <li><strong>Privacy by design</strong> – All calculations happen in your browser.</li>
              <li><strong>PDF export</strong> – Share or archive your results in one click.</li>
            </ul>
        
            {/* Helpful internal backlinks (3–4) */}
            <section className="bg-slate-800/50 rounded-lg p-6 mt-8 text-slate-300">
              <h3 className="text-xl font-semibold text-white mb-3">More Date & Time Tools</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><a href="/age-calculator" className="text-blue-400 hover:underline">Age Calculator</a> – Find exact age in years, months, and days.</li>
                <li><a href="/time-add-subtract" className="text-blue-400 hover:underline">Time Add/Subtract</a> – Add or subtract hours, minutes, or days.</li>
                <li><a href="/countdown-timer" className="text-blue-400 hover:underline">Countdown Timer</a> – Create a real-time countdown for any event.</li>
                <li><a href="/unix-timestamp-converter" className="text-blue-400 hover:underline">Unix Timestamp Converter</a> – Convert between dates and epoch time.</li>
              </ul>
            </section>
        
            <AdBanner type="bottom" />
        
            {/* ===================== FAQ SCHEMA (SEO Rich Results) ===================== */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "Is the Date Difference Calculator free?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes. It’s completely free and runs locally in your browser without sending data to a server."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Does it handle months with different lengths?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes. The calculator is calendar-aware and accounts for variable month lengths when breaking down years, months, and days."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Can I save and annotate my calculations?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Absolutely. Add a title and description, save to history, and reopen your notes anytime via the Info button."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "When does the live countdown show?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "The countdown appears only when your “To” date is valid and still in the future. It hides automatically after completion."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Can I export results?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes. Export a PDF report that includes your input dates, summary, totals, and saved history."
                      }
                    }
                  ]
                })
              }}
            />
        
            <p className="mt-4">
              Use this <strong>Date Difference Calculator</strong> to plan confidently — from personal events to professional projects.
              It’s simple, accurate, and private by design.
            </p>
          </div>
        </div>


        <AdBanner type="bottom" />

        <RelatedCalculators currentPath="/date-difference" category="date-time-tools" />

        {/* Details Modal */}
        <InlineModal
          open={modalOpen}
          title={modalTitle}
          description={modalBody}
          onClose={() => setModalOpen(false)}
        />
      </div>
    </>
  );
};

export default DateDifferencePro;
