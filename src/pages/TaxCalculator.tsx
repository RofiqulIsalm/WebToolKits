import React, { useState, useEffect, useRef } from 'react';
import { Link } from "react-router-dom";
import {
  Globe,
  Receipt,
  CheckCircle,
  Wrench,
  Info,
  RotateCcw,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from 'recharts';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import { countries } from '../utils/tax/countryMeta';
import { TAX_ENGINES } from '../utils/tax';
import supportedCountries from '../utils/tax/supportedCountries.json';
import { TOOLTIP_TEXTS } from '../utils/tax/tooltipTexts';


const COLORS = ['#ef4444', '#22c55e']; // red = tax, green = net

// ✅ Country-specific tax tips (10+ each)
const COUNTRY_TAX_TIPS: Record<string, string[]> = {
  IN: [
    'Invest in ELSS, NPS, or PPF to claim deductions under Section 80C.',
    'Pay health insurance premiums to claim Section 80D benefits.',
    'Claim HRA exemption and home loan interest deduction under Section 24(b).',
    'Make donations to registered charities under Section 80G.',
    'Contribute to EPF or VPF to boost retirement savings and reduce taxes.',
    'Use Section 80E benefits for education loan interest.',
    'Claim leave travel allowance (LTA) for eligible travel expenses.',
    'Submit Form 15G/15H to avoid unnecessary TDS if income is below limit.',
    'Use the new regime comparison tool to choose the better tax option annually.',
    'Invest in long-term infrastructure bonds for extra deductions.',
  ],
  US: [
    'Contribute to 401(k), IRA, or Roth IRA to lower taxable income.',
    'Max out your HSA or FSA accounts for tax-free medical spending.',
    'Deduct mortgage interest and property taxes if you itemize.',
    'Use educational credits like Lifetime Learning or AOC.',
    'Claim the Child Tax Credit and Earned Income Tax Credit (EITC) if eligible.',
    'Bundle charitable donations into one year to cross itemization thresholds.',
    'Deduct eligible business or remote-work expenses.',
    'Sell losing investments to offset capital gains.',
    'Use municipal bonds for tax-free investment income.',
    'Review your W-4 to prevent over-withholding during the year.',
  ],
  UK: [
    'Contribute to a workplace or personal pension to reduce income tax.',
    'Maximize your ISA allowance for tax-free growth.',
    'Claim marriage allowance if eligible.',
    'Use the dividend and capital-gains allowance before April 5.',
    'Track work-from-home or uniform expenses for deductions.',
    'Gift up to £3,000 annually to avoid inheritance tax later.',
    'Donate via Gift Aid to add 25% extra tax-free to charities.',
    'Use salary-sacrifice benefits for car or childcare savings.',
    'Claim rent-a-room relief for up to £7,500 of rental income.',
    'File a Self Assessment early to plan payments smartly.',
  ],
  CA: [
    'Contribute to your RRSP before the deadline to lower your tax bill.',
    'Use TFSA for tax-free investment gains.',
    'Claim child-care, tuition, and medical expense credits.',
    'Deduct moving expenses if relocating for work.',
    'Split pension income with your spouse to reduce taxes.',
    'File returns even with low income to receive GST/HST credits.',
    'Contribute to RESP for your children’s education and get grants.',
    'Deduct home-office expenses if working remotely.',
    'Keep receipts for charitable donations and medical bills.',
    'Pay property taxes on time to avoid penalties.',
  ],
  AU: [
    'Contribute to your superannuation to reduce taxable income.',
    'Prepay deductible expenses before June 30 to claim early.',
    'Claim home-office, phone, and internet expenses if you work remotely.',
    'Use salary-sacrifice for car lease, super, or electronics to save tax.',
    'Keep receipts for all eligible deductions — ATO may request them.',
    'Claim self-education expenses related to your work.',
    'Donate to registered charities for deduction eligibility.',
    'Use low- and middle-income tax offsets if you qualify.',
    'Declare all crypto or side income to avoid penalties.',
    'Lodge returns early to get quicker refunds before EOFY rush.',
  ],
  default: [
    'Contribute to government-approved pension or retirement funds.',
    'Track eligible deductions such as health insurance and education costs.',
    'Invest in tax-efficient savings accounts or bonds.',
    'Donate to verified charities for potential exemptions.',
    'Plan tax-saving investments early in the year.',
    'Keep detailed proof of all deductible expenses.',
    'Consult a licensed tax advisor for optimized filing.',
    'Review tax brackets annually — laws change often.',
    'Claim family, education, or elder-care benefits if applicable.',
    'File returns even if your income is below the taxable limit.',
  ],
};

const TaxCalculator: React.FC = () => {
  
  const [country, setCountry] = useState(() => localStorage.getItem('country') || '');
  const [income, setIncome] = useState<number | ''>(
    localStorage.getItem('income') ? Number(localStorage.getItem('income')) : ''
  );
  const [deductions, setDeductions] = useState<number | ''>(
    localStorage.getItem('deductions') ? Number(localStorage.getItem('deductions')) : ''
  );
  const [tax, setTax] = useState(0);
  const [netIncome, setNetIncome] = useState(0);
  const [showIncomeInfo, setShowIncomeInfo] = useState(false);
  const [showDeductionInfo, setShowDeductionInfo] = useState(false);

  const selectedCountry = countries.find((c) => c.code === country);
  const currencySymbol = selectedCountry?.symbol ?? '$';
  const countryEmoji = selectedCountry?.emoji ?? '🌍';
  const countryName = selectedCountry?.name ?? 'Global';
  const tooltips = TOOLTIP_TEXTS[country] || TOOLTIP_TEXTS[''];

  const countrySupport = supportedCountries.find((c) => c.code === country);
  const isSupported = countrySupport?.hasTaxLogic ?? false;
  const incomeInputRef = useRef<HTMLInputElement>(null);

  // Focus & storage
  useEffect(() => { if (incomeInputRef.current) incomeInputRef.current.focus(); }, [country]);
  useEffect(() => {
    localStorage.setItem('country', country);
    if (income !== '') localStorage.setItem('income', String(income));
    if (deductions !== '') localStorage.setItem('deductions', String(deductions));
  }, [country, income, deductions]);

  useEffect(() => { calculateTax(); }, [country, income, deductions]);

  const calculateTax = () => {
    if (income === '' || isNaN(Number(income))) { setTax(0); setNetIncome(0); return; }
    const numericIncome = Number(income);
    let numericDeductions = Number(deductions) || 0;
    if (numericDeductions > numericIncome) numericDeductions = numericIncome;
    const calcFn = country ? TAX_ENGINES[country] : undefined;
    if (calcFn) {
      const result = calcFn({ income: numericIncome, deductions: numericDeductions });
      setTax(result.tax);
      setNetIncome(result.netIncome);
    } else {
      const flatTax = numericIncome * 0.1;
      setTax(flatTax);
      setNetIncome(numericIncome - flatTax);
    }
  };

  const handleReset = () => {
    setIncome(''); setDeductions(''); setTax(0); setNetIncome(0);
    localStorage.removeItem('income'); localStorage.removeItem('deductions');
  };

  const formatCurrency = (v: number) =>
    `${currencySymbol}${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  const taxRate = income ? ((tax / Number(income)) * 100).toFixed(2) : '0';
  const data = [{ name: 'Tax', value: tax }, { name: 'Net Income', value: netIncome }];
  const effectiveBracket =
    taxRate === '0' ? 'No Tax' :
    Number(taxRate) <= 10 ? 'Low' :
    Number(taxRate) <= 20 ? 'Moderate' :
    Number(taxRate) <= 30 ? 'High' : 'Very High';

  // 🎯 Tips logic
  const tipsForCountry =
    COUNTRY_TAX_TIPS[country as keyof typeof COUNTRY_TAX_TIPS] ||
    COUNTRY_TAX_TIPS.default;
  const [activeTip, setActiveTip] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setActiveTip((p) => (p + 1) % tipsForCountry.length);
    }, 5000);
    return () => clearInterval(t);
  }, [country]);

  // Some extra bottom tips
  const extraTips = tipsForCountry.slice(0, 3);

  return (
    <>
      <SEOHead
              title={
                selectedCountry
                  ? `${countryName} Income Tax Calculator — 2025 Accurate Tax Estimator`
                  : 'Global Income Tax Calculator (2025) — Estimate Taxes in 50+ Countries'
              }
              description={
                selectedCountry
                  ? `Calculate your ${countryName} income tax for 2025 with instant results. Includes local slabs, deductions, effective rate, monthly take-home and charts.`
                  : 'Free Global Income Tax Calculator (2025). Estimate taxes across 50+ countries with country-specific slabs, deductions, effective rate, and charts.'
              }
              keywords={[
                selectedCountry ? `${countryName} tax calculator` : 'global tax calculator',
                'income tax calculator',
                '2025 tax calculator',
                'tax slabs',
                'deductions',
                'effective tax rate',
                'net income',
                'take-home pay',
                'payroll estimator'
              ]}
              canonical="https://calculatorhub.site/tax-calculator"
              schemaData={[
                // 1) WebPage (+ Article details nested)
                {
                  "@context":"https://schema.org",
                  "@type":"WebPage",
                  "@id":"https://calculatorhub.site/tax-calculator#webpage",
                  "url":"https://calculatorhub.site/tax-calculator",
                  "name": selectedCountry
                    ? `${countryName} Income Tax Calculator (2025)`
                    : "Global Income Tax Calculator (2025)",
                  "inLanguage":"en",
                  "isPartOf":{"@id":"https://calculatorhub.site/#website"},
                  "primaryImageOfPage":{
                    "@type":"ImageObject",
                    "@id":"https://calculatorhub.site/images/global-income-tax-calculator-2025.webp#primaryimg",
                    "url":"https://calculatorhub.site/images/global-income-tax-calculator-2025.webp",
                    "width":1200,"height":675
                  },
                  "mainEntity":{
                    "@type":"Article",
                    "@id":"https://calculatorhub.site/tax-calculator#article",
                    "headline": selectedCountry
                      ? `${countryName} Income Tax Calculator — 2025 Slabs, Deductions & Net Income`
                      : "Global Income Tax Calculator — Country-Specific Slabs, Deductions & Net Income",
                    "description": selectedCountry
                      ? `Instant ${countryName} tax estimate for 2025 with slabs, deductions, effective rate and take-home.`
                      : "Instant global tax estimates with country-specific slabs, deductions, effective rate and take-home.",
                    "image":[
                      "https://calculatorhub.site/images/global-income-tax-calculator-2025.webp",
                      "https://calculatorhub.site/images/country-specific-income-tax-calculator-2025.webp"
                    ],
                    "author":{"@type":"Organization","name":"CalculatorHub","url":"https://calculatorhub.site"},
                    "publisher":{"@id":"https://calculatorhub.site/#organization"},
                    "datePublished":"2025-10-17",
                    "dateModified":"2025-11-05",
                    "mainEntityOfPage":{"@id":"https://calculatorhub.site/tax-calculator#webpage"},
                    "articleSection":[
                      "Overview",
                      "How to Use",
                      "How Taxes Are Calculated",
                      "Country-Specific Logic",
                      "Worked Example",
                      "Benefits",
                      "Pros & Cons",
                      "FAQ"
                    ]
                  }
                },
            
                // 2) Breadcrumbs
                {
                  "@context":"https://schema.org",
                  "@type":"BreadcrumbList",
                  "@id":"https://calculatorhub.site/tax-calculator#breadcrumbs",
                  "itemListElement":[
                    {"@type":"ListItem","position":1,"name":"Home","item":"https://calculatorhub.site/"},
                    {"@type":"ListItem","position":2,"name":"Currency & Finance","item":"https://calculatorhub.site/category/currency-finance"},
                    {"@type":"ListItem","position":3,"name":"Tax Calculator","item":"https://calculatorhub.site/tax-calculator"}
                  ]
                },
            
                // 3) FAQ (matches your visible FAQ)
                {
                  "@context":"https://schema.org",
                  "@type":"FAQPage",
                  "@id":"https://calculatorhub.site/tax-calculator#faq",
                  "mainEntity":[
                    {
                      "@type":"Question",
                      "name":"What is an Income Tax Calculator?",
                      "acceptedAnswer":{"@type":"Answer","text":"A tool that estimates taxes from your income and deductions, showing slabs, exemptions, effective rate, and take-home."}
                    },
                    {
                      "@type":"Question",
                      "name":"Is it free to use?",
                      "acceptedAnswer":{"@type":"Answer","text":"Yes, it’s completely free and works without registration."}
                    },
                    {
                      "@type":"Question",
                      "name":"Can small businesses use it?",
                      "acceptedAnswer":{"@type":"Answer","text":"Yes. It supports freelancers and small businesses with deductions/credits."}
                    },
                    {
                      "@type":"Question",
                      "name":"How often is it updated?",
                      "acceptedAnswer":{"@type":"Answer","text":"Annually for new fiscal rules; models are refined as laws change."}
                    },
                    {
                      "@type":"Question",
                      "name":"Does it save my data?",
                      "acceptedAnswer":{"@type":"Answer","text":"No. All calculations run locally in your browser for privacy."}
                    }
                  ]
                },
            
                // 4) WebApplication
                {
                  "@context":"https://schema.org",
                  "@type":"WebApplication",
                  "@id":"https://calculatorhub.site/tax-calculator#webapp",
                  "name": selectedCountry ? `${countryName} Tax Calculator` : "Global Tax Calculator",
                  "url":"https://calculatorhub.site/tax-calculator",
                  "applicationCategory":"FinanceApplication",
                  "operatingSystem":"Web",
                  "publisher":{"@id":"https://calculatorhub.site/#organization"},
                  "image":[
                    "https://calculatorhub.site/images/global-income-tax-calculator-2025.webp"
                  ],
                  "description": selectedCountry
                    ? `Estimate ${countryName} taxes for 2025 with slabs, deductions and net take-home.`
                    : "Estimate taxes worldwide with country-specific slabs and deductions."
                },
            
                // 5) SoftwareApplication (optional but helpful)
                {
                  "@context":"https://schema.org",
                  "@type":"SoftwareApplication",
                  "@id":"https://calculatorhub.site/tax-calculator#software",
                  "name":"Income Tax Calculator",
                  "applicationCategory":"FinanceApplication",
                  "operatingSystem":"All",
                  "url":"https://calculatorhub.site/tax-calculator",
                  "publisher":{"@id":"https://calculatorhub.site/#organization"},
                  "description":"Country-aware tax estimator with slabs, deductions, effective rate and charts."
                },
            
                // 6) Site & Org (ids reused site-wide)
                {
                  "@context":"https://schema.org",
                  "@type":"WebSite",
                  "@id":"https://calculatorhub.site/#website",
                  "url":"https://calculatorhub.site",
                  "name":"CalculatorHub",
                  "publisher":{"@id":"https://calculatorhub.site/#organization"},
                  "potentialAction":{
                    "@type":"SearchAction",
                    "target":"https://calculatorhub.site/search?q={query}",
                    "query-input":"required name=query"
                  }
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

      <> 
        {/* Core */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="robots"
          content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
        />
        <link rel="canonical" href="https://calculatorhub.site/tax-calculator" />
      
        {/* Hreflang (only include locales that actually exist) */}
        <link
          rel="alternate"
          href="https://calculatorhub.site/tax-calculator"
          hreflang="en"
        />
        {/* <link rel="alternate" href="https://calculatorhub.site/bn/tax-calculator" hreflang="bn" /> */}
        <link
          rel="alternate"
          href="https://calculatorhub.site/tax-calculator"
          hreflang="x-default"
        />
      
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="CalculatorHub" />
        <meta
          property="og:title"
          content="Global Income Tax Calculator 2025 — Estimate Taxes, Deductions & Net Income"
        />
        <meta
          property="og:description"
          content="Estimate your 2025 income tax in seconds. Supports multiple countries, deductions, effective rates, and clean visual breakdowns."
        />
        <meta property="og:url" content="https://calculatorhub.site/tax-calculator" />
        <meta
          property="og:image"
          content="https://calculatorhub.site/images/global-income-tax-calculator-2025.webp"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_US" />
        {/* <meta property="og:locale:alternate" content="bn_BD" /> */}
      
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Global Income Tax Calculator 2025 — Fast, Accurate & Country-Specific"
        />
        <meta
          name="twitter:description"
          content="Free tax estimator with deductions, net income, and effective tax rate. Updated for 2025."
        />
        <meta
          name="twitter:image"
          content="https://calculatorhub.site/images/global-income-tax-calculator-2025.webp"
        />
        {/* <meta name="twitter:site" content="@yourhandle" /> */}
      
        {/* Icons / PWA */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0ea5e9" />
      
        {/* Performance: connections */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        {/* Optional: preconnect to Supabase if this page fetches from it */}
        {/* <link rel="preconnect" href="https://YOUR-SUPABASE-PROJECT.supabase.co" crossOrigin="" /> */}
      
        {/* Performance: preload hero & key font (adjust paths if used) */}
        <link
          rel="preload"
          as="image"
          href="/images/global-income-tax-calculator-2025.webp"
          imagesrcset="/images/global-income-tax-calculator-2025.webp 1x"
          fetchpriority="high"
        />
        <link
          rel="preload"
          href="/fonts/Inter-Variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />
      
        {/* Optional quality-of-life */}
        <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
        <meta name="referrer" content="no-referrer-when-downgrade" />
        <meta name="format-detection" content="telephone=no" />
      </>

      
  


      <div className="max-w-5xl mx-auto">
        <Breadcrumbs items={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'Tax Calculator', url: '/tax-calculator' },
        ]} />

        {/* ===== Header ===== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            {selectedCountry ? ` ${countryName} Income Tax Calculator`
              : '🌍 Global Income Tax Calculator'}
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
  Our {selectedCountry ? countryName : 'global'} income tax calculator helps you estimate your
  annual tax liability with precision. Enter your income and deductions to get a detailed
  breakdown of payable tax, effective rate, and smart saving suggestions.
</p>
        </div>

       {/* ===== Calculator Grid ===== */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input Section */}
      <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 relative text-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-sky-400" /> Income Details
          </h2>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-sm text-slate-300 border border-[#334155] rounded-lg px-2 py-1 hover:bg-[#0f172a] hover:text-white transition"
          >
            <RotateCcw className="h-4 w-4 text-indigo-400" /> Reset
          </button>
        </div>
    
        <div className="space-y-5">
          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Country
            </label>
            <div className="relative inline-block w-50% sm:w-44">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-[#0f172a] text-white text-sm px-3 py-1.5 border border-[#334155] rounded-md focus:ring-2 focus:ring-indigo-500 appearance-none pr-8 hover:border-indigo-400 transition"
              >
                <option value="">🌍 Global (Default)</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code} className="text-white w-50%">
                    {c.emoji} {c.name}
                  </option>
                ))} 
              </select>
              {/* Small chevron icon on right (for better UX) */}
            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
              ▼
            </span> 
            </div>
            {country && (
              <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] sm:text-xs">
                {isSupported ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="text-emerald-400">
                      Fully Supported
                    </span>
                  </>
                ) : (
                  <>
                    <Wrench className="h-4 w-4 text-yellow-400 shrink-0" />
                    <span className="text-yellow-400 whitespace-normal">
                      Coming Soon (Flat 10%)
                    </span>
                  </>
                )}
              </div>
            )}
    
          </div> 
    
          {/* Income */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-slate-300">
                Annual Income ({currencySymbol})
              </label>
              <Info
                onClick={() => setShowIncomeInfo(!showIncomeInfo)}
                className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
              />
            </div>
            {showIncomeInfo && (
              <div className="mb-1 bg-[#0f172a] text-slate-300 text-xs p-2 rounded-md border border-[#334155]">
                {tooltips.income}
              </div>
            )}
            <input
              ref={incomeInputRef}
              type="number"
              value={income}
              placeholder={`Enter your annual income in ${currencySymbol}`}
              onChange={(e) =>
                setIncome(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="range"
              min="0"
              max="1000000"
              step="1000"
              value={income || 0}
              onChange={(e) => setIncome(Number(e.target.value))}
              className="w-full mt-2 accent-indigo-500"
            />
          </div>
    
          {/* Deductions */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-slate-300">
                Deductions ({currencySymbol})
              </label>
              <Info
                onClick={() => setShowDeductionInfo(!showDeductionInfo)}
                className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
              />
            </div>
            {showDeductionInfo && (
              <div className="mb-1 bg-[#0f172a] text-slate-300 text-xs p-2 rounded-md border border-[#334155]">
                {tooltips.deductions}
              </div>
            )}
            <input
              type="number"
              value={deductions}
              placeholder={`Enter total deductions in ${currencySymbol}`}
              onChange={(e) =>
                setDeductions(e.target.value === '' ? '' : Number(e.target.value))
              }
              className={`w-full bg-[#0f172a] text-white px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                Number(deductions) > Number(income)
                  ? 'border-rose-500 ring-rose-300'
                  : 'border-[#334155]'
              }`}
            />
            <input
              type="range"
              min="0"
              max="500000"
              step="1000"
              value={deductions || 0}
              onChange={(e) => setDeductions(Number(e.target.value))}
              className="w-full mt-2 accent-emerald-500"
            />
            {Number(deductions) > Number(income) && (
              <p className="text-sm text-rose-400 mt-2">
                ⚠️ Deductions cannot exceed total income.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Output Section */}
      <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
        <h2 className="text-xl font-semibold text-white mb-4">Tax Calculation</h2>
        <div className="space-y-6">
          <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
            <Receipt className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              
              {income === '' || Number(income) <= 0 ? '0' : formatCurrency(tax)}
            </div>
            <div className="text-sm text-slate-400">Estimated Annual Tax</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
              <div className="text-lg font-semibold text-white">
                {currencySymbol}
                {Number(income || 0).toLocaleString()}
              </div>
              <div className="text-sm text-slate-400">Gross Income</div>
            </div>
            <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
              <div className="text-lg font-semibold text-white">
                {currencySymbol}
                {netIncome.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-slate-400">Net Income</div>
            </div>
          </div>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex justify-between">
              <span>Monthly Tax:</span>
              <span className="font-medium text-indigo-300">
                {currencySymbol}
                {(tax / 12).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Monthly Take-home:</span>
              <span className="font-medium text-emerald-300">
                {currencySymbol}
                {(netIncome / 12).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Effective Tax Rate:</span>
              <span className="font-medium text-yellow-300">
                {taxRate}% ({effectiveBracket})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
 
    
    {/* ===== Smart Tip Box (Full Width Above Chart) ===== */}
    {income && Number(income) > 0 && (
      <>
        {/* ===== Smart Tip Box (Dark Premium Theme) ===== */}
        <div className="mt-4 w-full relative">
          <div className="bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm min-h-[50px] w-full flex items-center animate-fadeIn transition-all duration-700 relative">
            {/* Fixed icon on the left side */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8">
              <span className="text-2xl text-indigo-400">💡</span>
            </div>
    
            {/* Text beside icon */}
            <div className="ml-12 w-full">
              <p className="text-base font-medium leading-snug text-slate-300">
                {tipsForCountry[activeTip]}
              </p>
            </div>
          </div>
        </div>
    
        {/* ===== Tax Insights & Smart Saving Tips ===== */}
        <div className="mt-5 bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
          <h3 className="text-lg font-semibold text-white mb-6 text-center">
            Tax Insights & Smart Saving Tips
          </h3>
    
          {/* ===== Chart + Summary Side by Side ===== */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
            {/* Chart Left */}
            <div className="w-[90%] sm:w-[80%] md:w-[70%] max-w-[360px] h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {data.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
    
            {/* Summary Right */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-indigo-500 transition">
                <p className="text-sm text-slate-400 flex items-center justify-center gap-1">
                  💰 <span>Total Income</span>
                </p>
                <p className="font-semibold text-white text-lg">
                  {formatCurrency(Number(income))}
                </p>
              </div>
    
              <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-emerald-500 transition">
                <p className="text-sm text-slate-400 flex items-center justify-center gap-1">
                  📉 <span>Deductions</span>
                </p>
                <p className="font-semibold text-white text-lg">
                  {formatCurrency(Number(deductions) || 0)}
                </p>
              </div>
    
              <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-rose-500 transition">
                <p className="text-sm text-slate-400 flex items-center justify-center gap-1">
                  💸 <span>Tax Payable</span>
                </p>
                <p className="font-semibold text-white text-lg">
                  {formatCurrency(tax)} 
                </p>
              </div>
    
              <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-indigo-500 transition">
                <p className="text-sm text-slate-400 flex items-center justify-center gap-1">
                  🏦 <span>Net Income</span>
                </p>
                <p className="font-semibold text-white text-lg">
                  {formatCurrency(netIncome)}
                </p>
              </div>
            </div>
          </div>
    
          {/* ===== Quick Tax-Saving Cards ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
            <div className="p-3 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-indigo-500 transition text-sm shadow-sm">
              📊 Invest in retirement or pension funds.
            </div>
            <div className="p-3 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-emerald-500 transition text-sm shadow-sm">
              🏠 Claim housing rent or home loan interest.
            </div>
            <div className="p-3 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-amber-500 transition text-sm shadow-sm">
              💉 Deduct medical & health insurance costs.
            </div>
            <div className="p-3 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-indigo-500 transition text-sm shadow-sm">
              🎓 Claim education or child tuition tax credits.
            </div>
          </div>
    
          {/* ===== Country-Specific Facts ===== */}
          <div className="mt-6 text-xs text-slate-400 text-center">
            {country === 'US' && (
              <p>
                🇺🇸 In the U.S., contributing to 401(k) or HSA plans can reduce taxable income.
              </p>
            )}
            {country === 'IN' && (
              <p>
                🇮🇳 In India, Section 80C investments (like ELSS or PPF) help you save tax up to ₹1.5L.
              </p>
            )}
            {country === 'UK' && (
              <p>
                🇬🇧 In the UK, using your ISA and pension allowance can save significant taxes.
              </p>
            )}
            {!country && (
              <p>
                🌍 Tax-saving opportunities vary by country — explore deductions and investments to lower your burden.
              </p>
            )}
          </div>
        </div>
      </>
    )}


        {/* ==================== SEO CONTENT SECTION ==================== */}
         <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
            {/* ===== Table of Contents ===== */}
            <nav className="mt-2 mb-10 bg-[#0f172a] border border-[#334155] rounded-xl p-5 text-slate-200">
              <h2 className="text-lg font-semibold text-cyan-300 mb-3">📖 Table of Contents</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li><a href="#overview" className="text-indigo-400 hover:underline">Overview: What This Calculator Does</a></li>
                <li><a href="#how-to-use" className="text-indigo-400 hover:underline">How to Use the Income Tax Calculator</a></li>
                {typeof income === "number" && income > 0 && (
                  <li><a href="#how-calculated" className="text-indigo-400 hover:underline">How Taxes Are Calculated (Step-by-Step)</a></li>
                )}
                <li><a href="#country-logic" className="text-indigo-400 hover:underline">Country-Specific Logic (2025)</a></li>
                <li><a href="#example" className="text-indigo-400 hover:underline">Worked Example (Generic)</a></li>
                <li><a href="#benefits" className="text-indigo-400 hover:underline">Key Benefits</a></li>
                <li><a href="#pros-cons" className="text-indigo-400 hover:underline">Pros &amp; Cons</a></li>
                <li><a href="#faq" className="text-indigo-400 hover:underline">FAQ</a></li>
              </ol>
            </nav>
           
            <h1 className="text-3xl font-bold text-cyan-400 mb-6">
              Global Income Tax Calculator 2025 – Accurate, Fast & Country-Specific Results
            </h1>
          
            <p>
              The <strong>Global Income Tax Calculator by CalculatorHub</strong> is a
              <strong> free, advanced online tool</strong> designed to simplify complex tax
              calculations. It empowers individuals, professionals, and small business owners to
              estimate their <strong>annual tax liabilities</strong> across <strong>50+ countries</strong>.
              Whether someone is a salaried employee in India, a freelancer in the United States,
              or a contractor in the United Kingdom, this <strong>powerful income tax calculator</strong>
              delivers precise results instantly — helping users understand their gross income,
              deductions, taxable amount, and net take-home salary.
            </p>
          
            <p>
              Unlike simple tools that apply flat rates, this <strong>advanced income tax calculator</strong>
              uses country-specific tax logic and updated fiscal data for 2025. The system
              automatically adapts to the user’s location, displaying local currency symbols,
              personal allowances, and eligible deductions — ensuring the most accurate results.
            </p>
          
            <figure className="my-8">
              <img
                src="/images/country-specific-income-tax-calculator-2025.webp"
                alt="Global income tax calculator 2025 banner showing world map and financial charts"
                title="Global Income Tax Calculator 2025 | Free International Tax Tool"
                className="rounded-lg shadow-md border border-slate-700 mx-auto"
                loading="lazy"
              />
              <figcaption className="text-center text-sm text-slate-400 mt-2">
                Visual representation of the Global Income Tax Calculator with international support and real-time tax logic.
              </figcaption>
            </figure>
          
            <h2 id="overview" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              🌍 What Is an Income Tax Calculator?
            </h2>
            <p>
              An <strong>Income Tax Calculator</strong> is an interactive digital tool that calculates
              how much income tax an individual or business owes based on their earnings, deductions,
              and applicable tax rates. It eliminates the need for manual calculations and spreadsheets,
              saving valuable time and reducing errors.
            </p>
            <p>
              This <strong>income tax calculator for beginners</strong> is designed to make complex
              tax rules easier to understand. By entering simple details like income and deductions,
              users receive clear explanations of each component. The
              <strong> income tax calculator explained</strong> feature ensures full transparency
              — showing how tax brackets, rebates, and exemptions impact the final amount.
            </p>
            <p>
              From freelancers and salaried professionals to the self-employed and corporations, this
              <strong> small business income tax calculator</strong> works seamlessly for every use case.
              It supports multiple regions and is continuously updated for fiscal accuracy.
            </p>
          
            <h2 id="how-to-use" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              💡 How to Use This Income Tax Calculator
            </h2>
            <p>
              Using this <strong>affordable income tax calculator</strong> is easy and takes less than a minute.
              The process is intuitive even for first-time users.
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Select your <strong>country</strong> from the dropdown menu.</li>
              <li>Enter your <strong>annual income</strong> in your local currency.</li>
              <li>Include your <strong>eligible deductions</strong> like insurance, home loan, or donations.</li>
              <li>Click “Calculate” — your <strong>total tax</strong>, <strong>net income</strong>, and
                  <strong> effective tax rate</strong> appear instantly.</li>
            </ol>
            <p>
              The built-in <strong>income tax calculator tutorial</strong> explains each field and updates results dynamically.
              Users can change inputs in real time to see how deductions, exemptions, and additional earnings
              affect their taxes — making this the <strong>best income tax calculator</strong> for smart financial planning.
            </p>

           {/* ===== How Calculated ===== */}
          {typeof income === "number" && income > 0 && (
            <section className="mt-10">
              <h2 id="how-calculated" className="text-2xl font-semibold text-cyan-300 mb-4">
                🧮 How Taxes Are Calculated (Step-by-Step)
              </h2>
          
              {(() => {
                // --- Safe inputs ---
                const gross = Number(income) || 0;
                const ded  = Math.min(Number(deductions) || 0, gross);
                const taxable = Math.max(0, gross - ded);
          
                // --- Helpers (local to this block) ---
                const fmtMoney = (v: number) =>
                  `${currencySymbol}${(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
                const fmtPct = (r: number) => `${(r * 100).toFixed(2)}%`;
          
                type Slab = { lower: number; upper?: number | null; rate: number };
          
                // Try to extract slabs from engine metadata if your TAX_ENGINES exposes any.
                // This is defensive: it won't crash if slabs are not present.
                const extractSlabs = (eng: any): Slab[] | null => {
                  if (!eng) return null;
                  // Common places people stash slab data:
                  if (Array.isArray(eng?.__meta?.slabs)) return eng.__meta.slabs as Slab[];
                  if (Array.isArray(eng?.slabs)) return eng.slabs as Slab[];
                  if (Array.isArray(eng?.RATES)) return eng.RATES as Slab[];
                  return null;
                };
          
                // Build rows from slabs
                const buildRows = (txbl: number, slabs: Slab[]) => {
                  let remain = Math.max(0, txbl);
                  let cumTax = 0;
                  const rows: {
                    idx: number; lower: number; upper?: number | null; rate: number;
                    bandAmt: number; bandTax: number; cumTax: number;
                  }[] = [];
          
                  for (let i = 0; i < slabs.length; i++) {
                    const s = slabs[i];
                    const top = (s.upper ?? Number.POSITIVE_INFINITY);
                    const width = Math.max(0, top - s.lower);
                    if (remain <= 0 || width <= 0) break;
          
                    const bandAmt = Math.min(remain, width);
                    const bandTax = bandAmt * s.rate;
                    remain -= bandAmt;
                    cumTax += bandTax;
          
                    rows.push({
                      idx: i + 1,
                      lower: s.lower,
                      upper: s.upper,
                      rate: s.rate,
                      bandAmt,
                      bandTax,
                      cumTax,
                    });
                  }
                  return { rows, totalTax: cumTax };
                };
          
                // Try to get engine and slabs
                const engine = country ? (TAX_ENGINES as any)[country] : undefined;
                const slabs: Slab[] | null = extractSlabs(engine);
          
                // If slabs exist, build progressive breakdown; else show flat fallback
                let rows: ReturnType<typeof buildRows>["rows"] = [];
                let subtotalTax = 0;
          
                if (slabs && slabs.length) {
                  const built = buildRows(taxable, slabs);
                  rows = built.rows;
                  subtotalTax = built.totalTax;
                }
          
                // Some engines may add credits/surcharge internally; we only show a clean narrative here.
                // If you have explicit "credits" / "surcharge" states, wire them here:
                const credits = 0;     // replace if you track credits
                const surcharge = 0;   // replace if you track surcharge
                const afterCredits = Math.max(0, subtotalTax - credits);
                const finalFromRows = afterCredits + surcharge;
          
                // Build dynamic lines (like EMI/SIP math printout)
                const lines: string[] = [];
                lines.push(`Taxable = ${fmtMoney(gross)} − ${fmtMoney(ded)} = ${fmtMoney(taxable)}`);
          
                if (rows.length) {
                  rows.forEach((r) => {
                    const bandLabel = r.upper != null
                      ? `[${fmtMoney(r.lower)} – ${fmtMoney(r.upper)}]`
                      : `≥ ${fmtMoney(r.lower)}`;
                    lines.push(
                      `Band ${r.idx} ${bandLabel}: ${fmtMoney(r.bandAmt)} × ${fmtPct(r.rate)} = ${fmtMoney(r.bandTax)}`
                    );
                  });
                  lines.push(
                    `Subtotal Tax = ${rows.map(r => fmtMoney(r.bandTax)).join(" + ")} = ${fmtMoney(subtotalTax)}`
                  );
                  if (credits > 0) lines.push(`− Credits = ${fmtMoney(credits)}`);
                  if (surcharge > 0) lines.push(`+ Surcharge = ${fmtMoney(surcharge)}`);
                  lines.push(`Total Tax = ${fmtMoney(finalFromRows)}`);
                } else {
                  // Fallback narrative (flat model)
                  const flatRate = !country ? 0.10 : (tax > 0 && taxable > 0 ? (tax / taxable) : 0.10);
                  lines.push(`No slab data available — applying flat rate: ${fmtPct(flatRate)}`);
                  lines.push(`Total Tax = ${fmtMoney(taxable)} × ${fmtPct(flatRate)} = ${fmtMoney(tax)}`);
                }
          
                const effectiveRate = gross > 0 ? ((tax / gross) * 100).toFixed(2) : "0.00";
          
                return (
                  <>
                    {/* Inputs summary tiles */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                      <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2">
                        <div className="text-cyan-300 text-xs uppercase">Gross Income</div>
                        <div className="font-semibold text-white">{fmtMoney(gross)}</div>
                      </div>
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                        <div className="text-amber-300 text-xs uppercase">Deductions</div>
                        <div className="font-semibold text-white">{fmtMoney(ded)}</div>
                      </div>
                      <div className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-2">
                        <div className="text-fuchsia-300 text-xs uppercase">Taxable Income</div>
                        <div className="font-semibold text-white">{fmtMoney(taxable)}</div>
                      </div>
                    </div>
          
                    {/* Main step card */}
                    <div className="relative rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-[#0b1220]/90 p-4 sm:p-6 ring-1 ring-indigo-500/30 shadow-xl text-[13.5px] sm:text-sm leading-relaxed not-prose">
                      {/* top glow */}
                      <div className="pointer-events-none absolute inset-x-0 -top-0.5 h-0.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-emerald-500 opacity-60" />
          
                      {/* Quick formula description */}
                      <p className="mb-3 text-slate-300">
                        We compute <strong>Taxable</strong> = <span className="font-mono">max(0, Gross − Deductions)</span>, then apply each
                        <strong> tax slab</strong> progressively. If your country model isn’t loaded yet, we show a <strong>flat-rate</strong> explanation.
                      </p>
          
                      {/* Progressive table (when slabs available) */}
                      {rows.length > 0 && (
                        <div className="overflow-x-auto rounded-lg border border-slate-700">
                          <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-800/70 text-slate-300">
                              <tr className="border-b border-slate-700">
                                <th className="p-3">Band</th>
                                <th className="p-3">Range</th>
                                <th className="p-3">Rate</th>
                                <th className="p-3">Taxed Amount</th>
                                <th className="p-3">Band Tax</th>
                                <th className="p-3">Cumulative</th>
                              </tr>
                            </thead>
                            <tbody className="text-slate-200">
                              {rows.map((r) => (
                                <tr key={r.idx} className="border-b border-slate-700 hover:bg-slate-800/40 transition-colors">
                                  <td className="p-3">Band {r.idx}</td>
                                  <td className="p-3">
                                    {r.upper != null
                                      ? `${fmtMoney(r.lower)} – ${fmtMoney(r.upper)}`
                                      : `≥ ${fmtMoney(r.lower)}`}
                                  </td>
                                  <td className="p-3">{fmtPct(r.rate)}</td>
                                  <td className="p-3">{fmtMoney(r.bandAmt)}</td>
                                  <td className="p-3">{fmtMoney(r.bandTax)}</td>
                                  <td className="p-3">{fmtMoney(r.cumTax)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
          
                      {/* Live equation (always show) */}
                      <p className="mt-4 mb-2 text-slate-300">Live math with your inputs:</p>
                      <pre className="bg-slate-900/70 p-4 rounded-lg overflow-x-auto text-[13px] border border-slate-700">
                        <code>{lines.join("\n")}</code>
                      </pre>
          
                      {/* Final cards */}
                      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center">
                          <div className="text-emerald-300 text-xs uppercase">Total Tax</div>
                          <div className="font-semibold text-white">{fmtMoney(tax)}</div>
                        </div>
                        <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-center">
                          <div className="text-sky-300 text-xs uppercase">Net Income</div>
                          <div className="font-semibold text-white">{fmtMoney(netIncome)}</div>
                        </div>
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center">
                          <div className="text-amber-300 text-xs uppercase">Effective Rate</div>
                          <div className="font-semibold text-white">{effectiveRate}%</div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </section>
          )}

           
          <AdBanner type="bottom" />
            <h2 id="country-logic" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              🧮 Tax Calculation Logic Used
            </h2>
            <p>
              CalculatorHub’s system uses modular <strong>TAX_ENGINES</strong> — specialized scripts for each country
              that mirror official tax laws, deductions, and slabs. If a country isn’t yet supported,
              the system temporarily applies a <strong>flat 10% tax rate</strong> until the complete model is available.
            </p>
            <p>
              Example tax rules applied include:
            </p>
            <ul>
              <li><strong>India (IN):</strong> New tax regime slab rates under the Income Tax Act, 2025.</li>
              <li><strong>United States (US):</strong> Follows 2025 IRS federal and standard deduction updates.</li>
              <li><strong>United Kingdom (UK):</strong> HMRC 2025/26 income bands and personal allowances.</li>
              <li><strong>Canada (CA):</strong> Combines federal and provincial brackets for each province.</li>
              <li><strong>Australia (AU):</strong> Uses ATO marginal rates for 2025 with low-income offsets.</li>
            </ul>
          
            <p>
              This <strong>powerful income tax calculator</strong> ensures consistency with real-world taxation systems,
              giving users a realistic estimate before they file their actual returns.
            </p>
          
            <h2 id="example" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              📈 Example Calculation for 2026
            </h2>
            <p>
              Let’s assume a professional earns <strong>$80,000 annually</strong> in the United States and
              claims <strong>$6,000 in deductions</strong> for health insurance and retirement savings.
              Using the <strong>top income tax calculator 2026</strong>, their results would be:
            </p>
            <ul>
              <li><strong>Gross Income:</strong> $80,000</li>
              <li><strong>Deductions:</strong> $6,000</li>
              <li><strong>Tax Payable:</strong> $9,200</li>
              <li><strong>Net Income:</strong> $70,800</li>
              <li><strong>Effective Tax Rate:</strong> 11.5%</li>
            </ul>
            <p>
              This detailed breakdown shows exactly how income, deductions, and tax brackets interact — 
              offering financial clarity at a glance.
            </p>
          
            <h2 id="benefits" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              ✅ Key Benefits of the Income Tax Calculator
            </h2>
            <ul className="space-y-2">
              <li>✔️ Completely <strong>free income tax calculator</strong> — no sign-ups or charges.</li>
              <li>✔️ Designed for all — perfect <strong>income tax calculator for beginners</strong> and experts alike.</li>
              <li>✔️ Works for individuals, freelancers, and as a <strong>small business income tax calculator</strong>.</li>
              <li>✔️ Dynamic charts visualize income vs tax ratio in real time.</li>
              <li>✔️ Privacy-focused: All calculations happen locally in your browser.</li>
              <li>✔️ <strong>Advanced income tax calculator</strong> logic updated yearly to match fiscal rules.</li>
            </ul>
          
            <p>
              The <strong>income tax calculator benefits</strong> extend beyond accuracy — it helps users
              make smarter financial choices by clearly showing how tax planning affects their savings.
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              ⚖️ Income Tax Calculator Pros and Cons
            </h2>
            <p>Like every tool, this one also has its pros and cons:</p>
            <p><strong>Pros:</strong></p>
            <ul>
              <li>Fast, accurate, and user-friendly interface.</li>
              <li>Includes visual insights and regional customization.</li>
              <li>Supports multiple deductions and exemptions.</li>
              <li>Perfect for personal or small business tax estimation.</li>
            </ul>
            <p><strong>Cons:</strong></p>
            <ul>
              <li>Not a substitute for certified financial advice.</li>
              <li>Requires accurate user input for perfect results.</li>
              <li>State or local taxes may vary beyond national slabs.</li>
            </ul>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              🔍 Alternatives to Income Tax Calculators
            </h2>
            <p>
              While there are various <strong>income tax calculator alternatives</strong> like spreadsheets
              or government portals, they often lack interactive visualization and multi-country support.
              CalculatorHub’s version combines speed, simplicity, and accuracy — making it the
              <strong> best income tax calculator</strong> choice for global users in 2026.
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              🧠 Why Users Love This Tool
            </h2>
            <p>
              This <strong>powerful income tax calculator</strong> stands out for combining accuracy with simplicity.
              Its dynamic updates, multi-region support, and mobile optimization make it accessible to anyone — 
              from a student filing their first return to a business owner managing payroll taxes.
            </p>

           {/* ===== Pros/Cons ===== */}
          <h2 id="pros-cons" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            ⚖️ Pros and Cons
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
              <h3 className="text-emerald-300 font-semibold mb-2">Pros</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Fast, accurate, transparent outputs.</li>
                <li>Country-specific logic with locale formatting.</li>
                <li>Scenario testing and instant updates.</li>
              </ul>
            </div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
              <h3 className="text-rose-300 font-semibold mb-2">Cons</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Not a legal filing tool or financial advice.</li>
                <li>Requires correct inputs to match your situation.</li>
                <li>Local/municipal taxes may vary by region.</li>
              </ul>
            </div>
          </div>

           <AdBanner type="bottom" />
            {/* ===================== FAQ SECTION ===================== */}
            <section className="space-y-6 mt-16">
              <h2 id="faq" className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
                ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
              </h2>
          
              <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q1: What is an Income Tax Calculator?</h3>
                  <p>
                    It’s a digital tool that helps estimate taxes based on income and deductions. 
                    The <strong>income tax calculator explained</strong> section shows how each tax slab and exemption applies.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q2: Is it free to use?</h3>
                  <p>
                    Yes, it’s a <strong>free income tax calculator</strong> — completely accessible online without registration.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q3: Can small businesses use it?</h3>
                  <p>
                    Definitely. It doubles as a <strong>small business income tax calculator</strong> that supports deductions and expense tracking.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q4: How often is it updated?</h3>
                  <p>
                    The system is refreshed annually to align with the latest fiscal rules, making it an <strong>advanced income tax calculator</strong>.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q5: Does it save my data?</h3>
                  <p>
                    No. All calculations are processed locally in your browser — your data stays private.
                  </p>
                </div>
              </div>
            </section>
          </section>
        <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
            <div className="flex items-center gap-3">
              <img
                src="/images/calculatorhub-author.webp"
                alt="CalculatorHub Finance Tools Team"
                className="w-12 h-12 rounded-full border border-gray-600"
                loading="lazy"
              />
              <div>
                <p className="font-semibold text-white">Written by the CalculatorHub Finance Tools Team</p>
                <p className="text-sm text-slate-400">
                  Experts in mortgages and online financial tools. Last updated:{" "}
                  <time dateTime="2025-10-17">October 17, 2025</time>.
                </p>
              </div>
            </div>
          
            <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
              <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
                🚀 Explore more finance tools on CalculatorHub:
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link
                  to="/pay-raise-calculator"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-teal-600/20 text-teal-300 hover:text-teal-400 px-3 py-2 rounded-md border border-slate-700 hover:border-teal-500 transition-all duration-200"
                >
                  <span className="text-teal-400">💼</span> Pay Raise Calculator
                </Link>
          
                <Link
                  to="/retirement-calculator"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
                >
                  <span className="text-emerald-400">🏖️</span> Retirement Calculator
                </Link>
          
                <Link
                  to="/roi-calculator"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-amber-600/20 text-amber-300 hover:text-amber-400 px-3 py-2 rounded-md border border-slate-700 hover:border-amber-500 transition-all duration-200"
                >
                  <span className="text-amber-400">📊</span> ROI Calculator
                </Link>
              </div>
            </div>
          </section>







        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/tax-calculator" category="currency-finance" />
      </div>
    </>
  );
};
<style>
{`
  .fade-enter {
    opacity: 0;
    transition: opacity 0.7s ease-in;
  }
  .fade-enter-active {
    opacity: 1;
  }
  .fade-exit {
    opacity: 1;
    transition: opacity 0.7s ease-out;
  }
  .fade-exit-active {
    opacity: 0;
  }
`}
</style>

export default TaxCalculator; 
  
 
