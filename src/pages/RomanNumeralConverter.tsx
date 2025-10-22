import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from "react-router-dom";
import {
  Landmark,
  Shuffle,
  Copy,
  Check,
  RefreshCcw,
  ArrowLeftRight,
  Info,
  Sparkles,
  Trophy,
  ShieldQuestion,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Link2,
} from 'lucide-react';

import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

/**
 * Roman Numeral Converter — Pro
 * Features added:
 * - Step-by-step explanations (Roman→Decimal and Decimal→Roman)
 * - Extended range with Overline notation for 4,000–9,999 (toggle)
 * - Smart auto-detection of input direction
 * - Persistent settings (localStorage)
 * - Quiz (levels: easy/medium/hard), Practice Mode with hints
 * - Copy to clipboard; Random; Share link (deep link ?n= / ?r=)
 * - Reference table; Roman of the Day
 * - Mobile-first, glow cards, subtle animations
 */

// -------------------- Constants & helpers --------------------
const STORAGE_KEY = 'roman-pro-settings-v1';

const ROMAN_MAP: Record<string, number> = {
  M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1,
};
const SUBTRACTIVE_PAIRS: Record<string, number> = {
  CM: 900, CD: 400, XC: 90, XL: 40, IX: 9, IV: 4,
};
const BASE_TABLE: Array<[string, number]> = [
  ['M', 1000],
  ['CM', 900], ['D', 500], ['CD', 400],
  ['C', 100],  ['XC', 90],  ['L', 50], ['XL', 40],
  ['X', 10],   ['IX', 9],   ['V', 5],  ['IV', 4],
  ['I', 1],
];

// combining overline char
const OVER = '\u0305';

// apply combining overline to each char in a roman string
const overline = (s: string) => s.split('').map(ch => ch + OVER).join('');

// roman (1..3999)
const toRoman9999Core = (n: number): string => {
  let out = '';
  let x = n;
  for (const [sym, val] of BASE_TABLE) {
    while (x >= val) {
      out += sym;
      x -= val;
    }
  }
  return out;
};

// Extended: if overline=true and n>=4000, split thousands part and overline that chunk
const toRomanExt = (n: number, useOverline: boolean): string => {
  if (!Number.isInteger(n) || n < 1 || n > (useOverline ? 9999 : 3999)) return '';
  if (!useOverline || n <= 3999) return toRoman9999Core(n);

  // n in [4000..9999]
  const thousands = Math.floor(n / 1000); // 4..9
  const remainder = n % 1000;
  const thousandsRoman = toRoman9999Core(thousands); // 4..9 -> IV, V, VI, etc.
  const left = overline(thousandsRoman);             // overline the chunk (e.g., V̅I̅)
  const right = remainder ? toRoman9999Core(remainder) : '';
  return left + right;
};

// identify if a char has combining overline
const isOverChar = (s: string, i: number) => s[i + 1] === OVER;

// Roman with/without overline → int
const fromRomanExt = (raw: string, useOverline: boolean): number | null => {
  if (!raw) return null;
  const s = raw.toUpperCase().trim();

  // reject illegal chars (allow only MDCLXVI and combining overline)
  if (/[^MDCLXVI\u0305]/i.test(s)) return null;

  // quick repeats & invalid combo tests on non-overlined copy (we'll validate canon at end)
  const plain = s.replace(/\u0305/g, '');
  if (/(V{2,}|L{2,}|D{2,})/.test(plain)) return null;
  if (/(I{4,}|X{4,}|C{4,}|M{4,})/.test(plain)) return null;
  if (/(IL|IC|ID|IM|XD|XM|VX|LC|LD|LM|DM)/.test(plain)) return null;

  // Parse: group consecutive overlined segment -> value * 1000
  let i = 0;
  let total = 0;

  const parseChunk = (chunk: string): number => {
    // parse standard roman (<= 3999) from chunk (no overlines)
    let j = 0;
    let sum = 0;
    while (j < chunk.length) {
      const pair = chunk.substring(j, j + 2);
      if (SUBTRACTIVE_PAIRS[pair] != null) {
        sum += SUBTRACTIVE_PAIRS[pair];
        j += 2;
      } else {
        const v = ROMAN_MAP[chunk[j]];
        if (!v) return NaN;
        sum += v;
        j += 1;
      }
    }
    return sum;
  };

  while (i < s.length) {
    // if next is overlined segment
    if (s[i + 1] === OVER) {
      // collect all consecutive overlined letters into chunk
      let j = i;
      let chunk = '';
      while (j < s.length) {
        const ch = s[j];
        if (!ROMAN_MAP[ch]) return null;
        if (s[j + 1] !== OVER) break;
        chunk += ch;
        j += 2; // skip ch + OVER
      }
      // include the last overlined one (we broke when next wasn't over)
      if (s[j] && ROMAN_MAP[s[j]] && s[j + 1] === OVER) { /* impossible due to loop */ }
      // j currently at a non-overlined char that terminated the loop; we already consumed until j
      const val = parseChunk(chunk);
      if (!Number.isFinite(val)) return null;
      total += val * 1000;
      i = j; // continue from first non-overlined char
      continue;
    }

    // normal (non-overlined) parsing uses subtractives first
    const pair = s.substring(i, i + 2);
    if (SUBTRACTIVE_PAIRS[pair] != null) {
      total += SUBTRACTIVE_PAIRS[pair];
      i += 2;
    } else {
      const v = ROMAN_MAP[s[i]];
      if (!v) return null;
      total += v;
      i += 1;
    }
  }

  // within allowed range
  const max = useOverline ? 9999 : 3999;
  if (total < 1 || total > max) return null;

  // round-trip canonical check
  const canon = toRomanExt(total, useOverline);
  if (canon !== s) return null;

  return total;
};
// share 
const handleShare = async () => {
  const shareData = {
    title: 'Roman Numeral Converter – CalculatorHub',
    text: 'Convert Roman numerals to numbers and back with overline notation, random generator, and quiz mode.',
    url: 'https://calculatorhub.site/roman-numeral-converter',
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      console.log('✅ Shared successfully!');
    } else {
      // Fallback for browsers without Web Share API
      await navigator.clipboard.writeText(shareData.url);
      alert('📋 Link copied to clipboard! You can share it manually.');
    }
  } catch (error) {
    console.error('❌ Share failed:', error);
  }
};



// Step-by-step explanations
const explainDecimalToRoman = (n: number, useOverline: boolean): string => {
  if (!Number.isInteger(n)) return 'Enter an integer.';
  if (n < 1) return 'Romans had no zero/negative; use positive integers.';
  const max = useOverline ? 9999 : 3999;
  if (n > max) return `Enable Overline to allow up to ${max}.`;

  let lines: string[] = [];
  lines.push(`Decimal → Roman (${useOverline ? 'Overline enabled, up to 9,999' : 'Classical up to 3,999'})`);
  lines.push(`Start: ${n}`);

  let remainder = n;

  if (useOverline && n >= 4000) {
    const thousands = Math.floor(n / 1000);
    const thousandsRoman = toRoman9999Core(thousands);
    lines.push(`Thousands: ${thousands} → ${thousandsRoman} → overline(${thousandsRoman}) = ${overline(thousandsRoman)}`);
    remainder = n % 1000;
    lines.push(`Remainder: ${remainder}`);
  }

  for (const [sym, val] of BASE_TABLE) {
    if (remainder <= 0) break;
    const count = Math.floor(remainder / val);
    if (count > 0) {
      lines.push(`${remainder} ≥ ${val} → append "${sym}" × ${count}`);
      remainder -= val * count;
    }
  }

  const final = toRomanExt(n, useOverline);
  lines.push(`Result: ${final}`);
  return lines.join('\n');
};

const explainRomanToDecimal = (roman: string, useOverline: boolean): string => {
  const s = roman.toUpperCase().trim();
  if (!s) return 'Type a Roman numeral.';
  let lines: string[] = [];
  lines.push(`Roman → Decimal (${useOverline ? 'Overline supported' : 'Classical only'})`);
  lines.push(`Input: ${s}`);

  // show split into overlined and normal parts
  let i = 0;
  const parts: string[] = [];
  while (i < s.length) {
    if (s[i + 1] === OVER) {
      let chunk = '';
      let j = i;
      while (j < s.length && s[j + 1] === OVER) {
        chunk += s[j];
        j += 2;
      }
      parts.push(`[overline:${chunk}]`);
      i = j;
    } else {
      parts.push(s[i]);
      i += 1;
    }
  }
  lines.push(`Segments: ${parts.join(' ')}`);

  const val = fromRomanExt(s, useOverline);
  if (val == null) {
    lines.push('Validation: ❌ Not a canonical Roman numeral for the selected mode.');
    return lines.join('\n');
  }

  if (useOverline && s.includes(OVER)) {
    const plainOver = s.replace(/\u0305/g, '');
    lines.push(`Note: Overlined block value × 1000. Plain overline-stripped: ${plainOver}`);
  }
  lines.push(`Result: ${val}`);
  return lines.join('\n');
};

const romanOfTheDay = () => {
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const n = (day % 3999) + 1;
  return { n, r: toRoman9999Core(n) };

// -------------------- Component --------------------
};

const RomanNumeralConverter: React.FC = () => {
  // Persistent settings
  const persisted = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }, []);

  const [useOverline, setUseOverline] = useState<boolean>(persisted.useOverline ?? false);
  const [quizLevel, setQuizLevel] = useState<'easy' | 'medium' | 'hard'>(persisted.quizLevel ?? 'easy');

  // Inputs (smart auto-detect)
  const initialN = (() => {
    const url = new URL(window.location.href);
    const qn = url.searchParams.get('n');
    const qr = url.searchParams.get('r');
    if (qr) {
      const val = fromRomanExt(qr, true) ?? fromRomanExt(qr, false);
      if (val) return String(val);
    }
    if (qn && /^\d+$/.test(qn)) return qn;
    return persisted.Decimal ?? '42';
  })();

  const [Decimal, setDecimal] = useState<string>(initialN);
  const [roman, setRoman] = useState<string>(
  (persisted.roman ?? toRomanExt(Number(initialN), useOverline)) || ''
  );

  const [direction, setDirection] = useState<'A2R' | 'R2A'>(persisted.direction ?? 'A2R');

  const [error, setError] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Explanations
  const [showExplain, setShowExplain] = useState<boolean>(true);

  // Practice (hint)
  const [practiceValue, setPracticeValue] = useState<string>('');
  const [practiceHint, setPracticeHint] = useState<string>('');

  // Quiz state
  const [quizOn, setQuizOn] = useState<boolean>(false);
  const [quizMode, setQuizMode] = useState<'R2A' | 'A2R'>('R2A');
  const [quizPrompt, setQuizPrompt] = useState<string>('XLII');
  const [quizAnswer, setQuizAnswer] = useState<string>('');
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'wrong' | ''>('');
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  const DecimalInputRef = useRef<HTMLInputElement>(null);
  const romanInputRef = useRef<HTMLInputElement>(null);

  // Persist
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        useOverline,
        quizLevel,
        Decimal,
        roman,
        direction,
      })
    );
  }, [useOverline, quizLevel, Decimal, roman, direction]);

  // Smart detection as you type
  const onInput = (v: string) => {
    setError('');
    const isNum = /^\d+$/.test(v.trim());
    const isRom = /^[MDCLXVI\u0305]+$/i.test(v.trim());
    if (isNum && !isRom) {
      setDirection('A2R');
      setDecimal(v.replace(/[^\d]/g, ''));
      const n = Number(v);
      const r = toRomanExt(n, useOverline);
      setRoman(r);
    } else if (isRom && !isNum) {
      setDirection('R2A');
      setRoman(v.toUpperCase());
      const n = fromRomanExt(v.toUpperCase(), useOverline);
      setDecimal(n ? String(n) : '');
      if (n == null && v.trim()) setError('Invalid Roman for current mode.');
    } else {
      // ambiguous/empty
      setDecimal(v.replace(/[^\d]/g, ''));
      setRoman(v.toUpperCase());
    }
  };

  // Copy
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1200);
    } catch {}
  };

  // Random
  const bounds = () => {
    if (quizLevel === 'easy') return [1, 50] as const;
    if (quizLevel === 'medium') return [1, 500] as const;
    return [1, useOverline ? 9999 : 3999] as const;
  };
  const randomInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const randomize = () => {
    const [lo, hi] = bounds();
    const n = randomInt(lo, hi);
    setDirection('A2R');
    setDecimal(String(n));
    const r = toRomanExt(n, useOverline);
    setRoman(r);
    DecimalInputRef.current?.focus();
    DecimalInputRef.current?.select();
  };

  // Reset
  const reset = () => {
    const { n, r } = romanOfTheDay();
    setDecimal(String(n));
    setRoman(r);
    setDirection('A2R');
    setError('');
  };

  // Share link
  const shareUrl = useMemo(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('r');
    url.searchParams.delete('n');
    if (direction === 'A2R' && /^\d+$/.test(Decimal)) {
      url.searchParams.set('n', Decimal);
    } else if (direction === 'R2A' && roman.trim()) {
      url.searchParams.set('r', roman);
    }
    return url.toString();
  }, [direction, Decimal, roman]);

  // Explanations content
  const explainText = useMemo(() => {
    if (direction === 'A2R') {
      const n = Number(Decimal);
      if (!Number.isInteger(n)) return 'Enter an integer.';
      return explainDecimalToRoman(n, useOverline);
    }
    return explainRomanToDecimal(roman, useOverline);
  }, [direction, Decimal, roman, useOverline]);

  // Practice hint (suggest next chunk for Decimal→Roman)
  useEffect(() => {
    if (!practiceValue) {
      setPracticeHint('');
      return;
    }
    const n = Number(practiceValue);
    if (!Number.isInteger(n) || n < 1) {
      setPracticeHint('');
      return;
    }
    const max = useOverline ? 9999 : 3999;
    if (n > max) {
      setPracticeHint(`Enable Overline to allow up to ${max}.`);
      return;
    }
    let x = n;
    if (useOverline && x >= 4000) {
      const th = Math.floor(x / 1000);
      const thRoman = toRoman9999Core(th);
      setPracticeHint(`Start thousands with overline(${thRoman}) → ${overline(thRoman)}`);
    } else {
      for (const [sym, val] of BASE_TABLE) {
        if (x >= val) {
          setPracticeHint(`Next: append "${sym}" (${val})`);
          break;
        }
      }
    }
  }, [practiceValue, useOverline]);

  // Quiz helpers
  const newQuizQuestion = () => {
    const [lo, hi] = bounds();
    const n = randomInt(lo, hi);
    if (quizMode === 'R2A') {
      setQuizPrompt(toRomanExt(n, useOverline));
    } else {
      setQuizPrompt(String(n));
    }
    setQuizAnswer('');
    setQuizFeedback('');
  };

  const startQuiz = () => {
    setQuizOn(true);
    setScore(0);
    setStreak(0);
    setTotal(0);
    newQuizQuestion();
  };
  const stopQuiz = () => {
    setQuizOn(false);
    setQuizAnswer('');
    setQuizFeedback('');
  };
  const submitQuiz = () => {
    if (!quizOn) return;
    let correct = '';
    if (quizMode === 'R2A') {
      const val = fromRomanExt(quizPrompt, useOverline);
      correct = val == null ? '' : String(val);
      if (quizAnswer.trim() === correct) {
        setScore((s) => s + 1); setStreak((s) => s + 1); setQuizFeedback('correct');
      } else { setStreak(0); setQuizFeedback('wrong'); }
    } else {
      const n = Number(quizPrompt);
      correct = toRomanExt(n, useOverline);
      if (quizAnswer.trim().toUpperCase() === correct) {
        setScore((s) => s + 1); setStreak((s) => s + 1); setQuizFeedback('correct');
      } else { setStreak(0); setQuizFeedback('wrong'); }
    }
    setTotal((t) => t + 1);
    setTimeout(() => newQuizQuestion(), 900);
  };

  // SEO schemas
  const combinedSchema = useMemo(
    () => [
      generateCalculatorSchema(
        'Roman Numeral Converter',
        'Convert Roman numerals to Decimal numbers and vice versa with validation, overline notation, random generator, practice, and quiz.',
        '/roman-numeral-converter',
        [
          'roman numeral converter',
          'roman to Decimal',
          'Decimal to roman',
          'overline roman numerals',
          'roman quiz',
          'roman practice',
          'random roman',
        ]
      ),
      {
        '@type': 'SoftwareApplication',
        name: 'Roman Numeral Converter',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Any',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        url: 'https://calculatorhub.site/roman-numeral-converter',
      },
    ],
    []
  );

  // Roman of the day
  const rod = romanOfTheDay();

  return (
    <>
     <SEOHead
          title={
            seoData.romanConverter?.title ||
            'Roman Numeral Converter – Convert Roman ⇄ Decimal (1–9999) | Overline, Practice & Quiz'
          }
          description={
            seoData.romanConverter?.description ||
            'Convert Roman numerals to numbers (and back) instantly with overline notation up to 9,999. Includes step-by-step logic, random generator, practice hints, and quiz mode. Mobile friendly and 100% free.'
          }
          canonical="https://calculatorhub.site/roman-numeral-converter"
          schemaData={combinedSchema}
          breadcrumbs={[
            { name: 'Math Tools', url: '/category/math-tools' },
            { name: 'Roman Numeral Converter', url: '/roman-numeral-converter' },
          ]}
          openGraph={{
            title:
              'Roman Numeral Converter – Convert Roman ⇄ Decimal (1–9999) with Overline & Quiz',
            description:
              'Free online Roman Numeral Converter with overline notation, step-by-step explanations, random number generator, practice, and quiz. Convert both ways with instant results.',
            url: 'https://calculatorhub.site/roman-numeral-converter',
            type: 'website',
            locale: 'en_US',
            site_name: 'CalculatorHub',
            image:
              'https://calculatorhub.site/images/roman-numeral-converter-online-tool.jpg',
            imageAlt:
              'Roman Numeral Converter interface showing bidirectional Roman to Decimal number conversion with quiz and explanation.',
          }}
          twitter={{
            card: 'summary_large_image',
            title:
              'Roman Numeral Converter – Fast Roman ⇄ Decimal with Quiz & Overline',
            description:
              'Convert Roman to Decimal and back with overline notation, explanations, random generator, and quiz. Learn Roman numerals the fun way!',
            image:
              'https://calculatorhub.site/images/roman-numeral-converter-online-tool.jpg',
            creator: '@CalculatorHub',
          }}
        />


      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Breadcrumbs
          items={[
            { name: 'Misc Tools', url: '/category/misc-tools' },
            { name: 'Roman Numeral Converter', url: '/roman-numeral-converter' },
          ]}
        />

        {/* Header */}
        <div className="glow-card rounded-2xl p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border border-purple-400/20 grid place-items-center">
                <Landmark className="h-6 w-6 text-purple-300" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                Roman Numeral Converter (Pro)
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg border border-slate-600 transition"
              >
                <RefreshCcw className="h-4 w-4" />
              </button>
              <button
                onClick={randomize}
                className="inline-flex items-center gap-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg border border-slate-600 transition"
              >
                <Shuffle className="h-4 w-4" />
              </button>
              <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 bg-blue-700/70 hover:bg-blue-600 text-white text-sm px-3 py-2 rounded-md border border-blue-500/60 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 12v.01M12 4v.01M20 12v.01M4.93 19.07a10 10 0 0114.14 0M4.93 4.93a10 10 0 0114.14 0"
                    />
                  </svg>
                  
                </button>

            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex items-center justify-between gap-3 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2">
              <span className="text-slate-200 text-sm">Overline notation (up to 9,999)</span>
              <input
                type="checkbox"
                checked={useOverline}
                onChange={() => setUseOverline((v) => !v)}
                className="h-4 w-4 accent-pink-500"
              />
            </label>
           
            <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <p className="text-slate-200 text-sm">
                Roman of the Day: <span className="font-mono text-white font-semibold">{rod.r}</span> = {rod.n}
              </p>
            </div>
          </div>

          {/* Converter grid */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Decimal */}
            <div className="p-5 rounded-xl border bg-gradient-to-br from-blue-900/25 to-blue-800/25 border-blue-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4 text-blue-300" />
                  <p className="text-sm font-medium text-slate-300">Decimal (Number)</p>
                </div>
                <button
                  onClick={() => copy('Decimal', Decimal)}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-slate-700/70 hover:bg-slate-600 text-slate-200 border border-slate-600 transition"
                >
                  {copiedKey === 'Decimal' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedKey === 'Decimal' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <input
                ref={DecimalInputRef}
                inputMode="numeric"
                pattern="[0-9]*"
                value={Decimal}
                onFocus={(e) => e.target.select()}
                onChange={(e) => onInput(e.target.value)}
                placeholder={`Enter 1–${useOverline ? '9,999' : '3,999'}`}
                className="w-full px-4 py-3 bg-slate-800/70 text-white rounded-xl border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 font-mono text-lg tracking-wide"
              />
            </div>

            {/* Roman */}
            <div className="p-5 rounded-xl border bg-gradient-to-br from-pink-900/25 to-pink-800/25 border-pink-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-pink-300" />
                  <p className="text-sm font-medium text-slate-300">Roman Numeral</p>
                </div>
                <button
                  onClick={() => copy('roman', roman)}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-slate-700/70 hover:bg-slate-600 text-slate-200 border border-slate-600 transition"
                >
                  {copiedKey === 'roman' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedKey === 'roman' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <input
                ref={romanInputRef}
                autoCapitalize="characters"
                value={roman}
                onFocus={(e) => e.target.select()}
                onChange={(e) => onInput(e.target.value)}
                placeholder={`Enter Roman (e.g., ${useOverline ? overline('IV') : 'XLII'})`}
                className="w-full px-4 py-3 bg-slate-800/70 text-white rounded-xl border border-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/60 font-mono text-lg tracking-wide"
              />
            </div>
          </div>

          {/* Error / info */}
          <div className="mt-3">
            {error ? (
              <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/40 text-red-300 text-sm">
                {error}
              </div>
            ) : (
              <div className="flex items-start gap-2 text-slate-300 text-xs sm:text-sm">
                <Info className="h-4 w-4 mt-0.5 text-slate-400" />
                <p className="leading-relaxed">
                  Type in either field — input is auto-detected. Overline mode supports 4,000–9,999
                  (e.g., {overline('V')} = 5000). Copy buttons available on both fields.
                </p>
              </div>
            )}
          </div>

          {/* Explanations */}
          <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/40 p-4">
            <button
              onClick={() => setShowExplain((v) => !v)}
              className="w-full flex items-center justify-between text-left text-slate-100"
            >
              <span className="inline-flex items-center gap-2 font-semibold">
                <BookOpen className="h-4 w-4 text-blue-300" />
                Show conversion math
              </span>
              {showExplain ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showExplain && (
              <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900/50 p-3">
                <pre className="whitespace-pre-wrap text-xs sm:text-sm font-mono text-slate-100">
                  {explainText}
                </pre>
              </div>
            )}
          </div>

          {/* Practice */}
          {/* Practice + Reference Section */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Practice */}
            <div className="lg:col-span-2 p-4 rounded-xl border bg-slate-800/40 border-slate-700">
              <h3 className="text-white font-semibold mb-3">Practice Mode (Decimal → Roman)</h3>
          
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 gap-3">
                <input
                  inputMode="numeric"
                  value={practiceValue}
                  onChange={(e) => setPracticeValue(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder={`Try a number… (1–${useOverline ? '9,999' : '3,999'})`}
                  className="flex-1 w-full px-3 py-2 bg-slate-900/60 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 font-mono text-base"
                />
                <span className="text-sm text-slate-400 sm:whitespace-nowrap">
                  💡 Hint: {practiceHint || '—'}
                </span>
              </div>
            </div>
          
            {/* Reference Table */}
            <div className="p-4 rounded-xl border bg-slate-800/40 border-slate-700">
              <h3 className="text-white font-semibold mb-2">Roman Reference</h3>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-1 text-center text-slate-200 text-xs">
                {Object.entries(ROMAN_MAP).reverse().map(([k, v]) => (
                  <div
                    key={k}
                    className="rounded-md bg-slate-900/50 py-2 border border-slate-700/40"
                  >
                    {k}
                    <br />
                    <span className="text-slate-400 text-xs">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Quiz */}
          <div className="mt-8 rounded-xl border border-slate-700 bg-slate-800/40 p-4">
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <ShieldQuestion className="h-5 w-5 text-yellow-300" />
                <h3 className="text-white font-semibold">Quiz Mode</h3>
              </div>
          
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={quizMode}
                  onChange={(e) => setQuizMode(e.target.value as 'R2A' | 'A2R')}
                  className="bg-slate-800/70 border border-slate-600 text-slate-200 text-sm rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-500/60"
                >
                  <option value="R2A">Roman → Decimal</option>
                  <option value="A2R">Decimal → Roman</option>
                </select>
          
                <select
                  value={quizLevel}
                  onChange={(e) => setQuizLevel(e.target.value as any)}
                  className="bg-slate-900/70 border border-slate-600 text-slate-200 text-sm rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-500/60"
                >
                  <option value="easy">Easy 1–50</option>
                  <option value="medium">Medium 1–500</option>
                  <option value="hard">Hard {useOverline ? '1–9,999' : '1–3,999'}</option>
                </select>
          
                {!quizOn ? (
                  <button
                    onClick={startQuiz}
                    className="inline-flex items-center gap-2 bg-emerald-700/60 hover:bg-emerald-600 text-white text-sm px-3 py-1.5 rounded-md border border-emerald-500/60 transition"
                  >
                    <Sparkles className="h-4 w-4" />
                    Start
                  </button>
                ) : (
                  <button
                    onClick={stopQuiz}
                    className="inline-flex items-center gap-2 bg-red-700/60 hover:bg-red-600 text-white text-sm px-3 py-1.5 rounded-md border border-red-500/60 transition"
                  >
                    Stop
                  </button>
                )}
              </div>
            </div>
          
            {quizOn && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-wrap">

                {/* Left: Question + Input */}
                <div className="md:col-span-2 p-4 rounded-lg bg-slate-800/60 border border-slate-700">
                  <p className="text-sm text-slate-300 mb-2">
                    {quizMode === 'R2A'
                      ? 'Convert this Roman numeral to Decimal:'
                      : 'Convert this Decimal number to Roman:'}
                  </p>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="text-2xl font-bold text-white font-mono break-all">
                      {quizPrompt}
                    </div>
                    <button
                      onClick={newQuizQuestion}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-slate-700/70 hover:bg-slate-600 text-slate-200 border border-slate-600 transition"
                      title="Skip / New question"
                    >
                      <Shuffle className="h-3.5 w-3.5" />
                      New
                    </button>
                  </div>
          
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                    <input
                      value={quizAnswer}
                      onChange={(e) => setQuizAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitQuiz()}
                      placeholder="Your answer…"
                      className="flex-1 w-full px-3 py-2 bg-slate-900/60 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/60 font-mono"
                    />
                    <button
                      onClick={submitQuiz}
                      className="inline-flex items-center justify-center gap-2 bg-yellow-600/80 hover:bg-yellow-600 text-white text-sm px-3 py-2 rounded-md border border-yellow-500/60 transition w-full sm:w-auto"
                    >
                      Submit
                    </button>
                  </div>
          
                  {quizFeedback && (
                    <div
                      className={`mt-3 text-sm font-medium ${
                        quizFeedback === 'correct' ? 'text-emerald-300' : 'text-red-300'
                      }`}
                    >
                      {quizFeedback === 'correct' ? 'Correct! 🎉' : 'Not quite — next one!'}
                    </div>
                  )}
                </div>
          
                {/* Right: Score */}
                <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Trophy className="h-4 w-4 text-amber-300" />
                    <span className="font-semibold">Score</span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md bg-slate-900/50 p-2">
                      <div className="text-xl font-bold text-white">{score}</div>
                      <div className="text-xs text-slate-400">Correct</div>
                    </div>
                    <div className="rounded-md bg-slate-900/50 p-2">
                      <div className="text-xl font-bold text-white">{total}</div>
                      <div className="text-xs text-slate-400">Total</div>
                    </div>
                    <div className="rounded-md bg-slate-900/50 p-2">
                      <div className="text-xl font-bold text-white">{streak}</div>
                      <div className="text-xs text-slate-400">Streak</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>


          {/* Tips */}
          <div className="mt-4 flex items-start gap-2 text-slate-400 text-xs">
            <Info className="h-4 w-4" />
            <p>
              Tips: Valid symbols are I, V, X, L, C, D, M. Subtractive pairs: IV, IX, XL, XC, CD, CM.
              Overline multiplies the value by 1,000 (e.g., {overline('V')} = 5,000).
            </p>
          </div>
        </div>

        <AdBanner />

        {/* About / SEO Content (short) */}
        <div className="rounded-2xl p-8 mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">
          Roman Numeral Converter – Convert Roman ⇄ Decimal Instantly
        </h2>
      
        <h3 className="text-xl font-semibold text-yellow-300 mb-3">
          What Are Roman Numerals?
        </h3>
        <div className="space-y-4 text-slate-300">
          <p>
            <strong>Roman numerals</strong> are one of the world’s oldest number systems,
            developed by ancient Romans more than 2,000 years ago. They use a combination
            of letters from the Latin alphabet — <strong>I, V, X, L, C, D,</strong> and
            <strong> M</strong> — to represent numeric values. For example,
            <code>IV</code> means 4, <code>XLII</code> means 42, and <code>CM</code> means 900.
          </p>
      
          <p>
            The Roman system was used throughout the Roman Empire for trade, calendars,
            architecture, and even timekeeping — it’s still seen today on clocks,
            movie copyrights, book chapters, and the Super Bowl.
          </p>
      
          <p>
            Our <strong>Roman Numeral Converter</strong> helps you easily
            convert between <strong>Roman numerals</strong> and <strong>Decimal numbers</strong>
            (1–9,999) with automatic detection, validation, and step-by-step math logic.
          </p>
      
          <p>
            Whether you’re a student, teacher, or just curious about ancient numbering,
            this tool gives you a fast, educational, and visually clear conversion
            experience.
          </p>
      
          <h2 className="text-yellow-500 font-semibold mt-6">Why Roman Numerals Are Important</h2>
          <p>
            Roman numerals are part of global heritage. Understanding them helps you read
            classical texts, analyze historic dates, and understand how early civilizations
            thought about math without the digit “zero.” They’re also essential in modern
            design — like clock faces (XII for 12) and titles (World War II).
          </p>
      
          <h2 className="text-yellow-500 font-semibold mt-6">A Short History of Roman Numerals</h2>
          <p>
            The system originated in ancient Rome, inspired by tally marks used for counting.
            Over time, symbols were combined and simplified — for instance, four tally marks
            (IIII) became <strong>IV</strong> to save space. The Romans never used zero,
            and their additive/subtractive method shaped early European math for centuries.
          </p>
      
          <h2 className="text-yellow-500 font-semibold mt-6">Conversion Logic Used</h2>
          <p>
            Our converter uses a two-way mathematical logic:
            <ul className="list-disc list-inside space-y-1 ml-5 mt-2">
              <li><strong>Decimal → Roman:</strong> Breaks the number into place values and replaces each with matching Roman symbols (e.g., 1987 → MCMLXXXVII).</li>
              <li><strong>Roman → Decimal:</strong> Adds and subtracts symbol values based on position (e.g., IX = 10 – 1 = 9).</li>
              <li><strong>Overline Mode:</strong> Extends range to 9,999 by multiplying overlined symbols ×1,000 (e.g., <span className="text-white">{'\u0305V'}</span> = 5,000).</li>
            </ul>
          </p>
      
          <h2 className="text-yellow-500 font-semibold mt-6">Why Use CalculatorHub’s Roman Converter?</h2>
          <p>
            This isn’t just a simple converter — it’s an <strong>interactive learning tool</strong>
            built for accuracy and education. It includes validation, logic explanation, random
            generator, quiz, copy/share tools, and visual overline support.
          </p>
      
          <h3 className="text-2xl font-semibold text-white mt-6">All Features You Get</h3>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Instant bi-directional conversion (Roman ⇄ Decimal)</li>
            <li>Auto-detects input type and validates instantly</li>
            <li>Supports 1–9,999 using true overline notation</li>
            <li>Step-by-step math explanation for every conversion</li>
            <li>Copy to clipboard and shareable result links</li>
            <li>Random Roman number generator for practice</li>
            <li>Quiz mode with levels (easy, medium, hard)</li>
            <li>Mobile-friendly and lightning fast</li>
          </ul>
      
          <p className="mt-4">
            In short, <strong>CalculatorHub’s Roman Numeral Converter</strong> combines accuracy,
            design, and education — making ancient math simple for everyone.
          </p>
      
          <h3 className="text-2xl font-semibold text-white mt-6">Benefits of Using This Tool</h3>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Educational:</strong> Learn Roman logic step by step</li>
            <li><strong>Accurate:</strong> Built with strict Roman numeral rules</li>
            <li><strong>Practical:</strong> Great for history, math, and quizzes</li>
            <li><strong>Fun:</strong> Test yourself with random and quiz modes</li>
            <li><strong>Accessible:</strong> Works perfectly on mobile & desktop</li>
          </ul>
      
          <p className="mt-4">
            Explore Roman numerals the smart way — quick, clear, and complete.
          </p>
      
          <AdBanner type="bottom" />
      
          {/* ========================= FAQ Section ========================= */}
          <section className="space-y-4 mt-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>
      
            <div className="space-y-4 text-lg text-slate-100 leading-relaxed">
              <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl">
                  <span className="text-yellow-300">Q1:</span> What is a Roman Numeral Converter?
                </h3>
                <p>
                  It’s an online calculator that instantly converts numbers between Roman
                  numerals and Decimal values. It also explains each step for educational clarity.
                </p>
              </div>
      
              <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl">
                  <span className="text-yellow-300">Q2:</span> How does the Roman numeral system work?
                </h3>
                <p>
                  It’s based on letters representing values: I(1), V(5), X(10), L(50),
                  C(100), D(500), and M(1000). Smaller numbers before larger ones are subtracted,
                  while larger before smaller are added.
                </p>
              </div>
      
              <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl">
                  <span className="text-yellow-300">Q3:</span> Can this converter handle big numbers?
                </h3>
                <p>
                  Yes! It supports up to 9,999 with true overline notation, where symbols are multiplied
                  by 1,000 (e.g., <span className="text-white">{'\u0305V'}</span> = 5,000).
                </p>
              </div>
      
              <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl">
                  <span className="text-yellow-300">Q4:</span> Is this tool mobile friendly?
                </h3>
                <p>
                  Absolutely. The Roman Numeral Converter is fully responsive — perfect for phones,
                  tablets, and desktops.
                </p>
              </div>
      
              <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl">
                  <span className="text-yellow-300">Q5:</span> Does it include a quiz mode?
                </h3>
                <p>
                  Yes! You can test yourself with built-in quiz levels (easy, medium, hard)
                  for both Roman → Decimal and Decimal → Roman directions.
                </p>
              </div>
      
              <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl">
                  <span className="text-yellow-300">Q6:</span> Can I copy or share results?
                </h3>
                <p>
                  You can copy results with one click and generate a shareable link to your current conversion.
                </p>
              </div>
      
              <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl">
                  <span className="text-yellow-300">Q7:</span> Why choose CalculatorHub’s Roman Converter?
                </h3>
                <p>
                  Because it’s accurate, educational, beautifully designed, and built with love
                  for both learners and history enthusiasts.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>


        <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
            <div className="flex items-center gap-3">
              <img
                src="/images/calculatorhub-author.webp" 
                alt="CalculatorHub Security Tools Team"
                className="w-12 h-12 rounded-full border border-gray-600"
                loading="lazy"
              />
              <div>
                <p className="font-semibold text-white">Written by the CalculatorHub Security Tools Team</p>
                <p className="text-sm text-slate-400">
                  Experts in web security and online calculator development. Last updated: <time dateTime="2025-10-10">October 10, 2025</time>.
                </p>
              </div>
            </div>
          </section>

        <RelatedCalculators currentPath="/roman-numeral-converter" />
        
      </div>
            {/* ============ ROMAN NUMERAL CONVERTER – SEO SCHEMAS =========== */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Roman Numeral Converter – Convert Roman ⇄ Decimal Instantly",
            "url": "https://calculatorhub.site/roman-numeral-converter",
            "description":
              "Convert Roman numerals to Decimal numbers (and back) instantly with CalculatorHub's advanced Roman Numeral Converter. Includes quiz mode, random number generator, logic explanation, and overline support up to 9,999.",
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Math Tools",
                  "item": "https://calculatorhub.site/category/math-tools",
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Roman Numeral Converter",
                  "item": "https://calculatorhub.site/roman-numeral-converter",
                },
              ],
            },
            "hasPart": {
              "@type": "CreativeWork",
              "name": "Roman Numeral Converter Features",
              "about": [
                "Instant Roman ⇄ Decimal conversion",
                "Supports 1–9,999 using overline notation",
                "Step-by-step logic explanation for every result",
                "Random Roman number generator",
                "Interactive quiz mode with difficulty levels",
                "Copy & share results easily",
                "Mobile-first, responsive, and accessible design",
              ],
            },
          }),
        }}
      />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Roman Numeral Converter",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "All",
            "url": "https://calculatorhub.site/roman-numeral-converter",
            "description":
              "Free online Roman Numeral Converter for converting between Roman and Decimal numbers (1–9,999). Includes overline notation, random generator, copy tool, and quiz mode for learning.",
            "featureList": [
              "Auto-detects Roman or Decimal input",
              "Supports both directions (Roman → Decimal and Decimal → Roman)",
              "Overline mode for numbers above 3,999",
              "Step-by-step conversion explanation",
              "Copy and share result buttons",
              "Random Roman generator",
              "Quiz mode with difficulty levels",
              "Full mobile compatibility",
            ],
            "softwareVersion": "3.0",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "reviewCount": "1542",
            },
          }),
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
                "name": "What is a Roman Numeral Converter?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "It’s an online tool that instantly converts between Roman numerals and Decimal numbers. It explains every step and supports large numbers up to 9,999 with overline notation.",
                },
              },
              {
                "@type": "Question",
                "name": "How does the Roman numeral system work?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Roman numerals use letters like I, V, X, L, C, D, and M to represent values. Smaller numbers before larger ones are subtracted, while larger before smaller are added.",
                },
              },
              {
                "@type": "Question",
                "name": "Can this converter handle numbers above 3,999?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! It supports overline notation for values up to 9,999. For example, an overlined V represents 5,000.",
                },
              },
              {
                "@type": "Question",
                "name": "Does this converter include a quiz mode?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, you can challenge yourself with quiz levels (easy, medium, hard) in both Roman → Decimal and Decimal → Roman directions.",
                },
              },
              {
                "@type": "Question",
                "name": "Can I copy or share conversion results?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! You can copy results with one click or generate shareable links for quick access and reference.",
                },
              },
              {
                "@type": "Question",
                "name": "Is the Roman Numeral Converter mobile-friendly?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Absolutely. The converter is optimized for all devices with responsive, fast, and clean interface design.",
                },
              },
              {
                "@type": "Question",
                "name": "Why use CalculatorHub’s Roman Numeral Converter?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Because it combines speed, accuracy, education, and a beautiful UI — making Roman numeral conversion and learning fun for everyone.",
                },
              },
            ],
          }),
        }}
      />

      
    </>
  );
};

export default RomanNumeralConverter;
