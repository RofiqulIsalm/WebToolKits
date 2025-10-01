import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useViewTracking } from "../hooks/useViewTracking";

const ViewTracker: React.FC = () => {
  const location = useLocation();
  const { trackView } = useViewTracking();

  useEffect(() => {
    // Don't track the homepage, category pages, or legal pages
    if (
      location.pathname !== "/" &&
      !location.pathname.startsWith("/category/") &&
      !["/privacy-policy", "/terms-of-service", "/contact-us"].includes(location.pathname)
    ) {
      trackView(location.pathname);
    }
  }, [location.pathname, trackView]);

  return null; // invisible component
};

export default ViewTracker;
