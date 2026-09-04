import React, { useState, useEffect } from 'react';
import { adminAuthService } from '../services/adminAuthService';
import { useToast } from '../context/ToastContext';
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
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
  const [lockoutSeconds, setLockoutSeconds] = useState(() => adminAuthService.getLockoutSeconds());

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setErrorMsg('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const result = await adminAuthService.login(passcode, remember);
      setIsSubmitting(false);

      if (result.success) {
        showToast('Admin Authorized', 'Welcome to the management console.', 'success');
        onSuccess();
      } else {
        setErrorMsg(result.message);
        if (result.lockoutSeconds) {
          setLockoutSeconds(result.lockoutSeconds);
        }
        showToast('Access Denied', result.message, 'error');
      }
    } catch {
      setIsSubmitting(false);
      setErrorMsg('Authentication error. Please try again.');
    }
  };

  const isLocked = lockoutSeconds > 0;

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
            Authorized maintainers only. All access attempts are cryptographically validated.
          </p>
        </div>

        {/* Cooldown notice if locked */}
        {isLocked && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <div>
              <p className="font-bold">Rate Limit Protection Triggered</p>
              <p className="text-[11px] text-red-600 mt-0.5">
                Too many failed attempts. Console locked for{' '}
                <span className="font-mono font-bold text-red-800">{lockoutSeconds}s</span>.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-passcode-input"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Master Passcode
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="admin-passcode-input"
                type={showPassword ? 'text' : 'password'}
                disabled={isLocked || isSubmitting}
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Enter secret passcode..."
                autoFocus
                autoComplete="current-password"
                className={`w-full pl-10 pr-10 py-3 text-xs sm:text-sm bg-slate-50 rounded-2xl border ${
                  errorMsg
                    ? 'border-red-300 focus:border-red-500 bg-red-50/30'
                    : 'border-slate-200 focus:border-slate-900 focus:bg-white'
                } focus:outline-hidden transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              <button
                type="button"
                disabled={isLocked}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 disabled:opacity-40"
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
                disabled={isLocked}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 text-slate-900 rounded-md border-slate-300 focus:ring-0 cursor-pointer disabled:opacity-50"
              />
              <span>Remember session (4h)</span>
            </label>

            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
              SHA-256 Validated
            </span>
          </div>

          <button
            id="admin-unlock-btn"
            type="submit"
            disabled={isSubmitting || isLocked || !passcode.trim()}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-full transition-all shadow-xs flex items-center justify-center gap-2 mt-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isLocked ? `Locked (${lockoutSeconds}s)` : isSubmitting ? 'Verifying...' : 'Unlock Console'}</span>
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
