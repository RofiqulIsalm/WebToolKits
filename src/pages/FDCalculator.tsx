  /* ============================================================
     📘 SECTION 4.5: Step-by-step FD Math (for UI explainer)
     ============================================================ */
  const fdSteps = useMemo(() => {
    const P = Math.max(deposit, 0);
    const tYears = Math.max(termYears, 0);
    const m = periodsPerYear;
    const rYear = Math.max(rate / 100, 0);

    if (payout === "cumulative") {
      // A = P * (1 + r/m)^(m*t)
      const onePlus = m > 0 ? 1 + rYear / m : 1;
      const pow = Math.pow(onePlus, m * tYears);
      const A = rate === 0 ? P : P * pow;
      const interest = Math.max(A - P, 0);
      return {
        mode: "cumulative" as const,
        P,
        rYear,
        m,
        tYears,
        onePlus,
        pow,
        A,
        interest,
      };
    } else {
      // payout: per-period interest = P * (r / mPay)
      const mPayLocal = mPay;
      const per = P * (rYear / mPayLocal);
      const nPeriods = Math.round(mPayLocal * tYears);
      const totalInterest = per * nPeriods;
      return {
        mode: "payout" as const,
        P,
        rYear,
        tYears,
        mPay: mPayLocal,
        per,
        nPeriods,
        totalInterest,
        A: P + totalInterest,
      };
    }
  }, [deposit, rate, termYears, periodsPerYear, payout, mPay]);

  /* ============================================================
     📊 SECTION 5: Chart & Tips
     ============================================================ */
  const pieData = [
    { name: "Deposit", value: Math.max(deposit, 0) },
    { name: "Interest", value: Math.max(interestEarned, 0) },
  ];

  const interestPct = deposit > 0 ? (interestEarned / deposit) * 100 : 0;

  const tipsForFD = useMemo(() => {
    const base: string[] = [];
    if (deposit && interestEarned)
      base.push(`Over your term, you'll earn ~${interestPct.toFixed(0)}% of your deposit as interest.`);
    base.push("Tip: Higher compounding frequency (monthly/quarterly) slightly increases maturity value.");
    base.push("Tip: For regular income, choose a payout option (monthly/quarterly/yearly). For maximum growth, use cumulative.");
    base.push("Tip: Extending tenure typically increases total interest, but consider liquidity needs.");
    base.push("Tip: Always compare bank FD rates and check premature withdrawal penalties.");
    return base;
  }, [deposit, interestEarned, interestPct]);

  const [activeTip, setActiveTip] = useState<number>(0);
  useEffect(() => {
    if (!tipsForFD.length) return;
    const t = setInterval(() => {
      setActiveTip((prev) => (prev + 1) % tipsForFD.length);
    }, 5000);
    return () => clearInterval(t);
  }, [tipsForFD]);

  /* ============================================================
     🔗 SECTION 6: Share / Copy / Reset
     ============================================================ */
  const copyResults = async () => {
    const text = [
      `FD Summary`,
      `Deposit: ${formatCurrency(deposit, currentLocale, currency)}`,
      `Rate: ${rate}%`,
      `Term: ${years}y ${months}m`,
      `Mode: ${payout === "cumulative" ? `Cumulative (compounding ${compounding})` : `Payout (${payout.replace("-payout", "")})`}`,
      payout === "cumulative"
        ? `Maturity: ${formatCurrency(maturity, currentLocale, currency)}`
        : `Periodic Payout: ${formatCurrency(periodicInterest, currentLocale, currency)} (${payout.replace("-payout","")})`,
      `Total Interest: ${formatCurrency(interestEarned, currentLocale, currency)}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const encoded = btoa(
      JSON.stringify({ deposit, rate, years, months, currency, compounding, payout })
    );
    const url = new URL(window.location.href);
    url.searchParams.set("fd", encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  const reset = () => {
    setDeposit(0);
    setRate(0);
    setYears(0);
    setMonths(0);
    setCurrency("USD");
    setCompounding("quarterly");
    setPayout("cumulative");
    setShowSchedule(false);
    setGranularity("yearly");
    localStorage.removeItem(LS_KEY);
  };

  /* ============================================================
     🎨 SECTION 7: Render
     ============================================================ */
  const seoNode =
    (seoData as any)?.fdCalculator ?? {
      title: "FD Calculator | Fixed Deposit Maturity & Interest",
      description:
        "Calculate fixed deposit maturity, periodic interest payouts, and growth with compounding across currencies.",
      keywords: ["FD calculator", "fixed deposit", "maturity", "interest", "compounding"],
    };

  return (
    <>
      <SEOHead
        title={seoNode.title}
        description={seoNode.description}
        canonical="https://calculatorhub.site/fd-calculator"
        schemaData={generateCalculatorSchema(
          "FD Calculator",
          seoNode.description,
          "/fd-calculator",
          seoNode.keywords || []
        )}
      />
    </>
      {/* ===== Enhanced SEO & Social Metadata ===== */}
      <>
        {/* --- Open Graph --- */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="CalculatorHub" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:title" content={seoNode.title} />
        <meta property="og:description" content={seoNode.description} />
        <meta property="og:url" content="https://calculatorhub.site/fd-calculator" />
        <meta
          property="og:image"
          content="https://calculatorhub.site/images/fd-calculator-hero.webp"
        />
        <meta
          property="og:image:alt"
          content="FD Calculator by CalculatorHub – Maturity, Interest, and Payout Chart"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* --- Twitter --- */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@CalculatorHub" />
        <meta name="twitter:creator" content="@CalculatorHub" />
        <meta name="twitter:title" content={seoNode.title} />
        <meta name="twitter:description" content={seoNode.description} />
        <meta
          name="twitter:image"
          content="https://calculatorhub.site/images/fd-calculator-hero.webp"
        />
        <meta
          name="twitter:image:alt"
          content="Interactive fixed deposit calculator with payout and compounding options"
        />

        {/* --- JSON-LD (WebPage + Breadcrumb + FAQ) --- */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebPage",
                  "@id": "https://calculatorhub.site/fd-calculator",
                  url: "https://calculatorhub.site/fd-calculator",
                  name: "FD Calculator | Fixed Deposit Maturity & Interest Estimator",
                  description: seoNode.description,
                  inLanguage: "en-US",
                  isPartOf: {
                    "@type": "WebSite",
                    name: "CalculatorHub",
                    url: "https://calculatorhub.site",
                  },
                  image: {
                    "@type": "ImageObject",
                    url: "https://calculatorhub.site/images/fd-calculator-hero.webp",
                    width: 1200,
                    height: 630,
                  },
                },
                {
                  "@type": "BreadcrumbList",
                  itemListElement: [
                    {
                      "@type": "ListItem",
                      position: 1,
                      name: "Currency & Finance",
                      item: "https://calculatorhub.site/category/currency-finance",
                    },
                    {
                      "@type": "ListItem",
                      position: 2,
                      name: "FD Calculator",
                      item: "https://calculatorhub.site/fd-calculator",
                    },
                  ],
                },
                {
                  "@type": "FAQPage",
                  mainEntity: [
                    {
                      "@type": "Question",
                      name: "What is a cumulative FD?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text:
                          "In a cumulative FD, interest is compounded and paid at maturity, maximizing the final amount.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "What is a non-cumulative (payout) FD?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text:
                          "Interest is paid out at a fixed frequency (monthly/quarterly/yearly) without compounding. Good for regular income.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Which compounding frequency should I choose?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text:
                          "More frequent compounding (e.g., monthly or quarterly) generally yields slightly higher maturity compared to yearly.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Do you store my data?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text:
                          "No, calculations run locally. We only use localStorage to remember your last session on this device.",
                      },
                    },
                  ],
                },
              ],
            }),
          }}
        />
      </>

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "FD Calculator", url: "/fd-calculator" },
          ]}
        />

        {/* ===== Header ===== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">🏦 FD Calculator</h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Calculate your fixed deposit maturity, total interest, or regular interest payouts with
            flexible compounding and currencies. Share or save your scenario instantly.
          </p>
        </div>

        <div className="hidden sm:flex mt-6 mb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white rounded-lg shadow-lg p-4 flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-lg">Compare other finance tools 📊</p>
            <p className="text-sm text-indigo-100">Try our Loan EMI, Mortgage, or Tax tools next!</p>
          </div>
          <a
            href="/category/currency-finance"
            className="bg-white text-indigo-700 font-semibold px-4 py-2 rounded-md hover:bg-indigo-50 transition"
          >
            Explore More Calculators
          </a>
        </div>

        {/* ===== Calculator Grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 relative text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-sky-400" /> Deposit Details
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
                <label className="block text-sm font-medium text-slate-300 mb-2">Select Currency</label>
                <div className="relative inline-block w-48">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-[#0f172a] text-white text-sm px-3 py-1.5 border border-[#334155] rounded-md focus:ring-2 focus:ring-indigo-500 appearance-none pr-8 hover:border-indigo-400 transition"
                  >
                    {currencyOptions.map((c) => (
                      <option key={c.code} value={c.code} className="text-white">
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                    ▼
                  </span>
                </div>
              </div>

              {/* Deposit */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">
                    Deposit Amount ({findSymbol(currency)})
                  </label>
                  <Info
                    onClick={() => setShowDepositInfo(!showDepositInfo)}
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                  />
                </div>
                {showDepositInfo && (
                  <div className="mb-2 bg-[#0f172a] text-slate-300 text-xs p-2 rounded-md border border-[#334155]">
                    Lump sum you invest in the fixed deposit at the start.
                  </div>
                )}
                <input
                  type="number"
                  value={deposit || ""}
                  placeholder={`Enter deposit in ${findSymbol(currency)}`}
                  min={0}
                  onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Rate */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">Annual Interest Rate (%)</label>
                  <Info
                    onClick={() => setShowRateInfo(!showRateInfo)}
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                  />
                </div>
                {showRateInfo && (
                  <div className="mb-2 bg-[#0f172a] text-slate-300 text-xs p-2 rounded-md border border-[#334155]">
                    Bank's advertised annual percentage rate (APR) for the FD.
                  </div>
                )}
                <input
                  type="number"
                  step="0.01"
                  value={rate || ""}
                  placeholder="Enter annual interest rate"
                  min={0}
                  onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Term */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">Deposit Term</label>
                  <Info
                    onClick={() => setShowTermInfo(!showTermInfo)}
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                  />
                </div>
                {showTermInfo && (
                  <div className="mb-2 bg-[#0f172a] text-slate-300 text-xs p-2 rounded-md border border-[#334155]">
                    Tenure for which your money stays invested.
                  </div>
                )}
                <div className="flex gap-4">
                  <input
                    type="number"
                    value={years || ""}
                    placeholder="Years"
                    min={0}
                    onChange={(e) => setYears(parseInt(e.target.value) || 0)}
                    className="w-1/2 bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    value={months || ""}
                    placeholder="Months"
                    min={0}
                    max={11}
                    onChange={(e) => setMonths(parseInt(e.target.value) || 0)}
                    className="w-1/2 bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Total duration:{" "}
                  <span className="font-semibold text-indigo-300">{totalMonths || 0}</span> months
                </p>
              </div>

              {/* Compounding / Payout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-slate-300">Compounding</label>
                    <Info
                      onClick={() => setShowCompInfo(!showCompInfo)}
                      className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    />
                  </div>
                  {showCompInfo && (
                    <div className="mb-2 bg-[#0f172a] text-slate-300 text-xs p-2 rounded-md border border-[#334155]">
                      How often interest is added to principal in cumulative mode.
                    </div>
                  )}
                  <select
                    value={compounding}
                    onChange={(e) => setCompounding(e.target.value as any)}
                    className="w-full bg-[#0f172a] text-white px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="half-yearly">Half-yearly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-slate-300">Payout</label>
                    <Info
                      onClick={() => setShowPayoutInfo(!showPayoutInfo)}
                      className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    />
                  </div>
                  {showPayoutInfo && (
                    <div className="mb-2 bg-[#0f172a] text-slate-300 text-xs p-2 rounded-md border border-[#334155]">
                      Choose cumulative for growth, or periodic payouts for regular income.
                    </div>
                  )}
                  <select
                    value={payout}
                    onChange={(e) => setPayout(e.target.value as any)}
                    className="w-full bg-[#0f172a] text-white px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="cumulative">Cumulative (no payout)</option>
                    <option value="monthly-payout">Monthly payout</option>
                    <option value="quarterly-payout">Quarterly payout</option>
                    <option value="yearly-payout">Yearly payout</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">FD Summary</h2>
            <div className="space-y-6">
              <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                <PiggyBank className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                <div className="text-lg font-semibold text-white">
                  {payout === "cumulative" ? "Estimated Maturity" : "Periodic Interest"}
                </div>
                <div className="text-2xl font-bold text-white">
                  {payout === "cumulative"
                    ? formatCurrency(maturity, currentLocale, currency)
                    : formatCurrency(periodicInterest, currentLocale, currency)}
                </div>
                {payout !== "cumulative" && (
                  <div className="text-sm text-slate-400 capitalize">
                    Frequency: {payout.replace("-payout", "")}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(interestEarned, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Total Interest</div>
                </div>
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(deposit, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Principal (Deposit)</div>
                </div>
              </div>

              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex justify-between">
                  <span>Term Length:</span>
                  <span className="font-medium text-indigo-300">
                    {years} years {months} months
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Interest Rate:</span>
                  <span className="font-medium text-indigo-300">{rate || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Mode:</span>
                  <span className="font-medium text-indigo-300 capitalize">
                    {payout === "cumulative"
                      ? `Cumulative (${compounding})`
                      : `Payout (${payout.replace("-payout", "")})`}
                  </span>
                </div>
              </div>

              {/* Actions */}
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

        {/* ===== Smart Tip Box ===== */}
        {deposit > 0 && (
          <div className="mt-4 w-full relative">
            <div className="bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm min-h-[50px] w-full flex items-center">
              <div className="mr-3 flex items-center justify-center w-8 h-8">
                <span className="text-2xl text-indigo-400">💡</span>
              </div>
              <div className="w-full">
                <p className="text-base font-medium leading-snug text-slate-300">{tipsForFD[activeTip]}</p>
              </div>
            </div>
          </div>
        )}

        {/* ===== Chart + Quick Summary ===== */}
        {deposit > 0 && totalMonths > 0 && (
          <div className="mt-5 bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">FD Insights & Breakdown</h3>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Chart Left */}
              <div className="w-[90%] sm:w-[80%] md:w-[70%] max-w-[360px] h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={2}>
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={["#3b82f6", "#a855f7"][index % 2]} />
                      ))}
                    </Pie>
                    <ReTooltip
                      formatter={(v: any) => formatCurrency(Number(v), currentLocale, currency)}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Summary Right */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-indigo-500 transition">
                  <p className="text-sm text-slate-400">Deposit</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(deposit, currentLocale, currency)}
                  </p>
                </div>

                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-emerald-500 transition">
                  <p className="text-sm text-slate-400">Total Interest</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(interestEarned, currentLocale, currency)}
                  </p>
                </div>

                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-rose-500 transition">
                  <p className="text-sm text-slate-400">
                    {payout === "cumulative" ? "Maturity Value" : "Per-period Interest"}
                  </p>
                  <p className="font-semibold text-white text-lg">
                    {payout === "cumulative"
                      ? formatCurrency(maturity, currentLocale, currency)
                      : formatCurrency(periodicInterest, currentLocale, currency)}
                  </p>
                </div>

                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-indigo-500 transition">
                  <p className="text-sm text-slate-400">Mode</p>
                  <p className="font-semibold text-white text-lg capitalize">
                    {payout === "cumulative"
                      ? `Cumulative (${compounding})`
                      : `Payout (${payout.replace("-payout", "")})`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Earnings / Balance Schedule ===== */}
        {deposit > 0 && totalMonths > 0 && (
          <div className="mt-10 bg-gradient-to-br from-[#1e293b] via-[#111827] to-[#0f172a] rounded-2xl border border-indigo-600/40 shadow-xl overflow-hidden">
            {/* Header Button */}
            <button
              onClick={() => setShowSchedule((v) => !v)}
              className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold text-lg tracking-wide hover:opacity-90 transition-all"
            >
              <span>📈 Growth / Payout Schedule</span>
              {showSchedule ? <ChevronUp /> : <ChevronDown />}
            </button>

            {/* Collapsible Content */}
            {showSchedule && (
              <div className="px-6 pb-8 pt-4">
                {/* Controls */}
                <div className="flex items-center gap-4 mb-5">
                  <label className="text-sm text-slate-300">Granularity:</label>
                  <select
                    value={granularity}
                    onChange={(e) => setGranularity(e.target.value as "yearly" | "monthly")}
                    className="px-3 py-2 bg-[#0f172a] border border-indigo-500/40 rounded-md text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  >
                    <option value="yearly">Yearly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-[#334155] shadow-inner">
                  <table className="min-w-full text-sm text-slate-100">
                    <thead className="bg-[#0f172a]">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-indigo-300">
                          {granularity === "yearly" ? "Year" : "Month"}
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-emerald-300">
                          Interest {payout !== "cumulative" && "(Paid)"}
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-cyan-300">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((r, i) => (
                        <tr
                          key={r.period}
                          className={`transition-colors duration-200 ${
                            i % 2 === 0 ? "bg-[#1e293b]/60" : "bg-[#0f172a]/60"
                          } hover:bg-[#3b82f6]/10`}
                        >
                          <td className="px-4 py-2">{r.period}</td>
                          <td className="px-4 py-2 text-right text-emerald-300 font-medium">
                            {formatCurrency(r.interest, currentLocale, currency)}
                          </td>
                          <td className="px-4 py-2 text-right text-cyan-300 font-medium">
                            {formatCurrency(r.balance, currentLocale, currency)}
                          </td>
                        </tr>
                      ))}
                      {schedule.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-slate-400 italic">
                            Enter valid details to view schedule.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Subtle Footer Glow */}
                <div className="h-2 w-full mt-6 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 blur-[2px]" />
              </div>
            )}
          </div>
        )}

        {/* ==================== SEO CONTENT SECTION ==================== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          {/* ===== Table of Contents ===== */}
          <nav className="mt-16 mb-8 bg-[#0f172a] border border-[#334155] rounded-xl p-5 text-slate-200">
            <h2 className="text-lg font-semibold text-cyan-300 mb-3">📖 Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <a href="#how-fd" className="text-indigo-400 hover:underline">
                  How FD Returns are Calculated
                </a>
              </li>
              <li>
                <a href="#how-to-use" className="text-indigo-400 hover:underline">
                  How to Use This FD Calculator
                </a>
              </li>
              <li>
                <a href="#example" className="text-indigo-400 hover:underline">
                  Example Calculation
                </a>
              </li>
              <li>
                <a href="#faq" className="text-indigo-400 hover:underline">
                  Frequently Asked Questions
                </a>
              </li>
            </ol>
          </nav>

          <h1 className="text-3xl font-bold text-cyan-400 mb-6">
            Fixed Deposit (FD) Calculator 2025 – Maturity & Payout Estimator
          </h1>

          <p>
            The <strong>FD Calculator by CalculatorHub</strong> helps you estimate{" "}
            <strong>maturity value</strong>, <strong>total interest</strong>, and{" "}
            <strong>regular interest payouts</strong> for fixed deposits across multiple currencies.
            Choose between <em>cumulative</em> and <em>payout</em> modes and adjust compounding to match
            your bank’s offering.
          </p>

          <figure className="my-8">
            <img
              src="/images/fd-calculator-hero.webp"
              alt="Modern FD calculator UI showing maturity pie chart and payout schedule"
              title="FD Calculator 2025 | Maturity & Interest Estimator"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Visual representation of the FD Calculator with dark-finance UI.
            </figcaption>
          </figure>

          {/* ===== Step-by-step math card ===== */}
          <h2
            id="how-fd"
            className="mt-12 mb-3 text-2xl font-extrabold tracking-tight text-center sm:text-left"
          >
            <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
              🧮 How FD Returns are Calculated
            </span>
          </h2>

          <div className="relative rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-[#0b1220]/90 p-4 sm:p-6 ring-1 ring-indigo-500/30 shadow-xl text-[13.5px] sm:text-sm leading-relaxed">
            <div className="pointer-events-none absolute inset-x-0 -top-0.5 h-0.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-emerald-500 opacity-60" />

            {fdSteps.mode === "cumulative" ? (
              <>
                <p className="mb-4 text-center font-mono text-[15px] leading-7 text-indigo-300">
                  A = <span className="text-sky-300">P × (1 + r/m)<sup>m×t</sup></span>
                </p>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 mb-4">
                  <div className="flex justify-between gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-cyan-500/20">
                    <span className="font-semibold text-cyan-300">P</span>
                    <span className="font-semibold text-white truncate">
                      {formatCurrency(fdSteps.P, currentLocale, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-amber-500/20">
                    <span className="font-semibold text-amber-300">r</span>
                    <span className="font-semibold text-white truncate">{fdSteps.rYear.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-fuchsia-500/20">
                    <span className="font-semibold text-fuchsia-300">m</span>
                    <span className="font-semibold text-white truncate">{fdSteps.m}</span>
                  </div>
                  <div className="flex justify-between gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-emerald-500/20">
                    <span className="font-semibold text-emerald-300">t</span>
                    <span className="font-semibold text-white truncate">{fdSteps.tYears.toFixed(4)}</span>
                  </div>
                </div>

                <div className="space-y-2 font-mono break-words">
                  <div className="flex justify-between">
                    <span className="font-semibold text-indigo-300">(1 + r/m)</span>
                    <span className="text-white">{fdSteps.onePlus.toFixed(9)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-rose-300">(1 + r/m)<sup>m×t</sup></span>
                    <span className="text-white">{fdSteps.pow.toFixed(9)}</span>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-slate-300 text-[13px] whitespace-nowrap overflow-auto">
                  <div className="min-w-max">
                    <span className="font-semibold text-slate-100">A</span> ={" "}
                    <span className="text-white">
                      {formatCurrency(fdSteps.P, currentLocale, currency)}
                    </span>{" "}
                    × <span className="text-white">{fdSteps.pow.toFixed(6)}</span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center">
                    <div className="text-emerald-300 text-xs uppercase">Maturity</div>
                    <div className="font-semibold text-white text-sm truncate">
                      {formatCurrency(fdSteps.A, currentLocale, currency)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center">
                    <div className="text-rose-300 text-xs uppercase">Interest</div>
                    <div className="font-semibold text-white text-sm truncate">
                      {formatCurrency(fdSteps.interest, currentLocale, currency)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-center">
                    <div className="text-sky-300 text-xs uppercase">Compounding</div>
                    <div className="font-semibold text-white text-sm truncate">{compounding}</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="mb-4 text-center font-mono text-[15px] leading-7 text-indigo-300">
                  Per-period interest = <span className="text-sky-300">P × r / m<sub>pay</sub></span>
                </p>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 mb-4">
                  <div className="flex justify-between gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-cyan-500/20">
                    <span className="font-semibold text-cyan-300">P</span>
                    <span className="font-semibold text-white truncate">
                      {formatCurrency(fdSteps.P, currentLocale, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-amber-500/20">
                    <span className="font-semibold text-amber-300">r</span>
                    <span className="font-semibold text-white truncate">{fdSteps.rYear.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-fuchsia-500/20">
                    <span className="font-semibold text-fuchsia-300">mₚₐᵧ</span>
                    <span className="font-semibold text-white truncate">{fdSteps.mPay}</span>
                  </div>
                  <div className="flex justify-between gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-emerald-500/20">
                    <span className="font-semibold text-emerald-300">Periods</span>
                    <span className="font-semibold text-white truncate">{fdSteps.nPeriods}</span>
                  </div>
                </div>

                <div className="space-y-2 font-mono break-words">
                  <div className="flex justify-between">
                    <span className="font-semibold text-indigo-300">Per-period</span>
                    <span className="text-white">
                      {formatCurrency(fdSteps.per, currentLocale, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-rose-300">Total Interest</span>
                    <span className="text-white">
                      {formatCurrency(fdSteps.totalInterest, currentLocale, currency)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center">
                    <div className="text-emerald-300 text-xs uppercase">Per-period</div>
                    <div className="font-semibold text-white text-sm truncate">
                      {formatCurrency(fdSteps.per, currentLocale, currency)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center">
                    <div className="text-rose-300 text-xs uppercase">Total Interest</div>
                    <div className="font-semibold text-white text-sm truncate">
                      {formatCurrency(fdSteps.totalInterest, currentLocale, currency)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-center">
                    <div className="text-sky-300 text-xs uppercase">Maturity</div>
                    <div className="font-semibold text-white text-sm truncate">
                      {formatCurrency(fdSteps.A, currentLocale, currency)}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <h2 id="how-to-use" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            💡 How to Use This FD Calculator
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Select your <strong>currency</strong>.</li>
            <li>Enter <strong>deposit amount</strong> and <strong>annual interest rate</strong>.</li>
            <li>Set the <strong>term</strong> in years and months.</li>
            <li>Choose <strong>cumulative</strong> or <strong>payout</strong> and compounding.</li>
            <li>Copy results or share a link with your configuration.</li>
          </ol>

          <h2 id="example" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📘 Example Calculation
          </h2>
          <p>
            Suppose you invest <strong>$10,000</strong> at <strong>7%</strong> for <strong>3 years</strong> with{" "}
            <strong>quarterly compounding</strong> in cumulative mode. Your maturity will be around{" "}
            <em>(illustrative)</em>{" "}
            <strong>
              {formatCurrency(10000 * Math.pow(1 + 0.07 / 4, 4 * 3), "en-US", "USD")}
            </strong>
            , and the interest earned is maturity minus principal.
          </p>

          {/* ===================== FAQ SECTION ===================== */}
          <section id="faq" className="space-y-6 mt-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>

            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q1: Which is better—cumulative or payout?</h3>
                <p>
                  Cumulative generally gives a higher maturity due to compounding. Payout is ideal if you
                  want steady income during the term.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q2: Does compounding really matter?</h3>
                <p>
                  Yes, more frequent compounding (monthly/quarterly) slightly boosts the maturity compared
                  to yearly compounding for the same APR and tenure.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q3: Can I share my results?</h3>
                <p>
                  Use the <strong>Copy Link</strong> button to copy a URL with your inputs encoded. Opening
                  that link will restore the same scenario.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q4: Do you store my data?</h3>
                <p>
                  No. All calculations run locally in your browser. We only use <strong>localStorage</strong>{" "}
                  to remember your last session on your device for convenience.
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
                Experts in savings and online financial tools. Last updated:{" "}
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
                href="/mortgage-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
              >
                <span className="text-indigo-400">🏠</span> Mortgage Calculator
              </a>
              <a
                href="/loan-emi-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
              >
                <span className="text-emerald-400">💰</span> Loan EMI Calculator
              </a>
              <a
                href="/tax-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-fuchsia-600/20 text-fuchsia-300 hover:text-fuchsia-400 px-3 py-2 rounded-md border border-slate-700 hover:border-fuchsia-500 transition-all duration-200"
              >
                <span className="text-fuchsia-400">🧾</span> Income Tax Calculator
              </a>
            </div>
          </div>
        </section>

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/fd-calculator" category="currency-finance" />
      </div>
    </>
  );
};

export default FDCalculator;
