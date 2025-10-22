import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { Link } from "react-router-dom";
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const EnergyConverter: React.FC = () => {
  const [value, setValue] = useState<number>(1);
  const [fromUnit, setFromUnit] = useState<string>('joule');
  const [results, setResults] = useState<{ [key: string]: number }>({});

  const units = [
    { key: 'joule', name: 'Joule (J)', factor: 1 },
    { key: 'kj', name: 'Kilojoule (kJ)', factor: 1000 },
    { key: 'wh', name: 'Watt-hour (Wh)', factor: 3600 },
    { key: 'kwh', name: 'Kilowatt-hour (kWh)', factor: 3.6e6 },
    { key: 'cal', name: 'Calorie (cal)', factor: 4.184 },
    { key: 'kcal', name: 'Kilocalorie (kcal)', factor: 4184 },
    { key: 'btu', name: 'British Thermal Unit (BTU)', factor: 1055.06 },
    { key: 'erg', name: 'Erg', factor: 1e-7 },
    { key: 'ev', name: 'Electronvolt (eV)', factor: 1.602176634e-19 },
  ];

  useEffect(() => {
    convertEnergy();
  }, [value, fromUnit]);

  const convertEnergy = () => {
    const fromUnitData = units.find(u => u.key === fromUnit);
    if (!fromUnitData) return;

    const valueInJoules = value * fromUnitData.factor;
    const newResults: { [key: string]: number } = {};

    units.forEach(unit => {
      if (unit.key !== fromUnit) {
        newResults[unit.key] = valueInJoules / unit.factor;
      }
    });

    setResults(newResults);
  };

  return (
    <>
      <SEOHead
        title={seoData.energyConverter.title}
        description={seoData.energyConverter.description}
        canonical="https://calculatorhub.site/energy-converter"
        schemaData={generateCalculatorSchema(
          "Energy Converter",
          seoData.energyConverter.description,
          "/energy-converter",
          seoData.energyConverter.keywords
        )}
        breadcrumbs={[
          { name: 'Unit Converters', url: '/category/unit-converters' },
          { name: 'Energy Converter', url: '/energy-converter' }
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Energy Converter', url: '/energy-converter' }
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Energy Converter</h1>
          <p className="text-slate-300">
            Convert between different energy units — Joules, Calories, Watt-hours, BTU, and more.
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
          currentPath="/energy-converter"
          category="unit-converters"
        />
      </div>
    </>
  );
};

export default EnergyConverter;
