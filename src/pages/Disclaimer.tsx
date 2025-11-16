// src/pages/Disclaimer.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Shield,
  Info,
  Scale,
  Globe2,
  Calculator,
  FileText,
  Mail,
} from "lucide-react";

import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";

const Disclaimer: React.FC = () => {
  return (
    <>
      <SEOHead
        title="Disclaimer – CalculatorHub"
        description="Read the disclaimer for CalculatorHub. Our online calculators and tools provide educational estimates only and are not a substitute for professional financial, legal, medical, or tax advice."
        canonical="https://calculatorhub.site/disclaimer"
        breadcrumbs={[{ name: "Disclaimer", url: "/disclaimer" }]}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <Breadcrumbs items={[{ name: "Disclaimer", url: "/disclaimer" }]} />

        {/* ================= HERO / INTRO ================= */}
        <section className="mb-10 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 border border-amber-500/40 shadow-xl shadow-slate-900/70 px-5 sm:px-8 py-7 sm:py-9">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start lg:items-center">
            <div className="flex-1 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/70 border border-amber-400/60 px-3 py-1 text-[11px] sm:text-xs text-amber-100 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                Important information about how to use our tools
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/20 border border-amber-400/70 flex items-center justify-center shadow-lg shadow-amber-900/70">
                  <Scale className="h-5 w-5 text-amber-50" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                    Disclaimer
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Please read this page carefully before relying on any results.
                  </p>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-200/90 max-w-2xl">
                CalculatorHub provides a collection of online calculators and tools
                for convenience and educational use. While we work hard to keep our
                formulas accurate and up to date, all results are estimates only and
                should not be treated as professional advice or guarantees.
              </p>

              <div className="flex flex-wrap gap-2 text-[11px] sm:text-xs text-slate-100/90">
                <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-sky-400/40">
                  Estimates, not promises
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-emerald-400/40">
                  Always verify with a professional
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-amber-400/40">
                  You are responsible for final decisions
                </span>
              </div>
            </div>

            {/* Quick highlight cards */}
            <div className="w-full lg:w-72 grid grid-cols-1 gap-3 text-xs sm:text-sm">
              <div className="rounded-xl bg-slate-950/90 border border-slate-700/80 p-3 flex items-start gap-3">
                <Calculator className="w-4 h-4 text-sky-300 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-50">Tool limitations</p>
                  <p className="text-slate-400">
                    Our calculators simplify complex topics and may not reflect all
                    variables in your personal situation.
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-slate-950/90 border border-slate-700/80 p-3 flex items-start gap-3">
                <Shield className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-50">No guarantees</p>
                  <p className="text-slate-400">
                    We cannot guarantee that any output, forecast or estimate will
                    match real-world outcomes.
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-slate-950/90 border border-slate-700/80 p-3 flex items-start gap-3">
                <Info className="w-4 h-4 text-purple-300 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-50">Educational use</p>
                  <p className="text-slate-400">
                    Our tools are intended to support understanding, not replace
                    licensed financial, legal or medical guidance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= MAIN CONTENT CARD ================= */}
        <div className="glow-card rounded-2xl p-6 sm:p-8 space-y-10 bg-slate-950/95 border border-slate-800/80 shadow-xl shadow-black/60">
          {/* General use disclaimer */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="h-6 w-6 text-sky-400" />
              1. General Information Only
            </h2>
            <div className="text-slate-300 text-sm sm:text-base space-y-3">
              <p>
                The content, calculators, conversions and outputs provided on{" "}
                <span className="font-mono text-sky-300">
                  https://calculatorhub.site
                </span>{" "}
                are for general informational and educational purposes only.
              </p>
              <p>
                While we aim for accuracy, there may be simplifications, rounding
                differences, assumptions or omissions that make results unsuitable as
                the sole basis for important decisions.
              </p>
              <p>
                By using this site, you agree that you are responsible for verifying
                all information and for any actions you take based on the results.
              </p>
            </div>
          </section>

          {/* No professional advice */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
              <Scale className="h-6 w-6 text-emerald-400" />
              2. No Professional Advice
            </h2>
            <div className="text-slate-300 text-sm sm:text-base space-y-3">
              <p>
                CalculatorHub does <strong>not</strong> provide personalised
                professional advice of any kind. Specifically, nothing on this site
                should be interpreted as:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
                <li>Financial or investment advice</li>
                <li>Legal or tax advice</li>
                <li>Medical or health advice</li>
                <li>Accounting, business or career advice</li>
              </ul>
              <p>
                You should always consult a qualified professional who can review
                your specific situation before making financial, legal, medical or
                other significant decisions.
              </p>
            </div>
          </section>

          {/* Accuracy and limitations */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
              <Calculator className="h-6 w-6 text-sky-300" />
              3. Accuracy, Assumptions & Tool Limitations
            </h2>
            <div className="text-slate-300 text-sm sm:text-base space-y-3">
              <p>
                Our calculators are built using commonly accepted formulas and
                example scenarios. However, every real-life case is different. Tool
                outputs may be affected by:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
                <li>Incorrect or incomplete input data</li>
                <li>
                  Changes in market conditions, interest rates, regulations or other
                  external factors
                </li>
                <li>Rounding rules or internal assumptions in the calculator</li>
                <li>
                  Simplified models that do not include all possible variables or
                  edge cases
                </li>
              </ul>
              <p>
                You should treat every result as an approximation and cross-check
                important numbers with additional sources or tools.
              </p>
            </div>
          </section>

          {/* No liability */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
              <Shield className="h-6 w-6 text-purple-400" />
              4. Limitation of Liability
            </h2>
            <div className="text-slate-300 text-sm sm:text-base space-y-3">
              <p>
                To the fullest extent permitted by law, CalculatorHub and its
                operators will not be liable for any loss or damage arising from:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
                <li>
                  Your use of, or reliance on, any calculator, estimate or piece of
                  content on this website
                </li>
                <li>
                  Any errors, omissions, interruptions or delays in the operation of
                  the site
                </li>
                <li>
                  Any indirect, consequential, incidental or special damages,
                  including loss of profits or opportunities
                </li>
              </ul>
              <p>
                You use this website entirely at your own risk and are responsible
                for double-checking important outputs before taking action.
              </p>
            </div>
          </section>

          {/* Third-party links & ads */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
              <Globe2 className="h-6 w-6 text-sky-400" />
              5. Third-Party Links, Tools & Advertisements
            </h2>
            <div className="text-slate-300 text-sm sm:text-base space-y-3">
              <p>
                CalculatorHub may include links to external websites, embedded
                content, advertising networks or third-party tools. These are provided
                for convenience or to help support the site, but:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
                <li>
                  We do not control and are not responsible for the content, accuracy
                  or policies of external sites.
                </li>
                <li>
                  Inclusion of a link or ad does not imply endorsement or
                  recommendation.
                </li>
                <li>
                  Third parties may have their own terms and privacy practices, which
                  you should review separately.
                </li>
              </ul>
              <p>
                Any interactions you have with third-party sites or services are
                solely between you and those providers.
              </p>
            </div>
          </section>

          {/* No relationship created */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">
              6. No Client, Advisor or Professional Relationship
            </h2>
            <div className="text-slate-300 text-sm sm:text-base space-y-3">
              <p>
                Your use of CalculatorHub, including sending messages through our{" "}
                <Link
                  to="/contact-us"
                  className="text-sky-300 hover:text-sky-400 underline underline-offset-2"
                >
                  Contact page
                </Link>
                , does not create any professional, client, customer, advisor or
                fiduciary relationship between you and CalculatorHub.
              </p>
              <p>
                We may reply to questions or feedback where possible, but those
                responses are still general in nature and should not be treated as
                personalised advice.
              </p>
            </div>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">
              7. Changes to This Disclaimer
            </h2>
            <div className="text-slate-300 text-sm sm:text-base space-y-3">
              <p>
                We may update this Disclaimer from time to time to reflect new tools,
                legal requirements or best practices. When we make material changes,
                we will update the &quot;Last updated&quot; date at the top of this
                page and publish the revised version here.
              </p>
              <p>
                Your continued use of the website after changes are posted will be
                taken as acceptance of the updated Disclaimer.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
              <Mail className="h-6 w-6 text-amber-300" />
              8. Contact Us About This Disclaimer
            </h2>
            <div className="text-slate-300 text-sm sm:text-base space-y-3">
              <p>
                If you have any questions or concerns about this Disclaimer, you can
                contact us at:
              </p>
              <div className="rounded-xl bg-slate-900/80 border border-slate-700 p-4 text-sm">
                <p className="text-slate-100 font-medium">CalculatorHub Support</p>
                <p className="text-slate-300">
                  Email:{" "}
                  <span className="font-mono text-sky-300">
                    support@calculatorhub.site
                  </span>
                </p>
                <p className="text-slate-300">
                  Contact form:{" "}
                  <Link
                    to="/contact-us"
                    className="text-sky-300 hover:text-sky-400 underline underline-offset-2"
                  >
                    https://calculatorhub.site/contact-us
                  </Link>
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom ad banner */}
        <AdBanner type="bottom" />
      </div>
    </>
  );
};

export default Disclaimer;
