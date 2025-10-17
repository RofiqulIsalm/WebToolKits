import React, { useMemo } from "react";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

interface Props {
  principal: number;
  annualRate: number;
  years: number;
  months: number;
}

const EMIStepByStepDynamic: React.FC<Props> = ({
  principal,
  annualRate,
  years,
  months,
}) => {
  const n = Math.max(1, years * 12 + months);
  const r = annualRate / 12 / 100;

  const calculated = useMemo(() => {
    if (principal <= 0 || annualRate < 0 || n <= 0) return null;

    const onePlusR = 1 + r;
    const pow = Math.pow(onePlusR, n);
    const numerator = principal * r * pow;
    const denominator = pow - 1;
    const emi = denominator === 0 ? 0 : numerator / denominator;
    const totalPayment = emi * n;
    const totalInterest = totalPayment - principal;

    return {
      onePlusR,
      pow,
      numerator,
      denominator,
      emi,
      totalPayment,
      totalInterest,
    };
  }, [principal, r, n]);

  if (!calculated) return null;

  return (
    <div className="mt-10 bg-[#0f172a] rounded-xl border border-slate-700 p-4 sm:p-6 text-slate-100 shadow-lg overflow-x-auto">
      <h3 className="text-base sm:text-lg font-semibold text-cyan-300 mb-3 sm:mb-4">
        📘 Step-by-Step EMI Calculation (Based on Your Input)
      </h3>

      {/* Formula */}
      <div className="p-3 sm:p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
        <p className="text-[11px] sm:text-xs text-slate-400 mb-2">Formula</p>
        <div className="overflow-x-auto">
          <BlockMath math={String.raw`
EMI = \dfrac{P \times r \times (1+r)^n}{(1+r)^n - 1}
`} />
        </div>
      </div>

      {/* Inputs */}
      <div className="p-3 sm:p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
        <p className="text-[11px] sm:text-xs text-slate-400 mb-2">Your Input</p>
        <div className="overflow-x-auto">
          <BlockMath
            math={String.raw`
P = ${principal.toFixed(2)}, \quad r = ${r.toFixed(6)}, \quad n = ${n}
`}
          />
        </div>
      </div>

      {/* Step 1 */}
      <div className="p-3 sm:p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
        <p className="text-[11px] sm:text-xs text-slate-400 mb-2">
          Step 1 — Substitute Values
        </p>
        <div className="overflow-x-auto">
          <BlockMath
            math={String.raw`
EMI = \dfrac{${principal.toFixed(2)} \times ${r.toFixed(
              6
            )} \times (1 + ${r.toFixed(6)})^{${n}}}{(1 + ${r.toFixed(
              6
            )})^{${n}} - 1}
`}
          />
        </div>
      </div>

      {/* Step 2 */}
      <div className="p-3 sm:p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
        <p className="text-[11px] sm:text-xs text-slate-400 mb-2">
          Step 2 — Simplify
        </p>
        <div className="overflow-x-auto space-y-2">
          <BlockMath
            math={String.raw`
(1 + r) = ${calculated.onePlusR.toFixed(6)}
`}
          />
          <BlockMath
            math={String.raw`
(1 + r)^n = ${calculated.pow.toFixed(6)}
`}
          />
        </div>
      </div>

      {/* Step 3 */}
      <div className="p-3 sm:p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
        <p className="text-[11px] sm:text-xs text-slate-400 mb-2">
          Step 3 — Substitute Simplified Values
        </p>
        <div className="overflow-x-auto">
          <BlockMath
            math={String.raw`
EMI = \dfrac{${principal.toFixed(2)} \times ${r.toFixed(
              6
            )} \times ${calculated.pow.toFixed(
              6
            )}}{${calculated.pow.toFixed(6)} - 1}
`}
          />
        </div>
      </div>

      {/* Step 4 */}
      <div className="p-3 sm:p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
        <p className="text-[11px] sm:text-xs text-slate-400 mb-2">
          Step 4 — Compute Components
        </p>
        <div className="overflow-x-auto space-y-2">
          <BlockMath
            math={String.raw`
\text{Numerator} = ${principal.toFixed(2)} \times ${r.toFixed(
              6
            )} \times ${calculated.pow.toFixed(6)} = ${calculated.numerator.toFixed(
              6
            )}
`}
          />
          <BlockMath
            math={String.raw`
\text{Denominator} = ${calculated.pow.toFixed(
              6
            )} - 1 = ${calculated.denominator.toFixed(6)}
`}
          />
        </div>
      </div>

      {/* Step 5 */}
      <div className="p-3 sm:p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
        <p className="text-[11px] sm:text-xs text-slate-400 mb-2">
          Step 5 — Final EMI Calculation
        </p>
        <div className="overflow-x-auto">
          <BlockMath
            math={String.raw`
EMI = \dfrac{${calculated.numerator.toFixed(
              6
            )}}{${calculated.denominator.toFixed(6)}} = ${calculated.emi.toFixed(2)}
`}
          />
        </div>
      </div>

      {/* Step 6 */}
      <div className="p-3 sm:p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
        <p className="text-[11px] sm:text-xs text-slate-400 mb-2">
          Step 6 — Total Payment
        </p>
        <div className="overflow-x-auto">
          <BlockMath
            math={String.raw`
\text{Total Payment} = ${calculated.emi.toFixed(2)} \times ${n} = ${calculated.totalPayment.toFixed(
              2
            )}
`}
          />
        </div>
      </div>

      {/* Step 7 */}
      <div className="p-3 sm:p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
        <p className="text-[11px] sm:text-xs text-slate-400 mb-2">
          Step 7 — Total Interest
        </p>
        <div className="overflow-x-auto">
          <BlockMath
            math={String.raw`
\text{Total Interest} = ${calculated.totalPayment.toFixed(2)} - ${principal.toFixed(
              2
            )} = ${calculated.totalInterest.toFixed(2)}
`}
          />
        </div>
      </div>

      {/* Final Answer */}
<div className="p-4 bg-[#0b1220] rounded-lg border border-indigo-600">
  <p className="text-sm text-indigo-400 mb-4 text-center">Final Results</p>

  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {/* Monthly EMI */}
    <div className="bg-indigo-900/40 border border-indigo-600 rounded-xl p-4 text-center shadow-md">
      <p className="text-xs text-indigo-300 uppercase mb-1 tracking-wide">Monthly EMI</p>
      <p className="text-xl font-bold text-indigo-100">
        {calculated.emi.toFixed(2)}
      </p>
      <p className="text-[11px] text-indigo-400 mt-1">per month</p>
    </div>

    {/* Total Payment */}
    <div className="bg-emerald-900/30 border border-emerald-600 rounded-xl p-4 text-center shadow-md">
      <p className="text-xs text-emerald-300 uppercase mb-1 tracking-wide">Total Payment</p>
      <p className="text-xl font-bold text-emerald-100">
        {calculated.totalPayment.toFixed(2)}
      </p>
    </div>

    {/* Total Interest */}
    <div className="bg-amber-900/30 border border-amber-600 rounded-xl p-4 text-center shadow-md">
      <p className="text-xs text-amber-300 uppercase mb-1 tracking-wide">Total Interest</p>
      <p className="text-xl font-bold text-amber-100">
        {calculated.totalInterest.toFixed(2)}
      </p>
    </div>
  </div>
</div>
</div>
  );
};

export default EMIStepByStepDynamic;
