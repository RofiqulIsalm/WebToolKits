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
  const [fuelPrice, setFuelPrice] = useState<number>(1.50);
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
    if (distanceUnit === 'miles') {
      distanceInKm = distance * 1.60934;
    }

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
        canonical="https://calculatorhub.com/fuel-cost-calculator"
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
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Fuel Cost Calculator', url: '/fuel-cost-calculator' }
        ]} />

        <div className="glow-card rounded-2xl p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Fuel className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Fuel Cost Calculator</h1>
          </div>

          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Distance
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  min={0}
                  step={1}
                  className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter distance"
                />
                <select
                  value={distanceUnit}
                  onChange={(e) => setDistanceUnit(e.target.value as 'km' | 'miles')}
                  className="px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="km">Kilometers</option>
                  <option value="miles">Miles</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Fuel Efficiency
              </label>
              <div className="flex space-x-3">
                <input
                  type="number"
                  value={fuelEfficiency}
                  onChange={(e) => setFuelEfficiency(Number(e.target.value))}
                  min={0}
                  step={0.1}
                  className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter fuel efficiency"
                />
                <select
                  value={efficiencyUnit}
                  onChange={(e) => setEfficiencyUnit(e.target.value as 'l/100km' | 'mpg' | 'km/l')}
                  className="px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="l/100km">L/100km</option>
                  <option value="mpg">MPG (US)</option>
                  <option value="km/l">km/L</option>
                </select>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {efficiencyUnit === 'mpg' ? 'Miles per gallon (US)' :
                 efficiencyUnit === 'km/l' ? 'Kilometers per liter' :
                 'Liters per 100 kilometers'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Fuel Price per Liter
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  maxLength={3}
                  className="w-20 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  placeholder="$"
                />
                <input
                  type="number"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(Number(e.target.value))}
                  min={0}
                  step={0.01}
                  className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Price per liter"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl border border-blue-500/30">
              <p className="text-sm text-slate-400 mb-1">Fuel Needed</p>
              <p className="text-4xl font-bold text-white">{results.fuelNeeded} L</p>
            </div>

            <div className="p-6 bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl border border-green-500/30">
              <p className="text-sm text-slate-400 mb-1">Total Cost</p>
              <p className="text-4xl font-bold text-white">
                {currencySymbol}{results.totalCost}
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-xl border border-purple-500/30">
              <p className="text-sm text-slate-400 mb-1">Cost per Kilometer</p>
              <p className="text-3xl font-bold text-white">
                {currencySymbol}{results.costPerKm}
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-orange-900/30 to-orange-800/30 rounded-xl border border-orange-500/30">
              <p className="text-sm text-slate-400 mb-1">Cost per Mile</p>
              <p className="text-3xl font-bold text-white">
                {currencySymbol}{results.costPerMile}
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
            <h3 className="text-sm font-semibold text-white mb-2">Trip Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-300">
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

        <AdBanner />

        <div className="glow-card rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">About Fuel Cost Calculator</h2>
          <div className="space-y-4 text-slate-300">
            <p>
              Calculate the fuel costs for your trips with precision. Our fuel cost calculator helps you
              budget for road trips, daily commutes, and business travel by estimating fuel consumption
              and total expenses.
            </p>
            <h3 className="text-xl font-semibold text-white mt-6">How to Use:</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Enter the distance you plan to travel (km or miles)</li>
              <li>Input your vehicle's fuel efficiency (L/100km, MPG, or km/L)</li>
              <li>Add the current fuel price per liter</li>
              <li>Get instant calculations for fuel needed and total cost</li>
            </ul>
            <h3 className="text-xl font-semibold text-white mt-6">Understanding Fuel Efficiency:</h3>
            <div className="space-y-2">
              <p><strong>L/100km:</strong> Common in Europe and Australia. Lower is better (e.g., 6 L/100km is efficient)</p>
              <p><strong>MPG (Miles Per Gallon):</strong> Used in the US and UK. Higher is better (e.g., 30 MPG is good)</p>
              <p><strong>km/L:</strong> Common in Asia. Higher is better (e.g., 15 km/L is efficient)</p>
            </div>
            <h3 className="text-xl font-semibold text-white mt-6">Tips to Reduce Fuel Costs:</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Maintain proper tire pressure</li>
              <li>Remove excess weight from your vehicle</li>
              <li>Drive at steady speeds and avoid rapid acceleration</li>
              <li>Keep your engine well-maintained</li>
              <li>Plan routes to avoid traffic congestion</li>
              <li>Use cruise control on highways</li>
            </ul>
          </div>
        </div>

        <RelatedCalculators currentPath="/fuel-cost-calculator" />
      </div>
    </>
  );
}; 

export default FuelCostCalculator;
