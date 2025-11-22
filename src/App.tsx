// App.tsx
import React, { Suspense } from "react";
import { HashRouter as Router } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import { SiteConfigProvider } from "./config/siteConfig"; 
import PageViewTracker from "./components/PageViewTracker";
import CalculatorGuard from "./components/CalculatorGuard";




// ========== Lazy-loaded Pages (Code Splitting) ==========
const withGuard = (el: JSX.Element) => (
  <CalculatorGuard>{el}</CalculatorGuard>
);

// Core pages
import Homepage from "./pages/Homepage";
import CategoryPage from "./pages/CategoryPage";


// Currency & Finance
import CurrencyConverter from "./pages/CurrencyConverter";
import LoanEMICalculator from "./pages/LoanEMICalculator";
import CompoundInterestCalculator from "./pages/CompoundInterestCalculator";
import TaxCalculator from "./pages/TaxCalculator";
import MortgageCalculator from "./pages/MortgageCalculator";
import SIPCalculator from "./pages/SIPCalculator";
import FDCalculator from "./pages/FDCalculator";
import RDCalculator from "./pages/RDCalculator";
import RetirementCalculator from "./pages/RetirementCalculator";
import InflationCalculator from "./pages/InflationCalculator";
import CreditCardPayoff from "./pages/CreditCardPayoff";
import ROICalculator from "./pages/ROICalculator";
import SavingsGoalCalculator from "./pages/SavingsGoalCalculator";
import CarLoanCalculator from "./pages/CarLoanCalculator";
import HomeLoanCalculator from "./pages/HomeLoanCalculator";
import PersonalLoanCalculator from "./pages/PersonalLoanCalculator";
import LoanAffordabilityCalculator from "./pages/LoanAffordabilityCalculator";
import DebtToIncomeCalculator from "./pages/DebtToIncomeCalculator";
import CAGRCalculator from "./pages/CAGRCalculator";
import LumpSumInvestmentCalculator from "./pages/LumpSumInvestmentCalculator";
import PayRaiseCalculator from "./pages/PayRaiseCalculator";
import BreakEvenPointCalculator from "./pages/BreakEvenPointCalculator";
import LoanComparisonCalculator from "./pages/LoanComparisonCalculator";

// Unit Converters
import LengthConverter from "./pages/LengthConverter";
import WeightConverter from "./pages/WeightConverter";
import TemperatureConverter from "./pages/TemperatureConverter";
import AreaConverter from "./pages/AreaConverter";
import SpeedConverter from "./pages/SpeedConverter";
import PressureConverter from "./pages/PressureConverter";
import VolumeConverter from "./pages/VolumeConverter";
import EnergyConverter from "./pages/EnergyConverter";
import DataStorageConverter from "./pages/DataStorageConverter";
import MassWeightConverter from "./pages/MassWeightConverter";
import TimeConverter from "./pages/TimeConverter";
import PowerConverter from "./pages/PowerConverter";
import ForceConverter from "./pages/ForceConverter";
import DensityConverter from "./pages/DensityConverter";
import AccelerationConverter from "./pages/AccelerationConverter";
import FlowRateConverter from "./pages/FlowRateConverter";
import FuelConsumptionConverter from "./pages/FuelConsumptionConverter";
import AngleConverter from "./pages/AngleConverter";
import FrequencyConverter from "./pages/FrequencyConverter";
import DataTransferConverter from "./pages/DataTransferConverter";


// Math Tools
import PercentageCalculator from "./pages/PercentageCalculator";
import AverageCalculator from "./pages/AverageCalculator";
import PrimeNumberChecker from "./pages/PrimeNumberChecker";
import EquationSolver from "./pages/EquationSolver";
import QuadraticEquationSolver from "./pages/QuadraticEquationSolver";
import FactorialCalculator from "./pages/FactorialCalculator";
import StatisticsCalculator from "./pages/StatisticsCalculator";
import GCDLCMCalculator from "./pages/GCDLCMCalculator";
import LogCalculator from "./pages/LogCalculator";



// Date & Time Tools
import AgeCalculator from "./pages/AgeCalculator";
import DateDifference from "./pages/DateDifference";
import AddSubtractDays from "./pages/AddSubtractDays";
import WeekdayFinder from "./pages/WeekdayFinder";
import BusinessDaysCalculator from "./pages/BusinessDaysCalculator";
import CountdownTimer from "./pages/CountdownTimer";
import TimezoneConverter from "./pages/TimezoneConverter";
import TimeDurationCalculator from "./pages/TimeDurationCalculator";
import WeekNumberFinder  from "./pages/WeekNumberFinder";
import CalendarGenerator from "./pages/CalendarGenerator";


// Misc Tools
import QRCodeGenerator from "./pages/QRCodeGenerator";
import PasswordGenerator from "./pages/PasswordGenerator";
import RandomNumberGenerator from "./pages/RandomNumberGenerator";
import ColorConverter from "./pages/ColorConverter";
import TextCounter from "./pages/TextCounter";
import TipCalculator from "./pages/TipCalculator";
import RomanNumeralConverter from "./pages/RomanNumeralConverter";
import UUIDGenerator from "./pages/UUIDGenerator";
import BaseConverter from "./pages/BaseConverter";
import FuelCostCalculator from "./pages/FuelCostCalculator";
import YouTubeRevenueCalculator from "./pages/YouTubeRevenueCalculator";
import FacebookInstreamAdsCalculator from "./pages/FacebookInstreamAdsCalculator";
import AppRevenueCalculator from "./pages/AppRevenueCalculator";
import TikTokRevenueCalculator from "./pages/TikTokRevenueCalculator";
import WebsiteRevenueCalculator from "./pages/WebsiteRevenueCalculator";


// Health tools
import BMICalculator  from "./pages/BMICalculator";


// Admin & Legal
import AdminImageUpload from "./pages/AdminImageUpload";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Aboutus from "./pages/Aboutus";
import Disclaimer from "./pages/Disclaimer";
import TermsOfService from "./pages/TermsOfService";
import ContactUs from "./pages/ContactUs";


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

// Simple global fallback while lazy routes load
const LoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center text-slate-200">
      <div className="mb-4 animate-pulse text-4xl">⏳</div>
      <p className="text-lg">Loading calculator...</p>
    </div>
  </div>
);

function App() {
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <PageViewTracker />
        <SiteConfigProvider>
        <Layout> 
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Main Routes */}
              <Route path="/" element={<Homepage />} />
              <Route path="/category/:categorySlug" element={<CategoryPage />} />

              {/* Unit Converters */}
              <Route path="/length-converter" element={withGuard(<LengthConverter />)} />
              <Route
                path="/weight-converter"
                element={withGuard(<WeightConverter />)}
              />
              <Route path="/temperature-converter" element={withGuard(<TemperatureConverter />)} />
              <Route path="/area-converter" element={withGuard(<AreaConverter />)} />
              <Route path="/speed-converter" element={withGuard(<SpeedConverter />)} />
              <Route path="/volume-converter" element={withGuard(<VolumeConverter />)} />
              <Route path="/pressure-converter" element={withGuard(<PressureConverter />)} />
              <Route path="/energy-converter" element={withGuard(<EnergyConverter />)} />
              <Route path="/data-storage-converter" element={withGuard(<DataStorageConverter />)} />
              <Route path="/mass-weight-converter" element={withGuard(<MassWeightConverter />)} />
              <Route path="/time-converter" element={withGuard(<TimeConverter />)} />
              <Route path="/power-converter" element={withGuard(<PowerConverter />)} />
              <Route path="/force-converter" element={withGuard(<ForceConverter />)} />
              <Route path="/density-converter" element={withGuard(<DensityConverter />)} />
              <Route path="/acceleration-converter" element={withGuard(<AccelerationConverter />)} />
              <Route path="/flow-rate-converter" element={withGuard(<FlowRateConverter />)} />
              <Route path="/fuel-consumption-converter" element={withGuard(<FuelConsumptionConverter />)} />
              <Route path="/fuel-cost-calculator" element={withGuard(<FuelCostCalculator />)} />
              <Route path="/angle-converter" element={withGuard(<AngleConverter />)} />
              <Route path="/frequency-converter" element={withGuard(<FrequencyConverter />)} />
              <Route path="/data-transfer-converter" element={withGuard(<DataTransferConverter />)} />
 
              {/* Currency & Finance */}
              <Route path="/currency-converter" element={withGuard(<CurrencyConverter />)} />
              <Route path="/loan-emi-calculator" element={withGuard(<LoanEMICalculator />)} />
              <Route path="/tax-calculator" element={withGuard(<TaxCalculator />)} />
              <Route path="/mortgage-calculator" element={withGuard(<MortgageCalculator />)} />
              <Route path="/sip-calculator" element={withGuard(<SIPCalculator />)} />
              <Route path="/fd-calculator" element={withGuard(<FDCalculator />)} />
              <Route path="/rd-calculator" element={withGuard(<RDCalculator />)} />
              <Route path="/retirement-calculator" element={withGuard(<RetirementCalculator />)} />
              <Route path="/inflation-calculator" element={withGuard(<InflationCalculator />)} />
              <Route
                path="/credit-card-payoff-calculator"
                element={withGuard(<CreditCardPayoff />)}
              />
              <Route path="/roi-calculator" element={withGuard(<ROICalculator />)} />
              <Route
                path="/savings-goal-calculator"
                element={withGuard(<SavingsGoalCalculator />)}
              />
              <Route path="/car-loan-calculator" element={withGuard(<CarLoanCalculator />)} />
              <Route path="/home-loan-calculator" element={withGuard(<HomeLoanCalculator />)} />
              <Route
                path="/personal-loan-calculator"
                element={withGuard(<PersonalLoanCalculator />)}
              />
              <Route
                path="/loan-affordability-calculator"
                element={withGuard(<LoanAffordabilityCalculator />)}
              />
              <Route
                path="/debt-to-income-ratio-calculator"
                element={withGuard(<DebtToIncomeCalculator />)}
              />
              <Route path="/cagr-calculator" element={withGuard(<CAGRCalculator />)} />
              <Route
                path="/lump-sum-investment-calculator"
                element={withGuard(<LumpSumInvestmentCalculator />)}
              />
              <Route path="/pay-raise-calculator" element={withGuard(<PayRaiseCalculator />)} />
              <Route
                path="/break-even-point-calculator"
                element={withGuard(<BreakEvenPointCalculator />)}
              />
              <Route
                path="/loan-comparison-calculator"
                element={withGuard(<LoanComparisonCalculator />)}
              />
              <Route
                path="/simple-interest-calculator"
                element={withGuard(<SimpleInterestCalculator />)}
              />
              <Route
                path="/compound-interest-calculator"
                element={withGuard(<CompoundInterestCalculator />)}
              />

              {/* Math Tools */}
              <Route
                path="/percentage-calculator"
                element={withGuard(<PercentageCalculator />)}
              />
              <Route path="/average-calculator" element={withGuard(<AverageCalculator />)} />
              <Route
                path="/quadratic-equation-solver"
                element={withGuard(<QuadraticEquationSolver />)}
              />
              <Route
                path="/factorial-calculator"
                element={withGuard(<FactorialCalculator />)}
              />
              <Route
                path="/prime-number-checker"
                element={withGuard(<PrimeNumberChecker />)}
              />
              <Route
                path="/statistics-calculator"
                element={withGuard(<StatisticsCalculator />)}
              />
              <Route path="/gcd-lcm-calculator" element={withGuard(<GCDLCMCalculator />)} />
              <Route path="/log-calculator" element={withGuard(<LogCalculator />)} />
              <Route path="/equation-solver" element={withGuard(<EquationSolver />)} />

              {/* Date & Time Tools */}
              <Route path="/age-calculator" element={withGuard(<AgeCalculator />)} />
              <Route path="/date-difference" element={withGuard(<DateDifference />)} />
              <Route path="/add-subtract-days" element={withGuard(<AddSubtractDays />)} />
              <Route path="/weekday-finder" element={withGuard(<WeekdayFinder />)} />
              <Route
                path="/business-days-calculator"
                element={withGuard(<BusinessDaysCalculator />)}
              />
              <Route path="/countdown-timer" element={withGuard(<CountdownTimer />)} />
              <Route path="/timezone-converter" element={withGuard(<TimezoneConverter />)} />
              <Route
                path="/time-duration-calculator"
                element={withGuard(<TimeDurationCalculator />)}
              />
              <Route path="/week-number-finder" element={withGuard(<WeekNumberFinder />)} />
              <Route path="/calendar-generator" element={withGuard(<CalendarGenerator />)} />

              {/* Misc Tools */}
              <Route path="/qr-code-generator" element={withGuard(<QRCodeGenerator />)} />
              <Route path="/password-generator" element={withGuard(<PasswordGenerator />)} />
              <Route
                path="/random-number-generator"
                element={withGuard(<RandomNumberGenerator />)}
              />
              <Route path="/color-converter" element={withGuard(<ColorConverter />)} />
              <Route path="/text-counter" element={withGuard(<TextCounter />)} />
              <Route path="/tip-calculator" element={withGuard(<TipCalculator />)} />
              <Route
                path="/roman-numeral-converter"
                element={withGuard(<RomanNumeralConverter />)}
              />
              <Route path="/uuid-generator" element={withGuard(<UUIDGenerator />)} />
              <Route path="/base-converter" element={withGuard(<BaseConverter />)} />
              <Route
                path="/facebook-instream-revenue-estimator"
                element={withGuard(<FacebookInstreamAdsCalculator />)}
              />
              <Route
                path="/youtube-revenue-calculator"
                element={withGuard(<YouTubeRevenueCalculator />)}
              />
              <Route
                path="/app-revenue-calculator"
                element={withGuard(<AppRevenueCalculator />)}
              />
              <Route
                path="/website-revenue-calculator"
                element={withGuard(<WebsiteRevenueCalculator />)}
              />
              <Route
                path="/tiktok-revenue-calculator"
                element={withGuard(<TikTokRevenueCalculator />)}
              />

              {/* Health Tools */}
              <Route path="/bmi-calculator" element={withGuard(<BMICalculator />)} />

              {/* Admin Pages */}
              <Route
                path="/admin/upload-image"
                element={<AdminImageUpload />}
              />
              <Route path="/adminparky/login" element={<AdminLogin />} />
              <Route path="/adminparky/dashboard" element={<AdminDashboard />} />

              {/* Legal Pages */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/about-us" element={<Aboutus />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/contact-us" element={<ContactUs />} />

              {/* 404 - Fallback */}
              <Route
                path="*"
                element={<ComingSoon title="404 - Page Not Found" />}
              />
            </Routes>
          </Suspense>
        </Layout>
        </SiteConfigProvider>
          
      </Router>
    </HelmetProvider>
  );
}

export default App;
