import React, { useState, useEffect } from 'react';
import { Scale } from 'lucide-react';
import AdBanner from '../components/AdBanner';

const WeightConverter: React.FC = () => {
  const [value, setValue] = useState<number>(1);
  const [fromUnit, setFromUnit] = useState<string>('kilogram');
  const [results, setResults] = useState<{[key: string]: number}>({});

  const units = [
    { key: 'milligram', name: 'Milligram (mg)', factor: 0.000001 },
    { key: 'gram', name: 'Gram (g)', factor: 0.001 },
    { key: 'kilogram', name: 'Kilogram (kg)', factor: 1 },
    { key: 'tonne', name: 'Tonne (t)', factor: 1000 },
    { key: 'ounce', name: 'Ounce (oz)', factor: 0.0283495 },
    { key: 'pound', name: 'Pound (lb)', factor: 0.453592 },
    { key: 'stone', name: 'Stone (st)', factor: 6.35029 }
  ];

  useEffect(() => {
    convertWeight();
  }, [value, fromUnit]);

  const convertWeight = () => {
    const fromUnitData = units.find(u => u.key === fromUnit);
    if (!fromUnitData) return;

    const valueInKg = value * fromUnitData.factor;
    const newResults: {[key: string]: number} = {};

    units.forEach(unit => {
      if (unit.key !== fromUnit) {
        newResults[unit.key] = valueInKg / unit.factor;
      }
    });

    setResults(newResults);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Weight Converter</h1>
        <p className="text-gray-600">Convert between different units of weight and mass</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter value"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Unit</label>
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {units.map((unit) => (
                <option key={unit.key} value={unit.key}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((unit) => {
            if (unit.key === fromUnit) return null;
            
            return (
              <div key={unit.key} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Scale className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">{unit.name}</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {results[unit.key]?.toFixed(6).replace(/\.?0+$/, '') || '0'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AdBanner type="bottom" />

      {/* SEO Content Section */}
      <div className="mt-12 space-y-8">
        <div className="converter-card rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Weight Converter Information</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 mb-4">
              Convert between different units of weight and mass with precision. Our weight converter supports 
              all common weight measurements from milligrams to tonnes, making it perfect for cooking, 
              shipping, scientific calculations, and everyday weight conversions.
            </p>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-4">Weight vs Mass</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="font-semibold text-white mb-2">Weight</div>
                <div className="text-slate-300 text-sm">Force exerted by gravity on an object</div>
                <div className="text-xs text-slate-400 mt-1">Varies with gravitational field</div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="font-semibold text-white mb-2">Mass</div>
                <div className="text-slate-300 text-sm">Amount of matter in an object</div>
                <div className="text-xs text-slate-400 mt-1">Constant regardless of location</div>
              </div>
            </div>
    </div>
  );
};

            <h3 className="text-xl font-semibold text-white mt-6 mb-4">Common Weight Units</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-700/50 p-3 rounded-lg">
                <div className="font-semibold text-white">Milligram (mg)</div>
                <div className="text-sm text-slate-400">Medicine dosages</div>
              </div>
              <div className="bg-slate-700/50 p-3 rounded-lg">
                <div className="font-semibold text-white">Gram (g)</div>
                <div className="text-sm text-slate-400">Cooking ingredients</div>
              </div>
              <div className="bg-slate-700/50 p-3 rounded-lg">
                <div className="font-semibold text-white">Kilogram (kg)</div>
                <div className="text-sm text-slate-400">Body weight, luggage</div>
              </div>
              <div className="bg-slate-700/50 p-3 rounded-lg">
                <div className="font-semibold text-white">Pound (lb)</div>
                <div className="text-sm text-slate-400">US body weight</div>
              </div>
              <div className="bg-slate-700/50 p-3 rounded-lg">
                <div className="font-semibold text-white">Ounce (oz)</div>
                <div className="text-sm text-slate-400">Small portions</div>
              </div>
              <div className="bg-slate-700/50 p-3 rounded-lg">
                <div className="font-semibold text-white">Tonne (t)</div>
                <div className="text-sm text-slate-400">Heavy machinery</div>
              </div>
            </div>
export default WeightConverter;