import React, { useMemo, useState } from 'react';
import { Ruler } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

// ---------- Units (stable identity) ----------
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
  { key: 'mile',        name: 'Mile (mi)',          factor: 1609.344 }, // exact (international)
];

const POPULAR_KEYS = ['meter', 'kilometer', 'centimeter', 'millimeter', 'inch', 'foot', 'yard', 'mile'];
const FORMAT_MODES = ['normal', 'compact', 'scientific'];

// Locale-aware formatting with three modes and trailing-zero trim
function formatNumber(n, mode = 'normal') {
  if (!Number.isFinite(n)) return '—';

  const abs = Math.abs(n);
  // Auto scientific for extreme magnitudes in "normal"
  if (mode === 'scientific' || (mode === 'normal' && (abs >= 1e12 || (abs !== 0 && abs < 1e-6)))) {
    return n.toExponential(6).replace(/(?:\.?0+)(e[+-]?\d+)$/i, '$1');
  }

  const opts =
    mode === 'compact'
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
      className={[
        "px-3 py-1.5 rounded-full border text-sm transition",
        active ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function LengthConverter() {
  // Show placeholder, but treat empty as 0 for calculations
  const [valueStr, setValueStr] = useState('');          // empty -> placeholder visible
  const [fromUnit, setFromUnit] = useState('meter');
  const [formatMode, setFormatMode] = useState('normal');

  // Parse number safely (allow commas). Empty or invalid -> 0 (default value)
  const valueNum = useMemo(() => {
    const cleaned = String(valueStr).trim().replace(/,/g, '');
    if (cleaned === '') return 0;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }, [valueStr]);

  const fromUnitObj = useMemo(
    () => LENGTH_UNITS.find(u => u.key === fromUnit),
    [fromUnit]
  );

  // Compute results on-the-fly (no extra state/effect)
  const results = useMemo(() => {
    if (!fromUnitObj) return {};
    const valueInMeters = valueNum * fromUnitObj.factor;
    const out = {};
    LENGTH_UNITS.forEach(u => {
      if (u.key !== fromUnit) out[u.key] = valueInMeters / u.factor;
    });
    return out;
  }, [valueNum, fromUnitObj, fromUnit]);

  // UI helpers
  const hasInput = valueStr.trim() !== '';
  const placeholder = "Enter value (default 0)";

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
          { name: 'Length Converter', url: '/length-converter' }
        ]}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Length Converter', url: '/length-converter' }
          ]}
        />

        <div className="mb-8 rounded-2xl p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
          <h1 className="text-3xl font-bold text-white mb-2">Length Converter</h1>
          <p className="text-blue-50">
            Convert between different units of length and distance. Leave the field empty to use the default value <b>0</b>.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={valueStr}
                  onChange={(e) => setValueStr(e.target.value)}
                  className="w-full pr-20 pl-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={placeholder}
                  aria-label="Enter the numeric value to convert"
                />
                {/* Right-side quick actions */}
                <div className="absolute inset-y-0 right-1 flex items-center gap-1">
                  {hasInput && (
                    <button
                      type="button"
                      onClick={() => setValueStr('')}
                      className="px-2 py-1 text-xs rounded-lg border bg-white hover:bg-gray-50"
                      aria-label="Clear value"
                      title="Clear"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setValueStr('0')}
                    className="px-2 py-1 text-xs rounded-lg border bg-white hover:bg-gray-50"
                    aria-label="Set to zero"
                    title="Set to 0"
                  >
                    0
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Empty counts as <b>0</b>. Commas are allowed (e.g., <code>1,234.56</code>).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Unit</label>
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Select the source unit"
              >
                {LENGTH_UNITS.map((unit) => (
                  <option key={unit.key} value={unit.key}>
                    {unit.name}
                  </option>
                ))}
              </select>
              {/* Quick unit chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                {POPULAR_KEYS.map(k => {
                  const u = LENGTH_UNITS.find(x => x.key === k);
                  if (!u) return null;
                  return (
                    <Chip
                      key={k}
                      active={fromUnit === k}
                      onClick={() => setFromUnit(k)}
                    >
                      {u.name.split(' ')[0]} {/* short label e.g., Meter */}
                    </Chip>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
              <select
                value={formatMode}
                onChange={(e) => setFormatMode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Select formatting mode"
              >
                <option value="normal">Normal</option>
                <option value="compact">Compact (1.2K, 3.4M)</option>
                <option value="scientific">Scientific (1.23e+9)</option>
              </select>

              {/* Small help */}
              <div className="text-xs text-gray-500 mt-2 space-y-1">
                <p><b>Normal</b> auto-switches to scientific for very large/small numbers.</p>
                <p><b>Copy</b> buttons copy the full precise value.</p>
              </div>
            </div>
          </div>

          <hr className="my-4" />

          {/* Results grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {LENGTH_UNITS.map((unit) => {
              if (unit.key === fromUnit) return null;
              const val = results[unit.key];
              const display = val === undefined ? '0' : formatNumber(val, formatMode);

              return (
                <div
                  key={unit.key}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:bg-gray-100 transition shadow-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <Ruler className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {unit.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="text-xs px-2 py-1 border rounded-md bg-white hover:bg-gray-50"
                      onClick={() => {
                        if (navigator.clipboard && Number.isFinite(val)) {
                          navigator.clipboard.writeText(String(val));
                        }
                      }}
                      aria-label={`Copy ${val} in ${unit.name}`}
                      title="Copy exact value"
                    >
                      Copy
                    </button>
                  </div>

                  {/* Non-overlapping: allow horizontal scroll for very long numbers */}
                  <div
                    className="text-lg font-semibold text-gray-900 overflow-x-auto whitespace-nowrap"
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

        <RelatedCalculators
          currentPath="/length-converter"
          category="unit-converters"
        />
      </div>
    </>
  );
}

export default LengthConverter;
