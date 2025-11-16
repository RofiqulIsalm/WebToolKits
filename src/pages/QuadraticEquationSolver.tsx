// src/pages/QuadraticEquationSolver.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sigma,
  RotateCcw,
  Share2,
  Copy,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";

import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import { generateCalculatorSchema } from "../utils/seoData";
import RelatedCalculators from "../components/RelatedCalculators";

/* ============================================================
   📦 Constants & Utilities
   ============================================================ */
const LS_KEY = "quadratic_solver_state_v1";
const URL_KEY = "qs";

const nf = (n: number, d = 6) =>
  Number.isFinite(n) ? Number(n.toFixed(d)).toLocaleString() : "—";
const isInt = (x: number) => Number.isInteger(x);
const isPerfectSquare = (n: number) =>
  Number.isFinite(n) && n >= 0 && Number.isInteger(Math.sqrt(n));

/* format complex a+bi */
const fmtComplex = (re: number, im: number, d = 6) => {
  if (Math.abs(im) < 1e-12) return nf(re, d);
  const sign = im >= 0 ? "+" : "−";
  return `${nf(re, d)} ${sign} ${nf(Math.abs(im), d)}i`;
};

/* gcd for factorization */
const gcd = (a: number, b: number): number => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};

/* Try factorization when D is perfect square and a,b,c integers */
function tryFactorization(a: number, b: number, c: number) {
  if (![a, b, c].every((v) => isInt(v))) return null;
  const D = b * b - 4 * a * c;
  if (!isPerfectSquare(D)) return null;

  const sqrtD = Math.sqrt(D);
  const r1_num = -b + sqrtD;
  const r2_num = -b - sqrtD;
  const den = 2 * a;

  // Reduce fractions r = p/q
  const g1 = gcd(r1_num, den);
  const g2 = gcd(r2_num, den);
  const p1 = r1_num / g1,
    q1 = den / g1;
  const p2 = r2_num / g2,
    q2 = den / g2;

  const factor1 = q1 === 1 ? `(x ${p1 >= 0 ? "−" : "+"} ${Math.abs(p1)})` : `(${q1}x ${p1 >= 0 ? "−" : "+"} ${Math.abs(p1)})`;
  const factor2 = q2 === 1 ? `(x ${p2 >= 0 ? "−" : "+"} ${Math.abs(p2)})` : `(${q2}x ${p2 >= 0 ? "−" : "+"} ${Math.abs(p2)})`;

  // Normalize leading coeff if needed
  const lead = a / (q1 * q2);
  const leadStr = lead === 1 ? "" : `${lead}·`;
  return `${leadStr}${factor1}${factor2}`;
}

/* Generate parabola points around vertex */
function makeParabolaPoints(a: number, b: number, c: number) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) return [];
  const xv = -b / (2 * a);
  // choose window based on curvature
  const span = Math.max(5, Math.min(50, Math.ceil(10 / Math.max(1e-6, Math.abs(a)))));
  const start = xv - span;
  const step = (2 * span) / 80; // 81 points
  const pts = [];
  for (let i = 0; i <= 80; i++) {
    const x = start + i * step;
    const y = a * x * x + b * x + c;
    pts.push({ x, y });
  }
  return pts;
}

/* ============================================================
   🧮 Component
   ============================================================ */
const QuadraticEquationSolver: React.FC = () => {
  // Inputs: ax^2 + bx + c = 0
  const [a, setA] = useState<number>(1);
  const [b, setB] = useState<number>(0);
  const [c, setC] = useState<number>(0);

  // UI
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [showSteps, setShowSteps] = useState<boolean>(false);
  const [activeTip, setActiveTip] = useState<number>(0);
  const [hydrated, setHydrated] = useState<boolean>(false);

  const isDefault = a === 1 && b === 0 && c === 0;

  /* 🔁 Hydration & Persistence */
  const applyState = (s: any) => {
    setA(Number(s.a) || 0);
    setB(Number(s.b) || 0);
    setC(Number(s.c) || 0);
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
      console.warn("Failed to load quadratic state:", e);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ a, b, c }));
    } catch {}
  }, [hydrated, a, b, c]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const url = new URL(window.location.href);
      if (isDefault) {
        url.searchParams.delete(URL_KEY);
        window.history.replaceState({}, "", url);
      } else {
        const encoded = btoa(JSON.stringify({ a, b, c }));
        url.searchParams.set(URL_KEY, encoded);
        window.history.replaceState({}, "", url);
      }
    } catch (e) {
      console.warn("Failed to update URL:", e);
    }
  }, [hydrated, a, b, c, isDefault]);

  /* 🧠 Math */
  const D = useMemo(() => b * b - 4 * a * c, [a, b, c]); // discriminant
  const hasComplex = useMemo(() => D < 0, [D]);
  const sqrtAbsD = useMemo(() => Math.sqrt(Math.abs(D)), [D]);

  const roots = useMemo(() => {
    if (!Number.isFinite(a) || a === 0) return null; // not quadratic
    const twoA = 2 * a;
    if (D >= 0) {
      const r1 = (-b + Math.sqrt(D)) / twoA;
      const r2 = (-b - Math.sqrt(D)) / twoA;
      return { r1, r2, complex: false };
    } else {
      const re = -b / twoA;
      const im = sqrtAbsD / twoA;
      return { r1: { re, im }, r2: { re, im: -im }, complex: true };
    }
  }, [a, b, D, sqrtAbsD]);

  const vertex = useMemo(() => {
    if (!Number.isFinite(a) || a === 0) return { xv: NaN, yv: NaN };
    const xv = -b / (2 * a);
    const yv = a * xv * xv + b * xv + c;
    return { xv, yv };
  }, [a, b, c]);

  const axis = useMemo(() => (Number.isFinite(vertex.xv) ? vertex.xv : NaN), [vertex.xv]);

  const yIntercept = useMemo(() => c, [c]);

  const nature = useMemo(() => {
    if (!Number.isFinite(a) || a === 0) return "Not a quadratic (a = 0)";
    if (D > 0) return "Two distinct real roots";
    if (D === 0) return "One real repeated root";
    return "Two complex conjugate roots";
  }, [a, D]);

  const factorization = useMemo(() => tryFactorization(a, b, c), [a, b, c]);

  const chartData = useMemo(() => {
    if (!Number.isFinite(a) || a === 0) return [];
    return makeParabolaPoints(a, b, c);
  }, [a, b, c]);

  /* 💡 Tips */
  const tips = useMemo(
    () => [
      "Tip: Discriminant D = b² − 4ac. D>0 → two real roots; D=0 → one real root; D<0 → complex roots.",
      "Tip: Vertex is at (−b/2a, f(−b/2a)). Axis of symmetry is x = −b/2a.",
      "Tip: y-intercept is c (set x=0).",
      "Tip: If D is a perfect square and a,b,c are integers, the trinomial may factor nicely.",
      "Tip: a>0 opens upward; a<0 opens downward.",
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
    parts.push("Quadratic Equation Solver");
    parts.push(`Equation: ${a}x² + ${b}x + ${c} = 0`);
    parts.push(`Discriminant (D): ${nf(D, 6)} → ${nature}`);
    if (roots) {
      if (!roots.complex) {
        parts.push(`Roots: x₁ = ${nf(roots.r1)}, x₂ = ${nf(roots.r2)}`);
      } else {
        parts.push(
          `Roots: x₁ = ${fmtComplex(roots.r1.re, roots.r1.im)}, x₂ = ${fmtComplex(
            roots.r2.re,
            roots.r2.im
          )}`
        );
      }
    }
    parts.push(`Vertex: (${nf(vertex.xv)}, ${nf(vertex.yv)})`);
    parts.push(`Axis of symmetry: x = ${nf(axis)}`);
    parts.push(`y-intercept: (0, ${nf(yIntercept)})`);
    if (factorization) parts.push(`Factorization: ${factorization}`);
    await navigator.clipboard.writeText(parts.join("\n"));
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    const encoded = btoa(JSON.stringify({ a, b, c }));
    url.searchParams.set(URL_KEY, encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  const reset = () => {
    setA(1);
    setB(0);
    setC(0);
    setShowSteps(false);
    localStorage.removeItem(LS_KEY);
  };

  /* ============================================================
     🎨 Render
     ============================================================ */
  return (
    <>
      {/** ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Quadratic Equation Solver — Roots, Vertex, Discriminant & Parabola Graph"
        description="Solve ax²+bx+c=0 for real or complex roots. Get discriminant, vertex, axis, intercepts, optional factorization, and an interactive parabola graph. Share or copy results."
        keywords={[
          "quadratic equation solver",
          "quadratic formula calculator",
          "discriminant calculator",
          "parabola graph",
          "vertex calculator",
          "complex roots",
          "factorization",
          "math tools",
        ]}
        canonical="https://calculatorhub.site/quadratic-equation-solver"
        schemaData={[
          /* WebPage + Article */
          {
            "@context":"https://schema.org",
            "@type":"WebPage",
            "@id":"https://calculatorhub.site/quadratic-equation-solver#webpage",
            "url":"https://calculatorhub.site/quadratic-equation-solver",
            "name":"Quadratic Equation Solver — Roots, Vertex, Discriminant & Graph",
            "inLanguage":"en",
            "isPartOf":{"@id":"https://calculatorhub.site/#website"},
            "primaryImageOfPage":{
              "@type":"ImageObject",
              "@id":"https://calculatorhub.site/images/quadratic-solver-hero.webp#primaryimg",
              "url":"https://calculatorhub.site/images/quadratic-solver-hero.webp",
              "width":1200,"height":675
            },
            "mainEntity":{
              "@type":"Article",
              "@id":"https://calculatorhub.site/quadratic-equation-solver#article",
              "headline":"Quadratic Equation Solver — fast, precise, and shareable",
              "description":"Compute roots (real/complex), discriminant, vertex, axis, intercepts, and factorization; includes a live parabola graph.",
              "image":["https://calculatorhub.site/images/quadratic-solver-hero.webp"],
              "author":{"@type":"Organization","name":"CalculatorHub","url":"https://calculatorhub.site"},
              "publisher":{"@id":"https://calculatorhub.site/#organization"},
              "datePublished":"2025-11-09","dateModified":"2025-11-09",
              "mainEntityOfPage":{"@id":"https://calculatorhub.site/quadratic-equation-solver#webpage"},
              "articleSection":["Quadratic Formula","Discriminant","Vertex","Graph","Factorization"]
            }
          },
          /* Breadcrumbs */
          {
            "@context":"https://schema.org",
            "@type":"BreadcrumbList",
            "@id":"https://calculatorhub.site/quadratic-equation-solver#breadcrumbs",
            "itemListElement":[
              {"@type":"ListItem","position":1,"name":"Home","item":"https://calculatorhub.site/"},
              {"@type":"ListItem","position":2,"name":"Math Tools","item":"https://calculatorhub.site/category/math-tools"},
              {"@type":"ListItem","position":3,"name":"Quadratic Equation Solver","item":"https://calculatorhub.site/quadratic-equation-solver"}
            ]
          },
          /* FAQ */
          {
            "@context":"https://schema.org",
            "@type":"FAQPage",
            "@id":"https://calculatorhub.site/quadratic-equation-solver#faq",
            "mainEntity":[
              {"@type":"Question","name":"Does it handle complex roots?","acceptedAnswer":{"@type":"Answer","text":"Yes, when the discriminant is negative, roots are shown in a±bi form."}},
              {"@type":"Question","name":"Will it show factorization?","acceptedAnswer":{"@type":"Answer","text":"If a, b, c are integers and the discriminant is a perfect square, it shows a factorized form."}},
              {"@type":"Question","name":"Can I share my equation?","acceptedAnswer":{"@type":"Answer","text":"Yes, copy a URL that encodes your coefficients so others can open the same problem."}}
            ]
          },
          /* WebApplication */
          {
            "@context":"https://schema.org",
            "@type":"WebApplication",
            "@id":"https://calculatorhub.site/quadratic-equation-solver#webapp",
            "name":"Quadratic Equation Solver",
            "url":"https://calculatorhub.site/quadratic-equation-solver",
            "applicationCategory":"UtilitiesApplication",
            "operatingSystem":"Web",
            "description":"Solve ax²+bx+c=0 with roots, discriminant, vertex, intercepts, factorization, and a live graph.",
            "publisher":{"@id":"https://calculatorhub.site/#organization"},
            "image":["https://calculatorhub.site/images/quadratic-solver-hero.webp"]
          },
          /* SoftwareApplication */
          {
            "@context":"https://schema.org",
            "@type":"SoftwareApplication",
            "@id":"https://calculatorhub.site/quadratic-equation-solver#software",
            "name":"Advanced Quadratic Solver",
            "applicationCategory":"UtilitiesApplication",
            "operatingSystem":"All",
            "url":"https://calculatorhub.site/quadratic-equation-solver",
            "publisher":{"@id":"https://calculatorhub.site/#organization"},
            "description":"Compute roots (real/complex), discriminant, vertex, axis, and factorization with an interactive graph."
          },
          /* Site + Org (global) */
          {
            "@context":"https://schema.org",
            "@type":"WebSite",
            "@id":"https://calculatorhub.site/#website",
            "url":"https://calculatorhub.site",
            "name":"CalculatorHub",
            "publisher":{"@id":"https://calculatorhub.site/#organization"},
            "potentialAction":{"@type":"SearchAction","target":"https://calculatorhub.site/search?q={query}","query-input":"required name=query"}
          },
          {
            "@context":"https://schema.org",
            "@type":"Organization",
            "@id":"https://calculatorhub.site/#organization",
            "name":"CalculatorHub",
            "url":"https://calculatorhub.site",
            "logo":{"@type":"ImageObject","url":"https://calculatorhub.site/images/logo.png"}
          }
        ]}
      />
      
      {/** ===== Outside meta/link tags ===== */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <link rel="canonical" href="https://calculatorhub.site/quadratic-equation-solver" />
      
      <link rel="alternate" href="https://calculatorhub.site/quadratic-equation-solver" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/quadratic-equation-solver" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/quadratic-equation-solver" hreflang="x-default" />
      
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Quadratic Equation Solver — Roots, Vertex, Discriminant & Graph" />
      <meta property="og:description" content="Solve ax²+bx+c=0 with roots (real/complex), discriminant, vertex, intercepts, factorization, and a live graph." />
      <meta property="og:url" content="https://calculatorhub.site/quadratic-equation-solver" />
      <meta property="og:image" content="https://calculatorhub.site/images/quadratic-solver-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Quadratic solver UI with graph and results" />
      <meta property="og:locale" content="en_US" />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Quadratic Equation Solver — Roots, Vertex, Discriminant & Graph" />
      <meta name="twitter:description" content="Fast quadratic solver with complex roots, factorization, and an interactive parabola." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/quadratic-solver-hero.webp" />
      <meta name="twitter:creator" content="@CalculatorHub" />
      <meta name="twitter:site" content="@CalculatorHub" />
      
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#6366f1" />
      
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="preload" as="image" href="/images/quadratic-solver-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />


      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Math Tools", url: "/category/math-tools" },
            { name: "Quadratic Equation Solver", url: "/quadratic-equation-solver" },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            𝑎x² + 𝑏x + 𝑐 = 0 — Quadratic Solver
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Find <strong>roots</strong> (real or complex), <strong>discriminant</strong>,{" "}
            <strong>vertex</strong>, <strong>axis of symmetry</strong>, and <strong>intercepts</strong>. See an
            interactive graph and copy/share your results.
          </p>
        </div>

        {/* Promo bar */}
        <div className="hidden sm:flex mt-6 mb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white rounded-lg shadow-lg p-4 items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-lg">Explore more math tools 🧮</p>
            <p className="text-sm text-indigo-100">Try Percentage, Average, or Standard Deviation next!</p>
          </div>
          <Link
            to="/category/math-tools"
            className="bg-white text-indigo-700 font-semibold px-4 py-2 rounded-md hover:bg-indigo-50 transition"
          >
            Browse Math Tools
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 relative text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Sigma className="h-5 w-5 text-sky-400" /> Inputs (ax² + bx + c = 0)
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
              <Field label="a (≠ 0)" value={a} onChange={setA} placeholder="e.g., 1" info="Leading coefficient. Must be non-zero." />
              <Field label="b" value={b} onChange={setB} placeholder="e.g., -3" info="Linear coefficient." />
              <Field label="c" value={c} onChange={setC} placeholder="e.g., -4" info="Constant term." />
              <p className="text-xs text-slate-400">
                Equation: <span className="font-semibold text-indigo-300">{a}x² {b < 0 ? "−" : "+"} {Math.abs(b)}x {c < 0 ? "−" : "+"} {Math.abs(c)} = 0</span>
              </p>
            </div>
          </div>

          {/* Results */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">Results</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Tile label="Discriminant (D)" value={nf(D)} />
                <Tile label="Nature of roots" value={nature} />
                <Tile label="Vertex xᵥ" value={nf(vertex.xv)} />
                <Tile label="Vertex yᵥ" value={nf(vertex.yv)} />
                <Tile label="Axis of symmetry" value={`x = ${nf(axis)}`} />
                <Tile label="y-intercept" value={`(0, ${nf(yIntercept)})`} />
              </div>

              {/* Roots */}
              <div className="p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                <div className="text-sm text-slate-400 mb-1">Roots</div>
                {a === 0 ? (
                  <div className="text-rose-300">Not a quadratic (a = 0). Enter a ≠ 0.</div>
                ) : roots ? (
                  !roots.complex ? (
                    <div className="text-white font-semibold">
                      x₁ = {nf(roots.r1)} &nbsp;&nbsp; x₂ = {nf(roots.r2)}
                    </div>
                  ) : (
                    <div className="text-white font-semibold">
                      x₁ = {fmtComplex(roots.r1.re, roots.r1.im)} &nbsp;&nbsp; x₂ ={" "}
                      {fmtComplex(roots.r2.re, roots.r2.im)}
                    </div>
                  )
                ) : (
                  <div className="text-slate-300">—</div>
                )}
                {factorization && (
                  <div className="text-sm text-emerald-300 mt-2">
                    Factorization: <span className="font-mono">{factorization}</span>
                  </div>
                )}
              </div>

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

        {/* Chart */}
        {a !== 0 && chartData.length > 0 && (
          <div className="mt-5 bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              Parabola y = {a}x² {b < 0 ? "−" : "+"} {Math.abs(b)}x {c < 0 ? "−" : "+"} {Math.abs(c)}
            </h3>
            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="x"
                    type="number"
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    dataKey="y"
                    type="number"
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 12 }}
                  />
                  <ReTooltip formatter={(v: any) => nf(Number(v), 4)} />
                  <Legend />
                  <ReferenceLine y={0} />
                  <ReferenceLine x={vertex.xv} />
                  <Line type="monotone" dataKey="y" name="y" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Vertical line is the axis of symmetry (x = {nf(axis)}). Horizontal line is the x-axis (y = 0).
            </p>
          </div>
        )}

        {/* Steps (collapsible) */}
        <div className="mt-10 bg-gradient-to-br from-[#1e293b] via-[#111827] to-[#0f172a] rounded-2xl border border-indigo-600/40 shadow-xl overflow-hidden">
          <button
            onClick={() => setShowSteps((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold text-lg tracking-wide hover:opacity-90 transition-all"
          >
            <span>🧮 Step-by-Step Solution</span>
            {showSteps ? <ChevronUp /> : <ChevronDown />}
          </button>

          {showSteps && (
            <div className="px-6 pb-8 pt-4 space-y-3 text-slate-200">
              <h4 className="font-semibold text-cyan-300">Quadratic Formula</h4>
              <p className="font-mono">
                x = [−b ± √(b² − 4ac)] / (2a)
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Compute discriminant: D = b² − 4ac = {nf(D)}</li>
                <li>
                  If D ≥ 0, √D = {D >= 0 ? nf(Math.sqrt(Math.max(0, D))) : "—"}; else √(−D) ={" "}
                  {D < 0 ? nf(Math.sqrt(-D)) : "—"}
                </li>
                <li>Denominator: 2a = {nf(2 * a)}</li>
                <li>
                  Roots:
                  {a !== 0 && roots ? (
                    !hasComplex ? (
                      <>
                        {" "}
                        x₁ = {nf((-b + Math.sqrt(D)) / (2 * a))}, x₂ ={" "}
                        {nf((-b - Math.sqrt(D)) / (2 * a))}
                      </>
                    ) : (
                      <>
                        {" "}
                        x₁ = {fmtComplex(-b / (2 * a), Math.sqrt(-D) / (2 * a))}, x₂ ={" "}
                        {fmtComplex(-b / (2 * a), -Math.sqrt(-D) / (2 * a))}
                      </>
                    )
                  ) : (
                    " —"
                  )}
                </li>
              </ol>

              <h4 className="font-semibold text-cyan-300">Vertex & Axis</h4>
              <p>
                xᵥ = −b / (2a) = {nf(vertex.xv)}, &nbsp; yᵥ = f(xᵥ) = {nf(vertex.yv)}. Axis: x ={" "}
                {nf(axis)}.
              </p>

              <h4 className="font-semibold text-cyan-300">Intercepts</h4>
              <p>
                y-intercept at x=0 → (0, c) = (0, {nf(c)}). x-intercepts are the real roots (if any).
              </p>

              {factorization && (
                <>
                  <h4 className="font-semibold text-cyan-300">Factorization</h4>
                  <p className="font-mono">{factorization}</p>
                </>
              )}

              <div className="h-2 w-full mt-6 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 blur-[2px]" />
            </div>
          )}
        </div>

        <AdBanner type="bottom" />
        {/* ==================== SEO CONTENT SECTION ==================== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
        
          {/* ===== Table of Contents ===== */}
          <nav className="mt-2 mb-10 bg-[#0f172a] border border-[#334155] rounded-xl p-5 text-slate-200">
            <h2 className="text-lg font-semibold text-cyan-300 mb-3">📖 Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><a href="#overview" className="text-indigo-400 hover:underline">Overview: What This Quadratic Solver Does</a></li>
              <li><a href="#how-to-use" className="text-indigo-400 hover:underline">How to Use the Tool</a></li>
              <li><a href="#formula" className="text-indigo-400 hover:underline">Quadratic Formula &amp; Discriminant</a></li>
              <li><a href="#vertex-axis" className="text-indigo-400 hover:underline">Vertex, Axis &amp; Intercepts</a></li>
              <li><a href="#factorization" className="text-indigo-400 hover:underline">When Factorization Appears</a></li>
              <li><a href="#graph" className="text-indigo-400 hover:underline">Reading the Parabola Graph</a></li>
              <li><a href="#examples" className="text-indigo-400 hover:underline">Worked Examples</a></li>
              <li><a href="#benefits" className="text-indigo-400 hover:underline">Benefits</a></li>
              <li><a href="#tips" className="text-indigo-400 hover:underline">Tips &amp; Pitfalls</a></li>
              <li><a href="#pros-cons" className="text-indigo-400 hover:underline">Pros &amp; Cons</a></li>
              <li><a href="#faq" className="text-indigo-400 hover:underline">FAQ</a></li>
            </ol>
          </nav>
        
          {/* ===== Overview ===== */}
          <h1 id="overview" className="text-3xl font-bold text-cyan-400 mb-6">
            Quadratic Equation Solver – Roots, Vertex, Discriminant &amp; Live Graph (2025–2026)
          </h1>
          <p>
            The <strong>Quadratic Equation Solver by CalculatorHub</strong> computes <strong>real or complex roots</strong> for 
            <em> ax² + bx + c = 0</em>, shows the <strong>discriminant</strong>, <strong>vertex</strong>, <strong>axis of symmetry</strong>, and 
            <strong> intercepts</strong>, and draws an interactive <strong>parabola</strong> so you can see the solution visually. 
            When conditions are right, it also displays a clean <strong>factorization</strong>.
          </p>
          <p>
            Shareable URLs preserve coefficients (<code>a</code>, <code>b</code>, <code>c</code>), making it easy for classmates, teachers, or teammates to 
            open the exact same problem.
          </p>
        
          <figure className="my-8">
            <img
              src="/images/quadratic-solver-hero.webp"
              alt="Quadratic equation solver visualizing the parabola and roots"
              title="Quadratic Equation Solver — roots, vertex, discriminant & graph"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Visual parabola with vertex &amp; axis markers; roots shown in real or a±bi form.
            </figcaption>
          </figure>
        
          {/* ===== How to use ===== */}
          <h2 id="how-to-use" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">💡 How to Use the Tool</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter <strong>a</strong> (must be non-zero), <strong>b</strong>, and <strong>c</strong>.</li>
            <li>Check <strong>Results</strong> for discriminant, roots, vertex, axis, and intercepts.</li>
            <li>Review <strong>Graph</strong> to see the parabola and symmetry line.</li>
            <li>Open <strong>Step-by-Step</strong> to view the working.</li>
            <li>Use <strong>Copy Results</strong> or <strong>Copy Link</strong> to share.</li>
          </ol>
        
          {/* ===== Formula & Discriminant ===== */}
          <h2 id="formula" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">🧮 Quadratic Formula &amp; Discriminant</h2>
          <pre className="bg-slate-800 text-slate-200 p-3 rounded-lg overflow-x-auto">
        {`x = [−b ± √(b² − 4ac)] / (2a)
        Discriminant (D) = b² − 4ac
        D > 0 → two distinct real roots
        D = 0 → one real repeated root
        D < 0 → two complex conjugate roots`}
          </pre>
          <p className="text-sm text-slate-400">
            Sign of <strong>a</strong> controls opening: <em>a &gt; 0</em> opens upward, <em>a &lt; 0</em> downward.
          </p>
        
          {/* ===== Vertex & Intercepts ===== */}
          <h2 id="vertex-axis" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">📍 Vertex, Axis &amp; Intercepts</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Vertex</strong>: <code>xᵥ = −b/(2a)</code>, <code>yᵥ = f(xᵥ)</code>.</li>
            <li><strong>Axis of symmetry</strong>: <code>x = −b/(2a)</code>.</li>
            <li><strong>y-intercept</strong>: set x = 0 → <code>(0, c)</code>.</li>
            <li><strong>x-intercepts</strong>: the real roots (if any).</li>
          </ul>
        
          {/* ===== Factorization rules ===== */}
          <h2 id="factorization" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">🧱 When Factorization Appears</h2>
          <p>
            If <code>a</code>, <code>b</code>, <code>c</code> are integers and the discriminant is a <strong>perfect square</strong>, the trinomial 
            factors neatly (e.g., <code>(x − r₁)(x − r₂)</code> or <code>(mx + p)(nx + q)</code>). Otherwise, the formula gives the exact result.
          </p>

          <AdBanner type="bottom" />
          {/* ===== Graph reading ===== */}
          <h2 id="graph" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">📈 Reading the Parabola Graph</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>The vertical line marks the <strong>axis of symmetry</strong>.</li>
            <li>The horizontal line is the <strong>x-axis</strong> (<code>y = 0</code>) where real roots appear.</li>
            <li>The curve’s minimum/maximum point is the <strong>vertex</strong> (<em>a&gt;0</em> → minimum, <em>a&lt;0</em> → maximum).</li>
          </ul>
        
          {/* ===== Worked examples ===== */}
          <h2 id="examples" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">📚 Worked Examples</h2>
        
          <h3 className="text-xl font-semibold text-indigo-300">A) Two Real Roots</h3>
          <p>
            Solve <em>x² − 5x + 6 = 0</em>. D = (−5)² − 4·1·6 = 25 − 24 = 1 &gt; 0 → two real roots. 
            Roots: x = (5 ± 1)/2 → <strong>2</strong> and <strong>3</strong>. Factorization: (x − 2)(x − 3).
          </p>
        
          <h3 className="text-xl font-semibold text-indigo-300 mt-6">B) One Repeated Root</h3>
          <p>
            Solve <em>x² − 4x + 4 = 0</em>. D = 16 − 16 = 0 → one real repeated root. 
            Root: x = 4/(2) = <strong>2</strong>. Factorization: (x − 2)².
          </p>
        
          <h3 className="text-xl font-semibold text-indigo-300 mt-6">C) Complex Roots</h3>
          <p>
            Solve <em>x² + x + 1 = 0</em>. D = 1 − 4 = −3 &lt; 0 → complex conjugates. 
            Roots: <strong>−1/2 ± (√3/2)i</strong>.
          </p>
        
          {/* ===== Benefits ===== */}
          <h2 id="benefits" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">✅ Benefits</h2>
          <ul className="space-y-2">
            <li>✔️ Fast, precise roots (real/complex) with <strong>clear steps</strong>.</li>
            <li>✔️ <strong>Graph view</strong> for intuition about vertex, symmetry, and intercepts.</li>
            <li>✔️ <strong>Shareable URL</strong> to reproduce the same coefficients and outputs.</li>
            <li>✔️ <strong>Optional factorization</strong> when conditions are met.</li>
          </ul>
        
          {/* ===== Tips ===== */}
          <h2 id="tips" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">🧭 Tips &amp; Pitfalls</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Check that <strong>a ≠ 0</strong>; otherwise, it isn’t quadratic.</li>
            <li>Large |b| or |c| can shift the vertex away from the origin—use the graph for context.</li>
            <li>For integer factorization, a <strong>perfect-square discriminant</strong> is your friend.</li>
            <li>Complex roots always come in <strong>conjugate pairs</strong> when coefficients are real.</li>
          </ul>
        
          {/* ===== Pros / Cons ===== */}
          <h2 id="pros-cons" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">⚖️ Pros &amp; Cons</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
              <h3 className="text-emerald-300 font-semibold mb-2">Pros</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Bank-grade precision and readable steps.</li>
                <li>Visual graph boosts conceptual understanding.</li>
                <li>Shareable and privacy-friendly.</li>
              </ul>
            </div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
              <h3 className="text-rose-300 font-semibold mb-2">Cons</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Factorization appears only in special integer/perfect-square cases.</li>
                <li>Doesn’t cover higher-degree polynomials.</li>
                <li>Graph is qualitative; not a full CAS.</li>
              </ul>
            </div>
          </div>
        
          {/* ===== FAQ ===== */}
          <section className="space-y-6 mt-16">
            <h2 id="faq" className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>
        
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Does this handle complex roots?</h3>
                <p>Yes. If D &lt; 0, roots are shown as <em>a ± bi</em> and the graph still displays the parabola.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">When do I see a factorized form?</h3>
                <p>If a, b, c are integers and D is a perfect square, you’ll see a neat factorization.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Can I share my equation?</h3>
                <p>Yes—use “Copy Link” to share a URL that preserves your coefficients.</p>
              </div>
            </div>
          </section>
        </section>
        
        {/* =================== AUTHOR & BACKLINK SECTION =================== */}
        <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <img
              src="/images/calculatorhub-author.webp"
              alt="CalculatorHub Math Tools Team"
              className="w-12 h-12 rounded-full border border-gray-600"
              loading="lazy"
            />
            <div>
              <p className="font-semibold text-white">Written by the CalculatorHub Math Tools Team</p>
              <p className="text-sm text-slate-400">
                Specialists in algebra &amp; graphing. Last updated:{" "}
                <time dateTime="2025-11-09">November 9, 2025</time>.
              </p>
            </div>
          </div>
        
          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              🚀 Explore more tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/percentage-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
              >
                % Percentage Calculator
              </Link>
              <Link
                to="/average-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-400 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
              >
                📊 Average Calculator
              </Link>
              <Link
                to="/standard-deviation-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-pink-600/20 text-pink-300 hover:text-pink-400 px-3 py-2 rounded-md border border-slate-700 hover:border-pink-500 transition-all duration-200"
              >
                σ Standard Deviation
              </Link>
            </div>
          </div>
        </section>


        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/quadratic-equation-solver" category="math-tools" />
      </div>
    </>
  );
};

/* ============================================================
   🧩 Small UI helpers
   ============================================================ */
const Field: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  info?: string;
}> = ({ label, value, onChange, placeholder, info }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <Info
          onClick={() => setShow((s) => !s)}
          className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
        />
      </div>
      {show && info && (
        <div className="mb-2 bg-[#0f172a] text-slate-300 text-xs p-2 rounded-md border border-[#334155]">
          {info}
        </div>
      )}
      <input
        type="number"
        value={Number.isFinite(value) ? value : undefined}
        placeholder={placeholder}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
};

const Tile: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155] shadow-sm">
    <div className="text-sm text-slate-400">{label}</div>
    <div className="text-lg font-semibold text-white break-words">{value}</div>
  </div>
);

export default QuadraticEquationSolver;
