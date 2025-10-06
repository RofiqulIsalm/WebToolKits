import React, { useState } from 'react';
import { Copy, Check, Dices } from 'lucide-react';

const RandomNumberGeneratorCalc: React.FC = () => {
  const [min, setMin] = useState<number>(1);
  const [max, setMax] = useState<number>(100);
  const [count, setCount] = useState<number>(1);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const playSound = () => {
    if (!soundEnabled) return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const generateNumbers = () => {
    setIsRolling(true);
    playSound();

    let iterations = 0;
    const interval = setInterval(() => {
      const temp: number[] = [];
      for (let i = 0; i < count; i++) {
        temp.push(Math.floor(Math.random() * (max - min + 1)) + min);
      }
      setNumbers(temp);
      iterations++;

      if (iterations >= 10) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 50);
  };

  const getStatistics = () => {
    if (numbers.length === 0) return null;
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const sorted = [...numbers].sort((a, b) => a - b);
    return {
      mean: mean.toFixed(2),
      min: Math.min(...numbers),
      max: Math.max(...numbers),
      sum: numbers.reduce((a, b) => a + b, 0)
    };
  };

  const copyResults = () => {
    navigator.clipboard.writeText(numbers.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = getStatistics();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Settings</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Minimum
              </label>
              <input
                type="number"
                value={min}
                onChange={(e) => setMin(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Maximum
              </label>
              <input
                type="number"
                value={max}
                onChange={(e) => setMax(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              How Many Numbers: {count}
            </label>
            <input
              type="range"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <label className="flex items-center space-x-2 text-white cursor-pointer">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Sound Effects</span>
          </label>

          <button
            onClick={generateNumbers}
            disabled={isRolling}
            className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
              isRolling
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Dices className={`h-5 w-5 ${isRolling ? 'animate-spin' : ''}`} />
            <span>{isRolling ? 'Rolling...' : 'Generate Numbers'}</span>
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Results</h3>

          {numbers.length > 0 ? (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {numbers.map((num, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl font-bold text-2xl shadow-lg ${
                      isRolling ? 'animate-pulse' : ''
                    }`}
                  >
                    {num}
                  </div>
                ))}
              </div>

              <button
                onClick={copyResults}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy Results</span>
                  </>
                )}
              </button>

              {stats && numbers.length > 1 && (
                <div className="p-4 bg-slate-800 rounded-lg space-y-2">
                  <h4 className="font-semibold text-white mb-2">Statistics</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-2 bg-slate-700 rounded">
                      <div className="text-slate-400">Mean</div>
                      <div className="text-white font-semibold">{stats.mean}</div>
                    </div>
                    <div className="p-2 bg-slate-700 rounded">
                      <div className="text-slate-400">Sum</div>
                      <div className="text-white font-semibold">{stats.sum}</div>
                    </div>
                    <div className="p-2 bg-slate-700 rounded">
                      <div className="text-slate-400">Min</div>
                      <div className="text-white font-semibold">{stats.min}</div>
                    </div>
                    <div className="p-2 bg-slate-700 rounded">
                      <div className="text-slate-400">Max</div>
                      <div className="text-white font-semibold">{stats.max}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Dices className="h-16 w-16 mb-4" />
              <p>Click generate to roll the dice!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RandomNumberGeneratorCalc;
