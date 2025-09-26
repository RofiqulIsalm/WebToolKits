import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Calculator } from 'lucide-react';
import { toolsData } from '../data/toolsData';

const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof toolsData[0]['tools']>([]);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      const results = toolsData.flatMap(category => 
        category.tools.filter(tool => 
          tool.name.toLowerCase().includes(query.toLowerCase()) ||
          tool.description.toLowerCase().includes(query.toLowerCase())
        )
      );
      setSearchResults(results);
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  const handleToolClick = (path: string) => {
    setSearchQuery('');
    setShowResults(false);
    navigate(path);
  };

  return (
    <header className="bg-slate-900/80 backdrop-blur-lg shadow-2xl border-b border-blue-500/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Calculator className="h-8 w-8 text-blue-400 drop-shadow-lg" />
            <h1 className="text-2xl font-bold text-white drop-shadow-lg">CalculatorHub</h1>
          </Link>
          
          <div className="relative max-w-md w-full mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 glow-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
              />
            </div>
            
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 glow-card rounded-lg mt-1 z-50 max-h-80 overflow-y-auto">
                {searchResults.map((tool) => (
                  <button
                    key={tool.path}
                    onClick={() => handleToolClick(tool.path)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-700/50 border-b border-slate-600/30 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <tool.icon className="h-5 w-5 text-blue-400" />
                      <div>
                        <div className="font-medium text-white">{tool.name}</div>
                        <div className="text-sm text-slate-300">{tool.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;