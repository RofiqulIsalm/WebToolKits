// src/pages/WebsiteRevenueCalculator.tsx
import React, { useEffect, useMemo, useState, Suspense } from "react";
import { Link } from "react-router-dom";
import {
  LayoutTemplate,
  Settings2,
  Info,
  DollarSign,
  Copy,
  Check,
  RefreshCw,
  BarChart3,
  Globe2,
} from "lucide-react";

import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";


const AdBanner = React.lazy(() => import("../components/AdBanner"));
const RelatedCalculators = React.lazy(
  () => import("../components/RelatedCalculators")
);

/* =============== Utils =============== */

const clamp0 = (n: number) => (isNaN(n) || n < 0 ? 0 : n);

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

function blockBadKeys(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+")
    e.preventDefault();
}

const ADVANCED_LS_KEY = "website-revenue-advanced-mode";

/* =============== Types =============== */

type NetworkKey = "adsense" | "adsterra" | "monetag";

/* =============== Component =============== */

const WebsiteRevenueCalculator: React.FC = () => {
  // -------- Basic inputs --------
  const [monthlySessions, setMonthlySessions] = useState<number>(100_000);
  const [pagesPerSession, setPagesPerSession] = useState<number>(2.5);
  const [adsPerPage, setAdsPerPage] = useState<number>(3);
  const [viewabilityPercent, setViewabilityPercent] = useState<number>(65);
  const [fillRatePercent, setFillRatePercent] = useState<number>(85);
  const [primaryNetwork, setPrimaryNetwork] = useState<NetworkKey>("adsense");
  const [baseEcpm, setBaseEcpm] = useState<number>(2.5); // USD per 1000 viewable impressions

  // -------- Advanced --------
  const [advancedEnabled, setAdvancedEnabled] = useState<boolean>(false);
  const [advLoading, setAdvLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<"basic" | "advanced" | null>(null);

  // Network mix
  const [networkShare, setNetworkShare] = useState<{
    adsense: number;
    adsterra: number;
    monetag: number;
  }>({
    adsense: 60,
    adsterra: 20,
    monetag: 20,
  });

  const [networkEcpm, setNetworkEcpm] = useState<{
    adsense: number;
    adsterra: number;
    monetag: number;
  }>({
    adsense: 2.5,
    adsterra: 2.1,
    monetag: 2.8,
  });

  const [directDealsMonthly, setDirectDealsMonthly] = useState<number>(0);
  const [affiliateMonthly, setAffiliateMonthly] = useState<number>(0);

  // Device split
  const [desktopShare, setDesktopShare] = useState<number>(25);
  const [mobileShare, setMobileShare] = useState<number>(65);
  const [tabletShare, setTabletShare] = useState<number>(10);
  const [mobileBoostFactor, setMobileBoostFactor] = useState<number>(0.9); // eCPM multiplier

  // -------- Effects --------
  useEffect(() => {
    // Guard for any future SSR usage
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(ADVANCED_LS_KEY);
    if (saved === "1") setAdvancedEnabled(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ADVANCED_LS_KEY, advancedEnabled ? "1" : "0");
  }, [advancedEnabled]);

  useEffect(() => {
    // Sync base ECPM with primary network (but let user override)
    if (primaryNetwork === "adsense") {
      setBaseEcpm((prev) => (prev === 2.1 || prev === 2.8 ? 2.5 : prev));
    } else if (primaryNetwork === "adsterra") {
      setBaseEcpm((prev) => (prev === 2.5 || prev === 2.8 ? 2.1 : prev));
    } else if (primaryNetwork === "monetag") {
      setBaseEcpm((prev) => (prev === 2.5 || prev === 2.1 ? 2.8 : prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryNetwork]);

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

  const handleNetworkShareChange = (key: NetworkKey, value: number) => {
    setNetworkShare((prev) => ({
      ...prev,
      [key]: clamp0(value),
    }));
  };

  const handleNetworkEcpmChange = (key: NetworkKey, value: number) => {
    setNetworkEcpm((prev) => ({
      ...prev,
      [key]: clamp0(value),
    }));
  };

  const handleReset = () => {
    setMonthlySessions(100_000);
    setPagesPerSession(2.5);
    setAdsPerPage(3);
    setViewabilityPercent(65);
    setFillRatePercent(85);
    setPrimaryNetwork("adsense");
    setBaseEcpm(2.5);

    setNetworkShare({
      adsense: 60,
      adsterra: 20,
      monetag: 20,
    });
    setNetworkEcpm({
      adsense: 2.5,
      adsterra: 2.1,
      monetag: 2.8,
    });

    setDirectDealsMonthly(0);
    setAffiliateMonthly(0);
    setDesktopShare(25);
    setMobileShare(65);
    setTabletShare(10);
    setMobileBoostFactor(0.9);
  };

  // -------- Basic result (single blended network) --------
  const basicResult = useMemo(() => {
    if (!monthlySessions || monthlySessions <= 0) return null;

    const totalPageviews = monthlySessions * pagesPerSession;
    const rawImpressions = totalPageviews * adsPerPage;

    const viewableImpressions =
      (rawImpressions * viewabilityPercent) / 100;
    const filledImpressions =
      (viewableImpressions * fillRatePercent) / 100;

    const monthlyRevenue = (filledImpressions / 1000) * baseEcpm;
    const yearlyRevenue = monthlyRevenue * 12;

    const epmv = monthlySessions
      ? (monthlyRevenue / monthlySessions) * 1000
      : 0; // earnings per 1000 sessions

    const erpmPageviews = totalPageviews
      ? (monthlyRevenue / totalPageviews) * 1000
      : 0; // per 1000 pageviews

    return {
      totalPageviews,
      rawImpressions,
      viewableImpressions,
      filledImpressions,
      monthlyRevenue,
      yearlyRevenue,
      epmv,
      erpmPageviews,
    };
  }, [
    monthlySessions,
    pagesPerSession,
    adsPerPage,
    viewabilityPercent,
    fillRatePercent,
    baseEcpm,
  ]);

  // -------- Advanced result (network mix + device split + extras) --------
  const advancedResult = useMemo(() => {
    if (!advancedEnabled || !basicResult) return null;

    const impressions = basicResult.filledImpressions || 0;

    // Network mix revenue
    const netRev: Record<NetworkKey, number> = {
      adsense:
        ((impressions * (networkShare.adsense / 100)) / 1000) *
        networkEcpm.adsense,
      adsterra:
        ((impressions * (networkShare.adsterra / 100)) / 1000) *
        networkEcpm.adsterra,
      monetag:
        ((impressions * (networkShare.monetag / 100)) / 1000) *
        networkEcpm.monetag,
    };

    const totalAdsRevenue =
      (netRev.adsense || 0) +
      (netRev.adsterra || 0) +
      (netRev.monetag || 0);

    // Device-quality adjustment (soft guidance, not strict math)
    const totalDeviceShare =
      desktopShare + mobileShare + tabletShare || 1;
    const desktopWeight = desktopShare / totalDeviceShare;
    const mobileWeight = mobileShare / totalDeviceShare;
    const tabletWeight = tabletShare / totalDeviceShare;

    const deviceFactor =
      desktopWeight * 1.0 +
      mobileWeight * mobileBoostFactor +
      tabletWeight * 0.95;

    const qualityAdjustedAdsRevenue = totalAdsRevenue * deviceFactor;

    const extras =
      (directDealsMonthly || 0) + (affiliateMonthly || 0);

    const totalMonthly = qualityAdjustedAdsRevenue + extras;
    const totalYearly = totalMonthly * 12;

    const blendedEcpm =
      impressions > 0 ? (totalMonthly * 1000) / impressions : 0;

    const topNetwork = (Object.entries(netRev) as [
      NetworkKey,
      number
    ]).reduce(
      (best, current) =>
        current[1] > best[1] ? current : best,
      ["adsense", 0] as [NetworkKey, number]
    );

    return {
      netRev,
      totalAdsRevenue,
      qualityAdjustedAdsRevenue,
      extras,
      totalMonthly,
      totalYearly,
      blendedEcpm,
      topNetworkKey: topNetwork[0],
      topNetworkRevenue: topNetwork[1],
      impressions,
      deviceFactor,
    };
  }, [
    advancedEnabled,
    basicResult,
    networkShare,
    networkEcpm,
    desktopShare,
    mobileShare,
    tabletShare,
    mobileBoostFactor,
    directDealsMonthly,
    affiliateMonthly,
  ]);

  const handleCopy = async (type: "basic" | "advanced") => {
    try {
      let text = "";

      if (type === "basic" && basicResult) {
        text += `Website Ad Revenue (Blended ${primaryNetwork.toUpperCase()} model)\n`;
        text += `Monthly: ${moneyFmt(
          basicResult.monthlyRevenue
        )}\n`;
        text += `Yearly: ${moneyFmt(
          basicResult.yearlyRevenue
        )}\n`;
        text += `EPMV (per 1000 sessions): ${moneyFmt(
          basicResult.epmv,
          false
        )}\n`;
      }

      if (type === "advanced" && advancedResult) {
        text += `Website Revenue (Advanced – network mix + extras)\n`;
        text += `Monthly: ${moneyFmt(
          advancedResult.totalMonthly
        )}\nYearly: ${moneyFmt(
          advancedResult.totalYearly
        )}\n`;
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
        title="Website Revenue Calculator (2025–2026) – AdSense, adsterra & Monetag RPM Estimator"
        description="Estimate your website earnings from AdSense, adsterra, Monetag or a blend of ad networks. Model sessions, pageviews, ad layout, viewability, fill rate, network mix and extras in Normal or Advanced Mode."
        keywords={[
          "website revenue calculator",
          "adsense revenue estimator",
          "adsense rpm calculator",
          "adsterra monetag rpm calculator",
          "website ads income calculator",
          "epmv calculator",
          "page rpm calculator",
          "display ads revenue calculator",
          "blog adsense earnings estimator",
          "website monetization calculator",
        ]}
        canonical="https://calculatorhub.site/adsense-revenue-calculator"
        schemaData={[
          /* 1) WebPage + embedded Article */
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id":
              "https://calculatorhub.site/adsense-revenue-calculator#webpage",
            url: "https://calculatorhub.site/adsense-revenue-calculator",
            name: "Website Revenue Calculator – AdSense, adsterra & Monetag RPM Estimator",
            headline:
              "Website Revenue Calculator – AdSense, adsterra & Monetag RPM Estimator",
            description:
              "Premium website revenue calculator for AdSense, adsterra and Monetag. Estimate revenue using sessions, pageviews, ad layout, viewability, fill rate, network mix and extra income streams.",
            inLanguage: "en",
            isPartOf: { "@id": "https://calculatorhub.site/#website" },
            primaryImageOfPage: {
              "@type": "ImageObject",
              "@id":
                "https://calculatorhub.site/images/website_revenue_calculator.webp#primaryimg",
              url:
                "https://calculatorhub.site/images/website_revenue_calculator.webp",
              width: 1200,
              height: 675,
            },
            mainEntity: {
              "@type": "Article",
              "@id":
                "https://calculatorhub.site/adsense-revenue-calculator#article",
              headline:
                "Website Revenue Calculator — Model AdSense, adsterra & Monetag Income",
              description:
                "Interactive website revenue calculator that converts traffic and layout data into estimated monthly and yearly earnings, including RPM, EPMV and network-mix breakdowns.",
              image: [
                "https://calculatorhub.site/images/website_revenue_calculator.webp",
              ],
              author: {
                "@type": "Organization",
                name: "CalculatorHub",
                url: "https://calculatorhub.site",
              },
              publisher: {
                "@id": "https://calculatorhub.site/#organization",
              },
              datePublished: "2025-11-15",
              dateModified: "2025-11-15",
              mainEntityOfPage: {
                "@id":
                  "https://calculatorhub.site/adsense-revenue-calculator#webpage",
              },
              articleSection: [
                "How the calculator works",
                "Sessions, pageviews & impressions",
                "RPM, EPMV and eCPM",
                "Advanced Mode and network mix",
                "Device split & extra revenue",
                "FAQ",
              ],
            },
          },

          /* 2) Breadcrumbs */
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "@id":
              "https://calculatorhub.site/adsense-revenue-calculator#breadcrumbs",
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
                item:
                  "https://calculatorhub.site/category/misc-tools",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: "Website Revenue Calculator",
                item:
                  "https://calculatorhub.site/adsense-revenue-calculator",
              },
            ],
          },

          /* 3) FAQ */
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id":
              "https://calculatorhub.site/adsense-revenue-calculator#faq",
            mainEntity: [
              {
                "@type": "Question",
                name: "What does this website revenue calculator estimate?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text:
                    "The calculator estimates your monthly and yearly website earnings based on sessions, pageviews, ad units per page, viewability, fill rate and an RPM or eCPM value. In Advanced Mode, it also models a network mix (AdSense, adsterra, Monetag), device split and extra income such as direct deals and affiliate revenue.",
                },
              },
              {
                "@type": "Question",
                name: "What is the difference between RPM and EPMV?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text:
                    "RPM usually refers to revenue per 1,000 pageviews, while EPMV (earnings per thousand visitors) measures revenue per 1,000 sessions. The calculator shows both metrics so you can evaluate layout changes and network performance more accurately.",
                },
              },
              {
                "@type": "Question",
                name:
                  "Can I use this calculator for adsterra and Monetag as well as AdSense?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text:
                    "Yes. In Advanced Mode you can split traffic between AdSense, adsterra and Monetag, assign a separate eCPM to each network and see how much revenue each contributes to your total monthly earnings.",
                },
              },
              {
                "@type": "Question",
                name:
                  "Does device mix (mobile vs desktop) affect the estimate?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text:
                    "Yes. Different devices often have different eCPMs. The calculator lets you define desktop, mobile and tablet shares plus a mobile eCPM factor, which adjusts the final estimate to better reflect your real-world performance.",
                },
              },
              {
                "@type": "Question",
                name: "Is the Website Revenue Calculator free to use?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text:
                    "Yes. The Website Revenue Calculator on CalculatorHub is completely free, works in any modern browser and can be used as often as you like for planning and optimization.",
                },
              },
            ],
          },

          /* 4) WebApplication */
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id":
              "https://calculatorhub.site/adsense-revenue-calculator#webapp",
            name: "Website Revenue Calculator",
            url: "https://calculatorhub.site/adsense-revenue-calculator",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            description:
              "Interactive website revenue calculator that models AdSense, adsterra and Monetag RPM with traffic inputs, layout controls, network mix and device split.",
            publisher: { "@id": "https://calculatorhub.site/#organization" },
            image: [
              "https://calculatorhub.site/images/website_revenue_calculator.webp",
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
            "@id":
              "https://calculatorhub.site/adsense-revenue-calculator#software",
            name: "Website RPM & EPMV Estimator",
            applicationCategory: "BusinessApplication",
            operatingSystem: "All",
            url: "https://calculatorhub.site/adsense-revenue-calculator",
            publisher: { "@id": "https://calculatorhub.site/#organization" },
            description:
              "Advanced website RPM, EPMV and eCPM estimator for publishers using AdSense, adsterra, Monetag and other ad networks.",
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
          {
            name: "Website Revenue Calculator",
            url: "/adsense-revenue-calculator",
          },
        ]}
      />

      {/* ===== Outside meta/link tags for Website Revenue page ===== */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta
        name="robots"
        content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
      />
      <link
        rel="canonical"
        href="https://calculatorhub.site/adsense-revenue-calculator"
      />

      {/* Hreflang */}
      <link
        rel="alternate"
        href="https://calculatorhub.site/adsense-revenue-calculator"
        hreflang="en"
      />
      <link
        rel="alternate"
        href="https://calculatorhub.site/bn/adsense-revenue-calculator"
        hreflang="bn"
      />
      <link
        rel="alternate"
        href="https://calculatorhub.site/adsense-revenue-calculator"
        hreflang="x-default"
      />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta
        property="og:title"
        content="Website Revenue Calculator (2025–2026) — AdSense, adsterra & Monetag RPM Estimator"
      />
      <meta
        property="og:description"
        content="Estimate website revenue from AdSense, adsterra and Monetag using traffic, layout, viewability, fill rate and network mix. Includes Advanced Mode with device split and extra income."
      />
      <meta
        property="og:url"
        content="https://calculatorhub.site/adsense-revenue-calculator"
      />
      <meta
        property="og:image"
        content="https://calculatorhub.site/images/website_revenue_calculator.webp"
      />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta
        property="og:image:alt"
        content="Website revenue calculator UI showing sessions, RPM and ad network mix cards"
      />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:title"
        content="Website Revenue Calculator — AdSense, adsterra & Monetag RPM Estimator"
      />
      <meta
        name="twitter:description"
        content="Free website RPM & EPMV calculator with network mix, device split and extra income inputs for AdSense, adsterra and Monetag publishers."
      />
      <meta
        name="twitter:image"
        content="https://calculatorhub.site/images/website_revenue_calculator.webp"
      />
      <meta name="twitter:creator" content="@CalculatorHub" />
      <meta name="twitter:site" content="@CalculatorHub" />

      {/* PWA & theme */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="theme-color" content="#0ea5e9" />

      {/* Performance */}
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin=""
      />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://cdn.jsdelivr.net"
        crossOrigin=""
      />
      <link
        rel="preload"
        as="image"
        href="/images/website_revenue_calculator.webp"
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

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <Breadcrumbs
          items={[
            { name: "Misc Tools", url: "/category/misc-tools" },
            {
              name: "Website Revenue Calculator",
              url: "/adsense-revenue-calculator",
            },
          ]}
        />

        {/* Header */}
        <div className="mb-8 text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200 mb-3">
            <LayoutTemplate className="w-4 h-4" />
            Website • AdSense · adsterra · Monetag
          </div>
          <h1 className="text-white text-2xl sm:text-3xl font-bold mb-2">
            Website Revenue Calculator
          </h1>
          <p className="text-slate-200 text-sm sm:text-base">
            Model your website revenue from sessions, pageviews, ad layout,
            viewability, fill rate and network mix. Designed for AdSense,
            adsterra, Monetag or any display network stack.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ============ Inputs ============ */}
          <div className="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-5 sm:p-6 shadow-xl shadow-slate-950/40">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-100">
                    Traffic & Layout
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Start with sessions, pageviews, ad density and a single
                    blended network.
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggleAdvanced}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] sm:text-xs font-medium transition-all ${
                  advancedEnabled
                    ? "bg-emerald-600/90 border-emerald-400 text-white shadow-md shadow-emerald-900/40"
                    : "bg-slate-900/80 border-slate-600 text-slate-100 hover:bg-slate-800"
                }`}
              >
                <Settings2 className="w-4 h-4" />
                {advancedEnabled ? "Advanced: ON" : "Advanced Mode"}
              </button>
            </div>

            <div className="space-y-4">
              {/* Monthly sessions */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                  Monthly sessions
                </label>
                <input
                  type="number"
                  min={0}
                  inputMode="decimal"
                  onKeyDown={blockBadKeys}
                  value={monthlySessions}
                  onChange={(e) =>
                    setMonthlySessions(clamp0(Number(e.target.value)))
                  }
                  className="w-full px-3 sm:px-4 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/80"
                  placeholder="e.g. 100,000"
                />
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                  Unique visits (sessions) per month. Use analytics data
                  (GA4/Matomo).
                </p>
              </div>

              {/* Pages per session */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                  Average pages per session
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  inputMode="decimal"
                  onKeyDown={blockBadKeys}
                  value={pagesPerSession}
                  onChange={(e) =>
                    setPagesPerSession(clamp0(Number(e.target.value)))
                  }
                  className="w-full px-3 sm:px-4 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/80"
                  placeholder="e.g. 2.5"
                />
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                  How many pages the average user visits in one session.
                </p>
              </div>

              {/* Ads per page */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                  Avg. ad units per page
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  inputMode="decimal"
                  onKeyDown={blockBadKeys}
                  value={adsPerPage}
                  onChange={(e) =>
                    setAdsPerPage(clamp0(Number(e.target.value)))
                  }
                  className="w-full px-3 sm:px-4 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/80"
                  placeholder="e.g. 3"
                />
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                  Count only display units that can actually load (in content,
                  sidebar, etc.).
                </p>
              </div>

              {/* Viewability & fill */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                    Viewability %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="1"
                    inputMode="decimal"
                    onKeyDown={blockBadKeys}
                    value={viewabilityPercent}
                    onChange={(e) =>
                      setViewabilityPercent(clamp0(Number(e.target.value)))
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/80"
                  />
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                    Share of ad impressions that are actually viewable.
                  </p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                    Fill rate %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="1"
                    inputMode="decimal"
                    onKeyDown={blockBadKeys}
                    value={fillRatePercent}
                    onChange={(e) =>
                      setFillRatePercent(clamp0(Number(e.target.value)))
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/80"
                  />
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                    How often an ad actually fills the slot (no backfill = lower
                    rate).
                  </p>
                </div>
              </div>

              {/* Primary network & base eCPM */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Globe2 className="w-3.5 h-3.5 text-slate-300" />
                  Primary network & base eCPM
                </label>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <div className="flex-1">
                    <div className="flex gap-1 rounded-lg bg-slate-900 border border-slate-700 p-1">
                      {(["adsense", "adsterra", "monetag"] as NetworkKey[]).map(
                        (net) => (
                          <button
                            key={net}
                            type="button"
                            onClick={() => setPrimaryNetwork(net)}
                            className={`flex-1 text-[11px] sm:text-xs px-2 py-1 rounded-md capitalize transition ${
                              primaryNetwork === net
                                ? "bg-emerald-600 text-white"
                                : "bg-transparent text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            {net === "adsense"
                              ? "AdSense"
                              : net === "adsterra"
                              ? "adsterra"
                              : "Monetag"}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  <div className="sm:w-32">
                    <span className="block text-[11px] text-slate-400 mb-0.5">
                      Base eCPM (USD)
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      inputMode="decimal"
                      onKeyDown={blockBadKeys}
                      value={baseEcpm}
                      onChange={(e) =>
                        setBaseEcpm(clamp0(Number(e.target.value)))
                      }
                      className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/80"
                      placeholder="e.g. 2.5"
                    />
                  </div>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                  Use your blended eCPM from reports, or start with a typical
                  estimate and refine over time.
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
                  advancedEnabled ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="mt-4 border-t border-slate-700 pt-4 space-y-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-emerald-300" />
                    Advanced Mode – Network mix, devices & extras
                  </h3>

                  {/* Network mix */}
                  <div className="space-y-2">
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      Split traffic between AdSense, adsterra and Monetag with
                      custom eCPM values. We’ll estimate how each network
                      contributes to total revenue.
                    </p>

                    <div className="space-y-2 text-[11px] sm:text-xs">
                      {(["adsense", "adsterra", "monetag"] as NetworkKey[]).map(
                        (net) => (
                          <div
                            key={net}
                            className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 items-center"
                          >
                            <span className="font-medium text-slate-200 capitalize">
                              {net === "adsense"
                                ? "AdSense"
                                : net === "adsterra"
                                ? "adsterra"
                                : "Monetag"}
                            </span>
                            <div>
                              <span className="block text-slate-400 mb-0.5">
                                Traffic %
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step="1"
                                inputMode="decimal"
                                onKeyDown={blockBadKeys}
                                value={networkShare[net]}
                                onChange={(e) =>
                                  handleNetworkShareChange(
                                    net,
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-emerald-500/80"
                              />
                            </div>
                            <div>
                              <span className="block text-slate-400 mb-0.5">
                                eCPM (USD)
                              </span>
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                inputMode="decimal"
                                onKeyDown={blockBadKeys}
                                value={networkEcpm[net]}
                                onChange={(e) =>
                                  handleNetworkEcpmChange(
                                    net,
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-emerald-500/80"
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Device split */}
                  <div className="space-y-2">
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      Refine by device. This doesn&apos;t change impression
                      counts, but adjusts revenue with a simple quality factor.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] sm:text-xs">
                      <div>
                        <span className="block text-slate-300 mb-1">
                          Desktop %
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="1"
                          inputMode="decimal"
                          onKeyDown={blockBadKeys}
                          value={desktopShare}
                          onChange={(e) =>
                            setDesktopShare(clamp0(Number(e.target.value)))
                          }
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-emerald-500/80"
                        />
                      </div>
                      <div>
                        <span className="block text-slate-300 mb-1">
                          Mobile %
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="1"
                          inputMode="decimal"
                          onKeyDown={blockBadKeys}
                          value={mobileShare}
                          onChange={(e) =>
                            setMobileShare(clamp0(Number(e.target.value)))
                          }
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-emerald-500/80"
                        />
                      </div>
                      <div>
                        <span className="block text-slate-300 mb-1">
                          Tablet %
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="1"
                          inputMode="decimal"
                          onKeyDown={blockBadKeys}
                          value={tabletShare}
                          onChange={(e) =>
                            setTabletShare(clamp0(Number(e.target.value)))
                          }
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-emerald-500/80"
                        />
                      </div>
                    </div>

                    <div className="mt-2">
                      <span className="block text-[11px] text-slate-300 mb-1">
                        Mobile eCPM factor
                      </span>
                      <input
                        type="number"
                        min={0.5}
                        max={1.5}
                        step="0.05"
                        inputMode="decimal"
                        onKeyDown={blockBadKeys}
                        value={mobileBoostFactor}
                        onChange={(e) =>
                          setMobileBoostFactor(
                            clamp0(Number(e.target.value))
                          )
                        }
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:ring-1 focus:ring-emerald-500/80"
                      />
                      <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                        &lt; 1.0 if mobile pays less than desktop, &gt; 1.0 if
                        it performs better (e.g. sticky mobile ads).
                      </p>
                    </div>
                  </div>

                  {/* Extras */}
                  <div className="space-y-2">
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      Add direct campaigns, native ads and affiliate income.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] sm:text-xs">
                      <div>
                        <span className="block text-slate-300 mb-1">
                          Direct / native deals ($/month)
                        </span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          inputMode="decimal"
                          onKeyDown={blockBadKeys}
                          value={directDealsMonthly}
                          onChange={(e) =>
                            setDirectDealsMonthly(
                              clamp0(Number(e.target.value))
                            )
                          }
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-emerald-500/80"
                        />
                      </div>
                      <div>
                        <span className="block text-slate-300 mb-1">
                          Affiliate / commerce ($/month)
                        </span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          inputMode="decimal"
                          onKeyDown={blockBadKeys}
                          value={affiliateMonthly}
                          onChange={(e) =>
                            setAffiliateMonthly(
                              clamp0(Number(e.target.value))
                            )
                          }
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-emerald-500/80"
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
                    <LayoutTemplate className="h-8 w-8 text-emerald-300 mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-emerald-50">
                      {basicResult
                        ? moneyFmt(basicResult.monthlyRevenue)
                        : "$0"}
                    </div>
                    <div className="text-xs sm:text-sm text-emerald-100/80">
                      Estimated monthly revenue (blended{" "}
                      {primaryNetwork === "adsense"
                        ? "AdSense"
                        : primaryNetwork === "adsterra"
                        ? "adsterra"
                        : "Monetag"}
                      )
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 text-center">
                      <div className="text-slate-400 mb-1">Yearly (approx.)</div>
                      <div className="font-semibold text-slate-100">
                        {basicResult
                          ? moneyFmt(basicResult.yearlyRevenue)
                          : "$0"}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 text-center">
                      <div className="text-slate-400 mb-1">
                        Total pageviews / month
                      </div>
                      <div className="font-semibold text-slate-100">
                        {basicResult
                          ? basicResult.totalPageviews.toLocaleString()
                          : 0}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-700 text-center">
                      <div className="text-slate-400 mb-1">
                        EPMV (per 1,000 sessions)
                      </div>
                      <div className="font-semibold text-slate-100">
                        {basicResult
                          ? moneyFmt(basicResult.epmv, false)
                          : "0"}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-700 text-center">
                      <div className="text-slate-400 mb-1">
                        eRPM (per 1,000 pageviews)
                      </div>
                      <div className="font-semibold text-slate-100">
                        {basicResult
                          ? moneyFmt(basicResult.erpmPageviews, false)
                          : "0"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px] sm:text-xs">
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-700 text-center">
                      <div className="text-slate-400 mb-0.5">
                        Raw impressions
                      </div>
                      <div className="font-semibold text-slate-100">
                        {basicResult
                          ? basicResult.rawImpressions.toLocaleString()
                          : 0}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-700 text-center">
                      <div className="text-slate-400 mb-0.5">
                        Viewable
                      </div>
                      <div className="font-semibold text-slate-100">
                        {basicResult
                          ? basicResult.viewableImpressions.toLocaleString()
                          : 0}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-700 text-center">
                      <div className="text-slate-400 mb-0.5">Filled</div>
                      <div className="font-semibold text-slate-100">
                        {basicResult
                          ? basicResult.filledImpressions.toLocaleString()
                          : 0}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] sm:text-xs text-slate-500 flex items-start gap-1">
                    <Info className="w-3.5 h-3.5 mt-0.5 text-slate-400" />
                    This is a planning estimate. Real RPM depends on niche,
                    GEO, device mix, ad formats, auction competition and
                    optimization (header bidding, lazy load, CLS control, etc.).
                  </p>
                </div>
              </div>

              {/* Advanced block */}
              <div className="mt-4 border-t border-slate-700 pt-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h2 className="text-sm sm:text-base font-semibold text-slate-100 flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-emerald-300" />
                    Advanced Result (network mix + extras)
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
                        <p className="text-slate-400 mb-1">
                          Ads only (network mix)
                        </p>
                        <p className="text-slate-100">
                          {moneyFmt(advancedResult.qualityAdjustedAdsRevenue)}{" "}
                          / month
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-700">
                        <p className="text-slate-400 mb-1">
                          Direct + affiliate
                        </p>
                        <p className="text-slate-100">
                          {moneyFmt(advancedResult.extras)} / month
                        </p>
                      </div>
                    </div>

                    {/* Network breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {(["adsense", "adsterra", "monetag"] as NetworkKey[]).map(
                        (net) => (
                          <div
                            key={net}
                            className="p-3 rounded-lg bg-slate-950 border border-slate-700"
                          >
                            <p className="text-slate-300 font-medium capitalize mb-1">
                              {net === "adsense"
                                ? "AdSense"
                                : net === "adsterra"
                                ? "adsterra"
                                : "Monetag"}
                            </p>
                            <p className="text-slate-400">
                              Share: {networkShare[net]}%
                            </p>
                            <p className="text-slate-400">
                              eCPM: ${networkEcpm[net].toFixed(2)}
                            </p>
                          </div>
                        )
                      )}
                    </div>

                    <div className="mt-1 rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="text-slate-300 font-medium">
                          Blended eCPM & top network
                        </p>
                        <p className="text-slate-400">
                          Effective eCPM across{" "}
                          {advancedResult.impressions.toLocaleString()} filled
                          impressions.
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-xs text-slate-400">
                          Blended eCPM (all ads)
                        </p>
                        <p className="font-semibold text-emerald-200 text-sm">
                          ${advancedResult.blendedEcpm.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-400">
                          Top network by revenue
                        </p>
                        <p className="font-semibold text-slate-100 text-sm">
                          {advancedResult.topNetworkKey === "adsense"
                            ? "AdSense"
                            : advancedResult.topNetworkKey === "adsterra"
                            ? "adsterra"
                            : "Monetag"}{" "}
                          (
                          {moneyFmt(
                            advancedResult.topNetworkRevenue
                          )}
                          /mo)
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Turn on Advanced Mode to simulate a multi-network stack
                    (AdSense + adsterra + Monetag), adjust device mix and add
                    direct/affiliate income for a complete revenue picture.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ==================== SEO CONTENT SECTION ==================== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-12 mb-12 leading-relaxed text-slate-300">
        
          {/* ===== Table of Contents ===== */}
          <nav className="mt-2 mb-10 bg-[#020617] border border-[#334155] rounded-2xl p-5 text-slate-200">
            <h2 className="text-lg font-semibold text-emerald-300 mb-3">
              📖 Table of Contents
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <a href="#website-revenue-overview" className="text-emerald-300 hover:underline">
                  Overview: What the Website Revenue Calculator Actually Does
                </a>
              </li>
              <li>
                <a href="#website-revenue-how-to-use" className="text-emerald-300 hover:underline">
                  How to Use the Website Revenue Calculator (Step-by-Step)
                </a>
              </li>
              <li>
                <a href="#website-revenue-inputs" className="text-emerald-300 hover:underline">
                  Inputs Explained: Sessions, Pageviews, Impressions &amp; eCPM
                </a>
              </li>
              <li>
                <a href="#website-revenue-rpm-epmv" className="text-emerald-300 hover:underline">
                  RPM vs EPMV vs eCPM – What’s the Difference?
                </a>
              </li>
              <li>
                <a href="#website-revenue-advanced-mode" className="text-emerald-300 hover:underline">
                  Advanced Mode: Network Mix, Device Split &amp; Extra Revenue
                </a>
              </li>
              <li>
                <a href="#website-revenue-examples" className="text-emerald-300 hover:underline">
                  Worked Examples: Small Blog, Niche Site &amp; Multi-Network Stack
                </a>
              </li>
              <li>
                <a href="#website-revenue-optimization" className="text-emerald-300 hover:underline">
                  Optimization Ideas: How to Improve RPM, EPMV &amp; Total Revenue
                </a>
              </li>
              <li>
                <a href="#website-revenue-pros-cons" className="text-emerald-300 hover:underline">
                  Pros &amp; Limitations of This Website Revenue Calculator
                </a>
              </li>
              <li>
                <a href="#website-revenue-workflow" className="text-emerald-300 hover:underline">
                  Suggested Workflow: Using the Calculator in Your Monthly Reporting
                </a>
              </li>
              <li>
                <a href="#website-revenue-faq" className="text-emerald-300 hover:underline">
                  Website Revenue Calculator – Frequently Asked Questions
                </a>
              </li>
            </ol>
          </nav>
        
          {/* ===== Hero Explanation ===== */}
          <h1
            id="website-revenue-overview"
            className="text-3xl md:text-4xl font-bold text-emerald-300 mb-6"
          >
            Website Revenue Calculator – AdSense, adsterra &amp; Monetag RPM / EPMV Estimator
          </h1>
        
          <p>
            The <strong>Website Revenue Calculator</strong> on CalculatorHub is built for
            publishers, SEOs and media buyers who want a clear, data-driven way to turn
            <strong> sessions, pageviews and ad layout</strong> into realistic
            <strong> revenue projections</strong>. Instead of guessing what your site might earn from
            <strong> AdSense, adsterra, Monetag</strong> or other display ad networks, this tool
            models the full chain:
            <strong> traffic → pageviews → ad impressions → viewable impressions → filled impressions → estimated earnings</strong>.
          </p>
        
          <p>
            It works both as a simple <strong>AdSense RPM calculator</strong> in Normal Mode and as a
            more advanced, “ad ops–style” <strong>website monetization simulator</strong> in
            Advanced Mode, where you can:
          </p>
        
          <ul className="list-disc list-inside space-y-1">
            <li>Split your stack between <strong>AdSense, adsterra and Monetag</strong>.</li>
            <li>Assign a different <strong>eCPM</strong> (RPM per 1,000 viewable impressions) to each network.</li>
            <li>Model your <strong>device mix</strong> (desktop / mobile / tablet) with a mobile factor.</li>
            <li>Add <strong>direct campaigns, native ads and affiliate/commerce revenue</strong>.</li>
          </ul>
        
          <p>
            The goal is not to predict your earnings down to the last cent. Instead, the calculator
            gives you a <strong>transparent planning model</strong> that you can keep tweaking as your
            traffic, layout and ad stack evolve.
          </p>
        
          <figure className="my-8">
            <img
              src="/images/website_revenue_calculator.webp"
              alt="Website Revenue Calculator interface showing sessions, RPM and ad network mix cards"
              title="Website Revenue Calculator UI – sessions, pageviews, viewability, fill rate and network mix"
              className="rounded-xl shadow-lg border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Turn raw analytics data into a clear revenue picture using AdSense, adsterra, Monetag
              or any display stack.
            </figcaption>
          </figure>
        
          {/* ===== How to Use ===== */}
          <h2
            id="website-revenue-how-to-use"
            className="text-2xl md:text-3xl font-semibold text-emerald-300 mt-10 mb-4"
          >
            💡 How to Use the Website Revenue Calculator (Step-by-Step)
          </h2>
        
          <p>
            The interface follows the familiar CalculatorHub layout:
            <strong> inputs on the left</strong>, <strong>results on the right</strong>, updating in
            real time. Here’s a simple flow you can follow the first time you use it.
          </p>
        
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong>Grab your analytics.</strong> Open GA4, Universal Analytics, Matomo or your
              preferred analytics tool and note your <strong>monthly sessions</strong> and
              <strong> average pages per session</strong>.
            </li>
            <li>
              <strong>Enter your monthly sessions.</strong> This is the number of visits (not raw
              pageviews). The calculator multiplies this by pages per session to estimate total
              pageviews.
            </li>
            <li>
              <strong>Enter average pages per session.</strong> A typical content site may see
              1.4–3.0 pages per session; strong internal linking or sticky content can push this
              higher.
            </li>
            <li>
              <strong>Set the average ad units per page.</strong> Count only <em>real</em> display
              units that can load (in-article, sidebar, sticky, anchor, etc.). Avoid double-counting
              the same slot.
            </li>
            <li>
              <strong>Enter your viewability % and fill rate %.</strong> Pull these from your ad
              server or network dashboard if possible. If not, use reasonable starting values and
              refine later.
            </li>
            <li>
              <strong>Choose your primary network (AdSense / adsterra / Monetag).</strong> This lets
              the calculator label the basic result and sync your starting eCPM assumption.
            </li>
            <li>
              <strong>Enter a base eCPM (USD).</strong> This is the revenue per 1,000
              <em> viewable, filled impressions</em>. Many publishers start with 1–5 USD and adjust
              based on real reports.
            </li>
            <li>
              Review the <strong>Estimated Ad Revenue</strong> card on the right: you’ll see
              <strong> monthly and yearly revenue</strong>, <strong>EPMV</strong> and
              <strong> eRPM</strong>, plus the funnel from raw impressions to filled impressions.
            </li>
            <li>
              When you’re ready for more depth, switch on <strong>Advanced Mode</strong> to unlock
              the network mix, device split and extra revenue fields.
            </li>
          </ol>
        
          <p>
            In a couple of minutes, you move from “I think my site could earn something with ads”
            to a <strong>structured revenue model</strong> that you can test, compare and improve.
          </p>
        
          {/* ===== Inputs Explained ===== */}
          <h2
            id="website-revenue-inputs"
            className="text-2xl md:text-3xl font-semibold text-emerald-300 mt-10 mb-4"
          >
            🧮 Inputs Explained: Sessions, Pageviews, Impressions &amp; eCPM
          </h2>
        
          <p>
            Every field in the calculator is designed to map directly to metrics you already see in
            your analytics or ad stack. Here’s how each piece fits into the revenue equation.
          </p>
        
          <h3 className="text-xl font-semibold text-slate-100 mt-6 mb-2">
            1. Monthly sessions
          </h3>
          <p>
            A <strong>session</strong> is a visit. In GA4, it’s a group of events within a timeframe;
            in Universal Analytics, it’s a series of interactions before a timeout. The calculator
            treats sessions as the base unit because:
          </p>
        
          <ul className="list-disc list-inside space-y-1">
            <li>Sessions closely match <strong>visitors’ behaviour</strong>.</li>
            <li>Sessions make <strong>EPMV</strong> (earnings per 1,000 visitors) easy to compute.</li>
            <li>Session-based thinking is more useful for UX and content decisions.</li>
          </ul>
        
          <p>
            If your traffic is seasonal, it can be helpful to plug in an average of the last
            3–6 months instead of a single “lucky” month.
          </p>
        
          <h3 className="text-xl font-semibold text-slate-100 mt-6 mb-2">
            2. Average pages per session
          </h3>
          <p>
            This metric multiplies with sessions to estimate <strong>total pageviews</strong>. More
            pageviews per visit usually mean:
          </p>
        
          <ul className="list-disc list-inside space-y-1">
            <li>More <strong>opportunities to show ads</strong>.</li>
            <li>Higher potential for <strong>affiliate clicks</strong>.</li>
            <li>Better perceived site quality in many ad algorithms.</li>
          </ul>
        
          <p>
            However, you should balance this with UX. Forcing unnecessary pageviews with intrusive
            pagination may hurt engagement, Core Web Vitals and long-term revenue.
          </p>
        
          <h3 className="text-xl font-semibold text-slate-100 mt-6 mb-2">
            3. Avg. ad units per page
          </h3>
          <p>
            This is your <strong>ad density</strong>. If you run 2 in-article units, 1 sidebar unit
            and 1 sticky anchor per page, you might enter 3–4 here depending on how often they load.
          </p>
        
          <p>
            The calculator multiplies <strong>pageviews × ad units per page</strong> to get
            <strong> raw impressions</strong> – the maximum number of times an ad could be served if
            everything loaded and was viewable.
          </p>
        
          <h3 className="text-xl font-semibold text-slate-100 mt-6 mb-2">
            4. Viewability % and fill rate %
          </h3>
          <p>
            Two critical concepts from the ad tech world:
          </p>
        
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Viewability %</strong> – share of impressions where at least a set portion of
              the ad (for example, 50%) was actually in the user’s viewport for a minimum time.
            </li>
            <li>
              <strong>Fill rate %</strong> – share of ad requests that were actually filled with a
              paying ad (no blank / passback).
            </li>
          </ul>
        
          <p>
            The calculator applies these percentages step by step:
          </p>
        
          <ol className="list-decimal list-inside space-y-1">
            <li><strong>Raw impressions</strong> from your layout.</li>
            <li>
              Multiply by <strong>viewability %</strong> → <strong>viewable impressions</strong>.
            </li>
            <li>
              Multiply by <strong>fill rate %</strong> → <strong>filled, viewable impressions</strong>.
            </li>
          </ol>
        
          <p>
            This final number is what gets multiplied by your <strong>eCPM</strong>, because networks
            typically pay on viewable or close-to-viewable metrics.
          </p>
        
          <h3 className="text-xl font-semibold text-slate-100 mt-6 mb-2">
            5. Primary network &amp; base eCPM (USD)
          </h3>
          <p>
            You can pick a primary network:
            <strong> AdSense, adsterra or Monetag</strong>. This does two things:
          </p>
        
          <ul className="list-disc list-inside space-y-1">
            <li>It changes the label in the result card (for clarity in screenshots/reports).</li>
            <li>It softly nudges the default <strong>eCPM</strong> value, which you can override.</li>
          </ul>
        
          <p>
            <strong>eCPM</strong> in this calculator means:
            <em> earnings per 1,000 filled, viewable ad impressions</em>. It compresses the entire
            ad auction, format mix and advertiser demand into a single, adjustable number. If your
            real data differs from your assumption, you can update eCPM and instantly see how it
            changes your revenue.
          </p>
        
          {/* ===== RPM vs EPMV vs eCPM ===== */}
          <h2
            id="website-revenue-rpm-epmv"
            className="text-2xl md:text-3xl font-semibold text-emerald-300 mt-10 mb-4"
          >
            📊 RPM vs EPMV vs eCPM – What’s the Difference and Why It Matters
          </h2>
        
          <p>
            Publishers often mix up <strong>RPM, EPMV and eCPM</strong>. The calculator shows
            multiple metrics so you can speak both “ad ops language” and “publisher language”
            confidently.
          </p>
        
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>eCPM</strong> –
              <em> Earnings per 1,000 ad impressions</em> (especially viewable + filled). This is
              how most networks think internally.
            </li>
            <li>
              <strong>RPM (page RPM / eRPM)</strong> –
              <em> Earnings per 1,000 pageviews</em>. Good for comparing layouts or how aggressively
              you monetize each page.
            </li>
            <li>
              <strong>EPMV</strong> –
              <em> Earnings per 1,000 visitors (sessions)</em>. Arguably the most important publisher
              metric, because it shows how much revenue each visitor is worth.
            </li>
          </ul>
        
          <p>
            In the results panel, you see:
          </p>
        
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>EPMV (per 1,000 sessions)</strong> – lets you answer “If I send 1,000 extra
              visitors, roughly how much will I earn?”
            </li>
            <li>
              <strong>eRPM (per 1,000 pageviews)</strong> – useful for comparing templates, ad
              density experiments or A/B tests on layout.
            </li>
            <li>
              <strong>Monthly &amp; yearly totals</strong> – so you can build forward-looking revenue
              projections and budgets.
            </li>
          </ul>
        
          <p>
            When you understand these three together, you can diagnose your monetization more
            precisely: maybe your eCPM is fine, but your EPMV is low because you show only one ad
            per page; or your RPM is high but EPMV is weak because users bounce quickly.
          </p>
        
          {/* ===== Advanced Mode ===== */}
          <h2
            id="website-revenue-advanced-mode"
            className="text-2xl md:text-3xl font-semibold text-emerald-300 mt-10 mb-4"
          >
            ⚙️ Advanced Mode: Network Mix, Device Split &amp; Extra Revenue Streams
          </h2>
        
          <p>
            Normal Mode gives you a clean, single-network <strong>website ads income calculator</strong>.
            Advanced Mode turns the page into a lightweight <strong>ad stack simulator</strong>.
          </p>
        
          <h3 className="text-xl font-semibold text-slate-100 mt-6 mb-2">
            1. Network mix – AdSense, adsterra, Monetag
          </h3>
          <p>
            Many publishers don’t rely on a single demand source. They stack
            <strong> AdSense</strong> with other partners like <strong>adsterra</strong> and
            <strong> Monetag</strong>, either via header bidding, waterfall or different placements.
            The calculator lets you:
          </p>
        
          <ul className="list-disc list-inside space-y-1">
            <li>Assign a <strong>traffic share %</strong> to each network.</li>
            <li>Give each network its own <strong>eCPM (USD)</strong>.</li>
            <li>See how much <strong>monthly revenue</strong> each network contributes.</li>
          </ul>
        
          <p>
            This is especially helpful when you want to compare:
          </p>
        
          <ul className="list-disc list-inside space-y-1">
            <li>
              What happens if you shift 20% of impressions from AdSense to Monetag for sticky mobile
              ads?
            </li>
            <li>
              How much do <strong>direct campaigns</strong> add on top of your programmatic baseline?
            </li>
          </ul>
        
          <h3 className="text-xl font-semibold text-slate-100 mt-6 mb-2">
            2. Device split – desktop, mobile, tablet
          </h3>
          <p>
            Device mix can dramatically change your effective RPM:
          </p>
        
          <ul className="list-disc list-inside space-y-1">
            <li>Desktop users might see more units but fewer sticky mobile ads.</li>
            <li>Mobile users may see high-performing in-content and sticky placements.</li>
            <li>Tablet traffic can behave like a blend of both.</li>
          </ul>
        
          <p>
            The calculator uses your <strong>desktop, mobile and tablet %</strong> and a
            <strong> mobile eCPM factor</strong> (e.g. 0.9 if mobile pays slightly less than desktop,
            or 1.1 if mobile performs better) to create a <strong>deviceFactor</strong>. This factor
            doesn’t change the number of impressions; it adjusts the revenue to better match your
            real mix.
          </p>
        
          <h3 className="text-xl font-semibold text-slate-100 mt-6 mb-2">
            3. Extra revenue – direct deals, native &amp; affiliate
          </h3>
          <p>
            Display ads are usually only one part of a publisher’s monetization stack. Advanced Mode
            gives you dedicated fields for:
          </p>
        
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Direct / native deals ($/month)</strong> – sponsorship banners, homepage takeovers, native content packages.</li>
            <li><strong>Affiliate / commerce ($/month)</strong> – link-based commissions, in-article product widgets, price-comparison tables.</li>
          </ul>
        
          <p>
            These inputs are added on top of your ad network revenue to produce:
          </p>
        
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Total monthly (ads + extras)</strong>.</li>
            <li><strong>Total yearly (ads + extras)</strong>.</li>
            <li><strong>Blended eCPM</strong> across all filled impressions.</li>
            <li><strong>Top network by revenue</strong> (AdSense / adsterra / Monetag).</li>
          </ul>
        
          <p>
            This gives you a richer picture of your site as a business rather than just an AdSense
            account.
          </p>
        
          {/* ===== Worked Examples ===== */}
          <h2
            id="website-revenue-examples"
            className="text-2xl md:text-3xl font-semibold text-emerald-300 mt-10 mb-4"
          >
            📈 Worked Examples: Small Blog, Growing Niche Site &amp; Multi-Network Stack
          </h2>
        
          <h3 className="text-xl font-semibold text-slate-100 mt-6 mb-2">
            Example 1 – Small content site just crossing 50k sessions
          </h3>
          <p>
            Suppose a blog has:
          </p>
        
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Monthly sessions:</strong> 50,000</li>
            <li><strong>Pages per session:</strong> 1.8</li>
            <li><strong>Ad units per page:</strong> 3</li>
            <li><strong>Viewability:</strong> 60%</li>
            <li><strong>Fill rate:</strong> 90%</li>
            <li><strong>Base eCPM:</strong> $3.00 (AdSense-focused)</li>
          </ul>
        
          <p>
            The calculator will estimate:
          </p>
        
          <ul className="list-disc list-inside space-y-1">
            <li>~90,000 pageviews per month (50k × 1.8).</li>
            <li>~270,000 raw ad impressions (pageviews × 3).</li>
            <li>~162,000 viewable impressions at 60% viewability.</li>
            <li>~145,800 filled impressions at 90% fill.</li>
          </ul>
        
          <p>
            With a $3.00 eCPM on the filled impressions, you’ll see an estimated monthly revenue,
            EPMV and eRPM that you can compare against real AdSense reports. If your actual numbers
            are very different, you can adjust eCPM or your viewability/fill assumptions accordingly.
          </p>
        
          <h3 className="text-xl font-semibold text-slate-100 mt-6 mb-2">
            Example 2 – Niche site with strong EPMV and multiple networks
          </h3>
          <p>
            Now imagine a more established niche site:
          </p>
        
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Monthly sessions:</strong> 250,000</li>
            <li><strong>Pages per session:</strong> 2.4</li>
            <li><strong>Ad units per page:</strong> 4</li>
            <li><strong>Viewability:</strong> 70%</li>
            <li><strong>Fill rate:</strong> 95%</li>
            <li><strong>Network mix:</strong> 50% AdSense, 25% adsterra, 25% Monetag</li>
            <li><strong>eCPMs:</strong> $4.00 AdSense, $3.20 adsterra, $4.50 Monetag</li>
            <li><strong>Device split:</strong> 30% desktop, 60% mobile, 10% tablet</li>
            <li><strong>Mobile factor:</strong> 1.05 (mobile ads slightly outperform desktop)</li>
            <li><strong>Direct/affiliate extras:</strong> $1,200 / month combined</li>
          </ul>
        
          <p>
            In Advanced Mode, the calculator shows:
          </p>
        
          <ul className="list-disc list-inside space-y-1">
            <li>
              Approximate revenue for each network individually – so you can see if Monetag is
              overperforming or underperforming relative to AdSense.
            </li>
            <li>
              A <strong>quality-adjusted ads revenue</strong> after applying the device factor.
            </li>
            <li>
              Final <strong>total monthly and yearly revenue</strong> including direct and affiliate
              income.
            </li>
            <li>
              The <strong>top-earning network</strong> and the overall <strong>blended eCPM</strong>.
            </li>
          </ul>
        
          <p>
            This kind of model is ideal when you want to answer questions like: “If I improve
            mobile RPM by 20%, how much does my total monthly revenue move?” or “What if I move 10%
            of traffic from AdSense to Monetag?”
          </p>
        
          {/* ===== Optimization Ideas ===== */}
          <h2
            id="website-revenue-optimization"
            className="text-2xl md:text-3xl font-semibold text-emerald-300 mt-10 mb-4"
          >
            🚀 Optimization Ideas: How to Improve RPM, EPMV &amp; Total Revenue
          </h2>
        
          <p>
            The Website Revenue Calculator is not just a forecasting tool; it’s a way to think
            through <strong>optimization hypotheses</strong>. Here are some levers you can explore
            and model directly in the interface:
          </p>
        
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Improve viewability.</strong> Move ads higher in content, avoid placements that
              rarely scroll into view, and test sticky units. Even a 5–10% viewability uplift can
              move revenue without adding more ads.
            </li>
            <li>
              <strong>Balance ad density and UX.</strong> Increasing ad units per page can boost RPM,
              but if it hurts engagement or Core Web Vitals, your traffic and EPMV may drop. Use the
              calculator to see both sides of the trade-off.
            </li>
            <li>
              <strong>Fix fill-rate issues.</strong> Make sure you have reasonable floor prices and a
              solid fallback strategy so blank impressions are minimized.
            </li>
            <li>
              <strong>Optimize mobile layouts.</strong> Many sites are majority mobile. If your mobile
              factor is below 1.0, consider testing better-performing formats or lazy-load strategies.
            </li>
            <li>
              <strong>Add higher-value formats.</strong> Native units, in-content placements or sticky
              anchors can often raise eCPM, especially for premium geos.
            </li>
            <li>
              <strong>Layer in extra revenue streams.</strong> Affiliate content, direct sponsorships
              and email list monetization can significantly raise total EPMV even if display ad RPM
              stays the same.
            </li>
          </ul>
        
          <p>
            With each idea, you can tweak one or two numbers in the calculator and instantly see how
            the maths changes before you commit to a layout overhaul or network migration.
          </p>
        
          {/* ===== Pros & Limitations ===== */}
          <h2
            id="website-revenue-pros-cons"
            className="text-2xl md:text-3xl font-semibold text-emerald-300 mt-10 mb-4"
          >
            ⚖️ Pros &amp; Limitations of This Website Revenue Calculator
          </h2>
        
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-slate-900/70 border border-emerald-500/30 rounded-xl p-4">
              <h3 className="text-emerald-300 font-semibold mb-2">Pros</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Free, browser-based and privacy-friendly – no login or API connection.</li>
                <li>Supports <strong>AdSense, adsterra, Monetag</strong> and custom eCPMs.</li>
                <li>Works with <strong>sessions, pageviews, impressions, RPM, EPMV and eCPM</strong>.</li>
                <li>Advanced Mode models <strong>network mix, devices and extra income</strong>.</li>
                <li>Great for <strong>what-if scenarios</strong> before making big layout or network changes.</li>
              </ul>
            </div>
        
            <div className="bg-slate-900/70 border border-rose-500/30 rounded-xl p-4">
              <h3 className="text-rose-300 font-semibold mb-2">Limitations</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  It’s <strong>not an official AdSense or network tool</strong> and does not pull live
                  earnings from your accounts.
                </li>
                <li>
                  Results depend on the assumptions you enter; if your eCPM is unrealistic, estimates
                  will be off.
                </li>
                <li>
                  Real ad auctions are dynamic and influenced by factors beyond the scope of a simple
                  calculator (bid density, creative quality, brand-safety filters, etc.).
                </li>
              </ul>
            </div>
          </div>
        
          {/* ===== Workflow Suggestion ===== */}
          <h2
            id="website-revenue-workflow"
            className="text-2xl md:text-3xl font-semibold text-emerald-300 mt-10 mb-4"
          >
            📅 Suggested Workflow: Using the Calculator in Your Monthly Reporting
          </h2>
        
          <p>
            To get the most value from this <strong>website revenue calculator</strong>, treat it as a
            recurring part of your analytics process:
          </p>
        
          <ol className="list-decimal list-inside space-y-2">
            <li>
              At the end of each month, export your <strong>sessions, pageviews, device mix and RPM</strong>
              from analytics and ad dashboards.
            </li>
            <li>
              Plug those numbers into the calculator and record the <strong>estimated revenue, EPMV and eRPM</strong>.
            </li>
            <li>
              Compare the estimates with your <strong>actual network payouts</strong> and adjust eCPM or other assumptions so the model stays close to reality.
            </li>
            <li>
              Note any changes you made during the month (new layout, extra units, new partner) and use the calculator to understand how those changes affected the funnel of impressions.
            </li>
            <li>
              Plan next month’s tests: ad density experiments, new formats, direct campaigns or affiliate pushes – then pre-model them here before deploying.
            </li>
          </ol>
        
          <p>
            Over time, this builds a <strong>lightweight forecasting framework</strong> around your
            site, making budgeting, hiring and growth decisions easier and less emotional.
          </p>
        
          {/* ===================== FAQ SECTION ===================== */}
          <section className="space-y-6 mt-16">
            <h2
              id="website-revenue-faq"
              className="text-3xl md:text-4xl font-bold mb-4 text-center text-emerald-300"
            >
              ❓ Website Revenue Calculator – Frequently Asked Questions
            </h2>
        
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
        
              <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q1: What does this Website Revenue Calculator actually estimate?
                </h3>
                <p>
                  It estimates your <strong>monthly and yearly earnings</strong> from display ads
                  using <strong>sessions, pageviews, ad units per page, viewability, fill rate</strong>
                  and an <strong>eCPM value</strong>. In Advanced Mode, it also models how much each
                  network (AdSense, adsterra, Monetag) contributes, adjusts for device mix and adds
                  <strong> direct / affiliate income</strong> on top of your ad earnings.
                </p>
              </div>
        
              <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q2: What is the difference between RPM and EPMV?
                </h3>
                <p>
                  <strong>RPM</strong> (page RPM) is <em>revenue per 1,000 pageviews</em>, which is
                  helpful when comparing layouts and templates. <strong>EPMV</strong> is
                  <em> earnings per 1,000 visitors or sessions</em>, which tells you how much each
                  visitor is worth overall. The calculator shows both so you can see if your site is
                  optimized per page, per visit, or both.
                </p>
              </div>
        
              <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q3: Can I use this calculator for adsterra and Monetag as well as AdSense?
                </h3>
                <p>
                  Yes. The tool is designed to be a <strong>network-agnostic RPM/EPMV estimator</strong>.
                  In Advanced Mode you can assign traffic shares and eCPMs to <strong>AdSense, adsterra and Monetag</strong>
                  individually and see how much revenue each network contributes to your total monthly
                  earnings. You can also treat any of the slots as “Other network” if you want to
                  model a different partner.
                </p>
              </div>
        
              <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q4: Does device mix (mobile vs desktop) affect the estimate?
                </h3>
                <p>
                  Yes. The calculator lets you define a <strong>desktop, mobile and tablet split</strong>
                  and a <strong>mobile eCPM factor</strong>. Because mobile and desktop often perform
                  differently, this factor is applied as a quality adjustment on your network revenue.
                  If your site is 80–90% mobile, getting this part right is crucial for realistic
                  projections.
                </p>
              </div>
        
              <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q5: Is the Website Revenue Calculator free to use?
                </h3>
                <p>
                  Yes. The calculator on CalculatorHub is <strong>completely free</strong>, runs
                  entirely in your browser and doesn’t require any login or connection to your ad
                  accounts. You’re free to use it for planning, client reporting or internal
                  projections as often as you like.
                </p>
              </div>
        
            </div>
          </section>
        </section>

        {/* =================== AUTHOR & CROSS-LINKS SECTION =================== */}
        <section className="mt-6 border-t border-gray-800 pt-6 text-slate-300 max-w-4xl mx-auto mb-16">
          <div className="flex items-center gap-3">
            <img
              src="/images/calculatorhub-author.webp"
              alt="CalculatorHub Ads & Publisher Tools Team"
              className="w-12 h-12 rounded-full border border-gray-600"
              loading="lazy"
            />
            <div>
              <p className="font-semibold text-white">
                Written by the CalculatorHub Ads &amp; Publisher Tools Team
              </p>
              <p className="text-sm text-slate-400">
                Specialists in RPM optimization, EPMV modelling and multi-network monetization
                strategies. Last updated:{" "}
                <time dateTime="2025-11-15">November 15, 2025</time>.
              </p>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-slate-900/80 via-slate-950/80 to-slate-900/80 rounded-xl border border-slate-700 shadow-inner p-4">
            <p className="text-slate-200 text-sm mb-2 font-medium tracking-wide">
              🔗 Explore more creator &amp; ad revenue tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/youtube-revenue-calculator"
                className="flex items-center gap-2 bg-[#020617] hover:bg-red-600/15 text-red-300 hover:text-red-400 px-3 py-2 rounded-md border border-slate-700 hover:border-red-500 transition-all duration-200"
              >
                <span className="text-red-400">▶️</span> YouTube Revenue Calculator
              </Link>

              {/* ✅ FIXED: match App.tsx route */}
              <Link
                to="/tiktok-creator-fund-estimator"
                className="flex items-center gap-2 bg-[#020617] hover:bg-pink-600/15 text-pink-300 hover:text-pink-400 px-3 py-2 rounded-md border border-slate-700 hover:border-pink-500 transition-all duration-200"
              >
                <span className="text-pink-400">🎵</span> TikTok Revenue Calculator
              </Link>

              {/* ✅ FIXED: match App.tsx route */}
              <Link
                to="/admob-ecpm-estimator"
                className="flex items-center gap-2 bg-[#020617] hover:bg-emerald-600/15 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
              >
                <span className="text-emerald-400">📱</span> App Revenue Calculator
              </Link>
            </div>
          </div>
        </section>

        <Suspense fallback={null}>
          <AdBanner type="bottom" />
          <RelatedCalculators
            currentPath="/adsense-revenue-calculator"
            category="ads-creator-tools"
          />
        </Suspense>
      </div>
    </>
  );
};

export default WebsiteRevenueCalculator;
