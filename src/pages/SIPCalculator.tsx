import React, { useEffect, useMemo, useRef, useState } from "react";
import { PiggyBank, TrendingUp, RotateCcw, Share2 } from "lucide-react";
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

// 💡 Rotating SIP Tips
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
  { code: "NZD", symbol: "NZ$", locale: "en-NZ" },
  { code: "CHF", symbol: "CHF", locale: "de-CH" },
  { code: "JPY", symbol: "¥", locale: "ja-JP" },
  { code: "CNY", symbol: "¥", locale: "zh-CN" },
  { code: "HKD", symbol: "HK$", locale: "en-HK" },
  { code: "SEK", symbol: "kr", locale: "sv-SE" },
  { code: "NOK", symbol: "kr", locale: "nb-NO" },
  { code: "DKK", symbol: "kr", locale: "da-DK" },
  { code: "AED", symbol: "د.إ", locale: "ar-AE" },
  { code: "SAR", symbol: "﷼", locale: "ar-SA" },
  { code: "ZAR", symbol: "R", locale: "en-ZA" },
  { code: "BRL", symbol: "R$", locale: "pt-BR" },
  { code: "MXN", symbol: "$", locale: "es-MX" },
  { code: "ARS", symbol: "$", locale: "es-AR" },
  { code: "CLP", symbol: "$", locale: "es-CL" },
  { code: "COP", symbol: "$", locale: "es-CO" },
  { code: "PEN", symbol: "S/", locale: "es-PE" },
  { code: "KRW", symbol: "₩", locale: "ko-KR" },
  { code: "THB", symbol: "฿", locale: "th-TH" },
  { code: "MYR", symbol: "RM", locale: "ms-MY" },
  { code: "IDR", symbol: "Rp", locale: "id-ID" },
  { code: "PHP", symbol: "₱", locale: "en-PH" },
  { code: "VND", symbol: "₫", locale: "vi-VN" },
  { code: "TRY", symbol: "₺", locale: "tr-TR" },
  { code: "EGP", symbol: "£", locale: "ar-EG" },
  { code: "NGN", symbol: "₦", locale: "en-NG" },
  { code: "KES", symbol: "KSh", locale: "en-KE" },
  { code: "GHS", symbol: "₵", locale: "en-GH" },
  { code: "UGX", symbol: "USh", locale: "en-UG" },
  { code: "TZS", symbol: "TSh", locale: "en-TZ" },
  { code: "BDT", symbol: "৳", locale: "bn-BD" },
  { code: "LKR", symbol: "Rs", locale: "si-LK" },
  { code: "PKR", symbol: "₨", locale: "ur-PK" },
  { code: "NPR", symbol: "Rs", locale: "ne-NP" },
  { code: "BHD", symbol: "ب.د", locale: "ar-BH" },
  { code: "OMR", symbol: "﷼", locale: "ar-OM" },
  { code: "QAR", symbol: "﷼", locale: "ar-QA" },
  { code: "KWD", symbol: "د.ك", locale: "ar-KW" },
  { code: "ILS", symbol: "₪", locale: "he-IL" },
  { code: "PLN", symbol: "zł", locale: "pl-PL" },
  { code: "CZK", symbol: "Kč", locale: "cs-CZ" },
  { code: "HUF", symbol: "Ft", locale: "hu-HU" },
  { code: "RUB", symbol: "₽", locale: "ru-RU" },
  { code: "RON", symbol: "lei", locale: "ro-RO" },
];

// Format readable numbers (10M, 1B, 1T)
const formatReadableNumber = (value: number, locale: string, currency: string) => {
  if (!isFinite(value)) return "0";
  if (value <= 9_999_999) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }
  const compact = new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
  const currencySymbol =
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    })
      .formatToParts(1)
      .find((p) => p.type === "currency")?.value || "";
  return `${currencySymbol}${compact}`;
};

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

  const calculateSIP = () => {
    const P = monthlyInvestment;
    const r = returnRate / 12 / 100;
    const n = timePeriod * 12;
    const fvRegular = r > 0 ? P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r) : P * n;
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

  const { fvRegular, fvStep, investedStep } = useMemo(() => calculateSIP(), [
    monthlyInvestment,
    returnRate,
    timePeriod,
    stepUp,
  ]);

  const selectedCurrency =
    CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  const handleReset = () => {
    setMonthlyInvestment(0);
    setReturnRate(0);
    setTimePeriod(0);
    setStepUp(0);
    amountRef.current?.focus();
  };

  const copyShare = async () => {
    const params = new URLSearchParams({
      amount: String(monthlyInvestment),
      rate: String(returnRate),
      years: String(timePeriod),
    });
    await navigator.clipboard.writeText(
      `${window.location.origin}/sip-calculator?${params.toString()}`
    );
    alert("Shareable link copied!");
  };

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

        {/* Heading */}
        <div className="mb-6 sm:mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            SIP Calculator
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Estimate your SIP maturity value, returns, and step-up growth with currency selection and shareable results.
          </p>
        </div>

        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="bg-[#1e293b] p-4 sm:p-6 rounded-xl border border-[#334155]">
            <div className="flex justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-emerald-400" /> Investment Details
              </h2>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-sm border border-[#334155] text-slate-300 rounded-lg px-2 py-1 hover:bg-[#0f172a]"
              >
                <RotateCcw className="h-4 w-4 text-indigo-400" /> Reset
              </button>
            </div>

            {/* Fields */}
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-[#0f172a] text-white px-3 py-2 border border-[#334155] rounded-lg"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.code}
                    </option>
                  ))}
                </select>
              </div>

              {[
                { label: "Monthly Investment", value: monthlyInvestment, set: setMonthlyInvestment, min: 0, max: 10000000 },
                { label: "Expected Annual Return (%)", value: returnRate, set: setReturnRate, min: 0, max: 50 },
                { label: "Time Period (Years)", value: timePeriod, set: setTimePeriod, min: 0, max: 100 },
                { label: "Annual Step-up (%)", value: stepUp, set: setStepUp, min: 0, max: 20 },
              ].map((f, i) => (
                <div key={i}>
                  <label className="block text-sm text-slate-300 mb-1">{f.label}</label>
                  <input
                    ref={i === 0 ? amountRef : undefined}
                    type="number"
                    value={f.value === 0 ? "" : f.value}
                    placeholder="Enter value"
                    onChange={(e) =>
                      f.set(e.target.value === "" ? 0 : Number(e.target.value))
                    }
                    className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg"
                  />
                  <input
                    type="range"
                    min={f.min}
                    max={f.max}
                    step="1"
                    value={f.value}
                    onChange={(e) => f.set(Number(e.target.value))}
                    className="w-full mt-2 accent-indigo-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Output */}
          <div className="bg-[#1e293b] p-4 sm:p-6 rounded-xl border border-[#334155] text-slate-200">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
              SIP Summary
            </h2>
            <div className="text-center p-4 bg-[#0f172a] border border-[#334155] rounded-lg mb-4">
              <TrendingUp className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-xl sm:text-2xl font-bold text-white">
                {formatReadableNumber(
                  maturityValue,
                  selectedCurrency.locale,
                  selectedCurrency.code
                )}
              </div>
              <p className="text-sm text-slate-400">Maturity Value</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { label: "Total Invested", val: investedAmount },
                { label: "Wealth Gain", val: estimatedProfit },
              ].map((x, i) => (
                <div
                  key={i}
                  className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center"
                >
                  <div className="text-lg font-semibold text-white">
                    {formatReadableNumber(
                      x.val,
                      selectedCurrency.locale,
                      selectedCurrency.code
                    )}
                  </div>
                  <div className="text-sm text-slate-400">{x.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Smart Tip */}
        <div className="mt-6 bg-[#1e293b] border border-[#334155] p-4 rounded-lg flex items-center text-slate-200">
          <span className="text-2xl text-indigo-400 mr-3">💡</span>
          <p className="text-sm sm:text-base font-medium">
            {SIP_TIPS[activeTip]}
          </p>
        </div>

        {/* Chart */}
        <div className="mt-6 bg-[#1e293b] p-4 sm:p-6 rounded-xl border border-[#334155]">
          <h3 className="text-lg font-semibold text-white mb-6 text-center">
            SIP Growth Overview
          </h3>
          <div className="w-full h-[250px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <ChartTooltip />
                <Line type="monotone" dataKey="value" stroke="#10b981" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/sip-calculator" category="currency-finance" />
      </div>
    </>
  );
};

export default SIPCalculator;
