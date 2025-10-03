import React, { useState, useEffect } from "react";

// Example currency list
const currencies = [
  { code: "USD", name: "United States Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "INR", name: "Indian Rupee" },
  { code: "BDT", name: "Bangladeshi Taka" },
  // add all currencies you need
];

// 🔹 Currency Search Component
function CurrencySearch({ onSelect }: { onSelect: (code: string) => void }) {
  const [search, setSearch] = useState("");

  const filtered = currencies.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-sm">
      {/* Search input */}
      <input
        type="text"
        placeholder="Search currency..."
        className="w-full px-3 py-2 rounded-lg border border-gray-500 text-black"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Dropdown result */}
      <ul className="border border-gray-400 rounded-lg mt-2 max-h-48 overflow-y-auto bg-white shadow-lg">
        {filtered.map((c) => (
          <li
            key={c.code}
            className="px-3 py-2 cursor-pointer hover:bg-blue-200"
            onClick={() => {
              onSelect(c.code);
              setSearch(""); // clear search after selecting
            }}
          >
            <span className="font-bold">{c.code}</span> - {c.name}
          </li>
        ))}

        {filtered.length === 0 && (
          <li className="px-3 py-2 text-gray-500">No results found</li>
        )}
      </ul>
    </div>
  );
}

// 🔹 Main Currency Converter
export default function CurrencyConverter() {
  const [amount, setAmount] = useState(1);
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("BDT");
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    if (fromCurrency && toCurrency) {
      fetch(
        `https://api.exchangerate.host/latest?base=${fromCurrency}&symbols=${toCurrency}`
      )
        .then((res) => res.json())
        .then((data) => {
          setRate(data.rates[toCurrency]);
        })
        .catch((err) => console.error(err));
    }
  }, [fromCurrency, toCurrency]);

  const converted = rate ? (amount * rate).toFixed(2) : "Loading...";

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">Currency Converter</h1>

      {/* Amount input */}
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(parseFloat(e.target.value))}
        className="w-full px-3 py-2 mb-4 rounded-lg border border-gray-500 text-black"
      />

      <div className="flex flex-col md:flex-row gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">From Currency</h2>
          <CurrencySearch onSelect={setFromCurrency} />
          <p className="mt-2">Selected: {fromCurrency}</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">To Currency</h2>
          <CurrencySearch onSelect={setToCurrency} />
          <p className="mt-2">Selected: {toCurrency}</p>
        </div>
      </div>

      <div className="mt-6 text-2xl font-bold">
        {amount} {fromCurrency} = {converted} {toCurrency}
      </div>
    </div>
  );
}
