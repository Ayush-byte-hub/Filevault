import React, { useState, useMemo, useEffect } from 'react';
import { FileItem, CategoryId, SortOption } from '../types';
import { storageService } from '../services/storageService';
import { FileCard } from '../components/FileCard';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { AdPlaceholder } from '../components/AdPlaceholder';
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  Sparkles,
  Flame,
  LayoutGrid,
  List,
  FolderOpen,
} from 'lucide-react';

interface FilesPageProps {
  initialSearchQuery?: string;
  initialSort?: SortOption;
  initialCategory?: CategoryId | 'all';
  pageTitle?: string;
  pageSubtitle?: string;
  onNavigate: (path: string) => void;
  onQuickDownload: (file: FileItem) => void;
}

export const FilesPage: React.FC<FilesPageProps> = ({
  initialSearchQuery = '',
  initialSort = 'newest',
  initialCategory = 'all',
  pageTitle = 'All Files',
  pageSubtitle = 'Browse the complete collection of verified downloads and distributions.',
  onNavigate,
  onQuickDownload,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>(initialCategory);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>(initialSort);
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const categories = storageService.getCategoriesWithCounts();

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategory, selectedType, sortOption]);

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  useEffect(() => {
    setSortOption(initialSort);
  }, [initialSort]);

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  const { files: filteredFiles, total } = useMemo(() => {
    let result = storageService.getAllFiles({
      query: searchQuery,
      category: selectedCategory,
      sort: sortOption,
      publishedOnly: true,
    });

    let list = result.files;

    if (selectedType !== 'all') {
      list = list.filter((f) => f.fileType.toLowerCase() === selectedType.toLowerCase());
    }

    const totalCount = list.length;
    const paginated = list.slice(0, page * pageSize);

    return { files: paginated, total: totalCount };
  }, [searchQuery, selectedCategory, selectedType, sortOption, page]);

  const hasMore = filteredFiles.length < total;

  const availableTypes = ['all', 'ZIP', 'EXE', 'DMG', 'PDF', 'MP4', 'TAR.GZ'];

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedType('all');
    setSortOption('newest');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedType !== 'all' ||
    sortOption !== 'newest';

  /**
   * CPAGrip URL Locker Monetization Download Handler for File List
   * Requirements:
   * 1. Base CPAGrip Locker URL: "https://quartzfiles.com/1912012"
   * 2. Cloudflare Worker Endpoint: "https://filestora.kaflea991.workers.dev/download"
   */
  const handleDownloadClick = (file: FileItem) => {
    try {
      storageService.incrementDownload(file.id);
    } catch {
      // ignore
    }

    const catboxUrl = file.externalUrl || file.fileUrl;
    const fileName = `${file.title}.${file.fileType.toLowerCase()}`;
    const workerTargetUrl = `https://filestora.kaflea991.workers.dev/download?url=${encodeURIComponent(catboxUrl)}&name=${encodeURIComponent(fileName)}`;
    const monetizedUrl = `https://quartzfiles.com/1912012&tracking_id=${encodeURIComponent(fileName)}&target=${encodeURIComponent(workerTargetUrl)}`;

    if (onQuickDownload) {
      try {
        onQuickDownload(file);
      } catch {
        // ignore
      }
    }

    window.location.href = monetizedUrl;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: pageTitle }]} />

      {/* Header */}
      <div className="border-b border-slate-200/80 pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {pageTitle}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
          {pageSubtitle}
        </p>
      </div>

      {/* Controls Bar: Search & Filters (Bento Control Card) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="files-search-filter"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by file name, description, tags..."
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

          {/* Category Dropdown */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              id="files-category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as CategoryId | 'all')}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-100/70 border border-slate-200/80 rounded-full text-slate-800 focus:outline-hidden focus:border-slate-400 cursor-pointer"
            >
              <option value="all">All Categories ({categories.reduce((acc, c) => acc + (c.count || 0), 0)})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.count || 0})
                </option>
              ))}
            </select>

            {/* Type Dropdown */}
            <select
              id="files-type-filter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-100/70 border border-slate-200/80 rounded-full text-slate-800 focus:outline-hidden focus:border-slate-400 cursor-pointer uppercase"
            >
              <option value="all">All File Types</option>
              {availableTypes.filter((t) => t !== 'all').map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              id="files-sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-100/70 border border-slate-200/80 rounded-full text-slate-800 focus:outline-hidden focus:border-slate-400 cursor-pointer"
            >
              <option value="newest">Newest Uploads</option>
              <option value="popular">Most Downloaded</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="size-desc">Size (Largest first)</option>
              <option value="size-asc">Size (Smallest first)</option>
            </select>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2.5 border-t border-slate-100">
          <p>
            Showing <strong className="text-slate-900">{filteredFiles.length}</strong> of{' '}
            <strong className="text-slate-900">{total}</strong> matching files
          </p>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-slate-500 hover:text-slate-900 underline flex items-center gap-1 transition-colors font-medium"
            >
              <X className="w-3 h-3" />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Files Grid */}
      {filteredFiles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onNavigate={onNavigate}
              onQuickDownload={handleDownloadClick}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            No files found
          </h3>
          <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">
            We couldn’t find any files matching your current search query or filter selections.
          </p>
          <button
            onClick={clearFilters}
            className="text-xs font-bold px-5 py-2.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Load More / Pagination */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            id="load-more-files-btn"
            onClick={() => setPage((p) => p + 1)}
            className="px-6 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs sm:text-sm font-bold text-slate-800 rounded-full transition-all shadow-xs"
          >
            Load More Files ({total - filteredFiles.length} remaining)
          </button>
        </div>
      )}

      {/* Dedicated Ad Slot */}
      <AdPlaceholder location="homepage" format="rectangle" />
    </div>
  );
};
