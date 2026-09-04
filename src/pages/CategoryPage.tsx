import React, { useState, useMemo } from 'react';
import { FileItem, SortOption } from '../types';
import { storageService } from '../services/storageService';
import { CATEGORIES } from '../data/categories';
import { FileCard } from '../components/FileCard';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { AdPlaceholder } from '../components/AdPlaceholder';
import {
  Search,
  Gamepad2,
  AppWindow,
  FileCode,
  FileText,
  Film,
  Music,
  FolderArchive,
  ArrowLeft,
  X,
} from 'lucide-react';

interface CategoryPageProps {
  categorySlug: string;
  onNavigate: (path: string) => void;
  onQuickDownload: (file: FileItem) => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  categorySlug,
  onNavigate,
  onQuickDownload,
}) => {
  const category = CATEGORIES.find((c) => c.slug === categorySlug) || CATEGORIES[0];
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [selectedType, setSelectedType] = useState<string>('all');

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

  const { files, total } = useMemo(() => {
    const res = storageService.getAllFiles({
      category: category.id,
      query: searchQuery,
      sort: sortOption,
      publishedOnly: true,
    });

    let list = res.files;
    if (selectedType !== 'all') {
      list = list.filter((f) => f.fileType.toLowerCase() === selectedType.toLowerCase());
    }

    return { files: list, total: list.length };
  }, [category.id, searchQuery, sortOption, selectedType]);

  const availableTypes = ['all', 'ZIP', 'EXE', 'DMG', 'PDF', 'MP4', 'TAR.GZ'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Categories', onClick: () => onNavigate('/categories') },
          { label: category.name },
        ]}
      />

      {/* Category Hero Banner (Bento Header) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            {getCategoryIcon(category.iconName)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {category.name}
              </h1>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
                {total} {total === 1 ? 'file' : 'files'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-xl leading-relaxed">
              {category.description}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('/categories')}
          className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 bg-slate-100 border border-slate-200/70 hover:bg-slate-200 px-4 py-2.5 rounded-full transition-colors shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Categories</span>
        </button>
      </div>

      {/* Filter and Search Bar (Bento Control Card) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="category-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search within ${category.name}...`}
            className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-slate-100/70 hover:bg-slate-100 focus:bg-white text-slate-900 rounded-full border border-transparent focus:border-slate-300 focus:outline-hidden transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Format Filter */}
          <select
            id="category-type-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-100/70 border border-slate-200/80 rounded-full text-slate-800 focus:outline-hidden cursor-pointer uppercase"
          >
            <option value="all">All Formats</option>
            {availableTypes.filter((t) => t !== 'all').map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Sort Selection */}
          <select
            id="category-sort-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-100/70 border border-slate-200/80 rounded-full text-slate-800 focus:outline-hidden cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="size-desc">Largest Size</option>
            <option value="size-asc">Smallest Size</option>
          </select>
        </div>
      </div>

      {/* Files Grid */}
      {files.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onNavigate={onNavigate}
              onQuickDownload={onQuickDownload}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-md mx-auto shadow-xs">
          <p className="text-sm font-bold text-slate-800">
            No files found in {category.name}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query or clear the format filter.
          </p>
        </div>
      )}

      {/* Dedicated Ad Slot for Category Pages */}
      <AdPlaceholder location="category" format="banner" />
    </div>
  );
};
