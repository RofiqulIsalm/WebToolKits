// src/pages/TikTokRevenueCalculator.tsx
import React, { useEffect, useMemo, useState, Suspense } from "react";
import { Link } from "react-router-dom";
import {
  PlaySquare,
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
import { generateCalculatorSchema } from "../utils/seoData";

// Lazy-load non-critical
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

const ADVANCED_LS_KEY = "tiktok-revenue-advanced-mode";

/* =============== Component =============== */

const TikTokRevenueCalculator: React.FC = () => {
  // ---------- Basic inputs ----------
  const [monthlyViews, setMonthlyViews] = useState<number>(2_000_000);
  const [regionTier, setRegionTier] = useState<"tier1" | "tier2" | "tier3">(
    "tier1"
  );
  const [monetizedPercent, setMonetizedPercent] = useState<number>(60); // % of views that qualify (Creator Fund / ad rev)
  const [rpmLow, setRpmLow] = useState<number>(0.3); // USD per 1000 monetized views
  const [rpmHigh, setRpmHigh] = useState<number>(1.2);
  const [daysPerMonth] = useState<number>(30);

  // ---------- Advanced ----------
  const [advancedEnabled, setAdvancedEnabled] = useState<boolean>(false);
  const [advLoading, setAdvLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<"basic" | "advanced" | null>(null);

  // Engagement & extras
  const [avgWatchTime, setAvgWatchTime] = useState<number>(9); // seconds
  const [engagementRate, setEngagementRate] = useState<number>(8); // %
  const [brandDealsMonthly, setBrandDealsMonthly] = useState<number>(0);
  const [affiliateMonthly, setAffiliateMonthly] = useState<number>(0);
  const [liveGiftsMonthly, setLiveGiftsMonthly] = useState<number>(0);

  // ---------- Region RPM multipliers ----------
  const baseMultiplier = useMemo(() => {
    switch (regionTier) {
      case "tier1":
        return 1; // US, CA, UK, DE, AU etc.
      case "tier2":
        return 0.7; // Eastern Europe, LatAm, mid-income
      case "tier3":
        return 0.45; // South Asia, Africa, low-income
      default:
        return 1;
    }
  }, [regionTier]);

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
    setMonthlyViews(2_000_000);
    setRegionTier("tier1");
    setMonetizedPercent(60);
    setRpmLow(0.3);
    setRpmHigh(1.2);
    setAvgWatchTime(9);
    setEngagementRate(8);
    setBrandDealsMonthly(0);
    setAffiliateMonthly(0);
    setLiveGiftsMonthly(0);
  };

  // ---------- Basic result ----------
  const basicResult = useMemo(() => {
    if (!monthlyViews || monthlyViews <= 0) return null;

    const monetizedViews = (monthlyViews * monetizedPercent) / 100;
    const adjLowRpm = rpmLow * baseMultiplier;
    const adjHighRpm = rpmHigh * baseMultiplier;

    const monthlyMin = (monetizedViews / 1000) * adjLowRpm;
    const monthlyMax = (monetizedViews / 1000) * adjHighRpm;

    const yearlyMin = monthlyMin * 12;
    const yearlyMax = monthlyMax * 12;

    // Simple per 1000 total views (effective RPM vs all views)
    const effRpmMin =
      monthlyViews > 0 ? (monthlyMin / monthlyViews) * 1000 : 0;
    const effRpmMax =
      monthlyViews > 0 ? (monthlyMax / monthlyViews) * 1000 : 0;

    return {
      monetizedViews,
      monthlyMin,
      monthlyMax,
      yearlyMin,
      yearlyMax,
      effRpmMin,
      effRpmMax,
    };
  }, [
    monthlyViews,
    monetizedPercent,
    rpmLow,
    rpmHigh,
    baseMultiplier,
    daysPerMonth,
  ]);

  // ---------- Advanced result ----------
  const advancedResult = useMemo(() => {
    if (!advancedEnabled || !basicResult) return null;

    // Engagement "quality factor": simple weight (not real TikTok formula, just planner)
    const wt = Math.min(Math.max(avgWatchTime, 1), 60);
    const er = Math.min(Math.max(engagementRate, 0.5), 50);

    const qualityFactor = 0.7 + wt / 60 + er / 100; // 0.7–2.2 approx
    const adjustedMonthlyMid =
      ((basicResult.monthlyMin + basicResult.monthlyMax) / 2) * qualityFactor;

    const extras =
      (brandDealsMonthly || 0) +
      (affiliateMonthly || 0) +
      (liveGiftsMonthly || 0);

    const totalMonthly = adjustedMonthlyMid + extras;
    const totalYearly = totalMonthly * 12;

    return {
      qualityFactor,
      adjustedMonthlyMid,
      extrasMonthly: extras,
      totalMonthly,
      totalYearly,
    };
  }, [
    advancedEnabled,
    basicResult,
    avgWatchTime,
    engagementRate,
    brandDealsMonthly,
    affiliateMonthly,
    liveGiftsMonthly,
  ]);

  const handleCopy = async (type: "basic" | "advanced") => {
    try {
      let text = "";

      if (type === "basic" && basicResult) {
        text += `TikTok Revenue (Creator Fund / RPM estimate)\n`;
        text += `Monthly: ${moneyFmt(
          basicResult.monthlyMin
        )} – ${moneyFmt(basicResult.monthlyMax)}\n`;
        text += `Yearly: ${moneyFmt(
          basicResult.yearlyMin
        )} – ${moneyFmt(basicResult.yearlyMax)}\n`;
      }

      if (type === "advanced" && advancedResult) {
        text += `TikTok Revenue (Advanced – engagement + extra income)\n`;
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
          title="TikTok Revenue Calculator – Creator Fund & Ad Revenue Estimator"
          description="Estimate your TikTok earnings from views, region and RPM. Adjust monetized views, engagement and extra income such as brand deals, affiliate and LIVE gifts in Advanced Mode."
          keywords={[
            "tiktok revenue calculator",
            "tiktok creator fund estimator",
            "tiktok rpm calculator",
            "tiktok money calculator",
            "tiktok cpm rpm earnings",
            "creator earnings tool",
            "short video revenue estimator"
          ]}
          canonical="https://calculatorhub.site/tiktok-revenue-calculator"
          breadcrumbs={[
            { name: "Misc Tools", url: "/category/misc-tools" },
            { name: "TikTok Revenue Calculator", url: "/tiktok-revenue-calculator" }
          ]}
          schemaData={[
            // 1) WebPage (+ nested Article)
            {
              "@context":"https://schema.org",
              "@type":"WebPage",
              "@id":"https://calculatorhub.site/tiktok-revenue-calculator#webpage",
              "url":"https://calculatorhub.site/tiktok-revenue-calculator",
              "name":"TikTok Revenue Calculator — Creator Fund & Ad Revenue Estimator",
              "inLanguage":"en",
              "isPartOf":{"@id":"https://calculatorhub.site/#website"},
              "primaryImageOfPage":{
                "@type":"ImageObject",
                "@id":"https://calculatorhub.site/images/tiktok_revenue_calculator.webp#primaryimg",
                "url":"https://calculatorhub.site/images/tiktok_revenue_calculator.webp",
                "width":1200,"height":675
              },
              "mainEntity":{
                "@type":"Article",
                "@id":"https://calculatorhub.site/tiktok-revenue-calculator#article",
                "headline":"TikTok Revenue Calculator — Creator Fund, RPM & Extra Income",
                "description":"Simple TikTok revenue calculator to estimate Creator Fund and ad income from monthly views, region tiers and RPM. Advanced Mode includes engagement and extra income like brand deals, affiliate and LIVE gifts.",
                "image":[
                  "https://calculatorhub.site/images/tiktok_revenue_calculator.webp"
                ],
                "author":{"@type":"Organization","name":"CalculatorHub","url":"https://calculatorhub.site"},
                "publisher":{"@id":"https://calculatorhub.site/#organization"},
                "datePublished":"2025-10-10",
                "dateModified":"2025-11-15",
                "mainEntityOfPage":{"@id":"https://calculatorhub.site/tiktok-revenue-calculator#webpage"},
                "articleSection":[
                  "Overview",
                  "How to Use",
                  "Inputs Explained",
                  "Normal vs Advanced Mode",
                  "Worked Example",
                  "Tips to Improve RPM",
                  "FAQ"
                ]
              }
            },
        
            // 2) Breadcrumbs
            {
              "@context":"https://schema.org",
              "@type":"BreadcrumbList",
              "@id":"https://calculatorhub.site/tiktok-revenue-calculator#breadcrumbs",
              "itemListElement":[
                {"@type":"ListItem","position":1,"name":"Home","item":"https://calculatorhub.site/"},
                {"@type":"ListItem","position":2,"name":"Misc Tools","item":"https://calculatorhub.site/category/misc-tools"},
                {"@type":"ListItem","position":3,"name":"TikTok Revenue Calculator","item":"https://calculatorhub.site/tiktok-revenue-calculator"}
              ]
            },
        
            // 3) FAQ (ensure it mirrors your on-page FAQ)
            {
              "@context":"https://schema.org",
              "@type":"FAQPage",
              "@id":"https://calculatorhub.site/tiktok-revenue-calculator#faq",
              "mainEntity":[
                {
                  "@type":"Question",
                  "name":"How are TikTok earnings estimated?",
                  "acceptedAnswer":{"@type":"Answer","text":"We multiply monetized views by your RPM range and add optional extra income (brand deals, affiliate, LIVE gifts) in Advanced Mode."}
                },
                {
                  "@type":"Question",
                  "name":"What affects RPM on TikTok?",
                  "acceptedAnswer":{"@type":"Answer","text":"Region tiers, niche, seasonality, advertiser demand and policy compliance all influence RPM."}
                },
                {
                  "@type":"Question",
                  "name":"Does the calculator include Creator Fund or ad revenue?",
                  "acceptedAnswer":{"@type":"Answer","text":"It’s an independent estimator that can approximate Creator Fund/ad income from your inputs; it is not an official payout tool."}
                },
                {
                  "@type":"Question",
                  "name":"What does Advanced Mode add?",
                  "acceptedAnswer":{"@type":"Answer","text":"Advanced Mode lets you adjust engagement/monetized views and add brand deals, affiliate income and LIVE gifts to see combined earnings."}
                },
                {
                  "@type":"Question",
                  "name":"Is it free to use?",
                  "acceptedAnswer":{"@type":"Answer","text":"Yes. It’s free, runs in your browser and doesn’t require registration."}
                }
              ]
            },
        
            // 4) WebApplication
            {
              "@context":"https://schema.org",
              "@type":"WebApplication",
              "@id":"https://calculatorhub.site/tiktok-revenue-calculator#webapp",
              "name":"TikTok Revenue Calculator",
              "url":"https://calculatorhub.site/tiktok-revenue-calculator",
              "applicationCategory":"BusinessApplication",
              "operatingSystem":"Web",
              "publisher":{"@id":"https://calculatorhub.site/#organization"},
              "image":[
                "https://calculatorhub.site/images/tiktok_revenue_calculator.webp"
              ],
              "description":"Estimate TikTok earnings from views, region tiers and RPM. Advanced Mode adds engagement and extra income such as brand deals, affiliate and LIVE gifts."
            },
        
            // 5) SoftwareApplication (optional, helpful)
            {
              "@context":"https://schema.org",
              "@type":"SoftwareApplication",
              "@id":"https://calculatorhub.site/tiktok-revenue-calculator#software",
              "name":"TikTok Revenue Calculator",
              "applicationCategory":"BusinessApplication",
              "operatingSystem":"All",
              "url":"https://calculatorhub.site/tiktok-revenue-calculator",
              "publisher":{"@id":"https://calculatorhub.site/#organization"},
              "description":"Simple TikTok revenue estimator with Normal and Advanced modes."
            },
        
            // 6) Site & Org (site-wide ids)
            {
              "@context":"https://schema.org",
              "@type":"WebSite",
              "@id":"https://calculatorhub.site/#website",
              "url":"https://calculatorhub.site",
              "name":"CalculatorHub",
              "publisher":{"@id":"https://calculatorhub.site/#organization"},
              "potentialAction":{
                "@type":"SearchAction",
                "target":"https://calculatorhub.site/search?q={query}",
                "query-input":"required name=query"
              }
            },
            {
              "@context":"https://schema.org",
              "@type":"Organization",
              "@id":"https://calculatorhub.site/#organization",
              "name":"CalculatorHub",
              "url":"https://calculatorhub.site",
              "logo":{"@type":"ImageObject","url":"https://calculatorhub.site/images/calculatorhub-logo.webp"}
            }
          ]}
        />
        
        {/* ---- Core meta & links (child block like your pattern) ---- */}
        <>
          {/* Core */}
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta
            name="robots"
            content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
          />
          <meta name="googlebot" content="index,follow" />
          <link rel="canonical" href="https://calculatorhub.site/tiktok-revenue-calculator" />
        
          {/* Hreflang */}
          <link
            rel="alternate"
            href="https://calculatorhub.site/tiktok-revenue-calculator"
            hreflang="en"
          />
          <link
            rel="alternate"
            href="https://calculatorhub.site/tiktok-revenue-calculator"
            hreflang="x-default"
          />
        
          {/* Open Graph */}
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="CalculatorHub" />
          <meta
            property="og:title"
            content="TikTok Revenue Calculator — Creator Fund & RPM Estimator"
          />
          <meta
            property="og:description"
            content="Project your TikTok earnings with a simple view + RPM model plus Advanced Mode for engagement and extra income."
          />
          <meta property="og:url" content="https://calculatorhub.site/tiktok-revenue-calculator" />
          <meta
            property="og:image"
            content="https://calculatorhub.site/images/tiktok_revenue_calculator.webp"
          />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:locale" content="en_US" />
          <meta property="og:updated_time" content="2025-11-15T00:00:00Z" />
        
          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta
            name="twitter:title"
            content="TikTok Revenue Calculator — Creator Fund & RPM Estimator"
          />
          <meta
            name="twitter:description"
            content="Free TikTok revenue calculator with simple and advanced modes."
          />
          <meta
            name="twitter:image"
            content="https://calculatorhub.site/images/tiktok_revenue_calculator.webp"
          />
          <meta name="twitter:site" content="@calculatorhub" />
        
          {/* Icons / PWA */}
          <meta name="theme-color" content="#0ea5e9" />
          <link rel="manifest" href="/site.webmanifest" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16.png" />
          <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
          <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#0ea5e9" />
          <meta name="msapplication-TileColor" content="#0ea5e9" />
        
          {/* Performance */}
          <link rel="preconnect" href="https://calculatorhub.site" crossOrigin="" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
          <link
            rel="preload"
            as="image"
            href="/images/tiktok_revenue_calculator.webp"
            imagesrcset="/images/tiktok_revenue_calculator.webp 1x"
            fetchpriority="high"
          />
          <link
            rel="preload"
            href="/fonts/Inter-Variable.woff2"
            as="font"
            type="font/woff2"
            crossOrigin=""
          />
        
          {/* Sitemap & UX */}
          <link rel="sitemap" type="application/xml" href="https://calculatorhub.site/sitemap.xml" />
          <meta name="referrer" content="no-referrer-when-downgrade" />
          <meta name="format-detection" content="telephone=no" />


      </>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <Breadcrumbs
          items={[
            { name: "Misc Tools", url: "/category/misc-tools" },
            { name: "TikTok Revenue Calculator", url: "/tiktok-revenue-calculator" },
          ]}
        />

        {/* Header */}
        <div className="mb-8 text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/40 bg-pink-500/10 px-3 py-1 text-xs text-pink-200 mb-3">
            <PlaySquare className="w-4 h-4" />
            TikTok • Creator Fund & Brand Deals
          </div>
          <h1 className="text-white text-2xl sm:text-3xl font-bold mb-2">
            TikTok Revenue Calculator
          </h1>
          <p className="text-slate-200 text-sm sm:text-base">
            Estimate how much you can earn from TikTok views using a simple view
            + RPM model, then layer on engagement and extra income in Advanced
            Mode.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ============ Inputs ============ */}
          <div className="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-5 sm:p-6 shadow-xl shadow-slate-950/40">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-pink-500/15 border border-pink-400/40 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-pink-300" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-100">
                    Views & Region
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Start with monthly views, region tier and a realistic RPM
                    range.
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggleAdvanced}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] sm:text-xs font-medium transition-all ${
                  advancedEnabled
                    ? "bg-pink-600/90 border-pink-400 text-white shadow-md shadow-pink-900/40"
                    : "bg-slate-900/80 border-slate-600 text-slate-100 hover:bg-slate-800"
                }`}
              >
                <Settings2 className="w-4 h-4" />
                {advancedEnabled ? "Advanced: ON" : "Advanced Mode"}
              </button>
            </div>

            <div className="space-y-4">
              {/* Monthly views */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                  Monthly video views
                </label>
                <input
                  type="number"
                  min={0}
                  inputMode="decimal"
                  onKeyDown={blockBadKeys}
                  value={monthlyViews}
                  onChange={(e) =>
                    setMonthlyViews(clamp0(Number(e.target.value)))
                  }
                  className="w-full px-3 sm:px-4 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-pink-500/80"
                  placeholder="e.g. 2,000,000"
                />
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                  Total views from all your TikTok videos in a typical month.
                </p>
              </div>

              {/* Region tier */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Globe2 className="w-3.5 h-3.5 text-slate-300" />
                  Main audience region
                </label>
                <select
                  value={regionTier}
                  onChange={(e) =>
                    setRegionTier(e.target.value as "tier1" | "tier2" | "tier3")
                  }
                  className="w-full px-3 sm:px-4 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-pink-500/80"
                >
                  <option value="tier1">
                    Tier 1 – US, CA, UK, DE, AU (Highest RPM)
                  </option>
                  <option value="tier2">
                    Tier 2 – Europe, LatAm, Middle-income
                  </option>
                  <option value="tier3">
                    Tier 3 – South Asia, Africa, Low-income
                  </option>
                </select>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                  RPM is usually higher in Tier 1 countries and lower in
                  emerging regions.
                </p>
              </div>

              {/* Monetized views % */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                  Monetized views %
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={1}
                    value={monetizedPercent}
                    onChange={(e) =>
                      setMonetizedPercent(clamp0(Number(e.target.value)))
                    }
                    className="flex-1 accent-pink-500"
                  />
                  <div className="w-12 text-right text-sm text-slate-100">
                    {monetizedPercent}%
                  </div>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                  Not every view pays. This is a rough share of views that
                  qualify for Creator Fund or ad revenue.
                </p>
              </div>

              {/* RPM range */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-slate-300" />
                  TikTok RPM (per 1,000 monetized views)
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
                      value={rpmLow}
                      onChange={(e) => setRpmLow(clamp0(Number(e.target.value)))}
                      className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-pink-500/80"
                      placeholder="e.g. 0.3"
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
                      value={rpmHigh}
                      onChange={(e) =>
                        setRpmHigh(clamp0(Number(e.target.value)))
                      }
                      className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-pink-500/80"
                      placeholder="e.g. 1.2"
                    />
                  </div>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                  TikTok RPM varies widely. Start with a range, then refine
                  later using your analytics.
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
                  advancedEnabled ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="mt-4 border-t border-slate-700 pt-4 space-y-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-pink-300" />
                    Advanced Mode – Engagement & extra income
                  </h3>

                  {/* Engagement */}
                  <div className="space-y-3">
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      These metrics do not change the official TikTok formula
                      but help you model higher/lower earnings based on video
                      quality.
                    </p>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                        Average watch time per view (seconds)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        inputMode="decimal"
                        onKeyDown={blockBadKeys}
                        value={avgWatchTime}
                        onChange={(e) =>
                          setAvgWatchTime(clamp0(Number(e.target.value)))
                        }
                        className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-pink-500/80"
                        placeholder="e.g. 9"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                        Engagement rate (likes + comments + shares %)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        inputMode="decimal"
                        onKeyDown={blockBadKeys}
                        value={engagementRate}
                        onChange={(e) =>
                          setEngagementRate(clamp0(Number(e.target.value)))
                        }
                        className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-pink-500/80"
                        placeholder="e.g. 8"
                      />
                    </div>
                  </div>

                  {/* Extra monetization */}
                  <div className="space-y-3">
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      Add non-RPM income per month (optional).
                    </p>

                    <div className="grid grid-cols-1 gap-3 text-[11px] sm:text-xs">
                      <div>
                        <label className="block text-slate-300 mb-1">
                          Brand deals / sponsorships ($/month)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          inputMode="decimal"
                          onKeyDown={blockBadKeys}
                          value={brandDealsMonthly}
                          onChange={(e) =>
                            setBrandDealsMonthly(
                              clamp0(Number(e.target.value))
                            )
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-pink-500/80"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1">
                          Affiliate / link income ($/month)
                        </label>
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
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-pink-500/80"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1">
                          LIVE gifts / other ($/month)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          inputMode="decimal"
                          onKeyDown={blockBadKeys}
                          value={liveGiftsMonthly}
                          onChange={(e) =>
                            setLiveGiftsMonthly(
                              clamp0(Number(e.target.value))
                            )
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-pink-500/80"
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
                    Estimated TikTok Earnings
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
                  <div className="text-center p-4 rounded-xl border border-pink-500/40 bg-gradient-to-br from-pink-900/40 via-slate-950 to-pink-950/60">
                    <PlaySquare className="h-8 w-8 text-pink-300 mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-pink-50">
                      {basicResult
                        ? `${moneyFmt(
                            basicResult.monthlyMin
                          )} – ${moneyFmt(basicResult.monthlyMax)}`
                        : "$0 – $0"}
                    </div>
                    <div className="text-xs sm:text-sm text-pink-100/80">
                      Estimated monthly revenue (Creator Fund / RPM)
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
                        Monetized views / month
                      </div>
                      <div className="font-semibold text-slate-100">
                        {basicResult
                          ? basicResult.monetizedViews.toLocaleString()
                          : 0}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-700 text-center">
                      <div className="text-slate-400 mb-1">
                        Effective RPM (all views)
                      </div>
                      <div className="font-semibold text-slate-100">
                        {basicResult
                          ? `${moneyFmt(
                              basicResult.effRpmMin,
                              false
                            )} – ${moneyFmt(basicResult.effRpmMax, false)}`
                          : "0 – 0"}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-700 text-center">
                      <div className="text-slate-400 mb-1">Region tier</div>
                      <div className="font-semibold text-slate-100 capitalize">
                        {regionTier === "tier1"
                          ? "Tier 1"
                          : regionTier === "tier2"
                          ? "Tier 2"
                          : "Tier 3"}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] sm:text-xs text-slate-500 flex items-start gap-1">
                    <Info className="w-3.5 h-3.5 mt-0.5 text-slate-400" />
                    This is a rough planning estimate based on RPM ranges
                    reported by many creators. TikTok doesn&apos;t publish a
                    fixed formula, and actual payouts depend on country, niche,
                    content quality, and changing policies.
                  </p>
                </div>
              </div>

              {/* Advanced block */}
              <div className="mt-4 border-t border-slate-700 pt-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h2 className="text-sm sm:text-base font-semibold text-slate-100 flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-pink-300" />
                    Advanced Result (quality + extra income)
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
                        Total monthly (Creator Fund + extras)
                      </p>
                      <p className="text-base sm:text-lg font-semibold text-slate-50">
                        {moneyFmt(advancedResult.totalMonthly)}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400 mb-1">
                        Total yearly (Creator Fund + extras)
                      </p>
                      <p className="text-sm sm:text-base font-semibold text-slate-100">
                        {moneyFmt(advancedResult.totalYearly)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-700">
                        <p className="text-slate-400 mb-1">
                          Adjusted Creator Fund (quality-weighted)
                        </p>
                        <p className="text-slate-100">
                          {moneyFmt(advancedResult.adjustedMonthlyMid)} / month
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-700">
                        <p className="text-slate-400 mb-1">
                          Brand deals + affiliate + LIVE
                        </p>
                        <p className="text-slate-100">
                          {moneyFmt(advancedResult.extrasMonthly)} / month
                        </p>
                      </div>
                    </div>

                    <div className="mt-1 rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="text-slate-300 font-medium">
                          Engagement quality factor
                        </p>
                        <p className="text-slate-400">
                          Based on watch time{" "}
                          <span className="font-mono">{avgWatchTime}s</span> and
                          engagement rate{" "}
                          <span className="font-mono">{engagementRate}%</span>.
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Factor</p>
                        <p className="font-semibold text-pink-200 text-sm">
                          × {advancedResult.qualityFactor.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Turn on Advanced Mode to see how watch time, engagement and
                    extra income (brand deals, affiliate, LIVE) can change your
                    overall monthly revenue.
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
            <h2 className="text-lg font-semibold text-pink-300 mb-3">
              📖 Table of Contents
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <a href="#tiktok-overview" className="text-indigo-400 hover:underline">
                  Overview: What This TikTok Revenue Calculator Does
                </a>
              </li>
              <li>
                <a href="#tiktok-how-to-use" className="text-indigo-400 hover:underline">
                  How to Use the TikTok Revenue Calculator
                </a>
              </li>
              <li>
                <a href="#tiktok-inputs" className="text-indigo-400 hover:underline">
                  Inputs Explained: Views, Region, Monetized %, RPM
                </a>
              </li>
              <li>
                <a href="#tiktok-advanced-mode" className="text-indigo-400 hover:underline">
                  Advanced Mode: Engagement, Brand Deals, Affiliate &amp; LIVE
                </a>
              </li>
              <li>
                <a href="#tiktok-example" className="text-indigo-400 hover:underline">
                  Worked Example: TikTok RPM &amp; Monthly Earnings Scenario
                </a>
              </li>
              <li>
                <a href="#tiktok-tips" className="text-indigo-400 hover:underline">
                  Tips to Improve TikTok RPM &amp; Overall Earnings
                </a>
              </li>
              <li>
                <a href="#tiktok-pros-cons" className="text-indigo-400 hover:underline">
                  Pros &amp; Limitations of This TikTok Money Calculator
                </a>
              </li>
              <li>
                <a href="#tiktok-faq" className="text-indigo-400 hover:underline">
                  TikTok Revenue Calculator – FAQ
                </a>
              </li>
            </ol>
          </nav>
        
          <h1
            id="tiktok-overview"
            className="text-3xl font-bold text-pink-400 mb-6"
          >
            TikTok Revenue Calculator – Creator Fund, RPM &amp; Extra Income Estimator
          </h1>
        
          <p>
            The <strong>TikTok Revenue Calculator</strong> on CalculatorHub is a practical
            <strong> TikTok money calculator</strong> built for creators who want a realistic way
            to estimate their potential earnings from views. Instead of chasing random screenshots
            on social media, you can model your <strong>TikTok creator fund</strong> and ad-style
            income using a simple <strong>views × RPM</strong> approach — then layer on
            <strong> brand deals, affiliate earnings and LIVE gifts</strong> in Advanced Mode.
          </p>
        
          <p>
            TikTok does not publicly publish a fixed payout formula, and real RPM can vary a lot
            depending on <strong>region, niche, season and policy changes</strong>. This tool does
            not try to “hack” TikTok’s system. Instead, it gives you a clean, transparent
            <strong> TikTok RPM calculator</strong> where you stay in control of the assumptions:
            <strong> monthly views</strong>, <strong>monetized percentage</strong>,
            <strong> audience region tier</strong> and a <strong>low–high RPM range</strong>.
          </p>
        
          <figure className="my-8">
            <img
              src="/images/tiktok_revenue_calculator.webp"
              alt="TikTok Revenue Calculator interface showing views, RPM, region tiers and estimated earnings"
              title="TikTok Revenue Calculator | Creator Fund & RPM Estimator"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Plan your TikTok earnings from views, RPM, audience region and extra income streams.
            </figcaption>
          </figure>
        
          <h2
            id="tiktok-how-to-use"
            className="text-2xl font-semibold text-pink-300 mt-10 mb-4"
          >
            💡 How to Use the TikTok Revenue Calculator (Step-by-Step)
          </h2>
        
          <p>
            The calculator follows the same clean layout used across CalculatorHub’s creator tools:
            <strong> inputs on the left</strong>, <strong>results on the right</strong>, updating
            live as you type. You can treat it like a focused
            <strong> TikTok earnings estimator</strong> with both simple and advanced views.
          </p>
        
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Enter your <strong>monthly video views</strong> – sum of all views across your TikTok
              account in a typical 30-day period.
            </li>
            <li>
              Choose the <strong>main audience region</strong> tier to reflect where most of your
              viewers live (Tier 1, Tier 2 or Tier 3).
            </li>
            <li>
              Adjust the <strong>monetized views %</strong> slider to estimate what portion of total
              views actually qualify for Creator Fund or ad revenue.
            </li>
            <li>
              Enter a <strong>low RPM</strong> and <strong>high RPM</strong> value
              (earnings per 1,000 monetized views) based on what you see in your niche or from
              credible reports.
            </li>
            <li>
              Optional: enable <strong>Advanced Mode</strong> to add engagement quality and extra
              income (brand deals, affiliate, LIVE gifts).
            </li>
          </ol>
        
          <p>
            Once these values are filled, the right-hand side behaves like a clear
            <strong> TikTok creator fund calculator</strong>. You will instantly see:
          </p>
        
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Estimated monthly revenue</strong> (low–high band).</li>
            <li><strong>Estimated yearly revenue</strong>, extrapolating the monthly range.</li>
            <li><strong>Monetized views per month</strong> based on your percentage.</li>
            <li><strong>Effective RPM for all views</strong>, not just monetized ones.</li>
          </ul>
        
          <p>
            This allows you to quickly test different “what if” scenarios without touching a
            spreadsheet — for example, what happens if your <strong>monetized share</strong> grows,
            or if your <strong>RPM</strong> moves from <code>$0.30</code> to <code>$1.50</code>.
          </p>
        
          <h2
            id="tiktok-inputs"
            className="text-2xl font-semibold text-pink-300 mt-10 mb-4"
          >
            🧮 Inputs Explained: Views, Region Tier, Monetized % &amp; RPM
          </h2>
        
          <p>
            Every input in this <strong>TikTok money calculator</strong> is designed to be simple
            but meaningful. Here is what each field represents and why it matters:
          </p>
        
          <h3 className="text-xl font-semibold text-slate-100 mt-6 mb-2">
            1. Monthly video views
          </h3>
          <p>
            This is your total TikTok reach for the month – the sum of all video views on your
            account. The higher the views, the more monetized impressions you can generate. If your
            numbers fluctuate a lot, use an average from the last few months to smooth out spikes.
          </p>
        
          <h3 className="text-xl font-semibold text-slate-100 mt-6 mb-2">
            2. Region tier (Tier 1, Tier 2, Tier 3)
          </h3>
          <p>
            Advertisers do not pay the same amount for every audience. RPM tends to be higher in
            <strong> Tier 1 countries</strong> (US, Canada, UK, Germany, Australia etc.) and lower
            in <strong>emerging markets</strong>. The calculator uses a simple multiplier to reflect
            this:
          </p>
        
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Tier 1</strong> – baseline multiplier (1.0), highest potential RPM.</li>
            <li><strong>Tier 2</strong> – moderate multiplier (around 0.7).</li>
            <li><strong>Tier 3</strong> – lower multiplier (around 0.45).</li>
          </ul>
        
          <p>
            This is not a perfect representation of TikTok’s internal logic, but it makes the
            <strong> TikTok RPM estimator</strong> more realistic when your audience is mostly outside
            of premium markets.
          </p>
        
          <h3 className="text-xl font-semibold text-slate-100 mt-6 mb-2">
            3. Monetized views %
          </h3>
          <p>
            Not every view on TikTok generates payout. Some views may not be monetizable due to
            region, content type, ad inventory or eligibility rules. The
            <strong> monetized views %</strong> slider lets you approximate what share of your total
            views actually contribute to Creator Fund or ad revenue. Many creators use values
            between <strong>40–70%</strong> as a rough starting point, but you can adjust this based
            on your analytics.
          </p>
        
          <h3 className="text-xl font-semibold text-slate-100 mt-6 mb-2">
            4. TikTok RPM (low / high)
          </h3>
          <p>
            RPM stands for <strong>Revenue Per Mille</strong>, or earnings per 1,000 monetized views.
            TikTok RPM can vary from a few cents to a couple of dollars depending on:
          </p>
        
          <ul className="list-disc list-inside space-y-1">
            <li>Audience country mix and device type.</li>
            <li>Content niche (finance vs. memes vs. education etc.).</li>
            <li>Seasonality (Q4 ad budgets vs. quiet months).</li>
            <li>Policy changes and experimental features.</li>
          </ul>
        
          <p>
            Instead of forcing you to pick a single RPM, this <strong>TikTok earnings calculator</strong>
            uses a <strong>low–high range</strong>. The result is a minimum and maximum estimated
            revenue, which is more honest than pretending there is one fixed payout value.
          </p>
        
          <h2
            id="tiktok-advanced-mode"
            className="text-2xl font-semibold text-pink-300 mt-10 mb-4"
          >
            ⚙️ Advanced Mode: Engagement, Brand Deals, Affiliate &amp; LIVE Gifts
          </h2>
        
          <p>
            Basic Mode focuses purely on <strong>views × RPM</strong>, making it ideal for quick
            estimates. Advanced Mode turns the page into a more complete
            <strong> TikTok creator income calculator</strong> by adding:
          </p>
        
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Average watch time per view</strong> – longer watch times usually signal better
              content quality and can help attract stronger ad demand.
            </li>
            <li>
              <strong>Engagement rate</strong> (likes + comments + shares, as a %) – used as a proxy
              for how “sticky” your videos are.
            </li>
            <li>
              <strong>Brand deals / sponsorships per month</strong> – fixed income from collaborations.
            </li>
            <li>
              <strong>Affiliate or link income per month</strong> – referral or link-based revenue
              from sending traffic to products or services.
            </li>
            <li>
              <strong>LIVE gifts / other income per month</strong> – additional earnings from LIVE
              sessions or any other TikTok-related monetization.
            </li>
          </ul>
        
          <p>
            Inside the calculator, watch time and engagement rate are combined into a simple
            <strong> engagement quality factor</strong> (for example, 1.2× or 1.8×). This factor
            does not mirror TikTok’s hidden formula, but it gives you a way to model how stronger
            content might lift your average earnings. The calculator multiplies your mid-point
            Creator Fund estimate by this factor, then adds brand deals, affiliate income and LIVE
            gifts to show a combined <strong>total monthly</strong> and <strong>total yearly</strong>
            revenue band.
          </p>
        
          <h2
            id="tiktok-example"
            className="text-2xl font-semibold text-pink-300 mt-10 mb-4"
          >
            📊 Worked Example: TikTok RPM &amp; Monthly Earnings Scenario
          </h2>
        
          <p>
            Imagine a TikTok creator with the following stats:
          </p>
        
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Monthly views:</strong> 2,000,000</li>
            <li><strong>Main audience:</strong> Tier 2 countries</li>
            <li><strong>Monetized views %:</strong> 60%</li>
            <li><strong>RPM range:</strong> $0.30 (low) – $1.20 (high)</li>
          </ul>
        
          <p>
            The calculator will:
          </p>
        
          <ol className="list-decimal list-inside space-y-1">
            <li>Compute <strong>monetized views</strong> as 60% of 2,000,000 = 1,200,000 views.</li>
            <li>Apply the <strong>Tier 2 multiplier</strong> to modify the RPM range.</li>
            <li>
              Estimate <strong>monthly revenue</strong> as
              <code> monetized views ÷ 1,000 × RPM</code> (low and high).
            </li>
            <li>
              Multiply by 12 to show <strong>yearly TikTok earnings</strong> for the same assumptions.
            </li>
            <li>
              Calculate <strong>effective RPM</strong> per 1,000 total views – so you know how much
              you earn on average from each thousand views overall.
            </li>
          </ol>
        
          <p>
            If the same creator also makes <strong>$500/month</strong> from brand deals,
            <strong>$300/month</strong> from affiliate links, and <strong>$200/month</strong> from
            LIVE gifts, they can enable Advanced Mode and add those values. The calculator then shows
            an adjusted <strong>Creator Fund baseline</strong> plus <strong>combined monthly income</strong>,
            giving a more complete picture of TikTok as a business, not just a platform.
          </p>
        
          <h2
            id="tiktok-tips"
            className="text-2xl font-semibold text-pink-300 mt-10 mb-4"
          >
            🧭 Practical Tips to Improve TikTok RPM &amp; Overall Earnings
          </h2>
        
          <p>
            The output from this <strong>TikTok revenue estimator</strong> is a starting point, not a
            ceiling. Small strategic changes can move your RPM and total income over time:
          </p>
        
          <ul className="list-disc list-inside space-y-2">
            <li>
              💡 <strong>Focus on watch time:</strong> Hook viewers in the first seconds and keep
              them watching. Higher average watch time usually leads to better performance.
            </li>
            <li>
              💡 <strong>Increase engagement:</strong> Ask for comments, replies and shares. Strong
              engagement signals quality to algorithms and brands.
            </li>
            <li>
              💡 <strong>Test different niches:</strong> Some topics (finance, tech, B2B, education)
              attract higher-paying advertisers than generic entertainment.
            </li>
            <li>
              💡 <strong>Build relationships with brands:</strong> Even if Creator Fund RPM is low,
              <strong> direct sponsorships</strong> can raise your earnings per view dramatically.
            </li>
            <li>
              💡 <strong>Use multiple monetization channels:</strong> Combine Creator Fund, brand
              deals, affiliate links, LIVE gifts and off-platform offers to diversify your income.
            </li>
          </ul>
        
          <p>
            With this calculator, you can instantly see how these changes might affect your monthly
            and yearly income by tweaking <strong>RPM</strong>, <strong>monetized percentage</strong>
            and <strong>extra income</strong> fields.
          </p>
        
          <h2
            id="tiktok-pros-cons"
            className="text-2xl font-semibold text-pink-300 mt-10 mb-4"
          >
            ⚖️ Pros &amp; Limitations of This TikTok Money Calculator
          </h2>
        
          <p>
            Just like any modelling tool, a <strong>TikTok revenue calculator</strong> has strengths
            and boundaries. Understanding both helps you interpret the numbers correctly.
          </p>
        
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
              <h3 className="text-emerald-300 font-semibold mb-2">Pros</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Fast, browser-based estimate — no login or account connection needed.</li>
                <li>
                  Uses <strong>low–high RPM bands</strong> instead of a single number, giving a more
                  realistic range.
                </li>
                <li>
                  Takes <strong>region tiers</strong> into account, which many generic calculators ignore.
                </li>
                <li>
                  Advanced Mode includes <strong>engagement</strong> and <strong>extra income</strong>
                  like brand deals and LIVE gifts.
                </li>
              </ul>
            </div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
              <h3 className="text-rose-300 font-semibold mb-2">Limitations</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  It is <strong>not an official TikTok payout tool</strong> and does not fetch real
                  data from TikTok.
                </li>
                <li>
                  Results depend heavily on the <strong>RPM and monetized %</strong> values you choose.
                </li>
                <li>
                  TikTok can change eligibility rules, fund structures or ad products at any time.
                </li>
              </ul>
            </div>
          </div>
        
          {/* ===================== FAQ SECTION ===================== */}
          <section className="space-y-6 mt-16">
            <h2
              id="tiktok-faq"
              className="text-3xl md:text-4xl font-bold mb-4 text-center text-pink-300"
            >
              ❓ TikTok Revenue Calculator – Frequently Asked Questions
            </h2>
        
            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q1: How are TikTok earnings estimated here?
                </h3>
                <p>
                  This tool acts as a planning-focused <strong>TikTok earnings estimator</strong>.
                  It multiplies your <strong>monetized views</strong> by a low–high
                  <strong> RPM range</strong> and adjusts for audience region tiers. In Advanced Mode,
                  it adds separate monthly income from <strong>brand deals</strong>,
                  <strong> affiliate links</strong> and <strong>LIVE gifts</strong> to show a combined
                  monthly and yearly estimate.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q2: What affects RPM on TikTok?
                </h3>
                <p>
                  Real <strong>TikTok RPM</strong> is influenced by several factors: audience country
                  mix, content niche, advertiser budgets, seasonality and policy compliance. Creators
                  in Tier 1 countries and high-value niches often see higher RPM than those in
                  lower-paying regions or broad, non-commercial topics.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q3: Does this calculator include Creator Fund or ad revenue?
                </h3>
                <p>
                  Yes – the base calculation is designed to approximate
                  <strong> Creator Fund / ad-style revenue</strong> from your views using RPM. However,
                  it is <strong>not an official TikTok tool</strong>. It runs entirely in your browser
                  and does not guarantee real payouts. Think of it as an independent, educational
                  <strong> TikTok creator fund calculator</strong> for planning only.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q4: What does Advanced Mode add on top of the basic estimate?
                </h3>
                <p>
                  Advanced Mode lets you account for <strong>video quality</strong> (watch time and
                  engagement rate) via a simple quality factor, and it adds
                  <strong> non-RPM income</strong> such as brand partnerships, affiliate programs and
                  LIVE gifts. This turns the page from a simple RPM calculator into a more complete
                  <strong> TikTok income calculator</strong> that reflects how many creators actually
                  monetize their audience.
                </p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                  Q5: Is this TikTok Revenue Calculator free to use?
                </h3>
                <p>
                  Yes. This <strong>TikTok revenue tool</strong> is completely free, runs directly in
                  your browser and does not require any login or registration. You can use it as often
                  as you like to model different scenarios, tweak RPM ranges and experiment with new
                  monetization strategies for your TikTok account.
                </p>
              </div>
            </div>
          </section>
        </section>
        
        {/* =================== AUTHOR & CROSS-LINKS SECTION =================== */}
        <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
          <div className="flex items-center gap-3">
            <img
              src="/images/calculatorhub-author.webp"
              alt="CalculatorHub Creator & Ads Tools Team"
              className="w-12 h-12 rounded-full border border-gray-600"
              loading="lazy"
            />
            <div>
              <p className="font-semibold text-white">
                Written by the CalculatorHub Creator &amp; Ads Tools Team
              </p>
              <p className="text-sm text-slate-400">
                Specialists in social media monetization, RPM modelling and creator-friendly analytics.
                Last updated:{" "}
                <time dateTime="2025-11-15">November 15, 2025</time>.
              </p>
            </div>
          </div>
        
          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              🚀 Explore more creator revenue calculators on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/facebook-instream-revenue-estimator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-blue-600/20 text-blue-300 hover:text-blue-400 px-3 py-2 rounded-md border border-slate-700 hover:border-blue-500 transition-all duration-200"
              >
                <span className="text-blue-400">📺</span> Facebook Revenue Calculator
              </Link>
        
              <Link
                to="/youtube-revenue-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-red-600/20 text-red-300 hover:text-red-400 px-3 py-2 rounded-md border border-slate-700 hover:border-red-500 transition-all duration-200"
              >
                <span className="text-red-400">▶️</span> YouTube Revenue Calculator
              </Link>
        
              <Link
                to="/app-revenue-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
              >
                <span className="text-emerald-400">📱</span> App Revenue Calculator
              </Link>
            </div>
          </div>
        </section>




        <Suspense fallback={null}>
          <AdBanner type="bottom" />
          <RelatedCalculators
            currentPath="/tiktok-revenue-calculator"
            category="ads-creator-tools"
          />
        </Suspense>
      </div>
    </>
  );
};

export default TikTokRevenueCalculator;
