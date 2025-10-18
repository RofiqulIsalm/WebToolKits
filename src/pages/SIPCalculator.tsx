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

const LS_KEY = "SIP_CALC_V1";
const [hydrated, setHydrated] = useState(false);

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

const CURRENCIES = [
  { code: "INR", symbol: "₹", locale: "en-IN" },
  { code: "USD", symbol: "$", locale: "en-US" },
  { code: "EUR", symbol: "€", locale: "de-DE" },
  { code: "GBP", symbol: "£", locale: "en-GB" },
  { code: "AUD", symbol: "A$", locale: "en-AU" },
  { code: "CAD", symbol: "C$", locale: "en-CA" },
  { code: "SGD", symbol: "S$", locale: "en-SG" },
  { code: "JPY", symbol: "¥", locale: "ja-JP" },
  { code: "BDT", symbol: "৳", locale: "bn-BD" },
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

  /* ========= 💾 Load from LocalStorage ========= */
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        const s = JSON.parse(saved);
        setMonthlyInvestment(Number(s.monthlyInvestment) || 0);
        setReturnRate(Number(s.returnRate) || 0);
        setTimePeriod(Number(s.timePeriod) || 0);
        setStepUp(Number(s.stepUp) || 0);
        setCurrency(s.currency || "USD");
      } catch {}
    }
  }, []);

  /* ========= 💾 Save to LocalStorage ========= */
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

  const handleReset = () => {
    setMonthlyInvestment(0);
    setReturnRate(0);
    setTimePeriod(0);
    setStepUp(0);
    setCurrency("USD");
    localStorage.removeItem(LS_KEY);
    amountRef.current?.focus();
  };

  useEffect(() => {
    const t = setInterval(
      () => setActiveTip((p) => (p + 1) % SIP_TIPS.length),
      5000
    );
    return () => clearInterval(t);
  }, []);

  const selectedCurrency =
    CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  const formatReadableNumber = (value: number, locale: string, currency: string) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value || 0);

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
        breadcrumbs={[
          { name: "Currency & Finance", url: "/category/currency-finance" },
          { name: "SIP Calculator", url: "/sip-calculator" },
        ]}
      />

      <div className="max-w-5xl mx-auto px-3 sm:px-6">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "SIP Calculator", url: "/sip-calculator" },
          ]}
        />

        {/* Inputs + Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* INPUT CARD */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4 sm:p-6 text-slate-200">
            <div className="flex justify-between items-center mb-3 sm:mb-4 flex-wrap gap-2">
              <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-emerald-400" /> Investment Details
              </h2>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-xs sm:text-sm text-slate-300 border border-[#334155] rounded-lg px-2 py-1 hover:bg-[#0f172a] hover:text-white transition"
              >
                <RotateCcw className="h-4 w-4 text-indigo-400" /> Reset
              </button>
            </div>

            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm mb-1 text-slate-300">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-[#0f172a] text-white px-3 py-2 border border-[#334155] rounded-lg text-sm sm:text-base"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.code}
                    </option>
                  ))}
                </select>
              </div>

              {[
                {
                  label: "Monthly Investment",
                  value: monthlyInvestment,
                  set: setMonthlyInvestment,
                  min: 500,
                  max: 10000000,
                  step: 500,
                  accent: "accent-emerald-500",
                },
                {
                  label: "Expected Annual Return (%)",
                  value: returnRate,
                  set: setReturnRate,
                  min: 1,
                  max: 50,
                  step: 0.1,
                  accent: "accent-indigo-500",
                },
                {
                  label: "Time Period (Years)",
                  value: timePeriod,
                  set: setTimePeriod,
                  min: 1,
                  max: 100,
                  step: 1,
                  accent: "accent-yellow-500",
                },
              ].map((f, i) => (
                <div key={i}>
                  <label className="block text-sm text-slate-300 mb-1">
                    {f.label}
                  </label>
                  <input
                    ref={i === 0 ? amountRef : undefined}
                    type="number"
                    placeholder="0"
                    value={f.value}
                    onChange={(e) => f.set(Number(e.target.value))}
                    className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg text-sm sm:text-base"
                  />
                  <input
                    type="range"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={f.value}
                    onChange={(e) => f.set(Number(e.target.value))}
                    className={`w-full mt-2 ${f.accent}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* OUTPUT CARD */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4 sm:p-6 text-slate-200">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
              SIP Summary
            </h2>

            <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155] mb-4">
              <TrendingUp className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-xl sm:text-2xl font-bold text-white">
                {formatReadableNumber(maturityValue, selectedCurrency.locale, selectedCurrency.code)}
              </div>
              <p className="text-xs sm:text-sm text-slate-400">Maturity Value</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { label: "Total Invested", val: investedAmount },
                { label: "Wealth Gain", val: estimatedProfit },
              ].map((x, i) => (
                <div
                  key={i}
                  className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]"
                >
                  <div className="text-lg font-semibold text-white">
                    {formatReadableNumber(x.val, selectedCurrency.locale, selectedCurrency.code)}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400">{x.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 💡 Tip */}
        <div className="mt-5 bg-[#1e293b] border border-[#334155] px-4 py-3 rounded-md text-slate-200 flex items-center">
          <span className="text-xl sm:text-2xl text-indigo-400 mr-3">💡</span>
          <p className="text-sm sm:text-base font-medium text-slate-300">{SIP_TIPS[activeTip]}</p>
        </div>

        {/* 📈 Chart — Hidden if inputs are 0 */}
        {monthlyInvestment > 0 && returnRate > 0 && timePeriod > 0 && (
          <div className="mt-6 bg-[#1e293b] rounded-xl border border-[#334155] p-4 sm:p-6 text-slate-200">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6 text-center">
              SIP Growth Overview
            </h3>
            <div className="w-full h-[250px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={Array.from({ length: timePeriod }, (_, i) => ({
                    year: i + 1,
                    invested: monthlyInvestment * (i + 1) * 12,
                    value:
                      monthlyInvestment *
                      ((Math.pow(1 + returnRate / 12 / 100, (i + 1) * 12) - 1) /
                        (returnRate / 12 / 100)) *
                      (1 + returnRate / 12 / 100),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" tickFormatter={(y) => `${y}y`} />
                  <YAxis tickFormatter={(v) => formatCompact(v, selectedCurrency.locale)} />
                  <ChartTooltip />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="invested" stroke="#6366f1" strokeWidth={2} dot={false} />
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
