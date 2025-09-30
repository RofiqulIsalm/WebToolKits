import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Homepage from './pages/Homepage';
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
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import ContactUs from './pages/ContactUs';

function App() {
  return (
    <Router>
      <Layout>
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
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/contact-us" element={<ContactUs />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;