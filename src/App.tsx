// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Layout & Pages
import Layout from './components/Layout';
import Homepage from './pages/Homepage';
import CategoryPage from './pages/CategoryPage';

// Existing Calculators
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
import AddSubtractDays from './pages/AddSubtractDays'; 
import WeekdayFinder from './pages/WeekdayFinder';
import BusinessDaysCalculator from './pages/BusinessDaysCalculator';
import CountdownTimer from './pages/CountdownTimer';
import TimezoneConverter from './pages/TimezoneConverter';
import TimeDurationCalculator from './pages/TimeDurationCalculator';
import PrimeNumberChecker from './pages/PrimeNumberChecker';
import EquationSolver from './pages/EquationSolver';
import PressureConverter from './pages/PressureConverter';



 

// Misc Tools
import RandomNumberGenerator from './pages/RandomNumberGenerator';
import ColorConverter from './pages/ColorConverter';
import TextCounter from './pages/TextCounter';
import TipCalculator from './pages/TipCalculator';
import RomanNumeralConverter from './pages/RomanNumeralConverter';
import UUIDGenerator from './pages/UUIDGenerator';
import BaseConverter from './pages/BaseConverter';
import FuelCostCalculator from './pages/FuelCostCalculator';
import WeekNumberFinder from './pages/WeekNumberFinder';
import CalendarGenerator from './pages/CalendarGenerator';
import QuadraticEquationSolver from './pages/QuadraticEquationSolver';
import FactorialCalculator from './pages/FactorialCalculator';
import StatisticsCalculator  from './pages/StatisticsCalculator';
import GCDLCMCalculator  from './pages/GCDLCMCalculator';
import LogCalculator  from './pages/LogCalculator'; 
import VolumeConverter  from './pages/VolumeConverter';
import EnergyConverter  from './pages/EnergyConverter';
import DataStorageConverter  from './pages/DataStorageConverter';
import MortgageCalculator  from './pages/MortgageCalculator';
import SIPCalculator  from './pages/SIPCalculator';
import FDCalculator  from './pages/FDCalculator';




// Admin Pages
import AdminImageUpload from './pages/AdminImageUpload';

// Legal Pages
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import ContactUs from './pages/ContactUs';

// ✅ Placeholder Coming Soon Component
const ComingSoon: React.FC<{ title: string }> = ({ title }) => (
  <div className="max-w-4xl mx-auto text-center">
    <div className="glow-card rounded-lg p-12 bg-gray-900 shadow-lg">
      <h1 className="text-3xl font-bold text-white mb-4">{title}</h1>
      <p className="text-slate-300 mb-8">
        This calculator is coming soon! We're working hard to bring you the best tools.
      </p>
      <div className="text-6xl mb-4">🚧</div>
      <p className="text-slate-400">Check back soon for updates</p>
    </div>
  </div>
);

function App() {
  return (
    <HelmetProvider>
      <Router>
        <Layout>
          <Routes>
            {/* ✅ Main Routes */}
            <Route path="/" element={<Homepage />} />
            <Route path="/category/:categorySlug" element={<CategoryPage />} />

            {/* ✅ Existing Calculators */}
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
            <Route path="/add-subtract-days" element={<AddSubtractDays />} />
            <Route path="/weekday-finder" element={<WeekdayFinder />} />
            <Route path="/business-days-calculator" element={<BusinessDaysCalculator />} />
            <Route path="/countdown-timer" element={<CountdownTimer />} />
            <Route path="/time-zone-converter" element={<TimezoneConverter />} />
            <Route path="/time-duration-calculator" element={<TimeDurationCalculator />} />
            <Route path="/week-number-finder" element={<WeekNumberFinder />} />
            <Route path="/calendar-generator" element={<CalendarGenerator />} />
 
            

            

            {/* ✅ Admin Pages */}
            <Route path="/admin/upload-image" element={<AdminImageUpload />} />


            {/* ✅ Coming Soon Calculators - Currency & Finance */}
            
            <Route path="/mortgage-calculator" element={<MortgageCalculator />} />
            <Route path="/sip-calculator" element={<SIPCalculator />} />
            <Route path="/fd-calculator" element={<FDCalculator />} />

 




 
           
 


            {/* ✅ Coming Soon Calculators - Unit Converters */}
            <Route path="/volume-converter" element={<VolumeConverter />} />
            <Route path="/pressure-converter" element={<PressureConverter />} />
            <Route path="/energy-converter" element={<EnergyConverter />} />
            <Route path="/data-storage-converter" element={<DataStorageConverter />} />
            

            {/* ✅ Coming Soon Calculators - Math Tools */}
            <Route path="/quadratic-equation-solver" element={<QuadraticEquationSolver />} />
            <Route path="/factorial-calculator" element={<FactorialCalculator />} />
            <Route path="/prime-number-checker" element={<PrimeNumberChecker />} />
            <Route path="/statistics-calculator" element={<StatisticsCalculator />} />
            <Route path="/gcd-lcm-calculator" element={<GCDLCMCalculator />} />
            <Route path="/log-calculator" element={<LogCalculator />} />
            <Route path="/equation-solver" element={<EquationSolver />} />

            {/* ✅ Coming Soon Calculators - Date & Time Tools */}


            

            {/* ✅ Misc Tools */}
            <Route path="/random-number-generator" element={<RandomNumberGenerator />} />
            <Route path="/color-converter" element={<ColorConverter />} />
            <Route path="/text-counter" element={<TextCounter />} />
            <Route path="/tip-calculator" element={<TipCalculator />} />
            <Route path="/roman-numeral-converter" element={<RomanNumeralConverter />} />
            <Route path="/uuid-generator" element={<UUIDGenerator />} />
            <Route path="/base-converter" element={<BaseConverter />} />
            <Route path="/fuel-cost-calculator" element={<FuelCostCalculator />} />

            {/* ✅ Legal Pages */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/contact-us" element={<ContactUs />} />

            {/* ✅ 404 - Fallback */}
            <Route path="*" element={<ComingSoon title="404 - Page Not Found" />} />
          </Routes>
        </Layout>
      </Router>
    </HelmetProvider>
  );
}

export default App;
