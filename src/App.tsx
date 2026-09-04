import React, { useState, useEffect } from 'react';
import { ToastProvider, useToast } from './context/ToastContext';
import { storageService } from './services/storageService';
import { FileItem } from './types';
import { Navbar } from './components/Navbar';
import { Drawer } from './components/Drawer';
import { Footer } from './components/Footer';
import { BackToTop } from './components/BackToTop';

import { HomePage } from './pages/HomePage';
import { FilesPage } from './pages/FilesPage';
import { CategoryPage } from './pages/CategoryPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { FileDetailPage } from './pages/FileDetailPage';
import { DownloadPage } from './pages/DownloadPage';
import { AdminPage } from './pages/AdminPage';
import {
  AboutPage,
  ContactPage,
  PrivacyPage,
  TermsPage,
  NotFoundPage,
} from './pages/StaticPages';

function AppContent() {
  const { showToast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Helper to parse current path from window.location (hash or pathname)
  const getInitialPath = (): string => {
    if (window.location.hash) {
      return window.location.hash.replace(/^#/, '') || '/';
    }
    return window.location.pathname || '/';
  };

  const [currentPath, setCurrentPath] = useState<string>(getInitialPath());

  useEffect(() => {
    const handleLocationChange = () => {
      const p = getInitialPath();
      setCurrentPath(p);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigate = (path: string) => {
    // Sync hash and pathname
    window.location.hash = path;
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickDownload = (file: FileItem) => {
    try {
      storageService.incrementDownload(file.id);
    } catch {
      // ignore
    }

    const catboxUrl = file.externalUrl || file.fileUrl;
    const fileName = `${file.title}.${file.fileType.toLowerCase()}`;
    const targetUrl = `https://filestora.kaflea991.workers.dev/download?url=${encodeURIComponent(catboxUrl)}&name=${encodeURIComponent(fileName)}`;

    // Set CPAGrip variables dynamically for target redirect and analytics tracking
    (window as any).target_url = targetUrl;
    (window as any).tracking_id = encodeURIComponent(file.title);

    // Trigger CPAGrip overlay locker
    if (typeof (window as any).call_locker === 'function') {
      (window as any).call_locker();
    } else {
      window.location.href = targetUrl;
    }
  };

  // Route Dispatcher
  const renderRoute = () => {
    // Parse query params if any
    const [pathPart, queryPart] = currentPath.split('?');
    const searchParams = new URLSearchParams(queryPart || '');
    const query = searchParams.get('q') || '';

    if (pathPart === '/' || pathPart === '') {
      return <HomePage onNavigate={navigate} onQuickDownload={handleQuickDownload} />;
    }

    if (pathPart === '/files') {
      return (
        <FilesPage
          key="all-files"
          pageTitle="All Available Files"
          pageSubtitle="Explore our verified repository of open source tools, media, and applications."
          onNavigate={navigate}
          onQuickDownload={handleQuickDownload}
        />
      );
    }

    if (pathPart === '/latest') {
      return (
        <FilesPage
          key="latest-files"
          initialSort="newest"
          pageTitle="Latest Releases"
          pageSubtitle="The newest uploads and updated software versions on FileVault."
          onNavigate={navigate}
          onQuickDownload={handleQuickDownload}
        />
      );
    }

    if (pathPart === '/popular') {
      return (
        <FilesPage
          key="popular-files"
          initialSort="popular"
          pageTitle="Popular Downloads"
          pageSubtitle="The highest downloaded packages and developer distributions."
          onNavigate={navigate}
          onQuickDownload={handleQuickDownload}
        />
      );
    }

    if (pathPart === '/search') {
      return (
        <FilesPage
          key={`search-${query}`}
          initialSearchQuery={query}
          pageTitle={query ? `Search Results: "${query}"` : 'Search Files'}
          pageSubtitle="Find files across categories, descriptions, format types, and tags."
          onNavigate={navigate}
          onQuickDownload={handleQuickDownload}
        />
      );
    }

    if (pathPart === '/categories') {
      return <CategoriesPage onNavigate={navigate} />;
    }

    // Category Single View: /category/:slug
    if (pathPart.startsWith('/category/')) {
      const slug = pathPart.replace('/category/', '');
      return (
        <CategoryPage
          key={`cat-${slug}`}
          categorySlug={slug}
          onNavigate={navigate}
          onQuickDownload={handleQuickDownload}
        />
      );
    }

    // Download dedicated view: /file/:slug/download
    if (pathPart.startsWith('/file/') && pathPart.endsWith('/download')) {
      const slug = pathPart.replace('/file/', '').replace('/download', '');
      return (
        <DownloadPage
          key={`dl-${slug}`}
          slug={slug}
          onNavigate={navigate}
          onTriggerDownload={handleQuickDownload}
        />
      );
    }

    // File Detail view: /file/:slug
    if (pathPart.startsWith('/file/')) {
      const slug = pathPart.replace('/file/', '');
      return (
        <FileDetailPage
          key={`detail-${slug}`}
          slug={slug}
          onNavigate={navigate}
          onQuickDownload={handleQuickDownload}
        />
      );
    }

    if (pathPart === '/admin') {
      return <AdminPage onNavigate={navigate} />;
    }

    if (pathPart === '/about') {
      return <AboutPage onNavigate={navigate} />;
    }

    if (pathPart === '/contact') {
      return <ContactPage onNavigate={navigate} />;
    }

    if (pathPart === '/privacy') {
      return <PrivacyPage onNavigate={navigate} />;
    }

    if (pathPart === '/terms') {
      return <TermsPage onNavigate={navigate} />;
    }

    return <NotFoundPage onNavigate={navigate} />;
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50/70 text-slate-900 font-sans antialiased selection:bg-slate-900 selection:text-white">
      <div>
        <Navbar
          currentPath={currentPath}
          onNavigate={navigate}
          onOpenDrawer={() => setDrawerOpen(true)}
        />

        <Drawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          currentPath={currentPath}
          onNavigate={navigate}
        />

        <main className="min-h-[calc(100vh-140px)]">
          {renderRoute()}
        </main>
      </div>

      <Footer onNavigate={navigate} />
      <BackToTop />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
