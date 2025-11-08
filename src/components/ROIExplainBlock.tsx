// src/components/ROIExplainBlock.tsx
import React from "react";

type ROIExplainProps = {
  initialInvestment: number;
  additionalContributions: number;
  finalValue: number;
  years: number;
  months: number;
  currentLocale: string;
  currency: string;
  formatCurrency: (n: number, locale: string, ccy: string) => string;
};

const safeFixed = (v: number, d = 2) =>
  Number.isFinite(v) ? v.toFixed(d) : "0.00";

const ROIExplainBlock: React.FC<ROIExplainProps> = ({
  initialInvestment,
  additionalContributions,
  finalValue,
  years,
  months,
  currentLocale,
  currency,
  formatCurrency,
}) => {
  const P0 = Number(initialInvestment) || 0;
  const C = Number(additionalContributions) || 0;
  const V = Number(finalValue) || 0;
  const T = (Number(years) || 0) + (Number(months) || 0) / 12;

  const invested = P0 + C;
  const gain = V - invested;
  const ratio = invested > 0 ? V / invested : NaN;
  const roiPct = invested > 0 ? (gain / invested) * 100 : NaN;
  const annualized =
    invested > 0 && T > 0 ? (Math.pow(V / invested, 1 / T) - 1) * 100 : NaN;

  const P0Str = formatCurrency(P0, currentLocale, currency);
  const CStr = formatCurrency(C, currentLocale, currency);
  const VStr = formatCurrency(V, currentLocale, currency);
  const investedStr = formatCurrency(invested, currentLocale, currency);
  const gainStr = formatCurrency(gain, currentLocale, currency);

  return (
    <>
      <h2
        id="how-calculated"
        className="mt-12 mb-3 text-2xl font-extrabold tracking-tight text-center sm:text-left"
      >
        <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
          📊 How ROI is Calculated
        </span>
      </h2>

      <p className="mb-4 text-slate-300 text-sm sm:text-base text-center sm:text-left">
        We use total invested and final value to compute ROI, and normalize by years for annualized ROI:
      </p>

      <div className="relative rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-[#0b1220]/90 p-4 sm:p-6 ring-1 ring-indigo-500/30 shadow-xl text-[13.5px] sm:text-sm leading-relaxed">
        <div className="pointer-events-none absolute inset-x-0 -top-0.5 h-0.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-emerald-500 opacity-60" />

        {/* Formulas */}
        <p className="mb-4 text-center font-mono text-[15px] leading-7 text-indigo-300">
          ROI% = <span className="text-sky-300">(V − (P₀ + C)) ÷ (P₀ + C)</span> × 100
        </p>
        <p className="mb-4 text-center font-mono text-[15px] leading-7 text-fuchsia-300">
          Annualized% = {invested > 0 && T > 0 ? "[(V ÷ (P₀ + C))^(1/T) − 1] × 100" : "—"}
        </p>

        {/* Inputs */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 mb-4">
          <div className="flex flex-wrap justify-between items-center gap-1 sm:gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-cyan-500/20">
            <span className="font-semibold text-cyan-300">P₀</span>
            <span className="text-slate-300">Initial</span>
            <span className="font-semibold text-white truncate">{P0Str}</span>
          </div>
          <div className="flex flex-wrap justify-between items-center gap-1 sm:gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-amber-500/20">
            <span className="font-semibold text-amber-300">C</span>
            <span className="text-slate-300">Contrib.</span>
            <span className="font-semibold text-white truncate">{CStr}</span>
          </div>
          <div className="flex flex-wrap justify-between items-center gap-1 sm:gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-fuchsia-500/20">
            <span className="font-semibold text-fuchsia-300">V</span>
            <span className="text-slate-300">Final</span>
            <span className="font-semibold text-white truncate">{VStr}</span>
          </div>
          <div className="flex flex-wrap justify-between items-center gap-1 sm:gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-emerald-500/20">
            <span className="font-semibold text-emerald-300">T</span>
            <span className="text-slate-300">Years</span>
            <span className="font-semibold text-white truncate">
              {T > 0 ? T.toFixed(3) : "—"}
            </span>
          </div>
        </div>

        <div className="my-3 h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

        {/* Steps */}
        <div className="space-y-2 font-mono break-words">
          <div className="flex flex-wrap justify-between">
            <span className="font-semibold text-indigo-300">Invested = P₀ + C</span>
            <span className="text-white">
              {P0Str} + {CStr} = {investedStr}
            </span>
          </div>
          <div className="flex flex-wrap justify-between">
            <span className="font-semibold text-emerald-300">Gain = V − Invested</span>
            <span className="text-white">
              {VStr} − {investedStr} = {gainStr}
            </span>
          </div>
          <div className="flex flex-wrap justify-between">
            <span className="font-semibold text-rose-300">ROI% = (Gain ÷ Invested) × 100</span>
            <span className="text-white">
              {invested > 0 ? `${safeFixed((gain / invested) * 100, 2)}%` : "—"}
            </span>
          </div>
          <div className="flex flex-wrap justify-between">
            <span className="font-semibold text-sky-300">Ratio = V ÷ Invested</span>
            <span className="text-white">
              {invested > 0 && Number.isFinite(ratio) ? Number(ratio).toFixed(9) : "—"}
            </span>
          </div>
          <div className="flex flex-wrap justify-between">
            <span className="font-semibold text-fuchsia-300">
              Annualized% = (Ratio<sup>1/T</sup> − 1) × 100
            </span>
            <span className="text-white">
              {invested > 0 && T > 0 ? `${safeFixed(annualized, 2)}%` : "—"}
            </span>
          </div>

          {/* One <pre> to avoid nesting issues */}
          <p className="mb-2 text-slate-300">Math for ROI :</p>
          <pre className="bg-slate-900/70 p-4 rounded-lg overflow-x-auto text-[13px] border border-slate-700">
{[
`Invested = P0 + C`,
`Invested = ${P0Str} + ${CStr}`,
`Invested = ${investedStr}`,
``,
`Gain = V − Invested`,
`Gain = ${VStr} − ${investedStr}`,
`Gain = ${gainStr}`,
``,
`ROI% = (Gain ÷ Invested) × 100`,
`ROI% = ${invested > 0 ? safeFixed(roiPct, 2) : "—"} %`,
``,
`Annualized% = [(V ÷ Invested)^(1/T) − 1] × 100`,
`Annualized% = ${invested > 0 && T > 0 ? safeFixed(annualized, 2) : "—"} %`,
].join("\n")}
          </pre>
        </div>

        {/* Summary tiles */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-center">
            <div className="text-sky-300 text-xs uppercase">Invested</div>
            <div className="font-semibold text-white text-sm truncate">{investedStr}</div>
          </div>
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center">
            <div className="text-emerald-300 text-xs uppercase">Gain / Loss</div>
            <div className={`font-semibold text-sm truncate ${gain < 0 ? "text-rose-300" : "text-white"}`}>{gainStr}</div>
          </div>
          <div className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-2 text-center">
            <div className="text-fuchsia-300 text-xs uppercase">Ratio (V ÷ Invested)</div>
            <div className="font-semibold text-white text-sm truncate">
              {invested > 0 && Number.isFinite(ratio) ? Number(ratio).toFixed(6) : "—"}
            </div>
          </div>
        </div>

        {/* Final badges */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-[#0f172a] px-4 py-3 ring-1 ring-emerald-500/30">
            <span className="text-sm text-emerald-300 whitespace-nowrap">📈 Total ROI</span>
            <span className="text-lg sm:text-xl font-bold tracking-wide text-white">
              {invested > 0 ? `${safeFixed(roiPct, 2)}%` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-xl bg-[#0f172a] px-4 py-3 ring-1 ring-indigo-500/30">
            <span className="text-sm text-indigo-300 whitespace-nowrap">⏱️ Annualized ROI</span>
            <span className="text-lg sm:text-xl font-bold tracking-wide text-white">
              {invested > 0 && T > 0 ? `${safeFixed(annualized, 2)}%` : "—"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ROIExplainBlock;
