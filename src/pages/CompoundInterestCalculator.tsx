import React, { useState } from "react";

const CompoundCalculator: React.FC = () => {
  const [mode, setMode] = useState("daily");

  // Dynamic Title
  const getTitle = () => {
    switch (mode) {
      case "daily":
        return "Daily Compound Interest Calculator";
      case "forex":
        return "Forex Compound Interest Calculator";
      case "simple":
        return "Simple Interest Calculator";
      default:
        return "Compound Interest Calculator";
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-slate-900 text-white rounded-xl shadow-lg">
      {/* Title */}
      <h1 className="text-2xl font-bold mb-2 text-center">{getTitle()}</h1>
      <p className="text-slate-400 mb-4 text-center">
        Calculate the compound interest on your investments and savings
      </p>

      {/* Mode Switch Buttons */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setMode("daily")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition 
            ${
              mode === "daily"
                ? "bg-blue-600 text-white"
                : "bg-slate-700 hover:bg-slate-600"
            }`}
        >
          Daily Compound
        </button>
        <button
          onClick={() => setMode("forex")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition 
            ${
              mode === "forex"
                ? "bg-green-600 text-white"
                : "bg-slate-700 hover:bg-slate-600"
            }`}
        >
          Forex Compound
        </button>
        <button
          onClick={() => setMode("simple")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition 
            ${
              mode === "simple"
                ? "bg-purple-600 text-white"
                : "bg-slate-700 hover:bg-slate-600"
            }`}
        >
          Simple Interest
        </button>
      </div>

      {/* Calculator Form */}
      <div className="bg-slate-800 p-6 rounded-lg">
        {mode === "daily" && <p className="text-blue-400">Daily Compound Mode Active</p>}
        {mode === "forex" && <p className="text-green-400">Forex Compound Mode Active</p>}
        {mode === "simple" && <p className="text-purple-400">Simple Interest Mode Active</p>}
      </div>
    </div>
  );
};

export default CompoundCalculator;
