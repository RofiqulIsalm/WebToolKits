import React, { useState } from "react";

const NumberConverter: React.FC = () => {
  const [input, setInput] = useState("");
  const [inputType, setInputType] = useState<"number" | "roman" | "arabic">("number");
  const [results, setResults] = useState({ roman: "", arabic: "", number: "" });

  // Convert number to Roman
  const toRoman = (num: number): string => {
    if (num <= 0 || num >= 4000) return "";
    const romans = [
      ["M", 1000],
      ["CM", 900],
      ["D", 500],
      ["CD", 400],
      ["C", 100],
      ["XC", 90],
      ["L", 50],
      ["XL", 40],
      ["X", 10],
      ["IX", 9],
      ["V", 5],
      ["IV", 4],
      ["I", 1],
    ];
    let result = "";
    for (const [roman, value] of romans) {
      while (num >= value) {
        result += roman;
        num -= value;
      }
    }
    return result;
  };

  // Convert Roman to Number
  const fromRoman = (roman: string): number => {
    const map: { [key: string]: number } = {
      I: 1,
      V: 5,
      X: 10,
      L: 50,
      C: 100,
      D: 500,
      M: 1000,
    };
    let result = 0;
    let prev = 0;
    for (let i = roman.length - 1; i >= 0; i--) {
      const curr = map[roman[i].toUpperCase()];
      if (!curr) return NaN;
      if (curr < prev) result -= curr;
      else result += curr;
      prev = curr;
    }
    return result;
  };

  // Convert Number to Arabic (Eastern)
  const toArabic = (num: number): string =>
    num.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);

  // Convert Arabic (Eastern) to Number
  const fromArabic = (str: string): number => {
    const western = str.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
    return parseInt(western);
  };

  const handleConvert = (value: string, type: "number" | "roman" | "arabic") => {
    let num = 0;

    if (type === "number") num = parseInt(value);
    else if (type === "roman") num = fromRoman(value);
    else if (type === "arabic") num = fromArabic(value);

    if (isNaN(num)) {
      setResults({ roman: "-", arabic: "-", number: "-" });
      return;
    }

    setResults({
      roman: toRoman(num),
      arabic: toArabic(num),
      number: num.toString(),
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    handleConvert(val, inputType);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-lg mt-10">
      <h1 className="text-2xl font-semibold text-center mb-4">Number ↔ Roman ↔ Arabic Converter</h1>

      {/* Input Type Selection */}
      <div className="flex justify-center gap-3 mb-4">
        {["number", "roman", "arabic"].map((t) => (
          <button
            key={t}
            onClick={() => {
              setInputType(t as any);
              setInput("");
              setResults({ roman: "", arabic: "", number: "" });
            }}
            className={`px-3 py-1 rounded-md border ${
              inputType === t ? "bg-blue-600 text-white" : "bg-gray-100"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        placeholder={`Enter ${inputType}...`}
        className="w-full border rounded-lg px-4 py-2 mb-6 focus:ring-2 focus:ring-blue-400 outline-none"
      />

      {/* Result Boxes */}
      <div className="grid grid-cols-3 text-center font-semibold">
        <div className="p-3 border rounded-lg bg-gray-50">
          <p className="text-sm text-gray-500">Roman</p>
          <p className="text-lg">{results.roman || "-"}</p>
        </div>
        <div className="p-3 border rounded-lg bg-gray-50">
          <p className="text-sm text-gray-500">Arabic</p>
          <p className="text-lg">{results.arabic || "-"}</p>
        </div>
        <div className="p-3 border rounded-lg bg-gray-50">
          <p className="text-sm text-gray-500">Number</p>
          <p className="text-lg">{results.number || "-"}</p>
        </div>
      </div>
    </div>
  );
};

export default NumberConverter;
