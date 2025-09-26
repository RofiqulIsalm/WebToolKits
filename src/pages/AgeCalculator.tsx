import React, { useState, useEffect } from 'react';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdBanner from '../components/AdBanner';

const AgeCalculator: React.FC = () => {
  const navigate = useNavigate();

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
      {/* 🔹 Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

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

      {/* (Your calculator and SEO content remain the same here) */}
    </div>
  );
};

export default AgeCalculator;
