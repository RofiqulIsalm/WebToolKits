// src/config/siteConfig.tsx
import React, { createContext, useContext, useEffect, useState } from "react";

export type NavLink = {
  name: string;
  slug: string;
};

export type FooterLink = {
  label: string;
  url: string;
};

export interface SiteConfigState {
  quickAccess: NavLink[];        // Sidebar "Quick Access"
  popularSidebar: NavLink[];     // Sidebar "Popular Calculators" (sidebar)
  footerPopular: NavLink[];      // Footer "Popular Calculators"
  footerDescription: string;     // Footer description text
  socialLinks: FooterLink[];     // Footer social links
}

const STORAGE_KEY = "calculatorhub_site_config_v1";

// ✅ Default values (your current setup)
const defaultConfig: SiteConfigState = {
  quickAccess: [
    { name: "Currency Converter", slug: "/currency-converter" },
    { name: "Loan EMI Calculator", slug: "/loan-emi-calculator" },
    { name: "Tax Calculator", slug: "/tax-calculator" },
    { name: "Age Calculator", slug: "/age-calculator" },
  ],
  popularSidebar: [
    { name: "Percentage Calculator", slug: "/percentage-calculator" },
    { name: "Compound Interest Calculator", slug: "/compound-interest-calculator" },
    { name: "SIP Calculator", slug: "/sip-calculator" },
    { name: "BMI Calculator", slug: "/bmi-calculator" },
  ],
  footerPopular: [
    {
      name: "Currency Converter – Live Exchange Rates",
      slug: "/currency-converter",
    },
    {
      name: "BMI Calculator – Body Mass Index",
      slug: "/bmi-calculator",
    },
    {
      name: "Loan EMI Calculator – Monthly Payments",
      slug: "/loan-emi-calculator",
    },
    {
      name: "Temperature Converter – Celsius, Fahrenheit & Kelvin",
      slug: "/temperature-converter",
    },
    {
      name: "Percentage Calculator – Quick & Accurate",
      slug: "/percentage-calculator",
    },
  ],
  footerDescription:
    "Discover 100% free online calculators and converters for finance, health, math, and daily life. CalculatorHub helps you solve problems instantly—fast, accurate, and privacy-friendly with no signup required.",
  socialLinks: [
    { label: "Twitter / X", url: "https://x.com" },
    { label: "Facebook", url: "https://facebook.com" },
    { label: "LinkedIn", url: "https://linkedin.com" },
  ],
};

function safeLoadConfig(): SiteConfigState {
  if (typeof window === "undefined") return defaultConfig;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultConfig;
    const parsed = JSON.parse(raw);

    return {
      ...defaultConfig,
      ...parsed,
      quickAccess: parsed.quickAccess ?? defaultConfig.quickAccess,
      popularSidebar: parsed.popularSidebar ?? defaultConfig.popularSidebar,
      footerPopular: parsed.footerPopular ?? defaultConfig.footerPopular,
      footerDescription:
        parsed.footerDescription ?? defaultConfig.footerDescription,
      socialLinks: parsed.socialLinks ?? defaultConfig.socialLinks,
    };
  } catch {
    return defaultConfig;
  }
}

function saveConfig(config: SiteConfigState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore storage errors
  }
}

type SiteConfigContextValue = {
  config: SiteConfigState;
  setConfig: React.Dispatch<React.SetStateAction<SiteConfigState>>;
};

const SiteConfigContext = createContext<SiteConfigContextValue | undefined>(
  undefined
);

export const SiteConfigProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [config, setConfig] = useState<SiteConfigState>(() => safeLoadConfig());

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  return (
    <SiteConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </SiteConfigContext.Provider>
  );
};

export function useSiteConfig(): SiteConfigContextValue {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) {
    throw new Error("useSiteConfig must be used inside SiteConfigProvider");
  }
  return ctx;
}
