
/**
 * DateDifferencePro – Full Feature Page (Extended 750+ lines)
 * -----------------------------------------------------------------------------
 * This file is intentionally verbose and heavily documented to exceed 750 lines,
 * per user request, while keeping production-ready TypeScript/React code.
 *
 * Key behavior (from user requirements):
 * 1) If both From and To use the default sentinel ("0"), do NOT save to history and
 *    show a red inline message: "Values are zero — cannot save history."
 * 2) In the second "Time Difference" box, when defaults are present, show placeholders:
 *      ---
 *      From • ---
 *      ---
 *      To • ---
 *    (i.e., do not display fake dates like Jan 01, 2000).
 * 3) Calendar difference output is dynamic: only show the non-zero parts.
 *    Example: input 20 days and 4 hours -> show "20d, 4h" (not "0y, 0m, 20d, 4h, 0m, 0s").
 *    Apply the same logic to the Live Countdown (no zero segments).
 *
 * Additional notes:
 * - This component keeps the original imports present in the user's app structure.
 * - We include some small a11y and UX helpers (like aria-live regions, titles, etc.).
 * - The file includes additional helper utilities and well-commented code for clarity.
 * - Code is split into small presentational components for readability while staying
 *   in a single file as requested.
 *
 * This file is designed to be dropped into a Next.js/React project as
 * `DateDifferencePro_full.tsx` or similar.
 * -----------------------------------------------------------------------------
 */

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
  PropsWithChildren,
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
} from "lucide-react";
import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import RelatedCalculators from "../components/RelatedCalculators";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

/* ==========================================================================
 * Types
 * ========================================================================== */

/**
 * DiffResult represents a precise difference using two models:
 * - Calendar components (Y/M/D H/M/S) relative to aligned dates
 * - Absolute totals (days/weeks/hours/minutes/seconds)
 */
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

/**
 * An item saved in local history.
 */
export type HistoryItem = {
  id: string;
  fromISO: string;
  toISO: string;
  createdAtISO: string;
  summary: string;
};

/* ==========================================================================
 * Constants & Utilities
 * ========================================================================== */

const LS_KEY = "dateDiffHistory_v2";

/**
 * A sentinel for "blank/invalid" input fields. Matches the user's original code.
 * Using an explicit sentinel avoids ambiguous empty strings for state transitions.
 */
const SENTINEL_ZERO = "0";

/** Left-pad a number to 2 digits (absolute value) */
const pad2 = (n: number) => String(Math.abs(n)).padStart(2, "0");

/** Is a Date valid? */
const isValidDate = (d: Date) => !Number.isNaN(d.getTime());

/**
 * Format an ISO string into a localized, concise datetime label.
 * If invalid, prints em-dash.
 */
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

/** Clamp history length for performance */
const clampHistory = (items: HistoryItem[], max = 20) => items.slice(0, max);

/** Robustly load local history, SSR-safe */
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

/** Robustly save local history, SSR-safe */
function saveHistory(items: HistoryItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(clampHistory(items)));
}

/**
 * Convert Date -> input[type=datetime-local] value.
 * This expects local time without timezone suffix.
 */
const toLocalDateTimeValue = (d: Date) => {
  const year = d.getFullYear();
  const month = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hour = pad2(d.getHours());
  const min = pad2(d.getMinutes());
  return `${year}-${month}-${day}T${hour}:${min}`;
};

/**
 * calcDateTimeDiff
 * - Computes a calendar-aware difference (Y/M/D; borrowing days from months)
 * - Computes time-of-day difference (H/M/S) after aligning Y/M/D
 * - Returns absolute totals for convenience (days/weeks/hours/minutes/seconds)
 */
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

  // Calendar-based difference
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

  // Align start to end for time-of-day delta
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

/**
 * buildDynamicSummary
 * Returns a concise, only-non-zero parts summary string.
 * Examples:
 *   0y 0m 20d 4h 0m 0s -> "20d, 4h"
 *   1y 0m 0d 0h 0m 0s -> "1y"
 *   0y 0m 0d 0h 0m 3s -> "3s"
 *   all zeros -> "0s"
 */
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

/**
 * InlineAlert – lightweight alert line with icon and color.
 * variant: "info" | "success" | "warning" | "danger"
 */
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
  const styles: Record<typeof variant, string> = {
    info: "bg-blue-50 text-blue-800 border-blue-200",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
    danger: "bg-red-50 text-red-800 border-red-200",
  } as const;
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

/** StatCard – single metric card */
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

/** HistoryRow – a single row in the History list */
type HistoryRowProps = {
  item: HistoryItem;
  countdownLabel: string;
  completed: boolean;
  onEdit: () => void;
  onDelete: () => void;
};
const HistoryRow = memo(function HistoryRow({
  item,
  countdownLabel,
  completed,
  onEdit,
  onDelete,
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
        <div className="text-sm font-semibold text-indigo-700 mt-1">{countdownLabel}</div>
      </div>
      <div className="flex gap-2">
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

/**
 * LabeledField – wrapper for label + children with consistent spacing
 */
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

/**
 * Divider with label for visual grouping
 */
const SectionDivider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 my-2" role="separator" aria-label={label}>
    <div className="h-px bg-gray-200 flex-1" />
    <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
    <div className="h-px bg-gray-200 flex-1" />
  </div>
);

/* ==========================================================================
 * Main Component
 * ========================================================================== */

const DateDifferencePro: React.FC = () => {
  /**
   * Core state (inputs & derived)
   * ------------------------------------------------------------------------
   * We keep the sentinel "0" to represent a blank/invalid state to preserve
   * compatibility with the user's original logic.
   */
  const [fromDateTime, setFromDateTime] = useState<string>(SENTINEL_ZERO);
  const [toDateTime, setToDateTime] = useState<string>(SENTINEL_ZERO);

  /** Difference is recalculated whenever either input changes */
  const [diff, setDiff] = useState<DiffResult>(() => calcDateTimeDiff(fromDateTime, toDateTime));

  /**
   * nowISO is used for live countdowns. We tick every second with an interval.
   * For accessibility, we keep countdown text readable and concise.
   */
  const [nowISO, setNowISO] = useState<string>(() => new Date().toISOString());

  /** Local history & inline error message area */
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory());
  const [errorMsg, setErrorMsg] = useState<string>("");

  /** Optional convenience: “warnings” area for non-blocking hints */
  const [noticeMsg, setNoticeMsg] = useState<string>("");

  /** Whether to show advanced controls (swap, set quick values) */
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);

  /* -----------------------------------------------------------------------
   * Effects
   * --------------------------------------------------------------------- */

  // Recalculate diff when inputs change
  useEffect(() => {
    setDiff(calcDateTimeDiff(fromDateTime, toDateTime));
  }, [fromDateTime, toDateTime]);

  // 1-second ticker for countdowns
  useEffect(() => {
    const id = setInterval(() => setNowISO(new Date().toISOString()), 1000);
    return () => clearInterval(id);
  }, []);

  /* -----------------------------------------------------------------------
   * Derived helpers & memoized values
   * --------------------------------------------------------------------- */

  const abs = (n: number) => Math.abs(n);

  /** Is a valid target for countdown? */
  const countdownActive = useMemo(() => isValidDate(new Date(toDateTime)), [toDateTime]);

  // Countdown display parts (dynamic – no zero parts)
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

  // Day-of-week labels (or blank when invalid)
  const fromDow = useMemo(() => {
    const d = new Date(fromDateTime);
    return isValidDate(d) ? d.toLocaleDateString(undefined, { weekday: "long" }) : "";
  }, [fromDateTime]);
  const toDow = useMemo(() => {
    const d = new Date(toDateTime);
    return isValidDate(d) ? d.toLocaleDateString(undefined, { weekday: "long" }) : "";
  }, [toDateTime]);

  // History live countdowns, computed from nowISO
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

  /* -----------------------------------------------------------------------
   * Actions
   * --------------------------------------------------------------------- */

  const resetDates = () => {
    setFromDateTime(SENTINEL_ZERO);
    setToDateTime(SENTINEL_ZERO);
    setErrorMsg("");
    setNoticeMsg("");
  };

  const swapDates = () => {
    // Safe swap with state
    setFromDateTime((prevFrom) => {
      const nextFrom = toDateTime;
      setToDateTime(prevFrom);
      return nextFrom;
    });
  };

  const quickSetFromNow = () => {
    const v = toLocalDateTimeValue(new Date());
    setFromDateTime(v);
    setNoticeMsg("From set to current time.");
  };

  const quickSetToNow = () => {
    const v = toLocalDateTimeValue(new Date());
    setToDateTime(v);
    setNoticeMsg("To set to current time.");
  };

  const addDaysToTo = (n: number) => {
    const base = new Date();
    base.setDate(base.getDate() + n);
    setToDateTime(toLocalDateTimeValue(base));
    setNoticeMsg(`To set to now + ${n} day${n === 1 ? "" : "s"}.`);
  };

  const addToHistory = () => {
    // User rule: if both are defaults, do not save; show red text
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
      summary: buildDynamicSummary(diff),
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
      const line = (y: number, text: string) => {
        doc.text(text, 14, y);
      };

      let y = 14;
      doc.setFontSize(16);
      line(y, "Date Difference Report");
      y += 8;

      doc.setFontSize(11);
      line(y, `Generated: ${fmtDateTime(new Date().toISOString())}`);
      y += 8;

      // Print dates safely
      const fValid = isValidDate(new Date(fromDateTime));
      const tValid = isValidDate(new Date(toDateTime));
      line(y, `From: ${fValid ? fmtDateTime(new Date(fromDateTime).toISOString()) : "—"}`);
      y += 6;
      line(y, `To:   ${tValid ? fmtDateTime(new Date(toDateTime).toISOString()) : "—"}`);
      y += 8;

      const summary = buildDynamicSummary(diff);
      line(y, `Summary: ${summary}`);
      y += 6;

      line(
        y,
        `Totals: ${Math.abs(diff.totalDays).toLocaleString()} days | ${Math.abs(diff.totalWeeks).toLocaleString()} weeks | ${Math.abs(diff.totalHours).toLocaleString()} hours | ${Math.abs(diff.totalMinutes).toLocaleString()} minutes | ${Math.abs(diff.totalSeconds).toLocaleString()} seconds`
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
      // npm i jspdf
    }
  };

  /* -----------------------------------------------------------------------
   * Render
   * --------------------------------------------------------------------- */

  return (
    <>
      {/* SEO / Breadcrumbs header section */}
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
          {/* Inputs + Actions Panel */}
          <section
            className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            aria-label="Input and actions"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Date &amp; Time</h2>

            {noticeMsg && (
              <div className="mb-3">
                <InlineAlert variant="info" icon={<Info className="w-4 h-4" />}>
                  {noticeMsg}
                </InlineAlert>
              </div>
            )}

            <LabeledField label="From" htmlFor="from-datetime">
              <div className="flex gap-1">
                <input
                  id="from-datetime"
                  type="datetime-local"
                  value={fromDateTime === SENTINEL_ZERO ? "" : fromDateTime}
                  onChange={(e) => setFromDateTime(e.target.value || SENTINEL_ZERO)}
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
                  onChange={(e) => setToDateTime(e.target.value || SENTINEL_ZERO)}
                  className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-invalid={toDateTime === SENTINEL_ZERO}
                />
              </div>
            </LabeledField>

            {/* Advanced quick actions (optional togglable) */}
            <div className="mb-2 flex items-center justify-between">
              <SectionDivider label="Quick actions" />
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={showAdvanced}
                  onChange={(e) => setShowAdvanced(e.target.checked)}
                />
                Show
              </label>
            </div>

            {showAdvanced && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                <button
                  type="button"
                  onClick={swapDates}
                  className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 inline-flex items-center justify-center gap-2"
                  title="Swap From and To"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Swap
                </button>
                <button
                  type="button"
                  onClick={quickSetFromNow}
                  className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 inline-flex items-center justify-center gap-2"
                  title="Set From = Now"
                >
                  From = Now
                </button>
                <button
                  type="button"
                  onClick={quickSetToNow}
                  className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 inline-flex items-center justify-center gap-2"
                  title="Set To = Now"
                >
                  To = Now
                </button>
                <button
                  type="button"
                  onClick={() => addDaysToTo(1)}
                  className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 inline-flex items-center justify-center gap-2"
                  title="Set To = Now + 1 day"
                >
                  +1 day
                </button>
                <button
                  type="button"
                  onClick={() => addDaysToTo(7)}
                  className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 inline-flex items-center justify-center gap-2"
                  title="Set To = Now + 7 days"
                >
                  +7 days
                </button>
                <button
                  type="button"
                  onClick={() => addDaysToTo(30)}
                  className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 inline-flex items-center justify-center gap-2"
                  title="Set To = Now + 30 days"
                >
                  +30 days
                </button>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <button
                onClick={addToHistory}
                className="flex-1 px-4 py-2 bg-emerald-800 text-white rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center justify-center gap-2"
              >
                <HistoryIcon className="w-4 h-4" /> Save to History
              </button>
              <button
                onClick={resetDates}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
              
            </div>
            <button
                onClick={handleExportPDF}
                className="flex-1 px-4 py-2 bg-indigo-800 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center justify-center gap-2"
              >
                <FileDown className="w-5 h-5" /> Export PDF
              </button>

            {/* Error message area (red text) */}
            {errorMsg && (
              <div className="mt-1" aria-live="assertive">
                <InlineAlert variant="danger" icon={<AlertTriangle className="w-4 h-4" />} data-testid="error-alert">
                  {errorMsg}
                </InlineAlert>
              </div>
            )}
          </section>

          {/* Results Panel */}
          <section
            className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            aria-label="Results and totals"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Time Difference</h2>

            <div className="space-y-6">
              {/* Calendar difference summary */}
              <div className="grid md:grid-cols-1 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Clock className="h-8 w-8 text-blue-800 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900" data-testid="calendar-diff">
                    {buildDynamicSummary(diff)}
                  </div>
                  <div className="text-sm text-gray-800">
                    {diff.negative ? "From date is after To date" : "Calendar difference"}
                  </div>
                </div>

                {/* From/To box */}
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

              {/* Totals */}
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <StatCard
                  label="Total Days"
                  value={abs(diff.totalDays).toLocaleString()}
                  className="bg-green-50 border-green-200"
                />
                <StatCard
                  label="Total Weeks"
                  value={abs(diff.totalWeeks).toLocaleString()}
                  className="bg-yellow-50 border-yellow-200"
                />
                <StatCard
                  label="Total Hours"
                  value={abs(diff.totalHours).toLocaleString()}
                  className="bg-purple-50 border-purple-200"
                />
                <StatCard
                  label="Total Minutes"
                  value={abs(diff.totalMinutes).toLocaleString()}
                  className="bg-red-50 border-red-200"
                />
              </div>

              {/* Live Countdown */}
              {countdownActive && (
                <div className="p-5 rounded-xl bg-indigo-50 border border-indigo-200">
                  <div className="text-sm text-indigo-700">Live Countdown to the “To” date</div>
                  <div
                    className="mt-2 text-3xl font-bold text-indigo-900 tracking-wide"
                    data-testid="countdown"
                  >
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
              <InlineAlert
                variant="success"
                icon={<CheckCircle2 className="w-4 h-4" />}
                className="hidden md:flex"
              >
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

/* ==========================================================================
 * Export
 * ========================================================================== */

export default DateDifferencePro;

/* ==========================================================================
 * Appendix: Extra Documentation & Notes (pure comments to satisfy 750+ lines)
 * ========================================================================== */

/**
 * Why keep a sentinel string "0" instead of empty strings?
 * -------------------------------------------------------
 * - The user's original implementation used "0" as a special value to mark
 *   inputs as "unset" to decouple UI clearing from state transitions that
 *   might otherwise briefly hold an empty string and be confused with a valid
 *   formatted value. We preserve this convention for compatibility.
 *
 * Why not parse/format in UTC consistently?
 * ----------------------------------------
 * - `input[type="datetime-local"]` expects a local datetime string without
 *   timezone marks. Showing/consuming local time avoids surprising the user
 *   with UTC offsets when they type values.
 *
 * Can we store timezones?
 * -----------------------
 * - You can extend this file by adding a timezone selector and normalizing all
 *   calculations to UTC internally. For now, the user didn’t request that.
 *
 * What about leap seconds and DST?
 * --------------------------------
 * - The built-in Date object handles DST transitions and leap years but not
 *   leap seconds explicitly. For most practical purposes here, this is fine.
 *   If you need astronomical precision, consider a specialized library.
 *
 * How to add localization/i18n?
 * -----------------------------
 * - Wrap text labels with an i18n function and swap `toLocaleString` options
 *   depending on the user’s locale. The structure here supports that easily.
 *
 * Testing ideas:
 * --------------
 * - Unit-test `calcDateTimeDiff` with edge cases (month boundaries, leap year,
 *   end-of-month borrowing, negative ordering, same timestamps, etc.).
 * - Snapshot-test the component with various inputs.
 *
 * Accessibility notes:
 * --------------------
 * - The InlineAlert components use `role=\"status\"` and `aria-live` for SRs.
 * - Inputs are labeled via `LabeledField`.
 * - Buttons include titles where the icon alone might be ambiguous.
 *
 * Performance notes:
 * ------------------
 * - History is clamped to 20 items by default.
 * - Countdown recomputes only once per second with a single interval.
 *
 * Security notes:
 * ---------------
 * - LocalStorage is used for history. If you need cross-device sync, pair with
 *   a backend and auth. Avoid saving sensitive user data.
 *
 * PDF export:
 * -----------
 * - We import `jspdf` dynamically. Make sure to install it: `npm i jspdf`.
 *
 * End of file.
 */
