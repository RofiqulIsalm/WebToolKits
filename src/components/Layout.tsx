import React from 'react';
import Header from './Header';
import Footer from './Footer';
import AdBanner from './AdBanner';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
      {/* Global Header */}
      <Header />

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
            {/* SEO internal links idea */}
             <div className="mt-6 p-4 bg-slate-800 rounded-lg text-slate-300 text-sm">
                <h3 className="font-semibold text-white mb-3">Quick Access</h3>
                <ul className="space-y-2">
                  <li><a href="/currency-converter" className="hover:text-blue-400">Currency                       Converter</a></li>
                  <li><a href="/bmi-calculator" className="hover:text-blue-400">BMI                                Calculator</a></li>
                  <li><a href="/loan-emi-calculator" className="hover:text-blue-400">Loan                           EMI Calculator</a></li>
                  <li><a href="/unit-converter" className="hover:text-blue-400">Unit                                Converter</a></li>
                 </ul>
              </div> 
              {/* Popular Calculators Section */}
              <div className="mt-6 p-4 bg-slate-800 rounded-lg text-slate-300 text-sm">
                  <h3 className="font-semibold text-white mb-3">Popular Calculators</h3>
                  <ul className="space-y-2">
                        <li><a href="/age-calculator" className="hover:text-blue-400">Age                                 Calculator</a></li>
                        <li><a href="/sip-calculator" className="hover:text-blue-400">SIP                                 Calculator</a></li>
                        <li><a href="/percentage-calculator" className="hover:text-blue-                                  400">Percentage Calculator</a></li>
                        <li><a href="/discount-calculator" className="hover:text-blue-                                    400">Discount Calculator</a></li>
                        <li><a href="/discount-calculator" className="hover:text-blue-                                    400">Discount Calculator</a></li>
                        <li><a href="/discount-calculator" className="hover:text-blue-                                    400">Discount Calculator</a></li>
                        <li><a href="/discount-calculator" className="hover:text-blue-                                    400">Discount Calculator</a></li>
                        <li><a href="/discount-calculator" className="hover:text-blue-                                    400">Discount Calculator</a></li>
                        <li><a href="/discount-calculator" className="hover:text-blue-                                    400">Discount Calculator</a></li>
                        <li><a href="/discount-calculator" className="hover:text-blue-                                    400">Discount Calculator</a></li>
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
