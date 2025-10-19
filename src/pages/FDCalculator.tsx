import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import {
  PiggyBank,
  RotateCcw,
  Share2,
  Copy,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import {
  PieChart, 
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import { seoData, generateCalculatorSchema } from "../utils/seoData";
import RelatedCalculators from "../components/RelatedCalculators";

/* ============================================================
   📦 SECTION 1: Constants & Utilities
   ============================================================ */
const LS_KEY = "fd_calculator_tax_style_v1";

// Currency list (deduped)
const currencyOptions = [
  { code: "USD", symbol: "$", locale: "en-US", label: "US Dollar ($)" },
  { code: "EUR", symbol: "€", locale: "de-DE", label: "Euro (€)" },
  { code: "GBP", symbol: "£", locale: "en-GB", label: "British Pound (£)" },
  { code: "INR", symbol: "₹", locale: "en-IN", label: "Indian Rupee (₹)" },
  { code: "AUD", symbol: "A$", locale: "en-AU", label: "Australian Dollar (A$)" },
  { code: "CAD", symbol: "C$", locale: "en-CA", label: "Canadian Dollar (C$)" },
  { code: "SGD", symbol: "S$", locale: "en-SG", label: "Singapore Dollar (S$)" },
  { code: "JPY", symbol: "¥", locale: "ja-JP", label: "Japanese Yen (¥)" },
  { code: "CNY", symbol: "¥", locale: "zh-CN", label: "Chinese Yuan (¥)" },
  { code: "NZD", symbol: "NZ$", locale: "en-NZ", label: "New Zealand Dollar (NZ$)" },
  { code: "CHF", symbol: "CHF", locale: "de-CH", label: "Swiss Franc (CHF)" },
  { code: "HKD", symbol: "HK$", locale: "zh-HK", label: "Hong Kong Dollar (HK$)" },
  { code: "SEK", symbol: "kr", locale: "sv-SE", label: "Swedish Krona (kr)" },
  { code: "NOK", symbol: "kr", locale: "nb-NO", label: "Norwegian Krone (kr)" },
  { code: "DKK", symbol: "kr", locale: "da-DK", label: "Danish Krone (kr)" },
  { code: "ZAR", symbol: "R", locale: "en-ZA", label: "South African Rand (R)" },
  { code: "BRL", symbol: "R$", locale: "pt-BR", label: "Brazilian Real (R$)" },
  { code: "RUB", symbol: "₽", locale: "ru-RU", label: "Russian Ruble (₽)" },
  { code: "KRW", symbol: "₩", locale: "ko-KR", label: "South Korean Won (₩)" },
  { code: "THB", symbol: "฿", locale: "th-TH", label: "Thai Baht (฿)" },
  { code: "IDR", symbol: "Rp", locale: "id-ID", label: "Indonesian Rupiah (Rp)" },
  { code: "MYR", symbol: "RM", locale: "ms-MY", label: "Malaysian Ringgit (RM)" },
  { code: "PHP", symbol: "₱", locale: "en-PH", label: "Philippine Peso (₱)" },
  { code: "VND", symbol: "₫", locale: "vi-VN", label: "Vietnamese Dong (₫)" },
  { code: "SAR", symbol: "﷼", locale: "ar-SA", label: "Saudi Riyal (﷼)" },
  { code: "AED", symbol: "د.إ", locale: "ar-AE", label: "UAE Dirham (د.إ)" },
  { code: "QAR", symbol: "﷼", locale: "ar-QA", label: "Qatari Riyal (﷼)" },
  { code: "KWD", symbol: "KD", locale: "ar-KW", label: "Kuwaiti Dinar (KD)" },
  { code: "BHD", symbol: "BD", locale: "ar-BH", label: "Bahraini Dinar (BD)" },
  { code: "OMR", symbol: "﷼", locale: "ar-OM", label: "Omani Rial (﷼)" },
  { code: "PKR", symbol: "₨", locale: "ur-PK", label: "Pakistani Rupee (₨)" },
  { code: "BDT", symbol: "৳", locale: "bn-BD", label: "Bangladeshi Taka (৳)" },
  { code: "LKR", symbol: "Rs", locale: "si-LK", label: "Sri Lankan Rupee (Rs)" },
  { code: "NPR", symbol: "₨", locale: "ne-NP", label: "Nepalese Rupee (₨)" },
  { code: "MMK", symbol: "K", locale: "my-MM", label: "Myanmar Kyat (K)" },
  { code: "KES", symbol: "Sh", locale: "en-KE", label: "Kenyan Shilling (Sh)" },
  { code: "NGN", symbol: "₦", locale: "en-NG", label: "Nigerian Naira (₦)" },
  { code: "EGP", symbol: "£", locale: "ar-EG", label: "Egyptian Pound (£)" },
  { code: "ILS", symbol: "₪", locale: "he-IL", label: "Israeli Shekel (₪)" },
  { code: "TRY", symbol: "₺", locale: "tr-TR", label: "Turkish Lira (₺)" },
  { code: "PLN", symbol: "zł", locale: "pl-PL", label: "Polish Zloty (zł)" },
  { code: "CZK", symbol: "Kč", locale: "cs-CZ", label: "Czech Koruna (Kč)" },
  { code: "HUF", symbol: "Ft", locale: "hu-HU", label: "Hungarian Forint (Ft)" },
  { code: "MXN", symbol: "$", locale: "es-MX", label: "Mexican Peso ($)" },
  { code: "CLP", symbol: "$", locale: "es-CL", label: "Chilean Peso ($)" },
  { code: "COP", symbol: "$", locale: "es-CO", label: "Colombian Peso ($)" },
  { code: "ARS", symbol: "$", locale: "es-AR", label: "Argentine Peso ($)" },
  { code: "PEN", symbol: "S/", locale: "es-PE", label: "Peruvian Sol (S/)" },
  { code: "UYU", symbol: "$U", locale: "es-UY", label: "Uruguayan Peso ($U)" },
  { code: "TWD", symbol: "NT$", locale: "zh-TW", label: "New Taiwan Dollar (NT$)" },
];

const findLocale = (code: string) =>
  currencyOptions.find((c) => c.code === code)?.locale || "en-US";
const findSymbol = (code: string) =>
  currencyOptions.find((c) => c.code === code)?.symbol || "";

const formatCurrency = (num: number, locale: string, currency: string) => {
  if (!isFinite(num) || num <= 0) return `${findSymbol(currency)}0`;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/* ============================================================
   🏦 SECTION 2: Component
   ============================================================ */
const FDCalculator: React.FC = () => {
  /* ---------- Inputs ---------- */
  const [deposit, setDeposit] = useState<number>(0);
  const [rate, setRate] = useState<number>(0); // APR %
  const [years, setYears] = useState<number>(0);
  const [months, setMonths] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("USD");

  type CompFreq = "monthly" | "quarterly" | "half-yearly" | "yearly";
  const [compounding, setCompounding] = useState<CompFreq>("quarterly");
  type Payout = "cumulative" | "monthly-payout" | "quarterly-payout" | "yearly-payout";
  const [payout, setPayout] = useState<Payout>("cumulative");

  /* ---------- Derived ---------- */
  const totalMonths = years * 12 + months;
  const termYears = totalMonths / 12;
  const mFromFreq = (f: CompFreq) => (f === "monthly" ? 12 : f === "quarterly" ? 4 : f === "half-yearly" ? 2 : 1);
  const periodsPerYear = mFromFreq(compounding);
  const r = rate / 100;

  const currentLocale = findLocale(currency);
  const isDefault = !deposit && !rate && !years && !months;

  /* ---------- Outputs ---------- */
  const [maturity, setMaturity] = useState<number>(0);
  const [interestEarned, setInterestEarned] = useState<number>(0);
  const [periodicInterest, setPeriodicInterest] = useState<number>(0); // for payout modes

  /* ---------- UI state ---------- */
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const [granularity, setGranularity] = useState<"yearly" | "monthly">("yearly");
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");

  const [showDepositInfo, setShowDepositInfo] = useState(false);
  const [showRateInfo, setShowRateInfo] = useState(false);
  const [showTermInfo, setShowTermInfo] = useState(false);
  const [showCompInfo, setShowCompInfo] = useState(false);
  const [showPayoutInfo, setShowPayoutInfo] = useState(false);

  /* ============================================================
     🔁 SECTION 3: Normalization & Persistence
     ============================================================ */
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (months >= 12) {
      const extraYears = Math.floor(months / 12);
      setYears((prev) => prev + extraYears);
      setMonths(months % 12);
    }
  }, [months]);

  const applyState = (s: any) => {
    setDeposit(Number(s.deposit) || 0);
    setRate(Number(s.rate) || 0);
    setYears(Number(s.years) || 0);
    setMonths(Number(s.months) || 0);
    setCurrency(typeof s.currency === "string" ? s.currency : "USD");
    setCompounding((s.compounding as CompFreq) || "quarterly");
    setPayout((s.payout as Payout) || "cumulative");
  };

  // On mount → try URL (?fd=) first, else localStorage
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromURL = params.get("fd");

      if (fromURL) {
        const decoded = JSON.parse(atob(fromURL));
        applyState(decoded);
        setHydrated(true);
        return;
      }

      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        applyState(saved);
      }
    } catch (err) {
      console.warn("⚠️ Failed to load persisted state:", err);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const state = { deposit, rate, years, months, currency, compounding, payout };
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("⚠️ Could not save to localStorage:", err);
    }
  }, [hydrated, deposit, rate, years, months, currency, compounding, payout]);

  useEffect(() => {
    if (!hydrated) return;
    const allZero = !deposit && !rate && !years && !months;
    try {
      const url = new URL(window.location.href);
      if (allZero) {
        url.searchParams.delete("fd");
        window.history.replaceState({}, "", url);
        return;
      }
      const state = { deposit, rate, years, months, currency, compounding, payout };
      const encoded = btoa(JSON.stringify(state));
      url.searchParams.set("fd", encoded);
      window.history.replaceState({}, "", url);
    } catch (err) {
      console.warn("⚠️ Failed to update URL:", err);
    }
  }, [hydrated, deposit, rate, years, months, currency, compounding, payout]);

  /* ============================================================
     🧮 SECTION 4: Calculations
     ============================================================ */
  // Two modes:
  // 1) cumulative: A = P*(1 + r/m)^(m*t) where t in years; interest = A - P
  // 2) periodic payout: interest paid out each period without compounding; per-period interest = P*(r/mPay)
  const payoutFreqFromPayout = (p: Payout) =>
    p === "monthly-payout" ? 12 : p === "quarterly-payout" ? 4 : p === "yearly-payout" ? 1 : mFromFreq(compounding);

  const mPay = payoutFreqFromPayout(payout);

  useEffect(() => {
    if (deposit <= 0 || termYears <= 0 || rate < 0) {
      setMaturity(0);
      setInterestEarned(0);
      setPeriodicInterest(0);
      return;
    }

    if (payout === "cumulative") {
      const m = periodsPerYear;
      if (rate === 0) {
        setMaturity(deposit);
        setInterestEarned(0);
        setPeriodicInterest(0);
        return;
      }
      const A = deposit * Math.pow(1 + r / m, m * termYears);
      setMaturity(A);
      setInterestEarned(A - deposit);
      setPeriodicInterest(0);
    } else {
      // simple periodic payouts
      const per = deposit * (r / mPay);
      const nPeriods = Math.round(mPay * termYears);
      const totalInterest = per * nPeriods;
      setPeriodicInterest(per);
      setMaturity(deposit + totalInterest);
      setInterestEarned(totalInterest);
    }
  }, [deposit, r, termYears, rate, payout, periodsPerYear, mPay]);

  // Earnings schedule rows
  type Row = { period: number; interest: number; balance: number };

  const monthlySchedule: Row[] = useMemo(() => {
    if (deposit <= 0 || totalMonths <= 0) return [];

    const out: Row[] = [];
    const tMonths = totalMonths;

    if (payout === "cumulative") {
      // accrue monthly regardless of chosen compounding using exact monthly factor
      const m = periodsPerYear;
      for (let i = 1; i <= tMonths; i++) {
        const tY = i / 12;
        const A = rate === 0 ? deposit : deposit * Math.pow(1 + r / m, m * tY);
        const interest = A - deposit - (out.length ? out[out.length - 1].balance - deposit : 0);
        out.push({ period: i, interest: Math.max(interest, 0), balance: A });
      }
    } else {
      // payout mode
      const per = deposit * (r / mPay);
      const payMonths = Math.round((12 / mPay));
      let accrued = 0;
      for (let i = 1; i <= tMonths; i++) {
        if (i % payMonths === 0) {
          accrued += per;
          out.push({ period: i, interest: per, balance: deposit + accrued });
        } else {
          out.push({ period: i, interest: 0, balance: deposit + accrued });
        }
      }
    }

    return out;
  }, [deposit, totalMonths, payout, periodsPerYear, rate, r, mPay]);

  const yearlySchedule: Row[] = useMemo(() => {
    const years = Math.ceil(totalMonths / 12);
    const out: Row[] = [];
    for (let y = 0; y < years; y++) {
      const slice = monthlySchedule.slice(y * 12, y * 12 + 12);
      const interest = slice.reduce((s, r) => s + r.interest, 0);
      const balance = slice.length ? slice[slice.length - 1].balance : deposit;
      out.push({ period: y + 1, interest, balance });
    }
    return out;
  }, [monthlySchedule, totalMonths, deposit]);

  const schedule = granularity === "yearly" ? yearlySchedule : monthlySchedule;

 import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import {
  PiggyBank,
  RotateCcw,
  Share2,
  Copy,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import { seoData, generateCalculatorSchema } from "../utils/seoData";
import RelatedCalculators from "../components/RelatedCalculators";

/* ============================================================
   📦 SECTION 1: Constants & Utilities
   ============================================================ */
const LS_KEY = "fd_calculator_tax_style_v1";

// Currency list (deduped)
const currencyOptions = [
  { code: "USD", symbol: "$", locale: "en-US", label: "US Dollar ($)" },
  { code: "EUR", symbol: "€", locale: "de-DE", label: "Euro (€)" },
  { code: "GBP", symbol: "£", locale: "en-GB", label: "British Pound (£)" },
  { code: "INR", symbol: "₹", locale: "en-IN", label: "Indian Rupee (₹)" },
  { code: "AUD", symbol: "A$", locale: "en-AU", label: "Australian Dollar (A$)" },
  { code: "CAD", symbol: "C$", locale: "en-CA", label: "Canadian Dollar (C$)" },
  { code: "SGD", symbol: "S$", locale: "en-SG", label: "Singapore Dollar (S$)" },
  { code: "JPY", symbol: "¥", locale: "ja-JP", label: "Japanese Yen (¥)" },
  { code: "CNY", symbol: "¥", locale: "zh-CN", label: "Chinese Yuan (¥)" },
  { code: "NZD", symbol: "NZ$", locale: "en-NZ", label: "New Zealand Dollar (NZ$)" },
  { code: "CHF", symbol: "CHF", locale: "de-CH", label: "Swiss Franc (CHF)" },
  { code: "HKD", symbol: "HK$", locale: "zh-HK", label: "Hong Kong Dollar (HK$)" },
  { code: "SEK", symbol: "kr", locale: "sv-SE", label: "Swedish Krona (kr)" },
  { code: "NOK", symbol: "kr", locale: "nb-NO", label: "Norwegian Krone (kr)" },
  { code: "DKK", symbol: "kr", locale: "da-DK", label: "Danish Krone (kr)" },
  { code: "ZAR", symbol: "R", locale: "en-ZA", label: "South African Rand (R)" },
  { code: "BRL", symbol: "R$", locale: "pt-BR", label: "Brazilian Real (R$)" },
  { code: "RUB", symbol: "₽", locale: "ru-RU", label: "Russian Ruble (₽)" },
  { code: "KRW", symbol: "₩", locale: "ko-KR", label: "South Korean Won (₩)" },
  { code: "THB", symbol: "฿", locale: "th-TH", label: "Thai Baht (฿)" },
  { code: "IDR", symbol: "Rp", locale: "id-ID", label: "Indonesian Rupiah (Rp)" },
  { code: "MYR", symbol: "RM", locale: "ms-MY", label: "Malaysian Ringgit (RM)" },
  { code: "PHP", symbol: "₱", locale: "en-PH", label: "Philippine Peso (₱)" },
  { code: "VND", symbol: "₫", locale: "vi-VN", label: "Vietnamese Dong (₫)" },
  { code: "SAR", symbol: "﷼", locale: "ar-SA", label: "Saudi Riyal (﷼)" },
  { code: "AED", symbol: "د.إ", locale: "ar-AE", label: "UAE Dirham (د.إ)" },
  { code: "QAR", symbol: "﷼", locale: "ar-QA", label: "Qatari Riyal (﷼)" },
  { code: "KWD", symbol: "KD", locale: "ar-KW", label: "Kuwaiti Dinar (KD)" },
  { code: "BHD", symbol: "BD", locale: "ar-BH", label: "Bahraini Dinar (BD)" },
  { code: "OMR", symbol: "﷼", locale: "ar-OM", label: "Omani Rial (﷼)" },
  { code: "PKR", symbol: "₨", locale: "ur-PK", label: "Pakistani Rupee (₨)" },
  { code: "BDT", symbol: "৳", locale: "bn-BD", label: "Bangladeshi Taka (৳)" },
  { code: "LKR", symbol: "Rs", locale: "si-LK", label: "Sri Lankan Rupee (Rs)" },
  { code: "NPR", symbol: "₨", locale: "ne-NP", label: "Nepalese Rupee (₨)" },
  { code: "MMK", symbol: "K", locale: "my-MM", label: "Myanmar Kyat (K)" },
  { code: "KES", symbol: "Sh", locale: "en-KE", label: "Kenyan Shilling (Sh)" },
  { code: "NGN", symbol: "₦", locale: "en-NG", label: "Nigerian Naira (₦)" },
  { code: "EGP", symbol: "£", locale: "ar-EG", label: "Egyptian Pound (£)" },
  { code: "ILS", symbol: "₪", locale: "he-IL", label: "Israeli Shekel (₪)" },
  { code: "TRY", symbol: "₺", locale: "tr-TR", label: "Turkish Lira (₺)" },
  { code: "PLN", symbol: "zł", locale: "pl-PL", label: "Polish Zloty (zł)" },
  { code: "CZK", symbol: "Kč", locale: "cs-CZ", label: "Czech Koruna (Kč)" },
  { code: "HUF", symbol: "Ft", locale: "hu-HU", label: "Hungarian Forint (Ft)" },
  { code: "MXN", symbol: "$", locale: "es-MX", label: "Mexican Peso ($)" },
  { code: "CLP", symbol: "$", locale: "es-CL", label: "Chilean Peso ($)" },
  { code: "COP", symbol: "$", locale: "es-CO", label: "Colombian Peso ($)" },
  { code: "ARS", symbol: "$", locale: "es-AR", label: "Argentine Peso ($)" },
  { code: "PEN", symbol: "S/", locale: "es-PE", label: "Peruvian Sol (S/)" },
  { code: "UYU", symbol: "$U", locale: "es-UY", label: "Uruguayan Peso ($U)" },
  { code: "TWD", symbol: "NT$", locale: "zh-TW", label: "New Taiwan Dollar (NT$)" },
];

const findLocale = (code: string) =>
  currencyOptions.find((c) => c.code === code)?.locale || "en-US";
const findSymbol = (code: string) =>
  currencyOptions.find((c) => c.code === code)?.symbol || "";

const formatCurrency = (num: number, locale: string, currency: string) => {
  if (!isFinite(num) || num <= 0) return `${findSymbol(currency)}0`;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/* ============================================================
   🏦 SECTION 2: Component
   ============================================================ */
const FDCalculator: React.FC = () => {
  /* ---------- Inputs ---------- */
  const [deposit, setDeposit] = useState<number>(0);
  const [rate, setRate] = useState<number>(0); // APR %
  const [years, setYears] = useState<number>(0);
  const [months, setMonths] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("USD");

  type CompFreq = "monthly" | "quarterly" | "half-yearly" | "yearly";
  const [compounding, setCompounding] = useState<CompFreq>("quarterly");
  type Payout = "cumulative" | "monthly-payout" | "quarterly-payout" | "yearly-payout";
  const [payout, setPayout] = useState<Payout>("cumulative");

  /* ---------- Derived ---------- */
  const totalMonths = years * 12 + months;
  const termYears = totalMonths / 12;
  const mFromFreq = (f: CompFreq) => (f === "monthly" ? 12 : f === "quarterly" ? 4 : f === "half-yearly" ? 2 : 1);
  const periodsPerYear = mFromFreq(compounding);
  const r = rate / 100;

  const currentLocale = findLocale(currency);
  const isDefault = !deposit && !rate && !years && !months;

  /* ---------- Outputs ---------- */
  const [maturity, setMaturity] = useState<number>(0);
  const [interestEarned, setInterestEarned] = useState<number>(0);
  const [periodicInterest, setPeriodicInterest] = useState<number>(0); // for payout modes

  /* ---------- UI state ---------- */
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const [granularity, setGranularity] = useState<"yearly" | "monthly">("yearly");
  const [copied, setCopied] = useState<"none" | "results" | "link">("none");

  const [showDepositInfo, setShowDepositInfo] = useState(false);
  const [showRateInfo, setShowRateInfo] = useState(false);
  const [showTermInfo, setShowTermInfo] = useState(false);
  const [showCompInfo, setShowCompInfo] = useState(false);
  const [showPayoutInfo, setShowPayoutInfo] = useState(false);

  /* ============================================================
     🔁 SECTION 3: Normalization & Persistence
     ============================================================ */
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (months >= 12) {
      const extraYears = Math.floor(months / 12);
      setYears((prev) => prev + extraYears);
      setMonths(months % 12);
    }
  }, [months]);

  const applyState = (s: any) => {
    setDeposit(Number(s.deposit) || 0);
    setRate(Number(s.rate) || 0);
    setYears(Number(s.years) || 0);
    setMonths(Number(s.months) || 0);
    setCurrency(typeof s.currency === "string" ? s.currency : "USD");
    setCompounding((s.compounding as CompFreq) || "quarterly");
    setPayout((s.payout as Payout) || "cumulative");
  };

  // On mount → try URL (?fd=) first, else localStorage
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromURL = params.get("fd");

      if (fromURL) {
        const decoded = JSON.parse(atob(fromURL));
        applyState(decoded);
        setHydrated(true);
        return;
      }

      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        applyState(saved);
      }
    } catch (err) {
      console.warn("⚠️ Failed to load persisted state:", err);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const state = { deposit, rate, years, months, currency, compounding, payout };
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("⚠️ Could not save to localStorage:", err);
    }
  }, [hydrated, deposit, rate, years, months, currency, compounding, payout]);

  useEffect(() => {
    if (!hydrated) return;
    const allZero = !deposit && !rate && !years && !months;
    try {
      const url = new URL(window.location.href);
      if (allZero) {
        url.searchParams.delete("fd");
        window.history.replaceState({}, "", url);
        return;
      }
      const state = { deposit, rate, years, months, currency, compounding, payout };
      const encoded = btoa(JSON.stringify(state));
      url.searchParams.set("fd", encoded);
      window.history.replaceState({}, "", url);
    } catch (err) {
      console.warn("⚠️ Failed to update URL:", err);
    }
  }, [hydrated, deposit, rate, years, months, currency, compounding, payout]);

  /* ============================================================
     🧮 SECTION 4: Calculations
     ============================================================ */
  // Two modes:
  // 1) cumulative: A = P*(1 + r/m)^(m*t) where t in years; interest = A - P
  // 2) periodic payout: interest paid out each period without compounding; per-period interest = P*(r/mPay)
  const payoutFreqFromPayout = (p: Payout) =>
    p === "monthly-payout" ? 12 : p === "quarterly-payout" ? 4 : p === "yearly-payout" ? 1 : mFromFreq(compounding);

  const mPay = payoutFreqFromPayout(payout);

  useEffect(() => {
    if (deposit <= 0 || termYears <= 0 || rate < 0) {
      setMaturity(0);
      setInterestEarned(0);
      setPeriodicInterest(0);
      return;
    }

    if (payout === "cumulative") {
      const m = periodsPerYear;
      if (rate === 0) {
        setMaturity(deposit);
        setInterestEarned(0);
        setPeriodicInterest(0);
        return;
      }
      const A = deposit * Math.pow(1 + r / m, m * termYears);
      setMaturity(A);
      setInterestEarned(A - deposit);
      setPeriodicInterest(0);
    } else {
      // simple periodic payouts
      const per = deposit * (r / mPay);
      const nPeriods = Math.round(mPay * termYears);
      const totalInterest = per * nPeriods;
      setPeriodicInterest(per);
      setMaturity(deposit + totalInterest);
      setInterestEarned(totalInterest);
    }
  }, [deposit, r, termYears, rate, payout, periodsPerYear, mPay]);

  // Earnings schedule rows
  type Row = { period: number; interest: number; balance: number };

  const monthlySchedule: Row[] = useMemo(() => {
    if (deposit <= 0 || totalMonths <= 0) return [];

    const out: Row[] = [];
    const tMonths = totalMonths;

    if (payout === "cumulative") {
      // accrue monthly regardless of chosen compounding using exact monthly factor
      const m = periodsPerYear;
      for (let i = 1; i <= tMonths; i++) {
        const tY = i / 12;
        const A = rate === 0 ? deposit : deposit * Math.pow(1 + r / m, m * tY);
        const interest = A - deposit - (out.length ? out[out.length - 1].balance - deposit : 0);
        out.push({ period: i, interest: Math.max(interest, 0), balance: A });
      }
    } else {
      // payout mode
      const per = deposit * (r / mPay);
      const payMonths = Math.round((12 / mPay));
      let accrued = 0;
      for (let i = 1; i <= tMonths; i++) {
        if (i % payMonths === 0) {
          accrued += per;
          out.push({ period: i, interest: per, balance: deposit + accrued });
        } else {
          out.push({ period: i, interest: 0, balance: deposit + accrued });
        }
      }
    }

    return out;
  }, [deposit, totalMonths, payout, periodsPerYear, rate, r, mPay]);

  const yearlySchedule: Row[] = useMemo(() => {
    const years = Math.ceil(totalMonths / 12);
    const out: Row[] = [];
    for (let y = 0; y < years; y++) {
      const slice = monthlySchedule.slice(y * 12, y * 12 + 12);
      const interest = slice.reduce((s, r) => s + r.interest, 0);
      const balance = slice.length ? slice[slice.length - 1].balance : deposit;
      out.push({ period: y + 1, interest, balance });
    }
    return out;
  }, [monthlySchedule, totalMonths, deposit]);

  const schedule = granularity === "yearly" ? yearlySchedule : monthlySchedule;

  /* ============================================================
     📘 SECTION 4.5: Step-by-step FD Math (for UI explainer)
     ============================================================ */
  const fdSteps = useMemo(() => {
    const P = Math.max(deposit, 0);
    const tYears = Math.max(termYears, 0);
    const m = periodsPerYear;
    const rYear = Math.max(rate / 100, 0);

    if (payout === "cumulative") {
      // A = P * (1 + r/m)^(m*t)
      const onePlus = m > 0 ? 1 + rYear / m : 1;
      const pow = Math.pow(onePlus, m * tYears);
      const A = rate === 0 ? P : P * pow;
      const interest = Math.max(A - P, 0);
      return {
        mode: "cumulative" as const,
        P,
        rYear,
        m,
        tYears,
        onePlus,
        pow,
        A,
        interest,
      };
    } else {
      // payout: per-period interest = P * (r / mPay)
      const mPayLocal = mPay;
      const per = P * (rYear / mPayLocal);
      const nPeriods = Math.round(mPayLocal * tYears);
      const totalInterest = per * nPeriods;
      return {
        mode: "payout" as const,
        P,
        rYear,
        tYears,
        mPay: mPayLocal,
        per,
        nPeriods,
        totalInterest,
        A: P + totalInterest,
      };
    }
  }, [deposit, rate, termYears, periodsPerYear, payout, mPay]);

  /* ============================================================
     📊 SECTION 5: Chart & Tips
     ============================================================ */
  const pieData = [
    { name: "Deposit", value: Math.max(deposit, 0) },
    { name: "Interest", value: Math.max(interestEarned, 0) },
  ];

  const interestPct = deposit > 0 ? (interestEarned / deposit) * 100 : 0;

  const tipsForFD = useMemo(() => {
    const base: string[] = [];
    if (deposit && interestEarned)
      base.push(`Over your term, you'll earn ~${interestPct.toFixed(0)}% of your deposit as interest.`);
    base.push("Tip: Higher compounding frequency (monthly/quarterly) slightly increases maturity value.");
    base.push("Tip: For regular income, choose a payout option (monthly/quarterly/yearly). For maximum growth, use cumulative.");
    base.push("Tip: Extending tenure typically increases total interest, but consider liquidity needs.");
    base.push("Tip: Always compare bank FD rates and check premature withdrawal penalties.");
    return base;
  }, [deposit, interestEarned, interestPct]);

  const [activeTip, setActiveTip] = useState<number>(0);
  useEffect(() => {
    if (!tipsForFD.length) return;
    const t = setInterval(() => {
      setActiveTip((prev) => (prev + 1) % tipsForFD.length);
    }, 5000);
    return () => clearInterval(t);
  }, [tipsForFD]);

  /* ============================================================
     🔗 SECTION 6: Share / Copy / Reset
     ============================================================ */
  const copyResults = async () => {
    const text = [
      `FD Summary`,
      `Deposit: ${formatCurrency(deposit, currentLocale, currency)}`,
      `Rate: ${rate}%`,
      `Term: ${years}y ${months}m`,
      `Mode: ${payout === "cumulative" ? `Cumulative (compounding ${compounding})` : `Payout (${payout.replace("-payout", "")})`}`,
      payout === "cumulative"
        ? `Maturity: ${formatCurrency(maturity, currentLocale, currency)}`
        : `Periodic Payout: ${formatCurrency(periodicInterest, currentLocale, currency)} (${payout.replace("-payout","")})`,
      `Total Interest: ${formatCurrency(interestEarned, currentLocale, currency)}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied("results");
    setTimeout(() => setCopied("none"), 1500);
  };

  const copyShareLink = async () => {
    const encoded = btoa(
      JSON.stringify({ deposit, rate, years, months, currency, compounding, payout })
    );
    const url = new URL(window.location.href);
    url.searchParams.set("fd", encoded);
    await navigator.clipboard.writeText(url.toString());
    setCopied("link");
    setTimeout(() => setCopied("none"), 1500);
  };

  const reset = () => {
    setDeposit(0);
    setRate(0);
    setYears(0);
    setMonths(0);
    setCurrency("USD");
    setCompounding("quarterly");
    setPayout("cumulative");
    setShowSchedule(false);
    setGranularity("yearly");
    localStorage.removeItem(LS_KEY);
  };

  /* ============================================================
     🎨 SECTION 7: Render
     ============================================================ */
  const seoNode =
    (seoData as any)?.fdCalculator ?? {
      title: "FD Calculator | Fixed Deposit Maturity & Interest",
      description:
        "Calculate fixed deposit maturity, periodic interest payouts, and growth with compounding across currencies.",
      keywords: ["FD calculator", "fixed deposit", "maturity", "interest", "compounding"],
    };

  return (
    <>
      <SEOHead
        title={seoNode.title}
        description={seoNode.description}
        canonical="https://calculatorhub.site/fd-calculator"
        schemaData={generateCalculatorSchema(
          "FD Calculator",
          seoNode.description,
          "/fd-calculator",
          seoNode.keywords || []
        )}
      />
      {/* ===== Enhanced SEO & Social Metadata ===== */}
      <>
        {/* --- Open Graph --- */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="CalculatorHub" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:title" content={seoNode.title} />
        <meta property="og:description" content={seoNode.description} />
        <meta property="og:url" content="https://calculatorhub.site/fd-calculator" />
        <meta
          property="og:image"
          content="https://calculatorhub.site/images/fd-calculator-hero.webp"
        />
        <meta
          property="og:image:alt"
          content="FD Calculator by CalculatorHub – Maturity, Interest, and Payout Chart"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* --- Twitter --- */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@CalculatorHub" />
        <meta name="twitter:creator" content="@CalculatorHub" />
        <meta name="twitter:title" content={seoNode.title} />
        <meta name="twitter:description" content={seoNode.description} />
        <meta
          name="twitter:image"
          content="https://calculatorhub.site/images/fd-calculator-hero.webp"
        />
        <meta
          name="twitter:image:alt"
          content="Interactive fixed deposit calculator with payout and compounding options"
        />

        {/* --- JSON-LD (WebPage + Breadcrumb + FAQ) --- */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebPage",
                  "@id": "https://calculatorhub.site/fd-calculator",
                  url: "https://calculatorhub.site/fd-calculator",
                  name: "FD Calculator | Fixed Deposit Maturity & Interest Estimator",
                  description: seoNode.description,
                  inLanguage: "en-US",
                  isPartOf: {
                    "@type": "WebSite",
                    name: "CalculatorHub",
                    url: "https://calculatorhub.site",
                  },
                  image: {
                    "@type": "ImageObject",
                    url: "https://calculatorhub.site/images/fd-calculator-hero.webp",
                    width: 1200,
                    height: 630,
                  },
                },
                {
                  "@type": "BreadcrumbList",
                  itemListElement: [
                    {
                      "@type": "ListItem",
                      position: 1,
                      name: "Currency & Finance",
                      item: "https://calculatorhub.site/category/currency-finance",
                    },
                    {
                      "@type": "ListItem",
                      position: 2,
                      name: "FD Calculator",
                      item: "https://calculatorhub.site/fd-calculator",
                    },
                  ],
                },
                {
                  "@type": "FAQPage",
                  mainEntity: [
                    {
                      "@type": "Question",
                      name: "What is a cumulative FD?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text:
                          "In a cumulative FD, interest is compounded and paid at maturity, maximizing the final amount.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "What is a non-cumulative (payout) FD?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text:
                          "Interest is paid out at a fixed frequency (monthly/quarterly/yearly) without compounding. Good for regular income.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Which compounding frequency should I choose?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text:
                          "More frequent compounding (e.g., monthly or quarterly) generally yields slightly higher maturity compared to yearly.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Do you store my data?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text:
                          "No, calculations run locally. We only use localStorage to remember your last session on this device.",
                      },
                    },
                  ],
                },
              ],
            }),
          }}
        />
      </>

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Currency & Finance", url: "/category/currency-finance" },
            { name: "FD Calculator", url: "/fd-calculator" },
          ]}
        />

        {/* ===== Header ===== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">🏦 FD Calculator</h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Calculate your fixed deposit maturity, total interest, or regular interest payouts with
            flexible compounding and currencies. Share or save your scenario instantly.
          </p>
        </div>

        <div className="hidden sm:flex mt-6 mb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white rounded-lg shadow-lg p-4 flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-lg">Compare other finance tools 📊</p>
            <p className="text-sm text-indigo-100">Try our Loan EMI, Mortgage, or Tax tools next!</p>
          </div>
          <a
            href="/category/currency-finance"
            className="bg-white text-indigo-700 font-semibold px-4 py-2 rounded-md hover:bg-indigo-50 transition"
          >
            Explore More Calculators
          </a>
        </div>

        {/* ===== Calculator Grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 relative text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-sky-400" /> Deposit Details
              </h2>
              <button
                onClick={reset}
                className="flex items-center gap-1 text-sm text-slate-300 border border-[#334155] rounded-lg px-2 py-1 hover:bg-[#0f172a] hover:text-white transition"
                disabled={isDefault}
              >
                <RotateCcw className="h-4 w-4 text-indigo-400" /> Reset
              </button>
            </div>

            <div className="space-y-5">
              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Select Currency</label>
                <div className="relative inline-block w-48">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-[#0f172a] text-white text-sm px-3 py-1.5 border border-[#334155] rounded-md focus:ring-2 focus:ring-indigo-500 appearance-none pr-8 hover:border-indigo-400 transition"
                  >
                    {currencyOptions.map((c) => (
                      <option key={c.code} value={c.code} className="text-white">
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                    ▼
                  </span>
                </div>
              </div>

              {/* Deposit */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">
                    Deposit Amount ({findSymbol(currency)})
                  </label>
                  <Info
                    onClick={() => setShowDepositInfo(!showDepositInfo)}
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                  />
                </div>
                {showDepositInfo && (
                  <div className="mb-2 bg-[#0f172a] text-slate-300 text-xs p-2 rounded-md border border-[#334155]">
                    Lump sum you invest in the fixed deposit at the start.
                  </div>
                )}
                <input
                  type="number"
                  value={deposit || ""}
                  placeholder={`Enter deposit in ${findSymbol(currency)}`}
                  min={0}
                  onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Rate */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">Annual Interest Rate (%)</label>
                  <Info
                    onClick={() => setShowRateInfo(!showRateInfo)}
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                  />
                </div>
                {showRateInfo && (
                  <div className="mb-2 bg-[#0f172a] text-slate-300 text-xs p-2 rounded-md border border-[#334155]">
                    Bank's advertised annual percentage rate (APR) for the FD.
                  </div>
                )}
                <input
                  type="number"
                  step="0.01"
                  value={rate || ""}
                  placeholder="Enter annual interest rate"
                  min={0}
                  onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Term */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">Deposit Term</label>
                  <Info
                    onClick={() => setShowTermInfo(!showTermInfo)}
                    className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                  />
                </div>
                {showTermInfo && (
                  <div className="mb-2 bg-[#0f172a] text-slate-300 text-xs p-2 rounded-md border border-[#334155]">
                    Tenure for which your money stays invested.
                  </div>
                )}
                <div className="flex gap-4">
                  <input
                    type="number"
                    value={years || ""}
                    placeholder="Years"
                    min={0}
                    onChange={(e) => setYears(parseInt(e.target.value) || 0)}
                    className="w-1/2 bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    value={months || ""}
                    placeholder="Months"
                    min={0}
                    max={11}
                    onChange={(e) => setMonths(parseInt(e.target.value) || 0)}
                    className="w-1/2 bg-[#0f172a] text-white px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Total duration:{" "}
                  <span className="font-semibold text-indigo-300">{totalMonths || 0}</span> months
                </p>
              </div>

              {/* Compounding / Payout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-slate-300">Compounding</label>
                    <Info
                      onClick={() => setShowCompInfo(!showCompInfo)}
                      className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    />
                  </div>
                  {showCompInfo && (
                    <div className="mb-2 bg-[#0f172a] text-slate-300 text-xs p-2 rounded-md border border-[#334155]">
                      How often interest is added to principal in cumulative mode.
                    </div>
                  )}
                  <select
                    value={compounding}
                    onChange={(e) => setCompounding(e.target.value as any)}
                    className="w-full bg-[#0f172a] text-white px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="half-yearly">Half-yearly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-slate-300">Payout</label>
                    <Info
                      onClick={() => setShowPayoutInfo(!showPayoutInfo)}
                      className="h-4 w-4 text-slate-400 cursor-pointer hover:text-indigo-400"
                    />
                  </div>
                  {showPayoutInfo && (
                    <div className="mb-2 bg-[#0f172a] text-slate-300 text-xs p-2 rounded-md border border-[#334155]">
                      Choose cumulative for growth, or periodic payouts for regular income.
                    </div>
                  )}
                  <select
                    value={payout}
                    onChange={(e) => setPayout(e.target.value as any)}
                    className="w-full bg-[#0f172a] text-white px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="cumulative">Cumulative (no payout)</option>
                    <option value="monthly-payout">Monthly payout</option>
                    <option value="quarterly-payout">Quarterly payout</option>
                    <option value="yearly-payout">Yearly payout</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h2 className="text-xl font-semibold text-white mb-4">FD Summary</h2>
            <div className="space-y-6">
              <div className="text-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                <PiggyBank className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                <div className="text-lg font-semibold text-white">
                  {payout === "cumulative" ? "Estimated Maturity" : "Periodic Interest"}
                </div>
                <div className="text-2xl font-bold text-white">
                  {payout === "cumulative"
                    ? formatCurrency(maturity, currentLocale, currency)
                    : formatCurrency(periodicInterest, currentLocale, currency)}
                </div>
                {payout !== "cumulative" && (
                  <div className="text-sm text-slate-400 capitalize">
                    Frequency: {payout.replace("-payout", "")}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(interestEarned, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Total Interest</div>
                </div>
                <div className="p-4 bg-[#0f172a] rounded-lg text-center border border-[#334155]">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(deposit, currentLocale, currency)}
                  </div>
                  <div className="text-sm text-slate-400">Principal (Deposit)</div>
                </div>
              </div>

              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex justify-between">
                  <span>Term Length:</span>
                  <span className="font-medium text-indigo-300">
                    {years} years {months} months
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Interest Rate:</span>
                  <span className="font-medium text-indigo-300">{rate || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Mode:</span>
                  <span className="font-medium text-indigo-300 capitalize">
                    {payout === "cumulative"
                      ? `Cumulative (${compounding})`
                      : `Payout (${payout.replace("-payout", "")})`}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={copyResults}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm"
                >
                  <Copy size={16} /> Copy Results
                </button>
                <button
                  onClick={copyShareLink}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm"
                >
                  <Share2 size={16} /> Copy Link
                </button>
                {copied !== "none" && (
                  <span className="text-emerald-400 text-sm">
                    {copied === "results" ? "Results copied!" : "Link copied!"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== Smart Tip Box ===== */}
        {deposit > 0 && (
          <div className="mt-4 w-full relative">
            <div className="bg-[#1e293b] border border-[#334155] text-slate-200 px-6 py-4 rounded-md shadow-sm min-h-[50px] w-full flex items-center">
              <div className="mr-3 flex items-center justify-center w-8 h-8">
                <span className="text-2xl text-indigo-400">💡</span>
              </div>
              <div className="w-full">
                <p className="text-base font-medium leading-snug text-slate-300">{tipsForFD[activeTip]}</p>
              </div>
            </div>
          </div>
        )}

        {/* ===== Chart + Quick Summary ===== */}
        {deposit > 0 && totalMonths > 0 && (
          <div className="mt-5 bg-[#1e293b] rounded-xl shadow-md border border-[#334155] p-6 text-slate-200">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">FD Insights & Breakdown</h3>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Chart Left */}
              <div className="w-[90%] sm:w-[80%] md:w-[70%] max-w-[360px] h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={2}>
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={["#3b82f6", "#a855f7"][index % 2]} />
                      ))}
                    </Pie>
                    <ReTooltip
                      formatter={(v: any) => formatCurrency(Number(v), currentLocale, currency)}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Summary Right */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-indigo-500 transition">
                  <p className="text-sm text-slate-400">Deposit</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(deposit, currentLocale, currency)}
                  </p>
                </div>

                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-emerald-500 transition">
                  <p className="text-sm text-slate-400">Total Interest</p>
                  <p className="font-semibold text-white text-lg">
                    {formatCurrency(interestEarned, currentLocale, currency)}
                  </p>
                </div>

                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-rose-500 transition">
                  <p className="text-sm text-slate-400">
                    {payout === "cumulative" ? "Maturity Value" : "Per-period Interest"}
                  </p>
                  <p className="font-semibold text-white text-lg">
                    {payout === "cumulative"
                      ? formatCurrency(maturity, currentLocale, currency)
                      : formatCurrency(periodicInterest, currentLocale, currency)}
                  </p>
                </div>

                <div className="p-4 bg-[#0f172a] border border-[#334155] rounded-lg text-center shadow-sm hover:border-indigo-500 transition">
                  <p className="text-sm text-slate-400">Mode</p>
                  <p className="font-semibold text-white text-lg capitalize">
                    {payout === "cumulative"
                      ? `Cumulative (${compounding})`
                      : `Payout (${payout.replace("-payout", "")})`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Earnings / Balance Schedule ===== */}
        {deposit > 0 && totalMonths > 0 && (
          <div className="mt-10 bg-gradient-to-br from-[#1e293b] via-[#111827] to-[#0f172a] rounded-2xl border border-indigo-600/40 shadow-xl overflow-hidden">
            {/* Header Button */}
            <button
              onClick={() => setShowSchedule((v) => !v)}
              className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold text-lg tracking-wide hover:opacity-90 transition-all"
            >
              <span>📈 Growth / Payout Schedule</span>
              {showSchedule ? <ChevronUp /> : <ChevronDown />}
            </button>

            {/* Collapsible Content */}
            {showSchedule && (
              <div className="px-6 pb-8 pt-4">
                {/* Controls */}
                <div className="flex items-center gap-4 mb-5">
                  <label className="text-sm text-slate-300">Granularity:</label>
                  <select
                    value={granularity}
                    onChange={(e) => setGranularity(e.target.value as "yearly" | "monthly")}
                    className="px-3 py-2 bg-[#0f172a] border border-indigo-500/40 rounded-md text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  >
                    <option value="yearly">Yearly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-[#334155] shadow-inner">
                  <table className="min-w-full text-sm text-slate-100">
                    <thead className="bg-[#0f172a]">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-indigo-300">
                          {granularity === "yearly" ? "Year" : "Month"}
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-emerald-300">
                          Interest {payout !== "cumulative" && "(Paid)"}
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-cyan-300">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((r, i) => (
                        <tr
                          key={r.period}
                          className={`transition-colors duration-200 ${
                            i % 2 === 0 ? "bg-[#1e293b]/60" : "bg-[#0f172a]/60"
                          } hover:bg-[#3b82f6]/10`}
                        >
                          <td className="px-4 py-2">{r.period}</td>
                          <td className="px-4 py-2 text-right text-emerald-300 font-medium">
                            {formatCurrency(r.interest, currentLocale, currency)}
                          </td>
                          <td className="px-4 py-2 text-right text-cyan-300 font-medium">
                            {formatCurrency(r.balance, currentLocale, currency)}
                          </td>
                        </tr>
                      ))}
                      {schedule.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-slate-400 italic">
                            Enter valid details to view schedule.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Subtle Footer Glow */}
                <div className="h-2 w-full mt-6 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 blur-[2px]" />
              </div>
            )}
          </div>
        )}

        {/* ==================== SEO CONTENT SECTION ==================== */}
        <section className="prose prose-invert max-w-4xl mx-auto mt-16 leading-relaxed text-slate-300">
          {/* ===== Table of Contents ===== */}
          <nav className="mt-16 mb-8 bg-[#0f172a] border border-[#334155] rounded-xl p-5 text-slate-200">
            <h2 className="text-lg font-semibold text-cyan-300 mb-3">📖 Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <a href="#how-fd" className="text-indigo-400 hover:underline">
                  How FD Returns are Calculated
                </a>
              </li>
              <li>
                <a href="#how-to-use" className="text-indigo-400 hover:underline">
                  How to Use This FD Calculator
                </a>
              </li>
              <li>
                <a href="#example" className="text-indigo-400 hover:underline">
                  Example Calculation
                </a>
              </li>
              <li>
                <a href="#faq" className="text-indigo-400 hover:underline">
                  Frequently Asked Questions
                </a>
              </li>
            </ol>
          </nav>

          <h1 className="text-3xl font-bold text-cyan-400 mb-6">
            Fixed Deposit (FD) Calculator 2025 – Maturity & Payout Estimator
          </h1>

          <p>
            The <strong>FD Calculator by CalculatorHub</strong> helps you estimate{" "}
            <strong>maturity value</strong>, <strong>total interest</strong>, and{" "}
            <strong>regular interest payouts</strong> for fixed deposits across multiple currencies.
            Choose between <em>cumulative</em> and <em>payout</em> modes and adjust compounding to match
            your bank’s offering.
          </p>

          <figure className="my-8">
            <img
              src="/images/fd-calculator-hero.webp"
              alt="Modern FD calculator UI showing maturity pie chart and payout schedule"
              title="FD Calculator 2025 | Maturity & Interest Estimator"
              className="rounded-lg shadow-md border border-slate-700 mx-auto"
              loading="lazy"
            />
            <figcaption className="text-center text-sm text-slate-400 mt-2">
              Visual representation of the FD Calculator with dark-finance UI.
            </figcaption>
          </figure>

          {/* ===== Step-by-step math card ===== */}
          <h2
            id="how-fd"
            className="mt-12 mb-3 text-2xl font-extrabold tracking-tight text-center sm:text-left"
          >
            <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
              🧮 How FD Returns are Calculated
            </span>
          </h2>

          <div className="relative rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-[#0b1220]/90 p-4 sm:p-6 ring-1 ring-indigo-500/30 shadow-xl text-[13.5px] sm:text-sm leading-relaxed">
            <div className="pointer-events-none absolute inset-x-0 -top-0.5 h-0.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-emerald-500 opacity-60" />

            {fdSteps.mode === "cumulative" ? (
              <>
                <p className="mb-4 text-center font-mono text-[15px] leading-7 text-indigo-300">
                  A = <span className="text-sky-300">P × (1 + r/m)<sup>m×t</sup></span>
                </p>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 mb-4">
                  <div className="flex justify-between gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-cyan-500/20">
                    <span className="font-semibold text-cyan-300">P</span>
                    <span className="font-semibold text-white truncate">
                      {formatCurrency(fdSteps.P, currentLocale, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-amber-500/20">
                    <span className="font-semibold text-amber-300">r</span>
                    <span className="font-semibold text-white truncate">{fdSteps.rYear.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-fuchsia-500/20">
                    <span className="font-semibold text-fuchsia-300">m</span>
                    <span className="font-semibold text-white truncate">{fdSteps.m}</span>
                  </div>
                  <div className="flex justify-between gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-emerald-500/20">
                    <span className="font-semibold text-emerald-300">t</span>
                    <span className="font-semibold text-white truncate">{fdSteps.tYears.toFixed(4)}</span>
                  </div>
                </div>

                <div className="space-y-2 font-mono break-words">
                  <div className="flex justify-between">
                    <span className="font-semibold text-indigo-300">(1 + r/m)</span>
                    <span className="text-white">{fdSteps.onePlus.toFixed(9)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-rose-300">(1 + r/m)<sup>m×t</sup></span>
                    <span className="text-white">{fdSteps.pow.toFixed(9)}</span>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-slate-300 text-[13px] whitespace-nowrap overflow-auto">
                  <div className="min-w-max">
                    <span className="font-semibold text-slate-100">A</span> ={" "}
                    <span className="text-white">
                      {formatCurrency(fdSteps.P, currentLocale, currency)}
                    </span>{" "}
                    × <span className="text-white">{fdSteps.pow.toFixed(6)}</span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center">
                    <div className="text-emerald-300 text-xs uppercase">Maturity</div>
                    <div className="font-semibold text-white text-sm truncate">
                      {formatCurrency(fdSteps.A, currentLocale, currency)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center">
                    <div className="text-rose-300 text-xs uppercase">Interest</div>
                    <div className="font-semibold text-white text-sm truncate">
                      {formatCurrency(fdSteps.interest, currentLocale, currency)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-center">
                    <div className="text-sky-300 text-xs uppercase">Compounding</div>
                    <div className="font-semibold text-white text-sm truncate">{compounding}</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="mb-4 text-center font-mono text-[15px] leading-7 text-indigo-300">
                  Per-period interest = <span className="text-sky-300">P × r / m<sub>pay</sub></span>
                </p>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 mb-4">
                  <div className="flex justify-between gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-cyan-500/20">
                    <span className="font-semibold text-cyan-300">P</span>
                    <span className="font-semibold text-white truncate">
                      {formatCurrency(fdSteps.P, currentLocale, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-amber-500/20">
                    <span className="font-semibold text-amber-300">r</span>
                    <span className="font-semibold text-white truncate">{fdSteps.rYear.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-fuchsia-500/20">
                    <span className="font-semibold text-fuchsia-300">mₚₐᵧ</span>
                    <span className="font-semibold text-white truncate">{fdSteps.mPay}</span>
                  </div>
                  <div className="flex justify-between gap-2 bg-[#0f172a] px-3 py-2 rounded-lg border border-emerald-500/20">
                    <span className="font-semibold text-emerald-300">Periods</span>
                    <span className="font-semibold text-white truncate">{fdSteps.nPeriods}</span>
                  </div>
                </div>

                <div className="space-y-2 font-mono break-words">
                  <div className="flex justify-between">
                    <span className="font-semibold text-indigo-300">Per-period</span>
                    <span className="text-white">
                      {formatCurrency(fdSteps.per, currentLocale, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-rose-300">Total Interest</span>
                    <span className="text-white">
                      {formatCurrency(fdSteps.totalInterest, currentLocale, currency)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center">
                    <div className="text-emerald-300 text-xs uppercase">Per-period</div>
                    <div className="font-semibold text-white text-sm truncate">
                      {formatCurrency(fdSteps.per, currentLocale, currency)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center">
                    <div className="text-rose-300 text-xs uppercase">Total Interest</div>
                    <div className="font-semibold text-white text-sm truncate">
                      {formatCurrency(fdSteps.totalInterest, currentLocale, currency)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-center">
                    <div className="text-sky-300 text-xs uppercase">Maturity</div>
                    <div className="font-semibold text-white text-sm truncate">
                      {formatCurrency(fdSteps.A, currentLocale, currency)}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <h2 id="how-to-use" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            💡 How to Use This FD Calculator
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Select your <strong>currency</strong>.</li>
            <li>Enter <strong>deposit amount</strong> and <strong>annual interest rate</strong>.</li>
            <li>Set the <strong>term</strong> in years and months.</li>
            <li>Choose <strong>cumulative</strong> or <strong>payout</strong> and compounding.</li>
            <li>Copy results or share a link with your configuration.</li>
          </ol>

          <h2 id="example" className="text-2xl font-semibold text-cyan-300 mt-10 mb-4">
            📘 Example Calculation
          </h2>
          <p>
            Suppose you invest <strong>$10,000</strong> at <strong>7%</strong> for <strong>3 years</strong> with{" "}
            <strong>quarterly compounding</strong> in cumulative mode. Your maturity will be around{" "}
            <em>(illustrative)</em>{" "}
            <strong>
              {formatCurrency(10000 * Math.pow(1 + 0.07 / 4, 4 * 3), "en-US", "USD")}
            </strong>
            , and the interest earned is maturity minus principal.
          </p>

          {/* ===================== FAQ SECTION ===================== */}
          <section id="faq" className="space-y-6 mt-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-cyan-300">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>

            <div className="space-y-5 text-lg text-slate-100 leading-relaxed max-w-4xl mx-auto">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q1: Which is better—cumulative or payout?</h3>
                <p>
                  Cumulative generally gives a higher maturity due to compounding. Payout is ideal if you
                  want steady income during the term.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q2: Does compounding really matter?</h3>
                <p>
                  Yes, more frequent compounding (monthly/quarterly) slightly boosts the maturity compared
                  to yearly compounding for the same APR and tenure.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q3: Can I share my results?</h3>
                <p>
                  Use the <strong>Copy Link</strong> button to copy a URL with your inputs encoded. Opening
                  that link will restore the same scenario.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-sm">
                <h3 className="font-semibold text-xl mb-2 text-yellow-300">Q4: Do you store my data?</h3>
                <p>
                  No. All calculations run locally in your browser. We only use <strong>localStorage</strong>{" "}
                  to remember your last session on your device for convenience.
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
              alt="CalculatorHub Finance Tools Team"
              className="w-12 h-12 rounded-full border border-gray-600"
              loading="lazy"
            />
            <div>
              <p className="font-semibold text-white">Written by the CalculatorHub Finance Tools Team</p>
              <p className="text-sm text-slate-400">
                Experts in savings and online financial tools. Last updated:{" "}
                <time dateTime="2025-10-17">October 17, 2025</time>.
              </p>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/70 rounded-lg border border-slate-700 shadow-inner p-4">
            <p className="text-slate-300 text-sm mb-2 font-medium tracking-wide">
              🚀 Explore more finance tools on CalculatorHub:
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <a
                href="/mortgage-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-400 px-3 py-2 rounded-md border border-slate-700 hover:border-indigo-500 transition-all duration-200"
              >
                <span className="text-indigo-400">🏠</span> Mortgage Calculator
              </a>
              <a
                href="/loan-emi-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-400 px-3 py-2 rounded-md border border-slate-700 hover:border-emerald-500 transition-all duration-200"
              >
                <span className="text-emerald-400">💰</span> Loan EMI Calculator
              </a>
              <a
                href="/tax-calculator"
                className="flex items-center gap-2 bg-[#0f172a] hover:bg-fuchsia-600/20 text-fuchsia-300 hover:text-fuchsia-400 px-3 py-2 rounded-md border border-slate-700 hover:border-fuchsia-500 transition-all duration-200"
              >
                <span className="text-fuchsia-400">🧾</span> Income Tax Calculator
              </a>
            </div>
          </div>
        </section>

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/fd-calculator" category="currency-finance" />
      </div>
    </>
  );
};

export default FDCalculator;
