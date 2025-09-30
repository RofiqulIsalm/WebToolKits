import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toolsData } from '../data/toolsData';
import AdBanner from '../components/AdBanner';

const CategoryPage: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  
  // Find the category based on the slug
  const category = toolsData.find(cat => 
    cat.category.toLowerCase().replace(/[^a-z0-9]/g, '-') === categorySlug
  );

  if (!category) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Category Not Found</h1>
        <p className="text-slate-300 mb-8">The category you're looking for doesn't exist.</p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-6 py-3 glow-button text-white rounded-lg transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Home</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to All Tools</span>
        </Link>
        
        <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
          {category.category}
        </h1>
        <p className="text-xl text-slate-300">
          All calculators and tools in the {category.category.toLowerCase()} category
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {category.tools.map((tool) => (
          <Link
            key={tool.path}
            to={tool.path}
            className={`${tool.color} p-6 rounded-lg transition-all duration-300 hover:scale-105 group`}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <tool.icon className="h-10 w-10 text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-100 transition-colors">
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

      {/* Category Stats */}
      <div className="glow-card rounded-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-white mb-4">Category Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {category.tools.length}
            </div>
            <div className="text-slate-300">Available Tools</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              100%
            </div>
            <div className="text-slate-300">Free to Use</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              0
            </div>
            <div className="text-slate-300">Signup Required</div>
          </div>
        </div>
      </div>

      {/* Related Categories */}
      <div className="glow-card rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Explore Other Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {toolsData
            .filter(cat => cat.category !== category.category)
            .map((cat) => {
              const categorySlug = cat.category.toLowerCase().replace(/[^a-z0-9]/g, '-');
              return (
                <Link
                  key={cat.category}
                  to={`/category/${categorySlug}`}
                  className="p-4 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white group-hover:text-blue-300 transition-colors">
                        {cat.category}
                      </h4>
                      <p className="text-sm text-slate-400">
                        {cat.tools.length} tools
                      </p>
                    </div>
                    <ArrowLeft className="h-5 w-5 text-slate-400 rotate-180 group-hover:text-blue-400 transition-colors" />
                  </div>
                </Link>
              );
            })}
        </div>
      </div>

      <AdBanner type="bottom" />
    </div>
  );
};

export default CategoryPage;