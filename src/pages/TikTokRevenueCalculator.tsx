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
        canonical="https://calculatorhub.site/tiktok-revenue-calculator"
        schemaData={generateCalculatorSchema(
          "TikTok Revenue Calculator",
          "Simple TikTok revenue calculator to estimate Creator Fund and ad income based on monthly views, region tier and RPM. Advanced Mode includes engagement and extra income like brand deals and affiliate.",
          "/tiktok-revenue-calculator",
          [
            "tiktok revenue calculator",
            "tiktok creator fund estimator",
            "tiktok money calculator",
            "tiktok rpm earnings tool",
          ]
        )}
        breadcrumbs={[
          { name: "Misc Tools", url: "/category/misc-tools" },
          { name: "TikTok Revenue Calculator", url: "/tiktok-revenue-calculator" },
        ]}
      />

      <>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="robots"
          content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
        />
        <link
          rel="canonical"
          href="https://calculatorhub.site/tiktok-revenue-calculator"
        />

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

        {/* OG */}
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
        <meta
          property="og:url"
          content="https://calculatorhub.site/tiktok-revenue-calculator"
        />
        <meta
          property="og:image"
          content="https://calculatorhub.site/images/tiktok_revenue_calculator.webp"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_US" />

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

        {/* Icons / PWA */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0ea5e9" />

        {/* Perf */}
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />

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

        {/* Short explainer */}
        <section className="mt-10 mb-10 text-slate-300 text-sm sm:text-base leading-relaxed">
          <h2 className="text-2xl font-bold text-pink-300 mb-3">
            How this TikTok Revenue Calculator works
          </h2>
          <p className="mb-3">
            The calculator uses a simple{" "}
            <strong>views × RPM × monetized%</strong> model to approximate your
            TikTok earnings. You enter your monthly views, choose a region tier,
            set what share of views are monetized and pick a low–high RPM
            range. The tool then estimates your potential monthly and yearly
            payouts.
          </p>
          <p className="mb-3">
            In <strong>Normal Mode</strong>, you get a clean revenue range based
            only on views and RPM. In{" "}
            <strong>Advanced Mode, you can go deeper</strong> by adding watch
            time, engagement rate and external income streams like brand
            sponsorships, affiliate links and LIVE gifts. These inputs don&apos;t
            mirror TikTok&apos;s private formula, but they give you a practical way
            to plan and compare scenarios.
          </p>
          <p>
            Use this as a planning tool – not an official guarantee – to
            understand how much content volume and quality you need to hit your
            income goals as a TikTok creator.
          </p>
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
