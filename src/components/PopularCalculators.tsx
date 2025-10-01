
import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { useViewTracking } from '../hooks/useViewTracking';
import { toolsData } from '../data/toolsData';

const PopularCalculators: React.FC = () => {
  const { getTopCalculators } = useViewTracking();
  const topCalculators = getTopCalculators(6);

  // Get calculator details from toolsData
  const getCalculatorDetails = (path: string) => {
    for (const category of toolsData) {
      const tool = category.tools.find(t => t.path === path);
      if (tool) return tool;
    }
    return null;
  };

  // If no view data yet, show default popular calculators
  const defaultPopular = [
    '/currency-converter',
    '/bmi-calculator',
    '/loan-emi-calculator',
    '/temperature-converter',
    '/percentage-calculator',
    '/length-converter'
  ];

  const calculatorsToShow = topCalculators.length > 0 
    ? topCalculators.map(({ path, views }) => ({ path, views }))
    : defaultPopular.map(path => ({ path, views: 0 }));

  return (
    <div className="glow-card rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-blue-400 drop-shadow-lg" />
        <h3 className="text-lg font-semibold text-white">Popular Calculators</h3>
      </div>
      
      <div className="flex flex-col gap-3">
        {calculatorsToShow.map(({ path, views }, index) => {
          const calculator = getCalculatorDetails(path);
          if (!calculator) return null;

          const Icon = calculator.icon;

          return (
            <Link
              key={path}
              to={path}
              className="block p-3 bg-slate-700/30 hover:bg-slate-600/40 rounded-lg transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 relative">
                  <Icon className="h-5 w-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white group-hover:text-blue-100 transition-colors truncate">
                    {calculator.name}
                  </h4>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-600/30">
        <p className="text-xs text-slate-400 text-center">
          Rankings update based on usage
        </p>
      </div>
    </div>
  );
};

export default PopularCalculators;
