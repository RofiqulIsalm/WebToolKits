import React, { useEffect, useMemo, useRef, useState } from "react";
import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import RelatedCalculators from "../components/RelatedCalculators";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

/* ---------- Inline icons (no dependency) ---------- */
const Icon = {
  Swap: (p) => (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      {...p}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M16 3l4 4-4 4M20 7H4" />
      <path d="M8 21l-4-4 4-4M4 17h16" />
    </svg>
  ),
  Star: (p) => (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      {...p}
      fill="currentColor"
    >
      <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.401 8.168L12 18.896l-7.335 3.869 1.401-8.168L.132 9.21l8.2-1.192z" />
    </svg>
  ),
  StarOff: (p) => (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      {...p}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m18 6-6-4-6 4 2 7-5 5 7-1 2 7 2-7 7 1-5-5z" />
      <path d="M2 2l20 20" />
    </svg>
  ),
};

/* ---------- Unit data ---------- */
const UNITS = [
  { key: "millimeter", name: "Millimeter (mm)", factor: 0.001 },
  { key: "centimeter", name: "Centimeter (cm)", factor: 0.01 },
  { key: "meter", name: "Meter (m)", factor: 1 },
  { key: "kilometer", name: "Kilometer (km)", factor: 1000 },
  { key: "inch", name: "Inch (in)", factor: 0.0254 },
  { key: "foot", name: "Foot (ft)", factor: 0.3048 },
  { key: "yard", name: "Yard (yd)", factor: 0.9144 },
  { key: "mile", name: "Mile (mi)", factor: 1609.34 },
];
const unitMap = Object.fromEntries(UNITS.map((u) => [u.key, u]));

/* ---------- Helper functions ---------- */
function convert(value, fromKey, toKey) {
  const f = unitMap[fromKey],
    t = unitMap[toKey];
  if (!f || !t) return NaN;
  return (value * f.factor) / t.factor;
}
function formatNumber(n, precision = 6) {
  if (!Number.isFinite(n)) return "—";
  return parseFloat(n.toFixed(precision)).toString();
}

/* ---------- Component ---------- */
export default function LengthConverter() {
  const [value, setValue] = useState("");
  const [fromUnit, setFromUnit] = useState("meter");
  const [toUnit, setToUnit] = useState("inch");
  const [precision, setPrecision] = useState(6);
  const [favorites, setFavorites] = useState(["meter", "inch"]);

  const numValue = value === "" ? 0 : parseFloat(value) || 0;
  const result = useMemo(
    () => convert(numValue, fromUnit, toUnit),
    [numValue, fromUnit, toUnit]
  );

  const allResults = useMemo(() => {
    const base = numValue * (unitMap[fromUnit]?.factor || 1);
    const output = {};
    UNITS.forEach((u) => {
      if (u.key !== fromUnit) output[u.key] = base / u.factor;
    });
    return output;
  }, [numValue, fromUnit]);

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const toggleFavorite = (key) => {
    setFavorites((prev) =>
      prev.includes(key)
        ? prev.filter((f) => f !== key)
        : [...prev, key].slice(0, 5)
    );
  };

  return (
    <>
      <SEOHead
        title={seoData.lengthConverter.title}
        description={seoData.lengthConverter.description}
        canonical="https://calculatorhub.site/length-converter"
        schemaData={generateCalculatorSchema(
          "Length Converter",
          seoData.lengthConverter.description,
          "/length-converter",
          seoData.lengthConverter.keywords
        )}
        breadcrumbs={[
          { name: "Unit Converters", url: "/category/unit-converters" },
          { name: "Length Converter", url: "/length-converter" },
        ]}
      />

      <div className="max-w-4xl mx-auto text-gray-200">
        <Breadcrumbs
          items={[
            { name: "Unit Converters", url: "/category/unit-converters" },
            { name: "Length Converter", url: "/length-converter" },
          ]}
        />

        {/* Header */}
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-800 border border-gray-700">
          <h1 className="text-2xl font-bold text-white mb-1">
            Length Converter
          </h1>
          <p className="text-gray-300">
            Convert between different units of length easily.
          </p>
        </div>

        {/* Main Conversion Section */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 mb-8 shadow">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            {/* Value Input */}
            <div className="md:col-span-2">
              <label className="text-sm text-gray-300 mb-1 block">Value</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter value (default 0)"
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* From Unit */}
            <div>
              <label className="text-sm text-gray-300 mb-1 block">From</label>
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500"
              >
                {UNITS.map((u) => (
                  <option key={u.key} value={u.key}>
                    {u.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => toggleFavorite(fromUnit)}
                className="mt-2 text-xs px-3 py-1 rounded-lg bg-gray-800 border border-gray-600 hover:bg-gray-700 flex items-center gap-2"
              >
                {favorites.includes(fromUnit) ? (
                  <Icon.Star style={{ width: 14, height: 14, color: "#facc15" }} />
                ) : (
                  <Icon.StarOff style={{ width: 14, height: 14, color: "#9ca3af" }} />
                )}
                Favorite
              </button>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button
                onClick={swapUnits}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 flex items-center gap-2"
              >
                <Icon.Swap style={{ width: 16, height: 16 }} /> Swap
              </button>
            </div>

            {/* To Unit */}
            <div>
              <label className="text-sm text-gray-300 mb-1 block">To</label>
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500"
              >
                {UNITS.map((u) => (
                  <option key={u.key} value={u.key}>
                    {u.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => toggleFavorite(toUnit)}
                className="mt-2 text-xs px-3 py-1 rounded-lg bg-gray-800 border border-gray-600 hover:bg-gray-700 flex items-center gap-2"
              >
                {favorites.includes(toUnit) ? (
                  <Icon.Star style={{ width: 14, height: 14, color: "#facc15" }} />
                ) : (
                  <Icon.StarOff style={{ width: 14, height: 14, color: "#9ca3af" }} />
                )}
                Favorite
              </button>
            </div>
          </div>

          {/* Result Box */}
          <div className="mt-6 rounded-xl bg-gray-800 border border-gray-700 p-4 text-center">
            <div className="text-gray-400 text-sm mb-1">
              Result: {unitMap[fromUnit]?.name} → {unitMap[toUnit]?.name}
            </div>
            <div className="text-3xl font-semibold text-white">
              {formatNumber(result, precision)}
            </div>
          </div>
        </div>

        {/* All Units Boxes */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">
            All Units Conversion
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {UNITS.filter((u) => u.key !== fromUnit).map((u) => (
              <div
                key={u.key}
                className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:bg-gray-700/70 transition"
              >
                <div className="text-sm text-gray-400 mb-1">{u.name}</div>
                <div className="text-lg font-semibold text-gray-100">
                  {formatNumber(allResults[u.key], precision)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <AdBanner type="bottom" />
        <RelatedCalculators
          currentPath="/length-converter"
          category="unit-converters"
        />
      </div>
    </>
  );
}
