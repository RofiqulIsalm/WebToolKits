import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// 1. Define the Measurement ID (Replace with your actual ID)
//    You can also move this to a config file or environment variable.
const GA_MEASUREMENT_ID = 'G-DDWPSK5Z3M';

const GoogleAnalytics: React.FC = () => {
    const location = useLocation();

    useEffect(() => {
        // Initialize Google Analytics only once
        if (!window.gtag) {
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
            document.head.appendChild(script);

            const inlineScript = document.createElement('script');
            inlineScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_MEASUREMENT_ID}');
      `;
            document.head.appendChild(inlineScript);
        }
    }, []);

    useEffect(() => {
        // Send pageview on route change
        if (window.gtag) {
            window.gtag('config', GA_MEASUREMENT_ID, {
                page_path: location.pathname + location.search,
            });
        }
    }, [location]);

    return null;
};

// Add types for window.gtag
declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        dataLayer: any[];
    }
}

export default GoogleAnalytics;
