import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900/90 backdrop-blur-lg border-t border-blue-500/20 mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-white mb-4">Daily Tools Hub</h3>
            <p className="text-slate-300 text-sm">
              Free online calculators and converters for daily use. No signup required, 
              privacy-friendly, and completely free.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-4">Popular Tools</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/currency-converter" className="text-slate-300 hover:text-blue-400 transition-colors">Currency Converter</Link></li>
              <li><Link to="/bmi-calculator" className="text-slate-300 hover:text-blue-400 transition-colors">BMI Calculator</Link></li>
              <li><Link to="/loan-emi-calculator" className="text-slate-300 hover:text-blue-400 transition-colors">Loan EMI Calculator</Link></li>
              <li><Link to="/percentage-calculator" className="text-slate-300 hover:text-blue-400 transition-colors">Percentage Calculator</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy-policy" className="text-slate-300 hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="text-slate-300 hover:text-blue-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/contact-us" className="text-slate-300 hover:text-blue-400 transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-700 mt-8 pt-8 text-center">
          <p className="text-slate-300 text-sm">
            © 2025 Daily Tools Hub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;