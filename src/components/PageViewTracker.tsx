// src/components/PageViewTracker.tsx
import React from "react";
import { useLocation } from "react-router-dom";
import { recordCalculatorView } from "../utils/calculatorStats";

const PageViewTracker: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    // Only track real tool pages, not admin pages
    if (!location.pathname.startsWith("/admin")) {
      recordCalculatorView(location.pathname);
    }
  }, [location.pathname]);

  return null;
};

export default PageViewTracker;
