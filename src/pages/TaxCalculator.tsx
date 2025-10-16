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

const TaxCalculator: React.FC = () => {
  const [country, setCountry] = useState(() => localStorage.getItem('country') || '');
  const [income, setIncome] = useState<number | ''>(
    localStorage.getItem('income') ? Number(localStorage.getItem('income')) : ''
  );
  const [deductions, setDeductions] = useState<number | ''>(
    localStorage.getItem('deductions') ? Number(localStorage.getItem('deductions')) : ''
  );
  const [tax, setTax] = useState<number>(0);
  const [netIncome, setNetIncome] = useState<number>(0);

  const selectedCountry = countries.find((c) => c.code === country);
  const currencySymbol = selectedCountry?.symbol ?? '$';
  const countryEmoji = selectedCountry?.emoji ?? '🌍';
  const countryName = selectedCountry?.name ?? 'Global';
  const tooltips = TOOLTIP_TEXTS[country] || TOOLTIP_TEXTS[''];

  const countrySupport = supportedCountries.find((c) => c.code === country);
  const isSupported = countrySupport?.hasTaxLogic ?? false;

  const incomeInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus income field when switching country
  useEffect(() => {
    if (incomeInputRef.current) incomeInputRef.current.focus();
  }, [country]);

  // Load + save preferences
  useEffect(() => {
    localStorage.setItem('country', country);
    if (income !== '') localStorage.setItem('income', String(income));
    if (deductions !== '') localStorage.setItem('deductions', String(deductions));
  }, [country, income, deductions]);

  useEffect(() => {
    calculateTax();
  }, [country, income, deductions]);

  const calculateTax = () => {
    if (income === '' || isNaN(Number(income))) {
      setTax(0);
      setNetIncome(0);
      return;
    }

    const numericIncome = Number(income);
    const numericDeductions = Number(deductions) || 0;

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
    setIncome('');
    setDeductions('');
    setTax(0);
    setNetIncome(0);
    localStorage.removeItem('income');
    localStorage.removeItem('deductions');
  };

  const formatCurrency = (value: number) =>
    `${currencySymbol}${value.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;

  const taxRate = income ? ((tax / Number(income)) * 100).toFixed(2) : '0';

  const data = [
    { name: 'Tax', value: tax },
    { name: 'Net Income', value: netIncome },
  ];

  const effectiveBracket =
    taxRate === '0'
      ? 'No Tax'
      : taxRate <= '10'
      ? 'Low'
      : taxRate <= '20'
      ? 'Moderate'
      : taxRate <= '30'
      ? 'High'
      : 'Very High';

  return (
    <>
      <SEOHead
        title={
          selectedCountry
            ? `${countryName} Income Tax Calculator`
            : 'Global Income Tax Calculator'
        }
        description={
          seoData.taxCalculator.description ||
          'Calculate your income tax across 50+ countries worldwide.'
        }
        canonical="https://calculatorhub.site/tax-calculator"
        schemaData={generateCalculatorSchema(
          'Tax Calculator',
          'Calculate your tax in multiple countries worldwide',
          '/tax-calculator',
          seoData.taxCalculator.keywords
        )}
        breadcrumbs={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'Tax Calculator', url: '/tax-calculator' },
        ]}
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Currency & Finance', url: '/category/currency-finance' },
            { name: 'Tax Calculator', url: '/tax-calculator' },
          ]}
        />

        {/* ===== Header ===== */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            {selectedCountry
              ? `${countryEmoji} ${countryName} Income Tax Calculator`
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
          {/* ========== Input Section ========== */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              Income Details
            </h2>

            <div className="space-y-5">
              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    {isSupported ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-700">Fully Supported</span>
                      </>
                    ) : (
                      <>
                        <Wrench className="h-4 w-4 text-yellow-500" />
                        <span className="text-yellow-600">
                          Coming Soon (Flat 10%)
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Income */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Income ({currencySymbol})
                </label>
                <div className="relative group">
                  <input
                    ref={incomeInputRef}
                    type="number"
                    value={income}
                    placeholder={`Enter your annual income in ${currencySymbol}`}
                    onChange={(e) =>
                      setIncome(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Info className="h-4 w-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer hover:text-blue-600 transition" />
                  <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-800 text-white text-xs rounded-md px-2 py-1 top-10 right-0 w-56 shadow-lg z-10">
                    {tooltips.income}
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000000"
                  step="1000"
                  value={income || 0}
                  onChange={(e) => setIncome(Number(e.target.value))}
                  className="w-full mt-2 accent-blue-500"
                />
              </div>

              {/* Deductions */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deductions ({currencySymbol})
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    value={deductions}
                    placeholder={`Enter total deductions in ${currencySymbol}`}
                    onChange={(e) =>
                      setDeductions(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Info className="h-4 w-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer hover:text-blue-600 transition" />
                  <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-800 text-white text-xs rounded-md px-2 py-1 top-10 right-0 w-56 shadow-lg z-10">
                    {tooltips.deductions}
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500000"
                  step="1000"
                  value={deductions || 0}
                  onChange={(e) => setDeductions(Number(e.target.value))}
                  className="w-full mt-2 accent-green-500"
                />
              </div>

              {/* Reset Button */}
              <button
                onClick={handleReset}
                className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-700 border border-gray-300 rounded-lg py-2 hover:bg-gray-100 transition"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            </div>
          </div>

          {/* ========== Output Section ========== */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Tax Calculation
            </h2>

            <div className="space-y-6">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <Receipt className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 transition-all duration-200">
                  {income === '' || Number(income) <= 0
                    ? 'Enter income to calculate'
                    : tax <= 0
                    ? 'No Tax Payable'
                    : formatCurrency(tax)}
                </div>
                <div className="text-sm text-gray-600">Estimated Annual Tax</div>
              </div>

              {tax > 0 && (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={data}
                        innerRadius={50}
                        outerRadius={80}
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

                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="font-semibold text-gray-900">
                      Effective Tax Rate: {taxRate}% ({effectiveBracket})
                    </p>
                  </div>

                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span>Gross Income:</span>
                      <span className="font-medium">{formatCurrency(Number(income))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Deductions:</span>
                      <span className="font-medium">{formatCurrency(Number(deductions))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax Payable:</span>
                      <span className="font-medium text-red-600">{formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Net Income:</span>
                      <span className="font-medium text-green-600">{formatCurrency(netIncome)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/tax-calculator" category="currency-finance" />
      </div>
    </>
  );
};

export default TaxCalculator;
