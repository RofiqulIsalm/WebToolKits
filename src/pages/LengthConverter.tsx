import React, { useState, useEffect } from 'react';
import { Ruler } from 'lucide-react';
import AdBanner from '../components/AdBanner';

const LengthConverter: React.FC = () => {
  const [value, setValue] = useState<number>(1);
  const [fromUnit, setFromUnit] = useState<string>('meter');
  const [results, setResults] = useState<{[key: string]: number}>({});

  const units = [
    { key: 'millimeter', name: 'Millimeter (mm)', factor: 0.001 },
    { key: 'centimeter', name: 'Centimeter (cm)', factor: 0.01 },
    { key: 'meter', name: 'Meter (m)', factor: 1 },
    { key: 'kilometer', name: 'Kilometer (km)', factor: 1000 },
    { key: 'inch', name: 'Inch (in)', factor: 0.0254 },
    { key: 'foot', name: 'Foot (ft)', factor: 0.3048 },
    { key: 'yard', name: 'Yard (yd)', factor: 0.9144 },
    { key: 'mile', name: 'Mile (mi)', factor: 1609.34 }
  ];

  useEffect(() => {
    convertLength();
  }, [value, fromUnit]);

  const convertLength = () => {
    const fromUnitData = units.find(u => u.key === fromUnit);
    if (!fromUnitData) return;

    const valueInMeters = value * fromUnitData.factor;
    const newResults: {[key: string]: number} = {};

    units.forEach(unit => {
      if (unit.key !== fromUnit) {
        newResults[unit.key] = valueInMeters / unit.factor;
      }
    });

    setResults(newResults);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Length Converter</h1>
        <p className="text-gray-600">Convert between different units of length and distance</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {units.map((unit) => {
            if (unit.key === fromUnit) return null;
            
            return (
              <div key={unit.key} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Ruler className="h-4 w-4 text-blue-600" />
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
          <h2 className="text-2xl font-bold text-white mb-6">Length Converter Guide</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 mb-4">
              Convert between different units of length and distance with our comprehensive length converter. 
              From millimeters to miles, our tool handles all common length measurements used in construction, 
              engineering, science, and everyday life with precise accuracy.
            </p>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-4">Measurement Systems</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-3">Metric System</h4>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Millimeter (mm) - 0.001 meters</li>
                  <li>• Centimeter (cm) - 0.01 meters</li>
                  <li>• Meter (m) - Base unit</li>
                  <li>• Kilometer (km) - 1,000 meters</li>
                </ul>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-3">Imperial System</h4>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Inch (in) - 2.54 centimeters</li>
                  <li>• Foot (ft) - 12 inches</li>
                  <li>• Yard (yd) - 3 feet</li>
                  <li>• Mile (mi) - 5,280 feet</li>
                </ul>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mt-6 mb-4">Common Conversions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                <div className="font-semibold text-white">1 inch</div>
                <div className="text-sm text-slate-400">= 2.54 cm</div>
              </div>
              <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                <div className="font-semibold text-white">1 foot</div>
                <div className="text-sm text-slate-400">= 30.48 cm</div>
              </div>
              <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                <div className="font-semibold text-white">1 meter</div>
                <div className="text-sm text-slate-400">= 3.28 feet</div>
              </div>
              <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                <div className="font-semibold text-white">1 mile</div>
                <div className="text-sm text-slate-400">= 1.61 km</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LengthConverter;