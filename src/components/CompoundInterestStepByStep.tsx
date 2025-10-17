// components/CompoundInterestStepByStep.tsx
import React, { useMemo } from "react";

interface Props {
  principal: number;
  rate: number;
  rateUnit: string;
  timeData: { years: number; months: number; days: number };
  finalAmount: number;
}

const CompoundInterestStepByStep: React.FC<Props> = ({
  principal,
  rate,
  rateUnit,
  timeData,
  finalAmount
}) => {
  const steps = useMemo(() => {
    if (!principal || !rate || (!timeData.years && !timeData.months && !timeData.days)) return null;

    // Convert time to years
    const t = timeData.years + timeData.months / 12 + timeData.days / 365;

    // Compounding frequency
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

    const r = rate / 100;
    const ratePerPeriod = r / n;
    const totalPeriods = n * t;
    const factor = Math.pow(1 + ratePerPeriod, totalPeriods);

    return {
      P: principal,
      r,
      n,
      t,
      ratePerPeriod,
      totalPeriods,
      factor,
      FV: finalAmount || principal * factor
    };
  }, [principal, rate, rateUnit, timeData, finalAmount]);

  if (!steps) return null;

  return (
    <div className="bg-slate-800/50 p-4 rounded-xl mt-6 text-slate-200 space-y-2">
      <h3 className="text-xl font-semibold text-cyan-300 mb-3">
        Step-by-Step Calculation
      </h3>

      <pre className="text-slate-300">
        FV = P × (1 + r/n)^(n×t)
      </pre>

      <pre className="text-slate-300">
        FV = {steps.P.toLocaleString()} × (1 + {steps.r.toFixed(2)}/ {steps.n})^({steps.n}×{steps.t.toFixed(4)})
      </pre>

      <pre>r/n = {(steps.ratePerPeriod).toFixed(8)}</pre>
      <pre>n×t = {steps.totalPeriods.toFixed(4)}</pre>
      <pre>(1 + r/n)^(n×t) = {steps.factor.toFixed(6)}</pre>
      <pre>
        FV = {steps.P.toLocaleString()} × {steps.factor.toFixed(6)} ={" "}
        {steps.FV.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </pre>
    </div>
  );
};

export default CompoundInterestStepByStep;
