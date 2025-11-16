// src/pages/PrimeNumberChecker.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  RotateCcw,
  Share2,
  Copy,
  ChevronDown,
  ChevronUp,
  Info,
  Search,
  ListChecks,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  CartesianGrid,
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
const LS_KEY = "prime_checker_state_v2"; // bumped for new multi-input
const URL_KEY = "pc";

// deterministic for n < 1e16
const MR_BASES = [2n, 3n, 5n, 7n, 11n, 13n, 17n];

/* ---------- String/BigInt helpers ---------- */
const splitTokens = (s: string): string[] =>
  s
    .split(/[,\s;]+/g)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

const normalizeIntString = (s: string) =>
  s.replace(/[,_\s]/g, "").replace(/^([-+]?)(0+)(\d)/, "$1$3").trim();

const parseBig = (s: string): bigint | null => {
  if (!s) return null;
  const t = normalizeIntString(s);
  if (!/^[-+]?\d+$/.test(t)) return null;
  try {
    return BigInt(t);
  } catch {
    return null;
  }
};

const fmtBig = (x: bigint) => {
  const s = x.toString();
  const sign = s.startsWith("-") ? "-" : "";
  const body = sign ? s.slice(1) : s;
  return sign + body.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/* ---------- Small primes sieve (trial division) ---------- */
const SMALL_SIEVE_LIMIT = 100_000;
let SMALL_PRIMES: number[] | null = null;

function buildSmallPrimes() {
  const n = SMALL_SIEVE_LIMIT;
  const sieve = new Uint8Array(n + 1);
  const out: number[] = [];
  for (let i = 2; i <= n; i++) {
    if (!sieve[i]) {
      out.push(i);
      if (i * i <= n) {
        for (let j = i * i; j <= n; j += i) sieve[j] = 1;
      }
    }
  }
  return out;
}
if (!SMALL_PRIMES) SMALL_PRIMES = buildSmallPrimes();

/* ---------- BigInt modular arithmetic ---------- */
const modPow = (base: bigint, exp: bigint, mod: bigint) => {
  let b = ((base % mod) + mod) % mod;
  let e = exp;
  let r = 1n;
  while (e > 0n) {
    if (e & 1n) r = (r * b) % mod;
    b = (b * b) % mod;
    e >>= 1n;
  }
  return r;
};

const decompose = (n: bigint) => {
  let d = n - 1n;
  let s = 0n;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s++;
  }
  return { d, s };
};

const isDeterministicMRPrime = (n: bigint): boolean => {
  if (n < 2n) return false;
  for (const p of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n]) {
    if (n === p) return true;
    if (n % p === 0n) return n === p;
  }
  const { d, s } = decompose(n);
  for (const a of MR_BASES) {
    if (a % n === 0n) continue;
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let passed = false;
    for (let r = 1n; r < s; r++) {
      x = (x * x) % n;
      if (x === n - 1n) {
        passed = true;
        break;
      }
    }
    if (!passed) return false;
  }
  return true;
};

const smallestSmallFactor = (n: bigint): bigint | null => {
  if (n < 2n) return null;
  for (const p of SMALL_PRIMES!) {
    const bp = BigInt(p);
    if (bp * bp > n) break;
    if (n % bp === 0n) return bp;
  }
  return null;
};

const nextPrime = (n: bigint): bigint => {
  let x = n < 2n ? 2n : n + (n % 2n === 0n ? 1n : 2n);
  while (true) {
    if (!smallestSmallFactor(x) && isDeterministicMRPrime(x)) return x;
    x += 2n;
  }
};

const prevPrime = (n: bigint): bigint | null => {
  if (n <= 2n) return null;
  let x = n - (n % 2n === 0n ? 1n : 2n);
  if (x === 2n) return 2n;
  while (x >= 3n) {
    if (!smallestSmallFactor(x) && isDeterministicMRPrime(x)) return x;
    x -= 2n;
  }
  return 2n;
};

/* ============================================================
   🧮 Component
   ============================================================ */
type ItemResult = {
  raw: string;
  big: bigint | null;
  valid: boolean;
  isPrime: boolean;
  smallFactor?: bigint | null;
  cofactor?: bigint | null;
};

const PrimeNumberChecker: React.FC = () => {
  // Input now supports multiple numbers
  const [input, setInput] = useState<string>("1 2 3, 4;5 1234567891");
  const [hydrated, setHydrated] = useState<boolean>(false);

  // UI
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [showSteps, setShowSteps] = useState<boolean>(false);
  const [activeTip, setActiveTip] = useState<number>(0);

  const isDefault = input === "1 2 3, 4;5 1234567891";

  /* 🔁 Hydration & Persistence */
  const applyState = (s: any) => {
    if (typeof s?.input === "string") setInput(s.input);
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
      console.warn("Failed to load prime checker state:", e);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ input }));
    } catch {}
  }, [hydrated, input]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const url = new URL(window.location.href);
      if (isDefault) {
        url.searchParams.delete(URL_KEY);
        window.history.replaceState({}, "", url);
      } else {
        const encoded = btoa(JSON.stringify({ input }));
        url.searchParams.set(URL_KEY, encoded);
        window.history.replaceState({}, "", url);
      }
    } catch (e) {
      console.warn("Failed to update URL:", e);
    }
  }, [hydrated, input, isDefault]);

  /* 🧠 Parse & evaluate */
  const tokens = useMemo(() => splitTokens(input), [input]);
  const results: ItemResult[] = useMemo(() => {
    return tokens.map((raw) => {
      const big = parseBig(raw);
      const valid = big !== null && big >= 0n;
      if (!valid) return { raw, big: null, valid, isPrime: false };

      const n = big!;
      if (n < 2n) return { raw, big: n, valid, isPrime: false };

      const sf = smallestSmallFactor(n);
      if (sf && sf !== n) {
        return { raw, big: n, valid, isPrime: false, smallFactor: sf, cofactor: n / sf };
      }
      const prime = isDeterministicMRPrime(n);
      if (prime) return { raw, big: n, valid, isPrime: true };
      // composite but no small factor found (rare for < 1e16): still composite
      return { raw, big: n, valid, isPrime: false, smallFactor: null, cofactor: null };
    });
  }, [tokens]);

  const validItems = results.filter((r) => r.valid);
  const countPrimes = validItems.filter((r) => r.isPrime).length;
  const countComposites = validItems.filter((r) => r.valid && !r.isPrime && (r.big ?? 0n) >= 2n).length;
  const countNonPrimeSmall = validItems.filter((r) => (r.big ?? 0n) < 2n).length; // 0 or 1
  const countInvalid = results.length - validItems.length;

  // “single-number mode” retains previous/next prime + gap chart
  const singleMode = validItems.length === 1;
  const nBig = singleMode ? validItems[0].big! : null;
  const singleIsPrime = singleMode ? validItems[0].isPrime : false;
  const singlePrev = useMemo(() => (singleMode ? prevPrime(nBig!) : null), [singleMode, nBig]);
  const singleNext = useMemo(() => (singleMode ? nextPrime(nBig!) : null), [singleMode, nBig]);

  const gapData = useMemo(() => {
    if (!singleMode || singlePrev === null || singleNext === null) return [];
    const p = singlePrev!;
    const m = nBig!;
    const q = singleNext!;
    const left = m - p;
    const right = q - m;
    return [
      { side: "Prev → n", distance: Number(left > 0n ? left : 0n) },
      { side: "n → Next", distance: Number(right > 0n ? right : 0n) },
    ];
  }, [singleMode, singlePrev, singleNext, nBig]);

  /* 💡 Tips */
  const tips = useMemo(
    () => [
      "Tip: You can paste multiple numbers separated by space, comma, or semicolon.",
      "Tip: Even numbers > 2 are composite.",
      "Tip: At least one factor of a composite is ≤ √n.",
      "Tip: Miller–Rabin with bases 2,3,5,7,11,13,17 is deterministic for n < 10^16.",
      "Tip: Remove formatting like commas if parsing fails.",
    ],
    []
  );

  useEffect(() => {
    const id = setInterval(() => setActiveTip((p) => (p + 1) % tips.length), 5000);
    return () => clearInterval(id);
  }, [tips.length]);

  /* 🔗 Copy / Share / Reset */
  const copyResults = async () => {
    const lines: string[] = [];
    lines.push("Prime Number Checker (multi-input)");
    lines.push(`Input count: ${results.length}`);
    lines.push(`Valid: ${validItems.length}, Primes: ${countPrimes}, Composites: ${countComposites}, Non-prime (<2): ${countNonPrimeSmall}, Invalid: ${countInvalid}`);

    const primesList = validItems.filter((r) => r.isPrime).map((r) => r.big!.toString());
    const compList = validItems.filter((r) => !r.isPrime && (r.big ?? 0n) >= 2n).map((r) => r.big!.toString());

    if (primesList.length) lines.push(`Primes: ${primesList.join(", ")}`);
    if (compList.length) lines.push(`Composites: ${compList.join(", ")}`);

    if (singleMode) {
      if (singlePrev) lines.push(`Previous prime: ${singlePrev.toString()}`);
      if (singleNext) lines.push(`Next prime: ${singleNext.toString()}`);
    }

    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    const encoded = btoa(JSON.stringify({ input }));
    url.searchParams.set(URL_KEY, encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  const reset = () => {
    setInput(" ");
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
        title="Prime Number Checker — Single & Multiple Integers (2025–2026)"
        description="Check if one or many integers are prime. Paste numbers separated by space, comma, or semicolon. See prime counts, lists, small factors, and for a single input: previous/next primes and a gap chart."
        keywords={[
          "prime number checker",
          "is prime",
          "prime test",
          "miller rabin",
          "deterministic miller rabin",
          "small prime factors",
          "previous prime",
          "next prime",
          "prime gap",
          "math tools",
          "integer primality"
        ]}
        canonical="https://calculatorhub.site/prime-number-checker"
        schemaData={[
          // 1) WebPage + Article
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://calculatorhub.site/prime-number-checker#webpage",
            "url": "https://calculatorhub.site/prime-number-checker",
            "name": "Prime Number Checker (2025–2026) — Single & Multiple Integers",
            "inLanguage": "en",
            "isPartOf": { "@id": "https://calculatorhub.site/#website" },
            "primaryImageOfPage": {
              "@type": "ImageObject",
              "@id": "https://calculatorhub.site/images/prime-checker-hero.webp#primaryimg",
              "url": "https://calculatorhub.site/images/prime-checker-hero.webp",
              "width": 1200,
              "height": 675
            },
            "mainEntity": {
              "@type": "Article",
              "@id": "https://calculatorhub.site/prime-number-checker#article",
              "headline": "Prime Number Checker — Fast multi-input primality test",
              "description": "Paste one or many integers to check primality. Uses small-factor search and deterministic Miller–Rabin (accurate for n < 10^16). For a single input, shows previous/next primes and a distance chart.",
              "image": ["https://calculatorhub.site/images/prime-checker-hero.webp"],
              "author": { "@type": "Organization", "name": "CalculatorHub", "url": "https://calculatorhub.site" },
              "publisher": { "@id": "https://calculatorhub.site/#organization" },
              "datePublished": "2025-11-09",
              "dateModified": "2025-11-09",
              "mainEntityOfPage": { "@id": "https://calculatorhub.site/prime-number-checker#webpage" },
              "articleSection": [
                "How to Use",
                "Multiple Inputs",
                "Parsing & Validation",
                "Small-factor Search",
                "Miller–Rabin (n < 10^16)",
                "Previous/Next Primes",
                "Prime Gap Chart",
                "FAQ"
              ]
            }
          },
      
          // 2) Breadcrumbs
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "@id": "https://calculatorhub.site/prime-number-checker#breadcrumbs",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://calculatorhub.site/" },
              { "@type": "ListItem", "position": 2, "name": "Math Tools", "item": "https://calculatorhub.site/category/math-tools" },
              { "@type": "ListItem", "position": 3, "name": "Prime Number Checker", "item": "https://calculatorhub.site/prime-number-checker" }
            ]
          },
      
          // 3) FAQ
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://calculatorhub.site/prime-number-checker#faq",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Can I check multiple numbers at once?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Paste integers separated by spaces, commas, or semicolons. Invalid tokens are ignored in counts."
                }
              },
              {
                "@type": "Question",
                "name": "How does the checker decide primality?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "It first searches for small factors using trial division with primes up to 100,000, then applies a deterministic Miller–Rabin test with bases 2,3,5,7,11,13,17 for n < 10^16."
                }
              },
              {
                "@type": "Question",
                "name": "What extra info appears for a single number?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "You’ll see the previous and next primes and a chart showing the distances (prime gap) from n to each neighbor."
                }
              },
              {
                "@type": "Question",
                "name": "Does it support sharing results?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. The current input is encoded into the URL, so you can copy and share a link with your exact state."
                }
              }
            ]
          },
      
          // 4) WebApplication
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://calculatorhub.site/prime-number-checker#webapp",
            "name": "Prime Number Checker",
            "url": "https://calculatorhub.site/prime-number-checker",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web",
            "description": "Multi-input primality checker with small-factor detection, deterministic Miller–Rabin (n < 10^16), previous/next primes, and a gap chart.",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "image": ["https://calculatorhub.site/images/prime-checker-hero.webp"]
          },
      
          // 5) SoftwareApplication (optional)
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://calculatorhub.site/prime-number-checker#software",
            "name": "Prime Number Checker",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "All",
            "url": "https://calculatorhub.site/prime-number-checker",
            "publisher": { "@id": "https://calculatorhub.site/#organization" },
            "description": "Interactive prime testing tool for single or multiple integers with shareable links."
          },
      
          // 6) WebSite + Organization (global)
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
            "logo": {
              "@type": "ImageObject",
              "url": "https://calculatorhub.site/images/logo.png"
            }
          }
        ]}
      />
      
      {/** ===== Outside meta/link tags ===== */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <link rel="canonical" href="https://calculatorhub.site/prime-number-checker" />
      
      {/** Hreflang */}
      <link rel="alternate" href="https://calculatorhub.site/prime-number-checker" hreflang="en" />
      <link rel="alternate" href="https://calculatorhub.site/bn/prime-number-checker" hreflang="bn" />
      <link rel="alternate" href="https://calculatorhub.site/prime-number-checker" hreflang="x-default" />
      
      {/** Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:title" content="Prime Number Checker — Single & Multiple Integers" />
      <meta property="og:description" content="Check primality for one or many integers. See counts, lists, small factors, and for a single input: previous/next primes and a gap chart." />
      <meta property="og:url" content="https://calculatorhub.site/prime-number-checker" />
      <meta property="og:image" content="https://calculatorhub.site/images/prime-checker-hero.webp" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Prime number checker interface with multi-input and results summary" />
      <meta property="og:locale" content="en_US" />
      
      {/** Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Prime Number Checker — Single & Multiple Integers" />
      <meta name="twitter:description" content="Paste integers separated by space/comma/semicolon to test primality and share results via URL." />
      <meta name="twitter:image" content="https://calculatorhub.site/images/prime-checker-hero.webp" />
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
      <link rel="preload" as="image" href="/images/prime-checker-hero.webp" fetchpriority="high" />
      <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/** Misc */}
      <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=no" />


      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Math Tools", url: "/category/math-tools" },
            { name: "Prime Number Checker", url: "/prime-number-checker" },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            🔍 Prime Number Checker (Single or Multiple)
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Paste <strong>one</strong> or <strong>many</strong> integers separated by{" "}
            <strong>space, comma, or semicolon</strong>. We’ll count primes and show details. With a single valid input, you’ll also get previous/next primes and the gap chart.
          </p>
        </div>

        {/* Promo bar */}
        <div className="hidden sm:flex mt-6 mb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white rounded-lg shadow-lg p-4 items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-lg">Explore more math tools 🧮</p>
            <p className="text-sm text-indigo-100">Try Factorial, Average, or Quadratic Solver next!</p>
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
                <Search className="h-5 w-5 text-sky-400" /> Input (single or multiple)
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
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">
                    Integer(s) — separate by space, comma, or semicolon
                  </label>
                  <Info className="h-4 w-4 text-slate-400" title="Examples: 11 12 13,14;15" />
                </div>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g., 1 2 3, 4;5  1234567891"
                  rows={4}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <div className="text-xs text-slate-400 mt-2">
                  We strip spaces and commas inside numbers automatically. Invalid tokens are ignored in the prime count.
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">Results</h2>

            {results.length === 0 ? (
              <div className="p-4 bg-[#0f172a] rounded-lg border border-[#334155] text-slate-300">
                Enter at least one integer.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary tiles */}
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                  <Tile label="Total tokens" value={String(results.length)} />
                  <Tile label="Valid integers" value={String(validItems.length)} />
                  <Tile label="Primes" value={String(countPrimes)} />
                  <Tile label="Composites" value={String(countComposites)} />
                </div>
                {countInvalid > 0 && (
                  <div className="text-xs text-rose-300">
                    {countInvalid} token{countInvalid !== 1 ? "s" : ""} were invalid and skipped.
                  </div>
                )}

                {/* Quick lists */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div className="p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                    <div className="text-sm text-slate-400 mb-1">Primes</div>
                    <div className="text-white break-words">
                      {validItems.filter((r) => r.isPrime).length
                        ? validItems
                            .filter((r) => r.isPrime)
                            .slice(0, 200) // safety
                            .map((r) => fmtBig(r.big!))
                            .join(", ")
                        : "—"}
                    </div>
                  </div>
                  <div className="p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                    <div className="text-sm text-slate-400 mb-1">Composites</div>
                    <div className="text-white break-words">
                      {validItems.filter((r) => !r.isPrime && (r.big ?? 0n) >= 2n).length
                        ? validItems
                            .filter((r) => !r.isPrime && (r.big ?? 0n) >= 2n)
                            .slice(0, 200)
                            .map((r) => fmtBig(r.big!))
                            .join(", ")
                        : "—"}
                    </div>
                  </div>
                </div>

               

                {/* Single-number extras */}
                {singleMode && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <Tile label="Previous prime" value={singlePrev ? fmtBig(singlePrev) : "—"} />
                      <Tile label="Next prime" value={singleNext ? fmtBig(singleNext) : "—"} />
                    </div>

                    {gapData.length === 2 && (
                      <div className="mt-1 bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
                        <h3 className="text-lg font-semibold text-white mb-6 text-center">
                          Prime Gap Around n
                        </h3>
                        <div className="w-full h-[240px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={gapData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="side" />
                              <YAxis allowDecimals={false} />
                              <ReTooltip />
                              <Legend />
                              <Bar dataKey="distance" name="Distance" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={copyResults}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm"
                  >
                    <Copy size={16} /> Copy Summary
                  </button>
                  <button
                    onClick={copyShareLink}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm"
                  >
                    <Share2 size={16} /> Copy Link
                  </button>
                  {copied !== "none" && (
                    <span className="text-emerald-400 text-sm">
                      {copied === "results" ? "Summary copied!" : "Link copied!"}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

         {/* Per-item compact table */}
                <div className="overflow-x-auto mt-3 rounded-xl border border-[#334155] shadow-inner">
                  <table className="min-w-full text-sm text-slate-100">
                    <thead className="bg-[#0f172a]">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold text-indigo-300">Token</th>
                        <th className="text-left px-3 py-2 font-semibold text-sky-300">Parsed</th>
                        <th className="text-left px-3 py-2 font-semibold text-emerald-300">Prime?</th>
                        <th className="text-left px-3 py-2 font-semibold text-rose-300">Small factor</th>
                        <th className="text-left px-3 py-2 font-semibold text-cyan-300">Cofactor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => (
                        <tr
                          key={i}
                          className={`${
                            i % 2 === 0 ? "bg-[#1e293b]/60" : "bg-[#0f172a]/60"
                          } hover:bg-[#3b82f6]/10 transition-colors`}
                        >
                          <td className="px-3 py-2">{r.raw}</td>
                          <td className="px-3 py-2">{r.valid ? fmtBig(r.big!) : <span className="text-rose-300">invalid</span>}</td>
                          <td className="px-3 py-2">
                            {r.valid ? (
                              r.isPrime ? (
                                <span className="text-emerald-300 font-medium">Prime</span>
                              ) : (r.big ?? 0n) < 2n ? (
                                <span className="text-slate-300">Not prime</span>
                              ) : (
                                <span className="text-rose-300 font-medium">Composite</span>
                              )
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3 py-2">{r.smallFactor !== undefined ? (r.smallFactor ? fmtBig(r.smallFactor) : "—") : "—"}</td>
                          <td className="px-3 py-2">{r.cofactor ? fmtBig(r.cofactor) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

        {/* Steps (collapsible) */}
        <div className="mt-10 bg-gradient-to-br from-[#1e293b] via-[#111827] to-[#0f172a] rounded-2xl border border-indigo-600/40 shadow-xl overflow-hidden">
          <button
            onClick={() => setShowSteps((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold text-lg tracking-wide hover:opacity-90 transition-all"
          >
            <span>🧮 How the Check Works</span>
            {showSteps ? <ChevronUp /> : <ChevronDown />}
          </button>

          {showSteps && (
            <div className="px-6 pb-8 pt-4 space-y-3 text-slate-200">
              <h4 className="font-semibold text-cyan-300">1) Multi-input parsing</h4>
              <p>
                We split by spaces, commas, or semicolons, then parse each token as a BigInt (ignoring invalid tokens).
              </p>

              <h4 className="font-semibold text-cyan-300">2) Small-factor search</h4>
              <p>
                Trial division by all primes ≤ {SMALL_SIEVE_LIMIT.toLocaleString()} quickly finds common small factors.
              </p>

              <h4 className="font-semibold text-cyan-300">3) Miller–Rabin</h4>
              <p>
                Deterministic bases 2,3,5,7,11,13,17 (exact for n &lt; 10<sup>16</sup>) decide primality when no small factor is found.
              </p>

              <h4 className="font-semibold text-cyan-300">4) Single-number extras</h4>
              <p>
                If exactly one valid integer is provided, we also show previous/next prime and the prime gap chart.
              </p>

              <div className="h-2 w-full mt-6 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 blur-[2px]" />
            </div>
          )}
        </div>

        <AdBanner type="bottom" />
        {/* ===================== SEO Content (~1800–2000 words) ===================== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
        
          {/* ===== Table of Contents ===== */}
          <nav className="mt-2 mb-10 bg-[#0b1220] border border-[#1f2a44] rounded-xl p-5 text-slate-200">
            <h2 className="text-lg font-semibold text-gray-100 mb-3">📖 Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><a href="#what-are-primes" className="text-indigo-300 hover:underline">What Is a Prime Number?</a></li>
              <li><a href="#features" className="text-indigo-300 hover:underline">Key Features of This Checker</a></li>
              <li><a href="#how-to-use" className="text-indigo-300 hover:underline">How to Use</a></li>
              <li><a href="#methods" className="text-indigo-300 hover:underline">Methods & Math Under the Hood</a></li>
              <li><a href="#worked-examples" className="text-indigo-300 hover:underline">Worked Examples</a></li>
              <li><a href="#single-number" className="text-indigo-300 hover:underline">Single-Number Mode: Neighbors & Gap</a></li>
              <li><a href="#performance" className="text-indigo-300 hover:underline">Performance, Precision & Limits</a></li>
              <li><a href="#pitfalls" className="text-indigo-300 hover:underline">Common Pitfalls & How to Avoid Them</a></li>
              <li><a href="#use-cases" className="text-indigo-300 hover:underline">Where Prime Checks Matter in Real Life</a></li>
              <li><a href="#quick-ref" className="text-indigo-300 hover:underline">Quick Reference Table (small primes & facts)</a></li>
              <li><a href="#glossary" className="text-indigo-300 hover:underline">Glossary</a></li>
              <li><a href="#faq" className="text-indigo-300 hover:underline">FAQ</a></li>
            </ol>
          </nav>
        
          {/* ===== What is a Prime? ===== */}
          <h1 id="what-are-primes" className="text-3xl font-bold text-indigo-300 mb-6">
            Prime Numbers — definition, intuition, and why they matter
          </h1>
          <p>
            A <strong>prime number</strong> is a positive integer greater than 1 that has exactly two distinct positive divisors:
            <em>1</em> and the number itself. The first few primes are <code>2, 3, 5, 7, 11, 13, 17, 19…</code>. Every other integer
            greater than 1 is <strong>composite</strong>, meaning it factors into smaller integers. Primes are the “atoms” of the integers:
            by the <em>Fundamental Theorem of Arithmetic</em>, every integer factors uniquely into primes up to ordering.
          </p>
          <p>
            This checker lets you test whether one or many integers are prime. It handles <strong>multi-input parsing</strong> (space/comma/semicolon),
            shows <strong>counts and lists</strong>, provides <strong>small factors</strong> when quickly found, and, for a single input, reveals the
            <strong>previous</strong> and <strong>next</strong> prime alongside a simple <strong>prime-gap</strong> visualization. It’s designed for speed,
            clarity, and shareability.
          </p>
        
          {/* ===== Features ===== */}
          <h2 id="features" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            ✨ Key features of this Prime Number Checker
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Single & multi-input</strong>: paste numbers separated by spaces, commas, or semicolons.</li>
            <li><strong>Smart parsing</strong>: normalizes common formatting (spaces/underscores/commas) and filters invalid tokens.</li>
            <li><strong>Small-factor detection</strong>: quick trial division by primes up to a configured bound to expose composite numbers early.</li>
            <li><strong>Fast primality test</strong>: strong probable-prime checks (Miller–Rabin) with a careful base set for typical 64-bit inputs.</li>
            <li><strong>Single-number extras</strong>: previous/next prime neighbors and a clean bar chart of the distances (prime gap).</li>
            <li><strong>Shareable URL</strong>: your input is encoded into the link so colleagues see the same state instantly.</li>
            <li><strong>Dark, compact UI</strong>: optimized for readability, keyboard use, and quick copy/share.</li>
          </ul>
        
          {/* ===== How to Use ===== */}
          <h2 id="how-to-use" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">🧭 How to use this checker</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Paste or type one or more integers in the input box.</li>
            <li>Separate items with <strong>spaces</strong>, <strong>commas</strong>, or <strong>semicolons</strong>. Formatting commas inside numbers are stripped when possible.</li>
            <li>Review the summary tiles (total tokens, valid integers, primes, composites) and quick lists for each category.</li>
            <li>If you provided exactly one valid integer, check the <strong>previous</strong> and <strong>next</strong> primes and the <strong>gap chart</strong>.</li>
            <li>Use <strong>Copy Summary</strong> to grab a text summary or <strong>Copy Link</strong> to share your current input via URL.</li>
          </ol>
          <p className="text-sm text-slate-400">
            Tip: Invalid tokens (like stray letters) are ignored in counts and flagged in the per-item table.
          </p>
        
          {/* ===== Methods ===== */}
          <h2 id="methods" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🔧 Methods & math under the hood
          </h2>
        
          <h3 className="text-xl font-semibold text-indigo-300">1) Input normalization & BigInt parsing</h3>
          <p>
            The checker splits on spaces, commas, and semicolons, trims each token, removes common formatting characters, and ensures
            it’s an integer. Valid tokens are parsed to <code>BigInt</code> for exact arithmetic even with very large values (within practical limits).
          </p>
        
          <h3 className="text-xl font-semibold text-indigo-300 mt-6">2) Early exits via small-factor search</h3>
          <p>
            Before running probabilistic tests, we try to divide by small primes up to a preset bound. If a factor is found, the number is composite,
            and we can report the <strong>small factor</strong> and its <strong>cofactor</strong> immediately. This step is very effective for catching
            the majority of composites cheaply.
          </p>
        
          <h3 className="text-xl font-semibold text-indigo-300 mt-6">3) Miller–Rabin strong probable-prime test</h3>
          <p>
            For numbers that survive small-factor checks, we apply <em>Miller–Rabin</em> with a carefully chosen set of bases appropriate for typical
            64-bit ranges. Miller–Rabin is extremely fast and, with suitable bases, effectively error-free at the sizes most users care about.
          </p>
          <p className="text-sm text-slate-400">
            Note: If you need stricter guarantees, you can adopt extended base sets or the Baillie–PSW (BPSW) combination (strong PRP + strong Lucas PRP),
            which is widely used in practice and has no known counterexamples for 64-bit integers.
          </p>
        
          <h3 className="text-xl font-semibold text-indigo-300 mt-6">4) Previous/next primes</h3>
          <p>
            In single-number mode, we search downward and upward for the nearest primes. For odd candidates, stepping by 2 is natural; wheel factorization
            (mod 30 residues) offers a further speed boost if desired. Very large values may take longer as gaps can widen.
          </p>
        
          <h3 className="text-xl font-semibold text-indigo-300 mt-6">5) Result presentation</h3>
          <p>
            Results include summary counts, quick lists (primes/composites), a per-item table (token, parsed value, classification, small factor/cofactor),
            and in single-number mode, previous/next primes plus a compact bar chart that visualizes the distances.
          </p>
        
          {/* ===== Worked Examples ===== */}
          <h2 id="worked-examples" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🧪 Worked examples (rounded where helpful)
          </h2>
          <ul className="space-y-2">
            <li><strong>Input:</strong> <code>2 3 4 5 6</code> → primes: 2, 3, 5; composites: 4 (2×2), 6 (2×3).</li>
            <li><strong>Input:</strong> <code>11, 12, 13; 14</code> → 11 and 13 are prime; 12 and 14 are composite (even).</li>
            <li><strong>Input:</strong> <code>21</code> → composite; small factor 3; cofactor 7.</li>
            <li><strong>Input:</strong> <code>1 0 −5</code> → none are prime (primes are integers ≥ 2).</li>
            <li><strong>Single input:</strong> <code>101</code> → prime; previous prime 97; next prime 103; gap distances 4 and 2.</li>
          </ul>

          <AdBanner type="bottom" />
          {/* ===== Single-number Mode ===== */}
          <h2 id="single-number" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🎯 Single-number mode: neighbors & the local prime gap
          </h2>
          <p>
            When exactly one valid integer is present, you’ll see the nearest primes on either side. The distances to these primes form the
            “local gap.” Prime gaps vary irregularly; as numbers increase, gaps can get larger on average, but small gaps still occur.
            The bar chart makes this local picture obvious at a glance.
          </p>
        
          {/* ===== Performance ===== */}
          <h2 id="performance" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🚀 Performance, precision & limits
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Parsing:</strong> BigInt ensures exact integer math; extremely large values may be impractical to search for neighbors.</li>
            <li><strong>Small-factor pass:</strong> catches many composites in O(#small primes) and is very cache-friendly.</li>
            <li><strong>Miller–Rabin:</strong> sub-millisecond for typical 64-bit sizes; base choices balance speed and assurance.</li>
            <li><strong>Neighbors:</strong> scanning for previous/next primes can cost more for large inputs due to widening gaps.</li>
            <li><strong>Stability:</strong> deterministic arithmetic for divisions/modular exponentiation; no floating-point issues here.</li>
          </ul>
        
          {/* ===== Pitfalls ===== */}
          <h2 id="pitfalls" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            ⚠️ Common pitfalls & how to avoid them
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Formatting artifacts:</strong> stray commas/underscores in tokens can break parsing; the tool sanitizes, but plain digits are safest.</li>
            <li><strong>Negative/non-integers:</strong> primes are defined for integers ≥ 2 only.</li>
            <li><strong>Even numbers:</strong> any even number greater than 2 is composite.</li>
            <li><strong>Huge single inputs:</strong> previous/next prime search may be slow; that’s expected for large prime gaps.</li>
          </ul>
        
          {/* ===== Use Cases ===== */}
          <h2 id="use-cases" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🧰 Where prime checks matter in real life
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Cryptography:</strong> key generation and primality testing for RSA-like schemes and modern protocols.</li>
            <li><strong>Hashing & randomness:</strong> modular arithmetic over prime moduli ensures good algebraic properties.</li>
            <li><strong>Algorithms & CS theory:</strong> primality testing, factorization heuristics, and randomized algorithms.</li>
            <li><strong>Number theory:</strong> exploring conjectures, patterns, and distributions of primes and gaps.</li>
            <li><strong>Education:</strong> quick, visual demonstrations of composite vs. prime behavior.</li>
          </ul>
        
          {/* ===== Quick Reference ===== */}
          <h2 id="quick-ref" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">
            🗂️ Quick reference (small primes & handy facts)
          </h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-300">
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2">Values / Notes</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                <tr>
                  <td className="py-2 pr-4">First primes</td>
                  <td className="py-2">2, 3, 5, 7, 11, 13, 17, 19, 23, 29</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Composite examples</td>
                  <td className="py-2">4=2×2, 6=2×3, 8=2×2×2, 9=3×3, 21=3×7</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Always composite</td>
                  <td className="py-2">Even numbers &gt; 2; any multiple of 3 &gt; 3; etc.</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Unique factorization</td>
                  <td className="py-2">Every integer &gt;1 factors into primes uniquely (order aside).</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Prime gaps</td>
                  <td className="py-2">Irregular; can be small or large; generally widen on average as numbers grow.</td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs text-slate-400 mt-2">
              For large inputs, neighbor search time reflects the local gap, not a slowdown in the test itself.
            </p>
          </div>
        
          {/* ===== Glossary ===== */}
          <h2 id="glossary" className="text-2xl font-semibold text-indigo-200 mt-10 mb-4">📚 Glossary</h2>
          <p className="space-y-2">
            <strong>Prime:</strong> integer ≥ 2 with no divisors other than 1 and itself. <br/>
            <strong>Composite:</strong> integer ≥ 2 that can be written as a product of smaller integers. <br/>
            <strong>Miller–Rabin:</strong> a fast probabilistic primality test; with the right bases it’s effectively deterministic for common ranges. <br/>
            <strong>BPSW:</strong> Baillie–PSW: a hybrid of tests (strong PRP + strong Lucas) with no known 64-bit counterexamples. <br/>
            <strong>Prime gap:</strong> distance from a number to the nearest prime(s); varies irregularly with size.
          </p>
        
          {/* ===== FAQ ===== */}
          <section className="space-y-6 mt-16">
            <h2 id="faq" className="text-3xl md:text-4xl font-bold mb-4 text-center text-indigo-200">
              ❓ Frequently Asked Questions (FAQ)
            </h2>
        
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q1: Can I check multiple numbers at once?</h3>
                <p>
                  Yes. Paste integers separated by spaces, commas, or semicolons. Invalid tokens are skipped and reported in the table.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q2: How accurate is the test?</h3>
                <p>
                  With small-factor division and Miller–Rabin bases tuned for typical 64-bit inputs, results are effectively
                  deterministic for practical purposes. If you need stronger assurances, adopt extended base sets or BPSW.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q3: Why does neighbor search take longer sometimes?</h3>
                <p>
                  Large prime gaps are natural. The primality test is still fast; scanning outward to the nearest primes simply
                  takes more steps when the local gap is wider.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q4: Do you factor large composites fully?</h3>
                <p>
                  The tool exposes small factors quickly but isn’t a full factorization engine. For large composites with no small factor,
                  it reports “composite” without full factors.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-indigo-300">Q5: What about negative or fractional inputs?</h3>
                <p>
                  Primes are defined for integers ≥ 2. Negative or non-integer tokens are rejected during parsing and excluded from counts.
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
                Specialists in math utilities & UX. Last updated: <time dateTime="2025-11-10">November 10, 2025</time>.
              </p>
            </div>
          </div>
        
          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              🚀 Explore more tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/factorial-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-200 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
              >
                n! Factorial Calculator
              </Link>
              <Link
                to="/average-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-200 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
              >
                📊 Average Calculator
              </Link>
              <Link
                to="/quadratic-equation-solver"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-pink-600/20 text-pink-300 hover:text-pink-200 px-3 py-2 rounded-md border border-slate-700 hover:border-pink-500 transition-all duration-200"
              >
                𝑎x²+𝑏x+𝑐 Quadratic Solver
              </Link>
            </div>
          </div>
        </section>



        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/prime-number-checker" category="math-tools" />
      </div>
    </>
  );
};

/* ============================================================
   🧩 Small UI helpers
   ============================================================ */
const Tile: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155] shadow-sm">
    <div className="text-sm text-slate-400">{label}</div>
    <div className="text-lg font-semibold text-white break-words">{value}</div>
  </div>
);

export default PrimeNumberChecker;
