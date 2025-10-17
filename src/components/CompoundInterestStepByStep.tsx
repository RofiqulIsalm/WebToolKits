import React, { useMemo } from "react";
import { MathJaxContext, MathJax } from "better-react-mathjax";

interface Props {
  principal: number;
  rate: number;
  rateUnit: "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "custom";
  timeData: { years: number; months: number; days: number };
  finalAmount: number;
}

const CompoundInterestStepByStep: React.FC<Props> = ({
  principal = 0,
  rate = 0,
  rateUnit,
  timeData,
  finalAmount,
}) => {
  const s = useMemo(() => {
    const P = principal;
    const r = rate / 100;
    const t = timeData.years + timeData.months / 12 + timeData.days / 365;

    const n =
      rateUnit === "daily"
        ? 365
        : rateUnit === "weekly"
        ? 52
        : rateUnit === "monthly"
        ? 12
        : rateUnit === "quarterly"
        ? 4
        : 1;

    const rp = r / n;
    const np = n * t;
    const f = Math.pow(1 + rp, np);
    const FV = finalAmount || P * f;
    return { P, r, n, t, rp, np, f, FV };
  }, [principal, rate, rateUnit, timeData, finalAmount]);

  if (!s.P || !s.r) return null;

  return (
    <div className="bg-slate-800/50 p-6 rounded-xl mt-6 text-center text-slate-100">
      <h3 className="text-xl font-semibold text-cyan-300 mb-4">
        Step-by-Step Calculation
      </h3>
      <MathJaxContext>
        <div className="space-y-4 text-lg leading-relaxed">
          <MathJax>{`\\[FV = P \\times (1 + r/n)^{n \\times t}\\]`}</MathJax>
          <MathJax>{`\\[FV = ${s.P.toLocaleString()} \\times (1 + ${s.r.toFixed(
            2
          )}/${s.n})^{${s.n}\\times${s.t.toFixed(4)}}\\]`}</MathJax>
          <MathJax>{`\\[\\frac{${s.r.toFixed(2)}}{${s.n}} = ${s.rp.toFixed(
            8
          )}\\]`}</MathJax>
          <MathJax>{`\\[${s.n}\\times${s.t.toFixed(4)} = ${s.np.toFixed(
            4
          )}\\]`}</MathJax>
          <MathJax>{`\\[(1 + ${s.rp.toFixed(8)})^{${s.np.toFixed(
            4
          )}} = ${s.f.toFixed(6)}\\]`}</MathJax>
          <MathJax>{`\\[FV = ${s.P.toLocaleString()} \\times ${s.f.toFixed(
            6
          )} = \\textbf{${s.FV.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}}\\]`}</MathJax>
        </div>
      </MathJaxContext>
    </div>
  );
};

export default CompoundInterestStepByStep;
