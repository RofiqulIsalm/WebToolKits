
import React, { useState, useEffect } from "react";
import {
  PiggyBank,
  RotateCcw,
  Copy,
  Share2,
  Info,
} from "lucide-react";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import AdBanner from "../components/AdBanner";
import RelatedCalculators from "../components/RelatedCalculators";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

/* ============================================================
   📦 CONSTANTS
   ============================================================ */
const LS_KEY = "lump_sum_investment_calc_v1";

const currencyOptions = [
  { code: "USD", symbol: "$", locale: "en-US", label: "US Dollar ($)" },
  { code: "INR", symbol: "₹", locale: "en-IN", label: "Indian Rupee (₹)" },
  { code: "EUR", symbol: "€", locale: "de-DE", label: "Euro (€)" },
  { code: "GBP", symbol: "£", locale: "en-GB", label: "British Pound (£)" },
];

const findLocale = (code: string) =>
  currencyOptions.find((c) => c.code === code)?.locale || "en-US";
const findSymbol = (code: string) =>
  currencyOptions.find((c) => c.code === code)?.symbol || "";

const formatCurrency = (num: number, locale: string, currency: string) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);

/* ============================================================
   💰 COMPONENT
   ============================================================ */
const LumpSumInvestmentCalculator: React.FC = () => {
  // Inputs
  const [principal, setPrincipal] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [years, setYears] = useState<number>(0);
  const [months, setMonths] = useState<number>(0);
  const [compounding, setCompounding] = useState<number>(1);
  const [currency, setCurrency] = useState<string>("USD");

  // Outputs
  const [finalValue, setFinalValue] = useState<number>(0);
  const [totalGain, setTotalGain] = useState<number>(0);
  const [cagr, setCagr] = useState<number>(0);

  // UI
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [hydrated, setHydrated] = useState(false);
  const [showInfoRate, setShowInfoRate] = useState(false);
  const [showInfoComp, setShowInfoComp] = useState(false);

  const currentLocale = findLocale(currency);
  const isDefault = !principal && !rate && !years && !months;

  /* ============================================================
     🔁 PERSISTENCE
     ============================================================ */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setPrincipal(s.principal || 0);
        setRate(s.rate || 0);
        setYears(s.years || 0);
        setMonths(s.months || 0);
        setCompounding(s.compounding || 1);
        setCurrency(s.currency || "USD");
      }
    } catch {
      console.warn("⚠️ Could not load state");
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ principal, rate, years, months, compounding, currency })
      );
    } catch {
      console.warn("⚠️ Could not save state");
    }
  }, [hydrated, principal, rate, years, months, compounding, currency]);

  /* ============================================================
     🧮 CALCULATION
     ============================================================ */
  useEffect(() => {
    const totalYears = years + months / 12;
    if (principal <= 0 || rate <= 0 || totalYears <= 0) {
      setFinalValue(0);
      setTotalGain(0);
      setCagr(0);
      return;
    }

    const r = rate / 100;
    const n = compounding;
    const fv = principal * Math.pow(1 + r / n, n * totalYears);
    const gain = fv - principal;
    const cagrValue = (Math.pow(fv / principal, 1 / totalYears) - 1) * 100;

    setFinalValue(fv);
    setTotalGain(gain);
    setCagr(cagrValue);
  }, [principal, rate, years, months, compounding]);

  /* ============================================================
     🔗 COPY / SHARE / RESET
     ============================================================ */
  const reset = () => {
    setPrincipal(0);
    setRate(0);
    setYears(0);
    setMonths(0);
    setCompounding(1);
    setCurrency("USD");
    localStorage.removeItem(LS_KEY);
  };

  const copyResults = async () => {
    const text = [
      "Lump Sum Investment Summary",
      `Principal: ${formatCurrency(principal, currentLocale, currency)}`,
      `Rate: ${rate}%`,
      `Time: ${years}y ${months}m`,
      `Compounding: ${compounding}x per year`,
      `Final Value: ${formatCurrency(finalValue, currentLocale, currency)}`,
      `Total Gain: ${formatCurrency(totalGain, currentLocale, currency)}`,
      `CAGR: ${cagr.toFixed(2)}%`,
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const encoded = btoa(
      JSON.stringify({ principal, rate, years, months, compounding, currency })
    );
    const url = new URL(window.location.href);
    url.searchParams.set("lump", encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  /* ============================================================
     🎨 RENDER START
     ============================================================ */
  return (
    <>
      <SEOHead
        title="Lump Sum Investment Calculator | CalculatorHub"
        description="Estimate your future returns on one-time investments using our free lump sum investment calculator with CAGR and compound interest."
        canonical="https://calculatorhub.site/lump-sum-investment-calculator"
        schemaData={generateCalculatorSchema(
          "Lump Sum Investment Calculator",
          "Calculate the future value and CAGR of a one-time investment using CalculatorHub’s free tool.",
          "/lump-sum-investment-calculator",
          ["lump sum calculator", "compound interest", "investment growth", "finance tool"]
        )}
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Investment & Returns", url: "/category/investment-returns" },
            { name: "Lump Sum Investment Calculator", url: "/lump-sum-investment-calculator" },
          ]}
        />

        {/* ===== Header ===== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            💰 Lump Sum Investment Calculator
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Find the future value and CAGR of your one-time investment using compound interest — perfect for mutual funds, deposits, or retirement planning.
          </p>
        </div>

        {/* ===== Input + Output Grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-emerald-400" /> Investment Details
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

              {/* Principal */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">
                  Investment Amount ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={principal || ""}
                  onChange={(e) => setPrincipal(parseFloat(e.target.value) || 0)}
                  placeholder="Enter investment amount"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Interest Rate */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Expected Annual Return (%)
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoRate(!showInfoRate)}
                  />
                </label>
                {showInfoRate && (
                  <p className="text-xs bg-[#0f172a] border border-[#334155] rounded-md p-2 mt-1">
                    Average annual growth or return expected from your investment.
                  </p>
                )}
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={rate || ""}
                  onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                  placeholder="Enter annual return rate"
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="text-sm font-medium text-slate-300">Investment Duration</label>
                <div className="flex gap-4">
                  <input
                    type="number"
                    min={0}
                    value={years || ""}
                    onChange={(e) => setYears(parseFloat(e.target.value) || 0)}
                    placeholder="Years"
                    className="w-1/2 bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    min={0}
                    value={months || ""}
                    onChange={(e) => setMonths(parseFloat(e.target.value) || 0)}
                    placeholder="Months"
                    className="w-1/2 bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Compounding */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Compounding Frequency
                  <Info
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    onClick={() => setShowInfoComp(!showInfoComp)}
                  />
                </label>
                {showInfoComp && (
                  <p className="text-xs bg-[#0f172a] border border-[#334155] rounded-md p-2 mt-1">
                    Choose how often interest is compounded — more frequent compounding increases growth.
                  </p>
                )}
                <select
                  value={compounding}
                  onChange={(e) => setCompounding(parseInt(e.target.value))}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={1}>Annually</option>
                  <option value={2}>Semi-Annually</option>
                  <option value={4}>Quarterly</option>
                  <option value={12}>Monthly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">Investment Summary</h2>
            <div className="space-y-6">
              <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(finalValue, currentLocale, currency)}
                </div>
                <div className="text-sm text-slate-400">Final Value</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(totalGain, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Total Gain</div>
                </div>
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {cagr.toFixed(2)}%
                  </div>
                  <div className="text-sm text-slate-400">CAGR</div>
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
        {/* ===== Chart & Breakdown ===== */}
        {finalValue > 0 && (
          <div className="mt-6 bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              Investment Growth Breakdown
            </h3>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Pie Chart */}
              <div className="w-[90%] sm:w-[70%] md:w-[50%] max-w-[360px] h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Principal", value: principal },
                        { name: "Growth", value: totalGain },
                      ]}
                      dataKey="value"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {PIE_COLORS.map((c, i) => (
                        <Cell key={i} fill={c} />
                      ))}
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
                  <p className="text-sm text-slate-400">Principal</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(principal, currentLocale, currency)}
                  </p>
                </div>
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center hover:border-emerald-500 transition">
                  <p className="text-sm text-slate-400">Total Growth</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(totalGain, currentLocale, currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Smart Tip ===== */}
        {finalValue > 0 && (
          <div className="mt-5 bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm">
            <p className="text-base font-medium leading-snug text-slate-300">
              💡 Tip: The longer your money stays invested, the greater the power of 
              <span className="text-emerald-400 font-semibold"> compounding </span>!  
              Even small differences in time or rate can have a big impact on growth.
            </p>
          </div>
        )}

        {/* ===== SEO CONTENT SECTION ===== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          <h1 className="text-3xl font-bold text-cyan-400 mb-6">
            Lump Sum Investment Calculator 2025 – Plan Your Future Wealth
          </h1>

          <p>
            Use the <strong>Lump Sum Investment Calculator by CalculatorHub</strong> to estimate the
            <strong> future value </strong> of your one-time investment.  
            It applies the compound-interest formula and calculates CAGR automatically.
          </p>

          <figure className="my-8">
            <img
              src="/images/lump-sum-calculator-hero.webp"
              alt="Lump Sum Investment calculator dashboard with pie chart"
              title="Lump Sum Investment Calculator | Future Value & CAGR"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Dark-mode investment dashboard showing future value and CAGR results.
            </figcaption>
          </figure>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            🧮 Lump Sum Formula
          </h2>
          <p className="font-mono text-center text-indigo-300">
            FV = P × (1 + r / n)<sup>n × t</sup>
          </p>
          <ul className="list-disc list-inside space-y-2 mt-3">
            <li><strong>P</strong> = Principal amount</li>
            <li><strong>r</strong> = Annual interest rate (decimal)</li>
            <li><strong>n</strong> = Compounding frequency per year</li>
            <li><strong>t</strong> = Time in years</li>
          </ul>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📘 Example
          </h2>
          <p>
            Investing <em>$10 000</em> for 10 years at 8 % compounded annually gives:  
            FV = 10 000 × (1 + 0.08)<sup>10</sup> = <em>$21 589</em>.  
            Total growth = $11 589, CAGR = 8 %.
          </p>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            💡 Why Use This Calculator
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>See exactly how compounding increases your wealth over time.</li>
            <li>Compare outcomes for different compounding frequencies.</li>
            <li>Plan long-term goals like education, home purchase, or retirement.</li>
          </ul>

          {/* ===== FAQ ===== */}
          <section id="faq" className="space-y-6 mt-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>

            <div className="space-y-5 text-lg text-slate-100 leading-relaxed">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q1: What is a lump sum investment?
                </h3>
                <p>
                  It’s a one-time deposit of money invested for a set period, earning compound interest
                  without additional monthly contributions.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q2: Which is better – lump sum or SIP?
                </h3>
                <p>
                  Lump-sum gives higher returns if invested at the right time, while SIP reduces market-timing risk
                  by spreading investments monthly.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q3: How often should I compound my investment?
                </h3>
                <p>
                  More frequent compounding (quarterly or monthly) leads to slightly higher returns, though the difference narrows over time.
                </p>
              </div>
            </div>
          </section>
        </section>

        {/* ===== Footer & Related Tools ===== */}
        <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
          <div className="flex items-center gap-3">
            <img
              src="/images/calculatorhub-author.webp"
              alt="CalculatorHub Finance Tools Team"
              className="w-12 h-12 rounded-full border border-gray-600"
              loading="lazy"
            />
            <div>
              <p className="font-semibold text-white">
                Written by the CalculatorHub Finance Tools Team
              </p>
              <p className="text-sm text-slate-400">
                Verified for accuracy & clarity. Last updated: 
                <time dateTime="2025-10-20">October 20, 2025</time>.
              </p>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              🚀 Explore more investment tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <a
                href="/sip-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all"
              >
                📆 SIP Calculator
              </a>
              <a
                href="/cagr-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all"
              >
                📈 CAGR Calculator
              </a>
              <a
                href="/roi-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-fuchsia-600/20 text-fuchsia-300 hover:text-fuchsia-400 px-3 py-2 rounded-md border border-slate-700 hover:border-fuchsia-500 transition-all"
              >
                💹 ROI Calculator
              </a>
            </div>
          </div>
        </section>

        <AdBanner type="bottom" />
        <RelatedCalculators
          currentPath="/lump-sum-investment-calculator"
          category="investment-returns"
        />
      </div>
    </>
  );
};

export default LumpSumInvestmentCalculator;

