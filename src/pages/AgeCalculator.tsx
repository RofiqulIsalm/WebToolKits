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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Age Calculator</h1>
        <p className="text-gray-600">Calculate your exact age in years, months, days, and more</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Date Input</h2>
          
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Age Results</h2>
          
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
      <AdBanner type="bottom" />
      {/* SEO Content Section */}
      <div className="mt-12 space-y-8">
        <div className="glow-card rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Age Calculator Information</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 mb-4">
              Our precise age calculator determines your exact age in years, months, days, weeks, hours, and even minutes. 
              Whether you need to know your age for official documents, birthday planning, or just curiosity, 
              our tool provides accurate calculations based on your birth date.
            </p>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-4">Age Calculation Methods</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="font-semibold text-white mb-2">Chronological Age</div>
                <div className="text-slate-300 text-sm">Time elapsed since birth</div>
                <div className="text-xs text-slate-400 mt-1">Most common age calculation method</div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="font-semibold text-white mb-2">Age in Days</div>
                <div className="text-slate-300 text-sm">Total days lived</div>
                <div className="text-xs text-slate-400 mt-1">Useful for milestone celebrations</div>
              </div>
            </div>
    </div>
  );
};

            <h3 className="text-xl font-semibold text-white mt-6 mb-4">Common Use Cases</h3>
            <ul className="text-slate-300 space-y-2 mb-6">
              <li>• <strong>Legal Documents:</strong> Passport, visa, and ID applications</li>
              <li>• <strong>Insurance:</strong> Age-based premium calculations</li>
              <li>• <strong>Education:</strong> School admission age requirements</li>
              <li>• <strong>Employment:</strong> Age verification for job applications</li>
              <li>• <strong>Retirement:</strong> Planning for retirement age</li>
              <li>• <strong>Medical:</strong> Age-appropriate health screenings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgeCalculator;
    </div>
  );
};

export default AgeCalculator;
export default AgeCalculator;