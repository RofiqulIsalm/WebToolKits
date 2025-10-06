import React, { useState } from 'react';
import { Copy, Check, Play } from 'lucide-react';

const RomanNumberGeneratorCalc: React.FC = () => {
  const [number, setNumber] = useState<string>('2024');
  const [roman, setRoman] = useState<string>('');
  const [mode, setMode] = useState<'convert' | 'quiz'>('convert');
  const [quizNumber, setQuizNumber] = useState<number>(0);
  const [quizAnswer, setQuizAnswer] = useState<string>('');
  const [quizResult, setQuizResult] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const toRoman = (num: number): string => {
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

  const fromRoman = (roman: string): number => {
    const romanValues: { [key: string]: number } = {
      'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000
    };
    let total = 0, prevValue = 0;
    for (let i = roman.length - 1; i >= 0; i--) {
      const currentValue = romanValues[roman[i]];
      if (currentValue === undefined) return -1;
      if (currentValue < prevValue) total -= currentValue;
      else total += currentValue;
      prevValue = currentValue;
    }
    return total;
  };

  const convert = () => {
    const num = parseInt(number);
    if (!isNaN(num)) {
      setRoman(toRoman(num));
    } else {
      const result = fromRoman(number.toUpperCase());
      setRoman(result > 0 ? result.toString() : 'Invalid');
    }
  };

  const startQuiz = () => {
    const randomNum = Math.floor(Math.random() * 3999) + 1;
    setQuizNumber(randomNum);
    setQuizAnswer('');
    setQuizResult('');
  };

  const checkQuiz = () => {
    const correctAnswer = toRoman(quizNumber);
    if (quizAnswer.toUpperCase() === correctAnswer) {
      setQuizResult('✅ Correct!');
    } else {
      setQuizResult(`❌ Wrong! Correct answer: ${correctAnswer}`);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roman);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setMode('convert')}
          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
            mode === 'convert' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Convert
        </button>
        <button
          onClick={() => { setMode('quiz'); startQuiz(); }}
          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
            mode === 'quiz' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Quiz Mode
        </button>
      </div>

      {mode === 'convert' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Input</h3>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Number or Roman Numeral
              </label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2024 or MMXXIV"
              />
            </div>
            <button
              onClick={convert}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Convert
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Result</h3>
            {roman && (
              <div className="p-6 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-500/30">
                <div className="text-sm text-slate-400 mb-2">Converted</div>
                <div className="text-3xl font-bold text-white font-serif mb-4">{roman}</div>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-6 bg-slate-800 rounded-xl text-center">
            <h3 className="text-xl font-semibold text-white mb-4">Convert this number to Roman:</h3>
            <div className="text-5xl font-bold text-blue-400 mb-6">{quizNumber}</div>
            <input
              type="text"
              value={quizAnswer}
              onChange={(e) => setQuizAnswer(e.target.value)}
              className="w-full max-w-md mx-auto px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl font-serif uppercase"
              placeholder="Type roman numeral"
            />
            <div className="flex space-x-3 mt-4 justify-center">
              <button
                onClick={checkQuiz}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Check Answer
              </button>
              <button
                onClick={startQuiz}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Play className="h-4 w-4" />
                <span>New Question</span>
              </button>
            </div>
            {quizResult && (
              <div className={`mt-4 text-xl font-semibold ${quizResult.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
                {quizResult}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RomanNumberGeneratorCalc;
