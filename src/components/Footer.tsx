import React from 'react';
import { Link } from 'react-router-dom';
import { toolsData } from '../data/toolsData';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900/90 backdrop-blur-lg border-t border-blue-500/20 mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-white mb-4">Calculator Hub</h3>
            <p className="text-slate-300 text-sm">
              Discover 100% free online calculators and converters for finance, health, math, and daily life. 
              Calculator Hub helps you solve problems instantly—fast, accurate, and privacy-friendly with no signup required.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-4">Popular Calculators</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/currency-converter" className="text-slate-300 hover:text-blue-400 transition-colors">Currency Converter – Live Exchange Rates</Link></li>
              <li><Link to="/bmi-calculator" className="text-slate-300 hover:text-blue-400 transition-colors">BMI Calculator – Body Mass Index</Link></li>
              <li><Link to="/loan-emi-calculator" className="text-slate-300 hover:text-blue-400 transition-colors">Loan EMI Calculator – Monthly Payments</Link></li>
              <li><Link to="/temperature-converter" className="text-slate-300 hover:text-blue-400 transition-colors">Temperature Converter – Celsius, Fahrenheit & Kelvin</Link></li>
              <li><Link to="/percentage-calculator" className="text-slate-300 hover:text-blue-400 transition-colors">Percentage Calculator – Quick & Accurate</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-4">Tool Categories</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/category/currency-finance" className="text-slate-300 hover:text-blue-400 transition-colors">Currency & Finance Calculators</Link></li>
              <li><Link to="/category/unit-converters" className="text-slate-300 hover:text-blue-400 transition-colors">Unit Converters & Measurement Tools</Link></li>
              <li><Link to="/category/math-tools" className="text-slate-300 hover:text-blue-400 transition-colors">Math Tools & Percentage Calculators</Link></li>
              <li><Link to="/category/date-time-tools" className="text-slate-300 hover:text-blue-400 transition-colors">Date & Time Calculators</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-4">Support & Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy-policy" className="text-slate-300 hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="text-slate-300 hover:text-blue-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/contact-us" className="text-slate-300 hover:text-blue-400 transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-700 mt-8 pt-8 text-center">
          <p className="text-slate-300 text-sm">
            © 2025 Calculator Hub. All rights reserved. | {toolsData.reduce((total, category) => total + category.tools.length, 0)}+ Free Online Calculators & Converters
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
