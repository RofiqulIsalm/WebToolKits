>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {schedule.map((r, idx) => (
                <div key={idx} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-slate-200">Month {r.month}</div>
                    <TrendingUp className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="text-sm text-slate-300">
                    <div className="flex justify-between"><span>Opening</span><span>{fmt(r.openingBalance)}</span></div>
                    <div className="flex justify-between"><span>Interest</span><span>{fmt(r.interest)}</span></div>
                    <div className="flex justify-between"><span>Principal</span><span>{fmt(r.principal)}</span></div>
                    <div className="flex justify-between"><span>Prepayment</span><span>{fmt(r.prepayment)}</span></div>
                    <div className="flex justify-between"><span>Closing</span><span>{fmt(r.closingBalance)}</span></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 grid sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-emerald-900/20 border border-emerald-800/40 p-3">
                <div className="text-xs text-slate-400">Months to Payoff</div>
                <div className="text-lg font-semibold text-emerald-300">{totals.monthsToFinish}</div>
              </div>
              <div className="rounded-lg bg-amber-900/20 border border-amber-800/40 p-3">
                <div className="text-xs text-slate-400">Total Interest</div>
                <div className="text-lg font-semibold text-amber-300">{fmt(totals.totalInterest)}</div>
              </div>
              <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-3">
                <div className="text-xs text-slate-400">Total Paid</div>
                <div className="text-lg font-semibold text-slate-100">{fmt(totals.totalPaid)}</div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Comparison (Advanced only) ===== */}
        {advanced && (
          <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-100">Compare Loans</h3>
              <label className="flex items-center gap-2 text-slate-300 text-sm">
                <input type="checkbox" className="accent-cyan-500" checked={compareEnabled} onChange={(e) => setCompareEnabled(e.target.checked)} />
                Enable
              </label>
            </div>

            {compareEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                  <h4 className="text-slate-200 font-semibold mb-3">Loan A (Current)</h4>
                  <div className="text-sm text-slate-300 space-y-2">
                    <div className="flex justify-between"><span>Rate (p.a.)</span><span>{annualRate.toFixed(2)}%</span></div>
                    <div className="flex justify-between"><span>Tenure</span><span>{totalMonths} months</span></div>
                    <div className="flex justify-between"><span>EMI</span><span>{currency}{fmtCompact(baseEmi)}</span></div>
                    <div className="flex justify-between text-amber-400"><span>Total Interest</span><span>{currency}{fmtCompact(totals.totalInterest)}</span></div>
                    <div className="flex justify-between font-semibold text-emerald-400"><span>Total Payment</span><span>{currency}{fmtCompact(totals.totalPaid)}</span></div>
                  </div>
                </div>
                <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                  <h4 className="text-slate-200 font-semibold mb-3">Loan B (Compare)</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div>
                      <label className="block text-slate-400 mb-1">Rate (p.a. %)</label>
                      <input
                        type="number"
                        value={compareRateAnnual}
                        min={0}
                        step={0.1}
                        onChange={(e) => setCompareRateAnnual(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2 py-1.5 rounded-md bg-slate-800/60 border border-slate-700 text-slate-100 text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Tenure (months)</label>
                      <input
                        type="number"
                        value={compareTenureMonths}
                        min={1}
                        onChange={(e) => setCompareTenureMonths(Math.max(1, Math.floor(Number(e.target.value))))}
                        className="w-full px-2 py-1.5 rounded-md bg-slate-800/60 border border-slate-700 text-slate-100 text-right"
                      />
                    </div>
                  </div>
                  {loanB && (
                    <div className="text-sm text-slate-300 space-y-2">
                      <div className="flex justify-between"><span>EMI</span><span>{currency}{fmtCompact(loanB.emi)}</span></div>
                      <div className="flex justify-between text-amber-400"><span>Total Interest</span><span>{currency}{fmtCompact(loanB.interest)}</span></div>
                      <div className="flex justify-between font-semibold text-emerald-400"><span>Total Payment</span><span>{currency}{fmtCompact(loanB.total)}</span></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {compareEnabled && loanB && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700">
                  <div className="text-slate-400">EMI Difference</div>
                  <div className={`text-lg font-semibold ${loanB.emi < baseEmi ? 'text-emerald-400' : 'text-amber-400'}`}>{currency}{fmtCompact(Math.abs(baseEmi - loanB.emi))}</div>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700">
                  <div className="text-slate-400">Total Interest Diff</div>
                  <div className={`text-lg font-semibold ${loanB.interest < totals.totalInterest ? 'text-emerald-400' : 'text-amber-400'}`}>{currency}{fmtCompact(Math.abs(totals.totalInterest - loanB.interest))}</div>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700">
                  <div className="text-slate-400">Total Payment Diff</div>
                  <div className={`text-lg font-semibold ${loanB.total < totals.totalPaid ? 'text-emerald-400' : 'text-amber-400'}`}>{currency}{fmtCompact(Math.abs(totals.totalPaid - loanB.total))}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== Content / SEO Sections (dark theme) ===== */}
        <div className="max-w-5xl mx-auto mt-10 space-y-10 text-slate-200">
          <h1 className="text-2xl md:text-3xl font-extrabold text-center">
            Loan EMI Calculator – Plan Your Repayments Smartly
          </h1>
          <p className="text-center text-slate-300">
            Compute your monthly EMI, total interest, and total payable with precision. Use Advanced mode to
            simulate prepayments, view charts, compare loans, and export a full amortization schedule.
          </p>

          <AdBanner type="bottom" />

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">How EMI Is Calculated</h2>
            <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-4">
              <code className="text-slate-100">
                <strong>EMI</strong> = P × r × (1 + r)<sup>n</sup> / [(1 + r)<sup>n</sup> − 1]
              </code>
              <ul className="list-disc list-inside mt-3 text-slate-300">
                <li><strong>P</strong> = Principal (loan amount)</li>
                <li><strong>r</strong> = Monthly interest rate (annual rate / 12 / 100)</li>
                <li><strong>n</strong> = Number of monthly installments</li>
              </ul>
            </div>
          </section>

          <AdBanner type="bottom" />

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">Tips to Reduce Interest</h2>
            <ul className="list-disc list-inside text-slate-300">
              <li>Make small recurring prepayments each month.</li>
              <li>Apply one-time lumpsums when possible (bonuses, tax refunds).</li>
              <li>Opt for shorter tenures if affordable — interest compounds over time.</li>
            </ul>
          </section>

          {/* Optional guide image from Supabase */}
          {guideImageUrl && (
            <div className="mt-6">
              <img
                src={guideImageUrl}
                alt="EMI Guide"
                className="w-full max-w-3xl mx-auto rounded-xl border border-slate-700"
              />
            </div>
          )}

          {/* Related Calculators */}
          <RelatedCalculators currentPath="/loan-emi-calculator" category="currency-finance" />
        </div>

        <AdBanner type="bottom" />
      </div>

      {/* Toasts */}
      <Toasts toasts={toasts} />
    </>
  );
};

export default LoanEMICalculator;
