import React, { useState, useEffect } from 'react';
import { Fuel } from 'lucide-react';
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
  const [results, setResults] = useState({
    fuelNeeded: 0,
    totalCost: 0,
    costPerKm: 0,
    costPerMile: 0
  });

  useEffect(() => {
    calculateFuelCost();
  }, [distance, distanceUnit, fuelEfficiency, efficiencyUnit, fuelPrice]);

  const calculateFuelCost = () => {
    let distanceInKm = distance;
    if (distanceUnit === 'miles') distanceInKm = distance * 1.60934;

    let fuelNeeded = 0;
    switch (efficiencyUnit) {
      case 'l/100km':
        fuelNeeded = (distanceInKm / 100) * fuelEfficiency;
        break;
      case 'mpg':
        const distanceInMiles = distanceInKm / 1.60934;
        fuelNeeded = (distanceInMiles / fuelEfficiency) * 3.78541;
        break;
      case 'km/l':
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
      costPerMile: Math.round(costPerMile * 100) / 100
    });
  };

  return (
    <>
      <SEOHead
        title={seoData.fuelCostCalculator?.title || 'Fuel Cost Calculator - Calculate Trip Fuel Expenses'}
        description={seoData.fuelCostCalculator?.description || 'Calculate fuel costs for your trips. Enter distance, fuel efficiency, and price to get accurate fuel expense estimates.'}
        canonical="https://calculatorhub.site/fuel-cost-calculator"
        schemaData={generateCalculatorSchema(
          'Fuel Cost Calculator',
          'Calculate fuel costs for trips and journeys',
          '/fuel-cost-calculator',
          ['fuel cost calculator', 'gas calculator', 'trip cost', 'fuel consumption', 'mpg calculator']
        )}
        breadcrumbs={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Fuel Cost Calculator', url: '/fuel-cost-calculator' }
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { name: 'Misc Tools', url: '/category/misc-tools' },
            { name: 'Fuel Cost Calculator', url: '/fuel-cost-calculator' }
          ]}
        />

        <div className="glow-card rounded-2xl p-6 sm:p-8 mb-8 bg-slate-800/70">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-6 text-center sm:text-left">
            <Fuel className="h-10 w-10 text-blue-400 mx-auto sm:mx-0" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-3 sm:mt-0">
              Fuel Cost Calculator
            </h1>
          </div>

          {/* Input Fields */}
          <div className="space-y-6 mb-8">
            {/* Distance */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Distance</label>
              <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0">
                <input
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  min={0}
                  step={1}
                  className="w-full sm:flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter distance"
                />
                <select
                  value={distanceUnit}
                  onChange={(e) => setDistanceUnit(e.target.value as 'km' | 'miles')}
                  className="w-full sm:w-auto px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="km">Kilometers</option>
                  <option value="miles">Miles</option>
                </select>
              </div>
            </div>

            {/* Fuel Efficiency */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Fuel Efficiency</label>
              <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0">
                <input
                  type="number"
                  value={fuelEfficiency}
                  onChange={(e) => setFuelEfficiency(Number(e.target.value))}
                  min={0}
                  step={0.1}
                  className="w-full sm:flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter fuel efficiency"
                />
                <select
                  value={efficiencyUnit}
                  onChange={(e) => setEfficiencyUnit(e.target.value as 'l/100km' | 'mpg' | 'km/l')}
                  className="w-full sm:w-auto px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="l/100km">L/100km</option>
                  <option value="mpg">MPG (US)</option>
                  <option value="km/l">km/L</option>
                </select>
              </div>
              <p className="text-xs text-slate-400 mt-1 text-center sm:text-left">
                {efficiencyUnit === 'mpg'
                  ? 'Miles per gallon (US)'
                  : efficiencyUnit === 'km/l'
                  ? 'Kilometers per liter'
                  : 'Liters per 100 kilometers'}
              </p>
            </div>

            {/* Fuel Price */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Fuel Price per Liter</label>
              <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0">
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  maxLength={3}
                  className="w-full sm:w-24 px-4 py-3 text-center bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="$"
                />
                <input
                  type="number"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(Number(e.target.value))}
                  min={0}
                  step={0.01}
                  className="w-full sm:flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Price per liter"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { label: 'Fuel Needed', value: `${results.fuelNeeded} L`, color: 'blue' },
              { label: 'Total Cost', value: `${currencySymbol}${results.totalCost}`, color: 'green' },
              { label: 'Cost per Kilometer', value: `${currencySymbol}${results.costPerKm}`, color: 'purple' },
              { label: 'Cost per Mile', value: `${currencySymbol}${results.costPerMile}`, color: 'orange' },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`p-5 sm:p-6 bg-gradient-to-br from-${item.color}-900/30 to-${item.color}-800/30 rounded-xl border border-${item.color}-500/30 text-center sm:text-left`}
              >
                <p className="text-sm text-slate-400 mb-1">{item.label}</p>
                <p className="text-3xl sm:text-4xl font-bold text-white">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Trip Summary */}
          <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 text-center sm:text-left">
              Trip Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-slate-300 text-center sm:text-left">
              <div>
                <p className="text-slate-400">Distance</p>
                <p className="font-semibold">{distance} {distanceUnit}</p>
              </div>
              <div>
                <p className="text-slate-400">Efficiency</p>
                <p className="font-semibold">{fuelEfficiency} {efficiencyUnit}</p>
              </div>
              <div>
                <p className="text-slate-400">Price/L</p>
                <p className="font-semibold">{currencySymbol}{fuelPrice}</p>
              </div>
              <div>
                <p className="text-slate-400">Fuel</p>
                <p className="font-semibold">{results.fuelNeeded} L</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ads */}
        <AdBanner />

        {/* About Section */}
        <div className="glow-card rounded-2xl p-6 sm:p-8 mb-8 bg-slate-800/70">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 text-center sm:text-left">
            About Fuel Cost Calculator
          </h2>
          <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            <p>
              Calculate your trip’s fuel cost accurately. Enter your distance, fuel efficiency, and price to get instant results for total cost and fuel needed.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-white mt-6">How to Use</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Enter your travel distance</li>
              <li>Input your vehicle’s fuel efficiency</li>
              <li>Enter the current fuel price</li>
              <li>View instant results below</li>
            </ul>

            <h3 className="text-lg sm:text-xl font-semibold text-white mt-6">Efficiency Tips</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Maintain proper tire pressure</li>
              <li>Remove excess vehicle weight</li>
              <li>Drive steadily, avoid rapid acceleration</li>
              <li>Plan routes to avoid heavy traffic</li>
            </ul>
          </div>
        </div>

        <RelatedCalculators currentPath="/fuel-cost-calculator" />
      </div>
    </>
  );
};

export default FuelCostCalculator;
