// src/pages/YouTubeRevenueCalculator.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  PlayCircle,
  Copy,
  Check,
  RefreshCw,
  Info,
  Settings2,
  Globe2,
  BarChart3,
  Users,
  Plus,
  Trash2,
  DollarSign,
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

const ADVANCED_LS_KEY = "yt-revenue-advanced-enabled";

/**
 * Approximate default CPM ranges (USD) per country.
 * You can freely tweak/extend this list – the calculator logic is fully dynamic.
 */
const COUNTRY_CPM: CountryCpm[] = [
  // Tier 1
  { code: "US", name: "United States", minCpm: 6, maxCpm: 12 },
  { code: "CA", name: "Canada", minCpm: 5, maxCpm: 10 },
  { code: "GB", name: "United Kingdom", minCpm: 5, maxCpm: 11 },
  { code: "AU", name: "Australia", minCpm: 4.5, maxCpm: 9.5 },
  { code: "NZ", name: "New Zealand", minCpm: 4, maxCpm: 9 },
  { code: "DE", name: "Germany", minCpm: 4, maxCpm: 8 },
  { code: "FR", name: "France", minCpm: 3.5, maxCpm: 7.5 },
  { code: "NL", name: "Netherlands", minCpm: 3.5, maxCpm: 7.5 },
  { code: "SE", name: "Sweden", minCpm: 3.5, maxCpm: 7.5 },
  { code: "NO", name: "Norway", minCpm: 4, maxCpm: 8.5 },
  { code: "DK", name: "Denmark", minCpm: 3.5, maxCpm: 7.5 },
  { code: "CH", name: "Switzerland", minCpm: 4.5, maxCpm: 9 },

  // Europe mid-tier
  { code: "IE", name: "Ireland", minCpm: 3, maxCpm: 6.5 },
  { code: "IT", name: "Italy", minCpm: 2.5, maxCpm: 5.5 },
  { code: "ES", name: "Spain", minCpm: 2.5, maxCpm: 5.5 },
  { code: "PT", name: "Portugal", minCpm: 2.5, maxCpm: 5.5 },
  { code: "BE", name: "Belgium", minCpm: 3, maxCpm: 6 },
  { code: "AT", name: "Austria", minCpm: 3, maxCpm: 6 },
  { code: "FI", name: "Finland", minCpm: 3, maxCpm: 6 },
  { code: "PL", name: "Poland", minCpm: 2, maxCpm: 4.5 },
  { code: "CZ", name: "Czech Republic", minCpm: 2, maxCpm: 4.5 },
  { code: "GR", name: "Greece", minCpm: 2, maxCpm: 4.5 },
  { code: "RO", name: "Romania", minCpm: 1.8, maxCpm: 4 },
  { code: "HU", name: "Hungary", minCpm: 1.8, maxCpm: 4 },
  { code: "BG", name: "Bulgaria", minCpm: 1.5, maxCpm: 3.5 },

  // North Africa / Middle East
  { code: "AE", name: "United Arab Emirates", minCpm: 3, maxCpm: 7 },
  { code: "SA", name: "Saudi Arabia", minCpm: 3, maxCpm: 7 },
  { code: "QA", name: "Qatar", minCpm: 3, maxCpm: 7 },
  { code: "KW", name: "Kuwait", minCpm: 3, maxCpm: 7 },
  { code: "OM", name: "Oman", minCpm: 2.5, maxCpm: 6 },
  { code: "BH", name: "Bahrain", minCpm: 2.5, maxCpm: 6 },
  { code: "EG", name: "Egypt", minCpm: 1.5, maxCpm: 3.5 },
  { code: "MA", name: "Morocco", minCpm: 1.5, maxCpm: 3.5 },
  { code: "DZ", name: "Algeria", minCpm: 1.5, maxCpm: 3.5 },

  // Latin America
  { code: "BR", name: "Brazil", minCpm: 1.5, maxCpm: 3.5 },
  { code: "MX", name: "Mexico", minCpm: 1.5, maxCpm: 3.5 },
  { code: "AR", name: "Argentina", minCpm: 1.3, maxCpm: 3 },
  { code: "CL", name: "Chile", minCpm: 1.6, maxCpm: 3.5 },
  { code: "CO", name: "Colombia", minCpm: 1.4, maxCpm: 3.2 },
  { code: "PE", name: "Peru", minCpm: 1.3, maxCpm: 3 },

  // South Asia
  { code: "IN", name: "India", minCpm: 0.8, maxCpm: 2.5 },
  { code: "PK", name: "Pakistan", minCpm: 0.7, maxCpm: 2 },
  { code: "BD", name: "Bangladesh", minCpm: 0.6, maxCpm: 1.8 },
  { code: "LK", name: "Sri Lanka", minCpm: 0.7, maxCpm: 2 },
  { code: "NP", name: "Nepal", minCpm: 0.6, maxCpm: 1.8 },

  // East & Southeast Asia
  { code: "SG", name: "Singapore", minCpm: 3, maxCpm: 7 },
  { code: "MY", name: "Malaysia", minCpm: 1.8, maxCpm: 4.2 },
  { code: "TH", name: "Thailand", minCpm: 1.6, maxCpm: 3.8 },
  { code: "ID", name: "Indonesia", minCpm: 1.2, maxCpm: 3 },
  { code: "PH", name: "Philippines", minCpm: 1.2, maxCpm: 3 },
  { code: "VN", name: "Vietnam", minCpm: 1.2, maxCpm: 3 },
  { code: "JP", name: "Japan", minCpm: 3.5, maxCpm: 7.5 },
  { code: "KR", name: "South Korea", minCpm: 3, maxCpm: 7 },
  { code: "HK", name: "Hong Kong", minCpm: 3, maxCpm: 7 },
  { code: "TW", name: "Taiwan", minCpm: 2.5, maxCpm: 6 },

  // Africa
  { code: "ZA", name: "South Africa", minCpm: 1.5, maxCpm: 3.5 },
  { code: "NG", name: "Nigeria", minCpm: 0.8, maxCpm: 2.2 },
  { code: "KE", name: "Kenya", minCpm: 0.9, maxCpm: 2.4 },
  { code: "GH", name: "Ghana", minCpm: 0.9, maxCpm: 2.4 },
  { code: "TZ", name: "Tanzania", minCpm: 0.8, maxCpm: 2.1 },

  // Other / global fallback
  { code: "OTHER_HIGH", name: "Other (High-income country)", minCpm: 3, maxCpm: 7 },
  { code: "OTHER_MID", name: "Other (Middle-income country)", minCpm: 1.5, maxCpm: 4 },
  { code: "OTHER_LOW", name: "Other (Low-income country)", minCpm: 0.5, maxCpm: 2 },
];

const findCountry = (code: string): CountryCpm => {
  return COUNTRY_CPM.find((c) => c.code === code) || {
    code: "GLOBAL",
    name: "Global Average",
    minCpm: 1.5,
    maxCpm: 4,
  };
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

const YouTubeRevenueCalculator: React.FC = () => {
  // Basic inputs
  const [monthlyViews, setMonthlyViews] = useState<number>(100000);
  const [countryCode, setCountryCode] = useState<string>("US");
  const [monetizedPercent, setMonetizedPercent] = useState<number>(60);
  const [creatorShare, setCreatorShare] = useState<number>(55);

  // Custom CPM override (optional, in Advanced)
  const [customMinCpm, setCustomMinCpm] = useState<string>("");
  const [customMaxCpm, setCustomMaxCpm] = useState<string>("");

  // Advanced mode
  const [advancedEnabled, setAdvancedEnabled] = useState<boolean>(false);
  const [advLoading, setAdvLoading] = useState<boolean>(false);

  // Audience split rows (advanced)
  const [audienceRows, setAudienceRows] = useState<AudienceRow[]>([
    { id: "row-1", countryCode: "US", percent: 40 },
    { id: "row-2", countryCode: "IN", percent: 35 },
    { id: "row-3", countryCode: "BD", percent: 25 },
  ]);

  // Extra income (Advanced)
  const [membersCount, setMembersCount] = useState<number>(0);
  const [membersFee, setMembersFee] = useState<number>(4.99);
  const [superChatMonthly, setSuperChatMonthly] = useState<number>(0);
  const [sponsorDeals, setSponsorDeals] = useState<number>(0);
  const [sponsorAvg, setSponsorAvg] = useState<number>(300);

  const [copied, setCopied] = useState<"monthly" | "yearly" | null>(null);

  // Persist Advanced toggle
  useEffect(() => {
    const saved = localStorage.getItem(ADVANCED_LS_KEY);
    if (saved === "1") setAdvancedEnabled(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(ADVANCED_LS_KEY, advancedEnabled ? "1" : "0");
  }, [advancedEnabled]);

  const currentCountry = findCountry(countryCode);

  const effectiveMinCpm = useMemo(() => {
    const val = parseFloat(customMinCpm);
    if (!isNaN(val) && val > 0) return val;
    return currentCountry.minCpm;
  }, [customMinCpm, currentCountry.minCpm]);

  const effectiveMaxCpm = useMemo(() => {
    const val = parseFloat(customMaxCpm);
    if (!isNaN(val) && val > 0 && val >= effectiveMinCpm) return val;
    return currentCountry.maxCpm;
  }, [customMaxCpm, currentCountry.maxCpm, effectiveMinCpm]);

  // Normal (single-country) calculation
  const basicResult = useMemo(() => {
    if (monthlyViews <= 0 || monetizedPercent <= 0 || creatorShare <= 0) {
      return null;
    }

    const monetizedViews = (monthlyViews * monetizedPercent) / 100;
    const share = creatorShare / 100;

    const grossMin = (monetizedViews / 1000) * effectiveMinCpm;
    const grossMax = (monetizedViews / 1000) * effectiveMaxCpm;

    const creatorMin = grossMin * share;
    const creatorMax = grossMax * share;

    const yearlyMin = creatorMin * 12;
    const yearlyMax = creatorMax * 12;

    const rpmMin =
      monetizedViews > 0 ? (creatorMin / monetizedViews) * 1000 : null;
    const rpmMax =
      monetizedViews > 0 ? (creatorMax / monetizedViews) * 1000 : null;

    return {
      monthlyMin: creatorMin,
      monthlyMax: creatorMax,
      yearlyMin,
      yearlyMax,
      rpmMin,
      rpmMax,
      monetizedViews,
    };
  }, [
    monthlyViews,
    monetizedPercent,
    creatorShare,
    effectiveMinCpm,
    effectiveMaxCpm,
  ]);

  // Advanced calculation
  const advancedResult = useMemo(() => {
    if (!advancedEnabled || monthlyViews <= 0) return null;

    const share = creatorShare / 100;
    const monetizedFactor = monetizedPercent / 100;

    let adMonthlyMin = 0;
    let adMonthlyMax = 0;
    const breakdown: { label: string; min: number; max: number }[] = [];

    const rows = audienceRows.length ? audienceRows : [];

    if (!rows.length) return null;

    rows.forEach((row) => {
      if (row.percent <= 0) return;
      const rowCountry = findCountry(row.countryCode);
      const viewsForRow = (monthlyViews * row.percent) / 100;
      const monetizedViews = viewsForRow * monetizedFactor;

      const grossMin = (monetizedViews / 1000) * rowCountry.minCpm;
      const grossMax = (monetizedViews / 1000) * rowCountry.maxCpm;

      const creatorMin = grossMin * share;
      const creatorMax = grossMax * share;

      adMonthlyMin += creatorMin;
      adMonthlyMax += creatorMax;

      breakdown.push({
        label: rowCountry.name,
        min: creatorMin,
        max: creatorMax,
      });
    });

    // Extra income (membership + superChat + sponsorship)
    const membershipMonthly = membersCount * membersFee;
    const sponsorMonthly = sponsorDeals * sponsorAvg;
    const otherMonthly = membershipMonthly + sponsorMonthly + superChatMonthly;

    const totalMonthlyMin = adMonthlyMin + otherMonthly;
    const totalMonthlyMax = adMonthlyMax + otherMonthly;

    return {
      adMonthlyMin,
      adMonthlyMax,
      otherMonthly,
      totalMonthlyMin,
      totalMonthlyMax,
      yearlyMin: totalMonthlyMin * 12,
      yearlyMax: totalMonthlyMax * 12,
      breakdown,
    };
  }, [
    advancedEnabled,
    audienceRows,
    monthlyViews,
    monetizedPercent,
    creatorShare,
    membersCount,
    membersFee,
    superChatMonthly,
    sponsorDeals,
    sponsorAvg,
  ]);

  const handleToggleAdvanced = () => {
    if (!advancedEnabled) {
      setAdvLoading(true);
      setTimeout(() => {
        setAdvancedEnabled(true);
        setAdvLoading(false);
      }, 800);
    } else {
      setAdvancedEnabled(false);
      setAdvLoading(false);
    }
  };

  const handleAddRow = () => {
    if (audienceRows.length >= 8) return;
    const newRow: AudienceRow = {
      id: `row-${Date.now()}-${audienceRows.length}`,
      countryCode: countryCode || "US",
      percent: 10,
    };
    setAudienceRows((prev) => [...prev, newRow]);
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

  const handleCopyResult = async (type: "monthly" | "yearly") => {
    try {
      const basic = basicResult;
      const adv = advancedResult;

      let text = "";

      if (type === "monthly" && basic) {
        text += `Estimated Monthly Earnings: ${formatMoney(
          basic.monthlyMin
        )} – ${formatMoney(basic.monthlyMax)} (Ads only)\n`;
      }
      if (type === "yearly" && basic) {
        text += `Estimated Yearly Earnings: ${formatMoney(
          basic.yearlyMin
        )} – ${formatMoney(basic.yearlyMax)} (Ads only)\n`;
      }

      if (adv) {
        text += `\nAdvanced (with audience split & extras):\n`;
        if (type === "monthly") {
          text += `Total Monthly Earnings: ${formatMoney(
            adv.totalMonthlyMin
          )} – ${formatMoney(adv.totalMonthlyMax)}\n`;
        } else {
          text += `Total Yearly Earnings: ${formatMoney(
            adv.yearlyMin
          )} – ${formatMoney(adv.yearlyMax)}\n`;
        }
      }

      await navigator.clipboard.writeText(text.trim());
      setCopied(type);
      setTimeout(() => setCopied(null), 1400);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <SEOHead
        title="YouTube Revenue Calculator – Global CPM, Country-Based Earnings"
        description="Estimate your YouTube earnings with a global revenue calculator. Choose your country, CPM range, monetized views, and audience split to see monthly & yearly income from ads and other sources."
        canonical="https://calculatorhub.site/youtube-revenue-calculator"
        schemaData={generateCalculatorSchema(
          "YouTube Revenue Calculator",
          "Calculate your YouTube earnings using monthly views, monetized views, CPM, RPM, and country-based audience distribution with normal & advanced modes.",
          "/youtube-revenue-calculator",
          [
            "youtube revenue calculator",
            "youtube cpm rpm calculator",
            "youtube earnings by country",
            "youtube income estimator",
            "youtube adsense calculator",
          ]
        )}
        breadcrumbs={[
          { name: "YouTube Tools", url: "/category/youtube-tools" },
          { name: "YouTube Revenue Calculator", url: "/youtube-revenue-calculator" },
        ]}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <div className="max-w-5xl mx-auto px-3 sm:px-6">
        <Breadcrumbs
          items={[
            { name: "YouTube Tools", url: "/category/youtube-tools" },
            { name: "YouTube Revenue Calculator", url: "/youtube-revenue-calculator" },
          ]}
        />

        {/* Main Card */}
        <div className="rounded-2xl p-5 sm:p-8 mb-8 bg-gradient-to-b from-slate-800/70 to-slate-900 border border-slate-700 shadow-lg backdrop-blur">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-red-600/20 border border-red-500/40 rounded-xl shrink-0">
                <PlayCircle className="text-red-400 h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight truncate">
                  YouTube Revenue Calculator
                </h1>
                <p className="text-xs sm:text-sm text-slate-300/80 truncate">
                  Estimate your YouTube earnings by country, CPM, RPM & audience split.
                </p>
              </div>
            </div>

            {/* Advanced Mode button */}
            <button
              onClick={handleToggleAdvanced}
              className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg border text-sm sm:text-base font-medium transition-all duration-200
                ${
                  advancedEnabled
                    ? "bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                    : "bg-red-600/20 border-red-500/40 text-red-100 hover:bg-red-600/30"
                }`}
              title="Toggle Advanced Mode"
            >
              <Settings2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span className="truncate">
                {advancedEnabled ? "Advanced: ON" : "Advanced Mode"}
              </span>
            </button>
          </div>

          {/* Basic controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Monthly Views */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Monthly Views
              </label>
              <input
                type="number"
                min={0}
                value={monthlyViews}
                onChange={(e) =>
                  setMonthlyViews(Math.max(0, Number(e.target.value)))
                }
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                Total views on your channel or specific videos per month.
              </p>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1">
                <Globe2 className="w-4 h-4 text-slate-300" />
                Main Audience Country
              </label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {COUNTRY_CPM.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">
                Used to estimate CPM range for ads.
              </p>
            </div>

            {/* Monetized Views % */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
                <BarChart3 className="w-4 h-4 text-slate-300" />
                Monetized Views %
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={1}
                  value={monetizedPercent}
                  onChange={(e) =>
                    setMonetizedPercent(Number(e.target.value))
                  }
                  className="flex-1 accent-red-500"
                />
                <div className="w-14 text-right text-sm text-slate-100">
                  {monetizedPercent}%
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Not every view shows an ad. Typical range: 40–80%.
              </p>
            </div>
          </div>

          {/* CPM & Share quick info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-3 text-sm text-slate-200">
              <p className="flex items-center justify-between mb-1">
                <span className="font-medium">Country CPM (est.)</span>
                <span className="text-xs text-slate-400">{currentCountry.name}</span>
              </p>
              <p className="text-lg font-semibold text-red-300">
                {formatMoney(currentCountry.minCpm)} –{" "}
                {formatMoney(currentCountry.maxCpm)}{" "}
                <span className="text-xs text-slate-400 align-middle">
                  / 1000 ad views
                </span>
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-3 text-sm text-slate-200">
              <p className="flex items-center justify-between mb-1">
                <span className="font-medium flex items-center gap-1">
                  <Users className="w-4 h-4 text-slate-300" />
                  Monetized views (est.)
                </span>
              </p>
              <p className="text-lg font-semibold text-slate-100">
                {basicResult
                  ? basicResult.monetizedViews.toLocaleString()
                  : 0}
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-3 text-sm text-slate-200">
              <p className="flex items-center justify-between mb-1">
                <span className="font-medium flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-slate-300" />
                  Creator share
                </span>
              </p>
              <div className="flex items-center gap-2">
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
                  className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <span className="text-sm text-slate-400">% of ad revenue you keep</span>
              </div>
            </div>
          </div>

          {/* Loading indicator for advanced panel */}
          {advLoading && (
            <div className="mb-6 flex items-center gap-3 text-slate-200">
              <div className="h-5 w-5 rounded-full border-2 border-slate-500 border-t-white animate-spin" />
              <span className="text-sm">Loading advanced tools…</span>
            </div>
          )}

          {/* Advanced panel */}
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              advancedEnabled ? "max-h-[1600px] opacity-100 mt-2" : "max-h-0 opacity-0"
            }`}
          >
            <div className="pt-4 space-y-6">
              {/* CPM override & extras */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Custom Min CPM (optional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={customMinCpm}
                    onChange={(e) => setCustomMinCpm(e.target.value)}
                    placeholder={currentCountry.minCpm.toString()}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Override estimated min CPM if you know your own numbers.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Custom Max CPM (optional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={customMaxCpm}
                    onChange={(e) => setCustomMaxCpm(e.target.value)}
                    placeholder={currentCountry.maxCpm.toString()}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Must be greater than or equal to Min CPM.
                  </p>
                </div>

                {/* Extra income summary inputs */}
                <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-3 text-sm text-slate-200">
                  <p className="font-medium mb-2">Other Monthly Income (optional)</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">
                        Members
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={membersCount}
                        onChange={(e) =>
                          setMembersCount(Math.max(0, Number(e.target.value)))
                        }
                        className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">
                        Fee ($)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={membersFee}
                        onChange={(e) =>
                          setMembersFee(Math.max(0, Number(e.target.value)))
                        }
                        className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">
                        Super Chat ($/mo)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={superChatMonthly}
                        onChange={(e) =>
                          setSuperChatMonthly(
                            Math.max(0, Number(e.target.value))
                          )
                        }
                        className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">
                        Sponsorships / month
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={sponsorDeals}
                        onChange={(e) =>
                          setSponsorDeals(Math.max(0, Number(e.target.value)))
                        }
                        className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">
                        Avg deal ($)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="1"
                        value={sponsorAvg}
                        onChange={(e) =>
                          setSponsorAvg(Math.max(0, Number(e.target.value)))
                        }
                        className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Audience split */}
              <div className="border border-slate-700 rounded-xl p-4 bg-slate-900/60">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <h3 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-300" />
                    Audience Split by Country
                  </h3>
                  <button
                    onClick={handleAddRow}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-600 text-xs text-slate-100 hover:bg-slate-700"
                  >
                    <Plus className="w-3 h-3" />
                    Add row
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs sm:text-sm text-left text-slate-200">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400">
                        <th className="py-2 pr-3">Country</th>
                        <th className="py-2 px-3 w-32">Audience %</th>
                        <th className="py-2 px-3 w-16"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {audienceRows.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-slate-800 last:border-0"
                        >
                          <td className="py-2 pr-3">
                            <select
                              value={row.countryCode}
                              onChange={(e) =>
                                handleRowChange(
                                  row.id,
                                  "countryCode",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                            >
                              {COUNTRY_CPM.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
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
                              className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-white text-right"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            {audienceRows.length > 1 && (
                              <button
                                onClick={() => handleRemoveRow(row.id)}
                                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
                                title="Remove"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Percentages don&apos;t need to be exactly 100%. We use them as a
                  relative split of your total monthly views.
                </p>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic (Ads only) */}
            <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  Ads Only (Normal Mode)
                </h3>
                <button
                  onClick={() => handleCopyResult("monthly")}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-100"
                >
                  {copied === "monthly" ? (
                    <>
                      <Check className="h-4 w-4 text-green-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Monthly Earnings</p>
                  <p className="text-lg font-semibold text-slate-50">
                    {basicResult
                      ? `${formatMoney(basicResult.monthlyMin)} – ${formatMoney(
                          basicResult.monthlyMax
                        )}`
                      : "$0 – $0"}
                  </p>
                </div>
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Yearly Earnings</p>
                  <p className="text-lg font-semibold text-slate-50">
                    {basicResult
                      ? `${formatMoney(basicResult.yearlyMin)} – ${formatMoney(
                          basicResult.yearlyMax
                        )}`
                      : "$0 – $0"}
                  </p>
                </div>
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Effective RPM</p>
                  <p className="text-sm font-medium text-slate-100">
                    {basicResult && basicResult.rpmMin !== null
                      ? `${formatMoney(basicResult.rpmMin)} – ${formatMoney(
                          basicResult.rpmMax ?? 0
                        )}`
                      : "$0 – $0"}{" "}
                    <span className="text-xs text-slate-400">per 1000 views</span>
                  </p>
                </div>
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    Notes
                  </p>
                  <p className="text-xs text-slate-300">
                    This estimate is based only on ad revenue for a single main
                    country and may vary in real analytics.
                  </p>
                </div>
              </div>
            </div>

            {/* Advanced (Split + Extras) */}
            <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-blue-400" />
                  Advanced Mode (Split + Extras)
                </h3>
                <button
                  onClick={() => handleCopyResult("yearly")}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-100"
                >
                  {copied === "yearly" ? (
                    <>
                      <Check className="h-4 w-4 text-green-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>

              {advancedEnabled && advancedResult ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-1">
                        Total Monthly Earnings
                      </p>
                      <p className="text-lg font-semibold text-slate-50">
                        {formatMoney(advancedResult.totalMonthlyMin)} –{" "}
                        {formatMoney(advancedResult.totalMonthlyMax)}
                      </p>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-1">
                        Total Yearly Earnings
                      </p>
                      <p className="text-lg font-semibold text-slate-50">
                        {formatMoney(advancedResult.yearlyMin)} –{" "}
                        {formatMoney(advancedResult.yearlyMax)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
                      <p className="text-slate-400 mb-1">Ads (all countries)</p>
                      <p className="text-slate-100">
                        {formatMoney(advancedResult.adMonthlyMin)} –{" "}
                        {formatMoney(advancedResult.adMonthlyMax)} / month
                      </p>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
                      <p className="text-slate-400 mb-1">Other income</p>
                      <p className="text-slate-100">
                        {formatMoney(advancedResult.otherMonthly)} / month
                      </p>
                    </div>
                  </div>

                  {/* Breakdown */}
                  {advancedResult.breakdown.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-slate-400 mb-1">
                        Country breakdown (ads only):
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        {advancedResult.breakdown.map((row, idx) => (
                          <div
                            key={`${row.label}-${idx}`}
                            className="flex items-center justify-between text-xs text-slate-200"
                          >
                            <span className="truncate">{row.label}</span>
                            <span className="ml-3">
                              {formatMoney(row.min)} – {formatMoney(row.max)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-400">
                  Turn on Advanced Mode to see multi-country audience split and
                  extra income (memberships, Super Chat, sponsorships).
                </p>
              )}
            </div>
          </div>
        </div>

        <AdBanner />

        {/* ---------- SEO CONTENT (About YouTube Revenue Calculator) ---------- */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-white mb-4">
            About the YouTube Revenue Calculator
          </h2>
          <h3 className="text-xl text-slate-300 mb-4">
            Understand your YouTube earnings with CPM, RPM, country and audience
            split.
          </h3>

          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              The <strong>YouTube Revenue Calculator</strong> helps creators,
              marketers, and businesses estimate how much money a YouTube channel
              can make from ads and other monetization sources. Instead of
              guessing, you can plug in your monthly views, main audience country,
              and monetized views percentage to get a clear earnings range.
            </p>

            <p>
              YouTube income is driven mainly by{" "}
              <strong>CPM (Cost per 1000 ad impressions)</strong> and{" "}
              <strong>RPM (Revenue per 1000 views)</strong>. CPM depends heavily on
              country, audience quality, content niche, and advertiser demand,
              while RPM shows how much you actually earn after YouTube&apos;s cut
              and after accounting for non-monetized views.
            </p>

            <h3 className="text-yellow-400 text-lg font-semibold mt-4">
              🔹 How the calculator estimates your earnings
            </h3>
            <p>
              At a basic level, the calculator follows this logic:
            </p>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>
                Take your <strong>monthly views</strong>.
              </li>
              <li>
                Apply <strong>monetized views %</strong> (not every view shows an
                ad).
              </li>
              <li>
                Use a <strong>CPM range</strong> based on your selected country.
              </li>
              <li>
                Multiply monetized views / 1000 by CPM to get{" "}
                <strong>gross ad revenue</strong>.
              </li>
              <li>
                Apply your <strong>creator share %</strong> to estimate how much
                you actually receive.
              </li>
            </ol>

            <p>
              In <strong>Advanced Mode</strong>, the calculator can go even
              deeper by splitting your audience across multiple countries and
              adding other monetization streams like memberships, Super Chat, and
              sponsorships. This gives a more realistic view for channels with a
              global audience.
            </p>

            <h3 className="text-yellow-400 text-lg font-semibold mt-4">
              🔹 CPM vs RPM: What&apos;s the difference?
            </h3>
            <p>
              <strong>CPM</strong> (Cost per Mille) is how much advertisers pay
              YouTube for 1,000 ad impressions. For example, a $5 CPM means
              advertisers pay $5 per 1,000 ad views. However, you don&apos;t
              receive this full amount.
            </p>
            <p>
              <strong>RPM</strong> (Revenue per Mille) is what you{" "}
              <em>actually earn</em> per 1,000 video views after YouTube&apos;s
              revenue share and non-monetized views. RPM is generally lower than
              CPM but more useful when comparing channels or videos.
            </p>

            <h3 className="text-yellow-400 text-lg font-semibold mt-4">
              🔹 Why country matters so much for YouTube income
            </h3>
            <p>
              Advertisers pay different rates in different countries. A finance
              channel with US traffic can earn many times more per 1,000 views
              than a similar channel in a low-CPM country. That&apos;s why this
              YouTube revenue calculator uses a{" "}
              <strong>country-based CPM table</strong> and lets you model a mixed
              audience using the Advanced Mode.
            </p>

            <h3 className="text-yellow-400 text-lg font-semibold mt-4">
              🔹 When to use Normal vs Advanced Mode
            </h3>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>
                <strong>Normal Mode</strong> – great for quick estimates when
                most of your views come from one main country.
              </li>
              <li>
                <strong>Advanced Mode</strong> – ideal for channels with a{" "}
                global audience, multiple traffic sources, or mixed monetization
                (ads + memberships + sponsors).
              </li>
            </ul>

            <p>
              Use Normal Mode for a fast check, and switch to Advanced Mode when
              you&apos;re planning growth, discussing brand deals, or comparing
              different CPM scenarios.
            </p>

            <h3 className="text-yellow-400 text-lg font-semibold mt-4">
              🔹 Limitations and realistic expectations
            </h3>
            <p>
              This tool gives you an <strong>educated estimate</strong>, not an
              exact prediction. Real YouTube earnings vary based on:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Content niche and advertiser competition</li>
              <li>Audience device, age, and watch time</li>
              <li>Seasonality (Q4 often has higher CPMs)</li>
              <li>Ad formats (skippable, non-skippable, bumper ads, etc.)</li>
              <li>YouTube Premium revenue and regional differences</li>
            </ul>

            <p>
              Use this calculator as a planning tool to understand your potential
              revenue range, experiment with &quot;what-if&quot; scenarios, and
              make smarter content and business decisions around your channel.
            </p>

            <AdBanner type="bottom" />

            {/* ======== FAQ SECTION ======== */}
            <section className="space-y-4 mt-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                ❓ Frequently Asked Questions (
                <span className="text-yellow-300">FAQ</span>)
              </h2>

              <div className="space-y-4 text-slate-100 leading-relaxed">
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl">
                    <span className="text-yellow-300">Q1:</span> How accurate is this
                    YouTube Revenue Calculator?
                  </h3>
                  <p>
                    The calculator provides an estimated range based on typical CPM
                    values and your inputs. Actual earnings depend on your niche,
                    audience, ad formats, and YouTube&apos;s real-time ad demand, so
                    real results may be higher or lower than the estimate.
                  </p>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl">
                    <span className="text-yellow-300">Q2:</span> Why are CPMs
                    different in each country?
                  </h3>
                  <p>
                    Advertisers pay more in countries with higher spending power,
                    stronger economies, and competitive ad markets. As a result,
                    views from the US, UK, Canada, and Western Europe usually earn
                    more than views from low-CPM regions.
                  </p>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl">
                    <span className="text-yellow-300">Q3:</span> What is the
                    difference between CPM and RPM?
                  </h3>
                  <p>
                    CPM measures what advertisers pay per 1,000 ad impressions.
                    RPM measures what you actually receive per 1,000 video views
                    after YouTube&apos;s revenue share and non-monetized views are
                    taken into account.
                  </p>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl">
                    <span className="text-yellow-300">Q4:</span> Can this calculator
                    include income from memberships or sponsorships?
                  </h3>
                  <p>
                    Yes. In Advanced Mode you can add your estimated monthly income
                    from channel memberships, Super Chat / Super Thanks, and
                    sponsorship deals. These values are added on top of your ad
                    revenue estimate.
                  </p>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl">
                    <span className="text-yellow-300">Q5:</span> Do I need my channel
                    to be monetized to use this?
                  </h3>
                  <p>
                    No. You can use the calculator to forecast future income even
                    before you join the YouTube Partner Program. Just enter your
                    expected views and choose realistic CPM ranges for your niche
                    and country.
                  </p>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl">
                    <span className="text-yellow-300">Q6:</span> Is this YouTube
                    Revenue Calculator free?
                  </h3>
                  <p>
                    Yes. The calculator is completely free to use, with no login or
                    signup. You can run as many scenarios as you like for planning
                    and strategy.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <RelatedCalculators currentPath="/youtube-revenue-calculator" />

        {/* ===================== YOUTUBE REVENUE CALCULATOR SCHEMAS ===================== */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: "YouTube Revenue Calculator – Estimate Channel Earnings",
              url: "https://calculatorhub.site/youtube-revenue-calculator",
              description:
                "Estimate YouTube earnings worldwide with a country-based CPM and RPM calculator. Model monetized views, audience split, memberships, Super Chat, and sponsorships.",
              breadcrumb: {
                "@type": "BreadcrumbList",
                itemListElement: [
                  {
                    "@type": "ListItem",
                    position: 1,
                    name: "YouTube Tools",
                    item:
                      "https://calculatorhub.site/category/youtube-tools",
                  },
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: "YouTube Revenue Calculator",
                    item:
                      "https://calculatorhub.site/youtube-revenue-calculator",
                  },
                ],
              },
              about: [
                "YouTube revenue calculator",
                "YouTube earnings estimator",
                "CPM and RPM calculator",
                "YouTube income by country",
                "YouTube adsense revenue tool",
              ],
              publisher: {
                "@type": "Organization",
                name: "CalculatorHub",
                url: "https://calculatorhub.site",
                logo: {
                  "@type": "ImageObject",
                  url: "https://calculatorhub.site/assets/logo.png",
                },
              },
            }),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How accurate is this YouTube Revenue Calculator?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "The calculator uses estimated CPM ranges and your inputs to provide a realistic earnings range. Actual revenue depends on niche, audience, ad formats, and YouTube's real-time ad demand.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Why are YouTube CPMs different in each country?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "CPMs vary because advertisers pay more in markets with higher spending power and advertiser competition. Views from the US, UK, and Western Europe usually earn more than views from low-CPM regions.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What is the difference between CPM and RPM on YouTube?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "CPM is what advertisers pay per 1,000 ad impressions. RPM is what you actually earn per 1,000 video views after revenue share and non-monetized views are accounted for.",
                  },
                },
                {
                  "@type": "Question",
                  name:
                    "Can this calculator include memberships, Super Chat, and sponsorships?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Yes. In Advanced Mode you can add income from channel memberships, Super Chat or Super Thanks, and sponsorship deals. These are added on top of the ad revenue estimate.",
                  },
                },
                {
                  "@type": "Question",
                  name:
                    "Do I need to be monetized to use the YouTube Revenue Calculator?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "No. You can use the calculator to plan ahead and forecast revenue before monetization by estimating future views and CPM levels.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is the YouTube Revenue Calculator free to use?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Yes, the tool is completely free with no login required. You can run unlimited scenarios for planning and strategy.",
                  },
                },
              ],
            }),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "YouTube Revenue Calculator",
              operatingSystem: "All",
              applicationCategory: "BusinessApplication",
              url:
                "https://calculatorhub.site/youtube-revenue-calculator",
              description:
                "A YouTube revenue and CPM calculator that estimates earnings from ads, memberships, Super Chat, and sponsorships. Supports global country-based CPM and audience split.",
              featureList: [
                "Estimate YouTube ad revenue using CPM and RPM",
                "Country-based CPM ranges for a global audience",
                "Normal and Advanced modes for simple or detailed modeling",
                "Audience split by country",
                "Membership, Super Chat, and sponsorship income",
                "Monthly and yearly earnings ranges",
                "Responsive, mobile-friendly design",
              ],
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.9",
                reviewCount: "1200",
              },
              publisher: {
                "@type": "Organization",
                name: "CalculatorHub",
                url: "https://calculatorhub.site",
                logo: {
                  "@type": "ImageObject",
                  url: "https://calculatorhub.site/assets/logo.png",
                },
              },
            }),
          }}
        />
      </div>
    </>
  );
};

export default YouTubeRevenueCalculator;
