import React from 'react';
import Header from './Header';
import Footer from './Footer';
import AdBanner from './AdBanner';

interface LayoutProps {
  children: React.ReactNode;
}

// ✅ Dynamic Popular Calculators List
// Later, you can replace this with API or DB data
const popularCalculators = [
  { name: "Percentage Calculator", slug: "/percentage-calculator" },
  { name: "Compound Interest Calculator", slug: "/compound-interest-calculator" },
  { name: "SIP Calculator", slug: "/sip-calculator" },
  { name: "BMI Calculator", slug: "/bmi-calculator" },
];

const quickAccess = [
  { name: "Currency Converter", slug: "/currency-converter" },
  { name: "Loan EMI Calculator", slug: "/loan-emi-calculator" },
  { name: "Tax Calculator", slug: "/tax-calculator" },
  { name: "Age Calculator", slug: "/age-calculator" },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-slate-200">
      {/* Header */}
      <Header />

      {/* Top Banner */}
      <AdBanner type="top" />

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-8 relative flex flex-col lg:flex-row gap-8">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 rounded-3xl blur-3xl"></div>

        {/* Children Pages */}
        <section className="flex-1 relative z-10">
          {children}
        </section>

        {/* Sidebar */}
        <aside className="hidden lg:block w-80 space-y-6 relative z-10">
          {/* Sidebar Ad */}
          <AdBanner type="sidebar" />

          {/* Quick Access Section */}
          <section className="bg-slate-800/70 p-4 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold mb-3 text-yellow-300">Quick Access</h2>
            <ul className="space-y-2 text-sm">
              {quickAccess.map((tool, index) => (
                <li key={index}>
                  <a href={tool.slug} className="hover:text-yellow-400">
                    {tool.name}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          {/* Popular Calculators (Dynamic) */}
          <section className="bg-slate-800/70 p-4 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold mb-3 text-green-300">Popular Calculators</h2>
            <ul className="space-y-2 text-sm">
              {popularCalculators.map((calc, index) => (
                <li key={index}>
                  <a href={calc.slug} className="hover:text-green-400">
                    {calc.name}
                  </a>
                </li>
              ))}
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
