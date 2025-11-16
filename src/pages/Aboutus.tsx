// src/pages/AboutUs.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  Calculator,
  Target,
  Users,
  Rocket,
  LineChart,
  Shield,
  Globe2,
  Wrench,
  Mail,
} from "lucide-react";

import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";

const AboutUs: React.FC = () => {
  return (
    <>
      <SEOHead
        title="About CalculatorHub – Smart, Privacy-Friendly Online Calculators"
        description="Learn more about CalculatorHub, a privacy-friendly collection of smart online calculators and tools built for students, creators, founders, and everyday users who need fast, accurate answers."
        canonical="https://calculatorhub.site/about-us"
        breadcrumbs={[{ name: "About Us", url: "/about-us" }]}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <Breadcrumbs items={[{ name: "About Us", url: "/about-us" }]} />

        {/* ================= HERO / INTRO ================= */}
        <section className="mb-10 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 border border-sky-500/30 shadow-xl shadow-slate-900/70 px-5 sm:px-8 py-7 sm:py-9">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start lg:items-center">
            <div className="flex-1 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/70 border border-emerald-400/40 px-3 py-1 text-[11px] sm:text-xs text-emerald-100 mb-1">
                <Calculator className="w-3.5 h-3.5 text-emerald-300" />
                Free, fast & privacy-aware calculators
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-sky-500/20 border border-sky-400/60 flex items-center justify-center shadow-lg shadow-sky-900/70">
                  <Globe2 className="h-5 w-5 text-sky-100" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                    About CalculatorHub
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Simple tools, clear answers, built for real-world decisions.
                  </p>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-200/90 max-w-2xl">
                CalculatorHub is a growing collection of online calculators, converters
                and helpers designed to remove friction from everyday decisions. From
                quick financial estimates to planning numbers for your projects, our
                goal is to give you accurate, easy-to-understand results in seconds —
                without needing a spreadsheet or complex formulas.
              </p>

              <div className="flex flex-wrap gap-2 text-[11px] sm:text-xs text-slate-100/90">
                <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-sky-400/40">
                  Built with React & Vite
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-emerald-400/40">
                  Browser-side calculations first
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-purple-400/40">
                  Optimised for mobile & desktop
                </span>
              </div>
            </div>

            {/* Quick highlight cards */}
            <div className="w-full lg:w-72 grid grid-cols-1 gap-3 text-xs sm:text-sm">
              <div className="rounded-xl bg-slate-950/90 border border-slate-700/80 p-3 flex items-start gap-3">
                <Target className="w-4 h-4 text-sky-300 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-50">Focused on clarity</p>
                  <p className="text-slate-400">
                    We design each tool to be easy to read, easy to tweak and easy to
                    understand — even if you&apos;re not a numbers person.
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-slate-950/90 border border-slate-700/80 p-3 flex items-start gap-3">
                <LineChart className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-50">Real-world formulas</p>
                  <p className="text-slate-400">
                    Our calculators are based on widely used, well-documented formulas
                    so your estimates match real-life expectations.
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-slate-950/90 border border-slate-700/80 p-3 flex items-start gap-3">
                <Shield className="w-4 h-4 text-purple-300 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-50">Respecting privacy</p>
                  <p className="text-slate-400">
                    Many calculations run entirely in your browser. For details, see
                    our{" "}
                    <Link
                      to="/privacy-policy"
                      className="text-sky-300 hover:text-sky-400 underline underline-offset-2"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= MAIN CONTENT CARD ================= */}
        <div className="glow-card rounded-2xl p-6 sm:p-8 space-y-10 bg-slate-950/95 border border-slate-800/80 shadow-xl shadow-black/60">
          {/* Who we build for */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
              <Users className="h-6 w-6 text-sky-400" />
              Who CalculatorHub Is For
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mb-4">
              CalculatorHub is designed for anyone who needs quick, trustworthy
              numbers without the complexity of a full spreadsheet or financial
              software. Typical visitors include:
            </p>
            <ul className="grid sm:grid-cols-2 gap-3 text-sm sm:text-base text-slate-200">
              <li className="rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3">
                <span className="font-semibold text-sky-200">Students & learners –</span>{" "}
                checking formulas and understanding how numbers behave.
              </li>
              <li className="rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3">
                <span className="font-semibold text-emerald-200">
                  Creators & founders –
                </span>{" "}
                estimating revenue, growth, costs and break-even points.
              </li>
              <li className="rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3">
                <span className="font-semibold text-amber-200">
                  Everyday users –
                </span>{" "}
                planning savings, budgets, payments or simple conversions.
              </li>
              <li className="rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3">
                <span className="font-semibold text-purple-200">
                  Experimenters & tinkerers –
                </span>{" "}
                plugging in scenarios to see &quot;what if?&quot; outcomes.
              </li>
            </ul>
          </section>

          {/* How the tools are built */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
              <Wrench className="h-6 w-6 text-emerald-400" />
              How We Design & Build Our Calculators
            </h2>
            <div className="text-slate-300 text-sm sm:text-base space-y-3">
              <p>
                Every tool on CalculatorHub follows a simple principle:{" "}
                <span className="font-semibold text-sky-200">
                  clear inputs, transparent formulas, readable results.
                </span>{" "}
                Behind the UI, we use well-known, peer-reviewed or industry-standard
                calculations.
              </p>
              <p>
                We prototype each calculator, validate the formula with multiple
                examples, and then optimise the interface for speed and readability.
                Many tools support &quot;advanced&quot; modes so power users get more
                control without overwhelming first-time visitors.
              </p>
              <p>
                Feedback from real users directly shapes our roadmap. If you notice a
                missing scenario or want a new calculator, you can always{" "}
                <Link
                  to="/contact-us"
                  className="text-sky-300 hover:text-sky-400 underline underline-offset-2"
                >
                  suggest it
                </Link>{" "}
                and we&apos;ll consider it for a future update.
              </p>
            </div>
          </section>

          {/* Trust & transparency */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
              <Shield className="h-6 w-6 text-purple-400" />
              Trust, Accuracy & Privacy
            </h2>
            <div className="text-slate-300 text-sm sm:text-base space-y-3">
              <p>
                Numbers only matter when you can trust them. That&apos;s why we aim to
                keep CalculatorHub:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
                <li>
                  <strong>Transparent:</strong> Wherever helpful, we explain the logic
                  behind a calculator in plain language.
                </li>
                <li>
                  <strong>Up to date:</strong> We review formulas periodically and
                  refine assumptions as standards or best practices evolve.
                </li>
                <li>
                  <strong>Privacy-friendly:</strong> We minimise data collection and
                  keep many calculations in your browser only. You can learn more in
                  our{" "}
                  <Link
                    to="/privacy-policy"
                    className="text-sky-300 hover:text-sky-400 underline underline-offset-2"
                  >
                    Privacy Policy
                  </Link>
                  .
                </li>
              </ul>
              <p>
                CalculatorHub is not a replacement for personalised professional
                advice. Instead, think of it as a fast, friendly starting point for
                your decisions — a way to turn ideas into numbers you can work with.
              </p>
            </div>
          </section>

          {/* Roadmap / future */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
              <Rocket className="h-6 w-6 text-sky-300" />
              Where CalculatorHub Is Going Next
            </h2>
            <div className="text-slate-300 text-sm sm:text-base space-y-3">
              <p>
                We&apos;re continuously expanding CalculatorHub with new categories of
                tools: revenue estimators, budgeting helpers, time-savers for
                creators, and more specialised calculators based on real user
                requests.
              </p>
              <p>
                Future updates include tighter mobile layouts, more &quot;explain the
                math&quot; sections, and deeper integrations between related tools so
                you can chain calculations together.
              </p>
              <p>
                If you&apos;d like to collaborate, integrate a calculator into your
                own project, or discuss custom tools, you can reach out anytime.
              </p>
            </div>
          </section>

          {/* Contact / CTA */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
              <Mail className="h-6 w-6 text-amber-300" />
              Get in Touch
            </h2>
            <div className="text-slate-300 text-sm sm:text-base space-y-3">
              <p>
                Have an idea for a new calculator, spotted an issue with a result, or
                want to partner on a tool? We&apos;d love to hear from you.
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
              <p>
                Thank you for using CalculatorHub. We hope our tools save you time,
                reduce guesswork and help you make clearer, more confident decisions.
              </p>
            </div>
          </section>
        </div>

        {/* Bottom ad banner, consistent with your layout */}
        <AdBanner type="bottom" />
      </div>
    </>
  );
};

export default AboutUs;
