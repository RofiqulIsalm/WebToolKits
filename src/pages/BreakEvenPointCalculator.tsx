Price]);

  /* ============================================================
     🔗 COPY / SHARE / RESET
     ============================================================ */
  const reset = () => {
    setFixedCost(0);
    setVariableCost(0);
    setSellingPrice(0);
    setCurrency("USD");
    localStorage.removeItem(LS_KEY);
  };

  const copyResults = async () => {
    const text = [
      "Break-Even Analysis Summary",
      `Fixed Cost: ${formatCurrency(fixedCost, currentLocale, currency)}`,
      `Variable Cost per Unit: ${formatCurrency(variableCost, currentLocale, currency)}`,
      `Selling Price per Unit: ${formatCurrency(sellingPrice, currentLocale, currency)}`,
      `Profit per Unit: ${formatCurrency(profitPerUnit, currentLocale, currency)}`,
      `Break-Even Units: ${breakEvenUnits.toFixed(2)}`,
      `Break-Even Revenue: ${formatCurrency(breakEvenRevenue, currentLocale, currency)}`,
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const encoded = btoa(JSON.stringify({ fixedCost, variableCost, sellingPrice, currency }));
    const url = new URL(window.location.href);
    url.searchParams.set("bep", encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  /* ============================================================
     🎨 RENDER
     ============================================================ */
  return (
    <>
      <SEOHead
        title="Break-Even Point Calculator | CalculatorHub"
        description="Calculate your business break-even point in units and revenue. Find out when your sales will start generating profit."
        canonical="https://calculatorhub.site/break-even-calculator"
        schemaData={generateCalculatorSchema(
          "Break-Even Point Calculator",
          "Find the sales level where total revenue equals total cost with CalculatorHub’s Break-Even Calculator.",
          "/break-even-calculator",
          ["break-even calculator", "cost revenue analysis", "business profitability tool"]
        )}
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "Break-Even Calculator", url: "/break-even-calculator" },
          ]}
        />

        {/* ===== Header ===== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            📊 Break-Even Point Calculator
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Determine the sales volume or revenue required for your business to cover costs and start earning profit.
          </p>
        </div>

        {/* ===== Input + Output ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-emerald-400" /> Business Costs
              </h2>
              <button
                onClick={reset}
                className="flex items-center gap-1 text-sm text-slate-300 border border-[#334155] rounded-lg px-2 py-1 hover:bg-[#0f172a] hover:text-white transition"
                disabled={isDefault}
              >
                <RotateCcw className="h-4 w-4 text-indigo-400" /> Reset
              </button>
            </div>

            <div className="space-y-5">
              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-48 bg-[#0f172a] text-white text-sm px-3 py-1.5 border border-[#334155] rounded-md focus:ring-2 focus:ring-indigo-500"
                >
                  {currencyOptions.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fixed Costs */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">
                  Fixed Costs ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={fixedCost || ""}
                  onChange={(e) => setFixedCost(parseFloat(e.target.value) || 0)}
                  placeholder="Enter total fixed costs"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Variable Cost */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">
                  Variable Cost per Unit ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={variableCost || ""}
                  onChange={(e) => setVariableCost(parseFloat(e.target.value) || 0)}
                  placeholder="Enter variable cost per unit"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Selling Price */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">
                  Selling Price per Unit ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={sellingPrice || ""}
                  onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                  placeholder="Enter selling price per unit"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">Break-Even Summary</h2>
            <div className="space-y-6">
              <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                <div className="text-3xl font-bold text-white">
                  {breakEvenUnits.toFixed(2)}
                </div>
                <div className="text-sm text-slate-400">Units to Break Even</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(breakEvenRevenue, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Break-Even Revenue</div>
                </div>
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(profitPerUnit, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Profit per Unit</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={copyResults}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm"
                >
                  <Copy size={16} /> Copy Results
                </button>
                <button
                  onClick={copyShareLink}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm"
                >
                  <Share2 size={16} /> Copy Link
                </button>
                {copied !== "none" && (
                  <span className="text-emerald-400 text-sm">
                    {copied === "results" ? "Results copied!" : "Link copied!"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chart + Tip */}
        {breakEvenUnits > 0 && (
          <div className="mt-8 bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              Cost vs Revenue Analysis
            </h3>
            <BreakEvenChart
              sellingPrice={sellingPrice}
              variableCost={variableCost}
              fixedCost={fixedCost}
              breakEvenUnits={breakEvenUnits}
              currency={currency}
              locale={currentLocale}
            />
            <p className="mt-4 text-center text-sm text-slate-400">
              💡 The intersection of red and blue lines shows your break-even point —
              where total cost equals total revenue.
            </p>
          </div>
        )}


        {/*------- seo content --------------*/}
         
        

        <AdBanner type="bottom" />
        <RelatedCalculators
          currentPath="/break-even-calculator"
          category="Currency & finance"
        />
      </div>
    </>
  );
};

export default BreakEvenCalculator;
