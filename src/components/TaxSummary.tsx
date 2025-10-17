import React from "react";

interface TaxSummaryProps {
  grossIncome: number;
  deductions: number;
  taxableIncome: number;
  totalTax: number;
  netIncome: number;
}

const TaxSummary: React.FC<TaxSummaryProps> = ({
  grossIncome,
  deductions,
  taxableIncome,
  totalTax,
  netIncome,
}) => {
  return (
    <div className="p-4 sm:p-6 bg-[#0b1220] rounded-xl border border-indigo-600 shadow-lg mt-8">
      <p className="text-sm text-indigo-400 mb-4 text-center uppercase tracking-wide">
        Final Tax Summary
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Gross Income */}
        <div className="bg-blue-900/40 border border-blue-600 rounded-xl p-4 text-center shadow-md">
          <p className="text-xs text-blue-300 uppercase mb-1 tracking-wide">
            Gross Income
          </p>
          <p className="text-xl font-bold text-blue-100">
            {grossIncome.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Deductions */}
        <div className="bg-sky-900/30 border border-sky-600 rounded-xl p-4 text-center shadow-md">
          <p className="text-xs text-sky-300 uppercase mb-1 tracking-wide">
            Deductions
          </p>
          <p className="text-xl font-bold text-sky-100">
            {deductions.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Taxable Income */}
        <div className="bg-emerald-900/30 border border-emerald-600 rounded-xl p-4 text-center shadow-md">
          <p className="text-xs text-emerald-300 uppercase mb-1 tracking-wide">
            Taxable Income
          </p>
          <p className="text-xl font-bold text-emerald-100">
            {taxableIncome.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Total Tax Payable */}
        <div className="bg-amber-900/30 border border-amber-600 rounded-xl p-4 text-center shadow-md">
          <p className="text-xs text-amber-300 uppercase mb-1 tracking-wide">
            Total Tax Payable
          </p>
          <p className="text-xl font-bold text-amber-100">
            {totalTax.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Net Income After Tax */}
        <div className="bg-indigo-900/40 border border-indigo-600 rounded-xl p-4 text-center shadow-md sm:col-span-2 lg:col-span-1">
          <p className="text-xs text-indigo-300 uppercase mb-1 tracking-wide">
            Net Income After Tax
          </p>
          <p className="text-xl font-bold text-indigo-100">
            {netIncome.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaxSummary;
