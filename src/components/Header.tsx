// src/components/Header.tsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Calculator } from "lucide-react";
import { toolsData } from "../data/toolsData";

type ToolEntry = (typeof toolsData)[number]["tools"][number];

const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ToolEntry[]>([]);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const searchWrapperRef = useRef<HTMLDivElement | null>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    const trimmed = query.trim();
    if (trimmed.length > 2) {
      const results = toolsData.flatMap((category) =>
        category.tools.filter(
          (tool) =>
            tool.name.toLowerCase().includes(trimmed.toLowerCase()) ||
            tool.description.toLowerCase().includes(trimmed.toLowerCase())
        )
      );
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleToolClick = (path: string) => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    navigate(path);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchResults.length > 0) {
      e.preventDefault();
      handleToolClick(searchResults[0].path);
    }
    if (e.key === "Escape") {
      setShowResults(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    if (showResults) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showResults]);

  return (
    <header className="bg-slate-900/80 backdrop-blur-lg shadow-2xl border-b border-blue-500/20 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Calculator className="h-8 w-8 text-blue-400 drop-shadow-lg" />
            <span className="text-2xl font-bold text-white drop-shadow-lg">
              CalculatorHub
            </span>
          </Link>

          {/* Search */}
          <div
            className="relative max-w-md w-full mx-2 sm:mx-4"
            ref={searchWrapperRef}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search calculators, converters, and tools..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (searchQuery.trim().length > 2 && searchResults.length > 0) {
                    setShowResults(true);
                  }
                }}
                className="w-full pl-10 pr-4 py-2 glow-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400 text-sm sm:text-base"
              />
            </div>

            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto glow-card rounded-lg border border-slate-700/70 bg-slate-900/95">
                {searchResults.length > 0 ? (
                  searchResults.map((tool) => (
                    <button
                      key={tool.path}
                      onClick={() => handleToolClick(tool.path)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-700/60 border-b border-slate-700/40 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <tool.icon className="h-5 w-5 text-blue-400 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-white text-sm sm:text-base">
                            {tool.name}
                          </div>
                          <div className="text-xs sm:text-sm text-slate-300 line-clamp-2">
                            {tool.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-300">
                    No tools found for{" "}
                    <span className="font-semibold text-blue-300">
                      “{searchQuery.trim()}”
                    </span>
                    . Try a different keyword.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
