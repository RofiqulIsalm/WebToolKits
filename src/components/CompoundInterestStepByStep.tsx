import React, { useMemo } from "react";
import MathJax from "react-mathjax";

interface Props {
  principal: number;
  rate: number;
  rateUnit: "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "custom";
  timeData: { years: number; months: number; days: number };
  finalAmount: number;
  customRate?: { years: number; months: number; days: number };
}

const CompoundInterestStepByStep: React.FC<Props> = ({
  principal,
  rate,
  rateUnit,
  timeData,
  finalAmount,
  customRate,
}) => {
  const steps = useMemo(() => {
    if (!principal || !rate) return null;

    const P = principal;
    const r = rate / 100;
    const t = timeData.years + timeData.months / 12 + timeData.days / 365;

    // Determine n (compounding frequency)
    let n = 1;
    let formulaType = "";

    switch (rateUnit) {
      case "daily":
        n = 365;
        formulaType = "daily";
        break;
      case "weekly":
        n = 52;
        formulaType = "weekly";
        break;
      case "monthly":
        n = 12;
        formulaType = "monthly";
        break;
      case "quarterly":
        n = 4;
        formulaType = "quarterly";
        break;
      case "yearly":
        n = 1;
        formulaType = "yearly";
        break;
      case "custom":
        const customDays =
          (customRate?.years || 0) * 365 +
          (customRate?.months || 0) * 30 +
          (customRate?.days || 0);
        n = 365 / (customDays > 0 ? customDays : 1);
        formulaType = "custom";
        break;
    }

    // Core math
    const ratePerPeriod = r / n;
    const totalPeriods = n * t;
    const factor = Math.pow(1 + ratePerPeriod, totalPeriods);
    const FV = finalAmount || P * factor;

    return {
      P,
      r,
      n,
      t,
      ratePerPeriod,
      totalPeriods,
      factor,
      FV,
      formulaType,
    };
  }, [principal, rate, rateUnit, timeData, finalAmount, customRate]);

  if (!steps) return null;

  const format = (v: number, d: number = 6) => v.toFixed(d).replace(/0+$/, "").replace(/\.$/, "");

  const { P, r, n, t, ratePerPeriod, totalPeriods, factor, FV, formulaType } = steps;

  // Render formula dynamically
  const renderFormula = () => {
    switch (formulaType) {
      case "daily":
        return (
          <>
            <MathJax.Node formula={`FV = P \\times (1 + r)^{days}`} />
            <MathJax.Node
              formula={`FV = ${P.toLocaleString()} \\times (1 + ${format(r)})^{365}`}
            />
            <MathJax.Node formula={`(1 + ${format(r)}) = ${format(1 + r)}`} />
            <MathJax.Node
              formula={`${format(1 + r)}^{365} = ${format(factor, 6)}`}
            />
            <MathJax.Node
              formula={`FV = ${P.toLocaleString()} \\times ${format(factor, 6)} = ${FV.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}`}
            />
          </>
        );

      case "weekly":
      case "monthly":
      case "quarterly":
      case "yearly":
      case "custom":
        return (
          <>
            <MathJax.Node formula={`FV = P \\times \\left(1 + \\frac{r}{n}\\right)^{n \\times t}`} />
            <MathJax.Node
              formula={`FV = ${P.toLocaleString()} \\times \\left(1 + \\frac{${format(r)}}{${n}}\\right)^{${n} \\times ${format(
                t,
                4
              )}}`}
            />
            <MathJax.Node
              formula={`\\frac{${format(r)}}{${n}} = ${format(ratePerPeriod, 8)}`}
            />
            <MathJax.Node
              formula={`${n} \\times ${format(t, 4)} = ${format(totalPeriods, 4)}`}
            />
            <MathJax.Node
              formula={`\\left(1 + ${format(ratePerPeriod, 8)}\\right)^{${format(
                totalPeriods,
                4
              )}} = ${format(factor, 6)}`}
            />
            <MathJax.Node
              formula={`FV = ${P.toLocaleString()} \\times ${format(factor, 6)} = ${FV.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}`}
            />
          </>
        );

      default:
        return null;
    }
  };

  const readableUnit = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
    custom: "Custom",
  }[formulaType];

  return (
    <div className="bg-slate-800/50 p-6 rounded-xl mt-6 text-center text-slate-100">
      <h3 className="text-xl font-semibold text-cyan-300 mb-4">
        Step-by-Step Calculation ({readableUnit} Compounding)
      </h3>
      <MathJax.Provider>
        <div className="space-y-4 text-lg leading-relaxed">{renderFormula()}</div>
      </MathJax.Provider>
    </div>
  );
};

export default CompoundInterestStepByStep;
