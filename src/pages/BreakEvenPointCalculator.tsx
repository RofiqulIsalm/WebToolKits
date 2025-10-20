// ================= BreakEvenCalculator.tsx (Part 1/2) =================
import React, { useState, useEffect } from "react";
import {
  BarChart2,
  RotateCcw,
  Copy,
  Share2,
  Info,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import AdBanner from "../components/AdBanner";
import RelatedCalculators from "../components/RelatedCalculators";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

/* ============================================================
   ⚙️ CONSTANTS
   ============================================================ */
const LS_KEY = "break_even_calculator_v1";


const BreakEvenChart: React.FC<{
  sellingPrice: number;
  variableCost: number;
  fixedCost: number;
  breakEvenUnits: number;
  currency: string;
  locale: string;
}> = ({ sellingPrice, variableCost, fixedCost, breakEvenUnits, currency, locale }) => {
  const data: any[] = [];
  const maxUnits = Math.ceil(breakEvenUnits * 2 || 10);

  for (let x = 0; x <= maxUnits; x++) {
    data.push({
      units: x,
      revenue: sellingPrice * x,
      cost: fixedCost + variableCost * x,
    });
  }

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
   📈 COMPONENT
   ============================================================ */
const BreakEvenCalculator: React.FC = () => {
  // Inputs
  const [fixedCost, setFixedCost] = useState<number>(0);
  const [variableCost, setVariableCost] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("USD");

  // Outputs
  const [breakEvenUnits, setBreakEvenUnits] = useState<number>(0);
  const [breakEvenRevenue, setBreakEvenRevenue] = useState<number>(0);
  const [profitPerUnit, setProfitPerUnit] = useState<number>(0);

  // UI
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");
  const [hydrated, setHydrated] = useState(false);
  const [showInfoCosts, setShowInfoCosts] = useState(false);
  const [showInfoRevenue, setShowInfoRevenue] = useState(false);

  const currentLocale = findLocale(currency);
  const isDefault = !fixedCost && !variableCost && !sellingPrice;

  /* ============================================================
     🔁 PERSISTENCE
     ============================================================ */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setFixedCost(s.fixedCost || 0);
        setVariableCost(s.variableCost || 0);
        setSellingPrice(s.sellingPrice || 0);
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
        JSON.stringify({ fixedCost, variableCost, sellingPrice, currency })
      );
    } catch {
      console.warn("⚠️ Could not save state");
    }
  }, [hydrated, fixedCost, variableCost, sellingPrice, currency]);

  /* ============================================================
     🧮 CALCULATION
     ============================================================ */
  useEffect(() => {
    if (sellingPrice <= variableCost || sellingPrice <= 0 || variableCost < 0) {
      setBreakEvenUnits(0);
      setBreakEvenRevenue(0);
      setProfitPerUnit(0);
      return;
    }

    const profit = sellingPrice - variableCost;
    const units = fixedCost / profit;
    const revenue = units * sellingPrice;

    setProfitPerUnit(profit);
    setBreakEvenUnits(units);
    setBreakEvenRevenue(revenue);
  }, [fixedCost, variableCost, sellingPrice]);

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
     🎨 RENDER START
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
            { name: "Business & Profitability", url: "/category/business-profit" },
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

        {/* ===== Input + Output Grid ===== */}
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

              {/* Fixed Cost */}
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


    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
        <XAxis dataKey="units" stroke="#94a3b8" />
        <YAxis
          tickFormatter={(v) => `${findSymbol(currency)}${(v / 1000).toFixed(0)}k`}
          stroke="#94a3b8"
        />
        <ReTooltip
          formatter={(v: any) => formatCurrency(Number(v), locale, currency)}
        />
        <Legend />
        <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
        <Line type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
{/* ===== Chart + Tips Section ===== */}
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
      💡 The intersection of red and blue lines shows your break-even point — where total cost equals total revenue.
    </p>
  </div>
)}

{/* ===== Smart Tip ===== */}
{breakEvenUnits > 0 && (
  <div className="mt-5 bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm">
    <p className="text-base font-medium leading-snug text-slate-300">
      💡 Tip: Lowering variable costs or increasing your selling price
      can dramatically reduce the number of units needed to break even.
    </p>
  </div>
)}

{/* ===== SEO / Informational Section ===== */}
<section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
  <h1 className="text-3xl font-bold text-cyan-400 mb-6">
    Break-Even Point Calculator 2025 – Profit Starts Here
  </h1>

  <p>
    The <strong>Break-Even Point Calculator by CalculatorHub</strong> helps you find how
    many units or how much revenue your business needs to cover costs and start earning profit.
  </p>

  <figure className="my-8">
    <img
      src="/images/break-even-calculator-hero.webp"
      alt="Break-even analysis chart"
      title="Break-Even Calculator 2025 | Profitability Tool"
      className="rounded-lg shadow-md border border-slate-700 mx-auto"
      loading="lazy"
    />
    <figcaption className="text-center text-sm text-slate-400 mt-2">
      Visualization of revenue and cost curves meeting at the break-even point.
    </figcaption>
  </figure>

  <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
    🧮 How Break-Even is Calculated
  </h2>
  <p className="font-mono text-center text-indigo-300">
    Break-Even Units = Fixed Costs ÷ (Selling Price − Variable Cost)
  </p>

  <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
    📘 Example
  </h2>
  <p>
    Suppose your fixed costs are <strong>$10 000</strong>, selling price per unit is <strong>$50</strong>, 
    and variable cost per unit is <strong>$30</strong>.  
    Profit per unit = <strong>$20</strong>, so you need <strong>500 units</strong> to break even.
  </p>

  <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
    💡 Why It Matters
  </h2>
  <ul className="list-disc list-inside space-y-2">
    <li>Know how much you must sell before making a profit.</li>
    <li>Adjust pricing or costs to improve profitability.</li>
    <li>Plan for safe expansion or marketing spend.</li>
  </ul>

  {/* ===== FAQ Section ===== */}
  <section id="faq" className="space-y-6 mt-16">
    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
      ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
    </h2>

    <div className="space-y-5 text-lg text-slate-100 leading-relaxed">
      <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
        <h3 className="font-semibold text-xl mb-2 text-yellow-300">
          Q1: What is a break-even point?
        </h3>
        <p>
          It’s the point where your total revenue equals total cost — neither profit nor loss.
        </p>
      </div>

      <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
        <h3 className="font-semibold text-xl mb-2 text-yellow-300">
          Q2: How can I lower my break-even point?
        </h3>
        <p>
          Reduce variable costs, increase selling price, or cut fixed expenses to reach profit faster.
        </p>
      </div>

      <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
        <h3 className="font-semibold text-xl mb-2 text-yellow-300">
          Q3: Is break-even useful for startups?
        </h3>
        <p>
          Yes — it helps founders understand minimum sales targets to stay viable and plan funding needs.
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
      alt="CalculatorHub Team"
      className="w-12 h-12 rounded-full border border-gray-600"
      loading="lazy"
    />
    <div>
      <p className="font-semibold text-white">
        Written by the CalculatorHub Business Analytics Team
      </p>
      <p className="text-sm text-slate-400">
        Verified for financial accuracy. Last updated: 
        <time dateTime="2025-10-20">October 20, 2025</time>.
      </p>
    </div>
  </div>

  <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
    <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
      🚀 Explore more business calculators on CalculatorHub:
    </p>
    <div className="flex flex-wrap gap-3 text-sm">
      <a
        href="/roi-calculator"
        className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-400 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all"
      >
        📈 ROI Calculator
      </a>
      <a
        href="/cagr-calculator"
        className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all"
      >
        📊 CAGR Calculator
      </a>
      <a
        href="/loan-affordability-calculator"
        className="flex items-center gap-2 bg-[#0f172a] hover:bg-fuchsia-600/20 text-fuchsia-300 hover:text-fuchsia-400 px-3 py-2 rounded-md border border-slate-700 hover:border-fuchsia-500 transition-all"
      >
        🏠 Loan Affordability Calculator
      </a>
    </div>
  </div>
</section>

<AdBanner type="bottom" />
<RelatedCalculators
  currentPath="/break-even-calculator"
  category="business-profit"
/>
</div>
</>
);
};

export default BreakEvenCalculator;
