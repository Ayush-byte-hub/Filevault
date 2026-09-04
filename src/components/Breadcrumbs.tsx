import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-500 mb-5 overflow-x-auto py-1">
      <button
        id="breadcrumb-home"
        onClick={() => items[0]?.onClick ? items[0].onClick() : window.location.assign('#/')}
        className="flex items-center gap-1 hover:text-slate-900 transition-colors shrink-0"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Home</span>
      </button>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={index} className="flex items-center gap-1 shrink-0 ml-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-md">
                {item.label}
              </span>
            ) : (
              <button
                id={`breadcrumb-item-${index}`}
                onClick={item.onClick}
                className="hover:text-slate-900 transition-colors truncate max-w-[150px]"
              >
                {item.label}
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
};
