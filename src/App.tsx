// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Layout & Pages
import Layout from './components/Layout';
import Homepage from './pages/Homepage';
import CategoryPage from './pages/CategoryPage';

// Existing Calculators

// Currency & Finance
import CurrencyConverter from './pages/CurrencyConverter';
import LoanEMICalculator from './pages/LoanEMICalculator';
import CompoundInterestCalculator from './pages/CompoundInterestCalculator';
import TaxCalculator from './pages/TaxCalculator';
import MortgageCalculator  from './pages/MortgageCalculator';
import SIPCalculator  from './pages/SIPCalculator';
import FDCalculator  from './pages/FDCalculator';
import RDCalculator  from './pages/RDCalculator';
import RetirementCalculator  from './pages/RetirementCalculator';
import InflationCalculator  from './pages/InflationCalculator';
import CreditCardPayoff  from './pages/CreditCardPayoff';
import ROICalculator  from './pages/ROICalculator';
import SavingsGoalCalculator from './pages/SavingsGoalCalculator';
import SimpleInterestCalculator from './pages/SimpleInterestCalculator';
import CarLoanCalculator from './pages/CarLoanCalculator';
import HomeLoanCalculator from './pages/HomeLoanCalculator';
import PersonalLoanCalculator from './pages/PersonalLoanCalculator';
import LoanAffordabilityCalculator from './pages/LoanAffordabilityCalculator';
import DebtToIncomeCalculator from './pages/DebtToIncomeCalculator';
import CAGRCalculator from './pages/CAGRCalculator';
import LumpSumInvestmentCalculator from './pages/LumpSumInvestmentCalculator';
import PayRaiseCalculator from './pages/PayRaiseCalculator';
import BreakEvenPointCalculator from './pages/BreakEvenPointCalculator';
import LoanComparisonCalculator from './pages/LoanComparisonCalculator';



// Unit Converters
import LengthConverter from './pages/LengthConverter';
import WeightConverter from './pages/WeightConverter';
import TemperatureConverter from './pages/TemperatureConverter';
import AreaConverter from './pages/AreaConverter';
import SpeedConverter from './pages/SpeedConverter';
import PressureConverter from './pages/PressureConverter';
import VolumeConverter  from './pages/VolumeConverter';
import EnergyConverter  from './pages/EnergyConverter';
import DataStorageConverter  from './pages/DataStorageConverter';



// Math Tools
import PercentageCalculator from './pages/PercentageCalculator';
import AverageCalculator from './pages/AverageCalculator';
import PrimeNumberChecker from './pages/PrimeNumberChecker';
import EquationSolver from './pages/EquationSolver';
import QuadraticEquationSolver from './pages/QuadraticEquationSolver';
import FactorialCalculator from './pages/FactorialCalculator';
import StatisticsCalculator  from './pages/StatisticsCalculator';
import GCDLCMCalculator  from './pages/GCDLCMCalculator';
import LogCalculator  from './pages/LogCalculator'; 


// Date & Time Tools
import AgeCalculator from './pages/AgeCalculator';
import DateDifference from './pages/DateDifference';
import AddSubtractDays from './pages/AddSubtractDays'; 
import WeekdayFinder from './pages/WeekdayFinder';
import BusinessDaysCalculator from './pages/BusinessDaysCalculator';
import CountdownTimer from './pages/CountdownTimer';
import TimezoneConverter from './pages/TimezoneConverter';
import TimeDurationCalculator from './pages/TimeDurationCalculator';
import WeekNumberFinder from './pages/WeekNumberFinder';
import CalendarGenerator from './pages/CalendarGenerator';


// Misc Tools
import QRCodeGenerator from './pages/QRCodeGenerator';
import PasswordGenerator from './pages/PasswordGenerator';
import RandomNumberGenerator from './pages/RandomNumberGenerator';
import ColorConverter from './pages/ColorConverter';
import TextCounter from './pages/TextCounter';
import TipCalculator from './pages/TipCalculator';
import RomanNumeralConverter from './pages/RomanNumeralConverter';
import UUIDGenerator from './pages/UUIDGenerator';
import BaseConverter from './pages/BaseConverter';
import FuelCostCalculator from './pages/FuelCostCalculator';



// Health tools
import BMICalculator from './pages/BMICalculator';
// import CalorieIntakeCalculator from './pages/CalorieIntakeCalculator';  
// import BodyFatPercentageCalculator from './pages/BodyFatPercentageCalculator';
// import WaterIntakeCalculator from './pages/WaterIntakeCalculator';
// import PregnancyDueDateCalculator from './pages/PregnancyDueDateCalculator';
// import SleepDurationCalculator from './pages/SleepDurationCalculator';
// import Waist-to-HipRatioCalculator from './pages/Waist-to-HipRatioCalculator';
// import TDEECalculator from './pages/TDEECalculator';
// import LeanBodyMassCalculator from './pages/LeanBodyMassCalculator';
// import BloodAlcoholContent from './pages/BloodAlcoholContent';



// Earning Calculators
// import YouTubeIncomeCalculator from './pages/YouTubeIncomeCalculator';
// import InstagramIncomeCalculator from './pages/InstagramIncomeCalculator';
// import FacebookIncomeCalculator from './pages/FacebookIncomeCalculator';
// import TikTokIncomeCalculator from './pages/TikTokIncomeCalculator';
// import WebsiteAdRevenue from './pages/WebsiteAdRevenue';
// import AffiliateIncomeCalculato from './pages/AffiliateIncomeCalculato';
// import BlogIncomeEstimator from './pages/BlogIncomeEstimator';
// import FreelancerHourlyRateCalculator from './pages/FreelancerHourlyRateCalculator';
// import InfluencerDealValueCalculator from './pages/InfluencerDealValueCalculator';
// import AppRevenueCalculator from './pages/AppRevenueCalculator';



// Science Tools
// import AccelerationCalculator from './pages/AccelerationCalculator';
// import ChemicalEquationBalancer from './pages/ChemicalEquationBalancer';
// import DensityCalculator from './pages/DensityCalculator';
// import DNABasePairCalculator from './pages/DNABasePairCalculator';
// import ForceCalculator from './pages/ForceCalculator';
// import IdealGasLawCalculator from './pages/IdealGasLawCalculator';
// import MolarMassCalculator from './pages/MolarMassCalculator';
// import OhmsLawCalculator from './pages/OhmsLawCalculator';
// import PHCalculator from './pages/PHCalculator';
// import TorqueCalculator from './pages/TorqueCalculator';




// Business & Management Tools
// import BreakEvenPointCalculator from './pages/BreakEvenPointCalculator';
// import CAGRCalculator from './pages/CAGRCalculator';
// import CostOfGoodsSoldCalculator from './pages/CostOfGoodsSoldCalculator';
// import EmployeeBonusCalculator from './pages/EmployeeBonusCalculator';
// import LoanAffordabilityCalculator from './pages/LoanAffordabilityCalculator';
// import MarkupMarkdownCalculator from './pages/MarkupMarkdownCalculator';
// import OperatingExpenseRatioCalculator from './pages/OperatingExpenseRatioCalculator';
// import PayRaiseCalculator from './pages/PayRaiseCalculator';
// import ProfitMarginCalculator from './pages/ProfitMarginCalculator';



// Design & Digital Tools
// import AspectRatioCalculator from './pages/AspectRatioCalculator';
// import ColorContrastChecker from './pages/ColorContrastChecker';
// import DPIPpiCalculator from './pages/DPIPpiCalculator';
// import FontSizeConverter from './pages/FontSizeConverter';
// import ImageResizerTool from './pages/ImageResizerTool';
// import ResponsiveBreakpointCalculator from './pages/ResponsiveBreakpointCalculator';



// Education & Study Tools
// import ExamScoreNeededCalculator from './pages/ExamScoreNeededCalculator';
// import GPAConverter from './pages/GPAConverter';
// import GradePercentageCalculator from './pages/GradePercentageCalculator';
// import PercentageToCGPACalculator from './pages/PercentageToCGPACalculator';
// import RandomQuestionGenerator from './pages/RandomQuestionGenerator';
// import StudyTimePlanner from './pages/StudyTimePlanner';
// import TypingSpeedCalculator from './pages/TypingSpeedCalculator';


 

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
            {/* Unit Converters */}
              <Route path="/length-converter" element={<LengthConverter />} />
              <Route path="/weight-converter" element={<WeightConverter />} />
              <Route path="/temperature-converter" element={<TemperatureConverter />} />
              <Route path="/area-converter" element={<AreaConverter />} />
              <Route path="/speed-converter" element={<SpeedConverter />} />
              <Route path="/volume-converter" element={<VolumeConverter />} />
              <Route path="/pressure-converter" element={<PressureConverter />} />
              <Route path="/energy-converter" element={<EnergyConverter />} />
              <Route path="/data-storage-converter" element={<DataStorageConverter />} />

            
            {/* Currency & Finance */}
              <Route path="/currency-converter" element={<CurrencyConverter />} />
              <Route path="/tax-calculator" element={<TaxCalculator />} />
              <Route path="/mortgage-calculator" element={<MortgageCalculator />} />
              <Route path="/sip-calculator" element={<SIPCalculator />} />
              <Route path="/fd-calculator" element={<FDCalculator />} />
              <Route path="/rd-calculator" element={<RDCalculator />} />
              <Route path="/retirement-calculator" element={<RetirementCalculator />} />
              <Route path="/inflation-calculator" element={<InflationCalculator />} />
              <Route path="/credit-card-payoff-calculator" element={<CreditCardPayoff />} />
              <Route path="/roi-calculator" element={<ROICalculator />} />
              <Route path="/savings-goal-calculator" element={<SavingsGoalCalculator />} />
              <Route path="/car-loan-calculator" element={<CarLoanCalculator />} />
              <Route path="/home-loan-calculator" element={<HomeLoanCalculator />} />
              <Route path="/personal-loan-calculator" element={<PersonalLoanCalculator />} />
              <Route path="/loan-affordability-calculator" element={<LoanAffordabilityCalculator />} />
            {/*  <Route path="/debt-to-income-ratio-calculator" element={<DebtToIncomeCalculator />} /> */}
            {/*   <Route path="/cagr-calculator" element={<CAGRCalculator />} /> */}
            {/*   <Route path="/lump-sum-investment-calculator" element={<LumpSumInvestmentCalculator />} /> */}
            {/*   <Route path="/pay-raise-calculator" element={<PayRaiseCalculator />} /> */}
            {/*   <Route path="/break-even-point-calculator" element={<BreakEvenPointCalculator />} /> */}
           {/*    <Route path="/loan-comparison-calculator" element={<LoanComparisonCalculator />} /> */}

            
              <Route path="/simple-interest-calculator" element={<SimpleInterestCalculator />} />
              <Route path="/compound-interest-calculator" element=        {<CompoundInterestCalculator />} />

               
            
            
            {/* Math Tools */}
              <Route path="/percentage-calculator" element={<PercentageCalculator />} />
              <Route path="/average-calculator" element={<AverageCalculator />} />
              <Route path="/quadratic-equation-solver" element={<QuadraticEquationSolver />} />
              <Route path="/factorial-calculator" element={<FactorialCalculator />} />
              <Route path="/prime-number-checker" element={<PrimeNumberChecker />} />
              <Route path="/statistics-calculator" element={<StatisticsCalculator />} />
              <Route path="/gcd-lcm-calculator" element={<GCDLCMCalculator />} />
              <Route path="/log-calculator" element={<LogCalculator />} />
              <Route path="/equation-solver" element={<EquationSolver />} />

            
            {/* Date & Time Tools */}
              <Route path="/age-calculator" element={<AgeCalculator />} />
              <Route path="/date-difference" element={<DateDifference />} />
              <Route path="/add-subtract-days" element={<AddSubtractDays />} />
              <Route path="/weekday-finder" element={<WeekdayFinder />} />
              <Route path="/business-days-calculator" element={<BusinessDaysCalculator />} />
              <Route path="/countdown-timer" element={<CountdownTimer />} />
              <Route path="/time-zone-converter" element={<TimezoneConverter />} />
              <Route path="/time-duration-calculator" element={<TimeDurationCalculator />} />
              <Route path="/week-number-finder" element={<WeekNumberFinder />} />
              <Route path="/calendar-generator" element={<CalendarGenerator />} />
            
            
            {/* Misc Tools */}
              <Route path="/qr-code-generator" element={<QRCodeGenerator />} />
              <Route path="/password-generator" element={<PasswordGenerator />} />
              <Route path="/random-number-generator" element={<RandomNumberGenerator />} />
              <Route path="/color-converter" element={<ColorConverter />} />
              <Route path="/text-counter" element={<TextCounter />} />
              <Route path="/tip-calculator" element={<TipCalculator />} />
              <Route path="/roman-numeral-converter" element={<RomanNumeralConverter />} />
              <Route path="/uuid-generator" element={<UUIDGenerator />} />
              <Route path="/base-converter" element={<BaseConverter />} />
              <Route path="/fuel-cost-calculator" element={<FuelCostCalculator />} />
            

            
            {/* Health tools */} 
              <Route path="/bmi-calculator" element={<BMICalculator />} />  
            {/*
              <Route path="/calorie-intake-calculator" element={<CalorieIntakeCalculator />} />           
              <Route path="/body-fat-percentage-calculator" element={<BodyFatPercentageCalculator  />} />  
              <Route path="/water-intake-calculator" element={<WaterIntakeCalculator />} />  
              <Route path="/pregnancy-due-date-calculator" element={<PregnancyDueDateCalculator />} />  
              <Route path="/sleep-duration-calculator" element={<SleepDurationCalculator />} />  
              <Route path="/waist-to-hip-ratio-calculator" element={<WaistToHipRatioCalculator  />} />  
              <Route path="/tdee-calculator" element={<TDEECalculator />} />  
              <Route path="/lean-body-mass-calculator" element={<LeanBodyMassCalculator />} />  
              <Route path="/blood-alcohol-content" element={<BloodAlcoholContent  />} />   

            */}
            

              
            {/* Earning Calculators */}
            {/*
              <Route path="/youtube-income-calculator" element={<YouTubeIncomeCalculator  />} /> 
              <Route path="/instagram-income-calculator" element={<InstagramIncomeCalculator  />} /> 
              <Route path="/facebook-income-calculator" element={<FacebookIncomeCalculator  />} /> 
              <Route path="/tiktok-income-calculator" element={<TikTokIncomeCalculator  />} /> 
              <Route path="/website-ad-revenue" element={<WebsiteAdRevenue  />} /> 
              <Route path="/affiliate-income-calculato" element={<AffiliateIncomeCalculato  />} /> 
              <Route path="/blog-income-estimator" element={<BlogIncomeEstimator  />} /> 
              <Route path="/freelancer-hourly-rate-calculator" element={<FreelancerHourlyRateCalculator  />} /> 
              <Route path="/influencer-deal-value-calculator" element={<InfluencerDealValueCalculator  />} /> 
              <Route path="/app-revenue-calculator" element={<AppRevenueCalculator  />} />

            */}
 
  
            

            
            {/* Science Tools */}
            {/*
              <Route path="/acceleration-calculator" element={<AccelerationCalculator />} /> 
              <Route path="/chemical-equation-balancer" element={<ChemicalEquationBalancer />} />  
              <Route path="/density-calculator" element={<DensityCalculator />} />  
              <Route path="/dnabase-pair-calculator" element={<DNABasePairCalculator />} />  
              <Route path="/force-calculator" element={<ForceCalculator />} />  
              <Route path="/ideal-gaslaw-calculator" element={<IdealGasLawCalculator />} />  
              <Route path="/molar-mass-calculator" element={<MolarMassCalculator />} />  
              <Route path="/ohms-law-calculator" element={<OhmsLawCalculator />} />  
              <Route path="/ph-calculator" element={<PHCalculator />} />  
              <Route path="/torque-calculator" element={<TorqueCalculator />} /> 
          */}

 
 
 
 







            

            
            {/* Business & Management Tools */}
            {/*
              <Route path="/breakeven-point-calculator" element={<BreakEvenPointCalculator />} />  
              <Route path="/cagr-calculator" element={<CAGRCalculator />} />  
              <Route path="/cost-of-goods-sold-calculator" element={<CostOfGoodsSoldCalculator />} />  
              <Route path="/employee-bonus-calculator" element={<EmployeeBonusCalculator />} />  
              <Route path="/loan-affordability-calculator" element={<LoanAffordabilityCalculator />} />  
              <Route path="/markup-markdown-calculator" element={<MarkupMarkdownCalculator />} />  
              <Route path="/operating-expense-ratio-calculator" element={<OperatingExpenseRatioCalculator />} />  
              <Route path="/pay-raise-calculator" element={<PayRaiseCalculator />} />  
              <Route path="/profit-margin-calculator" element={<ProfitMarginCalculator />} />  
            */}



            

            
            {/* Design & Digital Tools */}
            {/*
              <Route path="/aspect-ratio-calculator" element={<AspectRatioCalculator />} />  
              <Route path="/color-contrast-checker" element={<ColorContrastChecker />} />  
              <Route path="/dpippi-calculator" element={<DPIPpiCalculator />} />  
              <Route path="/font-size-converter" element={<FontSizeConverter />} />  
              <Route path="/image-resizer-tool" element={<ImageResizerTool />} />  
              <Route path="/responsive-breakpoint-calculator" element={<ResponsiveBreakpointCalculator />} />  
          */}





            
            {/* Education & Study Tools */}
            {/*
                <Route path="/exam-score-needed-calculator" element={<ExamScoreNeededCalculator />} />  
                <Route path="/gpa-converter" element={<GPAConverter />} />  
                <Route path="/grade-percentage-calculator" element={<GradePercentageCalculator />} />  
                <Route path="/percentage-to-cgpa-calculator" element={<PercentageToCGPACalculator />} />  
                <Route path="/random-question-generator" element={<RandomQuestionGenerator />} />  
                <Route path="/study-time-planner" element={<StudyTimePlanner />} />  
                <Route path="/typing-speed-calculator" element={<TypingSpeedCalculator />} />  

            */}
            



            {/* ✅ Admin Pages */}
              <Route path="/admin/upload-image" element={<AdminImageUpload />} />


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
