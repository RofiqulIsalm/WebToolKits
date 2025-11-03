// Countdown Timer — HH:MM:SS (with shareable links, keyboard shortcuts, progress %, copy, mute, auto‑restart, and Picture‑in‑Picture floating window)
// Drop-in replacement for: src/pages/CountdownTimer.tsx
// New features:
//  • URL presets: ?h=0&m=25&s=0&autostart=1&pop=1&mute=0  (also pinned/collapsed/x/y)
//  • Mute toggle (persisted) for the chime
//  • Auto-start on preset (toggle)
//  • Auto-restart when finished (toggle)
//  • Smarter progress bar based on initial duration
//  • Copy: time left / share link
//  • Keyboard shortcuts: Space (start/pause/resume), R (reset), 1..9 for quick presets, S (snooze) when toast visible
//  • ARIA live region on ticking numbers for better accessibility
//  • Picture-in-Picture floating mini-window that stays on top across tabs/minimized browser (Chrome/Edge 115+)

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Play, Pause, RotateCcw, Hourglass, X, Pin, PinOff, Minus, Volume2, VolumeX, Link as LinkIcon, Copy, AppWindow } from "lucide-react";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

/* =========================
   Utilities
========================= */
const pad = (n: number) => String(n).padStart(2, "0");
function formatParts(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, totalSeconds };
}
function clampInt(v: string, min = 0, max?: number) {
  const n = Math.max(min, parseInt(v || "0", 10));
  return Number.isFinite(max) ? Math.min(n, max!) : n;
}
function qsBool(search: URLSearchParams, key: string, def = false) {
  const v = search.get(key);
  if (v == null) return def;
  return v === "1" || v.toLowerCase() === "true";
}
function qsNum(search: URLSearchParams, key: string, def = 0) {
  const v = search.get(key);
  if (v == null) return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

/* =========================
   Persistence
========================= */
const LS_KEY = "countdown_timer_state_v4"; // bumped for PiP settings

type Persisted = {
  remainingMs: number;
  running: boolean;
  paused: boolean;
  endAt: number | null;
  hh: string;
  mm: string;
  ss: string;
  pop: { open: boolean; pinned: boolean; collapsed: boolean; x: number; y: number };
  settings: { mute: boolean; autoStartPreset: boolean; autoRestart: boolean };
};

const defaultPop = { open: false, pinned: true, collapsed: false, x: 0, y: 0 };
const defaultSettings = { mute: false, autoStartPreset: false, autoRestart: false };

const loadState = (): Persisted | null => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Persisted;
    return {
      remainingMs: Math.max(0, Number(s.remainingMs) || 0),
      running: !!s.running,
      paused: !!s.paused,
      endAt: s.endAt ? Number(s.endAt) : null,
      hh: (s.hh ?? "0") + "",
      mm: (s.mm ?? "0") + "",
      ss: (s.ss ?? "0") + "",
      pop: {
        open: !!s.pop?.open,
        pinned: s.pop?.pinned ?? true,
        collapsed: s.pop?.collapsed ?? false,
        x: Number.isFinite(s.pop?.x) ? (s.pop as any).x : 0,
        y: Number.isFinite(s.pop?.y) ? (s.pop as any).y : 0,
      },
      settings: {
        mute: !!s.settings?.mute,
        autoStartPreset: !!s.settings?.autoStartPreset,
        autoRestart: !!s.settings?.autoRestart,
      },
    };
  } catch {
    return null;
  }
};
const saveState = (s: Persisted) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {}
};

/* =========================
   Chime (honors mute)
========================= */
const playChime = async (muted: boolean) => {
  if (muted) return;
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    o.start();
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.setValueAtTime(1175, ctx.currentTime + 0.18);
    o.frequency.setValueAtTime(1319, ctx.currentTime + 0.36);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
    o.stop(ctx.currentTime + 0.72);
  } catch {}
};

/* =========================
   Helpers for Picture-in-Picture window
========================= */
function supportsDocumentPiP(): boolean {
  return typeof (window as any).documentPictureInPicture?.requestWindow === 'function';
}
function cloneStylesInto(targetDoc: Document) {
  const srcHead = document.head;
  const dstHead = targetDoc.head;
  // clone <link rel="stylesheet">
  srcHead.querySelectorAll("link[rel='stylesheet']").forEach((lnk) => {
    const clone = lnk.cloneNode(true) as HTMLLinkElement;
    dstHead.appendChild(clone);
  });
  // clone inline <style>
  srcHead.querySelectorAll("style").forEach((st) => {
    const clone = st.cloneNode(true) as HTMLStyleElement;
    dstHead.appendChild(clone);
  });
}

/* =========================
   Mini Pop-out (Portal) — now portable across documents/windows
========================= */
const PopOut: React.FC<{
  open: boolean;
  collapsed: boolean;
  pinned: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onTogglePin: () => void;
  onToggleCollapsed: () => void;
  onDrag: (dx: number, dy: number) => void;
  running: boolean;
  paused: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  onToggle: () => void;
  onReset: () => void;
  portalDocument?: Document; // NEW: render target doc
  eventsWindow?: Window;      // NEW: which window to attach events to
}> = ({
  open,
  collapsed,
  pinned,
  x,
  y,
  onClose,
  onTogglePin,
  onToggleCollapsed,
  onDrag,
  running,
  paused,
  days,
  hours,
  minutes,
  seconds,
  onToggle,
  onReset,
  portalDocument,
  eventsWindow,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{ dragging: boolean; sx: number; sy: number } | null>(null);

  const evWin = eventsWindow || window;
  const doc = portalDocument || document;

  useEffect(() => {
    if (!open) return;
    const onMove = (e: MouseEvent) => {
      if (!dragState.current || !ref.current) return;
      const { sx, sy } = dragState.current;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      dragState.current.sx = e.clientX;
      dragState.current.sy = e.clientY;
      onDrag(dx, dy);
    };
    const onUp = () => (dragState.current = null);
    evWin.addEventListener("mousemove", onMove);
    evWin.addEventListener("mouseup", onUp);
    return () => {
      evWin.removeEventListener("mousemove", onMove);
      evWin.removeEventListener("mouseup", onUp);
    };
  }, [open, onDrag, evWin]);

  if (!open) return null;

  const body = (
    <div
      ref={ref}
      style={{ position: "fixed", left: x, top: y, zIndex: 50 }}
      className="select-none"
    >
      <div
        onMouseDown={(e) => {
          const el = e.target as HTMLElement;
          if (el.closest("[data-draggable='true']")) {
            dragState.current = { dragging: true, sx: (e as any).clientX, sy: (e as any).clientY };
          }
        }}
        className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div
          data-draggable="true"
          className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-sky-500/15 via-fuchsia-500/15 to-emerald-500/15"
        >
          <div className="flex items-center gap-2">
            <Hourglass className="h-4 w-4 text-sky-300" />
            <span className="text-slate-100 text-sm font-semibold">Countdown</span>
            <span className="text-[11px] text-slate-400">{pinned ? "• pinned" : "• floating"}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleCollapsed}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-200"
              title={collapsed ? "Expand" : "Collapse"}
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={onTogglePin}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-200"
              title={pinned ? "Unpin (allow drag anywhere)" : "Pin"}
            >
              {pinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-200"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        {!collapsed && (
          <div className="p-3">
            <div className="text-center px-3 py-2 rounded-xl border border-sky-400/25 bg-slate-900/40" aria-live="polite">
              <div className="text-lg font-extrabold text-slate-100 tracking-wide">
                {days > 0 && <span>{days}d </span>}
                {pad(hours)}:{pad(minutes)}:{pad(seconds)}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                {paused ? "Paused" : running ? "Running" : "Ready"}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <button
                onClick={onToggle}
                className={`px-3 py-2 rounded-lg text-white text-xs font-medium ${
                  !running && !paused
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : running
                    ? "bg-amber-600 hover:bg-amber-500"
                    : "bg-sky-600 hover:bg-sky-500"
                }`}
              >
                {!running && !paused ? "Start" : running ? "Pause" : "Resume"}
              </button>
              <button
                onClick={onReset}
                className="px-3 py-2 rounded-lg text-white text-xs font-medium bg-yellow-600 hover:bg-yellow-500"
                title="Reset to 0"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(body, doc.body);
};

/* =========================
   Finish Toast (inline UI)
========================= */
const FinishToast: React.FC<{
  show: boolean;
  onClose: () => void;
  onSnooze: () => void;
  onRestart: () => void;
}> = ({ show, onClose, onSnooze, onRestart }) => {
  if (!show) return null;
  return createPortal(
    <div className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-900/80 backdrop-blur-xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <Hourglass className="h-5 w-5 text-emerald-300" />
          </div>
          <div className="flex-1">
            <h4 className="text-slate-100 font-semibold">Time’s up ⏰</h4>
            <p className="text-sm text-slate-300">Your countdown has finished.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={onRestart}
                className="px-3 py-2 text-sm rounded-lg bg-sky-600 hover:bg-sky-500 text-white"
              >
                Restart
              </button>
              <button
                onClick={onSnooze}
                className="px-3 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Snooze 1m
              </button>
              <button
                onClick={onClose}
                className="px-3 py-2 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* =========================
   Main Component
========================= */
const CountdownTimer: React.FC = () => {
  // Timer state (always starts at 0)
  const [remainingMs, setRemainingMs] = useState<number>(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const endAtRef = useRef<number | null>(null);
  const initialMsRef = useRef<number>(0); // for progress %

  // Manual inputs (HH:MM:SS)
  const [hh, setHh] = useState<string>("0");
  const [mm, setMm] = useState<string>("0");
  const [ss, setSs] = useState<string>("0");

  // Pop-out state (persisted)
  const [popOpen, setPopOpen] = useState<boolean>(false);
  const [popPinned, setPopPinned] = useState<boolean>(true);
  const [popCollapsed, setPopCollapsed] = useState<boolean>(false);
  const [popX, setPopX] = useState<number>(() => Math.max(16, (window.innerWidth || 360) - 320));
  const [popY, setPopY] = useState<number>(() => Math.max(16, (window.innerHeight || 640) - 180));

  // Picture-in-Picture window
  const [pipWin, setPipWin] = useState<Window | null>(null);

  // Finish toast
  const [showToast, setShowToast] = useState(false);

  // Track WHY we reached 0
  const completionCauseRef = useRef<'none' | 'natural' | 'manual'>('none');

  // Settings (persisted)
  const [mute, setMute] = useState<boolean>(defaultSettings.mute);
  const [autoStartPreset, setAutoStartPreset] = useState<boolean>(defaultSettings.autoStartPreset);
  const [autoRestart, setAutoRestart] = useState<boolean>(defaultSettings.autoRestart);

  // Restore state (localStorage + URL params)
  useEffect(() => {
    const s = loadState();
    const search = new URLSearchParams(window.location.search);

    // URL overrides
    const urlH = search.get("h");
    const urlM = search.get("m");
    const urlS = search.get("s");
    const urlAutoStart = qsBool(search, "autostart", false);
    const urlPop = qsBool(search, "pop", false);

    const urlPinned = qsBool(search, "pinned", undefined as any);
    const urlCollapsed = qsBool(search, "collapsed", undefined as any);
    const urlX = search.get("x");
    const urlY = search.get("y");
    const urlMute = search.get("mute");

    if (!s) {
      // baseline
      setPopOpen(false);
    } else {
      setHh(s.hh);
      setMm(s.mm);
      setSs(s.ss);
      setPopOpen(!!s.pop.open);
      setPopPinned(!!s.pop.pinned);
      setPopCollapsed(!!s.pop.collapsed);
      setPopX(Number.isFinite(s.pop.x) ? s.pop.x : popX);
      setPopY(Number.isFinite(s.pop.y) ? s.pop.y : popY);
      setMute(!!s.settings.mute);
      setAutoStartPreset(!!s.settings.autoStartPreset);
      setAutoRestart(!!s.settings.autoRestart);

      if (s.running && s.endAt && s.endAt > Date.now()) {
        endAtRef.current = s.endAt;
        setRunning(true);
        setPaused(false);
        const left = Math.max(0, s.endAt - Date.now());
        setRemainingMs(left);
        initialMsRef.current = Math.max(left, s.remainingMs); // best guess
      } else {
        endAtRef.current = null;
        setRemainingMs(Math.max(0, s.remainingMs));
        setRunning(false);
        setPaused(!!s.paused && s.remainingMs > 0);
        initialMsRef.current = Math.max(0, s.remainingMs);
      }
    }

    // apply URL overrides last (to take precedence)
    if (urlH != null || urlM != null || urlS != null) {
      const H = clampInt(urlH ?? "0", 0);
      const M = clampInt(urlM ?? "0", 0);
      const S = clampInt(urlS ?? "0", 0, 59);
      const total = (H * 3600 + M * 60 + S) * 1000;
      setHh(String(H));
      setMm(String(M));
      setSs(String(S));
      setRemainingMs(total);
      initialMsRef.current = total;
      setRunning(false);
      setPaused(false);
      endAtRef.current = null;
      completionCauseRef.current = 'manual';
      if (urlAutoStart && total > 0) {
        endAtRef.current = Date.now() + total;
        setRunning(true);
        setPaused(false);
        setPopOpen(true);
      }
    }
    if (urlPop) setPopOpen(true);
    if (urlPinned !== (undefined as any)) setPopPinned(urlPinned);
    if (urlCollapsed !== (undefined as any)) setPopCollapsed(urlCollapsed);
    if (urlX) setPopX(Math.max(8, Number(urlX)) || 8);
    if (urlY) setPopY(Math.max(8, Number(urlY)) || 8);
    if (urlMute != null) setMute(urlMute === "1" || urlMute.toLowerCase() === "true");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tick loop
  useEffect(() => {
    const id = setInterval(() => {
      if (!running || endAtRef.current == null) return;
      const left = Math.max(0, endAtRef.current - Date.now());
      setRemainingMs(left);
      if (left === 0) {
        setRunning(false);
        endAtRef.current = null;
        completionCauseRef.current = 'natural'; // mark natural completion
      }
    }, 200);
    return () => clearInterval(id);
  }, [running]);

  // Inputs -> ms (no start)
  const applyInputsToTimer = useCallback((hStr: string, mStr: string, sStr: string) => {
    const h = clampInt(hStr, 0);
    const m = clampInt(mStr, 0);
    const s = clampInt(sStr, 0, 59);
    const total = (h * 3600 + m * 60 + s) * 1000;
    setRunning(false);
    setPaused(false);
    endAtRef.current = null;
    setRemainingMs(total);
    initialMsRef.current = total;
    completionCauseRef.current = 'manual'; // changing time is manual
  }, []);

  const onHhChange = (v: string) => {
    const vv = v.replace(/[^0-9]/g, "");
    setHh(vv);
    applyInputsToTimer(vv, mm, ss);
  };
  const onMmChange = (v: string) => {
    const vv = v.replace(/[^0-9]/g, "");
    setMm(vv);
    applyInputsToTimer(hh, vv, ss);
  };
  const onSsChange = (v: string) => {
    const vv = v.replace(/[^0-9]/g, "");
    setSs(vv);
    applyInputsToTimer(hh, mm, vv);
  };

  // Controls
  const start = useCallback(() => {
    if (remainingMs <= 0) return;
    endAtRef.current = Date.now() + remainingMs;
    setRunning(true);
    setPaused(false);
    setPopOpen(true); // auto-open pop
  }, [remainingMs]);

  const pause = useCallback(() => {
    if (!running) return;
    const left = endAtRef.current ? Math.max(0, endAtRef.current - Date.now()) : remainingMs;
    setRemainingMs(left);
    setRunning(false);
    setPaused(true);
    endAtRef.current = null;
    completionCauseRef.current = 'manual';
  }, [running, remainingMs]);

  const resume = useCallback(() => {
    if (!paused || remainingMs <= 0) return;
    endAtRef.current = Date.now() + remainingMs;
    setRunning(true);
    setPaused(false);
  }, [paused, remainingMs]);

  const toggle = useCallback(() => {
    if (!running && !paused) start();
    else if (running) pause();
    else resume();
  }, [running, paused, start, pause, resume]);

  const resetToZero = useCallback(() => {
    setRunning(false);
    setPaused(false);
    endAtRef.current = null;
    setRemainingMs(0);
    setHh("0");
    setMm("0");
    setSs("0");
    initialMsRef.current = 0;
    completionCauseRef.current = 'manual';
  }, []);

  const setPresetMinutes = (m: number) => {
    const totalMs = m * 60 * 1000;
    setRunning(false);
    setPaused(false);
    endAtRef.current = null;
    setRemainingMs(totalMs);
    const h = Math.floor((m * 60) / 3600);
    const rem = m * 60 - h * 3600;
    const mins = Math.floor(rem / 60);
    const secs = rem % 60;
    setHh(String(h));
    setMm(String(mins));
    setSs(String(secs));
    initialMsRef.current = totalMs;
    completionCauseRef.current = 'manual';
    if (autoStartPreset && totalMs > 0) {
      endAtRef.current = Date.now() + totalMs;
      setRunning(true);
      setPaused(false);
      setPopOpen(true);
    }
  };

  // Display parts
  const { days, hours, minutes, seconds, totalSeconds } = useMemo(
    () => formatParts(remainingMs),
    [remainingMs]
  );

  const progressPct = useMemo(() => {
    const init = Math.max(1, initialMsRef.current);
    return Math.min(100, Math.max(0, ((init - remainingMs) / init) * 100));
  }, [remainingMs]);

  // Title (no favicon changes)
  useEffect(() => {
    if (!running && !paused) {
      document.title = "Countdown Timer";
    } else {
      document.title = `${paused ? "Paused" : "⏳"} ${days > 0 ? days + "d " : ""}${pad(
        hours
      )}:${pad(minutes)}:${pad(seconds)} • Countdown`;
    }
  }, [running, paused, days, hours, minutes, seconds]);

  // Persist all relevant
  useEffect(() => {
    saveState({
      remainingMs,
      running,
      paused,
      endAt: endAtRef.current,
      hh,
      mm,
      ss,
      pop: { open: popOpen, pinned: popPinned, collapsed: popCollapsed, x: popX, y: popY },
      settings: { mute, autoStartPreset, autoRestart },
    });
  }, [remainingMs, running, paused, hh, mm, ss, popOpen, popPinned, popCollapsed, popX, popY, mute, autoStartPreset, autoRestart]);

  // Completion: chime + toast ONLY for natural finish (no desktop notifications)
  useEffect(() => {
    if (remainingMs === 0 && completionCauseRef.current === 'natural') {
      playChime(mute);
      setShowToast(true);
      completionCauseRef.current = 'none';
      if (autoRestart && initialMsRef.current > 0) {
        const total = initialMsRef.current;
        setRemainingMs(total);
        endAtRef.current = Date.now() + total;
        setRunning(true);
        setPaused(false);
      }
    }
  }, [remainingMs, mute, autoRestart]);

  // Pop drag
  const handlePopDrag = (dx: number, dy: number) => {
    if (!popPinned) {
      setPopX((x) => Math.max(8, x + dx));
      setPopY((y) => Math.max(8, y + dy));
    }
  };

  // Toast actions
  const snoozeOneMinute = () => {
    const next = 60 * 1000;
    setRemainingMs(next);
    setPaused(false);
    endAtRef.current = Date.now() + next;
    setRunning(true);
    setShowToast(false);
    initialMsRef.current = next;
  };
  const restartSame = () => {
    const h = clampInt(hh, 0);
    const m = clampInt(mm, 0);
    const s = clampInt(ss, 0, 59);
    const total = (h * 3600 + m * 60 + s) * 1000;
    setRemainingMs(total);
    initialMsRef.current = total;
    if (total > 0) {
      endAtRef.current = Date.now() + total;
      setRunning(true);
      setPaused(false);
    }
    setShowToast(false);
  };

  // Share link / Copy helpers
  const buildShareURL = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("h", String(clampInt(hh, 0)));
    url.searchParams.set("m", String(clampInt(mm, 0)));
    url.searchParams.set("s", String(clampInt(ss, 0, 59)));
    url.searchParams.set("autostart", running ? "1" : "0");
    if (popOpen) url.searchParams.set("pop", "1"); else url.searchParams.delete("pop");
    url.searchParams.set("mute", mute ? "1" : "0");
    return url.toString();
  };
  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
  };
  const fmtCompact = () => {
    const d = days > 0 ? `${days}d ` : "";
    return `${d}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return; // don't hijack typing
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
      else if (e.key.toLowerCase() === 'r') { e.preventDefault(); resetToZero(); }
      else if (e.key.toLowerCase() === 's') { if (showToast) { e.preventDefault(); snoozeOneMinute(); } }
      else if (/^[1-9]$/.test(e.key)) {
        const map = [1,3,5,10,15,20,25,30,45];
        const idx = Number(e.key) - 1;
        const m = map[idx];
        if (m) { e.preventDefault(); setPresetMinutes(m); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle, resetToZero, showToast]);

  /* =========================
     Picture‑in‑Picture controls
  ========================= */
  const openPiP = async () => {
    try {
      const api = (window as any).documentPictureInPicture;
      if (!api?.requestWindow) return alert('Your browser does not support Document Picture‑in‑Picture yet. Try Chrome/Edge 115+.');
      const win: Window = await api.requestWindow({ width: 320, height: 200 });
      cloneStylesInto(win.document);
      setPipWin(win);
      win.addEventListener('pagehide', () => setPipWin(null));
      win.addEventListener('unload', () => setPipWin(null));
    } catch (e) {
      console.error(e);
      alert('Could not open floating window.');
    }
  };
  const closePiP = () => {
    try { pipWin?.close(); } catch {}
    setPipWin(null);
  };

  // Schema
  const schemaArray = useMemo(
    () => [
      generateCalculatorSchema(
        "Countdown Timer",
        "HH:MM:SS countdown with state restore, natural-finish toast and chime, plus a draggable mini pop-out. Now with share links, shortcuts, PiP floating window, and more.",
        "/countdown-timer",
        ["countdown timer", "hh:mm:ss timer", "pause resume timer", "toast", "pop-out", "share link", "keyboard shortcuts", "document picture-in-picture"]
      ),
    ],
    []
  );

  return (
    <>
      <SEOHead
        title={seoData.countdownTimer?.title || "Countdown Timer — HH:MM:SS"}
        description={
          seoData.countdownTimer?.description ||
          "Set hours, minutes, and seconds. Presets, shareable links, keyboard shortcuts, PiP floating window, and a clean glass UI."
        }
        canonical="https://calculatorhub.site/countdown-timer"
        schemaData={schemaArray}
        breadcrumbs={[
          { name: "Date & Time Tools", url: "/category/date-time-tools" },
          { name: "Countdown Timer", url: "/countdown-timer" },
        ]}
      />

      <div className="min-h-screen py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { name: "Date & Time Tools", url: "/category/date-time-tools" },
              { name: "Countdown Timer", url: "/countdown-timer" },
            ]}
          />

          {/* Header */}
          <div className="mt-6 mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-sky-400 via-fuchsia-300 to-emerald-400 bg-clip-text text-transparent">
              Countdown Timer
            </h1>
            <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl">
              Type in <span className="font-semibold">hours • minutes • seconds</span> or pick a preset. Float the mini timer on top using the new Picture‑in‑Picture button.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setPopOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900/60 border border-white/10 px-3 py-2 text-slate-100 hover:bg-slate-800"
              >
                <Hourglass className="h-4 w-4 text-sky-300" />
                {popOpen ? "Hide Mini Pop-out" : "Show Mini Pop-out"}
              </button>
              <button
                onClick={() => setMute((m) => !m)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900/60 border border-white/10 px-3 py-2 text-slate-100 hover:bg-slate-800"
                title={mute ? "Unmute chime" : "Mute chime"}
              >
                {mute ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                {mute ? "Muted" : "Sound On"}
              </button>
              <label className="inline-flex items-center gap-2 rounded-xl bg-slate-900/60 border border-white/10 px-3 py-2 text-slate-100">
                <input type="checkbox" className="accent-sky-400" checked={autoStartPreset} onChange={(e)=>setAutoStartPreset(e.target.checked)} />
                Auto‑start on preset
              </label>
              <label className="inline-flex items-center gap-2 rounded-xl bg-slate-900/60 border border-white/10 px-3 py-2 text-slate-100">
                <input type="checkbox" className="accent-emerald-400" checked={autoRestart} onChange={(e)=>setAutoRestart(e.target.checked)} />
                Auto‑restart when done
              </label>
              {supportsDocumentPiP() ? (
                pipWin ? (
                  <button onClick={closePiP} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700/70 border border-white/10 px-3 py-2 text-slate-100 hover:bg-emerald-600">
                    <AppWindow className="h-4 w-4" /> Close Floating Window
                  </button>
                ) : (
                  <button onClick={openPiP} className="inline-flex items-center gap-2 rounded-xl bg-sky-700/70 border border-white/10 px-3 py-2 text-slate-100 hover:bg-sky-600" title="Open Picture‑in‑Picture floating window">
                    <AppWindow className="h-4 w-4" /> Float Window (PiP)
                  </button>
                )
              ) : (
                <span className="text-xs text-slate-400">PiP requires Chrome/Edge 115+.</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Controls */}
            <section className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg p-5 sm:p-6 shadow-xl">
              <div className="grid grid-cols-2 items-center gap-3 sm:gap-4 mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-100">Set Time</h2>
                <div className="justify-self-end flex items-center gap-2">
                  <button
                    onClick={resetToZero}
                    title="Reset to 0"
                    aria-label="Reset timer to 0"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white border border-white/10 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="sr-only">Reset</span>
                  </button>
                </div>
              </div>

              {/* Presets */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-200 mb-2">
                  Quick Presets {autoStartPreset ? "(auto‑start)" : "(won’t start automatically)"}
                </label>
                <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap">
                  {[1,3,5,10,15,20,25,30,45,60,90,120].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPresetMinutes(m)}
                      className="w-full sm:w-auto px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-100 hover:border-sky-400 hover:bg-sky-500/10 text-sm"
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual HH:MM:SS */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-200 mb-2">Hours</label>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={hh}
                    onChange={(e) => onHhChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-200 mb-2">Minutes</label>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={mm}
                    onChange={(e) => onMmChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-200 mb-2">Seconds</label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    inputMode="numeric"
                    value={ss}
                    onChange={(e) => onSsChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Start / Pause / Resume */}
              <div className="mt-5 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={toggle}
                  className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-white flex items-center justify-center gap-2 ${
                    !running && !paused
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : running
                      ? "bg-amber-600 hover:bg-amber-500"
                      : "bg-sky-600 hover:bg-sky-500"
                  }`}
                >
                  {!running && !paused ? <Play className="h-4 w-4" /> : running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span className="text-sm">
                    {!running && !paused ? "Start" : running ? "Pause" : "Resume"}
                  </span>
                </button>
                <button
                  onClick={() => copyToClipboard(fmtCompact())}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-slate-100 hover:bg-slate-800 flex items-center justify-center gap-2"
                  title="Copy time left"
                >
                  <Copy className="h-4 w-4" /> Copy time
                </button>
                <button
                  onClick={() => copyToClipboard(buildShareURL())}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-slate-100 hover:bg-slate-800 flex items-center justify-center gap-2"
                  title="Copy shareable link with current time"
                >
                  <LinkIcon className="h-4 w-4" /> Copy link
                </button>
              </div>
            </section>

            {/* Live display */}
            <section className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg p-5 sm:p-6 shadow-xl">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-100 mb-3 sm:mb-4">Live Countdown</h2>

              <div className="text-center p-5 rounded-2xl bg-gradient-to-r from-sky-500/15 via-fuchsia-500/15 to-emerald-500/15 border border-sky-400/30" aria-live="polite">
                <Hourglass className="h-8 w-8 text-sky-300 mx-auto mb-2" aria-hidden="true" />
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-wide mt-1">
                  {days > 0 && <span>{days}d </span>}
                  {pad(hours)}:{pad(minutes)}:{pad(seconds)}
                </div>
                <div className="mt-2 text-xs sm:text-sm text-slate-400">
                  {paused ? "Paused" : running ? "Running" : "Not started"}
                </div>

                <div className="mt-4 w-full bg-slate-700 rounded-full h-2.5 sm:h-3 overflow-hidden">
                  <div
                    className={`h-full ${running || paused ? "bg-gradient-to-r from-emerald-400 to-sky-500" : "bg-slate-500/40"}`}
                    style={{ width: (running || paused) ? `${progressPct.toFixed(1)}%` : "0%" }}
                  />
                </div>
                <div className="mt-2 text-[11px] text-slate-400">{progressPct.toFixed(1)}% elapsed</div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-4 rounded-xl text-center bg-emerald-500/10 border border-emerald-400/20">
                  <div className="text-lg sm:text-xl font-semibold text-slate-100">{totalSeconds}</div>
                  <div className="text-xs sm:text-sm text-emerald-300">Total Seconds Left</div>
                </div>
                <div className="p-4 rounded-xl text-center bg-amber-500/10 border border-amber-400/20">
                  <div className="text-lg sm:text-xl font-semibold text-slate-100">
                    {paused ? "Paused" : running ? "Running" : "Stopped"}
                  </div>
                  <div className="text-xs sm:text-sm text-amber-300">Status</div>
                </div>
              </div>

              <div className="mt-5 text-[11px] sm:text-xs text-slate-400">
                Shortcuts: <span className="font-mono">Space</span> start/pause • <span className="font-mono">R</span> reset • <span className="font-mono">1..9</span> presets • when finished: <span className="font-mono">S</span> snooze.
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Mini Pop-out in main document */}
      <PopOut
        open={popOpen}
        collapsed={popCollapsed}
        pinned={popPinned}
        x={popX}
        y={popY}
        onClose={() => setPopOpen(false)}
        onTogglePin={() => setPopPinned((v) => !v)}
        onToggleCollapsed={() => setPopCollapsed((v) => !v)}
        onDrag={handlePopDrag}
        running={running}
        paused={paused}
        days={days}
        hours={hours}
        minutes={minutes}
        seconds={seconds}
        onToggle={toggle}
        onReset={resetToZero}
      />

      {/* Floating Pop-out inside PiP window (same UI, synced state) */}
      {pipWin && (
        <PopOut
          open={true}
          collapsed={false}
          pinned={false}
          x={12}
          y={12}
          onClose={closePiP}
          onTogglePin={() => {}}
          onToggleCollapsed={() => {}}
          onDrag={() => {}}
          running={running}
          paused={paused}
          days={days}
          hours={hours}
          minutes={minutes}
          seconds={seconds}
          onToggle={toggle}
          onReset={resetToZero}
          portalDocument={pipWin.document}
          eventsWindow={pipWin}
        />
      )}

      {/* Finish Toast (natural finish only) */}
      <FinishToast
        show={showToast}
        onClose={() => setShowToast(false)}
        onSnooze={snoozeOneMinute}
        onRestart={restartSame}
      />
    </>
  );
};

export default CountdownTimer;
