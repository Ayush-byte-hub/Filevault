import React, { useState } from 'react';
import { FileItem } from '../types';
import { storageService } from '../services/storageService';
import { FileCard } from '../components/FileCard';
import { AdPlaceholder } from '../components/AdPlaceholder';
import { SmartImage } from '../components/SmartImage';
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  HardDriveDownload,
  Sparkles,
  Flame,
  Layers,
  Gamepad2,
  AppWindow,
  FileCode,
  FileText,
  Film,
  Music,
  FolderArchive,
  History,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onQuickDownload: (file: FileItem) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onQuickDownload }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const featuredFiles = storageService.getFeaturedFiles(4);
  const latestFiles = storageService.getLatestFiles(6);
  const popularFiles = storageService.getPopularFiles(6);
  const categories = storageService.getCategoriesWithCounts();
  const recentlyViewed = storageService.getRecentlyViewedFiles();

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      onNavigate('/files');
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Gamepad2':
        return <Gamepad2 className="w-5 h-5" />;
      case 'LayoutGrid':
        return <AppWindow className="w-5 h-5" />;
      case 'Code2':
        return <FileCode className="w-5 h-5" />;
      case 'FileText':
        return <FileText className="w-5 h-5" />;
      case 'Film':
        return <Film className="w-5 h-5" />;
      case 'Music':
        return <Music className="w-5 h-5" />;
      default:
        return <FolderArchive className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Hero Bento Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Main Hero Bento Card */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
            <div>
              {/* Verification badge */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-6 border border-slate-200/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified distributions with direct SHA-256 integrity</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.15] mb-4">
                Discover & download <br className="hidden sm:inline" />
                <span className="text-slate-900 underline decoration-slate-300 underline-offset-8">
                  verified files
                </span>{' '}
                with zero clutter.
              </h1>

              {/* Short description */}
              <p className="text-sm sm:text-base text-slate-600 max-w-xl mb-8 leading-relaxed">
                Access curated open-source tools, games, applications, and documents.
                Fast downloads powered by edge storage with no deceptive ads or forced redirects.
              </p>
            </div>

            <div>
              {/* Prominent Search Bar */}
              <form onSubmit={handleHeroSearch} className="relative w-full max-w-xl mb-5">
                <div className="relative flex items-center shadow-xs rounded-2xl bg-slate-50/80 border border-slate-200/90 focus-within:bg-white focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/5 transition-all">
                  <Search className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
                  <input
                    id="hero-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search files, games, apps, documents, tools..."
                    className="w-full py-3.5 sm:py-4 pl-3 pr-28 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-hidden"
                  />
                  <button
                    id="hero-search-submit"
                    type="submit"
                    className="absolute right-2 px-4 py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-xs"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Popular category buttons */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                <span className="font-semibold text-slate-400 mr-1">Popular:</span>
                {categories.slice(0, 5).map((cat) => (
                  <button
                    key={cat.id}
                    id={`hero-category-${cat.slug}`}
                    onClick={() => onNavigate(`/category/${cat.slug}`)}
                    className="px-3 py-1 rounded-full bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 font-medium border border-slate-200/60 transition-colors"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bento Companion Column */}
          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6">
            {/* Bento Card 1: Checksum verification */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    Live Verified
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">
                  SHA-256 Checksum Auditing
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Every release is cryptographically signed and independently hashed to ensure untampered binaries.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Zero Adware Guarantee</span>
                <span className="font-semibold text-slate-700">100% Clean</span>
              </div>
            </div>

            {/* Bento Card 2: Edge CDN Performance */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                    Edge CDN
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">
                  High-Speed Direct Delivery
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Hosted with Cloudflare R2 object storage for global low-latency transfer rates and zero throttling.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Downloads</span>
                <span className="font-semibold text-slate-700">180K+ Served</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Trust & Performance Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 text-center shadow-2xs hover:border-slate-300 transition-all">
            <p className="text-xl sm:text-2xl font-bold text-slate-900">100%</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Checksum Verified</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 text-center shadow-2xs hover:border-slate-300 transition-all">
            <p className="text-xl sm:text-2xl font-bold text-slate-900">180K+</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Direct Downloads</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 text-center shadow-2xs hover:border-slate-300 transition-all">
            <p className="text-xl sm:text-2xl font-bold text-slate-900">0%</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Bundled Adware</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 text-center shadow-2xs hover:border-slate-300 transition-all">
            <p className="text-xl sm:text-2xl font-bold text-slate-900">R2 / CDN</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">High Speed Edge</p>
          </div>
        </div>
      </section>

      {/* Featured Files Section */}
      {featuredFiles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-none">
                  Featured Files
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Hand-picked standout releases and popular packages
                </p>
              </div>
            </div>

            <button
              id="view-all-featured"
              onClick={() => onNavigate('/files')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 group"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {featuredFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onNavigate={onNavigate}
                onQuickDownload={onQuickDownload}
              />
            ))}
          </div>
        </section>
      )}

      {/* Ad slot location 1: Homepage Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdPlaceholder location="homepage" format="banner" />
      </div>

      {/* Browse by Category Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-none">
                Browse Categories
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Explore curated repositories organized by medium and format
              </p>
            </div>
          </div>

          <button
            id="view-all-categories"
            onClick={() => onNavigate('/categories')}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 group"
          >
            <span>All Categories</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              id={`cat-card-${cat.slug}`}
              onClick={() => onNavigate(`/category/${cat.slug}`)}
              className="flex flex-col items-center text-center p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors flex items-center justify-center mb-3 shadow-2xs">
                {getCategoryIcon(cat.iconName)}
              </div>
              <span className="font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                {cat.name}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                {cat.count || 0} {cat.count === 1 ? 'file' : 'files'}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Latest Files Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-none">
                Latest Files
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Recently published releases, versions, and uploads
              </p>
            </div>
          </div>

          <button
            id="view-all-latest"
            onClick={() => onNavigate('/latest')}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 group"
          >
            <span>View More</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {latestFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onNavigate={onNavigate}
              onQuickDownload={onQuickDownload}
            />
          ))}
        </div>
      </section>

      {/* Popular Files Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-none">
                Popular Files
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Most downloaded tools, packages, and distributions
              </p>
            </div>
          </div>

          <button
            id="view-all-popular"
            onClick={() => onNavigate('/popular')}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 group"
          >
            <span>See Ranking</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {popularFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onNavigate={onNavigate}
              onQuickDownload={onQuickDownload}
            />
          ))}
        </div>
      </section>

      {/* Recently Viewed (if available) */}
      {recentlyViewed.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Recently Viewed Files
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {recentlyViewed.slice(0, 4).map((file) => (
              <button
                key={file.id}
                onClick={() => onNavigate(`/file/${file.slug}`)}
                className="flex items-center gap-3 p-3.5 bg-white border border-slate-200/70 hover:border-slate-300 rounded-2xl text-left transition-all group hover:shadow-xs"
              >
                <SmartImage
                  src={file.thumbnailUrl}
                  alt={file.title}
                  className="w-11 h-11 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200/50"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {file.title}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {file.fileSize} • {file.fileType}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
