import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet";
import {
  RotateCcw,
  Share2,
  Copy,
  PieChart as PieChartIcon,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import RelatedCalculators from "../components/RelatedCalculators";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

const LS_KEY = "sip_calculator_v1";

const defaultValues = {
  monthlyInvestment: 10000,
  annualReturn: 12,
  years: 10,
  currency: "USD",
};

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

const SipCalculator: React.FC = () => {
  const [monthlyInvestment, setMonthlyInvestment] = useState(defaultValues.monthlyInvestment);
  const [annualReturn, setAnnualReturn] = useState(defaultValues.annualReturn);
  const [years, setYears] = useState(defaultValues.years);
  const [currency, setCurrency] = useState(defaultValues.currency);
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [showSteps, setShowSteps] = useState(false);

  const months = years * 12;
  const monthlyRate = annualReturn / 12 / 100;

  // Calculation formula for SIP
  const futureValue = useMemo(() => {
    if (monthlyRate === 0) return monthlyInvestment * months;
    return monthlyInvestment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
  }, [monthlyInvestment, monthlyRate, months]);

  const totalInvestment = monthlyInvestment * months;
  const totalGains = futureValue - totalInvestment;

  /* ===================== Persistence ===================== */
  const applyState = (s: any) => {
    setMonthlyInvestment(Number(s.monthlyInvestment) || 0);
    setAnnualReturn(Number(s.annualReturn) || 0);
    setYears(Number(s.years) || 0);
    setCurrency(typeof s.currency === "string" ? s.currency : "USD");
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromURL = params.get("sip");
      if (fromURL) {
        const decoded = JSON.parse(atob(fromURL));
        applyState(decoded);
        setHydrated(true);
        return;
      }
      const raw = localStorage.getItem(LS_KEY);
      if (raw) applyState(JSON.parse(raw));
    } catch (err) {
      console.warn("Failed to load SIP state", err);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ monthlyInvestment, annualReturn, years, currency })
      );
    } catch (err) {
      console.warn("Could not save SIP state", err);
    }
  }, [monthlyInvestment, annualReturn, years, currency, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const url = new URL(window.location.href);
    const state = { monthlyInvestment, annualReturn, years, currency };
    const encoded = btoa(JSON.stringify(state));
    url.searchParams.set("sip", encoded);
    window.history.replaceState({}, "", url);
  }, [monthlyInvestment, annualReturn, years, currency, hydrated]);

  /* ===================== Copy / Reset ===================== */
  const currentLocale = findLocale(currency);

  const copyResults = async () => {
    const text = [
      "SIP Investment Summary",
      `Monthly Investment: ${formatCurrency(monthlyInvestment, currentLocale, currency)}`,
      `Expected Annual Return: ${annualReturn}%`,
      `Duration: ${years} years`,
      `Future Value: ${formatCurrency(futureValue, currentLocale, currency)}`,
      `Total Investment: ${formatCurrency(totalInvestment, currentLocale, currency)}`,
      `Total Gains: ${formatCurrency(totalGains, currentLocale, currency)}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const encoded = btoa(
      JSON.stringify({ monthlyInvestment, annualReturn, years, currency })
    );
    const url = new URL(window.location.href);
    url.searchParams.set("sip", encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  const reset = () => {
    setMonthlyInvestment(defaultValues.monthlyInvestment);
    setAnnualReturn(defaultValues.annualReturn);
    setYears(defaultValues.years);
    setCurrency(defaultValues.currency);
    localStorage.removeItem(LS_KEY);
  };

  const pieData = [
    { name: "Invested Amount", value: totalInvestment },
    { name: "Total Gains", value: totalGains },
  ];

  /* ===================== Render ===================== */
  return (
    <>
      <SEOHead
        title="SIP Calculator | Systematic Investment Plan Return Estimator"
        description="Use CalculatorHub’s SIP Calculator to estimate your investment returns, maturity value, and total gains based on monthly investment, tenure, and return rate."
        canonical="https://calculatorhub.site/sip-calculator"
        schemaData={generateCalculatorSchema(
          "SIP Calculator",
          "Estimate SIP maturity amount and investment growth using CalculatorHub’s online SIP Calculator.",
          "/sip-calculator",
          ["sip calculator", "investment returns", "mutual fund calculator"]
        )}
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Investments & Finance", url: "/category/investments" },
            { name: "SIP Calculator", url: "/sip-calculator" },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">📈 SIP Calculator</h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Calculate your future SIP returns, maturity amount, and total gains using our systematic investment plan calculator.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                💰 Investment Details
              </h2>
              <button
                onClick={reset}
                className="flex items-center gap-1 text-sm text-slate-300 border border-[#334155] rounded-lg px-2 py-1 hover:bg-[#0f172a]"
              >
                <RotateCcw className="h-4 w-4 text-indigo-400" /> Reset
              </button>
            </div>

            <div className="space-y-5">
              {/* Currency */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-[#0f172a] text-white px-3 py-2 rounded-md w-48 border border-[#334155]"
                >
                  {currencyOptions.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monthly Investment */}
              <div>
                <label className="text-sm font-medium text-slate-300">
                  Monthly Investment ({findSymbol(currency)})
                </label>
                <input
                  type="number"
                  value={monthlyInvestment}
                  onChange={(e) => setMonthlyInvestment(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Annual Return */}
              <div>
                <label className="text-sm font-medium text-slate-300">Expected Annual Return (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={annualReturn}
                  onChange={(e) => setAnnualReturn(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="text-sm font-medium text-slate-300">Investment Period (Years)</label>
                <input
                  type="number"
                  value={years}
                  onChange={(e) => setYears(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Output */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">SIP Summary</h2>

            <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
              <PieChartIcon className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {formatCurrency(futureValue, currentLocale, currency)}
              </div>
              <div className="text-sm text-slate-400">Maturity Amount</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                <div className="font-semibold text-white">
                  {formatCurrency(totalInvestment, currentLocale, currency)}
                </div>
                <div className="text-sm text-slate-400">Total Investment</div>
              </div>
              <div className="p-3 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                <div className="font-semibold text-white">
                  {formatCurrency(totalGains, currentLocale, currency)}
                </div>
                <div className="text-sm text-slate-400">Total Gains</div>
              </div>
            </div>

            <div className="flex gap-3 mt-5 flex-wrap">
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

        {/* Pie Chart */}
        {totalInvestment > 0 && (
          <div className="mt-6 bg-[#1e293b] border border-[#334155] rounded-xl p-6">
            <h3 className="text-center text-white font-semibold mb-6">
              SIP Growth Breakdown
            </h3>
            <div className="flex justify-center">
              <ResponsiveContainer width="90%" height={250}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" outerRadius={90} innerRadius={60}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={["#3b82f6", "#22c55e"][i]} />
                    ))}
                  </Pie>
                  <ReTooltip formatter={(v: any) => formatCurrency(Number(v), currentLocale, currency)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* How SIP is Calculated */}
        <div className="mt-10 bg-[#0f172a] border border-[#334155] rounded-xl p-6">
          <button
            onClick={() => setShowSteps((v) => !v)}
            className="flex justify-between items-center w-full text-left text-white text-lg font-semibold"
          >
            🧮 How SIP is Calculated
            {showSteps ? <ChevronUp /> : <ChevronDown />}
          </button>

          {showSteps && (
            <div className="mt-4 text-slate-300 text-sm leading-relaxed">
              <p>
                SIP future value formula:
                <br />
                <code className="text-indigo-300">
                  FV = P × ((1 + r)<sup>n</sup> − 1) / r × (1 + r)
                </code>
              </p>
              <p className="mt-2">
                Where:
                <ul className="list-disc ml-5 mt-1">
                  <li>P = Monthly investment</li>
                  <li>r = Monthly interest rate (annual rate ÷ 12 ÷ 100)</li>
                  <li>n = Total months</li>
                </ul>
              </p>
              <p className="mt-2">
                Example: Investing {formatCurrency(10000, currentLocale, currency)} monthly for 10 years at 12% annual return will grow to approximately {formatCurrency(2320000, currentLocale, currency)}.
              </p>
            </div>
          )}
        </div>

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/sip-calculator" category="investments" />
      </div>
    </>
  );
};

export default SipCalculator;
