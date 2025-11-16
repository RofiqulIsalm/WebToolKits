// src/components/Footer.tsx
import React from "react";
import { Link } from "react-router-dom";
import { toolsData } from "../data/toolsData";
import { useSiteConfig } from "../config/siteConfig";

const Footer: React.FC = () => {
  const { config } = useSiteConfig();

  const totalCalculators = toolsData.reduce(
    (total, category) => total + category.tools.length,
    0
  );

  return (
    <footer className="bg-slate-900/90 backdrop-blur-lg border-t border-blue-500/20 mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand + description */}
          <div>
            <img
              src="/images/calculatorhub-logo.webp"
              alt="CalculatorHub Logo"
              className="h-8 w-8 rounded-md shadow-md"
              loading="lazy"
            />
            <span className="text-2xl font-bold text-white drop-shadow-lg">
              CalculatorHub
            </span>

            <p className="text-slate-300 text-sm">
              {config.footerDescription}
            </p>

            {/* Social Links */}
            {config.socialLinks && config.socialLinks.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Follow us
                </h4>
                <ul className="flex flex-wrap gap-2 text-xs">
                  {config.socialLinks.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded-full bg-slate-800/80 text-slate-200 hover:bg-sky-600/70 hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Popular calculators (dynamic from config.footerPopular) */}
          <div>
            <h3 className="font-semibold text-white mb-3">
              Popular Calculators
            </h3>
            <ul className="space-y-2 text-sm">
              {config.footerPopular.map((item) => (
                <li key={item.slug}>
                  <Link
                    to={item.slug}
                    className="text-slate-300 hover:text-blue-400 transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tool categories (can stay static for now) */}
          <div>
            <h3 className="font-semibold text-white mb-3">Tool Categories</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/category/currency-finance"
                  className="text-slate-300 hover:text-blue-400 transition-colors"
                >
                  Currency &amp; Finance Calculators
                </Link>
              </li>
              <li>
                <Link
                  to="/category/unit-converters"
                  className="text-slate-300 hover:text-blue-400 transition-colors"
                >
                  Unit Converters &amp; Measurement Tools
                </Link>
              </li>
              <li>
                <Link
                  to="/category/math-tools"
                  className="text-slate-300 hover:text-blue-400 transition-colors"
                >
                  Math Tools &amp; Percentage Calculators
                </Link>
              </li>
              <li>
                <Link
                  to="/category/date-time-tools"
                  className="text-slate-300 hover:text-blue-400 transition-colors"
                >
                  Date &amp; Time Calculators
                </Link>
              </li>
              <li>
                <Link
                  to="/category/misc-tools"
                  className="text-slate-300 hover:text-blue-400 transition-colors"
                >
                  Misc &amp; Utility Tools
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h3 className="font-semibold text-white mb-3">Support &amp; Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-slate-300 hover:text-blue-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-of-service"
                  className="text-slate-300 hover:text-blue-400 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/contact-us"
                  className="text-slate-300 hover:text-blue-400 transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-8 pt-8 text-center">
          <p className="text-slate-300 text-sm">
            © 2025 CalculatorHub. All rights reserved. | {totalCalculators}+ Free
            Online Calculators &amp; Converters
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
