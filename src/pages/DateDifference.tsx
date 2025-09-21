import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import AdBanner from '../components/AdBanner';

const DateDifference: React.FC = () => {
  const [fromDate, setFromDate] = useState<string>('2023-01-01');
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [difference, setDifference] = useState<{
    years: number;
    months: number;
    days: number;
    totalDays: number;
    totalWeeks: number;
    totalHours: number;
    totalMinutes: number;
  }>({
    years: 0,
    months: 0,
    days: 0,
    totalDays: 0,
    totalWeeks: 0,
    totalHours: 0,
    totalMinutes: 0
  });

  useEffect(() => {
    calculateDifference();
  }, [fromDate, toDate]);

  const calculateDifference = () => {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    const isNegative = from > to;
    const startDate = isNegative ? to : from;
    const endDate = isNegative ? from : to;

    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();

    if (days < 0) {
      months--;
      const lastMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
      days += lastMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    const totalDays = Math.floor(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalHours = totalDays * 24;
    const totalMinutes = totalHours * 60;

    setDifference({
      years: isNegative ? -years : years,
      months: isNegative ? -months : months,
      days: isNegative ? -days : days,
      totalDays: isNegative ? -totalDays : totalDays,
      totalWeeks: isNegative ? -totalWeeks : totalWeeks,
      totalHours: isNegative ? -totalHours : totalHours,
      totalMinutes: isNegative ? -totalMinutes : totalMinutes
    });
  };

  const swapDates = () => {
    const temp = fromDate;
    setFromDate(toDate);
    setToDate(temp);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Date Difference Calculator</h1>
        <p className="text-gray-600">Calculate the exact difference between two dates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Dates</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={swapDates}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Swap Dates
              </button>
              <button
                onClick={() => setToDate(new Date().toISOString().split('T')[0])}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Set To Today
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Time Difference</h2>
          
          <div className="space-y-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {Math.abs(difference.years)} years, {Math.abs(difference.months)} months, {Math.abs(difference.days)} days
              </div>
              <div className="text-sm text-gray-600">
                {difference.totalDays < 0 ? 'In the past' : 'Time difference'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-xl font-semibold text-gray-900">
                  {Math.abs(difference.totalDays).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Days</div>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg text-center">
                <div className="text-xl font-semibold text-gray-900">
                  {Math.abs(difference.totalWeeks).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Weeks</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <div className="text-xl font-semibold text-gray-900">
                  {Math.abs(difference.totalHours).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Hours</div>
              </div>
              
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <div className="text-xl font-semibold text-gray-900">
                  {Math.abs(difference.totalMinutes).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Minutes</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AdBanner type="bottom" />
    </div>
  );
};

export default DateDifference;