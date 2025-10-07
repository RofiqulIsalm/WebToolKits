import React, { useState, useEffect, useRef } from "react";

const RomanConverterQuiz: React.FC = () => {
  const [number, setNumber] = useState<string>("");
  const [romanResult, setRomanResult] = useState<string>("");
  const [arabicResult, setArabicResult] = useState<string>("");
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

  const correctSound = useRef<HTMLAudioElement | null>(null);
  const wrongSound = useRef<HTMLAudioElement | null>(null);

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
    const map: Record<string, number> = {
      I: 1,
      V: 5,
      X: 10,
      L: 50,
      C: 100,
      D: 500,
      M: 1000,
    };
    let result = 0,
      prev = 0;
    for (let i = roman.length - 1; i >= 0; i--) {
      const val = map[roman[i]];
      result += val < prev ? -val : val;
      prev = val;
    }
    return result;
  };

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
      const interval = setInterval(() => setCountdown((p) => p - 1), 1000);
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
      setBoxColor("bg-green-600/20 border-green-500");
      correctSound.current?.play();
    } else if (type === "wrong") {
      setQuizFeedback("❌ Wrong Answer!");
      setBoxColor("bg-red-600/20 border-red-500");
      wrongSound.current?.play();
    } else {
      setQuizFeedback("⏰ Time’s Up!");
      setBoxColor("bg-yellow-600/20 border-yellow-500");
    }

    setTimeout(() => {
      setStage("idle");
      setQuizMode(false);
      setBoxColor("bg-slate-800 border-slate-600");
      setQuizFeedback("");
    }, 4000);
  };

  const checkQuiz = () => {
    if (userInput.trim().toUpperCase() === quizAnswer) handleResult("correct");
    else handleResult("wrong");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-8">
      <div className="max-w-lg w-full bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 text-center transition-all duration-500">
        <h1 className="text-3xl font-extrabold mb-6 text-blue-400 drop-shadow-lg animate-fadeIn">
          🏛️ Roman Numeral Converter & Quiz
        </h1>

        {/* Converter */}
        {!quizMode && (
          <div className="space-y-4 animate-fadeIn">
            <input
              type="number"
              value={number}
              onChange={(e) => handleNumberInput(e.target.value)}
              placeholder="Enter Number"
              className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-center"
            />
            <input
              type="text"
              value={romanResult}
              onChange={(e) => handleRomanInput(e.target.value)}
              placeholder="Enter Roman"
              className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-center uppercase"
            />
            <input
              type="text"
              value={arabicResult}
              onChange={(e) => handleArabicInput(e.target.value)}
              placeholder="Enter Arabic (١٢٣...)"
              className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-center"
            />

            {(romanResult || arabicResult || number) && (
              <div className="mt-6 border-t border-slate-700 pt-4">
                <h2 className="text-lg font-semibold text-blue-300 mb-2">Results:</h2>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400">Roman</p>
                    <p className="font-bold">{romanResult}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Arabic</p>
                    <p className="font-bold">{arabicResult}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Number</p>
                    <p className="font-bold">{number}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setQuizMode(true)}
              className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition transform hover:scale-105"
            >
              🎯 Start Quiz
            </button>
          </div>
        )}

        {/* Quiz Section */}
        {quizMode && (
          <div
            className={`p-8 mt-4 rounded-2xl border transition-all duration-500 ${boxColor} animate-fadeIn`}
          >
            {stage === "countdown" && (
              <p className="text-5xl font-extrabold text-blue-400 animate-countdown">{countdown}</p>
            )}

            {stage === "playing" && (
              <>
                <h3 className="text-2xl font-bold mb-2">🧠 Convert this number:</h3>
                <p className="text-5xl font-extrabold mb-3">{quizQuestion}</p>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  {clues.map((c, i) => (
                    <div
                      key={i}
                      className="bg-slate-700 py-2 rounded-md border border-slate-600 text-white"
                    >
                      {c}
                    </div>
                  ))}
                </div>

                <div className="text-blue-400 mb-3 font-medium">⏰ {timer}s left</div>

                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Enter Roman..."
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-center uppercase focus:ring-2 focus:ring-blue-500"
                />

                <button
                  onClick={checkQuiz}
                  className="mt-3 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition transform hover:scale-105"
                >
                  Submit
                </button>
              </>
            )}

            {stage === "result" && (
              <p className="text-3xl font-bold text-yellow-400 animate-result">{quizFeedback}</p>
            )}
          </div>
        )}

        {/* Sounds */}
        <audio ref={correctSound} src="https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3" />
        <audio ref={wrongSound} src="https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3" />
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.5s ease-in-out; }

        @keyframes countdownPop {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-countdown { animation: countdownPop 1s ease-in-out; }

        @keyframes resultPulse {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-result { animation: resultPulse 0.6s ease-in-out; }
      `}</style>
    </div>
  );
};

export default RomanConverterQuiz;
