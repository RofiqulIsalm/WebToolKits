import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const PressureConverter: React.FC = () => {
  const [value, setValue] = useState<number>(1);
  const [fromUnit, setFromUnit] = useState<string>('pa');
  const [results, setResults] = useState<{ [key: string]: number }>({});

  const units = [
    { key: 'pa', name: 'Pascal (Pa)', factor: 1 },
    { key: 'kpa', name: 'Kilopascal (kPa)', factor: 1000 },
    { key: 'mpa', name: 'Megapascal (MPa)', factor: 1e6 },
    { key: 'bar', name: 'Bar', factor: 100000 },
    { key: 'atm', name: 'Standard Atmosphere (atm)', factor: 101325 },
    { key: 'psi', name: 'Pound per Square Inch (psi)', factor: 6894.757 },
    { key: 'torr', name: 'Torr (mmHg)', factor: 133.322 },
    { key: 'mmh2o', name: 'Millimeters of Water (mmH₂O)', factor: 9.80665 },
  ];

  useEffect(() => {
    convertPressure();
  }, [value, fromUnit]);

  const convertPressure = () => {
    const fromUnitData = units.find(u => u.key === fromUnit);
    if (!fromUnitData) return;

    const valueInPa = value * fromUnitData.factor;
    const newResults: { [key: string]: number } = {};

    units.forEach(unit => {
      if (unit.key !== fromUnit) {
        newResults[unit.key] = valueInPa / unit.factor;
      }
    });

    setResults(newResults);
  };

  return (
    <>
      <SEOHead
        title={seoData.pressureConverter.title}
        description={seoData.pressureConverter.description}
        canonical="https://calculatorhub.com/pressure-converter"
        schemaData={generateCalculatorSchema(
          "Pressure Converter",
          seoData.pressureConverter.description,
          "/pressure-converter",
          seoData.pressureConverter.keywords
        )}
        breadcrumbs={[
          { name: 'Unit Converters', url: '/category/unit-converters' },
          { name: 'Pressure Converter', url: '/pressure-converter' }
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Pressure Converter', url: '/pressure-converter' }
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Pressure Converter</h1>
          <p className="text-slate-300">
            Convert between different pressure units — Pascal, Bar, PSI, Torr, and Atmosphere.
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
          currentPath="/pressure-converter"
          category="unit-converters"
        />
      </div>
    </>
  );
};

export default PressureConverter;
