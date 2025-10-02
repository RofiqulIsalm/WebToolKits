import React from 'react';
import { Link } from 'react-router-dom';
import { toolsData } from '../data/toolsData';

interface RelatedCalculatorsProps {
  currentPath: string;
  category?: string;
  limit?: number;
}

const RelatedCalculators: React.FC<RelatedCalculatorsProps> = ({ 
  currentPath, 
  category,
  limit = 3 
}) => {
  // Find related calculators
  const getRelatedCalculators = () => {
    let relatedTools: any[] = [];

    if (category) {
      // Find tools in the same category
      const categoryData = toolsData.find(cat => cat.slug === category);
      if (categoryData) {
        relatedTools = categoryData.tools.filter(tool => tool.path !== currentPath);
      }
    }

    // If not enough related tools, add popular calculators
    if (relatedTools.length < limit) {
      const allTools = toolsData.flatMap(cat => cat.tools);
      const popularTools = allTools
        .filter(tool => tool.popular && tool.path !== currentPath)
        .filter(tool => !relatedTools.some(related => related.path === tool.path));
      
      relatedTools = [...relatedTools, ...popularTools];
    }

    // If still not enough, add random tools
    if (relatedTools.length < limit) {
      const allTools = toolsData.flatMap(cat => cat.tools);
      const randomTools = allTools
        .filter(tool => tool.path !== currentPath)
        .filter(tool => !relatedTools.some(related => related.path === tool.path))
        .sort(() => Math.random() - 0.5);
      
      relatedTools = [...relatedTools, ...randomTools];
    }

    return relatedTools.slice(0, limit);
  };

  const relatedCalculators = getRelatedCalculators();

  if (relatedCalculators.length === 0) return null;

  return (
    <div className="mt-12 glow-card rounded-lg p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Related Calculators</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {relatedCalculators.map((tool) => (
          <Link
            key={tool.path}
            to={tool.path}
            className={`${tool.color} p-4 rounded-lg transition-all duration-300 hover:scale-105 group`}
          >
            <div className="flex items-center space-x-3">
              <tool.icon className="h-6 w-6 text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
              <div>
                <h4 className="font-medium text-white group-hover:text-blue-100 transition-colors text-sm">
                  {tool.name}
                </h4>
                <p className="text-xs text-slate-300 group-hover:text-slate-200 transition-colors mt-1">
                  {tool.description.substring(0, 50)}...
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedCalculators;