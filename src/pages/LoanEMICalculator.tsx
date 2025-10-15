// LoanEMICalculator.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, RefreshCw, ChevronDown, ChevronUp, Info, TrendingUp } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import AdBanner from '../components/AdBanner';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type Currency = '$' | '€' | '£' | '₹' | '¥';

type ScheduleRow = {
  month: number;
  openingBalance: number;
  interest: number;
  principal: number;
  prepayment: number;
  closingBalance: number;
};

const LoanEMICalculator: React.FC = () => {
  // ================================
  // UI / Mode
  // ================================
  const [advanced, setAdvanced] = useState<boolean>(false);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);

  // ================================
  // Inputs
  // ================================
  const [currency, setCurrency] = useState<Currency>('$');
  const [principal, setPrincipal] = useState<number>(0);
  const [annualRate, setAnnualRate] = useState<number>(0); // % p.a.
  const [years, setYears] = useState<number>(0);
  const [months, setMonths] = useState<number>(0);

  // Advanced – prepayments
  const [extraMonthly, setExtraMonthly] = useState<number>(0); // recurring extra toward principal
  const [oneTimeAmount, setOneTimeAmount] = useState<number>(0); // one-time prepayment
  const [oneTimeMonth, setOneTimeMonth] = useState<number>(1); // when to apply (1-indexed)

  // Optional assets (e.g., guide image)
  const [guideImageUrl, setGuideImageUrl] = useState<string>('');

  // ================================
  // Derived values
  // ================================
  const totalMonths = useMemo(() => Math.max(0, years * 12 + months), [years, months]);
  const monthlyRate = useMemo(() => (annualRate > 0 ? annualRate / 12 / 100 : 0), [annualRate]);

  // EMI (without considering prepayments; prepayments affect schedule/time)
  const baseEmi = useMemo(() => {
    if (totalMonths <= 0) return 0;
    if (monthlyRate === 0) return principal / totalMonths;
    const r = monthlyRate;
    const n = totalMonths;
    return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }, [principal, monthlyRate, totalMonths]);

  // ================================
  // Amortization Schedule (advanced)
  // ================================
  const schedule: ScheduleRow[] = useMemo(() => {
    if (principal <= 0 || totalMonths <= 0) return [];

    let bal = principal;
    let month = 0;
    const rows: ScheduleRow[] = [];
    const maxGuard = totalMonths * 2 + 240; // guard for heavy prepayments

    while (bal > 0.005 && month < maxGuard) {
      month += 1;
      const opening = bal;

      // Interest this month
      const interest = opening * monthlyRate;

      // Base EMI principal portion
      let principalPortion = monthlyRate === 0 ? baseEmi : baseEmi - interest;
      if (principalPortion < 0) principalPortion = 0;

      // Extra / prepayments
      const thisMonthOneTime =
        advanced && oneTimeAmount > 0 && month === Math.max(1, oneTimeMonth) ? oneTimeAmount : 0;
      const extra = advanced ? Math.max(0, extraMonthly) : 0;
      const prepayment = thisMonthOneTime + extra;

      // Apply payments
      let closing = opening - principalPortion - prepayment;

      // If we overshoot on the final month, trim to zero
      if (closing < 0) {
        // Reduce principal portion so that closing hits zero
        const overshoot = -closing;
        if (prepayment >= overshoot) {
          // reduce prepayment first
          closing = 0;
        } else {
          const needFromPrincipal = overshoot - prepayment;
          principalPortion = Math.max(0, principalPortion - needFromPrincipal);
          closing = 0;
        }
      }

      rows.push({
        month,
        openingBalance: opening,
        interest: Math.max(0, interest),
        principal: Math.max(0, principalPortion),
        prepayment: Math.max(0, prepayment),
        closingBalance: Math.max(0, closing),
      });

      bal = Math.max(0, closing);

      // If rate is zero, we might finish early due to prepayments
      if (bal === 0) break;
    }

    return rows;
  }, [
    principal,
    totalMonths,
    monthlyRate,
    baseEmi,
    advanced,
    extraMonthly,
    oneTimeAmount,
    oneTimeMonth,
  ]);

  const totals = useMemo(() => {
    if (!schedule.length) {
      return {
        monthsToFinish: 0,
        totalInterest: 0,
        totalPaid: 0,
        monthlyEmi: baseEmi,
      };
    }
    const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);
    const totalPrincipalPaid = schedule.reduce((s, r) => s + r.principal + r.prepayment, 0);
    const totalPaid = totalInterest + totalPrincipalPaid;
    return {
      monthsToFinish: schedule.length,
      totalInterest,
      totalPaid,
      monthlyEmi: baseEmi,
    };
  }, [schedule, baseEmi]);

  // ================================
  // Supabase: example asset fetch
  // ================================
  useEffect(() => {
    const loadGuideImage = async () => {
      try {
        const { data, error } = await supabase
          .from('website_settings')
          .select('value')
          .eq('key', 'loan_emi_guide_image')
          .maybeSingle();
        if (data && !error) {
          setGuideImageUrl(data.value);
        }
      } catch (err) {
        console.error('Error loading guide image:', err);
      }
    };
    loadGuideImage();
  }, []);

  // ================================
  // Handlers
  // ================================
  const resetAll = () => {
    setCurrency('$');
    setPrincipal(0);
    setAnnualRate(0);
    setYears(0);
    setMonths(0);
    setAdvanced(false);
    setExtraMonthly(0);
    setOneTimeAmount(0);
    setOneTimeMonth(1);
    setShowSchedule(false);
  };

  const fmt = (v: number) =>
    isFinite(v) ? `${currency}${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `${currency}0.00`;

  // ================================
  // Render
  // ================================
  return (
    <>
      <SEOHead
        title={seoData.loanEmiCalculator?.title || 'Loan EMI Calculator'}
        description={
          seoData.loanEmiCalculator?.description ||
          'Calculate your monthly EMI, total interest and payoff timeline. Advanced mode supports prepayments and amortization schedule.'
        }
        canonical="https://calculatorhub.site/loan-emi-calculator"
        schemaData={generateCalculatorSchema(
          'Loan EMI Calculator',
          seoData.loanEmiCalculator?.description ||
            'Calculate EMI, total interest, and payoff timeline with optional prepayments.',
          '/loan-emi-calculator',
          seoData.loanEmiCalculator?.keywords || ['loan', 'emi', 'calculator']
        )}
        breadcrumbs={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'Loan EMI Calculator', url: '/loan-emi-calculator' },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Breadcrumbs
          items={[
            { name: 'Currency & Finance', url: '/category/currency-finance' },
            { name: 'Loan EMI Calculator', url: '/loan-emi-calculator' },
          ]}
        />

        {/* ===== Mode Toggle ===== */}
        <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 sm:p-5 mb-6 text-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Mode</div>
              <div className="text-sm text-slate-400">
                Tip: Advanced mode unlocks prepayments, amortization schedule, and comparisons.
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-indigo-500"
                checked={advanced}
                onChange={(e) => setAdvanced(e.target.checked)}
              />
              Basic
            </label>
          </div>
        </div>

        {/* ===== Main Grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ------- Left: Loan Details ------- */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-slate-100">Loan Details</h2>
              <button
                onClick={resetAll}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-2 rounded-lg"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-4">Enter principal, annual rate and tenure</p>

            {/* Currency */}
            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
              >
                <option value="$">$</option>
                <option value="€">€</option>
                <option value="£">£</option>
                <option value="₹">₹</option>
                <option value="¥">¥</option>
              </select>
            </div>

            {/* Principal */}
            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-1">Loan Amount (Principal)</label>
              <input
                type="number"
                min={0}
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100"
                placeholder="0"
              />
            </div>

            {/* Rate */}
            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-1">Interest Rate (% per annum)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={annualRate}
                onChange={(e) => setAnnualRate(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100"
                placeholder="0"
              />
            </div>

            {/* Time */}
            <div className="mb-1">
              <label className="block text-sm text-slate-300 mb-1">Time Period</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Years</div>
                  <input
                    type="number"
                    min={0}
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                    placeholder="0"
                  />
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Months</div>
                  <input
                    type="number"
                    min={0}
                    value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-2">{years} years {months} months</div>
            </div>

            {/* Advanced: Prepayments */}
            {advanced && (
              <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-4 w-4 text-indigo-400" />
                  <div className="font-semibold text-slate-100 text-sm">Prepayments</div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Extra Monthly</label>
                    <input
                      type="number"
                      min={0}
                      value={extraMonthly}
                      onChange={(e) => setExtraMonthly(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">One-time Amount</label>
                    <input
                      type="number"
                      min={0}
                      value={oneTimeAmount}
                      onChange={(e) => setOneTimeAmount(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">One-time Month (1 = first)</label>
                    <input
                      type="number"
                      min={1}
                      value={oneTimeMonth}
                      onChange={(e) => setOneTimeMonth(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                      placeholder="1"
                    />
                  </div>
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Extra/one-time amounts go directly toward principal and can shorten the payoff time substantially.
                </div>
              </div>
            )}
          </div>

          {/* ------- Right: EMI Breakdown ------- */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 flex flex-col">
            <h2 className="text-xl font-bold text-slate-100 mb-4">EMI Breakdown</h2>

            {/* Monthly EMI */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Calculator className="h-5 w-5 text-indigo-400" />
                <div className="text-sm text-slate-300">Monthly EMI</div>
              </div>
              <div className="text-3xl font-extrabold text-slate-100">{fmt(baseEmi || 0)}</div>
            </div>

            {/* Principal / Interest */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-xl border border-emerald-800/40 bg-emerald-900/20 p-4">
                <div className="text-sm text-slate-300">Principal</div>
                <div className="text-xl font-semibold text-emerald-300">{fmt(principal)}</div>
              </div>
              <div className="rounded-xl border border-amber-800/40 bg-amber-900/20 p-4">
                <div className="text-sm text-slate-300">Total Interest</div>
                <div className="text-xl font-semibold text-amber-300">{fmt(totals.totalInterest)}</div>
              </div>
            </div>

            {/* Total Payable */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
              <div className="text-sm text-slate-300">Total Amount Payable</div>
              <div className="text-2xl font-bold text-slate-100">{fmt(totals.totalPaid)}</div>
              {advanced && totals.monthsToFinish > 0 && (
                <div className="text-xs text-slate-400 mt-1">
                  Estimated payoff in <span className="text-slate-200 font-semibold">{totals.monthsToFinish}</span>{' '}
                  months {monthlyRate > 0 && '(with current prepayments)'}.
                </div>
              )}
            </div>

            {/* Toggle schedule */}
            {advanced && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowSchedule(!showSchedule)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  {showSchedule ? (
                    <>
                      Hide Amortization <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Show Amortization <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ===== Amortization Schedule ===== */}
        {advanced && showSchedule && (
          <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Amortization Schedule</h3>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full text-sm border border-slate-700">
                <thead className="bg-slate-800/70 text-slate-300">
                  <tr>
                    <th className="px-4 py-2 border border-slate-700 text-left">Month</th>
                    <th className="px-4 py-2 border border-slate-700 text-right">Opening</th>
                    <th className="px-4 py-2 border border-slate-700 text-right">Interest</th>
                    <th className="px-4 py-2 border border-slate-700 text-right">Principal</th>
                    <th className="px-4 py-2 border border-slate-700 text-right">Prepayment</th>
                    <th className="px-4 py-2 border border-slate-700 text-right">Closing</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((r, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/60'}
                    >
                      <td className="px-4 py-2 border border-slate-800">{r.month}</td>
                      <td className="px-4 py-2 border border-slate-800 text-right">{fmt(r.openingBalance)}</td>
                      <td className="px-4 py-2 border border-slate-800 text-right">{fmt(r.interest)}</td>
                      <td className="px-4 py-2 border border-slate-800 text-right">{fmt(r.principal)}</td>
                      <td className="px-4 py-2 border border-slate-800 text-right">{fmt(r.prepayment)}</td>
                      <td className="px-4 py-2 border border-slate-800 text-right">{fmt(r.closingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {schedule.map((r, idx) => (
                <div key={idx} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-slate-200">Month {r.month}</div>
                    <TrendingUp className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="text-sm text-slate-300">
                    <div className="flex justify-between"><span>Opening</span><span>{fmt(r.openingBalance)}</span></div>
                    <div className="flex justify-between"><span>Interest</span><span>{fmt(r.interest)}</span></div>
                    <div className="flex justify-between"><span>Principal</span><span>{fmt(r.principal)}</span></div>
                    <div className="flex justify-between"><span>Prepayment</span><span>{fmt(r.prepayment)}</span></div>
                    <div className="flex justify-between"><span>Closing</span><span>{fmt(r.closingBalance)}</span></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 grid sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-emerald-900/20 border border-emerald-800/40 p-3">
                <div className="text-xs text-slate-400">Months to Payoff</div>
                <div className="text-lg font-semibold text-emerald-300">{totals.monthsToFinish}</div>
              </div>
              <div className="rounded-lg bg-amber-900/20 border border-amber-800/40 p-3">
                <div className="text-xs text-slate-400">Total Interest</div>
                <div className="text-lg font-semibold text-amber-300">{fmt(totals.totalInterest)}</div>
              </div>
              <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-3">
                <div className="text-xs text-slate-400">Total Paid</div>
                <div className="text-lg font-semibold text-slate-100">{fmt(totals.totalPaid)}</div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Content / SEO Sections (dark theme) ===== */}
        <div className="max-w-5xl mx-auto mt-10 space-y-10 text-slate-200">
          <h1 className="text-2xl md:text-3xl font-extrabold text-center">
            Loan EMI Calculator – Plan Your Repayments Smartly
          </h1>
          <p className="text-center text-slate-300">
            Compute your monthly EMI, total interest, and total payable with precision. Use Advanced mode to
            simulate prepayments and view a full amortization schedule.
          </p>

          <AdBanner type="bottom" />

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">How EMI Is Calculated</h2>
            <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-4">
              <code className="text-slate-100">
                <strong>EMI</strong> = P × r × (1 + r)<sup>n</sup> / [(1 + r)<sup>n</sup> − 1]
              </code>
              <ul className="list-disc list-inside mt-3 text-slate-300">
                <li><strong>P</strong> = Principal (loan amount)</li>
                <li><strong>r</strong> = Monthly interest rate (annual rate / 12 / 100)</li>
                <li><strong>n</strong> = Number of monthly installments</li>
              </ul>
            </div>
          </section>

          <AdBanner type="bottom" />

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">Tips to Reduce Interest</h2>
            <ul className="list-disc list-inside text-slate-300">
              <li>Make small recurring prepayments each month.</li>
              <li>Apply one-time lumpsums when possible (bonuses, tax refunds).</li>
              <li>Opt for shorter tenures if affordable — interest compounds over time.</li>
            </ul>
          </section>

          {/* Optional guide image from Supabase */}
          {guideImageUrl && (
            <div className="mt-6">
              <img
                src={guideImageUrl}
                alt="EMI Guide"
                className="w-full max-w-3xl mx-auto rounded-xl border border-slate-700"
              />
            </div>
          )}

          {/* Related Calculators */}
          <RelatedCalculators currentPath="/loan-emi-calculator" category="currency-finance" />
        </div>

        <AdBanner type="bottom" />
      </div>
    </>
  );
};

export default LoanEMICalculator;
 