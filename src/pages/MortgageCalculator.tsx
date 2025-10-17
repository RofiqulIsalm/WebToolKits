import React, { useState, useEffect } from 'react';
import { Home, RotateCcw } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

// Supported currencies
const currencyOptions = [
  { code: 'INR', symbol: '₹', locale: 'en-IN', label: 'Indian Rupee (₹)' },
  { code: 'USD', symbol: '$', locale: 'en-US', label: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', locale: 'de-DE', label: 'Euro (€)' },
  { code: 'GBP', symbol: '£', locale: 'en-GB', label: 'British Pound (£)' },
  { code: 'AUD', symbol: 'A$', locale: 'en-AU', label: 'Australian Dollar (A$)' },
];

// Currency formatting helper
const formatCurrency = (num: number, locale: string, currency: string) => {
  if (isNaN(num) || num <= 0)
    return `${currencyOptions.find(c => c.code === currency)?.symbol || ''}0`;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(num);
};

const MortgageCalculator: React.FC = () => {
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(0);
  const [loanYears, setLoanYears] = useState<number>(0);
  const [loanMonths, setLoanMonths] = useState<number>(0);
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('INR');

  const currentLocale =
    currencyOptions.find(c => c.code === currency)?.locale || 'en-IN';

  // Normalize months > 11
  useEffect(() => {
    if (loanMonths >= 12) {
      const extraYears = Math.floor(loanMonths / 12);
      setLoanYears(prev => prev + extraYears);
      setLoanMonths(loanMonths % 12);
    }
  }, [loanMonths]);

  const totalMonths = loanYears * 12 + loanMonths;

  useEffect(() => {
    calculateMortgage();
  }, [loanAmount, interestRate, loanYears, loanMonths]);

  const calculateMortgage = () => {
    if (loanAmount <= 0 || totalMonths <= 0 || interestRate < 0) {
      setMonthlyPayment(0);
      setTotalPayment(0);
      setTotalInterest(0);
      return;
    }

    const principal = loanAmount;
    const monthlyRate = interestRate / 12 / 100;

    if (interestRate === 0) {
      const emi = principal / totalMonths;
      setMonthlyPayment(emi);
      setTotalPayment(emi * totalMonths);
      setTotalInterest(0);
      return;
    }

    const emi =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);

    const totalPay = emi * totalMonths;
    const totalInt = totalPay - principal;

    setMonthlyPayment(emi);
    setTotalPayment(totalPay);
    setTotalInterest(totalInt);
  };

  const handleReset = () => {
    setLoanAmount(0);
    setInterestRate(0);
    setLoanYears(0);
    setLoanMonths(0);
    setMonthlyPayment(0);
    setTotalPayment(0);
    setTotalInterest(0);
    setCurrency('INR');
  };

  const isDefault =
    !loanAmount && !interestRate && !loanYears && !loanMonths;

  return (
    <>
      <SEOHead
        title={seoData.mortgageCalculator.title}
        description={seoData.mortgageCalculator.description}
        canonical="https://calculatorhub.site/mortgage-calculator"
        schemaData={generateCalculatorSchema(
          'Mortgage Calculator',
          seoData.mortgageCalculator.description,
          '/mortgage-calculator',
          seoData.mortgageCalculator.keywords
        )}
        breadcrumbs={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'Mortgage Calculator', url: '/mortgage-calculator' },
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Currency & Finance', url: '/category/currency-finance' },
            { name: 'Mortgage Calculator', url: '/mortgage-calculator' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Mortgage Calculator
          </h1>
          <p className="text-slate-300">
            Estimate your monthly mortgage payment, total interest, and total payment.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Loan Details</h2>

              {/* Reset Button inside Loan Details */}
              <button
                onClick={handleReset}
                disabled={isDefault}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md font-medium transition ${
                  isDefault
                    ? 'bg-gray-300 cursor-not-allowed text-gray-600'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>

            {/* Currency selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Currency
              </label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {currencyOptions.map(option => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              {/* Loan Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Amount ({currencyOptions.find(c => c.code === currency)?.symbol})
                </label>
                <input
                  type="number"
                  value={loanAmount || ''}
                  placeholder="Enter loan amount"
                  min={0}
                  onChange={e => setLoanAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Interest Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={interestRate || ''}
                  placeholder="Enter interest rate"
                  min={0}
                  onChange={e => setInterestRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Loan Term - Years + Months */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Term
                </label>
                <div className="flex gap-4">
                  <input
                    type="number"
                    value={loanYears || ''}
                    placeholder="Years"
                    min={0}
                    onChange={e => setLoanYears(parseInt(e.target.value) || 0)}
                    className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    value={loanMonths || ''}
                    placeholder="Months"
                    min={0}
                    max={11}
                    onChange={e => setLoanMonths(parseInt(e.target.value) || 0)}
                    className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Mortgage Summary
            </h2>

            <div className="space-y-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Home className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(monthlyPayment, currentLocale, currency)}
                </div>
                <div className="text-sm text-gray-600">Monthly EMI</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(totalPayment, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-gray-600">Total Payment</div>
                </div>

                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(totalInterest, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-gray-600">Total Interest</div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Loan Term:</span>
                  <span className="font-medium">
                    {loanYears || 0} years {loanMonths || 0} months
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Interest Rate:</span>
                  <span className="font-medium">{interestRate || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Monthly Payments:</span>
                  <span className="font-medium">{totalMonths > 0 ? totalMonths : 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators
          currentPath="/mortgage-calculator"
          category="currency-finance"
        />
      </div>
    </>
  );
};

export default MortgageCalculator;
