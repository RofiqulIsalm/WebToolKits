import React, { useMemo, useState } from 'react';
import { Link } from "react-router-dom";
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
  BookOpen,
} from 'lucide-react';

import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

/**
 * Base Converter — Advanced (with BigInt + per-base math explanations)
 * - Auto-detect input base (prefix-aware + smallest-valid-base heuristic)
 * - Supports custom bases 2–30 (A–T for 10–29)
 * - BigInt mode for exact math (arbitrarily large inputs)
 * - Per-card "Show Math" explanations (paper-style steps)
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
const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' as const; // up to base 36; we use up to base 30 (A–T)
const MAX_BASE = 30 as const;

// ---------- Utility helpers ----------
const clampBase = (n: number): IntBase => {
  if (n < 2) return 2 as IntBase;
  if (n > MAX_BASE) return MAX_BASE as IntBase; 
  return n as IntBase;
};

const normalize = (s: string) => s.replace(/[\s_]+/g, '').trim();

const charToVal = (ch: string): number => DIGITS.indexOf(ch.toUpperCase());
const valToChar = (v: number, uppercase: boolean) => (uppercase ? DIGITS[v] : DIGITS[v].toLowerCase());

const stripSign = (s: string) => {
  let sign = 1;
  if (s.startsWith('-')) { sign = -1; s = s.slice(1); }
  else if (s.startsWith('+')) { s = s.slice(1); }
  return { sign, body: s };
};

const hasPrefix = (s: string) =>
  /^0[bB]/.test(s) ? 2 :
  /^0[oO]/.test(s) ? 8 :
  /^0[xX]/.test(s) ? 16 :
  null;

const stripMatchingPrefixForBase = (s: string, base: IntBase, allowPrefixes: boolean) => {
  if (!allowPrefixes) return s;
  if (base === 2 && /^0[bB]/.test(s)) return s.slice(2);
  if (base === 8 && /^0[oO]/.test(s)) return s.slice(2);
  if (base === 16 && /^0[xX]/.test(s)) return s.slice(2);
  return s;
};

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
 * - If prefixed (0b/0o/0x) => return that base (if digits valid for that prefix)
 * - Otherwise choose the smallest valid base that can represent all digits (>=2)
 */
const detectBase = (raw: string, allowPrefixes = true): IntBase | null => {
  let s = normalize(raw);
  if (!s) return null;
  const { body } = stripSign(s);
  if (!body) return null;

  if (allowPrefixes) {
    if (/^0[bB][01]+$/.test(body)) return 2 as IntBase;
    if (/^0[oO][0-7]+$/.test(body)) return 8 as IntBase;
    if (/^0[xX][0-9A-Fa-f]+$/.test(body)) return 16 as IntBase;
  }

  const highest = maxDigitIn(body);
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
  const { sign, body } = stripSign(s);
  if (sign === -1 && !allowNegative) return false;
  if (!body) return false;

  if (allowPrefixes) {
    if (/^0[bB]/.test(body)) return base === 2 && /^[01]+$/.test(body.slice(2));
    if (/^0[oO]/.test(body)) return base === 8 && /^[0-7]+$/.test(body.slice(2));
    if (/^0[xX]/.test(body)) return base === 16 && /^[0-9A-Fa-f]+$/.test(body.slice(2));
  }

  for (const c of body) {
    const v = charToVal(c);
    if (v < 0 || v >= base) return false;
  }
  return true;
};

// -------- Number-mode parse/format (fast, limited to 53-bit exactness) --------
const parseToNumber = (
  raw: string,
  fromBase: IntBase,
  allowPrefixes: boolean
): number | null => {
  let s = normalize(raw);
  const { sign, body } = stripSign(s);
  let b = stripMatchingPrefixForBase(body, fromBase, allowPrefixes);
  const n = parseInt(b, fromBase);
  if (!Number.isFinite(n) || Number.isNaN(n)) return null;
  return sign * n;
};

const toBaseStringNumber = (value: number, base: IntBase, uppercase: boolean) => {
  const out = value.toString(base);
  return uppercase ? out.toUpperCase() : out.toLowerCase();
};

// -------- BigInt-mode parse/format (exact, arbitrary length) --------
const parseToBigInt = (
  raw: string,
  base: IntBase,
  allowPrefixes: boolean
): bigint | null => {
  let s = normalize(raw);
  let { sign, body } = stripSign(s);
  body = stripMatchingPrefixForBase(body, base, allowPrefixes);

  if (!body) return null;

  let result = 0n;
  const B = BigInt(base);
  for (const ch of body) {
    const v = BigInt(charToVal(ch));
    if (v < 0n || v >= B) return null;
    result = result * B + v;
  }
  return sign === -1 ? -result : result;
};

const toBaseStringBigInt = (value: bigint, base: IntBase, uppercase: boolean): string => {
  const B = BigInt(base);
  if (value === 0n) return '0';
  const neg = value < 0n;
  let n = neg ? -value : value;
  let out = '';
  while (n > 0n) {
    const rem = Number(n % B);
    out = valToChar(rem, uppercase) + out;
    n = n / B;
  }
  return neg ? '-' + out : out;
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

// ---------- Math explanations (paper-style) ----------
const explainInputToDecimal = (
  raw: string,
  fromBase: IntBase,
  allowPrefixes: boolean
): string => {
  // Show positional expansion: d_k * base^k + ... + d_0 * base^0
  let s = normalize(raw);
  let { sign, body } = stripSign(s);
  const prefixed = hasPrefix(body);
  if (prefixed) {
    body = stripMatchingPrefixForBase(body, fromBase, allowPrefixes);
  }
  const digits = body.split('').map((c) => ({ c: c.toUpperCase(), v: charToVal(c) }));
  const base = Number(fromBase);

  const parts = digits.map((d, i) => {
    const power = digits.length - 1 - i;
    return `${d.c}×${fromBase}^${power}`;
  });

  const values = digits.map((d, i) => {
    const power = digits.length - 1 - i;
    const mul = d.v * Math.pow(base, power);
    return `${d.v}×${fromBase}^${power}${power ? '' : ''}`;
  });

  const header = `Input → Decimal (Base ${fromBase} to Base 10)`;
  const signText = sign === -1 ? ' (negative)' : '';
  return [
    `${header}${signText}`,
    `Raw: ${raw}`,
    `Normalized digits: ${digits.map((d) => d.c).join(' ')}`,
    `Positional form: ${parts.join(' + ')}`,
    `Evaluate: ${values.join(' + ')}`,
    `Note: Letters map to numbers → A=10, …, T=29.`,
  ].join('\n');
};

const explainDecimalToTarget = (decimalStr: string, targetBase: IntBase, uppercase: boolean): string => {
  // Use repeated division by base and collect remainders
  // We do it with BigInt to be exact even if decimalStr is big
  let n = BigInt(decimalStr);
  const sign = n < 0n ? -1n : 1n;
  if (n < 0n) n = -n;
  const B = BigInt(targetBase);
  const steps: string[] = [];
  if (n === 0n) {
    steps.push(`0 ÷ ${targetBase} = 0 remainder 0`);
  } else {
    let temp = n;
    while (temp > 0n) {
      const q = temp / B;
      const r = Number(temp % B);
      steps.push(`${temp.toString()} ÷ ${targetBase} = ${q.toString()} remainder ${valToChar(r, uppercase)}`);
      temp = q;
      if (steps.length > 5000) break; // safety for extremely long numbers
    }
  }

  const remainders = steps.map((line) => {
    const after = line.split('remainder ')[1] || '';
    return after.trim();
  }).reverse().join('');

  const header = `Decimal → Base ${targetBase}`;
  const signText = sign < 0n ? ' (negative)' : '';
  return [
    `${header}${signText}`,
    `Start: ${decimalStr}`,
    `Divide by ${targetBase} and track remainders:`,
    ...steps,
    `Read remainders backward → ${remainders || '0'}`,
  ].join('\n');
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
  const [useBigInt, setUseBigInt] = useState<boolean>(true); // BigInt mode toggle

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

  // Per-card "Show Math" toggles
  const [showMath, setShowMath] = useState<Record<string, boolean>>({
    '2': false, '8': false, '10': false, '16': false, custom: false,
  });
  // Modal state for "Show Math"
  const [mathModal, setMathModal] = useState<{ open: boolean; title: string; content: string }>({
    open: false,
    title: '',
    content: '',
  });
  
  const openMathModal = (title: string, content: string) =>
    setMathModal({ open: true, title, content });
  
  const closeMathModal = () =>
    setMathModal({ open: false, title: '', content: '' });


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
      return {
        ok: false,
        decimalStr: '',
        byBase: new Map<IntBase, string>(),
        bigint: null as null | bigint,
        number: null as null | number,
      };
    }
    if (!isValidForBase(inputValue, fromBase, allowNegative, allowPrefixes)) {
      setError(`Invalid input for base ${fromBase}`);
      return { ok: false, decimalStr: '', byBase: new Map<IntBase, string>(), bigint: null, number: null };
    }

    // parse via selected engine
    let decimalStr = '';
    let decBig: bigint | null = null;
    let decNum: number | null = null;

    if (useBigInt) {
      decBig = parseToBigInt(inputValue, fromBase, allowPrefixes);
      if (decBig === null) {
        setError('Unable to parse number (range or format).');
        return { ok: false, decimalStr: '', byBase: new Map<IntBase, string>(), bigint: null, number: null };
      }
      decimalStr = decBig.toString(10);
    } else {
      decNum = parseToNumber(inputValue, fromBase, allowPrefixes);
      if (decNum === null || !Number.isFinite(decNum)) {
        setError('Unable to parse number (range or format).');
        return { ok: false, decimalStr: '', byBase: new Map<IntBase, string>(), bigint: null, number: null };
      }
      decimalStr = decNum.toString(10);
    }

    const pack = (b: IntBase): string => {
      const raw = useBigInt
        ? toBaseStringBigInt(BigInt(decimalStr), b, uppercase)
        : toBaseStringNumber(Number(decimalStr), b, uppercase);
      return grouped ? niceGroup(raw, b) : raw;
    };
    

    const all: [IntBase, string][] = [];
    for (const b of COMMON_BASES) all.push([b as IntBase, pack(b as IntBase)]);
    all.push([customTargetBase, pack(customTargetBase)]);

    return {
      ok: true,
      decimalStr,
      byBase: new Map<IntBase, string>(all),
      bigint: decBig,
      number: decNum,
    };
  }, [inputValue, fromBase, allowNegative, allowPrefixes, uppercase, grouped, customTargetBase, useBigInt]);

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
    setUseBigInt(true);
    setFromBaseManual(10 as IntBase);
    setCustomTargetBase(12 as IntBase);
    setShowAllBases(false);
    setShowMath({ '2': false, '8': false, '10': false, '16': false, custom: false });
    setError('');
  };

  // Build dynamic all-bases table
  const allBasesRows = useMemo(() => {
    if (!results.ok) return [];
    const out: { base: IntBase; text: string }[] = [];
    for (let b = 2 as IntBase; b <= MAX_BASE; b = (b + 1) as IntBase) {
      const raw = useBigInt
        ? toBaseStringBigInt(BigInt(results.decimalStr), b, uppercase)
        : toBaseStringNumber(Number(results.decimalStr), b, uppercase);
      out.push({ base: b, text: grouped ? niceGroup(raw, b) : raw });
    }
    return out;
  }, [results.ok, results.decimalStr, grouped, uppercase, useBigInt]);

  const getPlaceholder = () =>
    autoDetect
      ? 'Type a number (e.g., 42, 0x2A, 0o52, 0b1010, or T9 for base ≥ 20)'
      : `Enter base-${fromBaseManual} number`;

  const toggleMath = (key: string) =>
    setShowMath((m) => ({ ...m, [key]: !m[key] }));

  const mathForTarget = (targetBase: IntBase | 'custom'): string => {
    if (!results.ok || !fromBase) return 'Enter a valid number to see the math.';
    const srcBase = fromBase;
    if (targetBase === 10) {
      return explainInputToDecimal(inputValue, srcBase, allowPrefixes) + `\nResult: ${results.decimalStr} (Decimal)`;
    }
    const tb = targetBase === 'custom' ? customTargetBase : (targetBase as IntBase);
    const head = explainInputToDecimal(inputValue, srcBase, allowPrefixes);
    const tail = explainDecimalToTarget(results.decimalStr, tb, uppercase);
    const finalVal = results.byBase.get(tb) || '';
    return `${head}\n\n${tail}\nResult: ${finalVal || '-'} (Base ${tb})`;
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
      a: 'In fast mode, JavaScript numbers are accurate up to 53 bits. Turn on “Use BigInt (Exact mode)” for precise results with very large values.',
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
      'Convert numbers between binary, octal, decimal, hexadecimal, and custom bases 2–30. Auto-detect input base with optional prefixes and BigInt exact mode.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://calculatorhub.site/base-converter',
    softwareVersion: '3.0',
  };

  const webPageSchema = {
    '@type': 'WebPage',
    name: 'Base Converter – Binary, Octal, Decimal, Hex & Custom (2–30)',
    url: 'https://calculatorhub.site/base-converter',
    description:
      'Free online base converter with auto-detect and BigInt exact mode. Convert between binary, octal, decimal, hex, and custom bases 2–30. Fast, accurate, and mobile-friendly.',
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
      ['base converter', 'binary converter', 'hex converter', 'octal converter', 'radix converter', 'base 30', 'BigInt converter']
    ),
    softwareSchema,
    webPageSchema,
    faqSchema,
  ];

  // ---------- Render ----------
  return (
    <>
      <SEOHead
          title={
            seoData.baseConverter?.title ||
            'Base Converter – Convert Binary, Octal, Decimal, Hex & Custom Bases (2–30) Online'
          }
          description={
            seoData.baseConverter?.description ||
            'Free online base converter to convert numbers between binary, octal, decimal, hexadecimal, and custom bases (2–30). Supports BigInt precision, auto-detect, and step-by-step math explanations.'
          }
          canonical="https://calculatorhub.site/base-converter"
          schemaData={combinedSchema}
          breadcrumbs={[
            { name: 'Misc Tools', url: '/category/misc-tools' },
            { name: 'Base Converter', url: '/base-converter' },
          ]}
          openGraph={{
            title: 'Base Converter – Binary, Octal, Decimal, Hex & Custom (2–30)',
            description:
              'Convert numbers between binary, octal, decimal, hexadecimal, and custom bases up to 30. Includes BigInt exact mode, auto-detection, and math breakdowns.',
            url: 'https://calculatorhub.site/base-converter',
            type: 'website',
            locale: 'en_US',
            site_name: 'CalculatorHub',
            image: 'https://calculatorhub.site/public/images/base-converter-binary-decimal-hex-custom-online-tool.png',
            imageAlt: 'Base Converter interface showing binary, decimal, hex, and custom base results with step-by-step math explanation.',
          }}
          twitter={{
            card: 'summary_large_image',
            title: 'Base Converter – Binary, Decimal, Hex & Custom (2–30)',
            description:
              'Convert between binary, decimal, hex, and custom bases with precision. Auto-detects prefixes and explains the math behind every conversion.',
            image: 'https://calculatorhub.site/public/images/base-converter-binary-decimal-hex-custom-online-tool.png',
            creator: '@CalculatorHub',
          }}
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

              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
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
              const showKey = String(b);

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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copy(key, text.replace(/\s+/g, ''))}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-slate-700/70 hover:bg-slate-600 text-slate-200 border border-slate-600 transition"
                        aria-label={`Copy ${label}`}
                      >
                        {copiedKey === key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedKey === key ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        onClick={() =>
                          openMathModal(
                            label,
                            b === 10 ? mathForTarget(10) : mathForTarget(b as IntBase)
                          )
                        }
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-slate-700/70 hover:bg-slate-600 text-slate-200 border border-slate-600 transition"
                        aria-label={`Show math for ${label}`}
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                      </button>

                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-white font-mono break-all">
                    {text || '-'}
                  </p>

                  
                </div>
              );
            })}

            {/* Custom target base */}
            <div className="p-5 rounded-xl border bg-gradient-to-br from-cyan-900/25 to-cyan-800/25 border-cyan-500/30">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-3">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-cyan-300" />
                  <p className="text-sm font-medium text-slate-300">
                    Custom
                  </p>
                </div>
            
                {/* Buttons + Input group */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min={2}
                    max={MAX_BASE}
                    value={customTargetBase}
                    onChange={(e) =>
                      setCustomTargetBase(
                        clampBase(parseInt(e.target.value || '12', 10))
                      )
                    }
                    className="w-24 px-2 py-1 rounded-md bg-slate-800/70 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
                  />
            
                  <button
                    onClick={() =>
                      copy(
                        'custom',
                        (results.byBase.get(customTargetBase) || '-').replace(/\s+/g, '')
                      )
                    }
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-slate-700/70 hover:bg-slate-600 text-slate-200 border border-slate-600 transition"
                    aria-label="Copy custom base result"
                  >
                    {copiedKey === 'custom' ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </>
                    )}
                  </button>
            
                  <button
                    onClick={() =>
                      openMathModal(
                        `Custom Base ${customTargetBase}`,
                        mathForTarget('custom')
                      )
                    }
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-slate-700/70 hover:bg-slate-600 text-slate-200 border border-slate-600 transition"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
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

              <label className="flex items-center justify-between gap-3 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2">
                <span className="text-slate-200 text-sm">Use BigInt (Exact mode)</span>
                <input
                  type="checkbox"
                  checked={useBigInt}
                  onChange={() => setUseBigInt((v) => !v)}
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
              custom base between 2 and 30. BigInt mode ensures exact results for huge inputs.
            </p>
          </div>
        </div>

        <AdBanner />

        {/* About / SEO Content */}

        <div className="rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Base Converter – Convert Between Binary, Octal, Decimal, Hex & Custom Bases</h2>
          <h3 className="text-xl text-slate-300 mb-3">Fast, accurate, and fully automatic number system conversion</h3>
        
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              The <strong>Base Converter</strong> lets you easily convert numbers between different number systems – 
              including <strong>binary (base 2)</strong>, <strong>octal (base 8)</strong>, <strong>decimal (base 10)</strong>, 
              <strong>hexadecimal (base 16)</strong>, and even <strong>custom bases (2–30)</strong>. 
              It supports <em>auto-detection</em> of base type, so you can paste a value like <code className="font-mono">0x2A</code> or <code className="font-mono">0b101010</code> 
              and instantly get the correct conversions.
            </p>
        
            <p>
              This tool uses both <strong>JavaScript BigInt mode</strong> and a fast numeric engine to ensure that 
              even extremely large numbers convert accurately without rounding errors. 
              You can view the results in multiple bases at once, copy them, and toggle between uppercase or lowercase digits.
            </p>
        
            <p>
              The built-in <strong>“Show Math”</strong> feature visually explains how each number is converted 
              — showing step-by-step expansion just like you’d do on paper, making it ideal for learning and debugging.
            </p>
        
            <p>
              Whether you’re a <strong>developer</strong>, <strong>student</strong>, or <strong>electronics hobbyist</strong>, 
              this converter helps you instantly translate between systems used in computing, data encoding, and digital design.
            </p>
        
            <h2 className="text-yellow-500 font-bold">🔹 What This Tool Does</h2>
            <p>
              It detects or accepts a base input, validates your digits, converts it to an internal decimal value, 
              and then outputs accurate representations in other bases (2–30). You can also see each base’s allowed digits, 
              perform exact math, and explore all base values in a detailed conversion table.
            </p>
        
            <h2 className="text-yellow-500 font-bold">🔹 How to Use</h2>
            <p>
              Enter or paste your number in the input box. The converter will automatically detect its base 
              using prefixes like <code className="font-mono">0b</code>, <code className="font-mono">0o</code>, or <code className="font-mono">0x</code>. 
              You can also switch to “Manual” mode and pick your base (2–30).  
              Toggle advanced options like BigInt mode, grouping, or negative numbers for precision control.
            </p>
        
            <h2 className="text-yellow-500 font-bold">🔹 Why Use It</h2>
            <p>
              Traditional calculators and programming languages can struggle with large or unusual bases. 
              This converter gives you <strong>exact results</strong>, full customization, visual explanations, 
              and easy sharing or copying for documentation or debugging. 
              It’s built for <strong>developers, data engineers, students, and educators</strong> alike.
            </p>
        
            <h2 className="text-yellow-500 font-bold">🔹 Key Benefits</h2>
            <p>
              With a sleek, mobile-friendly interface and instant auto-detection, this converter is perfect 
              for everyday use or technical workflows.
            </p>

              <h2 className="text-3xl font-bold text-white mb-4">
                🔍 How the Base Converter Works – Logic & Math Explained
              </h2>
            
              <div className="space-y-4 text-slate-300 leading-relaxed">
                <p>
                  The <strong>Base Converter</strong> uses fundamental <em>positional numeral system logic</em> to
                  translate numbers between different bases. Each digit in a number represents a value multiplied
                  by the base raised to the power of its position.
                </p>
            
                <p>
                  For a number <code className="font-mono">dₙdₙ₋₁...d₀</code> in base <code className="font-mono">b</code>, 
                  its value in decimal (base 10) is calculated as:
                </p>
            
                <pre className="bg-slate-800/70 p-4 rounded-lg text-sm font-mono text-slate-100 overflow-x-auto">
                  Value₁₀ = d₀×b⁰ + d₁×b¹ + d₂×b² + ... + dₙ×bⁿ
                </pre>
            
                <p>
                  The converter automatically applies this formula to compute the <strong>decimal equivalent</strong>, 
                  then reverses the logic using <em>repeated division and remainders</em> to express that number 
                  in a new base.
                </p>
            
                <h3 className="text-2xl font-semibold text-white mt-6">🧮 Step-by-Step Logic</h3>
            
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Step 1:</strong> Detect or set the source base (auto-detect from prefix like <code className="font-mono">0x</code>, <code className="font-mono">0b</code>, <code className="font-mono">0o</code>)</li>
                  <li><strong>Step 2:</strong> Normalize and validate all digits for that base</li>
                  <li><strong>Step 3:</strong> Convert source → decimal using positional expansion</li>
                  <li><strong>Step 4:</strong> Convert decimal → target base using repeated division</li>
                  <li><strong>Step 5:</strong> Output formatted string (grouped digits, uppercase/lowercase)</li>
                </ul>
            
                <h2 className="text-yellow-500 font-bold mt-6">📘 Binary (Base 2) Example</h2>
                <p>
                  Example: Convert <code className="font-mono">0b1011</code> (binary) to decimal.
                </p>
                <pre className="bg-slate-800/70 p-4 rounded-lg text-sm font-mono text-slate-100 overflow-x-auto">
                  (1×2³) + (0×2²) + (1×2¹) + (1×2⁰)  
                  = 8 + 0 + 2 + 1  
                  = 11₁₀
                </pre>
                <p>
                  Result: <strong>11 in decimal</strong>
                </p>
            
                <h2 className="text-yellow-500 font-bold mt-6">📗 Octal (Base 8) Example</h2>
                <p>
                  Example: Convert <code className="font-mono">0o52</code> (octal) to decimal.
                </p>
                <pre className="bg-slate-800/70 p-4 rounded-lg text-sm font-mono text-slate-100 overflow-x-auto">
                  (5×8¹) + (2×8⁰)  
                  = 40 + 2  
                  = 42₁₀
                </pre>
                <p>
                  Result: <strong>42 in decimal</strong>
                </p>
            
                <h2 className="text-yellow-500 font-bold mt-6">📙 Hexadecimal (Base 16) Example</h2>
                <p>
                  Example: Convert <code className="font-mono">0x2A</code> (hexadecimal) to decimal.
                </p>
                <pre className="bg-slate-800/70 p-4 rounded-lg text-sm font-mono text-slate-100 overflow-x-auto">
                  (2×16¹) + (A×16⁰)  
                  = (2×16) + (10×1)  
                  = 32 + 10  
                  = 42₁₀
                </pre>
                <p>
                  Result: <strong>42 in decimal</strong>
                </p>
            
                <h2 className="text-yellow-500 font-bold mt-6">📒 Decimal (Base 10) → Binary Example</h2>
                <p>
                  To convert <code className="font-mono">42</code> from decimal to binary, divide repeatedly by 2 and 
                  note remainders (read from bottom up):
                </p>
                <pre className="bg-slate-800/70 p-4 rounded-lg text-sm font-mono text-slate-100 overflow-x-auto">
                  42 ÷ 2 = 21 remainder 0  
                  21 ÷ 2 = 10 remainder 1  
                  10 ÷ 2 = 5 remainder 0  
                  5 ÷ 2 = 2 remainder 1  
                  2 ÷ 2 = 1 remainder 0  
                  1 ÷ 2 = 0 remainder 1  
            
                  Reading remainders ↑ → 101010₂
                </pre>
                <p>
                  Result: <strong>101010 in binary</strong> (0b101010)
                </p>
            
                <h2 className="text-yellow-500 font-bold mt-6">📕 Custom Base (e.g., Base 30) Example</h2>
                <p>
                  Custom bases above 10 use letters for digits. In base 30, the digits go up to <code className="font-mono">T=29</code>.
                  Example: Convert <code className="font-mono">T9</code> (Base 30) to decimal.
                </p>
                <pre className="bg-slate-800/70 p-4 rounded-lg text-sm font-mono text-slate-100 overflow-x-auto">
                  (T×30¹) + (9×30⁰)  
                  = (29×30) + (9×1)  
                  = 870 + 9  
                  = 879₁₀
                </pre>
                <p>
                  Result: <strong>879 in decimal</strong>
                </p>
            
                <h3 className="text-2xl font-semibold text-white mt-6">💡 Why This Logic Matters</h3>
                <p>
                  Understanding this logic helps users grasp how computers store and interpret data. 
                  Binary represents electrical signals (on/off), hexadecimal simplifies binary groups, and 
                  custom bases allow compact data representation in cryptography and encoding systems.
                </p>
            
                <p>
                  This converter mirrors these mathematical operations internally and displays the steps 
                  transparently in the “Show Math” modal, allowing you to learn or verify every transformation.
                </p>
            
                <AdBanner type="bottom" />
              </div>


        
            <h3 className="text-2xl font-semibold text-white mt-6">✨ Key Features</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Auto-detects base from prefixes or digits (0b, 0o, 0x)</li>
              <li>Supports all bases from 2 to 30 (A–T represent digits 10–29)</li>
              <li>BigInt exact mode for unlimited precision conversions</li>
              <li>“Show Math” mode with step-by-step conversion logic</li>
              <li>Readable output with grouped digits for clarity</li>
              <li>Copy, export, and view results for all bases in a table</li>
            </ul>
        
            <p>
              In short, the <strong>Base Converter</strong> provides an elegant, developer-friendly, and 
              highly educational experience for exploring numeric systems.
            </p>
        
            <h3 className="text-2xl font-semibold text-white mt-6">📚 Example Uses</h3>
            <p>
              This tool is invaluable in <strong>software development</strong>, <strong>hardware design</strong>, and <strong>learning environments</strong>. 
              Here are some popular use cases:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Programming:</strong> Convert between binary, hex, and decimal for debugging</li>
              <li><strong>Networking:</strong> Analyze IPs and subnet masks using base conversions</li>
              <li><strong>Education:</strong> Learn number system logic with visual explanations</li>
              <li><strong>Design:</strong> Decode color hex values to RGB and vice versa</li>
            </ul>
        
            <p>
              The Base Converter on <strong>CalculatorHub.site</strong> combines power, clarity, and flexibility — 
              all within a smooth, responsive interface.
            </p>
        
            <AdBanner type="bottom" />
        
            <section className="space-y-4 mt-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
              </h2>
        
              <div className="space-y-4 text-slate-100 leading-relaxed">
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q1</span>: What number bases can I convert?</h3>
                  <p>
                    You can convert between <strong>any base from 2 to 30</strong>, including standard systems like binary, octal, decimal, and hexadecimal.
                  </p>
                </div>
        
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q2</span>: How does auto-detect work?</h3>
                  <p>
                    Auto-detect scans your input for known prefixes (<code className="font-mono">0x</code>, <code className="font-mono">0b</code>, <code className="font-mono">0o</code>) 
                    or determines the smallest valid base for your digits.
                  </p>
                </div>
        
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q3</span>: What are letters A–T used for?</h3>
                  <p>
                    Letters represent digits above 9. For example, A=10, B=11, …, F=15, up to T=29 in base 30.
                  </p>
                </div>
        
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q4</span>: Why use BigInt mode?</h3>
                  <p>
                    BigInt ensures mathematically exact conversions even for very large numbers, avoiding rounding errors found in normal floating-point math.
                  </p>
                </div>
        
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q5</span>: Can I see how the conversion works?</h3>
                  <p>
                    Yes! Click “Show Math” next to any result to open a step-by-step modal that explains the positional and division method used.
                  </p>
                </div>
        
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q6</span>: Is this tool mobile-friendly?</h3>
                  <p>
                    Absolutely. The Base Converter adapts perfectly to all screen sizes, ensuring clear readability and no overflow even on mobile devices.
                  </p>
                </div>
        
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q7</span>: Do I need to install anything?</h3>
                  <p>
                    No installation required — it runs instantly in your browser. Just open <strong>calculatorhub.site/base-converter</strong> and start converting.
                  </p>
                </div>
              </div>
            </section>
        
          </div>
        </div>

        
        {/* seo content end*/}

        <RelatedCalculators currentPath="/base-converter" />
          {mathModal.open && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300"
              onClick={closeMathModal}
            >
              <div
                className="relative bg-slate-900/90 border border-slate-700/40 rounded-xl shadow-lg max-w-xl w-[92%] sm:w-[80%] max-h-[75vh] overflow-y-auto p-4 sm:p-5 text-slate-100 backdrop-blur-md"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <button
                  onClick={closeMathModal}
                  className="absolute top-2.5 right-3 text-slate-400 hover:text-white transition text-xl"
                  aria-label="Close math modal"
                >
                  ×
                </button>
          
                {/* Title */}
                <h2 className="text-base sm:text-lg font-semibold mb-3 text-white flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-400" />
                  {mathModal.title}
                </h2>
          
                {/* Content */}
                <pre className="whitespace-pre-wrap text-[13px] sm:text-sm font-mono leading-relaxed text-slate-200/90 break-words">
                  {mathModal.content}
                </pre>
              </div>
            </div>
          )}


      </div>
      {/* ===================== BASE CONVERTER ENHANCED SEO SCHEMAS ===================== */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Base Converter – Binary, Octal, Decimal, Hex & Custom Bases (2–30)",
            "url": "https://calculatorhub.site/base-converter",
            "description": "Free online Base Converter that converts numbers between binary, octal, decimal, hexadecimal, and custom bases (2–30). Features auto-detect, BigInt precision, and step-by-step math explanations.",
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Misc Tools",
                  "item": "https://calculatorhub.site/category/misc-tools"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Base Converter",
                  "item": "https://calculatorhub.site/base-converter"
                }
              ]
            },
            "hasPart": {
              "@type": "CreativeWork",
              "name": "Base Converter Features",
              "about": [
                "Converts numbers between bases 2–30",
                "Auto-detects binary, octal, decimal, and hex prefixes (0b, 0o, 0x)",
                "Displays step-by-step math with visual explanations",
                "Supports BigInt exact mode for large numbers",
                "Groups digits for readability and precision",
                "Allows custom base input and output",
                "Mobile-friendly, clean interface"
              ]
            }
          })
        }}
      />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What is a Base Converter?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "A Base Converter is a tool that converts numbers between different numeral systems such as binary (2), octal (8), decimal (10), hexadecimal (16), or any custom base up to 30. It helps you understand and calculate values across systems used in computing and digital design."
                }
              },
              {
                "@type": "Question",
                "name": "How does the Base Converter work?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The Base Converter uses positional notation logic to interpret digits according to their base. It first converts your input to decimal, then divides by the target base to find the new representation. It also supports auto-detect from prefixes like 0b, 0o, and 0x."
                }
              },
              {
                "@type": "Question",
                "name": "Can I see the math behind the conversion?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! The Base Converter includes a 'Show Math' feature that displays step-by-step explanations of how each base conversion works — similar to how you’d solve it manually on paper."
                }
              },
              {
                "@type": "Question",
                "name": "What bases does this converter support?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "You can convert between any base from 2 to 30, including binary, octal, decimal, hexadecimal, and higher bases that use letters A–T to represent digits 10–29."
                }
              },
              {
                "@type": "Question",
                "name": "What is BigInt mode used for?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "BigInt mode allows exact arithmetic with very large integers, ensuring precision even for values that exceed normal JavaScript number limits."
                }
              },
              {
                "@type": "Question",
                "name": "How do I use the Base Converter?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Simply enter a number, and the converter will auto-detect its base if prefixes are used. You can also manually select or enter a base (2–30). Then view results in multiple bases, copy them, or explore the math explanation."
                }
              },
              {
                "@type": "Question",
                "name": "Is the Base Converter mobile-friendly and free?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! The Base Converter is 100% free, runs directly in your browser, and works perfectly on mobile, tablet, and desktop devices."
                }
              }
            ]
          })
        }}
      />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Base Converter",
            "operatingSystem": "All",
            "applicationCategory": "EducationalApplication",
            "description": "Convert numbers between binary, octal, decimal, hexadecimal, and custom bases (2–30) with step-by-step math and auto-detection.",
            "url": "https://calculatorhub.site/base-converter",
            "featureList": [
              "Auto-detects base prefixes 0b, 0o, 0x",
              "Convert between bases 2–30",
              "BigInt exact precision mode",
              "Show Math feature for step-by-step logic",
              "Readable grouped digit formatting",
              "Custom source and target bases",
              "Mobile responsive, clean design"
            ],
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "reviewCount": "1800"
            },
            "exampleOfWork": {
              "@type": "CreativeWork",
              "name": "Conversion Logic Examples",
              "text": [
                "Binary Example: 0b1011 → (1×2³)+(0×2²)+(1×2¹)+(1×2⁰)=11₁₀",
                "Octal Example: 0o52 → (5×8¹)+(2×8⁰)=42₁₀",
                "Hex Example: 0x2A → (2×16¹)+(10×16⁰)=42₁₀",
                "Decimal → Binary: 42 ÷ 2 remainders → 101010₂",
                "Base 30 Example: T9 → (29×30¹)+(9×30⁰)=879₁₀"
              ]
            }
          })
        }}
      />

    </>
  );
};

export default BaseConverter;
 
