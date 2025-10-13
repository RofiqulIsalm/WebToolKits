import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const DataStorageConverter: React.FC = () => {
  const [value, setValue] = useState<number>(1);
  const [fromUnit, setFromUnit] = useState<string>('byte');
  const [results, setResults] = useState<{ [key: string]: number }>({});

  const units = [
    { key: 'bit', name: 'Bit (b)', factor: 1 / 8 },
    { key: 'byte', name: 'Byte (B)', factor: 1 },
    { key: 'kb', name: 'Kilobyte (KB)', factor: 1024 },
    { key: 'mb', name: 'Megabyte (MB)', factor: 1024 ** 2 },
    { key: 'gb', name: 'Gigabyte (GB)', factor: 1024 ** 3 },
    { key: 'tb', name: 'Terabyte (TB)', factor: 1024 ** 4 },
    { key: 'pb', name: 'Petabyte (PB)', factor: 1024 ** 5 },
    { key: 'eb', name: 'Exabyte (EB)', factor: 1024 ** 6 },
  ];

  useEffect(() => {
    convertStorage();
  }, [value, fromUnit]);

  const convertStorage = () => {
    const fromUnitData = units.find(u => u.key === fromUnit);
    if (!fromUnitData) return;

    const valueInBytes = value * fromUnitData.factor;
    const newResults: { [key: string]: number } = {};

    units.forEach(unit => {
      if (unit.key !== fromUnit) {
        newResults[unit.key] = valueInBytes / unit.factor;
      }
    });

    setResults(newResults);
  };

  return (
    <>
      <SEOHead
        title={seoData.dataStorageConverter.title}
        description={seoData.dataStorageConverter.description}
        canonical="https://calculatorhub.site/data-storage-converter"
        schemaData={generateCalculatorSchema(
          "Data Storage Converter",
          seoData.dataStorageConverter.description,
          "/data-storage-converter",
          seoData.dataStorageConverter.keywords
        )}
        breadcrumbs={[
          { name: 'Unit Converters', url: '/category/unit-converters' },
          { name: 'Data Storage Converter', url: '/data-storage-converter' }
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Data Storage Converter', url: '/data-storage-converter' }
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Data Storage Converter</h1>
          <p className="text-slate-300">
            Convert between bits, bytes, kilobytes, megabytes, gigabytes, terabytes, and more.
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
          currentPath="/data-storage-converter"
          category="unit-converters"
        />
      </div>
    </>
  );
};

export default DataStorageConverter;
