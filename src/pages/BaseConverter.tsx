import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const BaseConverterCalc: React.FC = () => {
  const [input, setInput] = useState<string>('42');
  const [fromBase, setFromBase] = useState<number>(10);
  const [toBase, setToBase] = useState<number>(2);
  const [result, setResult] = useState<string>('');
  const [autoDetected, setAutoDetected] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const detectBase = (value: string): number => {
    if (/^[01]+$/.test(value)) return 2;
    if (/^[0-7]+$/.test(value)) return 8;
    if (/^\d+$/.test(value)) return 10;
    if (/^[0-9A-Fa-f]+$/.test(value)) return 16;
    return 10;
  };

  const convert = () => {
    try {
      const detectedBase = detectBase(input);
      setAutoDetected(`Auto-detected: Base ${detectedBase}`);

      const decimal = parseInt(input, fromBase);
      if (isNaN(decimal)) {
        setResult('Invalid input');
        return;
      }

      const converted = decimal.toString(toBase).toUpperCase();
      setResult(converted);
    } catch (error) {
      setResult('Conversion error');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const commonBases = [
    { value: 2, label: 'Binary (2)' },
    { value: 8, label: 'Octal (8)' },
    { value: 10, label: 'Decimal (10)' },
    { value: 16, label: 'Hexadecimal (16)' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Input</h3>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Value</label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="Enter number"
            />
            {autoDetected && (
              <div className="text-xs text-blue-400 mt-1">{autoDetected}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">From Base</label>
            <select
              value={fromBase}
              onChange={(e) => setFromBase(Number(e.target.value))}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {commonBases.map(base => (
                <option key={base.value} value={base.value}>{base.label}</option>
              ))}
              {Array.from({ length: 33 }, (_, i) => i + 4).filter(n => ![2, 8, 10, 16].includes(n)).map(n => (
                <option key={n} value={n}>Base {n}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">To Base</label>
            <select
              value={toBase}
              onChange={(e) => setToBase(Number(e.target.value))}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {commonBases.map(base => (
                <option key={base.value} value={base.value}>{base.label}</option>
              ))}
              {Array.from({ length: 33 }, (_, i) => i + 4).filter(n => ![2, 8, 10, 16].includes(n)).map(n => (
                <option key={n} value={n}>Base {n}</option>
              ))}
            </select>
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

          {result && (
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-500/30">
                <div className="text-sm text-slate-400 mb-2">Converted to Base {toBase}</div>
                <div className="text-3xl font-bold text-white font-mono break-all">{result}</div>
              </div>

              <button
                onClick={copyToClipboard}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Copied!' : 'Copy Result'}</span>
              </button>

              <div className="p-4 bg-slate-800 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Binary (Base 2):</span>
                  <code className="text-white">{parseInt(input, fromBase).toString(2)}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Octal (Base 8):</span>
                  <code className="text-white">{parseInt(input, fromBase).toString(8)}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Decimal (Base 10):</span>
                  <code className="text-white">{parseInt(input, fromBase).toString(10)}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hex (Base 16):</span>
                  <code className="text-white">{parseInt(input, fromBase).toString(16).toUpperCase()}</code>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BaseConverterCalc;
