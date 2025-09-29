import React, { useState, useEffect } from "react";

const CompoundCalculator: React.FC = () => {
  const [mode, setMode] = useState("daily");

  // Inputs
  const [principal, setPrincipal] = useState<number>(1000);
  const [rate, setRate] = useState<number>(10);
  const [years, setYears] = useState<number>(1);
  const [months, setMonths] = useState<number>(0);
  const [days, setDays] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Results
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [interest, setInterest] = useState<number>(0);
  const [breakdown, setBreakdown] = useState<
    { date: string; earnings: number; totalEarnings: number; balance: number }[]
  >([]);

  // Helper → total days
  const getTotalDays = () => years * 365 + months * 30 + days;

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
    const totalDays = getTotalDays();
    let currentBalance = principal;
    let cumulativeEarnings = 0;

    const start = new Date(startDate);
    const rows: {
      date: string;
      earnings: number;
      totalEarnings: number;
      balance: number;
    }[] = [];

    if (mode === "daily") {
      const dailyRate = rate / 100 / 365;

      for (let i = 1; i <= totalDays; i++) {
        const prevBalance = currentBalance;
        currentBalance *= 1 + dailyRate;
        const earnings = currentBalance - prevBalance;
        cumulativeEarnings += earnings;

        const date = new Date(start);
        date.setDate(start.getDate() + i);

        rows.push({
          date: date.toLocaleDateString(),
          earnings,
          totalEarnings: cumulativeEarnings,
          balance: currentBalance,
        });
      }
    }

    if (mode === "forex") {
      const weeklyRate = rate / 100;
      const weeks = Math.floor(totalDays / 7);

      for (let i = 1; i <= weeks; i++) {
        const prevBalance = currentBalance;
        currentBalance *= 1 + weeklyRate;
        const earnings = currentBalance - prevBalance;
        cumulativeEarnings += earnings;

        const weekStart = new Date(start);
        weekStart.setDate(start.getDate() + (i - 1) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        rows.push({
          date: `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`,
          earnings,
          totalEarnings: cumulativeEarnings,
          balance: currentBalance,
        });
      }
    }

    if (mode === "simple") {
      const totalYears = years + months / 12 + days / 365;
      const si = (principal * rate * totalYears) / 100;
      currentBalance = principal + si;
      cumulativeEarnings = si;

      const startYear = new Date(start).getFullYear();
      const endYear = startYear + Math.floor(totalYears);

      rows.push({
        date: `${startYear} - ${endYear}`,
        earnings: si,
        totalEarnings: si,
        balance: currentBalance,
      });
    }

    setFinalAmount(currentBalance);
    setInterest(cumulativeEarnings);
    setBreakdown(rows);
  }, [mode, principal, rate, years, months, days, startDate]);

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
            Interest Rate (%)
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
            Time Period
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Years"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-1/3 px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="number"
              placeholder="Months"
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-1/3 px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="number"
              placeholder="Days"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-1/3 px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
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
          Interest Earned: ${interest.toFixed(2)}
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
                    Date / Period
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
