import React from "react";

type Props = {
  income: number;
  debts: number;
  dti: number;
  currency: string;
  currentLocale: string;
  formatCurrency: (n: number, locale: string, ccy: string) => string;
};

const DTIExplainBlock: React.FC<Props> = ({ income, debts, dti, currency, currentLocale, formatCurrency }) => {
  const fmtC = (x: number) => formatCurrency(Math.max(0, x || 0), currentLocale, currency);
  const safeIncome = Math.max(income, 0);
  const safeDebts = Math.max(debts, 0);
  const ratioStr = Number.isFinite(dti) ? dti.toFixed(2) : "—";

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-center sm:text-left">
        <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-emerald-300 bg-clip-text text-transparent">
          📘 How We Calculate Your DTI
        </span>
      </h2>

      <div className="rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-[#0b1220]/90 p-4 sm:p-6 ring-1 ring-cyan-500/30 shadow-xl text-[13.5px] sm:text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          <div className="bg-[#0f172a] px-3 py-2 rounded-lg border border-cyan-500/20">
            <div className="text-xs text-slate-300">Gross Monthly Income</div>
            <div className="font-semibold text-white truncate">{fmtC(safeIncome)}</div>
          </div>
          <div className="bg-[#0f172a] px-3 py-2 rounded-lg border border-rose-500/20">
            <div className="text-xs text-slate-300">Total Monthly Debts</div>
            <div className="font-semibold text-white truncate">{fmtC(safeDebts)}</div>
          </div>
        </div>

        <div className="my-3 h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

        <div className="space-y-2 font-mono leading-relaxed">
          <div className="flex flex-wrap justify-between">
            <span className="font-semibold text-cyan-300">DTI (%) = (Debts ÷ Income) × 100</span>
            <span className="text-white">
              ({fmtC(safeDebts)} ÷ {fmtC(safeIncome)}) × 100 = <b>{ratioStr}%</b>
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-slate-900/70 border border-slate-700 p-3 text-slate-300">
          <p className="text-sm">
            Tip: Pay down revolving cards and avoid new credit before applying — nudging DTI below 36% improves approval odds.
          </p>
        </div>
      </div>
    </section>
  );
};

export default DTIExplainBlock;
