import React, { useState, useEffect, useRef } from 'react';
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
import TaxSummary from "../components/TaxSummary";

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
              ? `${countryName} Income Tax Calculator | Accurate ${countryName} Tax Estimator`
              : 'Global Income Tax Calculator | 2025 Tax Estimator Tool'
          }
          description={
            selectedCountry
              ? `Calculate your ${countryName} income tax for 2025 with instant results. Includes ${countryName} tax slabs, deductions, and effective tax rate breakdowns.`
              : 'Use our free Global Income Tax Calculator to estimate your taxes in 50+ countries. Includes tax slabs, deductions, and effective tax rate breakdowns for 2025.'
          }
          canonical="https://calculatorhub.site/tax-calculator"
          schemaData={generateCalculatorSchema(
            selectedCountry ? `${countryName} Tax Calculator` : 'Global Tax Calculator',
            selectedCountry
              ? `Instantly calculate your ${countryName} tax liability for 2025 using local tax rates and deductions.`
              : 'Instantly calculate income tax for multiple countries with accurate 2025 rates.',
            '/tax-calculator',
            seoData.taxCalculator.keywords
          )}
          openGraph={{
            title: 'Global Income Tax Calculator 2025 | Estimate Taxes Worldwide',
            alt: 'Country-specific income tax calculator banner showing flag, calculator, and tax forms for 2025.',
            description:
              selectedCountry
                ? `Estimate your ${countryName} tax for 2025 with detailed breakdowns of deductions, rates, and net income.`
                : 'Estimate income tax for 50+ countries with this free tax calculator.',
            url: 'https://calculatorhub.site/tax-calculator',
            image: 'https://calculatorhub.site/images/global-income-tax-calculator-2025.webp',
            type: 'website',
          }}
          twitter={{
            card: 'summary_large_image',
            title: selectedCountry
              ? `${countryName} Income Tax Calculator`
              : 'Global Income Tax Calculator',
            description:
              selectedCountry
                ? `Calculate your ${countryName} tax instantly with our 2025 income tax estimator.`
                : 'Free Global Tax Calculator for 2025 with detailed tax breakdowns and smart saving tips.',
            image: 'https://calculatorhub.site/images/global-income-tax-calculator-2025.webp',
          }}
        />


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
            <h1 className="text-3xl font-bold text-cyan-400 mb-6">
              Global Income Tax Calculator 2025 – Accurate, Fast & Country-Specific Results
            </h1>
          
            <p>
              The <strong>Global Income Tax Calculator by CalculatorHub</strong> is a
              free, advanced online tool that helps individuals and professionals estimate
              their <strong>annual tax liabilities</strong> in over <strong>50+ countries</strong>.
              Whether you’re a salaried employee in India, a freelancer in the United States,
              or a contractor in the United Kingdom, this calculator provides an instant
              breakdown of <strong>gross income, deductions, tax payable,</strong> and <strong>net income</strong>.
            </p>
          
            <p>
              Unlike simple calculators that apply a flat rate, our tool uses
              <strong>country-specific tax logic</strong> and updated tax slabs for 2025.
              The system is designed to adapt automatically based on your selected country,
              reflecting local currency symbols, allowances, and deduction rules.
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
                Visual representation of the Global Income Tax Calculator with international support.
              </figcaption>
            </figure>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              🌍 What Is an Income Tax Calculator?
            </h2>
            <p>
              An <strong>Income Tax Calculator</strong> is an online financial tool that helps
              you determine how much tax you owe to your country’s government based on your
              <strong>annual income, deductions,</strong> and <strong>tax laws.</strong>
              It simplifies the process of manual calculation by instantly computing your
              payable tax and take-home salary.
            </p>
            <p>
              Every country has different <strong>tax slabs</strong>, <strong>standard deductions</strong>,
              and <strong>rebate structures</strong>. Our system integrates official
              tax models for supported countries such as <strong>India, the United States,
              the United Kingdom, Canada, Australia,</strong> and more — making it one of
              the most accurate multi-country tax calculators online.
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              💡 How to Use This Income Tax Calculator
            </h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Select your <strong>country</strong> from the dropdown list.</li>
              <li>Enter your <strong>annual income</strong> in the local currency.</li>
              <li>Add any <strong>tax-deductible expenses</strong> such as insurance, home loans, or donations.</li>
              <li>Click “Calculate” — your total tax, net income, and effective tax rate appear instantly.</li>
            </ol>
            <p>
              The results update dynamically, meaning you can adjust your income or deductions in real time
              to understand how small changes impact your tax liability.
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              🧮 Tax Calculation Logic Used
            </h2>
            <p>
              CalculatorHub’s tax system uses modular <strong>TAX_ENGINES</strong> — country-specific tax
              functions coded to mirror official government tax brackets and deduction rules.
              If your country is not yet supported, the system applies a
              <strong>flat 10% rate</strong> as a placeholder until localized logic is added.
            </p>
            <p>
              For example:
            </p>
            <ul>
              <li><strong>India (IN):</strong> Uses the new regime slab rates under the Income Tax Act, 2025.</li>
              <li><strong>United States (US):</strong> Follows the 2025 IRS federal tax brackets.</li>
              <li><strong>United Kingdom (UK):</strong> Applies HMRC income tax bands and personal allowance rules.</li>
              <li><strong>Canada (CA):</strong> Combines federal and provincial tax brackets.</li>
              <li><strong>Australia (AU):</strong> Uses ATO marginal tax rates for the 2025 financial year.</li>
            </ul>
          
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              🔍 Where Does Our Country Data Come From?
            </h2>
            <p>
              The calculator uses verified public data from each country’s
              <strong> tax authority or ministry of finance</strong>. For instance, IRS.gov for
              the U.S., HMRC for the U.K., ATO for Australia, CRA for Canada, and
              IncomeTax.gov.in for India. All information is refreshed regularly to reflect
              the latest fiscal year updates and bracket adjustments.
            </p>
            <p>
              For unsupported regions, a flat tax model is temporarily applied — these will be
              updated progressively as official data becomes available.
            </p>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              ✅ Key Features of the Calculator
            </h2>
            <ul className="space-y-2">
              <li>✔️ Covers <strong>50+ countries</strong> with localized logic and currency.</li>
              <li>✔️ Real-time <strong>gross-to-net conversion</strong>.</li>
              <li>✔️ Dynamic charts and breakdown visualization.</li>
              <li>✔️ Auto-detection of country from previous session.</li>
              <li>✔️ Secure, lightweight, and privacy-friendly — no data stored online.</li>
              <li>✔️ Mobile-friendly UI with dark mode optimization.</li>
            </ul>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">📘 Example Calculation</h2>
            <p>
              Suppose you earn <strong>$75,000 annually</strong> in the U.S. with $5,000 in deductions.
              Based on 2025 tax brackets, your estimated federal tax would be around <strong>$9,600</strong>,
              resulting in a <strong>net income</strong> of approximately <strong>$65,400</strong> and an
              <strong> effective tax rate of 12.8%</strong>.
            </p>

    

          
            {/* ===================== FAQ SECTION ===================== */}
            <section className="space-y-6 mt-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
                ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
              </h2>
          
              <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q1: What is a tax calculator?</h3>
                  <p>
                    A <strong>tax calculator</strong> is a tool that automatically estimates
                    your income tax payable based on your earnings, deductions, and location.
                    It removes the need for manual spreadsheet calculations.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q2: How accurate is this calculator?</h3>
                  <p>
                    It uses the most recent tax slabs and official rates for each supported country.
                    All logic is based on publicly available data from verified tax agencies.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q3: Does this support all currencies?</h3>
                  <p>
                    Yes, the system auto-adjusts currency symbols based on your selected country
                    (₹, $, €, £, etc.).
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q4: Can I use this for business taxes?</h3>
                  <p>
                    This calculator focuses on <strong>personal income tax</strong>.
                    For business or corporate tax computations, please consult an accountant or
                    official revenue authority.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q5: Is my data stored?</h3>
                  <p>
                    No. All calculations occur locally in your browser. Your income and
                    deductions are never transmitted or saved on external servers.
                  </p>
                </div>
              </div>
            </section>
          </section>
          
          {/* =================== AUTHOR & BACKLINK SECTION =================== */}
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
                  Experts in tax computation and online financial tools. Last updated:
                  <time dateTime="2025-10-17">October 17, 2025</time>.
                </p>
              </div>
            </div>
          
            <p className="mt-6 text-sm text-slate-400">
              Explore more tools:
              <a href="/currency-converter" className="text-indigo-400 hover:underline"> Currency Converter</a>,
              <a href="/loan-emi-calculator" className="text-indigo-400 hover:underline"> Loan EMI Calculator</a>, and
              <a href="/gst-calculator" className="text-indigo-400 hover:underline"> GST Calculator</a>.
            </p>
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
 