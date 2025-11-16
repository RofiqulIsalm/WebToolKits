// src/components/AdBanner.tsx
import React, { useEffect } from "react";

interface AdBannerProps {
  type?: "top" | "sidebar" | "bottom";
}

const AD_CLIENT = "ca-pub-6901457916108884"; // 🔹 REPLACE with your AdSense publisher ID

// 🔹 Give each placement its own slot ID from AdSense
const AD_SLOTS: Record<NonNullable<AdBannerProps["type"]>, string> = {
  top: "3985444671",     // e.g. top banner slot
  sidebar: "5166664408", // e.g. sidebar rectangle slot
  bottom: "7715423234",  // e.g. bottom banner slot
};

const AdBanner: React.FC<AdBannerProps> = ({ type = "bottom" }) => {
  const getWrapperSize = () => {
    switch (type) {
      case "top":
        return "min-h-[90px]";
      case "sidebar":
        return "min-h-[250px]";
      case "bottom":
      default:
        return "min-h-[80px]";
    }
  };

  useEffect(() => {
    // ✅ Load AdSense script only once
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-adsbygoogle-loaded="true"]'
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.async = true;
      script.src =
        "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
        AD_CLIENT;
      script.crossOrigin = "anonymous";
      script.setAttribute("data-adsbygoogle-loaded", "true");
      document.body.appendChild(script);
    }

    // ✅ Try to render the ad
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn("AdSense rendering error:", e);
    }
  }, [type]);

  const slotId = AD_SLOTS[type];

  return (
    <div
      className={`my-4 flex items-center justify-center w-full ${getWrapperSize()}`}
    >
      <div className="glow-card rounded-lg w-full h-full flex items-center justify-center">
        {slotId ? (
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client={AD_CLIENT}
            data-ad-slot={slotId}
            data-ad-format="auto"
            data-full-width-responsive="true"
          ></ins>
        ) : (
          <div className="text-center py-4">
            <p className="text-slate-400 text-sm">Advertisement</p>
            <p className="text-slate-500 text-xs mt-1">
              Ads may be blocked or not configured yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdBanner;
