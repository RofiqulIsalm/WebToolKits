// src/components/Layout.tsx
import React from "react";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import AdBanner from "./AdBanner";
import { useSiteConfig } from "../config/siteConfig";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { config } = useSiteConfig();
  const { quickAccess, popularSidebar } = config;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-200">
      {/* Header */}
      <Header />

      {/* Top Ad (kept inside a container for clean alignment) */}
      <div className="container mx-auto px-4">
        <AdBanner type="top" />
      </div>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 pb-12 relative">
        {/* Soft background glow for the whole main area */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_55%),_radial-gradient(circle_at_bottom,_rgba(168,85,247,0.14),_transparent_55%)]" />

        <div className="flex flex-col lg:flex-row gap-8 pt-4">
          {/* ========== MAIN PAGE CONTENT ========== */}
          <section className="flex-1 relative">{children}</section>

          {/* ========== SIDEBAR (Desktop only) ========== */}
          <aside className="hidden lg:block w-80 space-y-6">
            {/* Sidebar Ad */}
            <AdBanner type="sidebar" />

            {/* Quick Access Section */}
            <section className="glow-card bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 shadow-lg shadow-black/40">
              <h2 className="text-lg font-semibold mb-3 text-amber-300">
                Quick Access
              </h2>
              <ul className="space-y-1.5 text-sm">
                {quickAccess.map((tool) => (
                  <li key={tool.slug}>
                    <Link
                      to={tool.slug}
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg text-slate-200 hover:text-amber-300 hover:bg-slate-800/70 transition-colors"
                    >
                      <span>{tool.name}</span>
                      <span className="text-[10px] uppercase tracking-wide text-slate-500">
                        Open
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            {/* Popular Calculators */}
            <section className="glow-card bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 shadow-lg shadow-black/40">
              <h2 className="text-lg font-semibold mb-3 text-emerald-300">
                Popular Calculators
              </h2>
              <ul className="space-y-1.5 text-sm">
                {popularSidebar.map((calc) => (
                  <li key={calc.slug}>
                    <Link
                      to={calc.slug}
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg text-slate-200 hover:text-emerald-300 hover:bg-slate-800/70 transition-colors"
                    >
                      <span>{calc.name}</span>
                      <span className="text-[10px] uppercase tracking-wide text-slate-500">
                        Try
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>

        {/* Bottom Ad (mobile & desktop, but below main content) */}
        <div className="mt-8">
          <AdBanner type="bottom" />
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Global subtle top glow overlay */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent -z-20" />
    </div>
  );
};

export default Layout;
