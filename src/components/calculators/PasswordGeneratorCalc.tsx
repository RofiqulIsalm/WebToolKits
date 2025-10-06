import React, { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, Clock } from 'lucide-react';

const PasswordGeneratorCalc: React.FC = () => {
  const [length, setLength] = useState<number>(16);
  const [count, setCount] = useState<number>(1);
  const [includeUpper, setIncludeUpper] = useState<boolean>(true);
  const [includeLower, setIncludeLower] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [customText, setCustomText] = useState<string>('');
  const [passwords, setPasswords] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generatePassword = (useCustom: boolean = false) => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (useCustom && customText) {
      const generated: string[] = [];
      for (let i = 0; i < count; i++) {
        let password = customText;
        for (let j = 0; j < Math.max(0, length - customText.length); j++) {
          const chars = (includeUpper ? upper : '') + (includeLower ? lower : '') +
                       (includeNumbers ? numbers : '') + (includeSymbols ? symbols : '');
          password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        generated.push(password.slice(0, length));
      }
      setPasswords(generated);
      setHistory(prev => [...generated.slice(0, 5), ...prev].slice(0, 10));
      return;
    }

    let charset = '';
    if (includeUpper) charset += upper;
    if (includeLower) charset += lower;
    if (includeNumbers) charset += numbers;
    if (includeSymbols) charset += symbols;

    if (!charset) charset = lower;

    const generated: string[] = [];
    for (let i = 0; i < count; i++) {
      let password = '';
      for (let j = 0; j < length; j++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      generated.push(password);
    }
    setPasswords(generated);
    setHistory(prev => [...generated.slice(0, 5), ...prev].slice(0, 10));
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Settings</h3>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Password Length: {length}
            </label>
            <input
              type="range"
              min={4}
              max={64}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Number of Passwords: {count}
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-white cursor-pointer">
              <input
                type="checkbox"
                checked={includeUpper}
                onChange={(e) => setIncludeUpper(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Uppercase (A-Z)</span>
            </label>
            <label className="flex items-center space-x-2 text-white cursor-pointer">
              <input
                type="checkbox"
                checked={includeLower}
                onChange={(e) => setIncludeLower(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Lowercase (a-z)</span>
            </label>
            <label className="flex items-center space-x-2 text-white cursor-pointer">
              <input
                type="checkbox"
                checked={includeNumbers}
                onChange={(e) => setIncludeNumbers(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Numbers (0-9)</span>
            </label>
            <label className="flex items-center space-x-2 text-white cursor-pointer">
              <input
                type="checkbox"
                checked={includeSymbols}
                onChange={(e) => setIncludeSymbols(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Symbols (!@#$%...)</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Custom Text Base (Optional)
            </label>
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., MyApp2024"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => generatePassword(false)}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Generate</span>
            </button>
            {customText && (
              <button
                onClick={() => generatePassword(true)}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>With Custom</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Generated Passwords</h3>
          {passwords.length > 0 ? (
            <div className="space-y-2">
              {passwords.map((password, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
                >
                  <code className="text-slate-200 font-mono text-sm flex-1 break-all">{password}</code>
                  <button
                    onClick={() => copyToClipboard(password, index)}
                    className="ml-3 p-2 hover:bg-slate-600 rounded transition-colors"
                  >
                    {copiedIndex === index ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              Click generate to create passwords
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-white mb-2 flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Recent History</span>
              </h4>
              <div className="space-y-1">
                {history.slice(0, 5).map((password, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-slate-800 rounded text-xs"
                  >
                    <code className="text-slate-300 font-mono flex-1 truncate">{password}</code>
                    <button
                      onClick={() => copyToClipboard(password, 100 + index)}
                      className="ml-2 p-1 hover:bg-slate-700 rounded transition-colors"
                    >
                      {copiedIndex === 100 + index ? (
                        <Check className="h-3 w-3 text-green-400" />
                      ) : (
                        <Copy className="h-3 w-3 text-slate-400" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordGeneratorCalc;
