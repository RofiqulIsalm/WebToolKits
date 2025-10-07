import React, { useState, useEffect } from "react";

const RomanConverterQuiz: React.FC = () => {
  // Converter states
  const [number, setNumber] = useState<string>("");
  const [romanResult, setRomanResult] = useState<string>("");
  const [arabicResult, setArabicResult] = useState<string>("");

  // Quiz states
  const [quizMode, setQuizMode] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizFeedback, setQuizFeedback] = useState("");
  const [timer, setTimer] = useState(25);
  const [stage, setStage] = useState<"idle" | "countdown" | "playing" | "result">("idle");
  const [countdown, setCountdown] = useState(3);
  const [userInput, setUserInput] = useState("");
  const [clues, setClues] = useState<number[]>([]);
  const [boxColor, setBoxColor] = useState("bg-slate-800 border-slate-700");

  // Roman Conversion Logic
  const romanNumerals: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"],
    [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"],
    [5, "V"], [4, "IV"], [1, "I"],
  ];

  const convertToRoman = (num: number): string => {
    let result = "";
    for (const [value, symbol] of romanNumerals) {
      while (num >= value) {
        result += symbol;
        num -= value;
      }
    }
    return result;
  };

  const convertFromRoman = (roman: string): number => {
    const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let total = 0;
    let prev = 0;
    for (let i = roman.length - 1; i >= 0; i--) {
      const current = map[roman[i]];
      if (current < prev) total -= current;
      else total += current;
      prev = current;
    }
    return total;
  };

  // Input Handlers
  const handleNumberInput = (val: string) => {
    setNumber(val);
    const num = parseInt(val);
    if (!isNaN(num)) {
      setRomanResult(convertToRoman(num));
      setArabicResult(num.toLocaleString("ar-EG"));
    } else {
      setRomanResult("");
      setArabicResult("");
    }
  };

  const handleRomanInput = (val: string) => {
    setRomanResult(val.toUpperCase());
    const num = convertFromRoman(val.toUpperCase());
    setNumber(num.toString());
    setArabicResult(num.toLocaleString("ar-EG"));
  };

  const handleArabicInput = (val: string) => {
    setArabicResult(val);
    const western = Number(val.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString()));
    if (!isNaN(western)) {
      setNumber(western.toString());
      setRomanResult(convertToRoman(western));
    }
  };

  // 🎯 QUIZ SYSTEM
  useEffect(() => {
    if (quizMode) {
      setQuizFeedback("");
      setTimer(25);
      setCountdown(3);
      setStage("countdown");
      setUserInput("");
      setBoxColor("bg-slate-800 border-slate-700");
    }
  }, [quizMode]);

  useEffect(() => {
    if (stage === "countdown" && countdown > 0) {
      const interval = setInterval(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    } else if (stage === "countdown" && countdown === 0) {
      const randomNum = Math.floor(Math.random() * 3999) + 1;
      setQuizQuestion(randomNum.toString());
      setQuizAnswer(convertToRoman(randomNum));
      const newClues = Array.from({ length: 4 }, () => Math.floor(Math.random() * 3999) + 1);
      setClues(newClues);
      setStage("playing");
    }
  }, [stage, countdown]);

  useEffect(() => {
    if (stage === "playing" && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (stage === "playing" && timer === 0) {
      handleResult("timeout");
    }
  }, [stage, timer]);

  const handleResult = (type: "correct" | "wrong" | "timeout") => {
    setStage("result");
    if (type === "correct") {
      setQuizFeedback("🎉 Great Job!");
      setBoxColor("bg-green-700/30 border-green-500");
    } else if (type === "wrong") {
      setQuizFeedback("❌ Wrong Answer!");
      setBoxColor("bg-red-700/30 border-red-500");
    } else {
      setQuizFeedback("⏰ Time’s Up!");
      setBoxColor("bg-yellow-700/30 border-yellow-500");
    }

    setTimeout(() => {
      setStage("idle");
      setQuizMode(false);
    }, 4000);
  };

  const checkQuiz = () => {
    if (userInput.trim().toUpperCase() === quizAnswer) handleResult("correct");
    else handleResult("wrong");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center px-6 py-8">
      <h1 className="text-4xl font-extrabold text-center mb-8 text-blue-400">
              🏛️ Roman Numeral Converter
            </h1>
      <div
        className={`w-full max-w-4xl rounded-3xl border transition-all duration-500 shadow-2xl p-8 ${boxColor}`}
      >
        {!quizMode ? (
          <>
            <h1 className="text-4xl font-extrabold text-center mb-8 text-blue-400">
              🏛️ Roman Numeral Converter
            </h1>

            {/* Input Fields */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <input
                type="number"
                value={number}
                onChange={(e) => handleNumberInput(e.target.value)}
                placeholder="Enter Number"
                className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-center focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={romanResult}
                onChange={(e) => handleRomanInput(e.target.value)}
                placeholder="Enter Roman"
                className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-center uppercase focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={arabicResult}
                onChange={(e) => handleArabicInput(e.target.value)}
                placeholder="Enter Arabic (١٢٣...)"
                className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-center focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Result */}
            {(romanResult || arabicResult || number) && (
              <div className="border-t border-slate-700 pt-4 text-center space-y-3">
                <h2 className="text-lg font-semibold text-blue-300">Results</h2>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-slate-400">Roman</p>
                    <p className="text-white font-bold">{romanResult}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Arabic</p>
                    <p className="text-white font-bold">{arabicResult}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Number</p>
                    <p className="text-white font-bold">{number}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center mt-8">
              <button
                onClick={() => setQuizMode(true)}
                className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl text-white font-semibold transition-transform transform hover:scale-105"
              >
                🎯 Start Quiz
              </button>
            </div>
          </>
        ) : (
          <div className="text-center space-y-6">
            {stage === "countdown" && (
              <p className="text-6xl font-extrabold text-blue-400 animate-bounce">
                Starting in {countdown}...
              </p>
            )}

            {stage === "playing" && (
              <>
                <h3 className="text-3xl font-bold text-blue-300">🧠 Quiz Time!</h3>
                <p className="text-lg text-slate-300">Convert this number to Roman:</p>
                <p className="text-6xl font-extrabold text-white">{quizQuestion}</p>

                {/* Clues */}
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {clues.map((c, i) => (
                    <div
                      key={i}
                      className="bg-slate-700/70 py-2 rounded-xl border border-slate-600 text-white hover:bg-slate-600 transition-transform transform hover:scale-105"
                    >
                      {c}
                    </div>
                  ))}
                </div>

                {/* Timer */}
                <div className="w-full bg-slate-700 rounded-full h-3 mt-5">
                  <div
                    className="h-3 bg-gradient-to-r from-green-400 to-red-500 rounded-full transition-all"
                    style={{ width: `${(timer / 25) * 100}%` }}
                  ></div>
                </div>
                <p className="text-blue-400 font-medium">⏰ {timer}s left</p>

                {/* Answer Input */}
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && checkQuiz()}
                  placeholder="Enter your answer..."
                  className="w-full px-4 py-3 mt-4 bg-slate-700 border border-slate-600 rounded-xl text-center uppercase focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={checkQuiz}
                  className="mt-4 px-8 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-semibold transition-transform hover:scale-105"
                >
                  Submit
                </button>
              </>
            )}

            {stage === "result" && (
              <p className="text-4xl font-bold text-yellow-400 animate-pulse">{quizFeedback}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RomanConverterQuiz;
