import React, { useState, useEffect } from 'react';
import { Square } from 'lucide-react';
import AdBanner from '../components/AdBanner';

const AreaConverter: React.FC = () => {
  const [value, setValue] = useState<number>(1);
  const [fromUnit, setFromUnit] = useState<string>('square_meter');
  const [results, setResults] = useState<{[key: string]: number}>({});

  const units = [
    { key: 'square_millimeter', name: 'Square Millimeter (mm²)', factor: 0.000001 },
    { key: 'square_centimeter', name: 'Square Centimeter (cm²)', factor: 0.0001 },
    { key: 'square_meter', name: 'Square Meter (m²)', factor: 1 },
    { key: 'square_kilometer', name: 'Square Kilometer (km²)', factor: 1000000 },
    { key: 'hectare', name: 'Hectare (ha)', factor: 10000 },
    { key: 'square_inch', name: 'Square Inch (in²)', factor: 0.00064516 },
    { key: 'square_foot', name: 'Square Foot (ft²)', factor: 0.092903 },
    { key: 'square_yard', name: 'Square Yard (yd²)', factor: 0.836127 },
    { key: 'acre', name: 'Acre', factor: 4046.86 },
    { key: 'square_mile', name: 'Square Mile (mi²)', factor: 2589990 }
  ];

  useEffect(() => {
    convertArea();
  }, [value, fromUnit]);

  const convertArea = () => {
    const fromUnitData = units.find(u => u.key === fromUnit);
    if (!fromUnitData) return;

    const valueInSquareMeters = value * fromUnitData.factor;
    const newResults: {[key: string]: number} = {};

    units.forEach(unit => {
      if (unit.key !== fromUnit) {
        newResults[unit.key] = valueInSquareMeters / unit.factor;
      }
    });

    setResults(newResults);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Area Converter</h1>
        <p className="text-gray-600">Convert between different units of area and surface</p>
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
                  <Square className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">{unit.name}</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {results[unit.key]?.toFixed(8).replace(/\.?0+$/, '') || '0'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AdBanner type="bottom" />
    </div>
  );
};

export default AreaConverter;