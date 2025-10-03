import React, { useState } from "react";

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

export default function CurrencySearch({ onSelect }: { onSelect: (code: string) => void }) {
  const [search, setSearch] = useState("");

  // Filter based on search
  const filtered = currencies.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-sm mx-auto">
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
            onClick={() => onSelect(c.code)}
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
