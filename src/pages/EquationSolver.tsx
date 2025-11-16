// src/pages/EquationSolver.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Brackets,
  RotateCcw,
  Share2,
  Copy,
  ChevronDown,
  ChevronUp,
  Info,
  Sigma,
  FunctionSquare,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Infinity as InfinityIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  ReferenceDot,
} from "recharts";

import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import { generateCalculatorSchema } from "../utils/seoData";
import RelatedCalculators from "../components/RelatedCalculators";

/* ============================================================
   📦 Utilities (same math as before, tidied)
   ============================================================ */
const LS_KEY = "equation_solver_state_v2";
const URL_KEY = "es";

const nf = (n: number, d = 6) =>
  Number.isFinite(n) ? Number(n.toFixed(d)).toLocaleString() : "—";
const toNum = (v: any, def = 0) => (Number.isFinite(Number(v)) ? Number(v) : def);

type Complex = { re: number; im: number };
const cfmt = (z: Complex, d = 6) => {
  const r = Number(z.re.toFixed(d));
  const i = Number(z.im.toFixed(d));
  if (Math.abs(i) < 1e-14) return r.toString();
  const sign = i >= 0 ? "+" : "−";
  return `${r} ${sign} ${Math.abs(i).toFixed(d)}i`;
};

function solveLinear(a: number, b: number): Complex[] {
  if (Math.abs(a) < 1e-15) return [];
  return [{ re: -b / a, im: 0 }];
}

function solveQuadratic(a: number, b: number, c: number) {
  if (Math.abs(a) < 1e-15) {
    return { type: "linear" as const, roots: solveLinear(b, c), disc: 0 };
  }
  const disc = b * b - 4 * a * c;
  if (disc >= 0) {
    const sqrtD = Math.sqrt(disc);
    const x1 = (-b + sqrtD) / (2 * a);
    const x2 = (-b - sqrtD) / (2 * a);
    return { type: "quadratic" as const, roots: [{ re: x1, im: 0 }, { re: x2, im: 0 }], disc };
  } else {
    const sqrtAbs = Math.sqrt(-disc);
    const re = -b / (2 * a);
    const im = sqrtAbs / (2 * a);
    return { type: "quadratic" as const, roots: [{ re, im }, { re, im: -im }], disc };
  }
}

type GEStep = { matrix: number[][]; rhs: number[]; note: string };
type SystemResult =
  | { status: "unique"; solution: number[]; det?: number; steps: GEStep[] }
  | { status: "infinite"; steps: GEStep[]; message: string }
  | { status: "none"; steps: GEStep[]; message: string };

function det2(M: number[][]) {
  return M[0][0] * M[1][1] - M[0][1] * M[1][0];
}
function det3(M: number[][]) {
  const [a, b, c] = M[0];
  const [d, e, f] = M[1];
  const [g, h, i] = M[2];
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
}
const deepCopy = (M: number[][]) => M.map((r) => r.slice());
const pushStep = (steps: GEStep[], A: number[][], b: number[], note: string) =>
  steps.push({ matrix: deepCopy(A), rhs: b.slice(), note });

function rank(A: number[][]) {
  const M = deepCopy(A);
  const rows = M.length;
  const cols = M[0].length;
  let rnk = 0;
  let row = 0;
  for (let col = 0; col < cols && row < rows; col++) {
    let piv = row;
    for (let i = row + 1; i < rows; i++) {
      if (Math.abs(M[i][col]) > Math.abs(M[piv][col])) piv = i;
    }
    if (Math.abs(M[piv][col]) < 1e-14) continue;
    [M[row], M[piv]] = [M[piv], M[row]];
    const pv = M[row][col];
    for (let j = col; j < cols; j++) M[row][j] /= pv;
    for (let i = 0; i < rows; i++) {
      if (i === row) continue;
      const f = M[i][col];
      for (let j = col; j < cols; j++) M[i][j] -= f * M[row][j];
    }
    rnk++;
    row++;
  }
  return rnk;
}

function solveSystem(Ain: number[][], bin: number[]): SystemResult {
  const n = Ain.length;
  const A = deepCopy(Ain);
  const b = bin.slice();
  const steps: GEStep[] = [];
  pushStep(steps, A, b, "Start augmented matrix [A|b]");

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let i = col + 1; i < n; i++) {
      if (Math.abs(A[i][col]) > Math.abs(A[pivot][col])) pivot = i;
    }
    if (Math.abs(A[pivot][col]) < 1e-14) continue;
    if (pivot !== col) {
      [A[col], A[pivot]] = [A[pivot], A[col]];
      [b[col], b[pivot]] = [b[pivot], b[col]];
      pushStep(steps, A, b, `Swap row ${col + 1} ↔ row ${pivot + 1}`);
    }
    const pv = A[col][col];
    for (let r = col + 1; r < n; r++) {
      const f = A[r][col] / pv;
      if (Math.abs(f) < 1e-14) continue;
      for (let c = col; c < n; c++) A[r][c] -= f * A[col][c];
      b[r] -= f * b[col];
      pushStep(steps, A, b, `R${r + 1} ← R${r + 1} − (${f.toFixed(4)})·R${col + 1}`);
    }
  }

  const Ab = A.map((row, i) => [...row, b[i]]);
  const rA = rank(A);
  const rAb = rank(Ab);
  if (rA < rAb) return { status: "none", steps, message: "Inconsistent equations: no solution." };
  if (rA < n) return { status: "infinite", steps, message: "Underdetermined: infinitely many solutions." };

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i];
    for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j];
    const aii = A[i][i];
    if (Math.abs(aii) < 1e-14)
      return { status: "infinite", steps, message: "Zero pivot: infinitely many solutions." };
    x[i] = s / aii;
    pushStep(steps, A, b, `Back-substitute to find x${i + 1}`);
  }

  let det: number | undefined;
  if (n === 2) det = det2(Ain);
  if (n === 3) det = det3(Ain);
  return { status: "unique", solution: x, det, steps };
}

function buildQuadraticSeries(a: number, b: number, c: number, focusX?: number) {
  const xr = Number.isFinite(focusX) ? (focusX as number) : -b / (2 * (Math.abs(a) < 1e-15 ? 1 : a));
  const span = 8;
  const xMin = xr - span;
  const xMax = xr + span;
  const N = 240;
  const out: { x: number; y: number }[] = [];
  const step = (xMax - xMin) / N;
  for (let i = 0; i <= N; i++) {
    const xx = xMin + i * step;
    out.push({ x: xx, y: a * xx * xx + b * xx + c });
  }
  return out;
}

/* ============================================================
   🎨 Component — refreshed UI
   ============================================================ */
const EquationSolver: React.FC = () => {
  const [tab, setTab] = useState<"one" | "system">("one");

  // 1-variable
  const [a, setA] = useState(1);
  const [b, setB] = useState(-3);
  const [c, setC] = useState(2);

  // system
  const [size, setSize] = useState<2 | 3>(2);
  const [A11, setA11] = useState(2), [A12, setA12] = useState(1), [A13, setA13] = useState(0);
  const [A21, setA21] = useState(1), [A22, setA22] = useState(-1), [A23, setA23] = useState(0);
  const [A31, setA31] = useState(0), [A32, setA32] = useState(0), [A33, setA33] = useState(1);
  const [B1, setB1] = useState(4), [B2, setB2] = useState(1), [B3, setB3] = useState(0);

  // UI
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [showSteps1, setShowSteps1] = useState(false);
  const [showSteps2, setShowSteps2] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const isDefault =
    tab === "one" &&
    a === 1 && b === -3 && c === 2 &&
    size === 2 &&
    A11 === 2 && A12 === 1 && A13 === 0 &&
    A21 === 1 && A22 === -1 && A23 === 0 &&
    A31 === 0 && A32 === 0 && A33 === 1 &&
    B1 === 4 && B2 === 1 && B3 === 0;

  /* Hydration */
  const applyState = (s: any) => {
    if (s.tab === "system" || s.tab === "one") setTab(s.tab);
    setA(toNum(s.a, 1)); setB(toNum(s.b, -3)); setC(toNum(s.c, 2));
    const sz = Number(s.size); setSize(sz === 3 ? 3 : 2);
    setA11(toNum(s.A11, 2)); setA12(toNum(s.A12, 1)); setA13(toNum(s.A13, 0));
    setA21(toNum(s.A21, 1)); setA22(toNum(s.A22, -1)); setA23(toNum(s.A23, 0));
    setA31(toNum(s.A31, 0)); setA32(toNum(s.A32, 0)); setA33(toNum(s.A33, 1));
    setB1(toNum(s.B1, 4)); setB2(toNum(s.B2, 1)); setB3(toNum(s.B3, 0));
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get(URL_KEY);
      if (q) {
        applyState(JSON.parse(atob(q)));
        setHydrated(true);
        return;
      }
      const raw = localStorage.getItem(LS_KEY);
      if (raw) applyState(JSON.parse(raw));
    } catch {
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const state = {
        tab, a, b, c, size,
        A11, A12, A13, A21, A22, A23, A31, A32, A33,
        B1, B2, B3,
      };
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {}
  }, [hydrated, tab, a, b, c, size, A11, A12, A13, A21, A22, A23, A31, A32, A33, B1, B2, B3]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const url = new URL(window.location.href);
      if (isDefault) {
        url.searchParams.delete(URL_KEY);
        window.history.replaceState({}, "", url);
      } else {
        const encoded = btoa(
          JSON.stringify({
            tab, a, b, c, size,
            A11, A12, A13, A21, A22, A23, A31, A32, A33, B1, B2, B3,
          })
        );
        url.searchParams.set(URL_KEY, encoded);
        window.history.replaceState({}, "", url);
      }
    } catch {}
  }, [hydrated, isDefault, tab, a, b, c, size, A11, A12, A13, A21, A22, A23, A31, A32, A33, B1, B2, B3]);

  /* Math */
  const quad = useMemo(() => solveQuadratic(a, b, c), [a, b, c]);
  const xFocus = useMemo(() => (Math.abs(a) < 1e-15 ? (solveLinear(b, c)[0]?.re ?? 0) : -b / (2 * a)), [a, b, c]);
  const plotData = useMemo(() => buildQuadraticSeries(a, b, c, xFocus), [a, b, c, xFocus]);

  const AMatrix = useMemo(
    () =>
      size === 2 ? [[A11, A12], [A21, A22]] : [[A11, A12, A13], [A21, A22, A23], [A31, A32, A33]],
    [size, A11, A12, A13, A21, A22, A23, A31, A32, A33]
  );
  const bVec = useMemo(() => (size === 2 ? [B1, B2] : [B1, B2, B3]), [size, B1, B2, B3]);
  const sys = useMemo(() => solveSystem(AMatrix, bVec), [AMatrix, bVec]);

  /* Copy/Share/Reset */
  const copyResults = async () => {
    const parts: string[] = [];
    parts.push("Equation Solver (summary)");
    parts.push(`Mode: ${tab}`);
    if (tab === "one") {
      parts.push(`Equation: ${a}x^2 + ${b}x + ${c} = 0`);
      if (quad.type === "linear") {
        parts.push(quad.roots.length ? `Root: x=${nf(quad.roots[0].re)}` : "No single root / infinite.");
      } else {
        parts.push(`Δ = ${nf(quad.disc)}`);
        parts.push(`x1 = ${cfmt(quad.roots[0])}, x2 = ${cfmt(quad.roots[1])}`);
      }
    } else {
      parts.push(`Size: ${size}x${size}`);
      parts.push(`A = ${JSON.stringify(AMatrix)}`);
      parts.push(`b = ${JSON.stringify(bVec)}`);
      if (sys.status === "unique") {
        parts.push(`Solution: ${sys.solution.map((v, i) => `x${i + 1}=${nf(v)}`).join(", ")}`);
        if (typeof sys.det === "number") parts.push(`det(A) = ${nf(sys.det)}`);
      } else parts.push(sys.message);
    }
    await navigator.clipboard.writeText(parts.join("\n"));
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };
  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    const encoded = btoa(
      JSON.stringify({
        tab, a, b, c, size,
        A11, A12, A13, A21, A22, A23, A31, A32, A33, B1, B2, B3,
      })
    );
    url.searchParams.set(URL_KEY, encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };
  const reset = () => {
    setTab("one");
    setA(1); setB(-3); setC(2);
    setSize(2);
    setA11(2); setA12(1); setA13(0);
    setA21(1); setA22(-1); setA23(0);
    setA31(0); setA32(0); setA33(1);
    setB1(4); setB2(1); setB3(0);
    setShowSteps1(false); setShowSteps2(false);
    localStorage.removeItem(LS_KEY);
  };

  /* Status chip for system */
  const statusChip =
    tab === "system" ? (
      sys.status === "unique" ? (
        <Badge tone="success" icon={<CheckCircle2 className="h-4 w-4" />}>Unique solution</Badge>
      ) : sys.status === "infinite" ? (
        <Badge tone="warning" icon={<InfinityIcon className="h-4 w-4" />}>Infinite solutions</Badge>
      ) : (
        <Badge tone="danger" icon={<XCircle className="h-4 w-4" />}>No solution</Badge>
      )
    ) : null;

  return (
    <>
      {/** ================= TECHNICAL SEO (FD-style) ================= */}
      <SEOHead
        title="Equation Solver — Linear & Quadratic Roots + 2×2/3×3 Systems (Gaussian Steps)"
        description="Solve linear/quadratic equations and 2×2/3×3 linear systems fast. See discriminant, complex roots, Gaussian elimination steps, shareable state, and a clean graph."
        keywords={[
          "equation solver",
          "quadratic formula",
          "linear equations",
          "gaussian elimination",
          "2x2 system",
          "3x3 system",
          "determinant",
          "rank",
          "discriminant",
          "complex roots",
          "math tools"
        ]}
        canonical="https://calculatorhub.site/equation-solver"
        schemaData={[
          /* 1) WebPage + nested Article */
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://calculatorhub.site/equation-solver#webpage",
            "url": "https://calculatorhub.site/equation-solver",
            "name": "Equation Solver — Linear & Quadratic + 2×2/3×3 Systems",
            "inLanguage": "en",
            "isPartOf": { "@id": "https://calculatorhub.site/#website" },
            "primaryImageOfPage": {
              "@type": "ImageObject",
              "@id": "https://calculatorhub.site/images/equation-solver-hero.webp#primaryimg",
              "url": "https://calculatorhub.site/images/equation-solver-hero.webp",
              "width": 1200,
              "height": 675
            },
            "mainEntity": {
              "@type": "Article",
              "@id": "https://calculatorhub.site/equation-solver#article",
              "headline": "Equation Solver — Linear & Quadratic Roots, 2×2/3×3 Systems with Steps",
              "description": "Enter coefficients for ax²+bx+c=0 or fill A and b for A·x=b. Get roots (including complex), system status (unique/infinite/none), determinant, rank hints, and step-by-step Gaussian elimination.",
              "image": ["https://calculatorhub.site/images/equation-solver-hero.webp"],
              "author": { "@type": "Organization", "name": "CalculatorHub", "url": "https://calculatorhub.site" },
              "publisher": { "@id": "https://calculatorhub.site/#organization" },
              "datePublished": "2025-11-09",
              "dateModified": "2025-11-09",
              "mainEntityOfPage": { "@id": "https://calculatorhub.site/equation-solver#webpage" },
              "articleSection": ["1-Variable", "Linear System", "Graph", "Gaussian Steps", "Tips & FAQ"]
            }
          },
      
          /* 2) Breadcrumbs */
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "@id": "https://calculatorhub.site/equation-solver#breadcrumbs",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://calculatorhub.site/" },
              { "@type": "ListItem", "position": 2, "name": "Math Tools", "item": "https://calculatorhub.site/category/math-tools" },
              { "@type": "ListItem", "position": 3, "name": "Equation Solver", "item": "https://calculatorhub.site/equation-solver" }
            ]
          },
      
          /* 3) FAQ */
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://calculatorhub.site/equation-solver#faq",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What kinds of equations can I solve?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Linear and quadratic equations in one variable, plus 2×2 and 3×3 linear systems using Gaussian elimination with partial pivoting."
                }
              },
              {
                "@type": "Question",
                "name": "Do you handle complex roots?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. When Δ < 0, the solver shows complex conjugate roots for quadratics."
                }
              },
              {
                "@type": "Question",
                "name": "How are system types classified?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "We compare ranks of A and [A|b]. Rank(A) = Rank([A|b]) = n → unique solution; Rank(A) = Rank([A|b]) < n → infinitely many; Rank(A) < Rank([A|b]) → no solution."
                }
              },
              {
                "@type": "Question",
                "name": "Can I share my current inputs?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. The state is encoded in the URL, so you can copy a shareable link."
                }
              }
            ]
          },
      
          /* 4) WebApplication */
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://calculatorhub.site/equation-solver#webapp",
            "name": "Equation Solver",
            "url": "https://calculatorhub.site/equation-solver",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web",
            "description": "Interactive solver for linear/quadratic equations and small linear systems with Gaussian steps and graph.",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "image": ["https://calculatorhub.site/images/equation-solver-hero.webp"]
          },
      
          /* 5) SoftwareApplication */
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://calculatorhub.site/equation-solver#software",
            "name": "Equation Solver",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "All",
            "url": "https://calculatorhub.site/equation-solver",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "description": "Solve ax²+bx+c=0 and A·x=b with clear steps, determinant (for 2×2/3×3), and shareable state."
          },
      
          /* 6) WebSite + Organization (global) */
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": "https://calculatorhub.site/#website",
            "url": "https://calculatorhub.site",
            "name": "CalculatorHub",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://calculatorhub.site/search?q={query}",
              "query-input": "required name=query"
            }
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": "https://calculatorhub.site/#organization",
            "name": "CalculatorHub",
            "url": "https://calculatorhub.site",
            "logo": { "@type": "ImageObject", "url": "https://calculatorhub.site/images/logo.png" }
          }
        ]}
      />
      
      {/** ===== Outside meta/link tags ===== */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <link rel="canonical" href="https://calculatorhub.site/equation-solver" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/equation-solver" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/equation-solver" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/equation-solver" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Equation Solver — Linear & Quadratic + 2×2/3×3 Systems" />
      <meta property="og:description" content="Get roots, system status, determinant, and Gaussian steps. Share state via URL and view a clean graph." />
      <meta property="og:url" content="https://calculatorhub.site/equation-solver" />
      <meta property="og:image" content="https://calculatorhub.site/images/equation-solver-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Equation Solver UI showing inputs, results, and Gaussian steps table" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Equation Solver — Roots & Linear Systems with Steps" />
      <meta name="twitter:description" content="Solve ax²+bx+c=0 and A·x=b. See discriminant, complex roots, determinant, rank checks, and elimination steps." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/equation-solver-hero.webp" />
      <meta name="twitter:creator" content="@CalculatorHub" />
      <meta name="twitter:site" content="@CalculatorHub" />
      
      {/** PWA & theme */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#0ea5e9" />
      
      {/** Performance */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="preload" as="image" href="/images/equation-solver-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />
      

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Math Tools", url: "/category/math-tools" },
            { name: "Equation Solver", url: "/equation-solver" },
          ]}
        />

        {/* Hero */}
        <div className="mb-6 rounded-xl border border-[#334155] bg-gradient-to-tr from-indigo-700/20 via-fuchsia-700/10 to-cyan-700/10 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-300" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Equation Solver</h1>
          </div>
          <p className="mt-2 text-slate-300 text-sm">
            Enter numbers → get answers instantly. Use <strong>1-Variable</strong> for linear/quadratic, or <strong>Linear System</strong> for 2×2/3×3.
          </p>
        </div>

        {/* Top actions */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Tabs tab={tab} setTab={setTab} />
          <div className="ml-auto flex gap-2">
            <ActionButton onClick={copyResults} icon={<Copy size={16} />}>Copy</ActionButton>
            <ActionButton onClick={copyShareLink} icon={<Share2 size={16} />}>Share</ActionButton>
            <ActionButton onClick={reset} variant="ghost" icon={<RotateCcw size={16} />}>Reset</ActionButton>
          </div>
        </div>

        {/* Content */}
        {tab === "one" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Inputs */}
            <Card title="1-Variable (Linear / Quadratic)" subtitle="Give a, b, c for ax² + bx + c = 0">
              <div className="grid grid-cols-3 gap-4">
                <NumInput label="a" value={a} onChange={setA} example="Try 1" />
                <NumInput label="b" value={b} onChange={setB} example="Try −3" />
                <NumInput label="c" value={c} onChange={setC} example="Try 2" />
              </div>
              <Hint text="If a = 0, it becomes a linear equation: bx + c = 0" />
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { a: 1, b: -3, c: 2, label: "Two real roots" },
                  { a: 1, b: 2, c: 5, label: "Complex roots" },
                  { a: 0, b: 5, c: -10, label: "Linear" },
                ].map((ex, i) => (
                  <Chip key={i} onClick={() => { setA(ex.a); setB(ex.b); setC(ex.c); }}>
                    {ex.label}
                  </Chip>
                ))}
              </div>
            </Card>

            {/* Results */}
            <Card title="Results" subtitle="Clean summary first, details below">
              {quad.type === "linear" ? (
                <>
                  {quad.roots.length ? (
                    <BigResult label="Root" value={nf(quad.roots[0].re)} />
                  ) : (
                    <EmptyNote text="No single root (b = 0). If c ≠ 0 → no solution; if c = 0 → infinitely many." />
                  )}
                </>
              ) : (
                <>
                  <ResultGrid
                    items={[
                      { label: "Discriminant Δ", value: nf(quad.disc) },
                      { label: "Equation", value: `${a}x² + ${b}x + ${c} = 0` },
                    ]}
                  />
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Tile label="x₁" value={cfmt(quad.roots[0])} />
                    <Tile label="x₂" value={cfmt(quad.roots[1])} />
                  </div>
                </>
              )}
            </Card>

            {/* Plot */}
            <Card title="Graph (optional)" subtitle="See the curve & vertex">
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={plotData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" type="number" domain={["auto", "auto"]} tick={{ fontSize: 12 }} />
                    <YAxis dataKey="y" type="number" domain={["auto", "auto"]} tick={{ fontSize: 12 }} />
                    <ReTooltip formatter={(v: any) => nf(Number(v), 6)} />
                    <Legend />
                    <Line type="monotone" dataKey="y" name="y" dot={false} />
                    {Math.abs(a) > 1e-15 && <ReferenceDot x={xFocus} y={a * xFocus * xFocus + b * xFocus + c} r={4} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                {Math.abs(a) > 1e-15 ? `Vertex at x = ${nf(xFocus, 4)}` : `Linear function: straight line`}
              </p>
            </Card>

            {/* Steps */}
            <ExplainBlock
              open={showSteps1}
              onToggle={() => setShowSteps1((v) => !v)}
              title="Explain this result"
            >
              {quad.type === "linear" ? (
                <ol className="list-decimal list-inside space-y-1">
                  <li>Linear equation: <span className="font-mono">{b}x + {c} = 0</span></li>
                  <li>{Math.abs(b) > 1e-15 ? <>x = −c / b = <span className="font-mono">{nf(-c / b)}</span></> : "b = 0 → either no or infinite solutions"}</li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-1">
                  <li>Δ = b² − 4ac = <span className="font-mono">{nf(quad.disc)}</span></li>
                  <li>Roots: <span className="font-mono">x = (−b ± √Δ) / (2a)</span></li>
                  <li>Computed: x₁ = {cfmt(quad.roots[0])}, x₂ = {cfmt(quad.roots[1])}</li>
                </ol>
              )}
            </ExplainBlock>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Inputs */}
            <Card title="Linear System (2×2 or 3×3)" subtitle="Fill A and b for A·x = b">
              <div className="flex items-center gap-3 mb-3">
                <label className="text-sm text-slate-300">Size</label>
                <select
                  aria-label="System size"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value) === 3 ? 3 : 2)}
                  className="px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-md text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={2}>2 × 2</option>
                  <option value={3}>3 × 3</option>
                </select>
                <div className="ml-auto">{statusChip}</div>
              </div>

              <MatrixInputs
                size={size}
                A={{ A11, A12, A13, A21, A22, A23, A31, A32, A33 }}
                setA={{ setA11, setA12, setA13, setA21, setA22, setA23, setA31, setA32, setA33 }}
                b={{ B1, B2, B3 }}
                setB={{ setB1, setB2, setB3 }}
              />

              <div className="mt-3 flex flex-wrap gap-2">
                {size === 2 ? (
                  <>
                    <Chip onClick={() => { setA11(2); setA12(1); setA21(1); setA22(-1); setB1(4); setB2(1); }}>Unique</Chip>
                    <Chip onClick={() => { setA11(1); setA12(2); setA21(2); setA22(4); setB1(3); setB2(6); }}>Infinite</Chip>
                    <Chip onClick={() => { setA11(1); setA12(2); setA21(2); setA22(4); setB1(3); setB2(5); }}>None</Chip>
                  </>
                ) : (
                  <>
                    <Chip onClick={() => { setA11(1); setA12(1); setA13(1); setA21(0); setA22(1); setA23(2); setA31(2); setA32(1); setA33(1); setB1(6); setB2(4); setB3(7); }}>Unique</Chip>
                    <Chip onClick={() => { setA11(1); setA12(1); setA13(1); setA21(2); setA22(2); setA23(2); setA31(3); setA32(3); setA33(3); setB1(3); setB2(6); setB3(9); }}>Infinite</Chip>
                    <Chip onClick={() => { setA11(1); setA12(1); setA13(1); setA21(2); setA22(2); setA23(2); setA31(3); setA32(3); setA33(3); setB1(3); setB2(6); setB3(10); }}>None</Chip>
                  </>
                )}
              </div>

              <Hint text="We use Gaussian elimination with partial pivoting and check ranks to classify the system." />
            </Card>

            {/* Results */}
            <Card title="Results" subtitle="Big numbers. Clear status.">
              {sys.status === "unique" ? (
                <>
                  <div className="mb-2">{statusChip}</div>
                  <div className="grid grid-cols-2 gap-4">
                    {sys.solution.map((v, i) => (
                      <BigResult key={i} label={`x${i + 1}`} value={nf(v)} />
                    ))}
                    {typeof sys.det === "number" && <Tile label="det(A)" value={nf(sys.det)} />}
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-2">{statusChip}</div>
                  <EmptyNote text={sys.message} />
                </>
              )}
            </Card>

            {/* Steps */}
            <ExplainBlock
              open={showSteps2}
              onToggle={() => setShowSteps2((v) => !v)}
              title="Explain this result"
            >
              {sys.steps.length ? (
                <div className="overflow-x-auto rounded-xl border border-[#334155]">
                  <table className="min-w-full text-sm text-slate-100">
                    <thead className="bg-[#0f172a]">
                      <tr>
                        <th className="px-3 py-2 text-left">Step</th>
                        <th className="px-3 py-2 text-left">Augmented [A|b]</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sys.steps.map((s, idx) => (
                        <tr key={idx} className={idx % 2 ? "bg-[#0f172a]/60" : "bg-[#1e293b]/60"}>
                          <td className="px-3 py-2 align-top whitespace-nowrap">{s.note}</td>
                          <td className="px-3 py-2">
                            <code className="block font-mono text-xs leading-relaxed">
                              {s.matrix
                                .map((row, i) => `[ ${row.map((v) => v.toFixed(4)).join(", ")} | ${s.rhs[i].toFixed(4)} ]`)
                                .join("\n")}
                            </code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-slate-300">—</div>
              )}
            </ExplainBlock>
          </div>
        )}

       {/* ===================== SEO Content (~1800–2000 words) ===================== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
        
          {/* ===== Table of Contents ===== */}
          <nav className="mt-2 mb-10 bg-[#0b1220] border border-[#1f2a44] rounded-xl p-5 text-slate-200">
            <h2 className="text-lg font-semibold text-gray-100 mb-3">📖 Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><a href="#what-it-does" className="text-indigo-300 hover:underline">What This Equation Solver Does</a></li>
              <li><a href="#features" className="text-indigo-300 hover:underline">Key Features at a Glance</a></li>
              <li><a href="#how-to-use" className="text-indigo-300 hover:underline">How to Use (Step-by-Step)</a></li>
              <li><a href="#one-variable" className="text-indigo-300 hover:underline">1-Variable Math: Linear & Quadratic</a></li>
              <li><a href="#discriminant" className="text-indigo-300 hover:underline">Discriminant, Root Types & Geometry</a></li>
              <li><a href="#vieta" className="text-indigo-300 hover:underline">Vieta’s Formulas & Quick Checks</a></li>
              <li><a href="#systems" className="text-indigo-300 hover:underline">Linear Systems: 2×2 & 3×3 (Gaussian Steps)</a></li>
              <li><a href="#classification" className="text-indigo-300 hover:underline">Classifying Systems: Unique / Infinite / None</a></li>
              <li><a href="#det-cramer" className="text-indigo-300 hover:underline">Determinant & Cramer’s Rule (When to Use)</a></li>
              <li><a href="#stability" className="text-indigo-300 hover:underline">Numerical Stability, Pivoting & Conditioning</a></li>
              <li><a href="#worked-examples" className="text-indigo-300 hover:underline">Worked Examples (With Rationale)</a></li>
              <li><a href="#use-cases" className="text-indigo-300 hover:underline">Real-World Use Cases & Intuition</a></li>
              <li><a href="#quick-ref" className="text-indigo-300 hover:underline">Quick Reference Cards</a></li>
              <li><a href="#faq" className="text-indigo-300 hover:underline">FAQ</a></li>
            </ol>
          </nav>
        
          {/* ===== What it does ===== */}
          <h1 id="what-it-does" className="text-3xl font-bold text-indigo-300 mb-6">
            Solve linear & quadratic equations — and 2×2/3×3 systems — with clear steps
          </h1>
          <p>
            This Equation Solver handles the two most common single-variable problems (<strong>linear</strong> and
            <strong> quadratic</strong>) and small <strong>linear systems</strong> of size 2×2 or 3×3. You’ll see core
            diagnostics such as the <strong>discriminant</strong> (Δ), <strong>complex roots</strong> when needed, the
            <strong> determinant</strong> for small systems, and a <strong>step-by-step Gaussian elimination</strong> table
            that shows exactly how the augmented matrix changes during elimination and back-substitution.
          </p>
          <p>
            Beyond raw numbers, the tool emphasizes <em>why</em> a result looks the way it does: vertex insight for quadratics,
            rank checks for systems, and friendly status badges for <em>unique solution</em>, <em>infinite solutions</em>, or
            <em> no solution</em>. You can also <strong>copy results</strong> for notes or <strong>share your state</strong> via
            URL so that classmates or teammates can load the exact inputs on their devices.
          </p>
        
          {/* ===== Features ===== */}
          <h2 id="features" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            ✨ Key features at a glance
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>1-Variable mode</strong>: solve <em>ax² + bx + c = 0</em> (quadratic) or <em>bx + c = 0</em> (linear when a=0).</li>
            <li><strong>System mode</strong>: solve 2×2 or 3×3 linear systems <em>A·x = b</em> with <em>Gaussian elimination</em> steps.</li>
            <li><strong>Clear classification</strong>: unique / infinite / none based on <em>rank</em> criteria.</li>
            <li><strong>Discriminant & complex roots</strong>: see Δ and conjugate pair when Δ &lt; 0.</li>
            <li><strong>Determinant for 2×2/3×3</strong>: a quick indicator of invertibility.</li>
            <li><strong>Graph for quadratics</strong>: visualize the curve and vertex position.</li>
            <li><strong>Copy & share</strong>: export result text or copy a permalink encoding the full state.</li>
            <li><strong>Helpful presets</strong>: one-click examples to demonstrate typical cases.</li>
          </ul>
        
          {/* ===== How to Use ===== */}
          <h2 id="how-to-use" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🧭 How to use (step-by-step)
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Select a mode: <strong>1-Variable</strong> or <strong>Linear System</strong> (tabs at the top).</li>
            <li>Enter coefficients. For quadratics, fill <em>a, b, c</em>. For systems, fill <em>A</em> and <em>b</em>.</li>
            <li>Review the <strong>Results</strong> cards for the key numbers and status.</li>
            <li>Open <strong>Explain this result</strong> to see steps (quadratic formula or Gaussian elimination table).</li>
            <li>(Optional) Use the <strong>Graph</strong> card to visualize the quadratic’s shape and vertex.</li>
            <li>Click <strong>Copy</strong> for your notes or <strong>Share</strong> to generate a link to these inputs.</li>
          </ol>
        
          {/* ===== One Variable ===== */}
          <h2 id="one-variable" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            1-Variable Math: linear & quadratic equations
          </h2>
          <p>
            When <strong>a = 0</strong>, your equation reduces to <em>bx + c = 0</em>. If <em>b ≠ 0</em>, the unique solution is
            <strong> x = −c/b</strong>. If <em>b = 0</em>, then either <em>c = 0</em> (infinitely many solutions) or
            <em> c ≠ 0</em> (no solution).
          </p>
          <p>
            When <strong>a ≠ 0</strong>, the quadratic <em>ax² + bx + c = 0</em> has solutions given by the quadratic formula:
          </p>
          <pre className="bg-[#0f172a] border border-[#334155] rounded-lg p-3 overflow-x-auto text-sm">
            x = (−b ± √(b² − 4ac)) / (2a)
          </pre>
          <p>
            The value <strong>Δ = b² − 4ac</strong> (the discriminant) determines the root type:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Δ &gt; 0</strong>: two distinct real roots.</li>
            <li><strong>Δ = 0</strong>: one repeated real root (a “double root”).</li>
            <li><strong>Δ &lt; 0</strong>: two complex conjugate roots.</li>
          </ul>
          <p>
            The solver displays Δ and the roots (real or complex). For complex cases, it shows
            <em> re ± i·im</em> explicitly to aid interpretation.
          </p>
        
          {/* ===== Discriminant & Geometry ===== */}
          <h2 id="discriminant" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            Discriminant, root types & geometry
          </h2>
          <p>
            Geometrically, a quadratic is a <strong>parabola</strong>. Its vertex lies at{" "}
            <span className="font-mono">x<sub>v</sub> = −b / (2a)</span>. The sign of <em>a</em> sets the opening:
            <em> a &gt; 0</em> opens upward, <em>a &lt; 0</em> opens downward. Real roots correspond to x-intercepts of the
            parabola. When Δ &gt; 0 you cross the x-axis twice; when Δ = 0 you just touch at the vertex; when Δ &lt; 0 you
            never cross, which is why solutions are complex.
          </p>
          <p>
            The <strong>Graph</strong> card centers the plot around the vertex so you can see shape and intercepts without
            hunting for a visible window.
          </p>
        
          {/* ===== Vieta ===== */}
          <h2 id="vieta" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            Vieta’s formulas & quick checks
          </h2>
          <p>
            For <em>ax² + bx + c = 0</em> with roots r₁ and r₂ (possibly complex):
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Sum</strong>: r₁ + r₂ = −b/a</li>
            <li><strong>Product</strong>: r₁·r₂ = c/a</li>
          </ul>
          <p>
            Vieta’s relations are perfect for quick sanity checks: after computing both roots, their sum and product should
            match these ratios (within rounding tolerance).
          </p>
        
          {/* ===== Systems (Gaussian) ===== */}
          <h2 id="systems" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            Linear systems: 2×2 & 3×3 with Gaussian elimination
          </h2>
          <p>
            To solve <em>A·x = b</em>, the tool performs <strong>Gaussian elimination with partial pivoting</strong>. You’ll see
            the augmented matrix <em>[A|b]</em> evolve through row swaps and eliminations. Once in upper-triangular form,
            we back-substitute to obtain each variable.
          </p>
          <p>
            The algorithm also captures the system’s structure via <strong>ranks</strong>. It computes
            <em> rank(A)</em> and <em>rank([A|b])</em>. These two values determine whether solutions exist and whether they’re
            unique or infinite.
          </p>
        
          {/* ===== Classification ===== */}
          <h2 id="classification" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            Classifying systems: unique, infinite, or none
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Unique solution</strong>: rank(A) = rank([A|b]) = n (the number of unknowns). Here, A is invertible.</li>
            <li><strong>Infinite solutions</strong>: rank(A) = rank([A|b]) &lt; n. There are free variables and a whole family of solutions.</li>
            <li><strong>No solution</strong>: rank(A) &lt; rank([A|b]). The system is inconsistent (parallel/conflicting equations).</li>
          </ul>
          <p>
            The UI shows a status badge matching one of these outcomes, and the steps table pinpoints where inconsistencies or
            zero pivots appear.
          </p>
        
          {/* ===== Determinant & Cramer's Rule ===== */}
          <h2 id="det-cramer" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            Determinant & Cramer’s rule (when to use)
          </h2>
          <p>
            For 2×2 and 3×3 systems we show <strong>det(A)</strong>. If det(A) ≠ 0, the system is invertible and has a unique
            solution. For tiny systems, one can also use <strong>Cramer’s rule</strong> (replace a column of A with b, compute
            determinants); it’s elegant but less efficient and more sensitive to rounding for larger matrices.
          </p>
        
          {/* ===== Stability & Conditioning ===== */}
          <h2 id="stability" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            Numerical stability, pivoting & conditioning
          </h2>
          <p>
            Linear algebra on real machines uses floating-point numbers, so rounding is inevitable. To reduce error growth,
            this solver uses <strong>partial pivoting</strong> (swapping the largest available pivot into position). Still,
            some systems are <strong>ill-conditioned</strong>: small changes in inputs cause large changes in outputs.
            Indicators include near-zero pivots or a tiny determinant. When this happens, consider scaling your equations or
            using higher-precision arithmetic.
          </p>

          <AdBanner type="bottom" />
          {/* ===== Worked Examples ===== */}
          <h2 id="worked-examples" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            Worked examples (with rationale)
          </h2>
          <ul className="space-y-3">
            <li>
              <strong>Quadratic with two real roots</strong> — <em>x² − 3x + 2 = 0</em>. Δ = (−3)² − 4·1·2 = 9 − 8 = 1 &gt; 0,
              so two real roots: x = (3 ± 1)/2 → {`{1, 2}`}. Sum 1+2=3 matches −b/a=3. Product 1·2=2 matches c/a=2.
            </li>
            <li>
              <strong>Quadratic with complex roots</strong> — <em>x² + 2x + 5 = 0</em>. Δ = 4 − 20 = −16 &lt; 0. Roots:
              x = (−2 ± 4i)/2 = −1 ± 2i (a conjugate pair).
            </li>
            <li>
              <strong>Linear</strong> — <em>5x − 10 = 0</em> → x = 2. If it were <em>0·x − 10 = 0</em> there’d be no solution; if
              <em>0·x + 0 = 0</em> there’d be infinitely many.
            </li>
            <li>
              <strong>2×2 unique</strong> — 
              {` `}
              <span className="font-mono">
                2x + 1y = 4; 1x − 1y = 1
              </span>
              . det(A)=2·(−1) − 1·1 = −3 ≠ 0 → unique. Elimination yields x=5/3, y=2/3.
            </li>
            <li>
              <strong>2×2 infinite</strong> — 
              <span className="font-mono">x + 2y = 3; 2x + 4y = 6</span>.
              Rows are multiples; rank(A)=rank([A|b])=1&lt;2 → infinite solutions (a line).
            </li>
            <li>
              <strong>2×2 none</strong> — 
              <span className="font-mono">x + 2y = 3; 2x + 4y = 5</span>.
              Left sides are multiples, but right sides aren’t; rank(A)=1 &lt; rank([A|b])=2 → inconsistent.
            </li>
            <li>
              <strong>3×3 unique</strong> — 
              <span className="font-mono">
                x + y + z = 6; 0·x + 1·y + 2·z = 4; 2x + y + z = 7
              </span>
              . det(A) ≠ 0, elimination yields a single solution (displayed in the Results grid).
            </li>
          </ul>
        
          {/* ===== Use cases ===== */}
          <h2 id="use-cases" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            Real-world use cases & intuition
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>STEM coursework</strong>: algebra, precalculus, calculus, circuits, statics/dynamics.</li>
            <li><strong>Engineering</strong>: small systems from nodal/mesh equations or force balances.</li>
            <li><strong>Data & optimization</strong>: quick prototypes for tiny normal-equation systems.</li>
            <li><strong>Finance</strong>: simple quadratic price/volume fits and linear constraint checks.</li>
            <li><strong>Education</strong>: demonstrate elimination steps and rank logic in class or tutoring.</li>
          </ul>
        
          {/* ===== Quick Reference ===== */}
          <h2 id="quick-ref" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🗂️ Quick reference cards
          </h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-300">
                  <th className="py-2 pr-4">Topic</th>
                  <th className="py-2 pr-4">Formula / Rule</th>
                  <th className="py-2">Notes</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                <tr>
                  <td className="py-2 pr-4">Quadratic roots</td>
                  <td className="py-2 pr-4">x = (−b ± √(b²−4ac)) / (2a)</td>
                  <td className="py-2">Δ &gt; 0 (two), Δ=0 (double), Δ &lt; 0 (complex)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Vertex</td>
                  <td className="py-2 pr-4">x<sub>v</sub> = −b / (2a)</td>
                  <td className="py-2">Use to center the plot</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Vieta</td>
                  <td className="py-2 pr-4">r₁+r₂ = −b/a; r₁r₂ = c/a</td>
                  <td className="py-2">Sanity check</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Rank test</td>
                  <td className="py-2 pr-4">
                    rank(A)=rank([A|b])=n → unique; same &lt; n → infinite; rank(A) &lt; rank([A|b]) → none
                  </td>
                  <td className="py-2">Fundamental criterion</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">2×2 det</td>
                  <td className="py-2 pr-4">ad − bc</td>
                  <td className="py-2">Non-zero → invertible</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Cramer (2×2)</td>
                  <td className="py-2 pr-4">x = det(A<sub>x</sub>)/det(A), y = det(A<sub>y</sub>)/det(A)</td>
                  <td className="py-2">Use sparingly beyond 3×3</td>
                </tr>
              </tbody>
            </table>
          </div>
        
          {/* ===== FAQ ===== */}
          <section className="space-y-6 mt-16">
            <h2 id="faq" className="text-3xl md:text-4xl font-bold mb-4 text-center text-indigo-200">
              ❓ Frequently Asked Questions (FAQ)
            </h2>
        
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q1: How do I know if my quadratic has complex roots?</h3>
                <p>Check the discriminant Δ = b² − 4ac. If Δ &lt; 0, the solver displays a complex conjugate pair.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q2: Why does the system say “infinite solutions”?</h3>
                <p>
                  Because rank(A) = rank([A|b]) &lt; n. At least one variable is free. You can parameterize the solution family
                  if needed.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q3: Why “no solution”?</h3>
                <p>
                  rank(A) &lt; rank([A|b]) — the equations conflict. Geometrically, lines/planes don’t intersect at a single
                  point or common set.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q4: Does the determinant alone decide solvability?</h3>
                <p>
                  For square systems, det(A) ≠ 0 guarantees a unique solution. But when det(A) = 0 you need rank checks to
                  distinguish “infinite” from “none.”
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q5: Why are my numbers slightly different from a handheld?</h3>
                <p>
                  Rounding and floating-point differences. This app rounds for readability, but the internal math aligns with
                  standard double-precision behavior.
                </p>
              </div>
        
            </div>
          </section>
        
          {/* ===== Author / Update ===== */}
          <div className="mt-10 flex items-center gap-3">
            <img
              src="/images/calculatorhub-author.webp"
              alt="CalculatorHub Tools Team"
              className="w-12 h-12 rounded-full border border-gray-600"
              loading="lazy"
            />
            <div>
              <p className="font-semibold text-white">Author: CalculatorHub Tools Team</p>
              <p className="text-sm text-slate-400">
                Specialists in math utilities & UX. Last updated: <time dateTime="2025-11-10">November 10, 2025</time>.
              </p>
            </div>
          </div>
        
        </section>
        
        {/* ========= Extra cross-links (optional, if not already present) ========= */}
        <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              🚀 Explore more tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/quadratic-equation-solver"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-200 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
              >
                𝑎x²+𝑏x+𝑐 Quadratic Solver
              </Link>
              <Link
                to="/gcd-lcm-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-200 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
              >
                GCD & LCM
              </Link>
              <Link
                to="/log-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-pink-600/20 text-pink-300 hover:text-pink-200 px-3 py-2 rounded-md border border-slate-700 hover:border-pink-500 transition-all duration-200"
              >
                Log Calculator
              </Link>
            </div>
          </div>
        </section>


        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/equation-solver" category="math-tools" />
      </div>
    </>
  );
};

/* ============================================================
   🧩 UI atoms
   ============================================================ */
const Tabs: React.FC<{ tab: "one" | "system"; setTab: (t: "one" | "system") => void }> = ({ tab, setTab }) => (
  <div className="flex rounded-lg overflow-hidden border border-[#334155]">
    <button
      aria-label="1-Variable"
      onClick={() => setTab("one")}
      className={`px-3 py-2 flex items-center gap-2 ${tab === "one" ? "bg-indigo-600 text-white" : "bg-[#0f172a] text-slate-200 hover:border-indigo-500"} border-r border-[#334155]`}
    >
      <FunctionSquare className="h-4 w-4" /> 1-Variable
    </button>
    <button
      aria-label="Linear System"
      onClick={() => setTab("system")}
      className={`px-3 py-2 flex items-center gap-2 ${tab === "system" ? "bg-indigo-600 text-white" : "bg-[#0f172a] text-slate-200 hover:border-indigo-500"}`}
    >
      <Brackets className="h-4 w-4" /> Linear System
    </button>
  </div>
);

const Card: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
    <div className="mb-4">
      <h2 className="text-xl font-semibold text-white flex items-center gap-2">{title}</h2>
      {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const Hint: React.FC<{ text: string }> = ({ text }) => (
  <div className="mt-3 flex items-start gap-2 text-xs text-slate-400">
    <HelpCircle className="h-4 w-4 flex-shrink-0" />
    <p>{text}</p>
  </div>
);

const Chip: React.FC<{ onClick?: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="text-xs bg-[#0f172a] border border-[#334155] hover:border-indigo-500 text-slate-200 rounded px-2 py-1 transition"
  >
    {children}
  </button>
);

const Badge: React.FC<{ tone: "success" | "warning" | "danger"; icon?: React.ReactNode; children: React.ReactNode }> = ({ tone, icon, children }) => {
  const map: Record<string, string> = {
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    danger: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border ${map[tone]}`}>
      {icon}{children}
    </span>
  );
};

const ActionButton: React.FC<{ onClick: () => void; icon?: React.ReactNode; children: React.ReactNode; variant?: "solid" | "ghost" }> = ({ onClick, icon, children, variant = "solid" }) => (
  <button
    onClick={onClick}
    className={
      variant === "solid"
        ? "flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm"
        : "flex items-center gap-2 bg-[#0f172a] border border-[#334155] hover:border-indigo-500 text-slate-200 px-3 py-2 rounded-md text-sm"
    }
  >
    {icon}{children}
  </button>
);

const Tile: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155] shadow-sm">
    <div className="text-sm text-slate-400">{label}</div>
    <div className="text-lg font-semibold text-white break-words">{value}</div>
  </div>
);

const BigResult: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-center">
    <div className="text-xs uppercase tracking-wide text-emerald-300">{label}</div>
    <div className="text-2xl font-bold text-white mt-1">{value}</div>
  </div>
);

const ResultGrid: React.FC<{ items: { label: string; value: string | number }[] }> = ({ items }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {items.map((it, i) => <Tile key={i} label={it.label} value={it.value} />)}
  </div>
);

const ExplainBlock: React.FC<{ open: boolean; onToggle: () => void; title: string; children: React.ReactNode }> = ({ open, onToggle, title, children }) => (
  <div className="lg:col-span-2 bg-gradient-to-br from-[#1e293b] via-[#111827] to-[#0f172a] rounded-2xl border border-indigo-600/40 shadow-xl overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold text-lg tracking-wide hover:opacity-90 transition-all"
    >
      <span>🧮 {title}</span>
      {open ? <ChevronUp /> : <ChevronDown />}
    </button>
    {open && <div className="px-6 pb-8 pt-4 space-y-3 text-slate-200">{children}</div>}
  </div>
);

const NumInput: React.FC<{ label: string; value: number; onChange: (v: number) => void; example?: string }> = ({ label, value, onChange, example }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
      {label}
      <Info className="h-3.5 w-3.5 text-slate-400" />
    </label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
      aria-label={`Coefficient ${label}`}
    />
    {example && <p className="text-[11px] text-slate-400 mt-1">Example: {example}</p>}
  </div>
);

const MatrixInputs: React.FC<{
  size: 2 | 3;
  A: { A11: number; A12: number; A13: number; A21: number; A22: number; A23: number; A31: number; A32: number; A33: number; };
  setA: { setA11: any; setA12: any; setA13: any; setA21: any; setA22: any; setA23: any; setA31: any; setA32: any; setA33: any; };
  b: { B1: number; B2: number; B3: number; };
  setB: { setB1: any; setB2: any; setB3: any; };
}> = ({ size, A, setA, b, setB }) => {
  const Box = ({ v, on, label }: { v: number; on: (n: number) => void; label: string }) => (
    <input
      aria-label={label}
      type="number"
      value={v}
      onChange={(e) => on(parseFloat(e.target.value))}
      className="w-20 bg-[#0f172a] text-white px-2 py-1.5 border border-[#334155] rounded-md focus:ring-2 focus:ring-indigo-500"
    />
  );

  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col gap-2">
        {[0,1, size === 3 ? 2 : null].filter((x) => x !== null).map((rowIdx) => {
          const i = rowIdx as number;
          return (
            <div key={i} className="flex gap-2">
              <Box v={i===0?A.A11:i===1?A.A21:A.A31} on={i===0?setA.setA11:i===1?setA.setA21:setA.setA31} label={`A${i+1}1`} />
              <Box v={i===0?A.A12:i===1?A.A22:A.A32} on={i===0?setA.setA12:i===1?setA.setA22:setA.setA32} label={`A${i+1}2`} />
              {size===3 && <Box v={i===0?A.A13:i===1?A.A23:A.A33} on={i===0?setA.setA13:i===1?setA.setA23:setA.setA33} label={`A${i+1}3`} />}
            </div>
          );
        })}
      </div>
      <div className="text-slate-400 pt-1">=</div>
      <div className="flex flex-col gap-2">
        <Box v={b.B1} on={setB.setB1} label="b1" />
        <Box v={b.B2} on={setB.setB2} label="b2" />
        {size===3 && <Box v={b.B3} on={setB.setB3} label="b3" />}
      </div>
    </div>
  );
};

/* Soft link button style */
const SoftLinkClass =
  "flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200";
declare module "react" {
  interface HTMLAttributes<T> {
    className?: string;
  }
}
Object.assign((Link as any).defaultProps ?? {}, { className: "btn-soft" });

export default EquationSolver;
