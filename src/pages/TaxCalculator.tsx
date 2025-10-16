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
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            {selectedCountry ? `${countryEmoji} ${countryName} Income Tax Calculator`
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" /> Income Details
              </h2>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-sm text-gray-700 border border-gray-300 rounded-lg px-2 py-1 hover:bg-gray-100"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            </div>

            <div className="space-y-5">
              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">🌍 Global (Default)</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.emoji} {c.name}
                    </option>
                  ))}
                </select>
                {country && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    {isSupported
                      ? (<><CheckCircle className="h-4 w-4 text-green-600" /><span className="text-green-700">Fully Supported</span></>)
                      : (<><Wrench className="h-4 w-4 text-yellow-500" /><span className="text-yellow-600">Coming Soon (Flat 10%)</span></>)}
                  </div>
                )}
              </div>

              {/* Income */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-gray-700">Annual Income ({currencySymbol})</label>
                  <Info onClick={() => setShowIncomeInfo(!showIncomeInfo)} className="h-4 w-4 text-gray-500 cursor-pointer hover:text-blue-600" />
                </div>
                {showIncomeInfo && (<div className="mb-1 bg-gray-100 text-gray-700 text-xs p-2 rounded-md">{tooltips.income}</div>)}
                <input
                  ref={incomeInputRef}
                  type="number"
                  value={income}
                  placeholder={`Enter your annual income in ${currencySymbol}`}
                  onChange={(e) => setIncome(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input type="range" min="0" max="1000000" step="1000" value={income || 0}
                  onChange={(e) => setIncome(Number(e.target.value))} className="w-full mt-2 accent-blue-500" />
              </div>

              {/* Deductions */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-gray-700">Deductions ({currencySymbol})</label>
                  <Info onClick={() => setShowDeductionInfo(!showDeductionInfo)} className="h-4 w-4 text-gray-500 cursor-pointer hover:text-blue-600" />
                </div>
                {showDeductionInfo && (<div className="mb-1 bg-gray-100 text-gray-700 text-xs p-2 rounded-md">{tooltips.deductions}</div>)}
                <input
                  type="number"
                  value={deductions}
                  placeholder={`Enter total deductions in ${currencySymbol}`}
                  onChange={(e) => setDeductions(e.target.value === '' ? '' : Number(e.target.value))}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${Number(deductions) > Number(income) ? 'border-red-500 ring-red-300' : 'border-gray-300'}`}
                />
                <input type="range" min="0" max="500000" step="1000" value={deductions || 0}
                  onChange={(e) => setDeductions(Number(e.target.value))} className="w-full mt-2 accent-green-500" />
                {Number(deductions) > Number(income) && (<p className="text-sm text-red-600 mt-2">⚠️ Deductions cannot exceed total income.</p>)}
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tax Calculation</h2>
            <div className="space-y-6">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <Receipt className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {income === '' || Number(income) <= 0 ? '$0' : formatCurrency(tax)}
                </div>
                <div className="text-sm text-gray-600">Estimated Annual Tax</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">{currencySymbol}{Number(income || 0).toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Gross Income</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">{currencySymbol}{netIncome.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                  <div className="text-sm text-gray-600">Net Income</div>
                </div>
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex justify-between"><span>Monthly Tax:</span><span className="font-medium">{currencySymbol}{(tax / 12).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Monthly Take-home:</span><span className="font-medium">{currencySymbol}{(netIncome / 12).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Effective Tax Rate:</span><span className="font-medium">{taxRate}% ({effectiveBracket})</span></div>
              </div>
            </div>
          </div>
        </div>

{/* ===== Smart Tip Box (Full Width Above Chart) ===== */}
{income && Number(income) > 0 && (
  <>
    <div className="mt-4 w-full"> 
      <div className="bg-blue-50 border border-blue-200 text-blue-900 px-2 py-2 rounded-md shadow-sm min-h-[50px] w-full flex items-center justify-center animate-fadeIn transition-all duration-700">
        <div className="flex items-start gap-2 text-center sm:text-left max-w-4xl mx-auto">
          <span className="text-2xl">💡</span>
          <p className="text-base font-medium leading-snug text-gray-700">
            {tipsForCountry[activeTip]}
          </p>
        </div>
      </div>
    </div>

    {/* ===== Tax Insights & Smart Saving Tips ===== */}
    <div className="mt-10 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
        Tax Insights & Smart Saving Tips
      </h3>

      {/* ===== Chart + Summary Side by Side ===== */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
        {/* Chart Left */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <ResponsiveContainer width="100%" height={220}>
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
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center shadow-sm hover:shadow-md transition">
            <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
              💰 <span>Total Income</span>
            </p>
            <p className="font-semibold text-gray-900 text-lg">
              {formatCurrency(Number(income))}
            </p>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center shadow-sm hover:shadow-md transition">
            <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
              📉 <span>Deductions</span>
            </p>
            <p className="font-semibold text-gray-900 text-lg">
              {formatCurrency(Number(deductions) || 0)}
            </p>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center shadow-sm hover:shadow-md transition">
            <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
              💸 <span>Tax Payable</span>
            </p>
            <p className="font-semibold text-gray-900 text-lg">
              {formatCurrency(tax)}
            </p>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center shadow-sm hover:shadow-md transition">
            <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
              🏦 <span>Net Income</span>
            </p>
            <p className="font-semibold text-gray-900 text-lg">
              {formatCurrency(netIncome)}
            </p>
          </div>
        </div>
      </div>

      {/* ===== Quick Tax-Saving Cards ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
        <div className="p-3 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition text-sm shadow-sm">
          📊 Invest in retirement or pension funds.
        </div>
        <div className="p-3 bg-green-50 rounded-lg text-center hover:bg-green-100 transition text-sm shadow-sm">
          🏠 Claim housing rent or home loan interest.
        </div>
        <div className="p-3 bg-yellow-50 rounded-lg text-center hover:bg-yellow-100 transition text-sm shadow-sm">
          💉 Deduct medical & health insurance costs.
        </div>
        <div className="p-3 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition text-sm shadow-sm">
          🎓 Claim education or child tuition tax credits.
        </div>
      </div>

      {/* ===== Country-Specific Facts ===== */}
      <div className="mt-6 text-xs text-gray-600 text-center">
        {country === 'US' && (
          <p>
            🇺🇸 In the U.S., contributing to 401(k) or HSA plans can reduce
            taxable income.
          </p>
        )}
        {country === 'IN' && (
          <p>
            🇮🇳 In India, Section 80C investments (like ELSS or PPF) help you
            save tax up to ₹1.5L.
          </p>
        )}
        {country === 'UK' && (
          <p>
            🇬🇧 In the UK, using your ISA and pension allowance can save
            significant taxes.
          </p>
        )}
        {!country && (
          <p>
            🌍 Tax-saving opportunities vary by country — explore deductions and
            investments to lower your burden.
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
