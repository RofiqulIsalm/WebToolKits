import React, { useState, useEffect } from "react";

const RomanNumeralConverter: React.FC = () => {
  const [number, setNumber] = useState<number>(10);
  const [roman, setRoman] = useState<string>("X");
  const [arabic, setArabic] = useState<string>("١٠");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showQuiz, setShowQuiz] = useState<boolean>(false);

  const startGame = () => {
    setCountdown(3);
    setShowQuiz(false);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowQuiz(true);
    }
  }, [countdown]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {/* Main Box */}
      <div className="w-[405px] h-[279px] bg-white shadow-xl rounded-xl p-4 flex flex-col items-center justify-between border border-gray-300">
        {/* Header */}
        <div className="text-sm font-semibold w-full text-left mb-2">
          Roman Numeral Converter
        </div>

        {/* Top Row */}
        {!showQuiz && countdown === null && (
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="flex justify-around w-full text-center font-semibold">
              <div>Number</div>
              <div>Roman</div>
              <div>Arabic</div>
            </div>

            <div className="flex justify-around w-full font-bold text-2xl">
              <div className="bg-green-400 w-16 h-12 flex items-center justify-center rounded-md text-white">
                {number}
              </div>
              <div className="bg-green-400 w-16 h-12 flex items-center justify-center rounded-md text-white">
                {roman}
              </div>
              <div className="bg-green-400 w-16 h-12 flex items-center justify-center rounded-md text-white">
                {arabic}
              </div>
            </div>

            <button
              onClick={startGame}
              className="bg-green-500 text-white px-5 py-1 mt-3 rounded-full hover:bg-green-600 transition"
            >
              Play
            </button>
          </div>
        )}

        {/* Countdown */}
        {countdown !== null && !showQuiz && (
          <div className="flex flex-col items-center justify-center bg-green-100 rounded-lg w-full h-full font-semibold text-lg">
            <p>{countdown}s count down</p>
          </div>
        )}

        {/* Quiz Section */}
        {showQuiz && (
          <div className="flex flex-col items-center justify-center w-full h-full bg-green-50 rounded-lg">
            <div className="text-3xl font-bold mb-4">{number}</div>

            <div className="grid grid-cols-2 gap-3">
              {["V", "X", "XX", "XL"].map((option) => (
                <button
                  key={option}
                  className="bg-green-400 text-white font-semibold px-6 py-2 rounded-md hover:bg-green-500 transition"
                >
                  {option}
                </button>
              ))}
            </div>

            <button className="mt-3 bg-green-500 text-white px-6 py-1 rounded-full hover:bg-green-600 transition">
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RomanNumeralConverter;
