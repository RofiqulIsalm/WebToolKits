import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, PlayCircle, Smile } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const RomanNumeralConverter: React.FC = () => {
  const [numberInput, setNumberInput] = useState<string>('2025');
  const [romanInput, setRomanInput] = useState<string>('');
  const [arabicInput, setArabicInput] = useState<string>('');
  const [numberToRoman, setNumberToRoman] = useState<string>('');
  const [romanToNumber, setRomanToNumber] = useState<string>('');
  const [arabicToRoman, setArabicToRoman] = useState<string>('');
  const [arabicToNumber, setArabicToNumber] = useState<string>('');
  const [romanToArabic, setRomanToArabic] = useState<string>('');
  const [numberToArabic, setNumberToArabic] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<string>('');
  const [quizMode, setQuizMode] = useState(false);
  const [timer, setTimer] = useState(20);
  const [quizQuestion, setQuizQuestion] = useState<string>('');
  const [quizAnswer, setQuizAnswer] = useState<string>('');
  const [quizFeedback, setQuizFeedback] = useState<string>('');

  // Conversion Logic
  const convertToRoman = (num: number): string => {
    if (num < 1 || num > 3999) return '';
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
    const romanValues: { [key: string]: number } = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let total = 0;
    let prev = 0;
    for (let i = roman.length - 1; i >= 0; i--) {
      const val = romanValues[roman[i]];
      if (!val) return -1;
      total += val < prev ? -val : val;
      prev = val;
    }
    return total;
  };

  const handleNumberConversion = (val: string) => {
    const num = parseInt(val);
    setNumberInput(val);
    if (isNaN(num)) return setNumberToRoman('');
    setNumberToRoman(convertToRoman(num));
    setNumberToArabic(num.toLocaleString('ar-SA'));
  };

  const handleRomanConversion = (val: string) => {
    const upper = val.toUpperCase();
    setRomanInput(upper);
    const num = convertToNumber(upper);
    if (num < 1) return setRomanToNumber('');
    setRomanToNumber(num.toString());
    setRomanToArabic(num.toLocaleString('ar-SA'));
  };

  const handleArabicConversion = (val: string) => {
    setArabicInput(val);
    const num = parseInt(val.replace(/[^\d]/g, ''));
    if (isNaN(num)) return;
    setArabicToNumber(num.toString());
    setArabicToRoman(convertToRoman(num));
  };

  // Copy Feature
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 1500);
  };

  // Quiz Mode
  useEffect(() => {
    if (quizMode) {
      const randomNum = Math.floor(Math.random() * 3999) + 1;
      setQuizQuestion(randomNum.toString());
      setQuizAnswer(convertToRoman(randomNum));
      setTimer(20);
      setQuizFeedback('');
    }
  }, [quizMode]);

  useEffect(() => {
    if (quizMode && timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    } else if (quizMode && timer === 0) {
      setQuizFeedback('😂 You lost!');
      setTimeout(() => setQuizMode(false), 3000);
    }
  }, [timer, quizMode]);

  const checkQuiz = (ans: string) => {
    if (ans.toUpperCase() === quizAnswer) {
      setQuizFeedback('🎉 Correct!');
    } else {
      setQuizFeedback('❌ Wrong Answer!');
    }
    setTimeout(() => setQuizMode(false), 3000);
  };

  return (
    <>
      <SEOHead
        title={seoData.romanNumeralConverter?.title || 'Roman Numeral Converter - Convert Numbers, Arabic, and Roman Numerals'}
        description={seoData.romanNumeralConverter?.description || 'Convert between numbers, Arabic, and Roman numerals instantly. Includes copy and quiz mode!'}
        canonical="https://calculatorhub.site/roman-numeral-converter"
        schemaData={generateCalculatorSchema('Roman Numeral Converter', 'Convert between Number, Arabic, and Roman Numerals', '/roman-numeral-converter', ['roman numerals', 'arabic numbers'])}
        breadcrumbs={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Roman Numeral Converter', url: '/roman-numeral-converter' }
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={[{ name: 'Misc Tools', url: '/category/misc-tools' }, { name: 'Roman Numeral Converter', url: '/roman-numeral-converter' }]} />

        <div className="glow-card rounded-2xl p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Sparkles className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Roman Numeral Converter</h1>
          </div>

          {quizMode ? (
            <div className="text-center space-y-4">
              <h3 className="text-2xl text-white font-bold">Quiz Mode</h3>
              <p className="text-slate-400">Convert this number to Roman:</p>
              <p className="text-4xl font-bold text-white">{quizQuestion}</p>
              <p className="text-lg text-blue-400">Time Left: {timer}s</p>
              <input
                type="text"
                onKeyDown={(e) => e.key === 'Enter' && checkQuiz(e.currentTarget.value)}
                placeholder="Your answer..."
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 text-center uppercase"
              />
              {quizFeedback && <p className="text-2xl font-bold text-yellow-400 animate-bounce">{quizFeedback}</p>}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Number to Roman */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Number to Roman</h3>
                  <input type="number" value={numberInput} onChange={(e) => handleNumberConversion(e.target.value)} className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg" />
                  {numberToRoman && (
                    <div className="mt-3 bg-slate-800 p-3 rounded-lg flex justify-between items-center">
                      <span className="text-white text-2xl font-serif">{numberToRoman}</span>
                      <button onClick={() => handleCopy(numberToRoman, 'numberToRoman')} className="text-blue-400 hover:text-blue-300">
                        <Copy size={20} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Roman to Number */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Roman to Number</h3>
                  <input type="text" value={romanInput} onChange={(e) => handleRomanConversion(e.target.value)} className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg uppercase" />
                  {romanToNumber && (
                    <div className="mt-3 bg-slate-800 p-3 rounded-lg flex justify-between items-center">
                      <span className="text-white text-2xl">{romanToNumber}</span>
                      <button onClick={() => handleCopy(romanToNumber, 'romanToNumber')} className="text-blue-400 hover:text-blue-300">
                        <Copy size={20} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Arabic to Number & Roman */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Arabic to Conversions</h3>
                  <input type="text" value={arabicInput} onChange={(e) => handleArabicConversion(e.target.value)} className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg text-right" dir="rtl" />
                  {arabicToRoman && (
                    <div className="mt-3 bg-slate-800 p-3 rounded-lg flex justify-between items-center">
                      <span className="text-white text-2xl font-serif">{arabicToRoman}</span>
                      <button onClick={() => handleCopy(arabicToRoman, 'arabicToRoman')} className="text-blue-400 hover:text-blue-300">
                        <Copy size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setQuizMode(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-semibold shadow-lg"
                >
                  <PlayCircle size={20} /> Play Quiz Mode
                </button>
              </div>
              {copied && <p className="text-center text-green-400 mt-4">✅ Copied {copied}!</p>}
            </>
          )}
        </div>

        <AdBanner />
        <RelatedCalculators currentPath="/roman-numeral-converter" />
      </div>
    </>
  ); 
};

export default RomanNumeralConverter;
