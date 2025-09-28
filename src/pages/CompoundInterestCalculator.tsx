import React, { useState, useEffect } from "react";

const CompoundCalculator: React.FC = () => {
  const [mode, setMode] = useState("daily");

  // Common inputs
  const [principal, setPrincipal] = useState<number>(1000);
  const [rate, setRate] = useState<number>(10);
  const [time, setTime] = useState<number>(1);
  const [frequency, setFrequency] = useState<number>(365);

  // Results
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [interest, setInterest] = useState<number>(0);

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

  // Calculations
  useEffect(() => {
    if (mode === "daily") {
      const amount =
        principal * Math.pow(1 + rate / 100 / frequency, frequency * time);
      setFinalAmount(amount);
      setInterest(amount - principal);
    } else if (mode === "forex") {
      const amount = principal * Math.pow(1 + rate / 100, time);
      setFinalAmount(amount);
      setInterest(amount - principal);
    } else if (mode === "simple") {
      const si = (principal * rate * time) / 100;
      setFinalAmount(principal + si);
      setInterest(si);
    }
  }, [mode, principal, rate, time, frequency]);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Title */}
      <h1 className="text-2xl font-bold mb-2 text-center">{getTitle()}</h1>
      <p className="text-gray-500 mb-4 text-center">
        Calculate the {mode === "simple" ? "simple" : "compound"} interest on your
        investments and savings
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

      {/* Input Fields */}
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
    </div>
  );
};

export default CompoundCalculator;
