9)}</span>
                </div>
          
                <div className="flex flex-wrap justify-between">
                  <span className="font-semibold text-sky-300">
                    (P × r) × (1 + r)<sup>n</sup>
                  </span>
                  <span className="text-white">
                    {formatCurrency(emiSteps.numerator, currentLocale, currency)}
                  </span>
                </div>
          
                <div className="my-3 h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          
                {/* Calculation formula lines */}
                <div className="overflow-x-auto rounded-md bg-[#0f172a] px-3 py-2 border border-slate-700 text-slate-300 text-[13px] whitespace-nowrap scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
            <div className="min-w-max">
              <span className="font-semibold text-slate-100">EMI</span> =
              <span className="text-white">
                {" "}{formatCurrency(emiSteps.P, currentLocale, currency)}{" "}
              </span>
              × <span className="text-white">{emiSteps.r.toFixed(8)}</span>
              {" "}×{" "}
              <span className="text-white">{emiSteps.pow.toFixed(6)}</span>
              {" "}÷{" "}
              <span className="text-white">{emiSteps.denominator.toFixed(6)}</span>
            </div>
          
            <div className="min-w-max text-slate-400">
              ={" "}
              <span className="text-white">
                {formatCurrency(emiSteps.numerator, currentLocale, currency)}
              </span>
              {" "}÷{" "}
              <span className="text-white">{emiSteps.denominator.toFixed(6)}</span>
            </div>
          </div>
          
              </div>
            ) : (
              <div className="text-slate-300 text-center sm:text-left font-mono">
                <span className="font-semibold">r = 0</span> ⇒ EMI = P / n =
                {formatCurrency(emiSteps.P, currentLocale, currency)} / {emiSteps.n || 1}
              </div>
            )}
          
            {/* Visual summary boxes */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center">
                <div className="text-emerald-300 text-xs uppercase">P × r</div>
                <div className="font-semibold text-white text-sm truncate">
                  {formatCurrency(emiSteps.pTimesR, currentLocale, currency)}
                </div>
              </div>
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center">
                <div className="text-rose-300 text-xs uppercase">(1 + r)<sup>n</sup> − 1</div>
                <div className="font-semibold text-white text-sm truncate">
                  {emiSteps.denominator.toFixed(9)}
                </div>
              </div>
              <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-center">
                <div className="text-sky-300 text-xs uppercase">Numerator</div>
                <div className="font-semibold text-white text-sm truncate">
                  {formatCurrency(emiSteps.numerator, currentLocale, currency)}
                </div>
              </div>
            </div>
          
            {/* Final EMI */}
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-2 rounded-xl bg-[#0f172a] px-4 py-3 ring-1 ring-emerald-500/30">
              <span className="text-sm text-emerald-300 whitespace-nowrap">💰 Calculated EMI</span>
              <span className="text-lg sm:text-xl font-bold tracking-wide text-white">
                {formatCurrency(emiSteps.emi, currentLocale, currency)}
              </span>
            </div>
          </div>





          

          <h2 id="how-to-use" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">💡 How to Use This Mortgage Calculator</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Select your <strong>currency</strong>.</li>
            <li>Enter <strong>loan amount</strong> and optional <strong>down payment</strong>.</li>
            <li>Add the <strong>annual interest rate</strong>.</li>
            <li>Set <strong>loan term</strong> in years and months.</li>
            <li>Copy results or share a link with your configuration.</li>
          </ol>

          <h2 id="example" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">📘 Example Calculation</h2>
          <p>
            Suppose you borrow <strong>$300,000</strong> at <strong>6.5%</strong> for <strong>30 years</strong> with a <strong>$30,000</strong> down payment.
            Your financed principal is <strong>$270,000</strong> and your EMI will be around <strong>$1,706</strong>.
            Over the term, you will pay roughly <strong>$344,000</strong> in interest (values approximate).
          </p>

          {/* ===================== FAQ SECTION ===================== */}
          <section id="faq" className="space-y-6 mt-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>

            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q1: What is a mortgage EMI?</h3>
                <p>
                  EMI (Equated Monthly Installment) is the fixed monthly payment you make to repay your mortgage over time.
                  It includes both principal and interest components.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q2: Does the calculator support down payment?</h3>
                <p>
                  Yes. Enter a down payment and we automatically reduce the financed principal before calculating EMI and the schedule.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q3: Can I share my results?</h3>
                <p>
                  Use the <strong>Copy Link</strong> button to copy a URL with your inputs encoded. Opening that link will restore the same scenario.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q4: Do you store my data?</h3>
                <p>
                  No. All calculations run locally in your browser. We only use <strong>localStorage</strong> to remember your last session on your device for convenience.
                </p>
              </div>
            </div>
          </section>
        </section>

        {/* =================== AUTHOR & BACKLINK SECTION =================== */}
        <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
          <div className="flex items-center gap-3">
            <img
              src="/images/calculatorhub-author.webp"
              alt="CalculatorHub Finance Tools Team"
              className="w-12 h-12 rounded-full border border-gray-600"
              loading="lazy"
            />
          <div>
              <p className="font-semibold text-white">Written by the CalculatorHub Finance Tools Team</p>
              <p className="text-sm text-slate-400">
                Experts in mortgages and online financial tools. Last updated:{" "}
                <time dateTime="2025-10-17">October 17, 2025</time>.
              </p>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
              <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
                🚀 Explore more finance tools on CalculatorHub:
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <a
                  href="/loan-emi-calculator"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
                >
                  <span className="text-indigo-400">💰</span> Loan EMI Calculator
                </a>
                <a
                  href="/tax-calculator"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
                >
                  <span className="text-emerald-400">🧾</span> Income Tax Calculator
                </a>
                <a
                  href="/currency-converter"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-fuchsia-600/20 text-fuchsia-300 hover:text-fuchsia-400 px-3 py-2 rounded-md border border-slate-700 hover:border-fuchsia-500 transition-all duration-200"
                >
                  <span className="text-fuchsia-400">💱</span> Currency Converter
                </a>
              </div>
            </div>

        </section>

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/mortgage-calculator" category="currency-finance" />
      </div>
    </>
  );
};

export default MortgageCalculator;

