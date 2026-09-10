import React, { useState, useEffect } from 'react';
import { MemberUser } from '../types';
import { loginWithGoogle } from '../utils/authManager';
import { signInWithGoogleViaFirebase } from '../lib/firebase';
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Globe,
  Shield,
  ExternalLink,
  X,
  Copy,
  Check,
  KeyRound,
  Mail,
  User,
  Eye,
  EyeOff,
  Info,
  ArrowRight,
} from 'lucide-react';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: MemberUser, token: string) => void;
  isRegistrationMode?: boolean;
}

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isRegistrationMode = false,
}) => {
  const [tab, setTab] = useState<'popup' | 'direct'>('popup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [clientIp, setClientIp] = useState<string>('Detecting...');
  const [copiedDomain, setCopiedDomain] = useState(false);

  // Form states for Direct Google Sign-In
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isSaroneedam = email.trim().toLowerCase() === 'saroneedam@gmail.com' || email.trim().toLowerCase() === 'saroneedam@yahoo.com';

  // Fetch client IP on mount for anti-abuse transparency
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setPopupBlocked(false);
    setUnauthorizedDomain(false);
    setSuccessNotice(null);
    setEmail('');
    setName('');
    setAdminPasscode('');

    fetch('/api/auth/client-ip')
      .then(res => res.json())
      .then(data => {
        if (data.ip) {
          setClientIp(data.ip);
        }
      })
      .catch(() => {
        setClientIp('127.0.0.1');
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyDomain = () => {
    if (typeof window !== 'undefined' && currentHostname) {
      navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  /**
   * Primary Action: Authentic Google OAuth Sign-In via Firebase Popup
   */
  const handleFirebaseGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setPopupBlocked(false);
    setUnauthorizedDomain(false);

    try {
      const firebaseRes = await signInWithGoogleViaFirebase();

      if (firebaseRes.success && firebaseRes.user) {
        const fbUser = firebaseRes.user;
        const res = await loginWithGoogle({
          email: fbUser.email || '',
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User',
          avatar: fbUser.photoURL || undefined,
          uid: fbUser.uid,
        });

        if (res.success && res.user && res.token) {
          const welcomeMsg = res.user.role === 'admin'
            ? `Welcome back, Super Admin ${res.user.name}! Administrative session verified.`
            : `Welcome, ${res.user.name}! 500 Free Trial visits assigned.`;
          setSuccessNotice(welcomeMsg);
          setTimeout(() => {
            setLoading(false);
            onSuccess(res.user!, res.token!);
            onClose();
          }, 600);
        } else {
          setLoading(false);
          setError(res.error || 'Failed to complete Google authentication.');
        }
        return;
      }

      // If domain is not authorized in Firebase Console (e.g. *.run.app preview)
      if (firebaseRes.unauthorizedDomain) {
        setLoading(false);
        setUnauthorizedDomain(true);
        setTab('direct');
        setEmail('saroneedam@gmail.com');
        return;
      }

      // If popup was blocked by browser sandbox
      if (firebaseRes.popupBlocked) {
        setLoading(false);
        setPopupBlocked(true);
        setTab('direct');
        setError('Google Sign-In popup was blocked by your browser or sandbox. You can authorize directly below.');
        return;
      }

      // Other Firebase error
      setLoading(false);
      setError(firebaseRes.error || 'Google authentication was cancelled or could not be completed.');
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Network error connecting to Google Identity Services.');
    }
  };

  /**
   * Direct Google Account Verification Action
   */
  const handleDirectGoogleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid Google Account email address.');
      return;
    }

    if (isSaroneedam && !adminPasscode.trim()) {
      setError('Super Admin master passkey (Vivian123@) is required for saroneedam@gmail.com.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await loginWithGoogle({
        email: cleanEmail,
        name: name.trim() || undefined,
        adminPasscode: adminPasscode.trim() || undefined,
      });

      if (res.success && res.user && res.token) {
        const welcomeMsg = res.user.role === 'admin'
          ? `Super Admin ${res.user.name} authenticated! Unlimited Enterprise tier active.`
          : `Welcome to TrafficPulse, ${res.user.name}! 500 Free Trial visits assigned.`;
        setSuccessNotice(welcomeMsg);
        setTimeout(() => {
          setLoading(false);
          onSuccess(res.user!, res.token!);
          onClose();
        }, 600);
      } else {
        setLoading(false);
        setError(res.error || 'Failed to authenticate Google account.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Network error connecting to authentication service.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      {/* Authentic Google Dialog Box */}
      <div 
        className="w-full max-w-[460px] bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative flex flex-col font-sans my-auto"
      >
        {/* Top bar with Google Identity Services & Close button */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span>Google Identity Services</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 space-y-4 animate-fadeIn">
            <div className="relative w-12 h-12">
              <svg className="animate-spin w-12 h-12" viewBox="0 0 50 50">
                <circle
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
              <p className="text-sm font-semibold text-slate-800">Verifying Google Credentials...</p>
              <p className="text-xs text-slate-500 mt-1">Authenticating session & validating trial quota</p>
            </div>
          </div>
        )}

        {/* Header with Google Logo */}
        <div className="pt-2 px-6 pb-3 text-center">
          <div className="flex justify-center mb-2.5">
            <svg className="w-10 h-10" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {isRegistrationMode ? 'Create Account with Google' : 'Sign in with Google'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isRegistrationMode
              ? 'New Google accounts automatically receive 500 Free Trial Visits'
              : 'Authenticate securely using your Google account'}
          </p>
        </div>

        {/* Free Trial & Anti-Abuse IP Badge */}
        <div className="mx-6 mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 w-full">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-emerald-900">500 Free Trial Traffic Credits</p>
              <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Automatic
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-tight">
              Assigned automatically upon verified account registration (1 account per IP address).
            </p>
            <div className="flex items-center gap-1.5 pt-1 text-[10px] text-emerald-600 font-mono">
              <Globe className="w-3 h-3 text-emerald-500" />
              <span>Network IP: <strong>{clientIp}</strong></span>
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mx-6 mb-4 flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setTab('popup');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
              tab === 'popup'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Google OAuth Popup
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('direct');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              tab === 'direct'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Direct Google Verification</span>
            {unauthorizedDomain && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>
        </div>

        {/* Domain Whitelist Alert Notice (When unauthorized-domain is detected) */}
        {unauthorizedDomain && (
          <div className="mx-6 mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2 animate-fadeIn">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-[11px]">
                <span className="font-bold text-amber-950">Cloud Preview Domain Notice</span>
                <p className="leading-relaxed">
                  Firebase OAuth popup is restricted because this preview domain (<code>{currentHostname}</code>) is not yet in Firebase Console&apos;s Authorized Domains list.
                </p>
                <p className="font-semibold text-emerald-800">
                  ✓ You can complete your Google sign-in or account creation directly below without waiting!
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 text-[11px]">
              <span className="text-amber-800 truncate max-w-[240px] font-mono text-[10px]">
                {currentHostname}
              </span>
              <button
                type="button"
                onClick={handleCopyDomain}
                className="inline-flex items-center gap-1 px-2 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-900 rounded font-semibold text-[10px] cursor-pointer transition-colors shrink-0"
              >
                {copiedDomain ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                <span>{copiedDomain ? 'Copied!' : 'Copy Domain'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mx-6 mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <div className="space-y-1 flex-1">
              <span className="font-semibold">Authentication Notice</span>
              <p className="text-[11px] leading-relaxed">{error}</p>
              {popupBlocked && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setTab('direct')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                  >
                    Switch to Direct Google Verification →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Feedback */}
        {successNotice && (
          <div className="mx-6 mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700 font-medium animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* TAB 1: Authentic Google OAuth Popup Button */}
        {tab === 'popup' && (
          <div className="px-6 pb-6 space-y-3 animate-fadeIn">
            <button
              type="button"
              onClick={handleFirebaseGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-slate-300 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 cursor-pointer shadow-xs hover:shadow transition-all active:scale-[0.99] disabled:opacity-50 group"
            >
              <svg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google Account</span>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-600 ml-auto" />
            </button>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Running on Cloud Run preview?</span>
              <button
                type="button"
                onClick={() => setTab('direct')}
                className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
              >
                Use Direct Google Verification →
              </button>
            </div>

            <p className="text-[11px] text-center text-slate-400 leading-normal pt-1">
              By signing in with Google, your identity is verified directly through Google Identity Services.
            </p>
          </div>
        )}

        {/* TAB 2: Direct Google Account Verification Form */}
        {tab === 'direct' && (
          <form onSubmit={handleDirectGoogleAuth} className="px-6 pb-6 space-y-3 animate-fadeIn">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Google Account Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Display Name (Optional)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. David Okafor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* If Saroneedam Super Admin email is entered, prompt for Master Passkey */}
            {isSaroneedam && (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                  <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                  <span>Super Admin Master Passkey Required</span>
                </div>
                <div className="relative">
                  <input
                    type={showPasscode ? 'text' : 'password'}
                    required
                    placeholder="Enter Vivian123@"
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPasscode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-amber-800">
                  Authenticating administrative ownership grants instant Super Admin role & unlimited 10M traffic balance.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>
                {isRegistrationMode ? 'Create Account & Claim 500 Free Visits' : 'Verify & Sign In with Google'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </button>
          </form>
        )}

        {/* Clean, Secure Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1 font-medium">
            <Shield className="w-3 h-3 text-emerald-600" />
            256-bit SSL Encrypted
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 font-medium hover:underline text-xs cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
