import React, { useState } from 'react';
import { Sparkles, Clipboard, Shuffle } from 'lucide-react';
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
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizQuestion, setQuizQuestion] = useState<{num: number, roman: string} | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<string>('');

  const convertToRoman = (num: number): string => {
    if (num < 1 || num > 3999) return '';
    const values = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
    const numerals = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
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
    const romanValues: { [key: string]: number } = {'I':1,'V':5,'X':10,'L':50,'C':100,'D':500,'M':1000};
    let total = 0;
    let prevValue = 0;
    for (let i = roman.length - 1; i >= 0; i--) {
      const currentValue = romanValues[roman[i]];
      if (currentValue === undefined) return -1;
      if (currentValue < prevValue) total -= currentValue;
      else total += currentValue;
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
    setRomanInput(roman); // bidirectional update
  };

  const handleRomanConversion = (value: string) => {
    const upperValue = value.toUpperCase();
    setRomanInput(upperValue);
    setError('');
    if (upperValue === '') {
      setRomanToNumber('');
      setNumberToRoman('');
      return;
    }
    const validPattern = /^[IVXLCDM]+$/;
    if (!validPattern.test(upperValue)) {
      setError('Invalid Roman numeral format. Use only I, V, X, L, C, D, M');
      setRomanToNumber('');
      setNumberToRoman('');
      return;
    }
    const number = convertToNumber(upperValue);
    if (number === -1 || number < 1 || number > 3999) {
      setError('Invalid Roman numeral');
      setRomanToNumber('');
      setNumberToRoman('');
      return;
    }
    setRomanToNumber(number.toString());
    setNumberInput(number.toString()); // bidirectional update
    setNumberToRoman(upperValue);
  };

  // Copy to Clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Copied: ${text}`);
  };

  // Swap bidirectional conversion
  const swapConversion = () => {
    const tempNumber = numberInput;
    const tempRoman = romanInput;
    setNumberInput(tempRoman || '');
    setRomanInput(tempNumber || '');
    handleNumberConversion(tempRoman || '');
    handleRomanConversion(tempNumber || '');
  };

  // Quiz Game
  const generateQuiz = () => {
    const num = Math.floor(Math.random() * 3999) + 1;
    const roman = convertToRoman(num);
    setQuizQuestion({num, roman});
    setQuizAnswer('');
  };

  const checkQuiz = () => {
    if (!quizQuestion) return;
    if (quizAnswer.toUpperCase() === quizQuestion.roman) {
      alert('Correct! 🎉');
      setQuizScore(prev => prev + 1);
    } else {
      alert(`Wrong! Correct answer: ${quizQuestion.roman}`);
    }
    generateQuiz();
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

          <button
            onClick={swapConversion}
            className="mb-6 px-4 py-2 bg-purple-700 text-white rounded-lg flex items-center space-x-2 hover:bg-purple-600"
          >
            <Shuffle className="w-5 h-5" /> <span>Swap Conversion</span>
          </button>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Number to Roman */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Number to Roman</h3>
              <input
                type="number"
                value={numberInput}
                onChange={(e) => handleNumberConversion(e.target.value)}
                min={1} max={3999}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                placeholder="Enter a number"
              />
              {numberToRoman && (
                <div className="p-6 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-500/30 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Roman Numeral</p>
                    <p className="text-4xl font-bold text-white font-serif">{numberToRoman}</p>
                  </div>
                  <button onClick={() => copyToClipboard(numberToRoman)} className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600">
                    <Clipboard className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Roman to Number */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Roman to Number</h3>
              <input
                type="text"
                value={romanInput}
                onChange={(e) => handleRomanConversion(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg uppercase font-serif"
                placeholder="Enter Roman numerals"
              />
              {romanToNumber && (
                <div className="p-6 bg-gradient-to-br from-green-900/30 to-teal-900/30 rounded-xl border border-green-500/30 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Number</p>
                    <p className="text-4xl font-bold text-white">{romanToNumber}</p>
                  </div>
                  <button onClick={() => copyToClipboard(romanToNumber)} className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600">
                    <Clipboard className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quiz Game */}
          <div className="mt-8 p-6 bg-slate-800/50 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-4">Roman Numeral Quiz Game 🎯</h3>
            <p className="text-slate-300 mb-2">Score: {quizScore}</p>
            {quizQuestion ? (
              <div className="space-y-4">
                <p className="text-white">Convert Number <strong>{quizQuestion.num}</strong> to Roman Numeral:</p>
                <input
                  type="text"
                  value={quizAnswer}
                  onChange={(e) => setQuizAnswer(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg uppercase font-serif"
                />
                <button onClick={checkQuiz} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">Check Answer</button>
              </div>
            ) : (
              <button onClick={generateQuiz} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">Start Quiz</button>
            )}
          </div>
        </div>

        <AdBanner />
        <RelatedCalculators currentPath="/roman-numeral-converter" />
      </div>
    </>
  );
};

export default RomanNumeralConverter;
