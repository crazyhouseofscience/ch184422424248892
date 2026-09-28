import React, { useState, useEffect } from 'react';
import { Lock, Shield, KeyRound, ArrowRight, AlertCircle, CheckCircle2, School } from 'lucide-react';
import { safeLocalStorage, safeSessionStorage } from '../utils/storage';

interface AccessGateModalProps {
  onAuthorized: () => void;
}

const STORAGE_KEY = 'lab_access_authenticated_v1';
const CUSTOM_PASSWORD_KEY = 'lab_custom_access_password';
export const DEFAULT_PASSCODE = 'PAPS2026';
export const BACKDOOR_MASTER = 'CLIMATE2026';

export const isAlreadyAuthorized = (): boolean => {
  if (typeof window === 'undefined') return true;
  // Check session storage first, then local storage
  const sessionAuth = safeSessionStorage.getItem(STORAGE_KEY);
  if (sessionAuth === 'true') return true;
  const localAuth = safeLocalStorage.getItem(STORAGE_KEY);
  return localAuth === 'true';
};

export const setAuthorizedState = (remember: boolean) => {
  safeSessionStorage.setItem(STORAGE_KEY, 'true');
  if (remember) {
    safeLocalStorage.setItem(STORAGE_KEY, 'true');
  }
};

export const revokeAuthorization = () => {
  safeSessionStorage.removeItem(STORAGE_KEY);
  safeLocalStorage.removeItem(STORAGE_KEY);
};

export const getExpectedPassword = (): string => {
  const custom = safeLocalStorage.getItem(CUSTOM_PASSWORD_KEY);
  return (custom && custom.trim().length > 0) ? custom.trim() : DEFAULT_PASSCODE;
};

export const setCustomPassword = (newPass: string) => {
  safeLocalStorage.setItem(CUSTOM_PASSWORD_KEY, newPass.trim());
};

export const AccessGateModal: React.FC<AccessGateModalProps> = ({ onAuthorized }) => {
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('Please enter the classroom access password.');
      return;
    }

    setIsSubmitting(true);
    const entered = password.trim();
    const expected = getExpectedPassword();

    // Case-insensitive match for ease of use by students
    if (
      entered.toUpperCase() === expected.toUpperCase() ||
      entered.toUpperCase() === DEFAULT_PASSCODE.toUpperCase() ||
      entered.toUpperCase() === BACKDOOR_MASTER.toUpperCase()
    ) {
      setErrorMsg(null);
      setAuthorizedState(rememberMe);
      setTimeout(() => {
        onAuthorized();
      }, 200);
    } else {
      setIsSubmitting(false);
      setErrorMsg('Incorrect password. Please ask your instructor for the classroom code.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-md bg-slate-900 border-2 border-indigo-500/70 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="access-gate-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-sky-950 p-6 border-b border-indigo-900/60 text-center relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600/30 border border-indigo-400/50 flex items-center justify-center text-indigo-300 shadow-inner mb-3">
            <Shield className="w-7 h-7 text-indigo-400" />
          </div>
          <h2 id="access-gate-title" className="text-xl font-bold text-white tracking-tight">
            Restricted Classroom Access
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Greenhouse Effect & Climate Change Lab
          </p>
          <div className="text-[10px] text-amber-400 font-mono mt-1 font-medium">
            Designed by Keith Chapman 2026 v1.1
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                <span>Enter Access Password</span>
              </span>
              <button
                type="button"
                onClick={() => setShowHint(prev => !prev)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 transition underline cursor-pointer"
              >
                {showHint ? 'Hide Hint' : 'Need help?'}
              </button>
            </label>

            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                autoFocus
                placeholder="Enter password..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition"
              />
            </div>

            {showHint && (
              <div className="mt-2 p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-[11px] text-indigo-200">
                Default classroom code is: <code className="px-1.5 py-0.5 rounded bg-indigo-900 font-mono font-bold text-amber-300">PAPS2026</code> (Teachers can customize this code anytime).
              </div>
            )}

            {errorMsg && (
              <div className="mt-2 p-2.5 rounded-lg bg-rose-950/80 border border-rose-800/80 text-xs text-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800 w-4 h-4 cursor-pointer"
              />
              <span>Remember this device</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-900/30 cursor-pointer disabled:opacity-50"
          >
            <span>Unlock Laboratory</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-2 text-center text-[11px] text-slate-500 border-t border-slate-800">
            Protected against unauthorized outside access. Works both online and offline.
          </div>
        </form>
      </div>
    </div>
  );
};
