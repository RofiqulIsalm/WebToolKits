// src/components/Header.tsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
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
      <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3.5">
        {/* On mobile: stack logo + search; on larger: row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-2.5"
          >
            <img
              src="/images/calculatorhub-logo.webp"
              alt="CalculatorHub Logo"
              className="h-8 w-8 rounded-md shadow-md flex-shrink-0"
              loading="lazy"
            />
            <span className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg leading-tight">
              CalculatorHub
            </span>
          </Link>

          {/* Search */}
          <div
            className="relative w-full sm:max-w-md sm:w-auto mt-2 sm:mt-0"
            ref={searchWrapperRef}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 h-4 w-4 sm:h-5 sm:w-5" />
              <input
                type="text"
                placeholder="Search calculators, converters, tools..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (searchQuery.trim().length > 2 && searchResults.length > 0) {
                    setShowResults(true);
                  }
                }}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 glow-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400 text-sm sm:text-base"
              />
            </div>

            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto glow-card rounded-lg border border-slate-700/70 bg-slate-900/95">
                {searchResults.length > 0 ? (
                  searchResults.map((tool) => (
                    <button
                      key={tool.path}
                      onClick={() => handleToolClick(tool.path)}
                      className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-slate-700/60 border-b border-slate-700/40 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-start gap-2.5 sm:gap-3">
                        <tool.icon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 flex-shrink-0 mt-0.5" />
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
                  <div className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-300">
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
