import React, { useState } from 'react';
import { adminAuthService } from '../services/adminAuthService';
import { useToast } from '../context/ToastContext';
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface AdminGateProps {
  onSuccess: () => void;
  onNavigateHome: () => void;
}

export const AdminGate: React.FC<AdminGateProps> = ({ onSuccess, onNavigateHome }) => {
  const { showToast } = useToast();
  const [passcode, setPasscode] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const result = adminAuthService.login(passcode, remember);
    setIsSubmitting(false);

    if (result.success) {
      showToast('Admin Authorized', 'Welcome to the management console.', 'success');
      onSuccess();
    } else {
      setErrorMsg(result.message);
      showToast('Access Denied', result.message, 'error');
    }
  };

  const fillDefault = () => {
    setPasscode(adminAuthService.getDefaultPasscode());
    setErrorMsg('');
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 p-7 sm:p-9 shadow-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-3 py-1 rounded-full uppercase tracking-wider">
            Restricted Console
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-3">
            Admin Verification
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            This area is restricted to authorized maintainers to manage files, Cloudflare R2 links, and releases.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-passcode-input"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Admin Passcode
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="admin-passcode-input"
                type={showPassword ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Enter passcode..."
                autoFocus
                className={`w-full pl-10 pr-10 py-3 text-xs sm:text-sm bg-slate-50 rounded-2xl border ${
                  errorMsg
                    ? 'border-red-300 focus:border-red-500 bg-red-50/30'
                    : 'border-slate-200 focus:border-slate-900 focus:bg-white'
                } focus:outline-hidden transition-all`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errorMsg && (
              <p className="text-[11px] text-red-600 mt-1.5 font-medium">{errorMsg}</p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 text-slate-900 rounded-md border-slate-300 focus:ring-0 cursor-pointer"
              />
              <span>Remember session</span>
            </label>

            <button
              type="button"
              onClick={fillDefault}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full transition-colors"
            >
              Default: {adminAuthService.getDefaultPasscode()}
            </button>
          </div>

          <button
            id="admin-unlock-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-full transition-all shadow-xs flex items-center justify-center gap-2 mt-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Unlock Console</span>
          </button>
        </form>

        {/* Back Link */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Catalog</span>
          </button>
        </div>
      </div>
    </div>
  );
};
