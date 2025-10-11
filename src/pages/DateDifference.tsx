import React, { useEffect, useMemo, useRef, useState } from "react";
import { Clock, Mic, RefreshCw, History as HistoryIcon, FileDown, RotateCcw } from "lucide-react";
import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import RelatedCalculators from "../components/RelatedCalculators";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

/**
 * Utilities & Types
 */
type DiffResult = {
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

type HistoryItem = {
  id: string;
  fromISO: string;
  toISO: string;
  createdAtISO: string;
  summary: string;
};

const LS_KEY = "dateDiffHistory_v2";

const pad2 = (n: number) => String(Math.abs(n)).padStart(2, "0");
const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function clampHistory(items: HistoryItem[], max = 20) {
  return items.slice(0, max);
}

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

function isValidDate(d: Date) {
  return !Number.isNaN(d.getTime());
}

/**
 * Calculate precise difference (calendar-wise for Y/M/D; absolute for totals)
 * Accepts two ISO strings (date or datetime)
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

  // Calendar-based Y/M/D difference (respect months lengths)
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    // borrow from months
    months -= 1;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  // Time of day difference for H/M/S after aligning Y/M/D
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

function buildSummary(d: DiffResult) {
  const abs = <T extends number>(v: T) => Math.abs(v);
  const parts: string[] = [];
  if (abs(d.years)) parts.push(`${abs(d.years)} year${abs(d.years) === 1 ? "" : "s"}`);
  if (abs(d.months)) parts.push(`${abs(d.months)} month${abs(d.months) === 1 ? "" : "s"}`);
  if (abs(d.days)) parts.push(`${abs(d.days)} day${abs(d.days) === 1 ? "" : "s"}`);
  if (abs(d.hours)) parts.push(`${abs(d.hours)} hour${abs(d.hours) === 1 ? "" : "s"}`);
  if (abs(d.minutes)) parts.push(`${abs(d.minutes)} minute${abs(d.minutes) === 1 ? "" : "s"}`);
  if (abs(d.seconds)) parts.push(`${abs(d.seconds)} second${abs(d.seconds) === 1 ? "" : "s"}`);
  return parts.length ? parts.join(", ") : "0 seconds";
}

/**
 * Voice recognition helpers (Web Speech API)
 */
declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

function getSpeechRecognition(): any | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

function parseDateFromSpeech(text: string): string | null {
  // Try 1: direct Date parse
  const d1 = new Date(text);
  if (isValidDate(d1)) return toLocalDateTimeValue(d1);

  // Try 2: simple patterns like "January 1 2024 at 5 pm"
  // (Date ctor above usually handles these; keep fallback minimal)
  return null;
}

// Convert Date -> value for input[type="datetime-local"] (local time, no Z)
function toLocalDateTimeValue(d: Date): string {
  const year = d.getFullYear();
  const month = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hour = pad2(d.getHours());
  const min = pad2(d.getMinutes());
  return `${year}-${month}-${day}T${hour}:${min}`;
}

/**
 * Component
 */
const DateDifferencePro: React.FC = () => {
  // default from date
  const [fromDateTime, setFromDateTime] = useState<string>("0");
  const [toDateTime, setToDateTime] = useState<string>("0");

  const [diff, setDiff] = useState<DiffResult>(() => calcDateTimeDiff(fromDateTime, toDateTime));

  // Countdown (now -> toDateTime)
  const [nowISO, setNowISO] = useState<string>(() => new Date().toISOString());

  // History
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory());
  const addToHistory = () => {
    const item: HistoryItem = {
      id: `${Date.now()}`,
      fromISO: new Date(fromDateTime).toISOString(),
      toISO: new Date(toDateTime).toISOString(),
      createdAtISO: new Date().toISOString(),
      summary: buildSummary(diff),
    };
    const next = clampHistory([item, ...history]);
    setHistory(next);
    saveHistory(next);
  };
  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  // Speech
  const recogRef = useRef<any | null>(null);
  const [listeningFor, setListeningFor] = useState<"from" | "to" | null>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // init recognizer lazily
    if (!recogRef.current) {
      recogRef.current = getSpeechRecognition();
      if (recogRef.current) {
        recogRef.current.continuous = false;
        recogRef.current.interimResults = false;
        recogRef.current.lang = "en-US";
      }
    }
  }, []);

  const startVoiceFor = (field: "from" | "to") => {
    if (!recogRef.current) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    setListeningFor(field);
    setIsListening(true);
    recogRef.current.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(" ");
      const parsed = parseDateFromSpeech(transcript);
      if (parsed) {
        if (field === "from") setFromDateTime(parsed);
        else setToDateTime(parsed);
      } else {
        // as a convenience, try keywords "today" / "now" / "tomorrow"
        const lower = transcript.toLowerCase();
        const now = new Date();
        if (lower.includes("now") || lower.includes("today")) {
          const v = toLocalDateTimeValue(now);
          field === "from" ? setFromDateTime(v) : setToDateTime(v);
        } else if (lower.includes("tomorrow")) {
          const t = new Date(now);
          t.setDate(t.getDate() + 1);
          const v = toLocalDateTimeValue(t);
          field === "from" ? setFromDateTime(v) : setToDateTime(v);
        } else {
          alert(`Couldn't parse date/time from: "${transcript}"`);
        }
      }
      setIsListening(false);
      setListeningFor(null);
    };
    recogRef.current.onerror = () => {
      setIsListening(false);
      setListeningFor(null);
    };
    try {
      recogRef.current.start();
    } catch {
      // no-op
    }
  };

  const stopVoice = () => {
    try {
      recogRef.current?.stop();
    } catch {
      // no-op
    }
    setIsListening(false);
    setListeningFor(null);
  };

  // Recalculate on changes
  useEffect(() => {
    setDiff(calcDateTimeDiff(fromDateTime, toDateTime));
  }, [fromDateTime, toDateTime]);

  // Live "now" ticker (for countdown)
  useEffect(() => {
    const id = setInterval(() => {
      setNowISO(new Date().toISOString());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Helpers
  const swapDates = () => {
    setFromDateTime(toDateTime);
    setToDateTime(fromDateTime);
  };

  const resetDates = () => {
    setFromDateTime("0");
    setToDateTime('0');
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

      line(y, `From: ${fmtDateTime(new Date(fromDateTime).toISOString())}`);
      y += 6;
      line(y, `To:   ${fmtDateTime(new Date(toDateTime).toISOString())}`);
      y += 8;

      const summary = buildSummary(diff);
      line(y, `Summary: ${summary}`);
      y += 6;

      line(
        y,
        `Totals: ${Math.abs(diff.totalDays).toLocaleString()} days | ${Math.abs(
          diff.totalWeeks
        ).toLocaleString()} weeks | ${Math.abs(diff.totalHours).toLocaleString()} hours | ${Math.abs(
          diff.totalMinutes
        ).toLocaleString()} minutes | ${Math.abs(diff.totalSeconds).toLocaleString()} seconds`
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
          const row = `${idx + 1}. ${fmtDateTime(h.fromISO)}  →  ${fmtDateTime(h.toISO)}   |   ${h.summary}   |   saved ${fmtDateTime(
            h.createdAtISO
          )}`;
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

   const now = new Date(nowISO);
  const target = new Date(toDateTime);
  
  let cdMs = 0;
  if (isValidDate(target)) {
    cdMs = Math.max(0, target.getTime() - now.getTime());
  }
  
  const cdTotalSec = Math.floor(cdMs / 1000);
  const cdDays = Math.floor(cdTotalSec / (3600 * 24));
  const cdHours = Math.floor((cdTotalSec % (3600 * 24)) / 3600);
  const cdMins = Math.floor((cdTotalSec % 3600) / 60);
  const cdSecs = cdTotalSec % 60;


  const fromDow = useMemo(() => {
    const d = new Date(fromDateTime);
    return isValidDate(d) ? d.toLocaleDateString(undefined, { weekday: "long" }) : "";
  }, [fromDateTime]);

  const toDow = useMemo(() => {
    const d = new Date(toDateTime);
    return isValidDate(d) ? d.toLocaleDateString(undefined, { weekday: "long" }) : "";
  }, [toDateTime]);

  const abs = (n: number) => Math.abs(n);

  return (
    <>
      <SEOHead
        title={seoData.dateDifference.title}
        description={seoData.dateDifference.description}
        canonical="https://calculatorhub.com/date-difference"
        schemaData={generateCalculatorSchema(
          "Date Difference Calculator",
          seoData.dateDifference.description,
          "/date-difference",
          seoData.dateDifference.keywords
        )}
        breadcrumbs={[
          { name: "Date & Time Tools", url: "/category/date-time-tools" },
          { name: "Date Difference Calculator", url: "/date-difference" },
        ]}
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Date & Time Tools", url: "/category/date-time-tools" },
            { name: "Date Difference Calculator", url: "/date-difference" },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Date Difference Calculator</h1>
          <p className="text-slate-300">Calculate the exact difference between two dates and times — with history, voice input, and PDF export.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs + Actions */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Date & Time</h2>

            <div className="space-y-2">
              {/* From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                <div className="flex gap-1">
                  <input
                      type="datetime-local"
                      value={fromDateTime || ""}
                      placeholder="Select date & time"
                      onChange={(e) => setFromDateTime(e.target.value || "0")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                    />
                  <button
                    onClick={() => startVoiceFor("from")}
                    className={`px-3 rounded-lg border ${isListening && listeningFor === "from" ? "bg-red-50 border-red-300" : "bg-gray-50 border-gray-200"} hover:bg-gray-100`}
                    title="Voice input for From"
                  >
                    <Mic className={`w-5 h-5 ${isListening && listeningFor === "from" ? "text-red-800 animate-pulse" : "text-gray-700"}`} />
                  </button>
                </div>
              </div>

              {/* To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                <div className="flex gap-1">
                  <input
                    type="datetime-local"
                    value={toDateTime || ""}
                    placeholder="Select date & time"
                    onChange={(e) => setToDateTime(e.target.value || "0")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  />
                  <button
                    onClick={() => startVoiceFor("to")}
                    className={`px-3 rounded-lg border ${isListening && listeningFor === "to" ? "bg-red-50 border-red-300" : "bg-gray-50 border-gray-200"} hover:bg-gray-100`}
                    title="Voice input for To"
                  >
                    <Mic className={`w-5 h-5 ${isListening && listeningFor === "to" ? "text-red-800 animate-pulse" : "text-gray-700"}`} />
                  </button>
                </div>
              </div>

              {isListening ? (
                <button
                  onClick={stopVoice}
                  className="w-full px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Stop Listening
                </button>
              ) : null}

              <div className="flex gap-2">
                <button
                  onClick={swapDates}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Swap
                </button>
                <button
                  onClick={() => setToDateTime(toLocalDateTimeValue(new Date()))}
                  className="flex-1 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Set To Now
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={resetDates}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
                <button
                  onClick={addToHistory}
                  className="flex-1 px-4 py-2 bg-emerald-800 text-white rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <HistoryIcon className="w-4 h-4" /> Save to History
                </button>
              </div>

              <button
                onClick={handleExportPDF}
                className="w-full px-4 py-2 bg-indigo-800 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center justify-center gap-2"
              >
                <FileDown className="w-5 h-5" /> Export PDF
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Time Difference</h2>

            <div className="space-y-6">
              <div className="grid md:grid-cols-1 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Clock className="h-8 w-8 text-blue-800 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {abs(diff.years)}y, {abs(diff.months)}m, {abs(diff.days)}d, {abs(diff.hours)}h, {abs(diff.minutes)}m, {abs(diff.seconds)}s
                  </div>
                  <div className="text-sm text-gray-800">
                    {diff.negative ? "From date is after To date" : "Calendar difference"}
                  </div>
                </div>

                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-xl font-semibold text-gray-900">{fmtDateTime(new Date(fromDateTime).toISOString())}</div>
                  <div className="text-sm text-gray-800">From • {fromDow}</div>
                  <div className="mt-2 text-xl font-semibold text-gray-900">{fmtDateTime(new Date(toDateTime).toISOString())}</div>
                  <div className="text-sm text-gray-800">To • {toDow}</div>
                </div>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <div className="text-xl font-semibold text-gray-900">
                    {abs(diff.totalDays).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-800">Total Days</div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg text-center">
                  <div className="text-xl font-semibold text-gray-900">
                    {abs(diff.totalWeeks).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-800">Total Weeks</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <div className="text-xl font-semibold text-gray-900">
                    {abs(diff.totalHours).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-800">Total Hours</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <div className="text-xl font-semibold text-gray-900">
                    {abs(diff.totalMinutes).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-800">Total Minutes</div>
                </div>
              </div>

              {/* Live Countdown */}
              {countdownActive && (
                <div className="p-5 rounded-xl bg-indigo-50 border border-indigo-200">
                  <div className="text-sm text-indigo-700">Live Countdown to the “To” date</div>
                  <div className="mt-2 text-3xl font-bold text-indigo-900 tracking-wide">
                    {cdDays}d {pad2(cdHours)}h {pad2(cdMins)}m {pad2(cdSecs)}s
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 inline-flex items-center gap-2">
              <HistoryIcon className="w-5 h-5" /> History
            </h2>
            <button
              onClick={clearHistory}
              className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm"
            >
              Clear
            </button>
          </div>
          {history.length === 0 ? (
            <div className="text-gray-800">No history yet. Click “Save to History” after a calculation.</div>
          ) : (
            <div className="divide-y">
              {history.map((h) => (
                <div key={h.id} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="font-medium text-gray-900">
                      {fmtDateTime(h.fromISO)} → {fmtDateTime(h.toISO)}
                    </div>
                    <div className="text-sm text-gray-800">{h.summary}</div>
                    <div className="text-xs text-gray-500">Saved {fmtDateTime(h.createdAtISO)}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // Load this history back into inputs (convert ISO -> local datetime value)
                        const from = new Date(h.fromISO);
                        const to = new Date(h.toISO);
                        setFromDateTime(toLocalDateTimeValue(from));
                        setToDateTime(toLocalDateTimeValue(to));
                        window?.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-800 text-white hover:bg-blue-700 text-sm"
                    >
                      Load
                    </button>
                  </div>
                </div>
              ))}
            </div> 
          )}
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators currentPath="/date-difference" category="date-time-tools" />
      </div>
    </>
  );
};

export default DateDifferencePro;

/* =========================================================
   APPENDED ENHANCEMENTS (Option A): keep original intact
   Sleek, minimal aesthetic. No code above was modified.
   ========================================================= */

// Ensure 'countdownActive' exists so main countdown block renders safely.
// Using 'var' ensures declaration is hoisted at module evaluation time.
var countdownActive = true;

// Inject subtle, sleek styles for buttons we add and for completed rows.
(function injectMinimalStyles() {
  if (typeof document === "undefined") return;
  const style = document.createElement("style");
  style.setAttribute("data-extra-styles", "date-diff-enhance");
  style.textContent = `
    .ddp-btn {
      @apply px-3 py-1.5 rounded-lg text-sm transition-all;
    }
    .ddp-btn-edit { @apply bg-blue-700 text-white hover:bg-blue-600 shadow-sm; }
    .ddp-btn-del { @apply bg-red-700 text-white hover:bg-red-600 shadow-sm; }
    .ddp-chip {
      @apply inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border;
    }
    .ddp-chip-live { @apply bg-slate-50 border-slate-200 text-slate-700; }
    .ddp-complete { @apply bg-green-100; }
    .ddp-row { @apply rounded-lg px-3 py-2 transition-colors; }
  `;
  document.head.appendChild(style);
})();

/**
 * Attach Edit/Delete buttons & live countdown to history rows without touching React code.
 * We rely on the fact that the visual order of rows matches the order in LS_KEY items.
 */
(function enhanceHistoryWithControlsAndCountdown() {
  if (typeof window === "undefined") return;

  const LS_KEY_LOCAL = "dateDiffHistory_v2";

  const readHistory = () => {
    try {
      const raw = localStorage.getItem(LS_KEY_LOCAL);
      return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
    } catch { return []; }
  };

  const saveHistory = (items: HistoryItem[]) => {
    try {
      localStorage.setItem(LS_KEY_LOCAL, JSON.stringify(items.slice(0, 20)));
    } catch {}
  };

  const fmtRemain = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  };

  // Find history list container after React renders.
  const setup = () => {
    const root = document.querySelector('[class*="divide-y"]');
    if (!root) return false;

    const rows = Array.from(root.querySelectorAll(":scope > div"));
    if (!rows.length) return false;

    const history = readHistory();

    rows.forEach((row, idx) => {
      row.classList.add("ddp-row");
      const record = history[idx];
      if (!record) return;

      // Create countdown chip container
      let chip = row.querySelector<HTMLSpanElement>('[data-ddp="chip"]');
      if (!chip) {
        chip = document.createElement("span");
        chip.dataset.ddp = "chip";
        chip.className = "ddp-chip ddp-chip-live mt-1";
        chip.textContent = "0d 00h 00m 00s";
        // Place under the "Saved ..." line if possible
        const textBlocks = row.querySelectorAll("div");
        if (textBlocks.length) {
          textBlocks[0].appendChild(chip);
        } else {
          row.appendChild(chip);
        }
      }

      // Add actions area to the right (beside existing "Load" button)
      let actionsHost = row.querySelector<HTMLDivElement>('[data-ddp="actions"]');
      if (!actionsHost) {
        actionsHost = document.createElement("div");
        actionsHost.dataset.ddp = "actions";
        actionsHost.className = "flex gap-2 mt-2 md:mt-0";
        // Find the button container (the one that contains the 'Load' button)
        const buttonContainers = row.querySelectorAll("div");
        let rightSide = buttonContainers[buttonContainers.length - 1];
        // Make sure we append inside the right side where buttons live
        if (rightSide) rightSide.appendChild(actionsHost);
        else row.appendChild(actionsHost);
      }

      // Add Edit button (clicks the existing 'Load' button to reuse original logic)
      if (!actionsHost.querySelector('[data-ddp="edit"]')) {
        const editBtn = document.createElement("button");
        editBtn.dataset.ddp = "edit";
        editBtn.className = "ddp-btn ddp-btn-edit";
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => {
          const loadBtn = Array.from(row.querySelectorAll("button"))
            .find((b) => b.textContent && b.textContent.trim().toLowerCase() === "load");
          if (loadBtn) (loadBtn as HTMLButtonElement).click();
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
        actionsHost.appendChild(editBtn);
      }

      // Add Delete button
      if (!actionsHost.querySelector('[data-ddp="delete"]')) {
        const delBtn = document.createElement("button");
        delBtn.dataset.ddp = "delete";
        delBtn.className = "ddp-btn ddp-btn-del";
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", () => {
          const next = readHistory().filter((h) => h.id !== record.id);
          saveHistory(next);
          // Remove DOM row for immediate feedback (React will reconcile on next render/page nav)
          row.remove();
        });
        actionsHost.appendChild(delBtn);
      }
    });

    // Start a single interval that updates all chips each second
    const tick = () => {
      const history = readHistory();
      const now = Date.now();
      rows.forEach((row, idx) => {
        const record = history[idx];
        const chip = row.querySelector<HTMLSpanElement>('[data-ddp="chip"]');
        if (!record || !chip) return;
        const remain = new Date(record.toISO).getTime() - now;
        const done = remain <= 0;
        chip.textContent = done ? "Completed" : `${fmtRemain(remain)} remaining`;
        if (done) {
          row.classList.add("ddp-complete");
        } else {
          row.classList.remove("ddp-complete");
        }
      });
    };

    tick();
    const interval = setInterval(tick, 1000);

    // Watch for React updates and re-run setup when list changes
    const mo = new MutationObserver(() => {
      // Recompute rows if children change (e.g., after deletion)
      clearInterval(interval);
      setup();
    });
    mo.observe(root, { childList: true });

    // Return true to stop polling
    return true;
  };

  // Poll until the history list is present, then setup once.
  const poll = () => {
    if (setup()) return;
    setTimeout(poll, 250);
  };
  if (document.readyState === "complete" || document.readyState === "interactive") {
    poll();
  } else {
    window.addEventListener("DOMContentLoaded", poll);
  }
})();

// The appended code above adds features without altering the original component.
// It keeps the UI sleek/minimal while enabling per-row countdowns, edit, and delete.
