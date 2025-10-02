// SEO data for all pages
export const seoData = {
  homepage: {
    title: "Free Online Calculators & Converters - 64+ Tools",
    description: "Free online calculators and converters for daily use. Currency converter, BMI calculator, loan EMI, unit converters, math tools, and more. No signup required.",
    keywords: "calculator, converter, tools, currency converter, BMI calculator, loan calculator, unit converter, math calculator, percentage calculator"
  },
  
  // Currency & Finance
  currencyConverter: {
    title: "Currency Converter - Live Exchange Rates",
    description: "Convert between 150+ currencies with live exchange rates. Free currency converter with USD, EUR, GBP, JPY, and more. Updated real-time rates.",
    keywords: "currency converter, exchange rates, USD to EUR, currency calculator, foreign exchange, live rates"
  },
  loanEmiCalculator: {
    title: "Loan EMI Calculator - Monthly Payment Calculator",
    description: "Calculate loan EMI, total interest, and payment schedule. Free loan calculator for home loans, personal loans, car loans with detailed breakdown.",
    keywords: "loan EMI calculator, monthly payment calculator, loan calculator, EMI calculation, interest calculator"
  },
  compoundInterestCalculator: {
    title: "Compound Interest Calculator - Investment Growth",
    description: "Calculate compound interest on investments and savings. Free compound interest calculator with detailed breakdown and growth projections.",
    keywords: "compound interest calculator, investment calculator, savings calculator, interest calculation"
  },
  taxCalculator: {
    title: "Income Tax Calculator - Tax Calculator 2024-25",
    description: "Calculate income tax for FY 2024-25 under old and new tax regimes. Free tax calculator with salary breakdown and tax-saving tips.",
    keywords: "income tax calculator, tax calculator, salary calculator, tax calculation, income tax"
  },

  // Unit Converters
  lengthConverter: {
    title: "Length Converter - Meters, Feet, Inches Converter",
    description: "Convert between meters, feet, inches, kilometers, miles, and more. Free length converter with instant results and all measurement units.",
    keywords: "length converter, distance converter, meters to feet, inches to cm, unit converter"
  },
  weightConverter: {
    title: "Weight Converter - Kg, Pounds, Ounces Converter",
    description: "Convert between kilograms, pounds, ounces, grams, and more. Free weight converter with instant results for all weight units.",
    keywords: "weight converter, mass converter, kg to pounds, weight calculator, unit converter"
  },
  temperatureConverter: {
    title: "Temperature Converter - Celsius, Fahrenheit, Kelvin",
    description: "Convert between Celsius, Fahrenheit, and Kelvin. Free temperature converter with instant results and temperature scales.",
    keywords: "temperature converter, celsius to fahrenheit, temperature calculator, unit converter"
  },
  areaConverter: {
    title: "Area Converter - Square Meters, Acres, Hectares",
    description: "Convert between square meters, acres, hectares, square feet, and more. Free area converter for land measurement and calculations.",
    keywords: "area converter, square meters to acres, area calculator, land measurement, unit converter"
  },
  speedConverter: {
    title: "Speed Converter - MPH, KMH, Knots Converter",
    description: "Convert between mph, kmh, knots, meters per second, and more. Free speed converter with instant results for all velocity units.",
    keywords: "speed converter, velocity converter, mph to kmh, speed calculator, unit converter"
  },

  // Math Tools
  bmiCalculator: {
    title: "BMI Calculator - Body Mass Index Calculator",
    description: "Calculate your BMI (Body Mass Index) with height and weight. Free BMI calculator with health categories and ideal weight ranges.",
    keywords: "BMI calculator, body mass index, BMI calculation, health calculator, weight calculator"
  },
  percentageCalculator: {
    title: "Percentage Calculator - Calculate Percentages",
    description: "Calculate percentages, percentage increase, decrease, and more. Free percentage calculator with multiple calculation modes.",
    keywords: "percentage calculator, percent calculator, percentage calculation, math calculator"
  },
  averageCalculator: {
    title: "Average Calculator - Mean, Median, Mode Calculator",
    description: "Calculate mean, median, mode, and statistical averages. Free average calculator with detailed statistical analysis.",
    keywords: "average calculator, mean calculator, median calculator, statistics calculator, math calculator"
  },
  ageCalculator: {
    title: "Age Calculator - Calculate Your Exact Age",
    description: "Calculate your exact age in years, months, days, hours, and minutes. Free age calculator with detailed age breakdown.",
    keywords: "age calculator, age calculation, date calculator, birthday calculator"
  },

  // Date & Time Tools
  dateDifference: {
    title: "Date Difference Calculator - Days Between Dates",
    description: "Calculate the difference between two dates in days, weeks, months, and years. Free date calculator with detailed breakdown.",
    keywords: "date difference calculator, days between dates, date calculator, time calculator"
  },

  // Misc Tools
  qrCodeGenerator: {
    title: "QR Code Generator - Free QR Code Maker",
    description: "Generate QR codes for text, URLs, WiFi, contact info, and more. Free QR code generator with customizable size and error correction.",
    keywords: "QR code generator, QR code maker, QR code creator, barcode generator"
  },
  passwordGenerator: {
    title: "Password Generator - Secure Random Passwords",
    description: "Generate secure, random passwords with customizable length and character sets. Free password generator for strong security.",
    keywords: "password generator, random password, secure password, password creator"
  },

  // Category Pages
  categoryPages: {
    'currency-finance': {
      title: "Currency & Finance Calculators - 14 Free Tools",
      description: "Free currency and finance calculators including currency converter, loan EMI, compound interest, tax calculator, and more financial tools.",
      keywords: "finance calculators, currency converter, loan calculator, investment calculator, financial tools"
    },
    'unit-converters': {
      title: "Unit Converters - 10 Free Conversion Tools",
      description: "Free unit converters for length, weight, temperature, area, speed, volume, and more. Convert between metric and imperial units instantly.",
      keywords: "unit converter, measurement converter, metric converter, conversion calculator"
    },
    'math-tools': {
      title: "Math Calculators - 10 Free Mathematical Tools",
      description: "Free math calculators including BMI, percentage, average, statistics, and more mathematical tools for students and professionals.",
      keywords: "math calculator, mathematical tools, statistics calculator, algebra calculator"
    },
    'date-time-tools': {
      title: "Date & Time Calculators - 10 Free Tools",
      description: "Free date and time calculators including age calculator, date difference, business days, and more time-related tools.",
      keywords: "date calculator, time calculator, age calculator, calendar tools"
    },
    'misc-tools': {
      title: "Miscellaneous Tools - 10 Free Utility Tools",
      description: "Free utility tools including QR code generator, password generator, color converter, text counter, and more useful tools.",
      keywords: "utility tools, QR code generator, password generator, online tools"
    }
  },

  // Legal Pages
  privacyPolicy: {
    title: "Privacy Policy - CalculatorHub",
    description: "Privacy policy for CalculatorHub. Learn how we protect your data and privacy while using our free online calculators and tools.",
    keywords: "privacy policy, data protection, privacy, terms"
  },
  termsOfService: {
    title: "Terms of Service - CalculatorHub",
    description: "Terms of service for CalculatorHub. Read our terms and conditions for using our free online calculators and conversion tools.",
    keywords: "terms of service, terms and conditions, legal, usage terms"
  },
  contactUs: {
    title: "Contact Us - CalculatorHub Support",
    description: "Contact CalculatorHub support team. Get help with our calculators, report issues, or suggest new tools. We respond within 24 hours.",
    keywords: "contact us, support, help, feedback, calculator support"
  }
};

// Generate SoftwareApplication schema for calculator pages
export const generateCalculatorSchema = (
  name: string,
  description: string,
  url: string,
  category: string
) => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": name,
  "description": description,
  "url": `https://calculatorhub.com${url}`,
  "applicationCategory": "UtilityApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "creator": {
    "@type": "Organization",
    "name": "CalculatorHub",
    "url": "https://calculatorhub.com"
  },
  "datePublished": "2025-01-01",
  "dateModified": "2025-01-01",
  "inLanguage": "en-US",
  "isAccessibleForFree": true,
  "keywords": category,
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "1250",
    "bestRating": "5",
    "worstRating": "1"
  }
});

// Generate Organization schema
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "CalculatorHub",
  "url": "https://calculatorhub.com",
  "logo": "https://calculatorhub.com/logo.png",
  "description": "Free online calculators and converters for daily use",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "support@calculatorhub.com"
  },
  "sameAs": [
    "https://twitter.com/CalculatorHub",
    "https://facebook.com/CalculatorHub"
  ]
};