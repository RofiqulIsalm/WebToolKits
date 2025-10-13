import React, { useEffect, useMemo, useState } from "react";
import {
  Globe2,
  SwapHorizontal,
  Copy,
  Star,
  Trash2,
  History as HistoryIcon,
  RotateCcw,
  FileDown,
  Info,
  Clock,
} from "lucide-react";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import AdBanner from "../components/AdBanner";
import RelatedCalculators from "../components/RelatedCalculators";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

/* ----------------------- design system tokens (yours) ---------------------- */
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

type HistoryItem = {
  id: string;
  fromTz: string;
  toTz: string;
  inputLocalISOMinute: string; // the entered wall time (YYYY-MM-DDTHH:mm)
  createdAtISO: string;
  title?: string;
  description?: string;
  resultISO: string; // UTC ISO
};

const LS_HIST = "tzHistory_v1";
const LS_FAVS = "tzFavs_v1";

/* --------------------------------- TZ utils -------------------------------- */

/** Get browser-supported IANA list */
const supportedTZ =
  (Intl as any).supportedValuesOf?.("timeZone") ??
  // Fallback: a lean popular subset
  [
    "UTC",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Madrid",
    "Europe/Rome",
    "Europe/Warsaw",
    "Europe/Moscow",
    "Africa/Johannesburg",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Shanghai",
    "Asia/Tokyo",
    "Asia/Singapore",
    "Australia/Sydney",
    "Pacific/Auckland",
    "America/St_Johns",
    "America/Halifax",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Anchorage",
    "Pacific/Honolulu",
    "America/Sao_Paulo",
    "America/Mexico_City",
  ];

/** Parse "GMT+05:30" → minutes offset (+330). Works on modern browsers. */
function getOffsetMinutes(tz: string, whenUTC: Date): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    timeZoneName: "shortOffset",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = fmt.formatToParts(whenUTC);
  const name = parts.find((p) => p.type === "timeZoneName")?.value || "UTC+00";
  // Examples: "GMT+5", "GMT+05:30", "UTC−03:00"
  const m = name.match(/([+-−])(\d{1,2})(?::?(\d{2}))?/);
  if (!m) return 0;
  const sign = m[1] === "-" || m[1] === "−" ? -1 : 1;
  const h = parseInt(m[2], 10);
  const mins = m[3] ? parseInt(m[3], 10) : 0;
  return sign * (h * 60 + mins);
}

/**
 * Convert a local wall time in a given IANA zone to epoch ms (UTC).
 * Handles DST using an iterative offset refine.
 * inputLocal: "YYYY-MM-DDTHH:mm"
 */
function zonedWallToUTCms(inputLocal: string, timeZone: string): number {
  // Treat local as if "naive": build an initial UTC guess
  const [dPart, tPart] = inputLocal.split("T");
  const [y, m, d] = dPart.split("-").map((n) => parseInt(n, 10));
  const [hh, mm] = (tPart || "00:00").split(":").map((n) => parseInt(n, 10));
  let guessUTC = Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0);

  // Iterate: compute offset at guess → refine UTC = local - offset
  for (let i = 0; i < 3; i++) {
    const offMin = getOffsetMinutes(timeZone, new Date(guessUTC));
    const refined = Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0) - offMin * 60_000;
    if (Math.abs(refined - guessUTC) < 1000) {
      guessUTC = refined;
      break;
    }
    guessUTC = refined;
  }
  return guessUTC;
}

/** Format a UTC date in a target zone, nice label with weekday + offset. */
function formatInZone(utcISO: string, timeZone: string) {
  const d = new Date(utcISO);
  const fmt = new Intl.DateTimeFormat(undefined, {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return fmt.format(d);
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ---------------------------------- Page ----------------------------------- */

const TimeZoneConverter: React.FC = () => {
  const localTZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  // form state
  const [fromTz, setFromTz] = useState<string>(localTZ);
  const [toTz, setToTz] = useState<string>("UTC");
  const [localInput, setLocalInput] = useState<string>(() => {
    // default now rounded to minutes
    const d = new Date();
    d.setSeconds(0, 0);
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    const hh = `${d.getHours()}`.padStart(2, "0");
    const mm = `${d.getMinutes()}`.padStart(2, "0");
    return `${y}-${m}-${day}T${hh}:${mm}`;
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // favorites + history
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(LS_FAVS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const raw = localStorage.getItem(LS_HIST);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // compute conversion
  const resultUTCms = useMemo(() => {
    try {
      return zonedWallToUTCms(localInput, fromTz);
    } catch {
      return NaN;
    }
  }, [localInput, fromTz]);

  const resultISO = useMemo(() => new Date(resultUTCms).toISOString(), [resultUTCms]);

  const resultInFrom = useMemo(
    () => (Number.isNaN(resultUTCms) ? "—" : formatInZone(resultISO, fromTz)),
    [resultUTCms, resultISO, fromTz]
  );
  const resultInTo = useMemo(
    () => (Number.isNaN(resultUTCms) ? "—" : formatInZone(resultISO, toTz)),
    [resultUTCms, resultISO, toTz]
  );

  const swap = () => {
    setFromTz(toTz);
    setToTz(fromTz);
  };

  const copyStr = (text: string) => navigator.clipboard.writeText(text);

  const toggleFav = (tz: string) => {
    const next = favorites.includes(tz)
      ? favorites.filter((z) => z !== tz)
      : [...favorites, tz];
    setFavorites(next);
    localStorage.setItem(LS_FAVS, JSON.stringify(next.slice(0, 100)));
  };

  const saveToHistory = () => {
    if (!localInput || !fromTz || !toTz || Number.isNaN(resultUTCms)) return;
    const item: HistoryItem = {
      id: `${Date.now()}`,
      fromTz,
      toTz,
      inputLocalISOMinute: localInput,
      createdAtISO: new Date().toISOString(),
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      resultISO,
    };
    const next = [item, ...history].slice(0, 50);
    setHistory(next);
    localStorage.setItem(LS_HIST, JSON.stringify(next));
    // clean only title/description as you asked
    setTitle("");
    setDescription("");
  };

  const deleteHistory = (id: string) => {
    const next = history.filter((h) => h.id !== id);
    setHistory(next);
    localStorage.setItem(LS_HIST, JSON.stringify(next));
  };

  const exportPDF = async () => {
    try {
      const mod = await import("jspdf");
      const { jsPDF } = mod as any;
      const doc = new jsPDF();
      let y = 14;
      doc.setFontSize(16);
      doc.text("Time Zone Converter – History", 14, y);
      y += 8;
      doc.setFontSize(11);
      doc.text(`Exported: ${fmtDateTime(new Date().toISOString())}`, 14, y);
      y += 10;

      if (!history.length) {
        doc.text("No history.", 14, y);
      } else {
        history.forEach((h, i) => {
          const row1 = `${i + 1}. ${h.title || "(untitled)"}  •  ${h.fromTz} → ${
            h.toTz
          }  •  ${h.inputLocalISOMinute}`;
          const row2 = `Result: ${formatInZone(h.resultISO, h.toTz)}  (UTC ${new Date(
            h.resultISO
          ).toISOString().replace(".000Z", "Z")})`;
          const row3 = h.description ? `   ${h.description}` : "";
          if (y > 280) {
            doc.addPage();
            y = 14;
          }
          doc.text(row1, 14, y);
          y += 6;
          doc.text(row2, 14, y);
          y += row3 ? 6 : 4;
          if (row3) {
            doc.text(row3, 14, y);
            y += 4;
          }
          y += 2;
        });
      }
      doc.save("time-zone-history.pdf");
    } catch {
      alert("PDF export failed. Make sure 'jspdf' is installed.");
    }
  };

  /* ---------------------------------- UI ----------------------------------- */
  return (
    <>
      <SEOHead
        title={
          seoData?.timeZone?.title ??
          "Time Zone Converter – Convert Date & Time Across Time Zones (DST-aware)"
        }
        description={
          seoData?.timeZone?.description ??
          "Convert any date & time between world time zones with DST awareness. Swap zones, copy results, save with title/notes, and export history. Private & free."
        }
        canonical="https://calculatorhub.com/time-zone-converter"
        schemaData={generateCalculatorSchema(
          "Time Zone Converter",
          seoData?.timeZone?.description ??
            "Convert times across time zones with DST handling. Swap, copy, favorites, and saved history.",
          "/time-zone-converter",
          seoData?.timeZone?.keywords ?? [
            "time zone converter",
            "timezone converter",
            "convert time",
            "world clock",
            "DST converter",
          ]
        )}
        breadcrumbs={[
          { name: "Date & Time Tools", url: "/category/date-time-tools" },
          { name: "Time Zone Converter", url: "/time-zone-converter" },
        ]}
        openGraph={{
          title:
            "Time Zone Converter – Convert Date & Time Across Time Zones | CalculatorHub",
          description:
            "DST-aware time zone converter. Swap zones, copy results, favorites, and saved history.",
          url: "https://calculatorhub.com/time-zone-converter",
          type: "website",
          images: [
            {
              url: "https://calculatorhub.com/assets/time-zone-converter-og.jpg",
              width: 1200,
              height: 630,
              alt: "Time Zone Converter",
            },
          ],
        }}
      />

      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <Breadcrumbs
          items={[
            { name: "Date & Time Tools", url: "/category/date-time-tools" },
            { name: "Time Zone Converter", url: "/time-zone-converter" },
          ]}
        />

        {/* Header */}
        <div className="mb-6 md:mb-8 px-1">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-blue-600/30 blur-lg" />
              <div className="relative rounded-2xl bg-blue-600/10 p-3 border border-blue-500/40">
                <Globe2 className="h-7 w-7 text-blue-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Time Zone Converter
              </h1>
              <p className="text-slate-300 text-sm md:text-base">
                DST-aware conversion with swap, favorites, copy, and saved history.
              </p>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left: Converter */}
          <section className={card} aria-label="Converter">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock /> Convert Time
            </h2>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={labelCls}>From Time Zone</label>
                <div className="flex gap-2">
                  <select
                    className={inputCls}
                    value={fromTz}
                    onChange={(e) => setFromTz(e.target.value)}
                  >
                    {supportedTZ.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => toggleFav(fromTz)}
                    className={`${btn} ${btnGhost}`}
                    title={
                      favorites.includes(fromTz)
                        ? "Remove from favorites"
                        : "Save as favorite"
                    }
                  >
                    <Star
                      size={16}
                      className={
                        favorites.includes(fromTz) ? "text-yellow-400" : "text-slate-300"
                      }
                    />
                  </button>
                </div>
              </div>

              <div>
                <label className={labelCls}>Local Date &amp; Time in “From” Zone</label>
                <input
                  type="datetime-local"
                  className={inputCls}
                  value={localInput}
                  onChange={(e) => setLocalInput(e.target.value)}
                />
                <p className="text-xs text-slate-400 mt-1">
                  This is interpreted as wall time in <span className="font-mono">{fromTz}</span> (DST-aware).
                </p>
              </div>

              <div className="flex items-center justify-center">
                <button onClick={swap} className={`${btn} ${btnGhost}`}>
                  <SwapHorizontal size={16} /> Swap
                </button>
              </div>

              <div>
                <label className={labelCls}>To Time Zone</label>
                <div className="flex gap-2">
                  <select
                    className={inputCls}
                    value={toTz}
                    onChange={(e) => setToTz(e.target.value)}
                  >
                    {supportedTZ.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => toggleFav(toTz)}
                    className={`${btn} ${btnGhost}`}
                    title={
                      favorites.includes(toTz)
                        ? "Remove from favorites"
                        : "Save as favorite"
                    }
                  >
                    <Star
                      size={16}
                      className={
                        favorites.includes(toTz) ? "text-yellow-400" : "text-slate-300"
                      }
                    />
                  </button>
                </div>
              </div>

              {/* Results */}
              <div className="rounded-xl bg-white/10 p-5 border border-white/10">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-slate-300 text-sm">In {fromTz}</div>
                    <div className="text-white text-lg font-semibold mt-1">
                      {resultInFrom}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-300 text-sm">In {toTz}</div>
                    <div className="text-white text-lg font-semibold mt-1">
                      {resultInTo}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => copyStr(`${fromTz}: ${resultInFrom}`)}
                    className={`${btn} ${btnNeutral}`}
                  >
                    <Copy size={16} /> Copy From
                  </button>
                  <button
                    onClick={() => copyStr(`${toTz}: ${resultInTo}`)}
                    className={`${btn} ${btnNeutral}`}
                  >
                    <Copy size={16} /> Copy To
                  </button>
                  <button
                    onClick={() => {
                      setFromTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
                      setToTz("UTC");
                      const d = new Date();
                      d.setSeconds(0, 0);
                      const y = d.getFullYear();
                      const m = `${d.getMonth() + 1}`.padStart(2, "0");
                      const day = `${d.getDate()}`.padStart(2, "0");
                      const hh = `${d.getHours()}`.padStart(2, "0");
                      const mm = `${d.getMinutes()}`.padStart(2, "0");
                      setLocalInput(`${y}-${m}-${day}T${hh}:${mm}`);
                    }}
                    className={`${btn} ${btnGhost}`}
                  >
                    <RotateCcw size={16} /> Reset
                  </button>
                  <button onClick={saveToHistory} className={`${btn} ${btnPrimary}`}>
                    <HistoryIcon size={16} /> Save to History
                  </button>
                </div>
                <p className={smallMono}>
                  UTC: {new Date(resultISO).toISOString().replace(".000Z", "Z")}
                </p>
              </div>

              {/* Notes for saved history */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className={labelCls}>Title (optional)</label>
                  <input
                    className={inputCls}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., NYC meeting time"
                  />
                </div>
                <div>
                  <label className={labelCls}>Description (optional)</label>
                  <textarea
                    className={inputCls}
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Notes about this conversion"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Right: Favorites & Tips */}
          <section className={card} aria-label="Favorites & Tips">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-3 flex items-center gap-2">
              <Star className="text-yellow-400" /> Favorites
            </h2>

            {favorites.length === 0 ? (
              <p className="text-slate-300">
                Save any time zone via the ☆ buttons to keep it here.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {favorites.map((tz) => (
                  <button
                    key={tz}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-white/5 text-slate-200 hover:bg-white/10"
                    onClick={() => {
                      // quick-apply to the nearer selector (heuristic)
                      setToTz(tz);
                    }}
                  >
                    {tz}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 rounded-xl bg-white/5 p-4 border border-white/10">
              <p className="text-slate-200 font-medium flex items-center gap-2">
                <Info size={16} /> Tip
              </p>
              <p className="text-slate-300 text-sm mt-1">
                This converter interprets the input as local wall-time in the “From” zone,
                then applies real DST rules for that instant.
              </p>
            </div>
          </section>
        </div>

        {/* History */}
        <section className="mt-8 bg-white/5 rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white inline-flex items-center gap-2">
              <HistoryIcon className="w-5 h-5" /> History
            </h2>
            <div className="flex items-center gap-2">
              <button className={`${btn} ${btnGhost}`} onClick={exportPDF}>
                <FileDown size={16} /> Export PDF
              </button>
              <button
                className={`${btn} ${btnGhost}`}
                onClick={() => {
                  setHistory([]);
                  localStorage.setItem(LS_HIST, JSON.stringify([]));
                }}
              >
                <Trash2 size={16} /> Clear
              </button>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="text-slate-300">
              No history yet. Save a conversion to keep it here.
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="py-3 px-3 rounded-lg border bg-gray-50 border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {h.title || "(untitled)"} • {h.fromTz} → {h.toTz}
                    </div>
                    <div className="text-sm text-gray-800">
                      {h.inputLocalISOMinute} → {formatInZone(h.resultISO, h.toTz)}{" "}
                      <span className="text-gray-500">
                        (UTC {new Date(h.resultISO).toISOString().replace(".000Z", "Z")})
                      </span>
                    </div>
                    {h.description && (
                      <div className="text-sm text-gray-700 mt-1">{h.description}</div>
                    )}
                    <div className="text-xs text-gray-500">
                      Saved {fmtDateTime(h.createdAtISO)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          `${h.fromTz} → ${h.toTz}: ${formatInZone(h.resultISO, h.toTz)}`
                        )
                      }
                      className={`${btn} ${btnNeutral}`}
                    >
                      <Copy size={16} /> Copy
                    </button>
                    <button
                      onClick={() => deleteHistory(h.id)}
                      className={`${btn} bg-red-700 text-white hover:bg-red-600`}
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <AdBanner />

        {/* SEO content */}
        <div className="rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            About the Time Zone Converter
          </h2>
          <p className="text-slate-300">
            Convert meetings, launches, classes, or flights across regions with DST-aware
            accuracy. For date math, try the{" "}
            <a href="/date-difference" className="text-blue-300 underline hover:text-blue-200">
              Date Difference Calculator
            </a>{" "}
            or{" "}
            <a href="/business-days-calculator" className="text-blue-300 underline hover:text-blue-200">
              Business Days Calculator
            </a>
            .
          </p>

          <div className="space-y-3 mt-6">
            <div className="bg-slate-800/60 p-4 rounded-lg">
              <p className="font-medium text-white flex items-center gap-2">
                <Info size={16} /> Does it handle DST?
              </p>
              <p className="text-slate-300">
                Yes. The converter uses the browser’s IANA rules and computes the correct
                offset for the specific instant you enter.
              </p>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-lg">
              <p className="font-medium text-white flex items-center gap-2">
                <Info size={16} /> Are my conversions private?
              </p>
              <p className="text-slate-300">
                Everything runs locally in your browser. History is stored via
                localStorage and can be cleared anytime.
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
                      "name": "Does it handle DST?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text":
                          "Yes. The converter uses the browser’s IANA rules and computes the correct offset for the specific instant you enter."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Are my conversions private?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text":
                          "Everything runs locally in your browser. History is stored via localStorage and can be cleared anytime."
                      }
                    }
                  ]
                }),
              }}
            />
          </div>
        </div>

        <RelatedCalculators currentPath="/time-zone-converter" category="date-time-tools" />
      </div>
    </>
  );
};

export default TimeZoneConverter;
