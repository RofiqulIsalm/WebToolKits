import React, { useState } from "react";
import { Globe, Clock } from "lucide-react";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import AdBanner from "../components/AdBanner";
import RelatedCalculators from "../components/RelatedCalculators";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

const TimezoneConverter: React.FC = () => {
  const [datetime, setDatetime] = useState<string>(new Date().toISOString().slice(0, 16));
  const [fromZone, setFromZone] = useState<string>("UTC");
  const [toZone, setToZone] = useState<string>("America/New_York");
  const [convertedTime, setConvertedTime] = useState<string>("");

  const timezones = [
    "UTC",
    "America/New_York",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];

  const convertTime = () => {
    try {
      const date = new Date(datetime);
      const options: Intl.DateTimeFormatOptions = {
        timeZone: toZone,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      };
      const formatter = new Intl.DateTimeFormat([], options);
      setConvertedTime(formatter.format(date));
    } catch (error) {
      setConvertedTime("Invalid conversion");
    }
  };

  return (
    <>
      <SEOHead
        title={seoData.timezoneConverter?.title || "Timezone Converter"}
        description={
          seoData.timezoneConverter?.description ||
          "Easily convert time between different time zones instantly."
        }
        canonical="https://calculatorhub.com/timezone-converter"
        schemaData={generateCalculatorSchema(
          "Timezone Converter",
          "Convert time between any two world time zones.",
          "/timezone-converter",
          ["timezone converter", "world clock", "time difference", "UTC conversion"]
        )}
        breadcrumbs={[
          { name: "Time Tools", url: "/category/time-tools" },
          { name: "Timezone Converter", url: "/timezone-converter" },
        ]}
      />

      <div className="max-w-3xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Time Tools", url: "/category/time-tools" },
            { name: "Timezone Converter", url: "/timezone-converter" },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Timezone Converter
          </h1>
          <p className="text-slate-300">
            Convert time between any two global time zones.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Select Date & Time
              </label>
              <input
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  From Timezone
                </label>
                <select
                  value={fromZone}
                  onChange={(e) => setFromZone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {timezones.map((tz) => (
                    <option key={tz}>{tz}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  To Timezone
                </label>
                <select
                  value={toZone}
                  onChange={(e) => setToZone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {timezones.map((tz) => (
                    <option key={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={convertTime}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Clock className="h-4 w-4" />
              <span>Convert Time</span>
            </button>

            {convertedTime && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
                <Globe className="inline h-5 w-5 text-blue-600 mr-2" />
                <span className="text-gray-800 font-semibold">
                  Converted Time ({toZone}): {convertedTime}
                </span>
              </div>
            )}
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators
          currentPath="/timezone-converter"
          category="time-tools"
        />
      </div>
    </>
  );
};

export default TimezoneConverter;
