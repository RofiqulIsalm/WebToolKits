import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Hash } from "lucide-react";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import AdBanner from "../components/AdBanner";
import RelatedCalculators from "../components/RelatedCalculators";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

const WeekNumberFinder: React.FC = () => {
  const [date, setDate] = useState<string>("");
  const [weekNumber, setWeekNumber] = useState<number | null>(null);

  const calculateWeekNumber = () => {
    if (!date) return;

    const selectedDate = new Date(date);
    const oneJan = new Date(selectedDate.getFullYear(), 0, 1);
    const numberOfDays = Math.floor(
      (selectedDate.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000)
    );
    const week = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
    setWeekNumber(week);
  };

  return (
    <>
      <SEOHead
        title={seoData.weekNumberFinder?.title || "Week Number Finder"}
        description={
          seoData.weekNumberFinder?.description ||
          "Find the week number for any date of the year."
        }
        canonical="https://calculatorhub.site/week-number-finder"
        schemaData={generateCalculatorSchema(
          "Week Number Finder",
          "Find which week of the year a given date falls in.",
          "/week-number-finder",
          ["week number", "week calculator", "week of year", "date week finder"]
        )}
        breadcrumbs={[
          { name: "Date & Time Tools", url: "/category/date-time-tools" },
          { name: "Week Number Finder", url: "/week-number-finder" },
        ]}
      />

      <div className="max-w-3xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Date & Time Tools", url: "/category/date-time-tools" },
            { name: "Week Number Finder", url: "/week-number-finder" },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Week Number Finder
          </h1>
          <p className="text-slate-300">
            Quickly find out which week of the year a specific date belongs to.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Select Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={calculateWeekNumber}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CalendarDays className="h-4 w-4" />
              <span>Find Week Number</span>
            </button>

            {weekNumber !== null && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
                <Hash className="inline h-5 w-5 text-blue-600 mr-2" />
                <span className="text-gray-800 font-semibold text-lg">
                  Week Number: {weekNumber}
                </span>
              </div>
            )}
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators
          currentPath="/week-number-finder"
          category="time-tools"
        />
      </div>
    </>
  );
};

export default WeekNumberFinder;
