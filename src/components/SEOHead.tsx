import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  schemaData?: object;
  breadcrumbs?: Array<{
    name: string;
    url: string;
  }>;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  canonical,
  ogType = 'website',
  ogImage = '/calculator-hub-og.jpg',
  schemaData,
  breadcrumbs
}) => {
  const fullTitle = `${title} | CalculatorHub`;
  const currentUrl = canonical || `https://calculatorhub.com${window.location.pathname}`;
  
  // Website schema for homepage
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "CalculatorHub",
    "url": "https://calculatorhub.com",
    "description": "Free online calculators and converters for daily use. 64+ tools including currency converter, unit converters, finance calculators, math tools, and more.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://calculatorhub.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  // Breadcrumb schema
  const breadcrumbSchema = breadcrumbs ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": `https://calculatorhub.com${crumb.url}`
    }))
  } : null;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={`https://calculatorhub.com${ogImage}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`https://calculatorhub.com${ogImage}`} />
      <meta name="twitter:site" content="@CalculatorHub" />
      <meta name="twitter:creator" content="@CalculatorHub" />

      {/* Additional Meta Tags */}
      <meta name="author" content="CalculatorHub" />
      <meta name="theme-color" content="#3b82f6" />

      {/* Schema.org Structured Data */}
      {schemaData && (
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      )}
      
      {/* Website Schema for homepage */}
      {window.location.pathname === '/' && (
        <script type="application/ld+json">
          {JSON.stringify(websiteSchema)}
        </script>
      )}

      {/* Breadcrumb Schema */}
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;