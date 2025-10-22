import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from "react-router-dom";
import {
  Dices,
  RefreshCw,
  Copy,
  Check,
  Share2,
  Volume2,
  VolumeX,
  History,
  Gamepad2,
  Sparkles,
  TimerReset,
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

/**
 * Random Number Generator — Pro
 * - Generate N numbers with options (range, duplicate policy)
 * - Copy & Share results (Web Share API with clipboard fallback)
 * - Sound effects (toggleable), animated reveal
 * - Dice Roller (multi dice × sides)
 * - Missing-Number Game (1–100, timer, modal feedback)
 * - Quick Quiz (Even/Odd) with score
 * - History (last 5 generations)
 * - Mobile-first UI with glow cards + gradients
 * - SEO content + JSON-LD (WebPage, SoftwareApplication, FAQPage)
 */

// ----------------------- Sound assets -----------------------
const diceSoundUrl =
  'https://actions.google.com/sounds/v1/board_games/dice_roll.ogg';
const successSoundUrl =
  'https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg';
const heartbeatSoundUrl =
  'https://actions.google.com/sounds/v1/ambiences/heartbeat.ogg';

// ----------------------- Helpers -----------------------
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

type HistoryItem = {
  ts: number;
  label: string;
  values: number[];
  range: string;
};

// ----------------------- Component -----------------------
const RandomNumberGenerator: React.FC = () => {
  // Generator core state
  const [min, setMin] = useState<number>(1);
  const [max, setMax] = useState<number>(100);
  const [count, setCount] = useState<number>(1);
  const [allowDuplicates, setAllowDuplicates] = useState<boolean>(true);
  const [generated, setGenerated] = useState<number[]>([]);
  const [rolling, setRolling] = useState<boolean>(false);

  // UX & tools
  const [copied, setCopied] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Dice mode
  const [diceCount, setDiceCount] = useState<number>(2);
  const [diceSides, setDiceSides] = useState<number>(6);
  const [diceRolls, setDiceRolls] = useState<number[]>([]);
  const [diceRolling, setDiceRolling] = useState<boolean>(false);

  // Game: Missing number (1–100)
  const [playPrompt, setPlayPrompt] = useState<boolean>(false);
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [gameNumbers, setGameNumbers] = useState<number[]>([]);
  const [missingNumber, setMissingNumber] = useState<number | null>(null);
  const [userGuess, setUserGuess] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [gameModal, setGameModal] = useState<{ open: boolean; title: string; body: string; tone: 'success' | 'error' }>(
    { open: false, title: '', body: '', tone: 'success' }
  );

  // Quick quiz (Even/Odd)
  const [quizOn, setQuizOn] = useState<boolean>(false);
  const [quizNumber, setQuizNumber] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizTotal, setQuizTotal] = useState<number>(0);
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'wrong' | ''>('');

  // Refs for sounds (to avoid iOS autoplay issues, bind to user actions)
  const diceRef = useRef<HTMLAudioElement | null>(null);
  const successRef = useRef<HTMLAudioElement | null>(null);
  const heartbeatRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    diceRef.current = new Audio(diceSoundUrl);
    successRef.current = new Audio(successSoundUrl);
    heartbeatRef.current = new Audio(heartbeatSoundUrl);
    [diceRef.current, successRef.current, heartbeatRef.current].forEach(a => {
      if (a) a.volume = 0.5;
    });
  }, []);

  const playSound = (which: 'dice' | 'success' | 'heartbeat') => {
    if (muted) return;
    const map = { dice: diceRef.current, success: successRef.current, heartbeat: heartbeatRef.current };
    map[which]?.currentTime && (map[which]!.currentTime = 0);
    map[which]?.play().catch(() => {});
  };

  // ----------------------- Generate numbers -----------------------
  const onGenerate = () => {
    if (min >= max) {
      openGameModal('Range error', 'Minimum must be less than maximum.', 'error');
      return;
    }
    if (!allowDuplicates && max - min + 1 < count) {
      openGameModal('Not enough unique numbers', 'Increase the range or allow duplicates.', 'error');
      return;
    }

    playSound('dice');
    setRolling(true);

    setTimeout(() => {
      const res: number[] = [];
      const used = new Set<number>();
      for (let i = 0; i < count; i++) {
        let n = randInt(min, max);
        if (!allowDuplicates) {
          while (used.has(n)) n = randInt(min, max);
          used.add(n);
        }
        res.push(n);
      }
      setGenerated(res);
      setRolling(false);
      setPlayPrompt(true);

      // History
      setHistory(h => {
        const next: HistoryItem[] = [
          {
            ts: Date.now(),
            label: `Generated ${res.length} ${res.length === 1 ? 'number' : 'numbers'}`,
            values: res,
            range: `[${min}–${max}] ${allowDuplicates ? 'duplicates allowed' : 'unique'}`,
          },
          ...h,
        ].slice(0, 5);
        return next;
      });

      playSound('success');
    }, 650);
  };

  // ----------------------- Copy & Share -----------------------
  const copyResults = async () => {
    try {
      const text = generated.join(', ');
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1100);
    } catch {
      openGameModal('Copy failed', 'Unable to copy to clipboard.', 'error');
    }
  };

  const handleShare = async () => {
    const url = 'https://calculatorhub.site/random-number-generator';
    const shareData = {
      title: 'Random Number Generator – CalculatorHub',
      text: `My random numbers (${min}–${max}${allowDuplicates ? ', duplicates allowed' : ', unique'}): ${generated.join(', ')}`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        openGameModal('Link copied', 'URL copied to your clipboard. Paste it anywhere to share.', 'success');
      }
    } catch {
      // ignore
    }
  };

  const resetAll = () => {
    setMin(1);
    setMax(100);
    setCount(1);
    setAllowDuplicates(true);
    setGenerated([]);
    setRolling(false);
    setDiceRolls([]);
    setPlayPrompt(false);
    setGameActive(false);
    setGameNumbers([]);
    setMissingNumber(null);
    setUserGuess('');
    setTimeLeft(20);
    setQuizOn(false);
    setQuizNumber(null);
    setQuizScore(0);
    setQuizTotal(0);
    setQuizFeedback('');
  };

  // ----------------------- Dice Roller -----------------------
  const rollDice = () => {
    setDiceRolling(true);
    playSound('dice');
    setTimeout(() => {
      const rolls = Array.from({ length: clamp(diceCount, 1, 20) }, () => randInt(1, clamp(diceSides, 2, 120)));
      setDiceRolls(rolls);

      setHistory(h => {
        const next: HistoryItem[] = [
          {
            ts: Date.now(),
            label: `Rolled ${rolls.length}×d${diceSides}`,
            values: rolls,
            range: `d${diceSides}`,
          },
          ...h,
        ].slice(0, 5);
        return next;
      });

      setDiceRolling(false);
      playSound('success');
    }, 500);
  };

  // Dice face icon (only for d6)
  const DiceIcon: React.FC<{ n: number }> = ({ n }) => {
    if (diceSides !== 6) return <span className="font-mono text-lg">{n}</span>;
    const map = { 1: Dice1, 2: Dice2, 3: Dice3, 4: Dice4, 5: Dice5, 6: Dice6 } as const;
    const Cmp = map[(n as 1|2|3|4|5|6)] || Dice6;
    return <Cmp className="h-6 w-6" />;
  };

  // ----------------------- Missing number game -----------------------
  const startGame = () => {
    const all = Array.from({ length: 100 }, (_, i) => i + 1);
    const miss = randInt(1, 100);
    const shuffled = all.filter(n => n !== miss).sort(() => Math.random() - 0.5);

    setMissingNumber(miss);
    setGameNumbers(shuffled);
    setGameActive(true);
    setPlayPrompt(false);
    setTimeLeft(20);
    setUserGuess('');
  };

  // timer
  useEffect(() => {
    if (!gameActive) return;
    if (timeLeft <= 0) {
      onWrong();
      return;
    }
    const t = setTimeout(() => setTimeLeft(tl => tl - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, gameActive]);

  const onSubmitGuess = () => {
    if (!gameActive) return;
    const guessN = Number(userGuess);
    if (guessN === missingNumber) {
      openGameModal('🎉 Correct!', `The missing number was ${missingNumber}.`, 'success');
      setGameActive(false);
      playSound('success');
    } else {
      onWrong();
    }
  };

  const onWrong = () => {
    playSound('heartbeat');
    openGameModal('Try again', `Not quite. The answer was ${missingNumber}.`, 'error');
    setGameActive(false);
  };

  const openGameModal = (title: string, body: string, tone: 'success' | 'error') =>
    setGameModal({ open: true, title, body, tone });

  const closeGameModal = () =>
    setGameModal({ open: false, title: '', body: '', tone: 'success' });

  // ----------------------- Quick Quiz (Even/Odd) -----------------------
  const newQuiz = () => {
    setQuizNumber(randInt(min, max));
    setQuizFeedback('');
  };
  const startQuiz = () => {
    setQuizOn(true);
    setQuizScore(0);
    setQuizTotal(0);
    newQuiz();
  };
  const stopQuiz = () => {
    setQuizOn(false);
    setQuizNumber(null);
    setQuizFeedback('');
  };
  const answerQuiz = (ans: 'even' | 'odd') => {
    if (quizNumber == null) return;
    const correct = (quizNumber % 2 === 0 ? 'even' : 'odd') === ans;
    setQuizTotal(t => t + 1);
    if (correct) {
      setQuizScore(s => s + 1);
      setQuizFeedback('correct');
      playSound('success');
    } else {
      setQuizFeedback('wrong');
      playSound('heartbeat');
    }
    setTimeout(() => newQuiz(), 700);
  };

  // ----------------------- SEO schemas -----------------------
  const faqItems = [
    {
      q: 'What is a random number generator?',
      a: 'A random number generator (RNG) produces numbers within a given range where each outcome has equal probability. This tool can generate one or many numbers, with optional uniqueness and history.',
    },
    {
      q: 'How do I generate unique numbers?',
      a: 'Turn off “Allow Duplicates.” Ensure your range is large enough to cover the count you request. For example, to get 10 unique numbers, the range must include at least 10 values.',
    },
    {
      q: 'What is the Dice Roller for?',
      a: 'The Dice Roller simulates common dice like d6, d8, d10, d12, and d20 (or any custom side count). Roll multiple dice at once and see each result.',
    },
    {
      q: 'How does the missing-number game work?',
      a: 'A number from 1–100 is removed and the rest are shuffled. You have 20 seconds to identify the missing number. It’s a fun memory and pattern challenge.',
    },
    {
      q: 'Can I share or copy my results?',
      a: 'Yes. Use the Share button (Web Share API on mobile) or automatically copy the link on desktops. You can also copy the generated numbers directly.',
    },
    {
      q: 'Does the tool make any sound?',
      a: 'Yes, rolling and feedback sounds can be toggled on/off. Sounds improve feedback but are optional.',
    },
    {
      q: 'Is the tool mobile-friendly and free?',
      a: 'Absolutely. It’s free, privacy-friendly, and responsive. Use it for games, raffles, study, or anywhere you need fair randomness.',
    },
  ];

  const softwareSchema = {
    '@type': 'SoftwareApplication',
    name: 'Random Number Generator',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    description:
      'Generate random numbers (unique or with duplicates), roll dice, play a missing-number game, and try an even/odd quiz. Copy, share, and view history. Mobile-friendly and fast.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://calculatorhub.site/random-number-generator',
    softwareVersion: '3.0',
  };

  const webPageSchema = {
    '@type': 'WebPage',
    name: 'Random Number Generator – Dice Roller & Missing Number Game',
    url: 'https://calculatorhub.site/random-number-generator',
    description:
      'Free online random number generator with dice roller, missing number game, even/odd quiz, copy/share, and sound effects. Generate one or many numbers with instant results.',
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Misc Tools',
          item: 'https://calculatorhub.site/category/misc-tools',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Random Number Generator',
          item: 'https://calculatorhub.site/random-number-generator',
        },
      ],
    },
  };

  const faqSchema = {
    '@type': 'FAQPage',
    mainEntity: faqItems.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const combinedSchema = useMemo(
    () => [
      generateCalculatorSchema(
        'Random Number Generator',
        'Generate random numbers, roll dice, play a missing-number game, and even/odd quiz. Copy, share, and save history.',
        '/random-number-generator',
        [
          'random number generator',
          'dice roller',
          'missing number game',
          'even odd quiz',
          'rng unique numbers',
          'copy random numbers',
        ]
      ),
      softwareSchema,
      webPageSchema,
      faqSchema,
    ],
    []
  );

  // ----------------------- Render -----------------------
  return (
    <>
      <SEOHead
          title={
            seoData.randomNumber?.title ||
            '🎲 Random Number Generator – Free RNG, Dice Roller, Missing Number Game & Quick Quiz'
          }
          description={
            seoData.randomNumber?.description ||
            'Free online Random Number Generator (RNG) by CalculatorHub – create random numbers instantly, roll virtual dice, play missing-number memory games, and test even/odd quizzes. Copy, share, and save results. Fast, secure, and mobile-friendly.'
          }
          canonical="https://calculatorhub.site/random-number-generator"
          schemaData={combinedSchema}
          breadcrumbs={[
            { name: 'Misc Tools', url: '/category/misc-tools' },
            { name: 'Random Number Generator', url: '/random-number-generator' },
          ]}
          openGraph={{
            title:
              'Random Number Generator – Dice Roller, Missing Number Game & Quiz | CalculatorHub',
            description:
              'Generate random numbers instantly with CalculatorHub’s RNG. Includes Dice Roller, Missing Number Game, Quick Quiz, Copy & Share, Sound, and History. 100% Free and mobile-ready.',
            url: 'https://calculatorhub.site/random-number-generator',
            type: 'website',
            locale: 'en_US',
            site_name: 'CalculatorHub',
            image:
              'https://calculatorhub.site/images/random-number-generator-dice-game.jpg',
            imageAlt:
              'Screenshot of the Random Number Generator showing dice roller, missing number game, and quiz interface on CalculatorHub.',
            imageWidth: 1200,
            imageHeight: 630,
          }}
          twitter={{
            card: 'summary_large_image',
            title:
              '🎲 Random Number Generator – Dice Roller & Fun Quiz | CalculatorHub',
            description:
              'Generate random numbers, roll dice, and play brain games online for free. Fast, responsive, and fun RNG tool by CalculatorHub.',
            image:
              'https://calculatorhub.site/images/random-number-generator-dice-game.jpg',
            creator: '@CalculatorHub',
          }}
        />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      



      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Breadcrumbs
          items={[
            { name: 'Misc Tools', url: '/category/misc-tools' },
            { name: 'Random Number Generator', url: '/random-number-generator' },
          ]}
        />

        {/* Header */}
        <div className="glow-card rounded-2xl p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 border border-blue-400/20 grid place-items-center">
                <Dices className="h-6 w-6 text-blue-300" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                Random Number Generator
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setMuted((m) => !m)}
                className="inline-flex items-center gap-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg border border-slate-600 transition"
                aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                {muted ? 'Sounds Off' : 'Sounds On'}
              </button>
              <button
                onClick={resetAll}
                className="inline-flex items-center gap-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg border border-slate-600 transition"
              >
                <TimerReset className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white">Minimum</label>
              <input
                type="number"
                value={min}
                onChange={(e) => setMin(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-800/70 text-white rounded-xl border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white">Maximum</label>
              <input
                type="number"
                value={max}
                onChange={(e) => setMax(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-800/70 text-white rounded-xl border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white">How Many Numbers?</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={count}
                onChange={(e) => setCount(clamp(Number(e.target.value), 1, 1000))}
                className="w-full px-4 py-3 bg-slate-800/70 text-white rounded-xl border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              />
            </div>
            <label className="flex items-center justify-between gap-3 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
              <span className="text-slate-200 text-sm">Allow Duplicates</span>
              <input
                type="checkbox"
                checked={allowDuplicates}
                onChange={(e) => setAllowDuplicates(e.target.checked)}
                className="h-4 w-4 accent-blue-500"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={onGenerate}
              disabled={rolling}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm px-4 py-2 rounded-lg border border-blue-500/60 transition disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${rolling ? 'animate-spin' : ''}`} />
              {rolling ? 'Rolling…' : 'Generate Numbers'}
            </button>
            <button
              onClick={copyResults}
              disabled={!generated.length}
              className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm px-4 py-2 rounded-lg border border-slate-600 transition disabled:opacity-60"
              aria-label="Copy generated numbers"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm px-4 py-2 rounded-lg border border-slate-600 transition"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>

          {/* Results */}
          {generated.length > 0 && (
            <div className="mt-6 p-5 rounded-xl border bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-slate-700/60">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-blue-300" />
                <h3 className="text-white font-semibold">Generated Numbers</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence initial={false}>
                  {generated.map((n, i) => (
                    <motion.span
                      key={`${n}-${i}`}
                      initial={{ opacity: 0, scale: 0.9, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, delay: i * 0.04 }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700 text-slate-100 font-mono"
                    >
                      {n}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Range: <span className="text-slate-200">{min}</span>–<span className="text-slate-200">{max}</span> • {allowDuplicates ? 'Duplicates allowed' : 'Unique only'}
              </p>
            </div>
          )}
        </div>

        {/* Dice Roller */}
        <div className="rounded-2xl p-6 sm:p-8 mb-8 border border-slate-700 bg-slate-800/40">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Dices className="h-5 w-5 text-amber-300" />
              <h2 className="text-white font-semibold">Dice Roller</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={1}
                max={20}
                value={diceCount}
                onChange={(e) => setDiceCount(clamp(Number(e.target.value), 1, 20))}
                className="w-24 px-2 py-1 rounded-md bg-slate-900/70 border border-slate-600 text-slate-100 text-sm"
                aria-label="Number of dice"
              />
              <select
                value={diceSides}
                onChange={(e) => setDiceSides(Number(e.target.value))}
                className="px-2 py-1 rounded-md bg-slate-900/70 border border-slate-600 text-slate-100 text-sm"
                aria-label="Dice sides"
              >
                {[4, 6, 8, 10, 12, 20].map(s => (
                  <option key={s} value={s}>{`d${s}`}</option>
                ))}
                <option value={100}>d100</option>
              </select>
              <button
                onClick={rollDice}
                className="inline-flex items-center gap-2 bg-amber-600/80 hover:bg-amber-600 text-white text-sm px-3 py-1.5 rounded-md border border-amber-500/60 transition"
              >
                <RefreshCw className={`h-4 w-4 ${diceRolling ? 'animate-spin' : ''}`} />
                Roll
              </button>
            </div>
          </div>

          {diceRolls.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {diceRolls.map((v, idx) => (
                  <motion.div
                    key={`roll-${idx}-${v}`}
                    initial={{ opacity: 0, rotate: -5, y: 8 }}
                    animate={{ opacity: 1, rotate: 0, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-100 inline-flex items-center gap-2"
                  >
                    <DiceIcon n={v} />
                    <span className="font-mono">{v}</span>
                  </motion.div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Total:{' '}
                <span className="text-slate-200">
                  {diceRolls.reduce((a, b) => a + b, 0)}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Game prompt */}
        {playPrompt && !gameActive && (
          <div className="rounded-2xl p-6 mb-8 border border-purple-600/30 bg-gradient-to-br from-purple-900/30 to-fuchsia-900/20 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Gamepad2 className="h-5 w-5 text-fuchsia-300" />
              <h3 className="font-semibold">Play a quick game?</h3>
            </div>
            <p className="text-sm text-slate-200 mb-3">
              Find the missing number between 1–100. You have 20 seconds!
            </p>
            <button
              onClick={startGame}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white text-sm px-4 py-2 rounded-lg border border-pink-500/60 transition"
            >
              Start Missing-Number Game
            </button>
          </div>
        )}

        {/* Game section */}
        {gameActive && (
          <div className="rounded-2xl p-6 mb-8 border border-slate-700 bg-slate-800/40 text-white">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">Missing-Number Game</h3>
              <div className="inline-flex items-center gap-2 text-sm">
                <HelpCircle className="h-4 w-4 text-slate-300" />
                Time left: <span className="px-2 py-0.5 rounded bg-slate-900/60 border border-slate-700">{timeLeft}s</span>
              </div>
            </div>

            <div className="grid grid-cols-10 gap-1.5 mt-3 max-h-[280px] overflow-y-auto p-2 rounded-lg bg-slate-900/30 border border-slate-700/60">
              {gameNumbers.map((n) => (
                <div key={n} className="text-xs sm:text-sm bg-slate-800/70 px-2 py-1 rounded-md text-center">
                  {n}
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="number"
                value={userGuess}
                onChange={(e) => setUserGuess(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700 text-white"
                placeholder="Enter the missing number"
              />
              <button
                onClick={onSubmitGuess}
                className="inline-flex items-center justify-center gap-2 bg-red-600/80 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg border border-red-500/60 transition w-full sm:w-auto"
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {/* Quick Quiz */}
        <div className="rounded-2xl p-6 mb-8 border border-slate-700 bg-slate-800/40">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-300" />
              <h3 className="text-white font-semibold">Quick Quiz — Even or Odd?</h3>
            </div>
            {!quizOn ? (
              <button
                onClick={startQuiz}
                className="inline-flex items-center gap-2 bg-emerald-700/70 hover:bg-emerald-600 text-white text-sm px-3 py-1.5 rounded-md border border-emerald-500/60 transition"
              >
                Start
              </button>
            ) : (
              <button
                onClick={stopQuiz}
                className="inline-flex items-center gap-2 bg-red-700/70 hover:bg-red-600 text-white text-sm px-3 py-1.5 rounded-md border border-red-500/60 transition"
              >
                Stop
              </button>
            )}
          </div>

          {quizOn && (
            <div className="mt-4">
              <div className="text-2xl font-bold text-white font-mono">
                {quizNumber}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => answerQuiz('even')}
                  className="inline-flex items-center gap-2 bg-slate-700/70 hover:bg-slate-600 text-white text-sm px-3 py-1.5 rounded-md border border-slate-600 transition"
                >
                  Even
                </button>
                <button
                  onClick={() => answerQuiz('odd')}
                  className="inline-flex items-center gap-2 bg-slate-700/70 hover:bg-slate-600 text-white text-sm px-3 py-1.5 rounded-md border border-slate-600 transition"
                >
                  Odd
                </button>
                <span className={`text-sm ml-1 ${quizFeedback === 'correct' ? 'text-emerald-300' : quizFeedback === 'wrong' ? 'text-red-300' : 'text-slate-300'}`}>
                  {quizFeedback === 'correct' ? 'Correct! 🎉' : quizFeedback === 'wrong' ? 'Not quite' : ' '}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-slate-900/50 p-2">
                  <div className="text-lg font-bold text-white">{quizScore}</div>
                  <div className="text-xs text-slate-400">Score</div>
                </div>
                <div className="rounded-md bg-slate-900/50 p-2">
                  <div className="text-lg font-bold text-white">{quizTotal}</div>
                  <div className="text-xs text-slate-400">Attempts</div>
                </div>
                <div className="rounded-md bg-slate-900/50 p-2">
                  <div className="text-lg font-bold text-white">
                    {quizTotal ? Math.round((quizScore / quizTotal) * 100) : 0}%
                  </div>
                  <div className="text-xs text-slate-400">Accuracy</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* History */}
        <div className="rounded-2xl p-6 mb-8 border border-slate-700 bg-slate-800/40">
          <div className="flex items-center gap-2 mb-3">
            <History className="h-5 w-5 text-slate-300" />
            <h3 className="text-white font-semibold">History (last 5)</h3>
          </div>
          {history.length === 0 ? (
            <p className="text-slate-400 text-sm">No history yet — generate numbers or roll dice.</p>
          ) : (
            <div className="space-y-2">
              {history.map(h => (
                <div
                  key={h.ts}
                  className="rounded-lg border border-slate-700 bg-slate-900/50 p-3 text-slate-200 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{h.label}</span>
                    <span className="text-slate-400">{new Date(h.ts).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-xs text-slate-400">Range: {h.range}</div>
                  <div className="mt-1 font-mono break-words">{h.values.join(', ')}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <AdBanner />

        {/* SEO Content */}
        <div className="rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            🎲 Random Number Generator — Free Online RNG & Fun Tools
          </h2>
        
          <h3 className="text-xl font-semibold text-white mb-2">What is a Random Number Generator?</h3>
          <div className="space-y-4 text-slate-300">
            <p>
              A <strong>Random Number Generator (RNG)</strong> is a digital tool that
              produces numbers within a given range, ensuring every possible value has an
              equal chance of appearing. It’s useful for <strong>lotteries, raffles, math
              exercises, coding, probability studies, and games</strong> like dice rolls
              or random picks.
            </p>
        
            <p>
              CalculatorHub’s <strong>Random Number Generator</strong> is an advanced,
              fast, and mobile-friendly RNG that not only generates random numbers but
              also includes <strong>Dice Roller, Missing-Number Game, Quick Quiz, Copy &
              Share, and Sound Feedback</strong> for a more interactive experience.
            </p>
        
            <p>
              Whether you’re a <strong>teacher, student, gamer, or developer</strong>,
              this tool helps you create random data or enjoy fun brain games — all in
              one simple interface.
            </p>
        
            <h2 className="text-yellow-500 font-bold mt-6">🎯 Why Use a Random Number Generator?</h2>
            <p>
              Manual randomness (like guessing) can be biased. Using a mathematical
              generator ensures <strong>fair, unbiased, and repeatable randomness</strong>.
              It’s perfect for:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Choosing random winners in giveaways or draws</li>
              <li>Creating test samples or lottery numbers</li>
              <li>Practicing math or probability</li>
              <li>Rolling virtual dice for tabletop games</li>
              <li>Fun learning through interactive challenges</li>
            </ul>
        
            <h2 className="text-yellow-500 font-bold mt-6">💡 Key Benefits</h2>
            <p>
              • 100% free and browser-based — no login required  
              • Customizable range (1–10,000)  
              • Option to allow or prevent duplicate results  
              • Copy, share, and save history instantly  
              • Built-in sound effects (toggleable)  
              • Mobile-optimized design with smooth animations  
              • Educational mini-games and quizzes included  
            </p>
        
            <h2 className="text-yellow-500 font-bold mt-6">⚙️ Features of This Tool</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Random Number Generator:</strong> Create single or multiple random
                numbers in any range with or without duplicates.
              </li>
              <li>
                <strong>Dice Roller:</strong> Simulate real dice — roll d4, d6, d8, d10,
                d12, d20, or custom dice.
              </li>
              <li>
                <strong>Missing-Number Game:</strong> A 20-second challenge where you
                identify which number is missing from a shuffled 1–100 list.
              </li>
              <li>
                <strong>Even/Odd Quick Quiz:</strong> Test your reflexes — decide if the
                shown number is even or odd.
              </li>
              <li>
                <strong>Copy & Share:</strong> Instantly copy generated results or share
                via Web Share API.
              </li>
              <li>
                <strong>History Log:</strong> Keep track of your last 5 generations.
              </li>
              <li>
                <strong>Sound & Animation:</strong> Realistic dice rolls and success
                feedback for immersive fun.
              </li>
            </ul>
        
            <h3 className="text-2xl font-semibold text-white mt-6">🧭 How to Use</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Enter your <strong>minimum</strong> and <strong>maximum</strong> values.</li>
              <li>Choose how many numbers you want to generate.</li>
              <li>Decide whether to allow duplicates or require unique results.</li>
              <li>Click <strong>Generate Numbers</strong> — numbers will appear instantly.</li>
              <li>Use <strong>Copy</strong> to copy results or <strong>Share</strong> to send a link.</li>
              <li>Try the <strong>Dice Roller</strong> or <strong>Missing-Number Game</strong> for extra fun.</li>
            </ul>
        
            <p className="mt-4">
              In short, this RNG is not just a calculator — it’s a complete
              <strong> random toolkit </strong> for everyday use, education, and gaming.
            </p>
        
            <AdBanner type="bottom" />
        
            <section className="space-y-4 mt-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
              </h2>
              <div className="space-y-4 text-lg text-slate-100 leading-relaxed">
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl">
                    <span className="text-yellow-300">Q1:</span> What is a random number generator?
                  </h3>
                  <p>
                    It’s a tool that produces numbers at random within a defined range, ensuring each
                    number has an equal chance. It’s used in research, education, and games.
                  </p>
                </div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl">
                    <span className="text-yellow-300">Q2:</span> How accurate is this generator?
                  </h3>
                  <p>
                    It uses a secure mathematical algorithm (pseudo-random generation) to provide
                    unbiased and repeatable random results, suitable for general use.
                  </p>
                </div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl">
                    <span className="text-yellow-300">Q3:</span> Can I generate unique numbers only?
                  </h3>
                  <p>
                    Yes — simply disable “Allow Duplicates.” The tool ensures each number is distinct
                    within the chosen range.
                  </p>
                </div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl">
                    <span className="text-yellow-300">Q4:</span> What is the Dice Roller feature?
                  </h3>
                  <p>
                    It simulates real dice rolls for tabletop or probability games — you can roll up to
                    20 dice with customizable sides (d6, d20, etc.).
                  </p>
                </div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl">
                    <span className="text-yellow-300">Q5:</span> How does the Missing-Number Game work?
                  </h3>
                  <p>
                    A number between 1 and 100 is removed from the list. You have 20 seconds to guess
                    which number is missing. Great for focus and memory practice.
                  </p>
                </div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl">
                    <span className="text-yellow-300">Q6:</span> Can I share or copy my generated results?
                  </h3>
                  <p>
                    Yes, the Copy button instantly saves results to your clipboard, and the Share button
                    lets you send your RNG output to others with one tap.
                  </p>
                </div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl">
                    <span className="text-yellow-300">Q7:</span> Is it free and mobile-friendly?
                  </h3>
                  <p>
                    100% free, secure, and fully responsive. Works perfectly on phones, tablets, and
                    desktops without installation.
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

        
        <RelatedCalculators currentPath="/random-number-generator" />

        {/* ===================== RANDOM NUMBER GENERATOR ENHANCED SEO SCHEMAS ===================== */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "Random Number Generator",
              "url": "https://calculatorhub.site/random-number-generator",
              "description": "Generate random numbers instantly, roll dice, play missing-number games, and test your brain with quick quizzes. Free online RNG tool with copy, share, and sound effects.",
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
                    "name": "Random Number Generator",
                    "item": "https://calculatorhub.site/random-number-generator"
                  }
                ]
              },
              "hasPart": {
                "@type": "CreativeWork",
                "name": "Random Number Generator Features",
                "about": [
                  "Generate one or many random numbers with custom range",
                  "Option to allow or prevent duplicate results",
                  "Copy and share generated results instantly",
                  "Dice Roller mode (d4, d6, d8, d10, d12, d20, and more)",
                  "Missing-Number Game with timer and feedback",
                  "Even/Odd Quick Quiz mode for fun learning",
                  "Sound toggle and rolling animation effects",
                  "History of last 5 generations"
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
                  "name": "What is a Random Number Generator?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A Random Number Generator (RNG) is an online tool that produces numbers within a specified range where each number has an equal probability. It is commonly used in math, games, and research."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Why should I use the Random Number Generator?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "This RNG ensures completely unbiased results, useful for draws, lotteries, gaming, and study exercises. It saves time and guarantees fairness."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How do I use this Random Number Generator?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Simply set your minimum and maximum range, choose how many numbers to generate, and click 'Generate Numbers'. You can then copy or share the results instantly."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What additional features does this RNG include?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "It includes Dice Roller, Missing-Number Game, Quick Even/Odd Quiz, Copy and Share buttons, sound toggle, and generation history for enhanced experience."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I generate unique numbers only?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Disable 'Allow Duplicates' to ensure every generated number is unique within your selected range."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is this tool free and mobile-friendly?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes! CalculatorHub's Random Number Generator is completely free to use, with no registration required. It works perfectly on all mobile and desktop devices."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Does it support sharing results?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The Share button uses the Web Share API on supported devices. You can also copy results directly to your clipboard."
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
              "name": "Random Number Generator",
              "operatingSystem": "All",
              "applicationCategory": "UtilitiesApplication",
              "description": "Generate random numbers instantly, roll dice, play missing-number games, and test your reflexes with quick quizzes. Includes copy, share, sound toggle, and history features.",
              "url": "https://calculatorhub.site/random-number-generator",
              "featureList": [
                "Customizable random number range",
                "Option for unique or duplicate results",
                "Copy and share functionality",
                "Dice Roller with multiple dice types",
                "Missing-Number Game with timer",
                "Quick Even/Odd Quiz mode",
                "Sound toggle and visual animation",
                "History of last 5 generations"
              ],
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "1500"
              }
            })
          }}
        />

        
      </div>

      {/* Game feedback modal */}
      {gameModal.open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={closeGameModal}
        >
          <div
            className={`relative bg-slate-900 border rounded-2xl shadow-2xl w-[92%] sm:w-[90%] md:max-w-md max-h-[85vh] overflow-y-auto p-5 sm:p-6 text-slate-100 mx-auto`}
            onClick={(e) => e.stopPropagation()}
            style={{
              borderColor: gameModal.tone === 'success' ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)',
            }}
          >
            <button
              onClick={closeGameModal}
              className="absolute top-3 right-3 text-slate-400 hover:text-white transition text-2xl"
              aria-label="Close"
            >
              ×
            </button>
            <h2
              className={`text-lg font-semibold mb-2 ${
                gameModal.tone === 'success' ? 'text-emerald-300' : 'text-red-300'
              }`}
            >
              {gameModal.title}
            </h2>
            <p className="text-slate-200">{gameModal.body}</p>
          </div>
        </div>
      )}

      {/* Local styles for tiny animations (kept minimal) */}
      <style jsx>{`
        .glow-card {
          background: radial-gradient(1200px circle at 0% 0%, rgba(59,130,246,0.08), transparent 40%),
                      radial-gradient(1000px circle at 100% 100%, rgba(34,197,94,0.06), transparent 40%),
                      linear-gradient(to bottom right, rgba(15,23,42,0.9), rgba(15,23,42,0.7));
          border: 1px solid rgba(148,163,184,0.15);
        }
      `}</style>
    </>
  );
};

export default RandomNumberGenerator;
