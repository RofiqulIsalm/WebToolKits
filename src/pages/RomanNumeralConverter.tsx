import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const RomanNumeralConverter: React.FC = () => {
  const [numberInput, setNumberInput] = useState<string>('2025');
  const [romanInput, setRomanInput] = useState<string>('');
  const [numberToRoman, setNumberToRoman] = useState<string>('');
  const [romanToNumber, setRomanToNumber] = useState<string>('');
  const [error, setError] = useState<string>('');

  const convertToRoman = (num: number): string => {
    if (num < 1 || num > 3999) {
      return '';
    }

    const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const numerals = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];

    let result = '';
    for (let i = 0; i < values.length; i++) {
      while (num >= values[i]) {
        result += numerals[i];
        num -= values[i];
      }
    }
    return result;
  };

  const convertToNumber = (roman: string): number => {
    const romanValues: { [key: string]: number } = {
      'I': 1, 'V': 5, 'X': 10, 'L': 50,
      'C': 100, 'D': 500, 'M': 1000
    };

    let total = 0;
    let prevValue = 0;

    for (let i = roman.length - 1; i >= 0; i--) {
      const currentValue = romanValues[roman[i]];
      if (currentValue === undefined) {
        return -1;
      }

      if (currentValue < prevValue) {
        total -= currentValue;
      } else {
        total += currentValue;
      }
      prevValue = currentValue;
    }

    return total;
  };

  const handleNumberConversion = (value: string) => {
    setNumberInput(value);
    setError('');

    const num = parseInt(value);
    if (isNaN(num)) {
      setNumberToRoman('');
      return;
    }

    if (num < 1 || num > 3999) {
      setError('Please enter a number between 1 and 3999');
      setNumberToRoman('');
      return;
    }

    const roman = convertToRoman(num);
    setNumberToRoman(roman);
  };

  const handleRomanConversion = (value: string) => {
    const upperValue = value.toUpperCase();
    setRomanInput(upperValue);
    setError('');

    if (upperValue === '') {
      setRomanToNumber('');
      return;
    }

    const validPattern = /^[IVXLCDM]+$/;
    if (!validPattern.test(upperValue)) {
      setError('Invalid Roman numeral format. Use only I, V, X, L, C, D, M');
      setRomanToNumber('');
      return;
    }

    const number = convertToNumber(upperValue);
    if (number === -1 || number < 1 || number > 3999) {
      setError('Invalid Roman numeral');
      setRomanToNumber('');
      return;
    }

    setRomanToNumber(number.toString());
  };

  return (
    <>
      <SEOHead
        title={seoData.romanNumeralConverter?.title || 'Roman Numeral Converter - Convert Numbers to Roman Numerals'}
        description={seoData.romanNumeralConverter?.description || 'Convert between Arabic numbers and Roman numerals instantly. Support for numbers 1-3999 with bidirectional conversion.'}
        canonical="https://calculatorhub.com/roman-numeral-converter"
        schemaData={generateCalculatorSchema(
          'Roman Numeral Converter',
          'Convert between numbers and Roman numerals',
          '/roman-numeral-converter',
          ['roman numerals', 'roman numeral converter', 'arabic to roman', 'roman to arabic']
        )}
        breadcrumbs={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Roman Numeral Converter', url: '/roman-numeral-converter' }
        ]}
      />
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Roman Numeral Converter', url: '/roman-numeral-converter' }
        ]} />

        <div className="glow-card rounded-2xl p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Sparkles className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Roman Numeral Converter</h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Number to Roman</h3>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Enter Number (1-3999)
                </label>
                <input
                  type="number"
                  value={numberInput}
                  onChange={(e) => handleNumberConversion(e.target.value)}
                  min={1}
                  max={3999}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  placeholder="Enter a number"
                />
              </div>
              {numberToRoman && (
                <div className="p-6 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-500/30">
                  <p className="text-sm text-slate-400 mb-2">Roman Numeral</p>
                  <p className="text-4xl font-bold text-white font-serif">{numberToRoman}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Roman to Number</h3>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Enter Roman Numeral
                </label>
                <input
                  type="text"
                  value={romanInput}
                  onChange={(e) => handleRomanConversion(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg uppercase font-serif"
                  placeholder="Enter Roman numerals"
                />
              </div>
              {romanToNumber && (
                <div className="p-6 bg-gradient-to-br from-green-900/30 to-teal-900/30 rounded-xl border border-green-500/30">
                  <p className="text-sm text-slate-400 mb-2">Number</p>
                  <p className="text-4xl font-bold text-white">{romanToNumber}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Roman Numeral Reference</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { roman: 'I', value: 1 },
                { roman: 'V', value: 5 },
                { roman: 'X', value: 10 },
                { roman: 'L', value: 50 },
                { roman: 'C', value: 100 },
                { roman: 'D', value: 500 },
                { roman: 'M', value: 1000 }
              ].map((item) => (
                <div key={item.roman} className="p-3 bg-slate-700 rounded-lg">
                  <p className="text-2xl font-bold text-white font-serif">{item.roman}</p>
                  <p className="text-sm text-slate-400">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <AdBanner />

        <div className="glow-card rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">About Roman Numerals</h2>
          <div className="space-y-4 text-slate-300">
            <p>
              Roman numerals are a numeral system that originated in ancient Rome and remained the usual
              way of writing numbers throughout Europe well into the Late Middle Ages. Today, they're
              still used in various contexts like clock faces, book chapters, and movie sequels.
            </p>
            <h3 className="text-xl font-semibold text-white mt-6">Basic Rules:</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>When a smaller numeral appears before a larger one, subtract it (IV = 4)</li>
              <li>When a smaller numeral appears after a larger one, add it (VI = 6)</li>
              <li>Only I, X, and C can be used as subtractive numerals</li>
              <li>I can be subtracted from V and X only</li>
              <li>X can be subtracted from L and C only</li>
              <li>C can be subtracted from D and M only</li>
            </ul>
            <h3 className="text-xl font-semibold text-white mt-6">Common Examples:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
              {[
                { num: 4, roman: 'IV' },
                { num: 9, roman: 'IX' },
                { num: 40, roman: 'XL' },
                { num: 90, roman: 'XC' },
                { num: 400, roman: 'CD' },
                { num: 900, roman: 'CM' }
              ].map((item) => (
                <div key={item.num} className="p-3 bg-slate-700 rounded-lg text-center">
                  <p className="text-lg font-semibold text-white">{item.num} = {item.roman}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <RelatedCalculators currentPath="/roman-numeral-converter" />
      </div>
    </>
  );
};

export default RomanNumeralConverter;
