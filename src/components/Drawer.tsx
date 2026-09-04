import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { adminAuthService } from '../services/adminAuthService';
import {
  X,
  Home,
  Files,
  Layers,
  Sparkles,
  Flame,
  Info,
  Mail,
  Shield,
  FileCheck,
  LayoutDashboard,
  ExternalLink,
  Lock,
} from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  currentPath,
  onNavigate,
}) => {
  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'All Files', path: '/files', icon: Files },
    { label: 'Categories', path: '/categories', icon: Layers },
    { label: 'Latest Files', path: '/latest', icon: Sparkles },
    { label: 'Popular Files', path: '/popular', icon: Flame },
  ];

  const secondaryItems = [
    { label: 'About', path: '/about', icon: Info },
    { label: 'Contact', path: '/contact', icon: Mail },
    { label: 'Privacy Policy', path: '/privacy', icon: Shield },
    { label: 'Terms of Service', path: '/terms', icon: FileCheck },
  ];

  const handleItemClick = (path: string) => {
    onNavigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Drawer Body */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-r border-slate-200"
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tighter shadow-xs">
                    FV
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-base leading-none">FileVault</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Verified File Distribution</p>
                  </div>
                </div>

                <button
                  id="drawer-close-btn"
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Navigation */}
              <div className="p-4 space-y-1">
                <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Browse & Explore
                </p>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.path;
                  return (
                    <button
                      key={item.path}
                      id={`drawer-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => handleItemClick(item.path)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Site Info & Policies */}
              <div className="p-4 border-t border-slate-100 space-y-1">
                <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Platform & Legal
                </p>
                {secondaryItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.path;
                  return (
                    <button
                      key={item.path}
                      id={`drawer-sec-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => handleItemClick(item.path)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-slate-100 text-slate-900 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer / Admin Quick Link */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <button
                id="drawer-admin-link"
                onClick={() => handleItemClick('/admin')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold border transition-all ${
                  currentPath === '/admin'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Admin Console</span>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-medium">
                  {adminAuthService.isAuthenticated() ? 'Active' : 'Restricted'}
                </span>
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-3 font-medium">
                Cloudflare R2 Direct • Fast Delivery
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
