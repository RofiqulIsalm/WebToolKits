// src/components/CarLoanExplainBlock.tsx
import React from "react";

type Props = {
  carPrice: number;
  downPayment: number;
  loanYears: number;
  loanMonths: number;
  interestRate: number; // APR in %
  emi: number;
  totalPayment: number;
  totalInterest: number;
  currency: string;
  currentLocale: string;
  formatCurrency: (n: number, locale: string, ccy: string) => string;
};

const safe = (v: number, d = 2) =>
  Number.isFinite(v) ? v.toFixed(d) : "0.00";

const CarLoanExplainBlock: React.FC<Props> = ({
  carPrice,
  downPayment,
  loanYears,
  loanMonths,
  interestRate,
  emi,
  totalPayment,
  totalInterest,
  currency,
  currentLocale,
  formatCurrency,
}) => {
  const P = Math.max((carPrice || 0) - (downPayment || 0), 0); // principal
  const n = (loanYears || 0) * 12 + (loanMonths || 0);
  const r = (interestRate || 0) / 12 / 100;

  const carStr = formatCurrency(carPrice || 0, currentLocale, currency);
  const downStr = formatCurrency(downPayment || 0, currentLocale, currency);
  const Pstr = formatCurrency(P, currentLocale, currency);
  const emiStr = formatCurrency(emi || 0, currentLocale, currency);
  const totPayStr = formatCurrency(totalPayment || 0, currentLocale, currency);
  const totIntStr = formatCurrency(totalInterest || 0, currentLocale, currency);

  return (
    <>
      <h2 className="mt-12 mb-3 text-2xl font-extrabold tracking-tight text-center sm:text-left">
        <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
          🧾 How Your Car EMI Is Calculated
        </span>
      </h2>

      <div className="relative rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-[#0b1220]/90 p-4 sm:p-6 ring-1 ring-indigo-500/30 shadow-xl text-[13.5px] sm:text-sm leading-relaxed">
        <div className="pointer-events-none absolute inset-x-0 -top-0.5 h-0.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-emerald-500 opacity-60" />

        {/* Formula */}
        <p className="mb-3 text-center font-mono text-[15px] leading-7 text-indigo-300">
          EMI = <span className="text-sky-300">[P × r × (1 + r)<sup>n</sup>]</span> ÷ <span className="text-sky-300">[(1 + r)<sup>n</sup> − 1]</span>
        </p>
        <p className="mb-4 text-center text-slate-300">
          where P = Loan Amount, r = monthly interest rate (APR/12), n = number of months
        </p>

        {/* Inputs row */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-4">
          <div className="bg-[#0f172a] px-3 py-2 rounded-lg border border-cyan-500/20">
            <div className="text-xs text-slate-300">Car Price</div>
            <div className="font-semibold text-white truncate">{carStr}</div>
          </div>
          <div className="bg-[#0f172a] px-3 py-2 rounded-lg border border-amber-500/20">
            <div className="text-xs text-slate-300">Down Payment</div>
            <div className="font-semibold text-white truncate">{downStr}</div>
          </div>
          <div className="bg-[#0f172a] px-3 py-2 rounded-lg border border-emerald-500/20">
            <div className="text-xs text-slate-300">Loan Amount (P)</div>
            <div className="font-semibold text-white truncate">{Pstr}</div>
          </div>
          <div className="bg-[#0f172a] px-3 py-2 rounded-lg border border-fuchsia-500/20">
            <div className="text-xs text-slate-300">Rate (APR)</div>
            <div className="font-semibold text-white truncate">{safe(interestRate, 2)}%</div>
          </div>
          <div className="bg-[#0f172a] px-3 py-2 rounded-lg border border-indigo-500/20">
            <div className="text-xs text-slate-300">Term (n)</div>
            <div className="font-semibold text-white truncate">
              {Math.max(n, 0)} mo
            </div>
          </div>
        </div>

        <div className="my-3 h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

        {/* Step-by-step */}
        <div className="space-y-2 font-mono">
          <div className="flex flex-wrap justify-between">
            <span className="font-semibold text-cyan-300">P = Car Price − Down Payment</span>
            <span className="text-white">
              {carStr} − {downStr} = {Pstr}
            </span>
          </div>
          <div className="flex flex-wrap justify-between">
            <span className="font-semibold text-emerald-300">r = APR ÷ 12 ÷ 100</span>
            <span className="text-white">
              {safe(interestRate, 4)}% ÷ 12 ÷ 100 = {Number.isFinite(r) ? r.toFixed(8) : "—"}
            </span>
          </div>
          <div className="flex flex-wrap justify-between">
            <span className="font-semibold text-fuchsia-300">n = Years × 12 + Months</span>
            <span className="text-white">
              {loanYears || 0}×12 + {loanMonths || 0} = {Math.max(n, 0)}
            </span>
          </div>
          <div className="flex flex-wrap justify-between">
            <span className="font-semibold text-sky-300">EMI (monthly)</span>
            <span className="text-white">{emiStr}</span>
          </div>
          <div className="flex flex-wrap justify-between">
            <span className="font-semibold text-indigo-300">Total Payment = EMI × n</span>
            <span className="text-white">{emiStr} × {Math.max(n, 0)} = {totPayStr}</span>
          </div>
          <div className="flex flex-wrap justify-between">
            <span className="font-semibold text-rose-300">Total Interest = Total Payment − P</span>
            <span className="text-white">{totPayStr} − {Pstr} = {totIntStr}</span>
          </div>
        </div>

        {/* Zero-interest hint */}
        <div className="mt-4 rounded-lg bg-slate-900/70 border border-slate-700 p-3">
          <p className="text-sm text-slate-300">
            {interestRate > 0 ? (
              <>For 0% APR, EMI simplifies to <span className="text-emerald-300 font-semibold">P ÷ n</span>.</>
            ) : (
              <>You’re using <span className="text-emerald-300 font-semibold">0% APR</span>. EMI = P ÷ n.</>
            )}
          </p>
        </div>

        {/* Summary tiles */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-center">
            <div className="text-sky-300 text-xs uppercase">Loan Amount</div>
            <div className="font-semibold text-white text-sm truncate">{Pstr}</div>
          </div>
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center">
            <div className="text-emerald-300 text-xs uppercase">Monthly EMI</div>
            <div className="font-semibold text-white text-sm truncate">{emiStr}</div>
          </div>
          <div className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-2 text-center">
            <div className="text-fuchsia-300 text-xs uppercase">Total Interest</div>
            <div className="font-semibold text-white text-sm truncate">{totIntStr}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CarLoanExplainBlock;
