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
import { generateCalculatorSchema } from "../utils/seoData";

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
    const saved = localStorage.getItem(ADVANCED_LS_KEY);
    if (saved === "1") setAdvancedEnabled(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(ADVANCED_LS_KEY, advancedEnabled ? "1" : "0");
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
        (impressions * (networkShare.adsense / 100)) /
        1000 *
        networkEcpm.adsense,
      adsterra:
        (impressions * (networkShare.adsterra / 100)) /
        1000 *
        networkEcpm.adsterra,
      monetag:
        (impressions * (networkShare.monetag / 100)) /
        1000 *
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
        title="Website Revenue Calculator – AdSense, adsterra & Monetag RPM Estimator"
        description="Estimate your website earnings from AdSense, adsterra, Monetag or a blend of networks. Plan revenue from sessions, pageviews, ad layout, fill rate, viewability and network mix in Normal or Advanced Mode."
        canonical="https://calculatorhub.site/adsense-revenue-calculator"
        schemaData={generateCalculatorSchema(
          "Website Revenue Calculator",
          "A premium website revenue calculator for AdSense, adsterra and Monetag. Model RPM, ad impressions, fill rate, network mix and extra income streams to predict monthly and yearly website revenue.",
          "/adsense-revenue-calculator",
          [
            "website revenue calculator",
            "adsense revenue estimator",
            "adsterra monetag rpm calculator",
            "website ads income calculator",
          ]
        )}
        breadcrumbs={[
          { name: "Misc Tools", url: "/category/misc-tools" },
          {
            name: "Website Revenue Calculator",
            url: "/adsense-revenue-calculator",
          },
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
          href="https://calculatorhub.site/adsense-revenue-calculator"
        />

        <link
          rel="alternate"
          href="https://calculatorhub.site/adsense-revenue-calculator"
          hreflang="en"
        />
        <link
          rel="alternate"
          href="https://calculatorhub.site/adsense-revenue-calculator"
          hreflang="x-default"
        />

        {/* OG */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="CalculatorHub" />
        <meta
          property="og:title"
          content="Website Revenue Calculator — AdSense, adsterra & Monetag RPM Estimator"
        />
        <meta
          property="og:description"
          content="Premium website RPM & revenue calculator for AdSense, adsterra and Monetag with advanced network mix and layout options."
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
        <meta property="og:locale" content="en_US" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Website Revenue Calculator — AdSense, adsterra & Monetag RPM Estimator"
        />
        <meta
          name="twitter:description"
          content="Free website revenue calculator with network mix, device split and extras."
        />
        <meta
          name="twitter:image"
          content="https://calculatorhub.site/images/website_revenue_calculator.webp"
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

        {/* Explainer */}
        <section className="mt-10 mb-10 text-slate-300 text-sm sm:text-base leading-relaxed">
          <h2 className="text-2xl font-bold text-emerald-300 mb-3">
            How this Website Revenue Calculator works
          </h2>
          <p className="mb-3">
            The tool starts with a simple{" "}
            <strong>sessions → pageviews → impressions</strong> model. You
            enter monthly sessions, average pages per session, ad units per
            page, plus viewability and fill rate. Using a base eCPM, the
            calculator estimates monthly and yearly revenue and key health
            metrics like <strong>EPMV</strong> (earnings per 1,000 sessions) and{" "}
            <strong>eRPM</strong> (per 1,000 pageviews).
          </p>
          <p className="mb-3">
            In <strong>Advanced Mode</strong>, things get more powerful: you can{" "}
            <strong>allocate traffic between AdSense, adsterra and Monetag</strong>
            , give each a custom eCPM, model revenue by device mix and add{" "}
            <strong>direct/native campaigns and affiliate income</strong>. This
            gives you a realistic &quot;full-stack&quot; view of how your site
            monetization behaves month to month.
          </p>
          <p>
            Use it to plan layout changes, test &quot;what if&quot; scenarios
            before switching networks, or benchmark whether your current RPM is
            underperforming for your traffic, niche and geography. Save the URL
            and revisit each month with fresh analytics to track your progress.
          </p>
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
