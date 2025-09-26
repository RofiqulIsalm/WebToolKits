import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900/90 backdrop-blur-lg border-t border-blue-500/20 mt-16">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div>
            <h3 className="font-semibold text-white mb-4">CalculatorHub</h3>
            <p className="text-slate-300 text-sm">
              CalculatorHub is your one-stop hub for free online calculators and 
              converters. From finance tools like <Link to="/loan-emi-calculator" className="hover:text-blue-400">Loan EMI</Link> &amp; 
              <Link to="/compound-interest-calculator" className="hover:text-blue-400"> Compound Interest</Link> calculators 
              to daily utilities like <Link to="/bmi-calculator" className="hover:text-blue-400">BMI</Link>, 
              <Link to="/percentage-calculator" className="hover:text-blue-400"> Percentage</Link>, and 
              <Link to="/currency-converter" className="hover:text-blue-400"> Currency Converter</Link> — we provide fast, accurate results with no signup required.
            </p>
          </div>

          {/* Popular Tools */}
          <div>
            <h3 className="font-semibold text-white mb-4">Popular Tools</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/currency-converter" className="text-slate-300 hover:text-blue-400 transition-colors">Currency Converter</Link></li>
              <li><Link to="/bmi-calculator" className="text-slate-300 hover:text-blue-400 transition-colors">BMI Calculator</Link></li>
              <li><Link to="/loan-emi-calculator" className="text-slate-300 hover:text-blue-400 transition-colors">Loan EMI Calculator</Link></li>
              <li><Link to="/percentage-calculator" className="text-slate-300 hover:text-blue-400 transition-colors">Percentage Calculator</Link></li>
              <li><Link to="/age-calculator" className="text-slate-300 hover:text-blue-400 transition-colors">Age Calculator</Link></li>
              <li><Link to="/compound-interest-calculator" className="text-slate-300 hover:text-blue-400 transition-colors">Compound Interest Calculator</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-slate-300 hover:text-blue-400 transition-colors">Home</Link></li>
              <li><a href="/about" className="text-slate-300 hover:text-blue-400 transition-colors">About Us</a></li>
              <li><a href="/blog" className="text-slate-300 hover:text-blue-400 transition-colors">Blog</a></li>
              <li><a href="/faq" className="text-slate-300 hover:text-blue-400 transition-colors">FAQs</a></li>
              <li><a href="/contact" className="text-slate-300 hover:text-blue-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/privacy-policy" className="text-slate-300 hover:text-blue-400 transition-colors">Privacy Policy</a></li>
              <li><a href="/terms-of-service" className="text-slate-300 hover:text-blue-400 transition-colors">Terms of Service</a></li>
              <li><a href="/disclaimer" className="text-slate-300 hover:text-blue-400 transition-colors">Disclaimer</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-700 mt-8 pt-6 text-center text-sm text-slate-400">
          <p>
            © {new Date().getFullYear()} CalculatorHub. Free online calculators & converters for daily use. 
            All Rights Reserved.001
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
