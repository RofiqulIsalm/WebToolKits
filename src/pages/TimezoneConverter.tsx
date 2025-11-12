// src/pages/TimezoneConverter.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Globe2,
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
  ArrowUpDown,
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
  "UTC",
  "Asia/Dhaka",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Seoul",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Amsterdam",
  "Europe/Rome",
  "Europe/Stockholm",
  "Europe/Oslo",
  "Europe/Copenhagen",
  "Europe/Helsinki",
  "Europe/Zurich",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
];

const PRESETS: Preset[] = [
  { name: "UTC + My Zone", zones: ["UTC"] },
  {
    name: "US + EU Core",
    zones: ["America/Los_Angeles", "America/New_York", "Europe/London", "Europe/Berlin"],
  },
  {
    name: "US + EU + APAC",
    zones: [
      "America/Los_Angeles",
      "America/New_York",
      "Europe/London",
      "Europe/Berlin",
      "Asia/Singapore",
      "Asia/Tokyo",
    ],
  },
];

const uid = () => Math.random().toString(36).slice(2, 8);
const two = (n: number) => String(n).padStart(2, "0");

/** ✅ Robust TZ validator — prevents RangeError crashes while typing */
function isValidTimeZone(tz: string): boolean {
  try {
    if (!tz || typeof tz !== "string") return false;
    // Will throw RangeError for invalid zones
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** ✅ Safe formatter — never throws; falls back to UTC */
function fmtSafe(d: Date, timeZone: string, withSeconds = false): string {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: isValidTimeZone(timeZone) ? timeZone : "UTC",
    year: "numeric",
    month: "short",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined,
    hour12: false,
  };
  try {
    return new Intl.DateTimeFormat("en-US", opts).format(d);
  } catch {
    // absolute last-resort fallback
    return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: "UTC" }).format(d);
  }
}

function parseOffsetMinutesFromParts(str: string): number | null {
  const m = str.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
  if (!m) return null;
  const sign = m[1] === "-" ? -1 : 1;
  const hh = parseInt(m[2] || "0", 10);
  const mm = parseInt(m[3] || "0", 10);
  return sign * (hh * 60 + mm);
}

function getOffsetMinutes(timeZone: string, atUtc: Date): number | null {
  const safeTz = isValidTimeZone(timeZone) ? timeZone : "UTC";
  try {
    const withOffset = new Intl.DateTimeFormat("en-US", {
      timeZone: safeTz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZoneName: "shortOffset",
    }).format(atUtc);
    const parsed = parseOffsetMinutesFromParts(withOffset);
    if (parsed !== null) return parsed;
  } catch {}
  try {
    const withShort = new Intl.DateTimeFormat("en-US", {
      timeZone: safeTz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZoneName: "short",
    }).format(atUtc);
    const parsed = parseOffsetMinutesFromParts(withShort);
    if (parsed !== null) return parsed;
  } catch {}
  return null;
}

function interpretAsZonedUTC(localStr: string, timeZone: string): Date {
  const [datePart, timePart] = localStr.split("T");
  const [y, m, d] = (datePart || "").split("-").map((n) => parseInt(n, 10));
  const [H, M] = (timePart || "00:00").split(":").map((n) => parseInt(n, 10));
  const safeTz = isValidTimeZone(timeZone) ? timeZone : "UTC";
  const refine = (guessUtcMs: number) => {
    const offsetMin = getOffsetMinutes(safeTz, new Date(guessUtcMs)) ?? 0;
    return Date.UTC(y || 1970, (m || 1) - 1, d || 1, H || 0, M || 0) - offsetMin * 60_000;
  };
  const wallUTC = Date.UTC(y || 1970, (m || 1) - 1, d || 1, H || 0, M || 0, 0, 0);
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
  return `${sign}${two(Math.floor(abs / 60))}:${two(abs % 60)}`;
}

function dayChip(dateInTz: Date, baseInTzStr: string): "Yesterday" | "Today" | "Tomorrow" | "" {
  const b = new Date(baseInTzStr);
  if (Number.isNaN(b.getTime())) return "";
  const dz = (d: Date) =>
    `${d.getUTCFullYear()}-${two(d.getUTCMonth() + 1)}-${two(d.getUTCDate())}`;
  const t = dz(dateInTz);
  const bb = dz(b);
  if (t === bb) return "Today";
  const tDate = new Date(
    Date.UTC(dateInTz.getUTCFullYear(), dateInTz.getUTCMonth(), dateInTz.getUTCDate())
  );
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
  const defaultZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Dhaka";
  const [baseZone, setBaseZone] = useState<string>(defaultZone);
  const [baseLocal, setBaseLocal] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(
      now.getDate()
    )}T${two(now.getHours())}:${two(now.getMinutes())}`;
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
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [activeTip, setActiveTip] = useState<number>(0);
  const [hydrated, setHydrated] = useState<boolean>(false);

  const isDefault =
    useNow &&
    durationMin === 60 &&
    showWorking &&
    workStart === "09:00" &&
    workEnd === "18:00" &&
    rows.length === 4 &&
    rows[0].tz === "UTC" &&
    rows[1].tz === "Europe/London" &&
    rows[2].tz === "America/New_York" &&
    rows[3].tz === "Asia/Tokyo";

  /* 🔁 Load & persist */
  const applyState = (s: any) => {
    setBaseZone(s.baseZone || defaultZone);
    setBaseLocal(s.baseLocal || baseLocal);
    setUseNow(!!s.useNow);
    setDurationMin(Number.isFinite(s.durationMin) ? s.durationMin : 60);
    setWorkStart(s.workStart || "09:00");
    setWorkEnd(s.workEnd || "18:00");
    setShowWorking(s.showWorking ?? true);
    setSortByLocal(Boolean(s.sortByLocal));
    if (Array.isArray(s.rows))
      setRows(
        s.rows.map((r: any) => ({ id: r.id || uid(), tz: r.tz || "UTC" }))
      );
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
      const state = {
        baseZone,
        baseLocal,
        useNow,
        durationMin,
        workStart,
        workEnd,
        showWorking,
        sortByLocal,
        rows,
      };
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {}
  }, [
    hydrated,
    baseZone,
    baseLocal,
    useNow,
    durationMin,
    workStart,
    workEnd,
    showWorking,
    sortByLocal,
    rows,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const url = new URL(window.location.href);
      if (isDefault) {
        url.searchParams.delete(URL_KEY);
      } else {
        const state = {
          baseZone,
          baseLocal,
          useNow,
          durationMin,
          workStart,
          workEnd,
          showWorking,
          sortByLocal,
          rows: rows.map(({ tz }) => ({ tz })),
        };
        url.searchParams.set(URL_KEY, btoa(JSON.stringify(state)));
      }
      window.history.replaceState({}, "", url);
    } catch {}
  }, [
    hydrated,
    baseZone,
    baseLocal,
    useNow,
    durationMin,
    workStart,
    workEnd,
    showWorking,
    sortByLocal,
    rows,
    isDefault,
  ]);

  /* 🧠 Conversion (always use safe TZs internally) */
  const safeBaseZone = isValidTimeZone(baseZone) ? baseZone : "UTC";

  const baseStartUTC: Date = useMemo(() => {
    if (useNow) return new Date();
    return interpretAsZonedUTC(baseLocal, safeBaseZone);
  }, [useNow, baseLocal, safeBaseZone]);

  const baseEndUTC: Date = useMemo(
    () => new Date(baseStartUTC.getTime() + durationMin * 60_000),
    [baseStartUTC, durationMin]
  );

  const results = useMemo(() => {
    const list = rows.map((r) => {
      const tz = isValidTimeZone(r.tz) ? r.tz : "UTC"; // per-row safety
      const startStr = fmtSafe(baseStartUTC, tz);
      const endStr = fmtSafe(baseEndUTC, tz);
      const offset = offsetLabel(tz, baseStartUTC);
      const delta = deltaFromBase(safeBaseZone, tz, baseStartUTC);

      // Base preview (safe)
      const basePreviewLocal = fmtSafe(baseStartUTC, safeBaseZone);

      // Day chip (approx — keep as original logic)
      const chip = dayChip(
        interpretAsZonedUTC(
          // Extract ISO-like string "YYYY-MM-DDTHH:MM" from display if possible.
          // If parsing fails, interpretAsZonedUTC will still handle and return a Date.
          (() => {
            const m = startStr.match(
              /([A-Z][a-z]{2}),\s([A-Z][a-z]{2})\s(\d{2}),\s(\d{2}):(\d{2})/
            );
            // Build a best-effort ISO if matched; fallback to now to avoid crashes.
            if (m) {
              const monthMap: Record<string, string> = {
                Jan: "01",
                Feb: "02",
                Mar: "03",
                Apr: "04",
                May: "05",
                Jun: "06",
                Jul: "07",
                Aug: "08",
                Sep: "09",
                Oct: "10",
                Nov: "11",
                Dec: "12",
              };
              const month = monthMap[m[2]] || "01";
              const day = m[3];
              const HH = m[4];
              const MM = m[5];
              const y = baseStartUTC.getFullYear();
              return `${y}-${month}-${day}T${HH}:${MM}`;
            }
            // fallback to baseLocal pattern if needed
            return baseLocal;
          })(),
          tz
        ),
        basePreviewLocal
      );

      // Working hours check
      let inWorking = true;
      if (showWorking) {
        const within = (tStr: string) => {
          const tm = tStr.match(/(\d{2}):(\d{2})/);
          if (!tm) return false;
          const hh = parseInt(tm[1], 10);
          const mm = parseInt(tm[2], 10);
          const [wsH, wsM] = workStart.split(":").map((n) => parseInt(n, 10));
          const [weH, weM] = workEnd.split(":").map((n) => parseInt(n, 10));
          const cur = hh * 60 + mm;
          const ws = wsH * 60 + wsM;
          const we = weH * 60 + weM;
          return cur >= ws && cur <= we;
        };
        inWorking = within(startStr) && within(endStr);
      }

      return {
        id: r.id,
        tz,
        label: r.tz, // keep the user-visible string (even if invalid we show what they typed)
        start: startStr,
        end: endStr,
        offset,
        delta,
        chip,
        inWorking,
        isInvalid: !isValidTimeZone(r.tz),
      };
    });
    if (!sortByLocal) return list;
    return [...list].sort((a, b) => a.start.localeCompare(b.start));
  }, [
    rows,
    baseStartUTC,
    baseEndUTC,
    safeBaseZone,
    workStart,
    workEnd,
    showWorking,
    sortByLocal,
    baseLocal,
  ]);

  const basePreview = useMemo(
    () =>
      `${fmtSafe(baseStartUTC, safeBaseZone)} → ${fmtSafe(
        baseEndUTC,
        safeBaseZone
      )}  (${offsetLabel(safeBaseZone, baseStartUTC)})`,
    [baseStartUTC, baseEndUTC, safeBaseZone]
  );

  /* 💡 Tips */
  const tips = useMemo(
    () => [
      "Tip: Use duration to see meeting end times for each city.",
      "Tip: Toggle working-hours to find a slot that’s fair for everyone.",
      "Tip: Sort by local time to quickly see who’s earliest/latest.",
      "Tip: Copy results or share the link—your exact scenario is preserved.",
      "Tip: Add your timezone first, then apply a preset to compare quickly.",
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
      "Timezone Converter",
      `Base: ${safeBaseZone} — ${basePreview}`,
      `Working hours: ${showWorking ? `${workStart}-${workEnd}` : "Off"}`,
      "",
      ...results.map((r) =>
        `${(r.label || r.tz).padEnd(25)}  ${r.start} → ${r.end}  (${
          r.offset
        }, Δ${r.delta})${r.chip ? `  [${r.chip}]` : ""}${
          showWorking ? (r.inWorking ? "  ✅ working" : "  🌙 off") : ""
        }${r.isInvalid ? "  ⚠ invalid tz (shown in UTC)" : ""}`
      ),
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    const state = {
      baseZone,
      baseLocal,
      useNow,
      durationMin,
      workStart,
      workEnd,
      showWorking,
      sortByLocal,
      rows: rows.map(({ tz }) => ({ tz })),
    };
    url.searchParams.set(URL_KEY, btoa(JSON.stringify(state)));
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  const addRow = (tz = "Europe/Paris") =>
    setRows((rs) => [...rs, { id: uid(), tz }]);
  const removeRow = (id: string) =>
    setRows((rs) => rs.filter((r) => r.id !== id));
  const updateRow = (id: string, tz: string) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, tz } : r)));
  const addPreset = (p: Preset) => {
    const mine = new Set(rows.map((r) => r.tz));
    const toAdd = p.zones.filter((z) => !mine.has(z));
    if (p.name.includes("My Zone") && !mine.has(safeBaseZone)) toAdd.unshift(safeBaseZone);
    setRows((rs) => [...rs, ...toAdd.map((z) => ({ id: uid(), tz: z }))]);
  };

  const reset = () => {
    setBaseZone(defaultZone);
    const now = new Date();
    setBaseLocal(
      `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(
        now.getDate()
      )}T${two(now.getHours())}:${two(now.getMinutes())}`
    );
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
          description="Convert times across timezones with DST, meeting duration, working-hours highlights, presets, sorting, and a shareable link."
          keywords={[
            "timezone converter","world clock","meeting planner","time zone meeting",
            "utc offset","dst time","convert time zones","schedule across time zones",
            "asia/dhaka time","europe/london time","america/new_york time"
          ]}
          canonical="https://calculatorhub.site/timezone-converter"
          schemaData={[
            // 1) Core calculator schema (your existing helper)
            generateCalculatorSchema(
              "Timezone Converter",
              "Plan meetings across cities with duration, work-hour highlighting, and DST-safe conversions.",
              "/timezone-converter",
              ["timezone converter","meeting planner","world clock","UTC offset","DST"]
            ),
        
            // 2) WebApplication (the tool itself)
            {
              "@context":"https://schema.org",
              "@type":"WebApplication",
              "name":"Timezone Converter – CalculatorHub",
              "url":"https://calculatorhub.site/timezone-converter",
              "applicationCategory":"UtilitiesApplication",
              "operatingSystem":"Web",
              "inLanguage":"en",
              "description":"Convert times across time zones with DST, duration and working-hours highlighting.",
              "image":[
                "https://calculatorhub.site/images/timezone-converter-hero.webp",
                "https://calculatorhub.site/images/timezone-converter-preview.webp"
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
                "timezone converter","meeting across time zones","dst safe",
                "utc difference","schedule international meeting"
              ]
            },
        
            // 3) WebPage → Article (your long SEO section)
            {
              "@context":"https://schema.org",
              "@type":"WebPage",
              "mainEntity":{
                "@type":"Article",
                "headline":"Timezone Converter — schedule smarter across cities and teams",
                "description":"Translate a base time into local times worldwide, with duration, working hours and DST awareness.",
                "image":[
                  "https://calculatorhub.site/images/timezone-converter-hero.webp",
                  "https://calculatorhub.site/images/timezone-converter-preview.webp"
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
                  "What Is a Time Zone Converter?",
                  "Key Features",
                  "How to Use",
                  "Methods & Logic",
                  "Worked Examples",
                  "Working Hours",
                  "DST & Offsets",
                  "FAQ"
                ],
                "inLanguage":"en",
                "url":"https://calculatorhub.site/timezone-converter",
                "keywords":["world clock","time difference","convert time zones","dst rules"]
              }
            },
        
            // 4) FAQPage (matches your on-page FAQ)
            {
              "@context":"https://schema.org",
              "@type":"FAQPage",
              "mainEntity":[
                {
                  "@type":"Question",
                  "name":"Why use IANA zones instead of PST/IST?",
                  "acceptedAnswer":{"@type":"Answer","text":"Abbreviations are ambiguous and change with DST. IANA IDs are precise."}
                },
                {
                  "@type":"Question",
                  "name":"How are invalid zone names handled?",
                  "acceptedAnswer":{"@type":"Answer","text":"We preserve your input for editing but safely fall back to UTC, so the app never crashes."}
                },
                {
                  "@type":"Question",
                  "name":"Why do some rows show Today/Tomorrow/Yesterday?",
                  "acceptedAnswer":{"@type":"Answer","text":"They indicate cross-date-line differences relative to your base zone at that instant."}
                },
                {
                  "@type":"Question",
                  "name":"Does DST affect conversions?",
                  "acceptedAnswer":{"@type":"Answer","text":"Yes, and the converter accounts for it based on each zone’s rules at the chosen instant."}
                }
              ]
            },
        
            // 5) Breadcrumbs
            {
              "@context":"https://schema.org",
              "@type":"BreadcrumbList",
              "itemListElement":[
                {"@type":"ListItem","position":1,"name":"Home","item":"https://calculatorhub.site/"},
                {"@type":"ListItem","position":2,"name":"Date & Time Tools","item":"https://calculatorhub.site/category/date-time-tools"},
                {"@type":"ListItem","position":3,"name":"Timezone Converter","item":"https://calculatorhub.site/timezone-converter"}
              ]
            },
        
            // 6) WebSite + SearchAction
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
        
            // 7) Organization (site-wide)
            {
              "@context":"https://schema.org",
              "@type":"Organization",
              "name":"CalculatorHub",
              "url":"https://calculatorhub.site",
              "logo":"https://calculatorhub.site/images/calculatorhub-logo.webp"
            },
        
            // 8) Speakable (optional voice)
            {
              "@context":"https://schema.org",
              "@type":"SpeakableSpecification",
              "cssSelector":[".prose h1",".result-summary"]
            }
          ]}
          breadcrumbs={[
            { name: "Date & Time Tools", url: "/category/date-time-tools" },
            { name: "Timezone Converter", url: "/timezone-converter" }
          ]}
        />


      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <link rel="canonical" href="https://calculatorhub.site/timezone-converter" />
      
      <link rel="alternate" href="https://calculatorhub.site/timezone-converter" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/timezone-converter" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/timezone-converter" hreflang="x-default" />
      
      
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Timezone Converter | Meeting Planner with Working Hours & Duration" />
      <meta property="og:description" content="Convert times across timezones with DST, duration, working-hours highlights, sorting and shareable link." />
      <meta property="og:url" content="https://calculatorhub.site/timezone-converter" />
      <meta property="og:image" content="https://calculatorhub.site/images/timezone-converter-preview.webp" />
      <meta property="og:image:alt" content="Timezone Converter preview" />
      
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Timezone Converter | Meeting Planner with Working Hours & Duration" />
      <meta name="twitter:description" content="Plan meetings across cities with DST-safe conversion and business-hours highlighting." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/timezone-converter-preview.webp" />
      
      
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="theme-color" content="#6366f1" />
      
      
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
      
      
      <link rel="preload" as="image" href="/images/timezone-converter-hero.webp" />
      <link rel="preload" as="image" href="/images/timezone-converter-preview.webp" />
      
      
      <meta name="referrer" content="no-referrer-when-downgrade" />


      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Date&Time", url: "/category/date-time-tools" },
            { name: "Timezone Converter", url: "/timezone-converter" },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            🌍 Timezone Converter (Meeting-friendly)
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Pick a base time & duration; we’ll show every city’s{" "}
            <strong>start → end</strong>, whether it’s within{" "}
            <strong>working hours</strong>, the<strong> day difference</strong>{" "}
            (Today/Tomorrow/Yesterday), and the <strong>offset vs base</strong>.
          </p>

          {/* Base TZ validity hint */}
          {!isValidTimeZone(baseZone) && (
            <div className="mt-3 text-xs text-amber-300">
              ⚠ “{baseZone}” isn’t a valid IANA timezone. Falling back to{" "}
              <span className="font-semibold">UTC</span> until you pick a valid one.
            </div>
          )}
        </div>

        {/* Promo bar */}
        <div className="hidden sm:flex mt-6 mb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white rounded-lg shadow-lg p-4 items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-lg">Plan meetings across the globe 🕘</p>
            <p className="text-sm text-indigo-100">Try Age, Percentage, and Average tools next!</p>
          </div>
          <Link
            to="/category/date-time-tools"
            className="bg-white text-indigo-700 font-semibold px-4 py-2 rounded-md hover:bg-indigo-50 transition"
          >
            Explore More
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          {/* Inputs */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 relative text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-sky-400" /> Base Settings
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
              {/* Base Zone (with datalist) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">
                    Base Timezone
                  </label>
                  <Info
                    className="h-4 w-4 text-slate-400"
                    title="The zone used to interpret the base time below."
                  />
                </div>
                <input
                  list="tz-list"
                  value={baseZone}
                  onChange={(e) => setBaseZone(e.target.value)}
                  className={`w-full bg-[#0f172a] text-white text-sm px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 ${
                    isValidTimeZone(baseZone)
                      ? "border-[#334155]"
                      : "border-amber-500/50"
                  }`}
                />
                <datalist id="tz-list">
                  {[defaultZone, ...COMMON_ZONES.filter((z) => z !== defaultZone)].map(
                    (z) => (
                      <option key={z} value={z} />
                    )
                  )}
                </datalist>
              </div>

              {/* Time + use now */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">
                    Base Start Time
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="usenow"
                      type="checkbox"
                      checked={useNow}
                      onChange={(e) => setUseNow(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="usenow" className="text-sm text-slate-300">
                      Use current time
                    </label>
                  </div>
                </div>
                <input
                  type="datetime-local"
                  value={baseLocal}
                  onChange={(e) => setBaseLocal(e.target.value)}
                  disabled={useNow}
                  className={`w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                    useNow ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Meeting Duration (minutes)
                </label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={durationMin}
                  onChange={(e) =>
                    setDurationMin(Math.max(5, parseInt(e.target.value) || 60))
                  }
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-400 mt-2">
                  Base:{" "}
                  <span className="text-indigo-300 font-medium">
                    {basePreview}
                  </span>
                </p>
              </div>

              {/* Working hours */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="flex items-center gap-2">
                  <input
                    id="showWork"
                    type="checkbox"
                    checked={showWorking}
                    onChange={(e) => setShowWorking(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label
                    htmlFor="showWork"
                    className="text-sm text-slate-300 flex items-center gap-1"
                  >
                    <Briefcase className="h-4 w-4 text-emerald-400" /> Highlight
                    working hours
                  </label>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Start
                  </label>
                  <input
                    type="time"
                    value={workStart}
                    onChange={(e) => setWorkStart(e.target.value)}
                    className="w-full bg-[#0f172a] text-white px-3 py-2 border border-[#334155] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    End
                  </label>
                  <input
                    type="time"
                    value={workEnd}
                    onChange={(e) => setWorkEnd(e.target.value)}
                    className="w-full bg-[#0f172a] text-white px-3 py-2 border border-[#334155] rounded-md"
                  />
                </div>
              </div>

              {/* Presets */}
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">Quick add presets</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => addRow(safeBaseZone)}
                    className="text-xs bg-[#0f172a] border border-[#334155] rounded px-2 py-1 hover:border-indigo-500"
                  >
                    + My Zone
                  </button>
                  <button
                    onClick={() => addRow("UTC")}
                    className="text-xs bg-[#0f172a] border border-[#334155] rounded px-2 py-1 hover:border-indigo-500"
                  >
                    + UTC
                  </button>
                  {PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => addPreset(p)}
                      className="text-xs bg-[#0f172a] border border-[#334155] rounded px-2 py-1 hover:border-indigo-500"
                    >
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
                onClick={() => setSortByLocal((s) => !s)}
                className="flex items-center gap-2 text-xs bg-[#0f172a] border border-[#334155] rounded px-2 py-1 hover:border-indigo-500"
                title="Sort by local start time"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />{" "}
                {sortByLocal ? "Sorted by local" : "Keep order"}
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-[#334155] shadow-inner">
              <table className="min-w-full text-sm text-slate-100">
                <thead className="bg-[#0f172a]">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-indigo-300">
                      Timezone
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-emerald-300">
                      Start → End
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-cyan-300">
                      UTC Offset
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-fuchsia-300">
                      Δ vs Base
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr
                      key={r.id}
                      className={`transition-colors duration-200 ${
                        r.inWorking
                          ? "bg-[#183024]/40"
                          : "even:bg-[#1e293b]/60 odd:bg-[#0f172a]/60"
                      } hover:bg-[#3b82f6]/10`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {r.inWorking ? (
                            <SunMedium className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Moon className="h-4 w-4 text-slate-400" />
                          )}
                          <input
                            list="tz-list"
                            value={r.label}
                            onChange={(e) => updateRow(r.id, e.target.value)}
                            className={`bg-[#0f172a] text-white text-xs px-2 py-1 border rounded-md focus:ring-2 focus:ring-indigo-500 w-44 ${
                              r.isInvalid ? "border-amber-500/50" : "border-[#334155]"
                            }`}
                            title={
                              r.isInvalid
                                ? "Invalid timezone — showing as UTC until fixed"
                                : r.tz
                            }
                          />
                        </div>
                        {r.chip && (
                          <span
                            className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full border ${
                              r.chip === "Today"
                                ? "text-emerald-300 border-emerald-500/30"
                                : r.chip === "Tomorrow"
                                ? "text-sky-300 border-sky-500/30"
                                : "text-rose-300 border-rose-500/30"
                            }`}
                          >
                            {r.chip}
                          </span>
                        )}
                        {r.isInvalid && (
                          <div className="mt-1 text-[10px] text-amber-300">
                            ⚠ Invalid timezone — using UTC for this row
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">
                        {r.start} <span className="text-slate-500">→</span> {r.end}
                        {showWorking && (
                          <span
                            className={`ml-2 text-[11px] px-1.5 py-0.5 rounded ${
                              r.inWorking
                                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                                : "bg-slate-700/40 text-slate-300 border border-slate-600/40"
                            }`}
                          >
                            {r.inWorking ? "Working hrs" : "Off hrs"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-cyan-300">{r.offset}</td>
                      <td className="px-4 py-3 text-fuchsia-300">{r.delta}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeRow(r.id)}
                          className="inline-flex items-center gap-1 text-xs text-slate-300 border border-[#334155] rounded px-2 py-1 hover:text-white hover:bg-[#0f172a]"
                        >
                          <Minus className="h-3 w-3" /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {results.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-slate-400 italic"
                      >
                        Add a city to see converted time.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => addRow()}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md text-sm"
              >
                <Plus size={16} /> Add City
              </button>
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
              <p className="text-base font-medium leading-snug text-slate-300">
                {tips[activeTip]}
              </p>
            </div>
          </div>
        </div>

        {/* Details (collapsible) */}
        <div className="mt-10 bg-gradient-to-br from-[#1e293b] via-[#111827] to-[#0f172a] rounded-2xl border border-indigo-600/40 shadow-xl overflow-hidden">
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold text-lg tracking-wide hover:opacity-90 transition-all"
          >
            <span>🧩 How this converter works</span>
            {showDetails ? <ChevronUp /> : <ChevronDown />}
          </button>

          {showDetails && (
            <div className="px-6 pb-8 pt-4 space-y-3 text-slate-200">
              <p>
                The base datetime is interpreted in{" "}
                <strong>{safeBaseZone}</strong>, converted to a precise{" "}
                <strong>UTC instant</strong>, then displayed in each city (DST
                aware). Duration lets you preview <strong>end times</strong> across
                zones. Working-hours highlighting uses your configured window (
                <code>
                  {workStart}–{workEnd}
                </code>
                ) to quickly judge fairness.
              </p>
              <p className="text-slate-300 text-sm">
                Pro tip: sort by local time to spot who’s earliest/late-night, or
                toggle working-hours off for pure conversion.
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
              <li><a href="#what-is-tz" className="text-indigo-300 hover:underline">What Is a Time Zone Converter?</a></li>
              <li><a href="#features" className="text-indigo-300 hover:underline">Key Features</a></li>
              <li><a href="#how-to-use" className="text-indigo-300 hover:underline">How to Use</a></li>
              <li><a href="#methods" className="text-indigo-300 hover:underline">Methods & Logic Under the Hood</a></li>
              <li><a href="#examples" className="text-indigo-300 hover:underline">Worked Examples</a></li>
              <li><a href="#working-hours" className="text-indigo-300 hover:underline">Working-Hours Planning</a></li>
              <li><a href="#dst" className="text-indigo-300 hover:underline">DST, Offsets & Day Chips</a></li>
              <li><a href="#performance" className="text-indigo-300 hover:underline">Performance & Stability</a></li>
              <li><a href="#pitfalls" className="text-indigo-300 hover:underline">Common Pitfalls to Avoid</a></li>
              <li><a href="#use-cases" className="text-indigo-300 hover:underline">Real-World Use Cases</a></li>
              <li><a href="#quick-ref" className="text-indigo-300 hover:underline">Quick Reference (Popular Zones & Tips)</a></li>
              <li><a href="#glossary" className="text-indigo-300 hover:underline">Glossary</a></li>
              <li><a href="#faq" className="text-indigo-300 hover:underline">FAQ</a></li>
            </ol>
          </nav>
        
          {/* ===== What is a TZ Converter? ===== */}
          <h1 id="what-is-tz" className="text-3xl font-bold text-indigo-300 mb-6">
            Time Zone Converter — schedule smarter across cities and teams
          </h1>
          <p>
            A <strong>time zone converter</strong> translates a date and time from one city’s local time into the local
            time of other cities worldwide. This tool goes beyond basic conversion: it lets you set a
            <strong> base time</strong>, add a <strong>duration</strong>, highlight <strong>working hours</strong>,
            compare <strong>UTC offsets</strong>, and see whether a target time falls on <em>Today</em>,
            <em>Tomorrow</em>, or <em>Yesterday</em> relative to your base. It’s ideal for remote teams,
            client calls, webinars, global interviews, and travel planning—anywhere time zones and
            daylight saving changes can create confusion.
          </p>
          <p>
            Under the hood, the converter interprets your base time in a valid <strong>IANA time zone</strong>
            (e.g., <code>Asia/Dhaka</code>, <code>Europe/London</code>, <code>America/New_York</code>), converts it
            to an exact <strong>UTC instant</strong>, and then renders that instant in each selected city—accurately
            reflecting <strong>DST rules</strong> and offset differences at that moment in time.
          </p>
        
          {/* ===== Features ===== */}
          <h2 id="features" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            ✨ Key features
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Base time + duration:</strong> pick a start, add a meeting length, and see <em>start → end</em> everywhere.</li>
            <li><strong>Working-hours highlighting:</strong> color cues indicate whether a slot falls inside each city’s window.</li>
            <li><strong>Day chips:</strong> instant labels (<em>Yesterday/Today/Tomorrow</em>) signal cross-date-line shifts.</li>
            <li><strong>UTC offset & Δ vs base:</strong> view each zone’s offset and the difference relative to your base zone.</li>
            <li><strong>Sort by local time:</strong> order rows by each city’s local start to see who’s earliest/latest.</li>
            <li><strong>Presets & quick add:</strong> one-click buttons for common regions; add your zone and UTC instantly.</li>
            <li><strong>Shareable link:</strong> the entire scenario is encoded in the URL so anyone can load the same view.</li>
            <li><strong>Robust IANA validation:</strong> invalid inputs are safely downgraded to UTC with a gentle warning—no crashes.</li>
          </ul>
        
          {/* ===== How to Use ===== */}
          <h2 id="how-to-use" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">🧭 How to use</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li><strong>Choose Base Timezone:</strong> start typing a valid IANA ID (e.g., <code>Europe/Berlin</code>, <code>Asia/Tokyo</code>) and pick from suggestions.</li>
            <li><strong>Set Base Time:</strong> either use the current time or enter a specific date/time via the picker.</li>
            <li><strong>Add Duration:</strong> specify minutes to preview end times in every city.</li>
            <li><strong>Toggle Working Hours:</strong> pick a start/end (e.g., 09:00–18:00) to highlight each city’s business window.</li>
            <li><strong>Add Cities:</strong> click presets or “Add City” and type a zone. Invalid zones show a warning and default to UTC.</li>
            <li><strong>Sort or Share:</strong> sort by local time to review fairness, copy results, or copy the shareable link.</li>
          </ol>
          <p className="text-sm text-slate-400">Tip: Use the <em>Δ vs Base</em> column to adjust agendas and assign speakers fairly.</p>
        
          {/* ===== Methods & Logic ===== */}
          <h2 id="methods" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🔧 Methods & logic under the hood
          </h2>
          <h3 className="text-xl font-semibold text-indigo-300">1) Safe IANA validation</h3>
          <p>
            The converter validates zone IDs by attempting to construct a <code>Intl.DateTimeFormat</code> with
            that <code>timeZone</code>. Invalid IDs raise a RangeError; we catch it and fall back to <strong>UTC</strong>
            while preserving your input in the field so you can correct typos without page breakage.
          </p>
        
          <h3 className="text-xl font-semibold text-indigo-300 mt-6">2) Base time → UTC instant</h3>
          <p>
            Your base <code>datetime-local</code> is interpreted within the selected base zone to produce an exact
            UTC timestamp. That instant is the common reference used to render the local time in every target zone.
          </p>
        
          <h3 className="text-xl font-semibold text-indigo-300 mt-6">3) Accurate offsets & DST</h3>
          <p>
            For each zone, the tool asks the formatting engine for a short offset at the UTC instant
            (e.g., <code>UTC+05:30</code>) and uses it to display the correct local time—even during <strong>DST transitions</strong>
            or when two cities shift on different dates.
          </p>
        
          <h3 className="text-xl font-semibold text-indigo-300 mt-6">4) Working-hours labeling</h3>
          <p>
            The start and end times in each city are compared against your configured window (e.g., 09:00–18:00).
            A compact badge indicates whether the slot is inside or outside local business hours at both ends.
          </p>
        
          <h3 className="text-xl font-semibold text-indigo-300 mt-6">5) Day chips & relative day</h3>
          <p>
            The display includes an at-a-glance chip (<em>Yesterday</em>, <em>Today</em>, <em>Tomorrow</em>)
            by comparing calendar dates between the base and each target city at the same UTC instant.
          </p>
        
          {/* ===== Worked Examples ===== */}
          <h2 id="examples" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🧪 Worked examples
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Team stand-up:</strong> Base <code>Europe/London</code>, 30 minutes. Compare <code>America/New_York</code>, <code>Asia/Singapore</code>, and <code>Australia/Sydney</code> to find a humane overlap.</li>
            <li><strong>Client demo:</strong> Base <code>Asia/Dhaka</code>, 60 minutes. Add <code>Europe/Paris</code> and <code>America/Chicago</code>; sort by local time to see who is earliest/late.</li>
            <li><strong>Release window:</strong> Base <code>UTC</code>, 120 minutes. Ensure the deployment falls within <em>Working hrs</em> for both <code>Asia/Tokyo</code> and <code>America/Los_Angeles</code>.</li>
            <li><strong>Travel call:</strong> Base <code>America/Los_Angeles</code>, 45 minutes. Add <code>Pacific/Auckland</code> to check if it slips to <em>Tomorrow</em>.</li>
          </ul>
        
          {/* ===== Working Hours ===== */}
          <h2 id="working-hours" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            👜 Planning with working-hours windows
          </h2>
          <p>
            Working hours vary by company and region. Set a general window (e.g., 09:00–18:00) and use the color badges
            to negotiate fair slots. If the badge reads <em>Off hrs</em> for a city, consider shifting by the <em>Δ vs Base</em>
            value or rotating meeting times weekly to spread the inconvenience.
          </p>
        
          {/* ===== DST ===== */}
          <h2 id="dst" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            ⏰ Daylight Saving Time, offsets & day chips
          </h2>
          <p>
            DST can cause a city’s offset to jump (e.g., <code>UTC−08:00 → UTC−07:00</code>). Because this converter renders a
            specific moment in time, it always shows the <em>correct local clock</em> for that instant—no manual math required.
            The <strong>Day chip</strong> guards against surprises around the International Date Line, indicating whether a target
            city is a day behind or ahead of the base.
          </p>
        
          {/* ===== Performance ===== */}
          <h2 id="performance" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🚀 Performance & stability
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Safe formatting:</strong> invalid zones are handled gracefully (fallback to UTC).</li>
            <li><strong>Local persistence:</strong> your scenario saves in the browser, and the URL encodes state for sharing.</li>
            <li><strong>Scalable UI:</strong> add many rows; sort by local time to maintain clarity.</li>
          </ul>
        
          {/* ===== Pitfalls ===== */}
          <h2 id="pitfalls" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            ⚠️ Common pitfalls & how to avoid them
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Non-IANA labels:</strong> avoid “PST,” “IST,” etc. Use canonical IANA IDs like <code>America/Los_Angeles</code> or <code>Asia/Kolkata</code>.</li>
            <li><strong>DST assumptions:</strong> never assume fixed offsets year-round; rely on the converter for the specific date.</li>
            <li><strong>Edge minutes:</strong> if a meeting ends exactly at close of business, confirm both start and end are “Working hrs.”</li>
            <li><strong>Copying raw text:</strong> when you paste results elsewhere, include the offset or Δ column for clarity.</li>
          </ul>
        
          {/* ===== Use Cases ===== */}
          <h2 id="use-cases" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🧰 Real-world use cases
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Remote stand-ups:</strong> set recurring slots that balance hardship across continents.</li>
            <li><strong>Sales demos & interviews:</strong> share the link with prospects/candidates to confirm exact local times.</li>
            <li><strong>Webinars & events:</strong> list time in multiple cities; verify DST alignment on the event date.</li>
            <li><strong>Operations & releases:</strong> align maintenance windows to on-call hours in multiple regions.</li>
            <li><strong>Travel coordination:</strong> check “Tomorrow/Yesterday” shifts before booking cross-ocean calls.</li>
          </ul>
        
          {/* ===== Quick Reference ===== */}
          <h2 id="quick-ref" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🗂️ Quick reference (popular zones & tips)
          </h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-300">
                  <th className="py-2 pr-4">Region</th>
                  <th className="py-2 pr-4">IANA Zone</th>
                  <th className="py-2 pr-4">Example Cities</th>
                  <th className="py-2">Notes</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                <tr><td>South Asia</td><td>Asia/Dhaka</td><td>Dhaka</td><td>UTC+06:00 (no DST)</td></tr>
                <tr><td>India</td><td>Asia/Kolkata</td><td>Kolkata, Mumbai</td><td>UTC+05:30 (no DST)</td></tr>
                <tr><td>UK & Ireland</td><td>Europe/London</td><td>London</td><td>UTC± (DST in summer)</td></tr>
                <tr><td>Central Europe</td><td>Europe/Berlin</td><td>Berlin, Paris, Rome</td><td>UTC+01:00 / +02:00 (DST)</td></tr>
                <tr><td>US East</td><td>America/New_York</td><td>New York, Toronto*</td><td>UTC−05:00 / −04:00 (DST)</td></tr>
                <tr><td>US West</td><td>America/Los_Angeles</td><td>Los Angeles</td><td>UTC−08:00 / −07:00 (DST)</td></tr>
                <tr><td>SEA Hub</td><td>Asia/Singapore</td><td>Singapore</td><td>UTC+08:00 (no DST)</td></tr>
                <tr><td>Japan</td><td>Asia/Tokyo</td><td>Tokyo</td><td>UTC+09:00 (no DST)</td></tr>
                <tr><td>Australia (NSW)</td><td>Australia/Sydney</td><td>Sydney</td><td>UTC+10:00 / +11:00 (DST)</td></tr>
                <tr><td>New Zealand</td><td>Pacific/Auckland</td><td>Auckland</td><td>UTC+12:00 / +13:00 (DST)</td></tr>
              </tbody>
            </table>
            <p className="text-xs text-slate-400 mt-2">
              *Some Canadian cities use different IANA zones (e.g., <code>America/Toronto</code>) with similar rules; always prefer the city’s canonical zone.
            </p>
          </div>
        
          {/* ===== Glossary ===== */}
          <h2 id="glossary" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">📚 Glossary</h2>
          <p className="space-y-2">
            <strong>IANA time zone:</strong> standardized zone IDs like <code>Europe/Paris</code>. <br/>
            <strong>UTC:</strong> Coordinated Universal Time—the global reference for civil time. <br/>
            <strong>DST:</strong> Daylight Saving Time—seasonal clock shifts observed in some regions. <br/>
            <strong>UTC offset:</strong> difference from UTC at a given instant (e.g., <code>UTC+05:30</code>). <br/>
            <strong>Δ vs Base:</strong> target zone’s offset minus base zone’s offset at the same instant. <br/>
            <strong>Local business window:</strong> hours considered “working time” in a city (configurable).
          </p>
        
          {/* ===== FAQ ===== */}
          <section className="space-y-6 mt-16">
            <h2 id="faq" className="text-3xl md:text-4xl font-bold mb-4 text-center text-indigo-200">
              ❓ Frequently Asked Questions (FAQ)
            </h2>
        
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q1: Why do you require IANA zones instead of “PST/IST”?</h3>
                <p>
                  Abbreviations are ambiguous and change with DST. IANA IDs (e.g., <code>America/Los_Angeles</code>) are precise and unambiguous.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q2: How do you handle invalid zone names?</h3>
                <p>
                  The input is preserved for editing, but calculations fall back to <strong>UTC</strong> with a small warning—no crashes or blank screens.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q3: Why do some cities show “Tomorrow” or “Yesterday”?</h3>
                <p>
                  Time zones across the International Date Line can be a day ahead/behind your base. The day chip makes this explicit.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q4: Does DST affect my conversions?</h3>
                <p>
                  Yes—and the converter accounts for it. It renders the exact local time at the chosen instant using each zone’s current rules.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q5: Can I share a scenario with my team?</h3>
                <p>
                  Use <em>Copy Link</em>. The URL encodes your base time, duration, working window, sorting, and selected zones.
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
                Specialists in time tools & scheduling UX. Last updated: <time dateTime="2025-11-10">November 10, 2025</time>.
              </p>
            </div>
          </div>
        
          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              🚀 Explore more tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/age-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-200 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
              >
                🎂 Age Calculator
              </Link>
              <Link
                to="/percentage-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-200 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
              >
                % Percentage Calculator
              </Link>
              <Link
                to="/average-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-pink-600/20 text-pink-300 hover:text-pink-200 px-3 py-2 rounded-md border border-slate-700 hover:border-pink-500 transition-all duration-200"
              >
                📊 Average Calculator
              </Link>
            </div>
          </div>
        </section>


        <AdBanner type="bottom" />
        <RelatedCalculators
          currentPath="/timezone-converter"
          category="utilities"
        />
      </div>
    </>
  );
};

export default TimezoneConverter;
