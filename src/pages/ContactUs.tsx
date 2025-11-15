// src/pages/ContactUs.tsx
import React, { useState } from "react";
import {
  Mail,
  MessageSquare,
  Send,
  MapPin,
  Clock,
  Phone,
  Shield,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Globe2,
} from "lucide-react";
import { Link } from "react-router-dom";

import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import { seoData } from "../utils/seoData";

// 🔑 Web3Forms access key (your API code)
const WEB3FORMS_ACCESS_KEY = "e6d8ce47-a384-456b-ba94-748112766523";

const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    toolUrl: "",
    priority: "normal",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] =
    useState<"idle" | "success" | "error">("idle");
  const [subscribeUpdates, setSubscribeUpdates] = useState(false);
  const [consent, setConsent] = useState(false);

  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If you want to force consent, uncomment this block:
    if (!consent) {
      setSubmitStatus("error");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          from_name: "CalculatorHub Contact Form",
          to_email: "support@calculatorhub.site",

          // User fields
          name: formData.name,
          email: formData.email,
          subject:
            formData.subject && formData.subject !== ""
              ? formData.subject
              : "Contact form submission",
          message: formData.message,

          // Extra meta for your inbox
          priority: formData.priority,
          tool_url: formData.toolUrl,
          subscribe_updates: subscribeUpdates ? "Yes" : "No",
          page_url:
            typeof window !== "undefined"
              ? window.location.href
              : "https://calculatorhub.site/contact-us",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus("success");
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
          toolUrl: "",
          priority: "normal",
        });
        setSubscribeUpdates(false);
        setConsent(false);

        // Reset status after 5s
        setTimeout(() => setSubmitStatus("idle"), 5000);
      } else {
        console.error("Web3Forms error:", data);
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Form submit error:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead
        title={seoData.contactUs.title}
        description={seoData.contactUs.description}
        canonical="https://calculatorhub.site/contact-us"
        breadcrumbs={[{ name: "Contact Us", url: "/contact-us" }]}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <Breadcrumbs items={[{ name: "Contact Us", url: "/contact-us" }]} />

        {/* ================= HERO / INTRO ================= */}
        <section className="mb-10 rounded-2xl bg-gradient-to-r from-sky-900/70 via-slate-950 to-fuchsia-900/60 border border-sky-500/30 shadow-xl shadow-slate-900/60 px-5 sm:px-8 py-7 sm:py-9">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start lg:items-center">
            <div className="flex-1 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/60 border border-cyan-400/40 px-3 py-1 text-[11px] sm:text-xs text-cyan-100 mb-1">
                <Globe2 className="w-3.5 h-3.5 text-cyan-300" />
                Global calculator support • Free tools • Fast replies
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-sky-500/20 border border-sky-400/60 flex items-center justify-center shadow-lg shadow-sky-900/70">
                  <Mail className="h-5 w-5 text-sky-200" />
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                  Contact CalculatorHub Support
                </h1>
              </div>

              <p className="text-sm sm:text-base text-slate-200/90 max-w-2xl">
                Need help with a calculator, found a bug, or want a new tool
                added? Send us a message and our small, focused team will review
                it and respond as soon as possible.
              </p>

              <ul className="flex flex-wrap gap-2 text-[11px] sm:text-xs text-slate-100/90">
                <li className="px-2.5 py-1 rounded-full bg-slate-900/70 border border-emerald-400/40 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  Typical reply: within 24 hours
                </li>
                <li className="px-2.5 py-1 rounded-full bg-slate-900/70 border border-sky-400/40 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-sky-300" />
                  No spam or login required
                </li>
                <li className="px-2.5 py-1 rounded-full bg-slate-900/70 border border-purple-400/40 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-purple-300" />
                  Product, tech & business questions welcome
                </li>
              </ul>
            </div>

            {/* Small stats panel */}
            <div className="w-full lg:w-64 bg-slate-950/80 border border-slate-700/80 rounded-2xl p-4 text-xs sm:text-sm text-slate-100 space-y-3 shadow-lg shadow-black/60">
              <p className="font-semibold text-slate-50">
                Why users contact us:
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Calculator issues</span>
                  <span className="text-emerald-300 font-semibold">48%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-emerald-400/90 w-[48%]" />
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-slate-300">Feature requests</span>
                  <span className="text-sky-300 font-semibold">32%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-sky-400/90 w-[32%]" />
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-slate-300">Business / API</span>
                  <span className="text-fuchsia-300 font-semibold">20%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-fuchsia-400/90 w-[20%]" />
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                These are approximate internal stats to give you a sense of
                what kind of messages we handle every day.
              </p>
            </div>
          </div>
        </section>

        {/* ================= TEAM PROFILES ================= */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="glow-card rounded-2xl p-6 bg-slate-950/80 border border-slate-800/80">
            <h3 className="text-xl font-semibold text-white mb-2">
              Rofiqul Islam – Senior Partner
            </h3>
            <p className="text-slate-300 text-sm">
              Rofiqul Islam is the Senior Partner and founder of CalculatorHub.
              With deep experience in designing user-friendly calculators and
              financial tools, he ensures the platform stays accurate, fast and
              accessible for everyday users, students and professionals.
            </p>
          </div>

          <div className="glow-card rounded-2xl p-6 bg-slate-950/80 border border-slate-800/80">
            <h3 className="text-xl font-semibold text-white mb-2">
              Siraj Shah – Associate Partner
            </h3>
            <p className="text-slate-300 text-sm">
              Siraj Shah is the Associate Partner at CalculatorHub. He supports
              product development, performance optimization and user experience,
              helping the platform grow with reliable tools, cleaner interfaces
              and smooth interactions across devices.
            </p>
          </div>
        </section>

        {/* ================= MAIN GRID: FORM + INFO ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ========== LEFT: FORM ========== */}
          <div className="lg:col-span-2">
            <div className="glow-card rounded-2xl p-6 sm:p-8 bg-slate-950/90 border border-slate-800/80 shadow-xl shadow-black/50">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                    <MessageSquare className="h-6 w-6 text-sky-400" />
                    Send us a message
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Share as much detail as you can — it helps us respond
                    faster and more accurately.
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-emerald-500/50 text-[11px] text-emerald-200">
                  <Clock className="w-3.5 h-3.5" />
                  Typically responds in &lt; 24 hours
                </div>
              </div>

              {submitStatus === "success" && (
                <div className="mb-6 p-4 rounded-lg bg-emerald-500/15 border border-emerald-400/60">
                  <p className="text-emerald-50 font-medium text-sm">
                    Thank you for your message! Our team has received it and
                    will reply to you at your email address as soon as possible.
                  </p>
                </div>
              )}

              {submitStatus === "error" && (
                <div className="mb-6 p-4 rounded-lg bg-rose-500/15 border border-rose-400/60">
                  <p className="text-rose-50 font-medium text-sm">
                    Something went wrong. Please check the required fields and
                    your consent, then try again. You can also email us
                    directly at{" "}
                    <span className="underline">
                      support@calculatorhub.site
                    </span>
                    .
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Row: name + email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 glow-input rounded-lg bg-slate-900 border border-slate-700 text-slate-50 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 glow-input rounded-lg bg-slate-900 border border-slate-700 text-slate-50 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                {/* Subject + priority */}
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 glow-input rounded-lg bg-slate-900 border border-slate-700 text-slate-50 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="bug-report">Bug Report</option>
                      <option value="feature-request">Feature Request</option>
                      <option value="calculator-issue">Calculator Issue</option>
                      <option value="business">Business / Partnership</option>
                      <option value="api">API / Integration</option>
                      <option value="feedback">Feedback</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="priority"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Priority
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-3 py-3 glow-input rounded-lg bg-slate-900 border border-slate-700 text-slate-50 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                {/* Optional calculator / URL field */}
                <div>
                  <label
                    htmlFor="toolUrl"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Calculator or page link (optional)
                  </label>
                  <input
                    type="url"
                    id="toolUrl"
                    name="toolUrl"
                    value={formData.toolUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 glow-input rounded-lg bg-slate-900 border border-slate-700 text-slate-50 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                    placeholder="Paste the URL of the calculator or page you’re asking about"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    This helps us reproduce issues or understand your request
                    faster.
                  </p>
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 glow-input rounded-lg bg-slate-900 border border-slate-700 text-slate-50 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-vertical text-sm"
                    placeholder="Tell us how we can help you — include steps to reproduce any issue, what you expected, and what actually happened."
                  />
                </div>

                {/* Consent / options */}
                <div className="space-y-2 text-xs sm:text-sm text-slate-300">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-500 focus:ring-sky-500"
                    />
                    <span>
                      I understand that this form is for support and feedback
                      only. I agree not to include passwords or highly sensitive
                      financial information.
                    </span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subscribeUpdates}
                      onChange={(e) => setSubscribeUpdates(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>
                      Send me occasional updates about new calculators and major
                      product improvements (no spam, unsubscribe anytime).
                    </span>
                  </label>
                </div>

                {/* Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 glow-button text-white rounded-lg bg-gradient-to-r from-sky-500 via-cyan-500 to-fuchsia-500 hover:brightness-110 transition-all shadow-lg shadow-cyan-900/60 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Send Message</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ========== RIGHT: INFO + FAQ + LINKS ========== */}
          <div className="space-y-6">
            {/* Contact details */}
            <div className="glow-card rounded-2xl p-6 bg-slate-950/90 border border-slate-800/80">
              <h3 className="text-xl font-semibold text-white mb-4">
                Get in touch
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-sky-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-300">Email</p>
                    <p className="text-white font-medium">
                      support@calculatorhub.site
                    </p>
                    <p className="text-[11px] text-slate-500">
                      For all calculator questions, bug reports and feature
                      ideas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-300">Response time</p>
                    <p className="text-white font-medium">Within 24 hours</p>
                    <p className="text-[11px] text-slate-500">
                      Complex technical questions may take slightly longer if we
                      need to reproduce or verify results.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-300">Location</p>
                    <p className="text-white font-medium">Global Service</p>
                    <p className="text-[11px] text-slate-500">
                      CalculatorHub is built for users worldwide — desktop,
                      tablet and mobile.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-300">Phone support</p>
                    <p className="text-white font-medium">Email-first support</p>
                    <p className="text-[11px] text-slate-500">
                      We currently prioritise email to keep responses detailed,
                      accurate and documented for you.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="glow-card rounded-2xl p-6 bg-slate-950/90 border border-slate-800/80">
              <h3 className="text-xl font-semibold text-white mb-4">
                Frequently asked
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="text-white font-medium mb-1">
                    Are the calculators free?
                  </h4>
                  <p className="text-slate-300">
                    Yes. Every calculator and converter on CalculatorHub is
                    completely free to use with no hidden paywall.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-medium mb-1">
                    Do I need to create an account?
                  </h4>
                  <p className="text-slate-300">
                    No account is required. You can use all tools instantly
                    without signing up.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-medium mb-1">
                    Can I suggest new calculators?
                  </h4>
                  <p className="text-slate-300">
                    Absolutely. Use the contact form to send feature ideas,
                    specific formulas or workflows you want us to support.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-medium mb-1">
                    Are calculations guaranteed to be accurate?
                  </h4>
                  <p className="text-slate-300">
                    We work hard to keep formulas correct and test our tools
                    regularly, but you should always double-check critical
                    results with a professional or a second source.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="glow-card rounded-2xl p-6 bg-slate-950/90 border border-slate-800/80">
              <h3 className="font-semibold text-white mb-4">Quick access</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/"
                    className="flex items-center justify-between text-slate-300 hover:text-sky-300 transition-colors"
                  >
                    <span>All Calculators</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy-policy"
                    className="flex items-center justify-between text-slate-300 hover:text-sky-300 transition-colors"
                  >
                    <span>Privacy Policy</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms-of-service"
                    className="flex items-center justify-between text-slate-300 hover:text-sky-300 transition-colors"
                  >
                    <span>Terms of Service</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Optional bottom Ad + cross-links */}
        <AdBanner type="bottom" />
      </div>
    </>
  );
};

export default ContactUs;
