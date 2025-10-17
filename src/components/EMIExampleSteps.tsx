import React from "react";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

const EMIExampleSteps: React.FC = () => (
  <div className="mt-10 bg-[#0f172a] rounded-xl border border-slate-700 p-6 text-slate-100 shadow-lg">
    <h3 className="text-lg font-semibold text-cyan-300 mb-4">
      📘 Example EMI Calculation (Step-by-Step)
    </h3>

    {/* General Formula */}
    <div className="p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
      <p className="text-xs text-slate-400 mb-2">General Formula</p>
      <BlockMath math={String.raw`
EMI = \dfrac{P \times r \times (1+r)^n}{(1+r)^n - 1}
`} />
    </div>

    {/* Given */}
    <div className="p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
      <p className="text-xs text-slate-400 mb-2">Given Values</p>
      <BlockMath math={String.raw`
P = 250000, \quad r = 0.005833, \quad n = 360
`} />
    </div>

    {/* Step 1 */}
    <div className="p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
      <p className="text-xs text-slate-400 mb-2">Step 1 – Substitute Values</p>
      <BlockMath math={String.raw`
EMI = \dfrac{250000 \times 0.005833 \times (1 + 0.005833)^{360}}{(1 + 0.005833)^{360} - 1}
`} />
    </div>

    {/* Step 2 */}
    <div className="p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
      <p className="text-xs text-slate-400 mb-2">Step 2 – Simplify</p>
      <BlockMath math={String.raw`
(1 + 0.005833) = 1.005833
`} />
      <BlockMath math={String.raw`
(1.005833)^{360} = 8.115529202
`} />
    </div>

    {/* Step 3 */}
    <div className="p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
      <p className="text-xs text-slate-400 mb-2">Step 3 – Substitute Simplified Values</p>
      <BlockMath math={String.raw`
EMI = \dfrac{250000 \times 0.005833 \times 8.115529202}{8.115529202 - 1}
`} />
    </div>

    {/* Step 4 */}
    <div className="p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
      <p className="text-xs text-slate-400 mb-2">Step 4 – Compute Numerator & Denominator</p>
      <BlockMath math={String.raw`
\text{Numerator} = 250000 \times 0.005833 \times 8.115529202 = 11894.47046
`} />
      <BlockMath math={String.raw`
\text{Denominator} = 8.115529202 - 1 = 7.115529202
`} />
    </div>

    {/* Step 5 */}
    <div className="p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
      <p className="text-xs text-slate-400 mb-2">Step 5 – Final EMI Calculation</p>
      <BlockMath math={String.raw`
EMI = \dfrac{11894.47046}{7.115529202} = 1668.189079
`} />
    </div>

    {/* Final Result */}
    <div className="p-4 bg-[#0b1220] rounded-lg border border-indigo-600 text-center">
      <p className="text-sm text-indigo-400 mb-2">Final Answer</p>
      <BlockMath math={String.raw`
\boxed{EMI = 1668.19 \text{ per month}}
`} />
    </div>
  </div>
);

export default EMIExampleSteps;
