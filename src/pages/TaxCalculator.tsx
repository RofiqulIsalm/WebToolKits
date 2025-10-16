import React, { useState, useEffect } from 'react';
import { Globe, Receipt, CheckCircle, Wrench } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import { countries } from '../utils/tax/countryMeta';
import { TAX_ENGINES } from '../utils/tax';
import supportedCountries from '../utils/tax/supportedCountries.json';

const TaxCalculator: React.FC = () => {
  const [country, setCountry] = useState(''); // Default: Global
  const [income, setIncome] = useState<number | ''>(''); // Empty by default
  const [deductions, setDeductions] = useState<number | ''>(''); // Empty by default
  const [tax, setTax] = useState<number>(0);
  const [netIncome, setNetIncome] = useState<number>(0);

  const selectedCountry = countries.find((c) => c.code === country);
  const currencySymbol = selectedCountry?.symbol ?? '$';
  const countryEmoji = selectedCountry?.emoji ?? '🌍';
  const countryName = selectedCountry?.name ?? 'Global';

  const countrySupport = supportedCountries.find((c) => c.code === country);
  const isSupported = countrySupport?.hasTaxLogic ?? false;

  useEffect(() => {
    calculateTax();
  }, [country, income, deductions]);

  const calculateTax = () => {
    // Avoid calculation when no income
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
      // Default: flat 10% tax
      const flatTax = numericIncome * 0.1;
      setTax(flatTax);
      setNetIncome(numericIncome - flatTax);
    }
  };

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

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Currency & Finance', url: '/category/currency-finance' },
            { name: 'Tax Calculator', url: '/tax-calculator' },
          ]}
        />

        {/* ======= Header ======= */}
        <div className="mb-8">
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

        {/* ======= Calculator Grid ======= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ============== Input Section ============== */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              Income Details
            </h2>

            <div className="space-y-4">
              {/* Country Selector */}
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

              {/* Income Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Income ({currencySymbol})
                </label>
                <input
                  type="number"
                  value={income}
                  placeholder={`Enter your annual income in ${currencySymbol}`}
                  onChange={(e) => setIncome(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Deductions Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deductions ({currencySymbol})
                </label>
                <input
                  type="number"
                  value={deductions}
                  placeholder={`Enter total deductions in ${currencySymbol}`}
                  onChange={(e) => setDeductions(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* ============== Output Section ============== */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tax Calculation</h2>

            <div className="space-y-6">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <Receipt className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {income === '' || Number(income) <= 0
                    ? 'Enter income to calculate'
                    : tax <= 0
                    ? 'No Tax Payable'
                    : `${currencySymbol}${tax.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}`}
                </div>
                <div className="text-sm text-gray-600">Estimated Annual Tax</div>
              </div>

              {income !== '' && Number(income) > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {currencySymbol}
                      {Number(income).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Gross Income</div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {currencySymbol}
                      {netIncome.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div className="text-sm text-gray-600">Net Income</div>
                  </div>
                </div>
              )}

              {tax > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Monthly Tax:</span>
                    <span className="font-medium">
                      {currencySymbol}
                      {(tax / 12).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Monthly Take-home:</span>
                    <span className="font-medium">
                      {currencySymbol}
                      {(netIncome / 12).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Effective Tax Rate:</span>
                    <span className="font-medium">
                      {((tax / Number(income)) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <AdBanner type="bottom" />
        <RelatedCalculators
          currentPath="/tax-calculator"
          category="currency-finance"
        />
      </div>
    </>
  );
};

export default TaxCalculator;
