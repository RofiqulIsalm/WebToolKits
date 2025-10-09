import React, { useEffect, useMemo, useState } from 'react';
import {
  Binary,
  Settings,
  Copy,
  Check,
  Info,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  Hash,
  ScanSearch,
} from 'lucide-react';

import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

/**
 * Base Converter — Advanced
 * - Auto-detect input base (prefix-aware + smallest-valid-base heuristic)
 * - Supports custom bases 2–30 (A–T for 10–29)
 * - Prefix handling (0b / 0o / 0x)
 * - Grouping, uppercase/lowercase toggles, allow negative, show all bases table
 * - Copy buttons, mobile-first, glow cards
 * - SEO + JSON-LD (WebPage, SoftwareApplication, FAQPage)
 */

// ---------- Types & constants ----------
type IntBase =
  | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15 | 16
  | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30;

const COMMON_BASES: IntBase[] = [2, 8, 10, 16];
const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' as const; // up to base 36; we’ll use up to base 30 (A–T)
const MAX_BASE = 30 as const;

// ---------- Utility helpers (fixed) ----------
const clampBase = (n: number): IntBase => {
  if (n < 2) return 2 as IntBase;
  if (n > MAX_BASE) return MAX_BASE as IntBase;
  return n as IntBase;
};

const normalize = (s: string) => s.replace(/[\s_]+/g, '');

const charToVal = (ch: string): number => DIGITS.indexOf(ch.toUpperCase());

const maxDigitIn = (s: string): number => {
  let max = -1;
  for (const c of s) {
    if (c === '-') continue;
    const v = charToVal(c);
    if (v === -1) return 100; // invalid symbol forces invalid
    if (v > max) max = v;
  }
  return max;
};

/** Auto-detect:
 * - If prefixed (0b/0o/0x) => return that base
 * - Otherwise choose the smallest valid base that can represent all digits (>=2)
 */
const detectBase = (raw: string, allowPrefixes = true): IntBase | null => {
  let s = normalize(raw);
  if (!s) return null;
  if (s[0] === '-' || s[0] === '+') s = s.slice(1);
  if (!s) return null;

  if (allowPrefixes) {
    if (/^0[bB][01]+$/.test(s)) return 2 as IntBase;
    if (/^0[oO][0-7]+$/.test(s)) return 8 as IntBase;
    if (/^0[xX][0-9A-Fa-f]+$/.test(s)) return 16 as IntBase;
  }

  const highest = maxDigitIn(s);
  if (highest === 100) return null;
  return clampBase(Math.max(2, highest + 1));
};

const isValidForBase = (
  raw: string,
  base: IntBase,
  allowNegative: boolean,
  allowPrefixes: boolean
): boolean => {
  if (!raw) return false;
  let s = normalize(raw);

  // sign
  if (s[0] === '-' || s[0] === '+') {
    if (s[0] === '-' && !allowNegative) return false;
    s = s.slice(1);
  }
  if (!s) return false;

  if (allowPrefixes) {
    if (/^0[bB]/.test(s)) return base === 2 && /^[01]+$/.test(s.slice(2));
    if (/^0[oO]/.test(s)) return base === 8 && /^[0-7]+$/.test(s.slice(2));
    if (/^0[xX]/.test(s)) return base === 16 && /^[0-9A-Fa-f]+$/.test(s.slice(2));
  }

  for (const c of s) {
    const v = charToVal(c);
    if (v < 0 || v >= base) return false;
  }
  return true;
};

/** Strip matching prefix BEFORE parseInt to avoid 0 results for 0b/0o. */
const parseToDecimal = (
  raw: string,
  fromBase: IntBase,
  allowPrefixes: boolean
): number | null => {
  let s = normalize(raw);
  let sign = 1;
  if (s.startsWith('-')) { sign = -1; s = s.slice(1); }
  else if (s.startsWith('+')) { s = s.slice(1); }

  if (allowPrefixes) {
    if (fromBase === 2 && /^0[bB]/.test(s)) s = s.slice(2);
    if (fromBase === 8 && /^0[oO]/.test(s)) s = s.slice(2);
    if (fromBase === 16 && /^0[xX]/.test(s)) s = s.slice(2);
  }

  const n = parseInt(s, fromBase);
  if (!Number.isFinite(n) || Number.isNaN(n)) return null;
  return sign * n;
};

const toBaseString = (value: number, base: IntBase, uppercase: boolean) => {
  const out = value.toString(base);
  return uppercase ? out.toUpperCase() : out.toLowerCase();
};

const niceGroup = (s: string, base: IntBase) => {
  // Grouping: 4 for base 2/16, 3 for base 8/10, 4 otherwise
  const size = base === 2 || base === 16 ? 4 : base === 8 || base === 10 ? 3 : 4;
  const sign = s.startsWith('-') ? '-' : '';
  const body = sign ? s.slice(1) : s;
  const rev = body.split('').reverse();
  const chunks: string[] = [];
  for (let i = 0; i < rev.length; i += size) {
    chunks.push(rev.slice(i, i + size).reverse().join(''));
  }
  return sign + chunks.reverse().join(' ');
};

// ---------- Component ----------
const BaseConverter: React.FC = () => {
  // Core state
  const [inputValue, setInputValue] = useState<string>('42');
  const [autoDetect, setAutoDetect] = useState<boolean>(true);
  const [allowPrefixes, setAllowPrefixes] = useState<boolean>(true);
  const [allowNegative, setAllowNegative] = useState<boolean>(false);
  const [uppercase, setUppercase] = useState<boolean>(true);
  const [grouped, setGrouped] = useState<boolean>(true);

  const [fromBaseManual, setFromBaseManual] = useState<IntBase>(10 as IntBase);
  const detectedBase = useMemo(
    () => detectBase(inputValue, allowPrefixes),
    [inputValue, allowPrefixes]
  );
  const fromBase: IntBase | null = autoDetect ? detectedBase : fromBaseManual;

  // Custom target base
  const [customTargetBase, setCustomTargetBase] = useState<IntBase>(12 as IntBase);

  // UI
  const [error, setError] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showAllBases, setShowAllBases] = useState<boolean>(false);

  // Examples (quick chips)
  const examples = [
    { label: 'Binary 0b1010', value: '0b1010' },
    { label: 'Octal 0o52', value: '0o52' },
    { label: 'Hex 0x2A', value: '0x2A' },
    { label: 'Decimal 42', value: '42' },
    { label: 'Base 30 T9', value: 'T9' }, // 29*30 + 9 = 879 in decimal
  ];

  // Compute results
  const results = useMemo(() => {
    setError('');
    if (!inputValue || !fromBase) {
      return { ok: false, decimal: '', byBase: new Map<IntBase, string>() };
    }
    if (!isValidForBase(inputValue, fromBase, allowNegative, allowPrefixes)) {
      setError(`Invalid input for base ${fromBase}`);
      return { ok: false, decimal: '', byBase: new Map<IntBase, string>() };
    }

    const value = parseToDecimal(inputValue, fromBase, allowPrefixes);
    if (value === null || !Number.isFinite(value)) {
      setError('Unable to parse number (range or format).');
      return { ok: false, decimal: '', byBase: new Map<IntBase, string>() };
    }

    const all: [IntBase, string][] = [];
    const pack = (b: IntBase) => {
      const s = toBaseString(value, b, uppercase);
      return grouped ? niceGroup(s, b) : s;
    };

    for (const b of COMMON_BASES) {
      all.push([b as IntBase, pack(b as IntBase)]);
    }
    all.push([customTargetBase, pack(customTargetBase)]);

    return {
      ok: true,
      decimal: value.toString(10),
      byBase: new Map<IntBase, string>(all),
    };
  }, [inputValue, fromBase, allowNegative, allowPrefixes, uppercase, grouped, customTargetBase]);

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1200);
    } catch {
      // ignore
    }
  };

  const reset = () => {
    setInputValue('42');
    setAutoDetect(true);
    setAllowPrefixes(true);
    setAllowNegative(false);
    setUppercase(true);
    setGrouped(true);
    setFromBaseManual(10 as IntBase);
    setCustomTargetBase(12 as IntBase);
    setShowAllBases(false);
    setError('');
  };

  // ---------- SEO schemas ----------
  const faqItems = [
    {
      q: 'What number bases does this converter support?',
      a: 'The converter supports any integer base from 2 to 30 for both input and output, including binary (2), octal (8), decimal (10), hexadecimal (16), and custom bases up to 30.',
    },
    {
      q: 'How does auto-detect base work?',
      a: 'The tool recognizes prefixes like 0b (binary), 0o (octal), and 0x (hex). Without a prefix, it infers the smallest valid base for your digits.',
    },
    {
      q: 'Can I use letters beyond F?',
      a: 'Yes. For bases above 16, letters A–T represent values 10–29. For example, in base 30, “T” equals 29.',
    },
    {
      q: 'Are negative numbers supported?',
      a: 'Negative numbers are supported when the “Allow negative” option is enabled. The minus sign is preserved during conversion.',
    },
    {
      q: 'Why do very large numbers look rounded?',
      a: 'This converter uses JavaScript numbers for speed, which are accurate up to 53 bits. Extremely large values may lose precision.',
    },
    {
      q: 'What are the grouping spaces in results?',
      a: 'Grouping improves readability by inserting spaces at fixed intervals (e.g., every 4 digits for binary/hex). You can toggle grouping in Advanced Options.',
    },
    {
      q: 'Can I copy results?',
      a: 'Yes. Use the copy button on each result card or in the “All bases (2–30)” table.',
    },
  ];

  const softwareSchema = {
    '@type': 'SoftwareApplication',
    name: 'Base Converter',
    applicationCategory: 'Calculator',
    operatingSystem: 'Any',
    description:
      'Convert numbers between binary, octal, decimal, hexadecimal, and custom bases 2–30. Auto-detect input base with optional prefixes.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://calculatorhub.site/base-converter',
    softwareVersion: '2.0',
  };

  const webPageSchema = {
    '@type': 'WebPage',
    name: 'Base Converter – Binary, Octal, Decimal, Hex & Custom (2–30)',
    url: 'https://calculatorhub.site/base-converter',
    description:
      'Free online base converter with auto-detect. Convert between binary, octal, decimal, hex, and custom bases 2–30. Fast, accurate, and mobile-friendly.',
  };

  const faqSchema = {
    '@type': 'FAQPage',
    mainEntity: faqItems.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const combinedSchema = [
    generateCalculatorSchema(
      'Base Converter',
      'Convert numbers between different bases (2–30)',
      '/base-converter',
      ['base converter', 'binary converter', 'hex converter', 'octal converter', 'radix converter', 'base 30']
    ),
    softwareSchema,
    webPageSchema,
    faqSchema,
  ];

  // Build dynamic all-bases table
  const allBasesRows = useMemo(() => {
    if (!results.ok) return [];
    const value = Number(results.decimal);
    const out: { base: IntBase; text: string }[] = [];
    for (let b = 2 as IntBase; b <= MAX_BASE; b = (b + 1) as IntBase) {
      const s = toBaseString(value, b, uppercase);
      out.push({ base: b, text: grouped ? niceGroup(s, b) : s });
    }
    return out;
  }, [results.ok, results.decimal, grouped, uppercase]);

  const getPlaceholder = () =>
    autoDetect
      ? 'Type a number (e.g., 42, 0x2A, 0o52, 0b1010, or T9 for base ≥ 20)'
      : `Enter base-${fromBaseManual} number`;

  // ---------- Render ----------
  return (
    <>
      <SEOHead
        title={
          seoData.baseConverter?.title ||
          'Base Converter – Binary, Octal, Decimal, Hex & Custom (2–30)'
        }
        description={
          seoData.baseConverter?.description ||
          'Free online base converter with auto-detect. Convert between binary, octal, decimal, hexadecimal, and custom bases 2–30.'
        }
        canonical="https://calculatorhub.site/base-converter"
        schemaData={combinedSchema}
        breadcrumbs={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Base Converter', url: '/base-converter' },
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Breadcrumbs
          items={[
            { name: 'Misc Tools', url: '/category/misc-tools' },
            { name: 'Base Converter', url: '/base-converter' },
          ]}
        />

        {/* Header Card */}
        <div className="glow-card rounded-2xl p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 border border-blue-400/20 grid place-items-center">
                <Binary className="h-6 w-6 text-blue-300" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                Base Converter
              </h1>
            </div>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg border border-slate-600 transition"
            >
              <RefreshCcw className="h-4 w-4" />
              Reset
            </button>
          </div>

          {/* Error / Detection line */}
          <div className="mt-4">
            {error ? (
              <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/40 text-red-300 text-sm">
                {error}
              </div>
            ) : (
              <div className="flex items-start gap-2 text-slate-300 text-xs sm:text-sm">
                <ScanSearch className="h-4 w-4 mt-0.5 text-slate-400" />
                <p className="leading-relaxed">
                  {autoDetect ? (
                    <>
                      Auto-detect is <span className="text-emerald-300">on</span>
                      {fromBase ? (
                        <> — detected base <span className="font-semibold text-white">{fromBase}</span>.</>
                      ) : (
                        ' — start typing to detect base.'
                      )}
                    </>
                  ) : (
                    <>
                      Using manual base{' '}
                      <span className="font-semibold text-white">{fromBaseManual}</span>.
                    </>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Input */}
            <div className="lg:col-span-2 space-y-3">
              <label className="block text-sm font-medium text-white">Input Number</label>
              <input
                inputMode="text"
                autoCapitalize="characters"
                spellCheck={false}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={getPlaceholder()}
                className="w-full px-4 py-3 bg-slate-800/70 text-white rounded-xl border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 font-mono text-base sm:text-lg tracking-wide"
              />

              {/* Example chips */}
              <div className="flex flex-wrap gap-2">
                {examples.map((ex) => (
                  <button
                    key={ex.value}
                    onClick={() => setInputValue(ex.value)}
                    className="text-xs sm:text-sm px-3 py-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 transition"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {/* From Base Control */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white">From Base</label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COMMON_BASES.map((b) => (
                  <button
                    key={`from-${b}`}
                    onClick={() => {
                      setAutoDetect(false);
                      setFromBaseManual(b);
                    }}
                    className={`py-2.5 rounded-lg font-semibold transition border ${
                      (!autoDetect && fromBaseManual === b)
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-blue-500/70'
                        : 'bg-slate-700 text-slate-200 hover:bg-slate-600 border-slate-600'
                    }`}
                  >
                    {b === 2 ? 'Binary' : b === 8 ? 'Octal' : b === 10 ? 'Decimal' : 'Hex'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={2}
                  max={MAX_BASE}
                  value={!autoDetect ? fromBaseManual : ''}
                  onChange={(e) => {
                    setAutoDetect(false);
                    setFromBaseManual(clampBase(parseInt(e.target.value || '10', 10)));
                  }}
                  placeholder="Custom base (2–30)"
                  className="w-full px-3 py-2 bg-slate-800/70 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 text-sm"
                />
                <button
                  onClick={() => setAutoDetect((v) => !v)}
                  className={`whitespace-nowrap text-xs px-3 py-2 rounded-lg border transition ${
                    autoDetect
                      ? 'bg-emerald-900/30 border-emerald-600/50 text-emerald-200'
                      : 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600'
                  }`}
                >
                  {autoDetect ? 'Auto' : 'Manual'}
                </button>
              </div>
            </div>
          </div>

          {/* Results cards */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COMMON_BASES.map((b) => {
              const key = `res-${b}`;
              const label =
                b === 2 ? 'Binary (Base 2)' :
                b === 8 ? 'Octal (Base 8)' :
                b === 10 ? 'Decimal (Base 10)' :
                'Hexadecimal (Base 16)';
              const hint =
                b === 2 ? '0–1' :
                b === 8 ? '0–7' :
                b === 10 ? '0–9' :
                '0–9, A–F';

              const text = results.byBase.get(b as IntBase) || '-';
              return (
                <div
                  key={key}
                  className={`p-5 rounded-xl border relative overflow-hidden ${
                    b === 2
                      ? 'bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-blue-500/30'
                      : b === 8
                      ? 'bg-gradient-to-br from-green-900/25 to-green-800/25 border-green-500/30'
                      : b === 10
                      ? 'bg-gradient-to-br from-purple-900/25 to-purple-800/25 border-purple-500/30'
                      : 'bg-gradient-to-br from-orange-900/25 to-orange-800/25 border-orange-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-slate-300">{label}</p>
                      <span className="text-xs text-slate-500">{hint}</span>
                    </div>
                    <button
                      onClick={() => copy(key, text.replace(/\s+/g, ''))}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-slate-700/70 hover:bg-slate-600 text-slate-200 border border-slate-600 transition"
                      aria-label={`Copy ${label}`}
                    >
                      {copiedKey === key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedKey === key ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-white font-mono break-all">
                    {text || '-'}
                  </p>
                </div>
              );
            })}

            {/* Custom target base */}
            <div className="p-5 rounded-xl border bg-gradient-to-br from-cyan-900/25 to-cyan-800/25 border-cyan-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-cyan-300" />
                  <p className="text-sm font-medium text-slate-300">
                    Custom (Base {customTargetBase})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={2}
                    max={MAX_BASE}
                    value={customTargetBase}
                    onChange={(e) => setCustomTargetBase(clampBase(parseInt(e.target.value || '12', 10)))}
                    className="w-24 px-2 py-1 rounded-md bg-slate-800/70 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
                  />
                  <button
                    onClick={() =>
                      copy('custom', (results.byBase.get(customTargetBase) || '-').replace(/\s+/g, ''))
                    }
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-slate-700/70 hover:bg-slate-600 text-slate-200 border border-slate-600 transition"
                    aria-label="Copy custom base result"
                  >
                    {copiedKey === 'custom' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedKey === 'custom' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-white font-mono break-all">
                {results.byBase.get(customTargetBase) || '-'}
              </p>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="mt-8 rounded-xl border border-slate-700 bg-slate-800/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4 text-slate-300" />
              <h3 className="text-white font-semibold">Advanced Options</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <label className="flex items-center justify-between gap-3 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2">
                <span className="text-slate-200 text-sm">Auto-detect base</span>
                <input
                  type="checkbox"
                  checked={autoDetect}
                  onChange={() => setAutoDetect((v) => !v)}
                  className="h-4 w-4 accent-blue-500"
                />
              </label>

              <label className="flex items-center justify-between gap-3 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2">
                <span className="text-slate-200 text-sm">Allow 0x / 0o / 0b prefixes</span>
                <input
                  type="checkbox"
                  checked={allowPrefixes}
                  onChange={() => setAllowPrefixes((v) => !v)}
                  className="h-4 w-4 accent-blue-500"
                />
              </label>

              <label className="flex items-center justify-between gap-3 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2">
                <span className="text-slate-200 text-sm">Allow negative (−)</span>
                <input
                  type="checkbox"
                  checked={allowNegative}
                  onChange={() => setAllowNegative((v) => !v)}
                  className="h-4 w-4 accent-blue-500"
                />
              </label>

              <label className="flex items-center justify-between gap-3 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2">
                <span className="text-slate-200 text-sm">Uppercase letters (A–T)</span>
                <input
                  type="checkbox"
                  checked={uppercase}
                  onChange={() => setUppercase((v) => !v)}
                  className="h-4 w-4 accent-blue-500"
                />
              </label>

              <label className="flex items-center justify-between gap-3 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2">
                <span className="text-slate-200 text-sm">Group digits for readability</span>
                <input
                  type="checkbox"
                  checked={grouped}
                  onChange={() => setGrouped((v) => !v)}
                  className="h-4 w-4 accent-blue-500"
                />
              </label>

              <button
                onClick={() => setShowAllBases((v) => !v)}
                className="flex items-center justify-between gap-2 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm hover:bg-slate-700/60 transition"
              >
                <span>Show all bases (2–30)</span>
                {showAllBases ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>

            {/* All Bases Table */}
            {showAllBases && (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400">
                      <th className="py-2 pr-3 font-medium">Base</th>
                      <th className="py-2 pr-3 font-medium">Digits</th>
                      <th className="py-2 font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.ok ? (
                      allBasesRows.map((row) => {
                        const key = `row-${row.base}`;
                        return (
                          <tr
                            key={key}
                            className="border-t border-slate-700/60 hover:bg-slate-800/40 transition"
                          >
                            <td className="py-2 pr-3 text-slate-200 font-medium">Base {row.base}</td>
                            <td className="py-2 pr-3 text-slate-400">
                              {row.base <= 10
                                ? `0–${row.base - 1}`
                                : `0–9, A–${DIGITS[row.base - 1]}`}
                            </td>
                            <td className="py-2">
                              <div className="flex items-center justify-between gap-3">
                                <code className="font-mono text-slate-100 break-all">{row.text}</code>
                                <button
                                  onClick={() => copy(key, row.text.replace(/\s+/g, ''))}
                                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-slate-700/70 hover:bg-slate-600 text-slate-200 border border-slate-600 transition whitespace-nowrap"
                                >
                                  {copiedKey === key ? (
                                    <>
                                      <Check className="h-3.5 w-3.5" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5" />
                                      Copy
                                    </>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-3 text-slate-400">
                          Enter a valid number to see conversions for all bases.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SEO helper tip */}
          <div className="mt-4 flex items-start gap-2 text-slate-400 text-xs">
            <Info className="h-4 w-4" />
            <p>
              Tip: Use prefixes (0x, 0o, 0b) for instant base detection, or toggle to manual and set a
              custom base between 2 and 30.
            </p>
          </div>
        </div>

        <AdBanner />

        {/* About / SEO Content */}
        <div className="glow-card rounded-2xl p-6 sm:p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">About the Base Converter</h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              This free Base Converter instantly converts numbers between different radix systems,
              including binary (2), octal (8), decimal (10), hexadecimal (16), and any custom base
              from 2 to 30. It supports automatic base detection using common prefixes and digit
              analysis, so you can paste values like <code className="font-mono">0x2A</code>,{' '}
              <code className="font-mono">0o52</code>, <code className="font-mono">0b1010</code>, or
              even higher-base letters such as <code className="font-mono">T9</code> for base 30.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6">How it works</h3>
            <p>
              When auto-detect is enabled, the converter checks for base prefixes (0x, 0o, 0b).
              If none are found, it infers the smallest base that can represent your digits. The input
              is validated against the detected or selected base, parsed to an internal decimal
              number, then rendered to the target bases. For readability, you can group digits in
              blocks—typically every 4 for binary/hex and 3 for octal/decimal.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6">Why use this tool</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Automatic base detection for faster workflows</li>
              <li>Custom source and target bases (2–30) with A–T digit support</li>
              <li>Clean, mobile-first interface with copy buttons and glow cards</li>
              <li>Readable grouped outputs and uppercase/lowercase toggles</li>
              <li>Great for development, education, color codes, and debugging</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6">Digit mapping</h3>
            <p>
              For bases above 10, letters represent values starting at 10. For example:
              A=10, B=11, …, F=15, …, T=29 (base 30). You can switch to lowercase if preferred.
            </p>
          </div>

          {/* FAQs */}
          <div className="mt-8">
            <h3 className="text-xl font-bold text-white mb-3">FAQs</h3>
            <div className="space-y-3">
              {faqItems.map((f) => (
                <details
                  key={f.q}
                  className="rounded-lg border border-slate-700 bg-slate-800/40 p-4 group"
                >
                  <summary className="cursor-pointer font-medium text-slate-100">
                    {f.q}
                  </summary>
                  <p className="mt-2 text-slate-300">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>

        <RelatedCalculators currentPath="/base-converter" />
      </div>
    </>
  );
};

export default BaseConverter;
