
/**
 * DateDifferencePro – Full Feature Page (Patched + Anchor Guards + Order Constraint)
 * -----------------------------------------------------------------------------
 * - Treats "0" as INVALID input everywhere (no more 1970 diffs)
 * - Adds "anchor" logic: when From=Now, +/- adjusts TO and cannot cross FROM;
 *   when To=Now, only minus adjusts FROM and cannot cross TO (plus disabled).
 * - Enforces ordering constraint: FROM <= TO at all times.
 * - Dynamic summary & countdown show only non-zero parts.
 */

import React, {
  useEffect,
  useMemo,
  useState,
  memo,
  PropsWithChildren,
  ReactNode,
} from "react";
import {
  Clock,
  History as HistoryIcon,
  FileDown,
  RotateCcw,
  Edit3,
  Trash2,
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

// Treat sentinel "0" (and empty) as invalid input
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
  // Guard against sentinel "0" and empty
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
        <div className="text-sm font-semibold text-indigo-700 mt-1">{countdownLabel}</div>
      </div>
      <div className="flex gap-2 flex-wrap">
        
        {onInfo && (item.noteTitle || item.noteBody) && (
          <button
            onClick={() => onInfo(item)}
            className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 text-sm inline-flex items-center gap-1"
            title="View details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
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

  const [diff, setDiff] = useState<DiffResult>(() => calcDateTimeDiff(fromDateTime, toDateTime));

  const [nowISO, setNowISO] = useState<string>(() => new Date().toISOString());

  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory());
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [noticeMsg, setNoticeMsg] = useState<string>("");
  // Optional notes UI state
  const [notesEnabled, setNotesEnabled] = useState<boolean>(false);
  const [noteTitle, setNoteTitle] = useState<string>("");
  const [noteBody, setNoteBody] = useState<string>("");

  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [anchor, setAnchor] = useState<'from' | 'to' | null>(null);
  // Modal for history item details
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>("");
  const [modalBody, setModalBody] = useState<string>("");

  // Recalculate diff
  useEffect(() => {
    setDiff(calcDateTimeDiff(fromDateTime, toDateTime));
  }, [fromDateTime, toDateTime]);

  // 1-second ticker
  useEffect(() => {
    const id = setInterval(() => setNowISO(new Date().toISOString()), 1000);
    return () => clearInterval(id);
  }, []);

  const abs = (n: number) => Math.abs(n);

  // Enforce ordering: FROM <= TO
  const enforceOrderAfterSet = (which: 'from' | 'to', val: string) => {
    if (!isValidInput(val)) return;
    if (which === 'from') {
      if (isValidInput(toDateTime)) {
        const f = new Date(val).getTime();
        const t = new Date(toDateTime).getTime();
        if (f > t) {
          // push TO up to FROM
          setToDateTime(val);
          setNoticeMsg("Adjusted: To aligned to From to keep order.");
        }
      }
    } else {
      // which === 'to'
      if (isValidInput(fromDateTime)) {
        const f = new Date(fromDateTime).getTime();
        const t = new Date(val).getTime();
        if (t < f) {
          // pull FROM down to TO
          setFromDateTime(val);
          setNoticeMsg("Adjusted: From aligned to To to keep order.");
        }
      }
    }
  };

  // Countdown active only when TO is valid input
    // Countdown shows only when TO is valid and remaining time > 0
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

  // Day-of-week labels
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
      const label = remain <= 0 ? "Completed" : `${parts.join(" ")} remaining`
      return { id: h.id, complete: remain <= 0, label };
    });
  }, [history, nowISO]);

  const findHistoryCountdown = (id: string) => historyCountdowns.find((x) => x.id === id);

  /* -----------------------------------------------------------------------
   * Anchor guards: prevent crossing & disable plus when To=Now
   * --------------------------------------------------------------------- */

  const canApplyStep = (stepDays: number): boolean => {
    if (!anchor) return false;

    if (anchor === 'from') {
      // adjusting TO; TO must stay >= FROM
      if (!isValidInput(fromDateTime)) return true;
      const anchorDate = new Date(fromDateTime);
      const base = isValidInput(toDateTime) ? new Date(toDateTime) : new Date();
      const candidate = new Date(base);
      candidate.setDate(candidate.getDate() + stepDays);
      return candidate.getTime() >= anchorDate.getTime();
    } else {
      // anchor === 'to' -> adjusting FROM; FROM must stay <= TO
      if (stepDays > 0) return false; // plus disabled when To=Now
      if (!isValidInput(toDateTime)) return true;
      const anchorDate = new Date(toDateTime);
      const base = isValidInput(fromDateTime) ? new Date(fromDateTime) : new Date();
      const candidate = new Date(base);
      candidate.setDate(candidate.getDate() + stepDays);
      return candidate.getTime() <= anchorDate.getTime();
    }
  };

  // Adjust +/- days on the *non-anchored* field (accumulate) with clamping
  const adjustDays = (n: number) => {
    if (!anchor) return;

    if (!canApplyStep(n)) {
      setNoticeMsg(anchor === 'from'
        ? "Cannot move TO earlier than FROM."
        : (n > 0 ? "When To = Now, +days are disabled." : "Cannot move FROM later than TO."));
      return;
    }

    if (anchor === 'from') {
      // modify TO, clamp so it never goes earlier than FROM
      const base = isValidInput(toDateTime) ? new Date(toDateTime) : new Date();
      const next = new Date(base);
      next.setDate(next.getDate() + n);

      if (isValidInput(fromDateTime)) {
        const from = new Date(fromDateTime);
        if (next.getTime() < from.getTime()) {
          setToDateTime(toLocalDateTimeValue(from));
          return;
        }
      }
      setToDateTime(toLocalDateTimeValue(next));
    } else {
      // anchor === 'to' -> modify FROM, clamp so it never goes later than TO
      const base = isValidInput(fromDateTime) ? new Date(fromDateTime) : new Date();
      const next = new Date(base);
      next.setDate(next.getDate() + n);

      if (isValidInput(toDateTime)) {
        const to = new Date(toDateTime);
        if (next.getTime() > to.getTime()) {
          setFromDateTime(toLocalDateTimeValue(to));
          return;
        }
      }
      setFromDateTime(toLocalDateTimeValue(next));
    }
  };

  /* -----------------------------------------------------------------------
   * Actions
   * --------------------------------------------------------------------- */

  const resetDates = () => {
    setFromDateTime(SENTINEL_ZERO);
    setToDateTime(SENTINEL_ZERO);
    setErrorMsg("");
    setNoticeMsg("");
    setAnchor(null);
  };

  const quickSetFromNow = () => {
    const v = toLocalDateTimeValue(new Date());
    setFromDateTime(v);
    setAnchor('from');
    setNoticeMsg("From set to current time.");
    enforceOrderAfterSet('from', v);
  };

  const quickSetToNow = () => {
    const v = toLocalDateTimeValue(new Date());
    setToDateTime(v);
    setAnchor('to');
    setNoticeMsg("To set to current time.");
    enforceOrderAfterSet('to', v);
  };

  const swapDates = () => {
    setFromDateTime((prevFrom) => {
      const nextFrom = toDateTime;
      setToDateTime(prevFrom);
      return nextFrom;
    });
  };

  const addToHistory = () => {
    if (fromDateTime === SENTINEL_ZERO && toDateTime === SENTINEL_ZERO) {
      setErrorMsg("Values are zero — cannot save history.");
      return;
    }
    if (!isValidInput(fromDateTime) || !isValidInput(toDateTime)) {
      setErrorMsg("Please select valid From and To dates.");
      return;
    }
    // Enforce order before saving
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

  // Save to history and clear note fields if successful
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
    // clear notes
    setNotesEnabled(false);
    setNoteTitle("");
    setNoteBody("");
    setNoticeMsg("Saved to history with note.");
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
          "Calculate the exact difference between two dates and times — with history, voice input, and PDF export."
        }
        canonical="https://calculatorhub.com/date-difference"
        schemaData={generateCalculatorSchema(
          "Date Difference Calculator",
          seoData?.dateDifference?.description ??
            "Calculate the exact difference between two dates and times — with history, voice input, and PDF export.",
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
            Calculate the exact difference between two dates and times — with history, quick add/subtract days, and PDF export.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs + Actions Panel */}
          <section className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6" aria-label="Input and actions">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Date &amp; Time</h2>

            {noticeMsg && (
              <div className="mb-3">
                <InlineAlert variant="info" icon={<Info className="w-4 h-4" />}>{noticeMsg}</InlineAlert>
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
                    if (v !== SENTINEL_ZERO) enforceOrderAfterSet('from', v);
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
                    if (v !== SENTINEL_ZERO) enforceOrderAfterSet('to', v);
                  }}
                  className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-invalid={toDateTime === SENTINEL_ZERO}
                />
              </div>
            </LabeledField>

            {/* Optional notes toggle */}
            <div className="mt-2 mb-2">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={notesEnabled}
                  onChange={(e) => setNotesEnabled(e.target.checked)}
                />
                Add reason & description (optional)
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
              
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={addToHistoryWithNotes}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg"
                    title="Save to History (with note)"
                  >
                    Save to History (with note)
                  </button>
                </div>
</div>
            )}

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
              className="flex-1 w-full px-4 py-2 bg-indigo-800 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center justify-center gap-2"
            >
              <FileDown className="w-5 h-5" /> Export PDF
            </button>

            {errorMsg && (
              <div className="mt-1" aria-live="assertive">
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
              {/* Calendar difference summary */}
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

              {/* Live Countdown */}
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
                    onInfo={(item) => { setModalTitle(item.noteTitle || 'Details'); setModalBody(item.noteBody || ''); setModalOpen(true); }}
                  />
                );
              })}
            </div>
          )}
        </section>

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
