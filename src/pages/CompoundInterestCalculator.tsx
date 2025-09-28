import React, { useState, useEffect } from "react";

interface BreakdownRow {
  period: string;
  earnings: number;
  totalEarnings: number;
  balance: number;
}

const CompoundCalculator: React.FC = () => {
  const [principal, setPrincipal] = useState<number>(1000);
  const [rate, setRate] = useState<number>(10);
  const [timeYears, setTimeYears] = useState<number>(1);
  const [timeMonths, setTimeMonths] = useState<number>(0);
  const [timeDays, setTimeDays] = useState<number>(0);
  const [rateType, setRateType] = useState("yearly");
   
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  

  const [includeAllDays, setIncludeAllDays] = useState<"yes" | "no">("yes");
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ]);

  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [interest, setInterest] = useState<number>(0);
  const [breakdown, setBreakdown] = useState<BreakdownRow[]>([]);
  const [breakdownView, setBreakdownView] = useState("yearly"); // daily, weekly, monthly, yearly

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  useEffect(() => {
    const totalDays = timeYears * 365 + timeMonths * 30 + timeDays;

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
    const start = new Date(startDate);

    if (!includeAllDays) {
      let count = 0;
      for (let i = 0; i < totalDays; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
        if (selectedDays.includes(dayName)) {
          count++;
        }
      }
      effectiveDays = count;
    }

    const amount = principal * Math.pow(1 + dailyRate, effectiveDays);
    setFinalAmount(amount);
    setInterest(amount - principal);

    let rows: BreakdownRow[] = [];
    let balance = principal;
    let totalEarnings = 0;

    for (let i = 1; i <= effectiveDays; i++) {
      balance *= 1 + dailyRate;
      const earnings = balance - (principal + totalEarnings);
      totalEarnings += earnings;

      if (
        (breakdownView === "daily" && true) ||
        (breakdownView === "weekly" && i % 7 === 0) ||
        (breakdownView === "monthly" && i % 30 === 0) ||
        (breakdownView === "yearly" && i % 365 === 0) ||
        i === effectiveDays
      ) {
        rows.push({
          period: `${i} ${breakdownView}`,
          earnings: earnings,
          totalEarnings: totalEarnings,
          balance: balance,
        });
      }
    }

    setBreakdown(rows);
  }, [
    principal,
    rate,
    timeYears,
    timeMonths,
    timeDays,
    rateType,
    includeAllDays,
    selectedDays,
    startDate,
    breakdownView,
  ]);

  const downloadCSV = () => {
    const header = "Period,Earnings,Total Earnings,Balance\n";
    const csv = breakdown
      .map(
        (row) =>
          `${row.period},${row.earnings.toFixed(2)},${row.totalEarnings.toFixed(
            2
          )},${row.balance.toFixed(2)}`
      )
      .join("\n");
    const blob = new Blob([header + csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "compound-interest-breakdown.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-2 text-center">
        Daily Compound Interest Calculator
      </h1>
      <p className="text-gray-500 mb-4 text-center">
        Calculate compound interest and view detailed breakdown
      </p>

      {/* Inputs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium">Principal ($)</label>
          <input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(parseFloat(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Rate (%)</label>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Rate Type</label>
          <select
            value={rateType}
            onChange={(e) => setRateType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Years</label>
          <input
            type="number"
            value={timeYears}
            onChange={(e) => setTimeYears(parseFloat(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Months</label>
          <input
            type="number"
            value={timeMonths}
            onChange={(e) => setTimeMonths(parseFloat(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Days</label>
          <input
            type="number"
            value={timeDays}
            onChange={(e) => setTimeDays(parseFloat(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      {/* Day Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Include All Days of Week?
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="includeDays"
              value="yes"
              checked={includeAllDays === "yes"}
              onChange={() => setIncludeAllDays("yes")}
            />
            Yes
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="includeDays"
              value="no"
              checked={includeAllDays === "no"}
              onChange={() => setIncludeAllDays("no")}
            />
            No
          </label>
        </div>
      </div>

        {!includeAllDays && (
          <div className="mt-2 flex flex-wrap gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-3 py-1 rounded border ${
                  selectedDays.includes(day)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="p-4 bg-gray-100 rounded-lg text-center mt-6">
        <p className="text-lg font-semibold text-gray-800">
          Final Amount: ${finalAmount.toFixed(2)}
        </p>
        <p className="text-md text-gray-600">
          Interest Earned: ${interest.toFixed(2)}
        </p>
      </div>

      {/* Breakdown */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-3">Earnings Breakdown</h2>
        <div className="flex gap-3 mb-4">
          {["daily", "weekly", "monthly", "yearly"].map((view) => (
            <button
              key={view}
              onClick={() => setBreakdownView(view)}
              className={`px-3 py-1 rounded-md ${
                breakdownView === view
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              {view}
            </button>
          ))}
        </div>

        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-2 py-1">Period</th>
              <th className="border px-2 py-1">Earnings</th>
              <th className="border px-2 py-1">Total Earnings</th>
              <th className="border px-2 py-1">Balance</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((row, i) => (
              <tr key={i} className="text-center">
                <td className="border px-2 py-1">{row.period}</td>
                <td className="border px-2 py-1">${row.earnings.toFixed(2)}</td>
                <td className="border px-2 py-1">
                  ${row.totalEarnings.toFixed(2)}
                </td>
                <td className="border px-2 py-1">${row.balance.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex gap-4">
          <button
            onClick={downloadCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-md"
          >
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompoundCalculator;
