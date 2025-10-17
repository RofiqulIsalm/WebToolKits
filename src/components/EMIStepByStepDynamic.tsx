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

    return {
      onePlusR,
      pow,
      numerator,
      denominator,
      emi,
    };
  }, [principal, r, n]);

  if (!calculated) return null;

  return (
    <div className="mt-10 bg-[#0f172a] rounded-xl border border-slate-700 p-6 text-slate-100 shadow-lg">
      <h3 className="text-lg font-semibold text-cyan-300 mb-4">
        📘 Step-by-Step EMI Calculation (Based on Your Input)
      </h3>

      <div className="p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
        <p className="text-xs text-slate-400 mb-2">Formula</p>
        <BlockMath
          math={String.raw`
EMI = \dfrac{P \times r \times (1+r)^n}{(1+r)^n - 1}
`}
        />
      </div>

      <div className="p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
        <p className="text-xs text-slate-400 mb-2">Your Input</p>
        <BlockMath
          math={String.raw`
P = ${principal.toFixed(2)}, \quad r = ${(r).toFixed(6)}, \quad n = ${n}
`}
        />
      </div>

      <div className="p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
        <p className="text-xs text-slate-400 mb-2">Step 1 — Substitute Values</p>
        <BlockMath
          math={String.raw`
EMI = \dfrac{${principal.toFixed(2)} \times ${r.toFixed(
            6
          )} \times (1 + ${r.toFixed(6)})^{${n}}}{(1 + ${r.toFixed(6)})^{${n}} - 1}
`}
        />
      </div>

      <div className="p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
        <p className="text-xs text-slate-400 mb-2">Step 2 — Simplify</p>
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

      <div className="p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
        <p className="text-xs text-slate-400 mb-2">Step 3 — Substitute Simplified Values</p>
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

      <div className="p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
        <p className="text-xs text-slate-400 mb-2">Step 4 — Compute Components</p>
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
\text{Denominator} = ${calculated.pow.toFixed(6)} - 1 = ${calculated.denominator.toFixed(6)}
`}
        />
      </div>

      <div className="p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
        <p className="text-xs text-slate-400 mb-2">Step 5 — Final Calculation</p>
        <BlockMath
          math={String.raw`
EMI = \dfrac{${calculated.numerator.toFixed(
            6
          )}}{${calculated.denominator.toFixed(6)}} = ${calculated.emi.toFixed(2)}
`}
        />
      </div>

      <div className="p-4 bg-[#0b1220] rounded-lg border border-indigo-600 text-center">
        <p className="text-sm text-indigo-400 mb-2">Final Answer</p>
        <BlockMath
          math={String.raw`
\boxed{EMI = ${calculated.emi.toFixed(2)} \text{ per month}}
`}
        />
      </div>
    </div>
  );
};

export default EMIStepByStepDynamic;
