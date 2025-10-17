import React, { useMemo } from "react";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

type ContributionTiming = "end" | "begin";

interface Props {
  principal: number;            // P
  annualRate: number;           // r as % per year
  years: number;                // t in years
  compoundingPerYear: number;   // m (1, 2, 4, 12, 365...)
  contribution?: number;        // PMT per period (same frequency as compounding)
  contributionTiming?: ContributionTiming; // "end" = ordinary annuity, "begin" = annuity due
  className?: string;           // optional wrapper class
}

const fmt = (n: number, digits = 2) =>
  isFinite(n) ? Number(n).toLocaleString(undefined, { maximumFractionDigits: digits }) : "0";

/**
 * Mobile-first, dark-card step-by-step math explainer for Compound Interest.
 * FV with contributions (ordinary annuity):
 *  FV = P(1+i)^N + PMT * [((1+i)^N - 1)/i]
 * If "begin" timing (annuity due), multiply PMT term by (1+i).
 * When i = 0 (0% rate), fall back to linear sums: FV = P + PMT * N
 */
const CompoundInterestStepByStep: React.FC<Props> = ({
  principal,
  annualRate,
  years,
  compoundingPerYear,
  contribution = 0,
  contributionTiming = "end",
  className = "",
}) => {
  const calc = useMemo(() => {
    const P = Math.max(0, principal);
    const rPct = Math.max(0, annualRate);
    const t = Math.max(0, years);
    const m = Math.max(1, Math.floor(compoundingPerYear || 1));
    const PMT = Math.max(0, contribution || 0);

    if (P <= 0 && PMT <= 0) return null;

    const i = rPct / 100 / m;      // periodic rate
    const N = m * t;               // total periods
    const onePlusI = 1 + i;
    const pow = Math.pow(onePlusI, N); // (1+i)^N

    // Handle i = 0 separately to avoid division by zero
    if (i === 0) {
      const fvPrincipal = P;                 // no growth without interest
      const totalContrib = PMT * N;
      const fvContrib = totalContrib;        // just the sum of contributions
      const FV = fvPrincipal + fvContrib;
      const totalInvested = P + totalContrib;
      const totalInterest = FV - totalInvested;

      return {
        P, rPct, t, m, PMT, i, N, onePlusI, pow,
        fvPrincipal, fvContrib, FV, totalContrib, totalInvested, totalInterest,
        isZeroRate: true,
        isAnnuityDue: contributionTiming === "begin",
      };
    }

    // Standard compound growth + annuity growth
    const fvPrincipal = P * pow;

    // FV of ordinary annuity (end): PMT * [((1+i)^N - 1)/i]
    // If annuity due (begin): multiply by (1+i)
    const annuityFactor = (pow - 1) / i;
    const timingFactor = contributionTiming === "begin" ? onePlusI : 1;
    const fvContrib = PMT * annuityFactor * timingFactor;

    const FV = fvPrincipal + fvContrib;
    const totalContrib = PMT * N;
    const totalInvested = P + totalContrib;
    const totalInterest = FV - totalInvested;

    return {
      P, rPct, t, m, PMT, i, N, onePlusI, pow,
      fvPrincipal, fvContrib, FV, totalContrib, totalInvested, totalInterest,
      isZeroRate: false,
      isAnnuityDue: contributionTiming === "begin",
    };
  }, [principal, annualRate, years, compoundingPerYear, contribution, contributionTiming]);

  if (!calc) return null;

  const {
    P, rPct, t, m, PMT, i, N, onePlusI, pow,
    fvPrincipal, fvContrib, FV, totalContrib, totalInvested, totalInterest,
    isZeroRate, isAnnuityDue,
  } = calc;

  return (
    <div className={`mt-8 bg-[#0f172a] rounded-2xl border border-slate-700 p-5 sm:p-6 text-slate-100 shadow-lg ${className}`}>
      <h3 className="text-base sm:text-lg font-semibold text-cyan-300 mb-3 sm:mb-4">
        📘 Step-by-Step Compound Interest Calculation (Based on Your Input)
      </h3>

      {/* Inputs */}
      <div className="p-3 sm:p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
        <p className="text-[11px] sm:text-xs text-slate-400 mb-2">Your Input</p>
        <BlockMath
          math={String.raw`
P = ${fmt(P)},\quad r = ${fmt(rPct, 4)}\%\text{/year},\quad m = ${m}\ \text{(compounds/year)},\quad t = ${fmt(t, 4)}\ \text{years}
`}
        />
        <BlockMath
          math={String.raw`
\text{Regular\ Contribution}\ (PMT) = ${fmt(PMT)}\ \text{per period},\quad \text{Timing} = \text{${isAnnuityDue ? "Beginning" : "End"}}
`}
        />
      </div>

      {/* Base equations */}
      <div className="p-3 sm:p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
        <p className="text-[11px] sm:text-xs text-slate-400 mb-2">Definitions</p>
        <BlockMath math={String.raw`i = \dfrac{r}{100 \cdot m},\quad N = m \cdot t,\quad (1+i)^N`} />
        <BlockMath
          math={String.raw`
i = ${fmt(i, 8)},\quad N = ${fmt(N, 4)},\quad (1+i) = ${fmt(onePlusI, 8)},\quad (1+i)^N = ${fmt(pow, 8)}
`}
        />
      </div>

      {/* Formula selection */}
      {!isZeroRate ? (
        <div className="p-3 sm:p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
          <p className="text-[11px] sm:text-xs text-slate-400 mb-2">Formula</p>
          <BlockMath math={String.raw`\text{FV} = P(1+i)^N\ +\ PMT\cdot\frac{(1+i)^N - 1}{i}\cdot\left(${isAnnuityDue ? "(1+i)" : "1"}\right)`} />
          <p className="text-[11px] sm:text-xs text-slate-400 mt-2">
            {isAnnuityDue
              ? "Since contributions are at the beginning, multiply annuity term by (1 + i)."
              : "Contributions at end of period use ordinary annuity formula."}
          </p>
        </div>
      ) : (
        <div className="p-3 sm:p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
          <p className="text-[11px] sm:text-xs text-slate-400 mb-2">Zero-Rate Formula (i = 0)</p>
          <BlockMath math={String.raw`\text{FV} = P\ +\ PMT\cdot N`} />
        </div>
      )}

      {/* Principal growth */}
      <div className="p-3 sm:p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
        <p className="text-[11px] sm:text-xs text-slate-400 mb-2">Step 1 — Grow Principal</p>
        {!isZeroRate ? (
          <>
            <BlockMath math={String.raw`\text{FV}_{\text{principal}} = P(1+i)^N`} />
            <BlockMath math={String.raw`\text{FV}_{\text{principal}} = ${fmt(P)} \cdot ${fmt(pow, 8)} = ${fmt(fvPrincipal, 6)}`} />
          </>
        ) : (
          <>
            <p className="text-sm">No growth when rate is 0%.</p>
            <BlockMath math={String.raw`\text{FV}_{\text{principal}} = P = ${fmt(fvPrincipal, 6)}`} />
          </>
        )}
      </div>

      {/* Contribution growth */}
      <div className="p-3 sm:p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
        <p className="text-[11px] sm:text-xs text-slate-400 mb-2">Step 2 — Grow Contributions</p>
        {!isZeroRate ? (
          <>
            <BlockMath math={String.raw`\text{FV}_{\text{contrib}} = PMT\cdot\frac{(1+i)^N - 1}{i}\cdot\left(${isAnnuityDue ? "(1+i)" : "1"}\right)`} />
            <BlockMath
              math={String.raw`
\text{FV}_{\text{contrib}} = ${fmt(PMT)}\cdot\frac{${fmt(pow, 8)} - 1}{${fmt(i, 8)}}\cdot ${isAnnuityDue ? fmt(onePlusI, 8) : "1"}\ =\ ${fmt(fvContrib, 6)}
`}
            />
          </>
        ) : (
          <>
            <p className="text-sm">With 0% rate, contributions do not compound.</p>
            <BlockMath math={String.raw`\text{FV}_{\text{contrib}} = PMT\cdot N = ${fmt(PMT)} \cdot ${fmt(N)} = ${fmt(fvContrib, 6)}`} />
          </>
        )}
      </div>

      {/* Total FV */}
      <div className="p-3 sm:p-4 bg-slate-900/60 rounded-lg mb-3 border border-slate-700">
        <p className="text-[11px] sm:text-xs text-slate-400 mb-2">Step 3 — Future Value (Total)</p>
        <BlockMath math={String.raw`\text{FV} = \text{FV}_{\text{principal}} + \text{FV}_{\text{contrib}}`} />
        <BlockMath math={String.raw`\text{FV} = ${fmt(fvPrincipal, 6)}\ +\ ${fmt(fvContrib, 6)}\ =\ ${fmt(FV, 2)}`} />
      </div>

      {/* Totals & Interest */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
        <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-800/40 text-center">
          <div className="text-[11px] sm:text-xs text-slate-400">Total Contributed</div>
          <div className="text-lg font-semibold text-emerald-300">{fmt(totalContrib, 2)}</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700 text-center">
          <div className="text-[11px] sm:text-xs text-slate-400">Total Invested (P + Contrib)</div>
          <div className="text-lg font-semibold text-slate-100">{fmt(totalInvested, 2)}</div>
        </div>
        <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-800/40 text-center">
          <div className="text-[11px] sm:text-xs text-slate-400">Total Interest/Growth</div>
          <div className="text-lg font-semibold text-amber-300">{fmt(totalInterest, 2)}</div>
        </div>
      </div>

      {/* Final Answers */}
      <div className="p-4 sm:p-5 bg-[#0b1220] rounded-lg border border-indigo-600 text-center mt-4">
        <p className="text-sm text-indigo-400 mb-2">Final Answer</p>
        <BlockMath math={String.raw`\boxed{\text{FV} = ${fmt(FV, 2)}}`} />
      </div>
    </div>
  );
};

export default CompoundInterestStepByStep;
