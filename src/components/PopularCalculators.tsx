import React from 'react';
import { Link } from 'react-router-dom';
import { useViewTracking } from '../hooks/useViewTracking';
import { toolsData } from '../data/toolsData';
import { TrendingUp, Eye } from 'lucide-react';

const PopularCalculators: React.FC = () => {
  const { getTopCalculators } = useViewTracking();
  const topCalculators = getTopCalculators(6);

  // Get tool details from toolsData
  const getToolDetails = (path: string) => {
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
    '/percentage-calculator',
    '/age-calculator',
    '/qr-code-generator'
  ];

  const calculatorsToShow = topCalculators.length > 0 
    ? topCalculators.map(item => ({ ...item, tool: getToolDetails(item.path) })).filter(item => item.tool)
    : defaultPopular.map(path => ({ path, count: 0, tool: getToolDetails(path) })).filter(item => item.tool);

  if (calculatorsToShow.length === 0) return null;

  return (
    <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="h-5 w-5 text-blue-400" />
        <h3 className="font-semibold text-white">Popular Calculators</h3>
        <span className="text-xs text-slate-400">(Most Viewed)</span>
      </div>
      
      <div className="space-y-2">
        {calculatorsToShow.slice(0, 6).map((item, index) => {
          const tool = item.tool;
          if (!tool) return null;

          return (
            <Link
              key={tool.path}
              to={tool.path}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-700/50 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
                  {index + 1}
                </div>
                <tool.icon className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                  {tool.name}
                </span>
              </div>
              
              {topCalculators.length > 0 && item.count > 0 && (
                <div className="flex items-center space-x-1 text-xs text-slate-500">
                  <Eye className="h-3 w-3" />
                  <span>{item.count}</span>
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {topCalculators.length === 0 && (
        <p className="text-xs text-slate-500 mt-2 italic">
          View counts will appear as you use calculators
        </p>
      )}
    </div>
  );
};

export default PopularCalculators;