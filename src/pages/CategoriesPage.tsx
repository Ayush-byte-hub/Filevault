import React from 'react';
import { storageService } from '../services/storageService';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { AdPlaceholder } from '../components/AdPlaceholder';
import {
  Gamepad2,
  AppWindow,
  FileCode,
  FileText,
  Film,
  Music,
  FolderArchive,
  ArrowRight,
  Layers,
} from 'lucide-react';

interface CategoriesPageProps {
  onNavigate: (path: string) => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ onNavigate }) => {
  const categories = storageService.getCategoriesWithCounts();

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Gamepad2':
        return <Gamepad2 className="w-6 h-6" />;
      case 'LayoutGrid':
        return <AppWindow className="w-6 h-6" />;
      case 'Code2':
        return <FileCode className="w-6 h-6" />;
      case 'FileText':
        return <FileText className="w-6 h-6" />;
      case 'Film':
        return <Film className="w-6 h-6" />;
      case 'Music':
        return <Music className="w-6 h-6" />;
      default:
        return <FolderArchive className="w-6 h-6" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <Breadcrumbs items={[{ label: 'Categories' }]} />

      <div className="border-b border-slate-200/80 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
            <Layers className="w-4 h-4" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Explore Categories
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
          Browse our structured file repositories organized by discipline, file type, and application target.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => (
          <button
            key={cat.id}
            id={`category-item-${cat.slug}`}
            onClick={() => onNavigate(`/category/${cat.slug}`)}
            className="flex flex-col justify-between text-left p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors flex items-center justify-center">
                  {getCategoryIcon(cat.iconName)}
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-mono border border-slate-200/60">
                  {cat.count || 0} {cat.count === 1 ? 'file' : 'files'}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {cat.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                {cat.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-slate-900">
              <span>Browse repository</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>

      <AdPlaceholder location="category" format="rectangle" />
    </div>
  );
};
