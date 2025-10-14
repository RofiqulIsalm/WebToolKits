sName="block text-slate-400 mb-1">
                    Tenure (months)
                  </label>
                  <input
                    type="number"
                    value={compare.loanB.tenureMonths}
                    min={1}
                    step={1}
                    onChange={(e) =>
                      setCompare((c) => ({
                        ...c,
                        loanB: {
                          ...c.loanB,
                          tenureMonths: Math.max(
                            1,
                            Math.floor(Number(e.target.value))
                          ),
                        },
                      }))
                    }
                    className="w-full px-2 py-1.5 rounded-md bg-slate-800/60 border border-slate-700 text-slate-100 text-right focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Calculated Results */}
              {loanB && (
                <div className="text-sm text-slate-300 space-y-2">
                  <div className="flex justify-between">
                    <span>EMI</span>
                    <span>
                      {currencyPrefix}
                      {formatNumber(loanB.emi)}
                    </span>
                  </div>
                  <div className="flex justify-between text-amber-400">
                    <span>Total Interest</span>
                    <span>
                      {currencyPrefix}
                      {formatNumber(loanB.interest)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-emerald-400">
                    <span>Total Payment</span>
                    <span>
                      {currencyPrefix}
                      {formatNumber(loanB.total)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Difference Summary */}
        {compare.enabled && loanB && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700">
              <div className="text-slate-400">EMI Difference</div>
              <div
                className={`text-lg font-semibold ${
                  loanB.emi < emi ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {currencyPrefix}
                {formatNumber(Math.abs(emi - loanB.emi))}
              </div>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700">
              <div className="text-slate-400">Total Interest Diff</div>
              <div
                className={`text-lg font-semibold ${
                  loanB.interest < totalInterest
                    ? "text-emerald-400"
                    : "text-amber-400"
                }`}
              >
                {currencyPrefix}
                {formatNumber(
                  Math.abs(totalInterest - loanB.interest)
                )}
              </div>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700">
              <div className="text-slate-400">Total Payment Diff</div>
              <div
                className={`text-lg font-semibold ${
                  loanB.total < totalAmount
                    ? "text-emerald-400"
                    : "text-amber-400"
                }`}
              >
                {currencyPrefix}
                {formatNumber(Math.abs(totalAmount - loanB.total))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );


  // ---------------------- Header ---------------------------------------------
  const Header = (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white mb-2 drop-shadow">Loan EMI Calculator</h1>
      <p className="text-slate-300">
        Calculate your monthly EMI, interest, and total payment. Switch to{" "}
        <span className="text-cyan-300 font-semibold">Advanced Mode</span> for prepayments,
        charts, schedule, and comparisons.
      </p>
    </div>
  );

  // ---------------------- Render ---------------------------------------------
  return (
    <>
      <SEOHead
        title={seoData.loanEmiCalculator.title}
        description={seoData.loanEmiCalculator.description}
        canonical="https://calculatorhub.site/loan-emi-calculator"
        schemaData={generateCalculatorSchema(
          "Loan EMI Calculator",
          seoData.loanEmiCalculator.description,
          "/loan-emi-calculator",
          seoData.loanEmiCalculator.keywords
        )}
        breadcrumbs={[
          { name: "Currency & Finance", url: "/category/currency-finance" },
          { name: "Loan EMI Calculator", url: "/loan-emi-calculator" },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "Loan EMI Calculator", url: "/loan-emi-calculator" },
          ]}
        />

        {/* Header */}
        {Header}

        {/* Mode Toggle */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 bg-slate-900/70 border border-slate-700 rounded-lg p-1">
            <button
              onClick={() => setMode("basic")}
              className={`px-4 py-2 rounded-md ${mode === "basic" ? "bg-cyan-600 text-white" : "text-slate-300"}`}
            >
              Basic Mode
            </button>
            <button
              onClick={() => setMode("advanced")}
              className={`px-4 py-2 rounded-md ${mode === "advanced" ? "bg-cyan-600 text-white" : "text-slate-300"}`}
            >
              Advanced Mode
            </button>
          </div>

          <div className="text-slate-400 text-sm">
            Tip: Advanced mode unlocks prepayments, charts, amortization schedule, and comparisons.
          </div>
        </div>

        {/* Basic Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {BasicInputs}
          {BasicResults}
        </div>

        {/* Advanced Sections */}
        {mode === "advanced" && (
          <>
            {AdvancedControls}
            {Charts}
            {ScheduleTable}
            {Comparison}
          </>
        )}

        {/* SEO content */}
        <div className="seo-content text-white space-y-6 mt-10">
          <h2 className="text-2xl font-bold">What is a Loan EMI Calculator?</h2>
          <p>
            A Loan EMI (Equated Monthly Installment) Calculator helps you estimate your monthly repayment
            amount for a loan based on principal, interest rate, and tenure. Use our tool to visualize your
            repayment schedule, simulate prepayments, and compare loan scenarios without guesswork.
          </p>

          <h2 className="text-2xl font-bold">How to Calculate EMI Manually</h2>
          <div className="bg-slate-800/60 p-4 rounded-lg">
            <code className="text-green-400">
              EMI = [P × R × (1 + R)^N] / [(1 + R)^N – 1]
            </code>
          </div>
          <p className="text-slate-300">
            Where P is principal, R is monthly interest rate (annual/12), and N is number of months.
          </p>

          <h2 className="text-2xl font-bold">Benefits of Using EMI Calculator</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>✔ Instant results with accuracy</li>
            <li>✔ Plan your monthly budget</li>
            <li>✔ Simulate prepayments and their impact</li>
            <li>✔ Compare different loan offers and terms</li>
            <li>✔ Export schedule and share results</li>
          </ul>

          {/* Related Tools Grid */}
          <div className="mt-10">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">💼 Related Finance Tools</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: "Compound Interest Calculator", link: "/compound-interest-calculator", color: "from-emerald-500 to-teal-600" },
                { name: "Mortgage Calculator", link: "/mortgage-calculator", color: "from-indigo-500 to-blue-600" },
                { name: "Fixed Deposit (FD) Calculator", link: "/fd-calculator", color: "from-green-500 to-emerald-600" },
                { name: "ROI Calculator", link: "/roi-calculator", color: "from-purple-500 to-fuchsia-600" },
              ].map((tool) => (
                <a
                  key={tool.name}
                  href={tool.link}
                  className={`group p-4 rounded-xl bg-gradient-to-r ${tool.color} shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-between text-white`}
                >
                  <span className="font-medium group-hover:translate-x-1 transition-transform duration-200">
                    {tool.name}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators currentPath="/loan-emi-calculator" category="currency-finance" />
      </div>
    </>
  );
};

export default LoanEMICalculator;
