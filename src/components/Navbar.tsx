import React, { useState, useEffect } from 'react';
import { adminAuthService } from '../services/adminAuthService';
import {
  Menu,
  Search,
  X,
  LayoutDashboard,
  HardDriveDownload,
  FolderOpen,
  Flame,
  Lock,
  ShieldCheck,
} from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenDrawer: () => void;
  initialSearchQuery?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  onNavigate,
  onOpenDrawer,
  initialSearchQuery = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => adminAuthService.isAuthenticated());

  useEffect(() => {
    const handler = () => setIsAdmin(adminAuthService.isAuthenticated());
    window.addEventListener('fv_admin_auth_changed', handler);
    return () => window.removeEventListener('fv_admin_auth_changed', handler);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
    } else {
      onNavigate('/files');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Left: Hamburger & Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            id="nav-hamburger-btn"
            onClick={onOpenDrawer}
            className="p-2 -ml-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            id="nav-brand-logo"
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs group-hover:bg-slate-800 transition-colors">
              <HardDriveDownload className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 leading-none group-hover:text-blue-600 transition-colors">
                FileVault
              </span>
              <span className="hidden sm:inline text-[9px] text-slate-400 font-semibold tracking-wider uppercase">
                Verified Storage
              </span>
            </div>
          </button>
        </div>

        {/* Center: Desktop Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <form onSubmit={handleSearchSubmit} className="w-full relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="navbar-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files, games, apps, tools..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-full border border-slate-200/60 focus:border-slate-400 focus:outline-hidden transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>

        {/* Right: Quick Links & Mobile Search Toggle */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile Search Icon Toggle */}
          <button
            id="nav-mobile-search-toggle"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle search"
          >
            <Search className="w-4 h-4" />
          </button>

          <nav className="hidden lg:flex items-center gap-1">
            <button
              id="nav-link-files"
              onClick={() => onNavigate('/files')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                currentPath === '/files'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              All Files
            </button>
            <button
              id="nav-link-categories"
              onClick={() => onNavigate('/categories')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                currentPath === '/categories'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Categories
            </button>
            <button
              id="nav-link-popular"
              onClick={() => onNavigate('/popular')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                currentPath === '/popular'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Popular
            </button>
          </nav>

          {/* Admin Restricted Entrypoint */}
          {isAdmin ? (
            <button
              id="nav-admin-btn"
              onClick={() => onNavigate('/admin')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                currentPath === '/admin'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
              title="Authorized Admin Workspace"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          ) : (
            <button
              id="nav-admin-btn"
              onClick={() => onNavigate('/admin')}
              className={`p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ${
                currentPath === '/admin' ? 'bg-slate-100 text-slate-900' : ''
              }`}
              title="Admin Console (Restricted)"
              aria-label="Admin Console"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Collapsible Search Dropdown */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-slate-100 bg-white">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="mobile-search-input"
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files, games, apps..."
              className="w-full pl-9 pr-9 py-2 text-xs bg-slate-100 text-slate-900 rounded-full border border-slate-200 focus:outline-hidden focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>
      )}
    </header>
  );
};
