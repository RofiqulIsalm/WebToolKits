import React, { useState, useEffect } from 'react';
import { Dices, RefreshCw } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

// Sound effects
const diceSoundUrl = 'https://actions.google.com/sounds/v1/board_games/dice_roll.ogg';
const heartbeatSoundUrl = 'https://actions.google.com/sounds/v1/ambiences/heartbeat.ogg';

const RandomNumberGenerator: React.FC = () => {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [count, setCount] = useState(1);
  const [allowDuplicates, setAllowDuplicates] = useState(true);
  const [generatedNumbers, setGeneratedNumbers] = useState<number[]>([]);
  const [rolling, setRolling] = useState(false);
  const [playGame, setPlayGame] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [gameNumbers, setGameNumbers] = useState<number[]>([]);
  const [missingNumber, setMissingNumber] = useState<number | null>(null);
  const [userGuess, setUserGuess] = useState('');
  const [timeLeft, setTimeLeft] = useState(20);
  const [showFail, setShowFail] = useState(false);

  const playSound = (url: string) => {
    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.play();
  };

  const generateNumbers = () => {
    if (min >= max) return alert('Minimum must be less than maximum');
    if (!allowDuplicates && max - min + 1 < count)
      return alert('Not enough unique numbers in range');

    playSound(diceSoundUrl);
    setRolling(true);

    setTimeout(() => {
      const numbers: number[] = [];
      const used = new Set<number>();
      for (let i = 0; i < count; i++) {
        let num;
        do num = Math.floor(Math.random() * (max - min + 1)) + min;
        while (!allowDuplicates && used.has(num));
        used.add(num);
        numbers.push(num);
      }
      setGeneratedNumbers(numbers);
      setRolling(false);
      setPlayGame(true);
    }, 800);
  };

  const startGame = () => {
    const allNums = Array.from({ length: 100 }, (_, i) => i + 1);
    const missing = Math.floor(Math.random() * 100) + 1;
    const shuffled = allNums.filter((n) => n !== missing).sort(() => Math.random() - 0.5);

    setMissingNumber(missing);
    setGameNumbers(shuffled);
    setGameActive(true);
    setTimeLeft(20);
  };

  // Timer
  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameActive) handleWrong();
  }, [timeLeft, gameActive]);

  const handleSubmit = () => {
    if (Number(userGuess) === missingNumber) {
      alert('🎉 Correct! You found the missing number!');
      setGameActive(false);
      setPlayGame(false);
    } else {
      handleWrong();
    }
  };

  const handleWrong = () => {
    playSound(heartbeatSoundUrl);
    setShowFail(true);
    setGameActive(false);
    setTimeout(() => setShowFail(false), 4000);
    setTimeout(() => setPlayGame(false), 4000);
  };

  return (
    <>
      <SEOHead
        title="Random Number Generator - Fun & Game Mode"
        description="Generate random numbers or play a fun missing-number challenge game!"
        canonical="https://calculatorhub.com/random-number-generator"
        schemaData={generateCalculatorSchema(
          'Random Number Generator',
          'Generate random numbers or play a game to find the missing number.',
          '/random-number-generator',
          ['random number', 'fun game', 'find missing number']
        )}
      />

      <div className={`max-w-4xl mx-auto relative transition-all duration-300 ${showFail ? 'animate-shake bg-red-900' : ''}`}>
        {/* Fog overlay */}
        {showFail && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 animate-fadeIn">
            <p className="text-red-500 text-5xl font-extrabold glitch-text">YOU FAILED…</p>
          </div>
        )}

        <Breadcrumbs
          items={[
            { name: 'Misc Tools', url: '/category/misc-tools' },
            { name: 'Random Number Generator', url: '/random-number-generator' },
          ]}
        />

        {/* Main Generator */}
        <div className="glow-card rounded-2xl p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Dices className={`h-8 w-8 ${rolling ? 'animate-spin text-yellow-400' : 'text-blue-400'}`} />
            <h1 className="text-3xl font-bold text-white">Random Number Generator</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Minimum Value</label>
              <input
                type="number"
                value={min}
                onChange={(e) => setMin(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Maximum Value</label>
              <input
                type="number"
                value={max}
                onChange={(e) => setMax(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">How Many Numbers?</label>
              <input
                type="number"
                value={count}
                min={1}
                max={100}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600"
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="duplicates"
                checked={allowDuplicates}
                onChange={(e) => setAllowDuplicates(e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-slate-700 border-slate-600"
              />
              <label htmlFor="duplicates" className="text-sm font-medium text-white">
                Allow Duplicates
              </label>
            </div>
          </div>

          <button
            onClick={generateNumbers}
            disabled={rolling}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 flex items-center justify-center"
          >
            <RefreshCw className={`h-5 w-5 ${rolling ? 'animate-spin' : ''}`} />
            <span className="ml-2">{rolling ? 'Rolling...' : 'Generate Numbers'}</span>
          </button>

          {generatedNumbers.length > 0 && (
            <div className="mt-6 p-6 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-500/30">
              <h3 className="text-lg font-semibold text-white mb-4">Generated Numbers:</h3>
              <div className="flex flex-wrap gap-3">
                {generatedNumbers.map((num, index) => (
                  <div key={index} className="px-4 py-2 bg-slate-700 text-white rounded-lg font-mono text-lg">
                    🎲 {num}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Game Prompt */}
        {playGame && !gameActive && !showFail && (
          <div className="text-center bg-slate-800 p-6 rounded-xl text-white mb-6">
            <p className="mb-4 text-lg">Want to play a game? Find the missing number between 1–100!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600"
            >
              Start Game
            </button>
          </div>
        )}

        {/* Game Section */}
        {gameActive && (
          <div className="bg-slate-900 p-6 rounded-xl mb-6 text-center text-white relative">
            <p className="mb-4 text-lg">Find the missing number! Time left: {timeLeft}s</p>
            <div className="grid grid-cols-10 gap-2 justify-items-center max-h-[300px] overflow-y-auto p-2">
              {gameNumbers.map((num) => (
                <div key={num} className="text-sm bg-slate-700 px-2 py-1 rounded-md">
                  {num}
                </div>
              ))}
            </div>
            <input
              type="number"
              value={userGuess}
              onChange={(e) => setUserGuess(e.target.value)}
              className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-600"
              placeholder="Enter missing number"
            />
            <button
              onClick={handleSubmit}
              className="ml-2 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
            >
              Submit
            </button>
          </div>
        )}

        <AdBanner />
        <h1>hi</h1>
        <RelatedCalculators currentPath="/random-number-generator" />
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-10px); }
          40%, 80% { transform: translateX(10px); }
        }
        .animate-shake { animation: shake 0.6s ease-in-out infinite; }
        .glitch-text {
          animation: glitch 0.8s infinite;
          text-shadow: 2px 2px #ff0000, -2px -2px #00ffea;
        }
        @keyframes glitch {
          0% { transform: skew(0deg); }
          25% { transform: skew(5deg); }
          50% { transform: skew(-5deg); }
          75% { transform: skew(3deg); }
          100% { transform: skew(0deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 1s ease-in-out; }
      `}</style>
    </>
  );
};

export default RandomNumberGenerator;
