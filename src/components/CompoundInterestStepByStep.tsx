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
    <div className="bg-slate-800/60 border border-slate-700 p-4 sm:p-6 rounded-2xl mt-6 text-slate-100">
      <h3 className="text-lg sm:text-xl font-semibold text-cyan-300 mb-3 text-center">
        Step-by-Step Calculation
      </h3>

      <div className="flex flex-col space-y-3 text-sm sm:text-base leading-relaxed overflow-hidden">
        <div className="bg-slate-900/60 p-3 rounded-lg overflow-x-auto text-center sm:text-left">
          <code className="whitespace-pre-wrap break-words block text-cyan-200 text-[0.9rem] sm:text-base">
            FV = P × (1 + r/n)^(n×t)
          </code>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-lg overflow-x-auto">
          <code className="whitespace-pre-wrap break-words block text-slate-300">
            FV = {steps.P.toLocaleString()} × (1 + {steps.r.toFixed(2)}/{steps.n})^(
            {steps.n}×{steps.t.toFixed(4)})
          </code>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="bg-slate-900/60 p-3 rounded-lg text-center sm:text-left">
            <code>r/n = {steps.ratePerPeriod.toFixed(8)}</code>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-lg text-center sm:text-left">
            <code>n×t = {steps.totalPeriods.toFixed(4)}</code>
          </div>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-lg text-center sm:text-left">
          <code>(1 + r/n)^(n×t) = {steps.factor.toFixed(6)}</code>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-lg text-center sm:text-left font-semibold">
          <code>
            FV = {steps.P.toLocaleString()} × {steps.factor.toFixed(6)} ={" "}
            <span className="text-emerald-400 font-bold">
              {steps.FV.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </code>
        </div>
      </div>
    </div>
  );
};

export default CompoundInterestStepByStep;
