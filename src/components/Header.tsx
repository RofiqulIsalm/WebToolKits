import React, { useState } from "react";
import Link from "next/link";

const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);

  const calculators = [
    "Currency Converter",
    "Loan EMI Calculator",
    "Compound Interest",
    "Tax Calculator",
    "QR Code Generator",
    "Password Generator",
    "Age Calculator",
    "Date Difference",
    "BMI Calculator",
    "Unit Converter",
  ];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (query.length > 0) {
      const filtered = calculators.filter((calc) =>
        calc.toLowerCase().includes(query)
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setResults([]);
  };

  return (
    <header className="bg-gray-900 text-white px-4 py-3 flex flex-col md:flex-row items-center justify-between relative">
      {/* Logo */}
      <Link href="/" className="text-xl font-bold mb-2 md:mb-0">
        CalculatorHub
      </Link>

      {/* Search Bar */}
      <div className="relative w-full md:w-1/3">
        <input
          type="text"
          placeholder="Search calculators..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-full px-3 py-2 rounded-lg text-black outline-none"
        />

        {/* Search Results Dropdown */}
        {results.length > 0 && (
          <div className="absolute top-full left-0 right-0 glow-card rounded-lg mt-1 max-h-80 overflow-y-auto z-[99999]">
            {results.map((result, index) => (
              <Link
                key={index}
                href={`/calculators/${result
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
                className="block px-3 py-2 hover:bg-gray-200 hover:text-black"
                onClick={clearSearch} // ✅ Auto close dropdown on mobile after click
              >
                {result}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex gap-4 mt-2 md:mt-0">
        <Link href="/about" className="hover:text-gray-300">
          About
        </Link>
        <Link href="/contact" className="hover:text-gray-300">
          Contact
        </Link>
        <Link href="/support" className="hover:text-gray-300">
          Support
        </Link>
      </nav>
    </header>
  );
};

export default Header;
