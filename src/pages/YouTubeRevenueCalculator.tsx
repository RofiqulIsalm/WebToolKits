// src/pages/YouTubeRevenueCalculator.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  PlayCircle,
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

import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import { generateCalculatorSchema } from "../utils/seoData";


const AdBanner = React.lazy(() => import("../components/AdBanner"));
const RelatedCalculators = React.lazy(
  () => import("../components/RelatedCalculators")
);

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

const ADVANCED_LS_KEY = "yt-revenue-advanced-simple";

/**
 * Approximate default CPM ranges (USD) per country.
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

  // Generic / fallback
  { code: "OTHER_HIGH", name: "Other (High-income country)", minCpm: 3, maxCpm: 7 },
  { code: "OTHER_MID", name: "Other (Middle-income country)", minCpm: 1.5, maxCpm: 4 },
  { code: "OTHER_LOW", name: "Other (Low-income country)", minCpm: 0.5, maxCpm: 2 },
];

const findCountry = (code: string): CountryCpm => {
  return (
    COUNTRY_CPM.find((c) => c.code === code) || {
      code: "GLOBAL",
      name: "Global Average",
      minCpm: 1.5,
      maxCpm: 4,
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

const YouTubeRevenueCalculator: React.FC = () => {
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

  const [membersMonthly, setMembersMonthly] = useState<number>(0);
  const [superChatMonthly, setSuperChatMonthly] = useState<number>(0);
  const [sponsorsMonthly, setSponsorsMonthly] = useState<number>(0);

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

  // Basic calculation (single country, ads only)
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

    const extras =
      (membersMonthly || 0) +
      (superChatMonthly || 0) +
      (sponsorsMonthly || 0);

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
    membersMonthly,
    superChatMonthly,
    sponsorsMonthly,
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
        text += `YouTube Revenue (Ads only):\n`;
        text += `Monthly: ${formatMoney(
          basicResult.monthlyMin
        )} – ${formatMoney(basicResult.monthlyMax)}\n`;
        text += `Yearly: ${formatMoney(
          basicResult.yearlyMin
        )} – ${formatMoney(basicResult.yearlyMax)}\n`;
      }

      if (type === "advanced" && advancedResult) {
        text += `YouTube Revenue (Advanced):\n`;
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
    setMembersMonthly(0);
    setSuperChatMonthly(0);
    setSponsorsMonthly(0);
  };

  return (
    <>
      <SEOHead
          title="YouTube Revenue Calculator (2025–2026) – Simple Earnings & RPM Estimator"
          description="Estimate YouTube revenue with a simple, mobile-friendly calculator. Enter monthly views, choose main audience country, set monetized view % and creator share, and get instant monthly and yearly earnings ranges in Normal or Advanced Mode."
          keywords={[
            "simple youtube revenue calculator",
            "youtube earnings calculator",
            "youtube cpm rpm calculator",
            "youtube income estimator tool",
            "youtube revenue by country",
            "youtube monetized views estimator",
            "youtube creator revenue calculator",
            "youtube adsense earnings estimator",
            "youtube channel income calculator",
            "youtube advanced revenue calculator"
          ]}
          canonical="https://calculatorhub.site/youtube-revenue-calculator"
          schemaData={[
            /* 1) WebPage + embedded Article */
            {
              "@context": "https://schema.org",
              "@type": "WebPage",
              "@id": "https://calculatorhub.site/youtube-revenue-calculator#webpage",
              "url": "https://calculatorhub.site/youtube-revenue-calculator",
              "name": "YouTube Revenue Calculator – Simple Earnings & RPM Estimator",
              "headline": "YouTube Revenue Calculator – Simple Earnings & RPM Estimator",
              "description": "Free YouTube revenue calculator for estimating monthly and yearly income using views, monetized view %, CPM/RPM and creator share. Includes Advanced Mode with multi-country audience split and extra income.",
              "inLanguage": "en",
              "isPartOf": { "@id": "https://calculatorhub.site/#website" },
              "primaryImageOfPage": {
                "@type": "ImageObject",
                "@id": "https://calculatorhub.site/images/youtube_revenue_calculator.webp#primaryimg",
                "url": "https://calculatorhub.site/images/youtube_revenue_calculator.webp",
                "width": 1200,
                "height": 675
              },
              "mainEntity": {
                "@type": "Article",
                "@id": "https://calculatorhub.site/youtube-revenue-calculator#article",
                "headline": "YouTube Revenue Calculator — Estimate Channel Earnings by Views & Country",
                "description": "Interactive YouTube earnings estimator that converts monthly views, monetized view %, CPM ranges and creator share into a clear revenue range. Advanced Mode supports audience split by country plus memberships, Super Chat and sponsorships.",
                "image": [
                  "https://calculatorhub.site/images/youtube_revenue_calculator.webp"
                ],
                "author": {
                  "@type": "Organization",
                  "name": "CalculatorHub",
                  "url": "https://calculatorhub.site"
                },
                "publisher": { "@id": "https://calculatorhub.site/#organization" },
                "datePublished": "2025-11-15",
                "dateModified": "2025-11-15",
                "mainEntityOfPage": {
                  "@id": "https://calculatorhub.site/youtube-revenue-calculator#webpage"
                },
                "articleSection": [
                  "How the YouTube calculator works",
                  "Monthly views, CPM and monetized views",
                  "RPM and creator share",
                  "Advanced Mode and country split",
                  "Extra income (memberships, Super Chat, sponsors)",
                  "FAQ"
                ]
              }
            },
        
            /* 2) Breadcrumbs */
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "@id": "https://calculatorhub.site/youtube-revenue-calculator#breadcrumbs",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://calculatorhub.site/"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Misc Tools",
                  "item": "https://calculatorhub.site/category/misc-tools"
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": "YouTube Revenue Calculator",
                  "item": "https://calculatorhub.site/youtube-revenue-calculator"
                }
              ]
            },
        
            /* 3) FAQ (mirror with a small on-page FAQ section later if you want rich results) */
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "@id": "https://calculatorhub.site/youtube-revenue-calculator#faq",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What does the YouTube Revenue Calculator estimate?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The YouTube Revenue Calculator estimates your monthly and yearly earnings based on total monthly views, the percentage of monetized views, average CPM for your main audience country and your creator revenue share. In Advanced Mode it also adds extra income such as memberships, Super Chat and sponsorships."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What is the difference between CPM and RPM on YouTube?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "CPM usually refers to the cost per 1,000 ad impressions, while RPM represents revenue per 1,000 views on your channel after YouTube’s share is removed. The calculator works from CPM ranges by country and then converts everything into an effective RPM so you see how much you earn for each 1,000 views."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Why does the calculator show a range instead of a single number?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "YouTube earnings change over time due to seasonality, advertiser demand, audience behavior and video topics. The calculator uses a CPM range for each country to provide a realistic minimum–maximum estimate instead of a misleading single figure."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I model a multi-country audience and extra income streams?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Advanced Mode lets you split your views across multiple countries with different CPM ranges and add extra monthly income from channel memberships, Super Chat or Thanks, and sponsorship deals. The tool then combines everything into a single monthly and yearly earnings range."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is this YouTube Revenue Calculator free to use?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The YouTube Revenue Calculator on CalculatorHub is completely free to use, works on mobile and desktop, and does not require login or channel connection."
                  }
                }
              ]
            },
        
            /* 4) WebApplication */
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "@id": "https://calculatorhub.site/youtube-revenue-calculator#webapp",
              "name": "YouTube Revenue Calculator",
              "url": "https://calculatorhub.site/youtube-revenue-calculator",
              "applicationCategory": "FinanceApplication",
              "operatingSystem": "Web",
              "description": "Interactive YouTube earnings estimator that converts views, monetized view %, CPM by country and creator share into monthly and yearly revenue ranges with an optional Advanced Mode.",
              "publisher": { "@id": "https://calculatorhub.site/#organization" },
              "image": [
                "https://calculatorhub.site/images/youtube_revenue_calculator.webp"
              ],
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            },
        
            /* 5) SoftwareApplication */
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "@id": "https://calculatorhub.site/youtube-revenue-calculator#software",
              "name": "YouTube Earnings & RPM Estimator",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "All",
              "url": "https://calculatorhub.site/youtube-revenue-calculator",
              "publisher": { "@id": "https://calculatorhub.site/#organization" },
              "description": "Simple yet advanced YouTube earnings calculator for creators. Estimate ads revenue, RPM and extra income using traffic and monetization inputs."
            },
        
            /* 6) WebSite */
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": "https://calculatorhub.site/#website",
              "url": "https://calculatorhub.site",
              "name": "CalculatorHub",
              "publisher": { "@id": "https://calculatorhub.site/#organization" },
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://calculatorhub.site/search?q={query}",
                "query-input": "required name=query"
              }
            },
        
            /* 7) Organization */
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": "https://calculatorhub.site/#organization",
              "name": "CalculatorHub",
              "url": "https://calculatorhub.site",
              "logo": {
                "@type": "ImageObject",
                "url": "https://calculatorhub.site/images/logo.png"
              }
            }
          ]}
          breadcrumbs={[
            { name: "Misc Tools", url: "/category/misc-tools" },
            { name: "YouTube Revenue Calculator", url: "/youtube-revenue-calculator" }
          ]}
        />
        
        {/** ===== Outside meta/link tags for YouTube Revenue page ===== */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="robots"
          content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
        />
        <link
          rel="canonical"
          href="https://calculatorhub.site/youtube-revenue-calculator"
        />
        
        {/** Hreflang */}
        <link
          rel="alternate"
          href="https://calculatorhub.site/youtube-revenue-calculator"
          hreflang="en"
        />
        <link
          rel="alternate"
          href="https://calculatorhub.site/bn/youtube-revenue-calculator"
          hreflang="bn"
        />
        <link
          rel="alternate"
          href="https://calculatorhub.site/youtube-revenue-calculator"
          hreflang="x-default"
        />
        
        {/** Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="CalculatorHub" />
        <meta
          property="og:title"
          content="YouTube Revenue Calculator (2025–2026) — Simple Earnings & RPM Estimator"
        />
        <meta
          property="og:description"
          content="Estimate YouTube revenue from your monthly views using monetized view %, CPM by country, creator share and Advanced Mode for multi-country audiences and extra income."
        />
        <meta
          property="og:url"
          content="https://calculatorhub.site/youtube-revenue-calculator"
        />
        <meta
          property="og:image"
          content="https://calculatorhub.site/images/youtube_revenue_calculator.webp"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="YouTube revenue calculator UI with monthly views and earnings range cards"
        />
        <meta property="og:locale" content="en_US" />
        
        {/** Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="YouTube Revenue Calculator — Simple Earnings & RPM Estimator"
        />
        <meta
          name="twitter:description"
          content="Free YouTube earnings calculator with Normal & Advanced modes, multi-country audience split and extra income inputs."
        />
        <meta
          name="twitter:image"
          content="https://calculatorhub.site/images/youtube_revenue_calculator.webp"
        />
        <meta name="twitter:creator" content="@CalculatorHub" />
        <meta name="twitter:site" content="@CalculatorHub" />
        
        {/** PWA & theme */}
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="theme-color" content="#0ea5e9" />
        
        {/** Performance */}
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
          href="/images/youtube_revenue_calculator.webp"
          fetchpriority="high"
        />
        <link
          rel="preload"
          href="/fonts/Inter-Variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />
        
        {/** Misc */}
        <link
          rel="sitemap"
          type="application/xml"
          href="https://calculatorhub.site/sitemap.xml"
        />
        <meta name="referrer" content="no-referrer-when-downgrade" />
        <meta name="format-detection" content="telephone=no" />


      <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6">
        <Breadcrumbs
          items={[
            { name: "Misc Tools", url: "/category/misc-tools" },
            { name: "YouTube Revenue Calculator", url: "/youtube-revenue-calculator" },
          ]}
        />

        {/* MAIN CARD */}
        <div className="rounded-2xl p-4 sm:p-5 md:p-8 mb-8 bg-slate-900/80 border border-slate-700 shadow-lg">
          {/* Header - mobile friendly */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="p-2 bg-red-600/20 border border-red-500/40 rounded-xl shrink-0">
                <PlayCircle className="text-red-400 h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
                  YouTube Revenue Calculator
                </h1>
                <p className="text-[11px] sm:text-xs md:text-sm text-slate-300/80">
                  Enter your views and audience to see a simple estimate of your YouTube earnings.
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

          {/* Two-column layout: inputs left, results right (mobile -> single) */}
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
                    Monthly Views
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={monthlyViews}
                    onChange={(e) =>
                      setMonthlyViews(Math.max(0, Number(e.target.value)))
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Total views on your channel or specific videos in one month.
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
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {COUNTRY_CPM.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Used to estimate CPM range for your ads.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-medium text-slate-200 flex items-center gap-1">
                    Monetized Views %
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={1}
                      value={monetizedPercent}
                      onChange={(e) =>
                        setMonetizedPercent(Number(e.target.value))
                      }
                      className="w-full accent-red-500"
                    />
                    <div className="w-full sm:w-14 text-right text-sm text-slate-100">
                      {monetizedPercent}%
                    </div>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Not every view shows an ad. Many channels see around 40–80%.
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
                    className="w-full sm:w-32 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Your share after YouTube takes its cut (often around 55%).
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
                          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-[11px] sm:text-xs"
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
                            className="flex-1 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-red-500"
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
                              className="px-2 py-1 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 self-start sm:self-auto"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] sm:text-xs text-slate-400">
                      The percentages don&apos;t have to equal exactly 100%. We use
                      them as a rough split of your total views.
                    </p>
                  </div>

                  {/* Extra income fields */}
                  <div className="space-y-3">
                    <p className="text-[11px] sm:text-xs text-slate-300">
                      Other monthly income (optional)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 text-[11px] sm:text-xs">
                      <div className="space-y-1">
                        <label className="block text-slate-400">
                          Memberships ($/month)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={membersMonthly}
                          onChange={(e) =>
                            setMembersMonthly(
                              Math.max(0, Number(e.target.value))
                            )
                          }
                          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-400">
                          Super Chat / Thanks ($/month)
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
                          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-400">
                          Sponsorships ($/month)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={sponsorsMonthly}
                          onChange={(e) =>
                            setSponsorsMonthly(
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
                    Estimated Earnings (Ads only)
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
                    This is an estimate based on average CPM values for{" "}
                    <span className="font-medium ml-1">
                      {currentCountry.name}
                    </span>{" "}
                    and your inputs. Real earnings may be higher or lower.
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
                        <p className="text-slate-400 mb-1">Ads only</p>
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
                          Other income (memberships, Super Chat, sponsors)
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
                    multi-country audience split and other income.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>


          <AdBanner type="bottom" />
          {/* ==================== SEO CONTENT SECTION ==================== */}
          <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          
            {/* ===== Table of Contents ===== */}
            <nav className="mt-2 mb-10 bg-[#0f172a] border border-[#334155] rounded-xl p-5 text-slate-200">
              <h2 className="text-lg font-semibold text-cyan-300 mb-3">📖 Table of Contents</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  <a href="#overview" className="text-indigo-400 hover:underline">
                    Overview: What This YouTube Revenue Calculator Does
                  </a>
                </li>
                <li>
                  <a href="#how-to-use" className="text-indigo-400 hover:underline">
                    How to Use the YouTube Revenue Calculator
                  </a>
                </li>
                <li>
                  <a href="#how-calculated" className="text-indigo-400 hover:underline">
                    How YouTube Earnings Are Calculated (CPM, RPM & Monetized Views)
                  </a>
                </li>
                <li>
                  <a href="#advanced-mode" className="text-indigo-400 hover:underline">
                    Normal vs Advanced Mode (Audience Split & Extra Income)
                  </a>
                </li>
                <li>
                  <a href="#example" className="text-indigo-400 hover:underline">
                    Worked Example: YouTube Revenue Per 1,000 Views
                  </a>
                </li>
                <li>
                  <a href="#benefits" className="text-indigo-400 hover:underline">
                    Benefits for Creators & Channel Owners
                  </a>
                </li>
                <li>
                  <a href="#tips" className="text-indigo-400 hover:underline">
                    Tips to Improve YouTube CPM, RPM & Monetized Playbacks
                  </a>
                </li>
                <li>
                  <a href="#pros-cons" className="text-indigo-400 hover:underline">
                    Pros &amp; Cons of Using a YouTube Revenue Calculator
                  </a>
                </li>
                <li>
                  <a href="#faq" className="text-indigo-400 hover:underline">
                    FAQ – YouTube Monetization & Revenue Estimates
                  </a>
                </li>
              </ol>
            </nav>
          
            <h1
              id="overview"
              className="text-3xl font-bold text-cyan-400 mb-6"
            >
              YouTube Revenue Calculator — CPM, RPM &amp; Earnings Estimator (Global or Country-wise)
            </h1>
          
            <p>
              The <strong>YouTube Revenue Calculator</strong> by CalculatorHub is a practical,
              data-driven tool that helps creators estimate how much money a YouTube channel can earn
              from ads and other revenue streams. Instead of guessing based on random screenshots or
              hearsay, this <strong>YouTube earnings estimator</strong> uses realistic CPM ranges,
              monetized playbacks, creator share, and audience geography to calculate
              <strong> monthly and yearly YouTube revenue</strong>.
            </p>
          
            <p>
              Designed for both beginners and experienced creators, this
              <strong> YouTube revenue calculator</strong> works as an all-in-one
              <strong> YouTube CPM calculator</strong>, <strong>YouTube RPM calculator</strong>,
              and <strong>YouTube income calculator</strong>. It supports country-wise CPM,
              audience-split logic, and optional income from channel memberships, Super Chat, and
              sponsorships, making it a powerful <strong>creator revenue tool</strong> for planning
              and forecasting.
            </p>
          
            <figure className="my-8">
              <img
                src="/images/youtube_revenue_calculator.webp"
                alt="Modern YouTube revenue calculator showing CPM, RPM and estimated earnings"
                title="Free YouTube Revenue Calculator | CPM, RPM & Monetized Playbacks"
                className="rounded-lg shadow-md border border-slate-700 mx-auto"
                loading="lazy"
              />
              <figcaption className="text-center text-sm text-slate-400 mt-2">
                Real-time YouTube revenue estimations based on views, CPM, RPM and audience split.
              </figcaption>
            </figure>
          
            <h2 className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
              ▶️ What Is a YouTube Revenue Calculator?
            </h2>
          
            <p>
              A <strong>YouTube revenue calculator</strong> is an estimation tool that predicts how
              much income a channel can generate from ads and other YouTube monetization features.
              It combines <strong>monthly views</strong>, <strong>monetized playbacks</strong>,
              <strong> CPM (cost per 1,000 impressions)</strong>,
              <strong> RPM (revenue per 1,000 views)</strong> and
              <strong> creator revenue share</strong> to give an approximate earning range.
            </p>
          
            <p>
              This specific calculator goes beyond simple math. It acts as a
              <strong> YouTube monetization calculator</strong> that explains how CPM, RPM and
              monetized views interact. It is especially useful for creators who want a
              <strong> YouTube calculator for beginners</strong> with clear explanations, while still
              being advanced enough for agencies and analytics-focused users who need a serious
              <strong> YouTube earnings estimator</strong> for planning content and sponsorship deals.
            </p>
          
            <h2
              id="how-to-use"
              className="text-2xl font-semibold text-cyan-300 mt-10 mb-4"
            >
              💡 How to Use the YouTube Revenue Calculator
            </h2>
          
            <p>
              Using this <strong>YouTube money calculator</strong> is intentionally simple. The
              interface follows a clean two-column layout: inputs on the left, results on the right,
              so the user can see how every change affects estimated earnings in real time.
            </p>
          
            <ol className="list-decimal list-inside space-y-2">
              <li>
                Enter the total <strong>monthly YouTube views</strong> for a channel or a group of
                videos.
              </li>
              <li>
                Select the <strong>main audience country</strong>. This controls the default CPM
                range used by the <strong>YouTube CPM calculator</strong> logic.
              </li>
              <li>
                Adjust the <strong>monetized views percentage</strong> to reflect how many views
                actually show ads (typical ranges are 40–80%).
              </li>
              <li>
                Set the <strong>creator revenue share</strong> (often around 55% after YouTube’s
                cut).
              </li>
              <li>
                Optionally enable <strong>Advanced Mode</strong> to split the audience by multiple
                countries and add <strong>memberships</strong>, <strong>Super Chat</strong> and
                <strong> sponsorship</strong> income.
              </li>
            </ol>
          
            <p>
              As soon as these values are entered, the <strong>YouTube earnings calculator</strong>
              shows estimated <strong>monthly and yearly revenue</strong>, along with an effective
              <strong> RPM per 1,000 views</strong>. Because the interface updates instantly, it’s
              easy to test different scenarios and see how changes in CPM, RPM or monetized
              playbacks influence total <strong>YouTube income</strong>.
            </p>
            <AdBanner type='bottom' />
          
            <h2
              id="how-calculated"
              className="text-2xl font-semibold text-cyan-300 mt-10 mb-4"
            >
              🧮 How YouTube Earnings Are Calculated (CPM, RPM &amp; Monetized Views)
            </h2>
          
            <p>
              Under the hood, the <strong>YouTube revenue calculator</strong> uses a clear and
              transparent set of formulas based on standard ad-monetization logic. It functions as
              a combined <strong>YouTube CPM calculator</strong> and
              <strong> YouTube RPM calculator</strong>, using ranges instead of fixed values to
              reflect real-world variation.
            </p>
          
            <p>The simplified steps look like this:</p>
          
            <pre className="bg-slate-800 text-slate-200 p-3 rounded-lg overflow-x-auto text-sm">
              <code>
          {`1) Monetized Views = Monthly Views × (Monetized Views % ÷ 100)
          2) Gross Ad Revenue (Min) = (Monetized Views ÷ 1000) × Min CPM
          3) Gross Ad Revenue (Max) = (Monetized Views ÷ 1000) × Max CPM
          4) Creator Earnings (Min) = Gross Ad Revenue (Min) × (Creator Share % ÷ 100)
          5) Creator Earnings (Max) = Gross Ad Revenue (Max) × (Creator Share % ÷ 100)
          6) RPM Range = (Creator Earnings ÷ Total Views) × 1000`}
              </code>
            </pre>
          
            <p>
              Because the tool uses a <strong>CPM range</strong> instead of one fixed number, it
              gives a minimum and maximum estimate. This reflects how YouTube CPM can change with
              seasonality, advertiser demand and audience demographics. The result is a more
              realistic <strong>YouTube earnings estimator</strong> that creators can trust for
              planning sponsorship packages, content strategy and long-term growth.
            </p>
          
            <h2
              id="advanced-mode"
              className="text-2xl font-semibold text-cyan-300 mt-10 mb-4"
            >
              ⚙️ Normal vs Advanced Mode (Audience Split & Extra Income)
            </h2>
          
            <p>
              In <strong>Normal Mode</strong>, the tool assumes most views come from a single
              primary country, using that location’s CPM range. This is ideal for quick checks and
              for channels with a clearly dominant region.
            </p>
          
            <p>
              <strong>Advanced Mode</strong> upgrades the calculator into a full-blown
              <strong> YouTube monetization simulator</strong>. It allows the user to:
            </p>
          
            <ul className="list-disc list-inside space-y-2">
              <li>
                Add multiple countries and set a percentage share of views for each (e.g. 50% US,
                30% India, 20% Bangladesh).
              </li>
              <li>
                Automatically apply different CPM ranges per country using the built-in dataset.
              </li>
              <li>
                Combine these into a weighted average to estimate global
                <strong> YouTube CPM</strong> and final revenue.
              </li>
              <li>
                Add extra monthly income from <strong>channel memberships</strong>,
                <strong> Super Chat / Super Thanks</strong> and <strong>sponsorship deals</strong>.
              </li>
            </ul>
          
            <p>
              This turns the page into an advanced
              <strong> YouTube earnings calculator with audience split</strong>, giving channel
              owners a clearer view of total income instead of looking at ads in isolation. For
              many medium and large channels, this Advanced Mode is the key to understanding real
              <strong> YouTube revenue per 1,000 views</strong> across different markets.
            </p>
          
            <h2
              id="example"
              className="text-2xl font-semibold text-cyan-300 mt-10 mb-4"
            >
              📈 Worked Example: Estimating YouTube Revenue Per 1,000 Views
            </h2>
          
            <p>
              Consider a channel with <strong>100,000 monthly views</strong>. The main audience is
              from the United States, monetized views are set at <strong>60%</strong>, and the
              <strong> creator share</strong> is <strong>55%</strong>. The built-in CPM range for
              the US is applied by the <strong>YouTube CPM calculator</strong>.
            </p>
          
            <p>Using these inputs, the YouTube Revenue Calculator will:</p>
          
            <ul className="list-disc list-inside space-y-1">
              <li>Estimate monetized playbacks (around 60,000 views).</li>
              <li>
                Apply the US CPM range to calculate a minimum and maximum
                <strong> monthly ad revenue</strong>.
              </li>
              <li>
                Apply the creator share to show how much the channel actually earns from that ad
                revenue.
              </li>
              <li>
                Convert the results into yearly estimates to show long-term potential.
              </li>
              <li>
                Display an effective <strong>RPM range</strong> so creators can see earnings
                <strong> per 1,000 total views</strong>.
              </li>
            </ul>
          
            <p>
              If Advanced Mode is enabled and additional income sources (like memberships and
              sponsors) are entered, the tool then combines everything into a
              <strong> total YouTube revenue range</strong>. This kind of worked example helps
              creators understand how a <strong>YouTube revenue calculator</strong> can be used as a
              long-term planning tool rather than just a one-time curiosity.
            </p>
          
            <h2
              id="benefits"
              className="text-2xl font-semibold text-cyan-300 mt-10 mb-4"
            >
              ✅ Benefits of Using a YouTube Revenue Calculator
            </h2>
          
            <p>
              This page is more than a quick <strong>YouTube money calculator</strong>. It acts as a
              complete <strong>creator revenue tool</strong> with several key benefits:
            </p>
          
            <ul className="space-y-2">
              <li>
                ✔️ Helps creators understand realistic
                <strong> YouTube revenue per 1,000 views</strong> across different countries.
              </li>
              <li>
                ✔️ Works as a <strong>YouTube CPM &amp; RPM calculator</strong> in one place,
                showing both ad-side and creator-side metrics.
              </li>
              <li>
                ✔️ Makes it easier to negotiate sponsorships by knowing approximate
                <strong> monthly and yearly earnings</strong>.
              </li>
              <li>
                ✔️ Assists with long-term planning, especially for creators aiming to go full-time.
              </li>
              <li>
                ✔️ Offers a friendly <strong>YouTube calculator for beginners</strong> while still
                being powerful enough for agencies and analysts.
              </li>
            </ul>
          
            <p>
              In many cases, creators use this <strong>YouTube earnings estimator</strong> side by
              side with their analytics dashboard to check if current RPM values are healthy or if
              there is room to optimize content, audience targeting or ad formats.
            </p>
          
            <h2
              id="tips"
              className="text-2xl font-semibold text-cyan-300 mt-10 mb-4"
            >
              🧭 Tips to Improve YouTube CPM, RPM &amp; Overall Revenue
            </h2>
          
            <p>
              A <strong>YouTube revenue calculator</strong> is not only for prediction; it is also a
              strategic tool. By testing different inputs, creators can see how certain improvements
              might increase income.
            </p>
          
            <ul className="list-disc list-inside space-y-2">
              <li>
                💡 Focus on audiences in higher-CPM regions (US, UK, Canada, Australia, Western
                Europe) to raise average <strong>YouTube CPM</strong>.
              </li>
              <li>
                💡 Create advertiser-friendly content to avoid limited or no ads and improve
                <strong> RPM</strong>.
              </li>
              <li>
                💡 Encourage longer watch-time and deeper session views so that more ads can be shown.
              </li>
              <li>
                💡 Experiment with adding mid-rolls on longer videos while still protecting viewer
                experience.
              </li>
              <li>
                💡 Build additional revenue streams — memberships, Super Chat, affiliate links and
                sponsorships — then plug those numbers into the
                <strong> YouTube income calculator</strong> to see the full picture.
              </li>
            </ul>
          
            <p>
              By combining these tips with the insights from this
              <strong> YouTube earnings calculator</strong>, creators can make smarter decisions
              around content topics, audience targeting and monetization strategy.
            </p>
          
            <h2
              id="pros-cons"
              className="text-2xl font-semibold text-cyan-300 mt-10 mb-4"
            >
              ⚖️ Pros &amp; Cons of a YouTube Revenue Estimator
            </h2>
          
            <p>
              Like any analytical tool, a <strong>YouTube revenue calculator</strong> has its
              strengths and limitations. Understanding both sides helps creators use it wisely.
            </p>
          
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
                <h3 className="text-emerald-300 font-semibold mb-2">Pros</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Fast and clear overview of potential YouTube earnings.</li>
                  <li>
                    Uses realistic CPM ranges by country instead of a single global average.
                  </li>
                  <li>
                    Supports advanced audience split and extra revenue sources in one view.
                  </li>
                  <li>
                    Helpful for both negotiations and long-term financial planning.
                  </li>
                </ul>
              </div>
              <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
                <h3 className="text-rose-300 font-semibold mb-2">Cons</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>
                    Actual payouts depend on many factors: seasonality, policy, content niche and
                    ad inventory.
                  </li>
                  <li>
                    Accuracy relies on entering realistic values for monetized views and audience
                    split.
                  </li>
                  <li>
                    Cannot replace direct data from YouTube Analytics or AdSense dashboards.
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
                ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
              </h2>
          
              <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                    Q1: Is this YouTube Revenue Calculator 100% accurate?
                  </h3>
                  <p>
                    No estimator can predict exact payouts. However, this
                    <strong> YouTube earnings calculator</strong> uses realistic CPM ranges and
                    standard monetization formulas to provide a reliable earning range. It is best
                    used as a planning and forecasting tool, alongside YouTube Analytics.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                    Q2: What is the difference between CPM and RPM on YouTube?
                  </h3>
                  <p>
                    <strong>CPM</strong> represents how much advertisers pay per 1,000 ad
                    impressions, while <strong>RPM</strong> shows how much revenue a creator earns
                    per 1,000 total views. RPM is usually lower than CPM because it accounts for
                    non-monetized views and YouTube’s revenue share.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                    Q3: Why does country selection matter in a YouTube CPM calculator?
                  </h3>
                  <p>
                    Advertiser budgets and purchasing power differ across regions. As a result,
                    <strong> YouTube CPM</strong> is much higher in some countries than others. This
                    calculator uses country-based CPM ranges, making it a more accurate
                    <strong> YouTube income calculator by country</strong>.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                    Q4: Does this include YouTube Shorts revenue?
                  </h3>
                  <p>
                    Yes, Shorts can be included if their views are counted in the
                    <strong> monthly views</strong> input. However, Shorts often have different RPM
                    levels, so creators may want to use more conservative monetized-view
                    percentages and CPM ranges when using the
                    <strong> YouTube revenue calculator</strong> for Shorts-heavy channels.
                  </p>
                </div>
          
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="font-semibold text-xl mb-2 text-yellow-300">
                    Q5: Can brands and agencies use this YouTube earnings estimator?
                  </h3>
                  <p>
                    Absolutely. Agencies, brands and managers can use this
                    <strong> YouTube earnings estimator</strong> to evaluate creator proposals,
                    sponsorship deals and campaign performance. The Advanced Mode’s audience split
                    and extra income fields make it especially useful for professional planning.
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
                alt="CalculatorHub Creator Tools Team"
                className="w-12 h-12 rounded-full border border-gray-600"
                loading="lazy"
              />
              <div>
                <p className="font-semibold text-white">
                  Written by the CalculatorHub Creator &amp; Finance Tools Team
                </p>
                <p className="text-sm text-slate-400">
                  Specialists in YouTube monetization, CPM/RPM analytics and online revenue tools.
                  Last updated: <time dateTime="2025-11-15">November 15, 2025</time>.
                </p>
              </div>
            </div>
          
            <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
              <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
                🚀 Explore more tools on CalculatorHub:
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link
                  to="/adsense-revenue-calculator"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-red-600/20 text-red-300 hover:text-red-400 px-3 py-2 rounded-md border border-slate-700 hover:border-red-500 transition-all duration-200"
                >
                  <span className="text-red-400">💰</span> Website &amp; AdSense Revenue Calculator
                </Link>
          
                <Link
                  to="/home-loan-calculator"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
                >
                  <span className="text-indigo-400">🏡</span> Mortgage &amp; Home Loan Calculator
                </Link>
          
                <Link
                  to="/loan-affordability-calculator"
                  className="flex items-center gap-2 bg-[#0f172a] hover:bg-sky-600/20 text-sky-300 hover:text-sky-400 px-3 py-2 rounded-md border border-slate-700 hover:border-sky-500 transition-all duration-200"
                >
                  <span className="text-sky-400">📊</span> Loan Affordability Calculator
                </Link>
              </div>
            </div>
          </section>

      
          <AdBanner type="bottom" />
          <RelatedCalculators currentPath="/youtube-revenue-calculator" />


      </div>
    </>
  );
};

export default YouTubeRevenueCalculator;
