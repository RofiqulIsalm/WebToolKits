import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import AdBanner from '../components/AdBanner';

const AgeCalculator: React.FC = () => {
  const [birthDate, setBirthDate] = useState<string>('1990-01-01');
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [age, setAge] = useState<{
    years: number;
    months: number;
    days: number;
    totalDays: number;
    totalMonths: number;
    totalWeeks: number;
  }>({
    years: 0,
    months: 0,
    days: 0,
    totalDays: 0,
    totalMonths: 0,
    totalWeeks: 0
  });

  useEffect(() => {
    calculateAge();
  }, [birthDate, toDate]);

  const calculateAge = () => {
    const birth = new Date(birthDate);
    const to = new Date(toDate);

    if (birth > to) return;

    let years = to.getFullYear() - birth.getFullYear();
    let months = to.getMonth() - birth.getMonth();
    let days = to.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      const lastMonth = new Date(to.getFullYear(), to.getMonth(), 0);
      days += lastMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    const totalDays = Math.floor((to.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
    const totalMonths = years * 12 + months;
    const totalWeeks = Math.floor(totalDays / 7);

    setAge({
      years,
      months,
      days,
      totalDays,
      totalMonths,
      totalWeeks
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 🔹 Main Heading + SEO Intro */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Free Online Age Calculator</h1>
        <p className="text-gray-300">
          Use our free Age Calculator to find your exact age in years, months, days, weeks, and more. 
          This tool instantly calculates your age from date of birth to any given date, making it perfect 
          for birthdays, official forms, astrology, retirement planning, or just curiosity. 
          No signup required – fast, accurate, and mobile-friendly.
        </p>
      </div>

      {/* 🔹 Calculator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Enter Your Date of Birth</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Birth Date
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calculate Age As On
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setToDate(new Date().toISOString().split('T')[0])}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Calculate Age Today
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Age Results</h2>
          
          <div className="space-y-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {age.years} years, {age.months} months, {age.days} days
              </div>
              <div className="text-sm text-gray-600">Exact Age</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-xl font-semibold text-gray-900">
                  {age.totalDays.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Days</div>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg text-center">
                <div className="text-xl font-semibold text-gray-900">
                  {age.totalWeeks.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Weeks</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <div className="text-xl font-semibold text-gray-900">
                  {age.totalMonths}
                </div>
                <div className="text-sm text-gray-600">Total Months</div>
              </div>
              
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <div className="text-xl font-semibold text-gray-900">
                  {(age.totalDays * 24).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Hours</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AdBanner type="bottom" />

      {/* 🔹 SEO Content After Calculator */}
      <div className="mt-12 text-gray-300 space-y-6">
        <h2 className="text-2xl font-bold text-white">How to Use the Age Calculator</h2>
        <p>
          Simply enter your date of birth and the date you want to calculate your age for. 
          You can calculate your age today, or for any past or future date. Our calculator 
          instantly shows your age in years, months, days, weeks, and even hours. 
          Perfect for school forms, passport applications, or tracking your fitness progress.
        </p>

        <h2 className="text-2xl font-bold text-white">Why Use an Online Age Calculator?</h2>
        <p>
          Manually calculating your age can be confusing, especially when leap years are involved. 
          This tool ensures 100% accurate results in seconds. It’s free, fast, and works on all devices. 
          Whether you’re a student, professional, or just curious, our age calculator gives 
          instant and precise answers.
        </p>

        <h2 className="text-2xl font-bold text-white">Frequently Asked Questions (FAQs)</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-white">🔹 Can I calculate my age on a future date?</h3>
            <p>Yes, simply select any future date to know how old you will be on that day.</p>
          </div>
          <div>
            <h3 className="font-semibold text-white">🔹 Is this calculator accurate?</h3>
            <p>Absolutely. It accounts for leap years and different month lengths for exact results.</p>
          </div> 
          <div>
            <h3 className="font-semibold text-white">🔹 Do I need to sign up?</h3>
            <p>No signup required. Just enter your date of birth and get instant results.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgeCalculator;
