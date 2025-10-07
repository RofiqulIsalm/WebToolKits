import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [boxColor, setBoxColor] = useState("bg-slate-800/60 border-slate-600/40");
  const [clues, setClues] = useState<number[]>([]);

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
      setBoxColor("bg-slate-800/60 border-slate-600/40");
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
      setBoxColor("bg-green-600/30 border-green-400");
    } else if (type === "wrong") {
      setQuizFeedback("❌ Wrong Answer!");
      setBoxColor("bg-red-600/30 border-red-400");
    } else {
      setQuizFeedback("⏰ Time’s Up!");
      setBoxColor("bg-yellow-600/30 border-yellow-400");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full backdrop-blur-md bg-white/10 p-6 rounded-3xl shadow-xl border border-white/20">
        <h1 className="text-4xl font-extrabold text-center mb-6 text-blue-400 drop-shadow-lg">
          🏛 Roman Converter & Quiz
        </h1>

        {/* Converter Inputs */}
        <div className="space-y-3">
          <input
            type="number"
            value={number}
            onChange={(e) => handleNumberInput(e.target.value)}
            placeholder="Enter Number"
            className="w-full px-4 py-3 rounded-xl bg-slate-700/60 border border-slate-600 text-center focus:ring-2 focus:ring-blue-500 transition"
          />
          <input
            type="text"
            value={romanResult}
            onChange={(e) => handleRomanInput(e.target.value)}
            placeholder="Enter Roman"
            className="w-full px-4 py-3 rounded-xl bg-slate-700/60 border border-slate-600 text-center uppercase focus:ring-2 focus:ring-blue-500 transition"
          />
          <input
            type="text"
            value={arabicResult}
            onChange={(e) => handleArabicInput(e.target.value)}
            placeholder="Enter Arabic (١٢٣...)"
            className="w-full px-4 py-3 rounded-xl bg-slate-700/60 border border-slate-600 text-center focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Results */}
        {(romanResult || arabicResult || number) && (
          <div className="mt-6 border-t border-slate-700 pt-4 text-center space-y-2">
            <h2 className="text-lg font-semibold text-blue-300">Results</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Roman", romanResult],
                ["Arabic", arabicResult],
                ["Number", number],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-slate-400">{label}</p>
                  <p className="text-white font-bold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quiz Section */}
        <div className="text-center mt-6">
          <button
            onClick={() => setQuizMode(true)}
            disabled={quizMode}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl text-white font-semibold transition-transform transform hover:scale-105"
          >
            🎯 Start Quiz
          </button>
        </div>

        {/* Quiz Mode */}
        <AnimatePresence>
          {quizMode && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-center mt-6 border rounded-3xl p-8 ${boxColor} shadow-inner`}
            >
              {stage === "countdown" && (
                <motion.p
                  key={countdown}
                  className="text-5xl font-extrabold text-blue-400 animate-bounce"
                >
                  Starting in {countdown}...
                </motion.p>
              )}

              {stage === "playing" && (
                <>
                  <h3 className="text-2xl font-bold text-blue-300 mb-2">🧠 Quiz Time!</h3>
                  <p className="text-slate-300">Convert this number to Roman:</p>
                  <p className="text-5xl font-extrabold text-white mt-2">{quizQuestion}</p>

                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {clues.map((c, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ rotate: 5, scale: 1.05 }}
                        className="bg-slate-700/70 py-2 rounded-xl border border-slate-500"
                      >
                        {c}
                      </motion.div>
                    ))}
                  </div>

                  {/* Timer Bar */}
                  <div className="mt-3 w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-green-400 to-red-500 h-3"
                      initial={{ width: "100%" }}
                      animate={{ width: `${(timer / 25) * 100}%` }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </div>

                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && checkQuiz()}
                    placeholder="Enter your answer..."
                    className="w-full mt-4 px-4 py-3 bg-slate-700/60 border border-slate-600 text-center rounded-xl uppercase focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={checkQuiz}
                    className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-semibold transition-transform hover:scale-105"
                  >
                    Submit
                  </button>
                </>
              )}

              {stage === "result" && (
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-3xl font-bold mt-4"
                >
                  {quizFeedback}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RomanConverterQuiz;
