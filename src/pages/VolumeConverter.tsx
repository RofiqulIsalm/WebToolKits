import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { Zap } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const VolumeConverter: React.FC = () => {
  const [value, setValue] = useState<number>(1);
  const [fromUnit, setFromUnit] = useState<string>('liter');
  const [results, setResults] = useState<{ [key: string]: number }>({});

  const units = [
    { key: 'liter', name: 'Liters (L)', factor: 1 },
    { key: 'ml', name: 'Milliliters (mL)', factor: 0.001 },
    { key: 'm3', name: 'Cubic Meters (m³)', factor: 1000 },
    { key: 'cm3', name: 'Cubic Centimeters (cm³)', factor: 0.001 },
    { key: 'in3', name: 'Cubic Inches (in³)', factor: 0.0163871 },
    { key: 'ft3', name: 'Cubic Feet (ft³)', factor: 28.3168 },
    { key: 'gal', name: 'Gallons (US gal)', factor: 3.78541 },
    { key: 'qt', name: 'Quarts (US qt)', factor: 0.946353 },
    { key: 'pt', name: 'Pints (US pt)', factor: 0.473176 },
    { key: 'cup', name: 'Cups (US cup)', factor: 0.24 },
    { key: 'tbsp', name: 'Tablespoons (tbsp)', factor: 0.0147868 },
    { key: 'tsp', name: 'Teaspoons (tsp)', factor: 0.00492892 },
  ];

  useEffect(() => {
    convertVolume();
  }, [value, fromUnit]);

  const convertVolume = () => {
    const fromUnitData = units.find(u => u.key === fromUnit);
    if (!fromUnitData) return;

    const valueInLiters = value * fromUnitData.factor;
    const newResults: { [key: string]: number } = {};

    units.forEach(unit => {
      if (unit.key !== fromUnit) {
        newResults[unit.key] = valueInLiters / unit.factor;
      }
    });

    setResults(newResults);
  };

  return (
    <>
      <SEOHead
        title={seoData.volumeConverter.title}
        description={seoData.volumeConverter.description}
        canonical="https://calculatorhub.site/volume-converter"
        schemaData={generateCalculatorSchema(
          "Volume Converter",
          seoData.volumeConverter.description,
          "/volume-converter",
          seoData.volumeConverter.keywords
        )}
        breadcrumbs={[
          { name: 'Unit Converters', url: '/category/unit-converters' },
          { name: 'Volume Converter', url: '/volume-converter' }
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Volume Converter', url: '/volume-converter' }
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Volume Converter</h1>
          <p className="text-slate-300">
            Convert between different units of volume — liters, gallons, cubic meters, and more.
          </p>
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
                    <Zap className="h-4 w-4 text-blue-600" />
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

        <RelatedCalculators
          currentPath="/volume-converter"
          category="unit-converters"
        />
      </div>
    </>
  );
};

export default VolumeConverter;
