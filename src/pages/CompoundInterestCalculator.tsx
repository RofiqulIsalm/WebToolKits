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
  const [breakdown, setBreakdown] = useState<
    { date: string; earnings: number; totalEarnings: number; balance: number }[]
    >([]);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Results
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [interest, setInterest] = useState<number>(0);

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
    if (mode === "daily") {
      // Convert years/months/days into total days
      const totalDays =
        timeYears * 365 + timeMonths * 30 + timeDays;

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

      // Count effective compounding days
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

      const amount = principal * Math.pow(1 + dailyRate, effectiveDays);
      setFinalAmount(amount);
      setInterest(amount - principal);
    } else if (mode === "forex") {
      const amount = principal * Math.pow(1 + rate / 100, timeYears);
      setFinalAmount(amount);
      setInterest(amount - principal);
    } else if (mode === "simple") {
      const si = (principal * rate * timeYears) / 100;
      setFinalAmount(principal + si);
      setInterest(si);
    }
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

      {/* Results */}
      <div className="p-4 bg-gray-100 rounded-lg text-center mt-6">
        <p className="text-lg font-semibold text-gray-800">
          Final Amount: ${finalAmount.toFixed(2)}
        </p>
        <p className="text-md text-gray-600">Interest Earned: ${interest.toFixed(2)}</p>
      </div>
    </div>
  ); 
};

export default CompoundCalculator;
