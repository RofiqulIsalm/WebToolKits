import React from 'react';
import Header from './Header';
import Footer from './Footer';
import AdBanner from './AdBanner';

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

          {/* Quick Access Section */}
          <section className="bg-slate-800/70 p-4 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold mb-3 text-yellow-300">Quick Access</h2>
            <ul className="space-y-2 text-sm">
              <li><a href="/currency-converter" className="hover:text-yellow-400">Currency Converter</a></li>
              <li><a href="/loan-emi-calculator" className="hover:text-yellow-400">Loan EMI Calculator</a></li>
              <li><a href="/tax-calculator" className="hover:text-yellow-400">Tax Calculator</a></li>
              <li><a href="/age-calculator" className="hover:text-yellow-400">Age Calculator</a></li>
            </ul>
          </section>

          {/* Popular Calculators Section */}
          <section className="bg-slate-800/70 p-4 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold mb-3 text-green-300">Popular Calculators</h2>
            <ul className="space-y-2 text-sm">
              <li><a href="/percentage-calculator" className="hover:text-green-400">Percentage Calculator</a></li>
              <li><a href="/compound-interest-calculator" className="hover:text-green-400">Compound Interest</a></li>
              <li><a href="/sip-calculator" className="hover:text-green-400">SIP Calculator</a></li>
              <li><a href="/bmi-calculator" className="hover:text-green-400">BMI Calculator</a></li>
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
