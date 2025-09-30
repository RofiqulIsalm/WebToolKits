import React from "react";
import { Link } from "react-router-dom";

const NotFound: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto text-center text-white mt-20">
      <div className="glow-card rounded-lg p-8">
        <h1 className="text-4xl font-bold mb-4 drop-shadow-lg">404 - Page Not Found</h1>
        <p className="text-slate-300 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-y-4">
          <Link
            to="/"
            className="inline-block px-6 py-3 glow-button text-white font-medium rounded-lg transition-all"
          >
            🏠 Go Back Home
          </Link>
          <div className="text-sm text-slate-400">
            Or try one of these popular calculators:
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <Link to="/bmi-calculator" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">
              BMI Calculator
            </Link>
            <Link to="/currency-converter" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">
              Currency Converter
            </Link>
            <Link to="/percentage-calculator" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">
              Percentage Calculator
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
