import React, { useState, useEffect } from "react";
import { Fuel, MapPin, Car, Calendar, Share2, Save } from "lucide-react";
import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import { seoData, generateCalculatorSchema } from "../utils/seoData";
import RelatedCalculators from "../components/RelatedCalculators";

const FuelCostCalculator: React.FC = () => {
  const [distance, setDistance] = useState<number>(100);
  const [distanceUnit, setDistanceUnit] = useState<"km" | "miles">("km");
  const [fuelEfficiency, setFuelEfficiency] = useState<number>(8);
  const [efficiencyUnit, setEfficiencyUnit] = useState<"l/100km" | "mpg" | "km/l">("l/100km");
  const [fuelPrice, setFuelPrice] = useState<number>(1.5);
  const [currencySymbol, setCurrencySymbol] = useState<string>("$");

  const [results, setResults] = useState({
    fuelNeeded: 0,
    totalCost: 0,
    costPerKm: 0,
    costPerMile: 0,
  });

  const [monthlyTrips, setMonthlyTrips] = useState<number>(20);
  const [savedTrips, setSavedTrips] = useState<any[]>([]);
  const [tip, setTip] = useState<string>("Maintain proper tire pressure to save fuel.");

  // 🧮 Main calculator
  useEffect(() => {
    calculateFuelCost();
  }, [distance, distanceUnit, fuelEfficiency, efficiencyUnit, fuelPrice]);

  const calculateFuelCost = () => {
    let distanceInKm = distance;
    if (distanceUnit === "miles") distanceInKm = distance * 1.60934;

    let fuelNeeded = 0;
    switch (efficiencyUnit) {
      case "l/100km":
        fuelNeeded = (distanceInKm / 100) * fuelEfficiency;
        break;
      case "mpg":
        const distanceInMiles = distanceInKm / 1.60934;
        fuelNeeded = (distanceInMiles / fuelEfficiency) * 3.78541;
        break;
      case "km/l":
        fuelNeeded = distanceInKm / fuelEfficiency;
        break;
    }

    const totalCost = fuelNeeded * fuelPrice;
    const costPerKm = totalCost / distanceInKm;
    const costPerMile = costPerKm * 1.60934;

    setResults({
      fuelNeeded: Math.round(fuelNeeded * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      costPerKm: Math.round(costPerKm * 100) / 100,
      costPerMile: Math.round(costPerMile * 100) / 100,
    });
  };

  // 🌍 Fetch distance using OpenRouteService
  const getDistance = async (origin: string, destination: string) => {
    const apiKey = import.meta.env.VITE_OPENROUTESERVICE_KEY;
    const coords: Record<string, string> = {
      Dhaka: "90.4125,23.8103",
      Chattogram: "91.7832,22.3569",
    };

    const start = coords[origin];
    const end = coords[destination];
    if (!start || !end) {
      alert("Invalid locations selected.");
      return;
    }

    try {
      const res = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${start}&end=${end}`
      );
      const data = await res.json();
      const distanceKm = data.features[0].properties.summary.distance / 1000;
      setDistance(Number(distanceKm.toFixed(2)));
      alert(`Calculated distance: ${distanceKm.toFixed(2)} km`);
    } catch (err) {
      console.error("Distance fetch failed:", err);
      alert("Unable to calculate distance right now.");
    }
  };

  // 💾 Save & Share
  const saveTrip = () => {
    const newTrip = {
      distance,
      distanceUnit,
      fuelEfficiency,
      efficiencyUnit,
      fuelPrice,
      currencySymbol,
      results,
    };
    const updated = [...savedTrips, newTrip];
    setSavedTrips(updated);
    localStorage.setItem("fuelTrips", JSON.stringify(updated));
  };

  const shareTrip = async () => {
    const text = `🚗 Trip Summary:
Distance: ${distance} ${distanceUnit}
Fuel Efficiency: ${fuelEfficiency} ${efficiencyUnit}
Fuel Price: ${currencySymbol}${fuelPrice}
Total Cost: ${currencySymbol}${results.totalCost}`;
    await navigator.clipboard.writeText(text);
    alert("Trip summary copied to clipboard!");
  };

  // 🔄 Load Saved Trips
  useEffect(() => {
    const data = localStorage.getItem("fuelTrips");
    if (data) setSavedTrips(JSON.parse(data));
  }, []);

  // 💡 Fuel saving tips
  const tips = [
    "Drive smoothly — avoid rapid acceleration.",
    "Check tire pressure regularly.",
    "Remove unnecessary weight.",
    "Plan your trips efficiently.",
    "Use cruise control on highways.",
    "Avoid long idling.",
  ];
  useEffect(() => {
    const interval = setInterval(() => {
      setTip(tips[Math.floor(Math.random() * tips.length)]);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const monthlyCost = results.totalCost * monthlyTrips;
  const yearlyCost = monthlyCost * 12;

  return (
    <>
      <SEOHead
        title="Fuel Cost Calculator - Calculate Trip Fuel Expenses"
        description="Calculate your trip fuel costs easily. Enter distance, efficiency, and price to get detailed results."
        canonical="https://calculatorhub.site/fuel-cost-calculator"
        schemaData={generateCalculatorSchema(
          "Fuel Cost Calculator",
          "Calculate fuel costs for trips and journeys",
          "/fuel-cost-calculator",
          ["fuel cost calculator", "trip cost", "mpg", "gas usage"]
        )}
      />

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <Breadcrumbs
          items={[
            { name: "Misc Tools", url: "/category/misc-tools" },
            { name: "Fuel Cost Calculator", url: "/fuel-cost-calculator" },
          ]}
        />

        <div className="glow-card rounded-2xl p-6 sm:p-8 mb-8 bg-slate-800/60">
          <div className="flex items-center space-x-3 mb-6">
            <Fuel className="h-8 w-8 text-blue-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Fuel Cost Calculator</h1>
          </div>

          {/* Distance Inputs */}
          <div className="space-y-4 mb-6">
            <label className="block text-sm font-medium text-white mb-2">Distance</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="number"
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
                className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600"
                placeholder="Enter distance"
              />
              <select
                value={distanceUnit}
                onChange={(e) => setDistanceUnit(e.target.value as "km" | "miles")}
                className="px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600"
              >
                <option value="km">Kilometers</option>
                <option value="miles">Miles</option>
              </select>
            </div>
          </div>

          {/* Auto Distance Lookup */}
          <div className="space-y-4 mb-6">
            <label className="block text-sm font-medium text-white mb-2">
              Auto Distance Lookup (Dhaka → Chattogram)
            </label>
            <button
              onClick={() => getDistance("Dhaka", "Chattogram")}
              className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Calculate Distance
            </button>
          </div>

          {/* Fuel Efficiency */}
          <div className="space-y-4 mb-6">
            <label className="block text-sm font-medium text-white mb-2">Fuel Efficiency</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="number"
                value={fuelEfficiency}
                onChange={(e) => setFuelEfficiency(Number(e.target.value))}
                className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600"
                placeholder="Enter efficiency"
              />
              <select
                value={efficiencyUnit}
                onChange={(e) =>
                  setEfficiencyUnit(e.target.value as "l/100km" | "mpg" | "km/l")
                }
                className="px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600"
              >
                <option value="l/100km">L/100km</option>
                <option value="mpg">MPG (US)</option>
                <option value="km/l">km/L</option>
              </select>
            </div>
          </div>

          {/* Fuel Price */}
          <div className="space-y-4 mb-6">
            <label className="block text-sm font-medium text-white mb-2">Fuel Price</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-20 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 text-center"
              />
              <input
                type="number"
                value={fuelPrice}
                onChange={(e) => setFuelPrice(Number(e.target.value))}
                className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600"
                placeholder="Fuel price per liter"
              />
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {[
              { title: "Fuel Needed", value: `${results.fuelNeeded} L`, color: "blue" },
              { title: "Total Cost", value: `${currencySymbol}${results.totalCost}`, color: "green" },
              { title: "Cost per Km", value: `${currencySymbol}${results.costPerKm}`, color: "purple" },
              { title: "Cost per Mile", value: `${currencySymbol}${results.costPerMile}`, color: "orange" },
            ].map((item) => (
              <div
                key={item.title}
                className={`p-5 bg-gradient-to-br from-${item.color}-900/30 to-${item.color}-800/30 rounded-xl border border-${item.color}-500/30`}
              >
                <p className="text-sm text-slate-400">{item.title}</p>
                <p className="text-3xl font-bold text-white">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Monthly/Yearly Estimation */}
          <div className="bg-slate-700/50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-slate-400">Trips per month:</p>
              <input
                type="number"
                value={monthlyTrips}
                onChange={(e) => setMonthlyTrips(Number(e.target.value))}
                className="w-20 px-3 py-1 bg-slate-800 text-white rounded border border-slate-600 text-center"
              />
            </div>
            <p className="text-slate-300 text-sm">
              Monthly cost: <strong>{currencySymbol}{monthlyCost.toFixed(2)}</strong> | Yearly cost:{" "}
              <strong>{currencySymbol}{yearlyCost.toFixed(2)}</strong>
            </p>
          </div>

          {/* Save / Share */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={saveTrip}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              <Save className="w-4 h-4" /> Save Trip
            </button>
            <button
              onClick={shareTrip}
              className="flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
            >
              <Share2 className="w-4 h-4" /> Share Summary
            </button>
          </div>

          {/* Fuel Tips */}
          <div className="bg-slate-700/40 p-4 rounded-lg border border-slate-600 mb-8">
            <p className="text-sm text-slate-400 mb-1">Fuel Saving Tip:</p>
            <p className="text-slate-200 font-semibold">{tip}</p>
          </div>

          <AdBanner />
        </div>

        {/* FAQ Section */}
        <div className="bg-slate-800/50 p-6 rounded-2xl mb-8">
          <h2 className="text-xl font-bold text-white mb-3">Frequently Asked Questions</h2>
          <ul className="space-y-3 text-slate-300 text-sm">
            <li>🔹 <strong>Can I use miles instead of km?</strong> — Yes, toggle between units easily.</li>
            <li>🔹 <strong>Is fuel efficiency accurate?</strong> — It depends on your car’s rating & real-world driving.</li>
            <li>🔹 <strong>Can I compare two trips?</strong> — Yes, save trips and view results side by side.</li>
            <li>🔹 <strong>Does this work offline?</strong> — Saved trips are stored locally in your browser.</li>
          </ul>
        </div>

        <RelatedCalculators currentPath="/fuel-cost-calculator" />
      </div>
    </>
  );
};

export default FuelCostCalculator;
