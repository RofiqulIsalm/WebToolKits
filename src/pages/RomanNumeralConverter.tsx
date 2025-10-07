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
  const [boxColor, setBoxColor] = useState("bg-slate-800 border-slate-600");
  const [clues, setClues] = useState<number[]>([]);

  // Roman Conversion Logic
  const romanNumerals: [number, string][] = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
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
    const romanMap: Record<string, number> = {
      I: 1,
      V: 5,
      X: 10,
      L: 50,
      C: 100,
      D: 500,
      M: 1000,
    };
    let result = 0;
    let prev = 0;
    for (let i = roman.length - 1; i >= 0; i--) {
      const current = romanMap[roman[i]];
      if (current < prev) result -= current;
      else result += current;
      prev = current;
    }
    return result;
  };

  // Handle number input
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

  // Handle Roman input
  const handleRomanInput = (val: string) => {
    setRomanResult(val.toUpperCase());
    const num = convertFromRoman(val.toUpperCase());
    setNumber(num.toString());
    setArabicResult(num.toLocaleString("ar-EG"));
  };

  // Handle Arabic input
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
      setBoxColor("bg-slate-800 border-slate-600");
      setCountdown(3);
      setStage("countdown");
      setUserInput("");
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
      setTimer(25);
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
      setBoxColor("bg-green-600/20 border-green-500");
    } else if (type === "wrong") {
      setQuizFeedback("❌ Wrong Answer!");
      setBoxColor("bg-red-600/20 border-red-500");
    } else {
      setQuizFeedback("⏰ Time’s Up!");
      setBoxColor("bg-yellow-600/20 border-yellow-500");
    }

    setTimeout(() => {
      setStage("idle");
      setQuizMode(false);
      setBoxColor("bg-slate-800 border-slate-600");
      setQuizFeedback("");
    }, 5000);
  };

  const checkQuiz = () => {
    if (userInput.trim().toUpperCase() === quizAnswer) handleResult("correct");
    else handleResult("wrong");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-400">
          🏛️ Roman Numeral Converter
        </h1>

        {/* Input Fields */}
        <div className="space-y-4">
          <input
            type="number"
            value={number}
            onChange={(e) => handleNumberInput(e.target.value)}
            placeholder="Enter Number"
            className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-center"
          />
          <input
            type="text"
            value={romanResult}
            onChange={(e) => handleRomanInput(e.target.value)}
            placeholder="Enter Roman"
            className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-center uppercase"
          />
          <input
            type="text"
            value={arabicResult}
            onChange={(e) => handleArabicInput(e.target.value)}
            placeholder="Enter Arabic (١٢٣...)"
            className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-center"
          />
        </div>

        {/* Result Display */}
        {(romanResult || arabicResult || number) && (
          <div className="mt-6 border-t border-slate-700 pt-4 text-center space-y-2">
            <h2 className="text-lg font-semibold text-blue-300">Results:</h2>
            <div className="grid grid-cols-3 gap-2 text-sm">
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

        {/* Quiz Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => setQuizMode(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition"
          >
            🎯 Start Quiz
          </button>
        </div>

        {/* Quiz Mode */}
        {quizMode && (
          <div
            className={`text-center space-y-5 border rounded-2xl p-8 mt-6 transition-all duration-500 ${boxColor}`}
          >
            {stage === "countdown" && (
              <p className="text-3xl text-blue-400 font-bold">Starting in {countdown}...</p>
            )}

            {stage === "playing" && (
              <>
                <h3 className="text-2xl font-bold text-white">🧠 Quiz Mode</h3>
                <p className="text-slate-400">Convert this number to Roman:</p>
                <p className="text-5xl font-extrabold text-white">{quizQuestion}</p>

                {/* Clue Numbers */}
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {clues.map((c, i) => (
                    <div
                      key={i}
                      className="bg-slate-700 text-white py-2 rounded-md border border-slate-600"
                    >
                      {c}
                    </div>
                  ))}
                </div>

                <div className="mt-2 text-blue-400 font-medium">⏰ Time Left: {timer}s</div>

                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && checkQuiz()}
                  placeholder="Enter your answer..."
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 text-center uppercase focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={checkQuiz}
                  className="mt-3 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
                >
                  Submit
                </button>
              </>
            )}

            {stage === "result" && (
              <p className="text-3xl font-bold text-yellow-400 animate-pulse">{quizFeedback}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RomanConverterQuiz;
