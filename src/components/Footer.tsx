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
              <li><Link to="/unit-converter" className="text-slate-300 hover:text-blue-400 transition-colors">Unit Converter</Link></li>
              <li><Link to="/scientific-calculator" className="text-slate-300 hover:text-blue-400 transition-colors">Scientific Calculator</Link></li>
            </ul>
          </div>

          {/* Legal & Info Section */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/privacy-policy" className="text-slate-300 hover:text-blue-400 transition-colors">Privacy Policy</a></li>
              <li><a href="/terms-of-service" className="text-slate-300 hover:text-blue-400 transition-colors">Terms of Service</a></li>
              <li><a href="/about-us" className="text-slate-300 hover:text-blue-400 transition-colors">About Us</a></li>
              <li><a href="/contact" className="text-slate-300 hover:text-blue-400 transition-colors">Contact Us</a></li>
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
