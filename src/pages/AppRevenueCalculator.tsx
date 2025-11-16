// src/pages/AppRevenueCalculator.tsx
import React, { useEffect, useMemo, useState, Suspense } from "react";
import { Link } from "react-router-dom";
import {
  Smartphone,
  Settings2,
  Info,
  DollarSign,
  Copy,
  Check,
  RefreshCw,
  BarChart3,
} from "lucide-react";

import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import { generateCalculatorSchema } from "../utils/seoData";

// Lazy-load
const AdBanner = React.lazy(() => import("../components/AdBanner"));
const RelatedCalculators = React.lazy(
  () => import("../components/RelatedCalculators")
);

/* =============== Utils =============== */

// clamp to zero; also guards NaN
const clamp0 = (n: number) => (isNaN(n) || n < 0 ? 0 : n);

// Compact money formatter
function moneyFmt(value: number, withSymbol: boolean = true): string {
  if (!isFinite(value)) return withSymbol ? "$0" : "0";

  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const sym = withSymbol ? "$" : "";

  if (abs < 9_999_999)
    return `${sign}${sym}${abs.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;

  const suffixes = ["", "K", "M", "B", "T"];
  let tier = Math.floor(Math.log10(abs) / 3);
  if (tier >= suffixes.length) tier = suffixes.length - 1;

  const scale = Math.pow(10, tier * 3);
  const scaled = abs / scale;
  const suffix = suffixes[tier];

  return `${sign}${sym}${scaled.toFixed(2)}${suffix}`;
}

// block negative / exponent in number inputs
function blockBadKeys(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+")
    e.preventDefault();
}

const ADVANCED_LS_KEY = "app-revenue-advanced-mode";

/* =============== Component =============== */

const AppRevenueCalculator: React.FC = () => {
  // ---------- Basic inputs ----------
  const [dailyActiveUsers, setDailyActiveUsers] = useState<number>(10000);
  const [sessionsPerUser, setSessionsPerUser] = useState<number>(2);
  const [adsPerSession, setAdsPerSession] = useState<number>(3); // total ad impressions per session (all formats)
  const [fillRate, setFillRate] = useState<number>(80); // % of requests that turn into impressions
  const [ecpmLow, setEcpmLow] = useState<number>(3.5);
  const [ecpmHigh, setEcpmHigh] = useState<number>(9);

  // 30-day window
  const [daysPerMonth] = useState<number>(30);

  // ---------- Advanced mode ----------
  const [advancedEnabled, setAdvancedEnabled] = useState<boolean>(false);
  const [advLoading, setAdvLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<"basic" | "advanced" | null>(null);

  // Per-format shares (% of total impressions)
  const [bannerShare, setBannerShare] = useState<number>(40);
  const [interstitialShare, setInterstitialShare] = useState<number>(35);
  const [rewardedShare, setRewardedShare] = useState<number>(25);

  // Per-format eCPM (USD)
  const [bannerEcpm, setBannerEcpm] = useState<number>(2.5);
  const [interstitialEcpm, setInterstitialEcpm] = useState<number>(7);
  const [rewardedEcpm, setRewardedEcpm] = useState<number>(12);

  // Extra revenue sources
  const [iapMonthly, setIapMonthly] = useState<number>(0); // in-app purchases
  const [subscriptionsMonthly, setSubscriptionsMonthly] =
    useState<number>(0);
  const [otherMonthly, setOtherMonthly] = useState<number>(0);

  // ---------- Effects ----------
  useEffect(() => {
    const saved = localStorage.getItem(ADVANCED_LS_KEY);
    if (saved === "1") setAdvancedEnabled(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(ADVANCED_LS_KEY, advancedEnabled ? "1" : "0");
  }, [advancedEnabled]);

  const handleToggleAdvanced = () => {
    if (!advancedEnabled) {
      setAdvLoading(true);
      setTimeout(() => {
        setAdvancedEnabled(true);
        setAdvLoading(false);
      }, 500);
    } else {
      setAdvancedEnabled(false);
      setAdvLoading(false);
    }
  };

  const handleReset = () => {
    setDailyActiveUsers(10000);
    setSessionsPerUser(2);
    setAdsPerSession(3);
    setFillRate(80);
    setEcpmLow(3.5);
    setEcpmHigh(9);
    setBannerShare(40);
    setInterstitialShare(35);
    setRewardedShare(25);
    setBannerEcpm(2.5);
    setInterstitialEcpm(7);
    setRewardedEcpm(12);
    setIapMonthly(0);
    setSubscriptionsMonthly(0);
    setOtherMonthly(0);
  };

  // ---------- Calculations ----------

  const basicResult = useMemo(() => {
    if (!dailyActiveUsers || dailyActiveUsers <= 0) return null;
    if (!sessionsPerUser || sessionsPerUser <= 0) return null;
    if (!adsPerSession || adsPerSession <= 0) return null;

    const dau = dailyActiveUsers;
    const sessions = sessionsPerUser;
    const ads = adsPerSession;
    const fr = fillRate / 100;

    const totalRequestsPerDay = dau * sessions * ads;
    const impressionsPerDay = totalRequestsPerDay * fr;
    const impressionsPerMonth = impressionsPerDay * daysPerMonth;

    // blended eCPM low/high
    const low = ecpmLow;
    const high = ecpmHigh;

    const monthlyMin = (impressionsPerMonth / 1000) * low;
    const monthlyMax = (impressionsPerMonth / 1000) * high;
    const yearlyMin = monthlyMin * 12;
    const yearlyMax = monthlyMax * 12;

    // ARPDAU (per DAU)
    const arpdaumin = dailyActiveUsers
      ? monthlyMin / (dailyActiveUsers * daysPerMonth)
      : 0;
    const arpdaumax = dailyActiveUsers
      ? monthlyMax / (dailyActiveUsers * daysPerMonth)
      : 0;

    return {
      impressionsPerMonth,
      monthlyMin,
      monthlyMax,
      yearlyMin,
      yearlyMax,
      arpdaumin,
      arpdaumax,
    };
  }, [
    dailyActiveUsers,
    sessionsPerUser,
    adsPerSession,
    fillRate,
    ecpmLow,
    ecpmHigh,
    daysPerMonth,
  ]);

  const advancedResult = useMemo(() => {
    if (!advancedEnabled || !basicResult) return null;

    const totalImpressions = basicResult.impressionsPerMonth;

    const bannerImpressions =
      (totalImpressions * clamp0(bannerShare)) / 100 || 0;
    const interstitialImpressions =
      (totalImpressions * clamp0(interstitialShare)) / 100 || 0;
    const rewardedImpressions =
      (totalImpressions * clamp0(rewardedShare)) / 100 || 0;

    const bannerRevenue = (bannerImpressions / 1000) * clamp0(bannerEcpm);
    const interstitialRevenue =
      (interstitialImpressions / 1000) * clamp0(interstitialEcpm);
    const rewardedRevenue =
      (rewardedImpressions / 1000) * clamp0(rewardedEcpm);

    const adsMonthly = bannerRevenue + interstitialRevenue + rewardedRevenue;

    const extras =
      (iapMonthly || 0) + (subscriptionsMonthly || 0) + (otherMonthly || 0);

    const totalMonthly = adsMonthly + extras;
    const totalYearly = totalMonthly * 12;

    return {
      bannerImpressions,
      interstitialImpressions,
      rewardedImpressions,
      bannerRevenue,
      interstitialRevenue,
      rewardedRevenue,
      adsMonthly,
      extrasMonthly: extras,
      totalMonthly,
      totalYearly,
    };
  }, [
    advancedEnabled,
    basicResult,
    bannerShare,
    interstitialShare,
    rewardedShare,
    bannerEcpm,
    interstitialEcpm,
    rewardedEcpm,
    iapMonthly,
    subscriptionsMonthly,
    otherMonthly,
  ]);

  const handleCopy = async (type: "basic" | "advanced") => {
    try {
      let text = "";

      if (type === "basic" && basicResult) {
        text += `App Revenue (Ad impressions only)\n`;
        text += `Monthly: ${moneyFmt(
          basicResult.monthlyMin
        )} – ${moneyFmt(basicResult.monthlyMax)}\n`;
        text += `Yearly: ${moneyFmt(
          basicResult.yearlyMin
        )} – ${moneyFmt(basicResult.yearlyMax)}\n`;
      }

      if (type === "advanced" && advancedResult) {
        text += `App Revenue (Advanced – formats + extras)\n`;
        text += `Monthly: ${moneyFmt(
          advancedResult.totalMonthly
        )}\nYearly: ${moneyFmt(advancedResult.totalYearly)}\n`;
      }

      if (!text.trim()) return;

      await navigator.clipboard.writeText(text.trim());
      setCopied(type);
      setTimeout(() => setCopied(null), 1400);
    } catch (e) {
      console.error(e);
    }
  };

  /* =============== Render =============== */

  return (
    <>
      <SEOHead
        title="App Revenue Calculator (2025–2026) – AdMob & In-App Ads Earnings Estimator"
        description="Estimate mobile app revenue from AdMob and in-app ads using a simple DAU-based model. Enter DAU, sessions, ad impressions, fill rate and eCPM to project monthly and yearly earnings. Advanced Mode lets you split by ad format and add IAP/subscription income."
        keywords={[
          "app revenue calculator",
          "admob revenue calculator",
          "admob revenue estimator",
          "mobile app ads income",
          "app monetization calculator",
          "app revenue estimator",
          "ARPDAU calculator",
          "in-app purchase revenue calculator",
          "subscription app revenue estimator",
          "mobile game monetization calculator",
        ]}
        canonical="https://calculatorhub.site/app-revenue-calculator"
        schemaData={[
          /* 1) WebPage + embedded Article */
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id":
              "https://calculatorhub.site/app-revenue-calculator#webpage",
            url: "https://calculatorhub.site/app-revenue-calculator",
            name: "App Revenue Calculator – AdMob & Mobile App Monetization Earnings Estimator",
            headline:
              "App Revenue Calculator – AdMob & Mobile App Monetization Earnings Estimator",
            description:
              "Free DAU-based app revenue calculator for estimating AdMob and in-app ads earnings. Model monthly and yearly revenue with DAU, sessions, impressions, fill rate and eCPM. Advanced Mode supports banner, interstitial and rewarded ads plus in-app purchases and subscriptions.",
            inLanguage: "en",
            isPartOf: { "@id": "https://calculatorhub.site/#website" },
            primaryImageOfPage: {
              "@type": "ImageObject",
              "@id":
                "https://calculatorhub.site/images/app_revenue_calculator.webp#primaryimg",
              url:
                "https://calculatorhub.site/images/app_revenue_calculator.webp",
              width: 1200,
              height: 675,
            },
            mainEntity: {
              "@type": "Article",
              "@id":
                "https://calculatorhub.site/app-revenue-calculator#article",
              headline:
                "App Revenue Calculator — Estimate AdMob & In-App Earnings from DAU & eCPM",
              description:
                "Interactive app revenue estimator that uses DAU, sessions, ad impressions, fill rate and eCPM to calculate ad revenue, ARPDAU and total monthly/yearly earnings. Advanced Mode adds format-level control and non-ad revenue such as IAP and subscriptions.",
              image: [
                "https://calculatorhub.site/images/app_revenue_calculator.webp",
              ],
              author: {
                "@type": "Organization",
                name: "CalculatorHub",
                url: "https://calculatorhub.site",
              },
              publisher: { "@id": "https://calculatorhub.site/#organization" },
              datePublished: "2025-11-15",
              dateModified: "2025-11-15",
              mainEntityOfPage: {
                "@id":
                  "https://calculatorhub.site/app-revenue-calculator#webpage",
              },
              articleSection: [
                "Overview: What this App Revenue Calculator does",
                "How to use the App Revenue Calculator",
                "Revenue logic: DAU, impressions, eCPM and ARPDAU",
                "Advanced Mode: ad formats and non-ad revenue",
                "Worked example for AdMob-style revenue",
                "Benefits for developers, studios and growth teams",
                "Monetization tips for eCPM, fill rate and mix",
                "Pros and cons of using an app revenue calculator",
                "FAQ",
              ],
            },
          },

          /* 2) Breadcrumbs */
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "@id":
              "https://calculatorhub.site/app-revenue-calculator#breadcrumbs",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://calculatorhub.site/",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Misc Tools",
                item: "https://calculatorhub.site/category/misc-tools",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: "App Revenue Calculator",
                item:
                  "https://calculatorhub.site/app-revenue-calculator",
              },
            ],
          },

          /* 3) FAQ (aligned with on-page FAQ section) */
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://calculatorhub.site/app-revenue-calculator#faq",
            mainEntity: [
              {
                "@type": "Question",
                name: "Is this an official AdMob revenue calculator?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text:
                    "No. This is an independent AdMob revenue estimator built for planning and educational use. It applies standard eCPM-based calculations to forecast revenue, but it does not connect to any ad network account and cannot guarantee exact payouts.",
                },
              },
              {
                "@type": "Question",
                name: "What eCPM range should I use for my app?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text:
                    "The best eCPM range depends on your app genre, audience geography and ad strategy. Many teams start with a conservative lower bound and a more optimistic upper bound, then refine those values over time using real AdMob and mediation reports for their app.",
                },
              },
              {
                "@type": "Question",
                name:
                  "Can this app revenue calculator work for both iOS and Android apps?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text:
                    "Yes. The calculator is platform-agnostic. You can use it for Android, iOS or cross-platform apps by entering your own DAU, eCPM and fill rate assumptions, regardless of the ad network or mediation platform you use.",
                },
              },
              {
                "@type": "Question",
                name:
                  "Does this calculator support apps that only use IAP or subscriptions?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text:
                    "Yes. In Advanced Mode you can set ad revenue inputs to zero and only fill the in-app purchase, subscription and other monetization fields. In that case, the page behaves like an in-app purchase or subscription revenue calculator for your mobile app.",
                },
              },
              {
                "@type": "Question",
                name: "What is ARPDAU and why is it important for app monetization?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text:
                    "ARPDAU stands for Average Revenue Per Daily Active User. It measures how much revenue your app generates from each active user in a single day. This app revenue calculator includes ARPDAU to help you benchmark monetization performance and compare different apps, markets and strategies using a single standardized metric.",
                },
              },
            ],
          },

          /* 4) WebApplication */
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://calculatorhub.site/app-revenue-calculator#webapp",
            name: "App Revenue Calculator",
            url: "https://calculatorhub.site/app-revenue-calculator",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description:
              "Interactive DAU-based app revenue calculator that estimates AdMob-style ad earnings and ARPDAU, with optional Advanced Mode for ad formats plus in-app purchases and subscription revenue.",
            publisher: { "@id": "https://calculatorhub.site/#organization" },
            image: [
              "https://calculatorhub.site/images/app_revenue_calculator.webp",
            ],
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
          },

          /* 5) SoftwareApplication */
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://calculatorhub.site/app-revenue-calculator#software",
            name: "Mobile App Revenue & ARPDAU Estimator",
            applicationCategory: "BusinessApplication",
            operatingSystem: "All",
            url: "https://calculatorhub.site/app-revenue-calculator",
            publisher: { "@id": "https://calculatorhub.site/#organization" },
            description:
              "Simple yet powerful app monetization calculator for developers and studios. Estimate AdMob revenue, ARPDAU and total app income from ads, in-app purchases and subscriptions.",
          },

          /* 6) WebSite */
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": "https://calculatorhub.site/#website",
            url: "https://calculatorhub.site",
            name: "CalculatorHub",
            publisher: { "@id": "https://calculatorhub.site/#organization" },
            potentialAction: {
              "@type": "SearchAction",
              target: "https://calculatorhub.site/search?q={query}",
              "query-input": "required name=query",
            },
          },

          /* 7) Organization */
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": "https://calculatorhub.site/#organization",
            name: "CalculatorHub",
            url: "https://calculatorhub.site",
            logo: {
              "@type": "ImageObject",
              url: "https://calculatorhub.site/images/logo.png",
            },
          },
        ]}
        breadcrumbs={[
          { name: "Misc Tools", url: "/category/misc-tools" },
          { name: "App Revenue Calculator", url: "/app-revenue-calculator" },
        ]}
      />

      <>
        {/* Core meta */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="robots"
          content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
        />
        <link
          rel="canonical"
          href="https://calculatorhub.site/app-revenue-calculator"
        />

        {/* Hreflang */}
        <link
          rel="alternate"
          href="https://calculatorhub.site/app-revenue-calculator"
          hreflang="en"
        />
        <link
          rel="alternate"
          href="https://calculatorhub.site/bn/app-revenue-calculator"
          hreflang="bn"
        />
        <link
          rel="alternate"
          href="https://calculatorhub.site/app-revenue-calculator"
          hreflang="x-default"
        />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="CalculatorHub" />
        <meta
          property="og:title"
          content="App Revenue Calculator (2025–2026) — AdMob & In-App Ads Earnings Estimator"
        />
        <meta
          property="og:description"
          content="Project mobile app ad revenue using DAU, sessions, ad impressions, fill rate and eCPM. Advanced Mode splits formats and adds in-app purchases and subscription income."
        />
        <meta
          property="og:url"
          content="https://calculatorhub.site/app-revenue-calculator"
        />
        <meta
          property="og:image"
          content="https://calculatorhub.site/images/app_revenue_calculator.webp"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="App revenue calculator UI showing DAU, eCPM and estimated earnings cards"
        />
        <meta property="og:locale" content="en_US" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="App Revenue Calculator — AdMob & In-App Monetization Estimator"
        />
        <meta
          name="twitter:description"
          content="Free DAU-based app revenue calculator with Normal & Advanced modes for ad formats, ARPDAU and IAP/subscription income."
        />
        <meta
          name="twitter:image"
          content="https://calculatorhub.site/images/app_revenue_calculator.webp"
        />
        <meta name="twitter:creator" content="@CalculatorHub" />
        <meta name="twitter:site" content="@CalculatorHub" />

        {/* Icons / PWA */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0ea5e9" />

        {/* Performance */}
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="preload"
          as="image"
          href="/images/app_revenue_calculator.webp"
          fetchpriority="high"
        />
        <link
          rel="preload"
          href="/fonts/Inter-Variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />

        {/* Misc */}
        <link
          rel="sitemap"
          type="application/xml"
          href="https://calculatorhub.site/sitemap.xml"
        />
        <meta name="referrer" content="no-referrer-when-downgrade" />
        <meta name="format-detection" content="telephone=no" />
      </>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <Breadcrumbs
          items={[
            { name: "Misc Tools", url: "/category/misc-tools" },
            { name: "App Revenue Calculator", url: "/app-revenue-calculator" },
          ]}
        />

        {/* Header */}
        <div className="mb-8 text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200 mb-3">
            <Smartphone className="w-4 h-4" />
            App Monetization • AdMob / In-App Ads
          </div>
          <h1 className="text-white text-2xl sm:text-3xl font-bold mb-2">
            App Revenue Calculator
          </h1>
          <p className="text-slate-200 text-sm sm:text-base">
            Estimate how much your mobile app can earn from ad impressions,
            plus in-app purchases and subscriptions in Advanced Mode.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ============ Inputs ============ */}
          <div className="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-5 sm:p-6 shadow-xl shadow-slate-950/40">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-100">
                    Traffic & Ad Setup
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Start with a simple DAU-based model. All fields are optional
                    but recommended.
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggleAdvanced}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] sm:text-xs font-medium transition-all ${
                  advancedEnabled
                    ? "bg-indigo-600/90 border-indigo-400 text-white shadow-md shadow-indigo-900/40"
                    : "bg-slate-900/80 border-slate-600 text-slate-100 hover:bg-slate-800"
                }`}
              >
                <Settings2 className="w-4 h-4" />
                {advancedEnabled ? "Advanced: ON" : "Advanced Mode"}
              </button>
            </div>

            <div className="space-y-4">
              {/* DAU */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                  Daily Active Users (DAU)
                </label>
                <input
                  type="number"
                  min={0}
                  inputMode="decimal"
                  onKeyDown={blockBadKeys}
                  value={dailyActiveUsers}
                  onChange={(e) =>
                    setDailyActiveUsers(clamp0(Number(e.target.value)))
                  }
                  className="w-full px-3 sm:px-4 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/80"
                  placeholder="e.g. 10000"
                />
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                  Approximate number of unique users who open your app daily.
                </p>
              </div>

              {/* Sessions per user */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                  Sessions per user per day
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  inputMode="decimal"
                  onKeyDown={blockBadKeys}
                  value={sessionsPerUser}
                  onChange={(e) =>
                    setSessionsPerUser(clamp0(Number(e.target.value)))
                  }
                  className="w-full px-3 sm:px-4 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/80"
                  placeholder="e.g. 2"
                />
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                  How many times an average user opens your app in a day.
                </p>
              </div>

              {/* Ads per session */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                  Ad impressions per session
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  inputMode="decimal"
                  onKeyDown={blockBadKeys}
                  value={adsPerSession}
                  onChange={(e) =>
                    setAdsPerSession(clamp0(Number(e.target.value)))
                  }
                  className="w-full px-3 sm:px-4 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/80"
                  placeholder="e.g. 3"
                />
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                  Total ads shown per session (banner + interstitial + rewarded
                  etc.).
                </p>
              </div>

              {/* Fill rate */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                  Fill rate (% of ad requests filled)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={1}
                    value={fillRate}
                    onChange={(e) =>
                      setFillRate(clamp0(Number(e.target.value)))
                    }
                    className="flex-1 accent-cyan-500"
                  />
                  <div className="w-12 text-right text-sm text-slate-100">
                    {fillRate}%
                  </div>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                  Higher fill rate means more impressions from the same traffic.
                </p>
              </div>

              {/* eCPM range */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-slate-300" />
                  Blended eCPM (USD per 1000 impressions)
                </label>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <div className="flex-1">
                    <span className="block text-[11px] text-slate-400 mb-0.5">
                      Low (conservative)
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      inputMode="decimal"
                      onKeyDown={blockBadKeys}
                      value={ecpmLow}
                      onChange={(e) =>
                        setEcpmLow(clamp0(Number(e.target.value)))
                      }
                      className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500/80"
                      placeholder="e.g. 3.5"
                    />
                  </div>
                  <div className="hidden sm:block text-slate-400">–</div>
                  <div className="flex-1">
                    <span className="block text-[11px] text-slate-400 mb-0.5">
                      High (optimistic)
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      inputMode="decimal"
                      onKeyDown={blockBadKeys}
                      value={ecpmHigh}
                      onChange={(e) =>
                        setEcpmHigh(clamp0(Number(e.target.value)))
                      }
                      className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500/80"
                      placeholder="e.g. 9"
                    />
                  </div>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                  Use a range to see best/worst-case earnings. eCPM varies by
                  country, niche and platform.
                </p>
              </div>

              {/* Advanced panel */}
              {advLoading && (
                <div className="flex items-center gap-2 text-slate-200 text-[11px] sm:text-xs mt-1">
                  <div className="h-4 w-4 rounded-full border-2 border-slate-500 border-t-white animate-spin" />
                  <span>Loading advanced options…</span>
                </div>
              )}

              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  advancedEnabled
                    ? "max-h-[900px] opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="mt-4 border-t border-slate-700 pt-4 space-y-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-sky-300" />
                    Advanced Mode – Ad formats & extra revenue
                  </h3>

                  {/* Format split */}
                  <div className="space-y-2">
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      Split your impressions into formats. Percentages don&apos;t
                      need to equal exactly 100%; they are treated as a rough
                      mix.
                    </p>

                    <div className="space-y-2 text-[11px] sm:text-xs">
                      <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr] gap-2 items-center">
                        <span className="text-slate-300">Format</span>
                        <span className="text-right text-slate-400">
                          Share (%)
                        </span>
                        <span className="text-right text-slate-400">
                          eCPM (USD)
                        </span>
                      </div>

                      {/* Banner */}
                      <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr] gap-2 items-center">
                        <span className="text-slate-300">Banner</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          inputMode="decimal"
                          onKeyDown={blockBadKeys}
                          value={bannerShare}
                          onChange={(e) =>
                            setBannerShare(clamp0(Number(e.target.value)))
                          }
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-right text-white"
                        />
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          inputMode="decimal"
                          onKeyDown={blockBadKeys}
                          value={bannerEcpm}
                          onChange={(e) =>
                            setBannerEcpm(clamp0(Number(e.target.value)))
                          }
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-right text-white"
                        />
                      </div>

                      {/* Interstitial */}
                      <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr] gap-2 items-center">
                        <span className="text-slate-300">Interstitial</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          inputMode="decimal"
                          onKeyDown={blockBadKeys}
                          value={interstitialShare}
                          onChange={(e) =>
                            setInterstitialShare(
                              clamp0(Number(e.target.value))
                            )
                          }
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-right text-white"
                        />
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          inputMode="decimal"
                          onKeyDown={blockBadKeys}
                          value={interstitialEcpm}
                          onChange={(e) =>
                            setInterstitialEcpm(
                              clamp0(Number(e.target.value))
                            )
                          }
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-right text-white"
                        />
                      </div>

                      {/* Rewarded */}
                      <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr] gap-2 items-center">
                        <span className="text-slate-300">Rewarded</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          inputMode="decimal"
                          onKeyDown={blockBadKeys}
                          value={rewardedShare}
                          onChange={(e) =>
                            setRewardedShare(clamp0(Number(e.target.value)))
                          }
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-right text-white"
                        />
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          inputMode="decimal"
                          onKeyDown={blockBadKeys}
                          value={rewardedEcpm}
                          onChange={(e) =>
                            setRewardedEcpm(clamp0(Number(e.target.value)))
                          }
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-right text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Extra income */}
                  <div className="space-y-3">
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      Add non-ad revenue per month (optional).
                    </p>
                    <div className="grid grid-cols-1 gap-3 text-[11px] sm:text-xs">
                      <div>
                        <label className="block text-slate-300 mb-1">
                          In-app purchases ($/month)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          inputMode="decimal"
                          onKeyDown={blockBadKeys}
                          value={iapMonthly}
                          onChange={(e) =>
                            setIapMonthly(clamp0(Number(e.target.value)))
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-sky-500/80"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1">
                          Subscriptions ($/month)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          inputMode="decimal"
                          onKeyDown={blockBadKeys}
                          value={subscriptionsMonthly}
                          onChange={(e) =>
                            setSubscriptionsMonthly(
                              clamp0(Number(e.target.value))
                            )
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-sky-500/80"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1">
                          Other monetization ($/month)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          inputMode="decimal"
                          onKeyDown={blockBadKeys}
                          value={otherMonthly}
                          onChange={(e) =>
                            setOtherMonthly(clamp0(Number(e.target.value)))
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-sky-500/80"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reset */}
              <button
                onClick={handleReset}
                className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-[11px] sm:text-xs text-slate-200 hover:bg-slate-800"
              >
                <RefreshCw className="w-4 h-4" />
                Reset to default values
              </button>
            </div>
          </div>

          {/* ============ Results ============ */}
          <div className="rounded-2xl border border-slate-700/80 bg-slate-950/90 p-5 sm:p-6 flex flex-col justify-between shadow-2xl shadow-black/50">
            <div className="space-y-5">
              {/* Basic block */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-50 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    Estimated Ad Revenue
                  </h2>
                  <button
                    onClick={() => handleCopy("basic")}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-[11px] sm:text-xs text-slate-100 hover:bg-slate-800"
                  >
                    {copied === "basic" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="text-center p-4 rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-900/40 via-slate-950 to-emerald-950/60">
                    <Smartphone className="h-8 w-8 text-emerald-300 mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-emerald-100">
                      {basicResult
                        ? `${moneyFmt(
                            basicResult.monthlyMin
                          )} – ${moneyFmt(basicResult.monthlyMax)}`
                        : "$0 – $0"}
                    </div>
                    <div className="text-xs sm:text-sm text-emerald-200/80">
                      Estimated monthly ad revenue
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 text-center">
                      <div className="text-slate-400 mb-1">Yearly (approx.)</div>
                      <div className="font-semibold text-slate-100">
                        {basicResult
                          ? `${moneyFmt(
                              basicResult.yearlyMin
                            )} – ${moneyFmt(basicResult.yearlyMax)}`
                          : "$0 – $0"}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 text-center">
                      <div className="text-slate-400 mb-1">
                        ARPDAU (per active user)
                      </div>
                      <div className="font-semibold text-slate-100">
                        {basicResult
                          ? `${moneyFmt(
                              basicResult.arpdaumin,
                              false
                            )} – ${moneyFmt(basicResult.arpdaumax, false)}`
                          : "0 – 0"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-700 text-center">
                      <div className="text-slate-400 mb-1">
                        Monthly impressions
                      </div>
                      <div className="font-semibold text-slate-100">
                        {basicResult
                          ? basicResult.impressionsPerMonth.toLocaleString()
                          : 0}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-700 text-center">
                      <div className="text-slate-400 mb-1">Blended eCPM</div>
                      <div className="font-semibold text-slate-100">
                        ${ecpmLow.toFixed(2)} – ${ecpmHigh.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] sm:text-xs text-slate-500 flex items-start gap-1">
                    <Info className="w-3.5 h-3.5 mt-0.5 text-slate-400" />
                    This is a planning estimate based on DAU, ad density and
                    eCPM. Actual revenue depends on geography, user quality,
                    network mix, ad formats and policy compliance.
                  </p>
                </div>
              </div>

              {/* Advanced block */}
              <div className="mt-4 border-t border-slate-700 pt-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h2 className="text-sm sm:text-base font-semibold text-slate-100 flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-sky-400" />
                    Advanced Result (formats + extra income)
                  </h2>
                <button
                    onClick={() => handleCopy("advanced")}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-[11px] sm:text-xs text-slate-100 hover:bg-slate-800"
                  >
                    {copied === "advanced" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                {advancedEnabled && advancedResult ? (
                  <div className="space-y-3 text-[11px] sm:text-xs">
                    <div>
                      <p className="text-slate-400 mb-1">
                        Total monthly (ads + extras)
                      </p>
                      <p className="text-base sm:text-lg font-semibold text-slate-50">
                        {moneyFmt(advancedResult.totalMonthly)}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400 mb-1">
                        Total yearly (ads + extras)
                      </p>
                      <p className="text-sm sm:text-base font-semibold text-slate-100">
                        {moneyFmt(advancedResult.totalYearly)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-700">
                        <p className="text-slate-400 mb-1">Ads only</p>
                        <p className="text-slate-100">
                          {moneyFmt(advancedResult.adsMonthly)} / month
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-700">
                        <p className="text-slate-400 mb-1">
                          IAP + subscriptions + other
                        </p>
                        <p className="text-slate-100">
                          {moneyFmt(advancedResult.extrasMonthly)} / month
                        </p>
                      </div>
                    </div>

                    {/* Format mini-table */}
                    <div className="mt-2 rounded-lg border border-slate-700 bg-slate-950/80 overflow-hidden">
                      <div className="px-3 py-2 bg-slate-900/80 text-slate-300 font-medium text-[11px] sm:text-xs flex items-center gap-2">
                        <span className="w-20">Format</span>
                        <span className="flex-1 text-right pr-2">
                          Impressions / month
                        </span>
                        <span className="w-24 text-right">Revenue</span>
                      </div>
                      <div className="divide-y divide-slate-800 text-slate-200">
                        <div className="px-3 py-2 flex items-center text-[11px] sm:text-xs">
                          <span className="w-20 text-slate-300">Banner</span>
                          <span className="flex-1 text-right pr-2">
                            {advancedResult.bannerImpressions.toLocaleString()}
                          </span>
                          <span className="w-24 text-right">
                            {moneyFmt(advancedResult.bannerRevenue)}
                          </span>
                        </div>
                        <div className="px-3 py-2 flex items-center text-[11px] sm:text-xs">
                          <span className="w-20 text-slate-300">
                            Interstitial
                          </span>
                          <span className="flex-1 text-right pr-2">
                            {advancedResult.interstitialImpressions.toLocaleString()}
                          </span>
                          <span className="w-24 text-right">
                            {moneyFmt(advancedResult.interstitialRevenue)}
                          </span>
                        </div>
                        <div className="px-3 py-2 flex items-center text-[11px] sm:text-xs">
                          <span className="w-20 text-slate-300">Rewarded</span>
                          <span className="flex-1 text-right pr-2">
                            {advancedResult.rewardedImpressions.toLocaleString()}
                          </span>
                          <span className="w-24 text-right">
                            {moneyFmt(advancedResult.rewardedRevenue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Turn on Advanced Mode in the left panel to split impressions
                    by format and add IAP or subscription revenue.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ==================== SEO CONTENT SECTION ==================== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          {/* ===== Table of Contents ===== */}
          <nav className="mt-2 mb-10 bg-[#0f172a] border border-[#334155] rounded-xl p-5 text-slate-200">
            <h2 className="text-lg font-semibold text-cyan-300 mb-3">
              📖 Table of Contents
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <a
                  href="#overview"
                  className="text-indigo-400 hover:underline"
                >
                  Overview: What This App Revenue Calculator Does
                </a>
              </li>
              <li>
                <a
                  href="#how-to-use"
                  className="text-indigo-400 hover:underline"
                >
                  How to Use the App Revenue Calculator (Step-by-Step)
                </a>
              </li>
              <li>
                <a
                  href="#how-calculated"
                  className="text-indigo-400 hover:underline"
                >
                  Revenue Logic: DAU, Impressions, eCPM &amp; ARPDAU
                </a>
              </li>
              <li>
                <a
                  href="#advanced-mode"
                  className="text-indigo-400 hover:underline"
                >
                  Advanced Mode: Ad Formats + IAP &amp; Subscription Revenue
                </a>
              </li>
              <li>
                <a
                  href="#example"
                  className="text-indigo-400 hover:underline"
                >
                  Worked Example: AdMob Revenue &amp; ARPDAU Scenario
                </a>
              </li>
              <li>
                <a
                  href="#benefits"
                  className="text-indigo-400 hover:underline"
                >
                  Benefits for Developers, Studios &amp; Growth Teams
                </a>
              </li>
              <li>
                <a
                  href="#tips"
                  className="text-indigo-400 hover:underline"
                >
                  Optimization Tips: eCPM, Fill Rate &amp; Monetization Mix
                </a>
              </li>
              <li>
                <a
                  href="#pros-cons"
                  className="text-indigo-400 hover:underline"
                >
                  Pros &amp; Cons of Using an App Revenue Calculator
                </a>
              </li>
              <li>
                <a href="#faq" className="text-indigo-400 hover:underline">
                  FAQ – AdMob, App Ads &amp; ARPDAU
                </a>
              </li>
            </ol>
          </nav>

          <h1
            id="overview"
            className="text-3xl font-bold text-cyan-400 mb-6"
          >
            App Revenue Calculator – AdMob &amp; Mobile App Monetization
            Earnings Estimator
          </h1>

          <p>
            The <strong>App Revenue Calculator</strong> on CalculatorHub is a
            practical <strong>mobile app revenue calculator</strong> designed for
            developers, indie studios, and growth teams who need a realistic way
            to model how much money their apps can generate. Using a clean{" "}
            <strong>DAU-based model</strong>, this tool estimates earnings from{" "}
            <strong>AdMob</strong>, in-app ads,
            <strong> in-app purchases (IAP)</strong> and{" "}
            <strong>subscriptions</strong>.
          </p>

          <p>
            Instead of guessing in spreadsheets, this page behaves like a modern{" "}
            <strong>AdMob revenue calculator</strong>,{" "}
            <strong>app monetization calculator</strong>, and{" "}
            <strong>ARPDAU calculator</strong> in one place. By entering
            <strong> daily active users (DAU)</strong>,{" "}
            <strong> sessions per user</strong>,
            <strong> ad impressions per session</strong>,{" "}
            <strong> fill rate</strong> and
            <strong> blended eCPM</strong>, you get an instant forecast of
            <strong> monthly and yearly app revenue</strong>. Advanced Mode adds
            support for separate ad formats (banner, interstitial, rewarded) and
            non-ad revenue streams, making this a complete{" "}
            <strong>app revenue estimator</strong> for Android and iOS apps.
          </p>

          <figure className="my-8">
            <img
              src="/images/app_revenue_calculator.webp"
              alt="App Revenue Calculator interface showing DAU, eCPM, impressions and earnings"
              title="App Revenue Calculator | AdMob & Mobile App Monetization Estimator"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              DAU-based app revenue and ARPDAU estimation with AdMob-style eCPM
              modelling.
            </figcaption>
          </figure>

          <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📱 What Is an App Revenue Calculator?
          </h2>

          <p>
            An <strong>app revenue calculator</strong> is a forecasting tool
            that estimates how much money a mobile app can generate from
            advertising and other monetization channels. This includes{" "}
            <strong>AdMob revenue</strong>, other ad network earnings, in-app
            purchases, subscriptions, and hybrid models used by games, utility
            apps and productivity tools.
          </p>

          <p>This specific page works as:</p>

          <ul className="list-disc list-inside space-y-1">
            <li>
              A <strong>DAU-based AdMob revenue estimator</strong> for banner,
              interstitial and rewarded ads.
            </li>
            <li>
              A <strong>mobile app ads revenue calculator</strong> that converts
              impressions and eCPM into monthly and yearly income.
            </li>
            <li>
              An <strong>ARPDAU calculator</strong> (Average Revenue Per Daily
              Active User) to benchmark performance.
            </li>
            <li>
              A simple <strong>in-app purchase revenue calculator</strong> and
              subscription add-on through Advanced Mode.
            </li>
          </ul>

          <p>
            For founders, product managers and UA teams, this{" "}
            <strong>app monetization calculator</strong> is a quick way to test
            “what if?” scenarios – for example, how much extra revenue comes
            from increasing DAU, improving retention, adding rewarded ads or
            introducing subscriptions.
          </p>

          <h2
            id="how-to-use"
            className="text-2xl font-semibold text-cyan-300 mt-10 mb-4"
          >
            💡 How to Use the App Revenue Calculator (Step-by-Step)
          </h2>

          <p>
            The interface follows a clear pattern:{" "}
            <strong>inputs on the left</strong>,
            <strong> results on the right</strong>, with everything
            recalculated live. You don&apos;t need to be a data scientist to
            use this <strong>mobile app revenue calculator</strong> — just
            follow these steps:
          </p>

          <ol className="list-decimal list-inside space-y-2">
            <li>
              Enter your approximate{" "}
              <strong>Daily Active Users (DAU)</strong>.
            </li>
            <li>
              Add the average <strong>sessions per user per day</strong> (how
              often people open the app).
            </li>
            <li>
              Set the total <strong>ad impressions per session</strong> (banner
              + interstitial + rewarded).
            </li>
            <li>
              Adjust the <strong>fill rate</strong> – what percentage of ad
              requests actually serve an ad.
            </li>
            <li>
              Choose a <strong>low eCPM</strong> and <strong>high eCPM</strong>{" "}
              range to model best/worst cases.
            </li>
            <li>
              Optional: turn on <strong>Advanced Mode</strong> to break down ad
              formats and add IAP + subscription revenue.
            </li>
          </ol>

          <p>
            As soon as these values are entered, the tool behaves like a live{" "}
            <strong>AdMob revenue calculator</strong>: it projects
            <strong> monthly ad income</strong>,{" "}
            <strong> yearly ad revenue</strong>,
            <strong> monthly impressions</strong>, and{" "}
            <strong>ARPDAU</strong>. Because every input is editable, it&apos;s
            easy to compare different monetization strategies within seconds.
          </p>
          <AdBanner type="bottom" />

          <h2
            id="how-calculated"
            className="text-2xl font-semibold text-cyan-300 mt-10 mb-4"
          >
            🧮 Revenue Logic: DAU, Impressions, eCPM &amp; ARPDAU
          </h2>

          <p>
            Under the hood, this page uses simple but robust logic that many
            mobile studios apply in their internal spreadsheets. It acts as a
            clean <strong>app ads revenue estimator</strong> without exposing
            any proprietary network algorithms.
          </p>

          <p>The simplified calculation flow looks like this:</p>

          <pre className="bg-slate-800 text-slate-200 p-3 rounded-lg overflow-x-auto text-sm">
            <code>
              {`1) Total ad requests per day  = DAU × Sessions per user × Ads per session
2) Impressions per day         = Ad requests × (Fill rate % ÷ 100)
3) Impressions per month       = Impressions per day × 30
4) Monthly revenue (low)       = (Impressions per month ÷ 1000) × eCPM_low
5) Monthly revenue (high)      = (Impressions per month ÷ 1000) × eCPM_high
6) Yearly revenue (low/high)   = Monthly revenue × 12
7) ARPDAU (low/high)           = Monthly revenue ÷ (DAU × 30 days)`}
            </code>
          </pre>

          <p>
            Because the calculator uses an <strong>eCPM range</strong> instead
            of a single number, it returns{" "}
            <strong>minimum and maximum app revenue estimates</strong>. This
            better reflects how real <strong>AdMob eCPM</strong> and app ads
            eCPM can vary by country, device type, user quality, genre and
            seasonality.
          </p>

          <p>
            The ARPDAU metric makes this tool especially valuable. It converts
            your <strong> app monetization strategy</strong> into revenue per
            active user, allowing you to compare performance with other apps or
            industry benchmarks using a standard{" "}
            <strong> ARPDAU calculator</strong> style view.
          </p>

          <h2
            id="advanced-mode"
            className="text-2xl font-semibold text-cyan-300 mt-10 mb-4"
          >
            ⚙️ Advanced Mode: Ad Formats + IAP &amp; Subscription Revenue
          </h2>

          <p>
            In <strong>Normal Mode</strong>, the tool behaves as a blended{" "}
            <strong>AdMob revenue estimator</strong>, assuming one combined eCPM
            for all ad impressions. That is perfect for quick, high-level
            forecasts.
          </p>

          <p>
            When <strong>Advanced Mode</strong> is enabled, the calculator
            becomes a complete <strong> app monetization calculator</strong>:
          </p>

          <ul className="list-disc list-inside space-y-2">
            <li>
              You can specify the <strong>percentage share</strong> for
              <strong> banner ads, interstitial ads and rewarded ads</strong>.
            </li>
            <li>
              Each format can have its own <strong>eCPM value</strong>,
              reflecting real-world pricing.
            </li>
            <li>
              The calculator multiplies format-level impressions by
              format-level eCPM to show
              <strong> revenue per format</strong>.
            </li>
            <li>
              You can add monthly income from{" "}
              <strong>in-app purchases (IAP)</strong>,
              <strong> subscriptions</strong>, or any{" "}
              <strong>other monetization</strong> stream.
            </li>
          </ul>

          <p>
            The result is a blended <strong>total monthly revenue</strong> and
            <strong> total yearly revenue</strong> number, broken into two major
            buckets:
            <strong> ads only</strong> vs{" "}
            <strong> IAP + subscriptions + other</strong>. For many studios,
            this &quot;Advanced&quot; view is far closer to reality than a
            simple ad-only <strong> AdMob revenue calculator</strong>.
          </p>

          <h2
            id="example"
            className="text-2xl font-semibold text-cyan-300 mt-10 mb-4"
          >
            📊 Worked Example: AdMob-Style Revenue &amp; ARPDAU Scenario
          </h2>

          <p>
            Suppose a mobile game has <strong>10,000 DAU</strong>. On average,
            each user opens the app
            <strong> 2 times per day</strong>, and each session has about
            <strong> 3 ad impressions</strong>. The team assumes an{" "}
            <strong>80% fill rate</strong> and a blended{" "}
            <strong>eCPM range</strong> of <strong>$3.50–$9.00</strong>.
          </p>

          <ul className="list-disc list-inside space-y-1">
            <li>
              The calculator estimates total monthly impressions based on DAU,
              sessions, ads and fill rate.
            </li>
            <li>
              It applies the <strong>$3.50–$9.00 eCPM</strong> range to get a
              low and high
              <strong> monthly ad revenue</strong> band.
            </li>
            <li>
              It multiplies by 12 to display <strong>yearly ad revenue</strong>.
            </li>
            <li>
              It divides monthly revenue by <strong>DAU × 30 days</strong> to
              show
              <strong> ARPDAU (low and high)</strong>.
            </li>
          </ul>

          <p>
            If the studio also earns{" "}
            <strong>$2,000 per month</strong> from IAP and
            <strong>$1,000 per month</strong> from subscriptions, they can add
            those values in Advanced Mode. The tool then shows a total{" "}
            <strong>app revenue estimate</strong> – merging
            <strong> AdMob-style ad revenue</strong> with{" "}
            <strong>in-app purchase revenue</strong> and subscription income.
          </p>
          <AdBanner type="bottom" />

          <h2
            id="benefits"
            className="text-2xl font-semibold text-cyan-300 mt-10 mb-4"
          >
            ✅ Benefits of This App Revenue Calculator
          </h2>

          <p>
            This page is designed to be a practical, developer-friendly{" "}
            <strong> app revenue calculator</strong> with clear benefits:
          </p>

          <ul className="space-y-2">
            <li>
              ✔️ Works as an <strong>AdMob revenue estimator</strong> without
              any complicated setup.
            </li>
            <li>
              ✔️ Provides <strong>monthly and yearly revenue ranges</strong>{" "}
              instead of a single static number.
            </li>
            <li>
              ✔️ Acts as a fast <strong>ARPDAU calculator</strong> for
              benchmarking monetization performance.
            </li>
            <li>
              ✔️ Supports <strong>multi-format ad revenue</strong> plus{" "}
              <strong>IAP</strong> and
              <strong> subscription</strong> income.
            </li>
            <li>
              ✔️ Ideal for pitch decks, investor conversations and UA budget
              planning.
            </li>
          </ul>

          <p>
            Because all calculations are done in the browser, this{" "}
            <strong>app revenue estimator</strong> is also privacy-friendly. No
            login is required and no revenue data is stored – making it easy to
            test aggressive or conservative scenarios without exposing internal
            numbers.
          </p>

          <h2
            id="tips"
            className="text-2xl font-semibold text-cyan-300 mt-10 mb-4"
          >
            🧭 Monetization Tips: eCPM, Fill Rate &amp; Mix Optimization
          </h2>

          <p>
            Once you see your estimated earnings in this{" "}
            <strong>mobile app monetization calculator</strong>, you can
            experiment with small changes to understand what actually moves
            revenue. Some practical ideas include:
          </p>

          <ul className="list-disc list-inside space-y-2">
            <li>
              💡 <strong>Improve retention</strong> – more sessions per user
              directly increase ad requests and impressions.
            </li>
            <li>
              💡 <strong>Optimize ad placements</strong> – better placements can
              boost fill rate and eCPM without hurting UX.
            </li>
            <li>
              💡 <strong>Test rewarded ads</strong> – many apps see higher eCPM
              on rewarded placements than banners.
            </li>
            <li>
              💡 <strong>Localize the app</strong> – entering higher-value
              markets can lift average
              <strong> AdMob eCPM</strong>.
            </li>
            <li>
              💡 <strong>Add a hybrid model</strong> – combine ads with IAP and
              subscriptions, then plug those values into Advanced Mode.
            </li>
          </ul>

          <p>
            Combining these optimization strategies with the insights from this{" "}
            <strong> app revenue calculator</strong> gives teams a simple,
            data-driven way to plan growth, scale ad spend and set realistic
            targets.
          </p>

          <h2
            id="pros-cons"
            className="text-2xl font-semibold text-cyan-300 mt-10 mb-4"
          >
            ⚖️ Pros &amp; Cons of Using an App Monetization Calculator
          </h2>

          <p>
            Like any modelling tool, a{" "}
            <strong>mobile app revenue calculator</strong> has strengths and
            limitations. Understanding both helps set realistic expectations.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
              <h3 className="text-emerald-300 font-semibold mb-2">Pros</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  Fast estimates based on{" "}
                  <strong>DAU, sessions and eCPM</strong>.
                </li>
                <li>
                  Clear <strong>monthly, yearly and ARPDAU</strong> views for
                  planning.
                </li>
                <li>
                  Multi-format support in Advanced Mode mirrors real{" "}
                  <strong>AdMob setups</strong>.
                </li>
                <li>
                  Great for scenario testing, growth forecasts and investor
                  decks.
                </li>
              </ul>
            </div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
              <h3 className="text-rose-300 font-semibold mb-2">Cons</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  Real revenue depends on live auctions, policy, and user
                  behavior.
                </li>
                <li>
                  Results are only as accurate as the{" "}
                  <strong>eCPM and fill rate</strong> values entered.
                </li>
                <li>
                  It does not replace detailed cohort analysis or
                  MMP/analytics dashboards.
                </li>
              </ul>
            </div>
          </div>

          {/* ===================== FAQ SECTION ===================== */}
          <section className="space-y-6 mt-16">
            <h2
              id="faq"
              className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300"
            >
              ❓ Frequently Asked Questions (
              <span className="text-yellow-300">FAQ</span>)
            </h2>

            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q1: Is this an official AdMob revenue calculator?
                </h3>
                <p>
                  No. This is an independent{" "}
                  <strong>AdMob revenue estimator</strong> created for planning
                  and educational purposes. It uses standard eCPM-based math to
                  forecast revenue but does not connect to any ad network
                  account or guarantee actual payouts.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q2: What eCPM range should I use for my app?
                </h3>
                <p>
                  It depends on your genre, audience location and ad strategy.
                  Many teams start with a conservative lower bound and a more
                  optimistic upper bound (for example,
                  <strong> $2–$5</strong> for a utility app or{" "}
                  <strong>$3–$10</strong> for a game with rewarded ads). Over
                  time, you can refine the range based on real AdMob and
                  mediation reports.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q3: Can this app revenue calculator work for iOS and Android?
                </h3>
                <p>
                  Yes. The calculator is platform-agnostic. Whether you use
                  AdMob, AppLovin, Unity Ads, ironSource or another network, you
                  can plug in your own{" "}
                  <strong>DAU, eCPM and fill rate</strong> numbers to model
                  revenue for Android, iOS or cross-platform apps.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q4: Does this support purely IAP or subscription apps?
                </h3>
                <p>
                  Yes. In Advanced Mode, you can set ad revenue to zero and only
                  fill in
                  <strong> IAP</strong>, <strong>subscription</strong> and{" "}
                  <strong>other monetization</strong>
                  fields. The page will then behave like an{" "}
                  <strong>in-app purchase revenue calculator</strong> or
                  subscription revenue estimator for your mobile app.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q5: What is ARPDAU and why is it important?
                </h3>
                <p>
                  <strong>ARPDAU</strong> stands for Average Revenue Per Daily
                  Active User. It shows how much income your app generates for
                  each active user in a day. This
                  <strong> app revenue calculator</strong> displays ARPDAU as
                  part of the result, making it easier to compare different
                  apps, markets and monetization strategies using a single,
                  standard performance metric.
                </p>
              </div>
            </div>
          </section>
        </section>

        {/* =================== AUTHOR & BACKLINK SECTION =================== */}
        <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
          <div className="flex items-center gap-3">
            <img
              src="/images/calculatorhub-author.webp"
              alt="CalculatorHub App Monetization Tools Team"
              className="w-12 h-12 rounded-full border border-gray-600"
              loading="lazy"
            />
            <div>
              <p className="font-semibold text-white">
                Written by the CalculatorHub App Monetization Tools Team
              </p>
              <p className="text-sm text-slate-400">
                Specialists in AdMob, app monetization strategy and revenue
                analytics. Last updated:{" "}
                <time dateTime="2025-11-15">November 15, 2025</time>.
              </p>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              🚀 Explore more creator &amp; revenue calculators on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/facebook-instream-revenue-estimator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-blue-600/20 text-blue-300 hover:text-blue-400 px-3 py-2 rounded-md border border-slate-700 hover:border-blue-500 transition-all duration-200"
              >
                <span className="text-blue-400">📺</span> Facebook Revenue
                Calculator
              </Link>

              <Link
                to="/youtube-revenue-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-red-600/20 text-red-300 hover:text-red-400 px-3 py-2 rounded-md border border-slate-700 hover:border-red-500 transition-all duration-200"
              >
                <span className="text-red-400">▶️</span> YouTube Revenue
                Calculator
              </Link>

              <Link
                to="/adsense-revenue-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
              >
                <span className="text-emerald-400">💻</span> Website &amp;
                AdSense Revenue Calculator
              </Link>
            </div>
          </div>
        </section>

        <Suspense fallback={null}>
          <AdBanner type="bottom" />
          <RelatedCalculators
            currentPath="/app-revenue-calculator"
            category="ads-creator-tools"
          />
        </Suspense>
      </div>
    </>
  );
};

export default AppRevenueCalculator;
