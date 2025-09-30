import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import AdBanner from './AdBanner';
import PopularCalculators from './PopularCalculators';
import ViewTracker from './ViewTracker';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
      {/* Global Header */}
      <Header />
      
      {/* View Tracking Component */}
      <ViewTracker />

      {/* Top Ad */}
      <AdBanner type="top" />

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-8 relative">
        {/* Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 rounded-3xl blur-3xl"></div>
        
        <div className="flex gap-8">
          {/* Primary Content */}
          <div className="flex-1 relative z-10">
            {/* SEO Wrapper */}
            <section aria-label="Main Content">
              {children}
            </section>

            {/* SEO Intro Section (only for homepage if needed) */}
            {/* You can conditionally render this based on route */}
            {/* Example: show only on `/` */}
            
          </div>

          {/* Sidebar for Ads / Related Links */}
          <aside className="hidden lg:block w-80">
            <AdBanner type="sidebar" />
            
            {/* Dynamic Popular Calculators */}
            <PopularCalculators />
            
            {/* Quick Access Section */}
            <div className="mt-6 p-4 bg-slate-800/50 rounded-lg text-slate-300 text-sm border border-slate-700">
              <h3 className="font-semibold text-white mb-3">Quick Access</h3>
              <ul className="space-y-2">
                <li><Link to="/age-calculator" className="hover:text-blue-400 transition-colors">Age Calculator</Link></li>
                <li><Link to="/percentage-calculator" className="hover:text-blue-400 transition-colors">Percentage Calculator</Link></li>
                <li><Link to="/temperature-converter" className="hover:text-blue-400 transition-colors">Temperature Converter</Link></li>
                <li><Link to="/password-generator" className="hover:text-blue-400 transition-colors">Password Generator</Link></li>
                <li><Link to="/date-difference" className="hover:text-blue-400 transition-colors">Date Difference</Link></li>
                <li><Link to="/average-calculator" className="hover:text-blue-400 transition-colors">Average Calculator</Link></li>
              </ul>
            </div>
          </aside>
        </div>
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Decorative Overlay */}
      <div className="fixed inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent pointer-events-none"></div>
    </div>
  );
};

export default Layout;
