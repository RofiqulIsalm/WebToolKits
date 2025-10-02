import React from 'react';
import Header from './Header';
import Footer from './Footer';
import AdBanner from './AdBanner';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-slate-200">
      {/* Header */}
      <Header />

      {/* Top Banner Ad */}
      <AdBanner type="top" />

      <main className="container mx-auto px-4 py-8 relative flex flex-col lg:flex-row gap-8">
        {/* Background Gradient Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 rounded-3xl blur-3xl"></div>

        {/* Main Content */}
        <section className="flex-1 relative z-10">
          {children}
        </section>

        {/* Sidebar (Ads + Extra SEO Sections) */}
        <aside className="hidden lg:block w-80 space-y-6 relative z-10">
          <AdBanner type="sidebar" />

            {/* Popular Calculators Section */}
         <section className="bg-slate-800/70 p-4 rounded-xl shadow-md">
  <h2 className="text-lg font-semibold mb-3 text-green-300">
    Popular Calculators
  </h2>
  <ul className="space-y-2 text-sm">
    <li>
      <a href="/percentage-calculator" className="hover:text-green-400">
        Percentage Calculator
      </a>
    </li>
    <li>
      <a href="/compound-interest-calculator" className="hover:text-green-400">
        Compound Interest Calculator
      </a>
    </li>
    <li>
      <a href="/sip-calculator" className="hover:text-green-400">
        SIP Calculator
      </a>
    </li>
    <li>
      <a href="/bmi-calculator" className="hover:text-green-400">
        BMI Calculator
      </a>
    </li>
  </ul>
</section>


          
          {/* Quick Access Section */}
          <section className="bg-slate-800/70 p-4 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold mb-3 text-yellow-300">Quick Access</h2>
            <ul className="space-y-2 text-sm">
              <li><Link to="/currency-converter" className="text-slate-300 hover:text-blue-                400 transition-colors">Currency Converter</Link></li>
              <li><Link to="/loan-emi-calculator" className="text-slate-300 hover:text-blue-                400 transition-colors">Loan EMI Calculator</Link></li>
              <li><Link to="/compound-interest-calculator" className="text-slate-300 hover:text-blue-                400 transition-colors">Compound Interest</Link></li>
              <li><Link to="/tax-calculator" className="text-slate-300 hover:text-blue-                400 transition-colors"> Tax Calculator</Link></li>
              <li><Link to="/length-converter" className="text-slate-300 hover:text-blue-                400 transition-colors"> Length Converter</Link></li>
              <li><Link to="/currency-converter" className="text-slate-300 hover:text-blue-                400 transition-colors"></Link></li>
              <li><Link to="/weight-converter" className="text-slate-300 hover:text-blue-                400 transition-colors">Weight Converter</Link></li>
              <li><Link to="/temperature-converter" className="text-slate-300 hover:text-blue-                400 transition-colors">Temperature Converter</Link></li>
              <li><Link to="/bmi-calculator" className="text-slate-300 hover:text-blue-                400 transition-colors">BMI Calculator</Link></li>
              <li><Link to="/percentage-calculator" className="text-slate-300 hover:text-blue-                400 transition-colors">Percentage Calculator</Link></li>
              <li><Link to="/average-calculator" className="text-slate-300 hover:text-blue-                400 transition-colors">Average Calculator</Link></li>
              <li><Link to="/age-calculator" className="text-slate-300 hover:text-blue-                400 transition-colors">Age Calculator</Link></li>
              <li><Link to="/date-difference" className="text-slate-300 hover:text-blue-                400 transition-colors">Data Difference Calculator</Link></li>
              <li><Link to="/add-subtract-days" className="text-slate-300 hover:text-blue-                400 transition-colors">Add Subtract Day</Link></li>
              <li><Link to="/qr-code-generator" className="text-slate-300 hover:text-blue-                400 transition-colors">QR Code Generator</Link></li>
              <li><Link to="/password-generator" className="text-slate-300 hover:text-blue-                400 transition-colors">Password Code Generator</Link></li>
              
            </ul>
          </section>

          
        </aside>
      </main>

      {/* Footer */}
      <Footer />

      {/* Global Overlay Gradient */}
      <div className="fixed inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent pointer-events-none"></div>
    </div>
  );
};

export default Layout;
