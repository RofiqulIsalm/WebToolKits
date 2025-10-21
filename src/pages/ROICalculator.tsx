initialInvestment > 0 && finalValue > 0 && (
          <div className="mt-6 bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              ROI Breakdown
            </h3>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Pie Chart */}
              <div className="w-[90%] sm:w-[70%] md:w-[50%] max-w-[360px] h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Total Invested",
                          value: initialInvestment + additionalContributions,
                        },
                        { name: "Gain / Profit", value: gain },
                      ]}
                      dataKey="value"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#22c55e" />
                    </Pie>
                    <ReTooltip
                      formatter={(v: any) =>
                        formatCurrency(Number(v), currentLocale, currency)
                      }
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Summary */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-sky-500 transition">
                  <p className="text-sm text-slate-400">Total Invested</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(
                      initialInvestment + additionalContributions,
                      currentLocale,
                      currency
                    )}
                  </p>
                </div>
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-emerald-500 transition">
                  <p className="text-sm text-slate-400">Total Gain</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(gain, currentLocale, currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Smart Tip Box ===== */}
        {roiPercent > 0 && (
          <div className="mt-5 bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm">
            <p className="text-base font-medium leading-snug text-slate-300">
              💡 Tip: Even a small increase in your annualized return can have a huge impact
              over time thanks to <span className="text-emerald-400 font-semibold">compounding</span>.
            </p>
          </div>
        )}

        {/* ===== SEO Content Section ===== */}
      <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          <h1 className="text-3xl font-bold text-cyan-400 mb-6">
            ROI Calculator 2025 – Return on Investment Analysis Tool
          </h1>
        
          <p>
            The <strong>ROI (Return on Investment) Calculator by CalculatorHub</strong> helps
            investors measure their performance quickly. Input your initial amount, any
            additional contributions, the final value, and how long the investment lasted to
            see total and annualized ROI.
          </p>
        
          <figure className="my-8">
            <img
              src="/images/roi-calculator-hero.webp"
              alt="ROI Calculator dashboard showing investment gain chart"
              title="ROI Calculator 2025 | Investment Performance Tool"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Visualization of the ROI Calculator dark-finance UI.
            </figcaption>
          </figure>
        
          {/* Added: What is ROI Calculator */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">🧭 What is an ROI Calculator?</h2>
          <p>
            An ROI (Return on Investment) calculator measures how efficiently money invested turns into profit.
            It compares your total gain or loss against the amount you put in and expresses the result as a
            percentage. CalculatorHub’s tool goes further by also showing <strong>annualized ROI</strong> so
            performance can be compared fairly across different timeframes.
          </p>
        
          {/* Added: How to Use */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">⚙️ How to Use the ROI Calculator</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter your <strong>initial investment</strong> (the starting amount).</li>
            <li>Add any <strong>additional contributions</strong> made during the period.</li>
            <li>Provide the <strong>final value</strong> of the investment today.</li>
            <li>Set the <strong>duration</strong> (years and months) to compute annualized ROI.</li>
            <li>Review the <strong>total ROI</strong>, <strong>annualized ROI</strong>, and the <strong>total gain</strong>.</li>
          </ol>
        
          {/* Example (kept from your original) */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📘 Example Calculation
          </h2>
          <p>
            Suppose you invested <strong>$5 000</strong> and added <strong>$1 000</strong> later. Your
            investment is now worth <strong>$7 800</strong> after 2 years. Your total gain is <strong>$1 800</strong>,
            ROI = <strong>30 %</strong>, and annualized ROI ≈ <strong>13.96 %</strong>.
          </p>
        
          {/* Formulas (kept) */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧮 ROI Formula
          </h2>
          <p className="font-mono text-center text-indigo-300">
            ROI (%) = [(Final Value − Total Invested) ÷ Total Invested] × 100
          </p>
          <p className="font-mono text-center text-indigo-300">
            Annualized ROI (%) = [(Final Value ÷ Total Invested) ^(1 / Years) − 1] × 100
          </p>
        
          {/* Added: Benefits */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">🌟 ROI Calculator Benefits</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Instantly see <strong>total ROI</strong>, <strong>annualized ROI</strong>, and <strong>gain</strong>.</li>
            <li>Fair comparisons across different holding periods and asset types.</li>
            <li>Clear visuals for quick reporting and stakeholder updates.</li>
            <li>Great for investing, marketing attribution, or project evaluation.</li>
          </ul>
        
          {/* Why ROI Matters (kept) */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧭 Why ROI Matters
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Compare different investments on equal terms.</li>
            <li>Understand how long-term compounding affects growth.</li>
            <li>Plan targets for future returns.</li>
          </ul>
        
          {/* Added: Small Business Use */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">💼 ROI for Small Business</h2>
          <p>
            Owners can evaluate advertising spend, software subscriptions, equipment purchases, or training programs.
            By entering costs and outcomes, the calculator highlights which initiatives produce the highest returns,
            guiding smarter budget allocation.
          </p>
        
          {/* Added: Premium/Professional Options */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">💎 Premium & Professional Options</h2>
          <p>
            Teams that need deeper insight can upgrade for exportable reports, side-by-side comparisons, and
            multi-currency support — ideal for advisors, analysts, and educators who want presentation-ready outputs.
          </p>
        
          {/* Added: Why CalculatorHub’s Site */}
          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">🔍 Why CalculatorHub’s ROI Website?</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Clean, fast, and mobile-friendly UI with privacy-first design.</li>
            <li>Clear explanations plus pro-grade metrics in one place.</li>
            <li>No sign-up required — free to use, with optional premium features.</li>
          </ul>
        
          {/* ===== FAQ Section (kept) ===== */}
          <section id="faq" className="space-y-6 mt-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>
        
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q1: What is a good ROI?
                </h3>
                <p>
                  It depends on risk and asset type — for diversified stock portfolios, 7–10% annualized is often considered
                  healthy, while for low-risk savings products, 1–3% may be typical.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q2: Does this include taxes or fees?
                </h3>
                <p>
                  Results are gross. Adjust your final value to reflect taxes, fees, or slippage to see a net figure.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q3: How is annualized ROI different from ROI?
                </h3>
                <p>
                  Annualized ROI normalizes returns across different timeframes, showing the average growth per year — ideal for
                  comparing investments held for unequal durations.
                </p>
              </div>
            </div>
          </section>
        </section>
        
        {/* ===== Footer & Related Tools (kept) ===== */}
        <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
          <div className="flex items-center gap-3">
            <img
              src="/images/calculatorhub-author.webp"
              alt="CalculatorHub Finance Team"
              className="w-12 h-12 rounded-full border border-gray-600"
              loading="lazy"
            />
            <div>
              <p className="font-semibold text-white">
                Written by the CalculatorHub Finance Tools Team
              </p>
              <p className="text-sm text-slate-400">
                Updated for accuracy and clarity. Last updated: 
                <time dateTime="2025-10-20">October 20, 2025</time>.
              </p>
            </div>
          </div>
        
          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              🚀 Explore more finance tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <a
                href="/savings-goal-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all"
              >
                💰 Savings Goal Calculator
              </a>
              <a
                href="/credit-card-payoff-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-rose-600/20 text-rose-300 hover:text-rose-400 px-3 py-2 rounded-md border border-slate-700 hover:border-rose-500 transition-all"
              >
                💳 Credit Card Payoff
              </a>
              <a
                href="/inflation-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all"
              >
                💸 Inflation Calculator
              </a>
            </div>
          </div>
        </section>


        <AdBanner type="bottom" />
        <RelatedCalculators
          currentPath="/roi-calculator"
          category="currency-finance"
        />
      </div>
    </>
  );
};

export default ROICalculator;
