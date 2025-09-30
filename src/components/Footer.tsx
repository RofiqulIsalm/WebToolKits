import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900/90 backdrop-blur-lg border-t border-blue-500/20 mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="font-semibold text-white mb-4">About CalculatorHub</h3>
            <p className="text-slate-300 text-sm">
              <strong>CalculatorHub</strong> is your trusted platform for free online calculators 
              and converters. From <Link to="/bmi-calculator" className="text-blue-400 hover:underline">health calculators</Link> 
              to <Link to="/loan-emi-calculator" className="text-blue-400 hover:underline">finance tools</Link>, 
              we provide accurate, fast, and privacy-friendly solutions. 
              No sign-up required – just calculate instantly.
            </p>
          </div>

          {/* Popular Tools Section */}
          <div>
            <h3 className="font-semibold text-white mb-4">Popular Tools</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/currency-converter" className="text-slate-300 hover:text-blue-400 transition-colors">Currency Converter</Link></li>
              <li><Link to="/bmi-calculator" className="text-slate-300 hover:text-blue-400 transition-colors">BMI Calculator</Link></li>
              <li><Link to="/loan-emi-calculator" className="text-slate-300 hover:text-blue-400 transition-colors">Loan EMI Calculator</Link></li>
              <li><Link to="/percentage-calculator" className="text-slate-300 hover:text-blue-400 transition-colors">Percentage Calculator</Link></li>
              <li><Link to="/length-converter" className="text-slate-300 hover:text-blue-400 transition-colors">Length Converter</Link></li>
              <li><Link to="/qr-code-generator" className="text-slate-300 hover:text-blue-400 transition-colors">QR Code Generator</Link></li>
            </ul>
          </div>

          {/* Legal & Info Section */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/age-calculator" className="text-slate-300 hover:text-blue-400 transition-colors">Age Calculator</Link></li>
              <li><Link to="/password-generator" className="text-slate-300 hover:text-blue-400 transition-colors">Password Generator</Link></li>
              <li><Link to="/date-difference" className="text-slate-300 hover:text-blue-400 transition-colors">Date Difference</Link></li>
              <li><Link to="/average-calculator" className="text-slate-300 hover:text-blue-400 transition-colors">Average Calculator</Link></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Note */}
        <div className="border-t border-slate-700 mt-8 pt-8 text-center">
          <p className="text-slate-300 text-sm">
            © 2025 CalculatorHub.site – Free Online Calculators & Converters. 
            All rights reserved.
          </p>
          <p className="text-slate-400 text-xs mt-2">
            Trusted for <strong>math calculators</strong>, <strong>finance tools</strong>, 
            <strong>unit conversions</strong>, and <strong>health calculators</strong> – 
            helping users calculate smarter every day.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
