import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

const LoanAffordabilityCalculator: React.FC = () => {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(8000);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(3000);
  const [loanTenure, setLoanTenure] = useState<number>(20);
  const [interestRate, setInterestRate] = useState<number>(7);
  const [loanAmount, setLoanAmount] = useState<number | null>(null);

  const handleCalculate = () => {
    // Step 1: Find monthly savings
    const savings = monthlyIncome - monthlyExpenses;
    if (savings <= 0) {
      setLoanAmount(0);
      return;
    }

    // Step 2: EMI-based loan affordability (approx 40-50% of savings)
    const affordableEMI = savings * 0.5;

    // Step 3: Convert annual rate to monthly
    const monthlyRate = interestRate / 12 / 100;
    const tenureMonths = loanTenure * 12;

    // Step 4: Reverse EMI formula to calculate max principal
    const P =
      (affordableEMI *
        (Math.pow(1 + monthlyRate, tenureMonths) - 1)) /
      (monthlyRate * Math.pow(1 + monthlyRate, tenureMonths));

    setLoanAmount(P);
  };

  return (
    <div className="max-w-4xl mx-auto text-center">
      {/* SEO */}
      <Helmet>
        <title>{seoData.loanAffordabilityCalculator?.title}</title>
        <meta
          name="description"
          content={seoData.loanAffordabilityCalculator?.description}
        />
        <meta
          name="keywords"
          content={seoData.loanAffordabilityCalculator?.keywords}
        />
        <script type="application/ld+json">
          {JSON.stringify(
            generateCalculatorSchema(
              "Loan Affordability Calculator",
              "Estimate how much loan you can afford based on your income, expenses, and interest rate.",
              "/loan-affordability-calculator",
              "finance"
            )
          )}
        </script>
      </Helmet>

      {/* Title */}
      <h1 className="text-3xl font-bold text-white mb-4">
        Loan Affordability Calculator
      </h1>
      <p className="text-slate-300 mb-8">
        Estimate the maximum loan amount you can afford based on your income,
        expenses, and loan terms.
      </p>

      {/* Input Form */}
      <div className="bg-gray-900 p-6 rounded-2xl shadow-md text-left">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-slate-400 mb-2">Monthly Income ($)</label>
            <input
              type="number"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
              className="w-full p-3 bg-gray-800 rounded-lg text-white border border-gray-700"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-2">Monthly Expenses ($)</label>
            <input
              type="number"
              value={monthlyExpenses}
              onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
              className="w-full p-3 bg-gray-800 rounded-lg text-white border border-gray-700"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-2">Loan Tenure (Years)</label>
            <input
              type="number"
              value={loanTenure}
              onChange={(e) => setLoanTenure(Number(e.target.value))}
              className="w-full p-3 bg-gray-800 rounded-lg text-white border border-gray-700"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-2">Interest Rate (% per annum)</label>
            <input
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full p-3 bg-gray-800 rounded-lg text-white border border-gray-700"
            />
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={handleCalculate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Calculate Affordability
          </button>
        </div>
      </div>

      {/* Results Section */}
      {loanAmount !== null && (
        <div className="mt-10 text-left bg-gray-900 p-6 rounded-2xl shadow-md">
          {loanAmount <= 0 ? (
            <p className="text-red-400 font-semibold">
              Your expenses exceed your income. Reduce expenses or increase income to qualify.
            </p>
          ) : (
            <>
              <h2 className="text-xl text-white font-bold mb-3">Your Results:</h2>
              <p className="text-slate-300 mb-2">
                💰 Maximum Affordable Loan Amount:{" "}
                <span className="text-blue-400 font-semibold">
                  ${loanAmount.toFixed(2)}
                </span>
              </p>
            </>
          )}
        </div>
      )}
      {loanAmount !== null && loanAmount > 0 && (
        <div className="mt-10 grid md:grid-cols-2 gap-8">
          {/* Pie Chart */}
          <div className="bg-gray-900 p-6 rounded-2xl shadow-md">
            <h3 className="text-white text-lg font-semibold mb-4 text-center">
              Monthly Budget Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Expenses", value: monthlyExpenses },
                    { name: "Available for EMI", value: (monthlyIncome - monthlyExpenses) * 0.5 },
                    { name: "Remaining Savings", value: (monthlyIncome - monthlyExpenses) * 0.5 },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  dataKey="value"
                >
                  <Cell fill="#ef4444" />
                  <Cell fill="#3b82f6" />
                  <Cell fill="#22c55e" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Tips */}
          <div className="bg-gray-900 p-6 rounded-2xl shadow-md text-left">
            <h3 className="text-white text-lg font-semibold mb-3">💡 Smart Tips</h3>
            <ul className="text-slate-300 list-disc pl-5 space-y-2">
              <li>Keep your total EMI below <strong>40–50%</strong> of your monthly income.</li>
              <li>Maintain an emergency fund covering at least 6 months of expenses.</li>
              <li>Reduce credit card or personal-loan debts to improve affordability.</li>
              <li>Lowering your interest rate or extending tenure increases eligibility.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Share & Copy */}
      {loanAmount !== null && loanAmount > 0 && (
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            onClick={() =>
              navigator.clipboard.writeText(
                `I can afford a loan of about $${loanAmount?.toFixed(2)} according to CalculatorHub!`
              )
            }
            className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2 rounded-lg"
          >
            📋 Copy Result
          </button>
          <button
            onClick={() => {
              const url = encodeURIComponent(window.location.href);
              const text = encodeURIComponent(
                `Check out this Loan Affordability Calculator! I can afford around $${loanAmount?.toFixed(
                  2
                )}.`
              );
              window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
          >
            🔗 Share on X (Twitter)
          </button>
        </div>
      )}

      {/* FAQ */}
      <div className="mt-12 text-left bg-gray-900 p-6 rounded-2xl shadow-md">
        <h3 className="text-xl font-semibold text-white mb-4">
          Frequently Asked Questions
        </h3>
        <div className="space-y-4 text-slate-300">
          <div>
            <h4 className="font-semibold text-white">How accurate is this calculator?</h4>
            <p>
              It gives an estimate based on your income, expenses, and interest rate.
              Actual eligibility depends on your lender’s criteria.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white">What ratio of income should go toward EMIs?</h4>
            <p>
              Financial experts recommend keeping your total EMIs within
              40–50 % of your monthly income for long-term stability.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white">Can I improve my loan affordability?</h4>
            <p>
              Yes — you can by increasing your income, reducing existing debts,
              improving your credit score, or opting for longer loan tenure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanAffordabilityCalculator;
