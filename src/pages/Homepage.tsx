import React from 'react';
import { Link } from 'react-router-dom';
import { toolsData } from '../data/toolsData';
import { Search, ArrowRight } from 'lucide-react';

const Homepage: React.FC = () => {
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

      {/* Tools Grid */}
      <div className="space-y-12">
        {toolsData.map((category) => (
          <div key={category.category}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                {category.category}
              </h2>
              <Link
                to={`/category/${category.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors group"
              >
                <span className="text-sm font-medium">View All</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.tools.map((tool) => (
                <Link
                  key={tool.path}
                  to={tool.path}
                  className={`${tool.color} p-6 rounded-lg transition-all duration-300 hover:scale-105`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <tool.icon className="h-8 w-8 text-white drop-shadow-lg" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-2">
                        {tool.name}
                      </h3>
                      <p className="text-sm text-slate-300">
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

      {/* Search CTA */}
      <div className="mt-16 glow-card rounded-lg p-8 text-center">
        <Search className="h-12 w-12 text-blue-400 mx-auto mb-4 drop-shadow-lg" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Looking for a specific tool?
        </h3>
        <p className="text-slate-300">
          Use the search bar at the top to quickly find any calculator or converter you need.
        </p>
      </div>
    </div>
  );
};

export default Homepage;