import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Homepage from './pages/Homepage';
import CategoryPage from './pages/CategoryPage';
 
// Existing calculators
import CurrencyConverter from './pages/CurrencyConverter';
import LengthConverter from './pages/LengthConverter';
import WeightConverter from './pages/WeightConverter';
import TemperatureConverter from './pages/TemperatureConverter';
import AreaConverter from './pages/AreaConverter';
import SpeedConverter from './pages/SpeedConverter';
import LoanEMICalculator from './pages/LoanEMICalculator';
import CompoundInterestCalculator from './pages/CompoundInterestCalculator';
import TaxCalculator from './pages/TaxCalculator';
import BMICalculator from './pages/BMICalculator';
import PercentageCalculator from './pages/PercentageCalculator';
import AverageCalculator from './pages/AverageCalculator';
import AgeCalculator from './pages/AgeCalculator';
import DateDifference from './pages/DateDifference';
import QRCodeGenerator from './pages/QRCodeGenerator';
import PasswordGenerator from './pages/PasswordGenerator';

// Legal pages
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import ContactUs from './pages/ContactUs';

// Placeholder component for calculators not yet implemented
const ComingSoon: React.FC<{ title: string }> = ({ title }) => (
  <div className="max-w-4xl mx-auto text-center">
    <div className="glow-card rounded-lg p-12">
      <h1 className="text-3xl font-bold text-white mb-4">{title}</h1>
      <p className="text-slate-300 mb-8">This calculator is coming soon! We're working hard to bring you the best tools.</p>
      <div className="text-6xl mb-4">🚧</div>
      <p className="text-slate-400">Check back soon for updates</p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/category/:categorySlug" element={<CategoryPage />} />
          
          {/* Existing Calculators */}
          <Route path="/currency-converter" element={<CurrencyConverter />} />
          <Route path="/length-converter" element={<LengthConverter />} />
          <Route path="/weight-converter" element={<WeightConverter />} />
          <Route path="/temperature-converter" element={<TemperatureConverter />} />
          <Route path="/area-converter" element={<AreaConverter />} />
          <Route path="/speed-converter" element={<SpeedConverter />} />
          <Route path="/loan-emi-calculator" element={<LoanEMICalculator />} />
          <Route path="/compound-interest-calculator" element={<CompoundInterestCalculator />} />
          <Route path="/tax-calculator" element={<TaxCalculator />} />
          <Route path="/bmi-calculator" element={<BMICalculator />} />
          <Route path="/percentage-calculator" element={<PercentageCalculator />} />
          <Route path="/average-calculator" element={<AverageCalculator />} />
          <Route path="/age-calculator" element={<AgeCalculator />} />
          <Route path="/date-difference" element={<DateDifference />} />
          <Route path="/qr-code-generator" element={<QRCodeGenerator />} />
          <Route path="/password-generator" element={<PasswordGenerator />} />
          
          {/* Coming Soon Calculators - Currency & Finance */}
          <Route path="/mortgage-calculator" element={<ComingSoon title="Mortgage Calculator" />} />
          <Route path="/sip-calculator" element={<ComingSoon title="SIP Calculator" />} />
          <Route path="/fd-calculator" element={<ComingSoon title="FD Calculator" />} />
          <Route path="/rd-calculator" element={<ComingSoon title="RD Calculator" />} />
          <Route path="/retirement-calculator" element={<ComingSoon title="Retirement Calculator" />} />
          <Route path="/inflation-calculator" element={<ComingSoon title="Inflation Calculator" />} />
          <Route path="/credit-card-payoff-calculator" element={<ComingSoon title="Credit Card Payoff Calculator" />} />
          <Route path="/savings-goal-calculator" element={<ComingSoon title="Savings Goal Calculator" />} />
          <Route path="/simple-interest-calculator" element={<ComingSoon title="Simple Interest Calculator" />} />
          <Route path="/roi-calculator" element={<ComingSoon title="ROI Calculator" />} />
          
          {/* Coming Soon Calculators - Unit Converters */}
          <Route path="/volume-converter" element={<ComingSoon title="Volume Converter" />} />
          <Route path="/pressure-converter" element={<ComingSoon title="Pressure Converter" />} />
          <Route path="/energy-converter" element={<ComingSoon title="Energy Converter" />} />
          <Route path="/data-storage-converter" element={<ComingSoon title="Data Storage Converter" />} />
          <Route path="/fuel-efficiency-converter" element={<ComingSoon title="Fuel Efficiency Converter" />} />
          
          {/* Coming Soon Calculators - Math Tools */}
          <Route path="/quadratic-equation-solver" element={<ComingSoon title="Quadratic Equation Solver" />} />
          <Route path="/factorial-calculator" element={<ComingSoon title="Factorial Calculator" />} />
          <Route path="/prime-number-checker" element={<ComingSoon title="Prime Number Checker" />} />
          <Route path="/statistics-calculator" element={<ComingSoon title="Statistics Calculator" />} />
          <Route path="/gcd-lcm-calculator" element={<ComingSoon title="GCD LCM Calculator" />} />
          <Route path="/log-calculator" element={<ComingSoon title="Log Calculator" />} />
          <Route path="/equation-solver" element={<ComingSoon title="Equation Solver" />} />
          
          {/* Coming Soon Calculators - Date & Time Tools */}
          <Route path="/add-subtract-days" element={<ComingSoon title="Add Subtract Days Calculator" />} />
          <Route path="/weekday-finder" element={<ComingSoon title="Weekday Finder" />} />
          <Route path="/business-days-calculator" element={<ComingSoon title="Business Days Calculator" />} />
          <Route path="/countdown-timer" element={<ComingSoon title="Countdown Timer" />} />
          <Route path="/time-zone-converter" element={<ComingSoon title="Time Zone Converter" />} />
          <Route path="/time-duration-calculator" element={<ComingSoon title="Time Duration Calculator" />} />
          <Route path="/week-number-finder" element={<ComingSoon title="Week Number Finder" />} />
          <Route path="/calendar-generator" element={<ComingSoon title="Calendar Generator" />} />
          
          {/* Coming Soon Calculators - Misc Tools */}
          <Route path="/random-number-generator" element={<ComingSoon title="Random Number Generator" />} />
          <Route path="/color-converter" element={<ComingSoon title="Color Converter" />} />
          <Route path="/text-counter" element={<ComingSoon title="Text Counter" />} />
          <Route path="/tip-calculator" element={<ComingSoon title="Tip Calculator" />} />
          <Route path="/roman-numeral-converter" element={<ComingSoon title="Roman Numeral Converter" />} />
          <Route path="/uuid-generator" element={<ComingSoon title="UUID Generator" />} />
          <Route path="/base-converter" element={<ComingSoon title="Base Converter" />} />
          <Route path="/fuel-cost-calculator" element={<ComingSoon title="Fuel Cost Calculator" />} />
          
          {/* Legal Pages */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/contact-us" element={<ContactUs />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;