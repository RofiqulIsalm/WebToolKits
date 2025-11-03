// src/pages/TimezoneConverter.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Globe2,
  Clock4,
  Plus,
  Minus,
  RotateCcw,
  Share2,
  Copy,
  ChevronDown,
  ChevronUp,
  Info,
  Briefcase,
  SunMedium,
  Moon,
  ArrowUpDown
} from "lucide-react";

import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import RelatedCalculators from "../components/RelatedCalculators";
import { generateCalculatorSchema } from "../utils/seoData";

/* ============================================================
   📦 Constants & Utilities
   ============================================================ */
const LS_KEY = "timezone_converter_state_v2";
const URL_KEY = "tzc2";

type TzRow = { id: string; tz: string };
type Preset = { name: string; zones: string[] };

const COMMON_ZONES: string[] = [
  "UTC","Asia/Dhaka","Asia/Kolkata","Asia/Dubai","Asia/Singapore","Asia/Tokyo",
  "Asia/Hong_Kong","Asia/Shanghai","Asia/Seoul","Europe/London","Europe/Paris",
  "Europe/Berlin","Europe/Madrid","Europe/Amsterdam","Europe/Rome","Europe/Stockholm",
  "Europe/Oslo","Europe/Copenhagen","Europe/Helsinki","Europe/Zurich","Africa/Cairo",
  "Africa/Johannesburg","America/New_York","America/Chicago","America/Denver",
  "America/Los_Angeles","America/Toronto","America/Mexico_City","America/Sao_Paulo",
  "Australia/Sydney","Australia/Melbourne","Pacific/Auckland",
];

const PRESETS: Preset[] = [
  { name: "UTC + My Zone", zones: ["UTC"] },
  { name: "US + EU Core", zones: ["America/Los_Angeles","America/New_York","Europe/London","Europe/Berlin"] },
  { name: "US + EU + APAC", zones: ["America/Los_Angeles","America/New_York","Europe/London","Europe/Berlin","Asia/Singapore","Asia/Tokyo"] },
];

const uid = () => Math.random().toString(36).slice(2, 8);

const two = (n: number) => String(n).padStart(2, "0");
const fmt = (d: Date, timeZone: string, withSeconds = false) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone, year:"numeric", month:"short", day:"2-digit", weekday:"short",
    hour:"2-digit", minute:"2-digit", second: withSeconds ? "2-digit" : undefined, hour12: false,
  }).format(d);

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
    const withOffset = new Intl.DateTimeFormat("en-US", {
      timeZone, hour:"2-digit", minute:"2-digit", hour12:false, timeZoneName:"shortOffset",
    }).format(atUtc);
    const parsed = parseOffsetMinutesFromParts(withOffset);
    if (parsed !== null) return parsed;
  } catch {}
  try {
    const withShort = new Intl.DateTimeFormat("en-US", {
      timeZone, hour:"2-digit", minute:"2-digit", hour12:false, timeZoneName:"short",
    }).format(atUtc);
    const parsed = parseOffsetMinutesFromParts(withShort);
    if (parsed !== null) return parsed;
  } catch {}
  return null;
}
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
function offsetLabel(timeZone: string, atUtc: Date): string {
  const mins = getOffsetMinutes(timeZone, atUtc);
  if (mins === null) return "UTC±?";
  const sign = mins >= 0 ? "+" : "-";
  const abs = Math.abs(mins);
  const hh = two(Math.floor(abs / 60));
  const mm = two(abs % 60);
  return `UTC${sign}${hh}:${mm}`;
}
function deltaFromBase(baseTZ: string, targetTZ: string, atUtc: Date): string {
  const b = getOffsetMinutes(baseTZ, atUtc) ?? 0;
  const t = getOffsetMinutes(targetTZ, atUtc) ?? 0;
  const diff = t - b;
  const sign = diff >= 0 ? "+" : "-";
  const abs = Math.abs(diff);
  return `${sign}${two(Math.floor(abs/60))}:${two(abs%60)}`;
}
function dayChip(dateInTz: Date, baseInTzStr: string): "Yesterday" | "Today" | "Tomorrow" | "" {
  // baseInTzStr is something like "Mon, Jan 01, 14:00"—we just compare dates via ISO
  // Simpler: compare UTC date parts; acceptable since we only show relative hint.
  const b = new Date(baseInTzStr);
  if (Number.isNaN(b.getTime())) return "";
  const dz = (d: Date) => `${d.getUTCFullYear()}-${two(d.getUTCMonth()+1)}-${two(d.getUTCDate())}`;
  const t = dz(dateInTz); const bb = dz(b);
  if (t === bb) return "Today";
  const tDate = new Date(Date.UTC(dateInTz.getUTCFullYear(), dateInTz.getUTCMonth(), dateInTz.getUTCDate()));
  const bDate = new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()));
  const diff = (tDate.getTime() - bDate.getTime()) / 86_400_000;
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return "";
}

/* ============================================================
   🧮 Component
   ============================================================ */
const TimezoneConverter: React.FC = () => {
  // Base
  const defaultZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Dhaka";
  const [baseZone, setBaseZone] = useState<string>(defaultZone);
  const [baseLocal, setBaseLocal] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${two(now.getMonth()+1)}-${two(now.getDate())}T${two(now.getHours())}:${two(now.getMinutes())}`;
  });
  const [useNow, setUseNow] = useState<boolean>(true);
  const [durationMin, setDurationMin] = useState<number>(60); // meeting length
  const [workStart, setWorkStart] = useState<string>("09:00");
  const [workEnd, setWorkEnd] = useState<string>("18:00");
  const [showWorking, setShowWorking] = useState<boolean>(true);
  const [sortByLocal, setSortByLocal] = useState<boolean>(false);

  // Targets
  const [rows, setRows] = useState<TzRow[]>([
    { id: uid(), tz: "UTC" },
    { id: uid(), tz: "Europe/London" },
    { id: uid(), tz: "America/New_York" },
    { id: uid(), tz: "Asia/Tokyo" },
  ]);

  // UI
  const [copied, setCopied] = useState<"none"|"results"|"link">("none");
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [activeTip, setActiveTip] = useState<number>(0);
  const [hydrated, setHydrated] = useState<boolean>(false);

  const isDefault =
    useNow && durationMin === 60 && showWorking && workStart==="09:00" && workEnd==="18:00" &&
    rows.length===4 &&
    rows[0].tz==="UTC" && rows[1].tz==="Europe/London" && rows[2].tz==="America/New_York" && rows[3].tz==="Asia/Tokyo";

  /* 🔁 Load & persist */
  const applyState = (s:any) => {
    setBaseZone(s.baseZone || defaultZone);
    setBaseLocal(s.baseLocal || baseLocal);
    setUseNow(!!s.useNow);
    setDurationMin(Number.isFinite(s.durationMin) ? s.durationMin : 60);
    setWorkStart(s.workStart || "09:00");
    setWorkEnd(s.workEnd || "18:00");
    setShowWorking(s.showWorking ?? true);
    setSortByLocal(Boolean(s.sortByLocal));
    if (Array.isArray(s.rows)) setRows(s.rows.map((r:any)=>({ id: r.id || uid(), tz: r.tz || "UTC" })));
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
      const state = { baseZone, baseLocal, useNow, durationMin, workStart, workEnd, showWorking, sortByLocal, rows };
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {}
  }, [hydrated, baseZone, baseLocal, useNow, durationMin, workStart, workEnd, showWorking, sortByLocal, rows]);
  useEffect(() => {
    if (!hydrated) return;
    try {
      const url = new URL(window.location.href);
      if (isDefault) {
        url.searchParams.delete(URL_KEY);
      } else {
        const state = { baseZone, baseLocal, useNow, durationMin, workStart, workEnd, showWorking, sortByLocal, rows: rows.map(({tz})=>({tz})) };
        url.searchParams.set(URL_KEY, btoa(JSON.stringify(state)));
      }
      window.history.replaceState({}, "", url);
    } catch {}
  }, [hydrated, baseZone, baseLocal, useNow, durationMin, workStart, workEnd, showWorking, sortByLocal, rows, isDefault]);

  /* 🧠 Conversion */
  const baseStartUTC: Date = useMemo(() => {
    if (useNow) return new Date();
    return interpretAsZonedUTC(baseLocal, baseZone);
  }, [useNow, baseLocal, baseZone]);
  const baseEndUTC: Date = useMemo(() => new Date(baseStartUTC.getTime() + durationMin*60_000), [baseStartUTC, durationMin]);

  const results = useMemo(() => {
    const list = rows.map((r) => {
      const startStr = fmt(baseStartUTC, r.tz);
      const endStr = fmt(baseEndUTC, r.tz);
      const offset = offsetLabel(r.tz, baseStartUTC);
      const delta = deltaFromBase(baseZone, r.tz, baseStartUTC);

      // Build day chip relative to base local date
      const basePreview = fmt(baseStartUTC, baseZone);
      const chip = dayChip(interpretAsZonedUTC(startStr.replace(",","").replace(/\s+/g," ").split(" ").slice(1).join("T").replace("T","T"), r.tz), basePreview);

      // For working hours check
      let inWorking = true;
      if (showWorking) {
        const within = (tStr: string) => {
          // Parse "Wed, Jan 01, 09:30" to HH:mm via regex; simpler: use split
          const tm = tStr.match(/(\d{2}):(\d{2})/);
          if (!tm) return false;
          const hh = parseInt(tm[1], 10);
          const mm = parseInt(tm[2], 10);
          const [wsH, wsM] = workStart.split(":").map((n)=>parseInt(n,10));
          const [weH, weM] = workEnd.split(":").map((n)=>parseInt(n,10));
          const cur = hh*60 + mm; const ws = wsH*60 + wsM; const we = weH*60 + weM;
          return cur >= ws && cur <= we;
        };
        inWorking = within(startStr) && within(endStr);
      }

      return {
        id: r.id,
        tz: r.tz,
        label: r.tz,
        start: startStr,
        end: endStr,
        offset,
        delta,
        chip,
        inWorking
      };
    });
    if (!sortByLocal) return list;
    return [...list].sort((a,b)=> a.start.localeCompare(b.start));
  }, [rows, baseStartUTC, baseEndUTC, baseZone, workStart, workEnd, showWorking, sortByLocal]);

  const basePreview = useMemo(() => `${fmt(baseStartUTC, baseZone)} → ${fmt(baseEndUTC, baseZone)}  (${offsetLabel(baseZone, baseStartUTC)})`, [baseStartUTC, baseEndUTC, baseZone]);

  /* 💡 Tips */
  const tips = useMemo(()=>[
    "Tip: Use duration to see meeting end times for each city.",
    "Tip: Toggle working-hours to find a slot that’s fair for everyone.",
    "Tip: Sort by local time to quickly see who’s earliest/latest.",
    "Tip: Copy results or share the link—your exact scenario is preserved.",
    "Tip: Add your timezone first, then apply a preset to compare quickly.",
  ],[]);
  useEffect(()=>{ const id = setInterval(()=>setActiveTip(p=>(p+1)%tips.length), 5000); return ()=>clearInterval(id); },[tips.length]);

  /* 🔗 Actions */
  const copyResults = async () => {
    const lines = [
      "Timezone Converter",
      `Base: ${baseZone} — ${basePreview}`,
      `Working hours: ${showWorking ? `${workStart}-${workEnd}` : "Off"}`,
      "",
      ...results.map(r => `${r.tz.padEnd(25)}  ${r.start} → ${r.end}  (${r.offset}, Δ${r.delta})${r.chip?`  [${r.chip}]`:""}${showWorking? (r.inWorking ? "  ✅ working" : "  🌙 off") : ""}`)
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied("results"); setTimeout(()=>setCopied("none"),1500);
  };
  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    const state = { baseZone, baseLocal, useNow, durationMin, workStart, workEnd, showWorking, sortByLocal, rows: rows.map(({tz})=>({tz})) };
    url.searchParams.set(URL_KEY, btoa(JSON.stringify(state)));
    await navigator.clipboard.writeText(url.toString());
    setCopied("link"); setTimeout(()=>setCopied("none"),1500);
  };

  const addRow = (tz = "Europe/Paris") => setRows(rs => [...rs, { id: uid(), tz }]);
  const removeRow = (id: string) => setRows(rs => rs.filter(r => r.id !== id));
  const updateRow = (id: string, tz: string) => setRows(rs => rs.map(r => r.id===id?{...r, tz}:r));
  const addPreset = (p: Preset) => {
    const mine = new Set(rows.map(r=>r.tz));
    const toAdd = p.zones.filter(z=>!mine.has(z));
    if (p.name.includes("My Zone") && !mine.has(baseZone)) toAdd.unshift(baseZone);
    setRows(rs => [...rs, ...toAdd.map(z=>({ id: uid(), tz: z }))]);
  };

  const reset = () => {
    setBaseZone(defaultZone);
    const now = new Date();
    setBaseLocal(`${now.getFullYear()}-${two(now.getMonth()+1)}-${two(now.getDate())}T${two(now.getHours())}:${two(now.getMinutes())}`);
    setUseNow(true);
    setDurationMin(60);
    setWorkStart("09:00");
    setWorkEnd("18:00");
    setShowWorking(true);
    setSortByLocal(false);
    setRows([
      { id: uid(), tz: "UTC" },
      { id: uid(), tz: "Europe/London" },
      { id: uid(), tz: "America/New_York" },
      { id: uid(), tz: "Asia/Tokyo" },
    ]);
    localStorage.removeItem(LS_KEY);
  };

  /* ============================================================
     🎨 Render
     ============================================================ */
  return (
    <>
      <SEOHead
        title="Timezone Converter | Meeting Planner with Working Hours & Duration"
        description="Convert times across timezones with DST, meeting duration, working-hours highlights, presets, sort-by-local, and shareable link."
        canonical="https://calculatorhub.site/timezone-converter"
        schemaData={generateCalculatorSchema(
          "Timezone Converter",
          "Plan meetings across cities with duration, work-hour highlighting, and DST-safe conversions.",
          "/timezone-converter",
          ["timezone converter","meeting planner","world clock","UTC offset","DST"]
        )}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs items={[{ name: "Utilities", url: "/category/utilities" }, { name: "Timezone Converter", url: "/timezone-converter" }]} />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">🌍 Timezone Converter (Meeting-friendly)</h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Pick a base time & duration; we’ll show every city’s <strong>start → end</strong>, whether it’s within <strong>working hours</strong>, the
            <strong> day difference</strong> (Today/Tomorrow/Yesterday), and the <strong>offset vs base</strong>.
          </p>
        </div>

        {/* Promo bar */}
        <div className="hidden sm:flex mt-6 mb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white rounded-lg shadow-lg p-4 items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-lg">Plan meetings across the globe 🕘</p>
            <p className="text-sm text-indigo-100">Try Age, Percentage, and Average tools next!</p>
          </div>
          <a href="/category/utilities" className="bg-white text-indigo-700 font-semibold px-4 py-2 rounded-md hover:bg-indigo-50 transition">
            Explore Utilities
          </a>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 relative text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-sky-400" /> Base Settings
              </h2>
              <button onClick={reset} className="flex items-center gap-1 text-sm text-slate-300 border border-[#334155] rounded-lg px-2 py-1 hover:bg-[#0f172a] hover:text-white transition" disabled={isDefault}>
                <RotateCcw className="h-4 w-4 text-indigo-400" /> Reset
              </button>
            </div>

            <div className="space-y-5">
              {/* Base Zone (with datalist) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">Base Timezone</label>
                  <Info className="h-4 w-4 text-slate-400" title="The zone used to interpret the base time below." />
                </div>
                <input
                  list="tz-list"
                  value={baseZone}
                  onChange={(e)=>setBaseZone(e.target.value)}
                  className="w-full bg-[#0f172a] text-white text-sm px-3 py-2 border border-[#334155] rounded-md focus:ring-2 focus:ring-indigo-500"
                />
                <datalist id="tz-list">
                  {[defaultZone, ...COMMON_ZONES.filter(z=>z!==defaultZone)].map(z=> <option key={z} value={z} />)}
                </datalist>
              </div>

              {/* Time + use now */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">Base Start Time</label>
                  <div className="flex items-center gap-2">
                    <input id="usenow" type="checkbox" checked={useNow} onChange={(e)=>setUseNow(e.target.checked)} className="h-4 w-4" />
                    <label htmlFor="usenow" className="text-sm text-slate-300">Use current time</label>
                  </div>
                </div>
                <input
                  type="datetime-local"
                  value={baseLocal}
                  onChange={(e)=>setBaseLocal(e.target.value)}
                  disabled={useNow}
                  className={`w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500 ${useNow ? "opacity-60 cursor-not-allowed" : ""}`}
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Meeting Duration (minutes)</label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={durationMin}
                  onChange={(e)=>setDurationMin(Math.max(5, parseInt(e.target.value)||60))}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-400 mt-2">Base: <span className="text-indigo-300 font-medium">{basePreview}</span></p>
              </div>

              {/* Working hours */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="flex items-center gap-2">
                  <input id="showWork" type="checkbox" checked={showWorking} onChange={(e)=>setShowWorking(e.target.checked)} className="h-4 w-4" />
                  <label htmlFor="showWork" className="text-sm text-slate-300 flex items-center gap-1"><Briefcase className="h-4 w-4 text-emerald-400"/> Highlight working hours</label>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Start</label>
                  <input type="time" value={workStart} onChange={(e)=>setWorkStart(e.target.value)} className="w-full bg-[#0f172a] text-white px-3 py-2 border border-[#334155] rounded-md"/>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">End</label>
                  <input type="time" value={workEnd} onChange={(e)=>setWorkEnd(e.target.value)} className="w-full bg-[#0f172a] text-white px-3 py-2 border border-[#334155] rounded-md"/>
                </div>
              </div>

              {/* Presets */}
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">Quick add presets</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={()=>addRow(baseZone)} className="text-xs bg-[#0f172a] border border-[#334155] rounded px-2 py-1 hover:border-indigo-500">+ My Zone</button>
                  <button onClick={()=>addRow("UTC")} className="text-xs bg-[#0f172a] border border-[#334155] rounded px-2 py-1 hover:border-indigo-500">+ UTC</button>
                  {PRESETS.map(p=>(
                    <button key={p.name} onClick={()=>addPreset(p)} className="text-xs bg-[#0f172a] border border-[#334155] rounded px-2 py-1 hover:border-indigo-500">
                      + {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Converted Times</h2>
              <button
                onClick={()=>setSortByLocal(s=>!s)}
                className="flex items-center gap-2 text-xs bg-[#0f172a] border border-[#334155] rounded px-2 py-1 hover:border-indigo-500"
                title="Sort by local start time"
              >
                <ArrowUpDown className="h-3.5 w-3.5" /> {sortByLocal ? "Sorted by local" : "Keep order"}
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-[#334155] shadow-inner">
              <table className="min-w-full text-sm text-slate-100">
                <thead className="bg-[#0f172a]">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-indigo-300">Timezone</th>
                    <th className="text-left px-4 py-3 font-semibold text-emerald-300">Start → End</th>
                    <th className="text-left px-4 py-3 font-semibold text-cyan-300">UTC Offset</th>
                    <th className="text-left px-4 py-3 font-semibold text-fuchsia-300">Δ vs Base</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.id} className={`transition-colors duration-200 ${r.inWorking ? "bg-[#183024]/40" : "even:bg-[#1e293b]/60 odd:bg-[#0f172a]/60"} hover:bg-[#3b82f6]/10`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {r.inWorking ? <SunMedium className="h-4 w-4 text-emerald-400" /> : <Moon className="h-4 w-4 text-slate-400" />}
                          <input
                            list="tz-list"
                            value={r.tz}
                            onChange={(e)=>updateRow(r.id, e.target.value)}
                            className="bg-[#0f172a] text-white text-xs px-2 py-1 border border-[#334155] rounded-md focus:ring-2 focus:ring-indigo-500 w-44"
                          />
                        </div>
                        {r.chip && (
                          <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full border ${r.chip==="Today"?"text-emerald-300 border-emerald-500/30": r.chip==="Tomorrow"?"text-sky-300 border-sky-500/30":"text-rose-300 border-rose-500/30"}`}>
                            {r.chip}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">
                        {r.start} <span className="text-slate-500">→</span> {r.end}
                        {showWorking && (
                          <span className={`ml-2 text-[11px] px-1.5 py-0.5 rounded ${r.inWorking ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30" : "bg-slate-700/40 text-slate-300 border border-slate-600/40"}`}>
                            {r.inWorking ? "Working hrs" : "Off hrs"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-cyan-300">{r.offset}</td>
                      <td className="px-4 py-3 text-fuchsia-300">{r.delta}</td>
                      <td className="px-4 py-3">
                        <button onClick={()=>removeRow(r.id)} className="inline-flex items-center gap-1 text-xs text-slate-300 border border-[#334155] rounded px-2 py-1 hover:text-white hover:bg-[#0f172a]">
                          <Minus className="h-3 w-3" /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {results.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-400 italic">Add a city to see converted time.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={()=>addRow()} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md text-sm">
                <Plus size={16} /> Add City
              </button>
              <button onClick={copyResults} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm">
                <Copy size={16} /> Copy Results
              </button>
              <button onClick={copyShareLink} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm">
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

        {/* Details (collapsible) */}
        <div className="mt-10 bg-gradient-to-br from-[#1e293b] via-[#111827] to-[#0f172a] rounded-2xl border border-indigo-600/40 shadow-xl overflow-hidden">
          <button
            onClick={()=>setShowDetails(v=>!v)}
            className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold text-lg tracking-wide hover:opacity-90 transition-all"
          >
            <span>🧩 How this converter works</span>
            {showDetails ? <ChevronUp /> : <ChevronDown />}
          </button>

          {showDetails && (
            <div className="px-6 pb-8 pt-4 space-y-3 text-slate-200">
              <p>
                The base datetime is interpreted in <strong>{baseZone}</strong>, converted to a precise <strong>UTC instant</strong>,
                then displayed in each city (DST aware). Duration lets you preview <strong>end times</strong> across zones.
                Working-hours highlighting uses your configured window (<code>{workStart}–{workEnd}</code>) to quickly judge fairness.
              </p>
              <p className="text-slate-300 text-sm">
                Pro tip: sort by local time to spot who’s earliest/late-night, or toggle working-hours off for pure conversion.
              </p>
              <div className="h-2 w-full mt-6 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 blur-[2px]" />
            </div>
          )}
        </div>

        {/* Short SEO content */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          <h1 className="text-3xl font-bold text-cyan-400 mb-6">Timezone Converter – Meeting Planner People Love</h1>
          <p>
            Convert times, visualize end times with duration, and spot friendly hours at a glance. Share a link that restores
            your exact scenario, or copy a clean text summary for invites or notes.
          </p>
        </section>

        {/* Backlinks */}
        <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">🚀 Explore more tools on CalculatorHub:</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link to="/percentage-calculator" className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200">% Percentage Calculator</Link>
              <Link to="/average-calculator" className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-400 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200">📊 Average Calculator</Link>
              <Link to="/age-calculator" className="flex items-center gap-2 bg-[#0f172a] hover:bg-pink-600/20 text-pink-300 hover:text-pink-400 px-3 py-2 rounded-md border border-slate-700 hover:border-pink-500 transition-all duration-200">🎂 Age Calculator</Link>
            </div>
          </div>
        </section>

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/timezone-converter" category="utilities" />
      </div>
    </>
  );
};

export default TimezoneConverter;
