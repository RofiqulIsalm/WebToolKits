import React, { useState, useEffect } from "react";

const CompoundCalculator: React.FC = () => {
  const [mode, setMode] = useState("daily");

  // Common inputs
  const [principal, setPrincipal] = useState<number>(1000);
  const [rate, setRate] = useState<number>(10);
  const [timeYears, setTimeYears] = useState<number>(0);
  const [timeMonths, setTimeMonths] = useState<number>(0);
  const [timeDays, setTimeDays] = useState<number>(0);
  const [rateType, setRateType] = useState("yearly"); // daily, weekly, monthly, yearly

  // Daily compounding options
  const [includeAllDays, setIncludeAllDays] = useState(true);
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ]);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Results
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [interest, setInterest] = useState<number>(0);
  const [breakdown, setBreakdown] = useState<
    { period: string; balance: number; earnings: number; totalEarnings: number }[]
  >([]);

  // Toggle day selection
  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

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

  // Calculation logic
  useEffect(() => {
    let totalDays = timeYears * 365 + timeMonths * 30 + timeDays;
    let amount = principal;
    let interestAcc = 0;
    let breakdownData: {
      period: string;
      balance: number;
      earnings: number;
      totalEarnings: number;
    }[] = [];

    if (mode === "daily") {
      // Convert rate into daily equivalent
      let dailyRate = 0;
      switch (rateType) {
        case "daily":
          dailyRate = rate / 100;
          break;
        case "weekly":
          dailyRate = rate / 100 / 7;
          break;
        case "monthly":
          dailyRate = rate / 100 / 30;
          break;
        case "yearly":
        default:
          dailyRate = rate / 100 / 365;
          break;
      }

      const start = new Date(startDate);
      let currentBalance = principal;
      let totalEarnings = 0;

      for (let i = 1; i <= totalDays; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i - 1);
        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });

        if (includeAllDays || selectedDays.includes(dayName)) {
          const dailyEarning = currentBalance * dailyRate;
          currentBalance += dailyEarning;
          totalEarnings += dailyEarning;
        }

        // Save breakdown for each day
        breakdownData.push({
          period: d.toDateString(),
          balance: currentBalance,
          earnings: currentBalance - principal,
          totalEarnings,
        });
      }

      amount = breakdownData[breakdownData.length - 1]?.balance || principal;
      interestAcc = amount - principal;
    } else if (mode === "forex") {
      const trades = timeYears; // here "years" input = trades
      amount = principal * Math.pow(1 + rate / 100, trades);
      interestAcc = amount - principal;

      for (let t = 1; t <= trades; t++) {
        const bal = principal * Math.pow(1 + rate / 100, t);
        breakdownData.push({
          period: `Trade ${t}`,
          balance: bal,
          earnings: bal - principal,
          totalEarnings: bal - principal,
        });
      }
    } else if (mode === "simple") {
      const years = timeYears + timeMonths / 12 + timeDays / 365;
      const si = (principal * rate * years) / 100;
      amount = principal + si;
      interestAcc = si;

      for (let y = 1; y <= years; y++) {
        const bal = principal + (principal * rate * y) / 100;
        breakdownData.push({
          period: `Year ${y}`,
          balance: bal,
          earnings: bal - principal,
          totalEarnings: bal - principal,
        });
      }
    }

    setFinalAmount(amount);
    setInterest(interestAcc);
    setBreakdown(breakdownData);
  }, [
    mode,
    principal,
    rate,
    timeYears,
    timeMonths,
    timeDays,
    rateType,
    includeAllDays,
    selectedDays,
    startDate,
  ]);

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
      {mode === "daily" && (
        <>
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
              <div className="flex gap-2">
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <select
                  value={rateType}
                  onChange={(e) => setRateType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Period
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Years"
                  value={timeYears}
                  onChange={(e) => setTimeYears(Number(e.target.value))}
                  className="w-1/3 px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="number"
                  placeholder="Months"
                  value={timeMonths}
                  onChange={(e) => setTimeMonths(Number(e.target.value))}
                  className="w-1/3 px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="number"
                  placeholder="Days"
                  value={timeDays}
                  onChange={(e) => setTimeDays(Number(e.target.value))}
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

          {/* Include Days Option */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1">
              Include all days of the week?
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setIncludeAllDays(true)}
                className={`px-3 py-1 rounded-md ${
                  includeAllDays ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setIncludeAllDays(false)}
                className={`px-3 py-1 rounded-md ${
                  !includeAllDays ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
              >
                No
              </button>
            </div>
          </div>

          {!includeAllDays && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Days to include:
              </p>
              <div className="flex flex-wrap gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1 rounded-md border ${
                      selectedDays.includes(day)
                        ? "bg-orange-400 text-black"
                        : "bg-gray-200"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {mode !== "daily" && (
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
              {mode === "forex" ? "Number of Trades" : "Time Period (Years)"}
            </label>
            <input
              type="number"
              value={timeYears}
              onChange={(e) => setTimeYears(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      )}

      {/* Results */}
      <div className="p-4 bg-gray-100 rounded-lg text-center mt-6">
        <p className="text-lg font-semibold text-gray-800">
          Final Amount: ${finalAmount.toFixed(2)}
        </p>
        <p className="text-md text-gray-600">
          Interest Earned: ${interest.toFixed(2)}
        </p>
      </div>

      {/* Breakdown Table */}
      {breakdown.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-2 py-1 text-left">
                  Period
                </th>
                <th className="border border-gray-300 px-2 py-1 text-right">
                  Balance
                </th>
                <th className="border border-gray-300 px-2 py-1 text-right">
                  Earnings
                </th>
                <th className="border border-gray-300 px-2 py-1 text-right">
                  Total Earnings
                </th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((row, idx) => (
                <tr key={idx}>
                  <td className="border border-gray-300 px-2 py-1">
                    {row.period}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-right">
                    ${row.balance.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-right">
                    ${row.earnings.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-right">
                    ${row.totalEarnings.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CompoundCalculator;
