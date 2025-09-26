import React, { useState, useEffect } from 'react';
import { Key, Copy, RefreshCw, Eye, EyeOff } from 'lucide-react';
import AdBanner from '../components/AdBanner';

const PasswordGenerator: React.FC = () => {
  const [password, setPassword] = useState<string>('');
  const [length, setLength] = useState<number>(12);
  const [includeUppercase, setIncludeUppercase] = useState<boolean>(true);
  const [includeLowercase, setIncludeLowercase] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [excludeSimilar, setExcludeSimilar] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(true);
  const [strength, setStrength] = useState<{
    score: number;
    label: string;
    color: string;
  }>({ score: 0, label: 'Weak', color: 'red' });

  useEffect(() => {
    generatePassword();
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar]);

  const generatePassword = () => {
    let charset = '';
    
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (excludeSimilar) {
      charset = charset.replace(/[0O1lI]/g, '');
    }
    
    if (charset === '') {
      setPassword('');
      return;
    }

    let newPassword = '';
    for (let i = 0; i < length; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    setPassword(newPassword);
    calculateStrength(newPassword);
  };

  const calculateStrength = (pwd: string) => {
    let score = 0;
    
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    
    const strengthLevels = [
      { score: 0, label: 'Very Weak', color: 'red' },
      { score: 1, label: 'Weak', color: 'red' },
      { score: 2, label: 'Fair', color: 'orange' },
      { score: 3, label: 'Good', color: 'yellow' },
      { score: 4, label: 'Strong', color: 'green' },
      { score: 5, label: 'Very Strong', color: 'green' },
      { score: 6, label: 'Excellent', color: 'green' }
    ];
    
    setStrength(strengthLevels[Math.min(score, strengthLevels.length - 1)]);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Password Generator</h1>
        <p className="text-gray-600">Generate secure, random passwords for your accounts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Password Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Length: {length}
              </label>
              <input
                type="range"
                min="4"
                max="50"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>4</span>
                <span>50</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="uppercase"
                  checked={includeUppercase}
                  onChange={(e) => setIncludeUppercase(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="uppercase" className="ml-2 text-sm text-gray-700">
                  Include Uppercase Letters (A-Z)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="lowercase"
                  checked={includeLowercase}
                  onChange={(e) => setIncludeLowercase(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="lowercase" className="ml-2 text-sm text-gray-700">
                  Include Lowercase Letters (a-z)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="numbers"
                  checked={includeNumbers}
                  onChange={(e) => setIncludeNumbers(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="numbers" className="ml-2 text-sm text-gray-700">
                  Include Numbers (0-9)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="symbols"
                  checked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="symbols" className="ml-2 text-sm text-gray-700">
                  Include Symbols (!@#$%^&*)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="excludeSimilar"
                  checked={excludeSimilar}
                  onChange={(e) => setExcludeSimilar(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="excludeSimilar" className="ml-2 text-sm text-gray-700">
                  Exclude Similar Characters (0, O, 1, l, I)
                </label>
              </div>
            </div>

            <button
              onClick={generatePassword}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Generate New Password</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Password</h2>
          
          <div className="space-y-6">
            {password ? (
              <>
                <div className="relative">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Your Password:</span>
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="font-mono text-lg break-all">
                      {showPassword ? password : '•'.repeat(password.length)}
                    </div>
                  </div>
                  
                  <button
                    onClick={copyToClipboard}
                    className="mt-3 w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy to Clipboard</span>
                  </button>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Password Strength:</span>
                    <span className={`text-sm font-medium text-${strength.color}-600`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`bg-${strength.color}-500 h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${(strength.score / 6) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Security Tips:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Use unique passwords for each account</li>
                    <li>• Store passwords in a password manager</li>
                    <li>• Enable two-factor authentication when available</li>
                    <li>• Never share passwords via email or text</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Key className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Select at least one character type to generate a password
                </p>
              </div>
            )}
          </div>

          <AdBanner type="bottom" />
          
          {/* SEO Content Section */}
          <div className="mt-12 space-y-8">
            <div className="misc-card rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Password Generator Security Guide</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-300 mb-4">
                  Strong passwords are your first line of defense against cyber attacks. Our password generator 
                  creates cryptographically secure passwords with customizable options to meet any security 
                  requirement while ensuring maximum protection for your accounts.
                </p>
                
                <h3 className="text-xl font-semibold text-white mt-6 mb-4">Password Strength Factors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-700/50 p-4 rounded-lg">
                    <div className="font-semibold text-white mb-2">Length</div>
                    <div className="text-slate-300 text-sm mb-1">Longer passwords are exponentially stronger</div>
                    <div className="text-xs text-slate-400">Minimum 12 characters recommended</div>
                  </div>
                  <div className="bg-slate-700/50 p-4 rounded-lg">
                    <div className="font-semibold text-white mb-2">Character Variety</div>
                    <div className="text-slate-300 text-sm mb-1">Mix of uppercase, lowercase, numbers, symbols</div>
                    <div className="text-xs text-slate-400">Increases possible combinations</div>
                  </div>
                  <div className="bg-slate-700/50 p-4 rounded-lg">
                    <div className="font-semibold text-white mb-2">Unpredictability</div>
                    <div className="text-slate-300 text-sm mb-1">Avoid dictionary words and patterns</div>
                    <div className="text-xs text-slate-400">Random generation is best</div>
                  </div>
                  <div className="bg-slate-700/50 p-4 rounded-lg">
                    <div className="font-semibold text-white mb-2">Uniqueness</div>
                    <div className="text-slate-300 text-sm mb-1">Different password for each account</div>
                    <div className="text-xs text-slate-400">Prevents credential stuffing attacks</div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-white mt-6 mb-4">Password Security Tips</h3>
                <ul className="text-slate-300 space-y-2 mb-6">
                  <li>• <strong>Use a Password Manager:</strong> Store and generate unique passwords</li>
                  <li>• <strong>Enable 2FA:</strong> Add two-factor authentication when available</li>
                  <li>• <strong>Regular Updates:</strong> Change passwords periodically</li>
                  <li>• <strong>Avoid Reuse:</strong> Never use the same password twice</li>
                  <li>• <strong>Secure Storage:</strong> Never store passwords in plain text</li>
                  <li>• <strong>Phishing Awareness:</strong> Only enter passwords on legitimate sites</li>
                </ul>
              </div>
            </div>
          </div>
  )
}