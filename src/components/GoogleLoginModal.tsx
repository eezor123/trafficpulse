import React, { useState, useEffect } from 'react';
import { MemberUser } from '../types';
import { loginWithGoogle } from '../utils/authManager';
import { signInWithGoogleViaFirebase } from '../lib/firebase';
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Shield,
  X,
  Copy,
  Check,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ExternalLink,
  Lock,
} from 'lucide-react';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: MemberUser, token: string) => void;
  isRegistrationMode?: boolean;
  onSwitchToEmail?: () => void;
}

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isRegistrationMode = false,
  onSwitchToEmail,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  // Super admin passkey fallback
  const [showAdminPasskeySection, setShowAdminPasskeySection] = useState(false);
  const [adminEmail, setAdminEmail] = useState('saroneedam@gmail.com');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setPopupBlocked(false);
    setUnauthorizedDomain(false);
    setSuccessNotice(null);
    setShowAdminPasskeySection(false);
    setAdminPasscode('');
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
   * Primary Action: Authentic Google OAuth Sign-In via Firebase / Google Identity Services
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
        if (!fbUser.email) {
          setLoading(false);
          setError('Google authentication succeeded, but no email address was returned by Google.');
          return;
        }

        const res = await loginWithGoogle({
          email: fbUser.email,
          name: fbUser.displayName || fbUser.email.split('@')[0] || 'Google User',
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
          setError(res.error || 'Failed to complete Google authentication with server.');
        }
        return;
      }

      // Handle domain not authorized in Firebase Console
      if (firebaseRes.unauthorizedDomain) {
        setLoading(false);
        setUnauthorizedDomain(true);
        setError(`This preview domain (${currentHostname}) is not yet whitelisted in Firebase Console Authorized Domains.`);
        return;
      }

      // Handle popup blocked by browser
      if (firebaseRes.popupBlocked) {
        setLoading(false);
        setPopupBlocked(true);
        setError('Google Sign-In popup was blocked by your browser. Please allow popups or click the button below to retry.');
        return;
      }

      // Cancelled by user or other error
      setLoading(false);
      setError(firebaseRes.error || 'Google authentication was closed or could not be completed.');
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Network error communicating with Google Identity Services.');
    }
  };

  /**
   * Dedicated Super Admin Passkey Sign-In
   */
  const handleAdminPasscodeAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPasscode.trim()) {
      setError('Please enter the administrative master security passkey.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await loginWithGoogle({
        email: adminEmail.trim().toLowerCase(),
        adminPasscode: adminPasscode.trim(),
      });

      if (res.success && res.user && res.token) {
        setSuccessNotice(`Super Admin ${res.user.name} authenticated! Unlimited Enterprise tier active.`);
        setTimeout(() => {
          setLoading(false);
          onSuccess(res.user!, res.token!);
          onClose();
        }, 600);
      } else {
        setLoading(false);
        setError(res.error || 'Invalid Super Admin credentials.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Failed to verify admin passkey.');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Google Brand styling */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-xs">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {isRegistrationMode ? 'Create Account with Google' : 'Sign In with Google'}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span>TrafficPulse Single Sign-On</span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  500 Free Trial Visits
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informational Banner */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-xs text-slate-600">
          <Shield className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Authentic Google OAuth authentication verified via Google Identity Services.
          </span>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <span className="font-semibold">Authentication Notice</span>
              <p className="text-[11px] leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Success Feedback */}
        {successNotice && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700 font-medium animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-6 space-y-4">
          {/* Authentic Google Sign-In Action */}
          <button
            type="button"
            onClick={handleFirebaseGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-slate-300 rounded-xl font-bold text-sm flex items-center justify-center gap-3 cursor-pointer shadow-sm hover:shadow transition-all active:scale-[0.99] disabled:opacity-50 group"
          >
            {loading ? (
              <div className="flex items-center gap-2 text-slate-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Verifying with Google...</span>
              </div>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-600 ml-auto" />
              </>
            )}
          </button>

          {/* Popup Blocked Resolution */}
          {popupBlocked && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
              <p className="font-semibold flex items-center gap-1.5 text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Pop-up Blocked by Browser
              </p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Your browser blocked the Google authentication window. Click below to re-trigger the Google sign-in window or allow pop-ups for this site in your browser address bar.
              </p>
              <button
                type="button"
                onClick={handleFirebaseGoogleSignIn}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <span>Launch Google Sign-In Window</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Unauthorized Domain Resolution */}
          {unauthorizedDomain && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Firebase Authorized Domain</span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-mono">
                  Firebase Console
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Google OAuth requires this preview domain to be listed under <strong>Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains</strong>.
              </p>
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 font-mono text-[11px] text-slate-800">
                <span className="truncate flex-1">{currentHostname}</span>
                <button
                  type="button"
                  onClick={handleCopyDomain}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-sans font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                >
                  {copiedDomain ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedDomain ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Alternate path: Email & Password */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onSwitchToEmail) onSwitchToEmail();
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors mt-2"
              >
                <span>Sign In with Email & Password Instead</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Super Admin Passkey Fallback */}
          <div className="pt-2 border-t border-slate-100">
            {!showAdminPasskeySection ? (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onSwitchToEmail) onSwitchToEmail();
                  }}
                  className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <span>Use Email & Password</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdminPasskeySection(true)}
                  className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer flex items-center gap-1"
                >
                  <Lock className="w-3 h-3" />
                  <span>Admin passkey?</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleAdminPasscodeAuth} className="space-y-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-600" />
                    Super Admin Passkey Authentication
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAdminPasskeySection(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                    Super Admin Email
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                    Master Passkey
                  </label>
                  <div className="relative">
                    <input
                      type={showPasscode ? 'text' : 'password'}
                      required
                      placeholder="Enter administrative passkey"
                      value={adminPasscode}
                      onChange={(e) => setAdminPasscode(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-2.5 pr-8 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPasscode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-slate-900 hover:bg-black text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Verify Passkey & Access HQ</span>
                </button>
              </form>
            )}
          </div>
        </div>

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
