import React, { useMemo, useState } from 'react';
import { Ruler } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

// ---------- Units ----------
const LENGTH_UNITS = [
  { key: 'nanometer',   name: 'Nanometer (nm)',     factor: 1e-9 },
  { key: 'micrometer',  name: 'Micrometer (µm)',    factor: 1e-6 },
  { key: 'millimeter',  name: 'Millimeter (mm)',    factor: 1e-3 },
  { key: 'centimeter',  name: 'Centimeter (cm)',    factor: 1e-2 },
  { key: 'meter',       name: 'Meter (m)',          factor: 1 },
  { key: 'kilometer',   name: 'Kilometer (km)',     factor: 1e3 },
  { key: 'inch',        name: 'Inch (in)',          factor: 0.0254 },
  { key: 'foot',        name: 'Foot (ft)',          factor: 0.3048 },
  { key: 'yard',        name: 'Yard (yd)',          factor: 0.9144 },
  { key: 'mile',        name: 'Mile (mi)',          factor: 1609.344 },
]; 

const POPULAR_KEYS = ['meter', 'kilometer', 'centimeter', 'millimeter', 'inch', 'foot', 'yard', 'mile'];
const FORMAT_MODES = ['normal', 'compact', 'scientific'];

// ---------- Helpers ----------
function formatNumber(n, mode = 'normal') {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (mode === 'scientific' || (mode === 'normal' && (abs >= 1e12 || (abs !== 0 && abs < 1e-6))))
    return n.toExponential(6).replace(/(?:\.?0+)(e[+-]?\d+)$/i, '$1');

  const opts = mode === 'compact'
    ? { notation: 'compact', maximumFractionDigits: 3 }
    : { maximumFractionDigits: 8 };

  const s = new Intl.NumberFormat(undefined, opts).format(n);
  return mode === 'compact'
    ? s
    : s.replace(/([.,]\d*?[1-9])0+$/, '$1').replace(/([.,])0+$/, '');
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm transition border ${
        active
          ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
          : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

// ---------- Main ----------
function LengthConverter() {
  const [valueStr, setValueStr] = useState('');
  const [fromUnit, setFromUnit] = useState('meter');
  const [formatMode, setFormatMode] = useState('normal');

  const valueNum = useMemo(() => {
    const clean = valueStr.replace(/,/g, '').trim();
    if (clean === '') return 0;
    const n = Number(clean);
    return Number.isFinite(n) ? n : 0;
  }, [valueStr]);

  const from = LENGTH_UNITS.find(u => u.key === fromUnit);
  const results = useMemo(() => {
    if (!from) return {};
    const base = valueNum * from.factor;
    const out = {};
    LENGTH_UNITS.forEach(u => {
      if (u.key !== fromUnit) out[u.key] = base / u.factor;
    });
    return out;
  }, [valueNum, from, fromUnit]);

  const hasInput = valueStr.trim() !== '';

  return (
    <>
      <SEOHead
        title={seoData.lengthConverter.title}
        description={seoData.lengthConverter.description}
        canonical="https://calculatorhub.site/length-converter"
        schemaData={generateCalculatorSchema(
          'Length Converter',
          seoData.lengthConverter.description,
          '/length-converter',
          seoData.lengthConverter.keywords
        )}
        breadcrumbs={[
          { name: 'Unit Converters', url: '/category/unit-converters' },
          { name: 'Length Converter', url: '/length-converter' },
        ]}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <div className="max-w-5xl mx-auto text-gray-200">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Length Converter', url: '/length-converter' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 rounded-2xl p-6 bg-gradient-to-r from-blue-900 via-indigo-800 to-purple-800 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">Length Converter</h1>
          <p className="text-gray-300">
            Convert between different units of length and distance. Empty input defaults to <b>0</b>.
          </p>
        </div>

        {/* Controls */}
        <div className="rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Value */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Value</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={valueStr}
                  onChange={(e) => setValueStr(e.target.value)}
                  placeholder="Enter value (default 0)"
                  className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                  {hasInput && (
                    <button
                      type="button"
                      onClick={() => setValueStr('')}
                      className="px-2 py-1 text-xs rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setValueStr('0')}
                    className="px-2 py-1 text-xs rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600"
                  >
                    0
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Commas allowed (e.g., 1,234.56). Empty counts as 0.
              </p>
            </div>

            {/* From Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">From Unit</label>
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {LENGTH_UNITS.map((u) => (
                  <option key={u.key} value={u.key}>{u.name}</option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2 mt-3">
                {POPULAR_KEYS.map((k) => {
                  const u = LENGTH_UNITS.find(x => x.key === k);
                  return (
                    <Chip key={k} active={fromUnit === k} onClick={() => setFromUnit(k)}>
                      {u.name.split(' ')[0]}
                    </Chip>
                  );
                })}
              </div>
            </div>

            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Format</label>
              <select
                value={formatMode}
                onChange={(e) => setFormatMode(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="normal">Normal</option>
                <option value="compact">Compact (1.2K, 3.4M)</option>
                <option value="scientific">Scientific (1.23e+9)</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Normal auto-switches to scientific for large/small numbers.
              </p>
            </div>
          </div>

          <hr className="border-gray-700 mb-5" />

          {/* Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {LENGTH_UNITS.map((unit) => {
              if (unit.key === fromUnit) return null;
              const val = results[unit.key];
              const display = formatNumber(val ?? 0, formatMode);

              return (
                <div key={unit.key} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:bg-gray-750 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Ruler className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-medium text-gray-200 truncate">{unit.name}</span>
                    </div>
                    <button
                      type="button"
                      className="text-xs px-2 py-1 border border-gray-600 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200"
                      onClick={() => {
                        if (navigator.clipboard && Number.isFinite(val)) navigator.clipboard.writeText(String(val));
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  <div
                    className="text-lg font-semibold text-gray-100 overflow-x-auto whitespace-nowrap"
                    style={{ scrollbarWidth: 'thin' }}
                    title={String(val ?? '')}
                  >
                    {display}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators currentPath="/length-converter" category="unit-converters" />
      </div>
    </>
  );
}

export default LengthConverter;
