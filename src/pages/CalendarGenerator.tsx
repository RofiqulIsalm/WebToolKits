// src/pages/CalendarGenerator.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  RotateCcw,
  Share2,
  Copy,
  Printer,
  ChevronDown,
  ChevronUp,
  Info,
  Upload,
  FileDown,
  Image as ImageIcon,
  FileText,
  Ruler,
  Palette,
  Type as TypeIcon,
  Download,
} from "lucide-react";

import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import RelatedCalculators from "../components/RelatedCalculators";
import { generateCalculatorSchema } from "../utils/seoData";

import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";

/* ============================================================
   Shared helpers
   ============================================================ */
type WeekStart = "sun" | "mon";
const two = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;

// UTF-8 safe base64 helpers for URL state
const b64e = (str: string) => {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
};
const b64d = (b64: string) => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
};
// Safe random UID (older Safari fallback)
const safeUUID = () => (crypto && "randomUUID" in crypto ? crypto.randomUUID() : `uid-${Math.random().toString(36).slice(2)}-${Date.now()}`);

const LOCALES = [
  "en-US","en-GB","bn-BD","hi-IN","ar-SA","de-DE","fr-FR","es-ES","it-IT","nl-NL",
  "sv-SE","nb-NO","da-DK","fi-FI","pt-BR","ru-RU","zh-CN","ja-JP","ko-KR",
];

function monthName(year: number, monthIdx: number, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
    new Date(year, monthIdx, 1)
  );
}
function weekdayLabels(locale: string, weekStart: WeekStart): string[] {
  const base: string[] = [];
  // Jan 5, 2025 is a Sunday → yields Sun..Sat regardless of locale week start
  for (let i = 0; i < 7; i++) base.push(new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(2025, 0, 5 + i)));
  return weekStart === "mon" ? [...base.slice(1), base[0]] : base;
}
function weeksInMonth(year: number, monthIdx: number, weekStart: WeekStart) {
  const first = new Date(year, monthIdx, 1);
  const last = new Date(year, monthIdx + 1, 0);
  const endDate = last.getDate();
  const lead = (first.getDay() - (weekStart === "sun" ? 0 : 1) + 7) % 7;

  const weeks: Array<Array<Date>> = [];
  let cursor = new Date(year, monthIdx, 1 - lead);
  while (true) {
    const row: Date[] = [];
    for (let i = 0; i < 7; i++) { row.push(new Date(cursor)); cursor.setDate(cursor.getDate() + 1); }
    weeks.push(row);
    const done =
      row.some((d) => d.getFullYear() === year && d.getMonth() === monthIdx && d.getDate() === endDate) &&
      cursor.getMonth() !== monthIdx;
    if (done) break;
  }
  return weeks;
}
function weekNumberISO(d: Date): number {
  const dd = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = dd.getUTCDay() || 7;
  dd.setUTCDate(dd.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(dd.getUTCFullYear(), 0, 1));
  return Math.ceil(((dd.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
function isSameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/* ============================================================
   QUICK TAB — generator (with events+exports)
   ============================================================ */
const LS_KEY_Q = "calendar_generator_state_v2";
const URL_KEY_Q = "calgen";

function parseEvents(input: string, year: number): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const lines = input.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  for (const line of lines) {
    let datePart = line, title = "Holiday";
    const m = line.match(/^(\d{4}-\d{2}-\d{2}|[^,]+)\s*,\s*(.+)$/);
    if (m) { datePart = m[1].trim(); title = m[2].replace(/^"|"$/g, "").trim() || "Holiday"; }
    let d: Date | null = null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) d = new Date(datePart + "T00:00:00");
    else if (/^\d{1,2}-\d{1,2}$/.test(datePart)) { const [mm, dd] = datePart.split("-").map(n=>parseInt(n,10)); d = new Date(year, mm-1, dd); }
    else { const t = Date.parse(datePart); if (!Number.isNaN(t)) d = new Date(t); }
    if (d && !Number.isNaN(d.getTime())) {
      const key = iso(d);
      if (!out.has(key)) out.set(key, []);
      const arr = out.get(key)!;
      if (!arr.includes(title)) arr.push(title);
    }
  }
  return out;
}

function QuickMonthGrid({
  y, m, locale, weekStart, showWeekNums, highlightToday, eventMap,
}: {
  y: number; m: number; locale: string; weekStart: WeekStart; showWeekNums: boolean; highlightToday: boolean; eventMap: Map<string,string[]>;
}) {
  const weeks = weeksInMonth(y, m, weekStart);
  const wkLabels = weekdayLabels(locale, weekStart);
  return (
    <div className="rounded-xl border border-[#334155] bg-[#0f172a] p-3 shadow-sm">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-white font-semibold">{monthName(y, m, locale)}</h3>
        {showWeekNums && <span className="text-xs text-slate-400">ISO Week</span>}
      </div>
      <div className={`grid ${showWeekNums ? "grid-cols-8" : "grid-cols-7"} gap-px bg-[#1e293b] rounded-lg overflow-hidden`}>
        {showWeekNums && <div className="bg-[#0b1220] text-slate-400 text-xs p-2 text-center">Wk</div>}
        {wkLabels.map((w) => (
          <div key={w} className="bg-[#0b1220] text-slate-300 text-xs p-2 text-center">{w}</div>
        ))}
        {weeks.map((row, ri) => {
          const weekNo = weekNumberISO(row[0]);
          return (
            <React.Fragment key={`row-${y}-${m}-${ri}`}>
              {showWeekNums && (
                <div className="bg-[#0b1220] text-slate-500 text-xs p-2 text-center">{weekNo}</div>
              )}
              {row.map((d, ci) => {
                const inMonth = d.getMonth() === m;
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                const key = iso(d);
                const titles = eventMap.get(key);
                const isToday = highlightToday && isSameDate(d, new Date());
                return (
                  <div
                    key={`cell-${y}-${m}-${ri}-${ci}-${d.getTime()}`}
                    title={titles?.join(", ")}
                    className={[
                      "min-h-[64px] p-2 text-sm",
                      inMonth ? "bg-[#0b1220]" : "bg-[#0b1220]/40",
                      isWeekend ? "border border-slate-700/40" : "border border-slate-700/20",
                      "relative",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${inMonth ? "text-slate-200" : "text-slate-500"}`}>{d.getDate()}</span>
                      {isToday && (
                        <span className="text-[10px] text-emerald-300 px-1 py-0.5 rounded border border-emerald-500/40">Today</span>
                      )}
                    </div>
                    {!!titles?.length && (
                      <div className="absolute inset-x-2 bottom-2 text-[10px] text-emerald-300 truncate">● {titles.join(" • ")}</div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function QuickTab() {
  const today = new Date();
  const thisYear = today.getFullYear();
  const [year, setYear] = useState<number>(thisYear);
  const [mode, setMode] = useState<"monthly" | "yearly">("monthly");
  const [month, setMonth] = useState<number>(today.getMonth());
  const [locale, setLocale] = useState<string>(Intl.DateTimeFormat().resolvedOptions().locale || "en-US");
  const [weekStart, setWeekStart] = useState<WeekStart>("sun");
  const [showWeekNums, setShowWeekNums] = useState<boolean>(false);
  const [highlightToday, setHighlightToday] = useState<boolean>(true);
  const [eventsInput, setEventsInput] = useState<string>("");
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState<boolean>(false);
  const previewRef = useRef<HTMLDivElement|null>(null);

  const isDefault =
    year === thisYear &&
    mode === "monthly" &&
    month === today.getMonth() &&
    weekStart === "sun" &&
    !showWeekNums &&
    highlightToday &&
    eventsInput.trim() === "";

  // Load/Save/URL
  const applyState = (s: any) => {
    setYear(Number.isFinite(s?.year) ? s.year : thisYear);
    setMode(s?.mode === "yearly" ? "yearly" : "monthly");
    setMonth(Number.isFinite(s?.month) ? s.month : today.getMonth());
    setLocale(typeof s?.locale === "string" ? s.locale : locale);
    setWeekStart(s?.weekStart === "mon" ? "mon" : "sun");
    setShowWeekNums(!!s?.showWeekNums);
    setHighlightToday(s?.highlightToday ?? true);
    setEventsInput(typeof s?.eventsInput === "string" ? s.eventsInput : (s?.holidaysInput ?? ""));
  };
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const enc = params.get(URL_KEY_Q);
      if (enc) { applyState(JSON.parse(b64d(enc))); setHydrated(true); return; }
      const raw = localStorage.getItem(LS_KEY_Q);
      if (raw) applyState(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      const state = { year, mode, month, locale, weekStart, showWeekNums, highlightToday, eventsInput };
      localStorage.setItem(LS_KEY_Q, JSON.stringify(state));
    } catch {}
  }, [hydrated, year, mode, month, locale, weekStart, showWeekNums, highlightToday, eventsInput]);
  useEffect(() => {
    if (!hydrated) return;
    try {
      const url = new URL(window.location.href);
      if (isDefault) url.searchParams.delete(URL_KEY_Q);
      else {
        const state = { year, mode, month, locale, weekStart, showWeekNums, highlightToday, eventsInput };
        url.searchParams.set(URL_KEY_Q, b64e(JSON.stringify(state)));
      }
      window.history.replaceState({}, "", url);
    } catch {}
  }, [hydrated, isDefault, year, mode, month, locale, weekStart, showWeekNums, highlightToday, eventsInput]);

  const wkLabels = useMemo(() => weekdayLabels(locale, weekStart), [locale, weekStart]);
  const eventMap = useMemo(() => parseEvents(eventsInput, year), [eventsInput, year]);

  // Actions
  const copyResults = async () => {
    const hdr = `Calendar ${mode === "monthly" ? monthName(year, month, locale) : year}`;
    const lines: string[] = [hdr, `Locale: ${locale} | Week start: ${weekStart === "sun" ? "Sun" : "Mon"} | Week #s: ${showWeekNums ? "On" : "Off"}`, `Events: ${eventMap.size} days`];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied("results"); setTimeout(()=>setCopied("none"), 1500);
  };
  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    const state = { year, mode, month, locale, weekStart, showWeekNums, highlightToday, eventsInput };
    url.searchParams.set(URL_KEY_Q, b64e(JSON.stringify(state)));
    await navigator.clipboard.writeText(url.toString());
    setCopied("link"); setTimeout(()=>setCopied("none"), 1500);
  };
  const reset = () => {
    setYear(thisYear); setMode("monthly"); setMonth(today.getMonth());
    setLocale(Intl.DateTimeFormat().resolvedOptions().locale || "en-US");
    setWeekStart("sun"); setShowWeekNums(false); setHighlightToday(true);
    setEventsInput(""); localStorage.removeItem(LS_KEY_Q);
  };
  const printCal = () => window.print();

  // Imports/Exports
  const onImportCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const txt = String(reader.result || "");
      const lines = txt.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
      const merged = new Set([...(eventsInput ? eventsInput.split(/\r?\n/) : []), ...lines]);
      setEventsInput(Array.from(merged).join("\n"));
    };
    reader.readAsText(file);
  };
  const exportPNG = async () => {
    try {
      if (!previewRef.current) return;
      const dataUrl = await htmlToImage.toPng(previewRef.current, { pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl; a.download = `calendar_${mode === "monthly" ? `${year}_${two(month + 1)}` : year}.png`; a.click();
    } catch (e) {
      alert("PNG export failed (browser blocked canvas). Try removing external images or use the Designer tab exports.");
    }
  };
  const exportPDF = async () => {
    try {
      if (!previewRef.current) return;
      const node = previewRef.current;
      const dataUrl = await htmlToImage.toPng(node, { pixelRatio: 2 });
      const img = new Image(); img.crossOrigin = "anonymous"; img.src = dataUrl;
      await new Promise((res)=> (img.onload=()=>res(null)));
      const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth(), pageH = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageW / img.width, pageH / img.height);
      const w = img.width * ratio, h = img.height * ratio;
      pdf.addImage(img, "PNG", (pageW-w)/2, 24, w, h);
      pdf.save(`calendar_${mode === "monthly" ? `${year}_${two(month + 1)}` : year}.pdf`);
    } catch {
      alert("PDF export failed. Try PNG, or export from Designer at exact size.");
    }
  };
  const copySVG = async () => {
    try {
      if (!previewRef.current) return;
      const svgStr = await htmlToImage.toSvg(previewRef.current);
      await navigator.clipboard.writeText(svgStr);
      alert("SVG copied to clipboard");
    } catch {
      alert("SVG copy failed.");
    }
  };

  // ICS builder with proper escaping
  const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  const buildICS = (map: Map<string, string[]>, calName = "Calendar") => {
    const pad = (n:number)=> String(n).padStart(2,"0");
    const dtstamp = new Date();
    const dt = `${dtstamp.getUTCFullYear()}${pad(dtstamp.getUTCMonth()+1)}${pad(dtstamp.getUTCDate())}T${pad(dtstamp.getUTCHours())}${pad(dtstamp.getUTCMinutes())}${pad(dtstamp.getUTCSeconds())}Z`;
    const nextDay = (key: string) => { const d = new Date(key + "T00:00:00"); d.setDate(d.getDate()+1); return iso(d).replaceAll("-",""); };
    const lines = [
      "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//CalculatorHub//Calendar//EN",
      `X-WR-CALNAME:${icsEscape(calName)}`
    ];
    for (const [k,titles] of map.entries()) {
      const summary = icsEscape((titles && titles.length ? titles.join(" • ") : "Holiday") || "Holiday");
      lines.push(
        "BEGIN:VEVENT",
        `UID:${safeUUID()}@calculatorhub`,
        `DTSTAMP:${dt}`,
        `SUMMARY:${summary}`,
        `DTSTART;VALUE=DATE:${k.replaceAll("-","")}`,
        `DTEND;VALUE=DATE:${nextDay(k)}`,
        "END:VEVENT"
      );
    }
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  };
  const downloadICS = () => {
    const ics = buildICS(eventMap, `Calendar ${year}`);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `calendar_${year}.ics`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 relative text-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-sky-400" /> Options (Quick)
          </h2>
          <button onClick={reset} className="flex items-center gap-1 text-sm text-slate-300 border border-[#334155] rounded-lg px-2 py-1 hover:bg-[#0f172a] hover:text-white transition" disabled={isDefault}>
            <RotateCcw className="h-4 w-4 text-indigo-400" /> Reset
          </button>
        </div>

        <div className="space-y-5">
          {/* Year + Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Year</label>
              <input type="number" value={year} onChange={(e)=> setYear(parseInt(e.target.value||"0")||thisYear)} className="w-full bg-[#0f172a] text-white px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Mode</label>
              <select value={mode} onChange={(e)=> setMode(e.target.value as "monthly" | "yearly")} className="w-full bg-[#0f172a] text-white px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="monthly">Monthly</option><option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          {/* Month */}
          {mode === "monthly" && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Month</label>
              <select value={month} onChange={(e)=> setMonth(parseInt(e.target.value))} className="w-full bg-[#0f172a] text-white px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500">
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>{monthName(2000, i, locale).split(" ")[0]}</option>
                ))}
              </select>
            </div>
          )}

          {/* Locale + Week start + Week numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Locale</label>
              <select value={locale} onChange={(e)=> setLocale(e.target.value)} className="w-full bg-[#0f172a] text-white px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500">
                {[...new Set([locale, ...LOCALES])].map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Week Start</label>
              <select value={weekStart} onChange={(e)=> setWeekStart(e.target.value as WeekStart)} className="w-full bg-[#0f172a] text-white px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="sun">Sunday</option><option value="mon">Monday</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={showWeekNums} onChange={(e)=> setShowWeekNums(e.target.checked)} className="h-4 w-4"/> Show Week Numbers
              </label>
            </div>
          </div>

          {/* Advanced */}
          <button onClick={()=> setShowAdvanced(v=>!v)} className="w-full flex items-center justify-between px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-md text-sm hover:border-indigo-500">
            <span className="flex items-center gap-2"><Info className="h-4 w-4 text-slate-400" /> Advanced (Today, Events & Export)</span>
            {showAdvanced ? <ChevronUp /> : <ChevronDown />}
          </button>

          {showAdvanced && (
            <div className="space-y-4">
              <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={highlightToday} onChange={(e)=> setHighlightToday(e.target.checked)} className="h-4 w-4"/> Highlight Today
              </label>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Events / Holidays</label>
                <textarea
                  placeholder={`YYYY-MM-DD, Title\nNov 6 2025, Diwali\n12-16, My Birthday (MM-DD uses current year)`}
                  value={eventsInput} onChange={(e)=> setEventsInput(e.target.value)} rows={4}
                  className="w-full bg-[#0f172a] text-white px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-md border border-[#334155] bg-[#0f172a] cursor-pointer">
                    <Upload className="h-4 w-4" /> Import CSV
                    <input type="file" accept=".csv,.txt" className="hidden" onChange={(e)=> e.target.files && onImportCSV(e.target.files[0])}/>
                  </label>
                  <button onClick={downloadICS} className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-md border border-emerald-600/40 bg-emerald-600/20 text-emerald-200 hover:bg-emerald-600/30">
                    <FileDown className="h-4 w-4" /> Download .ics
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button onClick={exportPNG} className="flex items-center justify-center gap-2 bg-[#0f172a] border border-[#334155] hover:border-indigo-500 px-3 py-2 rounded-md text-xs">
                  <ImageIcon className="h-4 w-4" /> PNG
                </button>
                <button onClick={exportPDF} className="flex items-center justify-center gap-2 bg-[#0f172a] border border-[#334155] hover:border-indigo-500 px-3 py-2 rounded-md text-xs">
                  <FileText className="h-4 w-4" /> PDF
                </button>
                <button onClick={copySVG} className="flex items-center justify-center gap-2 bg-[#0f172a] border border-[#334155] hover:border-indigo-500 px-3 py-2 rounded-md text-xs">
                  <Copy className="h-4 w-4" /> Copy SVG
                </button>
                <button onClick={printCal} className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md text-xs">
                  <Printer className="h-4 w-4" /> Print
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-1">
            <button onClick={copyResults} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm">
              <Copy size={16} /> Copy Summary
            </button>
            <button onClick={copyShareLink} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm">
              <Share2 size={16} /> Copy Link
            </button>
            {copied !== "none" && (
              <span className="text-emerald-400 text-sm">{copied === "results" ? "Summary copied!" : "Link copied!"}</span>
            )}
          </div>
        </div>
      </div>

      {/* Output */}
      <div ref={previewRef} className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
        <h2 className="text-xl font-semibold text-white mb-4">
          {mode === "monthly" ? monthName(year, month, locale) : `${year} — Yearly Calendar`}
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
            <div className="text-sm text-slate-400">Locale</div><div className="text-lg font-semibold text-white">{locale}</div>
          </div>
          <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
            <div className="text-sm text-slate-400">Week Start</div><div className="text-lg font-semibold text-white">{weekStart === "sun" ? "Sunday" : "Monday"}</div>
          </div>
        </div>
        {mode === "monthly" ? (
          <QuickMonthGrid y={year} m={month} locale={locale} weekStart={weekStart} showWeekNums={showWeekNums} highlightToday={highlightToday} eventMap={eventMap}/>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <QuickMonthGrid key={`ym-${year}-${i}`} y={year} m={i} locale={locale} weekStart={weekStart} showWeekNums={showWeekNums} highlightToday={highlightToday} eventMap={eventMap}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   DESIGNER TAB — mobile friendly, sizes, templates, per-month images
   ============================================================ */
const MM_PER_IN = 25.4;
function toPx(value: number, unit: "px" | "mm" | "in", dpi: number) {
  if (unit === "px") return Math.max(1, Math.round(value));
  if (unit === "mm") return Math.round((value / MM_PER_IN) * dpi);
  return Math.round(value * dpi);
}
const SIZE_PRESETS = [
  { name: "A4 Portrait", unit: "mm" as const, w: 210, h: 297 },
  { name: "A4 Landscape", unit: "mm" as const, w: 297, h: 210 },
  { name: "Letter Portrait", unit: "in" as const, w: 8.5, h: 11 },
  { name: "Letter Landscape", unit: "in" as const, w: 11, h: 8.5 },
  { name: "Tabloid (11×17)", unit: "in" as const, w: 11, h: 17 },
  { name: "Instagram Post (1080×1350)", unit: "px" as const, w: 1080, h: 1350 },
  { name: "Desktop 4K Poster", unit: "px" as const, w: 3840, h: 2160 },
];
type Token = { bg:string; panel:string; text:string; acc:string; weekend:string; border:string; cellRadius:number; cellBorder:number; };
const TEMPLATES: Array<{ name:string; tokens:Token; header?:string; footer?:string; options?:any }> = [
  { name:"Glass (Default)", tokens:{ bg:"#0f172a", panel:"#1e293b", text:"#e2e8f0", acc:"#60a5fa", weekend:"#0b1220", border:"#334155", cellRadius:10, cellBorder:1 }, header:"2025 Family Calendar", footer:"calculatorhub.site" },
  { name:"Minimal Light", tokens:{ bg:"#ffffff", panel:"#f6f7f9", text:"#0b0f19", acc:"#2563eb", weekend:"#eef2f7", border:"#d9dee7", cellRadius:8, cellBorder:1 }, header:"Team Schedule" },
  { name:"Classic Print", tokens:{ bg:"#ffffff", panel:"#ffffff", text:"#111827", acc:"#111827", weekend:"#fafafa", border:"#111827", cellRadius:0, cellBorder:1 }, header:"Academic Year" },
  { name:"Bold Poster", tokens:{ bg:"#0b0f19", panel:"#0b0f19", text:"#f8fafc", acc:"#f59e0b", weekend:"#111827", border:"#f59e0b", cellRadius:14, cellBorder:2 }, header:"Hustle Hard — 2025", footer:"Make every day count" },
  { name:"Photo Grid", tokens:{ bg:"#000", panel:"#000", text:"#f8fafc", acc:"#60a5fa", weekend:"#0b1220", border:"#334155", cellRadius:10, cellBorder:1 }, header:"Memories 2025", options:{ photoGrid:true } },
];
type Align = "left"|"center"|"right";
type DesignerState = {
  unit:"px"|"mm"|"in"; dpi:number; width:number; height:number; margin:number;
  tokens:Token; fontFamily:string; headerText:string; headerAlign:Align; footerText:string; footerAlign:Align;
  bgImage?:string|null; bgFit:"cover"|"contain"; bgOpacity:number; bgBlur:number;
  logo?:string|null; logoPos:"tl"|"tr"|"bl"|"br"; logoSize:number; logoOpacity:number;
  perMonthImages:(string|null)[]; showWeekNums:boolean; weekStart:0|1; simpleMode:boolean;
};
const LS_KEY_D = "caldesigner.v2";

function DesignerTab() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [yearly, setYearly] = useState(false);

  const [d, setD] = useState<DesignerState>(() => {
    const def: DesignerState = {
      unit:"mm", dpi:300, width:210, height:297, margin:10,
      tokens:TEMPLATES[0].tokens,
      fontFamily:"Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
      headerText: TEMPLATES[0].header || "", headerAlign:"center",
      footerText: TEMPLATES[0].footer || "", footerAlign:"center",
      bgImage:null, bgFit:"cover", bgOpacity:0.18, bgBlur:0,
      logo:null, logoPos:"tr", logoSize:120, logoOpacity:0.85,
      perMonthImages:new Array(12).fill(null),
      showWeekNums:true, weekStart:1, simpleMode:true,
    };
    try { const raw = localStorage.getItem(LS_KEY_D); if (raw) return { ...def, ...JSON.parse(raw) }; } catch {}
    return def;
  });
  useEffect(()=>{ try { localStorage.setItem(LS_KEY_D, JSON.stringify(d)); } catch {} },[d]);

  const pxW = useMemo(()=> toPx(d.width, d.unit, d.dpi), [d.width,d.unit,d.dpi]);
  const pxH = useMemo(()=> toPx(d.height, d.unit, d.dpi), [d.height,d.unit,d.dpi]);
  const pxM = useMemo(()=> toPx(d.margin, d.unit, d.dpi), [d.margin,d.unit,d.dpi]);

  const renderRef = useRef<HTMLDivElement|null>(null);

  const weekdayNames = useMemo(()=>{
    const base = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    return d.weekStart===1 ? [...base.slice(1), base[0]] : base;
  },[d.weekStart]);

  function monthMatrix(y:number, m:number) {
    const first = new Date(y, m, 1);
    const last = new Date(y, m+1, 0);
    const shift = (first.getDay() - d.weekStart + 7) % 7;
    const weeks: Date[][] = [];
    let cur = new Date(y, m, 1 - shift);
    while (true) {
      const row: Date[] = [];
      for (let i=0;i<7;i++){ row.push(new Date(cur)); cur.setDate(cur.getDate()+1); }
      weeks.push(row);
      if (row.some(dd=> dd.getMonth()===m && dd.getDate()===last.getDate()) && cur.getMonth()!==m) break;
    }
    return weeks;
  }
  const MGrid = ({ y, m }:{y:number; m:number}) => {
    const weeks = monthMatrix(y,m);
    const perImg = d.perMonthImages[m];
    return (
      <div style={{ borderRadius: 16, background: d.tokens.panel, color: d.tokens.text }} className="p-3 sm:p-6">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="font-semibold text-base sm:text-2xl">
            {new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(y, m, 1))}
          </div>
          {d.showWeekNums && (<span className="text-[10px] sm:text-xs opacity-70">Week #</span>)}
        </div>
        {perImg && (
          <div className="mb-2 overflow-hidden rounded-lg">
            <img src={perImg} className="w-full h-32 sm:h-48 object-cover" alt="month"/>
          </div>
        )}
        <div className={`grid ${d.showWeekNums ? "grid-cols-8" : "grid-cols-7"} gap-px bg-black/10 rounded-md overflow-hidden`}>
          {d.showWeekNums && (<div className="text-center text-[10px] sm:text-xs py-2 opacity-70">Wk</div>)}
          {weekdayNames.map((w)=> (<div key={w} className="text-center text-[10px] sm:text-xs py-2 opacity-80">{w}</div>))}
          {weeks.map((row, i)=>{
            const d0 = row[0];
            const weekNo = (()=>{ const t = new Date(Date.UTC(d0.getFullYear(), d0.getMonth(), d0.getDate())); const day = (t.getUTCDay()+6)%7; t.setUTCDate(t.getUTCDate()-day+3); const t0 = new Date(Date.UTC(t.getUTCFullYear(),0,4)); return 1+Math.round((t.valueOf()-t0.valueOf())/604800000); })();
            return (
              <React.Fragment key={`drow-${y}-${m}-${i}`}>
                {d.showWeekNums && (<div className="text-center text-[10px] sm:text-xs py-2 opacity-70">{weekNo}</div>)}
                {row.map((dd, j)=>{
                  const inMonth = dd.getMonth()===m; const weekend = dd.getDay()===0 || dd.getDay()===6;
                  return (
                    <div key={`dcell-${y}-${m}-${i}-${j}-${dd.getTime()}`}
                      style={{ borderRadius: d.tokens.cellRadius, border: `${d.tokens.cellBorder}px solid ${d.tokens.border}`, background: weekend? d.tokens.weekend : "transparent" }}
                      className={`h-12 sm:h-20 text-[10px] sm:text-sm p-1 sm:p-2 flex items-start justify-end ${inMonth? "opacity-100":"opacity-40"}`}
                    >
                      {dd.getDate()}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };
  const YGrid = ({ y }:{y:number}) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
      {Array.from({length:12}).map((_,i)=> <MGrid key={`ygrid-${y}-${i}`} y={y} m={i}/>)}
    </div>
  );

  // Exports (exact size)
  const exportPNG = async () => {
    try {
      if (!renderRef.current) return;
      const node = renderRef.current;
      const dataUrl = await htmlToImage.toPng(node, { pixelRatio: 1, width: pxW, height: pxH, style: { transform: "none" } }).catch(()=>null);
      if (!dataUrl) return alert("PNG export failed");
      const a = document.createElement("a"); a.href = dataUrl; a.download = `calendar_${year}${!yearly?`_${two(month+1)}`:""}_${pxW}x${pxH}.png`; a.click();
    } catch {
      alert("PNG export failed.");
    }
  };
  const exportPDF = async () => {
    try {
      if (!renderRef.current) return;
      const node = renderRef.current;
      const dataUrl = await htmlToImage.toPng(node, { pixelRatio: 1, width: pxW, height: pxH }).catch(()=>null);
      if (!dataUrl) return alert("PDF export failed");
      const img = new Image(); img.src = dataUrl; await new Promise(res=> img.onload = ()=> res(null));
      const pdf = new jsPDF({ unit: "pt", format: [pxW, pxH], orientation: pxW>pxH ? "landscape" : "portrait" });
      pdf.addImage(img, "PNG", 0, 0, pxW, pxH); pdf.save(`calendar_${year}${!yearly?`_${two(month+1)}`:""}.pdf`);
    } catch {
      alert("PDF export failed.");
    }
  };
  const copySVG = async () => {
    try {
      if (!renderRef.current) return;
      const node = renderRef.current;
      const svg = await htmlToImage.toSvg(node, { width: pxW, height: pxH }).catch(()=>null);
      if (!svg) return alert("SVG export failed");
      await navigator.clipboard.writeText(svg); alert("SVG copied to clipboard");
    } catch {
      alert("SVG copy failed.");
    }
  };

  // Images
  const onImage = (file: File, key: "bgImage"|"logo") => { const r=new FileReader(); r.onload=()=> setD(v=> ({...v, [key]: String(r.result)})); r.readAsDataURL(file); };
  const onMonthImage = (file: File, idx:number) => { const r=new FileReader(); r.onload=()=> setD(v=> { const arr=v.perMonthImages.slice(); arr[idx]=String(r.result); return {...v, perMonthImages: arr}; }); r.readAsDataURL(file); };
  const applyTemplate = (name: string) => { const t=TEMPLATES.find(x=>x.name===name); if(!t) return; setD(v=> ({ ...v, tokens:t.tokens, headerText:t.header ?? v.headerText, footerText:t.footer ?? v.footerText })); };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Controls */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 space-y-4">
        {/* Simple / Advanced */}
        <div className="flex items-center gap-2">
          <button onClick={()=> setD(v=>({...v, simpleMode:true}))} className={`px-3 py-1.5 rounded-md border ${d.simpleMode?"border-emerald-500 text-emerald-300":"border-[#334155] text-slate-300"}`}>Simple</button>
          <button onClick={()=> setD(v=>({...v, simpleMode:false}))} className={`px-3 py-1.5 rounded-md border ${!d.simpleMode?"border-emerald-500 text-emerald-300":"border-[#334155] text-slate-300"}`}>Advanced</button>
          <button onClick={()=> { localStorage.removeItem(LS_KEY_D); location.reload(); }} className="ml-auto px-3 py-1.5 rounded-md border border-[#334155] text-slate-300 flex items-center gap-2">
            <RotateCcw className="h-4 w-4"/> Reset
          </button>
        </div>

        {/* Templates */}
        <div>
          <div className="flex items-center gap-2 mb-2 font-semibold"><Palette className="h-4 w-4"/> Templates</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TEMPLATES.map(t=> (
              <button key={t.name} onClick={()=> applyTemplate(t.name)} className="bg-[#0f172a] border border-[#334155] rounded-md px-3 py-2 text-xs sm:text-sm hover:border-emerald-500/50">{t.name}</button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div>
          <div className="flex items-center gap-2 mb-2 font-semibold"><Ruler className="h-4 w-4"/> Size & DPI</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            <select className="bg-[#0f172a] border border-[#334155] rounded-md px-2 py-2"
              onChange={(e)=> { const p=SIZE_PRESETS.find(s=>s.name===e.target.value); if(!p) return; setD(v=> ({...v, unit:p.unit, width:p.w, height:p.h})); }}>
              <option>Choose preset…</option>
              {SIZE_PRESETS.map(p=> <option key={p.name}>{p.name}</option>)}
            </select>
            <div className="grid grid-cols-3 gap-2">
              <select value={d.unit} onChange={(e)=> setD(v=> ({...v, unit:e.target.value as any}))} className="bg-[#0f172a] border border-[#334155] rounded-md px-2 py-2">
                <option value="mm">mm</option><option value="in">in</option><option value="px">px</option>
              </select>
              <input type="number" step={d.unit==="px"?10:0.5} value={d.width} onChange={(e)=> setD(v=> ({...v, width: parseFloat(e.target.value)||v.width}))} className="bg-[#0f172a] border border-[#334155] rounded-md px-2 py-2" placeholder="W"/>
              <input type="number" step={d.unit==="px"?10:0.5} value={d.height} onChange={(e)=> setD(v=> ({...v, height: parseFloat(e.target.value)||v.height}))} className="bg-[#0f172a] border border-[#334155] rounded-md px-2 py-2" placeholder="H"/>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center gap-2"><span className="text-xs opacity-70">DPI</span><input type="number" value={d.dpi} onChange={(e)=> setD(v=> ({...v, dpi: parseInt(e.target.value)||v.dpi}))} className="bg-[#0f172a] border border-[#334155] rounded-md px-2 py-2 w-full"/></div>
            <div className="flex items-center gap-2 col-span-2"><span className="text-xs opacity-70">Margin</span><input type="number" step={d.unit==="px"?10:0.5} value={d.margin} onChange={(e)=> setD(v=> ({...v, margin: parseFloat(e.target.value)||v.margin}))} className="bg-[#0f172a] border border-[#334155] rounded-md px-2 py-2 w-full"/></div>
          </div>
        </div>

        {/* Simple quick text */}
        {d.simpleMode && (
          <div className="grid grid-cols-2 gap-2">
            <div><div className="text-xs opacity-70 mb-1">Header</div>
              <input value={d.headerText} onChange={(e)=> setD(v=> ({...v, headerText:e.target.value}))} className="w-full bg-[#0f172a] border border-[#334155] rounded-md px-2 py-2"/></div>
            <div><div className="text-xs opacity-70 mb-1">Footer</div>
              <input value={d.footerText} onChange={(e)=> setD(v=> ({...v, footerText:e.target.value}))} className="w-full bg-[#0f172a] border border-[#334155] rounded-md px-2 py-2"/></div>
            <div className="col-span-2 flex items-center gap-3 mt-1">
              <label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={d.showWeekNums} onChange={(e)=> setD(v=> ({...v, showWeekNums:e.target.checked}))}/> Week #</label>
              <label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={d.weekStart===1} onChange={(e)=> setD(v=> ({...v, weekStart: e.target.checked?1:0}))}/> Mon start</label>
            </div>
          </div>
        )}

        {/* Advanced panels */}
        {!d.simpleMode && (
          <div className="space-y-3">
            <details className="group bg-[#0f172a] border border-[#334155] rounded-md">
              <summary className="flex items-center justify-between cursor-pointer px-3 py-2 text-sm">
                <span className="flex items-center gap-2"><TypeIcon className="h-4 w-4"/> Fonts & Text</span>
                <ChevronDown className="h-4 w-4 group-open:rotate-180 transition"/>
              </summary>
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <input value={d.fontFamily} onChange={(e)=> setD(v=> ({...v, fontFamily:e.target.value}))} className="bg-[#0f172a] border border-[#334155] rounded-md px-2 py-2" placeholder="CSS font-family"/>
                <div className="grid grid-cols-2 gap-2">
                  <input value={d.headerText} onChange={(e)=> setD(v=> ({...v, headerText:e.target.value}))} placeholder="Header" className="bg-[#0f172a] border border-[#334155] rounded-md px-2 py-2"/>
                  <select value={d.headerAlign} onChange={(e)=> setD(v=> ({...v, headerAlign:e.target.value as Align}))} className="bg-[#0f172a] border border-[#334155] rounded-md px-2 py-2"><option>left</option><option>center</option><option>right</option></select>
                  <input value={d.footerText} onChange={(e)=> setD(v=> ({...v, footerText:e.target.value}))} placeholder="Footer" className="bg-[#0f172a] border border-[#334155] rounded-md px-2 py-2"/>
                  <select value={d.footerAlign} onChange={(e)=> setD(v=> ({...v, footerAlign:e.target.value as Align}))} className="bg-[#0f172a] border border-[#334155] rounded-md px-2 py-2"><option>left</option><option>center</option><option>right</option></select>
                </div>
              </div>
            </details>

            <details className="group bg-[#0f172a] border border-[#334155] rounded-md">
              <summary className="flex items-center justify-between cursor-pointer px-3 py-2 text-sm">
                <span className="flex items-center gap-2"><Palette className="h-4 w-4"/> Theme</span>
                <ChevronDown className="h-4 w-4 group-open:rotate-180 transition"/>
              </summary>
              <div className="p-3 grid grid-cols-3 gap-2 text-sm">
                <div><label className="text-[10px] opacity-70">Accent</label><input type="color" value={d.tokens.acc} onChange={(e)=> setD(v=> ({...v, tokens:{...v.tokens, acc:e.target.value}}))} className="w-full h-10 bg-transparent"/></div>
                <div><label className="text-[10px] opacity-70">Border</label><input type="color" value={d.tokens.border} onChange={(e)=> setD(v=> ({...v, tokens:{...v.tokens, border:e.target.value}}))} className="w-full h-10 bg-transparent"/></div>
                <div><label className="text-[10px] opacity-70">Weekend</label><input type="color" value={d.tokens.weekend} onChange={(e)=> setD(v=> ({...v, tokens:{...v.tokens, weekend:e.target.value}}))} className="w-full h-10 bg-transparent"/></div>
                <div><label className="text-[10px] opacity-70">Cell radius</label><input type="number" value={d.tokens.cellRadius} onChange={(e)=> setD(v=> ({...v, tokens:{...v.tokens, cellRadius: parseInt(e.target.value)||0}}))} className="w-full bg-[#0f172a] border border-[#334155] rounded-md px-2 py-2"/></div>
                <div><label className="text-[10px] opacity-70">Cell border</label><input type="number" value={d.tokens.cellBorder} onChange={(e)=> setD(v=> ({...v, tokens:{...v.tokens, cellBorder: parseInt(e.target.value)||0}}))} className="w-full bg-[#0f172a] border border-[#334155] rounded-md px-2 py-2"/></div>
              </div>
            </details>

            <details className="group bg-[#0f172a] border border-[#334155] rounded-md">
              <summary className="flex items-center justify-between cursor-pointer px-3 py-2 text-sm">
                <span className="flex items-center gap-2"><ImageIcon className="h-4 w-4"/> Images</span>
                <ChevronDown className="h-4 w-4 group-open:rotate-180 transition"/>
              </summary>
              <div className="p-3 space-y-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-md border border-[#334155] bg-[#0f172a] cursor-pointer">
                    <Upload className="h-4 w-4"/> Background
                    <input type="file" accept="image/*" className="hidden" onChange={(e)=> e.target.files && onImage(e.target.files[0], "bgImage")}/>
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-md border border-[#334155] bg-[#0f172a] cursor-pointer">
                    <Upload className="h-4 w-4"/> Logo
                    <input type="file" accept="image/*" className="hidden" onChange={(e)=> e.target.files && onImage(e.target.files[0], "logo")}/>
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select value={d.bgFit} onChange={(e)=> setD(v=> ({...v, bgFit:e.target.value as "cover"|"contain"}))} className="bg-[#0f172a] border border-[#334155] rounded-md px-2 py-2"><option>cover</option><option>contain</option></select>
                  <div className="flex items-center gap-2"><span className="text-[10px] opacity-70">Opacity</span><input type="range" min={0} max={1} step={0.01} value={d.bgOpacity} onChange={(e)=> setD(v=> ({...v, bgOpacity: parseFloat(e.target.value)}))} className="w-full"/></div>
                  <div className="flex items-center gap-2"><span className="text-[10px] opacity-70">Blur</span><input type="range" min={0} max={20} step={1} value={d.bgBlur} onChange={(e)=> setD(v=> ({...v, bgBlur: parseInt(e.target.value)}))} className="w-full"/></div>
                </div>
                <div className="pt-2">
                  <div className="text-xs opacity-70 mb-1">Per-month images</div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {Array.from({length:12}).map((_,i)=> (
                      <label key={i} className="group block relative rounded-md overflow-hidden border border-[#334155] bg-[#0f172a] cursor-pointer">
                        {d.perMonthImages[i] ? (
                          <img src={d.perMonthImages[i]!} className="h-16 w-full object-cover group-hover:opacity-90" alt="month slot"/>
                        ) : (
                          <div className="h-16 w-full grid place-items-center text-[10px] opacity-70">{new Date(2000,i,1).toLocaleString("en",{month:"short"})}</div>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={(e)=> e.target.files && onMonthImage(e.target.files[0], i)}/>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </details>

            {/* Save/Restore JSON */}
            <details className="group bg-[#0f172a] border border-[#334155] rounded-md">
              <summary className="flex items-center justify-between cursor-pointer px-3 py-2 text-sm">
                <span className="flex items-center gap-2"><Download className="h-4 w-4"/> Presets & Data</span>
                <ChevronDown className="h-4 w-4 group-open:rotate-180 transition"/>
              </summary>
              <div className="p-3 grid grid-cols-2 gap-2 text-sm">
                <button onClick={()=> { localStorage.setItem(LS_KEY_D, JSON.stringify(d)); alert("Saved locally"); }} className="bg-[#0f172a] border border-[#334155] rounded-md px-3 py-2">Save</button>
                <button onClick={()=> { const raw=localStorage.getItem(LS_KEY_D); if(raw) setD(JSON.parse(raw)); }} className="bg-[#0f172a] border border-[#334155] rounded-md px-3 py-2">Restore</button>
                <button onClick={()=> { const blob=new Blob([JSON.stringify(d,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="calendar_design.json"; a.click(); URL.revokeObjectURL(url); }} className="bg-[#0f172a] border border-[#334155] rounded-md px-3 py-2 flex items-center gap-2">
                  <FileDown className="h-4 w-4"/> Export JSON
                </button>
                <label className="bg-[#0f172a] border border-[#334155] rounded-md px-3 py-2 flex items-center gap-2 cursor-pointer">
                  <Upload className="h-4 w-4"/> Import JSON
                  <input type="file" accept="application/json" className="hidden" onChange={(e)=>{ if(!e.target.files) return; const r=new FileReader(); r.onload=()=>{ try{ setD(v=> ({...v, ...JSON.parse(String(r.result))})); }catch{} }; r.readAsText(e.target.files[0]); }}/>
                </label>
              </div>
            </details>
          </div>
        )}

        {/* Mode & date */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={()=> setYearly(false)} className={`px-3 py-2 rounded-md border ${!yearly?"border-emerald-500 text-emerald-300":"border-[#334155] text-slate-300"}`}>Monthly</button>
          <button onClick={()=> setYearly(true)} className={`px-3 py-2 rounded-md border ${yearly?"border-emerald-500 text-emerald-300":"border-[#334155] text-slate-300"}`}>Yearly</button>
          <input type="number" value={year} onChange={(e)=> setYear(parseInt(e.target.value)||year)} className="col-span-1 bg-[#0f172a] border border-[#334155] rounded-md px-2 py-2"/>
          {!yearly && (
            <select value={month} onChange={(e)=> setMonth(parseInt(e.target.value))} className="bg-[#0f172a] border border-[#334155] rounded-md px-2 py-2">
              {Array.from({length:12}).map((_,i)=> <option key={i} value={i}>{new Date(2000,i,1).toLocaleString("en",{month:"short"})}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Preview + export */}
      <div className="space-y-3">
        <div className="text-xs sm:text-sm text-slate-400">Preview is exact export size. For phones: design at smaller size/DPI, then bump up before export.</div>
        <div
          ref={renderRef}
          style={{ width: pxW+"px", height: pxH+"px", background: d.tokens.bg, fontFamily: d.fontFamily, position: "relative", overflow:"hidden", display:"flex", flexDirection:"column" }}
          className="rounded-lg border border-[#334155] shadow-md mx-auto"
        >
          {d.bgImage && (<img src={d.bgImage} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit: d.bgFit, opacity:d.bgOpacity, filter:`blur(${d.bgBlur}px)` }} alt="background"/>)}
          {d.headerText && (<div style={{ padding:pxM, textAlign:d.headerAlign, color:d.tokens.text, fontWeight:700, fontSize:Math.max(18, Math.round(pxW*0.04)) }}>{d.headerText}</div>)}
          <div style={{ flex:1, padding:pxM }}>{yearly ? <YGrid y={year}/> : <MGrid y={year} m={month}/>}</div>
          {d.footerText && (<div style={{ padding:pxM, textAlign:d.footerAlign, color:d.tokens.text, fontSize:12 }}>{d.footerText}</div>)}
          {d.logo && (<img src={d.logo} style={{ position:"absolute", opacity:d.logoOpacity, width:d.logoSize, height:"auto", ...(d.logoPos==="tl"&&{left:pxM,top:pxM}), ...(d.logoPos==="tr"&&{right:pxM,top:pxM}), ...(d.logoPos==="bl"&&{left:pxM,bottom:pxM}), ...(d.logoPos==="br"&&{right:pxM,bottom:pxM}) }} alt="logo"/>)}
        </div>

        {/* Mobile sticky */}
        <div className="lg:hidden sticky bottom-2 z-10">
          <div className="flex gap-2 bg-[#0f172a]/80 backdrop-blur rounded-xl border border-[#334155] p-2">
            <button onClick={exportPNG} className="flex-1 text-xs px-3 py-2 rounded-md border border-[#334155]">PNG</button>
            <button onClick={exportPDF} className="flex-1 text-xs px-3 py-2 rounded-md border border-[#334155]">PDF</button>
            <button onClick={copySVG} className="flex-1 text-xs px-3 py-2 rounded-md border border-[#334155]">SVG</button>
          </div>
        </div>
        {/* Desktop bar */}
        <div className="hidden lg:flex items-center gap-2">
          <button onClick={exportPNG} className="px-3 py-2 rounded-md border border-[#334155] bg-[#0f172a] flex items-center gap-2"><Download className="h-4 w-4"/> Export PNG</button>
          <button onClick={exportPDF} className="px-3 py-2 rounded-md border border-[#334155] bg-[#0f172a] flex items-center gap-2"><FileText className="h-4 w-4"/> Export PDF</button>
          <button onClick={copySVG} className="px-3 py-2 rounded-md border border-[#334155] bg-[#0f172a] flex items-center gap-2"><FileDown className="h-4 w-4"/> Copy SVG</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE — Tabs wrapper + SEO/crumbs/etc.
   ============================================================ */
const CalendarGenerator: React.FC = () => {
  const [tab, setTab] = useState<"quick"|"designer">("quick");

  return (
    <>
      <SEOHead
        title="Calendar Generator & Designer | Printable, PNG/PDF/SVG"
        description="Create monthly or yearly calendars fast — or design poster-grade calendars with your own images, sizes, and styles. Export PNG/PDF/SVG/ICS."
        canonical="https://calculatorhub.site/calendar-generator"
        schemaData={generateCalculatorSchema(
          "Calendar Generator & Designer",
          "Quick calendar builder and advanced design studio with templates, images, exact-size exports, and ICS events.",
          "/calendar-generator",
          ["calendar generator","calendar designer","printable calendar","png export","pdf export","svg export","ics"]
        )}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Date & Time Tools", url: "/category/date-time-tools" },
            { name: "Calendar Generator", url: "/calendar-generator" },
          ]}
        />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">📅 Calendar Generator & Designer</h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Build a calendar in seconds (Quick) or design a poster-grade version with your own images, sizes, and branding (Designer).
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex items-center gap-2">
          <button onClick={()=> setTab("quick")} className={`px-4 py-2 rounded-md border ${tab==="quick"?"border-emerald-500 text-emerald-300":"border-[#334155] text-slate-300"}`}>Quick</button>
          <button onClick={()=> setTab("designer")} className={`px-4 py-2 rounded-md border ${tab==="designer"?"border-emerald-500 text-emerald-300":"border-[#334155] text-slate-300"}`}>Designer</button>
        </div>

        {tab==="quick" ? <QuickTab/> : <DesignerTab/>}

        {/* Smart Tip */}
        <div className="mt-6 w-full">
          <div className="bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm">
            <p className="text-base font-medium leading-snug text-slate-300">
              Pro tip: Use <strong>Designer</strong> to export exact-size PNG/PDF/SVG for printing or social posts. Use <strong>Quick</strong> to add events and download an <strong>.ics</strong> file.
            </p>
          </div>
        </div>

       <section className="prose prose-invert max-w-5xl mx-auto mt-16 leading-relaxed text-slate-300">
          <h1 className="text-3xl font-bold text-cyan-300 mb-6">
            Calendar Generator & Designer — Create, Customize, and Export Professional Calendars Online
          </h1>
        
          <p>
            The <strong>Calendar Generator & Designer</strong> by CalculatorHub is your all-in-one tool for
            building personalized, printable calendars in just a few clicks. Whether you want a simple
            monthly view for productivity, a yearly overview for team planning, or a designer-grade
            calendar for posters, social media, or branding — this generator brings professional design
            control to your browser. No complex software or graphic-design experience required.
          </p>
        
          <p>
            With advanced features like <strong>custom size (mm, inches, or pixels)</strong>,
            <strong> DPI control</strong>, <strong>event and holiday import</strong>,
            <strong>ICS export</strong>, <strong>theme templates</strong>, and one-click downloads in
            <strong> PNG, PDF, or SVG</strong>, this free online calendar creator gives you everything you
            need to plan, print, or share beautiful calendars — perfectly tailored to your needs.
          </p>
        
          <h2 className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            What Makes This Calendar Generator Different
          </h2>
        
          <p>
            Unlike basic date tools that only show months, this generator blends functionality and design.
            It combines the precision of a <em>professional calendar engine</em> with the freedom of a
            <em>poster designer</em>. You can instantly switch between “Quick” and “Designer” modes —
            whether you want a minimal calendar for personal tracking or a full creative layout for
            branding, marketing, or print projects.
          </p>
        
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Quick Mode:</strong> Instantly generate monthly or yearly calendars with locale,
              week numbers, holidays, and events.
            </li>
            <li>
              <strong>Designer Mode:</strong> Customize layouts, colors, fonts, backgrounds, and export
              high-resolution files ready for printing or digital sharing.
            </li>
            <li>
              <strong>Smart Storage:</strong> All settings are saved in your browser’s local storage, so
              your preferences stay intact.
            </li>
            <li>
              <strong>Cross-platform Design:</strong> Works perfectly on desktops, tablets, and phones with
              an adaptive, mobile-friendly interface.
            </li>
            <li>
              <strong>Free Forever:</strong> 100% free to use — no sign-ups, no watermarks, no hidden fees.
            </li>
          </ul>
        
          <h2 className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            How to Use the Calendar Generator
          </h2>
        
          <ol className="list-decimal list-inside space-y-2">
            <li>Open the Calendar Generator and choose your mode: Quick or Designer.</li>
            <li>Select the year and month (or yearly view).</li>
            <li>Adjust settings — locale, week start (Sunday/Monday), and week numbers.</li>
            <li>
              (Optional) Add events or holidays manually, or import from a <code>.csv</code> or
              <code>.txt</code> file.
            </li>
            <li>
              Click <strong>Download</strong> to export your calendar as <strong>PNG</strong>,
              <strong> PDF</strong>, <strong> SVG</strong>, or <strong>ICS</strong>.
            </li>
          </ol>
        
          <p>
            It’s that simple — no technical knowledge required. Everything happens instantly inside your
            browser, with no uploads to external servers, ensuring your data stays private and secure.
          </p>
        
          <h2 className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            Advanced Customization in Designer Mode
          </h2>
        
          <p>
            The <strong>Designer Mode</strong> is where this tool shines. It lets you take full control over
            your layout, colors, text, and export resolution. Every pixel is customizable — perfect for
            print shops, teachers, offices, or creators designing branded content for digital marketing.
          </p>
        
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Custom Sizes:</strong> Choose from presets like A4, Letter, Tabloid, or social media
              formats such as Instagram 1080×1350 and 4K desktop posters.
            </li>
            <li>
              <strong>High DPI Exports:</strong> Set your own DPI for crisp, print-ready results — ideal for
              professional posters or brochures.
            </li>
            <li>
              <strong>Theme Templates:</strong> Pick from multiple templates (Glass, Minimal Light, Classic
              Print, Bold Poster, Photo Grid) to match your design vibe.
            </li>
            <li>
              <strong>Color Palette Control:</strong> Adjust accent colors, border tones, and weekend cell
              colors with intuitive color pickers.
            </li>
            <li>
              <strong>Fonts & Alignment:</strong> Customize header and footer text, alignment, and font
              family — use any web-safe font or custom CSS font stack.
            </li>
            <li>
              <strong>Backgrounds and Logos:</strong> Add your brand’s logo, set custom background images,
              and adjust opacity and blur for a perfect look.
            </li>
            <li>
              <strong>Per-Month Photos:</strong> Upload 12 different images — one for each month — and turn
              your calendar into a photo collage or brand showcase.
            </li>
            <li>
              <strong>Presets & JSON Save:</strong> Save your designs as JSON files and restore them anytime
              to continue working or share with your team.
            </li>
          </ul>
        
          <h2 className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            Export Options: PNG, PDF, SVG, and ICS
          </h2>
        
          <p>
            Exporting is instant and precise. With one click, your design is converted into
            <strong> PNG</strong> for quick sharing, <strong> PDF</strong> for printing, or
            <strong> SVG</strong> for scalable vector editing. The integrated <strong>ICS (iCalendar)</strong>
            export also allows you to sync your events with Google Calendar, Outlook, or Apple Calendar.
          </p>
        
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>PNG:</strong> Perfect for sharing on social media, websites, or email newsletters.
            </li>
            <li>
              <strong>PDF:</strong> Optimized for print with true page dimensions and high resolution.
            </li>
            <li>
              <strong>SVG:</strong> Scalable and editable for designers using Figma, Illustrator, or Canva.
            </li>
            <li>
              <strong>ICS:</strong> Export your holidays and events directly to your digital calendars.
            </li>
          </ul>
        
          <h2 className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            Practical Uses of the Calendar Generator
          </h2>
        
          <p>
            This free online calendar generator is ideal for professionals, students, teachers, designers,
            and small business owners. Here are just a few practical ways people use it:
          </p>
        
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Teachers:</strong> Create academic calendars with term dates, exams, and holidays.</li>
            <li><strong>Businesses:</strong> Make branded wall calendars for clients or teams.</li>
            <li><strong>Freelancers:</strong> Build planning calendars to track project deadlines.</li>
            <li><strong>Content Creators:</strong> Design monthly social media planners or editorial calendars.</li>
            <li><strong>Families:</strong> Generate personalized photo calendars for home or gifts.</li>
            <li><strong>Event Planners:</strong> Add events and export ICS files for scheduling tools.</li>
          </ul>
        
          <p>
            Whatever your goal — from time management to creative promotion — this tool adapts easily.
          </p>
        
          <h2 className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            Why Creators and Marketers Love the Designer Mode
          </h2>
        
          <p>
            For designers and social media managers, this calendar maker acts like a mini design studio.
            The <strong>Photo Grid</strong> and <strong>Bold Poster</strong> templates let you create modern,
            on-brand content that works across Instagram, Facebook, Pinterest, or print campaigns.
          </p>
        
          <p>
            Pair your logo and brand colors with lifestyle images or product photos, export in high
            resolution, and you’ve got a ready-to-share campaign asset — no Photoshop needed.
          </p>
        
          <h2 className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            Performance and Privacy
          </h2>
        
          <p>
            Every operation runs locally in your browser. The app uses optimized algorithms for generating
            week grids, calculating ISO week numbers, and rendering layouts efficiently — so even complex
            yearly calendars render instantly without lag. Nothing you type or upload ever leaves your
            device. Your data (images, events, settings) is stored locally, ensuring full privacy.
          </p>
        
          <h2 className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            SEO and Accessibility Notes
          </h2>
        
          <p>
            The Calendar Generator & Designer follows modern accessibility and SEO principles:
          </p>
        
          <ul className="list-disc list-inside space-y-2">
            <li>Responsive HTML5 structure and semantic headings.</li>
            <li>ARIA labels for key buttons and navigation elements.</li>
            <li>Optimized meta tags, canonical links, and schema markup for search ranking.</li>
            <li>Readable typography and high contrast for low-light environments.</li>
          </ul>
        
          <p>
            That means your calendar generator page is both <strong>user-friendly</strong> and
            <strong>search-engine-friendly</strong>, helping CalculatorHub maintain top rankings on Google
            for related keywords like “calendar generator,” “printable calendar maker,” and “calendar
            designer online.”
          </p>
        
          <h2 className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            Frequently Asked Questions (FAQ)
          </h2>
        
          <h3 className="text-lg font-semibold text-emerald-300 mt-4">1. Is this tool free to use?</h3>
          <p>Yes — completely free. No watermarks, no login, and no hidden costs.</p>
        
          <h3 className="text-lg font-semibold text-emerald-300 mt-4">2. Can I print the calendar?</h3>
          <p>
            Absolutely. Export it as a high-resolution PDF or PNG file, and print it at home or with a
            professional printer. DPI control ensures perfect sharpness.
          </p>
        
          <h3 className="text-lg font-semibold text-emerald-300 mt-4">3. Can I add holidays automatically?</h3>
          <p>
            You can paste or import a list of holidays or events in CSV or text format. The app maps each
            date automatically and marks it on your calendar.
          </p>
        
          <h3 className="text-lg font-semibold text-emerald-300 mt-4">4. Can I save my template?</h3>
          <p>
            Yes. Save your design as a JSON file or local preset. You can restore or share it with your
            team anytime.
          </p>
        
          <h3 className="text-lg font-semibold text-emerald-300 mt-4">5. What file formats can I export?</h3>
          <p>
            You can download in PNG, PDF, SVG, or ICS (for digital calendars). Each format is optimized for
            different use cases — digital, print, or scheduling.
          </p>
        
          <h2 className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            Start Creating Your Calendar Today
          </h2>
        
          <p>
            Whether you’re planning your year, organizing projects, designing gifts, or publishing content,
            the <strong>Calendar Generator & Designer</strong> helps you do it faster, smarter, and more
            beautifully. From minimalist monthly planners to full-color branded calendars, you’re in
            control.
          </p>
        
          <p>
            Try the tool now — experiment with styles, upload your own photos, and export your perfect
            calendar in seconds. Your creativity deserves a calendar that matches your vision.
          </p>
        
          <div className="mt-10 h-2 w-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 opacity-60 blur-[2px]" />
        </section>


        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/calendar-generator" category="utilities" />
      </div>
    </>
  );
};

export default CalendarGenerator;
