// src/pages/CountdownTimer.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Hourglass,
  AlarmClock,
  History as HistoryIcon,
  RotateCcw,
  Trash2,
  Copy,
  Info,
  Bell,
  BellOff,
  FileDown,
  Edit3,
} from "lucide-react";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import AdBanner from "../components/AdBanner";
import RelatedCalculators from "../components/RelatedCalculators";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

/* ----------------------- UI tokens (reuse your system) ---------------------- */
const btn =
  "inline-flex items-center gap-2 rounded-xl px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed";
const btnPrimary =
  "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30";
const btnNeutral =
  "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600";
const btnGhost =
  "bg-transparent hover:bg-slate-800/60 text-slate-200 border border-slate-700";

const card =
  "rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/60 border border-slate-700/70 backdrop-blur p-6";

const labelCls = "block text-sm font-medium text-slate-200 mb-2";
const inputCls =
  "w-full px-3 py-2 bg-slate-800/70 text-white rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500";
const smallMono = "mt-2 text-xs text-slate-400 font-mono break-all";

/* ------------------------------ Types/Storage ------------------------------- */
type TimerItem = {
  id: string;
  targetISO: string;
  createdAtISO: string;
  title?: string;
  description?: string;
  sound?: boolean;
};

const LS_KEY = "countdownTimers_v1";

/* --------------------------------- Utils ----------------------------------- */
const isValidInput = (iso: string) => {
  if (!iso) return false;
  const d = new Date(iso);
  return !Number.isNaN(d.getTime());
};

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const pad2 = (n: number) => String(Math.abs(n)).padStart(2, "0");

const msToParts = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { days, hours, minutes, seconds };
};

const labelFromMs = (ms: number) => {
  const { days, hours, minutes, seconds } = msToParts(ms);
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  parts.push(`${pad2(hours)}h`, `${pad2(minutes)}m`, `${pad2(seconds)}s`);
  return parts.join(" ");
};

const toLocalDateTimeValue = (d: Date) => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  const h = `${d.getHours()}`.padStart(2, "0");
  const min = `${d.getMinutes()}`.padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
};

const loadTimers = (): TimerItem[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as TimerItem[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};
const saveTimers = (items: TimerItem[]) =>
  localStorage.setItem(LS_KEY, JSON.stringify(items.slice(0, 50)));

/* ----------------------------- Simple PDF export ---------------------------- */
async function exportPDF(timers: TimerItem[]) {
  try {
    const mod = await import("jspdf");
    const { jsPDF } = mod as any;
    const doc = new jsPDF();
    let y = 14;
    doc.setFontSize(16);
    doc.text("Countdown Timers", 14, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(`Exported: ${fmtDateTime(new Date().toISOString())}`, 14, y);
    y += 10;

    if (!timers.length) {
      doc.text("No timers saved.", 14, y);
    } else {
      timers.forEach((t, i) => {
        const row1 = `${i + 1}. ${t.title || "(untitled)"}  →  ${fmtDateTime(
          t.targetISO
        )}`;
        const row2 = t.description ? `   ${t.description}` : "";
        if (y > 280) {
          doc.addPage();
          y = 14;
        }
        doc.text(row1, 14, y);
        y += 6;
        if (row2) {
          doc.text(row2, 14, y);
          y += 6;
        }
      });
    }
    doc.save("countdown-timers.pdf");
  } catch {
    alert("PDF export failed. Make sure 'jspdf' is installed.");
  }
}

/* ------------------------------- Page Component ----------------------------- */
const CountdownTimer: React.FC = () => {
  // Live clock
  const [nowISO, setNowISO] = useState<string>(() => new Date().toISOString());
  useEffect(() => {
    const id = setInterval(() => setNowISO(new Date().toISOString()), 1000);
    return () => clearInterval(id);
  }, []);

  // Current timer form
  const [targetISO, setTargetISO] = useState<string>(() =>
    toLocalDateTimeValue(new Date(Date.now() + 60 * 60 * 1000))
  );
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [playSound, setPlaySound] = useState<boolean>(true);

  // Saved timers
  const [timers, setTimers] = useState<TimerItem[]>(() => loadTimers());

  // Audio ref for “ding”
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const nowTs = useMemo(() => new Date(nowISO).getTime(), [nowISO]);

  const currentRemainingMs = useMemo(() => {
    if (!isValidInput(targetISO)) return 0;
    const tgt = new Date(targetISO).getTime();
    return Math.max(0, tgt - nowTs);
  }, [targetISO, nowTs]);

  const currentLabel = useMemo(
    () => (currentRemainingMs > 0 ? labelFromMs(currentRemainingMs) : "Completed"),
    [currentRemainingMs]
  );

  // Fire sound for any saved timer that just finished
  const lastStateRef = useRef<Record<string, number>>({});
  useEffect(() => {
    timers.forEach((t) => {
      const tgt = new Date(t.targetISO).getTime();
      const remaining = tgt - nowTs;
      const prev = lastStateRef.current[t.id] ?? remaining;
      lastStateRef.current[t.id] = remaining;

      if (prev > 0 && remaining <= 0 && t.sound) {
        // just crossed zero
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(t.title || "Timer done", {
            body: `Completed at ${fmtDateTime(t.targetISO)}`,
          });
        }
      }
    });
  }, [timers, nowTs]);

  const saveTimer = () => {
    if (!isValidInput(targetISO)) return;
    const item: TimerItem = {
      id: `${Date.now()}`,
      targetISO: new Date(targetISO).toISOString(),
      createdAtISO: new Date().toISOString(),
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      sound: playSound,
    };
    const next = [item, ...timers].slice(0, 50);
    setTimers(next);
    saveTimers(next);
    // clear inputs (title/description) but keep target so user sees it ticking
    setTitle("");
    setDescription("");
  };

  const deleteTimer = (id: string) => {
    const next = timers.filter((t) => t.id !== id);
    setTimers(next);
    saveTimers(next);
  };

  const requestNotify = () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  };

  /* ---------------------------------- UI ----------------------------------- */
  return (
    <>
      <SEOHead
        title={
          seoData?.countdown?.title ??
          "Countdown Timer – Live Countdown with History, Alerts & PDF"
        }
        description={
          seoData?.countdown?.description ??
          "Create a live countdown to any date/time. Titles, descriptions, sound alert, browser notifications, and saved history. Free and private."
        }
        canonical="https://calculatorhub.site/countdown-timer"
        schemaData={generateCalculatorSchema(
          "Countdown Timer",
          seoData?.countdown?.description ??
            "Live countdown with titles, notes, sound alert, notifications, and history.",
          "/countdown-timer",
          seoData?.countdown?.keywords ?? [
            "countdown timer",
            "event countdown",
            "date countdown",
            "deadline timer",
            "reminder timer",
          ]
        )}
        breadcrumbs={[
          { name: "Date & Time Tools", url: "/category/date-time-tools" },
          { name: "Countdown Timer", url: "/countdown-timer" },
        ]}
        // Optional OG/Twitter handled globally by your SEOHead if desired
      />

      {/* lightweight sound asset (data URI single beep) */}
      <audio
        ref={audioRef}
        preload="auto"
        src="data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAA..."
      />

      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <Breadcrumbs
          items={[
            { name: "Date & Time Tools", url: "/category/date-time-tools" },
            { name: "Countdown Timer", url: "/countdown-timer" },
          ]}
        />

        {/* Header */}
        <div className="mb-6 md:mb-8 px-1">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-blue-600/30 blur-lg" />
              <div className="relative rounded-2xl bg-blue-600/10 p-3 border border-blue-500/40">
                <Hourglass className="h-7 w-7 text-blue-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Countdown Timer</h1>
              <p className="text-slate-300 text-sm md:text-base">
                Create a live countdown to any date/time. Add a title & description, save to history, and get an optional alert.
              </p>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left: Setup */}
          <section className={card} aria-label="Create countdown">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <AlarmClock /> New Countdown
            </h2>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={labelCls}>Target Date &amp; Time</label>
                <input
                  type="datetime-local"
                  className={inputCls}
                  value={targetISO}
                  onChange={(e) => setTargetISO(e.target.value)}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Current time: {fmtDateTime(nowISO)}
                </p>
              </div>

              <div>
                <label className={labelCls}>Title (optional)</label>
                <input
                  type="text"
                  className={inputCls}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Project Launch"
                />
              </div>

              <div>
                <label className={labelCls}>Description (optional)</label>
                <textarea
                  rows={3}
                  className={inputCls}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details or notes for this countdown"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPlaySound((s) => !s)}
                  className={`${btn} ${btnGhost}`}
                  title={playSound ? "Sound on" : "Sound off"}
                >
                  {playSound ? <Bell size={16} /> : <BellOff size={16} />} Sound
                </button>
                {"Notification" in window && (
                  <button onClick={requestNotify} className={`${btn} ${btnGhost}`}>
                    Enable Browser Notifications
                  </button>
                )}
              </div>

              <div className="rounded-xl bg-white/10 p-5 border border-white/10 text-center">
                <div className="text-slate-300 text-sm">Time Remaining</div>
                <div className="mt-1 text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                  {currentLabel}
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(currentLabel)}
                    className={`${btn} ${btnNeutral}`}
                  >
                    <Copy size={16} /> Copy
                  </button>
                  <button
                    onClick={() => {
                      setTargetISO(toLocalDateTimeValue(new Date(Date.now() + 3600_000)));
                      setTitle("");
                      setDescription("");
                      setPlaySound(true);
                    }}
                    className={`${btn} ${btnGhost}`}
                  >
                    <RotateCcw size={16} /> Reset
                  </button>
                  <button onClick={saveTimer} className={`${btn} ${btnPrimary}`}>
                    <HistoryIcon size={16} /> Save to History
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Right: Tips / SEO snippet */}
          <section className={card} aria-label="How it works">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-3">How it Works</h2>
            <ol className="list-decimal ml-5 space-y-2 text-slate-200">
              <li>Set the target date &amp; time.</li>
              <li>Optionally add a title and description.</li>
              <li>Click <em>Save to History</em> to keep a live, persistent countdown.</li>
            </ol>
            <p className="text-slate-300 mt-3">
              Need date math instead? Try{" "}
              <a href="/date-difference" className="text-blue-300 underline hover:text-blue-200">
                Date Difference
              </a>{" "}
              or{" "}
              <a href="/time-add-subtract" className="text-blue-300 underline hover:text-blue-200">
                Time Add/Subtract
              </a>
              .
            </p>

            <div className="mt-5 rounded-xl bg-white/5 p-4 border border-white/10">
              <p className="text-slate-200 font-medium flex items-center gap-2">
                <Info size={16} /> Notes
              </p>
              <ul className="list-disc list-inside text-slate-300 text-sm mt-2 space-y-1">
                <li>Sound plays and notifications appear right when a saved timer completes (if permitted).</li>
                <li>All data stays in your browser (localStorage).</li>
              </ul>
            </div>
          </section>
        </div>

        {/* History */}
        <section className="mt-8 bg-white/5 rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white inline-flex items-center gap-2">
              <HistoryIcon className="w-5 h-5" /> Saved Timers
            </h2>
            <div className="flex items-center gap-2">
              <button
                className={`${btn} ${btnGhost}`}
                onClick={() => exportPDF(timers)}
                title="Export PDF"
              >
                <FileDown size={16} /> Export PDF
              </button>
              <button
                className={`${btn} ${btnGhost}`}
                onClick={() => {
                  setTimers([]);
                  saveTimers([]);
                }}
                title="Clear all"
              >
                <Trash2 size={16} /> Clear
              </button>
            </div>
          </div>

          {timers.length === 0 ? (
            <div className="text-slate-300">No timers yet. Save the current countdown to keep it here.</div>
          ) : (
            <div className="space-y-2">
              {timers.map((t) => {
                const tgt = new Date(t.targetISO).getTime();
                const remaining = Math.max(0, tgt - nowTs);
                const completed = remaining <= 0;
                return (
                  <div
                    key={t.id}
                    className={`py-3 px-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-lg border ${
                      completed ? "bg-green-100 border-green-200" : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {t.title || "(untitled)"} • {fmtDateTime(t.targetISO)}
                      </div>
                      {t.description && <div className="text-sm text-gray-800">{t.description}</div>}
                      <div className="text-xs text-gray-500">Saved {fmtDateTime(t.createdAtISO)}</div>
                      {!completed && (
                        <div className="text-sm font-semibold text-indigo-700 mt-1">
                          {labelFromMs(remaining)} remaining
                        </div>
                      )}
                      {completed && <div className="text-sm font-semibold text-green-700 mt-1">Completed</div>}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          // load into editor
                          setTargetISO(toLocalDateTimeValue(new Date(t.targetISO)));
                          setTitle(t.title || "");
                          setDescription(t.description || "");
                          setPlaySound(!!t.sound);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`${btn} bg-blue-800 text-white hover:bg-blue-700`}
                        title="Edit"
                      >
                        <Edit3 size={16} /> Edit
                      </button>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(
                            `${t.title || "Countdown"} → ${fmtDateTime(t.targetISO)}`
                          )
                        }
                        className={`${btn} ${btnNeutral}`}
                        title="Copy"
                      >
                        <Copy size={16} /> Copy
                      </button>
                      <button
                        onClick={() => deleteTimer(t.id)}
                        className={`${btn} bg-red-700 text-white hover:bg-red-600`}
                        title="Delete"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <AdBanner />

        {/* SEO content */}
        <div className="rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">About Countdown Timer</h2>
          <p className="text-slate-300">
            Track launches, exams, events, invoices, and more with a precise, privacy-friendly countdown. Add titles,
            notes, save multiple timers, and get notified at completion. For calendar math, try the{" "}
            <a href="/date-difference" className="text-blue-300 underline hover:text-blue-200">
              Date Difference Calculator
            </a>{" "}
            or{" "}
            <a href="/business-days-calculator" className="text-blue-300 underline hover:text-blue-200">
              Business Days Calculator
            </a>
            .
          </p>

          {/* Minimal FAQ + JSON-LD parity */}
          <div className="space-y-3 mt-6">
            <div className="bg-slate-800/60 p-4 rounded-lg">
              <p className="font-medium text-white flex items-center gap-2">
                <Info size={16} /> Do timers work offline?
              </p>
              <p className="text-slate-300">
                Yes—everything runs locally in your browser, and saved timers persist via localStorage.
              </p>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-lg">
              <p className="font-medium text-white flex items-center gap-2">
                <Info size={16} /> Will I get an alert when it completes?
              </p>
              <p className="text-slate-300">
                If sound is enabled, you’ll hear a chime. Browser notifications are also supported (grant permission first).
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
                      "name": "Do timers work offline?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes—everything runs locally in your browser, and saved timers persist via localStorage."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Will I get an alert when it completes?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "If sound is enabled, you’ll hear a chime. Browser notifications are also supported (grant permission first)."
                      }
                    }
                  ]
                }),
              }}
            />
          </div>
        </div>

        <RelatedCalculators currentPath="/countdown-timer" category="date-time-tools" />
      </div>
    </>
  );
};

export default CountdownTimer;
