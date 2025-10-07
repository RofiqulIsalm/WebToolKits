import React, { useState, useEffect } from 'react';
import { Columns3, ArrowLeftRight, Info } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import RelatedCalculators from '../components/RelatedCalculators';

const RomanNumeralConverter: React.FC = () => {
  const [mode, setMode] = useState<'toRoman' | 'toNumber'>('toRoman');
  const [numberInput, setNumberInput] = useState<string>('2024');
  const [romanInput, setRomanInput] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const romanNumerals = [
    { value: 1000, symbol: 'M' },
    { value: 900, symbol: 'CM' },
    { value: 500, symbol: 'D' },
    { value: 400, symbol: 'CD' },
    { value: 100, symbol: 'C' },
    { value: 90, symbol: 'XC' },
    { value: 50, symbol: 'L' },
    { value: 40, symbol: 'XL' },
    { value: 10, symbol: 'X' },
    { value: 9, symbol: 'IX' },
    { value: 5, symbol: 'V' },
    { value: 4, symbol: 'IV' },
    { value: 1, symbol: 'I' },
  ];

  const numberToRoman = (num: number): string => {
    if (num <= 0 || num > 3999) {
      throw new Error('Number must be between 1 and 3999');
    }

    let result = '';
    let remaining = num;

    for (const { value, symbol } of romanNumerals) {
      while (remaining >= value) {
        result += symbol;
        remaining -= value;
      }
    }

    return result;
  };

  const romanToNumber = (roman: string): number => {
    const romanMap: { [key: string]: number } = {
      I: 1,
      V: 5,
      X: 10,
      L: 50,
      C: 100,
      D: 500,
      M: 1000,
    };

    const upperRoman = roman.toUpperCase();
    let result = 0;

    for (let i = 0; i < upperRoman.length; i++) {
      const current = romanMap[upperRoman[i]];
      const next = romanMap[upperRoman[i + 1]];

      if (!current) {
        throw new Error(`Invalid Roman numeral character: ${upperRoman[i]}`);
      }

      if (next && current < next) {
        result -= current;
      } else {
        result += current;
      }
    }

    return result;
  };

  const validateRomanNumeral = (roman: string): boolean => {
    const pattern = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/i;
    return pattern.test(roman);
  };

  useEffect(() => {
    try {
      setError('');

      if (mode === 'toRoman') {
        if (!numberInput) {
          setResult('');
          return;
        }

        const num = parseInt(numberInput);

        if (isNaN(num)) {
          setError('Please enter a valid number');
          setResult('');
          return;
        }

        if (num < 1 || num > 3999) {
          setError('Number must be between 1 and 3999');
          setResult('');
          return;
        }

        setResult(numberToRoman(num));
      } else {
        if (!romanInput) {
          setResult('');
          return;
        }

        if (!validateRomanNumeral(romanInput)) {
          setError('Invalid Roman numeral format');
          setResult('');
          return;
        }

        setResult(romanToNumber(romanInput).toString());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion error');
      setResult('');
    }
  }, [mode, numberInput, romanInput]);

  const switchMode = () => {
    if (mode === 'toRoman' && result) {
      setRomanInput(result);
      setNumberInput('');
    } else if (mode === 'toNumber' && result) {
      setNumberInput(result);
      setRomanInput('');
    }
    setMode(mode === 'toRoman' ? 'toNumber' : 'toRoman');
  };

  const examples = [
    { number: 1, roman: 'I' },
    { number: 4, roman: 'IV' },
    { number: 9, roman: 'IX' },
    { number: 27, roman: 'XXVII' },
    { number: 49, roman: 'XLIX' },
    { number: 99, roman: 'XCIX' },
    { number: 444, roman: 'CDXLIV' },
    { number: 999, roman: 'CMXCIX' },
    { number: 1984, roman: 'MCMLXXXIV' },
    { number: 2024, roman: 'MMXXIV' },
    { number: 3999, roman: 'MMMCMXCIX' },
  ];

  const handleExampleClick = (example: { number: number; roman: string }) => {
    if (mode === 'toRoman') {
      setNumberInput(example.number.toString());
    } else {
      setRomanInput(example.roman);
    }
  };

  return (
    <>
      <SEOHead
        title="Roman Numeral Converter - Number to Roman & Roman to Number"
        description="Convert between decimal numbers and Roman numerals instantly. Free bidirectional converter supporting numbers 1-3999."
        canonical="https://calculatorhub.com/roman-numeral-converter"
      />

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Columns3 className="h-10 w-10 text-blue-400 drop-shadow-lg" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Roman Numeral Converter
          </h1>
          <p className="text-slate-300">
            Convert between numbers and Roman numerals (1-3999)
          </p>
        </div>

        <div className="glow-card rounded-lg p-6 mb-6">
          <div className="flex items-center justify-center mb-6">
            <button
              onClick={switchMode}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg transition-all duration-300 hover:scale-105"
            >
              <span className="font-medium">
                {mode === 'toRoman' ? 'Number � Roman' : 'Roman � Number'}
              </span>
              <ArrowLeftRight className="h-5 w-5" />
            </button>
          </div>

          {mode === 'toRoman' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Enter Number (1-3999)
                </label>
                <input
                  type="number"
                  min="1"
                  max="3999"
                  value={numberInput}
                  onChange={(e) => setNumberInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter a number..."
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}

              {result && !error && (
                <div className="p-6 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg">
                  <div className="text-sm text-slate-400 mb-1">Roman Numeral</div>
                  <div className="text-3xl font-bold text-white tracking-wider">
                    {result}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Enter Roman Numeral
                </label>
                <input
                  type="text"
                  value={romanInput}
                  onChange={(e) => setRomanInput(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase tracking-wider"
                  placeholder="Enter Roman numeral (e.g., MCMXCIV)..."
                />
                <p className="text-xs text-slate-400 mt-2">
                  Valid characters: I, V, X, L, C, D, M
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}

              {result && !error && (
                <div className="p-6 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg">
                  <div className="text-sm text-slate-400 mb-1">Decimal Number</div>
                  <div className="text-4xl font-bold text-white">
                    {result}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="glow-card rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Info className="h-5 w-5 mr-2 text-blue-400" />
            Quick Examples
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {examples.map((example) => (
              <button
                key={example.number}
                onClick={() => handleExampleClick(example)}
                className="p-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-blue-500/50 rounded-lg transition-all duration-200 text-left"
              >
                <div className="text-lg font-bold text-white">{example.number}</div>
                <div className="text-sm text-blue-300 tracking-wider">{example.roman}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="glow-card rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Roman Numeral Symbols
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { symbol: 'I', value: 1 },
              { symbol: 'V', value: 5 },
              { symbol: 'X', value: 10 },
              { symbol: 'L', value: 50 },
              { symbol: 'C', value: 100 },
              { symbol: 'D', value: 500 },
              { symbol: 'M', value: 1000 },
            ].map((item) => (
              <div
                key={item.symbol}
                className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-center"
              >
                <div className="text-2xl font-bold text-blue-300 mb-1 tracking-wider">
                  {item.symbol}
                </div>
                <div className="text-sm text-slate-400">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glow-card rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Understanding Roman Numerals
          </h2>
          <div className="space-y-4 text-slate-300">
            <div>
              <h3 className="font-semibold text-white mb-2">Basic Rules</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>When a smaller value comes before a larger value, subtract it (e.g., IV = 4, IX = 9)</li>
                <li>When a smaller or equal value comes after a larger value, add it (e.g., VI = 6, XI = 11)</li>
                <li>A symbol can be repeated up to three times to add value (e.g., III = 3, XXX = 30)</li>
                <li>Only I, X, and C can be used as subtractive numerals</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">Subtractive Notation</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                  <span className="text-blue-300 font-bold">IV</span> = 4 (5-1)
                </div>
                <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                  <span className="text-blue-300 font-bold">IX</span> = 9 (10-1)
                </div>
                <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                  <span className="text-blue-300 font-bold">XL</span> = 40 (50-10)
                </div>
                <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                  <span className="text-blue-300 font-bold">XC</span> = 90 (100-10)
                </div>
                <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                  <span className="text-blue-300 font-bold">CD</span> = 400 (500-100)
                </div>
                <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                  <span className="text-blue-300 font-bold">CM</span> = 900 (1000-100)
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">Limitations</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Standard Roman numerals only represent 1 to 3,999</li>
                <li>There is no symbol for zero</li>
                <li>No symbol for negative numbers</li>
                <li>No standard way to represent fractions</li>
              </ul>
            </div>
          </div>
        </div>

        <RelatedCalculators
          currentPath="/roman-numeral-converter"
          category="Math Tools"
        />
      </div>
    </>
  );
};

export default RomanNumeralConverter;
