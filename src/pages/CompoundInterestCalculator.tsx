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
  const [breakdownView, setBreakdownView] = useState("daily");
  const [groupedBreakdown, setGroupedBreakdown] = useState<any[]>([]);

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

  // Breakdown
  const [breakdown, setBreakdown] = useState<
    { label: string; earnings: number; totalEarnings: number; balance: number }[]
  >([]);
  const [breakdownMode, setBreakdownMode] = useState("daily"); // daily, weekly, monthly, yearly

  // Handle toggle day selection
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
    let amount = principal;
    let earned = 0;
    let breakdownData: {
      label: string;
      earnings: number;
      totalEarnings: number;
      balance: number;
    }[] = [];

    if (mode === "daily") {
      // Convert years/months/days into total days
      const totalDays = timeYears * 365 + timeMonths * 30 + timeDays;

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

      let effectiveDays = totalDays;
      if (!includeAllDays) {
        const start = new Date(startDate);
        let count = 0;
        for (let i = 0; i < totalDays; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          const dayName = d.toLocaleDateString("en-US", {
            weekday: "short",
          });
          if (selectedDays.includes(dayName)) {
            count++;
          }
        }
        effectiveDays = count;
      }

      for (let i = 1; i <= effectiveDays; i++) {
        const prev = amount;
        amount = amount * (1 + dailyRate);
        earned = amount - principal;
        if (breakdownMode === "daily") {
          breakdownData.push({
            label: `Day ${i}`,
            earnings: amount - prev,
            totalEarnings: earned,
            balance: amount,
          });
        } else if (breakdownMode === "weekly" && i % 7 === 0) {
          breakdownData.push({
            label: `Week ${i / 7}`,
            earnings: amount - prev,
            totalEarnings: earned,
            balance: amount,
          });
        } else if (breakdownMode === "monthly" && i % 30 === 0) {
          breakdownData.push({
            label: `Month ${i / 30}`,
            earnings: amount - prev,
            totalEarnings: earned,
            balance: amount,
          });
        } else if (breakdownMode === "yearly" && i % 365 === 0) {
          breakdownData.push({
            label: `Year ${i / 365}`,
            earnings: amount - prev,
            totalEarnings: earned,
            balance: amount,
          });
        }
      }
    } else if (mode === "forex" || mode === "simple") {
      const years = timeYears > 0 ? timeYears : 1;
      for (let i = 1; i <= years; i++) {
        if (mode === "forex") {
          amount = amount * (1 + rate / 100);
        } else {
          amount = principal + (principal * rate * i) / 100;
        }
        earned = amount - principal;
        breakdownData.push({
          label: `Year ${i}`,
          earnings: earned,
          totalEarnings: earned,
          balance: amount,
        });
      }
    }

    setFinalAmount(amount);
    setInterest(amount - principal);
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
    breakdownMode,
  ]);

  return (
    <>
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
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

        {/* Daily Mode Inputs */}
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
                  Time Period (Years / Months / Days)
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
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
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
                    )
                  )}
                </div>
              </div>
            )}
          </>
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
      </div>

      {/* Breakdown Section */}
      {/* Breakdown Section */}
<div className="mt-8">
  <h2 className="text-xl font-semibold mb-4 text-center">Earnings Breakdown</h2>

  {/* Switch between daily/weekly/monthly/yearly */}
  <div className="flex justify-center gap-4 mb-4">
    {["daily", "weekly", "monthly", "yearly"].map((view) => (
      <button
        key={view}
        onClick={() => setBreakdownView(view)}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
          breakdownView === view
            ? "bg-blue-600 text-white"
            : "bg-gray-200 hover:bg-gray-300"
        }`}
      >
        {view.charAt(0).toUpperCase() + view.slice(1)}
      </button>
    ))}
  </div>

  {/* Breakdown Table */}
  <div className="overflow-x-auto">
    <table className="min-w-full border border-gray-300 text-sm text-center">
      <thead className="bg-gray-100">
        <tr>
          <th className="border px-3 py-2">Period</th>
          <th className="border px-3 py-2">Earnings</th>
          <th className="border px-3 py-2">Total Earnings</th>
          <th className="border px-3 py-2">Balance</th>
        </tr>
      </thead>
      <tbody>
        {groupedBreakdown.map((row, i) => (
          <tr key={i}>
            <td className="border px-3 py-2">{row.period}</td>
            <td className="border px-3 py-2">{row.earnings.toFixed(2)}</td>
            <td className="border px-3 py-2">{row.totalEarnings.toFixed(2)}</td>
            <td className="border px-3 py-2">{row.balance.toFixed(2)}</td>
          </tr>
        ))}
        {/* Total row */}
        {groupedBreakdown.length > 0 && (
          <tr className="font-bold bg-gray-50">
            <td className="border px-3 py-2">Total</td>
            <td className="border px-3 py-2">
              {groupedBreakdown.reduce((s, r) => s + r.earnings, 0).toFixed(2)}
            </td>
            <td className="border px-3 py-2">
              {
                groupedBreakdown[groupedBreakdown.length - 1].totalEarnings.toFixed(
                  2
                )
              }
            </td>
            <td className="border px-3 py-2">
              {
                groupedBreakdown[groupedBreakdown.length - 1].balance.toFixed(2)
              }
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>

    </>
  );
};

export default CompoundCalculator;
