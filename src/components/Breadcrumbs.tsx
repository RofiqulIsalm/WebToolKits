import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const allItems = [{ name: 'Home', url: '/' }, ...items];

  return (
    <nav className="flex items-center space-x-2 text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
      {allItems.map((item, index) => (
        <React.Fragment key={item.url}>
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {index === 0 ? (
            <Link
              to={item.url}
              className="flex items-center space-x-1 hover:text-blue-400 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          ) : index === allItems.length - 1 ? (
            <span className="text-slate-300 font-medium" aria-current="page">
              {item.name}
            </span>
          ) : (
            <Link
              to={item.url}
              className="hover:text-blue-400 transition-colors"
            >
              {item.name}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;