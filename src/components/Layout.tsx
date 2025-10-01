import React from 'react';
import Header from './Header';
import Footer from './Footer';
import AdBanner from './AdBanner';
import PopularCalculators from './PopularCalculators';
import ViewTracker from './ViewTracker';
import { Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
      <Header />
      <ViewTracker />
      <AdBanner type="top" />
      <main className="container mx-auto px-4 py-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 rounded-3xl blur-3xl"></div>
        <div className="flex gap-8">
          <div className="flex-1 relative z-10">
            <Outlet /> {/* 👈 this replaces {children} */}
          </div>
          <div className="hidden lg:block w-80">
            <PopularCalculators />
            <AdBanner type="sidebar" />
          </div>
        </div>
      </main>
      <Footer />
      <div className="fixed inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent pointer-events-none"></div>
    </div>
  );
};

export default Layout;
