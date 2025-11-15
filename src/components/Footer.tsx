// src/components/Footer.tsx
import React from "react";
import { Link } from "react-router-dom";
import { toolsData } from "../data/toolsData";
import { useSiteConfig } from "../config/siteConfig";

const Footer: React.FC = () => {
  const { config } = useSiteConfig();
  const { footerPopular, footerDescription } = config;

  const totalTools = toolsData.reduce(
    (total, category) => total + category.tools.length,
    0
  );

  return (
    <footer className="bg-slate-900/90 backdrop-blur-lg border-t border-blue-500/20 mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand + description */}
          <div>
            <h3 className="font-semibold text-white mb-4">CalculatorHub</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              {footerDescription}
            </p>
          </div>

          {/* Popular Calculators (editable) */}
          <div>
            <h3 className="font-semibold text-white mb-4">
              Popular Calculators
            </h3>
            <ul className="space-y-2 text-sm">
              {footerPopular.map((item) => (
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

          {/* Tool Categories (static – based on your routes) */}
          <div>
            <h3 className="font-semibold text-white mb-4">Tool Categories</h3>
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
                  Misc Tools &amp; Generators
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h3 className="font-semibold text-white mb-4">Support &amp; Legal</h3>
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

        {/* Bottom bar */}
        <div className="border-t border-slate-700 mt-8 pt-6 text-center">
          <p className="text-slate-300 text-sm">
            © 2025 CalculatorHub. All rights reserved. | {totalTools}+ Free
            Online Calculators &amp; Converters
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
