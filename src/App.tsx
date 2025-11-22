// App.tsx
import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
const Homepage = React.lazy(() => import("./pages/Homepage"));
const CategoryPage = React.lazy(() => import("./pages/CategoryPage"));

// Currency & Finance
const CurrencyConverter = React.lazy(() => import("./pages/CurrencyConverter"));
const LoanEMICalculator = React.lazy(() => import("./pages/LoanEMICalculator"));
const CompoundInterestCalculator = React.lazy(
  () => import("./pages/CompoundInterestCalculator")
);
const TaxCalculator = React.lazy(() => import("./pages/TaxCalculator"));
const MortgageCalculator = React.lazy(
  () => import("./pages/MortgageCalculator")
);
const SIPCalculator = React.lazy(() => import("./pages/SIPCalculator"));
const FDCalculator = React.lazy(() => import("./pages/FDCalculator"));
const RDCalculator = React.lazy(() => import("./pages/RDCalculator"));
const RetirementCalculator = React.lazy(
  () => import("./pages/RetirementCalculator")
);
const InflationCalculator = React.lazy(
  () => import("./pages/InflationCalculator")
);
const CreditCardPayoff = React.lazy(
  () => import("./pages/CreditCardPayoff")
);
const ROICalculator = React.lazy(() => import("./pages/ROICalculator"));
const SavingsGoalCalculator = React.lazy(
  () => import("./pages/SavingsGoalCalculator")
);
const SimpleInterestCalculator = React.lazy(
  () => import("./pages/SimpleInterestCalculator")
);
const CarLoanCalculator = React.lazy(
  () => import("./pages/CarLoanCalculator")
);
const HomeLoanCalculator = React.lazy(
  () => import("./pages/HomeLoanCalculator")
);
const PersonalLoanCalculator = React.lazy(
  () => import("./pages/PersonalLoanCalculator")
);
const LoanAffordabilityCalculator = React.lazy(
  () => import("./pages/LoanAffordabilityCalculator")
);
const DebtToIncomeCalculator = React.lazy(
  () => import("./pages/DebtToIncomeCalculator")
);
const CAGRCalculator = React.lazy(() => import("./pages/CAGRCalculator"));
const LumpSumInvestmentCalculator = React.lazy(
  () => import("./pages/LumpSumInvestmentCalculator")
);
const PayRaiseCalculator = React.lazy(
  () => import("./pages/PayRaiseCalculator")
);
const BreakEvenPointCalculator = React.lazy(
  () => import("./pages/BreakEvenPointCalculator")
);
const LoanComparisonCalculator = React.lazy(
  () => import("./pages/LoanComparisonCalculator")
);

// Unit Converters
const LengthConverter = React.lazy(() => import("./pages/LengthConverter"));
const WeightConverter = React.lazy(() => import("./pages/WeightConverter"));
const TemperatureConverter = React.lazy(
  () => import("./pages/TemperatureConverter")
);
const AreaConverter = React.lazy(() => import("./pages/AreaConverter"));
const SpeedConverter = React.lazy(() => import("./pages/SpeedConverter"));
const PressureConverter = React.lazy(() => import("./pages/PressureConverter"));
const VolumeConverter = React.lazy(() => import("./pages/VolumeConverter"));
const EnergyConverter = React.lazy(() => import("./pages/EnergyConverter"));
const DataStorageConverter = React.lazy(
  () => import("./pages/DataStorageConverter")
);
const MassWeightConverter = React.lazy(
  () => import("./pages/MassWeightConverter")
);
const TimeConverter = React.lazy(() => import("./pages/TimeConverter"));
const PowerConverter = React.lazy(() => import("./pages/PowerConverter"));
const ForceConverter = React.lazy(() => import("./pages/ForceConverter"));
const DensityConverter = React.lazy(() => import("./pages/DensityConverter"));
const AccelerationConverter = React.lazy(
  () => import("./pages/AccelerationConverter")
);
const FlowRateConverter = React.lazy(
  () => import("./pages/FlowRateConverter")
);
const FuelConsumptionConverter = React.lazy(
  () => import("./pages/FuelConsumptionConverter")
);
const AngleConverter = React.lazy(() => import("./pages/AngleConverter"));
const FrequencyConverter = React.lazy(
  () => import("./pages/FrequencyConverter")
);
const DataTransferConverter = React.lazy(
  () => import("./pages/DataTransferConverter")
);

// Math Tools
const PercentageCalculator = React.lazy(
  () => import("./pages/PercentageCalculator")
);
const AverageCalculator = React.lazy(
  () => import("./pages/AverageCalculator")
);
const PrimeNumberChecker = React.lazy(
  () => import("./pages/PrimeNumberChecker")
);
const EquationSolver = React.lazy(() => import("./pages/EquationSolver"));
const QuadraticEquationSolver = React.lazy(
  () => import("./pages/QuadraticEquationSolver")
);
const FactorialCalculator = React.lazy(
  () => import("./pages/FactorialCalculator")
);
const StatisticsCalculator = React.lazy(
  () => import("./pages/StatisticsCalculator")
);
const GCDLCMCalculator = React.lazy(
  () => import("./pages/GCDLCMCalculator")
);
const LogCalculator = React.lazy(() => import("./pages/LogCalculator"));

// Date & Time Tools
const AgeCalculator = React.lazy(() => import("./pages/AgeCalculator"));
const DateDifference = React.lazy(() => import("./pages/DateDifference"));
const AddSubtractDays = React.lazy(() => import("./pages/AddSubtractDays"));
const WeekdayFinder = React.lazy(() => import("./pages/WeekdayFinder"));
const BusinessDaysCalculator = React.lazy(
  () => import("./pages/BusinessDaysCalculator")
);
const CountdownTimer = React.lazy(
  () => import("./pages/CountdownTimer")
);
const TimezoneConverter = React.lazy(
  () => import("./pages/TimezoneConverter")
);
const TimeDurationCalculator = React.lazy(
  () => import("./pages/TimeDurationCalculator")
);
const WeekNumberFinder = React.lazy(
  () => import("./pages/WeekNumberFinder")
);
const CalendarGenerator = React.lazy(
  () => import("./pages/CalendarGenerator")
);

// Misc Tools
const QRCodeGenerator = React.lazy(
  () => import("./pages/QRCodeGenerator")
);
const PasswordGenerator = React.lazy(
  () => import("./pages/PasswordGenerator")
);
const RandomNumberGenerator = React.lazy(
  () => import("./pages/RandomNumberGenerator")
);
const ColorConverter = React.lazy(() => import("./pages/ColorConverter"));
const TextCounter = React.lazy(() => import("./pages/TextCounter"));
const TipCalculator = React.lazy(() => import("./pages/TipCalculator"));
const RomanNumeralConverter = React.lazy(
  () => import("./pages/RomanNumeralConverter")
);
const UUIDGenerator = React.lazy(() => import("./pages/UUIDGenerator"));
const BaseConverter = React.lazy(() => import("./pages/BaseConverter"));
const FuelCostCalculator = React.lazy(
  () => import("./pages/FuelCostCalculator")
);
const YouTubeRevenueCalculator = React.lazy(
  () => import("./pages/YouTubeRevenueCalculator")
);
const FacebookInstreamAdsCalculator = React.lazy(
  () => import("./pages/FacebookInstreamAdsCalculator")
);
const AppRevenueCalculator = React.lazy(
  () => import("./pages/AppRevenueCalculator")
);
const TikTokRevenueCalculator = React.lazy(
  () => import("./pages/TikTokRevenueCalculator")
);
const WebsiteRevenueCalculator = React.lazy(
  () => import("./pages/WebsiteRevenueCalculator")
);

// Health tools
const BMICalculator = React.lazy(() => import("./pages/BMICalculator"));

// Admin & Legal
const AdminImageUpload = React.lazy(
  () => import("./pages/AdminImageUpload")
);
const AdminLogin = React.lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = React.lazy(
  () => import("./pages/AdminDashboard")
);
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));
const Aboutus = React.lazy(() => import("./pages/Aboutus"));
const Disclaimer = React.lazy(() => import("./pages/Disclaimer"));
const TermsOfService = React.lazy(
  () => import("./pages/TermsOfService")
);
const ContactUs = React.lazy(() => import("./pages/ContactUs"));

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

import GoogleAnalytics from "./components/GoogleAnalytics";

function App() {
  return (
    <HelmetProvider>
      <Router>
        <GoogleAnalytics />
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
