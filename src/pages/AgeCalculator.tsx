// Final polished Age Calculator with Advanced Mode, static gradient background, and premium UI
import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { Calendar } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

// Lazy-loaded components (below-the-fold)
const RelatedCalculators = React.lazy(() => import('../components/RelatedCalculators'));
const AdBanner = React.lazy(() => import('../components/AdBanner'));

type AgeBreakdown = {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalMonths: number;
  totalWeeks: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
};

type LifeLeft = {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  percentLived: number; // 0-100
  expectedDeathISO: string;
};

const compactNumber = (n: number) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

const clampDateISO = (value: string) => {
  const d = new Date(value || Date.now());
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  return d.toISOString().split('T')[0];
};

// Simple regional life expectancy table (years).
// Note: simplified averages for UX; user can override manually.
const LIFE_EXPECTANCY_TABLE: Record<string, Record<string, number>> = {
  'Global': { Male: 70, Female: 75, Other: 73 },
  'USA': { Male: 74, Female: 80, Other: 77 },
  'UK': { Male: 79, Female: 83, Other: 81 },
  'EU': { Male: 78, Female: 83, Other: 81 },
  'Canada': { Male: 80, Female: 84, Other: 82 },
  'Australia': { Male: 81, Female: 85, Other: 83 },
  'India': { Male: 69, Female: 72, Other: 70 },
  'Bangladesh': { Male: 71, Female: 74, Other: 72 },
  'Japan': { Male: 81, Female: 87, Other: 84 }
};

const DEFAULT_REGION = 'Global';
const DEFAULT_GENDER = 'Other';

const getInitialLocal = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const AgeCalculator: React.FC = () => {
  // Base age state
  const [birthDate, setBirthDate] = useState<string>('1990-01-01');
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [age, setAge] = useState<AgeBreakdown>({
    years: 0,
    months: 0,
    days: 0,
    totalDays: 0,
    totalMonths: 0,
    totalWeeks: 0,
    totalHours: 0,
    totalMinutes: 0,
    totalSeconds: 0,
  });
  const [error, setError] = useState<string>('');

  // Copy feedback
  const [copied, setCopied] = useState(false);

  // Advanced mode state
  const [advanced, setAdvanced] = useState<boolean>(() => getInitialLocal('adv_enabled', false));
  const [region, setRegion] = useState<string>(() => getInitialLocal('adv_region', DEFAULT_REGION));
  const [gender, setGender] = useState<string>(() => getInitialLocal('adv_gender', DEFAULT_GENDER));
  const [lifeExpectancy, setLifeExpectancy] = useState<number>(() => {
    const saved = getInitialLocal<number>('adv_expectancy', -1);
    if (saved > 0) return saved;
    const byRegion = LIFE_EXPECTANCY_TABLE[DEFAULT_REGION]?.[DEFAULT_GENDER] ?? 75;
    return byRegion;
  });
  const [lifeLeft, setLifeLeft] = useState<LifeLeft | null>(null);

  // Persist advanced settings
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('adv_enabled', JSON.stringify(advanced));
  }, [advanced]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('adv_region', JSON.stringify(region));
  }, [region]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('adv_gender', JSON.stringify(gender));
  }, [gender]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('adv_expectancy', JSON.stringify(lifeExpectancy));
  }, [lifeExpectancy]);

  // Helpers
  const diffYMD = (from: Date, to: Date) => {
    // returns positive Y/M/D difference assuming to >= from
    let years = to.getFullYear() - from.getFullYear();
    let months = to.getMonth() - from.getMonth();
    let days = to.getDate() - from.getDate();
    if (days < 0) {
      months--;
      const lastMonth = new Date(to.getFullYear(), to.getMonth(), 0);
      days += lastMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    return { years, months, days };
  };

  const calculateAge = useCallback(() => {
    const birth = new Date(birthDate);
    const to = new Date(toDate);

    if (isNaN(birth.getTime()) || isNaN(to.getTime())) {
      setError('Please enter valid dates.');
      return;
    }
    if (birth > to) {
      setError('Birth date cannot be later than the “as on” date.');
      return;
    }
    setError('');

    const ymd = diffYMD(birth, to);
    const diffMs = to.getTime() - birth.getTime();
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = ymd.years * 12 + ymd.months;
    const totalHours = totalDays * 24;
    const totalMinutes = totalHours * 60;
    const totalSeconds = totalMinutes * 60;

    setAge({
      years: ymd.years,
      months: ymd.months,
      days: ymd.days,
      totalDays,
      totalMonths,
      totalWeeks,
      totalHours,
      totalMinutes,
      totalSeconds,
    });
  }, [birthDate, toDate]);

  useEffect(() => {
    calculateAge();
  }, [calculateAge]);

  // Advanced mode: compute life left, update every second when enabled
  const recalcLifeLeft = useCallback((): LifeLeft | null => {
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;
    // Expected death date = birth + lifeExpectancy years
    const expectedDeath = new Date(birth);
    expectedDeath.setFullYear(expectedDeath.getFullYear() + Math.max(1, Math.floor(lifeExpectancy)));

    const now = new Date();
    const totalSpanMs = expectedDeath.getTime() - birth.getTime();
    const livedMs = now.getTime() - birth.getTime();
    const percentLived = Math.min(100, Math.max(0, (livedMs / Math.max(totalSpanMs, 1)) * 100));

    // Remaining diff
    const ymd = now <= expectedDeath ? diffYMD(now, expectedDeath) : { years: 0, months: 0, days: 0 };
    const msLeft = Math.max(0, expectedDeath.getTime() - now.getTime());
    const seconds = Math.floor(msLeft / 1000) % 60;
    const minutes = Math.floor(msLeft / (1000 * 60)) % 60;
    const hours = Math.floor(msLeft / (1000 * 60 * 60)) % 24;

    return {
      years: ymd.years,
      months: ymd.months,
      days: ymd.days,
      hours,
      minutes,
      seconds,
      percentLived,
      expectedDeathISO: expectedDeath.toISOString().split('T')[0],
    };
  }, [birthDate, lifeExpectancy]);

  useEffect(() => {
    if (!advanced) {
      setLifeLeft(null);
      return;
    }
    setLifeLeft(recalcLifeLeft());
    const id = setInterval(() => {
      setLifeLeft(recalcLifeLeft());
    }, 1000);
    return () => clearInterval(id);
  }, [advanced, recalcLifeLeft]);

  // Update expectancy automatically when region/gender changes
  useEffect(() => {
    const tableVal = LIFE_EXPECTANCY_TABLE[region]?.[gender];
    if (typeof tableVal === 'number') {
      setLifeExpectancy(tableVal);
    }
  }, [region, gender]);

  const resultString = useMemo(
    () => `${age.years} years, ${age.months} months, ${age.days} days`,
    [age.years, age.months, age.days]
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(resultString);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // ignore
    }
  }, [resultString]);

  // Structured data
  const faqSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I calculate my age accurately?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Enter your date of birth and a reference date. The calculator returns your exact age in years, months and days, along with totals (weeks, days, hours, minutes, seconds)."
        }
      },
      {
        "@type": "Question",
        "name": "What is Advanced Mode in the Age Calculator?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Advanced Mode adds a live life countdown based on average life expectancy. You can choose a region and gender or set a custom life expectancy, and the tool displays time left and an estimated date."
        }
      }
    ]
  }), []);

  const appSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Age Calculator – CalculatorHub",
    "url": "https://calculatorhub.com/age-calculator",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0" }
  }), []);

  const schemaArray = useMemo(() => ([
    generateCalculatorSchema(
      "Age Calculator",
      seoData.ageCalculator.description,
      "/age-calculator",
      seoData.ageCalculator.keywords
    ),
    appSchema,
    faqSchema
  ]), [appSchema, faqSchema]);

  return (
    <>
      <SEOHead
        title={seoData.ageCalculator.title}
        description={seoData.ageCalculator.description}
        canonical="https://calculatorhub.com/age-calculator"
        schemaData={schemaArray}
        breadcrumbs={[
          { name: 'Date & Time Tools', url: '/category/date-time-tools' },
          { name: 'Age Calculator', url: '/age-calculator' }
        ]}
      />

      {/* Static gradient background wrapper */}
      <div className="min-h-screen w-full bg-gradient-to-b from-slate-900 to-slate-800 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { name: 'Date & Time Tools', url: '/category/date-time-tools' },
              { name: 'Age Calculator', url: '/age-calculator' }
            ]}
          />

          {/* Hero */}
          <section className="mt-6 mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
              Age Calculator
            </h1>
            <p className="mt-2 text-slate-300 max-w-2xl">
              Find your exact age in years, months and days. Advanced Mode adds a live life countdown, a progress bar,
              and an estimated final date — with your preferences saved automatically.
            </p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Inputs */}
            <section className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">Date Input</h2>

              <div className="space-y-5">
                <div>
                  <label htmlFor="birth-date" className="block text-sm font-medium text-slate-200 mb-2">
                    Birth Date
                  </label>
                  <input
                    id="birth-date"
                    aria-label="Enter your birth date"
                    type="date"
                    value={birthDate}
                    max={clampDateISO(toDate)}
                    onChange={(e) => setBirthDate(clampDateISO(e.target.value))}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="to-date" className="block text-sm font-medium text-slate-200 mb-2">
                    Calculate Age As On
                  </label>
                  <input
                    id="to-date"
                    aria-label="Enter the reference date to calculate age on"
                    type="date"
                    value={toDate}
                    min={clampDateISO(birthDate)}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setToDate(clampDateISO(e.target.value))}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setToDate(new Date().toISOString().split('T')[0])}
                  className="w-full px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors shadow-sm"
                  aria-label="Set the calculation date to today"
                >
                  Calculate Age Today
                </button>

                {error && (
                  <p className="text-sm text-red-400" role="alert">
                    {error}
                  </p>
                )}
              </div>
            </section>

            {/* Results */}
            <section className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">Age Results</h2>

              <div className="space-y-6">
                <div className="text-center p-4 rounded-xl bg-blue-500/10 border border-blue-400/20">
                  <Calendar className="h-8 w-8 text-blue-300 mx-auto mb-2" aria-hidden="true" />
                  <div className="text-2xl font-bold text-slate-100">
                    {age.years} years, {age.months} months, {age.days} days
                  </div>
                  <div className="text-sm text-slate-300">Exact Age</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl text-center bg-emerald-500/10 border border-emerald-400/20">
                    <div className="text-xl font-semibold text-slate-100">{compactNumber(age.totalDays)}</div>
                    <div className="text-sm text-slate-300">Total Days</div>
                  </div>

                  <div className="p-4 rounded-xl text-center bg-amber-500/10 border border-amber-400/20">
                    <div className="text-xl font-semibold text-slate-100">{compactNumber(age.totalWeeks)}</div>
                    <div className="text-sm text-slate-300">Total Weeks</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl text-center bg-violet-500/10 border border-violet-400/20">
                    <div className="text-xl font-semibold text-slate-100">{compactNumber(age.totalMonths)}</div>
                    <div className="text-sm text-slate-300">Total Months</div>
                  </div>

                  <div className="p-4 rounded-xl text-center bg-rose-500/10 border border-rose-400/20">
                    <div className="text-xl font-semibold text-slate-100">{compactNumber(age.totalHours)}</div>
                    <div className="text-sm text-slate-300">Total Hours</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl text-center bg-orange-500/10 border border-orange-400/20">
                    <div className="text-xl font-semibold text-slate-100">{compactNumber(age.totalMinutes)}</div>
                    <div className="text-sm text-slate-300">Total Minutes</div>
                  </div>
                  <div className="p-4 rounded-xl text-center bg-sky-500/10 border border-sky-400/20">
                    <div className="text-xl font-semibold text-slate-100">{compactNumber(age.totalSeconds)}</div>
                    <div className="text-sm text-slate-300">Total Seconds</div>
                  </div>
                  <div className="p-4 rounded-xl text-center bg-slate-500/10 border border-slate-400/20">
                    <div className="text-xl font-semibold text-slate-100">{age.years}</div>
                    <div className="text-sm text-slate-300">Years (whole)</div>
                  </div>
                </div>

                {/* Copy button with 3s feedback */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-500 transition-colors shadow-sm"
                    aria-live="polite"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  {copied && <span className="text-teal-300 text-sm">Result copied to clipboard</span>}
                </div>
              </div>
            </section>
          </div>

          {/* Advanced Mode */}
          <section className="mt-8 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-semibold text-slate-100">Advanced Mode</h2>
                <button
                  onClick={() => setAdvanced(!advanced)}
                  className="px-4 py-2 rounded-xl bg-slate-900/60 text-slate-100 hover:bg-slate-800 transition-colors border border-white/10"
                >
                  {advanced ? 'Hide Advanced Mode' : 'Show Advanced Mode'}
                </button>
              </div>

              {advanced && (
                <div className="space-y-6 transition-all duration-300 ease-out">
                  {/* Settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-1">Region</label>
                      <select
                        className="w-full px-3 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                      >
                        {Object.keys(LIFE_EXPECTANCY_TABLE).map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-1">Gender</label>
                      <select
                        className="w-full px-3 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                      >
                        {Object.keys(LIFE_EXPECTANCY_TABLE[region] || { Male: 0, Female: 0, Other: 0 }).map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-1">
                        Life Expectancy (years)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={130}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={lifeExpectancy}
                        onChange={(e) => setLifeExpectancy(Math.max(1, Math.min(130, Number(e.target.value) || 75)))}
                      />
                      <p className="text-xs text-slate-400 mt-1">Override the regional estimate if you prefer.</p>
                    </div>
                  </div>

                  {/* Countdown + Summary */}
                  {lifeLeft && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="p-4 rounded-xl border border-white/10 bg-slate-900/40">
                        <h3 className="font-semibold text-slate-200 mb-2">⏳ Life Countdown</h3>
                        <div className="font-mono text-2xl font-bold text-teal-300">
                          {lifeLeft.years}y {lifeLeft.months}m {lifeLeft.days}d{' '}
                          {String(lifeLeft.hours).padStart(2, '0')}:
                          {String(lifeLeft.minutes).padStart(2, '0')}:
                          {String(lifeLeft.seconds).padStart(2, '0')}
                        </div>
                        <p className="text-sm text-slate-300 mt-2">
                          Estimated final date: <span className="font-semibold text-slate-100">{lifeLeft.expectedDeathISO}</span>
                        </p>
                      </div>

                      <div className="p-4 rounded-xl border border-white/10 bg-slate-900/40">
                        <h3 className="font-semibold text-slate-200 mb-2">📈 Life Progress</h3>
                        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-3 bg-gradient-to-r from-teal-400 to-blue-500"
                            style={{ width: `${lifeLeft.percentLived.toFixed(2)}%` }}
                          />
                        </div>
                        <div className="mt-2 text-sm text-slate-300">
                          Lived: <strong className="text-slate-100">{lifeLeft.percentLived.toFixed(2)}%</strong> &nbsp;|&nbsp; Left:{' '}
                          <strong className="text-slate-100">{(100 - lifeLeft.percentLived).toFixed(2)}%</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Extras */}
          <Suspense fallback={null}>
            <div className="my-8">
              <AdBanner type="bottom" />
            </div>
            <RelatedCalculators currentPath="/age-calculator" category="date-time-tools" />
          </Suspense>

          {/* FAQ */}
          <section className="mt-12 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently Asked Questions</h2>
            <div className="prose prose-invert max-w-none">
              <h3>How accurate is the life countdown?</h3>
              <p>
                It is based on average life expectancy and your birth date. This is a statistical estimate only; you can adjust the life expectancy value,
                and real outcomes vary by many personal factors.
              </p>
              <h3>Can I change the life expectancy?</h3>
              <p>Yes. Use the input in Advanced Mode to enter any value (in years). Your choice is saved in your browser for next time.</p>
              <h3>What does the progress bar mean?</h3>
              <p>It estimates the percentage of your expected lifespan already lived, based on your birth date and the life expectancy setting.</p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default AgeCalculator;
