import React, { useState, useEffect } from "react";

const CompoundCalculator: React.FC = () => {
  const [mode, setMode] = useState("daily");

  // Inputs
  const [principal, setPrincipal] = useState<number>(1000);
  const [rate, setRate] = useState<number>(10);
  const [time, setTime] = useState<number>(1);
  const [frequency, setFrequency] = useState<number>(365);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Results
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [interest, setInterest] = useState<number>(0);

  // Breakdown
  const [breakdown, setBreakdown] = useState<
    { date: string; earnings: number; totalEarnings: number; balance: number }[]
  >([]);

  // Title
  const getTitle = () => {
    switch (mode) {
      case "daily":
        return "Daily Compound Interest Calculator";
      case "forex":
        return "Forex Compound Calculator";
      case "simple":
        return "Simple Interest Calculator";
      default:
        return "Compound Interest Calculator";
    }
  };

  // Calculation
  useEffect(() => {
    let amount = 0;
    let intr = 0;

    if (mode === "daily") {
      amount =
        principal * Math.pow(1 + rate / 100 / frequency, frequency * time);
      intr = amount - principal;
    } else if (mode === "forex") {
      amount = principal * Math.pow(1 + rate / 100, time);
      intr = amount - principal;
    } else if (mode === "simple") {
      intr = (principal * rate * time) / 100;
      amount = principal + intr;
    }

    setFinalAmount(amount);
    setInterest(intr);

    // ---- Breakdown ----
    const breakdownData: {
      date: string;
      earnings: number;
      totalEarnings: number;
      balance: number;
    }[] = [];

    let runningPrincipal = principal;
    let cumulativeEarnings = 0;
    let currentDate = new Date(startDate);

    // Convert years into days for looping (approx.)
    const effectiveDays = time * 365;
    const dailyRate =
      mode === "daily"
        ? rate / 100 / frequency
        : mode === "forex"
        ? rate / 100
        : rate / 100 / 365;

    for (let i = 1; i <= effectiveDays; i++) {
      const prevBalance = runningPrincipal;
      runningPrincipal = runningPrincipal * (1 + dailyRate);
      const earnings = runningPrincipal - prevBalance;
      cumulativeEarnings += earnings;

      // Daily mode → every single day
      if (mode === "daily") {
        breakdownData.push({
          date: currentDate.toLocaleDateString(),
          earnings,
          totalEarnings: cumulativeEarnings,
          balance: runningPrincipal,
        });
      }

      // Weekly → every 7 days
      if (mode === "forex" && i % 7 === 0) {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - 6);
        breakdownData.push({
          date: `${weekStart.toLocaleDateString()} - ${currentDate.toLocaleDateString()}`,
          earnings,
          totalEarnings: cumulativeEarnings,
          balance: runningPrincipal,
        });
      }

      // Monthly → every 30 days
      if (mode === "simple" && i % 30 === 0) {
        breakdownData.push({
          date: currentDate.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          earnings,
          totalEarnings: cumulativeEarnings,
          balance: runningPrincipal,
        });
      }

      // Yearly → every 365 days
      if (i % 365 === 0) {
        breakdownData.push({
          date: `${currentDate.getFullYear()}`,
          earnings,
          totalEarnings: cumulativeEarnings,
          balance: runningPrincipal,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    setBreakdown(breakdownData);
  }, [mode, principal, rate, time, frequency, startDate]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Title */}
      <h1 className="text-2xl font-bold mb-2 text-center">{getTitle()}</h1>
      <p className="text-gray-500 mb-4 text-center">
        Calculate the {mode === "simple" ? "simple" : "compound"} interest on
        your investments and savings
      </p>

      {/* Mode Switch */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setMode("daily")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            mode === "daily"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Daily Compound
        </button>
        <button
          onClick={() => setMode("forex")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            mode === "forex"
              ? "bg-green-600 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Forex Compound
        </button>
        <button
          onClick={() => setMode("simple")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            mode === "simple"
              ? "bg-purple-600 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Simple Interest
        </button>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Principal Amount ($)
          </label>
          <input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Interest Rate (% {mode === "forex" ? "per trade" : "per annum"})
          </label>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {mode === "forex"
              ? "Number of Trades"
              : mode === "simple"
              ? "Time Period (Years)"
              : "Time Period (Years)"}
          </label>
          <input
            type="number"
            value={time}
            onChange={(e) => setTime(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {mode === "daily" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compounding Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value={1}>Annually</option>
              <option value={2}>Semi-Annually</option>
              <option value={4}>Quarterly</option>
              <option value={12}>Monthly</option>
              <option value={365}>Daily</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Starting Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* Results */}
      <div className="p-4 bg-gray-100 rounded-lg text-center">
        <p className="text-lg font-semibold text-gray-800">
          Final Amount: ${finalAmount.toFixed(2)}
        </p>
        <p className="text-md text-gray-600">
          {mode === "simple" ? "Simple Interest" : "Interest"}: $
          {interest.toFixed(2)}
        </p>
      </div>

      {/* Breakdown Table */}
      {breakdown.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Earnings Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-3 py-2 text-left">
                    Period
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-right">
                    Earnings
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-right">
                    Total Earnings
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-right">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((row, idx) => (
                  <tr key={idx} className="odd:bg-white even:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2">
                      {row.date}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      ${row.earnings.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      ${row.totalEarnings.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      ${row.balance.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompoundCalculator;
