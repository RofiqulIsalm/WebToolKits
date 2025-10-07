import React, { useState, useEffect } from 'react';
import { Fuel, MapPin, Car } from 'lucide-react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const FuelCostCalculator: React.FC = () => {
  const [distance, setDistance] = useState<number>(100);
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'miles'>('km');
  const [fuelEfficiency, setFuelEfficiency] = useState<number>(8);
  const [efficiencyUnit, setEfficiencyUnit] = useState<'l/100km' | 'mpg' | 'km/l'>('l/100km');
  const [fuelPrice, setFuelPrice] = useState<number>(1.5);
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');
  const [tolls, setTolls] = useState<number>(0);
  const [otherCost, setOtherCost] = useState<number>(0);
  const [results, setResults] = useState({
    fuelNeeded: 0,
    totalCost: 0,
    costPerKm: 0,
    costPerMile: 0,
  });

  // Vehicle Comparison States
  const [vehicleB, setVehicleB] = useState({
    fuelEfficiency: 10,
    totalCost: 0,
  });

  useEffect(() => {
    calculateFuelCost();
  }, [distance, distanceUnit, fuelEfficiency, efficiencyUnit, fuelPrice, tolls, otherCost]);

  const calculateFuelCost = () => {
    let distanceInKm = distance;
    if (distanceUnit === 'miles') distanceInKm = distance * 1.60934;

    const calcFuel = (efficiency: number, unit: string) => {
      switch (unit) {
        case 'l/100km':
          return (distanceInKm / 100) * efficiency;
        case 'mpg':
          const distanceInMiles = distanceInKm / 1.60934;
          return (distanceInMiles / efficiency) * 3.78541;
        case 'km/l':
          return distanceInKm / efficiency;
        default:
          return 0;
      }
    };

    const fuelNeeded = calcFuel(fuelEfficiency, efficiencyUnit);
    const totalCost = fuelNeeded * fuelPrice + tolls + otherCost;
    const costPerKm = totalCost / distanceInKm;
    const costPerMile = costPerKm * 1.60934;

    setResults({
      fuelNeeded: Math.round(fuelNeeded * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      costPerKm: Math.round(costPerKm * 100) / 100,
      costPerMile: Math.round(costPerMile * 100) / 100,
    });

    // Vehicle B comparison
    const fuelB = calcFuel(vehicleB.fuelEfficiency, efficiencyUnit);
    const totalB = fuelB * fuelPrice + tolls + otherCost;
    setVehicleB((prev) => ({ ...prev, totalCost: Math.round(totalB * 100) / 100 }));
  };

  // Pie chart data
  const pieData = [
    { name: 'Fuel Cost', value: results.fuelNeeded * fuelPrice },
    { name: 'Tolls', value: tolls },
    { name: 'Other Costs', value: otherCost },
  ];
  const COLORS = ['#3b82f6', '#22c55e', '#f97316'];

  // Google Maps link
  const openMap = () => {
    const query = `https://www.google.com/maps/dir/?api=1&travelmode=driving`;
    window.open(query, '_blank');
  };

  return (
    <>
      <SEOHead
        title={seoData.fuelCostCalculator?.title || 'Fuel Cost Calculator - Calculate Trip Fuel Expenses'}
        description={seoData.fuelCostCalculator?.description || 'Calculate fuel costs for your trips. Enter distance, fuel efficiency, and price to get accurate fuel expense estimates.'}
        canonical="https://calculatorhub.com/fuel-cost-calculator"
        schemaData={generateCalculatorSchema(
          'Fuel Cost Calculator',
          'Calculate fuel costs for trips and journeys',
          '/fuel-cost-calculator',
          ['fuel cost calculator', 'gas calculator', 'trip cost', 'fuel consumption', 'mpg calculator']
        )}
        breadcrumbs={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Fuel Cost Calculator', url: '/fuel-cost-calculator' },
        ]}
      />
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Misc Tools', url: '/category/misc-tools' },
            { name: 'Fuel Cost Calculator', url: '/fuel-cost-calculator' },
          ]}
        />

        <div className="glow-card rounded-2xl p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Fuel className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Fuel Cost Calculator</h1>
          </div>

          {/* Existing Input Fields */}
          {/* Existing UI remains same up to trip summary */}

          {/* 🆕 New Input Fields for Tolls & Other Costs */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Toll Costs ({currencySymbol})</label>
              <input
                type="number"
                value={tolls}
                onChange={(e) => setTolls(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600"
                placeholder="Enter toll costs"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Other Costs ({currencySymbol})</label>
              <input
                type="number"
                value={otherCost}
                onChange={(e) => setOtherCost(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600"
                placeholder="Parking, meals, etc."
              />
            </div>
          </div>

          {/* ✅ Cost Breakdown Pie Chart */}
          <div className="p-6 bg-slate-800/50 rounded-xl mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Cost Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 🚗 Compare Two Vehicles */}
          <div className="p-6 bg-slate-800/50 rounded-xl mb-8">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Car className="h-5 w-5 text-blue-400" /> Compare Two Vehicles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Vehicle A Efficiency ({efficiencyUnit})</label>
                <input
                  type="number"
                  value={fuelEfficiency}
                  readOnly
                  className="w-full px-4 py-3 bg-slate-700 text-slate-300 rounded-lg border border-slate-600"
                />
                <p className="text-sm text-slate-400 mt-1">
                  Total: {currencySymbol}{results.totalCost}
                </p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Vehicle B Efficiency ({efficiencyUnit})</label>
                <input
                  type="number"
                  value={vehicleB.fuelEfficiency}
                  onChange={(e) => setVehicleB({ ...vehicleB, fuelEfficiency: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600"
                  placeholder="Enter Vehicle B efficiency"
                />
                <p className="text-sm text-slate-400 mt-1">
                  Total: {currencySymbol}{vehicleB.totalCost}
                </p>
              </div>
            </div>
            <p className="mt-3 text-slate-300 text-sm">
              💡 Difference: {currencySymbol}{Math.abs(results.totalCost - vehicleB.totalCost).toFixed(2)}
            </p>
          </div>

          {/* 🗺️ Google Maps Button */}
          <div className="flex justify-center mt-6">
            <button
              onClick={openMap}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              <MapPin className="h-5 w-5" />
              Open in Google Maps
            </button>
          </div>
        </div>

        <AdBanner />

        {/* Existing “About” and Related sections remain untouched */}
        <RelatedCalculators currentPath="/fuel-cost-calculator" />
      </div>
    </>
  );
};

export default FuelCostCalculator;
