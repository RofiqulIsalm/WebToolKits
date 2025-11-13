// src/pages/FacebookInstreamAdsCalculator.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Video,
  Globe2,
  Settings2,
  Users,
  BarChart3,
  DollarSign,
  Info,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";

import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import RelatedCalculators from "../components/RelatedCalculators";
import { generateCalculatorSchema } from "../utils/seoData";

type CountryCpm = {
  code: string;
  name: string;
  minCpm: number;
  maxCpm: number;
};

type AudienceRow = {
  id: string;
  countryCode: string;
  percent: number;
};

const ADVANCED_LS_KEY = "fb-instream-advanced-simple";

/**
 * Approximate default CPM ranges (USD) per country for Facebook In-Stream Ads.
 */
const COUNTRY_CPM: CountryCpm[] = [
  // Tier 1
  { code: "US", name: "United States", minCpm: 5, maxCpm: 10 },
  { code: "CA", name: "Canada", minCpm: 4.5, maxCpm: 9 },
  { code: "GB", name: "United Kingdom", minCpm: 4.5, maxCpm: 9.5 },
  { code: "AU", name: "Australia", minCpm: 4, maxCpm: 8.5 },
  { code: "NZ", name: "New Zealand", minCpm: 3.5, maxCpm: 8 },
  { code: "DE", name: "Germany", minCpm: 3.5, maxCpm: 7.5 },
  { code: "FR", name: "France", minCpm: 3, maxCpm: 7 },
  { code: "NL", name: "Netherlands", minCpm: 3, maxCpm: 7 },
  { code: "SE", name: "Sweden", minCpm: 3, maxCpm: 7 },
  { code: "NO", name: "Norway", minCpm: 3.5, maxCpm: 7.5 },
  { code: "DK", name: "Denmark", minCpm: 3, maxCpm: 7 },
  { code: "CH", name: "Switzerland", minCpm: 4, maxCpm: 8.5 },

  // Europe mid-tier
  { code: "IE", name: "Ireland", minCpm: 2.5, maxCpm: 5.5 },
  { code: "IT", name: "Italy", minCpm: 2, maxCpm: 4.5 },
  { code: "ES", name: "Spain", minCpm: 2, maxCpm: 4.5 },
  { code: "PT", name: "Portugal", minCpm: 2, maxCpm: 4.5 },
  { code: "BE", name: "Belgium", minCpm: 2.2, maxCpm: 4.8 },
  { code: "AT", name: "Austria", minCpm: 2.2, maxCpm: 4.8 },
  { code: "FI", name: "Finland", minCpm: 2.2, maxCpm: 4.8 },
  { code: "PL", name: "Poland", minCpm: 1.8, maxCpm: 3.8 },
  { code: "CZ", name: "Czech Republic", minCpm: 1.8, maxCpm: 3.8 },
  { code: "GR", name: "Greece", minCpm: 1.8, maxCpm: 3.8 },
  { code: "RO", name: "Romania", minCpm: 1.5, maxCpm: 3.5 },
  { code: "HU", name: "Hungary", minCpm: 1.5, maxCpm: 3.5 },
  { code: "BG", name: "Bulgaria", minCpm: 1.3, maxCpm: 3.2 },

  // North Africa / Middle East
  { code: "AE", name: "United Arab Emirates", minCpm: 2.5, maxCpm: 6.5 },
  { code: "SA", name: "Saudi Arabia", minCpm: 2.5, maxCpm: 6.5 },
  { code: "QA", name: "Qatar", minCpm: 2.5, maxCpm: 6.5 },
  { code: "KW", name: "Kuwait", minCpm: 2.5, maxCpm: 6.5 },
  { code: "OM", name: "Oman", minCpm: 2.2, maxCpm: 5.5 },
  { code: "BH", name: "Bahrain", minCpm: 2.2, maxCpm: 5.5 },
  { code: "EG", name: "Egypt", minCpm: 1.3, maxCpm: 3 },
  { code: "MA", name: "Morocco", minCpm: 1.3, maxCpm: 3 },
  { code: "DZ", name: "Algeria", minCpm: 1.3, maxCpm: 3 },

  // Latin America
  { code: "BR", name: "Brazil", minCpm: 1.3, maxCpm: 3.2 },
  { code: "MX", name: "Mexico", minCpm: 1.3, maxCpm: 3.2 },
  { code: "AR", name: "Argentina", minCpm: 1.2, maxCpm: 2.8 },
  { code: "CL", name: "Chile", minCpm: 1.3, maxCpm: 3 },
  { code: "CO", name: "Colombia", minCpm: 1.2, maxCpm: 2.8 },
  { code: "PE", name: "Peru", minCpm: 1.2, maxCpm: 2.8 },

  // South Asia
  { code: "IN", name: "India", minCpm: 0.7, maxCpm: 2.2 },
  { code: "PK", name: "Pakistan", minCpm: 0.6, maxCpm: 1.8 },
  { code: "BD", name: "Bangladesh", minCpm: 0.5, maxCpm: 1.6 },
  { code: "LK", name: "Sri Lanka", minCpm: 0.6, maxCpm: 1.8 },
  { code: "NP", name: "Nepal", minCpm: 0.5, maxCpm: 1.6 },

  // East & Southeast Asia
  { code: "SG", name: "Singapore", minCpm: 2.5, maxCpm: 6 },
  { code: "MY", name: "Malaysia", minCpm: 1.6, maxCpm: 3.8 },
  { code: "TH", name: "Thailand", minCpm: 1.5, maxCpm: 3.5 },
  { code: "ID", name: "Indonesia", minCpm: 1.1, maxCpm: 2.7 },
  { code: "PH", name: "Philippines", minCpm: 1.1, maxCpm: 2.7 },
  { code: "VN", name: "Vietnam", minCpm: 1.1, maxCpm: 2.7 },
  { code: "JP", name: "Japan", minCpm: 3, maxCpm: 7 },
  { code: "KR", name: "South Korea", minCpm: 2.8, maxCpm: 6.5 },
  { code: "HK", name: "Hong Kong", minCpm: 2.8, maxCpm: 6.5 },
  { code: "TW", name: "Taiwan", minCpm: 2.2, maxCpm: 5.5 },

  // Africa
  { code: "ZA", name: "South Africa", minCpm: 1.3, maxCpm: 3.2 },
  { code: "NG", name: "Nigeria", minCpm: 0.7, maxCpm: 2 },
  { code: "KE", name: "Kenya", minCpm: 0.8, maxCpm: 2.1 },
  { code: "GH", name: "Ghana", minCpm: 0.8, maxCpm: 2.1 },
  { code: "TZ", name: "Tanzania", minCpm: 0.7, maxCpm: 2 },

  // Generic / fallback
  { code: "OTHER_HIGH", name: "Other (High-income country)", minCpm: 2.5, maxCpm: 6 },
  { code: "OTHER_MID", name: "Other (Middle-income country)", minCpm: 1.3, maxCpm: 3.5 },
  { code: "OTHER_LOW", name: "Other (Low-income country)", minCpm: 0.4, maxCpm: 1.8 },
];

const findCountry = (code: string): CountryCpm => {
  return (
    COUNTRY_CPM.find((c) => c.code === code) || {
      code: "GLOBAL",
      name: "Global Average",
      minCpm: 1.5,
      maxCpm: 3.5,
    }
  );
};

const formatMoney = (value: number | null | undefined) => {
  if (value === null || value === undefined || isNaN(value)) return "$0";
  if (!isFinite(value)) return "$0";
  if (Math.abs(value) < 0.01) return "$0";
  const rounded = Math.round(value * 100) / 100;
  return `$${rounded.toLocaleString(undefined, {
    minimumFractionDigits: rounded < 100 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
};

const FacebookInstreamAdsCalculator: React.FC = () => {
  // Basic inputs
  const [monthlyViews, setMonthlyViews] = useState<number>(100000);
  const [countryCode, setCountryCode] = useState<string>("US");
  const [monetizedPercent, setMonetizedPercent] = useState<number>(60);
  const [creatorShare, setCreatorShare] = useState<number>(55);

  // Advanced
  const [advancedEnabled, setAdvancedEnabled] = useState<boolean>(false);
  const [advLoading, setAdvLoading] = useState<boolean>(false);

  const [audienceRows, setAudienceRows] = useState<AudienceRow[]>([
    { id: "row-1", countryCode: "US", percent: 50 },
    { id: "row-2", countryCode: "IN", percent: 30 },
    { id: "row-3", countryCode: "BD", percent: 20 },
  ]);

  const [otherPlacementsMonthly, setOtherPlacementsMonthly] =
    useState<number>(0);
  const [brandDealsMonthly, setBrandDealsMonthly] = useState<number>(0);

  const [copied, setCopied] = useState<"basic" | "advanced" | null>(null);

  // Persist Advanced toggle
  useEffect(() => {
    const saved = localStorage.getItem(ADVANCED_LS_KEY);
    if (saved === "1") setAdvancedEnabled(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(ADVANCED_LS_KEY, advancedEnabled ? "1" : "0");
  }, [advancedEnabled]);

  const currentCountry = findCountry(countryCode);

  // Basic calculation (single country, in-stream only)
  const basicResult = useMemo(() => {
    if (!monthlyViews || monthlyViews <= 0) return null;

    const monetizedViews = (monthlyViews * monetizedPercent) / 100;
    const share = creatorShare / 100;

    const grossMin = (monetizedViews / 1000) * currentCountry.minCpm;
    const grossMax = (monetizedViews / 1000) * currentCountry.maxCpm;

    const creatorMin = grossMin * share;
    const creatorMax = grossMax * share;

    return {
      monetizedViews,
      monthlyMin: creatorMin,
      monthlyMax: creatorMax,
      yearlyMin: creatorMin * 12,
      yearlyMax: creatorMax * 12,
      rpmMin:
        monetizedViews > 0 ? (creatorMin / monetizedViews) * 1000 : null,
      rpmMax:
        monetizedViews > 0 ? (creatorMax / monetizedViews) * 1000 : null,
    };
  }, [monthlyViews, monetizedPercent, creatorShare, currentCountry]);

  // Advanced calculation (audience split + extra income)
  const advancedResult = useMemo(() => {
    if (!advancedEnabled || !monthlyViews || monthlyViews <= 0) return null;

    const share = creatorShare / 100;
    const monetizedFactor = monetizedPercent / 100;

    let adsMin = 0;
    let adsMax = 0;

    audienceRows.forEach((row) => {
      if (row.percent <= 0) return;
      const c = findCountry(row.countryCode);
      const viewsForRow = (monthlyViews * row.percent) / 100;
      const monetizedViews = viewsForRow * monetizedFactor;

      const grossMin = (monetizedViews / 1000) * c.minCpm;
      const grossMax = (monetizedViews / 1000) * c.maxCpm;

      adsMin += grossMin * share;
      adsMax += grossMax * share;
    });

    const extras = (otherPlacementsMonthly || 0) + (brandDealsMonthly || 0);

    return {
      adsMonthlyMin: adsMin,
      adsMonthlyMax: adsMax,
      extrasMonthly: extras,
      totalMonthlyMin: adsMin + extras,
      totalMonthlyMax: adsMax + extras,
      totalYearlyMin: (adsMin + extras) * 12,
      totalYearlyMax: (adsMax + extras) * 12,
    };
  }, [
    advancedEnabled,
    audienceRows,
    monthlyViews,
    monetizedPercent,
    creatorShare,
    otherPlacementsMonthly,
    brandDealsMonthly,
  ]);

  const handleToggleAdvanced = () => {
    if (!advancedEnabled) {
      setAdvLoading(true);
      setTimeout(() => {
        setAdvancedEnabled(true);
        setAdvLoading(false);
      }, 600);
    } else {
      setAdvancedEnabled(false);
      setAdvLoading(false);
    }
  };

  const handleAddRow = () => {
    if (audienceRows.length >= 6) return;
    setAudienceRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}`,
        countryCode: countryCode || "US",
        percent: 10,
      },
    ]);
  };

  const handleRowChange = (
    id: string,
    field: "countryCode" | "percent",
    value: string
  ) => {
    setAudienceRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]:
                field === "percent"
                  ? Math.max(0, Math.min(100, Number(value)))
                  : value,
            }
          : row
      )
    );
  };

  const handleRemoveRow = (id: string) => {
    setAudienceRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleCopy = async (type: "basic" | "advanced") => {
    try {
      let text = "";

      if (type === "basic" && basicResult) {
        text += `Facebook In-Stream Ads (basic estimate):\n`;
        text += `Monthly: ${formatMoney(
          basicResult.monthlyMin
        )} – ${formatMoney(basicResult.monthlyMax)}\n`;
        text += `Yearly: ${formatMoney(
          basicResult.yearlyMin
        )} – ${formatMoney(basicResult.yearlyMax)}\n`;
      }

      if (type === "advanced" && advancedResult) {
        text += `Facebook In-Stream Ads (advanced estimate):\n`;
        text += `Monthly: ${formatMoney(
          advancedResult.totalMonthlyMin
        )} – ${formatMoney(advancedResult.totalMonthlyMax)}\n`;
        text += `Yearly: ${formatMoney(
          advancedResult.totalYearlyMin
        )} – ${formatMoney(advancedResult.totalYearlyMax)}\n`;
      }

      await navigator.clipboard.writeText(text.trim());
      setCopied(type);
      setTimeout(() => setCopied(null), 1400);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = () => {
    setMonthlyViews(100000);
    setCountryCode("US");
    setMonetizedPercent(60);
    setCreatorShare(55);
    setAudienceRows([
      { id: "row-1", countryCode: "US", percent: 50 },
      { id: "row-2", countryCode: "IN", percent: 30 },
      { id: "row-3", countryCode: "BD", percent: 20 },
    ]);
    setOtherPlacementsMonthly(0);
    setBrandDealsMonthly(0);
  };

  return (
    <>
      <SEOHead
        title="Facebook In-Stream Ads Revenue Calculator – Simple Estimator"
        description="A simple Facebook In-Stream Ads revenue calculator to estimate your monthly and yearly earnings. Enter views, select country, and get a quick earnings range with optional advanced mode."
        canonical="https://calculatorhub.site/facebook-instream-ads-calculator"
        schemaData={generateCalculatorSchema(
          "Facebook In-Stream Ads Revenue Calculator",
          "Estimate earnings from Facebook In-Stream Ads with an easy calculator. Choose your country, monetized views and audience split in Normal or Advanced Mode.",
          "/facebook-instream-ads-calculator",
          [
            "facebook instream ads revenue calculator",
            "facebook video ads earnings estimator",
            "facebook cpm rpm calculator",
            "facebook creator earnings tool",
          ]
        )}
        breadcrumbs={[
          { name: "Misc Tools", url: "/category/misc-tools" },
          {
            name: "Facebook In-Stream Ads Calculator",
            url: "/facebook-instream-ads-calculator",
          },
        ]}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6">
        <Breadcrumbs
          items={[
            { name: "Misc Tools", url: "/category/misc-tools" },
            {
              name: "Facebook In-Stream Ads Calculator",
              url: "/facebook-instream-ads-calculator",
            },
          ]}
        />

        {/* MAIN CARD */}
        <div className="rounded-2xl p-4 sm:p-5 md:p-8 mb-8 bg-slate-900/80 border border-slate-700 shadow-lg">
          {/* Header - mobile friendly */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="p-2 bg-blue-600/20 border border-blue-500/40 rounded-xl shrink-0">
                <Video className="text-blue-400 h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Facebook In-Stream Ads Revenue Calculator
                </h1>
                <p className="text-[11px] sm:text-xs md:text-sm text-slate-300/80">
                  Enter your video views and audience to see a simple estimate of
                  your Facebook In-Stream Ads earnings.
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleAdvanced}
              className={`inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-all w-full sm:w-auto
                ${
                  advancedEnabled
                    ? "bg-slate-700 border-slate-500 text-white"
                    : "bg-slate-800 border-slate-600 text-slate-100"
                }`}
            >
              <Settings2 className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {advancedEnabled ? "Advanced: ON" : "Advanced Mode"}
              </span>
            </button>
          </div>

          {/* Two-column layout: on mobile -> single */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            {/* LEFT: INPUTS */}
            <div className="space-y-5">
              {/* Basic inputs */}
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-300" />
                  Basic Inputs
                </h2>

                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-medium text-slate-200">
                    Monthly Video Views (eligible for In-Stream)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={monthlyViews}
                    onChange={(e) =>
                      setMonthlyViews(Math.max(0, Number(e.target.value)))
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Views on videos where In-Stream Ads can run (3+ minute
                    videos, content-eligible).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-medium text-slate-200 flex items-center gap-1">
                    <Globe2 className="w-4 h-4 text-slate-300" />
                    Main Audience Country
                  </label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {COUNTRY_CPM.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Used to estimate your In-Stream Ads CPM range.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-medium text-slate-200 flex items-center gap-1">
                    Monetized Views %
                  </label>
                  <div className="flex flex-col xs:flex-row items-center gap-2 sm:gap-3">
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={1}
                      value={monetizedPercent}
                      onChange={(e) =>
                        setMonetizedPercent(Number(e.target.value))
                      }
                      className="w-full accent-blue-500"
                    />
                    <div className="w-full xs:w-16 text-right text-sm text-slate-100">
                      {monetizedPercent}%
                    </div>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Not every view shows an ad. Many creators see around 40–80%.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-medium text-slate-200 flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-slate-300" />
                    Creator Share %
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={creatorShare}
                    onChange={(e) =>
                      setCreatorShare(
                        Math.max(1, Math.min(100, Number(e.target.value)))
                      )
                    }
                    className="w-full sm:w-32 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Your share of ad revenue after Facebook&apos;s cut (often
                    around 55%).
                  </p>
                </div>
              </div>

              {/* Advanced panel */}
              {advLoading && (
                <div className="flex items-center gap-2 text-slate-200 text-[11px] sm:text-xs">
                  <div className="h-4 w-4 rounded-full border-2 border-slate-500 border-t-white animate-spin" />
                  <span>Loading advanced options…</span>
                </div>
              )}

              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  advancedEnabled ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="mt-4 border-t border-slate-700 pt-4 space-y-4">
                  <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-slate-300" />
                    Advanced Mode (optional)
                  </h2>

                  {/* Audience split */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <p className="text-[11px] sm:text-xs text-slate-300 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        Audience split by country
                      </p>
                      <button
                        onClick={handleAddRow}
                        className="text-[11px] sm:text-xs px-2 py-1 rounded-md bg-slate-800 border border-slate-600 text-slate-100 hover:bg-slate-700 w-full sm:w-auto text-center"
                      >
                        + Add country
                      </button>
                    </div>

                    <div className="space-y-2">
                      {audienceRows.map((row) => (
                        <div
                          key={row.id}
                          className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 text-[11px] sm:text-xs"
                        >
                          <select
                            value={row.countryCode}
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                "countryCode",
                                e.target.value
                              )
                            }
                            className="flex-1 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {COUNTRY_CPM.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={row.percent}
                              onChange={(e) =>
                                handleRowChange(
                                  row.id,
                                  "percent",
                                  e.target.value
                                )
                              }
                              className="w-20 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-white text-right"
                            />
                            <span className="text-slate-400">%</span>
                          </div>
                          {audienceRows.length > 1 && (
                            <button
                              onClick={() => handleRemoveRow(row.id)}
                              className="px-2 py-1 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 self-start xs:self-auto"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] sm:text-xs text-slate-400">
                      These percentages don&apos;t have to be perfect. We use
                      them as a rough split of your total monthly views.
                    </p>
                  </div>

                  {/* Extra income fields */}
                  <div className="space-y-3">
                    <p className="text-[11px] sm:text-xs text-slate-300">
                      Other monthly income related to your Facebook videos
                      (optional)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] sm:text-xs">
                      <div className="space-y-1">
                        <label className="block text-slate-400">
                          Other placements / formats ($/month)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={otherPlacementsMonthly}
                          onChange={(e) =>
                            setOtherPlacementsMonthly(
                              Math.max(0, Number(e.target.value))
                            )
                          }
                          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-400">
                          Brand deals / sponsorships ($/month)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={brandDealsMonthly}
                          onChange={(e) =>
                            setBrandDealsMonthly(
                              Math.max(0, Number(e.target.value))
                            )
                          }
                          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reset button */}
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-[11px] sm:text-xs text-slate-200 hover:bg-slate-700 w-full sm:w-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Reset to default values
              </button>
            </div>

            {/* RIGHT: RESULTS */}
            <div className="space-y-5">
              {/* Basic result card */}
              <div className="bg-slate-950/70 border border-slate-700 rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    Estimated In-Stream Ads Earnings
                  </h2>
                  <button
                    onClick={() => handleCopy("basic")}
                    className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-slate-800 text-[11px] sm:text-xs text-slate-100 hover:bg-slate-700 w-full sm:w-auto"
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

                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] sm:text-xs text-slate-400 mb-1">
                      Monthly earnings (approx.)
                    </p>
                    <p className="text-lg sm:text-xl font-semibold text-slate-50">
                      {basicResult
                        ? `${formatMoney(
                            basicResult.monthlyMin
                          )} – ${formatMoney(basicResult.monthlyMax)}`
                        : "$0 – $0"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] sm:text-xs text-slate-400 mb-1">
                      Yearly earnings (approx.)
                    </p>
                    <p className="text-base sm:text-lg font-semibold text-slate-100">
                      {basicResult
                        ? `${formatMoney(
                            basicResult.yearlyMin
                          )} – ${formatMoney(basicResult.yearlyMax)}`
                        : "$0 – $0"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] sm:text-xs">
                    <div>
                      <p className="text-slate-400 mb-1">
                        Effective RPM (per 1000 views)
                      </p>
                      <p className="text-slate-100">
                        {basicResult && basicResult.rpmMin !== null
                          ? `${formatMoney(
                              basicResult.rpmMin
                            )} – ${formatMoney(basicResult.rpmMax ?? 0)}`
                          : "$0 – $0"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-1">Monetized views</p>
                      <p className="text-slate-100">
                        {basicResult
                          ? basicResult.monetizedViews.toLocaleString()
                          : 0}
                      </p>
                    </div>
                  </div>

                  <p className="text-[10px] sm:text-[11px] text-slate-500 flex items-start gap-1">
                    <Info className="w-3.5 h-3.5 mt-0.5 text-slate-400" />
                    This is an estimate based on typical Facebook In-Stream Ads
                    CPM values for{" "}
                    <span className="font-medium ml-1">
                      {currentCountry.name}
                    </span>{" "}
                    and your inputs. Real payouts depend on eligibility, content
                    quality, advertiser demand and policy compliance.
                  </p>
                </div>
              </div>

              {/* Advanced result card */}
              <div className="bg-slate-950/70 border border-slate-700 rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-blue-400" />
                    Advanced Result (split + extras)
                  </h2>
                  <button
                    onClick={() => handleCopy("advanced")}
                    className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-slate-800 text-[11px] sm:text-xs text-slate-100 hover:bg-slate-700 w-full sm:w-auto"
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
                  <div className="space-y-3 text-[12px] sm:text-sm">
                    <div>
                      <p className="text-[11px] sm:text-xs text-slate-400 mb-1">
                        Monthly earnings (all sources)
                      </p>
                      <p className="text-base sm:text-lg font-semibold text-slate-50">
                        {formatMoney(
                          advancedResult.totalMonthlyMin
                        )}{" "}
                        –{" "}
                        {formatMoney(advancedResult.totalMonthlyMax)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] sm:text-xs text-slate-400 mb-1">
                        Yearly earnings (all sources)
                      </p>
                      <p className="text-sm sm:text-base font-semibold text-slate-100">
                        {formatMoney(
                          advancedResult.totalYearlyMin
                        )}{" "}
                        –{" "}
                        {formatMoney(advancedResult.totalYearlyMax)}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] sm:text-xs">
                      <div>
                        <p className="text-slate-400 mb-1">
                          In-Stream Ads only
                        </p>
                        <p className="text-slate-100">
                          {formatMoney(
                            advancedResult.adsMonthlyMin
                          )}{" "}
                          –{" "}
                          {formatMoney(
                            advancedResult.adsMonthlyMax
                          )}{" "}
                          / month
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 mb-1">
                          Other video-related income
                        </p>
                        <p className="text-slate-100">
                          {formatMoney(
                            advancedResult.extrasMonthly
                          )}{" "}
                          / month
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Turn on Advanced Mode to see a combined estimate using
                    multi-country audience split and extra video-related income.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <AdBanner />

        {/* Simple SEO text */}
        <div className="mb-10 space-y-2 sm:space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            How this Facebook In-Stream Ads Revenue Calculator works
          </h2>
          <p className="text-[13px] sm:text-sm text-slate-300 leading-relaxed">
            This calculator gives you a simple estimate of how much you might
            earn from Facebook In-Stream Ads. You enter your monthly video
            views, pick your main audience country, choose how many of those
            views are monetized, and the tool uses typical CPM ranges to show a
            monthly and yearly earnings range.
          </p>
          <p className="text-[13px] sm:text-sm text-slate-300 leading-relaxed">
            Use Normal Mode if most of your viewers are from one country and you
            just want a quick estimate. If your audience is spread across
            multiple countries or you also earn from other formats and brand
            deals, turn on Advanced Mode to get a more detailed picture of your
            potential revenue.
          </p>
        </div>

        <RelatedCalculators currentPath="/facebook-instream-ads-calculator" />
      </div>
    </>
  );
};

export default FacebookInstreamAdsCalculator;
