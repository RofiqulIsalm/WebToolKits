import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useViewTracking } from '../hooks/useViewTracking';

const ViewTracker: React.FC = () => {
  const location = useLocation();
  const { trackView } = useViewTracking();

  useEffect(() => {
    // Track view when location changes
    if (location.pathname !== '/') {
      trackView(location.pathname);
    }
  }, [location.pathname, trackView]);

  return null; // This component doesn't render anything
};

export default ViewTracker;