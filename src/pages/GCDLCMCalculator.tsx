// src/pages/GcdLcmCalculator.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Divide,
  RotateCcw,
  Share2,
  Copy,
  ChevronDown,
  ChevronUp,
  Info,
  List,
} from "lucide-react";

import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import { generateCalculatorSchema } from "../utils/seoData";
import RelatedCalculators from "../components/RelatedCalculators";

/* ============================================================
   📦 Constants & Utilities
   ============================================================ */
const LS_KEY = "gcd_lcm_calculator_state_v1";
const URL_KEY = "gl";

const toTokens = (s: string) =>
  s
    .trim()
    .split(/[\s,;|\n]+/)
    .filter(Boolean);

const toInts = (s: string) => {
  const tokens = toTokens(s);
  const nums = tokens
    .map((t) => Number(t))
    .filter((v) => Number.isFinite(v))
    .map((v) => (v < 0 ? Math.trunc(v) : Math.trunc(v))); // integerize via trunc
  return nums;
};

const abs = (n: number) => Math.abs(n);

/** Euclidean algorithm for two integers, returns gcd and step log */
function gcdTwo(a0: number, b0: number) {
  let a = abs(a0);
  let b = abs(b0);
  const steps: Array<{ a: number; b: number; q: number; r: number }> = [];

  if (a === 0 && b === 0) {
    return { gcd: 0, steps };
  }
  if (a === 0) {
    steps.push({ a, b, q: 0, r: b });
    return { gcd: b, steps };
  }
  if (b === 0) {
    steps.push({ a, b, q: 0, r: a });
    return { gcd: a, steps };
  }

  while (b !== 0) {
    const q = Math.floor(a / b);
    const r = a % b;
    steps.push({ a, b, q, r });
    a = b;
    b = r;
  }
  return { gcd: a, steps };
}

/** LCM for two integers using gcd; handles zero */
function lcmTwo(a: number, b: number) {
  if (a === 0 || b === 0) return 0;
  const g = gcdTwo(a, b).gcd;
  return abs((a / g) * b); // avoid overflow a*b first (divide then multiply)
}

/** Reduce an array to gcd with per-step summary */
function gcdMany(arr: number[]) {
  if (arr.length === 0) return { gcd: 0, chain: [] as string[] };
  let g = abs(arr[0]);
  const chain: string[] = [];
  for (let i = 1; i < arr.length; i++) {
    const prev = g;
    const cur = arr[i];
    g = gcdTwo(g, cur).gcd;
    chain.push(`gcd(${prev}, ${cur}) = ${g}`);
  }
  return { gcd: g, chain };
}

/** Reduce an array to lcm with per-step summary */
function lcmMany(arr: number[]) {
  if (arr.length === 0) return { lcm: 0, chain: [] as string[] };
  let l = abs(arr[0]);
  const chain: string[] = [];
  for (let i = 1; i < arr.length; i++) {
    const prev = l;
    const cur = arr[i];
    l = lcmTwo(l, cur);
    chain.push(`lcm(${prev}, ${cur}) = ${l}`);
    if (l === 0) break; // once zero, stays zero
  }
  return { lcm: l, chain };
}

const fmt = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString("en-US") : "—";

/* ============================================================
   🧮 Component
   ============================================================ */
const GcdLcmCalculator: React.FC = () => {
  // Inputs
  const [numsStr, setNumsStr] = useState<string>("24, 60, 36");
  const [showEuclidPair, setShowEuclidPair] = useState<boolean>(true); // show two-number Euclid details (first two)
  const [pairIndex, setPairIndex] = useState<number>(0); // index of the pair start for Euclid steps

  // UI
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [showSteps, setShowSteps] = useState<boolean>(false);
  const [activeTip, setActiveTip] = useState<number>(0);
  const [hydrated, setHydrated] = useState<boolean>(false);

  const isDefault = numsStr === "24, 60, 36" && showEuclidPair && pairIndex === 0;

  /* 🔁 Hydration & Persistence */
  const applyState = (s: any) => {
    setNumsStr(String(s.numsStr || ""));
    setShowEuclidPair(Boolean(s.showEuclidPair));
    setPairIndex(Number.isFinite(Number(s.pairIndex)) ? Number(s.pairIndex) : 0);
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromURL = params.get(URL_KEY);
      if (fromURL) {
        applyState(JSON.parse(atob(fromURL)));
        setHydrated(true);
        return;
      }
      const raw = localStorage.getItem(LS_KEY);
      if (raw) applyState(JSON.parse(raw));
    } catch (e) {
      console.warn("Failed to load gcd/lcm state:", e);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const state = { numsStr, showEuclidPair, pairIndex };
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {}
  }, [hydrated, numsStr, showEuclidPair, pairIndex]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const url = new URL(window.location.href);
      if (isDefault) {
        url.searchParams.delete(URL_KEY);
        window.history.replaceState({}, "", url);
      } else {
        const encoded = btoa(JSON.stringify({ numsStr, showEuclidPair, pairIndex }));
        url.searchParams.set(URL_KEY, encoded);
        window.history.replaceState({}, "", url);
      }
    } catch (e) {
      console.warn("Failed to update URL:", e);
    }
  }, [hydrated, numsStr, showEuclidPair, pairIndex, isDefault]);

  /* 🧠 Calculations */
  const ints = useMemo(() => toInts(numsStr), [numsStr]);

  const { gcd: gcdValue, chain: gcdChain } = useMemo(() => gcdMany(ints), [ints]);
  const { lcm: lcmValue, chain: lcmChain } = useMemo(() => lcmMany(ints), [ints]);

  // Detailed Euclid steps for a selected adjacent pair (or first two if not enough)
  const pairA = useMemo(
    () => (ints.length >= 2 ? ints[Math.min(pairIndex, Math.max(0, ints.length - 2))] : NaN),
    [ints, pairIndex]
  );
  const pairB = useMemo(
    () =>
      ints.length >= 2
        ? ints[Math.min(pairIndex, Math.max(0, ints.length - 2)) + 1]
        : NaN,
    [ints, pairIndex]
  );

  const euclidSteps = useMemo(() => {
    if (!showEuclidPair || !Number.isFinite(pairA) || !Number.isFinite(pairB)) return [];
    return gcdTwo(pairA, pairB).steps;
  }, [showEuclidPair, pairA, pairB]);

  // Edge hints
  const emptyInput = ints.length === 0;
  const nonIntegersNotice = useMemo(() => {
    const raw = toTokens(numsStr);
    if (raw.length === 0) return false;
    // If any token parsed to finite number but had decimals, we treated via trunc; detect that
    return raw.some((t) => {
      const v = Number(t);
      return Number.isFinite(v) && !Number.isInteger(v);
    });
  }, [numsStr]);

  /* 💡 Tips */
  const tips = useMemo(
    () => [
      "Tip: gcd(a, b) is the last non-zero remainder in the Euclidean algorithm.",
      "Tip: lcm(a, b) = |a·b| / gcd(a, b) (with lcm(a, 0) = 0).",
      "Tip: gcd and lcm for many numbers are computed by reducing pairwise left-to-right.",
      "Tip: gcd(a, 0) = |a|; gcd(0, 0) = 0 by convention in this tool.",
      "Tip: Signs don’t matter: gcd uses absolute values; lcm is always non-negative.",
    ],
    []
  );

  useEffect(() => {
    const id = setInterval(() => setActiveTip((p) => (p + 1) % tips.length), 5000);
    return () => clearInterval(id);
  }, [tips.length]);

  /* 🔗 Copy / Share / Reset */
  const copyResults = async () => {
    const parts: string[] = [];
    parts.push("GCD & LCM Calculator");
    parts.push(`Numbers: ${ints.join(", ") || "—"}`);
    parts.push(`GCD: ${fmt(gcdValue)}`);
    parts.push(`LCM: ${fmt(lcmValue)}`);
    if (gcdChain.length) parts.push(`GCD reduction: ${gcdChain.join(" → ")}`);
    if (lcmChain.length) parts.push(`LCM reduction: ${lcmChain.join(" → ")}`);
    await navigator.clipboard.writeText(parts.join("\n"));
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    const encoded = btoa(JSON.stringify({ numsStr, showEuclidPair, pairIndex }));
    url.searchParams.set(URL_KEY, encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  const reset = () => {
    setNumsStr("24, 60, 36");
    setShowEuclidPair(true);
    setPairIndex(0);
    setShowSteps(false);
    localStorage.removeItem(LS_KEY);
  };

  /* ============================================================
     🎨 Render
     ============================================================ */
  return (
    <>
      <SEOHead
        title="GCD & LCM Calculator | Euclidean Steps, Multi-Number Reduction"
        description="Compute the Greatest Common Divisor (GCD) and Least Common Multiple (LCM) for any list of integers. See Euclidean algorithm steps, reduction chain, shareable link, and more."
        canonical="https://calculatorhub.site/gcd-lcm-calculator"
        schemaData={generateCalculatorSchema(
          "GCD & LCM Calculator",
          "Find GCD and LCM for multiple integers with Euclid steps and reduction chains.",
          "/gcd-lcm-calculator",
          [
            "gcd calculator",
            "lcm calculator",
            "euclidean algorithm",
            "math tools",
            "greatest common divisor",
            "least common multiple",
          ]
        )}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* Minimal OG/Twitter */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="GCD & LCM Calculator | Euclidean Steps, Multi-Number Reduction" />
      <meta property="og:url" content="https://calculatorhub.site/gcd-lcm-calculator" />
      <meta
        property="og:description"
        content="Compute GCD/LCM for any list of integers. See Euclid steps, reduction chain, copy/share link."
      />
      <meta property="og:image" content="https://calculatorhub.site/images/gcd-lcm-calculator-hero.webp" />
      <meta name="twitter:card" content="summary_large_image" />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Math Tools", url: "/category/math-tools" },
            { name: "GCD & LCM Calculator", url: "/gcd-lcm-calculator" },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            GCD & LCM Calculator
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Paste integers (comma, space, or line separated) to compute{" "}
            <strong>GCD</strong> and <strong>LCM</strong>. See the{" "}
            <strong>Euclidean algorithm steps</strong> and the reduction across many numbers.
          </p>
        </div>

        {/* Promo bar */}
        <div className="hidden sm:flex mt-6 mb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white rounded-lg shadow-lg p-4 items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-lg">Explore more math tools 🧮</p>
            <p className="text-sm text-indigo-100">Try Average, Factorial, or Quadratic Solver next!</p>
          </div>
          <a
            href="/category/math-tools"
            className="bg-white text-indigo-700 font-semibold px-4 py-2 rounded-md hover:bg-indigo-50 transition"
          >
            Browse Math Tools
          </a>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 relative text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <List className="h-5 w-5 text-sky-400" /> Inputs
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
              {/* Numbers */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">
                    Numbers (integers)
                  </label>
                  <Info
                    className="h-4 w-4 text-slate-400"
                    title="Separate by comma, space, semicolon, pipe, or new line. Negatives and zeros allowed."
                  />
                </div>
                <textarea
                  rows={5}
                  value={numsStr}
                  onChange={(e) => setNumsStr(e.target.value)}
                  placeholder="e.g., 24, 60, 36"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {["24, 60, 36", "48 180 300 600", "14; 21; 35; 56", "-18, 0, 54"].map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setNumsStr(s)}
                      className="text-xs bg-[#0f172a] border border-[#334155] rounded px-2 py-1 hover:border-indigo-500"
                    >
                      Sample {i + 1}
                    </button>
                  ))}
                </div>
                {nonIntegersNotice && (
                  <p className="text-xs text-amber-300 mt-2">
                    Note: Non-integers were truncated to integers.
                  </p>
                )}
              </div>

              {/* Euclid details toggle */}
              <div className="flex items-center gap-2">
                <input
                  id="euclidToggle"
                  type="checkbox"
                  checked={showEuclidPair}
                  onChange={(e) => setShowEuclidPair(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="euclidToggle" className="text-sm text-slate-300">
                  Show Euclidean algorithm steps for a pair
                </label>
              </div>

              {/* Pair chooser */}
              {showEuclidPair && ints.length >= 2 && (
                <div className="flex items-center gap-3">
                  <label className="text-sm text-slate-300">Pair index:</label>
                  <input
                    type="number"
                    min={0}
                    max={Math.max(0, ints.length - 2)}
                    value={pairIndex}
                    onChange={(e) =>
                      setPairIndex(
                        Math.min(Math.max(0, parseInt(e.target.value) || 0), Math.max(0, ints.length - 2))
                      )
                    }
                    className="w-24 bg-[#0f172a] text-white px-3 py-1.5 border border-[#334155] rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="text-xs text-slate-400">
                    Pair = (n[{pairIndex}], n[{pairIndex + 1}]) → ({ints[pairIndex]}, {ints[pairIndex + 1]})
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">Results</h2>
            <div className="space-y-6">
              {/* Summary tiles */}
              <div className="grid grid-cols-2 gap-4">
                <Tile label="GCD" value={emptyInput ? "—" : fmt(gcdValue)} />
                <Tile label="LCM" value={emptyInput ? "—" : fmt(lcmValue)} />
              </div>

              {/* Reduction chains */}
              {ints.length > 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                    <div className="text-sm text-slate-400 mb-2">GCD Reduction</div>
                    {gcdChain.length ? (
                      <ul className="list-disc list-inside text-slate-200 text-sm space-y-1">
                        {gcdChain.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-slate-300 text-sm">—</div>
                    )}
                  </div>
                  <div className="p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                    <div className="text-sm text-slate-400 mb-2">LCM Reduction</div>
                    {lcmChain.length ? (
                      <ul className="list-disc list-inside text-slate-200 text-sm space-y-1">
                        {lcmChain.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-slate-300 text-sm">—</div>
                    )}
                  </div>
                </div>
              )}

              

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
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
        </div>

        {/* Euclidean steps */}
              {showEuclidPair && ints.length >= 2 && (
                <div className="p-4 mt-3 bg-[#0f172a] rounded-lg border border-[#334155]">
                  <div className="text-sm text-slate-400 mb-2">
                    Euclidean Algorithm (pair: {pairA}, {pairB})
                  </div>
                  {euclidSteps.length ? (
                    <table className="min-w-full text-sm text-slate-100 border border-[#334155] rounded-md overflow-hidden">
                      <thead className="bg-[#0f172a]">
                        <tr>
                          <th className="text-left px-3 py-2">a</th>
                          <th className="text-left px-3 py-2">b</th>
                          <th className="text-left px-3 py-2">q = ⌊a / b⌋</th>
                          <th className="text-left px-3 py-2">r = a − b·q</th>
                        </tr>
                      </thead>
                      <tbody>
                        {euclidSteps.map((s, i) => (
                          <tr key={i} className={i % 2 ? "bg-[#0f172a]/60" : "bg-[#1e293b]/60"}>
                            <td className="px-3 py-2">{s.a}</td>
                            <td className="px-3 py-2">{s.b}</td>
                            <td className="px-3 py-2">{s.q}</td>
                            <td className="px-3 py-2">{s.r}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-slate-300 text-sm">—</div>
                  )}
                </div>
              )}

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

        {/* Steps (collapsible explainer) */}
        <div className="mt-10 bg-gradient-to-br from-[#1e293b] via-[#111827] to-[#0f172a] rounded-2xl border border-indigo-600/40 shadow-xl overflow-hidden">
          <button
            onClick={() => setShowSteps((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold text-lg tracking-wide hover:opacity-90 transition-all"
          >
            <span>🧮 Step-by-Step</span>
            {showSteps ? <ChevronUp /> : <ChevronDown />}
          </button>

          {showSteps && (
            <div className="px-6 pb-8 pt-4 space-y-3 text-slate-200">
              <h4 className="font-semibold text-cyan-300">GCD (Greatest Common Divisor)</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>For two numbers (a, b), repeatedly divide: a = b·q + r.</li>
                <li>Replace (a, b) ← (b, r) until r = 0.</li>
                <li>The last non-zero b is gcd(a, b).</li>
                <li>For many numbers, reduce left-to-right: gcd(a, b, c) = gcd(gcd(a, b), c).</li>
              </ol>

              <h4 className="font-semibold text-cyan-300">LCM (Least Common Multiple)</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>For two numbers: lcm(a, b) = |a·b| / gcd(a, b). If either is 0, lcm = 0.</li>
                <li>For many numbers: lcm(a, b, c) = lcm(lcm(a, b), c).</li>
              </ol>

              <div className="h-2 w-full mt-6 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 blur-[2px]" />
            </div>
          )}
        </div>

        {/* Short SEO content */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          <h1 className="text-3xl font-bold text-cyan-400 mb-6">
            GCD & LCM Calculator – Euclid Steps & Multi-Input
          </h1>
          <p>
            Enter any list of integers to compute the <strong>GCD</strong> and <strong>LCM</strong>. The tool
            shows the <em>Euclidean algorithm</em> for a chosen pair and the reduction chain across multiple
            numbers. Signs are ignored for GCD, and LCM is always non-negative. Zeros are allowed; if any input is
            zero, the LCM becomes zero.
          </p>
        </section>

        {/* Footer links */}
        <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              🚀 Explore more tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/average-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
              >
                📊 Average Calculator
              </Link>
              <Link
                to="/quadratic-equation-solver"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-400 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
              >
                𝑎x²+𝑏x+𝑐 Quadratic Solver
              </Link>
              <Link
                to="/factorial-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-pink-600/20 text-pink-300 hover:text-pink-400 px-3 py-2 rounded-md border border-slate-700 hover:border-pink-500 transition-all duration-200"
              >
                n! Factorial
              </Link>
            </div>
          </div>
        </section>

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/gcd-lcm-calculator" category="math-tools" />
      </div>
    </>
  );
};

/* ============================================================
   🧩 Small UI helpers
   ============================================================ */
const Tile: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155] shadow-sm">
    <div className="text-sm text-slate-400">{label}</div>
    <div className="text-lg font-semibold text-white break-words">{value}</div>
  </div>
);

export default GcdLcmCalculator;
