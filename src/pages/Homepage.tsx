import React from 'react';
import { Link } from 'react-router-dom';
import { toolsData, getPopularCalculators } from '../data/toolsData';
import { ArrowRight, TrendingUp } from 'lucide-react';

const Homepage: React.FC = () => {
  const popularCalculators = getPopularCalculators();

  return (
    <div>
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-2xl">
          Daily Tools Hub
        </h1>
        <p className="text-xl text-slate-300 mb-8">
          Free online calculators and converters for daily use
        </p>
        <div className="flex items-center justify-center text-sm text-slate-400 space-x-4">
          <span>✓ No signup required</span>
          <span>✓ Privacy-friendly</span>
          <span>✓ Completely free</span>
        </div>
      </div>

      {/* Popular Calculators Section */}
      <div className="mb-16">
        <div className="flex items-center justify-center mb-8">
          <TrendingUp className="h-6 w-6 text-blue-400 mr-2 drop-shadow-lg" />
          <h2 className="text-2xl font-bold text-white drop-shadow-lg">
            Most Popular Calculators
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularCalculators.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className={`${tool.color} p-6 rounded-lg transition-all duration-300 hover:scale-105 group`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <tool.icon className="h-8 w-8 text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-2 group-hover:text-blue-100 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors">
                    {tool.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Categories Section */}
      <div className="space-y-12">
        {toolsData.map((category) => (
          <div key={category.category}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                {category.category}
              </h2>
              <Link
                to={`/category/${category.slug}`}
                className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors group"
              >
                <span className="text-sm font-medium">View All</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {/* Show first 3 tools from each category */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.tools.slice(0, 3).map((tool) => (
                <Link
                  key={tool.path}
                  to={tool.path}
                  className={`${tool.color} p-6 rounded-lg transition-all duration-300 hover:scale-105 group`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <tool.icon className="h-8 w-8 text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-2 group-hover:text-blue-100 transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA Section */}
      <div className="mt-16 glow-card rounded-lg p-8 text-center">
        <h3 className="text-xl font-semibold text-white mb-2">
          Need a specific calculator?
        </h3>
        <p className="text-slate-300 mb-4">
          Browse our complete collection of {toolsData.reduce((total, category) => total + category.tools.length, 0)} calculators and tools.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {toolsData.map((category) => (
            <Link
              key={category.slug}
              to={`/category/${category.slug}`}
              className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg transition-colors text-sm"
            >
              {category.category} ({category.tools.length})
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Homepage;