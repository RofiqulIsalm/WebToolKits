import React from "react";

type Props = {
  income: number;
  expenses: number;
  debtRatio: number; // %
  interestRate: number; // APR %
  loanYears: number;
  maxLoan: number;
  emi: number;
  totalPayment: number;
  totalInterest: number;
  currency: string;
  currentLocale: string;
  formatCurrency: (n: number, locale: string, ccy: string) => string;
};

const LoanAffordabilityExplainBlock: React.FC<Props> = ({
  income,
  expenses,
  debtRatio,
  interestRate,
  loanYears,
  maxLoan,
  emi,
  totalPayment,
  totalInterest,
  currency,
  currentLocale,
  formatCurrency,
}) => {
  const n = Math.max(loanYears, 0) * 12;
  const r = (interestRate || 0) / 12 / 100;
  const Araw = (income - expenses) * (debtRatio / 100);
  const A = Math.max(0, Araw); // affordable EMI

  const fmtC = (x: number) => formatCurrency(x || 0, currentLocale, currency);
  const fmt = (x: number, d = 2) => Number.isFinite(x) ? x.toFixed(d) : "—";

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-center sm:text-left">
        <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-emerald-300 bg-clip-text text-transparent">
          📘 How We Estimate Your Borrowing Power
        </span>
      </h2>

      <div className="rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-[#0b1220]/90 p-4 sm:p-6 ring-1 ring-cyan-500/30 shadow-xl text-[13.5px] sm:text-sm">
        {/* Inputs snapshot */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-4">
          <div className="bg-[#0f172a] px-3 py-2 rounded-lg border border-cyan-500/20">
            <div className="text-xs text-slate-300">Income (mo)</div>
            <div className="font-semibold text-white truncate">{fmtC(income)}</div>
          </div>
          <div className="bg-[#0f172a] px-3 py-2 rounded-lg border border-amber-500/20">
            <div className="text-xs text-slate-300">Expenses (mo)</div>
            <div className="font-semibold text-white truncate">{fmtC(expenses)}</div>
          </div>
          <div className="bg-[#0f172a] px-3 py-2 rounded-lg border border-indigo-500/20">
            <div className="text-xs text-slate-300">DTI</div>
            <div className="font-semibold text-white truncate">{fmt(debtRatio, 1)}%</div>
          </div>
          <div className="bg-[#0f172a] px-3 py-2 rounded-lg border border-fuchsia-500/20">
            <div className="text-xs text-slate-300">APR</div>
            <div className="font-semibold text-white truncate">{fmt(interestRate, 2)}%</div>
          </div>
          <div className="bg-[#0f172a] px-3 py-2 rounded-lg border border-emerald-500/20">
            <div className="text-xs text-slate-300">Term</div>
            <div className="font-semibold text-white truncate">{n} mo</div>
          </div>
        </div>

        <div className="my-3 h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

        {/* Steps */}
        <div className="space-y-2 font-mono leading-relaxed">
          <div className="flex flex-wrap justify-between">
            <span className="font-semibold text-cyan-300">Affordable EMI (A) = (Income − Expenses) × DTI</span>
            <span className="text-white">
              ({fmtC(income)} − {fmtC(expenses)}) × {fmt(debtRatio, 1)}% = {fmtC(A)}
            </span>
          </div>

          <div className="flex flex-wrap justify-between">
            <span className="font-semibold text-emerald-300">Monthly rate (r) = APR ÷ 12 ÷ 100</span>
            <span className="text-white">{fmt(interestRate, 4)}% ÷ 12 ÷ 100 = {Number.isFinite(r) ? r.toFixed(8) : "—"}</span>
          </div>

          <div className="flex flex-wrap justify-between">
            <span className="font-semibold text-fuchsia-300">Months (n) = Years × 12</span>
            <span className="text-white">{loanYears} × 12 = {n}</span>
          </div>

          <div className="flex flex-wrap justify-between">
            <span className="font-semibold text-sky-300">Max Loan (P)</span>
            <span className="text-white">
              {r === 0
                ? <>A × n = {fmtC(A)} × {n} = {fmtC(A * n)}</>
                : <>A × [(1+r)<sup>n</sup> − 1] ÷ [r × (1+r)<sup>n</sup>] = {fmtC(maxLoan)}</>}
            </span>
          </div>

          <div className="flex flex-wrap justify-between">
            <span className="font-semibold text-indigo-300">Monthly EMI (A)</span>
            <span className="text-white">{fmtC(emi)}</span>
          </div>

          <div className="flex flex-wrap justify-between">
            <span className="font-semibold text-rose-300">Total Payment = A × n</span>
            <span className="text-white">{fmtC(emi)} × {n} = {fmtC(totalPayment)}</span>
          </div>

          <div className="flex flex-wrap justify-between">
            <span className="font-semibold text-amber-300">Total Interest = Total Payment − Max Loan</span>
            <span className="text-white">{fmtC(totalPayment)} − {fmtC(maxLoan)} = {fmtC(totalInterest)}</span>
          </div>
        </div>

        {/* Guidance */}
        <div className="mt-4 rounded-lg bg-slate-900/70 border border-slate-700 p-3 text-slate-300">
          <p className="text-sm">
            Tip: Lower expenses, a longer term, or a lower APR will generally increase A (affordable EMI) and raise your borrowing power.
          </p>
        </div>
      </div>
    </section>
  );
};

export default LoanAffordabilityExplainBlock;
