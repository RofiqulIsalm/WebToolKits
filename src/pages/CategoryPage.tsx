import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calculator } from 'lucide-react';
import { toolsData } from '../data/toolsData';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData } from '../utils/seoData';

const CategoryPage: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  
  // Find the category based on the slug
  const category = toolsData.find(cat => cat.slug === categorySlug);

  if (!category) {
    return (
      <>
        <SEOHead
          title="Category Not Found | CalculatorHub"
          description="The category you're looking for doesn't exist. Browse our collection of free online calculators and tools."
          canonical={`https://calculatorhub.com/category/${categorySlug}`}
        />
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
      </>
    );
  }

  const categoryData = seoData.categoryPages[categorySlug as keyof typeof seoData.categoryPages];

  return (
    <>
      <SEOHead
        title={categoryData?.title || `${category.category} | CalculatorHub`}
        description={categoryData?.description || `Free ${category.category.toLowerCase()} tools and calculators`}
        canonical={`https://calculatorhub.com/category/${categorySlug}`}
        breadcrumbs={[
          { name: category.category, url: `/category/${categorySlug}` }
        ]}
      />
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs items={[
          { name: category.category, url: `/category/${categorySlug}` }
        ]} />
        
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

      {/* Category Stats */}
      <div className="glow-card rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {category.tools.length}
            </div>
            <div className="text-slate-300">Available Tools</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-400 mb-2">
              100%
            </div>
            <div className="text-slate-300">Free to Use</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-400 mb-2">
              0
            </div>
            <div className="text-slate-300">Signup Required</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              <Calculator className="h-8 w-8 mx-auto" />
            </div>
            <div className="text-slate-300">Ready to Use</div>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {category.tools.map((tool) => (
          <Link
            key={tool.path}
            to={tool.path}
            className={`${tool.color} p-6 rounded-lg transition-all duration-300 hover:scale-105 group relative`}
          >
            {tool.popular && (
              <div className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                Popular
              </div>
            )}
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

      {/* Related Categories */}
      <div className="glow-card rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Explore Other Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {toolsData
            .filter(cat => cat.slug !== category.slug)
            .map((cat) => (
              <Link
                key={cat.slug}
                to={`/category/${cat.slug}`}
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
            ))}
        </div>
      </div>
      </div>
    </>
  );
};

export default CategoryPage;