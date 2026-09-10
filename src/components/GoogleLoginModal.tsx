import React, { useState, useEffect } from 'react';
import { MemberUser } from '../types';
import { loginWithGoogle } from '../utils/authManager';
import { signInWithGoogleViaFirebase } from '../lib/firebase';
import { CheckCircle2, AlertCircle, Sparkles, Globe, Shield, ExternalLink, X } from 'lucide-react';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: MemberUser, token: string) => void;
}

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [clientIp, setClientIp] = useState<string>('Detecting...');

  // Fetch client IP on mount for anti-abuse transparency
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setPopupBlocked(false);
    setSuccessNotice(null);
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

  /**
   * Primary Action: Authentic Google OAuth Sign-In via Firebase
   */
  const handleFirebaseGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setPopupBlocked(false);

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

      // If popup was blocked by browser sandbox
      if (firebaseRes.popupBlocked) {
        setLoading(false);
        setPopupBlocked(true);
        setError('Google Sign-In popup was blocked by your browser settings or iframe sandbox. Please allow popups for this site, or use Member Login with email & password.');
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* Authentic Google Dialog Box */}
      <div 
        className="w-full max-w-[440px] bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative flex flex-col font-sans"
      >
        {/* Top bar with Close button */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span>Google Identity Services</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
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
              <p className="text-sm font-semibold text-slate-800">Connecting to Google OAuth...</p>
              <p className="text-xs text-slate-500 mt-1">Verifying account credentials & security token</p>
            </div>
          </div>
        )}

        {/* Header with Google Logo */}
        <div className="pt-2 px-8 pb-4 text-center">
          <div className="flex justify-center mb-3">
            <svg className="w-10 h-10" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Sign in with Google</h2>
          <p className="text-xs text-slate-500 mt-1">
            Authenticate securely using your Google account
          </p>
        </div>

        {/* Free Trial & Anti-Abuse IP Badge */}
        <div className="mx-6 mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">500 Free Trial Traffic Credits</p>
            <p className="text-[11px] text-emerald-700 leading-tight">
              Assigned automatically upon verified account registration (1 account per IP address).
            </p>
            <div className="flex items-center gap-1.5 pt-1 text-[10px] text-emerald-600 font-mono">
              <Globe className="w-3 h-3 text-emerald-500" />
              <span>Network IP: <strong>{clientIp}</strong></span>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold">Authentication Notice</span>
              <p className="text-[11px] leading-relaxed">{error}</p>
              {popupBlocked && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors"
                  >
                    Use Email & Password Login Instead
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Feedback */}
        {successNotice && (
          <div className="mx-6 mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700 font-medium animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="px-6 pb-6 space-y-3">
          <button
            type="button"
            onClick={handleFirebaseGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-slate-300 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 cursor-pointer shadow-sm hover:shadow transition-all active:scale-[0.99] disabled:opacity-50 group"
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

          <p className="text-[11px] text-center text-slate-500 leading-normal">
            By signing in with Google, your identity is verified directly through Google Identity Services. No unverified email access is permitted.
          </p>
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
            className="text-slate-500 hover:text-slate-800 font-medium hover:underline text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
