import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

// Lazy load pages
const Homepage = lazy(() => import('./pages/Homepage'));
const CurrencyConverter = lazy(() => import('./pages/CurrencyConverter'));
const LengthConverter = lazy(() => import('./pages/LengthConverter'));
const WeightConverter = lazy(() => import('./pages/WeightConverter'));
const TemperatureConverter = lazy(() => import('./pages/TemperatureConverter'));
const AreaConverter = lazy(() => import('./pages/AreaConverter'));
const SpeedConverter = lazy(() => import('./pages/SpeedConverter'));
const LoanEMICalculator = lazy(() => import('./pages/LoanEMICalculator'));
const CompoundInterestCalculator = lazy(() => import('./pages/CompoundInterestCalculator'));
const TaxCalculator = lazy(() => import('./pages/TaxCalculator'));
const BMICalculator = lazy(() => import('./pages/BMICalculator'));
const PercentageCalculator = lazy(() => import('./pages/PercentageCalculator'));
const AverageCalculator = lazy(() => import('./pages/AverageCalculator'));
const AgeCalculator = lazy(() => import('./pages/AgeCalculator'));
const DateDifference = lazy(() => import('./pages/DateDifference'));
const QRCodeGenerator = lazy(() => import('./pages/QRCodeGenerator'));
const PasswordGenerator = lazy(() => import('./pages/PasswordGenerator'));

function App() {
  return (
    <Router>
      <Layout>
        <Suspense fallback={<div className="text-center text-white">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Homepage />} />
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
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
}

export default App;
