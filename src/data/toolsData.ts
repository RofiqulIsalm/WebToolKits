import { 
  DollarSign, Ruler, Scale, Thermometer, Square, Zap,
  Calculator, Percent, BarChart3, Calendar, Clock,
  QrCode, Key, PiggyBank, TrendingUp, Receipt
} from 'lucide-react';

export const toolsData = [
  {
    category: 'Currency & Finance',
    tools: [
      {
        name: 'Currency Converter',
        description: 'Convert between different currencies with live rates',
        icon: DollarSign,
        path: '/currency-converter',
        color: 'glow-card'
      },
      {
        name: 'Loan EMI Calculator',
        description: 'Calculate your loan EMI with interest rates',
        icon: PiggyBank,
        path: '/loan-emi-calculator',
        color: 'glow-card'
      },
      {
        name: 'Compound Interest',
        description: 'Calculate compound interest on investments',
        icon: TrendingUp,
        path: '/compound-interest-calculator',
        color: 'glow-card'
      },
      {
        name: 'Tax Calculator',
        description: 'Calculate income tax and take-home salary',
        icon: Receipt,
        path: '/tax-calculator',
        color: 'glow-card'
      }
    ]
  },
  {
    category: 'Unit Converters',
    tools: [
      {
        name: 'Length Converter',
        description: 'Convert between meters, feet, inches, and more',
        icon: Ruler,
        path: '/length-converter',
        color: 'glow-card'
      },
      {
        name: 'Weight Converter',
        description: 'Convert between kg, pounds, ounces, and more',
        icon: Scale,
        path: '/weight-converter',
        color: 'glow-card'
      },
      {
        name: 'Temperature Converter',
        description: 'Convert between Celsius, Fahrenheit, and Kelvin',
        icon: Thermometer,
        path: '/temperature-converter',
        color: 'glow-card'
      },
      {
        name: 'Area Converter',
        description: 'Convert between square meters, acres, and more',
        icon: Square,
        path: '/area-converter',
        color: 'glow-card'
      },
      {
        name: 'Speed Converter',
        description: 'Convert between mph, kmh, and other speed units',
        icon: Zap,
        path: '/speed-converter',
        color: 'glow-card'
      }
    ]
  },
  {
    category: 'Math Tools',
    tools: [
      {
        name: 'BMI Calculator',
        description: 'Calculate your Body Mass Index',
        icon: Calculator,
        path: '/bmi-calculator',
        color: 'glow-card'
      },
      {
        name: 'Percentage Calculator',
        description: 'Calculate percentages, percentage increase/decrease',
        icon: Percent,
        path: '/percentage-calculator',
        color: 'glow-card'
      },
      {
        name: 'Average Calculator',
        description: 'Calculate mean, median, and mode of numbers',
        icon: BarChart3,
        path: '/average-calculator',
        color: 'glow-card'
      }
    ]
  },
  {
    category: 'Date & Time Tools',
    tools: [
      {
        name: 'Age Calculator',
        description: 'Calculate your exact age in years, months, and days',
        icon: Calendar,
        path: '/age-calculator',
        color: 'glow-card'
      },
      {
        name: 'Date Difference',
        description: 'Calculate the difference between two dates',
        icon: Clock,
        path: '/date-difference',
        color: 'glow-card'
      }
    ]
  },
  {
    category: 'Misc Tools',
    tools: [
      {
        name: 'QR Code Generator',
        description: 'Generate QR codes for text, URLs, and more',
        icon: QrCode,
        path: '/qr-code-generator',
        color: 'glow-card'
      },
      {
        name: 'Password Generator',
        description: 'Generate secure random passwords',
        icon: Key,
        path: '/password-generator',
        color: 'glow-card'
      }
    ]
  }
];