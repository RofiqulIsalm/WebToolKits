import React, { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import AdBanner from "../components/AdBanner";
import RelatedCalculators from "../components/RelatedCalculators";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

const CalendarGenerator: React.FC = () => {
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth()); // 0–11

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Generate calendar matrix
  const generateCalendar = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    const weeks: (number | null)[][] = [];
    let currentDay = 1;
    for (let week = 0; week < 6; week++) {
      const weekDays: (number | null)[] = [];
      for (let day = 0; day < 7; day++) {
        if ((week === 0 && day < startDay) || currentDay > daysInMonth) {
          weekDays.push(null);
        } else {
          weekDays.push(currentDay++);
        }
      }
      weeks.push(weekDays);
      if (currentDay > daysInMonth) break;
    }
    return weeks;
  };

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const calendar = generateCalendar();

  return (
    <>
      <SEOHead
        title={seoData.calendarGenerator?.title || "Calendar Generator"}
        description={
          seoData.calendarGenerator?.description ||
          "Generate a calendar for any month and year instantly."
        }
        canonical="https://calculatorhub.site/calendar-generator"
        schemaData={generateCalculatorSchema(
          "Calendar Generator",
          "Create and view a calendar for any month and year online.",
          "/calendar-generator",
          ["calendar generator", "monthly calendar", "year calendar", "date tool"]
        )}
        breadcrumbs={[
          { name: "Date & Time Tools", url: "/category/date-time-tools" },
          { name: "Calendar Generator", url: "/calendar-generator" },
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Date & Time Tools", url: "/category/date-time-tools" },
            { name: "Calendar Generator", url: "/calendar-generator" },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Calendar Generator
          </h1>
          <p className="text-slate-300">
            Generate and view a calendar for any month and year.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-lg hover:bg-gray-100 border"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span>{monthNames[month]} {year}</span>
              </h2>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 border"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex space-x-2">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {monthNames.map((name, i) => (
                  <option key={i} value={i}>
                    {name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Calendar Table */}
          <div className="grid grid-cols-7 gap-2 text-center">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="font-semibold text-gray-700 border-b border-gray-200 pb-1"
              >
                {day}
              </div>
            ))}

            {calendar.flat().map((day, i) => (
              <div
                key={i}
                className={`h-12 flex items-center justify-center rounded-lg ${
                  day
                    ? "bg-gray-50 text-gray-900 border border-gray-200"
                    : "bg-transparent"
                }`}
              >
                {day || ""}
              </div>
            ))}
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators
          currentPath="/calendar-generator"
          category="time-tools"
        />
      </div>
    </>
  );
};

export default CalendarGenerator;
