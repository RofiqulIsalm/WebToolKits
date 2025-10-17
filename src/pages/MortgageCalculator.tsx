import React, { useEffect, useMemo, useState } from 'react';
import { Home, RotateCcw, Share2, Copy, BarChart2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

// ---------------------------
// Config & Utilities
// ---------------------------
const LS_KEY = 'mortgage_calculator_v2';

const currencyOptions = [
  { code: 'INR', symbol: '₹', locale: 'en-IN', label: 'Indian Rupee (₹)' },
  { code: 'USD', symbol: '$', locale: 'en-US', label: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', locale: 'de-DE', label: 'Euro (€)' },
  { code: 'GBP', symbol: '£', locale: 'en-GB', label: 'British Pound (£)' },
  { code: 'AUD', symbol: 'A$', locale: 'en-AU', label: 'Australian Dollar (A$)' },
];

const findLocale = (code: string) =>
  currencyOptions.find(c => c.code === code)?.locale || 'en-IN';

const findSymbol = (code: string) =>
  currencyOptions.find(c => c.code === code)?.symbol || '';

const formatCurrency = (num: number, locale: string, currency: string) => {
  if (!isFinite(num) || num <= 0) return `${findSymbol(currency)}0`;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(num);
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// ---------------------------
// Component
// ---------------------------
const MortgageCalculator: React.FC = () => {
  // Inputs
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(0);
  const [loanYears, setLoanYears] = useState<number>(0);
  const [loanMonths, setLoanMonths] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('INR');

  // Derived & outputs
  const totalMonths = loanYears * 12 + loanMonths;
  const principal = Math.max(loanAmount - downPayment, 0);
  const monthlyRate = interestRate / 12 / 100;

  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);

  // UI states
  const [showAmort, setShowAmort] = useState<boolean>(false);
  const [granularity, setGranularity] = useState<'yearly' | 'monthly'>('yearly'); // amortization granularity
  const [copied, setCopied] = useState<'none' | 'results' | 'link'>('none');

  const currentLocale = findLocale(currency);
  const isDefault =
    !loanAmount && !downPayment && !interestRate && !loanYears && !loanMonths;

  // ---------------------------
  // Normalize months > 11
  // ---------------------------
  useEffect(() => {
    if (loanMonths >= 12) {
      const extraYears = Math.floor(loanMonths / 12);
      setLoanYears(prev => prev + extraYears);
      setLoanMonths(loanMonths % 12);
    }
  }, [loanMonths]);

  // ---------------------------
  // Load from localStorage & URL on first mount
  // ---------------------------
  useEffect(() => {
    // URL query params (for share links)
    const params = new URLSearchParams(window.location.search);
    const fromURL = params.get('mc');

    if (fromURL) {
      try {
        const decoded = JSON.parse(atob(fromURL));
        applyState(decoded);
        return; // URL overrides LS
      } catch {
        // ignore malformed
      }
    }

    // LocalStorage restore
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        applyState(parsed);
      } catch {
        // ignore
      }
    }
  }, []);

  const applyState = (s: any) => {
    setLoanAmount(Number(s.loanAmount) || 0);
    setDownPayment(Number(s.downPayment) || 0);
    setInterestRate(Number(s.interestRate) || 0);
    setLoanYears(Number(s.loanYears) || 0);
    setLoanMonths(Number(s.loanMonths) || 0);
    setCurrency(typeof s.currency === 'string' ? s.currency : 'INR');
  };

  // ---------------------------
  // Save to localStorage on changes
  // ---------------------------
  useEffect(() => {
    const payload = {
      loanAmount,
      downPayment,
      interestRate,
      loanYears,
      loanMonths,
      currency,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
  }, [loanAmount, downPayment, interestRate, loanYears, loanMonths, currency]);

  // ---------------------------
  // Calculation
  // ---------------------------
  useEffect(() => {
    calculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [principal, interestRate, loanYears, loanMonths]);

  const calculate = () => {
    if (principal <= 0 || totalMonths <= 0 || interestRate < 0) {
      setMonthlyPayment(0);
      setTotalPayment(0);
      setTotalInterest(0);
      return;
    }

    if (interestRate === 0) {
      const emi = principal / totalMonths;
      setMonthlyPayment(emi);
      setTotalPayment(emi * totalMonths);
      setTotalInterest(0);
      return;
    }

    const pow = Math.pow(1 + monthlyRate, totalMonths);
    const emi = (principal * monthlyRate * pow) / (pow - 1);
    const totalPay = emi * totalMonths;
    const totalInt = totalPay - principal;

    setMonthlyPayment(emi);
    setTotalPayment(totalPay);
    setTotalInterest(totalInt);
  };

  // ---------------------------
  // Amortization Schedule
  // ---------------------------
  type Row = {
    period: number; // month index starting at 1, or year index when aggregated
    principalPaid: number;
    interestPaid: number;
    balance: number;
  };

  const monthlySchedule: Row[] = useMemo(() => {
    if (principal <= 0 || totalMonths <= 0) return [];
    let balance = principal;
    const rows: Row[] = [];

    if (interestRate === 0) {
      const emi = principal / totalMonths;
      for (let m = 1; m <= totalMonths; m++) {
        const interestPaid = 0;
        const principalPaid = Math.min(balance, emi);
        balance = Math.max(balance - principalPaid, 0);
        rows.push({ period: m, principalPaid, interestPaid, balance });
      }
      return rows;
    }

    const pow = Math.pow(1 + monthlyRate, totalMonths);
    const emi = (principal * monthlyRate * pow) / (pow - 1);

    for (let m = 1; m <= totalMonths; m++) {
      const interestPaid = balance * monthlyRate;
      const principalPaid = Math.min(emi - interestPaid, balance);
      balance = Math.max(balance - principalPaid, 0);
      rows.push({ period: m, principalPaid, interestPaid, balance });
    }
    return rows;
  }, [principal, totalMonths, monthlyRate, interestRate]);

  const yearlySchedule: Row[] = useMemo(() => {
    if (!monthlySchedule.length) return [];
    const years = Math.ceil(totalMonths / 12);
    const out: Row[] = [];
    for (let y = 0; y < years; y++) {
      const start = y * 12;
      const end = Math.min(start + 12, monthlySchedule.length);
      const slice = monthlySchedule.slice(start, end);
      const principalPaid = slice.reduce((s, r) => s + r.principalPaid, 0);
      const interestPaid = slice.reduce((s, r) => s + r.interestPaid, 0);
      const balance = slice.length ? slice[slice.length - 1].balance : out.length ? out[out.length - 1].balance : principal;
      out.push({ period: y + 1, principalPaid, interestPaid, balance });
    }
    return out;
  }, [monthlySchedule, totalMonths, principal]);

  const schedule = granularity === 'yearly' ? yearlySchedule : monthlySchedule;

  // ---------------------------
  // Pie data & Insights
  // ---------------------------
  const pieData = useMemo(
    () => [
      { name: 'Principal', value: Math.max(principal, 0) },
      { name: 'Interest', value: Math.max(totalInterest, 0) },
    ],
    [principal, totalInterest]
  );
  const PIE_COLORS = ['#3b82f6', '#ef4444'];

  const interestPctOfPrincipal =
    principal > 0 ? (totalInterest / principal) * 100 : 0;

  const tipLines: string[] = useMemo(() => {
    const lines: string[] = [];
    if (principal > 0 && totalInterest > 0) {
      lines.push(
        `Over the term, you'll pay ~${interestPctOfPrincipal.toFixed(0)}% of your loan amount as interest.`
      );
    }
    if (interestRate > 0) {
      // Simple sensitivity: 1% lower rate rough save over full term (not exact, but helpful)
      const rDown = Math.max(interestRate - 1, 0);
      const mrDown = rDown / 12 / 100;
      let emiDown = 0;
      if (rDown === 0) {
        emiDown = principal / totalMonths;
      } else {
        const pow = Math.pow(1 + mrDown, totalMonths);
        emiDown = (principal * mrDown * pow) / (pow - 1);
      }
      const savePerMonth = Math.max(monthlyPayment - emiDown, 0);
      const approxSave = savePerMonth * totalMonths;
      if (approxSave > 0) {
        lines.push(
          `Dropping rate by 1% could save ~${formatCurrency(
            approxSave,
            currentLocale,
            currency
          )} over the term.`
        );
      }
    }
    if (downPayment > 0) {
      lines.push(
        `Your down payment reduces the financed amount to ${formatCurrency(
          principal,
          currentLocale,
          currency
        )}.`
      );
    }
    return lines;
  }, [
    principal,
    totalInterest,
    interestRate,
    monthlyPayment,
    totalMonths,
    downPayment,
    currentLocale,
    currency,
    interestPctOfPrincipal,
  ]);

  // ---------------------------
  // Share / Copy
  // ---------------------------
  const copyResults = async () => {
    const text = [
      `Mortgage Summary`,
      `Loan Amount: ${formatCurrency(loanAmount, currentLocale, currency)}`,
      `Down Payment: ${formatCurrency(downPayment, currentLocale, currency)}`,
      `Principal (Financed): ${formatCurrency(principal, currentLocale, currency)}`,
      `Rate: ${interestRate}%`,
      `Term: ${loanYears} years ${loanMonths} months`,
      `Monthly Payment: ${formatCurrency(monthlyPayment, currentLocale, currency)}`,
      `Total Payment: ${formatCurrency(totalPayment, currentLocale, currency)}`,
      `Total Interest: ${formatCurrency(totalInterest, currentLocale, currency)}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied('results');
      setTimeout(() => setCopied('none'), 1500);
    } catch {
      setCopied('none');
    }
  };

  const copyShareLink = async () => {
    const payload = {
      loanAmount,
      downPayment,
      interestRate,
      loanYears,
      loanMonths,
      currency,
    };
    const encoded = btoa(JSON.stringify(payload));
    const url = new URL(window.location.href);
    url.searchParams.set('mc', encoded);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied('link');
      setTimeout(() => setCopied('none'), 1500);
    } catch {
      setCopied('none');
    }
  };

  // ---------------------------
  // Reset
  // ---------------------------
  const handleReset = () => {
    setLoanAmount(0);
    setDownPayment(0);
    setInterestRate(0);
    setLoanYears(0);
    setLoanMonths(0);
    setMonthlyPayment(0);
    setTotalPayment(0);
    setTotalInterest(0);
    setCurrency('INR');
    setGranularity('yearly');
    setShowAmort(false);
  };

  // ---------------------------
  // Render
  // ---------------------------
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

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Currency & Finance', url: '/category/currency-finance' },
            { name: 'Mortgage Calculator', url: '/mortgage-calculator' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Mortgage Calculator</h1>
          <p className="text-slate-300">
            Estimate your monthly mortgage payment, total interest, amortization schedule, and more.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* INPUTS */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Loan Details</h2>
              <button
                onClick={handleReset}
                disabled={isDefault}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md font-medium transition ${
                  isDefault ? 'bg-gray-300 cursor-not-allowed text-gray-600' : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>

            {/* Currency */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Currency</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {currencyOptions.map(opt => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Loan Amount */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Amount ({findSymbol(currency)})
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

              {/* Down Payment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Down Payment ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  value={downPayment || ''}
                  placeholder="Enter down payment (optional)"
                  min={0}
                  onChange={e => setDownPayment(clamp(parseFloat(e.target.value) || 0, 0, loanAmount || 0))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Financed principal: <span className="font-medium">{formatCurrency(principal, currentLocale, currency)}</span>
                </p>
              </div>

              {/* Interest */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Annual Interest Rate (%)</label>
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

              {/* Term */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loan Term</label>
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
                <p className="text-xs text-gray-500 mt-1">
                  Total payments: <span className="font-medium">{totalMonths > 0 ? totalMonths : 0}</span> months
                </p>
              </div>
            </div>
          </div>

          {/* SUMMARY + PIE + ACTIONS */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Mortgage Summary</h2>

            <div className="space-y-6">
              {/* Monthly */}
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Home className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(monthlyPayment, currentLocale, currency)}
                </div>
                <div className="text-sm text-gray-600">Monthly EMI</div>
                <div className="mt-2 text-xs text-gray-500">
                  Total Payment: <span className="font-medium">{formatCurrency(totalPayment, currentLocale, currency)}</span> ·
                  Total Interest: <span className="font-medium">{formatCurrency(totalInterest, currentLocale, currency)}</span>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-gray-700" />
                    <h3 className="font-semibold text-gray-900">Principal vs Interest</h3>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius="80%"
                        label={({ name, value }) =>
                          `${name}: ${formatCurrency(value, currentLocale, currency)}`
                        }
                      >
                        {pieData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <ReTooltip
                        formatter={(value: any) =>
                          formatCurrency(Number(value), currentLocale, currency)
                        }
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Insights */}
              {tipLines.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
                  <div className="font-semibold mb-1">Insights</div>
                  <ul className="list-disc pl-5 space-y-1">
                    {tipLines.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={copyResults}
                  className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-3 py-2 rounded-md text-sm"
                >
                  <Copy size={16} /> Copy Results
                </button>
                <button
                  onClick={copyShareLink}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm"
                >
                  <Share2 size={16} /> Copy Share Link
                </button>
                {copied !== 'none' && (
                  <span className="text-sm text-green-700">
                    {copied === 'results' ? 'Results copied!' : 'Link copied!'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AMORTIZATION */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <button
            onClick={() => setShowAmort(v => !v)}
            className="w-full flex items-center justify-between px-6 py-4"
          >
            <span className="text-lg font-semibold text-gray-900">Amortization Schedule</span>
            {showAmort ? <ChevronUp /> : <ChevronDown />}
          </button>

          {showAmort && (
            <div className="px-6 pb-6">
              <div className="flex items-center gap-4 mb-4">
                <label className="text-sm text-gray-700">Granularity:</label>
                <select
                  value={granularity}
                  onChange={e => setGranularity(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="yearly">Yearly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-700">
                      <th className="text-left px-4 py-2">{granularity === 'yearly' ? 'Year' : 'Month'}</th>
                      <th className="text-right px-4 py-2">Principal Paid</th>
                      <th className="text-right px-4 py-2">Interest Paid</th>
                      <th className="text-right px-4 py-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row) => (
                      <tr key={row.period} className="border-b last:border-0">
                        <td className="px-4 py-2">{row.period}</td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency(row.principalPaid, currentLocale, currency)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency(row.interestPaid, currentLocale, currency)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency(row.balance, currentLocale, currency)}
                        </td>
                      </tr>
                    ))}
                    {schedule.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                          Enter valid inputs to see the schedule.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators currentPath="/mortgage-calculator" category="currency-finance" />
      </div>
    </>
  );
};

export default MortgageCalculator;
