import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  PiggyBank,
  TrendingUp,
  RotateCcw,
  Share2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import RelatedCalculators from "../components/RelatedCalculators";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

const SIP_TIPS = [
  "Start early — time in the market beats timing the market.",
  "Increase your SIP by 5–10% every year to fight inflation.",
  "Stay invested through market cycles; volatility smooths out long-term.",
  "Align SIP date right after payday to stay disciplined.",
  "Diversify across 2–3 funds (large/mid/ELSS based on goals).",
  "Review once a year, not every week — avoid noise.",
  "Match SIP horizon to your goal (education, house, retirement).",
  "Use ELSS SIPs to potentially get tax benefits (per local rules).",
  "Avoid stopping SIPs during downturns — that’s when units are cheaper.",
  "Rebalance allocation annually to maintain your risk profile.",
];

const LS_KEY = "SIP_CALC_V1";

const CURRENCIES = [
  { code: "INR", symbol: "₹", locale: "en-IN" },
  { code: "USD", symbol: "$", locale: "en-US" },
  { code: "EUR", symbol: "€", locale: "de-DE" },
  { code: "GBP", symbol: "£", locale: "en-GB" },
  { code: "AUD", symbol: "A$", locale: "en-AU" },
];

const formatCurrency = (v: number, currency: string, locale: string) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(isFinite(v) ? v : 0);

const formatCompact = (v: number, locale: string) =>
  new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(isFinite(v) ? v : 0);

const SIPCalculator: React.FC = () => {
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(0);
  const [returnRate, setReturnRate] = useState<number>(0);
  const [timePeriod, setTimePeriod] = useState<number>(0);
  const [currency, setCurrency] = useState("USD");
  const [stepUp, setStepUp] = useState<number>(0);

  const [maturityValue, setMaturityValue] = useState(0);
  const [investedAmount, setInvestedAmount] = useState(0);
  const [estimatedProfit, setEstimatedProfit] = useState(0);
  const [activeTip, setActiveTip] = useState(0);

  const amountRef = useRef<HTMLInputElement>(null);

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setMonthlyInvestment(data.monthlyInvestment || 0);
        setReturnRate(data.returnRate || 0);
        setTimePeriod(data.timePeriod || 0);
        setCurrency(data.currency || "USD");
        setStepUp(data.stepUp || 0);
      } catch {}
    }
  }, []);

  // Save inputs
  useEffect(() => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        monthlyInvestment,
        returnRate,
        timePeriod,
        stepUp,
        currency,
      })
    );
  }, [monthlyInvestment, returnRate, timePeriod, stepUp, currency]);

  // SIP Calculation
  const calculateSIP = () => {
    const P = monthlyInvestment;
    const r = returnRate / 12 / 100;
    const n = timePeriod * 12;
    if (P === 0 || r === 0 || n === 0) {
      setMaturityValue(0);
      setInvestedAmount(0);
      setEstimatedProfit(0);
      return { fvRegular: 0, fvStep: 0, investedStep: 0 };
    }

    const fvRegular = P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    let fvStep = 0;
    let investedStep = 0;
    let monthly = P;
    for (let year = 1; year <= timePeriod; year++) {
      for (let m = 1; m <= 12; m++) {
        const monthsLeft = (timePeriod - year) * 12 + (12 - m + 1);
        fvStep += monthly * Math.pow(1 + r, monthsLeft);
        investedStep += monthly;
      }
      monthly *= 1 + stepUp / 100;
    }

    const invested = P * n;
    const profit = fvRegular - invested;
    setMaturityValue(fvRegular);
    setInvestedAmount(invested);
    setEstimatedProfit(profit);
    return { fvRegular, fvStep, investedStep };
  };

  const { fvRegular, fvStep, investedStep } = useMemo(
    () => calculateSIP(),
    [monthlyInvestment, returnRate, timePeriod, stepUp]
  );

  const selectedCurrency =
    CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  const handleReset = () => {
    setMonthlyInvestment(0);
    setReturnRate(0);
    setTimePeriod(0);
    setStepUp(0);
    amountRef.current?.focus();
    localStorage.removeItem(LS_KEY);
  };

  // Dynamic Tip Rotation
  useEffect(() => {
    const t = setInterval(
      () => setActiveTip((p) => (p + 1) % SIP_TIPS.length),
      5000
    );
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <SEOHead
        title={seoData.sipCalculator.title}
        description={seoData.sipCalculator.description}
        canonical="https://calculatorhub.site/sip-calculator"
        schemaData={generateCalculatorSchema(
          "SIP Calculator",
          seoData.sipCalculator.description,
          "/sip-calculator",
          seoData.sipCalculator.keywords
        )}
      />

      <div className="max-w-5xl mx-auto px-3 sm:px-6">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "SIP Calculator", url: "/sip-calculator" },
          ]}
        />

        {/* === Header === */}
        <div className="mb-6 sm:mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-lg">
            SIP Calculator
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Estimate your SIP maturity value, returns, and step-up growth with
            currency selection and shareable results.
          </p>
        </div>

        {/* === Input + Output === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Input Card */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4 sm:p-6 text-slate-200">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                <PiggyBank className="h-5 w-5 text-emerald-400" /> Investment
                Details
              </h2>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-sm text-slate-300 border border-[#334155] rounded-lg px-2 py-1 hover:bg-[#0f172a] hover:text-white transition"
              >
                <RotateCcw className="h-4 w-4 text-indigo-400" /> Reset
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <label className="block text-sm mb-1 text-slate-300">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-[#0f172a] text-white px-3 py-2 border border-[#334155] rounded-lg text-sm"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </option>
                ))}
              </select>

              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Monthly Investment
                </label>
                <input
                  ref={amountRef}
                  type="number"
                  placeholder="0"
                  value={monthlyInvestment}
                  onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Expected Annual Return (%)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={returnRate}
                  onChange={(e) => setReturnRate(Number(e.target.value))}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Time Period (Years)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(Number(e.target.value))}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Output Card */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4 sm:p-6 text-slate-200">
            <h2 className="text-lg font-semibold text-white mb-4">
              SIP Summary
            </h2>

            <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155] mb-4">
              <TrendingUp className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {formatCurrency(maturityValue, selectedCurrency.code, selectedCurrency.locale)}
              </div>
              <p className="text-sm text-slate-400">Maturity Value</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                <p className="text-white font-semibold">
                  {formatCurrency(investedAmount, selectedCurrency.code, selectedCurrency.locale)}
                </p>
                <p className="text-xs text-slate-400">Total Invested</p>
              </div>
              <div className="p-3 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                <p className="text-white font-semibold">
                  {formatCurrency(estimatedProfit, selectedCurrency.code, selectedCurrency.locale)}
                </p>
                <p className="text-xs text-slate-400">Wealth Gain</p>
              </div>
            </div>
          </div>
        </div>

        {/* === How SIP is Calculated === */}
        {(monthlyInvestment > 0 && returnRate > 0 && timePeriod > 0) && (
          <div className="mt-10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5 rounded-xl border border-slate-700 text-slate-200">
            <h2 className="text-2xl font-semibold text-cyan-300 mb-4 text-center">
              🧮 How SIP is Calculated
            </h2>

            <p className="text-slate-300 mb-3 text-sm">
              SIP Maturity is calculated using the compound interest formula:
            </p>

            <p className="text-lg text-indigo-300 font-mono text-center mb-3">
              FV = P × ((1 + r)<sup>n</sup> − 1) / r × (1 + r)
            </p>

            <div className="text-sm space-y-2">
              <p><strong className="text-cyan-300">P</strong> = Monthly Investment ({formatCurrency(monthlyInvestment, selectedCurrency.code, selectedCurrency.locale)})</p>
              <p><strong className="text-cyan-300">r</strong> = Monthly Rate ({(returnRate / 12 / 100).toFixed(6)})</p>
              <p><strong className="text-cyan-300">n</strong> = Total Months ({timePeriod * 12})</p>
            </div>

            <div className="border-t border-slate-700 my-4" />

            <p className="text-sm">
              Using your values:
              <br />
              FV = {monthlyInvestment} × ((1 + {(returnRate / 12 / 100).toFixed(6)})<sup>{timePeriod * 12}</sup> − 1) / {(returnRate / 12 / 100).toFixed(6)} × (1 + {(returnRate / 12 / 100).toFixed(6)})
            </p>

            <p className="mt-3 text-emerald-400 font-semibold text-center">
              Final SIP Maturity Value = {formatCurrency(maturityValue, selectedCurrency.code, selectedCurrency.locale)}
            </p>
          </div>
        )}

        {/* === SIP Growth Overview (hidden if default 0) === */}
        {(monthlyInvestment > 0 && returnRate > 0 && timePeriod > 0) && (
          <div className="mt-8 bg-[#1e293b] rounded-xl border border-[#334155] p-4 sm:p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              SIP Growth Overview
            </h3>
            <div className="w-full h-[250px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[{ year: 1, value: maturityValue }]} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <ChartTooltip />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="sip-calculator" category="currency-finance" />
      </div>
    </>
  );
};

export default SIPCalculator;
