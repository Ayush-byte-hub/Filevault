import React from 'react';
import { HardDriveDownload, ShieldCheck, Cloud, Heart, Lock } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full pt-16 pb-12 mt-16 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bento Footer Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-xs mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand & Mission */}
            <div className="md:col-span-2 space-y-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <HardDriveDownload className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-900 text-lg tracking-tight">FileVault</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed">
                A clean, modern, and minimal file-hosting and download platform.
                All hosted distributions are verified, ad-clutter free, and ready for Cloudflare R2 object storage integration.
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 flex-wrap">
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified SHA-256 Hashes
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <Cloud className="w-3.5 h-3.5 text-blue-500" /> Edge CDN Cached
                </span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Explore
              </h4>
              <ul className="space-y-2 text-xs font-medium">
                <li>
                  <button
                    onClick={() => onNavigate('/')}
                    className="text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('/files')}
                    className="text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    All Files
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('/categories')}
                    className="text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    Categories
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('/latest')}
                    className="text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    Latest Uploads
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('/popular')}
                    className="text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    Popular Downloads
                  </button>
                </li>
              </ul>
            </div>

            {/* Platform & Management */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Platform & Legal
              </h4>
              <ul className="space-y-2 text-xs font-medium">
                <li>
                  <button
                    onClick={() => onNavigate('/admin')}
                    className="text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5"
                  >
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Admin Console (Restricted)</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('/about')}
                    className="text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    About FileVault
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('/contact')}
                    className="text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    Contact & Support
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('/privacy')}
                    className="text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('/terms')}
                    className="text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="px-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} FileVault Platform. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered for high performance, accessibility, and clean distribution.
          </p>
        </div>
      </div>
    </footer>
  );
};
