// src/components/RelatedCalculators.tsx
import React from "react";
import { Link } from "react-router-dom";
import { toolsData } from "../data/toolsData";

interface RelatedCalculatorsProps {
  currentPath: string;
  category?: string;
  limit?: number;
}

// Infer the tool type from toolsData
type Tool = (typeof toolsData)[number]["tools"][number];

const RelatedCalculators: React.FC<RelatedCalculatorsProps> = ({
  currentPath,
  category,
  limit = 3,
}) => {
  const getRelatedCalculators = (): Tool[] => {
    let relatedTools: Tool[] = [];

    // 1) Same category
    if (category) {
      const categoryData = toolsData.find((cat) => cat.slug === category);
      if (categoryData) {
        relatedTools = categoryData.tools.filter(
          (tool) => tool.path !== currentPath
        );
      }
    }

    const allTools: Tool[] = toolsData.flatMap((cat) => cat.tools);

    // 2) Fill with popular tools (not already included)
    if (relatedTools.length < limit) {
      const popularTools = allTools
        .filter((tool) => tool.popular && tool.path !== currentPath)
        .filter(
          (tool) =>
            !relatedTools.some((related) => related.path === tool.path)
        );

      relatedTools = [...relatedTools, ...popularTools];
    }

    // 3) If still not enough, fill with random tools
    if (relatedTools.length < limit) {
      const remainingTools = allTools
        .filter((tool) => tool.path !== currentPath)
        .filter(
          (tool) =>
            !relatedTools.some((related) => related.path === tool.path)
        )
        .sort(() => Math.random() - 0.5);

      relatedTools = [...relatedTools, ...remainingTools];
    }

    return relatedTools.slice(0, limit);
  };

  const relatedCalculators = getRelatedCalculators();

  if (!relatedCalculators.length) return null;

  return (
    <div className="mt-12 glow-card rounded-2xl p-6 bg-slate-950/90 border border-slate-800/80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-semibold text-white">
          Related Calculators
        </h3>
        <span className="text-[11px] sm:text-xs text-slate-400">
          Based on this tool & category
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {relatedCalculators.map((tool) => {
          const shortDesc =
            tool.description?.length > 70
              ? `${tool.description.slice(0, 67)}...`
              : tool.description;

          return (
            <Link
              key={tool.path}
              to={tool.path}
              className={`${tool.color} p-4 rounded-xl transition-all duration-200 hover:scale-[1.03] hover:-translate-y-0.5 group border border-white/5`}
            >
              <div className="flex items-start gap-3">
                {tool.icon && (
                  <tool.icon className="h-6 w-6 text-white/90 drop-shadow-md group-hover:scale-110 transition-transform" />
                )}
                <div className="space-y-1">
                  <h4 className="font-medium text-sm sm:text-[15px] text-white group-hover:text-blue-50 transition-colors">
                    {tool.name}
                  </h4>
                  {shortDesc && (
                    <p className="text-xs text-slate-200/80 group-hover:text-slate-100/90 leading-snug">
                      {shortDesc}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default RelatedCalculators;
