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

const COLORS = ['#ef4444', '#22c55e'];

// ✅ Country-specific tax tips
const COUNTRY_TAX_TIPS: Record<string, string[]> = {
  IN: [
    'Invest in ELSS, NPS, or PPF to claim deductions under Section 80C.',
    'Pay health insurance premiums to claim Section 80D benefits.',
    'Claim HRA exemption and home loan interest deduction under Section 24(b).',
    'Make donations to registered charities under Section 80G.',
  ],
  US: [
    'Contribute to 401(k), IRA, or Roth IRA to lower taxable income.',
    'Max out your HSA or FSA accounts for tax-free medical spending.',
    'Deduct mortgage interest and property taxes if you itemize.',
    'Sell losing investments to offset capital gains.',
  ],
  UK: [
    'Contribute to a workplace or personal pension to reduce income tax.',
    'Maximize your ISA allowance for tax-free growth.',
    'Use salary-sacrifice benefits for childcare or transport.',
    'Claim marriage allowance if eligible.',
  ],
  default: [
    'Contribute to retirement or pension plans to save on taxes.',
    'Track eligible deductions such as health insurance and tuition.',
    'Donate to verified charities for exemptions.',
    'Consult a certified advisor to optimize your tax planning.',
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

  const incomeInputRef = useRef<HTMLInputElement>(null);
  const countrySupport = supportedCountries.find((c) => c.code === country);
  const isSupported = countrySupport?.hasTaxLogic ?? false;

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

  // 🎯 Tips rotation
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

  return (
    <>
      <SEOHead
        title={selectedCountry ? `${countryName} Income Tax Calculator` : 'Global Income Tax Calculator'}
        description="Calculate your income tax easily across 50+ countries with a modern interface."
        canonical="https://calculatorhub.site/tax-calculator"
        schemaData={generateCalculatorSchema('Tax Calculator','Calculate your tax in multiple countries worldwide','/tax-calculator',seoData.taxCalculator.keywords)}
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs items={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'Tax Calculator', url: '/tax-calculator' },
        ]} />

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            {selectedCountry
              ? `${countryEmoji} ${countryName} Income Tax Calculator`
              : '🌍 Global Income Tax Calculator'}
          </h1>
          <p className="text-gray-300">
            {selectedCountry
              ? `Calculate your income tax for ${countryName} instantly.`
              : 'Calculate your income tax for 50+ countries instantly.'}
          </p>
        </div>

        {/* Calculator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-400" /> Income Details
              </h2>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-sm text-gray-300 border border-slate-600 rounded-lg px-2 py-1 hover:bg-slate-700 transition"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            </div>

            <div className="space-y-5">
              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full text-gray-100 bg-slate-800 px-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">🌍 Global (Default)</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.emoji} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Income */}
              <div>
                <label className="text-sm font-medium text-gray-300">
                  Annual Income ({currencySymbol})
                </label>
                <input
                  ref={incomeInputRef}
                  type="number"
                  value={income}
                  placeholder={`Enter income in ${currencySymbol}`}
                  onChange={(e) => setIncome(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-600 bg-slate-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 mt-2"
                />
                <input
                  type="range"
                  min="0"
                  max="1000000"
                  step="1000"
                  value={income || 0}
                  onChange={(e) => setIncome(Number(e.target.value))}
                  className="w-full mt-2 accent-blue-400"
                />
              </div>

              {/* Deductions */}
              <div>
                <label className="text-sm font-medium text-gray-300">
                  Deductions ({currencySymbol})
                </label>
                <input
                  type="number"
                  value={deductions}
                  placeholder={`Enter deductions in ${currencySymbol}`}
                  onChange={(e) => setDeductions(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-600 bg-slate-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 mt-2"
                />
                <input
                  type="range"
                  min="0"
                  max="500000"
                  step="1000"
                  value={deductions || 0}
                  onChange={(e) => setDeductions(Number(e.target.value))}
                  className="w-full mt-2 accent-green-400"
                />
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Tax Calculation</h2>
            <div className="text-center p-4 bg-slate-700/50 rounded-lg mb-4">
              <Receipt className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-100">
                {income === '' || Number(income) <= 0 ? '$0' : formatCurrency(tax)}
              </div>
              <div className="text-sm text-gray-400">Estimated Annual Tax</div>
            </div>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex justify-between"><span>Monthly Tax:</span><span>{currencySymbol}{(tax / 12).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Monthly Take-home:</span><span>{currencySymbol}{(netIncome / 12).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Effective Tax Rate:</span><span>{taxRate}%</span></div>
            </div>
          </div>
        </div>

        {/* ===== Tips Section ===== */}
        {income && Number(income) > 0 && (
          <>
            <div className="mt-6 w-full bg-gray-700 border border-gray-600 text-gray-100 px-6 py-4 rounded-md shadow-sm flex items-center gap-3 animate-fadeIn">
              <span className="text-2xl">💡</span>
              <p className="text-base font-medium">{tipsForCountry[activeTip]}</p>
            </div>

            <div className="mt-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-6 text-center">
                Tax Insights & Smart Saving Tips
              </h3>
              <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
                {/* Chart */}
                <div className="w-[90%] sm:w-[80%] md:w-[70%] max-w-[360px] h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data} innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={2}>
                        {data.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Summary */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg text-center text-gray-100">
                    💰 Total Income: {formatCurrency(Number(income))}
                  </div>
                  <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg text-center text-gray-100">
                    📉 Deductions: {formatCurrency(Number(deductions) || 0)}
                  </div>
                  <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg text-center text-gray-100">
                    💸 Tax Payable: {formatCurrency(tax)}
                  </div>
                  <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg text-center text-gray-100">
                    🏦 Net Income: {formatCurrency(netIncome)}
                  </div>
                </div>
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

export default TaxCalculator;
