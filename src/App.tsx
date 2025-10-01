import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Homepage from './pages/Homepage';
import CategoryPage from './pages/CategoryPage';

// import all your calculators and pages here (same as before)

function App() {
  return (
    <Router>
      <Routes>
        {/* 👇 Layout is now a parent route */}
        <Route path="/" element={<Layout />}>
          {/* Home */}
          <Route index element={<Homepage />} />
          <Route path="category/:categorySlug" element={<CategoryPage />} />

          {/* Existing Calculators */}
          <Route path="currency-converter" element={<CurrencyConverter />} />
          <Route path="length-converter" element={<LengthConverter />} />
          <Route path="weight-converter" element={<WeightConverter />} />
          <Route path="temperature-converter" element={<TemperatureConverter />} />
          <Route path="area-converter" element={<AreaConverter />} />
          <Route path="speed-converter" element={<SpeedConverter />} />
          <Route path="loan-emi-calculator" element={<LoanEMICalculator />} />
          <Route path="compound-interest-calculator" element={<CompoundInterestCalculator />} />
          <Route path="tax-calculator" element={<TaxCalculator />} />
          <Route path="bmi-calculator" element={<BMICalculator />} />
          <Route path="percentage-calculator" element={<PercentageCalculator />} />
          <Route path="average-calculator" element={<AverageCalculator />} />
          <Route path="age-calculator" element={<AgeCalculator />} />
          <Route path="date-difference" element={<DateDifference />} />
          <Route path="qr-code-generator" element={<QRCodeGenerator />} />
          <Route path="password-generator" element={<PasswordGenerator />} />

          {/* Coming Soon + Legal pages (same as your code) */}
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="terms-of-service" element={<TermsOfService />} />
          <Route path="contact-us" element={<ContactUs />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
