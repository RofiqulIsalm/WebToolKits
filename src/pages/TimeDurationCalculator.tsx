// src/pages/TimeDurationCalculator.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Timer,
  Clock4,
  Plus,
  Minus,
  RotateCcw,
  Share2,
  Copy,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import RelatedCalculators from "../components/RelatedCalculators";
import { generateCalculatorSchema } from "../utils/seoData";

/* ============================================================
   📦 Constants & Utilities
   ============================================================ */
const LS_KEY = "time_duration_calc_v1";
const URL_KEY = "tdc";

type Extra = { id: string; label: string; sign: 1 | -1; hh: string; mm: string; ss: string };

const uid = () => Math.random().toString(36).slice(2, 8);
const two = (n: number) => String(n).padStart(2, "0");

const COMMON_ZONES: string[] = [
  "UTC","Asia/Dhaka","Asia/Kolkata","Asia/Dubai","Asia/Singapore","Asia/Tokyo",
  "Asia/Hong_Kong","Asia/Shanghai","Asia/Seoul","Europe/London","Europe/Paris",
  "Europe/Berlin","Europe/Madrid","Europe/Amsterdam","Europe/Rome","Europe/Stockholm",
  "Europe/Oslo","Europe/Copenhagen","Europe/Helsinki","Europe/Zurich","Africa/Cairo",
  "Africa/Johannesburg","America/New_York","America/Chicago","America/Denver",
  "America/Los_Angeles","America/Toronto","America/Mexico_City","America/Sao_Paulo",
  "Australia/Sydney","Australia/Melbourne","Pacific/Auckland",
];

/* ---- Timezone helpers (DST-aware) ---- */
function parseOffsetMinutesFromParts(str: string): number | null {
  const m = str.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
  if (!m) return null;
  const sign = m[1] === "-" ? -1 : 1;
  const hh = parseInt(m[2] || "0", 10);
  const mm = parseInt(m[3] || "0", 10);
  return sign * (hh * 60 + mm);
}
function getOffsetMinutes(timeZone: string, atUtc: Date): number | null {
  try {
    const s = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZoneName: "shortOffset",
    }).format(atUtc);
    const p = parseOffsetMinutesFromParts(s);
    if (p !== null) return p;
  } catch {}
  try {
    const s2 = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZoneName: "short",
    }).format(atUtc);
    const p2 = parseOffsetMinutesFromParts(s2);
    if (p2 !== null) return p2;
  } catch {}
  return null;
}
/** Interpret a wall-clock "YYYY-MM-DDTHH:mm" in a zone → UTC Date (refined 2 passes for DST) */
function interpretAsZonedUTC(localStr: string, timeZone: string): Date {
  const [datePart, timePart] = localStr.split("T");
  const [y, m, d] = datePart.split("-").map((n) => parseInt(n, 10));
  const [H, M] = (timePart || "00:00").split(":").map((n) => parseInt(n, 10));
  const refine = (guessUtcMs: number) => {
    const offsetMin = getOffsetMinutes(timeZone, new Date(guessUtcMs)) ?? 0;
    return Date.UTC(y, (m || 1) - 1, d || 1, H || 0, M || 0) - offsetMin * 60_000;
  };
  const wallUTC = Date.UTC(y, (m || 1) - 1, d || 1, H || 0, M || 0, 0, 0);
  const pass1 = refine(wallUTC);
  const pass2 = refine(pass1);
  return new Date(pass2);
}

/* ---- Duration helpers ---- */
function clampNum(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
function hmsToSeconds(hh: string, mm: string, ss: string) {
  const h = clampNum(parseInt(hh || "0"), 0, 999999);
  const m = clampNum(parseInt(mm || "0"), 0, 59);
  const s = clampNum(parseInt(ss || "0"), 0, 59);
  return h * 3600 + m * 60 + s;
}
function formatDHMS(totalSeconds: number) {
  const sign = totalSeconds < 0 ? "-" : "";
  let s = Math.abs(Math.trunc(totalSeconds));
  const days = Math.floor(s / 86400);
  s -= days * 86400;
  const hh = Math.floor(s / 3600);
  s -= hh * 3600;
  const mm = Math.floor(s / 60);
  s -= mm * 60;
  const ss = s;
  return {
    sign,
    days,
    hh: two(hh),
    mm: two(mm),
    ss: two(ss),
    label:
      (days ? `${sign}${days}d ` : sign) + `${two(hh)}:${two(mm)}:${two(ss)}${days ? "" : ""}`,
  };
}
const fmtPreview = (d: Date, tz: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "short",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);

/* ============================================================
   🧮 Component
   ============================================================ */
const TimeDurationCalculator: React.FC = () => {
  // Base zone
  const defaultZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Dhaka";
  const [zone, setZone] = useState<string>(defaultZone);

  // Start/End
  const now = new Date();
  const defaultStart = `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(
    now.getDate()
  )}T${two(now.getHours())}:${two(now.getMinutes())}`;
  const defaultEndDate = new Date(now.getTime() + 60 * 60 * 1000);
  const defaultEnd = `${defaultEndDate.getFullYear()}-${two(
    defaultEndDate.getMonth() + 1
  )}-${two(defaultEndDate.getDate())}T${two(defaultEndDate.getHours())}:${two(
    defaultEndDate.getMinutes()
  )}`;

  const [startLocal, setStartLocal] = useState<string>(defaultStart);
  const [endLocal, setEndLocal] = useState<string>(defaultEnd);
  const [useNowEnd, setUseNowEnd] = useState<boolean>(false);

  // Extra add/sub rows
  const [extras, setExtras] = useState<Extra[]>([
    { id: uid(), label: "Break", sign: -1, hh: "00", mm: "15", ss: "00" },
  ]);

  // UI
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [showSteps, setShowSteps] = useState<boolean>(false);
  const [activeTip, setActiveTip] = useState<number>(0);
  const [hydrated, setHydrated] = useState<boolean>(false);

  const isDefault =
    zone === defaultZone &&
    startLocal === defaultStart &&
    !useNowEnd &&
    extras.length === 1 &&
    extras[0].sign === -1 &&
    extras[0].hh === "00" &&
    extras[0].mm === "15" &&
    extras[0].ss === "00";

  /* 🔁 Load & persist */
  const applyState = (s: any) => {
    setZone(typeof s.zone === "string" ? s.zone : defaultZone);
    setStartLocal(typeof s.startLocal === "string" ? s.startLocal : defaultStart);
    setEndLocal(typeof s.endLocal === "string" ? s.endLocal : defaultEnd);
    setUseNowEnd(Boolean(s.useNowEnd));
    if (Array.isArray(s.extras)) {
      setExtras(
        s.extras.map((e: any) => ({
          id: e.id || uid(),
          label: String(e.label ?? ""),
          sign: e.sign === -1 ? -1 : 1,
          hh: two(parseInt(e.hh || "0")),
          mm: two(parseInt(e.mm || "0")),
          ss: two(parseInt(e.ss || "0")),
        }))
      );
    }
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const enc = params.get(URL_KEY);
      if (enc) {
        applyState(JSON.parse(atob(enc)));
        setHydrated(true);
        return;
      }
      const raw = localStorage.getItem(LS_KEY);
      if (raw) applyState(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const state = { zone, startLocal, endLocal, useNowEnd, extras };
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {}
  }, [hydrated, zone, startLocal, endLocal, useNowEnd, extras]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const url = new URL(window.location.href);
      if (isDefault) {
        url.searchParams.delete(URL_KEY);
      } else {
        const state = {
          zone,
          startLocal,
          endLocal,
          useNowEnd,
          extras: extras.map(({ label, sign, hh, mm, ss }) => ({ label, sign, hh, mm, ss })),
        };
        url.searchParams.set(URL_KEY, btoa(JSON.stringify(state)));
      }
      window.history.replaceState({}, "", url);
    } catch {}
  }, [hydrated, zone, startLocal, endLocal, useNowEnd, extras, isDefault]);

  /* 🧠 Core calculations */
  const startUTC: Date = useMemo(() => interpretAsZonedUTC(startLocal, zone), [startLocal, zone]);
  const endUTC: Date = useMemo(
    () => (useNowEnd ? new Date() : interpretAsZonedUTC(endLocal, zone)),
    [useNowEnd, endLocal, zone]
  );

  const baseSeconds = useMemo(() => (endUTC.getTime() - startUTC.getTime()) / 1000, [startUTC, endUTC]);

  const extrasSeconds = useMemo(
    () =>
      extras.reduce((sum, e) => {
        const sec = hmsToSeconds(e.hh, e.mm, e.ss);
        return sum + e.sign * sec;
        }, 0),
    [extras]
  );

  const totalSeconds = baseSeconds + extrasSeconds;

  const baseFmt = useMemo(() => formatDHMS(Math.max(0, Math.round(baseSeconds))), [baseSeconds]);
  const extraFmt = useMemo(() => formatDHMS(Math.round(extrasSeconds)), [extrasSeconds]);
  const totalFmt = useMemo(() => formatDHMS(Math.round(totalSeconds)), [totalSeconds]);

  const basePreview = useMemo(
    () => `${fmtPreview(startUTC, zone)} → ${fmtPreview(endUTC, zone)}`,
    [startUTC, endUTC, zone]
  );

  /* 💡 Tips */
  const tips = useMemo(
    () => [
      "Tip: The calculation respects Daylight Saving Time via your chosen timezone.",
      "Tip: Use extra rows to add breaks (negative) or buffer time (positive).",
      "Tip: Click “Now” to quickly set the end to the current moment.",
      "Tip: Share the link to restore this exact scenario.",
      "Tip: Copy results to paste into emails or reports.",
    ],
    []
  );
  useEffect(() => {
    const id = setInterval(() => setActiveTip((p) => (p + 1) % tips.length), 5000);
    return () => clearInterval(id);
  }, [tips.length]);

  /* 🔗 Actions */
  const copyResults = async () => {
    const lines = [
      "Time Duration Calculator",
      `Zone: ${zone}`,
      `Start: ${fmtPreview(startUTC, zone)}`,
      `End:   ${fmtPreview(endUTC, zone)}`,
      "",
      `Base duration:  ${baseFmt.label}`,
      `Extras total:   ${extraFmt.label}`,
      `——————————————`,
      `Total duration: ${totalFmt.label}`,
      "",
      ...(extras.length
        ? ["Extras:", ...extras.map((e) => ` • ${e.sign > 0 ? "+" : "-"} ${e.label || "Custom"} ${two(parseInt(e.hh||"0"))}:${two(parseInt(e.mm||"0"))}:${two(parseInt(e.ss||"0"))}`)]
        : []),
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    const state = {
      zone,
      startLocal,
      endLocal,
      useNowEnd,
      extras: extras.map(({ label, sign, hh, mm, ss }) => ({ label, sign, hh, mm, ss })),
    };
    url.searchParams.set(URL_KEY, btoa(JSON.stringify(state)));
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  const reset = () => {
    setZone(defaultZone);
    const n = new Date();
    const s = `${n.getFullYear()}-${two(n.getMonth() + 1)}-${two(n.getDate())}T${two(
      n.getHours()
    )}:${two(n.getMinutes())}`;
    const e = new Date(n.getTime() + 60 * 60 * 1000);
    const eStr = `${e.getFullYear()}-${two(e.getMonth() + 1)}-${two(e.getDate())}T${two(
      e.getHours()
    )}:${two(e.getMinutes())}`;
    setStartLocal(s);
    setEndLocal(eStr);
    setUseNowEnd(false);
    setExtras([{ id: uid(), label: "Break", sign: -1, hh: "00", mm: "15", ss: "00" }]);
    localStorage.removeItem(LS_KEY);
  };

  /* Extras handlers */
  const addExtra = (sign: 1 | -1) =>
    setExtras((xs) => [...xs, { id: uid(), label: sign > 0 ? "Buffer" : "Break", sign, hh: "00", mm: "05", ss: "00" }]);
  const removeExtra = (id: string) => setExtras((xs) => xs.filter((x) => x.id !== id));
  const updateExtra = (id: string, patch: Partial<Extra>) =>
    setExtras((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  /* ============================================================
     🎨 Render
     ============================================================ */
  return (
    <>
      <SEOHead
        title="Time Duration Calculator | Add, Subtract & Compare Durations"
        description="Calculate the exact time between two datetimes with timezone/DST support. Add or subtract extra durations, copy/share results."
        canonical="https://calculatorhub.site/time-duration-calculator"
        schemaData={[
          generateCalculatorSchema(
            "Time Duration Calculator",
            "Compute duration between two times with timezone support and extra add/sub durations.",
            "/time-duration-calculator",
            [
              "time duration calculator",
              "time between dates",
              "add subtract time",
              "DST safe time calc",
              "date and time",
            ]
          ),
          {
            "@context":"https://schema.org",
            "@type":"WebApplication",
            "name":"Time Duration Calculator – CalculatorHub",
            "url":"https://calculatorhub.site/time-duration-calculator",
            "applicationCategory":"UtilitiesApplication",
            "operatingSystem":"Web",
            "inLanguage":"en",
            "description":"Compute duration between Start and End with timezone/DST support and extras (breaks/buffers).",
            "image":[
              "https://calculatorhub.site/images/time-duration-hero.webp",
              "https://calculatorhub.site/images/time-duration-preview.webp"
            ],
            "publisher":{
              "@type":"Organization",
              "name":"CalculatorHub",
              "url":"https://calculatorhub.site",
              "logo":{"@type":"ImageObject","url":"https://calculatorhub.site/images/calculatorhub-logo.webp"}
            },
            "offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},
            "datePublished":"2025-11-13",
            "dateModified":"2025-11-13",
            "keywords":[
              "duration calculator","elapsed time","time math","time difference","timezone"
            ]
          },
          {
            "@context":"https://schema.org",
            "@type":"WebPage",
            "mainEntity":{
              "@type":"Article",
              "headline":"Time Duration Calculator — precise elapsed time with extras, zones & DST",
              "description":"Measure exact elapsed time between two date-times with IANA timezone and DST awareness, plus add/subtract extras.",
              "image":[
                "https://calculatorhub.site/images/time-duration-hero.webp",
                "https://calculatorhub.site/images/time-duration-preview.webp"
              ],
              "author":{"@type":"Organization","name":"CalculatorHub Tools Team"},
              "publisher":{
                "@type":"Organization",
                "name":"CalculatorHub",
                "logo":{"@type":"ImageObject","url":"https://calculatorhub.site/images/calculatorhub-logo.webp"}
              },
              "datePublished":"2025-11-13",
              "dateModified":"2025-11-13",
              "articleSection":[
                "What Is a Time Duration Calculator?",
                "Key Features",
                "How to Use",
                "Methods & Math",
                "Worked Examples",
                "Extras",
                "Timezones & DST",
                "FAQ"
              ],
              "inLanguage":"en",
              "url":"https://calculatorhub.site/time-duration-calculator",
              "keywords":["time duration","elapsed time","DST","timezone"]
            }
          },
          {
            "@context":"https://schema.org",
            "@type":"FAQPage",
            "mainEntity":[
              {
                "@type":"Question",
                "name":"Do you handle DST correctly?",
                "acceptedAnswer":{"@type":"Answer","text":"Yes. Start/End are interpreted in the chosen zone, converted to UTC instants, then subtracted."}
              },
              {
                "@type":"Question",
                "name":"Can totals be negative?",
                "acceptedAnswer":{"@type":"Answer","text":"If breaks/penalties exceed base time, totals can be negative; review your extras list."}
              },
              {
                "@type":"Question",
                "name":"How do I share my setup?",
                "acceptedAnswer":{"@type":"Answer","text":"Use Copy Link — the URL encodes timezone, Start/End, Now toggle, and extras."}
              }
            ]
          },
          {
            "@context":"https://schema.org",
            "@type":"BreadcrumbList",
            "itemListElement":[
              {"@type":"ListItem","position":1,"name":"Home","item":"https://calculatorhub.site/"},
              {"@type":"ListItem","position":2,"name":"Date & Time Tools","item":"https://calculatorhub.site/category/date-time-tools"},
              {"@type":"ListItem","position":3,"name":"Time Duration Calculator","item":"https://calculatorhub.site/time-duration-calculator"}
            ]
          },
          {
            "@context":"https://schema.org",
            "@type":"WebSite",
            "name":"CalculatorHub",
            "url":"https://calculatorhub.site",
            "potentialAction":{
              "@type":"SearchAction",
              "target":"https://calculatorhub.site/search?q={query}",
              "query-input":"required name=query"
            }
          },
          {
            "@context":"https://schema.org",
            "@type":"Organization",
            "name":"CalculatorHub",
            "url":"https://calculatorhub.site",
            "logo":"https://calculatorhub.site/images/calculatorhub-logo.webp"
          }
        ]}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Date & Time Tools", url: "/category/date-time-tools" },
            { name: "Time Duration Calculator", url: "/time-duration-calculator" },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">⏱️ Time Duration Calculator</h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Calculate the time between <strong>Start</strong> and <strong>End</strong> in any timezone (DST-aware).
            Add or subtract custom durations (breaks, buffers) and share the exact scenario.
          </p>
        </div>

        {/* Promo bar */}
        <div className="hidden sm:flex mt-6 mb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white rounded-lg shadow-lg p-4 items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-lg">Plan precisely, communicate clearly</p>
            <p className="text-sm text-indigo-100">Try our Timezone Converter and Age Calculator next!</p>
          </div>
          <Link
            to="/category/date-time-tools"
            className="bg-white text-indigo-700 font-semibold px-4 py-2 rounded-md hover:bg-indigo-50 transition"
          >
            Explore More
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 relative text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Timer className="h-5 w-5 text-sky-400" /> Inputs
              </h2>
              <button
                onClick={reset}
                className="flex items-center gap-1 text-sm text-slate-300 border border-[#334155] rounded-lg px-2 py-1 hover:bg-[#0f172a] hover:text-white transition"
                disabled={isDefault}
              >
                <RotateCcw className="h-4 w-4 text-indigo-400" /> Reset
              </button>
            </div>

            <div className="space-y-5">
              {/* Zone */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">Timezone</label>
                  <Info className="h-4 w-4 text-slate-400" title="We interpret Start/End as local time in this zone and handle DST automatically." />
                </div>
                <input
                  list="tz-list"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full bg-[#0f172a] text-white text-sm px-3 py-2 border border-[#334155] rounded-md focus:ring-2 focus:ring-indigo-500"
                />
                <datalist id="tz-list">
                  {[Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Dhaka", ...COMMON_ZONES].map((z) => (
                    <option key={z} value={z} />
                  ))}
                </datalist>
              </div>

              {/* Start */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Start</label>
                <input
                  type="datetime-local"
                  value={startLocal}
                  onChange={(e) => setStartLocal(e.target.value)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* End */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-300">End</label>
                  <div className="flex items-center gap-2">
                    <input
                      id="usenow"
                      type="checkbox"
                      checked={useNowEnd}
                      onChange={(e) => setUseNowEnd(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="usenow" className="text-sm text-slate-300">
                      Use current time
                    </label>
                  </div>
                </div>
                <input
                  type="datetime-local"
                  value={endLocal}
                  onChange={(e) => setEndLocal(e.target.value)}
                  disabled={useNowEnd}
                  className={`w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                    useNowEnd ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                />
                <p className="text-xs text-slate-400 mt-2">
                  Preview in <span className="text-indigo-300 font-medium">{zone}</span>:{" "}
                  <span className="text-slate-200">{basePreview}</span>
                </p>
              </div>

             
            </div>

            {/* Extras */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-200 mb-2">Add/Subtract Extra Durations</h3>
              <div className="space-y-3">
                {extras.map((e) => (
                  <div
                    key={e.id}
                    className="grid grid-cols-12 gap-2 items-center bg-[#0f172a] border border-[#334155] rounded-lg p-2"
                  >
                    <div className="col-span-2">
                      <select
                        value={e.sign}
                        onChange={(ev) => updateExtra(e.id, { sign: (parseInt(ev.target.value) as 1 | -1) })}
                        className="w-full bg-[#0b1220] text-white text-xs px-2 py-1 border border-[#334155] rounded-md"
                      >
                        <option value={1}>Add</option>
                        <option value={-1}>Sub</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        value={e.label}
                        onChange={(ev) => updateExtra(e.id, { label: ev.target.value })}
                        placeholder="Label (e.g., Break)"
                        className="w-full bg-[#0b1220] text-white text-xs px-2 py-1 border border-[#334155] rounded-md"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        value={e.hh}
                        onChange={(ev) => updateExtra(e.id, { hh: two(parseInt(ev.target.value || "0")) })}
                        type="number"
                        min={0}
                        placeholder="HH"
                        className="w-full bg-[#0b1220] text-white text-xs px-2 py-1 border border-[#334155] rounded-md"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        value={e.mm}
                        onChange={(ev) => updateExtra(e.id, { mm: two(parseInt(ev.target.value || "0")) })}
                        type="number"
                        min={0}
                        max={59}
                        placeholder="MM"
                        className="w-full bg-[#0b1220] text-white text-xs px-2 py-1 border border-[#334155] rounded-md"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        value={e.ss}
                        onChange={(ev) => updateExtra(e.id, { ss: two(parseInt(ev.target.value || "0")) })}
                        type="number"
                        min={0}
                        max={59}
                        placeholder="SS"
                        className="w-full bg-[#0b1220] text-white text-xs px-2 py-1 border border-[#334155] rounded-md"
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      <button
                        onClick={() => removeExtra(e.id)}
                        title="Remove item"
                        aria-label="Remove item"
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium
                                   border border-red-400/60 text-red-300
                                   hover:text-white hover:bg-red-600 hover:border-red-600
                                   active:bg-red-700
                                   focus:outline-none focus:ring-2 focus:ring-red-400/60
                                   transition"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => addExtra(1)}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-xs"
                >
                  <Plus size={14} /> Add Buffer
                </button>
                <button
                  onClick={() => addExtra(-1)}
                  className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-md text-xs"
                >
                  <Minus size={14} /> Add Break
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">Results</h2>

            {/* Primary card */}
            <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
              <Clock4 className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{totalFmt.label}</div>
              <div className="text-sm text-slate-400">Total Duration</div>
            </div>

            {/* Tiles */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Stat label="Base Duration" value={baseFmt.label} />
              <Stat label="Extras Total" value={`${extraFmt.label}`} />
              <Stat label="Days" value={`${totalFmt.sign}${totalFmt.days}`} />
              <Stat label="H:M:S" value={`${totalFmt.hh}:${totalFmt.mm}:${totalFmt.ss}`} />
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={copyResults}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm"
              >
                <Copy size={16} /> Copy Results
              </button>
              <button
                onClick={copyShareLink}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm"
              >
                <Share2 size={16} /> Copy Link
              </button>
              {copied !== "none" && (
                <span className="text-emerald-400 text-sm">
                  {copied === "results" ? "Results copied!" : "Link copied!"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Smart Tip */}
        <div className="mt-4 w-full relative">
          <div className="bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm min-h-[50px] w-full flex items-center">
            <div className="mr-3 flex items-center justify-center w-8 h-8">
              <span className="text-2xl text-indigo-400">💡</span>
            </div>
            <div className="w-full">
              <p className="text-base font-medium leading-snug text-slate-300">{tips[activeTip]}</p>
            </div>
          </div>
        </div>

        {/* Steps (collapsible) */}
        <div className="mt-10 bg-gradient-to-br from-[#1e293b] via-[#111827] to-[#0f172a] rounded-2xl border border-indigo-600/40 shadow-xl overflow-hidden">
          <button
            onClick={() => setShowSteps((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold text-lg tracking-wide hover:opacity-90 transition-all"
          >
            <span>🧩 How this is calculated</span>
            {showSteps ? <ChevronUp /> : <ChevronDown />}
          </button>

          {showSteps && (
            <div className="px-6 pb-8 pt-4 space-y-3 text-slate-200">
              <ol className="list-decimal list-inside space-y-1">
                <li>Interpret Start and End as <strong>local time in {zone}</strong> (DST-aware) → convert to UTC.</li>
                <li>Base duration = End(UTC) − Start(UTC).</li>
                <li>Convert each extra HH:MM:SS row to seconds (Add = +, Sub = −) and sum.</li>
                <li>Total duration = Base + Extras; then show breakdown as (days • HH:MM:SS).</li>
              </ol>
              <p className="text-slate-300 text-sm">
                For long spans across DST shifts, using the timezone keeps your wall-clock intent correct.
              </p>
              <div className="h-2 w-full mt-6 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 blur-[2px]" />
            </div>
          )}
        </div>

        {/* ===================== SEO Content (~1800–2000 words) ===================== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
        
          {/* ===== Table of Contents ===== */}
          <nav className="mt-2 mb-10 bg-[#0b1220] border border-[#1f2a44] rounded-xl p-5 text-slate-200">
            <h2 className="text-lg font-semibold text-gray-100 mb-3">📖 Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><a href="#what-is-tdc" className="text-indigo-300 hover:underline">What Is a Time Duration Calculator?</a></li>
              <li><a href="#features" className="text-indigo-300 hover:underline">Key Features</a></li>
              <li><a href="#how-to-use" className="text-indigo-300 hover:underline">How to Use</a></li>
              <li><a href="#methods" className="text-indigo-300 hover:underline">Methods & Math Under the Hood</a></li>
              <li><a href="#worked-examples" className="text-indigo-300 hover:underline">Worked Examples</a></li>
              <li><a href="#extras" className="text-indigo-300 hover:underline">Adding & Subtracting Extras (Breaks/Buffers)</a></li>
              <li><a href="#timezone" className="text-indigo-300 hover:underline">Time Zones, DST & Wall-Clock Intent</a></li>
              <li><a href="#performance" className="text-indigo-300 hover:underline">Performance, Precision & Limits</a></li>
              <li><a href="#pitfalls" className="text-indigo-300 hover:underline">Common Pitfalls & How to Avoid Them</a></li>
              <li><a href="#use-cases" className="text-indigo-300 hover:underline">Where Duration Math Matters in Real Life</a></li>
              <li><a href="#quick-ref" className="text-indigo-300 hover:underline">Quick Reference (Formulas & Conversions)</a></li>
              <li><a href="#glossary" className="text-indigo-300 hover:underline">Glossary</a></li>
              <li><a href="#faq" className="text-indigo-300 hover:underline">FAQ</a></li>
            </ol>
          </nav>
        
          {/* ===== What is it? ===== */}
          <h1 id="what-is-tdc" className="text-3xl font-bold text-indigo-300 mb-6">
            Time Duration Calculator — precise elapsed time with extras, zones & DST
          </h1>
          <p>
            The <strong>Time Duration Calculator</strong> measures the exact time between two date-time values, respecting
            the <strong>timezone</strong> you choose (including <strong>Daylight Saving Time</strong> effects). Beyond a simple
            difference, this tool lets you <strong>add or subtract extra durations</strong>—for example, breaks, buffers,
            penalties, or grace periods—in clean <code>HH:MM:SS</code> rows. The result is shown as a human-friendly
            breakdown: <em>days</em> plus <em>hours:minutes:seconds</em>.
          </p>
          <p>
            Whether you are preparing a <em>worklog</em>, auditing <em>service-level agreements</em>, calculating billable
            hours, timing <em>maintenance windows</em>, or summarizing <em>event uptime</em>, this calculator keeps the math
            clear and consistent—so your reports stay trustworthy and easy to communicate.
          </p>
        
          {/* ===== Features ===== */}
          <h2 id="features" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            ✨ Key features
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>DST-aware timezone logic:</strong> Start/End are interpreted in your chosen IANA zone (e.g., <code>Asia/Dhaka</code>, <code>Europe/London</code>), then converted to an exact UTC instant for accurate subtraction.</li>
            <li><strong>Extras stack:</strong> add unlimited <code>HH:MM:SS</code> rows as <em>positive</em> buffers or <em>negative</em> breaks; totals are combined with the base duration.</li>
            <li><strong>Flexible End time:</strong> lock to a specific datetime or use <em>current time</em> for live, running calculations.</li>
            <li><strong>Readable output:</strong> see the total as <em>Days • HH:MM:SS</em>, plus tiles for base duration and extras.</li>
            <li><strong>State sharing:</strong> copy a shareable URL that encodes your exact scenario (inputs + extras) for teammates.</li>
            <li><strong>Clipboard-ready summary:</strong> copy a neat text block for emails, tickets, or incident reports.</li>
            <li><strong>Local persistence:</strong> the last scenario is remembered on your device for fast continuation.</li>
          </ul>
        
          {/* ===== How to Use ===== */}
          <h2 id="how-to-use" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">🧭 How to use</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li><strong>Choose Timezone:</strong> select a valid IANA zone. This locks the wall-clock interpretation for Start/End.</li>
            <li><strong>Set Start:</strong> pick a date and time. The preview shows how it renders in your chosen zone.</li>
            <li><strong>Set End:</strong> either pick a datetime or check <em>Use current time</em> for live elapsed time.</li>
            <li><strong>Add Extras:</strong> click <em>Add Buffer</em> (+) or <em>Add Break</em> (−), label it, and enter <code>HH</code>, <code>MM</code>, <code>SS</code>.</li>
            <li><strong>Read Results:</strong> the top card shows the total; tiles show base duration, extras sum, and a clean H:M:S split.</li>
            <li><strong>Share or Copy:</strong> use <em>Copy Link</em> to share the scenario or <em>Copy Results</em> for a one-shot text summary.</li>
          </ol>
          <p className="text-sm text-slate-400">Tip: For long spans, set the timezone to where the work actually happened to preserve wall-clock intent.</p>
        
          {/* ===== Methods & Math ===== */}
          <h2 id="methods" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🔧 Methods & math under the hood
          </h2>
          <h3 className="text-xl font-semibold text-indigo-300">1) Wall-clock → UTC → subtraction</h3>
          <p>
            Start and End are interpreted as <strong>local wall-clock timestamps</strong> in your chosen zone. Each is
            converted to an exact <strong>UTC instant</strong>. We subtract <code>End(UTC) − Start(UTC)</code> to obtain the
            <strong>base duration</strong>. This approach keeps the calculation correct during DST changes, leap minutes, or
            offset irregularities, because the subtraction is always done in absolute time.
          </p>
        
          <h3 className="text-xl font-semibold text-indigo-300 mt-6">2) Extras as signed seconds</h3>
          <p>
            Each extra row (<code>HH:MM:SS</code>) is parsed into seconds. A <em>Buffer</em> contributes positive seconds;
            a <em>Break</em> contributes negative seconds. We sum them to get <strong>extras total</strong> and then add that to
            the base duration for the <strong>final total</strong>.
          </p>
        
          <h3 className="text-xl font-semibold text-indigo-300 mt-6">3) Presentation (Days • HH:MM:SS)</h3>
          <p>
            The final number of seconds is decomposed into whole days plus a 24-hour clock remainder, formatted as
            <code>DDd HH:MM:SS</code>. A leading minus sign appears if the total is negative (possible if breaks exceed base).
          </p>
        
          {/* ===== Worked Examples ===== */}
          <h2 id="worked-examples" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🧪 Worked examples (rounded for readability)
          </h2>
          <ul className="space-y-2">
            <li><strong>Shift tracking:</strong> 09:00 → 17:30 with a 30-minute break = <em>8h 0m</em> total.</li>
            <li><strong>Overnight ops:</strong> 22:00 → 06:00 next day = <em>8h 0m</em> (handles day boundary correctly).</li>
            <li><strong>Buffer + penalty:</strong> Base 2h 15m; add buffer +00:10:00; subtract penalty −00:05:00 → <em>2h 20m</em>.</li>
            <li><strong>DST forward jump:</strong> 01:30 → 03:30 on spring transition day (1h lost) → <em>1h 0m</em> (not 2h).</li>
            <li><strong>DST backward fall:</strong> 01:30 → 03:30 on fall-back day (1h repeated) → <em>3h 0m</em> (not 2h).</li>
          </ul>
        
          {/* ===== Extras ===== */}
          <h2 id="extras" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            ➕➖ Adding & subtracting extras
          </h2>
          <p>
            Extras let you align math with real-world policies: subtract unpaid breaks, add pre-/post-task buffers, or include
            incident penalties and grace periods. Use clear labels (e.g., <em>Lunch</em>, <em>Setup</em>, <em>QA buffer</em>)
            so the copied summary is self-explanatory in emails and tickets.
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Breaks (−):</strong> unpaid lunch, commute, off-duty gaps.</li>
            <li><strong>Buffers (+):</strong> setup time, cool-down, review window, wrap-up notes.</li>
            <li><strong>Penalties/credits:</strong> SLAs, overtime policies, or adjustments decided after review.</li>
          </ul>
        
          {/* ===== Timezone & DST ===== */}
          <h2 id="timezone" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🌍 Time zones, DST & preserving wall-clock intent
          </h2>
          <p>
            If you worked “9 to 5” locally, that’s a <em>wall-clock</em> fact—even if the offset changed that day.
            By interpreting Start/End in the selected zone first and only then converting to UTC, the calculator preserves the
            real-world meaning of your entry. This is crucial on DST days, for overnight shifts, or when comparing regional sites.
          </p>
          <p className="text-sm text-slate-400">
            Tip: Use the same zone where the activity occurred—don’t mix zones unless you intend to.
          </p>
        
          {/* ===== Performance ===== */}
          <h2 id="performance" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🚀 Performance, precision & limits
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Instant feedback:</strong> calculations are lightweight and run entirely in the browser.</li>
            <li><strong>IANA validation:</strong> non-existent zones are gracefully handled; previews still render without crashing.</li>
            <li><strong>Local persistence + sharable URLs:</strong> continue later or send scenarios to teammates for review.</li>
          </ul>
        
          {/* ===== Pitfalls ===== */}
          <h2 id="pitfalls" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            ⚠️ Common pitfalls & how to avoid them
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Ambiguous zones:</strong> don’t type “IST” or “PST”; use IANA IDs like <code>Asia/Kolkata</code> or <code>America/Los_Angeles</code>.</li>
            <li><strong>Cross-zone inputs:</strong> if Start happened in one city and End in another, decide which zone expresses your intent; otherwise, results can be misleading.</li>
            <li><strong>Negative totals:</strong> too many breaks can produce a negative duration—valid but uncommon; review your extras list.</li>
            <li><strong>Rounding expectations:</strong> outputs are exact to the second; if you must round to the nearest 15 minutes, apply policy after copying the result.</li>
          </ul>
        
          {/* ===== Use Cases ===== */}
          <h2 id="use-cases" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🧰 Where duration math matters in real life
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Worklogs & payroll:</strong> compute net paid time (base minus unpaid breaks) across weeks.</li>
            <li><strong>IT operations:</strong> maintenance windows, incident timelines, MTTR, and SLA penalties.</li>
            <li><strong>Broadcast & events:</strong> session lengths, intermissions, overruns, and buffer planning.</li>
            <li><strong>Travel & logistics:</strong> layovers, ground time, duty periods, handoff windows across hubs.</li>
            <li><strong>Research & lab work:</strong> experiment durations, instrument warm-up/cool-down phases.</li>
            <li><strong>Sports & fitness:</strong> net training time, rest intervals, periodization blocks.</li>
          </ul>
        
          {/* ===== Quick Reference ===== */}
          <h2 id="quick-ref" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🗂️ Quick reference (formulas & conversions)
          </h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-300">
                  <th className="py-2 pr-4">Topic</th>
                  <th className="py-2 pr-4">Formula / Notes</th>
                  <th className="py-2">Example</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                <tr>
                  <td>Base duration</td>
                  <td><code>End(UTC) − Start(UTC)</code></td>
                  <td>2025-11-10 09:00 → 2025-11-10 17:30 = 8h 30m</td>
                </tr>
                <tr>
                  <td>Extras sum</td>
                  <td>Σ(<em>sign</em> × <code>HH:MM:SS</code>)</td>
                  <td>Break −00:30:00; Buffer +00:10:00 → −00:20:00</td>
                </tr>
                <tr>
                  <td>Total duration</td>
                  <td>Base + Extras</td>
                  <td>8:30:00 + (−00:20:00) = 8:10:00</td>
                </tr>
                <tr>
                  <td>Days • HH:MM:SS</td>
                  <td><em>days</em> = ⌊seconds/86400⌋; remainder → HH:MM:SS</td>
                  <td>100000s = 1d 03:46:40</td>
                </tr>
                <tr>
                  <td>DST jump (spring)</td>
                  <td>Clock skips 1 hour → base duration decreases by 1h</td>
                  <td>01:30 → 03:30 on DST start = 1h</td>
                </tr>
                <tr>
                  <td>DST fall-back (autumn)</td>
                  <td>Clock repeats 1 hour → base duration increases by 1h</td>
                  <td>01:30 → 03:30 on DST end = 3h</td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs text-slate-400 mt-2">
              The calculator uses IANA time zone data via the browser’s internationalization APIs for offset/DST correctness.
            </p>
          </div>
        
          {/* ===== Glossary ===== */}
          <h2 id="glossary" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">📚 Glossary</h2>
          <p className="space-y-2">
            <strong>IANA time zone:</strong> canonical zone IDs (e.g., <code>Europe/Paris</code>) with rules for offset & DST. <br/>
            <strong>UTC:</strong> Coordinated Universal Time—neutral global time used for exact subtraction. <br/>
            <strong>DST:</strong> Daylight Saving Time—regional clock shifts that affect local offsets seasonally. <br/>
            <strong>Wall-clock time:</strong> the human-observed local time (e.g., “start at 9 AM in London”). <br/>
            <strong>Buffer/Break:</strong> positive/negative duration rows added to base elapsed time. <br/>
            <strong>MTTR:</strong> Mean Time To Recovery—common reliability metric derived from durations.
          </p>
        
          {/* ===== FAQ ===== */}
          <section className="space-y-6 mt-16">
            <h2 id="faq" className="text-3xl md:text-4xl font-bold mb-4 text-center text-indigo-200">
              ❓ Frequently Asked Questions (FAQ)
            </h2>
        
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q1: Why choose an IANA time zone?</h3>
                <p>
                  Abbreviations like “PST/IST” are ambiguous and shift with DST. IANA zones (e.g., <code>America/Los_Angeles</code>) are precise and consistent.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q2: Do you handle DST changes correctly?</h3>
                <p>
                  Yes. The calculator interprets Start/End in the selected zone, converts to UTC instants, and subtracts—so spring forward/fall back days are handled accurately.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q3: Can the total be negative?</h3>
                <p>
                  It can if breaks and negative adjustments exceed the base duration. This is valid math; review your extras to confirm policy.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q4: How do I share the exact setup with my team?</h3>
                <p>
                  Click <em>Copy Link</em>. The URL encodes timezone, Start/End, the live/now toggle, and every extra row.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q5: What if I entered Start in one city and End in another?</h3>
                <p>
                  Decide which zone best represents your intent—usually where the work occurred—and keep both in that zone for clarity.
                </p>
              </div>
        
            </div>
          </section>
        </section>
        
        {/* ========= Cross-links ========= */}
        <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
          <div className="flex items-center gap-3">
            <img
              src="/images/calculatorhub-author.webp"
              alt="CalculatorHub Tools Team"
              className="w-12 h-12 rounded-full border border-gray-600"
              loading="lazy"
            />
            <div>
              <p className="font-semibold text-white">Author: CalculatorHub Tools Team</p>
              <p className="text-sm text-slate-400">
                Specialists in time math & UX. Last updated: <time dateTime="2025-11-10">November 10, 2025</time>.
              </p>
            </div>
          </div>
        
          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              🚀 Explore more tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/timezone-converter"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-200 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
              >
                🌍 Timezone Converter
              </Link>
              <Link
                to="/average-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-200 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
              >
                📊 Average Calculator
              </Link>
              <Link
                to="/age-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-pink-600/20 text-pink-300 hover:text-pink-200 px-3 py-2 rounded-md border border-slate-700 hover:border-pink-500 transition-all duration-200"
              >
                🎂 Age Calculator
              </Link>
            </div>
          </div>
        </section>


        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/time-duration-calculator" category="utilities" />
      </div>
    </>
  );
};

/* Small tile helper */
const Stat: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155] shadow-sm">
    <div className="text-sm text-slate-400">{label}</div>
    <div className="text-lg font-semibold text-white break-words">{value}</div>
  </div>
);

export default TimeDurationCalculator;
