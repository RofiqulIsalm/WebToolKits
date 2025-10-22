import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { Scale } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

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
    <>
      <SEOHead
        title={seoData.weightConverter.title}
        description={seoData.weightConverter.description}
        canonical="https://calculatorhub.site/weight-converter"
        schemaData={generateCalculatorSchema(
          "Weight Converter",
          seoData.weightConverter.description,
          "/weight-converter",
          seoData.weightConverter.keywords
        )}
        breadcrumbs={[
          { name: 'Unit Converters', url: '/category/unit-converters' },
          { name: 'Weight Converter', url: '/weight-converter' }
        ]}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      

    <div className="max-w-4xl mx-auto">
      <Breadcrumbs items={[
        { name: 'Unit Converters', url: '/category/unit-converters' },
        { name: 'Weight Converter', url: '/weight-converter' }
      ]} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Weight Converter</h1>
        <p className="text-slate-300">Convert between different units of weight and mass</p>
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
      
      <RelatedCalculators 
        currentPath="/weight-converter" 
        category="unit-converters" 
      />
    </div>
    </>
  );
};

export default WeightConverter;