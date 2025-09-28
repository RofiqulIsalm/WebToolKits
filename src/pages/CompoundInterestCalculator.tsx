import React, { useState, useEffect } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { saveAs } from "file-saver";

const CompoundCalculator: React.FC = () => {
  const [mode, setMode] = useState("daily");

  // Inputs
  const [principal, setPrincipal] = useState<number>(1000);
  const [rate, setRate] = useState<number>(10);
  const [time, setTime] = useState<number>(1);
  const [frequency, setFrequency] = useState<number>(365);

  // Results
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [interest, setInterest] = useState<number>(0);
  const [data, setData] = useState<any[]>([]); // growth breakdown

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

  // Calculation + table data
  useEffect(() => {
    let amount = principal;
    const rows: any[] = [];

    if (mode === "daily") {
      for (let year = 1; year <= time; year++) {
        amount = principal * Math.pow(1 + rate / 100 / frequency, frequency * year);
        rows.push({ step: year, amount: parseFloat(amount.toFixed(2)), interest: parseFloat((amount - principal).toFixed(2)) });
      }
    } else if (mode === "forex") {
      for (let trade = 1; trade <= time; trade++) {
        amount = principal * Math.pow(1 + rate / 100, trade);
        rows.push({ step: trade, amount: parseFloat(amount.toFixed(2)), interest: parseFloat((amount - principal).toFixed(2)) });
      }
    } else if (mode === "simple") {
      for (let year = 1; year <= time; year++) {
        const si = (principal * rate * year) / 100;
        amount = principal + si;
        rows.push({ step: year, amount: parseFloat(amount.toFixed(2)), interest: parseFloat(si.toFixed(2)) });
      }
    }

    setFinalAmount(amount);
    setInterest(amount - principal);
    setData(rows);
  }, [mode, principal, rate, time, frequency]);

  // Export to CSV for Google Sheets
  const exportCSV = () => {
    const header = "Step,Amount,Interest\n";
    const rows = data.map((row) => `${row.step},${row.amount},${row.interest}`).join("\n");
    const csv = header + rows;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${mode}-calculator.csv`);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Title */}
      <h1 className="text-2xl font-bold mb-2 text-center">{getTitle()}</h1>
      <p className="text-gray-500 mb-4 text-center">
        Calculate the {mode === "simple" ? "simple" : "compound"} interest on your investments and savings
      </p>

      {/* Mode Switch */}
      <div className="flex justify-center gap-4 mb-6">
        <button onClick={() => setMode("daily")} className={`px-4 py-2 rounded-lg ${mode === "daily" ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`}>
          Daily Compound
        </button>
        <button onClick={() => setMode("forex")} className={`px-4 py-2 rounded-lg ${mode === "forex" ? "bg-green-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`}>
          Forex Compound
        </button>
        <button onClick={() => setMode("simple")} className={`px-4 py-2 rounded-lg ${mode === "simple" ? "bg-purple-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`}>
          Simple Interest
        </button>
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Principal Amount ($)</label>
          <input type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} className="w-full px-3 py-2 border rounded-md" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (% {mode === "forex" ? "per trade" : "per annum"})</label>
          <input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full px-3 py-2 border rounded-md" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{mode === "forex" ? "Number of Trades" : "Time Period (Years)"}</label>
          <input type="number" value={time} onChange={(e) => setTime(Number(e.target.value))} className="w-full px-3 py-2 border rounded-md" />
        </div>

        {mode === "daily" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Compounding Frequency</label>
            <select value={frequency} onChange={(e) => setFrequency(Number(e.target.value))} className="w-full px-3 py-2 border rounded-md">
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
      <div className="p-4 bg-gray-100 rounded-lg text-center mb-6">
        <p className="text-lg font-semibold text-gray-800">Final Amount: ${finalAmount.toFixed(2)}</p>
        <p className="text-md text-gray-600">{mode === "simple" ? "Simple Interest" : "Interest"}: ${interest.toFixed(2)}</p>
      </div>

      {/* Growth Chart */}
      <h3 className="text-lg font-semibold mb-2">Growth Summary</h3>
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2} />
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis dataKey="step" />
            <YAxis />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown Table */}
      <h3 className="text-lg font-semibold mb-2">Earnings Breakdown</h3>
      <div className="overflow-x-auto mb-4">
        <table className="w-full border border-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2">Step</th>
              <th className="border px-3 py-2">Amount ($)</th>
              <th className="border px-3 py-2">Interest ($)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td className="border px-3 py-2 text-center">{row.step}</td>
                <td className="border px-3 py-2 text-center">{row.amount}</td>
                <td className="border px-3 py-2 text-center">{row.interest}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export Button */}
      <button onClick={exportCSV} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Download CSV (Google Sheets)
      </button>
    </div>
  );
};

export default CompoundCalculator;
