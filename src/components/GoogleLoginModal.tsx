import React, { useState } from 'react';
import { MemberUser } from '../types';
import { loginWithGoogle } from '../utils/authManager';
import { User, ShieldCheck, CheckCircle2, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: MemberUser, token: string) => void;
}

interface DemoAccount {
  name: string;
  email: string;
  badge: string;
  badgeColor: string;
  avatarBg: string;
  initial: string;
  isAdmin?: boolean;
}

const PRESET_GOOGLE_ACCOUNTS: DemoAccount[] = [
  {
    name: 'Saroneedam Admin',
    email: 'saroneedam@yahoo.com',
    badge: 'Super Admin • Unlimited Access',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    avatarBg: 'bg-blue-600',
    initial: 'S',
    isAdmin: true,
  },
  {
    name: 'Alex Mercer',
    email: 'alex@trafficpulse.io',
    badge: '500 Free Trial Traffic Credits',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    avatarBg: 'bg-emerald-600',
    initial: 'A',
  },
  {
    name: 'David Okafor',
    email: 'david@techlaunch.ng',
    badge: '500 Free Trial Traffic Credits',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    avatarBg: 'bg-amber-600',
    initial: 'D',
  },
];

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [selectedAccount, setSelectedAccount] = useState<DemoAccount | null>(null);
  const [adminPasscode, setAdminPasscode] = useState('Vivian123@');
  const [showAdminPasscode, setShowAdminPasscode] = useState(false);
  const [useCustomAccount, setUseCustomAccount] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = async (account: DemoAccount) => {
    setError(null);
    setSelectedAccount(account);

    if (account.isAdmin) {
      setShowAdminPasscode(true);
      return;
    }

    await executeGoogleLogin(account.email, account.name);
  };

  const handleAdminPasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    await executeGoogleLogin(selectedAccount.email, selectedAccount.name, adminPasscode);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = customEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter a valid Google email address.');
      return;
    }
    const cleanName = customName.trim() || cleanEmail.split('@')[0];

    const isSaroneedam = cleanEmail.includes('saroneedam');
    if (isSaroneedam && !adminPasscode) {
      setShowAdminPasscode(true);
      return;
    }

    await executeGoogleLogin(cleanEmail, cleanName, isSaroneedam ? adminPasscode : undefined);
  };

  const executeGoogleLogin = async (email: string, name: string, passcode?: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await loginWithGoogle({
        email,
        name,
        adminPasscode: passcode,
      });

      if (res.success && res.user && res.token) {
        setSuccessNotice(`Signed in as ${res.user.name}`);
        setTimeout(() => {
          setLoading(false);
          onSuccess(res.user!, res.token!);
          onClose();
        }, 600);
      } else if (res.requiresAdminPasscode) {
        setLoading(false);
        setShowAdminPasscode(true);
        setError(res.error || 'Super Admin authentication requires master passkey.');
      } else {
        setLoading(false);
        setError(res.error || 'Unable to sign in with Google account. Please try again.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Network error connecting to Google Identity Services.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Authentic Google Dialog Box */}
      <div 
        className="w-full max-w-[460px] bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative flex flex-col font-sans"
        style={{ minHeight: '520px' }}
      >
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 space-y-4 animate-fadeIn">
            {/* Google Circular Progress Spinner */}
            <div className="relative w-12 h-12">
              <svg className="animate-spin w-12 h-12" viewBox="0 0 50 50">
                <circle
                  className="path"
                  cx="25"
                  cy="25"
                  r="20"
                  fill="none"
                  stroke="#1a73e8"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="90, 150"
                  strokeDashoffset="0"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">Connecting to Google Account...</p>
              <p className="text-xs text-slate-500 mt-0.5">Configuring 500 Free Trial Traffic Credits</p>
            </div>
          </div>
        )}

        {/* Header with Google Logo */}
        <div className="pt-8 px-8 pb-4 text-center">
          <div className="flex justify-center mb-3">
            <svg className="w-10 h-10" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          </div>
          <h2 className="text-xl font-medium text-slate-900 tracking-tight">Sign in with Google</h2>
          <p className="text-xs text-slate-500 mt-1">
            Choose an account to continue to <span className="font-semibold text-slate-800">TrafficPulse Engine</span>
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mx-8 mb-2 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Feedback */}
        {successNotice && (
          <div className="mx-8 mb-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700 font-medium animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 px-6 overflow-y-auto">
          {/* Admin Passcode Screen */}
          {showAdminPasscode && selectedAccount ? (
            <form onSubmit={handleAdminPasscodeSubmit} className="py-2 space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${selectedAccount.avatarBg} text-white flex items-center justify-center font-bold text-sm shadow-sm`}>
                  {selectedAccount.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{selectedAccount.name}</p>
                  <p className="text-xs text-slate-500 truncate">{selectedAccount.email}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Enter Super Admin Passkey
                  </label>
                  <span className="text-[11px] text-blue-600 font-mono">Master Key: Vivian123@</span>
                </div>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Enter master passkey..."
                  value={adminPasscode}
                  onChange={(e) => setAdminPasscode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <p className="text-[11px] text-slate-500">
                  Super Admin role receives unlimited traffic generation quota and full member management permissions.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminPasscode(false);
                    setError(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-medium rounded-full shadow-sm hover:shadow transition-all"
                >
                  Confirm & Sign In
                </button>
              </div>
            </form>
          ) : useCustomAccount ? (
            /* Custom Account Form */
            <form onSubmit={handleCustomSubmit} className="py-2 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email or phone
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="e.g. name@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Samuel Ade"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>New accounts automatically receive <strong>500 Free Trial Traffic Credits</strong>.</span>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomAccount(false);
                    setError(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-medium rounded-full shadow-sm hover:shadow transition-all"
                >
                  Next
                </button>
              </div>
            </form>
          ) : (
            /* Account Chooser List */
            <div className="divide-y divide-slate-100">
              {PRESET_GOOGLE_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleSelectPreset(account)}
                  className="w-full py-3 px-3 flex items-center gap-3.5 hover:bg-slate-50 transition-colors rounded-xl text-left group"
                >
                  <div className={`w-10 h-10 rounded-full ${account.avatarBg} text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform`}>
                    {account.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                      {account.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{account.email}</p>
                    <span className={`inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full border ${account.badgeColor}`}>
                      {account.badge}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}

              {/* Use Another Account Button */}
              <button
                type="button"
                onClick={() => {
                  setUseCustomAccount(true);
                  setError(null);
                }}
                className="w-full py-3 px-3 flex items-center gap-3.5 hover:bg-slate-50 transition-colors rounded-xl text-left group"
              >
                <div className="w-10 h-10 rounded-full border border-slate-300 text-slate-600 flex items-center justify-center group-hover:border-blue-500 group-hover:text-blue-600 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                    Use another Google account
                  </p>
                  <p className="text-xs text-slate-500">Sign in with any other Google email</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Disclaimer & Actions */}
        <div className="p-6 pt-3 bg-slate-50/70 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
            To continue, Google will share your name, email address, and profile details with TrafficPulse. 
            Before using this app, review TrafficPulse's privacy policy and terms.
          </p>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200/60">
            <span className="cursor-pointer hover:text-slate-900">English (United States)</span>
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <span className="hover:underline cursor-pointer">Help</span>
              <span className="hover:underline cursor-pointer">Privacy</span>
              <span className="hover:underline cursor-pointer">Terms</span>
              <button
                type="button"
                onClick={onClose}
                className="ml-2 text-slate-500 hover:text-slate-800 font-medium hover:underline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
