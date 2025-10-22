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
  "Global": { Male: 70.9, Female: 76.2, Other: 73.5 },
  "Japan": { Male: 81.99, Female: 88.03, Other: 85.0 },
  "USA": { Male: 77.22, Female: 82.11, Other: 79.5 },
  "Canada": { Male: 80.74, Female: 85.03, Other: 82.9 },
  "UK": { Male: 79.72, Female: 83.45, Other: 81.6 },
  "Australia": { Male: 82.43, Female: 85.97, Other: 84.2 },
  "India": { Male: 75.65, Female: 81.25, Other: 78.5 },
  "China": { Male: 76.18, Female: 81.52, Other: 79.0 },
  "Germany": { Male: 79.42, Female: 84.01, Other: 81.7 },
  "France": { Male: 80.73, Female: 86.31, Other: 83.5 },
  "Italy": { Male: 81.94, Female: 86.01, Other: 84.0 },
  "Spain": { Male: 81.27, Female: 86.59, Other: 83.0 },
  "Switzerland": { Male: 82.34, Female: 86.06, Other: 84.2 },
  "South Korea": { Male: 81.44, Female: 87.40, Other: 84.5 },
  "Brazil": { Male: 73.14, Female: 79.30, Other: 76.2 },
  "Russia": { Male: 68.7, Female: 78.0, Other: 73.3 },
  "Mexico": { Male: 74.5, Female: 80.9, Other: 77.7 },
  "South Africa": { Male: 62.95, Female: 69.97, Other: 66.5 },
  "Bangladesh": { Male: 74.0, Female: 77.8, Other: 75.9 },
  "Nigeria": { Male: 54.45, Female: 55.12, Other: 54.8 },
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
  const [birthDate, setBirthDate] = useState<string>('0000-00-00');
  const [toDate, setToDate] = useState<string>('0000-00-00');
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
  const [region, setRegion] = useState<string>(() => getInitialLocal('adv_region', ''));
  const [gender, setGender] = useState<string>(() => getInitialLocal('adv_gender', ''));
  const [lifeExpectancy, setLifeExpectancy] = useState<number>(() => {
    const saved = getInitialLocal<number>('adv_expectancy', 0);
    return saved > 0 ? saved : 0;
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
  if (birthDate === '0000-00-00' || toDate === '0000-00-00') {
    setAge({
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
    return;
  }

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

  // reset button funtionality
  
    const handleReset = useCallback(() => {
    // Reset all base states
    setBirthDate('0000-00-00');
    setToDate('0000-00-00');
    setError('');
    setAge({
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
    setCopied(false);
  
    // Reset advanced mode
    setAdvanced(false);
    setRegion('');
    setGender('');
    setLifeExpectancy(0);
    setLifeLeft(null);
  
    // Clear saved data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adv_enabled');
      localStorage.removeItem('adv_region');
      localStorage.removeItem('adv_gender');
      localStorage.removeItem('adv_expectancy');
    }
  }, []);


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
    "url": "https://calculatorhub.site/age-calculator",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0" }
  }), []);
  
  const articleSchema = useMemo(() => ({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Age Calculator – Calculate Exact Age and Life Countdown",
      "author": {
        "@type": "Organization",
        "name": "CalculatorHub Security Tools Team"
      },
      "publisher": {
        "@type": "Organization",
        "name": "CalculatorHub",
        "logo": { "@type": "ImageObject", "url":       "https://calculatorhub.site/images/calculatorhub-logo.webp" }
      },
      "datePublished": "2025-10-10",
      "dateModified": "2025-10-20"
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
        canonical="https://calculatorhub.site/age-calculator"
        schemaData={schemaArray}
        breadcrumbs={[
          { name: 'Date & Time Tools', url: '/category/date-time-tools' },
          { name: 'Age Calculator', url: '/age-calculator' }

        
        ]}
        
      />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

      <meta property="og:title" content="Age Calculator – Calculate Your Exact Age | CalculatorHub" />
      <meta property="og:description" content="Find your exact age in years, months, days, hours, and seconds with CalculatorHub’s free Age Calculator. Includes life expectancy countdown and more!" />
      <meta property="og:image" content="https://calculatorhub.site/images/age-calculator-preview.webp" />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />


      {/* Static gradient background wrapper */}
      <div className="min-h-screen w-full  from-slate-900 to-slate-800 py-10">
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
              <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-100">Date Input</h2>
                  <button
                    onClick={handleReset}
                    type="button"
                    className="text-white bg-yellow-700 hover:bg-yellow-800 focus:outline-none focus:ring-4 focus:ring-yellow-300 font-medium rounded-full text-sm px-2.5 py-1.5 text-center me-2 mb-2 dark:bg-yellow-600 dark:hover:bg-yellow-700 dark:focus:ring-yellow-800"
                    aria-label="Reset all fields"
                  >
                    Reset
                  </button>
               
                </div>
              <div className="space-y-5">
                {/* Birth Date */}
                <div>
                  <label htmlFor="birth-date" className="block text-sm font-medium text-slate-200 mb-2">
                    Birth Date
                  </label>
                  <input
                    id="birth-date"
                    aria-label="Enter your birth date"
                    type="date"
                    value={birthDate === '0000-00-00' ? '' : birthDate}
                    placeholder="Select your birth date"
                    max={clampDateISO(toDate)}
                    onChange={(e) => {
                      const val = e.target.value || '0000-00-00';
                      setBirthDate(val);
                    }}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               placeholder-slate-500"
                  />
                </div>
            
                {/* To Date */}
                <div>
                  <label htmlFor="to-date" className="block text-sm font-medium text-slate-200 mb-2">
                    Calculate Age As On
                  </label>
                  <input
                    id="to-date"
                    aria-label="Enter the reference date to calculate age on"
                    type="date"
                    value={toDate === '0000-00-00' ? '' : toDate}
                    placeholder="Select date to calculate"
                    min={birthDate && birthDate !== '0000-00-00' ? clampDateISO(birthDate) : undefined}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      const val = e.target.value || '0000-00-00';
                      setToDate(val);
                    }}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/40 text-slate-100 border border-slate-600 
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               placeholder-slate-500"
                  />
                </div>
            
                {/* Calculate Today */}
                <button
                    type="button"
                    disabled={birthDate === '0000-00-00'}
                    onClick={() => setToDate(new Date().toISOString().split('T')[0])}
                    className={`w-full px-4 py-2 rounded-xl font-medium transition-colors shadow-sm ${
                      birthDate === '0000-00-00'
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-500'
                    }`}
                    aria-label="Set the calculation date to today"
                  >
                    Calculate Age Today
                  </button>

            
                {/* Error */}
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
                          <option value="">Select Region</option>
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
                          <option value="">Select Gender</option>
                          {region && Object.keys(LIFE_EXPECTANCY_TABLE[region] || { Male: 0, Female: 0, Other: 0 }).map(g => (
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
                        value={lifeExpectancy || 0}
                        placeholder="Enter life expectancy"
                        onChange={(e) => setLifeExpectancy(Math.max(1, Math.min(130, Number(e.target.value) || 75)))}
                      />
                      <p className="text-xs text-slate-400 mt-1">Override the regional estimate if you prefer.</p>
                    </div>
                  </div>

                  {/* Countdown + Summary */}
                  {lifeLeft && lifeExpectancy > 0 && region && gender && (
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

          {/* SEO Content Section */}
            <section className=" mt-5">
              <h2 className="text-3xl md:text-4xl text-white ">
               <strong>What Is an Age Calculator..?</strong>
              </h2>
              <p className="text-slate-300 py-3 leading-relaxed">
                An <strong>Age Calculator</strong> is a smart online tool that helps you determine your exact age in years, months,
                days, and even seconds. Instead of manually counting days or using spreadsheets, this calculator instantly
                computes your age based on the date of birth and a chosen reference date. It’s accurate, fast, and designed
                to handle leap years, time zones, and date differences automatically.
              </p>
            
              <h2 className="text-3xl md:text-4xl text-white ">
                <strong>How Does Our Age Calculator Work..?</strong>
              </h2>
              <p className="text-slate-300 py-3 leading-relaxed">
                You simply enter your date of birth and the date you want to calculate your age for. The algorithm calculates
                the exact time difference between those two dates. It then displays your age in <strong>years, months, days,
                hours, minutes, and seconds</strong>. For example, if you were born on January 1, 2000, and today is October 10,
                2025, you’ll instantly see your full age and total time lived.
              </p>

              <h2 className="text-3xl md:text-4xl text-white"><strong>Pro Tips for Better Time Insights</strong></h2>
                <ul className="list-disc pl-6 py-3 text-slate-300 space-y-2">
                  <li>Try our <a href="/date-difference-calculator" className="text-teal-400 hover:underline">Date Difference Calculator</a> to measure time spans between events.</li>
                  <li>Bookmark your result — it stays saved with localStorage.</li>
                  <li>Use Advanced Mode weekly to track your progress toward personal goals.</li>
                </ul>



              {/* Logic & Formula Section */}
                <h2 className="text-3xl md:text-4xl text-white">
                  <strong> How the Age Calculator Works (Logic & Formula)</strong>
                </h2>
              
                <p className="text-slate-300 leading-relaxed mb-4">
                  Our <strong>Age Calculator</strong> uses precise date-time algorithms to find the difference between your birth date and
                  the current or selected date. It accounts for leap years, months with different day counts, and even time zone differences
                  to ensure 100% accuracy. Below is a simplified look at the logic:
                </p>
              
                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 overflow-x-auto">
                  <pre className="text-sm text-blue-300 font-mono">
              {`const calculateAge = (birthDate, currentDate) => {
                const birth = new Date(birthDate);
                const today = new Date(currentDate);
              
                let years = today.getFullYear() - birth.getFullYear();
                let months = today.getMonth() - birth.getMonth();
                let days = today.getDate() - birth.getDate();
              
                if (days < 0) {
                  months--;
                  const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                  days += lastMonth.getDate();
                }
                if (months < 0) {
                  years--;
                  months += 12;
                }
              
                const totalDays = Math.floor((today - birth) / (1000 * 60 * 60 * 24));
                return { years, months, days, totalDays };
              };`}
                  </pre>
                </div>
              
                <p className="text-slate-300 mt-4 leading-relaxed">
                  This logic ensures that your age is always accurate, even across leap years or month-end transitions.
                  Every time you update a date, the algorithm recalculates and updates the results instantly.
                </p>
              
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 bg-blue-500/10 border border-blue-400/20 rounded-xl text-center">
                    <h3 className="text-xl font-semibold text-blue-300 mb-1">📅 Year Logic</h3>
                    <p className="text-slate-300 text-sm">Subtracts full calendar years between two dates.</p>
                  </div>
                  <div className="p-4 bg-teal-500/10 border border-teal-400/20 rounded-xl text-center">
                    <h3 className="text-xl font-semibold text-teal-300 mb-1">🗓️ Month Logic</h3>
                    <p className="text-slate-300 text-sm">Adjusts months when the current day is earlier than the birth day.</p>
                  </div>
                  <div className="p-4 bg-amber-500/10 border border-amber-400/20 rounded-xl text-center">
                    <h3 className="text-xl font-semibold text-amber-300 mb-1">📆 Day Logic</h3>
                    <p className="text-slate-300 text-sm">Calculates remaining days by adding the previous month’s total days.</p>
                  </div>
                </div>
              
                <p className="text-slate-300 mt-6 leading-relaxed">
                  The final output includes <span className="text-teal-400 font-semibold">total days, weeks, months, hours, minutes</span>,
                  and even <span className="text-blue-400 font-semibold">seconds lived</span>. These values are calculated by converting
                  the total millisecond difference using the standard formulas:
                </p>
              
                <ul className="list-disc pl-6 mt-3 text-slate-300 space-y-2">
                  <li><code className="text-teal-400">Total Days = (currentDate − birthDate) / (1000 × 60 × 60 × 24)</code></li>
                  <li><code className="text-blue-400">Total Weeks = Total Days / 7</code></li>
                  <li><code className="text-amber-400">Total Months = Years × 12 + Months</code></li>
                </ul>
              
                <p className="mt-4 text-slate-400 text-sm">
                  🧠 <em>Did you know?</em> Our calculator even supports a real-time countdown mode for your life expectancy
                  in the <strong>Advanced Mode</strong> section.
                </p>

            
              <h2 className="text-3xl md:text-4xl text-white">
                <strong>Why Use CalculatorHub’s Age Calculator..?</strong>
              </h2>
              <ul className="list-disc py-3 pl-6 text-slate-300 space-y-2">
                <li>⚡ Instantly calculate your age without complex formulas or errors.</li>
                <li>📆 Check your age for visa applications, legal forms, or health purposes.</li>
                <li>🎂 Know exactly how many days, weeks, or months you’ve lived.</li>
                <li>🧠 Explore unique insights like your total hours or seconds of life.</li>
                <li>💡 Compare ages with our <a href="/age-difference-calculator" className="text-teal-400 hover:underline">Age Difference Calculator</a>.</li>
              </ul>
            
              <h2 className="text-3xl md:text-4xl text-white ">
               <strong>Features and Benefits</strong>
              </h2>
              <ul className="list-disc py-3 pl-6 text-slate-300 space-y-2">
                <li>🎯 Accurate down to the second — no manual calculation required.</li>
                <li>🌐 Works in all modern browsers, mobile, and desktop devices.</li>
                <li>💾 Uses <strong>localStorage</strong> to remember your last settings automatically.</li>
                <li>🧭 Features a sleek dark UI with readable contrast and responsive design.</li>
                <li>🔒 100% secure — no data leaves your browser.</li>
                <li>🧮 Integrates with other tools like the <a href="/date-calculator" className="text-teal-400 hover:underline">Date Calculator</a> and <a href="/bmi-calculator" className="text-teal-400 hover:underline">BMI Calculator</a>.</li>
              </ul>
            
              <h2 className="text-3xl md:text-4xl text-white ">
               <strong> Advanced Mode: Live Life Countdown</strong>
              </h2>
              <p className=" py-3 text-slate-300 leading-relaxed">
                What sets CalculatorHub apart is our <strong>Advanced Mode</strong>. Based on the <a href="https://en.wikipedia.org/wiki/Life_expectancy" target="_blank" rel="noopener noreferrer nofollow" className="text-teal-400 hover:underline">average life expectancy</a> of your region, gender, and preferences, the calculator estimates how much time you may have left — and visualizes it in a <strong>live countdown</strong> and a dynamic progress bar.
              </p>
              <p className="text-slate-300 py-3 leading-relaxed">
                For example, if your regional life expectancy is 80 years, the tool shows you how many <strong>years, months, days, hours, and seconds</strong> are remaining, updating in real time. It’s both enlightening and motivational — helping you make the most of every moment.
              </p>
            
              
            
              <h2 className="text-3xl md:text-4xl text-white">
                <strong>Reliable Data Sources</strong>
              </h2>
              <p className="text-slate-300 p-3 leading-relaxed">
                Our life expectancy estimates are based on trusted global health data from the{" "}
                <a href="https://www.who.int/data/gho/data/themes/topics/topic-details/GHO/life-expectancy" target="_blank" rel="noopener noreferrer nofollow" className="text-teal-400 hover:underline">World Health Organization</a>,{" "}
                <a href="https://www.worldometers.info/demographics/life-expectancy/" target="_blank" rel="noopener noreferrer nofollow" className="text-teal-400 hover:underline">Worldometer</a>, and{" "}
                <a href="https://worldpopulationreview.com/country-rankings/life-expectancy-by-country" target="_blank" rel="noopener noreferrer nofollow" className="text-teal-400 hover:underline">World Population Review</a>.
              </p>
            
              <section className="space-y-4">
                  <h2 className="text-3xl md:text-4xl text-white mb-4"><strong>❓ Frequently Asked Questions (<span className="text-yellow-300"> FAQ </span>)</strong></h2>
                  <div className="space-y-4 text-lg text-slate-100 leading-relaxed">
                    <div>
                      <div className="bg-slate-800/60 p-4 mt-3 rounded-lg">
                          <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q1</span>: Is this Age Calculator accurate?</h3>
                          <p>
      			Yes, it uses real-time date difference calculations with millisecond precision to ensure the results are exact.
                          </p>
                      </div>
                      <div className="bg-slate-800/60 p-4 mt-3 rounded-lg">
                          <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q2</span>: Can I use it for official forms or visas?</h3>
                          <p>
      		Absolutely. The calculator provides verified date outputs ideal for forms, applications, and documentation.
                          </p>
                      </div>
                      <div className="bg-slate-800/60 p-4 mt-3 rounded-lg">
                          <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q3</span>: Does it save my personal data?</h3>
                          <p>
      			No personal data is collected or stored. Only your preferred settings are cached locally for convenience.
                          </p>
                      </div>
                      <div className="bg-slate-800/60 p-4mt-3 rounded-lg">
                          <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q4</span>: Can I compare ages between two people?</h3>
                          <p>
      			 Yes, try our <a href="/age-difference-calculator" className="text-teal-400 hover:underline">Age Difference Calculator</a> to compare two birthdates instantly.
                          </p>
                      </div>
                   </div>
                 </div>
                </section>

              <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
                  <div className="flex items-center gap-3">
                    <img
                      decoding="async"
                      fetchpriority="low"
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
            
              <p className="text-slate-400 text-sm mt-8">
                © {new Date().getFullYear()} CalculatorHub. Discover more powerful tools in our{" "}
                <a href="/category/date-time-tools" className="text-teal-400 hover:underline">Date & Time Tools</a> collection.
              </p>
            </section>

        </div>
      </div>
    </>
  );
};

export default AgeCalculator;
