// src/pages/PrivacyPolicy.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Eye,
  Database,
  Lock,
  Mail,
  Globe2,
  AlertTriangle,
  Cookie,
  FileText,
} from "lucide-react";

import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import { seoData } from "../utils/seoData";

const PrivacyPolicy: React.FC = () => {
  return (
    <>
      <SEOHead
        title={seoData.privacyPolicy.title}
        description={seoData.privacyPolicy.description}
        canonical="https://calculatorhub.site/privacy-policy"
        breadcrumbs={[{ name: "Privacy Policy", url: "/privacy-policy" }]}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <Breadcrumbs items={[{ name: "Privacy Policy", url: "/privacy-policy" }]} />

        {/* ================= HERO / INTRO ================= */}
        <section className="mb-10 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 border border-sky-500/30 shadow-xl shadow-slate-900/70 px-5 sm:px-8 py-7 sm:py-9">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start lg:items-center">
            <div className="flex-1 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/70 border border-emerald-400/40 px-3 py-1 text-[11px] sm:text-xs text-emerald-100 mb-1">
                <Shield className="w-3.5 h-3.5 text-emerald-300" />
                Built for privacy-first calculator usage
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-sky-500/20 border border-sky-400/60 flex items-center justify-center shadow-lg shadow-sky-900/70">
                  <Shield className="h-5 w-5 text-sky-100" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                    Privacy Policy
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Last updated: <span className="font-medium">October 2, 2025</span>
                  </p>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-200/90 max-w-2xl">
                This Privacy Policy explains how CalculatorHub collects, uses and protects
                information when you use our calculators, converters and related tools
                at{" "}
                <span className="font-mono text-sky-300">
                  https://calculatorhub.site
                </span>
                . We keep data collection minimal and focus on a safe, transparent,
                privacy-friendly experience.
              </p>

              <div className="flex flex-wrap gap-2 text-[11px] sm:text-xs text-slate-100/90">
                <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-sky-400/40">
                  No account required
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-emerald-400/40">
                  Browser-side calculations
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-purple-400/40">
                  Clear cookie & data practices
                </span>
              </div>
            </div>

            {/* Quick summary cards */}
            <div className="w-full lg:w-72 grid grid-cols-1 gap-3 text-xs sm:text-sm">
              <div className="rounded-xl bg-slate-950/90 border border-slate-700/80 p-3 flex items-start gap-3">
                <Eye className="w-4 h-4 text-sky-300 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-50">Minimal tracking</p>
                  <p className="text-slate-400">
                    We only collect limited technical and usage data to keep tools
                    running smoothly and improve features.
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-slate-950/90 border border-slate-700/80 p-3 flex items-start gap-3">
                <Database className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-50">No calculator data sold</p>
                  <p className="text-slate-400">
                    We do not sell your calculator inputs. Many calculations run
                    directly in your browser.
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-slate-950/90 border border-slate-700/80 p-3 flex items-start gap-3">
                <Lock className="w-4 h-4 text-purple-300 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-50">Security-focused</p>
                  <p className="text-slate-400">
                    Industry-standard encryption and infrastructure practices to
                    protect any data that passes through our services.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= TABLE OF CONTENTS ================= */}
        <section className="mb-10 rounded-2xl bg-slate-950/90 border border-slate-800/80 p-5 sm:p-6 text-sm text-slate-200">
          <h2 className="text-lg font-semibold text-sky-300 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-300" />
            Overview &amp; Table of Contents
          </h2>
          <p className="text-slate-300 mb-3">
            This policy is written in clear, straightforward language so you can
            quickly understand what we do – and what we do not do – with your data.
          </p>
          <ol className="list-decimal list-inside space-y-1.5">
            <li>
              <a href="#scope" className="text-sky-300 hover:underline">
                Scope of this Privacy Policy & Definitions
              </a>
            </li>
            <li>
              <a href="#info-we-collect" className="text-sky-300 hover:underline">
                Information We Collect
              </a>
            </li>
            <li>
              <a href="#how-we-use" className="text-sky-300 hover:underline">
                How We Use Your Information
              </a>
            </li>
            <li>
              <a href="#cookies" className="text-sky-300 hover:underline">
                Cookies, Local Storage & Similar Technologies
              </a>
            </li>
            <li>
              <a href="#third-parties" className="text-sky-300 hover:underline">
                Third-Party Services & Analytics
              </a>
            </li>
            <li>
              <a href="#security" className="text-sky-300 hover:underline">
                Data Security & Retention
              </a>
            </li>
            <li>
              <a href="#rights" className="text-sky-300 hover:underline">
                Your Privacy Rights & Choices
              </a>
            </li>
            <li>
              <a href="#international" className="text-sky-300 hover:underline">
                International Users & Data Transfers
              </a>
            </li>
            <li>
              <a href="#children" className="text-sky-300 hover:underline">
                Children&apos;s Privacy
              </a>
            </li>
            <li>
              <a href="#changes" className="text-sky-300 hover:underline">
                Changes to This Privacy Policy
              </a>
            </li>
            <li>
              <a href="#contact" className="text-sky-300 hover:underline">
                Contacting Us About Privacy
              </a>
            </li>
          </ol>
        </section>

        {/* ================= MAIN CONTENT CARD ================= */}
        <div className="glow-card rounded-2xl p-6 sm:p-8 space-y-10 bg-slate-950/95 border border-slate-800/80 shadow-xl shadow-black/60">
          {/* 1. Scope */}
          <section id="scope">
            <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
              <Globe2 className="h-6 w-6 text-sky-400" />
              1. Scope of this Privacy Policy & Definitions
            </h2>
            <div className="text-slate-300 space-y-3 text-sm sm:text-base">
              <p>
                This Privacy Policy applies to your use of the{" "}
                <span className="font-semibold text-sky-200">CalculatorHub</span>{" "}
                website and tools located at{" "}
                <span className="font-mono text-sky-300">
                  https://calculatorhub.site
                </span>{" "}
                and any related pages where this policy is displayed or linked.
              </p>
              <p>
                When we say <strong>&quot;we&quot;</strong>,{" "}
                <strong>&quot;us&quot;</strong> or{" "}
                <strong>&quot;CalculatorHub&quot;</strong>, we are referring to the
                team that operates and maintains this website. When we say{" "}
                <strong>&quot;you&quot;</strong> or{" "}
                <strong>&quot;user&quot;</strong>, we mean anyone accessing or using
                our calculators, converters or related content.
              </p>
              <p>
                Please note that this policy does not cover third-party websites,
                advertisers or services that may be linked from our pages. Their
                privacy practices are governed by their own policies.
              </p>
            </div>
          </section>

          {/* 2. Information we collect */}
          <section id="info-we-collect">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Eye className="h-6 w-6 text-blue-400" />
              2. Information We Collect
            </h2>
            <div className="text-slate-300 space-y-4 text-sm sm:text-base">
              <p>
                CalculatorHub is designed as a low-friction, privacy-aware platform.
                We collect only the information that is necessary to operate and
                improve the service.
              </p>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="rounded-xl bg-slate-900/80 border border-slate-700 p-4">
                  <h3 className="text-sm font-semibold text-slate-100 mb-2">
                    2.1. Information you provide to us
                  </h3>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-sm">
                    <li>
                      <strong>Contact form details:</strong> If you contact us via
                      the{" "}
                      <Link
                        to="/contact-us"
                        className="text-sky-300 hover:text-sky-400"
                      >
                        Contact Us
                      </Link>{" "}
                      page, we may collect your name, email address, subject,
                      message content and any calculator links you include.
                    </li>
                    <li>
                      <strong>Feedback & suggestions:</strong> When you share
                      feedback about our tools, we use this information to understand
                      problems, plan improvements and reply to you where relevant.
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl bg-slate-900/80 border border-slate-700 p-4">
                  <h3 className="text-sm font-semibold text-slate-100 mb-2">
                    2.2. Automatically collected technical data
                  </h3>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-sm">
                    <li>
                      <strong>Usage data:</strong> Such as pages viewed, tool
                      interactions, approximate time spent and basic device type
                      (desktop/mobile).
                    </li>
                    <li>
                      <strong>Technical data:</strong> Browser type, operating system
                      and anonymised IP-related information used for security and
                      analytics.
                    </li>
                    <li>
                      <strong>Log data:</strong> Basic server logs that help us
                      detect errors, abuse or performance issues.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="rounded-xl bg-slate-900/80 border border-emerald-500/50 p-4">
                <p className="text-sm sm:text-base">
                  <strong className="text-emerald-300">Calculator inputs.</strong>{" "}
                  Many of our calculators run entirely in your browser. In these
                  cases, your numeric inputs and results are not sent to our servers
                  and are not stored by us. Some tools may optionally store
                  non-sensitive preferences locally (for example, theme selection or
                  &quot;advanced mode&quot; toggles) to make returning visits more
                  convenient.
                </p>
              </div>
            </div>
          </section>

          {/* 3. How we use information */}
          <section id="how-we-use">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Database className="h-6 w-6 text-emerald-400" />
              3. How We Use Your Information
            </h2>
            <div className="text-slate-300 space-y-3 text-sm sm:text-base">
              <p>We use the limited information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
                <li>
                  Operate, maintain and improve our calculators, converters and
                  related pages.
                </li>
                <li>
                  Understand which tools are most useful so we can prioritise new
                  features and updates.
                </li>
                <li>
                  Diagnose technical issues, monitor uptime and keep the service
                  secure.
                </li>
                <li>
                  Respond to your questions, bug reports or business enquiries sent
                  via the contact form.
                </li>
                <li>
                  Display relevant advertisements or sponsored content that help keep
                  the service free to use.
                </li>
              </ul>
              <p>
                We do <strong>not</strong> use calculator inputs to personally
                profile you, and we do <strong>not</strong> sell your personal data
                to third parties.
              </p>
            </div>
          </section>

          {/* 4. Cookies & local storage */}
          <section id="cookies">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Cookie className="h-6 w-6 text-amber-400" />
              4. Cookies, Local Storage & Similar Technologies
            </h2>
            <div className="text-slate-300 space-y-3 text-sm sm:text-base">
              <p>
                We use cookies, local storage and similar technologies to make
                CalculatorHub faster, more reliable and more convenient to use.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
                <li>
                  <strong>Essential cookies:</strong> Required for basic site
                  functions, such as security, anti-abuse and load balancing.
                </li>
                <li>
                  <strong>Preference storage:</strong> Some calculators may remember
                  certain settings (for example, currency preferences or advanced
                  mode) using local storage.
                </li>
                <li>
                  <strong>Analytics cookies:</strong> Help us understand aggregated
                  usage patterns, such as which tools are popular and where users may
                  be experiencing issues.
                </li>
                <li>
                  <strong>Advertising cookies:</strong> May be used by advertising
                  partners to measure performance and show relevant ads.
                </li>
              </ul>
              <p>
                Most browsers allow you to control or delete cookies through their
                settings. If you choose to block essential cookies, some parts of the
                website may not function correctly.
              </p>
            </div>
          </section>

          {/* 5. Third-party services */}
          <section id="third-parties">
            <h2 className="text-2xl font-semibold text-white mb-4">
              5. Third-Party Services & Analytics
            </h2>
            <div className="text-slate-300 space-y-3 text-sm sm:text-base">
              <p>
                To keep CalculatorHub fast, reliable and sustainable, we may rely on
                third-party services for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
                <li>
                  <strong>Analytics providers</strong> that help us understand how
                  visitors use our site in aggregate (for example, page views,
                  general geography, device types).
                </li>
                <li>
                  <strong>Advertising networks</strong> that display non-intrusive
                  ads to support our free tools.
                </li>
                <li>
                  <strong>Content delivery networks (CDNs)</strong> that serve
                  static files (scripts, styles, images) from servers close to you
                  for better performance.
                </li>
              </ul>
              <p>
                These providers may set their own cookies or tracking technologies
                and have their own privacy policies. We encourage you to review those
                policies directly if you would like more detail on their practices.
              </p>
              <div className="rounded-xl bg-slate-900/80 border border-amber-500/60 p-4 flex gap-3 mt-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm sm:text-base">
                  <strong>External links:</strong> Our calculators may link to
                  third-party websites for further reading or related tools. We are
                  not responsible for the content or privacy practices of these
                  external sites.
                </p>
              </div>
            </div>
          </section>

          {/* 6. Security & retention */}
          <section id="security">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Lock className="h-6 w-6 text-purple-400" />
              6. Data Security & Retention
            </h2>
            <div className="text-slate-300 space-y-3 text-sm sm:text-base">
              <p>
                We use reasonable technical and organisational measures to protect
                information against unauthorised access, loss, misuse or alteration.
                While no method of transmission over the internet can be guaranteed
                100% secure, we aim to follow industry best practices, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
                <li>Encryption (HTTPS / TLS) for data in transit.</li>
                <li>
                  Secure hosting infrastructure with regular security updates and
                  monitoring.
                </li>
                <li>
                  Limited internal access to any stored data on a need-to-know basis.
                </li>
                <li>Regular reviews of security controls and error logs.</li>
              </ul>
              <p>
                We retain contact form submissions and related correspondence for as
                long as reasonably necessary to address your request, maintain proper
                records or comply with legal obligations, after which they may be
                deleted or anonymised.
              </p>
            </div>
          </section>

          {/* 7. Your rights */}
          <section id="rights">
            <h2 className="text-2xl font-semibold text-white mb-4">
              7. Your Privacy Rights & Choices
            </h2>
            <div className="text-slate-300 space-y-3 text-sm sm:text-base">
              <p>
                Depending on your location and applicable laws, you may have some or
                all of the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
                <li>
                  <strong>Access:</strong> Request a copy of personal data we hold
                  about you.
                </li>
                <li>
                  <strong>Correction:</strong> Ask us to update or correct inaccurate
                  information.
                </li>
                <li>
                  <strong>Deletion:</strong> Request that we delete information we
                  hold about you, where legally permitted.
                </li>
                <li>
                  <strong>Restriction / objection:</strong> Ask us to limit or stop
                  certain types of processing.
                </li>
                <li>
                  <strong>Opt-out:</strong> Decline certain analytics or advertising
                  cookies through your browser or device settings.
                </li>
              </ul>
              <p>
                To exercise any of these rights (where applicable), you can contact
                us using the details in the{" "}
                <a href="#contact" className="text-sky-300 hover:text-sky-400">
                  Contact Us
                </a>{" "}
                section below. We may need to verify your identity before processing
                certain requests.
              </p>
            </div>
          </section>

          {/* 8. International users */}
          <section id="international">
            <h2 className="text-2xl font-semibold text-white mb-4">
              8. International Users & Data Transfers
            </h2>
            <div className="text-slate-300 space-y-3 text-sm sm:text-base">
              <p>
                CalculatorHub is accessible globally, and your use of the site may
                involve transferring information to servers located in different
                countries. Privacy laws in those countries may differ from the laws in
                your jurisdiction.
              </p>
              <p>
                By using our website, you consent to the processing and transfer of
                information in accordance with this Privacy Policy and applicable
                law. Where required, we aim to rely on appropriate safeguards for
                international transfers.
              </p>
            </div>
          </section>

          {/* 9. Children */}
          <section id="children">
            <h2 className="text-2xl font-semibold text-white mb-4">
              9. Children&apos;s Privacy
            </h2>
            <div className="text-slate-300 space-y-3 text-sm sm:text-base">
              <p>
                CalculatorHub is primarily designed for general audiences including
                students, professionals and everyday users, and is{" "}
                <strong>not</strong> specifically directed at children under the age
                of 13 (or the minimum age in your jurisdiction).
              </p>
              <p>
                We do not knowingly collect personal information from children. If you
                believe that a child has provided personal information through our
                contact form, please reach out to us so we can review and, if
                appropriate, delete the information.
              </p>
            </div>
          </section>

          {/* 10. Changes */}
          <section id="changes">
            <h2 className="text-2xl font-semibold text-white mb-4">
              10. Changes to This Privacy Policy
            </h2>
            <div className="text-slate-300 space-y-3 text-sm sm:text-base">
              <p>
                We may update this Privacy Policy from time to time to reflect changes
                in our tools, legal requirements or best practices. When we make
                material changes, we will:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
                <li>Update the &quot;Last updated&quot; date at the top of this page.</li>
                <li>
                  Post the revised Privacy Policy on this page so you can review the
                  new version.
                </li>
              </ul>
              <p>
                Your continued use of CalculatorHub after changes have been published
                will be taken as your acceptance of the updated Privacy Policy.
              </p>
            </div>
          </section>

          {/* 11. Contact */}
          <section id="contact">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Mail className="h-6 w-6 text-yellow-400" />
              11. Contacting Us About Privacy
            </h2>
            <div className="text-slate-300 space-y-3 text-sm sm:text-base">
              <p>
                If you have any questions, concerns or requests related to this
                Privacy Policy or our data practices, you can contact us at:
              </p>
              <div className="rounded-xl bg-slate-900/80 border border-slate-700 p-4 text-sm">
                <p className="text-slate-100 font-medium">CalculatorHub Privacy</p>
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
                We aim to respond to privacy-related enquiries within a reasonable
                timeframe, usually within a few business days.
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

export default PrivacyPolicy;
