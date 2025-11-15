// src/pages/TermsOfService.tsx
import React from "react";
import {
  FileText,
  AlertTriangle,
  Scale,
  Users,
  Zap,
  Shield,
  Link2,
  Globe2,
  Gavel,
  Info,
} from "lucide-react";
import { Link } from "react-router-dom";

import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import { seoData } from "../utils/seoData";

const TermsOfService: React.FC = () => {
  return (
    <>
      <SEOHead
        title={seoData.termsOfService.title}
        description={seoData.termsOfService.description}
        canonical="https://calculatorhub.site/terms-of-service"
        breadcrumbs={[{ name: "Terms of Service", url: "/terms-of-service" }]}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <Breadcrumbs
          items={[{ name: "Terms of Service", url: "/terms-of-service" }]}
        />

        {/* ================= HERO / INTRO ================= */}
        <section className="mb-10 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-indigo-500/30 shadow-xl shadow-slate-900/70 px-5 sm:px-8 py-7 sm:py-9">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start lg:items-center">
            <div className="flex-1 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/70 border border-amber-400/40 px-3 py-1 text-[11px] sm:text-xs text-amber-100 mb-1">
                <FileText className="w-3.5 h-3.5 text-amber-300" />
                Legal terms • Use conditions • Limitations of liability
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/60 flex items-center justify-center shadow-lg shadow-indigo-900/70">
                  <FileText className="h-5 w-5 text-indigo-100" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                    Terms of Service
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Last updated: <span className="font-medium">October 2, 2025</span>
                  </p>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-200/90 max-w-2xl">
                These Terms of Service govern your access to and use of{" "}
                <span className="font-semibold text-indigo-200">
                  CalculatorHub
                </span>{" "}
                and all calculators, converters and tools provided at{" "}
                <span className="font-mono text-sky-300">
                  https://calculatorhub.site
                </span>
                . Please read them carefully before using the site.
              </p>

              <div className="flex flex-wrap gap-2 text-[11px] sm:text-xs text-slate-100/90">
                <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-indigo-400/40">
                  Free-to-use tools
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-emerald-400/40">
                  No login required
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-purple-400/40">
                  Educational & planning purposes only
                </span>
              </div>
            </div>

            {/* Quick summary card */}
            <div className="w-full lg:w-72 rounded-2xl bg-slate-950/90 border border-slate-800/80 p-4 text-xs sm:text-sm text-slate-200 space-y-3 shadow-lg shadow-black/60">
              <p className="font-semibold text-slate-50 flex items-center gap-2">
                <Info className="w-4 h-4 text-sky-300" />
                Short summary (not legal text)
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li>Using CalculatorHub means you accept these terms.</li>
                <li>Tools are provided “as is” without guarantees.</li>
                <li>You’re responsible for how you use any results.</li>
                <li>
                  Do not misuse, attack or attempt to break our calculators or
                  infrastructure.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ================= TABLE OF CONTENTS ================= */}
        <section className="mb-10 rounded-2xl bg-slate-950/90 border border-slate-800/80 p-5 sm:p-6 text-sm text-slate-200">
          <h2 className="text-lg font-semibold text-indigo-300 mb-3 flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-indigo-300" />
            Overview &amp; Table of Contents
          </h2>
          <p className="text-slate-300 mb-3">
            This section helps you quickly jump to the part of the terms that
            matters most to you as a user of CalculatorHub.
          </p>
          <ol className="list-decimal list-inside space-y-1.5">
            <li>
              <a href="#agreement" className="text-indigo-300 hover:underline">
                Agreement to Terms & Acceptance
              </a>
            </li>
            <li>
              <a href="#eligibility" className="text-indigo-300 hover:underline">
                Eligibility & Scope of Service
              </a>
            </li>
            <li>
              <a href="#use-license" className="text-indigo-300 hover:underline">
                License to Use CalculatorHub
              </a>
            </li>
            <li>
              <a href="#user-conduct" className="text-indigo-300 hover:underline">
                User Responsibilities & Acceptable Use
              </a>
            </li>
            <li>
              <a href="#accuracy" className="text-indigo-300 hover:underline">
                Accuracy of Calculations & No Professional Advice
              </a>
            </li>
            <li>
              <a href="#disclaimer" className="text-indigo-300 hover:underline">
                Disclaimers & “As-Is” Nature of the Service
              </a>
            </li>
            <li>
              <a href="#limitations" className="text-indigo-300 hover:underline">
                Limitations of Liability
              </a>
            </li>
            <li>
              <a href="#content-links" className="text-indigo-300 hover:underline">
                External Links & Third-Party Content
              </a>
            </li>
            <li>
              <a href="#modifications" className="text-indigo-300 hover:underline">
                Changes to the Service & to These Terms
              </a>
            </li>
            <li>
              <a href="#governing-law" className="text-indigo-300 hover:underline">
                Governing Law & Jurisdiction
              </a>
            </li>
            <li>
              <a href="#contact" className="text-indigo-300 hover:underline">
                Contact Information
              </a>
            </li>
          </ol>
        </section>

        {/* ================= MAIN CONTENT CARD ================= */}
        <div className="glow-card rounded-2xl p-6 sm:p-8 space-y-10 bg-slate-950/95 border border-slate-800/80 shadow-xl shadow-black/60">
          {/* 1. Agreement */}
          <section id="agreement">
            <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
              <Shield className="h-6 w-6 text-emerald-400" />
              1. Agreement to Terms & Acceptance
            </h2>
            <div className="text-slate-300 space-y-3 text-sm sm:text-base">
              <p>
                By accessing or using CalculatorHub in any manner – including
                browsing the website, viewing calculators, or running any
                calculations – you confirm that you have read, understood and agree
                to be bound by these Terms of Service and any additional policies
                referenced here (such as our{" "}
                <Link
                  to="/privacy-policy"
                  className="text-sky-300 hover:text-sky-400"
                >
                  Privacy Policy
                </Link>
                ).
              </p>
              <p>
                If you do <strong>not</strong> agree with these terms, you must not
                use CalculatorHub or any of its tools. Continued use after any
                changes to these terms will constitute your acceptance of the updated
                version.
              </p>
            </div>
          </section>

          {/* 2. Eligibility & scope */}
          <section id="eligibility">
            <h2 className="text-2xl font-semibold text-white mb-3">
              2. Eligibility & Scope of Service
            </h2>
            <div className="text-slate-300 space-y-3 text-sm sm:text-base">
              <p>
                CalculatorHub is intended for individuals who are able to form a
                legally binding contract under applicable law. By using the site,
                you confirm that:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
                <li>
                  You are at least the age of majority in your jurisdiction, or you
                  are using the service with the consent and supervision of a parent
                  or legal guardian.
                </li>
                <li>
                  You will use CalculatorHub only in accordance with these Terms and
                  with applicable laws and regulations.
                </li>
              </ul>
              <p>
                We reserve the right to restrict, suspend or terminate access to
                CalculatorHub or specific tools for any user who violates these Terms
                or misuses the service.
              </p>
            </div>
          </section>

          {/* 3. Use License */}
          <section id="use-license">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="h-6 w-6 text-green-400" />
              3. License to Use CalculatorHub
            </h2>
            <div className="text-slate-300 space-y-3 text-sm sm:text-base">
              <p>
                We grant you a limited, non-exclusive, non-transferable,
                revocable license to access and use CalculatorHub for your personal,
                non-commercial, informational and planning purposes, subject to these
                Terms.
              </p>
              <p>You may not, without our prior written permission:</p>
              <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
                <li>Modify, copy or redistribute substantial parts of the site.</li>
                <li>
                  Use our tools or materials for any commercial service that
                  competes with CalculatorHub.
                </li>
                <li>
                  Attempt to reverse engineer, decompile or otherwise access the
                  source code of our proprietary tools (except where allowed by law).
                </li>
                <li>
                  Remove or alter any copyright, trademark or other proprietary
                  notices displayed on the site.
                </li>
              </ul>
              <p>
                This license automatically terminates if you breach these Terms, and
                we may also terminate it at any time in our sole discretion.
              </p>
            </div>
          </section>

          {/* 4. User conduct */}
          <section id="user-conduct">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="h-6 w-6 text-cyan-400" />
              4. User Responsibilities & Acceptable Use
            </h2>
            <div className="text-slate-300 space-y-3 text-sm sm:text-base">
              <p>
                You agree to use CalculatorHub in a responsible manner and not to
                misuse or abuse the service. Specifically, you agree that you will
                not:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
                <li>Violate any applicable local, national or international laws.</li>
                <li>
                  Upload, submit or transmit any content that is harmful, abusive,
                  defamatory, hateful or otherwise objectionable.
                </li>
                <li>
                  Attempt to gain unauthorised access to our servers, systems or
                  data, or to the accounts of other users (where applicable).
                </li>
                <li>
                  Interfere with or disrupt the normal functioning of the website,
                  including via denial-of-service attacks, automated scripts or
                  excessive usage.
                </li>
                <li>
                  Use bots, scrapers or automated tools to harvest content or abuse
                  our calculators beyond reasonable usage.
                </li>
                <li>
                  Impersonate any person, entity or CalculatorHub team member in
                  communication or feedback.
                </li>
              </ul>
              <p>
                We may investigate suspected violations and take any action we deem
                appropriate, including limiting access to certain tools or blocking
                IP addresses where necessary to protect the service.
              </p>
            </div>
          </section>

          {/* 5. Accuracy & no professional advice */}
          <section id="accuracy">
            <h2 className="text-2xl font-semibold text-white mb-4">
              5. Accuracy of Calculations & No Professional Advice
            </h2>
            <div className="text-slate-300 space-y-3 text-sm sm:text-base">
              <p>
                CalculatorHub aims to provide helpful, well-tested calculators and
                converters. However, you acknowledge and agree that:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
                <li>
                  Calculators may rely on formulas, assumptions or external factors
                  that can change or be simplified.
                </li>
                <li>
                  We do <strong>not</strong> guarantee that any calculation, result
                  or output is error-free, complete, up-to-date or suitable for your
                  specific situation.
                </li>
                <li>
                  Our tools are provided for{" "}
                  <strong>informational and educational purposes only</strong> and
                  do not constitute financial, legal, tax, medical or professional
                  advice.
                </li>
                <li>
                  You are solely responsible for verifying any important result using
                  professional tools, advisors or trusted sources before making
                  decisions.
                </li>
              </ul>
              <p>
                By using the site, you agree that CalculatorHub will not be held
                responsible for decisions, actions or losses that arise from your
                reliance on calculator outputs or content.
              </p>
            </div>
          </section>

          {/* 6. Disclaimer */}
          <section id="disclaimer">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-yellow-400" />
              6. Disclaimers & “As-Is” Nature of the Service
            </h2>
            <div className="text-slate-300 space-y-3 text-sm sm:text-base">
              <p>
                CalculatorHub and all materials, tools, content and services provided
                through the website are offered on an <strong>&quot;as is&quot;</strong>{" "}
                and <strong>&quot;as available&quot;</strong> basis, without any
                warranties of any kind, whether express or implied.
              </p>
              <p>
                To the fullest extent permitted by law, we expressly disclaim all
                warranties, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
                <li>Implied warranties of merchantability;</li>
                <li>Fitness for a particular purpose;</li>
                <li>Non-infringement of intellectual property;</li>
                <li>
                  Any warranties that the site or calculators will be uninterrupted,
                  error-free, secure or free of harmful components.
                </li>
              </ul>
              <p>
                We do not warrant or represent that the results obtained from the use
                of the service will be reliable, accurate or meet your expectations.
              </p>
            </div>
          </section>

          {/* 7. Limitations */}
          <section id="limitations">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Scale className="h-6 w-6 text-purple-400" />
              7. Limitations of Liability
            </h2>
            <div className="text-slate-300 space-y-3 text-sm sm:text-base">
              <p>
                To the maximum extent permitted by law, in no event shall
                CalculatorHub, its contributors, partners or suppliers be liable for
                any indirect, incidental, special, consequential or punitive damages,
                including without limitation:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
                <li>Loss of profits, revenue, data or business opportunities;</li>
                <li>Business interruption or loss of goodwill;</li>
                <li>
                  Any damages arising from your access to or use of (or inability to
                  access or use) the site or tools.
                </li>
              </ul>
              <p>
                This limitation applies even if an authorised representative of
                CalculatorHub has been notified, orally or in writing, of the
                possibility of such damage.
              </p>
              <p className="text-xs sm:text-sm text-slate-400">
                Some jurisdictions do not allow the exclusion or limitation of
                liability for consequential or incidental damages, so the above
                limitations may not apply to you in full.
              </p>
            </div>
          </section>

          {/* 8. Links & third-party content */}
          <section id="content-links">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Link2 className="h-6 w-6 text-sky-400" />
              8. External Links & Third-Party Content
            </h2>
            <div className="text-slate-300 space-y-3 text-sm sm:text-base">
              <p>
                CalculatorHub may contain links to websites, tools or content that
                are operated by third parties. These links are provided for
                convenience or additional information only.
              </p>
              <p>We do not:</p>
              <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
                <li>
                  Control, endorse or take responsibility for the content, policies or
                  practices of third-party sites.
                </li>
                <li>
                  Guarantee the accuracy, legality or safety of any information
                  provided by third parties.
                </li>
              </ul>
              <p>
                Accessing or using third-party sites linked from CalculatorHub is at
                your own risk and subject to those sites&apos; own terms and privacy
                policies.
              </p>
            </div>
          </section>

          {/* 9. Modifications */}
          <section id="modifications">
            <h2 className="text-2xl font-semibold text-white mb-4">
              9. Changes to the Service & to These Terms
            </h2>
            <div className="text-slate-300 space-y-3 text-sm sm:text-base">
              <p>
                We may update, modify or discontinue any part of CalculatorHub,
                including specific calculators, features or content, at any time and
                without prior notice.
              </p>
              <p>
                We may also revise these Terms of Service from time to time. When we
                make material changes, we will update the{" "}
                <strong>&quot;Last updated&quot;</strong> date at the top of this
                page. Your continued use of the site after changes have been posted
                constitutes your acceptance of the revised terms.
              </p>
            </div>
          </section>

          {/* 10. Governing law */}
          <section id="governing-law">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Gavel className="h-6 w-6 text-rose-300" />
              10. Governing Law & Jurisdiction
            </h2>
            <div className="text-slate-300 space-y-3 text-sm sm:text-base">
              <p>
                These Terms of Service, and any dispute or claim arising out of or in
                connection with them or their subject matter or formation, shall be
                governed by and construed in accordance with the laws of the
                applicable jurisdiction chosen by the operators of CalculatorHub
                (without regard to conflict of law principles).
              </p>
              <p>
                You agree that the courts of that jurisdiction will have exclusive
                authority to settle any dispute or claim arising out of or in
                connection with these Terms or your use of CalculatorHub, except
                where applicable law provides otherwise.
              </p>
            </div>
          </section>

          {/* 11. Contact */}
          <section id="contact">
            <h2 className="text-2xl font-semibold text-white mb-4">
              11. Contact Information
            </h2>
            <div className="text-slate-300 space-y-3 text-sm sm:text-base">
              <p>
                If you have any questions about these Terms of Service, or if you
                need clarification about how they apply to your use of CalculatorHub,
                you can contact us at:
              </p>
              <div className="rounded-xl bg-slate-900/80 border border-slate-700 p-4 text-sm">
                <p className="text-slate-100 font-medium">CalculatorHub – Legal &amp; Support</p>
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
                We aim to respond to reasonable enquiries about these Terms within a
                practical timeframe.
              </p>
            </div>
          </section>
        </div>

        {/* Bottom Ad */}
        <AdBanner type="bottom" />
      </div>
    </>
  );
};

export default TermsOfService;
