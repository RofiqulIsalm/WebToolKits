import { 
  DollarSign, Ruler, Scale, Thermometer, Square, Zap, Calculator, Percent, 
  BarChart3, Calendar, Clock, QrCode, Key, PiggyBank, TrendingUp, Receipt,
  Home, CreditCard, Target, Banknote, Building, Coins, Shuffle, Hash,
  Type, Coffee, Compass, Cpu, Car, Timer, Globe, Activity, Sigma,
  Binary, Beaker, HardDrive, Gauge, Droplets, Flame, Ruler, Scale, Thermometer, Square, Zap,   Droplets, Gauge, Flame, HardDrive, Clock, Battery, Activity, Layers, TrendingUp, Wind,       Fuel, Compass, Radio, Network
} from 'lucide-react';

export const toolsData = [
  {
    category: 'Currency & Finance',
    slug: 'currency-finance',
    tools: [
      {
        name: 'Currency Converter',
        description: 'Convert between different currencies with live rates',
        icon: DollarSign,
        path: '/currency-converter',
        color: 'currency-card',
        popular: true
      },
      {
        name: 'Loan EMI Calculator',
        description: 'Calculate your loan EMI with interest rates',
        icon: PiggyBank,
        path: '/loan-emi-calculator',
        color: 'finance-card',
        popular: true
      },
      {
        name: 'Compound Interest Calculator',
        description: 'Calculate compound interest on investments',
        icon: TrendingUp,
        path: '/compound-interest-calculator',
        color: 'finance-card'
      },
      {
        name: 'Tax Calculator',
        description: 'Calculate income tax and take-home salary',
        icon: Receipt,
        path: '/tax-calculator',
        color: 'finance-card'
      },
      {
        name: 'Mortgage Calculator',
        description: 'Calculate monthly mortgage payments and total cost',
        icon: Home,
        path: '/mortgage-calculator',
        color: 'finance-card'
      },
      {
        name: 'SIP Calculator',
        description: 'Calculate returns on Systematic Investment Plans',
        icon: TrendingUp,
        path: '/sip-calculator',
        color: 'finance-card'
      },
      {
        name: 'FD Calculator',
        description: 'Calculate Fixed Deposit maturity amount and interest',
        icon: Banknote,
        path: '/fd-calculator',
        color: 'finance-card'
      },
      {
        name: 'RD Calculator',
        description: 'Calculate Recurring Deposit maturity amount',
        icon: Coins,
        path: '/rd-calculator',
        color: 'finance-card'
      },
      {
        name: 'Retirement Calculator',
        description: 'Plan your retirement savings and goals',
        icon: Building,
        path: '/retirement-calculator',
        color: 'finance-card'
      },
      {
        name: 'Inflation Calculator',
        description: 'Calculate the impact of inflation over time',
        icon: TrendingUp,
        path: '/inflation-calculator',
        color: 'finance-card'
      },
      {
        name: 'Credit Card Payoff Calculator',
        description: 'Calculate time and interest to pay off credit cards',
        icon: CreditCard,
        path: '/credit-card-payoff-calculator',
        color: 'finance-card'
      },
      {
        name: 'Savings Goal Calculator',
        description: 'Calculate how much to save to reach your goals',
        icon: Target,
        path: '/savings-goal-calculator',
        color: 'finance-card'
      },
      {
        name: 'Simple Interest Calculator',
        description: 'Calculate simple interest on loans and investments',
        icon: Calculator,
        path: '/simple-interest-calculator',
        color: 'finance-card'
      },
      {
        name: 'ROI Calculator',
        description: 'Calculate Return on Investment percentage',
        icon: TrendingUp,
        path: '/roi-calculator',
        color: 'finance-card'
      },
      {
        name: 'Car Loan Calculator',
        description: 'Estimate your car loan EMI, total interest, and total payment',
        icon: Car,
        path: '/car-loan-calculator',
        color: 'finance-card',
        popular: true
      },
      {
        name: 'Home Loan Calculator',
        description: 'Estimate you home loan EMI, total interest, and total payment',
        icon: Home,
        path: '/home-loan-calculator',
        color: 'finance-card',
        popular: true
      },
      {
        name: 'Personal Loan Calculator',
        description: 'Estimate you personal loan EMI, total interest, and total payment',
        icon: Home,
        path: '/personal-loan-calculator',
        color: 'finance-card',
        popular: false
      },
            {
        name: 'Loan Affordability Calculator',
        description: 'Find out how much loan you can afford based on your income and expenses',
        icon: PiggyBank,
        path: '/loan-affordability-calculator',
        color: 'finance-card',
        popular: false
      },
      {
        name: 'Debt-to-Income Ratio Calculator (DTI)',
        description: 'Calculate your DTI ratio to assess your financial health and loan eligibility',
        icon: Calculator,
        path: '/debt-to-income-ratio-calculator',
        color: 'finance-card',
        popular: false
      },
      {
        name: 'CAGR Calculator',
        description: 'Calculate the Compound Annual Growth Rate of your investments',
        icon: TrendingUp,
        path: '/cagr-calculator',
        color: 'finance-card',
        popular: false
      },
      {
        name: 'Lump Sum Investment Calculator',
        description: 'Estimate returns on a one-time investment over time',
        icon: Banknote,
        path: '/lump-sum-investment-calculator',
        color: 'finance-card',
        popular: false
      },
      {
        name: 'Pay Raise / Salary Hike Calculator',
        description: 'Calculate your new salary and percentage increase after a pay raise',
        icon: Receipt,
        path: '/pay-raise-calculator',
        color: 'finance-card',
        popular: false
      },
      {
        name: 'Break-Even Point Calculator',
        description: 'Calculate the break-even sales or revenue needed to cover costs',
        icon: BarChart3,
        path: '/break-even-point-calculator',
        color: 'finance-card',
        popular: false
      },
      {
        name: 'Loan Comparison Calculator',
        description: 'Compare two different loan offers based on interest rates and tenures',
        icon: Scale,
        path: '/loan-comparison-calculator',
        color: 'finance-card',
        popular: false
      }
    ]
  },
  {
    category: 'Unit Converters',
    slug: 'unit-converters',
    tools: [
      {
        name: 'Length Converter',
        description: 'Convert between meters, feet, inches, and more',
        icon: Ruler,
        path: '/length-converter',
        color: 'converter-card',
        popular: true
      },
      {
        name: 'Weight Converter',
        description: 'Convert between kg, pounds, ounces, and more',
        icon: Scale,
        path: '/weight-converter',
        color: 'converter-card'
      },
      {
        name: 'Temperature Converter',
        description: 'Convert between Celsius, Fahrenheit, and Kelvin',
        icon: Thermometer,
        path: '/temperature-converter',
        color: 'converter-card',
        popular: true
      },
      {
        name: 'Area Converter',
        description: 'Convert between square meters, acres, and more',
        icon: Square,
        path: '/area-converter',
        color: 'converter-card'
      },
      {
        name: 'Speed Converter',
        description: 'Convert between mph, kmh, and other speed units',
        icon: Zap,
        path: '/speed-converter',
        color: 'converter-card'
      },
      {
        name: 'Volume Converter',
        description: 'Convert between liters, gallons, cups, and more',
        icon: Droplets,
        path: '/volume-converter',
        color: 'converter-card'
      },
      {
        name: 'Pressure Converter',
        description: 'Convert between PSI, bar, pascal, and more',
        icon: Gauge,
        path: '/pressure-converter',
        color: 'converter-card'
      },
      {
        name: 'Energy Converter',
        description: 'Convert between joules, calories, BTU, and more',
        icon: Flame,
        path: '/energy-converter',
        color: 'converter-card'
      },
      {
        name: 'Data Storage Converter',
        description: 'Convert between bytes, KB, MB, GB, TB, and more',
        icon: HardDrive,
        path: '/data-storage-converter',
        color: 'converter-card'
      },
      {
        name: 'Mass Weight Converter',
        description: 'Convert between bytes, KB, MB, GB, TB, and more',
        icon: Scale,
        path: '/mass-weight-converter',
        color: 'converter-card'
      },
      {
        name: 'Time Converter',
        description: 'Convert between seconds, minutes, hours, and days',
        icon: Clock,
        path: '/time-converter',
        color: 'converter-card'
      },
      {
        name: 'Power Converter',
        description: 'Convert between watts, kilowatts, horsepower, and more',
        icon: Battery,
        path: '/power-converter',
        color: 'converter-card'
      },
      {
        name: 'Force Converter',
        description: 'Convert between newtons, pound-force, and kilogram-force',
        icon: Activity,
        path: '/force-converter',
        color: 'converter-card'
      },
      {
        name: 'Density Converter',
        description: 'Convert between kg/m³, g/cm³, lb/ft³, and more',
        icon: Layers,
        path: '/density-converter',
        color: 'converter-card'
      },
      {
        name: 'Acceleration Converter',
        description: 'Convert between m/s², g-force, and ft/s²',
        icon: TrendingUp,
        path: '/acceleration-converter',
        color: 'converter-card'
      },
      {
        name: 'Flow Rate Converter',
        description: 'Convert between L/min, m³/h, gpm, and more',
        icon: Wind,
        path: '/flow-rate-converter',
        color: 'converter-card'
      },
      {
        name: 'Fuel Consumption Converter',
        description: 'Convert between L/100km, mpg (US/UK), and km/L',
        icon: Fuel,
        path: '/fuel-consumption-converter',
        color: 'converter-card'
      },
      {
        name: 'Angle Converter',
        description: 'Convert between degrees, radians, and gradians',
        icon: Compass,
        path: '/angle-converter',
        color: 'converter-card'
      },
      {
        name: 'Frequency Converter',
        description: 'Convert between hertz, kilohertz, megahertz, and rpm',
        icon: Radio,
        path: '/frequency-converter',
        color: 'converter-card'
      },
      {
        name: 'Data Transfer Converter',
        description: 'Convert between bits per second, Mbps, and MB/s',
        icon: Network,
        path: '/data-transfer-converter',
        color: 'converter-card'
      }
    ]
  },
  category: 'Healt',
    slug: 'healt-chack',
    tools: [
      {
        name: 'Healt chack',
        description: 'Convert between different currencies with live rates',
        icon: DollarSign,
        path: '/healt-chack',
        color: 'currency-card',
        popular: true
      }
  {
    category: 'Math Tools',
    slug: 'math-tools',
    tools: [
      {
        name: 'BMI Calculator',
        description: 'Calculate your Body Mass Index',
        icon: Activity,
        path: '/bmi-calculator',
        color: 'math-card',
        popular: true
      },
      {
        name: 'Percentage Calculator',
        description: 'Calculate percentages, percentage increase/decrease',
        icon: Percent,
        path: '/percentage-calculator',
        color: 'math-card',
        popular: true
      },
      {
        name: 'Average Calculator',
        description: 'Calculate mean, median, and mode of numbers',
        icon: BarChart3,
        path: '/average-calculator',
        color: 'math-card'
      },
      {
        name: 'Quadratic Equation Solver',
        description: 'Solve quadratic equations and find roots',
        icon: Calculator,
        path: '/quadratic-equation-solver',
        color: 'math-card'
      },
      {
        name: 'Factorial Calculator',
        description: 'Calculate factorial, permutation, and combination',
        icon: Hash,
        path: '/factorial-calculator',
        color: 'math-card'
      },
      {
        name: 'Prime Number Checker',
        description: 'Check if a number is prime and find prime factors',
        icon: Hash,
        path: '/prime-number-checker',
        color: 'math-card'
      },
      {
        name: 'Statistics Calculator',
        description: 'Calculate mean, median, mode, and standard deviation',
        icon: Sigma,
        path: '/statistics-calculator',
        color: 'math-card'
      },
      {
        name: 'GCD LCM Calculator',
        description: 'Find Greatest Common Divisor and Least Common Multiple',
        icon: Calculator,
        path: '/gcd-lcm-calculator',
        color: 'math-card'
      },
      {
        name: 'Log Calculator',
        description: 'Calculate logarithms and exponential functions',
        icon: Calculator,
        path: '/log-calculator',
        color: 'math-card'
      },
      {
        name: 'Equation Solver',
        description: 'Solve linear and polynomial equations',
        icon: Calculator,
        path: '/equation-solver',
        color: 'math-card'
      }
    ]
  },
  {
    category: 'Date & Time Tools',
    slug: 'date-time-tools',
    tools: [
      {
        name: 'Age Calculator',
        description: 'Calculate your exact age in years, months, and days',
        icon: Calendar,
        path: '/age-calculator',
        color: 'datetime-card'
      },
      {
        name: 'Date Difference Calculator',
        description: 'Calculate the difference between two dates',
        icon: Clock,
        path: '/date-difference',
        color: 'datetime-card'
      },
      {
        name: 'Add Subtract Days Calculator',
        description: 'Add or subtract days from any date',
        icon: Calendar,
        path: '/add-subtract-days',
        color: 'datetime-card'
      },
      {
        name: 'Weekday Finder',
        description: 'Find what day of the week any date falls on',
        icon: Calendar,
        path: '/weekday-finder',
        color: 'datetime-card'
      },
      {
        name: 'Business Days Calculator',
        description: 'Calculate business days between dates',
        icon: Calendar,
        path: '/business-days-calculator',
        color: 'datetime-card'
      },
      {
        name: 'Countdown Timer',
        description: 'Create countdown timers for events and deadlines',
        icon: Timer,
        path: '/countdown-timer',
        color: 'datetime-card'
      },
      {
        name: 'Time Zone Converter',
        description: 'Convert time between different time zones',
        icon: Globe,
        path: '/time-zone-converter',
        color: 'datetime-card'
      },
      {
        name: 'Time Duration Calculator',
        description: 'Calculate duration between two times',
        icon: Clock,
        path: '/time-duration-calculator',
        color: 'datetime-card'
      },
      {
        name: 'Week Number Finder',
        description: 'Find the week number for any date',
        icon: Calendar,
        path: '/week-number-finder',
        color: 'datetime-card'
      },
      {
        name: 'Calendar Generator',
        description: 'Generate printable calendars for any month/year',
        icon: Calendar,
        path: '/calendar-generator',
        color: 'datetime-card'
      }
    ]
  },
  {
    category: 'Misc Tools',
    slug: 'misc-tools',
    tools: [
      {
        name: 'QR Code Generator',
        description: 'Generate QR codes for text, URLs, and more',
        icon: QrCode,
        path: '/qr-code-generator',
        color: 'misc-card'
      },
      {
        name: 'Password Generator',
        description: 'Generate secure random passwords',
        icon: Key,
        path: '/password-generator',
        color: 'misc-card'
      },
      {
        name: 'Random Number Generator',
        description: 'Generate random numbers within specified ranges',
        icon: Shuffle,
        path: '/random-number-generator',
        color: 'misc-card'
      },
      {
        name: 'Color Converter',
        description: 'Convert between HEX, RGB, HSL color formats',
        icon: Beaker,
        path: '/color-converter',
        color: 'misc-card'
      },
      {
        name: 'Text Counter',
        description: 'Count words, characters, and paragraphs in text',
        icon: Type,
        path: '/text-counter',
        color: 'misc-card'
      },
      {
        name: 'Tip Calculator',
        description: 'Calculate tips and split bills among friends',
        icon: Coffee,
        path: '/tip-calculator',
        color: 'misc-card'
      },
      {
        name: 'Roman Numeral Converter',
        description: 'Convert between numbers and Roman numerals',
        icon: Hash,
        path: '/roman-numeral-converter',
        color: 'misc-card'
      },
      {
        name: 'UUID Generator',
        description: 'Generate unique identifiers (UUID/GUID)',
        icon: Hash,
        path: '/uuid-generator',
        color: 'misc-card'
      },
      {
        name: 'Base Converter',
        description: 'Convert between binary, decimal, and hexadecimal',
        icon: Binary,
        path: '/base-converter',
        color: 'misc-card'
      },
      {
        name: 'Fuel Cost Calculator',
        description: 'Calculate fuel costs and mileage for trips',
        icon: Car,
        path: '/fuel-cost-calculator',
        color: 'misc-card'
      }
    ]
  }
];

// Get top 6 most popular calculators across all categories
export const getPopularCalculators = () => {
  const allTools = toolsData.flatMap(category => category.tools);
  return allTools.filter(tool => tool.popular).slice(0, 6);
};