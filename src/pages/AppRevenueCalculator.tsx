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
  const [subscriptionsMonthly, setSubscriptionsMonthly] = useState<number>(0);
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
        title="App Revenue Calculator – AdMob / In-App Ads Earnings Estimator"
        description="Estimate mobile app revenue from AdMob and in-app ads. Enter DAU, sessions, ads per session, fill rate and eCPM to see projected monthly and yearly earnings. Use Advanced Mode to split by ad format and add IAP/subscription income."
        canonical="https://calculatorhub.site/app-revenue-calculator"
        schemaData={generateCalculatorSchema(
          "App Revenue Calculator",
          "Estimate app revenue from ads with a simple DAU-based model. Add Advanced Mode to split impressions by banner, interstitial and rewarded ads, plus in-app purchase and subscription revenue.",
          "/app-revenue-calculator",
          [
            "app revenue calculator",
            "admob revenue estimator",
            "mobile app ads income",
            "app monetization calculator",
          ]
        )}
        breadcrumbs={[
          { name: "Misc Tools", url: "/category/misc-tools" },
          { name: "App Revenue Calculator", url: "/app-revenue-calculator" },
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
          href="https://calculatorhub.site/app-revenue-calculator"
        />

        <link
          rel="alternate"
          href="https://calculatorhub.site/app-revenue-calculator"
          hreflang="en"
        />
        <link
          rel="alternate"
          href="https://calculatorhub.site/app-revenue-calculator"
          hreflang="x-default"
        />

        {/* OG */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="CalculatorHub" />
        <meta
          property="og:title"
          content="App Revenue Calculator — AdMob / In-App Ads Estimator"
        />
        <meta
          property="og:description"
          content="Project mobile app ad revenue using DAU, sessions and eCPM. Optional Advanced Mode for ad formats and IAP income."
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
        <meta property="og:locale" content="en_US" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="App Revenue Calculator — AdMob / In-App Ads Estimator"
        />
        <meta
          name="twitter:description"
          content="Free DAU-based app revenue calculator with simple and advanced modes."
        />
        <meta
          name="twitter:image"
          content="https://calculatorhub.site/images/app_revenue_calculator.webp"
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
                    onChange={(e) => setFillRate(clamp0(Number(e.target.value)))}
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
                  advancedEnabled ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"
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
                            setInterstitialShare(clamp0(Number(e.target.value)))
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
                            setInterstitialEcpm(clamp0(Number(e.target.value)))
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

        {/* Short explainer */}
        <section className="mt-10 mb-10 text-slate-300 text-sm sm:text-base leading-relaxed">
          <h2 className="text-2xl font-bold text-cyan-400 mb-3">
            How this App Revenue Calculator works
          </h2>
          <p className="mb-3">
            This tool uses a simple but powerful{" "}
            <strong>DAU × sessions × ads</strong> model to estimate your
            monthly and yearly app earnings from ad impressions. You enter your
            daily active users, how often they open the app, how many ads you
            show per session, your fill rate and a realistic eCPM range.
          </p>
          <p className="mb-3">
            In <strong>Normal Mode</strong>, it calculates ad revenue as a
            single blended value. In{" "}
            <strong>Advanced Mode, the calculator goes deeper</strong> by
            splitting those impressions into banner, interstitial and rewarded
            ads – each with its own eCPM – and then adds non-ad income like
            in-app purchases and subscriptions.
          </p>
          <p>
            Use this as a planning tool to compare scenarios, set realistic
            targets and decide how aggressive you want to be with ad density and
            monetization.
          </p>
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

