import React, { useState, useEffect } from 'react';
import { Binary } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

type Base = 2 | 8 | 10 | 16;

const BaseConverter: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>('42');
  const [fromBase, setFromBase] = useState<Base>(10);
  const [results, setResults] = useState({
    binary: '',
    octal: '',
    decimal: '',
    hexadecimal: ''
  });
  const [error, setError] = useState<string>('');

  useEffect(() => {
    convertBase();
  }, [inputValue, fromBase]);

  const isValidInput = (value: string, base: Base): boolean => {
    if (value === '') return false;

    switch (base) {
      case 2:
        return /^[01]+$/.test(value);
      case 8:
        return /^[0-7]+$/.test(value);
      case 10:
        return /^\d+$/.test(value);
      case 16:
        return /^[0-9A-Fa-f]+$/.test(value);
      default:
        return false;
    }
  };

  const convertBase = () => {
    setError('');

    if (inputValue === '') {
      setResults({ binary: '', octal: '', decimal: '', hexadecimal: '' });
      return;
    }

    if (!isValidInput(inputValue, fromBase)) {
      const baseNames = { 2: 'binary', 8: 'octal', 10: 'decimal', 16: 'hexadecimal' };
      setError(`Invalid ${baseNames[fromBase]} input`);
      setResults({ binary: '', octal: '', decimal: '', hexadecimal: '' });
      return;
    }

    try {
      const decimalValue = parseInt(inputValue, fromBase);

      if (isNaN(decimalValue) || decimalValue < 0) {
        setError('Invalid number');
        setResults({ binary: '', octal: '', decimal: '', hexadecimal: '' });
        return;
      }

      setResults({
        binary: decimalValue.toString(2),
        octal: decimalValue.toString(8),
        decimal: decimalValue.toString(10),
        hexadecimal: decimalValue.toString(16).toUpperCase()
      });
    } catch (err) {
      setError('Conversion error');
      setResults({ binary: '', octal: '', decimal: '', hexadecimal: '' });
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value.toUpperCase());
  };

  const getPlaceholder = (): string => {
    switch (fromBase) {
      case 2: return 'Enter binary (e.g., 101010)';
      case 8: return 'Enter octal (e.g., 52)';
      case 10: return 'Enter decimal (e.g., 42)';
      case 16: return 'Enter hexadecimal (e.g., 2A)';
      default: return 'Enter a number';
    }
  };

  return (
    <>
      <SEOHead
        title={seoData.baseConverter?.title || 'Base Converter - Binary, Octal, Decimal, Hexadecimal'}
        description={seoData.baseConverter?.description || 'Convert numbers between binary, octal, decimal, and hexadecimal bases. Fast and accurate number system conversion tool.'}
        canonical="https://calculatorhub.com/base-converter"
        schemaData={generateCalculatorSchema(
          'Base Converter',
          'Convert numbers between different bases',
          '/base-converter',
          ['base converter', 'binary converter', 'hex converter', 'octal converter', 'number system']
        )}
        breadcrumbs={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Base Converter', url: '/base-converter' }
        ]}
      />
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Base Converter', url: '/base-converter' }
        ]} />

        <div className="glow-card rounded-2xl p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Binary className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Base Converter</h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Convert From
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { base: 2 as Base, label: 'Binary', color: 'from-blue-600 to-blue-700' },
                  { base: 8 as Base, label: 'Octal', color: 'from-green-600 to-green-700' },
                  { base: 10 as Base, label: 'Decimal', color: 'from-purple-600 to-purple-700' },
                  { base: 16 as Base, label: 'Hexadecimal', color: 'from-orange-600 to-orange-700' }
                ].map((item) => (
                  <button
                    key={item.base}
                    onClick={() => {
                      setFromBase(item.base);
                      setInputValue('');
                    }}
                    className={`py-3 rounded-lg font-semibold transition-all ${
                      fromBase === item.base
                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Input Number
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg"
                placeholder={getPlaceholder()}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl border border-blue-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-300">Binary (Base 2)</p>
                <span className="text-xs text-slate-500">0-1</span>
              </div>
              <p className="text-2xl font-bold text-white font-mono break-all">
                {results.binary || '-'}
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl border border-green-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-300">Octal (Base 8)</p>
                <span className="text-xs text-slate-500">0-7</span>
              </div>
              <p className="text-2xl font-bold text-white font-mono break-all">
                {results.octal || '-'}
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-xl border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-300">Decimal (Base 10)</p>
                <span className="text-xs text-slate-500">0-9</span>
              </div>
              <p className="text-2xl font-bold text-white font-mono break-all">
                {results.decimal || '-'}
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-orange-900/30 to-orange-800/30 rounded-xl border border-orange-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-300">Hexadecimal (Base 16)</p>
                <span className="text-xs text-slate-500">0-9, A-F</span>
              </div>
              <p className="text-2xl font-bold text-white font-mono break-all">
                {results.hexadecimal || '-'}
              </p>
            </div>
          </div>
        </div>

        <AdBanner />

        <div className="glow-card rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">About Base Converter</h2>
          <div className="space-y-4 text-slate-300">
            <p>
              Convert numbers seamlessly between different number systems. Our base converter supports
              binary, octal, decimal, and hexadecimal conversions with instant results.
            </p>
            <h3 className="text-xl font-semibold text-white mt-6">Number System Guide:</h3>
            <div className="space-y-3">
              <div className="p-4 bg-slate-700 rounded-lg">
                <h4 className="font-semibold text-white mb-1">Binary (Base 2)</h4>
                <p className="text-sm">Uses digits 0-1. Common in computer science and digital electronics.</p>
                <p className="text-xs text-slate-400 mt-1">Example: 101010 = 42 in decimal</p>
              </div>
              <div className="p-4 bg-slate-700 rounded-lg">
                <h4 className="font-semibold text-white mb-1">Octal (Base 8)</h4>
                <p className="text-sm">Uses digits 0-7. Often used in computing for compact binary representation.</p>
                <p className="text-xs text-slate-400 mt-1">Example: 52 = 42 in decimal</p>
              </div>
              <div className="p-4 bg-slate-700 rounded-lg">
                <h4 className="font-semibold text-white mb-1">Decimal (Base 10)</h4>
                <p className="text-sm">Uses digits 0-9. The standard number system used in everyday life.</p>
                <p className="text-xs text-slate-400 mt-1">Example: 42 = 42 in decimal</p>
              </div>
              <div className="p-4 bg-slate-700 rounded-lg">
                <h4 className="font-semibold text-white mb-1">Hexadecimal (Base 16)</h4>
                <p className="text-sm">Uses digits 0-9 and letters A-F. Widely used in programming and color codes.</p>
                <p className="text-xs text-slate-400 mt-1">Example: 2A = 42 in decimal</p>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mt-6">Common Uses:</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Computer programming and debugging</li>
              <li>Digital electronics and circuit design</li>
              <li>Color code conversion (hex to RGB)</li>
              <li>Memory address calculations</li>
              <li>Network IP address conversions</li>
              <li>Educational purposes and math learning</li>
            </ul>
          </div>
        </div>

        <RelatedCalculators currentPath="/base-converter" />
      </div>
    </>
  );
}; 

export default BaseConverter;
