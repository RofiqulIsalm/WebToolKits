import React from 'react';

interface AdBannerProps {
  type: 'top' | 'sidebar' | 'bottom';
}

const AdBanner: React.FC<AdBannerProps> = ({ type }) => {
  const getAdSize = () => {
    switch (type) {
      case 'top':
        return 'h-24 w-full';
      case 'sidebar':
        return 'h-96 w-full';
      case 'bottom':
        return 'h-20 w-full';
      default:
        return 'h-24 w-full';
    }
  };

  return (
    <div className={`glow-card rounded-lg flex items-center justify-center ${getAdSize()} my-4`}>
      <div className="text-center">
        <p className="text-slate-400 text-sm">Advertisement</p>
        <p className="text-slate-500 text-xs mt-1">Google AdSense</p>
      </div>
    </div>
  );
};

export default AdBanner;