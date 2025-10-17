import React, { useMemo } from "react";

type RateUnit = "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "custom";

interface Props {
  principal: number;
  rate: number;
  rateUnit: RateUnit;
  timeData: { years: number; months: number; days: number };
  includeAllDays: boolean;
  selectedDays: string[]; // ['SU','MO','TU','WE','TH','FR','SA']
  customRate: { years: number; months: number; days: number }; // interval for "custom"
  // optional: pass the already computed final, but we recompute here using the same logic to show steps
  finalAmount?: number;
}

function moneyFmt(n: number) {
  if (!isFinite(n)) return "$0";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2, });
}

const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function daysFromTime(t: {years:number; months:number; days:number}) {
  return t.years * 365 + t.months * 30 + t.days;
}

function perDayRate(rate: number, unit: RateUnit) {
  const r = rate / 100;
  switch (unit) {
    case "daily":     return r;           // 7% per day -> 0.07 applied each included day
    case "weekly":    return r / 7;       // smoothed daily accrual
    case "monthly":   return r / 30;
    case "quarterly": return r / 90;
    case "yearly":    return r / 365;
    case "custom":    return 0;           // handled separately
  }
}

const CompoundInterestStepByStep: React.FC<Props> = ({
  principal,
  rate,
  rateUnit,
  timeData,
  includeAllDays,
  selectedDays,
  customRate,
  finalAmount,
}) => {

  const step = useMemo(() => {
    const P = principal || 0;
    const daysTotal = daysFromTime(timeData);
    if (P <= 0 || rate <= 0 || daysTotal <= 0) return null;

    // figure out how many days are actually "included"
    const start = new Date();
    let appliedDays = 0;
    if (includeAllDays) {
      appliedDays = daysTotal;
    } else {
      for (let i = 0; i < daysTotal; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        if (selectedDays.includes(dayMap[d.getDay()])) appliedDays++;
      }
    }

    // === Two paths: (A) non-custom uses tiny daily accrual, (B) custom uses periodic jumps ===
    if (rateUnit !== "custom") {
      const rDaily = perDayRate(rate, rateUnit);
      const growthFactor = Math.pow(1 + rDaily, appliedDays);
      const FV = P * growthFactor;

      return {
        mode: "noncustom" as const,
        P,
        rDaily,
        appliedDays,
        growthFactor,
        FV,
        // nice human text for unit
        unitLabel:
          rateUnit === "daily" ? "daily" :
          rateUnit === "weekly" ? "weekly (spread across days)" :
          rateUnit === "monthly" ? "monthly (spread across days)" :
          rateUnit === "quarterly" ? "every 3 months (spread across days)" :
          "yearly (spread across days)",
      };
    }

    // CUSTOM: apply r (per period) every intervalDays; in-between days earn 0
    const intervalDays = Math.max(0, daysFromTime(customRate));
    if (intervalDays <= 0) return null;

    const applications =
      includeAllDays
        ? Math.floor(daysTotal / intervalDays)
        : // count how many FULL intervals fit into the included sequence while staying calendar-aligned
          Math.floor(appliedDays / intervalDays);

    const rPerPeriod = rate / 100;
    const growthFactor = Math.pow(1 + rPerPeriod, applications);
    const FV = P * growthFactor;

    return {
      mode: "custom" as const,
      P,
      rPerPeriod,
      intervalDays,
      applications,
      growthFactor,
      FV,
    };
  }, [principal, rate, rateUnit, timeData, includeAllDays, selectedDays, customRate]);

  if (!step) return null;

  // ---------- Render pretty steps ----------
  return (
    <div className="bg-slate-800/50 p-4 sm:p-5 rounded-xl border border-slate-700 mt-4 text-slate-200">
      <h3 className="text-xl font-semibold text-cyan-300 mb-3">Step-by-Step Calculation</h3>

      {step.mode === "noncustom" ? (
        <div className="space-y-2 font-mono text-sm sm:text-base">
          <pre>Formula:  FV = P × (1 + r_daily)^(days_applied)</pre>
          <pre>P = {moneyFmt(step.P)}   r_daily = {(step.rDaily).toFixed(8)}   days_applied = {step.appliedDays}</pre>
          <pre>(1 + r_daily) = {(1 + step.rDaily).toFixed(8)}</pre>
          <pre>Growth factor = (1 + r_daily)^{step.appliedDays} = {step.growthFactor.toFixed(8)}</pre>
          <pre>FV = {moneyFmt(step.P)} × {step.growthFactor.toFixed(8)} = <b>{moneyFmt(step.FV)}</b></pre>
          <p className="text-slate-400 mt-2">
            Unit selected: <b>{step.unitLabel}</b>. Daily accrual uses the unit’s rate divided by its days (except “Daily” which uses the full daily rate).
          </p>
        </div>
      ) : (
        <div className="space-y-2 font-mono text-sm sm:text-base">
          <pre>Formula:  FV = P × (1 + r_period)^(number_of_applications)</pre>
          <pre>P = {moneyFmt(step.P)}   r_period = {(step.rPerPeriod).toFixed(6)}   interval_days = {step.intervalDays}</pre>
          <pre>number_of_applications = floor(included_days / interval_days) = {step.applications}</pre>
          <pre>Growth factor = (1 + r_period)^{step.applications} = {step.growthFactor.toFixed(8)}</pre>
          <pre>FV = {moneyFmt(step.P)} × {step.growthFactor.toFixed(8)} = <b>{moneyFmt(step.FV)}</b></pre>
          <p className="text-slate-400 mt-2">
            Custom compounding applies the full rate only on each completed interval; days in between do not accrue.
          </p>
        </div>
      )}
    </div>
  );
};

export default CompoundInterestStepByStep;
