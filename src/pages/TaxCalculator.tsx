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
        title={selectedCountry ? `${countryName} Income Tax Calculator` : 'Global Income Tax Calculator'}
        description={seoData.taxCalculator.description || 'Calculate your income tax across 50+ countries worldwide.'}
        canonical="https://calculatorhub.site/tax-calculator"
        schemaData={generateCalculatorSchema('Tax Calculator','Calculate your tax in multiple countries worldwide','/tax-calculator',seoData.taxCalculator.keywords)}
        breadcrumbs={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'Tax Calculator', url: '/tax-calculator' },
        ]}
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
          <p className="text-slate-300">
            {selectedCountry
              ? `Calculate your income tax for ${countryName} instantly.`
              : 'Calculate your income tax for 50+ countries instantly.'}
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
      {/* ===== Country Selector (Scrollable 5 items) ===== */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Select Country
        </label>

        <div className="relative inline-block w-full sm:w-64">
          {/* Dropdown Toggle */}
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full flex justify-between items-center bg-[#0f172a] text-slate-200 text-sm px-3 py-2 border border-[#334155] rounded-md hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 transition"
          >
            <span>
              {country
                ? `${countries.find((c) => c.code === country)?.emoji || ''} ${
                    countries.find((c) => c.code === country)?.name || 'Select Country'
                  }`
                : '🌍 Global (Default)'}
            </span>
            <span className="text-slate-400 text-xs">▼</span>
          </button>

          {/* Dropdown Menu (shows 5 visible at once) */}
          {showDropdown && (
            <div
              className="absolute z-50 mt-1 w-full bg-[#0f172a] border border-[#334155] rounded-md shadow-lg max-h-[10.5rem] overflow-y-auto"
            >
              {countries.map((c) => (
                <div
                  key={c.code}
                  onClick={() => {
                    setCountry(c.code);
                    setShowDropdown(false);
                  }}
                  className={`px-3 py-1.5 text-sm text-slate-200 cursor-pointer hover:bg-[#1e293b] transition ${
                    c.code === country ? 'bg-[#1e293b] text-indigo-400' : ''
                  }`}
                >
                  {c.emoji} {c.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Country Support Info */}
        {country && (
          <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] sm:text-xs">
            {isSupported ? (
              <>
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-400">Fully Supported</span>
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

      {/* ===== Income ===== */}
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

      {/* ===== Deductions ===== */}
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
</div>


  {/* Output Section */}
  <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
    <h2 className="text-xl font-semibold text-white mb-4">Tax Calculation</h2>
    <div className="space-y-6">
      <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
        <Receipt className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
        <div className="text-2xl font-bold text-white">
          {income === '' || Number(income) <= 0 ? '$0' : formatCurrency(tax)}
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
 