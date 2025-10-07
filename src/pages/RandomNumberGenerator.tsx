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
        canonical="https://calculatorhub.site/random-number-generator"
        schemaData={generateCalculatorSchema(
          'Random Number Generator',
          'Generate random numbers or play a game to find the missing number.',
          '/random-number-generator',
          ['random number', 'fun game', 'find missing number']
        )}
      />

      <div
        className={`max-w-4xl mx-auto relative transition-all duration-300 ${
          showFail ? 'animate-shake bg-red-900' : ''
        }`}
      >
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
            <Dices
              className={`h-8 w-8 ${
                rolling ? 'animate-spin text-yellow-400' : 'text-blue-400'
              }`}
            />
            <h1 className="text-3xl font-bold text-white">
              Random Number Generator
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Minimum Value
              </label>
              <input
                type="number"
                value={min}
                onChange={(e) => setMin(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Maximum Value
              </label>
              <input
                type="number"
                value={max}
                onChange={(e) => setMax(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                How Many Numbers?
              </label>
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
              <h3 className="text-lg font-semibold text-white mb-4">
                Generated Numbers:
              </h3>
              <div className="flex flex-wrap gap-3">
                {generatedNumbers.map((num, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg font-mono text-lg"
                  >
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
            <p className="mb-4 text-lg">
              Want to play a game? Find the missing number between 1–100!
            </p>
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

        {/* SEO content section */}
        <div className="rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            🧠 About Random Number Generator
          </h2>
          <div className="space-y-4 text-slate-300">
            <p>
              The <strong>Random Number Generator</strong> is a free online tool that instantly
              produces unpredictable numbers within any range you choose. Whether you’re
              organizing a lottery draw, creating quiz questions, testing probability theories,
              or just having fun with friends, this generator helps you add a touch of true
              randomness to your tasks.
            </p>

            <p>
              Unlike typical number pickers, this version combines the accuracy of modern
              algorithms with an interactive <strong>dice-style</strong> animation and sound
              effects, giving every roll an exciting, game-like feeling.
            </p>

            <h3 className="text-2xl font-semibold text-white mt-6">🎮 How to Use the Random Number Generator</h3>
            <ul className="list-disc list-inside space-y-2 ml-4"> 
                 <li><strong>Set your range</strong> – Enter the minimum and maximum values (for example, 1 to 100).</li> 
                 <li><strong>Choose how many numbers to generate</strong> – You can generate one number or multiple at once.</li> 
                 <li><strong>Allow or block duplicates</strong> – Decide whether numbers can repeat within the same draw.</li> 
                 <li><strong>Click “Generate Random Numbers”</strong> – The dice animation rolls, sound plays, and your results appear instantly.</li> 
                 <li><strong>Play the hidden game mode!</strong> After generating, you can activate the challenge to find the missing number within 20 seconds — a fun way to test your focus and memory.</li> 
            </ul>

            <h3 className="text-2xl font-semibold text-white mt-6">⚙️ What Makes This Tool Unique</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>🎲 Interactive Experience: </strong> – The tool visually “rolls” your numbers with animated dice, making randomness feel alive.</li> 
                <li><strong>🔊 Real Sound Effects: </strong> – Subtle dice and ambient sounds enhance the experience.</li> 
                <li><strong>📊 Built-in Statistics: </strong> – It automatically shows mean, minimum, and maximum values of your results.</li> 
                <li><strong>🧩 Game Mode:</strong> – A creative mini-game challenges users to spot a missing number, with dynamic effects like fog, red flashes, and glitch animations for added thrill.</li> 
                <li><strong>🌐 Mobile Friendly:</strong> – Designed with responsive layouts to perform perfectly on phones, tablets, and desktops.</li> 
                <li><strong>🔒 No Login Needed:</strong> – Everything runs locally — no data stored, no tracking, no sign-ups.</li> 
            </ul>

            <h3 className="text-2xl font-semibold text-white mt-6">📈 Why Use a Random Number Generator?</h3> 
            <p>Random numbers are essential for fairness and unpredictability. In daily life and digital systems, they play a key role in:</p> 
            <ul className="list-disc list-inside space-y-2 ml-4"> 
                <li><strong>Games and Raffles: </strong> – Ensuring every player has an equal chance to win.</li> 
                <li><strong>Education: </strong> – Teachers use it for quizzes, random student selection, or probability lessons.</li>
                <li><strong>Programming & Research: </strong> – Developers and data scientists use random numbers in simulations and statistical tests.</li> 
                <li><strong>Decision-Making:</strong> – When you can’t decide, let the generator pick for you!</li> 
            </ul>

            <p>Because this tool works instantly and without server requests, it’s reliable and completely private — your generated numbers never leave your device.</p>

            <h3 className="text-2xl font-semibold text-white mt-6">🌟 Benefits of Using CalculatorHub’s Random Number Generator</h3>

            <ul className="list-disc list-inside space-y-2 ml-4"> 
              <li>Fast, simple, and visually appealing interface.</li> 
              <li>Adjustable range for small or large number sets.</li> 
              <li>Supports educational, professional, and entertainment use.</li> 
              <li>Works on all major browsers and devices.</li> 
              <li>100% free — no ads interrupt your generation process.</li> 
            </ul>

            <p>With its combination of functionality and creativity, this isn’t just another number tool — it’s a<strong> fun interactive experience</strong> that turns randomness into play. Whether you’re calculating probabilities, testing algorithms, or simply challenging yourself in the missing-number game, the CalculatorHub Random Number Generator brings excitement and precision together in one page.</p>

            <AdBanner type="bottom" />

            <section className="space-y-4"> 
              <h2 className="text-3xl md:text-4xl font-bold mb-4">❓ Frequently Asked Questions (<span className="text-yellow-300"> FAQ </span>)</h2> 
              
              <div className="space-y-4 text-lg text-slate-100 leading-relaxed"> 
                  <div> 
                      <div className="bg-slate-800/60 p-4 mb-2 rounded-lg "> 
                          <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q1</span>: What is a Random Number Generator?</h3> 
                          <p> A Random Number Generator (RNG) is a tool that produces numbers with no predictable pattern. It uses algorithms or hardware processes to create unbiased, unpredictable results for games, research, and simulations. </p>
                       </div> 
                      <div className="bg-slate-800/60 p-4 mb-2 rounded-lg"> 
                          <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q2</span>: How does this Random Number Generator work?</h3> 
                          <p> This tool uses a mathematical algorithm to generate random numbers between your selected minimum and maximum range. You can customize how many numbers to generate and whether duplicates are allowed. </p>
                       </div> 
                      <div className="bg-slate-800/60 p-4 mb-2 rounded-lg"> 
                          <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q3</span>: Can I use this tool for lottery or lucky draws?</h3> 
                          <p> Yes, you can use this generator for fun activities like lotteries, raffles, or lucky draws. However, it should not replace official or verified systems for real-money contests. </p>
                       </div> 
                      <div className="bg-slate-800/60 p-4 mb-2 rounded-lg"> 
                          <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q4</span>: Are the generated numbers truly random?</h3> 
                          <p> The numbers are pseudo-random—they appear random but are generated using computational algorithms. For most practical uses (like gaming or simulations), they are effectively random. </p>
                       </div> 
                      <div className="bg-slate-800/60 p-4 mb-2 rounded-lg"> 
                          <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q5</span>: Can I generate multiple numbers at once?</h3> 
                          <p> Yes! Simply enter how many numbers you want in the “How Many Numbers?” box. You can generate up to 100 numbers at a time, instantly displayed with dice-style animations. </p>
                       </div> 
                      <div className="bg-slate-800/60 p-4 mb-2  rounded-lg"> 
                          <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q6</span>: What is the difference between allowing and disallowing duplicates?</h3> 
                          <p> If duplicates are allowed, the same number can appear multiple times. When disabled, each number in the generated list will be unique within your chosen range. </p>
                       </div> 
                      <div className="bg-slate-800/60 p-4 mb-2 rounded-lg"> 
                          <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q7</span>: Is this Random Number Generator free to use?</h3> 
                          <p> Absolutely! This tool is 100% free, easy to use, and works directly from your browser — no login, no downloads, and no data collection required.</p>
                       </div> 
                  </div> 
              </div> 
            </section>

            <p>Enter your range, roll the dice, and see where randomness takes you. Every click produces new numbers, new patterns, and maybe even a new record in your personal game.<strong className="text-yellow-600"> Start generating — and if you fail, don’t worry. The fog will clear, and you can try again!</strong></p>
          </div>

          <AdBanner type="bottom" />
          <p>“Try more tools at CalculatorHub for quick, accurate calculations and fun utilities.”</p>
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
      </div>
    </>
  );
};

export default RandomNumberGenerator;
