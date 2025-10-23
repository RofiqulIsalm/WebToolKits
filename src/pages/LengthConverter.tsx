import React, { useMemo, useState } from 'react';
import { Ruler } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

// --- Units (stable identity) ---
const LENGTH_UNITS = [
  { key: 'nanometer',   name: 'Nanometer (nm)',     factor: 1e-9 },
  { key: 'micrometer',  name: 'Micrometer (µm)',    factor: 1e-6 },
  { key: 'millimeter',  name: 'Millimeter (mm)',    factor: 0.001 },
  { key: 'centimeter',  name: 'Centimeter (cm)',    factor: 0.01 },
  { key: 'meter',       name: 'Meter (m)',          factor: 1 },
  { key: 'kilometer',   name: 'Kilometer (km)',     factor: 1000 },
  { key: 'inch',        name: 'Inch (in)',          factor: 0.0254 },
  { key: 'foot',        name: 'Foot (ft)',          factor: 0.3048 },
  { key: 'yard',        name: 'Yard (yd)',          factor: 0.9144 },
  { key: 'mile',        name: 'Mile (mi)',          factor: 1609.344 }, // exact
];

// Trimmed, locale-aware number formatting
function formatNumber(n) {
  if (!Number.isFinite(n)) return '—';
  const s = new Intl.NumberFormat(undefined, { maximumFractionDigits: 8 }).format(n);
  return s.replace(/([.,]\d*?[1-9])0+$/, '$1').replace(/([.,])0+$/, '');
}

function LengthConverter() {
  const [valueStr, setValueStr] = useState('1');      // keep as string (no NaN flicker)
  const [fromUnit, setFromUnit] = useState('meter');

  const valueNum = useMemo(() => {
    const n = Number(valueStr.replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
  }, [valueStr]);

  const results = useMemo(() => {
    const from = LENGTH_UNITS.find(u => u.key === fromUnit);
    if (!from) return {};
    const valueInMeters = valueNum * from.factor;
    const out = {};
    LENGTH_UNITS.forEach(u => {
      if (u.key !== fromUnit) out[u.key] = valueInMeters / u.factor;
    });
    return out;
  }, [valueNum, fromUnit]);

  return (
    <>
      <SEOHead
        title={seoData.lengthConverter.title}
        description={seoData.lengthConverter.description}
        canonical="https://calculatorhub.site/length-converter"
        schemaData={generateCalculatorSchema(
          "Length Converter",
          seoData.lengthConverter.description,
          "/length-converter",
          seoData.lengthConverter.keywords
        )}
        breadcrumbs={[
          { name: 'Unit Converters', url: '/category/unit-converters' },
          { name: 'Length Converter', url: '/length-converter' }
        ]}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={[
          { name: 'Unit Converters', url: '/category/unit-converters' },
          { name: 'Length Converter', url: '/length-converter' }
        ]} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Length Converter</h1>
          <p className="text-slate-300">Convert between different units of length and distance</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
              <input
                type="text"
                inputMode="decimal"
                value={valueStr}
                onChange={(e) => setValueStr(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter value"
                aria-label="Enter the numeric value to convert"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Unit</label>
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Select the source unit"
              >
                {LENGTH_UNITS.map((unit) => (
                  <option key={unit.key} value={unit.key}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {LENGTH_UNITS.map((unit) => {
              if (unit.key === fromUnit) return null;
              const val = results[unit.key];
              const display = val === undefined ? '0' : formatNumber(val);

              return (
                <div key={unit.key} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Ruler className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">{unit.name}</span>
                    </div>
                    <button
                      type="button"
                      className="text-xs px-2 py-1 border rounded-md"
                      onClick={() => navigator.clipboard && navigator.clipboard.writeText(`${display}`)}
                      aria-label={`Copy ${display} ${unit.name}`}
                      title="Copy"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="text-lg font-semibold text-gray-900 break-all">
                    {display}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <AdBanner type="bottom" />
      </div>
    </>
  );
}

export default LengthConverter;
