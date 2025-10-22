import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Calendar } from "lucide-react";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import AdBanner from "../components/AdBanner";
import RelatedCalculators from "../components/RelatedCalculators";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

const TimeDurationCalculator: React.FC = () => {
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [duration, setDuration] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  const calculateDuration = () => {
    if (!startTime || !endTime) return;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setDuration(null);
      return;
    }

    const diffMs = Math.abs(end.getTime() - start.getTime());
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    const seconds = Math.floor((diffMs / 1000) % 60);

    setDuration({ days, hours, minutes, seconds });
  };

  return (
    <>
      <SEOHead
        title={seoData.timeDurationCalculator?.title || "Time Duration Calculator"}
        description={
          seoData.timeDurationCalculator?.description ||
          "Find the exact time duration between two dates or times."
        }
        canonical="https://calculatorhub.site/time-duration-calculator"
        schemaData={generateCalculatorSchema(
          "Time Duration Calculator",
          "Calculate the time difference between two dates or times easily.",
          "/time-duration-calculator",
          ["time duration calculator", "time difference", "date calculator"]
        )}
        breadcrumbs={[
          { name: "Date & Time Tools", url: "/category/date-time-tools" },
          { name: "Time Duration Calculator", url: "/time-duration-calculator" },
        ]}
      />


      <div className="max-w-3xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Date & Time Tools", url: "/category/date-time-tools" },
            { name: "Time Duration Calculator", url: "/time-duration-calculator" },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Time Duration Calculator
          </h1>
          <p className="text-slate-300">
            Calculate the precise time difference between two dates or times.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={calculateDuration}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Clock className="h-4 w-4" />
              <span>Calculate Duration</span>
            </button>

            {duration && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-800 font-semibold">Duration Result</span>
                </div>
                <div className="text-gray-900 text-lg">
                  {duration.days} days, {duration.hours} hours,{" "}
                  {duration.minutes} minutes, {duration.seconds} seconds
                </div>
              </div>
            )}
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators
          currentPath="/time-duration-calculator"
          category="time-tools"
        />
      </div>
    </>
  );
};

export default TimeDurationCalculator;
