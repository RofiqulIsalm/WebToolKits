import React from "react";
import { Link } from "react-router-dom";
import { toolsData } from "../data/toolsData";
import {
  Github,
  Globe2,
  Mail,
  ArrowUpCircle,
  Calculator,
  Youtube,
  Facebook,
  Instagram,
} from "lucide-react";

const Footer: React.FC = () => {
  const totalTools = toolsData.reduce(
    (sum, category) => sum + category.tools.length,
    0
  );

  return (
    <footer className="mt-20 bg-gradient-to-b from-slate-900/80 to-slate-950/90 backdrop-blur-xl border-t border-slate-700/60">
      <div className="container mx-auto px-4 py-12">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/40 shadow-lg shadow-blue-900/60">
                <Calculator className="h-6 w-6 text-blue-300" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                Calculator Hub
              </h3>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed">
              Your daily destination for fast, accurate, and 100% free online
              calculators & converters. Zero login, zero tracking — just clean
              tools built for everyone.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-4 mt-5 text-slate-400">
              <a
                href="https://github.com"
                target="_blank"
                className="hover:text-blue-400 transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>

              <a
                href="https://facebook.com"
                target="_blank"
                className="hover:text-blue-400 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                className="hover:text-pink-400 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>

              <a
                href="https://youtube.com"
                target="_blank"
                className="hover:text-red-400 transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Popular Calculators */}
          <div>
            <h3 className="font-semibold text-white mb-4 tracking-wide text-blue-300">
              Popular Calculators
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/currency-converter"
                  className="text-slate-300 hover:text-blue-400 transition"
                >
                  Currency Converter – Live Rates
                </Link>
              </li>
              <li>
                <Link
                  to="/bmi-calculator"
                  className="text-slate-300 hover:text-blue-400 transition"
                >
                  BMI Calculator – Body Index
                </Link>
              </li>
              <li>
                <Link
                  to="/percentage-calculator"
                  className="text-slate-300 hover:text-blue-400 transition"
                >
                  Percentage Calculator
                </Link>
              </li>
              <li>
                <Link
                  to="/loan-emi-calculator"
                  className="text-slate-300 hover:text-blue-400 transition"
                >
                  Loan EMI Calculator
                </Link>
              </li>
              <li>
                <Link
                  to="/temperature-converter"
                  className="text-slate-300 hover:text-blue-400 transition"
                >
                  Temperature Converter
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-white mb-4 tracking-wide text-green-300">
              Tool Categories
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/category/currency-finance"
                  className="text-slate-300 hover:text-green-400 transition"
                >
                  Currency & Finance
                </Link>
              </li>
              <li>
                <Link
                  to="/category/unit-converters"
                  className="text-slate-300 hover:text-green-400 transition"
                >
                  Unit Converters
                </Link>
              </li>
              <li>
                <Link
                  to="/category/math-tools"
                  className="text-slate-300 hover:text-green-400 transition"
                >
                  Math Tools
                </Link>
              </li>
              <li>
                <Link
                  to="/category/date-time-tools"
                  className="text-slate-300 hover:text-green-400 transition"
                >
                  Date & Time Tools
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Support */}
          <div>
            <h3 className="font-semibold text-white mb-4 tracking-wide text-yellow-300">
              Support & Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-slate-300 hover:text-yellow-400 transition"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-of-service"
                  className="text-slate-300 hover:text-yellow-400 transition"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/contact-us"
                  className="text-slate-300 hover:text-yellow-400 transition"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-700 mt-10 pt-6 text-center">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} Calculator Hub — {totalTools}+ free
            calculators & converters.
          </p>

          <div className="mt-4 flex justify-center">
            <a
              href="#"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2 text-slate-400 hover:text-blue-300 transition"
            >
              <ArrowUpCircle className="h-5 w-5" />
              Back to Top
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
